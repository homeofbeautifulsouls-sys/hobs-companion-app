-- delete_user_data_atomic: performs every hard-delete and soft-touch database operation for
-- account deletion inside a single Postgres function, which is inherently transactional --
-- if ANY statement here raises, everything in this function rolls back together, automatically,
-- with no partial state possible. This replaces ~20 separate, individually-unchecked delete/
-- update calls from the Edge Function that could previously fail partway through and still
-- report "Account deleted" to the person.
create or replace function delete_user_data_atomic(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from notification_recipients where user_id = target_user_id;
  delete from subtasks where user_id = target_user_id;
  delete from tasks where user_id = target_user_id;
  delete from entries where user_id = target_user_id;
  delete from expert_bookings where user_id = target_user_id;
  delete from test_results where user_id = target_user_id;
  delete from worksheet_responses where user_id = target_user_id;
  delete from who5_entries where user_id = target_user_id;
  delete from period_logs where user_id = target_user_id;
  delete from consent_agreements where user_id = target_user_id;
  delete from credit_log where user_id = target_user_id;
  delete from chat_poll_votes where user_id = target_user_id;
  delete from chat_room_members where user_id = target_user_id;
  delete from app_analytics_events where user_id = target_user_id;
  delete from error_logs where user_id = target_user_id;
  delete from app_update_reminders where user_id = target_user_id;
  delete from gcal_connect_state_tokens where user_id = target_user_id;
  delete from professional_calendar_connections where user_id = target_user_id;

  -- Only ever relevant on the admin-delete-someone-else path (self-delete is blocked entirely
  -- for staff accounts before this is ever called).
  delete from calendar_change_requests where professional_user_id = target_user_id;
  delete from session_calendar_events where professional_user_id = target_user_id;
  delete from professional_busy_blocks where professional_user_id = target_user_id;

  -- SOFT-TOUCH: a coordination chat_room is built around a specific client. The room and its
  -- messages stay (a therapist's continuity-of-care record for THEIR side of things), but the
  -- reference to the now-deleted client is cleared.
  update chat_rooms set client_id = null where client_id = target_user_id;

  -- SOFT-TOUCH: hard-deleting chat messages would leave real gaps in other people's
  -- conversation history. Uses the app's existing "deleted" flag/rendering path instead.
  update chat_messages set deleted = true, text = null where sender_id = target_user_id;

  -- SOFT-TOUCH: donations are a financial/accounting record, plausibly needed for 80G tax
  -- receipt and bookkeeping purposes independent of the donor's account existing.
  update donations set user_id = null, donor_name = null where user_id = target_user_id;

  delete from profiles where user_id = target_user_id;
end;
$$;
