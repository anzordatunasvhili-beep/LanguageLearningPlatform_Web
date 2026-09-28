-- Explicit SQL grants and RLS are both required. Private helpers are not exposed
-- through PostgREST; every elevated helper uses a fixed search_path and auth.uid().
grant usage on schema public to anon, authenticated, service_role;
revoke create on schema public from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create function private.current_role()
returns text language sql stable security definer set search_path = ''
as $$
  select coalesce((select r.role from private.user_roles r where r.user_id = (select auth.uid())), 'learner');
$$;
revoke all on function private.current_role() from public, anon, authenticated;
grant execute on function private.current_role() to authenticated, service_role;

create function private.is_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.current_role() = 'admin'; $$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated, service_role;

create function public.get_my_role()
returns text language sql stable security invoker set search_path = ''
as $$ select private.current_role(); $$;
revoke all on function public.get_my_role() from public, anon, authenticated;
grant execute on function public.get_my_role() to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'languages', 'profiles', 'user_settings', 'avatars', 'avatar_assets', 'avatar_asset_versions',
    'avatar_equipment', 'user_cosmetics', 'courses', 'units', 'lessons', 'exercises',
    'user_languages', 'user_skill_progress', 'lesson_attempts', 'lesson_progress', 'progress_events',
    'account_progress', 'daily_activity', 'achievements', 'user_achievements', 'quests', 'user_quests',
    'games', 'game_releases', 'game_sessions', 'ai_characters', 'ai_scenarios',
    'conversation_sessions', 'character_relationships', 'pdf_templates', 'generated_materials',
    'opportunities', 'rooms', 'room_members', 'notifications', 'moderation_reports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
  foreach table_name in array array['user_roles', 'exercise_solutions', 'audit_log'] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('revoke all on table private.%I from public, anon, authenticated', table_name);
    execute format('grant all on table private.%I to service_role', table_name);
  end loop;
end $$;

-- Catalog management is available to administrators. Learners only see published
-- ancestors; policies on referenced parents compose through RLS without recursion.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'languages', 'avatar_assets', 'avatar_asset_versions', 'courses', 'units', 'lessons',
    'exercises', 'achievements', 'quests', 'games', 'game_releases', 'ai_characters',
    'ai_scenarios', 'pdf_templates', 'opportunities', 'rooms'
  ] loop
    execute format('grant select on table public.%I to anon, authenticated', table_name);
    execute format('grant insert, update, delete on table public.%I to authenticated', table_name);
    execute format('create policy admin_catalog on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', table_name);
  end loop;
end $$;

create policy published_languages on public.languages for select to anon, authenticated using (enabled);
create policy published_assets on public.avatar_assets for select to anon, authenticated using (enabled);
create policy published_asset_versions on public.avatar_asset_versions for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.avatar_assets a where a.id = asset_id and a.enabled));
create policy published_courses on public.courses for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.languages l where l.id = language_id and l.enabled));
create policy published_units on public.units for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published'));
create policy published_lessons on public.lessons for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.units u where u.id = unit_id and u.status = 'published'));
create policy published_exercises on public.exercises for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'));
create policy published_achievements on public.achievements for select to anon, authenticated using (enabled);
create policy published_quests on public.quests for select to anon, authenticated using (enabled);
create policy published_games on public.games for select to anon, authenticated using (status = 'published');
create policy published_game_releases on public.game_releases for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.games g where g.id = game_id and g.status = 'published'));
create policy published_characters on public.ai_characters for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.languages l where l.id = language_id and l.enabled));
create policy published_scenarios on public.ai_scenarios for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.ai_characters c where c.id = character_id and c.status = 'published'));
create policy published_pdf_templates on public.pdf_templates for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.languages l where l.id = language_id and l.enabled));
create policy published_opportunities on public.opportunities for select to anon, authenticated
  using (status = 'published' and (language_id is null or exists (select 1 from public.languages l where l.id = language_id and l.enabled)));
create policy published_rooms on public.rooms for select to anon, authenticated
  using (status = 'published' and (language_id is null or exists (select 1 from public.languages l where l.id = language_id and l.enabled)));

-- Public profiles contain no email, roles, counters, conversations, or preferences.
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, country, native_language_id, photo_path, is_public) on public.profiles to authenticated;
create policy visible_profiles on public.profiles for select to anon, authenticated
  using (is_public or id = (select auth.uid()));
create policy edit_own_profile on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select on public.user_settings to authenticated;
grant update (timezone, daily_target, leaderboard_opt_in, email_notifications) on public.user_settings to authenticated;
create policy own_settings_read on public.user_settings for select to authenticated using (user_id = (select auth.uid()));
create policy own_settings_update on public.user_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, delete on public.avatars to authenticated;
grant insert (user_id, name, is_primary) on public.avatars to authenticated;
grant update (name, is_primary) on public.avatars to authenticated;
create policy own_avatars on public.avatars for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.avatar_equipment to authenticated;
create policy own_equipment_read on public.avatar_equipment for select to authenticated
  using (exists (select 1 from public.avatars a where a.id = avatar_id and a.user_id = (select auth.uid())));
create policy own_equipment_delete on public.avatar_equipment for delete to authenticated
  using (exists (select 1 from public.avatars a where a.id = avatar_id and a.user_id = (select auth.uid())));

