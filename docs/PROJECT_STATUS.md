# HOBS Companion — Project Status Tracker

Lightweight, persistent tracking for what's actually still blocking real milestones (Play Store
submission, launch-readiness) — separate from `docs/BUG_LOG.md`, which is for bugs specifically.
Kept as plain markdown in the repo deliberately, so it survives environment resets without
needing to rebuild a document-generation pipeline just to update one line.

## Play Store submission blockers

- [x] **D-U-N-S Number** — resolved August 21, 2026. **854273779**, Home of Beautiful Souls
      Foundation, confirmed via Dun & Bradstreet (Service India Team). No longer blocking.
- [ ] Google Play Console developer account setup/verification against this D-U-N-S number
- [ ] Store listing content (description, screenshots, privacy policy link, content rating
      questionnaire)
- [ ] Lawyer review of the Terms of Service liability section — still not done

## Other real, outstanding items (not blockers, but genuinely open)

- [ ] **Real native task/subtask alarm** -- attempted Aug 26, 2026, crashed on the real device
      when shipped straight to production (see BUG_LOG #56/#57). Rebuilt as a genuine staging
      APK instead (BUG_LOG #58) -- live at staging-app.homeofbeautifulsouls.com, waiting on
      Akash's real-device confirmation before this touches production again. Production is
      currently back on the old plain-push-notification behavior.
- [ ] Groq API key for the character-AI feature work (crisis detection itself is already
      correctly wired to Groq and live — this is specifically about whether character voice
      generation needs its own separate consideration, or shares the same key/budget)
- [ ] A real, end-to-end Razorpay test with actual money (everything tested with test data only)
- [ ] Google Calendar OAuth app verification (ends the current ~7-day reconnect cycle, since
      the app is still in Google's testing mode)
- [ ] HDFC SmartGateway onboarding — mentioned once, never actioned
- [ ] Real automated invite emails — mentioned once, never actioned
- [ ] Reconsidering the Supabase free tier, given how much now depends on it staying up
      (backups, monitoring, cron jobs)
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

## Lower-priority technical work

- [ ] External uptime monitoring independent of Supabase itself
- [ ] Server-side failure logging for a few more Edge Functions beyond what's covered
- [ ] Fully deterministic "one command" Android builds

---

*Update this file whenever a real blocker resolves or a new one surfaces — don't let status
updates like the D-U-N-S resolution live only in chat history.*
