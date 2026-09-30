# Verification — live data update, 29 September 2026

## Modular portrait update — 30 September 2026

- Production build passed. Node suite: 23 tests passed. SQL smoke suite: 109 assertions passed across all seven migrations, including owner-only portrait writes, private reads and public-profile visibility.
- `tests/browser-portraits.mjs` passed: 384 raster compositions (64 independent feature combinations × three emotions × speaking on/off), 1440/820/390/320 layouts, JSON import/export and invalid import handling, browser draft persistence, account save/reload, saved profile portrait and consistent identity between catalog introduction and conversation.
- All 28 shipping layer PNGs have actual transparency and a common 1024 × 1024 canvas. Contact sheets were visually reviewed for registration and palette changes. The master reference and every part were generated with built-in imagegen, then registered once per asset.
- Local artifacts: `.local/screenshots/portrait-combinations.png`, `portrait-colors.png`, and `portrait-390.png`. The shared artist guide is `public/characters/painted-v1/master-template.png`. Exact prompts and implementation notes: [Modular portraits](MODULAR_PORTRAITS.md).
- Browser database tests use isolated PGlite with explicit Auth/PostgREST doubles. Hosted Supabase migration and real AI deployment were not performed. Runtime portrait rendering makes no image-generation requests. Audio lip sync and user-authored AI personas are outside this portrait milestone.

Repeat with Vite dev running on port 5191: `node tests/browser-portraits.mjs` (or set `PORTRAIT_TEST_URL`). Optional QA dependencies remain under `.tools/qa` and `.tools/db-verify`.

## Earlier live-platform checks

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

The former SVG/geometric characters have been replaced with modular generated raster portraits. The geometric Three.js viewer and its large lazy chunk are no longer included in the build. The rounded landing-page redesign retains its generated full-body illustrations and was checked at 1440, 820, 390 and 320 pixels. Full standalone games, voice/video, bookings/payments, native clients and custom 3D avatar delivery are not implemented. See [art direction and prompts](ART_DIRECTION.md).
