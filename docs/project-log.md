# Project log

This is the durable decision wiki for Waggle. Each record keeps the choice, its reason, rejected or deferred alternatives, consequences, and current verification state. Update an existing record when understanding changes; add a new record when a new consequential choice is made.

Verification labels:

- **Decision recorded** — the choice is established, but behavior may not be implemented.
- **Present in source** — relevant code exists; this does not prove the complete workflow.
- **Verified by run** — a named check completed successfully.
- **Open** — Jih still needs to decide.

Local verification now records a passing typecheck, 8 passing local tests, 2 skipped live-Claude tests, a clean legacy-name scan, and successful help and empty-inbox commands. Both fixture commands reached extraction and stopped because no Anthropic key is available. External-service workflows remain unverified.

## Product and submission

### D001 — Generalize beyond two products

- **Choice:** Discover and route across eligible repositories instead of hardcoding two products.
- **Reason:** Jih wants one personal capture tool for spoken work across any of their repositories.
- **Alternatives / tradeoffs:** Static repository mappings are simpler but require source edits and do not scale with a changing portfolio.
- **Consequences:** Routing needs repository discovery, profiles, configuration, caching, and an explicit unknown path.
- **Verification:** Repository-profile modules and CLI orchestration are present; command execution remains unverified.

### D002 — Keep the product local and CLI-first

- **Choice:** Polish the terminal workflow and documentation rather than add a graphical interface.
- **Reason:** The useful path is Bee → local processing → GitHub; a GUI is not required to prove it.
- **Alternatives / tradeoffs:** A GUI could guide setup, but adds scope and another security surface.
- **Consequences:** Help text, previews, errors, guides, and terminal captures carry the experience.
- **Verification:** Decision recorded; CLI UX has not been exercised end to end.

### D003 — Enter the Bee track

- **Choice:** Position bee-tickets for the primary Bee track, with developer-experience and personal-productivity relevance.
- **Reason:** The project uses real Bee conversation data to preserve spoken software work.
- **Alternatives / tradeoffs:** No other primary track is part of the current product. Mini challenges add evidence and submission requirements.
- **Consequences:** Code and video must show actual Bee data doing useful work; a fixture alone is not sufficient submission evidence.
- **Verification:** Submission positioning recorded; live Bee demonstration pending.

### D004 — Keep product claims evidence-based

- **Choice:** Do not invent research, metrics, API friction, command results, screenshots, dates, or URLs.
- **Reason:** Submission quality depends on credibility and reproducibility.
- **Alternatives / tradeoffs:** Placeholder success claims make copy look complete but create false evidence.
- **Consequences:** Unknowns are labeled, feedback uses a fill-after-use format, and README captures must come from commands that actually ran.
- **Verification:** Applied to the current documentation.

## Repository map and routing

### D005 — Discover owned and collaborator repositories

- **Choice:** Query the authenticated GitHub account for owned and collaborator repositories that are non-archived and recently pushed.
- **Reason:** The routing map should follow the developer's real portfolio without source edits.
- **Alternatives / tradeoffs:** Asking for a fixed list avoids discovery calls but recreates hardcoding in configuration.
- **Consequences:** GitHub metadata becomes an input trust boundary; pagination and narrowly scoped credentials matter.
- **Verification:** Discovery code is present; authenticated execution pending.

### D006 — Use a 12-month activity window

- **Choice:** Include repositories pushed within the previous 12 months by default.
- **Reason:** It bounds profile work and reduces routing noise from dormant repositories.
- **Alternatives / tradeoffs:** All repositories provide maximum coverage at higher cost and ambiguity; a shorter window can hide valid projects.
- **Consequences:** Inactive but relevant repositories need a pin.
- **Verification:** Present in source; discovery result not yet observed.

### D007 — Pins include inactive repositories, never archived ones

