/* Bounded disciple chronicle and one-time consequence chains; no timers or paid calls. */
const LIFE_TYPES_V2868={training:'培养完成',mission:'出使归来',rescue:'救援同门',explore:'寻访遗迹',withdraw:'有序撤回',safe:'稳妥前行',thanks:'同门答谢',trail:'古洞寻踪',trail_done:'古洞归来'};
function lifeReadV2868(d){
 const raw=d?.lifeV2868||{},integer=(v,max=100000)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0,counts={};
 for(const k of ['training','mission','rescue','explore'])counts[k]=integer(raw.counts?.[k]);
 const history=Array.isArray(raw.history)?raw.history.slice(-12).filter(x=>x&&Object.hasOwn(LIFE_TYPES_V2868,x.type)).map(x=>({type:x.type,day:integer(x.day,1e9)})):[];
 const gifts=['waiting','done'].includes(raw.thanks?.state)?{state:raw.thanks.state,due:integer(raw.thanks.due,1e9)}:null;
 const trail=['ready','running','done'].includes(raw.trail?.state)?{state:raw.trail.state}:null;
 return {counts,history,thanks:gifts,trail};
}
function lifeAddV2868(d,type){const life=lifeReadV2868(d);if(!Object.hasOwn(LIFE_TYPES_V2868,type))return life;life.history.push({type,day:discipleDayV2815()});life.history=life.history.slice(-12);if(Object.hasOwn(life.counts,type))life.counts[type]=Math.min(100000,life.counts[type]+1);d.lifeV2868=life;return life;}
function lifeTitlesV2868(d){const c=lifeReadV2868(d).counts;return [c.training>=3?'笃学之士':'',c.mission>=5?'行路老手':'',c.rescue>=3?'济危同门':'',c.explore>=3?'寻幽客':''].filter(Boolean);}
function lifeEventV2868(d,e,choice){const type=choice===0?'safe':['rescue','explore','withdraw'][e.kind];const life=lifeAddV2868(d,type);if(choice===1&&e.kind===0&&!life.thanks)life.thanks={state:'waiting',due:discipleDayV2815()+3};if(choice===1&&e.kind===1&&!life.trail)life.trail={state:'ready'};d.lifeV2868=life;}
function lifeCompletedV2868(d,j){const life=lifeAddV2868(d,j.type==='train'?'training':j.followupV2868?'trail_done':'mission');if(j.followupV2868)life.trail={state:'done'};d.lifeV2868=life;}
function lifeCardV2868(d){const titles=lifeTitlesV2868(d);return `${titles.length?`<p class="disciple-titles-v2868">${titles.join(' · ')}</p>`:''}<button class="choice-btn" onclick="showDiscipleLifeV2868(${d.id})">成长履历与后续</button>`;}
let lifeViewV2868=null;
function showDiscipleLifeV2868(id){
 if(!sectCanManageV2866())return;const d=discipleRosterV2815().members.find(x=>x.id===id);if(!d)return;
 const life=lifeReadV2868(d),titles=lifeTitlesV2868(d),allowed=discipleAllowedV2815(),esc=discipleEscV2815;
 lifeViewV2868={owner:player,sect:player.sect,disciple:d};
 let html=`<section class="sect-board-v2866"><h3 id="discipleLifeTitleV2868">${esc(d.name)} · 成长履历</h3><p>${titles.join(' · ')||'初入山门，来日方长'}</p><p>培养 ${life.counts.training} 次 · 出使 ${life.counts.mission} 次 · 救援 ${life.counts.rescue} 次 · 探索 ${life.counts.explore} 次</p><details><summary>称号条件</summary><p>培养3次：笃学之士；普通派遣归来5次：行路老手；救援3次：济危同门；探索3次：寻幽客。称号记录经历，不额外增加战力。</p></details>`;
 if(life.thanks){const days=Math.max(0,life.thanks.due-discipleDayV2815());html+=`<article><h4>药棚旧友</h4><p>${life.thanks.state==='done'?'同门送来的药与灵草已收下，这份人情留在了履历中。':days?`获救同门正在休养，${days} 个游戏日后会送来答谢。`:'同门伤愈归来，将两瓶小还丹与三束灵草放在案上：“那日若不是你们停步，我恐怕走不出药棚。”'}</p><button class="choice-btn" onclick="claimDiscipleThanksV2868(${id})" ${!allowed||days||life.thanks.state==='done'?'disabled':''}>${life.thanks.state==='done'?'已收下答谢':'收下答谢 · 小还丹×2、灵草×3'}</button></article>`;}
 if(life.trail)html+=`<article><h4>古洞寻踪</h4><p>${life.trail.state==='done'?'旧洞的踪迹已查清，这次寻访已记入履历。':life.trail.state==='running'?'弟子已沿旧线索出发，到期后从事务中领取成果。':'上次带回的残图显出一条隐蔽山径。可让这位弟子再去查探一次。'}</p><p>4个游戏日 · 240灵石、妖丹×2 · 无费用、无途中事件</p><button class="choice-btn" onclick="startDiscipleTrailV2868(${id})" ${!allowed||life.trail.state!=='ready'||d.job?'disabled':''}>${life.trail.state==='done'?'后续已完成':life.trail.state==='running'?'正在寻踪':d.job?'弟子忙碌，空闲后可出发':'确认派遣 · 古洞寻踪'}</button></article>`;
 html+=`<h4>最近经历</h4><ol class="disciple-history-v2868">${life.history.slice().reverse().map(x=>`<li><small>游历第 ${x.day+1} 日</small><span>${LIFE_TYPES_V2868[x.type]}</span></li>`).join('')||'<li>尚无记载，新的经历会从此刻开始记录。</li>'}</ol><button class="choice-btn" onclick="showDisciplesV2815()">返回弟子名册</button><button class="choice-btn" onclick="showSectTodoV2868()">宗门待办</button></section>`;
 showStory(html,[]);
}
function lifeActionDiscipleV2868(id){if(!discipleAllowedV2815()||!lifeViewV2868||lifeViewV2868.owner!==player||lifeViewV2868.sect!==player.sect||document.getElementById('storyPanel')?.classList.contains('hidden')||!document.getElementById('discipleLifeTitleV2868'))return null;const d=discipleRosterV2815().members.find(x=>x.id===id);return d&&lifeViewV2868.disciple===d?d:null;}
function claimDiscipleThanksV2868(id){const d=lifeActionDiscipleV2868(id);if(!d)return;const life=lifeReadV2868(d);if(life.thanks?.state!=='waiting'||life.thanks.due>discipleDayV2815())return;life.thanks.state='done';d.lifeV2868=life;lifeAddV2868(d,'thanks');player.inventory.push('小还丹','小还丹');player.materials['灵草']=(player.materials['灵草']||0)+3;onCollectMaterial?.('灵草',3);autoSave();updateStats();showDiscipleLifeV2868(id);}
function startDiscipleTrailV2868(id){const d=lifeActionDiscipleV2868(id);if(!d||d.job)return;const life=lifeReadV2868(d);if(life.trail?.state!=='ready')return;life.trail.state='running';d.lifeV2868=life;lifeAddV2868(d,'trail');d.job={type:'mission',name:'古洞寻踪',end:discipleDayV2815()+4,gold:240,material:'妖丹',count:2,followupV2868:true};autoSave();showDiscipleLifeV2868(id);}
// Read-only lookup: drawing must not migrate rosters or roll candidate batches.
function sectMembersReadV2868(){const data=player?.sectData,state=data?.managementV2815;const members=state?.rosters?.[player?.sect]?.members;return Array.isArray(members)?members.slice(0,12):[];}
function sectTodoReadV2868(){
 const empty={mails:[],jobs:[],thanks:[],trails:[],tasks:[],promotion:false,total:0};
 if(!player?.sect||player.sect==='散修'||isFactionDestroyed(player.sect))return empty;
 if(hasRank('长老'))for(const d of sectMembersReadV2868()){if(discipleEventReadyV2867(d))empty.mails.push(d.id);if(discipleReadyV2821(d))empty.jobs.push(d.id);const life=lifeReadV2868(d);if(life.thanks?.state==='waiting'&&life.thanks.due<=discipleDayV2815())empty.thanks.push(d.id);if(life.trail?.state==='ready'&&!d.job)empty.trails.push(d.id);}
 for(const [i,t] of (player.sectTasks||[]).entries())if(!t.completed&&t.template?.type!=='combat'&&getSectTaskProgressInfo(t).ready)empty.tasks.push(i);
 const promotion=normalizePromotionV2768(player.sectPromotion);empty.promotion=!promotion.inherited&&player.level>=4&&(player.sectTotalContribution||0)>=1000&&promotion.tasksCompleted>=5;
 empty.total=empty.mails.length+empty.jobs.length+empty.thanks.length+empty.trails.length+empty.tasks.length+Number(empty.promotion);return empty;
}
let sectTodoCacheV2868={total:0};
function syncSectTodoV2868(){
 sectTodoCacheV2868=sectTodoReadV2868();const bar=document.getElementById('characterUtilityActions');if(!bar)return;let button=document.getElementById('sectTodoBtnV2868');if(!button){button=document.createElement('button');button.id='sectTodoBtnV2868';button.onclick=()=>showSectTodoV2868();bar.appendChild(button);}button.hidden=!player?.sect||player.sect==='散修'||isFactionDestroyed(player.sect);button.disabled=!sectCanManageV2866();button.textContent=sectTodoCacheV2868.total?`宗门待办 ${sectTodoCacheV2868.total}`:'宗门';button.setAttribute('aria-label',button.textContent);
}
function showSectTodoV2868(){
 if(!sectCanManageV2866())return;const t=sectTodoReadV2868(),esc=discipleEscV2815,names=new Map(sectMembersReadV2868().map(d=>[d.id,esc(d.name)]));let html='<section class="sect-board-v2866"><h3>宗门待办</h3>';
 for(const id of t.mails)html+=`<button class="choice-btn" onclick="showDiscipleEventV2867(${id})">${names.get(id)} · 途中来信</button>`;
 if(t.jobs.length)html+=`<button class="choice-btn" onclick="showDisciplesV2815()">${t.jobs.length} 项成果可领取</button>`;
 for(const id of t.thanks)html+=`<button class="choice-btn" onclick="showDiscipleLifeV2868(${id})">${names.get(id)} · 同门答谢已到</button>`;
 for(const id of t.trails)html+=`<button class="choice-btn" onclick="showDiscipleLifeV2868(${id})">${names.get(id)} · 古洞线索可出发</button>`;
 if(t.tasks.length)html+='<button class="choice-btn" onclick="showSectTasks()">宗门委托可以交付</button>';
 if(t.promotion)html+='<button class="choice-btn" onclick="showSectPromotionV2768()">宗主传承 · 考核已达标</button>';
 if(!t.total)html+='<p>宗内事务已妥当，可安心修行。</p>';
 html+='<button class="choice-btn" onclick="showSectOverviewV2866()">宗门总览</button></section>';showStory(html,[{text:'返回地图',action:'return_to_map'}]);
}
function drawSectTodoV2868(ctx,o){if(!sectTodoCacheV2868.total||!player?.sect)return;const own=(o.action==='faction_gate_v2806'&&o.factionName===player.sect)||(player.sect==='凌霄宗'&&(o.action==='sect'||o.buildingId==='main_hall'));if(!own)return;ctx.save();ctx.fillStyle='#263d31';ctx.fillRect(-42,-o.r-22,84,22);ctx.fillStyle='#f1d89b';ctx.font='12px Microsoft YaHei';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`待办 ${sectTodoCacheV2868.total}`,0,-o.r-11);ctx.restore();}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2868-sect-life.js']='28.68.38';
