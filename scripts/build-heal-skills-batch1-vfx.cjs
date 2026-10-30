#!/usr/bin/env node
// Assemble authored raster plates only: no procedural effect-body drawing.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),sharp=require('sharp');
const R=path.resolve(__dirname,'..'),A=path.join(R,'art/heal-skills-batch1'),P=path.join(A,'preview'),N=256;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=async p=>{const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,w:info.width,h:info.height}};
const png=im=>sharp(im.data,{raw:{width:im.w,height:im.h,channels:4}}).png().toBuffer();
function bounds(im){let x0=im.w,y0=im.h,x1=-1,y1=-1,n=0,white=0,color=0;for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const i=(y*im.w+x)*4;if(im.data[i+3]<=16)continue;const [r,g,b]=im.data.subarray(i,i+3);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++;white+=Math.min(r,g,b)>230;color+=g>r*1.01&&g>b*.94;}if(!n)throw Error('Empty plate');return {bounds:[x0,y0,x1+1,y1+1],white:white/n,dominant:color/n,hash:hash(im.data)}}
function validate(file,frames,columns,margin){const r=cp.spawnSync('python3',[path.join(R,'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'),'--input',file,'--frames',String(frames),'--columns',String(columns),'--safe-margin-percent',String(margin)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout.trim()}
async function safeSource(file,columns,rows){
 const meta=await sharp(file).metadata(),cw=meta.width/columns,ch=meta.height/rows;
 if(!Number.isInteger(cw)||!Number.isInteger(ch))throw Error('Non-divisible source');
 // A 2% original-boundary check rejects clipped content before whole-cell expansion.
 const checks=[validate(file,columns*rows,columns,.02)],pad=Math.ceil(Math.max(cw,ch)/2),w=cw+2*pad,h=ch+2*pad,tiles=[];
 for(let i=0;i<columns*rows;i++)tiles.push({input:await sharp(file).extract({left:i%columns*cw,top:Math.floor(i/columns)*ch,width:cw,height:ch}).png().toBuffer(),left:i%columns*w+pad,top:Math.floor(i/columns)*h+pad});
 const target=file.replace('-original','-safe');await sharp({create:{width:w*columns,height:h*rows,channels:4,background:'#00000000'}}).composite(tiles).png().toFile(target);checks.push(validate(target,columns*rows,columns,.18));
 const cells=[];for(let i=0;i<columns*rows;i++)cells.push(await sharp(target).extract({left:i%columns*w,top:Math.floor(i/columns)*h,width:w,height:h}).png().toBuffer());return {cells,checks,target};
}
async function fit(input,extent){const im=await read(input),b=bounds(im).bounds,s=N*extent/Math.max(b[2]-b[0],b[3]-b[1]);const scaled=await sharp(input).resize(Math.max(1,Math.round(im.w*s)),Math.max(1,Math.round(im.h*s))).ensureAlpha().raw().toBuffer({resolveWithObject:true});const p={data:scaled.data,w:scaled.info.width,h:scaled.info.height},bb=bounds(p).bounds,dx=Math.round(N/2-(bb[0]+bb[2])/2),dy=Math.round(N/2-(bb[1]+bb[3])/2),out=Buffer.alloc(N*N*4);
 for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++){const xx=x+dx,yy=y+dy,i=(y*p.w+x)*4;if(xx<0||xx>=N||yy<0||yy>=N){if(p.data[i+3]>16)throw Error('Fit clipped content');continue;}p.data.copy(out,(yy*N+xx)*4,i,i+4);}return {data:out,w:N,h:N};}
function blend(a,b,t,opacity=1){const data=Buffer.alloc(N*N*4);for(let i=0;i<data.length;i+=4){const aa=a.data[i+3]/255*(1-t),ab=b.data[i+3]/255*t,alpha=aa+ab;for(let c=0;c<3;c++)data[i+c]=alpha?Math.round((a.data[i+c]*aa+b.data[i+c]*ab)/alpha):0;data[i+3]=Math.round(alpha*255*opacity);}return {data,w:N,h:N}}
function reveal(im,t){const data=Buffer.from(im.data),b=bounds(im).bounds,edge=b[3]-(b[3]-b[1])*(.48+.65*t),soft=20;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4+3;data[i]=Math.round(data[i]*Math.max(0,Math.min(1,(y-edge+soft)/soft)));}return {data,w:N,h:N}}
async function main(){fs.mkdirSync(P,{recursive:true});const report={},effects=[];
 for(const [key,name,duration,windows,sizes] of [
 ['dew_return','凝露诀',430,[[0,95],[65,195],[170,285],[260,430]],[65,150,100,100]],
 ['spring_return','回春术',520,[[0,120],[90,235],[210,350],[320,520]],[100,260,135,165]],
 ['verdant_bloom','生生不息',650,[[0,140],[110,270],[240,410],[380,650]],[150,340,180,230]]]){
 const source=path.join(A,'source',key),master=path.join(source,'master-original.png'),plates=path.join(source,'keyplates-original.png');
 const m=await safeSource(master,1,1),s=await safeSource(plates,3,2),stats={master:bounds(await read(master))};if(stats.master.white>=.06)throw Error(key+' master exposure');
 const cells=await Promise.all(s.cells.map((p,i)=>fit(p,i===0?.5:i>=4?.48:.6)));
 // Register one authored silhouette throughout growth; crossblending two differently
 // drawn branch skeletons caused double leaves. Retain the alternative plate as source.
 const bodyFrames=key==='dew_return'?[.78,.83,.9,.96,1,.97,.88,.81].map(k=>blend(cells[1],cells[1],0,k)):[0,.14,.28,.43,.57,.71,.86,1].map((k,i)=>blend(reveal(cells[1],k),reveal(cells[1],k),0,1-i*.006));
 const sets={telegraph:[.45,.65,.85,1].map(k=>blend(cells[0],cells[0],0,k)),body:bodyFrames,impact:[1,.93,.8,.62,.4,.18].map(k=>blend(cells[3],cells[3],0,k)),residue:[0,.2,.4,.6,.8,1].map(k=>blend(cells[4],cells[5],k,1-k*.85))},layers={};
 for(const [layer,frames] of Object.entries(sets)){const file=`${key}_${layer}.png`;await sharp({create:{width:N*frames.length,height:N,channels:4,background:'#00000000'}}).composite(await Promise.all(frames.map(async(f,i)=>({input:await png(f),left:i*N,top:0})))).png().toFile(path.join(P,file));
  const a=frames.map(bounds);if(new Set(a.map(x=>x.hash)).size!==frames.length)throw Error('Duplicate frames');for(const x of a){if(x.white>=.06||x.dominant<.55)throw Error(`${key}/${layer} palette ${JSON.stringify(x)}`);if(Math.min(x.bounds[0],x.bounds[1],N-x.bounds[2],N-x.bounds[3])<28)throw Error('Export margin');}stats[layer]=a;layers[layer]={file,frames:frames.length,frameWidth:N,frameHeight:N,pivotX:.5,pivotY:.5,fps:30,loop:false,holdLast:false};
 }
 const names=Object.keys(sets),D={key,name,element:'heal',visualArchetype:'ground-eruption',layers,scale:1,offsetX:0,offsetY:0,trailLength:0,display:Object.fromEntries(names.map((k,i)=>[k,sizes[i]])),timing:{durationMs:duration},acceptance:['Independent authored dew, leaf and branch materials','Self-only; authoritative actualHeal gates absorption','Preview only: no HP, MP, RNG, turns or save mutation','Crossfade, fixed-size body, explicit cleanup'],preview:{displayMode:'ground-eruption',durationMs:duration,distance:0,layers:Object.fromEntries(names.map((k,i)=>{const [a,b]=windows[i],fadeIn=i?windows[i-1][1]-a:30,fadeOut=i<3?b-windows[i+1][0]:70;return [k,{start:a/duration,end:b/duration,anchor:'origin',width:sizes[i],height:sizes[i],fadeIn:fadeIn/(b-a),fadeOut:fadeOut/(b-a)}]}))},eventContract:{actualHeal:'actual HP restored by this cast; positive enables body and absorption',presentationOnly:true}};
 effects.push(D);report[key]={inputs:{master:hash(fs.readFileSync(master)),keyplates:hash(fs.readFileSync(plates))},checks:[...m.checks,...s.checks],frames:stats,outputHashes:Object.fromEntries(Object.values(layers).map(l=>[l.file,hash(fs.readFileSync(path.join(P,l.file)))]))};
 }
 const manifest={schemaVersion:1,effects};for(const f of ['effect-manifest.json','effect-manifest.preview.json'])fs.writeFileSync(path.join(P,f),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(P,'definition.js'),'window.HealBatchDefinitions='+JSON.stringify(effects)+';\n');fs.copyFileSync(path.join(A,'sampler.js'),path.join(P,'choreography.js'));fs.copyFileSync(path.join(R,'art/sword-skills-batch2/preview/stage-reference.webp'),path.join(P,'stage-reference.webp'));fs.writeFileSync(path.join(A,'asset-audit.json'),JSON.stringify({command:'node scripts/build-heal-skills-batch1-vfx.cjs',sourcePolicy:'Original clipping check at2%; expand entire cells without dropping pixels; mandatory18% boundary check before final slicing',effects:report},null,2)+'\n');console.log('PASS: 3 authored effects, 12 RGBA strips, 72 distinct frames');
}
main().catch(e=>{console.error(e);process.exitCode=1});
