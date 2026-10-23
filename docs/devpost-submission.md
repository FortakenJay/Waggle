# Devpost submission kit

Paste the sections below into the Devpost form. Empty fields stay empty on purpose. Official rules: https://amazonappdev2026.devpost.com/rules. Deadline: Friday, October 23, 2026, 12:00 pm Pacific.

## Rules check

Read from the rules page on October 23, 2026:

- A working project, a text description, a GitHub URL, a demo video, product feedback, a primary track, and any mini challenges you actually enter.
- Bee track: the code must call Bee at runtime, and the video must show data from a Bee device or an Apple Watch running Bee doing something useful for a person. Mentioning Bee is not enough.
- Public repository with an open-source license visible in About, or a private repository shared with `testing@devpost.com` and `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`.
- Video under three minutes, English, publicly visible on YouTube or Vimeo. No copyrighted music. No third-party trademarks without permission. Judges are not required to watch past three minutes.
- The video must show the project functioning as the text describes.
- Judges score Technical Implementation, Design, Potential Impact, and Quality of the Idea equally.
- Product feedback is required for every tool, API, or SDK. A friction log is optional and can add up to 10% in stage-one review.
- Open Source mini challenge: an additional public contribution beside the primary project, with a contribution URL, repository URL, GitHub username, and a description. The primary repository’s MIT license does not by itself enter that challenge.
- AWS Builder: only if the project calls AWS, or uses Kiro Crew as the development tool. This project does neither.

The public MIT path is the one already chosen. The video URL and the product-feedback answers are still open.

## Submission identity

- **Project name:** Waggle
- **Primary track:** Bee (Wearable AI)
- **Relevant use cases:** Developer experience; personal productivity
- **Mini challenges:** Not selected
- **Repository URL:** `https://github.com/FortakenJay/Waggle`
- **License:** MIT. Copyright 2026 Jih Bin Luo and Justin Meng.
- **Public demo video URL:** `[add after upload]`

### Short tagline

Turn spoken software work from Bee conversations into routed, deduplicated GitHub issues, and leave uncertain requests in an inbox.

## Inspiration

Bees do a waggle dance to tell the hive where to go. The name Waggle comes from that: the tool hears a spoken software request and points it at a repository.

The request usually shows up while someone is talking. A teammate describes a broken login, or the developer says “remind me” out loud. Bee already stored the conversation. The missing step was turning those words into the right GitHub issue without inventing a repository when the evidence is weak.

## What it does

Waggle is a local command-line tool. It reads a finished Bee transcript, asks Claude for concrete software work, and checks the model’s repository, speaker, and quotes before anything is written.

A validated request is compared with open issues. If an open issue would already satisfy it, Waggle adds the conversation as evidence. Otherwise it can create an issue that keeps the spoken words attached. Unknown, low-confidence, and malformed results stay in a local inbox.

On October 23, 2026, conversation `11575767` created SplitIt issues 1–4, and conversation `11576634` created issues 5 and 6. Four other requests from the second conversation stayed in the inbox because their quotes were not verbatim copies of one utterance. No user count, time saved, or accuracy rate has been measured.

## How we built it

The Bee CLI proxy exposes the conversation REST API and an SSE stream. `src/bee.ts` calls those endpoints. Claude returns a tool result for profiles, extraction, and dedupe. `src/github.ts` is the only module that writes to GitHub. Dry-run stops at that boundary. Each live write is stored locally first and carries an invisible marker so a retry can find a write whose HTTP response was lost.

The repository list is discovered from the signed-in GitHub account. Pins, exclusions, and aliases live in `~/.waggle/config.json`. They are not hardcoded product names.

## Challenges we ran into

- Issue creation has no idempotency key, so a timeout after GitHub accepts the write is ambiguous. The marker lookup runs before a retry creates another issue.
- A fine-grained token returned 200 for the repository and 403 for issue creation until Issues was set to read and write.
- Quotes have to be copied from one utterance. Requests spoken across several lines were rejected into the inbox, and those inbox rows have no ticket to assign.
- Bee completion events can repeat. A processed conversation is skipped, and an applied operation is not written again.

## Built with

List only technologies still present in the final code:

- TypeScript and Node.js
- Bee CLI proxy / Bee conversation API and SSE stream
- Anthropic Claude API
- GitHub REST API through Octokit

