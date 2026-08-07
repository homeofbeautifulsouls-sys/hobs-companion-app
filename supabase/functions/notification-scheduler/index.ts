// notification-scheduler
//
// Invoked every 15 minutes by pg_cron (via pg_net). For every user with push notifications
// enabled, computes THEIR local time (from profiles.timezone) and checks whether any of the
// four recurring notification types are due right now, in their timezone -- not a fixed
// server timezone. This is what makes "9pm journaling reminder" mean 9pm for each person,
// not 9pm IST for everyone.
//
// Recurring types and their rules:
//   book_session   - Sunday & Thursday, ~10:00 local. Sunday checks the upcoming Mon-Sat week;
//                    Thursday checks the current (already-started) Mon-Sat week. Only sent if
//                    they have no booking in that window.
//   task_add_reminder - ~10:00 and ~13:00 local. A gentle nudge to add tasks (framed around
//                    earning credits toward therapy). Only if they haven't added any tasks yet
//                    today, so it doesn't nag someone who's already planned their day.
//   task_complete_reminder - ~17:00 and ~20:00 local. A nudge to mark off what they've gotten
//                    done. Only if they have incomplete tasks for today.
//   mood_check     - ~15:00 local. Only if they haven't logged a mood yet today.
//   journal_reminder - ~21:00 local, every day, unconditionally (per explicit product decision).
//
// Global rule: no user receives more than one notification within any 3-hour window, across
// ALL types combined (not just within a type) -- this applies automatically to the new task
// times too via the same shared check, so e.g. a 10am task-add reminder correctly blocks a
// 10am book_session reminder from also firing, and vice versa, without any extra bookkeeping.
//
// Every notification type gets a single notification_log row per run (a "batch"), with one
// notification_recipients row per person who actually got sent something -- so the admin
// dashboard sees one logical send with many recipients, not hundreds of individual log rows.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIREBASE_PROJECT_ID = "hobs-companion";
const SA_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const SA_PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET")!; // shared secret so only pg_cron can trigger this

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
  const keyData = SA_PRIVATE_KEY.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(toSign));
  const jwt = `${toSign}.${base64url(signature)}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) throw new Error("FCM token exchange failed: " + JSON.stringify(tokenJson));
  return tokenJson.access_token;
}

async function sendToToken(accessToken: string, token: string, title: string, body: string, data?: Record<string, string>) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title, body }, data: data || {}, android: { priority: "high" } } }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: json };
}

// ---- Timezone-local date/time helpers ----
// Returns { hour, minute, weekday (0=Sun..6=Sat), dateKey ('YYYY-MM-DD') } for "now" in the given IANA tz.
function localNow(tz: string, referenceDate: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
  });
  const parts: Record<string, string> = {};
  fmt.formatToParts(referenceDate).forEach((p) => (parts[p.type] = p.value));
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
    weekday: weekdayMap[parts.weekday],
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}
function inWindow(local: { hour: number; minute: number }, targetHour: number): boolean {
  // Fires once, in the first 15 minutes of the target hour (this function runs every 15 min).
  return local.hour === targetHour && local.minute < 15;
}
// Returns the Mon-Sat date range (as 'YYYY-MM-DD' strings) containing today, per the given local date.
function mondayToSaturdayRange(dateKey: string, weekday: number): { start: string; end: string } {
  const d = new Date(dateKey + "T00:00:00Z");
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday; // Sunday counts as "before" this Mon-Sat block
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmt(monday), end: fmt(saturday) };
}
// For Sunday specifically, we check the *upcoming* Mon-Sat (starting tomorrow), not the one that just ended.
function upcomingMondayToSaturdayRange(dateKey: string): { start: string; end: string } {
  const d = new Date(dateKey + "T00:00:00Z");
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + 1); // Sunday + 1 = Monday
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmt(monday), end: fmt(saturday) };
}

// ---- Mascot-voice copy for each notification type ----
const COPY: Record<string, { title: string; body: string }> = {
  book_session: {
    title: "Bob here 🐘",
    body: "No pressure at all — but if you'd like some company this week, I'd love to help you find a time. Tap whenever feels right.",
  },
  task_add_reminder: {
    title: "Bob here 🐘",
    body: "Got a minute? Adding even one small task to today earns you a little credit toward therapy — no pressure, just an easy way to start.",
  },
  task_complete_reminder: {
    title: "Cookie here 🐕",
    body: "However today's gone, want to check off anything you've actually gotten done? Even the small stuff counts.",
  },
  mood_check: {
    title: "Bob here 🐘",
    body: "How are you doing right now? No wrong answer — just curious how today's feeling for you.",
  },
  journal_reminder: {
    title: "Kunnu here 🐾",
    body: "Come sit with me for a minute? However today went, it might feel good to get it down before you rest.",
  },
};
// REAL BUG FOUND AND FIXED: app_update used to be handled here too, firing independently at
// 9am in each user's local timezone -- completely unaware of the separate, dedicated
// send-apk-update-notification daily cron (fixed 6am UTC), which has its own proper per-release
// dedup via app_update_reminders. Neither system knew the other existed, so every eligible user
// was getting the "update available" push twice, every day. Removed here entirely -- the
// dedicated cron is the more purpose-built system (tracks per-release history correctly, stops
// once someone actually updates) and should be the single source of truth for this type.

async function alreadyNotifiedToday(admin: any, userId: string, type: string, sinceIso: string): Promise<boolean> {
  const { data } = await admin
    .from("notification_recipients")
    .select("id, notification_log!inner(notification_type)")
    .eq("user_id", userId)
    .eq("notification_log.notification_type", type)
    .gte("sent_at", sinceIso)
    .limit(1);
  return !!(data && data.length > 0);
}

async function withinLastThreeHours(admin: any, userId: string, referenceDate: Date): Promise<boolean> {
  const threeHoursAgo = new Date(referenceDate.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("notification_recipients")
    .select("id")
    .eq("user_id", userId)
    .gte("sent_at", threeHoursAgo)
    .limit(1);
  return !!(data && data.length > 0);
}

Deno.serve(async (req) => {
  // Only pg_cron (via pg_net, carrying this shared secret) should ever be able to trigger this.
  const providedSecret = req.headers.get("x-scheduler-secret");
  if (providedSecret !== SCHEDULER_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Optional debug override (e.g. {"debugNow": "2026-07-16T09:05:00Z"}) so specific moments can be
  // simulated without waiting for a real matching local time -- useful for testing and for
  // investigating "why didn't X get sent on date Y" after the fact. Only reachable with the secret above.
  let debugNow: Date | null = null;
  if (req.headers.get("content-length") && req.headers.get("content-length") !== "0") {
    try {
      const body = await req.clone().json();
      if (body?.debugNow) debugNow = new Date(body.debugNow);
    } catch { /* no body or not JSON -- normal cron-triggered case, ignore */ }
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = debugNow || new Date();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("user_id, push_token, timezone, notifications_enabled, notifications_paused_until, app_version_code")
    .not("push_token", "is", null);
  if (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }

  const eligibleProfiles = (profiles || []).filter((p: any) => {
    if (p.notifications_enabled === false) return false;
    if (p.notifications_paused_until && new Date(p.notifications_paused_until) > now) return false;
    return true;
  });

  // Figure out which (user, type) pairs are due right now, in each user's own local time.
  const dueByType: Record<string, string[]> = { book_session: [], task_add_reminder: [], task_complete_reminder: [], mood_check: [], journal_reminder: [] };

  for (const p of eligibleProfiles) {
    const tz = p.timezone || "Asia/Kolkata";
    let local;
    try {
      local = localNow(tz, now);
    } catch {
      local = localNow("Asia/Kolkata", now); // bad/unrecognized timezone string -- fall back rather than skip the user entirely
    }

    if ((local.weekday === 0 || local.weekday === 4) && inWindow(local, 10)) {
      dueByType.book_session.push(p.user_id);
    }
    if (inWindow(local, 10) || inWindow(local, 13)) {
      dueByType.task_add_reminder.push(p.user_id);
    }
    if (inWindow(local, 17) || inWindow(local, 20)) {
      dueByType.task_complete_reminder.push(p.user_id);
    }
    if (inWindow(local, 15)) {
      dueByType.mood_check.push(p.user_id);
    }
    if (inWindow(local, 21)) {
      dueByType.journal_reminder.push(p.user_id);
    }
  }

  const profileById = new Map(eligibleProfiles.map((p: any) => [p.user_id, p]));
  const summary: Record<string, any> = {};
  let accessToken: string | null = null;

  for (const type of Object.keys(dueByType)) {
    const candidateIds = dueByType[type];
    if (candidateIds.length === 0) { summary[type] = { candidates: 0, sent: 0 }; continue; }

    const finalTargets: string[] = [];
    for (const userId of candidateIds) {
      // Dedup: already got this exact type sent today (their local day)? Skip.
      const tz = (profileById.get(userId) as any)?.timezone || "Asia/Kolkata";
      const local = localNow(tz, now);
      const sinceIso = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(); // conservative 20h lookback covers "today" regardless of tz math edge cases
      if (await alreadyNotifiedToday(admin, userId, type, sinceIso)) continue;

      // Global 3-hour spacing rule, across all types.
      if (await withinLastThreeHours(admin, userId, now)) continue;

      // Per-type conditional check.
      if (type === "book_session") {
        const range = local.weekday === 0 ? upcomingMondayToSaturdayRange(local.dateKey) : mondayToSaturdayRange(local.dateKey, local.weekday);
        const dayAfterEnd = new Date(range.end + "T00:00:00Z");
        dayAfterEnd.setUTCDate(dayAfterEnd.getUTCDate() + 1);
        const { data: bookings } = await admin
          .from("expert_bookings")
          .select("id")
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .gte("session_date", range.start)
          .lt("session_date", dayAfterEnd.toISOString().slice(0, 10))
          .limit(1);
        if (bookings && bookings.length > 0) continue; // already booked for that week
      } else if (type === "task_add_reminder") {
        const { data: anyTasks } = await admin
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .eq("date_key", local.dateKey)
          .limit(1);
        if (anyTasks && anyTasks.length > 0) continue; // already added something today, no need to nudge
      } else if (type === "task_complete_reminder") {
        const { data: incompleteTasks } = await admin
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .eq("date_key", local.dateKey)
          .eq("done", false)
          .limit(1);
        if (!incompleteTasks || incompleteTasks.length === 0) continue; // nothing outstanding today
      } else if (type === "mood_check") {
        const { data: entries } = await admin
          .from("entries")
          .select("id")
          .eq("user_id", userId)
          .neq("moods", "[]")
          .gte("created_at", sinceIso)
          .limit(1);
        if (entries && entries.length > 0) continue; // already logged a mood today
      }
      // journal_reminder: unconditional, no extra check.

      finalTargets.push(userId);
    }

    if (finalTargets.length === 0) { summary[type] = { candidates: candidateIds.length, sent: 0 }; continue; }

    if (!accessToken) accessToken = await getFcmAccessToken();
    const copy = COPY[type];

    const { data: logRow, error: logErr } = await admin
      .from("notification_log")
      .insert({
        notification_type: type, title: copy.title, body: copy.body,
        data: { type }, sent_by: null, target_type: "segment",
        target_description: `Automated ${type} reminder (timezone-local batch)`,
      })
      .select("id").single();
    if (logErr) { summary[type] = { error: String(logErr) }; continue; }

    let sentCount = 0;
    for (const userId of finalTargets) {
      const token = (profileById.get(userId) as any)?.push_token;
      if (!token) continue;
      const notifData: Record<string, string> = { type, notification_id: logRow.id };
      const result = await sendToToken(accessToken, token, copy.title, copy.body, notifData);
      await admin.from("notification_recipients").insert({
        notification_id: logRow.id, user_id: userId,
        fcm_ok: result.ok, fcm_status: result.status,
      });
      if (result.ok) sentCount++;
      else {
        const errCode = (result.body as any)?.error?.status;
        if (errCode === "NOT_FOUND" || errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT") {
          await admin.from("profiles").update({ push_token: null }).eq("user_id", userId);
        }
      }
    }
    summary[type] = { candidates: candidateIds.length, sent: sentCount };
  }

  return new Response(JSON.stringify({ ranAt: now.toISOString(), summary }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
