// V28.47 · 三界行旅：剧情确认、纪事回看、可选游历与安全续行。
const JOURNEYS_V2838=[
 {id:'journey_01',level:6,title:'一 · 北雪归灯',place:'北域 · 断雪驿',enemy:'噬灯雪魇',requires:'main_16',
  desc:'炼虚游历。三万年战事留下的不是一张战报，而是一盏盏等待归人的灯。',
  opening:[['驿站守灯人','雪已封山七日。有人说那些灯会引来魔物，叫我全熄了。可渡口还有人没回来。'],['苏晚晴','她将药包放进你的行囊：“先把人带回来。伤可以慢慢养，名字不能只留在碑上。”'],['你','雪中有一道吞噬火光的影子。你循着最后一盏灯踏出驿门，先护住归路，再追查它的来处。']],
  ending:[['驿站守灯人','“少了一个……”老人逐一数过归来的人。最年轻的护卫把一盏破灯交给他，灯芯还温着。'],['你','你在雪下找到护卫的名牌。众人等待你决定：让他的名字留在这里，还是将遗物送回南域？']],
  choices:[['lamp','留名守灯'],['home','送还遗物']],
  outcomes:{lamp:'石碑多了一行名字。守灯人约定，只要驿站还在，这盏灯便不会熄灭。',home:'你托归乡商队送回遗物。数日后，一封短笺从南域寄来：知道他曾救人，家人便有了等候的答案。'}},
 {id:'journey_02',level:7,title:'二 · 万宗一桥',place:'人族群峰 · 悬桥',enemy:'裂桥怨灵',requires:'journey_01',
  desc:'合体游历。数家人族宗门争夺一座灵桥，桥下的难民却只想平安渡河。',
  opening:[['青云使者','“先让我宗伤员过桥。”另一位掌事已拔剑，两边都拿出了旧日的盟约。'],['顾承渊','“他们争的是谁先低头。你若只赢一场，明日仍会再争。”他把几家宗门的渡册摊在石上。'],['你','争吵激起桥下多年积聚的怨气。旧阵断裂，裂桥怨灵攀上桥面；在谈规矩之前，必须先守住桥。']],
  ending:[['顾承渊','怨灵散去，桥还立着。掌事们终于收剑，但谁都不肯先说方才错在哪里。'],['你','你可以安排各宗轮值护桥，也可以建立不问宗籍的渡册。这份约定不改变任何宗门的战力，却会改变过桥的人。']],
  choices:[['watch','各宗轮值护桥'],['register','不问宗籍通行']],
  outcomes:{watch:'各宗按月派弟子护桥。顾承渊第一个写下名字，将公约交给过桥的人监督。',register:'伤者与老幼优先的渡册挂上桥头。第一位签名的掌事没有写宗号，只写了自己的名字。'}},
 {id:'journey_03',level:8,title:'三 · 焚营余火',place:'魔域 · 灰烬营地',enemy:'吞烬魔傀',requires:'journey_02',
  desc:'大乘游历。姬红绫带来一份停火信。营地里藏着的答案，远比阵营二字复杂。',
  opening:[['姬红绫','“先收剑。”她指着灰烬里蜷缩的身影，“他们是被征来的药工，营地败了，也没人肯带走。”'],['魔族药工','药工不敢抬头，只递出烧损的册子。册页记满试验日期，最后一页被人撕去了一半。'],['你','营地深处的魔傀仍在执行焚毁命令。救人的路只有一条：让它先停下来。']],
  ending:[['姬红绫','“你看见的是他们做过什么，不是他们生来是什么。”她将最后一位药工扶出火场。'],['你','册子记录着残酷的旧试验。你决定如何让它被看见：交给前线共同核查，或先安置证人再公开。']],
  choices:[['inquiry','交三方共同核查'],['witness','先保护营地证人']],
  outcomes:{inquiry:'册子的副本送往三方营地。谁也无法再独占解释，但对峙中的人第一次坐到了同一张案前。',witness:'证人隐去姓名，在安全之处写下证言。姬红绫留了一盏灯，等每一个人把话说完。'}},
 {id:'journey_04',level:9,title:'四 · 雷海问舟',place:'东域 · 雷海旧渡',enemy:'雷海执念',requires:'journey_03',
  desc:'渡劫游历。飞升之前，先回答一个与强弱无关的问题。本章不会替代真正的飞升天劫。',
  opening:[['清玄真人','“渡劫是你的路，不是别人替你证明的功课。”他将一块普通船木交给你，木上留着补过的钉孔。'],['你','渡口船夫修了三十年的船，仍相信明年会有平静的海。他问你成仙后，还记不记得凡人的渡口。'],['雷海执念','雷云借你的影子成形，反复问着同一句话：“若救一人会误你飞升，你还停不停舟？”']],
  ending:[['你','雷影消散。没有人告诉你哪一句答案才对，真正的飞升之门仍要以渡劫圆满与天劫胜利开启。'],['清玄真人','“别把今日的话当作功德。”他看向海面，“等你有能力做的时候，再记得它。”']],
  choices:[['return','留下归来之约'],['ferry','立下守渡之约']],
  outcomes:{return:'你把船木带在身边，约定每次远行后都来看一眼渡口。成仙不是忘记来路的理由。',ferry:'你托人修好渡船，留下救急的办法。船夫笑道：“比起等仙人显灵，这个踏实。”'}},
 {id:'journey_05',level:11,title:'五 · 云阙无名册',place:'仙域 · 云阙下城',enemy:'封册灵卫',requires:'main_17',
  desc:'天仙游历。仙阙的战功册上，许多名字被写成了“无名”。',
  opening:[['仙阙录事','录事将厚册合上：“无军籍者不记功。这是旧例。”你看见页缝里夹着一封退回的家书。'],['你','城下修补云堤的人大多来自人族，他们抵过魔潮，却没有资格在册上留下姓名。'],['云堤匠人','“不求赏。”匠人把缺了一角的工牌交给你，“我们只想后人知道，这堤是谁修的。”封册灵卫已封锁档案台。']],
  ending:[['仙阙录事','灵卫退下，录事沉默着打开空白页。他问你，要按战功补录，还是将所有守堤者一并录入。'],['你','你想起凡间一盏等待归人的灯。名册不能使逝者复生，却能让后来者知道曾有人站在这里。']],
  choices:[['deeds','核实事迹逐人补录'],['names','先录姓名再补事迹']],
  outcomes:{deeds:'你与录事访遍守堤者，逐一核对。第一页末写着：未核实者继续查访，不再抹去。',names:'空白页先写上姓名。事迹暂缺的地方留着空格，等待家人、同伴和后来者慢慢补全。'}},
 {id:'journey_06',level:12,title:'六 · 碎星停战书',place:'西域 · 碎星前线',enemy:'噬阵星兽',requires:'journey_05',
  desc:'金仙游历。三方都需要一夜休战，但谁也不愿第一个熄灭阵旗。',
  opening:[['前线传令使','三方阵旗同时失去灵光。星兽在地下吞噬阵基，继续交战会把整片营地拖进裂隙。'],['姬红绫','“我能约束这边一夜。你说服另两边。”她没有许诺永久太平，只先保证今夜伤员能走。'],['你','暂时的停战书还没写完，噬阵星兽已破土而出。你必须守住唯一的撤离口。']],
  ending:[['前线传令使','伤员都越过了撤离线。一位仙族将领第一次接过魔族药工送来的绷带，没有追问出处。'],['你','停战将于天明结束。你可以留下共同救伤的通道，也可以先约定今后交换失踪者名册。']],
  choices:[['healers','保留共同救伤通道'],['missing','交换失踪者名册']],
  outcomes:{healers:'营地间升起一面无宗徽的白旗。战事没有结束，但旗下一小段路约定不再伏击救伤者。',missing:'三份名册被抄成九份，各方各留一套。传令使第一次带着找人的消息，而不是新的伤亡数。'}},
 {id:'journey_07',level:13,title:'七 · 太乙照心台',place:'仙域 · 照心台',enemy:'照心旧影',requires:'journey_06',
  desc:'太乙金仙游历。照心台不问你赢过谁，只问你是否肯直视自己的选择。',
  opening:[['照心台守者','“这里没有更强的功法。”守者指向台中清水，“只有你不肯再看的事。”'],['你','水中浮现雪驿、石桥、灰营与云堤。你救过人，也有来不及伸手的时候。'],['照心旧影','影子握着与你相同的剑：“承认救不了所有人，和从此不救任何人，是两回事。”']],
  ending:[['你','旧影退入水中。台上没有胜者的赞声，只有你自己的呼吸。那些选择都还在，并不因境界增长而消失。'],['照心台守者','“把悔意写下来也好，带着往前走也好。别把它交给下一次迁怒。”']],
  choices:[['record','记下未尽之事'],['teach','将经历讲给后辈']],
  outcomes:{record:'你写下那些未能做到的事，只写事实，不为自己辩解。这页文字留在行囊最里层。',teach:'后辈听见的故事没有百战百胜。你告诉他们如何求援、如何退让，以及什么时候必须站出来。'}},
 {id:'journey_08',level:14,title:'八 · 大罗共归途',place:'三界交界 · 旧关',enemy:'裂界残响',requires:'journey_07',
  desc:'大罗金仙游历。夜无疆立在旧关尽头。你们都能毁掉这座关，却第一次选择先修好它。',
  opening:[['夜无疆','“三万年，换了无数旗号，这道裂口还在。”他的气息随你的成长愈加强盛，却仍被半圣本源的裂痕束缚。'],['你','你们没有结盟，也没有拔剑。关下的归人正穿过残阵，裂界残响已追上最后一队车马。'],['夜无疆','“我封上方，你守归路。之后的账，之后再算。”他说完，转身踏入风中。']],
  ending:[['夜无疆','“我的路止于半圣，你的未必。”他看了看重新亮起的关灯，“别到那时，只记得自己有多强。”'],['你','车队已经离开。你可以把这次默契写进公开纪事，也可以只在私人行记里留下他的名字。']],
  choices:[['public','如实记入三界纪事'],['private','留在私人行记']],
  outcomes:{public:'纪事写明了各方所做的事，没有把敌人写成朋友，也没有抹去他曾出手护住归路的事实。',private:'你的行记留下一句：旧关有灯，同行一程。下次相逢仍可能交手，但这一次不会被遗忘。'}}
];
for(const j of JOURNEYS_V2838){
 const task={id:j.id,type:'journey',title:j.title,desc:j.desc,unlockRealm:j.level,unlockCondition:{questCompleted:[j.requires]},repeatable:false,
  steps:[{text:'听取来意 · '+j.place,action:j.id+'_open'},{text:'击败'+j.enemy,action:'journey_battle_v2838'},{text:'战后相谈',action:j.id+'_end'},{text:'决定此行的约定',action:'choice',options:j.choices}],
  rewards:{gold:800+j.level*180,exp:180+j.level*45,items:['大还丹','聚灵丹']}};
 SIDE_TASKS.push(task);ALL_TASKS[task.id]=task;
}
const SCENES_V2838={
 walk_to_sect:[['清玄真人','“上了这阶，不代表从此便高人一等。”他在山门前停下，等你把气喘匀。'],['你','云海在脚下翻涌。你看见扫阶弟子袖口磨出的毛边，也看见远处一盏未熄的夜灯。'],['清玄真人','“路很长。先学会自己走，再谈走到哪里。”古钟响起，你迈过凌霄山门。']],
 talk_suwanqing:[['苏晚晴','“好久不见。没想到，你也走上了仙途。”她先叫出你的名字，随后才低下眼。'],['你','石桥的风把许多旧话吹到唇边。你却只问：“这些年，还好吗？”'],['苏晚晴','“有时好，有时不好。”她没有再用一句平安带过。钟声催人离开，你们约好下次慢慢说。']],
 listen_confession:[['苏晚晴','“当年我怕留下，就再也走不了了。可我走了以后，才知道有些事不是离开就能变轻。”'],['你','旧木牌放在你们之间。雨水沿屋檐落下，你听她说完，没有替她辩解，也没有立刻替自己决定。'],['苏晚晴','“我不是要你现在原谅。只是这一次，我想把话说清楚。”你终于可以按自己的心意回应。']],
 war_archive_v2823:[['前线录事','“三万年。”他将断裂的书脊压平，“一册写不下，所以只能分代重抄。”'],['清玄真人','仙族底蕴深厚，却一直无法彻底压住魔族的超级天才夜无疆。如今他自斩重修，旧日的代价仍留在本源里。'],['你','卷末没有凯歌，只有补给与失踪名册。你收起卷宗，决定先守住眼前这条灵脉。']],
 saint_limit_v2823:[['夜无疆','“别等我替你走完最后一步。”他的气息已抵半圣极处，本源裂痕却像一扇永远无法开启的门。'],['你','他仍会随你成长，直至准圣圆满；这道天堑不会因你的境界变化而凭空消失。'],['夜无疆','“赢过我，只能证明你赢了。走过我走不到的地方，才算你的答案。”']]
};
function journeyIntroductionV2838(){
 const esc=discipleEscV2815;
 return `<section class="main-overview-v2822"><h3>三界游历 · 八章</h3><p>炼虚至渡劫、天仙至大罗金仙逐章开放。游历为可选篇章，不替代主线与飞升。战斗失败保留已读步骤，可补给后重试；章节奖励仅发一次。</p><details><summary>查看开放条件</summary>${JOURNEYS_V2838.map(j=>`<p>${esc(j.title)}：${esc(CULTIVATION_REALMS[j.level].name)}初期，完成「${esc(getTaskData(j.requires)?.title||j.requires)}」</p>`).join('')}</details></section>`;
}
function scenePagesV2838(id,action){
 const j=JOURNEYS_V2838.find(x=>x.id===id);
 if(j){if(action===id+'_open')return j.opening;if(action===id+'_end')return j.ending;
  if(action==='choice'){const pick=player.tasks?.choices?.[id];return [['此行约定',j.outcomes[pick]||'尚未做出选择。']];}}
 if(SCENES_V2838[action])return SCENES_V2838[action];
 const [title,body]=getTaskNarrative(action);return [[title,body]];
}
let sceneSessionV2838=null;
function closeSceneV2838(returnToTasks=false){
 const s=sceneSessionV2838;sceneSessionV2838=null;document.getElementById('sceneV2838')?.remove();
 FLAT_WORLD.keys={};
 if(s?.opener?.isConnected)s.opener.focus?.();
 if(returnToTasks&&s?.owner===player&&gameState==='exploring')showTaskPanel(s.replay?'journal':getTaskData(s.id)?.type||'main');
}
function validSceneV2838(s){
 if(!s||s!==sceneSessionV2838||s.owner!==player||gameState!=='exploring'||player.breakthrough?.isAnimating)return false;
 if(s.replay)return canReplaySceneV2838(s.id,s.action);
 const i=getTaskInstance(s.id);return i===s.instance&&!i.completed&&!i.failed&&i.currentStep===s.step&&getCurrentTaskStep(s.id)?.action===s.action;
}
function openTaskSceneV2838(id,action=null,replay=false){
 if(!taskInteractionAllowedV2822())return;
 const i=getTaskInstance(id),step=getCurrentTaskStep(id),task=getTaskData(id);if(!task)return;
 if(!replay){if(!i||i.completed||i.failed||!step||!isNarrativeActionV2838(id,step.action))return;action=step.action;}
 else if(!canReplaySceneV2838(id,action))return;
 const opener=document.activeElement;closeSceneV2838();closeTaskPanel();stopNavigationV2830();FLAT_WORLD.keys={};FLAT_WORLD.target=null;
 sceneSessionV2838={owner:player,id,action,instance:i,step:i?.currentStep||0,replay,page:0,pages:scenePagesV2838(id,action),opener};
 const el=document.createElement('div');el.id='sceneV2838';el.className='journey-overlay-v2838';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','sceneTitleV2838');
 el.innerHTML='<section class="scene-card-v2838"><header><div><small id="sceneChapterV2838"></small><h2 id="sceneTitleV2838"></h2></div><button type="button" data-scene="close" aria-label="暂时收起剧情">×</button></header><div class="scene-landscape-v2838" aria-hidden="true"></div><div class="scene-reading-v2838"><span id="sceneSpeakerV2838"></span><p id="sceneTextV2838"></p></div><footer><small id="scenePageV2838" aria-live="polite"></small><div><button type="button" data-scene="prev">上一页</button><button type="button" class="primary-v2838" data-scene="next">下一页</button></div></footer></section>';
 el.onclick=e=>{const a=e.target.closest('[data-scene]')?.dataset.scene;if(a==='close')closeSceneV2838(true);if(a==='prev')advanceSceneV2838(-1);if(a==='next')advanceSceneV2838(1);};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeSceneV2838(true);}else trapJourneyFocusV2838(e,el);};
 document.body.appendChild(el);renderSceneV2838();el.querySelector('[data-scene="next"]')?.focus();
}
function trapJourneyFocusV2838(e,el){
 if(e.key!=='Tab')return;const buttons=[...el.querySelectorAll('button:not([disabled])')];if(!buttons.length)return;
 const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}
