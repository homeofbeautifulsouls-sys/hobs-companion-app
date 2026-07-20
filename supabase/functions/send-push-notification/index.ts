// send-push-notification
//
// Sends a push notification via Firebase Cloud Messaging (HTTP v1 API) to one user, a list of
// users, or everyone with a registered device -- using the profiles.push_token column that the
// HOBS Companion app writes to on sign-in.
//
// Rewritten to use raw fetch() calls against the Supabase REST/Auth endpoints instead of the
// @supabase/supabase-js SDK import -- this project's Edge Function deploy pipeline cannot
// resolve remote esm.sh imports (confirmed directly via function logs: "failed to bootstrap
// runtime ... A remote specifier was requested ... but --no-remote is specified"), which is
// also why every other function in this project already avoids SDK imports. Behavior is
// otherwise unchanged from the previous version.
//
// Auth: requires a valid Supabase user JWT (default Edge Function verification), OR a call
// presenting this project's own service role key as its bearer token (a legitimate server-to-
// server call, e.g. Bob's automated support-group polls -- identifies itself via
// serverCallerId in the payload, since there's no user session to derive that from).
// Beyond that, the caller must be an admin or therapist, UNLESS they are sending only to
// themselves (self-test), UNLESS this is a trusted server call, OR UNLESS the notification is
// about a chat_message and the caller (and every recipient) is actually a member of that room --
// this last exception is what lets regular support-group members notify each other, not just
// staff.
//
// One narrow, deliberate exception: alertAdminsNewRequest -- lets ANY signed-in client trigger a
// notification to admins about their OWN new booking request. Safe because the client cannot
// control the message content or the recipient list -- both are fixed server-side.
//
// A second, same-shape exception: alertProfessionalSessionBooked -- lets a client notify their
// own assigned professional (looked up by name server-side) when they book a session time.
//
// Request body:
//   { "title": string, "body": string, "data"?: object,
//     "userId"?: string, "userIds"?: string[], "all"?: true,
//     "notificationType"?: string, "targetDescription"?: string }
//   OR: { "alertAdminsNewRequest": true, "category": string }
//   OR: { "alertProfessionalSessionBooked": true, "expertName": string }
//   OR (trusted server calls only): add "serverCallerId": string
// Exactly one of userId / userIds / all / alertAdminsNewRequest / alertProfessionalSessionBooked
// must be provided.
// Every send is logged to notification_log (+ one notification_recipients row per person),
// which is what powers the admin dashboard's send history.

const FIREBASE_PROJECT_ID = "hobs-companion";

const SA_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const SA_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");

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

// --- Raw REST helpers, replacing the supabase-js SDK ---

async function restGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const text = await res.text();
  return { data: text ? JSON.parse(text) : null, error: res.ok ? null : { status: res.status, body: text } };
}

async function restWrite(path: string, method: string, body: unknown, prefer = "return=representation") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { data: text ? JSON.parse(text) : null, error: res.ok ? null : { status: res.status, body: text } };
}

