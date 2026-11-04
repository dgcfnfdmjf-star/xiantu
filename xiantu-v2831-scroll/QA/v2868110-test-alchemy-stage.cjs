'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const f=require('./v2858-dom-fixture.cjs')(root),files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]);
const effects=[];let actualResult;
f.c.console.log=()=>{};f.c.console.warn=()=>{};
for(const file of files){
 if(file===files.at(-1)){actualResult=f.c.alchemyResultV2868110;f.c.alchemyResultV2868110=(...args)=>effects.push({args,persisted:f.storage.get('xiantu_save')});}
 f.load(file);
}
const save=f.c.saveGame,setItem=f.c.localStorage.setItem;
function fresh(){
 f.c.saveGame=save;f.c.localStorage.setItem=setItem;
 f.run("resetRuntimeState();player=createDefaultPlayer();initAchievements();gameState='alchemy';player.materials={'灵草':100,'仙果':100};player.inventory=[];player.alchemyCount=0;player.alchemyLevel=1;player.alchemyExp=0;Math.random=()=>.1;document.getElementById('alchemyPanel').classList.remove('hidden');saveGame();");
 effects.length=0;
}
for(const mode of ['false','throw','quota']){
 fresh();const before=f.run('JSON.stringify(player)'),disk=f.storage.get('xiantu_save');
 if(mode==='quota')f.c.localStorage.setItem=()=>{throw new Error('QuotaExceededError');};
 else f.c.saveGame=()=>{if(mode==='throw')throw new Error('save failed');return false;};
 assert.equal(f.run("craftPill('养元丹',5)"),false);
 assert.equal(f.run('JSON.stringify(player)'),before);assert.equal(f.storage.get('xiantu_save'),disk);assert.equal(effects.length,0,'failed save must not present alchemy success');
}
fresh();const result=f.run("craftPill('养元丹',5)");assert.equal(result.success,5);assert.equal(effects.length,1);assert.equal(effects[0].args[2],5);assert.equal(effects[0].args[3],5);assert.equal(JSON.parse(effects[0].persisted).player.inventory.filter(x=>x==='养元丹').length,5,'effect must follow durable save');
fresh();f.run('Math.random=()=>.99');assert.equal(f.run("craftPill('养元丹',5).success"),0);assert.equal(effects.length,1);assert.equal(effects[0].args[3],0);
fresh();f.run("player.materials={'灵草':16,'仙果':6}");assert.equal(f.run("craftPill('养元丹',10).attempted"),2);assert.equal(effects[0].args[2],2);
fresh();f.run("player.materials={}");assert.equal(f.run("craftPill('养元丹',5)"),false);assert.equal(effects.length,0);
// The real presentation callback rejects stale owners and hidden/non-alchemy panels.
f.c.actualAlchemyResult=actualResult;f.run("globalThis.oldAlchemyOwner=player;globalThis.presentedAlchemy=[];ALCHEMY_STAGE_V2868110.instance={play:r=>presentedAlchemy.push(r),dispose:()=>{}};");
f.run("actualAlchemyResult(player,'养元丹',5,3)");assert.equal(f.run('presentedAlchemy.length'),1);assert.match(f.run("document.getElementById('alchemyResultV2868110').textContent"),/成丹 3 枚 · 失败 2 炉/);
f.run("player=createDefaultPlayer();actualAlchemyResult(oldAlchemyOwner,'养元丹',5,5)");assert.equal(f.run('presentedAlchemy.length'),1);
f.run("document.getElementById('alchemyPanel').classList.add('hidden');actualAlchemyResult(player,'养元丹',5,5)");assert.equal(f.run('presentedAlchemy.length'),1);
f.run("document.getElementById('alchemyPanel').classList.remove('hidden');gameState='combat';actualAlchemyResult(player,'养元丹',5,5)");assert.equal(f.run('presentedAlchemy.length'),1);
f.run('alchemyStageStopV2868110()');assert.equal(f.run('ALCHEMY_STAGE_V2868110.instance'),null);assert.equal(f.run('ALCHEMY_STAGE_V2868110.last'),null);
f.run("gameState='combat';localStorage.setItem=()=>{throw Error('blocked')};toggleAlchemyFxV2868110()");assert.equal(f.run('alchemyStageAllowedV2868110()'),false);f.run('toggleAlchemyFxV2868110()');assert.equal(f.run('alchemyStageAllowedV2868110()'),true);
console.log('PASS alchemy visuals after durable commit; failed/quota/throw rollback; partial batches; failure outcomes; stale owner and panel guards');
