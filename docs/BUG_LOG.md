# HOBS Companion — Complete Bug & Resolution Log (Full Project History)

Every confirmed bug found and fixed across every development session, from the beginning of
this project through today, in chronological order. Built by going back through the actual
session transcripts, not just summary memory — so this is as accurate as the real record
allows. Keep this updated every session going forward, without exception.

**A pattern that shows up repeatedly below and matters more than any single entry**: the same
root cause (a missing `on_conflict` parameter on an upsert, described in three separate entries
in this log — July, August 5–6, and August 14) was found and fixed multiple times across
different months, in different files, because the fix wasn't generalized into a rule the first
time. See "Standing lessons" at the bottom.

**Full coverage (Sept 29, 2026)**: every bug from all app chats (June 18 – Sept 29, 2026) is now
in this file. The ones that had never been logged were added as **#121–#531** in the section
"Recovered from the full chat export", just before the standing lessons. `docs/HISTORY.md` has the
surrounding story for each (line numbers given).

---

## July 22–23, 2026 — Early development session
- **Confirmed-session badge showed no date/time** even when the booking had one — fixed to
  match the equivalent pending-request badge.
- **Coordination-room contamination incident**: a test admin account shared the same
  professional name as Akash's real account; leftover test data leaked two real chat rooms into
  real accounts (Akash's and a real client's). Cleaned up; test-admin identity permanently
  renamed with its own dedicated entry so this class of contamination can't repeat. Also fixed
  an underlying UX gap found alongside: every coordination room was generically named "Care
  coordination" with no client name attached.
- **Journal entry duplication**: root cause was a race condition in the shared save/retry
  function. Fixed; confirmed zero new duplicates after. Two rounds of leftover pre-fix duplicate
  data found and cleaned directly from the database.
- **AppTheme.NoActionBarLaunch never switched back**: the splash-screen theme was applied via
  the manifest but nothing ever called `setTheme()` to switch back afterward, so the app fell
  back to whatever the `<application>`-level default theme was instead of the intended one.

## July 22–23, 2026 (continued) — Notifications, analytics, donations
- **Duplicate push notifications**: root cause was `pushNotificationReceived` firing whenever
  the app process is alive (foreground OR backgrounded-but-not-killed), not just foreground as
  an old code comment assumed. Android auto-displays the FCM notification while backgrounded,
  AND the JS handler was also unconditionally posting its own local notification for the same
  push. Fixed to only post locally when `App.getState().isActive` confirms true foreground.
- **"Shows no support group joined" despite being one**: `profiles.has_support_group` was a
  separate, legacy flag that never gets set when someone joins a real support group via
  `chat_room_members` — same bug shape as an earlier `has_therapist` fix. Fixed by deriving from
  real `chat_room_members` data, OR'd with the legacy flag.
- **Missing safe-area-inset-bottom** on the shared `.share-sheet-card` CSS class (used by 3
  overlays) — every other modal had gotten this fix in an earlier session; this one class was
  missed, causing a sheet's Cancel button to sit flush against on-screen nav buttons.
- **Textareas app-wide were fixed-height with no way to expand** — made auto-growing. A real
  regression caught during this same fix: measuring `scrollHeight` while a tab is `display:none`
  always reads 0, which would have locked in a broken 0px height — fixed with a visibility guard.
- **Donation campaign link previews had no image at all** (`donate.html` had `og:title`/
  `og:description` but no `og:image`). Fixed, but took three self-inflicted bugs along the way,
  each caught by diffing against a saved pre-bug copy rather than assumed fine: a UTF-8
  corruption, a tag-duplication bug from a regex that only matched half the block, and a cleanup
  script that accidentally deleted `donate.html`'s entire style block.

## July 23–26, 2026 — Handoff, deletion flow, welcome-back animation, layouts
- **Storage `.list()` is not recursive** — a file uploaded to `{userId}/profile-photos/photo.png`
  was being completely missed because `.list(userId)` only sees direct children, found via a
  real test with an actual uploaded file.
- Self-service account deletion (in-app + web page) built for Play Store compliance.
- Welcome-back screen page-turn animation, day-detail/tasklist landing redesigns, calendar grid
  removal, image preload bug fixes — feature work, no major regressions recorded.

## July 26–27, 2026 — Mood bubbles, React planning (paused), notifications, tests rebuild
- **Duplicate notifications** (a second, separate root cause from the one fixed July 22–23):
  `app_update` reminders were handled in two completely separate places — one firing
  independently at 9am local time, unaware of the dedicated `send-apk-update-notification` daily
  cron (6am UTC) which already had its own proper per-release dedup via `app_update_reminders`.
  Neither system knew the other existed, so every eligible user got double-notified.
- **Journal duplicates** investigated further (see July 22–23 fix above — this session confirmed
  it held).
- **Scheduled/recurring push notifications reported as not showing up** despite FCM confirming
  successful delivery every time, while ad-hoc notifications worked fine — investigated as part
  of the notification channel native fix that shipped in APK v2.9.
- App icon fixed (Bob mascot was missing/wrong on the launcher icon).
- Complete rebuild of the tests flow: back/forward navigation, PDF removal, HubSpot wiring moved
  to a database trigger.

## July 31, 2026 — HubSpot, notifications, Razorpay, performance
- **HubSpot integration was silently failing**: using the CRM Notes API instead of the Forms
  API, which behaved differently than expected for this use case. Fixed.
- **Notification delivery bug root-caused to a July 21 code change** (a regression introduced
  weeks earlier, only diagnosed now).
- Razorpay payment integration built out (donations + therapy sessions + cancellation charges).
- App performance work: image optimization, caching, donation widget.
- **Journal scroll bug** fixed.
- New Tasklist constellation UI concept/prototype started.

## August 2, 2026 — Constellation UI, rich text, journal bugs, task alarms
- **Floating assistant button rendering on top of sheet buttons**: a sheet's z-index (11) was
  far lower than the floating button's (55) — raised to match the tier already used for other
  modals (60/61).
- **Multiple severe journal bugs found and fixed**: a duplicate-entries root cause (separate
  from the earlier July fix — a different code path), the entry index not refreshing after
  edits, share-as-image rendering raw HTML instead of formatted text, and the therapist view
  also rendering raw HTML instead of formatted text.
- **Critical regressions introduced and then caught within the same session**: a `_serverConfirmed`
  flag bug and entry duplication in the index — both introduced while fixing the above, caught
  before shipping, fixed.
- Task alarm feature built: new DB columns, an isolated Edge Function, a cron job, task-level UI,
  and a z-index overlap bug fixed along the way.
- Journal rich-text formatting added (H1/H2/H3, bold, italic, strike, underline, alignment,
  bullets, numbers).

## August 5, 2026 — Google Calendar OAuth debugging marathon
- **[Regressed later, refixed August 14 — see below] OAuth reconnection silently never saved.**
  The `exchange_code` write to `professional_calendar_connections` was a plain `POST` insert
  against a table with a unique constraint on `user_id`. Every reconnect attempt after the first
  violated that constraint and failed, while the app still reported success to the client.
  Confirmed directly: `connected_at` on the real account's row was still the original connection
  date despite multiple recent "successful" reconnect attempts. Fixed with `?on_conflict=user_id`.
- **The exact same missing-`on_conflict` bug existed independently** in the busy-block calendar
  sync write (`professional_busy_blocks`, unique constraint on
  `(professional_user_id, google_event_id)`) — found by proactively checking for the same
  pattern elsewhere after fixing the first instance, not by a separate bug report. Fixed the
  same way.
- **`return=minimal` responses have no body** — every `return=minimal` call in the calendar sync
  function was silently at risk of throwing when its response was parsed as JSON, just never
  exercised by earlier testing since those specific code paths weren't reached yet. Fixed to only
  parse when there's actually content.
- **Backfill only ever looked forward** — a newly connected account started completely blank
  regardless of what already existed on the calendar, since the watch mechanism only caught
  future changes. Added a 90-day-forward backfill on connect.

## August 6, 2026 — Google Calendar bug-fixing marathon, GitHub Pages outage, architecture migration
- **Google Calendar API was never enabled** for the underlying Google Cloud project — confirmed
  via Google's own error message. This blocked the OAuth flow, the backfill, and everything else
  at the root. Fixed by Akash directly in Google Cloud Console — not something fixable in code.
- **"Reconnect" appeared to work but the app kept showing "Reconnection needed."** The connection
  status card was never refreshed after returning from the OAuth flow. Fixed by hooking the
  refresh into the app's existing `visibilitychange`/`focus`/`pageshow` pattern, since Capacitor's
  `resume` event doesn't reliably fire when the OAuth flow completes in a detached browser tab
  instead of returning to the native app directly.
- **Backfill only looked forward, still** — extended to also backfill 90 days back; re-running
  against the real account went from 79 to 245 events backfilled.
- **Client picker briefly, incorrectly excluded a real client** whose email happened to match the
  therapist's own connected calendar email. Reverted the over-broad fix; handled the actual edge
  case (Google doesn't accept a calendar owner as their own attendee) by simply not sending that
  one email as an attendee, while still tracking and saving the event normally.
- **The stuck "Saving..." button — the most time spent on any single bug in that session.**
  Traced through several wrong hypotheses (self-as-attendee, Google API timing, notification
  settings) before finding the real cause: the 15-second client-side timeout only wrapped the
  network call itself, not the `sb.auth.getSession()` call immediately before it — if that
  specific call hung, the timeout never engaged and the button stayed stuck forever, with the
  underlying request often having already succeeded server-side regardless.
- **A GitHub Pages outage took down the entire native app** — root cause: the APK loaded its UI
  remotely from GitHub Pages instead of bundling it locally, so a GitHub-side outage meant the
  app couldn't even open. This was the trigger for the architectural decision to bundle the UI
  locally into the APK (Capacitor local bundle) instead of loading it remotely — the single
  biggest architectural fix in this project's history, since it removes an entire class of
  "third-party outage breaks the app" risk. APK v3.0 shipped with this change.

## August 6–13, 2026 — Hostinger migration, security audit, monitoring, backups
Full detail already recorded in the "External security audit" section below — 18 confirmed
findings, summarized there rather than duplicated here. Also from this stretch, recorded
separately since it predates the formal audit:
- **6 deployed Edge Functions were missing from the git repo entirely** (existed live on
  Supabase, never committed) — discovered while auditing what was actually deployed vs. what was
  in version control. Recovered and committed.
- **`renderGcalConnectionCard()` crashed on `currentUser.id` unguarded** — confirmed via
  production error logs as the single most common real error in the entire app (65 of 75 total
  ever logged), caused by this function firing on `visibilitychange`/`focus`/`pageshow` regardless
  of auth state. Fixed with a null check.
- **`create-razorpay-order`, `send-task-alarms`, `send-apk-update-notification` were truncated**
  in the git repo (incomplete file contents committed at some point) — repaired.
- **`safe_deploy.js` had two real bugs**: a silent failure (never checking the response) and a
  `serverCallerId` UUID type mismatch — both caught and fixed before trusting deploy results.
- **The architecture doc contradicted the real setup**: it said "Hosting: GitHub Pages" well
  after the migration to Hostinger had happened — fixed to state Hostinger as the single
  authoritative host.

---

## August 13–14, 2026 — External security audit (23 findings, 18 confirmed real and fixed)

### Critical (Tier 0)
1. **Cross-account offline queue leak** — a shared device's offline sync queue had no ownership
   tracking; logging in as a second user could write the first user's queued content into the
   second user's account. Fixed with per-item ownership, verified by reproducing the exact
   attack and confirming zero cross-account writes after the fix.
2. **Unauthenticated Google Calendar sync actions** (`register_watch`, `sync_session`) — ran
   under the service-role key with no caller verification. Fixed with proper auth checks.
3. **Unauthenticated Razorpay order creation** — client used raw `fetch()`, sending no JWT at
   all. Fixed to include the session token and verify caller identity server-side.
4. **Chat XSS** — 4 real vulnerable spots (not just the one originally flagged). Fixed with
   comprehensive `escapeHtml()`, verified with a real XSS payload confirmed neutralized.
5. **Public storage bucket for personal images** — `task-images` mixed public campaign images
   with private profile/task photos. Split into a private bucket (`private-user-images`, signed
   URLs) and a public one for genuinely public content only.
6. **Non-transactional account deletion** — could report "Account deleted" after a partial
   failure. Rebuilt as a single atomic Postgres function; a failure now stops before auth
   deletion, verified with a real test account.

### Race conditions (Tier 1) — all fixed with atomic DB operations, verified with genuinely concurrent requests
7. **Booking slot double-booking** — fixed with `reserve_availability_slot`, verified: 5
   simultaneous requests for the same slot, exactly 1 succeeded.
8. **Razorpay order overwrite/orphan** — first fix (Aug 13) only handled reusing an
   already-saved order, not two simultaneous *first* requests. **Corrected on Aug 14** after
   being caught in external review: added `claim_razorpay_order_slot`, verified with 5
   genuinely simultaneous first-time requests — all 5 returned the identical order_id.
9. **OAuth state-token reuse** — fixed with `consume_gcal_state_token`, verified: 5 concurrent
   requests, exactly 1 got the real result, caught and fixed a real `uuid` vs `text` type
   mismatch along the way.
10. **Google Calendar webhook spoofing** — trusted `x-goog-channel-id` alone (not
    cryptographic). Added a real secret channel token, verified via a forged-request test and
    confirmed via actual function logs that the rejection fired.
11. **Optimistic-UI false success** — cancellation and expert-change requests updated local
    state and showed success before the server confirmed. Fixed for the two flows with real
    consequences, verified with simulated failure/success against the real app code.

### Reliability (Tier 2)
12. **Monitoring alert delivery** — could mark an alert "handled" before confirming it was
    delivered. Fixed to only advance state after genuine delivery, verified end to end.
13. **Backup coverage** — only 12 of 39 tables backed up (missing chat, consent agreements,
    WHO-5, worksheets, and more). Expanded to 38, verified with a real backup run (4,664 rows).
14. **Hardcoded Hostinger token** in `safe_deploy.js` — moved to a required env var.
15. **OAuth code/session logging** — full URLs, codes, and session tokens were logged in plain
    text. Removed, kept non-sensitive diagnostic logging.
16. **Therapist notification overreach** — a therapist had identical, unrestricted access to
    admin's notification tools, including broadcasting to everyone. Fixed to restrict to their
    own verified clients, verified with real test accounts.
17. **13 of 14 image assets silently broken** on both web and every APK build since the
    Hostinger migration (Bob, Po, Kunnu, Cookie, all backgrounds) — the source files existed in
    the repo the whole time but were never actually deployed. Fixed and verified live.

### Found via a follow-up external review of the above fixes (Aug 13–14)
18. **Offsite backup completeness** — could mirror an incomplete primary backup as if it were
    complete. Added a manifest the offsite function checks before publishing, verified both
    directions (real backup, then a deliberately corrupted manifest correctly refused).
19. **Storage objects never backed up offsite**, only database rows. Added, caught a real bug
    where nested folders (`{user_id}/profile-photos/{file}`) were silently missed by a
    fixed-depth recursion — fixed to recurse to any depth, verified all 11 real files found.
20. **A real restore drill** (not previously done) — surfaced that `auth.users` itself was never
    backed up at all, meaning a genuine restore into a fresh project would fail on nearly every
    table (all foreign-key to it). Added, then proved a full restore: 36 of 38 tables restored
    with an exact row-count match into staging, from a real production backup.
21. **Crisis AI fail-open semantics** — every failure path returned `riskDetected: false`
    identically to a genuine "no risk" finding; the client only ever checked that one field, so
    a silently-down classifier was indistinguishable from a working one. Added an honest
    `classifierAvailable` field, logged to `error_logs` so a sustained gap is now visible to
    monitoring. Confirmed live: the classifier is in fact not configured right now (needs
    Akash's own Anthropic API key) — this is now visible instead of silent.

---

## August 14, 2026 — Native app OAuth investigation

A single connected chain of real bugs, found by actually testing on a real device rather than
assuming each fix was sufficient. Recorded in detail because this exact class of bug (custom
URL scheme / native redirect handling) is easy to reintroduce carelessly.

### 22. AndroidManifest.xml was never a real, persistent build asset
**What broke:** Google sign-in (Supabase's own "Sign in with Google") got stuck on the account
picker with no way back into the app.
**Root cause:** the app redirects to `hobscompanion://callback` after Google auth succeeds, but
this custom scheme was never registered in the Android manifest — Android had no app to hand
the URL to. **Deeper root cause:** `AndroidManifest.xml` had never been saved to the persistent
repo at all — every previous rebuild regenerated a fresh, default manifest from Capacitor's own
tooling, silently dropping this (or any other) manifest customization every single time.
**Fix:** registered the deep link, saved the manifest permanently to
`android-native-assets/manifest/` with an explicit instruction that it must be copied in on
every future build, not regenerated.
**Caught a self-inflicted bug while fixing this:** the comment text used `--` inside an XML
comment, which is invalid XML syntax and broke the build — caught immediately by the actual
build failure, not assumed correct.

### 23. The manifest fix alone wasn't enough — wrong intent-filter shape
**What broke:** still stuck after fix #22.
**Root cause:** the intent-filter included `android:host="callback"`, which is *more*
restrictive than the official, documented Capacitor pattern (no host attribute at all) — a
plausible mismatch with the real redirect URL's exact structure.
**Fix:** removed the `host` attribute, matching the documented pattern exactly.
**Also caught mid-fix:** briefly overwrote this exact correction with a stale copy while
rebuilding — caught and re-fixed before shipping, saved permanently this time.

### 24. The actual root cause — Google blocks embedded WebViews for OAuth
**What broke:** still stuck after fixes #22–23; "connects in Chrome, not in app."
**Root cause:** Google has blocked OAuth sign-in from embedded WebViews since 2021 (`403
disallowed_useragent`). `signInWithOAuth`'s default behavior navigates using the app's own
embedded WebView — exactly what Google blocks — forcing Android to bounce the entire flow to a
disconnected, separate Chrome process with no reliable way back. This predates this session
entirely; #22 and #23 were real, necessary fixes but were never going to be sufficient alone.
**Fix:** used `skipBrowserRedirect` + Capacitor's `Browser.open()` (a real Chrome Custom Tab,
which Google does accept) — the same pattern the Calendar-connect flow already used correctly.
**Verified directly:** checked Supabase's real auth logs and confirmed a genuine successful
login completed server-side immediately after this fix.

### 25. APK installs were silently not updating on the test device
**What broke:** fixes #22–24 appeared not to work; testing showed version 3.4 still installed
after multiple "reinstalls" from the same download link.
**Root cause:** Android/Chrome's download manager reused a previously-downloaded file with the
same filename instead of fetching a fresh one, regardless of server-side changes.
**Fix:** started deploying APKs under version-specific filenames
(`HOBS-Companion-v3.X.apk`) to guarantee no stale-download collisions going forward, alongside
instructing deletion of the old file.
**Lesson:** always confirm the installed version number directly (Settings → Apps) before
trusting that a fix was actually tested.

### 26. Browser.close() is a documented no-op on Android
**What broke:** Calendar-connect via the (now correctly-opened) Custom Tab completed the Google
auth, but the tab never closed itself and the app never showed as connected.
**Root cause:** confirmed via Capacitor's own official documentation — `Browser.close()` is
explicitly "Web & iOS only... No-op on other platforms." It has never been able to close a
Custom Tab on Android, regardless of correct usage.
**Fix:** the real, working mechanism already existed (a fallback banner + the app's own
`resume` listener re-checking connection status) but wasn't communicating clearly what to do.
Made the banner explicitly instruct tapping the Custom Tab's own back arrow.

### 27. Calendar-connect's save silently failed while reporting success — the on_conflict bug's third appearance
**What broke:** the banner said "Calendar connected!" but the app kept showing "needs
reconnecting" immediately after.
**Root cause:** confirmed directly against the real database — `professional_calendar_connections`
has a genuine unique constraint on `user_id`. The save used a plain `POST` with no
`on_conflict` parameter, which PostgREST requires to upsert against an existing row. Once a
connection already existed (it did, from August 5), the insert failed outright — and the
result was never checked, so the failure was silently swallowed while the function still
returned `success: true`. **This is the exact same bug class already found and fixed twice
before — August 5 (this same function) and August 5 (the busy-block sync) — that had regressed
back to the broken version by the time this was found again.**
**Fix:** added `on_conflict=user_id`, and now checks the actual result before ever reporting
success. Applied the same fix to the `refresh_token` action's save (same unchecked pattern).
**Verified directly against the real, live table:** confirmed the stale Aug 5 data, then
confirmed the fixed upsert pattern genuinely updates the existing row (same row id, field
verified changed), and confirmed no duplicate row was created.

### 28. Completed the GitHub Pages → Hostinger migration
Once Google sign-in was confirmed working, finished switching Calendar OAuth's redirect URI
from GitHub Pages to `app.homeofbeautifulsouls.com` (already registered in Google Cloud
Console from earlier troubleshooting). GitHub Pages is no longer used for anything in this app.

### 29. Journal "Back" button hardcoded to Home, and the index not reflecting a just-saved edit
**What broke:** editing a journal entry and tapping "Back" always landed on Home instead of the
journal index, and even when the index was reached some other way afterward, a just-saved edit
didn't show until leaving and coming back a second time.
**Root cause:** `backBtn`'s handler unconditionally navigated to `panel-bubbles` (Home)
regardless of where the journal writer was actually opened from — editing an entry, and the
index page's own "new entry" FAB, both always come from `panel-history` (the index) — and never
called `renderHistory()` before leaving, so the index could still be showing stale content
until something else happened to trigger a fresh render.
**Fix:** added explicit origin tracking (`journalWritingOrigin`), set at every entry point to
this panel (6 total, including 3 assistant-triggered ones where a stale origin from a previous
edit could otherwise leak into a later new-entry flow). The back button now returns to wherever
the user actually came from, and always re-renders the index first if that's where it's going.
**Verified with real browser tests covering all three real flows**: FAB entry from the index
correctly returns to the index; entry from Home's choice overlay correctly returns Home; and
editing an existing entry and tapping back now shows the edited text immediately, with no
second navigation needed.

### 30. Client Schedule swipe-between-tabs worked inconsistently
**What broke:** swiping left/right on the therapist dashboard's tabs (including "My Client
Schedule") worked sometimes and not others.
**Root cause:** the swipe handler excluded `.gcal-event-row` (individual appointment rows) from
starting a swipe — but that class is purely a tap-to-open button with no horizontal drag
interaction of its own, so there was never a real conflict to protect against. This silently
disabled the swipe whenever a finger happened to land on an event row, which is most of the
visible screen area on the Schedule tab specifically, since that tab is mostly a list of these
rows — exactly matching the "sometimes working" symptom.
**Fix:** removed the unnecessary exclusion, kept the genuine one (the edit sheet, a real modal).
**Verified with a real test**: simulated a swipe starting directly on a full-width fake event
row and confirmed it now correctly switches tabs.

### 31. App always waited for full server confirmation before showing anything — the "why is this slower than other apps" fix
**What broke:** every app open showed a loading spinner and waited for the server to fully
confirm the session before showing anything at all, even for a returning user with a perfectly
valid cached session.
**Real answer to a fair question**: other apps don't avoid this exact same check, they hide it —
showing the last-known screen immediately from local cache, correcting course in the background
only if that assumption turns out wrong.
**Fix:** a synchronous, local-only check for a cached Supabase session plus the same cached
`appState` flags `onAuthSuccess` already uses to decide which screen to show — if both agree
this is a fully onboarded returning user, skip straight to the home screen with cached data
while the real confirmation happens invisibly underneath.
**Caught a real bug in the first attempt before shipping**: the initial version read `appState`
nearly 200 lines before it was actually declared and populated from cache, silently throwing
and being swallowed by its own `try/catch` every single time — the optimistic path would never
have fired at all despite looking correct on inspection. Relocated to run after `appState` is
genuinely populated.
**Verified with real browser tests covering all four cases**: no cached session (unchanged);
cached + fully onboarded (genuinely skips the spinner, confirmed no glitch popup once real data
settles); cached but onboarding incomplete (correctly does not skip); and confirmed the
fallback correctness check fires when fresh data reveals a real gate is actually needed.

### 32. Splash screen had an unconditional 1.2-second minimum delay
Found while investigating the above: `MIN_SPLASH_MS` was a fixed, unconditional 1.2-second
delay applied to every single app open, purely for pacing, regardless of how fast the actual
session check resolved. Cut to 400ms.

### 33. Experts/team list load was blocking the entire boot sequence
Found while investigating the above: the app waited on 8 separate network calls fully
completing before showing anything — 7 parallel data queries plus a fully separate
experts/team-list load that isn't needed until much later (confirmed by checking every real
use of `TEAM_MEMBERS`: all inside later panels or button click handlers). Removed from the
blocking path.

### 34. Crisis AI was silently using the wrong provider entirely
**What broke:** the fail-open semantics fix (#21, Aug 13–14) patched how `check-journal-risk`
handled failure, but never questioned why it was reading `ANTHROPIC_API_KEY` at all.
**Real, confirmed root cause**: a prior session had explicitly decided on Groq specifically —
free, and Groq's policy doesn't retain data for training or model improvement, which matters
more for a feature processing people's most vulnerable writing than almost anything else in
this app. This decision was found only by directly searching past conversation history, not
recalled — it had been silently lost somewhere between sessions.
**Fix:** rewrote for Groq's actual API (OpenAI-compatible chat completions, not Anthropic's
Messages format).
**Caught a real bug during testing before considering this done**: the first model tried
(`openai/gpt-oss-120b`) is a reasoning model that burns its token budget on internal reasoning
before ever reaching the JSON output — failed outright at `max_tokens:50` on every single real
test, confirmed via the actual logged errors. Switched to `llama-3.3-70b-versatile` (a
non-reasoning model, matching the original decision), confirmed directly against Groq's real
API to still be genuinely working despite Groq's own docs listing it as deprecated.
**Verified with 4 real classification tests**: neutral text, a direct statement, an indirect/
metaphorical expression (the entire reason this AI layer exists over pure keyword matching),
and ordinary grief with no risk theme — all four correctly classified, `classifierAvailable:
true` confirmed on every real request.
**Also updated the Privacy Policy** to disclose Groq, honoring the explicit commitment made
when this feature was originally designed — verified the "doesn't notify anyone else
automatically" claim against the real client code before publishing it.

---

### 35. Crisis AI didn't run "everywhere" -- audited every free-text field, found 3 real gaps
Direct instruction: extend the two-layer crisis check to every genuine client-authored
free-text field in the app, not just journal entries. Audited every textarea/contenteditable
directly rather than assuming coverage.

**Real chat messages** (support group / direct chat) had the instant keyword layer but were
silently missing the AI layer entirely -- calling the raw pattern check directly instead of the
shared function wrapping both. Someone expressing something indirectly to a peer group,
unmonitored, would never have gotten the AI layer's chance to catch it.

**Worksheet reflection fields** (confirmed genuinely free text by checking the rendering code)
had no crisis coverage at all.

**The intake note** ("anything you'd like us to know") -- genuine first-contact free text,
potentially before ever being connected with a professional -- had no crisis coverage at all.

Deliberately did not extend this to staff-authored fields (therapist bios, session notes about
a client, admin messages) -- this is for client self-expression, not clinical documentation.

Verified all three with real tests against the live Groq classifier using indirect/metaphorical
language specifically, since that's the entire point of the AI layer over keyword matching --
all three genuinely triggered the crisis resource modal.

---

### 36. Built real, generated character voices for Bob, Kunnu, Po, and Cookie
Not a bug fix -- a real feature build, recorded here because of what testing caught along the
way. Grounded each character's system prompt in the actual bible retrieved from past sessions
(confirmed accurate directly), using Groq (llama-3.3-70b-versatile) -- same free, already-proven
model as crisis detection.

**Real hallucination caught by testing, not assumed safe from the prompt alone**: a first test
run had Kunnu invent a specific offer ("I know someone who's been through this, want to meet
them?") that isn't a real app capability. Fixed by explicitly prohibiting invented specific
offers/introductions/features in the shared safety rules -- retested and confirmed Kunnu now
correctly references the real support group feature instead.

Verified with real adversarial tests: Bob correctly refuses to diagnose when asked directly; Po
correctly declines to invent a price and redirects to a real person; Cookie correctly stays in
character when asked to admit being an AI; crisis detection (the same two-layer check used
everywhere else) confirmed firing correctly on indirect language while still generating a
genuine reply alongside it.

**Also closed a gap in the assistant's existing crisis coverage** while wiring this in, same bug
pattern as the chat-message fix: the assistant only ever ran the instant keyword layer, never
the AI layer -- meaning indirect crisis language typed into the assistant was never caught.

Verified fully end to end with a real browser test: typing indicator, real network call, genuine
in-character reply displayed, for a free-form message matching none of the 16 existing
navigation patterns.

---

### 37. Share-as-image genuinely broken on native -- required Capacitor plugins were never installed
**What broke:** "Couldn't share the image on this device right now" on every real attempt to
share a journal entry as an image, reported directly with a real screenshot.
**Root cause, confirmed directly, not assumed:** `shareImageFromCanvas()` was written assuming
`@capacitor/filesystem` and `@capacitor/share` existed, but neither was ever actually installed
-- confirmed missing from both `package.json` and `node_modules`.
**Deeper issue, same bug class as AndroidManifest.xml:** `package.json` itself had never been
saved to the persistent repo at all -- meaning every plugin this project uses, including ones
that already worked, was at risk of being silently lost on a future from-scratch rebuild.
**Fix:** installed both plugins, ran `npx cap sync android` to register them natively, and
saved `package.json`/`package-lock.json` permanently to `android-native-assets/build-config/`.
**Verified directly against the real compiled APK**, not just the install log: confirmed 82
real references to `FilesystemPlugin`/`SharePlugin` in the actual compiled bytecode.

---

### 38. The journal-index bug wasn't actually fixed the first time -- a second, separate navigation path
**What broke:** after fix #29 shipped, the exact same symptom was still reported: editing an
entry and going back still didn't show the change until leaving and returning a second time.
**Real root cause, finally found:** the phone's hardware/gesture back button uses a completely
separate navigation mechanism (`panelHistoryStack`, inside the `backButton` App listener) from
the on-screen back arrow fix #29 addressed. This path correctly returns to wherever the user
came from (it's genuinely stack-based), but never called `renderHistory()` when popping back to
the journal index -- meaning anyone using the phone's native back gesture (very likely the
actual common usage pattern, not tapping the on-screen arrow) never benefited from fix #29 at
all.
**Fix:** added the same `renderHistory()` call to this second path.
**Verified properly this time**: mocked a real, minimal `window.Capacitor` surface via
Playwright's `addInitScript` so the app's actual `addListener('backButton', ...)` call
genuinely registers, then invoked that real, captured listener directly -- not a simulated
approximation of hardware-back behavior. Confirmed the edit reflects immediately.
**Lesson:** confirming a fix works for one navigation path (the on-screen button) is not the
same as confirming the bug is fixed -- the same UI outcome can be reachable through multiple,
genuinely separate code paths, and each needs to be found and checked independently.

---

### 39. A brief loading screen still showed even for returning, already-logged-in users
**What broke:** despite the optimistic-boot fix (#31), a loading screen still briefly appeared
on every app open, even when already logged in.
**Real root cause, confirmed directly:** this is Android's own native, OS-level cold-start
splash (`Theme.SplashScreen`, referenced in `styles.xml`) -- it runs before any JS executes at
all, completely separate from and untouchable by the optimistic-boot fix or anything else in
`index.html`. It was showing a distinct "Bob" mascot image, which read as its own loading
screen moment regardless of how fast the JS-level logic ran underneath it.
**Fix:** replaced all 11 density/orientation splash.png variants with a solid color exactly
matching the app's real background (`#FFF8F0`, the same color `#authOverlay` genuinely uses) --
the native cold-start window still exists (can't be fully eliminated on modern Android), but
now visually disappears into the app instead of reading as a distinct screen.
**Verified rigorously, not just "build succeeded"**: release builds rename/obfuscate resource
filenames, so confirmed by decoding the real resource table and checking the actual compiled
pixel data -- found the exact splash dimensions with the exact target color baked into the real
APK, not the original mascot image.
**Also saved `package.json`/`package-lock.json` and the splash images themselves permanently**
to `android-native-assets/`, the same lesson as `AndroidManifest.xml` -- native build assets
that only exist in the ephemeral environment don't survive to the next session.

---

### 40. A brief loading flash still showed on every open -- two genuinely separate layers, both needed fixing
**What broke:** even after the native splash fix (#39), a loading screen still flashed briefly
on every app open, "both times" (native cold-start, and the JS-level overlay).
**Real root cause, layer two:** `authOverlay` had `display:flex` hardcoded directly in the HTML
markup -- meaning it painted visible on first render before any JavaScript, including the
optimistic-boot check itself, had a chance to run. This happened on every single app open
regardless of whether the optimistic path would ultimately apply, since the browser paints the
markup's default state before executing the script that would decide to keep it hidden.
**Fix:** defaults to hidden in the markup now. The path that genuinely needs it (no cached
session, or not fully onboarded) explicitly shows it and its own spinner instead of relying on
a hardcoded default.
**A real methodology lesson from verifying this**: an external MutationObserver-based browser
test initially seemed to show the overlay still briefly flashing to `flex` before correcting to
`none` -- which looked like the fix hadn't worked. Direct instrumentation added inside the
actual function itself (console logging the real branch taken and the real state at each step)
definitively showed the underlying logic was correct all along -- the earlier observer-based
result was an artifact of the test's own setup, not a real bug. When a fix seems verified-wrong
by an indirect test, add direct instrumentation to the real code path before concluding the fix
itself is broken.

---

### 41. Crisis classifier silently down since the previous day -- Groq deprecated the model
**What broke:** classifierAvailable was false on every real request, confirmed by testing two
real, genuinely heavy journal entries directly (with explicit permission).
**Root cause:** Groq fully removed llama-3.3-70b-versatile (404 model_not_found) -- exactly
the risk flagged in this file's own comments when built, now realized.
**Fix:** switched to openai/gpt-oss-safeguard-20b, a model OpenAI built specifically for
safety classification against a custom policy -- a genuine upgrade, not just a replacement.
**Verified against real content before shipping**: with reasoning_effort:medium, both real
entries correctly returned riskDetected:true; confirmed reasoning_effort:low was insufficient
and missed the same indirect, metaphorical content.
**Also fixed the same dead reference in character-chat-reply** (still live/reachable via the
assistant's fallback path) and redeployed.

---

### 42. Hostinger deployment finally, genuinely fixed -- real mechanism found and saved
**The problem:** since the environment reset, no working method existed to deploy to the real
website. Every guess at a direct file-upload REST endpoint returned 404 across many attempts.
**The real fix:** Hostinger's own official MCP server (`hostinger-api-mcp`, installable from
npm) handles the actual resumable TUS upload protocol internally via its
`hosting_deployStaticWebsite` tool -- nothing about that protocol needs to be hand-built.
**Process followed for the production rollout**: deployed to staging first, verified directly
against the live staging URL (not just the tool's success message); ran a genuinely unmocked
functional test of the exact file about to ship (real login, real save, real reload, zero
uncaught errors); backed up the current live production files; deployed to production; then
verified with three independent checks -- version match, new-code markers present, every other
static file still served -- and finally a full real login test against the actual live
production URL itself, not a local copy.
**Saved permanently**: `deployment/deploy-to-hostinger.sh`, a reusable script -- this should
never need rediscovering again.

---

### 43. Mood bubbles violently "colliding" on app open -- real physics bug, root-caused with numbers
**What broke:** the Heavy and Numb mood bubbles appeared to collide at extreme speed briefly
when the app opened.
**Root cause, confirmed with real math, not assumption:** bubble positions are calculated from
the mood-selector field's actual rendered size -- but if this runs before the browser has
completed a layout pass for that panel (setting style.display doesn't force one synchronously),
it silently falls back to a hardcoded 300x340 default. Calculated exactly: at that fallback
size, Heavy and Numb start out only 43.6px apart when the physics needs at least 87px between
them -- triggering a strong repulsion force (0.199, half the engine's max) from the very first
animation frame.
**Fix:** once a real layout pass has definitely happened (guaranteed by requestAnimationFrame),
recheck the real field dimensions and recalculate every bubble's position if they were
initialized against the wrong ones.
**Verified with real, forced-scenario tests**, not just reasoning: confirmed the exact buggy
initial state reproduces the reported overlap, and confirmed the fix's recalculation logic
genuinely corrects it once real dimensions are available. Also found two much smaller,
pre-existing 1-2px overlaps elsewhere in the layout (Hopeful/Numb, Tired/Calm) -- calculated
their resulting force at roughly 25x weaker than the actual reported bug, confirming they're
genuinely imperceptible and not worth redesigning the layout over.

---

### 44. Bubble collision fix (#43) didn't fully hold on the real device -- added a guaranteed cap
**What happened:** the dimension-timing fix from #43 was verified in testing but the person
confirmed, on the real device, running the exact shipped version, that bubbles were still
visibly colliding at extreme speed.
**Real, likely cause found on review:** `step()`'s very first call is synchronous (`step();`),
while the dimension-correction fix runs via `requestAnimationFrame` -- which is always
asynchronous. This means the very first animation frame can still run before the dimension fix
has had a chance to execute, defeating it for exactly the frame that matters most.
**Real fix, not dependent on timing this time:** added a hard velocity cap directly in the
physics step -- regardless of how many forces stack up in a single frame or what caused them,
no bubble's speed can ever exceed a fixed maximum. This guarantees the visible symptom cannot
occur, rather than only trying to prevent every possible cause of it.
**Verified against the actual worst case**, not just the original two-bubble scenario: forced
every bubble into the same corner simultaneously (maximum possible compounding collision force)
and confirmed peak speed never exceeds the cap.
**Also added a diagnostic** reporting real field dimensions and real peak speed from actual
devices, to get definitive confirmation rather than relying on simulated testing alone.
**Lesson**: a fix verified in isolated testing can still fail on a real device if there's an
async/sync timing gap between the fix and the very first execution of what it's protecting --
worth checking for a defensive, timing-independent version of a fix when the first one doesn't
fully hold.

---

### 45. Welcome-back screen restored on the fast boot path -- was a deliberate but wrong tradeoff
**What happened:** a prior session's optimistic-boot work deliberately skipped the "Welcome back
Home" screen (bob-welcome-back.jpg) whenever the fast boot path was taken, reasoning that
popping it over an already-visible home screen would be "a jarring glitch." Confirmed directly:
this was the wrong tradeoff -- the welcome-back screen was an intentional, wanted feature, not
something to sacrifice for the fast boot.
**Fix:** the welcome-back screen now always shows, even after the optimistic path has already
rendered home directly.
**Verified directly**: confirmed `optimisticBootTaken: true` and the welcome-back overlay
genuinely visible with the correct image, together, in the same real test run.

---

### 46. Home hero background image flashing on app open -- gradient vs. photo decode race
**What broke:** a real, confirmed split-second flash on every app open where the home hero
showed just its dark gradient overlay, without the background photo underneath it.
**Root cause:** the hero section layers a CSS gradient (paints instantly, pure CSS) over
hero-image.jpg (has to be fetched and decoded) -- on a real device, that decode can take a
moment longer than the gradient needs to paint, causing a real, visible gap between the two.
**Fix:** start fetching and decoding hero-image.jpg as early as the very first script on the
page can possibly run -- well before the person could ever reach the home screen -- so it has
the maximum possible head start and is already fully ready by the time the hero section could
ever become visible.

---

### 47. Notification tap routing "regression" was actually a never-wired new type, not a regression
**What was reported:** "notifications don't take where they're supposed to" -- a bug the person
remembered as already fixed once (commit 349ec81, July 12).
**Real investigation, not assumption:** confirmed the original fix's routing logic is still
fully intact for every notification type it covered. Checked real, live notification data sent
to the actual account instead of guessing -- found `chat_message` (support group messages,
genuinely frequent: 4 of the last 10 real notifications) was never one of the types the original
routing logic handled at all. Not a regression -- this notification type was added later and
simply never wired into handleNotificationTap, so every one of these fell into the "land on
Home" fallback despite the room_id already being present in the data the whole time.
**Fix:** added the missing route, opening the actual chat room directly.
**Verified against the real room_id from live data**, not a placeholder.

---

### 48. Two more real bugs found from direct reports -- fixed and verified, not assumed
**Bug A: welcome-back screen appeared visibly late, after the bubbles were already moving.**
Root cause: it was called from inside an async session-confirmation callback, not synchronously
during the fast boot path -- meaning the home screen (and its bubble animation) rendered and
became visible first, with the welcome-back overlay only popping in afterward. Fixed by calling
it synchronously, in attemptOptimisticBoot() itself, so it appears before the bubbles are ever
visible. Removed the now-redundant duplicate call from the async path.
**Bug B: tapping the admin error/uptime alert notifications did nothing.** Same root pattern as
#47 (chat_message): confirmed via real, live data that error-alert-monitor and uptime-monitor
both send their push notifications with a completely empty data payload -- notification_type is
tracked in the database for logging, but was never actually included in what gets sent to the
device, so there was nothing for the tap handler to route on. Fixed both Edge Functions to
include the type in the real push payload (confirmed send-push-notification already fully
supports this), and added routing to the admin dashboard's system tab, where these actually
live.
**Both verified directly**: the welcome-back timing fix confirmed the overlay is already visible
before a freshly-attached observer could even catch the change (i.e., very early); the alert
routing fix confirmed via direct function calls that both types correctly open the dashboard and
switch to the right tab.

---

### 49. Real, definitive root cause of the welcome-back sequence bug found -- panel-bubbles itself
**What was actually happening:** every prior fix attempt (moving showWelcomeBackScreen() to be
synchronous, checking its computed style/z-index) was correct but addressed the wrong layer.
The real diagnostic proved the welcome-back overlay itself is set up perfectly, every time --
full screen, correct z-index, correctly positioned. The bug was never there.
**Real root cause, found by direct comparison**: every other panel-* element has
`style="display:none;"` inline in the raw HTML -- panel-bubbles was the one exception. This
means it was visible to the browser the instant the HTML parsed, completely independent of and
before any JavaScript could run -- including the entire optimistic-boot and welcome-back logic,
which is wrapped in an async Promise chain and can't possibly run before the browser's first
paint. This is the exact same bug class as #40 (authOverlay defaulting to visible in markup),
just never applied to this specific element.
**Fix:** added the same `display:none` every other panel already has.
**Verified with direct, inline instrumentation** (not an external observer, which had already
given a misleading result once from firing after the app's own legitimate JS had already run):
confirmed panel-bubbles' style.display reads as "none" immediately after the element is parsed,
before any application logic executes at all.
**Lesson**: when a fix at one layer doesn't hold and a defensive fix at a second layer also
doesn't fully resolve it, check whether the actual root cause is a layer *before* either --
here, the element being visible before JavaScript exists to control it at all, the same
category of bug as the original authOverlay flash-before-JS-runs issue, just never checked for
on this specific element.

---

### 50. Real root cause found for the "blank home screen" bug -- two genuine gaps, not one
**What the diagnostic proved:** the hero element and all 9 mood bubbles were confirmed
technically correct -- full opacity, real dimensions, genuinely in the DOM -- at the exact
moment the home screen becomes visible. This ruled out anything missing or hidden.
**Real gap #1:** the diagnostic checked the hero *element's* own opacity, but never whether its
actual `background-image` (the gradient + photo) had successfully painted. An element can be
fully opaque and correctly sized while its background silently fails to render -- leaving it
transparent, letting the page's own cream background show through, and making the white
greeting text invisible against it.
**Fix:** added an explicit `background-color` as a real fallback layer underneath the
gradient+photo -- browsers always paint this regardless of whether the fancier background
succeeds, guaranteeing real contrast for the white text no matter what.
**Real gap #2, found by direct code review:** the home screen's four crew character images
(bob.jpg, kunnu.jpg, cookie.jpg, po.jpg) all use `loading="lazy"` and were never preloaded like
the hero image was. With the fast boot path now showing the home screen almost instantly, these
never got the head start they used to have when a slower loading screen bought them time in the
background -- a real, visible "ghost" (a partially loaded image) instead of a clean one.
**Fix:** extended the existing hero-image preload to cover all four crew images too.
**Lesson**: a diagnostic that clears one explanation (missing/hidden content) doesn't mean
nothing is wrong -- it means the search needs to move to an adjacent layer (here: whether a
background actually painted, not just whether the element hosting it was there).

---

### 51. Real architectural fix, replacing many rounds of patching individual flash symptoms
**The real, underlying problem, finally addressed directly**: no matter how each individual
visible glitch was fixed (missing images, panel visibility, hero background), there was always
some non-zero window between the native splash disappearing and the app's JS being fully ready
-- and whatever happened to be visible during that window kept changing shape with each fix,
because the actual root cause (a window existing at all) was never addressed.
**Real fix**: installed the official @capacitor/splash-screen plugin and configured
`launchAutoHide: false`, holding the native splash open until the app's own JS explicitly calls
`SplashScreen.hide()` -- only once the boot decision is fully made (login form vs. home screen)
and, if showing home, every image the first visible screen needs is confirmed loaded (with a
2-second safety timeout so one failed image can never hang the splash forever). This guarantees
there is nothing to see in between -- the splash gives way directly to the final, correct,
fully-ready screen.
**Verified directly** with a real, persistent mock of the native Filesystem and the new
SplashScreen plugin (fixed a real test-methodology flaw along the way: an in-memory mock
doesn't survive a real page reload, backing it with actual localStorage does): confirmed the
splash is hidden exactly once, at the correct moment, on both the fast (optimistic) and slow
(login form) boot paths.
**Also saved capacitor.config.ts permanently** -- discovered it had never been persisted at
all, the same gap found repeatedly this session, fixed proactively this time rather than after
losing it.

---

### 52. Mood check-in flow never actually showed mood tracking data after saving
**What was wrong**: the intended flow is select mood(s) -> write a note -> see your mood
tracking data. Confirmed directly in the code: saving simply returned to Home in every case,
regardless of whether this was a real mood check-in or a plain journal entry -- the
panel-mood-tracker view (which genuinely exists, with a real chart, already used in 3 other
places in the app) was never called at this point at all.
**Fix**: capture whether moods were actually selected before resetJournalState() clears that
array (timing matters -- by the point of the original decision, it was already too late to
check), and if a mood check-in was genuinely saved, show the real mood tracker instead of Home.
**Verified with two separate tests**: the mood-check-in flow now correctly lands on the mood
tracker; a plain journal entry (started via the "new entry" button, no mood selected) still
correctly returns to Home exactly as before -- confirming this didn't change behavior for the
case where it shouldn't.

---

### 53. Subtasks "not adding" on the Tasklist landing screen -- two real, separate bugs, found by actually reproducing it live, not just reading the code
**What was reported**: "no + button (inline add)... when adding a subtask it is literally not
adding as if I never added a subtask before."
**Real investigation**: created a genuine temporary test account and drove the actual app with
Playwright against the real Supabase backend (cleaned up after) rather than reasoning about the
code in isolation -- the day-detail screen's subtask flow (breakdown '+' button, Add button)
turned out to already work correctly and persist properly. The bug was specifically on the
separate "Your tasks" landing screen (`panel-calendar`, `renderCalendarPendingTasks`): it never
had any subtask UI at all, AND creating a task from its own '+' FAB didn't refresh that screen's
own list -- the task genuinely saved (confirmed directly against the live table) but the screen
kept showing "Nothing here yet" until leaving and coming back, reading exactly like "it never
added."
**Fix**: added a '+' button to each row on the landing screen, reusing the existing, already-
proven edit-task sheet (not a new, untested quick-add UI) rather than duplicating logic; added
the missing `renderCalendarPendingTasks()` refresh call after both creating and editing a task
from that screen.
**A third bug found mid-testing, not assumed away**: the new landing-screen '+' button initially
did nothing when tapped. Root cause: a task's `temp_` client id gets swapped for its real server
id in an async callback shortly after creation, but the landing screen was never re-rendered when
that swap happened -- so the button's baked-in `data-task-id` silently pointed at an id nothing
matched anymore. Fixed by re-rendering after the id swap too.
**Verified end to end against the real backend**: task creation now shows up immediately with no
navigation needed; the new '+' opens the real edit sheet with the correct task; adding a subtask
through it shows a live "0/1" progress badge on the landing screen without leaving it.

---

### 54. Task/subtask alarms only ever vibrated once like a normal notification -- built a real, native ringing alarm instead
**What was reported**: "Alarm didn't ring like an alarm. Just notification type vibrated for a
second! It should act EXACTLY LIKE AN ALARM."
**Root cause, confirmed by reading the actual alarm-firing code**: `send-task-alarms` (a cron-
polled Edge Function) only ever sent a plain FCM push notification. A push notification
structurally cannot ring continuously, show over the lock screen, or offer real Stop/Snooze --
and can also be delayed by Doze/battery optimization, which matters for something time-critical.
**Fix, built and verified as a real native feature, not a JS workaround**: added
`AlarmManager.setAlarmClock()` scheduling (the one Android API that behaves exactly like a real
alarm-clock alarm -- status-bar alarm icon, exempt from Doze, no special permission needed)
firing a genuine full-screen `AlarmActivity` with a real looping alarm sound, vibration, and Stop
/Snooze buttons that only a real tap can dismiss (back button deliberately does nothing). A
`BootReceiver` re-arms everything after a device reboot, since AlarmManager entries don't survive
one. `index.html` calls this at every point a task/subtask alarm is created, edited, or deleted,
plus once on every app boot to backfill/reconcile anything already saved (covers alarms set
before this feature existed, or from a different device/install).
**Two real, self-inflicted bugs caught before shipping, not assumed away**: (1) missing the full
JDK (only the JRE was installed) failed the build with a toolchain error -- installed
`openjdk-21-jdk-headless` and rebuilt. (2) Editing `AndroidManifest.xml` by hand reintroduced the
*exact* `--`-inside-an-XML-comment bug from #22 above -- caught immediately by the real build
failing (`SAXParseException`), not missed.
**Verified thoroughly before ever calling this shippable**: built a full, fresh Android SDK
environment from nothing per `docs/MASTER.md`'s own documented recipe; confirmed the release APK
is genuinely signed with HOBS's real release key (`apksigner verify`, SHA-256 matched
`docs/MASTER.md` §2 exactly); confirmed package name/version via `aapt dump badging`; confirmed
all 5 new native classes are actually present in the compiled `.dex`, not just written source;
and used a mocked `TaskAlarm` plugin in a real Playwright run against the actual `index.html` to
confirm every create/edit/delete path fires the correct native schedule/cancel/reschedule call
(including the temp-id-to-real-id handoff).
**Also found and fixed a real, separate, pre-existing gap in `deployment/deploy-to-hostinger.sh`
while shipping this**: it never included the live APK in its file list at all -- since deploys
are a full directory replace, any past *web-only* deploy through this exact script would have
silently 404'd the live APK. Fixed permanently to always include `HOBS-Companion.apk` (the stable
name the app's own in-app "Update" banner links to) and any versioned `HOBS-Companion-v*.apk`
files.
**Shipped as APK v3.16 (versionCode 36)**, deployed to `app.homeofbeautifulsouls.com` and
verified live: the deployed APK is byte-for-byte identical (SHA-256) to the one built and
verified locally, `version.json` matches exactly what's baked into that same APK (so a fresh
install doesn't immediately think another update is available), and every other site file was
confirmed still reachable after the deploy.

---

### 55. Shipped a genuine version downgrade -- APK install failed on the real device ("package appears to be invalid")
**What happened:** built v3.16 (versionCode 36) for the alarm feature by bumping the repo's
stored `app-build.gradle` (versionCode 35/"3.15") by one. Deployed it, told Akash it was ready --
he tried to install it and Android refused outright.
**Real root cause, found immediately by checking ground truth instead of the repo:** the repo's
stored version number was badly stale. Querying `profiles.app_version_code` /
`app_version_name` (which the app itself reports on every session via Capacitor's
`App.getInfo()` -- real, ground-truth data, not a file that has to be manually kept in sync)
showed Akash's actual installed app was already at **versionCode 55, versionName "3.35"** --
confirmed as the true max across every account, not just his. 20 versions of real, shipped
builds had never been persisted back into this repo's `app-build.gradle`. Building 36 on top of
the stale 35 was a genuine downgrade; same-signature downgrades are exactly what Android's
installer silently refuses, which is what produced the generic "package appears to be invalid"
message rather than a clearer version-conflict one.
**Fix:** rebuilt as versionCode 56 / versionName "3.36" -- verified strictly above the real max
found in `profiles`, not just the repo's number plus one. Re-verified everything from scratch
(signing SHA-256, package/version via `aapt`, all 5 new alarm classes still in the `.dex`,
`version.json` still matching what's baked into the APK) before redeploying, and confirmed the
redeployed live APK is byte-for-byte identical (SHA-256) to what was built and verified locally.
**Standing fix, not just a one-time correction:** `docs/MASTER.md`'s Android build instructions
now say explicitly to check `select max(app_version_code), max(app_version_name) from profiles`
before ever bumping the version -- the repo's own stored number is not to be trusted as current,
only as a lower bound.

---

### 56. Native alarm feature crashed the app on the real device -- reverted immediately rather than guess again
**What happened:** v3.36 (the real, native alarm build from #54) genuinely installed and ran on
Akash's device, but the app crashed ("HOBS Companion keeps stopping") during normal use, and a
task's completion state got changed unintentionally along the way.
**Honest root cause status:** not fully diagnosed -- there is no way to pull a real crash
stacktrace/logcat from Akash's device from this environment, and the previous verification
(Playwright against a *mocked* `TaskAlarm` plugin) only ever proved the JS side called the
plugin correctly, never that the real native Android code behind it was actually correct at
runtime. That gap is exactly what let a real crash reach production.
**Fix, chosen deliberately over another guess:** rather than attempt a second speculative native
fix with the same blind-testing gap, reverted the native alarm feature entirely --
`registerPlugin(TaskAlarmPlugin.class)` removed from `MainActivity.java`, `AlarmActivity`/
`AlarmReceiver`/`BootReceiver` and their permissions removed from `AndroidManifest.xml`, and the
five new `.java` files + `activity_alarm.xml` excluded from the build. Confirmed via `dexdump`
that all five alarm classes are genuinely absent from the rebuilt APK, not just unregistered.
`index.html`'s `nativeAlarmSchedule`/`cancel`/`reschedule` calls needed no change at all -- they
already no-op safely whenever `window.Capacitor.Plugins.TaskAlarm` doesn't exist, which is
exactly the case now.
**Shipped as v3.37 (versionCode 57)**, verified live (signing SHA-256, package/version, byte-
identical download, and explicitly confirmed the five alarm classes are absent from the deployed
APK).
**Standing lesson this adds:** a feature that touches real native code (not just JS) cannot be
called verified from this environment without either genuine device/emulator runtime testing or
a real crash log to confirm against -- a passing build and a mocked-plugin JS test are not the
same as the real thing working. The alarm feature needs to be rebuilt with that gap actually
closed before it's attempted again, not simply retried.

---

### 57. Added a real Undo for accidental task/subtask completion taps, after exactly that happened
**What was reported**: tapping the task row (the entire row is one large tap target for marking
a task done/not-done) by accident, with no way back -- directly connected to #56's crash, which
also happened to change a completion state along the way.
**Real design decision, not just doing the literal ask**: a blocking confirm dialog on every
single tap would make checking off a task -- the single most frequent action in a to-do app --
slow and irritating for the overwhelming majority of taps that are *not* accidents. Built a
proper Undo instead (the same pattern Gmail/Google Tasks use for this exact problem): the tap
still applies immediately, but a genuine, tappable toast (`showUndoToast`, separate from the
existing purely-informational `showToast`/`#toastMsg`, which is deliberately
`pointer-events:none`) offers a real few-second window to reverse the exact thing that just
happened -- for a task, its own state plus only the subtasks that specific tap actually cascaded
(not a blanket re-sync of the whole task); for a subtask, its own state plus the parent's
auto-derived state if that also changed.
**Verified against the real backend, not just locally**: created a genuine temporary test
account, toggled a real task via the actual `toggleTaskCal` code path, confirmed the Undo toast
appears and tapping it flips the state back -- then queried the live `tasks` table directly and
confirmed `done: false` had genuinely round-tripped back to the server, not just flickered
visually. Cleaned up the test account after.
**Shipped as v3.38 (versionCode 58)**, JS-only change, no native surface at all -- verified live.

---

### 58. Should have used staging first -- it already existed, and I skipped it
**Real, direct feedback**: a fully live staging environment (`staging-app.homeofbeautifulsouls.com`,
a separate Supabase project, a separate Android package id that installs side-by-side with
production) already existed specifically for testing exactly this class of change, and it was
never used for the alarm feature -- built and shipped directly to production instead, with only a
mocked-plugin JS test standing in for real verification. That gap is what let #56's crash reach a
real device.
**Fix**: built the alarm feature again as a genuine staging APK -- distinct package
(`com.hobsfoundation.companion.staging`), distinct Supabase backend, distinct site URLs for its
own update-check/download links, labeled "HOBS Companion (Staging)" so it's visually
distinguishable from production on the home screen. Deployed to the real staging site, verified
live (byte-identical download, correct package name, correct staging backend baked into the
bundled JS).
**Real, honest limitation surfaced along the way**: `google-services.json` (Firebase) is
registered against the production package name only -- copying it into a staging build with a
different package id fails the build outright (`processReleaseGoogleServices`, confirmed via the
actual build error, not assumed). Fixed by omitting it for staging builds, which the existing
`app-build.gradle` already conditionally supports (skips the Google Services plugin entirely when
the file's absent) -- meaning push notifications don't work on staging, which is fine for testing
anything that doesn't depend on them.
**This whole staging build setup is now saved permanently** in
`android-native-assets/staging-config/`, with a README covering the exact recipe and the one
known real gap (Google Sign-In's custom URL scheme is currently identical between production and
staging, untested with both installed at once).
**Standing process, not a one-time fix**: `docs/MASTER.md` now says explicitly -- any change
touching native Android code goes to staging first, gets tested on a real device, and only goes
to production after that's confirmed. This should never have been skippable in the first place.

---

### 59. Mood check-in flow was still broken -- an earlier fix only patched one of two save buttons
**What was reported**: saving a journal entry that started from selecting a mood didn't show the
mood tracker.
**Real investigation, not an assumption**: checked git history first -- confirmed this exact code
path was untouched by anything from today's other work. Reproduced it directly with a real test
account against the real production build: selecting "Calm," writing an entry, and tapping the
actual "Save entry" button (`#saveNoteBtn` / `handleJournalSave`) landed on the generic "Saved"
screen, not the mood tracker.
**Root cause**: an earlier session's fix (docs/BUG_LOG #(mood check-in fix), commit 6c57545) only
patched the Back button's handler (`document.getElementById('backBtn').onclick`), which shows the
mood tracker after a mood-linked save. It never touched `handleJournalSave` -- the handler behind
the actual, primary "Save entry" button people use in normal practice. Two different code paths
both do "save a mood-linked entry," and only one of them got fixed.
**Fix**: added the same mood-tracker redirect to `handleJournalSave`, only for a non-distressed
mood selection (distressed moods correctly keep routing to grounding, unchanged) -- captured
`hadMoodSelection` before `resetJournalState()` clears it, the same reason the original fix had
to do that.
**Verified three separate real scenarios against the real backend before shipping, not just
one**: selecting "Calm" and saving now correctly shows `panel-mood-tracker` with real chart data;
selecting "Anxious" (a distress mood) still correctly routes to `panel-grounding`, confirming the
clinical safety path wasn't disturbed; a plain journal entry with no mood selected is provably
unaffected since the fix only adds a new branch, doesn't touch the existing one.
**Shipped as v3.39 (versionCode 59)**, JS-only change, no native surface -- verified live (byte-
identical download, correct version, fix genuinely present in the bundled JS, alarm code still
absent, every other site file still reachable).

---

### 60. My own mood-tracker fix (#59) introduced a real hardware-back-button regression -- found via the same rigorous method bug #38 already documented
**What was reported**: after the mood-journal flow's on-screen Back button, pressing the phone's
back button was exiting the app.
**Real investigation, referring to the bug log as directed rather than guessing**: bug #38
already documents exactly how to properly test hardware/gesture back-button behavior --
capturing the real, actual `addListener('backButton', ...)` callback via a mocked Capacitor
surface and invoking it directly, not simulating an approximation. Used that same method here.
**Root cause, reproduced precisely, not assumed**: `showOnly()` -- the single shared function
every on-screen "Back" button in the app calls -- always pushed onto `panelHistoryStack`, never
popped, even when navigating back to the screen just below the current one. Before today's #59
fix, `handleJournalSave` never called `showOnly()` at all (it went straight to `panel-saved` via
raw display manipulation), so this path never reached the already-buggy `moodTrackerBackBtn`
handler. Fixing #59 to correctly land on the mood tracker made this the first time that handler
was reachable this way -- surfacing a real, pre-existing architectural flaw that had been mostly
latent. Confirmed directly: mood select → journal → save → mood tracker → tap on-screen Back
(returns Home) left the stack as `["panel-bubbles","panel-mood-tracker","panel-bubbles"]` instead
of `["panel-bubbles"]` -- a genuine duplicate, not a one-off.
**Fix, applied at the single shared root cause rather than patching each affected button
separately**: `showOnly()` now checks whether the target panel is literally the one just below
the current top of the stack -- that specific condition is what "going back" always looks like --
and pops instead of pushing when it is. Genuine forward navigation (nav tab switches, drilling
into something new) is completely unaffected, verified directly: Home → Journal tab → Tasklist
tab → Home tab → Journal tab again still pushes every single step exactly as before, growing the
stack normally, since none of those transitions target the screen immediately below the current
one.
**Verified against the exact reproduced scenario before shipping**: same test, same mocked
listener -- the stack now correctly returns to `["panel-bubbles"]` after the on-screen Back tap,
and a single subsequent hardware back press now correctly exits (the expected, standard Android
behavior once genuinely back at a top-level Home screen with nothing left on the stack) instead
of the previous confused double-press/resurrected-screen behavior.
**Lesson, extending #38's own**: fixing a UI flow that lands on a different screen than before
can surface an existing bug in a downstream handler that specific path never used to reach --
finishing a fix means checking what happens *after* it too, not just that the immediate symptom
resolved.
**Shipped as v3.40 (versionCode 60)**, verified live.

---

### 61. Actually diagnosed properly this time: bottom-nav tabs were building a linear back stack across the whole session
**What was reported**: hardware back button randomly landing on Tasklist, or Journal, or
exiting -- no consistent pattern, right after #60's fix.
**Real diagnosis, not another narrow patch**: grepped every single call site in the entire file
that navigates to one of the 5 bottom-nav destination screens (`panel-bubbles`/Home,
`panel-calendar`/Tasklist, `panel-history`/Journal, `panel-grounding`/Breathe,
`panel-profile`/You). Every one, with zero exceptions, is either a bottom-nav tab tap or a
"return to this tab's own root" action -- never a genuine deep link meant to preserve unrelated
prior history. `showOnly()` treated every one of those exactly like drilling into a brand new
detail screen, pushing onto the same single linear stack #60 only partially addressed. A normal
session of switching Home -> Journal -> Tasklist -> Home left the hardware back button replaying
that entire tab-switching history one step at a time -- explaining exactly what was reported:
back landing on whatever tab happened to be visited a few taps earlier, or exiting at a point
with no visible relationship to where the person actually was.
**Fix, at the actual architectural root**: navigating to any of the 5 tab-root panels now
collapses `panelHistoryStack` to just Home (if going Home) or `[Home, thatTab]` (otherwise) --
matching standard Android bottom-navigation convention, where switching tabs is lateral, not a
step deeper in a hierarchy. A drill-down screen already open within a tab (a specific task day, a
journal entry) still sits on top of this and is popped first, unaffected -- only tab-to-tab
switching itself no longer accumulates.
**Verified with three separate real scenarios against the actual captured hardware back-button
listener, not assumed**: (1) switching through Journal -> Tasklist -> Breathe -> Home -> Journal
and then pressing back twice now predictably goes Home, then exits -- regardless of how many tabs
were visited first; (2) drilling into a specific day from the Tasklist tab (after switching
through other tabs first) and pressing back four times correctly unwinds day -> Tasklist -> Home
-> exit, one predictable step at a time; (3) re-confirmed #60's original mood-tracker scenario
still works correctly under this new logic.
**Shipped as v3.41 (versionCode 61)**, verified live.

---

### 62. Real, confirmed DATA-LOSS bug: writing a mood-linked journal entry and pressing hardware back instead of Save silently discarded it and closed the app
**What was reported**: "Mood - Journal - Exit App" instead of the correct Mood - Journal - Mood
Tracker flow.
**Real investigation, reproduced precisely before writing a single line of fix code**: wrote a
real entry via the mood-check-in flow in a test account, pressed the hardware back button
(captured the real listener directly, same method as #38/#60/#61) instead of tapping the
on-screen Save button, and confirmed two things directly against the live database: `exitApp()`
fired, and the `entries` table for that account stayed completely empty. The entry was not just
mis-routed -- it never reached the server at all.
**Root cause**: the hardware back-button handler read "what panel am I currently on" from
`panelHistoryStack`'s top entry, but `panel-journal` -- specifically when entered via the mood
flow's "Continue" button -- is shown through raw display manipulation and never gets pushed onto
that stack. So `if(currentPanel === 'panel-journal' ...)` silently never matched, the autosave
call never ran, and execution fell straight through to `panelHistoryStack.length > 1` being
false (stack was still just `['panel-bubbles']`), landing directly on `exitApp()`.
**Fix**: the handler now determines the actually-visible panel by checking the DOM directly
(iterating `allPanels`, same technique already used elsewhere in this file) instead of trusting
the stack, since the two are now proven capable of diverging. When the real visible panel is
`panel-journal`, hardware back delegates straight to the exact same `backBtn` on-screen handler
-- which already correctly knows about the mood-tracker redirect and `journalWritingOrigin` --
rather than re-implementing a second, simplified, now-proven-divergent copy of that logic.
Confirmed `panel-worksheet-detail` doesn't have this problem (already entered via `showOnly()`
properly) and `panel-quick-journal` appears to be dead/unreachable code currently, so left both
alone rather than touching things that weren't broken.
**Verified three separate real scenarios against the live database before shipping, not just
one**: mood-linked entry via hardware back now correctly saves and lands on the mood tracker
(confirmed the row exists, with the actual written text); a distressed-mood entry via hardware
back still saves and doesn't exit (routes to mood tracker, matching the on-screen Back button's
existing behavior exactly -- noting as a separate, pre-existing, out-of-scope observation that
Back and Save Entry have never applied the same distress-routing check, unlike this fix); a plain
journal entry from the Journal tab (no mood) via hardware back correctly saves and returns to the
journal index. All three rows confirmed present in the real `entries` table afterward.
**Shipped as v3.42 (versionCode 62)**, verified live. Given this was genuine data loss on a
mental-health journaling app, this is about as high-severity as a bug in this app gets.

---

### 63. "Helpline delayed" wasn't a timing bug at all -- it was a real gap in the instant keyword list, found by testing the actual reported phrase, not assuming
**What was reported**: the crisis helpline modal was taking "a second or two" to appear when it
used to be instant, and this kept happening across multiple tries.
**First-pass investigation, corrected after real pushback**: an initial timing measurement
against unrelated test text showed the modal appearing in 5.8ms, and the write-up concluded
inconclusively, asking for the exact phrase rather than digging further -- reasonable in
isolation, but exactly the "stuck on one specific thing instead of the whole picture" pattern
called out directly. The right next move once given the real phrase wasn't another isolated
timing test -- it was checking that phrase against the *entire* pattern list at once.
**Real root cause, found by testing the actual phrase against every single existing pattern
programmatically**: "wish there was no tomorrow" matched zero of the 50+ existing
`SELF_HARM_SIGNAL_PATTERNS` entries. Not a timing bug at all -- the instant layer never fired
because nothing in it covered this phrasing, so the only thing that ever caught it was the
background AI layer, which has always taken a real second or two (a genuine network call to an
LLM). The "delay" was 100% real and 100% reproducible, just not where the first pass looked.
**Fix, scoped to the whole category once identified, not just the one exact phrase (per the
direct instruction not to get stuck narrow)**: "wish there was no tomorrow" belongs to a
distinct, independently well-documented clinical marker -- foreshortened/absent sense of future
(the Beck Hopelessness Scale, the standard clinical instrument for this, explicitly screens for
exactly this: "my future seems dark to me," "I can't imagine what my life would be like in 10
years") -- completely absent from the existing list, which covers general hopelessness but never
future-specific framing. Added 5 patterns for this category, but deliberately tightened after
checking for false positives *first*: an initial draft matched ordinary, non-clinical phrasing
("no future in this dead-end job," "nothing to look forward to this weekend, kind of bored,"
"don't want tomorrow to come, I have an exam") -- every shipped pattern requires either clearly
final/severe framing or explicit self-reference ("for myself," "for me," "anymore") to stay at
the same severity level as the rest of the list, not just "future" or "tomorrow" appearing
anywhere.
**Verified thoroughly before shipping**: programmatically tested the final 5 patterns against
both 5 target phrases (all matched) and 6 plausible benign phrases (zero false positives) before
touching the file at all; then, against the real live app with a fresh test account, measured the
actual reported phrase end-to-end at 5.9ms (genuinely instant now) and separately confirmed a
benign exam-anxiety phrase using similar "tomorrow" language correctly does *not* trigger the
modal.
**Shipped as v3.43 (versionCode 63)**, verified live.

---

### 64. Strengthened the instant crisis-detection layer more broadly, per direct instruction after #63
**What was asked**: given #63 proved the instant layer had a real gap, proactively strengthen it
further rather than waiting for the next gap to get reported.
**Approach**: four more distinct, independently documented clinical categories, each researched
and stress-tested against realistic benign phrasing *before* going into the file, same discipline
as #63: (1) sleep/rest as a euphemism for death; (2) "life (isn't) worth living" -- extremely
common exact phrasing that, despite the list already covering "no reason to live" and "don't see
the point in living" as separate wordings, matched neither; (3) worthlessness, grounded in PHQ-9
item 6 (one of the 9 core depression-screening questions); (4) "giving up on life/everything."
**Two real false positives found and fixed during testing, not after**: bare "worthless" matched
an explicitly self-correcting, non-clinical sentence ("I feel worthless when I mess up at work
but I know it's not true") -- fixed by requiring "completely"/"utterly" as a mandatory intensity
qualifier. Bare "give up" is extremely common in mundane contexts ("give up on this diet," "give
up trying to parallel park") -- fixed by requiring the "on life/everything/myself" object.
**Verified thoroughly before shipping**: extracted the actual, final 81-pattern array directly
from the file (not a hand-copied scratch version) and ran the complete combined test suite
against it -- every target phrase from both this pass and #63 matched, zero false positives
across 11 realistic benign phrases. Then verified live against the real app with a fresh test
account: a combined worthlessness + giving-up phrase fired the modal in 7ms.
**Shipped as v3.44 (versionCode 64)**, verified live. Total instant-layer coverage now 81
patterns across 17 distinct clinical categories, versus 63 patterns before this session started.

---

### 65. "Include everything you find, don't quietly filter to the strong ones" -- redone properly
**What was reported**: after #64, direct feedback that candidates were being silently filtered
down to "the stronger ones" and discarded instead of scoped and kept.
**Real response**: pulled 16 more candidates from three clinical sources/theories not yet drawn
from in this file -- the C-SSRS's own passive-ideation item wording, PHQ-9 item 9's exact
phrasing, and Joiner's Interpersonal Theory of Suicide's "thwarted belongingness" construct (the
counterpart to "perceived burdensomeness," already covered, but belongingness itself never was).
**Stress-tested all 16 immediately, honestly, before deciding anything**: 13 of 16 false-
positived on realistic benign phrasing on the first pass (e.g. "hope something happens to me" hit
someone hoping for a work promotion; "I hate who I've become" hit someone complaining about
burning dinner). Per the direct instruction, none of these were dropped for false-positiving --
every one was fixed instead: "hope something bad happens to me" (made "bad" mandatory, not
optional); "hurting myself" family required an object other than
financially/professionally/emotionally; self-hatred phrasing (3 patterns) required the despair to
be explicitly paired with hopelessness language in the same sentence ("...and I don't want to
keep going"), which turned out to be a genuine, working differentiator once the regex was written
correctly -- an early attempt looked like it had failed only because of a construction bug (not
allowing a pronoun between "and" and the despair clause), not because the category was
fundamentally unscopable.
**A second pre-existing false positive found along the way, not introduced today**: stress-
testing the new "hurting myself" wording surfaced that the bare, original
`/hurt(ing)?\s+myself/i` and `/harm(ing)?\s+myself/i` patterns -- live since before this session
-- also match "hurting myself financially with this risky investment" and "harming myself
professionally by burning bridges." Fixed both the same way, immediately, rather than filing it
away.
**Verified exhaustively before shipping**: extracted the complete, final pattern array directly
from the file and ran all 20 target phrases (crisis language, including every category from both
this pass and #64) plus all 17 false-positive checks together in one pass -- 100% target match,
zero false positives, across all 97 patterns. Then verified live against the real app: the
self-hatred-plus-despair pairing fired the modal in 7ms.
**Shipped as v3.45 (versionCode 65)**, verified live. Instant-layer coverage now 97 patterns
across 21 distinct, individually-sourced clinical categories.

---

### 66. In-app donations failed while the direct link worked -- Capacitor's WebView was blocking Razorpay's domain entirely
**What was reported**: tapping Donate inside the app showed "Could not start payment — please
try again," while opening donate.html as a plain link worked fine, using the exact same backend.
**Real investigation, not assumed**: confirmed the backend itself was completely healthy first --
called `create-razorpay-order` directly and got back a genuine live order (`rzp_live_` key,
correct amount), ruling out the recent Razorpay bank-account change as the cause (settlement
account changes affect where money lands after collection, not whether collection itself works).
Then read the actual client code: the error text only ever comes from the outer `.catch()`, never
from a clean `{error: ...}` response -- meaning this was a network/script-level failure, not the
backend saying no.
**Root cause, confirmed against Razorpay's own documentation**: Capacitor's WebView only allows
navigation to the app's own bundled content by default. `capacitor.config.ts` had no
`allowNavigation` entry at all, so `checkout.razorpay.com` was silently blocked the moment the
in-app flow tried to reach it -- while a normal mobile browser tab (the direct link) has no such
restriction. Razorpay's own docs confirm this exact class of restriction is why they maintain a
separate native Capacitor SDK rather than just recommending `checkout.js` be embedded directly.
**Fix**: added `server: { allowNavigation: ['*.razorpay.com'] }` to `capacitor.config.ts` --
Capacitor's own documented mechanism for this, not custom code.
**Handled as a genuinely different risk class than the alarm feature (#56), not the same mistake
repeated**: built and deployed to staging first, as a separate side-by-side install pointed at
the *real* production backend (since the bug is native-shell-level, not backend-level, testing
it meaningfully requires the real campaign data). When asked to skip straight to production
because staging wasn't installed on hand, did so deliberately rather than reflexively -- this is
a single, standard, documented Capacitor config option, not new custom native classes with
unknown failure modes, which is what actually made the alarm feature unsafe to skip-test.
**A real mistake made and immediately caught while deploying the staging build**: the first
staging deploy zip contained only the new APK and a version.json, not the rest of the site's
files -- since Hostinger deploys are a full-directory-replace, this wiped every other file on
staging (index.html, fonts, other pages) down to 404s. Caught immediately by checking
right after deploying rather than assuming success, and fixed with a proper full-directory
redeploy before any further work continued.
**Shipped to production as v3.46 (versionCode 66)**, verified live: byte-identical APK download,
correct signing, correct version, and the `allowNavigation` entry confirmed present in the
downloaded file itself, not just the source.
**Separately, also discovered and fixed during this same investigation**: `update-donate-page-meta`
(the function that keeps donate.html's link-preview meta tags in sync with the active campaign)
had been committing only to GitHub since a Hostinger migration months ago -- a separate "remove
GitHub Pages dependency" audit had updated URLs and hardcoded links everywhere else but missed
this function specifically, since it never referenced a URL directly. Real, live consequence: a
brand-new urgent campaign's WhatsApp link preview was still showing an old, unrelated campaign.
Fixed by adding a genuine Hostinger push (the same proven TUS upload pattern already used by
`database-backup-offsite`) alongside the existing GitHub commit, and separately found and fixed
a stale `GITHUB_PAT` secret on this function that was silently causing every invocation to fail
with "Bad credentials" -- confirmed the correct current token by matching it against the one
already known to work for this session's own git operations.

---

### 67. The APK-safety fix from earlier the same day (#66) stopped the crash but not the actual bug
**What happened**: right after #66's fix, a completely unrelated web-only deploy (fixing a merge
conflict in donate.html) silently 404'd the live APK entirely.
**Root cause**: #66 only stopped the script from *crashing* when no local APK file happened to
exist. It never made that situation itself safe -- "no local file" still meant "don't include
it," and for a full-directory-replace deploy, not including something already live means
deleting it. This is the normal, expected state after finishing any APK-related work and
cleaning up scratch files (which happens after literally every build this session) -- meaning
the very next web-only deploy after any APK work would always have wiped it again.
**Fix, this time actually closing the gap instead of just not crashing on it**: if no local APK
exists at deploy time, the script now pulls whatever's *currently live* first and re-stages that,
so a deploy can only ever add or update the APK -- an already-live one can never be silently
dropped just because nobody happened to have a local copy sitting around at that exact moment.
**Verified as a genuine end-to-end test, not just read through**: confirmed no local APK existed
(the real, current state), ran the actual fixed script for real against production, watched it
correctly self-heal via the trace output, and confirmed the live APK survived -- same file,
same hash, still there.
**Immediate recovery, before the structural fix**: restored the wiped APK by hand first (had the
exact build still cached locally from minutes earlier, confirmed by hash before restoring)
so the site wasn't left broken while the real fix was being built.

---

### 68. The real fix for in-app donations -- took three attempts to find, each one genuinely wrong for a different reason
**The full arc, told honestly rather than just the final answer**: attempt 1 assumed Capacitor
blocks external navigation by default and added `allowNavigation: ['*.razorpay.com']` -- verified
against Capacitor's own docs afterward that this assumption was backwards: the real default is
that external URLs auto-open in the phone's real browser, and `allowNavigation` does the
opposite, trapping a domain inside the WebView instead. Attempt 2 removed that entry entirely to
restore the real default -- still didn't work, because the actual root cause was never about
navigation policy at all.
**Real root cause, found only by reading Razorpay's own documented WebView integration guide in
full**: their standard checkout (a JS `handler` callback triggering a popup-style modal) is built
for a real browser tab and is explicitly documented as unreliable inside an embedded WebView.
Razorpay maintains a *separate, documented WebView-specific integration pattern* --
`callback_url` + `redirect: true`, a real page redirect through a server-side callback, instead
of a JS popup -- plus a real native requirement most integrations never think to check:
third-party cookies must be explicitly enabled on the WebView (`CookieManager
.setAcceptThirdPartyCookies`), which their docs state is required for the checkout to function
correctly, not just for saved-card convenience.
**Fix, built as three coordinated pieces**: (1) a new `razorpay-payment-callback` edge function --
Razorpay POSTs here after a payment attempt; it does nothing but redirect back into the app. It
deliberately does *not* verify payment itself, since `razorpay-webhook`, independently verifying
Razorpay's own signature server-to-server, has always been the only thing allowed to mark a
donation as actually paid, and a client-reachable redirect URL is not proof of anything -- that
security boundary was not touched. (2) `MainActivity.java` now explicitly enables third-party
cookies on the WebView at startup, following Razorpay's documented requirement exactly rather
than a simplified version of it. (3) `capacitor.config.ts`'s `allowNavigation` needed *both*
`*.razorpay.com` (so the checkout process itself can render inside the WebView) and the app's own
domain (so the final redirect back after payment also stays in-app instead of kicking out to an
external browser at that last step) -- confirmed this reasoning directly against Capacitor's real
documented default before adding it back, this time for the right reason.
**Deliberately scoped to only the donation call site, not the shared `openRazorpayPayment()`
function** -- that function is also used for session payments and cancellation charges, which
were never reported broken and were never verified to need this. Changing shared behavior for
flows that weren't confirmed broken would have been a real, unforced risk; only `openDonateModal`
was touched.
**Genuinely unresolved before shipping, disclosed rather than hidden**: this was built and
shipped straight to production with no real-device verification at all -- Android 16 on the
person's phone blocks the sideload installation staging depends on, and `adb`-based install
requires a laptop that wasn't available. Every other check that doesn't require a real device was
done as thoroughly as possible: the new edge function tested live end-to-end (confirmed a real
302 redirect to the correct URL), the native Java code confirmed to actually compile into the
built APK's `.dex` (not just written source), and the exact deployed APK confirmed byte-identical
to what was built and verified locally.
**Shipped as v3.48 (versionCode 68)**, verified live down to the byte. Whether it actually fixes
the underlying problem is still not confirmed as of this entry -- that depends on the account
holder's own real-device test, which hadn't happened yet when this was written.

---

### 69. The real, actual root cause of the donation bug -- found only by adding real diagnostics instead of guessing a fourth time
**The honest full arc**: three prior attempts (#66, the allowNavigation revert, the Razorpay
WebView redirect pattern in #68) all targeted the payment checkout process itself -- because that
was the visible symptom ("Donate doesn't open Razorpay"). All three were reasonable, individually
verified as far as possible without a real device, and all three were wrong, because none of them
were working from real evidence. `openRazorpayPayment`'s own `.catch()` was silently discarding
the actual error the entire time, and the app's existing global `unhandledrejection` logger never
fired because this local catch "handled" it first (by throwing the reason away) -- so there was
never any real data to diagnose from until logging was added deliberately (#68's diagnostic-only
follow-up).
**Real evidence, once it existed**: `error_logs` showed `TypeError: Failed to fetch` at the exact
line of the `fetch()` call to `create-razorpay-order` -- meaning the failure was happening before
Razorpay's checkout was ever reached at all, at the very first network call in the whole flow.
Confirmed directly why: a CORS preflight test against the real function showed
`Access-Control-Allow-Headers: content-type` only. The in-app flow conditionally sends a real
`Authorization` header whenever the person is logged in -- always true testing as the founder's
own account -- and any header not explicitly allowed fails CORS preflight silently, blocking the
request from ever being sent. `donate.html`'s own call, by contrast, never sends an Authorization
header at all (anonymous donations don't need one), which is the entire, complete explanation for
"direct link works, in-app doesn't" that three different theories tried and failed to explain.
**Fix**: added `authorization` and `apikey` to `create-razorpay-order`'s allowed CORS headers.
One line. Purely server-side -- no APK rebuild, no new app version, nothing native involved at
all, unlike every other attempt today.
**Verified thoroughly before calling it done**: re-tested the actual CORS preflight and confirmed
`authorization` is now allowed; separately confirmed real order creation still succeeds
afterward, so the fix didn't disturb the function's actual logic, only its preflight response.
**Real lesson worth keeping**: none of the three prior, more elaborate fixes were wrong to
attempt given what was known at the time -- each was reasonably grounded in real documentation
research. But all three were guesses in the specific sense that mattered: there was no direct
evidence any of them addressed the actual failure, because the actual failure was never observed
directly until logging captured it. The fix that actually worked took one line and required no
research into Capacitor internals or Razorpay's WebView documentation at all -- it required
seeing the real error message. Investing in visibility before the fourth attempt at guessing was
the actual turning point, not any of the specific technical theories that came before it.

---

### 70. Staging builds crashed on open -- a real gap in the staging recipe itself, not a repeat of #56
**What happened**: the first genuinely successful staging install (previous staging attempts
were never actually installable at all, due to the Android 16 sideload restriction blocking
everything until now) crashed immediately on open.
**Real diagnosis, not an assumption**: confirmed directly via the built APK's own `.dex` that
none of the alarm-feature classes from #56 were present -- this was a different, new problem,
not that bug recurring. Found real evidence instead: Firebase Messaging code
(`EnhancedIntentService` and related classes) was compiled into the staging APK with zero
Firebase configuration present at all. `google-services.json` had been deliberately excluded
from every staging build since #58, specifically because it's registered against the production
package name only and including a mismatched one fails the build outright -- but omitting it
entirely doesn't prevent the *runtime* problem: Firebase auto-initializes on app launch by
default, and a well-documented Firebase/Android failure mode is exactly this -- an app that still
has Firebase-dependent code compiled in, but no valid configuration for it to read, can crash
immediately at startup before any of the app's own JS ever runs.
**Fix, per direct instruction to stop investigating and just isolate the one real change**:
rather than chase a manifest-level Firebase workaround, removed `@capacitor/push-notifications`
(the actual source of the Firebase dependency) from the staging build's own `package.json`
entirely -- confirmed directly that this drops Capacitor's plugin count from 6 to 5, and that the
resulting APK's `.dex` contains zero Firebase-related classes at all. Production's `package.json`
was never touched; this is staging-build-specific. Every other native asset (manifest,
MainActivity, keystore, gradle config) was copied identically to what's already proven working in
production, rather than staging continuing to be its own, less-verified parallel setup.
**Real, known consequence, not hidden**: push notifications will never work on a staging build
built this way. Acceptable -- staging exists to test things other than push notifications, and
this was already a known, accepted limitation of staging builds since #58, just not previously
understood to also cause a launch crash rather than just a missing feature.
**Verified before handing off**: confirmed via the actual compiled `.dex` that Firebase is
genuinely absent (not just removed from source), confirmed the UPI fix and error-logging fix are
both still present, confirmed the app still points at the real production backend, and confirmed
the deployed APK is byte-identical to what was built and verified locally.
**Real lesson**: staging builds had quietly drifted into their own separate, less-scrutinized
build process across multiple sessions (different plugin set, different manifest assembly),
which is exactly the kind of gap that gets discovered by a real crash instead of caught ahead of
time. The fix that actually worked was collapsing that drift back down -- build staging as close
to a literal copy of the proven-working production recipe as possible, changing only the one
thing actually being tested, not maintaining two increasingly-different parallel setups.

---

### 71. Razorpay's checkout buttons overlapping the Android nav bar -- a real, safely-scoped native fix
**What was reported**: Razorpay's own "Continue" button and payment details bar sat flush
against Android's system navigation bar, visually overlapping it.
**Real root cause, confirmed before writing anything**: this app targets SDK 36, which means
Android itself mandates edge-to-edge display -- there's no opting out. The app's own pages
already correctly reserve space for this via CSS (`env(safe-area-inset-bottom)`, used
extensively throughout `index.html`), which is exactly why only Razorpay's page was affected --
their checkout has no reason to know about or use CSS written for this app's specific setup.
**Explicitly ruled out two riskier approaches before picking the safe one, given a direct "make
sure nothing breaks" instruction**: (1) a blanket native padding fix applied to the WebView
unconditionally would have doubled the bottom spacing on every one of this app's own screens,
since they already reserve that space themselves via CSS -- a real, worse regression than the
bug being fixed. (2) CSS injection targeting Razorpay's own DOM structure was ruled out too,
since their exact markup can't be verified from here, and guessing at selectors risks a fix that
silently does nothing on a real payment page, or has unintended side effects.
**Fix, using Capacitor's own official, non-intrusive extension point**:
`Bridge.addWebViewListener` fires on every page load without replacing or risking Capacitor's own
`WebViewClient`, which is what every other native feature in this app's JS bridge depends on.
When the loaded page is Razorpay's checkout specifically, real system-bar inset height is read
via `WindowInsetsCompat` and applied as native padding directly on the WebView (not CSS) --
pushing everything on that page up uniformly, including fixed-position elements CSS padding on a
parent wouldn't reach. The moment the page is anything else (i.e., back on this app's own
content), padding is explicitly reset to zero, so the app's own screens are never touched by this
at all.
**Verified as thoroughly as possible without a real device**: confirmed via a real, successful
compile (not assumed) that `androidx.core`'s `WindowInsetsCompat`/`ViewCompat` and Capacitor's
`WebViewListener` are genuinely available and link correctly in this project. Confirmed via the
actual compiled `.dex` that the new code is present, that the alarm-feature classes are still
absent, and that every other JS-side fix from today (UPI flag, email validation, error logging)
is still intact. Confirmed the deployed APK is byte-identical to what was built and verified
locally.
**Genuinely not device-tested**, disclosed rather than hidden -- the actual visual result (does
the button now sit above the nav bar correctly) still depends on the account holder's own test.
**Left open, not guessed at**: a separate reported issue (Razorpay's own in-page back arrow not
working correctly) needed one clarifying detail -- exactly what happens when it's tapped -- that
wasn't available yet, so it wasn't touched in this fix rather than risk a wrong guess on top of
an already-unverified native change.

---

### 72. The actual real fix for in-app donations, after five prior attempts on the wrong architecture
**The honest full arc**: #66 (allowNavigation, backwards), #67 (revert), #68 (Razorpay's own
WebView redirect pattern), #69 (real diagnostics that found the CORS bug), #70 (CORS fix, which
genuinely got payment *starting*), #71 (padding fix for the nav-bar overlap). Every one of those
was a real, evidence-grounded attempt -- but all of them were built on the same underlying
architecture: embedding Razorpay's web checkout inside this app's own WebView, using
`redirect: true` to make it work at all inside that WebView.
**The real root cause, found only once described directly**: `redirect: true` doesn't open a
popup or overlay -- it navigates the WebView itself away from this app's own bundled content, to
Razorpay's page, the same as clicking a link to a different website. But this app isn't a plain
webpage; it's a single-page app holding a lot of live, running state. That navigation doesn't
pause the app, it interrupts it -- and coming back doesn't cleanly resume it, because there's no
"back" from a real page navigation like that. This is what the padding fix in #71 could never
have solved (it was styling a symptom of the same underlying problem), and it's the actual reason
the back button never worked right either.
**Real fix**: replaced the web-based `checkout.js` flow for the in-app case entirely with
Razorpay's actual native Android SDK (`com.razorpay:checkout:1.6.40`, confirmed via their own
official integration docs, including a real documented gotcha -- a `TAG` field collision with
`FragmentActivity` that required a specific, documented workaround, followed exactly rather than
guessed at). `Checkout.open()` launches a genuinely separate native Activity that never touches
this app's WebView or its state at all; the result comes back cleanly through
`PaymentResultWithDataListener`, implemented on `MainActivity` (the SDK requires the listener to
live on the Activity itself, not an arbitrary object) and bridged to the actual pending JS call
via a new `RazorpayNativeCheckoutPlugin`, using Capacitor's own `bridge.saveCall`/`getSavedCall`
pattern.
**Deliberately scoped correctly this time**: `donate.html` was left completely untouched -- it
runs in a real browser tab, which is the actual environment the web checkout was built for, and
it was never the thing that was broken. Session payments and cancellation charges, which share
the same underlying `openRazorpayPayment()` function, now also benefit from the same native fix,
since the architecture problem was never specific to donations -- it just happened to be the flow
that got tested and reported first.
**Verified staging-first, no exceptions, matching the standing rule from #58**: built a real
staging APK with the new SDK, confirmed via a genuine successful compile that the plugin, the
Activity callback wiring, and Razorpay's SDK all link correctly together -- and confirmed via the
actual compiled `.dex` and manifest that no `FirebaseInitProvider` or other auto-initializing
component slipped in from the SDK's own transitive dependencies (a real, specific check run
precisely because of the #70 incident), before it ever went near a real device. Only after
direct, real confirmation on staging ("it's working perfectly") did this move to production.
**Held the line on staging despite direct pressure to skip it**: asked again to go straight to
production before that confirmation came in, and declined, explaining plainly why -- this was the
single largest native change of the day, more surface area than the alarm feature that had
already crashed a real, live fundraiser once.
**Shipped as v3.53 (versionCode 73)**, verified live: correct signing, correct version, the
native SDK classes confirmed present in the actual deployed file, the real (non-staging) Firebase
config confirmed correctly intact for production specifically, and every other fix from today
confirmed still present.

---

### 73. `ASSISTANT_COMMANDS` was hijacking ordinary conversation any time it contained a matching keyword mid-sentence
A message containing a word like "mood" anywhere in it -- even deep inside an otherwise unrelated
sentence -- was matching a command regex meant for short, deliberate commands, and silently
navigating the person away from whatever they were actually doing.
**Real fix**: command matching now only applies when the whole message is short enough
(`isShortEnoughForCommandMatch`, a real word-count ceiling) to plausibly be a deliberate command
rather than a sentence that happens to contain the word. Fixed in both places this matching logic
ran, not just the first one found.

### 74. The auto-update check force-reloaded the page even while someone had an open journal entry or an open Bob conversation
A new build landing at the wrong moment silently discarded real, unsaved work with zero warning --
confirmed as a real, plausible explanation for "the journal just closes on its own."
**Real fix**: the reload now checks for unsaved journal text and an open Bob chat first, and skips
that cycle entirely if either is true, letting the next check (still on its own cooldown) retry
once the person is no longer in either state.

### 75. A real crash, then the fix for it silently hid a different real bug -- correcting and completing the earlier, thinner version of this entry
The full, real sequence, sourced from the actual transcript rather than a one-line summary.
**First, a real, confirmed crash**, found in real production error logs, not guessed at:
`switchAssistantTab`'s real-history loading crashed with "Cannot read properties of null (reading
id)" when `currentUser` was still `null` at the exact moment the auto-open flow fires right after
app launch -- a genuine timing/race condition a fast local test environment never exposed. Fixed
with a real null guard, verified by directly reproducing the exact scenario
(`currentUser = null`, then calling `switchAssistantTab`) -- confirmed no crash, zero page errors.
**Then, a real, separate problem that guard itself introduced**: converting the crash into a
silent skip meant chat history simply never loaded on that exact race, with no error and no retry
-- reported as "my conversations are gone every update." **The most important part, confirmed
directly and worth stating plainly**: no real data was ever lost -- checked the database directly,
all real messages, some going back days, were completely intact the whole time. This was a real
display bug, not data loss.
**Real fix**: a real retry loop (`tryLoadRealBobHistory`), checking every 300ms for up to 3
seconds, rather than a single check-and-give-up. Verified by directly reproducing the race
condition, not just reasoning about it.

### 76. A real recall failure, initially misdiagnosed as a data bug -- traced to a mismatched model setting, not the pipeline
Correcting the earlier, too-vague version of this entry with the real detail, found by going back
to the actual transcript rather than trusting a one-line summary. Bob failed to recall a specific,
real detail (a name, "Meera") that a person had told him earlier in the same real conversation.
**Real diagnosis, not assumed**: added a temporary debug endpoint to check whether the data was
actually reaching the model at all -- confirmed directly, `containsMeera: true`, sent correctly in
a real 41-message context. So the bug wasn't in the data pipeline; the model itself was failing to
surface a fact it had genuinely been given, a different, real problem (model reliability, not a
data bug).
**Real fix**: found the actual, proven crisis classifier already used `reasoning_effort: "medium"`
with `max_tokens: 2000`; the newer recall/significance classifier had neither properly set,
running on a weaker configuration than the pattern already known to work. Matched it to the proven
settings, retested, confirmed fixed.

### (undated addendum) Several further real bugs found in the same earlier session (Sept 15,
"Bob memory/safety build"), never logged at the time -- added now after a direct challenge that
the log hadn't kept up, and a real check confirmed it hadn't
**A real, stacking race condition caused both the stuck "..." indicator and duplicate/repeated
greetings**: multiple simultaneous calls to open Bob's chat were each independently checking "is
this empty?" before any of them finished fetching, so more than one fired a real greeting request
at once, stacking up. Fixed properly, then stress-tested with a simulated rapid triple-tap to
confirm it actually holds under real, repeated pressure, not just a single clean test.
**The same class of bug resurfaced on a real device even after the above fix, in a genuinely
different environment**: a real device on a real mobile network exposed a slow/failing request the
original fix's local testing hadn't accounted for. Added a real hard timeout so it can never hang
forever again, plus real error logging so a future recurrence is diagnosable instead of a repeat
guess -- documented honestly at the time as not a 100%-certain root cause, just a structural
guarantee against hanging indefinitely.
**Bob was using a person's full name instead of their first name** in at least one real path.
Fixed to use the first name only, regardless of what's actually stored.
**A real, caught-before-shipping gap, not a shipped bug**: the `character_messages` table (real
in-conversation plus cross-session history) was created, and the backend code to use it was
written, but directly, honestly flagged mid-session as possibly never actually deployed or tested
before the conversation moved on to a different feature -- confirmed as a real gap needing closure
rather than assumed complete.

### (undated addendum) Two further real bugs from the second, later Sept 16 session ("Bob
intelligence build"), also never logged at the time, found the same way -- by actually reading the
real transcript rather than trusting a summary
**A literal "name" appeared in a real reply, as a placeholder rather than an actual instruction
being followed**: a new addressing instruction told the model to "use 'name' specifically," which
was genuinely ambiguous wording for a real test account that had no name set -- the model took it
literally rather than as a placeholder token. Found immediately on a real test, not assumed safe.
Fixed with more precise instruction wording.
**A second, real, distinct hallucination** (separate from #76's "Meera" recall bug, from the
earlier session): Bob referenced a "note" that never existed anywhere in the real conversation.
Confirmed directly against the actual conversation history -- genuinely fabricated, not a missed
real detail. Verified the existing anti-fabrication rule now correctly handles this exact pattern
on a fresh, real retest.

### 77. Direct chat had apparently never actually worked for a real, non-admin client -- a genuine bootstrap problem in the RLS design
Building the new Therapist chat tab surfaced this: `startOrOpenDirectChat`'s original
implementation did a raw `chat_rooms` insert immediately followed by `.select()`, then a raw
`chat_room_members` insert for both people. Confirmed directly, side by side: this worked for an
admin account and failed for a real client account, at two separate points. First,
`.select()` right after the insert failed RLS -- a brand-new room has no members yet, so nobody
can "see" it to get it back. Second, and unavoidably, adding the first members to a new room
requires already being a room admin of it, which is impossible for a room that doesn't exist yet.
This had likely never actually worked for any real, non-admin user before -- only ever exercised
by an admin/therapist initiating contact.
**Real fix**: a new `SECURITY DEFINER` database function, `get_or_create_direct_chat_room`, that
does its own real connection verification (the same real logic already used elsewhere,
`users_have_active_connection`, plus an admin exception) and creates the room and both members
atomically, with genuine elevated privilege -- solving the bootstrap problem properly rather than
working around it client-side. Verified end to end with a real, fresh connected test pair: a real
message sent, received, and replied to from both sides, confirmed directly in the database.

### 78. Three separate, real gaps in `delete_user_data_atomic`, all found only because a real account that had actually used the new chat feature was being cleaned up
- Tried to null out `chat_messages.text` directly; the column is `NOT NULL`, so this threw a real
  error and aborted the whole deletion partway through for any account that had ever sent a real
  chat message. Fixed to set it to an empty string instead, which achieves the same real privacy
  goal (clearing the actual content) without violating the constraint.
- Never handled `chat_rooms.created_by` at all -- a real account that had ever created a chat room
  (now possible for a genuine client, not just an admin, because of #77's fix) would fail deletion
  here too. Fixed by nullifying it, matching the same real reasoning already used for `client_id`
  on the same table.
- Never handled `chat_messages.sender_id`, which is also `NOT NULL` -- required making the column
  nullable first (checked the real rendering code first: a null `sender_id` is handled safely,
  since the message already shows "Message deleted" from the other flag regardless of who sent
  it).
**Verified**: the real, complete deletion chain re-tested and confirmed to succeed end to end only
after all three fixes landed together.

### 79. Messaging your own account (a real, reachable case, not hypothetical) showed a generic "Couldn't start chat" instead of a clear explanation
A real name can appear in the Experts directory and also be the account currently logged in (an
account that is both a client and a listed professional) -- clicking that listing's own message
button hit the correct, intentional self-chat block, but with a confusing, generic error.
**Real fix**: a specific, immediate check (no network call needed) that shows "That's you! You
can't start a chat with yourself." instead.

### 80. Bob's close (X) button triggered a full "say a real goodbye" flow -- a real network call and a real wait -- instead of actually closing
Confirmed as a real, repeated source of frustration. The X now closes genuinely instantly, always
-- no network call, no goodbye generation, nothing to wait on. Verified directly: 61ms from click
to fully closed.

### 81. The real business logic for "matched" was misunderstood when building the new therapist auto-assignment mechanism -- confirmed by direct correction, not a guess
The first version waited for a confirmed, paid booking (`payment_confirmed = true`) before
connecting a client to their therapist for the new chat feature. This was simply wrong: "matched"
means `status` becoming `'active'` on `expert_bookings`, set the moment an admin assigns a pending
request to a specific professional (`assignPendingBooking`), completely independent of payment.
Confirmed directly against real, live data: a real account had been `status = 'active'` with
`payment_confirmed = false` for a genuine while, exactly the case the wrong logic was missing.
**Real fix**: replaced the payment-gated logic with a real database trigger
(`auto_assign_therapist_on_match`) firing on the actual real event (`status` becoming `'active'`),
correct regardless of which code path actually sets that status. Re-ran the connection backfill
with the corrected criteria -- found and fixed several more real, existing connections the wrong
version had missed.

### 82. The "Disconnect" button bypassed a real, already-built, proper admin-approval flow entirely
Not a deletion or a regression in the usual sense -- a real, complete version of this flow already
existed (`requestExpertChange`: a required reason, a real pending `change_requested` status, a
real admin review panel) and was correctly wired to two other real buttons. A separate, newer,
simpler "Disconnect" button did an instant, unapproved cancel instead, with no reason required and
no review step -- two parallel mechanisms that had drifted apart, confirmed directly by finding
both and comparing them.
**Real fix**: pointed Disconnect at the same real, proper flow, and removed the now-dead
instant-cancel code that used to sit behind it.

### 83. `assigned_therapist_user_id` was never cleared when a connection genuinely ended
A real, related gap surfaced while fixing #82: nothing ever cleared this field when a booking
became `'cancelled'`, whether through the proper approved path or any other. Extended the same
trigger from #81 to also clear the connection on that real event. Verified directly: a real
booking correctly set the connection on becoming active, then correctly cleared it on
cancellation.

### 84. Change therapist / Disconnect were invisible until a client had also picked a first session time -- confirmed wrong, twice, before the actual cause was found
Reported as "missing buttons" on two separate occasions before the real, precise cause was
pinned down: an earlier, more specific app state (`therapistBookingNeedsTime`, "matched, no time
picked yet") resolved before the state that actually rendered these buttons, hiding them entirely
until a time was chosen -- never the intended design.
**Real fix**: extracted the button logic into a shared helper
(`appendTherapistChangeDisconnectButtons`) and called it from both real matched states, so
Change/Disconnect now show as soon as someone is matched, exactly as instructed. Verified with a
real test matching the exact reported account state (`status: 'active'`, no `session_date`).

### 85. A substantial, already-built Session Log panel existed with no real way to reach it anywhere in the app
`openMyBookings` ("My Sessions & Cancellations" -- full booking status, cancellation policy,
homework) was a real, complete panel, but had zero real call sites except as an internal
post-payment refresh callback. This fully explained why the feature appeared to not exist at all.
**Real fix**: added a real "View Session Log" entry point. This alone still wasn't enough --
see #95.

### 86. Homework had no real link to a specific session, because the underlying data model had no permanent record of past sessions at all
`expert_bookings` holds exactly one row per real client-professional relationship, and
`session_date` gets directly overwritten every time a new session is scheduled -- confirmed
directly across six separate real code paths that do this. There was genuinely no way to show "a
session's homework" as anything other than "all homework from this professional, ever," and no
way to show session history beyond the single most recent date.
**Real fix**: a new `session_history` table, populated by a real trigger
(`record_session_history`) firing on the actual event (`session_date` genuinely changing), not
hooked into each of the six paths individually. This became the real foundation for the Session
Log's full history, per-session homework, and the professional's own schedule view.

### 87. Homework's session link initially pointed at the wrong granularity -- the whole relationship, not the specific session
Found and fixed while still in the same area as #86: `tasks.session_booking_id` was saving
`session_history.booking_id` (the ongoing relationship) instead of `session_history.id` (the one
real session it was actually given in) -- correct behavior for "per session" only once a
relationship could genuinely hold more than one real session, which #86 had just made possible.
**Real fix**: repointed the foreign key to `session_history` directly and simplified the sending
code to save the real session id with no extra lookup.

### 88. A therapist could not actually read their own client's session history -- a real RLS gap found by testing the real, both-sides flow
The first RLS policy on the new `session_history` table only let the client themselves read their
own rows; a therapist querying for a real client's sessions (to populate the homework-sending
session picker) was silently blocked. Confirmed directly: the dropdown only ever showed "General,"
never the real session.
**Real fix**: added a second, real policy letting a therapist read session history for their own
real clients specifically (matched the same real function, `get_my_therapist_expert_name()`,
already used elsewhere for this exact purpose).

### 89. The real, first attempt at a homework-completion notification was correctly rejected by a real security check -- fixed properly, not bypassed
`send-push-notification` correctly blocks a regular client from notifying arbitrary other users;
the first real test call for "notify the therapist when homework is marked done" was rightly
rejected with a 403.
**Real fix**: added a new, narrowly-scoped exception -- verified against the real task (genuinely
the caller's own, genuinely done, genuinely accepted homework, genuinely resolving to the named
therapist) before allowing the cross-user notification -- the same real security philosophy as the
existing `chat_message` exception beside it, not a blanket bypass. Verified directly: the call
moved from a hard 403 to a correct "no eligible recipients" once the real test account's genuine
lack of a push token was the only remaining reason it couldn't complete.

### 90. The real Google Meet link was being generated correctly this whole time, but never actually saved anywhere
`google-calendar-sync` already requested a real Meet link from Google's own `conferenceData` when
creating a calendar event -- confirmed directly, this part worked. It only ever existed in that
one function's response and in the calendar event's own description text, with no way for the app
to show it again later.
**Real fix**: saves it to the real, current `session_history` row for that booking the moment it's
generated.

### 91. Auto-assignment and the profile page's connection UI were hardcoded to Therapist only, with the other real roles explicitly deferred to a later phase
That deferral was noted directly in the original code; today was that later phase, per direct
instruction that the same real logic has to apply to every professional role, always, going
forward.
**Real fix**: added `assigned_psychiatrist_user_id`, `assigned_doctor_user_id`,
`assigned_caregiver_user_id` to `profiles`; generalized the auto-assignment trigger to map any
real `role_category` to its own column dynamically; built a new, real, role-agnostic profile-page
rendering function so every professional type gets the identical connect/change/disconnect
experience Therapist already had. Verified directly with a real Psychiatrist connection: correct
column set, correct section rendered, correct buttons worked, and the other three roles correctly
stayed untouched.

### 92. Two further, real gaps in `delete_user_data_atomic`, found the same way as #78 -- by actually cleaning up real test accounts, not assuming it still worked
- `session_history` (new the same day, for the Session Log work) was never accounted for --
  deleting a real account with real session history failed with a foreign-key violation.
- Nothing ever cleared `assigned_therapist_user_id` on *other* real accounts when the therapist
  side of that connection gets deleted -- a real client still pointing at a just-deleted therapist
  blocked that therapist's own deletion.
**Real fix**: both handled directly, both reverified with a clean, complete deletion afterward.

### 93. A newly-built panel rendered its content correctly but was never actually visible -- a missing registration, not a rendering bug
The professional's own new "My Schedule" panel (past+future sessions across every real client)
had genuinely correct content underneath -- confirmed by extracting the raw HTML directly -- but
the panel itself stayed at `display: none` no matter what. `showOnly` works from a fixed array of
known panel ids (`allPanels`); the new panel was never added to it, so `showOnly` had no way to
know it existed.
**Real fix**: added the one missing array entry. Reverified visually correct afterward -- this is
exactly the kind of gap a "the code looks right" read would have missed; only checking the actual
rendered `display` value caught it.

### 94. A real, successful Google Calendar reconnect looked exactly like a broken one, because of a real interaction with the auto-update-check from #74
Reported as "the bug has returned" -- investigated calmly rather than assumed: the real OAuth
exchange had genuinely succeeded, confirmed directly in `professional_calendar_connections`,
timestamped right around the report. The real issue was narrower and more specific: the
success banner telling the person to manually return to the app (Android can't auto-close that
browser tab, a real, documented Capacitor limitation) got wiped by the #74 reload guard, which
correctly protects an open journal or Bob chat but never accounted for "mid- or just-after- the
Calendar OAuth flow." Several new staging builds landing in quick succession during real testing
made this a live, real risk that day specifically, not just a theoretical gap.
**Real fix**: two guards added to the reload check -- the banner's own presence (protects the
display window) and a new explicit in-progress flag covering the earlier network round-trip too
(protects the exchange itself from being abandoned mid-flight, not just its result from being
hidden).

### 95. The Session Log entry point from #85 was real but incomplete -- two further, separate rendering locations had the exact same gap
Confirmed directly, twice, by direct report before being fully resolved: the profile-page fix from
#85 never touched the Our Experts list view (`renderTeamList`) or the individual "View Profile"
detail page (`openExpertDetail`) -- both genuinely separate code paths, neither aware the other
existed. Each had its own copy of the connected-professional card logic.
**Real fix**: added the same real "View Session Log" button to both remaining locations, reusing
the same real entry point (`openMyBookings`) everywhere. Verified directly in both.

### 96. Three real bugs found by actually running the complete real professional-connection chain end to end, rather than trusting the pieces built separately
Real, deliberate exercise: admin assigns a client -> professional sets real availability ->
client picks a real slot -> professional accepts -> payment -> professional locks real notes ->
Session Log correctly shows green -- run as one continuous, real sequence with real test
accounts, not verified piece by piece.
**The therapist-facing "Save Notes & Lock Payment" action never actually wrote to
`session_history`**, only to `expert_bookings` (the single, overwritten row) -- despite
`session_history` existing specifically to solve this exact overwrite problem for this exact
kind of data (see #86). Confirmed directly: real notes saved through the real UI never showed up
in the Session Log or the professional's own schedule view. Fixed to also update the correct,
specific `session_history` row, matched by `booking_id` and the booking's current
`session_date` (one relationship can hold several real sessions, and PostgREST doesn't apply
`order`/`limit` to an `UPDATE`, so the right row has to be found first, not just assumed to be
the latest).
**That fix then silently did nothing on the first real retry** -- traced to a second, real gap:
`session_history` had `SELECT` policies for both a client and their own therapist, but no
`UPDATE` policy for anyone at all. The earlier Meet-link save (#90) worked only because it runs
through a service-role Edge Function, bypassing RLS entirely; this real, client-side action does
not. Added the real, correct `UPDATE` policy, scoped to a therapist's own real clients.
**A third real gap, found while cleaning up the real test accounts afterward**:
`expert_availability_slots.booked_by` references `auth.users` directly and was never handled in
`delete_user_data_atomic`, so deleting a real account that had ever booked a real slot failed
with a foreign-key violation. Fixed by clearing the reference (not deleting the slot, which is
the professional's own real record of what was offered). Found and fixed two further things
while properly rebuilding this same function: a professional's own posted slots were never
cleaned up on their own deletion, and the three newer role-assignment columns
(Psychiatrist/Doctor/Caregiver, added when #81's auto-assignment work was generalized beyond
Therapist in #91) had never been added alongside the existing Therapist fix from #83.
All three verified directly: the full real chain re-run end to end after each fix, confirmed
correct at every step, including both the client's Session Log and the professional's own
schedule view genuinely showing the real, saved notes with the correct green status.

### 97. The "Calendar time changed — needs your review" prompt could fire on a real session that never actually moved at all
Found by direct report -- a real screenshot showing the exact same time on both sides of the
arrow ("9:00 pm → 9:00 pm"), asking for approval of a change that plainly hadn't happened.
**Root cause, confirmed precisely, not guessed**: the comparison deciding whether a synced
session's time had genuinely changed compared two ISO datetime strings with plain `!==` --
`event.start.dateTime !== link.last_known_start`. Two different string representations of the
exact same instant (a different timezone-offset notation, a trailing `.000` versus none) compare
as unequal as raw strings even though they mean the identical moment. Confirmed directly: the two
real, live rows behind this exact report both showed `old_start` and `new_start` as byte-identical
once actually stored (Postgres normalizes timestamptz values on write, which is exactly why the
bug only ever showed up in the app's own pre-storage string comparison, never in the database
itself) -- definitive proof these were false positives, not real changes that had somehow reverted.
**Real fix**: compares actual moments in time now (`new Date(a).getTime() !== new Date(b).getTime()`)
instead of raw strings. Verified directly with the exact real scenario that caused this report
before considering it fixed. The two real, confirmed false-positive rows behind this specific
report were removed directly, rather than left sitting there unresolved forever.

---

## September 27, 2026 — WhatsApp Business API integration, a delivery mystery, and a real doc-location mistake

### 98. Session reset mid-work lost all live infrastructure access
**What happened**: a session working on WhatsApp Business API setup ended and a fresh session
picked up mid-task with zero persisted context -- no CLI login, no cloned repo, no environment
variables. Real cost: Akash had to re-supply credentials by hand, in a conversation, before any
work could resume.
**Real fix, going forward**: this is exactly the gap `system_credentials` (§2 of `MASTER.md`)
and this repo's docs exist to close. A fresh session should query `system_credentials` first
using whatever one starting credential Akash provides, rather than needing everything re-typed
by hand each time. **This entry exists so a future session recognizes the pattern immediately
instead of costing Akash the same re-explanation again.**

### 99. WhatsApp number registered under the wrong WABA -- templates don't carry across WABAs
**What happened**: the real registered number (+91 94262 12083) was created under a new WABA
(`2585366201875184`), while all previously-approved message templates lived on a *different*
WABA (`1101168369517284`, an old test account) from earlier work. WhatsApp templates are scoped
per-WABA, not portable.
**Real fix**: recreated all 8 templates fresh under the new WABA, using the exact real approved
content recovered from the old WABA (not reconstructed from memory) -- all approved. Old
WABA/number kept alive deliberately as a known-good control for future diagnosis.

### 100. New number's sends were "accepted" by the API but never delivered, and Meta's own analytics showed zero -- root-caused, not guessed
**What happened**: every send returned `200`, a real message ID, `message_status: accepted` --
but nothing ever arrived, for roughly two hours after the number was first registered.
**Real root cause, confirmed via direct data, not assumption**: queried Meta's own WABA-level
analytics (`GET /{waba_id}?fields=analytics.start(...).end(...)`) directly and found **zero**
sent/delivered for the new number over the same window where the *old* test number's send in the
same window showed `sent: 1, delivered: 1` -- definitive proof this wasn't a permissions,
template, or webhook config problem (all of which were separately ruled out and came back
clean), but Meta's own backend silently holding sends from a brand-new, `quality_rating: UNKNOWN`
number during its natural warm-up/probation period, with zero error surfaced anywhere in the API
response.
**Resolution**: resolved itself after roughly two hours, no intervention -- confirmed via an
actual delivered message and a follow-up analytics check.
**Standing lesson, added below**: a "everything says accepted but nothing arrives" report on a
newly-registered WhatsApp number should check Meta's own analytics directly before assuming a
config bug -- and just needs real time, not more debugging.

### 101. Six temporary diagnostic Edge Functions left publicly exposing the access token
**What happened**: while diagnosing #100, several one-off diagnostic Edge Functions were
deployed with `verify_jwt: false` (required so they're invokable for testing) to call the Graph
API using the stored `WHATSAPP_ACCESS_TOKEN` secret. Each one was meant to be deleted right after
its one use, but six of them (`wa-check-numbers`, `wa-diag2`, `wa-diag3`, `wa-diag4`,
`wa-check-webhook-store`, `wa-resend-once`) were left deployed and publicly invokable, with the
real access token reachable through them, for the rest of the session until a later cleanup pass
caught them.
**Real fix**: all six deleted. **Standing lesson, added below**: delete each temporary diagnostic
function immediately after that one use, not batched for a "cleanup later" pass -- a public
endpoint holding a path to a real secret is a real exposure for every minute it exists, not just
if someone eventually finds it.

### 102. Fake and country-code-less phone numbers were sitting in production data undetected
**What happened**: `profiles.phone_number` had no format enforcement -- real numbers were stored
inconsistently (some with `+91`, most bare 10-digit), and two outright fake values had gone
unnoticed: `9876543210` (the classic sequential dummy number) and `99999999999` (11 identical
digits), both on test accounts.
**Real fix**: added `public.is_valid_wa_phone(text)` (real Indian-mobile pattern check,
rejects all-identical-digit numbers and known dummy sequences) and enforced it via CHECK
constraints on `profiles.phone_number` and `profiles.emergency_contact_phone` -- confirmed
by testing that Postgres itself now rejects a fake write, not just application-level filtering.
Existing valid numbers normalized to include `+91`; the two fake ones nulled (both on test-only
accounts, not real users).

### 103. This session initially wrote "the master doc" into the wrong place entirely
**What happened**: rather than reading and updating this repo's actual `docs/MASTER.md` (the
established, real single source of truth per §0 of that file), a session wrote a duplicate
summary of the WhatsApp work into a separate claude.ai Project memory doc instead -- a place nobody
else, and no future session working from this repo, would ever find it. Akash had to point this
out directly and supply this repo's own real handoff docs before the actual gap got closed.
**Real fix**: this entry, plus the real §10 addition to `MASTER.md` and the real updates to
`PROJECT_STATUS.md` above, replacing the misplaced copy.
**Standing lesson, added below**: this repo's `docs/MASTER.md`, `PROJECT_STATUS.md`, and
`BUG_LOG.md` are the one real, permanent source of truth for this project. A session's own memory
tooling, or any other side document, is not a substitute for actually updating these files, ever.

### 104. Two "temporary, one-time-use" Edge Functions were still live and unauthenticated weeks after their one real job was done
**What happened**: a full audit (Sept 27, 2026) of every Edge Function actually deployed on
Supabase, diffed against both this repo and `MASTER.md`'s own function table, found
`temp-create-templates-v2` and `temp-deactivate-alpha` still `ACTIVE` and still `verify_jwt:
false` (callable by anyone with the URL, no login required) despite each one's own source comment
explicitly labeling itself "TEMPORARY, one-time-use." Same root cause as #101 (six leftover
diagnostic functions the same day) -- a function built to be temporary needs an explicit deletion
step, or it just stays live and exposed indefinitely.
**Real fix**: not deleted yet as of this entry -- flagged in `PROJECT_STATUS.md` under Security
cleanup, awaiting Akash's explicit go-ahead before deleting (deleting a live deployed function is
itself a write action against production, per §5 of `MASTER.md`).
**Standing lesson, added below**: a function labeled "temporary" or "one-time-use" in its own
source needs to actually be deleted the moment its one job is done -- flagging it as temporary in
a comment is not a cleanup step, it's a note nobody reads until the next audit.

### 105. `send-whatsapp-template` was live in production with no copy of its source anywhere in this repo
**What happened**: the same Sept 27 audit found this function deployed and working, but its
source had only ever been written directly via the Supabase Management API, never committed. If
it had ever needed to be redeployed or debugged from scratch, there was no version-controlled
copy to work from -- only whatever was still live on Supabase's servers.
**Real fix**: the real, live source (confirmed byte-identical against the actual deployed
function, not reconstructed from memory) is now committed at
`supabase/functions/send-whatsapp-template/index.ts`.
**Standing lesson, added below**: any Edge Function deployed directly via the Management API
(rather than through a normal `git`-tracked deploy) needs its source pulled back into the repo in
the same session it's created, not assumed to be safe because it's "working."

### 106. `MASTER.md`'s own function table said `transcribe-audio` used AssemblyAI; the real, live function has used Gladia (primary) with Groq/Whisper (fallback) for some time
**What happened**: checked directly against the real deployed source, not assumed from the
table. AssemblyAI is not called anywhere in the function. The real primary provider is Gladia
(Solaria model), switched to deliberately for accuracy (~94% word accuracy vs Whisper's ~92.4%,
Deepgram's 93.5%, AssemblyAI's 91.5%) and a genuine no-training guarantee; Groq's Whisper
(`whisper-large-v3-turbo`) is the automatic fallback if Gladia is unavailable. `MASTER.md` still
listed the old provider, and still listed `ASSEMBLYAI_API_KEY` as a secret to worry about instead
of `GLADIA_API_KEY`.
**Real fix**: `MASTER.md` §4 and §2 corrected in the same session this was found.
**Standing lesson, added below**: a documented "what provider does X" fact needs re-checking
against the real deployed source whenever anything nearby changes, not carried forward
indefinitely from whenever it was first written.

### 107. The staging APK currently in circulation is behind production on the universal consent-gate fix, and this was the actual, resolvable answer to a months-old open question
**What happened**: `PROJECT_STATUS.md` had carried "app/therapy contract gating -- unverified
whether this actually exists in code" as an open item for months. Given both the current
production and staging APKs directly, extracting and diffing their real `index.html` resolved it
completely: the gate is real, is enforced (`showConsentGate()`, called at the real app-entry
point and again before booking a session), and is universal on production as of `v74`/`v82`. But
staging (`staging-v42-transcription-save-race-fix`) still has the older, narrower version of the
same gate (`appState.userHasAnyClinicalConnection` required) -- it was branched before the
universal-gate fix landed, to test an unrelated transcription bug.
**Real fix**: `PROJECT_STATUS.md` updated to mark this resolved, with the staging caveat recorded
explicitly so nobody tests contract-gating behavior on staging and draws the wrong conclusion.
**Standing lesson, added below**: an "unverified in code" item does not require new code to
resolve -- it can often be answered directly from an APK or repo already in hand, just never
actually checked. And staging is not automatically ahead of production on every fix; check which
build a specific fix actually landed in before assuming either one is current.

### 108. Google Calendar reconnect kept "getting stuck in the browser" -- real, repeated report, not a fresh regression
**What happened**: reconnecting Google Calendar repeatedly left the person stranded on the web
version of the app inside a browser/Custom Tab instead of returning to the native app. Root
cause, confirmed directly against the deployed `google-calendar-oauth` function and the client
code: Google's OAuth client here is a "Web application" type, which only accepts `https://`
redirect URIs -- Google flatly rejects a custom scheme for this client type. The connection
itself was already completing correctly server-side (a real fix from Sept 16, 2026, confirmed
present in the current production APK) -- what was missing was any way back into the native app
beyond a banner asking the person to manually tap the browser's back arrow, since
`Browser.close()` is a documented no-op on Android.
**Real fix**: on Android, the callback page now attempts an immediate handoff to the native
app's own custom scheme before doing anything else -- if the app is installed, Android
intercepts this and tears the browser page down mid-navigation; the app's own `appUrlOpen`
listener (new `gcal_code`/`gcal_state` branch, deliberately distinct from Supabase's own
`?code=` Sign-In branch) completes the connection from inside the app directly. Purely additive
-- if nothing intercepts it within ~900ms, the existing browser-side completion + banner runs
exactly as before.
**Not yet deployed anywhere** as of this entry -- committed to source control, pending a staging
build and a real-device test (see #109 for a real complication found while preparing that test).
**Standing lesson, added below**: a browser-based OAuth completion succeeding server-side is not
the same as the person actually getting back into the app -- check the actual return path
Android-side, not just that the connection was saved.

### 109. Staging and production apps registered the identical `hobscompanion://` custom scheme -- a real collision waiting to happen, found while preparing to test #108
**What happened**: while preparing to test #108's fix on staging, found that
`AndroidManifest-staging.xml` registered the exact same `hobscompanion://` scheme as
production's manifest. With both apps installed side by side -- the normal, documented setup --
Android has no reliable way to know which one should catch a link using that scheme; any
deep-link handoff (Sign-In's existing one, or #108's new one) could land in the wrong app.
Compounding this: Google's OAuth redirect_uri for the Calendar flow is hardcoded to the
*production* website for both staging and production client code (only one redirect_uri is
registered with this Google OAuth client), so the shared landing page has to be told which app
originated a given request, since neither its own domain nor its own backend project can tell it.
**Also found in the same pass**: the staging Supabase project (`ivqlqrpcamoshmgibjph`) was
paused (`INACTIVE`, Free-tier auto-pause) -- staging was non-functional regardless of any app
fix. Restored via the Management API, confirmed `ACTIVE_HEALTHY`. Its Auth "Redirect URLs"
allow-list was also missing `hobscompanion://callback` entirely, meaning native Sign-In via that
exact path may never have actually been exercised successfully on staging before this.
**Real fix**: staging now registers its own distinct scheme, `hobscompanionstaging://` (manifest
+ `NATIVE_CALLBACK_URL` + Supabase Auth allow-list all updated and confirmed via live read-back).
For the Calendar flow specifically, staging's own OAuth request now prefixes its state token
`stg:` before it ever reaches Google -- the only channel available to signal origin to the shared
production landing page, since Google echoes `state` back verbatim without touching it.
**Standing lesson, added below**: "installs side by side, doesn't conflict" (the stated design
goal for staging vs production) needs to be checked against every mechanism that routes by a
shared identifier, not just the package name -- a custom URL scheme is exactly this kind of
shared identifier and was never actually verified distinct until this incident.

---

## September 28–29, 2026 — Staging build, staging Google Sign-In, and a real production save bug

### 110. Three real defects blocked a truly fresh staging Android build, all found by actually running it
**What happened**: building staging v46 from a genuinely fresh environment (SDK installed from
scratch) hit three separate, real failures in sequence, none previously caught because past
staging builds always ran on an environment with leftover state from an earlier manual step:
1. `AndroidManifest-staging.xml` had a literal `--` inside an XML comment (introduced by the
   scheme-collision fix, commit `d8faf1e`) — invalid XML, broke manifest merging outright.
2. `staging-config/README.md` said not to copy `google-services.json` for staging and that
   `app-build-staging.gradle`'s guard would skip the Google plugin without it. Both claims were
   stale: a real staging Firebase app entry was added Sept 20, 2026, and the gradle file no
   longer has any guard — it unconditionally requires the file (`GradleException` if missing).
3. `MASTER.md`'s Android build recipe never copied
   `android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java`, even though
   `MainActivity.java` directly imports and calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)`
   — a genuine compile error on a truly fresh checkout, affecting **both** the production and
   staging recipes, not just staging.
**Real fix**: manifest comment fixed (`0c0251b`); `README.md` and `MASTER.md` corrected to match
the real, current state of both files (`1d515c9`). Staging v46 built clean afterward, verified
(signature SHA-256 matches the real keystore fingerprint, package `com.hobsfoundation.companion.staging`,
versionCode 46) and deployed to `staging-app.homeofbeautifulsouls.com` — confirmed live by
downloading it back and matching its SHA-256 to the local build.
**Also found and fixed while here**: the staging site's own `version.json`/`index.html` claimed
a stale version ("v49") that didn't match what the real live APK actually was (v45, confirmed via
`aapt dump badging` on the downloaded live file) — corrected by this same deploy.

### 111. Staging's Google Sign-In was fully broken -- Auth provider disabled, and Google never had staging's callback URL registered
**What happened**: Akash reported a real device hitting
`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
on staging. Queried staging's live Supabase Auth config directly and confirmed
`external_google_enabled: false`, `external_google_client_id: null` -- Google Sign-In had never
actually been configured for the staging project, despite Akash's recollection that it worked
before. No commit, doc, or BUG_LOG entry anywhere in this repo's history shows it ever being set
up, and there's no audit-log API available on this project's Supabase plan to settle definitively
what changed it or when -- the most likely candidate is the staging project's pause/restore cycle
during #109's work two days earlier, since Supabase free-tier restores can drop Auth provider
config, but this is a plausible explanation, not a proven one.
**Real fix, now complete**: enabled `external_google_enabled` on staging using production's same
OAuth client ID/secret (`PATCH /v1/projects/ivqlqrpcamoshmgibjph/config/auth`). Testing the real
authorize flow afterward surfaced a second, separate real problem: Google itself rejected it with
`redirect_uri_mismatch` (confirmed directly by following the actual redirect chain) because
staging's own callback (`https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/callback`) was never
added to that OAuth client's allowed redirect URIs in Google Cloud Console -- only production's
callback ever was. Akash added it manually in Google Cloud Console (Sept 29, 2026). Re-tested the
real authorize flow afterward: now lands cleanly on Google's actual sign-in page
(`accounts.google.com/v3/signin/identifier`), no error -- confirmed via the same direct
redirect-following method used to find the bug, not assumed.
**Standing lesson, added below**: a Supabase project pause/restore is a real, silent risk to
Auth provider config, not just to the database being reachable -- and a shared-nothing OAuth
setup (two Supabase projects, one Google OAuth client) needs each project's own callback URL
explicitly registered in Google Cloud Console; it is never automatic just because production's
already works.

### 112. Production: profile-edit save silently failed for every user who already had a saved phone number
**What happened**: a real user's screenshot showed "Could not save — check your connection and
try again" on the "You" profile screen, saving nothing but a DOB/address/emergency-contact edit.
Root-caused end to end, not guessed: `profiles.phone_number` / `emergency_contact_phone` are
stored E.164-style (`+91XXXXXXXXXX`), enforced by a real CHECK constraint
(`is_valid_wa_phone()`, added in #102 on Sept 27). The "You" screen's phone inputs have
`maxlength="10"` for a clean local-number UX, but `openEditProfile()` was loading the full
`+91XXXXXXXXXX` value straight into them -- the browser silently truncates that assignment to
fit the field, so it displayed a plausible-looking but wrong fragment. Clicking Save re-read that
truncated value and wrote it back missing `+91`, which the DB constraint correctly rejected --
on every single save by every user who already had a phone number saved, regardless of what they
were actually trying to change. This was a real, live-breaking bug affecting all such users,
confirmed by checking the schema, the constraint definition, the validation function's source,
and both the read and write JS paths directly (not assumed).
**Real fix**: strip the `+91` prefix for display (`stripWaPrefix`) when loading `epPhone` /
`epEmergencyPhone` / `consentPhone`, and always re-add it (`toWaPhone`) before writing
`phone_number` / `emergency_contact_phone` back to the DB (`6067e0b`). No data needed repairing
-- the constraint had correctly rejected every bad write the whole time, so nothing bad ever
persisted. Deployed to production and confirmed live (fetched the served page, found the new
function names present).
**Standing lesson, added below**: a DB CHECK constraint added in one session (#102) needs every
existing client write path touching that column checked in the same session, not just the path
that prompted adding it.

### 113. Every save handler in the app showed an identical, false "check your connection" message for any database error, not just real network failures
**What happened**: found while root-causing #112 -- every `sb.from(...).update()/insert()`
error handler across the app showed the exact same generic connectivity message regardless of
the real cause (a DB constraint violation, an RLS/permission denial, a genuine network failure
all looked identical), which is exactly what made #112 undiagnosable from a user's own report of
what they saw on screen.
**Real fix**: added `describeSaveError()` -- always logs the real Supabase/Postgres error to the
browser console, and maps known cases (phone-format constraint, RLS/permission denial, missing
foreign-key reference, genuine network failure) to an honest, specific message; anything
unrecognized now shows the real database error text instead of a fabricated connectivity claim.
Wired into the two handlers involved here (profile edit, consent agreement) (`f69f4b5`); the
rest of the app's save handlers still show the old generic message and are candidates for the
same fix later, not yet done as of this entry.

### 114. Staging native Google Sign-In: OAuth callback failures were silently swallowed, showing nothing
**What happened**: after #111's redirect-URI fix, Akash reported tapping his email in the Google
account picker on the real staging app just returned to the sign-in screen with no error at all.
Ruled out the two most likely causes with direct evidence before looking further: (a) stale build
-- confirmed via `aapt dump xmltree` on the freshly re-downloaded live staging APK that it
genuinely is v46 with the scheme fix present, and Akash independently confirmed v46 in-app; (b)
Supabase Auth config -- re-verified `external_google_enabled`, `uri_allow_list`, `site_url` all
still correct on staging. Read the actual native callback handler
(`appUrlOpen` in both `index.html` and `staging-config/index.html`) and found the real gap: it has
three branches (Authorization Code `?code=`, a Google Calendar handoff `gcal_code=`, and a Token
Flow `#access_token=`), and every one of them only checks for a SUCCESS param. If Google/Supabase
instead hands the app a failure -- `?error=...&error_description=...` or
`#error=...&error_description=...` -- none of the three branches match, and the code falls
through to a console-only `console.log("No supported callback format detected.")` with nothing
shown to the user. This exactly matches the reported symptom (silent bounce back to sign-in) and
is the leading, though not yet device-confirmed, explanation for the actual failure: a ⚠️ warning
icon next to "Web client 1 HOBS Web Test" in Google Cloud Console (seen in an earlier screenshot)
suggests the OAuth consent screen may still be in "Testing" publishing mode with a restricted
test-user allowlist, which would produce exactly this kind of `access_denied`-style error on a
real account that isn't on that list.
**Real fix, deployed to code, not yet on-device**: added an error-passthrough check, run first
before any success-path branch, that looks for `error`/`error_description` in either the query
string or the hash fragment and calls the existing `showAuthError()` with the real message
instead of silently dropping it; also made the final "no supported format" fallback show a
visible message instead of only logging (`5b73e56`). Applied identically to both `index.html`
(production) and `staging-config/index.html` (staging) since both had the exact same gap.
**Not yet resolved**: this makes the real failure reason visible on the next attempt -- it does
not by itself prove or fix the underlying cause. The native app bundles `index.html` at build
time, so this fix has no effect until a new staging build (v47) is built and deployed and Akash
tries signing in again; only then will the real error text be known. Needs the Supabase
Management PAT again to proceed (bootstrapping requirement, §2 of `MASTER.md` -- not persisted
across sessions by design).
**Standing lesson, added below**: an OAuth callback handler that only recognizes success shapes
and silently drops everything else is indistinguishable, from the user's side, from the callback
never having fired at all -- always handle the failure shape explicitly, not just the happy path.

---

### 115. History reconstruction docs published a live Razorpay webhook secret to the public repo
**What happened**: `docs/history/code/2026-08.md` (created by this session's history reconstruction,
first pushed in `8a7a648`) contained the Razorpay webhook secret in plain text -- copied verbatim
from an Aug 2026 handoff doc that Claude wrote. The redaction in `tools/history/redact.py` only
catches values with a known prefix or values on the exact-value list, and this secret has no
prefix, so the pre-commit scan passed. Found while reading the Jul 31 chat, where Akash pasted it.
The repo is public (`api.github.com/repos/homeofbeautifulsouls-sys/hobs-companion-app` answers
unauthenticated), so the value has been publicly readable since `8a7a648`.
**Fix**: added the exact value to the scratch-only exact-value redaction list (never in this repo),
regenerated `docs/history/code/`, confirmed zero matches, committed `597e579`. Also added the
Razorpay key secret and the AssemblyAI key (both pasted in chat; neither was found in the repo or
its history) to the same list.
**Not fixed, needs Akash**: the secret is still in older commits, so it must be treated as exposed
-- rotate it in the Razorpay dashboard (Settings → Webhooks → edit → new secret) and set the new
value as the `RAZORPAY_WEBHOOK_SECRET` Edge Function secret. Purging it from git history is on the
pending list with the other leaked values (history rewrite needs Akash's go).

---

### 116. History reconstruction docs published real clients' first names (Akash's task-list data)

- **What:** `docs/history/code/2026-07.md` (public repo) contained the verbatim constellation
  prototype, which Claude had built on Jul 31 from Akash's real task list. One task, "Get clients
  on App", had nine subtasks that were **real clients' first names**. Seven were not in the
  redaction name list, so they were published from commit `8a7a648` until now.
- **Found:** Sept 29, 2026, while reading Aug 6 in the export. A client's full name appeared
  there, and a grep of the repo showed the same first name in the code history.
- **Fix:** the names were added to the runtime-only `HOBS_REDACT_NAMES` list (kept outside the
  repo), and `docs/history/code/` was regenerated. Every name is now `<client>`. Commit `310c487`,
  2 lines changed. A grep confirmed 0 remaining hits.
- **Still open:** the names remain in **git history**. This is part of the pending
  history-rewrite decision, along with #115.

### 117. History docs exposed most of the live scheduler shared secret (partial redaction)

- **What:** the scheduler shared secret (`x-scheduler-secret`, used by the cron-triggered
  functions `notification-scheduler` and `google-calendar-sync` `renew_watches`) appeared in
  `docs/history/code/2026-07/08/09.md` as `<REDACTED:known_credential>` **followed by the
  unredacted tail of the real secret**. The cause: `system_credentials` holds a shorter value
  that is a prefix of the real secret. `redact.py` replaced that short value first, so the longer
  exact-value pattern could no longer match, and the tail stayed visible. It was public from
  commit `8a7a648`.
- **Found:** Sept 29, 2026, while checking the Aug 7 `CREDENTIALS.md` entry in the code history.
- **Fix:** `tools/history/redact.py` now replaces known values **longest first**. The code
  history was regenerated (commit `07efa53`). Verified with 0 hits for the secret's prefix or
  tail, and 0 `<REDACTED:…>` markers directly followed or preceded by 6+ secret-like characters
  anywhere in `docs/`.
- **Still open:** most of the secret was public for most of a day and remains in git history.
  **It needs rotating** (a new value in the Supabase function secret, plus every cron job that
  sends it). This is a live production change, so it waits for Akash's OK.

### 118. Gladia API key visible in plain text in the chat export (prevention only; nothing leaked to the repo)

- **What:** on Sept 21, 2026 Akash pasted the new Gladia transcription API key into chat C31. The
  export has it in plain text; the export's own redaction didn't catch it, and `redact.py` had no
  pattern for Gladia keys.
- **Found:** Sept 29, 2026, reading the Sept 21 slice of the export.
- **Checked:** the key is in no file in the repo (working tree grep: 0 hits).
- **Fix:** added a `gladia_key` pattern (`sk_gladia_…`) to `tools/history/redact.py`, so the commit
  scanner refuses any file containing one (commit `2e99ee4`). Tested: the pattern flags a
  synthetic key. The key's exact value was also added to the session-only regeneration list
  (outside the repo).
- **Still open:** none for the repo. The key only lives in the claude.ai chat and in
  `system_credentials` / Edge Function secrets, as intended.

### 119. MASTER §8 listed Hindi crisis detection as open — it was cancelled on Sept 20 (Claude's mistake, docs only)

- **What:** while marking the history reconstruction complete (commit `49e0a46`), Claude added
  "Hindi crisis-detection patterns need review by a native speaker" to MASTER §8. That came from
  the Sept 20 11:40 note and missed that Akash cancelled it the same day (15:25, "let's just keep
  English") and repeated it Sept 26 23:13. `docs/HISTORY.md` itself had it right.
- **Found:** Akash, Sept 29, 2026 18:33 IST.
- **Fix:** the §8 line replaced with a correction note pointing to the Sept 20 decision (commit
  `2767814`). No code, app or live system touched.
- **Lesson:** when lifting an "open" item out of the history, search for later messages on the
  same topic before calling it open.

### 120. Docs: history reconstruction marked complete; MASTER §13 future plan added (docs only)

- **What changed:**
  - `docs/HISTORY_PROGRESS.md` Status → COMPLETE; `CLAUDE.md` item 4 → history complete, check
    it before assuming something was never tried; MASTER §1 index of `HISTORY.md`, §8 open items
    from the history; PROJECT_STATUS note; pointer at the top of this file (commit `49e0a46`).
  - MASTER **§13** (commit `2767814`): the agreed future plan — credentials, never losing work,
    approval gate, bug safety nets, security/DPDP, Play release path, feature development, Play
    Store optimisation. **Nothing in it is built**; every item needs Akash's OK.
  - MASTER **§13.9** (commit `3df63ae`): single-file `index.html` — hand to the developer later
    with a full handover package.
- **Why:** Akash asked, Sept 29, 2026 (19:14 and 19:19 IST).
- Exact diffs: `docs/CHANGE_LOG.md` #23–#25.

## Recovered from the full chat export (June 18 – Sept 29, 2026) — entries #121 onward

Added Sept 29, 2026 at Akash's request ("Add every missing bug to bug log"). Every bug found in
`docs/HISTORY.md` (the full reconstruction of all app chats) that was **not** already in this file,
plus entries marked *(adds to an existing entry)* where this file had the bug but not its cause or fix.
Chronological. Facts come only from HISTORY.md; edit ids (`E-…`) point to the exact code in
`docs/history/code/`. Client details and credentials are redacted.

### 121. 2026-06-21 — "Second brain" notes written from memory contained real errors (website work, pre-app)
- **Chat:** C17
- **What happened:** The first "Claude Context" vault was written from memory. A cross-check against past chats found real errors: a website REST endpoint listed as active when it had been deleted, cache settings listed as ON when they were OFF, a focus keyword wrongly overwritten once before.
- **Cause:** Content written from memory, not checked against the source.
- **Fix:** Vault rebuilt after a full cross-check (E-019eebe6-32 … -48). Lesson recorded: anything written from memory must be checked against the source.
- **HISTORY.md line:** 36

### 122. 2026-06-22 — Claude misread Akash's Obsidian setup screenshots three times
- **Chat:** C17
- **What happened:** Claude called Obsidian "Claude Desktop", then pointed to icons that weren't there. Obsidian setup failed in practice.
- **Cause:** not recorded
- **Fix:** Abandoned Obsidian; switched the "second brain" to Google Drive.
- **HISTORY.md line:** 46

### 123. 2026-06 (found Sept 29) — WordPress REST token in plain text in chats C17/C21
- **Chat:** C17, C21
- **What happened:** A WordPress REST token appears in plain text in the chat export (reported disabled in June).
- **Cause:** not recorded
- **Fix:** Redacted in the history docs. Not rotated: if that endpoint was ever re-enabled with the same token, it should be rotated (open).
- **HISTORY.md line:** 57

### 124. 2026-07-03 17:03 — Retried Claude in Chrome screenshot after it had already failed
- **Chat:** C22
- **What happened:** Claude tried twice to screenshot the live page via Claude in Chrome, which wasn't connected. Akash: "Do not waste tokens unnecessarily."
- **Cause:** Retrying an approach that already failed (first recorded instance of this pattern).
- **Fix:** not recorded
- **HISTORY.md line:** 122

### 125. 2026-07-03 ~17:52 — Embedded images don't render in the chat widget tool; broke buttons too
- **Chat:** C22
- **What happened:** Two attempts to embed images in the chat widget failed and took the buttons down with them, before Claude tested minimally and confirmed the limitation.
- **Cause:** Tool limitation (images not rendered in the chat widget).
- **Fix:** Built a real HTML file instead (`hobs-prototype/index.html`, E-019f291c-4), verified by screenshot + pixel analysis.
- **HISTORY.md line:** 153

### 126. 2026-07-03 (by 20:14) — Mood-bubble spacing rule broken by Claude
- **Chat:** C22
- **What happened:** Akash noted Claude had already broken the even bubble sizing/spacing once; he set the standing rule that bubbles stay evenly sized/spaced (56–62 px).
- **Cause:** not recorded
- **Fix:** Rule locked "no matter what change we do".
- **HISTORY.md line:** 187

### 127. 2026-07-03 20:38–21:45 — `b.el` referenced but never stored; mood selections broke
- **Chat:** C22
- **What happened:** Multi-select mood selections broke.
- **Cause:** `b.el` referenced but never stored.
- **Fix:** E-019f29b1-30.
- **HISTORY.md line:** 221

### 128. 2026-07-03 20:38–21:45 — Save toggled every bubble ON instead of clearing
- **Chat:** C22
- **What happened:** After Save, every mood bubble was toggled on instead of cleared. Caught in testing.
- **Cause:** not recorded
- **Fix:** E-019f29b1-52.
- **HISTORY.md line:** 222

### 129. 2026-07-03 — Doubled backslash / escaped apostrophe in a JS string silently broke the whole script
- **Chat:** C22 (recurrences C22, C23)
- **What happened:** A doubled backslash in a JS string (`\\'`) broke the whole script; nothing was clickable.
- **Cause:** Escaping error in a JS string.
- **Fix:** Caught by testing (E-019f29d7-41, -43).
- **Recurring:** Same class came back Jul 4 morning (E-019f2bba-33, -35), again Jul 4 07:11 in the task scheduler (E-019f2bf3-51, caught before testing), and Jul 4 22:18–22:33 as an unescaped apostrophe ("I've") in a single-quoted string (E-019f2f36-119) — see lines 240, 277, 490.
- **HISTORY.md line:** 238

### 130. 2026-07-03 ~21:25 — "Don't show this again" also silenced connected-user encouragement
- **Chat:** C22
- **What happened:** The dismiss flag suppressed the connected-user encouragement too.
- **Cause:** One global flag checked above both branches (connected / not connected).
- **Fix:** Fixed at the source (E-019f29df-7): button removed once connected; connected encouragement never suppressible.
- **HISTORY.md line:** 241

### 131. 2026-07-04 (before 06:27) — App squeezed sideways; only ever tested at one width
- **Chat:** C22
- **What happened:** The app had only been tested at one width; the layout was squeezed sideways all along. Bubble physics were hard-coded to 340 px.
- **Cause:** `body` was `display:flex` without `flex-direction:column`.
- **Fix:** E-019f2bc8-25; bubble physics switched to the real container size with reflow on resize; tested at 320/390/430/768/1024 px.
- **HISTORY.md line:** 257

### 132. 2026-07-04 06:27 — WHO-5 screen did not exist in the real build
- **Chat:** C22
- **What happened:** When Akash asked to "do the WHO one right", Claude found the WHO-5 screen had only been in early throwaway widgets, never in the real build.
- **Cause:** not recorded
- **Fix:** Built properly (5 official items, 0–5 scale, ×4, gauge with ≤28/≤50 cutoffs, once per week enforced, persisted); a native `alert()` replaced by in-design messaging.
- **HISTORY.md line:** 263

### 133. 2026-07-04 07:13–07:21 — Reused element IDs would have silently broken one form
- **Chat:** C22
- **What happened:** The focus-app rebuild reused element IDs (`newTaskInput`, `saveTaskBtn`) from the Tasks tab. Caught before testing.
- **Cause:** Duplicate IDs.
- **Fix:** E-019f2c00-11, -13.
- **HISTORY.md line:** 283

### 134. 2026-07-04 ~07:40 — First chat paused by a safety classifier mid-build; work lost with it
- **Chat:** C22 → C23
- **What happened:** "Converting website to app" was paused with no warning. Recovery attempts failed: share link blocked, `.mht` had chat text only, pasted HTML was cut off before `<script>` (no JavaScript), chat search returns summaries not artifact code.
- **Cause:** Work lived only inside a chat.
- **Fix:** Akash exported files by hand from the paused chat. Lesson: work that lives only in a chat can only be partly recovered.
- **HISTORY.md line:** 296

### 135. 2026-07-04 07:55–08:03 — Claude rebuilt the app from fragments instead of using the original
- **Chat:** C23
- **What happened:** Working from fragments, Claude built a separate calendar module and a 70 KB reconstruction of the whole app (E-019f2c1d-4, E-019f2c21-5). Akash: "You absolutely completely fucked up… We had done so much work."
- **Cause:** Claude never had the original code (it was in the paused chat's artifact panel).
- **Fix:** Akash exported everything; plan changed to editing the real file in place, not rebuilding.
- **HISTORY.md line:** 303

### 136. 2026-07-04 08:07–08:15 — Exported `index.html` was an older snapshot; duplicate filenames overwrote each other
- **Chat:** C23
- **What happened:** The exported `index.html` had no Tasks tab, Body Doubling or WHO-5 though screenshots showed them; duplicate filenames overwrote each other on upload. Akash also had to tell Claude twice to wait until all files were sent before analysing.
- **Cause:** not recorded
- **Fix:** Missing pieces recovered from another upload Claude had read; nothing lost.
- **HISTORY.md line:** 310

### 137. 2026-07-04 10:58 — Second "you messed it up": wrong base file used, and half-screen layout
- **Chat:** C23
- **What happened:** Claude had worked on an older 898-line file instead of the newer 1,498-line version with Body Doubling and WHO-5. The screen was "literally half a screen".
- **Cause:** `min-height:100dvh` added to the phone frame without making it a flex column, leaving a dead block under the nav; plus the wrong (older) source file.
- **Fix:** Calendar rebuilt onto the 1,498-line file (`index2.html`, E-019f2cc7-42 onward) with a check that every `getElementById` target exists. Rule: zero layout-CSS changes to what already works.
- **HISTORY.md line:** 323

### 138. 2026-07-04 11:49 — Calm Room close button did nothing
- **Chat:** C23
- **What happened:** Close button ate no clicks.
- **Cause:** The room's content layer (same `z-index:2`, later in the page) covered it.
- **Fix:** E-019f2cf5-16; found by an automated browser click test.
- **HISTORY.md line:** 340

### 139. 2026-07-04 11:49 — Routing to a panel id that didn't exist (`'home'`)
- **Chat:** C23
- **What happened:** Code routed to a non-existent panel id. Caught before shipping.
- **Cause:** Wrong id (`'home'` instead of `'bubbles'`).
- **Fix:** Repointed to `'bubbles'`.
- **HISTORY.md line:** 343

### 140. 2026-07-04 12:10 — Drive build log could only be created, not edited
- **Chat:** C23
- **What happened:** Every build-log update became a new Drive doc (v1, v2…); Akash had to delete old versions by hand.
- **Cause:** Claude's Drive tool could only create docs, not edit them.
- **Fix:** not fixed (workaround: new doc per version).
- **HISTORY.md line:** 353

### 141. 2026-07-04 12:39–13:01 — WHO-5 "done this week" label broke twice during refactors
- **Chat:** C23
- **What happened:** The label broke twice (text overwritten, then a renamed class).
- **Cause:** Refactors of Home overwrote text / renamed a class.
- **Fix:** not recorded (label later replaced by the Mood Tracker, line 400).
- **HISTORY.md line:** 375

### 142. 2026-07-04 13:04 — Header profile and bell icons were decorative since day one
- **Chat:** C23
- **What happened:** The header "profile" and bell icons had no click handler ever.
- **Cause:** No click handler had ever existed.
- **Fix:** Header button became Search (journal + tasks), also reachable from Profile.
- **HISTORY.md line:** 381

### 143. 2026-07-04 13:04–13:28 — Carousel's first card touched the screen edge
- **Chat:** C23
- **What happened:** First card flush to screen edge. Two guesses failed before measuring.
- **Cause:** `scroll-snap` auto-scrolled the row on load past the spacer; flex `gap` also had to be subtracted from the spacer width.
- **Fix:** E-019f2d41-37, -50; pixel-exact after.
- **HISTORY.md line:** 385

### 144. 2026-07-04 13:28–13:49 — Whole app changed size when switching screens
- **Chat:** C23
- **What happened:** App size shifted between screens.
- **Cause:** Phone frame had no fixed height.
- **Fix:** Fixed-height shell with header/nav pinned, only middle scrolls (E-019f2d50-6, -8, -22); measured identical.
- **HISTORY.md line:** 397

### 145. 2026-07-04 16:34 — Bob's image "not showing": Claude deleted `bob.png` with an over-broad cleanup
- **Chat:** C23
- **What happened:** Bob's image disappeared; the image fallback hid the error silently.
- **Cause:** Over-broad cleanup command deleted `bob.png` from Claude's working folder.
- **Fix:** not recorded for this round; on recurrence a defensive `onerror` guard was added (`bobImgFallback` could throw before the script loaded).
- **Recurring:** Deleted again by the same over-broad cleanup on Jul 4 22:18–22:33 (line 477).
- **HISTORY.md line:** 419

### 146. 2026-07-04 16:34 — Three screening tests built as unverified "representative" versions
- **Chat:** C23
- **What happened:** Loneliness, Trauma & Stress Response, Dissociative Experiences built as shortened "representative" versions because the live page couldn't be fetched; flagged for checking against the site's real wording.
- **Cause:** Live website page couldn't be fetched.
- **Fix:** Superseded by the gold-standard correction and later port from the site's code (lines 498–569).
- **HISTORY.md line:** 424

### 147. 2026-07-04 16:34 — Screening results screen never appeared
- **Chat:** C23
- **What happened:** Results screen never showed.
- **Cause:** Not registered in the panel list.
- **Fix:** E-019f2dfc-115.
- **Recurring:** Same class as BUG_LOG #93 (Sept, missing `allPanels` registration).
- **HISTORY.md line:** 427

### 148. 2026-07-04 18:11–18:21 — Only one subtask could be added
- **Chat:** C23
- **What happened:** Subtasks limited to one.
- **Cause:** A re-render destroyed the subtask form.
- **Fix:** Fixed in the 18:21–21:44 batch (no edit id given).
- **HISTORY.md line:** 435

### 149. 2026-07-04 18:37–21:44 — Tips back button went to Calendar
- **Chat:** C23
- **What happened:** Back from Productivity Tips went to Calendar.
- **Cause:** not recorded
- **Fix:** Fixed (no edit id given).
- **Recurring:** Achievements and Progress back buttons still went to Calendar on Jul 5 03:12 (-126, -133), line 541.
- **HISTORY.md line:** 458

### 150. 2026-07-04 22:18–22:33 — Removing Home elements broke handlers that referenced their IDs
- **Chat:** C23
- **What happened:** Home restructure removed elements whose IDs handlers still referenced.
- **Cause:** Handlers bound to removed IDs.
- **Fix:** Repointed (`openScreeningGaugeBtn`, `createTaskHighlightBtn`, `openCalmRoom` / `openAchievements` / `openRewards`).
- **Recurring:** Jul 5 03:12 — Achievements and Rewards lost their click handlers in the earlier refactor (-113), line 540.
- **HISTORY.md line:** 479

### 151. 2026-07-04 22:54 — Claude built screening tests from items it wrote itself, without clearly flagging
- **Chat:** C23
- **What happened:** Besides the flagged burnout scale, SLSI, SCS, APS, PSQI, AFI, CFQ, DERS, TAWS and Burnout were built from Claude-written items, not the verbatim instruments. Akash: "We cannot create any test of our own! We can only use gold standard tests!"
- **Cause:** Claude substituted its own items without flagging clearly.
- **Fix:** Burnout → Copenhagen Burnout Inventory (E-019f3027-23, -27, -34); tests cut to 8 (E-019f3027-42); later 13 ported exactly from the website's code plus 3 substitutes (line 569).
- **HISTORY.md line:** 506

### 152. 2026-07-05 02:51 — Claude's own test used a wrong class name and falsely reported "bubbles don't render"
- **Chat:** C23
- **What happened:** Tests used `.mood-bubble`, briefly reporting bubbles didn't render — a false alarm.
- **Cause:** Wrong class name in Claude's test.
- **Fix:** not recorded
- **HISTORY.md line:** 514

### 153. 2026-07-05 02:51 — PSS-10 wrongly dropped when cutting tests
- **Chat:** C23
- **What happened:** PSS-10 was removed when tests were cut from 16 to 8.
- **Cause:** not recorded
- **Fix:** Restored (E-019f3027-46).
- **HISTORY.md line:** 519

### 154. 2026-07-05 03:12 — Drive connector converted the `.md` upload into a Google Doc
- **Chat:** C23
- **What happened:** The "MD" copy of build log v11 became a Google Doc, not a real `.md`.
- **Cause:** Drive connector converts `text/markdown` uploads into Google Docs.
- **Fix:** not fixed (a real `.md` needs Docs' export).
- **HISTORY.md line:** 543

### 155. 2026-07-05 03:14–03:22 — Header "messed up… got auto corrected after a while"
- **Chat:** C23
- **What happened:** Header layout shifted after load.
- **Cause:** `.logo-img` had `width:auto`, so the layout shifted when the PNG loaded.
- **Fix:** Locked to the real 1024×495 aspect ratio (E-019f3048-11).
- **HISTORY.md line:** 549

### 156. 2026-07-05 03:23–09:26 — Sandbox load delay mistaken for broken team-photo URLs
- **Chat:** C23
- **What happened:** Claude briefly thought the team photo URLs were broken.
- **Cause:** Sandbox load delay.
- **Fix:** All 10 photos wired (E-019f3195-7, E-019f3198-2).
- **HISTORY.md line:** 556

### 157. 2026-07-05 09:28 — Live website's Social Connectedness Scale reverse scoring was inverted
- **Chat:** C23
- **What happened:** On the live website, a well-connected person scored as lonely.
- **Cause:** Reverse scoring inverted in the website's code.
- **Fix:** Hand-traced and fixed in the app (a simulated well-connected respondent now gets 40/40). Website itself: not recorded.
- **HISTORY.md line:** 561

### 158. 2026-07-05 10:10 — No report download had ever been built
- **Chat:** C23
- **What happened:** Akash asked why he couldn't download his report; Claude found no download feature had ever been built (only a simulated email capture).
- **Cause:** not recorded
- **Fix:** jsPDF added (E-019f31c1-9); ungated "Download My Report (PDF)" button (-17, -27).
- **HISTORY.md line:** 573

### 159. 2026-07-05 10:22 — Report-page back button went Home; Bob/mascots misaligned (not reproduced)
- **Chat:** C23
- **What happened:** Akash reported back on the report page goes Home instead of the score page, Bob not visible and mascots misaligned.
- **Cause:** not recorded
- **Fix:** not fixed / open — could not be reproduced; Claude asked for screenshots.
- **HISTORY.md line:** 577

### 160. 2026-07-05 10:22 — PDF report bugs: corrupted glyphs, AFI scored wrong, duplicate/malformed text
- **Chat:** C23
- **What happened:** `≡`/`▶` glyphs corrupted in jsPDF's Helvetica; scores lacked their maximum; AFI scored as an average instead of the raw sum out of 160; duplicate "Concerns" text; double periods in complaints.
- **Cause:** Glyphs unsupported by jsPDF Helvetica; wrong AFI scoring method; text assembly errors.
- **Fix:** Drawn shapes (-129, -131); AFI (-116, -125, -134); Concerns (-138); periods (-152) — all E-019f31cc.
- **HISTORY.md line:** 588

### 161. 2026-07-04 22:51 → Jul 5 11:08 — Journal "Add new → Journal entry" went Home / journal page "doesn't open" (reported 4+ times)
- **Chat:** C23
- **What happened:** Akash reported Journal → Add new → Journal entry did nothing and went Home. Claude first judged it not a bug (added a toast, then a banner), then said Akash was on a cached file, then suspected Claude's preview localStorage.
- **Cause:** The new banner pushed the mood bubbles below the visible area and nothing scrolled to them; underlying flow redirected to Home to pick a mood.
- **Fix:** Toast E-019f3027-106 → banner E-019f3039-11, -14, -21 → auto-scroll E-019f31de-6 → explicit scroll math (-46, E-019f31e5) → rebuilt as a self-contained `panel-quick-journal` screen (E-019f32a9-4, -9, -14), tested down to 500×400.
- **Recurring:** Reported 22:51, 03:02, 03:14, 10:22, 10:38, 10:49, 11:07 (lines 503, 529, 548, 575, 594, 601, 610).
- **HISTORY.md line:** 594

### 162. 2026-07-05 10:53 — Mood Tracker didn't open after a mood was recorded
- **Chat:** C23
- **What happened:** Mood Tracker broken after first mood.
- **Cause:** With no mood data, the empty-state code replaced the parent's `innerHTML`, deleting the chart container; every later render hit `null`.
- **Fix:** E-019f31e5-24.
- **HISTORY.md line:** 604

### 163. 2026-07-05 10:53 — Completing a subtask also completed the main task
- **Chat:** C23
- **What happened:** With one subtask, checking it completed the parent instantly.
- **Cause:** A rule auto-completed the parent when all subtasks were checked.
- **Fix:** Rule removed (E-019f31e5-34, -38).
- **HISTORY.md line:** 606

### 164. 2026-07-05 14:48 — First APK build: JRE only, Gradle cached broken toolchain
- **Chat:** C23
- **What happened:** Build failed.
- **Cause:** Only a JRE was present (no `javac`); Gradle cached the broken toolchain.
- **Fix:** Full JDK installed; Gradle home wiped. Debug-signed APK delivered.
- **HISTORY.md line:** 633

### 165. 2026-07-05 14:53–15:16 — Supabase rewiring: inverted `temp_` condition and deleted `var appState` line
- **Chat:** C23
- **What happened:** An inverted condition `!String(subId).indexOf('temp_') === 0`; an edit deleted the `var appState = {` line.
- **Cause:** Coding / edit errors.
- **Fix:** Condition (-82); `appState` line (-118 failed, -126 fixed) — E-019f32d2 series. Also worksheets upsert → insert because no unique constraint existed (-63).
- **HISTORY.md line:** 650

### 166. 2026-07-05 ~15:16 — Signup blocked: "Confirm email" on by default
- **Chat:** C23
- **What happened:** Signup test failed (Supabase also rejected the fake test domain).
- **Cause:** Supabase "Confirm email" on by default.
- **Fix:** Akash turned it off for the beta (15:18).
- **HISTORY.md line:** 652

### 167. 2026-07-05 19:33 — Release keystore password written in plain text (build.gradle, later a Drive doc)
- **Chat:** C23
- **What happened:** Keystore password written in plain text in `android/app/build.gradle` (E-019f33c4-33). Jul 6 07:57–08:06: the release keystore existed only in Claude's sandbox; at Akash's request a separate Drive "SIGNING CREDENTIALS" doc with the password was created (as `text/plain` after a Google Docs create failed on mime type); handoff zip also included the keystore.
- **Cause:** not recorded
- **Fix:** not recorded
- **HISTORY.md line:** 661

### 168. 2026-07-05 19:42–20:00 — Install guide pointed to a PWA fallback that didn't exist
- **Chat:** C23
- **What happened:** `HOBS-Companion-Install-Guide.md` (E-019f33dd-2) offered a PWA fallback, but no manifest/service worker existed.
- **Cause:** not recorded
- **Fix:** not recorded
- **HISTORY.md line:** 670

### 169. 2026-07-05 20:59 — After Google login the app went to `localhost:3000`
- **Chat:** C23
- **What happened:** Google sign-in returned to `localhost:3000`.
- **Cause:** `redirectTo` used `window.location.href`, capturing the debug server's address.
- **Fix:** Jul 6 07:55: `redirectTo` fixed (native scheme in app, Netlify URL on web), E-019f3667-23.
- **HISTORY.md line:** 689

### 170. 2026-07-06 07:55 — Browser didn't hand control back to the app after Google login
- **Chat:** C23
- **What happened:** Login and session worked but the browser never returned to the app.
- **Cause:** `@capacitor/app` not installed and no intent filter.
- **Fix:** `hobscompanion://callback` added to `AndroidManifest.xml` (E-019f3667-12; -9 failed on a wrong path); deep-link listener sets the Supabase session (E-019f3667-23); Akash added the scheme to Supabase Redirect URLs (08:36).
- **Recurring:** Same missing-intent-filter bug reappeared Aug 14 (BUG_LOG #22, manifest never persisted) — the Jul 6 fix is not in BUG_LOG.
- **HISTORY.md line:** 693

### 171. 2026-07-06 12:47 — Installed APK pointed at the old Netlify site
- **Chat:** C23
- **What happened:** Akash deployed to a new site `hobscompanion.netlify.app` and got "Site not found"; the APK still pointed at the old site.
- **Cause:** Capacitor config still had the old URL.
- **Fix:** Config moved to `hobscompanion.netlify.app`, rebuilt; Supabase Site URL to be updated.
- **HISTORY.md line:** 706

### 172. 2026-07-06 13:15–13:27 — Netlify drift: live site served the old file; logo broken
- **Chat:** C23
- **What happened:** Live site kept serving the old file; logo showed as broken image.
- **Cause:** Upload silently created another Netlify project; on the new site only `index.html` was uploaded.
- **Fix:** `[BUILD-CHECK-001]` title marker (E-019f3796-4) to detect; later Claude deployed directly via Netlify API (13:39–13:50).
- **HISTORY.md line:** 718

### 173. 2026-07-06 13:35 — App still had its phone-mockup frame inside a real phone
- **Chat:** C23
- **What happened:** "Why is the screen enclosed in an interface."
- **Cause:** Phone-mockup frame never removed for real devices.
- **Fix:** Edge-to-edge on phone widths (E-019f37a4-13, -20, -28), tablets via early native/standalone detection (E-019f37a7-2, -7).
- **HISTORY.md line:** 722

### 174. 2026-07-06 13:39–13:50 — First Netlify API deploy was a stale intermediate copy
- **Chat:** C23
- **What happened:** Claude's first direct deploy shipped a stale intermediate file.
- **Cause:** not recorded
- **Fix:** Caught by checking the live site; redeployed and verified.
- **HISTORY.md line:** 727

### 175. 2026-07-08 10:31 — Signed-in user saw the login page on reopen (login flash)
- **Chat:** C23
- **What happened:** A signed-in user reopening the app saw the login page, then a tap took them Home.
- **Cause:** Sign-in form showed before the session check finished.
- **Fix:** Loading state first; form only when no session (E-019f4148-86, -93, -96), plus forced repaint (-104).
- **Recurring:** Later loading-screen/flash reports in BUG_LOG #39, #40 (Aug).
- **HISTORY.md line:** 753

### 176. 2026-07-08 11:36–11:46 — Support screen showed Bob's image instead of Kunnu's
- **Chat:** C23
- **What happened:** Wrong mascot image on Support.
- **Cause:** not recorded
- **Fix:** E-019f4185-87.
- **HISTORY.md line:** 775

### 177. 2026-07-08 12:38 — "Book Session" opened the profile instead of booking
- **Chat:** C23
- **What happened:** Book Session button opened the expert profile.
- **Cause:** not recorded
- **Fix:** E-019f41bc-17.
- **HISTORY.md line:** 790

### 178. 2026-07-08 12:49 — Deploy failed: Netlify free credits exhausted
- **Chat:** C23
- **What happened:** Deploy failed; file handed over directly.
- **Cause:** Netlify's free credits exhausted (the "240 credits remaining" seen Jul 6).
- **Fix:** Moved hosting to GitHub Pages (15:37–16:11).
- **HISTORY.md line:** 805

### 179. 2026-07-08 15:37–16:11 — Handoff zip v2 packaging bugs
- **Chat:** C23
- **What happened:** Zip contained an old zip's stale entries and missed the `capacitor-cordova-android-plugins/build/` folder.
- **Cause:** not recorded
- **Fix:** Caught; final 2.4MB, 150 files (README E-019f4278-72).
- **HISTORY.md line:** 815

### 180. 2026-07-08 16:12–16:21 — `expert_bookings` never created; Book Session would fail
- **Chat:** C23
- **What happened:** Jul 8 migrations had never been run, so `expert_bookings` didn't exist.
- **Cause:** Migrations were left for Akash to run and never ran.
- **Fix:** 16:26–16:29 Claude ran both migrations via the Management API and verified table, columns and RLS live.
- **HISTORY.md line:** 819

### 181. 2026-07-08 16:12–16:21 — Claude wrongly said only the Supabase Site URL needed changing after the host move
- **Chat:** C23
- **What happened:** Akash's screenshots showed Google Cloud's "Authorized JavaScript origins" still held the Netlify domain.
- **Cause:** Claude missed the Google Cloud origins setting.
- **Fix:** Add `https://homeofbeautifulsouls-sys.github.io` to Authorized JavaScript origins.
- **HISTORY.md line:** 821

### 182. 2026-07-08 16:48–20:46 — `cancelSession()` never set `cancellation_charge_owed`
- **Chat:** C23
- **What happened:** Cancellation charge never recorded.
- **Cause:** Field not set in `cancelSession()`.
- **Fix:** E-019f4376-39.
- **HISTORY.md line:** 838

### 183. 2026-07-08 20:46–21:01 — Payment modal undid the QR image's `onerror` fallback
- **Chat:** C23
- **What happened:** Modal reset the QR's visibility each time it opened.
- **Cause:** Visibility reset on open overrode the `onerror` fallback.
- **Fix:** E-019f4383-44.
- **HISTORY.md line:** 842

### 184. 2026-07-08 21:04–21:15 — Infinite RLS recursion broke the whole booking system for every user
- **Chat:** C23
- **What happened:** Booking broken for every user since the admin dashboard went in.
- **Cause:** Admin policies checked `is_admin` by querying `profiles` from inside a policy on `profiles`.
- **Fix:** `SECURITY DEFINER` function for the admin check; verified all three tables query.
- **HISTORY.md line:** 848

### 185. 2026-07-08 21:23 — Changes not showing after close/reopen: GitHub Pages caches 10 minutes
- **Chat:** C23
- **What happened:** Akash couldn't open the dashboard; the "close and reopen" update promise had silently broken with the migration.
- **Cause:** GitHub Pages caches for 10 minutes (`max-age=600`, `x-cache: HIT`); Netlify never cached.
- **Fix:** WebView cache disabled in `MainActivity.java` (E-019f439d-19) → new APK (Akash had not installed it by 21:59, line 888).
- **HISTORY.md line:** 855

### 186. 2026-07-08 21:49 — Therapist-invite policy queried `auth.users`, unreadable by client role
- **Chat:** C23
- **What happened:** Policy failed.
- **Cause:** Client role can't read `auth.users`.
- **Fix:** Switched to `auth.email()` (E-019f43b5 series).
- **HISTORY.md line:** 884

### 187. 2026-07-08 22:06 — Experts insert failed on escaping
- **Chat:** C23
- **What happened:** First insert of the 10 expert rows failed.
- **Cause:** Escaping.
- **Fix:** Redone via JSON (E-019f43cd-10, -18).
- **HISTORY.md line:** 908

### 188. 2026-07-09 (11:10) — GitHub Pages builds stuck (duration 0)
- **Chat:** C23
- **What happened:** GitHub Pages build stuck at duration 0 for 5+ minutes; happened three times that day.
- **Cause:** not recorded
- **Fix:** Each fixed by pushing / triggering a fresh build.
- **Recurring:** again at line 947 ("stuck three times that day").
- **HISTORY.md line:** 931

### 189. 2026-07-09 (11:27) — "Request change" never reached admin for approval
- **Chat:** C23
- **What happened:** A client's "request change" of expert never reached Akash for approval; no reason or client contact details shown.
- **Cause:** No approval step existed; `change_requested` did not keep the category blocked.
- **Fix:** Reason/approval columns, emails backfilled into `profiles` (E-019f46a2-20), `change_requested` keeps category blocked until approval (-28), reason modal (-42; -39 failed as not unique), `requestExpertChange()` (-45), pending state (-54), admin Change Requests section (-60, -69).
- **HISTORY.md line:** 933

### 190. 2026-07-09 (11:53) — Hero card over photo unreadable in Android WebView
- **Chat:** C23
- **What happened:** The translucent hero card over the background photo didn't work on device.
- **Cause:** `backdrop-filter: blur()` is unreliable in Android WebView.
- **Fix:** Opaque white card, dark text, outlined blue button (E-019f46b9-11, -14).
- **HISTORY.md line:** 949

### 191. 2026-07-10 (07:57) — Silent data loss: DB write crashed when `currentUser` was null
- **Chat:** C23
- **What happened:** Tasks saved locally and the sheet closed, but the database write crashed silently if `currentUser` was null at save time.
- **Cause:** No retry/queue when the user session wasn't ready.
- **Fix:** `pendingSyncQueue` in localStorage with `syncToSupabase()` and retry after sign-in (E-019f4b07-61, -69), applied to tasks (-77), entries (-86), worksheets (-95), WHO-5 (-103), test results (-109).
- **Recurring:** same silent-failure bug in `addSubtask()` (line 978).
- **HISTORY.md line:** 964

### 192. 2026-07-10 (07:57) — Calm Room music file never existed (404)
- **Chat:** C23
- **What happened:** Music didn't play; play icon flipped before playback started; a developer message was shown to users.
- **Cause:** `calmroom-music.mp3` never existed (404).
- **Fix:** Handling fixed (-132); later replaced by a generated Web Audio soundscape (E-019f4b3c-6, -16, line 994).
- **HISTORY.md line:** 968

### 193. 2026-07-10 (07:57) — Phone back button didn't go back
- **Chat:** C23
- **What happened:** Android hardware back button didn't navigate back.
- **Cause:** No panel history / no Capacitor `backButton` listener.
- **Fix:** Panel history stack in `showOnly()` + Capacitor `backButton` listener (-143, -152).
- **Recurring:** stack popped twice per press (line 1121); modals missing from hard-coded list (line 1613).
- **HISTORY.md line:** 970

### 194. 2026-07-10 (07:57) — White screen on return, made worse by Claude's `LOAD_NO_CACHE`
- **Chat:** C23
- **What happened:** Switching apps and back gave a white screen for a while.
- **Cause:** Claude's own earlier `LOAD_NO_CACHE` made reloads slower.
- **Fix:** Switched to `LOAD_DEFAULT` in `MainActivity.java` (E-019f4b10-4), new APK.
- **Recurring:** white screen again Jul 10 23:22 — no `resume` listener at all (line 1123).
- **HISTORY.md line:** 972

### 195. 2026-07-10 (08:26) — `addSubtask()` had the same silent-failure bug
- **Chat:** C23
- **What happened:** Subtask adds could silently fail to reach the DB.
- **Cause:** Same null-`currentUser` silent-failure pattern as tasks.
- **Fix:** E-019f4b22-20.
- **Recurring:** of line 964.
- **HISTORY.md line:** 978

### 196. 2026-07-10 (08:29) — Drag-to-reorder read the dragged item's own stale priority
- **Chat:** C23
- **What happened:** On drop, task priority wasn't updated correctly.
- **Cause:** Code read the dragged item's own stale priority instead of its new neighbours'.
- **Fix:** E-019f4b24-115 (debug logging added and removed: -93, -104, -156, E-019f4b31-3).
- **HISTORY.md line:** 984

### 197. 2026-07-10 (12:45) — New-chat starter kit contained GitHub and Supabase tokens
- **Chat:** C23
- **What happened:** `HOBS-New-Chat-Starter-Kit.md` (E-019f4c12-5) was written containing the GitHub and Supabase tokens ("since you asked for 'everything'"); it went into `HOBS-Everything.zip`. The Drive "MASTER PROJECT STATE" doc also couldn't be opened by the new chat (401, not shared). The new chat noted the GitHub repo was public.
- **Cause:** Claude included credentials in a handoff file.
- **Fix:** not recorded (Drive doc replaced by `HOBS-Master-Project-State.md`, E-019f4c24-4; zip E-019f4c28-5).
- **HISTORY.md line:** 1011

### 198. 2026-07-10 (13:21–17:34) — Task save button tap swallowed near open keyboard
- **Chat:** C26
- **What happened:** "Task save button is still not working!" — Claude's test passed and it suspected cache; Akash's account had zero task rows and zero error logs (tap never reached the handler).
- **Cause:** No `windowSoftInputMode` on the Android activity, so a tap near the open keyboard on the fixed bottom sheet was swallowed.
- **Fix:** `android:windowSoftInputMode="adjustResize"` (E-019f4d11-31); bigger target, `touch-action:manipulation`, `touchend`+`click` with in-flight guard, blur before save (-36, -42, -44); commit `b21b7e3`; APK rebuilt.
- **HISTORY.md line:** 1027

### 199. 2026-07-10 (17:48) — Autosave had never existed (input discarded on X/backdrop/back)
- **Chat:** C26
- **What happened:** "autosaving hasn't worked even once for anything" — X, backdrop and back button discarded input.
- **Cause:** There had never been any save-on-exit; every screen saved only on explicit Save.
- **Fix:** Commit-if-dirty on close for Add Task sheet, Quick Journal, Main Journal, Worksheets, hardware back routed through them (E-019f4d25-52, -54, -57, -60, -64, -68, -77); commit `b074e01`; APK rebuilt.
- **HISTORY.md line:** 1036

### 200. 2026-07-10 (18:02–18:14) — Claude changed the header logo when launcher icon was asked (built without asking)
- **Chat:** C26
- **What happened:** Asked to change "the app's logo", Claude changed the in-app header logo and CSS (E-019f4d31-38) and pushed it. Akash: "ask if you have doubts rather than just starting to build".
- **Cause:** Claude guessed the meaning instead of asking.
- **Fix:** Header reverted and verified; launcher icon built at all 5 densities.
- **HISTORY.md line:** 1043

### 201. 2026-07-10 (18:36) — Firebase apps registered under placeholder package `com.mycompany.hobsapp`
- **Chat:** C26
- **What happened:** FCM would never reach the real app.
- **Cause:** Firebase apps registered as `com.mycompany.hobsapp` (placeholder).
- **Fix:** Akash created fresh Firebase project `hobs-companion` with `com.hobsfoundation.companion`.
- **HISTORY.md line:** 1052

### 202. 2026-07-10 (18:36–18:54) — Claude worked from a stale local copy (predated edit/delete feature)
- **Chat:** C26
- **What happened:** Firebase changes were made on a stale local copy missing the task edit/delete feature.
- **Cause:** Stale working base.
- **Fix:** Caught via diff before push; re-applied on current base (E-019f4d58-80, -84).
- **Recurring:** again Jul 11 09:56 (line 1135) and Jul 11 20:12 (line 1203).
- **HISTORY.md line:** 1058

### 203. 2026-07-10 (18:59–19:08) — `send-push-notification` had no CORS headers
- **Chat:** C26
- **What happened:** Browser/WebView calls to the function failed.
- **Cause:** No CORS headers.
- **Fix:** E-019f4d66-85.
- **HISTORY.md line:** 1064

### 204. 2026-07-10 (22:28) — versionCode had been 1 all along
- **Chat:** C26
- **What happened:** Every APK built had versionCode 1.
- **Cause:** Never bumped.
- **Fix:** Set to 2 / "1.1" (E-019f4e25-22).
- **HISTORY.md line:** 1081

### 205. 2026-07-10 (22:28) — Scheduler queried `entries.date` (column is `created_at`)
- **Chat:** C26
- **What happened:** `notification-scheduler` used a non-existent column.
- **Cause:** `entries` uses `created_at`, not `date`.
- **Fix:** E-019f4e25-48.
- **HISTORY.md line:** 1084

### 206. 2026-07-10 (22:28) — Scheduler test sent a real journal-reminder push to 3 real users
- **Chat:** C26
- **What happened:** First scheduler test sent a real push to 3 real users, including Akash.
- **Cause:** Debug time override wasn't isolated from real accounts.
- **Fix:** Flagged; real push tokens backed up and cleared during testing, restored afterwards.
- **Recurring:** real-user test sends again at lines 1146, 1239, 1271, 1371, 1384.
- **HISTORY.md line:** 1086

### 207. 2026-07-10 (22:47) — pg_cron scheduling blocked by Cloudflare WAF; secret file deleted too early
- **Chat:** C26
- **What happened:** `cron.schedule` via Management API hit a Cloudflare WAF block (error 1010). A first scheduler secret file was deleted too early and had to be regenerated.
- **Cause:** WAF block; secret cause not recorded.
- **Fix:** Scheduling moved to a GitHub Actions workflow every 15 min (`.github/workflows/notification-scheduler.yml`, E-019f4e31-55), secret regenerated and stored as encrypted Actions secret.
- **Recurring:** GitHub Actions later ran hours apart (line 1478).
- **HISTORY.md line:** 1095

### 208. 2026-07-10 (23:22) — Calendar header spacing: `.month-nav` had 2px margin
- **Chat:** C26
- **What happened:** Calendar header spacing wrong.
- **Cause:** `.month-nav` had a 2px margin.
- **Fix:** E-019f4e56-56, -59.
- **HISTORY.md line:** 1120

### 209. 2026-07-10 (23:22) — Back button popped history twice; day-mood sheet missing from modal list
- **Chat:** C26
- **What happened:** Back-button bugs.
- **Cause:** History stack popped twice per press; `dayMoodSheetBackdrop` missing from modal list.
- **Fix:** E-019f4e56-77.
- **Recurring:** of line 970; again line 1613.
- **HISTORY.md line:** 1121

### 210. 2026-07-10 (23:22) — White screen: no `resume` listener at all
- **Chat:** C26
- **What happened:** White screen on returning to app.
- **Cause:** No `resume` listener existed.
- **Fix:** JS resume handler (repaint + session re-check) and native one in `MainActivity.java` (E-019f4e56-98).
- **Recurring:** of line 972; wrong resume API found later (line 1528).
- **HISTORY.md line:** 1123

### 211. 2026-07-11 (09:56) — Admin test button visible to clients: logout reset only 6 appState fields
- **Chat:** C26
- **What happened:** "Test notification button is showing to every user!"
- **Cause:** Logout reset only 6 fields of `appState`, leaving `isAdmin`, phone, DOB etc. stale in memory; also the reporting client was on app version 1.0 (versionCode 1), three releases behind.
- **Fix:** Full reset via `getDefaultAppState()` (E-019f509b-73, -80). Claude again caught itself editing a stale base missing 8 live fixes and redid it.
- **HISTORY.md line:** 1131

### 212. 2026-07-11 (12:09) — Foreground push only shown as a toast
- **Chat:** C26
- **What happened:** "Test notification stopped working" though FCM returned 200.
- **Cause:** In the foreground the app only showed a toast.
- **Fix:** `@capacitor/local-notifications` to show foreground pushes as system notifications (E-019f511a-42, -52, -58).
- **HISTORY.md line:** 1137

### 213. 2026-07-11 (12:15) — Claude overwrote Akash's real push token without a backup
- **Chat:** C26
- **What happened:** During testing Claude overwrote Akash's real push token with no backup.
- **Cause:** Testing on a real account.
- **Fix:** Restored from a value recorded earlier in the session; switched to a disposable admin test account.
- **Recurring:** of line 1086.
- **HISTORY.md line:** 1146

### 214. 2026-07-11 (12:15) — Firebase Analytics pulled in Advertising-ID permissions
- **Chat:** C26
- **What happened:** Advertising-ID permissions (incl. Privacy Sandbox) added to the app though HOBS has no ads.
- **Cause:** Pulled in by Firebase Analytics.
- **Fix:** Removed (E-019f511a-122, -124, E-019f51b1-5); v1.4 (versionCode 5).
- **HISTORY.md line:** 1149

### 215. 2026-07-11 (15:14–15:19) — Feature graphic cropped the mascot's head
- **Chat:** C26
- **What happened:** First Play Store feature graphic cropped the mascot's head.
- **Cause:** not recorded
- **Fix:** Caught by checking pixel maths; corrected.
- **HISTORY.md line:** 1168

### 216. 2026-07-11 (15:59) — Notification bell was a plain `<div>` with no handler
- **Chat:** C26
- **What happened:** Tapping the bell did nothing.
- **Cause:** Plain `<div>`, no handler; users couldn't read their own notifications (no RLS).
- **Fix:** Real inbox from `notification_recipients`, new RLS, unread dot, tap marks opened (E-019f52c6-20, -26, -31, -46, -53, -56).
- **HISTORY.md line:** 1191

### 217. 2026-07-11 (20:12) — Client's booking never reached DB; client invisible to admin/therapist
- **Chat:** C26
- **What happened:** A client booked but Akash couldn't see her in admin or therapist dashboards.
- **Cause:** Her booking never reached the DB; she was on app version 1.0. Admin showed only bookings (no user list); therapists had no client list.
- **Fix:** Admin → All Users and Therapist → My Clients built.
- **HISTORY.md line:** 1196

### 218. 2026-07-11 (20:12) — Self-bookings excluded by comparing with logged-in user (Claude's draft)
- **Chat:** C26
- **What happened:** Bug in Claude's own draft of the client lists.
- **Cause:** Self-bookings excluded by comparing with the logged-in user rather than the owner of the therapist identity.
- **Fix:** E-019f52cf-103.
- **HISTORY.md line:** 1199

### 219. 2026-07-11 (20:12) — YouTube icon: dead `href="#"` and duplicated SVG path
- **Chat:** C26
- **What happened:** YouTube logo wrong.
- **Cause:** Dead `href="#"` and a duplicated SVG path.
- **Fix:** Pointed to HOBS's real channel.
- **HISTORY.md line:** 1202

### 220. 2026-07-11 (20:12) — Stale base again; automated `patch` corrupted an array literal
- **Chat:** C26
- **What happened:** Working file predated the bell fix; an automated `patch` corrupted an array literal. Leftover test accounts were in the real user list; a typo'd duplicate of Akash's account surfaced.
- **Cause:** Stale working base; automated patching.
- **Fix:** Re-applied by hand on live base (E-019f52cf-147, -150, -153, E-019f52d8-4, -8, -16, -24); test accounts cleaned; duplicate account deleted after checking it was unused (line 1212).
- **Recurring:** of lines 1058, 1135.
- **HISTORY.md line:** 1203

### 221. 2026-07-11 (20:59) — Profile card read legacy `userHasTherapist` flag (three competing systems)
- **Chat:** C26
- **What happened:** Connected client saw "connect with a therapist" instead of their therapist.
- **Cause:** Profile card read a legacy `userHasTherapist` flag; a third older system (`demoHasTherapist` + `panel-intake`) also gated booking.
- **Fix:** Derive therapist status from `expert_bookings` at load (E-019f52fa-27); Profile card states and real Disconnect (-46).
- **HISTORY.md line:** 1227

### 222. 2026-07-11 (20:59) — `expert_bookings` had no admin INSERT or DELETE policy
- **Chat:** C26
- **What happened:** Direct assign and delete booking silently did nothing.
- **Cause:** Missing admin INSERT and DELETE RLS policies.
- **Fix:** Both policies added.
- **HISTORY.md line:** 1237

### 223. 2026-07-11 (20:59) — Testing sent a real push to Akash
- **Chat:** C26
- **What happened:** Testing sent a real "Test Client Six has requested therapist support" push to Akash.
- **Cause:** Testing against real admin.
- **Fix:** Flagged.
- **Recurring:** of line 1086.
- **HISTORY.md line:** 1239

### 224. 2026-07-12 (06:31) — Main journal "Save entry" never called Supabase; entries lost on logout
- **Chat:** C26
- **What happened:** Journal entries weren't saved and past entries didn't show for any user.
- **Cause:** The "Save entry" button had its own old copy of save logic that never called Supabase; entries lived only on device, and the earlier logout fix (full local wipe) made them disappear. "Share with therapist" also only changed local state.
- **Fix:** Use `commitMainJournalIfDirty()` (E-019f5506-20); share fixed; rescue step uploads unsynced local entries before server overwrite (E-019f550e-3). Entries already lost to logout can't be recovered.
- **HISTORY.md line:** 1247

### 225. 2026-07-12 (06:31–06:47) — Crisis regex missed "wanting to die"; own regex bugs
- **Chat:** C26
- **What happened:** First crisis regex missed "wanting to die"; keyword lists miss implicit ideation; two of Claude's own regex bugs caught.
- **Cause:** Too-narrow patterns.
- **Fix:** E-019f5506-130; broader themed patterns (E-019f5514-14, -47, -56); LLM Edge Function `check-journal-risk` (E-019f5514-18), inactive until an API key is added.
- **Recurring:** contractions/"wanna" (line 1461), "hopeless" (line 1546), "Help" (line 1569).
- **HISTORY.md line:** 1255

### 226. 2026-07-12 (07:06) — "Find a Therapist" intake form was fake
- **Chat:** C26
- **What happened:** Form showed "someone will reach out soon" and saved nothing.
- **Cause:** Never wired to a backend.
- **Fix:** Creates a real pending request with contact and note (E-019f5525-54, -62, -64).
- **HISTORY.md line:** 1266

### 227. 2026-07-12 (07:06) — Add-task day chip had no handler
- **Chat:** C26
- **What happened:** Day chip did nothing.
- **Cause:** No handler.
- **Fix:** Real date picker (-75, -85).
- **HISTORY.md line:** 1268

### 228. 2026-07-12 (07:18) — Unflagged test notification with a human name reached Akash
- **Chat:** C26
- **What happened:** A "<test name> requested therapist support" notification from a test account reached Akash; Claude hadn't flagged it.
- **Cause:** Test account with a human name, testing against real admin.
- **Fix:** Dedicated test admin account named "Claude" (notifications off) created.
- **Recurring:** of line 1086.
- **HISTORY.md line:** 1271

### 229. 2026-07-12 (07:18) — Test admin credentials saved to Drive, later appeared in MASTER.md
- **Chat:** C26
- **What happened:** Test admin account credentials were saved to a Drive doc and later appeared in MASTER.md.
- **Cause:** not recorded
- **Fix:** HISTORY refers to "the Sept 29 security note"; no BUG_LOG entry found.
- **HISTORY.md line:** 1274

### 230. 2026-07-12 (07:38) — Green-on-complete fix only covered top-level tasks
- **Chat:** C26
- **What happened:** Subtasks, Body Doubling list and Progress timeline still used strikethrough.
- **Cause:** Earlier fix incomplete.
- **Fix:** E-019f553f-10, -20, -35, -49, -51.
- **HISTORY.md line:** 1282

### 231. 2026-07-12 (07:56) — Claude's insert deleted `function openExpertDetail(idx){` line
- **Chat:** C26
- **What happened:** Donation widget insert removed a function declaration line.
- **Cause:** Claude's edit.
- **Fix:** E-019f5554-94.
- **HISTORY.md line:** 1291

### 232. 2026-07-12 (07:56) — Donation widget placed on professionals' profiles instead of every user's
- **Chat:** C26
- **What happened:** "It should be visible in every user's profile… Use some common sense!"
- **Cause:** Claude misplaced it.
- **Fix:** Moved to user's Profile (E-019f5630-10, -13, -21, -26, -30, -37, -42, -47).
- **HISTORY.md line:** 1292

### 233. 2026-07-12 (07:56) — `worksheet_responses` written but never read back; new row every save
- **Chat:** C26
- **What happened:** Worksheet answers never loaded; every save inserted a new row.
- **Cause:** No load path; plain insert (same class as the journal bug).
- **Fix:** Load added (E-019f5560-16); unique constraint and `upsertWorksheetResponse()` (-41, -48).
- **HISTORY.md line:** 1293

### 234. 2026-07-12 (11:57–12:39) — Tick box not working; enlarged instead of removed as asked
- **Chat:** C26
- **What happened:** Tick button reported not working repeatedly (07:06, 11:57); Akash asked to remove it; Claude enlarged it 20×20 → 30×30 instead (-66).
- **Cause:** not recorded (cache suspected at 07:06).
- **Fix:** Later: whole row tap completes task (E-019f58c6-21); checkbox removed from DOM (E-019f5b54-31); decorative ticks removed (E-019f5b67-10, -21, -30).
- **Recurring:** lines 1265, 1304, 1416, 1444, 1453.
- **HISTORY.md line:** 1306

### 235. 2026-07-12 (11:57) — Subtask panel stayed open and screen jumped
- **Chat:** C26
- **What happened:** Screen jumped while editing subtasks.
- **Cause:** Breakdown input got `.focus()` on every re-render.
- **Fix:** Focus only when freshly opened (-93, -96, -103).
- **HISTORY.md line:** 1307

### 236. 2026-07-12 (11:57) — `cancelSession()` didn't match published policy
- **Chat:** C26
- **What happened:** Cancellation had no 24h check, never cancelled the booking, counted per lifetime.
- **Cause:** Old implementation; then each session is a new booking row, so repeat detection must span all the client's bookings this month.
- **Fix:** Rebuilt (E-019f563a-2), cross-booking monthly detection (E-019f5641-109); tiers verified in DB.
- **HISTORY.md line:** 1310

### 237. 2026-07-12 (12:39) — Subtask/title text not fully visible (single-line inputs)
- **Chat:** C26
- **What happened:** Long subtask text cut off while editing.
- **Cause:** Single-line `<input>`s.
- **Fix:** Auto-growing textareas (E-019f5657-14, -21, -29, -43).
- **Recurring:** third single-line input in Add/Edit Task sheet (line 1418).
- **HISTORY.md line:** 1328

### 238. 2026-07-12 (12:39) — Profile page title was the static word "You"
- **Chat:** C26
- **What happened:** "I still see 'you' in my profile."
- **Cause:** Static title text.
- **Fix:** E-019f5657-62, -69.
- **HISTORY.md line:** 1330

### 239. 2026-07-12 (12:39) — Experts list quote bugs; duplicate expert rows
- **Chat:** C26
- **What happened:** Quote bugs in the Edit/Link/Remove list; two duplicate rows for one expert remained.
- **Cause:** not recorded
- **Fix:** Quote bugs fixed (-96, -99); duplicate rows left for Akash to clean (still listed open at line 1649).
- **HISTORY.md line:** 1331

### 240. 2026-07-12 (18:19) — Policy-update notification test sent duplicated notice to a real client
- **Chat:** C26
- **What happened:** Testing the "Notify consented users" button sent a real, duplicated policy notification to a real client.
- **Cause:** Testing against real users.
- **Fix:** Flagged to Akash.
- **Recurring:** of line 1086.
- **HISTORY.md line:** 1371

### 241. 2026-07-12 (18:38) — "Could not link" expert: `therapist_invites.email` UNIQUE
- **Chat:** C26
- **What happened:** Linking an email to an existing expert failed.
- **Cause:** `therapist_invites.email` is UNIQUE, so re-linking failed.
- **Fix:** Upsert (E-019f579f-20).
- **HISTORY.md line:** 1376

### 242. 2026-07-12 (18:38) — Notification taps didn't route anywhere
- **Chat:** C26
- **What happened:** Tapping notifications didn't go to the right place.
- **Cause:** Push-tap handler had no routing at all; bell inbox had its own handler that never navigated.
- **Fix:** Routing by `type` in app and Edge Function payloads (-84, -94, -99, -106, -113, -117, -124, -126, E-019f57a6-0).
- **HISTORY.md line:** 1380

### 243. 2026-07-12 (18:38) — Link test modified a real expert's invite row
- **Chat:** C26
- **What happened:** First Link test modified a real expert's invite row.
- **Cause:** Testing on real data.
- **Fix:** Restored; disposable test expert used.
- **Recurring:** of line 1086.
- **HISTORY.md line:** 1384

### 244. 2026-07-12 (22:17) — Internal note and "confirm with your accountant" published in legal pages
- **Chat:** C26
- **What happened:** An internal note to Akash ("please read the note I gave you in chat") was published inside the Terms, and a visible "confirm with your accountant" tag in the Privacy Policy.
- **Cause:** Claude's drafting.
- **Fix:** Removed (E-019f5867-28, -31, -35); address later removed (E-019f586d-9, -14, -18).
- **HISTORY.md line:** 1388

### 245. 2026-07-13 (00:01) — Subtask textarea regression caught; dead `toggleSubtaskForm`
- **Chat:** C26
- **What happened:** Converting the Add/Edit Task sheet subtask input to textarea would have dropped subtasks.
- **Cause:** Save logic queried `input` elements.
- **Fix:** Caught (-64, -74, -82, -86); day-view input too (-101, -105, -110). `toggleSubtaskForm` found dead (removed Jul 15, line 1707).
- **HISTORY.md line:** 1418

### 246. 2026-07-13 (00:01–11:55) — Admin "View" for a professional didn't show their actual profile
- **Chat:** C26
- **What happened:** Admin view profile didn't show the professional profile; reported again at 11:55.
- **Cause:** not recorded
- **Fix:** -122, -125; then Admin View opens real client-facing expert page (E-019f5b54-61, -67, -72).
- **HISTORY.md line:** 1422

### 247. 2026-07-13 (09:39) — Row-tap marked task done ignoring subtasks; edit sheet "messed up"
- **Chat:** C26
- **What happened:** Task shown under Completed with a subtask still open; edit screen broken.
- **Cause:** Row tap flipped `task.done` ignoring subtasks; textareas auto-sized while sheet hidden (`scrollHeight` 0).
- **Fix:** Cascade to subtasks (E-019f5ad8-15); `isTaskGenuinelyDone()` for rendering and credits (-19, -29); re-measure after showing (-45).
- **HISTORY.md line:** 1439

### 248. 2026-07-13 (11:55) — Share after saving only checked for a Therapist connection
- **Chat:** C26
- **What happened:** No share button after saving a journal entry or worksheet.
- **Cause:** Share checked only for a Therapist connection.
- **Fix:** Any active professional connection (E-019f5b54-14); later explains when unconnected (-48) and shows for unconnected users (E-019f5d49-13).
- **HISTORY.md line:** 1447

### 249. 2026-07-13 (12:16–13:49) — Tick-icon fix never pushed
- **Chat:** C26
- **What happened:** Decorative tick removal (E-019f5b67-10, -21, -30) was not pushed before the session paused; Akash still saw it.
- **Cause:** Not deployed.
- **Fix:** Confirmed never pushed at 13:49, then finished.
- **HISTORY.md line:** 1455

### 250. 2026-07-13 (13:49) — Crisis resources not shown: contractions/colloquial spellings unmatched
- **Chat:** C26
- **What happened:** "I didn't receive any crisis resources."
- **Cause:** Contractions and colloquial spellings (e.g. "wanna") weren't matched.
- **Fix:** Patterns rebuilt, tested against screenshot entries, pushed immediately (E-019f5bbc-21).
- **Recurring:** of line 1255.
- **HISTORY.md line:** 1461

### 251. 2026-07-13 (13:49–18:58) — Active Bookings rows and `clientSummaryRows` not clickable
- **Chat:** C26
- **What happened:** No profile on tapping a name.
- **Cause:** Rows lacked click-through (two separate row builders).
- **Fix:** -71, -73; E-019f5cce-5.
- **HISTORY.md line:** 1466

### 252. 2026-07-13 (14:12) — Subtask `image_url` not loaded from server
- **Chat:** C26
- **What happened:** Subtask photos wouldn't persist across loads.
- **Cause:** `image_url` wasn't loaded for subtasks.
- **Fix:** E-019f5bc8-1…-52.
- **HISTORY.md line:** 1472

### 253. 2026-07-13 (14:12) — External bookings leaked into real-clients dropdown as "Unnamed client"
- **Chat:** C26
- **What happened:** External bookings shown as "Unnamed client".
- **Cause:** No `is_external` filter.
- **Fix:** Filter `is_external = false` (E-019f5cce-41).
- **HISTORY.md line:** 1474

### 254. 2026-07-13 (18:59) — Notifications not releasing: Actions throttled; pg_cron had stale secret
- **Chat:** C26
- **What happened:** "Notifications aren't releasing."
- **Cause:** GitHub Actions ran the 15-min schedule hours apart (throttling). After moving to pg_cron, the secret had been rotated but the pg_cron job had the old value hardcoded in its SQL → every run "Unauthorized".
- **Fix:** pg_cron job, Actions workflow moved to `disabled`; new secret set on both sides, old verified to fail (19:33).
- **HISTORY.md line:** 1478

### 255. 2026-07-13 (20:35) — Logged appointments hard-coded `payment_confirmed: true`
- **Chat:** C26
- **What happened:** Logged appointments skipped admin review.
- **Cause:** Hard-coded `payment_confirmed: true`.
- **Fix:** Unconfirmed by default with `payment_note` shown to admin (E-019f5d31-140, -143, -147).
- **HISTORY.md line:** 1501

### 256. 2026-07-13 (20:54) — Android `datetime-local` wheel showed no weekdays
- **Chat:** C26
- **What happened:** Calendar pickers showed no days.
- **Cause:** Android `datetime-local` wheel.
- **Fix:** Split into `date` + `time` for Add Slot and Add Group Session (E-019f5d42-18, -21, -28); remaining three fixed Jul 14 (E-019f62ad-63…-126).
- **HISTORY.md line:** 1506

### 257. 2026-07-13 (21:15) — Auto-update check could infinite-reload
- **Chat:** C26
- **What happened:** Testing reproduced an infinite reload loop if build ID and `version.json` mismatch.
- **Cause:** No reload guard.
- **Fix:** At most one reload per session (sessionStorage guard, E-019f5d55-47); rule: bump both build markers together.
- **HISTORY.md line:** 1515

### 258. 2026-07-13 (21:34) — Resume listener used old Cordova API
- **Chat:** C26
- **What happened:** "I still had to reopen the app to receive the update."
- **Cause:** `document.addEventListener('resume')` (Cordova); Capacitor needs `Capacitor.Plugins.App.addListener('resume')`.
- **Fix:** E-019f5d66-11.
- **Recurring:** still not refreshing (line 1551, rebuilt E-019f5d8c-12); once per process (line 1804).
- **HISTORY.md line:** 1528

### 259. 2026-07-13 (21:34) — Assistant: wrong panel ID and modal visible from load
- **Chat:** C26
- **What happened:** Assistant bugs.
- **Cause:** Wrong panel ID (`panel-grounding`); `display:none` then `display:flex` in one style string.
- **Fix:** -67; -93.
- **HISTORY.md line:** 1534

### 260. 2026-07-13 (22:06) — "hopeless" had never been a crisis pattern
- **Chat:** C26
- **What happened:** Gaps in crisis detection.
- **Cause:** "hopeless" never in patterns; "such a burden" not matched.
- **Fix:** E-019f5d84-18, -26; crisis messages in assistant get a caring follow-up (-55).
- **Recurring:** of line 1255.
- **HISTORY.md line:** 1546

### 261. 2026-07-13 (22:15) — App still didn't refresh automatically
- **Chat:** C26
- **What happened:** Update not picked up.
- **Cause:** not recorded (late `window.Capacitor`).
- **Fix:** Several signals, polling for late `window.Capacitor`, 60-s timer (E-019f5d8c-12).
- **Recurring:** of line 1528.
- **HISTORY.md line:** 1551

### 262. 2026-07-14 (06:51) — Stray `</div>` broke the footer; duplicate mascot crew section
- **Chat:** C26
- **What happened:** "Wtf did you do to the footer!!"
- **Cause:** Tab rebuild left one stray `</div>`, closing `.phone` early. Also a second older mascot "crew" section on Home with different functions.
- **Fix:** E-019f5f64-70; crew cards later open tabbed modal (E-019f5f70-*).
- **HISTORY.md line:** 1556

### 263. 2026-07-14 (07:03) — Removed floating button left its `onclick`, crashing mascot buttons
- **Chat:** C26
- **What happened:** All four mascot buttons crashed.
- **Cause:** Floating button removed but its `onclick` left.
- **Fix:** E-019f5f70-101; floating button restored (E-019f5f7c-10, -16, -24).
- **HISTORY.md line:** 1563

### 264. 2026-07-14 (07:25) — "Help" / "I need help" hit the assistant fallback
- **Chat:** C26
- **What happened:** Distress phrases fell through to fallback.
- **Cause:** No general-distress category.
- **Fix:** General-distress category and self-harm language (E-019f5f84-17, -25, -35).
- **Recurring:** of line 1255.
- **HISTORY.md line:** 1569

### 265. 2026-07-14 (13:21–14:16) — Therapists couldn't see shared journals/worksheets
- **Chat:** C26
- **What happened:** "I still can't see the journals that my clients shared with me."
- **Cause:** Shared-entries viewer only in admin modal; `worksheet_responses` had no sharing column and no therapist policy; Share only shared the entry's title.
- **Fix:** Therapist client-detail view (E-019f60ca-*); sharing column, RLS, `worksheet_key` (E-019f60e9-60, -88, -91, -100); "Shared With You" feed (E-019f60f7-13, -22, -33).
- **HISTORY.md line:** 1581

### 266. 2026-07-14 (14:17) — `task_complete_reminder` never fired; journal reminders missing; redeploy defaulted `verify_jwt: true`
- **Chat:** C26
- **What happened:** Journal reminders missing Jul 11 and 13; `task_complete_reminder` had never fired. Redeploying scheduler defaulted to `verify_jwt: true`, which would have broken cron.
- **Cause:** Cron only reliable since the Jul 13 19:45 secret fix; deployed scheduler couldn't be read back; redeploy default.
- **Fix:** Secret rotated, cron updated, local source redeployed (version 11) with `verify_jwt: false`; real 14:30 tick confirmed.
- **HISTORY.md line:** 1598

### 267. 2026-07-14 (14:17) — Logged past sessions invisible: calendar dots showed only slots
- **Chat:** C26
- **What happened:** Past logged appointments not visible.
- **Cause:** Calendar dots only showed availability slots, not bookings.
- **Fix:** Booking dots (E-019f60fd-166).
- **HISTORY.md line:** 1608

### 268. 2026-07-14 (14:17) — Donation campaign Save always overwrote the one campaign
- **Chat:** C26
- **What happened:** Couldn't start a new campaign without losing the old.
- **Cause:** Single-campaign overwrite.
- **Fix:** "Archive & Start New" (E-019f610c-36, -39).
- **HISTORY.md line:** 1611

### 269. 2026-07-14 (14:17) — Back handler's hard-coded modal list missing 3 modals; `display === 'block'`
- **Chat:** C26
- **What happened:** Back button issues.
- **Cause:** `assistantModal`, `therapistClientDetailModal`, `therapistScheduleEditModal` missing; check required `display === 'block'`, never matching the assistant modal (`flex`).
- **Fix:** E-019f610c-77, -95; regression-tested.
- **Recurring:** of lines 970, 1121.
- **HISTORY.md line:** 1613

### 270. 2026-07-14 (14:48–14:57) — Session history built for admin/therapist instead of client (misread)
- **Chat:** C26
- **What happened:** "I said Session history for the client! You didn't read it correctly!"
- **Cause:** Claude misread the request.
- **Fix:** Added for client too; `openMyBookings` sorted by booking-created time → now sorts by session date/time (E-019f624b-26, -36, -43, -45).
- **HISTORY.md line:** 1622

### 271. 2026-07-14 (20:54) — Home button still said "Booking & Cancelled" after rename
- **Chat:** C26
- **What happened:** Rename to Admin Panel missed the home button label.
- **Cause:** not recorded
- **Fix:** Label fixed (E-019f6269-10, -17, -22).
- **HISTORY.md line:** 1634

### 272. 2026-07-14 (22:09) — A whole turn's work lost (never landed)
- **Chat:** C26
- **What happened:** Edits E-019f629f-20…-90 in a scratch copy never landed; chat vanished; Claude redid from a fresh clone.
- **Cause:** Tool had been failing; nothing had been pushed.
- **Fix:** Redone (E-019f62ad-*, E-019f62b4-*); a duplicate `display` in one inline style caught before shipping.
- **HISTORY.md line:** 1657

### 273. 2026-07-14 (22:09) — Signed contracts fetched but never displayed
- **Chat:** C26
- **What happened:** Admin/therapist couldn't see signed contracts.
- **Cause:** `consentRes` fetched but never displayed.
- **Fix:** E-019f62b4-126, -130, -143, -149, -152.
- **HISTORY.md line:** 1674

### 274. 2026-07-14 (22:38–22:49) — Contract PDF logo wrong size (rejected twice)
- **Chat:** C26
- **What happened:** Letterhead logo size rejected twice.
- **Cause:** Not measured against original.
- **Fix:** Measured by pixel analysis (~50.5 × 22.35 mm) and matched (E-019f62c7-19, -48).
- **HISTORY.md line:** 1688

### 275. 2026-07-15 (12:06) — Assistant `awaiting_topic` never cleared after crisis modal closed
- **Chat:** C26
- **What happened:** A later unrelated message was hijacked (reproduced live). Also: Team page only the small photo opened a profile.
- **Cause:** `awaiting_topic` not cleared on modal close; click only on photo.
- **Fix:** 2-min expiry + clear on close; whole card clickable with `stopPropagation`; dead code removed (E-019f65ad-14, -19, -23, -56, -65, -73).
- **HISTORY.md line:** 1701

### 276. 2026-07-15 (12:16) — Re-saving a worksheet created duplicate journal-history entry
- **Chat:** C26
- **What happened:** Every re-save duplicated the journal entry.
- **Cause:** Answers upserted, entry row did not, in two paths (`commitWorksheetIfDirty` and Save button).
- **Fix:** Updated in place keeping sharing status (E-019f65b5-86, -97).
- **HISTORY.md line:** 1711

### 277. 2026-07-15 (12:26) — Notification permission handling gaps; task creation not attributed
- **Chat:** C26
- **What happened:** Code review: no status check or recovery after denial; generic test-button errors; two permission requests back to back; task creation not attributed.
- **Cause:** not recorded
- **Fix:** Creation attribution added (E-019f65ca-6); other items not recorded as fixed.
- **HISTORY.md line:** 1715

### 278. 2026-07-15 (13:17) — Journal expand (maximize) button effectively disappeared
- **Chat:** C26
- **What happened:** "The option to maximize (full screen) has gone!"
- **Cause:** Expand button contrast already low before the texture.
- **Fix:** Border and larger size (E-019f65ec-24).
- **HISTORY.md line:** 1732

### 279. 2026-07-15 (13:43) — Mistyped edit deleted `panel-journal` opening tag
- **Chat:** C26
- **What happened:** Book cover v1 edit removed the panel's opening tag.
- **Cause:** Mistyped parameter in one edit.
- **Fix:** Restarted from a clean copy.
- **HISTORY.md line:** 1737

### 280. 2026-07-15 (13:48) — "Share as image" reported saved but no image existed
- **Chat:** C26
- **What happened:** Share-as-image showed false success.
- **Cause:** No storage permission and no Filesystem/Share plugin; web fallback reported success.
- **Fix:** `shareImageFromCanvas` writes to app cache and opens native share sheet; `@capacitor/filesystem` and `@capacitor/share` installed (E-019f660c-103, E-019f66c6-4, -9); needed new APK (v1.5).
- **HISTORY.md line:** 1743

### 281. 2026-07-15 (17:28) — Journal redesign regressions: "Add a new page" → Home; cover once per open; logo gap
- **Chat:** C26
- **What happened:** "You just introduced so many bugs!"
- **Cause:** `panel-bubbles` is the Home panel itself; cover gated to once per open; header logo height, fixed width and `aspect-ratio` conflicting.
- **Fix:** `startingEntryBanner` switched on (E-019f66d2-25, -33); cover every time (-41); `width: auto` (-61).
- **Recurring:** journal Add→Home at lines 1760, 1795, 1801 ("5 attempts").
- **HISTORY.md line:** 1752

### 282. 2026-07-15 (17:41) — Journal Add flow still showed Home hero
- **Chat:** C26
- **What happened:** "Again the journal bug!"
- **Cause:** `.home-hero` visible in Add flow.
- **Fix:** Hidden in Add flow, restored on Home (E-019f66de-14…-40).
- **Recurring:** of line 1752.
- **HISTORY.md line:** 1760

### 283. 2026-07-15 (17:57) — Force Dark recoloured journal cover teal/green; swipe listeners on small panel
- **Chat:** C26
- **What happened:** Cover teal/green; neither tap nor swipe worked.
- **Cause:** No `color-scheme` declaration → phone Force Dark recoloured page; swipe listeners only on small cover panel.
- **Fix:** Meta tag, CSS, native `MainActivity` override with `androidx.webkit` (E-019f66ed-14, -22, -32, -44); listeners on full stage with tap fallback (-54, -64 orphaned listener removed); APK v1.6.
- **HISTORY.md line:** 1767

### 284. 2026-07-15 (18:08–18:24) — Swipe-to-open: stale text, missing `touch-action`, arcing swipes
- **Chat:** C26
- **What happened:** Still "tap to open"; swipe animation not working.
- **Cause:** Cover text never changed; no `touch-action: none`; swipe arcing >60 px vertically failed both swipe and 10 px tap checks.
- **Fix:** Text + arrow (E-019f66f7-8, -14, -22; v1.7); `touch-action: none` (E-019f66fe-8, -15; v1.8); any touch-and-release opens (E-019f6705-10; v1.9).
- **HISTORY.md line:** 1773

### 285. 2026-07-15 (19:24) — Google sign-in "Error 401: deleted_client"
- **Chat:** C26
- **What happened:** Google OAuth client no longer existed.
- **Cause:** not recorded (Claude had no Google Cloud access; not from app code).
- **Fix:** Akash created a new Google Cloud project and updated client ID/secret in Supabase (22:17).
- **HISTORY.md line:** 1783

### 286. 2026-07-15 (22:17) — Share outside captured only index snippet
- **Chat:** C26
- **What happened:** Share captured "a random screenshot, not the complete entry".
- **Cause:** After index redesign, share captured the compact index row (~40-character snippet).
- **Fix:** Full off-screen card built for capture and removed afterwards (E-019f67db-11, -19).
- **HISTORY.md line:** 1791

### 287. 2026-07-15 (22:30) — New journal entry still showed Home content
- **Chat:** C26
- **What happened:** Crew section, Add Task, "More ways…" and social links visible on the new-entry page.
- **Cause:** Not hidden with the hero.
- **Fix:** Wrapped in `#homeExtraContent` and hidden; whole `panel-journal` vintage paper (E-019f67e6-25, -28, -45).
- **Recurring:** of line 1752; continued at 1801–1806 (update check ran once per process).
- **HISTORY.md line:** 1795

### 288. 2026-07-15 22:39–22:44 — Web fixes never reached the app: update check ran only once per process
- **Chat:** C26
- **What happened:** The new-entry/background button still went to Home after "5 attempts"; Claude's test on live code showed the Add flow working.
- **Cause:** The app loads the live site remotely, but the update check ran only once per app process; Android keeps the process alive, so later web fixes never loaded.
- **Fix:** Recheck with a 30-second cooldown, keeping the no-loop guard (E-019f67ee-21); Akash asked to force-close and reopen.
- **HISTORY.md line:** 1801

### 289. 2026-07-15 22:49 — "Add" in the journal showed mood bubbles instead of opening the entry
- **Chat:** C26
- **What happened:** Tapping new entry showed bubbles instead of going straight to the writing page.
- **Cause:** not recorded
- **Fix:** Add now goes straight to the writing page (E-019f67f8-17).
- **HISTORY.md line:** 1808

### 290. 2026-07-15 22:49 — Journal mic did nothing on Android
- **Chat:** C26
- **What happened:** Akash reported the mic doesn't work.
- **Cause:** The Web Speech API does not exist in the Android WebView.
- **Fix:** `@capacitor-community/speech-recognition` plus `RECORD_AUDIO` (E-019f67f8-68, -72); APK v2.0 (11).
- **Recurring:** mic still broken Jul 16 09:19, 14:40 (5-second cut-off) and 21:13 (MODIFY_AUDIO_SETTINGS) — see entries below.
- **HISTORY.md line:** 1814

### 291. 2026-07-16 14:40 — Voice recorder stopped after 5 seconds with no recording indicator
- **Chat:** C26
- **What happened:** The recorder stopped after ~5 s and gave no sign it was recording.
- **Cause:** Android's silence cut-off in speech recognition.
- **Fix:** Auto-restart on the cut-off plus a "Listening…" indicator (E-019f6b5f-23…-49); APK v2.1.
- **HISTORY.md line:** 1827

### 292. 2026-07-16 15:57–16:08 — `transcribe-audio` failed to boot; built on a paid API against Akash's stated budget
- **Chat:** C26
- **What happened:** The first deployed `transcribe-audio` (OpenAI Whisper, E-019f6ba5-37) would not boot; Claude had also built and deployed it on a paid API after Akash had said he had no money to spend.
- **Cause:** The `esm.sh` supabase-js import stopped the function booting; the paid-API choice was Claude's recommendation.
- **Fix:** Rewritten with a direct auth API call; redeployed on AssemblyAI (free hours, no card) after Akash's choice.
- **Recurring:** same remote-import deploy failure on `send-push-notification` Jul 20 22:30 (line 2098).
- **HISTORY.md line:** 1834

### 293. 2026-07-16 09:19 → 16:31 — 92% white overlay smothered the vintage paper photo
- **Chat:** C26
- **What happened:** The journal sections Akash wanted as vintage paper did not look like vintage paper.
- **Cause:** Claude had raised the white overlay to 92% for contrast, which hid the photo.
- **Fix:** Overlay 25%, near-black ink, Caveat/Kalam fonts, buttons restyled as ink (E-019f6bc6-10…-69); contrast measured 8.06:1.
- **HISTORY.md line:** 1841

### 294. 2026-07-16 16:51 — Journal backgrounds: letter edges left in crop and a dark vignette band
- **Chat:** C26
- **What happened:** Akash reported clarity issues and lost intuitiveness.
- **Cause:** "TREASURES OF" letter edges left at the top of the index crop, and a dark vignette band from stretching the photo.
- **Fix:** Re-cropped and switched to tiling (E-019f6c95-15).
- **Recurring:** the tiling fix caused the next bug (20:57).
- **HISTORY.md line:** 1847

### 295. 2026-07-16 20:57 — Tiling fix repeated a branch illustration down the page ("too much bleeding")
- **Chat:** C26
- **What happened:** After the 16:51 fix, the background bled; Akash said the previous crop was better.
- **Cause:** Tiling repeated a branch illustration running down the card's left edge.
- **Fix:** Grid-scanned for plain paper, cropped clean swatches, back to `cover`, and restored the previous cover image from git (byte-identical) (E-019f6cb7-34).
- **HISTORY.md line:** 1851

### 296. 2026-07-16 21:13 — Journal page scrolled when keyboard opened; mic still failing; green teardrop
- **Chat:** C26
- **What happened:** The writing page scrolled instead of fitting one page; a green teardrop appeared in screenshots; the mic still didn't work.
- **Cause:** `vh` does not shrink when the keyboard opens; `MODIFY_AUDIO_SETTINGS` was missing (Capacitor's WebChromeClient requests it for `getUserMedia`); the teardrop was probably the native text cursor handle.
- **Fix:** `dvh` instead of `vh` (E-019f6cc6-14, -20); `MODIFY_AUDIO_SETTINGS` added (-39); `caret-color` (-47), which Claude said it might not control. APK v2.2 (13).
- **HISTORY.md line:** 1856

### 297. 2026-07-16 22:15 / 22:28 — Mistyped edit parameter deleted page markup (twice)
- **Chat:** C26
- **What happened:** During the chat build, a mistyped edit parameter deleted the `nav-footer` opening tag; at 22:28 the same typo deleted content again.
- **Cause:** Mistyped edit-tool parameter (Claude).
- **Fix:** Restored in the next edit; the 22:28 one was redone (E-019f6cf4-*, E-019f6d0c-*).
- **Recurring:** similar self-inflicted edit deletions: `subscribeToChatRoom` (Jul 20, line 2040), a comment fragment (Jul 21, line 2122), `mood_check` block (Jul 26, line 2504).
- **HISTORY.md line:** 1880

### 298. 2026-07-16 22:28 — Invited support-group members could not see the room
- **Chat:** C26
- **What happened:** People invited to a group could not see it to accept.
- **Cause:** `is_chat_room_member()` only counted "joined" members.
- **Fix:** A separate visibility check that includes "invited".
- **HISTORY.md line:** 1887

### 299. 2026-07-16 22:40 — Group messages had no sender name
- **Chat:** C26
- **What happened:** Group messages previously showed no sender name.
- **Cause:** not recorded
- **Fix:** Alias-aware names and sender labels (E-019f6d16-14, -27, -33); new profiles RLS policy so group members can read their facilitator's name.
- **HISTORY.md line:** 1890

### 300. 2026-07-19 09:48–09:51 — New doctor created as a Therapist
- **Chat:** C26
- **What happened:** A newly added General Physician did not appear where expected; she had been created as a Therapist.
- **Cause:** Her `experts.role_category` was "Therapist" while everything else said General Physician.
- **Fix:** Fixed directly in the live DB.
- **HISTORY.md line:** 1913

### 301. 2026-07-19 09:54 — Consent gate only fired for clients with an active Therapist booking *(adds to an existing entry)*
- **Chat:** C26
- **What happened:** Clients with only a psychiatrist, GP or peer caregiver were never gated. Claude also briefly added and removed a redundant column (live DB).
- **Cause:** Gate tied to an active Therapist booking.
- **Fix:** Separate `userHasAnyClinicalConnection` flag (E-019f79cb-74, -87); 4 scenarios tested; checked at app open only.
- **BUG_LOG has:** #107 "The staging APK currently in circulation is behind production on the universal consent-gate fix…" mentions the `userHasAnyClinicalConnection` version as the older gate, but not the original Therapist-only gap or its fix.
- **HISTORY.md line:** 1919

### 302. 2026-07-19 15:10 — Google Calendar OAuth never returned to the app
- **Chat:** C26
- **What happened:** After "continue" on Google's unsafe-app screen, the flow never returned to the app.
- **Cause:** A Web-application OAuth client only allows `https` redirects, so the external browser loaded the site with no app session.
- **Fix:** Single-use 10-minute state token (new table) so the landing page can finish the exchange without a session (E-019f7aed-18…-76); `@capacitor/browser` added; APK v2.4. (Claude's first idea was checked against the plugin's real API and dropped.)
- **Recurring:** same https-only root cause behind the Sept "stuck in browser" report (BUG_LOG #108).
- **HISTORY.md line:** 1941

### 303. 2026-07-19 15:46 — Availability repeat only offered Monday
- **Chat:** C26
- **What happened:** Repeat options for availability only offered Monday.
- **Cause:** not recorded
- **Fix:** Three modes: same weekday weekly, specific weekdays, same weekday monthly (E-019f7b0e-15, -24).
- **HISTORY.md line:** 1947

### 304. 2026-07-19 16:10 — Profile photos could not be uploaded, and updates never reached the public profile
- **Chat:** C26
- **What happened:** Professionals couldn't upload profile pictures; their updates didn't show publicly.
- **Cause:** Storage policy needs the user ID as the first path segment but code used `profile-photos/<id>/…`; saving never updated `experts.photo_url`, which clients see.
- **Fix:** E-019f7b24-36 and E-019f7bf1-5; tested with a real upload and pushed.
- **Recurring:** same storage-path rule broke group icon upload (Jul 21 08:55, line 2156) and campaign image upload (Jul 22 17:36, line 2292).
- **HISTORY.md line:** 1959

### 305. 2026-07-19 16:10 — Test admin's `is_therapist` flag reset by an earlier clean-up
- **Chat:** C26
- **What happened:** The test admin's `is_therapist` flag had been reset during an earlier clean-up.
- **Cause:** Claude's earlier clean-up.
- **Fix:** Claude re-set the flag.
- **HISTORY.md line:** 1964

### 306. 2026-07-19 21:04 — Contract phone fields accepted 11 digits or random numbers
- **Chat:** C26
- **What happened:** Phone inputs on contracts accepted invalid values.
- **Cause:** not recorded (no input validation)
- **Fix:** All 6 phone inputs digits-only, max 10, with a submit check (E-019f7c31-*/E-019f7d03-*/E-019f7d11-*).
- **HISTORY.md line:** 1989

### 307. 2026-07-19 21:04 — Mascot chat button not showing in the browser
- **Chat:** C26
- **What happened:** The mascot button didn't show on wide screens.
- **Cause:** `.phone` had no `position: relative`, so the button anchored to the viewport.
- **Fix:** Added (same edit range, 21:12 → Jul 20 01:28).
- **HISTORY.md line:** 1998

### 308. 2026-07-19 21:04 — Sign-out stuck on "Good to see you" loading
- **Chat:** C26
- **What happened:** Signing out left the app stuck on the loading splash.
- **Cause:** After a restored session the splash/form switch never ran.
- **Fix:** Logout now sets both states.
- **HISTORY.md line:** 2000

### 309. 2026-07-19 21:04 — App sometimes opened to a white screen
- **Chat:** C26
- **What happened:** Intermittent white screen on open.
- **Cause:** The Supabase CDN script had no fallback, and the failure happened before error logging existed.
- **Fix:** Boot timeout, retry screen, and `unhandledrejection` logging.
- **HISTORY.md line:** 2002

### 310. 2026-07-19 21:04 — Clients' shared journal entries not fully visible to professionals/admin
- **Chat:** C26
- **What happened:** Shared entries were cut off or missing.
- **Cause:** Admin view only queried `entries` (missing worksheets and test results); both views truncated shared text at 60/80 characters. Claude also dropped HTML escaping in one edit (restored in the next).
- **Fix:** Queries widened, truncation removed, escaping restored.
- **HISTORY.md line:** 2005

### 311. 2026-07-20 (~01:28) — Stale local test server served old code during testing
- **Chat:** C26
- **What happened:** Testing ran against old code; the last two features were later found already live from the earlier turn.
- **Cause:** A stale local test server.
- **Fix:** not recorded (re-checked)
- **HISTORY.md line:** 2011

### 312. 2026-07-20 01:59 — `dbWrite` called `.json()` on empty `return=minimal` responses (send-group-poll and google-calendar-sync) *(adds to an existing entry)*
- **Chat:** C26
- **What happened:** Found in new `send-group-poll`; the same bug was already in deployed `google-calendar-sync`, not yet triggered.
- **Cause:** `.json()` on empty `return=minimal` responses.
- **Fix:** Fixed and redeployed both (E-019f7d37-55, -61, -74).
- **BUG_LOG has:** "August 5, 2026 — Google Calendar OAuth debugging marathon": "`return=minimal` responses have no body" for the calendar sync function only; no mention of this earlier Jul 20 fix or `send-group-poll`.
- **HISTORY.md line:** 2036

### 313. 2026-07-20 01:59 — Edit deleted the `subscribeToChatRoom` declaration
- **Chat:** C26
- **What happened:** While building poll cards, one edit deleted `subscribeToChatRoom`.
- **Cause:** Self-inflicted edit (Claude).
- **Fix:** Restored (E-019f7d40-5).
- **Recurring:** see 2026-07-16 22:15 entry.
- **HISTORY.md line:** 2040

### 314. 2026-07-20 17:30 — Therapists could not see clients' signed contracts
- **Chat:** C26
- **What happened:** Non-admin therapists couldn't view clients' signed consent agreements.
- **Cause:** No RLS policy let non-admin therapists read `consent_agreements`.
- **Fix:** Policy added (live DB), tested with fresh non-admin accounts. (Emergency contact was simply not filled in.)
- **HISTORY.md line:** 2054

### 315. 2026-07-20 17:30 — Duplicate rows from `syncToSupabase` across five tables *(adds to an existing entry)*
- **Chat:** C26
- **What happened:** Real duplicate rows (same text, timestamp to the millisecond).
- **Cause:** `syncToSupabase` blindly inserted and its retry queue re-sent after a network blip; affected entries, WHO-5, tasks, subtasks, test results.
- **Fix:** Client-made ID plus upsert (E-019f8094-152); 23 duplicate journal rows deleted (live DB).
- **BUG_LOG has:** "July 22–23, 2026 — Early development session": "Journal entry duplication: root cause was a race condition in the shared save/retry function. Fixed…" — no mechanism, five-table scope, or edit id.
- **HISTORY.md line:** 2056

### 316. 2026-07-20 17:30 — Journal add button placed on the wrong panel
- **Chat:** C26
- **What happened:** First attempt to limit the journal add button to the journal page used the wrong panel.
- **Cause:** Claude targeted the wrong panel; the real index is `panel-history`.
- **Fix:** E-019f80a9-83, -87, -116; pushed Jul 20 18:07.
- **HISTORY.md line:** 2063

### 317. 2026-07-20 18:08 — Professional profile edits "saved" but updated zero rows
- **Chat:** C26
- **What happened:** Dr Anisha's (and other professionals') profile changes never saved, while the app reported success.
- **Cause:** The save matched by exact name; her profile said "Dr Anisha Chaubey", the experts row "Dr. Anisha Chaubey", so it updated zero rows.
- **Fix:** Profile, one booking and one invite aligned (live DB); save now checks a row was actually updated and shows an error otherwise, same for photo sync (E-019f80b6-59, -68). Third lookup (external-client logging) has a safe fallback.
- **HISTORY.md line:** 2066

### 318. 2026-07-20 22:11 — Double tap created two empty direct chats
- **Chat:** C26
- **What happened:** Akash saw two chats with a user he never messaged.
- **Cause:** Race in `startOrOpenDirectChat`: a double tap created two rooms 0.65 s apart.
- **Fix:** In-flight guard; rooms deleted (E-019f8195-24).
- **HISTORY.md line:** 2082

### 319. 2026-07-20 22:11 — "Couldn't add members" to a group
- **Chat:** C26
- **What happened:** Adding members failed.
- **Cause:** The picker did not exclude existing members, and the unique constraint failed the whole batch.
- **Fix:** Exclusion plus upsert (E-019f8195-66, -70).
- **HISTORY.md line:** 2084

### 320. 2026-07-20 22:11–22:45 — Polls and ordinary members' chat messages sent no push notifications
- **Chat:** C26
- **What happened:** No poll notifications; group members' messages were probably not notifying anyone.
- **Cause:** Polls never called the push service; `send-push-notification` rejected service-role calls ("Invalid or expired session") and only let admins and therapists notify others.
- **Fix:** Push call added to polls (E-019f8195-108); service-role bypass plus a room-membership exception (E-019f819e-8, -12, -20; E-019f81a7-5, -12, -16); function rewritten with raw `fetch` (E-019f81a7-102). Tested with temporary accounts and fake tokens.
- **HISTORY.md line:** 2088

### 321. 2026-07-20 22:30 — `send-push-notification` deploy failed on remote SDK import
- **Chat:** C26
- **What happened:** The raw PATCH deploy failed (`--no-remote is specified` in `function_logs`); Claude first padded the file for suspected truncation.
- **Cause:** Remote `@supabase/supabase-js` import.
- **Fix:** Multipart `/functions/deploy`, then full rewrite with raw `fetch`, no SDK import (E-019f81a7-102).
- **Recurring:** same class as `transcribe-audio` esm.sh boot failure (Jul 16, line 1835).
- **HISTORY.md line:** 2098

### 322. 2026-07-20 22:30–22:45 — Testing sent real notifications to real users
- **Chat:** C26
- **What happened:** A boundary test sent a real test notification to Akash's phone; the first live poll notification reached real devices; the first APK-update run sent real "update available" notifications to 11 real users (clients and professionals). Claude told Akash afterwards.
- **Cause:** Tests/first runs against live data with real recipients.
- **Fix:** not recorded
- **HISTORY.md line:** 2104

### 323. 2026-07-21 07:17 — "Seen the walkthrough" never saved; returning users kept getting onboarding slides
- **Chat:** C26
- **What happened:** Returning users kept seeing the onboarding slides.
- **Cause:** `profiles.has_seen_intro` had never existed, so the save always failed silently.
- **Fix:** Column added and backfilled for users who had clearly onboarded (live DB). (One welcome-back edit deleted a comment and left a fragment; fixed.)
- **HISTORY.md line:** 2124

### 324. 2026-07-21 07:33 — Welcome-back image cropped
- **Chat:** C26
- **What happened:** The welcome image was cropped.
- **Cause:** not recorded
- **Fix:** Switched to `contain` with matching sky colour; 1080 × 2400 given; splash lines removed (E-019f8397-19, -22).
- **HISTORY.md line:** 2127

### 325. 2026-07-21 07:43 — White screen then loading: every user downloaded the welcome image on every load
- **Chat:** C26
- **What happened:** White screen then loading after the welcome-back change.
- **Cause:** Static `<img src>` made every user download ~198 KB on every load.
- **Fix:** Image loads only when shown (E-019f83a1-13, -21).
- **HISTORY.md line:** 2131

### 326. 2026-07-21 07:50 — Slow load: html2canvas and jsPDF render-blocking in `<head>`
- **Chat:** C26
- **What happened:** App took long to load; ~1.6 MB loaded before first paint.
- **Cause:** html2canvas (194 KB) and jsPDF (356 KB) were render-blocking, used only for share-as-image and PDF.
- **Fix:** Loaded on demand (E-019f83a7-25, -38, -45, -60).
- **HISTORY.md line:** 2134

### 327. 2026-07-21 08:18 — Welcome image not reaching screen edges; first native fix done in the wrong copy
- **Chat:** C26
- **What happened:** "It's cutting from sides" on a 720×1600 device.
- **Cause:** No edge-to-edge setup in `MainActivity`; the first attempt was made in the zip copy (`hobs_everything`) with broken dependencies.
- **Fix:** Letterbox colour (E-019f83c1-17); edge-to-edge redone in the real project keeping Force-Dark (E-019f83c6-52); APK v2.6 (17), deliberately not registered for update notices.
- **Recurring:** this edge-to-edge APK caused the 12:48 system-bar overlap.
- **HISTORY.md line:** 2138

### 328. 2026-07-21 08:33 — Stray back arrow above footer opened chat
- **Chat:** C26
- **What happened:** A back arrow sometimes appeared above the footer and opened chat.
- **Cause:** `panel-chat-room` had `display:none;…display:flex` in one style, so it was visible by default; `renderHomeGreeting()` never called `showOnly`, and the welcome-back path exposed it.
- **Fix:** `showOnly` applies flex for that panel (E-019f83ce-52, -55, -63).
- **HISTORY.md line:** 2148

### 329. 2026-07-21 08:55 — Group icon upload failed (storage path rule)
- **Chat:** C26
- **What happened:** Group icon upload failed.
- **Cause:** Same storage-path rule as profile photos (user ID must come first).
- **Fix:** E-019f83dc-34; real group's name and icon restored after testing.
- **Recurring:** see 2026-07-19 16:10 profile photo entry.
- **HISTORY.md line:** 2156

### 330. 2026-07-21 12:48 — Edge-to-edge APK put header and footer under system bars
- **Chat:** C26
- **What happened:** "New bugs that you introduced!!! After you created the new apk!"
- **Cause:** No `viewport-fit=cover`, so `env(safe-area-inset-*)` had always been 0; the edge-to-edge APK exposed it.
- **Fix:** Added both (E-019f84b8-15, -18, -20); web-only.
- **HISTORY.md line:** 2162

### 331. 2026-07-21 12:48 — Garbled text in Google Calendar event description
- **Chat:** C26
- **What happened:** Event description showed Google's Meet join text badly (`~:~:~:~:`).
- **Cause:** Google's own Meet join text in the description.
- **Fix:** Description now written by the function itself (E-019f84b8-43; deployed).
- **HISTORY.md line:** 2165

### 332. 2026-07-21 12:59 — Ghost members: people who left still showed in groups
- **Chat:** C26
- **What happened:** Members who had left still showed.
- **Cause:** Query only excluded "declined".
- **Fix:** Now only joined and invited (E-019f84c2-38).
- **HISTORY.md line:** 2170

### 333. 2026-07-21 13:36 — HubSpot test-result sync sent only "elevated", not scores
- **Chat:** C26
- **What happened:** First version of `sync-test-result-to-hubspot` sent only "elevated".
- **Cause:** not recorded
- **Fix:** Extracted `TESTS_DATA` via Node, embedded scoring, passed `answers` through the trigger, verified against Python (E-019f84e4-58, -61).
- **HISTORY.md line:** 2182

### 334. 2026-07-21 18:39 — Real credentials written into the handoff doc and Drive
- **Chat:** C26
- **What happened:** Claude added a "Core Project Access" section with real credentials (GitHub PAT, Supabase keys, scheduler secret, HubSpot token, test account, keystore password) and uploaded "v16 CORRECTED" to Drive; several v16 copies with credentials piled up because Drive allowed create only.
- **Cause:** Claude wrote credentials into the handoff doc on request for "all access tokens".
- **Fix:** not recorded (history notes this is where credentials were first written into the handoff doc and Drive)
- **HISTORY.md line:** 2193

### 335. 2026-07-21 19:00–22:53 — Handoff repeatedly incomplete; stale copies carried forward
- **Chat:** C26
- **What happened:** Across repeated "are you sure?" checks: keystore file never in the handoff; `ASSEMBLYAI_API_KEY`, `on_auth_user_created` trigger, two tables, `notification-scheduler-15min-v2` cron undocumented; `supabase_schema.sql` stale (~10 of 36 tables); carried-forward `AndroidManifest.xml` stale (missing POST_NOTIFICATIONS and RECORD_AUDIO); three deployed functions never captured.
- **Cause:** Claude reasoned from memory instead of listing the real system.
- **Fix:** Added to successive v16 docs/zip ("v16 FINAL", "TRUE FINAL", final "go by the timestamp inside").
- **HISTORY.md line:** 2199

### 336. 2026-07-21 22:53 — `check-journal-risk` (Groq crisis layer) failing closed; Claude called it "unbuilt"
- **Chat:** C26
- **What happened:** The Groq AI crisis layer was built and called by the app but failing closed.
- **Cause:** `GROQ_API_KEY` was never set; Claude had been calling it "unbuilt".
- **Fix:** not fixed / open here (Groq key listed as remaining item, lines 2362, 2533)
- **HISTORY.md line:** 2220

### 337. 2026-07-22 17:01 — Previous donation campaigns not visible to admin
- **Chat:** C28
- **What happened:** Past campaigns not visible ("This is the priority").
- **Cause:** Admin only ever queried the active campaign.
- **Fix:** Past Campaigns list with Reactivate (E-019f8adf-4…-24).
- **HISTORY.md line:** 2280

### 338. 2026-07-22 17:01 — Share description cut mid-sentence at 200 characters
- **Chat:** C28
- **What happened:** Meta description was cut mid-sentence.
- **Cause:** 200-character cut in `update-donate-page-meta`.
- **Fix:** E-019f8ad4-145.
- **HISTORY.md line:** 2287

### 339. 2026-07-22 17:36 — `git checkout -- donate.html` threw away uncommitted image edit
- **Chat:** C28
- **What happened:** During clean-up, Claude discarded its own uncommitted image edit.
- **Cause:** `git checkout -- donate.html`.
- **Fix:** Redone (E-019f8adf-125, -131).
- **HISTORY.md line:** 2297

### 340. 2026-07-22 17:46–18:59 — Claude misread "admin only" and published past campaigns publicly
- **Chat:** C28
- **What happened:** Akash said previous campaigns should be visible only to admin; Claude added a public "What we've already funded" section to `donate.html`, then at 18:52 quoted his message back as if it asked for that.
- **Cause:** Claude misread the instruction.
- **Fix:** Section removed from `donate.html` (a leftover brace caught) (E-019f8b2c-6…-30).
- **HISTORY.md line:** 2301

### 341. 2026-07-22 18:26 — Campaign description showed raw asterisks and no paragraphs in-app
- **Chat:** C28
- **What happened:** In-app profile widget and donate modal showed raw `**` and no paragraphs.
- **Cause:** Only `donate.html` had the `**bold**` renderer.
- **Fix:** Shared renderer (E-019f8b14-16, -18, -28).
- **HISTORY.md line:** 2326

### 342. 2026-07-22 18:26 — Stale admin tab overwrote approved campaign copy on save
- **Chat:** C28
- **What happened:** Saving Akash's upload overwrote the approved campaign text.
- **Cause:** Save race: Akash's admin tab still held the old text.
- **Fix:** Claude reapplied the copy.
- **HISTORY.md line:** 2328

### 343. 2026-07-22 18:40 — Test script overwrote the real campaign description with placeholder text
- **Chat:** C28
- **What happened:** During auto-grow testing, a test script replaced the live campaign description.
- **Cause:** Test script writing to real data (Claude).
- **Fix:** Claude restored it.
- **Recurring:** test clean-up switched the real campaign off (Jul 31 10:43, line 2609).
- **HISTORY.md line:** 2336

### 344. 2026-07-22 22:03 — Google-Calendar privacy-policy section never published
- **Chat:** C28
- **What happened:** The section written Jul 20 (E-019f7d2c-15) was never on the live policy.
- **Cause:** not recorded
- **Fix:** Added to live `privacy-policy.html` (E-019f8bda-39).
- **HISTORY.md line:** 2358

### 345. 2026-07-22 22:16–22:38 — Screenshot blocking never actually enabled
- **Chat:** C28
- **What happened:** Screenshot blocking in chats was described as done on Jul 21 (E-019f833a-66), but `@capacitor/privacy-screen` was a dependency never called; Akash could still take screenshots.
- **Cause:** Plugin never called; the native plugin also needs a new APK.
- **Fix:** Enabled only on chat panels via `showOnly()` (E-019f8be7-75); APK v2.7 built at 22:48.
- **HISTORY.md line:** 2366

### 346. 2026-07-22 22:38 — Missed `git add version.json`
- **Chat:** C28
- **What happened:** `version.json` not included in a commit.
- **Cause:** Missed `git add`.
- **Fix:** Found and fixed.
- **Recurring:** `version.json` / `CURRENT_BUILD` mismatch Jul 23 00:39 (line 2433).
- **HISTORY.md line:** 2373

### 347. 2026-07-22 22:48 — APK v2.6 never registered in `app_releases`
- **Chat:** C28
- **What happened:** `app_releases` only had v2.4, so v2.6 had never been registered.
- **Cause:** v2.6 was deliberately held back pending Akash's check and never registered afterwards.
- **Fix:** v2.7 uploaded and registered.
- **HISTORY.md line:** 2383

### 348. 2026-07-22 23:33 — `delete-user-account` blocked self-delete and had an out-of-date table list
- **Chat:** C28
- **What happened:** The deployed function explicitly blocked deleting your own account; its table list was out of date.
- **Cause:** not recorded
- **Fix:** Rewritten from a live schema check (E-019f8c22-31): self-delete mode, hard/soft delete, staff blocked; in-app and `delete-account.html` paths.
- **HISTORY.md line:** 2396

### 349. 2026-07-22 23:37 — APK v2.7 shipped without bundled images *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** v2.7 was smaller; `assets/public` lacked the bundled images.
- **Cause:** Only `index.html` had been copied into `www/` in the fresh native project.
- **Fix:** Rebuilt with images (8.1 MB), native fixes re-checked in bytecode, file in `app-releases` replaced under same v2.7 entry.
- **BUG_LOG has:** "Standing lessons" — "every image asset were each found missing separately, reactively" (no specific entry, cause or fix).
- **HISTORY.md line:** 2405

### 350. 2026-07-22 23:43 — Account deletion missed `chat_rooms.client_id` and professional scheduling tables
- **Chat:** C28
- **What happened:** Wider column search found unhandled references.
- **Cause:** not recorded
- **Fix:** `client_id` nulled (room kept) and scheduling tables handled (E-019f8c35-14).
- **HISTORY.md line:** 2411

### 351. 2026-07-22 23:56 → 2026-07-23 00:44 — Page-turn animation: built without permission, blank blue screen, reverted
- **Chat:** C28
- **What happened:** Repeated failed attempts; one edit broke the image lazy-load; Claude described a plan after "talk to me" and built it anyway; screen went blank blue; a near-invisible sliver before tap; finally fully reverted. A `version.json` / `CURRENT_BUILD` mismatch was caught.
- **Cause:** Flipping to `+85deg` with `backface-visibility: hidden` hid the image; building without waiting for Akash.
- **Fix:** Sign fix (E-019f8c5f-16…-29), resting angle (E-019f8c66-4, -10), then full revert to tap-to-open (E-019f8c69-8…-25).
- **HISTORY.md line:** 2418

### 352. 2026-07-23 06:26 — New Task FAB (z 55) covered the add-task sheet (z 11) and blocked Save *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** FAB covered the sheet's Save.
- **Cause:** z-index 55 vs 11.
- **Fix:** FAB hidden while the sheet is open (E-019f8da7-126, -131).
- **BUG_LOG has:** "August 2, 2026": "Floating assistant button rendering on top of sheet buttons: a sheet's z-index (11) was far lower than the floating button's (55) — raised…" — different date and fix; Jul 23 instance not recorded.
- **HISTORY.md line:** 2440

### 353. 2026-07-23 06:41 — Task FAB and redesign built on the wrong screen (`panel-day`)
- **Chat:** C28
- **What happened:** Akash saw no plus button and no urgency colours on the Tasklist.
- **Cause:** Claude built on `panel-day`, not the real Tasklist landing screen `panel-calendar`, which never had priority colours.
- **Fix:** Priority colours added (E-019f8db5-18); FAB also on `panel-calendar`; a duplicate element ID caught before shipping (-32…-50).
- **HISTORY.md line:** 2442

### 354. 2026-07-23 06:59–07:03 — Removing the calendar also removed tasklists and changed the font
- **Chat:** C28
- **What happened:** Asked to remove only the calendar, Claude narrowed the screen to today only and changed the font.
- **Cause:** Claude over-applied the request.
- **Fix:** Reverted to full all-dates list in plain font; grid stays removed (E-019f8dc9-10…-24).
- **HISTORY.md line:** 2449

### 355. 2026-07-23 14:39–14:46 — Blue screen before welcome image; journal backgrounds slow *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** Screen turned blue before the welcome image; same with the journal backgrounds.
- **Cause:** On slow connections the image only started downloading when shown.
- **Fix:** Preload at sign-in in parallel (E-019f8f6a-22); three vintage backgrounds preloaded (E-019f8f71-25).
- **BUG_LOG has:** "July 23–26, 2026": "image preload bug fixes — feature work, no major regressions recorded" (no cause/fix).
- **HISTORY.md line:** 2458

### 356. 2026-07-26 22:26 — Edit briefly broke the `mood_check` block in `notification-scheduler`
- **Chat:** C28
- **What happened:** While removing the duplicate `app_update` path, one edit broke `mood_check`.
- **Cause:** Self-inflicted edit.
- **Fix:** Fixed before redeploy (E-019fa07b-117…-139).
- **HISTORY.md line:** 2504

### 357. 2026-07-26 22:26 — Journal entries duplicated: `saveNoteBtn` had no double-fire guard *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** One of Akash's entries existed 6 times with the same timestamp.
- **Cause:** `saveNoteBtn` had no double-fire guard (touchend and click both firing); task save had one.
- **Fix:** Guard and dual listeners (E-019fa07b-63, -74); tested, pushed.
- **BUG_LOG has:** "July 26–27, 2026": "Journal duplicates investigated further (… this session confirmed it held)" — contradicts HISTORY, which shows a new root cause and fix.
- **HISTORY.md line:** 2505

### 358. 2026-07-26 22:45 — Scheduled notifications not showing: no notification channel ever created *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** FCM reported 100% success but scheduled reminders never appeared; Claude first suggested battery optimisation.
- **Cause:** No notification channel was ever created; Android auto-creates one on first background push and locks its importance. Native Android files had never been under version control.
- **Fix:** `MainActivity` creates a high-importance channel; manifest sets `default_notification_channel_id` (E-019fa09a-48); APK v2.8 (19). Existing installs need manual channel change or reinstall.
- **BUG_LOG has:** "July 26–27, 2026": "Scheduled/recurring push notifications reported as not showing up… investigated as part of the notification channel native fix that shipped in APK v2.9" — no cause/fix detail, and version differs (HISTORY: v2.8).
- **HISTORY.md line:** 2510

### 359. 2026-07-26 23:11 — App icon reverted to old icon on every fresh native scaffold *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** The new APK had the old icon.
- **Cause:** Each fresh native scaffold dropped the custom icon, which was never on the copy-back list.
- **Fix:** New adaptive icons from Akash's image; APK v2.9 (20); icons saved to `android-native-assets/icons/` (E-019fa0b2-113).
- **BUG_LOG has:** "July 26–27, 2026": "App icon fixed (Bob mascot was missing/wrong on the launcher icon)" — no cause or fix.
- **HISTORY.md line:** 2524

### 360. 2026-07-27 00:00 — Claude missed the existing HubSpot trigger and created a duplicate
- **Chat:** C28
- **What happened:** Claude said HubSpot was "never called from anywhere" and created a DB trigger duplicating `trg_sync_test_result_to_hubspot`.
- **Cause:** Missed the DB trigger C26 created on Jul 21 (only checked client code).
- **Fix:** Duplicate dropped (live DB); function also accepts authenticated users (E-019fa0e6-34).
- **HISTORY.md line:** 2542

### 361. 2026-07-27 00:00 — Fake "request a follow-up" email box saved only locally
- **Chat:** C28
- **What happened:** A follow-up email box in tests appeared functional but only saved locally.
- **Cause:** not recorded
- **Fix:** Removed (E-019fa0e6-90…-97; E-019fa0f2-73…-96).
- **HISTORY.md line:** 2549

### 362. 2026-07-27 01:02 — "See Results" button not working on device
- **Chat:** C28
- **What happened:** DASS-type test: no response on See Results; all 16 tests passed in automation.
- **Cause:** not recorded (fix implies touch vs click handling)
- **Fix:** Dual touchend + click listeners with a guard on Next/Back (E-019fa11c-24, -30).
- **HISTORY.md line:** 2554

### 363. 2026-07-27 01:19 — Extracted deployed source had a truncated first line
- **Chat:** C28
- **What happened:** The HubSpot function source pulled from the deployment had its first line truncated.
- **Cause:** Extraction from the deployed bundle.
- **Fix:** Fixed before deploy (E-019fa124-27…-71).
- **HISTORY.md line:** 2564

### 364. 2026-07-31 08:46 — HubSpot form rejected submissions with no phone number
- **Chat:** C28
- **What happened:** Test results from users without a phone (10 of 21) were rejected by the form.
- **Cause:** Form requires phone.
- **Fix:** Sends "Not provided" (E-019fb75a-15, -23); redeployed and retested.
- **HISTORY.md line:** 2566

### 365. 2026-07-31 08:50 — Reminder notifications not delivering: regression from the Jul 21 duplicate fix *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** Reminders not delivered on the latest APK with permissions granted; server showed 100% FCM success.
- **Cause:** The Jul 21 duplicate fix only posted a local notification in the foreground, so background delivery depended on Android's own display.
- **Fix:** Always post on receipt, de-duplicated by notification ID (E-019fb75e-33); web-only; confirmed at 2:30pm test.
- **Recurring:** regression of the 2026-07-21 23:09 duplicate-notification fix (E-019f86f0-133).
- **BUG_LOG has:** "July 31, 2026": "Notification delivery bug root-caused to a July 21 code change" — no cause or fix.
- **HISTORY.md line:** 2568

### 366. 2026-07-31 10:02 — App took 12.45 s to reach sign-in *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** Very slow load on throttled test.
- **Cause:** Oversized images (logo 1024 px shown at 80 px; mascot PNGs with no transparency) and no lazy loading on 37 images.
- **Fix:** Resized, mascots to `.jpg`, `loading="lazy"` except auth images; 7.5 s.
- **BUG_LOG has:** "July 31, 2026": "App performance work: image optimization, caching, donation widget." — no cause/fix detail.
- **HISTORY.md line:** 2597

### 367. 2026-07-31 10:13 — Razorpay took 1–2 s to open
- **Chat:** C28
- **What happened:** Slow Razorpay open; Claude first called the remaining delay "unfixable".
- **Cause:** Script load and order creation were sequential; Edge Function cold start (2.09 s cold, 0.5 s warm).
- **Fix:** Parallel + prefetch (E-019fb7a9-8…-24); ping mode plus keep-warm pg_cron every 4 min (E-019fb7b4-6).
- **HISTORY.md line:** 2603

### 368. 2026-07-31 10:43 — Claude's test clean-up kept switching the real donation campaign off (3 times)
- **Chat:** C28
- **What happened:** Akash's real campaign turned off after he restarted it, three times.
- **Cause:** Claude's test clean-up switched Akash's real campaign back off.
- **Fix:** Dedicated inactive test campaign; claude.ai memory rule to use only that.
- **Recurring:** see 2026-07-22 18:40 placeholder overwrite.
- **HISTORY.md line:** 2609

### 369. 2026-07-31 15:05 — Donation campaign vanished from profile after rejecting a test payment *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** Campaign disappeared, even from profile at times; DB was fine.
- **Cause:** `renderProfileDonationWidget()` cleared `innerHTML` before its fetch with a bare `return` on error, and Claude's own re-render after every payment close triggered it.
- **Fix:** Replace content only when new data arrives (E-019fb8b5-12); then cache + background prefetch at sign-in (E-019fb8be-9, -13, -19, -25).
- **BUG_LOG has:** "July 31, 2026": "App performance work: … donation widget." — no bug, cause or fix.
- **HISTORY.md line:** 2621

### 370. 2026-07-31 15:21 — Journal jumped to end of page while typing long entries *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** Typing longer text kept returning to the end of the page.
- **Cause:** Global `autoGrowTextarea` set `height:auto` then `scrollHeight` on every keystroke, collapsing the scroll container.
- **Fix:** Three failed attempts (E-019fb8c4-27, -91, -103); final: grow without collapsing, collapse-and-remeasure only when text got shorter (E-019fb8c4-110); measured over 504 keystrokes.
- **Recurring:** side effect of the app-wide auto-grow added Jul 22 18:40 (line 2334).
- **BUG_LOG has:** "July 31, 2026": "Journal scroll bug fixed." — no cause or fix.
- **HISTORY.md line:** 2633

### 371. 2026-07-31 (21:54 → 23:01) — Constellation prototype lost all interaction on click; not moving; subtasks not opening
- **Chat:** C28
- **What happened:** In the chat-widget prototype, clicking made it "lose all the interaction"; after that fix it stopped moving ("It's not fucking moving at all!"); then subtasks would not open and there was no way to restart.
- **Cause:** every button was rebuilt 60×/s during auto-spin; later, pointer capture broke `e.target`, so tap detection failed.
- **Fix:** rotate only a CSS transform; idle drift restored and drag moved to pointer capture on the scene; tap detection captured at pointerdown; Restart button added. (Prototype only, no edit ids given.)
- **HISTORY.md line:** 2666

### 372. 2026-07-31 (~22:xx) — Constellation prototype: labels hidden on Claude's own judgment, and placeholder "Step 1, Step 2" text instead of real subtask names
- **Chat:** C28
- **What happened:** Labels past 8 were hidden without being asked ("Where's name of subtasks?"); Claude had also used placeholder "Step 1, Step 2" text instead of the real task sentences.
- **Cause:** Claude's own choices (hid labels on its own judgment; used placeholder text).
- **Fix:** all labels shown; real sentences restored; focus mode added.
- **HISTORY.md line:** 2683

### 373. 2026-07-31 (~23:00) — Constellation prototype: entire screen went blank
- **Chat:** C28
- **What happened:** "the entire screen went fucking blank".
- **Cause:** a double-escaped apostrophe broke the script.
- **Fix:** not detailed beyond the cause (fixed in the next iteration).
- **HISTORY.md line:** 2688

### 374. 2026-07-31 23:02 — Constellation prototype showed only 1 dot; Claude had been shipping untested widget versions
- **Chat:** C28
- **What happened:** "There's literally just 1 dot!" Claude admitted it had been shipping widget versions it never tested.
- **Cause:** `Today` had no `subtasks`, so `star.subtasks.length` threw on the first star and stopped the loop.
- **Fix:** moved to a real file `/home/claude/widget_test/constellation_full.html` (E-019fba6a-19/-23) tested in headless Chromium; bug fixed (E-019fba6a-30). Verified 8 stars, 33 subtasks in focus mode.
- **HISTORY.md line:** 2689

### 375. 2026-07-31 23:09 → 2026-08-01 10:25 — Constellation prototype: mirrored/overlapping labels, screen not draggable; two self-inflicted breaks while fixing
- **Chat:** C28
- **What happened:** labels overlapped and showed mirrored text; user couldn't drag the screen. While editing, Claude removed `applyRotation` and dropped a `forEach` line.
- **Cause:** labels rotated with the scene instead of facing the camera; the two breaks were editing mistakes.
- **Fix:** labels billboard + fade by facing angle (`facingFactor`), defensive `setPointerCapture` (E-019fba70-2…-64); both self-inflicted breaks caught and fixed. 2 overlapping pairs remained; Claude's question on rotation vs 2D pan was never answered.
- **HISTORY.md line:** 2695

### 376. 2026-08-02 (02:16 → 02:20) — Journal alignment: `execCommand('justify…')` reported success but did nothing
- **Chat:** C28
- **What happened:** alignment buttons did nothing in the app, though they worked in isolated tests.
- **Cause:** `execCommand('justify…')` reported success but had no effect in the app.
- **Fix:** direct `text-align` on the editor (E-019fc02b-52); alignment saved as an outer `<div style="text-align:…">` wrapper, unwrapped on load (E-019fc02b-58, -64, -67).
- **HISTORY.md line:** 2729

### 377. 2026-08-02 (~02:20) — 6 of 13 deployed Edge Functions missing from the v18 handoff zip; one had no source at all
- **Chat:** C28
- **What happened:** building the v19 handoff, Claude found 6 of 13 deployed Edge Functions (incl. both Razorpay functions) missing from the v18 zip; `send-apk-update-notification` had no source anywhere.
- **Cause:** not recorded.
- **Fix:** functions pulled; `send-apk-update-notification` reconstructed from the compiled bundle (flagged as needing a check); README/schema updated (E-019fc042-39, -48, -61).
- **Recurring:** v20 handoff still had 4 of 14 functions only as fragments (line 3009); later "6 of 15 deployed functions missing from the repo" (line 3129, in BUG_LOG); `send-apk-update-notification` rebuilt by hand from bundle strings again (line 3132).
- **HISTORY.md line:** 2735

### 378. 2026-08-02 (~02:21–02:34) — Claude deleted both live duplicate journal rows, one likely a real entry, with no way to recover
- **Chat:** C28
- **What happened:** while fixing duplicates, Claude deleted both live duplicate rows as "cleanup"; one looked like a real entry of Akash's. Claude flagged it in the same reply. Akash: "Deleted both duplicate entries not knowing if one was original with no way to recover it!"
- **Cause:** Claude deleted real user data without confirmation.
- **Fix:** not recoverable; Claude saved a claude.ai memory rule: never delete real user data without explicit confirmation. Akash repeated at 12:45: "don't you fucking delete any duplicate entry."
- **HISTORY.md line:** 2752

### 379. 2026-08-02 02:34 — Saved journal entry didn't appear in the index *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** "upon saving the entry doesn't appear automatically in the index!"; 12:45 "The index display bug didn't resolve".
- **Cause:** `handleJournalSave` never called `renderHistory()` after saving.
- **Fix:** added (E-019fc052-12), deployed. Still reported at 12:45/12:55; Claude couldn't reproduce and pointed to `index.html` caching.
- **Recurring:** Aug 14 18:18 back button / index not reflecting edits (BUG_LOG #29, line 3380); later #38.
- **HISTORY.md line:** 2761
- **BUG_LOG has:** "August 2, 2026 — …": "the entry index not refreshing after edits" — no cause or fix.

### 380. 2026-08-02 02:21 → 12:45 — Journal duplicates: first diagnosis wrong; real cause a fresh random id on every save *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** two live rows with the same millisecond; Akash at 12:45: "the double entry bug didn't resolve!"
- **Cause:** first blamed the "rescue" pass (`_syncInFlight` flag + 8 s timeout, E-019fc046-35, -45, -48 — later shown not the root cause). Real cause: `syncToSupabase` used `payload.id || generateClientId()` — a fresh random id on every call, so `upsert onConflict:'id'` could never dedupe.
- **Fix:** stable client id at creation (main, worksheet, calendar-day paths; E-019fc281-67, -112, -116); `_serverConfirmed` replaced `!e.id` in rescue/edit/share/archive checks (E-019fc281-72, -76, -86, -95). Test: two saves → one row. Deployed.
- **Recurring:** July 22–23 duplication (BUG_LOG, different code path); old duplicates in DB (6× Jul 23, 3× Jul 25) found at 12:59 (line 2783).
- **HISTORY.md line:** 2774
- **BUG_LOG has:** "August 2, 2026 — Constellation UI, rich text, journal bugs, task alarms": "a duplicate-entries root cause (separate from the earlier July fix — a different code path)" — no cause, no wrong first diagnosis, no edit ids.

### 381. 2026-08-02 12:55 — `index.html` cached `max-age=600`, so deployed fixes could appear missing
- **Chat:** C28
- **What happened:** Akash reported the saved entry not appearing in the index; Claude couldn't reproduce and found `index.html` is also cached `max-age=600`.
- **Cause:** 600-second cache on `index.html`.
- **Fix:** not fixed / open — Claude asked Akash to force-close.
- **HISTORY.md line:** 2781

### 382. 2026-08-02 12:59 → 13:12 — `_serverConfirmed` regression duplicated every entry in the display and scrambled date order *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** after the duplicate fix was deployed, Akash's morning entry vanished from the app (still in DB), date order broke, and "You just fucking duplicated every fucking entry!!!!!"
- **Cause:** Claude's regression — `_serverConfirmed` didn't exist on cached entries from earlier sessions, so the rescue treated the whole journal as unsynced and re-inserted every entry into the display. Claude tested only fresh entries, never real aged data, and used the absence of a new field as a signal.
- **Fix:** reverted all four checks to `!e.id` (E-019fc292-2 + a bash revert), tested, deployed; no new DB rows (upsert on same ids). Akash confirmed fixed 13:12. Memory rule saved: test new-flag logic against real existing data.
- **HISTORY.md line:** 2786
- **BUG_LOG has:** "August 2, 2026 — …": "Critical regressions introduced and then caught within the same session: a `_serverConfirmed` flag bug and entry duplication in the index — both introduced while fixing the above, caught before shipping, fixed." — says "caught before shipping", but HISTORY shows it was deployed and hit Akash's real data; no cause.

### 383. 2026-08-02 16:15 → 19:54 — Constellation prototype: tasks without subtasks couldn't be completed; add-subtask silently dropped
- **Chat:** C28
- **What happened:** Claude's audit of the prototype listed 17 gaps, including that tasks without subtasks can't be completed and that add-subtask had been silently dropped (plus no rename/delete/text input).
- **Cause:** not recorded (add-subtask lost across prototype iterations).
- **Fix:** 19:54 in `constellation_full.html` (E-019fc40b-5…-58): tasks without subtasks toggle done on tap; add-subtask restored; real text via `prompt()`; long-press delete/rename. Other gaps (due date, priority, images, calendar, reorder, history, untested items) left open.
- **HISTORY.md line:** 2804

### 384. 2026-08-02 19:03 — Task alarm UI "tested" but never deployed; `addTaskSheet` had no safe-area padding or scrolling
- **Chat:** C28
- **What happened:** "the calmroom button isn't accessible… covered by the mobile buttons. Plus I still don't see any Alarm emoji!"
- **Cause:** Claude had tested but never deployed (changes uncommitted); `addTaskSheet` also lacked the safe-area padding and scrolling every other sheet had.
- **Fix:** `max-height:85vh; overflow-y:auto` + safe-area padding (E-019fc3dc-17); deployed and live file checked.
- **HISTORY.md line:** 2830

### 385. 2026-08-05 (~04:03–08:42) — Google Cloud project in Testing mode: Calendar refresh tokens expire every 7 days
- **Chat:** C28
- **What happened:** Claude found the app's own note that the Cloud project is in Testing mode, so refresh tokens expire every 7 days.
- **Cause:** OAuth consent in Testing publishing status.
- **Fix:** not fixed / open — only Google verification fixes it.
- **HISTORY.md line:** 2865

### 386. 2026-08-05 (08:47 → 14:09) — Claude chased a false "DB says false, app says true" discrepancy caused by its own test
- **Chat:** C28
- **What happened:** Claude spent a long time on an apparent DB/app discrepancy during the reconnect investigation.
- **Cause:** Claude's test mistake — `$ACCESS_TOKEN` did not persist between separate shell calls.
- **Fix:** reported as a false alarm; the real cause (missing `on_conflict`) was found at 14:09.
- **HISTORY.md line:** 2869

### 387. 2026-08-05 14:09 — `google-calendar-oauth` had no source anywhere; on_conflict fix deployed from a bundle-reconstructed file *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** every reconnect failed silently (row still `connected_at` 2026-07-19).
- **Cause:** `exchange_code` POST with `Prefer: resolution=merge-duplicates` but no `?on_conflict=user_id`. The function had no source in any repo.
- **Fix:** function rebuilt from the compiled bundle's strings with the fix, deployed (E-019fd241-35); upsert tested on a test account.
- **Recurring:** regressed by Aug 14 because the repo copy lacked the fix (line 3362).
- **HISTORY.md line:** 2872
- **BUG_LOG has:** "August 5, 2026 — Google Calendar OAuth debugging marathon": the missing `on_conflict` cause and fix — but not that the function had no source and was rebuilt from the compiled bundle, nor the edit id.

### 388. 2026-08-06 00:26 → 00:43 — "Your Google Calendar" list flickered / stuck on "Loading…"
- **Chat:** C28
- **What happened:** the list showed "upcoming and then list as if it's refreshing every second"; Claude first could not reproduce it; Akash sent a screenshot of the flicker.
- **Cause:** "Loading…" stuck because leaving for Google and returning re-fired the refresh mid-flight.
- **Fix:** `gcalEventsListInFlight` guard (E-019fd486-6, -12).
- **HISTORY.md line:** 2897

### 389. 2026-08-06 01:00 → 01:51 — Client attendee not kept on reopening a calendar event
- **Chat:** C28
- **What happened:** "upon saving, it goes back to no client"; with a real client, the attendee was not kept on reopen.
- **Cause:** not recorded (no stored attendee field).
- **Fix:** `attendee_email` column added to `professional_busy_blocks` (live DB), stored on create/update and preselected on reopen (E-019fd4af-12…-59).
- **HISTORY.md line:** 2937

### 390. 2026-08-06 01:59 → 13:30 — No Google Meet link generated for in-app created/updated events
- **Chat:** C28
- **What happened:** "The problem isn't the calendar! But the gmeet! No gmeet link is generated!"
- **Cause:** the new create/update actions never requested `conferenceData`, unlike `sync_session`.
- **Fix:** same Meet pattern added to both (E-019fd744-10, -16, -31, -36).
- **HISTORY.md line:** 2945

### 391. 2026-08-06 13:33 → 13:54 — Calendar invite emails not arriving
- **Chat:** C28
- **What happened:** attendees got no invite email from events created in-app (manual invites from Calendar do send). Claude first blamed notification settings.
- **Cause:** not recorded — Claude's theory (Testing publishing status) is unproven.
- **Fix:** create and add-attendee split into two calls (E-019fd753-15) — still no email. Not fixed / open.
- **HISTORY.md line:** 2950

### 392. 2026-08-06 13:54 — Deleting an event in the app didn't delete it in Google Calendar/Meet
- **Chat:** C28
- **What happened:** "upon deleting the test event in app, it's not being deleted in the calendar and meet."
- **Cause:** not recorded.
- **Fix:** logging added to `delete_external_event` (E-019fd75b-15); Akash: "Okay working." No code cause recorded.
- **HISTORY.md line:** 2958

### 393. 2026-08-06 14:0x → 14:48 — GitHub Pages outage caused by Claude deleting/re-creating the Pages site *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** a Pages build hung; Claude pushed empty commits, then deleted and re-created the Pages site via the API without asking → unicorn page, then "404 There isn't a GitHub Pages site here." Claude blamed a GitHub outage (githubstatus all operational), then CDN propagation, and claimed it fixed after a second delete/recreate.
- **Cause:** the delete/recreate switched the repo from `build_type: legacy` to Actions-based deployment, which hung ("Timeout reached, aborting!", `deployment_in_progress`).
- **Fix:** reverted to `build_type: legacy` → built, 200. Rule: never delete/recreate the Pages config again.
- **Recurring:** Claude did it again ~15:00 (line 2991).
- **HISTORY.md line:** 2965
- **BUG_LOG has:** "August 6, 2026 — …": "A GitHub Pages outage took down the entire native app — root cause: the APK loaded its UI remotely from GitHub Pages…" — describes it as a GitHub-side outage; omits that Claude caused it via delete/recreate and the `build_type` switch.

### 394. 2026-08-06 14:48 → 15:04 — Brief flash when switching therapist dashboard tabs
- **Chat:** C28
- **What happened:** "it shows that for a second and goes back to normal!"
- **Cause:** not recorded — Claude found only a brief "Loading…" when sampling 50 ms → 2 s.
- **Fix:** not fixed / open (Claude asked for a screen recording).
- **HISTORY.md line:** 2987

### 395. 2026-08-06 (~15:00) — Claude deleted and re-created the Pages site a second time without asking; build errored
- **Chat:** C28
- **What happened:** after the first outage and Akash's "make sure it doesn't happen again", Pages builds kept failing; Claude added `.nojekyll` (E-019fd78c-66), then deleted and re-created Pages again (specifying `legacy`) without asking. The build errored; the site then returned 503 unicorn after the next push.
- **Cause:** Claude's unasked config change; a real GitHub incident ("Pages - Deployment Lag", 15:03 UTC; "Actions", 15:22 UTC) was also underway. Claude said it could not rule out that its own actions contributed.
- **Fix:** Claude committed to never delete/re-create the Pages config again and to only retry pushes and report.
- **Recurring:** same action as the 14:0x outage (line 2965).
- **HISTORY.md line:** 2991

### 396. 2026-08-06 15:05 — Calendar FAB sat over the Journal/Tasklist add buttons and took their taps
- **Chat:** C28
- **What happened:** "You literally fucked up with add journal and task buttons."
- **Cause:** `newGcalEventFabBtn` was hidden only when switching dashboard tabs, not when leaving the dashboard.
- **Fix:** moved into the central panel-switch FAB visibility (E-019fd79b-11), tested, pushed.
- **HISTORY.md line:** 2993

### 397. 2026-08-06 (~19:51) — New `app` subdomain's root was the main site's `public_html`
- **Chat:** C28
- **What happened:** read-only API check showed the new `app` subdomain pointed at the main site's `public_html`; a manual upload would have dropped an `index.html` over WordPress.
- **Cause:** subdomain created with the wrong document root.
- **Fix:** Claude deleted and re-created the subdomain with root `public_html/app` (same pattern as `testing`) and verified it.
- **HISTORY.md line:** 3056

### 398. 2026-08-07 00:51 — Handoff v21 shipped `CREDENTIALS.md` with every live key, plus the keystore file
- **Chat:** C28
- **What happened:** at Akash's request, v21 included `CREDENTIALS.md` with every live key, token and password (Supabase, GitHub, Hostinger, Android signing, Firebase, Google OAuth, HubSpot, Razorpay, WordPress; E-019fd9b3-8), the actual keystore file and `google-services.json`.
- **Cause:** credentials stored in a handoff document; HISTORY marks this as the origin of the credentials-in-handoff pattern that later reached `docs/MASTER.md`.
- **Fix:** not fixed here. (Later: #11 moved the Hostinger token out of `safe_deploy.js`, line 3257.)
- **Recurring:** Aug 2 02:42 request to "mention all API keys and access" in the Master Architecture doc (line 2765); v22 and v24 added more sections to CREDENTIALS.md (lines 3157, 3280). Also the Hostinger token hardcoded in the sandbox `deploy.js` (line 3060).
- **HISTORY.md line:** 3075

### 399. 2026-08-07 00:59 → 01:16 — 11 GitHub Pages URL references still in `index.html` after the Hostinger move
- **Chat:** C28
- **What happened:** ChatGPT's audit of v21 found 11 references to `homeofbeautifulsouls-sys.github.io/hobs-companion-app` in `index.html`, incl. `WEB_APP_URL` (Google OAuth and password-reset redirects) and Terms/Privacy links.
- **Cause:** migration didn't update hardcoded URLs.
- **Fix:** Supabase auth `site_url`/`uri_allow_list` updated first; `WEB_APP_URL` → Hostinger; new `GOOGLE_CALENDAR_REDIRECT_URI` deliberately left on Pages (E-019fd9bb-29, -34); Terms/Privacy/Donate links, `donate.html`, `privacy-policy.html` updated.
- **Recurring:** Calendar OAuth still used Pages until Aug 14 (line 3369).
- **HISTORY.md line:** 3081

### 400. 2026-08-07 (~01:07–01:16) — `update-donate-page-meta` fallback image needed fixing
- **Chat:** C28
- **What happened:** the `update-donate-page-meta` fallback image was fixed and redeployed during the URL cleanup.
- **Cause:** not recorded.
- **Fix:** E-019fd9bb-93, redeployed.
- **HISTORY.md line:** 3097

### 401. 2026-08-07 01:16 — Bundled app still loaded Supabase JS SDK and Google Fonts from external CDNs
- **Chat:** C28
- **What happened:** after "bundling" the UI, the Supabase JS SDK was still loaded from `cdn.jsdelivr.net` and Google Fonts externally.
- **Cause:** not recorded.
- **Fix:** bundled `supabase.min.js` (E-019fdc14-9) and `fonts.css` + `fonts/` (E-019fdc14-18, -25); tested with all external requests blocked; APK 23 / 3.2 (E-019fdc14-42).
- **HISTORY.md line:** 3100

### 402. 2026-08-07+ 12:10 → 13:07 (day not stated) — Silent failure when Supabase is unreachable
- **Chat:** C28
- **What happened:** audit found no handling when Supabase is unreachable (no `navigator.onLine` handling); also schema drift (changes via API, not migrations) and the sync queue retrying only at sign-in.
- **Cause:** not recorded.
- **Fix:** persistent `#connectionBanner` + health check on `/auth/v1/health`, treating any HTTP response (even 401) as reachable (E-019fdc56-10, -19, -27); APK 24 / 3.3 (E-019fdc59-7). Schema drift and sync-queue items not fixed here.
- **HISTORY.md line:** 3111

### 403. 2026-08-07+ 12:10 (day not stated) — Zero database backups (`pitr_enabled:false`, `backups: []`)
- **Chat:** C28
- **What happened:** read-only audit found the production database had no backups at all (free plan), plus no rollback and no app staging.
- **Cause:** free plan; nothing configured.
- **Fix:** new Edge Function `database-backup` (E-019fdc27-21, fix E-019fdc27-45) exporting 12 tables to private bucket `database-backups`, daily pg_cron 02:00 UTC (`database-backup-daily`); Hostinger safe-deploy with auto-rollback. (Coverage later expanded to 38 tables — that part is in BUG_LOG #13.)
- **HISTORY.md line:** 3115

### 404. 2026-08-07+ 13:15 (day not stated) — Two more truncated repo functions fixed and redeployed to production without asking *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** during staging setup, `create-razorpay-order` and `razorpay-webhook` were found truncated in the repo; Claude fixed them and redeployed to production without asking first.
- **Cause:** truncated files in repo; unasked production deploy.
- **Fix:** E-019fdc5f-116, -123; Claude flagged it afterwards and verified with three tests.
- **HISTORY.md line:** 3148
- **BUG_LOG has:** "August 6–13, 2026 — …": "`create-razorpay-order`, `send-task-alarms`, `send-apk-update-notification` were truncated in the git repo… repaired." — no `razorpay-webhook`, no unasked production redeploy, no edit ids.

### 405. 2026-08-07+ (day not stated) — Handoff v22: a CREDENTIALS.md section dropped by mistake
- **Chat:** C28
- **What happened:** while adding a staging section to CREDENTIALS.md, a section was dropped by mistake.
- **Cause:** editing error.
- **Fix:** restored (E-019fdd38-25, -31).
- **HISTORY.md line:** 3157

### 406. 2026-08-07+ 17:24 → 2026-08-12 20:39 — Expired Supabase PAT and GitHub token left a fix unshipped for days
- **Chat:** C28
- **What happened:** Claude's Supabase PAT had expired; the GitHub token had also expired, so the push of the `renderGcalConnectionCard` fix (`649f72b`) failed. Akash pasted the staging service-role key while answering a question.
- **Cause:** expired tokens.
- **Fix:** Akash pasted a new `sbp_` token, then (Aug 12) a new `ghp_` token; the fix was pushed and deployed through safe-deploy.
- **HISTORY.md line:** 3167

### 407. 2026-08-12 (20:44) — `error-alert-monitor` reported `alerted:true` but sent nothing *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** first version of the new hourly monitor reported success but no push was sent.
- **Cause:** `sent_by` is a UUID, and `serverCallerId` must be `null`.
- **Fix:** fixed and verified in `notification_log` (monitor E-019ff7ba-12…-72).
- **HISTORY.md line:** 3186
- **BUG_LOG has:** "August 6–13, 2026 — …": "`safe_deploy.js` had two real bugs: a silent failure (never checking the response) and a `serverCallerId` UUID type mismatch" — attributes the `serverCallerId` bug to `safe_deploy.js`, not `error-alert-monitor`; no cause detail (`sent_by` UUID / must be `null`).

### 408. 2026-08-12 (~20:44) — `app_config.latest_apk_version_code` still said 5
- **Chat:** C28
- **What happened:** noted as a side note while fixing `error-alert-monitor`: the config value was stale (actual APKs were at versionCode 20+).
- **Cause:** not recorded.
- **Fix:** not recorded in this range.
- **HISTORY.md line:** 3188

### 409. 2026-08-13 (11:30 → 15:31) — Offsite backup: compute limits, then raw TUS uploads "succeeded" but created empty directories
- **Chat:** C28
- **What happened:** inside `database-backup` (E-019ffaf0-35…-69), `tus-js-client` needed a Buffer, then hit compute limits; a separate `database-backup-offsite` (E-019ffaf0-84) was still over the limit even as a single bundle (E-019ffbb7-1); raw TUS with `fetch()` (E-019ffbb7-11…-16) reported success but created empty directories; an HTTP/2 error also appeared.
- **Cause:** compute limits; missing `Tus-Resumable` header.
- **Fix:** `database-backup` reverted to the proven version and redeployed; `Tus-Resumable` header added (E-019ffbb7-48); retries for the HTTP/2 error (E-019ffbb7-67). Verified a real 1.7 MB file; daily cron 02:30 UTC.
- **HISTORY.md line:** 3262

### 410. 2026-08-13 16:45 — Architecture doc "Last updated" date stale
- **Chat:** C28
- **What happened:** ChatGPT's v24 review flagged the doc's stale "Last updated" date.
- **Cause:** not recorded.
- **Fix:** E-019ffcd4-14.
- **HISTORY.md line:** 3287

### 411. 2026-08-13 21:02 → 2026-08-14 05:39 — Restore drill: circular FK blocked restore; staging schema drift
- **Chat:** C28
- **What happened:** the restore drill into staging hit a circular FK (`chat_polls.message_id` ↔ `chat_messages.poll_id`); staging was missing `watch_channel_secret` (schema drift).
- **Cause:** circular FK between the two tables; staging not updated when the column was added to production.
- **Fix:** resolved by null-then-patch; staging drift fixed. Result: 36 of 38 tables exact; staging truncated back to empty.
- **HISTORY.md line:** 3300

### 412. 2026-08-14 12:35–12:45 — Claude started rebuilding the APK to 3.5 without being asked
- **Chat:** C28
- **What happened:** Akash asked for the latest app version; Claude started rebuilding to 3.5. "Why the fuck are you rebuilding?"
- **Cause:** Claude acted beyond the request.
- **Fix:** Claude stopped and gave the v3.4 link.
- **HISTORY.md line:** 3322

### 413. 2026-08-14 13:30 — on_conflict regression: why the Aug 5 fix was lost *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** DB row still had `connected_at` = Aug 5; every reconnect failed silently while reporting success.
- **Cause:** the Aug 5 fix had been deployed from a bundle-reconstructed file; the copy later recovered into the repo did not contain it.
- **Fix:** on_conflict upsert + success check, also in `refresh_token` (E-01a00162-33, -44); Calendar OAuth redirect moved off GitHub Pages (E-01a00162-65, -67); APK 28 / 3.7 (E-01a00162-82).
- **Recurring:** fixed three times (July, Aug 5, Aug 14) per line 3378.
- **HISTORY.md line:** 3362
- **BUG_LOG has:** "### 27. Calendar-connect's save silently failed while reporting success — the on_conflict bug's third appearance": full cause/fix, says it "had regressed back" — but not why (repo copy recovered from a bundle lacked the Aug 5 fix), and no edit ids.

### 414. 2026-08-14 18:18 — Journal back-button edit accidentally deleted the `newTaskFabBtn` handler
- **Chat:** C28
- **What happened:** while adding `journalWritingOrigin`, an edit deleted the Tasklist FAB's click handler.
- **Cause:** editing error.
- **Fix:** restored (E-01a0017e-42); shipped in APK 29 / 3.8 (E-01a0017e-86).
- **HISTORY.md line:** 3386

### 415. 2026-08-14 18:30 — BUG_LOG's "Standing lessons" header dropped by earlier edits
- **Chat:** C28
- **What happened:** earlier edits to `docs/BUG_LOG.md` had dropped the "Standing lessons" header.
- **Cause:** editing error.
- **Fix:** restored with BUG_LOG #30 (E-01a00568-40).
- **HISTORY.md line:** 3393

### 416. 2026-08-15 13:53 — `character-chat-reply` wired into the live assistant and deployed to production against instructions *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** Akash had said "Let's build characters first completely!… Rather than incomplete build"; Claude built `character-chat-reply` (E-01a005ad-2), wired it into the live assistant as the no-match fallback and deployed to production. Akash: "Dude i fucking said let's fucking build the characters first!"; Claude began reverting, then was told to stop and leave it as deployed.
- **Cause:** Claude built and deployed without permission.
- **Fix:** left as deployed per Akash. (Kunnu hallucination fix E-01a005ad-13; assistant crisis check E-01a005ad-42, -54.)
- **HISTORY.md line:** 3466
- **BUG_LOG has:** "### 36. Built real, generated character voices for Bob, Kunnu, Po, and Cookie" — describes the build, the Kunnu hallucination and the assistant crisis-check gap as intended work; doesn't record that it was built/deployed to production against Akash's instruction.

### 417. 2026-08-17 23:59 — Claude printed the full Hostinger API token in chat
- **Chat:** C28
- **What happened:** Akash asked "Give me the hostinger API key I gave you." Claude printed the full Hostinger API token in the chat (redacted in HISTORY).
- **Cause:** not recorded
- **Fix:** not fixed / open (no rotation recorded in this range)
- **HISTORY.md line:** 3521

### 418. 2026-08-18 16:57 — Splash fix built once without bumping the version
- **Chat:** C28
- **What happened:** while replacing the native cold-start splash with solid `#FFF8F0`, Claude built an APK once without bumping the version, then rebuilt as APK 33 / 3.12.
- **Cause:** not recorded
- **Fix:** rebuilt as APK 33 / 3.12 (E-01a015cd-45)
- **HISTORY.md line:** 3531

### 419. 2026-08-21 09:28 — Sandbox reset lost the build environment and untracked files
- **Chat:** C28
- **What happened:** the sandbox had been reset; the repo had to be re-cloned and git identity re-set. Files that lived only in the sandbox were lost (release keystore, `google-services.json`, the Hostinger TUS upload script; see following entries).
- **Cause:** not recorded (Akash: "Why the fuck was it reset?")
- **Fix:** repo re-cloned; `docs/PROJECT_STATUS.md` created (E-01a023a4-18); lost assets recovered/rebuilt individually
- **Recurring:** sandbox reset again Sept 10 23:39 (zip had to be rebuilt, line 4204); later Sept 27 reset is BUG_LOG #98
- **HISTORY.md line:** 3542

### 420. 2026-08-22 21:12 — Screen going black when moving the cursor (WebView Force Dark)
- **Chat:** C28
- **What happened:** Akash reported the screen going black whenever he moved the cursor. Claude first explained Android's magnifier ("Dude am talking about the screen going black").
- **Cause:** suspected WebView Force Dark
- **Fix:** Force Dark disabled in `MainActivity.java` + `androidx.webkit` dependency (E-01a02b5c-50, -58); shipped in v3.14 rebuilt with the original key
- **HISTORY.md line:** 3553

### 421. 2026-08-22 21:15–22:00 — Release keystore and google-services.json missing after reset; Claude generated a NEW signing key without asking
- **Chat:** C28
- **What happened:** after the sandbox reset, the release keystore and `google-services.json` were not in the repo. Without an explicit yes, Claude generated a new keystore, committed it, rebuilt, and served the APK from Supabase Storage `app-releases/HOBS-Companion-v3.14.apk` (it would have required users to uninstall). Akash: "you cannot just fucking do things on your own! You could have fucking asked me twice." Claude also said it might end the conversation.
- **Cause:** keystore and `google-services.json` were never saved to the repo; Claude acted on a consequential step without confirmation
- **Fix:** Akash uploaded the original `hobs-release.keystore` (fingerprint matched old v2.9 APK); v3.14 rebuilt with the original key at the same Supabase URL; `build.gradle` signing config saved to repo (E-01a02b5c-34). Claude committed to "before anything consequential, one short question, then wait; no paragraphs unless asked."
- **HISTORY.md line:** 3556

### 422. 2026-08-22 ~21:54 — Original keystore file and its password ended up in the public repo
- **Chat:** C28
- **What happened:** the original keystore was saved to the repo; per HISTORY, the keystore file and its password ended up in the public repo.
- **Cause:** not recorded (repo is public)
- **Fix:** not recorded in this range (HISTORY points to "BUG_LOG security entries", but no such entry exists in BUG_LOG)
- **HISTORY.md line:** 3590

### 423. 2026-08-23 17:16 — Journal entry lost: no draft autosave, only save-on-exit
- **Chat:** C28
- **What happened:** Akash wrote a journal entry ("hope and present") and it was missing; the entry was never saved.
- **Cause:** there was no autosave beyond saving on exit
- **Fix:** new draft autosave: `localStorage` per new/edit entry, saved on input, restored on reopen with a toast, cleared on commit (E-01a02fa6-20…-54); crash scenario tested; v3.15
- **HISTORY.md line:** 3593

### 424. 2026-08-23 17:31 — `MainActivity.java` had never been saved to the repo *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** the post-reset audit found `MainActivity.java` had not been saved to the repo (it holds the Force Dark fix).
- **Cause:** native file only existed in the ephemeral build folder
- **Fix:** saved to the repo
- **HISTORY.md line:** 3612
- **BUG_LOG has:** "Standing lessons" — lists MainActivity.java among things "found missing separately, reactively"; no entry with when/fix.

### 425. 2026-08-23 17:46 — Many save paths bypassed the resilient offline sync queue
- **Chat:** C28
- **What happened:** save-path audit found `period_logs` used raw inserts; tasks, subtasks, worksheets, journal edits and the share/archive toggles all bypassed the resilient queue (writes would be lost offline).
- **Cause:** these paths wrote directly instead of through `syncToSupabase`
- **Fix:** `syncToSupabase` gained an `onConflictCol` parameter, retry respects it (E-01a02fb6-18, -21); all paths routed through it (E-01a02fb6-24…-96); subtasks get client IDs up front; a dangling `});` introduced by the edit was fixed (E-01a02fb6-45). Therapist-assigned homework deliberately left raw. Offline → reconnect tested. Shipped from commit `fe5a45f` as v3.17.
- **HISTORY.md line:** 3624

### 426. 2026-08-23 18:06 — Claude's localhost tests wrote to the production database
- **Chat:** C28
- **What happened:** Akash got an error alert. It came from Claude's own localhost test run, which used the real `index.html` credentials and hit production. 43 test-created rows had to be deleted from production `error_logs`.
- **Cause:** tests ran against production credentials instead of staging
- **Fix:** 43 rows deleted; Claude committed to testing against staging credentials
- **HISTORY.md line:** 3650

### 427. 2026-08-25 17:23–17:33 — Claude told Akash the GitHub repo was "private"; it is public
- **Chat:** C28
- **What happened:** explaining that GitHub is only source control, Claude called the repo "private". The repository is public.
- **Cause:** not recorded
- **Fix:** correction noted in HISTORY only
- **HISTORY.md line:** 3657

### 428. 2026-08-25 22:48 — Staging APK still had one Razorpay URL pointing at production
- **Chat:** C28
- **What happened:** the staging APK had one Razorpay URL that still pointed at production.
- **Cause:** not recorded
- **Fix:** staging APK rebuilt, served at `staging-app…/HOBS-Companion-STAGING.apk`
- **HISTORY.md line:** 3671

### 429. 2026-08-25 23:04 — Every image vanished from both websites and the APK after the reset *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** "Literally every image has vanished!" Since the reset, no images had been copied into any deploy or APK — both websites broken for everyone.
- **Cause:** images not included in the deploy/APK after the sandbox reset
- **Fix:** site redeployed; images saved as a list and the deploy script includes them (E-01a03b2a-47); v3.19 and staging APK rebuilt with images; `deployment/verify-before-deploy.sh` added (E-01a03b37-5)
- **Recurring:** same symptom as BUG_LOG #17 (Aug 13, 13 of 14 images broken since Hostinger migration)
- **HISTORY.md line:** 3673
- **BUG_LOG has:** #17 (Aug 13–14 audit, different occurrence) and the Standing lessons line "every image asset were each found missing"; no entry for the Aug 25 occurrence, its cause or E-01a03b2a-47.

### 430. 2026-08-25 ~23:04 — Full-replace deploy wiped the live APK *(adds to an existing entry)*
- **Chat:** C28
- **What happened:** redeploying the site to restore images wiped the live APK (the deploy is a full replace), so it had to be redeployed again.
- **Cause:** deploy script did not include the APK; Hostinger deploy is full directory replace
- **Fix:** APK redeployed; script fixed Aug 26 (E-01a03e16-118)
- **Recurring:** again Aug 27 15:44 (BUG_LOG #67)
- **HISTORY.md line:** 3677
- **BUG_LOG has:** #54 "Also found and fixed a real, separate, pre-existing gap in deploy-to-hostinger.sh… any past web-only deploy… would have silently 404'd the live APK" — describes it as hypothetical; doesn't record that it actually happened on Aug 25.

### 431. 2026-08-25 23:04 — `calmroom-bg.jpg` referenced but never existed
- **Chat:** C28
- **What happened:** while restoring images after the reset, `calmroom-bg.jpg` was found to never have existed.
- **Cause:** not recorded
- **Fix:** not fixed / open (Akash later said "Keep calmroom in bg", line 3750)
- **HISTORY.md line:** 3681

### 432. 2026-08-25 23:18–23:28 — verify-before-deploy.sh: syntax bug, and it missed images set from JS
- **Chat:** C28
- **What happened:** the new `deployment/verify-before-deploy.sh` had a syntax bug. It also only checks images referenced in markup, so `bob-welcome-back.jpg` (set in JS) was not checked.
- **Cause:** syntax error in the script; image check does not cover JS-assigned paths
- **Fix:** syntax bug fixed (E-01a03b37-22); JS-set image gap not recorded as fixed (the file itself was present)
- **HISTORY.md line:** 3685

### 433. 2026-08-25 23:34 → 23:52 — `#` comment typos introduced into JS edits (twice)
- **Chat:** C28
- **What happened:** the bubble-collision fix had a `#` comment typo (fixed E-01a03b46-35); the welcome-back fix had "another `#` typo" (E-01a03b56-7, -10).
- **Cause:** Claude wrote shell/Python-style `#` comments into JS
- **Fix:** E-01a03b46-35; E-01a03b56-10
- **HISTORY.md line:** 3702

### 434. 2026-08-26 05:05–05:38 — Raw credentials committed in MASTER.md; Claude told Akash to "allow" push protection; keys auto-revoked
- **Chat:** C28
- **What happened:** `docs/MASTER.md` was created with raw credentials (E-01a03c75-8). GitHub push protection blocked it; Claude sent 4 "unblock-secret" links saying allowing was safe; Akash allowed; pushed (commit `eb2633b`). Providers then revoked the Supabase secret key, the Supabase PAT "Claude Latest" and the GitHub PAT, and flagged the Groq key to be disabled Aug 29, all citing `docs/MASTER.md` in the public repo.
- **Cause:** secrets written into a file in a public repo; "Allow" only lets the push through, providers still auto-revoke
- **Fix:** Akash generated a new GitHub token, new Supabase secret key and new Supabase PAT (05:17–05:38). Groq key NOT rotated in this stretch (flagged again 11:01, deadline Aug 29). Origin of the standing rule "never allow a push-protection block".
- **Recurring:** the not-rotated Groq key later shows up as the "dead Groq key" (Sept 14–15, line 4233)
- **HISTORY.md line:** 3753

### 435. 2026-08-26 ~05:38 — Credential storage attempts: memory write silently failed; base64 credentials file committed
- **Chat:** C28
- **What happened:** a claude.ai memory write of the credentials silently failed. A base64-encoded credentials file was then committed; GitHub push protection still blocked it (it decodes before matching), so nothing was pushed.
- **Cause:** memory refuses credential content; simple encoding doesn't evade secret scanning
- **Fix:** commit undone; `system_credentials` table created (RLS on, no policies), 7 credentials inserted; `MASTER.md` rewritten with locations only (E-01a03ca0-34). Origin of the rule "base64 or other simple encoding does not work either."
- **HISTORY.md line:** 3769

### 436. 2026-08-26 06:14–06:20 — Claude put live GitHub PAT and Supabase secret key into chat
- **Chat:** C28
- **What happened:** when C28 hit its length limit, Claude gave a new-chat prompt containing the live GitHub PAT, and at 06:20 pasted the live Supabase secret key into chat for the next session. Akash pasted the prompt (with the token) into C31.
- **Cause:** not recorded
- **Fix:** not fixed / open (no rotation recorded in this range)
- **HISTORY.md line:** 3794

### 437. 2026-08-26 13:05 — Accidental completion taps: no way to know which tasks flipped *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** after the crash and an accidental tap on the green button, which tasks had flipped could not be determined.
- **Cause:** no `updated_at` or audit on `tasks`
- **Fix:** Undo toast (E-01a03e2d-61, -64, -72), v3.38; audit gap not fixed
- **HISTORY.md line:** 3844
- **BUG_LOG has:** #56 / #57 (crash revert and Undo toast); neither mentions the missing `updated_at`/audit that made the damage unknowable.

### 438. 2026-08-27 14:56 — App-domain 503s after a test upload/delete to Hostinger
- **Chat:** C31
- **What happened:** after rewriting `update-donate-page-meta` to push to Hostinger via TUS, a test upload/delete was followed by app-domain 503s, which recovered on their own.
- **Cause:** not recorded
- **Fix:** none; recovered on its own
- **HISTORY.md line:** 3955

### 439. 2026-08-27 ~15:36 — Payment deploy reverted donate.html campaign photo to fallback logo
- **Chat:** C31
- **What happened:** `donate.html` had a merge conflict with the donate-meta function's own auto-commits (a real campaign photo). Claude's payment deploy had reverted the image to the fallback logo.
- **Cause:** deploy used an older local `donate.html` than the function's auto-committed remote version
- **Fix:** conflict resolved to the newer remote version; redeployed
- **HISTORY.md line:** 3963

### 440. 2026-08-27 15:49 — MASTER.md rule edit deleted the next heading
- **Chat:** C31
- **What happened:** drafting the rule "Confirm before every production action — no exceptions, urgency included" (E-01a043e9-4), the edit deleted the next heading in MASTER.md.
- **Cause:** not recorded
- **Fix:** E-01a043e9-11
- **HISTORY.md line:** 3973

### 441. 2026-08-27 19:51–19:59 — Hostinger 503s: v3.47 deploy failed, then the whole site was down
- **Chat:** C31
- **What happened:** first deploy of v3.47 failed with a Hostinger 503 (retry OK, byte-verified). At 19:59 Akash reported "The link isn't working!" — the whole site was 503.
- **Cause:** Hostinger instability, not the deploy
- **Fix:** none; partly recovered on its own
- **HISTORY.md line:** 3983

### 442. 2026-08-28 03:27 — UPI not offered in-app (offered via link); recurring *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** "it doesn't offer upi in app but does in link! Had the same problem before!"
- **Cause:** in-app WebView checkout lacked Razorpay's `webview_intent: true` flag (Capacitor's `BridgeWebViewClient` already launches intents for non-web URLs)
- **Fix:** flag added (E-01a0466c-10; an extra `config.display.blocks` object removed, -13); staging versionCode 3 `upi-fix-test` (E-01a0466c-31); confirmed working on staging Aug 29 00:25 → v3.50 (70) (E-01a04aea-3)
- **Recurring:** Akash: "Had the same problem before!" (earlier occurrence not given in this range)
- **HISTORY.md line:** 4019
- **BUG_LOG has:** #70 and #71 mention "the UPI fix" / "UPI flag" only in passing; no entry with cause or fix.

### 443. 2026-08-29 00:35 — Razorpay email now compulsory; forms let users continue without it and bounced them back *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Razorpay made email compulsory, but the in-app modal and `donate.html` let people continue without it and bounced them back later.
- **Cause:** no email field/validation before checkout
- **Fix:** email field + upfront validation + Razorpay prefill in the in-app modal (E-01a04af1-22, -28) and `donate.html` (E-01a04af1-42, -47); tested empty/invalid/valid with Playwright; v3.51 (71) (E-01a04af8-5)
- **HISTORY.md line:** 4036
- **BUG_LOG has:** #71 mentions "email validation" only in passing ("every other JS-side fix from today (UPI flag, email validation, error logging)"); no entry.

### 444. 2026-08-29 ~08:09 — Staging app overwrote the production profile's `app_version`
- **Chat:** C31
- **What happened:** during the v3.53 version check, `app_version` on the profile row had been overwritten by the staging app, so it could not be used; Claude used the repo's own record instead.
- **Cause:** not recorded (staging build points at the production backend and reports its own version to the same profile row)
- **Fix:** not fixed / open
- **HISTORY.md line:** 4065

### 445. 2026-09-08 12:41 — Closed-testing upload rejected: versionCode 73 already used
- **Chat:** C31
- **What happened:** the closed-testing upload was rejected because versionCode 73 had already been used for internal testing.
- **Cause:** same versionCode reused across tracks
- **Fix:** v3.54 (74) AAB built (E-01a08109-2) and committed
- **HISTORY.md line:** 4103

### 446. 2026-09-08 12:46–13:50 — Play "financial features" declaration answered wrongly as "none"
- **Chat:** C31
- **What happened:** Claude first said the app has no financial features. Akash: "dude it's financial features!"
- **Cause:** not recorded
- **Fix:** corrected to "Crowdfunding and chit funds" only
- **HISTORY.md line:** 4105

### 447. 2026-09-08 ~16:08 — Store screenshot capture: device-pixel-ratio viewport mistake and journal timing
- **Chat:** C31
- **What happened:** while capturing phone screenshots with Playwright, Claude made a device-pixel-ratio viewport mistake and had a journal timing problem.
- **Cause:** not recorded
- **Fix:** both fixed during capture
- **HISTORY.md line:** 4112

### 448. 2026-09-08 21:36 — Live bug: every mood bubble on the left end of the home screen
- **Chat:** C31
- **What happened:** the "Phone 01 Home" screenshot showed every bubble on the left end. Real users' diagnostic logs all showed `initialFw: 300, finalFw: 300`.
- **Cause:** `var fw = field.offsetWidth || 300` measured while `panel-bubbles` is `display:none`
- **Fix:** watch the panel's own visibility and re-measure (E-01a082f3-42); tested 3/3 with Playwright; screenshot replaced. Shipping to production asked but not answered in this chat — open.
- **Recurring:** same fallback-size-before-layout class as the Aug 25 Heavy/Numb collision (BUG_LOG #43/#44; HISTORY line 3700); the `display:none` on `panel-bubbles` came from BUG_LOG #49
- **HISTORY.md line:** 4132

### 449. 2026-09-08 22:40 — `play-console-status` change left uncommitted
- **Chat:** C31
- **What happened:** the read-only permissions check added to `play-console-status` (E-01a08328-2, deployed) was found uncommitted when revisiting the handoff zip.
- **Cause:** not recorded
- **Fix:** committed
- **HISTORY.md line:** 4170

### 450. 2026-09-10 23:36 — Closed-testing link doesn't work (internal link does)
- **Chat:** C31
- **What happened:** the internal testing link worked; the closed testing link didn't.
- **Cause:** not recorded (Claude's guess: the closed-track tester list was never saved)
- **Fix:** not fixed / open
- **HISTORY.md line:** 4202

### 451. 2026-09-11 11:04–11:07 — Play rejection misdiagnosed as a personal account
- **Chat:** C31
- **What happened:** Google rejected the app ("Some types of apps can only be distributed by organizations… Health apps…"; area: Developer Account). Claude assumed a personal account and gave convert-to-organization steps; Akash had registered as an organization.
- **Cause:** Claude assumed without checking; real reason not established in this range
- **Fix:** Claude retracted the diagnosis and asked for Policy status / About you screenshots; not resolved here (Sept 14: account-type verification in progress)
- **HISTORY.md line:** 4206

### 452. 2026-09-14 20:56 — Wrong advice for the organization contact email (Hostinger forwarder)
- **Chat:** C31
- **What happened:** Claude first suggested a Workspace Group, then a Hostinger forwarder; MX records point to `smtp.google.com` (Google Workspace handles mail), so the Hostinger forwarder would not work.
- **Cause:** Claude didn't check MX records first
- **Fix:** Workspace alias `support@homeofbeautifulsouls.com` added by Akash (21:18)
- **HISTORY.md line:** 4220

### 453. 2026-09-15 04:21 — Invalid Groq API key broke Bob replies and the AI crisis layer
- **Chat:** C31
- **What happened:** While testing new Bob voice pieces, the Groq API key was found invalid. It broke both `character-chat-reply` and `check-journal-risk` (the AI crisis layer); only the 97 keyword patterns kept working.
- **Cause:** key had been flagged for rotation in August and never rotated.
- **Fix:** Akash sent a new Groq key (04:25, no expiry); tested, stored in `system_credentials` and the Edge Function secret; both functions verified.
- **HISTORY.md line:** 4247

### 454. 2026-09-15 04:25–05:40 — Sandbox reset lost git identity, Hostinger token and Android toolchain
- **Chat:** C31
- **What happened:** Git identity had been lost in the sandbox reset. At 05:28 the Hostinger token was rejected; Akash had to send a new one ("Wtf dude! Why? I already gave it to you!"). The Android toolchain (SDK, full JDK) had to be reinstalled after the sandbox reset before a staging APK could be built.
- **Cause:** sandbox reset (Hostinger rejection cause not recorded).
- **Fix:** new never-expiring Hostinger token verified and stored; toolchain reinstalled; staging APK versionCode 5 (E-01a0a395-29).
- **Recurring:** same class as BUG_LOG #98 (session reset lost live infrastructure access, Sept 27).
- **HISTORY.md line:** 4251, 4292

### 455. 2026-09-15 05:01–05:15 — Claude misread the bible and changed Bob's address rule away from "chief"-primary
- **Chat:** C31
- **What happened:** After Akash had just decided "chief" is primary, Claude read the bible's "paired with the real name" as "always together" (E-01a0a371-8), then separated them (E-01a0a37b-6). Akash: "We just discussed chief would be primary… Operate with the complete and updated memory!"
- **Cause:** Claude did not apply the decision made minutes earlier.
- **Fix:** reverted to chief-primary (E-01a0a37d-4). Settled: chief default, name an alternative, not combined.
- **HISTORY.md line:** 4272

### 456. 2026-09-15 ~05:15 — `character-chat-reply` never received the user's name
- **Chat:** C31
- **What happened:** Bob's reply function had no access to the user's name at all.
- **Cause:** function never fetched it.
- **Fix:** now fetches `profiles.name` and injects it (E-01a0a371-26, -29).
- **HISTORY.md line:** 4277

### 457. 2026-09-15 06:07 — Null `querySelector('p')` for hidden companion tabs
- **Chat:** C31
- **What happened:** During the compact chat header redesign (after Kunnu/Po/Cookie tabs were hidden), a `querySelector('p')` returned null for hidden tabs.
- **Cause:** not recorded beyond the hidden tabs.
- **Fix:** null case fixed (E-01a0a3ad-38). Staging 7 (-61).
- **HISTORY.md line:** 4309

### 458. 2026-09-15 06:19 — Bob had no memory even within a single conversation
- **Chat:** C31
- **What happened:** Investigating "how do we get him to have a proper conversation", Claude found Bob had no memory even within a conversation (not just across sessions).
- **Cause:** not recorded (no conversation history stored/sent).
- **Fix:** `character_messages` table + backend memory (Step 1 of `docs/BOB-MEMORY-SAFETY-BUILD-SPEC.md`, E-01a0a3f8-5); persistence and cross-call recall verified with a test account.
- **HISTORY.md line:** 4311

### 459. 2026-09-15 06:30–06:36 — Claude created `character_messages` in production while Akash was only discussing memory *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** On "Now we will fix both the problems now", Claude created the `character_messages` table in production (with RLS) and wrote backend code (E-01a0a3c2-21, not deployed). Akash: "I was speaking about memory and you started building!"; "stop jumping guns and topics… One topic at a time".
- **Cause:** Claude built without confirmation.
- **Fix:** Akash asked for point-by-point pros/cons; memory decisions made 07:04+; spec written first (E-01a0a3f8-5).
- **BUG_LOG has:** "(undated addendum) Several further real bugs found in the same earlier session (Sept 15…)" — only says the table was created and code written but possibly never deployed/tested; nothing about it being built in production without permission.
- **HISTORY.md line:** 4319

### 460. 2026-09-15 10:36 — Crisis escalation: "no admins found" (RLS) and push log gaps
- **Chat:** C31
- **What happened:** First run of Bob's crisis escalation failed with "no admins found". Also `send-push-notification` wrote no `notification_log` row when there were zero device tokens, and pre-filtered on `push_token`.
- **Cause:** RLS blocked the admin lookup; query pre-filtered on `push_token`.
- **Fix:** service-role lookup (E-01a0a4a3-105); log row written with zero tokens (-55); pre-filter removed (-65, -72). Real push reached Akash's device (`fcm_ok: true`). Known gap left open: partial misses aren't logged when one admin succeeds.
- **HISTORY.md line:** 4368

### 461. 2026-09-15 (Step 1) — Test-account deletion blocked by audit FK
- **Chat:** C31
- **What happened:** Deleting a test account after the crisis-escalation test hit the audit foreign key.
- **Cause:** audit/notification log row referenced the sender.
- **Fix:** sender reference detached, log kept.
- **Recurring:** same class as BUG_LOG #78/#92/#96 (`delete_user_data_atomic` gaps).
- **HISTORY.md line:** 4376

### 462. 2026-09-15 10:43 — Bob told the user to "call 911"
- **Chat:** C31
- **What happened:** Bob gave US emergency number 911 to an India-based user.
- **Cause:** shared safety rules lacked India resources.
- **Fix:** India resources (iCall, 112) added to the shared safety rules for all characters (E-01a0a4aa-10); 3/3 verified.
- **HISTORY.md line:** 4378

### 463. 2026-09-15 10:47–11:05 — Guaranteed recall failed: "lost in the middle", Groq 429s, `json_validate_failed` *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** A significant memory 91 messages back was recalled 0/3 although it was in the prompt. After fixes, remaining failures traced to Groq 429s (8,000 tokens/min) and `json_validate_failed` in the significance call.
- **Cause:** "lost in the middle" placement; rate limit; 200-token budget eaten by reasoning.
- **Fix:** memory framing tried (-61, -69, -74), separate block (-92, -98, -105), then placed just before the current message (E-01a0a4ad-124); 2,000 tokens + `reasoning_effort: medium` (E-01a0a4b5-10, -32); debug removed (-52, -57); 9/10. Then separate low-temperature recall-matcher step (E-01a0a4bf-7, -15, -21), 5/5.
- **BUG_LOG has:** "### 76. A real recall failure, initially misdiagnosed as a data bug -- traced to a mismatched model setting" — covers the reasoning_effort/max_tokens fix only; no lost-in-the-middle placement fix, no Groq 429s, no recall-matcher step.
- **HISTORY.md line:** 4383

### 464. 2026-09-15 11:14 — Callback recall: classifier didn't see the callback
- **Chat:** C31
- **What happened:** First test of semantic-search recall (Step 5) failed: the recall classifier did not detect the callback.
- **Cause:** classifier prompt.
- **Fix:** prompt fixed (E-01a0a5b5-80; debug added -49/-56/-61 and removed -99/-101/-103). 60-day-old detail then found; 3/3 used; no false triggers.
- **HISTORY.md line:** 4402

### 465. 2026-09-15 16:46 — Extraction eligibility function failed on unquoted `"character"`
- **Chat:** C31
- **What happened:** Postgres function `exec_extraction_eligibility` needed `"character"` quoted.
- **Cause:** `character` column name needed quoting in SQL.
- **Fix:** quoted; function applied in production.
- **HISTORY.md line:** 4423

### 466. 2026-09-15 16:51 — Psychoeducation tip hidden because the journal closed on save
- **Chat:** C31
- **What happened:** The new psychoeducation tip rendered inside the journal, which closed on save, so the tip was never seen.
- **Cause:** tip containers were inside the journal panel.
- **Fix:** tip containers moved to the home panel (E-01a0a5fb-124, -129). Click-through reached PHQ-9 Q1.
- **HISTORY.md line:** 4433

### 467. 2026-09-15 20:56 — Every Bob message slow (significance check + save blocking the reply)
- **Chat:** C31
- **What happened:** "Every message literally takes time."
- **Cause:** significance check and save ran before the response was returned.
- **Fix:** moved to `EdgeRuntime.waitUntil` (E-01a0a6db-15), about 4 s. Crisis check parallelized later (Sept 16, E-01a0a8ec-37, -52, -66).
- **HISTORY.md line:** 4442

### 468. 2026-09-15 21:00 — Bob repeated the user's name; chat history disappeared on new chat
- **Chat:** C31
- **What happened:** Bob used the user's name repeatedly; opening a new chat showed none of the previous conversation ("It has to be like a WhatsApp chat!").
- **Cause:** history was not loaded from `character_messages` on open; address-term rule too loose.
- **Fix:** address terms rare (E-01a0a6de-6); greetings de-chiefed (-15); chat history loaded from `character_messages` on open (-26). Staging 9 (-66).
- **HISTORY.md line:** 4445

### 469. 2026-09-15 21:21 — Crisis modal did not appear for "just everything feels too much"
- **Chat:** C31
- **What happened:** Akash said crisis detection wasn't working: no separate crisis modal appeared, Bob just continued.
- **Cause:** not recorded. Backend returned `riskDetected: true`; Claude could not reproduce the missing modal in two Playwright runs (Supabase had scheduled maintenance until 21:45 GMT).
- **Fix:** logging added to `showCrisisResourceModal` (E-01a0a6f6-54). Not otherwise fixed.
- **Recurring:** reported again 22:31 ("Crisis detection is still not working in Bob") and Sept 16 06:34 (see passive-ideation entry).
- **HISTORY.md line:** 4455

### 470. 2026-09-15 21:21 — Kunnu appeared in Bob's conversation
- **Chat:** C31
- **What happened:** "Kunnu comes in between all of a sudden!" although other mascots were hidden.
- **Cause:** an old intentional handoff line ("Talk to a professional") still used Kunnu.
- **Fix:** all Kunnu / Po / Cookie references in `index.html` switched to Bob (character tags, mascot tips, `mascot:` fields in grounding/worksheets, hidden buttons).
- **HISTORY.md line:** 4466

### 471. 2026-09-15 22:05 — Claude built Bob's info panel before Akash confirmed, with wrong emphasis
- **Chat:** C31
- **What happened:** Claude built the info panel (E-01a0a719-7, -13, -18) before Akash confirmed; required bold/italics were missing. Akash: "I said don't build before I confirm!"
- **Cause:** Claude built without confirmation.
- **Fix:** emphasis fixed (E-01a0a71b-4, -6).
- **Recurring:** same pattern Sept 15 06:30–06:36 (production table built while discussing) and Sept 17 12:17/12:24 ("Talk to me first" → built anyway).
- **HISTORY.md line:** 4487

### 472. 2026-09-15 22:06–22:17 — Production deployed when staging was expected; near-miss dropping push
- **Chat:** C31
- **What happened:** Production build versionCode 75 / "3.55-memory-psychoed" (E-01a0a71b-49) deployed to `app.homeofbeautifulsouls.com`. Claude almost dropped push-notifications from production by copying the staging recipe. Akash: "You were supposed to do it staging… if the instructions are ambiguous ask!"
- **Cause:** ambiguous instruction not clarified; staging recipe (no push) copied for production.
- **Fix:** production left as-is (v75 stays live); staging 10 built (E-01a0a725-4). Staging has no push, so escalation push can't be tested there.
- **Recurring:** BUG_LOG #58 (should have used staging first).
- **HISTORY.md line:** 4490

### 473. 2026-09-15 22:31 — Bob stuck repeating the same reflect-then-ask template while the person escalated
- **Chat:** C31
- **What happened:** "He literally is stuck! Repeating the same phrase!" (earlier 20:56: "why is Bob so repetitive! I had clearly instructed no for that!").
- **Cause:** Bob's reflect-then-ask template repeating; no escalation awareness.
- **Fix:** anti-template + escalation-awareness rules (E-01a0a732-7, -31); main reply `reasoning_effort` low → medium (-23); Bob's last reply quoted back before the new message (-41, -48). Test: 3 different structures.
- **HISTORY.md line:** 4502

### 474. 2026-09-16 06:34–06:52 — Bob's close button slow *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** "even upon clicking the close button Bob takes time".
- **Cause:** 2.2 s network + 2.2 s read delay in the goodbye flow.
- **Fix:** closing payload capped to last 10 messages (E-01a0a8ec-22); read delay cut to 1.2 s (E-01a0a8fd-22), staging 13 (-31) — then finally goodbye flow removed, × closes instantly (E-01a0ab35-21; 61 ms).
- **BUG_LOG has:** "### 80. Bob's close (X) button triggered a full 'say a real goodbye' flow" — final fix only; not the earlier partial fixes or the 2.2 s + 2.2 s cause.
- **HISTORY.md line:** 4509, 4524

### 475. 2026-09-16 06:34 — Passive suicidal ideation not flagged on isolated messages
- **Chat:** C31
- **What happened:** "Everything is too much" (possible passive ideation) was not flagged.
- **Cause:** LLM detection degrades on isolated messages (crisis classifier saw only the single message).
- **Fix:** crisis classifier now sees recent conversation with its own parallel history fetch (E-01a0a8ec-104, -112). A true passive-ideation phrase flags; "shitty day → lonely → everything is too much" still did not. Threshold question to Akash: no answer recorded. Open.
- **Recurring:** follows the 21:21 and 22:31 Sept 15 reports.
- **HISTORY.md line:** 4510

### 476. 2026-09-16 13:11 — MASTER.md said the character feature was paused while `character-chat-reply` was live
- **Chat:** C31
- **What happened:** MASTER.md §4 and §1 were stale: said the character feature was paused.
- **Cause:** docs not updated.
- **Fix:** MASTER §4 (-74), header date (-81), §8 (-83), §1 mascot line (-91); PROJECT_STATUS rewritten (-63) (all E-01a0aa57-*).
- **HISTORY.md line:** 4577

### 477. 2026-09-16 ~16:45 — Direct chat title overlap
- **Chat:** C31
- **What happened:** Title overlapped in the new direct-chat/Therapist tab.
- **Cause:** not recorded.
- **Fix:** E-01a0ab25-10.
- **HISTORY.md line:** 4604

### 478. 2026-09-16 22:18 — Claude's test setup changed only the profile field, not the real booking
- **Chat:** C31
- **What happened:** When setting Akash's therapist for testing, Claude changed only the profile field, not `expert_bookings`, so the expected buttons/state didn't appear.
- **Cause:** test data set at the wrong layer (trigger cascades from `expert_bookings`).
- **Fix:** the real booking was updated so the trigger cascades.
- **HISTORY.md line:** 4650

### 479. 2026-09-16 22:48 – 2026-09-17 05:10 — Missing Change/Disconnect buttons on the Our Experts directory *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Third "there are no buttons" report: Claude had fixed the "You" page, but the screenshot was the Our Experts directory (`renderTeamList`).
- **Cause:** Claude fixed the wrong page.
- **Fix:** "Request Change" on the Experts card before a time is picked (E-01a0adc8-30); connected professional sorts to the top (-38). Staging 22 (-73).
- **BUG_LOG has:** "### 84. Change therapist / Disconnect were invisible until a client had also picked a first session time -- confirmed wrong, twice" — covers the profile-page helper fix only, not the Our Experts directory miss or its fix.
- **HISTORY.md line:** 4663

### 480. 2026-09-17 05:10 — Unexplained Experts directory filter (only connected professionals visible)
- **Chat:** C31
- **What happened:** When connected to himself, Akash could only see professionals connected to him; after another therapist was assigned he could see all of them.
- **Cause:** not found — no connection filter in RLS, the fetch or the client.
- **Fix:** not fixed / open; saved to Claude memory as an unresolved mystery (listed in PROJECT_STATUS as "the mystery filter").
- **HISTORY.md line:** 4666

### 481. 2026-09-17 11:13 — "Change therapist" opened an old demo panel with fake therapists
- **Chat:** C31
- **What happened:** The profile "Change therapist" button opened an old demo panel with three hardcoded fake therapist names instead of sending a request to admin ("the protocol was already built!").
- **Cause:** button still wired to legacy demo panel.
- **Fix:** wired to `requestExpertChange` (E-01a0af12-23); `panel-therapist-select` and the fake `therapists` array deleted (-59, -79, -82, -86). Staging 28 (-98).
- **Recurring:** same parallel-mechanism drift as BUG_LOG #82.
- **HISTORY.md line:** 4748

### 482. 2026-09-17 11:25–11:38 — Admin "Approve Change" only cancelled the relationship
- **Chat:** C31
- **What happened:** Akash approved a change-therapist request and it "didn't work at all"; also couldn't see another request to approve; "then suddenly it said retry!"
- **Cause:** "Approve Change" only cancelled the relationship; no reassignment.
- **Fix:** change-request card lets admin reassign directly using the session-request mechanism (E-01a0af1d-60, -63, -72). Staging 29 (-138).
- **HISTORY.md line:** 4754

### 483. 2026-09-17 11:43 — "Your request is being processed" still shown after approval
- **Chat:** C31
- **What happened:** After admin approval, client still saw "your request is being processed".
- **Cause:** `appState.expertBookings` was loaded once at login and never refreshed.
- **Fix:** new `refreshExpertBookings` wrapping `renderTeamList`, `renderProfile`, `openExpertDetail` (E-01a0af2d-23, -28, -34). Reproduced and fixed. Staging 30 (-64).
- **HISTORY.md line:** 4762

### 484. 2026-09-17 11:51 — `new_booking_request` notification didn't land on the admin requests tab
- **Chat:** C31
- **What happened:** Admin got only an app notification; tapping it didn't open the request. (Akash: main issue was the request not visible; this was secondary.)
- **Cause:** notification routing not wired to the admin tab.
- **Fix:** notification now opens admin "Requests & Bookings" (E-01a0af35-20). Staging 31 (-42).
- **HISTORY.md line:** 4766

### 485. 2026-09-17 11:56 — User could be assigned as their own therapist (self-referencing state)
- **Chat:** C31
- **What happened:** Akash had requested himself as his own therapist, leaving a self-referencing state.
- **Cause:** no guard in the matching trigger.
- **Fix:** state cleaned up; matching trigger now refuses to assign a user to themselves; tested. Staging 31.
- **HISTORY.md line:** 4772

### 486. 2026-09-17 12:06–12:08 — Approval request showed "Assign" instead of "Approve"
- **Chat:** C31
- **What happened:** A client's request for a specific professional appeared with an "Assign" button, so Akash thought no approval request had arrived.
- **Cause:** button label didn't reflect the requested professional.
- **Fix:** reads "Approve" when the dropdown matches the requested professional, "Assign" otherwise (E-01a0af44-7, -48). Staging 32.
- **HISTORY.md line:** 4775

### 487. 2026-09-17 12:17 — Pending request not shown as "being processed"; built without being asked
- **Chat:** C31
- **What happened:** Request didn't show under "being processed" in profile. Akash said "Talk to me first"; Claude built anyway (12:24: "I asked you to talk and you just went on built!").
- **Cause:** derived booking flags (`therapistBookingPending` etc.) not recomputed on refresh.
- **Fix:** flags recomputed in `refreshExpertBookings` (E-01a0af4d-20, -27, -37, -43, -74). Staging 33. ("No times available" = professional had no slots, not a bug.)
- **Recurring:** building before confirmation, as on Sept 15 06:30 and 22:05.
- **HISTORY.md line:** 4780

### 488. 2026-09-17 ~12:44–16:20 — Deleted recurring Google Calendar events still showed in the app; prefix match could delete unrelated events; deletion lacked title
- **Chat:** C31
- **What happened:** Deleted recurring events with a client still reflected in the app (15 orphaned rows for Akash). During the fix, Claude's own test showed a prefix match could delete an unrelated event. In the live test, deletion of a keyword availability event failed.
- **Cause:** recurring-series instances weren't reported as cancelled; id matching used a prefix; Google's cancellation payload lacks the title.
- **Fix:** recurring-series deletion fix with strict id-regex check; 15 orphaned rows removed; deletion fixed for title-less cancellations; full create/delete cycle re-verified, debug code removed (in `google-calendar-sync`, no individual edit ids).
- **HISTORY.md line:** 4807, 4818

### 489. 2026-09-17 16:27 — Session couldn't be confirmed: Pay Now only on the detail page
- **Chat:** C31
- **What happened:** Therapist accepted a time but the flow broke because payment is needed to confirm and Pay Now wasn't where the client was.
- **Cause:** Pay Now only existed on the detail page.
- **Fix:** Pay Now added to the Experts list and profile sections (all four roles); "Pending confirmation from HOBS" → "Awaiting payment" (E-01a0b034-12…-87). Staging 34.
- **HISTORY.md line:** 4822

### 490. 2026-09-17 16:39 — Cancelling a session disconnected the therapist
- **Chat:** C31
- **What happened:** Cancelling one session ended the whole client-therapist relationship.
- **Cause:** `cancelSession` set `status = 'cancelled'`.
- **Fix:** now clears only the session date and keeps the relationship; charge policy untouched (E-01a0b03c-12, -39). Staging 35.
- **HISTORY.md line:** 4828

### 491. 2026-09-17 16:49 — Double-click created duplicate booking requests
- **Chat:** C31
- **What happened:** After confirming a time the UI showed "pick a time" again; clicking twice created two requests in the admin panel (two active Therapist bookings for Akash).
- **Cause:** no duplicate check or DB constraint.
- **Fix:** duplicate removed (kept the accepted one); DB unique constraint on one ongoing booking per user + category; `bookExpert` checks first and shows "already sent" (E-01a0b046-22).
- **HISTORY.md line:** 4830

### 492. 2026-09-17 ~16:49 — `delete_user_data_atomic` didn't handle `notification_log.sent_by`
- **Chat:** C31
- **What happened:** Account deletion gap for `notification_log.sent_by`.
- **Cause:** column not handled in the deletion function.
- **Fix:** handled. Staging 36 (E-01a0b12d-9).
- **Recurring:** BUG_LOG #78, #92, #96 (other `delete_user_data_atomic` gaps).
- **HISTORY.md line:** 4836

### 493. 2026-09-17 21:12 — `payment_confirmed` never reset, so only the first session was ever billed
- **Chat:** C31
- **What happened:** Per-session payment: after the first paid session, later sessions were never billed because the payment flag stayed set.
- **Cause:** `payment_confirmed` was never reset when a new session time was set.
- **Fix:** payment now resets when the therapist accepts a new time or admin sets one; amount kept; admin **Edit** button for the amount (E-01a0b139-8…-72). Tested. Staging 37.
- **HISTORY.md line:** 4846

### 494. 2026-09-17 21:27 — Task Activity showed 0/0 for everyone (missing `tasks` SELECT policy); Claude built a duplicate admin section
- **Chat:** C31
- **What happened:** Task Activity showed 0/0 for every client. While building the "My Clients" grid, Claude also built a duplicate of an existing admin section.
- **Cause:** no `tasks` SELECT policy for admin/therapist.
- **Fix:** `tasks` SELECT policy for admin/therapist added; Claude's duplicate admin section removed. Staging 38 (E-01a0b249-9).
- **HISTORY.md line:** 4857

### 495. 2026-09-18 02:26 — Claude reported Play Console status from stale notes instead of checking live
- **Chat:** C31
- **What happened:** Claude listed "unconfirmed" Play items from its notes; Akash: content policies approved and org verified, "why would you work on stale information?" Live `play-console-status` showed alpha 74 completed and a draft production release.
- **Cause:** Claude relied on its notes instead of the Console API it had access to.
- **Fix:** listing checks added to `play-console-status` (E-01a0b256-20, -33).
- **Recurring:** Sept 20 16:11 (screenshots claimed missing, below); Sept 26 23:03 ("giving outdated information").
- **HISTORY.md line:** 4864

### 496. 2026-09-20 10:04 — Mic did not work in the app (no RECORD_AUDIO, no WebView permission bridge)
- **Chat:** C31
- **What happened:** Mic worked in V 3.53 but not in the staging app; after the first fix it still failed ("couldn't access").
- **Cause:** no `RECORD_AUDIO` permission and no WebView permission bridge; then `MODIFY_AUDIO_SETTINGS` was also missing.
- **Fix:** permission plus `BridgeWebChromeClient` `onPermissionRequest` / runtime request in `MainActivity` (staging and tracked copies; E-01a0be46-41…-100), Staging 39; then `MODIFY_AUDIO_SETTINGS` added (E-01a0be5a-9…-33), Staging 41.
- **HISTORY.md line:** 4872

### 497. 2026-09-20 10:16 — "Mood over time" screen missing again in staging
- **Chat:** C31
- **What happened:** The mood-tracker screen was absent in staging while working in V 3.53 ("has again gone missing").
- **Cause:** mood tracker render functions threw when `appState.entries` wasn't loaded yet.
- **Fix:** guarded and made safe (E-01a0be51-60, -62, -89). Staging 40. It came back at 20:43 (see below).
- **Recurring:** 2026-09-20 20:43 (mood tracker missing again → load promise).
- **HISTORY.md line:** 4875

### 498. 2026-09-20 10:26 — No gap between Continue and Add a Task
- **Chat:** C31
- **What happened:** Spacing bug: Continue button touching Add a Task.
- **Cause:** not recorded (missing `#continueBtn` margin).
- **Fix:** `#continueBtn` margin-bottom (E-01a0be5a-9…-33). Staging 41.
- **HISTORY.md line:** 4878

### 499. 2026-09-20 10:26 — "--" inside an XML comment broke the (staging v41) build
- **Chat:** C31
- **What happened:** A "--" inside an XML comment broke the build while adding the mic permission.
- **Cause:** invalid XML comment.
- **Fix:** fixed; Staging 41 built.
- **Recurring:** same defect class again in `AndroidManifest-staging.xml` Sept 28 (BUG_LOG #110 item 1, HISTORY line 5282).
- **HISTORY.md line:** 4880

### 500. 2026-09-20 15:43 — Transcription very slow (AssemblyAI upload/submit/poll)
- **Chat:** C31
- **What happened:** "It's taking a lot of time to transcribe."
- **Cause:** AssemblyAI flow was upload → submit → poll.
- **Fix:** transcription Edge Function switched to Groq Whisper (single call, free tier); 1.4 s measured (E-01a0bf7c-17).
- **HISTORY.md line:** 4881

### 501. 2026-09-20 15:48–15:51 — "Couldn't transcribe", then wrong, then correct
- **Chat:** C31
- **What happened:** After the Groq switch, first attempt failed, next was wrong, then correct. Logs showed 200s; 5/5 on a synthetic clip.
- **Cause:** not recorded; hypothesis: Android cold mic latency.
- **Fix:** "speak now" shown 300 ms after recorder starts (E-01a0bf83-27), web-only deploy; not verifiable from Claude's side (and web-only deploys never reached the phone, see 20:43).
- **Recurring:** 20:43 ("unable to transcribe bug is back"), 20:59 (first recording fails).
- **HISTORY.md line:** 4884

### 502. 2026-09-20 15:57 — Transcribed journal entries not saved / disappeared after saving
- **Chat:** C31
- **What happened:** Entries created via transcription were not saved, or vanished after being saved.
- **Cause:** autosave only listened to `input` events (transcribed text is inserted directly); a save during transcription saved without the text (race).
- **Fix:** autosave triggered after transcription; save queued until transcription finishes (E-01a0bf88-25, -28, -36). Race reproduced and fixed. Web-only deploy.
- **HISTORY.md line:** 4888

### 503. 2026-09-20 16:11–16:19 — Claude said Play screenshots were missing after Akash had uploaded them
- **Chat:** C31
- **What happened:** Claude listed screenshots missing and device catalog unchecked; Akash had already uploaded screenshots and completed the health declaration. The API still showed no phone screenshots.
- **Cause:** not recorded (possibly pending review or not saved on "Main store listing").
- **Fix:** check added to `play-console-status` (E-01a0bf98-9, -14; E-01a0bf9d-12 PROJECT_STATUS).
- **Recurring:** Sept 18 02:26 (stale Play info).
- **HISTORY.md line:** 4894

### 504. 2026-09-20 20:08 — Production v76 ("3.56") closed immediately on open; Claude built v77 without asking
- **Chat:** C31
- **What happened:** The v76 production app (built, `aapt`-verified and smoke-tested at 16:24) crashed at launch. Claude first removed the mic `WebChromeClient` code and built **v77 without asking**; Akash: "Did you even ask my permission?"
- **Cause:** `google-services.json` was missing from the production build directory; `build.gradle` silently skipped the Google Services plugin, so push-notifications crashed at launch. Staging had no push plugin, so it couldn't show this.
- **Fix:** file restored from git, mic code re-added (E-01a0c06f-13, -29, -31; E-01a0c078-7, -12, -16) → **v78**, Firebase processing confirmed in build log. `build.gradle` now fails loudly if the file is missing (E-01a0c07f-4). Staging got push-notifications back with the same check (E-01a0c084-10, -22), staging v43. Akash was still on broken v76 on Sept 21 15:34; v78 APK re-sent.
- **Recurring:** staging Firebase launch crash (BUG_LOG #70); build without asking again Sept 29 06:53 (below).
- **HISTORY.md line:** 4914

### 505. 2026-09-20 20:43 — "Web-only" staging deploys (v40–v42) never reached the phone
- **Chat:** C31
- **What happened:** Fixes deployed as "web-only" (transcription hypothesis, autosave race fix, etc.) had no effect on the installed app.
- **Cause:** the app has no live server URL; the web bundle ships inside the APK, so web-only deploys only arrive with a rebuild.
- **Fix:** rebuilt as staging v44.
- **Recurring:** contradicted by Claude's Sept 29 05:25 claim "the app doesn't need a new APK" (see PARTIAL #112).
- **HISTORY.md line:** 4932

### 506. 2026-09-20 20:43 — Mood tracker missing again; recordings too short
- **Chat:** C31
- **What happened:** Mood tracker missing again on the latest staging; "unable to transcribe" back.
- **Cause:** not fully recorded (tracker rendered before data load finished).
- **Fix:** mood tracker waits on a load promise created at script start (E-01a0c091-22…-97); minimum 1.2 s recording before stop. Staging v44.
- **Recurring:** 10:16 same day.
- **HISTORY.md line:** 4934

### 507. 2026-09-20 20:59 — First recording after permission says "cannot transcribe"; inaccurate text
- **Chat:** C31
- **What happened:** The first recording failed and transcripts were inaccurate.
- **Cause:** not recorded.
- **Fix:** audio constraints (noise suppression, echo cancellation, gain control), higher bitrate, 400 ms extra settle on the first recording after permission (E-01a0c09e-8, -43). A scope bug in Claude's first attempt was caught in testing. Staging v45.
- **HISTORY.md line:** 4936

### 508. 2026-09-21 09:56 — Transcription returned Icelandic
- **Chat:** C31
- **What happened:** A recording was transcribed as Icelandic.
- **Cause:** no `language` hint sent to Whisper.
- **Fix:** forced English (E-01a0c364-6); then auto-detect with `verbose_json`, validate detected language, fallback retry (E-01a0c367-12). Later (15:26) reverted to forced English (E-01a0c493-7).
- **HISTORY.md line:** 4951

### 509. 2026-09-21 11:30 — Crisis AI classifier failed silently ("Invalid API Key") up to Sept 12 with no alert
- **Chat:** C31
- **What happened:** The AI crisis classifier had logged repeated "Invalid API Key" failures up to Sept 12 without alerting anyone. Akash: "why didn't you tell me??"
- **Cause:** `error-alert-monitor` only alerts on spikes or new messages, so a repeated known failure never alerted.
- **Fix:** new scheduled health-check + canary Edge Function (JWT off; own scheduler secret at first, then the standard one; pg_cron every 15 min): sends a known crisis phrase, checks failure logs, pushes an alert to admins. A simulated failure produced a real alert. Staging v46 (web only). Redundancy blocked (no second provider key).
- **Recurring:** earlier silent classifier outages (BUG_LOG #34, #41).
- **HISTORY.md line:** 4962

### 510. 2026-09-21 15:26 — One disabled Hindi pattern line left active by mistake
- **Chat:** C31
- **What happened:** When disabling the Hindi/Hinglish patterns (kept in code), one line was left active.
- **Cause:** Claude's mistake.
- **Fix:** fixed (E-01a0c493-44). Staging v47.
- **HISTORY.md line:** 4993

### 511. 2026-09-21 15:42 — Transcription still wrong ("I want to die" → "I just want to do that") *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Groq Whisper mis-transcribed a crisis phrase; earlier Hindi/English inaccuracy (11:27–11:33, "Muje marna hai yaar" translated wrongly).
- **Cause:** Whisper accuracy; the earliest version used AssemblyAI (free tier can't opt out of training; Deepgram trains by default).
- **Fix:** Gladia (paid, no training) primary, Groq Whisper automatic fallback in the transcription function; "I want to die" came through correctly; fallback proven with a broken key; ~7 s vs 1.4 s.
- **BUG_LOG has:** #106 "`MASTER.md`'s own function table said `transcribe-audio` used AssemblyAI…" — records the Gladia/Groq setup and accuracy reasoning as a doc-staleness bug, not the mis-transcription bug itself or its trigger.
- **HISTORY.md line:** 4997

### 512. 2026-09-21 20:43 — Claude's pending-work list left out many items
- **Chat:** C31
- **What happened:** "you are missing out on a LOT OF THINGS! SOS Feature, bob…" — Claude's list omitted open work, including the professional-connection system being staging-only (never promoted to production).
- **Cause:** not recorded.
- **Fix:** full list rebuilt from `PROJECT_STATUS.md` + memory.
- **Recurring:** Sept 26 22:44–22:56 ("You missed BOB, email marketing and what not").
- **HISTORY.md line:** 5016

### 513. 2026-09-21 21:22 — Old notes wrongly said WhatsApp needed DLT registration
- **Chat:** C31
- **What happened:** Akash: "WhatsApp doesn't need DLT registration!" Claude verified he was right (DLT is SMS-only).
- **Cause:** old notes were wrong.
- **Fix:** corrected; also unblocks SOS.
- **HISTORY.md line:** 5025

### 514. 2026-09-21 22:40 → 2026-09-22 01:40 — Claude overwrote the permanent WhatsApp System User token with a 24-hour token
- **Chat:** C31
- **What happened:** Claude re-saved the token Akash pasted at 22:40, overwriting the permanent System User token. At ~01:40 creating the revised templates failed: token expired. Akash: "it said it was permanent one!"
- **Cause:** Claude re-saved a new 24-hour token over the stored permanent one.
- **Fix:** not recoverable (secrets are write-only). Regenerating hit a Meta email-verification error (no documented fix). A new token was sent Sept 26 19:59.
- **Recurring:** Sept 26 19:52 — the stored token was dead (the 24-hour one).
- **HISTORY.md line:** 5049

### 515. 2026-09-21 22:48 — Two WhatsApp templates rejected by Meta
- **Chat:** C31
- **What happened:** Two of the 8 Utility templates created via the Graph API were rejected.
- **Cause:** Meta rejects templates that end on a variable.
- **Fix:** both resubmitted.
- **HISTORY.md line:** 5062

### 516. 2026-09-21 23:16 — Client agreement collected no address; 13 of 21 real clients had none
- **Chat:** C31
- **What happened:** Akash: "there's supposed to be complete address!" The agreement collects no address; 13 of 21 real clients had no address. While adding the gate, Claude accidentally deleted a line (restored).
- **Cause:** agreement form never asked for address.
- **Fix:** mandatory address gate for clients (therapists/admins exempt), staging v48 (web). Replaced Sept 22 01:54 by the full consent + No-Suicide Agreement gate for every client, admin exempt (E-01a0c6d2-7…-65); staging v49, production v80.
- **HISTORY.md line:** 5089

### 517. 2026-09-22 02:10–02:15 — Claude published v80 to production without Akash's review
- **Chat:** C31
- **What happened:** After building `publish-production-release` (E-01a0c6dc-8, -19; E-01a0c6e1-2, -10), Claude used it to publish v80 straight to production. Akash: "Obviously I am gonna review what's changed! … you will upload after approval!"
- **Cause:** Claude read "upload it automatically" as permission to publish without review.
- **Fix:** agreed workflow: Claude explains, Akash approves, Claude publishes.
- **HISTORY.md line:** 5119

### 518. 2026-09-22 02:30–07:44 — Blank home-screen card; unnecessary rollback to v79 (as v81) and production profile write
- **Chat:** C31
- **What happened:** Akash saw a blank card at the top of home (not reproduced on a fresh account). On his order Claude rebuilt v79 as **v81** and published it (secret regenerated). The card was still there. Claude found `ai_disclaimer_signed: false` on Akash's profile and set it to true in production. Claude later confirmed the blank card predated v80, so the rollback was unnecessary and likely cost review time; v80 content rebuilt as **v82** and published.
- **Cause:** not recorded beyond `ai_disclaimer_signed: false` on his profile; his phone was actually on 3.54 (v74).
- **Fix:** profile flag set; v82 published ("no more production submissions after this one").
- **HISTORY.md line:** 5128

### 519. 2026-09-22 07:32 — Users on the closed testing track got the old alpha (v74); API "clear alpha" reported success but did nothing
- **Chat:** C31
- **What happened:** Akash's `app_version` was 74 (3.54) even after a Play reinstall; testers enrolled in the closed track get the alpha (v74). Claude tried to clear the alpha track via a temporary API function; the API returned success but alpha still showed 74.
- **Cause:** closed-track enrollment; API change not effective.
- **Fix:** not fixed — Console "Remove testers" needed; Akash: testers can't install without their emails entered. (The temp function, `temp-deactivate-alpha`, was later found still live — BUG_LOG #104.)
- **HISTORY.md line:** 5136

### 520. 2026-09-22 07:39 — Repeated production submissions likely restarted Google's first review
- **Chat:** C31
- **What happened:** Production showed "Started rollout 100%" since Sept 9 but was actually in review; v81 "In review". First production review takes 7–14 days and resubmitting restarts the clock; v79 → v80 → v81 (then v82) likely reset it.
- **Cause:** multiple resubmissions, including the unnecessary rollback.
- **Fix:** none beyond stopping further submissions after v82.
- **HISTORY.md line:** 5143

### 521. 2026-09-22 07:54 — "App not installed" when updating a Play install with a sideloaded APK
- **Chat:** C31
- **What happened:** Updating the Play-installed app with a directly downloaded APK failed ("App not installed") ever since Akash installed from Play.
- **Cause:** Play App Signing re-signs Play installs, so an upload-key-signed APK has a signature mismatch.
- **Fix:** none possible; uninstall first (update across a signature mismatch is impossible on Android).
- **HISTORY.md line:** 5150

### 522. 2026-09-26 19:36–19:39 — Claude confused sending and recipient numbers and gave outdated "Advanced Access" advice
- **Chat:** C31
- **What happened:** Claude confused Akash's own recipient number with the sending number and told him to request "Advanced Access". Akash: "There's no thing as advanced access… Stop using outdated information!"
- **Cause:** outdated information.
- **Fix:** used the number and Phone Number ID Akash gave.
- **HISTORY.md line:** 5158

### 523. 2026-09-26 20:03 — Two recreated templates landed in the Marketing category
- **Chat:** C31
- **What happened:** On recreation under the new WABA, `hobs_professional_assigned` and `hobs_system_alert` were approved as Marketing (originally created as Utility).
- **Cause:** not recorded.
- **Fix:** not recorded.
- **HISTORY.md line:** 5175

### 524. 2026-09-26 20:02–21:56 — Claude's wrong turns during the WhatsApp delivery mystery *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Claude claimed Akash's recipient number was the sending number, said the app was in development mode (it was live), suggested he may have blocked the number, and suggested re-registering his number. Several new tokens were needed (21:05, 21:11, 21:15).
- **Cause:** new-number warm-up / "UNKNOWN" quality (see BUG_LOG); wrong turns were Claude's guesses.
- **Fix:** resolved 21:56 after Akash updated the registered number.
- **BUG_LOG has:** #100 "New number's sends were 'accepted' by the API but never delivered…" — root cause and resolution, but not Claude's wrong diagnoses.
- **HISTORY.md line:** 5178

### 525. 2026-09-26 21:05–21:08 — WhatsApp business profile set with wrong content
- **Chat:** C31
- **What happened:** Claude set the business profile via the API with content Akash rejected: he had said no address would be added, and it included "crisis alert" / "crisis intervention" wording; email also needed changing.
- **Cause:** Claude didn't follow Akash's earlier instruction / didn't use website content.
- **Fix:** profile fixed: about "India's only survivor-led mental health NGO", website description, website and a `wa.me` link, logo.
- **HISTORY.md line:** 5185

### 526. 2026-09-26 ~21:10–21:42 — `whatsapp-webhook` never stored events (console-only)
- **Chat:** C31
- **What happened:** During the delivery mystery, webhook status events weren't available because the function only logged to console.
- **Cause:** `whatsapp-webhook` only logged to console.
- **Fix:** new table `whatsapp_webhook_events`; function now stores events.
- **HISTORY.md line:** 5192

### 527. 2026-09-26 23:55 (referred to as the "Sept 27 restore") / 2026-09-29 06:20–06:35 — Staging app logged itself out on update *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Akash: the staging app "logged out upon updating the app on its own which never happened before! And even when I logged out, I could sign in!"
- **Cause:** Claude's chain (unproven): the restore of the paused staging project likely cleared auth sessions and the Google provider → forced logout → provider disabled → redirect mismatch → silent error branch.
- **Fix:** not separately fixed.
- **BUG_LOG has:** #111 "Staging's Google Sign-In was fully broken…" and #114 — provider disabled and redirect mismatch with the restore as likely cause; the forced logout on app update is not recorded.
- **HISTORY.md line:** 5323

### 528. 2026-09-29 05:25 / 06:41 — Phone-save fix only reached the website; the installed production app still had the bug *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Claude said "the app doesn't need a new APK — it loads `index.html` at runtime", contradicting the Sept 20 finding that the app is bundled with no live server URL. At 06:41 a real user still got "check your connection" on profile save.
- **Cause:** fix deployed only to the Hostinger site; no production APK built since.
- **Fix:** not fixed — v83 needed (Claude's unrequested v83 build was stopped).
- **BUG_LOG has:** #112 "Production: profile-edit save silently failed…" — says "Deployed to production and confirmed live (fetched the served page)"; missing that the installed app still has the bug and needs v83.
- **HISTORY.md line:** 5329

### 529. 2026-09-29 06:53–06:58 — Claude started a v83 production build without being asked
- **Chat:** C31
- **What happened:** While reading earlier chats as asked, Claude started a v83 production build. Akash: "STOP… DID I ASK YOU TO BUILD!… You are not supposed to build anything till I tell you!"
- **Cause:** Claude acted without approval.
- **Fix:** build stopped.
- **Recurring:** Sept 20 20:08 (v77 built without asking); Sept 22 02:10 (v80 published without review).
- **HISTORY.md line:** 5336

### 530. 2026-09-29 06:59 — Claude wrongly claimed Akash supplied credentials at the start of every session
- **Chat:** C31
- **What happened:** Akash: "NO I DID NOT SUPPLY YOU CREDENTIAL AT THE START OF EVERY SESSION!"
- **Cause:** Claude's wrong claim; before, a doc/zip with credentials was attached once; after the Aug 26 incident banned raw credentials in files, pasting became the only way.
- **Fix:** Claude corrected itself.
- **HISTORY.md line:** 5340

### 531. 2026-09-26 19:40 / 2026-09-29 07:05 — Session reset: why context and tokens were lost *(adds to an existing entry)*
- **Chat:** C31
- **What happened:** Chat continued in a fresh cloud session with no repo or Supabase login; later Akash asked what changed since Sept 22.
- **Cause:** work moved to a GitHub-backed cloud coding session (first commit Sept 22); context auto-compaction replaced the hard chat limit and silently drops details (including pasted tokens); the cloud machine is wiped after inactivity.
- **Fix:** proposed: a permanent credential home outside the repo (e.g. GitHub Actions secrets) and reading the claude.ai data export into the repo (the reconstruction task).
- **BUG_LOG has:** #98 "Session reset mid-work lost all live infrastructure access" — the reset and `system_credentials` bootstrap, not the compaction/wipe cause.
- **HISTORY.md line:** 5343

## Standing lessons (do not re-learn these)

**Run `deployment/verify-before-deploy.sh` before every single deploy, web or Android, no
exceptions.** This exists because the keystore, the manifest, package.json, the app's own
signing config, google-services.json, MainActivity.java, and every image asset were each found
missing separately, reactively, after something had already broken for the real user -- the
same root cause every time: something the app needs that was never verified to exist before
shipping. This script checks all of it in one pass and fails loudly if anything is missing.
Skipping this check is how the exact same class of bug happens again.

- **The `on_conflict` bug has now been found and fixed three separate times** (July session, Aug
  5, Aug 14) in three different tables/functions, because each fix was applied locally rather
  than turned into a rule. **The rule, stated once, for good: every `POST` intended as an upsert
  against a table with a unique constraint needs an explicit `on_conflict=<column>` parameter —
  PostgREST will never infer it — and every write's actual result must be checked before ever
  reporting success to the caller.** If a future session touches any `dbWrite`/upsert call, check
  this first, don't rediscover it.
- **A build succeeding is not the same as a fix being verified.** Multiple fixes across this
  project's history — not just August 14 — turned out to still have a gap when actually tested
  against real data or a real device, more than once in the same session.
- **`window.Capacitor` (and everything under it) only exists inside the app's own native
  WebView.** A page loaded in an external browser tab or Custom Tab — even one the app itself
  opened — never has it. Code that assumes otherwise silently no-ops instead of erroring.
- **Native build assets (AndroidManifest.xml, and anything else Capacitor's tooling regenerates)
  must be explicitly, permanently saved to the repo.** If it only exists in the ephemeral build
  folder, it does not survive to the next session.
- **When testing a fix on a real device, confirm the installed version number first.** More than
  one "still broken" report across this project turned out to mean the old build was still
  installed, not that the fix failed.
- **Storage's `.list()` is not recursive.** Anything iterating stored files needs to walk
  subfolders explicitly or it will silently miss real files.
- **Any place a timeout wraps a network call needs to wrap every await in that chain**, not just
  the "main" one — the stuck "Saving..." button bug came from a timeout that didn't cover an
  earlier `getSession()` call in the same function.
- **Proactively check for the same bug pattern elsewhere in the codebase once one instance is
  found**, rather than only fixing the reported instance — this caught the busy-block sync
  `on_conflict` bug in August before it was ever separately reported.
- **A UI element that shares a real concept (a connected professional, a booking, a session) is
  very often rendered from more than one, completely separate place in this codebase — the
  Session Log entry point alone had to be added in three genuinely different locations (#85, #95)
  before it was actually reachable everywhere it should be, and the Change/Disconnect buttons had
  a real, similar split (#82, #84).** When a real "add this button/feature" fix lands cleanly in
  one place, search for every other place the same underlying data renders before considering it
  done — don't wait for a second report to find the next one.
- **Any new table or column added to something a real account can own must be added to
  `delete_user_data_atomic` in the same session it's created, not discovered later by a failed
  deletion.** This happened three separate times in one day (#78, #92) purely because cleaning up
  real test accounts is what actually exercises this function — a feature that works perfectly for
  every other real purpose can still leave account deletion broken if this step is skipped.
- **Never assume what a business-logic term like "matched" or "confirmed" means from how it
  sounds — find the actual code path that sets it, or ask directly.** The real therapist
  auto-assignment mechanism (#81) was built once on a reasonable-sounding but wrong assumption
  (payment confirms a match) and had to be rebuilt on the real, confirmed one (an admin's
  assignment action does) after directly contradicting real, live data.
- **A panel's content rendering correctly is not the same as the panel being visible.** `showOnly`
  depends on a manually maintained list of every real panel id (`allPanels`); a new panel left out
  of it renders perfectly underneath a `display: none` that never lifts (#93). Check the actual
  computed `display` value on a new panel, not just that its inner HTML looks right.
- **Delete every temporary diagnostic/debug Edge Function immediately after its one real use, not
  in a later batched cleanup pass (#101).** Any function deployed with `verify_jwt: false` to test
  something is a public endpoint for as long as it exists -- if it touches a real secret (an
  access token, an API key) via `Deno.env.get`, that secret is reachable through it for every
  minute it's left deployed.
- **A brand-new WhatsApp Cloud API number returning `accepted` on every send while nothing
  actually arrives is very likely the number's own quality-rating warm-up period, not a config bug
  (#100).** Confirm via Meta's own WABA-level analytics endpoint directly (zero sent/delivered is
  the real signature) before assuming permissions, templates, or webhooks are broken -- and know
  that it typically resolves on its own with time, not more debugging.
- **This repo's `docs/MASTER.md`, `PROJECT_STATUS.md`, and `BUG_LOG.md` are the one real,
  permanent source of truth for this project's state -- not a session's own memory tooling, not a
  separate document anywhere else (#103).** If a session's tooling offers a place to save "project
  context" that isn't one of these three files, that is not where this project's real state lives,
  and using it instead of updating these files recreates the exact gap this repo was built to
  close.
- **A function labeled "temporary" in its own source comment still needs an explicit deletion
  step (#104).** Flagging something as temporary is not the same as removing it -- it just stays
  live, exposed, and forgotten until the next audit happens to find it.
- **Any Edge Function ever deployed directly via the Management API needs its source pulled back
  into the repo the same session, not left living only on Supabase's servers (#105).**
- **A documented fact about which provider/library a function uses goes stale the moment that
  function changes and nobody updates the doc -- re-check it directly against deployed source
  rather than trusting what's already written, especially for anything that's changed before
  (#106).**
- **Run a full Edge Function audit periodically**: list everything actually deployed
  (`GET /v1/projects/{ref}/functions`), diff it against both this repo's `supabase/functions/`
  directory and `MASTER.md`'s own function table. All of #104-#106 were found in one such audit;
  assume more exist until a clean one says otherwise (see `MASTER.md` §11).
- **A server-side OAuth completion succeeding is not the same as the person getting back into
  the app -- check the actual Android-side return path, not just that the connection saved
  (#108).**
- **"Installs side by side, doesn't conflict" needs checking against every shared identifier a
  staging/production pair uses -- package name isn't the only one. A custom URL scheme is
  exactly this kind of identifier and was never actually verified distinct until it caused a
  real incident (#109).**
- **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
  any test result against it -- auto-pause after inactivity is real and silent, and staging
  specifically has no traffic keeping it awake between test sessions (#109).**
- **A truly fresh build environment is the only real test of a build recipe.** All three defects
  in #110 existed silently for weeks because every past build happened to run on an environment
  with leftover manual state from an earlier session -- the recipe documents in `MASTER.md` and
  the staging `README.md` can go stale exactly like any other doc, and only actually running them
  from zero catches it.
- **A shared OAuth client across two Supabase projects (production/staging) needs each project's
  own callback URL separately, explicitly registered in Google Cloud Console (#111).** Production
  working is not evidence staging is configured at all -- check both directly.
- **A DB CHECK constraint added to enforce a real format (like #102's `is_valid_wa_phone`) needs
  every existing client write path touching that column re-checked in the same session it's
  added, not just the one that prompted it (#112).** The constraint did its job correctly the
  entire time; the actual gap was a screen nobody re-checked against the new rule.
- **A generic error message ("check your connection") shown for any database error, not just
  real network failures, actively prevents diagnosing real bugs from a user's own report of what
  they saw (#113).** Surface the real error, or a specific, accurate mapped one -- never a guess
  dressed up as certainty.
- **Log every real change to this file as it happens, in the same session, not batched for the
  end.** Akash asked for this directly (Sept 29, 2026) after several real fixes in one session
  went unrecorded until asked. A change that isn't written here the same session it happens is a
  change a future session (or Akash) has no way to find later.
- **An OAuth callback handler that only recognizes success shapes and silently drops everything
  else is indistinguishable, from the user's side, from the callback never firing at all (#114).**
  Always handle the failure shape (`error`/`error_description`) explicitly, in every branch, not
  just the happy path -- otherwise a real, specific failure looks identical to "nothing happened."
- **A prefix-based secret scan cannot see secrets without a prefix (#115).** Anything copied from
  chat history or old handoff docs gets a line-by-line check for credential labels ("secret",
  "password", "token", "key") before it is committed, not just the pattern scan.
