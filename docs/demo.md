# A four-step demo

The best demo is a short story: a request is spoken once, understood in context, and either becomes a new issue or strengthens one that already exists.

The fixture path makes the extraction story repeatable. The Devpost Bee-track video must also show the project using real Bee data; do not substitute the fixture for that proof.

## 1. Show the map

Start with the repository cache:

```bash
npm start -- repos
```

Point out that these are not hardcoded products. They are repositories discovered from the authenticated GitHub account, summarized into routing profiles, and cached locally.

If you want to show discovery live, use:

```bash
npm start -- repos refresh
```

That command calls GitHub and Claude, so refresh the cache before the presentation if the network is uncertain.

What to explain: the profiles replace hardcoded products, aliases preserve Jih's own vocabulary, and archived repositories remain unavailable.

## 2. Preview a messy conversation

Run the team fixture:

```bash
GITHUB_TOKEN= npm start -- fixture fixtures/robotics-team.json --dry-run --verbose
```

The bundled repository names are fictional, so the cleared token prevents an accidental GitHub lookup. This preview does not demonstrate live dedupe. Do not state an expected count until the fixture and command have been verified. The details to inspect are whether a repeated request was merged, independent outcomes were split, unsupported ideas stayed out of GitHub, and original words remain attached to English issue drafts.

## 3. Show the review path

List uncertain work:

```bash
npm start -- inbox
```

Explain that “unknown” is a safe outcome. An item can be assigned deliberately:

```bash
npm start -- inbox assign <n> owner/repo --dry-run --verbose
```

Or removed:

```bash
npm start -- inbox drop <n>
```

`<n>` is the number shown by the current `inbox` listing. Use an item and repository created for the demonstration. Do not copy private inbox content into the video without review.

## 4. Connect the live loop

With `bee proxy` already running, start:

```bash
npm start -- watch
```

Finish a short, consented Bee conversation. When its completion or summary event arrives, the intended flow is to fetch the complete transcript, route actionable requests, compare them with open issues, and apply the result.

Close by showing one of two GitHub outcomes:

- a new issue with testable acceptance criteria and source quotes; or
- an existing issue with a “mentioned again” comment.

The second outcome is often the better demo. It shows that repeated demand becomes evidence instead of tracker noise.

Keep `--dry-run` on during rehearsals. A live `watch` run can write whenever a valid token is present and dry-run is absent.

## Under-three-minute video outline

Aim below the platform limit so the ending is not clipped.

### 0:00–0:20 — The lost-request problem

Show Bee and GitHub side by side. In one sentence: useful software work is spoken in real conversations, but moving it into the correct repository is still manual.

### 0:20–0:45 — The repository map

Show `repos` using a safe demo account or sanitized repository names. Explain recent discovery, pins, exclusions, aliases, and cached Claude-built profiles.

### 0:45–1:20 — Preview the fixture

Run the verified fixture preview. Highlight one merge or split, one verbatim quote, and the selected repository. If the verified output does not demonstrate all three, narrate only what it actually demonstrates.

### 1:20–1:40 — Make uncertainty useful

Show `inbox`. Explain that low-confidence work waits for a human decision and that manual assignment rejoins the same dedupe path.

### 1:40–2:30 — Prove live Bee use

Show a short real Bee conversation completing and the CLI reacting to that Bee data. Then show the resulting GitHub issue or evidence comment. Keep the Bee event, CLI action, and GitHub result legible in one sequence.

### 2:30–2:50 — Close on safety and value

Show the source quote and operation result. Close with the product promise: spoken work becomes traceable repository work, while uncertain routing stays reviewable.

## Rehearsal checklist

- The commands match the final CLI help.
- The selected transcript and repositories are safe to publish.
- Tokens and environment files are off screen.
- Repository profiles already exist in case refresh is slow.
- The live path uses real Bee data.
- Any GitHub write goes to a disposable or explicitly approved issue.
- Every statement about output matches the recorded run.
- The final edit is in English and under three minutes.
