/* Bounded disciple chronicle and one-time consequence chains; no timers or paid calls. */
const LIFE_TYPES_V2868={training:'培养完成',mission:'出使归来',rescue:'救援同门',explore:'寻访遗迹',withdraw:'有序撤回',safe:'稳妥前行',thanks:'同门答谢',trail:'古洞寻踪',trail_done:'古洞归来',war_stage:'随军参战',war_victory:'战场取胜'};
function lifeReadV2868(d){
 const raw=d?.lifeV2868||{},integer=(v,max=100000)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0,counts={};
 for(const k of ['training','mission','rescue','explore','war_stage','war_victory'])counts[k]=integer(raw.counts?.[k]);
 const history=Array.isArray(raw.history)?raw.history.slice(-12).filter(x=>x&&Object.hasOwn(LIFE_TYPES_V2868,x.type)).map(x=>({type:x.type,day:integer(x.day,1e9)})):[];
 const gifts=['waiting','done'].includes(raw.thanks?.state)?{state:raw.thanks.state,due:integer(raw.thanks.due,1e9)}:null;
 const trail=['ready','running','done'].includes(raw.trail?.state)?{state:raw.trail.state}:null;
 return {counts,history,thanks:gifts,trail};
}
function lifeAddV2868(d,type){const life=lifeReadV2868(d);if(!Object.hasOwn(LIFE_TYPES_V2868,type))return life;life.history.push({type,day:discipleDayV2815()});life.history=life.history.slice(-12);if(Object.hasOwn(life.counts,type))life.counts[type]=Math.min(100000,life.counts[type]+1);d.lifeV2868=life;return life;}
function lifeTitlesV2868(d){const c=lifeReadV2868(d).counts;return [c.training>=3?'笃学之士':'',c.mission>=5?'行路老手':'',c.rescue>=3?'济危同门':'',c.explore>=3?'寻幽客':'',c.war_victory>=3?'破魔先锋':''].filter(Boolean);}
function lifeEventV2868(d,e,choice){const type=choice===0?'safe':['rescue','explore','withdraw'][e.kind];const life=lifeAddV2868(d,type);if(choice===1&&e.kind===0&&!life.thanks)life.thanks={state:'waiting',due:discipleDayV2815()+3};if(choice===1&&e.kind===1&&!life.trail)life.trail={state:'ready'};d.lifeV2868=life;}
function lifeCompletedV2868(d,j){const life=lifeAddV2868(d,j.type==='train'?'training':j.followupV2868?'trail_done':'mission');if(j.followupV2868)life.trail={state:'done'};d.lifeV2868=life;}
function lifeCardV2868(d){const titles=lifeTitlesV2868(d);return `${titles.length?`<p class="disciple-titles-v2868">${titles.join(' · ')}</p>`:''}<button class="choice-btn" onclick="showDiscipleLifeV2868(${d.id})">成长履历与后续</button>`;}
let lifeViewV2868=null;
function showDiscipleLifeV2868(id){
 if(!sectCanManageV2866())return;const d=discipleRosterV2815().members.find(x=>x.id===id);if(!d)return;
 const life=lifeReadV2868(d),titles=lifeTitlesV2868(d),allowed=discipleAllowedV2815(),esc=discipleEscV2815;
 lifeViewV2868={owner:player,sect:player.sect,disciple:d};
 let html=`<section class="sect-board-v2866"><h3 id="discipleLifeTitleV2868">${esc(d.name)} · 成长履历</h3><p>${titles.join(' · ')||'初入山门，来日方长'}</p><p>培养 ${life.counts.training} 次 · 出使 ${life.counts.mission} 次 · 救援 ${life.counts.rescue} 次 · 探索 ${life.counts.explore} 次 · 随军 ${life.counts.war_stage} 次 · 战场取胜 ${life.counts.war_victory} 次</p><details><summary>称号条件</summary><p>培养3次：笃学之士；普通派遣归来5次：行路老手；救援3次：济危同门；探索3次：寻幽客；会战阶段取胜3次：破魔先锋。济危同门可增强仁厚统领的战败保护，其余称号记录经历。</p></details>`;
 if(life.thanks){const days=Math.max(0,life.thanks.due-discipleDayV2815());html+=`<article><h4>药棚旧友</h4><p>${life.thanks.state==='done'?'同门送来的药与灵草已收下，这份人情留在了履历中。':days?`获救同门正在休养，${days} 个游戏日后会送来答谢。`:'同门伤愈归来，将两瓶小还丹与三束灵草放在案上：“那日若不是你们停步，我恐怕走不出药棚。”'}</p><button class="choice-btn" onclick="claimDiscipleThanksV2868(${id})" ${!allowed||days||life.thanks.state==='done'?'disabled':''}>${life.thanks.state==='done'?'已收下答谢':'收下答谢 · 小还丹×2、灵草×3'}</button></article>`;}
 if(life.trail)html+=`<article><h4>古洞寻踪</h4><p>${life.trail.state==='done'?'旧洞的踪迹已查清，这次寻访已记入履历。':life.trail.state==='running'?'弟子已沿旧线索出发，到期后从事务中领取成果。':'上次带回的残图显出一条隐蔽山径。可让这位弟子再去查探一次。'}</p><p>4个游戏日 · 240灵石、妖丹×2 · 无费用、无途中事件</p><button class="choice-btn" onclick="startDiscipleTrailV2868(${id})" ${!allowed||life.trail.state!=='ready'||d.job||warDiscipleBusyV286841(d.id)?'disabled':''}>${life.trail.state==='done'?'后续已完成':life.trail.state==='running'?'正在寻踪':(d.job||warDiscipleBusyV286841(d.id))?'弟子忙碌，空闲后可出发':'确认派遣 · 古洞寻踪'}</button></article>`;
 html+=`<h4>最近经历</h4><ol class="disciple-history-v2868">${life.history.slice().reverse().map(x=>`<li><small>游历第 ${x.day+1} 日</small><span>${LIFE_TYPES_V2868[x.type]}</span></li>`).join('')||'<li>尚无记载，新的经历会从此刻开始记录。</li>'}</ol><button class="choice-btn" onclick="showDisciplesV2815()">返回弟子名册</button><button class="choice-btn" onclick="showSectTodoV2868()">宗门待办</button></section>`;
 showStory(html,[]);
}
function lifeActionDiscipleV2868(id){if(!discipleAllowedV2815()||!lifeViewV2868||lifeViewV2868.owner!==player||lifeViewV2868.sect!==player.sect||document.getElementById('storyPanel')?.classList.contains('hidden')||!document.getElementById('discipleLifeTitleV2868'))return null;const d=discipleRosterV2815().members.find(x=>x.id===id);return d&&lifeViewV2868.disciple===d?d:null;}
function claimDiscipleThanksV2868(id){const d=lifeActionDiscipleV2868(id);if(!d)return;const life=lifeReadV2868(d);if(life.thanks?.state!=='waiting'||life.thanks.due>discipleDayV2815())return;life.thanks.state='done';d.lifeV2868=life;lifeAddV2868(d,'thanks');player.inventory.push('小还丹','小还丹');player.materials['灵草']=(player.materials['灵草']||0)+3;onCollectMaterial?.('灵草',3);autoSave();updateStats();showDiscipleLifeV2868(id);}
function startDiscipleTrailV2868(id){const d=lifeActionDiscipleV2868(id);if(!d||d.job||warDiscipleBusyV286841(id))return;const life=lifeReadV2868(d);if(life.trail?.state!=='ready')return;life.trail.state='running';d.lifeV2868=life;lifeAddV2868(d,'trail');d.job={type:'mission',name:'古洞寻踪',end:discipleDayV2815()+4,gold:240,material:'妖丹',count:2,followupV2868:true};autoSave();showDiscipleLifeV2868(id);}
// Read-only lookup: drawing must not migrate rosters or roll candidate batches.
function sectMembersReadV2868(){const data=player?.sectData,state=data?.managementV2815;const members=state?.rosters?.[player?.sect]?.members;return Array.isArray(members)?members.slice():[];}
function sectTodoReadV2868(){
 const empty={mails:[],jobs:[],thanks:[],trails:[],tasks:[],promotion:false,income:false,doctrine:false,total:0};
 if(!player?.sect||player.sect==='散修'||isFactionDestroyed(player.sect))return empty;
 if(hasRank('长老'))for(const d of sectMembersReadV2868()){if(discipleEventReadyV2867(d))empty.mails.push(d.id);if(discipleReadyV2821(d))empty.jobs.push(d.id);const life=lifeReadV2868(d);if(life.thanks?.state==='waiting'&&life.thanks.due<=discipleDayV2815())empty.thanks.push(d.id);if(life.trail?.state==='ready'&&!d.job&&!warDiscipleBusyV286841(d.id))empty.trails.push(d.id);}
 for(const [i,t] of (player.sectTasks||[]).entries())if(!t.completed&&t.template?.type!=='combat'&&getSectTaskProgressInfo(t).ready)empty.tasks.push(i);
 empty.promotion=sectMasterRequirementsV2872().ready;
 if(sectPathMasterV2880()){const s=sectAdminReadV2873(),day=discipleDayV2815();empty.income=!!s.quarter&&day>=s.quarter.due&&day>=s.highDay;empty.doctrine=!sectPathReadV2880().doctrine;}
 empty.total=empty.mails.length+empty.jobs.length+empty.thanks.length+empty.trails.length+empty.tasks.length+Number(empty.promotion)+Number(empty.income)+Number(empty.doctrine);return empty;
}
let sectTodoCacheV2868={total:0};
function syncSectTodoV2868(){
 sectTodoCacheV2868=sectTodoReadV2868();const bar=document.getElementById('characterUtilityActions');if(!bar)return;let button=document.getElementById('sectTodoBtnV2868');if(!button){button=document.createElement('button');button.id='sectTodoBtnV2868';button.onclick=()=>showSectTodoV2868();bar.appendChild(button);}button.hidden=!player?.sect||player.sect==='散修'||isFactionDestroyed(player.sect);button.disabled=!sectCanManageV2866();button.textContent=sectTodoCacheV2868.total?`宗门待办 ${sectTodoCacheV2868.total}`:'宗门';button.setAttribute('aria-label',button.textContent);
}
function showSectTodoV2868(){
 if(!sectCanManageV2866())return;const t=sectTodoReadV2868(),esc=discipleEscV2815,names=new Map(sectMembersReadV2868().map(d=>[d.id,esc(d.name)]));let html='<section class="sect-board-v2866"><h3>宗门待办</h3>'+sectQuickHtmlV2870();
 for(const id of t.mails)html+=`<button class="choice-btn" onclick="showDiscipleEventV2867(${id})">${names.get(id)} · 途中来信</button>`;
 if(t.jobs.length)html+=`<button class="choice-btn" onclick="showDisciplesV2815()">${t.jobs.length} 项成果可领取</button>`;
 for(const id of t.thanks)html+=`<button class="choice-btn" onclick="showDiscipleLifeV2868(${id})">${names.get(id)} · 同门答谢已到</button>`;
 for(const id of t.trails)html+=`<button class="choice-btn" onclick="showDiscipleLifeV2868(${id})">${names.get(id)} · 古洞线索可出发</button>`;
 html+='<button class="choice-btn" onclick="showReadySectTasksV2885()">宗门委托速办 · 预览消耗</button>';
 if(t.tasks.length)html+='<button class="choice-btn" onclick="showSectTasks()">宗门委托可以交付</button>';
 if(t.promotion)html+='<button class="choice-btn" onclick="showSectPromotionV2768()">宗主传承 · 考核已达标</button>';
 if(t.income)html+='<button class="choice-btn" onclick="showSectAdminV2873()">季度岁入 · 可以结算</button>';
 if(t.doctrine)html+='<button class="choice-btn" onclick="showSectPathV2880()">宗主道统 · 待选择</button>';
 if(!t.total)html+='<p>宗内事务已妥当，可安心修行。</p>';
 html+='<button class="choice-btn" onclick="showEliteBoardV2883()">四域凶煞 · 悬赏榜</button><button class="choice-btn" onclick="showSectOverviewV2866()">宗门总览</button></section>';showStory(html,[{text:'返回地图',action:'return_to_map'}]);
}
let sectQuickContextV2870=null,sectQuickSerialV2870=0;
function sectQuickHtmlV2870(){
 const token=++sectQuickSerialV2870;sectQuickContextV2870={token,owner:player,sect:player.sect};
 const t=sectTodoReadV2868(),trip=tripYieldV286821().units>0,count=t.jobs.length+t.thanks.length+Number(trip);
 return `${discipleAllowedV2815()&&sectMembersReadV2868().some(d=>!d.job&&!warDiscipleBusyV286841(d.id))?'<button class="choice-btn" onclick="showDiscipleBatchV2866(2)">按专长派遣空闲弟子 · 预览最高档</button>':''}${t.trails.length?`<button class="choice-btn" id="sectDispatchV2875" onclick="claimAllSectTodoV2870(${token},true)">领取并派遣已就绪寻踪（需确认）</button>`:''}${count?`<button class="choice-btn" onclick="claimAllSectTodoV2870(${token})">一键领取成果与答谢 · ${count}项${trip?'（含游历，领取后结束本趟）':''}</button>`:''}${t.trails.length?`<button class="choice-btn" onclick="startAllSectTrailsV2870(${token})">派遣古洞寻踪 · ${t.trails.length}人（需确认）</button>`:''}`;
}
function sectQuickValidV2870(token){return token==null||(sectQuickContextV2870?.token===token&&sectQuickContextV2870.owner===player&&sectQuickContextV2870.sect===player.sect&&!document.getElementById('storyPanel')?.classList.contains('hidden'));}
function claimAllSectTodoV2870(token,dispatch=false){
 if(dispatch&&(token==null||!document.getElementById('sectDispatchV2875')))return false;
 if(!sectQuickValidV2870(token))return false;
 if(!sectCanManageV2866())return false;
 const t=sectTodoReadV2868(),trip=tripYieldV286821().units>0;
 const trails=dispatch?t.trails:[];
 if(!t.jobs.length&&!t.thanks.length&&!trip&&!trails.length)return false;
 if(dispatch){const owner=player,before=JSON.stringify(player);if(!confirm(`领取${t.jobs.length}项成果、${t.thanks.length}份答谢${trip?'及游历收获（结束本趟）':''}，并派出${trails.length}名当前已就绪弟子寻踪4日？来信、委托和晋升仍需手动处理。`)||player!==owner||!sectQuickValidV2870(token)||!sectCanManageV2866()||before!==JSON.stringify(player))return false;}
 let jobs=0,thanks=0,claimedTrip=false;
 const ok=commitMiniWeaveV286840(()=>{
  if(t.jobs.length&&discipleAllowedV2815())jobs=settleDisciplesV2821(undefined,true)||0;
  if(discipleAllowedV2815())for(const d of sectMembersReadV2868()){
   const life=lifeReadV2868(d);if(life.thanks?.state!=='waiting'||life.thanks.due>discipleDayV2815())continue;
   life.thanks.state='done';d.lifeV2868=life;lifeAddV2868(d,'thanks');player.inventory.push('小还丹','小还丹');player.materials['灵草']=(player.materials['灵草']||0)+3;onCollectMaterial?.('灵草',3);thanks++;
  }
  if(trip){claimedTrip=claimTripV286821(true);if(!claimedTrip)throw Error('trip changed');}
  for(const d of sectMembersReadV2868().filter(d=>trails.includes(d.id))){const life=lifeReadV2868(d);if(d.job||warDiscipleBusyV286841(d.id)||life.trail?.state!=='ready')throw Error('trail changed');life.trail.state='running';d.lifeV2868=life;lifeAddV2868(d,'trail');d.job={type:'mission',name:'古洞寻踪',end:discipleDayV2815()+4,gold:240,material:'妖丹',count:2,followupV2868:true};}
 });
 if(!ok)return false;
 updateStats();syncSectTodoV2868();showSectTodoV2868();
 if(ok)showFloatingText(`已领取：弟子成果${jobs}项、同门答谢${thanks}份${claimedTrip?'、游历收获':''}${trails.length?'；已派遣寻踪'+trails.length+'人':''}`,'#69f0ae');
 return ok;
}
function startAllSectTrailsV2870(token){
 if(!sectQuickValidV2870(token))return false;
 if(!discipleAllowedV2815())return false;
 const owner=player,sect=player.sect,ids=sectTodoReadV2868().trails;
 if(!ids.length||!confirm(`派遣${ids.length}名弟子进行古洞寻踪？每人占用4个游戏日，无费用；归来后各领取240灵石、妖丹×2。`))return false;
 if(player!==owner||player.sect!==sect||!discipleAllowedV2815())return false;
 const eligible=sectMembersReadV2868().filter(d=>ids.includes(d.id)&&!d.job&&!warDiscipleBusyV286841(d.id)&&lifeReadV2868(d).trail?.state==='ready');
 if(!eligible.length)return false;
 const ok=commitMiniWeaveV286840(()=>{for(const d of eligible){const life=lifeReadV2868(d);life.trail.state='running';d.lifeV2868=life;lifeAddV2868(d,'trail');d.job={type:'mission',name:'古洞寻踪',end:discipleDayV2815()+4,gold:240,material:'妖丹',count:2,followupV2868:true};}});
 if(!ok)return false;
 syncSectTodoV2868();showSectTodoV2868();return ok;
}
function drawSectTodoV2868(ctx,o){if(!sectTodoCacheV2868.total||!player?.sect)return;const own=(o.action==='faction_gate_v2806'&&o.factionName===player.sect)||(player.sect==='凌霄宗'&&(o.action==='sect'||o.buildingId==='main_hall'));if(!own)return;ctx.save();ctx.fillStyle='#263d31';ctx.fillRect(-42,-o.r-22,84,22);ctx.fillStyle='#f1d89b';ctx.font='12px Microsoft YaHei';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`待办 ${sectTodoCacheV2868.total}`,0,-o.r-11);ctx.restore();}
// One reviewed settlement per click; never loops over newly generated commissions.
function sectReadyQuoteV2885(templateId=null){
 if(!sectCanManageV2866())return null;
 const active=(player.sectTasks||[]).filter(t=>!t.completed),fresh=templateId!==null;
 if(fresh&&(active.length||!SECT_TASK_TEMPLATES.some(t=>t.id===templateId&&t.type==='collect')))return null;
 const candidates=fresh?[generateSectTask(templateId)]:active,materials={...(player.materials||{})};let gold=Number(player.gold)||0;
 const quote={fresh,tasks:[],materials:{},gold:0,rewards:{gold:0,exp:0,contribution:0}};
 for(const task of candidates){
  const t=task?.template;if(!t||task._rewardClaimedV2768||!['collect','donate'].includes(t.type))continue;
  const costs=Object.entries(t.materials||{}),cost=Number(t.goldCost)||0;
  if(cost<0||!Number.isFinite(cost)||(!cost&&!costs.length)||costs.some(([k,n])=>!k||!Number.isSafeInteger(n)||n<=0)||['goldReward','expReward','contributionReward'].some(k=>!Number.isFinite(Number(t[k]||0))||Number(t[k]||0)<0))continue;
  if(gold<cost||costs.some(([k,n])=>(Number(materials[k])||0)<n))continue;
  gold-=cost;quote.gold+=cost;for(const [k,n] of costs){materials[k]-=n;quote.materials[k]=(quote.materials[k]||0)+n;}
  quote.tasks.push(task);quote.rewards.gold+=Number(t.goldReward)||0;quote.rewards.exp+=Number(t.expReward)||0;quote.rewards.contribution+=Number(t.contributionReward)||0;
 }
 return quote.tasks.length?quote:null;
}
function showReadySectTasksV2885(templateId=null){
 if(!sectCanManageV2866())return false;
 const quote=sectReadyQuoteV2885(templateId),active=(player.sectTasks||[]).some(t=>!t.completed),esc=escapeGameText;
 let body='<p>已有委托优先交付。没有待办委托时，可选择一项材料已齐的采集委托；每次只接取并交付这一项。</p>',buttons=[];
 if(quote){
  const costs=[...(quote.gold?[quote.gold+'灵石']:[]),...Object.entries(quote.materials).map(([k,n])=>`${k}×${n}`)].join('、');
  body+=`<h3>${quote.fresh?'接取并交付':'交付已接委托'} · ${quote.tasks.length}项</h3><p>${quote.tasks.map(t=>esc(t.template.name)).join('、')}</p><p>消耗：${esc(costs)}</p><p>获得：${quote.rewards.contribution}贡献、${quote.rewards.exp}修为、${quote.rewards.gold}灵石</p>`;
  buttons.push(['submit','确认上述消耗 · 速办委托']);
 }else if(active)body+='<p>当前委托尚未备齐，或需要实际战斗完成。不会替你放弃或跳过。</p>';
 else {
  const ready=SECT_TASK_TEMPLATES.filter(t=>t.type==='collect'&&sectReadyQuoteV2885(t.id));
  if(!ready.length)body+='<p>暂无材料已齐的采集委托。</p>';
  buttons.push(...ready.map(t=>['pick:'+t.id,`${t.name} · 查看消耗与奖励`]));
 }
 buttons.push(['tasks','完整委托列表'],['back','返回宗门待办']);
 const session=expansionModalV286827('宗门委托速办',body,buttons,(key,ss)=>{
  if(!sectCanManageV2866()||ss.sect!==player.sect)return;
  if(key==='submit')settleReadySectTasksV2885(ss);
  else if(key.startsWith('pick:'))showReadySectTasksV2885(key.slice(5));
  else{closeExpansionV286827();if(key==='tasks')showSectTasks();else showSectTodoV2868();}
 });session.sect=player.sect;session.quote=quote;session.snapshot=JSON.stringify(player);return true;
}
function settleReadySectTasksV2885(session){
 if(!session||session!==expansionSessionV286827||session.owner!==player||session.sect!==player.sect||document.getElementById('expansionV286827')!==session.el||!sectCanManageV2866()||!session.quote)return false;
 const q=session.quote;
 if(session.snapshot!==JSON.stringify(player)){showFloatingText('委托或资源已变化，请重新核对。','#ffd76a');showReadySectTasksV2885(q.fresh?q.tasks[0].templateId:null);return false;}
 const ok=commitMiniWeaveV286840(()=>{
  if(q.fresh){player.sectTasks=player.sectTasks.filter(t=>t.completed).slice(-3);player.sectTasks.push(q.tasks[0]);}
  for(const task of q.tasks){
   if(!player.sectTasks.includes(task)||task.completed||task._rewardClaimedV2768)throw Error('commission changed');
   const t=task.template;player.gold-=Number(t.goldCost)||0;
   for(const [k,n] of Object.entries(t.materials||{})){player.materials[k]-=n;if(player.materials[k]<=0)delete player.materials[k];}
   task.progress=task.count;task.completed=true;
   if(!completeSectTask(task,{silent:true}))throw Error('commission not settled');
  }
 });
 if(!ok){showReadySectTasksV2885(q.fresh?q.tasks[0].templateId:null);return false;}
 closeExpansionV286827();updateStats();syncSectTodoV2868();showFloatingText(`已速办${q.tasks.length}项委托，消耗与奖励已保存。`,'#69f0ae');showSectTodoV2868();return true;
}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2868-sect-life.js']='28.68.59';


