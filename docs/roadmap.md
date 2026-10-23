# Roadmap, risks, and success

This roadmap describes sequence, not promised dates.

## Now: prove the complete path

- ~~Finish the repo-agnostic CLI and remove product-specific behavior.~~
- ~~Validate package setup, typechecking, and local tests.~~
- Run both fixture previews with a live Anthropic key.
- Exercise repository refresh and inbox workflows with safe test data.
- Run one live Bee-to-GitHub demonstration without exposing secrets or private repository names.
- Capture only the terminal and GitHub screens that were actually produced.
- Complete the Devpost fields, product feedback, and repository-access choice.

Verification status: **partial** — typechecking passed; 8 local tests passed; 2 live-Claude tests skipped; CLI help and empty-inbox commands passed; the source scan is clean. External-service workflows remain pending.

## Next: make daily use dependable

- Observe routing quality across Jih's real mix of repositories.
- Record false routes, missed requests, duplicate decisions, and inbox outcomes.
- Improve recovery messages and operator guidance from observed friction.
- Decide how cache staleness should be communicated.
- Decide whether operation history needs a supported inspection command.

These are directions, not committed features.

## Later: expand only from evidence

Possible areas include richer routing controls, project-management integrations, and a more guided review experience. None is in scope until real use shows that it solves a repeated problem better than the local CLI.

## Risks and mitigations

### A model routes work to the wrong repository

Impact: unwanted tracker noise or disclosure to the wrong repository.

Current mitigation: cached repository profiles, aliases, confidence thresholds, runtime membership checks, and the local inbox.

Evidence still needed: live fixture and real-conversation routing results.

### A network failure makes a GitHub write ambiguous

Impact: a retry could create duplicate work.

Current mitigation: persist an operation before writing, embed an opaque marker, reconcile the marker, then record completion.

Evidence still needed: tests or a controlled failure exercise covering reconciliation.

### A dry-run is mistaken for a read-only process

Impact: local files may change even though GitHub does not.

Current mitigation: document dry-run as a GitHub-write boundary and list allowed local effects.

Observed evidence: the empty-inbox command visibly entered dry-run. Mutation attempts and local-write behavior still need dedicated command-level verification.

### Repository discovery exposes more context than expected

Impact: repository names, descriptions, topics, languages, and README excerpts are sent to Claude to build profiles.

Current mitigation: exclusions, a local cache, bounded README excerpts, and narrowly scoped credentials.

Open decision: whether the README should add stronger operator guidance for sensitive repositories.

### Transcript material appears in logs or issues

Impact: personal or confidential conversation data may be shared.

Current mitigation: verbatim quotes are intentional issue evidence; raw payload logging requires `--debug`; documentation prohibits secret-bearing screenshots.

Evidence still needed: inspect actual debug and verbose output before publishing any capture.

### The demo depends on several external systems

Impact: Bee proxy, Anthropic, GitHub, or the network can fail during judging.

Current mitigation: prepare the repository cache and use a fixture for the deterministic part of the story, while still showing live Bee data as required by the Bee track.

Open decision: which live conversation and repository are safe to show.

## Success measures

No baseline or measured result exists yet. The first evaluation should record:

- **Capture:** which clearly requested software work items were accepted, sent to review, or missed.
- **Routing:** which accepted items reached the intended repository without manual correction.
- **Provenance:** whether every published source quote exactly matches a transcript utterance.
- **Dedupe:** whether repeated requests strengthen the correct open issue without merging merely related work.
- **Safety:** whether every GitHub mutation is blocked in dry-run and every malformed or uncertain decision fails closed.
- **Recovery:** whether a repeated operation resolves to one GitHub result after an ambiguous failure.
- **Usability:** whether Jih can explain and complete setup, preview, review, and live-write workflows from the documentation.

Targets should be set only after the first recorded baseline. Do not convert fixture expectations into user metrics.
