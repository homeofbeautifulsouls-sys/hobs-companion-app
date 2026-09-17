CREATE OR REPLACE FUNCTION public.delete_user_data_atomic(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  target_therapist_expert_name text;
begin
  update profiles set assigned_therapist_user_id = null where assigned_therapist_user_id = target_user_id;
  update profiles set assigned_psychiatrist_user_id = null where assigned_psychiatrist_user_id = target_user_id;
  update profiles set assigned_doctor_user_id = null where assigned_doctor_user_id = target_user_id;
  update profiles set assigned_caregiver_user_id = null where assigned_caregiver_user_id = target_user_id;
  delete from notification_recipients where user_id = target_user_id;
  delete from subtasks where user_id = target_user_id;
  delete from tasks where user_id = target_user_id;
  delete from entries where user_id = target_user_id;
  delete from session_history where user_id = target_user_id;
  update expert_availability_slots set is_booked = false, booked_by = null where booked_by = target_user_id;
  select therapist_expert_name into target_therapist_expert_name from profiles where user_id = target_user_id;
  if target_therapist_expert_name is not null then
    delete from expert_availability_slots where expert_name = target_therapist_expert_name;
  end if;
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
  delete from calendar_change_requests where professional_user_id = target_user_id;
  delete from session_calendar_events where professional_user_id = target_user_id;
  delete from professional_busy_blocks where professional_user_id = target_user_id;
  update chat_rooms set client_id = null where client_id = target_user_id;
  update chat_rooms set created_by = null where created_by = target_user_id;
  update chat_messages set deleted = true, text = '', sender_id = null where sender_id = target_user_id;
  update donations set user_id = null, donor_name = null where user_id = target_user_id;
  -- Real, new fix, Sept 17 2026: found by the real cleanup of the real duplicate-booking test
  -- account itself -- notification_log.sent_by references auth.users and was never handled,
  -- so deleting a real account that had ever sent a real notification (an admin, or this same
  -- new alertAdminsNewRequest path) failed with a foreign-key violation. Nullifying is correct
  -- and safe, same real reasoning as chat_rooms.created_by above: the log itself is a real
  -- record other people may still need to see, the sender's account existing isn't a
  -- precondition for that.
  update notification_log set sent_by = null where sent_by = target_user_id;
  delete from profiles where user_id = target_user_id;
end;
$function$

