# Safe Deploy for Hostinger

Real, tested rollback protection for deploys to app.homeofbeautifulsouls.com.

## What it does
1. Backs up whatever's currently live (all managed files) before touching anything
2. Uploads the new version
3. Runs a real health check (confirms the actual app loaded, not just a 200 response)
4. If the health check fails, automatically re-uploads the backed-up version and re-verifies

## Usage
```
npm install
HOSTINGER_API_TOKEN="your-token-here" node safe_deploy.js <source-directory> [file1] [file2] ...
```
The Hostinger API token is required as an environment variable -- it is deliberately NOT hardcoded in this script (a real security issue found and fixed: it previously was, meaning anyone with repo access or a copy of any handoff zip had the live, working token in plain-text source). See CREDENTIALS.md for the actual token value.

If no files are listed, it deploys all managed files (index.html, donate.html, privacy-policy.html, terms-of-service.html, delete-account.html, supabase.min.js, fonts.css, version.json).

## Verified behavior (tested directly, not just written)
- A deliberately broken index.html was deployed through this script: correctly detected, correctly rolled back, live site confirmed healthy afterward via an independent check.
- A genuinely correct deploy was run through the same script: passed health check, no unnecessary rollback.

Backups accumulate in `backups/` locally with each run — this directory isn't currently pruned automatically.
