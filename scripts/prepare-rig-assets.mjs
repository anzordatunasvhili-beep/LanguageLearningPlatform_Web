// Register generated raster cutouts and extract their enclosed alpha openings.
// No face artwork is drawn here; source pixels remain the visual source.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '../.tools/qa/node_modules/playwright/index.mjs';
const sources = JSON.parse(await readFile('.local/rig-sources.json', 'utf8'));
const dir = 'public/characters/rig-v1';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage();
const metadata = {};
try {
  for (const [id, path] of Object.entries(sources)) {
    const source = await readFile(path);
    await writeFile(dir + '/' + id + '-source.png', source);
    const result = await page.evaluate(
      async ({ id, data }) => {
        const image = new Image();
        image.src = data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0);
        if (id === 'brow') ctx.clearRect(image.width / 2, 0, image.width / 2, image.height);
        const frame = ctx.getImageData(0, 0, image.width, image.height),
          p = frame.data,
          w = image.width,
          h = image.height;
        let left = w,
          top = h,
          right = 0,
          bottom = 0,
          alpha = 0;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const a = p[(y * w + x) * 4 + 3];
            if (a < 10) alpha++;
            if (a > 32) {
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
          }
        if (alpha < w * h * 0.1) throw Error(id + ': no transparent background');
        const dest = document.createElement('canvas');
        dest.width =
          id === 'eye-front'
            ? 184
            : id === 'mouth-front'
              ? 168
              : id === 'iris'
                ? 64
                : id === 'brow'
                  ? 142
                  : 184;
        dest.height =
          id === 'eye-front'
            ? 118
            : id === 'mouth-front'
              ? 92
              : id === 'iris'
                ? 64
                : id === 'brow'
                  ? 38
                  : 184;
        dest.width *= 4;
        dest.height *= 4;
        const dc = dest.getContext('2d');
        dc.imageSmoothingQuality = 'high';
        let holeInfo = null,
          maskUrl = null;
        if (id.endsWith('-front')) {
          const visited = new Uint8Array(w * h),
            queue = new Int32Array(w * h);
          let largest = [];
          for (let start = 0; start < w * h; start++) {
            if (visited[start] || p[start * 4 + 3] > 100) continue;
            let head = 0,
              tail = 0,
              touches = false;
            queue[tail++] = start;
            visited[start] = 1;
            while (head < tail) {
              const i = queue[head++],
                x = i % w,
                y = Math.floor(i / w);
              if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touches = true;
              for (const n of [
                x > 0 ? i - 1 : -1,
                x < w - 1 ? i + 1 : -1,
                y > 0 ? i - w : -1,
                y < h - 1 ? i + w : -1,
              ])
                if (n >= 0 && !visited[n] && p[n * 4 + 3] <= 100) {
                  visited[n] = 1;
                  queue[tail++] = n;
                }
            }
            if (!touches && tail > largest.length) largest = Array.from(queue.subarray(0, tail));
          }
          if (largest.length < 100) throw Error(id + ': missing enclosed transparent opening');
          let hl = w,
            ht = h,
            hr = 0,
            hb = 0;
          for (const i of largest) {
            hl = Math.min(hl, i % w);
            hr = Math.max(hr, i % w);
            ht = Math.min(ht, Math.floor(i / w));
            hb = Math.max(hb, Math.floor(i / w));
          }
          const mask = document.createElement('canvas');
          mask.width = w;
          mask.height = h;
          const mc = mask.getContext('2d'),
            mf = mc.createImageData(w, h);
          // Expand two source pixels under the antialiased ink edge to prevent gaps.
          for (const i of largest)
            for (let dy = -2; dy <= 2; dy++)
              for (let dx = -2; dx <= 2; dx++) {
                const x = (i % w) + dx,
                  y = Math.floor(i / w) + dy;
                if (x >= 0 && x < w && y >= 0 && y < h) {
                  const n = (y * w + x) * 4;
                  mf.data[n] = mf.data[n + 1] = mf.data[n + 2] = mf.data[n + 3] = 255;
                }
              }
          mc.putImageData(mf, 0, 0);
          const outMask = document.createElement('canvas');
          outMask.width = dest.width;
          outMask.height = dest.height;
          const om = outMask.getContext('2d');
          const sx = [left, hl, hr + 1, right + 1],
            sy = [top, ht, hb + 1, bottom + 1],
            tx = [0, dest.width * 0.17, dest.width * 0.83, dest.width],
            ty = [0, dest.height * 0.34, dest.height * 0.66, dest.height];
          for (let r = 0; r < 3; r++)
            for (let c = 0; c < 3; c++)
              for (const [context, src] of [
                [dc, canvas],
                [om, mask],
              ])
                context.drawImage(
                  src,
                  sx[c],
                  sy[r],
                  sx[c + 1] - sx[c],
                  sy[r + 1] - sy[r],
                  tx[c],
                  ty[r],
                  tx[c + 1] - tx[c],
                  ty[r + 1] - ty[r],
                );
          holeInfo = {
            source: [hl, ht, hr - hl + 1, hb - ht + 1],
            registered: [0.17, 0.34, 0.83, 0.66],
          };
          maskUrl = outMask.toDataURL().split(',')[1];
        } else
          dc.drawImage(
            canvas,
            left,
            top,
            right - left + 1,
            bottom - top + 1,
            0,
            0,
            dest.width,
            dest.height,
          );
        return {
          png: dest.toDataURL().split(',')[1],
          mask: maskUrl,
          sourceSize: [w, h],
          size: [dest.width, dest.height],
          bounds: [left, top, right, bottom],
          hole: holeInfo,
        };
      },
      { id, data: 'data:image/png;base64,' + source.toString('base64') },
    );
    await writeFile(dir + '/' + id + '.png', Buffer.from(result.png, 'base64'));
    if (result.mask)
      await writeFile(
        dir + '/' + id.replace('-front', '-opening') + '.png',
        Buffer.from(result.mask, 'base64'),
      );
    const { png, mask, ...meta } = result;
    metadata[id] = meta;
    console.log(id, meta);
  }
  await writeFile(dir + '/registration.json', JSON.stringify(metadata, null, 2));
} finally {
  await browser.close();
}