// V28.68.40: saved random encounters and run-scoped blessings.
const MINI_BOONS_V286840=[
 {name:'锋芒剑意',desc:'本次守关战攻击提高15%',key:'atk',value:.15},
 {name:'玄岩护体',desc:'本次守关战防御提高20%',key:'def',value:.20},
 {name:'破阵灵光',desc:'本次守关战暴击伤害倍率+0.30',key:'crit',value:.30},
 {name:'归元甘露',desc:'守关开战时恢复最大气血15%',key:'hp',value:.15},
 {name:'聚灵回响',desc:'守关开战时恢复最大灵力20%',key:'mp',value:.20},
 {name:'静水守心',desc:'本次守关战直接受击伤害减少10%',key:'reduce',value:.10}
];
const MINI_EVENTS_V286840=[
 {name:'隐秘药园',text:'藤蔓后藏着一畦无人照看的灵植。药香虽淡，根脉仍在。',options:[['采集灵草 ×4','herb',4],['摘取仙果 ×2','fruit',2]]},
 {name:'上古残阵',text:'残缺阵纹在石壁上明灭。你可以记下运转之理，也可以带走阵脚旁的灵草。',options:[['参悟残阵 · 离境修为+100','insight',100],['采集阵脚灵草 ×3','herb',3]]},
 {name:'濒伤前辈',text:'老修士已自行稳住伤势，请你替他护法片刻。临别时，他愿以灵息或心得相赠。',options:[['接受灵息 · 恢复20%气血和灵力','rest',.20],['请教心得 · 离境修为+120','insight',120]]},
 {name:'心魔幻境',text:'旧日的遗憾化作镜中人。这次不必与它争胜：你可以静坐听完，也可以沿着果香离开。',options:[['照见本心 · 离境修为+120','insight',120],['离开幻境 · 摘取仙果 ×2','fruit',2]]}
];
function createMiniWeaveV286840(){
 const shuffled=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 return {rewardRealmV2870:Math.max(0,Math.min(16,Math.floor(Number(player.level)||0))),events:shuffled([0,1,2,3]).slice(0,2),offers:[shuffled([0,1,2,3,4,5]).slice(0,3),shuffled([0,1,2,3,4,5]).slice(0,3)],boons:[],pending:false,treasureV2871:Math.floor(Math.random()*4),rerolledV2875:false};
}
function miniWeaveV286840(c){
 const w=c?.weaveV286840;
 if(!w||!Array.isArray(w.events)||w.events.length!==2||!w.events.every(i=>Number.isInteger(i)&&MINI_EVENTS_V286840[i])||!Array.isArray(w.offers)||w.offers.length!==2||!w.offers.every(a=>Array.isArray(a)&&a.length===3&&new Set(a).size===3&&a.every(i=>Number.isInteger(i)&&MINI_BOONS_V286840[i]))||!Array.isArray(w.boons)||w.boons.length>2||!w.boons.every((b,i)=>w.offers[i].includes(b)))return null;
 return w;
}
function miniBoonV286840(key){
 const c=miniRunV2778(),w=miniWeaveV286840(c);
 if(gameState!=='combat'||!w||c.step!==3||currentEnemy?._miniRunV2778!==c.id)return 0;
 return w.boons.reduce((sum,id)=>sum+(MINI_BOONS_V286840[id].key===key?MINI_BOONS_V286840[id].value:0),0);
}
function miniWeaveTextV286840(c){const w=miniWeaveV286840(c);return w?`<p>万象迷阵 · 药径与幻境 → 三选一祝福 → 守关</p><p>入场奖励倍率 ×${miniRewardV2870(c,'safe').scale}（含悟道修为）${Number.isInteger(w.rewardRealmV2870)?'；守关通关另获路线御兽材料':'；本局沿用原奖励'}。</p><p>本局祝福：${w.boons.map(i=>MINI_BOONS_V286840[i].name).join('、')||'尚未选择'}。仅在本次守关战生效，离境后消散。</p>${miniTreasureV2871(c)?`<p>守关额外珍材：妖丹 / 星辰砂 / 血玉 / 冰晶石中一种×${c.routeV2867===2?2:1}，另获${c.routeV2867===2?'变异灵晶':'兽魂晶'}×1；安全离境和提前撤离不发。</p>`:''}`:'';}
let miniWeaveBusyV286840=false;
function commitMiniWeaveV286840(change){
 if(miniWeaveBusyV286840||!sectCanManageV2866())return false;
 const owner=player,before=JSON.stringify(player),progress={...achievementProgress},completed=new Set(completedAchievements);miniWeaveBusyV286840=true;miniSaveDeferredV286840=true;
 try{change();miniSaveDeferredV286840=false;if(!saveGame())throw Error('mini save failed');return true}
 catch(e){for(const key of Object.keys(owner))delete owner[key];Object.assign(owner,JSON.parse(before));player=owner;if(player.activePet?._petId)player.activePet=player.pets.find(p=>p._petId===player.activePet._petId)||null;achievementProgress=progress;completedAchievements=completed;showFloatingText('记录未保存，本次操作已恢复，请重试','#ff8a80');return false}
 finally{miniWeaveBusyV286840=false;miniSaveDeferredV286840=false}
}
function showMiniWeaveV286840(c){
 const w=miniWeaveV286840(c);if(!w||(!w.pending&&c.step>=2))return false;
 const floor=w.pending?c.step-1:c.step;if(floor<0||floor>1)return false;
 miniRerollViewV2875={owner:player,c,w,floor};
 let html=`<section class="sect-board-v2866 loop-board-v286840"><h3>万象迷阵 · 第${floor+1}/3层</h3><p>气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p><p>尚未入袋：灵草×${c.herbs||0} · 仙果×${c.fruit||0} · 悟道修为${c.insight||0}</p>${miniWeaveTextV286840(c)}<p>随机事件与备选祝福已经保存；刷新不会重抽。可暂离补给。</p>`;
 if(w.pending){html+=`<h4>残阵赠礼 · 三选一</h4>${w.rerolledV2875===true?'<p>本局已使用重铸</p>':`<button class="choice-btn" id="miniRerollV2875" onclick="rerollMiniBoonV2875(${c.id},${floor})">重铸为另外三种祝福（每局免费一次）</button>`}`;html+=w.offers[floor].map(i=>`<article><h4>${MINI_BOONS_V286840[i].name}</h4><p>${MINI_BOONS_V286840[i].desc}</p><button class="choice-btn" onclick="chooseMiniBoonV286840(${c.id},${floor},${i})">选择此祝福</button></article>`).join('');}
 else{const event=MINI_EVENTS_V286840[w.events[floor]];html+=`<h4>${event.name}</h4><p>${event.text}</p>`+event.options.map((o,i)=>`<button class="choice-btn" onclick="chooseMiniEventV286840(${c.id},${floor},${i})">${o[1]==='insight'?o[0].replace(/\+\d+/,'+'+Math.floor(o[2]*miniRewardV2870(c,'leave').scale)):o[0]}</button>`).join('');}
 html+='</section>';showStory(html,[{text:'提前撤离 · 带回已获材料与悟道',action:'mini_choice_v2778',pick:'leave',step:c.step,runId:c.id},{text:'暂离 · 返回宗门',action:'sect_hall'}]);return true;
}
function chooseMiniEventV286840(id,floor,index){
 if(!sectCanManageV2866())return false;const c=miniRunV2778(),w=miniWeaveV286840(c);
 if(!w||c.id!==id||c.step!==floor||w.pending||w.boons.length!==floor||![0,1].includes(floor)||![0,1].includes(index))return false;
 const o=MINI_EVENTS_V286840[w.events[floor]].options[index];
 const ok=commitMiniWeaveV286840(()=>{if(o[1]==='herb')c.herbs+=o[2];if(o[1]==='fruit')c.fruit+=o[2];if(o[1]==='insight')c.insight+=o[2];if(o[1]==='rest'){player.hp=Math.min(getMaxHp(),player.hp+Math.ceil(getMaxHp()*o[2]));player.mp=Math.min(getMaxMp(),player.mp+Math.ceil(getMaxMp()*o[2]));}if(floor===0&&c.routeV2867===1)c.insight+=80;c.step++;w.pending=true;});
 if(ok)showMiniRealmV2778();return ok;
}
function chooseMiniBoonV286840(id,floor,index){
 if(!sectCanManageV2866())return false;const c=miniRunV2778(),w=miniWeaveV286840(c);
 if(!w||c.id!==id||c.step!==floor+1||!w.pending||w.boons.length!==floor||!w.offers[floor]?.includes(index))return false;
 const ok=commitMiniWeaveV286840(()=>{w.boons.push(index);w.pending=false});if(ok)showMiniRealmV2778();return ok;
}
const MINI_REALM_SCALE_V2870=[1,1,1.2,1.5,1.8,2.2,2.6,3,3.6,4.2,5,5.8,6.6,7.4,8.2,9,10];
function miniRewardV2870(c,kind){
 const w=miniWeaveV286840(c),modern=Number.isInteger(w?.rewardRealmV2870)&&w.rewardRealmV2870>=0&&w.rewardRealmV2870<=16;
 const scale=modern?MINI_REALM_SCALE_V2870[w.rewardRealmV2870]:1,first=kind==='clear'&&!player.sectData.miniFirstV2778,route=miniRouteV2867(c);
 return {scale,first,modern,gold:Math.floor((kind==='clear'?450:kind==='safe'?240:0)*route.reward*scale)+(first?Math.floor(300*scale):0),exp:Math.floor(((kind==='clear'?320:kind==='safe'?180:0)*route.reward+c.insight)*scale),pet:modern&&kind==='clear'?['普通血脉精元','变异灵晶','优质血脉精元'][c.routeV2867]:null};
}
const MINI_TREASURES_V2871=['妖丹','星辰砂','血玉','冰晶石'];
function miniTreasureV2871(c){
 const w=miniWeaveV286840(c),index=w?.treasureV2871;
 if(!Number.isInteger(w?.rewardRealmV2870)||w.rewardRealmV2870<0||w.rewardRealmV2870>16||!Number.isInteger(index)||index<0||index>=MINI_TREASURES_V2871.length||![0,1,2].includes(c.routeV2867))return null;
 return {material:MINI_TREASURES_V2871[index],count:c.routeV2867===2?2:1,pet:c.routeV2867===2?'变异灵晶':'兽魂晶'};
}
function finishMiniWeaveV286840(kind){
 const c=miniRunV2778(),w=miniWeaveV286840(c);if(!w)return false;
 if(!sectCanManageV2866()||!['safe','clear','leave'].includes(kind)||(kind==='safe'&&(c.step!==2||w.pending))||(kind==='clear'&&c.step!==4)||(kind==='leave'&&c.step>=4))return true;
 const {first,scale,modern,gold,exp,pet}=miniRewardV2870(c,kind),treasure=kind==='clear'?miniTreasureV2871(c):null;
 const ok=commitMiniWeaveV286840(()=>{player.sectData.miniRealmV2778=null;if(first){player.sectData.miniFirstV2778=true;player.inventory.push(...(modern?['大还丹','聚灵丹']:['小还丹','小还丹']))}if(pet){player.petMaterials ||= {};player.petMaterials[pet]=(player.petMaterials[pet]||0)+1;}if(treasure){player.materials[treasure.material]=(player.materials[treasure.material]||0)+treasure.count;player.petMaterials ||= {};player.petMaterials[treasure.pet]=(player.petMaterials[treasure.pet]||0)+1;onCollectMaterial?.(treasure.material,treasure.count);}player.gold+=gold;player.exp+=exp;player.materials['灵草']=(player.materials['灵草']||0)+c.herbs;player.materials['仙果']=(player.materials['仙果']||0)+c.fruit;if(c.herbs)onCollectMaterial?.('灵草',c.herbs);if(c.fruit)onCollectMaterial?.('仙果',c.fruit);});
 if(ok){checkLevelUp();updateStats();showStory(`<h3>万象迷阵 · 离境结算（入场境界 ×${scale}）</h3><p>灵石+${gold} · 修为+${exp}</p><p>灵草×${c.herbs} · 仙果×${c.fruit}</p>${pet?`<p>守关秘宝：${pet}×1。</p>`:''}${treasure?`<p>守关珍材：${treasure.material}×${treasure.count} · ${treasure.pet}×1。</p>`:''}${first?`<p>已含首通${Math.floor(300*scale)}灵石，另获${modern?'大还丹×1、聚灵丹×1':'小还丹×2'}。</p>`:''}<p>本局祝福已消散。材料与结算记录已保存。</p>`,[{text:'返回秘境',action:'mini_realm_v2778'},{text:'返回宗门',action:'sect_hall'}]);}return true;
}

