# What dry-run protects—and what it does not

The shortest accurate description is: **dry-run prevents GitHub mutations**.

That boundary lives in the GitHub module, so a missed CLI branch cannot accidentally create an issue, add a comment, or create a label while dry-run is active.

Dry-run is still allowed to do useful local work:

- read Bee conversations;
- call Claude for repository profiles, extraction, and dedupe;
- read repositories and open issues from GitHub when a token is available;
- refresh `~/.waggle/repos.json`;
- add or update uncertain items in `~/.waggle/inbox.json`;
- persist planned, unapplied operations in `~/.waggle/state.json`;
- print the complete issue body with `--verbose`.

It does not mark GitHub operations as applied or mark the conversation processed. Running the same conversation later without `--dry-run` can still create or update the intended issue.

This is the intended boundary and is present in the GitHub write functions. End-to-end CLI verification is still pending.

## When GitHub receives a write

A command can write to GitHub only when both conditions are true:

1. `GITHUB_TOKEN` is present.
2. `--dry-run` is absent.

That includes `fixture`. A fixture is a different source of conversation data, not a permanent safety mode. Keep `--dry-run` in fixture commands unless you deliberately want the saved transcript to create real issues.

When the token is missing, the CLI automatically enters dry-run. Extraction can still run, but GitHub reads are unavailable, so dedupe sees no open issues. That preview is not evidence that a real repository has no matching issue.

`--force` is also not a “write again” switch. It may repeat extraction, but it must not bypass an operation already recorded as applied.

## Local state is part of the safety model

The files under `~/.waggle/` are small JSON documents, but they are not disposable bookkeeping:

- `config.json` contains your routing choices.
- `repos.json` contains generated routing profiles.
- `inbox.json` contains work that still needs a decision.
- `state.json` records processed conversations and GitHub operations.

Writes use a temporary file followed by an atomic rename. A short-lived lock prevents two processes from updating the JSON documents at the same moment.

Deleting `state.json` removes the tool’s memory of completed operations. Existing GitHub markers still help reconcile retries, but deleting state should not be the first troubleshooting step.

Set `WAGGLE_HOME` only when you deliberately want these files in another directory. Do not commit the directory or share it as demo material without inspecting it.

## Data sent to external services

Repository profiling sends Claude the repository name, description, topics, primary language, and a bounded README excerpt. Extraction sends the normalized Bee conversation plus the available repository profiles. Dedupe sends candidate details and bounded open-issue text.

That data flow is necessary to the current design. Exclude repositories whose metadata should not be profiled, and choose demo conversations that can be shown safely.

## Debug output contains conversation data

`--debug` prints one raw Bee payload before normalization. It exists because Bee’s exact field names can vary and the normalizer intentionally accepts several shapes.

Raw payloads can contain names, transcript text, summaries, and timestamps. Capture that output only when diagnosing a payload shape, and review it before sharing.

Tokens are never intentionally printed. If an upstream service includes sensitive material in an error body, treat copied error output as private until you have inspected it.

The same rule applies to `--verbose`: an issue preview intentionally contains source quotes.

## Credential scope

The implementation reads repository metadata and README excerpts, reads open issues, and may create labels, issues, and comments. Use a fine-grained GitHub token limited to the repositories being demonstrated and only the permissions required by those operations.

Never put `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`, or `BEE_TOKEN` in a screenshot, fixture, issue body, debug paste, or committed file.

## Failure behavior

The pipeline fails closed where a wrong decision could create unwanted work:

- malformed extraction goes to review or stops processing;
- ambiguous routing goes to the inbox;
- malformed dedupe output does not default to “new issue”;
- a duplicate target must belong to the issues fetched for that repository;
- a busy operation lease prevents a second process from applying the same action concurrently.

This makes some failures noisier. That is intentional: a visible item waiting for review is safer than a confidently filed issue in the wrong repository.

## Before a live write

1. Preview the same source with `--dry-run --verbose`.
2. Confirm the destination repository and whether the action is `NEW` or evidence on an existing issue.
3. Inspect every source quote for private information.
4. Confirm the GitHub account and token scope.
5. Remove `--dry-run` only for the intended command.
6. Inspect the resulting GitHub item before continuing the demo.
