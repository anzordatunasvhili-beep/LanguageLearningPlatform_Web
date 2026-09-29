# Database

The current schema contains **44 application tables**: 39 in `public`, five in the unexposed `private` schema. Supabase owns `auth.users` and the Storage tables. Authentication accounts, social profiles, portable avatars, learning progress, game results, and character relationships remain separate.

The frontend uses Supabase queries and trusted RPCs for the implemented workflows. Clients submit answers rather than scores or XP. The two migrations dated 20260929 add practice/reward transactions, avatar saving, rankings, text chat, workbook generation, admin answer editing, and private AI conversations. See [Live setup](LIVE_SETUP.md) for existing-project SQL Editor instructions and [Contracts](CONTRACTS.md) for the enforced limits.

## Files and local commands

All files in this foundation are **CREATE** additions:

| File | Purpose |
| --- | --- |
| `supabase/config.toml` | Local ports, exposed schemas, signup verification, storage and seed configuration |
| `supabase/migrations/20260928000100_identity_avatar_learning.sql` | Identity, avatar catalog and learning hierarchy |
| `supabase/migrations/20260928000200_progression_platform.sql` | Shared progression and remaining platform domains |
| `supabase/migrations/20260928000300_security_storage.sql` | Grants, RLS, immutable versions, safe role lookup and buckets |
| `supabase/migrations/20260928000400_bootstrap_audit.sql` | Signup defaults, timestamps and privileged-change auditing |
| `supabase/migrations/20260929000100_live_platform.sql` | Live practice, rewards, avatar persistence, rankings, rooms, workbooks and admin RPC |
| `supabase/migrations/20260929000200_live_conversations.sql` | Private messages, session creation and service-only AI request transactions |
| `supabase/seed.sql` | Development catalog content with stable IDs |
| `supabase/tests/database/security.test.sql` | Transactional pgTAP security regression tests |
| `supabase/tests/pglite-smoke.mjs` | Optional local SQL smoke runner with explicit Auth/Storage test doubles |

From the repository root, with Node/npm, the Supabase CLI and Docker available:

```powershell
npx supabase start
npx supabase db reset
npx supabase test db
npx supabase db lint --local
```

`db reset` recreates the **local development database** and loads the seed. Do not run a linked/remote reset against an existing project. The security tests use temporary users and fixtures inside a transaction that rolls back; the development seed does not create user accounts or passwords. Signup is available through the application; local verification messages appear in the mail catcher advertised by `supabase status`.

