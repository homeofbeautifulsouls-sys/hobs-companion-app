# HOBS Companion — Master Reference
Last rebuilt: September 16, 2026. Last real update: September 27, 2026 (§10 WhatsApp Business
API; §4 Edge Function audit -- 4 undocumented live functions added, 2 live unauthenticated
"temporary" functions flagged for deletion, `transcribe-audio`'s real provider corrected; §12
new standing safeguard against session-reset drift; CLAUDE.md added at repo root). **Read this
file first, before doing anything else, at the start
of any session working on this project** — whether this is a fresh chat, a sandbox reset, or
just picking this up after time away. This is the single entry point everything else is
findable from. If a `CLAUDE.md` loaded automatically before you saw this line, that is
deliberate — see §12.

---

## 0. If you are Claude, reading this for the first time in a new session

**The one real requirement that can't be removed**: a genuinely fresh session (new chat, or a
sandbox with zero prior context) needs Akash to provide one starting credential directly —
either the GitHub PAT, or the Supabase production secret key / management PAT. Either one is
enough to unlock everything else (clone the repo to find the Supabase credentials and read this
file in full, or query `system_credentials` directly to find the GitHub PAT and clone from
there). There's no way to self-bootstrap with zero input, since accessing either system
requires some valid credential to exist somewhere reachable from the start — see §2 for why.

Once you have that one starting credential:
1. Clone the repo: `git clone https://<GITHUB_PAT>@github.com/homeofbeautifulsouls-sys/hobs-companion-app.git`
2. Read `docs/BUG_LOG.md` in full — every real bug found this project's history, root causes,
   and the standing lessons at the top. Do not skip this; the same mistakes have been made more
   than once when it was skipped.
3. Read `docs/PROJECT_STATUS.md` for what's currently open/pending.
4. Read every `README.md` under `android-native-assets/*/` — each one explains a real incident
   that made that specific file need to be persisted.
5. **Run `deployment/verify-before-deploy.sh` before your first deploy of the session**, and
   before every one after that. It checks every image the app references and every critical
   native build file against what's actually saved, and fails loudly if anything's missing.
6. Set `git config --global user.email` and `user.name` before your first commit — sandbox
   resets wipe this and a commit will silently fail to actually happen otherwise (confirmed
   real incident: see BUG_LOG.md).

---

## 1. What this project is

**For the full, exhaustive, screen-by-screen picture of the entire app** — every user role's
real flow, every table, every Edge Function re-verified, a complete feature inventory with
live/staging/planned status tags, and the real roadmap — see `docs/APP-BLUEPRINT.md` (written
Sept 27, 2026, directly from the live repo). This file (`MASTER.md`) stays the fast entry point
and the operational rules; `APP-BLUEPRINT.md` is the deep reference.

**HOBS Companion** — a mental health companion app for **Home of Beautiful Souls Foundation**
(HOBS), an Ahmedabad-based mental health NGO founded by **Akash Ramchandani** (psychologist,
neurodivergent, ADHD — communicate in short, direct messages, ask before consequential actions,
avoid long paragraphs unless asked). Features: mood check-ins, journaling with AI crisis
detection, tasklist, breathing/grounding exercises, a support group chat, therapist
booking/dashboard, period tracking, CBT/DBT/ACT worksheets, and character companions (Bob the
elephant is the primary, fully-built companion with real memory, crisis escalation, and
psychoeducation; Kunnu, Cookie, Po are hidden, kept intact, awaiting the same depth of work — see §9).

**Live surfaces:**
- Production website + APK download: `https://app.homeofbeautifulsouls.com`
- Staging website + APK download: `https://staging-app.homeofbeautifulsouls.com`
- Marketing site: `https://homeofbeautifulsouls.com`

**Distribution model**: the native Android app bundles its own UI locally (no remote server
dependency to open) — deliberately migrated away from GitHub Pages after a real outage there
took the live app down for hours. Dynamic data goes to Supabase over the network; the UI itself
does not depend on any server being reachable just to open.

---

## 2. All credentials — real security incident and the current, safe method

**Real incident, August 26, 2026**: raw credential values were once committed directly to this
file. GitHub's own secret-scanning detected three of them within minutes and auto-revoked them
at the issuing services (Supabase, GitHub itself) -- even in this private, fully-controlled
repo. Real, live access broke as a direct result. **Never put a raw credential value in any file
in this repo again, in any form -- base64 or other simple encoding does not work either,
confirmed directly: GitHub's scanner decodes common encodings before pattern-matching.**

