---
name: waggle-product-management
description: Maintains Waggle product briefs, scope, roadmap, decision records, Devpost submission material, success measures, product feedback, and friction logs. Use for product strategy, project wiki updates, hackathon positioning, and evidence-based release or submission claims in this repository.
---

# Waggle product management

## Separate fact from intent

Use these labels consistently:

- **Established:** chosen by Jih or present in the repository.
- **Proposed:** an option awaiting Jih's decision.
- **Verified:** directly observed through a named check.
- **Open:** a consequential choice or fact still missing.

Code presence is not workflow verification. Never invent research, metrics, dates, output, feedback, friction, screenshots, links, or submission completion.

## Maintain the product record

Keep `docs/project-log.md` as the decision wiki. For each consequential choice, record:

1. the choice;
2. why it was made;
3. alternatives and tradeoffs;
4. consequences;
5. verification status.

Update an existing record when a decision evolves. Preserve its earlier rationale instead of rewriting history as if the final choice was obvious.

## Keep product documents aligned

- `docs/product-brief.md`: problem, audience, value, principles, scope, and non-goals
- `docs/roadmap.md`: sequence, risks, mitigations, success measures, and evidence gaps
- `docs/devpost-submission.md`: final-field drafts and an unchecked evidence checklist
- `docs/product-feedback.md`: actual tool feedback only after direct use
- `docs/friction-log.md`: one reproducible observed friction per entry
- `README.md`: human narrative plus an accurate operating reference

When behavior changes, update every affected document without copying large explanations between them.

## Protect Jih's product decisions

Jih owns positioning, scope, metrics, license, repository visibility, mini-challenge entry, and roadmap commitments. Present additions as:

- **Detail:** what is known;
- **Proposal:** the option;
- **Why it matters:** the consequence of deciding.

Do not convert a proposal into a committed roadmap item.

## Write credible success measures

Define what would be observed before assigning a target. For this product, useful categories include capture, routing, quote provenance, dedupe, dry-run safety, retry recovery, and setup usability.

Fixture expectations are test contracts, not user-impact metrics. Set numeric targets only after a baseline exists and Jih chooses the target.

## Prepare hackathon material

Keep Bee as the primary track unless Jih changes it. Developer experience and personal productivity are relevant use cases.

Before marking a requirement complete, name its evidence:

- command and result;
- test and result;
- repository file;
- reviewed screenshot;
- live demo segment;
- confirmed external access.

A fixture can explain behavior, but Bee-track evidence must show real Bee data doing something useful for a person.

Do not add a license or claim private reviewer access until Jih chooses and completes that path. Do not claim AWS Builder or Open Source entry without the required integration and submission evidence.

## Collect feedback without leading it

For each tool, ask what it was used for, what worked, what needs work, how onboarding felt, and whether Jih would use it again. Ask for the observed moment behind each answer.

For friction, record task, steps, expected behavior, actual behavior, severity, impact, workaround, actionable suggestion, evidence, and retest status. An empty template is preferable to a plausible invented entry.

## Review before handoff

- Every claim has a source or is labeled pending.
- README commands match the implemented CLI.
- Scope and non-goals do not conflict.
- Roadmap items are not presented as completed.
- Decision records retain alternatives and consequences.
- Devpost copy matches the repository and video.
- Product feedback reflects direct use.
- Open questions clearly name the decision Jih must make.
