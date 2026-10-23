import Anthropic from "@anthropic-ai/sdk";
import { existsSync } from "node:fs";
import {
  discoverRepositoryMetadata,
  type RepositoryMetadata,
} from "./github.js";
import {
  PATHS,
  readJson,
  updateJson,
} from "./state.js";

const REPO_PATTERN = /^[^/\s]+\/[^/\s]+$/;
const DEFAULT_ROUTING_CONFIDENCE = 0.6;
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5";

export interface AppConfig {
  version: 1;
  pinnedRepos: string[];
  excludedRepos: string[];
  aliases: Record<string, string>;
  routingConfidence: number;
}

export interface RepoProfile {
  fullName: string;
  name: string;
  description: string;
  topics: string[];
  language: string | null;
  pushedAt: string | null;
  summary: string;
  signals: string[];
}

export interface RepoCache {
  version: 1;
  refreshedAt: string;
  repos: RepoProfile[];
}

const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  pinnedRepos: [],
  excludedRepos: [],
  aliases: {},
  routingConfidence: DEFAULT_ROUTING_CONFIDENCE,
};

const PROFILE_TOOL: Anthropic.Tool = {
  name: "record_repository_profile",
  description: "Record a concise routing profile for this software repository.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Two or three factual sentences explaining what work belongs here.",
      },
      signals: {
        type: "array",
        items: { type: "string" },
        description: "Five to fifteen short names, domain terms, or feature signals.",
      },
    },
    required: ["summary", "signals"],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRepo(value: string): string {
  return value.trim().toLowerCase();
}

function requireRepo(value: unknown, field: string): string {
  if (typeof value !== "string" || !REPO_PATTERN.test(value.trim())) {
    throw new Error(`${field} must contain repositories in owner/name form.`);
  }
  return normalizeRepo(value);
}

function stringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return [...new Set(value.map((item) => requireRepo(item, field)))];
}

export function validateConfig(value: unknown): AppConfig {
  if (!isRecord(value)) throw new Error(`Invalid config in ${PATHS.config}.`);
  if (value.version !== undefined && value.version !== 1) {
    throw new Error(`Unsupported config version in ${PATHS.config}.`);
  }
  const pinnedRepos = stringArray(value.pinnedRepos ?? [], "pinnedRepos");
  const excludedRepos = stringArray(value.excludedRepos ?? [], "excludedRepos");
  const aliasesValue = value.aliases ?? {};
  if (!isRecord(aliasesValue)) throw new Error("aliases must be an object.");
  const aliases: Record<string, string> = {};
  for (const [rawAlias, rawRepo] of Object.entries(aliasesValue)) {
    const alias = rawAlias.trim().toLowerCase();
    if (!alias) throw new Error("Alias names cannot be empty.");
    aliases[alias] = requireRepo(rawRepo, `aliases.${rawAlias}`);
  }
  const routingConfidence = value.routingConfidence ?? DEFAULT_ROUTING_CONFIDENCE;
  if (
    typeof routingConfidence !== "number" ||
    !Number.isFinite(routingConfidence) ||
    routingConfidence < 0 ||
    routingConfidence > 1
  ) {
    throw new Error("routingConfidence must be a number from 0 to 1.");
  }

  const exclusions = new Set(excludedRepos);
  const conflict = pinnedRepos.find((repo) => exclusions.has(repo));
  if (conflict) {
    throw new Error(
      `Repository ${conflict} cannot appear in both pinnedRepos and excludedRepos.`,
    );
  }
  for (const [alias, repo] of Object.entries(aliases)) {
    if (exclusions.has(repo)) {
      throw new Error(`Alias "${alias}" targets excluded repository ${repo}.`);
    }
  }
  return {
    version: 1,
    pinnedRepos,
    excludedRepos,
    aliases,
    routingConfidence,
  };
}

export function loadConfig(): AppConfig {
  if (!existsSync(PATHS.config)) {
    updateJson(PATHS.config, DEFAULT_CONFIG, () => DEFAULT_CONFIG);
  }
  return validateConfig(readJson<unknown>(PATHS.config, DEFAULT_CONFIG));
}

function validateProfile(value: unknown, index: number): RepoProfile {
  if (!isRecord(value)) throw new Error(`repos[${index}] must be an object.`);
  const fullName = requireRepo(value.fullName, `repos[${index}].fullName`);
  const name = value.name;
  const description = value.description;
  const topics = value.topics;
  const language = value.language;
  const pushedAt = value.pushedAt;
  const summary = value.summary;
  const signals = value.signals;
  if (typeof name !== "string" || !name.trim()) {
    throw new Error(`repos[${index}].name is required.`);
  }
  if (typeof description !== "string") {
    throw new Error(`repos[${index}].description must be a string.`);
  }
  if (
    !Array.isArray(topics) ||
    topics.some((topic) => typeof topic !== "string")
  ) {
    throw new Error(`repos[${index}].topics must be strings.`);
  }
  if (language !== null && typeof language !== "string") {
    throw new Error(`repos[${index}].language must be a string or null.`);
  }
  if (pushedAt !== null && typeof pushedAt !== "string") {
    throw new Error(`repos[${index}].pushedAt must be a string or null.`);
  }
  if (typeof summary !== "string" || !summary.trim() || summary.length > 1200) {
    throw new Error(`repos[${index}].summary is invalid.`);
  }
  if (
    !Array.isArray(signals) ||
    signals.length < 1 ||
    signals.length > 20 ||
    signals.some(
      (signal) =>
        typeof signal !== "string" ||
        !signal.trim() ||
        signal.length > 80,
    )
  ) {
    throw new Error(`repos[${index}].signals are invalid.`);
  }
  return {
    fullName,
    name: name.trim(),
    description: description.trim(),
    topics: topics.map((topic) => topic.trim()).filter(Boolean),
    language,
    pushedAt,
    summary: summary.trim(),
    signals: signals.map((signal) => signal.trim().toLowerCase()),
  };
}

