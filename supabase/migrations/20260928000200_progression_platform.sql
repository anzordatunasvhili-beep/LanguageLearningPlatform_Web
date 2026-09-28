-- Progression is authoritative server data. Future clients may submit evidence,
-- never freely assign XP, assessment levels, streaks, scores, or entitlements.
create table public.user_languages (
  user_id uuid not null references public.profiles(id) on delete cascade,
  language_id uuid not null references public.languages(id) on delete restrict,
  assessed_level text check (assessed_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  xp bigint not null default 0 check (xp >= 0),
  started_at timestamptz not null default now(),
  primary key (user_id, language_id)
);
create index user_languages_language_id_idx on public.user_languages(language_id);

create table public.user_skill_progress (
  user_id uuid not null,
  language_id uuid not null,
  skill text not null check (skill in ('vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing')),
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, language_id, skill),
  foreign key (user_id, language_id) references public.user_languages(user_id, language_id) on delete cascade
);

create table public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  content_version integer not null check (content_version > 0),
  status text not null default 'started' check (status in ('started', 'completed', 'abandoned')),
  accuracy numeric(5,2) check (accuracy between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check (completed_at is null or completed_at >= started_at)
);
create index lesson_attempts_user_lesson_idx on public.lesson_attempts(user_id, lesson_id);
create index lesson_attempts_lesson_id_idx on public.lesson_attempts(lesson_id);

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  completed_at timestamptz,
  best_accuracy numeric(5,2) check (best_accuracy between 0 and 100),
  attempts integer not null default 0 check (attempts >= 0),
  primary key (user_id, lesson_id)
);
create index lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);

create table public.progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language_id uuid references public.languages(id) on delete restrict,
  source_kind text not null check (source_kind in ('lesson', 'game', 'quest', 'achievement', 'conversation', 'adjustment')),
  source_key text not null,
  xp_delta integer not null check (xp_delta between -100000 and 100000),
  occurred_at timestamptz not null default now(),
  unique (user_id, source_kind, source_key)
);
create index progress_events_user_time_idx on public.progress_events(user_id, occurred_at desc);
create index progress_events_language_time_idx on public.progress_events(language_id, occurred_at desc);

create table public.account_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp bigint not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= current_streak),
  freeze_balance integer not null default 0 check (freeze_balance >= 0),
  last_activity_date date,
  updated_at timestamptz not null default now()
);

create table public.daily_activity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  timezone text not null,
  minutes integer not null default 0 check (minutes >= 0),
  xp integer not null default 0 check (xp >= 0),
  target_met boolean not null default false,
  freeze_used boolean not null default false,
  primary key (user_id, activity_date)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text not null default 'emoji_events',
  requirement jsonb not null check (jsonb_typeof(requirement) = 'object'),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  cosmetic_reward_id uuid references public.avatar_assets(id),
  enabled boolean not null default false
);
create index achievements_cosmetic_reward_idx on public.achievements(cosmetic_reward_id);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete restrict,
  progress integer not null default 0 check (progress >= 0),
  earned_at timestamptz,
  primary key (user_id, achievement_id)
);
create index user_achievements_achievement_idx on public.user_achievements(achievement_id);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind text not null check (kind in ('daily', 'weekly', 'story')),
  requirement jsonb not null check (jsonb_typeof(requirement) = 'object'),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  enabled boolean not null default false
);

create table public.user_quests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete restrict,
  period_start date not null,
  progress integer not null default 0 check (progress >= 0),
  completed_at timestamptz,
  primary key (user_id, quest_id, period_start)
);
create index user_quests_quest_idx on public.user_quests(quest_id);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  cover_path text,
  skills text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table public.game_releases (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete restrict,
  version text not null,
  platform text not null check (platform in ('web', 'android', 'ios', 'windows', 'macos', 'linux', 'godot')),
  download_url text check (download_url is null or download_url like 'https://%'),
  minimum_level integer not null default 1 check (minimum_level > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  released_at timestamptz,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  unique (game_id, platform, version)
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  release_id uuid not null references public.game_releases(id) on delete restrict,
  language_id uuid references public.languages(id),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  submission_key text not null,
  score bigint check (score >= 0),
  accuracy numeric(5,2) check (accuracy between 0 and 100),
  playtime_seconds integer check (playtime_seconds between 0 and 86400),
  metrics jsonb not null default '{}' check (jsonb_typeof(metrics) = 'object' and octet_length(metrics::text) <= 16384),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, release_id, submission_key),
  check (completed_at is null or completed_at >= started_at)
);
create index game_sessions_release_idx on public.game_sessions(release_id);
create index game_sessions_language_idx on public.game_sessions(language_id);
-- TODO: trusted game API validates evidence and writes session/events atomically.
-- Do not expose a score/XP increment RPC before verification rules exist.

