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
 const task={id:j.id,type:'main',title:j.title.replace(/^[^·]+·\s*/,''),desc:j.desc.replace('游历。','主线。'),placeV286823:j.place,unlockRealm:j.level,unlockCondition:{questCompleted:[j.requires]},repeatable:false,
  steps:[{text:'听取来意 · '+j.place,action:j.id+'_open'},{text:'击败'+j.enemy,action:'journey_battle_v2838'},{text:'战后相谈',action:j.id+'_end'},{text:'决定此行的约定',action:'choice',options:j.choices}],
  rewards:{gold:800+j.level*180,exp:180+j.level*45,items:['大还丹','聚灵丹']}};
 ALL_TASKS[task.id]=task;
}
// Keep all historical IDs and four-step indices: old journeys become main chapters.
MAIN_TASKS.splice(16,0,...JOURNEYS_V2838.slice(0,4).map(j=>ALL_TASKS[j.id]));
MAIN_TASKS.splice(21,0,...JOURNEYS_V2838.slice(4).map(j=>ALL_TASKS[j.id]));
MAIN_TASKS.forEach((t,i)=>{t.nextTask=MAIN_TASKS[i+1]?.id||null;});
function migrateMainV286823(t){
 if(t.mainSchemaV286823===1)return;
 const reached=id=>t.completed.includes(id)||!!t.active[id];
 // Snapshot only once, before new progression; do not revoke already-earned old gates.
 t.legacyMainV286823=[];
 if(t.completed.includes('main_16')||reached('main_17'))t.legacyMainV286823.push('main_17');
 if(reached('main_17')||reached('main_18')||reached('main_19'))t.legacyMainV286823.push('main_18');
 t.mainSchemaV286823=1;
}
function mainPredecessorMetV286823(task){
 const i=MAIN_TASKS.findIndex(t=>t.id===task.id);
 return i<=0||player.tasks.completed.includes(MAIN_TASKS[i-1].id)||player.tasks.legacyMainV286823?.includes(task.id);
}
function preferredMainV286823(list){
 return list.find(t=>t.type==='main'&&player.tasks.active[t.id]&&!player.tasks.active[t.id].completed&&!player.tasks.active[t.id].failed)
  ||list.find(t=>player.tasks.legacyMainV286823?.includes(t.id)&&getTaskStatus(t.id)===TASK_STATUS.AVAILABLE)||list[0];
}
const INVESTIGATIONS_V286823=[
 {clues:[['查验熄灭的灯芯','灯油未尽，灯芯却冻成空壳。雪魇吞的是灯上寄托的魂念，单纯添油只会引它再来。'],['询问最后一班护卫','护卫记得雪影绕开了铜铃。铜声可以护住归队的人；碎裂的旧灯罩则能诱它露出心核。']],plans:['让护卫摇铃护路','用破灯罩引出心核'],hook:'雪魇腹中的渡牌印着群峰桥号：失踪者曾走过同一条运送路线。'},
 {clues:[['核对两宗渡册','两份渡册都把散修伤员划去。争执并非桥窄，而是没有宗籍的人从未被算进通行人数。'],['检查断桥阵钉','怨气聚在被拔掉的阵钉下。重新立钉能稳桥；循着缺口引开怨灵，则能击中它凝结的怨核。']],plans:['请各宗共同稳桥','沿缺钉追出怨核'],hook:'渡册中一批药工没有抵达目的地，最后的印记来自魔域灰营。'},
 {clues:[['辨认焚毁指令','残符上的命令不是迎敌，而是抹去试验记录。魔傀正在烧掉自己也曾被当作试材的证据。'],['搜寻药工地窖','药工留下两份图：隔火沟可护住撤离队，冷却阀能让魔傀护甲短暂开裂。人和证据都还有机会带走。']],plans:['沿隔火沟护送药工','切断魔傀冷却阀'],hook:'账册反复出现“渡海转运”。最后一船的日期，正是雷海封渡的那一夜。'},
 {clues:[['翻看旧渡航簿','每逢升仙台开放，转运船便混在送行船中出海。船夫曾救起一个不肯留下姓名的仙使。'],['试探雷影落点','雷影追逐最亮的灵光。船木结阵能替人挡住第一轮雷击，熄去引雷符则会暴露雷影的空隙。']],plans:['用船木结起护舟阵','熄符寻找雷影空隙'],hook:'你在旧船底找到云阙封蜡。线索通向仙门，你仍须凭自身修为完成真正的飞升。'},
 {clues:[['比对退回的家书','无军籍者被抹名后，抚恤、去向与死因都无人追问。这本名册沿用了凡间运送渡牌上的编号。'],['查阅灵卫封册律','灵卫只认封册印。匠人工牌可开启护身阵，旧版印谱则能让它的护甲符文失效片刻。']],plans:['借匠人工牌护身','以旧印谱破封'],hook:'被删去的去向指向碎星前线。那里正在以“战损”掩盖一条仍在运行的转运线。'},
 {clues:[['对照三方阵旗图','三方都以为对手偷袭，地下裂隙却同时掏空了各自阵脚。有人故意让星兽沿运送线吞阵。'],['救下失踪的传令使','传令使带回星兽换气的时刻。各方联阵能护住你；在它换气时逼它吐出阵石，则能破去外甲。']],plans:['请三方联阵护撤离口','趁换气击碎阵石'],hook:'获救的人带回一块照心台碎片：所谓无名试材，是被剥走了自身记忆的修士。'},
 {clues:[['触碰照心台碎片','水中映出你救过的人，也映出来不及救的人。有人把这种悔意当作催动残魂的燃料。'],['听完旧影的诘问','旧影问你是否要删掉失败。承认往事能稳住心神；指出记忆被拼接的矛盾，则会让旧影露出裂隙。']],plans:['守住真实记忆护心','指出拼接记忆的裂隙'],hook:'残魂的去处终于显现：三界旧关。夜无疆也在那里追查被盗用的魔典残页。'},
 {clues:[['清点旧关归人','归人带着各地不同的牌子，却被写进同一份无名册。先前每一段归路，都汇入了这道裂口。'],['与夜无疆核对残页','“有人借我的残篇造桥，拿活人的记忆填缝。”夜无疆只能封住上方。你可借余阵护身，或切断下方魂链削弱残响。']],plans:['借余阵护住归路','斩断维系残响的魂链'],hook:'残响散去，三方接过各自的名册。幕后造桥者仍未现身，而夜无疆的本源裂痕，留给你下一场问道。'}
];
function investigationV286823(id){return INVESTIGATIONS_V286823[JOURNEYS_V2838.findIndex(j=>j.id===id)];}
function journeyPrepV286823(id){const p=getTaskInstance(id)?.progress?.investigationV286823;return {clues:[0,1].filter(n=>p?.clues?.includes(n)),plan:[0,1].every(n=>p?.clues?.includes(n))&&['guard','breach'].includes(p?.plan)?p.plan:null};}
function setJourneyPrepV286823(id,kind,value){
 const i=getTaskInstance(id);if(!i||i.completed||i.failed||getCurrentTaskStep(id)?.action!=='journey_battle_v2838'||!taskInteractionAllowedV2822())return false;
 const next=journeyPrepV286823(id);
 if(kind==='all'){if(next.clues.length===2)return false;next.clues=[0,1];}
 else if(kind==='clue'&&[0,1].includes(value)){if(next.clues.includes(value))return false;next.clues.push(value);}
 else if(kind==='plan'&&next.clues.length===2&&['guard','breach'].includes(value))next.plan=value;
 else return false;
 const previous=i.progress.investigationV286823;i.progress.investigationV286823=next;
 try{if(!saveGame())throw Error('save');}catch(_){if(previous===undefined)delete i.progress.investigationV286823;else i.progress.investigationV286823=previous;showFloatingText('未能保存调查，请重试','#ff8a80');return false;}
 return true;
}
function investigationPanelV286823(id){
 const d=investigationV286823(id),p=journeyPrepV286823(id),esc=discipleEscV2815;
 return `<section><h3>战术部署 · 战前调查 ${p.clues.length}/2</h3>${p.clues.length<2?'<button type="button" data-journey="all">一并调查两处线索</button><p>展开全部调查内容，再选择战术；气血与灵力保持当前状态。</p>':''}${d.clues.map((c,n)=>`<button type="button" data-journey="clue${n}" ${p.clues.includes(n)?'disabled':''}>${p.clues.includes(n)?'✓ ':''}${esc(c[0])}</button>${p.clues.includes(n)?`<p>${esc(c[1])}</p>`:''}`).join('')}<p id="journeyPrepHintV2870" role="status" style="color:#ffd76a;font-weight:700">${p.clues.length<2?`请先调查两处线索（已完成 ${p.clues.length}/2），再选择战术方案。`:p.plan?'战术已选定，可以开始挑战；开战前仍可更改。':'两处线索已调查，请选择下方战术方案以开启挑战。'}</p>${['guard','breach'].map((plan,n)=>`<button type="button" data-journey="${plan}" aria-pressed="${p.plan===plan}" ${p.clues.length<2?'disabled':''}>${p.plan===plan?'✓ ':''}${esc(d.plans[n])} · ${n?'敌方防御降低15%':'前两回合获得最大气血12%的护盾'}</button>`).join('')}</section>`;
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
 return `<section class="main-overview-v2822"><h3>三界游历 · 八章</h3><p>炼虚至渡劫、天仙至大罗金仙逐章开放。这八章已接入主线顺序，可在主线页继续；不替代真正的飞升天劫。战斗失败保留已读步骤，可补给后重试；章节奖励仅发一次。</p><details><summary>查看开放条件</summary>${JOURNEYS_V2838.map(j=>`<p>${esc(j.title)}：${esc(CULTIVATION_REALMS[j.level].name)}初期，完成「${esc(getTaskData(j.requires)?.title||j.requires)}」</p>`).join('')}</details>${player?.tasks?.completed?.includes('main_19')?'<button type="button" class="choice-btn" onclick="showEpilogueV286838()">📜 终章回顾 · 道途圆满</button>':''}</section>`;
}
function scenePagesV2838(id,action){
 const j=JOURNEYS_V2838.find(x=>x.id===id);
 if(j){if(action===id+'_open'){
   const previous=JOURNEYS_V2838[JOURNEYS_V2838.indexOf(j)-1],choice=previous&&player.tasks?.choices?.[previous.id];
   return [...(j.id==='journey_01'&&player.rainChapterV286822?.step>=13?[['命牌旧案','你认出旧渡牌上的编号，与雨夜查获的无名册出自同一种记号。渡口的案子没有结束，只是归路伸向了更远的地方。']]:[]),...(previous?.outcomes[choice]?[['前路回响',previous.outcomes[choice]]]:[]),...j.opening];
  }if(action===id+'_end')return [...j.ending,['此行线索',investigationV286823(id).hook]];
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
 el.innerHTML='<section class="scene-card-v2838"><header><div><small id="sceneChapterV2838"></small><h2 id="sceneTitleV2838"></h2></div><button type="button" data-scene="close" aria-label="暂时收起剧情">×</button></header><div class="scene-landscape-v2838" aria-hidden="true"></div><div class="scene-reading-v2838"><div id="sceneArtV286829"></div><span id="sceneSpeakerV2838"></span><p id="sceneTextV2838"></p></div><footer><small id="scenePageV2838" aria-live="polite"></small><div><button type="button" data-scene="prev">上一页</button><button type="button" class="primary-v2838" data-scene="next">下一页</button></div></footer></section>';
 el.onclick=e=>{const a=e.target.closest('[data-scene]')?.dataset.scene;if(a==='close')closeSceneV2838(true);if(a==='prev')advanceSceneV2838(-1);if(a==='next')advanceSceneV2838(1);};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeSceneV2838(true);}else trapJourneyFocusV2838(e,el);};
 document.body.appendChild(el);renderSceneV2838();el.querySelector('[data-scene="next"]')?.focus({preventScroll:true});
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
 const art=document.getElementById('sceneArtV286829');if(art&&art.dataset.task!==s.id){art.innerHTML=mainIllustrationV286829(s.id);art.dataset.task=s.id;}
 el.classList.toggle('scene-illustrated-v286829',!!MAIN_ART_V286829[s.id]);
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
 container.innerHTML=chronicleV286827()+'<section class="main-overview-v2822"><h3>修行纪事</h3><p>只显示已读或旧存档已完成的剧情。回看不会改变分支，也不会再发奖励。</p></section>'+ (entries.length?entries.map(e=>{
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
 // balanceEnemyV2802 derives hp/atk/def from the realm; only gold and exp come from the chapter.
 const lv=j.level;const enemy=balanceEnemyV2802({name:j.enemy,hp:1,maxHp:1,atk:1,def:1,gold:80+lv*20,exp:80+lv*25,_realmLevel:lv,_realmPhase:0,_taskId:j.id,_taskAction:'journey_battle_v2838',_isTaskBattle:true});
 if(journeyPrepV286823(j.id).plan==='breach')enemy.def=Math.floor(enemy.def*.85);return enemy;
}
function launchJourneyBattleV2838(id){
 const j=JOURNEYS_V2838.find(x=>x.id===id),i=getTaskInstance(id);if(!j||!i||i.completed||i.failed||getCurrentTaskStep(id)?.action!=='journey_battle_v2838'||!taskInteractionAllowedV2822())return;
 document.getElementById('journeyPrepareV2838')?.remove();closeTaskPanel();stopNavigationV2830();FLAT_WORLD.keys={};FLAT_WORLD.target=null;
 const enemy=journeyEnemyV2838(j),owner=player,step=i.currentStep,el=document.createElement('div');el.id='journeyPrepareV2838';el.className='journey-overlay-v2838';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','journeyEnemyV2838');const esc=discipleEscV2815;
 el.innerHTML=`<section class="journey-prepare-v2838"><small>${esc(j.place)}</small><h2 id="journeyEnemyV2838">${esc(j.enemy)}</h2><p>${esc(weaknessTextV286821(enemy))}</p><p>${esc(CULTIVATION_REALMS[j.level].name)}初期 · 气血 ${enemy.maxHp} · 攻击 ${enemy.atk} · 防御 ${enemy.def}</p><p><b>${enemyRiskV286817(enemy).label}</b> · 仅按境界与精英标记评估；装备、招式和剩余气血仍影响胜负。</p><div class="journey-vitals-v2838"><span>气血 <b>${Math.floor(player.hp)} / ${getMaxHp()}</b></span><span>灵力 <b>${Math.floor(player.mp)} / ${getMaxMp()}</b></span></div>${investigationPanelV286823(id)}<p>这是中后期主线战：请升级到当前境界可用的武器、防具，并携带高阶功法；木剑与入门招式不足以应对。调查方案提供助力，不能替代装备准备。获胜推进本章，失败扣除身上灵石的20%，已读剧情保留。</p><button type="button" data-journey="fight" class="primary-v2838" ${player.hp<=1||!journeyPrepV286823(id).plan?'disabled':''}>准备好了 · 开始挑战</button><button type="button" data-journey="back">先补给 · 返回任务</button></section>`;
 el.onclick=e=>{const act=e.target.closest('[data-journey]')?.dataset.journey;if(!act)return;if(owner!==player||document.getElementById('journeyPrepareV2838')!==el||i!==getTaskInstance(id)||i.currentStep!==step){el.remove();return;}if(act==='all'||act.startsWith('clue')||['guard','breach'].includes(act)){if(setJourneyPrepV286823(id,act==='all'?'all':act.startsWith('clue')?'clue':'plan',act.startsWith('clue')?Number(act.slice(4)):act))launchJourneyBattleV2838(id);return;}if(act==='back'){el.remove();showTaskPanel('main');return;}
  if(act==='fight'&&i===getTaskInstance(id)&&i.currentStep===step&&!i.completed&&!i.failed&&taskInteractionAllowedV2822()&&player.hp>1&&journeyPrepV286823(id).plan){el.remove();startCombat(enemy,false,false,null);if(gameState==='combat'&&currentEnemy===enemy&&journeyPrepV286823(id).plan==='guard')elementGuardsV286818.set(enemy,{owner:player,pool:Math.floor(getMaxHp()*.12),turns:2});}};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){el.remove();if(owner===player)showTaskPanel('main');}else trapJourneyFocusV2838(e,el);};document.body.appendChild(el);const prep=journeyPrepV286823(id),next=prep.clues.length<2?'clue'+[0,1].find(n=>!prep.clues.includes(n)):!prep.plan?'guard':player.hp>1?'fight':'back';el.querySelector(`[data-journey="${next}"]`)?.focus();
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
 el.innerHTML=`<div><strong>战胜 · ${esc(r.name)}</strong><button type="button" data-after="close" aria-label="收起战后简报">×</button></div><p>灵石 +${r.gold}　修为 +${r.exp}<small>含本战触发的任务奖励</small></p><p data-after-status>气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p><div><button type="button" data-after="review">回看本场战斗</button><button type="button" data-after="recover">服丹调息 · 查看消耗</button><button type="button" data-after="tasks">继续任务</button><button type="button" data-after="rest">寻找补给</button></div>`;
 el.onclick=e=>{const act=e.target.closest('[data-after]')?.dataset.after;if(!act)return;if(act==='recover'){recoverAfterBattleV2875(owner,el);return;}el.remove();if(player!==owner||gameState!=='exploring'||player.breakthrough?.isAnimating)return;if(act==='review')showBattleReviewV2878();if(act==='tasks')showTaskPanel(r.taskType);if(act==='rest'){showScrollMapV2831();nearestScrollRestV2837();}};document.body.appendChild(el);
}
// A bounded, plain-text receipt. Never re-enters combat or reward handlers.
function normalizeBattleReviewV2878(raw){
 if(!raw||typeof raw!=='object'||!['victory','defeat','flee','capture'].includes(raw.kind))return null;
 const text=(v,n)=>typeof v==='string'?v.slice(0,n):'',num=v=>Number.isFinite(v)?Math.max(0,Math.min(1e12,Math.floor(v))):0;
 const lines=(v,n)=>Array.isArray(v)?v.slice(-n).filter(x=>typeof x==='string').map(x=>text(x,400)):[];
 return {peakHit:num(raw.peakHit),peakSkill:text(raw.peakSkill,100),directHits:num(raw.directHits),kind:raw.kind,name:text(raw.name,100),hero:text(raw.hero,100),day:num(raw.day),hp:num(raw.hp),maxHp:num(raw.maxHp),mp:num(raw.mp),maxMp:num(raw.maxMp),enemyHp:num(raw.enemyHp),enemyMaxHp:num(raw.enemyMaxHp),logs:lines(raw.logs,120),prose:lines(raw.prose,100)};
}
function rememberBattleVitalsV2878(){
 const p=COMBAT_FINISH_V2764.pending,e=currentEnemy;
 if(!p||p.owner!==player||!e||p.reviewVitalsV2878)return;
 p.reviewVitalsV2878={...(combatPeakV2886()||{}),name:e.name,hero:player.name,day:player.worldTime?.totalDays||0,hp:player.hp,maxHp:getMaxHp(),mp:player.mp,maxMp:getMaxMp(),enemyHp:e.hp,enemyMaxHp:e.maxHp};
}
window.addEventListener('xiantu:combat-finishing',rememberBattleVitalsV2878);
function recordBattleReviewV2878(p){
 if(!p||p.owner!==player||!currentEnemy||!p.reviewVitalsV2878)return false;
 const logs=Array.from(document.getElementById('combatLog')?.children||[]).reverse().map(n=>n.textContent||'');
 const prose=window.XiantuBattleProseV286832?.history?.()||[];
 const record=normalizeBattleReviewV2878({...p.reviewVitalsV2878,kind:p.kind,logs,prose});
 if(!record)return false;player.lastBattleReviewV2878=record;return true;
}
function showBattleReviewV2878(){
 if(!jevCanActV2846())return false;
 const r=normalizeBattleReviewV2878(player.lastBattleReviewV2878),esc=discipleEscV2815;
 if(!r){showFloatingText('还没有可回看的战斗，结束下一场后会留下记录。','#ffd76a');return false;}
 document.getElementById('afterBattleV2838')?.remove();resetWorldMovementV28686();
 const result={victory:'胜利',defeat:'败退',flee:'脱离战斗',capture:'收服结束'}[r.kind];
 const list=xs=>xs.map(x=>`<p>${esc(x)}</p>`).join('')||'<p>本场没有此类记录。</p>';
 showStory(`<section class="battle-review-v2878 loop-board-v286840"><h3>上一场战斗 · ${result}</h3><p>游历第${r.day+1}日 · ${esc(r.hero)} 对战 ${esc(r.name)}</p><div class="battle-review-vitals-v2878"><article><b>${esc(r.hero)}</b><p>气血 ${r.hp}/${r.maxHp}</p><p>灵力 ${r.mp}/${r.maxMp}</p></article><article><b>${esc(r.name)}</b><p>气血 ${r.enemyHp}/${r.enemyMaxHp}</p></article></div>${r.peakHit?`<p>本场最高直击 ${r.peakHit} · ${esc(r.peakSkill)}；有效直击 ${r.directHits} 次（仅主角实际扣血，过量伤害不计）。</p>`:''}<p>以上为退场结算开始时的状态。仅保留最近一场；回看不改变状态或重复发放奖励。</p><details open><summary>斗法纪事 · 最近${r.prose.length}段</summary>${list(r.prose)}</details><details><summary>详细战报 · 最近${r.logs.length}条（按发生顺序）</summary>${list(r.logs)}</details></section>`,[{text:'返回地图',action:'return_to_map'}]);return true;
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
 try{const raw=localStorage.getItem(PREVIOUS_SAVE_V2838);if(!raw)throw Error('尚无上一位角色');const data=dryRunLoadV2870(raw);
  if(!confirm(`恢复上一位角色「${data.player.name||'无名'}」？将与当前角色互换，当前角色保存在“上一位角色”。`))return;
  replaceSaveV2870(raw,data,PREVIOUS_SAVE_V2838);
 }catch(e){alert('未恢复：'+e.message);}
}
async function exportPreviousV2838(){
 try{await exportRawSaveV2870(localStorage.getItem(PREVIOUS_SAVE_V2838),'xiantu-previous-character.json');}
 catch(e){alert('导出失败：'+e.message);}
}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2838-journey.js']='28.68.70';

