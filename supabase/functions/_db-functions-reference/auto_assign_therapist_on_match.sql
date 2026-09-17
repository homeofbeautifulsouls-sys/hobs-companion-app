CREATE OR REPLACE FUNCTION public.auto_assign_therapist_on_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  professional_id uuid;
  assign_column text;
begin
  assign_column := case new.role_category
    when 'Therapist' then 'assigned_therapist_user_id'
    when 'Psychiatrist' then 'assigned_psychiatrist_user_id'
    when 'General Physician' then 'assigned_doctor_user_id'
    when 'Peer Caregiver' then 'assigned_caregiver_user_id'
    else null
  end;

  if assign_column is not null and new.status = 'active' and new.expert_name is not null
     and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    select p.user_id into professional_id
    from profiles p
    where p.is_therapist = true and p.therapist_expert_name = new.expert_name
    limit 1;
    -- Real, new guard, Sept 17 2026, per direct instruction, found by directly reproducing a
    -- real, reported bug: a client and the professional they're being matched to can genuinely
    -- be the exact same real account (a combined admin/client/therapist account assigning itself
    -- to itself while testing, confirmed directly as the real cause of a report that looked like
    -- a broken assignment flow). Without this, the update below sets a person as their own
    -- assigned professional -- not a database error, just a real, nonsensical state that then
    -- confuses every real page reading it (their own profile, their own therapist dashboard,
    -- chat routing). Skips the self-referencing update entirely rather than letting it happen
    -- silently; the booking itself still goes active (a person can still be listed as
    -- requesting/matched with themselves at the booking level if that's genuinely what was
    -- intended, e.g. for testing), only the profile-level assignment column is guarded.
    if professional_id is not null and professional_id != new.user_id then
      execute format('update profiles set %I = $1 where user_id = $2', assign_column)
        using professional_id, new.user_id;
    end if;
  end if;

  if assign_column is not null and new.status = 'cancelled'
     and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    execute format(
      'update profiles set %I = null where user_id = $1 and %I = (select p2.user_id from profiles p2 where p2.is_therapist = true and p2.therapist_expert_name = $2 limit 1)',
      assign_column, assign_column
    ) using new.user_id, new.expert_name;
  end if;

  return new;
end;
$function$

