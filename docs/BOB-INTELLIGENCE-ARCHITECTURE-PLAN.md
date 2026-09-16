# Bob Intelligence Architecture — Plan of Action
Written Sept 16, 2026. This is a real, sequenced plan, not a speculative wishlist -- each phase
is justified by an actual, observed real need (a real hallucination, a real memory-confidence
gap, a real regression risk), not built ahead of evidence. Phases are ordered so each one is
independently shippable and independently useful, even if work stops after any of them.

The permanent principle underneath all of this, per direct instruction: **Bob can interpret, but
Bob cannot fabricate.** Every phase below serves that principle without flattening Bob's actual
character into something generic, clinical, or robotic.

---

## How to read this plan

Each phase has: what it builds, why it's needed now (not hypothetically), a real, honest time
estimate, and what "done" looks like -- a concrete, testable outcome, not a vibe. Phases are
ordered by real priority: the thing with the most real, demonstrated risk right now comes first.
Later phases are real and worth doing, but nothing here is built speculatively ahead of the phase
that actually needs it.

---

## Phase 0 — Foundation (near-zero cost, do first, unblocks everything else)
**Time: a few hours, same session as Phase 1.**

Before writing any grounding logic, give the long-term architecture a real home so nothing built
from here on is a one-off patch:

- Extract Bob's current, live character prompt into a standalone, versioned file:
  `docs/BOB-IDENTITY-SPEC.md`, tagged `v1.0`. This becomes the source of truth the actual prompt
  is built from, and the thing every future change gets diffed against.
- Create the real module structure the rest of this plan builds into:
  `supabase/functions/_shared/response-integrity/` with subfolders reserved for
  `personal-grounding/`, `safety-review/`, `knowledge-grounding/`, `character-check/` -- only
  `personal-grounding/` gets real code in Phase 1; the others stay empty until their own phase.
- Rename the existing crisis classifier's conceptual home to `safety-engine/crisis-detection` in
  documentation (no functional code change) so it's clearly understood as one module of a larger
  Safety Engine, not a one-off feature.

**Done when**: the identity spec exists as its own versioned file, and the folder structure exists
for the Response Integrity Engine, even though most of it is still empty.

---

## Phase 1 — Personal Grounding Module (the real, current need)
**Time: 1 real, focused build session.**

This is the actual fix for the hallucination already confirmed in real testing (the invented
"note"). Everything here was already scoped in the earlier conversation -- this phase is that
scope, formally placed as the first real module of the permanent engine, not a throwaway patch.

Build:
- A cheap, local pre-router: does Bob's generated reply *look like* it's making a personal-fact
  claim about the user (a name, an event, a specific detail stated as known)? If not, skip
  verification entirely -- this is what keeps ordinary short, warm replies exactly as fast as
  they are today.
- For replies that do route through: a real grounding check, classifying each claim as FACT
  (must be grounded in the real conversation/memory supplied), INFERENCE (fine if expressed with
  real uncertainty, not asserted as known), or CREATIVE (no check needed).
- On a FACT that isn't grounded: one real regeneration attempt, explicitly instructed to remove
  only the unsupported claim while preserving Bob's actual voice, warmth, and brevity.
