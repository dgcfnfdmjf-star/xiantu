'use strict';

// Detect unrelated fur surfaces painted into the same atlas texel. Eye meshes
// intentionally reuse iris UVs, so inspect only the largest textured primitive.
const assert = require('node:assert/strict');

const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function multiply(a, b) {
  return Array.from({ length: 16 }, (_, i) => {
    const row = i % 4, column = Math.floor(i / 4);
    return a[row] * b[column * 4] + a[row + 4] * b[column * 4 + 1]
      + a[row + 8] * b[column * 4 + 2] + a[row + 12] * b[column * 4 + 3];
  });
}
function localMatrix(node) {
  if (node.matrix) return node.matrix;
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const xx = 2 * x * x, yy = 2 * y * y, zz = 2 * z * z;
  const xy = 2 * x * y, xz = 2 * x * z, yz = 2 * y * z;
  const wx = 2 * w * x, wy = 2 * w * y, wz = 2 * w * z;
  return [(1 - yy - zz) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - xx - zz) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - xx - yy) * sz, 0,
    tx, ty, tz, 1];
}

function auditFurUV(glb, { resolution = 1024, tolerance = 1e-4 } = {}) {
  assert(Buffer.isBuffer(glb), 'GLB must be a Buffer');
  assert(Number.isInteger(resolution) && resolution > 0, 'positive atlas resolution');
  assert(Number.isFinite(tolerance) && tolerance > 0, 'positive surface tolerance');
  assert.equal(glb.readUInt32LE(0), 0x46546c67, 'GLB magic');
  assert.equal(glb.readUInt32LE(4), 2, 'GLB version');
  assert.equal(glb.readUInt32LE(8), glb.length, 'GLB length');
  let gltf, binary;
  for (let offset = 12; offset < glb.length;) {
    const length = glb.readUInt32LE(offset), type = glb.readUInt32LE(offset + 4);
    assert(offset + 8 + length <= glb.length, 'complete GLB chunk');
    const chunk = glb.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) gltf = JSON.parse(chunk.toString('utf8'));
    if (type === 0x004e4942) binary = chunk;
    offset += 8 + length;
  }
  assert(gltf && binary, 'JSON and BIN chunks required');
  const components = {
    5120: [1, 'readInt8', 127], 5121: [1, 'readUInt8', 255],
    5122: [2, 'readInt16LE', 32767], 5123: [2, 'readUInt16LE', 65535],
    5125: [4, 'readUInt32LE', 4294967295], 5126: [4, 'readFloatLE', null]
  };
  function accessor(index, type) {
    const entry = gltf.accessors[index];
    assert.equal(entry.type, type, `accessor ${index} shape`);
    assert(!entry.sparse, 'fur audit requires non-sparse accessors');
    const view = gltf.bufferViews[entry.bufferView];
    assert.equal(view.buffer, 0, 'fur data in embedded BIN buffer');
    assert(!gltf.buffers[0].uri, 'fur data in embedded BIN chunk');
    const format = components[entry.componentType];
    assert(format, `supported component type ${entry.componentType}`);
    const [bytes, read, divisor] = format;
    const width = { SCALAR: 1, VEC2: 2, VEC3: 3 }[type];
    const stride = view.byteStride || bytes * width;
    const relative = entry.byteOffset || 0, offset = (view.byteOffset || 0) + relative;
    assert(stride >= bytes * width, 'accessor stride covers components');
    assert(relative + (entry.count - 1) * stride + bytes * width <= view.byteLength, 'accessor within buffer view');
    assert((view.byteOffset || 0) + view.byteLength <= binary.length, 'buffer view within BIN chunk');
    const values = new Float64Array(entry.count * width);
    for (let i = 0; i < entry.count; i++) for (let j = 0; j < width; j++) {
      let value = binary[read](offset + i * stride + j * bytes);
      if (entry.normalized) {
        assert(divisor, 'only integer accessors may be normalized');
        value = Math.max(-1, value / divisor);
      }
      assert(Number.isFinite(value), 'finite accessor value');
      values[i * width + j] = value;
    }
    return values;
  }
  let largest;
  function visit(index, parent) {
    const node = gltf.nodes[index], world = multiply(parent, localMatrix(node));
    if (node.mesh !== undefined) gltf.meshes[node.mesh].primitives.forEach((primitive, primitiveIndex) => {
      const map = gltf.materials[primitive.material]?.pbrMetallicRoughness?.baseColorTexture;
      if (!map) return;
      const count = gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count;
      if (!largest || count > largest.count) largest = { primitive, map, count, world, node: index, mesh: node.mesh, primitiveIndex };
    });
    (node.children || []).forEach(child => visit(child, world));
  }
  gltf.scenes[gltf.scene ?? 0].nodes.forEach(index => visit(index, identity));
  assert(largest, 'textured fur primitive exists');
  const { primitive, map, world } = largest;
  assert.equal(primitive.mode ?? 4, 4, 'fur has triangle topology');
  assert(!map.extensions?.KHR_texture_transform, 'fur UV audit requires untransformed atlas coordinates');
  const positions = accessor(primitive.attributes.POSITION, 'VEC3');
  const coordinates = accessor(primitive.attributes[`TEXCOORD_${map.texCoord ?? 0}`], 'VEC2');
  assert.equal(coordinates.length / 2, positions.length / 3, 'UV and position counts match');
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    positions[i] = world[0] * x + world[4] * y + world[8] * z + world[12];
    positions[i + 1] = world[1] * x + world[5] * y + world[9] * z + world[13];
    positions[i + 2] = world[2] * x + world[6] * y + world[10] * z + world[14];
  }
  const indices = primitive.indices === undefined
    ? Uint32Array.from({ length: positions.length / 3 }, (_, i) => i)
    : accessor(primitive.indices, 'SCALAR');
  assert.equal(indices.length % 3, 0, 'complete fur triangles');
  for (const index of indices) assert(Number.isInteger(index) && index >= 0 && index < positions.length / 3, 'valid vertex index');
  for (const coordinate of coordinates) assert(coordinate >= -1e-7 && coordinate <= 1 + 1e-7, 'fur UV lies in atlas');

  const owners = new Uint32Array(resolution * resolution);
  const samples = new Float64Array(resolution * resolution * 3);
  const conflicts = new Uint8Array(resolution * resolution);
  const thresholdSquared = tolerance * tolerance;
  let occupiedTexels = 0, overlappingSamples = 0, conflictingTexels = 0, maxSurfaceSeparation = 0;
  let degenerateTriangles = 0;
  for (let offset = 0; offset < indices.length; offset += 3) {
    const a = indices[offset], b = indices[offset + 1], c = indices[offset + 2];
    const ax = coordinates[a * 2] * resolution, ay = coordinates[a * 2 + 1] * resolution;
    const bx = coordinates[b * 2] * resolution, by = coordinates[b * 2 + 1] * resolution;
    const cx = coordinates[c * 2] * resolution, cy = coordinates[c * 2 + 1] * resolution;
    const determinant = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(determinant) < 1e-12) { degenerateTriangles++; continue; }
    const x0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - .5));
    const x1 = Math.min(resolution - 1, Math.floor(Math.max(ax, bx, cx) - .5));
    const y0 = Math.max(0, Math.ceil(Math.min(ay, by, cy) - .5));
    const y1 = Math.min(resolution - 1, Math.floor(Math.max(ay, by, cy) - .5));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const w0 = ((by - cy) * (x + .5 - cx) + (cx - bx) * (y + .5 - cy)) / determinant;
      const w1 = ((cy - ay) * (x + .5 - cx) + (ax - cx) * (y + .5 - cy)) / determinant;
      const w2 = 1 - w0 - w1;
      // Include numerically shared edges; their interpolated positions must agree.
      if (w0 < -1e-8 || w1 < -1e-8 || w2 < -1e-8) continue;
      const pixel = y * resolution + x, base = pixel * 3;
      const px = w0 * positions[a * 3] + w1 * positions[b * 3] + w2 * positions[c * 3];
      const py = w0 * positions[a * 3 + 1] + w1 * positions[b * 3 + 1] + w2 * positions[c * 3 + 1];
      const pz = w0 * positions[a * 3 + 2] + w1 * positions[b * 3 + 2] + w2 * positions[c * 3 + 2];
      if (owners[pixel]) {
        overlappingSamples++;
        const distanceSquared = (samples[base] - px) ** 2 + (samples[base + 1] - py) ** 2 + (samples[base + 2] - pz) ** 2;
        maxSurfaceSeparation = Math.max(maxSurfaceSeparation, Math.sqrt(distanceSquared));
        if (distanceSquared > thresholdSquared && !conflicts[pixel]) { conflicts[pixel] = 1; conflictingTexels++; }
      } else {
        owners[pixel] = offset / 3 + 1;
        samples[base] = px; samples[base + 1] = py; samples[base + 2] = pz;
        occupiedTexels++;
      }
    }
  }
  assert(occupiedTexels > 0, 'fur covers atlas texels');
  return { mesh: gltf.meshes[largest.mesh].name || largest.mesh, node: largest.node,
    primitive: largest.primitiveIndex, resolution, tolerance, triangles: indices.length / 3,
    occupiedTexels, overlappingSamples, conflictingTexels, maxSurfaceSeparation, degenerateTriangles };
}

module.exports = { auditFurUV };
if (require.main === module) {
  const fs = require('node:fs');
  assert(process.argv.length > 2, 'Usage: node cat-uv-overlap.cjs <model.glb> [model.glb ...]');
  for (const file of process.argv.slice(2)) {
    const result = auditFurUV(fs.readFileSync(file));
    console.log(JSON.stringify({ file, ...result }));
    if (result.conflictingTexels) process.exitCode = 1;
  }
}
