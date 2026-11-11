'use strict';
// The same official decoder used by the page, with every view materialized for
// independent CPU geometry/UV audits. Call after MeshoptDecoder.ready resolves.
const assert = require('node:assert/strict');
const MeshoptDecoder = require('../vendor/meshoptimizer-1.3.0/meshopt_decoder.cjs');
function unpackGLB(raw) {
  const size = raw.readUInt32LE(12), doc = JSON.parse(raw.subarray(20, 20 + size));
  if (!(doc.extensionsRequired || []).includes('EXT_meshopt_compression')) return raw;
  const binary = raw.subarray(28 + size), chunks = []; let offset = 0;
  for (const view of doc.bufferViews) {
    const ex = view.extensions?.EXT_meshopt_compression; let data;
    if (ex) {
      assert.equal(ex.buffer, 0); assert.equal(view.byteLength, ex.count * ex.byteStride);
      assert.equal(ex.filter, 'NONE');
      data = Buffer.alloc(view.byteLength);
      MeshoptDecoder.decodeGltfBuffer(data, ex.count, ex.byteStride, binary.subarray(ex.byteOffset || 0, (ex.byteOffset || 0) + ex.byteLength), ex.mode, ex.filter);
      delete view.extensions.EXT_meshopt_compression;
      if (!Object.keys(view.extensions).length) delete view.extensions;
    } else { assert.equal(view.buffer, 0); data = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength); }
    const padding = (-offset) & 3; if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
    view.buffer = 0; view.byteOffset = offset; chunks.push(data); offset += data.length;
  }
  doc.buffers = [{ byteLength: offset }];
  for (const key of ['extensionsUsed', 'extensionsRequired']) doc[key] = doc[key].filter(x => x !== 'EXT_meshopt_compression');
  let json = Buffer.from(JSON.stringify(doc)); json = Buffer.concat([json, Buffer.alloc((-json.length) & 3, 32)]);
  const bin = Buffer.concat([...chunks, Buffer.alloc((-offset) & 3)]), head = Buffer.alloc(20), binHead = Buffer.alloc(8);
  [0x46546c67, 2, 28 + json.length + bin.length, json.length, 0x4e4f534a].forEach((x, i) => head.writeUInt32LE(x, i * 4));
  binHead.writeUInt32LE(bin.length); binHead.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, json, binHead, bin]);
}
module.exports = { unpackGLB, ready: MeshoptDecoder.ready };
