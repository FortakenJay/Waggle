#!/usr/bin/env tsx
import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  configureBee,
  getConversation,
  listConversationIds,
  normalizeConversation,
  watchConversations,
  type Conversation,
} from "./bee.js";
import { dedupeTickets } from "./dedupe.js";
import type { DedupeDecision, ExistingIssue } from "./dedupe.js";
import {
  extractTickets,
  extractionOptions,
  type ReviewCandidate,
  type Ticket,
} from "./extract.js";
import {
  addEvidence,
  createIssue,
  findCommentByMarker,
  findIssueByMarker,
  issueBody,
  openIssues,
} from "./github.js";
import {
  addReviewCandidates,
  dropInboxEntry,
  listInbox,
  prepareInboxAssignment,
} from "./inbox.js";
import {
  ensureRepoCache,
  loadConfig,
  loadRepoCache,
  refreshRepoCache,
  validateRepoCache,
  type AppConfig,
  type RepoCache,
} from "./repos.js";
import {
  claimOperation,
  completeOperation,
  isConversationProcessed,
  planOperation,
  recordConversationProcessed,
  releaseOperation,
} from "./state.js";

interface CliOptions {
  dryRun: boolean;
  verbose: boolean;
  force: boolean;
  debug: boolean;
  help: boolean;
  minConfidence: number;
  positionals: string[];
}

interface FixtureFile {
  conversation: Conversation;
  cache: RepoCache;
  aliases: Record<string, string>;
}

const usage = `waggle — spoken work → GitHub issues

Commands:
  fixture <file.json>                 process a saved fixture
  conv <id>                           process one Bee conversation
  latest [count]                      process recent conversations (default 5)
  watch                               process completed Bee conversations
  repos                               list cached repository profiles
  repos refresh                       rediscover and profile repositories
  inbox                               list review entries
  inbox assign <n> <owner/repo>
  inbox drop <n>

Flags:
  --dry-run                           block every GitHub mutation
  --verbose                           print rendered issue bodies
  --force                             re-extract processed conversations
  --debug                             log one raw Bee payload
  --min-confidence <0..1>             extraction threshold (default 0.5)

Without GITHUB_TOKEN, processing is automatically dry-run.`;

function parseCli(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    verbose: false,
    force: false,
    debug: false,
    help: false,
    minConfidence: 0.5,
    positionals: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      options.positionals.push(arg);
      continue;
    }
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--debug") options.debug = true;
    else if (arg === "--min-confidence" || arg.startsWith("--min-confidence=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : argv[++index];
      const parsed = Number(value);
      if (!value || !Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
        throw new Error("--min-confidence must be a number from 0 to 1.");
      }
      options.minConfidence = parsed;
    } else {
      throw new Error(`Unknown flag ${arg}.\n\n${usage}`);
    }
  }
  options.dryRun ||= !process.env.GITHUB_TOKEN;
  return options;
}

function assertArgs(
  actual: string[],
  minimum: number,
  maximum: number,
  syntax: string,
): void {
  if (actual.length < minimum || actual.length > maximum) {
    throw new Error(`Usage: waggle ${syntax}`);
  }
}

function readFixture(path: string): FixtureFile {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`Fixture ${path} must be an object.`);
  }
  const object = raw as Record<string, unknown>;
  const conversation = normalizeConversation(object.conversation ?? raw);
  if (!Array.isArray(object.repoProfiles)) {
    throw new Error(`Fixture ${path} must contain repoProfiles.`);
  }
  const cache = validateRepoCache({
    version: 1,
    refreshedAt: new Date(0).toISOString(),
    repos: object.repoProfiles,
  });
  const aliasesValue = object.aliases ?? {};
  if (
    typeof aliasesValue !== "object" ||
    aliasesValue === null ||
    Array.isArray(aliasesValue) ||
    Object.values(aliasesValue).some((value) => typeof value !== "string")
  ) {
    throw new Error(`Fixture ${path} aliases must map strings to repositories.`);
  }
  return {
    conversation,
    cache,
    aliases: aliasesValue as Record<string, string>,
  };
}

