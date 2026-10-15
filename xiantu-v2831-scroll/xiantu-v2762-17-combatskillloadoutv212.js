// Read-only estimate: the engine settles one burn tick before a valid action.
function burnComboHintV286834(skill,enemy){
  if(skill?.effect!=='burnDetonate')return '';
  const damage=Math.max(0,Math.floor(Number(enemy?.burnStacks)||0));
  const turns=Math.max(0,Math.floor(Number(enemy?.burnTurns)||0));
  if(!damage||!turns)return '尚无灼烧可引爆 · 可先施展焚心炎等灼烧招式';
  const extra=damage*Math.max(0,turns-1);
  return `出招前灼烧${damage}点 · 预计额外引爆${extra}点（不含本招直伤）；消耗灼烧，移除其破甲${enemy._burnWeakV286818?'、降攻':''}${enemy._burnHealBlockV286818?'、禁疗':''}。目标存活且成功出手时生效`;
}
function burnComboMarkupV286834(skill,compact=false){
  let text=burnComboHintV286834(skill,typeof currentEnemy==='undefined'?null:currentEnemy);
  if(compact&&text)text=text.includes('尚无')?'无灼烧 · 可先用焚心炎':text.split('（')[0]+'；消耗灼烧及附带效果';
  return text?`<small class="burn-combo-v286834">${skillTextEscapeV212(text)}</small>`:'';
}
// ===== V27.13 每个系最多携带3个技能；战斗技能栏默认折叠 =====
const SKILL_ELEMENT_META_V212={
  sword:{label:'兵刃系（剑 / 棍 / 枪）',short:'⚔️ 兵刃',icon:'⚔️'},
  thunder:{label:'雷系',short:'⚡ 雷',icon:'⚡'},
  ice:{label:'冰系',short:'❄️ 冰',icon:'❄️'},
  fire:{label:'火系',short:'🔥 火',icon:'🔥'},
  heal:{label:'治愈',short:'🌿 愈',icon:'🌿'}
};
const SKILL_ELEMENT_ORDER_V212=['sword','thunder','ice','fire','heal'];
const SKILL_MAX_PER_ELEMENT_V212=3;
let combatSkillUiV212={open:false,element:'sword',details:false};
try{const saved=localStorage.getItem('xiantu_skill_tab_v2856');if(SKILL_ELEMENT_ORDER_V212.includes(saved))combatSkillUiV212.element=saved;}catch(_){}
let skillConfigElementV212='sword';
let pendingSkillSwapV213=null;

