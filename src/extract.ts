import Anthropic from "@anthropic-ai/sdk";
import type { Conversation } from "./bee.js";
import type { AppConfig, RepoProfile } from "./repos.js";

const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5";
const KINDS = ["bug", "feature", "task", "question"] as const;
const PRIORITIES = ["high", "medium", "low"] as const;

export type TicketKind = (typeof KINDS)[number];
export type TicketPriority = (typeof PRIORITIES)[number];

export interface Ticket {
  slot: number;
  repo: string;
  kind: TicketKind;
  title: string;
  problem: string;
  acceptanceCriteria: string[];
  priority: TicketPriority;
  requestedBy: string;
  quotes: string[];
  confidence: number;
  routingConfidence: number;
  routingReason: string;
}

export interface ReviewCandidate {
  slot: number;
  reason: string;
  ticket?: Ticket;
  title: string;
}

export interface ExtractionResult {
  accepted: Ticket[];
  review: ReviewCandidate[];
}

export interface ExtractionOptions {
  aliases?: Readonly<Record<string, string>>;
  minConfidence?: number;
  routingConfidence?: number;
  developerName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function transcript(conversation: Conversation): string {
  return conversation.utterances
    .map((utterance) => `${utterance.speaker}: ${utterance.text}`)
    .join("\n");
}

function boundedString(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number,
): string {
  if (typeof value !== "string") throw new Error(`${name} must be a string.`);
  const text = value.trim();
  if (text.length < minimum || text.length > maximum) {
    throw new Error(`${name} must be ${minimum}-${maximum} characters.`);
  }
  return text;
}

function probability(value: unknown, name: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(`${name} must be a number from 0 to 1.`);
  }
  return value;
}

function stringList(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number,
  itemMaximum: number,
): string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(`${name} must contain ${minimum}-${maximum} items.`);
  }
  return value.map((item, index) =>
    boundedString(item, `${name}[${index}]`, 1, itemMaximum),
  );
}

function candidateTitle(raw: unknown, slot: number): string {
  return isRecord(raw) && typeof raw.title === "string" && raw.title.trim()
    ? raw.title.trim().slice(0, 69)
    : `Unvalidated request ${slot + 1}`;
}

function aliasMatches(
  text: string,
  aliases: Readonly<Record<string, string>>,
): string[] {
  const haystack = text.toLocaleLowerCase();
  return [
    ...new Set(
      Object.entries(aliases)
        .filter(([alias]) => haystack.includes(alias.toLocaleLowerCase()))
        .map(([, repo]) => repo.toLocaleLowerCase()),
    ),
  ];
}

function validateTicket(
  raw: unknown,
  slot: number,
  conversation: Conversation,
  repos: ReadonlySet<string>,
  aliases: Readonly<Record<string, string>>,
): Ticket {
  if (!isRecord(raw)) throw new Error("ticket must be an object.");
  const kind = raw.kind;
  const priority = raw.priority;
  if (!KINDS.includes(kind as TicketKind)) {
    throw new Error("kind is not recognized.");
  }
  if (!PRIORITIES.includes(priority as TicketPriority)) {
    throw new Error("priority is not recognized.");
  }
  const title = boundedString(raw.title, "title", 3, 69);
  const problem = boundedString(raw.problem, "problem", 10, 1200);
  const acceptanceCriteria = stringList(
    raw.acceptance_criteria,
    "acceptance_criteria",
    2,
    4,
    300,
  );
  const requestedBy = boundedString(
    raw.requested_by,
    "requested_by",
    1,
    120,
  );
  if (
    !conversation.utterances.some(
      (utterance) =>
        utterance.speaker.toLocaleLowerCase() ===
        requestedBy.toLocaleLowerCase(),
    )
  ) {
    throw new Error("requested_by is not a speaker in the transcript.");
  }
  const quotes = stringList(raw.quotes, "quotes", 1, 8, 1200);
  const utterances = new Set(conversation.utterances.map((utterance) => utterance.text));
  if (quotes.some((quote) => !utterances.has(quote))) {
    throw new Error("every quote must exactly match one transcript utterance.");
  }
  const confidence = probability(raw.confidence, "confidence");
  let routingConfidence = probability(
    raw.routing_confidence,
    "routing_confidence",
  );
  let routingReason = boundedString(
    raw.routing_reason,
    "routing_reason",
    1,
    500,
  );
  let repo =
    typeof raw.repository === "string"
      ? raw.repository.trim().toLocaleLowerCase()
      : "";

  const matches = aliasMatches(
    [title, problem, ...quotes].join("\n"),
    aliases,
  );
  if (matches.length > 1) {
    throw new Error("the request contains aliases for multiple repositories.");
  }
  if (matches.length === 1) {
    repo = matches[0];
    routingConfidence = 1;
    routingReason = "Matched a configured repository alias.";
  }
  if (repo !== "unknown" && !repos.has(repo)) {
    throw new Error(`repository "${repo}" is not in the repository cache.`);
  }
  return {
    slot,
    repo,
    kind: kind as TicketKind,
    title,
    problem,
    acceptanceCriteria,
    priority: priority as TicketPriority,
    requestedBy,
    quotes,
    confidence,
    routingConfidence,
    routingReason,
  };
}

