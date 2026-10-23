---
name: waggle-engineering
description: Implements and reviews the Waggle TypeScript CLI with its GitHub safety, Claude validation, Bee API, routing, inbox, and idempotency rules. Use for source changes, tests, bug fixes, and reviews in this repository.
---

# Waggle engineering

## Preserve the trust boundaries

Treat Bee transcripts, Claude tool output, local JSON, and GitHub responses as untrusted input.

- Validate model output at runtime before routing or writing.
- A missing or malformed dedupe decision must never become “create a new issue.”
- Only accept a duplicate issue number that came from the current GitHub query.
- Keep quotes verbatim and verify they occur in the normalized transcript.
- Never print tokens or authorization headers.

## Keep writes safe

- Route every GitHub mutation through `src/github.ts`.
- Honor dry-run at the mutation boundary, not only in the CLI.
- Persist a planned operation before its external write.
- Reconcile the operation marker before retrying an ambiguous write.
- Record each successful issue or comment immediately; do not wait for a batch to finish.
- Update local JSON atomically and preserve the single-writer lock.

## Keep the project general

- Do not hardcode product or repository names under `src/`.
- Use cached repository profiles and config aliases for routing.
- Aliases override inferred routing.
- Unknown, conflicting, or low-confidence routes go to the inbox.
- A pinned inactive repository is routable; an archived repository is not.

## Work within the module boundaries

- `bee.ts`: Bee REST, normalization, debug payload, and SSE.
- `repos.ts`: config, GitHub discovery, profile generation, and routing context.
- `extract.ts`: candidate extraction and runtime validation.
- `dedupe.ts`: duplicate classification and validation.
- `github.ts`: GitHub reads, rendering, labels, writes, and reconciliation.
- `inbox.ts`: local review queue.
- `state.ts`: paths, atomic persistence, locks, and operation ledger.
- `index.ts`: CLI parsing and orchestration.

Prefer small exported functions and dependency injection where it makes dry-run or tests easier to prove.

## Verify changes

Run:

```bash
npm run typecheck
npm test
```

For pipeline changes, also run both fixtures with `--dry-run --verbose`. If a live-model test is skipped because `ANTHROPIC_API_KEY` is absent, report the skip instead of presenting it as a pass.

The bundled fixture repositories are fictional. Clear `GITHUB_TOKEN` for fixture runs so validation does not attempt issue reads against those names:

```bash
GITHUB_TOKEN= npm start -- fixture fixtures/robotics-team.json --dry-run --verbose
GITHUB_TOKEN= npm start -- fixture fixtures/solo-mixed.json --dry-run --verbose
```