// Read-only return brief: existing reward transactions remain the only claim path.
function returnBriefHtmlV286840(timestamp=0){
 const elapsed=Number.isFinite(timestamp)?Math.max(0,Date.now()-timestamp):0,y=tripYieldV286821(),t=tripStateV286821(),route=TRIP_ROUTES_V286821.find(r=>r.key===t.active?.key),todo=sectTodoReadV2868();
 let html=`<section class="sect-board-v2866 loop-board-v286840"><h3>归来简报</h3><p>${timestamp&&elapsed>=60000?`距上次存档约${Math.floor(elapsed/60000)}分钟。`:'修行与宗门近况。'}游历按现实时间累计，弟子派遣按仙历推进。</p>`;
 if(sectCanManageV2866())html+=sectQuickHtmlV2870();
 if(route){const lines=['队伍刚踏上山道，尚未走完一段路。','沿途清点所得，灵石与灵草已记入行囊。','经过几处旧驿，队伍正沿熟悉的路线归拢收获。','行囊已满，队伍在归途等候你的消息。'];html+=`<article><h4>${escapeGameText(route.name)} · 游历</h4><p>${lines[y.units===48?3:y.units>=6?2:y.units?1:0]}</p><p>已累计${y.units*10}/480分钟 · 待领${y.gold}灵石、${y.herbs}灵草</p><button class="choice-btn" onclick="claimReturnTripV286840()" ${y.units?'':'disabled'}>领取游历收获并结束本趟</button><button class="choice-btn" onclick="showTripV286821()">查看游历</button></article>`;}
 else html+='<p>暂无进行中的游历，可在洞府安排下一趟。</p><button class="choice-btn" onclick="showTripV286821()">安排游历</button>';
 if(todo.total)html+=`<article><h4>山门来讯</h4><p>弟子成果${todo.jobs.length}项 · 途中来信${todo.mails.length}封 · 同门答谢${todo.thanks.length}份</p><button class="choice-btn" onclick="showSectTodoV2868()">查看宗门待办 · ${todo.total}</button></article>`;
 if(miniRunV2778())html+='<button class="choice-btn" onclick="showMiniRealmV2778()">续行秘境 · 已保存进度</button>';
 return html+'<p>简报只汇总已有记录；领取前不会自动发放或扣除资源。</p></section>';
}
function showReturnBriefV286840(){if(gameState==='exploring')showStory(returnBriefHtmlV286840(),[{text:'继续修行',action:'return_to_map'}]);}
function claimReturnTripV286840(){const ok=claimTripV286821();if(ok)showReturnBriefV286840();return ok;}

