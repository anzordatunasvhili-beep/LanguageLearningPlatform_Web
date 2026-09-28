-- A minimal signup trigger creates a profile and private defaults atomically.
-- User metadata may suggest a display name, never permissions or progression.
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'player_' || replace(new.id::text, '-', ''),
    coalesce(nullif(left(btrim(new.raw_user_meta_data->>'display_name'), 80), ''), 'New adventurer')
  );
  insert into public.user_settings (user_id) values (new.id);
  insert into public.account_progress (user_id) values (new.id);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'user_settings', 'avatars', 'courses', 'user_skill_progress', 'account_progress', 'character_relationships'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.touch_updated_at()', table_name);
  end loop;
end $$;

-- Keep a durable record of privileged mutations without copying private reports
-- or user content into an uncontrolled audit payload.
create function private.audit_privileged_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare row_data jsonb;
begin
  if tg_op = 'DELETE' then row_data = to_jsonb(old); else row_data = to_jsonb(new); end if;
  insert into private.audit_log (actor_id, action, entity_type, entity_id, details)
  values ((select auth.uid()), lower(tg_op), tg_table_schema || '.' || tg_table_name,
    coalesce(row_data->>'id', row_data->>'user_id')::uuid,
    jsonb_build_object('operation', tg_op));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.audit_privileged_change() from public, anon, authenticated;
create trigger audit_role_grants after insert or update or delete on private.user_roles
  for each row execute function private.audit_privileged_change();
create trigger audit_report_moderation after update on public.moderation_reports
  for each row execute function private.audit_privileged_change();
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'languages', 'avatar_assets', 'avatar_asset_versions', 'courses', 'units', 'lessons',
    'exercises', 'achievements', 'quests', 'games', 'game_releases', 'ai_characters',
    'ai_scenarios', 'pdf_templates', 'opportunities', 'rooms'
  ] loop
    execute format('create trigger audit_catalog after insert or update or delete on public.%I for each row execute function private.audit_privileged_change()', table_name);
  end loop;
end $$;
