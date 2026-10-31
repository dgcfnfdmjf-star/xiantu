#!/usr/bin/env node
// Assemble authored raster plates only: no procedural effect-body drawing.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),sharp=require('sharp');
const R=path.resolve(__dirname,'..'),A=path.join(R,'art/heal-skills-batch2'),P=path.join(A,'preview'),N=256;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=async p=>{const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,w:info.width,h:info.height}};
const png=im=>sharp(im.data,{raw:{width:im.w,height:im.h,channels:4}}).png().toBuffer();
function bounds(im){let x0=im.w,y0=im.h,x1=-1,y1=-1,n=0,white=0,color=0;for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const i=(y*im.w+x)*4;if(im.data[i+3]<=16)continue;const [r,g,b]=im.data.subarray(i,i+3);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);n++;white+=Math.min(r,g,b)>230;color+=(g>r*1.01||b>r*1.08||r>b*1.2&&g>b*1.15);}if(!n)throw Error('Empty plate');return {bounds:[x0,y0,x1+1,y1+1],white:white/n,dominant:color/n,hash:hash(im.data)}}
function validate(file,frames,columns,margin){const r=cp.spawnSync('python3',[path.join(R,'.agents/skills/creating-game-combat-vfx/scripts/validate_sprite_source_grid.py'),'--input',file,'--frames',String(frames),'--columns',String(columns),'--safe-margin-percent',String(margin)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stdout+r.stderr);return r.stdout.trim()}
async function safeSource(file,columns,rows){
 const checks=[validate(file,columns*rows,columns,.12)],meta=await sharp(file).metadata(),w=meta.width/columns,h=meta.height/rows,cells=[];
 if(!meta.hasAlpha||!Number.isInteger(w)||!Number.isInteger(h))throw Error('Invalid RGBA source grid');
 for(let i=0;i<columns*rows;i++)cells.push(await sharp(file).extract({left:i%columns*w,top:Math.floor(i/columns)*h,width:w,height:h}).png().toBuffer());
 return {cells,checks};
}
async function fit(input,extent){const im=await read(input),b=bounds(im).bounds,s=N*extent/Math.max(b[2]-b[0],b[3]-b[1]);const scaled=await sharp(input).resize(Math.max(1,Math.round(im.w*s)),Math.max(1,Math.round(im.h*s))).ensureAlpha().raw().toBuffer({resolveWithObject:true});const p={data:scaled.data,w:scaled.info.width,h:scaled.info.height},bb=bounds(p).bounds,dx=Math.round(N/2-(bb[0]+bb[2])/2),dy=Math.round(N/2-(bb[1]+bb[3])/2),out=Buffer.alloc(N*N*4);
 for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++){const xx=x+dx,yy=y+dy,i=(y*p.w+x)*4;if(xx<0||xx>=N||yy<0||yy>=N){if(p.data[i+3]>16)throw Error('Fit clipped content');continue;}p.data.copy(out,(yy*N+xx)*4,i,i+4);}return {data:out,w:N,h:N};}
