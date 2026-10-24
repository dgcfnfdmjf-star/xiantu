/* Bounded monster decisions. Optional remote choices never own combat state. */
const MONSTER_JEV_V2844 = { enabled: JEV_DEVICE_V2845.monster && !!FORGE_ADVICE_V2842.access, states: new WeakMap(), pending: null };
const MONSTER_ACTIONS_V2844 = Object.freeze({
  probe:{label:'挑衅试探',cost:8,cooldown:2},rally:{label:'同门援阵',cost:20,cooldown:4},retreat:{label:'收势撤退',cost:0,cooldown:0},
  attack:{label:'普通攻击',cost:0,cooldown:0}, heavy:{label:'蓄力重击',cost:18,cooldown:2},
  guard:{label:'凝气护体',cost:10,cooldown:3}, recover:{label:'吐纳回气',cost:0,cooldown:2},
  heal:{label:'妖元回生',cost:28,cooldown:4}, spell:{label:'本命术法',cost:32,cooldown:3}
});
function monsterEligibleV2844() {
  return !!currentEnemy && !isTribulation && !currentEnemy._isTutorial && !currentEnemy.tournamentFight;
}
function initMonsterAiV2844() {
  cancelMonsterJevV2844('changed');
  if(currentEnemy)MONSTER_JEV_V2844.states.delete(currentEnemy);
  if(!monsterEligibleV2844())return;
  MONSTER_JEV_V2844.states.set(currentEnemy,{owner:player,token:COMBAT_FINISH_V2764.token,round:0,mp:100,heals:0,cooldowns:{},guard:false,locked:false,requests:0,lastRequestRound:-3,failed:false,status:'本地策略 · 等待出招'});
}
function monsterStateV2844() {
  const s=currentEnemy && MONSTER_JEV_V2844.states.get(currentEnemy);
  return s && s.owner===player && s.token===COMBAT_FINISH_V2764.token ? s : null;
}
function monsterSpellV2844() {
  if(isBossFight && currentEnemy?.phases) {
    const data=getCombatBossData(currentEnemy),skill=data?.skills?.[Math.max(0,Math.min(currentBossPhase-1,(data?.skills?.length||1)-1))];
    if(skill && Number(skill.damage)>0)return {...skill,damage:Math.min(5,Number(skill.damage)),mpCost:32};
  }
  const name=currentEnemy?.name||'';
  if(!/妖|魔|鬼|灵|龙|凤|狐|雷|冰|火|魂/.test(name))return null;
  return {name:/冰|寒|霜/.test(name)?'寒霜吐息':/火|焰|凤/.test(name)?'妖焰冲击':/雷/.test(name)?'雷芒迸发':'妖气冲击',damage:1.4,mpCost:32};
}
function monsterAvailableV2844(s=monsterStateV2844()) {
  if(!s)return ['attack'];
  return Object.keys(MONSTER_ACTIONS_V2844).filter(key=>{
    const action=MONSTER_ACTIONS_V2844[key];
    if(s.mp<action.cost || (s.cooldowns[key]||0)>s.round)return false;
    if(key==='probe')return !!hostileKindV2849();
    if(key==='rally')return !!hostileKindV2849()&&hostileKindV2849()!=='rival'&&!(s.supportTurns>0);
    if(key==='retreat')return hostileCanRetreatV2849()&&currentEnemy.hp<=currentEnemy.maxHp*.25;
    if((key==='spell'||key==='heal') && currentEnemy._spellSealTurnsV286817>0)return false;
    if(key==='spell')return !!monsterSpellV2844();
    if(key==='heal'&&currentEnemy._originV286826?.collapsed)return false;
    if(key==='heal'&&currentEnemy.burnTurns>0&&currentEnemy._burnHealBlockV286818)return false;
    if(key==='heal')return (isBossFight||/凤|狐|血/.test(currentEnemy.name))&&s.heals<2&&currentEnemy.hp<=currentEnemy.maxHp*.92;
    if(key==='recover')return s.mp<=78;
    return true;
  });
}
function monsterSnapshotV2844(s) {
  const pct=(a,b)=>Math.max(0,Math.min(100,Math.round(Number(a)/Math.max(1,Number(b))*100)||0));
  return {task:'monster',version:1,...hostileExtraSnapshotV2849(s),round:Math.min(999,s.round),phase:Math.max(1,Math.min(4,currentBossPhase||1)),
    enemyHp:pct(currentEnemy.hp,currentEnemy.maxHp),enemyMp:s.mp,playerHp:pct(player.hp,getMaxHp()),playerMp:pct(player.mp,getMaxMp()),
    playerGuard:guardsV2785.get(currentEnemy)?.owner===player,enemyWeakened:(currentEnemy._pressureTurns||0)>0,
    spellPower:monsterSpellV2844()?.damage||0,available:monsterAvailableV2844(s)};
}
function monsterLocalPickV2844(s) {
  const a=monsterAvailableV2844(s),hp=currentEnemy.hp/Math.max(1,currentEnemy.maxHp),weak=player.hp/getMaxHp()<=.25;
  if(hp<=.18&&a.includes('retreat'))return 'retreat';
  if(a.includes('rally')&&s.round>1&&hp>.4)return 'rally';
  if(a.includes('probe')&&s.round===1)return 'probe';
  if(hp<=.35&&a.includes('heal'))return 'heal';
  if(!weak&&s.mp<24&&a.includes('recover'))return 'recover';
  if(!weak&&hp<.55&&s.round%3===0&&a.includes('guard'))return 'guard';
  if(guardsV2785.get(currentEnemy)?.owner===player&&a.includes('recover'))return 'recover';
  if(a.includes('spell'))return 'spell';
  if(a.includes('heavy'))return 'heavy';
  return 'attack';
}
function renderMonsterAiV2844() {
  const panel=document.getElementById('combatPanel');if(!panel)return;
  let box=document.getElementById('monsterAiV2844');
  if(!box){
    box=document.createElement('section');box.id='monsterAiV2844';
    box.innerHTML='<div class="monster-ai-top"><b>敌方灵力 <span id="monsterMpV2844"></span></b><span id="monsterAiSourceV2844" role="status" aria-live="polite"></span></div><meter id="monsterMpMeterV2844" min="0" max="100" value="100" aria-label="敌方灵力"></meter><details><summary>妖兽 / 敌修推演设置</summary><p>重击、护体、回气；部分妖兽与首领拥有术法及回血。敌对修士可挑衅试探、召唤援阵，普通游荡敌修残血时可能撤退；首领与任务敌人不会撤退。每次行动扣灵力、受回合冷却限制；回血每场最多两次。护体只减免下一次主角直接命中，至下个敌方回合失效。</p><p id="monsterMovesV2844"></p><p>开启后后续战斗也可调用 Jev：不设单场次数上限，至少间隔 3 个敌方回合和 12 秒；超过 1.5 秒用本地策略。会产生接口用量；勾选记住本设备后会恢复开关，关闭后也会记住关闭状态。</p>'+(typeof jevFriendsModeV2850==='function'&&jevFriendsModeV2850()?jevFriendsControlsV2850()+'<button type="button" onclick="enableMonsterJevV2844()">开启敌方 Jev</button><button type="button" onclick="disableMonsterJevV2844()">关闭敌方 Jev</button>':'<label for="monsterAccessV2844">游戏访问口令（JEV_ACCESS_TOKEN）</label><input id="monsterAccessV2844" type="password" maxlength="128" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="已解锁洗练时可留空">'+jevRememberHtmlV2845('monster')+'<div class="monster-ai-buttons"><button type="button" onclick="enableMonsterJevV2844()">开启怪兽 Jev</button><button type="button" onclick="disableMonsterJevV2844()">关闭怪兽 Jev</button><button type="button" onclick="clearJevDeviceV2845();renderMonsterAiV2844()">清除此设备口令</button></div>')+'<p id="monsterAiSettingV2844" role="status"></p></details>';
    panel.insertBefore(box,document.getElementById('combatArena'));
  }
  const s=monsterStateV2844();box.hidden=!s;if(!s)return;
  document.getElementById('monsterMpV2844').textContent=s.mp+' / 100';
  document.getElementById('monsterMpMeterV2844').value=s.mp;
  document.getElementById('monsterAiSourceV2844').textContent=s.status;
  document.getElementById('monsterAiSettingV2844').textContent=MONSTER_JEV_V2844.enabled?'Jev 已开启 · 本场请求 '+s.requests+' 次':'Jev 已关闭 · 使用本地策略';
  syncJevRememberUiV2845();
  document.getElementById('monsterMovesV2844').textContent='当前可用：'+monsterAvailableV2844(s).map(k=>MONSTER_ACTIONS_V2844[k].label).join('、')+'。重击 18 灵力 / 间隔 2 回合，术法 32 / 间隔 3，护体 10 / 间隔 3，回气 +22 / 间隔 2，回血 28 / 间隔 4（恢复 8% 气血）。';
}
function enableMonsterJevV2844() {
  if(typeof jevFriendsModeV2850==='function'&&jevFriendsModeV2850()){
    if(JEV_FRIENDS_V2850.paused)retryJevFriendsV2850();
    MONSTER_JEV_V2844.enabled=true;saveJevDeviceV2845();const s=monsterStateV2844();if(s)s.failed=false;renderMonsterAiV2844();return;
  }
  const input=document.getElementById('monsterAccessV2844'),token=input?.value.trim()||FORGE_ADVICE_V2842.access;
  if(input)input.value='';
  if(!validJevAccessV2845(token)){
    document.getElementById('monsterAiSettingV2844').textContent='请填写 16—128 位游戏访问口令，不是 API 密钥。';return;
  }
  cancelMonsterJevV2844('changed');
  FORGE_ADVICE_V2842.access=token;FORGE_ADVICE_V2842.cache.clear();MONSTER_JEV_V2844.enabled=true;saveJevDeviceV2845();
  const s=monsterStateV2844();if(s)s.failed=false;
  renderMonsterAiV2844();
}
function cancelMonsterJevV2844(reason='disabled') {
  const p=MONSTER_JEV_V2844.pending;
  if(p){p.cancel(reason);p.controller?.abort();}
}
function disableMonsterJevV2844() {
  MONSTER_JEV_V2844.enabled=false;saveJevDeviceV2845();cancelMonsterJevV2844();renderMonsterAiV2844();
}
function monsterGuardDamageV2844(damage) {
  const s=monsterStateV2844();if(!s?.guard||damage<=0)return damage;
  s.guard=false;const after=Math.max(1,Math.floor(damage*.7));
  addCombatLog(`敌方护体抵消 ${damage-after} 点直接伤害，护体消散。`,'boss');return after;
}
function commitMonsterActionV2844(decision) {
  const s=monsterStateV2844();
  let choice=decision.choice;
  if(!s||!monsterAvailableV2844(s).includes(choice))choice='attack';
  const action=MONSTER_ACTIONS_V2844[choice];
  if(s){s.mp=Math.max(0,s.mp-action.cost);s.cooldowns[choice]=s.round+action.cooldown;s.status=(decision.source==='jev'?'天机推演':'本地策略')+' · '+action.label+(decision.note?' · '+decision.note:'');}
  addCombatLog(`${decision.source==='jev'?'☯ 天机推演':'◇ 本地策略'}：${currentEnemy.name}选择【${action.label}】${action.cost?`，消耗 ${action.cost} 灵力`:''}。`,'boss');
  let skill=null,utility=false;
  if(choice==='retreat'&&hostileWithdrawV2849())return {utility:true,ended:true};
  if(choice==='probe')skill={name:'挑衅·试锋',damage:.85,mpCost:8};
  if(choice==='rally'){s.supportTurns=2;utility=true;addCombatLog('敌修召同门灵影结阵，后续两次直接攻击伤害提升15%。','boss');}
  if(choice==='heavy')skill={name:'蓄力重击',damage:1.25,mpCost:18};
  if(choice==='spell')skill=monsterSpellV2844();
  if(choice==='guard'){s.guard=true;utility=true;addCombatLog('敌方凝气护体，等待下一次主角直接攻击。','boss');}
  if(choice==='recover'){const gain=Math.min(22,100-s.mp);s.mp+=gain;utility=true;addCombatLog(`敌方吐纳，恢复 ${gain} 点灵力。`,'boss');}
  if(choice==='heal'){const gain=Math.max(0,Math.min(currentEnemy.maxHp-currentEnemy.hp,Math.floor(currentEnemy.maxHp*.08)));currentEnemy.hp+=gain;s.heals++;utility=true;showDamageNumber(gain,'enemy',true,false,false,false,'妖元回生');addCombatLog(`敌方回生，恢复 ${gain} 点气血（本场 ${s.heals}/2 次）。`,'boss');}
  renderMonsterAiV2844();
  return {skill,utility};
}
function runMonsterTurnV2844(resolve) {
  const s=monsterStateV2844();
  if(!s)return resolve();
  if(s.locked)return;
  s.guard=false;
  if(currentEnemy._pressureStun||skipEnemyTurn||currentEnemy.hp<=0)return resolve();
  s.locked=true;s.round++;
  const owner=player,enemy=currentEnemy,token=s.token;
  const fresh=()=>owner===player&&enemy===currentEnemy&&COMBAT_FINISH_V2764.token===token&&gameState==='combat'&&!isPlayerTurn&&!COMBAT_FINISH_V2764.settling;
  const apply=(choice,source='local',note='')=>{
    if(!fresh()){s.locked=false;return;}
    if(currentEnemy.hp<=0){s.locked=false;checkBattleEnd();return;}
    try{resolve({choice,source,note},()=>{s.locked=false;});}catch(error){s.locked=false;throw error;}
  };
  const endpoint=forgeJevEndpointV2842(),snapshot=monsterSnapshotV2844(s);
  if(!MONSTER_JEV_V2844.enabled||!FORGE_ADVICE_V2842.access||!endpoint||document.hidden||s.failed||s.round-s.lastRequestRound<3||Date.now()<FORGE_ADVICE_V2842.nextAt||FORGE_ADVICE_V2842.busy||snapshot.available.length<2) {
    return apply(monsterLocalPickV2844(s),'local',s.failed?'云端暂不可用':'');
  }
  if(typeof jevReserveV2846==='function')jevReserveV2846();
  const controller=typeof AbortController==='function'?new AbortController():null;
  let cancel,timer;
  const cancelled=new Promise((_,reject)=>{cancel=why=>reject(Error(why));});
  const pending={controller,cancel};MONSTER_JEV_V2844.pending=pending;FORGE_ADVICE_V2842.busy=pending;
  s.requests++;s.lastRequestRound=s.round;FORGE_ADVICE_V2842.nextAt=Date.now()+12000;
  s.status='Jev 判断中 · 最多 1.5 秒';renderMonsterAiV2844();
  return (async()=>{
    let choice,source='local',note='';
    try {
      const data=await Promise.race([
        (async()=>{
          const r=await (typeof jevFetchV2850==='function'?jevFetchV2850:fetch)(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Xiantu-Access':FORGE_ADVICE_V2842.access},body:JSON.stringify(snapshot),credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller?.signal});
          if(!r.ok)throw Error(String(r.status));const value=await r.json();if(typeof jevUsageV2846==='function')jevUsageV2846(value);return value;
        })(),cancelled,
        new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('timeout'));controller?.abort();},1500);})
      ]);
      if(!fresh())return;
      if(data?.source!=='jev'||data.task!=='monster'||!snapshot.available.includes(data.choice)||typeof data.confidence!=='number'||!Number.isFinite(data.confidence)||data.confidence<0||data.confidence>1)throw Error('format');
      if(JSON.stringify(monsterSnapshotV2844(s))!==JSON.stringify(snapshot))note='战况变化';
      else if(data.confidence<.7)note='云端把握不足';
      else if(MONSTER_JEV_V2844.enabled){choice=data.choice;source='jev';}
    } catch(error) {
      if(!fresh())return;
      note=({'401':'口令不符','403':'域名未放行','400':'请更新云函数','429':'云端限流',timeout:'响应超时',disabled:'已关闭',changed:'设置变化'})[error.message]||'云端暂不可用';
      if(!['disabled','changed'].includes(error.message))s.failed=true;
    } finally {
      clearTimeout(timer);
      if(MONSTER_JEV_V2844.pending===pending)MONSTER_JEV_V2844.pending=null;
      if(FORGE_ADVICE_V2842.busy===pending)FORGE_ADVICE_V2842.busy=null;
      if(!fresh())s.locked=false;
    }
    if(fresh())apply(choice||monsterLocalPickV2844(s),source,note);
  })();
}
window.addEventListener('xiantu:combat-finishing',()=>cancelMonsterJevV2844('changed'));
window.addEventListener('pagehide',()=>{cancelMonsterJevV2844('disabled');});
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2844-monster-jev.js']='28.68.56';
