# Bob: Memory, Safety & Psychoeducation — The Precise Build Spec
Compiled Sept 15, 2026. This is the single source of truth for everything decided in this
session. Read this in full before writing any code for any of these features. If anything below
seems to conflict with something already built, STOP and check with Akash before proceeding --
do not silently resolve a conflict by guessing.

---

## PART 0 — What is already built, deployed, and verified. DO NOT CONTRADICT ANY OF THIS.

These are live, tested, and confirmed working. Building the features below must never change
any of this behavior:

- **"Chief" is primarily how Bob addresses people** -- his natural default. The person's real
  first name is what he reaches for in specific situations instead (a quieter/tender moment, or
  someone who responds better to their name). These are NEVER combined into one address like
  "chief [name]" -- each moment gets one or the other, never both jammed together.
- **Only the first name is ever used**, regardless of what's actually stored in the profile
  (e.g. "Akash Ramchandani" in storage → only "Akash" is ever used). Extracted server-side.
- **Bob never shares about himself.** Handles silence by naming it, not filling it. Has a real
  boundary-assertion template for when something's outside what he can hold. Has real, varied
  closing patterns based on what was actually said.
- **The opening greeting is fully instant** -- zero network call, zero AI generation, a
  hard-wired rotating template pool (`BOB_GREETING_TEMPLATES_NO_TASKS` in index.html). This is
  deliberate and must stay this way -- do not make the opening greeting depend on any network
  call again, including anything built below (search, recall, significance-checking). Anything
  built below applies to REPLIES during an actual conversation, never the opening line.
- **The chat modal auto-opens** on the real "app just opened" moment (dismissing the welcome-back
  screen), once per open, guarded against double-firing.
- **Explicit close button** generates a real, content-aware closing via the `mode: 'closing'` API
  (or a plain fallback if nothing was said) before the modal actually closes.
- **Kunnu, Po, Cookie are hidden** from all UI entry points until they get the same depth of
  work Bob has. Markup kept intact, not deleted.
- **The `character_messages` table exists in production** (columns: id, user_id, character,
  role, text, created_at; RLS scoped to the owning user). **STATUS TO VERIFY BEFORE BUILDING
  ANYTHING ELSE**: backend code was written to read recent history from this table and persist
  every real exchange to it, but this may not have actually been deployed/tested before the
  session moved on to designing compression. Confirm this is genuinely live and working, with a
  real test, before building anything that depends on it (search, significance-flagging, and
  extraction all depend on this table being genuinely populated).

---

## PART 1 — Memory architecture (in-conversation + cross-session + recall)

### 1.1 Storage — locked, unconditional
Every message, both sides, gets saved to `character_messages`, permanently. No pruning, no
exceptions, regardless of anything below.

### 1.2 What Bob actively sees per reply (three real sources, all guaranteed)
1. **The most recent 40 messages** for this user+character (already built, per Part 0 -- verify).
2. **Every message ever flagged significant** (see 1.3), regardless of age -- included on
   *every single reply*, not just when directly relevant. This is what "guaranteed recall" means
   -- it is not conditional, not probabilistic, always present.
3. **Real search results**, when the person's current message seems to reference something not
   already covered by #1 or #2 (see 1.4).

### 1.3 Real-time significance flagging
Runs on every message, the moment it's sent (both user and Bob's own messages are eligible to be
flagged). This is a REAL, additional API call -- confirmed with Akash that this has a real,
non-zero recurring cost (Groq: $0.075/1M input, $0.30/1M output on the current model; a genuine
free tier exists up to 1,000 requests/day, but this call multiplies total request volume, so
usage should be monitored against that free-tier ceiling).

**Flag criteria (grounded in real research, not vague "sounds emotional" -- confirmed with
Akash)**: flag a message significant if it shows genuine emotional salience, specifically:
- **A first-time disclosure** -- a name, a fear, an experience never mentioned before in this
  person's history with Bob.
- **Anchored to something specific** -- a named person (especially family -- clinically
  confirmed as disproportionately significant in real therapeutic disclosure research), a
  specific event, a specific detail. Not a vague, floating feeling with no anchor.
- **Genuine emotional charge**, not neutral information.
- **A realization or shift** -- a moment where something actually changed for them, not just a
  status update.

Implementation: add a `is_significant boolean default false` column to `character_messages`.
The real-time classifier call sets this at write time.

### 1.4 Real search (semantic, not just keyword)
When someone's current message seems to reference or recall something from earlier that isn't
already in the 40-message window or the significant-flags set, Bob should be able to search his
own real, full history and find it by meaning (so "my mother" and "mom" both surface the same
memories), not just exact keyword matches.

**Efficiency, confirmed with Akash**: reuse the SAME real-time significance-classifier call to
also detect "this message seems to be referencing something earlier" -- one classifier doing two
jobs, not two separate API calls per message.

