(() => {
  const MODE_KEY='xiantu_battle_presentation_v2756';
  const SPEED_KEY='xiantu_battle_speed_v2756';
  const state={mode:'cinema',speed:1,paused:false,active:false,starting:false,timer:0,round:0,skillCursor:0,narrationTimer:0,capturePending:false,light:false};
  const pendingTimers=new Set();
  function cinemaLater(fn,ms){const id=setTimeout(()=>{pendingTimers.delete(id);fn()},ms);pendingTimers.add(id);return id}
  function cinemaCancel(id){clearTimeout(id);pendingTimers.delete(id)}
  function clearCinemaFx(){
    window.InkSkillFxV2854?.cinemaClear();
    for(const id of pendingTimers)clearTimeout(id);pendingTimers.clear();state.timer=0;state.narrationTimer=0;state.capturePending=false;
    for(const id of ['cinemaCutinV2756','cinemaCaptureFxV2756','cinemaNarrationV2756','playerCombatant','enemyCombatant','combatArena']){
      document.getElementById(id)?.classList.remove('play','show','cinema-enter-v2756','cinema-cast-v2756','cinema-impact-v2756','cinema-hit-v2776');
    }
  }
  function readLight(){try{const v=localStorage.getItem('xiantu_cinema_light_v2776');if(v!==null)return v==='1'}catch(_){}return !!window.matchMedia?.('(max-width: 820px), (prefers-reduced-motion: reduce)').matches}
  function toggleCinemaLightV2776(){window.InkSkillFxV2854?.clear();state.light=!state.light;try{localStorage.setItem('xiantu_cinema_light_v2776',state.light?'1':'0')}catch(_){}syncCinemaControls()}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const strip=v=>{const d=document.createElement('div');d.innerHTML=String(v??'');return(d.textContent||'').replace(/\s+/g,' ').trim()};
  function readMode(){try{const v=localStorage.getItem(MODE_KEY);return v==='report'||v==='cinema'?v:'cinema'}catch(_){return'cinema'}}
  function readSpeed(){try{const v=Number(localStorage.getItem(SPEED_KEY));return[1,2,3].includes(v)?v:1}catch(_){return 1}}
  function savePref(){try{localStorage.setItem(MODE_KEY,state.mode);localStorage.setItem(SPEED_KEY,String(state.speed))}catch(_){}}
  function delay(base){return Math.max(170,Math.round(base/Math.max(1,state.speed)))}
  function clearAuto(){cinemaCancel(state.timer);state.timer=0}
  function currentModeAllowed(mode){return mode!=='cinema'||!(currentEnemy?._isTutorial)}

  const STRATEGY_KEY_V2819='xiantu_auto_strategy_v2819';
  function readStrategyV2819(){
    let p={};try{p=JSON.parse(localStorage.getItem(STRATEGY_KEY_V2819)||'{}')||{}}catch(_){}
    return {mode:['burst','save','survive'].includes(p.mode)?p.mode:'survive',healAt:Number.isFinite(p.healAt)?Math.max(10,Math.min(90,p.healAt)):40,reserve:Number.isFinite(p.reserve)?Math.max(0,Math.min(80,p.reserve)):30};
  }
  let strategyV2819=readStrategyV2819();
  function ensureStrategyUiV2819(panel){
    if(document.getElementById('autoStrategyV2819'))return;
    const box=document.createElement('details');box.id='autoStrategyV2819';
    box.innerHTML='<summary>⚙️ 自动战斗策略</summary><button type="button" onclick="showJevHubV2846()">☯ Jev 选招 / 今日用量</button><label>出招偏好<select data-pref="mode"><option value="burst">全力输出</option><option value="save">节省灵力</option><option value="survive">保命优先</option></select></label><label>生命≤ <input data-pref="healAt" type="number" min="10" max="90" step="5"> % 时尝试治疗</label><label>节省模式保留 <input data-pref="reserve" type="number" min="0" max="80" step="5"> % 灵力</label><p>全力输出优先高倍率伤害；节省灵力优先每点灵力的伤害倍率，并保留设定比例；保命优先护体与治疗，攻击时预留一次治疗灵力。三种策略都会在设定血线尝试治疗。</p><p>只使用已携带且灵力足够的技能。没有可用治疗时继续攻击；不会自动吃药或逃跑。修改从下一次自动选招生效。</p><small data-status></small>';
    for(const el of box.querySelectorAll('[data-pref]')){
      const key=el.dataset.pref;el.value=strategyV2819[key];
      el.onchange=()=>{
        const value=key==='mode'?el.value:Number(el.value);
        if(key==='mode'?!['burst','save','survive'].includes(value):!Number.isFinite(value)||el.value===''){el.value=strategyV2819[key];return;}
        strategyV2819[key]=key==='mode'?value:Math.max(key==='healAt'?10:0,Math.min(key==='healAt'?90:80,value));el.value=strategyV2819[key];
        try{localStorage.setItem(STRATEGY_KEY_V2819,JSON.stringify(strategyV2819));box.querySelector('[data-status]').textContent='已保存，下次战斗继续使用。';}catch(_){box.querySelector('[data-status]').textContent='本次已生效，但浏览器未能保存偏好。';}
      };
    }
    document.getElementById('cinemaControlsV2756').insertAdjacentElement('afterend',box);
  }

  function ensureCinemaUi(){
    const panel=document.getElementById('combatPanel'),arena=document.getElementById('combatArena');if(!panel||!arena)return null;
    if(!document.getElementById('battlePresentationBarV2756')){
      const bar=document.createElement('div');bar.id='battlePresentationBarV2756';bar.className='battle-presentation-bar-v2756';
      bar.innerHTML='<span class="battle-presentation-title-v2756">⚔️ 战斗呈现</span><div class="battle-presentation-switch-v2756"><button id="battleReportBtnV2756" class="battle-mode-btn-v2756" type="button">📜 简略战报</button><button id="battleCinemaBtnV2756" class="battle-mode-btn-v2756" type="button">🎬 动画演武</button></div>';
      panel.insertBefore(bar,arena);bar.querySelector('#battleReportBtnV2756').onclick=()=>setBattlePresentationV2756('report');bar.querySelector('#battleCinemaBtnV2756').onclick=()=>setBattlePresentationV2756('cinema');
    }
    if(!document.getElementById('cinemaLayerV2756')){
      const layer=document.createElement('div');layer.id='cinemaLayerV2756';layer.className='cinema-layer-v2756 cinema-letterbox-v2756';layer.setAttribute('aria-hidden','true');
      layer.innerHTML='<div class="cinema-vignette-v2756"></div><div id="cinemaRoundV2756" class="cinema-round-v2756">第一式</div><div id="cinemaCutinV2756" class="cinema-cutin-v2756"><div class="cinema-cutin-portrait-v2756"><canvas width="180" height="225" aria-label="斗法角色特写"></canvas></div><div class="cinema-cutin-copy-v2756"><div class="cinema-cutin-role-v2756">PLAYER ART</div><div class="cinema-cutin-name-v2756"></div><div class="cinema-cutin-skill-v2756"></div><div class="cinema-cutin-element-v2756"></div></div></div><div id="cinemaCaptureFxV2756" class="cinema-capture-fx-v2756"><div class="cinema-capture-orb-v2756"></div><div class="cinema-capture-glyph-v2756">契</div></div><div id="cinemaNarrationV2756" class="cinema-narration-v2756"><span id="cinemaSpeakerV2756" class="cinema-speaker-v2756">旁白</span><span id="cinemaTextV2756" class="cinema-text-v2756">风声掠过，双方气机已在无形中交锋。</span></div>';
      arena.appendChild(layer);
    }
    if(!document.getElementById('cinemaControlsV2756')){
      const controls=document.createElement('div');controls.id='cinemaControlsV2756';controls.className='cinema-controls-v2756';
      controls.innerHTML='<button id="cinemaPauseBtnV2756" class="cinema-control-btn-v2756 primary" type="button">⏸ 暂停</button><button id="cinemaSpeedBtnV2756" class="cinema-control-btn-v2756" type="button">⏩ 1倍</button><button id="cinemaCaptureBtnV2756" class="cinema-control-btn-v2756" type="button" hidden>🪄 收服</button><button id="cinemaSkipBtnV2756" class="cinema-control-btn-v2756 warn" type="button">📜 跳到战报</button><button id="cinemaLightBtnV2776" class="cinema-control-btn-v2756" type="button">轻量特效</button><span id="cinemaStatusV2756" class="cinema-status-v2756">自动演武中</span>';
      arena.insertAdjacentElement('afterend',controls);
      controls.querySelector('#cinemaLightBtnV2776').onclick=toggleCinemaLightV2776;
      controls.querySelector('#cinemaPauseBtnV2756').onclick=toggleCinemaPauseV2756;
      controls.querySelector('#cinemaSpeedBtnV2756').onclick=cycleCinemaSpeedV2756;
      controls.querySelector('#cinemaCaptureBtnV2756').onclick=cinematicCaptureV2756;
      controls.querySelector('#cinemaSkipBtnV2756').onclick=()=>setBattlePresentationV2756('report');
    }
    ensureStrategyUiV2819(panel);
    return panel;
  }

  function applySpeedVars(){
    const arena=document.getElementById('combatArena');if(!arena)return;
    const s=Math.max(1,state.speed);arena.style.setProperty('--cinema-enter-duration',`${Math.round(780/s)}ms`);arena.style.setProperty('--cinema-strike-duration',`${Math.round(300/s)}ms`);arena.style.setProperty('--cinema-cast-duration',`${Math.round(500/s)}ms`);arena.style.setProperty('--cinema-impact-duration',`${Math.round(360/s)}ms`);arena.style.setProperty('--cinema-cutin-duration',`${Math.round(520/s)}ms`);
  }
  function syncCinemaControls(){
    const panel=ensureCinemaUi();if(!panel)return;
    panel.classList.toggle('cinema-mode-v2756',state.mode==='cinema'&&state.active);
    document.body.classList.toggle('cinema-battle-active-v2756',state.mode==='cinema'&&state.active);
    panel.classList.toggle('cinema-light-v2776',state.light);
    const light=document.getElementById('cinemaLightBtnV2776');if(light)light.textContent=state.light?'特写：精简':'特写：完整';
    const report=document.getElementById('battleReportBtnV2756'),cinema=document.getElementById('battleCinemaBtnV2756');
    report?.classList.toggle('active',state.mode==='report');cinema?.classList.toggle('active',state.mode==='cinema');
    if(cinema){const locked=!!(currentEnemy?._isTutorial);cinema.disabled=locked;cinema.title=locked?'新手引路需先亲自完成一次普通攻击':''}
    const pause=document.getElementById('cinemaPauseBtnV2756');if(pause)pause.textContent=state.paused?'▶ 继续':'⏸ 暂停';
    const speed=document.getElementById('cinemaSpeedBtnV2756');if(speed)speed.textContent=`⏩ ${state.speed}倍`;
    const status=document.getElementById('cinemaStatusV2756');if(status)status.textContent=state.paused?'自动出招已暂停':(typeof isPlayerTurn!=='undefined'&&isPlayerTurn?'蓄势出招中':'敌方回击中');
    syncCinemaCaptureButton();applySpeedVars();
  }
  function setBattlePresentationV2756(mode,opts={}){
    if(!['report','cinema'].includes(mode))return;
    if(!currentModeAllowed(mode)){showFloatingText?.('📖 首次演武请亲自完成新手攻击','#ffd76a');return}
    clearAuto();clearCinemaFx();state.mode=mode;state.active=typeof gameState!=='undefined'&&gameState==='combat';state.paused=false;
    if(opts.save!==false)savePref();syncCinemaControls();
    if(state.active&&mode==='cinema'){
      showCinemaNarration('旁白','演武镜重新展开，双方招式化作流光交锋。');scheduleCinemaTurn(delay(760));
    }else if(state.active&&opts.silent!==true){showFloatingText?.('📜 已切换为简略战报，可自行选择招式','#e5cd8d')}
  }
  window.pauseForJevV2846=function(){if(state.mode==='cinema'&&state.active&&!state.paused)toggleCinemaPauseV2756();};
  function toggleCinemaPauseV2756(){
    window.InkSkillFxV2854?.clear();
    if(state.mode!=='cinema'||!state.active)return;state.paused=!state.paused;clearAuto();syncCinemaControls();
    showCinemaNarration('旁白',state.paused?'已暂停自动出招；当前已发出的招式会完成结算。':'画面再度流转，未尽的斗法继续。');if(!state.paused)scheduleCinemaTurn(delay(520));
  }
  function cycleCinemaSpeedV2756(){state.speed=state.speed===1?2:state.speed===2?3:1;savePref();syncCinemaControls();showFloatingText?.(`🎬 动画演武速度：${state.speed}倍`,'#ccefdc');if(!state.paused)scheduleCinemaTurn(delay(420))}

  function speakerFromText(text){
    if(!text)return'旁白';if(text.includes('灵宠')||text.includes('触发【'))return player?.activePet?.name||'灵宠';
    if(currentEnemy&&text.includes(currentEnemy.name))return currentEnemy.name;
    if(/你|施展|顿悟|法宝|灵力/.test(text))return player?.name||'你';return'旁白';
  }
  function showCinemaNarration(speaker,text){
    if(document.hidden||state.mode!=='cinema'||!state.active)return;const box=document.getElementById('cinemaNarrationV2756'),sp=document.getElementById('cinemaSpeakerV2756'),tx=document.getElementById('cinemaTextV2756');if(!box||!sp||!tx)return;
    cinemaCancel(state.narrationTimer);sp.textContent=speaker||'旁白';tx.textContent=strip(text).slice(0,92)||'灵气激荡，胜负仍未分明。';box.classList.remove('show');void box.offsetWidth;box.classList.add('show');state.narrationTimer=cinemaLater(()=>box.classList.remove('show'),delay(2300));
  }
  function elementLabel(name,element){
    const map={sword:'剑道 · 剑意纵横',thunder:'雷法 · 天威煌煌',ice:'冰诀 · 寒意封天',fire:'火法 · 烈焰焚空',heal:'医道 · 生生不息'};
    if(map[element])return map[element];if(/雷|劫/.test(name))return map.thunder;if(/剑|斩/.test(name))return map.sword;if(/冰|寒|霜/.test(name))return map.ice;if(/火|焚|血/.test(name))return map.fire;return'仙法 · 道韵流转';
  }
  function copyCanvasPortrait(side,target){
    const source=document.getElementById(side==='enemy'?'enemyChar':'combatPlayerChar');
    if(!source||!target)return;
    const scale=Math.min(1,180/Math.max(1,source.width||180),225/Math.max(1,source.height||225));
    const width=Math.max(1,Math.round((source.width||180)*scale)),height=Math.max(1,Math.round((source.height||225)*scale));
    if(target.width!==width)target.width=width;
    if(target.height!==height)target.height=height;
    const ctx=target.getContext('2d');
    ctx.clearRect(0,0,width,height);
    try{ctx.drawImage(source,0,0,width,height)}catch(_){}
  }
  function playCinemaCutin(side,skillName,element=''){
    if(state.mode!=='cinema'||!state.active||document.hidden)return;
    if(state.light){showCinemaNarration(side==='enemy'?(currentEnemy?.name||'敌人'):(player?.name||'你'),`施展【${skillName}】 · ${elementLabel(skillName,element)}`);return}
    const cut=document.getElementById('cinemaCutinV2756');if(!cut)return;
    const isEnemy=side==='enemy',name=isEnemy?(currentEnemy?.name||'未知强敌'):(player?.name||'修士'),portrait=cut.querySelector('canvas');if(portrait)copyCanvasPortrait(side,portrait);
    cut.querySelector('.cinema-cutin-role-v2756').textContent=isEnemy?'ENEMY ART':'PLAYER ART';cut.querySelector('.cinema-cutin-name-v2756').textContent=name;cut.querySelector('.cinema-cutin-skill-v2756').textContent=`「${skillName}」`;cut.querySelector('.cinema-cutin-element-v2756').textContent=elementLabel(skillName,element);
    cut.classList.toggle('enemy',isEnemy);cut.classList.remove('play');void cut.offsetWidth;cut.classList.add('play');
    const actor=document.getElementById(isEnemy?'enemyCombatant':'playerCombatant');if(actor){const cls=isEnemy?'cinema-cast-v2756':'cinema-cast-v2756';actor.classList.remove(cls);void actor.offsetWidth;actor.classList.add(cls);cinemaLater(()=>actor.classList.remove(cls),delay(760))}
    showCinemaNarration(name,isEnemy?`${name}周身气机骤变，悍然施展【${skillName}】！`:`${name}凝神掐诀，道韵汇聚成【${skillName}】！`);
  }
  function playCinemaEntrance(){
    if(state.mode!=='cinema'||!state.active)return;const p=document.getElementById('playerCombatant'),e=document.getElementById('enemyCombatant');
    [p,e].forEach(x=>{if(!x)return;x.classList.remove('cinema-enter-v2756');void x.offsetWidth;x.classList.add('cinema-enter-v2756');cinemaLater(()=>x.classList.remove('cinema-enter-v2756'),delay(900))});
    const title=isTribulation?'九天雷劫':isBossFight?'强敌现身':'狭路相逢';showCinemaNarration('旁白',`${title}。${player?.name||'你'}与${currentEnemy?.name||'对手'}的气机在战场中央轰然相撞。`);
  }
  function playCinemaImpact(){const arena=document.getElementById('combatArena');if(!arena||state.light||document.hidden||state.mode!=='cinema'||!state.active)return;arena.classList.remove('cinema-impact-v2756');void arena.offsetWidth;arena.classList.add('cinema-impact-v2756');cinemaLater(()=>arena.classList.remove('cinema-impact-v2756'),delay(430))}
  function updateRound(){const r=document.getElementById('cinemaRoundV2756');if(r)r.textContent=`第 ${Math.max(1,state.round)} 式 · ${state.speed}倍演武`}

  function chooseCinemaAction(){
    const affordable=typeof getAvailableCombatSkillsV2769==='function'?getAvailableCombatSkillsV2769():[];
    const maxHp=Math.max(1,Number(getMaxHp())||1),hp=Math.max(0,Number(player.hp)||0),ratio=hp/maxHp,pref=strategyV2819;
    const cost=x=>Math.max(0,Number(x.skill.mpCost)||0);
    const healing=x=>Math.min(maxHp-hp,Math.floor(maxHp*((ratio<=.25?Number(x.skill.emergencyHeal):0)||Number(x.skill.heal)||0)));
    const pick=x=>({action:'skill',index:x.index,skill:x.skill});
    const heals=affordable.filter(x=>x.skill.element==='heal'&&Number(x.skill.heal)>0);
    if(ratio<=pref.healAt/100&&hp<maxHp&&heals.length){
      heals.sort((a,b)=>pref.mode==='save'?(healing(b)/Math.max(1,cost(b))-healing(a)/Math.max(1,cost(a))):(healing(b)-healing(a)||cost(a)-cost(b)));
      if(healing(heals[0])>0)return pick(heals[0]);
    }
    let reserve=0;
    if(pref.mode==='save')reserve=Math.ceil(getMaxMp()*pref.reserve/100);
    if(pref.mode==='survive'&&heals.length)reserve=Math.min(...heals.map(cost));
    const usable=affordable.filter(x=>player.mp-cost(x)>=reserve);
    const armor=usable.find(x=>x.skill.effect==='thunder_armor'&&!(player._thunderArmorTurns>0));
    if(pref.mode==='survive'&&armor)return pick(armor);
    const attacks=usable.filter(x=>x.skill.element!=='heal'&&x.skill.effect!=='thunder_armor'&&Number(x.skill.damage)>0);
    if(pref.mode==='survive'&&ratio<=.7){const guard=attacks.find(x=>x.skill.guardRatio>0&&!guardsV2785.has(currentEnemy));if(guard)return pick(guard);}
    attacks.sort((a,b)=>pref.mode==='save'?((Number(b.skill.damage)/Math.max(1,cost(b)))-(Number(a.skill.damage)/Math.max(1,cost(a)))||cost(a)-cost(b)):(Number(b.skill.damage)-Number(a.skill.damage)||cost(a)-cost(b)));
    return attacks.length?pick(attacks[0]):{action:'attack',index:null,skill:null};
  }
  function scheduleCinemaTurn(wait=0){
    clearAuto();if(document.hidden||state.capturePending||state.starting||state.mode!=='cinema'||!state.active||state.paused||typeof gameState==='undefined'||gameState!=='combat'||!currentEnemy||currentEnemy.hp<=0||!isPlayerTurn||player?.petCapture?.isCapturing)return;
    let turnWait=Math.max(120,wait||delay(980));
    try{const pd=typeof getPetData==='function'?getPetData(currentEnemy.name):null,c=pd&&typeof canCaptureTarget==='function'?canCaptureTarget(currentEnemy):null;if(c?.ok)turnWait=Math.max(turnWait,1800)}catch(_){}
    state.timer=cinemaLater(async()=>{
      state.timer=0;if(document.hidden||state.capturePending||!state.active||state.mode!=='cinema'||state.paused||gameState!=='combat'||!currentEnemy||currentEnemy.hp<=0||!isPlayerTurn||player?.petCapture?.isCapturing)return;
      if(document.getElementById('skillLoadoutOverlayV212')){scheduleCinemaTurn(250);return;}
      state.round++;updateRound();
      const owner=player,enemy=currentEnemy,round=state.round,combatToken=COMBAT_FINISH_V2764.token;
      const valid=()=>!document.hidden&&!state.paused&&state.active&&state.mode==='cinema'&&!state.capturePending&&!player.petCapture?.isCapturing&&gameState==='combat'&&isPlayerTurn&&player===owner&&currentEnemy===enemy&&enemy.hp>0&&state.round===round&&COMBAT_FINISH_V2764.token===combatToken&&!document.getElementById('skillLoadoutOverlayV212');
      let pick=chooseCinemaAction();
      if(typeof choosePlayerJevV2846==='function')pick=await choosePlayerJevV2846(pick,valid,strategyV2819);
      if(!valid())return;
      if(pick.action==='skill'&&!getAvailableCombatSkillsV2769().some(x=>x.index===pick.index&&x.skill===pick.skill))pick=chooseCinemaAction();
      if(pick.skill)showCinemaNarration(player?.name||'你',`灵力沿经脉奔涌，${player?.name||'你'}准备施展【${pick.skill.name}】。`);else showCinemaNarration(player?.name||'你',`${player?.name||'你'}踏地前掠，${player?.equipment?.weapon?'挥动兵器':'凝力出掌'}攻向${currentEnemy.name}！`);
      window.combat?.(pick.action,pick.index);
    },turnWait);
  }
  function syncCinemaCaptureButton(){
    const b=document.getElementById('cinemaCaptureBtnV2756');if(!b)return;let c=null,pd=null;try{pd=typeof getPetData==='function'&&currentEnemy?getPetData(currentEnemy.name):null;c=pd&&typeof canCaptureTarget==='function'?canCaptureTarget(currentEnemy):null}catch(_){}
    b.hidden=!pd;if(!pd)return;b.disabled=!c?.ok||!isPlayerTurn||state.capturePending||!!player?.petCapture?.isCapturing;b.textContent=c?.ok?`🪄 ${pd.canBond?'结缘':'收服'}`:`🔒 ${pd.canBond?'结缘':'收服'}`;b.title=c?.ok?`使用${c.bestItem}，无需压低血量`:(c?.reason||'当前无法收服');
    const status=document.getElementById('cinemaStatusV2756');if(status&&!state.paused&&c?.ok&&isPlayerTurn)status.textContent='可收服目标 · 点击按钮或等待继续攻击';
  }
  function cinematicCaptureV2756(){
    if(document.hidden||state.paused||state.capturePending||state.mode!=='cinema'||!state.active||!isPlayerTurn||!currentEnemy)return;const c=typeof canCaptureTarget==='function'?canCaptureTarget(currentEnemy):{ok:false,reason:'无法收服'};if(!c.ok){showFloatingText?.(`❌ ${c.reason}`,'#ff7770');return}
    clearAuto();state.capturePending=true;const captureTarget=currentEnemy;syncCinemaCaptureButton();const fx=document.getElementById('cinemaCaptureFxV2756');if(fx){fx.classList.remove('play');void fx.offsetWidth;fx.classList.add('play');cinemaLater(()=>fx.classList.remove('play'),delay(1160))}
    showCinemaNarration(player?.name||'你',`缚灵之光化作层层法阵，向${currentEnemy.name}缓缓收拢……`);cinemaLater(()=>{state.capturePending=false;if(state.active&&state.mode==='cinema'&&!document.hidden&&!state.paused&&gameState==='combat'&&currentEnemy===captureTarget&&currentEnemy.hp>0&&isPlayerTurn)window.attemptCapture?.(captureTarget);syncCinemaCaptureButton();scheduleCinemaTurn(delay(980))},delay(720));
  }
  function cleanupCinema(){
    if(typeof clearSkillFxV2786==='function')clearSkillFxV2786();
    clearAuto();clearCinemaFx();state.active=false;state.paused=false;
    const portrait=document.getElementById('cinemaCutinV2756')?.querySelector('canvas');if(portrait){portrait.width=1;portrait.height=1}
    const panel=document.getElementById('combatPanel');
    if(panel?.classList.contains('cinema-mode-v2756'))panel.classList.remove('cinema-mode-v2756');
    if(document.body.classList.contains('cinema-battle-active-v2756'))document.body.classList.remove('cinema-battle-active-v2756');
  }

  state.mode=readMode();state.speed=readSpeed();state.light=readLight();
  const baseStart=window.startCombat;
  if(typeof baseStart==='function')window.startCombat=function(...args){
    if(gameState==='combat'||gameState==='combat-ending'||COMBAT_FINISH_V2764.settling||player.breakthrough?.isAnimating)return false;
    cleanupCinema();state.starting=true;state.round=0;state.skillCursor=0;state.paused=false;state.mode=(args[0]?._isTutorial?'report':readMode());state.speed=readSpeed();state.active=true;
    let result;try{result=baseStart.apply(this,args)}catch(error){cleanupCinema();throw error}finally{state.starting=false}install();
    if(state.mode==='cinema'){playCinemaEntrance();scheduleCinemaTurn(delay(1450))}return result;
  };
  const baseChoices=window.updateCombatChoices;
  if(typeof baseChoices==='function')window.updateCombatChoices=function(...args){const result=baseChoices.apply(this,args);syncCinemaControls();if(state.mode==='cinema'&&state.active)scheduleCinemaTurn(delay(880));return result};
  const baseUi=window.updateCombatUI;
  if(typeof baseUi==='function')window.updateCombatUI=function(...args){const result=baseUi.apply(this,args);syncCinemaControls();return result};
  const baseLog=window.addCombatLog;
  if(typeof baseLog==='function')window.addCombatLog=function(text,type){const result=baseLog.apply(this,arguments),plain=strip(text);if(plain&&state.mode==='cinema'&&state.active)showCinemaNarration(speakerFromText(plain),plain);return result};
  const baseAttack=window.playAttackAnimation;
  if(typeof baseAttack==='function')window.playAttackAnimation=function(attacker){const result=baseAttack.apply(this,arguments);if(state.mode==='cinema'&&state.active){const who=attacker==='player'?(player?.name||'你'):(currentEnemy?.name||'敌人');showCinemaNarration(who,attacker==='player'?`${who}${player?.equipment?.weapon?'挥动兵器，凌厉攻势破空而去':'凝气出掌，掌风直逼对手'}。`:`${who}嘶吼一声，裹挟凶煞之气扑杀而来！`)}return result};
  const baseSkill=window.playSkillEffect;
  if(typeof baseSkill==='function')window.playSkillEffect=function(skillName,element,source='active'){if(state.mode==='cinema'&&state.active){if(source==='passive')showCinemaNarration('护体效果',`【${skillName}】被动触发，并非再次施法。`);else playCinemaCutin('player',skillName,element);}return baseSkill.apply(this,arguments)};
  const baseBossSkill=window.playBossSkillEffect;
  if(typeof baseBossSkill==='function')window.playBossSkillEffect=function(skillName){if(state.mode==='cinema'&&state.active)playCinemaCutin('enemy',skillName,'');return baseBossSkill.apply(this,arguments)};
  const baseHit=window.playHitEffect;
  if(typeof baseHit==='function')window.playHitEffect=function(target){const result=baseHit.apply(this,arguments);if(state.active&&state.mode==='cinema'&&!document.hidden){const actor=document.getElementById(target==='player'?'playerCombatant':'enemyCombatant');if(actor){actor.classList.remove('cinema-hit-v2776');void actor.offsetWidth;actor.classList.add('cinema-hit-v2776');cinemaLater(()=>actor.classList.remove('cinema-hit-v2776'),delay(320))}}playCinemaImpact();return result};
  const baseEndCapture=window.endCombatAfterCapture;
  if(typeof baseEndCapture==='function')window.endCombatAfterCapture=function(){cleanupCinema();return baseEndCapture.apply(this,arguments)};
  const baseShowStory=window.showStory;
  if(typeof baseShowStory==='function')window.showStory=function(){if(typeof gameState!=='undefined'&&gameState==='combat')cleanupCinema();return baseShowStory.apply(this,arguments)};

  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.active){clearAuto();clearCinemaFx();state.paused=true;syncCinemaControls()}});
  window.addEventListener('xiantu:combat-finishing',cleanupCinema,{passive:true});
  Object.assign(window,{setBattlePresentationV2756,toggleCinemaPauseV2756,cycleCinemaSpeedV2756,cinematicCaptureV2756});
  function install(){
    ensureCinemaUi();syncCinemaControls();
    const panel=document.getElementById('combatPanel');
    if(panel&&!panel.dataset.cinemaObserverV2756){
      panel.dataset.cinemaObserverV2756='1';
      new MutationObserver(records=>{
        if(!panel.classList.contains('hidden'))return;
        const becameHidden=records.some(record=>!(record.oldValue||'').split(/\s+/).includes('hidden'));
        if(!becameHidden)return;
        cleanupCinema();
      }).observe(panel,{attributes:true,attributeFilter:['class'],attributeOldValue:true});
    }
  }
  // 战斗呈现UI与观察器由第一次 startCombat 按需创建。
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-22-v2756-cinematic-combat-script.js"]="28.68.32";
