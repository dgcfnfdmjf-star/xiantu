// ===== V27.9 完整灵宠收服系统（基于 V27.8 稳定ID/大地图返回逻辑适配） =====
const PET_QUALITIES={
  COMMON:{key:'common',label:'凡兽',color:'#9e9e9e',icon:'🟤',captureBaseRate:.90,maxLevel:20,rarity:1,power:1},
  UNCOMMON:{key:'uncommon',label:'低阶灵兽',color:'#4caf50',icon:'🟢',captureBaseRate:.70,maxLevel:30,rarity:2,power:1.08},
  RARE:{key:'rare',label:'中阶灵兽',color:'#2196f3',icon:'🔵',captureBaseRate:.50,maxLevel:40,rarity:3,power:1.18},
  EPIC:{key:'epic',label:'高阶灵兽',color:'#9c27b0',icon:'🟣',captureBaseRate:.30,maxLevel:50,rarity:4,power:1.32},
  LEGENDARY:{key:'legendary',label:'王兽',color:'#ff9800',icon:'🟠',captureBaseRate:.10,maxLevel:60,rarity:5,power:1.50},
  MYTHIC:{key:'mythic',label:'皇兽/神兽',color:'#ffd700',icon:'🌟',captureBaseRate:.01,maxLevel:80,rarity:6,power:1.80}
};
const PET_QUALITY_RANK={common:1,uncommon:2,rare:3,epic:4,legendary:5,mythic:6};
const CAPTURE_ITEMS={
  '灵兽绳':{quality:'common',desc:'普通灵兽绳，可捕捉凡兽与低阶灵兽',maxQuality:'uncommon',cost:50,icon:'🪢'},
  '缚灵玉':{quality:'uncommon',desc:'蕴含灵力封印，可捕捉中阶灵兽',maxQuality:'rare',cost:200,icon:'💎'},
  '御灵葫芦':{quality:'rare',desc:'高阶御灵法器，可捕捉高阶灵兽与王兽',maxQuality:'legendary',cost:500,icon:'🏺'},
  '魔缚索':{quality:'rare',desc:'魔道束缚器具，只用于捕捉魔宠',maxQuality:'legendary',cost:300,icon:'⛓️',isDemon:true},
  '神兽结缘印':{quality:'mythic',desc:'上古结缘法器，用于与王兽/神兽缔结特殊契约',maxQuality:'mythic',cost:2000,icon:'🌀',isBonding:true}
};
const PET_CONTRACT_ITEMS={
  '平等契约符':{icon:'📜',desc:'将普通滴血灵契提升为平等灵契'},
  '本命契约石':{icon:'💠',desc:'将灵宠提升为神魂本命契；不可再更改契约'}
};
const PET_DATABASE={
  '灵纹野兔':{baseType:'灵狐',quality:'common',captureDifficulty:.90,regionIds:['south'],spawnWeight:10,baseStats:{atk:2,def:1,hp:20}},
  '野狼':{baseType:'灵狐',quality:'common',captureDifficulty:.82,regionIds:['south'],baseStats:{atk:4,def:2,hp:30}},
  '妖兽':{baseType:'灵狐',quality:'uncommon',captureDifficulty:.62,regionIds:['south'],baseStats:{atk:7,def:4,hp:55}},
  '青纹灵蛇':{baseType:'灵狐',quality:'uncommon',captureDifficulty:.70,regionIds:['east'],spawnWeight:8,baseStats:{atk:5,def:2,hp:30}},
  '碧水灵龟':{baseType:'玄龟',quality:'uncommon',captureDifficulty:.65,regionIds:['south','east'],spawnWeight:6,baseStats:{atk:3,def:8,hp:50}},
  '灵兽':{baseType:'灵狐',quality:'uncommon',captureDifficulty:.62,regionIds:['east'],baseStats:{atk:8,def:5,hp:65}},
  '雷鹰':{baseType:'雷鹰',quality:'rare',captureDifficulty:.50,regionIds:['east','north'],spawnWeight:5,baseStats:{atk:12,def:4,hp:60}},
  '毒蟒':{baseType:'灵狐',quality:'rare',captureDifficulty:.45,regionIds:['east'],baseStats:{atk:12,def:5,hp:70}},
  '火凤幼崽':{baseType:'火凤',quality:'epic',captureDifficulty:.30,regionIds:['east'],spawnWeight:2,isBaby:true,baseStats:{atk:18,def:6,hp:80}},
  '冰霜巨狼':{baseType:'灵狐',quality:'rare',captureDifficulty:.46,regionIds:['north'],baseStats:{atk:13,def:7,hp:85}},
  '雪域妖狐':{baseType:'灵狐',quality:'rare',captureDifficulty:.42,regionIds:['north'],baseStats:{atk:14,def:6,hp:75}},
  '冰龙幼崽':{baseType:'冰龙',quality:'legendary',captureDifficulty:.10,regionIds:['north'],spawnWeight:2,isBaby:true,baseStats:{atk:25,def:12,hp:120}},
  '寒冰蛟龙':{baseType:'冰龙',quality:'legendary',captureDifficulty:.08,regionIds:['north'],baseStats:{atk:28,def:14,hp:135}},
  '九尾灵狐':{baseType:'灵狐',quality:'legendary',captureDifficulty:.05,regionIds:['east'],spawnWeight:1,canBond:true,baseStats:{atk:30,def:15,hp:150}},
  '魔渊蝙蝠':{baseType:'雷鹰',quality:'rare',captureDifficulty:.40,regionIds:['west'],spawnWeight:7,isDemon:true,baseStats:{atk:10,def:3,hp:40}},
  '暗影魔狼':{baseType:'灵狐',quality:'epic',captureDifficulty:.25,regionIds:['west'],spawnWeight:4,isDemon:true,baseStats:{atk:20,def:8,hp:90}},
  '魔界邪兽':{baseType:'灵狐',quality:'epic',captureDifficulty:.22,regionIds:['west'],isDemon:true,baseStats:{atk:22,def:9,hp:105}}
};
const PET_SPECIAL_SPAWNS={south:['灵纹野兔','碧水灵龟'],east:['青纹灵蛇','碧水灵龟','雷鹰','火凤幼崽','九尾灵狐'],north:['雷鹰','冰龙幼崽'],west:['魔渊蝙蝠','暗影魔狼']};
const PET_SPECIAL_SPAWN_CHANCE={south:.18,east:.34,north:.24,west:.30};
const PET_LEGACY_QUALITY={灵狐:'uncommon',玄龟:'uncommon',雷鹰:'rare',仙鹤:'rare',火凤:'epic',冰龙:'legendary'};

