# Kotoba · Language-learning platform foundation

A React/Vite foundation for a persistent language-learning and game identity. The first phase includes an editorial dashboard, reusable practice exercises, scripted character scenes, a portable avatar preview, sample discovery catalogs, and a protected content-studio shell.

**This is a foundation preview, not a launched learning service.** Authentication can connect to Supabase; catalogs and feature workflows currently use labeled sample adapters. No AI API, game networking, voice service, booking, or payment provider is connected.

## Start this project

Install Node.js 22.12 or newer (Node 22 LTS recommended for this package set), then run from this directory:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. Select **Start your next chapter**, then **Enter demo world**. The example environment explicitly enables demo mode. No email or password is needed for a sample session.

If using the portable runtime downloaded during implementation:

```powershell
$env:PATH = (Join-Path (Get-Location) '.tools\node-v22.23.3-win-x64') + ';' + $env:PATH
npm run dev
```

`.tools/` is a local, ignored build/verification aid. It is not part of the app or deployment. On networks using a certificate authority installed in Windows, Node 22's `$env:NODE_OPTIONS = '--use-system-ca'` lets npm use that trusted store without disabling TLS verification.

## Commands for a fresh scaffold

These explain how to reproduce the stack in a **new empty directory**. Do not run the scaffold over this completed project.

```powershell
npm create vite@latest kotoba-web -- --template react
Set-Location kotoba-web
npm install react@^19 react-dom@^19 react-router@^7 @supabase/supabase-js@^2 three@^0.180 @react-three/fiber@^9 @react-three/drei@^10
npm install -D vite@^7 @vitejs/plugin-react@^5 tailwindcss@^4 @tailwindcss/vite@^4
```

The files here configure React Router, Tailwind's Vite plugin, Material Symbols, and lazy Three.js rendering. Existing installs use the committed `package-lock.json` via `npm ci`. React 19 and Fiber 9 are paired deliberately; no Redux, UI kit, icon package, AI SDK, or PDF engine is installed.

## Connect Supabase Auth

1. Create a Supabase project and apply the migrations using the CLI workflow in [docs/DATABASE.md](docs/DATABASE.md). Seed only a development project.
2. Set these public frontend variables in `.env.local`, then restart Vite:

   ```dotenv
   VITE_DEMO_MODE=false
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

3. Configure the Supabase Auth **Site URL** to match the app origin and allow `/auth/callback` and `/auth/update-password` redirects for each local/production origin. Use exact trusted URLs for production.
4. Enable email verification and configure email delivery. For Google login, enable the Google provider and register the callback URL shown by Supabase in Google Cloud. The frontend stores no OAuth secret.
5. Register using display name/email/password. A database trigger creates the public profile with a collision-resistant initial username, preferences, and empty account progression. Admin roles require a trusted database operator; signup cannot grant them.

Partial/invalid live configuration produces an error. A failed live backend does not fall back to demo mode. Only publishable keys belong in Vite variables: never put a secret or service-role key in `VITE_*`.

The live connection currently powers **authentication and identity lookup**. Course/progress/avatar/admin persistence requires the next backend service wiring phase. The interface still labels sample feature content when signed in with a real account.

## Included routes and behavior

| Area | Working first-phase behavior |
| --- | --- |
| Landing/auth | Landing, login/register, email verification callback, Google adapter, password reset/update, session and role guards |
| Dashboard | Responsive navigation, sample XP/streak/quests/skills, links into learning and character scenes |
| Learn | Language filters, courses/units, three practice types, answer feedback and completion/retry; no trusted XP awards |
| Games | Public/private catalog and details, planned/unavailable states, game service boundary |
| Characters | Three character introductions and scripted visual-novel scenes, optional translation and typed response |
| Avatar | 2D/3D preview, basic appearance choices, local draft and portable JSON export |
| Leaderboards | Filterable sample rankings; no claimed real players or live competition |
| Discovery | Fictional opportunity filters/details, room browsing, achievement collection, material library preview |
| Profile/settings | Own identity, labeled sample stats, browser learning preferences |
| Admin | Guarded dashboard, reusable catalog table with search/filter/pagination, editable sample PDF template preview |

Game files, downloads, audio/video, live AI answers, real PDFs, and applications/booking are intentionally unavailable. Typed dialogue gets a fixed script reply and is not graded or persisted. The geometric 3D figure and stylized 2D portrait are placeholders.

## Data and security

- [Architecture and phased roadmap](docs/ARCHITECTURE.md): system boundaries, route/folder plan, design direction, deferred work.
- [Database setup and security](docs/DATABASE.md): actual tables, relationships, migrations, grants/RLS, storage, seeds, admin provisioning, tests.
- [Portable contracts and integration roadmap](docs/CONTRACTS.md): avatar, character renderer, game result, PDF generation boundaries.
- [Verification notes](docs/VERIFICATION.md): checks actually run and environment limitations.

Auth accounts, editable profiles, avatars, progress, roles, and character relationships are separate. Clients cannot award XP, unlock cosmetics, change verified scores, or grant themselves privileges. Public exercises and private assessment solutions are separate. Migrations enable RLS and apply grants; hiding a frontend control is never the security boundary.

## Validation

```powershell
npm test
npm run build
npm run preview
```

Pure contract tests use Node's built-in runner. Native Supabase tests require its CLI and Docker; see the database documentation. Before a live release, run the full hosted auth/recovery/provider flow, native migrations/RLS tests, and accessibility checks against the configured deployment.

## Vercel

Import the repository into Vercel using the Vite framework preset. The checked-in `vercel.json` sets the build command, output directory, and SPA rewrites. Configure the three `VITE_*` variables per environment, set production Auth redirect URLs, and apply reviewed database migrations separately. Rebuild after environment changes. A production account deployment should use `VITE_DEMO_MODE=false`.

No deployment or remote database migration was performed by this scaffold.

## File changes

The starting project directory was empty. All source, configuration, migration, seed, test, and documentation files are **CREATE** operations. No existing application files were deleted or replaced. Full implementations live at their file paths; there are no omitted-code placeholders.

## Official stack references

[Vite](https://vite.dev/guide/), [React Router](https://reactrouter.com/start/declarative/installation), [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite), [Supabase](https://supabase.com/docs/reference/javascript/initializing), [Fiber compatibility](https://r3f.docs.pmnd.rs/getting-started/installation).
