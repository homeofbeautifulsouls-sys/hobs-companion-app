// Sends an automated poll from Bob into every active support group, once per scheduled run.
// Called by a cron job (twice daily -- morning and evening slots) plus occasional themed
// variety. Content researched from real group-therapy check-in practice (mood-as-color,
// energy 1-10, one-word check-ins, small self-care acts) rather than generic small talk --
// and politics deliberately kept as light hypotheticals, never real partisan opinion, given
// this runs inside a peer support space where the point is feeling safe, not divided.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BOB_USER_ID = "b71ff181-8624-4644-9208-dc576c5b6f1b";
const SCHEDULER_SECRET = Deno.env.get("SCHEDULER_SECRET");

type PromptDef = { key: string; theme: string; question: string; options: string[] };

// "daily_goals" and "daily_reflection" are the two anchors -- sent every single day,
// morning and evening. Everything else rotates through the library without repeating in the
// same room until the set is exhausted.
const DAILY_GOALS: PromptDef = {
  key: "daily_goals", theme: "daily_goals",
  question: "🌅 Morning check-in from Bob: what's one goal for today?",
  options: ["Just get through it, gently", "One small task done", "Reach out to someone", "Move my body a little", "Rest, actually rest"],
};
const DAILY_REFLECTION: PromptDef = {
  key: "daily_reflection", theme: "daily_reflection",
  question: "🌙 Evening check-in from Bob: how was today, really?",
  options: ["Rough, but I made it", "Okay — nothing special", "Better than I expected", "Genuinely good", "Still figuring that out"],
};

// Rotating variety, one theme at a time so the group isn't flooded -- researched from real
// group-therapy icebreaker practice (mood-as-color, energy scale, gratitude, one-word check-in).
const VARIETY_PROMPTS: PromptDef[] = [
  { key: "mood_color", theme: "mental_health", question: "If your mood today was a color, what would it be?", options: ["Soft grey", "Warm yellow", "Deep blue", "Bright orange", "Something in between"] },
  { key: "energy_scale", theme: "mental_health", question: "Energy check — where are you today, 1 to 10?", options: ["1-3, running on empty", "4-6, getting by", "7-8, pretty good", "9-10, genuinely great"] },
  { key: "self_care", theme: "mental_health", question: "One small act of self-care you managed this week?", options: ["Slept properly", "Ate a real meal", "Said no to something", "Talked to someone", "Honestly, none yet — and that's okay"] },
  { key: "one_word", theme: "mental_health", question: "One word for how you're feeling right now?", options: ["Tired", "Hopeful", "Numb", "Okay", "Something else"] },

  { key: "silly_superpower", theme: "funny", question: "Useless superpower you'd actually want?", options: ["Always finding a parking spot", "Never losing chargers", "Perfect autocorrect", "Instant nap mode", "Knowing what's for dinner before anyone asks"] },
  { key: "cartoon_therapist", theme: "funny", question: "Which cartoon character would make the best therapist?", options: ["Winnie the Pooh", "SpongeBob", "Bugs Bunny", "Charlie Brown", "Someone else entirely"] },
  { key: "weird_talent", theme: "funny", question: "What's a weirdly specific thing you're good at?", options: ["Guessing song lyrics wrong confidently", "Finding the best parking spot", "Remembering useless facts", "Making people laugh at the wrong time", "I genuinely don't know"] },

  { key: "focus_style", theme: "productivity", question: "What actually gets you focused?", options: ["A messy to-do list", "Total silence", "Background noise/music", "A deadline breathing down my neck", "Nothing, let's be honest"] },
  { key: "procrastination", theme: "productivity", question: "Your go-to procrastination move?", options: ["Reorganizing something pointless", "Scrolling", "Suddenly cleaning", "Snacking", "Staring into space"] },
  { key: "morning_or_night", theme: "productivity", question: "Are you a morning person or a night owl, honestly?", options: ["Morning, no contest", "Night, always", "Neither, I'm just tired", "Depends entirely on the week"] },

  { key: "pm_for_a_day", theme: "politics", question: "If you ran the country for one day, first thing you'd change?", options: ["Free therapy for everyone", "Longer weekends", "Better public transport", "Cheaper everything", "Something completely random"] },
  { key: "new_holiday", theme: "politics", question: "You get to invent one new national holiday — what is it?", options: ["National Nap Day", "Do Nothing Day", "Say Thank You Day", "Everyone Gets Ice Cream Day", "I have a better idea"] },

  { key: "space_or_ocean", theme: "science", question: "Would you rather explore deep space or the deep ocean?", options: ["Space, obviously", "Ocean, no contest", "Neither, terrifying either way", "Both, sign me up"] },
  { key: "time_travel", theme: "science", question: "If time travel were real, past or future?", options: ["Past, I have questions", "Future, show me what's coming", "Neither, I like now", "Depends on the day"] },
  { key: "brain_fact", theme: "science", question: "True or false: your brain uses about 20% of your body's energy, even resting.", options: ["True", "False", "No idea, but now I want to know"] },
];

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
      apikey: SUPABASE_SERVICE_ROLE_KEY ?? "", Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  // return=minimal produces an empty body by design -- parsing it as JSON throws, so this
  // only attempts to parse when there's actually content to parse.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function pickPromptForRoom(roomId: string, anchor: PromptDef | null): Promise<PromptDef | null> {
  if (anchor) {
    // Anchors are meant to repeat daily, but never twice in the same day -- guards against an
    // accidental duplicate send if the cron fires more than once or gets retriggered manually.
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const recent = await dbFetch(`chat_poll_history?room_id=eq.${roomId}&prompt_key=eq.${anchor.key}&sent_at=gte.${todayStart.toISOString()}&select=id`);
    if (Array.isArray(recent) && recent.length > 0) return null; // already sent today, skip
    return anchor;
  }
  const history = await dbFetch(`chat_poll_history?room_id=eq.${roomId}&select=prompt_key`);
  const usedKeys = new Set((Array.isArray(history) ? history : []).map((h: any) => h.prompt_key));
  const unused = VARIETY_PROMPTS.filter((p) => !usedKeys.has(p.key));
  const pool = unused.length > 0 ? unused : VARIETY_PROMPTS; // once exhausted, start the cycle over
  return pool[Math.floor(Math.random() * pool.length)];
}

