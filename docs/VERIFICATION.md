# Foundation verification

Implementation completed from the written visual direction, with the user's confirmation to proceed without a reference image. The empty workspace received new source, configuration, documentation, migration, seed, and test files. No remote deployment or database migration was performed.

## Checks completed

| Check | Result | Scope |
| --- | --- | --- |
| Production build | Passed | Vite 7.3.6, 691 transformed modules, route chunks and isolated 3D chunk |
| JavaScript contract tests | 13 passed | Auth configuration, safe redirects/storage, portable avatar validation/export, exercise grading |
| SQL migration smoke test | Passed | All four actual migrations executed in PGlite PostgreSQL |
| Development seed | Passed twice | Repeatable inserts with stable IDs, including both avatar hair choices |
| SQL security assertions | 46 passed | Actual grants, RLS, ownership, protected progression/roles/answers, avatar entitlement, storage path rules |
| Desktop browser routes | Passed | 17 catalog/app/admin routes, with no runtime errors or document overflow at 1440px |
| Mobile browser routes | Passed | Dashboard, learning, characters, conversation, avatar, opportunities, template editor and landing at 390px |
| Practice flow | Passed | Multiple choice, typing, word order, correct feedback and 3/3 completion |
| Character scene | Passed | Scripted reply, typed response and translation toggle |
| Avatar | Passed | Appearance selection, local draft across reload, JSON download and lazy 3D canvas |
| Opportunities | Passed | Language filter, details dialog, Escape dismissal |
| Admin template editor | Passed | Name edit, structure preview, local session save |
| Navigation and guards | Passed | Signed-out redirect, explicit demo entry, mobile menu dismissal, sign-out redirect |

Browser verification used installed headless Chrome with Playwright. Screenshots were inspected for composition and mobile layout. Local screenshots are saved under `.local/screenshots/`, which is intentionally ignored. The browser runner is at `tests/browser-smoke.mjs`; temporary test tooling lives under `.tools/qa/`, outside app dependencies.

The SQL smoke runner supplies explicit substitutes for Supabase Auth/Storage schemas and pgTAP assertion functions. These checks do **not** establish that native Supabase services are configured correctly. Native CLI migrations, pgTAP, database lint, Auth HTTP, Storage HTTP, and PostgREST still require a Supabase/Docker environment.

## Repeat the checks

```powershell
npm test
npm run build
```

For the optional browser check, use the explicit demo environment from `.env.example`, run `npm run dev` in one terminal, then in another terminal:

```powershell
npm install --prefix .tools/qa --no-save playwright@1.63.0
node tests/browser-smoke.mjs
```

The script uses Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Set `KOTOBA_CHROME_PATH` for another installed Chromium executable, and optionally `KOTOBA_TEST_BASE_URL` for a different local port. It creates a fresh, isolated browser session; it never uses the user's Chrome profile. Run against a local **demo** build, not a production account deployment. It generates ignored screenshots and local browser drafts only.

For database checks, use the native and optional smoke commands in [DATABASE.md](DATABASE.md).

## Material limitations

- Live email/password, Google login, email verification, recovery, and role/profile lookup are implemented but have not been tested against a configured Supabase project. No credentials were supplied.
- Learning content, rewards, quest/streak totals, rankings, game availability, opportunities, character responses, material generation and admin editing remain sample workflows. Auth can be live while these areas still display sample content.
- Local avatar drafts and preferences do not sync to Supabase. The export format matches the database's documented portable contract, but no cross-client export endpoint is implemented.
- The 3D scene is a geometric placeholder. Its lazy chunk is about 902 kB minified / 244 kB gzip and causes a Vite size warning. It loads only when the user selects the 3D preview. The ordinary entry chunk is about 508 kB minified / 149 kB gzip; no model or game executable is bundled into it.
- Browser checks are a smoke test, not a complete accessibility or cross-browser audit. Native dialog behavior, labels, visible focus, closed-menu keyboard exclusion and reduced-motion styles are included. Additional assistive-technology testing belongs in the MVP release gate.
- Public font/icon resources currently use Google Fonts. Production can self-host licensed font subsets if offline use or a stricter content-security policy requires it.

## Next implementation boundary

Connect published catalog reads through the existing feature services, then implement immutable assessment content and a trusted grading/progression transaction before awarding real XP. Preserve owner-only private progress and server-owned rewards. Wire avatar/profile persistence and admin publishing to the already-defined grants and policies. Connect real AI and PDF jobs only when explicitly scheduled for the next phase.