// Small non-combat encounters, two per region and character. Persist choice and reward together.
const ROAMING_KINDS_V286818=['traveler','ruins'];
let roamingContextV286818=null;
function normalizeRoamingV286818(raw){
 const out={maps:{}};
 for(const region of Object.keys(WORLD_MAP_CONFIGS)){
  const old=raw?.maps?.[region];if(!old||typeof old!=='object')continue;
  const resolved={};for(const kind of ROAMING_KINDS_V286818)if(['aid','guide','channel','copy','leave'].includes(old.resolved?.[kind]))resolved[kind]=old.resolved[kind];
  out.maps[region]={cycle:Math.max(0,Math.min(1e9,Math.floor(Number(old.cycle)||0))),restSeen:Array.isArray(old.restSeen)?[...new Set(old.restSeen.filter(x=>typeof x==='string'&&/^\d{1,4},\d{1,4}$/.test(x)))].slice(-36):[],seen:Array.isArray(old.seen)?[...new Set(old.seen.filter(x=>typeof x==='string'&&/^\d{1,4},\d{1,4}$/.test(x)))].slice(-256):[],steps:Math.max(0,Math.min(999,Math.floor(Number(old.steps)||0))),pending:ROAMING_KINDS_V286818.includes(old.pending)&&!resolved[old.pending]?old.pending:null,resolved};
 }
 return out;
}
function roamingStateV286818(){
 const all=player.roamingV286818 ||= {maps:{}};all.maps ||= {};
 return all.maps[currentRegion||'south'] ||= {seen:[],steps:0,pending:null,resolved:{},restSeen:[],cycle:0};
}
function roamingAllowedV286818(){return gameState==='exploring'&&!player.breakthrough?.isAnimating&&!COMBAT_FINISH_V2764.settling;}
function discoverRoamingV286818(cell){
 if(!roamingAllowedV286818()||isWorldOverlayOpen()||autoNavigationV2830)return;
 const intro=typeof firstJourneyV28687==='function'?firstJourneyV28687():null;
 if(intro&&!intro.paused&&intro.step<4)return;
 const state=roamingStateV286818();if(state.pending||typeof cell!=='string'||!/^\d{1,4},\d{1,4}$/.test(cell))return;
 if(Object.keys(state.resolved).length>=2){
  const rest=state.restSeen||[];if(rest.includes(cell))return;
  if(rest.length<35){state.restSeen=[...rest,cell];return;}
  const region=currentRegion||'south',next={seen:[],steps:0,pending:null,resolved:{},restSeen:[],cycle:Math.min(1e9,(state.cycle||0)+1)};
  player.roamingV286818.maps[region]=next;
  if(!saveGame())player.roamingV286818.maps[region]=state;
  return;
 }
 if(state.seen.includes(cell))return;
 state.seen.push(cell);if(state.seen.length>256)state.seen.shift();state.steps=Math.min(999,state.steps+1);
 let hash=17;for(const ch of (currentRegion||'south')+':'+cell)hash=(Math.imul(hash,31)+ch.charCodeAt(0))>>>0;
 if(state.steps<12||hash%17!==0)return;
 state.pending=ROAMING_KINDS_V286818.find(k=>!state.resolved[k]);state.steps=0;
 if(!saveGame()){state.pending=null;return;}
 stopNavigationV2830();FLAT_WORLD.keys={};FLAT_WORLD.target=null;FLAT_WORLD.moving=false;
 openRoamingV286818();
}
function roamingNoticeV286818(){
 const state=roamingStateV286818();return state.pending?'<p>途中有一段未了机缘。</p><button class="choice-btn" onclick="openRoamingV286818()">继续奇遇 · '+(state.pending==='traveler'?'受伤行者':'残阵遗迹')+'</button>':'';
}
function openRoamingV286818(){
 if(!roamingAllowedV286818())return;const state=roamingStateV286818(),kind=state.pending;if(!kind)return;
 roamingContextV286818={owner:player,region:currentRegion||'south',kind,cycle:state.cycle||0};
 const aid=(player.materials?.['灵草']||0)>=2,channel=player.mp>=20;
 let body=kind==='traveler'?`<h3 id="roamingTitleV286818">山道奇遇 · 受伤行者</h3><p>松根下，一位散修捂着伤腿。他愿以珍藏的神行符，换取两株灵草疗伤；若你不便施药，也可以替他辨认通往灵泉的道路。</p><button class="choice-btn" onclick="resolveRoamingV286818('aid')" ${aid?'':'disabled'}>施药相助 · 灵草−2，神行符+1</button><button class="choice-btn" onclick="resolveRoamingV286818('guide')">指路护送 · 获赠30灵石</button>`:`<h3 id="roamingTitleV286818">山道奇遇 · 残阵遗迹</h3><p>古修石门只余半幅阵纹。你可以注入灵力打开侧匣，也可以放弃启阵，采下石缝间的灵草。</p><button class="choice-btn" onclick="resolveRoamingV286818('channel')" ${channel?'':'disabled'}>注灵启匣 · 灵力−20，灵石+80、神行符+1</button><button class="choice-btn" onclick="resolveRoamingV286818('copy')">采草离去 · 灵草+3</button>`;
 body+='<p>本地区两种奇遇处理完后，再手动探索36个不同地格可开启下一轮；原地重复、自动寻路不计。可以稍后从探索手册继续；刷新不会重置选择。</p><button class="choice-btn" onclick="resolveRoamingV286818(\'leave\')">不作停留 · 放弃本次机缘</button>';
 showStory('<section class="main-overview-v2822">'+body+'</section>',[{text:'稍后再来 · 返回地图',action:'return_to_map'}]);
}
function resolveRoamingV286818(choice){
 const context=roamingContextV286818;
 if(!roamingAllowedV286818()||!context||context.owner!==player||context.region!==(currentRegion||'south')||!document.getElementById('roamingTitleV286818')||document.getElementById('storyPanel')?.classList.contains('hidden'))return false;
 const state=roamingStateV286818(),kind=state.pending;
 if((state.cycle||0)!==(context.cycle||0)||!kind||kind!==context.kind||state.resolved[kind]||!(kind==='traveler'?['aid','guide','leave']:['channel','copy','leave']).includes(choice))return false;
 if(choice==='aid'&&(player.materials?.['灵草']||0)<2||choice==='channel'&&player.mp<20)return false;
 const before={gold:player.gold,mp:player.mp,inventory:player.inventory,materials:player.materials,roaming:player.roamingV286818};
 const next={...state,pending:null,resolved:{...state.resolved,[kind]:choice}};
 player.roamingV286818={maps:{...player.roamingV286818.maps,[context.region]:next}};
 player.inventory=[...(player.inventory||[])];player.materials={...(player.materials||{})};
 if(choice==='aid'){player.materials['灵草']-=2;player.inventory.push('神行符');}
 if(choice==='guide')player.gold+=30;
 if(choice==='channel'){player.mp-=20;player.gold+=80;player.inventory.push('神行符');}
 if(choice==='copy')player.materials['灵草']=(player.materials['灵草']||0)+3;
 if(!saveGame()){
  player.gold=before.gold;player.mp=before.mp;player.inventory=before.inventory;player.materials=before.materials;player.roamingV286818=before.roaming;
  showFloatingText?.('未能保存，未扣除资源或领取奖励。请恢复存储后重试。','#ffd76a');return false;
 }
 roamingContextV286818=null;updateStats();
 showStory('<h3>机缘已记入行囊</h3><p>'+({aid:'你为行者敷好灵草，收下了一张神行符。',guide:'行者谢过你的指点，赠你30灵石。',channel:'残阵归于寂静，侧匣中留下80灵石和一张神行符。',copy:'你采下三株灵草，沿着旧道继续前行。',leave:'你收回目光，继续自己的修行路。'}[choice])+'</p>',[{text:'返回地图',action:'return_to_map'}]);return true;
}

