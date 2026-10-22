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
function sectMembersReadV2868(){const data=player?.sectData,state=data?.managementV2815;const members=state?.rosters?.[player?.sect]?.members;return Array.isArray(members)?members.slice(0,12):[];}
function sectTodoReadV2868(){
 const empty={mails:[],jobs:[],thanks:[],trails:[],tasks:[],promotion:false,total:0};
 if(!player?.sect||player.sect==='散修'||isFactionDestroyed(player.sect))return empty;
 if(hasRank('长老'))for(const d of sectMembersReadV2868()){if(discipleEventReadyV2867(d))empty.mails.push(d.id);if(discipleReadyV2821(d))empty.jobs.push(d.id);const life=lifeReadV2868(d);if(life.thanks?.state==='waiting'&&life.thanks.due<=discipleDayV2815())empty.thanks.push(d.id);if(life.trail?.state==='ready'&&!d.job&&!warDiscipleBusyV286841(d.id))empty.trails.push(d.id);}
 for(const [i,t] of (player.sectTasks||[]).entries())if(!t.completed&&t.template?.type!=='combat'&&getSectTaskProgressInfo(t).ready)empty.tasks.push(i);
 empty.promotion=sectMasterRequirementsV2872().ready;
 empty.total=empty.mails.length+empty.jobs.length+empty.thanks.length+empty.trails.length+empty.tasks.length+Number(empty.promotion);return empty;
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
 if(t.tasks.length)html+='<button class="choice-btn" onclick="showSectTasks()">宗门委托可以交付</button>';
 if(t.promotion)html+='<button class="choice-btn" onclick="showSectPromotionV2768()">宗主传承 · 考核已达标</button>';
 if(!t.total)html+='<p>宗内事务已妥当，可安心修行。</p>';
 html+='<button class="choice-btn" onclick="showSectOverviewV2866()">宗门总览</button></section>';showStory(html,[{text:'返回地图',action:'return_to_map'}]);
}
let sectQuickContextV2870=null,sectQuickSerialV2870=0;
function sectQuickHtmlV2870(){
 const token=++sectQuickSerialV2870;sectQuickContextV2870={token,owner:player,sect:player.sect};
 const t=sectTodoReadV2868(),trip=tripYieldV286821().units>0,count=t.jobs.length+t.thanks.length+Number(trip);
 return `${count?`<button class="choice-btn" onclick="claimAllSectTodoV2870(${token})">一键领取成果与答谢 · ${count}项${trip?'（含游历，领取后结束本趟）':''}</button>`:''}${t.trails.length?`<button class="choice-btn" onclick="startAllSectTrailsV2870(${token})">派遣古洞寻踪 · ${t.trails.length}人（需确认）</button>`:''}`;
}
function sectQuickValidV2870(token){return token==null||(sectQuickContextV2870?.token===token&&sectQuickContextV2870.owner===player&&sectQuickContextV2870.sect===player.sect&&!document.getElementById('storyPanel')?.classList.contains('hidden'));}
function claimAllSectTodoV2870(token){
 if(!sectQuickValidV2870(token))return false;
 if(!sectCanManageV2866())return false;
 const t=sectTodoReadV2868(),trip=tripYieldV286821().units>0;
 if(!t.jobs.length&&!t.thanks.length&&!trip)return false;
 let jobs=0,thanks=0,claimedTrip=false;
 const ok=commitMiniWeaveV286840(()=>{
  if(t.jobs.length&&discipleAllowedV2815())jobs=settleDisciplesV2821(undefined,true)||0;
  if(discipleAllowedV2815())for(const d of sectMembersReadV2868()){
   const life=lifeReadV2868(d);if(life.thanks?.state!=='waiting'||life.thanks.due>discipleDayV2815())continue;
   life.thanks.state='done';d.lifeV2868=life;lifeAddV2868(d,'thanks');player.inventory.push('小还丹','小还丹');player.materials['灵草']=(player.materials['灵草']||0)+3;onCollectMaterial?.('灵草',3);thanks++;
  }
  if(trip){claimedTrip=claimTripV286821(true);if(!claimedTrip)throw Error('trip changed');}
 });
 if(!ok)return false;
 updateStats();syncSectTodoV2868();showSectTodoV2868();
 if(ok)showFloatingText(`已领取：弟子成果${jobs}项、同门答谢${thanks}份${claimedTrip?'、游历收获':''}`,'#69f0ae');
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
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2868-sect-life.js']='28.68.51';


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
 return {rewardRealmV2870:Math.max(0,Math.min(16,Math.floor(Number(player.level)||0))),events:shuffled([0,1,2,3]).slice(0,2),offers:[shuffled([0,1,2,3,4,5]).slice(0,3),shuffled([0,1,2,3,4,5]).slice(0,3)],boons:[],pending:false,treasureV2871:Math.floor(Math.random()*4)};
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
 let html=`<section class="sect-board-v2866 loop-board-v286840"><h3>万象迷阵 · 第${floor+1}/3层</h3>${miniWeaveTextV286840(c)}<p>随机事件与备选祝福已经保存；刷新不会重抽。可暂离补给。</p>`;
 if(w.pending){html+='<h4>残阵赠礼 · 三选一</h4>';html+=w.offers[floor].map(i=>`<article><h4>${MINI_BOONS_V286840[i].name}</h4><p>${MINI_BOONS_V286840[i].desc}</p><button class="choice-btn" onclick="chooseMiniBoonV286840(${c.id},${floor},${i})">选择此祝福</button></article>`).join('');}
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
function sectMasterPlanV2872(kind){
 const r=SECT_MASTER_COUNCIL_V2872,state=normalizeSectMasterV2872(player.sectMasterV2872,player.sect),day=discipleDayV2815(),wait=Math.max(0,state.nextDay-day);
 const members=sectMembersReadV2868().filter(d=>!d.job&&!warDiscipleBusyV286841(d.id)&&Number.isFinite(d.level)&&d.level>=1&&d.level<10),gain=Math.max(0,Math.min(r.prosperityGain,r.prosperityCap-(Number(player.sectData?.prosperity)||20)));
 if(!['repair','lesson'].includes(kind))return null;
 const contribution=kind==='repair'?r.repairContribution:members.length*r.lessonContribution,gold=kind==='repair'?r.repairGold:0;
 return {state,day,wait,members,gain,contribution,gold,ok:sectMasterAllowedV2872()&&!wait&&(kind==='repair'?gain>0:members.length>0)&&(player.sectContribution||0)>=contribution&&player.gold>=gold};
}
function showSectMasterV2872(){
 if(!sectMasterAllowedV2872())return;
 const repair=sectMasterPlanV2872('repair'),lesson=sectMasterPlanV2872('lesson'),r=SECT_MASTER_COUNCIL_V2872,token=++sectMasterViewSerialV2872;
 sectMasterViewV2872={token,owner:player,sect:player.sect};
 showStory(`<section class="sect-board-v2866"><h3 id="sectMasterTitleV2872">${discipleEscV2815(player.sect)} · 宗主议事</h3><p>可用贡献 ${player.sectContribution||0} · 灵石 ${player.gold} · 繁荣度 ${player.sectData?.prosperity||20}</p><p>两项议事共用${r.cooldown}个游戏日冷却，每次选择一项。${repair.wait?`还需${repair.wait}个游戏日。`:'本次可以议事。'}消费不会降低累计贡献或职位。</p><article><h4>整饬山门</h4><p>支出${repair.contribution}贡献、${repair.gold}灵石；繁荣度+${repair.gain}（本项提升至多${r.prosperityCap}，更高繁荣度保留）。繁荣度参与原有入侵概率与仙门求援判定。</p><button class="choice-btn" onclick="executeSectMasterV2872('repair',${token})" ${repair.ok?'':'disabled'}>整饬山门 · 确认费用</button></article><article><h4>亲授门人</h4><p>每名${r.lessonContribution}贡献，本次${lesson.members.length}名，共${lesson.contribution}贡献；空闲且未满级弟子等级+1（最高10），忠诚+2。正在派遣或随军者不参与。</p><p>${lesson.members.map(d=>`${discipleEscV2815(d.name)} Lv.${d.level}→${d.level+1}`).join('、')||'暂无符合条件的弟子'}</p><button class="choice-btn" onclick="executeSectMasterV2872('lesson',${token})" ${lesson.ok?'':'disabled'}>亲授门人 · 确认名单</button></article></section>`,[{text:'返回宗门',action:'sect_hall'}]);
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
  if(kind==='repair'){player.sectData.prosperity=(Number(player.sectData.prosperity)||20)+plan.gain;state.repairs++;}
  else {for(const d of plan.members){d.level++;lifeCompletedV2868(d,{type:'train'});const traits=discipleTraitsV2867(d);d.traitsV2867={...traits,loyalty:Math.min(100,traits.loyalty+2)};}state.lessons++;}
  player.sectMasterV2872=state;
 });
 if(ok){updateStats();showSectMasterV2872();}return ok;
}
