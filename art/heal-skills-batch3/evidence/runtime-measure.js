async page=>{
 await page.waitForFunction(()=>scene?.ready);
 const result=await page.evaluate(async()=>{
  const fx=InkSkillFxV2854,names=['青莲护心','莲华济世'],out={};
  for(const name of names){fx.elementBatch.prepare(name);await new Promise(r=>setTimeout(r,200));}
  await new Promise(r=>{const poll=()=>names.every(n=>fx.elementBatch.ready(n))?r():setTimeout(poll,50);poll()});
  const c=document.createElement('canvas');c.width=720;c.height=420;const ctx=c.getContext('2d');
  for(const name of names){const samples=[],j={profile:fx.profile(name),from:{x:245,y:200},to:{x:245,y:200},fromGround:{x:245,y:302},toGround:{x:245,y:302},width:720,clipBottom:355,scale:1.05,actualHeal:180,duration:fx.authoredDuration(name),hitAt:0};
   for(let i=0;i<1200;i++){const t=performance.now();ctx.clearRect(0,0,720,420);fx.draw(ctx,j,(i%120)*j.duration/120);const dt=performance.now()-t;if(i>=200)samples.push(dt)}samples.sort((a,b)=>a-b);out[name]={count:samples.length,median:samples[500],p95:samples[950]};}
  const stamps=[],original=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas===scene.canvas)stamps.push(performance.now());return original.apply(this,a)};
  perform('heal');await new Promise(r=>setTimeout(r,4000));CanvasRenderingContext2D.prototype.clearRect=original;
  const intervals=stamps.slice(1).map((t,i)=>t-stamps[i]).sort((a,b)=>a-b);return {drawMs:out,frameIntervalsMs:{count:intervals.length,median:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)]},browser:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio};
 });return result;
}
