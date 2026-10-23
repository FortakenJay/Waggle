---
name: cli-ux-documentation
description: Designs the Waggle terminal experience and writes approachable, narrative documentation with truthful diagrams and screenshots. Use for CLI text, README files, guides, demos, diagrams, and release documentation in this repository.
---

# CLI UX and documentation

## Make the terminal experience calm

- Lead with what happened and what the user can do next.
- Use consistent verbs: discover, extract, review, assign, create, comment.
- Distinguish previews, local changes, and GitHub writes visibly.
- Include the repository and action in write previews.
- Make errors actionable without exposing tokens or raw authorization data.
- Keep `--help` scannable and show one realistic example per workflow.

## Write like a thoughtful human

Use a practical Medium-style voice: begin with the problem, explain the idea through a concrete example, then provide the reference details. Prefer short paragraphs and specific language over slogans.

- Use first or second person when it makes instructions clearer.
- Explain why a safety mechanism exists before naming its implementation.
- Avoid filler such as “powerful,” “seamless,” “revolutionary,” or “simply.”
- Do not claim a command was tested unless it actually ran.
- Keep setup and command reference easy to find even when the opening is narrative.
- Link deeper product, safety, architecture, demo, and submission detail through `docs/README.md`.

## Use visuals only when they clarify

- Use Mermaid for architecture, sequence, and state transitions.
- Keep node labels short and match names used in the code.
- Capture screenshots from real commands after redacting secrets and personal repository names.
- Add descriptive alt text and a nearby sentence explaining what the reader should notice.
- Never substitute a designed mockup for actual terminal output without labeling it as illustrative.
- Keep pending captures in `docs/screenshots.md`; do not add a README image reference until the file exists and has been reviewed.

## Keep submission evidence honest

- A source file is not proof that a workflow completed.
- Label target behavior and pending verification explicitly while integration is in progress.
- A fixture can explain behavior but cannot replace the Bee track's live-data proof.
- Never invent successful output, metrics, feedback, friction, dates, links, or screenshots.
- Leave the public-license versus private-reviewer path open until Jih decides.

## Review before publishing

Check that:

- Every command matches the implemented CLI.
- Config examples match the runtime schema.
- Diagram arrows match the real data flow.
- Screenshots are current, legible, and free of secrets.
- Links work from the README and from files under `docs/`.
- The four-step demo can be followed without reading the implementation.
- Devpost copy, video narration, README claims, and actual CLI behavior agree.
