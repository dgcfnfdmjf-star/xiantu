async page=>{
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8767/art/fire-skills-batch3/preview/index.html');
 const checks=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.reload();await page.waitForFunction(()=>window.fireBatch3Preview?.ready);
 const verify=(v,msg)=>{if(!v)throw Error(msg);checks.push(msg)};
 for(const key of ['heaven_meteor','dragon_breath','wildfire_domain']){
  await page.locator('#effect').selectOption(key);
  verify(await page.evaluate(()=>fireBatch3Preview.ready),'ready '+key);
  for(const t of [120,240,330,420,700,1500]){
   await page.evaluate(t=>fireBatch3Preview.seek(t),t);
   await page.locator('#viewport').screenshot({path:'fire-skills-batch3/'+key+'-'+t+'.png'});
  }
  await page.locator('#background').selectOption('dark');await page.evaluate(()=>fireBatch3Preview.seek(350));await page.locator('#viewport').screenshot({path:'fire-skills-batch3/'+key+'-dark.png'});
  await page.locator('#background').selectOption('light');await page.locator('#viewport').screenshot({path:'fire-skills-batch3/'+key+'-light.png'});
  await page.getByRole('button',{name:'恢复默认',exact:true}).click();
  await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(100);await page.getByRole('button',{name:'暂停',exact:true}).click();
  const frozen=await page.evaluate(()=>fireBatch3Preview.age);await page.waitForTimeout(80);verify(await page.evaluate(()=>fireBatch3Preview.age)===frozen,'pause '+key);
  await page.getByRole('button',{name:'下一帧',exact:true}).click();verify(await page.evaluate(()=>fireBatch3Preview.age)>frozen,'step '+key);
  for(const quality of ['light','reduced']){await page.locator('#quality').selectOption(quality);verify((await page.evaluate(()=>fireBatch3Preview.seek(390))).length>0,'quality '+quality+' '+key);}
  await page.locator('#hit').uncheck();verify((await page.evaluate(()=>fireBatch3Preview.seek(650))).length===0,'no hit '+key);
  await page.getByRole('button',{name:'恢复默认',exact:true}).click();
 }
 await page.locator('#effect').selectOption('wildfire_domain');verify((await page.evaluate(()=>fireBatch3Preview.seek(1500))).some(p=>p.layer==='status'),'live domain');
 for(const s of ['expired','detonated','ordinary','lotus','dead','changed']){await page.locator('#burnState').selectOption(s);verify((await page.evaluate(()=>fireBatch3Preview.seek(1500))).length===0,'domain clear '+s);}
 await page.getByRole('button',{name:'恢复默认',exact:true}).click();await page.locator('#scale').fill('1.2');await page.locator('#scale').press('Tab');await page.locator('#offsetX').fill('10');await page.locator('#offsetX').press('Tab');verify(await page.evaluate(()=>fireBatch3Preview.options().scale===1.2&&fireBatch3Preview.options().offsetX===10),'tuning controls');
 await page.locator('#effect').selectOption('dragon_breath');verify(await page.evaluate(()=>fireBatch3Preview.options().scale===1&&fireBatch3Preview.options().offsetX===0),'switch resets overrides');
 for(const size of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);await page.evaluate(()=>fireBatch3Preview.seek(300));verify(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+size.width);await page.screenshot({path:'fire-skills-batch3/mobile-'+size.width+'.png',fullPage:true});}
 await page.locator('#fps').selectOption('60');await page.evaluate(()=>fireBatch3Preview.seek(0));await page.getByRole('button',{name:'下一帧',exact:true}).click();verify(Math.abs(await page.evaluate(()=>fireBatch3Preview.age)-1000/60)<.01,'60fps step');
 await page.locator('#speed').selectOption('.25');verify(await page.locator('#speed').inputValue()==='.25','slow playback control');
 await page.locator('#arrival').selectOption('520');verify(!(await page.evaluate(()=>fireBatch3Preview.seek(500))).some(p=>p.layer==='impact'),'delayed hit gating');verify((await page.evaluate(()=>fireBatch3Preview.seek(550))).some(p=>p.layer==='impact'),'delayed hit contact');
 await page.getByRole('button',{name:'恢复默认',exact:true}).click();await page.locator('#loop').uncheck();await page.evaluate(()=>fireBatch3Preview.seek(2390));await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(150);verify(await page.evaluate(()=>!fireBatch3Preview.playing&&fireBatch3Preview.age===2400),'one shot stops');
 await page.locator('#loop').check();await page.evaluate(()=>fireBatch3Preview.seek(2390));await page.getByRole('button',{name:'播放',exact:true}).click();await page.waitForTimeout(150);verify(await page.evaluate(()=>fireBatch3Preview.playing&&fireBatch3Preview.age<1000),'loop restarts');await page.getByRole('button',{name:'暂停',exact:true}).click();
 await page.getByRole('button',{name:'重播',exact:true}).click();verify(await page.evaluate(()=>fireBatch3Preview.playing&&fireBatch3Preview.age<500),'restart');await page.getByRole('button',{name:'暂停',exact:true}).click();
 verify(errors.length===0,'zero page errors');
 // An invalid atlas blocks only that effect. Other effects still load.
 await page.route('**/dragon_breath_body.png',r=>r.abort());await page.reload();await page.waitForFunction(()=>window.fireBatch3Preview?.ready);await page.locator('#effect').selectOption('dragon_breath');verify(await page.getByRole('button',{name:'播放',exact:true}).isDisabled(),'missing atlas blocks only dragon');await page.locator('#effect').selectOption('wildfire_domain');verify(await page.evaluate(()=>fireBatch3Preview.ready),'other effects remain usable');await page.unroute('**/dragon_breath_body.png');await page.reload();await page.waitForFunction(()=>window.fireBatch3Preview?.ready);
 return {passed:true,checks,errors,browser:await page.evaluate(()=>navigator.userAgent)};
}
