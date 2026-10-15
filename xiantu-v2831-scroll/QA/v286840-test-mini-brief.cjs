'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);f.c.console.log=()=>{};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.run('startGame();closeWorldOverlay()');f.timers.clear();const run=s=>f.run(s);
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();player.sect='凌霄宗';player.sectTotalContribution=600;player.level=4;player.gold=10000;gameState='exploring';player.buildingReadyDaysV2768={};player.worldTime.totalDays=10;player.sectData.miniRealmV2778=null");}
function enter(){run('enterMiniRealmV2778();globalThis.id=miniRunV2778().id;selectMiniRouteV2867(id,0)')}
function events(){for(let n=0;n<2;n++){a.equal(run(`chooseMiniEventV286840(id,${n},0)`),true);a.equal(run(`chooseMiniEventV286840(id,${n},1)`),false);const before=run('JSON.stringify(player)');run('miniClickAtV2778=0;chooseMiniRealmV2778("safe",2,id)');a.equal(run('JSON.stringify(player)'),before);a.equal(run(`chooseMiniBoonV286840(id,${n},miniRunV2778().weaveV286840.offers[${n}][0])`),true);a.equal(run(`chooseMiniBoonV286840(id,${n},miniRunV2778().weaveV286840.offers[${n}][1])`),false)}}
fresh();enter();a.equal(run('player.gold'),9970);a.equal(run('player.worldTime.totalDays'),11);a.equal(run('getBuildingWaitV2768("mini_secret")'),7);
const plan=run('JSON.stringify(miniRunV2778().weaveV286840)');run('player=normalizePlayer(loadGame().player);showMiniRealmV2778()');a.equal(run('JSON.stringify(miniRunV2778().weaveV286840)'),plan);events();const before=run('player.gold');run('finishMiniRealmV2778("safe")');a.equal(run('player.gold'),before+240);a.equal(run('miniRunV2778()'),null);run('finishMiniRealmV2778("safe")');a.equal(run('player.gold'),before+240);
// All four authored events resolve and survive reload; choices do not reset offers.
for(let e=0;e<4;e++)for(let choice=0;choice<2;choice++){
 fresh();enter();run(`miniRunV2778().weaveV286840.events[0]=${e}`);a.equal(run(`chooseMiniEventV286840(id,0,${choice})`),true);run('player=normalizePlayer(loadGame().player)');a.equal(run('miniRunV2778().step'),1);a.equal(run('miniRunV2778().weaveV286840.pending'),true);
}
// Every boon is scoped by actual battle, run id and stage. No permanent stat mutation.
for(let i=0;i<6;i++){
 fresh();enter();run(`globalThis.c=miniRunV2778();c.weaveV286840.offers[0]=[${i},${(i+1)%6},${(i+2)%6}];c.weaveV286840.boons=[${i}];c.step=3;globalThis.baseAtk=getAtk();globalThis.baseDef=getDef();globalThis.baseCrit=getCritDamage();currentEnemy={_miniRunV2778:c.id};gameState='combat'`);
 a.equal(run(`miniBoonV286840(MINI_BOONS_V286840[${i}].key)`),run(`MINI_BOONS_V286840[${i}].value`));
 if(i===0)a.equal(run('getAtk()'),run('Math.floor(baseAtk*1.15)'));
 if(i===1)a.equal(run('getDef()'),run('Math.floor(baseDef*1.2)'));
 if(i===2)a.equal(run('getCritDamage()'),run('baseCrit+.3'));
 run('currentEnemy._miniRunV2778=999');a.equal(run(`miniBoonV286840(MINI_BOONS_V286840[${i}].key)`),0);
 run('currentEnemy._miniRunV2778=c.id;miniBattleResultV2778(currentEnemy,false)');a.equal(run('miniRunV2778()'),null);a.equal(run('getAtk()'),run('baseAtk'));
}
// Rollback entry fee + calendar, event, boon and claim when local storage rejects the write.
for(const phase of ['entry','event','boon','claim']){
 fresh();if(phase!=='entry')enter();if(phase==='boon')run('chooseMiniEventV286840(id,0,0)');if(phase==='claim')events();
 run('globalThis.before=JSON.stringify(player);globalThis.savedSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');
 run(({entry:'enterMiniRealmV2778()',event:'chooseMiniEventV286840(id,0,0)',boon:'chooseMiniBoonV286840(id,0,miniRunV2778().weaveV286840.offers[0][0])',claim:'finishMiniRealmV2778("safe")'})[phase]);
 run('localStorage.setItem=savedSet');a.equal(run('JSON.stringify(player)'),run('before'),phase);a.equal(run('miniSaveDeferredV286840'),false);
}
// Brief is read-only and respects the existing bounded/atomic trip payout.
fresh();run("player.expeditionV286821={wins:{wolf:0},active:{key:TRIP_ROUTES_V286821[0].key,started:Date.now()-9*3600000,level:0}};globalThis.expected=tripYieldV286821();globalThis.before=JSON.stringify(player)");
a.equal(run('expected.units'),48);a(run('returnBriefHtmlV286840(Date.now()-9*3600000).includes("480/480")'));a.equal(run('JSON.stringify(player)'),run('before'));
run('globalThis.gold=player.gold');a.equal(run('claimReturnTripV286840()'),true);a.equal(run('player.gold'),run('gold+expected.gold'));a.equal(run('claimReturnTripV286840()'),false);a.equal(run('tripStateV286821().active'),null);
fresh();run("player.expeditionV286821={wins:{},active:{key:TRIP_ROUTES_V286821[0].key,started:Date.now()+10000,level:0}}");a.equal(run('tripYieldV286821().units'),0);a.equal(run('claimReturnTripV286840()'),false);
console.log('PASS randomized encounters; saved choices; two boon rounds; battle scoping; old-route compatibility in existing suite; quota rollback; read-only brief; bounded one-time expedition claim');
