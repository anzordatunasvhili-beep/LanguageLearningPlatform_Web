import { chromium } from '../.tools/qa/node_modules/playwright/index.mjs';
import { db, installRoutes, uid } from './browser-database.mjs';
import { writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.PORTRAIT_TEST_URL || 'http://127.0.0.1:5191';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
  errors = [],
  requests = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('request', (r) => {
  if (r.url().includes('/characters/') && r.url().endsWith('.png')) requests.push(r.url());
});
const failures = await installRoutes(page);
const ready = () => page.locator('.modular-portrait[data-ready="true"]').first().waitFor();
try {
  await page.goto(base + '/character-lab');
  await ready();
  assert.equal(await page.locator('.rig-vertex').count(), 16);
  const point = page.getByRole('button', { name: 'Left eye (screen left) point 5', exact: true });
  const y = Number(await point.getAttribute('data-y'));
  const box = await point.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 12, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(
    (y) => Number(document.querySelectorAll('.rig-vertex')[5].dataset.y) < y - 1,
    y,
  );
  const changed = Number(await point.getAttribute('data-y'));
  await page.getByLabel('Preset name', { exact: true }).fill('Dragged eye');
  await page.getByRole('button', { name: 'Save preset', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Preset saved' }).waitFor();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('kotoba.facial-rig.presets.v1'))[0],
  );
  assert.ok(Math.abs(saved.pose.leftEye[5].y - changed) < 0.05);
  await page.getByRole('button', { name: 'Reset selected mesh' }).click();
  await page.waitForFunction(
    (y) => Math.abs(Number(document.querySelectorAll('.rig-vertex')[5].dataset.y) - y) > 1,
    changed,
  );
  await page.getByRole('button', { name: 'Load preset', exact: true }).click();
  await page.waitForFunction(
    (y) => Math.abs(Number(document.querySelectorAll('.rig-vertex')[5].dataset.y) - y) < 0.1,
    changed,
  );
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export preset', exact: true }).click();
  const file = await download;
  assert.deepEqual(JSON.parse(await readFile(await file.path(), 'utf8')).pose, saved.pose);
  await page.getByLabel('Import deformation preset').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"rigVersion":"wrong"}'),
  });
  await page.getByRole('alert').filter({ hasText: 'Invalid rig preset' }).waitFor();
  await page.getByLabel('Import deformation preset').setInputFiles({
    name: 'saved.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await page.getByRole('status').filter({ hasText: 'Preset imported' }).waitFor();
  await page.reload();
  await ready();
  await page.getByLabel('Saved presets').selectOption('Dragged eye');
  await page.getByRole('button', { name: 'Load preset', exact: true }).click();
  await page.waitForFunction(
    (y) => Math.abs(Number(document.querySelectorAll('.rig-vertex')[5].dataset.y) - y) < 0.1,
    changed,
  );
  for (const [key, label] of [
    ['rightEye', 'Right eye (screen right)'],
    ['leftBrow', 'Left eyebrow'],
    ['rightBrow', 'Right eyebrow'],
    ['mouth', 'Mouth'],
  ]) {
    await page.getByLabel('Edit mesh').selectOption(key);
    await page.waitForFunction(
      (key) => document.querySelectorAll('.rig-vertex')[5].dataset.part === key,
      key,
    );
    const p = page.getByRole('button', { name: label + ' point 5', exact: true });
    const before = Number(await p.getAttribute('data-y'));
    await p.focus();
    await page.keyboard.press('ArrowUp');
    await page.waitForFunction(
      (v) => Number(document.querySelectorAll('.rig-vertex')[5].dataset.y) < v - 0.5,
      before,
    );
  }
  const networkBefore = requests.length;
  for (const name of ['Happy', 'Angry', 'Sad', 'Surprised', 'Sleepy', 'Neutral'])
    await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Blink left', exact: true }).click();
  await page.getByRole('button', { name: 'Blink right', exact: true }).click();
  assert.equal(requests.length, networkBefore, 'Expressions must not fetch alternate art');
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
      'Overflow at ' + width,
    );
    await page.screenshot({
      path: '.local/screenshots/facial-rig-' + width + '.png',
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  const results = await page.evaluate(async () => {
    const { prepareRig, createRigRenderer } =
      await import('/src/features/characters/portrait/rig/renderer.js');
    const { createCharacter } = await import('/src/features/characters/portrait/data/character.js');
    const { createEyePainter, eyePose } =
      await import('/src/features/characters/portrait/rig/eye.js');
    const { restMesh, RIG_PARTS } =
      await import('/src/features/characters/portrait/rig/definition.js');
    const { createMouthPainter, mouthPose } =
      await import('/src/features/characters/portrait/rig/mouth.js');
    const { expressionPose } = await import('/src/features/characters/portrait/rig/presets.js');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const identity = createCharacter(),
      snapshot = JSON.stringify(identity),
      assets = await prepareRig(identity),
      canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const frames = [];
    const rig = createRigRenderer(canvas, assets, { onFrame: (frame) => frames.push(frame) });
    const first = rig.getState().pose;
    rig.setExpression('surprised', 400);
    await wait(120);
    const mid = rig.getState().pose;
    await wait(350);
    const end = rig.getState().pose;
    const rightBefore = JSON.stringify(end.rightEye),
      startFrame = frames.length;
    rig.blinkLeft();
    await wait(360);
    const blinkFrames = frames.slice(startFrame),
      closed = blinkFrames.some((f) => f.pose.leftEye[9].y - f.pose.leftEye[5].y < 1),
      rightUnchanged = blinkFrames.every((f) => JSON.stringify(f.pose.rightEye) === rightBefore);
    rig.setLookDirection(99, -99);
    const gaze = rig.getState().gaze;
    rig.setMouthState('mouth_wide_open', 0);
    const eyesAfter = JSON.stringify(rig.getState().pose.leftEye);
    const mouthOpen = rig.getState().pose.mouth;
    rig.setMouthState('mouth_closed', 0);
    const mouthClosed = rig.getState().pose.mouth;
    const lastFrames = frames.length;
    await wait(100);
    const stopped = frames.length <= lastFrames + 1;
    // Diagnostic raster test: use a solid red iris behind the real opening mask.
    // Count visible red pixels: this tests actual compositing, not just pose data.
    const red = document.createElement('canvas');
    red.width = red.height = 256;
    const rc = red.getContext('2d');
    rc.fillStyle = '#ff0000';
    rc.fillRect(0, 0, 256, 256);
    const testCanvas = document.createElement('canvas');
    testCanvas.width = RIG_PARTS.leftEye.width;
    testCanvas.height = RIG_PARTS.leftEye.height;
    const tc = testCanvas.getContext('2d', { willReadFrequently: true });
    const paint = createEyePainter(
      { ...assets.eye, iris: red },
      { ...RIG_PARTS.leftEye, x: 0, y: 0 },
      restMesh('leftEye'),
    );
    function redPixels(amount) {
      tc.clearRect(0, 0, testCanvas.width, testCanvas.height);
      paint(tc, eyePose(restMesh('leftEye'), amount), {
        layers: { eyelids: false, eyeball: false },
      });
      const data = tc.getImageData(0, 0, testCanvas.width, testCanvas.height).data;
      let count = 0;
      for (let i = 0; i < data.length; i += 4)
        if (data[i] > 200 && data[i + 1] < 30 && data[i + 3] > 100) count++;
      return count;
    }
    const coverage = [1.65, 1, 0.4, 0.005].map(redPixels);
    rig.destroy();
    return {
      first,
      mid,
      end,
      closed,
      rightUnchanged,
      gaze,
      eyesAfter,
      eyeBefore: JSON.stringify(end.leftEye),
      mouthOpen,
      mouthClosed,
      stopped,
      coverage,
      identityUnchanged: JSON.stringify(identity) === snapshot,
      frames: frames.length,
      neutral: expressionPose('neutral'),
    };
  });
  assert.notDeepEqual(results.mid, results.first);
  assert.notDeepEqual(results.mid, results.end);
  assert.ok(results.closed && results.rightUnchanged, 'Left blink only');
  assert.deepEqual(results.gaze, { x: 1, y: -1 });
  assert.equal(results.eyesAfter, results.eyeBefore, 'Mouth override preserves eyes');
  assert.ok(
    results.mouthOpen[9].y - results.mouthOpen[5].y >
      results.mouthClosed[9].y - results.mouthClosed[5].y,
  );
  assert.ok(results.stopped && results.identityUnchanged);
  assert.ok(
    results.coverage[0] > results.coverage[1] &&
      results.coverage[1] > results.coverage[2] &&
      results.coverage[3] < results.coverage[1] * 0.02,
    JSON.stringify(results.coverage),
  );
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await ready();
  await page.getByRole('button', { name: 'B · Layered bob', exact: true }).click();
  await page.getByRole('button', { name: 'Save browser draft' }).click();
  await page.goto(base + '/auth/login');
  await page.getByLabel('Email address').fill('browser@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Browser-password1!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/app/dashboard');
  await page.goto(base + '/app/avatar');
  await ready();
  await page.getByRole('button', { name: 'B · Layered bob', exact: true }).click();
  await page.getByRole('button', { name: 'Save to account', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Portrait saved' }).waitFor();
  assert.equal(
    (await db.query('select definition from public.user_portraits where user_id=$1', [uid])).rows[0]
      .definition.parts.hair,
    'hair-b',
  );
  await page.reload();
  await ready();
  assert.equal(
    await page
      .getByRole('button', { name: 'B · Layered bob', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  const id = '50000000-0000-4000-8000-000000000001';
  await page.goto(base + '/app/ai/characters/' + id);
  await ready();
  const detail = await page.locator('.modular-portrait canvas').evaluate((c) => c.toDataURL());
  await page.getByRole('link', { name: 'Start conversation' }).first().click();
  await ready();
  const chat = await page.locator('.modular-portrait canvas').evaluate((c) => c.toDataURL());
  assert.equal(detail, chat);
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  console.log(
    'PASS: real vertex dragging/keyboard editing, preset save/reload/import/export, no expression texture fetches, independent blink, clipped round iris, interpolation, idle RAF stop, responsive editor, account persistence and conversation identity.',
  );
  console.log('Visible diagnostic iris pixels (wide/normal/narrow/closed):', results.coverage);
} finally {
  await browser.close();
  await db.close();
}
