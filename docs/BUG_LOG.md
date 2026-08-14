# HOBS Companion — Bug & Resolution Log

Every confirmed bug found and fixed, in order, with how it was verified. This exists because
losing track of what was already found and fixed wastes real time re-diagnosing the same
problem twice — keep this updated going forward, every session, no exceptions.

Format per entry: **What broke** → **Root cause** → **Fix** → **How it was verified** → **Commit**

---

## August 6–13, 2026 — External security audit (23 findings, 18 confirmed real and fixed)

Full detail for each of these lives in its own git commit message (`git log`), which is the
authoritative record — this is a summary index, not a replacement for it.

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
   already-saved order, not two simultaneous *first* requests. **This was corrected on
   Aug 14** after being caught in external review: added `claim_razorpay_order_slot`, verified
   with 5 genuinely simultaneous first-time requests — all 5 returned the identical order_id.
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

## August 14, 2026 — Native app OAuth investigation (this was the big one)

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

### 27. Calendar-connect's save silently failed while reporting success
**What broke:** the banner said "Calendar connected!" but the app kept showing "needs
reconnecting" immediately after.
**Root cause:** confirmed directly against the real database — `professional_calendar_connections`
has a genuine unique constraint on `user_id`. The save used a plain `POST` with no
`on_conflict` parameter, which PostgREST requires to upsert against an existing row. Once a
connection already existed (it did, from August 5), the insert failed outright — and the
result was never checked, so the failure was silently swallowed while the function still
returned `success: true`.
**Fix:** added `on_conflict=user_id`, and now checks the actual result before ever reporting
success. Applied the same fix to the `refresh_token` action's save (same unchecked pattern).
**Verified directly against the real, live table:** confirmed the stale Aug 5 data, then
confirmed the fixed upsert pattern genuinely updates the existing row (same row id, field
verified changed), and confirmed no duplicate row was created.

### 28. Completed the GitHub Pages → Hostinger migration
Once Google sign-in was confirmed working, finished switching Calendar OAuth's redirect URI
from GitHub Pages to `app.homeofbeautifulsouls.com` (already registered in Google Cloud
Console from earlier troubleshooting). GitHub Pages is no longer used for anything in this app.

---

## Standing lessons worth not re-learning
- **A build succeeding is not the same as a fix being verified.** Every fix above that claimed
  "resolved" without being tested against real, live data or a real device turned out to still
  have a gap, more than once, in the same session.
- **`window.Capacitor` (and everything under it) only exists inside the app's own native
  WebView.** A page loaded in an external browser tab or Custom Tab — even one the app itself
  opened — never has it. Code that assumes otherwise silently no-ops instead of erroring.
- **Every `dbWrite`/upsert call must check its actual result before claiming success**, and
  every `POST` intended as an upsert against a table with a unique constraint needs an explicit
  `on_conflict` parameter — PostgREST will not infer it.
- **Native build assets (AndroidManifest.xml, and anything else Capacitor's tooling
  regenerates) must be explicitly, permanently saved to the repo.** If it only exists in the
  ephemeral build folder, it does not survive to the next session, silently.
- **When testing a fix on a real device, confirm the installed version number first.** A "still
  broken" report may just mean the old build is still installed.
