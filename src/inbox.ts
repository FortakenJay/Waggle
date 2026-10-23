import { createHash } from "node:crypto";
import type { Conversation } from "./bee.js";
import type { ReviewCandidate, Ticket } from "./extract.js";
import { requireCachedRepo, type RepoCache } from "./repos.js";
import { PATHS, readJson, updateJson } from "./state.js";

export interface InboxEntry {
  id: string;
  conversation: Conversation;
  slot: number;
  title: string;
  reason: string;
  ticket?: Ticket;
  createdAt: string;
  updatedAt: string;
}

interface InboxFile {
  version: 1;
  entries: Record<string, InboxEntry>;
}

function emptyInbox(): InboxFile {
  return { version: 1, entries: {} };
}

function readInbox(): InboxFile {
  const inbox = readJson<InboxFile>(PATHS.inbox, emptyInbox());
  if (
    inbox.version !== 1 ||
    !inbox.entries ||
    typeof inbox.entries !== "object" ||
    Array.isArray(inbox.entries)
  ) {
    throw new Error(`Unsupported inbox format in ${PATHS.inbox}.`);
  }
  return inbox;
}

export function inboxEntryId(conversationId: string, slot: number): string {
  return createHash("sha256")
    .update(`v1:${conversationId}:${slot}`)
    .digest("hex")
    .slice(0, 16);
}

export function addReviewCandidates(
  conversation: Conversation,
  candidates: ReviewCandidate[],
): InboxEntry[] {
  if (candidates.length === 0) return [];
  const written: InboxEntry[] = [];
  updateJson(PATHS.inbox, emptyInbox(), (inbox) => {
    for (const candidate of candidates) {
      const id = inboxEntryId(conversation.id, candidate.slot);
      const existing = inbox.entries[id];
      const now = new Date().toISOString();
      const entry: InboxEntry = {
        id,
        conversation,
        slot: candidate.slot,
        title: candidate.title,
        reason: candidate.reason,
        ...(candidate.ticket ? { ticket: candidate.ticket } : {}),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      inbox.entries[id] = entry;
      written.push(entry);
    }
    return inbox;
  });
  return written;
}

export function listInbox(): InboxEntry[] {
  return Object.values(readInbox().entries).sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}

export function getInboxEntry(id: string): InboxEntry {
  const entry = readInbox().entries[id];
  if (!entry) throw new Error(`Inbox entry ${id} does not exist.`);
  return entry;
}

export function prepareInboxAssignment(
  id: string,
  repo: string,
  cache: RepoCache,
): { entry: InboxEntry; ticket: Ticket } {
  const entry = getInboxEntry(id);
  if (!entry.ticket) {
    throw new Error(
      `Inbox entry ${id} has no validated ticket fields and cannot be assigned.`,
    );
  }
  const profile = requireCachedRepo(cache, repo);
  return {
    entry,
    ticket: {
      ...entry.ticket,
      repo: profile.fullName,
      routingConfidence: 1,
      routingReason: "Manually assigned from the inbox.",
    },
  };
}

export function dropInboxEntry(id: string): void {
  updateJson(PATHS.inbox, emptyInbox(), (inbox) => {
    if (!inbox.entries[id]) throw new Error(`Inbox entry ${id} does not exist.`);
    delete inbox.entries[id];
    return inbox;
  });
}
