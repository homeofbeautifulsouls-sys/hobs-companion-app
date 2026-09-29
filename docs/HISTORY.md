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
- **14:00–16:52 UTC — more scope, then the key architecture decision:**
  - Added to scope: a curated **YouTube section** (hand-picked, themed, no autoplay), simple
    **sensory games** (no scores, no timers, no losing), and suggested: Gujarati/Hindi toggle,
    personal safety plan builder, anonymized institutional dashboard for SAMVEDNA, gentle
    mood trends, resource search. Claude flagged the list had reached ~25 items and pushed
    to lock scope and ship the mood tracker first.
  - Cost table given: everything ₹0 at ~500 users; only SOS auto-send (WhatsApp Business
    API) would cost money soon.
  - **Akash's corrections (16:41):** use **Google Calendar Appointment Schedule + Meet**
    instead of Cal.com; **SOS deferred** to a later phase; use better PWA options if any.
  - Akash asks whether **Fable 5** would do better (it was free on Pro until Jul 7). Claude:
    spend Fable on architecture and hard engineering, not on design iteration.
  - **16:50–16:52 — the decisive clarification from Akash:** "It doesn't have to be a copy
    paste of website", the website "doesn't follow a soothing sensory", "we don't have to
    follow wordpress at all… when I said convert website into app, I didn't mean it
    literally." → **Decision: a standalone app, not inside WordPress/Elementor.** Planned:
    free hosting (Vercel/Netlify/Firebase), Firebase or Supabase as the only backend, own
    PWA files, the website just links to it (later a subdomain — HOBS owns the domain).
  - Akash's rule on assets: **"if you need me to create assets, you tell me, and not just
    use any asset!"**
- **16:58** — Claude reads the mascot folder on Drive (Bob, Cookie, Po, Kunnu + room scenes:
  Screening Room, Community Center, Therapy Room, Body Doubling). Observations: storybook
  illustration style; the full portraits aren't UI-ready (no small expression states); room
  scenes could become the app's navigation ("visiting rooms in a home"). Asks whether
  simplified expression icons exist.
- **17:01** — Akash: the live screening-tests page on the website is the design reference;
  these are all the assets for now; and **don't touch the website** — look at the reference
  somewhere else.
- **17:03** — Claude tries to screenshot the live page via Claude in Chrome twice; it isn't
  connected in the app. Akash: "Do not waste tokens unnecessarily." (First recorded instance
  of a pattern Akash objects to repeatedly: retrying an approach that already failed.)
- **17:04–17:06 — what "the testing page is almost perfect" means:** Akash clarifies it's the
  **tests, scoring and results** that are right, not the look. Claude recovers the page's
  mechanics from past sessions: test picker → one block of questions at a time with a live
  counter → per-test scoring functions → colour-coded severity bands → results sent to
  HubSpot with a retry/localStorage fallback. **Decision: carry that logic over exactly; only
  the visual design changes.**
- **17:09–17:12** — first visual prototype (chat widget). Akash rejects it: wrong colours, not
  Bob's real image, and **"Everything we do has to be completely scientific and gold
  standard!"**
- **17:14–17:24 — the mood instrument decision (clinical):**
  - Akash wants the check-in to help therapists with diagnosis too.
  - Claude proposes I-PANAS-SF (10 items). Research: its licence is scoped to academic use and
    it lacks direct Indian validation; full PANAS (20 items) has Hindi/Indian validation but
    is too heavy for daily use.
  - Akash: be practical ("I don't think Thompson would even respond!"), must be **valid in the
    Indian context and not exhausting**; otherwise find another validated test.
  - **Decision: WHO-5 Well-Being Index**, weekly — free under CC BY-NC-SA, validated in India
    including a **Gujarati version**, 5 items, ~1 minute, positively worded, 0–100 score with
    cutoffs (≤50 poor wellbeing / follow-up, ≤28 likely depression). **Daily = a casual,
    non-clinical mood note; weekly = the real WHO-5.** Akash: "Yes, build it that way."
  - Claude's rule stated here: a 2-week-lookback instrument must not be given daily.
