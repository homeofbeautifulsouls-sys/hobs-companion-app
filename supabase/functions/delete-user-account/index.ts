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

async function deleteAllDataFor(adminClient: ReturnType<typeof createClient>, userId: string) {
  for (const table of HARD_DELETE_TABLES) {
    await adminClient.from(table).delete().eq("user_id", userId);
  }

  // SOFT-TOUCH: chat messages -- hard-deleting these would leave real gaps in other people's
  // conversation history (a support group mid-discussion, a coordination thread). The app
  // already has a "deleted" flag it actively respects in rendering (shows "Message deleted"),
  // so use that existing, already-supported path instead of a destructive delete.
  await adminClient.from("chat_messages").update({ deleted: true, text: null }).eq("sender_id", userId);

  // SOFT-TOUCH: donations -- a financial/accounting record, plausibly needed for 80G tax
  // receipt and bookkeeping purposes independent of the donor's account existing. Strip the
  // identifying fields, keep the transaction record itself (amount, date, campaign, confirmed
  // status) intact.
  await adminClient.from("donations").update({ user_id: null, donor_name: null }).eq("user_id", userId);

  await adminClient.from("profiles").delete().eq("user_id", userId);
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