function getPetData(name){return PET_DATABASE[name]||null}
function getPetQualityInfo(key){const k=String(key||'common').toUpperCase();return PET_QUALITIES[k]||PET_QUALITIES.COMMON}
function getPetBondLabel(type){return ({blood:'滴血灵契',equal:'平等灵契',soul:'神魂本命契'})[type]||'滴血灵契'}
function getPetBondMultiplier(pet){return pet?.bondType==='soul'?1.12:pet?.bondType==='equal'?1.06:1}
function getPetCombatMultiplier(pet){return (getPetQualityInfo(pet?.quality).power||1)*getPetBondMultiplier(pet)}
function inferPetQuality(pet){return pet?.quality||PET_LEGACY_QUALITY[pet?.type]||'common'}
function petCaptureDefaultState(){return {captureTarget:null,captureCooldown:0,captureCooldownUntil:0,usedItem:null,isCapturing:false,bondedBeasts:[],killedBabyBeast:false,demonPetsCount:0,beastTamingLevel:1}}
function ensurePetCaptureState(target=player){
  if(!target)return null;const d=petCaptureDefaultState(),s=target.petCapture&&typeof target.petCapture==='object'?target.petCapture:{};
  const legacyCooldown=Math.max(0,Number(s.captureCooldown)||0),cooldownUntil=Math.max(0,Number(s.captureCooldownUntil)||0)||(legacyCooldown>0?Date.now()+legacyCooldown*1000:0);
  target.petCapture={...d,...s,captureTarget:s.captureTarget||null,usedItem:s.usedItem||null,isCapturing:!!s.isCapturing,bondedBeasts:Array.isArray(s.bondedBeasts)?[...new Set(s.bondedBeasts.map(String))]:[],killedBabyBeast:!!s.killedBabyBeast,demonPetsCount:Math.max(0,Number(s.demonPetsCount)||0),beastTamingLevel:Math.max(1,Math.min(10,Number(s.beastTamingLevel)||1)),captureCooldownUntil:cooldownUntil};
  target.petQuality=target.petQuality||'common';
  if(Array.isArray(target.pets))target.pets.forEach(p=>{if(p){p.quality=inferPetQuality(p);p.bondType=p.bondType||'blood';p.bondLevel=Math.max(1,Number(p.bondLevel)||1);p.isDemon=!!p.isDemon;if(!p._petId&&typeof createPetRuntimeId==='function')p._petId=createPetRuntimeId()}});
  syncCaptureCooldown(target);return target.petCapture;
}
function syncCaptureCooldown(target=player){const pc=target?.petCapture;if(!pc)return 0;const rem=pc.captureCooldownUntil?Math.max(0,(pc.captureCooldownUntil-Date.now())/1000):Math.max(0,Number(pc.captureCooldown)||0);pc.captureCooldown=rem;if(rem<=0)pc.captureCooldownUntil=0;return rem}
function setPetCaptureCooldown(seconds=30){const pc=ensurePetCaptureState();pc.captureCooldown=Math.max(0,seconds);pc.captureCooldownUntil=Date.now()+pc.captureCooldown*1000;setTimeout(()=>{if(!player)return;syncCaptureCooldown();if(gameState==='combat'&&isPlayerTurn&&!player.petCapture.isCapturing)updateCombatChoices?.()},pc.captureCooldown*1000+80)}

// 把新增字段接入新档与旧档；V27.8 的 activePet 稳定ID逻辑继续保留。
(function(){
  const rawCreate=window.createDefaultPlayer;
  if(typeof rawCreate==='function'&&!rawCreate._petCapturePatched){const wrapped=function(){const p=rawCreate.apply(this,arguments);p.petCapture=petCaptureDefaultState();p.petQuality='common';return p};wrapped._petCapturePatched=true;window.createDefaultPlayer=wrapped}
  const rawNormalize=window.normalizePlayer;
  if(typeof rawNormalize==='function'&&!rawNormalize._petCapturePatched){const wrapped=function(saved={}){const p=rawNormalize.apply(this,arguments);const ss=saved?.petCapture||{};p.petCapture={...petCaptureDefaultState(),captureCooldown:Math.max(0,Number(ss.captureCooldown)||0),captureCooldownUntil:Math.max(0,Number(ss.captureCooldownUntil)||0),bondedBeasts:Array.isArray(ss.bondedBeasts)?ss.bondedBeasts:[],killedBabyBeast:!!ss.killedBabyBeast,demonPetsCount:Math.max(0,Number(ss.demonPetsCount)||0),beastTamingLevel:Math.max(1,Math.min(10,Number(ss.beastTamingLevel)||1))};p.petQuality=saved?.petQuality||'common';ensurePetCaptureState(p);return p};wrapped._petCapturePatched=true;window.normalizePlayer=wrapped}
})();
ensurePetCaptureState();