export function validateRepoCache(value: unknown): RepoCache {
  if (!isRecord(value) || value.version !== 1) {
    throw new Error(`Unsupported repository cache in ${PATHS.repos}.`);
  }
  if (typeof value.refreshedAt !== "string" || !Array.isArray(value.repos)) {
    throw new Error(`Invalid repository cache in ${PATHS.repos}.`);
  }
  const repos = value.repos.map(validateProfile);
  const names = new Set<string>();
  for (const repo of repos) {
    if (names.has(repo.fullName)) {
      throw new Error(`Duplicate repository ${repo.fullName} in cache.`);
    }
    names.add(repo.fullName);
  }
  return { version: 1, refreshedAt: value.refreshedAt, repos };
}

export function loadRepoCache(): RepoCache {
  if (!existsSync(PATHS.repos)) {
    throw new Error(
      `Repository cache is missing. Run "waggle repos refresh" first.`,
    );
  }
  return validateRepoCache(readJson<unknown>(PATHS.repos, null));
}

function validateGeneratedProfile(value: unknown): {
  summary: string;
  signals: string[];
} {
  if (!isRecord(value)) throw new Error("Claude returned a non-object profile.");
  const { summary, signals } = value;
  if (
    typeof summary !== "string" ||
    summary.trim().length < 20 ||
    summary.length > 1200
  ) {
    throw new Error("Claude returned an invalid repository summary.");
  }
  if (
    !Array.isArray(signals) ||
    signals.length < 3 ||
    signals.length > 20 ||
    signals.some(
      (signal) =>
        typeof signal !== "string" ||
        !signal.trim() ||
        signal.length > 80,
    )
  ) {
    throw new Error("Claude returned invalid repository signals.");
  }
  return {
    summary: summary.trim(),
    signals: [...new Set(signals.map((signal) => signal.trim().toLowerCase()))],
  };
}

async function profileRepository(
  anthropic: Anthropic,
  metadata: RepositoryMetadata,
): Promise<RepoProfile> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 700,
    tools: [PROFILE_TOOL],
    tool_choice: { type: "tool", name: PROFILE_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          "Build a factual routing profile. Do not invent capabilities.",
          `Repository: ${metadata.fullName}`,
          `Description: ${metadata.description || "(none)"}`,
          `Topics: ${metadata.topics.join(", ") || "(none)"}`,
          `Primary language: ${metadata.language ?? "(unknown)"}`,
          `README excerpt:\n${metadata.readme || "(none)"}`,
        ].join("\n\n"),
      },
    ],
  });
  const blocks = response.content.filter((block) => block.type === "tool_use");
  if (blocks.length !== 1 || blocks[0].name !== PROFILE_TOOL.name) {
    throw new Error(`Claude did not return one profile for ${metadata.fullName}.`);
  }
  const generated = validateGeneratedProfile(blocks[0].input);
  return {
    fullName: normalizeRepo(metadata.fullName),
    name: metadata.name,
    description: metadata.description,
    topics: metadata.topics,
    language: metadata.language,
    pushedAt: metadata.pushedAt,
    ...generated,
  };
}

export async function refreshRepoCache(
  config = loadConfig(),
): Promise<RepoCache> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required to build repository profiles.");
  }
  const pinned = new Set(config.pinnedRepos);
  const excluded = new Set(config.excludedRepos);
  const metadata = await discoverRepositoryMetadata(pinned);
  const available = metadata.filter(
    (repo) => !repo.archived && !excluded.has(normalizeRepo(repo.fullName)),
  );
  const availableNames = new Set(
    available.map((repo) => normalizeRepo(repo.fullName)),
  );
  for (const [alias, repo] of Object.entries(config.aliases)) {
    if (!availableNames.has(repo)) {
      throw new Error(
        `Alias "${alias}" targets ${repo}, which is not available after discovery.`,
      );
    }
  }
  for (const repo of config.pinnedRepos) {
    if (!availableNames.has(repo)) {
      throw new Error(
        `Pinned repository ${repo} is unavailable or archived for this GitHub account.`,
      );
    }
  }

  const anthropic = new Anthropic();
  const repos: RepoProfile[] = [];
  for (const repo of available) {
    repos.push(await profileRepository(anthropic, repo));
  }
  repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
  const cache: RepoCache = {
    version: 1,
    refreshedAt: new Date().toISOString(),
    repos,
  };
  updateJson(PATHS.repos, cache, () => cache);
  return cache;
}

export async function ensureRepoCache(): Promise<RepoCache> {
  return existsSync(PATHS.repos) ? loadRepoCache() : refreshRepoCache();
}

export function resolveAlias(
  text: string,
  aliases: Readonly<Record<string, string>>,
): string | undefined {
  const haystack = text.toLocaleLowerCase();
  const matches = new Set<string>();
  for (const [alias, repo] of Object.entries(aliases)) {
    if (haystack.includes(alias.toLocaleLowerCase())) matches.add(repo);
  }
  return matches.size === 1 ? [...matches][0] : undefined;
}

export function requireCachedRepo(cache: RepoCache, repo: string): RepoProfile {
  const normalized = normalizeRepo(repo);
  const profile = cache.repos.find((candidate) => candidate.fullName === normalized);
  if (!profile) {
    throw new Error(`Repository ${repo} is not present in the current repository cache.`);
  }
  return profile;
}
