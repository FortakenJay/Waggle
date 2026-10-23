# Bee conversation test scripts

These are rehearsal lines for a live Bee conversation. The submission video script, timed for the Devpost cut, is in [demo.md](demo.md).

Use these scripts to test Waggle with a real Bee conversation while GitHub writes remain blocked.

## Before recording

1. Keep the Bee proxy running.
2. Pick a repository shown by:

   ```bash
   npm start -- repos
   ```

3. Replace `[REPO NAME]` below with the repository's name.
4. Start the safe listener:

   ```bash
   npm start -- watch --dry-run --verbose
   ```

Speak naturally. Pauses, repetition, and mixed language are intentional parts of the test.

---

## Script 1: Solo voice note

> This is a note about my repository called **[REPO NAME]**.
>
> Remind me to fix the login page on Safari. After I enter my password, the submit button sometimes freezes and nothing tells me what went wrong.
>
> I need the Safari login to recover instead of staying frozen, and it should show a useful error message.
>
> I should also add CSV export for the activity report. The downloaded file needs the date, user, and status columns.
>
> Sobre el problema de Safari, quiero que el mensaje de error sea claro para que la persona sepa qué hacer.
>
> Maybe someday I could add animated backgrounds, but that is not important right now.

### Expected result

- One Safari login bug, merged from the repeated statements.
- One CSV export feature.
- Original English and Spanish quotes remain verbatim.
- The animated-background idea goes to the inbox or is ignored as hypothetical.

---

## Script 2: Conversation with a friend

Tell your friend the repository name before starting.

### You

> Let's talk about my repository called **[REPO NAME]**. What problems have you noticed?

### Friend

> The dashboard sometimes shows old information after I refresh it. Please make it load the newest data.

### You

> Got it. I'll fix the stale dashboard data.

### Friend

> Yes, especially after editing an item. Right now I have to refresh twice before the change appears.

### Friend

> Also, can you add a download button for the report and include timestamps in the downloaded file?

### You

> Yes, I can add that.

### Friend

> Maybe someday it could have a chatbot too.

### You

> Let's not commit to that yet.

### Expected result

- The two dashboard statements merge into one bug.
- The report download becomes a separate feature.
- Your friend's name appears as the requester.
- The chatbot idea goes to the inbox or is ignored as hypothetical.

---

## After Bee finishes

The running `watch` command should process the conversation automatically. If it does not, preview the newest conversation manually:

```bash
npm start -- latest 1 --dry-run --verbose
```

Then inspect uncertain items:

```bash
npm start -- inbox
```

Keep `--dry-run` enabled until the repository routing, issue text, acceptance criteria, and dedupe decision all look correct.
