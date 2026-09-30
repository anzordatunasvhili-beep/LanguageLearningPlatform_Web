// A four-by-four control lattice. Texture sampling is independent of pose.
export const GRID = 4;
export function createMesh(width, height, rows = [0, 1 / 3, 2 / 3, 1]) {
  return Array.from({ length: GRID * GRID }, (_, i) => ({
    x: ((i % GRID) * width) / (GRID - 1),
    y: rows[Math.floor(i / GRID)] * height,
  }));
}
export const cloneMesh = (mesh) => mesh.map(({ x, y }) => ({ x, y }));
export function interpolateMesh(from, to, amount) {
  const t = Math.max(0, Math.min(1, amount));
  return from.map((point, i) => ({
    x: point.x + (to[i].x - point.x) * t,
    y: point.y + (to[i].y - point.y) * t,
  }));
}
const area = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export function validMesh(mesh, width, height) {
  if (
    !Array.isArray(mesh) ||
    mesh.length !== 16 ||
    !mesh.every(
      (p) =>
        p &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        p.x >= -width &&
        p.x <= width * 2 &&
        p.y >= -height &&
        p.y <= height * 2,
    )
  )
    return false;
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const a = row * 4 + col,
        b = a + 1,
        c = a + 4,
        d = c + 1;
      if (area(mesh[a], mesh[b], mesh[d]) < 0.001 || area(mesh[a], mesh[d], mesh[c]) < 0.001)
        return false;
    }
  return true;
}
export function moveVertex(mesh, index, point, width, height) {
  if (!Number.isInteger(index) || index < 0 || index >= 16) return mesh;
  const next = cloneMesh(mesh);
  next[index] = point;
  return validMesh(next, width, height) ? next : mesh;
}
function sample(mesh, row, col, v, u) {
  const a = mesh[row * 4 + col],
    b = mesh[row * 4 + col + 1],
    c = mesh[(row + 1) * 4 + col],
    d = mesh[(row + 1) * 4 + col + 1];
  return {
    x: a.x * (1 - u) * (1 - v) + b.x * u * (1 - v) + c.x * (1 - u) * v + d.x * u * v,
    y: a.y * (1 - u) * (1 - v) + b.y * u * (1 - v) + c.y * (1 - u) * v + d.y * u * v,
  };
}
export function meshTriangles(rest, target, subdivisions = 2) {
  const result = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      for (let y = 0; y < subdivisions; y++)
        for (let x = 0; x < subdivisions; x++) {
          const uv = [
            [x / subdivisions, y / subdivisions],
            [(x + 1) / subdivisions, y / subdivisions],
            [(x + 1) / subdivisions, (y + 1) / subdivisions],
            [x / subdivisions, (y + 1) / subdivisions],
          ];
          const source = uv.map(([u, v]) => sample(rest, r, c, v, u));
          const dest = uv.map(([u, v]) => sample(target, r, c, v, u));
          for (const indices of [
            [0, 1, 2],
            [0, 2, 3],
          ])
            result.push({
              source: indices.map((i) => source[i]),
              dest: indices.map((i) => dest[i]),
            });
        }
    }
  return result;
}

// Affine texture mapping for a triangle. The rest lattice provides UVs; only
// destination vertices change. This never scales the complete eye illustration.
export function triangleTransform(s, d) {
  const [p, q, r] = s,
    [a, b, c] = d;
  const det = (q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y);
  if (Math.abs(det) < 1e-8) return null;
  const m0 = ((b.x - a.x) * (r.y - p.y) - (c.x - a.x) * (q.y - p.y)) / det;
  const m2 = ((c.x - a.x) * (q.x - p.x) - (b.x - a.x) * (r.x - p.x)) / det;
  const m1 = ((b.y - a.y) * (r.y - p.y) - (c.y - a.y) * (q.y - p.y)) / det;
  const m3 = ((c.y - a.y) * (q.x - p.x) - (b.y - a.y) * (r.x - p.x)) / det;
  return [m0, m1, m2, m3, a.x - m0 * p.x - m2 * p.y, a.y - m1 * p.x - m3 * p.y];
}
