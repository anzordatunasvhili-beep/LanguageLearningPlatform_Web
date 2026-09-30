const cache = new Map();
export function loadTexture(path) {
  if (!cache.has(path))
    cache.set(
      path,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => {
          cache.delete(path);
          reject(new Error('A facial rig texture failed to load. Please retry.'));
        };
        image.src = path;
      }),
    );
  return cache.get(path);
}
export function surface(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
export async function loadEyeTextures() {
  const [front, opening, white, iris] = await Promise.all(
    ['eye-front', 'eye-opening', 'eye-white', 'iris'].map((id) =>
      loadTexture('/characters/rig-v1/' + id + '.png'),
    ),
  );
  return { front, opening, white, iris };
}

export function cropTexture(image, x, y, width, height, outWidth = width, outHeight = height) {
  const canvas = surface(outWidth * 4, outHeight * 4);
  canvas.getContext('2d').drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return canvas;
}
export function tintTexture(image, from, to) {
  const out = surface(image.width, image.height),
    ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  if (from.toLowerCase() === to.toLowerCase()) return out;
  const source = [1, 3, 5].map((i) => parseInt(from.slice(i, i + 2), 16)),
    target = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
  const frame = ctx.getImageData(0, 0, out.width, out.height);
  for (let i = 0; i < frame.data.length; i += 4) {
    if (!frame.data[i + 3]) continue;
    for (let c = 0; c < 3; c++) {
      const v = frame.data[i + c],
        s = source[c],
        t = target[c];
      frame.data[i + c] = Math.round(v <= s ? (v * t) / s : t + ((v - s) * (255 - t)) / (255 - s));
    }
  }
  ctx.putImageData(frame, 0, 0);
  return out;
}
