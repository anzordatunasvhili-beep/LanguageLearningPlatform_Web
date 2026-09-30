import { drawMesh } from './warp.js';
import { surface } from './assets.js';
import { cloneMesh } from './mesh.js';

export function openingPose(rest, amount = 1, slant = 0) {
  const pose = cloneMesh(rest),
    height = rest[15].y,
    mid = height / 2;
  for (let r = 1; r <= 2; r++)
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      pose[i].y = mid + (rest[i].y - mid) * Math.max(0.005, amount) + (c / 3 - 0.5) * slant;
    }
  return pose;
}
export function gazeOffset(pose, rest, x = 0, y = 0) {
  const open = Math.max(0, Math.min(1, (pose[9].y - pose[5].y) / (rest[9].y - rest[5].y)));
  return {
    x: Math.max(-1, Math.min(1, Number.isFinite(x) ? x : 0)) * 13 * open,
    y: Math.max(-1, Math.min(1, Number.isFinite(y) ? y : 0)) * 7 * open,
  };
}
// Shape the existing painted lid into a quieter almond: soften the high outer
// corner and let the upper lid cover more of the iris. The aperture uses this
// same mesh, so blinking and gaze retain their occlusion.
export function eyePose(rest, amount = 1, slant = 0) {
  const pose = openingPose(rest, amount, slant);
  const openness = Math.max(0.005, Math.min(1, amount));
  const scale = rest[15].y / 82;
  for (let row = 1; row <= 2; row++) {
    for (let col = 0; col < 4; col++) {
      const corner = [3, 0, 0, -2][col];
      const hood = row === 1 ? [0, 2.5, 2, 0][col] * openness : 0;
      pose[row * 4 + col].y += (corner + hood) * scale;
    }
    pose[row * 4].x += 4;
  }
  return pose;
}
export function blinkPose(pose, amount) {
  const result = cloneMesh(pose),
    t = Math.max(0, Math.min(1, amount));
  for (let c = 0; c < 4; c++) {
    const top = pose[4 + c].y,
      bottom = pose[8 + c].y,
      mid = (top + bottom) / 2;
    result[4 + c].y = top + (mid - 0.08 - top) * t;
    result[8 + c].y = bottom + (mid + 0.08 - bottom) * t;
  }
  return result;
}

// Eyeball and iris are drawn normally. Only the opening alpha and skin/eyelash
// texture use the mesh. A separate offscreen buffer enforces occlusion.
export function createEyePainter(textures, definition, rest) {
  const { width, height } = definition;
  const mask = surface(width * 3, height * 3),
    inside = surface(width * 3, height * 3);
  return function paint(ctx, pose, { gaze = { x: 0, y: 0 }, layers = {} } = {}) {
    const mc = mask.getContext('2d'),
      ic = inside.getContext('2d');
    mc.clearRect(0, 0, mask.width, mask.height);
    ic.clearRect(0, 0, inside.width, inside.height);
    mc.save();
    mc.translate(width, height);
    if (definition.mirror) {
      mc.translate(width, 0);
      mc.scale(-1, 1);
    }
    drawMesh(mc, textures.opening, rest, pose);
    mc.restore();
    const offset = gazeOffset(pose, rest, gaze.x, gaze.y);
    if (layers.eyeball !== false)
      ic.drawImage(textures.white, width, height + (height - width) / 2, width, width);
    if (layers.iris !== false)
      ic.drawImage(
        textures.iris,
        width + width / 2 - 24 + offset.x,
        height + height / 2 - 26 + offset.y,
        48,
        48,
      );
    ic.globalCompositeOperation = 'destination-in';
    ic.drawImage(mask, 0, 0);
    ic.globalCompositeOperation = 'source-over';
    ctx.drawImage(inside, definition.x - width, definition.y - height);
    if (layers.eyelids !== false) {
      ctx.save();
      ctx.translate(definition.x, definition.y);
      if (definition.mirror) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      drawMesh(ctx, textures.front, rest, pose);
      ctx.restore();
    }
  };
}
