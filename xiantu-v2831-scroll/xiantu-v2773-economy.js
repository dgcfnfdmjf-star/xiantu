// V27.73：可追溯的新手补助、消耗游戏时间的村务与低价材料回收。
const EARLY_GRANTS_V2773=[
 {id:'arrival',title:'初入仙途补助',gold:1500},
 {id:'main_01',title:'仙缘入世补助',gold:800},
 {id:'main_02',title:'外门初修补助',gold:1000},
 {id:'main_03',title:'山门重逢补助',gold:1000},
 {id:'main_04',title:'妖兽试炼补助',gold:1500},
 {id:'main_05',title:'练气精进补助',gold:2200}
];
const EARLY_BUYBACK_V2773={'灵草':{price:20,keep:5},'仙果':{price:40,keep:3},'妖丹':{price:80,keep:2}};
const EARLY_OLD_AMOUNTS_V2774={arrival:150,main_01:80,main_02:100,main_03:100,main_04:150,main_05:150};
function ensureEarlyEconomyV2773(){
 const old=player.earlyEconomyV2773||{},ids=new Set(EARLY_GRANTS_V2773.map(g=>g.id));
 const claimed=Array.isArray(old.claimed)?[...new Set(old.claimed.filter(id=>ids.has(id)))]:[],paid={};
 for(const g of EARLY_GRANTS_V2773){
  const raw=Number(old.paidV2774?.[g.id]);
  paid[g.id]=Number.isFinite(raw)?Math.max(0,Math.min(g.gold,Math.floor(raw))):(claimed.includes(g.id)?EARLY_OLD_AMOUNTS_V2774[g.id]:0);
 }
 const ready=Number(old.deliveryReadyDay);
 player.earlyEconomyV2773={claimed,paidV2774:paid,deliveryReadyDay:Number.isFinite(ready)?Math.max(0,Math.floor(ready)):0};
 return player.earlyEconomyV2773;
}
function getEarlyGrantDueV2774(g,state){
 return canClaimEarlyGrantV2773(g.id)||state.claimed.includes(g.id)?Math.max(0,g.gold-state.paidV2774[g.id]):0;
}
function claimAllEarlyV2774(){
 if(gameState==='combat')return;
 const state=ensureEarlyEconomyV2773();let total=0;
 for(const g of EARLY_GRANTS_V2773){const due=getEarlyGrantDueV2774(g,state);if(!due)continue;total+=due;state.paidV2774[g.id]=g.gold;if(!state.claimed.includes(g.id))state.claimed.push(g.id);}
 if(!total)return;
 player.gold+=total;autoSave();updateStats();showEarlyEconomyV2773();showFloatingText?.(`💰 已领取补助及差额：灵石 +${total}`,'#ffd76a');
}
function canClaimEarlyGrantV2773(id){
 return id==='arrival'||!!player.tasks?.completed?.includes(id)||!!player.tasks?.active?.[id]?.completed;
}
function claimEarlyGrantV2773(id){
 if(gameState==='combat')return;
 const grant=EARLY_GRANTS_V2773.find(g=>g.id===id),state=ensureEarlyEconomyV2773();
 if(!grant)return;
 const due=getEarlyGrantDueV2774(grant,state);if(!due)return;
 state.paidV2774[id]=grant.gold;if(!state.claimed.includes(id))state.claimed.push(id);player.gold+=due;
 autoSave();updateStats();showEarlyEconomyV2773();showFloatingText?.(`💰 ${grant.title}：灵石 +${due}`,'#ffd76a');
}
function completeVillageDeliveryV2773(){
 if(gameState==='combat')return;
 const state=ensureEarlyEconomyV2773(),day=player.worldTime?.totalDays||0;
 if(player.level>2){showFloatingText?.('村务跑腿面向凡人至筑基修士','#ffd76a');return;}
 if(day<state.deliveryReadyDay){showFloatingText?.(`还需${state.deliveryReadyDay-day}个游戏日才有新委托`,'#ffd76a');return;}
 // 活动耗时1天，完成后冷却2天；靠等候刷新也要付出游戏内年龄。
 state.deliveryReadyDay=day+3;
 advanceGameTime(1,'青云村跑腿委托');player.gold+=450;
 autoSave();updateStats();showEarlyEconomyV2773();showFloatingText?.('📦 送货完成：灵石 +450，耗时1天','#ffd76a');
}
function sellSpareMaterialV2773(name){
 if(gameState==='combat')return;
 const rule=EARLY_BUYBACK_V2773[name];if(!rule)return;
 const count=Math.max(0,Math.floor(Number(player.materials?.[name])||0)),sell=Math.min(20,Math.max(0,count-rule.keep));
 if(!sell){showFloatingText?.(`保留${rule.keep}份${name}用于任务与炼丹，目前没有富余`,'#ffd76a');return;}
 player.materials[name]=count-sell;player.gold+=sell*rule.price;
 autoSave();updateStats();showEarlyEconomyV2773();showFloatingText?.(`回收${name}×${sell}：灵石 +${sell*rule.price}`,'#ffd76a');
}
function getEarlyBattleBonusV2773(enemy){
 if(!player||player.level<0||!enemy||enemy._isTutorial||enemy.tournamentFight||isBossFight||isTribulation)return 0;
 const base=Number(enemy.gold);if(!Number.isFinite(base)||base<=0)return 0;
 return Math.min(Math.floor(base*3),[120,180,260,500][Math.min(3,Math.floor(player.level))]||120);
}
function showEarlyEconomyV2773(){
 if(gameState==='combat')return;
 const state=ensureEarlyEconomyV2773(),wait=Math.max(0,state.deliveryReadyDay-(player.worldTime?.totalDays||0));
 let html=`<h3>💰 青云村生计</h3><p>现有灵石：${player.gold}</p><p>先领补助，再做村务、历练和宗门委托。灵草等材料可以出售富余部分。</p><h4>新手与主线补助 · 每项仅一次</h4>`;
 html+='<p>开局与前五个主线补助合计8000灵石；旧版已领过的可补领差额。</p><button class="choice-btn" onclick="claimAllEarlyV2774()">一键领取可领补助 / 差额</button>';
 for(const g of EARLY_GRANTS_V2773){const due=getEarlyGrantDueV2774(g,state),paid=state.paidV2774[g.id];html+=`<p>${g.title}：总额${g.gold}灵石 · 已领${paid} <button class="choice-btn" onclick="claimEarlyGrantV2773('${g.id}')" ${due?'':'disabled'}>${due?(paid?'补领差额 +':'领取 +')+due:paid>=g.gold?'已领足':'完成对应主线后领取'}</button></p>`;}

 html+=`<h4>📦 村务跑腿</h4><p>凡人至筑基可接；每次450灵石，耗时1游戏日，完成后冷却2日。</p><button class="choice-btn" onclick="completeVillageDeliveryV2773()" ${wait||player.level>2?'disabled':''}>${player.level>2?'境界已超出村务范围':wait?'还需'+wait+'天':'帮助村民送货（+450灵石）'}</button><h4>🌿 富余材料回收</h4><p>每次最多出售20份，自动保留任务材料。回收后材料会减少。</p>`;
 for(const [name,r] of Object.entries(EARLY_BUYBACK_V2773)){const have=player.materials?.[name]||0;html+=`<p>${name}：库存${have}，单价${r.price}灵石，保留${r.keep}份</p><button class="choice-btn" onclick="sellSpareMaterialV2773('${name}')" ${have<=r.keep?'disabled':''}>出售富余${name}（最多20份）</button>`;}
 html+='<p>⚔️ 普通战斗额外补贴：凡人最多+120、练气+180、筑基+260，之后逐境界增加，金丹及以上最多+500；不超过敌人原始灵石奖励的3倍。教程、首领和大比不适用。</p>';
 html+=renderLivelihoodV2788();
 showStory(html,[{text:'⚔️ 南域历练',action:'explore'},{text:'🏪 购买补给',action:'shop'},{text:'← 返回青云村',action:'village'}]);
}

