import { Octokit } from "@octokit/rest";
import type { Conversation } from "./bee.js";
import type { ExistingIssue } from "./dedupe.js";
import type { Ticket } from "./extract.js";
import type { OperationResult } from "./state.js";

export const SOURCE_LABEL = "from-bee";

export interface RepositoryMetadata {
  fullName: string;
  name: string;
  description: string;
  topics: string[];
  language: string | null;
  pushedAt: string | null;
  archived: boolean;
  readme: string;
}

export interface GitHubMutationOptions {
  dryRun: boolean;
}

export type GitHubWriteResult =
  | { applied: false }
  | { applied: true; result: OperationResult };

let octokit: Octokit | undefined;

function client(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required for this GitHub operation.");
  }
  octokit ??= new Octokit({ auth: token });
  return octokit;
}

function split(fullName: string): { owner: string; repo: string } {
  const match = /^([^/\s]+)\/([^/\s]+)$/.exec(fullName);
  if (!match) throw new Error(`Bad repository "${fullName}", expected owner/name.`);
  return { owner: match[1], repo: match[2] };
}

function decodeReadme(content: string, encoding: string | undefined): string {
  if (encoding !== "base64") return content;
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

export async function discoverRepositoryMetadata(
  pinnedRepos: ReadonlySet<string>,
): Promise<RepositoryMetadata[]> {
  const api = client();
  const repositories = await api.paginate(api.repos.listForAuthenticatedUser, {
    affiliation: "owner,collaborator",
    visibility: "all",
    sort: "pushed",
    direction: "desc",
    per_page: 100,
  });
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const eligible = repositories.filter((repo) => {
    if (repo.archived) return false;
    const fullName = repo.full_name.toLowerCase();
    const pushedAt = repo.pushed_at ? Date.parse(repo.pushed_at) : 0;
    return pinnedRepos.has(fullName) || pushedAt >= cutoff;
  });

  return Promise.all(
    eligible.map(async (repo): Promise<RepositoryMetadata> => {
      let readme = "";
      try {
        const response = await api.repos.getReadme({
          owner: repo.owner.login,
          repo: repo.name,
          mediaType: { format: "raw" },
        });
        const data = response.data;
        readme =
          typeof data === "string"
            ? data
            : decodeReadme(data.content ?? "", data.encoding);
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status !== 404) throw error;
      }

      return {
        fullName: repo.full_name,
        name: repo.name,
        description: repo.description ?? "",
        topics: repo.topics ?? [],
        language: repo.language ?? null,
        pushedAt: repo.pushed_at ?? null,
        archived: Boolean(repo.archived),
        readme: readme.slice(0, 1500),
      };
    }),
  );
}

export async function openIssues(repo: string): Promise<ExistingIssue[]> {
  const api = client();
  const issues = await api.paginate(api.issues.listForRepo, {
    ...split(repo),
    state: "open",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });
  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body ?? "",
    }));
}

const LABELS: Record<string, { color: string; description: string }> = {
  bug: { color: "d73a4a", description: "Something is not working" },
  feature: { color: "a2eeef", description: "New functionality" },
  task: { color: "0075ca", description: "Work item" },
  question: { color: "d876e3", description: "Needs clarification" },
  "priority:high": { color: "b60205", description: "High priority" },
  "priority:medium": { color: "fbca04", description: "Medium priority" },
  "priority:low": { color: "cfd3d7", description: "Low priority" },
  [SOURCE_LABEL]: { color: "5319e7", description: "Captured from a Bee conversation" },
};

export async function ensureTicketLabels(
  repo: string,
  options: GitHubMutationOptions,
): Promise<Set<string>> {
  const wanted = new Set(Object.keys(LABELS).map((name) => name.toLowerCase()));
  if (options.dryRun) return wanted;
  const api = client();
  const location = split(repo);
  const current = await api.paginate(api.issues.listLabelsForRepo, {
    ...location,
    per_page: 100,
  });
  const existing = new Set(current.map((label) => label.name.toLowerCase()));
  let canCreate = true;

  for (const [name, definition] of Object.entries(LABELS)) {
    if (existing.has(name.toLowerCase())) continue;
    if (!canCreate) continue;
    try {
      await api.issues.createLabel({ ...location, name, ...definition });
      existing.add(name.toLowerCase());
    } catch (error) {
      const status = (error as { status?: number }).status;
      // A concurrent process may have created the same label after our preflight.
      if (status === 422) continue;
      if (status === 403) {
        canCreate = false;
        console.error(
          `   ! ${repo} token cannot create labels; issues will use only labels that already exist.`,
        );
        continue;
      }
      throw error;
    }
  }
  return existing;
}

