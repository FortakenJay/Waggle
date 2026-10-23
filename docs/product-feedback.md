# Product feedback

Devpost requires feedback for every tool, API, or SDK used. This file separates known usage from observations that still require Jih's direct experience.

Do not submit bracketed prompts. Replace them with specific evidence from setup, implementation, or demo rehearsal.

## Bee CLI, local proxy, and conversation API

### What it was used for

The intended integration runs `bee proxy`, reads `/v1/conversations` and `/v1/conversations/:id`, and listens to the SSE stream for conversation completion or summary updates. The complete Bee conversation becomes the source for extraction and GitHub issue evidence.

### What worked well

`[Record a directly observed capability and the task it enabled.]`

### What needs work

`[Record a directly observed limitation. Include the endpoint, command, or documentation area when possible.]`

### How onboarding felt

`[Describe the actual steps taken, where guidance was clear, and where Jih had to investigate.]`

### Would Jih build with it again?

`[Yes / no / depends, followed by a concrete reason.]`

### Evidence

`[Name the command, payload observation, or demo segment supporting this feedback.]`

Status: **pending live Bee verification**.

## Anthropic API and TypeScript SDK

### What it was used for

Claude is used for bounded repository profiles, structured ticket extraction and routing, and conservative duplicate classification. Each workflow requests a tool result and validates the returned value at runtime.

### What worked well

`[Record an observed result, not an expectation from the prompt design.]`

### What needs work

`[Record model, SDK, error, latency, or structured-output friction actually encountered.]`

### How onboarding felt

`[Describe key setup, documentation, and first successful call only after they occur.]`

### Would Jih build with it again?

`[Yes / no / depends, followed by where model inference was or was not a good fit.]`

### Evidence

`[Point to a test, fixture run, or captured failure without exposing prompts containing private data.]`

Status: **pending live-model verification**.

## GitHub REST API and Octokit

### What it was used for

The project discovers repositories, reads bounded README context and open issues, preflights labels, creates issues, adds evidence comments, and searches for operation markers after ambiguous writes.

### What worked well

`[Record an observed API or SDK strength.]`

### What needs work

`[Record actual permission, pagination, error, idempotency, or documentation friction.]`

### How onboarding felt

`[Describe fine-grained token setup and the first authenticated workflow after testing it.]`

### Would Jih build with it again?

`[Yes / no / depends, followed by a concrete reason.]`

### Evidence

`[Name the safe repository operation or test that produced the observation.]`

Status: **pending authenticated verification**.

## Node.js and TypeScript toolchain

### What it was used for

Node.js runs the local CLI. TypeScript implements the trust boundaries and command flow; `tsx` runs source during development, npm manages packages and scripts, Vitest provides local and live-model test entry points, and dotenv loads local configuration.

### What worked well

`[Record only what was observed while installing, running, typechecking, or testing.]`

### What needs work

`[Record actual runtime, package, type-system, test-runner, or setup friction.]`

### How onboarding felt

`[Describe the clean-checkout experience after it has been performed.]`

### Would Jih build with it again?

`[Yes / no / depends, with the part of the toolchain that drives the answer.]`

### Evidence

`[Name the install, help, typecheck, test, or fixture command supporting the feedback.]`

Status: `npm start -- help` verified; clean setup, typecheck, tests, and fixture processing pending.

## AWS services

No AWS integration is established in the current product. Leave AWS Builder unselected unless the final repository contains and documents a real AWS integration. If that changes, add each service here with its purpose and direct feedback.

## Optional feature requests

Add one section per request:

```text
Tool or API:
Requested capability:
Problem it would solve:
Who it affects:
Evidence:
Urgency: critical | important | nice-to-have
Suggested behavior:
```

Urgency describes the impact on the workflow, not enthusiasm. Do not add a request until the underlying need has been observed.

## Final feedback check

- [ ] Every external developer tool, API, and SDK in the submitted build appears here.
- [ ] Each positive and negative claim has direct evidence.
- [ ] Onboarding describes what Jih actually did.
- [ ] “Would build again” includes a reason.
- [ ] Any feature request includes urgency and observed need.
- [ ] No token, private payload, repository name, or transcript is exposed.
