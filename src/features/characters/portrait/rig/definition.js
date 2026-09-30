import { createMesh } from './mesh.js';
export const RIG_VERSION = 'painted-face-rig-v3';
// Original local dimensions allow saved mesh presets to follow proportion changes.
export const ORIGINAL_PART_SIZES = {
  eye: { width: 184, height: 118 },
  brow: { width: 142, height: 38 },
  mouth: { width: 168, height: 92 },
};
export const PREVIOUS_PART_SIZES = {
  eye: { width: 147, height: 88 },
  brow: { width: 126, height: 32 },
  mouth: { width: 168, height: 92 },
};
export const RIG_PARTS = {
  leftEye: {
    label: 'Left eye (screen left)',
    x: 354,
    y: 419,
    width: 140,
    height: 82,
    type: 'eye',
    mirror: false,
  },
  rightEye: {
    label: 'Right eye (screen right)',
    x: 530,
    y: 419,
    width: 140,
    height: 82,
    type: 'eye',
    mirror: true,
  },
  leftBrow: {
    label: 'Left eyebrow',
    x: 361,
    y: 405,
    width: 126,
    height: 32,
    type: 'brow',
    mirror: false,
  },
  rightBrow: {
    label: 'Right eyebrow',
    x: 537,
    y: 405,
    width: 126,
    height: 32,
    type: 'brow',
    mirror: true,
  },
  mouth: { label: 'Mouth', x: 420, y: 602, width: 184, height: 88, type: 'mouth', mirror: false },
};
export function restMesh(key) {
  const p = RIG_PARTS[key];
  return createMesh(p.width, p.height, p.type === 'brow' ? undefined : [0, 0.34, 0.66, 1]);
}
export function neutralPose() {
  return Object.fromEntries(Object.keys(RIG_PARTS).map((key) => [key, restMesh(key)]));
}
