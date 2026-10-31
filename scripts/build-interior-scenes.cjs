'use strict';
// Encode individually generated illustrations; no repainting or procedural substitutes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),src=path.join(root,'art/interior-scenes-v286893'),out=path.join(root,'xiantu-v2831-scroll/interior-scenes-v286893');
(async()=>{
 const sources=JSON.parse(fs.readFileSync(path.join(src,'sources.json'),'utf8')),scenes=[];
 fs.mkdirSync(out,{recursive:true});
 for(const scene of sources.scenes){
  const original=path.join(src,scene.id+'.png');
  if(!fs.existsSync(original))fs.copyFileSync(scene.source,original);
  const file=scene.id+'.webp';
  await sharp(original).resize(1152,864,{fit:'fill'}).webp({quality:84}).toFile(path.join(out,file));
  const data=fs.readFileSync(path.join(out,file));
  scenes.push({id:scene.id,name:scene.name,file,width:1152,height:864,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
 }
 if(scenes.length!==17||new Set(scenes.map(s=>s.sha256)).size!==17)throw Error('Expected 17 distinct rooms');
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,scenes},null,2)+'\n');
 console.log('17 distinct WebP scenes:',scenes.reduce((n,s)=>n+s.bytes,0),'bytes');
})().catch(e=>{console.error(e);process.exitCode=1;});
