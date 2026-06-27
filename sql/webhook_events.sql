create table if not exists webhook_events (
  id text primary key,
  event_name text not null,
  delivery_id text not null unique,
  repository_full_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
