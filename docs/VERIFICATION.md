# Verification — live data update, 29 September 2026

| Check | Result | Scope |
| --- | --- | --- |
| Production build | Passed | All React routes and lazy bundles compiled |
| Node tests | 18 passed | Environment/auth storage, avatar/export, exercise utilities, AI endpoint auth/provider/error/idempotency behavior |
| SQL smoke suite | 100 passed | All six migrations, seed applied twice, RLS/grants, private grading, rewards/activity deduplication, avatar entitlement, rooms, workbooks, game scores, private AI history and reservations |
| Browser workflows | Passed | Real application with isolated PGlite; Auth and PostgREST transport are explicit test doubles |
| Hosted Supabase/AI | Not verified | New migrations are awaiting user execution; Edge Function/provider are not deployed/configured by this update |

Browser verification covered learner and 17 admin catalog routes, lesson completion/rewards, avatar save/reload, settings/privacy/rankings, persisted room chat, workbook generation/print, conversation session creation, honest AI-unconfigured errors, and admin publishing visible in the learner catalog. Desktop 1440px and mobile 390px checks found no page overflow. No browser exceptions or unexpected database errors occurred.

Artifacts are local and ignored: `.local/screenshots/live-dashboard.png`, `live-mobile.png`, and `workbook.pdf`. The tests never log in to a real user account, mutate the hosted database, or call a paid model.

## Repeat

```powershell
npm test
npm run build
node supabase/tests/pglite-smoke.mjs
node tests/browser-smoke.mjs
```

The SQL smoke runner needs the optional PGlite package under `.tools/db-verify`. The browser harness also needs Playwright under `.tools/qa`, Chrome, and Vite running with live-mode frontend configuration. Set `KOTOBA_TEST_BASE_URL` to the Vite URL (the harness default in this workspace is port 5175). The HTTP adapter implements the queries exercised by these tests; it is not an implementation of PostgREST.

The AI endpoint tests transpile the actual TypeScript handler and supply isolated Auth/RPC/fetch doubles. They verify adapter request/response handling and failure behavior without provider credentials. They do not replace a deployed Deno/Edge test or confirm provider model availability.

## Remaining checks

Run native `supabase test db` and `supabase db lint --local` with Supabase CLI/Docker. These were unavailable here. Verify hosted email verification/recovery, OAuth configuration, the actual PostgREST relations, both SQL updates, and a configured AI provider on the intended deployment.

Three.js remains a lazy-loaded ~902 kB minified chunk (~244 kB gzip), causing the existing bundle-size warning. Character visuals remain built-in SVG/geometric representations. Full standalone games, voice/video, bookings/payments, native clients and production avatar asset delivery are not implemented by this update.
