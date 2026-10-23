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

## Submission video

Official rules, from https://amazonappdev2026.devpost.com/rules: under three minutes, English, publicly visible on YouTube or Vimeo, no copyrighted music, and no third-party trademarks without permission. Judges are not required to watch past 3:00. For the Bee track, the video has to show Waggle using data from a Bee device or an Apple Watch running Bee. Naming Bee is not enough.

Aim for about 2:30. Show one real conversation becoming GitHub issues. The October 23 runs that already did this are `conv 11575767` (SplitIt issues 1–4) and `conv 11576634` (issues 5–6). Do not present the four inbox titles from `11576634` as created issues. Keep tokens and `.env` off screen.

The four judging criteria are weighted equally. The sections below are arranged so each one is visible.

### 0:00–0:20 — Problem

Say who has the pain. Do not open with a name or a school.

> A developer hears the bug in a conversation, and then has to remember it, rewrite it, and guess which repository it belongs to. Bee already recorded the words. Waggle sends the request to the repository.

On screen: a Bee transcript, then an empty GitHub issue list. This is Potential Impact.

### 0:20–1:50 — Live demo

This is most of the video. Screen recording plus voiceover is enough. One clean path is the demo.

Show, in order:

1. `bee proxy` already running.
2. `npm start -- conv 11575767 --verbose`, or a new consented conversation if you record one.
3. The CLI printing routed requests and the new issue URLs.
4. Those issues open on GitHub, with the acceptance criteria and one source quote visible.

Optional, only if it stays inside this window: `npm start -- inbox` for one item that really is waiting. Say that uncertain work stays local until a person assigns it.

> This conversation was already on Bee. Waggle read the transcript, kept the spoken words as quotes, and created the issues on the repository those words were about.

This stretch carries Design and Quality of the Idea. Show only behavior the recording actually produces.

### 1:50–2:20 — How it works

A simple architecture shot is enough. Use the diagram in the README.

> Bee’s proxy gives Waggle the conversation. Claude proposes the tickets. The CLI checks the repository, the speaker, and the quotes before GitHub is allowed to change. A repeat lands on the open issue. A lost response is reconciled with a marker stored before the write.

Name the tools you actually used: Bee CLI and conversation API, Claude, GitHub. Do not mention AWS. This is Technical Implementation.

### 2:20–2:40 — What's next

> The person who would use this is a developer who already wears Bee and works in more than one repository. The next recording is the same loop left running with `watch`, so the next finished conversation becomes the next issue without a second command.

Stop before 2:40 so the export stays under three minutes.

## Rehearsal checklist

- The commands match the final CLI help.
- The selected transcript and repositories are safe to publish.
- Tokens and environment files are off screen.
- Repository profiles already exist in case refresh is slow.
- The live path uses real Bee data.
- Any GitHub write goes to a disposable or explicitly approved issue.
- Every statement about output matches the recorded run.
- The final edit is in English, publicly visible on YouTube or Vimeo, and under three minutes.
- The upload uses no copyrighted music and no third-party trademarks without permission.
- A Bee transcript is on screen, and the GitHub result of that same data is on screen.
