# HOBS Companion — read this before doing anything else

This file loads automatically for any Claude Code session with this repo attached. It exists
because relying on a session remembering to read the docs, or trusting a chat summary/uploaded
zip over live state, has caused real, repeated problems in this project's history (see
`docs/BUG_LOG.md` #98-107). Follow this before making any claim or change.

## Before doing anything else, this session

1. Read `docs/MASTER.md` in full. It is the single entry point and links to everything else.
2. Read `docs/PROJECT_STATUS.md` for what's currently open.
3. Read `docs/BUG_LOG.md` in full, including the standing lessons at the end — several real bugs
   in this project's history happened because an earlier entry in this same file was skipped.

## Standing rules (restated from `docs/MASTER.md` §11-12 — read those for full context)

- **Live state beats everything else.** An uploaded zip, a chat summary, or memory of a previous
  session can all be stale. The real repo, the real Supabase project, and the real deployed Edge
  Functions are ground truth — diff against them before trusting anything else, every time.
- **Never state something is built, fixed, live, or working without showing the actual
  verification in the same message** — a real query result, a real deployed-function list, a
  real log line. Not a plausible-sounding claim.
- **Ask before anything consequential or hard to reverse** — a production write, a deploy, a
  database change, deleting a deployed function. Investigation and read-only checks don't need
  this; the actual write/deploy/delete step does.
- **Update `docs/MASTER.md`, `docs/PROJECT_STATUS.md`, and `docs/BUG_LOG.md` before a session
  describing real work on this app ends.** Not "next session." This file only helps if those
  three stay current.
- **Log every real change to `docs/BUG_LOG.md` as it happens, in the same turn it's made — not
  batched for the end of the session.** Akash asked for this explicitly (Sept 29, 2026, see
  BUG_LOG #110-113 and the standing lesson under them) after several real fixes in one session
  went unrecorded until he had to ask. For each real change: what changed, in which file/system,
  and exactly what it did or fixed — the same format the existing numbered entries use. This
  covers code changes, config/database changes, and deploys — not read-only investigation.
- Communication: short, direct messages. No long paragraphs unless explicitly asked for detail.
  Akash (the founder) is neurodivergent (ADHD) and has said this explicitly, more than once.

## Periodic Edge Function audit

Compare, directly, on a regular basis: (a) every function actually deployed
(`GET /v1/projects/{ref}/functions` via the Supabase Management API), (b) every function in
`supabase/functions/` in this repo, (c) every function listed in `docs/MASTER.md` §4. The
Sept 27, 2026 audit alone found 4 undocumented live functions, 2 live unauthenticated
"temporary" functions that should have been deleted, one function with no source-control
backup, and one stale provider name. Do not assume a clean state — check it.