// Sect-master management: one shared council action per 30 game days.
const SECT_MASTER_COUNCIL_V2872=Object.freeze({cooldown:30,repairContribution:100,repairGold:200,prosperityGain:5,prosperityCap:100,lessonContribution:50});
let sectMasterViewV2872=null,sectMasterViewSerialV2872=0;
function sectMasterAllowedV2872(){return sectCanManageV2866()&&hasRank('宗主');}
function sectProsperityReadV2881(){const value=Number(player.sectData?.prosperity);return Number.isFinite(value)?Math.max(0,value):20;}
function sectMasterPlanV2872(kind){
 const r=SECT_MASTER_COUNCIL_V2872,state=normalizeSectMasterV2872(player.sectMasterV2872,player.sect),day=discipleDayV2815(),wait=Math.max(0,state.nextDay-day);
 const members=sectMembersReadV2868().filter(d=>!d.job&&!warDiscipleBusyV286841(d.id)&&Number.isFinite(d.level)&&d.level>=1&&d.level<10),gain=Math.max(0,Math.min(r.prosperityGain,r.prosperityCap-sectProsperityReadV2881()));
 if(!['repair','lesson'].includes(kind))return null;
 const contribution=kind==='repair'?r.repairContribution:members.length*r.lessonContribution,gold=kind==='repair'?r.repairGold:0;
 return {state,day,wait,members,gain,contribution,gold,ok:sectMasterAllowedV2872()&&!wait&&(kind==='repair'?gain>0:members.length>0)&&(player.sectContribution||0)>=contribution&&player.gold>=gold};
}
function showSectMasterV2872(){
 if(!sectMasterAllowedV2872())return;
 const repair=sectMasterPlanV2872('repair'),lesson=sectMasterPlanV2872('lesson'),r=SECT_MASTER_COUNCIL_V2872,token=++sectMasterViewSerialV2872;
 sectMasterViewV2872={token,owner:player,sect:player.sect};
 showStory(`<section class="sect-board-v2866"><button class="choice-btn" onclick="showSectAdminV2873()">季度岁入 · 敕令 · 绝学 · 官职</button><h3 id="sectMasterTitleV2872">${discipleEscV2815(player.sect)} · 宗主议事</h3><p>可用贡献 ${player.sectContribution||0} · 灵石 ${player.gold} · 繁荣度 ${sectProsperityReadV2881()}</p><p>两项议事共用${r.cooldown}个游戏日冷却，每次选择一项。${repair.wait?`还需${repair.wait}个游戏日。`:'本次可以议事。'}消费不会降低累计贡献或职位。</p><article><h4>整饬山门</h4><p>支出${repair.contribution}贡献、${repair.gold}灵石；繁荣度+${repair.gain}（本项提升至多${r.prosperityCap}，更高繁荣度保留）。繁荣度参与原有入侵概率与仙门求援判定。</p><button class="choice-btn" onclick="executeSectMasterV2872('repair',${token})" ${repair.ok?'':'disabled'}>整饬山门 · 确认费用</button></article><article><h4>亲授门人</h4><p>每名${r.lessonContribution}贡献，本次${lesson.members.length}名，共${lesson.contribution}贡献；空闲且未满级弟子等级+1（最高10），忠诚+2。正在派遣或随军者不参与。</p><p>${lesson.members.map(d=>`${discipleEscV2815(d.name)} Lv.${d.level}→${d.level+1}`).join('、')||'暂无符合条件的弟子'}</p><button class="choice-btn" onclick="executeSectMasterV2872('lesson',${token})" ${lesson.ok?'':'disabled'}>亲授门人 · 确认名单</button></article></section>`,[{text:'返回宗门',action:'sect_hall'}]);
}
function executeSectMasterV2872(kind,token){
 const view=sectMasterViewV2872;if(!view||view.token!==token||view.owner!==player||view.sect!==player.sect||!document.getElementById('sectMasterTitleV2872')||document.getElementById('storyPanel')?.classList.contains('hidden'))return false;
 const plan=sectMasterPlanV2872(kind);if(!plan?.ok)return false;
 const snapshot=()=>JSON.stringify([player.sectContribution,player.gold,player.sectData?.prosperity,player.sectMasterV2872,discipleDayV2815(),sectMembersReadV2868(),sectMembersReadV2868().map(d=>[d.id,warDiscipleBusyV286841(d.id)])]),before=snapshot();
 if(!confirm(kind==='repair'?`支出${plan.contribution}贡献、${plan.gold}灵石，使繁荣度+${plan.gain}？两项议事将共同冷却30个游戏日。`:`支出${plan.contribution}贡献，亲授${plan.members.map(d=>d.name).join('、')}共${plan.members.length}名弟子，等级各+1、忠诚各+2？两项议事将共同冷却30个游戏日。`))return false;
 if(view!==sectMasterViewV2872||player!==view.owner||player.sect!==view.sect||!sectMasterPlanV2872(kind)?.ok||before!==snapshot())return false;
 const ok=commitMiniWeaveV286840(()=>{
  player.sectContribution-=plan.contribution;player.gold-=plan.gold;
  const state=plan.state;state.nextDay=plan.day+SECT_MASTER_COUNCIL_V2872.cooldown;
  if(kind==='repair'){player.sectData.prosperity=sectProsperityReadV2881()+plan.gain;state.repairs++;}
  else {for(const d of plan.members){d.level++;lifeCompletedV2868(d,{type:'train'});const traits=discipleTraitsV2867(d);d.traitsV2867={...traits,loyalty:Math.min(100,traits.loyalty+2)};}state.lessons++;}
  player.sectMasterV2872=state;
 });
 if(ok){updateStats();showSectMasterV2872();}return ok;
}

