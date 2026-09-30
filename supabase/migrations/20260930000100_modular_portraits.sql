-- Independent portrait identity; existing avatar equipment is preserved.
begin;

create function public.valid_portrait_definition(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item text;
begin
  if value is null or jsonb_typeof(value) <> 'object' or octet_length(value::text) > 16384
    or value->>'schemaVersion' is distinct from '1'
    or value->>'template' is distinct from 'frontal-painted-v1'
    or jsonb_typeof(value->'parts') is distinct from 'object'
    or jsonb_typeof(value->'colors') is distinct from 'object' then return false; end if;
  foreach item in array array['head','hair','nose','eyes','brows','mouth','ears','neck'] loop
    if coalesce(value->'parts'->>item, '') !~ '^[a-z][a-z0-9-]{1,79}$' then return false; end if;
  end loop;
  foreach item in array array['skin','hair','eyes','brows','lips'] loop
    if coalesce(value->'colors'->>item, '') !~ '^#[0-9a-fA-F]{6}$' then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.valid_portrait_definition(jsonb) from public;
grant execute on function public.valid_portrait_definition(jsonb) to authenticated, service_role;

create table public.user_portraits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  definition jsonb not null check (public.valid_portrait_definition(definition)),
  updated_at timestamptz not null default now()
);
alter table public.user_portraits enable row level security;
revoke all on public.user_portraits from public, anon, authenticated;
grant select, insert, update on public.user_portraits to authenticated;
grant all on public.user_portraits to service_role;
create policy portrait_read on public.user_portraits for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.profiles p where p.id = user_id and p.is_public
  ));
create policy portrait_insert on public.user_portraits for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy portrait_update on public.user_portraits for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function public.save_portrait(p_definition jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to save your portrait.' using errcode = '42501'; end if;
  if not public.valid_portrait_definition(p_definition) then
    raise exception 'Invalid portrait definition.' using errcode = '22023';
  end if;
  insert into public.user_portraits(user_id, definition) values(auth.uid(), p_definition)
  on conflict(user_id) do update set definition = excluded.definition, updated_at = now();
  return p_definition;
end;
$$;
revoke all on function public.save_portrait(jsonb) from public, anon;
grant execute on function public.save_portrait(jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
