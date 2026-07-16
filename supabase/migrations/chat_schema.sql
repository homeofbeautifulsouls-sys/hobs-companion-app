-- Chat rooms: covers all three types (direct 1-on-1, professional coordination, support groups)
create table if not exists chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'coordination', 'support_group')),
  name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  client_id uuid references auth.users(id),
  archived boolean not null default false
);

-- Membership: covers roles (member/admin/co_admin) and status (invited/joined/declined/left)
-- Never hard-deleted on leave, so history and past membership survive, matching the archive
-- philosophy already used elsewhere in this app rather than deleting things outright.
create table if not exists chat_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role text not null default 'member' check (role in ('member', 'admin', 'co_admin')),
  status text not null default 'joined' check (status in ('invited', 'joined', 'declined', 'left')),
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique(room_id, user_id)
);

-- Messages: soft-deleted (never hard-removed), with crisis-flag fields for the same two-layer
-- detection pattern already used on journal entries (keyword pass client-side for instant
-- reaction, AI pass server-side for deeper review), applied here to every message in every room.
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  text text not null,
  created_at timestamptz not null default now(),
  deleted boolean not null default false,
  crisis_flagged boolean not null default false,
  crisis_reviewed boolean not null default false
);

create index if not exists idx_chat_room_members_room on chat_room_members(room_id);
create index if not exists idx_chat_room_members_user on chat_room_members(user_id);
create index if not exists idx_chat_messages_room on chat_messages(room_id, created_at);
