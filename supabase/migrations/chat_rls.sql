alter table chat_rooms enable row level security;
alter table chat_room_members enable row level security;
alter table chat_messages enable row level security;

-- chat_rooms: visible to members and admins; any authenticated user can create one (the actual
-- gating on WHO may create WHAT type of room -- e.g. only admin creates support groups -- is
-- enforced in application/Edge Function logic, since it depends on role and room type together
-- in ways a single row-level check can't cleanly express)
create policy "Members and admins can view chat rooms" on chat_rooms
  for select using (is_chat_room_member(id) or is_admin_user());
create policy "Authenticated users can create chat rooms" on chat_rooms
  for insert with check (auth.uid() = created_by);
create policy "Room admins can update chat rooms" on chat_rooms
  for update using (is_chat_room_admin(id));

-- chat_room_members: a member can see the full member list of their own rooms; a user can
-- always see their own membership rows (including pending invites, before they've joined)
create policy "Members can view their room's member list" on chat_room_members
  for select using (is_chat_room_member(room_id) or user_id = auth.uid() or is_admin_user());
create policy "Room admins can add members" on chat_room_members
  for insert with check (is_chat_room_admin(room_id) or is_admin_user());
create policy "Room admins or the member themselves can update membership" on chat_room_members
  for update using (is_chat_room_admin(room_id) or user_id = auth.uid() or is_admin_user());

-- chat_messages: only joined members can read or send; soft-delete only by the sender or an admin
create policy "Members can view messages in their rooms" on chat_messages
  for select using (is_chat_room_member(room_id) or is_admin_user());
create policy "Members can send messages in their rooms" on chat_messages
  for insert with check (is_chat_room_member(room_id) and sender_id = auth.uid());
create policy "Senders and admins can update (soft-delete) messages" on chat_messages
  for update using (sender_id = auth.uid() or is_chat_room_admin(room_id) or is_admin_user());
