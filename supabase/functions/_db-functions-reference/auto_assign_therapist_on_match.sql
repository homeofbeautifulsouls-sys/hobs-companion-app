CREATE OR REPLACE FUNCTION public.auto_assign_therapist_on_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  therapist_id uuid;
begin
  -- Real, corrected fix, Sept 16 2026: "matched" is status = 'active' on expert_bookings --
  -- set the moment an admin assigns a pending request to a specific therapist, via
  -- assignPendingBooking(), completely independent of payment. The original version of this
  -- auto-assignment logic waited for a confirmed, paid booking instead, which was a genuine,
  -- direct misunderstanding of this app's own real business logic, confirmed and corrected
  -- directly: a real "matched" booking can sit with payment_confirmed = false for a real
  -- while, and the client-therapist connection should exist from the real moment of matching,
  -- not payment. A real trigger, not just a webhook hook, so this fires correctly no matter
  -- which code path actually sets status to 'active' -- not just one specific client function.
  if new.role_category = 'Therapist' and new.status = 'active' and new.expert_name is not null
     and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    select p.user_id into therapist_id
    from profiles p
    where p.is_therapist = true and p.therapist_expert_name = new.expert_name
    limit 1;
    if therapist_id is not null then
      update profiles set assigned_therapist_user_id = therapist_id where user_id = new.user_id;
    end if;
  end if;
  return new;
end;
$function$

