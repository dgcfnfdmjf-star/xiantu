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
      const abyss=typeof abyssBattleV2882==='function'?abyssBattleV2882(currentEnemy):null;
      if(abyss){
        push('enemy',['','一重 · 万名渡骨','二重 · 窃忆魔相','三重 · 归墟同葬'][abyss.stage]);
        if(abyss.shield>0)push('enemy',`千魂骨盾 ${abyss.shield} · 吸收每击60%`);
        if(abyss.guard>0&&abyss.turn<2)push('self',`断链护盾 ${abyss.guard} · 余${Math.max(0,2-abyss.turn)}次行动`);
      }
      const elite=typeof eliteBattleV2883==='function'?eliteBattleV2883(currentEnemy):null;
      if(elite){
        push('enemy',ELITES_V2883[elite.id].trait);
        if(elite.shield>0)push('enemy',`玄岩盾 ${elite.shield} · 吸收65%`);
        if(elite.enraged)push('enemy','霜狼狂嗥 · 攻击+25%');
        if(elite.undying)push('enemy','魔甲燃血 · 不屈已用 · 攻击+30%');
        if(elite.marks)push('enemy',`天罚雷印 ${elite.marks}/2`);
        if(elite.web)push('self','蚀脉蛛网 · 下次直接伤害-15%');
      }
      const origin=currentEnemy._originV286826;
      if(origin)push('enemy',origin.collapsed?'道基崩裂 · 攻击+20% · 禁疗 · 行动自损4%':`魔典燃源 ${Math.min(3,origin.turns)}/3 · 攻击+10% · 防御+25%`);
      const tactics=tacticsV286821.get(currentEnemy);
      if(weaknessV286821(currentEnemy))push('enemy',weaknessTextV286821(currentEnemy));
      if(tactics?.owner===player){
        if(tactics.builds.sword)push('self',`纯阳剑意 · 剑气 ${tactics.marks}/3`);
        if(tactics.builds.thunder)push('self','五雷回流 · 雷甲承击回灵');
        if(tactics.builds.guard)push('self','不动护体 · 盾中减伤10%');
      }
      const guard=guardsV2785.get(currentEnemy),gear=gearBattleV2790.get(currentEnemy),enemy=monsterStateV2844();
      if(guard?.owner===player&&guard.ratio>0)push('self',`护体 · 下次减伤${Math.round(guard.ratio*100)}%`);
      if(gear?.owner===player&&gear.guard)push('self','镇岳霸体 · 抵挡下次命中');
      if(player._thunderArmorTurns>0)push('self',`雷甲 · 余${count(player._thunderArmorTurns)}回合`);
      if(playerPressureStun)push('self','受威压震慑 · 下次行动可能受阻');
      if(playerPressureTurns>0)push('self',`威压削弱 · 余${count(playerPressureTurns)}次行动`);
      if(enemy?.guard)push('enemy','凝气护体 · 下次减伤30% · 雷系/暴击/重击可破');
      if(enemy?.supportTurns>0)push('enemy',`同门援阵 · 攻击+15% · 余${enemy.supportTurns}次攻击 · 招式/暴击可破`);
      const elemental=elementGuardsV286818.get(currentEnemy);
      if(elemental?.owner===player&&elemental.pool>0)push('self',`护盾 ${elemental.pool} · 余${elemental.turns}次行动`);
      if(currentEnemy._chillTurnsV286818>0)push('enemy',`寒迟 · 余${currentEnemy._chillTurnsV286818}次行动`);
      if(currentEnemy._iceBreakTurnsV286818>0)push('enemy','冰爆破甲25%');
      if(currentEnemy.burnTurns>0)push('enemy','灼烧破甲15%'+(currentEnemy._burnHealBlockV286818?' · 禁疗':''));
      if(currentEnemy.burnTurns>0&&currentEnemy._burnWeakV286818)push('enemy',`心火 · 攻击降低15% · 余${count(currentEnemy.burnTurns)}次主动出招`);
      if(currentEnemy._spellSealTurnsV286817>0)push('enemy',`封脉 · 余 ${currentEnemy._spellSealTurnsV286817} 次行动`);
      if(skipEnemyTurn||currentEnemy._pressureStun)push('enemy',`敌方${currentEnemy._skipReason||'受控'} · 下次停手`);
      if(currentEnemy.burnTurns>0&&currentEnemy.burnStacks>0)push('enemy',`灼烧 · ${count(currentEnemy.burnStacks)}点×${count(currentEnemy.burnTurns)}次`);
      if(currentEnemy.thunderDomainTurns>0&&currentEnemy.thunderDomainDamage>0)push('enemy',`雷域 · ${count(currentEnemy.thunderDomainDamage)}点×${count(currentEnemy.thunderDomainTurns)}次`);
      if(currentEnemy._pressureTurns>0)push('enemy',`敌方威压削弱 · 余${count(currentEnemy._pressureTurns)}次行动`);
    }
    const peak=typeof combatPeakV2886==='function'?combatPeakV2886():null;if(peak?.peakHit>0)push('self',`最高直击 ${Math.floor(peak.peakHit)} · ${peak.peakSkill} · 有效直击${peak.directHits}次`);
    return {hp:count(player.hp),maxHp:count(getMaxHp()),mp:count(player.mp),maxMp:count(getMaxMp()),ending,waiting:!ending&&!isPlayerTurn,turn:ending?'本场结算中':isPlayerTurn?'我方可行动':'行动结算中',chips};
  }
  function tip(text){
    const tips={
      '最高直击':'只统计主角普攻和伤害招式造成的实际扣血，护盾减免后计算，过量伤害不计；宠物、同伴、持续伤害与反伤不计。次数是有效直接命中数，不提供连击增益。',
      '凝气护体':'玩家直接命中的雷系招式、暴击，或护体减伤前伤害达到攻击面板115%的重击，可无视本次30%护体减伤并削减敌方最多15灵力。宠物、持续伤害和显示动画不触发。',
      '同门援阵':'敌方后续两次直接攻击伤害+15%；玩家直接招式或暴击命中可提前驱散。普通非暴击普攻、宠物与持续伤害不驱散。',
      '纯阳剑意':'兵刃招式命中积攒剑气，上限3层；满层后由普攻引爆，追加80%攻击力的单体贯穿伤害并清空印记。不是满层立即触发。',
      '五雷回流':'雷甲仍在持续时，承受攻击回复基础5点灵力，受所在区域恢复倍率及灵力上限限制。',
      '不动护体':'本场已激活此羁绊时，护体或元素盾有效期间额外减伤10%。',
      '镇岳霸体':'抵挡下一次命中的伤害，触发后消耗本次霸体。',
      '寒迟':`当前追击速度降低${Math.round((currentEnemy?._chillV286818||.3)*100)}%，攻击面板降低${Math.round(Math.min(.55,currentEnemy?._chillV286818||.3)*50)}%。持续次数见状态标签，不等同于冻结停手。`,
      '冰爆破甲':'有效期间敌方防御乘以75%；与灼烧破甲等按原公式叠乘，基础减防合计有50%下限。',
      '灼烧破甲':'灼烧有效期间敌方防御乘以85%；只有标签显示禁疗时才禁止回生。灼烧伤害和剩余次数另列。',
      '心火':'有效期间敌方主动出招攻击面板乘以85%，随灼烧持续次数结束。',
      '封脉':'持续期间禁用敌方术法和回生行动；普通攻击等其他合法行动仍可使用。',
      '魔典燃源':'夜无疆燃源阶段攻击+10%、防御+25%；第四次主动行动开始时进入道基崩裂。',
      '道基崩裂':'夜无疆攻击+20%，不能回生；每次主动行动前损失4%最大气血，自损最低保留1点气血，不会自行败亡。'
    };
    const key=Object.keys(tips).find(k=>text.includes(k));return key?tips[key]:`当前状态：${text}。数值与剩余次数随战斗更新，展开说明不会消耗行动。`;
  }
  function installReportLog(){
    const log=D.getElementById('combatLog');
    if(!log||D.getElementById('reportLogV2857'))return;
    const fold=D.createElement('details');fold.id='reportLogV2857';
    const summary=D.createElement('summary');summary.textContent='详细战报 · 点击展开 / 收起';
    fold.appendChild(summary);log.parentNode.insertBefore(fold,log);fold.appendChild(log);
  }
  let uiEnemy=null;
  function compactUi(data,panel,arena){
    panel.classList.add('battle-clean-v286816');
    let settings=D.getElementById('battleSettingsV286816');
    if(!settings){settings=D.createElement('details');settings.id='battleSettingsV286816';const title=D.createElement('summary');title.textContent='战斗设置';settings.appendChild(title);panel.appendChild(settings);}
    if(uiEnemy!==currentEnemy){uiEnemy=currentEnemy;settings.open=false;const full=D.getElementById('reportLogV2857');if(full)full.open=false;}
    const nodes=[D.querySelector('.ink-fx-toolbar-v2854'),D.getElementById('monsterAiV2844'),D.getElementById('battlePresentationBarV2756'),D.getElementById('autoStrategyV2819'),D.getElementById('cinemaLightBtnV2776')];
    for(const node of nodes)if(node&&node.parentNode!==settings)settings.appendChild(node);
    let status=D.getElementById('battleVitalsV286816');
    if(!status){status=D.createElement('section');status.id='battleVitalsV286816';status.setAttribute('aria-label','双方战斗状态');arena.appendChild(status);}
    const enemy=monsterStateV2844(),hp=count(currentEnemy.hp),max=count(currentEnemy.maxHp);
    const bar=(value,max,cls)=>`<span class="battle-meter-v286816 ${cls}" aria-hidden="true"><i style="width:${Math.min(100,value/Math.max(1,max)*100)}%"></i></span>`;
    const markup=`<div><b>${esc(player.name||'剑修')}</b><span>气血 ${data.hp}/${data.maxHp}</span>${bar(data.hp,data.maxHp,'hp')}<span>灵力 ${data.mp}/${data.maxMp}</span>${bar(data.mp,data.maxMp,'mp')}</div><div><b>${esc(currentEnemy.name)}</b><span>气血 ${hp}/${max}</span>${bar(hp,max,'foe')}${enemy?`<span>灵力 ${count(enemy.mp)}/100</span>${bar(count(enemy.mp),100,'mp')}`:''}</div>`;
    if(status._markup!==markup){status.innerHTML=markup;status._markup=markup;}
    syncRecentLog();
  }
  function syncRecentLog(){
    const arena=D.getElementById('combatArena'),log=D.getElementById('combatLog');if(!arena||!log)return;
    const summary=D.getElementById('reportLogV2857')?.querySelector('summary');if(summary)summary.textContent=`详细战报（最近 ${log.children.length} 条 / 最多120条） · 点击展开 / 收起`;
    let recent=D.getElementById('battleRecentV286816');
    if(!recent){recent=D.createElement('div');recent.id='battleRecentV286816';recent.setAttribute('aria-label','最近三条战报');arena.appendChild(recent);}
    const lines=[...log.children].slice(0,3).reverse().map(n=>(n.textContent||'').replace(/(?:◇ 本地策略|☯ (?:Jev 决策|天机推演))[：:]?/g,''));
    const markup=lines.map(t=>`<div>${esc(t)}</div>`).join('');
    if(recent._markup!==markup){recent.innerHTML=markup;recent._markup=markup;}
  }
  function sync(){
    installReportLog();
    if(typeof combatPetSessionV2884!=='undefined'&&combatPetSessionV2884&&(!canSwitchCombatPetV2884()||combatPetSessionV2884.owner!==player||combatPetSessionV2884.enemy!==currentEnemy||combatPetSessionV2884.token!==COMBAT_FINISH_V2764.token))closeCombatPetsV2884();
    const panel=D.getElementById('combatPanel'),arena=D.getElementById('combatArena');if(!panel||!arena)return;
    const data=read();let box=D.getElementById('battleReadoutV2856');
    if(!data){if(box)box.hidden=true;return;}
    if(!box){box=D.createElement('section');box.id='battleReadoutV2856';box.className='battle-readout-v2856';box.setAttribute('aria-label','战斗行动与持续状态');panel.insertBefore(box,arena);}
    box.hidden=false;
    compactUi(data,panel,arena);
    const markup=`<div class="battle-vitals-v2865"><span class="hp">气血 <b>${data.hp} / ${data.maxHp}</b></span><span class="mp">灵力 <b>${data.mp} / ${data.maxMp}</b></span></div><div class="battle-readout-head-v2856"><strong>${esc(data.turn)}</strong><span>${data.ending?'奖励按战斗结果结算':data.waiting?'等待本次行动完成':'选择攻击、招式或补给'}</span></div>${data.chips.length?`<div class="battle-chip-list-v2856">${data.chips.map(c=>`<details class="battle-chip-v2856 ${c.side}"><summary>${esc(c.text)}</summary><p>${esc(tip(c.text))}</p></details>`).join('')}</div>`:''}`;
    if(box._markupV2856!==markup){box.innerHTML=markup;box._markupV2856=markup;}
    let petButton=D.getElementById('combatSwitchPetV2884');
    if(!data.ending&&player.pets?.length){
      if(!petButton){petButton=D.createElement('button');petButton.id='combatSwitchPetV2884';petButton.type='button';petButton.className='combat-pet-switch-v2884';petButton.onclick=()=>showCombatPetsV2884();box.querySelector('.battle-readout-head-v2856')?.appendChild(petButton);}
      petButton.textContent='🐾 临阵换宠'+(player.activePet?' · '+player.activePet.name:' · 尚未出战');petButton.disabled=!canSwitchCombatPetV2884();
    }else petButton?.remove();
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
  const logBase=W.addCombatLog;if(typeof logBase==='function')W.addCombatLog=function(...args){const result=logBase.apply(this,args);syncRecentLog();return result;};
  W.addEventListener('xiantu:combat-finishing',sync);
  W.BattleClarityV2856={read,sync,tip};
})(window,document);
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2856-battle-clarity.js']='28.68.66';
