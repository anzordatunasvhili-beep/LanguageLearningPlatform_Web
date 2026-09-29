# Activate the live application

## 1. Update your existing Supabase database

If you already ran the four migrations dated `20260928`, run these files in **Supabase → SQL Editor**, in this order:

1. [20260929000100_live_platform.sql](../supabase/migrations/20260929000100_live_platform.sql)
2. [20260929000200_live_conversations.sql](../supabase/migrations/20260929000200_live_conversations.sql)

Each file is a transaction. Run each once. Do not rerun the old migrations or reset your database. If a file reports an error, copy the error text; do not skip to the next file. Existing accounts and catalog records are retained.

For a fresh project, run all six files in `supabase/migrations` in filename order. Do not run the development seed on a new production project. Create your real content through admin.

These updates add private practice snapshots, trusted grading/rewards, room chat, workbook generation, avatar saving, rankings, admin answer editing, and private AI messages with server-only request reservations.

## 2. Confirm local configuration

Use `.env.local`, not just `.env.example`:

```dotenv
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

Restart `npm run dev` and use its printed URL. Supabase Auth must allow that origin and its `/auth/callback` and `/auth/update-password` routes. Email/password login requires your Supabase email settings; Google login additionally requires enabling/configuring its OAuth provider.

## 3. Give your account admin access

Register and verify your email first. Then replace the email below with your own registered email and run this in SQL Editor:

```sql
insert into private.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_REGISTERED_EMAIL'
on conflict (user_id) do update set role = excluded.role;
```

Sign out and back in. Visit `/admin`. Only a trusted SQL operator can grant roles; the browser admin panel cannot promote accounts or edit XP.

Publish the language, course, unit, lesson, and exercises. For exercises, keep the public prompt/options in **Exercise payload** and the answers in **Private answer key**. Choice answers use `{"answer":"a"}`; typing uses `{"answers":["accepted text"]}`; word order uses an ordered string array in `answer`. Publish at least one answered exercise before starting a lesson.

Create study/text rooms with no minimum proficiency requirement for beginners. Existing minimum-level rooms stay locked until a trusted assessment provides a CEFR result; XP does not certify proficiency.

Opportunities must have **Fictional example (hidden from learners)** disabled to appear to learners. Supply a real HTTPS source URL. Their application button links to that site; the platform does not process bookings or payments.

## 4. Activate AI conversations

Both OpenAI and Gemini adapters are implemented. Select the provider/model you have access to. No model is silently selected and no paid request runs before configuration.

In **Supabase → Edge Functions → Secrets**, add:

| Secret | Value |
| --- | --- |
| `AI_PROVIDER` | `openai` or `gemini` |
| `AI_MODEL` | Exact model ID enabled on your provider account |
| `OPENAI_API_KEY` | Required when provider is `openai` |
| `GEMINI_API_KEY` | Required when provider is `gemini` |

Do not put these in Vite variables or paste them into chat. Supabase supplies the function's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the hosted runtime.

Deploy the function from the repository root:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
npx supabase functions deploy ai-conversation --no-verify-jwt
```

Alternatively create an Edge Function named `ai-conversation` in the Supabase dashboard and paste [index.ts](../supabase/functions/ai-conversation/index.ts). Disable gateway JWT verification for this function: it validates every bearer token itself with `auth.getUser`, supporting Supabase's current key/signing setup. An absent or invalid user token is rejected before the provider is called.

The backend limits each account to 30 provider requests in a rolling day, one pending request, 1,500-character messages, 800 output tokens and 12 messages of model context. Configure provider-level spending limits separately. Conversations and replies persist privately. History older than 30 days is pruned when that user next sends a message; this is activity-based cleanup, not a scheduled deletion guarantee.

Official API references: [OpenAI Responses](https://developers.openai.com/api/docs/guides/migrate-to-responses), [Gemini generateContent](https://ai.google.dev/api/generate-content), [Supabase Edge authentication](https://supabase.com/docs/guides/functions/auth).

## 5. Check your hosted setup

Complete a published lesson and reload the dashboard; the actual result and XP should remain. Save/reload settings and avatar equipment. Publish a room, join it and send a message. Generate a workbook from a published template and use **Print / save PDF**. Send an AI message after deploying the function and setting secrets.

The local tests use an isolated PostgreSQL engine with Auth/Storage/HTTP test doubles. They do not confirm that you have applied these updates, configured email delivery, deployed the function, or supplied a working provider credential.
