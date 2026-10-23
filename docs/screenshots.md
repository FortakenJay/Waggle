# Terminal captures and screenshot shot list

Two publishable terminal captures are now generated directly from successful command output:

- `docs/images/cli-help.svg` — `waggle --help`
- `docs/images/inbox-empty.svg` — `waggle inbox --dry-run`

They are embedded in the README. Run `scripts/capture-cli.mjs` to regenerate them from the implementation; the files are not hand-authored output mocks.

End-to-end processing is not verified, so the product-result captures below remain pending.

Capture a shot only after the named command succeeds with safe data. Save the exact command and verification note beside the image.

## 1. Repository map

- **Command:** `npm start -- repos`
- **What it should prove:** routing is based on discovered profiles rather than hardcoded products.
- **Frame:** command plus two or three fictional or publishable repository profiles.
- **Before capture:** confirm no private repository names, descriptions, aliases, local paths, or usernames are visible.
- **Status:** pending.

## 2. Verbose fixture preview

- **Command:** `GITHUB_TOKEN= npm start -- fixture fixtures/robotics-team.json --dry-run --verbose`
- **What it should prove:** a GitHub-ready draft can retain verbatim source while dry-run blocks the write.
- **Frame:** dry-run indicator, destination repository, action, title, criteria, and one safe source quote.
- **Before capture:** verify the fixture is fictional, the output matches the final CLI, and no environment value appears.
- **Status:** pending.

## 3. Review inbox

- **Command:** `npm start -- inbox`
- **What it should prove:** uncertain routing becomes an explicit review task.
- **Frame:** one fictional numbered item with title and reason.
- **Before capture:** use a fixture-created entry or inspect every conversation field for private content.
- **Status:** empty-inbox behavior captured; a populated review item is still pending.

## 4. Dedupe outcome

- **Command:** a verified fixture or Bee preview against a safe repository with a prepared open issue.
- **What it should prove:** a repeated outcome becomes an evidence comment rather than a second issue.
- **Frame:** CLI decision and the matching GitHub issue or resulting comment.
- **Before capture:** confirm the issue, account, repository, and source quote can be published.
- **Status:** pending.

## 5. Live Bee path

- **Command:** `npm start -- watch` with the approved live-write or preview setup.
- **What it should prove:** real Bee data triggers the product workflow.
- **Frame:** a safe Bee conversation completion, CLI processing, and useful result.
- **Before capture:** obtain consent from any speaker, keep tokens and raw debug output off screen, and use a demo repository.
- **Status:** pending.

## Capture rules

1. Use real terminal and GitHub output, not a designed mock.
2. Crop for legibility without hiding an error that changes the meaning.
3. Redact only when the redaction does not remove the evidence being claimed.
4. Prefer fictional fixtures for static documentation and real Bee data for the required video proof.
5. Write descriptive alt text naming the action and result.
6. Add an image reference to the README only after the file exists and has been reviewed.
7. Record the command, source revision, and whether the run was dry or live.

## Suggested filenames

- `docs/images/repos.png`
- `docs/images/fixture-preview.png`
- `docs/images/inbox-item.png`
- `docs/images/dedupe-comment.png`
- `docs/images/live-bee.png`

The pending files do not need to exist until their commands are approved and verified.
