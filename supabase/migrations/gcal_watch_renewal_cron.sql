select cron.schedule(
  'google-calendar-watch-renewal',
  '0 */6 * * *',
  $$select net.http_post(
    url := 'https://adjvptkzyckkvewbfmzf.supabase.co/functions/v1/google-calendar-sync',
    headers := jsonb_build_object('Content-Type','application/json','x-scheduler-secret', current_setting('app.scheduler_secret', true)),
    body := '{"action":"renew_watches"}'::jsonb
  );$$
);
