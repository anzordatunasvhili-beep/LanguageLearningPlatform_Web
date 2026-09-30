import { openingPose } from './eye.js';
import { surface } from './assets.js';
import { drawMesh } from './warp.js';

export function mouthPose(rest, { open = 0.005, smile = 0 } = {}) {
  const pose = openingPose(rest, Math.max(0.005, Math.min(1.8, open)));
  for (let row = 1; row <= 2; row++)
    for (let col = 0; col < 4; col++) {
      pose[row * 4 + col].y -= smile * Math.abs(col / 3 - 0.5) * 2;
    }
  return pose;
}
export function createMouthPainter(textures, definition, rest) {
  const { width, height } = definition,
    mask = surface(width * 3, height * 3),
    inside = surface(width * 3, height * 3);
  return (ctx, pose, { layers = {} } = {}) => {
    const mc = mask.getContext('2d'),
      ic = inside.getContext('2d');
    mc.clearRect(0, 0, mask.width, mask.height);
    ic.clearRect(0, 0, inside.width, inside.height);
    drawMesh(mc, textures.opening, rest, pose, width, height);
    if (layers.mouthInterior !== false)
      ic.drawImage(textures.interior, width + 8, height + 20, width - 16, height - 30);
    ic.globalCompositeOperation = 'destination-in';
    ic.drawImage(mask, 0, 0);
    ic.globalCompositeOperation = 'source-over';
    ctx.drawImage(inside, definition.x - width, definition.y - height);
    if (layers.lips !== false)
      drawMesh(ctx, textures.front, rest, pose, definition.x, definition.y);
  };
}