- **Choice:** A pinned repository bypasses the activity window. Archived repositories remain unavailable.
- **Reason:** Jih chose pins as an inclusion mechanism for quiet projects without allowing writes to archived work.
- **Alternatives / tradeoffs:** “Favorite only” would rank recent repositories without restoring inactive ones; “include and favor” would bias uncertain model routing.
- **Consequences:** Refresh must fetch pinned repositories and fail clearly when a pin is unavailable or archived.
- **Verification:** Present in source; authenticated refresh pending.

### D008 — Exclusions and conflicts fail closed

- **Choice:** Excluded repositories are removed; a repository cannot be both pinned and excluded, and an alias cannot target an excluded or unavailable repository.
- **Reason:** Contradictory routing policy should not be silently resolved.
- **Alternatives / tradeoffs:** Precedence rules are more permissive but hide configuration mistakes.
- **Consequences:** Invalid configuration stops refresh with an actionable error.
- **Verification:** Validation code is present; the conflicting pin/exclude case passes in the local test suite.

### D009 — Aliases override inferred routing

- **Choice:** User-defined phrases such as “the robot” deterministically select one cached repository.
- **Reason:** The user's vocabulary is stronger evidence than model inference.
- **Alternatives / tradeoffs:** Treating aliases as prompt hints preserves model flexibility but weakens predictability.
- **Consequences:** Multiple conflicting alias matches fail validation rather than choosing one.
- **Verification:** Matching and conflict code is present; fixture coverage pending.

### D010 — Build and cache small repository profiles

- **Choice:** Send repository name, description, topics, primary language, and a bounded README excerpt to Claude; cache a short summary and signal list locally.
- **Reason:** Full repository contents are unnecessary for routing, while names alone are often too weak.
- **Alternatives / tradeoffs:** Fetching code could improve context but increases cost and disclosure; hand-written profiles increase maintenance.
- **Consequences:** `repos.json` is refreshable derived data and sensitive repository metadata may leave the machine during profiling.
- **Verification:** Profile generation and cache validation code are present; live profile generation pending.

## Extraction, review, and dedupe

### D011 — Use tool-forced structured extraction

- **Choice:** Claude returns bounded ticket fields for bugs, features, tasks, and questions.
- **Reason:** GitHub actions need inspectable structure rather than free-form prose.
- **Alternatives / tradeoffs:** Plain-text parsing is looser and harder to validate; rule-only extraction misses conversational phrasing.
- **Consequences:** The application still treats model output as untrusted runtime data.
- **Verification:** Present in source; live-model tests pending.

### D012 — Capture requests from any speaker without promoting every idea

- **Choice:** Teammates, classmates, professors, clients, and Jih speaking to themself can all be requesters. Another speaker's idea counts only when it is clearly a request or Jih agrees; Jih's own “I need to,” “I should,” and “remind me” statements count.
- **Reason:** The product exists to preserve actionable spoken work, not only client instructions.
- **Alternatives / tradeoffs:** Ignoring the developer's own voice reduces false positives but misses reminders and self-directed tasks.
- **Consequences:** Extraction must distinguish concrete work from unsupported ideas, small talk, scheduling, and billing.
- **Verification:** Prompt behavior and `DEV_NAME` configuration are present; live outcomes pending.

### D013 — Merge repeats, split independent outcomes, preserve quotes

- **Choice:** Repeated descriptions of one outcome become one candidate; independent outcomes become separate candidates; authored fields are English while source utterances stay verbatim.
- **Reason:** This produces actionable issues without erasing provenance or multilingual context.
- **Alternatives / tradeoffs:** One utterance per ticket is deterministic but noisy; summarizing quotes loses source fidelity.
- **Consequences:** Every quote must exactly match a normalized transcript utterance.
- **Verification:** Validation code is present; fixture expectations and live extraction pending.

### D014 — Route uncertainty into a local inbox

