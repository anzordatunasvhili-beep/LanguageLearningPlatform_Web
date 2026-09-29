import { chromium } from '../.tools/qa/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { db, uid, installRoutes } from './browser-database.mjs';
await mkdir('.local/screenshots', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.KOTOBA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const failures = await installRoutes(page),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const base = process.env.KOTOBA_TEST_BASE_URL || 'http://127.0.0.1:5175';
async function visit(path) {
  await page.goto(base + path);
  await page.locator('h1').first().waitFor();
  await page.waitForLoadState('networkidle');
  assert.equal(await page.getByText('Something interrupted your journey.').count(), 0, path);
  assert.equal(
    await page.getByRole('alert').count(),
    0,
    'Unexpected alert on ' + path + ': ' + (await page.getByRole('alert').allTextContents()),
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    'Overflow: ' + path,
  );
  console.log('Route OK: ' + path);
}
try {
  await visit('/auth/register');
  assert.equal(
    await page.getByText(/Enter demo/).count(),
    0,
    'Real registration must not offer a fake account',
  );
  await visit('/auth/login');
  await page.getByLabel('Email address').fill('browser@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Browser-password1!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/app/dashboard');
  await page.waitForLoadState('networkidle');
  for (const path of [
    '/app/dashboard',
    '/app/learn',
    '/app/course/20000000-0000-4000-8000-000000000001',
    '/app/games',
    '/app/games/40000000-0000-4000-8000-000000000001',
    '/app/leaderboards',
    '/app/ai/characters',
    '/app/ai/characters/50000000-0000-4000-8000-000000000001',
    '/app/avatar',
    '/app/opportunities',
    '/app/rooms',
    '/app/profile/me',
    '/app/settings',
    '/app/achievements',
    '/app/library',
  ])
    await visit(path);
  await visit('/app/lesson/22000000-0000-4000-8000-000000000001');
  await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByText('You got it!', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Your answer').fill('こんにちは');
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.getByRole('button', { name: 'Finish and save', exact: true }).click();
  await page.getByText('You earned 100 XP.', { exact: true }).waitFor();
  assert.equal(
    (await db.query('select total_xp from public.account_progress where user_id=$1', [uid])).rows[0]
      .total_xp,
    100,
  );
  await visit('/app/avatar');
  await page.getByRole('button', { name: 'skin tone 1', exact: true }).click();
  await page.getByRole('button', { name: 'Save avatar', exact: true }).click();
  await page.getByText('Your avatar is saved to your account.', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'skin tone 1', exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole('button', { name: 'skin tone 1', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  await visit('/app/settings');
  await page.getByLabel('Display name', { exact: true }).fill('Persisted learner');
  await page.getByLabel('Make my profile public').check();
  await page.getByLabel('Appear in leaderboards', { exact: false }).check();
  await page.getByRole('button', { name: 'Save settings', exact: true }).click();
  await page.getByText('Saved to your account.', { exact: true }).waitFor();
  await visit('/app/leaderboards');
  await page.getByText('Persisted learner', { exact: true }).first().waitFor();
  await visit('/app/library');
  await page.getByRole('button', { name: 'Generate workbook', exact: true }).first().click();
  await page.waitForURL('**/app/library/*');
  await page.getByRole('heading', { name: 'Answer sheet' }).waitFor();
  assert.ok((await page.locator('.workbook-question').count()) > 0);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: '.local/screenshots/workbook.pdf', format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await visit('/app/rooms');
  await page
    .locator('.card')
    .filter({ has: page.getByRole('heading', { name: 'Browser study room', exact: true }) })
    .getByRole('button', { name: 'Join room' })
    .click();
  await page.getByLabel('Message', { exact: true }).fill('Hello from a saved room.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByText('Hello from a saved room.', { exact: true }).waitFor();
  await visit('/app/ai/conversation/50000000-0000-4000-8000-000000000001');
  await page.getByRole('button', { name: 'Open conversation' }).click();
  await page.getByLabel('Your message', { exact: true }).waitFor();
  // No billable provider call: verify honest unavailable state through a controlled Edge response.
  await page.route('**/functions/v1/ai-conversation', (route) =>
    route.fulfill({
      status: 503,
      json: { error: 'AI is not configured. Test provider intentionally disabled.' },
    }),
  );
  await page.getByLabel('Your message', { exact: true }).fill('こんにちは');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'AI is not configured' }).waitFor();
  await db.query("insert into private.user_roles(user_id,role) values($1,'admin')", [uid]);
  await visit('/admin');
  for (const name of [
    'languages',
    'courses',
    'units',
    'lessons',
    'exercises',
    'games',
    'game-releases',
    'characters',
    'scenarios',
    'avatar-assets',
    'avatar-versions',
    'achievements',
    'quests',
    'opportunities',
    'rooms',
    'pdf-templates',
    'reports',
  ])
    await visit('/admin/' + name);
  await visit('/admin/courses');
  await page.getByRole('button', { name: 'Create course', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Language', { exact: true })
    .selectOption('10000000-0000-4000-8000-000000000001');
  await dialog.getByLabel('URL slug', { exact: false }).fill('browser-published-course');
  await dialog.getByLabel('Title', { exact: true }).fill('Published from the browser');
  await dialog.getByLabel('Description', { exact: true }).fill('An actual saved catalog record.');
  await dialog.getByLabel('Publication status', { exact: true }).selectOption('published');
  await dialog.getByRole('button', { name: 'Create record', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await visit('/app/learn');
  await page.getByRole('heading', { name: 'Published from the browser', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/app/dashboard', '/app/learn', '/app/settings', '/admin/courses'])
    await visit(path);
  await page.screenshot({ path: '.local/screenshots/live-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await visit('/app/dashboard');
  await page
    .locator('.quest-item')
    .filter({ hasText: 'Make a little progress' })
    .getByText('1 / 1 · 20 XP', { exact: true })
    .waitFor();
  await page.screenshot({ path: '.local/screenshots/live-dashboard.png', fullPage: true });
  assert.deepEqual(failures, [], 'Unexpected database/transport errors');
  assert.deepEqual(errors, [], 'Browser exceptions');
  console.log(
    'Live data browser flows passed against isolated PostgreSQL with Auth/PostgREST test doubles.',
  );
} finally {
  await browser.close();
  await db.close();
}
