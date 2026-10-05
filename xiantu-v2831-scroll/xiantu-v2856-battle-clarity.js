/* V28.68: event-driven battle readout. No polling, new turns or state mutation. */
(function(W,D){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const count=n=>Math.max(0,Math.floor(Number(n)||0));
  function read(){
    if(typeof player==='undefined'||!player||typeof currentEnemy==='undefined'||!currentEnemy||!['combat','combat-ending'].includes(gameState))return null;
    const ending=gameState==='combat-ending',chips=[];
    const push=(side,text)=>chips.push({side,text});
    if(!ending){
      const guard=guardsV2785.get(currentEnemy),gear=gearBattleV2790.get(currentEnemy),enemy=monsterStateV2844();
      if(guard?.owner===player&&guard.ratio>0)push('self',`护体 · 下次减伤${Math.round(guard.ratio*100)}%`);
      if(gear?.owner===player&&gear.guard)push('self','镇岳霸体 · 抵挡下次命中');
      if(player._thunderArmorTurns>0)push('self',`雷甲 · 余${count(player._thunderArmorTurns)}回合`);
      if(playerPressureStun)push('self','受威压震慑 · 下次行动可能受阻');
      if(playerPressureTurns>0)push('self',`威压削弱 · 余${count(playerPressureTurns)}次行动`);
      if(enemy?.guard)push('enemy','敌方护体 · 抵挡部分下次伤害');
      if(skipEnemyTurn||currentEnemy._pressureStun)push('enemy',`敌方${currentEnemy._skipReason||'受控'} · 下次停手`);
      if(currentEnemy.burnTurns>0&&currentEnemy.burnStacks>0)push('enemy',`灼烧 · ${count(currentEnemy.burnStacks)}点×${count(currentEnemy.burnTurns)}次`);
      if(currentEnemy.thunderDomainTurns>0&&currentEnemy.thunderDomainDamage>0)push('enemy',`雷域 · ${count(currentEnemy.thunderDomainDamage)}点×${count(currentEnemy.thunderDomainTurns)}次`);
      if(currentEnemy._pressureTurns>0)push('enemy',`敌方威压削弱 · 余${count(currentEnemy._pressureTurns)}次行动`);
    }
    return {hp:count(player.hp),maxHp:count(getMaxHp()),mp:count(player.mp),maxMp:count(getMaxMp()),ending,waiting:!ending&&!isPlayerTurn,turn:ending?'本场结算中':isPlayerTurn?'我方可行动':'行动结算中',chips};
  }
  function installReportLog(){
    const log=D.getElementById('combatLog');
    if(!log||D.getElementById('reportLogV2857'))return;
    const fold=D.createElement('details');fold.id='reportLogV2857';
    const summary=D.createElement('summary');summary.textContent='详细战报 · 点击展开 / 收起';
    fold.appendChild(summary);log.parentNode.insertBefore(fold,log);fold.appendChild(log);
  }
  function sync(){
    installReportLog();
    const panel=D.getElementById('combatPanel'),arena=D.getElementById('combatArena');if(!panel||!arena)return;
    const data=read();let box=D.getElementById('battleReadoutV2856');
    if(!data){if(box)box.hidden=true;return;}
    if(!box){box=D.createElement('section');box.id='battleReadoutV2856';box.className='battle-readout-v2856';box.setAttribute('aria-label','战斗行动与持续状态');panel.insertBefore(box,arena);}
    box.hidden=false;
    const markup=`<div class="battle-vitals-v2865"><span class="hp">气血 <b>${data.hp} / ${data.maxHp}</b></span><span class="mp">灵力 <b>${data.mp} / ${data.maxMp}</b></span></div><div class="battle-readout-head-v2856"><strong>${esc(data.turn)}</strong><span>${data.ending?'奖励按战斗结果结算':data.waiting?'等待本次行动完成':'选择攻击、招式或补给'}</span></div>${data.chips.length?`<div class="battle-chip-list-v2856">${data.chips.map(c=>`<span class="battle-chip-v2856 ${c.side}">${esc(c.text)}</span>`).join('')}</div>`:''}`;
    if(box._markupV2856!==markup){box.innerHTML=markup;box._markupV2856=markup;}
    box.classList.toggle('waiting',data.waiting);
    // Lock stale attack buttons during an in-flight action. Reading tabs stays available.
    for(const b of D.getElementById('combatChoices')?.querySelectorAll('button')||[]){
      if(!/^combat\(/.test(b.getAttribute('onclick')||''))continue;
      if(data.waiting&&!b.dataset.waitLockV2856){b.dataset.waitLockV2856=b.disabled?'disabled':'enabled';b.disabled=true;}
      else if(!data.waiting&&b.dataset.waitLockV2856){b.disabled=b.dataset.waitLockV2856==='disabled';delete b.dataset.waitLockV2856;}
    }
    updateCombatMpV2820();
  }
  // Wrapping after existing integrations keeps their return values and timing intact.
  for(const name of ['updateCombatUI','updateCombatChoices','combat','enemyTurn','useCombatBagItem','completeCombatFinishV2764','setBattlePresentationV2756']){
    const base=W[name];if(typeof base==='function')W[name]=function(...args){const result=base.apply(this,args);sync();return result;};
  }
  W.addEventListener('xiantu:combat-finishing',sync);
  W.BattleClarityV2856={read,sync};
})(window,document);
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2856-battle-clarity.js']='28.68';
