-- Run with `supabase test db` after `supabase start` and `supabase db reset`.
-- Fixtures and grants exist only inside this rolled-back transaction.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select set_config('request.jwt.claim.sub', '', true);
grant usage on schema extensions to anon, authenticated;
grant execute on all functions in schema extensions to anon, authenticated;
select extensions.no_plan();

insert into auth.users (id, email, raw_user_meta_data) values
  ('f0000000-0000-4000-8000-000000000001', 'learner-one@example.test', '{"display_name":"Learner One","role":"admin"}'),
  ('f0000000-0000-4000-8000-000000000002', 'learner-two@example.test', '{"display_name":"Learner Two"}'),
  ('f0000000-0000-4000-8000-000000000003', 'admin@example.test', '{"display_name":"Content Admin"}');
insert into private.user_roles (user_id, role) values ('f0000000-0000-4000-8000-000000000003', 'admin');
insert into public.languages (id, code, name, native_name, enabled)
  values ('a1000000-0000-4000-8000-000000000001', 'zz-test', 'Test', 'Test', true);
insert into public.courses (id, language_id, slug, title, level, status) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'security-live-course', 'Live', 'A1', 'published'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'security-draft-course', 'Draft', 'A1', 'draft');
insert into public.units (id, course_id, title, position, status) values
  ('a2100000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000002', 'Hidden ancestor', 1, 'published'),
  ('a2100000-0000-4000-8000-000000000002', 'a2000000-0000-4000-8000-000000000001', 'Visible', 1, 'published');
insert into public.lessons (id, unit_id, title, position, status) values
  ('a2200000-0000-4000-8000-000000000001', 'a2100000-0000-4000-8000-000000000001', 'Hidden lesson', 1, 'published'),
  ('a2200000-0000-4000-8000-000000000002', 'a2100000-0000-4000-8000-000000000002', 'Visible lesson', 1, 'published');
insert into public.exercises (id, lesson_id, position, type, prompt, status) values
  ('a2300000-0000-4000-8000-000000000001', 'a2200000-0000-4000-8000-000000000001', 1, 'typing', 'Hidden prompt', 'published'),
  ('a2300000-0000-4000-8000-000000000002', 'a2200000-0000-4000-8000-000000000002', 1, 'typing', 'Visible prompt', 'published');
insert into private.exercise_solutions (exercise_id, solution)
  values ('a2300000-0000-4000-8000-000000000002', '{"acceptedAnswers":["answer"]}');
