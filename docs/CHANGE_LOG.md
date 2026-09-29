# HOBS Companion — Complete Change Record

Exact, unedited record of every change this repo's git history can actually produce, plus
every infrastructure/database/deploy action from this session that isn't captured by git.
Akash asked for this to cover the app's entire history, from when building started -- the
**one real, permanent limit** on that is explained plainly in the section right below, not
hidden or glossed over.

---

## The real limit on how far back this can go — read this first

This repo's git history has exactly **14 commits total**, starting **September 22, 2026**
(the first commit, `504c57b`, is a root commit with no parent — see below). But real work on
this app started **July 22, 2026** per `docs/BUG_LOG.md`'s own earliest entries — roughly two
months of real development, fixes, and deploys happened before this repo was ever placed
under git version control and pushed to GitHub (that connection itself only happened during
a recent session).

**What that means concretely**: there is no surviving word-for-word diff for anything in that
July 22 – September 22 window. Not because it wasn't recorded at all -- `docs/BUG_LOG.md`'s
entries #1 onward *do* narratively describe that period's real bugs and fixes -- but no exact
before/after text for any individual change in that window still exists anywhere. Each session
back then edited files directly in an ephemeral sandbox with no git commits and no other
diff-level record; the sandboxes themselves are long gone. **Fabricating word-for-word diffs
for that period is not something this file will do** -- that would violate this repo's own
core rule (`CLAUDE.md`: never state something as verified without real evidence) in the exact
file whose entire purpose is being that evidence.

**What this file actually contains, honestly**:
1. The literal, complete diff for every one of the 14 real commits in this repo's git
   history (Sept 22, 2026 onward) -- including the first commit, which is a one-time full
   snapshot import of everything that existed by that date, not an incremental change (see
   its entry below for why it's handled differently).
2. Every infrastructure/database/deploy action from this session (Sept 27-29, 2026) that
   isn't captured by git at all.
3. For July 22 – September 22, 2026: no diffs, by necessity -- go to `docs/BUG_LOG.md`
   entries #1 onward for the real, narrative record of that period instead. That file is
   itself real and detailed; it is just not word-for-word diffs, because those no longer exist.

---

## Commit `504c57b` — 2026-09-22T07:48:26+00:00 (root commit — repo's first ever)

**Subject**: Production v82: restores the universal consent gate fix (correctly, this time) after an unnecessary rollback

**Why this one is handled differently from every other entry below**: this commit has no
parent — it's the moment this project was first placed under git, not an incremental change.
It adds **164 files, 46,914 lines** in one shot: the complete app as it existed on Sept 22,
2026, all at once. Pasting all 46,914 lines here would not communicate a *change* -- there is
nothing to diff it against. What's below is the real, complete file-by-file stat
(`git show 504c57b --stat`, unedited) instead. The full literal content is not reproduced a
second time in this doc because it already exists, permanently and exactly, as this commit
in this repo's own git history -- `git show 504c57b` from within the repo is the literal
word-for-word record, and always will be for as long as this repo exists.

```
commit 504c57b2e36bbffa3ceb3b32b3e8ad5f8df0ebaf
Author: Claude <claude@anthropic.com>
Date:   Tue Sep 22 07:48:26 2026 +0000

    Production v82: restores the universal consent gate fix (correctly, this time) after an unnecessary rollback -- confirmed the local repo's index.html had never actually reverted, so this is a clean republish of the real, correct content, not a reconstruction.
    
    Verified more thoroughly than any prior release today, given the day's history: signature, package, version, and permissions confirmed via aapt; the real fix confirmed present via direct string match; the old, incorrectly-narrow consent condition confirmed absent; a full real functional test (not just static checks) confirming a new client is genuinely blocked, the real multi-field form genuinely unblocks the app, and the real address and emergency contacts genuinely persist to the database, queried directly. Zero page errors throughout. This is intended as the last production submission for a while, to let Google's review actually complete without being reset again.

 .github/workflows/disabled/README.md               |    22 +
 .../disabled/notification-scheduler.yml.disabled   |    33 +
 .gitignore                                         |     2 +
 .nojekyll                                          |     0
 .../alarm-feature/AlarmActivity.java               |   122 +
 .../alarm-feature/AlarmReceiver.java               |    42 +
 .../alarm-feature/AlarmScheduler.java              |   112 +
 .../alarm-feature/BootReceiver.java                |    17 +
 android-native-assets/alarm-feature/README.md      |    40 +
 .../alarm-feature/TaskAlarmPlugin.java             |    36 +
 .../alarm-feature/res-layout/activity_alarm.xml    |    49 +
 android-native-assets/build-config/README.md       |    30 +
 .../build-config/app-build.gradle                  |    88 +
 .../build-config/package-lock.json                 |  1208 ++
 android-native-assets/build-config/package.json    |    16 +
 android-native-assets/capacitor-config/README.md   |    12 +
 .../capacitor-config/capacitor.config.ts           |    45 +
 android-native-assets/firebase/README.md           |    11 +
 .../firebase/google-services.json                  |    48 +
 android-native-assets/icons/README.md              |    49 +
 .../icons/SOURCE_master_icon_crop.png              |   Bin 0 -> 1186758 bytes
 .../icons/ic_launcher_background.xml               |     4 +
 .../icons/mipmap-hdpi/ic_launcher.png              |   Bin 0 -> 11994 bytes
 .../icons/mipmap-hdpi/ic_launcher_foreground.png   |   Bin 0 -> 34455 bytes
 .../icons/mipmap-hdpi/ic_launcher_round.png        |   Bin 0 -> 11994 bytes
 .../icons/mipmap-mdpi/ic_launcher.png              |   Bin 0 -> 5757 bytes
 .../icons/mipmap-mdpi/ic_launcher_foreground.png   |   Bin 0 -> 16361 bytes
 .../icons/mipmap-mdpi/ic_launcher_round.png        |   Bin 0 -> 5757 bytes
 .../icons/mipmap-xhdpi/ic_launcher.png             |   Bin 0 -> 20365 bytes
 .../icons/mipmap-xhdpi/ic_launcher_foreground.png  |   Bin 0 -> 59557 bytes
 .../icons/mipmap-xhdpi/ic_launcher_round.png       |   Bin 0 -> 20365 bytes
 .../icons/mipmap-xxhdpi/ic_launcher.png            |   Bin 0 -> 43241 bytes
 .../icons/mipmap-xxhdpi/ic_launcher_foreground.png |   Bin 0 -> 130097 bytes
 .../icons/mipmap-xxhdpi/ic_launcher_round.png      |   Bin 0 -> 43241 bytes
 .../icons/mipmap-xxxhdpi/ic_launcher.png           |   Bin 0 -> 74819 bytes
 .../mipmap-xxxhdpi/ic_launcher_foreground.png      |   Bin 0 -> 229717 bytes
 .../icons/mipmap-xxxhdpi/ic_launcher_round.png     |   Bin 0 -> 74819 bytes
 .../mainactivity/MainActivity.java                 |   190 +
 android-native-assets/mainactivity/README.md       |    10 +
 android-native-assets/manifest/AndroidManifest.xml |    56 +
 android-native-assets/manifest/README.md           |    14 +
 .../RazorpayNativeCheckoutPlugin.java              |    96 +
 android-native-assets/signing/README.md            |    35 +
 .../signing/hobs-release.keystore                  |   Bin 0 -> 2772 bytes
 android-native-assets/splash/README.md             |    20 +
 .../splash/drawable-land-hdpi/splash.png           |   Bin 0 -> 2250 bytes
 .../splash/drawable-land-mdpi/splash.png           |   Bin 0 -> 1209 bytes
 .../splash/drawable-land-xhdpi/splash.png          |   Bin 0 -> 4320 bytes
 .../splash/drawable-land-xxhdpi/splash.png         |   Bin 0 -> 6809 bytes
 .../splash/drawable-land-xxxhdpi/splash.png        |   Bin 0 -> 10171 bytes
 .../splash/drawable-port-hdpi/splash.png           |   Bin 0 -> 2889 bytes
 .../splash/drawable-port-mdpi/splash.png           |   Bin 0 -> 1470 bytes
 .../splash/drawable-port-xhdpi/splash.png          |   Bin 0 -> 5530 bytes
 .../splash/drawable-port-xxhdpi/splash.png         |   Bin 0 -> 7891 bytes
 .../splash/drawable-port-xxxhdpi/splash.png        |   Bin 0 -> 11370 bytes
 .../splash/drawable/ic_launcher_background.xml     |   170 +
 android-native-assets/splash/drawable/splash.png   |   Bin 0 -> 1209 bytes
 .../staging-config/AndroidManifest-staging.xml     |    82 +
 android-native-assets/staging-config/README.md     |    74 +
 .../staging-config/app-build-staging.gradle        |    73 +
 .../staging-config/capacitor.config.ts             |    45 +
 android-native-assets/staging-config/index.html    | 15692 +++++++++++++++++
 android-native-assets/web-images/README.md         |    19 +
 .../web-images/bob-welcome-back.jpg                |   Bin 0 -> 279639 bytes
 android-native-assets/web-images/bob.jpg           |   Bin 0 -> 23139 bytes
 android-native-assets/web-images/bodydoubling.jpg  |   Bin 0 -> 113649 bytes
 android-native-assets/web-images/cookie.jpg        |   Bin 0 -> 10802 bytes
 android-native-assets/web-images/hero-image.jpg    |   Bin 0 -> 66332 bytes
 android-native-assets/web-images/kunnu.jpg         |   Bin 0 -> 16239 bytes
 android-native-assets/web-images/logo.png          |   Bin 0 -> 18173 bytes
 android-native-assets/web-images/paytm-qr.jpg      |   Bin 0 -> 100674 bytes
 android-native-assets/web-images/po.jpg            |   Bin 0 -> 7688 bytes
 .../web-images/vintage-bg-alt.jpg                  |   Bin 0 -> 75136 bytes
 .../web-images/vintage-bg-cover.jpg                |   Bin 0 -> 77998 bytes
 .../web-images/vintage-bg-index.jpg                |   Bin 0 -> 32012 bytes
 .../web-images/vintage-bg-journal.jpg              |   Bin 0 -> 28775 bytes
 assistant-fab.gif                                  |   Bin 0 -> 321745 bytes
 bob-welcome-back.jpg                               |   Bin 0 -> 279639 bytes
 bob.jpg                                            |   Bin 0 -> 23139 bytes
 bodydoubling.jpg                                   |   Bin 0 -> 113649 bytes
 cookie.jpg                                         |   Bin 0 -> 10802 bytes
 delete-account.html                                |   129 +
 deploy-tools/README.md                             |    24 +
 deploy-tools/package.json                          |     8 +
 deploy-tools/safe_deploy.js                        |   125 +
 deployment/deploy-to-hostinger.sh                  |    95 +
 deployment/verify-before-deploy.sh                 |    75 +
 docs/BOB-CHARACTER-BIBLE.md                        |   220 +
 docs/BOB-COMPLETE-TECHNICAL-AND-CHARACTER-DOC.md   |   225 +
 docs/BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md         |   175 +
 docs/BOB-MEMORY-SAFETY-BUILD-SPEC.md               |   285 +
 docs/BUG_LOG.md                                    |  1861 ++
 docs/MASTER.md                                     |   388 +
 docs/PROJECT_STATUS.md                             |   170 +
 donate.html                                        |   229 +
 fonts.css                                          |    28 +
 fonts/caveat-600.ttf                               |   Bin 0 -> 251816 bytes
 fonts/caveat-700.ttf                               |   Bin 0 -> 251256 bytes
 fonts/kalam-400.ttf                                |   Bin 0 -> 426488 bytes
 fonts/kalam-700.ttf                                |   Bin 0 -> 460024 bytes
 hero-image.jpg                                     |   Bin 0 -> 66332 bytes
 index.html                                         | 17213 +++++++++++++++++++
 kunnu.jpg                                          |   Bin 0 -> 16239 bytes
 logo.png                                           |   Bin 0 -> 18173 bytes
 package-lock.json                                  |   221 +
 package.json                                       |     5 +
 paytm-qr.jpg                                       |   Bin 0 -> 100674 bytes
 po.jpg                                             |   Bin 0 -> 7688 bytes
 privacy-policy.html                                |   124 +
 supabase.min.js                                    |    17 +
 .../auto_assign_therapist_on_match.sql             |    53 +
 .../delete_user_data_atomic.sql                    |    56 +
 .../get_or_create_direct_chat_room.sql             |    49 +
 .../record_session_history.sql                     |    22 +
 supabase/functions/character-chat-reply/index.ts   |   806 +
 .../check-journal-psychoeducation/index.ts         |   126 +
 supabase/functions/check-journal-risk/index.ts     |   205 +
 supabase/functions/create-razorpay-order/index.ts  |   244 +
 .../crisis-classifier-health-check/index.ts        |   162 +
 .../functions/database-backup-offsite/index.ts     |   230 +
 supabase/functions/database-backup/index.ts        |   161 +
 supabase/functions/delete-user-account/index.ts    |   218 +
 supabase/functions/error-alert-monitor/index.ts    |   130 +
 .../functions/extract-character-memories/index.ts  |   152 +
 supabase/functions/google-calendar-oauth/index.ts  |   237 +
 supabase/functions/google-calendar-sync/index.ts   |   588 +
 supabase/functions/notification-scheduler/index.ts |   347 +
 supabase/functions/play-console-status/index.ts    |   133 +
 .../functions/publish-production-release/index.ts  |   143 +
 .../functions/razorpay-payment-callback/index.ts   |    16 +
 supabase/functions/razorpay-webhook/index.ts       |   154 +
 .../send-apk-update-notification/index.ts          |    86 +
 supabase/functions/send-group-poll/index.ts        |   158 +
 supabase/functions/send-push-notification/index.ts |   531 +
 supabase/functions/send-task-alarms/index.ts       |    70 +
 .../functions/sync-test-result-to-hubspot/index.ts |   278 +
 .../functions/temp-create-templates-v2/index.ts    |    82 +
 supabase/functions/temp-deactivate-alpha/index.ts  |   105 +
 supabase/functions/transcribe-audio/index.ts       |   198 +
 .../functions/update-donate-page-meta/index.ts     |   187 +
 supabase/functions/uptime-monitor/index.ts         |   151 +
 supabase/functions/whatsapp-webhook/index.ts       |    44 +
 supabase/migrations/calendar_schema.sql            |    21 +
 supabase/migrations/calendar_sync_schema.sql       |    64 +
 supabase/migrations/chat_helpers.sql               |    45 +
 supabase/migrations/chat_rls.sql                   |    31 +
 supabase/migrations/chat_schema.sql                |    43 +
 supabase/migrations/claim_razorpay_order_slot.sql  |    36 +
 supabase/migrations/consume_gcal_state_token.sql   |    25 +
 supabase/migrations/coordination_trigger.sql       |    71 +
 supabase/migrations/delete_user_data_atomic.sql    |    54 +
 supabase/migrations/facilitator_profile_policy.sql |    26 +
 supabase/migrations/fix_room_visibility.sql        |    21 +
 supabase/migrations/gcal_state_tokens.sql          |    10 +
 supabase/migrations/gcal_watch_renewal_cron.sql    |     9 +
 supabase/migrations/group_polls.sql                |     4 +
 .../hubspot_test_result_sync_trigger.sql           |    22 +
 supabase/migrations/reserve_availability_slot.sql  |    33 +
 terms-of-service.html                              |    97 +
 version.json                                       |     1 +
 vintage-bg-alt.jpg                                 |   Bin 0 -> 75136 bytes
 vintage-bg-cover.jpg                               |   Bin 0 -> 77998 bytes
 vintage-bg-index.jpg                               |   Bin 0 -> 32012 bytes
 vintage-bg-journal.jpg                             |   Bin 0 -> 28775 bytes
 164 files changed, 46914 insertions(+)
```

---

## Commit `1f27f1d` — 2026-09-26T22:32:39+00:00

**Subject**: docs: record tonight's real WhatsApp Business API work (MASTER §10, BUG_LOG #98-103, PROJECT_STATUS)

```diff
commit 1f27f1d9f2ca84ae497c915965cdec057678d60a
Author: Claude <claude@hobsfoundation.com>
Date:   Sat Sep 26 22:32:39 2026 +0000

    docs: record tonight's real WhatsApp Business API work (MASTER §10, BUG_LOG #98-103, PROJECT_STATUS)
    
    Covers: WABA/template mismatch and fix, the new-number delivery-warmup
    root cause (confirmed via Meta's own analytics, not guessed), leftover
    exposed diagnostic functions cleaned up, permanent phone-number data
    safeguard, and the real open items (admin notifications, remaining
    templates, contract-gating verification) that are NOT yet built.
    
    Also fixes a real mistake this session: WhatsApp integration state was
    initially written to a claude.ai Project doc instead of here. This repo's
    docs/MASTER.md, PROJECT_STATUS.md and BUG_LOG.md are the actual single
    source of truth per this project's own established convention.

diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index ca3d242..cd3f9e6 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -1801,6 +1801,84 @@ report were removed directly, rather than left sitting there unresolved forever.
 
 ---
 
+## September 27, 2026 — WhatsApp Business API integration, a delivery mystery, and a real doc-location mistake
+
+### 98. Session reset mid-work lost all live infrastructure access
+**What happened**: a session working on WhatsApp Business API setup ended and a fresh session
+picked up mid-task with zero persisted context -- no CLI login, no cloned repo, no environment
+variables. Real cost: Akash had to re-supply credentials by hand, in a conversation, before any
+work could resume.
+**Real fix, going forward**: this is exactly the gap `system_credentials` (§2 of `MASTER.md`)
+and this repo's docs exist to close. A fresh session should query `system_credentials` first
+using whatever one starting credential Akash provides, rather than needing everything re-typed
+by hand each time. **This entry exists so a future session recognizes the pattern immediately
+instead of costing Akash the same re-explanation again.**
+
+### 99. WhatsApp number registered under the wrong WABA -- templates don't carry across WABAs
+**What happened**: the real registered number (+91 94262 12083) was created under a new WABA
+(`2585366201875184`), while all previously-approved message templates lived on a *different*
+WABA (`1101168369517284`, an old test account) from earlier work. WhatsApp templates are scoped
+per-WABA, not portable.
+**Real fix**: recreated all 8 templates fresh under the new WABA, using the exact real approved
+content recovered from the old WABA (not reconstructed from memory) -- all approved. Old
+WABA/number kept alive deliberately as a known-good control for future diagnosis.
+
+### 100. New number's sends were "accepted" by the API but never delivered, and Meta's own analytics showed zero -- root-caused, not guessed
+**What happened**: every send returned `200`, a real message ID, `message_status: accepted` --
+but nothing ever arrived, for roughly two hours after the number was first registered.
+**Real root cause, confirmed via direct data, not assumption**: queried Meta's own WABA-level
+analytics (`GET /{waba_id}?fields=analytics.start(...).end(...)`) directly and found **zero**
+sent/delivered for the new number over the same window where the *old* test number's send in the
+same window showed `sent: 1, delivered: 1` -- definitive proof this wasn't a permissions,
+template, or webhook config problem (all of which were separately ruled out and came back
+clean), but Meta's own backend silently holding sends from a brand-new, `quality_rating: UNKNOWN`
+number during its natural warm-up/probation period, with zero error surfaced anywhere in the API
+response.
+**Resolution**: resolved itself after roughly two hours, no intervention -- confirmed via an
+actual delivered message and a follow-up analytics check.
+**Standing lesson, added below**: a "everything says accepted but nothing arrives" report on a
+newly-registered WhatsApp number should check Meta's own analytics directly before assuming a
+config bug -- and just needs real time, not more debugging.
+
+### 101. Six temporary diagnostic Edge Functions left publicly exposing the access token
+**What happened**: while diagnosing #100, several one-off diagnostic Edge Functions were
+deployed with `verify_jwt: false` (required so they're invokable for testing) to call the Graph
+API using the stored `WHATSAPP_ACCESS_TOKEN` secret. Each one was meant to be deleted right after
+its one use, but six of them (`wa-check-numbers`, `wa-diag2`, `wa-diag3`, `wa-diag4`,
+`wa-check-webhook-store`, `wa-resend-once`) were left deployed and publicly invokable, with the
+real access token reachable through them, for the rest of the session until a later cleanup pass
+caught them.
+**Real fix**: all six deleted. **Standing lesson, added below**: delete each temporary diagnostic
+function immediately after that one use, not batched for a "cleanup later" pass -- a public
+endpoint holding a path to a real secret is a real exposure for every minute it exists, not just
+if someone eventually finds it.
+
+### 102. Fake and country-code-less phone numbers were sitting in production data undetected
+**What happened**: `profiles.phone_number` had no format enforcement -- real numbers were stored
+inconsistently (some with `+91`, most bare 10-digit), and two outright fake values had gone
+unnoticed: `9876543210` (the classic sequential dummy number) and `99999999999` (11 identical
+digits), both on test accounts.
+**Real fix**: added `public.is_valid_wa_phone(text)` (real Indian-mobile pattern check,
+rejects all-identical-digit numbers and known dummy sequences) and enforced it via CHECK
+constraints on `profiles.phone_number` and `profiles.emergency_contact_phone` -- confirmed
+by testing that Postgres itself now rejects a fake write, not just application-level filtering.
+Existing valid numbers normalized to include `+91`; the two fake ones nulled (both on test-only
+accounts, not real users).
+
+### 103. This session initially wrote "the master doc" into the wrong place entirely
+**What happened**: rather than reading and updating this repo's actual `docs/MASTER.md` (the
+established, real single source of truth per §0 of that file), a session wrote a duplicate
+summary of the WhatsApp work into a separate claude.ai Project memory doc instead -- a place nobody
+else, and no future session working from this repo, would ever find it. Akash had to point this
+out directly and supply this repo's own real handoff docs before the actual gap got closed.
+**Real fix**: this entry, plus the real §10 addition to `MASTER.md` and the real updates to
+`PROJECT_STATUS.md` above, replacing the misplaced copy.
+**Standing lesson, added below**: this repo's `docs/MASTER.md`, `PROJECT_STATUS.md`, and
+`BUG_LOG.md` are the one real, permanent source of truth for this project. A session's own memory
+tooling, or any other side document, is not a substitute for actually updating these files, ever.
+
+---
+
 ## Standing lessons (do not re-learn these)
 
 **Run `deployment/verify-before-deploy.sh` before every single deploy, web or Android, no
@@ -1859,3 +1937,19 @@ Skipping this check is how the exact same class of bug happens again.
   depends on a manually maintained list of every real panel id (`allPanels`); a new panel left out
   of it renders perfectly underneath a `display: none` that never lifts (#93). Check the actual
   computed `display` value on a new panel, not just that its inner HTML looks right.
+- **Delete every temporary diagnostic/debug Edge Function immediately after its one real use, not
+  in a later batched cleanup pass (#101).** Any function deployed with `verify_jwt: false` to test
+  something is a public endpoint for as long as it exists -- if it touches a real secret (an
+  access token, an API key) via `Deno.env.get`, that secret is reachable through it for every
+  minute it's left deployed.
+- **A brand-new WhatsApp Cloud API number returning `accepted` on every send while nothing
+  actually arrives is very likely the number's own quality-rating warm-up period, not a config bug
+  (#100).** Confirm via Meta's own WABA-level analytics endpoint directly (zero sent/delivered is
+  the real signature) before assuming permissions, templates, or webhooks are broken -- and know
+  that it typically resolves on its own with time, not more debugging.
+- **This repo's `docs/MASTER.md`, `PROJECT_STATUS.md`, and `BUG_LOG.md` are the one real,
+  permanent source of truth for this project's state -- not a session's own memory tooling, not a
+  separate document anywhere else (#103).** If a session's tooling offers a place to save "project
+  context" that isn't one of these three files, that is not where this project's real state lives,
+  and using it instead of updating these files recreates the exact gap this repo was built to
+  close.
diff --git a/docs/MASTER.md b/docs/MASTER.md
index 96a5b10..5f79c3f 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -1,5 +1,6 @@
 # HOBS Companion — Master Reference
-Last rebuilt: September 16, 2026. **Read this file first, before doing anything else, at the start
+Last rebuilt: September 16, 2026. Last real update: September 27, 2026 (§10, WhatsApp Business
+API). **Read this file first, before doing anything else, at the start
 of any session working on this project** — whether this is a fresh chat, a sandbox reset, or
 just picking this up after time away. This is the single entry point everything else is
 findable from.
@@ -183,6 +184,8 @@ notes.
 | `send-group-poll` | Sends the recurring support-group check-in prompts (morning/evening/variety). |
 | `send-push-notification` | Shared, generic push-send function every other function calls. Accepts a `data` field for deep-link routing (see `handleNotificationTap` in the client). Also the real delivery mechanism for crisis escalation -- accepts a `bypassPause: true` flag (deliberate: a routine "notifications paused" preference must never be able to silently suppress a genuine crisis alert), and a real fallback so even a recipient with no registered device still gets a persistent, queryable log entry rather than the alert vanishing with zero trace. |
 | `send-task-alarms` | Runs every minute; fires task-specific alarms at their set time. |
+| `send-whatsapp-template` | **New Sept 27, 2026.** Generic WhatsApp Cloud API template sender -- see §10. Takes `{to, template, params, lang?}`, requires header `x-scheduler-secret` (same secret as every other internal function-to-function call in this project), normalizes the phone number, sends via Meta Graph API. Every real send is auto-logged by `pg_net`'s own `net._http_response` table -- no separate logging needed. |
+| `whatsapp-webhook` | Meta's webhook endpoint for the registered WhatsApp number -- inbound messages and delivery-status callbacks. Persists every real event into `whatsapp_webhook_events` (see §10). |
 | `sync-test-result-to-hubspot` | Pushes psychometric test results to HubSpot CRM. |
 | `transcribe-audio` | Voice-to-text for journal entries (AssemblyAI). |
 | `update-donate-page-meta` | Keeps the public donate page's metadata current. |
@@ -375,7 +378,72 @@ this feature on your own initiative.
 
 ---
 
-## 10. Standing communication preferences (do not relearn these either)
+## 10. WhatsApp Business API (Cloud API) — real, current status (new Sept 27, 2026)
+
+**Live facts**: registered number **+91 94262 12083**, Phone Number ID `1347122808487896`, under
+WABA `2585366201875184` ("Home of Beautiful Souls Foundation"), Meta App ID `2627243291067381`
+("HOBS Companion App"). All 8 real templates are `APPROVED` on this WABA: `hobs_sos_alert`,
+`hobs_professional_assigned`, `hobs_appointment_update`, `hobs_missed_appointment`,
+`hobs_payment_update`, `hobs_disconnect_request`, `hobs_agreement_signed`, `hobs_system_alert`
+(exact param order for each is in the WABA itself -- query
+`GET /{waba_id}/message_templates` rather than trusting a stale copy of this list).
+
+**Real incident, resolved**: the number was originally registered under a *different* WABA
+(`2585366201875184`, new) than the one holding the already-approved templates
+(`1101168369517284`, old "Test WhatsApp Business Account") -- templates don't carry across WABAs.
+Fixed by recreating all 8 templates fresh under the new WABA (all approved). The old WABA/test
+number (`+1 555-194-7836`) still exists and still works -- useful as a known-good control when
+diagnosing delivery issues on the real number.
+
+**Real incident, resolved**: for roughly the first two hours after registering, the API accepted
+every send (`200`, real message ID, `message_status: accepted`) but Meta's own analytics
+(`GET /{waba_id}?fields=analytics...`) showed **zero** sent/delivered the entire time, and the
+recipient never received anything -- root-caused, via that direct analytics query (not
+speculation), to the number's `quality_rating: UNKNOWN` warm-up/probation period that a brand-new
+Cloud API number goes through, during which Meta can silently hold sends with no error surfaced
+anywhere in the API response. **Resolved itself after ~2 hours with zero intervention** --
+confirmed via a real delivered message. **Standing lesson**: if a freshly registered number's
+sends are all `accepted` but nothing arrives and analytics shows 0, this is very likely the same
+thing -- check Meta's analytics directly rather than assuming a config problem, and give it real
+time before escalating.
+
+**What's actually built and wired**:
+- Generic sender: `send-whatsapp-template` Edge Function (see §4).
+- One real trigger live in production: Postgres trigger `notify_professional_assigned` on
+  `public.profiles`, fires when `assigned_therapist_user_id` / `assigned_psychiatrist_user_id` /
+  `assigned_doctor_user_id` / `assigned_caregiver_user_id` changes to non-null. Sends
+  `hobs_professional_assigned` to the **client** (not the professional, not admin). Confirmed
+  live and delivered.
+- Phone number data safeguard, permanent, DB-level: `public.is_valid_wa_phone(text)` requires
+  `+91` + a real 10-digit Indian mobile pattern (starts 6-9), rejects all-identical-digit numbers
+  and known dummy sequences (`9876543210` etc). Enforced via CHECK constraints
+  `profiles_phone_number_valid` and `profiles_emergency_phone_valid` on `public.profiles` --
+  confirmed by testing that a fake number write is actually rejected by Postgres itself, not just
+  filtered by application code. Existing data was normalized (bare 10-digit numbers got `+91`
+  prepended); two fake numbers on test-only accounts were nulled.
+- Secrets used, values intentionally not recorded here per §2 policy: `WHATSAPP_ACCESS_TOKEN`,
+  `WHATSAPP_PHONE_NUMBER_ID` (Supabase Edge Function secrets, production project). Note:
+  `WHATSAPP_ACCESS_TOKEN` needs periodic manual rotation via the WhatsApp Manager API Setup page
+  -- if sends start failing with a permission/access error, this is the first thing to check.
+
+**Explicitly NOT built yet — real, current gaps**:
+- Admin (Akash, `+91 8320470976`) does not get notified of anything yet. Requested Sept 27,
+  2026: a WhatsApp message to admin whenever a client books an appointment, a client or
+  therapist cancels, or a crisis is flagged. Not started. Relevant tables: `expert_bookings`
+  (status values `active`/`pending`/`cancelled`) for booking/cancel events; crisis flag lives on
+  `test_results` (`elevated`, `self_harm_flagged`) -- read the existing `check-journal-risk`
+  function first before wiring anything on top, to avoid duplicating its logic.
+- The other 7 approved templates beyond `hobs_professional_assigned` are not wired to anything.
+- The SOS button's emergency-contact-reaching mechanism decision (see `PROJECT_STATUS.md`) can
+  now realistically use this Cloud API setup instead of treating it as a future hypothetical --
+  the plumbing genuinely exists now. Still needs the actual SOS-button UI/trigger built and a
+  real decision on exactly who receives `hobs_sos_alert` and when.
+- Whether client-facing UI should surface a therapist's own WhatsApp number to the client
+  directly (e.g. a tap-to-chat link) -- raised, explicitly deferred by Akash, not built.
+
+---
+
+## 12. Standing communication preferences (do not relearn these either)
 
 - Short messages. No long paragraphs unless explicitly asked for detail.
 - Ask before anything consequential or hard to reverse — a real yes/no question, and wait for a
diff --git a/docs/PROJECT_STATUS.md b/docs/PROJECT_STATUS.md
index bda70df..1e52475 100644
--- a/docs/PROJECT_STATUS.md
+++ b/docs/PROJECT_STATUS.md
@@ -113,6 +113,27 @@ correctly wired everywhere instead of an old, bypassing shortcut.
       specifically -- not separately re-verified end-to-end for Psychiatrist/Doctor/Caregiver,
       even though the underlying logic is now genuinely role-agnostic.
 
+## WhatsApp Business API integration — built Sept 27, 2026, real status
+
+Full detail in `docs/MASTER.md` §10. **Live and confirmed**: real registered number, all 8
+templates approved, generic sender function, one real trigger (`notify_professional_assigned` —
+client gets a WhatsApp message when a professional is assigned), and a permanent DB-level
+safeguard against fake/country-code-less phone numbers.
+
+**Not yet built, real open items**:
+- [ ] Admin (Akash) WhatsApp notification for: client books an appointment, client or therapist
+      cancels, a crisis is flagged. Requested Sept 27, 2026, nothing built yet.
+- [ ] The other 7 approved templates (`hobs_appointment_update`, `hobs_missed_appointment`,
+      `hobs_payment_update`, `hobs_disconnect_request`, `hobs_agreement_signed`,
+      `hobs_sos_alert`, `hobs_system_alert`) — approved but not wired to any real trigger yet.
+- [ ] App contract / therapy contract gating ("no user proceeds without signing the app
+      contract, no client proceeds without the therapy contract") — discussed in an earlier
+      session; **unverified whether this actually exists in the app's UI/navigation code** — the
+      DB scaffolding exists (`profiles.basic_tos_signed`, `ai_disclaimer_signed`,
+      `consent_signed`, the `consent_agreements` table) but nobody has actually read the app
+      code to confirm a gate is enforced. Needs checking directly against `index.html`'s real
+      onboarding/routing logic, not assumed from the column names existing.
+
 ## Other real, outstanding items (not blockers, but genuinely open)
 
 - [ ] **Real native task/subtask alarm** -- attempted Aug 26, 2026, crashed on the real device
@@ -135,9 +156,12 @@ correctly wired everywhere instead of an old, bypassing shortcut.
 - [ ] Tasklist constellation redesign — prototype exists, never decided on
 - [ ] React migration — deliberately paused until the external developer is confirmed ready
 - [ ] In-app day/month calendar view — not built yet
-- [ ] SOS button — fully scoped (see character AI master scope doc), blocked specifically on
-      the emergency-contact-reaching mechanism decision (paid SMS/WhatsApp Business API with
-      DLT registration, vs. a lower-fidelity manual-tap WhatsApp link)
+- [ ] SOS button — fully scoped (see character AI master scope doc). **Update Sept 27, 2026**:
+      the WhatsApp Business Cloud API side of this decision is no longer hypothetical -- it's
+      actually set up and live (see `docs/MASTER.md` §10): a real registered number, all 8
+      templates approved including `hobs_sos_alert`, a working generic sender function. Still
+      blocked on: the actual SOS-button UI/trigger itself (not built), and deciding exactly who
+      receives the SOS alert and when.
 - [ ] Automated email marketing — never scoped at all, needs its own conversation
 - [ ] Real streaming for Bob's replies (perceived response speed) -- raised repeatedly as a real
       concern; explicitly not started pending explicit go-ahead, given the real scope of the
```

---

## Commit `262c7bf` — 2026-09-26T23:24:53+00:00

**Subject**: docs: full Edge Function audit against live Supabase state, contract-gating question resolved, session-reset safeguard added

```diff
commit 262c7bf0fc165701a1ca9822ba9605a7fbaf1df7
Author: Claude <claude@hobsfoundation.com>
Date:   Sat Sep 26 23:24:53 2026 +0000

    docs: full Edge Function audit against live Supabase state, contract-gating question resolved, session-reset safeguard added
    
    - MASTER.md §4: added 4 real, live, undocumented functions (crisis-classifier-health-check,
      play-console-status, publish-production-release, razorpay-payment-callback); corrected
      transcribe-audio's real provider (Gladia primary + Groq/Whisper fallback, not AssemblyAI);
      flagged temp-create-templates-v2 and temp-deactivate-alpha as live+unauthenticated, awaiting
      deletion go-ahead; noted harmless leftover test-embedding
    - MASTER.md §2: corrected secrets list to match (GLADIA_API_KEY, WHATSAPP_* secrets)
    - MASTER.md §11 (new): standing safeguard against session-reset drift
    - MASTER.md: fixed the §10/§11/§12 numbering gap
    - CLAUDE.md (new, repo root): auto-loads for any future session, points to the three real docs,
      restates the standing rules structurally rather than relying on memory
    - PROJECT_STATUS.md: app/therapy contract-gating question resolved (confirmed real and enforced
      on production v74/v82, staging still on the older/narrower version); new security-cleanup
      section for the two live unauthenticated temp functions
    - BUG_LOG.md: #104-107 (leftover unauthenticated temp functions, send-whatsapp-template missing
      from source control, transcribe-audio doc staleness, contract-gating resolution) + 4 new
      standing lessons
    - supabase/functions/send-whatsapp-template/index.ts (new): pulled the real, live source into
      version control -- it existed only on Supabase's servers until now
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..76bb100
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,39 @@
+# HOBS Companion — read this before doing anything else
+
+This file loads automatically for any Claude Code session with this repo attached. It exists
+because relying on a session remembering to read the docs, or trusting a chat summary/uploaded
+zip over live state, has caused real, repeated problems in this project's history (see
+`docs/BUG_LOG.md` #98-107). Follow this before making any claim or change.
+
+## Before doing anything else, this session
+
+1. Read `docs/MASTER.md` in full. It is the single entry point and links to everything else.
+2. Read `docs/PROJECT_STATUS.md` for what's currently open.
+3. Read `docs/BUG_LOG.md` in full, including the standing lessons at the end — several real bugs
+   in this project's history happened because an earlier entry in this same file was skipped.
+
+## Standing rules (restated from `docs/MASTER.md` §11-12 — read those for full context)
+
+- **Live state beats everything else.** An uploaded zip, a chat summary, or memory of a previous
+  session can all be stale. The real repo, the real Supabase project, and the real deployed Edge
+  Functions are ground truth — diff against them before trusting anything else, every time.
+- **Never state something is built, fixed, live, or working without showing the actual
+  verification in the same message** — a real query result, a real deployed-function list, a
+  real log line. Not a plausible-sounding claim.
+- **Ask before anything consequential or hard to reverse** — a production write, a deploy, a
+  database change, deleting a deployed function. Investigation and read-only checks don't need
+  this; the actual write/deploy/delete step does.
+- **Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
+  describing real work on this app ends.** Not "next session." This file only helps if those
+  three stay current.
+- Communication: short, direct messages. No long paragraphs unless explicitly asked for detail.
+  Akash (the founder) is neurodivergent (ADHD) and has said this explicitly, more than once.
+
+## Periodic Edge Function audit
+
+Compare, directly, on a regular basis: (a) every function actually deployed
+(`GET /v1/projects/{ref}/functions` via the Supabase Management API), (b) every function in
+`supabase/functions/` in this repo, (c) every function listed in `docs/MASTER.md` §4. The
+Sept 27, 2026 audit alone found 4 undocumented live functions, 2 live unauthenticated
+"temporary" functions that should have been deleted, one function with no source-control
+backup, and one stale provider name. Do not assume a clean state — check it.
diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index cd3f9e6..7e47d04 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -1877,6 +1877,62 @@ out directly and supply this repo's own real handoff docs before the actual gap
 `BUG_LOG.md` are the one real, permanent source of truth for this project. A session's own memory
 tooling, or any other side document, is not a substitute for actually updating these files, ever.
 
+### 104. Two "temporary, one-time-use" Edge Functions were still live and unauthenticated weeks after their one real job was done
+**What happened**: a full audit (Sept 27, 2026) of every Edge Function actually deployed on
+Supabase, diffed against both this repo and `MASTER.md`'s own function table, found
+`temp-create-templates-v2` and `temp-deactivate-alpha` still `ACTIVE` and still `verify_jwt:
+false` (callable by anyone with the URL, no login required) despite each one's own source comment
+explicitly labeling itself "TEMPORARY, one-time-use." Same root cause as #101 (six leftover
+diagnostic functions the same day) -- a function built to be temporary needs an explicit deletion
+step, or it just stays live and exposed indefinitely.
+**Real fix**: not deleted yet as of this entry -- flagged in `PROJECT_STATUS.md` under Security
+cleanup, awaiting Akash's explicit go-ahead before deleting (deleting a live deployed function is
+itself a write action against production, per §5 of `MASTER.md`).
+**Standing lesson, added below**: a function labeled "temporary" or "one-time-use" in its own
+source needs to actually be deleted the moment its one job is done -- flagging it as temporary in
+a comment is not a cleanup step, it's a note nobody reads until the next audit.
+
+### 105. `send-whatsapp-template` was live in production with no copy of its source anywhere in this repo
+**What happened**: the same Sept 27 audit found this function deployed and working, but its
+source had only ever been written directly via the Supabase Management API, never committed. If
+it had ever needed to be redeployed or debugged from scratch, there was no version-controlled
+copy to work from -- only whatever was still live on Supabase's servers.
+**Real fix**: the real, live source (confirmed byte-identical against the actual deployed
+function, not reconstructed from memory) is now committed at
+`supabase/functions/send-whatsapp-template/index.ts`.
+**Standing lesson, added below**: any Edge Function deployed directly via the Management API
+(rather than through a normal `git`-tracked deploy) needs its source pulled back into the repo in
+the same session it's created, not assumed to be safe because it's "working."
+
+### 106. `MASTER.md`'s own function table said `transcribe-audio` used AssemblyAI; the real, live function has used Gladia (primary) with Groq/Whisper (fallback) for some time
+**What happened**: checked directly against the real deployed source, not assumed from the
+table. AssemblyAI is not called anywhere in the function. The real primary provider is Gladia
+(Solaria model), switched to deliberately for accuracy (~94% word accuracy vs Whisper's ~92.4%,
+Deepgram's 93.5%, AssemblyAI's 91.5%) and a genuine no-training guarantee; Groq's Whisper
+(`whisper-large-v3-turbo`) is the automatic fallback if Gladia is unavailable. `MASTER.md` still
+listed the old provider, and still listed `ASSEMBLYAI_API_KEY` as a secret to worry about instead
+of `GLADIA_API_KEY`.
+**Real fix**: `MASTER.md` §4 and §2 corrected in the same session this was found.
+**Standing lesson, added below**: a documented "what provider does X" fact needs re-checking
+against the real deployed source whenever anything nearby changes, not carried forward
+indefinitely from whenever it was first written.
+
+### 107. The staging APK currently in circulation is behind production on the universal consent-gate fix, and this was the actual, resolvable answer to a months-old open question
+**What happened**: `PROJECT_STATUS.md` had carried "app/therapy contract gating -- unverified
+whether this actually exists in code" as an open item for months. Given both the current
+production and staging APKs directly, extracting and diffing their real `index.html` resolved it
+completely: the gate is real, is enforced (`showConsentGate()`, called at the real app-entry
+point and again before booking a session), and is universal on production as of `v74`/`v82`. But
+staging (`staging-v42-transcription-save-race-fix`) still has the older, narrower version of the
+same gate (`appState.userHasAnyClinicalConnection` required) -- it was branched before the
+universal-gate fix landed, to test an unrelated transcription bug.
+**Real fix**: `PROJECT_STATUS.md` updated to mark this resolved, with the staging caveat recorded
+explicitly so nobody tests contract-gating behavior on staging and draws the wrong conclusion.
+**Standing lesson, added below**: an "unverified in code" item does not require new code to
+resolve -- it can often be answered directly from an APK or repo already in hand, just never
+actually checked. And staging is not automatically ahead of production on every fix; check which
+build a specific fix actually landed in before assuming either one is current.
+
 ---
 
 ## Standing lessons (do not re-learn these)
@@ -1953,3 +2009,16 @@ Skipping this check is how the exact same class of bug happens again.
   context" that isn't one of these three files, that is not where this project's real state lives,
   and using it instead of updating these files recreates the exact gap this repo was built to
   close.
+- **A function labeled "temporary" in its own source comment still needs an explicit deletion
+  step (#104).** Flagging something as temporary is not the same as removing it -- it just stays
+  live, exposed, and forgotten until the next audit happens to find it.
+- **Any Edge Function ever deployed directly via the Management API needs its source pulled back
+  into the repo the same session, not left living only on Supabase's servers (#105).**
+- **A documented fact about which provider/library a function uses goes stale the moment that
+  function changes and nobody updates the doc -- re-check it directly against deployed source
+  rather than trusting what's already written, especially for anything that's changed before
+  (#106).**
+- **Run a full Edge Function audit periodically**: list everything actually deployed
+  (`GET /v1/projects/{ref}/functions`), diff it against both this repo's `supabase/functions/`
+  directory and `MASTER.md`'s own function table. All of #104-#106 were found in one such audit;
+  assume more exist until a clean one says otherwise (see `MASTER.md` §11).
diff --git a/docs/MASTER.md b/docs/MASTER.md
index 5f79c3f..7776a02 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -1,9 +1,13 @@
 # HOBS Companion — Master Reference
-Last rebuilt: September 16, 2026. Last real update: September 27, 2026 (§10, WhatsApp Business
-API). **Read this file first, before doing anything else, at the start
+Last rebuilt: September 16, 2026. Last real update: September 27, 2026 (§10 WhatsApp Business
+API; §4 Edge Function audit -- 4 undocumented live functions added, 2 live unauthenticated
+"temporary" functions flagged for deletion, `transcribe-audio`'s real provider corrected; §12
+new standing safeguard against session-reset drift; CLAUDE.md added at repo root). **Read this
+file first, before doing anything else, at the start
 of any session working on this project** — whether this is a fresh chat, a sandbox reset, or
 just picking this up after time away. This is the single entry point everything else is
-findable from.
+findable from. If a `CLAUDE.md` loaded automatically before you saw this line, that is
+deliberate — see §12.
 
 ---
 
@@ -126,8 +130,13 @@ but their actual values are only in Akash's own records or the original source t
 If a function using one of these starts failing, this is why — get the real value from Akash,
 don't try to guess or regenerate: `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
 `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `HUBSPOT_API_TOKEN`,
-`ASSEMBLYAI_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
-`SCHEDULER_SECRET`.
+`GLADIA_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
+`SCHEDULER_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.
+**Corrected Sept 27, 2026**: this list previously said `ASSEMBLYAI_API_KEY` — checked directly
+against the real, deployed `transcribe-audio` source and AssemblyAI isn't used anywhere in it.
+The function actually uses `GLADIA_API_KEY` (primary provider, Gladia/Solaria) with
+`GROQ_API_KEY` as its automatic fallback (see §4). `ASSEMBLYAI_API_KEY` may still exist as a
+leftover secret from before that switch; it's no longer load-bearing for anything.
 
 ---
 
@@ -171,6 +180,7 @@ notes.
 | `check-journal-risk` | The AI crisis classifier for journal entries specifically — see §3. |
 | `check-journal-psychoeducation` | Reads journal entries for non-death depression/anxiety signals and physical-symptom patterns, routing toward the right real test (PHQ-9/GAD-7/PSQI) or the right kind of professional (GP/psychiatrist/therapist) via the existing mascot-tip system. Completely separate from and additive to the crisis check -- never a replacement. |
 | `create-razorpay-order` | Payment order creation for donations/sessions. |
+| `crisis-classifier-health-check` | **Undocumented until Sept 27, 2026 audit -- live and real.** Real, direct answer to "make the classifier fail-proof, no matter what": built after `check-journal-risk` broke silently for real days in September (invalid API key, then a deprecated model) and nobody noticed until logs were checked by chance. Monitors that the classifier is actually reachable and responding, not just deployed. |
 | `database-backup` | Daily Postgres backup. |
 | `database-backup-offsite` | Daily backup mirrored to a separate location. |
 | `delete-user-account` | Full account deletion, atomic. |
@@ -179,18 +189,38 @@ notes.
 | `google-calendar-oauth` | OAuth flow for therapist Google Calendar linking. |
 | `google-calendar-sync` | Keeps calendar availability in sync; watch channel renewed every 6h via cron. |
 | `notification-scheduler` | Runs every 15 min; fires scheduled reminders (task alarms, mood check-ins, etc.). |
+| `play-console-status` | **Undocumented until Sept 27, 2026 audit -- live and real.** Real integration with the Google Play Developer API (Android Publisher API) via a service-account signed JWT (RS256, Deno's built-in Web Crypto, no external library). Reads real track/release status. Read-only by design -- opens the required Android-Publisher "edit" session (mandatory even for reads) and always explicitly deletes it at the end, success or failure, so nothing it does can ever change what's actually live. This is what `PROJECT_STATUS.md`'s Play Store section verified against. |
+| `publish-production-release` | **Undocumented until Sept 27, 2026 audit -- live and real.** Full automation to take an already-built, already-verified production AAB live: upload it, create the release, roll it out -- not stopping at a draft. Reuses the same auth already proven in `play-console-status`. Real, consequential write action -- confirm with Akash before ever calling this, per §5's production-action rule. |
+| `razorpay-payment-callback` | **Undocumented until Sept 27, 2026 audit -- live and real.** Required by Razorpay's own documented WebView integration pattern (their standard checkout doesn't reliably work in an embedded WebView) -- this is the `callback_url` their checkout POSTs to after a payment attempt. Only sends the WebView back to a real in-app page; does **not** verify or record the payment itself -- `razorpay-webhook` (server-to-server, independently signature-verified) remains the only thing allowed to mark a donation/payment as real. |
 | `razorpay-webhook` | Payment confirmation webhook. |
 | `send-apk-update-notification` | Daily; notifies users of a new app version if one exists. |
 | `send-group-poll` | Sends the recurring support-group check-in prompts (morning/evening/variety). |
 | `send-push-notification` | Shared, generic push-send function every other function calls. Accepts a `data` field for deep-link routing (see `handleNotificationTap` in the client). Also the real delivery mechanism for crisis escalation -- accepts a `bypassPause: true` flag (deliberate: a routine "notifications paused" preference must never be able to silently suppress a genuine crisis alert), and a real fallback so even a recipient with no registered device still gets a persistent, queryable log entry rather than the alert vanishing with zero trace. |
 | `send-task-alarms` | Runs every minute; fires task-specific alarms at their set time. |
-| `send-whatsapp-template` | **New Sept 27, 2026.** Generic WhatsApp Cloud API template sender -- see §10. Takes `{to, template, params, lang?}`, requires header `x-scheduler-secret` (same secret as every other internal function-to-function call in this project), normalizes the phone number, sends via Meta Graph API. Every real send is auto-logged by `pg_net`'s own `net._http_response` table -- no separate logging needed. |
+| `send-whatsapp-template` | **New Sept 27, 2026.** Generic WhatsApp Cloud API template sender -- see §10. Takes `{to, template, params, lang?}`, requires header `x-scheduler-secret` (same secret as every other internal function-to-function call in this project), normalizes the phone number, sends via Meta Graph API. Every real send is auto-logged by `pg_net`'s own `net._http_response` table -- no separate logging needed. **Real gap, fixed same day**: this was live on Supabase for hours with no copy of its source committed anywhere in this repo -- see `supabase/functions/send-whatsapp-template/index.ts`, now committed. |
 | `whatsapp-webhook` | Meta's webhook endpoint for the registered WhatsApp number -- inbound messages and delivery-status callbacks. Persists every real event into `whatsapp_webhook_events` (see §10). |
 | `sync-test-result-to-hubspot` | Pushes psychometric test results to HubSpot CRM. |
-| `transcribe-audio` | Voice-to-text for journal entries (AssemblyAI). |
+| `transcribe-audio` | Voice-to-text for journal entries. **Corrected Sept 27, 2026**: this row said "(AssemblyAI)" -- wrong, checked directly against the real deployed source. Real primary provider is **Gladia (Solaria model)**, switched to deliberately for accuracy (benchmarks ~94% word accuracy on English vs Whisper's ~92.4%, Deepgram's 93.5%, AssemblyAI's 91.5%) and a genuine no-training guarantee on its paid tier. **Groq's Whisper** (`whisper-large-v3-turbo`) is the automatic fallback if Gladia is unavailable -- free, already proven not to retain data. AssemblyAI is not called anywhere in this function. |
 | `update-donate-page-meta` | Keeps the public donate page's metadata current. |
 | `uptime-monitor` | Every 5 min; pings prod + staging, alerts on status change. Same real bug as error-alert-monitor, same fix. |
 
+**Two functions deployed live right now that should almost certainly not be** (found in the Sept
+27, 2026 audit, not yet deleted -- awaiting Akash's explicit go-ahead per §5's confirm-before-write
+rule, since deleting a deployed function is itself a write action):
+- `temp-create-templates-v2` -- self-labeled in its own source comment "TEMPORARY, one-time-use",
+  created the finalized WhatsApp templates. Still `ACTIVE`, still `verify_jwt: false` (anyone with
+  the URL can call it, no login required).
+- `temp-deactivate-alpha` -- self-labeled "TEMPORARY, one-time-use", deactivates the Play Store
+  alpha/closed-testing track. Still `ACTIVE`, still `verify_jwt: false`.
+
+Same class of real incident as the six leftover diagnostic WhatsApp-debug functions cleaned up
+earlier the same day (see `BUG_LOG.md`) -- a function built "temporary" needs to actually be
+deleted once its one-time job is done, not just abandoned live and unauthenticated.
+
+Also found, harmless: `test-embedding` -- a scratch test of Supabase's built-in `gte-small`
+embedding model, `verify_jwt: true` (not publicly exposed), never cleaned up, no real purpose
+anymore.
+
 All cron schedules are set via `pg_cron` directly in the production database (not visible in
 this repo as files — query `select jobname, schedule from cron.job;` against production to see
 them live). **Real, important note**: scheduled functions need to be deployed with
@@ -323,7 +353,8 @@ the one exception — do not "fix" it by removing the reference or generating a
 
 ## 7. Full bug history and standing lessons
 
-**Do not skip this.** `docs/BUG_LOG.md` (1514 lines as of this writing) contains 72 detailed,
+**Do not skip this.** `docs/BUG_LOG.md` (check its own line count/entry numbers directly -- do
+not trust a specific number written here, it goes stale fast) contains detailed,
 real, root-caused bug entries plus a running list of standing lessons at its top. Reading it in
 full before starting work is the single highest-leverage thing a new session can do — several of
 the bugs in it were caused by not knowing something an earlier entry in the same file already
@@ -443,6 +474,46 @@ time before escalating.
 
 ---
 
+## 11. Standing safeguard against session-reset drift (new, Sept 27, 2026)
+
+**Why this section exists**: a real, repeated failure mode across this project's history --
+a new chat/session relies on stale summaries, an outdated handoff zip, or its own memory of a
+prior session instead of the actual live repo/database/deployed functions, and reports something
+false as a result. This happened again this same day: an uploaded handoff zip and this file's own
+function table were both stale in different ways, and got caught only by directly diffing live
+Supabase state against both. The fix is not "try harder to remember" -- it's structural.
+
+**The actual structural safeguard, now in place**: a `CLAUDE.md` file at the repo root. Any
+Claude Code session with this repo attached loads it automatically, without needing to be told,
+before doing anything else. It exists specifically so a session reset, a new chat, or a
+completely fresh sandbox cannot silently skip this file the way a plain markdown doc buried in
+`docs/` can be skipped. If you are reading this section but never saw `CLAUDE.md` load
+automatically, something about how this repo was attached is non-standard -- read
+`/CLAUDE.md` directly before continuing.
+
+**The standing rule `CLAUDE.md` enforces, restated here so it survives even if that file is ever
+lost**:
+1. Read `docs/MASTER.md` (this file), `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` in full,
+   every session, before making any claim about current app state -- never from memory of a
+   previous session, never from an uploaded zip or doc without first checking it against the
+   live repo/database/deployed functions.
+2. A zip, PDF, or doc a person uploads may be older than the live repo. Treat the live repo,
+   live Supabase project, and live deployed Edge Functions as ground truth over any uploaded
+   file, any chat summary, and any memory of a prior session -- always diff before trusting.
+3. Never state something is built, fixed, live, or working without showing the actual
+   verification in the same message (a real query result, a real deployed-function list, a real
+   log line) -- see §12 (formerly §12, "Standing communication preferences," renumbered below).
+4. Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
+   describing real work on this app ends -- not "next session," not "later."
+5. Periodically re-audit: list every Edge Function actually deployed (`GET
+   /v1/projects/{ref}/functions` via the Supabase Management API) and diff it against both this
+   file's §4 table and the repo's `supabase/functions/` directory. The Sept 27, 2026 audit alone
+   found 4 real undocumented live functions, 2 live unauthenticated functions that should have
+   been deleted after one-time use, one function with no source control backup at all, and one
+   stale provider name. Assume more exist until a clean audit says otherwise.
+
+---
+
 ## 12. Standing communication preferences (do not relearn these either)
 
 - Short messages. No long paragraphs unless explicitly asked for detail.
diff --git a/docs/PROJECT_STATUS.md b/docs/PROJECT_STATUS.md
index 1e52475..2ad1a6e 100644
--- a/docs/PROJECT_STATUS.md
+++ b/docs/PROJECT_STATUS.md
@@ -5,15 +5,21 @@ submission, launch-readiness) — separate from `docs/BUG_LOG.md`, which is for
 Kept as plain markdown in the repo deliberately, so it survives environment resets without
 needing to rebuild a document-generation pipeline just to update one line.
 
-*Last updated Sept 17, 2026, after a second full day's real work on top of Sept 16: real,
-per-session history for every professional relationship (not just the single most recent date),
-a working direct-chat system generalized to all four real professional roles (Therapist,
-Psychiatrist, Doctor, Caregiver), a real Session Log surfaced in three separate real UI
-locations, per-session homework with a real accept step and completion notifications, real
-red/green notes-upload tracking and a persisted Google Meet link per session, a real professional
-schedule view, a genuine, root-caused fix for the Calendar-reconnect-vs-auto-reload interaction,
-and a full, honest catch-up of `docs/BUG_LOG.md` covering two real sessions that had never been
-logged at all.*
+*Last updated Sept 27, 2026: WhatsApp Business API integration (see below and `MASTER.md` §10);
+a full Edge Function audit against live Supabase state found 4 undocumented live functions, 2
+live unauthenticated "temporary" functions awaiting deletion, one function with no source-control
+backup, and one stale provider name (`transcribe-audio` -- real primary is Gladia, not
+AssemblyAI); the long-open app/therapy contract-gating question resolved (confirmed real and
+enforced, see below); a new standing safeguard against session-reset drift added to `MASTER.md`
+§11, plus a repo-root `CLAUDE.md` that auto-loads it. Previous update Sept 17, 2026, after a
+second full day's real work on top of Sept 16: real, per-session history for every professional
+relationship (not just the single most recent date), a working direct-chat system generalized to
+all four real professional roles (Therapist, Psychiatrist, Doctor, Caregiver), a real Session Log
+surfaced in three separate real UI locations, per-session homework with a real accept step and
+completion notifications, real red/green notes-upload tracking and a persisted Google Meet link
+per session, a real professional schedule view, a genuine, root-caused fix for the
+Calendar-reconnect-vs-auto-reload interaction, and a full, honest catch-up of `docs/BUG_LOG.md`
+covering two real sessions that had never been logged at all.*
 
 ## Play Store submission blockers
 
@@ -126,13 +132,36 @@ safeguard against fake/country-code-less phone numbers.
 - [ ] The other 7 approved templates (`hobs_appointment_update`, `hobs_missed_appointment`,
       `hobs_payment_update`, `hobs_disconnect_request`, `hobs_agreement_signed`,
       `hobs_sos_alert`, `hobs_system_alert`) — approved but not wired to any real trigger yet.
-- [ ] App contract / therapy contract gating ("no user proceeds without signing the app
-      contract, no client proceeds without the therapy contract") — discussed in an earlier
-      session; **unverified whether this actually exists in the app's UI/navigation code** — the
-      DB scaffolding exists (`profiles.basic_tos_signed`, `ai_disclaimer_signed`,
-      `consent_signed`, the `consent_agreements` table) but nobody has actually read the app
-      code to confirm a gate is enforced. Needs checking directly against `index.html`'s real
-      onboarding/routing logic, not assumed from the column names existing.
+
+## App / therapy contract gating — resolved, confirmed Sept 27, 2026 (was open for months)
+
+**Previously marked "unverified whether this actually exists in the app's UI/navigation code."**
+Checked directly against the real production `index.html` (extracted from the actual installed
+APK, not assumed): `appState.consentSigned` is loaded straight from `profiles.consent_signed` on
+login, and `showConsentGate()` -- the real function that blocks the rest of the app until the
+therapy consent + No-Suicide Agreement form (including address and emergency contacts) is
+completed -- is called at real navigation checkpoints, including the main app-entry gate and
+again immediately before a client can pick a session time. **The gate is real and enforced in
+code, not just scaffolded in the database.** As of production build `v74`/`v82`, it applies to
+every client (therapists and admins excluded), a deliberate universal-gate fix -- an earlier,
+narrower version only applied it to clients with an existing clinical connection, which is why 13
+of 21 real clients previously had no address on file.
+
+**New real gap found in the same check**: the currently-distributed **staging** build
+(`staging-v42-transcription-save-race-fix`) still has the old, narrower gate (only fires if
+`appState.userHasAnyClinicalConnection` is true) -- it was branched before the universal-gate fix
+landed on production. Don't trust staging as representative of this specific behavior until it's
+rebuilt from current production code.
+
+## Security cleanup — awaiting Akash's go-ahead (found Sept 27, 2026)
+
+- [ ] **Two live, unauthenticated Edge Functions still deployed**, both self-labeled
+      "TEMPORARY, one-time-use" in their own source, neither ever deleted after their one-time
+      job: `temp-create-templates-v2` (created WhatsApp templates) and `temp-deactivate-alpha`
+      (deactivates the Play Store alpha/closed-testing track). Both `verify_jwt: false` --
+      callable by anyone with the URL, no login needed. Same class of real incident as the six
+      leftover diagnostic functions cleaned up earlier the same day. Not deleted yet -- deleting
+      a deployed function is a write action, needs an explicit yes first (per §5 of `MASTER.md`).
 
 ## Other real, outstanding items (not blockers, but genuinely open)
 
diff --git a/supabase/functions/send-whatsapp-template/index.ts b/supabase/functions/send-whatsapp-template/index.ts
new file mode 100644
index 0000000..7ae3206
--- /dev/null
+++ b/supabase/functions/send-whatsapp-template/index.ts
@@ -0,0 +1,78 @@
+// Generic HOBS WhatsApp template sender.
+// Called internally (from Postgres triggers via pg_net, or from app code)
+// with a shared secret header — never exposed to end users directly.
+//
+// Body: { to: string, template: string, params: string[], lang?: string }
+// "to" is normalized to E.164-without-plus for India (91XXXXXXXXXX).
+
+function normalizePhone(raw: string): string | null {
+  if (!raw) return null;
+  const digits = raw.replace(/[^0-9]/g, "");
+  if (digits.length === 10) return "91" + digits;
+  if (digits.length === 12 && digits.startsWith("91")) return digits;
+  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
+  return null; // reject anything that doesn't look like a real Indian mobile number
+}
+
+Deno.serve(async (req) => {
+  const expectedSecret = Deno.env.get("SCHEDULER_SECRET");
+  const gotSecret = req.headers.get("x-scheduler-secret");
+  if (!expectedSecret || gotSecret !== expectedSecret) {
+    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
+  }
+
+  let body: any;
+  try {
+    body = await req.json();
+  } catch {
+    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
+  }
+
+  const { to, template, params, lang } = body || {};
+  if (!to || !template || !Array.isArray(params)) {
+    return new Response(JSON.stringify({ error: "missing to/template/params" }), { status: 400 });
+  }
+
+  const waTo = normalizePhone(to);
+  if (!waTo) {
+    return new Response(JSON.stringify({ error: "invalid phone number", raw: to }), { status: 400 });
+  }
+
+  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
+  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
+
+  const sendBody = {
+    messaging_product: "whatsapp",
+    to: waTo,
+    type: "template",
+    template: {
+      name: template,
+      language: { code: lang || "en_US" },
+      components: params.length
+        ? [
+            {
+              type: "body",
+              parameters: params.map((p: string) => ({ type: "text", text: String(p) })),
+            },
+          ]
+        : [],
+    },
+  };
+
+  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
+    method: "POST",
+    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
+    body: JSON.stringify(sendBody),
+  });
+
+  const respJson = await res.json();
+
+  // Every attempt is already durably logged by pg_net's own net._http_response
+  // table (populated automatically for any caller using net.http_post), so no
+  // separate logging call is needed here.
+
+  return new Response(JSON.stringify({ status: res.status, response: respJson }), {
+    status: res.status === 200 ? 200 : 502,
+    headers: { "Content-Type": "application/json" },
+  });
+});
```

---

## Commit `6659e49` — 2026-09-26T23:27:15+00:00

**Subject**: docs: temp-create-templates-v2 and temp-deactivate-alpha deleted, confirmed gone

```diff
commit 6659e49d27ea700221dfc2d84fd3ed41333ff937
Author: Claude <claude@hobsfoundation.com>
Date:   Sat Sep 26 23:27:15 2026 +0000

    docs: temp-create-templates-v2 and temp-deactivate-alpha deleted, confirmed gone
    
    Both live, unauthenticated 'temporary' functions flagged earlier today have been deleted with
    explicit go-ahead, and their removal confirmed via a fresh live check against the Supabase
    Management API.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/docs/MASTER.md b/docs/MASTER.md
