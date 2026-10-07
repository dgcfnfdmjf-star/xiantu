'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),fixture=require('./v2853-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
const {createHandler,validState}=require(path.resolve(root,'../tencent-jev-function/index.js'));
const token='test_world_access_32characters_ok',origin='https://example.test',env={JEV_API_KEY:'test_server_key',JEV_ACCESS_TOKEN:token,JEV_ALLOWED_ORIGINS:origin};
function game(){const f=fixture(root);f.c.AbortController=AbortController;f.storage.set('xiantu_battle_presentation_v2756','report');for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run('startGame();closeWorldOverlay();');f.timers.clear();return f;}
const event=state=>({httpMethod:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Xiantu-Access':token},body:JSON.stringify(state)});
const response=(state,index=0,confidence=.9)=>({answers:{[state.task]:{type:'choice',choice:'o'+index,confidence,probabilities:Object.fromEntries(state.options.map((o,i)=>[o.id,i===index?1:0]))}},usage:{input_tokens:600,output_tokens:30}});
const plain=x=>JSON.parse(JSON.stringify(x));
function connect(f,index=0){f.run(`FORGE_ADVICE_V2842.access=${JSON.stringify(token)};FORGE_ADVICE_V2842.nextAt=0;`);let count=0,seen;const handler=createHandler({env,call:async b=>{seen=b;return response(b.state,index)}});f.c.fetch=async(url,opt)=>{count++;const r=await handler(event(JSON.parse(opt.body)));return {ok:r.statusCode===200,status:r.statusCode,json:async()=>JSON.parse(r.body)}};return {get count(){return count},get seen(){return seen}};}
function apply(f,index=0){f.run(`jevApplyV2846(JEV_WORLD_V2846.revision,${index})`);}
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
(async()=>{
 const lengths={disciple:4,npc:4,war:5,hero:6,secret:4,sect:7};
 for(const [task,n] of Object.entries(lengths)){
  const body={version:1,task,context:Array(n).fill(0),options:[0,1].map(i=>({id:'o'+i,a:i,b:0,c:0,d:0,e:0})),prompt:'NEVER_FORWARD',save:'NEVER_FORWARD'};
  const normalized=validState(body);assert(!JSON.stringify(normalized).includes('NEVER_FORWARD'));
  let calls=0,clock=100000;const h=createHandler({env,now:()=>clock,call:async b=>{calls++;assert(!JSON.stringify(b).includes('NEVER_FORWARD'));return response(b.state)}});
  const r=await h(event(body));assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).task,task);assert.equal(JSON.parse(r.body).usage.input_tokens,600);
  const cache=await h(event(body));assert.equal(JSON.parse(cache.body).usage.input_tokens,0);assert.equal(calls,1);
  assert.throws(()=>validState({...body,context:[] }));assert.throws(()=>validState({...body,options:[...body.options,{id:'o1',a:1,b:0,c:0,d:0,e:0}]}));
  assert.throws(()=>validState({...body,options:[{...body.options[0],a:'prompt'},body.options[1]]}));
  const bad=createHandler({env,call:async b=>response(b.state,15)});assert.equal((await bad(event(body))).statusCode,502);
 }
 console.log('PASS all six server contracts, prompt stripping, choice validation, usage and cache accounting');
 const idle=game();let calls=0;idle.c.fetch=()=>{calls++;throw Error('must not call')};idle.run('showJevHubV2846();closeJevWorldV2846();showSectHall();showRomanceNpc("suwanqing");');assert.equal(calls,0,'opening pages is free');assert.equal(idle.run('JEV_WORLD_V2846.heroEnabled'),false);
 // Real disciple assignment still needs confirmation and mutates only once.
 const d=game();d.run(`player.sectTotalContribution=1000;discipleRosterV2815().members=[{id:1,name:'试验弟子',level:6,specialty:1,job:null}];showDisciplesV2815();`);assert(d.run('discipleAllowedV2815()'));
 const dc=connect(d,1);const gold=d.run('player.gold');await d.run('jevDiscipleV2846()');assert.equal(dc.count,1);assert.equal(dc.seen.state.task,'disciple');assert.equal(d.run('discipleRosterV2815().members[0].job'),null);d.c.confirm=()=>false;apply(d,1);assert.equal(d.run('discipleRosterV2815().members[0].job'),null);assert.equal(d.run('player.gold'),gold);
 d.c.confirm=()=>true;await d.run('jevDiscipleV2846()');const rev=d.run('JEV_WORLD_V2846.revision');apply(d,1);assert.equal(d.run('discipleRosterV2815().members[0].job.missionType'),1);d.run(`jevApplyV2846(${rev},1)`);assert.equal(d.run('player.gold'),gold);
 // Relationship tone preserves gates, affection cap and one-time chat settlement.
 const n=game();n.run('showRomanceNpc("suwanqing")');const nc=connect(n,1);const chats=n.run('player.romance.npcs.suwanqing.chats');await n.run('jevNpcV2846("suwanqing")');assert.equal(nc.count,1);assert.equal(n.run('player.romance.npcs.suwanqing.chats'),chats);apply(n,1);assert.equal(n.run('player.romance.npcs.suwanqing.chats'),chats+1);assert.match(n.ids.get('storyText').innerHTML,/认真听/);
 // War selection changes tactics without advancing battles, consuming supplies or awarding rewards.
 const w=game();w.run(`player.warState.campaignV2775={versionV2839:1,id:'test',originSect:player.sect,enemy:Object.keys(DEMON_FACTION_POWER)[0],step:0,score:0,log:[],records:[],settled:false,our:2000,foe:1200,roster:[],realm:0,phase:0,morale:60,supplies:3,rests:0,selected:[null,null,null],attempts:[0,0,0],reports:[1,0,2],rolls:[.1,.2,.3],pending:null};showWarCampaignV2775();`);const wc=connect(w,1);await w.run('jevWarV2846()');assert.equal(wc.count,1);apply(w,1);assert.equal(w.run('warCampaignV2839().selected[0]'),1);assert.equal(w.run('warCampaignV2839().step'),0);assert.equal(w.run('warCampaignV2839().supplies'),3);
 // Management routes to actual job UI, does not recruit or spend by itself.
 const s=game();s.run('player.sectTotalContribution=1000;showSectHall();');const sc=connect(s,1),sg=s.run('player.gold');await s.run('jevSectV2846()');assert.equal(sc.count,1);apply(s,1);assert.match(s.ids.get('storyText').innerHTML,/弟子事务/);assert.equal(s.run('player.gold'),sg);
 console.log('PASS actual disciple, NPC, war and management menus with simulated provider; manual choices and spending confirmation');
 // Secret exploration: eligibility, event frequency, 30-day cost, single reward; fallback remains playable.
 const r=game();r.run('player.worldTime.totalDays=GAME_DAYS_PER_YEAR*100;player.sectTournament.secretQualifiedCentury=getGameDate().year;showSecretRealm();');assert(r.run('hasSectSecretQualification()'));
 const rc=connect(r,0),day=r.run('discipleDayV2815()');const math=r.c.Math;r.c.Math=Object.create(Math);r.c.Math.random=()=>.1;
 await r.run('jevSecretV2846()');assert.equal(rc.count,1);assert.equal(r.run('discipleDayV2815()'),day+30);assert(!r.run('JEV_WORLD_V2846.panel'));r.c.Math=math;
 const forbidden=game();connect(forbidden);const old=forbidden.run('JSON.stringify(player)');await forbidden.run('jevSecretV2846()');assert.equal(forbidden.run('JSON.stringify(player)'),old);
 // Cancellation, low confidence, malformed data, old state and timeout never execute an action.
 for(const mutation of ['closeJevWorldV2846()','showSectHall()','player={...player}','player.romance.npcs.suwanqing.chats++']){
  const f=game();connect(f);let done;f.c.fetch=()=>new Promise(resolve=>done=resolve);const pending=f.run('jevNpcV2846("suwanqing")');f.run(mutation);const after=f.run('JSON.stringify(player)');done({ok:true,json:async()=>({source:'jev',task:'npc',choice:'o1',confidence:.9})});await pending;assert.equal(f.run('JSON.stringify(player)'),after);assert.equal(f.run('JEV_WORLD_V2846.selection'),null);
 }
 const slow=game();connect(slow);slow.c.fetch=async()=>({ok:true,json:()=>new Promise(()=>{})});const pending=slow.run('jevNpcV2846("suwanqing")');await tick();slow.flush(4500);await pending;assert.match(slow.ids.get('jevDecisionStatusV2846').textContent,/超时/);assert(slow.run('JEV_WORLD_V2846.selection'));
 // Counts persist across reload and 100 is informational only.
 const m=game();const mc=connect(m,1);await m.run('jevNpcV2846("suwanqing")');assert.equal(m.run('jevMeterV2846().calls'),1);assert.equal(m.run('jevMeterV2846().tokens'),600);
 m.run('closeJevWorldV2846();FORGE_ADVICE_V2842.nextAt=0;JEV_WORLD_V2846.cache.clear();jevMeterV2846().calls=100;jevSaveMeterV2846();');await m.run('jevNpcV2846("suwanqing")');assert.equal(mc.count,2);assert.equal(m.run('jevMeterV2846().calls'),101);
 m.run('JEV_WORLD_V2846.meter=null');assert.equal(m.run('jevMeterV2846().calls'),101);
 // Existing forge and monster requests also continue beyond the former daily cap.
 const cap=game();let capCalls=0;connect(cap);cap.c.fetch=async(url,opt)=>{capCalls++;const monster=JSON.parse(opt.body).task==='monster';return {ok:true,json:async()=>({source:'jev',...(monster?{task:'monster'}:{}),choice:monster?'guard':'keep',confidence:.9,usage:{input_tokens:400,output_tokens:10}})}};
 cap.run('jevMeterV2846().calls=100;jevSaveMeterV2846();player.gold=10000;player.equipmentInventory=[Object.keys(EQUIPMENT_DB).find(k=>EQUIPMENT_DB[k].slot===\"weapon\")];selectForgeV2825(\"bag\",0);mutateForgeV2825(forgeSelectionV2825.nonce,\"wash\");');
 await cap.run('requestForgeJevV2842(forgeSelectionV2825.nonce)');assert.equal(capCalls,1);assert.match(cap.ids.get('forgeJevResultV2842').textContent,/保留/);
 await cap.run('startCombat({name:\"野狼\",hp:50000,maxHp:50000,atk:1,def:1,gold:1,exp:1});FORGE_ADVICE_V2842.nextAt=0;MONSTER_JEV_V2844.enabled=true;isPlayerTurn=false;enemyTurn()');cap.flush(150);assert.equal(capCalls,2);assert.equal(cap.run('isPlayerTurn'),true);assert.equal(cap.run('jevMeterV2846().calls'),102);
 console.log('PASS request 101+ for new decisions, forge and monsters; cancellation, timeout fallback and usage accounting');
 // Actual equipped skill selection, affordability, per-battle cap and stale mana protection.
 const h=game();h.run(`player.level=4;syncUnlockedSkills();ensureSkillLoadoutV212(player);startCombat({name:'野狼',hp:50000,maxHp:50000,atk:1,def:1,gold:1,exp:1});player.hp=getMaxHp();player.mp=getMaxMp();isPlayerTurn=true;setHeroJevV2846(true);`);h.timers.clear();
 const hc=connect(h,1);h.run('window.localHero={action:"attack",index:null,skill:null};window.prefHero={mode:"burst",healAt:40,reserve:30};');
 assert(h.run('getAvailableCombatSkillsV2769().length')>0);const pick=await h.run('choosePlayerJevV2846(localHero,()=>true,prefHero)');assert.equal(hc.count,1);assert.equal(pick.action,'skill');assert(h.run(`getAvailableCombatSkillsV2769().some(x=>x.index===${pick.index})`));assert.equal(h.run('player.mp'),h.run('getMaxMp()'),'advice alone cannot consume mana');
 await h.run('choosePlayerJevV2846(localHero,()=>true,prefHero)');assert.equal(hc.count,1);
 h.run('FORGE_ADVICE_V2842.nextAt=0;player.hp=1;JEV_WORLD_V2846.cache.clear()');let done;h.c.fetch=()=>new Promise(r=>done=r);const wait=h.run('choosePlayerJevV2846(localHero,()=>true,prefHero)');h.run('player.mp=0');done({ok:true,json:async()=>({source:'jev',task:'hero',choice:'o1',confidence:.9})});assert.equal((await wait).action,'attack');
 // No two-call battle quota: a later changed situation can ask again.
 h.run('FORGE_ADVICE_V2842.nextAt=0;player.mp=getMaxMp();player.hp=getMaxHp();JEV_WORLD_V2846.cache.clear();JEV_WORLD_V2846.hero.get(currentEnemy).calls=8');let laterCalls=0;h.c.fetch=async()=>{laterCalls++;return {ok:true,json:async()=>({source:'jev',task:'hero',choice:'o1',confidence:.9})}};
 await h.run('choosePlayerJevV2846(localHero,()=>true,prefHero)');assert.equal(laterCalls,1);assert.equal(h.run('JEV_WORLD_V2846.hero.get(currentEnemy).calls'),9);
 h.run('setBattlePresentationV2756("cinema");showJevHubV2846()');assert.match(h.ids.get('cinemaPauseBtnV2756').textContent,/继续/);h.run('closeJevWorldV2846();toggleCinemaPauseV2756()');assert.match(h.ids.get('cinemaPauseBtnV2756').textContent,/暂停/);
 for(const f of [idle,d,n,w,s,r,forbidden,slow,m,h])assert.equal(f.errors.length,0,JSON.stringify(f.errors));
 console.log('PASS actual hero loadout, no unlearned skills, no advice resource mutation, rare-call and stale-mana guards');
})().catch(e=>{console.error(e);process.exitCode=1});