- **Choice:** Unknown, low-routing-confidence, low-extraction-confidence, or malformed candidates do not reach GitHub automatically.
- **Reason:** A visible review item is safer than a plausible wrong write.
- **Alternatives / tradeoffs:** Dropping uncertain work is quieter but can lose requests; always choosing the best repository creates false confidence.
- **Consequences:** The inbox supports list, manual assignment to a cached repository, and removal. Assignment reuses the normal dedupe and write path.
- **Verification:** Inbox persistence, numeric assignment validation, and CLI commands are present. The empty-inbox dry-run command passed; populated assignment remains pending.

### D015 — Define duplicates by satisfied outcome

- **Choice:** A candidate duplicates an open issue only when completing that issue would fully satisfy the candidate.
- **Reason:** Related work should not be merged merely because it shares a topic.
- **Alternatives / tradeoffs:** Similarity thresholds are cheaper but over-merge; never deduping creates tracker noise.
- **Consequences:** A duplicate becomes an evidence comment, while a new outcome becomes an issue.
- **Verification:** Classifier and validation code are present; the no-open-issues path passes locally; live model decisions remain pending.

### D016 — Bound and validate dedupe decisions

- **Choice:** Compare against paginated open issues in bounded batches; require one valid decision per candidate; only accept issue numbers from the current batch; fail on conflicting matches.
- **Reason:** Prompt size must stay bounded and malformed output must never default to “create.”
- **Alternatives / tradeoffs:** Sending every issue at once is simpler but unbounded; defaulting missing decisions to new work risks duplicates.
- **Consequences:** Some large or ambiguous repositories will stop noisily and require review.
- **Verification:** Present in source; test and command verification pending.

## GitHub writes and local safety

### D017 — Keep GitHub mutations behind one boundary

- **Choice:** Issue creation, comments, and label creation go through `src/github.ts`.
- **Reason:** Dry-run is safer when enforced where external mutations occur, not only in command parsing.
- **Alternatives / tradeoffs:** Per-command checks are convenient but easy to omit in a new branch.
- **Consequences:** No other module should call a mutating GitHub endpoint.
- **Verification:** New mutation functions and CLI orchestration use the centralized boundary; the source scan is clean. A live mutation test remains pending.

### D018 — Require both a token and no `--dry-run` for live writes

- **Choice:** `GITHUB_TOKEN` must be present and `--dry-run` must be absent before GitHub can change.
- **Reason:** Credentials establish capability; the flag provides explicit preview control.
- **Alternatives / tradeoffs:** Treating a missing token as an immediate error is more explicit but prevents extraction-only previews. Making fixtures permanently safe would create inconsistent command semantics.
- **Consequences:** The CLI automatically enters dry-run when the token is absent. A fixture can write live when both conditions are met, so documentation still shows fixture previews with `--dry-run`.
- **Verification:** CLI parsing and mutation guards implement both gates; command execution pending.

### D019 — Define dry-run as “no GitHub mutations”

- **Choice:** Dry-run can read Bee, call Claude, read GitHub, refresh local profiles, update the inbox, and persist planned operations, but cannot create labels, issues, or comments, mark operations applied, or mark a conversation processed.
- **Reason:** Useful previews need real routing and dedupe context, while the external side effect remains blocked.
- **Alternatives / tradeoffs:** A fully read-only mode is easier to explain but cannot prepare caches or preserve uncertain work.
- **Consequences:** Users must not treat dry-run as “no local files changed.”
- **Verification:** Mutation guards and local dry-run flow are present; complete command verification pending.

### D020 — Use labels and source sections consistently

- **Choice:** Issues use kind, `priority:<level>`, and `from-bee` labels; missing labels are preflighted. Issues and repeat comments keep conversation metadata and source quotes.
- **Reason:** The result should be scannable in GitHub and traceable to the Bee conversation.
- **Alternatives / tradeoffs:** No labels reduce permissions and setup, but lose useful triage; copying whole transcripts exposes unnecessary data.
- **Consequences:** Label creation is itself a protected GitHub mutation.
- **Verification:** Rendering and label code are present; live GitHub result pending.

