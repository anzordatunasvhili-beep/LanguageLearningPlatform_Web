# Kotoba

React/Vite language learning with Supabase accounts, published content, server-checked practice, saved progress, avatar equipment, community chat, and a content administration panel.

**Existing project: follow [Live setup](docs/LIVE_SETUP.md) to apply the two new SQL updates and activate AI.** Changing the public frontend key alone does not install database functions or deploy server code.

## Run locally

Use Node.js 22.12 or newer:

```powershell
npm ci
npm run dev
```

Put your public configuration in `.env.local` (Vite does not load `.env.example`):

```dotenv
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Restart Vite after environment changes. Open the URL it prints. Do not overwrite an already configured `.env.local`. Never put an AI key, Supabase secret key, or service-role key in `VITE_*`.

The portable runtime in this workspace can be enabled with:

```powershell
$env:PATH = (Join-Path (Get-Location) '.tools\node-v22.23.3-win-x64') + ';' + $env:PATH
npm run dev
```

## Connected features

| Area | Behavior |
| --- | --- |
| Learning | Published courses/units/lessons, private answer grading, saved attempts, 80% completion threshold |
| Progress | Server-calculated XP, activity streaks, daily minutes, achievements and daily/weekly quests |
| Games | Browser practice challenges with saved, server-checked scores and daily XP limits |
| Profiles/settings | Saved identity, privacy, learning language, timezone and daily target |
| Avatars | Account equipment loading/saving, free/owned asset checks, JSON export, built-in 2D/3D presentation |
| Leaderboards | Rankings from actual XP events, public-profile and explicit opt-in required |
| Characters/AI | Published characters/scenarios, private saved chat, OpenAI or Gemini Edge adapter; requires deployment and provider secrets |
| Library | Saved workbooks from published exercises; print or save PDF using the browser |
| Rooms | Membership, capacity/proficiency checks, persistent text chat refreshed every eight seconds |
| Opportunities | Published non-demo listings with real external source links |
| Admin | Database-backed catalog editing/publishing, private exercise answer editing, template versioning, learner overview and report review |

The application does not import the old hard-coded catalog or player fixtures. Empty catalogs show empty states. Backend errors are displayed without substituting fake results.

Current games share the practice challenge engine; full standalone/RPG games are separate work. Voice rooms, payments/booking, production character models, native mobile/Godot clients, and an accredited proficiency assessment are not implemented. Workbooks use published course content rather than AI-generated lessons. AI replies are not proficiency grades and do not award XP.

## Administration

Sign in with an account provisioned in `private.user_roles`, then open `/admin`. [Live setup](docs/LIVE_SETUP.md) includes the SQL to grant your own account administrator access. Publish a complete course → unit → lesson → exercise hierarchy. Answers are saved separately from public exercise content.

Do not load `supabase/seed.sql` into a new production project: it contains development content and fictional opportunities. Existing fictional opportunities are excluded from learner/public listing queries and policies.

## Validation and deployment

```powershell
npm test
npm run build
```

See [verification](docs/VERIFICATION.md) for actual checks and their limits. [Database documentation](docs/DATABASE.md) covers migrations/RLS and [contracts](docs/CONTRACTS.md) explains trusted operations.

For Vercel, use the Vite preset and the included SPA rewrites in `vercel.json`. Configure public environment variables, apply database migrations separately, deploy the AI function separately, and configure Supabase Auth redirect URLs for your production domain.

No hosted database migration or Edge Function deployment has been performed by this local code update.
