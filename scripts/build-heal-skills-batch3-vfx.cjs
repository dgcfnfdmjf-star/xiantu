#!/usr/bin/env node
'use strict';
// Expand accepted raster plates; do not procedurally draw or recolor effect bodies.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),sharp=require('sharp');
const R=path.resolve(__dirname,'..'),A=path.join(R,'art/heal-skills-batch3'),P=path.join(A,'preview'),N=256;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=async p=>{const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,w:info.width,h:info.height}};
const png=im=>sharp(im.data,{raw:{width:im.w,height:im.h,channels:4}}).png().toBuffer();
function audit(im){let x0=im.w,y0=im.h,x1=-1,y1=-1,n=0,white=0,color=0,opaque=0;
 for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const i=(y*im.w+x)*4;if(im.data[i+3]<=16)continue;const [r,g,b]=im.data.subarray(i,i+3);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++;white+=Math.min(r,g,b)>230;color+=(g>r*1.01||r>b*1.2&&g>b*1.15);opaque+=im.data[i+3]>170;}
 if(!n)throw Error('Empty authored plate');return {bounds:[x0,y0,x1+1,y1+1],white:white/n,dominant:color/n,opaque:opaque/n,visiblePixels:n,hash:hash(im.data)};
}
function validate(file,frames,columns){const r=cp.spawnSync('python3',[path.join(R,'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'),'--input',file,'--frames',String(frames),'--columns',String(columns),'--safe-margin-percent','.12'],{encoding:'utf8'});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout.trim();}
async function source(file,columns,rows){const check=validate(file,columns*rows,columns),m=await sharp(file).metadata(),w=m.width/columns,h=m.height/rows,cells=[];
 if(!m.hasAlpha||!Number.isInteger(w)||!Number.isInteger(h))throw Error('Invalid RGBA grid: '+file);
 for(let i=0;i<columns*rows;i++)cells.push(await sharp(file).extract({left:i%columns*w,top:Math.floor(i/columns)*h,width:w,height:h}).png().toBuffer());
 return {cells,check};
}
// Normalize the accepted source's whole content; the pre-slice audit has already passed.
async function fit(buf,extent){const im=await read(buf),b=audit(im).bounds,s=N*extent/Math.max(b[2]-b[0],b[3]-b[1]);const {data,info}=await sharp(buf).resize(Math.round(im.w*s),Math.round(im.h*s)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),p={data,w:info.width,h:info.height},bb=audit(p).bounds,dx=Math.round(N/2-(bb[0]+bb[2])/2),dy=Math.round(N/2-(bb[1]+bb[3])/2),out=Buffer.alloc(N*N*4);
 for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++){const xx=x+dx,yy=y+dy,i=(y*p.w+x)*4;if(xx<0||yy<0||xx>=N||yy>=N){if(p.data[i+3]>16)throw Error('Clipped normalized source');continue;}p.data.copy(out,(yy*N+xx)*4,i,i+4);}return {data:out,w:N,h:N};
}
function blend(a,b,t,opacity=1){const data=Buffer.alloc(N*N*4);for(let i=0;i<data.length;i+=4){const aa=a.data[i+3]/255*(1-t),ab=b.data[i+3]/255*t,alpha=aa+ab;for(let c=0;c<3;c++)data[i+c]=alpha?Math.round((a.data[i+c]*aa+b.data[i+c]*ab)/alpha):0;data[i+3]=Math.round(alpha*255*opacity);}return {data,w:N,h:N};}
function reveal(im,t){const data=Buffer.from(im.data),b=audit(im).bounds,edge=b[3]-(b[3]-b[1])*(.40+.72*t);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4+3;data[i]=Math.round(data[i]*Math.max(0,Math.min(1,(y-edge+16)/16)));}return {data,w:N,h:N};}
// Animate the authored guard as a small rigid tilt/bob. Never stretch it into travel.
async function orbit(im,phase){const degrees=Math.sin(phase)*3.0,buf=await sharp(await png(im)).rotate(degrees,{background:'#00000000'}).png().toBuffer(),m=await sharp(buf).metadata();
 const tile=await sharp(buf).extract({left:Math.floor((m.width-N)/2),top:Math.floor((m.height-N)/2),width:N,height:N}).png().toBuffer();const p=await read(tile);return blend(p,p,0,.94+.06*Math.cos(phase));
}
async function strip(file,frames){const stats=frames.map(audit);if(new Set(stats.map(x=>x.hash)).size!==frames.length)throw Error('Duplicate frames: '+file);
 for(const s of stats){if(s.white>=.06||s.dominant<.55)throw Error('Palette: '+file+' '+JSON.stringify(s));if(Math.min(s.bounds[0],s.bounds[1],N-s.bounds[2],N-s.bounds[3])<28)throw Error('Export margin: '+file);}
 await sharp({create:{width:N*frames.length,height:N,channels:4,background:'#00000000'}}).composite(await Promise.all(frames.map(async(f,i)=>({input:await png(f),left:i*N,top:0})))).png().toFile(path.join(P,file));return stats;
}
async function main(){fs.mkdirSync(P,{recursive:true});const report={},effects=[];
 for(const [key,name,duration,windows,sizes,guardLoop] of [
  ['jade_heart_guard','青莲护心',580,[[0,110],[80,240],[210,365],[335,580]],[180,270,160,170,220,220],1200],
  ['aureate_lotus_guard','莲华济世',700,[[0,135],[105,290],[260,440],[410,700]],[220,335,190,205,275,275],1400]]){
  const dir=path.join(A,'source',key),master=path.join(dir,'master-original.png'),plates=path.join(dir,'keyplates-original.png'),m=await source(master,1,1),s=await source(plates,4,2);
  const stats={master:audit(await read(master)),sourcePlates:await Promise.all(s.cells.map(async p=>audit(await read(p))))};
  for(const v of [stats.master,...stats.sourcePlates])if(v.white>=.06||v.dominant<.55)throw Error(key+' source palette '+JSON.stringify(v));
  const c=await Promise.all(s.cells.map((p,i)=>fit(p,i===0?.55:i>=4?.6:.63)));
  const sets={telegraph:[.45,.65,.85,1].map(a=>blend(c[0],c[0],0,a)),body:[0,.14,.28,.43,.57,.71,.86,1].map(t=>reveal(blend(c[1],c[2],t*.6),t)),impact:[1,.94,.82,.66,.43,.20].map(a=>blend(c[3],c[3],0,a)),residue:[1,.86,.70,.52,.32,.12].map(a=>blend(c[4],c[4],0,a)),guard:await Promise.all(Array.from({length:8},(_,i)=>orbit(c[5],i*Math.PI/4))),consume:[0,.2,.4,.6,.8,1].map(t=>blend(c[6],c[7],t,1-t*.88))};
  const layers={},outputHashes={},names=Object.keys(sets);
  for(const [name,frames] of Object.entries(sets)){const file=key+'_'+name+'.png';stats[name]=await strip(file,frames);outputHashes[file]=hash(fs.readFileSync(path.join(P,file)));layers[name]={file,frames:frames.length,frameWidth:N,frameHeight:N,pivotX:.5,pivotY:.5,fps:name==='guard'?8:30,loop:name==='guard',holdLast:false};}
  effects.push({key,name,element:'heal',visualArchetype:'shield-orbit',layers,scale:1,offsetX:0,offsetY:0,trailLength:0,display:Object.fromEntries(names.map((n,i)=>[n,sizes[i]])),timing:{durationMs:duration,guardStartMs:duration-130,guardFadeMs:100,guardLoopMs:guardLoop,consumeMs:220},preview:{displayMode:'shield-orbit',durationMs:duration,distance:0,layers:Object.fromEntries(['telegraph','body','impact','residue'].map((n,i)=>{const [a,b]=windows[i];return [n,{start:a/duration,end:b/duration,anchor:'origin',width:sizes[i],height:sizes[i],fadeIn:(i?windows[i-1][1]-a:30)/(b-a),fadeOut:(i<3?b-windows[i+1][0]:80)/(b-a)}]}))},acceptance:['Independent jade / gold-edged jade material masters','Actual healing and guard ownership are independent','Guard only ends on authoritative consume/replacement/exit; no fabricated duration','Full HP can show guard without successful healing','Source-over; registered crossfade; no gameplay writes'],eventContract:{actualHeal:'HP actually restored by this cast',guardOwned:'True only when this cast owns the active strongest guard',guardConsumedAt:'Relative timestamp of actual guard consumption; absent means unconsumed',guardReplacedAt:'Relative timestamp of replacement by a stronger/new guard',presentationOnly:true}});
  report[key]={inputs:{master:hash(fs.readFileSync(master)),keyplates:hash(fs.readFileSync(plates))},checks:[m.check,s.check],frames:stats,outputHashes};
 }
 for(const f of ['effect-manifest.json','effect-manifest.preview.json'])fs.writeFileSync(path.join(P,f),JSON.stringify({schemaVersion:1,effects},null,2)+'\n');fs.writeFileSync(path.join(P,'definition.js'),'window.HealGuardDefinitions='+JSON.stringify(effects)+';\n');fs.copyFileSync(path.join(A,'sampler.js'),path.join(P,'choreography.js'));fs.copyFileSync(path.join(R,'art/sword-skills-batch2/preview/stage-reference.webp'),path.join(P,'stage-reference.webp'));
 fs.writeFileSync(path.join(A,'asset-audit.json'),JSON.stringify({command:'node scripts/build-heal-skills-batch3-vfx.cjs',sourcePolicy:'Original accepted sources validated at 12% before slicing; failed plates regenerated, never cropped to hide clipping',effects:report},null,2)+'\n');console.log('PASS: 2 effects, 12 RGBA strips, 76 distinct frames; separate guard loop and consume outro');
}
main().catch(e=>{console.error(e);process.exitCode=1});