function groupByRepo(tickets: Ticket[]): Map<string, Ticket[]> {
  const groups = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const current = groups.get(ticket.repo) ?? [];
    current.push(ticket);
    groups.set(ticket.repo, current);
  }
  return groups;
}

async function reconcile(
  repo: string,
  issueNumber: number | null,
  marker: string,
) {
  return issueNumber === null
    ? findIssueByMarker(repo, marker)
    : findCommentByMarker(repo, issueNumber, marker);
}

async function applyTicket(
  ticket: Ticket,
  conversation: Conversation,
  duplicateOf: number | null,
  options: CliOptions,
): Promise<{ operationId: string; resolved: boolean }> {
  const action = duplicateOf === null ? "create" : "comment";
  const operation = planOperation({
    conversationId: conversation.id,
    slot: ticket.slot,
    repo: ticket.repo,
    action,
    ...(duplicateOf === null ? {} : { issueNumber: duplicateOf }),
    title: ticket.title,
  });
  const tag = `${ticket.kind}/${ticket.priority}`;

  if (operation.status === "applied") {
    console.log(
      `   = APPLIED  ${ticket.title}${operation.result ? `\n     ${operation.result.url}` : ""}`,
    );
    return { operationId: operation.id, resolved: true };
  }
  if (options.dryRun) {
    if (duplicateOf === null) {
      console.log(`   + NEW  ${ticket.title}  (${tag})`);
      if (options.verbose) {
        console.log(
          issueBody(ticket, conversation, operation.marker).replace(
            /^/gm,
            "       ",
          ),
        );
      }
    } else {
      console.log(`   ↺ #${duplicateOf} +evidence  ${ticket.title}  (${tag})`);
    }
    return { operationId: operation.id, resolved: false };
  }

  const claim = claimOperation(operation.id);
  if (claim.status === "applied") {
    console.log(`   = APPLIED  ${ticket.title}`);
    return { operationId: operation.id, resolved: true };
  }
  if (claim.status === "busy") {
    throw new Error(`Operation ${operation.id} is being applied by another process.`);
  }

  try {
    const recovered = await reconcile(ticket.repo, duplicateOf, operation.marker);
    if (recovered) {
      completeOperation(operation.id, recovered);
      console.log(`   = RECOVERED  ${ticket.title}\n     ${recovered.url}`);
      return { operationId: operation.id, resolved: true };
    }
    const write =
      duplicateOf === null
        ? await createIssue(
            ticket.repo,
            ticket,
            conversation,
            operation.marker,
            { dryRun: false },
          )
        : await addEvidence(
            ticket.repo,
            duplicateOf,
            ticket,
            conversation,
            operation.marker,
            { dryRun: false },
          );
    if (!write.applied) {
      throw new Error("GitHub write was unexpectedly blocked.");
    }
    completeOperation(operation.id, write.result);
    console.log(
      duplicateOf === null
        ? `   + NEW  ${ticket.title}\n     ${write.result.url}`
        : `   ↺ #${duplicateOf} +evidence  ${ticket.title}\n     ${write.result.url}`,
    );
    return { operationId: operation.id, resolved: true };
  } catch (error) {
    try {
      const recovered = await reconcile(ticket.repo, duplicateOf, operation.marker);
      if (recovered) {
        completeOperation(operation.id, recovered);
        console.log(`   = RECOVERED  ${ticket.title}\n     ${recovered.url}`);
        return { operationId: operation.id, resolved: true };
      }
    } catch (recoveryError) {
      console.error(
        `   marker reconciliation also failed: ${(recoveryError as Error).message}`,
      );
    }
    releaseOperation(operation.id);
    throw error;
  }
}

