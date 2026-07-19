-- Stores each professional's own Google Calendar OAuth connection. One row per professional,
-- never shared -- matches the direct instruction that each connects their own calendar
-- individually, not one shared account.
create table if not exists professional_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) unique,
  google_email text,
  access_token text,
  refresh_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_refreshed_at timestamptz,
  needs_reconnect boolean not null default false
);

alter table professional_calendar_connections enable row level security;

create policy "Professionals see and manage their own calendar connection" on professional_calendar_connections
  for all using (user_id = auth.uid() or is_admin_user())
  with check (user_id = auth.uid() or is_admin_user());
