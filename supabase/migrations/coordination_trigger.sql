-- Auto-creates/maintains ONE coordination room per client, with every professional who has an
-- active connection to that client as a member -- a genuine group for coordinating around a
-- shared client, not a proliferation of separate pairwise rooms. Fires whenever a booking
-- becomes active; finds (or creates) that client's coordination room and ensures the newly-
-- connected professional is a member of it. Per direct instruction: this is fully automatic,
-- no separate consent gate, since coordinating on shared clients is already standard practice --
-- disclosure lives in the consent flow instead, not as a runtime blocker here.
create or replace function maintain_coordination_room()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  therapist_user_id uuid;
  coord_room_id uuid;
begin
  if new.status != 'active' then
    return new;
  end if;

  select user_id into therapist_user_id from profiles
  where therapist_expert_name = new.expert_name and is_therapist = true
  limit 1;

  if therapist_user_id is null then
    return new;
  end if;

  -- Only worth a coordination room once at least 2 professionals share this client -- check
  -- for other active connections for this same client before creating anything.
  if not exists (
    select 1 from expert_bookings b2
    join profiles p2 on p2.therapist_expert_name = b2.expert_name and p2.is_therapist = true
    where b2.user_id = new.user_id and b2.status = 'active' and p2.user_id != therapist_user_id
  ) then
    return new;
  end if;

  select id into coord_room_id from chat_rooms
  where type = 'coordination' and client_id = new.user_id and not archived
  limit 1;

  if coord_room_id is null then
    insert into chat_rooms (type, name, created_by, client_id)
    values ('coordination', 'Care coordination', therapist_user_id, new.user_id)
    returning id into coord_room_id;
  end if;

  -- Add this therapist if not already a member
  insert into chat_room_members (room_id, user_id, role, status, joined_at)
  values (coord_room_id, therapist_user_id, 'member', 'joined', now())
  on conflict (room_id, user_id) do nothing;

  -- Also make sure every OTHER professional connected to this client is a member too, in case
  -- the room is newly created and others were already connected before this trigger fired.
  insert into chat_room_members (room_id, user_id, role, status, joined_at)
  select coord_room_id, p2.user_id, 'member', 'joined', now()
  from expert_bookings b2
  join profiles p2 on p2.therapist_expert_name = b2.expert_name and p2.is_therapist = true
  where b2.user_id = new.user_id and b2.status = 'active'
  on conflict (room_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_maintain_coordination_room on expert_bookings;
create trigger trg_maintain_coordination_room
  after insert or update of status on expert_bookings
  for each row execute function maintain_coordination_room();