// 捕捉/契约物品加入现有背包字典；点击时只提示使用场景，不会误消耗。
Object.assign(ITEMS,Object.fromEntries(Object.entries(CAPTURE_ITEMS).map(([n,d])=>[n,{type:'capture',desc:d.desc}])),{
  '平等契约符':{type:'pet_contract',desc:PET_CONTRACT_ITEMS['平等契约符'].desc},
  '本命契约石':{type:'pet_contract',desc:PET_CONTRACT_ITEMS['本命契约石'].desc}
});
const v279UseItemBase=window.useItem;
window.useItem=function(itemName){if(CAPTURE_ITEMS[itemName]){showFloatingText?.(`🐾 ${itemName}需在可收服灵兽血量≤25%时使用`,'#9fe5d3');return}if(PET_CONTRACT_ITEMS[itemName]){showFloatingText?.(`📜 请在【灵宠】界面选择灵宠后更改契约`,'#c9b8ff');return}return v279UseItemBase?.apply(this,arguments)};

function rollPetCaptureEncounterName(region){
  const id=region?.id||currentRegion||getPlayerRegion?.();const pool=(PET_SPECIAL_SPAWNS[id]||[]).filter(n=>PET_DATABASE[n]);if(!pool.length||Math.random()>(PET_SPECIAL_SPAWN_CHANCE[id]||0))return null;
  const weighted=[];for(const n of pool){const w=Math.max(1,Number(PET_DATABASE[n].spawnWeight)||4);for(let i=0;i<w;i++)weighted.push(n)}return weighted[Math.floor(Math.random()*weighted.length)]||null;
}
const v279WorldIconBase=window.getWorldMonsterIcon;
window.getWorldMonsterIcon=function(name=''){if(name.includes('兔'))return'🐇';if(name.includes('鹰'))return'🦅';if(name.includes('龟'))return'🐢';if(name.includes('凤'))return'🔥';if(name.includes('蝙蝠'))return'🦇';if(name.includes('龙'))return'🐉';return v279WorldIconBase?.call(this,name)||'👾'};