### D021 — Reconcile ambiguous writes with a ledger and marker

- **Choice:** Persist each intended GitHub action first, include an opaque HTML marker in the issue or comment, search for that marker on retry, and then record the result.
- **Reason:** GitHub can accept a write even when the response is lost; local success state alone cannot distinguish that case.
- **Alternatives / tradeoffs:** Save only after success risks duplicate retries; mark success before the request risks lost work.
- **Consequences:** The design improves retry safety but does not claim universal exactly-once delivery.
- **Verification:** Ledger, marker, and lookup code are present; controlled reconciliation test pending.

### D022 — Use atomic local JSON and a single-writer lock

- **Choice:** Store config, profiles, inbox, and operation state under `~/.bee-tickets/` by default; use temporary-file rename and a short lease lock for updates.
- **Reason:** SSE repeats and simultaneous processes can otherwise corrupt or race local state.
- **Alternatives / tradeoffs:** A database gives stronger coordination but is disproportionate for a local CLI; plain writes are simpler but fragile.
- **Consequences:** A live lock asks a second process to retry; a stale lock may be recovered. D030 later moved the default directory to `~/.waggle/` and the override to `WAGGLE_HOME`. The atomic-write and lock choice is unchanged.
- **Verification:** Present in source; concurrency behavior pending.

### D023 — `--force` does not bypass applied operation IDs

- **Choice:** Force may re-run extraction, but it must not make an already applied GitHub operation eligible again.
- **Reason:** Reprocessing a conversation is useful; duplicating known external effects is not.
- **Alternatives / tradeoffs:** A full bypass is easier to understand but unsafe.
- **Consequences:** Deliberately repeating a GitHub write requires a new operation identity or future explicit workflow.
- **Verification:** CLI re-extraction and applied-operation checks are present; retry behavior pending.

## Bee, CLI, tests, and documentation

### D024 — Keep defensive Bee normalization

- **Choice:** Support the documented Bee REST/SSE paths while accepting several observed payload shapes; fetch the complete conversation after completion events.
- **Reason:** Exact field names are not fully documented and summary events can repeat.
- **Alternatives / tradeoffs:** One strict schema fails sooner but is brittle against API shape changes.
- **Consequences:** Repeated completion events rely on idempotency, not on assuming one event.
- **Verification:** Nested Bee payload normalization passes locally; live Bee and SSE verification remain pending.

### D025 — Make raw payload logging explicit

- **Choice:** `--debug` may print one raw Bee payload before normalization.
- **Reason:** It gives Jih evidence needed to fix an unknown payload shape without making raw logging the default.
- **Alternatives / tradeoffs:** Always logging speeds diagnosis but exposes conversation data; never logging makes shape failures opaque.
- **Consequences:** Debug output must be treated as private and must not be used in screenshots without inspection.
- **Verification:** One-time raw payload logging and CLI debug configuration are present; safe live-payload verification pending.

### D026 — Provide one coherent command surface

- **Choice:** Support `fixture`, `conv`, `latest`, `watch`, `repos [refresh]`, and `inbox [assign|drop]`, with preview, verbosity, force, confidence, and debug controls where relevant.
- **Reason:** Each source and review workflow needs a direct, scriptable terminal path.
- **Alternatives / tradeoffs:** Separate binaries reduce parser complexity but fragment setup and help.
- **Consequences:** Help text and documentation must match the implemented parser exactly.
- **Verification:** `npm start -- --help` and the empty-inbox dry-run command passed and match the documented command surface; extraction commands require a live Anthropic key.

### D027 — Verify with generic multilingual fixtures and live-model tests

