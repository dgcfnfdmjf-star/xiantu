// ===== 新手引路：只描述当前版本真实存在的玩法 =====
const TUTORIAL_STEPS={
  welcome:{title:'🌅 初识仙途',desc:'从今日起，你要自己走这条修行路。先熟悉最常用的几件事：<b>移动、交互、战斗、装备、宗门差事与修炼突破</b>。',placement:'center',actions:[{text:'开始引路',action:'next',nextStep:'movement'},{text:'略过引路',action:'skip'}]},
  movement:{title:'🕹️ 行走四方',desc:'你可以 <b>拖动左下角摇杆</b>，也可以<b>轻点地面</b>让人物自动走过去。松开摇杆会立即停下，点地后人物会向目标点移动。<br><br>现在试着移动一小段。',compact:'轻点地面或拖动摇杆，移动一小段',target:'#virtualJoystick',placement:'right',waitFor:'movement'},
  interaction:{title:'✋ 与地点交互',desc:'地图上的建筑与地点都有进入范围。走进地点外圈后，右下角<b>【交互】</b>即可进入。<br><br>现在靠近任意地点并按一次【交互】。',compact:'靠近任意地点，进入外圈后按【交互】',target:'#touchAction',placement:'left',waitFor:'interaction'},
  combat:{title:'⚔️ 演武入门',desc:'先用一具低阶演武傀儡熟悉战斗。战斗中可以使用<b>普通攻击</b>或已掌握的功法，灵力不足时要留意恢复。',placement:'center',actions:[{text:'开始演武',action:'training'}]},
  combat_attack:{title:'⚔️ 先出一剑',desc:'点击<b>【普通攻击】</b>完成第一击。之后自由应战，击败演武傀儡即可。',compact:'点击【普通攻击】完成第一击',target:'#combatChoices .choice-btn',placement:'left',waitFor:'attack'},
  equipment:{title:'🎒 穿戴所得',desc:'演武奖励已经放入<b>装备背包</b>。打开装备栏，点击【背包装备】，再点【布衣】穿到法袍位。<br><br>装备有品质与境界要求，高阶装备必须达到相应境界才能使用。',placement:'left',actions:[{text:'打开装备栏',action:'equipment'}]},
  tasks:{title:'📜 宗门差事',desc:'宗门任务是稳定获取<b>修为、贡献与灵石</b>的途径。接取后可以查看详细指引与任务追踪；采集、清剿与捐献都有各自的真实获取路线。',placement:'center',actions:[{text:'查看宗门任务',action:'tasks'},{text:'继续了解修炼',action:'next',nextStep:'cultivation'}]},
  cultivation:{title:'🧘 修炼与突破',desc:'修为达到当前瓶颈后，会进入突破流程，突破存在失败风险。失败后需要调息，时间会随仙历流逝而减少。<br><br><b>闭关十年最多推进一个小段</b>，不会连续跨越多个境界；渡劫圆满必须真正渡过飞升天劫，方能进入金仙。',placement:'center',actions:[{text:'我已明白',action:'finish'}]}
};
const TUTORIAL_ORDER=['welcome','movement','interaction','combat','combat_attack','equipment','tasks','cultivation'];
let tutorialState={active:false,currentStepId:null,bubble:null,dim:null,skipBtn:null,trainingWatcher:null,lastMoveX:null,lastMoveY:null,freeExploreAnnounced:false,compactStepId:null};

