CREATE OR REPLACE FUNCTION public.auto_assign_therapist_on_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  therapist_id uuid;
begin
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

  -- Real, second real gap fixed here, Sept 16 2026: the real disconnect/change-approval flow
  -- (an admin approving a cancellation request) sets status to 'cancelled' directly, but
  -- nothing ever cleared assigned_therapist_user_id when that happened -- confirmed as a real
  -- bug, found while fixing the disconnect button itself. Clears the connection the moment a
  -- Therapist booking becomes genuinely cancelled, matching the real event this field is
  -- actually meant to track, the same as the 'active' case above.
  if new.role_category = 'Therapist' and new.status = 'cancelled'
     and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    update profiles set assigned_therapist_user_id = null
    where user_id = new.user_id and assigned_therapist_user_id = (
      select p2.user_id from profiles p2 where p2.is_therapist = true and p2.therapist_expert_name = new.expert_name limit 1
    );
  end if;

  return new;
end;
$function$

