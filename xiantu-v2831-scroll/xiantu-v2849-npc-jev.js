/* NPC decisions operate on existing legal choices; no freeform provider scripts. */
const NPC_JEV_V2849={allies:new WeakMap(),rivalRecorded:new WeakSet(),allyCloud:false};
try{NPC_JEV_V2849.allyCloud=localStorage.getItem('xiantu_jev_ally_v2849')==='1';}catch(_){}
function npcFingerprintV2849(){return JSON.stringify([player.level,player.sect,player.gold,player.hp,player.mp,player.worldTime,player.mapNpc,player.materials,player.sectTasks,player.sectContribution,player.equipment,player.equipmentInventory,player.romance,player.yewujiStoryV2816,player.rivalHistoryV2849]);}
function npcOptionsV2849(title,task,context,options,preferred=0){
  if(!jevCanActV2846())return;
  const fingerprint=npcFingerprintV2849();
  return jevOfferV2846(title,task,context,options,preferred,()=>jevCanActV2846()&&npcFingerprintV2849()===fingerprint);
}
function jevMapNpcV2849(id){
  const npc=MAP_NPCS[id];if(!npc||!jevCanActV2846())return;
  const status=getMapNpcQuestState(id).status,affinity=getMapNpcAffinity(id),ready=getMapNpcQuestProgress(id).ready;
  const options=[{a:0,label:'提供本地线索 · 查看地域情报',apply:()=>showMapNpcIntel(id)},
    ...(status==='completed'?[]:[{a:1,label:status==='accepted'?'谈谈当前委托 · 查看要求':'请求你的帮助 · 确认是否接取委托',apply:()=>{if(status==='accepted')return showMapNpcHub(id);if(window.confirm(`接取【${npc.quest.title}】？\n${npc.quest.desc}\n接取时不扣材料，备齐后自行提交。`))acceptMapNpcQuest(id);}}]),
    {a:2,label:'保持谨慎 · 交谈一次',apply:()=>npcReservedTalkV2849(id)},
    {a:3,label:'交流近况 · 交谈一次',apply:()=>talkToMapNpc(id)}];
  return npcOptionsV2849(npc.name+' · Jev 行为','mapnpc',[affinity,['available','accepted','completed'].indexOf(status),Number(ready),jevPercentV2846(player.hp,getMaxHp()),player.level],options,ready&&status!=='completed'?1:0);
}
function npcReservedTalkV2849(id){talkToMapNpc(id);const el=document.getElementById('storyText');if(el){const note=document.createElement('p');note.className='npc-note';note.textContent='对方先打量你的神色，仍保留些许戒心，只谈起公开的见闻。';el.prepend(note);}}
function jevElderV2849(){
  if(!jevCanActV2846()||!player.sect||player.sect==='散修')return;
  if(player.sectTasks.some(t=>!t.completed))return showSectTasks();
  const options=SECT_TASK_TEMPLATES.filter(t=>!t.goldCost||player.gold>=t.goldCost).map(t=>{
    const owned=t.materials?Math.min(...Object.entries(t.materials).map(([k,v])=>Math.min(v,player.materials[k]||0))):t.goldCost?Math.min(player.gold,t.goldCost):0;
    return {a:t.type==='combat'?1:t.type==='donate'?2:0,b:getSectTaskCount(t),c:owned,d:t.contributionReward,e:t.goldCost||0,
      label:`${t.name} · ${formatSectTaskDesc(t)} · ${t.contributionReward}贡献`,apply:()=>{if(window.confirm(`接取【${t.name}】？\n${formatSectTaskDesc(t)}\n接取时不扣资源，完成后按原规则提交。`))acceptSectTask(t.id);}};
  });
  const preferred=Math.max(0,options.findIndex(o=>o.a===0&&o.c>=o.b));
  return npcOptionsV2849('宗门执事 · 安排差事','elder',[player.level,player.sectContribution,player.gold,jevPercentV2846(player.hp,getMaxHp())],options,preferred);
}
function jevMerchantV2849(){
  if(!jevCanActV2846())return;
  const bag=player.equipmentInventory||[],worn=Object.values(player.equipment||{});
  const gear=Object.entries(EQUIPMENT_DB).filter(([name,d])=>d.familyV2790&&d.priceV2790>0&&d.priceV2790<=player.gold&&canEquipItem(name).ok&&!bag.includes(name)&&!worn.includes(name)).map(([name,d])=>{
    const current=player.equipment[d.slot],gain=Math.max(0,getEquipItemScore(name)-(current?getEquipItemScore(current):0));
    return {a:0,b:d.priceV2790,c:gain,d:0,label:`${name} · ${d.priceV2790}灵石 · 参考评分提升 ${gain.toFixed(1)}`,apply:()=>buyMarketGearV2800(d.slot==='weapon'?'weapon':'armor',d.gradeV2790,'all',d.familyV2790,d.pieceV2790)};
  }).filter(o=>o.c>0).sort((a,b)=>b.c/Math.max(1,b.b)-a.c/Math.max(1,a.b)).slice(0,9);
  const pills=Object.entries(MAP_NPC_PRICES_V2876).filter(([name])=>['heal','mp'].includes(ITEMS[name]?.type)).flatMap(([name,price])=>[1,5].filter(count=>price*count<=player.gold).map(count=>({a:ITEMS[name].type==='heal'?1:2,b:price*count,c:ITEMS[name].type==='heal'?100-jevPercentV2846(player.hp,getMaxHp()):0,d:player.inventory.filter(x=>x===name).length,label:`${name} ×${count} · ${price*count}灵石 · 已有${player.inventory.filter(x=>x===name).length}`,apply:()=>buyFromMapNpc('trader',name,price,count)})));
  const options=[...gear,...pills];
  if(!options.length)return showStory('<h3>行脚商翻了翻货箱</h3><p>当前没有买得起且合适的升级装备或补给。先做委托积攒灵石，或继续使用现有装备。</p>',[{text:'赚取灵石',action:'early_economy_v2773'},{text:'返回仙市',action:'market'}]);
  const preferred=player.hp<getMaxHp()*.5?Math.max(0,options.findIndex(o=>o.a===1&&o.d===0)):0;
  return npcOptionsV2849('商人 · 按需推荐','merchant',[player.gold,jevPercentV2846(player.hp,getMaxHp()),jevPercentV2846(player.mp,getMaxMp()),player.level],options,preferred);
}
function rivalHistoryV2849(){
  const old=player.rivalHistoryV2849||{},int=v=>Math.max(0,Math.min(1e9,Math.floor(Number(v)||0)));
  return {duels:int(old.duels),wins:Math.min(int(old.duels),int(old.wins))};
}
function jevRivalV2849(){
  if(!jevCanActV2846())return;const e=createYeWujiV2810(),p=yeStateV2816(),h=rivalHistoryV2849(),next=p.choices.length;
  const options=[...(yeStoryAvailableV2816(next)?[{a:0,label:'追问旧事 · 进入下一章已解锁纪事',apply:()=>showYeChapterV2816(next)}]:[]),{a:1,label:'以修行为答 · 确认挑战夜无疆',apply:challengeYeWujiV2810},{a:2,label:'回顾宿敌纪事',apply:showYeChronicleV2816},{a:3,label:'听他回应这次相逢',apply:()=>{
    const line=player.level>=15?'“我的本源已断在半圣。你若还有前路，就走给我看。”':h.wins?'“你已经赢过我，但下一次交手，我会换一种应对。”':h.duels?'“上次交手的破绽，你补上了吗？我会先试你的护体，再寻你灵力的空隙。”':'“先稳住气息。三万年的战火，不会因为一句豪言就熄灭。”';
    showStory(`<h3>夜无疆 · 宿敌回应</h3><p>${line}</p><p>记录交手 ${h.duels} 次 · 击退 ${h.wins} 次</p><p>当前境界 ${getEnemyRealmNameV2811(e)}，最高半圣圆满。对话不会提高他的境界或替你完成战斗。</p>`,[{text:'返回人物页',action:'yewuji_v2810'}]);
  }}];
  return npcOptionsV2849('夜无疆 · 宿敌应对','rival',[player.level,e._realmLevel,next,h.duels,h.wins,jevPercentV2846(player.hp,getMaxHp())],options,player.hp<getMaxHp()*.4?options.length-1:0);
}
function hostileKindV2849(){return currentEnemy?._nightRivalV2810?'rival':currentEnemy&&(/修士|魔修|邪修|剑修|散修|道人|长老|弟子|探子|山贼|匪徒/.test(currentEnemy.name)||currentEnemy._npcHostileV2849===true)?'human':null;}
function hostileCanRetreatV2849(){return hostileKindV2849()==='human'&&!!currentMonsterRef&&!isBossFight&&!isTribulation&&!currentEnemy.tournamentFight&&!Object.keys(currentEnemy).some(k=>k.startsWith('_')&&/task|war|mini|main|rival|quest|trial/i.test(k));}
function hostileExtraSnapshotV2849(s){const actor=hostileKindV2849();if(!actor)return {};const h=actor==='rival'?rivalHistoryV2849():{duels:0,wins:0};return {actor,canRetreat:hostileCanRetreatV2849(),supportTurns:s.supportTurns||0,...h};}
function hostileDamageV2849(damage){const s=monsterStateV2844();if(!s?.supportTurns)return damage;s.supportTurns--;const out=Math.max(1,Math.floor(damage+damage*.15));addCombatLog('敌方援阵助势，伤害提升15%（剩余 '+s.supportTurns+' 次）。','boss');return out;}
function hostileWithdrawV2849(){
  if(!hostileCanRetreatV2849()||COMBAT_FINISH_V2764.settling)return false;
  addCombatLog(currentEnemy.name+'收势退去，本次没有战利品，也不计入击杀任务。','boss');
  releaseCurrentMapMonster(false);queueCombatFinishV2764('flee',{label:'敌方撤退 · 返回地图',delay:700});return true;
}
function companionIdV2849(){const id=player?.companionV2849;return typeof id==='string'&&ROMANCE_NPCS[id]&&player.romance?.partner===id?id:null;}
function showCompanionV2849(){
  if(gameState==='combat'||gameState==='combat-ending'){showFloatingText?.('请结束战斗后调整随行同伴','#ffd76a');return;}
  const id=player.romance?.partner,valid=!!ROMANCE_NPCS[id],selected=companionIdV2849();
  showStory(`<h3>同伴随行</h3><p>每日首次实际出手并获胜，好感+1（沿用剧情上限，切换道侣不重复领取）。</p><p>${selected?ROMANCE_NPCS[selected].name+'正在随行':'当前没有随行同伴'}</p><p>已结为道侣的人物可随行。普通战斗中每个敌方回合前支援一次；独立灵力60，行动消耗灵力并受冷却限制。新手演武、天劫、宗门大比不出手。</p><p>回生：18灵力，恢复你12%最大气血，间隔3回合。护卫：12灵力，下次敌方直接命中减伤20%，间隔2回合。集火：16灵力，按你35%攻击减去敌方防御结算，间隔2回合。吐纳：恢复12灵力。</p>${valid?`<button class="choice-btn" onclick="setCompanionV2849(true)">邀请 ${ROMANCE_NPCS[id].name} 随行</button>`:'<p>尚未结缘，可在姻缘亭推进人物故事。</p>'}<button class="choice-btn" onclick="setCompanionV2849(false)">独自出行</button><label><input type="checkbox" ${NPC_JEV_V2849.allyCloud?'checked':''} onchange="setCompanionCloudV2849(this.checked)">同伴使用 Jev 判断（未解锁或超时使用本地策略）</label><p>试玩版默认开启 Jev 支援；连接失败用本地策略，不会使用你的背包丹药。Jev 不设次数上限，沿用防重复请求间隔。</p>`,[{text:'前往姻缘亭',action:'romance'},{text:'返回地图',action:'return_to_map'}]);
}
function setCompanionV2849(on){if(!jevCanActV2846())return;const id=player.romance?.partner;if(on&&!ROMANCE_NPCS[id])return;player.companionV2849=on?id:null;autoSave();showCompanionV2849();}
function setCompanionCloudV2849(on){NPC_JEV_V2849.allyCloud=!!on;try{localStorage.setItem('xiantu_jev_ally_v2849',on?'1':'0');}catch(_){}}
function initNpcBattleV2849(){
  NPC_JEV_V2849.allies.delete(currentEnemy);NPC_JEV_V2849.rivalRecorded.delete(currentEnemy);
  const id=companionIdV2849();
  if(id&&!isTribulation&&!currentEnemy._isTutorial&&!currentEnemy.tournamentFight)NPC_JEV_V2849.allies.set(currentEnemy,{id,owner:player,token:COMBAT_FINISH_V2764.token,mp:60,turn:0,cooldowns:{},guard:false,locked:false,status:'等待支援'});
  if(currentEnemy._nightRivalV2810){initRivalTrialV2874(currentEnemy);const h=rivalHistoryV2849();h.duels++;player.rivalHistoryV2849=h;autoSave();}
}
function companionBattleV2849(){const s=currentEnemy&&NPC_JEV_V2849.allies.get(currentEnemy);return s&&s.owner===player&&s.token===COMBAT_FINISH_V2764.token&&s.id===companionIdV2849()?s:null;}
const ALLY_ACTIONS_V2849=[{a:0,name:'吐纳',cost:0,cooldown:0},{a:1,name:'回生',cost:18,cooldown:3},{a:2,name:'护卫',cost:12,cooldown:2},{a:3,name:'集火',cost:16,cooldown:2}];
function companionActionsV2849(s){return ALLY_ACTIONS_V2849.filter(o=>s.mp>=o.cost&&(s.cooldowns[o.a]||0)<=s.turn&&(o.a!==1||player.hp<getMaxHp())&&(o.a!==0||s.mp<60));}
async function runCompanionTurnV2849(next){
  const s=companionBattleV2849();if(!s||currentEnemy.hp<=0)return next();if(s.locked||monsterStateV2844()?.locked)return;
  s.locked=true;s.turn++;s.guard=false;
  const owner=player,enemy=currentEnemy,token=COMBAT_FINISH_V2764.token;
  const battleFresh=()=>player===owner&&currentEnemy===enemy&&gameState==='combat'&&!isPlayerTurn&&COMBAT_FINISH_V2764.token===token&&!COMBAT_FINISH_V2764.settling;
  try{
    const options=companionActionsV2849(s),local=player.hp/getMaxHp()<=.45?options.find(o=>o.a===1):null;
    const chosen=local||options.find(o=>o.a===(s.mp<18?0:3))||options[0];if(!chosen)return next();
    const fingerprint=()=>JSON.stringify([player.hp,player.mp,enemy.hp,s.mp,s.turn]);const signature=fingerprint();
    const fresh=()=>battleFresh()&&companionBattleV2849()===s&&fingerprint()===signature;
    const enemyAi=monsterStateV2844(),requestBefore=FORGE_ADVICE_V2842.nextAt,enemyRequests=enemyAi?.requests||0;
    const fairTurn=!MONSTER_JEV_V2844.enabled||enemyAi?.failed||s.lastEnemyRequest===undefined||enemyRequests>s.lastEnemyRequest;
    let answer=NPC_JEV_V2849.allyCloud&&options.length>1&&fairTurn?await jevDecideV2846(jevWireStateV2846('ally',[jevPercentV2846(player.hp,getMaxHp()),jevPercentV2846(enemy.hp,enemy.maxHp),s.mp,s.turn],options),'o'+options.indexOf(chosen),fresh,1500):{choice:'o'+options.indexOf(chosen),source:'local'};
    if(FORGE_ADVICE_V2842.nextAt!==requestBefore)s.lastEnemyRequest=enemyRequests;
    if(!battleFresh())return;
    if(!fresh())return next();
    if(!NPC_JEV_V2849.allyCloud)answer={choice:'o'+options.indexOf(chosen),source:'local'};
    const action=options[Number(answer.choice.slice(1))];if(!action||!companionActionsV2849(s).includes(action))return next();
    s.actionsV2875=(s.actionsV2875||0)+1;s.mp-=action.cost;s.cooldowns[action.a]=s.turn+action.cooldown;
    const name=ROMANCE_NPCS[s.id].name;s.status=(answer.source==='jev'?'天机推演':'本地策略')+' · '+action.name;
    if(action.a===0){s.mp=Math.min(60,s.mp+12);addCombatLog(`${name}吐纳回气，灵力 ${s.mp}/60。`,'heal');}
    if(action.a===1){const gain=Math.min(getMaxHp()-player.hp,Math.max(1,Math.floor(getMaxHp()*.12)));player.hp+=gain;showDamageNumber(gain,'player',true,false,true,false,name+'·回生');addCombatLog(`${name}施展回生，恢复 ${gain} 气血。`,'heal');}
    if(action.a===2){s.guard=true;addCombatLog(`${name}展开护卫，抵挡下一次敌方直接命中的20%伤害。`,'heal');}
    if(action.a===3){const damage=dealEnemyDamageV2882(enemy,Math.min(enemy.hp,Math.max(1,Math.floor(getAtk()*.35-enemy.def*.2))),false,'companion');showDamageNumber(damage,'enemy',false,false,true,false,name+'·集火');addCombatLog(`${name}协同集火，造成 ${damage} 伤害。`,'pet');}
    addCombatLog('☯ 同伴 '+s.status+' · 灵力 '+s.mp+'/60','pet');updateCombatUI();updateStats();
    if(enemy.hp<=0){checkBattleEnd();return;}return next();
  }finally{s.locked=false;}
}
function companionGuardV2849(damage){const s=companionBattleV2849();if(!s?.guard||damage<=0)return damage;s.guard=false;const next=Math.max(1,Math.floor(damage*.8));addCombatLog('同伴护卫抵消 '+(damage-next)+' 点伤害。','heal');return next;}
function renderCompanionV2849(){
  const panel=document.getElementById('combatPanel');if(!panel)return;let box=document.getElementById('companionBattleV2849');
  if(!box){box=document.createElement('section');box.id='companionBattleV2849';box.setAttribute('role','status');box.setAttribute('aria-live','polite');panel.insertBefore(box,document.getElementById('combatArena'));}
  const s=companionBattleV2849();box.hidden=!s;if(!s)return;const ready=companionActionsV2849(s),cooldowns=ALLY_ACTIONS_V2849.filter(a=>a.a!==0&&(s.cooldowns[a.a]||0)>s.turn).map(a=>a.name+'还需'+(s.cooldowns[a.a]-s.turn)+'支援回合');box.textContent=ROMANCE_NPCS[s.id].name+' · 同伴灵力 '+s.mp+'/60 · '+s.status+' · 当前可用：'+(ready.map(a=>a.name).join('/')||'暂无')+(cooldowns.length?' · '+cooldowns.join('、'):'');
}
window.addEventListener('xiantu:combat-finishing',()=>{
  recordRivalFinishV2874();
  companionVictoryBondV2875();
  if(currentEnemy?._nightRivalV2810&&!NPC_JEV_V2849.rivalRecorded.has(currentEnemy)&&COMBAT_FINISH_V2764.pending?.owner===player){
    NPC_JEV_V2849.rivalRecorded.add(currentEnemy);const h=rivalHistoryV2849();if(COMBAT_FINISH_V2764.pending.kind==='victory')h.wins=Math.min(h.duels,h.wins+1);player.rivalHistoryV2849=h;autoSave();
  }
  const pending=JEV_WORLD_V2846.pending;if(pending){pending.cancel();pending.controller?.abort();}
});
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2849-npc-jev.js']='28.68.74';

