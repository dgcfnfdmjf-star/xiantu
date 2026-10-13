'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
f.run('startGame();closeWorldOverlay()');f.timers.clear();

const grades=f.run('GRADES_V2790.map(g=>({name:g.name,level:g.level,scale:g.scale,cost:g.cost,quality:g.quality}))');
a.equal(JSON.stringify(grades.slice(0,3).map(g=>[g.name,g.level,g.scale,g.cost])),JSON.stringify([['灵品',2,.4,600],['宝器',3,.7,2400],['仙器',7,1,9600]]),'existing grades unchanged');
a.equal(JSON.stringify(grades.slice(3).map(g=>[g.name,g.level])),JSON.stringify([['天器',10],['圣器',12],['道器',14]]));
for(let i=1;i<grades.length;i++){a(grades[i].level>grades[i-1].level);a(grades[i].cost===grades[i-1].cost*4);}

// Effective stat = stored stat x quality multiplier, the same value the runtime sums.
const eff=name=>f.run(`(()=>{const d=EQUIPMENT_DB[${JSON.stringify(name)}];const m=getQualityInfo(d.quality).multiplier;const o={};for(const [k,v] of Object.entries(d.stats))o[k]=Math.round(v*m*1000)/1000;return {stats:o,realm:d.realmRequired,mods:d.modsV2790||{}}})()`);
const wand=g=>eff(`万象玄霆·九霄玄霆杖·${g}`);
a.equal(wand('灵品').stats.atk,16);a.equal(wand('宝器').stats.atk,28);a.equal(wand('仙器').stats.atk,128);
const tian=wand('天器'),sheng=wand('圣器'),dao=wand('道器');
a(tian.stats.atk>128&&sheng.stats.atk>tian.stats.atk&&dao.stats.atk>sheng.stats.atk,'new-set weapon grows past 仙器');
a.equal([tian.realm,sheng.realm,dao.realm].join(),'10,12,14');
a(Math.abs(dao.mods.spellPct-.35*1.9)<1e-9,'percent mods follow the linear grade scale');

const base=f.run(`(()=>{const out={};for(const fam of Object.keys(OLD_SET_VERSIONS_V2792)){const n=OLD_SET_VERSIONS_V2792[fam][0];out[fam]=n;}return out})()`);
for(const [fam,piece] of Object.entries(base)){
 const curve=[1,1.6,2.4,3.4,4.6,6],rows=['灵品','宝器','仙器','天器','圣器','道器'].map(g=>eff(piece+'·'+g));
 const key=Object.keys(rows[0].stats)[0];
 for(let i=1;i<rows.length;i++)a(Math.abs(rows[i].stats[key]/rows[0].stats[key]-curve[i])<1e-3,`${fam} ${key} follows the grade curve at ${i+1}`);
}
console.log('PASS gear grades 4-6 extend the existing curve; grades 1-3 unchanged');

f.run("resetRuntimeState();player=createDefaultPlayer();gameState='exploring';player.level=10;player.phase=0;player.gold=10000000;player.equipmentInventory=[];window.confirm=()=>true");
f.run("buyNewGearV2790('万象玄霆',0,4)");
a(f.run("player.equipmentInventory.includes('万象玄霆·九霄玄霆杖·天器')"),'天器 purchasable at 地仙');
f.run("buyNewGearV2790('万象玄霆',0,5)");
a.equal(f.run("player.equipmentInventory.includes('万象玄霆·九霄玄霆杖·圣器')"),false,'圣器 locked below 金仙');
f.run("buyOldGearV2792?.('青云',0,4)");
a.equal(f.run("marketGearItemsV2800('weapon',6,'all').length>0"),true,'market lists 道器');
const set=f.run(`(()=>{const eq={};const fam='万象玄霆';const names=NEW_SETS_V2790[fam].slots.map((s,i)=>[s,newGearNameV2790(fam,i,i%2?3:4)]);for(const [s,n] of names)eq[s]=n;return getSetProgressV2789(eq).find(p=>p.set.familyV2790===fam)})()`);
a.equal(set.count,5);a.equal(set.immortal,true,'mixed 仙器/天器 still activates the full-set mechanic');
a.equal(f.run("forgeGradeV2825(EQUIPMENT_DB['万象玄霆·九霄玄霆杖·道器'])"),3,'forge treats post-仙器 grades as top forge grade');
console.log('PASS shops, set completion and forge accept post-地仙 grades');

const drops=f.run(`(()=>{
 const seen={};let seed=12345;Math.random=()=>((seed=(seed*1103515245+12345)%2147483648)/2147483648);
 player=createDefaultPlayer();player.level=8;player.equipmentInventory=[];
 for(let i=0;i<2000;i++){const name=rollWorldMonsterEquipmentDrop({_realmLevel:8,_regionId:'west',_isElite:false});if(name){const q=EQUIPMENT_DB[name].quality;seen[q]=(seen[q]||0)+1;}}
 return seen;
})()`);
a(Object.keys(drops).some(q=>q!=='MORTAL'),'realm 8 map drops are no longer forced to 凡品');
a(!('LING_PIN' in drops)&&!('BAO_QI' in drops),'shop-only grades stay out of map drops');
const dismantle=f.run(`['MORTAL','SPIRIT','IMMORTAL','TIAN_QI'].map(q=>{const n=Object.keys(EQUIPMENT_DB).find(k=>EQUIPMENT_DB[k].quality===q);return [q,getDismantleValue(n)]})`);
for(const [q,v] of dismantle)a(v>=5,q);
a(dismantle[2][1]>dismantle[1][1],'仙器 dismantles for more than 灵宝');
console.log('PASS map drop weights and dismantle values are keyed by quality');
