// Raster-only authoring pipeline. The input file maps asset IDs to generated PNGs.
// Run with the local Playwright QA installation; generated artwork is never redrawn.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '../.tools/qa/node_modules/playwright/index.mjs';
const source = JSON.parse(
  await readFile(process.argv[2] || '.local/portrait-sources.json', 'utf8'),
);
const output = 'public/characters/painted-v1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
const registrations = {};
// Each rectangle is authored once for a part, never for a combination. Every
// published PNG has exactly the same transparent 1024-square canvas thereafter.
const rectangles = {
  'head-a': [295, 155, 434, 615],
  'head-b': [282, 155, 460, 615],
  'nose-a': [461, 429, 102, 174],
  'nose-b': [453, 429, 118, 174],
  'neck-a': [362, 690, 300, 302],
  'hair-a-back': [270, 112, 484, 380],
  'hair-a-front': [265, 90, 494, 380],
  'hair-b-back': [235, 115, 554, 650],
  'hair-b-front': [210, 105, 604, 690],
};
try {
  for (const [id, path] of Object.entries(source)) {
    if (id === 'master') continue;
    const data = 'data:image/png;base64,' + (await readFile(path)).toString('base64');
    const result = await page.evaluate(
      async ({ id, data, rect }) => {
        const img = new Image();
        img.src = data;
        await img.decode();
        const original = document.createElement('canvas');
        original.width = img.width;
        original.height = img.height;
        const oc = original.getContext('2d', { willReadFrequently: true });
        oc.drawImage(img, 0, 0);
        const pixels = oc.getImageData(0, 0, img.width, img.height).data;
        let transparent = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 0) transparent++;
        if (transparent < img.width * img.height * 0.15)
          throw Error(id + ': missing genuine alpha');
        function bounds(start = 0, end = img.width) {
          let x1 = end,
            y1 = img.height,
            x2 = -1,
            y2 = -1;
          for (let y = 0; y < img.height; y++)
            for (let x = start; x < end; x++) {
              if (pixels[(y * img.width + x) * 4 + 3] > 24) {
                x1 = Math.min(x1, x);
                x2 = Math.max(x2, x);
                y1 = Math.min(y1, y);
                y2 = Math.max(y2, y);
              }
            }
          if (x2 < x1) throw Error(id + ': empty part');
          return [
            Math.max(start, x1 - 2),
            Math.max(0, y1 - 2),
            Math.min(end, x2 + 3) - Math.max(start, x1 - 2),
            Math.min(img.height, y2 + 3) - Math.max(0, y1 - 2),
          ];
        }
        const out = document.createElement('canvas');
        out.width = 1024;
        out.height = 1024;
        const ctx = out.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        const regions = [];
        if (/^(eyes|brows|ears)-/.test(id)) {
          for (let side = 0; side < 2; side++) {
            const b = bounds(
              side ? Math.floor(img.width / 2) : 0,
              side ? img.width : Math.floor(img.width / 2),
            );
            const x = side ? 606 : 418;
            let target;
            if (id.startsWith('eyes-')) target = [x - 76, 422, 152, 90];
            if (id.startsWith('brows-'))
              target = [
                x - 71,
                id.endsWith('happy') ? 387 : 393,
                142,
                id.endsWith('serious') ? 37 : 31,
              ];
            if (id.startsWith('ears-')) target = [side ? 683 : 277, 442, 64, 139];
            ctx.drawImage(original, ...b, ...target);
            regions.push({ source: b, target });
          }
        } else {
          const b = bounds();
          if (id.startsWith('mouth-')) {
            const narrow = id.startsWith('mouth-b');
            const h = id.endsWith('speaking') ? 74 : id.endsWith('smile') ? 56 : narrow ? 44 : 54;
            rect = [narrow ? 439 : 442, 632, narrow ? 146 : 140, h];
          }
          if (!rect) throw Error('Missing registration: ' + id);
          ctx.drawImage(original, ...b, ...rect);
          regions.push({ source: b, target: rect });
        }
        return {
          png: out.toDataURL('image/png').split(',')[1],
          sourceSize: [img.width, img.height],
          regions,
          transparent,
        };
      },
      { id, data, rect: rectangles[id] },
    );
    await writeFile(output + '/' + id + '.png', Buffer.from(result.png, 'base64'));
    const { png, ...metadata } = result;
    registrations[id] = metadata;
    console.log(id + ': registered with real alpha');
  }
  await writeFile(
    output + '/registration.json',
    JSON.stringify(
      { template: 'frontal-painted-v1', canvas: [1024, 1024], assets: registrations },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
