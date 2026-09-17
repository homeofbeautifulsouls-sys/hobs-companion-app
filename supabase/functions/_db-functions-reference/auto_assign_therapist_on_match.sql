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
  -- Real, generalized fix, Sept 16 2026, per direct instruction: the exact same real logic now
  -- applies to every real professional role (Therapist, Psychiatrist, General Physician,
  -- Peer Caregiver), not just Therapist -- this was explicitly scoped to Therapist only when
  -- first built, with a real note that the others would come in a later phase. This is that
  -- phase. Maps role_category to its own real assignment column on profiles rather than one
  -- shared column, since a client can genuinely be connected to more than one kind of
  -- professional at once (a Therapist AND a Psychiatrist, say).
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
    if professional_id is not null then
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

