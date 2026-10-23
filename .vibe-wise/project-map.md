# Project map

## Purpose

Waggle turns completed Bee conversations into reviewed, deduplicated GitHub issue actions. The name comes from the waggle dance: it hears a spoken request and points it at a repository.

## Planned runtime flow

1. `src/index.ts` parses a command and loads local configuration.
2. `src/bee.ts` loads and normalizes a saved or remote conversation.
3. `src/repos.ts` supplies cached repository routing profiles.
4. `src/extract.ts` asks Claude for structured candidates and validates them.
5. `src/inbox.ts` stores uncertain candidates for manual assignment or removal.
6. `src/dedupe.ts` compares routed candidates with open issues.
7. `src/state.ts` plans and tracks idempotent external operations.
8. `src/github.ts` renders, reconciles, and applies GitHub changes.

## Local data

- `~/.waggle/config.json`: pins, exclusions, and aliases.
- `~/.waggle/repos.json`: generated repository routing profiles.
- `~/.waggle/inbox.json`: candidates awaiting a decision.
- `~/.waggle/state.json`: processed conversations and GitHub operations.

## Verification surfaces

- Two multilingual fixtures under `fixtures/`.
- Live-model extraction tests under `test/`, skipped without an Anthropic key.
- TypeScript strict typechecking.
- Verbose dry-run commands for the documented demo.

## Documentation map

- `README.md`: narrative entry point, setup, command reference, and safety summary.
- `docs/README.md`: wiki navigation and status language.
- `docs/product-brief.md`: problem, audience, value, scope, and non-goals.
- `docs/project-log.md`: choices, reasons, alternatives, consequences, and verification.
- `docs/architecture.md`: data flow, state transitions, trust boundaries, and module map.
- `docs/safety.md`: dry-run, credentials, local state, privacy, and live-write checklist.
- `docs/roadmap.md`: delivery stages, risks, and success measures.
- `docs/demo.md`: four-step demo and under-three-minute video outline.
- `docs/devpost-submission.md`: draft fields and submission checklist.
- `docs/product-feedback.md`: evidence-first feedback prompts.
- `docs/friction-log.md`: optional friction-entry template.
- `docs/screenshots.md`: real-capture shot list and review rules.