- **17:24–18:10 — the colour fight (many rounds):**
  - Brand colours (cream/navy/teal/gold) → rejected: be sensory-first, like **Clarify ADHD**.
  - Clarify-style muted pastels → rejected: "pastel isn't soothing… THINK EVERY POSSIBLE WAY
    TO OPTIMISE THE VISUALS!"
  - Research-based low-arousal palette (no red/orange, grey-green-blue, no patterns behind
    task screens; background images only on non-task screens) → Akash asks for real HOBS
    art as the background, and flags the 0–5 numbers weren't centred in their circles.
  - **Bug: embedded images don't render in the chat widget tool** — two attempts failed and
    took the buttons down with them before Claude tested it minimally (17:52) and confirmed
    the limitation. Fix: build a real HTML file instead (`hobs-prototype/index.html`,
    E-019f291c-4), verified by screenshot + pixel analysis before sending.
  - 18:02: "awfully dead and dull"; and **"Where can I see the actual version?"** Claude:
    nothing is deployed yet — all of this is design exploration, no database, no URL.
  - Claude conceded it over-applied "low arousal" as grey-beige; pushed back on going to
    red/orange/neon. Deeper pine/teal → "still not bright enough, and you gave shapes when
    we're supposed to use the image" → brighter teal/green with the real image more visible
    (E-019f2928-2) → 18:08 Akash: it should feel **warm and bright** so people want to use
    it. Claude: warmth from luminous golden light, not hot saturated hues (E-019f292b-2).
