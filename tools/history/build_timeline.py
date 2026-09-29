#!/usr/bin/env python3
"""
Rebuilds the merged, time-sorted reading timeline of HOBS Companion app chats
from a claude.ai data export (conversations-000.zip -> conversations.json).

Written Sept 29, 2026 for the full history reconstruction (docs/HISTORY.md,
progress tracked in docs/HISTORY_PROGRESS.md). Deterministic: same input always
produces the same chunk numbering, so a session that resumes after a reset can
rebuild the chunks and continue at the exact chunk recorded in the progress file.

This script contains NO chat data. The export itself and the generated chunks
must never be committed to this repo -- they contain raw credentials and real
users' personal/clinical details.

Usage:
  python3 build_timeline.py <path/to/conversations.json> <output_dir>
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from redact import redact

# In-scope chats (uuid prefix -> short label). Chosen with Akash, Sept 29 2026:
# the 5 core app chats + 3 continuity/memory chats. Website chats are excluded
# (the app and the website are separate projects, per Akash). C11 "Learning from
# previous mistakes" was first included by title, then removed the same day once
# reading showed it is entirely website work (session 11 of the website rebuild,
# zero app content -- checked by scanning all 120 of Akash's messages in it).
IN_SCOPE = {
    "d2814e1d": "C22-ConvertingWebsiteToApp",
    "8448f38e": "C23-AppPart2",
    "973ab5c7": "C26-AppContinuation",
    "db91e073": "C28-App3",
    "61f14fdc": "C31-AppPart4",
    "da60cba8": "C16-ClaudeMultipleDevices",
    "13600f5c": "C17-ObsidianTokenUsage",
    "406969ba": "C21-OfflineAgentSessionRenewal",
}

CHUNK_CHARS = 100_000
# Reading copy caps. Exact code is NOT lost by these caps: every str_replace /
# create_file / Edit / Write is extracted verbatim (redacted) by extract_code_edits.py
# into docs/history/code/, referenced here by its EDIT id.
# Every word Akash and Claude wrote is kept in full. Tool inputs/outputs are shortened here
# because reading them in full would exceed the whole session budget (measured Sept 29:
# ~50k tokens per chunk x 268 chunks). Errors are always kept.
CAP_EDIT = 300        # str_replace old/new, per side, in the reading copy
CAP_FILE = 300        # create_file body in the reading copy
CAP_CMD = 300         # bash command
CAP_OTHER = 200       # any other tool input
CAP_RESULT = 0        # successful tool result text (0 = omitted)
CAP_RESULT_ERR = 300  # failed tool result text
CAP_ATTACH = 300      # attachment extracted content preview

CODE_TOOLS = ("str_replace", "create_file", "Edit", "Write", "MultiEdit")


def edit_id(msg_uuid, block_index):
    return f"E-{msg_uuid[:8]}-{block_index}"


def cap(s, n):
    s = s if isinstance(s, str) else json.dumps(s, ensure_ascii=False)
    if len(s) <= n:
        return s
    return s[:n] + f"\n[...TRUNCATED here: {len(s)} chars total...]"


def render_tool_use(b, eid=None):
    name = b.get("name")
    inp = b.get("input") or {}
    ref = f"  [verbatim: {eid}]" if eid and name in CODE_TOOLS else ""
    out = [f"<<TOOL_USE {name}>>{ref}"]
    if name in ("str_replace", "Edit"):
        out.append(f"path: {inp.get('path') or inp.get('file_path')}")
        out.append("OLD:\n" + cap(inp.get("old_str", inp.get("old_string", "")), CAP_EDIT))
        out.append("NEW:\n" + cap(inp.get("new_str", inp.get("new_string", "")), CAP_EDIT))
    elif name in ("create_file", "Write"):
        body = inp.get("file_text", inp.get("content", "")) or ""
        out.append(f"path: {inp.get('path') or inp.get('file_path')}  ({len(body)} chars)")
        out.append("FILE_TEXT:\n" + cap(body, CAP_FILE))
    elif name in ("bash_tool", "bash_it", "bash"):
        if inp.get("description"):
            out.append(f"description: {inp.get('description')}")
        out.append("COMMAND:\n" + cap(inp.get("command", ""), CAP_CMD))
    else:
        out.append(cap(inp, CAP_OTHER))
    return "\n".join(out)


def render_tool_result(b):
    parts = []
    for c in b.get("content") or []:
        if isinstance(c, dict) and c.get("type") == "text":
            parts.append(c.get("text", ""))
    if b.get("is_error"):
        return f"<<TOOL_RESULT ERROR {b.get('name')}>>\n" + cap("\n".join(parts), CAP_RESULT_ERR)
    if CAP_RESULT == 0:
        return ""
    return f"<<TOOL_RESULT {b.get('name')}>>\n" + cap("\n".join(parts), CAP_RESULT)


def render_message(label, m):
    who = "AKASH" if m.get("sender") == "human" else "CLAUDE"
    lines = [f"\n==== [{m.get('created_at')}] {label} {who} msg:{m.get('uuid','')[:8]} ===="]
    for a in m.get("attachments") or []:
        lines.append(f"[ATTACHMENT {a.get('file_name') or '(pasted text)'} {a.get('file_size')}B] "
                     + cap(a.get("extracted_content", ""), CAP_ATTACH))
    for f in m.get("files") or []:
        lines.append(f"[FILE {f.get('file_name')}]")
    blocks = m.get("content") or []
    if not blocks and m.get("text"):
        lines.append(m["text"])
    for i, b in enumerate(blocks):
        t = b.get("type")
        if t == "text":
            lines.append(b.get("text", ""))
        elif t == "tool_use":
            lines.append(render_tool_use(b, edit_id(m.get("uuid", ""), i)))
        elif t == "tool_result":
            r = render_tool_result(b)
            if r:
                lines.append(r)
        # 'thinking' blocks are intentionally skipped: internal reasoning, not record.
    return redact("\n".join(lines))


def main():
    src, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    data = json.load(open(src))
    msgs = []
    found = {}
    for c in data:
        label = next((v for k, v in IN_SCOPE.items() if c["uuid"].startswith(k)), None)
        if not label:
            continue
        found[label] = len(c.get("chat_messages") or [])
        for m in c.get("chat_messages") or []:
            msgs.append((m.get("created_at") or "", m.get("uuid") or "", label, m))
    missing = [v for v in IN_SCOPE.values() if v not in found]
    msgs.sort(key=lambda x: (x[0], x[1]))

    chunks, cur, cur_len, first_ts = [], [], 0, None
    for ts, _, label, m in msgs:
        r = render_message(label, m)
        if cur and cur_len + len(r) > CHUNK_CHARS:
            chunks.append((first_ts, cur_ts, "\n".join(cur)))
            cur, cur_len, first_ts = [], 0, None
        if first_ts is None:
            first_ts = ts
        cur.append(r); cur_len += len(r); cur_ts = ts
    if cur:
        chunks.append((first_ts, cur_ts, "\n".join(cur)))

    index = []
    for i, (a, b, body) in enumerate(chunks, 1):
        name = f"chunk_{i:04d}.txt"
        open(os.path.join(outdir, name), "w").write(body)
        index.append(f"{i:04d}  {a[:19]} -> {b[:19]}  {len(body):>7} chars")
    open(os.path.join(outdir, "INDEX.txt"), "w").write("\n".join(index) + "\n")
    print(f"chats found: {found}")
    print(f"chats missing: {missing}")
    print(f"messages: {len(msgs)}  chunks: {len(chunks)}  total chars: {sum(len(c[2]) for c in chunks)}")


if __name__ == "__main__":
    main()
