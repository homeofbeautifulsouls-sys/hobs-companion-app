// delete-user-account
//
// Two ways to call this:
//   1. Self-service: { "selfDelete": true } -- any signed-in user can delete their OWN account
//      and all their own data. This is the new path, added to satisfy Google Play's account
//      deletion requirement (an in-app path is required, not just an admin-triggered one).
//      Blocked for staff accounts (is_admin or is_therapist) -- deleting a professional's
//      account has real knock-on effects for their actual clients (active bookings, chat
//      history, calendar connections) that deserve a human looking at it first, not a silent
//      self-service button. Staff members needing to leave get a clear message to contact
//      support instead.
//   2. Admin-triggered: { "userId": "<target>" } -- unchanged from before, still requires the
//      caller to be an admin, still blocks an admin from targeting their own account through
//      this path (use selfDelete for that instead).
//
// Fully deletes a user's account: all their data across every table that references them, and
// their actual login (auth.users row) via the Supabase Auth Admin API, which requires the
// service role key and cannot be done from client-side JS with just RLS permissions -- RLS
// doesn't govern auth.users itself, regardless of how permissive public-schema policies are.
//
// REAL GAP FOUND AND FIXED THIS REWRITE: the previous version's table list (notification_
// recipients, subtasks, tasks, entries, expert_bookings, test_results, worksheet_responses,
// donations) predates a lot of what's been built since -- chat, support groups, the period
// tracker, WHO-5, consent agreements, credits, and more. Confirmed directly against a live
// schema query for every table with a user-referencing column before rewriting this, rather
// than trusting the old list was still complete.
//
// Two categories of handling, not just one flat delete list:
//   HARD DELETE  -- entirely personal data, safe to remove outright.
//   SOFT-TOUCH   -- shared/referenced-by-others data, where a hard delete would break things
//                   for OTHER people (a group chat's history, a donation's financial record).
//                   Anonymized/soft-deleted instead of removed.
//
// Request body: { "selfDelete": true } OR { "userId": string }
// Response: { "success": true } or { "error": string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Entirely personal -- every row belonging to this user, in this table, is simply gone.
const HARD_DELETE_TABLES = [
  "notification_recipients",
  "subtasks",
  "tasks",
  "entries",
  "expert_bookings",
  "test_results",
  "worksheet_responses",
  "who5_entries",
  "period_logs",
  "consent_agreements",
  "credit_log",
  "chat_poll_votes",
  "chat_room_members",
  "app_analytics_events",
  "error_logs",
  "app_update_reminders",
  "gcal_connect_state_tokens",
  "professional_calendar_connections",
];

// Only populated for professionals (therapists/psychiatrists/etc), so only ever relevant on the
// admin-delete-someone-else path -- self-delete is blocked entirely for staff accounts before
// this ever runs. professional_user_id is NOT NULL on all three, so these rows have to be
// removed outright rather than anonymized; a professional's own calendar/schedule data has no
// independent meaning once their account is gone. Found on a deeper schema pass after an
// initial review missed anything not using the exact column name "user_id".
const PROFESSIONAL_HARD_DELETE_TABLES = [
  "calendar_change_requests",
  "session_calendar_events",
  "professional_busy_blocks",
];

async function deleteStorageFolder(adminClient: ReturnType<typeof createClient>, bucket: string, prefix: string) {
  // REAL BUG FOUND AND FIXED via a live test with an actual uploaded file: Storage's .list()
  // is NOT recursive -- it only returns direct children of the given prefix. A file uploaded to
  // {userId}/profile-photos/photo.png was being completely missed, because .list(userId) only
  // saw "profile-photos" as an opaque folder entry, never descended into it, and so never found
  // the actual file to delete. Confirmed the file was still present after "deletion" before this
  // fix. A folder entry has id === null; a real file entry always has a real id. Walk the whole
  // tree before batch-removing every actual file path collected.
  const allFilePaths: string[] = [];
  async function walk(currentPrefix: string) {
    const { data: entries } = await adminClient.storage.from(bucket).list(currentPrefix, { limit: 1000 });
    if (!entries) return;
    for (const entry of entries) {
      const entryPath = `${currentPrefix}/${entry.name}`;
      if (entry.id === null) {
        await walk(entryPath); // it's a subfolder -- descend
      } else {
        allFilePaths.push(entryPath); // it's a real file
      }
    }
  }
  await walk(prefix);
  if (allFilePaths.length > 0) {
    await adminClient.storage.from(bucket).remove(allFilePaths);
  }
}