function ensureTutorialState(){
  if(!player)return null;
  if(!player.tutorial||typeof player.tutorial!=='object')player.tutorial={completedSteps:[],activeStep:null,skipped:false,showTooltips:true,readPopups:[]};
  if(!Array.isArray(player.tutorial.completedSteps))player.tutorial.completedSteps=[];
  if(!Array.isArray(player.tutorial.readPopups))player.tutorial.readPopups=[];
  if(player.tutorial.showTooltips===undefined)player.tutorial.showTooltips=true;
  return player.tutorial;
}
function isTutorialStepCompleted(id){const t=ensureTutorialState();return !!(t?.skipped||t?.completedSteps?.includes(id));}
function tutorialFreeExploreUnlocked(){const t=ensureTutorialState();return !!(t?.skipped||t?.readPopups?.includes('training_reward'));}
function clearTutorialStepClasses(){
  document.body?.classList.remove('tutorial-guided-mode','tutorial-world-locked');
  if(document.body){[...document.body.classList].filter(c=>c.startsWith('tutorial-step-')).forEach(c=>document.body.classList.remove(c));}
}
function syncTutorialStage(stepId=null){
  if(!document.body)return;
  [...document.body.classList].filter(c=>c.startsWith('tutorial-step-')).forEach(c=>document.body.classList.remove(c));
  if(!stepId){clearTutorialStepClasses();return;}
  document.body.classList.add('tutorial-guided-mode',`tutorial-step-${stepId}`);
  document.body.classList.toggle('tutorial-world-locked',!tutorialFreeExploreUnlocked());
  document.getElementById('mobileQuickMenu')?.classList.remove('show');
  if(typeof FLAT_WORLD!=='undefined'&&FLAT_WORLD){
    FLAT_WORLD.target=null;
    if(!['movement','interaction'].includes(stepId))FLAT_WORLD.keys={};
  }
}
function completeTutorialStep(id){const t=ensureTutorialState();if(!t)return;if(!t.completedSteps.includes(id))t.completedSteps.push(id);if(t.activeStep===id)t.activeStep=null;autoSave?.();}
function resolveTutorialTarget(sel){if(!sel)return null;try{return sel.startsWith('#')||sel.startsWith('.')?document.querySelector(sel):document.getElementById(sel)}catch(_){return null}}
function clearTutorialHighlight(){document.querySelectorAll('.tutorial-highlight').forEach(el=>el.classList.remove('tutorial-highlight'));tutorialState.dim?.remove();tutorialState.dim=null;}
function createTutorialDim(blocking=false){tutorialState.dim?.remove();const dim=document.createElement('div');dim.className=`tutorial-dim show${blocking?' blocking':''}`;document.body.appendChild(dim);tutorialState.dim=dim;return dim;}
function closeTutorialBubble(){tutorialState.bubble?.remove();tutorialState.bubble=null;clearTutorialHighlight();tutorialState.active=false;}
function showTutorialToast(text,duration=3600){document.getElementById('tutorialToast')?.remove();const el=document.createElement('div');el.id='tutorialToast';el.className='tutorial-toast';el.innerHTML=text;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),260)},duration)}
function showTutorialSkipBtn(){if(document.getElementById('tutorialSkipBtn')||ensureTutorialState()?.skipped)return;const b=document.createElement('button');b.id='tutorialSkipBtn';b.className='tutorial-skip-btn';b.textContent='略过新手引路';b.onclick=skipAllTutorial;document.body.appendChild(b);tutorialState.skipBtn=b}
function hideTutorialSkipBtn(){document.getElementById('tutorialSkipBtn')?.remove();tutorialState.skipBtn=null}
function highlightTutorialTarget(sel){clearTutorialHighlight();const el=resolveTutorialTarget(sel);createTutorialDim(false);if(!el)return;el.classList.add('tutorial-highlight')}

