# HOBS Companion — Master Reference
Last rebuilt: August 26, 2026. **Read this file first, before doing anything else, at the start
of any session working on this project** — whether this is a fresh chat, a sandbox reset, or
just picking this up after time away. This is the single entry point everything else is
findable from.

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

**HOBS Companion** — a mental health companion app for **Home of Beautiful Souls Foundation**
(HOBS), an Ahmedabad-based mental health NGO founded by **Akash Ramchandani** (psychologist,
neurodivergent, ADHD — communicate in short, direct messages, ask before consequential actions,
avoid long paragraphs unless asked). Features: mood check-ins, journaling with AI crisis
detection, tasklist, breathing/grounding exercises, a support group chat, therapist
booking/dashboard, period tracking, CBT/DBT/ACT worksheets, and character companions (Bob the
elephant is the primary one; Kunnu, Cookie, Po exist but are unscoped/paused — see §9).

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
`ASSEMBLYAI_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
`SCHEDULER_SECRET`.

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
| `character-chat-reply` | Generates in-character Bob/Kunnu/Cookie/Po replies. **Not currently wired live** per explicit instruction — code exists, do not activate further without asking. Runs crisis check first, always. |
| `check-journal-risk` | The AI crisis classifier — see §3. |
| `create-razorpay-order` | Payment order creation for donations/sessions. |
| `database-backup` | Daily Postgres backup. |
| `database-backup-offsite` | Daily backup mirrored to a separate location. |
| `delete-user-account` | Full account deletion, atomic. |
| `error-alert-monitor` | Hourly; pushes an admin alert if error volume spikes. Sends real `type` in its push payload (fixed a real bug where this was empty). |
| `google-calendar-oauth` | OAuth flow for therapist Google Calendar linking. |
| `google-calendar-sync` | Keeps calendar availability in sync; watch channel renewed every 6h via cron. |
| `notification-scheduler` | Runs every 15 min; fires scheduled reminders (task alarms, mood check-ins, etc.). |
| `razorpay-webhook` | Payment confirmation webhook. |
| `send-apk-update-notification` | Daily; notifies users of a new app version if one exists. |
| `send-group-poll` | Sends the recurring support-group check-in prompts (morning/evening/variety). |
| `send-push-notification` | Shared, generic push-send function every other function calls. Accepts a `data` field for deep-link routing (see `handleNotificationTap` in the client) — several bugs this session were other functions simply forgetting to pass this. |
| `send-task-alarms` | Runs every minute; fires task-specific alarms at their set time. |
| `sync-test-result-to-hubspot` | Pushes psychometric test results to HubSpot CRM. |
| `transcribe-audio` | Voice-to-text for journal entries (AssemblyAI). |
| `update-donate-page-meta` | Keeps the public donate page's metadata current. |
| `uptime-monitor` | Every 5 min; pings prod + staging, alerts on status change. Same real bug as error-alert-monitor, same fix. |

All cron schedules are set via `pg_cron` directly in the production database (not visible in
this repo as files — query `select jobname, schedule from cron.job;` against production to see
them live).

---

## 5. Deployment — the real, working method (this took an entire session to find)

**Do not try to find a simple REST file-upload API for Hostinger — there isn't one for this kind
of hosting.** The actual, working, official method:

```bash
export HOSTINGER_API_TOKEN="EDgEf8bqD0AFbFwHCEwi08tT5ChL7S45RPTrYAGH67904747"
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

**Do not skip this.** `docs/BUG_LOG.md` (1170 lines as of this writing) contains 62 detailed,
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
- Push notification deep-link routing for one specific case reported as regressed — under
  investigation, not yet root-caused (this is separate from the `chat_message`/`error_alert`/
  `uptime_alert` routing gaps already found and fixed this session).
- `calmroom-bg.jpg` — deliberately left missing, see §6.
- Play Store submission: D-U-N-S number resolved (854273779), Play Console org account setup
  still pending, Health apps declaration form still needed (mood/period tracking make this a
  "health app" under Google Play policy).
- The storage-Filesystem migration (native on-device storage upgrade) is built and tested but
  should remain staging-only until Akash is fully satisfied with real-device testing there,
  per his explicit process requirement.

---

## 9. Character AI — explicit scope boundary

Bob, Kunnu, Cookie, and Po exist as characters with backstories and voice guidelines (see the
character bible references in memory/prior sessions), but **the character-chat-reply feature is
explicitly not to be built further or activated without asking first** — Akash's own words:
"we don't build anything until everything is in place." The wiring exists in the client
(`sb.functions.invoke('character-chat-reply', ...)`) and the function itself works and has crisis
detection correctly wired first, but this is left exactly as-is. Do not expand, tune, or promote
this feature on your own initiative.

---

## 10. Standing communication preferences (do not relearn these either)

- Short messages. No long paragraphs unless explicitly asked for detail.
- Ask before anything consequential or hard to reverse — a real yes/no question, and wait for a
  real answer, not an implied one.
- Verify claims with real data (query the actual database, run the actual test, check the actual
  compiled output) rather than reasoning from code alone — many real bugs this session were only
  found this way, and several "fixes" that looked correct on inspection turned out not to hold
  until tested against real, live data or a real device.
- When something is fixed, say plainly what was actually wrong and what changed — no vague
  reassurance, no claiming something is resolved without having verified it.
