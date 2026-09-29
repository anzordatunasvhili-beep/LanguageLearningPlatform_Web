// Optional local PostgreSQL smoke verification, not a Supabase integration test.
// Install @electric-sql/pglite in .tools/db-verify (excluded from app dependencies),
// then run `node supabase/tests/pglite-smoke.mjs` from the repository root.
// Auth/Storage schemas and assertion functions below are explicit test doubles.
// Run `supabase test db` for the authoritative pgTAP/Supabase integration suite.
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(resolve('.tools/db-verify/package.json'))
const { PGlite } = require('@electric-sql/pglite')
const db = new PGlite()

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create schema extensions;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'
      )::uuid;
    $$;
    create table storage.buckets (
      id text primary key, name text not null unique, public boolean not null default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
      name text not null, unique (bucket_id, name)
    );
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name, '/'))[:array_length(string_to_array(name, '/'), 1) - 1];
    $$;
    grant usage on schema auth, storage to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
    grant execute on function auth.uid(), storage.foldername(text) to anon, authenticated, service_role;
  `)

  for (const file of (await readdir('supabase/migrations')).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'))
    console.log(`Migration applied: ${file}`)
  }
  const seed = await readFile('supabase/seed.sql', 'utf8')
  await db.exec(seed)
  await db.exec(seed)
  console.log('Development seed applied twice successfully.')

  // These raise on failures and use the same SQL assertions/fixtures as pgTAP.
  // They deliberately do not claim to implement the pgTAP runner or TAP output.
  await db.exec(`
    create function extensions.no_plan() returns text language sql as $$ select 'smoke assertions begin'; $$;
    create function extensions.finish() returns setof text language sql as $$ select 'smoke assertions complete'; $$;
    create function extensions.is(actual anyelement, expected anyelement, description text)
    returns text language plpgsql as $$
    begin
      if actual is distinct from expected then
        raise exception '%: expected %, got %', description, expected, actual;
      end if;
      return 'ok - ' || description;
    end;
    $$;
    create function extensions.ok(actual boolean, description text)
    returns text language plpgsql as $$
    begin
      if actual is distinct from true then raise exception '%', description; end if;
      return 'ok - ' || description;
    end;
    $$;
    create function extensions.lives_ok(statement text, description text)
    returns text language plpgsql as $$
    begin
      execute statement;
      return 'ok - ' || description;
    exception when others then raise exception '%: % (%)', description, sqlerrm, sqlstate;
    end;
    $$;
    create function extensions.throws_ok(statement text, expected_code text, expected_message text, description text)
    returns text language plpgsql as $$
    begin
      begin
        execute statement;
      exception when others then
        if (expected_code is null or sqlstate = expected_code)
          and (expected_message is null or sqlerrm = expected_message) then
          return 'ok - ' || description;
        end if;
        raise exception '%: unexpected % (%)', description, sqlerrm, sqlstate;
      end;
      raise exception '%: expected exception, but statement succeeded', description;
    end;
    $$;
  `)
  const results = []
  for (const testName of (await readdir('supabase/tests/database')).filter(name=>name.endsWith('.sql')).sort()) {
    const testSql = (await readFile('supabase/tests/database/'+testName, 'utf8'))
      .replace('create extension if not exists pgtap with schema extensions;', '')
    results.push(...await db.exec(testSql))
  }
  const assertions = results.flatMap((result) => result.rows).flatMap((row) => Object.values(row))
    .filter((value) => typeof value === 'string' && value.startsWith('ok - '))
  assertions.forEach((assertion) => console.log(assertion))
  console.log(`${assertions.length} SQL security smoke assertions passed against PGlite with Auth/Storage test doubles.`)
} catch (error) {
  console.error('Database smoke test failed:', error.message)
  if (error.where) console.error(error.where)
  if (error.position) console.error('SQL position:', error.position)
  process.exitCode = 1
} finally {
  await db.close()
}
