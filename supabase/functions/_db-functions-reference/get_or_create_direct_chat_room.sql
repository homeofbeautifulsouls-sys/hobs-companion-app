CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat_room(other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  my_id uuid := auth.uid();
  existing_room_id uuid;
  new_room_id uuid;
  really_connected boolean;
begin
  if my_id is null then
    raise exception 'Not authenticated';
  end if;
  if my_id = other_user_id then
    raise exception 'Cannot start a direct chat with yourself';
  end if;

  -- Real, deliberate safety check, same real logic already used elsewhere (RLS's own
  -- users_have_active_connection) plus an admin exception -- this function runs with elevated
  -- privileges specifically to solve the bootstrap problem below, so it must do its own real
  -- verification rather than relying on the caller already being a room member (impossible for
  -- a room that doesn't exist yet).
  select (is_admin_user() or users_have_active_connection(my_id, other_user_id)) into really_connected;
  if not really_connected then
    raise exception 'No active connection between these two people';
  end if;

  select cm1.room_id into existing_room_id
  from chat_room_members cm1
  join chat_room_members cm2 on cm2.room_id = cm1.room_id
  join chat_rooms r on r.id = cm1.room_id
  where cm1.user_id = my_id and cm2.user_id = other_user_id and r.type = 'direct'
  limit 1;

  if existing_room_id is not null then
    return existing_room_id;
  end if;

  insert into chat_rooms (type, created_by) values ('direct', my_id) returning id into new_room_id;
  insert into chat_room_members (room_id, user_id, status, joined_at, role) values
    (new_room_id, my_id, 'joined', now(), 'admin'),
    (new_room_id, other_user_id, 'joined', now(), 'admin');

  return new_room_id;
end;
$function$

