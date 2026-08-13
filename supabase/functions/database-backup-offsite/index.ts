// database-backup-offsite
//
// Genuinely separate from database-backup, deliberately -- confirmed via direct testing that
// doing both the primary Supabase-storage backup AND a Hostinger push for all 38 tables within
// a single Edge Function invocation hit a real WORKER_RESOURCE_LIMIT crash. Rather than risk
// the already-proven, already-working primary backup, this runs as its own function on its own
// schedule (staggered after the primary backup completes), reading the files the primary backup
// already wrote to Supabase Storage and pushing copies to Hostinger -- a genuinely separate
// provider and account. The Hostinger destination has no corresponding public DNS record: a
// valid storage location via the API, but not reachable over the web at all.
//
// Why this matters: storing backups only within the same Supabase project doesn't protect
// against a project-level catastrophe (account compromise, project deletion, a Supabase-side
// failure) -- this is the actual offsite layer for that.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const HOSTINGER_API_TOKEN = Deno.env.get("HOSTINGER_API_TOKEN");
const HOSTINGER_USERNAME = "u533396600";
const HOSTINGER_BACKUP_DOMAIN = "db-backups-offsite.homeofbeautifulsouls.com";

async function uploadToHostingerOffsite(filename: string, bytes: Uint8Array): Promise<{ ok: boolean; detail: string }> {
  if (!HOSTINGER_API_TOKEN) return { ok: false, detail: "HOSTINGER_API_TOKEN not configured" };
  try {
    const credRes = await fetch("https://developers.hostinger.com/api/hosting/v1/files/upload-urls", {
      method: "POST",
      headers: { Authorization: `Bearer ${HOSTINGER_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ username: HOSTINGER_USERNAME, domain: HOSTINGER_BACKUP_DOMAIN }),
    });
    if (!credRes.ok) return { ok: false, detail: `Could not get upload credentials: ${credRes.status}` };
    const creds = await credRes.json();

    const uploadUrlWithFile = `${creds.url.replace(/\/$/, "")}/${filename}?override=true`;
    const authHeaders = { "X-Auth": creds.auth_key, "X-Auth-Rest": creds.rest_auth_key };

    // Raw TUS, two calls, no library: (1) create the upload, (2) send the bytes. Skips
    // tus-js-client's chunking/resumability entirely -- unnecessary for a file this small, and
    // the actual source of the resource-limit crashes seen with the library in this runtime.
    const createRes = await fetch(uploadUrlWithFile, {
      method: "POST",
      headers: { ...authHeaders, "Tus-Resumable": "1.0.0", "upload-length": String(bytes.length), "upload-offset": "0" },
    });
    if (createRes.status !== 201) return { ok: false, detail: `Create failed: ${createRes.status}` };

    // Retries the actual data-carrying PATCH specifically -- a real, transient HTTP2 connection
    // error was observed during testing (succeeded cleanly on a simple retry), and this runs
    // unattended on a schedule with nobody to manually retry it.
    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const patchRes = await fetch(uploadUrlWithFile, {
          method: "PATCH",
          headers: {
            ...authHeaders,
            "Content-Type": "application/offset+octet-stream",
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": "0",
          },
          body: bytes,
        });
        if (patchRes.ok) return { ok: true, detail: attempt > 1 ? `OK (succeeded on attempt ${attempt})` : "OK" };
        lastError = `Upload failed: ${patchRes.status} ${await patchRes.text()}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
    return { ok: false, detail: `Failed after 3 attempts: ${lastError}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const providedSecret = req.headers.get("x-scheduler-secret");
  const expectedSecret = Deno.env.get("SCHEDULER_SECRET");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    // Find the most recent primary backup to mirror -- rather than re-fetching from the
    // database (duplicating the primary backup's own work), reads what it already wrote.
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/database-backups`, {
      method: "POST",
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: "", limit: 1000, sortBy: { column: "name", order: "desc" } }),
    });
    if (!listRes.ok) throw new Error(`Could not list backup folders: ${listRes.status}`);
    const entries = await listRes.json();
    const folders = (entries || []).filter((e: any) => e.id === null).map((e: any) => e.name).sort().reverse();
    const latestTimestamp = folders[0];
    if (!latestTimestamp) {
      return new Response(JSON.stringify({ error: "No primary backup found to mirror yet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const filesRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/database-backups`, {
      method: "POST",
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: `${latestTimestamp}/`, limit: 1000 }),
    });
    const files = await filesRes.json();

    // Real bottleneck found via direct testing: 38 separate TUS sessions (each with its own
    // protocol overhead: credential fetch, pre-upload request, actual upload) hit a real
    // resource limit even though the combined data is genuinely small (1.5MB total). Reads
    // every file first (cheap storage reads, not database queries), combines them into one
    // JSON bundle, and does a single TUS session instead of 38 separate ones.
    const bundle: Record<string, string> = {};
    const readErrors: Record<string, string> = {};
    for (const file of (files || [])) {
      const path = `${latestTimestamp}/${file.name}`;
      try {
        const fileRes = await fetch(`${SUPABASE_URL}/storage/v1/object/database-backups/${path}`, {
          headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        });
        if (!fileRes.ok) { readErrors[file.name] = `Could not read from primary backup: ${fileRes.status}`; continue; }
        bundle[file.name] = await fileRes.text();
      } catch (err) {
        readErrors[file.name] = err instanceof Error ? err.message : String(err);
      }
    }

    const bundleBytes = new TextEncoder().encode(JSON.stringify({ timestamp: latestTimestamp, files: bundle }));
    const uploadResult = await uploadToHostingerOffsite(`${latestTimestamp}.json`, bundleBytes);

    return new Response(
      JSON.stringify({
        mirrored_timestamp: latestTimestamp,
        files_bundled: Object.keys(bundle).length,
        read_errors: Object.keys(readErrors).length ? readErrors : undefined,
        upload_result: uploadResult,
      }),
      { status: uploadResult.ok ? 200 : 207, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
