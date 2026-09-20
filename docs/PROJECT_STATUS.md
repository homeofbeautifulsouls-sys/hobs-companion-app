# HOBS Companion — Project Status Tracker

Lightweight, persistent tracking for what's actually still blocking real milestones (Play Store
submission, launch-readiness) — separate from `docs/BUG_LOG.md`, which is for bugs specifically.
Kept as plain markdown in the repo deliberately, so it survives environment resets without
needing to rebuild a document-generation pipeline just to update one line.

*Last updated Sept 17, 2026, after a second full day's real work on top of Sept 16: real,
per-session history for every professional relationship (not just the single most recent date),
a working direct-chat system generalized to all four real professional roles (Therapist,
Psychiatrist, Doctor, Caregiver), a real Session Log surfaced in three separate real UI
locations, per-session homework with a real accept step and completion notifications, real
red/green notes-upload tracking and a persisted Google Meet link per session, a real professional
schedule view, a genuine, root-caused fix for the Calendar-reconnect-vs-auto-reload interaction,
and a full, honest catch-up of `docs/BUG_LOG.md` covering two real sessions that had never been
logged at all.*

## Play Store submission blockers

- [x] **D-U-N-S Number** — resolved August 21, 2026. **854273779**, Home of Beautiful Souls
      Foundation, confirmed via Dun & Bradstreet (Service India Team). No longer blocking.
- [x] **Google Play Console developer account setup/verification** — resolved. Confirmed
      directly by Akash Sept 16, 2026: "Playstore is working." The organization-account
      conversion that previously blocked this is done.
- [x] **Content policies approved, organization account verified** — confirmed directly by Akash
      Sept 18, 2026, and corroborated by real, live Play Developer API data pulled the same day
      (`play-console-status` function): the alpha (closed testing) track shows a completed
      release (versionCode 74), and a draft production release already exists on the production
      track -- Google's own system does not allow a production draft to exist without these
      gates already cleared.
- [x] **Closed testing prerequisite** — confirmed via the same real, live check: alpha track
      release status is "completed."
- [x] **Store listing text content** — confirmed via the same real check: title and full
      description are present and complete in the en-US listing.
- [ ] **Phone screenshots** — confirmed missing via the same real check (a clean 404 on
      `imageType/phoneScreenshots`). Google requires at least two before a production submission
      is possible. Real, concrete, currently blocking.
- [ ] Device catalog — confirm set to Phone only (not checked via this method yet).
- [ ] Lawyer review of the Terms of Service liability section — genuinely not checkable via any
      API; this is an offline, real-world step only Akash can confirm. Flagged multiple times
      going back to August 2026 with no record found of it having happened. Real, live status:
      **still needs Akash's direct confirmation.**

## Bob Intelligence Architecture — real, current status

Full detail in `docs/BOB-MEMORY-SAFETY-BUILD-SPEC.md` (the memory/safety build, complete) and
`docs/BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md` (the next phase, sequenced, not yet started).

**Done and live in production** (versionCode 75, "3.55-memory-psychoed"): permanent
cross-session memory, real-time significance flagging, guaranteed recall, real semantic search,
weekly extraction, crisis escalation to a real assigned therapist or admin fallback, tiered
psychoeducation from journal entries, the mindful-pause UI, the chief/name structural fix, the
single-companion (Bob-only) redesign, Bob's info panel.

**Not yet started** (see the Intelligence Architecture plan for the real, sequenced breakdown):
Phase 0 (identity spec extraction + module scaffolding), Phase 1 (Personal Grounding module --
the real hallucination safeguard), Phase 2 (measurement/benchmark), Phase 3 (response safety
review), Phase 4 (memory confidence/staleness), Phase 5 (Bobness regression suite). Real
streaming (for perceived response speed) is a separate, larger, explicitly-deferred decision --
raised repeatedly as a real concern, not yet started pending explicit go-ahead.

## Real professional-connection system -- built Sept 16-17, genuinely new, not yet in production

Everything below is live and verified on **staging only** (through v26). None of it has been
promoted to production yet.

**Done**: direct 1-on-1 chat with a connected professional, generalized to all four real roles
(Therapist/Psychiatrist/Doctor/Caregiver) at both the database (auto-assignment trigger) and UI
(profile page) level; a real `session_history` table recording every actual session, not just the
most recent one; a full Session Log showing complete history with a real red/green notes-upload
status and a working Google Meet link per session, reachable from three separate real places
(profile page, Our Experts list, the individual View Profile page); per-session homework with a
real client accept step (pending items never appear as active tasks until accepted) and a real
push notification back to the professional on completion; a professional's own complete
past+future schedule view across every real client; the proper, admin-approval disconnect flow
correctly wired everywhere instead of an old, bypassing shortcut.

