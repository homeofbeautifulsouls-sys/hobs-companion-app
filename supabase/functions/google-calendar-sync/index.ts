// Receives Google Calendar's push notifications (webhooks) and reconciles changes back into
// HOBS -- this is what makes sync instant rather than polled. Google's notification itself
// carries no details of what changed, only "something changed, go check" -- so on every
// notification this fetches the actual diff via incremental sync (a stored sync token), then
// routes each changed event based on whether it's a HOBS-created session or an external block:
//
// - HOBS session, event deleted in Google -> auto-cancel, running through the EXACT same
//   cancellation policy the app enforces for a normal in-app cancellation (24hr window, one
//   50% grace per calendar month, full charge on a second late cancellation same month) --
//   this exists specifically so deleting the calendar event isn't a way to dodge the policy.
// - HOBS session, event time changed in Google -> does NOT auto-apply. Creates a pending
//   calendar_change_requests row and notifies the professional to review it in-app.
// - Not a HOBS session at all -> treated as a personal/external block, tracked in
//   professional_busy_blocks purely for computing availability, never touching any session.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");

async function dbFetch(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  return res.json();
}
async function dbWrite(path: string, method: string, body: unknown, prefer = "return=representation") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function sendPush(userId: string, title: string, body: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ userId, title, body }),
  }).catch(() => {});
}