**The real, current, safe method**: every live credential this project uses is stored in a
dedicated Supabase table, `system_credentials`, on the production project
(`adjvptkzyckkvewbfmzf`) -- protected by real Row Level Security with zero policies attached,
meaning only the secret/service-role key can read it at all; the public/publishable key gets
nothing, confirmed directly by testing both. Query it with:

```sql
select key_name, key_value, notes from system_credentials order by key_name;
```

via the Supabase Management API (`api.supabase.com/v1/projects/{ref}/database/query`) using the
management PAT, or directly via `/rest/v1/system_credentials` using the secret key as both the
`apikey` and `Authorization: Bearer` headers.

**The one real bootstrapping requirement that can't be removed**: reading that table still needs
*some* starting credential. If a fresh session has none of the values above (e.g., after a
sandbox reset with no prior context), ask Akash directly for the current Supabase production
secret key or management PAT -- either one is enough to unlock everything else via the table.
There is no way to fully eliminate this one anchor point.

**What's stored in `system_credentials` right now**: `SUPABASE_PROD_SECRET_KEY`,
`SUPABASE_MGMT_PAT`, `GITHUB_PAT`, `GROQ_API_KEY`, `HOSTINGER_API_TOKEN`,
`SUPABASE_PROD_PUBLISHABLE_KEY`, `SUPABASE_STAGING_PUBLISHABLE_KEY`. Also relevant, not secret,
safe to record directly:

- Supabase production project ref: `adjvptkzyckkvewbfmzf` — URL: `https://adjvptkzyckkvewbfmzf.supabase.co`
- Supabase staging project ref: `ivqlqrpcamoshmgibjph` — URL: `https://ivqlqrpcamoshmgibjph.supabase.co`
- GitHub repo: `github.com/homeofbeautifulsouls-sys/hobs-companion-app` (private)
- Hostinger account username: `u533396600` — **deployment does NOT use a simple file-upload
  API** — see §5 for the real, working method.
- Test admin account (production Supabase, full admin + therapist role): email
  `claude-test-admin@hobsfoundation.com`, password `ClaudeTestAdmin2026!`,
  user_id `52f3a837-cedb-4c01-b3c2-4eb2bcb15295`
- Akash's real account user_id: `a3482f5a-0e23-4f69-b335-858fc1b00c6b`

### Android signing keystore
- File: `android-native-assets/signing/hobs-release.keystore` (in this repo -- a binary file,
  genuinely fine to commit directly, unlike API keys)
- storePass: `hobsbeta2026` — alias: `hobs` — keyPass: `hobsbeta2026`
- Real SHA-256 fingerprint (verify any build against this before shipping):
  `b299200ee13cc56b42f68a11c9d0796c67775f1cc71a430e0ea81c89a6ff06cb`
- **This exact file was lost once already** (a sandbox reset wiped an unpersisted copy) and
  recovered only because Akash happened to still have an old handoff zip. If this file is ever
  missing from the repo, stop immediately and tell Akash — do not generate a replacement without
  his explicit go-ahead, since a different key breaks every future update for everyone who
  already has the app installed.

### Package names
- Production: `com.hobsfoundation.companion`
- Staging: `com.hobsfoundation.companion.staging` (deliberately separate — installs as a
  completely different app, side-by-side with production, safe to have both on one device)

