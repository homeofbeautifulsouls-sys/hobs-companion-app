-- Real gap found while testing: a regular support-group member legitimately needs to see their
-- group's facilitator's real name (the whole point of the earlier fix was that facilitators
-- aren't the ones being protected by aliasing), but profiles RLS had no policy allowing any
-- cross-user read except admin-sees-all and therapist-sees-own-clients -- so the lookup was
-- silently blocked and fell back to a generic placeholder. Adds a narrow, purpose-specific
-- policy: a user can see another profile's name specifically if that other person is an
-- admin/co_admin in a chat room the viewer is also a joined member of.
create or replace function is_room_facilitator_visible_to_viewer(target_user_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from chat_room_members facilitator_row
    join chat_room_members viewer_row on viewer_row.room_id = facilitator_row.room_id
    where facilitator_row.user_id = target_user_id
      and facilitator_row.role in ('admin', 'co_admin')
      and facilitator_row.status = 'joined'
      and viewer_row.user_id = auth.uid()
      and viewer_row.status = 'joined'
  );
$$;

create policy "Group members can see their facilitator's profile" on profiles
  for select using (is_room_facilitator_visible_to_viewer(user_id));
