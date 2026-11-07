const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
// Synthetic fixture only; never a real player save.
const OLD_V1=fs.readFileSync(path.join(__dirname,'../fixtures/synthetic-save-v1.json'),'utf8');
async function boot(page,dialogs){
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 page.on('dialog',d=>{dialogs.push(d.type()+':'+d.message());(d.type()==='confirm'?(dialogs.answer?d.accept():d.dismiss()):d.accept());});
 await page.goto('/game-v2762.html');await page.locator('#introSkipChoiceV2898').check();await page.locator('#xiantuSafeBootButton').click();
 await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/);
 await page.locator('#playerName').fill('存档转移测试');await page.getByRole('button',{name:'开始修仙',exact:true}).click();
 await page.evaluate(()=>{closeWorldOverlay();showStory('存档回归检查',[]);player.gold=501;saveGame();player.gold=502;saveGame();});
}
// Captures the exported file text from the download anchor instead of the filesystem.
const captureExport=()=>page=>page.evaluate(async()=>{
 let text=null;const orig=URL.createObjectURL;URL.createObjectURL=b=>{window.__blob=b;return orig.call(URL,b);};
 try{await exportSaveV2768();text=await window.__blob.text();}finally{URL.createObjectURL=orig;}
 return text;
});
const importText=(page,text)=>page.evaluate(t=>importSaveV2768(new File([t],'in.json',{type:'application/json'})),text);
const snapshot=page=>page.evaluate(()=>({main:localStorage.getItem('xiantu_save'),backup:localStorage.getItem('xiantu_save_backup'),before:localStorage.getItem('xiantu_save_before_replace_v2870'),gold:player.gold}));

test('export roundtrip carries a checksum and restores the same character',async({page})=>{
 const dialogs=[];dialogs.answer=true;await boot(page,dialogs);
 const exported=await captureExport()(page);const data=JSON.parse(exported);
 expect(data.exportDigestV2906).toMatch(/^[0-9a-f]{16}$/);expect(data.player.gold).toBe(502);
 await page.evaluate(()=>{player.gold=9;saveGame();});
 await importText(page,exported);
 const s=await snapshot(page);expect(s.gold).toBe(502);
 expect(JSON.parse(s.main).exportDigestV2906).toBeUndefined();expect(JSON.parse(s.before).player.gold).toBe(9);
});
test('corrupt, truncated and tampered files are rejected without touching saves',async({page})=>{
 const dialogs=[];dialogs.answer=true;await boot(page,dialogs);
 const exported=await captureExport()(page);const before=await snapshot(page);
 const tampered=JSON.parse(exported);tampered.player.gold=999999;
 for(const bad of [exported.slice(0,exported.length/2),'not json',JSON.stringify(tampered),'{"version":99,"player":{"level":1,"inventory":[],"gold":1,"exp":0,"hp":1,"mp":1}}']){
  await importText(page,bad);expect(await snapshot(page)).toEqual(before);
 }
 expect(dialogs.filter(d=>d.startsWith('alert:导入未完成')).length).toBe(4);
 expect(dialogs.some(d=>d.includes('校验码不符'))).toBe(true);expect(dialogs.some(d=>d.startsWith('confirm:'))).toBe(false);
});
test('cancelling the confirmation leaves every save slot unchanged',async({page})=>{
 const dialogs=[];dialogs.answer=false;await boot(page,dialogs);
 const before=await snapshot(page);const exported=JSON.parse(await captureExport()(page));
 delete exported.exportDigestV2906;exported.player.gold=777;
 await importText(page,JSON.stringify(exported));
 expect(dialogs.some(d=>d.startsWith('confirm:导入将替换'))).toBe(true);expect(await snapshot(page)).toEqual(before);
});
test('confirmed import archives the current record and rolls the backup before overwrite',async({page})=>{
 const dialogs=[];dialogs.answer=true;await boot(page,dialogs);
 const before=await snapshot(page);
 await importText(page,OLD_V1);
 const after=await snapshot(page);
 expect(JSON.parse(after.before).player.gold).toBe(502);expect(after.backup).toBe(before.main);
 expect(JSON.parse(after.main).player.name).toBe('合成旧档');
});
test('old-version synthetic save migrates on import and persists at the current version',async({page})=>{
 const dialogs=[];dialogs.answer=true;await boot(page,dialogs);
 await importText(page,OLD_V1);
 const r=await page.evaluate(()=>({name:player.name,gold:player.gold,level:player.level,inv:Array.isArray(player.inventory),
  equipInv:Array.isArray(player.equipmentInventory),saved:(saveGame(),JSON.parse(localStorage.getItem('xiantu_save')).version),current:SAVE_VERSION}));
 expect(r).toMatchObject({name:'合成旧档',gold:345,level:1,inv:true,equipInv:true});expect(r.saved).toBe(r.current);
});
