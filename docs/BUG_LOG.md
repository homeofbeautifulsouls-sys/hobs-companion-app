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