// 雨夜命牌案：独立章节进度，不重置旧主线、情缘或物品。
const RAIN_TITLES_V286822=['雨夜来信','没有靠岸的渡船','河灯与脚印','先救谁，先追谁','渡口伏击','留下来的名字','苏晚晴的来意','库房旧账','秘境潮门','守册傀儡','宗门问证','把真相交给谁','另一封没有署名的信','雨夜命牌案 · 卷一完'];
const RAIN_CLUES_V286822={rope:['断绳','船绳朝岸的一侧被齐整割断，船没有被洪水冲走。割口沾着药箱封蜡。'],lamp:['河灯','灯芯还温着。灯底写着“沈禾，药工”，名字下面被盖了一个“亡”字，而岸上传来同名少年的呼救。'],print:['泥印','驮箱的车轮很深，回程却很浅。靴底的三角铜钉只在宗门库房役卒的鞋上见过。'],ledger:['库账','出库的是安魂药，入账却写“无主命牌”。同一批号的二十七块命牌，死亡日期竟完全相同。'],seal:['旧印','凌霄宗的云纹印是真的，但印泥比来信上的新。有人借正规运送的药箱夹带命牌。'],witness:['证词','守夜人记得一句交代：“不用死人，只要没人回来认领。”失踪者有可能还活着。']};
let rainViewV286822=null,rainSeqV286822=0;
const rainFightsV286822=new WeakMap();
function rainStateV286822(){
 const r=player.rainChapterV286822||{};
 return {step:Math.max(0,Math.min(13,Math.floor(Number(r.step)||0))),clues:Array.isArray(r.clues)?[...new Set(r.clues.filter(k=>Object.hasOwn(RAIN_CLUES_V286822,k)))]:[],
 route:['rescue','chase'].includes(r.route)?r.route:'',trust:['share','reserve'].includes(r.trust)?r.trust:'',policy:['public','protect','trace'].includes(r.policy)?r.policy:'',
 puzzle:!!r.puzzle,rested:Array.isArray(r.rested)?r.rested.filter(n=>n===4||n===9):[],rewarded:!!r.rewarded};
}
function rainUnlockedV286822(){return !!player.rainChapterV286822||player.level>=2||(firstJourneyV28687()?.step||0)>=4;}
function rainSummaryV286822(s=rainStateV286822()){return s.step>=13?`${s.route==='rescue'?'沈禾活着回来作证':'运输暗号已查明'}；${({public:'名册已交三方公开核查',protect:'证人已安置在药庐',trace:'库房仍由专人监视'})[s.policy]||'旧案留待查明'}。`:s.step?`雨夜命牌案：${RAIN_TITLES_V286822[s.step]}。`:'渡口来信尚待查证。';}
function rainCardV286822(){return `<article class="task-card"><strong>雨夜命牌案 · 剧情扩展</strong><p>${rainUnlockedV286822()?escapeGameText(rainSummaryV286822()):'完成山道教学、发现来信后开启；筑基及以上旧存档可直接补记。'}</p><button class="task-action" onclick="showRainChapterV286822()" ${rainUnlockedV286822()?'':'disabled'}>${rainStateV286822().step>=13?'回看旧案':'追查来信'}</button></article>`;}
// Scene selection is keyed by stable task IDs, never saved indices or localized titles.
const MAIN_ART_V286829={
 main_01:'sect',main_02:'sect',main_03:'bridge',main_04:'forest',main_05:'platform',main_06:'platform',main_07:'arena',main_08:'forest',main_09:'pharmacy',main_10:'forbidden',main_11:'forbidden',main_12:'ledger',main_13:'arena',main_14:'arena',main_15:'frontier',main_16:'frontier',main_17:'cloud',main_18:'pass',main_19:'pass',
 journey_01:'snow',journey_02:'suspension',journey_03:'camp',journey_04:'fleet',journey_05:'cloud',journey_06:'frontier',journey_07:'mirror',journey_08:'pass'
};
const MAIN_ART_CAPTIONS_V286829={
 sect:['凌霄山门','晨光穿过云海，石阶通向凌霄山门。'],forest:['林间试炼','古树与灵草之间，一条石径伸向山林深处。'],platform:['云上修行台','云海上的石台静候修行者，远处雷光隐现。'],arena:['宗门演武场','山间擂台旁旌旗垂落，观战廊阁环绕四周。'],bridge:['山门石桥','石桥两端有人驻足，溪水与晨雾隔着未说完的话。'],pharmacy:['药庐外的风','风掀起药庐竹帘，廊下晾着药草。'],forbidden:['深阁旧事','月光照着禁阁台阶，窗内透出一线灯火。'],frontier:['荒原归路','暮色中的车队沿荒原道路向远处据点行进。'],snow:['断雪驿灯','积雪中的驿站亮起暖灯，为归人指路。'],suspension:['群峰悬桥','一座悬桥连接群峰，行人在桥头等待通行。'],camp:['灰营余火','焦黑营地旁，药工收拾药箱与干净布带。'],cloud:['仙阙旧册','云堤工具与名册后方，是高耸的仙阙档案殿。'],mirror:['太乙照心台','照心台的静水映着群山与星光。'],pass:['天堑与归途','旧关横跨深谷，灯下的道路延向远方。']
};
function mainIllustrationV286829(id){
 const key=MAIN_ART_V286829[id];if(!key)return '';
 if(key==='ledger')return storyIllustrationV286828('rain',0);
 if(key==='fleet')return storyIllustrationV286828('rain2',2);
 const [caption,alt]=MAIN_ART_CAPTIONS_V286829[key];
 return storyFigureV286829(`story-${key}-v286829.webp`,caption,alt);
}
function storyFigureV286829(src,caption,alt){
 return `<figure class="story-illustration-v286828"><img src="${src}" width="1536" height="1024" loading="lazy" decoding="async" alt="${alt}" onerror="this.hidden=true;this.parentElement.classList.add('story-art-unavailable')"><figcaption>${caption}<span class="story-art-fallback"> · 插画暂未载入，可继续阅读</span></figcaption></figure>`;
}
// Local story artwork is decorative: loading and failure never gate narrative actions.
function storyIllustrationV286828(series,step){
 const scenes={rain:{0:'ledger',1:'dock',6:'ledger',7:'ledger',8:'gate',13:'dock'},rain2:{0:'ledger',2:'fleet',3:'ledger',4:'fleet',9:'fleet'},extra:{reflection:'ledger',encounter:'ledger',after_guard:'dock'}};
 const art={dock:['rain-dock','雨夜渡口','雨中的木栈桥旁停着空船，河灯映在水面。'],ledger:['lamp-ledger','灯下旧卷','药庐灯下摆着旧账册、书信与木牌。'],gate:['tide-gate','秘境潮门','潮水退去，青色微光从古老石门后透出。'],fleet:['thunder-fleet','雷海行舟','船队穿过雾中的海峡，船灯在雷云下隐现。']};
 const entry=art[scenes[series]?.[step]];if(!entry)return '';
 return storyFigureV286829(`story-${entry[0]}-v286828.webp`,entry[1],entry[2]);
}
function rainNarrativeV286822(step,s){
 const rescue=s.route==='rescue',share=s.trust==='share';
 const pages=[
 ['雨把信纸洇透，你只辨出一句：“今夜，不要让药师上山。”云纹封蜡下还有一行针尖般的小字：他们正在收购失踪修士的命牌。','你把信朝灯移近。纸背是一个名单，你的名字在第三行，旁边写着“已亡”。署名处压着旧木牌的半边印记——当年苏晚晴离开青石桥时，也带走了这样一块木牌。','远处渡口的钟响了两次，第三声迟迟没有来。送药的船本应此时靠岸。你决定先去看看，而不是把这封信当作某个人的玩笑。'],
 ['青云渡口只剩一盏倾斜的灯。空船撞着桥墩，渡工说药师没有上山，反倒在傍晚被宗门的人请去了库房。','岸边有割断的船绳、一盏漂回来的河灯和两道不同方向的车辙。逐一查看，也许能分清这是劫财，还是有人故意把船上的人藏起来。','【调查】至少查看两处痕迹才能判断去向。证据不会因为选择另一条路永久消失。'],
 ['桥下有人敲击船板。一名少年卡在翻覆的药船里，水位正在上涨。与此同时，提灯的黑衣人正带着一只小匣离开。','渡工只有一条小艇，来不及同时追人和救人。他问你：“仙师，你先往哪边？”你看见河灯上的姓名，第一次意识到名单背后不是数字。','【选择后果】先救人：黑衣人暂时逃走，留下证人和援助。先追踪：渡工会带人救少年，你掌握运输暗号，但少年暂时无法作证。两路均可继续、补查证据，不扣好感。'],
 rescue?['你把剑横在船板间，叫少年跟着你的呼吸数数。他咳出第一口水时，仍紧攥一只碎药瓶：“里面有人活着，别把药倒掉。”','少年叫沈禾，是药庐帮工。他说药师被带走前把解毒粉分给了被关的人；所谓安魂药，其实会让命牌短暂失去感应。','“我的河灯写着我死了？”他摸着尚温的手腕，忽然不再哭了，“那我就活着去认自己的名字。”渡工将备用药包交给你，愿在伏击时掩护你。']:['你沿车辙追到旧仓，听见黑衣人敲门：两短一长。门里问“几盏灯”，他答“二十七盏，留三盏不灭”。','你没有立刻拔剑。小匣里不是灵石，而是一摞写着姓名的薄木片。黑衣人把其中一片翻过来，露出与你来信相同的印记。','渡工随后赶来报信：少年已经救起，正在药庐昏睡。你把暗号记牢，沿运货侧门布下绊索；这一趟没有证词，却有一条能继续往上查的线。'],
 ['库房役卒堵住渡口，拿出的不是通缉令，而是一张写着“意外落水”的验尸单。上面的名字甚至还没干。','“活人回去，账就对不上了。”领头人话音未落，河灯被一脚踢灭。你要守住药船，也要让这张纸留下来。',rescue?'【援助】渡工会在开战时提供15%最大气血的护盾，持续敌方两次行动。':'【先手布置】运输侧门的绊索令伏击者攻击降低20%。','可在本场出战前接受一次药包调息，补满气血与灵力。失败后章节停留在这里，可整备重试。'],
 ['你从役卒袖中取出库房借印单，借印者那一栏被刀刮过。真印可以借，人的生死却不该这样借来记账。',rescue?'沈禾把验尸单摊在灯下，照着自己的名字一笔一笔地读。他不是为了证明你做对了，而是要回药庐找到还没回来的师父。':'药庐回信说沈禾已脱险，只是仍不能开口。你把听见的暗号交给渡工，让他守住来往药箱，不再冒险单独追人。','你可以回头补查渡口遗留痕迹。另一条路上的人和证据没有凭空消失；你只是先后做了不同的事。'],
 ['苏晚晴在库房门前等你。她先看了看你手上的伤，再看那封信：“你也收到了？”她拿出另一封，名单里写着她失踪师姐的名字。','“木牌印是我留下的。”她没有躲开你的目光，“我想让你别上山，也怕你真的不来。”这不是道歉，更不是复合。你们先要决定，能不能把眼前的事情交给彼此。','【选择后果】坦白交出原信，她会主动讲出师姐留下的解阵口诀；暂留底牌，她保留疑虑，但后续仍可在库房找到同一线索，不锁死剧情。'],
 ['库房的门没有锁，值夜的录事却坚持每一只药箱都要盖章才准带走。他一遍遍说手续齐全，手指却停在同一个批号上。',share?'苏晚晴把原信压在账边：“先别问是谁有罪，先问谁还活着。”她将师姐的口诀告诉你：归潮认名，不认亡字。':'苏晚晴没有再问你原信的事，只借来一盏灯：“你查账，我查药。等你愿意说时，别让我从别人那里听见。”','【调查】查完库账、旧印和证词，再判断对方究竟在伪造死亡，还是单纯盗卖财物。判断不对可以继续核查，不损失物品。'],
 ['库房账页指向河底一座旧修士遗府。潮门上刻着二十七个姓名，每个名字旁都贴着一枚新写的“亡”字。门并未真的封死，只是有人把活人藏在死人的手续里。',share?'苏晚晴与你并肩站到水线前：“归潮认名，不认亡字。把名字留下。”':'你在账簿夹页找到了残句：“归潮认名，不认亡字。”苏晚晴看过后点头，却没有替你做决定。','【解阵】保留姓名、揭去“亡”签，可削弱守册傀儡的护甲；直接破门也能继续，但须正面面对完整防御。没有永久漏掉的奖励。'],
 ['潮门后不是宝库，而是一间仍在供药的石室。沉睡的修士腕上系着纸牌，药师被锁在药炉旁。他喊：“别砸炉！停药要按次序，否则他们醒不过来。”','守册傀儡将账页展开，挡在炉前。苏晚晴先护住药师，你负责打断傀儡的追击。救人需要手稳，也需要有人在前面站住。',s.puzzle?'【解阵已生效】傀儡防御降低25%。':'【强行破门】傀儡保留完整防御，仍可准备后挑战。','本场有一次战前调息；获胜才推进救援，刷新中断战斗会按现有战斗存档规则恢复。'],
 ['药师把最后一个人唤醒时，天已经亮了。二十七盏河灯只点起二十四盏，另三人的药位是空的。有人在你来之前把他们带走了。','宗门执事接过证物，第一句话却是：“真印外流，此事若传出去，凌霄宗颜面何存？”苏晚晴把名单往前推了一寸：“先把人记回来，再谈颜面。”',rescue?'沈禾站到人群前，报出自己的名字。他的声音仍很轻，却已经不再需要你代他说话。':'你按运输暗号复述了旧仓的交接过程；渡工带来沈禾的手印，补上了暂时不能到场的证词。','证据不足以指认某位长老。你需要决定如何保住调查，而不是选一个看起来最像坏人的人。'],
 ['公开核查会让更多家属知道真相，也会惊动暗中接货的人。保护证人能让他们喘口气，但解释暂时不会传遍山门。继续追踪能保住线索，却需要面对等待中的质疑。','【选择后果】公开：留下三方核查记录；保护：药庐成为证人落脚处；追踪：库房保留监视线。三种结案记录及苏晚晴后续对白不同，奖励相同，不扣好感，也不提前定罪。'],
 ['旧案刚刚封存，你在归途收到另一封信。里面没有命牌，只有一截烧焦的船绳和三个尚未归来的姓名。','夜无疆的字写在纸背：“有人买的是命牌，有人买的是不被追查的名字。你以为找回二十四个人，便已经找到了买家？”','你将信翻过来。第三个名字不是死者，也不是失踪者——那是替你们盖过借印章的录事。苏晚晴看完，把自己的灯递到你身旁：“这次，不要等我在别人那里听见。”','卷一至此结束。命牌案有了结果，真正接货的人仍在远处。完成可领取一次120灵石；回看不会重复领奖。'],
 [rainSummaryV286822(s),share?'苏晚晴：“这次你把原信交给了我。下次有事，也别只留一句让我猜的话。”':'苏晚晴：“我会把我查到的事告诉你。至于你的那一半，我等你亲口说。”','你把案卷收好。河灯亮着，山路还长；原先未尽的约定，仍等你亲自赴约。可以回看此行，或继续自己的修行。']
 ];return pages[step]||pages[0];
}
function rainCloseV286822(){rainViewV286822=null;document.getElementById('rainChapterV286822')?.remove();}
function showRainChapterV286822(replay=-1){
 if(gameState!=='exploring'||!rainUnlockedV286822())return;
 document.getElementById('afterBattleV2838')?.remove();
 stopNavigationV2830();if(typeof FLAT_WORLD!=='undefined')FLAT_WORLD.keys={};
 closeTaskPanel();rainCloseV286822();const s=rainStateV286822(),back=Number.isInteger(replay)&&replay>=0&&replay<=s.step,n=back?replay:s.step;
 const token=++rainSeqV286822;rainViewV286822={owner:player,token,step:s.step,replay:back};
 const el=document.createElement('div');el.id='rainChapterV286822';el.className='rain-overlay-v286822';
 const button=(id,label)=>`<button type="button" class="choice-btn" onclick="actRainV286822(${token},'${id}')">${label}</button>`;
 let buttons='';
 if(!back){
  if([1,5,7].includes(n)){const keys=n===7?['ledger','seal','witness']:['rope','lamp','print'];if(keys.some(k=>!s.clues.includes(k)))buttons+=button('all','一并核查本节线索');buttons+=keys.map(k=>button(k,(s.clues.includes(k)?'✓ ':'调查 · ')+RAIN_CLUES_V286822[k][0])).join('');}
  if(n===2)buttons+=button('rescue','先救人 · 留下证人')+button('chase','先追踪 · 掌握暗号');
  else if(n===6)buttons+=button('share','交出原信 · 坦白同行')+button('reserve','暂留原信 · 分头查证');
  else if(n===7)buttons+=button('fraud','判断：伪造死亡，掩盖活人去向')+button('theft','判断：只为盗卖财物');
  else if(n===8)buttons+=button('names','留下姓名，揭去亡签')+button('force','直接破门，正面交锋');
  else if(n===4||n===9)buttons+=(!s.rested.includes(n)?button('rest','接受药包调息 · 本场一次'):'')+button('fight','准备妥当，进入战斗');
  else if(n===11)buttons+=button('public','公开证据 · 三方核查')+button('protect','先安置证人 · 保留证词')+button('trace','保留监视线 · 继续追踪');
  else if(n<13)buttons+=button('next',n===12?'完成卷一 · 领取120灵石':'继续调查');
 }
 const notebook=s.clues.map(k=>`<p><b>${RAIN_CLUES_V286822[k][0]}</b>：${RAIN_CLUES_V286822[k][1]}</p>`).join('');
 el.innerHTML=`<section role="dialog" aria-modal="true" aria-labelledby="rainTitleV286822" class="rain-card-v286822"><header><span>雨夜命牌案 · ${n+1}/14${back?' · 只读回看':''}</span><button type="button" onclick="rainCloseV286822()" aria-label="关闭章节">×</button></header><h2 id="rainTitleV286822">${RAIN_TITLES_V286822[n]}</h2>${storyIllustrationV286828("rain",n)}${rainNarrativeV286822(n,s).map(p=>`<p>${escapeGameText(p)}</p>`).join('')}<div id="rainNoticeV286822" role="status"></div><div class="rain-actions-v286822">${buttons}</div><details><summary>随身案卷 · ${s.clues.length}条证据</summary>${notebook||'<p>暂无线索。</p>'}</details><details><summary>回看已读片段</summary>${RAIN_TITLES_V286822.slice(0,s.step+1).map((t,i)=>`<button type="button" onclick="showRainChapterV286822(${i})">${i+1} · ${t}</button>`).join('')}</details>${back?'<button class="choice-btn" onclick="showRainChapterV286822()">返回当前进度</button>':''}<button class="choice-btn" onclick="rainCloseV286822()">暂别此处 · 进度已保存</button></section>`;
 document.body.appendChild(el);el.querySelector('header button')?.focus();
}
function rainCommitV286822(next,reward=0,rest=false){
 const old={state:player.rainChapterV286822,gold:player.gold,hp:player.hp,mp:player.mp};player.rainChapterV286822=next;player.gold+=reward;
 if(rest){player.hp=getMaxHp();player.mp=getMaxMp();}
 let saved=false;try{saved=saveGame();}catch(_){}if(saved){updateStats();return true;}
 Object.assign(player,{rainChapterV286822:old.state,gold:old.gold,hp:old.hp,mp:old.mp});return false;
}
function actRainV286822(token,action){
 const v=rainViewV286822,s=rainStateV286822();if(!taskInteractionAllowedV2822()||!rainUnlockedV286822()||!document.getElementById('rainChapterV286822')||!v||v.owner!==player||v.token!==token||v.step!==s.step||v.replay)return false;
 const n=s.step,notice=t=>{const el=document.getElementById('rainNoticeV286822');if(el)el.textContent=t;return false;};
 if(action==='fight'&&(n===4||n===9)){
  if(!player.rainChapterV286822)return false;
  rainCloseV286822();closeWorldOverlay();
  const enemy=balanceEnemyV2802({name:n===4?'渡口山贼':'守册石傀儡',hp:n===4?140:200,maxHp:n===4?140:200,atk:n===4?14:18,def:n===4?4:6,gold:0,exp:0,_realmLevel:0,_realmPhase:0,_isTaskBattle:true,_rainChapterV286822:n});
  if(n===4&&s.route==='chase')enemy.atk=Math.max(1,Math.floor(enemy.atk*.8));
  if(n===9&&s.puzzle)enemy.def=Math.floor(enemy.def*.75);
  startCombat(enemy);if(currentEnemy!==enemy||gameState!=='combat'){showRainChapterV286822();return false;}
  rainFightsV286822.set(enemy,{owner:player,step:n});
  if(n===4&&s.route==='rescue')elementGuardsV286818.set(enemy,{owner:player,pool:Math.floor(getMaxHp()*.15),turns:2,element:'heal'});
  updateCombatUI();return true;
 }
 let reward=0,rest=false;
 if(action==='all'&&[1,5,7].includes(n)){const keys=n===7?['ledger','seal','witness']:['rope','lamp','print'];if(keys.every(k=>s.clues.includes(k)))return false;s.clues=[...new Set([...s.clues,...keys])];}
 else if(Object.hasOwn(RAIN_CLUES_V286822,action)&&(([1,5].includes(n)&&['rope','lamp','print'].includes(action))||(n===7&&['ledger','seal','witness'].includes(action)))){if(!s.clues.includes(action))s.clues.push(action);}
 else if(n===2&&['rescue','chase'].includes(action)){s.route=action;s.step++;}
 else if(n===6&&['share','reserve'].includes(action)){s.trust=action;s.step++;}
 else if(n===7&&['fraud','theft'].includes(action)){
  if(!['ledger','seal','witness'].every(k=>s.clues.includes(k)))return notice('还需核对库账、旧印与证词。');
  if(action==='theft')return notice('若只是盗卖财物，为何要给活着的沈禾开验尸单？请再对照死亡日期与药箱批号。没有损失资源。');s.step++;
 }else if(n===8&&['names','force'].includes(action)){s.puzzle=action==='names';s.step++;}
 else if([4,9].includes(n)&&action==='rest'&&!s.rested.includes(n)){s.rested.push(n);rest=true;}
 else if(n===11&&['public','protect','trace'].includes(action)){s.policy=action;s.step++;}
 else if(action==='next'&&[0,1,3,5,10,12].includes(n)){
  if(n===1&&s.clues.filter(k=>['rope','lamp','print'].includes(k)).length<2)return notice('请先调查至少两处痕迹，再决定往哪边去。');
  s.step++;if(n===12&&!s.rewarded){reward=120;s.rewarded=true;}
 }else return false;
 if(!rainCommitV286822(s,reward,rest))return notice('保存失败，本次选择、调息或奖励未生效。请恢复存储后重试。');
 showRainChapterV286822();if(action==='all'){document.querySelector('#rainChapterV286822 details')?.setAttribute('open','');document.getElementById('rainNoticeV286822').textContent='本节线索已收录。请阅读案卷后自行判断，当前状态未改变。';}if(Object.hasOwn(RAIN_CLUES_V286822,action))document.getElementById('rainNoticeV286822').textContent=RAIN_CLUES_V286822[action][1];return true;
}
function finishRainBattleV286822(enemy){
 const battle=rainFightsV286822.get(enemy),s=rainStateV286822();
 if(!battle||battle.owner!==player||enemy.hp>0||s.step!==battle.step)return;
 s.step++;player.rainChapterV286822=s;rainFightsV286822.delete(enemy);
 addCombatLog('命牌案有了新进展，可从任务中的“雨夜命牌案”继续。','gold');
}

