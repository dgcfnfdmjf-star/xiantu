'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),run=s=>f.run(s);
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
f.c.console.log=()=>{};
function fresh(){run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.sect='凌霄宗';player.level=4;player.gold=5000;player.sectContribution=2000;player.sectTotalContribution=1200;player.worldTime.totalDays=100;player.sectPromotion={sect:'凌霄宗',inherited:true,tasksCompleted:5};player.sectData.prosperity=20;discipleRosterV2815().members=[]");f.timers.clear();f.c.confirm=()=>true;}
function admin(kind){run('showSectAdminV2873()');return run(`executeSectAdminV2873('${kind}','',null,sectAdminViewV2873.token)`);}
fresh();run("player.sectData.prosperity=0;showSectMasterV2872();executeSectMasterV2872('repair',sectMasterViewV2872.token)");a.equal(run('player.sectData.prosperity'),5,'repair must add5 to zero, not treat zero as20');
fresh();run("player.sectPromotion.inherited=false;player.sectPathV2880={sect:'凌霄宗',stage:4,virtue:'ren',roll:.1,defense:'fight',legacy:'fallen'};showSectPathV2880()");const html=f.ids.get('storyText').innerHTML;a(html.includes('岁入1021'),'doctrine preview must use post-inheritance prosperity17');
run("executeSectPathV2880('doctrine','dan',sectPathViewV2880.token)");a.equal(run('sectAdminQuoteV2873(sectAdminReadV2873()).gold'),1021);
fresh();run('showSectAdminV2873()');f.c.confirm=()=>{run("player.sectPathV2880={sect:'凌霄宗',doctrine:'jian'}");return true;};a.equal(run("executeSectAdminV2873('start','',null,sectAdminViewV2873.token)"),false,'quote changed during confirmation must not commit');
console.log('PASS zero-prosperity repair, post-inheritance preview and changed-doctrine confirmation guard');
// Forecast and committed result agree at exact affordability and prosperity boundaries.
for(const [gold,income,upkeep,pros] of [[50,100,120,20],[20,100,120,20],[19,100,120,20],[0,10,100,0],[50,100,0,100],[50,100,0,150]]){
 fresh();run(`player.gold=${gold};player.sectData.prosperity=${pros};player.sectAdminV2873={sect:player.sect,highDay:100,quarter:{due:100,gold:${income},upkeep:${upkeep},prosperity:1,economy:2,members:0,posts:0}};showSectAdminV2873()`);
 const before=run('JSON.stringify(player)'),preview=JSON.parse(run('JSON.stringify(sectSettlementV2881(sectAdminReadV2873()))'));
 run('showSectAdminV2873()');a.equal(run('JSON.stringify(player)'),before,'preview is read-only');
 let confirmation='';f.c.confirm=message=>{confirmation=message;return true;};a.equal(admin('claim'),true);
 a(confirmation.includes(`（${gold}→${preview.goldAfter}）`));a.equal(run('player.gold'),preview.goldAfter);a.equal(run('player.sectData.prosperity'),preview.prosAfter);a.equal(run('player.sectAdminV2873.ledger.net'),preview.net);a.equal(run('player.sectAdminV2873.ledger.arrears'),preview.arrears);
 a.equal(preview.arrears,gold+income<upkeep);a.equal(preview.shortfall,Math.max(0,upkeep-income-gold));a.equal(admin('claim'),false);
 run('player=normalizePlayer(loadGame().player)');a.equal(run('player.sectAdminV2873.ledger.net'),preview.net);
}
// Cancellation and full-save rollback preserve the quote, balance and one-time claim.
fresh();admin('start');run('player.worldTime.totalDays=130;showSectAdminV2873()');const before=run('JSON.stringify(player)');f.c.confirm=()=>false;a.equal(admin('claim'),false);a.equal(run('JSON.stringify(player)'),before);
f.c.confirm=()=>true;run('globalThis.oldSet=localStorage.setItem;localStorage.setItem=()=>{throw Error("quota")}');a.equal(admin('claim'),false);run('localStorage.setItem=oldSet');a.equal(run('JSON.stringify(player)'),before);a.equal(admin('claim'),true);
// Every type of new doctrine previews the actual inherited prosperity, including the lower bound.
for(const prosperity of [0,2,20,150])for(const doctrine of ['jian','dan','zhen']){
 fresh();run(`player.sectData.prosperity=${prosperity};player.sectPromotion.inherited=false;player.sectPathV2880={sect:player.sect,stage:4,virtue:'ren',roll:.1,defense:'fight',legacy:'fallen'};showSectPathV2880()`);
 const q=JSON.parse(run(`JSON.stringify(sectAdminQuoteV2873(sectAdminReadV2873(),{...sectPathReadV2880(),doctrine:'${doctrine}'},Math.max(0,sectProsperityReadV2881()-3)))`));
 a(f.ids.get('storyText').innerHTML.includes(`繁荣度${Math.max(0,prosperity-3)}`));a.equal(run(`executeSectPathV2880('doctrine','${doctrine}',sectPathViewV2880.token)`),true);
 a.equal(run('sectAdminQuoteV2873(sectAdminReadV2873()).gold'),q.gold);a.equal(run('sectAdminQuoteV2873(sectAdminReadV2873()).upkeep'),q.upkeep);
 run('showSectPathV2880()');const chosen=f.ids.get('storyText').innerHTML;a(chosen.includes('查看季度收支'));a(chosen.includes('受印传承'));a(!chosen.includes('确认道统'));
}
a(f.errors.every(e=>e[0]==='保存失败:'),JSON.stringify(f.errors));
console.log('PASS settlement forecast/confirmation/persistence, affordability boundaries, caps, cancellation/quota rollback and all doctrine inheritance previews');
