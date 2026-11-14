'use strict';
// Ground contact is measured from the visible, skinned paw vertices in the real
// chapter-two scene. Diagnostic stepping uses the unchanged GardenPlay.update;
// it never substitutes root movement or samples an isolated mock animation.
const assert = require('node:assert/strict');
const f = require('./cat-models-fixture.cjs');
const out = f.path.resolve(process.env.CAT_GAIT_OUTPUT || f.path.join(f.repo, 'output/playwright/cat-gait'));
f.fs.mkdirSync(out, {recursive:true});
const kinds = process.env.CAT_GAIT_KIND ? [process.env.CAT_GAIT_KIND] : f.kinds;
const evidenceOnly = process.env.CAT_GAIT_BASELINE === '1';
const captureFrames = process.env.CAT_GAIT_FRAMES === '1';
function measure(kind) {
  const k = __kittens.list.find(k=>k.kind.id===kind && k.catModel);
  k.root.updateWorldMatrix(true,true);
  const inverse = new THREE.Matrix4().copy(k.root.parent.matrixWorld).invert(), point = new THREE.Vector3();
  if (!k.gaitMarkers) {
    k.gaitMarkers = {};
    k.catModel.traverse(n=>{
      if (!n.isSkinnedMesh || n.material.name !== 'Watercolor fur · runtime atlas') return;
      const p=n.geometry.attributes.position,w=n.geometry.attributes.skinWeight,j=n.geometry.attributes.skinIndex;
      for(let i=0;i<p.count;i++) {
        for(const get of ['getX','getY','getZ','getW']) {
          const bone=n.skeleton.bones[j[get](i)]?.name;
          if(w[get](i)>.98 && /^(Front|Rear)Paw[.]?[LR]$/.test(bone)) {
            (k.gaitMarkers[bone] ||= []).push({node:n,index:i,y:p.getY(i)}); break;
          }
        }
      }
    });
    for(const bone of Object.keys(k.gaitMarkers)) k.gaitMarkers[bone]=k.gaitMarkers[bone].sort((a,b)=>a.y-b.y).slice(0,8);
  }
  k.catModel.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
  const paws={};
  for(const [name,markers] of Object.entries(k.gaitMarkers)) {
    const sum=new THREE.Vector3();let min=Infinity;
    for(const m of markers) {
      point.fromBufferAttribute(m.node.geometry.attributes.position,m.index);
      __catTestSkinVertex(m.node,m.index,point);
      point.applyMatrix4(m.node.matrixWorld).applyMatrix4(inverse);
      sum.add(point);min=Math.min(min,point.y-k.root.position.y);
    }
    paws[name]={p:sum.divideScalar(markers.length).toArray(),min,vertices:markers.length};
  }
  return {kind,x:k.x,z:k.z,yaw:k.yaw,phase:k.catWalkAction.time/k.catWalkAction.getClip().duration,
    active:k.catWalkActive,moving:k.moving,speed:k.catWalkSpeed,actual:k.catWalkActualSpeed,
    hz:k.catWalkAction.getEffectiveTimeScale()/k.catWalkAction.getClip().duration,
    stride:k.catWalkStride*k.catWalkScale*k.size,paws};
}
(async()=>{
  const server=await f.server({root:process.env.CAT_GAIT_SITE,spawnSequence:[...f.kinds,...f.kinds]});
  const browser=await f.browser();const result={diagnosticOnly:evidenceOnly,cats:[]};
  try {
    const test=await f.fresh(browser,{mobile:false,randomSeed:638471}),page=test.page;
    try {
      await f.start(test,server.url);
      await page.waitForFunction(()=>__kittens.list.every(k=>k.catModel));
      await page.waitForTimeout(1500); // actual, live chapter-two movement first
      await page.screenshot({path:f.path.join(out,'live-game.png')});
      await page.evaluate(()=>{
        Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
        window.gaitRenderer=__catTestRenderer.render;
        window.gaitRender=kind=>{
          const k=__kittens.list.find(k=>k.kind.id===kind),parent=k.root.parent;
          const center=parent.localToWorld(new THREE.Vector3(k.x,.65,k.z));
          const camera=__catTestCamera;
          camera.position.copy(parent.localToWorld(new THREE.Vector3(k.x+2.2,1.25,k.z+.65)));
          camera.lookAt(center);camera.updateMatrixWorld(true);
          __catTestScene.updateMatrixWorld(true);gaitRenderer.call(__catTestRenderer,__catTestScene,camera);
        };
      });
      for(const kind of kinds) {
        if(captureFrames) f.fs.mkdirSync(f.path.join(out,kind+'-frames'),{recursive:true});
        await page.evaluate(kind=>{
          __kittens.list.forEach((k,i)=>{
            k.state='idle';k.timer=1000;k.fade=1;k.y=0;k.crouch=k.curl=0;
            k.x=k.tx=i%2?-3.6:3.6;k.z=k.tz=-3+i*.4;
            k.moving=false;GardenCatModels.pose(k,0,0);
          });
          const k=__kittens.list.find(k=>k.kind.id===kind);k.x=0;k.z=.8;k.tx=0;k.tz=2.9;k.yaw=0;k.phase=0;
          k.catWalkX=k.x;k.catWalkZ=k.z;k.state='roam';k.timer=1000;
          GardenPlay.update(0,0,.4);
          gaitRender(kind);
        },kind);
        const rows=[await page.evaluate(measure,kind)];let nextShot=0;
        for(let frame=1;frame<=120;frame++) {
          await page.evaluate(({kind,frame})=>{GardenPlay.update(1/60,frame/60,.4);gaitRender(kind);},{kind,frame});
          const row=await page.evaluate(measure,kind);rows.push(row);
          if(captureFrames && frame%3===0) await page.screenshot({path:f.path.join(out,kind+'-frames',String(frame/3).padStart(3,'0')+'.png')});
          if(nextShot<4 && row.phase>=nextShot/4 && row.phase<(nextShot+1)/4) {
            await page.screenshot({path:f.path.join(out,kind+'-walk-'+String(nextShot*25).padStart(2,'0')+'.png')});nextShot++;
          }
        }
        const slip=[],clearance=[],hz=[],cadence=[];
        for(let i=1;i<rows.length;i++) {
          const a=rows[i-1],b=rows[i];if(!a.moving || !b.moving)continue;
          const advance=(b.phase-a.phase+1)%1, traveled=Math.hypot(b.x-a.x,b.z-a.z);
          cadence.push(Math.abs(advance*b.stride-traveled));hz.push(b.hz);
          for(const [bone,paw] of Object.entries(b.paws)) {
            clearance.push(paw.min);
            const offset=(bone.startsWith('Rear')?.25:0)+(bone.endsWith('R')?.5:0);
            const p=(a.phase+offset)%1,q=(b.phase+offset)%1;
            if(p>.10 && q>.10 && p<.50 && q<.50 && Math.abs(b.yaw-a.yaw)<.01) {
              const old=a.paws[bone].p;slip.push(Math.hypot(paw.p[0]-old[0],paw.p[2]-old[2])*60);
            }
          }
        }
        const metrics={kind,samples:rows.length,contactSamples:slip.length,slip:f.summarize(slip),maxSlip:Math.max(...slip),
          minSoleHeight:Math.min(...clearance),maxSoleHeight:Math.max(...clearance),cadenceError:Math.max(...cadence),hz:f.summarize(hz),screenshots:nextShot};
        if(!evidenceOnly) {
          assert.equal(Object.keys(rows[0].paws).length,4,kind+': measure all four actual paw surfaces');
          assert(slip.length>100,kind+': enough real planted-paw samples');
          assert(metrics.slip.p95<.035,kind+': planted paws do not skate '+JSON.stringify(metrics));
          assert(metrics.minSoleHeight>-.003,kind+': toes do not pass through the ground');
          assert(metrics.maxSoleHeight>.025 && metrics.maxSoleHeight<.060,kind+': gentle but visible swing clearance');
          assert(metrics.cadenceError<1e-5,kind+': steps stay synchronized with actual root travel');
          assert.equal(nextShot,4,kind+': all four gait phases captured');
        }
        f.fs.writeFileSync(f.path.join(out,kind+'-samples.json'),JSON.stringify(rows));result.cats.push(metrics);
      }
      assert.deepEqual(test.errors,[]);assert.deepEqual(test.external,[]);
    } finally {await test.context.close();}
    f.fs.writeFileSync(f.path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
