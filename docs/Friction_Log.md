### Claude will ticket speech that should wait

- **Tool / API / SDK:** Anthropic Claude, through a forced tool result (`record_tickets` in `src/extract.ts`). The model name is `CLAUDE_MODEL`, or `claude-sonnet-5-5` when that variable is unset.
- **Task attempted:** Turn one Bee conversation into candidate tickets, and send to GitHub only the work that is actually a software request for a known repository.
- **Starting state:** A finished Bee transcript, a cache of repository profiles, and a routing floor of 0.60. The ticket has to name a repository or `unknown`, a kind, an English title under 70 characters, a short problem, two to four acceptance checks, a priority, verbatim quotes, the speaker who asked, and a confidence from 0 to 1.
- **Steps taken:**
  1. Give Claude the transcript and the repository profiles.
  2. Require one tool result instead of a free-form summary.
  3. Tell it to skip small talk, scheduling, money, and personal errands. Merge one request said twice. Split one sentence that asks for two things. Count someone else’s idea only when it is clearly a request, or when the developer agreed to do it. Count the developer’s own “I need to,” “I should,” and “remind me.” Keep hypotheticals under 0.50 confidence. Leave quotes verbatim even when the ticket is English. Use `unknown` when repository confidence is below 0.60.
  4. Validate the tool result. Hold failures and low-confidence routes in `~/.waggle/inbox.json`.
- **Expected:** Claude would already know that some lines are not work, and that an unsure repository is a question for a person rather than an issue to create.
- **Actual:** The model needs those boundaries written into the call. On October 23, 2026, conversation `11575787` produced “Add more information to the footers” with routing confidence 0.10. That is below 0.60, so Waggle stored inbox entry `e2e020187a891554` and did not create a GitHub issue. The same kind of gate is what keeps a vague or hypothetical line out of the tracker.
- **Severity:** medium. The extraction succeeds, but only after the schema, the rules, and the local inbox. It did not block the submission path.
- **Impact:** Without that hold, a spoken aside becomes a GitHub issue in the wrong repository, or a ticket for work nobody asked to do. The developer then has to clean the tracker instead of reviewing one local list.
- **Workaround:** The tool schema forces the fields. Runtime checks reject a repository that is not in the cache, a speaker who is not in the transcript, and a quote that is not copied from one utterance. Anything under the routing floor, including `unknown`, is saved locally for `inbox assign` or `inbox drop`.
- **Actionable suggestion:** A structured extraction result should be able to say “this is not a ticket” and “this is for a person to review” as clearly as it can name a repository. A caller should not have to rediscover that split and build a side inbox because the model treats a transcript as a pile of issues.
- **Evidence:** Local inbox entry `e2e020187a891554` for conversation `11575787`, reason “Routing confidence 0.10 is below 0.60.” No GitHub issue was created for it. Jih described this friction on October 23, 2026.
- **Resolution status:** worked around
- **Retest result:** The footer item is still only in the inbox. Later the same day, conversation `11576634` created SplitIt issues 5 and 6 for the candidates that passed the checks. The model boundary still depends on the prompt and the inbox.