function triggerTutorial(id,force=false){
  const t=ensureTutorialState();if(!t||(!force&&(t.skipped||t.completedSteps.includes(id))))return false;
  const step=TUTORIAL_STEPS[id];if(!step)return false;

  // 新手开场遵循“教程先行”：前四步不会同时保留地点/自由行动面板。
  if(['welcome','movement','interaction','combat'].includes(id) && typeof closeWorldOverlay==='function')closeWorldOverlay();
  closeTutorialBubble();
  tutorialState.currentStepId=id;t.activeStep=id;tutorialState.active=true;
  syncTutorialStage(id);

  const modalSteps=new Set(['welcome','combat','cultivation']);
  const focusSteps=new Set(['movement','interaction','combat_attack']);
  const dockableSteps=new Set(['movement','interaction','combat_attack']);
  const isDocked=dockableSteps.has(id)&&tutorialState.compactStepId===id;
  const modeClass=(modalSteps.has(id)&&!isDocked)?' tutorial-modal':focusSteps.has(id)?' tutorial-focus':'';
  const bubble=document.createElement('div');
  bubble.id='tutorialBubble';bubble.className=`tutorial-bubble ${isDocked?'tutorial-docked place-top-left':`place-${step.placement||'center'}`}${modeClass}`;
  let actions='';
  if(step.actions?.length){
    actions=`<div class="tutorial-actions">${step.actions.map((a,i)=>`<button class="${i===0?'tutorial-primary':'tutorial-secondary'}" onclick="handleTutorialAction('${a.action}','${id}')">${a.text}</button>`).join('')}</div>`;
  }else if(step.waitFor && !isDocked){
    actions=`<div class="tutorial-actions"><button class="tutorial-primary" onclick="handleTutorialAction('dock','${id}')">开始操作</button></div>`;
  }
  const n=Math.max(1,TUTORIAL_ORDER.indexOf(id)+1);
  if(isDocked){
    bubble.innerHTML=`<div class="tutorial-title"><span>${step.title}</span><span class="tutorial-mini-progress">${Math.min(n,TUTORIAL_ORDER.length)}/${TUTORIAL_ORDER.length}</span></div><div class="tutorial-desc">${step.compact||step.desc.replace(/<br\s*\/?>(?:\s*)/gi,' ').replace(/<[^>]+>/g,'')}</div>`;
  }else{
    bubble.innerHTML=`<div class="tutorial-title">${step.title}</div><div class="tutorial-desc">${step.desc}</div>${actions}<div class="tutorial-counter">基础引路 ${Math.min(n,TUTORIAL_ORDER.length)} / ${TUTORIAL_ORDER.length}</div>`;
  }
  document.body.appendChild(bubble);tutorialState.bubble=bubble;

  if(step.target)highlightTutorialTarget(step.target);else createTutorialDim(true);
  showTutorialSkipBtn();autoSave?.();return true;
}
function goTutorialNext(stepId,explicitNext=null){const step=TUTORIAL_STEPS[stepId];completeTutorialStep(stepId);tutorialState.compactStepId=null;closeTutorialBubble();const next=explicitNext||step?.actions?.find(a=>a.nextStep)?.nextStep;if(next)setTimeout(()=>triggerTutorial(next,true),260)}

