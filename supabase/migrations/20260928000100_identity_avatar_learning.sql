-- Identity, renderer-independent avatar catalog, and published learning content.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) between 2 and 16),
  name text not null,
  native_name text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,48}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  country text check (country ~ '^[A-Z]{2}$'),
  native_language_id uuid references public.languages(id),
  photo_path text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 80),
  daily_target integer not null default 20 check (daily_target between 1 and 240),
  leaderboard_opt_in boolean not null default false,
  email_notifications boolean not null default false,
  updated_at timestamptz not null default now()
);

create table private.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'moderator')),
  granted_at timestamptz not null default now()
);

create table public.avatars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  schema_version integer not null default 1 check (schema_version = 1),
  model_family text not null default 'humanoid-v1' check (char_length(model_family) between 1 and 80),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index avatars_user_id_idx on public.avatars(user_id);
create unique index avatars_one_primary_idx on public.avatars(user_id) where is_primary;

create table public.avatar_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  name text not null,
  category text not null check (category in ('body', 'face', 'hair', 'eyes', 'top', 'bottom', 'shoes', 'outerwear', 'accessory')),
  rarity text not null default 'common' check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  is_free boolean not null default false,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.avatar_asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.avatar_assets(id) on delete restrict,
  version integer not null check (version > 0),
  model_family text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  preview_path text,
  manifest jsonb not null default '{}' check (jsonb_typeof(manifest) = 'object' and octet_length(manifest::text) <= 65536),
  created_at timestamptz not null default now(),
  unique (asset_id, version)
);
-- Manifest holds platform renditions, storage paths, allowed tints, and compatibility.
-- TODO: Godot/mobile resolve stable asset keys and versions using their own adapters.

create table public.avatar_equipment (
  avatar_id uuid not null references public.avatars(id) on delete cascade,
  slot text not null check (slot in ('body', 'face', 'hair', 'eyes', 'top', 'bottom', 'shoes', 'outerwear', 'accessory')),
  asset_version_id uuid not null references public.avatar_asset_versions(id) on delete restrict,
  options jsonb not null default '{}' check (jsonb_typeof(options) = 'object' and octet_length(options::text) <= 2048),
  primary key (avatar_id, slot)
);
create index avatar_equipment_asset_version_idx on public.avatar_equipment(asset_version_id);

create table public.user_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_id uuid not null references public.avatar_assets(id) on delete restrict,
  source text not null,
  granted_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);
create index user_cosmetics_asset_id_idx on public.user_cosmetics(asset_id);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages(id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null default '',
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_language_id_idx on public.courses(language_id);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null check (position >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  unique (course_id, position)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  position integer not null check (position >= 0),
  content_version integer not null default 1 check (content_version > 0),
  estimated_minutes integer not null default 5 check (estimated_minutes between 1 and 240),
  xp_reward integer not null default 20 check (xp_reward between 0 and 10000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  unique (unit_id, position)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null check (position >= 0),
  type text not null check (type in ('multiple_choice', 'typing', 'translation', 'matching', 'word_order', 'fill_blank', 'grammar_choice', 'listening', 'speaking', 'image_choice', 'conversation', 'true_false', 'sentence_builder', 'boss_test')),
  schema_version integer not null default 1 check (schema_version > 0),
  prompt text not null,
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 65536),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  unique (lesson_id, position)
);

create table private.exercise_solutions (
  exercise_id uuid primary key references public.exercises(id) on delete cascade,
  solution jsonb not null check (jsonb_typeof(solution) = 'object'),
  explanation text not null default ''
);
-- Answer keys never belong in public.exercises.payload. Trusted grading is a future endpoint.
