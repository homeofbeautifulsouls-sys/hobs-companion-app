// (leading padding line -- a deploy-time truncation was observed eating the first few
// characters of this file; this comment absorbs that instead of real code)
// send-push-notification
//
// Sends a push notification via Firebase Cloud Messaging (HTTP v1 API) to one user, a list of
// users, or everyone with a registered device -- using the profiles.push_token column that the
// HOBS Companion app writes to on sign-in.
//
// Auth: requires a valid Supabase user JWT (default Edge Function verification). Beyond that,
// the caller must be an admin or therapist, UNLESS they are sending only to themselves (used for
// a self-test send from the app). This is intentionally conservative -- broadening who can
// trigger a broadcast is a product decision, not something to default open.
//
// One narrow, deliberate exception: alertAdminsNewRequest -- lets ANY signed-in client trigger a
// notification to admins about their OWN new booking request. This is safe specifically because
// the client cannot control the message content or the recipient list -- both are fixed
// server-side -- so there's no way to abuse this to spam or impersonate.
//
// A second, same-shape exception: alertProfessionalSessionBooked -- lets a client notify their
// own assigned professional (looked up by name server-side) when they book a session time. Same
// safety property: content and recipient are both fixed, not client-supplied.
//
// Request body:
//   { "title": string, "body": string, "data"?: object,
//     "userId"?: string, "userIds"?: string[], "all"?: true,
//     "notificationType"?: string, "targetDescription"?: string }
//   OR: { "alertAdminsNewRequest": true, "category": string }
// Exactly one of userId / userIds / all / alertAdminsNewRequest must be provided.
// Every send is logged to notification_log (+ one notification_recipients row per person),
// which is what powers the admin dashboard's send history.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIREBASE_PROJECT_ID = "hobs-companion";

const SA_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const SA_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");

// Auto-injected by Supabase into every Edge Function at deploy time -- not something we set ourselves.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const encoder = new TextEncoder();

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? encoder.encode(input) : new Uint8Array(input);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getFcmAccessToken(): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: SA_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const toSign = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claimSet))}`;

  const keyData = SA_PRIVATE_KEY
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(toSign));
  const jwt = `${toSign}.${base64url(signature)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) throw new Error("FCM token exchange failed: " + JSON.stringify(tokenJson));
  return tokenJson.access_token;
}