function playerOwnsEquipment(name){if(player.equipmentInventory?.includes(name))return true;if(Object.values(player.equipment||{}).includes(name))return true;return player.inventory?.includes(name)}
function grantTutorialTrainingReward(){
  const t=ensureTutorialState();if(!t||t.readPopups.includes('training_reward'))return;
  t.readPopups.push('training_reward');player.gold+=120;player.exp+=30;if(!playerOwnsEquipment('布衣'))player.equipmentInventory.push('布衣');
  document.body?.classList.remove('tutorial-world-locked');
  showTutorialToast('🎉 演武通过：灵石 +120 · 修为 +30 · 获得【布衣】 · 自由探索已开放',5200);
  updateStats?.();autoSave?.();
}
function startTutorialTraining(){
  tutorialState.compactStepId=null;
  completeTutorialStep('combat');closeTutorialBubble();
  const enemy={name:'演武傀儡',hp:26,maxHp:26,atk:4,def:1,gold:0,exp:0,_realmLevel:0,_realmPhase:0,_isTutorial:true};
  startCombat(enemy,false,false,null);
  setTimeout(()=>triggerTutorial('combat_attack',true),260);
  clearInterval(tutorialState.trainingWatcher);
  tutorialState.trainingWatcher=setInterval(()=>{
    if(currentEnemy?._isTutorial&&currentEnemy.hp<=0){
      clearInterval(tutorialState.trainingWatcher);tutorialState.trainingWatcher=null;
      completeTutorialStep('combat_attack');closeTutorialBubble();
      // 先让胜利文字短暂显示，再收起战斗层；之后才开放自由探索和装备教学。
      setTimeout(()=>{
        closeWorldOverlay?.();
        grantTutorialTrainingReward();
        setTimeout(()=>triggerTutorial('equipment',true),760);
      },900);
    }
  },150);
}
function handleTutorialAction(action,stepId){
  if(action==='dock'){tutorialState.compactStepId=stepId;closeTutorialBubble();setTimeout(()=>triggerTutorial(stepId,true),40);return}
  if(action==='next'){const a=TUTORIAL_STEPS[stepId]?.actions?.find(x=>x.action==='next');return goTutorialNext(stepId,a?.nextStep)}
  if(action==='skip')return skipAllTutorial();
  if(action==='training'){tutorialState.compactStepId=null;return startTutorialTraining();}
  if(action==='equipment'){tutorialState.compactStepId=null;completeTutorialStep(stepId);closeTutorialBubble();showEquipmentPanel();setTimeout(()=>{showTutorialToast('📦 点【背包装备】，再点【布衣】即可穿戴',4600)},260);return}
  if(action==='tasks'){tutorialState.compactStepId=null;completeTutorialStep(stepId);closeTutorialBubble();showSectTasks();showTutorialToast('📜 接取差事后可查看【详细指引】与【任务追踪】',4300);setTimeout(()=>triggerTutorial('cultivation',true),1100);return}
  if(action==='finish'){if(!firstJourneyV28687()&&player.level<2){player.firstJourneyV28687={step:0};const owner=player;setTimeout(()=>{if(player===owner&&forgeAllowedV2825())showFirstJourneyV28687()},600);}tutorialState.compactStepId=null;completeTutorialStep(stepId);closeTutorialBubble();hideTutorialSkipBtn();clearTutorialStepClasses();showTutorialToast('✅ 基础引路已完成。现在可以自由行走四域，更多内容可随时从【修行指引】查看。',4300);return}
}
function skipAllTutorial(){
  const t=ensureTutorialState();if(!t)return;if(!confirm('略过新手引路？基础说明仍可在【修行指引】中随时查看。'))return;
  t.skipped=true;for(const id of TUTORIAL_ORDER)if(!t.completedSteps.includes(id))t.completedSteps.push(id);
  // 只补发尚未取得的演武基础物资，避免重复领奖。
  if(!t.readPopups.includes('training_reward')){t.readPopups.push('training_reward');player.gold+=120;if(!playerOwnsEquipment('布衣'))player.equipmentInventory.push('布衣');}
  tutorialState.compactStepId=null;closeTutorialBubble();hideTutorialSkipBtn();clearTutorialStepClasses();updateStats?.();autoSave?.();showTutorialToast('引路已略过。自由探索已开放，修行所需说明仍收录在【修行指引】中。',4000)
}
function checkAndStartTutorial(force=false){const t=ensureTutorialState();if(!t)return;if(t.skipped&&!force){clearTutorialStepClasses();return}if(force&&t.skipped)t.skipped=false;if(t.completedSteps.length>=TUTORIAL_ORDER.length){clearTutorialStepClasses();return}const resume=t.activeStep&&TUTORIAL_STEPS[t.activeStep]?t.activeStep:TUTORIAL_ORDER.find(id=>!t.completedSteps.includes(id));if(resume){syncTutorialStage(resume);setTimeout(()=>triggerTutorial(resume,true),260)}}
function restartTutorial(){const t=ensureTutorialState();t.skipped=false;t.completedSteps=[];t.activeStep=null;t.readPopups=t.readPopups.filter(x=>x!=='training_reward');tutorialState.compactStepId=null;closeHelpManual();closeTutorialBubble();syncTutorialStage('welcome');showTutorialSkipBtn();setTimeout(()=>triggerTutorial('welcome',true),180);autoSave?.()}

// 手机交互按钮和桌面 E/空格共用同一教学完成判定。
function handleTutorialInteractionV28685(){
  if(tutorialState.currentStepId!=='interaction')return false;
  const p=FLAT_WORLD.nearby;
  if(p&&FLAT_WORLD.pois.includes(p)&&Math.hypot(FLAT_WORLD.player.x-p.x,FLAT_WORLD.player.y-p.y)<=p.r+62){
    goTutorialNext('interaction','combat');showTutorialToast('✅ 已掌握地点交互。完成演武后将正式开放自由探索。',2400);
  }else showTutorialToast('再靠近一个地点，进入它的外圈后按【交互】',2200);
  return true;
}
{const original=window.interactFlatWorld;window.interactFlatWorld=function(...args){if(handleTutorialInteractionV28685())return;return original.apply(this,args);};}

