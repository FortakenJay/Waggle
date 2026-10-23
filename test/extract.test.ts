import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { normalizeConversation } from "../src/bee.js";
import { extractTickets } from "../src/extract.js";
import { validateRepoCache, type RepoProfile } from "../src/repos.js";

interface Fixture {
  conversation: unknown;
  repoProfiles: RepoProfile[];
  aliases: Record<string, string>;
  expectations: {
    acceptedCount: number;
    reviewCount: number;
    repoCounts: Record<string, number>;
  };
}

function fixture(name: string): Fixture {
  const raw = JSON.parse(
    readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8"),
  ) as Fixture;
  const cache = validateRepoCache({
    version: 1,
    refreshedAt: new Date(0).toISOString(),
    repos: raw.repoProfiles,
  });
  return { ...raw, repoProfiles: cache.repos };
}

async function extract(name: string) {
  const data = fixture(name);
  const result = await extractTickets(
    normalizeConversation(data.conversation),
    data.repoProfiles,
    {
      aliases: data.aliases,
      minConfidence: 0.5,
      routingConfidence: 0.7,
    },
  );
  return { data, result };
}

function expectCounts(
  accepted: { repo: string }[],
  expected: Record<string, number>,
): void {
  const actual = accepted.reduce<Record<string, number>>((counts, ticket) => {
    counts[ticket.repo] = (counts[ticket.repo] ?? 0) + 1;
    return counts;
  }, {});
  expect(actual).toEqual(expected);
}

describe.skipIf(!process.env.ANTHROPIC_API_KEY)(
  "live Claude fixture extraction",
  () => {
    test(
      "merges repeated robot failures and splits independent requests",
      async () => {
        const { data, result } = await extract("robotics-team.json");
        expect(result.accepted).toHaveLength(data.expectations.acceptedCount);
        expect(result.review).toHaveLength(data.expectations.reviewCount);
        expectCounts(result.accepted, data.expectations.repoCounts);

        const reconnect = result.accepted.find((ticket) =>
          /reconnect|wi-?fi|connection/i.test(`${ticket.title} ${ticket.problem}`),
        );
        expect(reconnect?.kind).toBe("bug");
        expect(reconnect?.quotes.length).toBeGreaterThanOrEqual(2);
        expect(
          result.accepted.some((ticket) =>
            /csv|export/i.test(`${ticket.title} ${ticket.problem}`),
          ),
        ).toBe(true);
        expect(
          result.accepted.some((ticket) =>
            /battery|temperature/i.test(`${ticket.title} ${ticket.problem}`),
          ),
        ).toBe(true);
      },
      120_000,
    );

    test(
      "splits self-spoken work and routes both repositories",
      async () => {
        const { data, result } = await extract("solo-mixed.json");
        expect(result.accepted).toHaveLength(data.expectations.acceptedCount);
        expect(result.review).toHaveLength(data.expectations.reviewCount);
        expectCounts(result.accepted, data.expectations.repoCounts);

        const calendar = result.accepted.find((ticket) =>
          /calendar|icalendar/i.test(`${ticket.title} ${ticket.problem}`),
        );
        const flakyTest = result.accepted.find((ticket) =>
          /flaky|test/i.test(`${ticket.title} ${ticket.problem}`),
        );
        expect(calendar).toBeDefined();
        expect(flakyTest).toBeDefined();
        expect(calendar?.slot).not.toBe(flakyTest?.slot);
        expect(
          calendar?.quotes.some((quote) => /zona horaria/i.test(quote)),
        ).toBe(true);
        expect(
          result.accepted.some(
            (ticket) => ticket.repo === "sample-dev/portfolio-web",
          ),
        ).toBe(true);
      },
      120_000,
    );
  },
);
