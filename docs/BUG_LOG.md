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
