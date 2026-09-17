CREATE OR REPLACE FUNCTION public.record_session_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Real, new table and trigger, Sept 16 2026: expert_bookings has exactly one row per real
  -- client-therapist relationship, and session_date gets directly overwritten every time a new
  -- session is scheduled (confirmed directly -- six separate real code paths do this, not one)
  -- -- meaning there was genuinely no permanent record of past sessions anywhere. This preserves
  -- one real, permanent row the moment any of those six paths actually sets a real session date,
  -- rather than hooking into each path individually (fragile, easy to miss one -- exactly the
  -- kind of inconsistency that caused real, repeated problems earlier in this same session).
  if new.session_date is not null and (old.session_date is null or old.session_date is distinct from new.session_date) then
    insert into session_history (user_id, booking_id, expert_name, role_category, session_date)
    values (new.user_id, new.id, new.expert_name, new.role_category, new.session_date);
  end if;
  return new;
end;
$function$