- **18:11–20:18 UTC — the visual design gets locked** (dozens of rounds; the settled
  outcomes and the rules Akash set, not every iteration):
  - **Blue as primary.** Akash suggested it; the research supports blue as calming.
    Checked specifically: can a blue background bias mood self-report? The evidence is mixed
    (a 2024 PANAS room-colour study found no main effect; an older study linked all-blue rooms
    with more depressive reports). **Rule: the WHO-5 screen keeps a neutral background**, out
    of caution for measurement integrity. Colour tints on mood selection were removed for the
    same reason.
  - **Honesty and no-judgment copy, app-wide** (Akash, 19:04): prompts must never imply a right
    answer, never react to what's chosen, and normalise hard answers — so people don't shy
    away, feel guilty or try to please (demand-characteristic / social-desirability bias).
  - **Mood picker = floating mood bubbles** (Akash's idea), 8 moods: Anxious, Restless,
    Excited, Hopeful, Heavy, Tired, Calm, Content, spread across a valence/arousal
    (circumplex) layout so they cover the emotional spectrum rather than a cherry-picked list.
    Real repulsion physics so bubbles and labels **never overlap**; motion stops for "reduce
    motion". Bubble colours from colour-emotion research (Jonauskaite et al.); corrections
    made on review: **Anxious = grey-purple** (fear/anxiety maps to grey/black, not red),
    **Hopeful = pale near-white** (hope maps to white; gold is joy). Claude flagged that
    Restless and Heavy colours are inferred, not directly cited.
  - Bubble rendering went through transparent soap-bubble → rim-glow → swirl → glossy 3D
    (from Akash's reference images) → "hurts the eye, like a paint job" → too dull → Akash:
    "show me what *you* think is best" → **soft matte 3D, mid saturation, gentle bob** —
    Akash: "YES! This is exactly what I wanted." (19:38) → **"LOCK THIS"** (19:41).
  - **Two standing rules Akash set at 20:14, "no matter what change we do":** bubble colours
    stay scientifically grounded, and bubbles stay **evenly sized/spaced (56–62 px) — variation
    must not read as a ranking**. He noted Claude had already broken the spacing once.
  - **App chrome** (Akash reminded Claude a logo, notifications and profile must fit): header =
    real HOBS logo + notification bell + profile; navigation = its own footer strip (a floating
    nav bubble was tried and rejected — it got mixed up with the mood bubbles); nav icons
    flat, not 3D; no hard divider lines (screen should feel like one warm space).
  - **Palette fight, settled:** cream "doesn't feel warm"; Headspace's documented rules found
    (no pure white — warmest neutral `#FFF8F0`; coloured shadows, never grey); a gold/orange
    header → "Gold! It's not calming at all!"; navy → "heavy"; pastel → "too light";
    **mid cornflower blue `#6690D6`→`#7FA3E0` for header/footer, `#FFF8F0` content** — Akash:
    better "for now", balance with yellow later. Icons: emoji → thin line icons ("too thin")
    → **solid filled icons** in palette colours (from Akash's reference). **20:18: "PERFECT!
    LOCK EVERYTHING!"** Inspiration named by Akash: **Headspace and Calm**, with HOBS colours.
  - Locked prototype file: `hobs-final/index.html` (E-019f2987-11 and the edits after it).
- **20:18–20:35 — mood → journal flow:** tapping a bubble opens a journal screen with that
  bubble's colour dot, text box, mic button (visual only; real voice-to-text planned via the
  free browser Speech API — Claude flagged it's unreliable on iOS and with Indian accents),
  **Save entry**, and **"Share this with my therapist"** (to go into the therapist's notes).
  - **Copy rule from Akash: Bob does not talk and will not reply.** "Tell me more" (framed as
    Bob asking) and "I'm here to listen" were rejected; Bob appears only as a gentle nudge.
    Disclaimers like "this isn't a conversation" also rejected ("isn't a warning sign"). "Just
    yours to keep" rejected because it contradicts the share option. Claude used Pennebaker's
    expressive-writing research (permission to write imperfectly is what gets people past the
    first line): "Write it messy, half-finished, whatever comes — there's no right way to say it."
  - **Akash's first question about an in-app AI** ("train it for people to speak to Bob",
    20:23). Claude: feasible via an existing model + Bob persona, not training from scratch;
    it would be the first recurring cost; needs hard crisis protocols and Akash's clinical
    sign-off. Deferred.
  - **20:35** — Akash: there must be a way back; **multiple bubbles must be selectable** (people
    feel several emotions at once); the heading should be more direct and empathetic.
- **20:38–21:45 UTC — flows filled in (still a single prototype file, no backend):**
  - Back button on journal; **multi-select moods** with a Continue button; heading became
    "What's on your mind?".
  - **Bug:** `b.el` referenced but never stored → selections broke. Fixed (E-019f29b1-30).
  - **Bug:** Save toggled every bubble ON instead of clearing. Caught in testing, fixed
    (E-019f29b1-52).
  - Save → "Saved" confirmation with a **content-blind booking nudge** (Akash: never reference
    what they wrote — it would feel like their data is being used). Claude flagged a nudge after
    *every* save could get naggy — left for later.
  - Share with therapist → "Do you already have one with us?" → no: an intake form (name,
    contact, note) → thank-you.
  - Akash (20:51): drafts must never be lost when navigating away (tested: already held);
    logged-in users already connected to a therapist must not be asked again; an **expand
    button** so the whole note is visible.
  - Akash (21:03, 21:16): after Save, Bob's affirmation ("I'm glad you put it down") and then:
    *not connected* → join support group + find a therapist (each with an encouraging line) +
    "Don't show this again" (then Bob's affirmation only); *connected* → "Connect with
    [therapist's name]" + support group (reach out if a member, join if not). "Yes, I have one"
    must open a **list of therapist/professional profiles** to pick from, and connecting
    switches the user into the connected flow everywhere.
  - **Bug (recurring type): a doubled backslash in a JS string (`\\'`) silently broke the whole
    script** — nothing was clickable. Caught by testing (E-019f29d7-41, -43). The same class
    of bug came back the next morning (E-019f2bba-33, -35).
  - **Bug:** "Don't show this again" was one global flag checked above both branches, so it
    also silenced the connected-user encouragement. Akash (21:25): the button must not exist
    once connected, and the connected encouragement must never be suppressible. Fixed at the
    source (E-019f29df-7).
  - 21:37: after the intake form, return to the unsaved journal entry with its text intact.
- **21:45 UTC Jul 3 → 06:40 UTC Jul 4 — persistence, profile, "outside therapist", sizes:**
  - Akash's rules: once connected to a therapist the intake form never appears; the person moves
    from **users/potential clients to "clients"** in the backend. Add **"I see someone outside
    HOBS"**: then never pitch therapy again, only support groups, with its own "don't ask
    again".
  - Built: `localStorage` persistence (verified across a reload), Journal tab listing past
    entries, Profile ("You") tab with therapist **Change / Disconnect**, support-group status,
    preferences to re-enable dismissed prompts; **real browser speech-to-text** wired (Claude:
    wired, but not verifiable with real speech in the sandbox).
  - **Security gap Claude raised:** a self-selected therapist is only a claim — before notes are
    routed to a real therapist, the therapist should confirm the connection. (Not designed yet.)
  - Asked whether it works on tablets and different phones — **no, it had only been tested at one
    width.** Akash: fix sizes first. **Bug found:** `body` was `display:flex` without
    `flex-direction:column`, squeezing the app sideways all along (E-019f2bc8-25). Bubble
    physics changed from a hard-coded 340 px to the real container size, with reflow on resize.
    Tested at 320/390/430/768/1024 px: no overflow, no overlaps. Disconnect now asks "are you
    sure"; intake form validates.
  - **06:27 Jul 4 — Akash: "Before task scheduler, we have to do the WHO one right!"** Claude
    checked: **the WHO-5 screen did not exist in the real build at all** — it had only been in
    early throwaway widgets. Built properly: 5 official items, 0–5 scale, score ×4, gauge with
    the ≤28 / ≤50 cutoffs, **once per week enforced**, persisted. A native `alert()` was
    replaced by in-design messaging.
  - **Standing rule from Akash (06:38): everything must be designed for all screen sizes.**
    Audit of every screen at 320 px and tablet: no overflow.
- **07:07 Jul 4** — Akash: go ahead with the **task scheduler**.

### July 4, 2026 — Phase 1 finished in the first chat, then that chat is lost mid-build

- **07:11 UTC (C22)** — Task scheduler built: its own nav tab (Home / Tasks / Journal / You);
  **one task at a time, never a list** (the ADHD premise from the scoping doc); "Not right now"
  instead of skip/postpone; no streaks, counters or red overdue flags; Bob in the empty state.
  The escaped-apostrophe bug was checked for *before* testing this time and found again
  (E-019f2bf3-51).
- **07:13** — Akash shares reference screenshots of a focus app: build it **exactly** like that,
  in HOBS colours, with the "Deep work" button replaced by **Body Doubling**, which opens the
  body-doubling Google Meet. First version was Claude's simplified interpretation; Akash (07:21):
  "I want the exact same functionality and design." Rebuilt 1:1 (week strip, alarm/duration
  rows on the real "Body Doubling" illustration from Drive, task count header, task rows with
  checkboxes, sliding add-task bottom sheet). **Bug caught before testing:** reused element IDs
  (`newTaskInput`, `saveTaskBtn`) from the Tasks tab — would have silently broken one form
  (E-019f2c00-11, -13).
- **07:34 — Akash's full task spec** (quoted because it drives months of later work):
  "It cannot be this day-week or no rush… It has to be a proper calendar! … when clicking on the
  date, the task list is shown! There they can mark it pending or done or break it down to
  smaller tasks (this works well for ADHD), upon clicking done there will be a mindmap with
  Cookie showing a mindmap of their progress… share… WhatsApp text/story/send it to their
  therapist… body doubling support group… Instagram story. And the calendar also has to reflect
  their mood as well!" Claude flagged that a web app can't post straight into Instagram/WhatsApp
  stories — it can make an image and open the phone's share sheet. Real calendar pickers were
  built into both add-task screens and tested.
- **~07:40 — the first chat ("Converting website to app") was paused by a safety classifier
  mid-build**, with no warning. This is the **first continuity break in the project.**
- **07:43 (C23 "App part 2")** — recovery attempts: a share link (claude.ai blocks automated
  fetching), a saved `.mht` of the page (contained chat text only — artifacts aren't captured),
  a pasted HTML file (**cut off before its `<script>` tag — no JavaScript at all**).
  Akash: "You have access to other chats so why can't you access it!" — Claude found the chat
  via chat search, but search returns summaries, not artifact code.
- **07:55–08:03 — the first "you rebuilt it instead of using the original" incident.** Working
  from fragments, Claude built a separate calendar module and then a full 70 KB **reconstruction**
  of the app (E-019f2c1d-4, E-019f2c21-5). Akash: "You absolutely completely fucked up… We had done
  so much work." Claude: it never had the original code; the real version was still in the paused
  chat's artifact panel.
- **08:07–08:15** — Akash exports everything he can from the paused chat: `index.html` files,
  ~40 preview screenshots, logo, Bob, body-doubling art, the scoping doc. (He had to tell Claude
  twice to wait until all files were sent before analysing.) Claude found the `index.html` was an
  **older snapshot** — no Tasks tab, Body Doubling, or WHO-5, although the screenshots showed them
  — and that duplicate filenames overwrote each other on upload. Claude still had the missing
  pieces' code from reading the other upload, so nothing was lost.
- **Decisions (08:15):** tasks are **one shared pool** (calendar, Tasks tab and Body Doubling);
  Body Doubling opens the real HOBS Meet room. **Plan: edit the real file in place, not rebuild.**
- **Lesson that recurs for the rest of the project:** work lived only inside a chat. When the
  chat died, the code could only be recovered by hand, partially, from exports.
- **08:19–10:55 UTC (C23)** — Claude edits "the real file" in place: WHO-5 + Body Doubling added
  back, the one-task-at-a-time Tasks tab replaced by a **month calendar** (mood dots from real
  journal entries + a task-progress dot; tap a day → tasks, done, subtasks → Cookie's mindmap
  celebration → share sheet with a real image via html2canvas + the phone's share sheet), one
  shared task pool, nav Home / Calendar / Journal / You, real Meet link.
- **10:58 — second "you messed it up" incident.** Akash: "The screen isn't even full! It's
  literally half a screen… Why can you not build on this!!!! This was perfect!!!!" and uploads
  the file again — **a 1,498-line version that already had Body Doubling and WHO-5**, different
  from (and newer than) the 898-line file Claude had used. **Bug:** Claude had added
  `min-height:100dvh` to the phone frame without making it a flex column, leaving a dead block
  under the nav. **Rule stated by Claude: zero layout-CSS changes to what already works.**
  Rebuilt the calendar onto the 1,498-line file (`index2.html`, E-019f2cc7-42 onward), with a
  check that every `getElementById` target exists.
- **11:37 — Akash's task-area spec (Clarify ADHD screenshot as reference):** Tasks opens the
  calendar; tasks get **priority** and an **optional deadline countdown** ("optional… in case they
  don't want to panic"); **Body Doubling is an activity, not a task type** — just one button that
  opens the Meet; plus **Tips** (ADHD tips, e.g. breaking tasks down), a **Calm Room** (HOBS
  background animation + calming music), **See Progress** (Bob with a timeline mindmap of done /
  pending tasks, editable), **Achievements** (Cookie awards badges, **party popper for the
  dopamine**). Assets: HOBS will generate the music and background themselves (no copyright
  risk). Built in `index3.html` (E-019f2ced-6 onward), including priority dots, deadline pills,
  confetti, and a Calm Room that loads `calmroom-bg.jpg` / `calmroom-music.mp3` by filename.
- **11:49** — **Bug:** Calm Room close button did nothing — the room's content layer (same
  `z-index:2`, later in the page) covered it and ate every click. Found by an automated browser
  click test, not by guessing (E-019f2cf5-16). Emoji icons replaced with SVG icons; deadline pill
  hidden on finished tasks. **Bug caught before shipping:** routing to a panel id that didn't
  exist (`'home'` → `'bubbles'`).
- **Clinical/safety decision (12:06–12:08):** Claude had added KIRAN (1800-599-0019, verified
  against PIB) for WHO-5 ≤28. Akash: **only iCall, no other helpline, never next to "connect with
  your therapist"**; HOBS is not an emergency service; the disclaimer goes in the sign-up policy.
  Claude pushed back (hiding a crisis line in the ToS means it's invisible when needed) and
  proposed a middle path Akash accepted: **a quiet, permanent line in the Profile tab only, never
  triggered by a score** — "HOBS isn't an emergency service. If you need to talk to someone right
  now: iCall, 9152987821, Mon–Sat 10am–8pm" (number verified on iCall's site that day). WHO-5
  low scores show only a calm "talk to someone" option.
- **Build log on Google Drive started (12:10):** "HOBS Companion App — Build Log" at Akash's
  request ("record everything… keep updating it after each task"). Claude's Drive tool could
  only *create* docs, not edit them, so **every update became a new doc** (v1, v2…) and Akash
  had to delete old versions by hand. This is the start of the Drive-doc handoff pattern.
- **Credits / rewards rules set by Akash (12:16–12:31):** credits for **task completion only**
  (not logins); small wins by design ("people need to feel small wins… that dopamine rush").
  Final rules: **₹1 per task, max ₹10/day (10 tasks), max ₹300/month**, turned into a **voucher
  for next month** (not cash), **redeemable only if the person had 4 therapy sessions a week that
  month**, otherwise credits **lapse**; payment via a **dynamic UPI QR** (HDFC had offered an API).
  Akash earlier rejected Claude's first numbers as "a lot for us… it has to be sustainable."
  **A session only counts when the therapist marks it and writes notes in their own version of
  the app** — first mention of the **therapist app**. Claude's safety points: localStorage can
  be edited by anyone, so credits worth real money must be kept on a server (the phone may only
  read its balance); consider an org-wide monthly pool. A Rewards screen was built showing the
  maths live, with session eligibility shown honestly as "coming soon".
- **12:39–13:01 — Home page, round 1:** Akash (Headspace screenshots): calendar is cluttered;
  footer should hold Home, Tasks calendar (tasks + mood), Journal, Appointment, Community without
  clutter; Home and Profile should feel like Headspace — accessibility and affirmation. Claude
  moved the five feature buttons off the calendar onto Home and suggested 5 nav items max with
  Community later. Akash: "doesn't look like Headspace at all… mascot, soothing animations";
  **the mood tracker stays on Home — locked**; no direct task list existed (fixed with a "Today's
  tasks" card). Home v2: illustrated sky hero with Bob, greeting + rotating affirmation, then the
  mood bubbles, then a swipeable carousel. **Recurring bug:** the WHO-5 "done this week" label
  broke twice during these refactors (text overwritten, then a renamed class).
- **13:01** — Akash: a search in Profile across the person's own data; header profile button
  broken — does it need to exist twice?; remove the calendar dots under the numbers; and a first
  idea for **Community** — Facebook-like support groups, people post on their profiles, and
  members of the same group can chat one-to-one ("I am thinking out loud").