function findBestCaptureItem(enemyName){
  ensurePetCaptureState();const pd=getPetData(enemyName);if(!pd)return null;const targetRank=PET_QUALITY_RANK[pd.quality]||1;const counts={};for(const n of player.inventory||[])counts[n]=(counts[n]||0)+1;
  if(pd.canBond)return counts['神兽结缘印']?'神兽结缘印':null;
  if(pd.isDemon)return counts['魔缚索']&&PET_QUALITY_RANK[CAPTURE_ITEMS['魔缚索'].maxQuality]>=targetRank?'魔缚索':null;
  return Object.entries(CAPTURE_ITEMS).filter(([n,d])=>counts[n]&&!d.isDemon&&!d.isBonding&&(PET_QUALITY_RANK[d.maxQuality]||1)>=targetRank).sort((a,b)=>(PET_QUALITY_RANK[a[1].maxQuality]||1)-(PET_QUALITY_RANK[b[1].maxQuality]||1))[0]?.[0]||null;
}
function canCaptureTarget(enemy){
  ensurePetCaptureState();if(!enemy||enemy.hp<=0)return{ok:false,reason:'目标已死亡'};if(isBossFight||isTribulation||enemy.tournamentFight||enemy._isTutorial||enemy._isTaskBattle)return{ok:false,reason:'该战斗无法收服'};
  const pd=getPetData(enemy.name);if(!pd)return{ok:false,reason:'该目标无法收服'};const hpPct=enemy.hp/Math.max(1,enemy.maxHp||enemy.hp);if(hpPct>.25)return{ok:false,reason:'需将血量降至25%以下'};
  const cd=syncCaptureCooldown();if(cd>0)return{ok:false,reason:`御灵冷却 ${Math.ceil(cd)}秒`};if((player.pets||[]).length>=5)return{ok:false,reason:'灵宠已满 5/5'};
  if(pd.quality==='mythic'&&!pd.canBond)return{ok:false,reason:'神兽不可强行捕捉'};if(pd.canBond&&player.petCapture.bondedBeasts.includes(enemy.name))return{ok:false,reason:'已经结缘过该神兽'};
  const item=findBestCaptureItem(enemy.name);if(!item)return{ok:false,reason:pd.canBond?'缺少神兽结缘印':pd.isDemon?'缺少魔缚索':'缺少适用品级捕捉道具'};return{ok:true,bestItem:item,petData:pd};
}
function getCaptureRate(enemy,itemName){
  const pd=getPetData(enemy.name),qi=getPetQualityInfo(pd?.quality);let rate=Math.min(qi.captureBaseRate,Number(pd?.captureDifficulty)||qi.captureBaseRate);const pc=ensurePetCaptureState();
  rate+=(pc.beastTamingLevel-1)*.03;if(!player.heartDemon||Number(player.heartDemon.attachment||0)<20)rate+=.05;
  const hpPct=Math.max(.01,Math.min(.25,enemy.hp/Math.max(1,enemy.maxHp||enemy.hp)));rate+=(1-hpPct/.25)*.12;
  const date=typeof getGameDate==='function'?getGameDate():null;const moonNight=date&&date.day>=14&&date.day<=16;if(moonNight&&/[月水冰寒]/.test(enemy.name))rate+=.08;
  if(pd?.isDemon)rate-=.10;return Math.max(.01,Math.min(pd?.isDemon?.85:.95,rate));
}
function consumeInventoryItem(name){const i=player.inventory.indexOf(name);if(i>=0){player.inventory.splice(i,1);return true}return false}
function attemptCapture(enemy=currentEnemy){
  if(gameState!=='combat'||enemy!==currentEnemy||!isPlayerTurn||player?.breakthrough?.isAnimating)return false;
  const owner=player;let pc=ensurePetCaptureState();if(pc.isCapturing){showFloatingText?.('⏳ 正在收服中…','#ffd700');return}const c=canCaptureTarget(enemy);if(!c.ok){showFloatingText?.(`❌ ${c.reason}`,'#ff6b6b');return}
  if(c.bestItem==='御灵葫芦'&&(PET_QUALITY_RANK[c.petData.quality]||1)<=2){
    if(!confirm(`即将消耗【御灵葫芦】（价值500灵石）收服${getPetQualityInfo(c.petData.quality).label}【${enemy.name}】。是否继续？`))return false;
    if(player!==owner||currentEnemy!==enemy||gameState!=='combat'||!isPlayerTurn)return false;
    const check=canCaptureTarget(enemy);if(!check.ok||check.bestItem!==c.bestItem)return false;
  }
  pc=player.petCapture;
  pc.isCapturing=true;pc.captureTarget=enemy;pc.usedItem=c.bestItem;isPlayerTurn=false;updateCombatChoices?.();
  if(c.petData?.canBond){startBondingProcess(enemy,c.bestItem);return}const rate=getCaptureRate(enemy,c.bestItem);addCombatLog?.(`🌀 使用【${c.bestItem}】尝试收服 ${enemy.name}（成功率 ${Math.round(rate*100)}%）`,'pet');showCaptureProgress(rate,()=>{Math.random()<rate?captureSuccess(enemy,c.bestItem,!!c.petData?.isDemon):captureFail(enemy,c.bestItem,!!c.petData?.isDemon)})
}
// One capture owns both its progress interval and its delayed completion.
let captureRunV286846=null;
function cancelCaptureV286846(run=captureRunV286846){
  if(!run)return;
  clearInterval(run.timer);clearTimeout(run.finishTimer);run.el.remove();
  if(captureRunV286846!==run)return;
  captureRunV286846=null;
  const pc=run.owner.petCapture;
  if(pc?.captureTarget===run.enemy){pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;}
  if(player===run.owner&&currentEnemy===run.enemy&&gameState==='combat'&&run.enemy.hp>0){isPlayerTurn=true;updateCombatChoices?.();}
}
function showCaptureProgress(rate,callback){
  cancelCaptureV286846();
  if(gameState!=='combat'||!currentEnemy)return;
  document.getElementById('captureProgressV29')?.remove();const el=document.createElement('div');el.id='captureProgressV29';el.className='capture-progress-v29';el.innerHTML=`<div style="font-size:15px;font-weight:800;color:#ffd98b">🌀 灵契正在收束…</div><div class="capture-progress-track-v29"><div id="captureBarV29" class="capture-progress-fill-v29"></div></div><div style="font-size:11px;color:#9aa6aa">预计成功率 ${Math.round(rate*100)}%</div>`;document.body.appendChild(el);
  const run={owner:player,enemy:currentEnemy,item:player.petCapture.usedItem,token:COMBAT_FINISH_V2764.token,el,timer:null,finishTimer:null};captureRunV286846=run;
  const valid=()=>captureRunV286846===run&&player===run.owner&&currentEnemy===run.enemy&&gameState==='combat'&&run.enemy.hp>0&&player.hp>0&&COMBAT_FINISH_V2764.token===run.token&&el.isConnected&&player.petCapture?.isCapturing&&player.petCapture.captureTarget===run.enemy&&player.petCapture.usedItem===run.item&&player.inventory.includes(run.item);
  let p=0;run.timer=setInterval(()=>{
    if(!valid()){cancelCaptureV286846(run);return;}
    p=Math.min(1,p+.02);const bar=el.querySelector('#captureBarV29');if(bar)bar.style.width=(p*100)+'%';
    if(p>=1){clearInterval(run.timer);run.timer=null;run.finishTimer=setTimeout(()=>{if(!valid()){cancelCaptureV286846(run);return;}captureRunV286846=null;el.remove();callback?.();},220);}
  },40);
}
{const reset=window.resetRuntimeState;if(typeof reset==='function')window.resetRuntimeState=function(...args){cancelCaptureV286846();clearPetCaptureCooldownV2870();return reset.apply(this,args);};}
window.addEventListener('xiantu:combat-finishing',()=>{cancelCaptureV286846();clearPetCaptureCooldownV2870();});
function makeCapturedPet(enemy,pd,{bondType='blood',isBonded=false}={}){const t=PET_TYPES[pd.baseType]||PET_TYPES['灵狐'];return{_petId:typeof createPetRuntimeId==='function'?createPetRuntimeId():`pet_${Date.now()}`,type:pd.baseType||'灵狐',speciesV286818:enemy.name,name:enemy.name,level:1,exp:0,quality:pd.quality||'common',isDemon:!!pd.isDemon,bondType,bondLevel:1,stats:{...(pd.baseStats||{})},capturedAt:typeof getGameDateLabel==='function'?getGameDateLabel():'',isBonded:!!isBonded}}
function applyDemonPetReputationPenalty(){ensurePetCaptureState().demonPetsCount++;if(!player.factionReputation||typeof player.factionReputation!=='object')player.factionReputation={};for(const sect of Object.keys(HUMAN_FACTION_POWER||{}))player.factionReputation[sect]=(player.factionReputation[sect]||0)-5;showFloatingText?.('⚠️ 魔宠入契，正道宗门声望下降','#ff7474')}
function captureSuccess(enemy,itemName,isDemon){
  const pc=ensurePetCaptureState(),pd=getPetData(enemy.name);pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;setPetCaptureCooldown(30);consumeInventoryItem(itemName);if(!pd){isPlayerTurn=true;return}
  const pet=makeCapturedPet(enemy,pd,{bondType:'blood'});player.pets.push(pet);if(!player.activePet)player.activePet=pet;if(isDemon)applyDemonPetReputationPenalty();updateAchievementProgress?.('pet');playSound?.('item');autoSave?.();updateStats?.();showCaptureResultUI(true,pet);endCombatAfterCapture();
}
function captureFail(enemy,itemName,isDemon){
  const pc=ensurePetCaptureState();pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;setPetCaptureCooldown(30);consumeInventoryItem(itemName);const pd=getPetData(enemy.name);let rampage=false;if(pd?.quality==='epic'&&Math.random()<.30)rampage=true;if(pd?.quality==='legendary'&&Math.random()<.50)rampage=true;if(pd?.quality==='mythic'&&Math.random()<.70)rampage=true;
  if(rampage){enemy.hp=Math.min(enemy.maxHp,enemy.hp+enemy.maxHp*.30);enemy.atk=Math.floor(enemy.atk*1.5);showFloatingText?.('💢 灵兽暴走！战力飙升！','#ff6b6b');addCombatLog?.('⚠️ 灵兽挣脱灵契，进入狂暴状态！','boss')}else{enemy.hp=Math.min(enemy.maxHp,enemy.hp+enemy.maxHp*.20);showFloatingText?.('❌ 收服失败，妖兽挣脱束缚','#ff6b6b');addCombatLog?.('⚠️ 妖兽挣脱灵链，本次收服失败！','damage')}
  updateCombatUI?.();autoSave?.();setTimeout(()=>{if(currentEnemy===enemy&&enemy.hp>0)enemyTurn?.()},650)
}
function startBondingProcess(enemy,itemName){
  const pc=ensurePetCaptureState(),pd=getPetData(enemy.name);if(!pd?.canBond){pc.isCapturing=false;isPlayerTurn=true;updateCombatChoices?.();return}if(pc.bondedBeasts.includes(enemy.name)){pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;isPlayerTurn=true;showFloatingText?.('❌ 已与该神兽结缘','#ff6b6b');return updateCombatChoices?.()}
  if(player.heartDemon&&Number(player.heartDemon.attachment||0)>30){pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;isPlayerTurn=true;showFloatingText?.('❌ 心魔缠身，神兽不愿靠近','#ff6b6b');return updateCombatChoices?.()}
  if(pc.killedBabyBeast){pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;isPlayerTurn=true;showFloatingText?.('❌ 你曾伤及幼兽，神兽对你仍有戒意','#ff6b6b');return updateCombatChoices?.()}
  showCaptureProgress(1,()=>{const pc=ensurePetCaptureState();consumeInventoryItem(itemName);const pet=makeCapturedPet(enemy,pd,{bondType:'soul',isBonded:true});player.pets.push(pet);pc.bondedBeasts.push(enemy.name);pc.isCapturing=false;pc.captureTarget=null;pc.usedItem=null;player.activePet=pet;setPetCaptureCooldown(30);updateAchievementProgress?.('pet');updateAchievementProgress?.('special');playSound?.('levelup');showFloatingText?.('🌟 神兽自愿结缘，缔结【神魂本命契】！','#ffd700');showCaptureResultUI(true,pet,true);autoSave?.();updateStats?.();endCombatAfterCapture()})
}
function endCombatAfterCapture(){
  clearPetCaptureCooldownV2870();
  battleCheckpointV286812=null;
  const returnMode=currentCombatReturnMode,returnLoc=currentCombatReturnLocation||player.location;if(currentMonsterRef)releaseCurrentMapMonster(true);document.getElementById('combatPanel')?.classList.add('hidden');gameState='exploring';currentEnemy=null;isPlayerTurn=true;isBossFight=false;isTribulation=false;currentCombatReturnMode='location';currentCombatReturnLocation=null;updateStats?.();updateWorldHUD?.();
  // 关键：地图怪战斗必须回大地图，绝不 showLocation(player.location)，避免再次弹回灵宠面板。
  autoSave?.();
  if(returnMode==='world'&&document.body.classList.contains('flat-world-active'))closeWorldOverlay?.();else if(returnLoc)showLocation?.(returnLoc)
}
function showCaptureResultUI(success,pet,isBonded=false){
  document.getElementById('captureResultV29')?.remove();const qi=getPetQualityInfo(pet?.quality);const el=document.createElement('div');el.id='captureResultV29';el.className='capture-result-v29';el.innerHTML=`<div class="capture-result-card-v29"><div style="font-size:48px">${isBonded?'🌟':qi.icon}</div><div style="font-size:22px;font-weight:850;color:#ffd98b;margin:6px 0">${isBonded?'神兽结缘！':'收服成功！'}</div><div style="font-size:18px;color:${qi.color}">「${escapePetText(pet.name)}」</div><div style="font-size:11px;color:#9aa;margin-top:7px">${qi.label} · ${getPetBondLabel(pet.bondType)}</div><div class="capture-result-actions-v29"><button onclick="document.getElementById('captureResultV29')?.remove()">返回地图</button><button class="primary" onclick="openCapturedPetPanelV29()">查看灵宠</button></div></div>`;document.body.appendChild(el)
}
function openCapturedPetPanelV29(){document.getElementById('captureResultV29')?.remove();showPets?.()}

