/* Six bounded gameplay decisions; all economic actions remain player-confirmed. */
const JEV_WORLD_V2846={revision:0,panel:null,selection:null,pending:null,cache:new Map(),hero:new WeakMap(),heroEnabled:false,meter:null,storageOk:true};
const JEV_METER_KEY_V2846='xiantu_jev_usage_v2846';
const JEV_PRICE_V2846=.042/1000000;
function jevNumberV2846(v){return Math.max(0,Math.min(1e9,Number(v)||0));}
function jevPercentV2846(a,b){return Math.min(100,Math.round(jevNumberV2846(a)/Math.max(1,jevNumberV2846(b))*100));}
function jevMeterV2846(){
  const day=new Date().toISOString().slice(0,10);let stored;
  try{stored=JSON.parse(localStorage.getItem(JEV_METER_KEY_V2846)||'null');}catch(_){JEV_WORLD_V2846.storageOk=false;}
  const valid=x=>x?.day===day&&['calls','tokens','reported'].every(k=>Number.isSafeInteger(x[k])&&x[k]>=0&&x[k]<=1e9);
  const current=JEV_WORLD_V2846.meter;
  const next=valid(current)?current:{day,calls:0,tokens:0,reported:0};
  if(valid(stored))for(const k of ['calls','tokens','reported'])next[k]=Math.max(next[k],stored[k]);
  JEV_WORLD_V2846.meter=next;return next;
}
function jevSaveMeterV2846(){try{localStorage.setItem(JEV_METER_KEY_V2846,JSON.stringify(JEV_WORLD_V2846.meter));}catch(_){JEV_WORLD_V2846.storageOk=false;}}
function jevReserveV2846(){const m=jevMeterV2846();m.calls++;jevSaveMeterV2846();return true;}
function jevUsageV2846(data){
  if(!data?.usage||!Number.isSafeInteger(data.usage.input_tokens)||data.usage.input_tokens<0||data.usage.input_tokens>1000000)return;
  const m=jevMeterV2846();m.tokens+=data.usage.input_tokens;m.reported++;jevSaveMeterV2846();
}
function jevWireStateV2846(task,context,options){return {task,version:1,context:context.map(jevNumberV2846),options:options.map((o,i)=>({id:'o'+i,a:jevNumberV2846(o.a),b:jevNumberV2846(o.b),c:jevNumberV2846(o.c),d:jevNumberV2846(o.d),e:jevNumberV2846(o.e)}))};}
async function jevDecideV2846(state,fallback,fresh=()=>true,timeout=4500){
  const local=note=>({choice:fallback,source:'local',note});
  if(!fresh()||document.hidden)return local('当前操作已变化');
  const endpoint=forgeJevEndpointV2842(),access=FORGE_ADVICE_V2842.access,key=JSON.stringify(state);
  if(!access||!endpoint)return local('尚未解锁，使用本地判断');
  const old=JEV_WORLD_V2846.cache.get(key);
  if(old&&Date.now()-old.time<60000)return {...old.data,note:'复用一分钟内结果，未新增请求'};
  if(FORGE_ADVICE_V2842.busy||Date.now()<FORGE_ADVICE_V2842.nextAt)return local('请求间隔内，使用本地判断');
  jevReserveV2846();
  const controller=typeof AbortController==='function'?new AbortController():null;
  let timer,cancel;const cancelled=new Promise((_,reject)=>{cancel=()=>reject(Error('cancelled'));});
  const pending={controller,cancel};JEV_WORLD_V2846.pending=pending;FORGE_ADVICE_V2842.busy=pending;FORGE_ADVICE_V2842.nextAt=Date.now()+12000;
  try{
    const data=await Promise.race([(async()=>{
      const r=await (typeof jevFetchV2850==='function'?jevFetchV2850:fetch)(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Xiantu-Access':access},body:key,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller?.signal});
      if(!r.ok)throw Error(String(r.status));const value=await r.json();jevUsageV2846(value);return value;
    })(),cancelled,new Promise((_,reject)=>{timer=setTimeout(()=>{controller?.abort();reject(Error('timeout'));},timeout);})]);
    if(!fresh()||FORGE_ADVICE_V2842.access!==access)return local('当前操作已变化');
    if(data?.source!=='jev'||data.task!==state.task||!state.options.some(o=>o.id===data.choice)||typeof data.confidence!=='number'||!Number.isFinite(data.confidence)||data.confidence<0||data.confidence>1)throw Error('format');
    if(data.confidence<.7)return local('Jev 暂无明确判断，使用本地规则');
    const answer={choice:data.choice,source:'jev',note:`Jev 置信度 ${Math.round(data.confidence*100)}%（不是成功率）`};
    JEV_WORLD_V2846.cache.set(key,{time:Date.now(),data:answer});if(JEV_WORLD_V2846.cache.size>24)JEV_WORLD_V2846.cache.delete(JEV_WORLD_V2846.cache.keys().next().value);
    return answer;
  }catch(error){return local(({400:'请更新云函数至 V28.50',401:'访问口令不正确',403:'当前域名未获允许',429:'云端限流',timeout:'云端响应超时',cancelled:'已取消'})[error.message]||'云端暂不可用');}
  finally{clearTimeout(timer);if(JEV_WORLD_V2846.pending===pending)JEV_WORLD_V2846.pending=null;if(FORGE_ADVICE_V2842.busy===pending)FORGE_ADVICE_V2842.busy=null;}
}
function closeJevWorldV2846(){
  JEV_WORLD_V2846.revision++;JEV_WORLD_V2846.selection=null;
  JEV_WORLD_V2846.panel?.remove();JEV_WORLD_V2846.panel=null;
  const p=JEV_WORLD_V2846.pending;if(p){p.cancel();p.controller?.abort();}
}
window.jevStoryChangedV2846=closeJevWorldV2846;
function jevModalV2846(title,html){
  closeJevWorldV2846();const panel=document.createElement('section');panel.id='jevWorldPanelV2846';panel.className='jev-world-v2846';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',title);
  panel.innerHTML=`<div class="jev-world-card-v2846"><header><h2>${discipleEscV2815(title)}</h2><button onclick="closeJevWorldV2846()" aria-label="关闭">×</button></header>${html}</div>`;
  document.body.appendChild(panel);JEV_WORLD_V2846.panel=panel;return panel;
}
function jevCanActV2846(){return !!player&&gameState==='exploring'&&!player.breakthrough?.isAnimating&&!COMBAT_FINISH_V2764.settling;}
function jevEntryV2846(call,label){return `<button class="choice-btn" onclick="${call}">☯ ${label}</button>`;}
function showJevHubV2846(){
  window.pauseForJevV2846?.();
  const m=jevMeterV2846();
  jevModalV2846('天机参详 · 用量与设置',`<p>天机参详由 Jev 提供推演服务，可在此查看用量与调整设置。</p><p>本机今日已发请求 <strong>${m.calls} 次 · 不设次数上限</strong> · 已回报输入 ${m.tokens.toLocaleString()} token</p><p>已回报用量估算 <b>$${(m.tokens*JEV_PRICE_V2846).toFixed(6)}</b>。${m.reported}/${m.calls} 次有用量回报；未回报、超时请求仍可能计费。此处不是账户余额。</p><p>官网参考价：每百万输入 token $0.042，输出免费（2026-09-23）。腾讯云费用另计。每日统计按 UTC 重置；游戏不设每日、每小时或单场调用次数上限。多设备或多人游玩会共同消耗账户额度。</p>${!JEV_WORLD_V2846.storageOk?'<p>浏览器无法保存计数，目前只统计本页。</p>':''}<button class="choice-btn" onclick="closeJevWorldV2846();showCompanionV2849()">同伴随行 / Jev 支援设置</button><p>NPC 新入口：地图人物行为、执事安排任务、商人推荐、夜无疆宿敌应对。敌对修士沿用战斗里的怪兽 Jev 开关。</p>${typeof jevFriendsModeV2850==='function'&&jevFriendsModeV2850()?jevFriendsControlsV2850():`<label>游戏访问口令<input id="jevHubAccessV2846" type="password" maxlength="128" autocomplete="off" autocapitalize="off" placeholder="已解锁可留空，不填 API 密钥"></label>${jevRememberHtmlV2845('jevHub')}<button class="choice-btn" onclick="unlockJevHubV2846()">保存口令</button><p id="jevHubStatusV2846" role="status">${FORGE_ADVICE_V2842.access?'已解锁，可按需判断':'未解锁，仍可使用全部本地玩法'}</p>`}<label class="jev-remember-v2845"><input type="checkbox" ${JEV_WORLD_V2846.heroEnabled?'checked':''} onchange="setHeroJevV2846(this.checked)">动画演武使用 Jev 选招（关键战况变化时判断）</label><p>首次出招、气血或灵力区间变化、首领阶段变化时判断，最多等 1.5 秒；其余回合用现有自动策略。试玩版默认开启，可随时关闭；不会自动吃药、逃跑。</p><p>战斗中打开本面板会暂停自动出招，关闭后点击战斗界面的「继续」。其他五处在对应界面点「Jev」才请求：弟子事务、人物关系、战役战术、万宗秘境、宗门大殿。洗练与怪兽也共用今日计数。页面打开仅连接试玩服务，不请求模型；地图移动、设置保存不请求模型。</p><button class="choice-btn" onclick="clearJevDeviceV2845();setHeroJevV2846(false);showJevHubV2846()">停止本设备 Jev</button>`);
}
function unlockJevHubV2846(){
  const input=document.getElementById('jevHubAccessV2846'),access=input?.value.trim()||FORGE_ADVICE_V2842.access;if(input)input.value='';
  const status=document.getElementById('jevHubStatusV2846');
  if(!validJevAccessV2845(access)){if(status)status.textContent='请输入 16—128 位游戏访问口令，不是 API 密钥。';return;}
  FORGE_ADVICE_V2842.access=access;FORGE_ADVICE_V2842.cache.clear();JEV_WORLD_V2846.cache.clear();saveJevDeviceV2845();if(status)status.textContent='已解锁，本次保存没有调用 Jev。';
}
function setHeroJevV2846(value){
  JEV_WORLD_V2846.heroEnabled=!!value;
  try{localStorage.setItem('xiantu_jev_hero_v2846',value?'1':'0');}catch(_){}
}
try{JEV_WORLD_V2846.heroEnabled=localStorage.getItem('xiantu_jev_hero_v2846')==='1';}catch(_){}
async function jevOfferV2846(title,task,context,options,localIndex,valid){
  if(!valid()||options.length===0)return;
  const owner=player,signature=JSON.stringify(jevWireStateV2846(task,context,options));
  const panel=jevModalV2846(title,'<p id="jevDecisionStatusV2846" role="status">正在判断……取消后不会执行。</p><div id="jevDecisionActionsV2846"></div><p>仅返回现有合法选项，确认前不改变资源或进度。</p>');
  const rev=JEV_WORLD_V2846.revision,fresh=()=>player===owner&&JEV_WORLD_V2846.panel===panel&&JEV_WORLD_V2846.revision===rev&&valid();
  const answer=options.length===1?{choice:'o0',source:'local',note:'只有一个合法选项，无需请求'}:await jevDecideV2846(JSON.parse(signature),'o'+localIndex,fresh);
  if(!fresh()){if(JEV_WORLD_V2846.panel===panel)closeJevWorldV2846();return;}
  const selected=Number(answer.choice.slice(1));
  JEV_WORLD_V2846.selection={rev,options,valid:fresh,used:false};
  document.getElementById('jevDecisionStatusV2846').textContent=answer.note+'。建议：'+options[selected].label;
  document.getElementById('jevDecisionActionsV2846').innerHTML=options.map((o,i)=>`<button class="choice-btn ${i===selected?'jev-recommended-v2846':''}" onclick="jevApplyV2846(${rev},${i})">${i===selected?'✓ 建议 · ':''}${discipleEscV2815(o.label)}</button>`).join('');
}
function jevApplyV2846(rev,index){const s=JEV_WORLD_V2846.selection;if(!s||s.used||s.rev!==rev||!s.valid()||!s.options[index])return;s.used=true;const apply=s.options[index].apply;closeJevWorldV2846();apply();}
function jevDiscipleV2846(){
  if(!discipleAllowedV2815())return;const roster=discipleRosterV2815(),day=discipleDayV2815();
  const idle=roster.members.filter(d=>!d.job);const options=idle.slice(0,5).flatMap(d=>[0,1,2].map(type=>{
    const tier=d.level>=6?2:d.level>=3?1:0,p=disciplePlanV2824(d,type,tier);
    return {a:d.level,b:Number(d.specialty===type),c:p.days,d:p.gold,e:p.count,label:`${d.name} · ${p.name} · ${p.days}天 / ${p.gold}灵石`,apply:()=>assignDiscipleV2815(d.id,type,tier)};
  }));
  if(!options.length)return showDisciplesV2815('没有空闲弟子。请先领取完成的事务或招募。');
  const snapshot=JSON.stringify(roster),best=options.reduce((j,o,i)=>o.d/o.c>options[j].d/options[j].c?i:j,0);
  return jevOfferV2846('弟子派遣参议','disciple',[player.gold,idle.length,player.level,day],options,best,()=>discipleAllowedV2815()&&discipleDayV2815()===day&&JSON.stringify(discipleRosterV2815())===snapshot);
}
function jevNpcV2846(id){
  const npc=ROMANCE_NPCS[id],r=player.romance?.npcs?.[id];if(!npc||!r||!hasReachedRealm(npc.unlockLevel)||!jevCanActV2846())return;
  const snapshot=JSON.stringify(r),partner=player.romance.partner;
  const choices=['克制地回应','倾听你的近况',...(r.affection>=40?['温和地关心你']:[])];
  const options=choices.map((label,a)=>({a,label,apply:()=>doRomanceChat(id,a)}));
  return jevOfferV2846(npc.name+' · 相处回应','npc',[r.affection,r.events.length,Number(partner===id),r.chats],options,r.affection>=60&&options.length===3?2:1,()=>jevCanActV2846()&&hasReachedRealm(npc.unlockLevel)&&player.romance.partner===partner&&JSON.stringify(player.romance.npcs[id])===snapshot);
}
function jevWarV2846(){
  const c=warCampaignV2839();if(!c||!warAllowedV2839()||!warStageValidV2839(c)||c.step>=3||c.pending)return;
  const step=c.step,signature=JSON.stringify(c),options=WAR_TACTICS_V2775.map((t,a)=>({a,label:t.name+' · '+t.hint,apply:()=>chooseWarTacticV2775(a,step)}));
  return jevOfferV2846('仙魔战局 · 战术参议','war',[c.reports[step],c.morale,c.supplies,Math.min(10000,c.our/Math.max(1,c.foe)*100),jevPercentV2846(player.hp,getMaxHp())],options,c.reports[step],()=>warAllowedV2839()&&warStageValidV2839(c)&&warCampaignV2839()===c&&JSON.stringify(c)===signature);
}
function jevSectV2846(){
  if(!jevCanActV2846()||!player.sect||player.sect==='散修')return;
  const management=discipleAllowedV2815(),r=discipleRosterV2815(),ready=r.members.filter(discipleReadyV2821).length,idle=r.members.filter(d=>!d.job).length;
  const active=!!player.warState?.campaignV2775,sect=player.sect;
  const options=[{a:0,label:'先做宗门委托 · 获取贡献与资源',apply:showSectTasks},...(management?[{a:1,label:'安排弟子事务 · 领取、招募与派遣',apply:showDisciplesV2815}]:[]),{a:2,label:'查看藏经阁 · 按贡献兑换功法',apply:showSectLibrary},{a:3,label:'查看军务 · 整备与战局',apply:showWarHubV2839}];
  const priority=ready||management&&idle?1:active?3:player.sectContribution>=100?2:0;
  const fingerprint=()=>JSON.stringify([player.gold,player.sectContribution,player.sectData?.prosperity,player.warState,r]);const initial=fingerprint();
  return jevOfferV2846('宗门经营 · 当前优先事项','sect',[player.gold,player.sectContribution,player.sectData?.prosperity,Number(management),ready,idle,Number(active)],options,Math.max(0,options.findIndex(o=>o.a===priority)),()=>jevCanActV2846()&&player.sect===sect&&fingerprint()===initial);
}
async function jevSecretV2846(){
  if(!hasSectSecretQualification()||!jevCanActV2846()||JEV_WORLD_V2846.pending)return;
  // Preserve the original 40% event branch. A failed/cancelled request cannot award anything.
  if(Math.random()>=.4)return handleSecretExplore({eventResult:null});
  const events=Object.entries(RANDOM_EVENTS).filter(([,e])=>hasReachedRealm(e.minLevel)).slice(0,16);
  if(!events.length)return handleSecretExplore({eventResult:null});
  const owner=player,day=discipleDayV2815(),level=player.level,health=player.hp,mana=player.mp;
  const panel=jevModalV2846('万宗秘境 · 寻觅机缘','<p>正在选择符合当前修行状态的秘境事件……最多等待 4.5 秒；未解锁或超时则沿用本地随机事件。</p><p>探索仍推进 30 个游戏日，奖励按原规则结算。关闭可取消本次探索。</p>');
  const rev=JEV_WORLD_V2846.revision;
  const fresh=()=>player===owner&&JEV_WORLD_V2846.revision===rev&&jevCanActV2846()&&hasSectSecretQualification()&&discipleDayV2815()===day&&player.level===level&&player.hp===health&&player.mp===mana;
  const options=events.map(([,e])=>({a:Math.max(0,(['encounter','treasure','cultivation','crisis','npc'].includes(e.type)?['encounter','treasure','cultivation','crisis','npc'].indexOf(e.type):5)),b:e.minLevel,c:e.weight}));
  const roll=triggerRandomEvent('secret'),fallback=Math.max(0,events.findIndex(([name])=>name===roll?.name));
  const data=events.length===1?{choice:'o0'}:await jevDecideV2846(jevWireStateV2846('secret',[jevPercentV2846(health,getMaxHp()),jevPercentV2846(mana,getMaxMp()),level,player.storyProgress],options),'o'+fallback,fresh);
  if(!fresh()){if(JEV_WORLD_V2846.panel===panel)closeJevWorldV2846();return;}
  const [name,event]=events[Number(data.choice.slice(1))];closeJevWorldV2846();handleSecretExplore({eventResult:{name,event}});
}
async function choosePlayerJevV2846(localPick,guard,pref){
  if(!JEV_WORLD_V2846.heroEnabled||!FORGE_ADVICE_V2842.access||!guard()||isTribulation||currentEnemy?._isTutorial||currentEnemy?.tournamentFight)return localPick;
  const owner=player,enemy=currentEnemy,token=COMBAT_FINISH_V2764.token;
  let s=JEV_WORLD_V2846.hero.get(enemy);if(!s||s.token!==token){s={token,calls:0,situation:null};JEV_WORLD_V2846.hero.set(enemy,s);}
  const hp=jevPercentV2846(player.hp,getMaxHp()),critical=hp<=pref.healAt;
  const situation=[critical?'danger':hp<=70?'hurt':'healthy',Math.floor(jevPercentV2846(player.mp,getMaxMp())/25),currentBossPhase||1,pref.mode,pref.healAt,pref.reserve].join(':');
  if(s.situation===situation||FORGE_ADVICE_V2842.busy||Date.now()<FORGE_ADVICE_V2842.nextAt)return localPick;
  const skills=getAvailableCombatSkillsV2769();const reserve=pref.mode==='save'?Math.ceil(getMaxMp()*pref.reserve/100):pref.mode==='survive'?Math.min(...skills.filter(x=>x.skill.element==='heal').map(x=>x.skill.mpCost),Infinity):0;
  const usable=skills.filter(x=>x.skill.element==='heal'?critical:player.mp-x.skill.mpCost>=(Number.isFinite(reserve)?reserve:0)).slice(0,15);
  const picks=[{action:'attack',index:null,skill:null},...usable.map(x=>({action:'skill',index:x.index,skill:x.skill}))];
  if(picks.length<2)return localPick;
  const signature=()=>JSON.stringify([player.hp,player.mp,currentEnemy.hp,getAvailableCombatSkillsV2769().map(x=>[x.index,x.skill])]);const snapshot=signature();
  const fresh=()=>guard()&&player===owner&&currentEnemy===enemy&&COMBAT_FINISH_V2764.token===token&&signature()===snapshot;
  const fallback=Math.max(0,picks.findIndex(p=>p.action===localPick.action&&p.index===localPick.index));
  const options=picks.map((p,i)=>({a:jevPercentV2846(p.skill?.mpCost,getMaxMp()),b:(p.skill?.damage||(!p.skill?1:0))*100,c:(p.skill?.heal||0)*100,d:(p.skill?.guardRatio||0)*100,e:Number(i===fallback)}));
  s.calls++;s.situation=situation;
  const data=await jevDecideV2846(jevWireStateV2846('hero',[hp,jevPercentV2846(player.mp,getMaxMp()),jevPercentV2846(enemy.hp,enemy.maxHp),['burst','save','survive'].indexOf(pref.mode),pref.healAt,pref.reserve],options),'o'+fallback,fresh,1500);
  if(!fresh()||!JEV_WORLD_V2846.heroEnabled)return localPick;
  const pick=picks[Number(data.choice.slice(1))];
  if(pick.action==='skill'&&!getAvailableCombatSkillsV2769().some(x=>x.index===pick.index&&x.skill===pick.skill))return localPick;
  addCombatLog((data.source==='jev'?'☯ Jev':'◇ 本地')+' 选招：'+(pick.skill?.name||'普通攻击')+' · '+data.note,'gold');return pick;
}
window.addEventListener('pagehide',closeJevWorldV2846);
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2846-world-jev.js']='28.68.58';
