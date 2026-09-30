import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMesh,
  interpolateMesh,
  validMesh,
  moveVertex,
  triangleTransform,
} from '../src/features/characters/portrait/rig/mesh.js';
import {
  openingPose,
  eyePose,
  gazeOffset,
  blinkPose,
} from '../src/features/characters/portrait/rig/eye.js';
import { browPose } from '../src/features/characters/portrait/rig/brow.js';
import {
  EXPRESSION_PRESETS,
  expressionPose,
  cleanPreset,
  validPose,
} from '../src/features/characters/portrait/rig/presets.js';
import {
  RIG_VERSION,
  RIG_PARTS,
  ORIGINAL_PART_SIZES,
  PREVIOUS_PART_SIZES,
} from '../src/features/characters/portrait/rig/definition.js';
import { mouthPose } from '../src/features/characters/portrait/rig/mouth.js';

test('one eyelid lattice opens and closes without changing its UV/source grid', () => {
  const rest = createMesh(184, 118, [0, 0.34, 0.66, 1]),
    before = JSON.stringify(rest);
  for (const openness of [0.005, 0.4, 1, 1.65])
    assert.ok(validMesh(openingPose(rest, openness), 184, 118));
  assert.equal(JSON.stringify(rest), before);
  const closed = blinkPose(rest, 1);
  assert.ok(closed[9].y - closed[5].y < 0.2);
});
test('independent brow columns support arch, slant and inner/outer displacement', () => {
  const rest = createMesh(142, 38),
    left = browPose(rest, { innerY: 12, outerY: -6, centerY: -4, stretch: 0.96 });
  assert.notEqual(left[1].y, left[0].y);
  assert.notEqual(left[3].y - rest[3].y, left[0].y - rest[0].y);
  assert.ok(validMesh(left, 142, 38));
  assert.equal(rest[0].y, 0);
});
test('gaze clamps independently and its travel decreases as the eye closes', () => {
  const rest = createMesh(184, 118, [0, 0.34, 0.66, 1]);
  assert.deepEqual(gazeOffset(rest, rest, 100, -100), { x: 13, y: -7 });
  assert.ok(Math.abs(gazeOffset(blinkPose(rest, 1), rest, 1, 1).x) < 0.1);
  assert.deepEqual(gazeOffset(rest, rest, NaN, Infinity), { x: 0, y: 0 });
});
test('editor rejects folded or unbounded meshes and interpolates genuine vertices', () => {
  const rest = createMesh(184, 118);
  assert.equal(moveVertex(rest, 5, { x: 900, y: 0 }, 184, 118), rest);
  const target = moveVertex(rest, 5, { x: 64, y: 35 }, 184, 118);
  assert.notDeepEqual(target, rest);
  assert.deepEqual(interpolateMesh(rest, target, 0), rest);
  assert.deepEqual(interpolateMesh(rest, target, 1), target);
  assert.equal(validMesh([null], 184, 118), false);
});
test('triangle mapping transforms texture coordinates to destination vertices', () => {
  const src = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ],
    dst = [
      { x: 2, y: 3 },
      { x: 12, y: 6 },
      { x: 4, y: 15 },
    ];
  const [a, b, c, d, e, f] = triangleTransform(src, dst);
  src.forEach((p, i) => {
    assert.ok(Math.abs(a * p.x + c * p.y + e - dst[i].x) < 1e-8);
    assert.ok(Math.abs(b * p.x + d * p.y + f - dst[i].y) < 1e-8);
  });
});
test('six expression presets and interpolated poses remain non-folding', () => {
  const neutral = expressionPose('neutral');
  for (const name of Object.keys(EXPRESSION_PRESETS)) {
    const target = expressionPose(name);
    assert.ok(validPose(target), name);
    for (let step = 0; step <= 10; step++)
      assert.ok(
        validPose(
          Object.fromEntries(
            Object.keys(target).map((k) => [k, interpolateMesh(neutral[k], target[k], step / 10)]),
          ),
        ),
        name + ' step ' + step,
      );
  }
});
test('mouth opening, smile and frown deform the same rest mesh', () => {
  const rest = createMesh(168, 92, [0, 0.34, 0.66, 1]);
  const closed = mouthPose(rest),
    open = mouthPose(rest, { open: 1.6 }),
    smile = mouthPose(rest, { open: 0.2, smile: 10 }),
    frown = mouthPose(rest, { smile: -10 });
  for (const pose of [closed, open, smile, frown]) assert.ok(validMesh(pose, 168, 92));
  assert.ok(open[9].y - open[5].y > closed[9].y - closed[5].y);
  assert.ok(smile[4].y < frown[4].y);
});
test('presets round-trip vertices only, reject invalid version/NaN/folds', () => {
  const value = {
    rigVersion: RIG_VERSION,
    name: 'Custom',
    pose: expressionPose('happy'),
    email: 'private',
  };
  const clean = cleanPreset(JSON.parse(JSON.stringify(value)));
  assert.equal(Object.hasOwn(clean, 'email'), false);
  assert.deepEqual(clean.pose, value.pose);
  assert.throws(() => cleanPreset({ ...value, rigVersion: 'other' }));
  const bad = structuredClone(value);
  bad.pose.leftEye[5].x = NaN;
  assert.throws(() => cleanPreset(bad));
});

for (const [version, sizes] of Object.entries({
  'painted-face-rig-v1': ORIGINAL_PART_SIZES,
  'painted-face-rig-v2': PREVIOUS_PART_SIZES,
}))
  test(`saved ${version} expressions retain normalized deformation after resizing facial parts`, () => {
    const current = expressionPose('angry');
    const old = Object.fromEntries(
      Object.entries(RIG_PARTS).map(([key, part]) => {
        const original = sizes[part.type];
        return [
          key,
          current[key].map((p) => ({
            x: (p.x * original.width) / part.width,
            y: (p.y * original.height) / part.height,
          })),
        ];
      }),
    );
    const saved = { rigVersion: version, name: 'Old custom expression', pose: old };
    const snapshot = structuredClone(saved);
    const migrated = cleanPreset(saved);
    assert.equal(migrated.rigVersion, RIG_VERSION);
    assert.deepEqual(saved, snapshot);
    assert.ok(validPose(migrated.pose));
    for (const key of Object.keys(current))
      current[key].forEach((p, i) => {
        assert.ok(Math.abs(migrated.pose[key][i].x - p.x) < 1e-8);
        assert.ok(Math.abs(migrated.pose[key][i].y - p.y) < 1e-8);
      });
    assert.deepEqual(cleanPreset(migrated), migrated);
    saved.pose.leftEye[5].x = NaN;
    assert.throws(() => cleanPreset(saved));
  });

test('hooded eye geometry remains valid throughout opening and independent blinking', () => {
  const { width, height } = RIG_PARTS.leftEye;
  const rest = createMesh(width, height, [0, 0.34, 0.66, 1]);
  for (const amount of [0.005, 0.22, 0.55, 0.85, 1, 1.5, 1.8]) {
    const pose = eyePose(rest, amount);
    for (const fraction of [0, 0.25, 0.5, 0.75, 1])
      assert.ok(validMesh(blinkPose(pose, fraction), width, height));
  }
});