const v279CombatChoicesBase=window.updateCombatChoices;
window.updateCombatChoices=function(){v279CombatChoicesBase?.apply(this,arguments);if(!isPlayerTurn||!currentEnemy||player?.petCapture?.isCapturing)return;const pd=getPetData(currentEnemy.name);if(!pd||currentEnemy.hp<=0||currentEnemy.hp/Math.max(1,currentEnemy.maxHp)>.25)return;const div=document.getElementById('combatChoices');if(!div)return;const c=canCaptureTarget(currentEnemy),b=document.createElement('button');b.className='choice-btn capture-choice-v29';b.disabled=!c.ok;b.innerHTML=c.ok?`🪄 ${pd.canBond?'结缘':'收服'}（${c.bestItem}）`:`🔒 ${pd.canBond?'结缘':'收服'}（${escapePetText(c.reason)}）`;b.onclick=()=>attemptCapture(currentEnemy);div.appendChild(b)};
const v279CheckBattleEndBase=window.checkBattleEnd;
window.checkBattleEnd=function(){if(mercyBabyV2870())return false;ensurePetCaptureState();if(player.petCapture.isCapturing)return;if(currentEnemy?.hp<=0){const pd=getPetData(currentEnemy.name);if(pd?.isBaby&&!player.petCapture.killedBabyBeast){player.petCapture.killedBabyBeast=true;addCombatLog?.('🌫️ 你斩杀了幼兽，这份因果会影响未来的神兽结缘。','boss')}}return v279CheckBattleEndBase?.apply(this,arguments)};

