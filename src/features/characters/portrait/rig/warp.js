import { meshTriangles, triangleTransform } from './mesh.js';

export function drawMesh(ctx, texture, rest, target, x = 0, y = 0) {
  ctx.save();
  ctx.translate(x, y);
  for (const { source, dest } of meshTriangles(rest, target)) {
    const transform = triangleTransform(source, dest);
    if (!transform) continue;
    ctx.save();
    ctx.beginPath();
    // Slight subpixel overlap prevents antialiased cracks between triangles.
    const center = {
      x: (dest[0].x + dest[1].x + dest[2].x) / 3,
      y: (dest[0].y + dest[1].y + dest[2].y) / 3,
    };
    const expanded = dest.map((p) => {
      const dx = p.x - center.x,
        dy = p.y - center.y,
        len = Math.hypot(dx, dy) || 1;
      return { x: p.x + (dx / len) * 0.25, y: p.y + (dy / len) * 0.25 };
    });
    expanded.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();
    ctx.transform(...transform);
    ctx.drawImage(texture, 0, 0, rest[15].x, rest[15].y);
    ctx.restore();
  }
  ctx.restore();
}