async function sendPollToRoom(roomId: string, prompt: PromptDef) {
  const messageRows = await dbWrite("chat_messages", "POST", {
    room_id: roomId, sender_id: BOB_USER_ID, text: prompt.question, message_type: "poll",
  });
  const messageId = Array.isArray(messageRows) ? messageRows[0]?.id : null;

  const pollRows = await dbWrite("chat_polls", "POST", {
    room_id: roomId, message_id: messageId, question: prompt.question, theme: prompt.theme, sent_by: "bob",
  });
  const pollId = Array.isArray(pollRows) ? pollRows[0]?.id : null;
  if (!pollId) return;

  await dbWrite(`chat_messages?id=eq.${messageId}`, "PATCH", { poll_id: pollId }, "return=minimal");

  await dbWrite("chat_poll_options", "POST",
    prompt.options.map((opt, i) => ({ poll_id: pollId, option_text: opt, display_order: i })),
    "return=minimal"
  );

  await dbWrite("chat_poll_history?on_conflict=room_id,prompt_key", "POST", { room_id: roomId, prompt_key: prompt.key, sent_at: new Date().toISOString() }, "resolution=merge-duplicates,return=minimal");
}

Deno.serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-scheduler-secret" };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const schedulerSecret = req.headers.get("x-scheduler-secret");
    if (schedulerSecret !== SCHEDULER_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const slot = body.slot; // 'morning' | 'evening' | 'variety'
    const anchor = slot === "morning" ? DAILY_GOALS : slot === "evening" ? DAILY_REFLECTION : null;

    const rooms = await dbFetch(`chat_rooms?type=eq.support_group&archived=eq.false&select=id`);
    const results = [];
    for (const room of (Array.isArray(rooms) ? rooms : [])) {
      const prompt = await pickPromptForRoom(room.id, anchor);
      if (!prompt) { results.push({ room_id: room.id, skipped: "already sent today" }); continue; }
      await sendPollToRoom(room.id, prompt);
      results.push({ room_id: room.id, prompt_key: prompt.key });
    }

    return new Response(JSON.stringify({ sent: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("send-group-poll error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong.", detail: String(err), stack: err instanceof Error ? err.stack : null }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