async function processConversation(
  conversation: Conversation,
  cache: RepoCache,
  config: AppConfig,
  options: CliOptions,
): Promise<string[]> {
  console.log(
    `\n=== ${conversation.title || conversation.id} (${conversation.utterances.length} utterances) ===`,
  );
  if (conversation.utterances.length === 0) {
    throw new Error(
      `Conversation ${conversation.id} has no transcript yet; leaving it unprocessed.`,
    );
  }
  const extraction = await extractTickets(
    conversation,
    cache.repos,
    extractionOptions(config, options.minConfidence),
  );
  const inboxEntries = addReviewCandidates(conversation, extraction.review);
  console.log(
    `  ${extraction.accepted.length} routed request(s), ${inboxEntries.length} sent to inbox`,
  );
  for (const entry of inboxEntries) {
    console.log(`   ? INBOX ${entry.id}  ${entry.title} — ${entry.reason}`);
  }

  const operationIds: string[] = [];
  for (const [repo, tickets] of groupByRepo(extraction.accepted)) {
    console.log(`\n  [${repo}]`);
    let existing: ExistingIssue[] = [];
    if (process.env.GITHUB_TOKEN) {
      existing = await openIssues(repo);
    } else {
      console.log("   ! GitHub reads unavailable; dry-run dedupe uses no issues");
    }
    let decisions: DedupeDecision[];
    try {
      decisions = await dedupeTickets(tickets, existing);
    } catch (error) {
      const review: ReviewCandidate[] = tickets.map((ticket) => ({
        slot: ticket.slot,
        ticket,
        title: ticket.title,
        reason: `Duplicate classification failed closed: ${(error as Error).message}`,
      }));
      addReviewCandidates(conversation, review);
      console.error(`   ! ${review[0].reason}`);
      continue;
    }
    for (const decision of decisions) {
      const outcome = await applyTicket(
        tickets[decision.index],
        conversation,
        decision.duplicateOf,
        options,
      );
      operationIds.push(outcome.operationId);
    }
  }
  return operationIds;
}

function isConversationReady(conversation: Conversation): boolean {
  const state = conversation.state?.trim().toUpperCase() ?? "";
  if (!state) return true;
  return state === "COMPLETED" || state === "COMPLETE" || state === "FINISHED";
}

async function processOnce(
  conversation: Conversation,
  cache: RepoCache,
  config: AppConfig,
  options: CliOptions,
): Promise<boolean> {
  if (!isConversationReady(conversation)) {
    console.log(
      `skip ${conversation.id} (Bee state ${conversation.state}; waiting until it is completed)`,
    );
    return false;
  }
  if (isConversationProcessed(conversation.id) && !options.force) {
    console.log(
      `skip ${conversation.id} (already processed; use --force to re-extract)`,
    );
    return true;
  }
  const operationIds = await processConversation(
    conversation,
    cache,
    config,
    options,
  );
  if (!options.dryRun) {
    recordConversationProcessed(conversation.id, operationIds);
  }
  return true;
}

function listRepositories(cache: RepoCache): void {
  console.log(`Repository cache refreshed ${cache.refreshedAt}`);
  if (cache.repos.length === 0) {
    console.log("  no repositories available");
    return;
  }
  for (const repo of cache.repos) {
    console.log(`\n${repo.fullName}`);
    console.log(`  ${repo.summary}`);
    console.log(`  signals: ${repo.signals.join(", ")}`);
  }
}

function showInbox(): void {
  const entries = listInbox();
  if (entries.length === 0) {
    console.log("Inbox is empty.");
    return;
  }
  entries.forEach((entry, index) => {
    console.log(
      `${index + 1}. ${entry.title}\n   ${entry.reason}\n   conversation ${entry.conversation.id}`,
    );
  });
}