**The recall indicator, confirmed with Akash, grounded in real research**: when a search is
actually happening, do NOT show a generic "..." typing indicator. Real research finding
(Perplexity's own design principle): show what's actually being recalled, not a vague loading
state. Bob's version: something short, specific, in his own voice -- e.g. "Looking back at what
you told me about..." -- not a system-style loading message. This is allowed to take a normal
conversational beat (unlike the opening greeting, this happens mid-conversation where some real
wait is already expected and a typing indicator is already normal).

### 1.5 Extraction (NOT compression -- this distinction is real and locked)
Ordinary, non-flagged content that has aged out of active use gets **extracted**, not
abstractively summarized. Real quotes, names, specific instances, and keywords are preserved
verbatim. Only genuine filler and redundant back-and-forth gets trimmed. If in doubt whether
something is "filler" or "substance," treat it as substance and keep it.

- **Eligibility**: a message becomes eligible for extraction once it (a) has fallen out of the
  active 40-message window, AND (b) is at least one week old. Both conditions required.
- **Cadence**: the extraction job runs weekly.
- **Never touches flagged-significant messages** -- those stay verbatim forever, unconditionally,
  regardless of age.
- **Output shape**: a structured record, not a single free-form paragraph -- explicit fields for
  verbatim key quotes, named entities/specific things mentioned, and the core topic. Not a
  vague gist.

### 1.6 Pattern-noticing — explicitly separate, not part of this build
Bob noticing on his own that something is a recurring pattern across conversations (distinct
from search, which only finds things when directly asked/referenced) is a genuinely different
capability. Confirmed with Akash: this is its own, separate, later decision -- not scoped here,
not to be quietly folded into search or into the psychoeducation system below without an
explicit, separate conversation about it first.

---

## PART 2 — Crisis content escalation to a real professional

**Status: fully decided, zero code written. Likely the single most safety-critical gap in this
entire list.**

If a conversation with Bob contains emotional distress, self-harm, or suicide signals, this gets
flagged to the person's assigned professional (or an admin if none assigned yet) -- with the
**exact raw content**, never a paraphrased summary, so nothing is softened or lost in translation
on the way to someone who can actually help.

Consent for this automatic flag-sharing is handled once, at sign-up, as part of the app's real
consent flow -- never renegotiated mid-conversation, which would be both clinically wrong and a
bad experience in a moment that's already hard.

**Real, existing infrastructure this connects to**: the crisis classifier already built into
`character-chat-reply` (`riskDetected`) already runs on every message. This part is about what
happens AFTER `riskDetected: true` -- currently nothing beyond showing the person crisis
resources client-side. The actual professional-notification pipeline does not exist yet.

---

## PART 3 — Tiered psychoeducation / referral system

**Status: fully designed, zero code written.**

### Settled shape
- Any death/self-harm language -- passive or active -- keeps using today's existing immediate
  helpline modal, completely unchanged. This new system is additive, not a replacement.
- A new, separate tier: non-death depression/anxiety signals, tracked the moment they appear in
  a journal entry, no minimum count/repetition threshold.
- Comorbidity: depression + anxiety together → suggest BOTH PHQ-9 and GAD-7 (real, existing
  validated instruments already in the app). Messier combinations (burnout, exam stress) →
  nudge toward a professional generally + whichever single existing test best fits the dominant
  signal, rather than building precise matching logic for every combination.
- Delivery: the existing `renderMascotTip` dismissible-card system, already used elsewhere (e.g.
  elevated test results) -- a new flag is just a new tip ID. Shows once per fresh flag, then
  stays quiet about that specific flag until something new comes up. Never a repeating nag.
- Physical-health three-way routing, real clinical grounding already researched:
  - **GP**: fatigue+mood, palpitations+anxiety, poor concentration+tiredness --
    nutrient/thyroid-flavored language (Vitamin D → anhedonia/fatigue; B12 → depression/apathy/
    poor concentration; iron deficiency, even without anemia → attention/anxiety; thyroid
    dysfunction is a real, documented common misdiagnosis case).
  - **Psychiatrist specifically for sleep** -- ties to the existing PSQI test. Real reasoning:
    GP-prescribed sleep medication without treating the underlying cause is a documented
    dependency problem in India specifically.
  - **Therapist**: everything else emotional/behavioral, the default path.
- Bob delivers this in his own voice -- curiosity-led noticing and asking, never explaining
  clinical facts himself (would break his own "never diagnose" hard rule). Any actual
  informational content lives in the test itself, not in Bob's dialogue.

---

## BUILD SEQUENCE

Agreed: sequence by sequence, verifying each piece for real before moving to the next, not all
at once.

1. **DONE, verified.** Part 0's memory status -- confirmed the history read/persist code
   (written earlier but not yet deployed) is now live. Verified unambiguously: a separate API
   call correctly recalled a detail ("Bruno") given only in an earlier, independent message.
2. **DONE, verified.** Crisis escalation to professionals (Part 2). Added a real
   `assigned_therapist_user_id` link (replacing fragile name-matching). Real raw crisis content
   now reaches the assigned therapist, or every admin if none assigned, via the existing
   send-push-notification infrastructure. Found and fixed two real bugs during verification: an
   RLS-scoped admin lookup that silently found zero admins despite real ones existing, and a
   real gap where a crisis alert could vanish with zero trace if nobody reachable had a
   registered device (added a genuine, trusted-server-call-only bypass and always-log fallback).
   Verified end to end, both the assigned-therapist and admin-fallback paths, with real
   messages and real database checks.
3. **DONE, verified.** Real-time significance flagging (1.3). Added `is_significant` to
   `character_messages`, plus a classifier judging both sides of each exchange against the
   locked criteria (first-time disclosure, anchored to something specific, genuine emotional
   charge, a realization/shift). Verified with contrasting real messages -- correctly
   discriminated a genuine disclosure from ordinary small talk on both sides of the exchange.
4. **DONE, verified -- but the real path here matters, read this.** Guaranteed recall of
   flagged content on every reply. The first two implementation attempts both failed real
   testing (0/3, then 2/3) -- mixing significant content into the ordinary history array wasn't
   reliable, even explicitly labeled as "real memory." The working fix required TWO real
   changes: (a) surfacing significant content as its own explicit message positioned
   immediately before the current query, not earlier in the prompt (a real, known LLM
   attention/recency limitation, not something wording alone fixes), and (b) per direct
   instruction not to trade away Bob's natural tone for reliability, splitting recall into two
   genuinely separate steps -- a new, dedicated, temperature-0 `RECALL_MATCHER_PROMPT` runs
   first as a narrow factual matching task (does the current message relate to anything
   flagged?), and hands its CONFIRMED result to the main reply generation, which keeps its own
   full creative temperature completely untouched. Verified with 5 consecutive, properly-spaced
   real tests: 5/5 correct, zero errors, and confirmed the matcher does NOT force-inject
   unrelated content on unrelated questions. Real, disclosed limitation: recall is now highly
   reliable, not mathematically 100% guaranteed -- the underlying data is always 100% present
   (verified directly against the database every time), the tiny remaining variance lives in
   the main reply step's own natural-sounding generation, not in whether the fact was found.
   Real, separate bugs found and fixed along the way, not assumed away: the significance
   classifier (step 3) was silently failing on every call (`max_tokens: 200` far too small for
   a reasoning model -- fixed to match the crisis classifier's proven `max_tokens: 2000`), and
   a batch of "None" replies during testing traced to a real, confirmed Groq TPM rate limit from
   rapid-fire testing against an artificially large test conversation, not a logic bug.
5. **DONE (search itself), verified -- recall indicator still pending.** Real search (1.4).
   Groq offers no embeddings at all (confirmed via research) -- used Supabase Edge Functions'
   own built-in gte-small model instead, generating real embeddings locally with no new
   external API or key needed (confirmed working with a real isolated test before building on
   it). Enabled pgvector, added a real similarity-search Postgres function. Extended the
   existing recall-matcher to also detect, in the same call, whether the current message reads
   like a callback -- real search only runs when that fires and nothing was already found in
   the significant-memories list. One real bug found and fixed: the first version of the
   callback-detection prompt was too vague and missed its own designed examples -- fixed with
   concrete positive/negative examples, confirmed via direct diagnostic. Verified end to end:
   established an ordinary, non-significant detail via real conversation, aged it out of the
   active window, confirmed 3/3 real replies correctly used it via genuine search, and
   confirmed a genuinely unrelated question triggered no false match.

   **The recall indicator was resolved with a real, deliberate design decision, not the
   streaming architecture originally considered**: per direct instruction, real mindful-pause
   text (in Bob's own voice, two anchor lines given directly, rotating so it's not identical
   every time) now replaces the plain "..." everywhere Bob pauses -- but it shows the SAME way
   every single time, never tied to whether a real lookup is actually happening. This was a
   real safety decision: text that only appeared during genuine recall would mean the pause
   looks different specifically at the moments something is being recalled, which could land on
   someone's most vulnerable message. A consistent pause avoids that, and keeps the original
   speed goal intact -- no streaming, no second round trip needed. No animation (explicitly
   rejected -- "not doing meditation in between of a conversation"). Also strengthened: when
   Bob has a confirmed recall, he's now explicitly instructed to name it ("I remember you
   telling me...") rather than quietly working it in. Verified both pieces with real tests.
6. **NOT STARTED.** Weekly extraction job (1.5).
7. **NOT STARTED.** Tiered psychoeducation system (Part 3).

Each step: build, deploy, verify with a real test against real data, confirm with Akash, THEN
move to the next. Never batch multiple unverified pieces together.
