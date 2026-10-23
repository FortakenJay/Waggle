import { describe, expect, test } from "vitest";
import { normalizeConversation } from "../src/bee.js";
import { dedupeTickets } from "../src/dedupe.js";
import { quoteIsVerbatim, resolveSpeaker, type Ticket } from "../src/extract.js";
import {
  addEvidence,
  createIssue,
  evidenceBody,
  issueBody,
} from "../src/github.js";
import { inboxEntryId } from "../src/inbox.js";
import { validateConfig, validateRepoCache } from "../src/repos.js";
import { operationId, operationMarker } from "../src/state.js";

const ticket: Ticket = {
  slot: 0,
  repo: "sample/example",
  kind: "task",
  title: "Update the export",
  problem: "The export needs to include the requested information.",
  acceptanceCriteria: [
    "The requested field appears in the export.",
    "The exported value matches the source record.",
  ],
  priority: "medium",
  requestedBy: "Alex",
  quotes: ["Please include the timezone."],
  confidence: 0.9,
  routingConfidence: 0.8,
  routingReason: "The repository profile mentions exports.",
};

describe("defensive local behavior", () => {
  test("accepts a verbatim excerpt and a unique speaker prefix", () => {
    const spoken = [
      "This is a note about Split It so remind me to fix the login page on Safari then make the nav bar to be solid.",
    ];
    expect(
      quoteIsVerbatim("remind me to fix the login page on Safari", spoken),
    ).toBe(true);
    expect(quoteIsVerbatim("make the nav bar to be solid", spoken)).toBe(true);
    expect(quoteIsVerbatim("add a nicer login page", spoken)).toBe(false);
    expect(quoteIsVerbatim("the", spoken)).toBe(false);
    expect(resolveSpeaker("Jih", ["Unknown", "jihbin"])).toBe("jihbin");
    expect(resolveSpeaker("Unknown", ["Unknown", "jihbin"])).toBe("Unknown");
    expect(resolveSpeaker("Sam", ["Unknown", "jihbin"])).toBeUndefined();
  });

  test("normalizes nested Bee payload variants", () => {
    expect(
      normalizeConversation({
        data: {
          conversation: {
            conversation_id: "conversation-1",
            short_summary: "A useful summary",
            transcript: {
              utterances: [
                {
                  speaker: { name: "Alex" },
                  content: "Please include the timezone.",
                  created_at: "2026-10-22T12:00:00Z",
                },
              ],
            },
          },
        },
      }),
    ).toMatchObject({
      id: "conversation-1",
      title: "A useful summary",
      utterances: [
        {
          speaker: "Alex",
          text: "Please include the timezone.",
        },
      ],
    });
  });

  test("fails closed on conflicting repository config", () => {
    expect(() =>
      validateConfig({
        version: 1,
        pinnedRepos: ["sample/example"],
        excludedRepos: ["sample/example"],
        aliases: {},
      }),
    ).toThrow(/both pinnedRepos and excludedRepos/);
  });

  test("validates and normalizes repository aliases", () => {
    expect(
      validateConfig({
        version: 1,
        pinnedRepos: [],
        excludedRepos: [],
        aliases: { "The App": "Sample/Example" },
        routingConfidence: 0.75,
      }).aliases,
    ).toEqual({ "the app": "sample/example" });
  });

  test("rejects duplicate repository profiles", () => {
    const profile = {
      fullName: "sample/example",
      name: "example",
      description: "",
      topics: [],
      language: null,
      pushedAt: null,
      summary: "A sufficiently descriptive routing summary.",
      signals: ["example"],
    };
    expect(() =>
      validateRepoCache({
        version: 1,
        refreshedAt: new Date().toISOString(),
        repos: [profile, profile],
      }),
    ).toThrow(/Duplicate repository/);
  });

  test("dedupe is deterministic when there are no open issues", async () => {
    await expect(dedupeTickets([ticket], [])).resolves.toEqual([
      {
        index: 0,
        duplicateOf: null,
        reason: "No open issues exist in this repository.",
      },
    ]);
  });

  test("renders source provenance and operation markers", () => {
    const body = issueBody(
      ticket,
      {
        id: "conversation-1",
        title: "Planning notes",
        summary: "",
        utterances: [],
      },
      "<!-- waggle:op:abc123 -->",
    );
    expect(body).toContain("## Source");
    expect(body).toContain("Requested by: Alex");
    expect(body).toContain("<!-- waggle:op:abc123 -->");

    const evidence = evidenceBody(ticket, {
      id: "conversation-1",
      title: "Planning notes",
      summary: "",
      startTime: "2026-10-22T12:00:00Z",
      utterances: [],
    });
    expect(evidence).toContain("Mentioned again on 2026-10-22 by Alex.");
  });

  test("generates stable local and GitHub idempotency identifiers", () => {
    expect(inboxEntryId("conversation-1", 2)).toBe(
      inboxEntryId("conversation-1", 2),
    );
    const id = operationId({
      conversationId: "conversation-1",
      slot: 2,
      repo: "sample/example",
      action: "create",
    });
    expect(id).toHaveLength(24);
    expect(operationMarker(id)).toBe(`<!-- waggle:op:${id} -->`);
  });

  test("blocks GitHub mutations at the API boundary in dry-run", async () => {
    const conversation = {
      id: "conversation-1",
      title: "Planning notes",
      summary: "",
      utterances: [],
    };
    await expect(
      createIssue(
        "sample/example",
        ticket,
        conversation,
        operationMarker("create"),
        { dryRun: true },
      ),
    ).resolves.toEqual({ applied: false });
    await expect(
      addEvidence(
        "sample/example",
        42,
        ticket,
        conversation,
        operationMarker("comment"),
        { dryRun: true },
      ),
    ).resolves.toEqual({ applied: false });
  });
});