-- Validation is deliberately narrow: v1 supports a single optional tint only.
-- TODO: version this validator before adding morph targets or multi-accessory slots.
create function private.valid_equipment(target_avatar uuid, target_version uuid, target_slot text, target_options jsonb)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select
    target_options - 'tint' = '{}'::jsonb
    and (not target_options ? 'tint' or (jsonb_typeof(target_options->'tint') = 'string' and target_options->>'tint' ~ '^#[0-9A-Fa-f]{6}$'))
    and exists (
      select 1 from public.avatars a
      join public.avatar_asset_versions v on v.id = target_version
      join public.avatar_assets asset on asset.id = v.asset_id
      where a.id = target_avatar and a.user_id = (select auth.uid())
        and v.status = 'published' and asset.enabled
        and asset.category = target_slot
        and v.model_family in (a.model_family, 'universal')
        and (asset.is_free or exists (
          select 1 from public.user_cosmetics c
          where c.user_id = (select auth.uid()) and c.asset_id = asset.id
        ))
    );
$$;
revoke all on function private.valid_equipment(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function private.valid_equipment(uuid, uuid, text, jsonb) to authenticated;
create policy own_equipment_insert on public.avatar_equipment for insert to authenticated
  with check (private.valid_equipment(avatar_id, asset_version_id, slot, options));
create policy own_equipment_update on public.avatar_equipment for update to authenticated
  using (exists (select 1 from public.avatars a where a.id = avatar_id and a.user_id = (select auth.uid())))
  with check (private.valid_equipment(avatar_id, asset_version_id, slot, options));

-- All authoritative private player state is readable by its owner, writable only
-- with the server's service role. No client-side reward or membership endpoints yet.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'user_cosmetics', 'user_languages', 'user_skill_progress', 'lesson_attempts',
    'lesson_progress', 'progress_events', 'account_progress', 'daily_activity',
    'user_achievements', 'user_quests', 'game_sessions', 'conversation_sessions',
    'character_relationships', 'generated_materials', 'room_members', 'notifications'
  ] loop
    execute format('grant select on table public.%I to authenticated', table_name);
    execute format('create policy own_read on public.%I for select to authenticated using (user_id = (select auth.uid()))', table_name);
  end loop;
end $$;

grant update (read_at) on public.notifications to authenticated;
create policy own_notification_read_state on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on public.moderation_reports to authenticated;
grant insert (reporter_id, target_type, target_id, reason) on public.moderation_reports to authenticated;
grant update (status) on public.moderation_reports to authenticated;
create policy own_report_read on public.moderation_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.current_role()) in ('admin', 'moderator'));
create policy own_report_create on public.moderation_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy moderator_report_status on public.moderation_reports for update to authenticated
  using ((select private.current_role()) in ('admin', 'moderator'))
  with check ((select private.current_role()) in ('admin', 'moderator'));

-- Public published renditions and templates are immutable. Retire the row and
-- create another version instead of mutating a configuration already in use.
create function private.protect_published_version()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if old.status <> 'draft' then
    if tg_op = 'DELETE' then
      raise exception 'Published versions must be archived, not deleted';
    end if;
    if new.status = 'draft' or (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
      raise exception 'Published versions are immutable; create a new version';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.protect_published_version() from public, anon, authenticated;
create trigger immutable_asset_version before update or delete on public.avatar_asset_versions
  for each row execute function private.protect_published_version();
create trigger immutable_pdf_template before update or delete on public.pdf_templates
  for each row execute function private.protect_published_version();

-- Trusted progress_events is append-only, even for accidental server updates.
-- Account deletion may cascade through events; regular DELETE remains forbidden.
create function private.protect_progress_event()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' or pg_trigger_depth() <= 1 then
    raise exception 'Progress events are append-only; use a compensating event';
  end if;
  return old;
end;
$$;
revoke all on function private.protect_progress_event() from public, anon, authenticated;
create trigger immutable_progress_event before update or delete on public.progress_events
  for each row execute function private.protect_progress_event();

-- Storage is provisioned here; seed metadata does not upload physical objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-assets', 'public-assets', true, 26214400, array['image/png', 'image/jpeg', 'image/webp', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream']),
  ('profile-images', 'profile-images', false, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('generated-materials', 'generated-materials', false, 26214400, array['application/pdf']),
  ('private-assets', 'private-assets', false, 26214400, array['image/png', 'image/jpeg', 'image/webp', 'model/gltf-binary', 'application/octet-stream'])
on conflict (id) do nothing;

create policy admin_public_asset_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets' and (select private.is_admin()));
create policy admin_public_asset_read on storage.objects for select to authenticated
  using (bucket_id = 'public-assets' and (select private.is_admin()));
create policy admin_public_asset_update on storage.objects for update to authenticated
  using (bucket_id = 'public-assets' and (select private.is_admin()))
  with check (bucket_id = 'public-assets' and (select private.is_admin()));
create policy admin_public_asset_delete on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets' and (select private.is_admin()));

create policy own_profile_image_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy own_profile_image_select on storage.objects for select to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy own_profile_image_update on storage.objects for update to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy own_profile_image_delete on storage.objects for delete to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy own_generated_material_download on storage.objects for select to authenticated
  using (bucket_id = 'generated-materials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.generated_materials m
      where m.user_id = (select auth.uid()) and m.storage_path = name and m.status = 'ready'));
-- private-assets has no browser policies. Trusted workers decide which restricted
-- rendition is entitled before issuing short-lived URLs. No realtime publication yet.
