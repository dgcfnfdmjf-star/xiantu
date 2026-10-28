// Reproducible price/reward units, not a playtime forecast or a natural progression simulation.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../xiantu-v2831-scroll'),f=require(path.join(root,'QA/v2858-dom-fixture.cjs'))(root);
f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.c.console.log=()=>{};
for(const name of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(name);
const report=JSON.parse(f.run(`JSON.stringify((()=>{
 const rows=[];for(let lv=0;lv<=16;lv++){
  player=createDefaultPlayer();player.level=lv;player.phase=0;isBossFight=false;isTribulation=false;
  const grade=GRADES_V2790.filter(g=>g.level<=lv).at(-1),index=grade?GRADES_V2790.indexOf(grade)+1:0;
  const item=index?newGearNameV2790('万象玄霆',0,index):null,d=item?getEquipData(item):null;
  const reward=elite=>battleGoldV28683({name:'同境探针',gold:100,_realmLevel:lv,_isElite:elite});
  const normal=reward(false),elite=reward(true),price=d?.priceV2790||0,forge10=d?100*forgeGradeV2825(d)*55:0;
  rows.push({level:lv,realm:CULTIVATION_REALMS[lv].name,grade:grade?.name||null,normal,elite,price,forge10,oneItemKills:Math.ceil(price/normal),fiveSetKills:Math.ceil(price*5/normal),itemPlusForgeKills:Math.ceil((price+forge10)/normal),dismantle:item?getDismantleValue(item):0});
 }
 const shops=Object.entries(EQUIPMENT_DB).filter(([n,d])=>Number.isFinite(d.priceV2790)&&d.priceV2790>0).map(([name,d])=>({name,price:d.priceV2790,sale:getDismantleValue(name)}));
 return {rows,shopCount:shops.length,arbitrage:shops.filter(x=>x.sale>=x.price)};
})())`));
report.assumptions='Same-realm ordinary/elite enemy, base gold=100, phase 0, no artifact/furniture gold bonus. Costs use the current highest available wand shop grade and production forge grade, +1 through +10 summed. Kill equivalents ignore drops, extra map gold, other income and consumables; they are gross reward units, not actual wins/time or a requirement to buy a full set each realm. Existing owned items/old balances are not compensated.';
const label=String(process.argv[2]||'current').replace(/[^a-z0-9_-]/gi,'');
const dir=path.resolve(__dirname,'../output/balance');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'late-economy-'+label+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