function rainVillageV286822(){
 const s=rainStateV286822();if(s.step<13)return rainUnlockedV286822()?rainCardV286822():'';
 const aftermath={public:'渡口贴出了二十四名归来者的姓名。家属可以到三方核查处登记失踪线索，守夜人不再因私谈此案受责。',protect:'药庐留了两间客房安置证人，姓名暂不张榜。沈禾每天替师父添一盏灯，等另外三人归来。',trace:'码头照常装卸，库房的值夜人却多了两位。你留下的暗号交给了可靠的人，下一次送货不会再无人知晓。'};
 return `<section class="area-info-box"><h3>青云渡口 · 复航之后</h3><p>${aftermath[s.policy]||'河灯重新点起，旧案仍有人查访。'}</p><p>${s.route==='rescue'?'沈禾认出你，停下手里的活向你招手：“下回靠岸，我替你留灯。”':'渡工递来沈禾的谢笺：“他醒了。你的暗号我们记住了。”'}</p><button class="choice-btn" onclick="showRainChapterV286822()">翻阅雨夜旧案</button></section>`;
}

document.addEventListener('keydown',e=>{
 const modal=document.getElementById('rainChapterV286822');if(!modal)return;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();rainCloseV286822();}
 if(e.key==='Tab'){const buttons=[...modal.querySelectorAll('button,summary')].filter(b=>!b.disabled&&b.getClientRects().length);const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
},true);