create table public.ai_characters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  language_id uuid not null references public.languages(id),
  biography text not null,
  city text,
  country text check (country ~ '^[A-Z]{2}$'),
  portrait_path text,
  presentation jsonb not null default '{}' check (jsonb_typeof(presentation) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived'))
);
create index ai_characters_language_idx on public.ai_characters(language_id);

create table public.ai_scenarios (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.ai_characters(id) on delete restrict,
  slug text not null,
  title text not null,
  objective text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  scene jsonb not null default '{}' check (jsonb_typeof(scene) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  unique (character_id, slug)
);

create table public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id uuid not null references public.ai_scenarios(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 16384),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index conversation_sessions_user_time_idx on public.conversation_sessions(user_id, started_at desc);
create index conversation_sessions_scenario_idx on public.conversation_sessions(scenario_id);

create table public.character_relationships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.ai_characters(id) on delete restrict,
  affinity integer not null default 0 check (affinity >= 0),
  story_state jsonb not null default '{}' check (jsonb_typeof(story_state) = 'object' and octet_length(story_state::text) <= 16384),
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);
create index character_relationships_character_idx on public.character_relationships(character_id);
-- TODO: add bounded message retention and separately authorized memory when AI exists.

create table public.pdf_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  version integer not null check (version > 0),
  name text not null,
  language_id uuid not null references public.languages(id),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  sections jsonb not null check (jsonb_typeof(sections) = 'array' and jsonb_array_length(sections) between 1 and 30),
  generation_rules jsonb not null default '{}' check (jsonb_typeof(generation_rules) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  unique (template_key, version)
);
create index pdf_templates_language_idx on public.pdf_templates(language_id);

create table public.generated_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.pdf_templates(id) on delete restrict,
  title text not null,
  status text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed')),
  storage_path text,
  content jsonb check (content is null or (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 1048576)),
  created_at timestamptz not null default now()
);
create index generated_materials_user_time_idx on public.generated_materials(user_id, created_at desc);
create index generated_materials_template_idx on public.generated_materials(template_id);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type text not null check (type in ('university', 'internship', 'scholarship', 'study_abroad', 'language_school', 'exam', 'exchange', 'tour', 'camp')),
  description text not null,
  country text check (country ~ '^[A-Z]{2}$'),
  language_id uuid references public.languages(id),
  required_level text check (required_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  deadline date,
  price_amount numeric(12,2) check (price_amount >= 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  delivery text not null default 'in_person' check (delivery in ('online', 'in_person', 'hybrid')),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 32768),
  source_url text check (source_url is null or source_url like 'https://%'),
  is_demo boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  check ((price_amount is null) = (currency is null))
);
create index opportunities_filter_idx on public.opportunities(type, country, deadline);
create index opportunities_language_idx on public.opportunities(language_id);
-- TODO: tours are discovery content only; add booking/payments as separate domains later.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('text', 'voice', 'study', 'game', 'event')),
  language_id uuid references public.languages(id),
  required_level text check (required_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  capacity integer not null default 20 check (capacity between 2 and 1000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived'))
);
create index rooms_language_idx on public.rooms(language_id);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'host', 'moderator')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index room_members_user_idx on public.room_members(user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_time_idx on public.notifications(user_id, created_at desc);

create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'room', 'conversation', 'content')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);
create index moderation_reports_reporter_idx on public.moderation_reports(reporter_id);
create index moderation_reports_status_idx on public.moderation_reports(status, created_at);

create table private.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);
create index audit_log_actor_time_idx on private.audit_log(actor_id, created_at desc);
