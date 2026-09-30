import { cloneMesh } from './mesh.js';
import { drawMesh } from './warp.js';

// Local coordinates run outer -> inner for each brow; the right brow mirrors
// geometry. Each column changes independently, so arch is not a whole-image tilt.
export function browPose(
  rest,
  { outerY = 0, centerY = 0, innerY = 0, rotation = 0, stretch = 1 } = {},
) {
  const pose = cloneMesh(rest),
    width = rest[15].x;
  for (let i = 0; i < 16; i++) {
    const u = (i % 4) / 3,
      dy = (1 - u) * outerY + u * innerY + Math.sin(Math.PI * u) * centerY;
    pose[i].x = width / 2 + (pose[i].x - width / 2) * stretch;
    pose[i].y += dy + (u - 0.5) * rotation;
  }
  return pose;
}
export function paintBrow(ctx, texture, definition, rest, pose) {
  ctx.save();
  ctx.translate(definition.x, definition.y);
  if (definition.mirror) {
    ctx.translate(definition.width, 0);
    ctx.scale(-1, 1);
  }
  drawMesh(ctx, texture, rest, pose);
  ctx.restore();
}