// V28.68.29 · Narrative continuity; all persisted additions are optional for old saves.
function releaseResonanceV286826(){
 const r=player.romance?.npcs?.suwanqing;if(!r)return 0;
 const pool=Math.max(0,Math.min(100-r.affection,Number(r.resonanceV286826)||0));
 const gain=Math.max(0,Math.min(pool,getSuAffectionCap()-r.affection));
 r.affection+=gain;r.resonanceV286826=pool-gain;return gain;
}
function romanceGuideV286826(ev,r){
 const checks=[r.affection>=ev.threshold,hasReachedRealm(ev.levelRequired||0),player.storyProgress>=(ev.storyRequired||0)];
 const ch=STORY_CHAPTERS[ev.storyRequired||0],esc=escapeGameText;
 return `<section><h4>下一段：${esc(ev.title)}</h4><p>${checks[0]?'✓':'待完成'} 好感 ${r.affection}/${ev.threshold} · ${checks[1]?'✓':'待完成'} ${esc(CULTIVATION_REALMS[ev.levelRequired||0].name)} · ${checks[2]?'✓':'待完成'} 旧地点剧情「${esc(ch?.title||'当前章节')}」</p><p>${checks.filter(Boolean).length>=2?'已满足三项中的两项以上，继续完成剩余条件即可。':'重逢按顺序推进；共鸣不会代替经历。'}${!checks[2]?' 请返回地图的剧情地点，继续旧地点故事（与27项任务主线的章号不同）。':''}${!checks[0]?' 可交谈或赠礼提升好感。':''}${!checks[1]?' 请先修炼突破对应境界。':''}</p></section>`;
}
function choiceNoteV286826(id){
 return ({main_09:'【关系选择】驻足好感+2；中立搭话好感+1并留下顾承渊态度记录；离开无额外加成。三路均继续主线。',main_11:'【关系选择】答应保密可开启「君子之约」，拒绝仍可继续主线。',main_12:'【心境抉择】释然降低执念8点；沉默保留。执念会改变照心台、宿敌相谈的心境对白，不锁结局。'})[id]||'【心境抉择】此选择将记入个人道心行纪，改变回应与回顾；本章奖励和后续主线顺序相同。';
}
function storyMailTargetV286826(){
 return JOURNEYS_V2838.find(j=>player.tasks?.completed?.includes(j.requires)&&!player.tasks?.completed?.includes(j.id));
}
function storyMailCardV286826(){
 const j=storyMailTargetV286826();if(!j)return '';
 const last=player.storyMailV286826,now=Date.now(),same=last?.id===j.id;
 const ready=!same||Number.isFinite(last.at)&&now-last.at>=86400000;
 return `<article class="task-card"><h3>传讯符 · ${escapeGameText(j.place)}</h3><p>${same?escapeGameText(last.text||'旧信已收入案卷。'):'前章的线索已送往下一站；修炼期间可以先收取来信。'}</p><p>下一站：${escapeGameText(j.title)} · ${escapeGameText(CULTIVATION_REALMS[j.level].name)}。传讯不要求达到挑战境界，不自动推进任务。</p><button class="task-action" onclick="readStoryMailV286826()" ${ready?'':'disabled'}>${same?'查收后续传讯（现实24小时一封）':'收取前站来信'}</button></article>`;
}
function readStoryMailV286826(){
 if(!taskInteractionAllowedV2822())return false;
 const j=storyMailTargetV286826();if(!j)return false;
 const old=player.storyMailV286826,now=Date.now();if(old?.id===j.id&&(!Number.isFinite(old.at)||now-old.at<86400000))return false;
 const n=old?.id===j.id?((Number(old.index)||0)+1)%3:0;
 const previous=JOURNEYS_V2838[JOURNEYS_V2838.indexOf(j)-1];
 const texts=[`前站传讯：去往${j.place}的联络已接上。先稳固修为，动身前可翻阅纪事核对来路。`,
 `苏晚晴：这里仍有人继续查访，不必把所有事一肩扛着。${previous?investigationV286823(previous.id).hook:'先前补给灵脉已守住，残缺魔典仍需追查。'}`,
 '前线回信：暂无能坐实的新证据。请记住，传闻不是定案；待你抵达后，再亲自核对人证与旧账。'];
 player.storyMailV286826={id:j.id,at:now,index:n,text:texts[n]};
 if(!saveGame()){player.storyMailV286826=old;showFloatingText('传讯未能保存，请重试','#ff8a80');return false;}
 renderTaskList('main');return true;
}
const POST_CASE_V286826=[
 ['旧关对簿','你回到三界旧关，核对归人渡牌与雨夜案卷。另三人仍待寻回，其中一人是替你们盖过借印章的录事；另两人的下落仍无人证实。重复编号只能证明转运链相连，尚不能指认买家。'],
 ['照心复验','你请守台者复验归人的记忆。被剥离的片段需要当事人自愿辨认，不能用另一段强加的记忆填补。夜无疆确认残篇曾被盗用，却拒绝把猜测写成证词。'],
 ['三方封存','你将渡牌、证言与残页分别交三方封存，约定后续证据必须可互相核验。造桥者仍未现身；本轮巡查告一段落，等待新的实证，而不是宣布旧案已破。']
];
function postCaseOpenV286826(){return player.level>=16&&player.tasks?.completed?.includes('main_19')&&rainStateV286822().step>=13;}
function postCaseCardV286826(){
 if(!postCaseOpenV286826())return '';
 const n=Math.max(0,Math.min(3,Number(player.postCaseV286826?.step)||0));
 return `<article class="task-card"><h3>三界旧关 · 巡天查案</h3><p>后传序引 ${n}/3 · 现实每日推进一节，只有案卷记录，无重复资源奖励。</p><button class="task-action" onclick="showPostCaseV286826()">${n===3?'回看巡查案卷':'前往旧关核查'}</button></article>`;
}
let postCaseSessionV286826=null;
function showPostCaseV286826(){
 if(!postCaseOpenV286826()||!taskInteractionAllowedV2822())return;
 closeTaskPanel();const n=Math.max(0,Math.min(3,Number(player.postCaseV286826?.step)||0));
 const el=document.createElement('div');document.getElementById('postCaseV286826')?.remove();el.id='postCaseV286826';el.className='journey-overlay-v2838';
 const session={owner:player,step:n,el};postCaseSessionV286826=session;
 el.innerHTML=`<section class="journey-prepare-v2838"><h2>三界旧关 · 巡天查案</h2>${POST_CASE_V286826.slice(0,Math.min(3,n+1)).map(([title,text],i)=>`<h3>${title}</h3><p>${postCaseTextV286827(text,i)}</p>`).join('')}<p>每节完成后需间隔现实24小时。三方还需互证，勿仅凭残页断定幕后之人。</p>${n<3?'<button data-case="record">核验并收入案卷</button>':''}<button data-case="back">返回任务</button></section>`;
 el.onclick=e=>{const a=e.target.closest('[data-case]')?.dataset.case;if(postCaseSessionV286826!==session||session.owner!==player||document.getElementById(el.id)!==el||!taskInteractionAllowedV2822())return;
 if(a==='back'){el.remove();postCaseSessionV286826=null;showTaskPanel('main');}
 if(a==='record'&&recordPostCaseV286826(session)){el.remove();showPostCaseV286826();}};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){el.remove();postCaseSessionV286826=null;}else trapJourneyFocusV2838(e,el);};document.body.appendChild(el);el.querySelector('button')?.focus();
}
function recordPostCaseV286826(session){
 if(session!==postCaseSessionV286826||session?.owner!==player||document.getElementById('postCaseV286826')!==session.el||!postCaseOpenV286826()||!taskInteractionAllowedV2822())return false;
 const old=player.postCaseV286826,n=Number(old?.step)||0,now=Date.now();
 if(n!==session.step||n>=3)return false;
 if(n>0&&(!Number.isFinite(old.at)||now-old.at<86400000)){showFloatingText('证言仍在复核，请在上次核验24小时后回来');return false;}
 player.postCaseV286826={step:n+1,at:now};if(!saveGame()){player.postCaseV286826=old;showFloatingText('案卷未保存，请重试');return false;}return true;
}
function prepareStoryBossV286826(enemy){
 if(!taskInteractionAllowedV2822())return;
 const owner=player,el=document.createElement('div');document.getElementById('storyBossPrepV286826')?.remove();el.id='storyBossPrepV286826';el.className='journey-overlay-v2838';
 el.innerHTML=`<section class="journey-prepare-v2838"><h2>${escapeGameText(enemy.name)} · 战术部署</h2><p>雷痕可结阵护体，魔气收束处则是护甲罩门。观察不消耗资源，选定后立即开战。</p><button data-prep="guard">查雷痕 · 前两回合12%气血护盾</button><button data-prep="breach">查罩门 · 本场敌方防御降低15%</button><button data-prep="none">直接迎战</button><button data-prep="back">暂退整备</button></section>`;
 el.onclick=e=>{const plan=e.target.closest('[data-prep]')?.dataset.prep;if(!['guard','breach','none','back'].includes(plan)||owner!==player||document.getElementById(el.id)!==el||!taskInteractionAllowedV2822())return;
 el.remove();if(plan==='back')return;
 startCombat(enemy,true,false);if(currentEnemy!==enemy||gameState!=='combat')return;
 if(plan==='guard')elementGuardsV286818.set(enemy,{owner:player,pool:Math.floor(getMaxHp()*.12),turns:2});
 if(plan==='breach')enemy.def=Math.floor(enemy.def*.85);
 addCombatLog(plan==='guard'?'辟邪雷阵护身，前两回合生效。':plan==='breach'?'已找准罩门，敌方防御降低15%。':'你选择正面迎战。','gold');updateCombatUI();};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape')el.remove();else trapJourneyFocusV2838(e,el);};document.body.appendChild(el);el.querySelector('button')?.focus();
}
function tickRivalOriginV286826(e){
 const s=e?._originV286826;if(!s||e!==currentEnemy||gameState!=='combat'||e.hp<=0)return;
 s.turns++;if(s.turns<=3){addCombatLog(`魔典燃源 ${s.turns}/3：攻击+10%，防御+25%；撑过三次敌方行动后本源崩裂。`,'boss');return;}
 if(!s.collapsed){s.collapsed=true;addCombatLog('道基崩裂：夜无疆攻击+20%、无法回生，每次行动前自损最大气血4%；自损不会直接击败他。','boss');}
 const loss=Math.min(Math.max(0,e.hp-1),Math.max(1,Math.floor(e.maxHp*.04)));e.hp-=loss;
 if(loss){showDamageNumber(loss,'enemy',false,false,false,false,'本源裂痕');addCombatLog(`本源裂痕：夜无疆自损 ${loss} 气血。`,'damage');}updateCombatUI();
}

function normalizeNarrativeV286826(p){
 const mail=p.storyMailV286826;
 if(mail&&JOURNEYS_V2838.some(j=>j.id===mail.id)&&Number.isFinite(mail.at))p.storyMailV286826={id:mail.id,at:Math.max(0,mail.at),index:Math.max(0,Math.min(2,Math.floor(Number(mail.index)||0))),text:String(mail.text||'').slice(0,800)};
 else delete p.storyMailV286826;
 const c=p.postCaseV286826;
 if(c&&Number.isFinite(c.step)&&Number.isFinite(c.at))p.postCaseV286826={step:Math.max(0,Math.min(3,Math.floor(c.step))),at:Math.max(0,c.at)};
 else delete p.postCaseV286826;
}