function upgradeBeastTaming(){const pc=ensurePetCaptureState(),lv=pc.beastTamingLevel;if(lv>=10){showFloatingText?.('✅ 御兽功法已满级','#69f0ae');return}const gold=lv*100+50,exp=lv*50;if(player.gold<gold){showFloatingText?.(`❌ 灵石不足，需要 ${gold}`,'#ff6b6b');return}if(player.exp<exp){showFloatingText?.(`❌ 修为不足，需要 ${exp}`,'#ff6b6b');return}player.gold-=gold;player.exp-=exp;pc.beastTamingLevel++;showFloatingText?.(`📈 御兽功法升至 ${pc.beastTamingLevel} 级！`,'#ffd700');autoSave?.();updateStats?.();updatePetPanel?.()}
function changePetBondById(id,newType){
 if(!petBatchAllowedV286845())return false;
 ensurePetSystemState();ensurePetCaptureState();const pet=getPetById(id);
 if(!pet||!['equal','soul'].includes(newType)||pet.bondType===newType||pet.bondType==='soul')return false;
 const item=newType==='equal'?'平等契约符':'本命契约石';
 if(!player.inventory.includes(item)){showFloatingText(`❌ 需要【${item}】`,'#ff6b6b');return false;}
 const owner=player,oldType=pet.bondType;
 const warning=newType==='soul'?'契约不可更改；强行放生会使气血降至最大值的30%。':'平等契不可退回滴血契。';
 if(!confirm(`消耗【${item}】×1，与「${pet.name}」缔结【${getPetBondLabel(newType)}】？\n${warning}`))return false;
 if(player!==owner||!petBatchAllowedV286845()||getPetById(id)!==pet||pet.bondType!==oldType||!player.inventory.includes(item))return false;
 const inventory=player.inventory.slice(),hadSoul=Object.hasOwn(pet,'isSoulBonded'),soul=pet.isSoulBonded;
 consumeInventoryItem(item);pet.bondType=newType;if(newType==='soul')pet.isSoulBonded=true;
 if(!saveGame()){player.inventory.splice(0,player.inventory.length,...inventory);pet.bondType=oldType;if(hadSoul)pet.isSoulBonded=soul;else delete pet.isSoulBonded;return false;}
 showFloatingText(`✅ 契约变更为【${getPetBondLabel(newType)}】`,'#69f0ae');updatePetPanel();updateStats();return true;
}
function clearPetCaptureCooldownV2870(){
 if(player?.petCapture){player.petCapture.captureCooldown=0;player.petCapture.captureCooldownUntil=0;}
}

function releasePetById(id){
  if(!petBatchAllowedV286845())return false;
  ensurePetSystemState();const owner=player,pet=getPetById(id);if(!pet)return false;
  const refund=getPetReleaseRefundV286846(pet),items=Object.entries(refund).map(([n,c])=>`${n}×${c}`).join('、'),soul=pet.bondType==='soul';
  const hint=items?`\n归元返还（实耗80%，逐项取整）：${items}`:'\n暂无可返还材料（每种实际消耗的80%，不足1件舍去）。';
  const msg=`确定放生「${pet.name}」吗？${soul?'\n解除神魂本命契会令气血降至30%。':''}${hint}\n仅计更新后记录的喂养与养成材料，不返还灵石。`;
  if(typeof confirm==='function'&&!confirm(msg))return false;
  if(player!==owner||!petBatchAllowedV286845()||getPetById(id)!==pet||JSON.stringify(refund)!==JSON.stringify(getPetReleaseRefundV286846(pet)))return false;
  const before={pets:player.pets.slice(),active:player.activePet,hp:player.hp,mats:{...player.petMaterials}};
  if(Object.entries(refund).some(([n,c])=>!Number.isSafeInteger((Number(player.petMaterials[n])||0)+c)))return false;
  try{
    player.pets.splice(player.pets.indexOf(pet),1);if(player.activePet?._petId===id)player.activePet=null;
    if(soul)player.hp=Math.max(1,Math.floor(getMaxHp()*.30));
    for(const [n,c] of Object.entries(refund))player.petMaterials[n]=(Number(player.petMaterials[n])||0)+c;
    if(!saveGame())throw new Error('release save failed');
  }catch(err){player.pets=before.pets;player.activePet=before.active;player.hp=before.hp;player.petMaterials=before.mats;showFloatingText?.('放生未保存，灵宠与材料已恢复，请稍后重试。','#ff6b6b');return false;}
  petFeedOpenId=null;petGrowthOpenIdV210=null;petContractOpenIdV29=null;
  showFloatingText?.(`已放生「${pet.name}」${items?' · 归元 '+items:''}${soul?' · 神魂受创':''}`,soul?'#ff6b6b':'#8fe3c4');updateStats?.();updatePetPanel?.();return true;
}
let petContractOpenIdV29=null;
function togglePetContractMenuV29(id){petContractOpenIdV29=petContractOpenIdV29===id?null:id;updatePetPanel?.()}

