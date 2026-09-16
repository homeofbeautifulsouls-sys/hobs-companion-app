# HOBS Companion — Project Status Tracker

Lightweight, persistent tracking for what's actually still blocking real milestones (Play Store
submission, launch-readiness) — separate from `docs/BUG_LOG.md`, which is for bugs specifically.
Kept as plain markdown in the repo deliberately, so it survives environment resets without
needing to rebuild a document-generation pipeline just to update one line.

*Last updated Sept 16, 2026, after a full day's real work: Bob's memory system (permanent
storage, significant-memory recall, semantic search, weekly extraction), crisis escalation to a
real professional, tiered psychoeducation, the single-companion Bob redesign, several real,
confirmed bugs found and fixed in real production use, and the sequenced Bob Intelligence
Architecture plan (see `docs/BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md`) for the next phase of work.*

## Play Store submission blockers

- [x] **D-U-N-S Number** — resolved August 21, 2026. **854273779**, Home of Beautiful Souls
      Foundation, confirmed via Dun & Bradstreet (Service India Team). No longer blocking.
- [x] **Google Play Console developer account setup/verification** — resolved. Confirmed
      directly by Akash Sept 16, 2026: "Playstore is working." The organization-account
      conversion that previously blocked this is done.
- [ ] Closed testing prerequisite: 12 real testers x 14 consecutive days, before a production
      track submission is even possible.
- [ ] Store listing content (description, screenshots, privacy policy link, content rating
      questionnaire) — confirm actually uploaded in Play Console, not just prepared.
- [ ] Device catalog — confirm set to Phone only.
- [ ] Lawyer review of the Terms of Service liability section — still not done.

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

## Lower-priority technical work

- [ ] External uptime monitoring independent of Supabase itself
- [ ] Server-side failure logging for a few more Edge Functions beyond what's covered
- [ ] Fully deterministic "one command" Android builds

---

*Update this file whenever a real blocker resolves or a new one surfaces — don't let status
updates like the D-U-N-S resolution live only in chat history.*
