create table if not exists gcal_connect_state_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used boolean not null default false
);
alter table gcal_connect_state_tokens enable row level security;
create policy "Users manage their own state tokens" on gcal_connect_state_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