// V27.88: finite, saved game-day contracts and one-time realm stipends.
const LIVELIHOOD_V2788=[
 {id:'herbs',name:'药圃照料',gold:400,days:1,cooldown:3,level:0,desc:'照料村中药圃，不消耗背包材料'},
 {id:'escort',name:'商队护送',gold:900,days:2,cooldown:7,level:1,desc:'护送商队安全通过熟悉路段'},
 {id:'lecture',name:'传授修行心得',gold:1400,days:2,cooldown:10,level:2,desc:'为后辈讲解吐纳和修炼经验'}
];
const GIFT_REALMS_V2793=[1,2,2,2,2,3,4];
const REALM_GOLD_V2788=[600,1000,1600,2400,3200,4200,5500];
function ensureLivelihoodV2788(){
 const raw=player.livelihoodV2788||{},ready={};
 for(const j of LIVELIHOOD_V2788){const v=Number(raw.ready?.[j.id]);ready[j.id]=Number.isFinite(v)?Math.max(0,Math.floor(v)):0;}
 const realms=Array.isArray(raw.realms)?[...new Set(raw.realms.filter(v=>Number.isInteger(v)&&v>=1&&v<=7))]:[];
 return player.livelihoodV2788={ready,realms};
}
function claimRealmGoldV2788(){
 if(gameState==='combat')return;
 const state=ensureLivelihoodV2788();let gold=0;
 for(let lv=1;lv<=7;lv++)if(player.level>=GIFT_REALMS_V2793[lv-1]&&!state.realms.includes(lv)){state.realms.push(lv);gold+=REALM_GOLD_V2788[lv-1];}
 if(!gold)return;
 player.gold+=gold;autoSave();updateStats();showEarlyEconomyV2773();showFloatingText?.(`境界贺礼：灵石 +${gold}`,'#ffd76a');
}
function completeLivelihoodV2788(id){
 if(gameState==='combat')return;
 const job=LIVELIHOOD_V2788.find(j=>j.id===id);if(!job||player.level<job.level)return;
 const state=ensureLivelihoodV2788(),day=Math.max(0,Number(player.worldTime?.totalDays)||0);
 if(day<state.ready[id])return;
 // Reserve before advancing time so repeated clicks cannot pay twice.
 state.ready[id]=day+job.days+job.cooldown;
 advanceGameTime(job.days,job.name);player.gold+=job.gold;
 autoSave();updateStats();showEarlyEconomyV2773();showFloatingText?.(`${job.name}：灵石 +${job.gold}，耗时${job.days}天`,'#ffd76a');
}
function renderLivelihoodV2788(){
 const state=ensureLivelihoodV2788(),day=Math.max(0,Number(player.worldTime?.totalDays)||0);
 let html='<h4>🧾 谋生委托</h4><p>按游戏日刷新，耗时计入年龄；三种委托独立冷却，无需消耗材料。</p>';
 for(const j of LIVELIHOOD_V2788){const wait=Math.max(0,state.ready[j.id]-day),locked=player.level<j.level;
 html+=`<p>${j.name}：+${j.gold}灵石 · 耗时${j.days}天 · 完成后冷却${j.cooldown}天<br>${j.desc} · ${CULTIVATION_REALMS[j.level].name}起可接</p><button class="choice-btn" onclick="completeLivelihoodV2788('${j.id}')" ${locked||wait?'disabled':''}>${locked?'境界不足':wait?'还需'+wait+'游戏日': '承接 '+j.name}</button>`;}
 let due=0;for(let lv=1;lv<=7;lv++)if(player.level>=GIFT_REALMS_V2793[lv-1]&&!state.realms.includes(lv))due+=REALM_GOLD_V2788[lv-1];
 html+='<h4>🎁 境界贺礼 · 每境界一次</h4><p>练气600、筑基合并贺礼8200、金丹4200、元婴5500灵石（旧记录已领部分不重复发放）。旧档可按当前境界补领。</p>';
 html+=`<button class="choice-btn" onclick="claimRealmGoldV2788()" ${due?'':'disabled'}>${due?'一键领取境界贺礼 +'+due:'当前无可领取贺礼'}</button>`;
 return html;
}

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2773-economy.js"]="28.68.90";
