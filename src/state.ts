import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { createHash } from "node:crypto";

export const APP_DIR = process.env.WAGGLE_HOME ?? join(homedir(), ".waggle");

export const PATHS = {
  config: join(APP_DIR, "config.json"),
  repos: join(APP_DIR, "repos.json"),
  inbox: join(APP_DIR, "inbox.json"),
  state: join(APP_DIR, "state.json"),
  lock: join(APP_DIR, ".write.lock"),
} as const;

export function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    throw new Error(`Could not read ${path}: ${(error as Error).message}`);
  }
}

export function atomicWriteJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, path);
}

function withWriteLock<T>(work: () => T): T {
  mkdirSync(APP_DIR, { recursive: true, mode: 0o700 });
  let fd: number;
  try {
    fd = openSync(PATHS.lock, "wx", 0o600);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EEXIST") throw error;

    const age = Date.now() - statSync(PATHS.lock).mtimeMs;
    if (age <= 120_000) {
      throw new Error("Another waggle process is updating local state; retry shortly.");
    }
    unlinkSync(PATHS.lock);
    fd = openSync(PATHS.lock, "wx", 0o600);
  }

  try {
    writeFileSync(fd, `${process.pid}\n`);
    return work();
  } finally {
    closeSync(fd);
    try {
      unlinkSync(PATHS.lock);
    } catch {
      // A stale-lock recovery may already have removed it.
    }
  }
}

export function updateJson<T>(path: string, fallback: T, update: (current: T) => T): T {
  return withWriteLock(() => {
    const next = update(readJson(path, fallback));
    atomicWriteJson(path, next);
    return next;
  });
}

export type OperationAction = "create" | "comment";
export type OperationStatus = "planned" | "applying" | "applied";

export interface OperationResult {
  issueNumber: number;
  url: string;
}

export interface OperationRecord {
  id: string;
  marker: string;
  conversationId: string;
  slot: number;
  repo: string;
  action: OperationAction;
  issueNumber?: number;
  title: string;
  status: OperationStatus;
  leaseUntil?: string;
  result?: OperationResult;
  createdAt: string;
  updatedAt: string;
}

interface ConversationRecord {
  processedAt: string;
  operations: string[];
}

interface StateFile {
  version: 1;
  conversations: Record<string, ConversationRecord>;
  operations: Record<string, OperationRecord>;
}

function emptyState(): StateFile {
  return {
    version: 1,
    conversations: {},
    operations: {},
  };
}

function readState(): StateFile {
  const state = readJson<StateFile>(PATHS.state, emptyState());
  if (state.version !== 1 || !state.conversations || !state.operations) {
    throw new Error(`Unsupported state format in ${PATHS.state}`);
  }
  return state;
}

export function operationId(input: {
  conversationId: string;
  slot: number;
  repo: string;
  action: OperationAction;
  issueNumber?: number;
}): string {
  const seed = [
    "v1",
    input.conversationId,
    input.slot,
    input.repo.toLowerCase(),
    input.action,
    input.issueNumber ?? "",
  ].join(":");
  return createHash("sha256").update(seed).digest("hex").slice(0, 24);
}

export function operationMarker(id: string): string {
  return `<!-- waggle:op:${id} -->`;
}

export function planOperation(input: {
  conversationId: string;
  slot: number;
  repo: string;
  action: OperationAction;
  issueNumber?: number;
  title: string;
}): OperationRecord {
  const id = operationId(input);
  let record!: OperationRecord;
  updateJson(PATHS.state, emptyState(), (state) => {
    const existing = state.operations[id];
    if (existing) {
      if (
        existing.conversationId !== input.conversationId ||
        existing.repo !== input.repo ||
        existing.action !== input.action ||
        existing.issueNumber !== input.issueNumber
      ) {
        throw new Error(`Operation ID collision for ${id}.`);
      }
      record = existing;
      return state;
    }
    const now = new Date().toISOString();
    record = {
      ...input,
      id,
      marker: operationMarker(id),
      status: "planned",
      createdAt: now,
      updatedAt: now,
    };
    state.operations[id] = record;
    return state;
  });
  return record;
}

export type ClaimResult =
  | { status: "claimed"; operation: OperationRecord }
  | { status: "busy"; operation: OperationRecord }
  | { status: "applied"; operation: OperationRecord };

export function claimOperation(id: string): ClaimResult {
  let result!: ClaimResult;
  updateJson(PATHS.state, emptyState(), (state) => {
    const operation = state.operations[id];
    if (!operation) throw new Error(`Unknown operation ${id}`);
    if (operation.status === "applied") {
      result = { status: "applied", operation };
      return state;
    }
    if (
      operation.status === "applying" &&
      operation.leaseUntil &&
      Date.parse(operation.leaseUntil) > Date.now()
    ) {
      result = { status: "busy", operation };
      return state;
    }

    operation.status = "applying";
    operation.leaseUntil = new Date(Date.now() + 120_000).toISOString();
    operation.updatedAt = new Date().toISOString();
    result = { status: "claimed", operation };
    return state;
  });
  return result;
}

export function releaseOperation(id: string): void {
  updateJson(PATHS.state, emptyState(), (state) => {
    const operation = state.operations[id];
    if (operation && operation.status !== "applied") {
      operation.status = "planned";
      delete operation.leaseUntil;
      operation.updatedAt = new Date().toISOString();
    }
    return state;
  });
}

export function completeOperation(id: string, result: OperationResult): void {
  updateJson(PATHS.state, emptyState(), (state) => {
    const operation = state.operations[id];
    if (!operation) throw new Error(`Unknown operation ${id}`);
    operation.status = "applied";
    operation.result = result;
    delete operation.leaseUntil;
    operation.updatedAt = new Date().toISOString();
    return state;
  });
}

export function isConversationProcessed(id: string): boolean {
  return Boolean(readState().conversations[id]);
}

export function recordConversationProcessed(id: string, operationIds: string[]): void {
  updateJson(PATHS.state, emptyState(), (state) => {
    state.conversations[id] = {
      processedAt: new Date().toISOString(),
      operations: [...new Set(operationIds)],
    };
    return state;
  });
}

export function getOperation(id: string): OperationRecord | undefined {
  return readState().operations[id];
}
