import {
  RIG_VERSION,
  RIG_PARTS,
  ORIGINAL_PART_SIZES,
  PREVIOUS_PART_SIZES,
  neutralPose,
  restMesh,
} from './definition.js';
import { eyePose } from './eye.js';
import { browPose } from './brow.js';
import { mouthPose } from './mouth.js';
import { cloneMesh, validMesh } from './mesh.js';

// Presets contain deformation parameters, not paths or alternate expressions.
export const EXPRESSION_PRESETS = {
  neutral: { eye: { open: 0.85, slant: 0 }, brow: {}, mouth: { open: 0.005, smile: 0 } },
  happy: {
    eye: { open: 0.55, slant: -3 },
    brow: { innerY: -5, centerY: -5, outerY: -2 },
    mouth: { open: 0.2, smile: 10 },
  },
  angry: {
    eye: { open: 0.65, slant: 15 },
    brow: { innerY: 9, outerY: -8, centerY: -2 },
    mouth: { open: 0.005, smile: -5 },
  },
  sad: {
    eye: { open: 0.7, slant: -12 },
    brow: { innerY: -12, outerY: 5, centerY: -2 },
    mouth: { open: 0.005, smile: -10 },
  },
  surprised: {
    eye: { open: 1.5, slant: 0 },
    brow: { innerY: -13, outerY: -10, centerY: -6 },
    mouth: { open: 1.5, smile: 0 },
  },
  sleepy: {
    eye: { open: 0.22, slant: 0 },
    brow: { innerY: 3, outerY: 2, centerY: 0 },
    mouth: { open: 0.005, smile: 0 },
  },
};
export const MOUTH_STATES = {
  mouth_closed: { open: 0.005 },
  mouth_small_open: { open: 0.4 },
  mouth_medium_open: { open: 0.9 },
  mouth_wide_open: { open: 1.6 },
  mouth_smile: { open: 0.2, smile: 10 },
  mouth_frown: { open: 0.005, smile: -10 },
};
export const canonicalExpression = (name) =>
  name === 'serious' ? 'angry' : Object.hasOwn(EXPRESSION_PRESETS, name) ? name : 'neutral';
export function expressionPose(name = 'neutral') {
  const data = EXPRESSION_PRESETS[canonicalExpression(name)],
    pose = neutralPose();
  for (const key of ['leftEye', 'rightEye'])
    pose[key] = eyePose(
      restMesh(key),
      data.eye.open,
      (data.eye.slant * RIG_PARTS[key].height) / ORIGINAL_PART_SIZES.eye.height,
    );
  for (const key of ['leftBrow', 'rightBrow']) {
    const scale = RIG_PARTS[key].height / ORIGINAL_PART_SIZES.brow.height;
    pose[key] = browPose(
      restMesh(key),
      Object.fromEntries(Object.entries(data.brow).map(([axis, value]) => [axis, value * scale])),
    );
  }
  pose.mouth = mouthPose(restMesh('mouth'), data.mouth);
  return pose;
}
export function validPose(pose) {
  return (
    Boolean(pose) &&
    Object.entries(RIG_PARTS).every(([key, p]) => validMesh(pose[key], p.width, p.height))
  );
}
export function cleanPreset(input) {
  // Preserve saved expressions from both earlier proportion passes.
  const previous =
    input?.rigVersion === 'painted-face-rig-v1'
      ? ORIGINAL_PART_SIZES
      : input?.rigVersion === 'painted-face-rig-v2'
        ? PREVIOUS_PART_SIZES
        : null;
  if (previous) {
    const compatible = Object.entries(RIG_PARTS).every(([key, part]) => {
      const original = previous[part.type];
      return validMesh(input.pose?.[key], original.width, original.height);
    });
    if (!compatible)
      throw new Error('Invalid rig preset. Use a compatible preset with non-folding mesh points.');
    input = {
      ...input,
      rigVersion: RIG_VERSION,
      pose: Object.fromEntries(
        Object.entries(RIG_PARTS).map(([key, part]) => {
          const original = previous[part.type];
          return [
            key,
            input.pose[key].map((point) => ({
              x: (point.x * part.width) / original.width,
              y: (point.y * part.height) / original.height,
            })),
          ];
        }),
      ),
    };
  }
  if (
    !input ||
    input.rigVersion !== RIG_VERSION ||
    typeof input.name !== 'string' ||
    !input.name.trim() ||
    input.name.length > 64 ||
    !validPose(input.pose)
  )
    throw new Error('Invalid rig preset. Use a compatible preset with non-folding mesh points.');
  return {
    rigVersion: RIG_VERSION,
    name: input.name.trim(),
    pose: Object.fromEntries(
      Object.keys(RIG_PARTS).map((key) => [key, cloneMesh(input.pose[key])]),
    ),
  };
}
