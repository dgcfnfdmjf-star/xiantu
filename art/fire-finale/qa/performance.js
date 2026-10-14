async page=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8772/xiantu-v2831-scroll/battle-25d-preview.html');await page.waitForFunction(()=>scene?.ready);
 await page.evaluate(()=>['流火飞索','炎阳护盾'].forEach(n=>InkSkillFxV2854.elementBatch.prepare(n)));await page.waitForFunction(()=>['流火飞索','炎阳护盾'].every(n=>InkSkillFxV2854.elementBatch.ready(n)));
 return await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=720;canvas.height=420;const c=canvas.getContext('2d'),draw={};
 for(const name of ['流火飞索','炎阳护盾']){const self=name==='炎阳护盾',j={profile:InkSkillFxV2854.profile(name),from:{x:250,y:205},to:self?{x:250,y:205}:{x:493,y:205},fromGround:{x:242,y:305},toGround:self?{x:242,y:305}:{x:493,y:278},width:720,clipBottom:355,scale:1,duration:1100,hitAt:310,arriveAt:310,light:false,reduced:false},times=[];for(let i=0;i<240;i++){const t=performance.now();c.clearRect(0,0,720,420);InkSkillFxV2854.draw(c,j,i%30*30);times.push(performance.now()-t)}times.sort((a,b)=>a-b);draw[name]={samples:240,median:times[120],p95:times[228]};}
 const times=[];await new Promise(resolve=>{let last;function step(t){if(last)times.push(t-last);last=t;if(times.length<60)requestAnimationFrame(step);else resolve()}requestAnimationFrame(step)});times.sort((a,b)=>a-b);return {draw,raf:{median:times[30],p95:times[57]},viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,browser:navigator.userAgent};});
}