insert into public.avatars (id, user_id, name, is_primary) values
  ('f1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'One', true),
  ('f1000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002', 'Two', true);
insert into public.avatar_assets (id, asset_key, name, category, is_free, enabled) values
  ('a3000000-0000-4000-8000-000000000001', 'test.free', 'Free body', 'body', true, true),
  ('a3000000-0000-4000-8000-000000000002', 'test.locked', 'Locked pin', 'accessory', false, true);
insert into public.avatar_asset_versions (id, asset_id, version, model_family, status) values
  ('a3100000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000001', 1, 'humanoid-v1', 'published'),
  ('a3100000-0000-4000-8000-000000000002', 'a3000000-0000-4000-8000-000000000002', 1, 'universal', 'published');
insert into public.notifications (id, user_id, kind, title, body)
  values ('f2000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'test', 'Title', 'Body');
insert into public.pdf_templates (id, template_key, version, name, language_id, level, sections, status)
  values ('f3000000-0000-4000-8000-000000000001', 'security-template', 1, 'Security template', 'a1000000-0000-4000-8000-000000000001', 'A1', '[{"type":"theory"}]', 'published');
insert into public.generated_materials (id, user_id, template_id, title, status, storage_path) values
  ('f4000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'f3000000-0000-4000-8000-000000000001', 'Own PDF', 'ready', 'f0000000-0000-4000-8000-000000000001/security-test.pdf'),
  ('f4000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002', 'f3000000-0000-4000-8000-000000000001', 'Other PDF', 'ready', 'f0000000-0000-4000-8000-000000000002/security-test.pdf');
insert into storage.objects (bucket_id, name) values
  ('profile-images', 'f0000000-0000-4000-8000-000000000001/security-test.png'),
  ('profile-images', 'f0000000-0000-4000-8000-000000000002/security-test.png'),
  ('generated-materials', 'f0000000-0000-4000-8000-000000000001/security-test.pdf'),
  ('generated-materials', 'f0000000-0000-4000-8000-000000000001/unregistered-test.pdf'),
  ('generated-materials', 'f0000000-0000-4000-8000-000000000002/security-test.pdf'),
  ('private-assets', 'security-test.glb');

select extensions.is((select count(*) from public.user_settings where user_id::text like 'f0000000%'), 3::bigint, 'Signup creates private settings');
select extensions.is((select count(*) from public.account_progress where user_id::text like 'f0000000%'), 3::bigint, 'Signup creates account progression');
select extensions.is((select count(*) from private.user_roles where user_id = 'f0000000-0000-4000-8000-000000000001'), 0::bigint, 'Signup metadata cannot grant an admin role');

set local role anon;
select set_config('request.jwt.claims', '{}', true);
select extensions.is((select count(*) from public.exercises where id = 'a2300000-0000-4000-8000-000000000001'), 0::bigint, 'Published descendants of a draft course stay private');
select extensions.is((select count(*) from public.exercises where id = 'a2300000-0000-4000-8000-000000000002'), 1::bigint, 'Published complete hierarchy is public');
select extensions.is((select count(*) from public.profiles where id::text like 'f0000000%'), 0::bigint, 'Profiles default to private');
select extensions.throws_ok('select public.get_my_role()', '42501', null, 'Anonymous users cannot call role RPC');
select extensions.throws_ok('select * from private.exercise_solutions', '42501', null, 'Anonymous users cannot read answer keys');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select extensions.is(public.get_my_role(), 'learner', 'Editable metadata does not affect authoritative role');
select extensions.is((select count(*) from public.profiles where id::text like 'f0000000%'), 1::bigint, 'Owner reads their private profile only');
select extensions.is((select count(*) from public.account_progress where user_id::text like 'f0000000%'), 1::bigint, 'Owner reads their progress only');
select extensions.lives_ok($$update public.profiles set display_name = 'Updated name' where id = 'f0000000-0000-4000-8000-000000000001'$$, 'Owner edits safe profile fields');
select extensions.throws_ok($$update public.profiles set id = 'f0000000-0000-4000-8000-000000000002' where id = 'f0000000-0000-4000-8000-000000000001'$$, '42501', null, 'Profile ownership cannot be changed');
select extensions.throws_ok('select * from private.exercise_solutions', '42501', null, 'Authenticated learners cannot read answer keys');
select extensions.throws_ok($$insert into private.user_roles (user_id, role) values ('f0000000-0000-4000-8000-000000000001', 'admin')$$, '42501', null, 'Learners cannot grant roles');
select extensions.throws_ok($$update public.account_progress set total_xp = 999999 where user_id = 'f0000000-0000-4000-8000-000000000001'$$, '42501', null, 'Learners cannot forge account XP');
select extensions.throws_ok($$insert into public.progress_events (user_id, source_kind, source_key, xp_delta) values ('f0000000-0000-4000-8000-000000000001', 'game', 'fake', 5000)$$, '42501', null, 'Learners cannot submit trusted progression events');
select extensions.throws_ok($$insert into public.user_cosmetics (user_id, asset_id, source) values ('f0000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002', 'fake')$$, '42501', null, 'Learners cannot unlock cosmetics directly');
select extensions.lives_ok($$update public.courses set title = 'Tampered' where id = 'a2000000-0000-4000-8000-000000000001'$$, 'Learner catalog update is filtered by RLS');

-- An UPDATE filtered by RLS succeeds with zero changed rows, rather than throwing.
-- The preceding permission grants permit catalog writes but RLS decides the rows.
reset role;
select extensions.is((select title from public.courses where id = 'a2000000-0000-4000-8000-000000000001'), 'Live', 'Learner catalog updates change no rows');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select extensions.lives_ok($$insert into public.avatar_equipment (avatar_id, slot, asset_version_id, options) values ('f1000000-0000-4000-8000-000000000001', 'body', 'a3100000-0000-4000-8000-000000000001', '{"tint":"#B8A088"}')$$, 'Owner equips a free compatible asset');
select extensions.throws_ok($$insert into public.avatar_equipment (avatar_id, slot, asset_version_id) values ('f1000000-0000-4000-8000-000000000001', 'accessory', 'a3100000-0000-4000-8000-000000000002')$$, '42501', null, 'Locked cosmetics require trusted entitlement');
select extensions.throws_ok($$insert into public.avatar_equipment (avatar_id, slot, asset_version_id) values ('f1000000-0000-4000-8000-000000000002', 'body', 'a3100000-0000-4000-8000-000000000001')$$, '42501', null, 'Users cannot equip another player avatar');
select extensions.throws_ok($$update public.avatar_equipment set avatar_id = 'f1000000-0000-4000-8000-000000000002' where avatar_id = 'f1000000-0000-4000-8000-000000000001'$$, '42501', null, 'Equipment cannot be transferred across owners');
select extensions.throws_ok($$update public.avatar_equipment set options = '{"modelPath":"arbitrary.glb"}' where avatar_id = 'f1000000-0000-4000-8000-000000000001'$$, '42501', null, 'Appearance options cannot inject arbitrary model paths');
select extensions.lives_ok($$update public.notifications set read_at = now() where id = 'f2000000-0000-4000-8000-000000000001'$$, 'Owner can mark a notification read');
select extensions.throws_ok($$update public.notifications set title = 'Forged' where id = 'f2000000-0000-4000-8000-000000000001'$$, '42501', null, 'Owner cannot forge notification content');
select extensions.throws_ok($$insert into public.moderation_reports (reporter_id, target_type, target_id, reason) values ('f0000000-0000-4000-8000-000000000002', 'profile', 'f0000000-0000-4000-8000-000000000003', 'Impersonated report')$$, '42501', null, 'Report authors cannot be impersonated');
select extensions.is((select count(*) from storage.objects where bucket_id = 'profile-images' and name like 'f0000000%/security-test.png'), 1::bigint, 'Owner can read only their profile upload');
select extensions.is((select count(*) from storage.objects where bucket_id = 'generated-materials' and name like 'f0000000%'), 1::bigint, 'Private PDF access requires both ownership and ready metadata');
select extensions.is((select count(*) from storage.objects where bucket_id = 'private-assets' and name = 'security-test.glb'), 0::bigint, 'Restricted models have no browser access');
select extensions.throws_ok($$insert into storage.objects (bucket_id, name) values ('profile-images', 'f0000000-0000-4000-8000-000000000002/forged.png')$$, '42501', null, 'Profile uploads cannot target another account folder');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select extensions.is(public.get_my_role(), 'admin', 'Trusted operator role is returned');
select extensions.is((select count(*) from public.exercises where id = 'a2300000-0000-4000-8000-000000000001'), 1::bigint, 'Admin can inspect draft content hierarchy');
select extensions.lives_ok($$update public.courses set title = 'Admin edit' where id = 'a2000000-0000-4000-8000-000000000001'$$, 'Admin can edit catalog');
select extensions.throws_ok($$update public.avatar_asset_versions set manifest = '{"changed":true}' where id = 'a3100000-0000-4000-8000-000000000001'$$, 'P0001', 'Published versions are immutable; create a new version', 'Published asset revisions remain immutable for admins');
select extensions.throws_ok($$update public.avatar_asset_versions set status = 'draft' where id = 'a3100000-0000-4000-8000-000000000001'$$, 'P0001', 'Published versions are immutable; create a new version', 'Published versions cannot be demoted to bypass immutability');
select extensions.throws_ok($$update public.account_progress set total_xp = 10 where user_id = 'f0000000-0000-4000-8000-000000000001'$$, '42501', null, 'Catalog admins cannot forge progression');
select extensions.throws_ok('select * from private.user_roles', '42501', null, 'Frontend admins cannot enumerate role grants');

reset role;
select set_config('request.jwt.claims', '{}', true);
select extensions.is((select title from public.courses where id = 'a2000000-0000-4000-8000-000000000001'), 'Admin edit', 'Authorized catalog edit persisted');
select extensions.ok(exists(select 1 from private.audit_log where actor_id = 'f0000000-0000-4000-8000-000000000003' and action = 'update'), 'Catalog administration is audited');
select extensions.ok(not has_table_privilege('authenticated', 'public.game_sessions', 'INSERT'), 'Game results require trusted service writes');
select extensions.ok(not has_table_privilege('authenticated', 'public.room_members', 'INSERT'), 'Room requirements cannot be bypassed with direct membership inserts');
select extensions.ok(not has_table_privilege('authenticated', 'public.generated_materials', 'INSERT'), 'Generated files require trusted service metadata');
select extensions.ok((select not public from storage.buckets where id = 'generated-materials'), 'Generated material bucket is private');
select extensions.ok((select not public from storage.buckets where id = 'profile-images'), 'Raw profile image bucket is private');

select * from extensions.finish();
rollback;