**Real, known gaps not yet addressed**:
- [ ] **The Coordination Group concept** (multiple professionals coordinating around one shared
      client, showing the real client's name instead of a generic label) -- discussed and
      understood, not built. The underlying `chat_rooms` type (`coordination`) already exists in
      the schema with one real row, but no real UI surfaces it yet.
- [x] ~~The professional's own calendar/availability management~~ -- corrected: this was a
      premature assessment. Checked directly and it already exists as a complete, well-built real
      feature (a "My Client Schedule" panel with Calendar/Appointments/Availability tabs,
      including recurring/repeat slot support), used for real as part of the chain test below.
- [x] **A real, live end-to-end test of the whole chain** -- run for real Sept 17, 2026: admin
      assigns -> professional sets real availability -> client picks a real slot -> professional
      accepts -> payment -> professional locks real notes -> Session Log correctly shows green,
      all through real UI interaction with real test accounts, not verified piece by piece. Found
      and fixed three further real bugs in the process (see BUG_LOG #96) -- the notes/payment-lock
      action never actually wrote to `session_history`, a missing RLS `UPDATE` policy that made
      the first fix silently do nothing, and a real account-deletion gap
      (`expert_availability_slots.booked_by`). The one piece not covered by this real test: actual
      Google Meet link generation, which needs a genuinely OAuth-connected account and so can only
      be verified on your own real, already-connected account, not a test one.
- [ ] **The still-unexplained "only connected professionals visible" report** -- investigated
      thoroughly (RLS, the fetch query, the language filter), no code-level cause found; saved in
      memory per Akash's own request, not pursued further yet.
- [ ] Homework/Session-Log/schedule-view testing so far has focused on the Therapist role
      specifically -- not separately re-verified end-to-end for Psychiatrist/Doctor/Caregiver,
      even though the underlying logic is now genuinely role-agnostic.

## Other real, outstanding items (not blockers, but genuinely open)

- [ ] **Real native task/subtask alarm** -- attempted Aug 26, 2026, crashed on the real device
      when shipped straight to production (see BUG_LOG #56/#57). Rebuilt as a genuine staging
      APK instead (BUG_LOG #58) -- live at staging-app.homeofbeautifulsouls.com, waiting on
      Akash's real-device confirmation before this touches production again. Production is
      currently back on the old plain-push-notification behavior.
- [ ] A real, end-to-end Razorpay test with actual money (everything tested with test data only)
- [ ] Google Calendar OAuth app verification (ends the current ~7-day reconnect cycle, since
      the app is still in Google's testing mode)
- [ ] HDFC SmartGateway onboarding — mentioned once, never actioned
- [ ] Real automated invite emails — mentioned once, never actioned
- [ ] Reconsidering the Supabase free tier, given how much now depends on it staying up
      (backups, monitoring, cron jobs -- now including the weekly memory-extraction job too)
- [ ] The "Continue" item from an original bug-list screenshot, flagged in a past session as
      genuinely unclear and never resolved — if this comes back to mind, needs to be chased down

## Decisions waiting on Akash specifically (not blocked on anything else)

- [ ] Tasklist constellation redesign — prototype exists, never decided on
- [ ] React migration — deliberately paused until the external developer is confirmed ready
- [ ] In-app day/month calendar view — not built yet
- [ ] SOS button — fully scoped (see character AI master scope doc), blocked specifically on
      the emergency-contact-reaching mechanism decision (paid SMS/WhatsApp Business API with
      DLT registration, vs. a lower-fidelity manual-tap WhatsApp link)
- [ ] Automated email marketing — never scoped at all, needs its own conversation
- [ ] Real streaming for Bob's replies (perceived response speed) -- raised repeatedly as a real
      concern; explicitly not started pending explicit go-ahead, given the real scope of the
      change (touches both the backend response format and frontend rendering).
- [ ] Whether the crisis-detection threshold should be more conservative than the strict
      clinical definition of passive ideation (flagging escalating overwhelm alone, without any
      death-adjacent theme) -- a real, explicitly-flagged open values question, not a technical
      one, raised during the memory/safety build and not yet answered.
- [ ] Kunnu, Po, Cookie -- currently fully hidden (not deleted) across every UI and routing path;
      Bob currently handles everything. Awaiting a decision on when/how to bring them back with
      the same depth of character work Bob has now received.
- [ ] When (if at all) to promote the whole new professional-connection system (Sept 16-17) from
      staging to production -- a real, substantial amount of new, safety-adjacent surface area
      (real chat between clients and real professionals) that hasn't had the same length of real
      staging soak time as some earlier features.
- [ ] Your own real, in-house calendar system (linked to email/WhatsApp) as a possible eventual
      replacement for the current Google Calendar integration -- raised as a real idea, explicitly
      set aside for a later, separate conversation, not started.

## Lower-priority technical work

- [ ] External uptime monitoring independent of Supabase itself
- [ ] Server-side failure logging for a few more Edge Functions beyond what's covered
- [ ] Fully deterministic "one command" Android builds

---

*Update this file whenever a real blocker resolves or a new one surfaces — don't let status
updates like the D-U-N-S resolution live only in chat history.*