- **Choice:** Replace product-specific fixtures with fictional generic repositories; typecheck and test the project; skip live extraction tests explicitly when no Anthropic key is available.
- **Reason:** Generalization needs evidence that merge, split, quote, and routing behavior no longer depends on the original products.
- **Alternatives / tradeoffs:** Mock-only tests are deterministic but do not exercise model behavior; live-only tests are costly and variable.
- **Consequences:** A skip is reported as a skip, never a pass.
- **Verification:** Generic fixtures and live-model tests are present. Typechecking passed; 8 local tests passed; 2 live-Claude tests skipped because the key is absent. Both fixture commands stopped explicitly at the missing-key boundary.

### D028 — Write like a practical Medium article

- **Choice:** Lead the README with the human problem and a concrete flow, while keeping setup, configuration, commands, safety, and troubleshooting easy to find.
- **Reason:** The repository must work both as a Devpost narrative and as an operator reference.
- **Alternatives / tradeoffs:** Reference-only docs are fast to scan but undersell the product; marketing-only copy is difficult to run.
- **Consequences:** Supporting detail lives in linked wiki pages.
- **Verification:** Applied to the rewritten documentation; review by Jih pending.

### D029 — Use truthful diagrams and real captures only

- **Choice:** Mermaid arrows must match the data flow. Screenshots are included only after the relevant command runs with safe data.
- **Reason:** A polished mock must not be mistaken for working evidence.
- **Alternatives / tradeoffs:** Designed terminal images are easier to control but weaker proof.
- **Consequences:** Static captures are regenerated from real command output; product-result screenshots still wait for verified safe data.
- **Verification:** The README embeds verified help and empty-inbox terminal captures. Repository, extraction, dedupe, and live-Bee captures remain pending.

### D030 — Name the product Waggle

- **Choice:** The product, installed command, help text, package bin, issue footer, state directory, environment override, and operation marker use Waggle. The default directory is `~/.waggle`. The override is `WAGGLE_HOME`. The marker is `<!-- waggle:op:… -->`. `npm start --` remains the in-repo runner.
- **Reason:** Bees do a waggle dance to tell the hive where to go. Jih named the tool Waggle because it hears a spoken request and points that request at a repository.
- **Alternatives / tradeoffs:** Keeping the command as `bee-tickets` would have preserved the existing state directory and marker, and the docs would have used a different name than the program.
- **Consequences:** A cache already written under `~/.bee-tickets/` is not read. A GitHub issue written with the old marker does not match a retry. The intended public repository is `https://github.com/FortakenJay/Waggle`.
- **Verification:** Typecheck, tests, help, and the empty-inbox capture were re-run after this rename. Results are recorded in the README verification section.

### D031 — Use the MIT license

- **Choice:** License Waggle under MIT. The copyright holders are Jih Bin Luo and Justin Meng, 2026. The alias “Saken Et Al” is not written on the copyright line.
- **Reason:** Jih chose the public repository path and then chose MIT. MIT lets others use, change, and ship the code, including in closed-source projects, if they keep the copyright and license notice.
- **Alternatives / tradeoffs:** Apache-2.0 adds a patent grant. BSD-3-Clause limits use of the authors' names for promotion. GPL-3.0, AGPL-3.0, and MPL-2.0 require sharing source of changes. Unlicense removes the notice requirement. A private repository with reviewer access was the earlier access alternative.
- **Consequences:** The root `LICENSE` file is the text GitHub detects. The Open Source mini challenge remains unselected. The GitHub About label appears after this file is pushed.
- **Verification:** After push, the GitHub license API for `FortakenJay/Waggle` reported SPDX `MIT` for the root `LICENSE` file.

## Open decisions

### O002 — Demo data and repository

Jih needs to choose a Bee conversation and GitHub repository that can be shown publicly without leaking private names, transcript content, or tokens.

### O003 — Success targets

The measures are defined, but thresholds need a first observed baseline and Jih's product judgment.

### O004 — Product feedback and friction

The required feedback headings and optional friction template exist. Actual observations must be added only after Jih uses each tool in the submission workflow.