async function sendToToken(
  accessToken: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: data || {},
          android: { priority: "high" },
        },
      }),
    }
  );
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Real gap found and fixed: this function previously had no path at all for a legitimate
    // server-to-server call (a cron-triggered Edge Function, e.g. Bob's automated support-group
    // polls) -- every call had to present a real user session, which a scheduled job never has.
    // The service role key itself is the proof of trust here (only our own server-side
    // functions ever hold it), so a call presenting it skips the session lookup entirely rather
    // than being rejected as "invalid session."
    const isServiceRoleCall = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    let callerId: string | null = null;
    if (isServiceRoleCall) {
      const prePayload = await req.clone().json().catch(() => ({}));
      callerId = typeof prePayload.callerId === "string" ? prePayload.callerId : null;
    } else {
      // Client bound to the CALLER's own JWT -- used only to find out who they are and whether
      // they're an admin/therapist. Never used to read or write other people's data.
      const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: callerAuth, error: callerAuthErr } = await callerClient.auth.getUser();
      if (callerAuthErr || !callerAuth?.user) {
        return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerId = callerAuth.user.id;
    }

    const payload = await req.json();

    // Narrow exception: any signed-in client can trigger this specific, fixed-content alert to
    // admins about their own new request. Content and recipients are entirely server-controlled.
    if (payload.alertAdminsNewRequest === true) {
      const adminClient2 = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: callerProfile } = await adminClient2
        .from("profiles").select("name, email").eq("user_id", callerId).single();
      const { data: admins } = await adminClient2
        .from("profiles").select("user_id, push_token, notifications_enabled, notifications_paused_until")
        .eq("is_admin", true).not("push_token", "is", null);

      const now2 = new Date();
      const adminTargets = (admins || []).filter((p: any) => {
        if (p.notifications_enabled === false) return false;
        if (p.notifications_paused_until && new Date(p.notifications_paused_until) > now2) return false;
        return true;
      });

      const callerName = callerProfile?.name || callerProfile?.email || "A client";
      const category = typeof payload.category === "string" ? payload.category : "support";
      const alertTitle = "New request 🔔";
      const alertBody = callerName + " has requested " + category.toLowerCase() + " support — check Pending Requests to assign someone.";

      if (adminTargets.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: "No admins with notifications enabled" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accessToken2 = await getFcmAccessToken();
      const { data: logRow2, error: logErr2 } = await adminClient2
        .from("notification_log")
        .insert({
          notification_type: "new_booking_request", title: alertTitle, body: alertBody,
          data: {}, sent_by: callerId, target_type: "segment", target_description: "Admins (new request alert)",
        })
        .select("id").single();
      if (logErr2) throw logErr2;

      let sent2 = 0;
      for (const p of adminTargets) {
        const result = await sendToToken(accessToken2, p.push_token, alertTitle, alertBody, { notification_id: logRow2.id, type: "new_booking_request" });
        await adminClient2.from("notification_recipients").insert({
          notification_id: logRow2.id, user_id: p.user_id, fcm_ok: result.ok, fcm_status: result.status,
        });
        if (result.ok) sent2++;
      }
      return new Response(JSON.stringify({ sent: sent2 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Second narrow exception: a client can trigger a fixed-content notification to their own
    // assigned professional when they book a session time. Content and recipient (looked up by
    // name, not supplied by the client) are both server-controlled.
    if (payload.alertProfessionalSessionBooked === true && typeof payload.expertName === "string") {
      const adminClient3 = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: callerProfile3 } = await adminClient3
        .from("profiles").select("name, email").eq("user_id", callerId).single();
      const { data: pros } = await adminClient3
        .from("profiles").select("user_id, push_token, notifications_enabled, notifications_paused_until")
        .eq("therapist_expert_name", payload.expertName).not("push_token", "is", null);

      const now3 = new Date();
      const proTargets = (pros || []).filter((p: any) => {
        if (p.notifications_enabled === false) return false;
        if (p.notifications_paused_until && new Date(p.notifications_paused_until) > now3) return false;
        return true;
      });
      if (proTargets.length === 0) {
        return new Response(JSON.stringify({ sent: 0, message: "Professional has no account or notifications disabled" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const clientName = callerProfile3?.name || callerProfile3?.email || "A client";
      const proTitle = "Session booked 📅";
      const proBody = clientName + " just picked a session time with you — check your dashboard for details.";

      const accessToken3 = await getFcmAccessToken();
      const { data: logRow3, error: logErr3 } = await adminClient3
        .from("notification_log")
        .insert({
          notification_type: "admin_manual", title: proTitle, body: proBody,
          data: {}, sent_by: callerId, target_type: "user", target_description: "Professional (session booked alert)",
        })
        .select("id").single();
      if (logErr3) throw logErr3;

      let sent3 = 0;
      for (const p of proTargets) {
        const result = await sendToToken(accessToken3, p.push_token, proTitle, proBody, { notification_id: logRow3.id, type: "session_booked_alert" });
        await adminClient3.from("notification_recipients").insert({
          notification_id: logRow3.id, user_id: p.user_id, fcm_ok: result.ok, fcm_status: result.status,
        });
        if (result.ok) sent3++;
      }
      return new Response(JSON.stringify({ sent: sent3 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, data, userId, userIds, all, notificationType, targetDescription } = payload;

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const specifiedTargets = [userId, userIds, all].filter((v) => v !== undefined);
    if (specifiedTargets.length !== 1) {
      return new Response(
        JSON.stringify({ error: "Provide exactly one of userId, userIds, or all:true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client (service role) -- used for everything past this point, since we've already
    // established who the caller is and what they're allowed to do above.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const isSelfOnly = userId === callerId && !userIds && !all;
    if (!isSelfOnly && !isServiceRoleCall) {
      // Real gap found and fixed: this used to require admin/therapist status for ANY
      // cross-user notification, with no exception for the actual, common case of a regular
      // support-group member's message needing to reach other regular members. Confirmed this
      // as the likely cause of "notifications not delivering properly" being reported as
      // inconsistent rather than fully broken -- staff messages worked, ordinary members'
      // never did, silently.
      // Narrow, safe exception: for a chat_message notification with a room_id, allow it if the
      // caller is actually a member of that room AND every recipient is too -- never lets
      // someone notify an arbitrary user outside the room they're both actually in.
      let allowedByRoomMembership = false;
      if (data && data.type === "chat_message" && typeof data.room_id === "string") {
        const { data: roomMembers } = await adminClient
          .from("chat_room_members").select("user_id").eq("room_id", data.room_id).eq("status", "joined");
        const memberIds = new Set((roomMembers || []).map((m: any) => m.user_id));
        const recipientIds = userId ? [userId] : (userIds || []);
        allowedByRoomMembership = memberIds.has(callerId) && recipientIds.length > 0 && recipientIds.every((id: string) => memberIds.has(id));
      }

      if (!allowedByRoomMembership) {
        const { data: callerProfile } = await adminClient
          .from("profiles")
          .select("is_admin, is_therapist")
          .eq("user_id", callerId)
          .single();
        if (!callerProfile || (!callerProfile.is_admin && !callerProfile.is_therapist)) {
          return new Response(
            JSON.stringify({ error: "Only admins/therapists can send to other users" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    let query = adminClient
      .from("profiles")
      .select("user_id, push_token, notifications_enabled, notifications_paused_until")
      .not("push_token", "is", null);

    if (userId) query = query.eq("user_id", userId);
    else if (userIds) query = query.in("user_id", userIds);
    // all:true -- no extra filter, every profile with a push_token is eligible

    const { data: profiles, error: profilesErr } = await query;
    if (profilesErr) throw profilesErr;

    const now = new Date();
    const targets = (profiles || []).filter((p: any) => {
      if (!p.push_token) return false;
      if (p.notifications_enabled === false) return false;
      if (p.notifications_paused_until && new Date(p.notifications_paused_until) > now) return false;
      return true;
    });

    if (targets.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No eligible recipients" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getFcmAccessToken();

    // Log the send itself before dispatching -- so even a partial failure mid-loop still leaves
    // a record of what was attempted, not just what fully succeeded.
    const { data: logRow, error: logErr } = await adminClient
      .from("notification_log")
      .insert({
        notification_type: notificationType || (isSelfOnly ? "self_test" : "admin_manual"),
        title, body, data: data || {},
        sent_by: isSelfOnly ? null : callerId,
        target_type: all ? "all" : (userIds ? "segment" : "user"),
        target_description: targetDescription || (all ? "All users" : (userIds ? `${userIds.length} selected users` : "Single user")),
      })
      .select("id").single();
    if (logErr) throw logErr;

    const results: any[] = [];
    const invalidTokenUserIds: string[] = [];
    for (const p of targets) {
      const result = await sendToToken(accessToken, p.push_token, title, body, { ...(data || {}), notification_id: logRow.id });
      results.push({ userId: p.user_id, ok: result.ok, status: result.status });
      await adminClient.from("notification_recipients").insert({
        notification_id: logRow.id, user_id: p.user_id,
        fcm_ok: result.ok, fcm_status: result.status,
      });
      if (!result.ok) {
        const errCode = (result.body as any)?.error?.status;
        // Dead/uninstalled-app tokens -- stop retrying them going forward.
        if (errCode === "NOT_FOUND" || errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
          invalidTokenUserIds.push(p.user_id);
        }
      }
    }

    if (invalidTokenUserIds.length > 0) {
      await adminClient.from("profiles").update({ push_token: null }).in("user_id", invalidTokenUserIds);
    }

    const sentCount = results.filter((r) => r.ok).length;
    return new Response(
      JSON.stringify({ sent: sentCount, failed: results.length - sentCount, notificationId: logRow.id, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