index 7776a02..8820bfb 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -204,14 +204,13 @@ notes.
 | `update-donate-page-meta` | Keeps the public donate page's metadata current. |
 | `uptime-monitor` | Every 5 min; pings prod + staging, alerts on status change. Same real bug as error-alert-monitor, same fix. |
 
-**Two functions deployed live right now that should almost certainly not be** (found in the Sept
-27, 2026 audit, not yet deleted -- awaiting Akash's explicit go-ahead per §5's confirm-before-write
-rule, since deleting a deployed function is itself a write action):
-- `temp-create-templates-v2` -- self-labeled in its own source comment "TEMPORARY, one-time-use",
-  created the finalized WhatsApp templates. Still `ACTIVE`, still `verify_jwt: false` (anyone with
-  the URL can call it, no login required).
-- `temp-deactivate-alpha` -- self-labeled "TEMPORARY, one-time-use", deactivates the Play Store
-  alpha/closed-testing track. Still `ACTIVE`, still `verify_jwt: false`.
+**Two functions found deployed live that should not have been** (Sept 27, 2026 audit):
+`temp-create-templates-v2` (created the finalized WhatsApp templates) and `temp-deactivate-alpha`
+(deactivates the Play Store alpha/closed-testing track) -- both self-labeled "TEMPORARY,
+one-time-use" in their own source, both still `verify_jwt: false` (callable by anyone with the
+URL, no login required) despite their one real job being done. **Deleted the same day**, with
+Akash's explicit go-ahead, confirmed gone via a fresh live check against the Supabase Management
+API afterward.
 
 Same class of real incident as the six leftover diagnostic WhatsApp-debug functions cleaned up
 earlier the same day (see `BUG_LOG.md`) -- a function built "temporary" needs to actually be
diff --git a/docs/PROJECT_STATUS.md b/docs/PROJECT_STATUS.md
index 2ad1a6e..a6ba553 100644
--- a/docs/PROJECT_STATUS.md
+++ b/docs/PROJECT_STATUS.md
@@ -153,15 +153,14 @@ of 21 real clients previously had no address on file.
 landed on production. Don't trust staging as representative of this specific behavior until it's
 rebuilt from current production code.
 
-## Security cleanup — awaiting Akash's go-ahead (found Sept 27, 2026)
-
-- [ ] **Two live, unauthenticated Edge Functions still deployed**, both self-labeled
-      "TEMPORARY, one-time-use" in their own source, neither ever deleted after their one-time
-      job: `temp-create-templates-v2` (created WhatsApp templates) and `temp-deactivate-alpha`
-      (deactivates the Play Store alpha/closed-testing track). Both `verify_jwt: false` --
-      callable by anyone with the URL, no login needed. Same class of real incident as the six
-      leftover diagnostic functions cleaned up earlier the same day. Not deleted yet -- deleting
-      a deployed function is a write action, needs an explicit yes first (per §5 of `MASTER.md`).
+## Security cleanup — resolved Sept 27, 2026
+
+- [x] **Two live, unauthenticated Edge Functions**, both self-labeled "TEMPORARY, one-time-use"
+      in their own source, neither ever deleted after their one-time job:
+      `temp-create-templates-v2` (created WhatsApp templates) and `temp-deactivate-alpha`
+      (deactivates the Play Store alpha/closed-testing track). Both were `verify_jwt: false` --
+      callable by anyone with the URL, no login needed. Deleted, with Akash's explicit go-ahead,
+      and confirmed gone via a fresh live check against the Supabase Management API afterward.
 
 ## Other real, outstanding items (not blockers, but genuinely open)
 
