# Devpost submission kit

Everything below is draft material for Jih to review against the final build and Devpost form. Empty fields and unchecked boxes are intentional.

## Submission identity

- **Project name:** Waggle
- **Primary track:** Bee (Wearable AI)
- **Relevant use cases:** Developer experience; personal productivity
- **Mini challenges:** Not selected
- **Repository URL:** `https://github.com/FortakenJay/Waggle`
- **License:** MIT. Copyright 2026 Jih Bin Luo and Justin Meng.
- **Public demo video URL:** `[add after upload]`

### Short tagline

Turn spoken software work from Bee conversations into routed, deduplicated GitHub issues without hiding uncertain decisions.

## Project description

Bees do a waggle dance to tell the hive where to go. Waggle is named for that dance: it hears a spoken software request and points it at a repository.

Useful software work is often spoken before it is written down. A teammate describes a browser bug, a classmate asks for an export, or a developer says a reminder aloud. Bee preserves the conversation, but moving the work into the right repository is still a manual step.

Waggle is a local TypeScript CLI that reads real Bee conversation data and turns concrete software requests into structured GitHub work. It discovers the developer's eligible repositories, asks Claude to build compact routing profiles, extracts requests with verbatim source quotes, and validates every model-produced field before acting.

Each validated request is compared with open issues in its selected repository. If an issue already satisfies the requested outcome, Waggle adds the new conversation as evidence. Otherwise it can create a new issue with acceptance criteria and source context. Unknown, malformed, and low-confidence work goes to a local inbox for deliberate assignment or removal.

The write path is intentionally conservative. Dry-run blocks GitHub mutations at the API boundary. Live operations are persisted before the request and carry an invisible marker, allowing a retry to reconcile a write whose response may have been lost.

## How it uses Bee

For the live path, the Bee CLI proxy exposes conversation REST endpoints and an SSE stream. Waggle listens for completed or summarized conversations, fetches the full conversation, normalizes the transcript defensively, and sends that Bee-derived data through extraction, routing, dedupe, and GitHub handling.

The final video must visibly demonstrate this path with real Bee data. A saved fixture may explain behavior, but it does not replace the track requirement.

## How it works

1. Discover recent owned and collaborator repositories; add pinned inactive repositories and remove exclusions.
2. Build and cache bounded repository profiles from GitHub metadata and README excerpts.
3. Read a Bee conversation or fixture and ask Claude for tool-structured software requests.
4. Validate repository membership, confidence, requester, field bounds, and exact source quotes.
5. Send uncertain work to the inbox; send validated work to conservative open-issue dedupe.
6. Preview the issue or comment in dry-run, or apply it through the marker-backed operation ledger.

## What was built or changed

The project existed as a prototype tied to two specific products. The submission work generalizes it into a personal repository-agnostic tool:

- hardcoded product routing is replaced with GitHub discovery, generated profiles, pins, exclusions, and aliases;
- extraction accepts explicit requests from any speaker, including self-directed developer reminders, and validates model output at runtime;
- uncertain work gains a persistent review inbox;
- dedupe is isolated, bounded, and fail-closed;
- GitHub mutations are centralized behind dry-run;
- retries gain atomic local state, operation leases, and invisible reconciliation markers;
- fixtures, tests, CLI commands, and documentation were rewritten around generic repositories.

Before submitting this paragraph, verify that every listed change is present in the final repository.

## Built with

List only technologies still present in the final code:

- TypeScript and Node.js
- Bee CLI proxy / Bee conversation API and SSE stream
- Anthropic Claude API
- GitHub REST API through Octokit

No AWS service is currently established, so the project should not claim the AWS Builder mini challenge.

## Product case

### Problem

Transcripts preserve conversation, but developers still lose time and context when converting spoken work into tracker-ready issues.

### Audience

Developers who use Bee and work across multiple GitHub repositories.

### Value

The project preserves the original request, chooses an evidence-backed repository, avoids obvious duplicates, and makes uncertainty reviewable rather than invisible.

No user count, time saved, accuracy rate, or research finding has been measured.

## Suggested “challenges” answer

Use only the parts verified during the final run:

- GitHub does not provide an idempotency key for issue creation, so a timeout after acceptance creates an ambiguous retry.
- Claude tool output still needs runtime validation; compile-time types cannot protect external model responses.
- Repository routing must handle old-but-relevant projects, archived projects, aliases, and uncertain matches without silently choosing.
- Bee completion and summary events can repeat, so the pipeline cannot rely on receiving one event exactly once.

## Suggested “what we learned” prompts

Complete these after implementation and demo rehearsal:

- What changed after seeing a real Bee payload?
- Which validation caught a plausible but unsafe model response?
- What did the first repository refresh reveal about routing context?
- Which part of the CLI took the most explanation during rehearsal?
- Would the same design still make sense after daily use?

Do not turn these prompts into claims until Jih records the observation.

## Video outline

Use the timed outline in [demo.md](demo.md). The required shape is:

1. problem and product promise;
2. discovered repository map;
3. fixture preview and review path;
4. live Bee data entering the pipeline;
5. resulting GitHub issue or evidence comment;
6. safety and value close.

The final video must be public, in English, hosted on YouTube or Vimeo, and under three minutes. Use only footage and audio Jih has the right to publish.

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

- GitHub's license API reports MIT for the root `LICENSE` file.
- Confirm all source, assets, and instructions required to run are included.
- Enter the Open Source mini challenge only if all of its additional requirements are met.

The private reviewer path is no longer the chosen route. It would have meant sharing a private repository with `testing@devpost.com` and `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, and `emersonsklar`.

## Submission checklist

### Working project

- [x] The final code calls Bee technology in code, not only in documentation.
- [ ] A real Bee conversation reaches a useful user-facing result.
- [ ] Setup works from a clean checkout using repository instructions.
- [x] `npm run typecheck` passed.
- [x] `npm test` recorded 8 passes and 2 live-model skips.
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

- [ ] Video is public on YouTube or Vimeo.
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