To apply reviewed migrations to a chosen hosted project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
npx supabase db push
```

Do not include `--include-seed` for a production deployment. Configure hosted Auth site URLs, redirect allowlists, email delivery, and Google OAuth credentials in the selected Supabase project. Local `config.toml` does not automatically configure the hosted project.

**Verification status:** all six migrations executed successfully in PGlite, the development seed executed twice, and **100 SQL assertions passed**. This runner uses explicit Auth/Storage and assertion-function substitutes; it does not verify native Supabase HTTP services or pgTAP. Native `supabase test db` and `supabase db lint` still require Supabase CLI/Docker. See [verification](VERIFICATION.md).

To repeat the optional smoke test without adding a dependency to the application:

```powershell
npm install --prefix .tools/db-verify --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.8
node supabase/tests/pglite-smoke.mjs
```

The temporary package lives under the ignored `.tools/` directory. This smoke runner is an additional check, not a replacement for the Supabase commands above.

## Tables and relationships

| Domain | Tables | Relationships and purpose |
| --- | --- | --- |
| Identity (3) | `profiles`, `user_settings`, `private.user_roles` | `profiles.id` references `auth.users.id`. Settings are private; public-safe profile fields and trusted authorization are separate. |
| Avatar (5) | `avatars`, `avatar_assets`, `avatar_asset_versions`, `avatar_equipment`, `user_cosmetics` | Users own multiple avatars, with at most one primary. Equipment refers to an immutable asset revision. Entitlements belong to the user and can be shared across their avatars. |
| Learning content (6) | `languages`, `courses`, `units`, `lessons`, `exercises`, `private.exercise_solutions` | Language → course → unit → lesson → exercise. Published descendants remain hidden when an ancestor is unpublished or its language is disabled. Answers are physically separate from exercise prompts. |
| Language learning (4) | `user_languages`, `user_skill_progress`, `lesson_attempts`, `lesson_progress` | Enrollment/proficiency per language, progress per skill, attempts per version, and a current lesson summary. An assessment level is distinct from a game/account level. |
| Shared progression (3) | `progress_events`, `account_progress`, `daily_activity` | Append-only reward events plus intentional current aggregates. Unique event source keys make duplicate rewards detectable. Daily activity stores the timezone used to assign the date. |
| Rewards (4) | `achievements`, `user_achievements`, `quests`, `user_quests` | Definitions are reusable catalog content; individual progress is private and server-written. Quest periods distinguish daily/weekly instances. |
| Games (3) | `games`, `game_releases`, `game_sessions` | A game has platform/version releases; sessions reference the exact release and carry a verification status and idempotency key. |
| Characters (4) | `ai_characters`, `ai_scenarios`, `conversation_sessions`, `character_relationships` | Characters are persistent NPCs. Scenarios belong to characters; private sessions and relationship state belong to the learner. |
| Materials (2) | `pdf_templates`, `generated_materials` | Immutable template revisions contain constrained section definitions. Generated output records the exact template revision, structured content and private object path. |
| Discovery and operations (6) | `opportunities`, `rooms`, `room_members`, `notifications`, `moderation_reports`, `private.audit_log` | Common opportunity filters are relational. Type-specific tour details are bounded JSON. Room membership is managed through trusted RPCs. |
| Live workflow additions (4) | `private.practice_runs`, `room_messages`, `conversation_messages`, `private.ai_requests` | Snapshot grading, persistent chat, private history and idempotent provider request reservations. |

UUID keys, foreign keys, unique slugs, ordered-sibling constraints, timestamps, bounded numeric checks and FK/query indexes are included. Published referenced catalog rows should be archived. Restrictive FKs protect attempt/session history; account removal cascades through the player's private data. Audit actor references are set to null when an account is removed.

`moderation_reports.target_type/target_id` is a deliberate polymorphic reference because reports may outlive deleted content. Future moderation intake must validate targets and limit submission frequency. A report is not a permission grant. Internal moderation notes belong in the private audit/moderation backend, not in the reporter-readable row.

Opportunity details, game release metadata, exercise payloads, scene presentation and PDF sections use bounded JSON where their shapes legitimately vary. Primary ownership, entitlements, progress, learning hierarchy and important query filters remain relational. Add normalized supported-language joins when catalog editing/filtering requires them; the current game preview keeps informational language codes inside release metadata.

## Identity and administration

Signup atomically creates a private profile, settings and zero account progress. It uses a deterministic `player_<uuid>` username, so duplicate display names never break signup. `display_name` from signup metadata is trimmed and bounded. Users can subsequently edit their username. Roles, XP and entitlements are never copied from user metadata.

The frontend calls:

```javascript
const { data: role, error } = await supabase.rpc('get_my_role')
// role: 'learner' | 'moderator' | 'admin'
```

`public.get_my_role()` is an authenticated-only `SECURITY INVOKER` wrapper around a private, fixed-search-path helper. It accepts no user ID and returns only the caller's current role. An administrator cannot promote themselves or another account using the browser API.

A trusted operator bootstraps an administrator through a controlled SQL connection **after that account has signed up**:

```sql
insert into private.user_roles (user_id, role)
values ('REPLACE_WITH_EXISTING_AUTH_USER_UUID'::uuid, 'admin')
on conflict (user_id) do update set role = excluded.role;
```

Never put this operation in frontend code, development seed data, or a public RPC. The `service_role`/secret key belongs only in a trusted worker/Edge Function/server. Browser environment variables contain only the Supabase URL and publishable key.

## Grant and policy matrix

| Resource | Anonymous | Authenticated owner | Catalog admin / moderator | Trusted service |
| --- | --- | --- | --- | --- |
| Enabled/published catalog and ancestors | Read published | Read published | Admin catalog CRUD; moderator published read | Full |
| Draft catalog | None | None | Admin CRUD | Full |
| Public-safe profiles | Read opted-in rows | Read own; update named safe columns | Same as other authenticated users | Full |
| Private settings | None | Read own; update named preference columns | No extra access | Full |
| Avatars | None | Own read/create/delete; name/primary updates | No extra access | Full |
| Equipment | None | Own CRUD subject to compatibility and entitlement | No extra access | Full |
| XP, assessment, attempts, rewards, inventory, game sessions | None | Read own only | No extra writes or private reads | Full; event mutation guard still applies |
| Conversation metadata, relationships, generated material | None | Read own only | No extra access | Full |
| Room memberships | None | Read own only | No direct joins/grants | Full |
| Notifications | None | Read own; update only `read_at` | No extra access | Full |
| Reports | None | Submit own, read own | Admin/moderator read all, update only status | Full |
| Private roles, solutions and audit | None | No table access | No browser table access | Full |

`SELECT`, `INSERT`, `UPDATE` and `DELETE` grants are independent of RLS. Owner-update policies use both `USING` and `WITH CHECK`; column grants prevent modification of ownership and trusted fields. All 44 application tables enable RLS. Private tables are excluded from the Data API and have no browser grants or table policies.

Private authorization helpers use `SECURITY DEFINER` only when necessary to read the inaccessible role table; the signup/audit trigger functions use it for their specific server-owned writes. Each has `search_path = ''`, qualified object references, no arbitrary target-user parameter and revoked default execution. Trigger functions are not callable as normal RPCs. Ordinary helper functions and the public role wrapper use `SECURITY INVOKER`.

Catalog writes, role changes and report moderation record minimal audit entries. They do not copy raw report reasons, generated content or user conversations. The admin-only `save_exercise` action saves an exercise and its private solution atomically. The `exercise_solution` action is also admin-only.

## Trusted progression and leaderboards

An authenticated client proves which account is submitting data; it does **not** prove that a score or learning answer is valid. Browser, Android, React Native and Godot clients all remain untrusted for awards.

The practice RPC validates ownership, published hierarchy and bounded requests, snapshots private solutions, checks answers and atomically saves results/rewards. Streak evaluation uses the saved timezone and completed activity. CEFR assessment remains separate: no direct browser insert can invent an assessed level.

`progress_events` rejects direct updates/deletes; corrections use compensating events. Account-deletion cascades are permitted. Its unique `(user_id, source_kind, source_key)` key is one part of replay prevention, not a complete validation system. `game_sessions` similarly deduplicates `(user_id, release_id, submission_key)`.

The `leaderboard` RPC returns only public opted-in profile names/usernames and summed XP from trusted events. It supports weekly/all-time windows and optional language filtering, capped at 100 rows. Private progress remains inaccessible to other learners.

## Portable avatar contract

```json
{
  "schemaVersion": 1,
  "avatarId": "a-player-owned-uuid",
  "modelFamily": "humanoid-v1",
  "selections": [
    {
      "slot": "top",
      "assetKey": "top.academy-jacket",
      "assetVersion": 1,
      "options": { "tint": "#343D39" }
    }
  ]
}
```

The serializer resolves normalized equipment to stable asset keys and versions. This is a portable contract example, not an implemented cross-game endpoint. No React objects, Three.js instances or engine-specific node paths belong in it.

For version 1, direct avatar creation uses the default `humanoid-v1` family; a user may change the avatar name or primary selection, not switch model families while incompatible items remain equipped. Equipment writes check owner, published/enabled catalog state, category/slot, model family and free/owned entitlement. The only permitted option is an optional six-digit hex `tint`; arbitrary model paths or extra customization keys are rejected. Each slot currently holds one item. Published asset revisions and PDF template revisions cannot be edited, deleted, or demoted to draft; archive and create a new revision instead.

TODO: add a validated export endpoint, catalog-version negotiation, asset licensing rules, supported morph ranges, multiple accessory slots, platform rendition resolution and explicit model-family migration before enabling modular 3D/Godot integration. Entitlement revocation also needs a policy for existing equipped items. The seed manifests identify placeholders and do not claim that production GLBs exist.

## Storage

| Bucket | Access | Initial write/read policy |
| --- | --- | --- |
| `public-assets` | Public download | Catalog admins upload/update/delete; suitable only for intentionally public previews and freely distributable renditions |
| `profile-images` | Private | Owner folder `<auth.uid()>/...`; owner upload/read/update/delete, raster image MIME types, 2 MiB limit |
| `generated-materials` | Private | Trusted writes; owner download only when the path matches a ready material row, 25 MiB limit |
| `private-assets` | Private | No browser policies; trusted workers authorize restricted assets |

Private profile uploads do not automatically become public social portraits. Public profiles use a fallback until a reviewed public derivative is deliberately published. Store object paths rather than expiring signed URLs. Private delivery should use authenticated download or short-lived signed URLs; anyone holding an unexpired signed URL can use it. Public bucket retrieval is public even when a database metadata row is hidden.

The seed creates metadata only; it does not upload images, models or PDFs. Bucket MIME/size restrictions are a baseline. Before accepting public user content, add file inspection, abuse limits and moderation in the upload pipeline. Realtime has not been enabled for private tables, and there are no voice, video or streaming credentials.

## Seed reference

| Stable ID | Record |
| --- | --- |
| `10000000-0000-4000-8000-000000000001` | Japanese |
| `10000000-0000-4000-8000-000000000002` | Spanish |
| `20000000-0000-4000-8000-000000000001` | Japanese first conversations course |
| `22000000-0000-4000-8000-000000000001` | Hello, world lesson |
| `23000000-0000-4000-8000-000000000001` | Morning greeting multiple-choice exercise |
| `30000000-0000-4000-8000-000000000003` | Academy jacket catalog asset |
| `31000000-0000-4000-8000-000000000003` | Academy jacket revision 1 |
| `30000000-0000-4000-8000-000000000005` | Soft bob hair catalog asset (`hair.soft-bob`) |
| `31000000-0000-4000-8000-000000000005` | Soft bob revision 1 |
| `40000000-0000-4000-8000-000000000001` | Word Dungeon preview |
| `50000000-0000-4000-8000-000000000001` | Haruka |
| `51000000-0000-4000-8000-000000000001` | Haruka convenience-store scenario |
| `70000000-0000-4000-8000-000000000001` | Japanese greetings PDF template |
| `80000000-0000-4000-8000-000000000003` | Fictional Madrid language tour |

Seed inserts are repeatable by stable ID using `ON CONFLICT DO NOTHING`; they do not overwrite published revisions or existing editorial content. All opportunity rows set `is_demo = true` and are hidden from normal catalog reads. The original preview game releases remain alongside version 1.0 browser challenge releases. No external download is invented. Provider settings come exclusively from Edge secrets; old scenario metadata does not select an AI provider. There are no fake learner histories, passwords or privileged accounts in seed data.

## Later migration boundaries

Remaining domains include multilingual standalone-game compatibility, scheduled retention jobs, binary PDF workers/storage, friends/social graphs, tours inventory/booking/payments, external-game attestation, native authentication flows and RPG world state. Account level is calculated as 1 + floor(total XP / 1000); it is not a proficiency assessment.

Each private practice run now snapshots the public exercises and private solutions at start. Editing a published exercise does not change grading for a run already in progress. Development seed content should still be reviewed/replaced through admin before a public launch.

Official references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [database functions](https://supabase.com/docs/guides/database/functions), [private security helpers](https://supabase.com/docs/guides/troubleshooting/do-i-need-to-expose-security-definer-functions-in-row-level-security-policies-iI0uOw), [views](https://supabase.com/docs/guides/database/views), [Storage bucket access](https://supabase.com/docs/guides/storage/buckets/fundamentals), [database testing](https://supabase.com/docs/guides/database/testing), [seed configuration](https://supabase.com/docs/guides/local-development/seeding-your-database).