function getPlayerV212(){try{return window.player||player}catch(_){return window.player||null}}
function getLearnedSkillsByElementV212(element){const p=getPlayerV212();return (p?.skills||[]).filter(s=>s&&s.element===element)}
function makeEmptySkillLoadoutV212(){return {sword:[],thunder:[],ice:[],fire:[],heal:[]}}
function sanitizeSkillLoadoutV212(loadout,p,fillDefault=false){
  const out=makeEmptySkillLoadoutV212();
  for(const el of SKILL_ELEMENT_ORDER_V212){
    const learned=(p?.skills||[]).filter(s=>s?.element===el);
    const learnedNames=new Set(learned.map(s=>s.name));
    const raw=Array.isArray(loadout?.[el])?loadout[el]:[];
    for(const n of raw){if(typeof n==='string'&&learnedNames.has(n)&&!out[el].includes(n)&&out[el].length<SKILL_MAX_PER_ELEMENT_V212)out[el].push(n)}
    if(fillDefault){for(const s of learned){if(out[el].length>=SKILL_MAX_PER_ELEMENT_V212)break;if(!out[el].includes(s.name))out[el].push(s.name)}}
  }
  return out;
}
function ensureSkillLoadoutV212(p=getPlayerV212()){
  if(!p)return makeEmptySkillLoadoutV212();
  const initialized=!!p.skillLoadoutInitializedV212;
  p.skillLoadoutV212=sanitizeSkillLoadoutV212(p.skillLoadoutV212,p,!initialized);
  p.skillLoadoutInitializedV212=true;
  return p.skillLoadoutV212;
}
function getEquippedSkillNamesV212(element){return ensureSkillLoadoutV212()?.[element]||[]}
function getTotalEquippedSkillsV212(){const l=ensureSkillLoadoutV212();return SKILL_ELEMENT_ORDER_V212.reduce((n,e)=>n+(l[e]?.length||0),0)}
function firstUsableSkillElementV212(preferred=combatSkillUiV212.element){const l=ensureSkillLoadoutV212();if(l[preferred]?.length)return preferred;return SKILL_ELEMENT_ORDER_V212.find(e=>l[e]?.length)||'sword'}
function skillTextEscapeV212(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

const v212CreatePlayerBase=window.createDefaultPlayer;
if(typeof v212CreatePlayerBase==='function')window.createDefaultPlayer=function(){const p=v212CreatePlayerBase.apply(this,arguments);p.skillLoadoutV212=makeEmptySkillLoadoutV212();p.skillLoadoutInitializedV212=false;return p};
const v212NormalizePlayerBase=window.normalizePlayer;
if(typeof v212NormalizePlayerBase==='function')window.normalizePlayer=function(saved={}){const p=v212NormalizePlayerBase.apply(this,arguments);p.skillLoadoutV212=sanitizeSkillLoadoutV212(saved?.skillLoadoutV212||p.skillLoadoutV212,p,false);p.skillLoadoutInitializedV212=!!saved?.skillLoadoutInitializedV212||!!saved?.skillLoadoutV212;if(!p.skillLoadoutInitializedV212)ensureSkillLoadoutV212(p);return p};

function toggleCombatSkillDrawerV212(){combatSkillUiV212.open=!combatSkillUiV212.open;updateCombatChoices?.()}
function selectCombatSkillElementV212(element){if(!SKILL_ELEMENT_ORDER_V212.includes(element))return;combatSkillUiV212.open=true;combatSkillUiV212.element=element;try{localStorage.setItem('xiantu_skill_tab_v2856',element)}catch(_){}updateCombatChoices?.()}
function renderCompactCombatSkillsV212(){
  if(!isPlayerTurn||gameState!=='combat')return;
  const div=document.getElementById('combatChoices');if(!div)return;
  ensureSkillLoadoutV212();
  // 原战斗逻辑先生成全部技能按钮；这里只移除技能按钮，保留普攻、背包、逃跑和收服按钮。
  for(const b of [...div.querySelectorAll('button.choice-btn')]){const click=b.getAttribute('onclick')||'';if(/^combat\(['\"]skill['\"]/.test(click))b.remove()}
  div.querySelector('.combat-quick-v286816')?.remove();div.querySelector('.combat-skill-toggle-v212')?.remove();div.querySelector('.combat-skill-drawer-v212')?.remove();
  const attack=[...div.querySelectorAll('button.choice-btn')].find(b=>(b.getAttribute('onclick')||'').includes("combat('attack')"));
  const total=getTotalEquippedSkillsV212();
  const toggle=document.createElement('button');toggle.className='choice-btn combat-skill-toggle-v212';toggle.type='button';toggle.setAttribute('aria-expanded',String(combatSkillUiV212.open));toggle.setAttribute('aria-controls','combatSkillDrawerV2856');toggle.onclick=toggleCombatSkillDrawerV212;toggle.innerHTML=`更多招式 ${combatSkillUiV212.open?'▲':'▼'} <span class="combat-skill-count-v212">已携带 ${total}/15</span>`;
  if(attack)attack.insertAdjacentElement('afterend',toggle);else div.insertBefore(toggle,div.firstChild);
  // Follow the selected family in equipped-slot order; preserve original combat indices.
  if(!SKILL_ELEMENT_ORDER_V212.includes(combatSkillUiV212.element))combatSkillUiV212.element='sword';
  const meta=SKILL_ELEMENT_META_V212[combatSkillUiV212.element];
  const quick=getEquippedSkillNamesV212(combatSkillUiV212.element).map(name=>{
    const index=(player.skills||[]).findIndex(s=>s?.name===name);
    return {s:player.skills[index],index};
  }).filter(x=>x.s);
  const bar=document.createElement('div');bar.className='combat-quick-v286816';bar.setAttribute('aria-label',meta.label+'招式');
  bar.innerHTML=`<div class="combat-quick-heading-v286819">${meta.icon} ${meta.label} · 已携带 ${quick.length}/${SKILL_MAX_PER_ELEMENT_V212}</div>`+(quick.map(({s,index})=>{
    const available=getCombatSkillAvailabilityV2769(index),cost=Math.max(0,Number(s.mpCost)||0);
    return `<button type="button" class="choice-btn quick-skill-v286816" ${available.ok?'':'disabled'} onclick="combat('skill',${index})" title="${skillTextEscapeV212(available.ok?s.desc:available.reason)}"><b>${skillTextEscapeV212(s.name)}</b><small>${cost} 灵力${available.ok?'':' · '+skillTextEscapeV212(available.reason)}</small>${burnComboMarkupV286834(s,true)}</button>`;
  }).join('')||'<div class="combat-quick-empty-v286819">此系暂未携带技能，可在更多招式中配置。</div>');
  div.insertBefore(bar,toggle);
  if(!combatSkillUiV212.open)return;
  const drawer=document.createElement('div');drawer.className='combat-skill-drawer-v212';drawer.id='combatSkillDrawerV2856';
  const loadout=ensureSkillLoadoutV212();
  const tabs=SKILL_ELEMENT_ORDER_V212.map(el=>{const m=SKILL_ELEMENT_META_V212[el],count=loadout[el]?.length||0;return `<button type="button" class="combat-skill-tab-v212 ${combatSkillUiV212.element===el?'active':''}" aria-pressed="${combatSkillUiV212.element===el}" onclick="selectCombatSkillElementV212('${el}')">${m.short}<small>${count}/3</small></button>`}).join('');
  const names=loadout[combatSkillUiV212.element]||[];
  const skillBtns=names.map(name=>{
    const idx=(player.skills||[]).findIndex(s=>s?.name===name),s=idx>=0?player.skills[idx]:null;if(!s)return '';
    const available=getCombatSkillAvailabilityV2769(idx),cost=Math.max(0,Number(s.mpCost)||0);
    const missing=Math.max(0,Math.ceil(cost-(Number(player.mp)||0)));
    const reason=available.ok?`施展后剩 ${Math.max(0,Math.floor(player.mp-cost))} 灵力`:(available.reason==='灵力不足'?`还差 ${missing} 灵力`:available.reason);
    const tags=[s.damage?`${s.damage}倍攻击`:'',s.heal?`回复${Math.round(s.heal*100)}%气血`:'',s.guardRatio?`护体减伤${Math.round(s.guardRatio*100)}%`:'',s.armorPierce?`穿透${Math.round(s.armorPierce*100)}%防御`:''].filter(Boolean).join(' · ')||'辅助术法';
    return `<button type="button" class="choice-btn combat-skill-btn-v212" ${available.ok?'':'disabled'} onclick="combat('skill',${idx})"><span class="skill-title-v2856">${skillTextEscapeV212(s.name)}<span class="cost">${cost} 灵力</span></span><span class="skill-tags-v2856">${skillTextEscapeV212(tags)}</span><span class="skill-ready-v2856 ${available.ok?'':'unavailable'}">${skillTextEscapeV212(reason)}</span>${burnComboMarkupV286834(s)}${combatSkillUiV212.details?`<span class="skill-desc-v2856">${skillTextEscapeV212(s.desc||'暂无补充说明')}</span>`:''}</button>`;
  }).join('');
  drawer.innerHTML=`<div class="combat-skill-tabs-v212">${tabs}</div><div class="skill-drawer-heading-v2856"><b>${SKILL_ELEMENT_META_V212[combatSkillUiV212.element].label}</b><button type="button" aria-expanded="${combatSkillUiV212.details}" onclick="toggleSkillDetailsV2856()">${combatSkillUiV212.details?'收起':'展开'}招式说明</button></div><div class="combat-skill-list-v212">${skillBtns||'<div class="combat-skill-empty-v212">此系暂未携带技能。可在下方【配置技能】中选择已学招式。</div>'}</div><div class="combat-skill-tools-v212"><span>点击可用招式即可出手 · 每系最多3招</span><button type="button" onclick="showSkillLoadoutPanelV212('${combatSkillUiV212.element}')">配置技能</button></div>`;
  toggle.insertAdjacentElement('afterend',drawer);
}

const v212CombatChoicesBase=window.updateCombatChoices;
window.updateCombatChoices=function(){const r=v212CombatChoicesBase?.apply(this,arguments);renderCompactCombatSkillsV212();return r};
const v212StartCombatBase=window.startCombat;
if(typeof v212StartCombatBase==='function')window.startCombat=function(){combatSkillUiV212.open=false;combatSkillUiV212.element=firstUsableSkillElementV212(combatSkillUiV212.element);return v212StartCombatBase.apply(this,arguments)};

function unequipSkillSlotV213(element,index){
  const p=getPlayerV212();if(!p||!SKILL_ELEMENT_ORDER_V212.includes(element))return;
  const arr=ensureSkillLoadoutV212(p)[element]||[];
  if(index<0||index>=arr.length)return;
  const old=arr[index];arr.splice(index,1);pendingSkillSwapV213=null;p.skillLoadoutInitializedV212=true;autoSave?.();renderSkillLoadoutPanelV212();
  if(typeof currentEnemy!=='undefined'&&currentEnemy&&isPlayerTurn)updateCombatChoices?.();
  showFloatingText?.(`↩️ 已卸下技能【${old}】`,'#d9c472');
}
function chooseSkillSwapV213(skillName){
  const p=getPlayerV212();if(!p)return;const skill=(p.skills||[]).find(s=>s?.name===skillName);if(!skill)return;
  const arr=ensureSkillLoadoutV212(p)[skill.element]||[];
  if(arr.includes(skillName)){pendingSkillSwapV213=null;return renderSkillLoadoutPanelV212()}
  if(arr.length<SKILL_MAX_PER_ELEMENT_V212){arr.push(skillName);p.skillLoadoutInitializedV212=true;pendingSkillSwapV213=null;autoSave?.();renderSkillLoadoutPanelV212();if(typeof currentEnemy!=='undefined'&&currentEnemy&&isPlayerTurn)updateCombatChoices?.();showFloatingText?.(`✅ 已携带【${skillName}】`,'#69f0ae');return}
  pendingSkillSwapV213={element:skill.element,newSkill:skillName};renderSkillLoadoutPanelV212();
}
function confirmSkillSwapV213(index){
  const p=getPlayerV212(),x=pendingSkillSwapV213;if(!p||!x)return;const arr=ensureSkillLoadoutV212(p)[x.element]||[];
  if(index<0||index>=arr.length)return;const old=arr[index];arr[index]=x.newSkill;p.skillLoadoutInitializedV212=true;pendingSkillSwapV213=null;autoSave?.();renderSkillLoadoutPanelV212();
  if(typeof currentEnemy!=='undefined'&&currentEnemy&&isPlayerTurn)updateCombatChoices?.();
  showFloatingText?.(`🔄 【${old}】→【${arr[index]}】`,'#69f0ae');
}
function cancelSkillSwapV213(){pendingSkillSwapV213=null;renderSkillLoadoutPanelV212()}
function toggleSkillEquipV212(skillName){
  const p=getPlayerV212();if(!p)return;const skill=(p.skills||[]).find(s=>s?.name===skillName);if(!skill||!SKILL_ELEMENT_ORDER_V212.includes(skill.element))return;
  const arr=ensureSkillLoadoutV212(p)[skill.element]||[];const i=arr.indexOf(skillName);
  if(i>=0)return unequipSkillSlotV213(skill.element,i);
  return chooseSkillSwapV213(skillName);
}
function autoPickSkillLoadoutV212(element=skillConfigElementV212){
  const p=getPlayerV212();if(!p)return;const learned=getLearnedSkillsByElementV212(element);
  // 推荐优先高伤害/高治疗；辅助技能按功耗与后期技能顺序作为次级参考。
  const scored=learned.map((s,i)=>({s,score:(Number(s.damage)||0)*100+(Number(s.heal)||0)*100+(s.effect?12:0)+(Number(s.mpCost)||0)*.1+i*.01})).sort((a,b)=>b.score-a.score);
  ensureSkillLoadoutV212(p)[element]=scored.slice(0,3).map(x=>x.s.name);p.skillLoadoutInitializedV212=true;autoSave?.();renderSkillLoadoutPanelV212();if(typeof currentEnemy!=='undefined'&&currentEnemy&&isPlayerTurn)updateCombatChoices?.();showFloatingText?.(`✅ 已为${SKILL_ELEMENT_META_V212[element].label}推荐3个技能`,'#69f0ae')
}
function selectSkillConfigElementV212(element){if(!SKILL_ELEMENT_ORDER_V212.includes(element))return;skillConfigElementV212=element;renderSkillLoadoutPanelV212()}
function showSkillLoadoutPanelV212(element='sword'){pendingSkillSwapV213=null;skillConfigElementV212=SKILL_ELEMENT_ORDER_V212.includes(element)?element:'sword';document.getElementById('skillLoadoutOverlayV212')?.remove();const el=document.createElement('div');el.id='skillLoadoutOverlayV212';el.className='skill-loadout-overlay-v212';el.onclick=e=>{if(e.target===el)closeSkillLoadoutPanelV212()};document.body.appendChild(el);renderSkillLoadoutPanelV212()}
function closeSkillLoadoutPanelV212(){pendingSkillSwapV213=null;document.getElementById('skillLoadoutOverlayV212')?.remove();if(typeof currentEnemy!=='undefined'&&currentEnemy&&isPlayerTurn)updateCombatChoices?.()}
function renderSkillLoadoutPanelV212(){
  const root=document.getElementById('skillLoadoutOverlayV212');if(!root)return;const p=getPlayerV212();if(!p)return;const loadout=ensureSkillLoadoutV212(p),m=SKILL_ELEMENT_META_V212[skillConfigElementV212],learned=getLearnedSkillsByElementV212(skillConfigElementV212),equipped=loadout[skillConfigElementV212]||[];
  const tabs=SKILL_ELEMENT_ORDER_V212.map(el=>{const mm=SKILL_ELEMENT_META_V212[el],n=loadout[el]?.length||0;return `<button class="skill-loadout-tab-v212 ${skillConfigElementV212===el?'active':''}" onclick="selectSkillConfigElementV212('${el}')">${mm.short} ${n}/3</button>`}).join('');
  const equippedSlots=Array.from({length:3},(_,i)=>{const name=equipped[i],sk=name?learned.find(x=>x.name===name):null;if(!name)return `<div class="skill-equipped-slot-v213 empty">空技能槽 ${i+1}</div>`;return `<div class="skill-equipped-slot-v213"><span class="slot-no">槽位 ${i+1}</span><div class="slot-name">${m.icon} ${skillTextEscapeV212(name)}</div><div class="slot-meta">${sk?`${sk.mpCost||0}灵力${sk.damage?` · ${sk.damage}倍`:''}${sk.heal?` · 治疗${Math.round(sk.heal*100)}%`:''}`:''}</div><div class="slot-meta">${skillTextEscapeV212(sk?.desc||'')}</div><button onclick="unequipSkillSlotV213('${skillConfigElementV212}',${i})">卸下</button></div>`}).join('');
  const reserve=learned.filter(s=>!equipped.includes(s.name));
  const reserveCards=reserve.map(s=>`<div class="skill-reserve-card-v213" onclick="chooseSkillSwapV213('${skillTextEscapeV212(s.name)}')"><div class="name">${m.icon} ${skillTextEscapeV212(s.name)}</div><div class="meta">${s.mpCost||0} 灵力${s.damage?` · ${s.damage}倍伤害`:''}${s.heal?` · 恢复${Math.round(s.heal*100)}%气血`:''}</div><div class="meta">${skillTextEscapeV212(s.desc||'')}</div><div class="action">${equipped.length>=3?'🔄 点此选择替换槽位':'➕ 点此加入携带栏'}</div></div>`).join('');
  let swapBox='';if(pendingSkillSwapV213&&pendingSkillSwapV213.element===skillConfigElementV212){const nn=pendingSkillSwapV213.newSkill;const opts=equipped.map((n,i)=>`<button onclick="confirmSkillSwapV213(${i})">替换槽${i+1}<br>【${skillTextEscapeV212(n)}】</button>`).join('');swapBox=`<div class="skill-swap-box-v213"><div class="title">🔄 准备换上【${skillTextEscapeV212(nn)}】</div><div class="hint">当前3格已满，请选择要替换掉的技能：</div><div class="skill-swap-options-v213">${opts}</div><button class="skill-swap-cancel-v213" onclick="cancelSkillSwapV213()">取消更换</button></div>`}
  root.innerHTML=`<div class="skill-loadout-panel-v212" onclick="event.stopPropagation()"><div class="skill-loadout-head-v212"><div><h3>🧩 更换战斗技能</h3><p>每个系最多携带3个。上方是当前携带槽，下方是所有已学但未携带的技能。</p></div><button aria-label="关闭" class="skill-loadout-close-v212" onclick="closeSkillLoadoutPanelV212()">✕</button></div><div class="skill-loadout-tabs-v212">${tabs}</div><div class="skill-loadout-summary-v212"><span>${m.icon} <b>${m.label}</b> · 携带 ${equipped.length}/3 · 候选 ${reserve.length}</span><button onclick="autoPickSkillLoadoutV212('${skillConfigElementV212}')">✨ 推荐3个</button></div><div class="skill-equipped-slots-v213">${equippedSlots}</div>${swapBox}<div class="skill-reserve-title-v213"><b>📚 未携带技能库</b><span>${reserve.length} 个可更换技能</span></div><div class="skill-reserve-list-v213">${reserveCards||'<div class="skill-loadout-empty-v212">当前此系没有多余技能；以后学到的新技能会自动出现在这里。</div>'}</div><details class="skill-loadout-foot-v212"><summary>查看流派羁绊与激活条件</summary>${buildGuideV286821()}</details><div class="skill-loadout-foot-v212">可以在大地图 ☰ →【更换技能】随时调整，不必进入战斗。战斗中也能从技能折叠栏进入配置。</div></div>`;
}

// 学到新技能后保留“已学习”状态；若该系从未配置，则首次配置时自动带入前3个。
const v212SyncUnlockedBase=window.syncUnlockedSkills;
if(typeof v212SyncUnlockedBase==='function')window.syncUnlockedSkills=function(){const before=(getPlayerV212()?.skills||[]).length,r=v212SyncUnlockedBase.apply(this,arguments),p=getPlayerV212();if(p&&(!p.skillLoadoutInitializedV212||!p.skillLoadoutV212))ensureSkillLoadoutV212(p);if((p?.skills||[]).length!==before)autoSave?.();return r};

// 暴露给内联 onclick。
window.toggleCombatSkillDrawerV212=toggleCombatSkillDrawerV212;window.selectCombatSkillElementV212=selectCombatSkillElementV212;window.showSkillLoadoutPanelV212=showSkillLoadoutPanelV212;window.closeSkillLoadoutPanelV212=closeSkillLoadoutPanelV212;window.selectSkillConfigElementV212=selectSkillConfigElementV212;window.toggleSkillEquipV212=toggleSkillEquipV212;window.autoPickSkillLoadoutV212=autoPickSkillLoadoutV212;window.unequipSkillSlotV213=unequipSkillSlotV213;window.chooseSkillSwapV213=chooseSkillSwapV213;window.confirmSkillSwapV213=confirmSkillSwapV213;window.cancelSkillSwapV213=cancelSkillSwapV213;

// V27.69：自动演武与手动出招共用同一份技能资格检查。
function getCombatSkillAvailabilityV2769(index){
 const p=getPlayerV212();
 if(!p||!Number.isInteger(index)||index<0||!Array.isArray(p.skills)||index>=p.skills.length)return {ok:false,reason:'技能不存在'};
 const skill=p.skills[index];if(!skill||typeof skill.name!=='string')return {ok:false,reason:'技能不存在'};
 const loadout=ensureSkillLoadoutV212(p);
 if(!loadout[skill.element]?.includes(skill.name))return {ok:false,reason:'该技能未携带，请先在技能配置中装备'};
 if(skill.requiredWeapon && weaponFamilyV2790()!==skill.requiredWeapon)return {ok:false,reason:'需装备'+({staff:'棍',spear:'枪',wand:'法杖'}[skill.requiredWeapon]||'对应武器')+'才能施展'};
 const cost=Number(skill.mpCost??0),mp=Number(p.mp);
 if(!Number.isFinite(cost)||cost<0)return {ok:false,reason:'技能灵力消耗无效'};
 if(!Number.isFinite(mp)||mp<cost)return {ok:false,reason:'灵力不足'};
 return {ok:true,skill,index,cost};
}
function getAvailableCombatSkillsV2769(){
 const p=getPlayerV212();if(!p)return [];
 return (p.skills||[]).map((_,index)=>getCombatSkillAvailabilityV2769(index)).filter(x=>x.ok);
}

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-17-combatskillloadoutv212.js"]="28.68.41";

function toggleSkillDetailsV2856(){combatSkillUiV212.details=!combatSkillUiV212.details;updateCombatChoices?.();}
