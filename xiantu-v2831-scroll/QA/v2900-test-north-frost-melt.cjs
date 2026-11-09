'use strict';
// North snow melts across the north-facing border of west/east: small baked overlays, composited after the panorama.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),src=fs.readFileSync(root+'/xiantu-v2762-core.js','utf8');
for(const [region,file] of [['west','west-frost-v2900.webp'],['east','east-frost-v2900.webp']]){
  const buf=fs.readFileSync(path.join(root,file));
  a.ok(buf.length<80*1024,`${file} stays mobile-sized (${buf.length} bytes)`);
  a.equal(buf.toString('ascii',0,4),'RIFF');a.equal(buf.toString('ascii',8,12),'WEBP');
  a.equal(buf.toString('ascii',12,16),'VP8X',`${file} is extended WebP`);a.ok(buf[20]&0x10,`${file} carries alpha`);
  const w=1+buf.readUIntLE(24,3),h=1+buf.readUIntLE(27,3);a.deepEqual([w,h],[742,530],`${file} is half of the 1484x1060 panorama`);
  a.match(src,new RegExp(`${region}:\\{file:'${region}-panorama-v286898\\.webp',frost:'${file.replace('.','\\.')}'`),`${region} scene references its frost overlay`);
}
a.doesNotMatch(src,/north:\{"file":"north-panorama-v2868108\.webp","frost"/,'north keeps its own snow to the border');
a.match(src,/function drawWildSceneV286898\(ctx\)\{[^\n]*drawWildFrostV2900\(ctx,0,0,FLAT_WORLD\.width,FLAT_WORLD\.height\)/,'field composites frost after the base panorama');
a.match(src,/background-image:\$\{scene\.frost\?`url\('\.\/\$\{scene\.frost\}'\),`:''\}url\('\.\/\$\{scene\.file\}'\)/,'scroll overview stacks frost over the panorama');
console.log('north frost melt overlays ok');
