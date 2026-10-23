import Anthropic from "@anthropic-ai/sdk";
import type { Ticket } from "./extract.js";

const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5";
const ISSUE_BATCH_SIZE = 40;

export interface ExistingIssue {
  number: number;
  title: string;
  body: string;
}

export interface DedupeDecision {
  index: number;
  duplicateOf: number | null;
  reason: string;
}

const MATCH_TOOL: Anthropic.Tool = {
  name: "record_matches",
  description:
    "For every candidate, record the open issue it duplicates in this batch, or null.",
  input_schema: {
    type: "object",
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer" },
            duplicate_of: { type: ["integer", "null"] },
            reason: { type: "string" },
          },
          required: ["index", "duplicate_of", "reason"],
        },
      },
    },
    required: ["matches"],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function validateBatch(
  input: unknown,
  candidateCount: number,
  batch: ExistingIssue[],
): DedupeDecision[] {
  if (!isRecord(input) || !Array.isArray(input.matches)) {
    throw new Error("Claude returned a malformed duplicate decision.");
  }
  if (input.matches.length !== candidateCount) {
    throw new Error("Claude did not return one duplicate decision per candidate.");
  }
  const allowedIssues = new Set(batch.map((issue) => issue.number));
  const decisions = new Map<number, DedupeDecision>();
  for (const value of input.matches) {
    if (!isRecord(value)) throw new Error("A duplicate decision is not an object.");
    const index = value.index;
    const duplicateOf = value.duplicate_of;
    const reason = value.reason;
    if (
      typeof index !== "number" ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= candidateCount ||
      decisions.has(index)
    ) {
      throw new Error("A duplicate decision has an invalid candidate index.");
    }
    if (
      duplicateOf !== null &&
      (typeof duplicateOf !== "number" ||
        !Number.isInteger(duplicateOf) ||
        !allowedIssues.has(duplicateOf))
    ) {
      throw new Error("A duplicate decision references an issue outside its batch.");
    }
    if (typeof reason !== "string" || !reason.trim() || reason.length > 800) {
      throw new Error("A duplicate decision has an invalid reason.");
    }
    decisions.set(index, {
      index,
      duplicateOf,
      reason: reason.trim(),
    });
  }
  return [...decisions.values()].sort((a, b) => a.index - b.index);
}

async function classifyBatch(
  anthropic: Anthropic,
  candidates: Ticket[],
  batch: ExistingIssue[],
): Promise<DedupeDecision[]> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    tools: [MATCH_TOOL],
    tool_choice: { type: "tool", name: MATCH_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          "Classify duplicates conservatively.",
          "A candidate duplicates an issue only when completing the existing issue would fully satisfy the candidate. Related work is not a duplicate.",
          "Return exactly one decision for every candidate index. Use only issue numbers shown below.",
          `Open issues:\n${batch
            .map(
              (issue) =>
                `#${issue.number}: ${issue.title}\n${issue.body.slice(0, 600)}`,
            )
            .join("\n---\n")}`,
          `Candidates:\n${candidates
            .map(
              (ticket, index) =>
                `[${index}] ${ticket.title}\n${ticket.problem}\nCriteria: ${ticket.acceptanceCriteria.join("; ")}`,
            )
            .join("\n---\n")}`,
        ].join("\n\n"),
      },
    ],
  });
  const blocks = response.content.filter((block) => block.type === "tool_use");
  if (blocks.length !== 1 || blocks[0].name !== MATCH_TOOL.name) {
    throw new Error("Claude did not return exactly one duplicate tool result.");
  }
  return validateBatch(blocks[0].input, candidates.length, batch);
}

export async function dedupeTickets(
  candidates: Ticket[],
  existing: ExistingIssue[],
): Promise<DedupeDecision[]> {
  if (candidates.length === 0) return [];
  if (existing.length === 0) {
    return candidates.map((_, index) => ({
      index,
      duplicateOf: null,
      reason: "No open issues exist in this repository.",
    }));
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required to classify duplicates.");
  }

  const anthropic = new Anthropic();
  const decisionsByBatch: DedupeDecision[][] = [];
  for (const batch of chunks(existing, ISSUE_BATCH_SIZE)) {
    decisionsByBatch.push(await classifyBatch(anthropic, candidates, batch));
  }

  return candidates.map((_, index) => {
    const decisions = decisionsByBatch.map((batch) => batch[index]);
    if (decisions.some((decision) => !decision || decision.index !== index)) {
      throw new Error(`Incomplete duplicate decisions for candidate ${index}.`);
    }
    const matches = [
      ...new Set(
        decisions
          .map((decision) => decision.duplicateOf)
          .filter((issue): issue is number => issue !== null),
      ),
    ];
    if (matches.length > 1) {
      throw new Error(
        `Candidate ${index} matched multiple issues across bounded batches.`,
      );
    }
    const selected = matches[0] ?? null;
    return {
      index,
      duplicateOf: selected,
      reason: selected
        ? decisions.find((decision) => decision.duplicateOf === selected)!.reason
        : decisions.map((decision) => decision.reason).join(" "),
    };
  });
}