// 覆盖 V27.8 展示层：保留稳定ID/培养体验，加入品质、契约、御兽与道具库存。
window.getPetAttackPreview=function(pet){const t=pet&&PET_TYPES[pet.type];if(!t)return 0;const lv=Math.max(1,Number(pet.level)||1),base=Math.max(Number(pet.stats?.atk)||0,t.baseAtk);return Math.max(1,Math.floor((base+lv*t.growthAtk)*getPetCombatMultiplier(pet)))};
window.getPetPower=function(pet){if(!pet)return 0;const lv=Math.max(1,Number(pet.level)||1),qi=getPetQualityInfo(inferPetQuality(pet)),atk=getPetAttackPreview(pet),def=Number(pet.stats?.def)||0,hp=Number(pet.stats?.hp)||0;return Math.round(atk*2+def*1.3+hp*.18+lv*5+qi.rarity*12+(pet.bondType==='soul'?25:pet.bondType==='equal'?12:0))};
window.updatePetPanel=function(){
  ensurePetSystemState?.();ensurePetCaptureState();const pets=player.pets||[],active=player.activePet,summary=document.getElementById('petCollectionSummary');if(summary)summary.textContent=`灵宠 ${pets.length}/5 · ${active?`出战：${active.name} Lv.${active.level}`:'当前无出战灵宠'}`;const cap=document.getElementById('petCapacityBadge');if(cap)cap.textContent=`${pets.length} / 5`;
  const spot=document.getElementById('activePetSpotlight');if(spot){if(active){const t=PET_TYPES[active.type]||{icon:'🐾'},q=getPetQualityInfo(active.quality);spot.innerHTML=`<div class="pet-active-card"><div class="pet-active-avatar">${t.icon||'🐾'}</div><div><div class="pet-active-name">正在出战 · ${escapePetText(active.name)} <span class="pet-level-chip">Lv.${active.level}</span></div><div class="pet-quality-line-v29"><span class="pet-quality-badge-v29" style="color:${q.color}">${q.icon} ${q.label}</span><span class="pet-bond-badge-v29">${getPetBondLabel(active.bondType)}</span></div><div class="pet-active-desc">${escapePetText(getPetTalentText(active))}</div></div><div class="pet-active-power">灵宠战力<b>${getPetPower(active)}</b></div></div>`}else spot.innerHTML='<div class="pet-active-card empty">尚未选择出战灵宠 · 捕捉或选择灵宠后即可获得战斗加成</div>'}
  const dash=document.getElementById('petCaptureDashboard');if(dash){const pc=player.petCapture,lv=pc.beastTamingLevel,costGold=lv*100+50,costExp=lv*50,counts={};for(const n of player.inventory||[])if(CAPTURE_ITEMS[n])counts[n]=(counts[n]||0)+1;dash.innerHTML=`<div class="pet-taming-card-v29"><div class="pet-v29-kicker">御兽功法</div><div class="pet-v29-title"><span>🪄 御灵诀</span><span class="pet-v29-level">Lv.${lv}/10</span></div><div class="pet-v29-desc">每提升1级，野外收服成功率 +3%。目标需先压至25%气血以下。<br>已结缘 ${pc.bondedBeasts.length} · 魔宠 ${pc.demonPetsCount}${syncCaptureCooldown()>0?` · 冷却 ${Math.ceil(syncCaptureCooldown())}秒`:''}</div><button class="pet-taming-upgrade-v29" ${lv>=10?'disabled':''} onclick="upgradeBeastTaming()">${lv>=10?'已修至圆满':`升级 · ${costGold}灵石 + ${costExp}修为`}</button></div><div class="pet-capture-items-v29"><div class="pet-v29-kicker">捕捉道具</div><div class="pet-v29-title"><span>🎒 御兽囊</span><span style="font-size:9px;color:#809a95">百宝阁购买</span></div><div class="pet-capture-item-grid-v29">${Object.entries(CAPTURE_ITEMS).map(([n,d])=>`<span class="pet-capture-chip-v29">${d.icon}${n} <b>×${counts[n]||0}</b></span>`).join('')}</div></div>`}
  const list=document.getElementById('petList');if(list){if(!pets.length)list.innerHTML='<div class="pet-empty-v28">暂无灵宠。野外将可收服的灵兽压至25%气血以下，再使用捕捉道具。</div>';else list.innerHTML=pets.map(pet=>{const t=PET_TYPES[pet.type]||{icon:'🐾'},q=getPetQualityInfo(pet.quality),activeNow=isActivePetV28(pet),lv=Math.max(1,Number(pet.level)||1),need=lv*30,exp=Math.max(0,Number(pet.exp)||0),pct=Math.max(0,Math.min(100,exp/Math.max(1,need)*100)),feedOpen=petFeedOpenId===pet._petId,contractOpen=petContractOpenIdV29===pet._petId,maxLv=q.maxLevel;const feedBtns=Object.entries(PET_FOOD).map(([n,f])=>{const c=Math.max(0,Number(player.petMaterials?.[n])||0);return `<button class="pet-feed-btn" ${c&&lv<maxLv?'':'disabled'} onclick="feedPetById('${pet._petId}','${n}')">${escapePetText(n)} ×${c}<br><b>${lv>=maxLv?'已满级':`+${f.exp}经验`}</b></button>`}).join('');return `<div class="pet-card-v28 ${activeNow?'active':''} ${pet.isDemon?'pet-demon-v29':''} ${pet.isBonded?'pet-bonded-v29':''}">${activeNow?'<span class="pet-active-tag">出战中</span>':''}<div class="pet-avatar-v28">${t.icon||'🐾'}</div><div><div class="pet-name-v28">${escapePetText(pet.name)}<span class="pet-level-chip">Lv.${lv}/${maxLv}</span></div><div class="pet-quality-line-v29"><span class="pet-quality-badge-v29" style="color:${q.color}">${q.icon} ${q.label}</span><span class="pet-bond-badge-v29">${getPetBondLabel(pet.bondType)}</span>${pet.isDemon?'<span class="pet-bond-badge-v29" style="color:#f18a9a">魔宠</span>':''}</div><div class="pet-stat-row-v28"><span class="pet-stat-chip-v28">⚔ ${getPetAttackPreview(pet)}</span><span class="pet-stat-chip-v28">战力 ${getPetPower(pet)}</span></div><div class="pet-bonus-v28">${escapePetText(getPetTalentText(pet))}</div></div><div class="pet-exp-wrap"><div class="pet-exp-line"><span>成长经验</span><span>${lv>=maxLv?'满级':`${exp} / ${need}`}</span></div><div class="pet-exp-track"><div class="pet-exp-fill" style="width:${lv>=maxLv?100:pct.toFixed(1)}%"></div></div></div><div class="pet-actions-v28"><button class="pet-action-v28 ${activeNow?'active':''}" onclick="setActivePetById('${pet._petId}')">${activeNow?'✓ 已出战':'⚔ 出战'}</button><button class="pet-action-v28 secondary" onclick="togglePetFeedMenu('${pet._petId}')">🍖 ${feedOpen?'收起':'培养'}</button><button class="pet-action-v28 secondary" onclick="togglePetContractMenuV29('${pet._petId}')">📜 契约</button><button class="pet-action-v28 pet-release-btn-v29" onclick="releasePetById('${pet._petId}')">放生</button></div>${feedOpen?`<div class="pet-feed-menu">${feedBtns}</div>`:''}${contractOpen?`<div class="pet-contract-menu-v29"><button class="pet-contract-btn-v29" ${pet.bondType==='blood'?'disabled':''} onclick="changePetBondById('${pet._petId}','blood')">滴血灵契</button><button class="pet-contract-btn-v29" ${pet.bondType==='soul'?'disabled':''} onclick="changePetBondById('${pet._petId}','equal')">平等灵契<br>需契约符</button><button class="pet-contract-btn-v29" ${pet.bondType==='soul'?'disabled':''} onclick="changePetBondById('${pet._petId}','soul')">神魂本命契<br>需契约石</button></div>`:''}</div>`}).join('')}
  const mat=document.getElementById('petMaterialInventory');if(mat)mat.innerHTML=Object.entries(PET_FOOD).map(([n,f])=>`<span class="pet-material-chip-v28">🍖 ${escapePetText(n)} <b>×${Math.max(0,Number(player.petMaterials?.[n])||0)}</b> · +${f.exp}经验</span>`).join('')
};
// 培养遵循品质等级上限；兼容旧宠物并支持一次多级。
window.feedPet=function(index,foodName){ensurePetSystemState?.();ensurePetCaptureState();const pet=player.pets[index],food=PET_FOOD[foodName],count=Math.max(0,Number(player.petMaterials?.[foodName])||0);if(!pet||!food||count<=0)return;const maxLv=getPetQualityInfo(pet.quality).maxLevel;if((pet.level||1)>=maxLv){showFloatingText?.(`✅ ${pet.name} 已达到${getPetQualityInfo(pet.quality).label}等级上限 Lv.${maxLv}`,'#69f0ae');return}player.petMaterials[foodName]=count-1;if(player.petMaterials[foodName]<=0)delete player.petMaterials[foodName];pet.exp=Math.max(0,Number(pet.exp)||0)+Number(food.exp||0);let gained=0,safe=0;while(safe++<50&&(pet.level||1)<maxLv){const need=Math.max(1,Number(pet.level||1)*30);if(pet.exp<need)break;pet.exp-=need;pet.level=Math.min(maxLv,Math.max(1,Number(pet.level)||1)+1);gained++}if((pet.level||1)>=maxLv)pet.exp=0;if(gained){playSound?.('levelup');showFloatingText?.(`🎉 ${pet.name} 提升 ${gained} 级 → Lv.${pet.level}`,'#8ff0cf')}else showFloatingText?.(`🍖 ${pet.name} 经验 +${food.exp}`,'#d9c98e');updatePetPanel?.();updateStats?.();autoSave?.()};

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-14-v279-pet-capture-system.js"]="28.68.66";

