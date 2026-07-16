-- Breaks the recursion that would otherwise happen if chat_room_members' own RLS policy tried
-- to query chat_room_members directly to check membership -- same lesson already learned
-- elsewhere in this project (RLS recursive policies need SECURITY DEFINER functions).
create or replace function is_chat_room_member(check_room_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from chat_room_members
    where room_id = check_room_id and user_id = auth.uid() and status = 'joined'
  );
$$;

create or replace function is_chat_room_admin(check_room_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from chat_room_members
    where room_id = check_room_id and user_id = auth.uid()
      and status = 'joined' and role in ('admin', 'co_admin')
  ) or is_admin_user();
$$;

-- Resolves whether two users currently have an active professional<->client connection --
-- reuses the exact same expert_bookings + profiles.therapist_expert_name matching pattern
-- already established elsewhere in this app, rather than inventing a new relationship model.
-- Used both to gate direct-chat creation and to detect coordination-room triggers.
create or replace function users_have_active_connection(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(
    select 1 from expert_bookings b
    join profiles p on p.therapist_expert_name = b.expert_name and p.is_therapist = true
    where b.status = 'active'
      and ((b.user_id = user_a and p.user_id = user_b) or (b.user_id = user_b and p.user_id = user_a))
  );
$$;
