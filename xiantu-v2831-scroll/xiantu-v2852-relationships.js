/* Finite authored stories, per-save choices and bounded memories. Compatible with V28.50 npc decisions. */
const RELATIONSHIPS_V2852={screen:null,normalized:new WeakSet(),counter:0};
const relationshipEscV2852=s=>discipleEscV2815(String(s??''));
function relationshipSceneV2852(id,sid){
  const npc=RELATIONSHIP_STORIES_V2852.npcs[id];if(!npc)return null;
  for(const arc of npc.arcs){const index=arc.scenes.findIndex(s=>s.id===sid);if(index>=0)return {arc,index,scene:arc.scenes[index],previous:index?arc.scenes[index-1]:null};}return null;
}
function relationshipIntV2852(v,max=1000000){return Math.max(0,Math.min(max,Math.floor(Number(v)||0)));}
function relationshipSeedV2852(){
  try{const a=new Uint8Array(8);crypto.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');}catch(_){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)+'-'+(++RELATIONSHIPS_V2852.counter);}
}
function normalizeRelationshipsV2852(old){
  const value={version:1,seed:typeof old?.seed==='string'&&/^[a-z0-9-]{6,64}$/i.test(old.seed)?old.seed:relationshipSeedV2852(),npcs:{}};
  for(const [id,data] of Object.entries(RELATIONSHIP_STORIES_V2852.npcs)){
    const saved=old?.npcs?.[id],n={scenes:{},chats:[],counts:{}};
    for(const arc of data.arcs)for(const s of arc.scenes){const r=saved?.scenes?.[s.id];if(r&&Number.isInteger(r.choice)&&r.choice>=0&&r.choice<3&&Number.isInteger(r.tone)&&r.tone>=0&&r.tone<3)n.scenes[s.id]={choice:r.choice,tone:r.tone,day:relationshipIntV2852(r.day,1e9),source:r.source==='jev'?'jev':'local',gain:relationshipIntV2852(r.gain,2)};}
    for(const topic of Object.keys(data.chats))n.counts[topic]=relationshipIntV2852(saved?.counts?.[topic]);
    if(Array.isArray(saved?.chats))for(const r of saved.chats.slice(-12)){
      if(!r||!Object.hasOwn(data.chats,r.topic)||!Number.isInteger(r.stage)||r.stage<0||r.stage>3||!Number.isInteger(r.variant)||r.variant<0||r.variant>1||!Number.isInteger(r.tone)||r.tone<0||r.tone>2)continue;
      const memory=relationshipSceneV2852(id,r.memory);n.chats.push({topic:r.topic,stage:r.stage,variant:r.stage===3?0:r.variant,tone:r.tone,day:relationshipIntV2852(r.day,1e9),source:r.source==='jev'?'jev':'local',memory:memory&&n.scenes[r.memory]?r.memory:'',warMoment:Number.isInteger(r.warMoment)&&r.warMoment>=0&&r.warMoment<=3?r.warMoment:null});
    }
    value.npcs[id]=n;
  }
  RELATIONSHIPS_V2852.normalized.add(value);return value;
}
function relationshipsStateV2852(){
  if(!RELATIONSHIPS_V2852.normalized.has(player.relationshipStoriesV2852))player.relationshipStoriesV2852=normalizeRelationshipsV2852(player.relationshipStoriesV2852);
  return player.relationshipStoriesV2852;
}
function relationshipNpcV2852(id){return relationshipsStateV2852().npcs[id];}
function relationshipAllowedV2852(id){return !!RELATIONSHIP_STORIES_V2852.npcs[id]&&jevCanActV2846()&&!!player.romance?.npcs?.[id]&&hasReachedRealm(ROMANCE_NPCS[id].unlockLevel);}
function relationshipNeutralV2852(id){return !!(player.romance.partner&&player.romance.partner!==id)||(id==='suwanqing'&&player.romanceProgress?.endingType==='release');}
function relationshipStageV2852(id){
  if(relationshipNeutralV2852(id))return 0;
  if(player.romance.partner===id)return 3;
  const r=player.romance.npcs[id];let stage=r.affection>=60?2:r.affection>=25?1:0;
  if(id==='suwanqing'&&!r.events.includes('truth_and_apology'))stage=Math.min(stage,1);
  return stage;
}
function relationshipTonesV2852(id){
  if(relationshipNeutralV2852(id))return [0,1];
  return player.romance.npcs[id].affection>=40&&relationshipStageV2852(id)>=1?[0,1,2]:[0,1];
}
function relationshipLockV2852(id,sid){
  const item=relationshipSceneV2852(id,sid);if(!item)return ['剧情不存在'];
  const {scene,previous}=item,r=player.romance.npcs[id],n=relationshipNpcV2852(id),reasons=[];
  if(previous&&!n.scenes[previous.id])reasons.push('先完成「'+previous.title+'」');
  if(!hasReachedRealm(scene.realm))reasons.push('境界达到'+CULTIVATION_REALMS[scene.realm].name);
  if(r.affection<scene.aff)reasons.push('好感达到'+scene.aff+'（当前'+r.affection+'）');
  if(scene.event&&!r.events.includes(scene.event)){const event=ROMANCE_NPCS[id].events.find(e=>e.id===scene.event);reasons.push('先完成原人物故事「'+(event?.title||scene.event)+'」');}
  return reasons;
}
function relationshipRouteV2852(id){
  const n=relationshipNpcV2852(id),points=[0,0,0];Object.values(n.scenes).forEach(r=>points[r.choice]++);
  if(!points.some(Boolean))return '尚未留下共同往事';
  const best=Math.max(...points);return points.map((v,i)=>v===best?RELATIONSHIP_STORIES_V2852.npcs[id].routes[i]:'').filter(Boolean).join(' · ');
}
function relationshipDayV2852(){return relationshipIntV2852(player.worldTime?.totalDays,1e9);}
function relationshipDayLabelV2852(day){return '游历第 '+(day+1)+' 日';}
function relationshipContextV2852(id){
  const stage=relationshipStageV2852(id),realm=CULTIVATION_REALMS[player.level]?.name||'凡人';
  return realm+' · '+(relationshipNeutralV2852(id)?'以故友之礼相处':stage===3?'已结为道侣':stage===2?'渐渐知心':stage===1?'渐渐熟悉':'初叙近况');
}
function relationshipMountV2852(id,tab,body,extra={}){
  const npc=ROMANCE_NPCS[id],n=relationshipNpcV2852(id),count=Object.keys(n.scenes).length,esc=relationshipEscV2852;
  const panel=jevModalV2846(npc.name+' · 知己往事',`<div class="rs-head-v2852" style="--rs-accent:${npc.color}"><span class="rs-eyebrow-v2852">知己往事 · ${esc(relationshipContextV2852(id))}</span><p>${esc(RELATIONSHIP_STORIES_V2852.npcs[id].intro)}</p><div class="rs-progress-v2852"><span>已读 ${count} / 6 幕</span><span>好感 ${player.romance.npcs[id].affection}</span></div><progress max="6" value="${count}" aria-label="人物支线进度"></progress><small>相处倾向：${esc(relationshipRouteV2852(id))}</small></div><nav class="rs-tabs-v2852" aria-label="相处栏目">${[['stories','剧情'],['chat','闲谈'],['diary','札记']].map(([key,title])=>`<button aria-pressed="${key===tab}" onclick="showRelationshipsV2852('${id}','${key}')">${title}</button>`).join('')}</nav><div class="rs-content-v2852" id="relationshipBodyV2852">${body}</div><footer class="rs-footer-v2852"><small>文字均为预写内容；Jev 只选择回应态度。离线也能继续。</small><button onclick="closeJevWorldV2846();showRomanceNpc('${id}')">返回人物 · 推进原故事</button></footer>`);
  panel.classList.add('relationship-mode-v2852');
  RELATIONSHIPS_V2852.screen={id,tab,panel,rev:JEV_WORLD_V2846.revision,owner:player,busy:false,...extra};
  return RELATIONSHIPS_V2852.screen;
}
function showRelationshipsV2852(id,tab='stories'){
  if(!relationshipAllowedV2852(id))return;
  if(!['stories','chat','diary'].includes(tab))tab='stories';
  const data=RELATIONSHIP_STORIES_V2852.npcs[id],n=relationshipNpcV2852(id),esc=relationshipEscV2852;
  let body='';
  if(tab==='stories')body='<p class="rs-hint-v2852">每幕选一次，前一幕的选择会留到后一幕。完成一幕最多增加 2 点好感；重读不再奖励，不代替原人物主线。</p>'+data.arcs.map((arc,i)=>`<article class="rs-arc-v2852"><span class="rs-eyebrow-v2852">短篇 ${['壹','贰','叁'][i]}</span><h3>${esc(arc.title)}</h3><p>${esc(arc.desc)}</p>${arc.scenes.map((s,j)=>{const r=n.scenes[s.id],lock=relationshipLockV2852(id,s.id);return `<button class="rs-chapter-v2852" ${!r&&lock.length?'disabled':''} onclick="showRelationshipSceneV2852('${id}','${s.id}')"><span>${r?'已读':lock.length?'待解锁':'可游玩'} · 第${j+1}幕 ${esc(s.title)}</span><small>${r?'查看当时的选择与回应':lock.length?esc(lock.join('；')):'三种选择 · 继续你们的故事'}</small></button>`;}).join('')}</article>`).join('');
  if(tab==='chat')body=`<p class="rs-hint-v2852">选一个话题，她会按你们当前的关系回应。同一阶段的闲谈轮换出现，不增加好感，也不会代替主线事件。</p><div class="rs-topic-grid-v2852">${Object.entries(RELATIONSHIP_STORIES_V2852.topics).map(([key,title])=>`<button onclick="relationshipChatV2852('${id}','${key}')">${title}<small>${{care:'聊聊今日',cultivation:'交换心得',journey:'谈谈远方',memory:'听一段旧事',bond:'说清心意',war:'烽火与平安'}[key]}</small></button>`).join('')}</div><p class="rs-hint-v2852">有些心里话会随原故事和好感解锁。札记保留最近 12 次闲谈，三位角色分别记忆。</p>`;
  if(tab==='diary'){
    const records=data.arcs.flatMap(arc=>arc.scenes.filter(s=>n.scenes[s.id]).map(s=>{const r=n.scenes[s.id];return `<button class="rs-chapter-v2852" onclick="showRelationshipSceneV2852('${id}','${s.id}')"><span>${esc(s.title)}</span><small>${esc(s.choices[r.choice].label)} · ${relationshipDayLabelV2852(r.day)}</small></button>`;}));
    body='<h3>共同往事</h3>'+(records.join('')||'<p>还没有写下共同往事。从第一幕开始，让选择留在这里。</p>')+'<h3>最近闲谈</h3>'+n.chats.slice().reverse().map(r=>relationshipChatTextV2852(id,r,true)).join('');
    if(!n.chats.length)body+='<p>闲谈后，最近的回应会收在这里。</p>';
  }
  relationshipMountV2852(id,tab,body);
}
function relationshipOpeningV2852(id,item){
  const old=item.previous&&relationshipNpcV2852(id).scenes[item.previous.id];
  return old?item.scene.callbacks[old.choice]:'';
}
function relationshipEndingV2852(id,item,record){
  if(!item.scene.endings.length)return '';
  const first=relationshipNpcV2852(id).scenes[item.previous?.id];
  return (first?'从「'+item.previous.choices[first.choice].label+'」到「'+item.scene.choices[record.choice].label+'」，':'')+item.scene.endings[record.choice];
}
function showRelationshipSceneV2852(id,sid,notice=''){
  if(!relationshipAllowedV2852(id))return;
  const item=relationshipSceneV2852(id,sid);if(!item)return;
  const {scene}=item,n=relationshipNpcV2852(id),record=n.scenes[sid],esc=relationshipEscV2852;
  if(!record&&relationshipLockV2852(id,sid).length)return showRelationshipsV2852(id);
  const callback=relationshipOpeningV2852(id,item);
  let body=`<span class="rs-eyebrow-v2852">${esc(item.arc.title)} · 第${item.index+1}幕</span><h3 class="rs-scene-title-v2852">${esc(scene.title)}</h3>${notice?`<p class="rs-notice-v2852" role="status">${esc(notice)}</p>`:''}${callback?`<aside class="rs-memory-v2852">上一次留下的回声<br>${esc(callback)}</aside>`:''}<div class="rs-prose-v2852">${scene.text.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`;
  if(record){
    const c=scene.choices[record.choice],ending=relationshipEndingV2852(id,item,record);
    body+=`<div class="rs-answer-v2852"><small>你当时选择 · ${esc(c.label)}</small><p>${esc(c.action)}</p><blockquote>${esc(c.replies[record.tone])}</blockquote><small>${record.source==='jev'?'Jev 选择回应态度':'本地选择回应态度'} · ${relationshipDayLabelV2852(record.day)} · 已结算好感 +${record.gain}</small></div>${ending?`<aside class="rs-ending-v2852"><b>此篇落款</b><p>${esc(ending)}</p></aside>`:''}<p class="rs-hint-v2852">本幕已记入札记，重读不会再增加好感。恋爱与道侣关系仍由原人物故事决定。</p>`;
    const next=item.arc.scenes[item.index+1];if(next&&!n.scenes[next.id]&&!relationshipLockV2852(id,next.id).length)body+=`<button class="rs-primary-v2852" onclick="showRelationshipSceneV2852('${id}','${next.id}')">继续 · ${esc(next.title)}</button>`;
  }else body+=`<p id="relationshipStatusV2852" role="status">你想怎样回应？确定后会记入这份存档。</p><div class="rs-choices-v2852">${scene.choices.map((c,i)=>`<button id="relationshipChoice${i}V2852" onclick="chooseRelationshipSceneV2852('${id}','${sid}',${i})"><span>${['壹','贰','叁'][i]}</span>${esc(c.label)}</button>`).join('')}</div>`;
  body+=`<button class="rs-back-v2852" onclick="showRelationshipsV2852('${id}')">返回剧情目录</button>`;
  relationshipMountV2852(id,'stories',body,{kind:'scene',sid});
}
function relationshipFingerprintV2852(id){return JSON.stringify([player.level,player.phase,player.worldMapId,player.romance,player.romanceProgress,relationshipNpcV2852(id)]);}
function relationshipFreshV2852(screen,fingerprint){return RELATIONSHIPS_V2852.screen===screen&&player===screen.owner&&JEV_WORLD_V2846.panel===screen.panel&&JEV_WORLD_V2846.revision===screen.rev&&!document.hidden&&relationshipAllowedV2852(screen.id)&&relationshipFingerprintV2852(screen.id)===fingerprint;}
async function relationshipAnswerV2852(id,screen,fresh){
  const r=player.romance.npcs[id],n=relationshipNpcV2852(id),tones=relationshipTonesV2852(id),fallback=relationshipStageV2852(id)>=2&&tones.includes(2)?2:1;
  const options=tones.map(a=>({a})),state=jevWireStateV2846('npc',[r.affection,r.events.length,Number(player.romance.partner===id),Math.min(1e6,r.chats+Object.values(n.counts).reduce((a,b)=>a+b,0))],options);
  let answer;try{answer=await jevDecideV2846(state,'o'+Math.max(0,tones.indexOf(fallback)),fresh);}catch(_){answer={choice:'o'+Math.max(0,tones.indexOf(fallback)),source:'local',note:'连接暂不可用'};}
  const chosen=tones[Number(String(answer.choice).slice(1))];return {tone:chosen??fallback,source:chosen!==undefined&&answer.source==='jev'?'jev':'local',note:answer.note||''};
}
function relationshipInvalidatedV2852(screen){if(JEV_WORLD_V2846.panel===screen.panel)closeJevWorldV2846();}
function relationshipSaveV2852(){return saveGame()?'':'当前浏览器未能保存，请先导出存档，避免刷新后丢失本次进度。';}
async function chooseRelationshipSceneV2852(id,sid,index){
  const screen=RELATIONSHIPS_V2852.screen,item=relationshipSceneV2852(id,sid);
  if(!item||!Number.isInteger(index)||index<0||index>2||!relationshipAllowedV2852(id)||!screen||screen.kind!=='scene'||screen.sid!==sid||screen.id!==id||screen.busy||screen.owner!==player||JEV_WORLD_V2846.panel!==screen.panel||JEV_WORLD_V2846.revision!==screen.rev||relationshipNpcV2852(id).scenes[sid]||relationshipLockV2852(id,sid).length)return;
  screen.busy=true;
  for(let i=0;i<3;i++){const el=document.getElementById('relationshipChoice'+i+'V2852');if(el)el.disabled=true;}
  const status=document.getElementById('relationshipStatusV2852');if(status)status.textContent='正在选择回应态度…最多等待 4.5 秒。返回或关闭会取消本次选择。';
  const signature=relationshipFingerprintV2852(id),fresh=()=>relationshipFreshV2852(screen,signature)&&!relationshipLockV2852(id,sid).length;
  const answer=await relationshipAnswerV2852(id,screen,fresh);
  if(!fresh())return relationshipInvalidatedV2852(screen);
  const n=relationshipNpcV2852(id);if(n.scenes[sid])return;
  n.scenes[sid]={choice:index,tone:answer.tone,day:relationshipDayV2852(),source:answer.source,gain:0};
  const cap=id==='suwanqing'?getSuAffectionCap():100;
  if(player.romance.npcs[id].affection<cap)n.scenes[sid].gain=Math.max(0,addAffection(id,2));
  const warning=relationshipSaveV2852();showRelationshipSceneV2852(id,sid,warning||((answer.source==='jev'?'Jev 已选定回应。':'已使用本地回应。')+(answer.note?answer.note+'。':'')+'本幕已存入札记。'));
}
function relationshipHashV2852(value){let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0;}
function relationshipMemoryV2852(id){const all=RELATIONSHIP_STORIES_V2852.npcs[id].arcs.flatMap(a=>a.scenes).filter(s=>relationshipNpcV2852(id).scenes[s.id]);return all.length?all[(Object.values(relationshipNpcV2852(id).counts).reduce((a,b)=>a+b,0))%all.length].id:'';}
function relationshipChatTextV2852(id,r,archived=false){
  const d=RELATIONSHIP_STORIES_V2852.npcs[id].chats[r.topic],line=r.stage===3?d.partner:d.stages[r.stage][r.variant],esc=relationshipEscV2852;
  const item=r.memory&&relationshipSceneV2852(id,r.memory),memory=item&&relationshipNpcV2852(id).scenes[r.memory];
  const tone=['她想了片刻，斟酌着开口。','她听你说完，接着谈起这个话题。','她的神色柔和下来，将话说得慢了些。'][r.tone];
  return `<article class="rs-answer-v2852"><small>${esc(RELATIONSHIP_STORIES_V2852.topics[r.topic])} · ${relationshipDayLabelV2852(r.day)}${archived?' · 当时的关系':''}</small><p>${tone}</p><blockquote>${esc(line)}</blockquote>${r.topic==='war'&&Number.isInteger(r.warMoment)&&r.warMoment>=0&&r.warMoment<=3?`<p>${esc(RELATIONSHIP_WAR_V2865[id][r.warMoment])}</p>`:''}${memory?`<aside class="rs-memory-v2852">你想起「${esc(item.scene.title)}」那天，自己曾选择${esc(item.scene.choices[memory.choice].label)}。</aside>`:''}<small>${r.source==='jev'?'Jev 选择回应态度':'本地选择回应态度'} · 预写闲谈 · 不增加好感</small></article>`;
}
async function relationshipChatV2852(id,topic){
  if(!relationshipAllowedV2852(id)||!Object.hasOwn(RELATIONSHIP_STORIES_V2852.topics,topic))return;
  const old=RELATIONSHIPS_V2852.screen;if(!old||old.id!==id||old.tab!=='chat'||old.busy||old.owner!==player||JEV_WORLD_V2846.panel!==old.panel||JEV_WORLD_V2846.revision!==old.rev)return;
  const screen=relationshipMountV2852(id,'chat','<p id="relationshipStatusV2852" role="status">她听着你说起这个话题…最多等待 4.5 秒。关闭或切换栏目可取消。</p>',{kind:'chat',busy:true});
  const signature=relationshipFingerprintV2852(id),fresh=()=>relationshipFreshV2852(screen,signature);
  const answer=await relationshipAnswerV2852(id,screen,fresh);if(!fresh())return relationshipInvalidatedV2852(screen);
  const n=relationshipNpcV2852(id),stage=relationshipStageV2852(id),hash=relationshipHashV2852(relationshipsStateV2852().seed+id+topic+stage),record={topic,stage,tone:answer.tone,source:answer.source,day:relationshipDayV2852(),variant:stage===3?0:(hash+n.counts[topic])%2,memory:relationshipMemoryV2852(id),warMoment:topic==='war'?relationshipWarMomentV2865():null};
  n.counts[topic]=(n.counts[topic]+1)%1000000;n.chats.push(record);if(n.chats.length>12)n.chats.splice(0,n.chats.length-12);
  const warning=relationshipSaveV2852(),esc=relationshipEscV2852;
  relationshipMountV2852(id,'chat',`<span class="rs-eyebrow-v2852">${esc(relationshipContextV2852(id))}</span>${relationshipChatTextV2852(id,record)}<p class="rs-hint-v2852" role="status">${esc(warning||answer.note||'已记入札记。')}</p><button class="rs-primary-v2852" onclick="showRelationshipsV2852('${id}','chat')">再聊一个话题</button><button class="rs-back-v2852" onclick="showRelationshipsV2852('${id}','diary')">翻开相处札记</button>`,{kind:'reply'});
}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2852-relationships.js']='28.68.39';

function relationshipWarMomentV2865(){
 const story=player.yewujiStoryV2816;
 if(story?.saintVictory)return 3;
 const chapters=Array.isArray(story?.choices)?story.choices.length:0;
 return chapters>=4?2:chapters>=1?1:0;
}
const RELATIONSHIP_WAR_V2865={
 suwanqing:[
 '苏晚晴将药箱合上：“三万年的战事，在史书上只是几页。在伤者身上，却是一生。你初入修行，先学会活着回来。”',
 '听你提起夜无疆，她停下捣药：“比你高一个境界的人，不必今日就赢。把他的招式记下来，把自己的伤养好，下一次才有得选。”',
 '她摊开沿途收来的求药信：“你已见过战局的另一面。倘若只救得一处，我会先去没有修士守护的村子。你愿意替我探路吗？”',
 '得知夜无疆被你击退，她没有先道贺，而是检查你的伤口：“胜负已经分了，伤还没有好。往后那些年，愿我们不必总在战后才见面。”'
 ],
 luoqinghan:[
 '洛清寒将旧战图压在剑下：“三万年，攻守换了无数次。出门前看清退路，莫把别人的传说当成自己的本事。”',
 '“夜无疆的强，不只在境界。”她以剑鞘划出两道线，“你追着他的锋芒走，便会忘记自己要守住什么。”',
 '她指向战图上断开的山口：“正面攻不下，不等于无路可走。救援、侦察、护送，都能改变一场战事。你我可以各守一程。”',
 '她收起那张磨损的战图：“你已越过他不能越过的关隘。但山下的人要的不是新的威压，是能安心走过这条路。”'
 ],
 jihongling:[
 '姬红绫拨开灯芯：“三万年打下来，人人都说自己占理。可烧掉的村子不会因为旗号不同，就少留一片灰。”',
 '她听完你与夜无疆的相遇，轻轻摇头：“别急着拿命证明什么。强者也有看不见的地方，你先把眼睛睁亮。”',
 '“你见得越多，就越难只凭一句仙魔来判断人。”她望向营火外，“若有一日你救下的是敌营的孩子，我想听你亲口讲那一晚。”',
 '听闻你击退夜无疆，她沉默片刻才笑：“你终于不必再追着他的影子走。接下来想去哪里？这一回，可以为自己选。”'
 ]
};