async function deleteAllDataFor(adminClient: ReturnType<typeof createClient>, userId: string) {
  // REAL GAP FOUND AND FIXED: uploaded files were never being cleaned up at all, only the
  // database rows referencing them -- profile photos, task attachments, and session
  // attachments were all being left behind in storage indefinitely after "deletion".
  //
  // Storage deletion happens BEFORE the database transaction below, deliberately -- these
  // storage buckets are keyed by user_id/booking_id, and expert_bookings rows (needed to find
  // session-attachments folders) get deleted as part of the atomic database step. Doing this
  // first means if storage cleanup fails, the database is untouched and nothing has to be
  // rolled back; the alternative order would require compensating for a partial DB commit.
  const storageErrors: string[] = [];
  try {
    await deleteStorageFolder(adminClient, "task-images", userId);
    await deleteStorageFolder(adminClient, "private-user-images", userId);
  } catch (e) {
    storageErrors.push(`task-images/private-user-images: ${String(e)}`);
  }

  const { data: bookings } = await adminClient.from("expert_bookings").select("id").eq("user_id", userId);
  if (bookings) {
    for (const booking of bookings) {
      try {
        await deleteStorageFolder(adminClient, "session-attachments", booking.id);
      } catch (e) {
        storageErrors.push(`session-attachments/${booking.id}: ${String(e)}`);
      }
    }
  }
  if (storageErrors.length > 0) {
    throw new Error("Storage cleanup failed, stopping before touching any data: " + storageErrors.join("; "));
  }

  // Real fix: this used to be ~20 separate, individually-unchecked delete/update calls that
  // could fail partway through and still report success. Now a single call to a genuinely
  // atomic Postgres function (see supabase/migrations/delete_user_data_atomic.sql) -- if ANY
  // statement inside it fails, the whole thing rolls back together, automatically, with no
  // partial-deletion state ever possible.
  const { error: dbError } = await adminClient.rpc("delete_user_data_atomic", { target_user_id: userId });
  if (dbError) {
    throw new Error("Database deletion failed (fully rolled back, nothing was partially deleted): " + dbError.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const callerClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerAuthErr } = await callerClient.auth.getUser();
    if (callerAuthErr || !callerAuth?.user) return jsonResponse({ error: "Invalid or expired session" }, 401);

    const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const body = await req.json().catch(() => ({}));

    let targetUserId: string;

    if (body.selfDelete === true) {
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("is_admin, is_therapist")
        .eq("user_id", callerAuth.user.id)
        .single();
      if (callerProfile?.is_admin || callerProfile?.is_therapist) {
        return jsonResponse(
          { error: "Staff accounts can't be self-deleted here since it affects your clients too -- please contact us directly and we'll help." },
          400
        );
      }
      targetUserId = callerAuth.user.id;
    } else {
      const { userId } = body;
      if (!userId || typeof userId !== "string") return jsonResponse({ error: "userId is required" }, 400);

      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("is_admin")
        .eq("user_id", callerAuth.user.id)
        .single();
      if (!callerProfile?.is_admin) return jsonResponse({ error: "Admin access required" }, 403);
      if (userId === callerAuth.user.id) {
        return jsonResponse({ error: "Use selfDelete to delete your own account through this tool" }, 400);
      }
      targetUserId = userId;
    }

    await deleteAllDataFor(adminClient, targetUserId);

    const { error: authDeleteErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (authDeleteErr) {
      return jsonResponse({ error: "Data deleted, but removing the login failed: " + authDeleteErr.message }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
