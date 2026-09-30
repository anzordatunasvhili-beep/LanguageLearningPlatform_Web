begin;
create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to authenticated;
set search_path = public, extensions;
select extensions.no_plan();
insert into auth.users(id, raw_user_meta_data) values
 ('af000000-0000-4000-8000-000000000001','{}'),
 ('af000000-0000-4000-8000-000000000002','{}');
create temporary table portrait_fixture(value jsonb);
insert into portrait_fixture values ('{"schemaVersion":1,"template":"frontal-painted-v1","parts":{"head":"head-a","hair":"hair-b","nose":"nose-a","eyes":"eyes-b","brows":"brows-b","mouth":"mouth-a","ears":"ears-a","neck":"neck-a"},"colors":{"skin":"#d6a377","hair":"#3e3027","eyes":"#856546","brows":"#3e3027","lips":"#a56350"}}');
grant select on portrait_fixture to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','af000000-0000-4000-8000-000000000001',true);
select extensions.lives_ok('select public.save_portrait((select value from portrait_fixture))','Owner can create portrait');
select extensions.lives_ok('select public.save_portrait((select value from portrait_fixture))','Repeat save updates portrait');
select extensions.is((select count(*) from public.user_portraits),1::bigint,'One identity per account');
select extensions.is((select definition from public.user_portraits),(select value from portrait_fixture),'Identity round-trips unchanged');
select extensions.throws_ok($$select public.save_portrait('{}')$$,'22023','Invalid portrait definition.','Invalid data rejected');
select set_config('request.jwt.claim.sub','af000000-0000-4000-8000-000000000002',true);
select extensions.is((select count(*) from public.user_portraits),0::bigint,'Other private portraits cannot be read');
select extensions.throws_ok($$insert into public.user_portraits(user_id,definition) select 'af000000-0000-4000-8000-000000000001',value from portrait_fixture$$,'42501','new row violates row-level security policy for table "user_portraits"','Cannot write another account portrait');
with changed as (update public.user_portraits set definition=(select value from portrait_fixture) returning *)
select extensions.is((select count(*) from changed),0::bigint,'Cannot update hidden portrait');
reset role;
update public.profiles set is_public=true where id='af000000-0000-4000-8000-000000000001';
set local role authenticated;
select extensions.is((select count(*) from public.user_portraits),1::bigint,'Public profile shares saved portrait with signed-in viewers');
reset role;
select * from extensions.finish();
rollback;