// Rival trial records use entry-realm snapshots; rewards are claimed outside combat.
const RIVAL_STYLES_V2874={sword:['兵刃剑枪','折锋障','防御提高12%'],thunder:['九天雷法','吞雷引','攻击提高10%'],fire:['焚世真火','寂灭灰','攻击提高10%'],ice:['玄冥寒冰','沸血煞','防御提高12%'],heal:['青莲生机','断生印','攻击提高10%']};
function rivalStyleV2874(){
 const load=ensureSkillLoadoutV212(),keys=Object.keys(RIVAL_STYLES_V2874);let key='sword',best=-1;
 for(const k of keys){const n=Array.isArray(load?.[k])?load[k].length:0;if(n>best){best=n;key=k;}}
 return key;
}
function normalizeRivalChronicleV2874(raw){
 const r=raw&&typeof raw==='object'?raw:{},realms=v=>[...new Set((Array.isArray(v)?v:[]).filter(x=>Number.isInteger(x)&&x>=0&&x<CULTIVATION_REALMS.length))],n=(x,max)=>Number.isFinite(Number(x))?Math.min(max,Math.max(0,Math.floor(Number(x)))):0;
 const qualified=realms(r.qualified),claimed=realms(r.claimed);
 return {version:1,qualified:[...new Set([...qualified,...claimed])],claimed,logs:(Array.isArray(r.logs)?r.logs:[]).slice(-24).filter(x=>x&&typeof x==='object').map(x=>({date:typeof x.date==='string'?x.date.slice(0,80):'',realm:n(x.realm,16),foe:n(x.foe,16),style:Object.hasOwn(RIVAL_STYLES_V2874,x.style)?x.style:'sword',counter:!!x.counter,turns:n(x.turns,999),self:n(x.self,100),enemy:n(x.enemy,100),trial:!!x.trial,result:['victory','defeat','survived','flee'].includes(x.result)?x.result:'flee'}))};
}
const rivalBattlesV2874=new WeakMap();
function initRivalTrialV2874(enemy){
 if(!enemy?._nightRivalV2810||rivalBattlesV2874.has(enemy))return;
 const style=rivalStyleV2874(),counter=rivalHistoryV2849().duels>0,realm=Math.max(0,Math.min(16,Math.floor(Number(player.level)||0)));
 rivalBattlesV2874.set(enemy,{owner:player,token:COMBAT_FINISH_V2764.token,realm,style,counter,turns:0,trial:enemy._rivalTrialV2874===true,logged:false});
 if(counter){if(style==='sword'||style==='ice')enemy.def=Math.round(enemy.def*1.12);else enemy.atk=Math.round(enemy.atk*1.10);addCombatLog(`宿敌识破【${RIVAL_STYLES_V2874[style][0]}】· ${RIVAL_STYLES_V2874[style][1]}：${RIVAL_STYLES_V2874[style][2]}。`,'boss');}
}
function rivalTurnCompletedV2874(enemy,owner,token){
 const s=rivalBattlesV2874.get(enemy);if(!s||s.token!==token||token!==COMBAT_FINISH_V2764.token||s.owner!==owner||player!==owner||currentEnemy!==enemy||gameState!=='combat'||!isPlayerTurn||player.hp<=0||enemy.hp<=0||COMBAT_FINISH_V2764.settling)return;
 s.turns++;if(s.trial&&s.turns>=6){s.passed=true;addCombatLog('六合问锋已成，夜无疆收招。返回交锋纪事碑领取本境首通奖励。','gold');queueCombatFinishV2764('flee',{label:'问锋完成 · 返回领取',delay:650});}
}
function recordRivalFinishV2874(){
 const enemy=currentEnemy,s=enemy&&rivalBattlesV2874.get(enemy),p=COMBAT_FINISH_V2764.pending;if(!s||s.logged||s.owner!==player||p?.owner!==player)return;
 s.logged=true;const state=normalizeRivalChronicleV2874(player.rivalChronicleV2874),result=s.passed?'survived':p.kind;
 if(s.trial&&(result==='survived'||result==='victory')&&!state.qualified.includes(s.realm))state.qualified.push(s.realm);
 state.logs.push({date:getGameDateLabel(),realm:s.realm,foe:enemy._realmLevel||0,style:s.style,counter:s.counter,turns:s.turns,self:Math.max(0,Math.min(100,Math.round(player.hp/Math.max(1,getMaxHp())*100))),enemy:Math.max(0,Math.min(100,Math.round(enemy.hp/Math.max(1,enemy.maxHp)*100))),trial:s.trial,result});
 state.logs=state.logs.slice(-24);player.rivalChronicleV2874=state;
}
let rivalViewV2874=null,rivalViewSerialV2874=0;
function rivalViewValidV2874(token){return jevCanActV2846()&&rivalViewV2874?.token===token&&rivalViewV2874.owner===player&&!!document.getElementById('rivalMonumentV2874')&&!document.getElementById('storyPanel')?.classList.contains('hidden');}
function startRivalTrialV2874(token){
 if(!rivalViewValidV2874(token)||player.hp<=getMaxHp()*.25)return false;
 const owner=player,stamp=()=>JSON.stringify([player.level,player.phase,player.hp,player.mp,player.skillLoadoutV212,player.rivalHistoryV2849]),before=stamp(),enemy=createYeWujiV2810();
 if(!confirm(`问锋试炼：${getEnemyRealmNameV2811(enemy)}。撑过6个完整敌方回合或直接击退即达成；败北不扣灵石。每境首通只领一次，重复演练无奖励。继续？`)||owner!==player||!rivalViewValidV2874(token)||before!==stamp())return false;
 enemy._rivalTrialV2874=true;closeJevWorldV2846();closeWorldOverlay();startCombat(enemy,true,false);addCombatLog('六合问锋：完成6个敌方回合并存活，或击退宿敌。奖励在纪事碑领取；首次交手不加反制。','boss');return true;
}
function claimRivalTrialV2874(realm,token){
 if(!rivalViewValidV2874(token))return false;
 const s=normalizeRivalChronicleV2874(player.rivalChronicleV2874);if(!s.qualified.includes(realm)||s.claimed.includes(realm))return false;
 const owner=player,before=JSON.stringify(player);s.claimed.push(realm);player.rivalChronicleV2874=s;player.gold+=300+realm*180;player.exp+=160+realm*95;
 try{if(!saveGame())throw Error('save failed');}catch(_){for(const k of Object.keys(owner))delete owner[k];Object.assign(owner,JSON.parse(before));if(owner.activePet?._petId)owner.activePet=owner.pets.find(p=>p._petId===owner.activePet._petId)||null;showFloatingText('记录未保存，奖励未领取，请重试','#ff8a80');return false;}
 checkLevelUp();updateStats();showRivalMonumentV2874();return true;
}
function showRivalMonumentV2874(){
 if(!jevCanActV2846())return;
 const s=normalizeRivalChronicleV2874(player.rivalChronicleV2874),h=rivalHistoryV2849(),style=rivalStyleV2874(),info=RIVAL_STYLES_V2874[style],token=++rivalViewSerialV2874,esc=escapeGameText;
 rivalViewV2874={token,owner:player};
 let html=`<section class="sect-board-v2866"><h3 id="rivalMonumentV2874">夜无疆 · 交锋纪事碑</h3><p>交锋${h.duels}次 · 击退${h.wins}次 · 已领取${s.claimed.length}境试炼奖励</p><p>按携带功法数量识别主流派，同数优先剑、雷、火、冰、治疗。当前${info[0]}；${h.duels?`下次运转${info[1]}，${info[2]}`:'首次交手不施加反制'}。战斗中不重新识别；普通挑战也沿用此规则。</p><h4>六合问锋</h4><p>撑过6个完整敌方回合（控制跳过也计一回合）或直接击退。夜无疆仍止步半圣圆满；试炼败北不扣灵石，普通挑战败北仍按原规则扣款。</p><p>每境界仅一次首通奖励，按入场境界计算；凡人起300灵石/160修为，每升一境增加180灵石/95修为。重复演练无奖励。需要气血超过25%。</p><button class="choice-btn" onclick="startRivalTrialV2874(${token})" ${player.hp>getMaxHp()*.25?'':'disabled'}>开启六合问锋试炼</button>`;
 for(const realm of s.qualified.filter(r=>!s.claimed.includes(r)))html+=`<button class="choice-btn" onclick="claimRivalTrialV2874(${realm},${token})">领取${CULTIVATION_REALMS[realm].name}首通：${300+realm*180}灵石、${160+realm*95}修为</button>`;
 const labels={victory:'正面击退',defeat:'交锋落败',survived:'六合问锋达成',flee:'交锋退场'};
 html+='<h4>最近24次交锋</h4>'+(s.logs.length?s.logs.slice().reverse().map(l=>`<article><h4>${labels[l.result]} · ${l.trial?'试炼':'挑战'}</h4><p>${esc(l.date)} · 完整敌方回合${l.turns}</p><p>你：${CULTIVATION_REALMS[l.realm].name}，余血${l.self}% · 对手：${CULTIVATION_REALMS[l.foe].name}，余血${l.enemy}%</p><p>${RIVAL_STYLES_V2874[l.style][0]} · ${l.counter?RIVAL_STYLES_V2874[l.style][1]:'初见未反制'}</p></article>`).join(''):'<p>尚无交锋记录。</p>');
 showStory(html+'</section>',[{text:'返回夜无疆人物页',action:'yewuji_v2810'},{text:'返回地图',action:'return_to_map'}]);
}

