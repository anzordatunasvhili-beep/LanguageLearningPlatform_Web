import { LAYERS, TEMPLATE } from './data/template.js';
import { cleanCharacter } from './data/character.js';

const images = new Map();
const variants = new Map();
const CACHE_LIMIT = 16;
const ROOT = '/characters/painted-v1/';
const BASE = {
  skin: '#d6a377',
  hair: '#3e3027',
  brows: '#3e3027',
  eyes: '#856546',
  lips: '#a56350',
};
const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));

export function layerPlan(character) {
  const identity = cleanCharacter(character);
  return LAYERS.map((layer) => ({
    ...layer,
    id: [identity.parts[layer.slot], layer.piece].filter(Boolean).join('-'),
    tint: identity.colors[layer.color],
    skin: identity.colors.skin,
  }));
}

function loadImage(id) {
  if (!images.has(id)) {
    const pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        images.delete(id);
        reject(new Error('A portrait layer could not load. Please try again.'));
      };
      image.src = ROOT + id + '.png';
    });
    images.set(id, pending);
  }
  return images.get(id);
}

// Piecewise channel mapping preserves black ink and white highlights while
// shifting the painted midtone. Applied to raster pixels, never CSS/SVG filters.
export function tintChannel(value, source, target) {
  return Math.round(
    value <= source
      ? (value * target) / source
      : target + ((value - source) * (255 - target)) / (255 - source),
  );
}
function shift(data, i, from, to) {
  for (let channel = 0; channel < 3; channel++)
    data[i + channel] = tintChannel(data[i + channel], from[channel], to[channel]);
}

export async function rasterVariant(layer) {
  const key = [layer.id, layer.tint, layer.skin].join(':');
  if (variants.has(key)) {
    const value = variants.get(key);
    variants.delete(key);
    variants.set(key, value);
    return value;
  }
  const image = await loadImage(layer.id);
  const canvas = document.createElement('canvas');
  canvas.width = TEMPLATE.width;
  canvas.height = TEMPLATE.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const from = rgb(BASE[layer.color]),
    to = rgb(layer.tint);
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data[i + 3]) shift(frame.data, i, from, to);
  }
  ctx.putImageData(frame, 0, 0);
  variants.set(key, canvas);
  while (variants.size > CACHE_LIMIT) variants.delete(variants.keys().next().value);
  return canvas;
}

export async function composePortrait(character, expression, options) {
  const { renderRigStill } = await import('./rig/renderer.js');
  return renderRigStill(character, expression, options);
}
