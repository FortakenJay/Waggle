# Product brief

## The name

Bees do a waggle dance to tell the hive where to go. Waggle is named for that dance. It hears a spoken request and points the request at the repository where the work belongs.

## The problem

Software work is often discovered away from the issue tracker. A teammate describes a bug in conversation, a client repeats a request, or a developer says a reminder aloud. Bee preserves the conversation, but the useful work can still disappear into a transcript.

Waggle turns those spoken moments into reviewed GitHub issue actions. It is a personal bridge between Bee and the repositories where work is planned.

## Who it is for

The primary audience is a developer who:

- records real conversations with Bee or an Apple Watch running Bee;
- works across more than one GitHub repository;
- hears actionable work from teammates, classmates, professors, clients, or themself;
- wants fewer lost requests without giving a model unrestricted permission to guess.

The current product is intentionally personal and local. It is not presented as a team-wide intake platform.

## Value

The core promise is concrete:

> Finish a Bee conversation, preserve the speaker's exact words, and turn each supported software request into either a well-routed issue, evidence on an existing issue, or an explicit item awaiting review.

This supports two hackathon-relevant use cases:

- **Developer experience:** less manual transcription between a conversation and GitHub.
- **Personal productivity:** spoken commitments do not depend on memory or a later note-taking pass.

No user-research result or time-saving metric has been established yet.

## Product principles

1. **Uncertainty stays visible.** An inbox item is better than a confident ticket in the wrong repository.
2. **The source survives translation.** Ticket prose may be English, while supporting quotes remain verbatim.
3. **Repeated demand becomes evidence.** A covered request adds context to an open issue instead of adding tracker noise.
4. **Writes are deliberate and recoverable.** Live GitHub changes require credentials and the absence of `--dry-run`; ambiguous retries use persisted operation records and markers.
5. **The repository map belongs to the user.** Discovery, pins, exclusions, and aliases replace hardcoded products.

## Scope

The intended working slice includes:

- reading saved fixtures or Bee conversations;
- listening for completed Bee conversations;
- discovering eligible GitHub repositories and building cached routing profiles;
- extracting, merging, splitting, and routing software work with Claude;
- validating model output at runtime;
- queuing uncertain work for manual assignment or removal;
- comparing candidates with open issues;
- previewing, creating issues, or adding evidence comments;
- keeping local state for retry safety and processed-conversation handling.

## Non-goals

- A graphical interface or hosted multi-user service
- General meeting summarization
- Automatic project-board planning, assignees, milestones, or due dates
- Closing, editing, or deleting GitHub issues
- Treating every Bee todo or every spoken idea as repository work
- Claiming exactly-once delivery across all possible failures
- Supporting Fire TV, Alexa+, or Ring as primary tracks
- Entering the AWS Builder or Open Source mini challenge without an explicit decision and the required evidence

## Product stage

The repository has been generalized from a product-specific prototype. Typechecking and local tests pass, and verified terminal captures document the command surface and empty-inbox behavior. Live Claude fixture results, real repository discovery, a Bee-to-GitHub demonstration, and final submission evidence are still pending.