function companionVictoryBondV2875(){
 const p=COMBAT_FINISH_V2764.pending,s=currentEnemy&&NPC_JEV_V2849.allies.get(currentEnemy);
 if(!s||s.owner!==player||s.id!==companionIdV2849()||!s.actionsV2875||s.winProcessedV2875||p?.owner!==player||p.kind!=='victory')return false;
 s.winProcessedV2875=true;const day=relationshipDayV2852(),last=Number.isInteger(player.companionWinDayV2875)?player.companionWinDayV2875:-1;
 if(day<=last)return false;
 const priorDay=player.companionWinDayV2875,prior=JSON.parse(JSON.stringify(player.romance.npcs[s.id])),cap=s.id==='suwanqing'?getSuAffectionCap():100;
 player.companionWinDayV2875=day;const gain=prior.affection<cap?Math.max(0,addAffection(s.id,1)):0;
 try{if(!saveGame())throw Error('save failed');}catch(_){player.romance.npcs[s.id]=prior;if(priorDay===undefined)delete player.companionWinDayV2875;else player.companionWinDayV2875=priorDay;return false;}
 if(gain)addCombatLog(`并肩同心：${ROMANCE_NPCS[s.id].name}好感+${gain}（每日首次实际参战胜利）`,'heal');return true;
}