// Seasonal administration: explicit claims, immutable quarter quotes, no back pay.
const SECT_ADMIN_V2873={
 arts:[{id:'juling',name:'周天聚灵大阵',cost:300,desc:'下一季起繁荣度额外+2'},
 {id:'wanyao',name:'万药归宗诀',cost:400,desc:'下一季起基础岁入+30%'},
 {id:'jiuzhuan',name:'九转敕令诀',cost:500,desc:'此后新敕令持续40日，结束后冷却20日'}],
 decrees:[{id:'kaicang',name:'开仓赈济令',gold:200,contribution:0,income:.8,prosperity:1,gain:4},
 {id:'zhongshang',name:'重商兴市令',gold:0,contribution:0,income:1.5,prosperity:-1,gain:0},
 {id:'qingxiu',name:'封山清修令',gold:0,contribution:50,income:.6,prosperity:2,gain:0}],
 posts:[{id:'hufa',name:'护法',desc:'下一季繁荣度+1'},
 {id:'zhishi',name:'执事',desc:'下一季基础岁入+10%'},
 {id:'xianfeng',name:'先锋',desc:'下一季可用及累计贡献+2；在任且仍在名册时本宗山门战力+5%，不改已开战快照'}]
};
function normalizeSectAdminV2873(raw,sect){
 const n=(v,max=1e9)=>Number.isFinite(Number(v))?Math.min(max,Math.max(0,Math.floor(Number(v)))):0;
 const r=raw&&raw.sect===sect?raw:{},ids=['hufa','zhishi','xianfeng'],seen=new Set(),officers={};
 for(const id of ids){const v=r.officers?.[id],valid=(Number.isSafeInteger(v)&&v>=0)||(typeof v==='string'&&/^[\p{L}\p{N}_.:-]{1,40}$/u.test(v));officers[id]=valid&&!seen.has(String(v))?v:null;if(officers[id]!==null)seen.add(String(v));}
 const arts=[...new Set((Array.isArray(r.arts)?r.arts:[]).filter(id=>['juling','wanyao','jiuzhuan'].includes(id)))];
 const d=r.decree||{},decree={id:['kaicang','zhongshang','qingxiu'].includes(d.id)?d.id:null,until:n(d.until),ready:n(d.ready)};
 const q=r.quarter,quarter=q&&Number.isFinite(q.due)&&q.due>=0?{due:n(q.due),gold:n(q.gold,100000),prosperity:n(q.prosperity,10),officers:{...officers},stewardGold:n(q.stewardGold,10000)}:null;
 // A quote records the original appointees; later appointments cannot earn past bonuses.
 if(quarter)for(const id of ids){const v=q.officers?.[id];quarter.officers[id]=(typeof v==='string'&&/^[\p{L}\p{N}_.:-]{1,40}$/u.test(v))||(Number.isSafeInteger(v)&&v>=0)?v:null;}
 if(quarter&&q.economy===2){quarter.economy=2;quarter.upkeep=n(q.upkeep,1000000);quarter.members=n(q.members,100000);quarter.posts=n(q.posts,3);}
 const x=r.ledger,ledger=x&&Number.isFinite(x.income)?{income:n(x.income,1000000),upkeep:n(x.upkeep,1000000),net:Math.max(-1e9,Math.min(1e9,Number(x.net)||0)),arrears:!!x.arrears}:null;
 return {version:1,sect,arts,officers,decree,quarter,highDay:n(r.highDay),claims:n(r.claims),ledger};
}
function sectAdminReadV2873(){return normalizeSectAdminV2873(player.sectAdminV2873,player.sect);}
function sectAdminQuoteV2873(s,path=sectPathReadV2880(),prosperity=sectProsperityReadV2881()){
 const day=discipleDayV2815(),pros=Math.max(10,Math.min(100,prosperity)),level=Math.max(0,Math.min(16,Number(player.level)||0));
 const base=(pros+20)*(1+level*.5),due=day+30,dec=SECT_ADMIN_V2873.decrees.find(d=>d.id===s.decree.id&&s.decree.until>=due);
 const officers={};for(const p of SECT_ADMIN_V2873.posts)officers[p.id]=sectMembersReadV2868().some(d=>String(d.id)===String(s.officers[p.id]))?s.officers[p.id]:null;
 const enabled=!!path.doctrine,scale=enabled?8:1,legacy=path.stage===4?path.legacy:null;
 const quote={due,gold:Math.round(base*scale*(1+(s.arts.includes('wanyao')?.3:0)+(path.doctrine==='dan'?.15:0)+(enabled&&legacy==='seclude'?.05:0))*(dec?.income||1)),prosperity:1+(s.arts.includes('juling')?2:0)+(dec?.prosperity||0)+(path.doctrine==='zhen'?1:0),officers,stewardGold:Math.round(base*scale*.1*(dec?.income||1))};
 if(enabled){const members=sectMembersReadV2868().length,posts=Object.values(officers).filter(v=>v!==null).length;Object.assign(quote,{economy:2,members,posts,upkeep:Math.round(members*20*(1+level*.1)*(path.doctrine==='jian'?1.1:1)+posts*80*(legacy==='retire'?.5:1)+pros*3*(path.doctrine==='zhen'?.7:1))});}
 return quote;
}
function sectAdminRewardV2873(s){
 const q=s.quarter;if(!q)return null;
 const owns=id=>q.officers[id]!==null&&s.officers[id]===q.officers[id]&&sectMembersReadV2868().some(d=>String(d.id)===String(q.officers[id]));
 return {upkeep:q.upkeep||0,gold:q.gold+(owns('zhishi')?q.stewardGold:0),prosperity:q.prosperity+(owns('hufa')?1:0),contribution:owns('xianfeng')?2:0};
}
// One settlement calculation is shared by preview, confirmation and the committed result.
function sectSettlementV2881(state){
 const reward=sectAdminRewardV2873(state);if(!reward)return null;
 const beforeGold=player.gold,beforePros=sectProsperityReadV2881(),shortfall=Math.max(0,reward.upkeep-reward.gold-beforeGold);
 const goldAfter=Math.max(0,beforeGold+reward.gold-reward.upkeep),arrears=shortfall>0;
 const prosAfter=Math.max(0,Math.max(beforePros,Math.min(100,beforePros+reward.prosperity))-(arrears?2:0));
 return {...reward,beforeGold,beforePros,goldAfter,prosAfter,shortfall,arrears,net:goldAfter-beforeGold};
}
function sectSettlementTextV2881(r){
 return `收入${r.gold}，供养${r.upkeep}；本次灵石${r.net>=0?'+':''}${r.net}（${r.beforeGold}→${r.goldAfter}），繁荣度${r.beforePros}→${r.prosAfter}，贡献+${r.contribution}`+(r.arrears?`；供养缺口${r.shortfall}，本次欠饷额外繁荣-2，缺口不滚入下季`:'；本次无欠饷');
}
let sectAdminViewV2873=null,sectAdminSerialV2873=0;
function sectAdminPlanV2873(kind,id,member){
 if(!sectMasterAllowedV2872())return null;
 const state=sectAdminReadV2873(),day=discipleDayV2815();if(day<state.highDay)return null;
 let gold=0,contribution=0,label='',def,settlement=null;
 if(kind==='start'){if(state.quarter)return null;const preview=sectAdminRewardV2873({...state,quarter:sectAdminQuoteV2873(state)});label=`开启首季账册：30游戏日后可领取${preview.gold}灵石、繁荣度+${preview.prosperity}（上限100）、贡献+${preview.contribution}，无历史补发；供养${preview.upkeep}，净收益${preview.gold-preview.upkeep}灵石`;}
 else if(kind==='claim'){if(!state.quarter||day<state.quarter.due)return null;settlement=sectSettlementV2881(state);label=sectSettlementTextV2881(settlement)+'；确认后结算本季，并按当前配置开启下一季';}
 else if(kind==='art'){def=SECT_ADMIN_V2873.arts.find(a=>a.id===id);if(!def||state.arts.includes(id))return null;contribution=def.cost;label=`修习${def.name}，支出${contribution}贡献；已开季收支不变`;}
 else if(kind==='decree'){def=SECT_ADMIN_V2873.decrees.find(a=>a.id===id);if(!def||day<state.decree.ready)return null;gold=def.gold;contribution=def.contribution;label=`颁布${def.name}，支出${gold}灵石、${contribution}贡献；立刻繁荣度+${def.gain}（上限100），已开季收支不变`;}
 else if(kind==='appoint'){def=SECT_ADMIN_V2873.posts.find(a=>a.id===id);const target=sectMembersReadV2868().find(d=>String(d.id)===String(member));if(!def||!target||state.officers[id]===target.id||Object.values(state.officers).some(v=>v!==null&&String(v)===String(target.id)))return null;member=target.id;label=`任命${target.name}为${def.name}，季度奖励与供养从下一季生效${id==='xianfeng'?'；山门战力+5%立即用于新战役，不改已开战快照':''}；不改变派遣或军职`;}
 else if(kind==='dismiss'){def=SECT_ADMIN_V2873.posts.find(a=>a.id===id);if(!def||state.officers[id]===null)return null;label=`卸任${def.name}，本季该官职奖励失效，已锁定供养不退${id==='xianfeng'?'；新战役不再获得先锋加成，已有战役不变':''}`;}
 else return null;
 if(player.gold<gold||(player.sectContribution||0)<contribution)return null;
 return {state,day,gold,contribution,label,def,member,settlement};
}
function executeSectAdminV2873(kind,id,member,token){
 const view=sectAdminViewV2873,valid=()=>view&&view===sectAdminViewV2873&&token===view.token&&player===view.owner&&player.sect===view.sect&&!!document.getElementById('sectAdminTitleV2873')&&!document.getElementById('storyPanel')?.classList.contains('hidden')&&sectMasterAllowedV2872();
 if(!valid())return false;const p=sectAdminPlanV2873(kind,id,member);if(!p)return false;
 const snapshot=()=>JSON.stringify([player.sectAdminV2873,player.sectPathV2880,player.sectPromotion,player.level,player.gold,player.sectContribution,player.sectTotalContribution,player.sectData?.prosperity,discipleDayV2815(),sectMembersReadV2868()]),before=snapshot();
 if(!confirm(p.label+'？')||!valid()||before!==snapshot()||!sectAdminPlanV2873(kind,id,member))return false;
 const ok=commitMiniWeaveV286840(()=>{
  const s=p.state;s.highDay=Math.max(s.highDay,p.day);player.gold-=p.gold;player.sectContribution-=p.contribution;
  const addPros=g=>{const old=Number.isFinite(Number(player.sectData.prosperity))?Number(player.sectData.prosperity):20;player.sectData.prosperity=Math.max(old,Math.min(100,old+g));};
  if(kind==='claim'){const r=p.settlement;player.gold=r.goldAfter;player.sectData.prosperity=r.prosAfter;grantSectContributionV2768(r.contribution);s.ledger={income:r.gold,upkeep:r.upkeep,net:r.net,arrears:r.arrears};s.claims++;}
  if(kind==='art')s.arts.push(id);
  if(kind==='decree'){addPros(p.def.gain);s.decree={id,until:p.day+(s.arts.includes('jiuzhuan')?40:30),ready:p.day+60};}
  if(kind==='appoint'||kind==='dismiss'){
   // Dismissal/replacement permanently cancels this quarter's original post bonus.
   if(s.quarter)s.quarter.officers[id]=null;
   s.officers[id]=kind==='appoint'?p.member:null;
  }
  if(kind==='start'||kind==='claim')s.quarter=sectAdminQuoteV2873(s);
  player.sectAdminV2873=s;
 });
 if(ok){updateStats();showSectAdminV2873();}return ok;
}
function showSectAdminV2873(){
 if(!sectMasterAllowedV2872())return;
 const s=sectAdminReadV2873(),day=discipleDayV2815(),token=++sectAdminSerialV2873,esc=escapeGameText;
 sectAdminViewV2873={token,owner:player,sect:player.sect};
 const button=(kind,id,member,text)=>{const js=`executeSectAdminV2873(${JSON.stringify(kind)},${JSON.stringify(id)},${JSON.stringify(member)},${token})`;return `<button class="choice-btn" onclick="${esc(js)}" ${sectAdminPlanV2873(kind,id,member)?'':'disabled'}>${esc(text)}</button>`;};
 let html=`<section class="sect-board-v2866 loop-board-v286840"><h3 id="sectAdminTitleV2873">${esc(player.sect)} · 宗主经营</h3><p>灵石 ${player.gold} · 可用贡献 ${player.sectContribution||0}</p><p>每季30游戏日，开季锁定收益；到期手动领取，逾期不累计多季。领取后从当日开启下一季。新绝学、敕令与任命只影响此后开季；卸任或离宗会失去本季该官职加成。</p><p>基础岁入＝（开季繁荣度＋20）×（1＋境界序号×0.5），繁荣度按10～100计算；绝学、官职与敕令按下列规则加成。</p>`;
 const path=sectPathReadV2880();html+=`<p>道统：${SECT_DOCTRINES_V2880.find(d=>d.id===path.doctrine)?.name||'未选择 · 旧规则无供养'} · 弟子名额${sectDiscipleCapV2880()}</p><button class="choice-btn" onclick="showSectPathV2880()">三试与道统</button><p>选择道统后，新季度基础岁入乘8并收供养；旧账册不追收。供养先抵本季收入，不足再扣随身灵石；仍不足额外繁荣-2。只有手动确认结算才扣费。</p>`;
 if(s.ledger)html+=`<p>上季：收入${s.ledger.income}，供养${s.ledger.upkeep}，实际灵石变化${s.ledger.net}${s.ledger.arrears?'，欠饷繁荣-2':''}。</p>`;
 if(day<s.highDay)html+=`<p>当前日期早于经营记录，请等待至第${s.highDay}游戏日再操作。</p>`;
 if(s.quarter){const r=sectAdminRewardV2873(s),settlement=sectSettlementV2881(s);html+=`<h4>季度账册</h4><p>还需${Math.max(0,s.quarter.due-day)}日 · 本季${r.gold}灵石、繁荣度+${r.prosperity}（提升上限100，已有更高值保留）、贡献+${r.contribution}；供养${r.upkeep}，净收益${r.gold-r.upkeep}灵石。${sectUpkeepTextV2880(s.quarter)}</p><p role="status">按当前余额结算：${sectSettlementTextV2881(settlement)}。</p>`+button('claim','',null,'领取岁入并开启下一季');}
 else {const q=sectAdminQuoteV2873(s),r=sectAdminRewardV2873({...s,quarter:q});html+=`<h4>季度账册</h4><p>预览：收入${r.gold}，供养${r.upkeep}，净收益${r.gold-r.upkeep}灵石。${sectUpkeepTextV2880(q)}</p>`+button('start','',null,'开启首季账册');}
 html+='<h4>敕令</h4><p>每次颁布后60日才可再次颁布；默认持续30日，九转绝学延长为40日。只有在新季度到期日仍有效的敕令计入该季。</p>';
 if(s.decree.id)html+=`<p>${esc(SECT_ADMIN_V2873.decrees.find(d=>d.id===s.decree.id).name)}：有效期剩${Math.max(0,s.decree.until-day)}日，再颁剩${Math.max(0,s.decree.ready-day)}日。</p>`;
 for(const d of SECT_ADMIN_V2873.decrees)html+=`<article><p>${d.name}：${d.gold}灵石、${d.contribution}贡献；即时繁荣+${d.gain}；符合有效期的新季度岁入×${d.income}，繁荣${d.prosperity>=0?'+':''}${d.prosperity}。</p>${button('decree',d.id,null,'颁布 · '+d.name)}</article>`;
 html+='<h4>镇派绝学</h4><p>宗门经营传承，不是角色战斗技能；消费不降低累计贡献。</p>';
 for(const a of SECT_ADMIN_V2873.arts)html+=`<p>${a.name} · ${a.desc} · ${a.cost}贡献</p>`+(s.arts.includes(a.id)?'<p>已修成</p>':button('art',a.id,null,'修习 · '+a.name));
 html+='<h4>官职任命</h4><p>一人一职，行政职务可与派遣、随军并存。供养按开季锁定，卸任不退本季供养。先锋影响新战役战力，不修改已开战快照。</p>';
 for(const p of SECT_ADMIN_V2873.posts){const current=sectMembersReadV2868().find(d=>s.officers[p.id]!==null&&String(d.id)===String(s.officers[p.id]));html+=`<details><summary>${p.name}：${current?esc(current.name):'空缺'} · ${p.desc}</summary>`+button('dismiss',p.id,null,'卸任'+p.name);for(const d of sectMembersReadV2868())html+=button('appoint',p.id,d.id,'任命'+d.name);html+='</details>';}
 html+='<button class="choice-btn" onclick="showSectMasterV2872()">返回整饬与授业</button></section>';showStory(html,[{text:'返回宗门大殿',action:'sect_hall'}]);
}