function fieldEncounterV2870(enemy,boss,trib,monster){return !!monster&&!!enemy&&!boss&&!trib&&!enemy._isTutorial&&!enemy._isTaskBattle&&!enemy._taskId&&!enemy._warV2839&&!enemy.tournamentFight&&!enemy._nightRivalV2810&&!authoredStoryCombatV286835(enemy);}
function mercyBabyV2870(){
 const enemy=currentEnemy;
 if(player.fieldAidV2870?.mercy!==true||gameState!=='combat'||player.hp<=0||COMBAT_FINISH_V2764.settling||!fieldEncounterV2870(enemy,isBossFight,isTribulation,currentMonsterRef)||enemy.hp>0||enemy._mercySavedV2870||(player.pets||[]).length>=5||!getPetData(enemy.name)?.isBaby)return false;
 enemy._mercySavedV2870=true;enemy.hp=1;isPlayerTurn=true;
 addCombatLog('🌿 护幼留手：保留1点气血，可尝试收服；再次致死不再保护。','pet');updateCombatUI();updateCombatChoices();return true;
}
function emergencyFieldHealV2870(enemy,boss,trib,monster){
 if(player.fieldAidV2870?.heal!==true||!fieldEncounterV2870(enemy,boss,trib,monster)||player.hp<=0||player.hp/getMaxHp()>=.30)return null;
 const candidates=(player.inventory||[]).filter(n=>ITEMS[n]?.type==='heal'&&Number.isFinite(ITEMS[n].value)&&ITEMS[n].value>0).sort((a,b)=>ITEMS[a].value-ITEMS[b].value);
 const name=candidates[0];if(!name)return null;const before=player.hp;consumeInventoryItem(name);player.hp=Math.min(getMaxHp(),before+ITEMS[name].value);return {name,heal:player.hp-before};
}
