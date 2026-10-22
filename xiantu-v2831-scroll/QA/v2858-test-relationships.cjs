'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),vm=require('node:vm'),fixture=require('./v2858-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const {createHandler}=require(path.resolve(root,'../tencent-jev-function/index.js'));
const token='test_relationship_token_32_only',origin='https://example.test',env={JEV_API_KEY:'test_provider_key',JEV_ACCESS_TOKEN:token,JEV_ALLOWED_ORIGINS:origin};
const files=JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]),fixtures=[];
function game(){const f=fixture(root);fixtures.push(f);f.c.AbortController=AbortController;f.c.crypto=require('node:crypto').webcrypto;f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;for(const name of files)f.load(name);f.run('startGame();closeWorldOverlay();FORGE_ADVICE_V2842.access="";player.romance.npcs.suwanqing.affection=0');f.timers.clear();return f;}
const json=(f,x)=>JSON.parse(f.run('JSON.stringify('+x+')'));
function unlock(f){f.run('player.level=8;player.phase=0;for(const id of Object.keys(ROMANCE_NPCS)){player.romance.npcs[id].affection=80;player.romance.npcs[id].events=ROMANCE_NPCS[id].events.map(e=>e.id)}');}
function connect(f,index=1){let seen=[],count=0,clock=Date.now();const handler=createHandler({env,now:()=>clock,call:async body=>{seen.push(body);const ids=body.state.options.map(o=>o.id),chosen=ids[Math.min(index,ids.length-1)];return {answers:{npc:{type:'choice',choice:chosen,confidence:.93,probabilities:Object.fromEntries(ids.map(id=>[id,id===chosen?1:0]))}},usage:{input_tokens:500,output_tokens:4}}}});f.run(`FORGE_ADVICE_V2842.access=${JSON.stringify(token)};FORGE_ADVICE_V2842.nextAt=0;JEV_WORLD_V2846.cache.clear();`);f.c.fetch=async(url,opt)=>{count++;clock+=11000;const r=await handler({httpMethod:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Xiantu-Access':token},body:opt.body});return {ok:r.statusCode===200,status:r.statusCode,json:async()=>JSON.parse(r.body)}};return {get seen(){return seen},get count(){return count}};}
async function choose(f,id,sid,i){f.run(`showRelationshipSceneV2852('${id}','${sid}')`);await f.run(`chooseRelationshipSceneV2852('${id}','${sid}',${i})`);}
async function chat(f,id,topic){f.run(`showRelationshipsV2852('${id}','chat')`);await f.run(`relationshipChatV2852('${id}','${topic}')`);}
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 const base=game(),data=json(base,'RELATIONSHIP_STORIES_V2852'),scenes=[];let replies=[],daily=[];
 for(const [id,n] of Object.entries(data.npcs)){
  a.equal(n.arcs.length,3);a.equal(n.routes.length,3);a.equal(Object.keys(n.chats).length,6);
  for(const arc of n.arcs){a.equal(arc.scenes.length,2);for(const [i,s] of arc.scenes.entries()){
   a.equal(s.choices.length,3);a.equal(s.callbacks.length,i?3:0);a.equal(s.endings.length,i?3:0);a(s.text.every(x=>x.length>12));
   a(s.realm>=data.npcs[id].arcs[0].scenes[0].realm);if(s.event)a(base.run(`ROMANCE_NPCS['${id}'].events.some(e=>e.id==='${s.event}')`));
   for(const c of s.choices){a.equal(c.replies.length,3);replies.push(...c.replies);a(c.action.length>10);}scenes.push({id,sid:s.id});
  }}
  for(const c of Object.values(n.chats)){a.equal(c.stages.length,3);for(const stage of c.stages){a.equal(stage.length,2);daily.push(...stage)}daily.push(c.partner)}
 }
 a.equal(scenes.length,18);a.equal(new Set(scenes.map(x=>x.sid)).size,18);a.equal(replies.length,162);a.equal(new Set(replies).size,162);a.equal(daily.length,126);a.equal(new Set(daily).size,126);
 a(!JSON.stringify(data).includes('顾玄岳'));a(!JSON.stringify(data).includes('亲孙子'));
 console.log('PASS 9 arcs / 18 scenes / 54 player choices / 162 unique responses / 126 unique daily lines, original event gates and no hidden-line spoilers');
 let calls=0;base.c.fetch=()=>{calls++;return Promise.reject(Error('offline'));};base.run("showRelationshipsV2852('suwanqing')");a.equal(calls,0);a(base.run('isWorldOverlayOpen()'));a.match(base.ids.get('jevWorldPanelV2846').innerHTML,/可游玩/);base.run("showRelationshipsV2852('jihongling')");a.equal(base.run('RELATIONSHIPS_V2852.screen.id'),'suwanqing');a.equal(calls,0);
 await base.run("chooseRelationshipSceneV2852('suwanqing','su_rain_2',0)");a.equal(Object.keys(json(base,"relationshipNpcV2852('suwanqing').scenes")).length,0);
 const before=json(base,'({gold:player.gold,exp:player.exp,partner:player.romance.partner,events:player.romance.npcs.suwanqing.events,story:player.storyProgress})');
 await choose(base,'suwanqing','su_rain_1',2);a.equal(base.run("relationshipNpcV2852('suwanqing').scenes.su_rain_1.choice"),2);a.equal(base.run('player.romance.npcs.suwanqing.affection'),2);a.equal(base.run("relationshipNpcV2852('suwanqing').scenes.su_rain_1.source"),'local');a.deepEqual(json(base,'({gold:player.gold,exp:player.exp,partner:player.romance.partner,events:player.romance.npcs.suwanqing.events,story:player.storyProgress})'),before);
 for(let i=0;i<3;i++)await choose(base,'suwanqing','su_rain_1',i);a.equal(base.run('player.romance.npcs.suwanqing.affection'),2);a.equal(base.run("relationshipNpcV2852('suwanqing').scenes.su_rain_1.choice"),2);a(base.run("relationshipLockV2852('suwanqing','su_rain_2').length")>=1);
 base.run('player.level=2;player.romance.npcs.suwanqing.affection=40');a(base.run("relationshipLockV2852('suwanqing','su_bridge_1').some(s=>s.includes('再次并肩'))"));a.equal(base.run('getSuReunionCount()'),0);
 const cap=game();cap.run('player.romance.npcs.suwanqing.affection=20');await choose(cap,'suwanqing','su_rain_1',0);a.equal(cap.run('player.romance.npcs.suwanqing.affection'),20);a.equal(cap.run("relationshipNpcV2852('suwanqing').scenes.su_rain_1.gain"),0);
 const over=game();over.run('player.romance.npcs.suwanqing.affection=90');await choose(over,'suwanqing','su_rain_1',0);a.equal(over.run('player.romance.npcs.suwanqing.affection'),90);
 console.log('PASS locked realms/events, no request on reading, once-only affection, replay read-only, Su cap and no resources/mainline/partner mutation');
 for(let route=0;route<3;route++){
  const f=game();unlock(f);const cloud=connect(f,route),original=json(f,'player.romance');let expectedGain=0;
  for(const {id,sid} of scenes){f.run('FORGE_ADVICE_V2842.nextAt=0;JEV_WORLD_V2846.cache.clear()');await choose(f,id,sid,route);const r=json(f,`relationshipNpcV2852('${id}').scenes['${sid}']`);a.equal(r.choice,route);a.equal(r.tone,route,sid);a.equal(r.source,'jev');a.equal(r.gain,2);expectedGain+=r.gain;
   const item=f.run(`relationshipSceneV2852('${id}','${sid}')`);if(item.index){a.match(f.ids.get('jevWorldPanelV2846').innerHTML,new RegExp(item.scene.callbacks[route].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));a(f.ids.get('jevWorldPanelV2846').innerHTML.includes(item.previous.choices[route].label));a(f.ids.get('jevWorldPanelV2846').innerHTML.includes(item.scene.endings[route]));}
  }
  a.equal(expectedGain,36);a.equal(cloud.count,18);a(cloud.seen.every(b=>b.state.task==='npc'&&b.state.version===1&&b.state.context.length===4));a(!JSON.stringify(cloud.seen).includes('灯下分药'));
  for(const id of Object.keys(data.npcs)){a.equal(f.run(`player.romance.npcs.${id}.affection`),92);a.deepEqual(json(f,`player.romance.npcs.${id}.events`),original.npcs[id].events);a.equal(f.run(`relationshipRouteV2852('${id}')`),data.npcs[id].routes[route]);}
 }
 console.log('PASS all 54 choice paths through actual V28.50 cloud handler, 3 Jev tones, first-scene callbacks, distinct endings and bounded gains');
 const dailyGame=game();unlock(dailyGame);const network=connect(dailyGame,2),initial=json(dailyGame,'player.romance');
 for(const id of Object.keys(data.npcs))for(const topic of Object.keys(data.topics)){
  await chat(dailyGame,id,topic);const first=json(dailyGame,`relationshipNpcV2852('${id}').chats.at(-1)`);await chat(dailyGame,id,topic);const second=json(dailyGame,`relationshipNpcV2852('${id}').chats.at(-1)`);a.notEqual(first.variant,second.variant);a.equal(first.stage,2);a.equal(second.stage,2);
 }
 for(const id of Object.keys(data.npcs))initial.npcs[id].affection+=2;
 initial.npcs.suwanqing.resonanceV286826=0;
 a.deepEqual(json(dailyGame,'player.romance'),initial);a(network.count>0);
 for(let i=0;i<20;i++)await chat(dailyGame,'jihongling','care');a.equal(dailyGame.run("relationshipNpcV2852('jihongling').chats.length"),12);a.equal(dailyGame.run("relationshipNpcV2852('suwanqing').chats.length"),12);
 dailyGame.run("player.romance.partner='jihongling'");await chat(dailyGame,'jihongling','bond');a.equal(dailyGame.run("relationshipNpcV2852('jihongling').chats.at(-1).stage"),3);await chat(dailyGame,'suwanqing','bond');a.equal(dailyGame.run("relationshipNpcV2852('suwanqing').chats.at(-1).stage"),0);a(!dailyGame.run("relationshipTonesV2852('suwanqing').includes(2)"));
 dailyGame.run("player.romance.partner=null;player.romanceProgress.endingType='release'");a.equal(dailyGame.run("relationshipStageV2852('suwanqing')"),0);dailyGame.run("player.romanceProgress.endingType=null;player.romance.npcs.suwanqing.events=[]");a.equal(dailyGame.run("relationshipStageV2852('suwanqing')"),1);
 a(!dailyGame.ids.get('jevWorldPanelV2846').innerHTML.includes('textarea'));
 console.log('PASS six rotating topics per character, stage/partner/release gates, capped independent chat memories, no repeat in same stage and no affection farming');
 const originalState=json(base,'player.relationshipStoriesV2852');base.run('saveGame();player=normalizePlayer(JSON.parse(localStorage.getItem("xiantu_save")).player)');a.deepEqual(json(base,'player.relationshipStoriesV2852'),originalState);
 const oldSave=game();oldSave.run('player=normalizePlayer({name:"旧角色",level:2,gold:987,exp:333})');a.equal(oldSave.run('player.gold'),987);a.equal(oldSave.run("Object.keys(relationshipNpcV2852('suwanqing').scenes).length"),0);a.notEqual(oldSave.run('relationshipsStateV2852().seed'),base.run('relationshipsStateV2852().seed'));
 oldSave.c.hostBad={seed:'<script>',npcs:{suwanqing:{scenes:{su_rain_1:{choice:50,tone:1},bad:{choice:1,tone:1}},counts:{care:1e30},chats:Array(100).fill({topic:'bogus',stage:0,variant:0,tone:0})}}};
 const clean=json(oldSave,'normalizeRelationshipsV2852(hostBad)');a.equal(Object.keys(clean.npcs.suwanqing.scenes).length,0);a.equal(clean.npcs.suwanqing.chats.length,0);a.equal(clean.npcs.suwanqing.counts.care,1000000);a(!clean.seed.includes('<'));
 console.log('PASS exact save round-trip, old-save migration without resource changes, independent save seeds and malformed history sanitation');
 for(const mutation of ['closeJevWorldV2846()',"showRelationshipsV2852('luoqinghan')",'player.level++','player=normalizePlayer(JSON.parse(JSON.stringify(player)))',"player.romance.npcs.suwanqing.events.pop()",'document.hidden=true',"startCombat({name:'测试妖兽',hp:10000,maxHp:10000,atk:2,def:2,gold:1,exp:1})"]){
  const f=game();unlock(f);connect(f);let resolve;f.c.fetch=()=>new Promise(r=>resolve=r);f.run("showRelationshipSceneV2852('suwanqing','su_rain_1')");const pending=f.run("chooseRelationshipSceneV2852('suwanqing','su_rain_1',1)");const duplicate=f.run("chooseRelationshipSceneV2852('suwanqing','su_rain_1',0)");a(f.ids.get('relationshipChoice0V2852').disabled);f.run(mutation);resolve({ok:true,json:async()=>({source:'jev',task:'npc',choice:'o2',confidence:.9})});await pending;await duplicate;a.equal(f.run("Object.keys(relationshipNpcV2852('suwanqing').scenes).length"),0);a.equal(f.run('player.romance.npcs.suwanqing.affection'),80);
 }
 const canceledChat=game();unlock(canceledChat);connect(canceledChat);let resolve;canceledChat.c.fetch=()=>new Promise(r=>resolve=r);canceledChat.run("showRelationshipsV2852('jihongling','chat')");const req=canceledChat.run("relationshipChatV2852('jihongling','care')");canceledChat.run("showRelationshipsV2852('jihongling','diary')");resolve({ok:true,json:async()=>({source:'jev',task:'npc',choice:'o1',confidence:.9})});await req;a.equal(canceledChat.run("relationshipNpcV2852('jihongling').chats.length"),0);
 const timeout=game();unlock(timeout);connect(timeout);timeout.c.fetch=()=>new Promise(()=>{});timeout.run("showRelationshipSceneV2852('suwanqing','su_rain_1')");const waiting=timeout.run("chooseRelationshipSceneV2852('suwanqing','su_rain_1',1)");await tick();timeout.flush(4500);await waiting;a.equal(timeout.run("relationshipNpcV2852('suwanqing').scenes.su_rain_1.source"),'local');
 const double=game();double.run("showRelationshipSceneV2852('suwanqing','su_rain_1')");await Promise.all([double.run("chooseRelationshipSceneV2852('suwanqing','su_rain_1',1)"),double.run("chooseRelationshipSceneV2852('suwanqing','su_rain_1',2)")]);a.equal(double.run('player.romance.npcs.suwanqing.affection'),2);
 const quota=game();quota.c.localStorage.setItem=()=>{throw Error('quota')};await choose(quota,'suwanqing','su_rain_1',1);a(quota.ids.get('jevWorldPanelV2846').innerHTML.includes('未能保存'));
 console.log('PASS cancel/switch/realm/load/mainline/hidden/battle invalidation, canceled chat, timeout fallback, duplicate-tap protection and save-failure notice');
 const reward=game();unlock(reward);reward.run("showRelationshipsV2852('jihongling','chat')");
 await chat(reward,'jihongling','care');a.equal(reward.run('player.romance.npcs.jihongling.affection'),82);
 for(let i=0;i<15;i++)await chat(reward,'jihongling','care');a.equal(reward.run('player.romance.npcs.jihongling.affection'),82);
 reward.run('saveGame();player=normalizePlayer(loadGame().player)');await chat(reward,'jihongling','care');a.equal(reward.run('player.romance.npcs.jihongling.affection'),82);
 reward.run('player.worldTime.totalDays++');await chat(reward,'jihongling','care');a.equal(reward.run('player.romance.npcs.jihongling.affection'),84);
 reward.run('player.worldTime.totalDays--');await chat(reward,'jihongling','care');a.equal(reward.run('player.romance.npcs.jihongling.affection'),84);
 const chatQuota=game();unlock(chatQuota);chatQuota.run("showRelationshipsV2852('jihongling','chat');globalThis.beforeChat=JSON.stringify([player.romance,player.relationshipStoriesV2852]);globalThis.origSet=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')}");await chat(chatQuota,'jihongling','care');a.equal(chatQuota.run('JSON.stringify([player.romance,player.relationshipStoriesV2852])'),chatQuota.run('beforeChat'));chatQuota.run('localStorage.setItem=origSet');chatQuota.errors.length=0;await chat(chatQuota,'jihongling','care');a.equal(chatQuota.run('player.romance.npcs.jihongling.affection'),82);
 const capChat=game();capChat.run('player.romance.npcs.suwanqing.affection=20');await chat(capChat,'suwanqing','care');a.equal(capChat.run('player.romance.npcs.suwanqing.affection'),20);a.equal(capChat.run('player.romance.npcs.suwanqing.resonanceV286826||0'),0);
 console.log('PASS daily chat high-water mark, bounded history, save/reload, next day, clock rollback, quota rollback and Su cap');
 for(const f of fixtures)if(f!==quota)a.equal(f.errors.length,0,JSON.stringify(f.errors));a(quota.errors.every(e=>String(e[0]).includes('保存失败')));
 console.log('PASS all relationship flow checks; simulated DOM/provider, no paid request or live deployment');
})().catch(e=>{console.error(e);process.exitCode=1;});
