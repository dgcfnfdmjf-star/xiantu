'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
function boot(location){
 const f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
 if(location)Object.assign(f.c.location,location);
 for(const n of files)f.load(n);return f;
}

const f=boot();
f.run('startGame();closeWorldOverlay()');f.timers.clear();
const tasks=f.run(`Object.values(ALL_TASKS).map(t=>({id:t.id,items:(t.rewards&&t.rewards.items)||[]}))`);
a(tasks.length>=30,'task table loaded');
let checked=0;
for(const t of tasks){
 for(const item of t.items){
  const kind=f.run(`taskRewardKindV286838(${JSON.stringify(item)})`);
  a.notEqual(kind,null,`${t.id} reward ${item} must exist in ITEMS, EQUIPMENT_DB, MATERIALS or LONGEVITY_PILLS`);
  a.equal(f.run(`OLD_GEAR_ALIASES_V2792[${JSON.stringify(item)}]||null`),null,`${t.id} reward ${item} must use the canonical gear name`);
  checked++;
 }
}
a(checked>=17,'all reward items enumerated');

for(const t of tasks.filter(t=>t.items.length)){
 const got=f.run(`(()=>{
  resetRuntimeState();player=createDefaultPlayer();gameState='exploring';ensureTaskState();
  player.inventory=[];player.equipmentInventory=[];player.materials={};
  const task=getTaskData(${JSON.stringify(t.id)});
  player.tasks.active[task.id]={id:task.id,currentStep:task.steps.length,completed:false,failed:false,progress:{}};
  completeTask(task.id);
  return {inv:[...player.inventory],eq:[...player.equipmentInventory],mat:{...player.materials},done:player.tasks.completed.includes(task.id)};
 })()`);
 f.timers.clear();
 a.equal(got.done,true,`${t.id} completes`);
 for(const item of t.items){
  const kind=f.run(`taskRewardKindV286838(${JSON.stringify(item)})`);
  if(kind==='equipment')a(got.eq.includes(item),`${t.id}: ${item} goes to the equipment bag`);
  else if(kind==='material')a(Number(got.mat[item])>=1,`${t.id}: ${item} goes to materials`);
  else a(got.inv.includes(item),`${t.id}: ${item} goes to the inventory`);
 }
}

const migrated=f.run(`(()=>{
 const p=createDefaultPlayer();p.inventory=['基础剑袍','新手药瓶','炼丹材料','天机洞察buff','小还丹'];p.equipmentInventory=[];p.materials={灵草:1};
 migrateLooseEquipmentToEquipmentInventory(p);
 return {inv:[...p.inventory],eq:[...p.equipmentInventory],herb:p.materials.灵草};
})()`);
a.equal(migrated.inv.join(','),'小还丹,悟道丹,小还丹');
a(migrated.eq.includes('素布道袍'));
a.equal(migrated.herb,2);
console.log(`PASS ${checked} task reward items resolve and land in the right bag; legacy placeholder names migrate`);

function start999(location){
 const g=boot(location);g.ids.get('playerName').value='999';g.run('startGame();closeWorldOverlay()');g.timers.clear();
 return g.run('({test:player.testAccount999===true,level:player.level,name:player.name})');
}
const prod=start999({hostname:'xiantu.example.com',protocol:'https:'});
a.equal(prod.test,false,'999 test preset stays off in production');a.equal(prod.name,'999');a.equal(prod.level,0);
const local=start999({hostname:'localhost',protocol:'http:'});
a.equal(local.test,true,'999 test preset is available on localhost');
console.log('PASS 999 test preset only on local hosts');