AWS Builder is not selected. The code does not call an AWS service.

## Accomplishments that we're proud of

Use this only with the evidence named here.

- A real Bee transcript was routed to an existing GitHub repository and created issues 1–6 on `fortakenjay/splitit`.
- The same run refused four quotes that were not verbatim, instead of posting them.
- The public repository’s license file is the MIT text GitHub reports as SPDX `MIT`.

## What's next

Record the video in [demo.md](demo.md) and put the public URL on this form. Fill [product-feedback.md](product-feedback.md) from direct use of Bee, the Bee CLI, Claude, and GitHub. Decide how a request spoken across several utterances should be quoted. Leave `watch` running so the next finished conversation follows the same path.

## Video outline

Use the timed script in [demo.md](demo.md):

1. 0:00–0:20 problem, for Potential Impact
2. 0:20–1:50 one real Bee conversation becoming GitHub issues, for Design and Quality of the Idea
3. 1:50–2:20 Bee, Claude, and the write guard, for Technical Implementation
4. 2:20–2:40 who would use it next

The video must be publicly visible on YouTube or Vimeo, in English, and under three minutes. Use only footage and audio Jih has the right to publish.

## Required product feedback

Complete [product-feedback.md](product-feedback.md) for every API, SDK, CLI, or developer tool used in the submitted build. The final answer needs:

- what the tool was used for;
- what worked well;
- what needs work;
- how onboarding felt;
- whether Jih would build with it again;
- AWS services and purpose, if any are later added.

Actual feedback is pending direct use; the document does not pre-fill positive or negative claims.

## Repository access decision

The public path is chosen. The repository is published at the URL above under the MIT license.

Still required before submission:

- Confirm the pushed tree includes the source, fixtures, and the setup in the README.
- Enter the Open Source mini challenge only with a separate contribution URL and description. It is not selected.

The private reviewer path is no longer the chosen route. It would have meant sharing a private repository with `testing@devpost.com` and `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, and `emersonsklar`.

## Submission checklist

### Working project

- [x] The final code calls Bee technology in code, not only in documentation.
- [x] A real Bee conversation reaches a useful user-facing result. Evidence: `npm start -- conv 11575767 --verbose` created SplitIt issues 1–4; `npm start -- conv 11576634 --verbose` created issues 5–6. Four other requests from 11576634 stayed in the inbox.
- [ ] Setup works from a clean checkout using repository instructions.
- [x] `npm run typecheck` passed.
- [x] `npm test` on October 23, 2026 recorded 9 passes and 2 live-model skips. `npm run typecheck` passed the same day.
- [ ] Both generic fixture previews run and their actual outcomes are recorded.
- [x] The source tree contains no legacy product names.
- [ ] No token, private transcript, local state, or private repository name is committed.

### Repository

- [x] Jih chose public plus the MIT license.
- [ ] Repository URL is added to the submission.
- [ ] Source code, assets, fixtures, and run instructions are included.
- [ ] The repository visibly uses the required Bee technology.
- [ ] If private, all required reviewers can access it.
- [x] If public, the selected license is present. GitHub reports SPDX `MIT`.

### Video

- [ ] Video is publicly visible on YouTube or Vimeo. An unlisted upload does not meet the rules text.
- [ ] Video is in English and under three minutes.
- [ ] Real Bee data is visibly used.
- [ ] The best result appears before the ending.
- [ ] Terminal text and GitHub output are legible.
- [ ] No secrets, unauthorized trademarks, copyrighted music, or private data appear.
- [ ] Video URL is added to Devpost.

### Written submission

- [ ] Description states what the project does and how it works.
- [ ] Bee is selected as the primary track.
- [ ] Mini-challenge choices match actual evidence.
- [ ] The pre-existing prototype and submission-window changes are explained.
- [ ] Product feedback covers every tool used.
- [ ] Optional feature requests are evidence-based and include urgency.
- [ ] Optional friction entries contain every required field.
- [ ] All metrics, links, outputs, and screenshots were directly verified.

### Final consistency pass

- [x] README commands match `--help`.
- [x] Config examples match runtime validation.
- [x] Mermaid diagrams match final data flow.
- [ ] Devpost copy matches the repository and video.
- [ ] Any claimed result has a named check, capture, or live demonstration.
