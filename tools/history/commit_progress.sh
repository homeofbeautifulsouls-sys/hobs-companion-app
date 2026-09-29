#!/bin/bash
# Commit reconstruction progress safely: credential-scan every changed doc first, refuse to
# commit on any hit, then commit and push. Usage: tools/history/commit_progress.sh "<message>"
# Needs HOBS_REDACT_VALUES / HOBS_REDACT_NAMES exported for full exact-value scanning (see
# docs/HISTORY_PROGRESS.md); pattern-based scanning runs regardless.
set -e
cd "$(dirname "$0")/../.."
MSG="$1"
[ -z "$MSG" ] && { echo "usage: $0 <message>"; exit 1; }
CHANGED=$(git status --porcelain -- docs tools CLAUDE.md | awk '{print $2}')
python3 -B - "$CHANGED" <<'EOF'
import sys, os
sys.path.insert(0, 'tools/history')
from redact import scan
bad = {}
for p in sys.argv[1].split():
    if os.path.isdir(p):
        files = [os.path.join(r, f) for r, _, fs in os.walk(p) for f in fs]
    else:
        files = [p]
    for f in files:
        if os.path.isfile(f) and not f.endswith('.pyc'):
            h = scan(open(f, errors='ignore').read())
            if h:
                bad[f] = h[:3]
if bad:
    print("REFUSING TO COMMIT -- credential patterns found:", bad)
    sys.exit(1)
print("scan clean")
EOF
git add docs tools CLAUDE.md
git commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016cFWEqp9ZJMTeXsySY4VmS"
git push -q
git log -1 --format="committed %h: %s"