function renderSceneV2838(){
 const s=sceneSessionV2838;if(!validSceneV2838(s)){closeSceneV2838();return;}
 const el=document.getElementById('sceneV2838');if(!el)return;const [speaker,text]=s.pages[s.page];
 document.getElementById('sceneChapterV2838').textContent=s.replay?'修行纪事 · 回看不发放奖励':'仙途 · '+(getTaskData(s.id)?.type==='journey'?'三界游历':'剧情');
 document.getElementById('sceneTitleV2838').textContent=getTaskData(s.id).title;
 document.getElementById('sceneSpeakerV2838').textContent=speaker;document.getElementById('sceneTextV2838').textContent=text;
 document.getElementById('scenePageV2838').textContent=`${s.page+1} / ${s.pages.length} · ${s.replay?'已发生的故事':'读完确认后推进'}`;
 const prev=el.querySelector('[data-scene="prev"]'),next=el.querySelector('[data-scene="next"]');prev.disabled=s.page===0;
 next.textContent=s.page<s.pages.length-1?'下一页':s.replay?'回到纪事':'读完 · 确认继续';
 el.querySelector('.scene-reading-v2838')?.scrollTo?.(0,0);
}
function advanceSceneV2838(direction){
 const s=sceneSessionV2838;if(!validSceneV2838(s)){closeSceneV2838();return;}
 if(direction<0){s.page=Math.max(0,s.page-1);renderSceneV2838();return;}
 if(s.page<s.pages.length-1){s.page++;renderSceneV2838();return;}
 if(s.replay){closeSceneV2838(true);return;}
 // Clear the session before committing: double taps cannot complete another step.
 closeSceneV2838();
 if(completeTaskStep(s.id,s.action)){rememberSceneV2838(s.id,s.action);autoSave();showTaskPanel(getTaskData(s.id)?.type||'main');}
}
function rememberSceneV2838(id,action){
 const key=id+':'+action;const entries=Array.isArray(player.journalV2838)?player.journalV2838.filter(x=>x&&typeof x.id==='string'&&typeof x.action==='string'&&x.id+':'+x.action!==key):[];
 entries.push({id,action,day:Math.max(0,player.worldTime?.totalDays||0)});player.journalV2838=entries.slice(-160);
}
function canReplaySceneV2838(id,action){
 const task=getTaskData(id),i=getTaskInstance(id),n=task?.steps.findIndex(x=>x.action===action);if(n==null||n<0)return false;
 const passed=i?.completed||player.tasks.completed.includes(id)||(i&&n<i.currentStep);if(!passed)return false;
 return action==='choice'?!!JOURNEYS_V2838.find(j=>j.id===id)&&!!player.tasks.choices[id]:isNarrativeActionV2838(id,action);
}
function isNarrativeActionV2838(id,action){
 if(['learn_high_skill','breakthrough_realm','cultivate_to_full','choice','collect_materials','journey_battle_v2838'].includes(action))return false;
 return !!SCENES_V2838[action]||action===id+'_open'||action===id+'_end'||getTaskNarrative(action)[0]!=='📜 任务推进';
}
function journalEntriesV2838(){
 ensureTaskState();const out=[],seen=new Set();
 const push=e=>{const key=e.id+':'+e.action;if(!seen.has(key)&&canReplaySceneV2838(e.id,e.action)){seen.add(key);out.push(e);}};
 (Array.isArray(player.journalV2838)?player.journalV2838:[]).slice().reverse().forEach(e=>{if(e&&typeof e.id==='string'&&typeof e.action==='string')push(e);});
 // Earlier saves may predate the journal; derive read-only recaps from completed steps.
 Object.values(ALL_TASKS).slice().reverse().forEach(t=>t.steps.slice().reverse().forEach(st=>push({id:t.id,action:st.action})));
 return out;
}
function renderJournalV2838(container){
 const esc=discipleEscV2815,entries=journalEntriesV2838();
 container.innerHTML='<section class="main-overview-v2822"><h3>修行纪事</h3><p>只显示已读或旧存档已完成的剧情。回看不会改变分支，也不会再发奖励。</p></section>'+ (entries.length?entries.map(e=>{
  const task=getTaskData(e.id),step=task.steps.find(s=>s.action===e.action);
  return `<article class="task-card"><strong>${esc(task.title)}</strong><p>${esc(step.text)}${e.day!=null?' · 第 '+Math.floor(e.day)+' 日':''}</p><button class="task-action" onclick="openTaskSceneV2838('${e.id}','${e.action}',true)">回看此段</button></article>`;
 }).join(''):'<p class="task-empty">读完第一段剧情后，它会留在这里。</p>');
}
const choiceBeforeV2838=onChoiceMade;
onChoiceMade=function(id,option){
 const j=JOURNEYS_V2838.find(x=>x.id===id),i=getTaskInstance(id),valid=j&&i&&!i.completed&&getCurrentTaskStep(id)?.action==='choice'&&j.choices.some(c=>c[0]===option);
 const result=choiceBeforeV2838.apply(this,arguments);
 if(valid&&i.completed&&player.tasks.choices[id]===option){rememberSceneV2838(id,'choice');autoSave();openTaskSceneV2838(id,'choice',true);}
 return result;
};
function journeyEnemyV2838(j){
 const lv=j.level,hp=300+lv*60;return balanceEnemyV2802({name:j.enemy,hp,maxHp:hp,atk:25+lv*7,def:10+lv*4,gold:80+lv*20,exp:80+lv*25,_realmLevel:lv,_realmPhase:0,_taskId:j.id,_taskAction:'journey_battle_v2838',_isTaskBattle:true});
}
function launchJourneyBattleV2838(id){
 const j=JOURNEYS_V2838.find(x=>x.id===id),i=getTaskInstance(id);if(!j||!i||i.completed||i.failed||getCurrentTaskStep(id)?.action!=='journey_battle_v2838'||!taskInteractionAllowedV2822())return;
 document.getElementById('journeyPrepareV2838')?.remove();closeTaskPanel();stopNavigationV2830();FLAT_WORLD.keys={};FLAT_WORLD.target=null;
 const enemy=journeyEnemyV2838(j),owner=player,step=i.currentStep,el=document.createElement('div');el.id='journeyPrepareV2838';el.className='journey-overlay-v2838';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','journeyEnemyV2838');const esc=discipleEscV2815;
 el.innerHTML=`<section class="journey-prepare-v2838"><small>${esc(j.place)}</small><h2 id="journeyEnemyV2838">${esc(j.enemy)}</h2><p>${esc(CULTIVATION_REALMS[j.level].name)}初期 · 气血 ${enemy.maxHp} · 攻击 ${enemy.atk} · 防御 ${enemy.def}</p><div class="journey-vitals-v2838"><span>气血 <b>${Math.floor(player.hp)} / ${getMaxHp()}</b></span><span>灵力 <b>${Math.floor(player.mp)} / ${getMaxMp()}</b></span></div><p>挑战前请检查装备、已装配招式与丹药。获胜推进本章，失败扣除身上灵石的20%，已读剧情保留。</p><button type="button" data-journey="fight" class="primary-v2838" ${player.hp<=1?'disabled':''}>准备好了 · 开始挑战</button><button type="button" data-journey="back">先补给 · 返回任务</button></section>`;
 el.onclick=e=>{const act=e.target.closest('[data-journey]')?.dataset.journey;if(!act)return;if(owner!==player){el.remove();return;}if(act==='back'){el.remove();showTaskPanel('journey');return;}
  if(act==='fight'&&i===getTaskInstance(id)&&i.currentStep===step&&!i.completed&&!i.failed&&taskInteractionAllowedV2822()&&player.hp>1){el.remove();startCombat(enemy,false,false,null);}};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){el.remove();if(owner===player)showTaskPanel('journey');}else trapJourneyFocusV2838(e,el);};document.body.appendChild(el);el.querySelector('[data-journey="back"]')?.focus();
}
// Compact battle receipt; rewards have already been settled by the core.
let lastBattleV2838=null;
function recordBattleSummaryV2838(enemy,before){
 if(enemy.tournamentFight){lastBattleV2838=null;return;}
 lastBattleV2838={owner:player,name:enemy.name,gold:Math.max(0,player.gold-before.gold),exp:Math.max(0,player.exp-before.exp),taskType:getTaskData(enemy._taskId)?.type||'main'};
}
function showAfterBattleV2838(owner){
 const r=lastBattleV2838;lastBattleV2838=null;if(!r||r.owner!==owner||player!==owner||gameState!=='exploring')return;
 document.getElementById('afterBattleV2838')?.remove();const el=document.createElement('aside');el.id='afterBattleV2838';el.className='after-battle-v2838';el.setAttribute('aria-label','战后简报');const esc=discipleEscV2815;
 el.innerHTML=`<div><strong>战胜 · ${esc(r.name)}</strong><button type="button" data-after="close" aria-label="收起战后简报">×</button></div><p>灵石 +${r.gold}　修为 +${r.exp}<small>含本战触发的任务奖励</small></p><p>气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p><div><button type="button" data-after="tasks">继续任务</button><button type="button" data-after="rest">寻找补给</button></div>`;
 el.onclick=e=>{const act=e.target.closest('[data-after]')?.dataset.after;if(!act)return;el.remove();if(player!==owner||gameState!=='exploring'||player.breakthrough?.isAnimating)return;if(act==='tasks')showTaskPanel(r.taskType);if(act==='rest'){showScrollMapV2831();nearestScrollRestV2837();}};document.body.appendChild(el);
}
// New-game checkpoint is independent of the rolling autosave backup.
const PREVIOUS_SAVE_V2838='xiantu_save_previous_character';
function saveChangeAllowedV2838(){return gameState!=='combat'&&gameState!=='combat-ending'&&!player?.breakthrough?.isAnimating;}
function prepareNewGameV2838(){
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破，再重新入世。');return false;}
 try{
  const live=!document.getElementById('gameScreen')?.classList.contains('hidden')&&gameState!=='start';
  let raw=live&&!player.testAccount999?JSON.stringify(createSaveDataV2768()):(localStorage.getItem(SAVE_KEY)||localStorage.getItem(SAVE_BACKUP_KEY));
  try{if(raw)parseSaveV2768(raw);}catch(_){raw=localStorage.getItem(SAVE_BACKUP_KEY);if(raw)parseSaveV2768(raw);}
  if(!raw)return true;
  if(!confirm('重新入世将创建新角色。当前有效角色会保留在“存档管理 → 上一位角色”，该位置只保留最近一位。是否继续？'))return false;
  localStorage.setItem(PREVIOUS_SAVE_V2838,raw);return true;
 }catch(e){alert('未开启新角色：旧记录无法保全，请先导出存档。'+e.message);return false;}
}
function restorePreviousV2838(){
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破。');return;}
 try{const raw=localStorage.getItem(PREVIOUS_SAVE_V2838);if(!raw)throw Error('尚无上一位角色');const data=parseSaveV2768(raw);
  if(!confirm(`恢复上一位角色「${data.player.name||'无名'}」？当前主档将成为滚动备份。`))return;
  writeSaveV2768(raw);document.getElementById('saveManagerV2768')?.remove();loadAndStart();
 }catch(e){alert('未恢复：'+e.message);}
}
function exportPreviousV2838(){
 try{const raw=localStorage.getItem(PREVIOUS_SAVE_V2838);if(!raw)throw Error('尚无上一位角色');parseSaveV2768(raw);
  const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='xiantu-previous-character.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){alert('导出失败：'+e.message);}
}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2838-journey.js']='28.68';
