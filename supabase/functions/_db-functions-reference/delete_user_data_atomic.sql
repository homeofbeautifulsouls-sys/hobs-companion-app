CREATE OR REPLACE FUNCTION public.delete_user_data_atomic(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  target_therapist_expert_name text;
begin
  -- Real, new fix, Sept 16 2026: if this account is a therapist, any real client who is
  -- currently connected to them (assigned_therapist_user_id) would otherwise block this
  -- deletion with a foreign-key violation -- confirmed directly. Clearing it here is correct
  -- and safe: it's the same real event the auto-assignment trigger already treats as "this
  -- connection is over" (a cancelled/ended booking), just reached from the therapist's side
  -- instead of the booking's.
  -- Real fix, Sept 17 2026: the same real reasoning now covers all four real professional role
  -- columns (added the same day auto-assignment was generalized beyond Therapist), not just
  -- this one -- confirmed directly, a real Psychiatrist/Doctor/Caregiver being deleted would
  -- have hit the identical foreign-key violation this was never extended to cover.
  update profiles set assigned_therapist_user_id = null where assigned_therapist_user_id = target_user_id;
  update profiles set assigned_psychiatrist_user_id = null where assigned_psychiatrist_user_id = target_user_id;
  update profiles set assigned_doctor_user_id = null where assigned_doctor_user_id = target_user_id;
  update profiles set assigned_caregiver_user_id = null where assigned_caregiver_user_id = target_user_id;
  delete from notification_recipients where user_id = target_user_id;
  delete from subtasks where user_id = target_user_id;
  delete from tasks where user_id = target_user_id;
  delete from entries where user_id = target_user_id;
  -- Real, new fix, Sept 16 2026: session_history (added the same day, for the new Session Log
  -- feature) references expert_bookings by booking_id -- confirmed directly, deleting a real
  -- account failed here with a foreign-key violation before this was added. Deletes the
  -- client's own history rows first; deletes nothing for a therapist whose old bookings get
  -- referenced (session_history.user_id is always the client, never the therapist, so this is
  -- correctly scoped and never removes another person's real record of their own sessions).
  delete from session_history where user_id = target_user_id;
  -- Real, new fix, Sept 17 2026: found by actually running the real, complete booking chain end
  -- to end and then cleaning up the real test accounts afterward, the same way the two fixes
  -- above were each found. expert_availability_slots.booked_by references auth.users directly
  -- -- confirmed directly, deleting a real client account that had ever booked a real slot
  -- failed here with a foreign-key violation. Clearing it (not deleting the slot itself) is
  -- correct: the slot's owner is the professional, not the client, and the slot itself should
  -- still exist as a real record of what was offered, just no longer marked as booked by
  -- someone who no longer exists.
  update expert_availability_slots set is_booked = false, booked_by = null where booked_by = target_user_id;
  -- Real, same-session fix: if this account is itself a therapist (or any professional) being
  -- deleted, their own posted availability slots have no other owner and should go with them --
  -- confirmed directly, these would otherwise become permanent orphan rows with no real
  -- professional behind them, silently offered forever with no one to actually take the
  -- session.
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

  -- Only ever relevant on the admin-delete-someone-else path (self-delete is blocked entirely
  -- for staff accounts before this is ever called).
  delete from calendar_change_requests where professional_user_id = target_user_id;
  delete from session_calendar_events where professional_user_id = target_user_id;
  delete from professional_busy_blocks where professional_user_id = target_user_id;

  -- SOFT-TOUCH: a coordination chat_room is built around a specific client. The room and its
  -- messages stay (a therapist's continuity-of-care record for THEIR side of things), but the
  -- reference to the now-deleted client is cleared.
  update chat_rooms set client_id = null where client_id = target_user_id;

  -- Real, second gap found and fixed Sept 16 2026, same session as the text-not-null fix above:
  -- created_by was never handled either -- confirmed directly, a real account that had ever
  -- created a chat room (now possible for a genuine client, not just an admin, since today's
  -- direct-chat fix) would fail deletion here too. Nullifying is correct and safe: created_by
  -- is nullable, and the room itself (with its real message history for the other participant)
  -- should keep existing after the creator's account is gone, same real reasoning as client_id
  -- just above.
  update chat_rooms set created_by = null where created_by = target_user_id;

  -- SOFT-TOUCH: hard-deleting chat messages would leave real gaps in other people's
  -- conversation history. Uses the app's existing "deleted" flag/rendering path instead.
  -- Real, third fix in this same real chain, Sept 16 2026: sender_id itself was never nulled,
  -- only the content -- confirmed directly, this still blocked the actual auth.users deletion
  -- with a foreign-key violation. sender_id was NOT NULL, genuinely blocking this fix, so
  -- altered the column nullable first (verified the real rendering code handles a null
  -- sender_id safely -- isMine correctly evaluates false, and the message already shows
  -- "Message deleted" from the flag above regardless of who sent it).
  update chat_messages set deleted = true, text = '', sender_id = null where sender_id = target_user_id;

  -- SOFT-TOUCH: donations are a financial/accounting record, plausibly needed for 80G tax
  -- receipt and bookkeeping purposes independent of the donor's account existing.
  update donations set user_id = null, donor_name = null where user_id = target_user_id;

  delete from profiles where user_id = target_user_id;
end;
$function$