function sourceBlock(ticket: Ticket, conversation: Conversation): string {
  const started = conversation.startTime
    ? new Date(conversation.startTime).toISOString()
    : "unknown";
  return [
    "## Source",
    `- Conversation: ${conversation.title || conversation.id}`,
    `- Bee conversation ID: \`${conversation.id}\``,
    `- Started: ${started}`,
    `- Requested by: ${ticket.requestedBy}`,
    "",
    ...ticket.quotes.map((quote) => `> ${quote.replace(/\n/g, "\n> ")}`),
  ].join("\n");
}

export function issueBody(
  ticket: Ticket,
  conversation: Conversation,
  marker = "",
): string {
  return [
    ticket.problem,
    "",
    "## Acceptance criteria",
    ...ticket.acceptanceCriteria.map((criterion) => `- [ ] ${criterion}`),
    "",
    sourceBlock(ticket, conversation),
    "",
    `<sub>Captured by waggle · ${ticket.kind} · priority ${ticket.priority} · extraction ${ticket.confidence.toFixed(2)} · routing ${ticket.routingConfidence.toFixed(2)}</sub>`,
    marker,
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");
}

export function evidenceBody(
  ticket: Ticket,
  conversation: Conversation,
  marker = "",
): string {
  const date = conversation.startTime
    ? new Date(conversation.startTime).toISOString().slice(0, 10)
    : "an unknown date";
  return [
    `Mentioned again on ${date} by ${ticket.requestedBy}.`,
    "",
    sourceBlock(ticket, conversation).replace("## Source", "## Additional source"),
    "",
    marker,
  ].join("\n");
}

export async function createIssue(
  repo: string,
  ticket: Ticket,
  conversation: Conversation,
  marker: string,
  options: GitHubMutationOptions,
): Promise<GitHubWriteResult> {
  if (options.dryRun) return { applied: false };
  const available = await ensureTicketLabels(repo, options);
  const labels = [ticket.kind, `priority:${ticket.priority}`, SOURCE_LABEL].filter(
    (name) => available.has(name.toLowerCase()),
  );
  const { data } = await client().issues.create({
    ...split(repo),
    title: ticket.title,
    body: issueBody(ticket, conversation, marker),
    labels,
  });
  return {
    applied: true,
    result: { issueNumber: data.number, url: data.html_url },
  };
}

export async function addEvidence(
  repo: string,
  issueNumber: number,
  ticket: Ticket,
  conversation: Conversation,
  marker: string,
  options: GitHubMutationOptions,
): Promise<GitHubWriteResult> {
  if (options.dryRun) return { applied: false };
  const { data } = await client().issues.createComment({
    ...split(repo),
    issue_number: issueNumber,
    body: evidenceBody(ticket, conversation, marker),
  });
  return {
    applied: true,
    result: { issueNumber, url: data.html_url },
  };
}

export async function findIssueByMarker(
  repo: string,
  marker: string,
): Promise<OperationResult | undefined> {
  const api = client();
  const issues = await api.paginate(api.issues.listForRepo, {
    ...split(repo),
    state: "all",
    sort: "created",
    direction: "desc",
    per_page: 100,
  });
  const issue = issues.find(
    (candidate) => !candidate.pull_request && candidate.body?.includes(marker),
  );
  return issue
    ? { issueNumber: issue.number, url: issue.html_url }
    : undefined;
}

export async function findCommentByMarker(
  repo: string,
  issueNumber: number,
  marker: string,
): Promise<OperationResult | undefined> {
  const api = client();
  const comments = await api.paginate(api.issues.listComments, {
    ...split(repo),
    issue_number: issueNumber,
    per_page: 100,
  });
  const comment = comments.find((candidate) => candidate.body?.includes(marker));
  return comment
    ? { issueNumber, url: comment.html_url }
    : undefined;
}