// 实际操作监听：移动、交互、第一击
function installTutorialInteractionHooks(){
  const pad=document.getElementById('virtualJoystick');if(pad&&!pad.dataset.tutorialHook){pad.dataset.tutorialHook='1';let start=null;pad.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY}},{passive:true});pad.addEventListener('pointermove',e=>{if(tutorialState.currentStepId!=='movement'||!start)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>16){start=null;goTutorialNext('movement','interaction');showTutorialToast('✅ 已掌握移动操作',1800)}},{passive:true})}
  const action=document.getElementById('touchAction');if(action&&!action.dataset.tutorialHook){action.dataset.tutorialHook='1';action.addEventListener('click',e=>{if(tutorialState.currentStepId!=='interaction')return;e.preventDefault();e.stopImmediatePropagation();handleTutorialInteractionV28685()},true)}
  document.addEventListener('click',e=>{if(tutorialState.currentStepId!=='combat_attack'||!currentEnemy?._isTutorial)return;const btn=e.target?.closest?.('#combatChoices .choice-btn');if(btn&&btn.textContent.includes('普通攻击')){completeTutorialStep('combat_attack');closeTutorialBubble();showTutorialToast('⚔️ 很好。继续战斗，击败演武傀儡。',2400)}},true)
}

// 装备成功后推进引导
(function(){
  const oldEquip=window.equipItem;if(typeof oldEquip==='function')window.equipItem=function(name){const ok=oldEquip.apply(this,arguments);if(ok&&tutorialState.currentStepId==='equipment'&&player.equipment?.robe==='布衣'){tutorialState.compactStepId=null;completeTutorialStep('equipment');closeTutorialBubble();showTutorialToast('✅ 布衣已穿戴。装备属性会立即计入角色实力。',2600);setTimeout(()=>triggerTutorial('tasks',true),850)}return ok};
  const oldCloseBt=window.closeBreakthroughSuccess;if(typeof oldCloseBt==='function')window.closeBreakthroughSuccess=function(){const r=oldCloseBt.apply(this,arguments);setTimeout(()=>checkTutorialRealm(player.level),520);return r};
  const oldLoad=window.loadAndStart;if(typeof oldLoad==='function')window.loadAndStart=function(){const r=oldLoad.apply(this,arguments);setTimeout(()=>{ensureTutorialState();installGuideEntry();installTutorialTooltips();if(!player.tutorial?.skipped&&player.tutorial?.activeStep)checkAndStartTutorial(false)},950);return r};
})();

// ===== 境界解锁提示：只讲真实开放内容 =====
function showTutorialUnlockPopup(key,title,body){const t=ensureTutorialState();if(!t||t.readPopups.includes(key))return;t.readPopups.push(key);autoSave?.();document.getElementById('tutorialUnlock')?.remove();const el=document.createElement('div');el.id='tutorialUnlock';el.className='tutorial-unlock';el.innerHTML=`<h3>${title}</h3><p>${body}</p><button onclick="document.getElementById('tutorialUnlock')?.remove()">记下了</button>`;document.body.appendChild(el)}
function checkTutorialRealm(level){
  if(level>=2)showTutorialUnlockPopup('unlock_east','🌲 东域可行','你已踏入筑基，东域之路开放。可前往迷雾森林、灵兽谷；万宗秘境仍需宗门取得本世纪资格。');
  if(level>=4)showTutorialUnlockPopup('unlock_north','❄️ 北域可行','筑基境后，北域之路开放。问道山、凌霄宗与三界势力碑皆可前往。');
  if(level>=3)showTutorialUnlockPopup('unlock_west','✨ 金丹道成','金丹境后，西域之路开放；装备栏中的【本命法宝】位置也已开启。古战场、炼丹房与法宝台皆在西域。');
}

