# Why this workflow was disabled (July 13, 2026)

`notification-scheduler.yml` was supposed to trigger the notification-scheduler Edge Function
every 15 minutes. In practice, checked against real run history, it was only actually firing
every 3-11 hours -- GitHub silently throttles scheduled workflows far below their configured
frequency, especially for anything more frequent than roughly hourly. This is a known GitHub
Actions platform limitation, not something fixable from this repo's side.

This is why "notifications aren't releasing" -- the reminders (task nudges, mood checks,
journal prompts) were only firing a few times a day instead of at their intended times.

Replaced with a pg_cron job running directly inside the Supabase database (job name:
notification-scheduler-every-15-min), which calls the same Edge Function via pg_net's
http_post. This doesn't depend on GitHub's scheduler at all, so it isn't subject to the same
throttling. Verify it's still active and firing via:

    select jobid, jobname, schedule, active from cron.job;
    select * from cron.job_run_details order by start_time desc limit 20;

If pg_cron is ever removed or this job gets deleted, this workflow file can be restored (move
it back to .github/workflows/ and remove the .disabled extension) as a fallback -- just know its
actual real-world frequency will be much lower than "every 15 minutes" suggests.