// Refreshes an access token from a stored refresh token -- webhook processing has no
// interactive session to fall back on, so this always goes straight to Google.
async function getValidAccessToken(conn: any): Promise<string | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: conn.refresh_token,
      client_id: GOOGLE_CLIENT_ID ?? "",
      client_secret: GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!tokenRes.ok) {
    await dbWrite(`professional_calendar_connections?user_id=eq.${conn.user_id}`, "PATCH", { needs_reconnect: true });
    await sendPush(
      conn.user_id,
      "Your Google Calendar needs reconnecting",
      "Sync paused because your Google connection expired (expected roughly every 7 days while HOBS is in Google's testing mode). Open Profile → Calendar and tap Reconnect to pick up right where it left off."
    );
    return null;
  }
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// Applies the EXACT same cancellation policy the app enforces for an in-app cancellation --
// replicated precisely, not approximated, so deleting the calendar event is never a way to
// dodge the 24-hour window or the once-a-month grace on the 50% charge.
async function autoCancelWithPolicy(booking: any) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const history = await dbFetch(
    `expert_bookings?user_id=eq.${booking.user_id}&expert_name=eq.${encodeURIComponent(booking.expert_name)}&cancellation_charge_percent=eq.50&last_cancelled_at=gte.${monthStart}&select=id`
  );
  const alreadyUsedLateAllowanceThisMonth = Array.isArray(history) && history.length > 0;

  const sessionDate = booking.session_date ? new Date(booking.session_date) : null;
  const hoursUntilSession = sessionDate ? (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
  const isLateCancellation = hoursUntilSession !== null && hoursUntilSession < 24;

  let chargePercent: number;
  if (!isLateCancellation) chargePercent = 0;
  else if (!alreadyUsedLateAllowanceThisMonth) chargePercent = 50;
  else chargePercent = 100;

  await dbWrite(`expert_bookings?id=eq.${booking.id}`, "PATCH", {
    status: "cancelled",
    cancellation_count: (booking.cancellation_count || 0) + 1,
    last_cancelled_at: now.toISOString(),
    cancellation_charge_percent: chargePercent,
    cancellation_charge_owed: chargePercent > 0,
  }, "return=minimal");

  return chargePercent;
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-resource-id, x-goog-resource-state" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";

    // Explicit action calls (registering or renewing a watch channel) vs. Google's own webhook
    // pings (which never send a JSON action body, only headers) are routed separately here.
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (body.action === "register_watch") {
        const connRows = await dbFetch(`professional_calendar_connections?user_id=eq.${body.user_id}&select=*`);
        const conn = Array.isArray(connRows) ? connRows[0] : null;
        if (!conn) return new Response(JSON.stringify({ error: "No connection found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const accessToken = await getValidAccessToken(conn);
        if (!accessToken) return new Response(JSON.stringify({ error: "Reconnect needed" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const channelId = crypto.randomUUID();
        const watchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${conn.google_calendar_id}/events/watch`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            id: channelId,
            type: "web_hook",
            address: `${SUPABASE_URL}/functions/v1/google-calendar-sync`,
          }),
        });
        const watchData = await watchRes.json();
        if (!watchRes.ok) {
          console.error("Google watch registration error:", watchData);
          return new Response(JSON.stringify({ error: "Could not start instant sync" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await dbWrite(`professional_calendar_connections?user_id=eq.${body.user_id}`, "PATCH", {
          watch_channel_id: channelId,
          watch_resource_id: watchData.resourceId,
          watch_expires_at: new Date(Number(watchData.expiration)).toISOString(),
        }, "return=minimal");

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Google's actual webhook ping carries no body -- everything needed is in headers.
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceState = req.headers.get("x-goog-resource-state"); // 'sync' (initial handshake) or 'exists' (something changed)

    if (!channelId || resourceState === "sync") {
      return new Response("ok", { headers: corsHeaders }); // initial handshake, nothing to reconcile yet
    }

    const conns = await dbFetch(`professional_calendar_connections?watch_channel_id=eq.${channelId}&select=*`);
    const conn = Array.isArray(conns) ? conns[0] : null;
    if (!conn) return new Response("ok", { headers: corsHeaders }); // unknown/stale channel, nothing to do

    const accessToken = await getValidAccessToken(conn);
    if (!accessToken) return new Response("ok", { headers: corsHeaders }); // reconnect notice already sent above

    // Incremental sync: only what actually changed since last time, using the stored sync
    // token -- much cheaper than re-fetching the whole calendar on every notification.
    let url = conn.sync_token
      ? `https://www.googleapis.com/calendar/v3/calendars/${conn.google_calendar_id}/events?syncToken=${conn.sync_token}`
      : `https://www.googleapis.com/calendar/v3/calendars/${conn.google_calendar_id}/events?timeMin=${new Date().toISOString()}`;

    let nextSyncToken = conn.sync_token;
    while (url) {
      const eventsRes = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!eventsRes.ok) {
        if (eventsRes.status === 410) {
          // Sync token itself expired -- clear it, next notification does a full initial sync.
          await dbWrite(`professional_calendar_connections?user_id=eq.${conn.user_id}`, "PATCH", { sync_token: null }, "return=minimal");
        }
        break;
      }
      const data = await eventsRes.json();

      for (const event of data.items || []) {
        const linkRows = await dbFetch(`session_calendar_events?professional_user_id=eq.${conn.user_id}&google_event_id=eq.${event.id}&select=*`);
        const link = Array.isArray(linkRows) ? linkRows[0] : null;

        if (link) {
          // A HOBS-created session's event.
          const bookingRows = await dbFetch(`expert_bookings?id=eq.${link.booking_id}&select=*`);
          const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;
          if (!booking || booking.status === "cancelled") continue;

          if (event.status === "cancelled") {
            const chargePercent = await autoCancelWithPolicy(booking);
            const chargeMsg = chargePercent > 0 ? ` A ${chargePercent}% cancellation charge applies per policy.` : " No charge applies (more than 24 hours' notice).";
            await sendPush(booking.user_id, "Your session was cancelled", `Your session with ${booking.expert_name} was cancelled (calendar event removed).${chargeMsg}`);
            await sendPush(conn.user_id, "Session cancelled", `The session on your calendar was removed, so it's been cancelled in HOBS too.${chargeMsg}`);
          } else if (event.start?.dateTime && link.last_known_start && event.start.dateTime !== link.last_known_start) {
            // Time changed -- flag for approval, never auto-applied.
            await dbWrite("calendar_change_requests", "POST", {
              booking_id: booking.id, professional_user_id: conn.user_id, change_type: "time_changed",
              old_start: link.last_known_start, new_start: event.start.dateTime,
            }, "return=minimal");
            await dbWrite(`session_calendar_events?id=eq.${link.id}`, "PATCH", { last_known_start: event.start.dateTime, last_known_end: event.end?.dateTime, updated_at: new Date().toISOString() }, "return=minimal");
            await sendPush(conn.user_id, "Calendar time change needs your review", `A session with ${booking.expert_name === conn.google_email ? "a client" : booking.expert_name} moved in Google Calendar. Review and approve it in HOBS before it updates.`);
          }
        } else {
          // Not a HOBS session -- personal/external block, or its removal.
          if (event.status === "cancelled") {
            await fetch(`${SUPABASE_URL}/rest/v1/professional_busy_blocks?professional_user_id=eq.${conn.user_id}&google_event_id=eq.${event.id}`, {
              method: "DELETE",
              headers: { apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            });
          } else if (event.start?.dateTime && event.end?.dateTime) {
            await dbWrite("professional_busy_blocks", "POST", {
              professional_user_id: conn.user_id, google_event_id: event.id,
              start_time: event.start.dateTime, end_time: event.end.dateTime, updated_at: new Date().toISOString(),
            }, "resolution=merge-duplicates,return=minimal");
          }
        }
      }

      if (data.nextSyncToken) nextSyncToken = data.nextSyncToken;
      url = data.nextPageToken
        ? `https://www.googleapis.com/calendar/v3/calendars/${conn.google_calendar_id}/events?pageToken=${data.nextPageToken}`
        : "";
    }

    if (nextSyncToken !== conn.sync_token) {
      await dbWrite(`professional_calendar_connections?user_id=eq.${conn.user_id}`, "PATCH", { sync_token: nextSyncToken }, "return=minimal");
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("google-calendar-sync error:", err);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