function ticketTool(profiles: RepoProfile[]): Anthropic.Tool {
  const repositories = [...profiles.map((profile) => profile.fullName), "unknown"];
  return {
    name: "record_tickets",
    description: "Record every concrete software work item in this conversation.",
    input_schema: {
      type: "object",
      properties: {
        tickets: {
          type: "array",
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              repository: { type: "string", enum: repositories },
              kind: { type: "string", enum: [...KINDS] },
              title: {
                type: "string",
                maxLength: 69,
                description: "Imperative English title, fewer than 70 characters.",
              },
              problem: {
                type: "string",
                description: "One to three factual English sentences.",
              },
              acceptance_criteria: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 4,
                description: "Two to four testable checks.",
              },
              priority: { type: "string", enum: [...PRIORITIES] },
              requested_by: {
                type: "string",
                description: "Speaker name copied exactly from the transcript.",
              },
              quotes: {
                type: "array",
                items: { type: "string" },
                description:
                  "One to eight complete utterance texts copied exactly, without speaker prefixes.",
              },
              confidence: {
                type: "number",
                description: "0 to 1 confidence that this is a concrete work item.",
              },
              routing_confidence: {
                type: "number",
                description: "0 to 1 confidence in repository selection.",
              },
              routing_reason: { type: "string" },
            },
            required: [
              "repository",
              "kind",
              "title",
              "problem",
              "acceptance_criteria",
              "priority",
              "requested_by",
              "quotes",
              "confidence",
              "routing_confidence",
              "routing_reason",
            ],
          },
        },
      },
      required: ["tickets"],
    },
  };
}

function profilePrompt(profile: RepoProfile): string {
  return [
    `Repository: ${profile.fullName}`,
    `Summary: ${profile.summary}`,
    `Signals: ${profile.signals.join(", ")}`,
  ].join("\n");
}

