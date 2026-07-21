create or replace function trigger_sync_test_result_to_hubspot()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform net.http_post(
    url := 'https://adjvptkzyckkvewbfmzf.supabase.co/functions/v1/sync-test-result-to-hubspot',
    headers := jsonb_build_object('Content-Type','application/json','x-scheduler-secret','7NOJoo-vo4Is57o8K_BcOXJMnkYqJB0A_sMM8L1p52E'),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'test_key', new.test_key,
      'elevated', new.elevated,
      'self_harm_flagged', new.self_harm_flagged,
      'created_at', new.created_at
    )
  );
  return new;
end;
$function$;

drop trigger if exists trg_sync_test_result_to_hubspot on test_results;
create trigger trg_sync_test_result_to_hubspot
  after insert on test_results
  for each row execute function trigger_sync_test_result_to_hubspot();