function blend(a,b,t,opacity=1){const data=Buffer.alloc(N*N*4);for(let i=0;i<data.length;i+=4){const aa=a.data[i+3]/255*(1-t),ab=b.data[i+3]/255*t,alpha=aa+ab;for(let c=0;c<3;c++)data[i+c]=alpha?Math.round((a.data[i+c]*aa+b.data[i+c]*ab)/alpha):0;data[i+3]=Math.round(alpha*255*opacity);}return {data,w:N,h:N}}
function reveal(im,t){const data=Buffer.from(im.data),b=bounds(im).bounds,edge=b[3]-(b[3]-b[1])*(.48+.65*t),soft=20;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4+3;data[i]=Math.round(data[i]*Math.max(0,Math.min(1,(y-edge+soft)/soft)));}return {data,w:N,h:N}}
// Extract authored channels without changing their geometry or drawing new shapes.
function channel(im,kind){
 const data=Buffer.from(im.data);
 if(kind==='normal'){for(let i=0;i<data.length;i+=4){const [r,g,b]=data.subarray(i,i+3);if(r>b*1.2&&g>b*1.15&&r>g*.8)data[i+3]=Math.round(data[i+3]*.48);}return {data,w:N,h:N};}
 // Propagate the nearest chromatic material into neutral specular highlights.
 // Unlike a screen-space half mask this preserves the central blue residue droplet.
 const family=new Uint8Array(N*N),queue=new Int32Array(N*N);let tail=0;
 for(let p=0;p<family.length;p++){const i=p*4,d=data[i+2]-data[i+1];if(data[i+3]>12&&Math.abs(d)>=5){family[p]=d>0?2:1;queue[tail++]=p;}}
 for(let head=0;head<tail;head++){const p=queue[head],x=p%N,y=Math.floor(p/N);for(const q of [x>0?p-1:-1,x<N-1?p+1:-1,y>0?p-N:-1,y<N-1?p+N:-1])if(q>=0&&!family[q]){family[q]=family[p];queue[tail++]=q;}}
 for(let p=0;p<family.length;p++)if(family[p]!== (kind==='mp'?2:1))data[p*4+3]=0;
 return {data,w:N,h:N};
}
async function strip(file,frames){await sharp({create:{width:N*frames.length,height:N,channels:4,background:'#00000000'}}).composite(await Promise.all(frames.map(async(f,i)=>({input:await png(f),left:i*N,top:0})))).png().toFile(path.join(P,file));const stats=frames.map(bounds);if(new Set(stats.map(x=>x.hash)).size!==frames.length)throw Error('Duplicate frames '+file);for(const s of stats){if(s.white>=.06||s.dominant<.55)throw Error('Palette '+file+' '+JSON.stringify(s));if(Math.min(s.bounds[0],s.bounds[1],N-s.bounds[2],N-s.bounds[3])<28)throw Error('Export margin '+file);}return stats;}
async function main(){fs.mkdirSync(P,{recursive:true});const report={},effects=[];
 for(const [key,name,duration,windows,sizes] of [
 ['spring_reflux','灵泉归元',550,[[0,110],[80,245],[215,355],[325,550]],[210,300,110,190]],
 ['fate_mend','逆命回元',620,[[0,120],[90,270],[240,400],[370,620]],[185,280,95,185]],
 ['vitality_plume','起死回生',720,[[0,140],[110,300],[270,440],[410,720]],[200,350,120,230]]]){
  const source=path.join(A,'source',key),master=path.join(source,'master-original.png'),plates=path.join(source,'keyplates-original.png');
  const m=await safeSource(master,1,1),s=await safeSource(plates,3,2),stats={master:bounds(await read(master)),sourcePlates:await Promise.all(s.cells.map(async p=>bounds(await read(p))))};
  for(const p of [stats.master,...stats.sourcePlates])if(p.white>=.06||p.dominant<.55)throw Error(key+' source palette '+JSON.stringify(p));
  const cells=await Promise.all(s.cells.map((p,i)=>fit(p,i===0?.5:i>=4?.48:.6)));
  // One registered body skeleton; alpha reveal supplies upward gathering without a ghosted second body.
  const sets={telegraph:[.45,.65,.85,1].map(k=>blend(cells[0],cells[0],0,k)),body:[0,.14,.28,.43,.57,.71,.86,1].map((k,i)=>blend(reveal(cells[1],k),reveal(cells[1],k),0,1-i*.006)),impact:[1,.93,.8,.62,.4,.18].map(k=>blend(cells[3],cells[3],0,k)),residue:[0,.2,.4,.6,.8,1].map(k=>blend(cells[4],cells[5],k,1-k*.85))},layers={},outputHashes={};
  for(const [layer,frames] of Object.entries(sets)){
   const file=`${key}_${layer}.png`;stats[layer]=await strip(file,frames);outputHashes[file]=hash(fs.readFileSync(path.join(P,file)));
   const channels={};for(const kind of key==='spring_reflux'?['hp','mp']:key==='fate_mend'?['normal']:[]){const f=`${key}_${layer}_${kind}.png`;stats[layer+'_'+kind]=await strip(f,frames.map(im=>channel(im,kind)));channels[kind]=f;outputHashes[f]=hash(fs.readFileSync(path.join(P,f)));}
   layers[layer]={file,channels,frames:frames.length,frameWidth:N,frameHeight:N,pivotX:.5,pivotY:.5,fps:30,loop:false,holdLast:false};
  }
  const names=Object.keys(sets);effects.push({key,name,element:'heal',visualArchetype:'ground-eruption',layers,scale:1,offsetX:0,offsetY:0,trailLength:0,display:Object.fromEntries(names.map((k,i)=>[k,sizes[i]])),timing:{durationMs:duration},acceptance:['Independent authored water, jade and feather materials','Self-only with independent actualHeal / actualMpRestore gating','Pre-heal emergency flag selects jade seam variant','Read-only presentation; expiry and identity cleanup'],preview:{displayMode:'ground-eruption',durationMs:duration,distance:0,layers:Object.fromEntries(names.map((k,i)=>{const [a,b]=windows[i],fi=i?windows[i-1][1]-a:30,fo=i<3?b-windows[i+1][0]:80;return[k,{start:a/duration,end:b/duration,anchor:'origin',width:sizes[i],height:sizes[i],fadeIn:fi/(b-a),fadeOut:fo/(b-a)}]}))},eventContract:{actualHeal:'HP actually restored in this cast',actualMpRestore:'MP actually restored after skill cost, never inferred from HP',emergency:'Boolean computed from pre-heal HP <=25%; no post-heal inference',presentationOnly:true}});
  report[key]={inputs:{master:hash(fs.readFileSync(master)),keyplates:hash(fs.readFileSync(plates))},checks:[...m.checks,...s.checks],frames:stats,outputHashes};
 }
 const manifest={schemaVersion:1,effects};for(const f of ['effect-manifest.json','effect-manifest.preview.json'])fs.writeFileSync(path.join(P,f),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(P,'definition.js'),'window.HealBatchDefinitions='+JSON.stringify(effects)+';\n');fs.copyFileSync(path.join(A,'sampler.js'),path.join(P,'choreography.js'));fs.copyFileSync(path.join(R,'art/sword-skills-batch2/preview/stage-reference.webp'),path.join(P,'stage-reference.webp'));fs.writeFileSync(path.join(A,'asset-audit.json'),JSON.stringify({command:'node scripts/build-heal-skills-batch2-vfx.cjs',sourcePolicy:'All original source cells pass12% before slicing; rejected drafts regenerated, no corrective padding/cropping',effects:report},null,2)+'\n');console.log('PASS: 3 effects, 24 RGBA strips, 144 distinct frames including result variants');
}
main().catch(e=>{console.error(e);process.exitCode=1});
