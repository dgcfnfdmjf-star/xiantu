const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
// Synthetic fixture only; never a real player save.
const OLD_V1=fs.readFileSync(path.join(__dirname,'../fixtures/synthetic-save-v1.json'),'utf8');
const DIALOG='#xtDialogV2868114';
// Save dialogs are the in-game modal; any native dialog is a regression and is recorded for the assertion in afterEach.
async function boot(page,name='存档转移测试'){
 const natives=[];page.natives=natives;
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{natives.push(d.type()+':'+d.message());d.dismiss();});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill(name);await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();showStory('存档回归检查',[]);player.gold=501;saveGame();player.gold=502;saveGame();
  // Count real replacements; internal calls resolve through the global binding.
  const orig=window.replaceSaveV2870;window.__replaced=0;window.replaceSaveV2870=(...a)=>{window.__replaced++;return orig(...a);};});
}
test.afterEach(async({page})=>{expect(page.natives||[]).toEqual([]);});
// Reads the open in-game dialog, then answers it ('ok' | 'cancel' | 'esc').
async function answer(page,how){
 const box=page.locator(DIALOG+' [role]');await expect(box).toBeVisible();
 const d={role:await box.getAttribute('role'),msg:await page.locator(DIALOG+'Msg').textContent()},el=await page.locator(DIALOG).elementHandle();
 if(how==='esc')await page.keyboard.press('Escape');else await page.locator(`${DIALOG} [data-xt-dialog="${how}"]`).click();
 await el.waitForElementState('hidden');return d; // A follow-up alert may replace it immediately.
}
// Captures the exported file text from the download anchor instead of the filesystem.
const captureExport=()=>page=>page.evaluate(async()=>{
 let text=null;const orig=URL.createObjectURL;URL.createObjectURL=b=>{window.__blob=b;return orig.call(URL,b);};
 try{await exportSaveV2768();text=await window.__blob.text();}finally{URL.createObjectURL=orig;}
 return text;
});
const importText=(page,text)=>page.evaluate(t=>importSaveV2768(new File([t],'in.json',{type:'application/json'})),text);
const snapshot=page=>page.evaluate(()=>({main:localStorage.getItem('xiantu_save'),backup:localStorage.getItem('xiantu_save_backup'),before:localStorage.getItem('xiantu_save_before_replace_v2870'),gold:player.gold,replaced:window.__replaced}));

test('repeated lifecycle saves and reloading preserve the previous distinct recovery point',async({page})=>{
 await boot(page);
 await page.evaluate(()=>{player.gold=404;saveGame();player.gold=505;saveGame();});
 const saved=await snapshot(page);
 expect(JSON.parse(saved.main).player.gold).toBe(505);
 expect(JSON.parse(saved.backup).player.gold).toBe(404);
 await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,value:true});
  try{document.dispatchEvent(new Event('visibilitychange'));}finally{delete document.hidden;}
  window.dispatchEvent(new Event('pagehide'));
  window.dispatchEvent(new Event('beforeunload'));
 });
 expect(await snapshot(page)).toEqual(saved);
 await page.reload();
 const slots=()=>page.evaluate(()=>[localStorage.getItem('xiantu_save'),localStorage.getItem('xiantu_save_backup')]);
 expect(await slots()).toEqual([saved.main,saved.backup]);
 await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.evaluate(()=>{loadAndStart();saveGame();});
 const [resumed,backup]=await slots();
 expect(JSON.parse(resumed).player.gold).toBe(505);
 expect(backup).toBe(saved.backup);
 await page.evaluate(()=>{achievementProgress.monstersKilled++;saveGame();autoSave();});
 const [advanced,prior]=await slots();
 expect(prior).toBe(resumed);
 expect(JSON.parse(advanced).achievements.progress.monstersKilled).toBe(JSON.parse(resumed).achievements.progress.monstersKilled+1);
});