// ===== 修行指引手册 =====
function showHelpManual(){
  document.getElementById('helpManual')?.remove();const t=ensureTutorialState();const el=document.createElement('div');el.id='helpManual';el.className='help-manual-overlay active';el.onclick=e=>{if(e.target===el)closeHelpManual()};
  el.innerHTML=`<div class="help-manual-content" onclick="event.stopPropagation()"><div class="help-manual-title"><span>📖 仙途 · 修行指引</span><button class="help-manual-close" onclick="closeHelpManual()">✕</button></div><div class="help-manual-grid">
  <div class="help-section"><h4>🕹️ 行走与交互</h4><p>左下摇杆可自由控制方向；也可轻点地面自动前往落点。走进地点外圈后，右下【交互】进入。</p><p>右上小地图可查看周围地点，也可点选地图位置寻路。☰中可打开角色、装备、宗门任务与记档。</p></div>
  <div class="help-section"><h4>🧘 修炼与突破</h4><p>修为达到瓶颈后会进入突破流程，成功率会受境界、丹药、宗门状态与心境影响。</p><p><b>闭关十年最多推进一个小段</b>。突破失败会损失部分修为并进入调息期；渡劫圆满必须渡过飞升天劫才能进入金仙。</p></div>
  <div class="help-section"><h4>🎒 装备</h4><p>装备分防具、首饰、武器法宝等槽位，并有凡品至神器的品质差异。装备品质会放大其基础属性。</p><p>高阶装备有境界要求。戒指有两格、法宝有三格；<b>本命法宝位在金丹境开启</b>。成套装备可激活额外加成。</p></div>
  <div class="help-section"><h4>🗺️ 四域行路</h4><p><span class="help-tag">南域 初始</span><span class="help-tag">东域 筑基</span><span class="help-tag">北域 筑基</span><span class="help-tag">西域 金丹</span></p><p>通过四方驿道或行路选择前往其他地域。不同地域拥有不同地点与危险。</p></div>
  <div class="help-section"><h4>📜 宗门差事</h4><p>宗门任务包含采集灵草、妖丹、仙果，清剿妖兽，以及灵石/珍材捐献。任务面板提供真实获取路线与任务追踪。</p><p>宗门贡献可用于职位与宗门玩法；累计贡献不会因消费当前贡献而倒退。</p></div>
  <div class="help-section"><h4>⚔️ 战斗</h4><p>高境界会对低境界形成威压和伤害优势，越级战斗更危险，但成功时可能获得额外收益。</p><p>功法会随修为逐步解锁；冰冻、灼烧、治疗等效果各有用途。装备还能提供暴击、爆伤、闪避、格挡与抗性。</p></div>
  <div class="help-section"><h4>🐾 灵宠与法宝</h4><p>东域灵兽谷可查看、培养与选择出战灵宠。野外遇到可收服灵兽时，将其生命压到25%以下即可使用灵兽绳、缚灵玉、御灵葫芦等道具尝试收服；魔宠与王兽/神兽需要特殊契具。</p><p>灵宠拥有品质、等级上限与契约类型；御兽功法可提升收服成功率。西域法宝台可查看与强化已有法宝。</p></div>
  <div class="help-section"><h4>🌸 剧情与宗门</h4><p>主线会随着境界与战斗推进；苏晚晴相关剧情存在独立进展与结局。宗门还有任务、职位、百年大比与战争等长期玩法。</p><p>百年宗门大比前三的人类宗门，可获得本世纪进入万宗秘境的资格。</p></div>
  </div><div class="help-manual-actions"><button onclick="restartTutorial()">🌅 重走新手引路</button><button onclick="toggleTutorialTooltips()">${t?.showTooltips?'关闭':'开启'}问号提示</button><button onclick="closeHelpManual()">返回仙途</button></div></div>`;document.body.appendChild(el)
}
function closeHelpManual(){document.getElementById('helpManual')?.remove()}
function createTooltipLabel(label,text){return `${label}<span class="tooltip-trigger" tabindex="0">?<span class="tooltip-content">${text}</span></span>`}
function toggleTutorialTooltips(){const t=ensureTutorialState();t.showTooltips=!t.showTooltips;installTutorialTooltips(true);autoSave?.();showHelpManual()}
function installTutorialTooltips(refresh=false){const t=ensureTutorialState();if(!t)return;const specs=[['statExp','修为达到当前瓶颈后会进入突破流程；闭关十年最多推进一个小段。'],['statGold','灵石可用于购买丹药装备、宗门与洞府等多种消耗。'],['statAtk','攻击由境界、装备、套装、灵宠等共同决定。'],['statDef','防御由境界、装备、套装、灵宠与部分状态共同决定。']];for(const [id,tip] of specs){const value=document.getElementById(id),box=value?.closest?.('.stat');if(!box)continue;box.querySelector('.tooltip-trigger')?.remove();if(t.showTooltips){const lab=box.querySelector('.stat-name');if(lab)lab.insertAdjacentHTML('beforeend',`<span class="tooltip-trigger" tabindex="0">?<span class="tooltip-content">${tip}</span></span>`)}}}
function installGuideEntry(){
  const actions=document.querySelector('.world-hud-top > div:last-child');if(actions&&!document.getElementById('guideHudBtn')){const b=document.createElement('button');b.id='guideHudBtn';b.textContent='📖';b.title='修行指引';b.setAttribute('aria-label','修行指引');b.style.cssText='width:34px;height:30px;border-radius:8px;border:1px solid rgba(242,210,122,.28);background:rgba(242,210,122,.07);color:#e4c977;font-size:14px';b.onclick=showHelpManual;actions.insertBefore(b,actions.firstChild)}
}