// V28.68.29 · Optional story expansion, separate from the 27 main-task IDs.
const EXPANSION_SCENES_V286827=[
 {id:'rumor_gu',title:'顾承渊 · 风声之后',requires:'main_12',when:()=>player.tasks?.choices?.main_11==='refuse',body:'顾承渊把一张写着自己出身的纸放到桌上：“流言未必从你这里开始。但你说不愿替我保密时，我就该准备亲自回答。”他没有索要道歉，只请你别替苏晚晴决定她该听见什么。',choices:[['listen','听他自己说明','你听完，没有替传言添一笔。顾承渊说：“以后有话，我们当面说。”'],['clarify','说明拒绝不等于散播','他点头：“我不把所有风声算在你头上。可她若来问，我也不会再隐瞒。”']]},
 {id:'rumor_su',title:'苏晚晴 · 旁人说起的名字',requiresScene:'rumor_gu',body:'苏晚晴从药庐来：“顾师兄的出身，我听人说了。他也亲口确认过。让我介意的不是他有一位大长老祖父，而是人人都以为应该替我安排知道真相的时机。”',choices:[['hear','听她的想法','她说：“我会自己判断他，也会自己判断我们。”秘密公开没有替任何人决定感情。'],['respect','承认她有知情与选择的权利','你没有借机评判顾承渊。苏晚晴把话题转回药工的安置：眼前还有事要一起做。']]},
 {id:'reflection',title:'苏晚晴 · 药庐自省',requires:'main_12',level:3,when:()=>{const a=player.romance?.npcs?.suwanqing?.affection;return a>=40&&a<=70&&rainStateV286822().step>=13;},hint:'金丹、完成真相坦白与雨夜卷一，好感40—70',exp:80,body:'苏晚晴逐页核对二十七份命牌记录：“他们被别人写成死人。我当年虽没有害人，却也曾试图用一句诀别，把凡尘都关在门外。”她停笔：“我不能把今天救的人，当作旧日伤人的抵账。”',choices:[['comfort','开导她：承担以后，不替过去销账','她把不确定的死因留白，决定逐一问过家属。你们没有因此复合，只学会不急着替伤口下结论。'],['stay','安静陪她核对卷宗','你添了灯油，陪她写到天明。她没有要一句原谅，你也没有用沉默惩罚她。']]},
 {id:'encounter',title:'药庐偶遇 · 月魄兰',requires:'main_09',body:'顾承渊送来的月魄兰放在门外，苏晚晴说眼下不想接受私礼。他没有把花推回她怀里：“那便按药庐规矩，作公用药材登记。若也不合适，我带走。”你恰好来问下一批药的去向。',choices:[['work','一起核对公用药材','三人谈的是用药名单。顾承渊不再借公务追问她的心意，苏晚晴也不必用收礼表示承诺。'],['leave','留出谈话的空间','你告辞时，听见他说：“答复可以慢慢想，不答复也可以。”没有人因此赢过谁。']]},
 {id:'su_reply',title:'苏晚晴 · 自己的答复',requiresScene:'encounter',when:()=>player.romanceProgress?.endingType==='release',body:'苏晚晴告诉你，她与顾承渊谈过了。“我没有把和你分开，变成必须接受另一个人的理由。”你问她打算怎样回答。她说，先把双方的期待讲明白，比急着给关系取名更要紧。',choices:[['friend','听她说起同门之谊','她暂不接受追求；顾承渊仍来药庐协办公务。相处没有被迫中断，也没有被改写成情侣。'],['time','尊重她保留答复的时间','她明确请顾承渊不要等一个保证。他答应继续自己的生活。往后如何，留给他们自己决定。']]},
 {id:'ye_pages',title:'夜无疆番外 · 残页余响',requires:'main_19',level:16,body:'夜无疆把散落各处的逆天魔典残页列成一张短单。“裂痕补不回去。但不能让下一人只看见破阵之力，看不见代价。”他仍是半圣，没有求你寻找灵药。',choices:[['help','协助追查残页','你们封存一处抄本。他说起最初那座阵：阵中有同族，也有被迫守阵的人。他当年只问如何打碎，后来才学会问碎片会落在谁身上。'],['watch','不同行，留下联络之约','他独自远行。后来书信只写追回几页、仍缺几页，没有凯歌。你将他的独行背影记入纪事。']]},
 {id:'ye_gate',title:'夜无疆番外 · 旧关回望',requires:'journey_08',level:14,body:'旧关重新有了车马声。夜无疆看着归人：“我破过许多阵，却不能替一个失去记忆的人说出家在哪里。力量能让路打开，不能命令人忘掉路上的事。”',choices:[['ask','问他怎样面对无法弥补的事','“先别把它写成已经弥补。”他答。你们把空白名册留给归人自己填写，而不是写一份好看的战功。'],['walk','陪他走过归人的队伍','有人认出他，后退了一步。他没有要求感激，只侧身让路。这段沉默比一次论道更长。']]},
 {id:'ji_ash',title:'姬红绫 · 灰营余声',requires:'journey_03',level:8,exp:100,body:'姬红绫邀你重访灰营。药工中有人想返乡，有人怕再被旧主人找到。她把两份名册分开放：“不能因为我们救了他们，就替他们决定往后住在哪里。”',choices:[['home','帮助愿意返乡的人联系亲属','返乡名册只交本人确认的接应者。她说，下次再来，希望听到的不是又一次失踪。'],['settle','帮助留下的人建立药棚','药棚不按阵营分床位。姬红绫留下自己的联络印，却没有把药工收作必须报恩的部属。']]},
 {id:'keeper',title:'守灯人的信',requires:'journey_01',body:'断雪驿寄来一封字迹歪斜的信：屋顶修好了，灯还亮着。守灯人问你若再来，能否顺路带些南方的消息。信里没有灵石，也没有急报。',choices:[['visit','回信约定再访','老人回信说会留一碗热汤。你终于有一次远行，不是为了迎战。'],['letter','替归人捎去家书','几封家书被放进防雪的木匣。名字不只留在碑上，也有人在纸的另一端念起。']]},
 {id:'after_guard',title:'成圣之后 · 山门仍有人来',requires:'main_19',when:()=>player.tasks?.choices?.main_19==='guard',body:'你回到凌霄宗，荒原来的家眷正在登记住处。案头又送来渡牌转运的密报。你成了圣人，粮册仍要逐户核对，失踪者仍要一人一人寻找。',choices:[['stay','留下主持安置，并派人继续查访','山门添了几盏夜灯。守住人间不是一次战斗后的称号，而是次日仍肯起身去做的事。']]},
 {id:'after_wander',title:'成圣之后 · 辞行',requires:'main_19',when:()=>player.tasks?.choices?.main_19==='wander',body:'苏晚晴递来药包：“不论以何种关系同行，有事都请说清。”顾承渊交给你一册可核验的联络地址。姬红绫笑道：“走得远些，也记得回来讲你没想明白的事。”',choices:[['go','带上行记，继续追查造桥者','你没有带走众人替你写好的答案。三界纪事与私人的记忆一同装进行囊，前路仍需亲自问证。']]}
];
const JOURNEY_SIDE_V286827=[
 ['等灯的少年','少年一直问，亲人是不是只要认得灯，就一定能回来。你没有拿一句一定哄他。','陪他写下想说的话','他把信放在灯旁，准备交给下一位归人。','教他修好风灯','他学会换灯芯；等待之外，日子也有了能亲手做的事。'],
 ['无宗籍的过桥人','一个散修将空白宗籍栏翻给你看。他想找工作，不想再被当成哪一宗争执的筹码。','帮他联系渡口差事','他在新渡册旁找到按工记酬的差事。','陪他向掌事说明','掌事记下他的名字。公约尚不能解决所有生计，至少这次有人听完。'],
 ['药工的去留','魔族少年药工不敢说想去哪儿：过去每一次开口，都会被问能偿还什么。','帮他寻找返乡同行者','他带着自己的药箱走出营门，没有按手印许下卖身的诺言。','帮他留下学医','药棚答应先教他识药。留下是他的选择，不是营地换了主人。'],
 ['船夫的新钉','船夫把旧钉收在盒里，说每一枚都记着一回补船。新船好了，旧船却还舍不得拆。','留下旧木作记','旧木刻上船名，摆在候渡棚里。','帮他整理可再用的船料','能用的留下，腐朽的卸下；记住过去，不必把所有重量背上船。'],
 ['工牌上的小名','匠人的女儿只知道父亲的小名。录事说这不够正式，你问是否可以两种都记。','并记本名与家中称呼','她终于能在册页上找到自己认得的父亲。','请家属补写一段生活','册页旁多了一行：他补过云堤，也会做难看的风筝。'],
 ['白旗下的药箱','两名伤员隔着阵营不肯接同一箱药。药工先把用法写给他们看，没有叫谁先低头。','分装药材，尊重疑虑','两人各拿一包，临走时都向药工道了谢。','陪他们核对药方','他们仍未握手，却愿意轮流读出相同的用药时辰。'],
 ['不肯删去的一页','一个后辈想烧掉第一次救人失败的记录。你没有让他当众讲述，只问那一页还想留在哪里。','陪他封存旧页','封条上没有写赎罪，只写了日期。','听他讲完再归还','故事讲完，你把纸还给他；记忆仍属于本人。'],
 ['最后一辆归车','车上的老人反复清点空座，说怕少带了谁。你翻过归册，也有两处无法立刻核实的空白。','陪他核对沿途驿站','未明的座位没有被写成已归，驿站答应继续查访。','先送他回家，再留下寻人地址','他终于下车。余下的等待，由可信的人接着守。']
];
JOURNEY_SIDE_V286827.forEach((a,i)=>EXPANSION_SCENES_V286827.push({id:'local_'+(i+1),title:a[0],requires:'journey_0'+(i+1),body:a[1],choices:[['listen',a[2],a[3]],['act',a[4],a[5]]]}));
MAIN_TASKS.find(t=>t.id==='main_09').steps.at(-1).options.push(['neutral','上前中立搭话 · 询问丹药事务']);
const DISTANT_V286827=[['过去已经过去，不必再提起。','她点头，收起追问。你们仍是同门，不必把每一次相遇都变成旧情的试探。'],['先救人，旧事不必现在谈。','她与你一起安置伤者。并肩可以出于责任，不必被解释成复合。'],['这件事不需要我表态。','苏晚晴答道：“是，我会自己说。”顾承渊没有把你的离开当作谁的胜利。'],['身份是他的事，我不参与感情上的比较。','你记住需要查证的事，没有把家世当作衡量自己的尺。'],['我听见了，但暂时不想重新靠近。','她没有催你原谅。你们约定公事照常，私事留出距离。'],['谢谢你留下；这份援手不必成为感情承诺。','她说救人不是索取承诺。你们一起走出险地，各自认领应承担的事。'],['少年旧事已放下，但我们不必再成为相伴之人。','苏晚晴郑重应下：“以后以知己相待。若需药师，仍可来寻我。”公共主线继续，感情线在此各自安好。']];
ROMANCE_NPCS.suwanqing.events.forEach((ev,i)=>ev.choices.push({text:DISTANT_V286827[i][0],reply:DISTANT_V286827[i][1],delta:0,distantV286827:true}));
function normalizeExpansionV286827(raw){
 const r=raw&&typeof raw==='object'?raw:{},out={scenes:{},romance:{},fragments:[],rain2:{step:0,clues:[],plan:'',ending:''}};
 for(const d of EXPANSION_SCENES_V286827)if(d.choices.some(c=>c[0]===r.scenes?.[d.id]))out.scenes[d.id]=r.scenes[d.id];
 for(const e of ROMANCE_NPCS.suwanqing.events)if(Number.isInteger(r.romance?.[e.id])&&e.choices[r.romance[e.id]])out.romance[e.id]=r.romance[e.id];
 out.fragments=['north','east','immortal_domain'].filter(k=>Array.isArray(r.fragments)&&r.fragments.includes(k));
 const q=r.rain2||{};out.rain2={step:Math.max(0,Math.min(9,Number.isFinite(q.step)?Math.floor(q.step):0)),clues:['seal','route'].filter(k=>Array.isArray(q.clues)&&q.clues.includes(k)),plan:['guard','breach'].includes(q.plan)?q.plan:'',ending:['arrest','rescue','seal'].includes(q.ending)?q.ending:''};return out;
}
function expansionStateV286827(){return normalizeExpansionV286827(player.storyExpansionV286827);}
function expansionSaveV286827(next,exp=0,gold=0){
 const old=player.storyExpansionV286827,beforeExp=player.exp,beforeGold=player.gold;
 player.storyExpansionV286827=normalizeExpansionV286827(next);player.exp+=exp;player.gold+=gold;
 let saved=false;try{saved=saveGame();}catch(_){}if(saved){updateStats();return true;}player.storyExpansionV286827=old;player.exp=beforeExp;player.gold=beforeGold;showFloatingText('案卷未保存，本次选择与奖励未生效，请重试');return false;
}
function sceneUnlockedV286827(d){return !!d&&(!d.requires||player.tasks?.completed?.includes(d.requires))&&(!d.requiresScene||expansionStateV286827().scenes[d.requiresScene])&&player.level>=(d.level||0)&&(!d.when||d.when());}
function recordRomanceV286827(npcId,eventId,option,choice){
 if(npcId!==MAIN_HEROINE_ID)return;const state=expansionStateV286827();state.romance[eventId]=option;player.storyExpansionV286827=state;
 if(choice.distantV286827&&eventId==='second_choice'){
  player.romanceProgress.endingChosen=true;player.romanceProgress.endingType='release';if(player.romance.partner===MAIN_HEROINE_ID)player.romance.partner=null;
  player.romance.npcs.suwanqing.resonanceV286826=0;
 }
}
function expansionCardV286827(){return `<article class="task-card"><h3>行纪拾遗 · 人物与旧案</h3><p>雨夜卷二：${rainTwoUnlockedV286827()?'可追查 · '+expansionStateV286827().rain2.step+'/9':'完成雨夜卷一并达到炼虚后开启'}。人物支线与地方拾遗均为可选内容，不影响27项主线。</p><button class="task-action" onclick="showExpansionV286827()">打开人物与旧案</button><button class="task-action" onclick="showTaskPanel('journal')">总纪事簿</button></article>`;}
let expansionSessionV286827=null;
function closeExpansionV286827(){document.getElementById('expansionV286827')?.remove();expansionSessionV286827=null;}
function expansionModalV286827(title,body,buttons,callback){
 stopNavigationV2830();if(typeof FLAT_WORLD!=='undefined'){FLAT_WORLD.keys={};FLAT_WORLD.target=null;}
 document.getElementById('expansionV286827')?.remove();closeTaskPanel();const el=document.createElement('div');el.id='expansionV286827';el.className='journey-overlay-v2838';el.setAttribute('role','dialog');el.setAttribute('aria-label',title);
 const session={owner:player,el,callback};expansionSessionV286827=session;
 el.innerHTML=`<section class="journey-prepare-v2838"><h2>${escapeGameText(title)}</h2>${body}<div>${buttons.filter(b=>!b[0].startsWith("replay_")).map(([key,label])=>`<button type="button" data-expansion="${key}">${escapeGameText(label)}</button>`).join('')}${buttons.some(b=>b[0].startsWith("replay_"))?`<details><summary>回看已读片段</summary>${buttons.filter(b=>b[0].startsWith("replay_")).map(([key,label])=>`<button type="button" data-expansion="${key}">${escapeGameText(label)}</button>`).join('')}</details>`:''}<button data-expansion="close">暂别此处</button></div></section>`;
 el.onclick=e=>{const k=e.target.closest('[data-expansion]')?.dataset.expansion;if(!k||session!==expansionSessionV286827||player!==session.owner||document.getElementById(el.id)!==el||!taskInteractionAllowedV2822())return;if(k==='close'){el.remove();expansionSessionV286827=null;}else callback(k,session);};
 el.onkeydown=e=>{e.stopPropagation();if(e.key==='Escape'){el.remove();expansionSessionV286827=null;}else trapJourneyFocusV2838(e,el);};document.body.appendChild(el);el.querySelector('button')?.focus({preventScroll:true});el.querySelector('section').scrollTop=0;return session;
}
function showExpansionV286827(){
 if(!taskInteractionAllowedV2822())return;const s=expansionStateV286827(),rows=EXPANSION_SCENES_V286827.filter(d=>sceneUnlockedV286827(d)||s.scenes[d.id]);
 const body='<p>已发生的选择只读回看，不重复领取修为。未开放的故事会列出所需经历。</p>'+EXPANSION_SCENES_V286827.filter(d=>!rows.includes(d)).map(d=>`<details><summary>${escapeGameText(d.title)} · 待开启</summary><p>${escapeGameText(d.hint||('需完成'+(getTaskData(d.requires)?.title||EXPANSION_SCENES_V286827.find(x=>x.id===d.requiresScene)?.title||'相关人物选择')+(d.when?'及对应人物选择':'')))}</p></details>`).join('')+dossierCardV286827();
 expansionModalV286827('行纪拾遗',body,[['mentor','与清玄真人论道'],...(rainTwoUnlockedV286827()?[['rain','雨夜命牌案·卷二 渡牌东流']]:[]),...rows.map(d=>[d.id,(s.scenes[d.id]?'回看 · ':'相遇 · ')+d.title]),...(dossierOpenV286827()?[['fragment','核查当前地域线索'],...(s.fragments.length<3?[['survey','圣念巡天 · 核查三域线索']]:[])]:[])],k=>{if(k==='mentor')showMentorV286827();else if(k==='rain')showRainTwoV286827();else if(k==='fragment'||k==='survey'){if(k==='survey')surveyDossierV2884();else collectFragmentV286827();showExpansionV286827();}else showExpansionSceneV286827(k);});
}
function sceneContextV286827(id){
 const s=expansionStateV286827();let text='';
 if(id==='keeper'||id==='local_1')text=player.tasks?.choices?.journey_01==='home'?'守灯人已收到南域回信：遗物送到了家人手里。':'碑上留着护卫的名字，灯依旧有人照看。';
 if(id==='encounter'&&player.rivalState?.neutralV286827)text+='顾承渊记得药庐外那次三方闲谈，先问你今日来办什么事。';
 if(id.startsWith('ye_'))text+=(player.heartDemon?.attachment>=60?'你仍忍不住想证明自己。他等你把那口气放下，才继续说话。':'你没有急着反驳，愿意先听完他的遗憾。')+(player.romanceProgress?.endingType==='release'?'你想起青石桥：各自安好，也是一种选择。':'')+(player.tasks?.completed?.includes('side_hidden_02')?'你记得与顾承渊的约定，不以出身替人定罪。':'');
 if(id==='after_guard')text+=rainStateV286822().step>=13?'雨夜案中归来的家眷也来登记住处。':'渡口仍有未核实的寻人告示。';
 if(id==='after_wander')text+=player.tasks?.choices?.journey_08==='public'?'你带上公开的三界纪事。':'你带上自己的私人行记。';
 if(id==='local_7'&&player.tasks?.completed?.includes('side_hidden_03'))text+='清玄真人教过你：释然不是删去经历。';return text;
}
function showExpansionSceneV286827(id){
 const d=EXPANSION_SCENES_V286827.find(x=>x.id===id),s=expansionStateV286827(),chosen=s.scenes[id];if(!taskInteractionAllowedV2822()||!d||(!chosen&&!sceneUnlockedV286827(d)))return;
 const body=`<p>${escapeGameText(d.body)}</p><p>${escapeGameText(sceneContextV286827(id))}</p>${chosen?`<p>你的选择：${escapeGameText(d.choices.find(c=>c[0]===chosen)?.[1])}</p><p>${escapeGameText(d.choices.find(c=>c[0]===chosen)?.[2])}</p>`:`<p>【心境抉择】记入行纪，不改变公共主线。${d.exp?'完成一次获得修为'+d.exp+'。':'无额外数值奖励。'}</p>`}`;
 expansionModalV286827(d.title,storyIllustrationV286828("extra",id)+body,chosen?[['back','返回拾遗']]:d.choices.map(c=>c.slice(0,2)),k=>{if(k==='back')showExpansionV286827();else{const next=expansionStateV286827();if(next.scenes[id]||!sceneUnlockedV286827(d)||!d.choices.some(c=>c[0]===k))return;next.scenes[id]=k;if(expansionSaveV286827(next,d.exp||0)){if((id==='after_guard'||id==='after_wander')&&!player.tasks?.epilogueShownV286838)showEpilogueV286838();else showExpansionSceneV286827(id);}}});
}
const RAIN_TWO_TITLES_V286827=['残信再至','寻访幸存者','雷海船队','各方来信','执印使的两道封令','守渡执印使','三个人的去向','把哪一条路留住','渡牌东流 · 结案','卷二完'];
const RAIN_TWO_ENDINGS_V286827={arrest:['扣住执行者，三方封存卷宗','你扣下执印使及这一段船队的转运册，先让归人离船，再封住泊位。三方分别收存副本。船队在此中断，远处另一处接货点却已撤空；被捕者只能说出经手的印号，不能证明最高层是谁。'],rescue:['先救船中人，舍弃追捕窗口','你把仅有的两条小艇用于接人。押船者趁退潮带走部分原册，留下的抄件不足以锁定下一处泊位。归人活着踏上岸，不代表失去的记忆已经回来；这段转运线还需要重查。'],seal:['保全云阙痕迹，等待交叉核验','封蜡的旧版印谱指向云阙一处档案机构，但印章可以被盗用。你将拓片交三方密存，请不同来源继续核验，暂不公开指认。质疑因此落到你身上：为何找到线索，却还不给家属一个名字？你只能如实解释证据边界。']};
function rainTwoUnlockedV286827(){return rainStateV286822().step>=13&&player.level>=6;}
function rainTwoPagesV286827(n,one=rainStateV286822(),q=expansionStateV286827().rain2){
 const policy={public:'幸存者带着当年的公开核查副本来见你，愿意署名作证，但要求先知道证言会交给谁。',protect:'你依约在药庐后院私下见到证人。他们使用化名，不愿让新生活再暴露在渡牌册里。',trace:'宗门保存的监视卷宗记录了三次换船。你没有让守望多年的渡工继续独自追踪。'}[one.policy]||'你重新向幸存者确认，他们是否愿意继续提供证言。';
 return [
 ['旧渡牌的印记再次出现在一封残信上。信里没有求你立刻出剑，只写着东域雷海旧渡的换船时辰。','当年二十七人救回二十四人，另三人被提前带走。这一次，你要追的是他们各自的去向，而不是再找一张盖过章的死亡证明。'],
 [policy,one.route==='rescue'?'沈禾亲自递来旧药瓶。他还记得你在翻船里教他数呼吸，却不愿旁人把那一夜反复当作英雄故事讲。':'沈禾已能亲自讲述当年的经历。他感谢渡工救起自己，也谢谢你留下运输暗号；获救不意味着那些夜里的惊醒会立刻消失。',one.trust==='share'?'苏晚晴沿用与你共享原信的约定，把新证言摊在同一张桌上。':'苏晚晴说：“这次我们先约定，什么能公开、什么须问过本人。”她没有用当年保留原信责备你。'],
 ['雷海旧渡的船并不只装药。失意修士、无军籍工匠、无人来认领的药工，被不同名目写进同一套转运册。','船夫指着可见的近岸水道：远海不是你此行必须闯过的天劫。你可以在渡口截查船队，不必等到渡劫境才来救人。',player.tasks?.completed?.includes('journey_04')?'你认出曾在雷海问舟时见过的封蜡。旧航簿终于能与今日的名单互证。':'船夫留下一页航簿，嘱你以后若查到远海转运，再来核对。这段近岸查访不会代替雷海问舟。'],
 ['姬红绫的信从灰营寄来：“药工没有选择被谁买走。请把他们的去向交还本人。”','夜无疆只送来一段辨认残页的笔记：“有人把抄错的魔典当成取忆的法门。能认出它，不等于能把被剜掉的东西补回来。”',player.tasks?.completed?.includes('side_hidden_02')?'顾承渊依君子之约送来经长老一脉核验的旧印谱：“来源记在这里，别因为是我送的，就少做一次核对。”':'旧印谱由渡口录事按公函调出。没有君子之约也能继续调查，只是没有顾承渊的私人注记。'],
 ['执印使身上的两道封令分别控制护甲与船舱。先查封印，再查撤离航线，才能选定部署。','封印：换印时护甲会短暂失去灵流，可据此破防。航线：候渡木牌能结成护身阵，为开舱争取时间。'],
 ['守渡执印使展开公文：“船上都是册上无主之人。”你把幸存者的署名放在他面前：“人不是因为你的册子才有名字。”','【战术部署】'+(q.plan==='guard'?'前两次敌方行动有12%最大气血护盾。':'敌方防御降低15%。')+'可以暂退补给；失败保留调查，获胜才可开舱。'],
 ['你找到被掳走的录事和另一名药工。录事曾替人盖印，后来因知道换船暗号也被写成失踪；获救不会抹去他该接受的问询。药工能认出家乡，却记不起家人的脸。','第三人未能等到这一日。两份独立交接记录和同船人的证词互相印证，遗物却还没有全部找回。苏晚晴把“已核实的死亡”与“仍不知的细节”分开记录。','舱中还有后来被转运的人。你能救眼前的人，却无法同时封锁所有出海水道。'],
 ['执印使被制住，潮水却正在退。你可以扣住这一段执行链，优先用船艇撤人，或将云阙印谱作为待核线索密存。','【结案选择】三路都会安置已找到的两人，并如实记下第三人的死亡；不同的是追捕窗口、卷宗完整度和公开证据的时机。奖励相同，不锁正式主线。'],
 [RAIN_TWO_ENDINGS_V286827[q.ending]?.[1]||'等待选择结案方式。','最高层买家与造桥者仍未被证实。船上的人有了下一站，这一段旧案有了可以核验的答案；没有谁因此说三万年的战争已经结束。','卷二完成奖励：一次600灵石、300修为。回看不会重复领取。'],
 [RAIN_TWO_ENDINGS_V286827[q.ending]?.[1]||'卷二案卷已收存。','两位失踪者已找回，一人的死亡经多方核实。记忆修复与责任问询都还需要时间。你可以回看全部片段，或回到自己的修行。']
 ][n]||[];
}
const rainTwoFightsV286827=new WeakMap();
function showRainTwoV286827(replay=-1){
 if(!rainTwoUnlockedV286827()||!taskInteractionAllowedV2822())return;const q=expansionStateV286827().rain2,back=Number.isInteger(replay)&&replay>=0&&replay<=q.step,n=back?replay:q.step;
 const buttons=[];if(!back){
 if(n===4){if(q.clues.length<2)buttons.push(['all','一并核查封印与航线']);buttons.push(['seal','调查封印'+(q.clues.includes('seal')?' ✓':'')],['route','调查航线'+(q.clues.includes('route')?' ✓':'')]);if(q.clues.length===2)buttons.push(['guard','布置护身阵 · 12%气血护盾'],['breach','找准换印间隙 · 防御降低15%']);}
 else if(n===5)buttons.push(['fight','准备妥当，挑战执印使']);
 else if(n===7)for(const [key,[label]] of Object.entries(RAIN_TWO_ENDINGS_V286827))buttons.push([key,label]);
 else if(n<9)buttons.push(['next',n===8?'收好卷宗 · 完成卷二':'继续追查']);
 }
 if(back)buttons.push(['resume','返回当前进度']);buttons.push(['back','返回拾遗']);for(let i=0;i<=q.step;i++)buttons.push(['replay_'+i,'回看 · '+RAIN_TWO_TITLES_V286827[i]]);
 const session=expansionModalV286827(`雨夜命牌案·卷二 ${n+1}/10 · ${RAIN_TWO_TITLES_V286827[n]}`,storyIllustrationV286828("rain2",n)+rainTwoPagesV286827(n).map(t=>`<p>${escapeGameText(t)}</p>`).join(''),buttons,(k,ss)=>{if(k==='back')showExpansionV286827();else if(k==='resume')showRainTwoV286827();else if(k.startsWith('replay_'))showRainTwoV286827(Number(k.slice(7)));else actRainTwoV286827(ss,k);});session.rainStep=q.step;session.replay=back;
}
function actRainTwoV286827(session,action){
 if(session!==expansionSessionV286827||session?.owner!==player||session.replay||document.getElementById('expansionV286827')!==session.el||!taskInteractionAllowedV2822()||!rainTwoUnlockedV286827())return false;
 const state=expansionStateV286827(),q=state.rain2;if(session.rainStep!==q.step)return false;
 if(q.step===5&&action==='fight'){
  if(!q.plan||q.clues.length!==2)return false;
  const enemy=balanceEnemyV2802({name:'守渡执印使',hp:660,maxHp:660,atk:67,def:34,gold:0,exp:0,_realmLevel:6,_realmPhase:0,_isTaskBattle:true});
  if(q.plan==='breach')enemy.def=Math.floor(enemy.def*.85);
  session.el.remove();expansionSessionV286827=null;closeWorldOverlay();startCombat(enemy,true,false);
  if(currentEnemy!==enemy||gameState!=='combat')return false;
  rainTwoFightsV286827.set(enemy,{owner:player,step:5,token:COMBAT_FINISH_V2764.token});
  if(q.plan==='guard')elementGuardsV286818.set(enemy,{owner:player,pool:Math.floor(getMaxHp()*.12),turns:2});updateCombatUI();return true;
 }
 let exp=0,gold=0;
 if(q.step===4&&action==='all'){if(q.clues.length===2)return false;q.clues=['seal','route'];}
 else if(q.step===4&&['seal','route'].includes(action)){if(q.clues.includes(action))return false;q.clues.push(action);}
 else if(q.step===4&&q.clues.length===2&&['guard','breach'].includes(action)){q.plan=action;q.step=5;}
 else if(q.step===7&&Object.hasOwn(RAIN_TWO_ENDINGS_V286827,action)){q.ending=action;q.step=8;}
 else if([0,1,2,3,6,8].includes(q.step)&&action==='next'){if(q.step===8){if(!q.ending)return false;exp=300;gold=600;}q.step++;}
 else return false;
 if(!expansionSaveV286827(state,exp,gold))return false;showRainTwoV286827();return true;
}
function finishRainTwoV286827(enemy){
 const r=rainTwoFightsV286827.get(enemy),state=expansionStateV286827();if(!r||r.owner!==player||enemy!==currentEnemy||enemy.hp>0||r.token!==COMBAT_FINISH_V2764.token-1&&r.token!==COMBAT_FINISH_V2764.token||state.rain2.step!==5)return;
 state.rain2.step=6;player.storyExpansionV286827=state;rainTwoFightsV286827.delete(enemy);addCombatLog('执印使已败，回到「人物与旧案」继续开舱问证。','gold');
}
function dossierOpenV286827(){return player.level>=16&&player.tasks?.completed?.includes('main_19');}
const DOSSIER_FRAGMENTS_V286827={north:['北域 · 渡牌编号','相同编号被不同批次反复使用，说明无名册并非一份偶然伪造的账。'],east:['东域 · 船期副本','船期与换印时间相错，运输者只知道上一站与下一站；单个执行者未必知道买家。'],immortal_domain:['仙域 · 旧印登记','旧印有领用、转借与报失记录。云阙痕迹必须分别核实经手者，不能把整座仙阙当作同一个人。']};
function dossierCardV286827(){
 if(!dossierOpenV286827())return '';const s=expansionStateV286827();return `<h3>巡天卷宗 · ${s.fragments.length}/3</h3><p>可前往北域、东域、仙域逐处核查，也可用圣念巡天一并核查三域。收集不消耗资源，不移动角色。</p>${s.fragments.map(k=>`<p>${DOSSIER_FRAGMENTS_V286827[k][0]}：${DOSSIER_FRAGMENTS_V286827[k][1]}</p>`).join('')}${s.fragments.length===3?'<p>【秘密卷宗·现有证据全录】转运链利用伪造死亡隔绝追查，以分段交接隔绝责任。记忆被当成可搬运的货物，残页被当成工具；造桥者借用了这套分工，却尚无足以证明其身份的闭合证据链。此卷证明手段，不替未知者编造姓名。</p>':''}`;
}
function collectFragmentV286827(){
 if(!dossierOpenV286827()||!taskInteractionAllowedV2822()||!Object.hasOwn(DOSSIER_FRAGMENTS_V286827,currentRegion)){showFloatingText('请先到北域、东域或仙域核查');return false;}
 const s=expansionStateV286827();if(s.fragments.includes(currentRegion))return false;s.fragments.push(currentRegion);return expansionSaveV286827(s);
}
function surveyDossierV2884(){
 if(!dossierOpenV286827()||!taskInteractionAllowedV2822())return false;
 const next=expansionStateV286827();if(next.fragments.length===3)return false;
 next.fragments=Object.keys(DOSSIER_FRAGMENTS_V286827);
 if(!expansionSaveV286827(next))return false;
 showFloatingText('圣念巡天：三域线索已核查，可在卷宗中逐条阅读。','#ffd700');return true;
}
// A terminal-story preview uses local copies only: no rewriting history or replaying rewards.
function showStoryEchoV2885(draft={}){
 if(!taskInteractionAllowedV2822()||!player.tasks?.completed?.includes('main_19'))return false;
 const done=JOURNEYS_V2838.filter(j=>player.tasks.completed.includes(j.id)),one=rainStateV286822(),two=expansionStateV286827().rain2,esc=escapeGameText;
 const links=done.map(j=>['journey:'+j.id,j.title]);if(one.step===13)links.push(['rain1','雨夜卷一 · 选择回响']);if(two.step===9)links.push(['rain2','雨夜卷二 · 结案回响']);
 let body='<p>此处只预览另一种选择的剧情，不改写真实约定、人物关系、任务进度或奖励。关闭后仍沿用原存档。</p>',buttons=[],next={...draft};
 const paras=xs=>xs.map(t=>`<p>${esc(t)}</p>`).join('');
 if(draft.kind==='journey'){
  const j=done.find(j=>j.id===draft.id);if(!j)return false;const choice=j.choices.find(c=>c[0]===draft.choice)||j.choices[0];next.choice=choice[0];
  body+=`<h3>${esc(j.title)}</h3><p>真实约定：${esc(j.choices.find(c=>c[0]===player.tasks.choices?.[j.id])?.[1]||'旧记录未保存具体选择')}</p>`+paras(j.ending.map(x=>x.join('：')))+`<h4>预览 · ${esc(choice[1])}</h4><p>${esc(j.outcomes[choice[0]])}</p>`;
  buttons=j.choices.map(c=>['choice:'+c[0],(c[0]===choice[0]?'✓ ':'')+c[1]]);
 }else if(draft.kind==='rain1'&&one.step===13){
  const fields={route:[['rescue','先救人'],['chase','先追踪']],trust:[['share','交出原信'],['reserve','暂留原信']],policy:[['public','公开核查'],['protect','保护证人'],['trace','继续追踪']]};
  const preview={...one};for(const [k,opts] of Object.entries(fields)){preview[k]=opts.some(c=>c[0]===draft[k])?draft[k]:one[k]||opts[0][0];next[k]=preview[k];buttons.push(...opts.map(c=>[k+':'+c[0],(preview[k]===c[0]?'✓ ':'')+c[1]]));}
  body+='<h3>雨夜卷一 · 预览回响</h3><p>真实结案：'+esc(rainSummaryV286822(one))+'</p>'+[3,7,10,13].map(n=>`<details ${n===13?'open':''}><summary>${esc(RAIN_TITLES_V286822[n])}</summary>${paras(rainNarrativeV286822(n,preview))}</details>`).join('');
 }else if(draft.kind==='rain2'&&two.step===9){
  const ending=Object.hasOwn(RAIN_TWO_ENDINGS_V286827,draft.ending)?draft.ending:two.ending||'arrest';next.ending=ending;
  body+='<h3>雨夜卷二 · 结案预览</h3><p>真实结案：'+esc(RAIN_TWO_ENDINGS_V286827[two.ending]?.[0]||'旧记录未保存具体选择')+'</p>'+paras(rainTwoPagesV286827(9,one,{...two,ending}));buttons=Object.entries(RAIN_TWO_ENDINGS_V286827).map(([k,c])=>['ending:'+k,(k===ending?'✓ ':'')+c[0]]);
 }else {next={};body+='<p>选择已完成的章节，查看不同约定或结案的原有文本。</p>';buttons=links;}
 if(next.kind)buttons.push(['menu','返回溯回目录']);buttons.push(['journal','返回总纪事簿']);
 expansionModalV286827('道心溯回',body,buttons,k=>{
  if(!player.tasks?.completed?.includes('main_19'))return;
  if(k==='journal'){closeExpansionV286827();showTaskPanel('journal');return;}
  if(k==='menu')return showStoryEchoV2885();
  if(k.startsWith('journey:'))return showStoryEchoV2885({kind:'journey',id:k.slice(8)});
  if(k==='rain1'||k==='rain2')return showStoryEchoV2885({kind:k});
  const [field,value]=k.split(':');if(['choice','route','trust','policy','ending'].includes(field))showStoryEchoV2885({...next,[field]:value});
 });return true;
}
function chronicleV286827(){
 const s=expansionStateV286827(),esc=escapeGameText,rows=[];
 for(const t of MAIN_TASKS){const chosen=player.tasks?.choices?.[t.id];if(chosen){const label=t.steps.find(x=>x.action==='choice')?.options?.find(x=>x[0]===chosen)?.[1];rows.push(`${t.title}：${label||'历史选择'}${t.id==='main_09'&&chosen==='neutral'?' · 药庐外三方闲谈':''}`);}}
 const journeys=JOURNEYS_V2838.filter(j=>player.tasks?.completed?.includes(j.id));
 const journeyText=journeys.map(j=>`${j.title}：${j.outcomes[player.tasks?.choices?.[j.id]]||'已完成，旧档未保存具体选项。'}`);
 for(const e of ROMANCE_NPCS.suwanqing.events)if(player.romance?.npcs?.suwanqing?.events?.includes(e.id)){const c=e.choices[s.romance[e.id]];rows.push(`${e.title}：${c?c.text+' → '+c.reply:'已发生；旧存档未保存当时选项，不代为猜测。'}`);}
 const ye=yeStateV2816();yeChaptersV2816().forEach((c,i)=>{if(ye.choices[i]===0||ye.choices[i]===1)rows.push(`${c.title}：${c.options[ye.choices[i]]} → ${c.responses[ye.choices[i]]}`);});
 for(const d of EXPANSION_SCENES_V286827){const c=d.choices.find(x=>x[0]===s.scenes[d.id]);if(c)rows.push(`${d.title}：${c[1]} → ${c[2]}`);}
 for(const t of SIDE_TASKS.filter(t=>t.type==='hidden'))if(player.tasks?.completed?.includes(t.id))rows.push(t.title+'：'+t.desc+'（已完成）');
 if(rainStateV286822().step>=13)rows.push('雨夜卷一：'+rainSummaryV286822()+(rainStateV286822().trust==='share'?'；曾交出原信。':'；曾暂留原信。'));
 if(s.rain2.step===9)rows.push('雨夜卷二：'+(RAIN_TWO_ENDINGS_V286827[s.rain2.ending]?.[1]||'已完成，旧记录缺少具体结案方式。'));
 return `<section class="main-overview-v2822"><h3>总纪事簿</h3>${player.tasks?.completed?.includes('main_19')?'<button type="button" class="task-action" onclick="showStoryEchoV2885()">道心溯回 · 预览其他分支</button>':''}<p>从现有存档重建；未知的旧选项保留空白，回看不改变选择或奖励。</p><details><summary>三界行旅纪事 · ${journeys.length}/8</summary>${journeyText.map(t=>`<p>${esc(t)}</p>`).join('')}</details><details><summary>人物、旧案与主线选择 · ${rows.length}条</summary>${rows.map(t=>`<p>${esc(t)}</p>`).join('')}</details>${dossierCardV286827()}<button class="task-action" onclick="showExpansionV286827()">人物与旧案</button></section>`;
}
const scenePagesBeforeV286827=scenePagesV2838;
scenePagesV2838=function(id,action){const pages=scenePagesBeforeV286827(id,action).map(row=>row.slice());
 if(id==='journey_07'&&action.endsWith('_open'))pages.push(['内心独白',player.heartDemon?.attachment>=60?'你仍想删去失败，证明自己从未被抛下。旧影没有反驳，只等你承认：不愿回看的事，也真实发生过。':'你不再急着证明没有遗憾。承认没有做到的事，也可以继续向前。']);
 if(id==='journey_07'&&player.tasks?.completed?.includes('side_hidden_03'))pages.push(['清玄旧语','你想起清玄真人的指点：执念放下了，不等于经历被抹去。']);
 if(['main_08','main_14'].includes(id)&&player.tasks?.completed?.includes('side_hidden_02'))pages.push(['顾承渊','“只凭本事，也不必凡事争输赢。”他把可以核验的消息交给你，没有用家世要你领情。']);
 return pages;};