test('downloaded save restores in a separate browser context and preserves the previous character',async({page,browser},testInfo)=>{
 await boot(page,'云游测试');
 await page.evaluate(()=>showSaveManagerV2768());
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'导出当前存档',exact:true}).click();
 const file=testInfo.outputPath('临时角色.json');
 await (await download).saveAs(file);
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 expect(data.exportDigestV2906).toMatch(/^[0-9a-f]{16}$/);
 expect(data.player).toMatchObject({name:'云游测试',gold:502});

 const context=await browser.newContext({baseURL:new URL(page.url()).origin});
 try{
  const target=await context.newPage();
  await boot(target,'留守测试');
  await target.evaluate(()=>{player.gold=9;saveGame();showSaveManagerV2768();});
  const before=await snapshot(target);
  const input=target.locator('#saveManagerV2768 input[type=file]');
  const corrupt={...data,player:{...data.player,gold:999}};
  await input.setInputFiles({name:'坏档.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(corrupt))});
  expect((await answer(target,'ok')).msg).toContain('校验码不符');
  expect(await snapshot(target)).toEqual(before);
  await input.setInputFiles(file);
  expect(await answer(target,'ok')).toMatchObject({role:'dialog',msg:expect.stringContaining('导入将替换')});
  const restored=await snapshot(target);
  expect(restored.gold).toBe(502);expect(restored.replaced).toBe(1);
  const {exportDigestV2906,...payload}=data;
  expect(JSON.parse(restored.main)).toEqual(payload);
  expect(restored.backup).toBe(before.main);
  expect(JSON.parse(restored.before).player).toMatchObject({name:'留守测试',gold:9});
  await target.evaluate(()=>showSaveManagerV2768());
  await target.getByRole('button',{name:'恢复替换前记录',exact:true}).click();
  await answer(target,'ok');
  expect(await target.evaluate(()=>[player.name,player.gold])).toEqual(['留守测试',9]);
  expect(await page.evaluate(()=>[player.name,player.gold])).toEqual(['云游测试',502]);
  expect(target.natives).toEqual([]);
 }finally{await context.close();}
});
test('corrupt, truncated and tampered files are rejected without touching saves',async({page})=>{
 await boot(page);
 const exported=await captureExport()(page);const before=await snapshot(page);
 const tampered=JSON.parse(exported);tampered.player.gold=999999;const seen=[];
 for(const bad of [exported.slice(0,exported.length/2),'not json',JSON.stringify(tampered),'{"version":99,"player":{"level":1,"inventory":[],"gold":1,"exp":0,"hp":1,"mp":1}}']){
  await importText(page,bad);seen.push(await answer(page,'ok'));expect(await snapshot(page)).toEqual(before);
 }
 expect(seen.every(d=>d.role==='alertdialog'&&d.msg.startsWith('导入未完成'))).toBe(true);
 expect(seen.some(d=>d.msg.includes('校验码不符'))).toBe(true);
});
test('cancelling or escaping the confirmation leaves every save slot unchanged',async({page})=>{
 await boot(page);
 const before=await snapshot(page);const exported=JSON.parse(await captureExport()(page));
 delete exported.exportDigestV2906;exported.player.gold=777;
 for(const how of ['cancel','esc']){
  await importText(page,JSON.stringify(exported));
  expect((await answer(page,how)).msg).toContain('导入将替换');expect(await snapshot(page)).toEqual(before);
 }
 await page.evaluate(()=>restoreBackupV2768());expect((await answer(page,'cancel')).msg).toContain('上一次有效保存');expect(await snapshot(page)).toEqual(before);
});
test('confirmed import archives the current record and rolls the backup before overwrite',async({page})=>{
 await boot(page);
 const before=await snapshot(page);
 await importText(page,OLD_V1);await answer(page,'ok');
 const after=await snapshot(page);
 expect(JSON.parse(after.before).player.gold).toBe(502);expect(after.backup).toBe(before.main);
 expect(JSON.parse(after.main).player.name).toBe('合成旧档');expect(after.replaced).toBe(1);
});
test('double confirm and reopening while open replace the save exactly once',async({page})=>{
 await boot(page);
 await importText(page,OLD_V1);
 // A second import and a backup restore while the confirmation is open do not open another dialog.
 await importText(page,OLD_V1);await page.evaluate(()=>restoreBackupV2768());
 await expect(page.locator(DIALOG)).toHaveCount(1);await expect(page.locator(DIALOG+'Msg')).toContainText('导入将替换');
 await page.evaluate(sel=>{const b=document.querySelector(sel+' [data-xt-dialog="ok"]');b.click();b.click();b.dispatchEvent(new MouseEvent('click'));},DIALOG);
 await expect(page.locator(DIALOG)).toHaveCount(0);
 const s=await snapshot(page);expect(s.replaced).toBe(1);expect(JSON.parse(s.main).player.name).toBe('合成旧档');expect(JSON.parse(s.before).player.gold).toBe(502);
 // The archive slot is not overwritten by a phantom second replace.
 await page.evaluate(()=>restoreBeforeReplaceV2870());expect((await answer(page,'ok')).msg).toContain('互换');
 const t=await snapshot(page);expect(t.replaced).toBe(2);expect(t.gold).toBe(502);expect(JSON.parse(t.before).player.name).toBe('合成旧档');
});
test('stale confirmations fail closed: combat, changed backup or changed actor leave saves untouched',async({page})=>{
 await boot(page);
 await importText(page,OLD_V1);await page.evaluate(()=>{gameState='combat';});const before=await snapshot(page);
 await answer(page,'ok');expect((await answer(page,'ok')).msg).toContain('确认期间角色或战斗状态已变化');
 expect(await snapshot(page)).toEqual(before);
 await page.evaluate(()=>{gameState='exploring';});
 await page.evaluate(()=>restoreBackupV2768());
 await page.evaluate(()=>{player.gold=611;saveGame();}); // Autosave rolls the backup while the dialog is open.
 const rolled=await snapshot(page);
 await answer(page,'ok');expect((await answer(page,'ok')).msg).toContain('备用档已更新');expect(await snapshot(page)).toEqual(rolled);
 await page.evaluate(()=>restoreBackupV2768());await page.evaluate(()=>{player=createDefaultPlayer();});
 const swapped=await snapshot(page);await answer(page,'ok');await answer(page,'ok');expect(await snapshot(page)).toEqual(swapped);
 expect(swapped.replaced).toBe(0);
});
test('old-version synthetic save migrates on import and persists at the current version',async({page})=>{
 await boot(page);
 await importText(page,OLD_V1);await answer(page,'ok');
 const r=await page.evaluate(()=>({name:player.name,gold:player.gold,level:player.level,inv:Array.isArray(player.inventory),
  equipInv:Array.isArray(player.equipmentInventory),saved:(saveGame(),JSON.parse(localStorage.getItem('xiantu_save')).version),current:SAVE_VERSION}));
 expect(r).toMatchObject({name:'合成旧档',gold:345,level:1,inv:true,equipInv:true});expect(r.saved).toBe(r.current);
});
