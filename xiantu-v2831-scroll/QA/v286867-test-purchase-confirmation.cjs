'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.c.document.body.classList[Symbol.iterator]=()=>f.c.document.body._classes.values();
const run=s=>f.run(s);run('startGame();closeWorldOverlay()');
let prompts=[],saves=0;
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.level=8;player.maxRealm=8;player.gold=10000;player.sectContribution=1000;player.sectRank='长老';gameState='exploring';currentChoices=[];normalizeHomeV2812(player);player.longevity=normalizeLongevity(player.longevity);updateStats=()=>{};updateWorldHUD=()=>{};updatePetPanel=()=>{};");f.timers.clear();prompts=[];saves=0;f.c.autoSave=()=>{saves++};f.c.confirm=m=>{prompts.push(m);return false};}
const snapshot=()=>run('JSON.stringify(player)');
const cases=[
 "buyGeneralV2801(GENERAL_SHOP_V2801.findIndex(x=>x.name==='灵兽绳'),1)",
 "buyGeneralV2801(GENERAL_SHOP_V2801.findIndex(x=>x.name==='灵兽绳'),5)",
 "buyGeneralV2801(GENERAL_SHOP_V2801.findIndex(x=>x.category==='gear'),1)",
 "buyLongevityPill('养元丹')",
 "buyBreakthroughPillV28683(Object.keys(BREAKTHROUGH_PILLS_V28683)[0])",
 "buyPetGrowthBatchV286845('灵果',10)",
 "buySectItem('灵草',-1)",
 "buySectSkill('雷法',-1)",
 "buyFurnitureV2812(furnitureCatalogV2812()[0].name)"
];
for(const call of cases){fresh();const before=snapshot();run(call);a.equal(prompts.length,1,call);a.equal(snapshot(),before,call+' cancellation preserves player');a.equal(saves,0,call+' cancellation does not save');}
for(const [action,item,cost] of [['buy','大还丹',120],['buyMaterial','灵草',10],['buyArtifactMaterial','星辰砂',300],['buyPetMaterial','仙兽丹',350],['buy_set_item','铁剑',100]]){
 fresh();run(`currentChoices=[${JSON.stringify({action,item,cost})}]`);const before=snapshot();run('handleChoice(0)');a.equal(prompts.length,1,action);a.equal(snapshot(),before);a.equal(saves,0);
 f.c.confirm=m=>{prompts.push(m);return true};run('handleChoice(0)');a.equal(prompts.length,2,action+' one prompt per click');a.equal(run('player.gold'),10000-cost);
 const bag=action==='buyMaterial'||action==='buyArtifactMaterial'?'materials':action==='buyPetMaterial'?'petMaterials':'inventory';
 a.equal(run(`Array.isArray(player.${bag})?player.${bag}.filter(x=>x===${JSON.stringify(item)}).length:player.${bag}[${JSON.stringify(item)}]`),1);
}
fresh();f.c.confirm=m=>{prompts.push(m);return true};run(cases[1]);a.equal(prompts.length,1);a.match(prompts[0],/灵兽绳 ×5/);a.match(prompts[0],/250 灵石/);a.match(prompts[0],/9750 灵石/);a.equal(run('player.gold'),9750);a.equal(run("player.inventory.filter(n=>n==='灵兽绳').length"),5);
fresh();f.c.confirm=m=>{prompts.push(m);return true};run(cases[5]);a.equal(prompts.length,1);a.equal(run('player.gold'),9200);a.equal(run("player.petMaterials['灵果']"),10);
fresh();f.c.confirm=m=>{prompts.push(m);return true};run(cases[6]);a.equal(run('player.sectContribution'),992);a.match(prompts[0],/8 宗门贡献/);a.equal(run("player.materials['灵草']"),1);
fresh();f.c.confirm=m=>{prompts.push(m);return true};run(cases[7]);a.equal(run('player.sectContribution'),980);a.equal(run("player.skills.filter(s=>s.name==='雷法').length"),1);
for(const change of ["player.gold=1","player=createDefaultPlayer()","gameState='combat'","player.breakthrough={isAnimating:true}","currentChoices=[]","document.getElementById('storyText').innerHTML='另一个页面'"]){
 fresh();f.c.confirm=()=>{run(change);return true};run(cases[1]);a.equal(run("player.inventory.filter(n=>n==='灵兽绳').length"),0,change);a.equal(saves,0);
}
fresh();f.c.confirm=m=>{prompts.push(m);run(cases[0]);return true};run(cases[1]);a.equal(prompts.length,1);a.equal(run('player.gold'),9750);a.equal(run("player.inventory.filter(n=>n==='灵兽绳').length"),5);
for(const confirm of [undefined,()=>{throw Error('dialog unavailable')}]){fresh();f.c.confirm=confirm;const before=snapshot();run(cases[1]);a.equal(snapshot(),before);a.equal(saves,0);}
for(const setup of ["player.gold=49","gameState='combat'","gameState='combat-ending'","player.breakthrough={isAnimating:true}"]){fresh();run(setup);const before=snapshot();run(cases[0]);a.equal(prompts.length,0);a.equal(snapshot(),before);}
fresh();for(const qty of [0,-1,1.5,6])run(`buyGeneralV2801(0,${qty})`);a.equal(prompts.length,0);
a.equal(f.errors.length,0,JSON.stringify(f.errors));console.log('PASS purchase confirmation: cancellation, single/batch settlement, canonical contribution prices, stale state, reentrancy and unavailable dialogs');