```

---

## Commit `c446274` — 2026-09-26T23:37:50+00:00

**Subject**: docs: add exhaustive APP-BLUEPRINT.md (architecture, every table, every role's real flow, feature inventory, roadmap); pull test-embedding source into version control

```diff
commit c446274372fef78ada3f5a55765cd6915985b16b
Author: Claude <claude@hobsfoundation.com>
Date:   Sat Sep 26 23:37:50 2026 +0000

    docs: add exhaustive APP-BLUEPRINT.md (architecture, every table, every role's real flow, feature inventory, roadmap); pull test-embedding source into version control
    
    APP-BLUEPRINT.md is the full, screen-by-screen reference requested Sept 27, 2026 -- written
    directly from the live repo (index.html, every Edge Function, every migration, every existing
    doc), linked from MASTER.md §1. Everything in it that's marked live/built was verified against
    real code, not assumed.
    
    Also found in the same pass: test-embedding was live on Supabase with no committed source, same
    gap as send-whatsapp-template earlier today -- pulled into supabase/functions/test-embedding/.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/docs/APP-BLUEPRINT.md b/docs/APP-BLUEPRINT.md
new file mode 100644
index 0000000..dacd5dc
--- /dev/null
+++ b/docs/APP-BLUEPRINT.md
@@ -0,0 +1,547 @@
+# HOBS Companion — App Blueprint
+
+> **Snapshot note**: this is a snapshot as of **September 27, 2026**, generated by reading the
+> live repo directly (`CLAUDE.md`, `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, `docs/BUG_LOG.md`,
+> the four `docs/BOB-*.md` files, the full ~17,200-line `index.html`, every file in
+> `supabase/functions/`, and every `.sql` file in `supabase/migrations/` and
+> `supabase/functions/_db-functions-reference/`). Verify against current live state before
+> trusting anything here in a future session — see `CLAUDE.md` and `docs/MASTER.md` §11 on
+> session-reset drift. Every claim below is traceable to a real function name, panel id, table,
+> or doc line found in the repo; anywhere that wasn't possible, it's flagged explicitly rather
+> than guessed.
+
+---
+
+## Table of contents
+
+1. [Product vision — what this is and why](#1-product-vision--what-this-is-and-why)
+2. [Full architecture map](#2-full-architecture-map)
+3. [Every real database table](#3-every-real-database-table)
+4. [Every Edge Function](#4-every-edge-function)
+5. [Screen-by-screen, by role](#5-screen-by-screen-by-role)
+6. [Feature inventory](#6-feature-inventory)
+7. [Roadmap / what's explicitly next](#7-roadmap--whats-explicitly-next)
+
+---
+
+## 1. Product vision — what this is and why
+
+**HOBS Companion** is a mental-health companion app built for **Home of Beautiful Souls
+Foundation (HOBS)**, an Ahmedabad-based mental health NGO, per `docs/MASTER.md` §1. Founded by
+**Akash Ramchandani** (psychologist; neurodivergent, ADHD — this shapes how the whole project's
+docs are written: short, direct, verified claims). Beyond that origin fact, this blueprint does
+not assert NGO history that isn't in the repo — the org's fuller mission/history is not
+independently verifiable from `index.html` or the docs and isn't invented here.
+
+**What the app does, per `MASTER.md` §1**: mood check-ins, journaling with AI crisis detection,
+tasklist, breathing/grounding exercises, a support-group chat, therapist booking/dashboard,
+period tracking, CBT/DBT/ACT worksheets, and character companions (Bob the elephant — fully
+built, real memory and crisis escalation; Kunnu, Cookie, Po — hidden, kept intact, not currently
+reachable in the UI).
+
+**Real user roles, confirmed in code (`index.html`)**:
+- **Client** — the default account type. Gated behind a Basic ToS gate and, before booking a
+  session, a full therapy-consent + No-Suicide Agreement gate (`showConsentGate()`,
+  §5 below).
+- **Professional** — one generic mechanism in code for all four real professional categories:
+  **Therapist, Psychiatrist, Doctor/General Physician, and Peer Caregiver**. There is no separate
+  `is_psychiatrist`/`is_doctor`/`is_caregiver` boolean or separate dashboard — every professional
+  account is flagged with the single `profiles.is_therapist` boolean and reaches the same
+  `panel-therapist-dashboard` ("My Client Schedule") regardless of their real specialty. What
+  actually distinguishes Psychiatrist/Doctor/Caregiver from a Therapist is the `role_category`
+  column on the `experts` table and on each `expert_bookings` row (`'Therapist'`,
+  `'Psychiatrist'`, `'General Physician'`, `'Peer Caregiver'`) — used for matching, labeling, and
+  which of the client's four generic "assigned_<role>_user_id" profile columns gets set
+  (`assigned_therapist_user_id`, `assigned_psychiatrist_user_id`, `assigned_doctor_user_id`,
+  `assigned_caregiver_user_id`), not for a different UI or different backend code path. A client
+  can be connected to one professional in *each* of the four categories simultaneously.
+- **Admin** — Akash (and any other account with `profiles.is_admin = true`). Reaches
+  `panel-admin` — the full operational console (§5.3).
+
+---
+
+## 2. Full architecture map
+
+### Frontend
+A single, large (~17,200-line, ~1MB) `index.html` — **vanilla JavaScript, no framework, no build
+step** (`MASTER.md` §3). This is the *entire* client: the web version and the native Android app
+both load this exact file, byte-for-byte. The Supabase JS SDK is loaded from a local
+`supabase.min.js` file (not a CDN), specifically so the app still functions without a network
+connection just to open.
+
+### Backend
+Supabase: **Postgres + Auth + Storage + Edge Functions + pg_cron**. Two fully separate projects:
+- **Production**: ref `adjvptkzyckkvewbfmzf`
+- **Staging**: ref `ivqlqrpcamoshmgibjph`
+
+Cron schedules live directly in the production database via `pg_cron` (not visible as files in
+this repo — queried live with `select jobname, schedule from cron.job;`).
+
+### Native layer
+**Capacitor**, Android only currently (`MASTER.md` §3). Plugins in real use: `@capacitor/app`,
+`@capacitor/browser`, `@capacitor/filesystem`, `@capacitor/push-notifications`,
+`@capacitor/share`, `@capacitor/splash-screen`. `window.Capacitor` (and everything under it) only
+exists inside the app's own native WebView — a page opened in an external browser tab, even one
+the app itself opened, never has it (standing lesson, `BUG_LOG.md`).
+
+### Storage model
+`appState` — a large, dynamically-grown in-memory JS object (seeded via `getDefaultAppState()` at
+`index.html:4426`, then extended throughout the script) — is the in-memory source of truth for
+almost everything the UI reads (`isAdmin`, `isTherapist`, `consentSigned`, `expertBookings`,
+`therapistName`, etc.). On native, it's persisted to app-private Capacitor Filesystem storage
+(deliberately, not `localStorage` — see storage-migration entries in `BUG_LOG.md`); on web, plain
+`localStorage`, unchanged.
+
+A resilient **offline-sync queue** (`pendingSyncQueue`, pushed to at `index.html:2575`/`2583`)
+catches any write that fails due to no connection and retries automatically once connectivity
+returns. Confirmed to cover: journal entries, tasks, subtasks, period tracking, and worksheet
+responses.
+
+### Crisis detection — two layers, always both active
+1. **Instant, local keyword pattern match** — `SELF_HARM_SIGNAL_PATTERNS` (`index.html:6202`),
+   a regex array checked synchronously client-side before anything else, via a helper at
+   `index.html:6391`.
+2. **Groq-based AI classifier** — the `check-journal-risk` Edge Function
+   (`sb.functions.invoke('check-journal-risk', ...)` at `index.html:6423`), model
+   `openai/gpt-oss-safeguard-20b`, catching indirect/metaphorical language the keyword layer would
+   miss.
+
+Both layers are wired into every free-text input in the app: journal entries (new and edited),
+Bob chat messages, worksheet free-text fields, and intake notes. A separate, additive classifier,
+`check-journal-psychoeducation` (invoked at `index.html:6446`), runs alongside — routing toward
+PHQ-9/GAD-7/PSQI or the right professional type — and never replaces the crisis check.
+
+### How it all connects
+Client (`index.html`) → Supabase JS SDK → Postgres (via PostgREST, RLS-scoped) for direct reads/
+writes, or → Edge Functions (`sb.functions.invoke(...)`) for anything needing a secret, a
+third-party API, or server-side logic (AI calls, payments, WhatsApp, calendar sync, publishing).
+Postgres triggers and `pg_cron` jobs call back into Edge Functions over HTTP via the `pg_net`
+extension (e.g. `hubspot_test_result_sync_trigger.sql`'s `net.http_post(...)` call into
+`sync-test-result-to-hubspot`, and the Google Calendar watch-renewal cron into
+`google-calendar-sync`). Internal function-to-function and cron-to-function calls are
+authenticated with a shared `x-scheduler-secret` header, not a user JWT — scheduled functions
+must be deployed with `--no-verify-jwt` or the platform rejects the call before that header is
+even checked (a real, confirmed deploy mistake, `MASTER.md` §4).
+
+---
+
+## 3. Every real database table
+
+Compiled by grepping every `.from('...')` call across `index.html` and every
+`supabase/functions/*/index.ts`, plus every `create table` in `supabase/migrations/*.sql` and
+`supabase/functions/_db-functions-reference/*.sql`. There is no single consolidated schema file in
+this repo — table definitions live either in a migration file (for the newer chat/calendar
+features) or predate the migrations directory entirely (for the original core tables, which only
+show up as `.from(...)` call sites, not `create table` statements, anywhere in this repo).
+
+| Table | Real purpose |
+|---|---|
+| `profiles` | Core account row per user: role flags (`is_admin`, `is_therapist`), consent state (`consent_signed`, `basic_tos_signed`), the four `assigned_<role>_user_id` professional links, address/emergency-contact fields, `app_version_code`/`app_version_name` (real installed-app version, self-reported via Capacitor `App.getInfo()` — ground truth for version drift, per `MASTER.md` §5), phone-number columns enforced valid by DB-level CHECK constraints (`is_valid_wa_phone`). |
+| `experts` | The roster of professionals available to be matched: name, role, `role_category` (Therapist/Psychiatrist/General Physician/Peer Caregiver), credential, years of experience, photo, languages. |
+| `expert_bookings` | Every client↔professional connection/request: `role_category`, `status` (`active`/`pending`/`cancelled`/`change_requested`), session date, payment confirmation, cancellation count. The central row for the whole professional-matching flow. |
+| `session_history` | Per-session record for every actual session held (not just the most recent) — notes-upload status, payment-lock state, Google Meet link. Built Sept 16-17, 2026; **staging only**, not yet promoted to production. |
+| `expert_availability_slots` | A professional's open time slots; `is_booked`/`booked_by`, claimed atomically via `reserve_availability_slot()`. |
+| `professional_calendar_connections` | One row per professional's own Google Calendar OAuth connection (never shared). |
+| `session_calendar_events` | Links a HOBS session/booking to its corresponding Google Calendar event. |
+| `calendar_change_requests` | A detected Google-Calendar-side time change on an existing session, held for human approval before being applied — nothing auto-applies except a deletion (auto-cancel). |
+| `professional_busy_blocks` | Non-HOBS events on a professional's calendar, used only to compute availability; a client sees the slot is unavailable, never the underlying event's details. |
+| `gcal_connect_state_tokens` | Short-lived OAuth state tokens for the Google Calendar connect flow, consumed atomically (`consume_gcal_state_token()`). |
+| `therapist_external_clients` | A therapist's own externally-arranged client (e.g. an iPhone user not on HOBS), logged into the same calendar/session system. |
+| `therapist_cancellation_log` | Cancellation history/reasons for therapist-side cancellations. |
+| `therapist_invites` | Pending admin-issued invites for a newly created expert profile, before that person signs up. |
+| `entries` | Journal entries — free text, subject to both crisis-detection layers. |
+| `test_results` | Psychometric test submissions (PHQ-9, GAD-7, PSQI, etc.) — `elevated`, `self_harm_flagged` flags; synced to HubSpot via a DB trigger. |
+| `worksheet_responses` | Answers to CBT/DBT/ACT structured worksheets. |
+| `tasks` / `subtasks` | The tasklist feature's core records; task-specific alarms fire from these via `send-task-alarms`. |
+| `period_logs` | Period-tracking entries. |
+| `who5_entries` | WHO-5 wellbeing-index check-in entries. |
+| `consent_agreements` | The full, filled-out therapy consent + No-Suicide Agreement record (address, emergency contacts, session-modality consent, signatures) captured by `showConsentGate()`. |
+| `donations` / `donation_campaigns` | Donation records and the admin-managed campaign(s) shown on professional profiles and the public donate page. |
+| `credit_log` | Referenced by `delete_user_data_atomic()`; a ledger table for some form of credit/points — not otherwise independently confirmed from a UI panel in this pass; flagged for follow-up (see report). |
+| `chat_rooms` | Every chat room — `type` is one of `direct` (1-on-1 professional↔client), `coordination` (multiple professionals coordinating on one shared client), or `support_group`. |
+| `chat_room_members` | Membership rows: `role` (`member`/`admin`/`co_admin`), `status` (`invited`/`joined`/`declined`/`left`); never hard-deleted. |
+| `chat_messages` | Messages in any chat room; soft-deleted (never hard-removed); carries the same two-layer crisis-flag fields (`crisis_flagged`, `crisis_reviewed`) as journal entries. |
+| `chat_polls` / `chat_poll_options` / `chat_poll_votes` / `chat_poll_history` | The support-group poll system (recurring check-in prompts sent by `send-group-poll`); full schema noted only in a migration-file comment (`group_polls.sql`), not defined there directly — created some other way (confirmed to exist via real `.from('chat_poll_options')`/`.from('chat_poll_votes')` call sites in `index.html`). |
+| `support_group_sessions` | Scheduled live support-group session slots, managed from the admin Organization tab. |
+| `character_messages` | Bob's (and the hidden characters') permanent, cross-session chat memory — every message, both sides, forever; `is_significant` boolean; 384-dim `embedding` vector for semantic search; `is_extracted` flag once weekly extraction has processed a message. |
+| `character_extractions` | The structured, non-abstractive extraction output for ordinary (non-significant) messages that have aged out — verbatim quotes/entities preserved, per `BOB-MEMORY-SAFETY-BUILD-SPEC.md` §1.5; referenced in `extract-character-memories`, not found as a plain `.from()` call in `index.html` (client never reads it directly — it's write-only from the extraction job). |
+| `notification_recipients` / `notification_log` | Push notification delivery: per-recipient rows and a log, including the deliberate `bypassPause` path for crisis alerts and a fallback log entry even for a recipient with no registered device. |
+| `app_analytics_events` | First-party, in-house behavior analytics (screen visits, feature usage, navigation flows) — deliberately never logs journal text, mood selections, test answers, or chat content (per the Admin → Behavior tab's own on-screen disclosure). |
+| `app_update_reminders` | Tracks who's been reminded of a pending app update, referenced in `send-apk-update-notification`. |
+| `error_logs` | Real, user-hit app errors, surfaced directly in the Admin → System tab. |
+| `whatsapp_webhook_events` | Persists every real inbound WhatsApp webhook event (messages, delivery-status callbacks) — named in `MASTER.md` §10 as where `whatsapp-webhook` logs; not read anywhere in `index.html` (write-only from that function currently). |
+| `system_credentials` | Production-only, RLS-locked-to-secret-key table holding this project's own non-Edge-Function credentials (Supabase keys, GitHub PAT, etc.) — an operational/deployment table, not part of the app's own feature surface; documented fully in `MASTER.md` §2. |
+
+**Postgres functions worth knowing** (from `supabase/migrations/` and
+`supabase/functions/_db-functions-reference/`): `reserve_availability_slot`,
+`claim_razorpay_order_slot`, `consume_gcal_state_token`, `delete_user_data_atomic`,
+`maintain_coordination_room` (trigger — auto-creates/maintains one coordination chat room per
+client once ≥2 professionals are connected to them), `is_chat_room_member` /
+`is_chat_room_admin` / `is_chat_room_participant` / `users_have_active_connection` /
+`is_room_facilitator_visible_to_viewer` (RLS helper functions, `security definer` to avoid
+recursive-policy issues), `auto_assign_therapist_on_match`, `get_or_create_direct_chat_room`,
+`record_session_history`, and the HubSpot sync trigger function
+`trigger_sync_test_result_to_hubspot`.
+
+---
+
+## 4. Every Edge Function
+
+Verified against the real, current `index.ts` source for each (not just copied from
+`MASTER.md`'s own table) — 28 functions total in `supabase/functions/` as of this read, matching
+`MASTER.md` §4's count once its two flagged-for-deletion "temporary" functions are set aside.
+
+| Function | Purpose (verified against source) |
+|---|---|
+| `character-chat-reply` | Generates Bob's real replies. See §6/Bob section and `BOB-COMPLETE-TECHNICAL-AND-CHARACTER-DOC.md` for the full pipeline. 806 lines. |
+| `check-journal-risk` | The AI crisis classifier — layer 2 of crisis detection. 205 lines. |
+| `check-journal-psychoeducation` | Non-death depression/anxiety + physical-symptom signal routing (PHQ-9/GAD-7/PSQI or GP/psychiatrist/therapist), additive to the crisis check. 126 lines. |
+| `create-razorpay-order` | Payment order creation for donations/sessions. 244 lines. |
+| `crisis-classifier-health-check` | Scheduled canary + failure-sweep monitor confirming `check-journal-risk` is actually reachable and correctly classifying, not just deployed. 162 lines. |
+| `database-backup` | Daily Postgres backup. 161 lines. |
+| `database-backup-offsite` | Daily backup mirrored offsite. 230 lines. |
+| `delete-user-account` | Full account deletion; calls `delete_user_data_atomic()` for the transactional DB portion. 218 lines. |
+| `error-alert-monitor` | Hourly; admin push alert on error-volume spike. 130 lines. |
+| `extract-character-memories` | Weekly (Sunday 3am, pg_cron) extraction of aged-out, non-significant `character_messages`. 152 lines. |
+| `google-calendar-oauth` | OAuth flow for a professional's own Google Calendar connection. 237 lines. |
+| `google-calendar-sync` | Keeps calendar availability/events in sync; watch channel renewed every 6h via cron (`gcal_watch_renewal_cron.sql`). 588 lines — the largest function in the repo besides `character-chat-reply`. |
+| `notification-scheduler` | Every 15 min; fires scheduled reminders (task alarms, mood check-ins, etc.). 347 lines. |
+| `play-console-status` | **Confirmed real, read-only** integration with the Google Play Developer (Android Publisher) API via a signed JWT (RS256, Deno Web Crypto). Opens the mandatory edit session for reads and always deletes it — never calls `edits.commit`, so it structurally cannot alter what's live. 133 lines. |
+| `publish-production-release` | **Confirmed real, consequential** function: takes an already-built AAB, uploads it, creates the release, and rolls it out to 100% on the production track — the actual irreversible "make it live" step. Reuses `play-console-status`'s auth. 143 lines. |
+| `razorpay-payment-callback` | The WebView `callback_url` Razorpay's checkout POSTs to after a payment attempt — only routes the WebView back in-app; does **not** verify/record the payment itself. 16 lines, the shortest function in the repo. |
+| `razorpay-webhook` | The actual, independently signature-verified payment confirmation path — the only thing allowed to mark a donation/payment as real. 154 lines. |
+| `send-apk-update-notification` | Daily; notifies users of a new app version if one exists. 86 lines. |
+| `send-group-poll` | Sends recurring support-group check-in poll prompts. 158 lines. |
+| `send-push-notification` | Shared, generic push-send function every other function calls; accepts `data` for deep-link routing and a `bypassPause: true` flag reserved for crisis escalation, with an always-log fallback for recipients with no registered device. 531 lines. |
+| `send-task-alarms` | Runs every minute; fires task-specific alarms at their set time. 70 lines. |
+| `send-whatsapp-template` | **New Sept 27, 2026.** Generic WhatsApp Cloud API template sender — `{to, template, params, lang?}`, requires `x-scheduler-secret`, normalizes the phone number (`normalizePhone()`, confirmed in source), sends via Meta Graph API. 78 lines. Its source was, until this same audit, live on Supabase with no committed copy anywhere in the repo — now committed. |
+| `sync-test-result-to-hubspot` | Pushes psychometric test results to HubSpot CRM, fired by a DB trigger on `test_results`. 278 lines. |
+| `transcribe-audio` | Voice-to-text for journal entries. **Confirmed by reading source directly**: primary provider is **Gladia** (`GLADIA_API_KEY`, Solaria model), automatic fallback to **Groq's Whisper** (`whisper-large-v3-turbo`). AssemblyAI is not called anywhere in this function — `MASTER.md` previously said AssemblyAI and has since been corrected (§10 of this table matches that correction). 198 lines. |
+| `update-donate-page-meta` | Keeps the public donate page's metadata current. 187 lines. |
+| `uptime-monitor` | Every 5 min; pings prod + staging, alerts on status change. 151 lines. |
+| `whatsapp-webhook` | Meta's registered webhook endpoint — GET handshake (echoes `hub.challenge`), POST logs inbound events only (no action taken on them currently). 44 lines — confirmed against source, matches `MASTER.md` §10 exactly. |
+| `temp-create-templates-v2` | **Still present in the repo** (82 lines), self-labeled "TEMPORARY, one-time-use" in its own source — created the finalized WhatsApp templates. Per `PROJECT_STATUS.md`, the *live Supabase deployment* of this function was deleted with Akash's go-ahead on Sept 27, 2026; the repo copy remaining here is expected (source control, not live surface) but should not be re-deployed. |
+| `temp-deactivate-alpha` | **Still present in the repo** (105 lines), same "TEMPORARY, one-time-use" self-label — deactivates the Play Store alpha/closed-testing track. Same status as above: live deployment deleted, repo copy remains as history. |
+
+**Not found as a file in `supabase/functions/` during this read, but referenced in `MASTER.md`
+§4 as "also found, harmless"**: `test-embedding` — a scratch test of Supabase's built-in
+`gte-small` embedding model, described as `verify_jwt: true` and never cleaned up. **Flag for a
+future session**: this function's directory was not present in this repo checkout at the time of
+this read; either it only ever existed as a live Supabase deployment with no committed source (the
+same class of gap `send-whatsapp-template` had), or it's since been removed from the repo. Worth
+confirming directly against a live Management API function listing next time, per the standing
+Edge Function audit practice in `MASTER.md` §11.
+
+**Cross-check against the Sept 27, 2026 audit `MASTER.md` describes**: the four functions it
+calls out as "undocumented until the audit" (`crisis-classifier-health-check`,
+`play-console-status`, `publish-production-release`, `razorpay-payment-callback`) are all present
+in the repo and match their described purpose. Nothing in this read surfaced a *new* discrepancy
+beyond what `MASTER.md`/`PROJECT_STATUS.md`/`BUG_LOG.md` already documented from that same audit.
+
+---
+
+## 5. Screen-by-screen, by role
+
+The entire panel system is driven by `showOnly(panelId)` (`index.html:5373`), which walks a single
+master array, `allPanels` (`index.html:5325`, 40 panel ids), setting every panel's `display` to
+`none` except the one being shown. A panel left out of `allPanels` renders correctly underneath a
+`display:none` that never lifts — a real, previously-hit bug class (`BUG_LOG.md` #93) — so this
+array is the authoritative list of every real screen in the app:
+
+`panel-bubbles, panel-journal, panel-quick-journal, panel-saved, panel-support, panel-intake,
+panel-booking, panel-history, panel-profile, panel-mood-tracker, panel-period-tracker, panel-who5,
+panel-who5-results, panel-calendar, panel-day, panel-celebration, panel-bodydouble, panel-tips,
+panel-calmroom, panel-progress, panel-achievements, panel-rewards, panel-search, panel-team,
+panel-expert-detail, panel-admin, panel-therapist-dashboard, panel-edit-profile,
+panel-my-bookings, panel-therapist-schedule, panel-tests, panel-test-detail, panel-test-results,
+panel-grounding, panel-grounding-detail, panel-worksheets, panel-worksheet-category,
+panel-worksheet-detail, panel-chat-list, panel-chat-room, panel-chat-create-group,
+panel-chat-room-info`
+
+### 5.1 Client screens
+
+**Bottom nav** (`index.html:2347-2368`, `.nav-footer`) has exactly four persistent tabs plus the
+implicit Home:
+- **Home** (`navHome`) → `panel-bubbles` — the main landing screen: `renderHomeGreeting()`
+  (`index.html:17167`) shows a rotating greeting; `renderHomeUpdatesBanner()` (`:17182`) surfaces
+  app-update/policy-update banners; `renderTodayCard()` (`:8223`) surfaces today's tasks/mood/
+  upcoming sessions. Also the entry point to Bob's chat (auto-opens once per app-open per
+  `BOB-MEMORY-SAFETY-BUILD-SPEC.md` Part 0).
+- **Journal** (`navJournal`) → `panel-journal` (full composition, `vintage-paper` styled) and
+  `panel-quick-journal` (a faster-entry variant) and `panel-saved` (`renderSavedPanel()`,
+  `:5081` — past entries). Every free-text save runs through both crisis-detection layers before
+  persisting.
+- **Tasklist** (`navTasks`) → the calendar/day/task system: `panel-calendar`
+  (`renderCalendarUpcomingSessions`/`renderCalendarPendingTasks`, `:8236`/`:8276`), `panel-day`
+  (`renderDayPanel`, `:8351`; `renderDayProgressStrip`, `:8376`; `renderTaskListCal`, `:8804`),
+  with task-specific native alarms (`nativeAlarmSchedule`, `:2698`) on Android.
+- **Breathe** (`navBreathe`) → grounding/breathing content: `panel-grounding` /
+  `panel-grounding-detail` (`renderGroundingList`, `:16802`), `panel-calmroom` (a bodydouble/
+  focus-room style panel, `panel-bodydouble` — `renderBodyDoubleWeekStrip`/
+  `renderBodyDoubleTaskList`, `:9227`/`:9263`).
+- **You** (`navYou`) → `panel-profile` (`renderProfile`/`renderProfileInner`, `:7347`/`:7350`) —
+  the client's own hub, showing: their connected-professional sections for all four categories
+  (`renderProfileProfessionalSection`, `:7223`, called once per category at `:7460-7462` with the
+  right `roleCategory`/`assignedFieldName` pair), a donation widget
+  (`renderProfileDonationWidget`, `:15309`), and entry points to every other client-side feature
+  below. `panel-edit-profile` handles profile editing. Admin/Therapist entry cards
+  (`adminEntryCard`/`therapistEntryCard`) only render here for accounts with that flag set.
+
+**Other client-reachable panels, gated as noted**:
+- `panel-mood-tracker` — mood check-ins (`renderMoodPastDays`/`renderMoodChart`, `:7999`/`:8060`).
+- `panel-period-tracker` — period tracking (`renderPeriodChips`/`renderPeriodTracker`,
+  `:7825`/`:7845`).
+- `panel-who5` / `panel-who5-results` — WHO-5 wellbeing check-in and its scored result
+  (`renderWho5Scale`, `:8111`).
+- `panel-tests` / `panel-test-detail` / `panel-test-results` — the psychometric test library
+  (`renderTestsList`, `:16145`; `renderTestItem`, `:16216`; `renderCustomResult`, `:16384`) —
+  PHQ-9/GAD-7/PSQI and others; an elevated/self-harm-flagged result surfaces the iCall/112 crisis
+  resource text directly in the results panel (`index.html:1416`).
+- `panel-worksheets` / `panel-worksheet-category` / `panel-worksheet-detail` — CBT/DBT/ACT
+  structured exercises (`renderWorksheetCategoryList`, `:16956`; category definitions include
+  named CBT/ACT approach blurbs, e.g. `index.html:16453-16519`).
+- `panel-support` — the support group / chat surface: `panel-chat-list` / `panel-chat-room` /
+  `panel-chat-create-group` / `panel-chat-room-info` (`renderChatList`, `:6580`;
+  `renderChatMessages`, `:6735`; `renderPollCard`, `:6800` for the group-poll feature).
+- `panel-booking` / `panel-team` / `panel-expert-detail` / `panel-my-bookings` — the
+  professional-matching and booking flow: `renderTeamList`/`renderTeamListInner` (`:15019`/
+  `:15022`) lists experts by category, `renderExpertAccordionItem` (`:15221`) shows detail, and
+  booking a session routes through `showSlotPicker` (`:11066`) and, if not yet consent-signed,
+  `showConsentGate` (below) before a slot can actually be picked.
+- `panel-intake` — the initial intake form when first requesting a professional.
+- `panel-history` — `renderHistory` (`:7017`) — a client's own session/interaction history.
+- `panel-progress` / `panel-achievements` / `panel-rewards` / `panel-celebration` — gamification
+  surfaces (`renderProgressTimeline`, `:10071`; `renderAchievements`, `:10146`;
+  `showAchievement`, `:10135`; `renderRewards`, `:10775`; `showCelebration`, `:9036`).
+- `panel-tips` — `renderTips` (`:9917`) — the dismissible mascot-tip card system
+  (`renderMascotTip`, `:16671`), also used for psychoeducation nudges and elevated-test-result
+  nudges.
+- `panel-search` — a cross-app search panel.
+
+**Gates every client passes through**:
+1. **Basic ToS gate** (`showBasicTosGate`, `:4000`) — age-18 + AI-disclaimer + agree checkboxes;
+   writes `profiles.basic_tos_signed`/`ai_disclaimer_signed`.
+2. **Therapy consent gate** (`showConsentGate`, `:4033`) — full address, three emergency
+   contacts (name+phone, all validated), signature, No-Suicide Agreement signature, and at least
+   one session-modality consent (chat/audio/video). Writes a full row to `consent_agreements`
+   plus `profiles.consent_signed = true`. **Confirmed real and enforced** (per `BUG_LOG.md` #107
+   and `PROJECT_STATUS.md`): checked at the app-entry gate and again immediately before a client
+   can pick a session time, and — as of production `v74`/`v82` — applies universally to every
+   client (therapists and admins excluded), not only clients with an existing clinical
+   connection. **The currently-distributed staging build still has the older, narrower version**
+   of this same gate — don't treat staging as representative of this specific behavior.
+
+### 5.2 Professional screens (Therapist / Psychiatrist / Doctor / Caregiver — one shared mechanism)
+
+Reached via the "Therapist" entry card on `panel-profile` for any account with
+`profiles.is_therapist = true`, regardless of the professional's real `role_category`. Single
+panel: **`panel-therapist-dashboard`** ("My Client Schedule", `index.html:1039`), with three tabs:
+
+- **Clients tab** (`therapistDashTab-clients`): a session-count/income summary tile
+  (`therapistSummaryTile` → `renderTherapistSummaryAndDetail`, `:14302`), pending **Session Time
+  Requests** (`renderTherapistTimeRequests`, `:13253`), a **Shared With You** feed of journal
+  entries/worksheets clients have chosen to share (`renderTherapistSharedFeed`, `:13089`), the
+  **My Clients** list (`renderTherapistClientsList`, `:13500`), and a **Send Homework** form
+  (client + linked session + title + deadline) — homework only becomes an active task for the
+  client after a real client-side accept step, and completion pushes a notification back to the
+  professional.
+- **Schedule tab** (`therapistDashTab-schedule`): Google Calendar connection card
+  (`renderGcalConnectionCard`, `:14012`) and event list (`renderGcalEventsList`, `:14060`); **My
+  Appointments** (`renderTherapistAppointmentsList`, `:13253`… list rendering at `:14651`/`:14710`
+  for day/repeat views) with upcoming/past filters; **My Availability** — a full month calendar
+  grid (`renderTherapistAvailabilityGrid`, `:14473`) supporting single, weekly-repeat,
+  specific-weekday, and monthly-repeat slot creation (`renderTherapistRepeatDates`, `:14710`); a
+  **Log an appointment** form covering both real HOBS clients and external (non-HOBS) contacts
+  (`therapist_external_clients`), with a payment note that always starts as
+  admin-unconfirmed; and a **client detail modal** with direct-message and
+  manage-schedule actions.
+- **Profile tab**: the professional's own editable profile (bio, approaches/CBT-DBT mention
+  field, credential, years, photo, languages).
+
+**Session Log**: per `PROJECT_STATUS.md`, surfaced from **three separate real locations** — the
+client's profile page, the "Our Experts" list, and the individual expert's View Profile page —
+each showing real per-session red/green notes-upload status and the session's Google Meet link.
+**Staging only** — this whole real professional-connection system (direct 1-on-1 chat, per-session
+homework accept flow, full session history, professional's own schedule view, admin-approval
+disconnect flow) is built and verified on staging (through v26) and has **not been promoted to
+production**.
+
+**Role-specific differences confirmed in code**: none beyond `role_category` string labeling and
+which `assigned_<role>_user_id` column gets set — the dashboard, the availability system, the
+homework system, and the chat system are all written generically against "the professional," not
+against a specific role. `PROJECT_STATUS.md` itself flags that end-to-end testing of this system
+has so far focused on the Therapist role specifically and has "not [been] separately re-verified
+end-to-end for Psychiatrist/Doctor/Caregiver, even though the underlying logic is now genuinely
+role-agnostic" — i.e. this is a documented, open verification gap, not a claim that it's untested
+by design.
+
+### 5.3 Admin screens (Akash)
+
+Single panel: **`panel-admin`** ("Admin Panel", `index.html:855`), with five tabs
+(`adminDashTabBar`):
+
+- **Overview** (`adminDashTab-overview`): a policy-update broadcast button (notifies every
+  consent-signed user); an analytics/stats row (`adminAnalyticsRow`/`adminStatsRow`); a full
+  **Send a Notification** composer (quick templates, per-character "send as" identity, title/
+  body, target-everyone-or-one-person-by-email); and collapsible **Notification History**
+  (`renderAdminNotifHistory`, `:12488`).
+- **Experts** (`adminDashTab-experts`): create a new expert profile + generate an invite message
+  (name, role, `role_category` dropdown — the four real categories, credential, years, photo URL,
+  languages, email) — `renderAdminExpertsManageList` (`:11614`) and
+  `renderAdminTherapistInvites` (`:11235`) manage existing ones; below that, **Expert
+  Availability** — an admin can add slots directly on any expert's behalf
+  (`renderAdminSlots`, `:11317`).
+- **Requests & Bookings** (`adminDashTab-requests`): pending change requests
+  (`adminChangeRequestsSection`), pending session-match requests waiting for an admin to assign a
+  real professional (`renderAdminPendingRequests`, `:11996`), and the full **All Bookings** list.
+- **Organization** (`adminDashTab-organization`): the **Donation Campaign** editor (title,
+  description, photo upload, goal amount, archive-and-start-new) plus **Past Campaigns**
+  (`renderAdminPastCampaigns`, `:11810`) and a **pledged donations awaiting confirmation** list
+  (`renderAdminDonationsList`, `:11951`); **Support Group Sessions** scheduling
+  (`renderAdminGroupSessions`, `:11358`); and **All Users** — every registered account (not just
+  ones who've booked), searchable by name/email, filterable to "no professional connected yet" or
+  "active in the last 3 days," each tappable into a full profile view
+  (`showAdminUserProfile`, `:12197`) where an admin can directly assign a professional.
+- **System** (`adminDashTab-system`): **Recent App Errors** — real, user-hit errors, most recent
+  first (`renderAdminErrorLogs`, `:11396`).
+- **Behavior** (`adminDashTab-behavior`): first-party, in-house analytics only (explicit on-screen
+  disclosure that journal text, mood selections, test answers, and chat content are never
+  tracked) — **Feature usage** (`renderAdminBehaviorAnalytics`, `:11470`, backed by the
+  `analytics_feature_usage` RPC), **Most-visited screens** (`analytics_screen_popularity` RPC),
+  and **How people navigate** (`analytics_top_transitions` RPC), each with a 7/30/90-day range
+  toggle.
+
+Admins bypass both the Basic ToS gate and the therapy-consent gate (confirmed at
+`index.html:3150`/`:4023`/`:11159` — every consent-gate condition explicitly excludes
+`appState.isAdmin`).
+
+---
+
+## 6. Feature inventory
+
+Status tags: **LIVE** (production), **STAGING-ONLY**, **PARTIALLY BUILT** (what's missing noted),
+**PLANNED/NOT STARTED**. Cross-referenced against `PROJECT_STATUS.md`'s open-item lists — nothing
+below is invented beyond what's documented somewhere real.
+
+| Feature | Status |
+|---|---|
+| Journaling + two-layer crisis detection | **LIVE** — keyword layer + `check-journal-risk` AI classifier, both wired into journal/chat/worksheet/intake text. |
+| Tiered psychoeducation nudges (PHQ-9/GAD-7/PSQI routing, GP/psychiatrist/therapist routing) | **LIVE** — `check-journal-psychoeducation`, verified end to end per `BOB-MEMORY-SAFETY-BUILD-SPEC.md` build-sequence item 7. |
+| Mood tracking | **LIVE** — `panel-mood-tracker`. |
+| Period tracking | **LIVE** — `panel-period-tracker`, `period_logs`, covered by the offline-sync queue. |
+| WHO-5 wellbeing check-in | **LIVE** — `panel-who5`/`panel-who5-results`, `who5_entries`. |
+| Tasks / subtasks + native alarms | **PARTIALLY BUILT** — the core tasklist (`tasks`/`subtasks`, `panel-day`, `panel-calendar`) is LIVE. The **native task/subtask alarm** specifically is on **staging only** — it crashed on a real device when shipped straight to production (Aug 26, 2026, `BUG_LOG.md` #56/#57); production is currently back on plain push-notification behavior for this, pending Akash's real-device confirmation of the staging rebuild. |
+| CBT/DBT/ACT worksheets | **LIVE** — `panel-worksheets`, `worksheet_responses`. |
+| Support group chat + polls | **LIVE** — `chat_rooms` (type `support_group`), `send-group-poll`, `chat_polls`/`chat_poll_options`/`chat_poll_votes`. |
+| Direct 1-on-1 professional↔client chat (generalized to all 4 professional roles) | **STAGING-ONLY** — built and verified through staging v26; not promoted to production. |
+| Coordination chat rooms (multiple professionals, one shared client) | **PARTIALLY BUILT** — the DB trigger (`maintain_coordination_room`) and `chat_rooms.type = 'coordination'` exist with one real row; **no UI surfaces it yet** — discussed and understood, not built. |
+| Therapist booking + full dashboard (Clients/Schedule/Profile) | **STAGING-ONLY** for the newer session-history/homework/schedule-view pieces built Sept 16-17, 2026; the underlying booking/matching flow itself (`panel-booking`, `panel-team`, `expert_bookings`) is **LIVE**. |
+| Session notes + payment locking, real Session Log (3 entry points) | **STAGING-ONLY** — verified end to end Sept 17, 2026 on staging; not promoted to production. |
+| Google Calendar integration | **LIVE**, but with a real, ongoing operational cost: still in Google's OAuth testing mode, forcing a ~7-day reconnect cycle until app verification is completed (**PLANNED/NOT STARTED** for the verification itself). |
+| Razorpay payments | **LIVE** for the order-creation/webhook-confirmation flow; **PLANNED/NOT STARTED**: a real, end-to-end test with actual money — everything so far tested with test data only. |
+| HubSpot sync | **LIVE** — DB trigger → `sync-test-result-to-hubspot` on every `test_results` insert. |
+| WhatsApp Business API (Cloud API) | **PARTIALLY BUILT** — infra is **LIVE** (registered number, all 8 templates approved, generic `send-whatsapp-template` sender, phone-number DB safeguard) with exactly **one** real trigger wired (`notify_professional_assigned` → client). The other 7 approved templates are **PLANNED/NOT STARTED** (not wired to anything); admin notification for bookings/cancellations/crisis flags is **PLANNED/NOT STARTED** (requested, nothing built). |
+| SOS button | **PLANNED/NOT STARTED** — fully scoped as a decision, but no SOS UI/trigger exists anywhere in `index.html` (confirmed by search — no "SOS" button markup found; only one prose mention, referring to it as an *upcoming* feature in a policy-update notice string). The WhatsApp Cloud API plumbing it would use is real and live, but unconnected to any UI trigger. |
+| Bob the AI companion — permanent memory, significance flagging, guaranteed recall, semantic search, weekly extraction | **LIVE** — full pipeline in `character-chat-reply`; see §6.1 below. |
+| Bob — crisis escalation to assigned professional/admin | **LIVE** — verified both the assigned-therapist and admin-fallback paths. |
+| Kunnu / Cookie / Po (other character companions) | **PLANNED/NOT STARTED (paused, not deleted)** — hidden from every UI entry point and routing path; markup and backend definitions kept intact; explicitly not to be built further without asking, per direct instruction. |
+| Bob Intelligence Architecture — Phase 0 (identity spec + module scaffolding) | **PLANNED/NOT STARTED**. |
+| Bob Intelligence Architecture — Phase 1 (Personal Grounding / hallucination safeguard) | **PLANNED/NOT STARTED** — agreed as the next real piece of work. |
+| Bob Intelligence Architecture — Phases 2-5 (measurement, safety review, memory confidence/staleness, Bobness regression suite) | **PLANNED/NOT STARTED**, explicitly sequenced after Phase 1. |
+| Real streaming for Bob's replies | **PLANNED/NOT STARTED** — raised repeatedly, explicitly deferred pending go-ahead given the scope (touches backend response format and frontend rendering both). |
+| Play Store publishing automation | **LIVE** — `play-console-status` (read-only) and `publish-production-release` (real, consequential — confirm before every call). |
+| Gamification (progress/achievements/rewards/celebration) | **LIVE** — `panel-progress`/`panel-achievements`/`panel-rewards`/`panel-celebration`. |
+| First-party behavior analytics | **LIVE** — `app_analytics_events`, Admin → Behavior tab. |
+| Donations + campaigns | **LIVE** — admin-managed campaign, Razorpay-backed donation flow, public donate page (`update-donate-page-meta`). |
+| Account deletion | **LIVE** — atomic via `delete_user_data_atomic()`. |
+| Tasklist "constellation" 3D redesign | **PLANNED/NOT STARTED** — prototype exists (separate design doc referenced in project memory), never decided on. |
+| In-app day/month calendar view (client-facing, beyond the existing task calendar) | **PLANNED/NOT STARTED**. |
+| React migration | **PLANNED/NOT STARTED (deliberately paused)** — pending confirmation an external developer is ready. |
+| Automated invite emails / automated email marketing | **PLANNED/NOT STARTED** — mentioned, never actioned/scoped. |
+| Own in-house calendar system (replacing Google Calendar) | **PLANNED/NOT STARTED** — raised as an idea, explicitly set aside for a later, separate conversation. |
+
+### 6.1 Bob — detail (since this is the single most-built feature)
+Per `BOB-COMPLETE-TECHNICAL-AND-CHARACTER-DOC.md` and `BOB-MEMORY-SAFETY-BUILD-SPEC.md` (both
+written directly from live code, Sept 15-16, 2026): a single Edge Function
+(`character-chat-reply`) drives normal replies, greetings (client-side, hard-wired, instant — no
+network call), and closings (content-aware, using a capped last-10-message transcript). Real,
+permanent memory (`character_messages`, never pruned), real-time significance flagging, guaranteed
+recall of significant content (injected as its own message immediately before the query — a real,
+confirmed LLM attention/recency fix, not solvable by prompt wording alone), real pgvector semantic
+search (via Supabase's built-in `gte-small` embedding model, since Groq offers no embeddings API),
+and weekly, non-abstractive extraction of aged-out ordinary content. Crisis detection runs
+concurrently with the rest of the reply pipeline via an independent async promise, and escalates
+raw (never paraphrased) content to the client's assigned professional or, if none, every admin.
+Kunnu/Cookie/Po are hidden but intact, awaiting the same depth of work. The permanent underlying
+principle for all future Bob work, per `BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md`: **"Bob can
+interpret, but Bob cannot fabricate."**
+
+---
+
+## 7. Roadmap / what's explicitly next
+
+**Everything in this section is planned/aspirational — distinct from the "live today" sections
+above.** Pulled directly from `PROJECT_STATUS.md`'s "Decisions waiting on Akash" and "Other real,
+outstanding items" sections, plus `BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md`'s phases.
+
+### Decisions waiting on Akash specifically
+- Tasklist constellation redesign — prototype exists, never decided on.
+- React migration — deliberately paused until an external developer is confirmed ready.
+- In-app day/month calendar view — not built yet.
+- SOS button — WhatsApp Cloud API plumbing now genuinely exists (real number, all 8 templates
+  approved including `hobs_sos_alert`), but the actual button UI/trigger is not built, and who
+  receives the alert and when is not decided.
+- Automated email marketing — never scoped at all, needs its own conversation.
+- Real streaming for Bob's replies — explicitly not started pending go-ahead given the real scope.
+- Whether the crisis-detection threshold should be more conservative than the strict clinical
+  definition of passive ideation — a real, open **values** question, not a technical one.
+- Kunnu, Po, Cookie — awaiting a decision on when/how to bring them back with the same depth of
+  character work Bob has received.
+- When (if at all) to promote the whole new professional-connection system (chat, session
+  history, homework, schedule view) from staging to production — real, safety-adjacent new
+  surface area that hasn't had the same length of staging soak time as some earlier features.
+- An in-house calendar system (linked to email/WhatsApp) as a possible eventual replacement for
+  Google Calendar — raised, explicitly set aside for later.
+
+### Other real, outstanding items (not blockers, but genuinely open)
+- Real native task/subtask alarm — staging-only, waiting on Akash's real-device confirmation
+  before touching production again.
+- A real, end-to-end Razorpay test with actual money.
+- Google Calendar OAuth app verification (would end the current ~7-day reconnect cycle).
+- HDFC SmartGateway onboarding — mentioned once, never actioned.
+- Real automated invite emails — mentioned once, never actioned.
+- Reconsidering the Supabase free tier, given how much now depends on it staying up.
+- Lawyer review of the Terms of Service liability section — still not done, flagged repeatedly
+  since August 2026; only Akash can confirm this offline step.
+- Play Store: phone screenshots and device-catalog restriction (Phone only) — both genuinely
+  unconfirmed as of the last direct check (Sept 20, 2026), not resolved.
+
+### Bob Intelligence Architecture — sequenced phases (`BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md`)
+- **Phase 0** — Foundation: extract Bob's live prompt into a versioned `docs/BOB-IDENTITY-SPEC.md`
+  (`v1.0`), create the `response-integrity/` module structure. Not started.
+- **Phase 1** — Personal Grounding Module: the real fix for a confirmed hallucination (an invented
+  "note"). Classifies claims as FACT/INFERENCE/CREATIVE, regenerates on an ungrounded FACT, falls
+  back to a Bob-voiced honest non-guess. Agreed as the next real piece of work. Not started.
+- **Phase 2** — Measurement: a real "Bob Grounding Test Set" (memory traps, similar-person traps,
+  false-memory prompts, contradiction traps, emotional-inference traps) to honestly measure
+  Phase 1 before building anything further. Not started.
+- **Phase 3** — Response Safety Review Module: checks Bob's *outgoing* replies (not just incoming
+  messages) for diagnostic-sounding language, dependency-reinforcing language, dangerous advice,
+  false reassurance. Gated on Phase 2's numbers. Not started.
+- **Phase 4** — Memory Confidence & Staleness: adds type/confidence/last-confirmed metadata to
+  significant memories so an old fact gets re-surfaced as a check-in, not a flat assumption. Not
+  started.
+- **Phase 5** — Bobness Regression Suite: a standing test set gating every future change to Bob's
+  prompt/grounding/safety modules against accidentally flattening his character. Not started.
+- **Deferred, not rejected**: external clinical knowledge-grounding, a dedicated dependency-
+  detection module, cross-conversation pattern-noticing, the full 20+ category Bob Evaluation Lab,
+  and formal identity-versioning tooling — each explicitly held until there's observed real need,
+  not built ahead of evidence.
+
+---
+
+*This document was generated by directly reading the repo on 2026-09-27. It does not replace
+`docs/MASTER.md`, `docs/PROJECT_STATUS.md`, or `docs/BUG_LOG.md` — those remain the project's
+real, permanent, living sources of truth and are updated by sessions doing real work on the app.
+This blueprint is a structural map of the whole system at one point in time; re-verify anything
+load-bearing against live state before acting on it.*
diff --git a/docs/MASTER.md b/docs/MASTER.md
index 8820bfb..71a97cd 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -40,6 +40,12 @@ Once you have that one starting credential:
 
 ## 1. What this project is
 
+**For the full, exhaustive, screen-by-screen picture of the entire app** — every user role's
+real flow, every table, every Edge Function re-verified, a complete feature inventory with
+live/staging/planned status tags, and the real roadmap — see `docs/APP-BLUEPRINT.md` (written
+Sept 27, 2026, directly from the live repo). This file (`MASTER.md`) stays the fast entry point
+and the operational rules; `APP-BLUEPRINT.md` is the deep reference.
+
 **HOBS Companion** — a mental health companion app for **Home of Beautiful Souls Foundation**
 (HOBS), an Ahmedabad-based mental health NGO founded by **Akash Ramchandani** (psychologist,
 neurodivergent, ADHD — communicate in short, direct messages, ask before consequential actions,
@@ -218,7 +224,8 @@ deleted once its one-time job is done, not just abandoned live and unauthenticat
 
 Also found, harmless: `test-embedding` -- a scratch test of Supabase's built-in `gte-small`
 embedding model, `verify_jwt: true` (not publicly exposed), never cleaned up, no real purpose
-anymore.
+anymore. **Same gap as `send-whatsapp-template` had**: live on Supabase with no committed source
+until this same audit -- now pulled into the repo at `supabase/functions/test-embedding/index.ts`.
 
 All cron schedules are set via `pg_cron` directly in the production database (not visible in
 this repo as files — query `select jobname, schedule from cron.job;` against production to see
diff --git a/supabase/functions/test-embedding/index.ts b/supabase/functions/test-embedding/index.ts
new file mode 100644
index 0000000..ac713f6
--- /dev/null
+++ b/supabase/functions/test-embedding/index.ts
@@ -0,0 +1,26 @@
+// test-embedding
+//
+// Scratch test of Supabase's built-in gte-small embedding model (used to validate the semantic
+// search / memory embedding approach before it was wired into extract-character-memories /
+// character-chat-reply for real). No longer load-bearing for anything. verify_jwt: true, so not
+// publicly exposed, but was live with no committed source until the Sept 27, 2026 audit found
+// it the same way send-whatsapp-template was found -- deployed directly via the Management API,
+// never committed. Pulled into version control for the same reason; not otherwise changed.
+
+Deno.serve(async (req) => {
+  try {
+    const { input } = await req.json();
+    // @ts-ignore -- Supabase.ai is a Deno-runtime global injected by Supabase Edge Functions,
+    // not a real importable type in this repo's local TS environment.
+    const session = new Supabase.ai.Session("gte-small");
+    const output = await session.run(input, { mean_pool: true, normalize: true });
+    return new Response(JSON.stringify({ ok: true, length: output.length, sample: output.slice(0, 5) }), {
+      headers: { "Content-Type": "application/json" },
+    });
+  } catch (err) {
+    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
+      status: 500,
+      headers: { "Content-Type": "application/json" },
+    });
+  }
+});
```

---

## Commit `8a3e99b` — 2026-09-27T00:01:35+00:00

**Subject**: Google Calendar connect: attempt native-app deep-link handoff on Android before falling back to the browser banner

```diff
commit 8a3e99bfca9817fa8b927634526079d3cc85f9b8
Author: Claude <claude@hobsfoundation.com>
Date:   Sun Sep 27 00:01:35 2026 +0000

    Google Calendar connect: attempt native-app deep-link handoff on Android before falling back to the browser banner
    
    Not yet deployed anywhere (not on the production website, not in a staging or production APK
    build) -- committed to source control only, pending Akash's decision on how to handle two real
    complications found while preparing to test this on staging (see chat): the OAuth redirect_uri
    is hardcoded to the production website for both staging and production APKs, so testing this
    at all requires a production website deploy even for a 'staging test'; and staging/production
    APKs currently register the identical hobscompanion:// scheme, which could route the handoff to
    the wrong app if both are installed side by side.
    
    Adds a Google-Calendar-specific appUrlOpen branch (gcal_code/gcal_state, deliberately distinct
    from Supabase's own ?code= Sign-In branch) and an Android-only pre-hop attempt in
    handleGoogleCalendarCallback() with a timeout fallback to the existing browser-side completion
    + banner if nothing intercepts it.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/index.html b/index.html
index b81070d..dee051b 100644
--- a/index.html
+++ b/index.html
@@ -2924,6 +2924,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
 
     }
 
+    // -------------------------
+    // Google Calendar connect handoff (new, Sept 27 2026)
+    // -------------------------
+    // Not part of Supabase's own auth flow -- this is the Google Calendar OAuth callback
+    // handing off from the external browser/Custom Tab back into the native app, so the
+    // connection completes here (no fallback "tap back arrow" banner needed) instead of
+    // being stranded in the browser. Uses gcal_code/gcal_state specifically so this never
+    // collides with the "?code=" check above (that's Supabase's own param, unrelated).
+    if(url.indexOf("gcal_code=") !== -1){
+
+      console.log("Detected Google Calendar connect handoff");
+
+      try{
+
+        var gcalParsed = new URL(url);
+        var gcalCode = gcalParsed.searchParams.get("gcal_code");
+        var gcalState = gcalParsed.searchParams.get("gcal_state");
+
+        if(gcalCode && gcalState){
+          await completeGoogleCalendarConnect(gcalCode, gcalState);
+        }
+
+      }catch(err){
+        console.error(err);
+        showToast("Couldn't connect your calendar — please try again.");
+      }
+
+      return;
+
+    }
+
     // -------------------------
     // Token Flow
     // -------------------------
@@ -14263,6 +14294,23 @@ async function handleGoogleCalendarCallback(){
   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
   var looksLikeStateToken = stateToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stateToken);
   if(!code || !looksLikeStateToken) return;
+
+  // New, Sept 27 2026: Google's OAuth client type here only accepts https:// redirect URIs, so
+  // landing in an external browser/Custom Tab (not the native app) is unavoidable -- but if the
+  // native app is actually installed, we can hand off to it immediately via the same custom
+  // scheme (hobscompanion://) Google Sign-In already uses successfully, instead of completing
+  // the connection here and leaving the person stranded on a "tap back" banner.
+  // Purely additive, not a replacement: if the app intercepts this, Android tears down this
+  // page mid-navigation and nothing below ever runs (the app's own appUrlOpen listener
+  // completes the real exchange instead). If nothing intercepts it within the timeout (app not
+  // installed, or this is a plain desktop/web visit), execution just continues normally below,
+  // exactly as it did before this change.
+  if(/Android/i.test(navigator.userAgent)){
+    window.location.href = 'hobscompanion://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+    await new Promise(function(resolve){ setTimeout(resolve, 900); });
+    if(document.hidden || document.visibilityState === 'hidden') return; // handed off successfully, native app takes over
+  }
+
   // Real, additional guard, Sept 16 2026: covers the real, narrower window between arriving
   // here and the success banner actually existing (the network round-trip to exchange the
   // code) -- the banner-presence check alone doesn't protect this earlier moment, and a forced
```

---

## Commit `d8faf1e` — 2026-09-27T00:08:47+00:00

**Subject**: Fix real hobscompanion:// scheme collision between staging and production apps

```diff
commit d8faf1e36b979cdb6e2f147834940fdcf80c168d
Author: Claude <claude@hobsfoundation.com>
Date:   Sun Sep 27 00:08:47 2026 +0000

    Fix real hobscompanion:// scheme collision between staging and production apps
    
    Staging now registers its own distinct custom scheme (hobscompanionstaging://) instead of
    duplicating production's exact scheme -- confirmed real: if both apps are installed side by
    side (the normal setup per docs), Android had no way to know which one should catch a
    hobscompanion:// link.
    
    - AndroidManifest-staging.xml: scheme changed to hobscompanionstaging
    - staging-config/index.html: NATIVE_CALLBACK_URL updated to match; startGoogleCalendarConnect
      now prefixes its state token 'stg:' before sending it to Google, since Google always
      redirects back to the PRODUCTION website regardless of which app started the flow (only one
      redirect_uri is registered with Google for this OAuth client) -- this prefix is the only way
      the shared landing page can tell a staging-originated request apart from a production one and
      hand off to the right app
    - staging-config/index.html: handleGoogleCalendarCallback and the appUrlOpen listener brought
      back into sync with production's copy (had drifted -- missing the Sept 16 gcalCallbackInProgress
      guard entirely); both now attempt a native-app handoff via their own scheme before falling
      back to browser-side completion
    - index.html (production): handleGoogleCalendarCallback now detects the 'stg:' prefix and hands
      off to hobscompanionstaging:// with no web-based fallback for that case (this page's own
      client is bound to the production Supabase project, so it has no way to correctly exchange a
      staging-requested code against staging's backend)
    
    Also found and fixed in the same pass: the staging Supabase project (ivqlqrpcamoshmgibjph) was
    paused (auto-pause, Free tier) -- restored via the Management API, confirmed ACTIVE_HEALTHY.
    Its Auth 'Redirect URLs' allow-list was also missing hobscompanion://callback entirely (should
    have been hobscompanionstaging://callback all along) -- added, confirmed via a live read-back.
    
    Not yet built into any APK -- source control only, pending a staging build + Akash's real-device
    test.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/AndroidManifest-staging.xml b/android-native-assets/staging-config/AndroidManifest-staging.xml
index c1ea062..369f4df 100644
--- a/android-native-assets/staging-config/AndroidManifest-staging.xml
+++ b/android-native-assets/staging-config/AndroidManifest-staging.xml
@@ -28,11 +28,16 @@
                  the user is stranded on Google's account picker with no way back into the app.
                  The JS-side appUrlOpen handler already correctly parses this exact URL pattern
                  (its "Token Flow" branch): this was purely a missing registration. -->
+            <!-- Real fix, Sept 27 2026: was "hobscompanion", identical to production's own
+                 scheme -- a genuine collision, since Android has no way to know which app
+                 should catch a "hobscompanion://" link if both are installed side by side
+                 (the normal, expected setup). Staging gets its own distinct scheme so a
+                 deep-link handoff always reaches the right app. -->
             <intent-filter android:autoVerify="false">
                 <action android:name="android.intent.action.VIEW" />
                 <category android:name="android.intent.category.DEFAULT" />
                 <category android:name="android.intent.category.BROWSABLE" />
-                <data android:scheme="hobscompanion" />
+                <data android:scheme="hobscompanionstaging" />
             </intent-filter>
 
         </activity>
diff --git a/android-native-assets/staging-config/index.html b/android-native-assets/staging-config/index.html
index 19430f5..7c41ec5 100644
--- a/android-native-assets/staging-config/index.html
+++ b/android-native-assets/staging-config/index.html
@@ -2608,7 +2608,14 @@ var WEB_APP_URL = 'https://app.homeofbeautifulsouls.com/';
 // the native update-check safely no-ops rather than checking against a URL that doesn't exist.
 var REMOTE_VERSION_CHECK_URL = 'https://staging-app.homeofbeautifulsouls.com/version.json';
 var APK_DOWNLOAD_URL = 'https://staging-app.homeofbeautifulsouls.com/HOBS-Companion-staging.apk';
-var NATIVE_CALLBACK_URL = 'hobscompanion://callback';
+var NATIVE_CALLBACK_URL = 'hobscompanionstaging://callback';
+// Real fix, Sept 27 2026: was 'hobscompanion://callback', identical to production's -- a real
+// scheme collision with no way for Android to know which app should catch it if both are
+// installed side by side. Staging now uses its own distinct scheme (manifest updated to
+// match), and this project's own Supabase Auth "Redirect URLs" allow-list has been updated to
+// include it (Supabase rejects any redirectTo not on that list) -- confirmed it was previously
+// missing 'hobscompanion://callback' entirely, so native Sign-In via this path may never have
+// actually been tested working on staging before this fix.
 // Deliberately separate from WEB_APP_URL and NOT updated to the new domain: this exact URL is
 // registered as the authorized redirect URI for this OAuth client in Google Cloud Console.
 // Changing it here without also updating it there would break the connection flow outright
@@ -2790,6 +2797,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
 
     }
 
+    // -------------------------
+    // Google Calendar connect handoff (new, Sept 27 2026)
+    // -------------------------
+    // Not part of Supabase's own auth flow -- this is the Google Calendar OAuth callback
+    // handing off from the external browser/Custom Tab back into the native app, so the
+    // connection completes here instead of being stranded in the browser. Uses
+    // gcal_code/gcal_state specifically so this never collides with the "?code=" check above
+    // (that's Supabase's own param, unrelated).
+    if(url.indexOf("gcal_code=") !== -1){
+
+      console.log("Detected Google Calendar connect handoff");
+
+      try{
+
+        var gcalParsed = new URL(url);
+        var gcalCode = gcalParsed.searchParams.get("gcal_code");
+        var gcalState = gcalParsed.searchParams.get("gcal_state");
+
+        if(gcalCode && gcalState){
+          await completeGoogleCalendarConnect(gcalCode, gcalState);
+        }
+
+      }catch(err){
+        console.error(err);
+        showToast("Couldn't connect your calendar — please try again.");
+      }
+
+      return;
+
+    }
+
     // -------------------------
     // Token Flow
     // -------------------------
@@ -12643,7 +12681,14 @@ async function startGoogleCalendarConnect(){
     scope: GOOGLE_CALENDAR_SCOPE,
     access_type: 'offline', // required to receive a refresh token at all
     prompt: 'consent',      // forces a fresh refresh token every time, not just on first-ever connect
-    state: tokenData.token
+    // Prefixed 'stg:', Sept 27 2026: Google always redirects to the PRODUCTION website
+    // (redirect_uri is shared/hardcoded, only one URI is registered with Google for this
+    // client) regardless of which app started the flow -- so the page that lands there needs
+    // a way to tell a staging-initiated request apart from a production one, to hand off to
+    // the right app via the right custom scheme. This prefix is that signal. The raw,
+    // unprefixed token underneath is unchanged and is exactly what this project's own
+    // exchange_code action still validates against.
+    state: 'stg:' + tokenData.token
   }).toString();
 
   // Real, confirmed cause of "clicked continue but never came back to the app": Google's OAuth
@@ -12938,14 +12983,29 @@ document.getElementById('gcalEventEditDeleteBtn').onclick = async function(){
 async function handleGoogleCalendarCallback(){
   var params = new URLSearchParams(window.location.search);
   var code = params.get('code');
-  var stateToken = params.get('state');
+  var rawStateParam = params.get('state');
+  var stateToken = (rawStateParam && rawStateParam.indexOf('stg:') === 0) ? rawStateParam.slice(4) : rawStateParam;
   // A UUID state token specifically (not any other feature that might use ?state= or ?code=
   // on this same URL) -- the format itself is the signal, since this can no longer check
   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
   var looksLikeStateToken = stateToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stateToken);
   if(!code || !looksLikeStateToken) return;
+
+  // Synced from the production copy, Sept 27 2026 (this file had fallen out of sync with it --
+  // see the README's own warning about that). In practice, Google always redirects to the
+  // PRODUCTION website for this flow (see index.html's own comment on this), so this exact
+  // function rarely if ever actually runs -- it only matters if staging's own site is loaded
+  // directly. Kept at parity anyway per this directory's own stated convention.
+  if(/Android/i.test(navigator.userAgent)){
+    window.location.href = 'hobscompanionstaging://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+    await new Promise(function(resolve){ setTimeout(resolve, 900); });
+    if(document.hidden || document.visibilityState === 'hidden') return;
+  }
+
+  window.gcalCallbackInProgress = true;
   window.history.replaceState({}, document.title, window.location.pathname);
   await completeGoogleCalendarConnect(code, stateToken);
+  window.gcalCallbackInProgress = false;
   // Real, documented platform limitation, confirmed via Capacitor's own docs: Browser.close()
   // is "Web & iOS only... No-op on other platforms" -- it never actually closes anything on
   // Android, regardless of how correctly it's called. completeGoogleCalendarConnect's own
diff --git a/index.html b/index.html
index dee051b..58a77bf 100644
--- a/index.html
+++ b/index.html
@@ -14288,7 +14288,14 @@ document.getElementById('gcalEventEditDeleteBtn').onclick = async function(){
 async function handleGoogleCalendarCallback(){
   var params = new URLSearchParams(window.location.search);
   var code = params.get('code');
-  var stateToken = params.get('state');
+  var rawStateParam = params.get('state');
+  // Sept 27 2026: a staging-initiated request prefixes its state 'stg:' before ever reaching
+  // Google, specifically because Google always redirects back to THIS website (production)
+  // regardless of which app started the flow -- there is only one redirect_uri registered with
+  // Google for this OAuth client. This prefix is the only signal available here for telling a
+  // staging request apart from a production one, so the right app can be handed off to.
+  var isStagingOrigin = rawStateParam && rawStateParam.indexOf('stg:') === 0;
+  var stateToken = isStagingOrigin ? rawStateParam.slice(4) : rawStateParam;
   // A UUID state token specifically (not any other feature that might use ?state= or ?code=
   // on this same URL) -- the format itself is the signal, since this can no longer check
   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
@@ -14297,14 +14304,33 @@ async function handleGoogleCalendarCallback(){
 
   // New, Sept 27 2026: Google's OAuth client type here only accepts https:// redirect URIs, so
   // landing in an external browser/Custom Tab (not the native app) is unavoidable -- but if the
-  // native app is actually installed, we can hand off to it immediately via the same custom
-  // scheme (hobscompanion://) Google Sign-In already uses successfully, instead of completing
-  // the connection here and leaving the person stranded on a "tap back" banner.
-  // Purely additive, not a replacement: if the app intercepts this, Android tears down this
-  // page mid-navigation and nothing below ever runs (the app's own appUrlOpen listener
-  // completes the real exchange instead). If nothing intercepts it within the timeout (app not
-  // installed, or this is a plain desktop/web visit), execution just continues normally below,
-  // exactly as it did before this change.
+  // native app is actually installed, we can hand off to it immediately via its own custom
+  // scheme (the same mechanism Google Sign-In already uses successfully), instead of completing
+  // the connection here and leaving the person stranded on a "tap back" banner. Staging and
+  // production each register their own distinct scheme (see AndroidManifest.xml /
+  // AndroidManifest-staging.xml) specifically so this always reaches the right app, never both.
+  //
+  // A staging-originated request (isStagingOrigin) can ONLY be completed by handing off --
+  // this production page's own `sb` client is bound to the PRODUCTION Supabase project, so it
+  // has no way to correctly exchange a code that was requested against staging's backend. If
+  // the hop doesn't land (staging app not installed here), there is deliberately no web-based
+  // fallback for this case -- say so plainly rather than pretending to complete it.
+  if(isStagingOrigin){
+    window.gcalCallbackInProgress = true;
+    window.history.replaceState({}, document.title, window.location.pathname);
+    window.location.href = 'hobscompanionstaging://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+    await new Promise(function(resolve){ setTimeout(resolve, 900); });
+    window.gcalCallbackInProgress = false;
+    if(document.hidden || document.visibilityState === 'hidden') return; // handed off successfully
+    showToast("Couldn't reach the HOBS Companion (Staging) app on this device — open it directly and try connecting again from there.");
+    return;
+  }
+
+  // Purely additive, not a replacement: if the production app intercepts this, Android tears
+  // down this page mid-navigation and nothing below ever runs (the app's own appUrlOpen
+  // listener completes the real exchange instead). If nothing intercepts it within the timeout
+  // (app not installed, or this is a plain desktop/web visit), execution just continues
+  // normally below, exactly as it did before this change.
   if(/Android/i.test(navigator.userAgent)){
     window.location.href = 'hobscompanion://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
     await new Promise(function(resolve){ setTimeout(resolve, 900); });
```

---

## Commit `ba5e322` — 2026-09-27T00:09:52+00:00

**Subject**: docs: BUG_LOG #108-109 (calendar-reconnect browser-stranding fix, scheme collision + paused staging DB) + standing lessons

```diff
commit ba5e3226ed7aede9c5834c0b3ba56f58d5743d73
Author: Claude <claude@hobsfoundation.com>
Date:   Sun Sep 27 00:09:52 2026 +0000

    docs: BUG_LOG #108-109 (calendar-reconnect browser-stranding fix, scheme collision + paused staging DB) + standing lessons
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index 7e47d04..4819f54 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -1933,6 +1933,54 @@ resolve -- it can often be answered directly from an APK or repo already in hand
 actually checked. And staging is not automatically ahead of production on every fix; check which
 build a specific fix actually landed in before assuming either one is current.
 
+### 108. Google Calendar reconnect kept "getting stuck in the browser" -- real, repeated report, not a fresh regression
+**What happened**: reconnecting Google Calendar repeatedly left the person stranded on the web
+version of the app inside a browser/Custom Tab instead of returning to the native app. Root
+cause, confirmed directly against the deployed `google-calendar-oauth` function and the client
+code: Google's OAuth client here is a "Web application" type, which only accepts `https://`
+redirect URIs -- Google flatly rejects a custom scheme for this client type. The connection
+itself was already completing correctly server-side (a real fix from Sept 16, 2026, confirmed
+present in the current production APK) -- what was missing was any way back into the native app
+beyond a banner asking the person to manually tap the browser's back arrow, since
+`Browser.close()` is a documented no-op on Android.
+**Real fix**: on Android, the callback page now attempts an immediate handoff to the native
+app's own custom scheme before doing anything else -- if the app is installed, Android
+intercepts this and tears the browser page down mid-navigation; the app's own `appUrlOpen`
+listener (new `gcal_code`/`gcal_state` branch, deliberately distinct from Supabase's own
+`?code=` Sign-In branch) completes the connection from inside the app directly. Purely additive
+-- if nothing intercepts it within ~900ms, the existing browser-side completion + banner runs
+exactly as before.
+**Not yet deployed anywhere** as of this entry -- committed to source control, pending a staging
+build and a real-device test (see #109 for a real complication found while preparing that test).
+**Standing lesson, added below**: a browser-based OAuth completion succeeding server-side is not
+the same as the person actually getting back into the app -- check the actual return path
+Android-side, not just that the connection was saved.
+
+### 109. Staging and production apps registered the identical `hobscompanion://` custom scheme -- a real collision waiting to happen, found while preparing to test #108
+**What happened**: while preparing to test #108's fix on staging, found that
+`AndroidManifest-staging.xml` registered the exact same `hobscompanion://` scheme as
+production's manifest. With both apps installed side by side -- the normal, documented setup --
+Android has no reliable way to know which one should catch a link using that scheme; any
+deep-link handoff (Sign-In's existing one, or #108's new one) could land in the wrong app.
+Compounding this: Google's OAuth redirect_uri for the Calendar flow is hardcoded to the
+*production* website for both staging and production client code (only one redirect_uri is
+registered with this Google OAuth client), so the shared landing page has to be told which app
+originated a given request, since neither its own domain nor its own backend project can tell it.
+**Also found in the same pass**: the staging Supabase project (`ivqlqrpcamoshmgibjph`) was
+paused (`INACTIVE`, Free-tier auto-pause) -- staging was non-functional regardless of any app
+fix. Restored via the Management API, confirmed `ACTIVE_HEALTHY`. Its Auth "Redirect URLs"
+allow-list was also missing `hobscompanion://callback` entirely, meaning native Sign-In via that
+exact path may never have actually been exercised successfully on staging before this.
+**Real fix**: staging now registers its own distinct scheme, `hobscompanionstaging://` (manifest
++ `NATIVE_CALLBACK_URL` + Supabase Auth allow-list all updated and confirmed via live read-back).
+For the Calendar flow specifically, staging's own OAuth request now prefixes its state token
+`stg:` before it ever reaches Google -- the only channel available to signal origin to the shared
+production landing page, since Google echoes `state` back verbatim without touching it.
+**Standing lesson, added below**: "installs side by side, doesn't conflict" (the stated design
+goal for staging vs production) needs to be checked against every mechanism that routes by a
+shared identifier, not just the package name -- a custom URL scheme is exactly this kind of
+shared identifier and was never actually verified distinct until this incident.
+
 ---
 
 ## Standing lessons (do not re-learn these)
@@ -2022,3 +2070,13 @@ Skipping this check is how the exact same class of bug happens again.
   (`GET /v1/projects/{ref}/functions`), diff it against both this repo's `supabase/functions/`
   directory and `MASTER.md`'s own function table. All of #104-#106 were found in one such audit;
   assume more exist until a clean one says otherwise (see `MASTER.md` §11).
+- **A server-side OAuth completion succeeding is not the same as the person getting back into
+  the app -- check the actual Android-side return path, not just that the connection saved
+  (#108).**
+- **"Installs side by side, doesn't conflict" needs checking against every shared identifier a
+  staging/production pair uses -- package name isn't the only one. A custom URL scheme is
+  exactly this kind of identifier and was never actually verified distinct until it caused a
+  real incident (#109).**
+- **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
+  any test result against it -- auto-pause after inactivity is real and silent, and staging
+  specifically has no traffic keeping it awake between test sessions (#109).**
```

---

## Commit `0c0251b` — 2026-09-28T17:46:42+00:00

**Subject**: Staging v46: bump version, fix invalid XML comment blocking all staging builds

```diff
commit 0c0251b6ca66f6baf4111d453f008523cab04c63
Author: Claude <claude@hobsfoundation.com>
Date:   Mon Sep 28 17:46:42 2026 +0000

    Staging v46: bump version, fix invalid XML comment blocking all staging builds
    
    - Real installed staging version was v45 (confirmed via aapt dump badging against
      the actual live APK, not the DB -- staging's profiles table currently has zero
      rows). Bumped to versionCode 46 / "staging-v46-oauth-scheme-fix" to carry the
      Google Calendar OAuth reconnect fix and the hobscompanion:// scheme collision
      fix (already on main) onto a real device.
    - AndroidManifest-staging.xml's Sept 27 scheme-collision comment contained a
      literal "--" inside an XML comment, which is invalid XML and made every build
      using this file fail at manifest-merge time. Comment-only fix, no functional
      change.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/AndroidManifest-staging.xml b/android-native-assets/staging-config/AndroidManifest-staging.xml
index 369f4df..f72aba7 100644
--- a/android-native-assets/staging-config/AndroidManifest-staging.xml
+++ b/android-native-assets/staging-config/AndroidManifest-staging.xml
@@ -29,7 +29,7 @@
                  The JS-side appUrlOpen handler already correctly parses this exact URL pattern
                  (its "Token Flow" branch): this was purely a missing registration. -->
             <!-- Real fix, Sept 27 2026: was "hobscompanion", identical to production's own
-                 scheme -- a genuine collision, since Android has no way to know which app
+                 scheme, a genuine collision, since Android has no way to know which app
                  should catch a "hobscompanion://" link if both are installed side by side
                  (the normal, expected setup). Staging gets its own distinct scheme so a
                  deep-link handoff always reaches the right app. -->
diff --git a/android-native-assets/staging-config/app-build-staging.gradle b/android-native-assets/staging-config/app-build-staging.gradle
index b7bb87a..cdb21a9 100644
--- a/android-native-assets/staging-config/app-build-staging.gradle
+++ b/android-native-assets/staging-config/app-build-staging.gradle
@@ -7,8 +7,8 @@ android {
         applicationId "com.hobsfoundation.companion.staging"
         minSdkVersion rootProject.ext.minSdkVersion
         targetSdkVersion rootProject.ext.targetSdkVersion
-        versionCode 45
-        versionName "staging-v45-transcription-quality-fix"
+        versionCode 46
+        versionName "staging-v46-oauth-scheme-fix"
         testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
         aaptOptions {
              // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
```

---

## Commit `1d515c9` — 2026-09-29T02:04:45+00:00

**Subject**: Fix 3 real build-recipe/doc bugs found during the Sept 28 staging build

```diff
commit 1d515c986a616fba5d798201707743e81caeb340
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 02:04:45 2026 +0000

    Fix 3 real build-recipe/doc bugs found during the Sept 28 staging build
    
    1. MASTER.md's Android build recipe never copied
       android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java, even though
       MainActivity.java directly imports and registers it (registerPlugin(...) at line ~99).
       A genuinely fresh checkout would fail to compile -- affects both the production and
       staging recipes. Added the missing cp step with an explanation.
    2. staging-config/README.md's build step 6 said not to copy google-services.json and that
       the gradle guard would skip the Google Services plugin without it. Both claims are stale:
       a real staging Firebase app entry was added Sept 20, 2026 and the gradle guard now
       unconditionally requires the file, throwing a GradleException if it's missing. Corrected
       the instruction to copy it in, same as production.
    3. The same README's "known limitations" section (push notifications never work on staging;
       scheme collision with production) described two problems that are both already resolved
       (Sept 20 and Sept 27, 2026 respectively). Replaced with a short resolved-history note so
       a future build doesn't re-break either fix based on outdated instructions here.
    
    Found and confirmed directly (not assumed) while building and shipping staging v46.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/README.md b/android-native-assets/staging-config/README.md
index 88e5f6e..1714b74 100644
--- a/android-native-assets/staging-config/README.md
+++ b/android-native-assets/staging-config/README.md
@@ -41,34 +41,35 @@ Same as the production recipe in `docs/MASTER.md`, with these differences:
    `package` declaration to `com.hobsfoundation.companion.staging`**, since copying a file into a
    differently-named directory does not change what it declares itself to be; a mismatch here is
    a genuine compile error, not a silent bug.
-6. **Do not copy `google-services.json`** into this build -- it's registered against the
-   production package name only, and `app-build-staging.gradle`'s conditional guard skips the
-   Google Services plugin entirely when that file is absent (confirmed: this is the actual,
-   correct way to disable it, not a workaround). This means push notifications won't work in a
-   staging build until/unless a second Firebase Android app is registered for the staging
-   package -- not needed for testing anything that doesn't depend on push.
+6. **Copy `google-services.json` in, same as production.** This is stale as of Sept 27-28, 2026
+   and was wrong in a real build (`docs/BUG_LOG.md` -- staging build broke on a fresh environment
+   because this step was skipped per this file's old instruction): a second Firebase Android app
+   for `com.hobsfoundation.companion.staging` was registered in the tracked
+   `android-native-assets/firebase/google-services.json` on Sept 20, 2026 for genuine push-notification
+   parity with production, and `app-build-staging.gradle` no longer has any guard -- it now
+   unconditionally requires the file and throws a `GradleException` if it's missing (same real
+   crash-on-launch safety net production's gradle file has, added the same day). Confirm directly
+   in the gradle file before trusting this doc again: `grep -A5 "servicesJSON" app-build-staging.gradle`.
 7. Deploy with the same Hostinger MCP mechanism `deployment/deploy-to-hostinger.sh` uses, pointed
    at `staging-app.homeofbeautifulsouls.com` instead -- the script's own file list is
    production-filename-specific (`HOBS-Companion.apk`, `HOBS-Companion-v*.apk`), so either invoke
    the same underlying MCP call directly for a one-off staging deploy (as was done here), or
    extend the script with a `--staging` mode if this becomes routine enough to warrant it.
 
-## The one real, known limitation of this staging setup
+## Update, Sept 20-28 2026: both limitations below are resolved -- kept for history only
 
-**Push notifications never work on a staging build** -- `google-services.json` is registered
-against the production package name only, and including it for a mismatched staging package fails
-the build outright. Beyond that: leave `@capacitor/push-notifications` entirely out of the
-staging build's own `package.json` (do not just omit the config file and keep the plugin) --
-Firebase auto-initializes at app launch by default, and a staging build with the plugin's
-Firebase-dependent code compiled in but no valid config for it to read crashed the app
-immediately on open (real incident, confirmed via the compiled `.dex`, see BUG_LOG #70). Removing
-the plugin from the dependency list itself, not just skipping the config file, is what actually
-fixes this -- confirmed by checking the resulting `.dex` has zero Firebase-related classes at all.
+**Push notifications**: resolved Sept 20, 2026. A real second Firebase Android app was
+registered for `com.hobsfoundation.companion.staging` in the tracked `google-services.json`, and
+staging's gradle file was brought to parity with production's (unconditional require, loud
+failure if missing -- see step 6 above). The BUG_LOG #70 crash-on-launch this section used to warn
+about was real, but was about the plugin being compiled in with *no* config at all, not about
+staging having its own config -- that's fixed now, don't re-remove
+`@capacitor/push-notifications` from staging's `package.json` based on this old text.
 
-The Google Sign-In custom URL scheme (`hobscompanion://callback`) is currently identical between
-production and staging. With both apps installed on the same device, Android's handling of two
-apps claiming the same custom scheme is untested and could misroute. Not fixed yet since it
-wasn't relevant to the alarm feature test this was built for -- email/password login is
-unaffected either way. Worth a distinct scheme (e.g. `hobscompanionstaging://callback`) plus a
-matching Google Cloud Console redirect URI registration before Google Sign-In is something that
-needs testing on staging specifically.
+**Scheme collision**: resolved Sept 27, 2026 (`docs/BUG_LOG.md` #109). Staging now uses its own
+distinct scheme, `hobscompanionstaging://callback` (not `hobscompanion://callback`), registered
+in `AndroidManifest-staging.xml` and matched in this directory's `index.html` /
+`NATIVE_CALLBACK_URL`. Both apps can be installed side by side safely now; no Google Cloud
+Console changes were needed since the shared `redirect_uri` is still the production website
+either way (see `docs/BUG_LOG.md` #108-109 for the full mechanism -- an origin-prefixed `state`
+param tells the site which app/scheme to hop back to).
diff --git a/docs/MASTER.md b/docs/MASTER.md
index 71a97cd..881fabe 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -315,6 +315,14 @@ cp -r ../hobs-repo/android-native-assets/icons/* android/app/src/main/res/
 cp ../hobs-repo/android-native-assets/signing/hobs-release.keystore android/app/hobs-release.keystore
 cp ../hobs-repo/android-native-assets/firebase/google-services.json android/app/google-services.json
 cp ../hobs-repo/android-native-assets/mainactivity/MainActivity.java android/app/src/main/java/com/hobsfoundation/companion/MainActivity.java
+cp ../hobs-repo/android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java android/app/src/main/java/com/hobsfoundation/companion/
+# ^ Real, confirmed missing step until Sept 28, 2026 (found building a staging APK): MainActivity.java
+# calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)` directly (line ~99) and imports it --
+# this recipe compiled clean for months only because whoever built last always had a stale local
+# checkout that still had this file copied in from an earlier manual step, never because it wasn't
+# needed. Skipping this line is a genuine compile error on a truly fresh environment, in BOTH the
+# production and staging recipes. For a staging build, remember step 5 below also applies to this
+# file: copy it into the `.../companion/staging/` path instead and fix its own `package` line.
 cp ../hobs-repo/android-native-assets/alarm-feature/*.java android/app/src/main/java/com/hobsfoundation/companion/
 cp ../hobs-repo/android-native-assets/alarm-feature/res-layout/activity_alarm.xml android/app/src/main/res/layout/activity_alarm.xml
 cp ../hobs-repo/android-native-assets/build-config/app-build.gradle android/app/build.gradle
```

---

## Commit `6067e0b` — 2026-09-29T05:29:56+00:00

**Subject**: Fix real bug: profile edit save silently failed for every user with a saved phone number

```diff
commit 6067e0b88bc7513c5607e020820a5a1d0f19ac61
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:29:56 2026 +0000

    Fix real bug: profile edit save silently failed for every user with a saved phone number
    
    Root cause, confirmed directly (DB constraints, function source, and JS all read live):
    - profiles.phone_number / emergency_contact_phone are stored E.164-style ("+91XXXXXXXXXX"),
      enforced by CHECK constraints calling is_valid_wa_phone(). Confirmed: all 30 real profile
      rows with a phone number currently match this format.
    - The "You" edit-profile screen's phone inputs have maxlength="10" for a clean local-number
      UX, but openEditProfile() was loading the full "+91XXXXXXXXXX" value straight into them.
      The browser silently truncates that assignment to fit maxlength, so the field displayed a
      plausible-looking but wrong 10-character fragment.
    - Clicking Save re-read that truncated value and wrote it back verbatim -- now permanently
      missing "+91" -- which the DB CHECK constraint rejects. This happened on every single save
      for every user who already had a phone number saved, regardless of what field they actually
      changed, and surfaced as a generic "Could not save -- check your connection" toast that had
      nothing to do with connectivity.
    
    Fix: strip the "+91" prefix for display (stripWaPrefix) when loading epPhone/epEmergencyPhone/
    consentPhone, and always re-add it (toWaPhone) before writing phone_number/
    emergency_contact_phone back to the DB. No existing data needed fixing -- the constraint was
    correctly rejecting every bad write all along, so nothing bad ever persisted.
    
    Reported directly by Akash via a real user's screenshot; root-caused end to end (schema,
    constraint, function source, and both read/write JS paths) before making this change.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/index.html b/index.html
index 58a77bf..a3e6ccb 100644
--- a/index.html
+++ b/index.html
@@ -3645,13 +3645,30 @@ document.getElementById('obSaveBtn').onclick = function(){
 };
 
 // ================= EDIT PROFILE (post-onboarding self-service) =================
+// Real bug fix, Sept 29 2026: profiles.phone_number / emergency_contact_phone are stored in
+// full WhatsApp/E.164 format ("+91XXXXXXXXXX", enforced by a DB CHECK constraint,
+// is_valid_wa_phone()). This screen's inputs are bare 10-digit fields (maxlength="10") for a
+// clean local-number UX. Loading the full "+91..." value straight into a maxlength=10 field
+// got silently truncated by the browser to a 10-character fragment -- which then got saved
+// back as-is on the NEXT save (even one touching only, say, the address field), permanently
+// missing "+91", and the DB constraint rejected it every time. This surfaced to users as a
+// generic "Could not save -- check your connection" error on every single save, unrelated to
+// their actual connection. Fix: always strip "+91" for display here, and always add it back
+// before writing (see epSaveBtn below).
+function stripWaPrefix(p){
+  return (p || '').replace(/^\+91/, '');
+}
+function toWaPhone(p){
+  p = (p || '').trim();
+  return p ? '+91' + p : null;
+}
 function openEditProfile(){
   document.getElementById('epName').value = appState.displayName || '';
-  document.getElementById('epPhone').value = appState.phoneNumber || '';
+  document.getElementById('epPhone').value = stripWaPrefix(appState.phoneNumber);
   document.getElementById('epDob').value = appState.dateOfBirth || '';
   document.getElementById('epAddress').value = appState.address || '';
   document.getElementById('epEmergencyName').value = appState.emergencyContactName || '';
-  document.getElementById('epEmergencyPhone').value = appState.emergencyContactPhone || '';
+  document.getElementById('epEmergencyPhone').value = stripWaPrefix(appState.emergencyContactPhone);
   document.getElementById('epPronounCustom').style.display = 'none';
   document.getElementById('epPronounCustom').value = '';
 
@@ -3797,8 +3814,8 @@ document.getElementById('epSaveBtn').onclick = function(){
   btn.textContent = 'Saving...'; btn.disabled = true;
 
   var updatePayload = {
-    name: name, pronouns: pronouns, phone_number: phone, date_of_birth: dob,
-    address: address || null, emergency_contact_name: emergencyName || null, emergency_contact_phone: emergencyPhone || null
+    name: name, pronouns: pronouns, phone_number: toWaPhone(phone), date_of_birth: dob,
+    address: address || null, emergency_contact_name: emergencyName || null, emergency_contact_phone: toWaPhone(emergencyPhone)
   };
   if(pendingPhotoUrl) updatePayload.photo_url = pendingPhotoUrl;
 
@@ -4063,7 +4080,7 @@ document.getElementById('basicTosGateSubmitBtn').onclick = function(){
 
 function showConsentGate(resumeAction){
   consentGatePendingAction = resumeAction || null;
-  document.getElementById('consentPhone').value = appState.phoneNumber || '';
+  document.getElementById('consentPhone').value = stripWaPrefix(appState.phoneNumber);
   document.getElementById('consentGateError').style.display = 'none';
   document.getElementById('consentGateOverlay').style.display = 'flex';
 }
```

---

## Commit `f69f4b5` — 2026-09-29T05:33:29+00:00

**Subject**: Show real save errors instead of a misleading generic 'check your connection' message

```diff
commit f69f4b526e93e45e3f2cb2e031ba125e79038194
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:33:29 2026 +0000

    Show real save errors instead of a misleading generic 'check your connection' message
    
    Every save handler showed the identical, generic error message for ANY failure -- a real
    network problem, a database constraint violation, a permissions issue, all looked the same to
    the user (and to us, debugging a report). This is exactly what hid the phone-format bug in the
    previous commit from being diagnosable from a user's own report of what they saw.
    
    Added describeSaveError(): logs the raw Supabase/Postgres error to console always, and maps
    known cases (phone format, RLS/permission denial, missing foreign-key reference, genuine
    network failure) to an honest, specific message; anything unrecognized now shows the real
    error text instead of a fabricated connectivity claim. Wired into the two save handlers
    involved in the phone bug (profile edit, consent agreement) for now.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/index.html b/index.html
index a3e6ccb..0236cb2 100644
--- a/index.html
+++ b/index.html
@@ -3662,6 +3662,22 @@ function toWaPhone(p){
   p = (p || '').trim();
   return p ? '+91' + p : null;
 }
+// Real fix, Sept 29 2026, same incident as above: every save handler in this file showed the
+// identical "Could not save -- check your connection" message for ANY database error, whether
+// it was actually a network problem or not -- which is exactly what hid this phone-format bug
+// from being diagnosable from a user's own report. Real errors from Supabase/Postgres arrive in
+// result.error.message; this maps the ones we know about to an honest, specific message, and
+// always logs the raw error so it's checkable in the browser console too.
+function describeSaveError(error){
+  var msg = (error && error.message) || '';
+  console.error('Save failed:', error);
+  if(/profiles_phone_number_valid/.test(msg)) return "That phone number doesn't look valid — please enter a 10-digit number starting with 6-9.";
+  if(/profiles_emergency_phone_valid/.test(msg)) return "Your emergency contact's phone number doesn't look valid — please enter a 10-digit number starting with 6-9.";
+  if(/permission denied|row-level security|RLS/i.test(msg)) return "You don't have permission to save this. Please log out and back in, or message us if it keeps happening.";
+  if(/violates foreign key/i.test(msg)) return 'Something this refers to no longer exists — please refresh the page and try again.';
+  if(/fetch|network|Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server — check your connection and try again.';
+  return msg ? ('Could not save: ' + msg) : 'Could not save — please try again.';
+}
 function openEditProfile(){
   document.getElementById('epName').value = appState.displayName || '';
   document.getElementById('epPhone').value = stripWaPrefix(appState.phoneNumber);
@@ -3822,7 +3838,7 @@ document.getElementById('epSaveBtn').onclick = function(){
   sb.from('profiles').update(updatePayload).eq('user_id', currentUser.id).then(function(result){
     btn.textContent = 'Save Changes'; btn.disabled = false;
     if(result.error){
-      errEl.textContent = 'Could not save — check your connection and try again.';
+      errEl.textContent = describeSaveError(result.error);
       errEl.style.display = 'block';
       return;
     }
@@ -4136,7 +4152,7 @@ document.getElementById('consentGateSubmitBtn').onclick = function(){
     if(result.error){
       btn.disabled = false;
       btn.textContent = 'I Agree & Continue';
-      showToast('Could not save — please check your connection and try again.');
+      showToast(describeSaveError(result.error));
       return;
     }
     sb.from('profiles').update({ consent_signed: true }).eq('user_id', currentUser.id).then(function(){});
```

---

## Commit `f51aba3` — 2026-09-29T05:43:50+00:00

**Subject**: Log #110-113 (staging build, staging Google Sign-In, production phone-save bug, generic error messages) and add a standing rule to log every real change as it happens

```diff
commit f51aba365beb5d14dbda06fc86a90fc5562bcc28
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:43:50 2026 +0000

    Log #110-113 (staging build, staging Google Sign-In, production phone-save bug, generic
    error messages) and add a standing rule to log every real change as it happens
    
    Akash asked directly for every change to be recorded -- what changed, where, and what it did
    -- rather than only at session end. Backfilled BUG_LOG.md with everything from today's real
    work that wasn't yet written up, and added an explicit CLAUDE.md rule so this holds for future
    sessions too, not just this one.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/CLAUDE.md b/CLAUDE.md
index 76bb100..7cd6cdd 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -26,6 +26,12 @@ zip over live state, has caused real, repeated problems in this project's histor
 - **Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
   describing real work on this app ends.** Not "next session." This file only helps if those
   three stay current.
+- **Log every real change to `docs/BUG_LOG.md` as it happens, in the same turn it's made — not
+  batched for the end of the session.** Akash asked for this explicitly (Sept 29, 2026, see
+  BUG_LOG #110-113 and the standing lesson under them) after several real fixes in one session
+  went unrecorded until he had to ask. For each real change: what changed, in which file/system,
+  and exactly what it did or fixed — the same format the existing numbered entries use. This
+  covers code changes, config/database changes, and deploys — not read-only investigation.
 - Communication: short, direct messages. No long paragraphs unless explicitly asked for detail.
   Akash (the founder) is neurodivergent (ADHD) and has said this explicitly, more than once.
 
diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index 4819f54..df2e334 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -1983,6 +1983,98 @@ shared identifier and was never actually verified distinct until this incident.
 
 ---
 
+## September 28–29, 2026 — Staging build, staging Google Sign-In, and a real production save bug
+
+### 110. Three real defects blocked a truly fresh staging Android build, all found by actually running it
+**What happened**: building staging v46 from a genuinely fresh environment (SDK installed from
+scratch) hit three separate, real failures in sequence, none previously caught because past
+staging builds always ran on an environment with leftover state from an earlier manual step:
+1. `AndroidManifest-staging.xml` had a literal `--` inside an XML comment (introduced by the
+   scheme-collision fix, commit `d8faf1e`) — invalid XML, broke manifest merging outright.
+2. `staging-config/README.md` said not to copy `google-services.json` for staging and that
+   `app-build-staging.gradle`'s guard would skip the Google plugin without it. Both claims were
+   stale: a real staging Firebase app entry was added Sept 20, 2026, and the gradle file no
+   longer has any guard — it unconditionally requires the file (`GradleException` if missing).
+3. `MASTER.md`'s Android build recipe never copied
+   `android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java`, even though
+   `MainActivity.java` directly imports and calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)`
+   — a genuine compile error on a truly fresh checkout, affecting **both** the production and
+   staging recipes, not just staging.
+**Real fix**: manifest comment fixed (`0c0251b`); `README.md` and `MASTER.md` corrected to match
+the real, current state of both files (`1d515c9`). Staging v46 built clean afterward, verified
+(signature SHA-256 matches the real keystore fingerprint, package `com.hobsfoundation.companion.staging`,
+versionCode 46) and deployed to `staging-app.homeofbeautifulsouls.com` — confirmed live by
+downloading it back and matching its SHA-256 to the local build.
+**Also found and fixed while here**: the staging site's own `version.json`/`index.html` claimed
+a stale version ("v49") that didn't match what the real live APK actually was (v45, confirmed via
+`aapt dump badging` on the downloaded live file) — corrected by this same deploy.
+
+### 111. Staging's Google Sign-In was fully broken -- Auth provider disabled, and Google never had staging's callback URL registered
+**What happened**: Akash reported a real device hitting
+`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
+on staging. Queried staging's live Supabase Auth config directly and confirmed
+`external_google_enabled: false`, `external_google_client_id: null` -- Google Sign-In had never
+actually been configured for the staging project, despite Akash's recollection that it worked
+before. No commit, doc, or BUG_LOG entry anywhere in this repo's history shows it ever being set
+up, and there's no audit-log API available on this project's Supabase plan to settle definitively
+what changed it or when -- the most likely candidate is the staging project's pause/restore cycle
+during #109's work two days earlier, since Supabase free-tier restores can drop Auth provider
+config, but this is a plausible explanation, not a proven one.
+**Real fix, partial**: enabled `external_google_enabled` on staging using production's same OAuth
+client ID/secret (`PATCH /v1/projects/ivqlqrpcamoshmgibjph/config/auth`). Testing the real
+authorize flow afterward surfaced a second, separate real problem: Google itself rejects it with
+`redirect_uri_mismatch` (confirmed directly by following the actual redirect chain) because
+staging's own callback (`https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/callback`) was never
+added to that OAuth client's allowed redirect URIs in Google Cloud Console -- only production's
+callback ever was. **This second half is not fixed as of this entry** -- it requires a Google
+Cloud Console change this session has no API access to make; Akash was given the exact manual
+steps.
+**Standing lesson, added below**: a Supabase project pause/restore is a real, silent risk to
+Auth provider config, not just to the database being reachable -- and a shared-nothing OAuth
+setup (two Supabase projects, one Google OAuth client) needs each project's own callback URL
+explicitly registered in Google Cloud Console; it is never automatic just because production's
+already works.
+
+### 112. Production: profile-edit save silently failed for every user who already had a saved phone number
+**What happened**: a real user's screenshot showed "Could not save — check your connection and
+try again" on the "You" profile screen, saving nothing but a DOB/address/emergency-contact edit.
+Root-caused end to end, not guessed: `profiles.phone_number` / `emergency_contact_phone` are
+stored E.164-style (`+91XXXXXXXXXX`), enforced by a real CHECK constraint
+(`is_valid_wa_phone()`, added in #102 on Sept 27). The "You" screen's phone inputs have
+`maxlength="10"` for a clean local-number UX, but `openEditProfile()` was loading the full
+`+91XXXXXXXXXX` value straight into them -- the browser silently truncates that assignment to
+fit the field, so it displayed a plausible-looking but wrong fragment. Clicking Save re-read that
+truncated value and wrote it back missing `+91`, which the DB constraint correctly rejected --
+on every single save by every user who already had a phone number saved, regardless of what they
+were actually trying to change. This was a real, live-breaking bug affecting all such users,
+confirmed by checking the schema, the constraint definition, the validation function's source,
+and both the read and write JS paths directly (not assumed).
+**Real fix**: strip the `+91` prefix for display (`stripWaPrefix`) when loading `epPhone` /
+`epEmergencyPhone` / `consentPhone`, and always re-add it (`toWaPhone`) before writing
+`phone_number` / `emergency_contact_phone` back to the DB (`6067e0b`). No data needed repairing
+-- the constraint had correctly rejected every bad write the whole time, so nothing bad ever
+persisted. Deployed to production and confirmed live (fetched the served page, found the new
+function names present).
+**Standing lesson, added below**: a DB CHECK constraint added in one session (#102) needs every
+existing client write path touching that column checked in the same session, not just the path
+that prompted adding it.
+
+### 113. Every save handler in the app showed an identical, false "check your connection" message for any database error, not just real network failures
+**What happened**: found while root-causing #112 -- every `sb.from(...).update()/insert()`
+error handler across the app showed the exact same generic connectivity message regardless of
+the real cause (a DB constraint violation, an RLS/permission denial, a genuine network failure
+all looked identical), which is exactly what made #112 undiagnosable from a user's own report of
+what they saw on screen.
+**Real fix**: added `describeSaveError()` -- always logs the real Supabase/Postgres error to the
+browser console, and maps known cases (phone-format constraint, RLS/permission denial, missing
+foreign-key reference, genuine network failure) to an honest, specific message; anything
+unrecognized now shows the real database error text instead of a fabricated connectivity claim.
+Wired into the two handlers involved here (profile edit, consent agreement) (`f69f4b5`); the
+rest of the app's save handlers still show the old generic message and are candidates for the
+same fix later, not yet done as of this entry.
+
+---
+
 ## Standing lessons (do not re-learn these)
 
 **Run `deployment/verify-before-deploy.sh` before every single deploy, web or Android, no
@@ -2080,3 +2172,23 @@ Skipping this check is how the exact same class of bug happens again.
 - **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
   any test result against it -- auto-pause after inactivity is real and silent, and staging
   specifically has no traffic keeping it awake between test sessions (#109).**
+- **A truly fresh build environment is the only real test of a build recipe.** All three defects
+  in #110 existed silently for weeks because every past build happened to run on an environment
+  with leftover manual state from an earlier session -- the recipe documents in `MASTER.md` and
+  the staging `README.md` can go stale exactly like any other doc, and only actually running them
+  from zero catches it.
+- **A shared OAuth client across two Supabase projects (production/staging) needs each project's
+  own callback URL separately, explicitly registered in Google Cloud Console (#111).** Production
+  working is not evidence staging is configured at all -- check both directly.
+- **A DB CHECK constraint added to enforce a real format (like #102's `is_valid_wa_phone`) needs
+  every existing client write path touching that column re-checked in the same session it's
+  added, not just the one that prompted it (#112).** The constraint did its job correctly the
+  entire time; the actual gap was a screen nobody re-checked against the new rule.
+- **A generic error message ("check your connection") shown for any database error, not just
+  real network failures, actively prevents diagnosing real bugs from a user's own report of what
+  they saw (#113).** Surface the real error, or a specific, accurate mapped one -- never a guess
+  dressed up as certainty.
+- **Log every real change to this file as it happens, in the same session, not batched for the
+  end.** Akash asked for this directly (Sept 29, 2026) after several real fixes in one session
+  went unrecorded until asked. A change that isn't written here the same session it happens is a
+  change a future session (or Akash) has no way to find later.
```

---

## Commit `8c1d5a8` — 2026-09-29T05:49:40+00:00

**Subject**: Add docs/CHANGE_LOG.md: a literal, word-for-word record of every change, separate from BUG_LOG.md's narrative version

```diff
commit 8c1d5a8ff86c8ebcaea713c81323c05eca60c542
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 05:49:40 2026 +0000

    Add docs/CHANGE_LOG.md: a literal, word-for-word record of every change, separate from
    BUG_LOG.md's narrative version
    
    Akash asked explicitly for a complete record of every change -- not summarized, exact, word
    for word. BUG_LOG.md (#110-113 etc.) stays the narrative what/why record; this new file is
    the mechanical one: the literal `git show` diff for every code commit this session, and the
    exact command + exact response for every infrastructure/database/deploy action that isn't
    captured by git (Supabase config changes, SQL queries run, Hostinger deploys). Only raw
    secret values are redacted, per this repo's own existing hard rule against ever committing
    credentials -- everything else is verbatim.
    
    Cross-referenced from MASTER.md §1 and §11, and made a standing rule in CLAUDE.md so this
    holds for future sessions too, not just this one.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/CLAUDE.md b/CLAUDE.md
index 7cd6cdd..8d6d01a 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -32,6 +32,14 @@ zip over live state, has caused real, repeated problems in this project's histor
   went unrecorded until he had to ask. For each real change: what changed, in which file/system,
   and exactly what it did or fixed — the same format the existing numbered entries use. This
   covers code changes, config/database changes, and deploys — not read-only investigation.
+- **Also append a literal, word-for-word entry to `docs/CHANGE_LOG.md` for every real change,
+  same turn.** Akash asked for this as a stronger, separate requirement (Sept 29, 2026) after the
+  BUG_LOG rule above: not a paraphrase of what changed, the exact thing. A code change gets its
+  exact `git show <hash>` diff pasted in; an infrastructure/database/deploy action (anything not
+  in git — a Supabase config PATCH, a SQL query, a deploy) gets the exact command run and the
+  exact response received, with only raw secret values redacted (never committed, per this same
+  file's security rule above). See `docs/CHANGE_LOG.md`'s own header for the exact format to
+  follow.
 - Communication: short, direct messages. No long paragraphs unless explicitly asked for detail.
   Akash (the founder) is neurodivergent (ADHD) and has said this explicitly, more than once.
 
diff --git a/docs/CHANGE_LOG.md b/docs/CHANGE_LOG.md
new file mode 100644
index 0000000..1e074fc
--- /dev/null
+++ b/docs/CHANGE_LOG.md
@@ -0,0 +1,1178 @@
+# HOBS Companion — Complete Change Record
+
+Exact, unedited record of every change made in this session (and the two prior sessions
+this one continues from, starting with the calendar-reconnect fix). This file exists
+because Akash asked for a word-for-word record, not a paraphrased summary -- see
+`docs/BUG_LOG.md` #110-113 and its standing lesson for the narrative version (what/why).
+This file is the literal what-changed-where record: every code diff exactly as committed,
+and every infrastructure/database/deploy action exactly as run, in order.
+
+**How to read this file**: code changes are the literal `git show` output for that commit
+-- nothing paraphrased, nothing summarized. Infrastructure changes (Supabase config,
+deploys) are the exact command run and the exact response received, since those aren't
+captured by git.
+
+---
+
+## Commit `8a3e99b` — 2026-09-27T00:01:35+00:00
+
+**Subject**: Google Calendar connect: attempt native-app deep-link handoff on Android before falling back to the browser banner
+
+```diff
+commit 8a3e99bfca9817fa8b927634526079d3cc85f9b8
+Author: Claude <claude@hobsfoundation.com>
+Date:   Sun Sep 27 00:01:35 2026 +0000
+
+    Google Calendar connect: attempt native-app deep-link handoff on Android before falling back to the browser banner
+    
+    Not yet deployed anywhere (not on the production website, not in a staging or production APK
+    build) -- committed to source control only, pending Akash's decision on how to handle two real
+    complications found while preparing to test this on staging (see chat): the OAuth redirect_uri
+    is hardcoded to the production website for both staging and production APKs, so testing this
+    at all requires a production website deploy even for a 'staging test'; and staging/production
+    APKs currently register the identical hobscompanion:// scheme, which could route the handoff to
+    the wrong app if both are installed side by side.
+    
+    Adds a Google-Calendar-specific appUrlOpen branch (gcal_code/gcal_state, deliberately distinct
+    from Supabase's own ?code= Sign-In branch) and an Android-only pre-hop attempt in
+    handleGoogleCalendarCallback() with a timeout fallback to the existing browser-side completion
+    + banner if nothing intercepts it.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/index.html b/index.html
+index b81070d..dee051b 100644
+--- a/index.html
++++ b/index.html
+@@ -2924,6 +2924,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
+ 
+     }
+ 
++    // -------------------------
++    // Google Calendar connect handoff (new, Sept 27 2026)
++    // -------------------------
++    // Not part of Supabase's own auth flow -- this is the Google Calendar OAuth callback
++    // handing off from the external browser/Custom Tab back into the native app, so the
++    // connection completes here (no fallback "tap back arrow" banner needed) instead of
++    // being stranded in the browser. Uses gcal_code/gcal_state specifically so this never
++    // collides with the "?code=" check above (that's Supabase's own param, unrelated).
++    if(url.indexOf("gcal_code=") !== -1){
++
++      console.log("Detected Google Calendar connect handoff");
++
++      try{
++
++        var gcalParsed = new URL(url);
++        var gcalCode = gcalParsed.searchParams.get("gcal_code");
++        var gcalState = gcalParsed.searchParams.get("gcal_state");
++
++        if(gcalCode && gcalState){
++          await completeGoogleCalendarConnect(gcalCode, gcalState);
++        }
++
++      }catch(err){
++        console.error(err);
++        showToast("Couldn't connect your calendar — please try again.");
++      }
++
++      return;
++
++    }
++
+     // -------------------------
+     // Token Flow
+     // -------------------------
+@@ -14263,6 +14294,23 @@ async function handleGoogleCalendarCallback(){
+   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
+   var looksLikeStateToken = stateToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stateToken);
+   if(!code || !looksLikeStateToken) return;
++
++  // New, Sept 27 2026: Google's OAuth client type here only accepts https:// redirect URIs, so
++  // landing in an external browser/Custom Tab (not the native app) is unavoidable -- but if the
++  // native app is actually installed, we can hand off to it immediately via the same custom
++  // scheme (hobscompanion://) Google Sign-In already uses successfully, instead of completing
++  // the connection here and leaving the person stranded on a "tap back" banner.
++  // Purely additive, not a replacement: if the app intercepts this, Android tears down this
++  // page mid-navigation and nothing below ever runs (the app's own appUrlOpen listener
++  // completes the real exchange instead). If nothing intercepts it within the timeout (app not
++  // installed, or this is a plain desktop/web visit), execution just continues normally below,
++  // exactly as it did before this change.
++  if(/Android/i.test(navigator.userAgent)){
++    window.location.href = 'hobscompanion://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
++    await new Promise(function(resolve){ setTimeout(resolve, 900); });
++    if(document.hidden || document.visibilityState === 'hidden') return; // handed off successfully, native app takes over
++  }
++
+   // Real, additional guard, Sept 16 2026: covers the real, narrower window between arriving
+   // here and the success banner actually existing (the network round-trip to exchange the
+   // code) -- the banner-presence check alone doesn't protect this earlier moment, and a forced
+```
+
+---
+
+## Commit `d8faf1e` — 2026-09-27T00:08:47+00:00
+
+**Subject**: Fix real hobscompanion:// scheme collision between staging and production apps
+
+```diff
+commit d8faf1e36b979cdb6e2f147834940fdcf80c168d
+Author: Claude <claude@hobsfoundation.com>
+Date:   Sun Sep 27 00:08:47 2026 +0000
+
+    Fix real hobscompanion:// scheme collision between staging and production apps
+    
+    Staging now registers its own distinct custom scheme (hobscompanionstaging://) instead of
+    duplicating production's exact scheme -- confirmed real: if both apps are installed side by
+    side (the normal setup per docs), Android had no way to know which one should catch a
+    hobscompanion:// link.
+    
+    - AndroidManifest-staging.xml: scheme changed to hobscompanionstaging
+    - staging-config/index.html: NATIVE_CALLBACK_URL updated to match; startGoogleCalendarConnect
+      now prefixes its state token 'stg:' before sending it to Google, since Google always
+      redirects back to the PRODUCTION website regardless of which app started the flow (only one
+      redirect_uri is registered with Google for this OAuth client) -- this prefix is the only way
+      the shared landing page can tell a staging-originated request apart from a production one and
+      hand off to the right app
+    - staging-config/index.html: handleGoogleCalendarCallback and the appUrlOpen listener brought
+      back into sync with production's copy (had drifted -- missing the Sept 16 gcalCallbackInProgress
+      guard entirely); both now attempt a native-app handoff via their own scheme before falling
+      back to browser-side completion
+    - index.html (production): handleGoogleCalendarCallback now detects the 'stg:' prefix and hands
+      off to hobscompanionstaging:// with no web-based fallback for that case (this page's own
+      client is bound to the production Supabase project, so it has no way to correctly exchange a
+      staging-requested code against staging's backend)
+    
+    Also found and fixed in the same pass: the staging Supabase project (ivqlqrpcamoshmgibjph) was
+    paused (auto-pause, Free tier) -- restored via the Management API, confirmed ACTIVE_HEALTHY.
+    Its Auth 'Redirect URLs' allow-list was also missing hobscompanion://callback entirely (should
+    have been hobscompanionstaging://callback all along) -- added, confirmed via a live read-back.
+    
+    Not yet built into any APK -- source control only, pending a staging build + Akash's real-device
+    test.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/android-native-assets/staging-config/AndroidManifest-staging.xml b/android-native-assets/staging-config/AndroidManifest-staging.xml
+index c1ea062..369f4df 100644
+--- a/android-native-assets/staging-config/AndroidManifest-staging.xml
++++ b/android-native-assets/staging-config/AndroidManifest-staging.xml
+@@ -28,11 +28,16 @@
+                  the user is stranded on Google's account picker with no way back into the app.
+                  The JS-side appUrlOpen handler already correctly parses this exact URL pattern
+                  (its "Token Flow" branch): this was purely a missing registration. -->
++            <!-- Real fix, Sept 27 2026: was "hobscompanion", identical to production's own
++                 scheme -- a genuine collision, since Android has no way to know which app
++                 should catch a "hobscompanion://" link if both are installed side by side
++                 (the normal, expected setup). Staging gets its own distinct scheme so a
++                 deep-link handoff always reaches the right app. -->
+             <intent-filter android:autoVerify="false">
+                 <action android:name="android.intent.action.VIEW" />
+                 <category android:name="android.intent.category.DEFAULT" />
+                 <category android:name="android.intent.category.BROWSABLE" />
+-                <data android:scheme="hobscompanion" />
++                <data android:scheme="hobscompanionstaging" />
+             </intent-filter>
+ 
+         </activity>
+diff --git a/android-native-assets/staging-config/index.html b/android-native-assets/staging-config/index.html
+index 19430f5..7c41ec5 100644
+--- a/android-native-assets/staging-config/index.html
++++ b/android-native-assets/staging-config/index.html
+@@ -2608,7 +2608,14 @@ var WEB_APP_URL = 'https://app.homeofbeautifulsouls.com/';
+ // the native update-check safely no-ops rather than checking against a URL that doesn't exist.
+ var REMOTE_VERSION_CHECK_URL = 'https://staging-app.homeofbeautifulsouls.com/version.json';
+ var APK_DOWNLOAD_URL = 'https://staging-app.homeofbeautifulsouls.com/HOBS-Companion-staging.apk';
+-var NATIVE_CALLBACK_URL = 'hobscompanion://callback';
++var NATIVE_CALLBACK_URL = 'hobscompanionstaging://callback';
++// Real fix, Sept 27 2026: was 'hobscompanion://callback', identical to production's -- a real
++// scheme collision with no way for Android to know which app should catch it if both are
++// installed side by side. Staging now uses its own distinct scheme (manifest updated to
++// match), and this project's own Supabase Auth "Redirect URLs" allow-list has been updated to
++// include it (Supabase rejects any redirectTo not on that list) -- confirmed it was previously
++// missing 'hobscompanion://callback' entirely, so native Sign-In via this path may never have
++// actually been tested working on staging before this fix.
+ // Deliberately separate from WEB_APP_URL and NOT updated to the new domain: this exact URL is
+ // registered as the authorized redirect URI for this OAuth client in Google Cloud Console.
+ // Changing it here without also updating it there would break the connection flow outright
+@@ -2790,6 +2797,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
+ 
+     }
+ 
++    // -------------------------
++    // Google Calendar connect handoff (new, Sept 27 2026)
++    // -------------------------
++    // Not part of Supabase's own auth flow -- this is the Google Calendar OAuth callback
++    // handing off from the external browser/Custom Tab back into the native app, so the
++    // connection completes here instead of being stranded in the browser. Uses
++    // gcal_code/gcal_state specifically so this never collides with the "?code=" check above
++    // (that's Supabase's own param, unrelated).
++    if(url.indexOf("gcal_code=") !== -1){
++
++      console.log("Detected Google Calendar connect handoff");
++
++      try{
++
++        var gcalParsed = new URL(url);
++        var gcalCode = gcalParsed.searchParams.get("gcal_code");
++        var gcalState = gcalParsed.searchParams.get("gcal_state");
++
++        if(gcalCode && gcalState){
++          await completeGoogleCalendarConnect(gcalCode, gcalState);
++        }
++
++      }catch(err){
++        console.error(err);
++        showToast("Couldn't connect your calendar — please try again.");
++      }
++
++      return;
++
++    }
++
+     // -------------------------
+     // Token Flow
+     // -------------------------
+@@ -12643,7 +12681,14 @@ async function startGoogleCalendarConnect(){
+     scope: GOOGLE_CALENDAR_SCOPE,
+     access_type: 'offline', // required to receive a refresh token at all
+     prompt: 'consent',      // forces a fresh refresh token every time, not just on first-ever connect
+-    state: tokenData.token
++    // Prefixed 'stg:', Sept 27 2026: Google always redirects to the PRODUCTION website
++    // (redirect_uri is shared/hardcoded, only one URI is registered with Google for this
++    // client) regardless of which app started the flow -- so the page that lands there needs
++    // a way to tell a staging-initiated request apart from a production one, to hand off to
++    // the right app via the right custom scheme. This prefix is that signal. The raw,
++    // unprefixed token underneath is unchanged and is exactly what this project's own
++    // exchange_code action still validates against.
++    state: 'stg:' + tokenData.token
+   }).toString();
+ 
+   // Real, confirmed cause of "clicked continue but never came back to the app": Google's OAuth
+@@ -12938,14 +12983,29 @@ document.getElementById('gcalEventEditDeleteBtn').onclick = async function(){
+ async function handleGoogleCalendarCallback(){
+   var params = new URLSearchParams(window.location.search);
+   var code = params.get('code');
+-  var stateToken = params.get('state');
++  var rawStateParam = params.get('state');
++  var stateToken = (rawStateParam && rawStateParam.indexOf('stg:') === 0) ? rawStateParam.slice(4) : rawStateParam;
+   // A UUID state token specifically (not any other feature that might use ?state= or ?code=
+   // on this same URL) -- the format itself is the signal, since this can no longer check
+   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
+   var looksLikeStateToken = stateToken && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stateToken);
+   if(!code || !looksLikeStateToken) return;
++
++  // Synced from the production copy, Sept 27 2026 (this file had fallen out of sync with it --
++  // see the README's own warning about that). In practice, Google always redirects to the
++  // PRODUCTION website for this flow (see index.html's own comment on this), so this exact
++  // function rarely if ever actually runs -- it only matters if staging's own site is loaded
++  // directly. Kept at parity anyway per this directory's own stated convention.
++  if(/Android/i.test(navigator.userAgent)){
++    window.location.href = 'hobscompanionstaging://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
++    await new Promise(function(resolve){ setTimeout(resolve, 900); });
++    if(document.hidden || document.visibilityState === 'hidden') return;
++  }
++
++  window.gcalCallbackInProgress = true;
+   window.history.replaceState({}, document.title, window.location.pathname);
+   await completeGoogleCalendarConnect(code, stateToken);
++  window.gcalCallbackInProgress = false;
+   // Real, documented platform limitation, confirmed via Capacitor's own docs: Browser.close()
+   // is "Web & iOS only... No-op on other platforms" -- it never actually closes anything on
+   // Android, regardless of how correctly it's called. completeGoogleCalendarConnect's own
+diff --git a/index.html b/index.html
+index dee051b..58a77bf 100644
+--- a/index.html
++++ b/index.html
+@@ -14288,7 +14288,14 @@ document.getElementById('gcalEventEditDeleteBtn').onclick = async function(){
+ async function handleGoogleCalendarCallback(){
+   var params = new URLSearchParams(window.location.search);
+   var code = params.get('code');
+-  var stateToken = params.get('state');
++  var rawStateParam = params.get('state');
++  // Sept 27 2026: a staging-initiated request prefixes its state 'stg:' before ever reaching
++  // Google, specifically because Google always redirects back to THIS website (production)
++  // regardless of which app started the flow -- there is only one redirect_uri registered with
++  // Google for this OAuth client. This prefix is the only signal available here for telling a
++  // staging request apart from a production one, so the right app can be handed off to.
++  var isStagingOrigin = rawStateParam && rawStateParam.indexOf('stg:') === 0;
++  var stateToken = isStagingOrigin ? rawStateParam.slice(4) : rawStateParam;
+   // A UUID state token specifically (not any other feature that might use ?state= or ?code=
+   // on this same URL) -- the format itself is the signal, since this can no longer check
+   // against a fixed literal string the way the old 'gcal_connect' constant allowed.
+@@ -14297,14 +14304,33 @@ async function handleGoogleCalendarCallback(){
+ 
+   // New, Sept 27 2026: Google's OAuth client type here only accepts https:// redirect URIs, so
+   // landing in an external browser/Custom Tab (not the native app) is unavoidable -- but if the
+-  // native app is actually installed, we can hand off to it immediately via the same custom
+-  // scheme (hobscompanion://) Google Sign-In already uses successfully, instead of completing
+-  // the connection here and leaving the person stranded on a "tap back" banner.
+-  // Purely additive, not a replacement: if the app intercepts this, Android tears down this
+-  // page mid-navigation and nothing below ever runs (the app's own appUrlOpen listener
+-  // completes the real exchange instead). If nothing intercepts it within the timeout (app not
+-  // installed, or this is a plain desktop/web visit), execution just continues normally below,
+-  // exactly as it did before this change.
++  // native app is actually installed, we can hand off to it immediately via its own custom
++  // scheme (the same mechanism Google Sign-In already uses successfully), instead of completing
++  // the connection here and leaving the person stranded on a "tap back" banner. Staging and
++  // production each register their own distinct scheme (see AndroidManifest.xml /
++  // AndroidManifest-staging.xml) specifically so this always reaches the right app, never both.
++  //
++  // A staging-originated request (isStagingOrigin) can ONLY be completed by handing off --
++  // this production page's own `sb` client is bound to the PRODUCTION Supabase project, so it
++  // has no way to correctly exchange a code that was requested against staging's backend. If
++  // the hop doesn't land (staging app not installed here), there is deliberately no web-based
++  // fallback for this case -- say so plainly rather than pretending to complete it.
++  if(isStagingOrigin){
++    window.gcalCallbackInProgress = true;
++    window.history.replaceState({}, document.title, window.location.pathname);
++    window.location.href = 'hobscompanionstaging://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
++    await new Promise(function(resolve){ setTimeout(resolve, 900); });
++    window.gcalCallbackInProgress = false;
++    if(document.hidden || document.visibilityState === 'hidden') return; // handed off successfully
++    showToast("Couldn't reach the HOBS Companion (Staging) app on this device — open it directly and try connecting again from there.");
++    return;
++  }
++
++  // Purely additive, not a replacement: if the production app intercepts this, Android tears
++  // down this page mid-navigation and nothing below ever runs (the app's own appUrlOpen
++  // listener completes the real exchange instead). If nothing intercepts it within the timeout
++  // (app not installed, or this is a plain desktop/web visit), execution just continues
++  // normally below, exactly as it did before this change.
+   if(/Android/i.test(navigator.userAgent)){
+     window.location.href = 'hobscompanion://callback?gcal_code=' + encodeURIComponent(code) + '&gcal_state=' + encodeURIComponent(stateToken);
+     await new Promise(function(resolve){ setTimeout(resolve, 900); });
+```
+
+---
+
+## Commit `ba5e322` — 2026-09-27T00:09:52+00:00
+
+**Subject**: docs: BUG_LOG #108-109 (calendar-reconnect browser-stranding fix, scheme collision + paused staging DB) + standing lessons
+
+```diff
+commit ba5e3226ed7aede9c5834c0b3ba56f58d5743d73
+Author: Claude <claude@hobsfoundation.com>
+Date:   Sun Sep 27 00:09:52 2026 +0000
+
+    docs: BUG_LOG #108-109 (calendar-reconnect browser-stranding fix, scheme collision + paused staging DB) + standing lessons
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
+index 7e47d04..4819f54 100644
+--- a/docs/BUG_LOG.md
++++ b/docs/BUG_LOG.md
+@@ -1933,6 +1933,54 @@ resolve -- it can often be answered directly from an APK or repo already in hand
+ actually checked. And staging is not automatically ahead of production on every fix; check which
+ build a specific fix actually landed in before assuming either one is current.
+ 
++### 108. Google Calendar reconnect kept "getting stuck in the browser" -- real, repeated report, not a fresh regression
++**What happened**: reconnecting Google Calendar repeatedly left the person stranded on the web
++version of the app inside a browser/Custom Tab instead of returning to the native app. Root
++cause, confirmed directly against the deployed `google-calendar-oauth` function and the client
++code: Google's OAuth client here is a "Web application" type, which only accepts `https://`
++redirect URIs -- Google flatly rejects a custom scheme for this client type. The connection
++itself was already completing correctly server-side (a real fix from Sept 16, 2026, confirmed
++present in the current production APK) -- what was missing was any way back into the native app
++beyond a banner asking the person to manually tap the browser's back arrow, since
++`Browser.close()` is a documented no-op on Android.
++**Real fix**: on Android, the callback page now attempts an immediate handoff to the native
++app's own custom scheme before doing anything else -- if the app is installed, Android
++intercepts this and tears the browser page down mid-navigation; the app's own `appUrlOpen`
++listener (new `gcal_code`/`gcal_state` branch, deliberately distinct from Supabase's own
++`?code=` Sign-In branch) completes the connection from inside the app directly. Purely additive
++-- if nothing intercepts it within ~900ms, the existing browser-side completion + banner runs
++exactly as before.
++**Not yet deployed anywhere** as of this entry -- committed to source control, pending a staging
++build and a real-device test (see #109 for a real complication found while preparing that test).
++**Standing lesson, added below**: a browser-based OAuth completion succeeding server-side is not
++the same as the person actually getting back into the app -- check the actual return path
++Android-side, not just that the connection was saved.
++
++### 109. Staging and production apps registered the identical `hobscompanion://` custom scheme -- a real collision waiting to happen, found while preparing to test #108
++**What happened**: while preparing to test #108's fix on staging, found that
++`AndroidManifest-staging.xml` registered the exact same `hobscompanion://` scheme as
++production's manifest. With both apps installed side by side -- the normal, documented setup --
++Android has no reliable way to know which one should catch a link using that scheme; any
++deep-link handoff (Sign-In's existing one, or #108's new one) could land in the wrong app.
++Compounding this: Google's OAuth redirect_uri for the Calendar flow is hardcoded to the
++*production* website for both staging and production client code (only one redirect_uri is
++registered with this Google OAuth client), so the shared landing page has to be told which app
++originated a given request, since neither its own domain nor its own backend project can tell it.
++**Also found in the same pass**: the staging Supabase project (`ivqlqrpcamoshmgibjph`) was
++paused (`INACTIVE`, Free-tier auto-pause) -- staging was non-functional regardless of any app
++fix. Restored via the Management API, confirmed `ACTIVE_HEALTHY`. Its Auth "Redirect URLs"
++allow-list was also missing `hobscompanion://callback` entirely, meaning native Sign-In via that
++exact path may never have actually been exercised successfully on staging before this.
++**Real fix**: staging now registers its own distinct scheme, `hobscompanionstaging://` (manifest
+++ `NATIVE_CALLBACK_URL` + Supabase Auth allow-list all updated and confirmed via live read-back).
++For the Calendar flow specifically, staging's own OAuth request now prefixes its state token
++`stg:` before it ever reaches Google -- the only channel available to signal origin to the shared
++production landing page, since Google echoes `state` back verbatim without touching it.
++**Standing lesson, added below**: "installs side by side, doesn't conflict" (the stated design
++goal for staging vs production) needs to be checked against every mechanism that routes by a
++shared identifier, not just the package name -- a custom URL scheme is exactly this kind of
++shared identifier and was never actually verified distinct until this incident.
++
+ ---
+ 
+ ## Standing lessons (do not re-learn these)
+@@ -2022,3 +2070,13 @@ Skipping this check is how the exact same class of bug happens again.
+   (`GET /v1/projects/{ref}/functions`), diff it against both this repo's `supabase/functions/`
+   directory and `MASTER.md`'s own function table. All of #104-#106 were found in one such audit;
+   assume more exist until a clean one says otherwise (see `MASTER.md` §11).
++- **A server-side OAuth completion succeeding is not the same as the person getting back into
++  the app -- check the actual Android-side return path, not just that the connection saved
++  (#108).**
++- **"Installs side by side, doesn't conflict" needs checking against every shared identifier a
++  staging/production pair uses -- package name isn't the only one. A custom URL scheme is
++  exactly this kind of identifier and was never actually verified distinct until it caused a
++  real incident (#109).**
++- **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
++  any test result against it -- auto-pause after inactivity is real and silent, and staging
++  specifically has no traffic keeping it awake between test sessions (#109).**
+```
+
+---
+
+## Commit `0c0251b` — 2026-09-28T17:46:42+00:00
+
+**Subject**: Staging v46: bump version, fix invalid XML comment blocking all staging builds
+
+```diff
+commit 0c0251b6ca66f6baf4111d453f008523cab04c63
+Author: Claude <claude@hobsfoundation.com>
+Date:   Mon Sep 28 17:46:42 2026 +0000
+
+    Staging v46: bump version, fix invalid XML comment blocking all staging builds
+    
+    - Real installed staging version was v45 (confirmed via aapt dump badging against
+      the actual live APK, not the DB -- staging's profiles table currently has zero
+      rows). Bumped to versionCode 46 / "staging-v46-oauth-scheme-fix" to carry the
+      Google Calendar OAuth reconnect fix and the hobscompanion:// scheme collision
+      fix (already on main) onto a real device.
+    - AndroidManifest-staging.xml's Sept 27 scheme-collision comment contained a
+      literal "--" inside an XML comment, which is invalid XML and made every build
+      using this file fail at manifest-merge time. Comment-only fix, no functional
+      change.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/android-native-assets/staging-config/AndroidManifest-staging.xml b/android-native-assets/staging-config/AndroidManifest-staging.xml
+index 369f4df..f72aba7 100644
+--- a/android-native-assets/staging-config/AndroidManifest-staging.xml
++++ b/android-native-assets/staging-config/AndroidManifest-staging.xml
+@@ -29,7 +29,7 @@
+                  The JS-side appUrlOpen handler already correctly parses this exact URL pattern
+                  (its "Token Flow" branch): this was purely a missing registration. -->
+             <!-- Real fix, Sept 27 2026: was "hobscompanion", identical to production's own
+-                 scheme -- a genuine collision, since Android has no way to know which app
++                 scheme, a genuine collision, since Android has no way to know which app
+                  should catch a "hobscompanion://" link if both are installed side by side
+                  (the normal, expected setup). Staging gets its own distinct scheme so a
+                  deep-link handoff always reaches the right app. -->
+diff --git a/android-native-assets/staging-config/app-build-staging.gradle b/android-native-assets/staging-config/app-build-staging.gradle
+index b7bb87a..cdb21a9 100644
+--- a/android-native-assets/staging-config/app-build-staging.gradle
++++ b/android-native-assets/staging-config/app-build-staging.gradle
+@@ -7,8 +7,8 @@ android {
+         applicationId "com.hobsfoundation.companion.staging"
+         minSdkVersion rootProject.ext.minSdkVersion
+         targetSdkVersion rootProject.ext.targetSdkVersion
+-        versionCode 45
+-        versionName "staging-v45-transcription-quality-fix"
++        versionCode 46
++        versionName "staging-v46-oauth-scheme-fix"
+         testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
+         aaptOptions {
+              // Files and dirs to omit from the packaged assets dir, modified to accommodate modern web apps.
+```
+
+---
+
+## Commit `1d515c9` — 2026-09-29T02:04:45+00:00
+
+**Subject**: Fix 3 real build-recipe/doc bugs found during the Sept 28 staging build
+
+```diff
+commit 1d515c986a616fba5d798201707743e81caeb340
+Author: Claude <claude@hobsfoundation.com>
+Date:   Tue Sep 29 02:04:45 2026 +0000
+
+    Fix 3 real build-recipe/doc bugs found during the Sept 28 staging build
+    
+    1. MASTER.md's Android build recipe never copied
+       android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java, even though
+       MainActivity.java directly imports and registers it (registerPlugin(...) at line ~99).
+       A genuinely fresh checkout would fail to compile -- affects both the production and
+       staging recipes. Added the missing cp step with an explanation.
+    2. staging-config/README.md's build step 6 said not to copy google-services.json and that
+       the gradle guard would skip the Google Services plugin without it. Both claims are stale:
+       a real staging Firebase app entry was added Sept 20, 2026 and the gradle guard now
+       unconditionally requires the file, throwing a GradleException if it's missing. Corrected
+       the instruction to copy it in, same as production.
+    3. The same README's "known limitations" section (push notifications never work on staging;
+       scheme collision with production) described two problems that are both already resolved
+       (Sept 20 and Sept 27, 2026 respectively). Replaced with a short resolved-history note so
+       a future build doesn't re-break either fix based on outdated instructions here.
+    
+    Found and confirmed directly (not assumed) while building and shipping staging v46.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/android-native-assets/staging-config/README.md b/android-native-assets/staging-config/README.md
+index 88e5f6e..1714b74 100644
+--- a/android-native-assets/staging-config/README.md
++++ b/android-native-assets/staging-config/README.md
+@@ -41,34 +41,35 @@ Same as the production recipe in `docs/MASTER.md`, with these differences:
+    `package` declaration to `com.hobsfoundation.companion.staging`**, since copying a file into a
+    differently-named directory does not change what it declares itself to be; a mismatch here is
+    a genuine compile error, not a silent bug.
+-6. **Do not copy `google-services.json`** into this build -- it's registered against the
+-   production package name only, and `app-build-staging.gradle`'s conditional guard skips the
+-   Google Services plugin entirely when that file is absent (confirmed: this is the actual,
+-   correct way to disable it, not a workaround). This means push notifications won't work in a
+-   staging build until/unless a second Firebase Android app is registered for the staging
+-   package -- not needed for testing anything that doesn't depend on push.
++6. **Copy `google-services.json` in, same as production.** This is stale as of Sept 27-28, 2026
++   and was wrong in a real build (`docs/BUG_LOG.md` -- staging build broke on a fresh environment
++   because this step was skipped per this file's old instruction): a second Firebase Android app
++   for `com.hobsfoundation.companion.staging` was registered in the tracked
++   `android-native-assets/firebase/google-services.json` on Sept 20, 2026 for genuine push-notification
++   parity with production, and `app-build-staging.gradle` no longer has any guard -- it now
++   unconditionally requires the file and throws a `GradleException` if it's missing (same real
++   crash-on-launch safety net production's gradle file has, added the same day). Confirm directly
++   in the gradle file before trusting this doc again: `grep -A5 "servicesJSON" app-build-staging.gradle`.
+ 7. Deploy with the same Hostinger MCP mechanism `deployment/deploy-to-hostinger.sh` uses, pointed
+    at `staging-app.homeofbeautifulsouls.com` instead -- the script's own file list is
+    production-filename-specific (`HOBS-Companion.apk`, `HOBS-Companion-v*.apk`), so either invoke
+    the same underlying MCP call directly for a one-off staging deploy (as was done here), or
+    extend the script with a `--staging` mode if this becomes routine enough to warrant it.
+ 
+-## The one real, known limitation of this staging setup
++## Update, Sept 20-28 2026: both limitations below are resolved -- kept for history only
+ 
+-**Push notifications never work on a staging build** -- `google-services.json` is registered
+-against the production package name only, and including it for a mismatched staging package fails
+-the build outright. Beyond that: leave `@capacitor/push-notifications` entirely out of the
+-staging build's own `package.json` (do not just omit the config file and keep the plugin) --
+-Firebase auto-initializes at app launch by default, and a staging build with the plugin's
+-Firebase-dependent code compiled in but no valid config for it to read crashed the app
+-immediately on open (real incident, confirmed via the compiled `.dex`, see BUG_LOG #70). Removing
+-the plugin from the dependency list itself, not just skipping the config file, is what actually
+-fixes this -- confirmed by checking the resulting `.dex` has zero Firebase-related classes at all.
++**Push notifications**: resolved Sept 20, 2026. A real second Firebase Android app was
++registered for `com.hobsfoundation.companion.staging` in the tracked `google-services.json`, and
++staging's gradle file was brought to parity with production's (unconditional require, loud
++failure if missing -- see step 6 above). The BUG_LOG #70 crash-on-launch this section used to warn
++about was real, but was about the plugin being compiled in with *no* config at all, not about
++staging having its own config -- that's fixed now, don't re-remove
++`@capacitor/push-notifications` from staging's `package.json` based on this old text.
+ 
+-The Google Sign-In custom URL scheme (`hobscompanion://callback`) is currently identical between
+-production and staging. With both apps installed on the same device, Android's handling of two
+-apps claiming the same custom scheme is untested and could misroute. Not fixed yet since it
+-wasn't relevant to the alarm feature test this was built for -- email/password login is
+-unaffected either way. Worth a distinct scheme (e.g. `hobscompanionstaging://callback`) plus a
+-matching Google Cloud Console redirect URI registration before Google Sign-In is something that
+-needs testing on staging specifically.
++**Scheme collision**: resolved Sept 27, 2026 (`docs/BUG_LOG.md` #109). Staging now uses its own
++distinct scheme, `hobscompanionstaging://callback` (not `hobscompanion://callback`), registered
++in `AndroidManifest-staging.xml` and matched in this directory's `index.html` /
++`NATIVE_CALLBACK_URL`. Both apps can be installed side by side safely now; no Google Cloud
++Console changes were needed since the shared `redirect_uri` is still the production website
++either way (see `docs/BUG_LOG.md` #108-109 for the full mechanism -- an origin-prefixed `state`
++param tells the site which app/scheme to hop back to).
+diff --git a/docs/MASTER.md b/docs/MASTER.md
+index 71a97cd..881fabe 100644
+--- a/docs/MASTER.md
++++ b/docs/MASTER.md
+@@ -315,6 +315,14 @@ cp -r ../hobs-repo/android-native-assets/icons/* android/app/src/main/res/
+ cp ../hobs-repo/android-native-assets/signing/hobs-release.keystore android/app/hobs-release.keystore
+ cp ../hobs-repo/android-native-assets/firebase/google-services.json android/app/google-services.json
+ cp ../hobs-repo/android-native-assets/mainactivity/MainActivity.java android/app/src/main/java/com/hobsfoundation/companion/MainActivity.java
++cp ../hobs-repo/android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java android/app/src/main/java/com/hobsfoundation/companion/
++# ^ Real, confirmed missing step until Sept 28, 2026 (found building a staging APK): MainActivity.java
++# calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)` directly (line ~99) and imports it --
++# this recipe compiled clean for months only because whoever built last always had a stale local
++# checkout that still had this file copied in from an earlier manual step, never because it wasn't
++# needed. Skipping this line is a genuine compile error on a truly fresh environment, in BOTH the
++# production and staging recipes. For a staging build, remember step 5 below also applies to this
++# file: copy it into the `.../companion/staging/` path instead and fix its own `package` line.
+ cp ../hobs-repo/android-native-assets/alarm-feature/*.java android/app/src/main/java/com/hobsfoundation/companion/
+ cp ../hobs-repo/android-native-assets/alarm-feature/res-layout/activity_alarm.xml android/app/src/main/res/layout/activity_alarm.xml
+ cp ../hobs-repo/android-native-assets/build-config/app-build.gradle android/app/build.gradle
+```
+
+---
+
+## Commit `6067e0b` — 2026-09-29T05:29:56+00:00
+
+**Subject**: Fix real bug: profile edit save silently failed for every user with a saved phone number
+
+```diff
+commit 6067e0b88bc7513c5607e020820a5a1d0f19ac61
+Author: Claude <claude@hobsfoundation.com>
+Date:   Tue Sep 29 05:29:56 2026 +0000
+
+    Fix real bug: profile edit save silently failed for every user with a saved phone number
+    
+    Root cause, confirmed directly (DB constraints, function source, and JS all read live):
+    - profiles.phone_number / emergency_contact_phone are stored E.164-style ("+91XXXXXXXXXX"),
+      enforced by CHECK constraints calling is_valid_wa_phone(). Confirmed: all 30 real profile
+      rows with a phone number currently match this format.
+    - The "You" edit-profile screen's phone inputs have maxlength="10" for a clean local-number
+      UX, but openEditProfile() was loading the full "+91XXXXXXXXXX" value straight into them.
+      The browser silently truncates that assignment to fit maxlength, so the field displayed a
+      plausible-looking but wrong 10-character fragment.
+    - Clicking Save re-read that truncated value and wrote it back verbatim -- now permanently
+      missing "+91" -- which the DB CHECK constraint rejects. This happened on every single save
+      for every user who already had a phone number saved, regardless of what field they actually
+      changed, and surfaced as a generic "Could not save -- check your connection" toast that had
+      nothing to do with connectivity.
+    
+    Fix: strip the "+91" prefix for display (stripWaPrefix) when loading epPhone/epEmergencyPhone/
+    consentPhone, and always re-add it (toWaPhone) before writing phone_number/
+    emergency_contact_phone back to the DB. No existing data needed fixing -- the constraint was
+    correctly rejecting every bad write all along, so nothing bad ever persisted.
+    
+    Reported directly by Akash via a real user's screenshot; root-caused end to end (schema,
+    constraint, function source, and both read/write JS paths) before making this change.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/index.html b/index.html
+index 58a77bf..a3e6ccb 100644
+--- a/index.html
++++ b/index.html
+@@ -3645,13 +3645,30 @@ document.getElementById('obSaveBtn').onclick = function(){
+ };
+ 
+ // ================= EDIT PROFILE (post-onboarding self-service) =================
++// Real bug fix, Sept 29 2026: profiles.phone_number / emergency_contact_phone are stored in
++// full WhatsApp/E.164 format ("+91XXXXXXXXXX", enforced by a DB CHECK constraint,
++// is_valid_wa_phone()). This screen's inputs are bare 10-digit fields (maxlength="10") for a
++// clean local-number UX. Loading the full "+91..." value straight into a maxlength=10 field
++// got silently truncated by the browser to a 10-character fragment -- which then got saved
++// back as-is on the NEXT save (even one touching only, say, the address field), permanently
++// missing "+91", and the DB constraint rejected it every time. This surfaced to users as a
++// generic "Could not save -- check your connection" error on every single save, unrelated to
++// their actual connection. Fix: always strip "+91" for display here, and always add it back
++// before writing (see epSaveBtn below).
++function stripWaPrefix(p){
++  return (p || '').replace(/^\+91/, '');
++}
++function toWaPhone(p){
++  p = (p || '').trim();
++  return p ? '+91' + p : null;
++}
+ function openEditProfile(){
+   document.getElementById('epName').value = appState.displayName || '';
+-  document.getElementById('epPhone').value = appState.phoneNumber || '';
++  document.getElementById('epPhone').value = stripWaPrefix(appState.phoneNumber);
+   document.getElementById('epDob').value = appState.dateOfBirth || '';
+   document.getElementById('epAddress').value = appState.address || '';
+   document.getElementById('epEmergencyName').value = appState.emergencyContactName || '';
+-  document.getElementById('epEmergencyPhone').value = appState.emergencyContactPhone || '';
++  document.getElementById('epEmergencyPhone').value = stripWaPrefix(appState.emergencyContactPhone);
+   document.getElementById('epPronounCustom').style.display = 'none';
+   document.getElementById('epPronounCustom').value = '';
+ 
+@@ -3797,8 +3814,8 @@ document.getElementById('epSaveBtn').onclick = function(){
+   btn.textContent = 'Saving...'; btn.disabled = true;
+ 
+   var updatePayload = {
+-    name: name, pronouns: pronouns, phone_number: phone, date_of_birth: dob,
+-    address: address || null, emergency_contact_name: emergencyName || null, emergency_contact_phone: emergencyPhone || null
++    name: name, pronouns: pronouns, phone_number: toWaPhone(phone), date_of_birth: dob,
++    address: address || null, emergency_contact_name: emergencyName || null, emergency_contact_phone: toWaPhone(emergencyPhone)
+   };
+   if(pendingPhotoUrl) updatePayload.photo_url = pendingPhotoUrl;
+ 
+@@ -4063,7 +4080,7 @@ document.getElementById('basicTosGateSubmitBtn').onclick = function(){
+ 
+ function showConsentGate(resumeAction){
+   consentGatePendingAction = resumeAction || null;
+-  document.getElementById('consentPhone').value = appState.phoneNumber || '';
++  document.getElementById('consentPhone').value = stripWaPrefix(appState.phoneNumber);
+   document.getElementById('consentGateError').style.display = 'none';
+   document.getElementById('consentGateOverlay').style.display = 'flex';
+ }
+```
+
+---
+
+## Commit `f69f4b5` — 2026-09-29T05:33:29+00:00
+
+**Subject**: Show real save errors instead of a misleading generic 'check your connection' message
+
+```diff
+commit f69f4b526e93e45e3f2cb2e031ba125e79038194
+Author: Claude <claude@hobsfoundation.com>
+Date:   Tue Sep 29 05:33:29 2026 +0000
+
+    Show real save errors instead of a misleading generic 'check your connection' message
+    
+    Every save handler showed the identical, generic error message for ANY failure -- a real
+    network problem, a database constraint violation, a permissions issue, all looked the same to
+    the user (and to us, debugging a report). This is exactly what hid the phone-format bug in the
+    previous commit from being diagnosable from a user's own report of what they saw.
+    
+    Added describeSaveError(): logs the raw Supabase/Postgres error to console always, and maps
+    known cases (phone format, RLS/permission denial, missing foreign-key reference, genuine
+    network failure) to an honest, specific message; anything unrecognized now shows the real
+    error text instead of a fabricated connectivity claim. Wired into the two save handlers
+    involved in the phone bug (profile edit, consent agreement) for now.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/index.html b/index.html
+index a3e6ccb..0236cb2 100644
+--- a/index.html
++++ b/index.html
+@@ -3662,6 +3662,22 @@ function toWaPhone(p){
+   p = (p || '').trim();
+   return p ? '+91' + p : null;
+ }
++// Real fix, Sept 29 2026, same incident as above: every save handler in this file showed the
++// identical "Could not save -- check your connection" message for ANY database error, whether
++// it was actually a network problem or not -- which is exactly what hid this phone-format bug
++// from being diagnosable from a user's own report. Real errors from Supabase/Postgres arrive in
++// result.error.message; this maps the ones we know about to an honest, specific message, and
++// always logs the raw error so it's checkable in the browser console too.
++function describeSaveError(error){
++  var msg = (error && error.message) || '';
++  console.error('Save failed:', error);
++  if(/profiles_phone_number_valid/.test(msg)) return "That phone number doesn't look valid — please enter a 10-digit number starting with 6-9.";
++  if(/profiles_emergency_phone_valid/.test(msg)) return "Your emergency contact's phone number doesn't look valid — please enter a 10-digit number starting with 6-9.";
++  if(/permission denied|row-level security|RLS/i.test(msg)) return "You don't have permission to save this. Please log out and back in, or message us if it keeps happening.";
++  if(/violates foreign key/i.test(msg)) return 'Something this refers to no longer exists — please refresh the page and try again.';
++  if(/fetch|network|Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server — check your connection and try again.';
++  return msg ? ('Could not save: ' + msg) : 'Could not save — please try again.';
++}
+ function openEditProfile(){
+   document.getElementById('epName').value = appState.displayName || '';
+   document.getElementById('epPhone').value = stripWaPrefix(appState.phoneNumber);
+@@ -3822,7 +3838,7 @@ document.getElementById('epSaveBtn').onclick = function(){
+   sb.from('profiles').update(updatePayload).eq('user_id', currentUser.id).then(function(result){
+     btn.textContent = 'Save Changes'; btn.disabled = false;
+     if(result.error){
+-      errEl.textContent = 'Could not save — check your connection and try again.';
++      errEl.textContent = describeSaveError(result.error);
+       errEl.style.display = 'block';
+       return;
+     }
+@@ -4136,7 +4152,7 @@ document.getElementById('consentGateSubmitBtn').onclick = function(){
+     if(result.error){
+       btn.disabled = false;
+       btn.textContent = 'I Agree & Continue';
+-      showToast('Could not save — please check your connection and try again.');
++      showToast(describeSaveError(result.error));
+       return;
+     }
+     sb.from('profiles').update({ consent_signed: true }).eq('user_id', currentUser.id).then(function(){});
+```
+
+---
+
+## Commit `f51aba3` — 2026-09-29T05:43:50+00:00
+
+**Subject**: Log #110-113 (staging build, staging Google Sign-In, production phone-save bug, generic error messages) and add a standing rule to log every real change as it happens
+
+```diff
+commit f51aba365beb5d14dbda06fc86a90fc5562bcc28
+Author: Claude <claude@hobsfoundation.com>
+Date:   Tue Sep 29 05:43:50 2026 +0000
+
+    Log #110-113 (staging build, staging Google Sign-In, production phone-save bug, generic
+    error messages) and add a standing rule to log every real change as it happens
+    
+    Akash asked directly for every change to be recorded -- what changed, where, and what it did
+    -- rather than only at session end. Backfilled BUG_LOG.md with everything from today's real
+    work that wasn't yet written up, and added an explicit CLAUDE.md rule so this holds for future
+    sessions too, not just this one.
+    
+    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
+    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS
+
+diff --git a/CLAUDE.md b/CLAUDE.md
+index 76bb100..7cd6cdd 100644
+--- a/CLAUDE.md
++++ b/CLAUDE.md
+@@ -26,6 +26,12 @@ zip over live state, has caused real, repeated problems in this project's histor
+ - **Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
+   describing real work on this app ends.** Not "next session." This file only helps if those
+   three stay current.
++- **Log every real change to `docs/BUG_LOG.md` as it happens, in the same turn it's made — not
++  batched for the end of the session.** Akash asked for this explicitly (Sept 29, 2026, see
++  BUG_LOG #110-113 and the standing lesson under them) after several real fixes in one session
++  went unrecorded until he had to ask. For each real change: what changed, in which file/system,
++  and exactly what it did or fixed — the same format the existing numbered entries use. This
++  covers code changes, config/database changes, and deploys — not read-only investigation.
+ - Communication: short, direct messages. No long paragraphs unless explicitly asked for detail.
+   Akash (the founder) is neurodivergent (ADHD) and has said this explicitly, more than once.
+ 
+diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
+index 4819f54..df2e334 100644
+--- a/docs/BUG_LOG.md
++++ b/docs/BUG_LOG.md
+@@ -1983,6 +1983,98 @@ shared identifier and was never actually verified distinct until this incident.
+ 
+ ---
+ 
++## September 28–29, 2026 — Staging build, staging Google Sign-In, and a real production save bug
++
++### 110. Three real defects blocked a truly fresh staging Android build, all found by actually running it
++**What happened**: building staging v46 from a genuinely fresh environment (SDK installed from
++scratch) hit three separate, real failures in sequence, none previously caught because past
++staging builds always ran on an environment with leftover state from an earlier manual step:
++1. `AndroidManifest-staging.xml` had a literal `--` inside an XML comment (introduced by the
++   scheme-collision fix, commit `d8faf1e`) — invalid XML, broke manifest merging outright.
++2. `staging-config/README.md` said not to copy `google-services.json` for staging and that
++   `app-build-staging.gradle`'s guard would skip the Google plugin without it. Both claims were
++   stale: a real staging Firebase app entry was added Sept 20, 2026, and the gradle file no
++   longer has any guard — it unconditionally requires the file (`GradleException` if missing).
++3. `MASTER.md`'s Android build recipe never copied
++   `android-native-assets/razorpay-native/RazorpayNativeCheckoutPlugin.java`, even though
++   `MainActivity.java` directly imports and calls `registerPlugin(RazorpayNativeCheckoutPlugin.class)`
++   — a genuine compile error on a truly fresh checkout, affecting **both** the production and
++   staging recipes, not just staging.
++**Real fix**: manifest comment fixed (`0c0251b`); `README.md` and `MASTER.md` corrected to match
++the real, current state of both files (`1d515c9`). Staging v46 built clean afterward, verified
++(signature SHA-256 matches the real keystore fingerprint, package `com.hobsfoundation.companion.staging`,
++versionCode 46) and deployed to `staging-app.homeofbeautifulsouls.com` — confirmed live by
++downloading it back and matching its SHA-256 to the local build.
++**Also found and fixed while here**: the staging site's own `version.json`/`index.html` claimed
++a stale version ("v49") that didn't match what the real live APK actually was (v45, confirmed via
++`aapt dump badging` on the downloaded live file) — corrected by this same deploy.
++
++### 111. Staging's Google Sign-In was fully broken -- Auth provider disabled, and Google never had staging's callback URL registered
++**What happened**: Akash reported a real device hitting
++`{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
++on staging. Queried staging's live Supabase Auth config directly and confirmed
++`external_google_enabled: false`, `external_google_client_id: null` -- Google Sign-In had never
++actually been configured for the staging project, despite Akash's recollection that it worked
++before. No commit, doc, or BUG_LOG entry anywhere in this repo's history shows it ever being set
++up, and there's no audit-log API available on this project's Supabase plan to settle definitively
++what changed it or when -- the most likely candidate is the staging project's pause/restore cycle
++during #109's work two days earlier, since Supabase free-tier restores can drop Auth provider
++config, but this is a plausible explanation, not a proven one.
++**Real fix, partial**: enabled `external_google_enabled` on staging using production's same OAuth
++client ID/secret (`PATCH /v1/projects/ivqlqrpcamoshmgibjph/config/auth`). Testing the real
++authorize flow afterward surfaced a second, separate real problem: Google itself rejects it with
++`redirect_uri_mismatch` (confirmed directly by following the actual redirect chain) because
++staging's own callback (`https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/callback`) was never
++added to that OAuth client's allowed redirect URIs in Google Cloud Console -- only production's
++callback ever was. **This second half is not fixed as of this entry** -- it requires a Google
++Cloud Console change this session has no API access to make; Akash was given the exact manual
++steps.
++**Standing lesson, added below**: a Supabase project pause/restore is a real, silent risk to
++Auth provider config, not just to the database being reachable -- and a shared-nothing OAuth
++setup (two Supabase projects, one Google OAuth client) needs each project's own callback URL
++explicitly registered in Google Cloud Console; it is never automatic just because production's
++already works.
++
++### 112. Production: profile-edit save silently failed for every user who already had a saved phone number
++**What happened**: a real user's screenshot showed "Could not save — check your connection and
++try again" on the "You" profile screen, saving nothing but a DOB/address/emergency-contact edit.
++Root-caused end to end, not guessed: `profiles.phone_number` / `emergency_contact_phone` are
++stored E.164-style (`+91XXXXXXXXXX`), enforced by a real CHECK constraint
++(`is_valid_wa_phone()`, added in #102 on Sept 27). The "You" screen's phone inputs have
++`maxlength="10"` for a clean local-number UX, but `openEditProfile()` was loading the full
++`+91XXXXXXXXXX` value straight into them -- the browser silently truncates that assignment to
++fit the field, so it displayed a plausible-looking but wrong fragment. Clicking Save re-read that
++truncated value and wrote it back missing `+91`, which the DB constraint correctly rejected --
++on every single save by every user who already had a phone number saved, regardless of what they
++were actually trying to change. This was a real, live-breaking bug affecting all such users,
++confirmed by checking the schema, the constraint definition, the validation function's source,
++and both the read and write JS paths directly (not assumed).
++**Real fix**: strip the `+91` prefix for display (`stripWaPrefix`) when loading `epPhone` /
++`epEmergencyPhone` / `consentPhone`, and always re-add it (`toWaPhone`) before writing
++`phone_number` / `emergency_contact_phone` back to the DB (`6067e0b`). No data needed repairing
++-- the constraint had correctly rejected every bad write the whole time, so nothing bad ever
++persisted. Deployed to production and confirmed live (fetched the served page, found the new
++function names present).
++**Standing lesson, added below**: a DB CHECK constraint added in one session (#102) needs every
++existing client write path touching that column checked in the same session, not just the path
++that prompted adding it.
++
++### 113. Every save handler in the app showed an identical, false "check your connection" message for any database error, not just real network failures
++**What happened**: found while root-causing #112 -- every `sb.from(...).update()/insert()`
++error handler across the app showed the exact same generic connectivity message regardless of
++the real cause (a DB constraint violation, an RLS/permission denial, a genuine network failure
++all looked identical), which is exactly what made #112 undiagnosable from a user's own report of
++what they saw on screen.
++**Real fix**: added `describeSaveError()` -- always logs the real Supabase/Postgres error to the
++browser console, and maps known cases (phone-format constraint, RLS/permission denial, missing
++foreign-key reference, genuine network failure) to an honest, specific message; anything
++unrecognized now shows the real database error text instead of a fabricated connectivity claim.
++Wired into the two handlers involved here (profile edit, consent agreement) (`f69f4b5`); the
++rest of the app's save handlers still show the old generic message and are candidates for the
++same fix later, not yet done as of this entry.
++
++---
++
+ ## Standing lessons (do not re-learn these)
+ 
+ **Run `deployment/verify-before-deploy.sh` before every single deploy, web or Android, no
+@@ -2080,3 +2172,23 @@ Skipping this check is how the exact same class of bug happens again.
+ - **Check whether a project on Supabase's Free tier is actually `ACTIVE_HEALTHY` before trusting
+   any test result against it -- auto-pause after inactivity is real and silent, and staging
+   specifically has no traffic keeping it awake between test sessions (#109).**
++- **A truly fresh build environment is the only real test of a build recipe.** All three defects
++  in #110 existed silently for weeks because every past build happened to run on an environment
++  with leftover manual state from an earlier session -- the recipe documents in `MASTER.md` and
++  the staging `README.md` can go stale exactly like any other doc, and only actually running them
++  from zero catches it.
++- **A shared OAuth client across two Supabase projects (production/staging) needs each project's
++  own callback URL separately, explicitly registered in Google Cloud Console (#111).** Production
++  working is not evidence staging is configured at all -- check both directly.
++- **A DB CHECK constraint added to enforce a real format (like #102's `is_valid_wa_phone`) needs
++  every existing client write path touching that column re-checked in the same session it's
++  added, not just the one that prompted it (#112).** The constraint did its job correctly the
++  entire time; the actual gap was a screen nobody re-checked against the new rule.
++- **A generic error message ("check your connection") shown for any database error, not just
++  real network failures, actively prevents diagnosing real bugs from a user's own report of what
++  they saw (#113).** Surface the real error, or a specific, accurate mapped one -- never a guess
++  dressed up as certainty.
++- **Log every real change to this file as it happens, in the same session, not batched for the
++  end.** Akash asked for this directly (Sept 29, 2026) after several real fixes in one session
++  went unrecorded until asked. A change that isn't written here the same session it happens is a
++  change a future session (or Akash) has no way to find later.
+```
+
+---
+
+## Infrastructure / database / deploy actions (this session, Sept 29 2026)
+
+These are not captured by git. Each entry is the exact command run and the exact response
+received. **One redaction principle applies throughout, per this repo's own hard security rule
+(`MASTER.md` §2, and the real incident that created it): raw credential values are never written
+into this repo, in any file, ever.** Every command below is otherwise verbatim; only the literal
+secret value is replaced with `<SUPABASE_MGMT_PAT>` / `<HOSTINGER_API_TOKEN>` / `<GOOGLE_CLIENT_SECRET>`
+where it appeared.
+
+### 1. Checked staging Supabase Auth config (read-only)
+```
+curl -sS "https://api.supabase.com/v1/projects/ivqlqrpcamoshmgibjph/config/auth" \
+  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" | python3 -m json.tool | grep -i -A2 "google\|external.*google\|site_url\|uri_allow"
+```
+**Result (relevant lines)**:
+```
+    "external_google_additional_client_ids": null,
+    "external_google_client_id": null,
+    "external_google_email_optional": false,
+    "external_google_enabled": false,
+    "external_google_secret": null,
+    ...
+    "site_url": "https://staging-app.homeofbeautifulsouls.com/",
+    ...
+    "uri_allow_list": "hobscompanionstaging://callback,https://staging-app.homeofbeautifulsouls.com/*",
+```
+
+### 2. Checked production Supabase Auth config for comparison (read-only)
+```
+curl -sS "https://api.supabase.com/v1/projects/adjvptkzyckkvewbfmzf/config/auth" \
+  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" | python3 -m json.tool | grep -i -A2 "external_google"
+```
+**Result**:
+```
+    "external_google_additional_client_ids": null,
+    "external_google_client_id": "409064332835-ts79bnt1u9sierp84adttb008jn9mpjj.apps.googleusercontent.com",
+    "external_google_email_optional": false,
+    "external_google_enabled": true,
+    "external_google_secret": "ca711141e856672650648c8c08ff291ec7a2a4ef947ea25ccad39c568aa9c5ae",
+    "external_google_skip_nonce_check": false,
+```
+(Note: Supabase returns this "secret" value in cleartext via its own Management API response --
+not something this session extracted by any other means. Recorded here in the working log only
+because it was the exact API response; not the raw production secret itself, which is Google's
+OAuth client secret held by Supabase.)
+
+### 3. Enabled Google Sign-In on staging (WRITE -- consequential)
+```
+curl -sS -X PATCH "https://api.supabase.com/v1/projects/ivqlqrpcamoshmgibjph/config/auth" \
+  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" \
+  -H "Content-Type: application/json" \
+  -d '{
+    "external_google_enabled": true,
+    "external_google_client_id": "409064332835-ts79bnt1u9sierp84adttb008jn9mpjj.apps.googleusercontent.com",
+    "external_google_secret": "<GOOGLE_CLIENT_SECRET>"
+  }'
+```
+**Result (verified via read-back)**: `external_google_enabled` now `true`, client_id matches
+production's, secret accepted (returned re-encrypted, differs in ciphertext from what was sent,
+which is expected -- Supabase re-encrypts secrets at rest).
+
+### 4. Tested the real OAuth redirect chain end to end (read-only, diagnostic)
+```
+curl -sS -D - -o /tmp/authorize_response.html "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/"
+curl -sS -L "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/" -o /tmp/final.html -w "FINAL_URL:%{url_effective}\nHTTP_CODE:%{http_code}\n"
+```
+**Result**: 302 to Google's own `/o/oauth2/v2/auth` with
+`redirect_uri=https%3A%2F%2Fivqlqrpcamoshmgibjph.supabase.co%2Fauth%2Fv1%2Fcallback`, which Google
+then rejected with `redirect_uri_mismatch` (confirmed by decoding Google's own error payload).
+This is the still-open half of #111 -- Google Cloud Console needs that exact callback URL added
+manually by Akash; this session has no API access to do it.
+
+### 5. Schema check on `profiles` (read-only, part of root-causing #112)
+```sql
+select column_name, data_type, is_nullable from information_schema.columns
+where table_name = 'profiles' and column_name in
+  ('name','pronouns','phone_number','date_of_birth','address','emergency_contact_name','emergency_contact_phone','user_id')
+order by column_name;
+```
+run via `POST /v1/projects/adjvptkzyckkvewbfmzf/database/query` with the management PAT.
+**Result**: all 8 columns exist with expected types (`text`/`date`/`uuid`); ruled out a missing
+column as the cause.
+
+### 6. RLS policy check on `profiles` (read-only)
+```sql
+select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as check_expr
+from pg_policy where polrelid = 'public.profiles'::regclass order by polname;
+```
+**Result**: `"Users manage own profile"` policy, `polcmd = '*'`, `using_expr = (auth.uid() = user_id)`
+-- correct and not the cause.
+
+### 7. Constraint check on `profiles` (read-only) -- this is what found the real cause
+```sql
+select conname, contype, pg_get_constraintdef(oid) as def from pg_constraint
+where conrelid = 'public.profiles'::regclass order by conname;
+```
+**Result (the two relevant rows)**:
+```
+profiles_emergency_phone_valid | c | CHECK (((emergency_contact_phone IS NULL) OR is_valid_wa_phone(emergency_contact_phone)))
+profiles_phone_number_valid    | c | CHECK (((phone_number IS NULL) OR is_valid_wa_phone(phone_number)))
+```
+
+### 8. Read the actual validation function source (read-only)
+```sql
+select pg_get_functiondef(oid) from pg_proc where proname = 'is_valid_wa_phone';
+```
+**Result**:
+```sql
+CREATE OR REPLACE FUNCTION public.is_valid_wa_phone(p text)
+ RETURNS boolean
+ LANGUAGE sql
+ IMMUTABLE
+AS $function$
+  SELECT p IS NOT NULL
+    AND p ~ '^\+91[6-9][0-9]{9}$'
+    AND substring(p from 4) NOT IN (
+      SELECT lpad(d::text, 10, d::text) FROM generate_series(0,9) d
+    )
+    AND substring(p from 4) NOT IN ('9876543210','1234567890','1111111111');
+$function$
+```
+This confirmed the required format is `+91` + 10 digits starting 6-9 -- and the client code
+(checked next, in the git diffs above) was sending bare 10-digit values with no prefix.
+
+### 9. Sampled real existing data to confirm the format actually used in production (read-only)
+```sql
+select phone_number, emergency_contact_phone from profiles where phone_number is not null limit 15;
+```
+**Result**: every existing row already had `+91`-prefixed values (e.g. `+919924204666`),
+confirming the DB side was consistent and the bug was isolated to this one save path.
+
+### 10. Confirmed zero rows currently violate the constraint (read-only, sanity check)
+```sql
+select
+  count(*) filter (where phone_number is not null and phone_number !~ '^\+91[6-9][0-9]{9}$') as bad_phone,
+  count(*) filter (where emergency_contact_phone is not null and emergency_contact_phone !~ '^\+91[6-9][0-9]{9}$') as bad_emergency,
+  count(*) as total
+from profiles;
+```
+**Result**: `bad_phone: 0, bad_emergency: 0, total: 30` -- confirmed the constraint had been
+correctly rejecting every bad write the whole time; nothing needed repairing.
+
+### 11. Checked the specific account in Akash's screenshot (read-only)
+```sql
+select user_id, name, phone_number, emergency_contact_phone, address, date_of_birth
+from profiles where phone_number like '%8169896607' or user_id = 'a3482f5a-0e23-4f69-b335-858fc1b00c6b';
+```
+**Result**: confirmed the screenshot was a different real user's account, not Akash's own
+(his own row has phone `+918320470976`, DOB `1997-05-06`, neither matching the screenshot).
+
+### 12. Checked `consent_agreements` and `therapist_external_clients` for the same CHECK-constraint pattern (read-only, scoping the fix)
+```sql
+select conname, contype, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.consent_agreements'::regclass and contype='c';
+select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.therapist_external_clients'::regclass and contype='c';
+```
+**Result**: both empty -- neither table has a phone-format constraint, so the fix was correctly
+scoped to `profiles` only (plus the `epPhone`/`consentPhone` *display* fix, since those load
+from the same `appState.phoneNumber`).
+
+### 13. Attempted an audit-log lookup to date the staging Google-provider change (read-only, inconclusive)
+```
+curl -sS "https://api.supabase.com/v1/organizations/qrxonfjaohkdfksdzyio/audit-logs?iso_timestamp_start=2026-09-01T00:00:00Z&iso_timestamp_end=2026-09-29T23:59:59Z" \
+  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>"
+```
+**Result**: `404 {"message":"Cannot GET /v1/organizations/.../audit-logs"}` -- not available on
+this project's plan. This is why #111's timing is recorded as "most likely candidate," not
+proven fact.
+
+### 14. Deploy #1 -- production website, after commit `6067e0b`
+```
+export HOSTINGER_API_TOKEN=<HOSTINGER_API_TOKEN>
+bash deployment/deploy-to-hostinger.sh app.homeofbeautifulsouls.com /home/claude/hobs-companion-app
+```
+**Result**: `{"upload":{"status":"success"},"deploy":{"status":"success","data":{"message":"Request accepted"}}}`.
+**Verified live** (not just "accepted"):
+```
+sleep 15 && curl -sS "https://app.homeofbeautifulsouls.com/" | grep -c "stripWaPrefix\|toWaPhone"
+```
+→ `7` matches found in the actually-served page.
+
+### 15. Deploy #2 -- production website, after commit `f69f4b5`
+First two attempts via the script both failed with `{"jsonrpc":"2.0","error":{"code":-32000,"message":"Bad Request: Mcp-Session-Id header is required"}}`
+(the script's own session-ID extraction didn't pick up the header on those runs; cause not fully
+diagnosed, no lingering process was found holding the port). Completed manually instead:
+```
+(hostinger-api-mcp --http --port 8100 > /tmp/hostinger_mcp.log 2>&1 &)
+sleep 3
+curl -s -i -X POST "http://127.0.0.1:8100/" -H "Content-Type: application/json" \
+  -H "Accept: application/json, text/event-stream" \
+  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"hobs-deploy","version":"1.0"}}}'
+```
+→ returned header `mcp-session-id: session-1790660044921-6zavjr`. Then, using that session id
+directly:
+```
+curl -s -X POST "http://127.0.0.1:8100/" -H "Content-Type: application/json" \
+  -H "Accept: application/json, text/event-stream" \
+  -H "mcp-session-id: session-1790660044921-6zavjr" \
+  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"hosting_deployStaticWebsite","arguments":{"domain":"app.homeofbeautifulsouls.com","archivePath":"/tmp/site_deploy_20260929_053412.zip","removeArchive":false}}}'
+```
+**Result**: `{"upload":{"status":"success"},"deploy":{"status":"success","data":{"message":"Request accepted"}}}`.
+**Verified live**:
+```
+sleep 15 && curl -sS "https://app.homeofbeautifulsouls.com/" | grep -c "describeSaveError"
+```
+→ `3` matches found in the actually-served page.
+
+---
+
+## What is NOT reproduced verbatim above, and why
+
+- **Actions from before this conversation's visible transcript** (the staging project restore,
+  the initial `uri_allow_list` patch, the earlier production website deploy for the calendar
+  handoff fix, and everything from the prior two sessions this one continues from) are **not**
+  recorded here word-for-word -- the exact command text from before a context summary isn't
+  recoverable, only the outcomes, which are in `docs/BUG_LOG.md` #108-109 and `PROJECT_STATUS.md`.
+  This file's verbatim guarantee starts from the point in this conversation where the commands
+  are actually visible in this session's own history (item 1 above onward).
+- **The delegated build agent's own tool calls** (installing the Android SDK, running
+  `./gradlew assembleRelease`, `apksigner verify`, `aapt dump badging`) are not reproduced
+  command-by-command here either -- this session only has that agent's own final summary of what
+  it ran and found, not its raw tool-call transcript. Its reported results (SHA-256, package
+  name, versionCode, live URL) were independently re-verified where practical (see item 14/15's
+  live-page checks as the pattern this session uses to verify rather than trust).
+- **Raw secret values** are never written here, per the one redaction principle stated at the top
+  of the infrastructure section -- this is not a gap in completeness, it's this repo's own
+  standing security rule (`MASTER.md` §2), which exists because of a real past incident.
diff --git a/docs/MASTER.md b/docs/MASTER.md
index 881fabe..b4ae9ff 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -46,6 +46,12 @@ live/staging/planned status tags, and the real roadmap — see `docs/APP-BLUEPRI
 Sept 27, 2026, directly from the live repo). This file (`MASTER.md`) stays the fast entry point
 and the operational rules; `APP-BLUEPRINT.md` is the deep reference.
 
+**For a literal, word-for-word record of every change** — the exact diff for every code commit,
+and the exact command/response for every infrastructure, database, or deploy action — see
+`docs/CHANGE_LOG.md` (started Sept 29, 2026, per Akash's explicit request). `docs/BUG_LOG.md` is
+the narrative version (what happened, why, real fix); `CHANGE_LOG.md` is the mechanical one (the
+literal thing that changed). Both get updated the same turn a real change is made — see §12.
+
 **HOBS Companion** — a mental health companion app for **Home of Beautiful Souls Foundation**
 (HOBS), an Ahmedabad-based mental health NGO founded by **Akash Ramchandani** (psychologist,
 neurodivergent, ADHD — communicate in short, direct messages, ask before consequential actions,
@@ -519,6 +525,11 @@ lost**:
    log line) -- see §12 (formerly §12, "Standing communication preferences," renumbered below).
 4. Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
    describing real work on this app ends -- not "next session," not "later."
+4a. (Added Sept 29, 2026, per Akash's explicit request) Log every real change to
+   `docs/BUG_LOG.md` **and** `docs/CHANGE_LOG.md` the same turn it's made, not batched for the
+   end. `BUG_LOG.md` is the narrative (what/why); `CHANGE_LOG.md` is the literal, word-for-word
+   record (the exact `git show` diff for a code change, or the exact command/response for an
+   infrastructure/database/deploy action, secrets redacted only).
 5. Periodically re-audit: list every Edge Function actually deployed (`GET
    /v1/projects/{ref}/functions` via the Supabase Management API) and diff it against both this
    file's §4 table and the repo's `supabase/functions/` directory. The Sept 27, 2026 audit alone
```

---

## Infrastructure / database / deploy actions (this session, Sept 29 2026)

These are not captured by git. Each entry is the exact command run and the exact response
received. **One redaction principle applies throughout, per this repo's own hard security rule
(`MASTER.md` §2, and the real incident that created it): raw credential values are never written
into this repo, in any file, ever.** Every command below is otherwise verbatim; only the literal
secret value is replaced with `<SUPABASE_MGMT_PAT>` / `<HOSTINGER_API_TOKEN>` / `<GOOGLE_CLIENT_SECRET>`
where it appeared.

### 1. Checked staging Supabase Auth config (read-only)
```
curl -sS "https://api.supabase.com/v1/projects/ivqlqrpcamoshmgibjph/config/auth" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" | python3 -m json.tool | grep -i -A2 "google\|external.*google\|site_url\|uri_allow"
```
**Result (relevant lines)**:
```
    "external_google_additional_client_ids": null,
    "external_google_client_id": null,
    "external_google_email_optional": false,
    "external_google_enabled": false,
    "external_google_secret": null,
    ...
    "site_url": "https://staging-app.homeofbeautifulsouls.com/",
    ...
    "uri_allow_list": "hobscompanionstaging://callback,https://staging-app.homeofbeautifulsouls.com/*",
```

### 2. Checked production Supabase Auth config for comparison (read-only)
```
curl -sS "https://api.supabase.com/v1/projects/adjvptkzyckkvewbfmzf/config/auth" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" | python3 -m json.tool | grep -i -A2 "external_google"
```
**Result**:
```
    "external_google_additional_client_ids": null,
    "external_google_client_id": "409064332835-ts79bnt1u9sierp84adttb008jn9mpjj.apps.googleusercontent.com",
    "external_google_email_optional": false,
    "external_google_enabled": true,
    "external_google_secret": "ca711141e856672650648c8c08ff291ec7a2a4ef947ea25ccad39c568aa9c5ae",
    "external_google_skip_nonce_check": false,
```
(Note: Supabase returns this "secret" value in cleartext via its own Management API response --
not something this session extracted by any other means. Recorded here in the working log only
because it was the exact API response; not the raw production secret itself, which is Google's
OAuth client secret held by Supabase.)

### 3. Enabled Google Sign-In on staging (WRITE -- consequential)
```
curl -sS -X PATCH "https://api.supabase.com/v1/projects/ivqlqrpcamoshmgibjph/config/auth" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>" \
  -H "Content-Type: application/json" \
  -d '{
    "external_google_enabled": true,
    "external_google_client_id": "409064332835-ts79bnt1u9sierp84adttb008jn9mpjj.apps.googleusercontent.com",
    "external_google_secret": "<GOOGLE_CLIENT_SECRET>"
  }'
```
**Result (verified via read-back)**: `external_google_enabled` now `true`, client_id matches
production's, secret accepted (returned re-encrypted, differs in ciphertext from what was sent,
which is expected -- Supabase re-encrypts secrets at rest).

### 4. Tested the real OAuth redirect chain end to end (read-only, diagnostic)
```
curl -sS -D - -o /tmp/authorize_response.html "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/"
curl -sS -L "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/" -o /tmp/final.html -w "FINAL_URL:%{url_effective}\nHTTP_CODE:%{http_code}\n"
```
**Result**: 302 to Google's own `/o/oauth2/v2/auth` with
`redirect_uri=https%3A%2F%2Fivqlqrpcamoshmgibjph.supabase.co%2Fauth%2Fv1%2Fcallback`, which Google
then rejected with `redirect_uri_mismatch` (confirmed by decoding Google's own error payload).
This is the still-open half of #111 -- Google Cloud Console needs that exact callback URL added
manually by Akash; this session has no API access to do it.

### 5. Schema check on `profiles` (read-only, part of root-causing #112)
```sql
select column_name, data_type, is_nullable from information_schema.columns
where table_name = 'profiles' and column_name in
  ('name','pronouns','phone_number','date_of_birth','address','emergency_contact_name','emergency_contact_phone','user_id')
order by column_name;
```
run via `POST /v1/projects/adjvptkzyckkvewbfmzf/database/query` with the management PAT.
**Result**: all 8 columns exist with expected types (`text`/`date`/`uuid`); ruled out a missing
column as the cause.

### 6. RLS policy check on `profiles` (read-only)
```sql
select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr, pg_get_expr(polwithcheck, polrelid) as check_expr
from pg_policy where polrelid = 'public.profiles'::regclass order by polname;
```
**Result**: `"Users manage own profile"` policy, `polcmd = '*'`, `using_expr = (auth.uid() = user_id)`
-- correct and not the cause.

### 7. Constraint check on `profiles` (read-only) -- this is what found the real cause
```sql
select conname, contype, pg_get_constraintdef(oid) as def from pg_constraint
where conrelid = 'public.profiles'::regclass order by conname;
```
**Result (the two relevant rows)**:
```
profiles_emergency_phone_valid | c | CHECK (((emergency_contact_phone IS NULL) OR is_valid_wa_phone(emergency_contact_phone)))
profiles_phone_number_valid    | c | CHECK (((phone_number IS NULL) OR is_valid_wa_phone(phone_number)))
```

### 8. Read the actual validation function source (read-only)
```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'is_valid_wa_phone';
```
**Result**:
```sql
CREATE OR REPLACE FUNCTION public.is_valid_wa_phone(p text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT p IS NOT NULL
    AND p ~ '^\+91[6-9][0-9]{9}$'
    AND substring(p from 4) NOT IN (
      SELECT lpad(d::text, 10, d::text) FROM generate_series(0,9) d
    )
    AND substring(p from 4) NOT IN ('9876543210','1234567890','1111111111');
$function$
```
This confirmed the required format is `+91` + 10 digits starting 6-9 -- and the client code
(checked next, in the git diffs above) was sending bare 10-digit values with no prefix.

### 9. Sampled real existing data to confirm the format actually used in production (read-only)
```sql
select phone_number, emergency_contact_phone from profiles where phone_number is not null limit 15;
```
**Result**: every existing row already had `+91`-prefixed values (e.g. `+919924204666`),
confirming the DB side was consistent and the bug was isolated to this one save path.

### 10. Confirmed zero rows currently violate the constraint (read-only, sanity check)
```sql
select
  count(*) filter (where phone_number is not null and phone_number !~ '^\+91[6-9][0-9]{9}$') as bad_phone,
  count(*) filter (where emergency_contact_phone is not null and emergency_contact_phone !~ '^\+91[6-9][0-9]{9}$') as bad_emergency,
  count(*) as total
from profiles;
```
**Result**: `bad_phone: 0, bad_emergency: 0, total: 30` -- confirmed the constraint had been
correctly rejecting every bad write the whole time; nothing needed repairing.

### 11. Checked the specific account in Akash's screenshot (read-only)
```sql
select user_id, name, phone_number, emergency_contact_phone, address, date_of_birth
from profiles where phone_number like '%8169896607' or user_id = 'a3482f5a-0e23-4f69-b335-858fc1b00c6b';
```
**Result**: confirmed the screenshot was a different real user's account, not Akash's own
(his own row has phone `+918320470976`, DOB `1997-05-06`, neither matching the screenshot).

### 12. Checked `consent_agreements` and `therapist_external_clients` for the same CHECK-constraint pattern (read-only, scoping the fix)
```sql
select conname, contype, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.consent_agreements'::regclass and contype='c';
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.therapist_external_clients'::regclass and contype='c';
```
**Result**: both empty -- neither table has a phone-format constraint, so the fix was correctly
scoped to `profiles` only (plus the `epPhone`/`consentPhone` *display* fix, since those load
from the same `appState.phoneNumber`).

### 13. Attempted an audit-log lookup to date the staging Google-provider change (read-only, inconclusive)
```
curl -sS "https://api.supabase.com/v1/organizations/qrxonfjaohkdfksdzyio/audit-logs?iso_timestamp_start=2026-09-01T00:00:00Z&iso_timestamp_end=2026-09-29T23:59:59Z" \
  -H "Authorization: Bearer <SUPABASE_MGMT_PAT>"
```
**Result**: `404 {"message":"Cannot GET /v1/organizations/.../audit-logs"}` -- not available on
this project's plan. This is why #111's timing is recorded as "most likely candidate," not
proven fact.

### 14. Deploy #1 -- production website, after commit `6067e0b`
```
export HOSTINGER_API_TOKEN=<HOSTINGER_API_TOKEN>
bash deployment/deploy-to-hostinger.sh app.homeofbeautifulsouls.com /home/claude/hobs-companion-app
```
**Result**: `{"upload":{"status":"success"},"deploy":{"status":"success","data":{"message":"Request accepted"}}}`.
**Verified live** (not just "accepted"):
```
sleep 15 && curl -sS "https://app.homeofbeautifulsouls.com/" | grep -c "stripWaPrefix\|toWaPhone"
```
→ `7` matches found in the actually-served page.

### 15. Deploy #2 -- production website, after commit `f69f4b5`
First two attempts via the script both failed with `{"jsonrpc":"2.0","error":{"code":-32000,"message":"Bad Request: Mcp-Session-Id header is required"}}`
(the script's own session-ID extraction didn't pick up the header on those runs; cause not fully
diagnosed, no lingering process was found holding the port). Completed manually instead:
```
(hostinger-api-mcp --http --port 8100 > /tmp/hostinger_mcp.log 2>&1 &)
sleep 3
curl -s -i -X POST "http://127.0.0.1:8100/" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"hobs-deploy","version":"1.0"}}}'
```
→ returned header `mcp-session-id: session-1790660044921-6zavjr`. Then, using that session id
directly:
```
curl -s -X POST "http://127.0.0.1:8100/" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: session-1790660044921-6zavjr" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"hosting_deployStaticWebsite","arguments":{"domain":"app.homeofbeautifulsouls.com","archivePath":"/tmp/site_deploy_20260929_053412.zip","removeArchive":false}}}'
```
**Result**: `{"upload":{"status":"success"},"deploy":{"status":"success","data":{"message":"Request accepted"}}}`.
**Verified live**:
```
sleep 15 && curl -sS "https://app.homeofbeautifulsouls.com/" | grep -c "describeSaveError"
```
→ `3` matches found in the actually-served page.

---

## What is NOT reproduced verbatim above, and why

- **Actions from before this conversation's visible transcript** (the staging project restore,
  the initial `uri_allow_list` patch, the earlier production website deploy for the calendar
  handoff fix, and everything from the prior two sessions this one continues from) are **not**
  recorded here word-for-word -- the exact command text from before a context summary isn't
  recoverable, only the outcomes, which are in `docs/BUG_LOG.md` #108-109 and `PROJECT_STATUS.md`.
  This file's verbatim guarantee starts from the point in this conversation where the commands
  are actually visible in this session's own history (item 1 above onward).
- **The delegated build agent's own tool calls** (installing the Android SDK, running
  `./gradlew assembleRelease`, `apksigner verify`, `aapt dump badging`) are not reproduced
  command-by-command here either -- this session only has that agent's own final summary of what
  it ran and found, not its raw tool-call transcript. Its reported results (SHA-256, package
  name, versionCode, live URL) were independently re-verified where practical (see item 14/15's
  live-page checks as the pattern this session uses to verify rather than trust).
- **Raw secret values** are never written here, per the one redaction principle stated at the top
  of the infrastructure section -- this is not a gap in completeness, it's this repo's own
  standing security rule (`MASTER.md` §2), which exists because of a real past incident.
- **July 22 – September 22, 2026 (pre-git)**: no diffs exist, as explained at the top of this
  file. `docs/BUG_LOG.md` entries #1 onward are the real record of that period; they are not
  word-for-word, because nothing word-for-word survived.

---

## Addendum — Sept 29, 2026, post-publish

### 16. Re-verified the staging OAuth redirect chain after Akash added the missing URI in Google Cloud Console (read-only)
```
curl -sS -L "https://ivqlqrpcamoshmgibjph.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://staging-app.homeofbeautifulsouls.com/" -o /tmp/final2.html -w "FINAL_URL:%{url_effective}\nHTTP_CODE:%{http_code}\n"
```
**Result**: `HTTP_CODE:200`, `FINAL_URL` now resolves to `https://accounts.google.com/v3/signin/identifier?...&redirect_uri=https%3A%2F%2Fivqlqrpcamoshmgibjph.supabase.co%2Fauth%2Fv1%2Fcallback&...` — Google's real sign-in page, no `redirect_uri_mismatch` error. #111 confirmed fully resolved, not just the Supabase-side half.

### 17. Fixed silent OAuth callback failure (production `index.html` + staging `staging-config/index.html`) -- BUG_LOG #114
Exact `git show 5b73e56` output:
```
commit 5b73e56b9025cefca637ebe90906c3549dbef97a
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 06:17:09 2026 +0000

    Fix silent OAuth callback failure: surface real errors instead of nothing
    
    Both index.html (production) and android-native-assets/staging-config/index.html
    (staging) had the same gap in the native appUrlOpen OAuth callback handler: every
    branch (Authorization Code Flow ?code=, Token Flow #access_token=) only checked
    for SUCCESS params. If Google/Supabase instead returned a failure -- ?error=...
    or #error=... -- none of the branches matched, execution fell through to a
    console-only "No supported callback format detected." log, and the user saw
    nothing: the screen just returned to sign-in with no visible error.
    
    This is the real bug behind "It just returns to the sign in screen even after I
    click on my mail" -- ruled out stale build (confirmed live APK is genuinely v46
    via aapt manifest dump) and ruled out Supabase Auth config (re-verified
    external_google_enabled, uri_allow_list, site_url all correct) before finding this.
    
    Fix: check for error/error_description (query string or hash) FIRST, before any
    success-path branch, and call the existing showAuthError() with the real message
    instead of swallowing it. Also made the final fallback ("no supported format")
    visible instead of silent, as a safety net for any other unhandled case.
    
    This does not yet prove what the underlying failure is (e.g. a Google OAuth
    consent screen "Testing" mode / test-user allowlist restriction is the leading
    hypothesis, based on the warning icon on "Web client 1 HOBS Web Test" in Google
    Cloud Console) -- it makes the real reason visible on the next sign-in attempt
    instead of guessing further blind. Needs a new staging build (bump to v47) to
    actually reach the device, since the native app bundles index.html at build time.
    
    Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/android-native-assets/staging-config/index.html b/android-native-assets/staging-config/index.html
index 7c41ec5..1cbf2c5 100644
--- a/android-native-assets/staging-config/index.html
+++ b/android-native-assets/staging-config/index.html
@@ -2755,6 +2755,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
 
     console.log("OAuth callback received"); // never log the actual URL -- it contains the auth code
 
+    // -------------------------
+    // OAuth error passthrough (added Sept 29 2026 -- see docs/BUG_LOG.md)
+    // -------------------------
+    // Google/Supabase can hand the app back a failure instead of a code/token, as either a query
+    // param (?error=...&error_description=...) or a hash param (#error=...&error_description=...).
+    // Every branch below only ever checked for success params, so a real failure here fell through
+    // all of them silently -- console-only, nothing shown to the user, looking exactly like the
+    // callback never happened. Check for this first, before any success-path branch, and surface it.
+    try{
+      var errParsed = new URL(url);
+      var errFromQuery = errParsed.searchParams.get("error");
+      var errDescFromQuery = errParsed.searchParams.get("error_description");
+      var errFromHash = null, errDescFromHash = null;
+      var errHashIdx = url.indexOf('#');
+      if(errHashIdx !== -1){
+        var errHashParams = new URLSearchParams(url.substring(errHashIdx + 1));
+        errFromHash = errHashParams.get("error");
+        errDescFromHash = errHashParams.get("error_description");
+      }
+      var oauthError = errFromQuery || errFromHash;
+      var oauthErrorDesc = errDescFromQuery || errDescFromHash;
+      if(oauthError){
+        console.error("OAuth callback returned an error:", oauthError, oauthErrorDesc);
+        showAuthError((oauthErrorDesc || oauthError || 'Sign-in failed.').replace(/\+/g, ' '));
+        window.Capacitor?.Plugins?.Browser?.close().catch(function(){});
+        return;
+      }
+    }catch(errParseErr){
+      console.error("Failed parsing OAuth callback URL for error params:", errParseErr);
+    }
+
     // -------------------------
     // Authorization Code Flow
     // -------------------------
@@ -2881,6 +2912,8 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
     }
 
     console.log("No supported callback format detected.");
+    showAuthError("Sign-in didn't complete — please try again.");
+    window.Capacitor?.Plugins?.Browser?.close().catch(function(){});
 
   });
 
diff --git a/index.html b/index.html
index 0236cb2..ed0e7c9 100644
--- a/index.html
+++ b/index.html
@@ -2882,6 +2882,37 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
 
     console.log("OAuth callback received"); // never log the actual URL -- it contains the auth code
 
+    // -------------------------
+    // OAuth error passthrough (added Sept 29 2026 -- see docs/BUG_LOG.md)
+    // -------------------------
+    // Google/Supabase can hand the app back a failure instead of a code/token, as either a query
+    // param (?error=...&error_description=...) or a hash param (#error=...&error_description=...).
+    // Every branch below only ever checked for success params, so a real failure here fell through
+    // all of them silently -- console-only, nothing shown to the user, looking exactly like the
+    // callback never happened. Check for this first, before any success-path branch, and surface it.
+    try{
+      var errParsed = new URL(url);
+      var errFromQuery = errParsed.searchParams.get("error");
+      var errDescFromQuery = errParsed.searchParams.get("error_description");
+      var errFromHash = null, errDescFromHash = null;
+      var errHashIdx = url.indexOf('#');
+      if(errHashIdx !== -1){
+        var errHashParams = new URLSearchParams(url.substring(errHashIdx + 1));
+        errFromHash = errHashParams.get("error");
+        errDescFromHash = errHashParams.get("error_description");
+      }
+      var oauthError = errFromQuery || errFromHash;
+      var oauthErrorDesc = errDescFromQuery || errDescFromHash;
+      if(oauthError){
+        console.error("OAuth callback returned an error:", oauthError, oauthErrorDesc);
+        showAuthError((oauthErrorDesc || oauthError || 'Sign-in failed.').replace(/\+/g, ' '));
+        window.Capacitor?.Plugins?.Browser?.close().catch(function(){});
+        return;
+      }
+    }catch(errParseErr){
+      console.error("Failed parsing OAuth callback URL for error params:", errParseErr);
+    }
+
     // -------------------------
     // Authorization Code Flow
     // -------------------------
@@ -3008,6 +3039,8 @@ if (IS_NATIVE_APP && window.Capacitor?.Plugins?.App) {
     }
 
     console.log("No supported callback format detected.");
+    showAuthError("Sign-in didn't complete — please try again.");
+    window.Capacitor?.Plugins?.Browser?.close().catch(function(){});
 
   });
 
```
**Status**: code fixed and pushed. NOT yet on any real device -- the native app bundles `index.html` at build time, so this needs a new staging build (v47) before it does anything for Akash. Once built and deployed, the very next sign-in attempt will show the real underlying error instead of nothing, which is what actually resolves #114.

### 18. Full history reconstruction set up (commit 8a7a648) -- Sept 29, 2026
Docs/tooling only; nothing in the app, database or live site changed. The 7 MB of recovered
code under `docs/history/code/` is itself a verbatim record, so it is summarised here by
`--stat` rather than pasted a second time.

```
commit 8a7a6489c894f4351fdff43dabda2f32b3338616
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 07:58:57 2026 +0000

    Start full history reconstruction from Akash's chat export

 .gitignore                          |     2 +
 CLAUDE.md                           |     4 +
 docs/HISTORY.md                     |    25 +
 docs/HISTORY_PROGRESS.md            |    69 +
 docs/MASTER.md                      |     6 +
 docs/history/code/2026-06.md        |  4078 ++
 docs/history/code/2026-07.md        | 96324 ++++++++++++++++++++++++++++++++++
 docs/history/code/2026-08.md        | 27087 ++++++++++
 docs/history/code/2026-09.md        | 25459 +++++++++
 tools/history/build_timeline.py     |   156 +
 tools/history/extract_code_edits.py |    99 +
 tools/history/redact.py             |    61 +
 12 files changed, 153370 insertions(+)
```

Push note: the first attempt at this commit was **blocked by GitHub push protection** (a
HubSpot `pat-na2-` token in the recovered code that the redaction patterns missed). Nothing
was pushed. The unpushed commit was undone, the pattern fixed, an old Hostinger token and a
test password (no recognisable prefix) added to exact-value redaction, and everything
regenerated before this commit.

### 19. Redacted a leaked Razorpay webhook secret from the history docs (commit 597e579) -- Sept 29, 2026 -- BUG_LOG #115
Docs only. The removed value is shown redacted, per this file's redaction rule.

```
commit 597e5798b5612fd70bd37a0e42c63658ced491fe
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 08:32:24 2026 +0000

    Redact leaked Razorpay webhook secret from docs/history/code/2026-08.md

diff --git a/docs/history/code/2026-08.md b/docs/history/code/2026-08.md
index de43879..935d95f 100644
--- a/docs/history/code/2026-08.md
+++ b/docs/history/code/2026-08.md
@@ -7370,7 +7370,7 @@ FULL FILE TEXT (exact):
 
 ## Razorpay
 - **Key ID:** `<REDACTED:razorpay_key>`
-- **Webhook secret:** `<REDACTED -- the real value, now removed>`
+- **Webhook secret:** `<REDACTED:known_credential>`
 - **Test campaign** (never toggle a real campaign's `is_active` for testing — always use this one): ID `0a0f501b-2359-430a-be0d-223f678a6451`, title `__CLAUDE_TEST_CAMPAIGN_DO_NOT_USE__`
 
 ## WordPress (homeofbeautifulsouls.com)
```


### 20. Redacted real clients' first names from the history code docs (commit 310c487) -- Sept 29, 2026 -- BUG_LOG #116
Docs only. The removed names are shown as `<name>` here, so this log does not republish them.

```
commit 310c487
    Redact client first names from verbatim code history (prototype task data)

 docs/history/code/2026-07.md | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)

(both changed lines are the same prototype data line, lines ~95591 and ~95812)
-  {title:"Get clients on App", priority:"medium", subtasks:[{t:"<name>",done:true},{t:"<name>",done:true},{t:"<client>",done:true},{t:"<name>",done:true},{t:"<name>",done:true},{t:"<client>",done:true},{t:"<name>",done:false},{t:"<name>",done:false},{t:"<name>",done:false}]
+  {title:"Get clients on App", priority:"medium", subtasks:[{t:"<client>",done:true},{t:"<client>",done:true},{t:"<client>",done:true},{t:"<client>",done:true},{t:"<client>",done:true},{t:"<client>",done:true},{t:"<client>",done:false},{t:"<client>",done:false},{t:"<client>",done:false}]
```

### 21. Redaction fix: known credentials replaced longest-first; code history regenerated (commit 07efa53) -- Sept 29, 2026 -- BUG_LOG #117
Code change (exact diff below). The regenerated `docs/history/code/*.md` changes (62/16/6 lines)
only swap the leaked secret tail for redaction markers, so they are not pasted here: that would
republish the value being removed.

```
commit 07efa53dfb65d9072c5c05740cbd0bc05a7346fc
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 12:38:20 2026 +0000

    Fix partial-redaction leak: replace known credentials longest-first; regenerate code history
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/tools/history/redact.py b/tools/history/redact.py
index 30d7c13..4123b9d 100644
--- a/tools/history/redact.py
+++ b/tools/history/redact.py
@@ -35,6 +35,10 @@ PATTERNS = [
 ]
 
 _known = [v.strip() for v in os.environ.get("HOBS_REDACT_VALUES", "").split("\n") if len(v.strip()) >= 12]
+# Longest first: if one known value is a prefix of another (e.g. a stored credential that is a
+# shortened form of the real secret), replacing the short one first would leave the rest of the
+# long one exposed. Found Sept 29, 2026 -- BUG_LOG #117.
+_known = sorted(set(_known), key=len, reverse=True)
 # Real clients' names (not staff/team), passed at runtime only -- never listed in this repo.
 _names = [n.strip() for n in os.environ.get("HOBS_REDACT_NAMES", "").split(",") if n.strip()]
 _name_pats = [re.compile(r"\b" + re.escape(n) + r"\b", re.I) for n in _names]
```

### 22. Scanner: Gladia API key pattern added to redact.py (commit 2e99ee4) -- Sept 29, 2026 -- BUG_LOG #118
Code change (exact diff below).

```
commit 2e99ee40d81ce7d60c39a78daa85215496c6f030
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 12:54:52 2026 +0000

    Scanner: add Gladia API key pattern to redact.py (key seen in the Sept 21 export)
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/tools/history/redact.py b/tools/history/redact.py
index 4123b9d..e07c7a4 100644
--- a/tools/history/redact.py
+++ b/tools/history/redact.py
@@ -32,6 +32,7 @@ PATTERNS = [
     ("hubspot_token", re.compile(r"\bpat-[a-z]{2,4}\d*-[a-f0-9\-]{20,}")),
     ("netlify_token", re.compile(r"\bnf[a-z]_[A-Za-z0-9]{20,}")),
     ("hobs_wp_rest_token", re.compile(r"HOBS-Claude-\d{4}-[A-Za-z0-9\-]{4,}")),
+    ("gladia_key", re.compile(r"\bsk_gladia_[A-Za-z0-9]{16,}")),
 ]
 
 _known = [v.strip() for v in os.environ.get("HOBS_REDACT_VALUES", "").split("\n") if len(v.strip()) >= 12]
```

### 23. History reconstruction marked complete (MASTER §1/§8, CLAUDE.md, PROJECT_STATUS, HISTORY_PROGRESS, BUG_LOG pointer) (commit 49e0a46) -- Sept 29, 2026 -- BUG_LOG #120
Docs change (exact diff below).

```
commit 49e0a46c7f23ba33d6f9164978a4b4744ea162e4
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 12:59:51 2026 +0000

    History reconstruction complete: MASTER §1/§8, CLAUDE.md, PROJECT_STATUS, BUG_LOG pointer
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/CLAUDE.md b/CLAUDE.md
index d067ea7..1cce441 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -11,10 +11,10 @@ zip over live state, has caused real, repeated problems in this project's histor
 2. Read `docs/PROJECT_STATUS.md` for what's currently open.
 3. Read `docs/BUG_LOG.md` in full, including the standing lessons at the end — several real bugs
    in this project's history happened because an earlier entry in this same file was skipped.
-4. **Work in progress since Sept 29, 2026**: the full project history is being reconstructed
-   from Akash's chat export. Read `docs/HISTORY_PROGRESS.md` before anything else — if that
-   work isn't marked complete, it says exactly where to resume. Do not restart it from scratch
-   and do not touch the app, database, live site or builds while doing it unless Akash says so.
+4. The full project history (July 2026 → Sept 29, 2026) was reconstructed from Akash's chat
+   export and is **complete**: `docs/HISTORY.md` (timeline, bugs, decisions) and
+   `docs/history/code/` (exact code edits). Check it before assuming something was never tried.
+   `docs/HISTORY_PROGRESS.md` says how to extend it with a newer export.
 
 ## Standing rules (restated from `docs/MASTER.md` §11-12 — read those for full context)
 
diff --git a/docs/BUG_LOG.md b/docs/BUG_LOG.md
index be3aead..e976d96 100644
--- a/docs/BUG_LOG.md
+++ b/docs/BUG_LOG.md
@@ -11,6 +11,10 @@ in this log — July, August 5–6, and August 14) was found and fixed multiple
 different months, in different files, because the fix wasn't generalized into a rule the first
 time. See "Standing lessons" at the bottom.
 
+**Older and fuller record**: `docs/HISTORY.md` (complete as of Sept 29, 2026) holds every bug
+found in the chat export — created, fixed and recurring — including ones never entered here.
+Check it too when a bug looks familiar.
+
 ---
 
 ## July 22–23, 2026 — Early development session
diff --git a/docs/HISTORY_PROGRESS.md b/docs/HISTORY_PROGRESS.md
index 23b3e7a..a081467 100644
--- a/docs/HISTORY_PROGRESS.md
+++ b/docs/HISTORY_PROGRESS.md
@@ -67,6 +67,9 @@ the chunks and recorded in `HISTORY.md` in words, with the command where it matt
 
 ## Status
 
+- **COMPLETE (Sept 29, 2026).** Every message of the export in scope was read and recorded in
+  `docs/HISTORY.md`. To extend with a newer export: rebuild chunks as above and continue after
+  the resume point below.
 - Total chunks: **65** (each ~100k characters)
 - Sept 29: found keystore / test-account passwords (no fixed prefix) in the pushed code docs; added them as exact values to the scratch regen grep and regenerated. Earlier commits in git history still contain them, and MASTER.md itself lists two of them -- flagged to Akash, not changed without his OK.
 - Sept 29 (later): the production and staging scheduler secrets were also in the pushed code docs (no fixed prefix) -- added as exact values to the scratch regen grep and regenerated. Also added redact.py patterns for Netlify tokens (`nf?_`) and private keys cut off before their END line. Same caveat: older git commits still hold them.
diff --git a/docs/MASTER.md b/docs/MASTER.md
index d37041e..571e6e7 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -1,5 +1,6 @@
 # HOBS Companion — Master Reference
-Last rebuilt: September 16, 2026. Last real update: September 27, 2026 (§10 WhatsApp Business
+Last rebuilt: September 16, 2026. Last update: September 29, 2026 (§1 full history
+reconstruction complete; §8 open items found in the history). Previous: September 27, 2026 (§10 WhatsApp Business
 API; §4 Edge Function audit -- 4 undocumented live functions added, 2 live unauthenticated
 "temporary" functions flagged for deletion, `transcribe-audio`'s real provider corrected; §12
 new standing safeguard against session-reset drift; CLAUDE.md added at repo root). **Read this
@@ -55,8 +56,18 @@ literal thing that changed). Both get updated the same turn a real change is mad
 **For the full history from the very first chat (July 2026) onward** — every change, the exact
 code, when, where, why, every bug created/fixed/recurring, every decision — see
 `docs/HISTORY.md` (timeline) and `docs/history/code/` (2,830 code edits recovered word for word
-from the chats). Reconstruction started Sept 29, 2026 from Akash's full claude.ai export and is
-**in progress** — `docs/HISTORY_PROGRESS.md` says exactly how far it has got and how to resume.
+from the chats). Reconstruction done Sept 29, 2026 from Akash's full claude.ai export —
+**complete** through the last message of the export (Sept 29, 07:08 UTC). How it was built and
+how to extend it: `docs/HISTORY_PROGRESS.md`.
+- `docs/HISTORY.md` sections, in order: June (memory problem) → July 3–4 scoping and Phase 1 →
+  July–Aug build-out (constellation tasklist, rich-text journal, task alarms, Google Calendar,
+  GitHub Pages outage, bundled APK + Hostinger, Character AI, offline/storage) → Aug 26 MASTER.md
+  and the credential leak → Aug 27–29 in-app Razorpay → Sept 8–15 Play Store → Sept 14–17 Bob
+  (prompt, memory, crisis, psychoeducation, architecture plan) → Sept 16–20 chat tabs, matching,
+  homework, session history, per-session payment, mic/transcription → Sept 21–27 WhatsApp Cloud
+  API → Sept 26–29 audits, CLAUDE.md, OAuth scheme fix, profile save bug.
+- `docs/history/code/2026-06.md` … `2026-09.md`: 2,797 edits, ids `E-<msg>-<n>`, 57 marked failed.
+  Shell-command changes (sed, curl SQL) are described in `HISTORY.md` instead.
 
 **HOBS Companion** — a mental health companion app for **Home of Beautiful Souls Foundation**
 (HOBS), an Ahmedabad-based mental health NGO founded by **Akash Ramchandani** (psychologist,
@@ -412,6 +423,21 @@ open items are:
   now received before returning to the app. See §9 below — this is a real reversal from an
   earlier version of this document.
 
+Found in the Sept 29 history reconstruction (from the chats, **not yet re-checked against live
+state** — verify before acting):
+- **Profile-save fix is not in the installed app.** Sept 29 it was deployed to the website only,
+  on the claim the app loads `index.html` at runtime. That contradicts the Sept 20 finding that
+  the app is bundled. A new production APK (v83) is needed. Not built — awaiting Akash's OK.
+- **WhatsApp permanent token** was overwritten on Sept 22 (see `HISTORY.md`, Sept 21–22).
+  Check which token the live function uses.
+- Hindi crisis-detection patterns need review by a native speaker.
+- Secret hygiene, awaiting Akash's decision: rotate the Razorpay webhook secret and scheduler
+  secrets; make the repo private or rewrite git history (older commits hold a keystore password,
+  leaked secrets, client names); remove passwords listed in this file (§2) and the Hostinger
+  token (§5), revoke the old Hostinger token.
+- Session-reset credential loss keeps recurring; suggested fix (not done): GitHub Actions secrets.
+- No persistent test suite / CI yet (plan exists, not started).
+
 ---
 
 ## 9. Character AI — current, real status (this is a real reversal from an earlier version of this document)
diff --git a/docs/PROJECT_STATUS.md b/docs/PROJECT_STATUS.md
index a6ba553..3981fe4 100644
--- a/docs/PROJECT_STATUS.md
+++ b/docs/PROJECT_STATUS.md
@@ -21,6 +21,10 @@ per session, a real professional schedule view, a genuine, root-caused fix for t
 Calendar-reconnect-vs-auto-reload interaction, and a full, honest catch-up of `docs/BUG_LOG.md`
 covering two real sessions that had never been logged at all.*
 
+*Sept 29, 2026: full history reconstruction complete (`docs/HISTORY.md`). Open items it
+surfaced are listed in `MASTER.md` §8 — the key one: the profile-save fix is website-only, the
+installed app needs a new APK (v83, awaiting Akash's OK).*
+
 ## Play Store submission blockers
 
 - [x] **D-U-N-S Number** — resolved August 21, 2026. **854273779**, Home of Beautiful Souls
```

### 24. MASTER §13 future plan; §8 Hindi correction (commit 2767814) -- Sept 29, 2026 -- BUG_LOG #119, #120
Docs change (exact diff below).

```
commit 276781486b4a118042a8c39ea16951f9e3782c95
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 13:44:59 2026 +0000

    MASTER §13 future plan (safeguards, security, Play release/optimisation, development); §8 Hindi correction
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/docs/MASTER.md b/docs/MASTER.md
index 571e6e7..bddb2a9 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -1,6 +1,6 @@
 # HOBS Companion — Master Reference
 Last rebuilt: September 16, 2026. Last update: September 29, 2026 (§1 full history
-reconstruction complete; §8 open items found in the history). Previous: September 27, 2026 (§10 WhatsApp Business
+reconstruction complete; §8 open items found in the history; §13 future plan). Previous: September 27, 2026 (§10 WhatsApp Business
 API; §4 Edge Function audit -- 4 undocumented live functions added, 2 live unauthenticated
 "temporary" functions flagged for deletion, `transcribe-audio`'s real provider corrected; §12
 new standing safeguard against session-reset drift; CLAUDE.md added at repo root). **Read this
@@ -430,7 +430,8 @@ state** — verify before acting):
   the app is bundled. A new production APK (v83) is needed. Not built — awaiting Akash's OK.
 - **WhatsApp permanent token** was overwritten on Sept 22 (see `HISTORY.md`, Sept 21–22).
   Check which token the live function uses.
-- Hindi crisis-detection patterns need review by a native speaker.
+- (Correction: Hindi crisis detection is **not** open. Akash decided Sept 20, 15:25, "let's just
+  keep English" until there is money for other languages; Hindi patterns are disabled in code.)
 - Secret hygiene, awaiting Akash's decision: rotate the Razorpay webhook secret and scheduler
   secrets; make the repo private or rewrite git history (older commits hold a keystore password,
   leaked secrets, client names); remove passwords listed in this file (§2) and the Hostinger
@@ -582,3 +583,105 @@ lost**:
   until tested against real, live data or a real device.
 - When something is fixed, say plainly what was actually wrong and what changed — no vague
   reassurance, no claiming something is resolved without having verified it.
+
+---
+
+## 13. Future plan — safeguards, security, Play Store, development (Sept 29, 2026)
+
+Agreed direction from Akash, Sept 29, 2026. **Nothing here is built yet. Every item needs
+Akash's explicit OK before it starts** (standing rule: talk first, no builds/deploys without OK).
+Suggested order: 13.1 → 13.3 → 13.2 → 13.4 → 13.6 / 13.8 → 13.5 → 13.7.
+
+Core idea: today almost every safeguard is a rule a Claude session has to remember. Move them
+into the system itself, so they hold even when a session forgets or resets.
+
+### 13.1 Never lose credentials again
+- Every key lives in **GitHub Actions encrypted secrets** (build/deploy) and **Supabase secrets**
+  (Edge Functions). Builds and deploys run in GitHub Actions, so no session needs a pasted PAT.
+- Akash keeps the master copy in a **password manager** (e.g. Bitwarden, free) — independent of
+  GitHub and Supabase.
+- **Rotate every key that has leaked** (Razorpay webhook secret, scheduler secrets, old Hostinger
+  token, anything in git history) and **make the repo private** (or rewrite history).
+- Remove the passwords in §2 and the Hostinger token in §5 of this file.
+- Upload keystore: **two backup copies** outside the repo. Play App Signing allows an upload-key
+  reset if it is ever lost.
+
+### 13.2 Never lose work
+- Everything live must also be in git. Automate the §4 Edge Function audit (live vs repo vs this
+  file) as a **weekly scheduled check that alerts on any difference**.
+- **Monthly restore test** of the backups (`database-backup`, `database-backup-offsite`) — an
+  untested backup is not a backup.
+- Decision for Akash: **Supabase Pro ($25/month)** — automatic daily backups (7 days) and no
+  inactivity pausing (the Sept 27 staging pause broke Google Sign-In). Free plan has no automatic
+  backups at all. PITR is a paid add-on on top of Pro.
+
+### 13.3 Nothing ships without Akash's OK — enforced, not remembered
+- Production deploy workflows use a **GitHub protected environment with required approval**: even
+  if a session starts one, it cannot go live until Akash clicks approve.
+- Every change: written spec → Akash OK → staging → automated tests → Akash approve → production.
+- BUG_LOG and CHANGE_LOG rules (CLAUDE.md) stay.
+
+### 13.4 Catch bugs before users do (the Sept 20 "five layers" request)
+- **Persistent automated test suite + CI gate** on every change. First: crisis detection,
+  sign-in, profile save, payments.
+- **Every incident becomes a regression test** so it cannot come back.
+- Build-time validation incl. a **staging-vs-production diff** (the Sept 26 APK diff found real
+  drift).
+- **Crashlytics** (native crashes) + `window.onerror` / JS error logging with stack, screen, version.
+- Extend the crisis-classifier health check/canary pattern to **WhatsApp, payments, backups**.
+- DB-constraint audit (the Sept 29 phone CHECK constraint broke every profile save).
+- Play: **staged rollouts** (10% → 50% → 100%, halt on problems) and the **pre-launch report**
+  (real-device tests of every build).
+
+### 13.5 Security and privacy (mental-health data)
+- Audit against **OWASP MASVS** (mobile security standard). Re-audit RLS on every table.
+- Supabase production checklist: RLS everywhere, SSL enforcement, network restrictions, account
+  MFA, custom SMTP, CAPTCHA on auth.
+- **India DPDP Rules 2025** — core obligations apply ~18 months after notification (Nov 2025),
+  i.e. **around May 2027**: consent notices; breach notice to users immediately and to the Data
+  Protection Board within **72 hours**; erase after **1 year of inactivity** with **48 hours'**
+  notice; keep access logs **1 year**; encryption, access control, verified backups.
+- **Lawyer review of the Terms of Service** — still open.
+
+### 13.6 Play Store release path
+- **Target API 36 (Android 16)** is required for all updates since Aug 31, 2026 (extension to
+  Nov 1 possible). History says targetSdk 36 was set in August — **verify** in the build config.
+- Verify in Play Console whether the 12-testers / 14-days rule still applies to the organization
+  account (§8 may be stale).
+- **v83** with the profile-save fix (installed app still has the bug — §8).
+- A written **release checklist** used for every release.
+
+### 13.7 Developing new features
+- One feature at a time, same pipeline as 13.3.
+- Next from the backlog: **Bob Phase 1 (Personal Grounding — anti-hallucination)**, then
+  **streaming replies**. Then Kunnu/Po/Cookie character work (§9).
+
+### 13.8 Play Store optimisation (Console keeps flagging "not optimised")
+**Need from Akash: a screenshot of the exact Console warnings** (the Play API does not expose
+them). Likely causes, from the history and the repo:
+1. **R8 off** (`minifyEnabled false` in both build configs). Play recommends R8 (smaller, faster
+   app). Sept 8: Claude advised waiting because Capacitor and the Razorpay SDK need keep rules.
+   Plan: enable in staging, test every screen, then ship.
+2. **No deobfuscation file / native debug symbols** uploaded with the bundle (readable crash
+   reports). Small build change.
+3. **Large screens**: the UI is capped at `.phone { max-width: 420px }`, so tablets show a small box.
+   Either make it adaptive on tablets, or restrict the device catalog to phones. (No
+   `screenOrientation` lock in the repo, so the Android 16 orientation warning shouldn't apply.)
+4. To check: **16 KB memory page-size** support (risk: Razorpay SDK native libraries) and
+   edge-to-edge deprecation warnings.
+
+Ranking factors:
+- **Android vitals** — the biggest one. Over **1.09%** daily users with a crash or **0.47%** with an
+  ANR (freeze) → Play reduces visibility and may put a warning on the listing. Crashlytics +
+  staged rollouts protect this.
+- **Listing (ASO)**: title (30 chars) and short description (80) with the words people actually
+  search (therapist, mood tracker, journal) — no clickbait (Akash, Sept 8); full description
+  keywords; screenshots and feature graphic A/B-tested with **store listing experiments**.
+- **Ratings**: ask via Google's **in-app review prompt** at a good moment (e.g. after a completed
+  session).
+- Optional, free: **Hindi / Gujarati listing text** for Indian search. Store page only — does not
+  change the English-only crisis decision.
+
+Sources: Supabase backups and production checklist docs; Play Console Help (target API level,
+Android vitals thresholds); Play Console release and pre-launch report guides; OWASP MASVS;
+Android Developers (16 KB page sizes); India Briefing (DPDP Rules 2025); AppTweak ASO checklist.
```

### 25. MASTER §13.9 code-structure decision (commit 3df63ae) -- Sept 29, 2026 -- BUG_LOG #120
Docs change (exact diff below).

```
commit 3df63aefaba29da33f11317ce755693a0f5f4264
Author: Claude <claude@hobsfoundation.com>
Date:   Tue Sep 29 13:49:32 2026 +0000

    MASTER §13.9: code-structure decision (handover to developer later)
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS

diff --git a/docs/MASTER.md b/docs/MASTER.md
index bddb2a9..2529c38 100644
--- a/docs/MASTER.md
+++ b/docs/MASTER.md
@@ -682,6 +682,17 @@ Ranking factors:
 - Optional, free: **Hindi / Gujarati listing text** for Indian search. Store page only — does not
   change the English-only crisis decision.
 
-Sources: Supabase backups and production checklist docs; Play Console Help (target API level,
+### 13.9 Code structure — single 17,353-line `index.html`
+- Problem: the whole client app is one file (14,541 lines on Jul 26 → 17,353 on Sept 29). A
+  developer sees a mess.
+- Agreed Jul 26 (still valid): strangler-fig migration to Vite + React + TypeScript, Vitest +
+  Playwright, React Router, Context + TanStack Query; pixel-for-pixel first; real automated tests;
+  backend untouched; new features paused during it; start small (Journal).
+- **Decision Sept 29: hand this to the developer later, with a complete, clear handover package**
+  (instructions, `APP-BLUEPRINT.md`, this file, test suite, build/deploy pipeline). Not started by
+  Claude. Safe order when it starts: tests (13.4) → split into per-feature files with zero visible
+  change → React screen by screen through staging → approval → production.
+
+ Play Console Help (target API level,
 Android vitals thresholds); Play Console release and pre-launch report guides; OWASP MASVS;
 Android Developers (16 KB page sizes); India Briefing (DPDP Rules 2025); AppTweak ASO checklist.
```
