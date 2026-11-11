import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { MeshoptEncoder } from '../../assets/cats/vendor/meshoptimizer-1.3.0/meshopt_encoder.js';
import { MeshoptDecoder } from '../../assets/cats/vendor/meshoptimizer-1.3.0/meshopt_decoder.mjs';

const EXT='EXT_meshopt_compression';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
function parse(raw) {
 assert.equal(raw.toString('ascii',0,4),'glTF');assert.equal(raw.readUInt32LE(4),2);assert.equal(raw.readUInt32LE(8),raw.length);
 const length=raw.readUInt32LE(12);assert.equal(raw.readUInt32LE(16),0x4e4f534a);
 const doc=JSON.parse(raw.subarray(20,20+length));const bo=20+length;assert.equal(raw.readUInt32LE(bo+4),0x004e4942);
 const binary=raw.subarray(bo+8,bo+8+raw.readUInt32LE(bo));return {doc,binary};
}
function write(doc,binary) {
 const json=Buffer.from(JSON.stringify(doc)); const js=Buffer.concat([json,Buffer.alloc((-json.length)&3,32)]);
 const bin=Buffer.concat([binary,Buffer.alloc((-binary.length)&3)]);const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+js.length+bin.length,8);header.writeUInt32LE(js.length,12);header.writeUInt32LE(0x4e4f534a,16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([header,js,bh,bin]);
}
function viewPayload(doc,binary,index) { const v=doc.bufferViews[index];assert.equal(v.buffer||0,0);return binary.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength); }
function sameSemantics(a,b) {
 const clean=x=>{x=structuredClone(x);delete x.buffers;delete x.bufferViews; for(const k of ['extensionsUsed','extensionsRequired']){x[k]=(x[k]||[]).filter(x=>x!==EXT);if(!x[k].length)delete x[k];}return x;};
 assert.deepEqual(clean(a),clean(b));
}
async function compress(input,output) {
 await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);assert(MeshoptEncoder.supported&&MeshoptDecoder.supported);
 const raw=await fs.readFile(input),{doc:original,binary}=parse(raw);assert.equal(original.buffers.length,1);assert(!original.extensionsUsed?.includes(EXT));
 const doc=structuredClone(original);const imageViews=new Set((doc.images||[]).map(x=>x.bufferView));
 const indexViews=new Map();for(const m of doc.meshes||[])for(const p of m.primitives){const a=doc.accessors[p.indices];indexViews.set(a.bufferView,a);}
 const accessorsByView=new Map();doc.accessors.forEach(a=>{if(a.bufferView!==undefined){if(!accessorsByView.has(a.bufferView))accessorsByView.set(a.bufferView,[]);accessorsByView.get(a.bufferView).push(a);}});
 const chunks=[],views=[];let actualOffset=0,fallbackOffset=0;const records=[];
 function append(data) {const pad=(-actualOffset)&3;if(pad){chunks.push(Buffer.alloc(pad));actualOffset+=pad;}const offset=actualOffset;chunks.push(Buffer.from(data));actualOffset+=data.length;return offset;}
 for(let i=0;i<original.bufferViews.length;i++) {
  const old=original.bufferViews[i],source=viewPayload(original,binary,i),v=structuredClone(old);let mode='ATTRIBUTES',stride=null;
  if(!imageViews.has(i)){
   if(indexViews.has(i)){const a=indexViews.get(i);if(a.type==='SCALAR'&&[5123,5125].includes(a.componentType)&&!(a.byteOffset||0)&&a.count*sizes[a.componentType]===source.length){stride=sizes[a.componentType];mode='INDICES';}}
   else if(old.byteStride) stride=old.byteStride;
   else {
    const accessors=accessorsByView.get(i)||[];
    if(accessors.length&&accessors.every(a=>!(a.byteOffset||0))) {
     const a=accessors[0],width=sizes[a.componentType]*components[a.type];
     if(accessors.every(x=>x.count===a.count&&sizes[x.componentType]*components[x.type]===width)&&a.count*width===source.length)stride=width;
    }
   }
  }
  if(stride&&source.length%stride===0&&(mode==='INDICES'||stride%4===0&&stride<=256)) {
   const count=source.length/stride;
   // Explicit v0 is required for EXT_meshopt_compression. No filters, reordering or quantization.
   const encoded=MeshoptEncoder.encodeGltfBuffer(source,count,stride,mode,0);
   const decoded=new Uint8Array(source.length);MeshoptDecoder.decodeGltfBuffer(decoded,count,stride,encoded,mode,'NONE');assert.deepEqual(Buffer.from(decoded),source);
   // Small channels can grow once extension metadata is included, so retain them verbatim.
   if(encoded.length+176<source.length) {
    const encodedOffset=append(encoded);fallbackOffset=(fallbackOffset+3)&~3;v.buffer=1;v.byteOffset=fallbackOffset;fallbackOffset+=source.length;
    v.extensions={...(v.extensions||{}),[EXT]:{buffer:0,byteOffset:encodedOffset,byteLength:encoded.length,byteStride:stride,count,mode,filter:'NONE'}};
    views.push(v);records.push({view:i,mode,count,stride,originalBytes:source.length,compressedBytes:encoded.length,decodedSha256:sha(decoded),exact:true});continue;
   }
  }
  v.buffer=0;v.byteOffset=append(source);views.push(v);records.push({view:i,mode:'RAW',originalBytes:source.length,storedBytes:source.length,sha256:sha(source)});
 }
 assert(fallbackOffset>0);doc.bufferViews=views;doc.buffers=[{byteLength:actualOffset},{byteLength:fallbackOffset,extensions:{[EXT]:{fallback:true}}}];
 for(const k of ['extensionsUsed','extensionsRequired']){doc[k]=[...(doc[k]||[]),EXT];}
 const packedBinary=Buffer.concat(chunks),result=write(doc,packedBinary);await fs.writeFile(output,result);
 const packed=parse(result);sameSemantics(original,packed.doc);
 let checked=0;for(let i=0;i<original.bufferViews.length;i++){
  const v=packed.doc.bufferViews[i],ex=v.extensions?.[EXT];let decoded;
  if(ex){assert.equal(v.buffer,1);assert.equal(v.byteLength,ex.count*ex.byteStride);assert((v.byteOffset||0)+v.byteLength<=packed.doc.buffers[1].byteLength);assert.equal(ex.buffer,0);assert((ex.byteOffset||0)+ex.byteLength<=packed.doc.buffers[0].byteLength);decoded=new Uint8Array(v.byteLength);MeshoptDecoder.decodeGltfBuffer(decoded,ex.count,ex.byteStride,packed.binary.subarray(ex.byteOffset||0,(ex.byteOffset||0)+ex.byteLength),ex.mode,ex.filter);}
  else decoded=viewPayload(packed.doc,packed.binary,i);
  assert.deepEqual(Buffer.from(decoded),viewPayload(original,binary,i));checked++;
 }
 const decoder=await fs.readFile(new URL('../../assets/cats/vendor/meshoptimizer-1.3.0/meshopt_decoder.cjs',import.meta.url));
 const report={input:path.resolve(input),output:path.resolve(output),inputBytes:raw.length,outputBytes:result.length,savedBytes:raw.length-result.length,savedPercent:100*(1-result.length/raw.length),inputSha256:sha(raw),outputSha256:sha(result),viewsCheckedExact:checked,compressedViews:records.filter(x=>x.mode!=='RAW').length,rawViews:records.filter(x=>x.mode==='RAW').length,semanticJsonExact:true,imageBytesExact:true,compression:{package:'meshoptimizer',version:'1.3.0',license:'MIT',source:'https://registry.npmjs.org/meshoptimizer/-/meshoptimizer-1.3.0.tgz',codecVersion:0,extension:EXT,filter:'NONE',indexMode:'INDICES',vertexReordering:false,quantization:false},decoder:{file:'meshopt_decoder.cjs',bytes:decoder.length,sha256:sha(decoder),embeddedWasm:true,additionalRuntimeFiles:0},records};
 await fs.writeFile(output+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,records:undefined},null,2));return report;
}
const [input,output]=process.argv.slice(2);if(!input||!output)throw new Error('Usage: node compress-proof.mjs input.glb output.glb');await compress(input,output);
