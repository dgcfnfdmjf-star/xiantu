'use strict';

// The animated exports retain the approved V9.5 seated surfaces and baked atlases.
// Snapshot values were measured from main 8812ff5, not regenerated from the candidate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const T = require('../vendor/three-r128/three.min.js');
const { unpackGLB, ready } = require('./decode-cat-glb.cjs');
const root = path.resolve(__dirname, '..');
const kinds = ['orange', 'calico', 'black', 'tabby'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function readGLB(bytes) {
  bytes = unpackGLB(bytes);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength));
  const bin = bytes.subarray(28 + jsonLength);
  const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const formats = { 5120: [1, 'readInt8', 127], 5121: [1, 'readUInt8', 255], 5122: [2, 'readInt16LE', 32767], 5123: [2, 'readUInt16LE', 65535], 5125: [4, 'readUInt32LE', 4294967295], 5126: [4, 'readFloatLE', 1] };
  function accessor(index) {
    const a = gltf.accessors[index], view = gltf.bufferViews[a.bufferView];
    assert(!a.sparse, 'explicit, inspectable accessor');
    const width = widths[a.type], [size, method, divisor] = formats[a.componentType];
    const stride = view.byteStride || width * size;
    return Array.from({ length: a.count }, (_, i) => Array.from({ length: width }, (_, j) => {
      let value = bin[method]((view.byteOffset || 0) + (a.byteOffset || 0) + i * stride + j * size);
      if (a.normalized) value = Math.max(-1, value / divisor);
      assert(Number.isFinite(value)); return value;
    }));
  }
  const worlds = [];
  function visit(index, parent) {
    const node = gltf.nodes[index], local = new T.Matrix4();
    if (node.matrix) local.fromArray(node.matrix);
    else local.compose(new T.Vector3().fromArray(node.translation || [0, 0, 0]), new T.Quaternion().fromArray(node.rotation || [0, 0, 0, 1]), new T.Vector3().fromArray(node.scale || [1, 1, 1]));
    worlds[index] = parent.clone().multiply(local);
    (node.children || []).forEach(i => visit(i, worlds[index]));
  }
  gltf.scenes[gltf.scene || 0].nodes.forEach(i => visit(i, new T.Matrix4()));
  return { gltf, bin, accessor, worlds };
}
function restFingerprint(bytes) {
  const { gltf, bin, accessor, worlds } = readGLB(bytes);
  const surfaces = [];
  for (let ni = 0; ni < gltf.nodes.length; ni++) {
    const node = gltf.nodes[ni]; if (node.mesh === undefined || !worlds[ni]) continue;
    for (const p of gltf.meshes[node.mesh].primitives) {
      const attributes = {};
      for (const name of ['POSITION', 'NORMAL', 'TEXCOORD_0']) if (p.attributes[name] !== undefined) attributes[name] = hash(JSON.stringify(accessor(p.attributes[name])));
      surfaces.push({ material: gltf.materials[p.material].name, attributes,
        topology: hash(JSON.stringify(accessor(p.indices))),
        triangles: gltf.accessors[p.indices].count / 3,
        materialHash: hash(JSON.stringify((() => { const material=structuredClone(gltf.materials[p.material]); const map=material.pbrMetallicRoughness?.baseColorTexture; if(map)map.index=gltf.textures[map.index].source; return material; })())) });
    }
  }
  surfaces.sort((a, b) => a.material.localeCompare(b.material));
  const images = gltf.images.map(i => { const v = gltf.bufferViews[i.bufferView]; return hash(bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength)); });
  return { surfaces, images };
}
function decodeSurfaceFixture() {
  const value = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'cat-seated-surfaces.json.gz'))));
  assert.equal(value.baseline, '8812ff565b29a0f57bdcb80698f6c8b950ca3965');
  function decode(text, count, width, type) {
    const buffer = Buffer.from(text, 'base64'), bytes = type === 'readUInt16LE' ? 2 : 4;
    return Array.from({ length: count }, (_, i) => Array.from({ length: width }, (_, j) => buffer[type]((i * width + j) * bytes)));
  }
  const decodeMeshes = meshes => meshes.map(m => ({ material: m.material,
    positions: decode(m.positions, m.count, 3, 'readFloatLE'), normals: decode(m.normals, m.count, 3, 'readFloatLE'),
    uv: m.uv ? decode(m.uv, m.count, 2, 'readFloatLE') : null, indices: decode(m.indices, m.indexCount, 1, 'readUInt16LE').flat() }));
  const shared = decodeMeshes(value.meshes);
  return Object.fromEntries(kinds.map(kind => { const override = new Map(decodeMeshes(value.coatOverrides?.[kind] || []).map(m => [m.material, m])); return [kind, shared.map(m => override.get(m.material) || m)]; }));
}
const approvedSurfaces = decodeSurfaceFixture();
const approvedFur = approvedSurfaces.orange.find(s => s.material === 'Watercolor fur · runtime atlas');
const furTriangles = [];
for (let i = 0; i < approvedFur.indices.length; i += 3) furTriangles.push(new T.Triangle(...approvedFur.indices.slice(i, i + 3).map(j => new T.Vector3().fromArray(approvedFur.positions[j]))));
const furBox = new T.Box3().setFromPoints(approvedFur.positions.map(v => new T.Vector3().fromArray(v))).expandByScalar(1e-6);
const interiorCache = new Map();
function insideApprovedFur(coordinate) {
  const key = coordinate.map(v => v.toFixed(7)).join(',');
  if (interiorCache.has(key)) return interiorCache.get(key);
  const point = new T.Vector3().fromArray(coordinate), hit = new T.Vector3();
  if (!furBox.containsPoint(point)) { interiorCache.set(key, false); return false; }
  let oddRays = 0;
  for (const direction of [[1, .371, .127], [-.213, 1, .419], [.317, -.229, 1]]) {
    const ray = new T.Ray(point, new T.Vector3().fromArray(direction).normalize()), distances = [];
    for (const triangle of furTriangles) {
      if (!ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, hit)) continue;
      const distance = point.distanceTo(hit); if (distance > 1e-7) distances.push(distance);
    }
    distances.sort((a, b) => a - b);
    const distinct = distances.filter((distance, i) => !i || distance - distances[i - 1] > 1e-6);
    if (distinct.length % 2) oddRays++;
  }
  let inside = oddRays >= 2;
  if (!inside) inside = furTriangles.some(triangle => triangle.closestPointToPoint(point, hit).distanceToSquared(point) <= 9e-10);
  interiorCache.set(key, inside); return inside;
}
function assertInternalCap(face, label) {
  // Region bounds alone cannot prove a newly closed cut stays hidden. These
  // samples must remain inside/on the immutable main fur's closed rest volume.
  const barycentrics = [[1/3, 1/3, 1/3], [.5, .5, 0], [.5, 0, .5], [0, .5, .5], [.6, .2, .2], [.2, .6, .2], [.2, .2, .6]];
  for (const bary of barycentrics) {
    const point = [0, 1, 2].map(axis => bary.reduce((sum, weight, i) => sum + weight * face.positions[i][axis], 0));
    assert(insideApprovedFur(point), `${label}: new closing face protrudes outside approved rest volume at ${point.join(',')}`);
  }
}
function checkRestSurfaces(bytes, expected, kind) {
  const { gltf, accessor, worlds } = readGLB(bytes), fingerprints = restFingerprint(bytes);
  assert.deepEqual(fingerprints.images.slice(0, 1), expected.images, `${kind}: approved baked atlas bytes unchanged`);
  assert.deepEqual(fingerprints.surfaces.filter(s => expected.surfaces.some(e => e.material === s.material)).map(s => [s.material, s.materialHash]), expected.surfaces.map(s => [s.material, s.materialHash]), `${kind}: approved material colours and roughness unchanged`);
  const source = new Map(approvedSurfaces[kind].map(s => [s.material, s]));
  const reports = [], vertexTolerance = 1.526e-5 + 1e-7, normalTolerance = 1 / 32767 + 1e-6;
  const cell = p => p.map(v => Math.floor(v / vertexTolerance));
  const triangle = ids => [ids.join(','), [ids[1], ids[2], ids[0]].join(','), [ids[2], ids[0], ids[1]].join(',')].sort()[0];
  for (let ni = 0; ni < gltf.nodes.length; ni++) {
    const node = gltf.nodes[ni]; if (node.mesh === undefined || !worlds[ni]) continue;
    for (const p of gltf.meshes[node.mesh].primitives) {
      const material = gltf.materials[p.material].name, baseline = source.get(material);
      if (baseline) source.delete(material);
      else assert(['Anatomical closures • transferred fur', 'Hidden hind shins • approved coat'].includes(material), 'only inner closures and shins may be new surfaces');
      const normalMatrix = new T.Matrix3().getNormalMatrix(worlds[ni]);
      const positions = accessor(p.attributes.POSITION).map(v => new T.Vector3().fromArray(v).applyMatrix4(worlds[ni]).toArray());
      const normals = accessor(p.attributes.NORMAL).map(v => new T.Vector3().fromArray(v).applyMatrix3(normalMatrix).normalize().toArray());
      const uv = p.attributes.TEXCOORD_0 === undefined ? null : accessor(p.attributes.TEXCOORD_0);
      const indexValues = accessor(p.indices).flat();
      if (!baseline) {
        const expectedCount = material.startsWith('Anatomical') ? 650 : 216;
        assert.equal(indexValues.length / 3, expectedCount);
        for (let i = 0; i < indexValues.length; i += 3) assertInternalCap({positions:indexValues.slice(i,i+3).map(j=>positions[j])}, `${kind}/${material}/${i/3}`);
        assert((gltf.meshes[node.mesh].weights || []).every(v => v === 0), 'completion surfaces are hidden at seated rest');
        reports.push({material, triangles:expectedCount, hiddenRestSamples:expectedCount*7}); continue;
      }
      assert.equal(!!uv, !!baseline.uv, 'approved UV presence retained');
      if (['Muted rose nose', 'Sepia facial detail', 'Warm cream whiskers'].includes(material)) {
        const expectedCount = {'Muted rose nose':78,'Sepia facial detail':200,'Warm cream whiskers':248}[material];
        assert.equal(indexValues.length/3, expectedCount);
        let maxDeviation=0; const point=new T.Vector3(), near=new T.Vector3();
        const triangles=[];for(let j=0;j<baseline.indices.length;j+=3)triangles.push(new T.Triangle(...baseline.indices.slice(j,j+3).map(k=>new T.Vector3().fromArray(baseline.positions[k]))));
        for(const xyz of positions){point.fromArray(xyz);let best=Infinity;for(const triangle of triangles)best=Math.min(best,triangle.closestPointToPoint(point,near).distanceTo(point));maxDeviation=Math.max(maxDeviation,best);}
        assert(maxDeviation < .004, `${kind}/${material}: reduced detail retains the seated surface within 4mm; ${maxDeviation}`);
        reports.push({material,triangles:expectedCount,originalTriangles:baseline.indices.length/3,maxDeviation});continue;
      }
      const buckets = new Map(), referenceIds = [];
      let nextReference = 0;
      baseline.positions.forEach((position, i) => {
        const base = cell(position), prior = [];
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) prior.push(...(buckets.get([base[0] + x, base[1] + y, base[2] + z].join(',')) || []));
        const equivalent = prior.find(j => position.every((v, n) => Math.abs(v - baseline.positions[j][n]) <= vertexTolerance) && baseline.normals[i].every((v, n) => Math.abs(v - baseline.normals[j][n]) <= normalTolerance) && (!baseline.uv || baseline.uv[i].every((v, n) => Math.abs(v - baseline.uv[j][n]) <= 1e-7)));
        referenceIds.push(equivalent === undefined ? nextReference++ : referenceIds[equivalent]);
        const key = base.join(','); if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(i);
      });
      let maximumPositionError = 0, maximumNormalError = 0, maximumUVError = 0;
      const ids = positions.map((position, i) => {
        const base = cell(position), candidates = [];
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) candidates.push(...(buckets.get([base[0] + x, base[1] + y, base[2] + z].join(',')) || []));
        const matches = [];
        for (const j of candidates) {
          const dp = Math.max(...position.map((v, n) => Math.abs(v - baseline.positions[j][n])));
          const dn = Math.max(...normals[i].map((v, n) => Math.abs(v - baseline.normals[j][n])));
          const du = uv ? Math.max(...uv[i].map((v, n) => Math.abs(v - baseline.uv[j][n]))) : 0;
          if (dp > vertexTolerance || dn > normalTolerance || du > 1/65535/2 + 1e-7) continue;
          maximumPositionError = Math.max(maximumPositionError, dp); maximumNormalError = Math.max(maximumNormalError, dn); maximumUVError = Math.max(maximumUVError, du);
          matches.push(referenceIds[j]);
        }
        return [...new Set(matches)];
      });
      const remaining = new Map();
      for (let i = 0; i < baseline.indices.length; i += 3) {
        const key = triangle(baseline.indices.slice(i, i + 3).map(j => referenceIds[j])); remaining.set(key, (remaining.get(key) || 0) + 1);
      }
      const indices = accessor(p.indices).flat(), extras = [];
      for (let i = 0; i < indices.length; i += 3) {
        const face = indices.slice(i, i + 3), choices = face.map(j => ids[j]);
        let key;
        for (const a of choices[0]) for (const b of choices[1]) for (const c of choices[2]) {
          const candidate = triangle([a,b,c]); if (!key && remaining.get(candidate)) key = candidate;
        }
        if (key) remaining.set(key, remaining.get(key) - 1);
        else extras.push({ triangleIndex: i / 3, positions: face.map(j => positions[j]), uv: uv && face.map(j => uv[j]) });
      }
      assert.equal([...remaining.values()].reduce((n, count) => n + count, 0), 0, `${kind}/${material}: every approved external triangle retains world position, winding, normal and UV`);
      assert.equal(extras.length, 0, 'all fur, eye and catchlight triangles are unchanged within bounded quantization');
      reports.push({ material, triangles: indices.length / 3, originalTriangles: baseline.indices.length / 3, internalCapTriangles: extras.length, internalCapInteriorSamples: extras.length * 7, internalCapTriangleIndices: extras.map(f => f.triangleIndex), internalCapUVBounds: extras.length ? [0, 1].map(axis => [Math.min(...extras.flatMap(f => f.uv.map(v => v[axis]))), Math.max(...extras.flatMap(f => f.uv.map(v => v[axis])))]) : null, maximumPositionError, maximumNormalError, maximumUVError });
    }
  }
  assert.equal(source.size, 0, 'all six approved surfaces retained');
  return { triangles: reports.reduce((n, p) => n + p.triangles, 0), surfaces: reports };
}
function check(bytes, expected, kind) {
  const asset = readGLB(bytes), { gltf, accessor, worlds } = asset;
  const rest = checkRestSurfaces(bytes, expected, kind);
  assert.equal(rest.triangles, 7430, `${kind}: preserved fur/eyes plus bounded inner closures and reduced small details`);
  assert((gltf.extensionsRequired || []).every(name => ['KHR_mesh_quantization','EXT_meshopt_compression'].includes(name)), 'only the bundled compression and standard quantization extensions');
  assert(gltf.skins?.length, `${kind}: real skin rig`);
  assert.equal(gltf.animations?.length, 1, `${kind}: one exported walk clip`);
  const clip = gltf.animations[0]; assert.equal(clip.name, 'Walk');
  assert(clip.channels.length >= 4, 'articulated walk animates multiple nodes');
  let duration = 0;
  for (const channel of clip.channels) {
    const sampler = clip.samplers[channel.sampler], times = accessor(sampler.input).flat(), values = accessor(sampler.output);
    assert.equal(times[0], 0, 'loop starts at zero');
    assert(times.every((t, i) => i === 0 || t > times[i - 1]), 'strictly increasing sample times');
    duration = Math.max(duration, times.at(-1));
    assert.notEqual(sampler.interpolation, 'STEP', 'gentle interpolated motion');
    if (channel.target.path === 'scale') {
      // Three r128 transforms skinned normals with the bone matrix. A nonuniform
      // animated scale produced visible dark patches in the rejected prototype;
      // uniform corrective scaling retains the normal direction and seated rest.
      const seatedScale = gltf.nodes[channel.target.node].scale || [1, 1, 1];
      assert(seatedScale.every(value => Math.abs(value - 1) < 1e-6), 'corrective scale has identity seated rest');
      assert(values.every(row => row.length === 3 && row[0] > 0 && Math.max(...row) - Math.min(...row) < 1e-6), 'animated corrective scales remain positive and uniform');
    }
    const width = channel.target.path === 'weights' ? gltf.meshes[gltf.nodes[channel.target.node].mesh].primitives[0].targets.length : 1;
    const first = values.slice(0,width).flat(), last = values.slice(-width).flat();
    const seam = channel.target.path === 'rotation'
      ? Math.min(Math.max(...first.map((v, i) => Math.abs(v - last[i]))), Math.max(...first.map((v, i) => Math.abs(v + last[i]))))
      : Math.max(...first.map((v, i) => Math.abs(v - last[i])));
    assert(seam < 1e-5, `${kind}: ${channel.target.path} has a continuous first/last pose`);
  }
  assert(Math.abs(duration - 1.6) < 1e-5, 'Walk cycle duration');
  const stride = gltf.nodes.map(n => n.extras?.catWalkStride).find(Number.isFinite) ?? gltf.scenes[gltf.scene || 0].extras?.catWalkStride;
  assert(Number.isFinite(stride) && stride > .1 && stride < 1, 'physical cycle stride exported for speed matching');
  const walkRadius = gltf.nodes.map(n => n.extras?.catWalkRadius).find(Number.isFinite) ?? gltf.scenes[gltf.scene || 0].extras?.catWalkRadius;
  assert(Number.isFinite(walkRadius) && walkRadius > .3 && walkRadius < 1, 'sampled animated radius exported for visual collision bounds');
  let skinned = 0;
  for (let ni = 0; ni < gltf.nodes.length; ni++) {
    const node = gltf.nodes[ni]; if (node.mesh === undefined || !worlds[ni]) continue;
    if (node.skin === undefined) continue;
    skinned++;
    const skin = gltf.skins[node.skin], inverse = accessor(skin.inverseBindMatrices);
    skin.joints.forEach((joint, i) => {
      const bind = worlds[joint].clone().multiply(new T.Matrix4().fromArray(inverse[i]));
      assert(Math.max(...bind.elements.map((v, n) => Math.abs(v - worlds[ni].elements[n]))) < 1e-5, 'bind pose keeps original vertex positions');
    });
    for (const p of gltf.meshes[node.mesh].primitives) {
      const joints = accessor(p.attributes.JOINTS_0), weights = accessor(p.attributes.WEIGHTS_0);
      assert.equal(weights.length, gltf.accessors[p.attributes.POSITION].count);
      weights.forEach((row, i) => {
        assert(Math.abs(row.reduce((n, v) => n + v, 0) - 1) < 1e-5, 'normalized skin weights');
        row.forEach((weight, n) => { assert(weight >= 0 && weight <= 1); assert(joints[i][n] < skin.joints.length); });
      });
    }
  }
  assert(skinned > 0);
  return { kind, bytes: bytes.length, triangles: rest.triangles, rest, duration, stride, walkRadius, skinnedMeshes: skinned, joints: gltf.skins[0].joints.length, channels: clip.channels.length };
}
module.exports = { readGLB, restFingerprint, checkRestSurfaces, check };
if (require.main === module) ready.then(() => {
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'cat-seated-rest.json')));
  const results = kinds.map(kind => check(fs.readFileSync(path.join(root, kind + '-cat.glb')), expected.cats[kind], kind));
  const bytes = results.reduce((n, a) => n + a.bytes, 0);
  assert(bytes <= 1200000, 'four animated cats stay within 1.20 MB including skin and animation');
  console.log(JSON.stringify({ baseline: expected.baseline, totalBytes: bytes, assets: results }, null, 2));
}).catch(error => { console.error(error); process.exitCode = 1; });
