alter table event_settings
  add column site_logo bytea,
  add column site_logo_type text,
  add column social_discord text not null default '',
  add column social_instagram text not null default '',
  add column social_youtube text not null default '',
  add column social_facebook text not null default '';

create table notifications (
  id text primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index notifications_created_at_idx on notifications (created_at desc);