### Secrets that exist but whose values are NOT recorded anywhere I have access to
Supabase Edge Function secrets (a different thing from the `system_credentials` table above --
these are set via the Supabase secrets manager and are write-only via the API once set, they
cannot be read back at all, by anyone). Confirmed to exist as secrets on the production project,
but their actual values are only in Akash's own records or the original source they came from.
If a function using one of these starts failing, this is why — get the real value from Akash,
don't try to guess or regenerate: `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
`GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `HUBSPOT_API_TOKEN`,
`GLADIA_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
`SCHEDULER_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.
**Corrected Sept 27, 2026**: this list previously said `ASSEMBLYAI_API_KEY` — checked directly
against the real, deployed `transcribe-audio` source and AssemblyAI isn't used anywhere in it.
The function actually uses `GLADIA_API_KEY` (primary provider, Gladia/Solaria) with
`GROQ_API_KEY` as its automatic fallback (see §4). `ASSEMBLYAI_API_KEY` may still exist as a
leftover secret from before that switch; it's no longer load-bearing for anything.

---

---

## 3. Architecture

**Frontend**: a single, large (~1MB) `index.html` — vanilla JS, no framework, no build step. This
is the entire client: web version and the native app both load this exact file. Supabase JS SDK
loaded from the local `supabase.min.js` (not a CDN, so it works without network on native).

**Backend**: Supabase (Postgres + Auth + Storage + Edge Functions + pg_cron). Two projects:
production and staging, fully separate data.

**Native app**: Capacitor (Android only currently). Plugins in use: `@capacitor/app`,
`@capacitor/browser`, `@capacitor/filesystem`, `@capacitor/push-notifications`,
`@capacitor/share`, `@capacitor/splash-screen`.

**Storage model**: `appState` (a big JS object) is the in-memory source of truth for almost
everything the UI reads. On native, it's persisted to app-private Filesystem storage (not
`localStorage` — see the storage migration bug log entries); on web, plain `localStorage`,
unchanged. A resilient offline-sync queue (`pendingSyncQueue`) catches any write that fails due
to no connection and retries automatically once connectivity returns — this covers journal
entries, tasks, subtasks, period tracking, and worksheet responses.

**Crisis detection**: two layers, always both active. (1) An instant, local keyword pattern
match (`SELF_HARM_SIGNAL_PATTERNS`) runs synchronously before anything else. (2) A Groq-based AI
classifier (`check-journal-risk` Edge Function, model `openai/gpt-oss-safeguard-20b` — a model
OpenAI built specifically for policy-based content classification) catches indirect/metaphorical
language the keyword layer would miss. Both layers are wired into every free-text input in the
app: journal entries (new and edited), chat messages, worksheet free-text fields, and intake
notes.

---

## 4. Every Edge Function, what it does

| Function | Purpose |
|---|---|
| `character-chat-reply` | **Live, core to the app.** Generates Bob's real replies (Kunnu/Cookie/Po hidden, not deleted -- Bob currently handles everything). Runs, in order: crisis-check (kicked off concurrently, not sequentially, with the steps below), name lookup, history/significant-memory fetch, the recall-matcher (one call: recall matching, search-trigger detection, and chief/name decision), the actual reply generation, then crisis-escalation if needed. Significance-flagging, embedding generation, and persistence all happen as a real background task (`EdgeRuntime.waitUntil`) AFTER the reply is already sent -- never blocks what the person sees. Full detail in `docs/BOB-MEMORY-SAFETY-BUILD-SPEC.md` and `docs/BOB-COMPLETE-TECHNICAL-AND-CHARACTER-DOC.md`. |
| `check-journal-risk` | The AI crisis classifier for journal entries specifically — see §3. |
| `check-journal-psychoeducation` | Reads journal entries for non-death depression/anxiety signals and physical-symptom patterns, routing toward the right real test (PHQ-9/GAD-7/PSQI) or the right kind of professional (GP/psychiatrist/therapist) via the existing mascot-tip system. Completely separate from and additive to the crisis check -- never a replacement. |
| `create-razorpay-order` | Payment order creation for donations/sessions. |
| `crisis-classifier-health-check` | **Undocumented until Sept 27, 2026 audit -- live and real.** Real, direct answer to "make the classifier fail-proof, no matter what": built after `check-journal-risk` broke silently for real days in September (invalid API key, then a deprecated model) and nobody noticed until logs were checked by chance. Monitors that the classifier is actually reachable and responding, not just deployed. |
| `database-backup` | Daily Postgres backup. |
| `database-backup-offsite` | Daily backup mirrored to a separate location. |
| `delete-user-account` | Full account deletion, atomic. |
| `error-alert-monitor` | Hourly; pushes an admin alert if error volume spikes. Sends real `type` in its push payload (fixed a real bug where this was empty). |
| `extract-character-memories` | Weekly (Sunday 3am via pg_cron). Extracts (not summarizes) ordinary character_messages that are both outside the active 40-message window and 7+ days old -- preserves verbatim quotes and named entities, never touches anything `is_significant`, never deletes the original raw rows. |
| `google-calendar-oauth` | OAuth flow for therapist Google Calendar linking. |
| `google-calendar-sync` | Keeps calendar availability in sync; watch channel renewed every 6h via cron. |
| `notification-scheduler` | Runs every 15 min; fires scheduled reminders (task alarms, mood check-ins, etc.). |
| `play-console-status` | **Undocumented until Sept 27, 2026 audit -- live and real.** Real integration with the Google Play Developer API (Android Publisher API) via a service-account signed JWT (RS256, Deno's built-in Web Crypto, no external library). Reads real track/release status. Read-only by design -- opens the required Android-Publisher "edit" session (mandatory even for reads) and always explicitly deletes it at the end, success or failure, so nothing it does can ever change what's actually live. This is what `PROJECT_STATUS.md`'s Play Store section verified against. |
| `publish-production-release` | **Undocumented until Sept 27, 2026 audit -- live and real.** Full automation to take an already-built, already-verified production AAB live: upload it, create the release, roll it out -- not stopping at a draft. Reuses the same auth already proven in `play-console-status`. Real, consequential write action -- confirm with Akash before ever calling this, per §5's production-action rule. |
| `razorpay-payment-callback` | **Undocumented until Sept 27, 2026 audit -- live and real.** Required by Razorpay's own documented WebView integration pattern (their standard checkout doesn't reliably work in an embedded WebView) -- this is the `callback_url` their checkout POSTs to after a payment attempt. Only sends the WebView back to a real in-app page; does **not** verify or record the payment itself -- `razorpay-webhook` (server-to-server, independently signature-verified) remains the only thing allowed to mark a donation/payment as real. |
| `razorpay-webhook` | Payment confirmation webhook. |
| `send-apk-update-notification` | Daily; notifies users of a new app version if one exists. |
| `send-group-poll` | Sends the recurring support-group check-in prompts (morning/evening/variety). |
| `send-push-notification` | Shared, generic push-send function every other function calls. Accepts a `data` field for deep-link routing (see `handleNotificationTap` in the client). Also the real delivery mechanism for crisis escalation -- accepts a `bypassPause: true` flag (deliberate: a routine "notifications paused" preference must never be able to silently suppress a genuine crisis alert), and a real fallback so even a recipient with no registered device still gets a persistent, queryable log entry rather than the alert vanishing with zero trace. |
| `send-task-alarms` | Runs every minute; fires task-specific alarms at their set time. |
| `send-whatsapp-template` | **New Sept 27, 2026.** Generic WhatsApp Cloud API template sender -- see §10. Takes `{to, template, params, lang?}`, requires header `x-scheduler-secret` (same secret as every other internal function-to-function call in this project), normalizes the phone number, sends via Meta Graph API. Every real send is auto-logged by `pg_net`'s own `net._http_response` table -- no separate logging needed. **Real gap, fixed same day**: this was live on Supabase for hours with no copy of its source committed anywhere in this repo -- see `supabase/functions/send-whatsapp-template/index.ts`, now committed. |
| `whatsapp-webhook` | Meta's webhook endpoint for the registered WhatsApp number -- inbound messages and delivery-status callbacks. Persists every real event into `whatsapp_webhook_events` (see §10). |
| `sync-test-result-to-hubspot` | Pushes psychometric test results to HubSpot CRM. |
| `transcribe-audio` | Voice-to-text for journal entries. **Corrected Sept 27, 2026**: this row said "(AssemblyAI)" -- wrong, checked directly against the real deployed source. Real primary provider is **Gladia (Solaria model)**, switched to deliberately for accuracy (benchmarks ~94% word accuracy on English vs Whisper's ~92.4%, Deepgram's 93.5%, AssemblyAI's 91.5%) and a genuine no-training guarantee on its paid tier. **Groq's Whisper** (`whisper-large-v3-turbo`) is the automatic fallback if Gladia is unavailable -- free, already proven not to retain data. AssemblyAI is not called anywhere in this function. |
| `update-donate-page-meta` | Keeps the public donate page's metadata current. |
| `uptime-monitor` | Every 5 min; pings prod + staging, alerts on status change. Same real bug as error-alert-monitor, same fix. |

**Two functions found deployed live that should not have been** (Sept 27, 2026 audit):
`temp-create-templates-v2` (created the finalized WhatsApp templates) and `temp-deactivate-alpha`
(deactivates the Play Store alpha/closed-testing track) -- both self-labeled "TEMPORARY,
one-time-use" in their own source, both still `verify_jwt: false` (callable by anyone with the
URL, no login required) despite their one real job being done. **Deleted the same day**, with
Akash's explicit go-ahead, confirmed gone via a fresh live check against the Supabase Management
API afterward.

Same class of real incident as the six leftover diagnostic WhatsApp-debug functions cleaned up
earlier the same day (see `BUG_LOG.md`) -- a function built "temporary" needs to actually be
deleted once its one-time job is done, not just abandoned live and unauthenticated.

Also found, harmless: `test-embedding` -- a scratch test of Supabase's built-in `gte-small`
embedding model, `verify_jwt: true` (not publicly exposed), never cleaned up, no real purpose
anymore. **Same gap as `send-whatsapp-template` had**: live on Supabase with no committed source
until this same audit -- now pulled into the repo at `supabase/functions/test-embedding/index.ts`.

All cron schedules are set via `pg_cron` directly in the production database (not visible in
this repo as files — query `select jobname, schedule from cron.job;` against production to see
them live). **Real, important note**: scheduled functions need to be deployed with
`--no-verify-jwt` or they'll reject the scheduler's real call with a JWT error before the
`x-scheduler-secret` header is even checked -- a real mistake made and fixed this session on
`extract-character-memories`.

---

## 5. Deployment — the real, working method (this took an entire session to find)

**Do not try to find a simple REST file-upload API for Hostinger — there isn't one for this kind
of hosting.** The actual, working, official method:

```bash
export HOSTINGER_API_TOKEN="i0FPF8Jw0BVSoWziKSH0ujczQo8Osbsx8LxJNYpA613aaeba"
./deployment/deploy-to-hostinger.sh app.homeofbeautifulsouls.com /path/to/site/directory
```

This script (already in the repo) installs Hostinger's own official MCP server package
(`hostinger-api-mcp` from npm) and runs it locally, which handles the real, underlying
resumable TUS upload protocol internally. **Deployments are a full directory replace, not a
merge** — the archive must contain every file that should exist on the live site (index.html,
version.json, every static HTML page, all images from `android-native-assets/web-images/`, and
the current APK) or anything left out will 404 on the live site even if it was there a moment
before. The script already handles the standard file set; if a new top-level file is ever added
to the site, add it to the script's file list too.

**Always verify after deploying** — fetch the real, live URL directly and confirm the actual
content is there. "Request accepted" from the tool only means the deploy was queued.

### Confirm before every production action -- no exceptions, urgency included

Real, direct instruction, Aug 27, 2026, after several real production incidents in one session
(a wiped live APK, a broken donation page, a native crash) got fixed reactively -- discovered,
fixed, deployed, then reported, all before Akash ever saw or approved the plan: **real people are
actively using and downloading this app while any of this happens.** Urgency is not an exception
to this -- it was the exact justification used each time this was skipped, and each time it went
wrong anyway.

**Before any write action against production** (a deploy, a restore, a database change, an
edge-function update, anything a real user could be affected by) -- describe exactly what's about
to happen and wait for an explicit yes. This includes fixes for problems that were just
introduced moments earlier in the same conversation. Investigation, diagnosis, and read-only
verification (checking live status, reading code, testing against a throwaway account) don't need
this -- only the actual write/deploy step does.

Staging deploys are a lower-stakes middle ground already established separately (see below) and
remain useful for things that need real-device testing before this confirmation step even makes
sense to ask for -- but production itself always waits for a real yes now, not just "this seems
urgent enough to act on."

### Android build, from a completely fresh environment



**Staging first, always, no exceptions for anything touching native code.** Real incident, Aug
26, 2026: the native alarm feature was built and shipped straight to production without any real
device testing (only a mocked-plugin JS test, which proved nothing about the actual native
code) -- it crashed on Akash's real device. There is already a live, fully separate staging
environment (`staging-app.homeofbeautifulsouls.com`, Supabase project `ivqlqrpcamoshmgibjph`,
Android package `com.hobsfoundation.companion.staging` -- installs side-by-side with production,
doesn't conflict) specifically so this kind of thing gets caught on a real device before
production ever sees it. See `android-native-assets/staging-config/README.md` for the full
staging build recipe. **Do not build directly for production when the change touches native
Android code (new plugins, permissions, activities, receivers) -- build for staging, have Akash
test it on his real phone, and only build for production after he confirms it's genuinely
working.** JS-only changes (no native surface) are lower risk and don't strictly require this,
but staging is still the safer default when in doubt.

```bash
git clone <repo>
cd hobs-repo
mkdir -p ~/hobs-android-build && cd ~/hobs-android-build
cp ../hobs-repo/android-native-assets/build-config/package.json .
cp ../hobs-repo/android-native-assets/build-config/package-lock.json .
npm install
cp ../hobs-repo/android-native-assets/capacitor-config/capacitor.config.ts .
mkdir -p www && cp ../hobs-repo/index.html ../hobs-repo/version.json ../hobs-repo/supabase.min.js ../hobs-repo/fonts.css www/
cp -r ../hobs-repo/fonts www/
cp ../hobs-repo/android-native-assets/web-images/*.jpg ../hobs-repo/android-native-assets/web-images/*.png www/
npx cap add android
cp ../hobs-repo/android-native-assets/manifest/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
cp -r ../hobs-repo/android-native-assets/splash/* android/app/src/main/res/
cp -r ../hobs-repo/android-native-assets/icons/* android/app/src/main/res/
cp ../hobs-repo/android-native-assets/signing/hobs-release.keystore android/app/hobs-release.keystore
cp ../hobs-repo/android-native-assets/firebase/google-services.json android/app/google-services.json
cp ../hobs-repo/android-native-assets/mainactivity/MainActivity.java android/app/src/main/java/com/hobsfoundation/companion/MainActivity.java
cp ../hobs-repo/android-native-assets/alarm-feature/*.java android/app/src/main/java/com/hobsfoundation/companion/
cp ../hobs-repo/android-native-assets/alarm-feature/res-layout/activity_alarm.xml android/app/src/main/res/layout/activity_alarm.xml
cp ../hobs-repo/android-native-assets/build-config/app-build.gradle android/app/build.gradle
# then bump versionCode/versionName above whatever was ACTUALLY last shipped -- do not trust
# the value already sitting in this repo's app-build.gradle to be current. Real, confirmed
# incident (Aug 26, 2026): the repo had versionCode 35/"3.15" while the real installed app was
# already at versionCode 55/"3.35" -- 20 versions of undocumented drift from builds that were
# never persisted back here. Building versionCode 36 on top of that stale baseline produced a
# genuine downgrade, which Android's installer silently refused ("package appears to be
# invalid"). Verify the TRUE current version first, every time, with:
#   select max(app_version_code), max(app_version_name) from profiles;
# (the app reports its own real installed version here via Capacitor's App.getInfo() on every
# session -- this is ground truth, the repo's file is not) -- then bump strictly above that.
npx cap sync android
```
Also need a real Android SDK + JDK 21 in the environment (`apt-get install openjdk-21-jdk-headless`,
plus `sdkmanager` for `platform-tools`, `platforms;android-36`, `build-tools;34.0.0`) — these are
tooling, not project assets, and are expected to need reinstalling after any environment reset;
they were never meant to be persisted the way the files above are.

Build: `cd android && ./gradlew assembleRelease`. **Always verify the output**:
`apksigner verify --print-certs` and confirm the SHA-256 matches §2 exactly, and
`aapt dump badging` to confirm package name/version — before ever telling Akash a link is ready.

---

## 6. The real safeguard against silent gaps

`deployment/verify-before-deploy.sh` exists specifically because the keystore, the manifest,
`package.json`, the signing config in `build.gradle`, `google-services.json`,
`MainActivity.java`, `capacitor.config.ts`, and every web image were each found missing
separately, reactively, after something had already broken for Akash — the same root cause
every time: something the app needs that was never verified to exist before shipping. Run it
before every deploy. It is not exhaustive (it doesn't know about a file until it's added to the
script), but it catches everything it currently knows to check, automatically, every time.

**Known, accepted gap this script will always flag**: `calmroom-bg.jpg` is referenced in
`index.html` but doesn't exist as a real file. Per Akash's explicit instruction, leave this as
the one exception — do not "fix" it by removing the reference or generating a placeholder.

---

## 7. Full bug history and standing lessons

**Do not skip this.** `docs/BUG_LOG.md` (check its own line count/entry numbers directly -- do
not trust a specific number written here, it goes stale fast) contains detailed,
real, root-caused bug entries plus a running list of standing lessons at its top. Reading it in
full before starting work is the single highest-leverage thing a new session can do — several of
the bugs in it were caused by not knowing something an earlier entry in the same file already
established.

The single most important recurring theme across nearly all of them: **something the app needs
was never verified to exist before shipping** — a keystore, a config file, an image, a native
manifest setting. The fix each time was the same shape: find the real gap, persist the missing
thing permanently (not just fix it once), and where possible, build an automated check so the
same class of gap can't recur silently (§6).

---

## 8. Current, real, open items

See `docs/PROJECT_STATUS.md` for the maintained, current list. As of this writing, the real
open items are:
- 12 real testers x 14 consecutive days on Play Store closed testing, before a production-track
  submission is possible (org account issue itself is resolved -- see `docs/PROJECT_STATUS.md`).
- Lawyer review of the Terms of Service liability section — still not done.
- Real streaming for Bob's replies (perceived response speed) — raised repeatedly as a real
  concern, explicitly not started pending explicit go-ahead given the real scope of the change.
- The Bob Intelligence Architecture plan (`docs/BOB-INTELLIGENCE-ARCHITECTURE-PLAN.md`) — fully
  sequenced, not yet started; Phase 1 (Personal Grounding, the real hallucination safeguard) is
  the next real piece of work agreed on.
- Whether the crisis-detection threshold should be more conservative than the strict clinical
  definition of passive ideation — a real, open values question, not yet answered.
- Kunnu, Po, Cookie — hidden (not deleted), awaiting the same depth of character work Bob has
  now received before returning to the app. See §9 below — this is a real reversal from an
  earlier version of this document.

---

## 9. Character AI — current, real status (this is a real reversal from an earlier version of this document)

**Earlier versions of this file said character-chat-reply was "not to be built further without
asking." That is no longer true, and has not been true since Sept 15-16, 2026.** Bob's character
system received a full, real build across those two sessions: permanent cross-session memory,
real-time significance flagging, guaranteed recall, real semantic search, weekly memory
extraction, crisis escalation to a real professional, tiered psychoeducation, and a real,
extensively-tested character voice (see `docs/BOB-COMPLETE-TECHNICAL-AND-CHARACTER-DOC.md` for
the complete, current technical and character documentation, written directly from the live
code). This is now a real, core, live part of the app, not a paused feature.

**What's still true**: Kunnu, Cookie, and Po are currently fully hidden from every UI entry point
and every internal routing path — Bob currently handles everything, per direct instruction ("we
are keeping Bob for everything... all other mascots will be completely removed. We will add them
later"). Their markup and backend character definitions are kept intact, not deleted, for when
they're built out with the same depth Bob has now received. Do not build these three further
without asking first — that specific caution still holds, just no longer for Bob.
this feature on your own initiative.

---

## 10. WhatsApp Business API (Cloud API) — real, current status (new Sept 27, 2026)

**Live facts**: registered number **+91 94262 12083**, Phone Number ID `1347122808487896`, under
WABA `2585366201875184` ("Home of Beautiful Souls Foundation"), Meta App ID `2627243291067381`
("HOBS Companion App"). All 8 real templates are `APPROVED` on this WABA: `hobs_sos_alert`,
`hobs_professional_assigned`, `hobs_appointment_update`, `hobs_missed_appointment`,
`hobs_payment_update`, `hobs_disconnect_request`, `hobs_agreement_signed`, `hobs_system_alert`
(exact param order for each is in the WABA itself -- query
`GET /{waba_id}/message_templates` rather than trusting a stale copy of this list).

**Real incident, resolved**: the number was originally registered under a *different* WABA
(`2585366201875184`, new) than the one holding the already-approved templates
(`1101168369517284`, old "Test WhatsApp Business Account") -- templates don't carry across WABAs.
Fixed by recreating all 8 templates fresh under the new WABA (all approved). The old WABA/test
number (`+1 555-194-7836`) still exists and still works -- useful as a known-good control when
diagnosing delivery issues on the real number.

**Real incident, resolved**: for roughly the first two hours after registering, the API accepted
every send (`200`, real message ID, `message_status: accepted`) but Meta's own analytics
(`GET /{waba_id}?fields=analytics...`) showed **zero** sent/delivered the entire time, and the
recipient never received anything -- root-caused, via that direct analytics query (not
speculation), to the number's `quality_rating: UNKNOWN` warm-up/probation period that a brand-new
Cloud API number goes through, during which Meta can silently hold sends with no error surfaced
anywhere in the API response. **Resolved itself after ~2 hours with zero intervention** --
confirmed via a real delivered message. **Standing lesson**: if a freshly registered number's
sends are all `accepted` but nothing arrives and analytics shows 0, this is very likely the same
thing -- check Meta's analytics directly rather than assuming a config problem, and give it real
time before escalating.

**What's actually built and wired**:
- Generic sender: `send-whatsapp-template` Edge Function (see §4).
- One real trigger live in production: Postgres trigger `notify_professional_assigned` on
  `public.profiles`, fires when `assigned_therapist_user_id` / `assigned_psychiatrist_user_id` /
  `assigned_doctor_user_id` / `assigned_caregiver_user_id` changes to non-null. Sends
  `hobs_professional_assigned` to the **client** (not the professional, not admin). Confirmed
  live and delivered.
- Phone number data safeguard, permanent, DB-level: `public.is_valid_wa_phone(text)` requires
  `+91` + a real 10-digit Indian mobile pattern (starts 6-9), rejects all-identical-digit numbers
  and known dummy sequences (`9876543210` etc). Enforced via CHECK constraints
  `profiles_phone_number_valid` and `profiles_emergency_phone_valid` on `public.profiles` --
  confirmed by testing that a fake number write is actually rejected by Postgres itself, not just
  filtered by application code. Existing data was normalized (bare 10-digit numbers got `+91`
  prepended); two fake numbers on test-only accounts were nulled.
- Secrets used, values intentionally not recorded here per §2 policy: `WHATSAPP_ACCESS_TOKEN`,
  `WHATSAPP_PHONE_NUMBER_ID` (Supabase Edge Function secrets, production project). Note:
  `WHATSAPP_ACCESS_TOKEN` needs periodic manual rotation via the WhatsApp Manager API Setup page
  -- if sends start failing with a permission/access error, this is the first thing to check.

**Explicitly NOT built yet — real, current gaps**:
- Admin (Akash, `+91 8320470976`) does not get notified of anything yet. Requested Sept 27,
  2026: a WhatsApp message to admin whenever a client books an appointment, a client or
  therapist cancels, or a crisis is flagged. Not started. Relevant tables: `expert_bookings`
  (status values `active`/`pending`/`cancelled`) for booking/cancel events; crisis flag lives on
  `test_results` (`elevated`, `self_harm_flagged`) -- read the existing `check-journal-risk`
  function first before wiring anything on top, to avoid duplicating its logic.
- The other 7 approved templates beyond `hobs_professional_assigned` are not wired to anything.
- The SOS button's emergency-contact-reaching mechanism decision (see `PROJECT_STATUS.md`) can
  now realistically use this Cloud API setup instead of treating it as a future hypothetical --
  the plumbing genuinely exists now. Still needs the actual SOS-button UI/trigger built and a
  real decision on exactly who receives `hobs_sos_alert` and when.
- Whether client-facing UI should surface a therapist's own WhatsApp number to the client
  directly (e.g. a tap-to-chat link) -- raised, explicitly deferred by Akash, not built.

---

## 11. Standing safeguard against session-reset drift (new, Sept 27, 2026)

**Why this section exists**: a real, repeated failure mode across this project's history --
a new chat/session relies on stale summaries, an outdated handoff zip, or its own memory of a
prior session instead of the actual live repo/database/deployed functions, and reports something
false as a result. This happened again this same day: an uploaded handoff zip and this file's own
function table were both stale in different ways, and got caught only by directly diffing live
Supabase state against both. The fix is not "try harder to remember" -- it's structural.

**The actual structural safeguard, now in place**: a `CLAUDE.md` file at the repo root. Any
Claude Code session with this repo attached loads it automatically, without needing to be told,
before doing anything else. It exists specifically so a session reset, a new chat, or a
completely fresh sandbox cannot silently skip this file the way a plain markdown doc buried in
`docs/` can be skipped. If you are reading this section but never saw `CLAUDE.md` load
automatically, something about how this repo was attached is non-standard -- read
`/CLAUDE.md` directly before continuing.

**The standing rule `CLAUDE.md` enforces, restated here so it survives even if that file is ever
lost**:
1. Read `docs/MASTER.md` (this file), `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` in full,
   every session, before making any claim about current app state -- never from memory of a
   previous session, never from an uploaded zip or doc without first checking it against the
   live repo/database/deployed functions.
2. A zip, PDF, or doc a person uploads may be older than the live repo. Treat the live repo,
   live Supabase project, and live deployed Edge Functions as ground truth over any uploaded
   file, any chat summary, and any memory of a prior session -- always diff before trusting.
3. Never state something is built, fixed, live, or working without showing the actual
   verification in the same message (a real query result, a real deployed-function list, a real
   log line) -- see §12 (formerly §12, "Standing communication preferences," renumbered below).
4. Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
   describing real work on this app ends -- not "next session," not "later."
5. Periodically re-audit: list every Edge Function actually deployed (`GET
   /v1/projects/{ref}/functions` via the Supabase Management API) and diff it against both this
   file's §4 table and the repo's `supabase/functions/` directory. The Sept 27, 2026 audit alone
   found 4 real undocumented live functions, 2 live unauthenticated functions that should have
   been deleted after one-time use, one function with no source control backup at all, and one
   stale provider name. Assume more exist until a clean audit says otherwise.

---

## 12. Standing communication preferences (do not relearn these either)

- Short messages. No long paragraphs unless explicitly asked for detail.
- Ask before anything consequential or hard to reverse — a real yes/no question, and wait for a
  real answer, not an implied one.
- Verify claims with real data (query the actual database, run the actual test, check the actual
  compiled output) rather than reasoning from code alone — many real bugs this session were only
  found this way, and several "fixes" that looked correct on inspection turned out not to hold
  until tested against real, live data or a real device.
- When something is fixed, say plainly what was actually wrong and what changed — no vague
  reassurance, no claiming something is resolved without having verified it.
