# History reconstruction — progress (read this first if you are resuming)

**What this is**: on Sept 29, 2026 Akash asked for the full history of the HOBS Companion app to
be reconstructed from his complete claude.ai chat export: everything built or changed, the exact
code, when, where and why; every bug created, fixed and recurring; every decision. This file is
the resume point. It is updated and committed after every chunk read, so a context reset or a
new session loses at most one chunk of work.

## If you are a new session picking this up

1. The source data is Akash's export zip `conversations-000.zip` (45 MB). It is **not** in this
   repo and must never be committed: it contains raw credentials and real users' personal and
   clinical details. If it is no longer at `/mnt/user-data/uploads/conversations-000.zip`,
   ask Akash to attach it again (he has the downloaded file; the export link itself was
   one-time-use).
2. Rebuild the reading chunks (deterministic — same numbering every time):
   ```bash
   unzip -o <zip> -d <scratch>/convos
   export HOBS_REDACT_VALUES="<every key_value from system_credentials, newline-separated>
   <plus: grep -ohE 'EDgEf8[A-Za-z0-9_-]+|Dispos[A-Za-z0-9!@#_-]+' conversations.json | sort -u>"
   # ^ an OLD Hostinger token (full account access) and a test account password appear in
   #   the chats with no recognisable prefix, so the pattern list alone misses them.
   #   Also: GitHub push protection blocked the first commit of this work over a HubSpot
   #   `pat-na2-` token the patterns missed (fixed). If a push is ever blocked for a secret,
   #   never "allow" it on GitHub -- fix the redaction and regenerate.
   export HOBS_REDACT_NAMES="<real client first names, comma-separated — ask Akash / see below>"
   python3 tools/history/build_timeline.py <scratch>/convos/conversations.json <scratch>/timeline
   ```
   Client names redacted so far: two (the ones seen in the code edits). Their names are not
   written here on purpose. If unsure, ask Akash.
3. Reading copy: every word Akash and Claude wrote is kept in full; tool calls are one-line
   markers and successful tool outputs are omitted (errors kept) -- reading them in full would have used
   the whole session budget. Exact code is complete in docs/history/code/ regardless.
4. Continue reading after the **Resume point** timestamp below. Append findings to
   `docs/HISTORY.md` (and bugs to `docs/BUG_LOG.md`), then update this file and commit.
5. Commit with `tools/history/commit_progress.sh "<msg>"` -- it credential-scans every changed
   doc and refuses to commit on any hit.
6. Do not touch the app, database, live site, or builds during this work. Docs only.

## Scope (agreed with Akash, Sept 29, 2026)

Full read, merged into one time-sorted stream across chats (several chats overlap in time):

| Label | Chat title | Dates | Messages |
|---|---|---|---|
| C16 | Installing Claude on multiple devices | Jun 18 | 4 |
| C17 | Using Obsidian to reduce token usage | Jun 21 – Jun 26 | 28 |
| C21 | Offline agent with automatic session renewal | Jun 27 | 2 |
| C22 | Converting website to app | Jul 3 – Jul 4 | 186 |
| C23 | App part 2 | Jul 4 – Aug 26 | 392 |
| C26 | HOBS Companion app project continuation | Jul 10 – Aug 26 | 729 |
| C28 | HOBS Companion App 3 | Jul 21 – Aug 27 | 976 |
| C31 | HOBS Companion app part 4 (this long-running session) | Aug 26 – Sep 29 | 1,172 |

Excluded: C11 "Learning from previous mistakes" (checked: entirely website work, zero app
content), website chats (the app and the website are separate projects — Akash, Sept 29) and
other HOBS work (marketing, proposals, Instagram, brochure, screening drive).

## Exact code — already done, separately

All 2,797 code edits made through file-editing tools in these chats were extracted verbatim by
`tools/history/extract_code_edits.py` into `docs/history/code/<YYYY-MM>.md` (credentials and
client names redacted only). 57 of them are marked as failed (did not apply). Each has an id
like `E-1a2b3c4d-5` that the reading chunks and `HISTORY.md` refer to.
Not captured there: changes made by shell commands (sed, python, curl SQL) — those are read in
the chunks and recorded in `HISTORY.md` in words, with the command where it matters.

## Status

- Total chunks: **65** (each ~100k characters)
- Sept 29: found keystore / test-account passwords (no fixed prefix) in the pushed code docs; added them as exact values to the scratch regen grep and regenerated. Earlier commits in git history still contain them, and MASTER.md itself lists two of them -- flagged to Akash, not changed without his OK.
- Sept 29 (later): the production and staging scheduler secrets were also in the pushed code docs (no fixed prefix) -- added as exact values to the scratch regen grep and regenerated. Also added redact.py patterns for Netlify tokens (`nf?_`) and private keys cut off before their END line. Same caveat: older git commits still hold them.
- Sept 29 (later): redact.py now also replaces personal email addresses (clients/testers) with `<email>`, keeping project, placeholder and Akash's own addresses; one more client first name added to the runtime HOBS_REDACT_NAMES list (scratch regen script only).
- **Resume point (timestamp of the last message fully recorded): 2026-07-14T14:11:16Z**
  Chunk numbers can change if the reading copy is rebuilt, so always resume by timestamp:
  `grep -l '<timestamp>' <scratch>/timeline/chunk_*.txt` and continue after that message.
- Last updated: 2026-09-29
