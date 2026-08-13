-- consume_gcal_state_token: atomically checks and marks a Google Calendar OAuth state token as
-- used in a single statement, closing a real race condition where the previous fetch-then-update
-- pattern (SELECT to check unused, then a separate UPDATE) could let two simultaneous requests
-- both observe used = false before either had written true, both passing the check.
--
-- Called from google-calendar-oauth using the service-role key (not exposed directly to end-
-- user JWTs), so no separate caller-identity check is needed here the way reserve_availability_
-- slot needed one -- this function's own SQL is the entire trust boundary.
create or replace function consume_gcal_state_token(token_value uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_user_id uuid;
begin
  update gcal_connect_state_tokens
  set used = true
  where token = token_value and used = false and expires_at > now()
  returning user_id into result_user_id;

  return result_user_id; -- null if no matching, still-valid, not-yet-used row existed
end;
$$;