// Resolves who a request's own bearer token belongs to, via Supabase Auth's REST endpoint --
// the direct replacement for supabase-js's `client.auth.getUser()`.
async function getCallerIdFromJWT(authHeader: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authHeader },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.id || null;
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

    const payload = await req.json();

    let callerId: string | null = null;
    let isTrustedServerCall = false;

    if (authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      isTrustedServerCall = true;
      callerId = typeof payload.serverCallerId === "string" ? payload.serverCallerId : null;
    } else {
      callerId = await getCallerIdFromJWT(authHeader);
      if (!callerId) {
        return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Narrow exception: any signed-in client can trigger this specific, fixed-content alert to
    // admins about their own new request. Content and recipients are entirely server-controlled.
    if (payload.alertAdminsNewRequest === true) {
      const { data: callerProfileArr } = await restGet(`profiles?user_id=eq.${callerId}&select=name,email`);
      const callerProfile = callerProfileArr && callerProfileArr[0];
      const { data: admins } = await restGet(
        `profiles?is_admin=eq.true&push_token=not.is.null&select=user_id,push_token,notifications_enabled,notifications_paused_until`
      );

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
      const { data: logRow2Arr, error: logErr2 } = await restWrite("notification_log", "POST", {
        notification_type: "new_booking_request", title: alertTitle, body: alertBody,
        data: {}, sent_by: callerId, target_type: "segment", target_description: "Admins (new request alert)",
      });
      if (logErr2) throw new Error(JSON.stringify(logErr2));
      const logRow2 = logRow2Arr[0];

      let sent2 = 0;
      for (const p of adminTargets) {
        const result = await sendToToken(accessToken2, p.push_token, alertTitle, alertBody, { notification_id: logRow2.id, type: "new_booking_request" });
        await restWrite("notification_recipients", "POST", {
          notification_id: logRow2.id, user_id: p.user_id, fcm_ok: result.ok, fcm_status: result.status,
        }, "return=minimal");
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
      const { data: callerProfile3Arr } = await restGet(`profiles?user_id=eq.${callerId}&select=name,email`);
      const callerProfile3 = callerProfile3Arr && callerProfile3Arr[0];
      const { data: pros } = await restGet(
        `profiles?therapist_expert_name=eq.${encodeURIComponent(payload.expertName)}&push_token=not.is.null&select=user_id,push_token,notifications_enabled,notifications_paused_until`
      );

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
      const { data: logRow3Arr, error: logErr3 } = await restWrite("notification_log", "POST", {
        notification_type: "admin_manual", title: proTitle, body: proBody,
        data: {}, sent_by: callerId, target_type: "user", target_description: "Professional (session booked alert)",
      });
      if (logErr3) throw new Error(JSON.stringify(logErr3));
      const logRow3 = logRow3Arr[0];

      let sent3 = 0;
      for (const p of proTargets) {
        const result = await sendToToken(accessToken3, p.push_token, proTitle, proBody, { notification_id: logRow3.id, type: "session_booked_alert" });
        await restWrite("notification_recipients", "POST", {
          notification_id: logRow3.id, user_id: p.user_id, fcm_ok: result.ok, fcm_status: result.status,
        }, "return=minimal");
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

    const isSelfOnly = userId === callerId && !userIds && !all;
    if (!isSelfOnly && !isTrustedServerCall) {
      const { data: callerProfileArr } = await restGet(`profiles?user_id=eq.${callerId}&select=is_admin,is_therapist`);
      const callerProfile = callerProfileArr && callerProfileArr[0];
      const isStaffCaller = !!callerProfile && (callerProfile.is_admin || callerProfile.is_therapist);

      // Real gap found and fixed: this used to require admin/therapist status for ANY
      // notification to someone else, with no exception for regular chat -- meaning a support
      // group member (not staff) messaging the group could never successfully notify the other
      // members, while a message from staff would. The correct, narrower check for this specific
      // case: the caller just needs to actually be a member of the room the message belongs to.
      let isRoomMemberNotifyingOwnRoom = false;
      if (data && data.type === "chat_message" && typeof data.room_id === "string") {
        const { data: membershipArr } = await restGet(
          `chat_room_members?room_id=eq.${data.room_id}&user_id=eq.${callerId}&status=eq.joined&select=user_id`
        );
        if (membershipArr && membershipArr.length > 0) {
          // Caller checks out -- now also confirm every actual recipient is a member of that
          // same room, not just the caller, so a real member can't point userId/userIds at
          // completely unrelated people while claiming a room they legitimately belong to.
          const targetIds: string[] = userId ? [userId] : (Array.isArray(userIds) ? userIds : []);
          if (targetIds.length > 0 && !all) {
            const idList = targetIds.map((id) => `"${id}"`).join(",");
            const { data: targetMemberships } = await restGet(
              `chat_room_members?room_id=eq.${data.room_id}&user_id=in.(${idList})&status=eq.joined&select=user_id`
            );
            const verifiedIds = new Set((targetMemberships || []).map((m: any) => m.user_id));
            isRoomMemberNotifyingOwnRoom = targetIds.every((id) => verifiedIds.has(id));
          }
        }
      }

      if (!isStaffCaller && !isRoomMemberNotifyingOwnRoom) {
        return new Response(
          JSON.stringify({ error: "Only admins/therapists, or members of the relevant chat room, can send to other users" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let targetFilter = "";
    if (userId) targetFilter = `&user_id=eq.${userId}`;
    else if (userIds) targetFilter = `&user_id=in.(${(userIds as string[]).map((id) => `"${id}"`).join(",")})`;
    // all:true -- no extra filter, every profile with a push_token is eligible

    const { data: profiles, error: profilesErr } = await restGet(
      `profiles?push_token=not.is.null${targetFilter}&select=user_id,push_token,notifications_enabled,notifications_paused_until`
    );
    if (profilesErr) throw new Error(JSON.stringify(profilesErr));

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
    const { data: logRowArr, error: logErr } = await restWrite("notification_log", "POST", {
      notification_type: notificationType || (isSelfOnly ? "self_test" : "admin_manual"),
      title, body, data: data || {},
      sent_by: isSelfOnly ? null : callerId,
      target_type: all ? "all" : (userIds ? "segment" : "user"),
      target_description: targetDescription || (all ? "All users" : (userIds ? `${(userIds as string[]).length} selected users` : "Single user")),
    });
    if (logErr) throw new Error(JSON.stringify(logErr));
    const logRow = logRowArr[0];

    const results: any[] = [];
    const invalidTokenUserIds: string[] = [];
    for (const p of targets) {
      const result = await sendToToken(accessToken, p.push_token, title, body, { ...(data || {}), notification_id: logRow.id });
      results.push({ userId: p.user_id, ok: result.ok, status: result.status });
      await restWrite("notification_recipients", "POST", {
        notification_id: logRow.id, user_id: p.user_id,
        fcm_ok: result.ok, fcm_status: result.status,
      }, "return=minimal");
      if (!result.ok) {
        const errCode = (result.body as any)?.error?.status;
        // Dead/uninstalled-app tokens -- stop retrying them going forward.
        if (errCode === "NOT_FOUND" || errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
          invalidTokenUserIds.push(p.user_id);
        }
      }
    }

    if (invalidTokenUserIds.length > 0) {
      const idList = invalidTokenUserIds.map((id) => `"${id}"`).join(",");
      await restWrite(`profiles?user_id=in.(${idList})`, "PATCH", { push_token: null }, "return=minimal");
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