function inboxEntryAt(value: string) {
  const position = Number(value);
  const entries = listInbox();
  if (entries.length === 0) {
    throw new Error("Inbox is empty.");
  }
  if (!Number.isInteger(position) || position < 1 || position > entries.length) {
    throw new Error(`Inbox item must be a number from 1 to ${entries.length}.`);
  }
  return entries[position - 1];
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  configureBee({ debug: options.debug });
  const [command, ...commandArgs] = options.positionals;
  if (options.help || !command || command === "help") {
    console.log(usage);
    return;
  }
  if (options.dryRun) {
    console.log("(dry run — every GitHub mutation is blocked)");
  }

  if (command === "repos") {
    assertArgs(commandArgs, 0, 1, "repos [refresh]");
    if (commandArgs[0] && commandArgs[0] !== "refresh") {
      throw new Error("Usage: waggle repos [refresh]");
    }
    const cache =
      commandArgs[0] === "refresh"
        ? await refreshRepoCache(loadConfig())
        : loadRepoCache();
    listRepositories(cache);
    return;
  }

  if (command === "inbox") {
    const [action, position, repo, ...extra] = commandArgs;
    if (!action) {
      showInbox();
      return;
    }
    if (extra.length > 0) throw new Error("Too many inbox arguments.");
    if (action === "drop") {
      if (!position || repo) throw new Error("Usage: waggle inbox drop <n>");
      const entry = inboxEntryAt(position);
      dropInboxEntry(entry.id);
      console.log(`Dropped inbox item ${position}.`);
      return;
    }
    if (action === "assign") {
      if (!position || !repo) {
        throw new Error(
          "Usage: waggle inbox assign <n> <owner/repo>",
        );
      }
      const cache = loadRepoCache();
      const selected = inboxEntryAt(position);
      const { entry, ticket } = prepareInboxAssignment(
        selected.id,
        repo,
        cache,
      );
      const existing = process.env.GITHUB_TOKEN
        ? await openIssues(ticket.repo)
        : [];
      const [decision] = await dedupeTickets([ticket], existing);
      const outcome = await applyTicket(
        ticket,
        entry.conversation,
        decision.duplicateOf,
        options,
      );
      if (outcome.resolved && !options.dryRun) {
        dropInboxEntry(selected.id);
        console.log(`Resolved inbox item ${position}.`);
      } else {
        console.log(`Inbox item ${position} retained.`);
      }
      return;
    }
    throw new Error("Usage: waggle inbox [assign|drop]");
  }

  const config = loadConfig();
  if (command === "fixture") {
    assertArgs(commandArgs, 1, 1, "fixture <file.json>");
    const fixture = readFixture(commandArgs[0]);
    const fixtureConfig: AppConfig = {
      ...config,
      aliases: { ...config.aliases, ...fixture.aliases },
    };
    await processOnce(
      fixture.conversation,
      fixture.cache,
      fixtureConfig,
      options,
    );
    return;
  }

  const cache = await ensureRepoCache();
  if (command === "conv") {
    assertArgs(commandArgs, 1, 1, "conv <id>");
    await processOnce(
      await getConversation(commandArgs[0]),
      cache,
      config,
      options,
    );
    return;
  }
  if (command === "latest") {
    assertArgs(commandArgs, 0, 1, "latest [count]");
    const count = Number(commandArgs[0] ?? 5);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      throw new Error("latest count must be an integer from 1 to 100.");
    }
    const ids = await listConversationIds(Math.min(100, Math.max(count * 5, count)));
    let handled = 0;
    for (const id of ids) {
      if (handled >= count) break;
      if (await processOnce(await getConversation(id), cache, config, options)) {
        handled++;
      }
    }
    return;
  }
  if (command === "watch") {
    assertArgs(commandArgs, 0, 0, "watch");
    console.log("Watching Bee for completed conversations…");
    await watchConversations(async (id) => {
      await processOnce(await getConversation(id), cache, config, options);
    });
    return;
  }
  throw new Error(`Unknown command "${command}".\n\n${usage}`);
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
