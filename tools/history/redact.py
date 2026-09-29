"""
Credential redaction for anything derived from the chat export.

Two layers:
1. Pattern-based: known token formats (Supabase, GitHub, Groq, Google, JWTs, private keys...).
2. Exact known values: passed in at runtime via the HOBS_REDACT_VALUES env var
   (newline-separated), e.g. pulled live from the system_credentials table in the
   same command. Never write those values to a file in this repo.

Every redaction is replaced with <REDACTED:kind> so the reader can see something
was there without seeing it.
"""
import os, re

PATTERNS = [
    ("supabase_pat", re.compile(r"\bsbp_[A-Za-z0-9]{20,}")),
    ("supabase_secret", re.compile(r"\bsb_secret_[A-Za-z0-9_\-]{10,}")),
    ("github_token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{20,}")),
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}")),
    ("groq_key", re.compile(r"\bgsk_[A-Za-z0-9]{20,}")),
    ("google_client_secret", re.compile(r"\bGOCSPX-[A-Za-z0-9_\-]{10,}")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z_\-]{30,}")),
    ("razorpay_key", re.compile(r"\brzp_(?:live|test)_[A-Za-z0-9]{8,}")),
    ("jwt", re.compile(r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}")),
    ("private_key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S)),
    ("private_key_escaped", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----(?:\\\\?n|[A-Za-z0-9+/=\\ ])*?-----END [A-Z ]*PRIVATE KEY-----")),
    # A key cut off before its END line (e.g. truncated in a reading copy):
    ("private_key_partial", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----(?:\\\\n|\\n|[A-Za-z0-9+/=\s])+")),
    ("whatsapp_token", re.compile(r"\bEAA[A-Za-z0-9]{50,}")),
    ("openai_key", re.compile(r"\bsk-[A-Za-z0-9_\-]{20,}")),
    ("anthropic_key", re.compile(r"\bsk-ant-[A-Za-z0-9_\-]{20,}")),
    ("hubspot_token", re.compile(r"\bpat-[a-z]{2,4}\d*-[a-f0-9\-]{20,}")),
    ("netlify_token", re.compile(r"\bnf[a-z]_[A-Za-z0-9]{20,}")),
    ("hobs_wp_rest_token", re.compile(r"HOBS-Claude-\d{4}-[A-Za-z0-9\-]{4,}")),
]

_known = [v.strip() for v in os.environ.get("HOBS_REDACT_VALUES", "").split("\n") if len(v.strip()) >= 12]
# Longest first: if one known value is a prefix of another (e.g. a stored credential that is a
# shortened form of the real secret), replacing the short one first would leave the rest of the
# long one exposed. Found Sept 29, 2026 -- BUG_LOG #117.
_known = sorted(set(_known), key=len, reverse=True)
# Real clients' names (not staff/team), passed at runtime only -- never listed in this repo.
_names = [n.strip() for n in os.environ.get("HOBS_REDACT_NAMES", "").split(",") if n.strip()]
_name_pats = [re.compile(r"\b" + re.escape(n) + r"\b", re.I) for n in _names]


# Personal email addresses (clients, testers) are replaced; project, staff-role and
# placeholder addresses are kept so the history stays readable.
_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_EMAIL_KEEP_DOMAINS = ("example.com", "hobsfoundation.com", "homeofbeautifulsouls.com",
                       "anthropic.com", "test.com", "iam.gserviceaccount.com", "dnb.com",
                       "acme.com", "github.com", "pages.plusgoogle.com")
_EMAIL_KEEP = ("akashramchandani34@gmail.com", "akashramchadani34@gmail.com",
               "homeofbeautifulsouls@gmail.com")


def _email_sub(m):
    e = m.group(0)
    low = e.lower()
    if low in _EMAIL_KEEP or low.split("@", 1)[1].endswith(_EMAIL_KEEP_DOMAINS):
        return e
    return "<email>"


def redact(s):
    if not isinstance(s, str) or not s:
        return s
    for v in _known:
        if v in s:
            s = s.replace(v, "<REDACTED:known_credential>")
    for p in _name_pats:
        s = p.sub("<client>", s)
    for kind, pat in PATTERNS:
        s = pat.sub(f"<REDACTED:{kind}>", s)
    s = _EMAIL.sub(_email_sub, s)
    return s


def scan(s):
    """Return list of (kind, match) still present -- used as a pre-commit check."""
    hits = []
    for v in _known:
        if v in s:
            hits.append(("known_credential", v[:6] + "..."))
    for kind, pat in PATTERNS:
        for m in pat.finditer(s):
            hits.append((kind, m.group(0)[:10] + "..."))
    return hits