const choiceBeforeV286827=onChoiceMade;
onChoiceMade=function(id,option){const i=getTaskInstance(id),pending=i&&!i.completed;const result=choiceBeforeV286827.apply(this,arguments);if(id==='main_19'&&pending&&i.completed&&player.tasks.choices[id]===option)showExpansionSceneV286827(option==='guard'?'after_guard':'after_wander');return result;};
function relationshipTextV286827(text){return expansionStateV286827().scenes.rumor_su?String(text).replace('连苏晚晴也一直被蒙在鼓里','苏晚晴已经从流言与他的亲口确认中得知').replace('苏晚晴也不知道。我希望她看见的只是顾承渊。','苏晚晴已经知道。我仍希望她看见的是顾承渊本人。'):text;}
function postCaseTextV286827(text,index){if(index===0&&expansionStateV286827().rain2.step===9)return '你在旧关重核渡牌东流卷宗：两人找回，一人的死亡已有互证；不能把过去的空白继续当作今日的失踪记录。新的转运批号仍在流动，追查没有结束。';return text;}

function showMentorV286827(){
 if(!taskInteractionAllowedV2822())return;
 const text=player.level>=16?'清玄真人不再问你修为到了哪一步。他把新来的求援信放在桌上：“你如今能被人称作仙。可何为仙，仍要从这一封封信里回答。”':player.level>=3?'清玄真人看过你带回的卷宗：“金丹已成，不等于每件事都看得比别人清楚。强者的猜测，更该容别人质疑。”':'清玄真人等你把呼吸调匀：“先学会走自己的路，也看一看路旁的人。入山不是从此与凡尘两清。”';
 expansionModalV286827('清玄真人 · 此刻的问道',`<p>${text}</p><p>这是当下的相谈，旧日纪事仍保留当年的称谓。</p>`,[['back','返回拾遗']],k=>{if(k==='back')showExpansionV286827();});
}

