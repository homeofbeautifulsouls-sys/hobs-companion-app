-- Real bug found and fixed: is_chat_room_member() only recognizes 'joined' status, which
-- correctly gates actual message access, but the SAME function was also gating the chat_rooms
-- SELECT policy -- meaning someone with a pending 'invited' row couldn't even see the room's
-- own name/type, so their invite silently failed to render in the chat list (the nested join
-- came back null and got filtered out). Rooms need to be visible to anyone with ANY
-- chat_room_members row (joined OR invited), while message access stays gated to joined only.
create or replace function is_chat_room_participant(check_room_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from chat_room_members
    where room_id = check_room_id and user_id = auth.uid() and status in ('joined', 'invited')
  );
$$;

drop policy if exists "Members and admins can view chat rooms" on chat_rooms;
create policy "Members and admins can view chat rooms" on chat_rooms
  for select using (is_chat_room_participant(id) or is_admin_user());
