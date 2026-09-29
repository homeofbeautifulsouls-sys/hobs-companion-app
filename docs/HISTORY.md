# HOBS Companion — Full History (reconstructed from the chats)

A dated timeline of everything that happened on the HOBS Companion app: what was built or
changed, where, why, the bugs created, fixed and recurring, and the decisions (including what
was rejected and why).

**How this was made**: reconstructed Sept 29, 2026 onward from Akash's complete claude.ai chat
export, read in strict time order across all app chats (see `docs/HISTORY_PROGRESS.md` for
scope and method). Nothing here is from memory or guesswork: each entry comes from the chats,
tagged with the chat it came from. Where the chats don't say something, the entry says so.

**Exact code** for any edit mentioned here is in `docs/history/code/<YYYY-MM>.md`, found by its
`E-...` id. Git-era changes (Sept 22, 2026 onward) also have exact diffs in `docs/CHANGE_LOG.md`.

**Chat labels**: C11 Learning from previous mistakes · C16 Claude on multiple devices ·
C17 Obsidian/token usage · C21 Offline agent · C22 Converting website to app · C23 App part 2 ·
C26 App continuation · C28 App 3 · C31 App part 4.

**Status**: in progress. See `docs/HISTORY_PROGRESS.md` for how far the reading has got.

---

## Timeline

(Entries are appended below in time order as each chunk is read.)

### June 2026 — before the app: the memory problem shows up first (on the website work)

These three chats are about how Claude works with Akash, not about the app. They matter
because the same continuity problem later hits the app, and the fixes tried here set the
pattern the app sessions followed.

- **Jun 18 (C16)** — Akash asks about running two Pro accounts on phone and laptop. Learned:
  skills/connectors are per account; he can't keep switching accounts on mobile.
- **Jun 21 (C17)** — Akash asks for "a second brain that never forgets" to save tokens.
  Claude proposes Obsidian (local notes) connected via Claude Desktop, and builds a
  "Claude Context" vault: master brief, brand, website, SEO, programs, decisions log,
  session log (E-019eebde-4 … -20). Akash asks what happens if a file is wrong; Claude
  admits the first version was written **from memory** and flags guesses. Akash orders a
  full cross-check against all past chats. The rebuilt version (E-019eebe6-32 … -48) found
  real errors in the from-memory version — e.g. a website REST endpoint listed as active
  when it had been deleted, cache settings listed as ON when they were OFF, a focus keyword
  wrongly overwritten once before.
  **Lesson recorded then, and repeated since**: anything written from memory must be
  checked against the source before it's trusted.
- **Jun 22 (C17)** — Obsidian setup fails in practice (Claude misreads Akash's screenshots
  three times — first calls Obsidian "Claude Desktop", then points to icons that aren't
  there). Switched to **Google Drive** as the second brain, since the Drive connector was
  already set up and Claude can read/write it directly.
- **Jun 24–26 (C17)** — Akash's real complaint: sessions end too fast and tokens go unused.
  Claude's answer: the notes don't lengthen sessions, they make restarting cheap; work in
  one-task sessions; write a session log before a session dies; consider Max.
- **Jun 27 (C21)** — Akash asks how to build an agent that keeps working while he's offline.
  Claude proposes: GitHub Actions on a schedule + a task list file in a repo + the Anthropic
  API + credentials stored as GitHub Actions secrets. Nothing was built. (This is the same
  idea proposed again on Sept 29 — it was first raised here, three months earlier.)
- Found while reading: a WordPress REST token appears in plain text in C17/C21 (reported
  disabled in June). Redacted in these docs. If that endpoint was ever re-enabled with the
  same token, it should be rotated.

### July 3, 2026 — the app is scoped (C22 "Converting website to app")

- **13:34 UTC** — Akash asks if the website can become an app. Claude suggests a PWA (installable
  website). Within three messages Akash says it needs "a lot of additional functionalities and
  change a lot of structure", so from here on it is scoped as **its own product, not a copy of
  the website**.
- **Features Akash asked for, day one**: regular notifications and reminders, free testing,
  mood tracker, appointment booking, events, payment (via QR), task help "like Clarify for
  ADHD", and a design that is **sensory-pleasing and neurodivergent-affirmative**. Then added:
  an **SOS button** that sends live location to chosen people on WhatsApp (like Zomato), and
  **chatrooms**. Then an in-app shop with its own wallet.
- **Decisions and rejections that day:**
  - Built first: **mood tracker + task scheduler** (Akash's pick).
  - **Real-money wallet rejected**: needs an RBI prepaid-instrument licence. Replaced with a
    **points/credits system** (earn by engaging, redeem on HOBS services). Akash agreed.
  - **SOS auto-send rejected for now**: WhatsApp doesn't allow silent location broadcast
    without the paid Business API. Free version: SOS grabs GPS and opens pre-filled WhatsApp
    messages; the person taps send. Claude flagged that SOS needs a crisis protocol (who
    receives it, what they do), not just a button. (SOS is still an open item in Sept.)
  - Chatrooms: flagged that moderation (who watches for crisis language) is the hard part.
  - **Hard constraint set by Akash: "I don't want it to cost anything."** Everything planned
    on free tiers.
- A scoping document (`HOBS_App_Scoping_Document.docx`) was generated with the phased feature
  list, free-vs-paid paths, the rejected ideas, and open decisions (E-019f283e-7 is the script
  that built it).
- Claude's expanded suggestions: journaling prompts, small-wins log, breathing/grounding, focus
  timer with body doubling, Bob/Kunnu as in-app guides, a sensory profile at onboarding,
  anonymous community wall, crisis resources page, resource library, micro-lessons; and a
  sensory design system (soft chime, reduce-motion, muted/high-contrast mode, dyslexia font,
  gentle haptics, **no punishing streaks — a garden or jar that doesn't reset**). Claude noted
  custom notification sounds need a native app, not web push.
- **13:56** — Akash: "Yes (and you will be doing everything)." From here Claude is the sole
  builder.
