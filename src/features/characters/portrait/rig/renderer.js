import { rasterVariant } from '../renderRaster.js';
import { cleanCharacter } from '../data/character.js';
import { ANCHORS, GUIDES } from '../data/template.js';
import { loadTexture, loadEyeTextures, tintTexture, surface } from './assets.js';
import { RIG_PARTS, RIG_VERSION, restMesh } from './definition.js';
import { expressionPose, canonicalExpression, cleanPreset, MOUTH_STATES } from './presets.js';
import { interpolateMesh, cloneMesh, moveVertex } from './mesh.js';
import { createEyePainter, blinkPose, eyePose } from './eye.js';
import { paintBrow } from './brow.js';
import { createMouthPainter, mouthPose } from './mouth.js';

const STATIC = [
  { slot: 'hair', piece: 'back', color: 'hair' },
  { slot: 'neck', color: 'skin' },
  { slot: 'ears', color: 'skin' },
  { slot: 'head', color: 'skin' },
  { slot: 'nose', color: 'skin' },
];
const copyPose = (pose) =>
  Object.fromEntries(Object.entries(pose).map(([key, mesh]) => [key, cloneMesh(mesh)]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));

export async function prepareRig(character) {
  const identity = cleanCharacter(character);
  const original = await loadEyeTextures();
  const [mouthFront, mouthOpening, mouthInterior, browImage] = await Promise.all(
    ['mouth-front', 'mouth-opening', 'mouth-interior', 'brow'].map((id) =>
      loadTexture('/characters/rig-v1/' + id + '.png'),
    ),
  );
  const eye = {
    ...original,
    front: tintTexture(original.front, '#c78e65', identity.colors.skin),
    iris: tintTexture(original.iris, '#a46f32', identity.colors.eyes),
  };
  const mouth = {
    front: tintTexture(mouthFront, '#d6a377', identity.colors.skin),
    opening: mouthOpening,
    interior: mouthInterior,
  };
  // The lip tint is applied within a raster mask around the painted lip ring.
  const lipTint = tintTexture(mouth.front, '#a56350', identity.colors.lips);
  const lipContext = mouth.front.getContext('2d');
  lipContext.save();
  lipContext.beginPath();
  lipContext.ellipse(
    mouth.front.width / 2,
    mouth.front.height / 2,
    mouth.front.width * 0.38,
    mouth.front.height * 0.24,
    0,
    0,
    Math.PI * 2,
  );
  lipContext.clip();
  lipContext.drawImage(lipTint, 0, 0);
  lipContext.restore();
  const brow = tintTexture(browImage, '#3e3027', identity.colors.brows);
  const staticLayers = await Promise.all(
    STATIC.map(async (layer) => ({
      slot: layer.slot,
      image: await rasterVariant({
        ...layer,
        id: identity.parts[layer.slot] + (layer.piece ? '-' + layer.piece : ''),
        tint: identity.colors[layer.color],
        skin: identity.colors.skin,
      }),
    })),
  );
  const hair = await rasterVariant({
    slot: 'hair',
    color: 'hair',
    id: identity.parts.hair + '-front',
    tint: identity.colors.hair,
    skin: identity.colors.skin,
  });
  return { eye, mouth, brow, staticLayers, hair, identity };
}

