-- Extends the connection with what's needed for incremental sync and webhook management.
alter table professional_calendar_connections add column if not exists google_calendar_id text default 'primary';
alter table professional_calendar_connections add column if not exists sync_token text;
alter table professional_calendar_connections add column if not exists watch_channel_id uuid;
alter table professional_calendar_connections add column if not exists watch_resource_id text;
alter table professional_calendar_connections add column if not exists watch_expires_at timestamptz;

-- Links a HOBS session to its Google Calendar event, so incoming changes can be matched back
-- to the right booking, and so app-side reschedules/cancellations know which event to update.
create table if not exists session_calendar_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references expert_bookings(id) on delete cascade,
  professional_user_id uuid not null references auth.users(id),
  google_event_id text not null,
  last_known_start timestamptz,
  last_known_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(professional_user_id, google_event_id)
);
alter table session_calendar_events enable row level security;
create policy "Professionals and admins see their own session-calendar links" on session_calendar_events
  for all using (professional_user_id = auth.uid() or is_admin_user())
  with check (professional_user_id = auth.uid() or is_admin_user());

-- A change detected from Google Calendar that needs a human to confirm before it's applied --
-- per direct instruction, nothing touching an existing session auto-applies silently except
-- deletion (which auto-cancels through the real policy, handled separately).
create table if not exists calendar_change_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references expert_bookings(id) on delete cascade,
  professional_user_id uuid not null references auth.users(id),
  change_type text not null check (change_type in ('time_changed')),
  old_start timestamptz,
  new_start timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table calendar_change_requests enable row level security;
create policy "Professionals and admins manage their own change requests" on calendar_change_requests
  for all using (professional_user_id = auth.uid() or is_admin_user())
  with check (professional_user_id = auth.uid() or is_admin_user());

-- Non-HOBS events on a professional's calendar (personal blocks, unrelated meetings) -- read
-- only for computing availability, never linked to any session.
create table if not exists professional_busy_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_user_id uuid not null references auth.users(id),
  google_event_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  updated_at timestamptz not null default now(),
  unique(professional_user_id, google_event_id)
);
alter table professional_busy_blocks enable row level security;
create policy "Professionals and admins see their own busy blocks" on professional_busy_blocks
  for all using (professional_user_id = auth.uid() or is_admin_user())
  with check (professional_user_id = auth.uid() or is_admin_user());
-- Clients need to see WHICH slots are unavailable when booking, without seeing any details of
-- what's actually blocking them (privacy -- a client shouldn't see a professional's personal
-- calendar events, just that the slot isn't free).
create policy "Any authenticated user can see busy time ranges for booking purposes" on professional_busy_blocks
  for select using (auth.uid() is not null);