export async function extractTickets(
  conversation: Conversation,
  profiles: RepoProfile[],
  options: ExtractionOptions = {},
): Promise<ExtractionResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required to extract tickets.");
  }
  if (profiles.length === 0) {
    return {
      accepted: [],
      review: [
        {
          slot: 0,
          reason: "No repositories are available for routing.",
          title: conversation.title || conversation.id,
        },
      ],
    };
  }
  const tool = ticketTool(profiles);
  const anthropic = new Anthropic();
  const aliases = options.aliases ?? {};
  const aliasRules = Object.entries(aliases)
    .map(([alias, repo]) => `- "${alias}" means ${repo}`)
    .join("\n");
  const developerName =
    options.developerName ?? process.env.DEV_NAME ?? "the developer";
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 5000,
    system: `Turn spoken conversations into actionable GitHub tickets.

Rules:
- The developer's transcript name is "${developerName}".
- Another speaker's idea counts only when it is clearly a request, or when the developer agrees to do it.
- The developer's own "I need to", "I should", and "remind me" statements count as requests.
- Capture explicit bugs, features, tasks, and questions that require repository work.
- Ignore small talk, scheduling, billing, and unsupported guesses.
- Merge repeated descriptions of the same outcome into one ticket and preserve all supporting quotes.
- Split independent requested outcomes into separate tickets, even when they occur in one utterance.
- Write titles, problems, and criteria in English. Preserve complete source utterances verbatim in quotes.
- Use "unknown" when repository evidence is weak. Never guess from a language alone.
- Record a vague, hypothetical, or "someday" software idea with confidence below 0.5 so a human can review it; do not silently promote or discard it.
- High priority is reserved for blocking, data-loss, security, safety, or materially incorrect results.

Configured aliases override inferred routing:
${aliasRules || "(none)"}

Available repository profiles:
${profiles.map(profilePrompt).join("\n\n")}`,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [
      {
        role: "user",
        content: [
          `Conversation: ${conversation.title || conversation.id}`,
          `Started: ${conversation.startTime ?? "unknown"}`,
          `Bee summary: ${conversation.summary || "(none)"}`,
          `Transcript:\n${transcript(conversation)}`,
        ].join("\n\n"),
      },
    ],
  });
  const blocks = response.content.filter((block) => block.type === "tool_use");
  if (blocks.length !== 1 || blocks[0].name !== tool.name) {
    return {
      accepted: [],
      review: [
        {
          slot: 0,
          reason: "Claude did not return exactly one ticket tool result.",
          title: conversation.title || conversation.id,
        },
      ],
    };
  }
  const input = blocks[0].input;
  if (!isRecord(input) || !Array.isArray(input.tickets) || input.tickets.length > 20) {
    return {
      accepted: [],
      review: [
        {
          slot: 0,
          reason: "Claude returned a malformed ticket list.",
          title: conversation.title || conversation.id,
        },
      ],
    };
  }

  const minConfidence = options.minConfidence ?? 0.5;
  const routingThreshold = options.routingConfidence ?? 0.6;
  const available = new Set(
    profiles.map((profile) => profile.fullName.toLocaleLowerCase()),
  );
  const result: ExtractionResult = { accepted: [], review: [] };
  input.tickets.forEach((raw, slot) => {
    try {
      const validated = validateTicket(
        raw,
        slot,
        conversation,
        available,
        aliases,
      );
      const ticket =
        validated.routingConfidence < routingThreshold
          ? {
              ...validated,
              repo: "unknown",
              routingReason: `${validated.routingReason} Routing confidence was below ${routingThreshold.toFixed(2)}.`,
            }
          : validated;
      if (ticket.confidence < minConfidence) {
        result.review.push({
          slot,
          reason: `Extraction confidence ${ticket.confidence.toFixed(2)} is below ${minConfidence.toFixed(2)}.`,
          ticket,
          title: ticket.title,
        });
      } else if (
        ticket.repo === "unknown"
      ) {
        result.review.push({
          slot,
          reason:
            ticket.routingConfidence < routingThreshold
              ? `Routing confidence ${ticket.routingConfidence.toFixed(2)} is below ${routingThreshold.toFixed(2)}.`
              : "No repository could be selected safely.",
          ticket,
          title: ticket.title,
        });
      } else {
        result.accepted.push(ticket);
      }
    } catch (error) {
      result.review.push({
        slot,
        reason: `Invalid Claude output: ${(error as Error).message}`,
        title: candidateTitle(raw, slot),
      });
    }
  });
  return result;
}

export function extractionOptions(
  config: AppConfig,
  minConfidence: number,
): ExtractionOptions {
  return {
    aliases: config.aliases,
    minConfidence,
    routingConfidence: config.routingConfidence,
    developerName: process.env.DEV_NAME,
  };
}