function showEpilogueV286838(){
 if(!player?.tasks?.completed?.includes('main_19')||!taskInteractionAllowedV2822())return;
 const esc=escapeGameText,mains=MAIN_TASKS.filter(t=>player.tasks.completed.includes(t.id)).length;
 const achieved=typeof completedAchievements!=='undefined'?completedAchievements.size:0,allAch=Object.keys(ACHIEVEMENTS||{}).length;
 const path=player.tasks.choices?.main_19==='guard'?'你选择留在凌霄宗，守着山门与荒原来的人。':'你选择辞行远游，把答案带往更远的地方。';
 if(!player.tasks.epilogueShownV286838){player.tasks.epilogueShownV286838=true;autoSave?.();}
 const body=`<p>旧日高悬一境的宿敌终于停在身后。三万年的战争没有因你成圣而结束，但这一程，你已经用自己的道作答。</p><p>${esc(path)}</p>`+
  `<dl class="epilogue-stats-v286838"><dt>道号</dt><dd>${esc(player.name||'无名')}</dd><dt>境界</dt><dd>${esc(getCultivationName())}</dd><dt>仙历</dt><dd>${esc(getGameDateLabel())}</dd><dt>主线</dt><dd>${mains} / ${MAIN_TASKS.length} 章</dd><dt>成就</dt><dd>${achieved} / ${allAch}</dd></dl>`+
  '<p>《仙途》主线到此完结，感谢一路同行。之后仍可继续修炼、游历、参加宗门大比，或在「拾遗」中回看番外。</p>';
 expansionModalV286827('终章 · 道途圆满',body,[['continue','继续自由修炼'],['expansion','查看拾遗与番外']],k=>{if(k==='continue'){document.getElementById('expansionV286827')?.remove();expansionSessionV286827=null;}else if(k==='expansion')showExpansionV286827();});
}

function recoveryPlanV2875(){
 const bag=getCombatConsumables().filter(i=>Number.isFinite(i.value)&&i.value>0),used={},target={hp:player.hp,mp:player.mp};
 for(const [type,key,max] of [['heal','hp',getMaxHp()],['mp','mp',getMaxMp()]]){
  let need=Math.max(0,max-target[key]);const list=bag.filter(i=>i.type===type).map(i=>({...i}));
  while(need>0){const available=list.filter(i=>i.count>0).sort((a,b)=>a.value-b.value),pill=available.find(i=>i.value>=need)||available.at(-1);if(!pill)break;const count=Math.min(pill.count,Math.ceil(need/pill.value));pill.count-=count;used[pill.name]=(used[pill.name]||0)+count;const gain=Math.min(need,pill.value*count);target[key]+=gain;need-=gain;}
 }
 return {used,...target};
}
function recoverAfterBattleV2875(owner,el){
 const valid=()=>player===owner&&gameState==='exploring'&&!player.breakthrough?.isAnimating&&document.getElementById('afterBattleV2838')===el;
 if(!valid())return false;const plan=recoveryPlanV2875();if(!Object.keys(plan.used).length){showFloatingText('无需恢复或没有可用恢复丹药，可选择寻找补给','#ffd76a');return false;}
 const before=JSON.stringify(player),stats=[getMaxHp(),getMaxMp()].join(',');
 if(!confirm(`消耗${Object.entries(plan.used).map(([k,v])=>k+'×'+v).join('、')}，气血恢复至${plan.hp}/${getMaxHp()}，灵力恢复至${plan.mp}/${getMaxMp()}？库存不足时仅部分恢复。`)||!valid()||before!==JSON.stringify(player)||stats!==[getMaxHp(),getMaxMp()].join(','))return false;
 const left={...plan.used};player.inventory=player.inventory.filter(n=>{if(left[n]>0){left[n]--;return false;}return true;});player.hp=plan.hp;player.mp=plan.mp;
 try{if(!saveGame())throw Error('save failed');}catch(_){for(const k of Object.keys(owner))delete owner[k];Object.assign(owner,JSON.parse(before));if(owner.activePet?._petId)owner.activePet=owner.pets.find(p=>p._petId===owner.activePet._petId)||null;showFloatingText('保存失败，丹药与状态已恢复','#ff8a80');return false;}
 updateStats();updateWorldHUD();playSound('item');el.querySelector('[data-after-status]').textContent=`气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}`;showFloatingText('已服丹调息','#69f0ae');return true;
}