- If regeneration still fails: a short, honest, Bob-voiced fallback ("I don't want to guess at
  that, chief -- tell me more?") -- never a generic error, never exposing that a check happened.
- Structured failure logging (what kind of claim, what category) -- enough to actually learn from
  later, without over-storing sensitive conversation content.

**Done when**: verified against a real, deliberately adversarial test set (see Phase 2) with a
measured false-negative rate, not just "it caught the one example we already knew about."

---

## Phase 2 — Measurement, before building anything else
**Time: 2-3 real sessions.**

Per the real, fair critique already raised: no claiming this "catches most hallucinations"
without an actual number. Before Phase 3 gets built at all, build a small, real benchmark and
find out if Phase 1 is actually working.

Build a **Bob Grounding Test Set** -- not the full 20-category evaluation lab from the long-term
architecture, just enough real adversarial cases to measure Phase 1 honestly:
- Memory traps (a fact the user never stated)
- Similar-person traps (attributing one person's statement to another)
- False-memory prompts ("remember when I told you..." when no such memory exists)
- Contradiction traps (user said two different things at two different times)
- Emotional-inference traps (a feeling stated as certain fact, not inference)

Run Phase 1 against this set. Measure: false negatives (missed hallucinations), false positives
(flagged something that was actually fine -- this is the real risk to Bob's character), added
latency, regeneration success rate.

**Done when**: real numbers exist for all four, and a real decision gets made -- is Phase 1 good
enough as-is, does it need tuning, or does the false-positive rate mean it's quietly flattening
Bob's real voice and needs to be loosened.

---

## Phase 3 — Response Safety Review Module
**Time: 1-2 real sessions, only after Phase 2's numbers are in.**

A real, distinct gap: the existing crisis classifier checks the *incoming* message for risk.
Nothing currently checks whether Bob's own *outgoing* reply is actually safe -- a good-faith
reply generated under unusual context could still say something it shouldn't (encouraging
dependency, sounding like a diagnosis, false reassurance on something serious).

Build a second, cheap, targeted check -- same pre-routing philosophy as Phase 1 (most replies
skip it), watching specifically for: diagnostic-sounding language, dependency-reinforcing
language ("you don't need anyone else," etc.), dangerous or discouraging advice, false
reassurance on something that sounded genuinely serious.

**Done when**: verified against a small, real adversarial set built the same way as Phase 2, with
the same honest measurement discipline.

---

## Phase 4 — Memory Confidence & Staleness
**Time: 2-3 real sessions.**

A real, legitimate gap in the current memory system: significant memories are stated as flat,
permanent fact, with no notion that something true three months ago might not be true now
("I hate my job" shouldn't become an eternal, confidently-restated fact).

Build:
- A lightweight type + confidence + last-confirmed timestamp on significant memories (not a full
  memory rewrite -- an addition to what already exists).
- Update the guaranteed-recall injection so aging memories get framed with real, appropriate
  uncertainty ("you'd mentioned feeling stuck at work before -- is that still where you're at?")
  rather than restated as current fact.

**Done when**: verified with a real test -- an old significant memory, re-surfaced, correctly
phrased as a check-in rather than an assumption.

---

## Phase 5 — Bobness Regression Suite
**Time: 1-2 real sessions, ongoing use after that.**

The real, necessary counterweight to everything above: a safety system that quietly turns Bob
generic is its own real failure. Build a small, real set of test cases specifically checking that
Phases 1 and 3 haven't flattened his character -- short-response preservation, "chief" used
rarely and correctly, no therapist-speak, real silence where silence fits, no unnecessary
questions tacked onto every reply.

Run this suite against any future change to Bob's prompt, the grounding module, or the safety
module -- a real gate before anything ships, not just a one-time check.

**Done when**: the suite exists, runs against the current live prompt as a baseline, and passes.

---

## Deferred, real, but not yet justified by observed need
These are genuinely good ideas from the long-term architecture discussion. They're deferred, not
rejected -- each one gets its own real plan, written when there's an actual, observed reason to
build it, not speculatively ahead of that:

- **External knowledge grounding** (medical/clinical fact-checking) -- a real, separate project,
  needed once Bob is actually fielding factual health questions often enough to justify it.
- **Dependency detection as its own module** -- Phase 3's safety review covers the most acute
  cases; a dedicated module is worth it once there's real evidence of a real pattern.
- **Cross-conversation pattern-noticing** -- already flagged as its own, separate, later decision
  before this document existed; stays that way.
- **Full 20+ category Bob Evaluation Lab** -- Phases 2 and 5 are the real, right-sized version of
  this for now; the full lab is worth building once there's more real, running history to learn
  from.
- **Identity versioning tooling** (formal `v1.1`, `v1.2` diffing) -- Phase 0 creates the versioned
  file; real tooling around it is worth building once there have been a few real version bumps
  to learn the right process from, not before.

---

## What this plan deliberately does NOT do
It does not scaffold the Knowledge Engine, the full Memory Engine, or the Evaluation Lab ahead of
real need, even though the long-term architecture names all three. Nearly everything that's
actually worked well in this project so far came from shipping something real, hitting a real
failure in real testing, and fixing that specific thing -- not from building ahead of evidence.
This plan follows that same discipline at a larger scale, not a different one.