window.addEventListener('load',()=>setTimeout(()=>{installTutorialInteractionHooks();installGuideEntry();installTutorialTooltips()},650));

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-04-tutorial-guide-script.js"]="28.68.32";

// 初入仙途：只突出下一步，奖励随进度一次性保存。
function firstJourneyV28687(){
  const raw=player.firstJourneyV28687;
  if(!raw||typeof raw!=='object')return null;
  raw.step=Math.max(0,Math.min(5,Math.floor(Number(raw.step)||0)));return raw;
}
function beginFirstJourneyV28687(){
  if(!forgeAllowedV2825())return;
  if(!firstJourneyV28687())player.firstJourneyV28687={step:0};
  autoSave();showFirstJourneyV28687();
}
function syncFirstJourneyV28687(){
  const host=document.querySelector('.world-hud-actions');if(!host)return;
  let b=document.getElementById('firstJourneyV28687');
  const s=firstJourneyV28687(),eligible=!!s||player.level<2;
  if(!eligible){b?.remove();return;}
  if(!b){b=document.createElement('button');b.id='firstJourneyV28687';b.onclick=beginFirstJourneyV28687;host.insertBefore(b,host.firstChild);}
  const names=['弱敌试手','装备木剑','配置功法','山道挑战','查看来信','引导已完成'];
  const label=s?`下一步 · ${names[s.step]}`:'初入仙途 · 开始引导';
  if(b.textContent!==label)b.textContent=label;
}
function showFirstJourneyV28687(){
  if(!forgeAllowedV2825())return;
  document.getElementById('afterBattleV2838')?.remove();
  const s=firstJourneyV28687();if(!s)return beginFirstJourneyV28687();
  const descriptions=[
    ['山脚试手','先对付山脚受伤的野狼，熟悉攻击与技能。此引导战气血40、攻击6；出发前会为你补满气血和灵力。','胜利获得木剑：攻击 +3、暴击 +1。','前往试手'],
    ['让装备成为实力','木剑已放入装备背包。点击下方穿戴，让攻击加成立即生效；已有更好武器则保留。','完成后进入御剑术配置。','穿戴武器'],
    ['让功法改变打法','御剑术消耗10灵力，造成1.5倍攻击伤害。配置后，战斗技能栏会展开兵刃系，方便找到它。','下一战试试御剑术，比较它与普通攻击的伤害。','配置御剑术'],
    ['守住山道','这次面对山道壮狼：气血100、攻击12。出发前补满状态；建议使用御剑术。引导期间不会被游荡怪物突然拉入战斗。','胜利获得120灵石，并发现一封发往凌霄宗的密信。','挑战山道壮狼'],
    ['雨夜来信','狼群散去，你在翻倒的货箱里发现一封带血的信。封口印着凌霄宗的云纹，信中却只有一句：“今夜，不要让药师上山。”落款旁，是你熟悉的一枚木牌印记。','接下来追寻主线人物；现有入世补助也可直接领取。','收好来信'],
    ['初入仙途已完成','你已亲手完成试手、穿戴、功法配置与山道挑战。自由探索前，记得查看气血、灵力和当前主线。','继续主线会获得修为、装备和新的剧情。','查看当前任务']
  ];
  const [title,body,reward,action]=descriptions[s.step];
  showStory(`<h3>初入仙途 · ${Math.min(s.step+1,5)}/5 · ${title}</h3><p>${body}</p><p style="color:#e5cf87">${reward}</p><button class="choice-btn" onclick="actFirstJourneyV28687(${s.step})">${action}</button><button class="choice-btn" onclick="closeWorldOverlay()">返回地图 · 稍后继续</button>${s.step>=4?'<button class="choice-btn" onclick="showRainChapterV286822()">追查来信 · 雨夜命牌案</button><button class="choice-btn" onclick="showEarlyEconomyV2773()">查看并领取入世补助</button>':''}<button class="choice-btn" onclick="leaveFirstJourneyV28687()">结束引导，自由探索</button>`,[]);
}
function leaveFirstJourneyV28687(){if(!forgeAllowedV2825())return;const s=firstJourneyV28687();if(s)s.paused=true;autoSave();closeWorldOverlay();showFloatingText('可从“下一步”继续引导。','#e5cf87');}
function actFirstJourneyV28687(expected){
  if(!forgeAllowedV2825())return;const s=firstJourneyV28687();if(!s||s.step!==expected)return;s.paused=false;
  if(s.step===0||s.step===3){
    if(s.step===3&&(!player.equipment.weapon||!getEquippedSkillNamesV212('sword').includes('御剑术'))){showFloatingText('请先装备武器并在功法配置中携带御剑术。','#ffd76a');if(!player.equipment.weapon)showEquipmentPanel();else showSkillLoadoutPanelV212('sword');return;}
    player.hp=getMaxHp();player.mp=getMaxMp();autoSave();closeWorldOverlay();
    const strong=s.step===3;startCombat({name:strong?'山道壮狼':'山脚受伤野狼',hp:strong?100:40,maxHp:strong?100:40,atk:strong?12:6,def:strong?5:1,gold:0,exp:0,_realmLevel:0,_realmPhase:0,_isTutorial:true,_isTaskBattle:true,_firstJourneyStepV28687:s.step});
    if(strong){combatSkillUiV212.open=true;combatSkillUiV212.element='sword';updateCombatChoices();}
    return;
  }
  if(s.step===1){
    if(!player.equipment.weapon){if(!player.equipmentInventory.includes('木剑')){showFloatingText('木剑已不在背包，请先从装备栏穿戴一把武器。','#ffd76a');return;}if(!equipItem('木剑'))return;}
    s.step=2;showFloatingText('武器已生效：木剑提供攻击+3、暴击+1；更好武器会保留。','#9fe6bd');
  }else if(s.step===2){
    if(!player.skills.some(x=>x.name==='御剑术'))player.skills.push({...SKILLS.find(x=>x.name==='御剑术')});
    const slots=ensureSkillLoadoutV212().sword;if(!slots.includes('御剑术')){if(slots.length>=3){showFloatingText('兵刃系已携带3个技能，请换入御剑术，再回来继续。','#ffd76a');showSkillLoadoutPanelV212('sword');return;}slots.push('御剑术');}s.step=3;
  }else if(s.step===4){s.step=5;s.letterRead=true;}
  else {showTaskPanel();return;}
  autoSave();updateStats();showFirstJourneyV28687();
}
function finishFirstJourneyBattleV28687(enemy){
  const s=firstJourneyV28687(),step=enemy?._firstJourneyStepV28687;
  if(!s||!enemy||enemy.hp>0||![0,3].includes(step)||s.step!==step)return;
  if(step===0){if(!playerOwnsEquipment('木剑'))player.equipmentInventory.push('木剑');s.step=1;}
  else {player.gold+=120;s.step=4;}
  autoSave();const owner=player;
  setTimeout(()=>{if(player===owner&&forgeAllowedV2825()){closeWorldOverlay();showFirstJourneyV28687();}},1800);
}
