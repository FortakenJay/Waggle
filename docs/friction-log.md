# Optional friction log

Use one entry for each observed point of friction. Devpost says friction logs can earn an additional judging bonus, but an empty honest template is better than invented difficulty.

## How to record an entry

Capture the entry while the context is fresh. Include exact commands or endpoint names when safe, remove tokens and personal data, and distinguish a product problem from a mistake in this project's code.

Severity guide:

- **Critical** — blocks the required submission path with no workable alternative.
- **High** — blocks an important task; a costly or fragile workaround exists.
- **Medium** — the task succeeds, but only after avoidable investigation or repetition.
- **Low** — minor confusion or polish issue with little effect on completion.

## Entry template

Copy this section for each observation.

### `[Short factual title]`

- **Tool / API / SDK:** `[name and relevant version if known]`
- **Task attempted:** `[the user goal, not only the command]`
- **Starting state:** `[environment or prerequisite facts needed to reproduce]`
- **Steps taken:**
  1. `[first action]`
  2. `[next action]`
  3. `[continue only as needed]`
- **Expected:** `[specific behavior expected and why]`
- **Actual:** `[what was directly observed; quote a safe error when useful]`
- **Severity:** `critical | high | medium | low`
- **Impact:** `[what became blocked, slower, unsafe, or unclear]`
- **Workaround:** `[what worked, or “None found”]`
- **Actionable suggestion:** `[a concrete documentation, API, CLI, error-message, or product change]`
- **Evidence:** `[safe command output, screenshot filename, issue reference, or note; do not invent a URL]`
- **Resolution status:** `open | worked around | resolved | needs retest`
- **Retest result:** `[leave pending until rerun]`

## Quality check

- [ ] The entry describes one task and one main friction point.
- [ ] Steps are reproducible and free of secrets.
- [ ] Expected and actual behavior are different and specific.
- [ ] Severity matches user impact.
- [ ] The workaround was actually attempted.
- [ ] The suggestion tells the product team what to change.
- [ ] Evidence exists or the entry clearly says it was not captured.
- [ ] A later fix is not marked resolved until it is retested.

## Recorded entries

None yet.
