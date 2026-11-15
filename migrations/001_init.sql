create table staff (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('owner', 'manager', 'assistant')),
  created_at timestamptz not null default now()
);

create unique index staff_single_owner on staff ((1)) where role = 'owner';

create table sessions (
  id_hash text primary key,
  staff_id text not null references staff (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index sessions_staff_id_idx on sessions (staff_id);

create table event_settings (
  id integer primary key check (id = 1),
  event_name text not null,
  event_date text not null,
  event_place text not null,
  event_status text not null,
  banner_eyebrow text not null,
  banner_title text not null,
  banner_body text not null,
  banner_button_label text not null default '',
  banner_button_url text not null default '',
  banner_image_url text not null default '',
  banner_image bytea,
  banner_image_type text,
  updated_at timestamptz not null default now()
);

insert into event_settings (
  id,
  event_name,
  event_date,
  event_place,
  event_status,
  banner_eyebrow,
  banner_title,
  banner_body
) values (
  1,
  'Evening Register',
  'Set the date',
  'Set the place',
  'Registration open',
  'Tonight''s list',
  'A seat is waiting',
  'Leave your name, a number, and an email. The host sees every registration and can clear the list when the night is over.'
);

create table form_fields (
  id text primary key,
  label text not null,
  field_type text not null check (field_type in ('text', 'textarea', 'phone', 'email', 'select', 'boolean')),
  required boolean not null default false,
  placeholder text not null default '',
  options jsonb not null default '[]'::jsonb,
  position integer not null,
  created_at timestamptz not null default now()
);

insert into form_fields (id, label, field_type, required, placeholder, position) values
  ('fld_name', 'Full name', 'text', true, 'Your name', 0),
  ('fld_phone', 'Phone number', 'phone', true, '01XXXXXXXXX', 1),
  ('fld_email', 'Email', 'email', true, 'name@gmail.com', 2);

create table registrations (
  id text primary key,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create index registrations_created_at_idx on registrations (created_at desc);