export function createRigRenderer(
  canvas,
  assets,
  { onFrame = () => {}, reducedMotion = false } = {},
) {
  const ctx = canvas.getContext('2d');
  const painters = {
    leftEye: createEyePainter(assets.eye, RIG_PARTS.leftEye, restMesh('leftEye')),
    rightEye: createEyePainter(assets.eye, RIG_PARTS.rightEye, restMesh('rightEye')),
    mouth: createMouthPainter(assets.mouth, RIG_PARTS.mouth, restMesh('mouth')),
  };
  let pose = expressionPose('neutral'),
    from = copyPose(pose),
    target = copyPose(pose),
    start = 0,
    duration = 0;
  let frame = 0,
    disposed = false,
    expression = 'neutral',
    gaze = { x: 0, y: 0 },
    blinks = {},
    mouthOverride = null;
  let view = { x: 0, y: 0, size: 1024 },
    layers = {},
    debug = { mesh: false, landmarks: false, selected: 'leftEye' };
  const now = () => performance.now();
  function update(time) {
    if (duration) {
      const fraction = clamp((time - start) / duration, 0, 1),
        ease = fraction * fraction * (3 - 2 * fraction);
      for (const key of Object.keys(RIG_PARTS))
        pose[key] = interpolateMesh(from[key], target[key], ease);
      if (fraction >= 1) duration = 0;
    }
  }
  function blinkAmount(time, key) {
    if (blinks[key] === undefined) return 0;
    const t = (time - blinks[key]) / 300;
    if (t >= 1) {
      delete blinks[key];
      return 0;
    }
    return t < 0.3 ? t / 0.3 : t < 0.48 ? 1 : 1 - (t - 0.48) / 0.52;
  }
  function worldPoint(key, p) {
    const d = RIG_PARTS[key];
    return { x: d.x + (d.mirror ? d.width - p.x : p.x), y: d.y + p.y };
  }
  function draw(time = now()) {
    if (disposed) return;
    update(time);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const visible = copyPose(pose);
    for (const key of ['leftEye', 'rightEye'])
      visible[key] = blinkPose(pose[key], blinkAmount(time, key));
    ctx.save();
    ctx.scale(canvas.width / view.size, canvas.height / view.size);
    ctx.translate(-view.x, -view.y);
    if (layers.body !== false)
      for (const layer of assets.staticLayers)
        if (layers[layer.slot] !== false) {
          ctx.save();
          if (layer.slot === 'nose') {
            // Strengthen the existing painted bridge and nostrils around their
            // shared anchor; both swappable noses retain their original height.
            ctx.translate(512, 559);
            ctx.scale(1.15, 1);
            ctx.translate(-512, -559);
          }
          ctx.drawImage(layer.image, 0, 0);
          ctx.restore();
        }
    for (const key of ['leftEye', 'rightEye'])
      if (layers[key] !== false) painters[key](ctx, visible[key], { gaze, layers });
    for (const key of ['leftBrow', 'rightBrow'])
      if (layers[key] !== false)
        paintBrow(ctx, assets.brow, RIG_PARTS[key], restMesh(key), visible[key]);
    if (layers.mouth !== false) painters.mouth(ctx, visible.mouth, { layers });
    if (layers.hairFront !== false && layers.body !== false) ctx.drawImage(assets.hair, 0, 0);
    if (debug.landmarks) {
      ctx.strokeStyle = '#267c80';
      ctx.fillStyle = '#267c80';
      ctx.lineWidth = 0.7;
      ctx.font = '11px monospace';
      for (const [name, y] of Object.entries(GUIDES)) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
        ctx.fillText(name, 12, y - 4);
      }
      for (const [name, [x, y]] of Object.entries(ANCHORS)) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(name, x + 5, y);
      }
    }
    if (debug.mesh) {
      const mesh = visible[debug.selected];
      ctx.strokeStyle = '#1b9dae';
      ctx.lineWidth = 1;
      ctx.font = '8px monospace';
      ctx.fillStyle = '#064650';
      for (let i = 0; i < 16; i++) {
        const p = worldPoint(debug.selected, mesh[i]);
        for (const next of [i % 4 < 3 ? i + 1 : -1, i < 12 ? i + 4 : -1])
          if (next >= 0) {
            const q = worldPoint(debug.selected, mesh[next]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    onFrame({
      pose: copyPose(visible),
      view: { ...view },
      animating: Boolean(duration || Object.keys(blinks).length),
    });
    frame = 0;
    if (duration || Object.keys(blinks).length) invalidate();
  }
  function invalidate() {
    if (!disposed && !frame) frame = requestAnimationFrame(draw);
  }
  function transition(next, milliseconds = 300) {
    update(now());
    from = copyPose(pose);
    target = copyPose(next);
    start = now();
    duration = reducedMotion ? 0 : clamp(milliseconds, 0, 3000);
    if (!duration) pose = copyPose(target);
    invalidate();
  }
  const api = {
    setExpression(name, milliseconds = 300) {
      expression = canonicalExpression(name);
      const next = expressionPose(expression);
      if (mouthOverride) next.mouth = mouthPose(restMesh('mouth'), MOUTH_STATES[mouthOverride]);
      transition(next, milliseconds);
    },
    setLookDirection(x, y) {
      gaze = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      invalidate();
    },
    setMouthState(state, milliseconds = 180) {
      mouthOverride = Object.hasOwn(MOUTH_STATES, state) ? state : null;
      const next = copyPose(target);
      next.mouth = mouthOverride
        ? mouthPose(restMesh('mouth'), MOUTH_STATES[mouthOverride])
        : expressionPose(expression).mouth;
      transition(next, milliseconds);
    },
    blink() {
      api.blinkLeft();
      api.blinkRight();
    },
    blinkLeft() {
      blinks.leftEye = now();
      invalidate();
    },
    blinkRight() {
      blinks.rightEye = now();
      invalidate();
    },
    setEyeOpening(amount, key = 'both') {
      const next = copyPose(target);
      for (const side of key === 'both' ? ['leftEye', 'rightEye'] : [key])
        if (side === 'leftEye' || side === 'rightEye')
          next[side] = eyePose(restMesh(side), clamp(amount, 0.005, 1.8));
      transition(next, 220);
    },
    setPose(value, milliseconds = 300) {
      const clean = cleanPreset({ rigVersion: RIG_VERSION, name: 'pose', pose: value });
      mouthOverride = null;
      transition(clean.pose, milliseconds);
    },
    moveVertex(key, index, point) {
      if (!Object.hasOwn(RIG_PARTS, key)) return false;
      update(now());
      const d = RIG_PARTS[key],
        moved = moveVertex(pose[key], index, point, d.width, d.height);
      if (moved === pose[key]) return false;
      pose[key] = moved;
      target = copyPose(pose);
      duration = 0;
      invalidate();
      return true;
    },
    reset(key) {
      const next = copyPose(target);
      if (key && Object.hasOwn(RIG_PARTS, key)) next[key] = expressionPose('neutral')[key];
      else Object.assign(next, expressionPose('neutral'));
      mouthOverride = null;
      transition(next, 200);
    },
    setLayers(value) {
      layers = { ...value };
      invalidate();
    },
    setDebug(value) {
      debug = { ...debug, ...value };
      invalidate();
    },
    setView(mode, key = 'leftEye') {
      const d = RIG_PARTS[key] || RIG_PARTS.leftEye;
      view =
        mode === 'detail'
          ? { x: d.x + d.width / 2 - 135, y: d.y + d.height / 2 - 135, size: 270 }
          : { x: 0, y: 0, size: 1024 };
      invalidate();
    },
    getPreset(name = 'Custom expression') {
      update(now());
      return cleanPreset({ rigVersion: RIG_VERSION, name, pose: copyPose(pose) });
    },
    getState() {
      update(now());
      return {
        pose: copyPose(pose),
        gaze: { ...gaze },
        view: { ...view },
        expression,
        animating: Boolean(duration || Object.keys(blinks).length),
      };
    },
    drawNow() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      draw();
    },
    destroy() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    },
  };
  draw();
  return api;
}

export async function renderRigStill(character, expression = 'neutral', options = {}) {
  const canvas = surface(1024, 1024),
    assets = await prepareRig(character),
    rig = createRigRenderer(canvas, assets, { reducedMotion: true });
  rig.setExpression(expression, 0);
  if (options.speaking) rig.setMouthState('mouth_medium_open', 0);
  if (options.mouthState) rig.setMouthState(options.mouthState, 0);
  rig.drawNow();
  rig.destroy();
  return canvas;
}
