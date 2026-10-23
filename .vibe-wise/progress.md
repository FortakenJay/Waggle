# Progress

## Current goal

Generalize Waggle from a fixed two-product prototype into a personal GitHub ticket creator that can route spoken work to any eligible repository.

## Decisions locked

- Repository profiles are discovered and cached under `~/.waggle/`.
- The product and command are named Waggle, after the waggle dance that tells the hive where to go.
- Config aliases override inferred routing.
- Unknown and low-confidence candidates go to a local inbox.
- GitHub retries use a local operation ledger and invisible operation markers.
- Dry-run blocks GitHub mutations.
- Documentation should use an approachable, narrative voice with truthful diagrams and terminal captures.
- The public repository uses the MIT license. Copyright holders: Jih Bin Luo and Justin Meng.

## Work status

- Core implementation: complete and reviewed against the specification.
- Project engineering, CLI documentation, and product-management skills: added.
- README, product brief, architecture, safety, demo, roadmap, decision wiki, and Devpost materials: drafted.
- Verified help and empty-inbox terminal captures: added; product-result screenshots remain pending.
- Product feedback and friction log: structured; actual observations pending.
- Typecheck and local tests: passed; 2 live-Claude tests skipped without a key.
- Fixture dry-runs: reached extraction and stopped at the missing Anthropic key.
- Legacy product scan: clean under `src/`.
- External Bee, Claude, repository-refresh, and GitHub workflows: pending credentials and safe demo data.

## Open decisions

- Choose a safe live Bee conversation and GitHub repository for the video.
- Decide whether to enter any mini challenge after the required evidence exists.
- Set success targets only after recording a baseline.