let miniRerollViewV2875=null;
function rerollMiniBoonV2875(runId,floor){
 if(!sectCanManageV2866())return false;const c=miniRunV2778(),w=miniWeaveV286840(c);
 if(miniRerollViewV2875?.owner!==player||miniRerollViewV2875.c!==c||miniRerollViewV2875.w!==w||!document.getElementById('miniRerollV2875')||document.getElementById('storyPanel')?.classList.contains('hidden')||!w||c.id!==runId||!w.pending||floor!==c.step-1||!Number.isInteger(floor)||floor<0||floor>1||w.rerolledV2875===true)return false;
 const next=MINI_BOONS_V286840.map((_,i)=>i).filter(i=>!w.offers[floor].includes(i));
 if(next.length!==3)return false;
 const ok=commitMiniWeaveV286840(()=>{w.offers[floor]=next;w.rerolledV2875=true;});showMiniRealmV2778();return ok;
}


// Sect succession: persistent trials, explicit doctrine selection and seasonal upkeep.
const SECT_DOCTRINES_V2880=[
 {id:'jian',name:'剑道·锋芒',virtue:'jue',desc:'本宗山门战力+8%，弟子供养+10%'},
 {id:'dan',name:'丹道·归元',virtue:'ren',desc:'新季度基础岁入+15%'},
 {id:'zhen',name:'阵道·固本',virtue:'shou',desc:'新季度繁荣+1，山门运转供养-30%'}
];
const SECT_LEGACIES_V2880=[
 {id:'retire',name:'请老宗主退隐',desc:'新季度官职供养减半'},
 {id:'seclude',name:'请老宗主闭关',desc:'新季度基础岁入+5%'},
 {id:'fallen',name:'承接先宗主遗志',desc:'最终继位时一次获得300贡献，繁荣度-3；这是试炼中的传承叙事，不改变已有NPC剧情'}
];
function normalizeSectPathV2880(raw,sect){
 const r=raw&&raw.sect===sect?raw:{},n=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1e9,Math.floor(Number(v)))):0;
 const virtue=['jue','ren','shou'].includes(r.virtue)?r.virtue:null,defense=['fight','array','disciples'].includes(r.defense)?r.defense:null;
 const legacy=SECT_LEGACIES_V2880.some(x=>x.id===r.legacy)?r.legacy:null,doctrine=SECT_DOCTRINES_V2880.some(x=>x.id===r.doctrine)?r.doctrine:null;
 const roll=typeof r.roll==='number'&&r.roll>=0&&r.roll<1?r.roll:null;
 let stage=Math.min(4,n(r.stage));if(stage>=2&&(!virtue||roll===null))stage=1;if(stage>=3&&!defense)stage=2;if(stage>=4&&!legacy)stage=3;
 return {version:1,sect,stage,virtue,defense,legacy,doctrine,roll,fails:n(r.fails),retryDay:n(r.retryDay),highDay:n(r.highDay)};
}
function sectPathReadV2880(){return normalizeSectPathV2880(player.sectPathV2880,player.sect);}
function sectPathMasterV2880(){return !!player?.sect&&player.sect!=='散修'&&!isFactionDestroyed(player.sect)&&normalizePromotionV2768(player.sectPromotion,player.sect).inherited;}
function sectDiscipleCapV2880(){return sectPathMasterV2880()?16:12;}
function sectPathPowerV2880(){
 if(!sectPathMasterV2880())return 1;
 const p=sectPathReadV2880(),s=sectAdminReadV2873();
 const officer=s.officers.xianfeng,exists=officer!==null&&sectMembersReadV2868().some(d=>String(d.id)===String(officer));
 return 1+(p.doctrine==='jian'?.08:0)+(exists?.05:0);
}
function sectPathChanceV2880(id){
 const count=sectMembersReadV2868().filter(d=>!d.job&&!warDiscipleBusyV286841(d.id)).length;
 if(id==='fight')return Math.max(.3,Math.min(.95,.55+.04*(player.level-4)+.02*count));
 if(id==='array')return .8;
 return id==='disciples'&&count>=3?Math.min(.9,.5+.05*count):0;
}
let sectPathViewV2880=null,sectPathSerialV2880=0;
function sectPathPlanV2880(kind,id){
 if(!sectCanManageV2866())return null;
 const s=sectPathReadV2880(),day=discipleDayV2815(),master=sectPathMasterV2880();
 if(day<s.highDay||s.doctrine||(!master&&!sectMasterRequirementsV2872().ready))return null;
 let label='',chance=0,cost=0;
 if(kind==='start'&&!master&&s.stage===0)label='开始宗主三试：问心、守山、受印；可暂离后继续';
 else if(kind==='heart'&&!master&&s.stage===1&&['jue','ren','shou'].includes(id))label='确认问心选择？仅记录决、仁、守倾向，不扣好感或改变心魔';
 else if(kind==='gate'&&!master&&s.stage===2&&day>=s.retryDay){chance=sectPathChanceV2880(id);cost=id==='array'?100:0;if(!chance||(player.sectContribution||0)<cost)return null;label=`守山方案成功率${Math.round(chance*100)}%，消耗${cost}贡献（失败也扣）；失败需调息3个游戏日，不损失境界或物品`;}
 else if(kind==='seal'&&!master&&s.stage===3&&SECT_LEGACIES_V2880.some(x=>x.id===id))label='受印选择：'+SECT_LEGACIES_V2880.find(x=>x.id===id).desc;
 else if(kind==='doctrine'&&(master||s.stage===4)&&SECT_DOCTRINES_V2880.some(x=>x.id===id))label=`确定${SECT_DOCTRINES_V2880.find(x=>x.id===id).name}？暂不可更改。以后新季度启用岁入×8与供养扣费，旧账册不变；须手动结算，余额不足时灵石归零并额外繁荣-2`;
 else return null;
 return {s,day,master,label,chance,cost};
}
function showSectPathV2880(){
 if(!sectCanManageV2866())return;
 const s=sectPathReadV2880(),master=sectPathMasterV2880(),gate=sectMasterRequirementsV2872(),token=++sectPathSerialV2880,esc=escapeGameText;
 sectPathViewV2880={owner:player,sect:player.sect,token};
 const button=(kind,id,text)=>`<button class="choice-btn" onclick="${esc(`executeSectPathV2880(${JSON.stringify(kind)},${JSON.stringify(id)},${token})`)}" ${sectPathPlanV2880(kind,id)?'':'disabled'}>${esc(text)}</button>`;
 let html=`<section class="sect-board-v2866 loop-board-v286840"><h3 id="sectPathTitleV2880">宗主三试 · 传承道统</h3><p>${esc(sectMasterRequirementTextV2872())}。每一步保存后可暂离续接。</p>`;
 if(s.doctrine){const d=SECT_DOCTRINES_V2880.find(x=>x.id===s.doctrine),legacy=s.stage===4?SECT_LEGACIES_V2880.find(x=>x.id===s.legacy):null;html+=`<h4>已立道统：${d.name}</h4><p>${d.desc}。道统暂不可更改。</p>${legacy?`<p>受印传承：${legacy.name} · ${legacy.desc}</p>`:''}<button class="choice-btn" onclick="showSectAdminV2873()">查看季度收支</button>`;}
 else if(!master&&!gate.ready)html+='<p>尚未满足传承门槛，请先完成修行、贡献与宗门委托。</p>';
 else if(master||s.stage===4){
  html+=`<h4>择立道统</h4><p>${master?'旧宗主无需补做三试。':'三试已过，选择道统后正式继位。'}道统暂不可更改，已开季账册保持原约定。新季度基础岁入×8，同时按开季弟子人数、官职和繁荣度锁定供养；到期手动确认净收益，逾期不补发多季。</p>`;
  const admin=sectAdminReadV2873();
  for(const d of SECT_DOCTRINES_V2880){const afterPros=!master&&s.stage===4&&s.legacy==='fallen'?Math.max(0,sectProsperityReadV2881()-3):sectProsperityReadV2881(),q=sectAdminQuoteV2873(admin,{...s,doctrine:d.id},afterPros),r=sectAdminRewardV2873({...admin,quarter:q});html+=`<article><h4>${d.name}${d.virtue===s.virtue?' · 问心相合':''}</h4><p>${d.desc}</p><p>以继位后配置开季（繁荣度${afterPros}）：岁入${r.gold}，供养${r.upkeep}，净收益${r.gold-r.upkeep}灵石。${sectUpkeepTextV2880(q)}</p>${button('doctrine',d.id,'确认道统 · '+d.name)}</article>`;}
 }else if(s.stage===0)html+=button('start','','开始三试');
 else if(s.stage===1){html+='<h4>第一试 · 问心</h4><p>祖师堂烛火摇曳：若执掌宗门，你愿如何面对牵挂？以下只记录理念，不改变好感和心魔数值。</p>';for(const [id,name] of [['jue','决 · 以剑明志'],['ren','仁 · 直面牵挂'],['shou','守 · 立誓护宗']])html+=button('heart',id,name);}
 else if(s.stage===2){html+=`<h4>第二试 · 守山</h4><p>山门试阵中妖影袭来，选择应对方案。此处按显示概率结算，不进入战斗画面。已败退${s.fails}次；还需调息${Math.max(0,s.retryDay-discipleDayV2815())}日。仅空闲且未随军弟子参与，刷新不重抽本次试阵结果。</p>`;for(const [id,name] of [['fight','亲自迎敌'],['array','布阵固守 · 消耗100贡献'],['disciples','遣弟子出战 · 需3名空闲弟子']])html+=button('gate',id,`${name} · 成功率${Math.round(sectPathChanceV2880(id)*100)}%`);}
 else {html+='<h4>第三试 · 受印</h4><p>传承试境将历代掌门的故事呈现眼前。选择本门继承的遗志，收益在最终继位后生效。</p>';for(const l of SECT_LEGACIES_V2880)html+=button('seal',l.id,l.name+' · '+l.desc);}
 if(discipleDayV2815()<s.highDay)html+=`<p>日期早于记录，请等待至第${s.highDay}日。</p>`;
 html+='</section>';showStory(html,[{text:'返回宗门大殿',action:'sect_hall'}]);
}
function executeSectPathV2880(kind,id,token){
 const v=sectPathViewV2880,valid=()=>v&&v===sectPathViewV2880&&v.token===token&&v.owner===player&&v.sect===player.sect&&document.getElementById('sectPathTitleV2880')&&!document.getElementById('storyPanel')?.classList.contains('hidden')&&sectCanManageV2866();
 if(!valid())return false;const p=sectPathPlanV2880(kind,id);if(!p)return false;
 const before=JSON.stringify(player);if(!confirm(p.label+'？')||!valid()||before!==JSON.stringify(player)||!sectPathPlanV2880(kind,id))return false;
 const ok=commitMiniWeaveV286840(()=>{
  const s=p.s;s.highDay=Math.max(s.highDay,p.day);
  if(kind==='start')s.stage=1;
  if(kind==='heart'){s.virtue=id;s.stage=2;s.roll=Math.random();}
  if(kind==='gate'){player.sectContribution-=p.cost;if(s.roll<p.chance){s.defense=id;s.stage=3;}else{s.fails++;s.retryDay=p.day+3;s.roll=Math.random();}}
  if(kind==='seal'){s.legacy=id;s.stage=4;}
  if(kind==='doctrine'){
   s.doctrine=id;
   if(!p.master){player.sectPromotion={...normalizePromotionV2768(player.sectPromotion,player.sect),inherited:true};if(s.legacy==='fallen'){grantSectContributionV2768(300);player.sectData.prosperity=Math.max(0,(Number(player.sectData.prosperity)||0)-3);}player.sectRank=getCurrentRankInfo().name;}
  }
  player.sectPathV2880=s;
 });
 if(ok){updateStats();if(kind==='doctrine'){showSectAdminV2873();if(!p.master)showSectMasterCeremonyV2870();}else showSectPathV2880();}return ok;
}
function sectUpkeepTextV2880(q){
 return q.upkeep===undefined?'旧账册不收供养。':`供养组成：弟子${q.members}名、官职${q.posts}席；弟子每人20×(1+境界序号×0.1)，官职每席80，山门运转为繁荣度×3，再计道统及传承减免。`;
}
