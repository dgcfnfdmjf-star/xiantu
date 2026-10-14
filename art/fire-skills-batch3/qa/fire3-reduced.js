async page=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:8770/xiantu-v2831-scroll/skill-fx-v2855.html');
 await page.evaluate(()=>{for(const n of ['天火焚世','赤焰龙息','燎原火域'])InkSkillFxV2854.fireBatch3.prepare(n);window.fireDraws=[];const base=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...args){if(im?.src?.includes('fire-skills-batch3'))fireDraws.push(im.src);return base.call(this,im,...args)}});
 await page.waitForFunction(()=>['天火焚世','赤焰龙息','燎原火域'].every(n=>InkSkillFxV2854.fireBatch3.ready(n)));
 const rows=[];
 for(const name of ['天火焚世','赤焰龙息','燎原火域']){
 await page.evaluate(name=>{InkSkillFxV2854.clear();fireDraws.length=0;InkSkillFxV2854.play(name,'fire')},name);await page.waitForTimeout(160);await page.evaluate(()=>InkSkillFxV2854.hit('enemy'));
 rows.push(await page.evaluate(name=>({name,files:[...new Set(fireDraws.map(s=>s.split('/').pop()))],raf:InkSkillFxV2854.inspect().raf}),name));
 }
 if(!rows[0].files.includes('heaven_meteor_impact.png')||!rows[1].files.includes('dragon_breath_impact.png')||!rows[2].files.includes('wildfire_domain_body.png')||rows.some(r=>r.raf))throw Error(JSON.stringify(rows));
 await page.evaluate(()=>InkSkillFxV2854.clear());const clean=await page.evaluate(()=>InkSkillFxV2854.inspect());await page.emulateMedia({reducedMotion:'no-preference'});return {rows,clean};
}
