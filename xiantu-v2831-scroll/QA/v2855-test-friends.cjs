'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),fixture=require('./v2855-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2855/xiantu-v2831-scroll';
const {createHandler}=require(path.resolve(root,'../tencent-jev-function/index.js'));
const origin='https://example.test',other='https://other.test';
const privateCode='test_private_owner_access_code_001',apiKey='test_private_provider_key_001';
const environment=()=>({JEV_API_KEY:apiKey,JEV_ACCESS_TOKEN:privateCode,JEV_ALLOWED_ORIGINS:origin+','+other,JEV_PUBLIC_PLAY:'true'});
const state={task:'mapnpc',version:1,context:[0,0,0,100,0],options:[0,1].map(i=>({id:'o'+i,a:i,b:0,c:0,d:0,e:0}))};
const event=(body,headers={})=>({httpMethod:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
function response(s){const task=s.task||'forge',ids=task==='monster'?s.available:task==='forge'?['keep','replace','consider']:s.options.map(o=>o.id),choice=ids[0];return {answers:{[task]:{type:'choice',choice,confidence:.95,probabilities:Object.fromEntries(ids.map(k=>[k,k===choice?1:0]))}},usage:{input_tokens:500,output_tokens:20}};}
const plain=r=>JSON.parse(r.body);
const fixtures=[];
function game(saved=[]){
 const f=fixture(root);fixtures.push(f);let clock=Date.now();f.clock=()=>clock;f.advance=ms=>clock+=ms;f.c.Date=class extends Date{static now(){return clock}};f.c.AbortController=AbortController;
 f.c.Math=Object.create(Math);f.c.Math.random=()=>.5;f.c.location.origin=origin;f.storage.set('xiantu_battle_presentation_v2756','report');for(const [k,v] of saved)f.storage.set(k,v);
 for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
 f.run('startGame();closeWorldOverlay();');f.timers.clear();return f;
}
function wire(f,env=environment()){
 let paid=0;const sent=[];const handler=createHandler({env,now:f.clock,call:async b=>{paid++;return response(b.state)}});
 f.c.fetch=async(url,opt)=>{a.match(url,/\/api\/jev-forge$/);const body=JSON.parse(opt.body);sent.push({body,headers:opt.headers});const r=await handler(event(body,opt.headers));return {ok:r.statusCode===200,status:r.statusCode,json:async()=>plain(r)}};
 return {env,sent,get paid(){return paid}};
}
const tick=async()=>{for(let i=0;i<10;i++)await Promise.resolve()};
(async()=>{
 let clock=Date.now(),paid=0;const env=environment();const handler=createHandler({env,now:()=>clock,call:async b=>{paid++;return response(b.state)}});
 const issue=()=>handler(event({task:'session',version:1}));
 a.equal((await handler(event({task:'session',version:1},{Origin:'https://evil.test'}))).statusCode,403);
 const handshake=await issue();a.equal(handshake.statusCode,200);const session=plain(handshake);a.equal(paid,0);a.equal(session.expiresAt,clock+900000);a(!handshake.body.includes(privateCode));a(!handshake.body.includes(apiKey));
 const guest={'X-Xiantu-Session':session.token};a.equal((await handler(event(state,guest))).statusCode,200);a.equal(paid,1);a.equal((await handler(event(state,guest))).statusCode,200);a.equal(paid,1);
 a.equal((await handler(event(state,{'X-Xiantu-Access':'xiantu-public-play-v2850'}))).statusCode,401,'public marker is not a credential');
 const [payload,mac]=session.token.split('.'),tampered=(payload[0]==='a'?'b':'a')+payload.slice(1)+'.'+mac;
 a.equal((await handler(event(state,{'X-Xiantu-Session':tampered}))).statusCode,401);
 a.equal((await handler(event(state,{...guest,Origin:other}))).statusCode,401);
 a.equal((await handler(event({...state,task:'admin',prompt:'arbitrary'},guest))).statusCode,400);a.equal(paid,1);
 a.equal((await handler(event({task:'session',version:1,prompt:'arbitrary'}))).statusCode,400);
 env.JEV_PUBLIC_PLAY='false';a.equal((await issue()).statusCode,403);a.equal((await handler(event(state,guest))).statusCode,401);a.equal((await handler(event(state,{'X-Xiantu-Access':privateCode}))).statusCode,200);
 env.JEV_PUBLIC_PLAY='true';clock+=900001;a.equal((await handler(event(state,guest))).statusCode,401);const fresh=plain(await issue());env.JEV_API_KEY='rotated_private_key';a.equal((await handler(event(state,{'X-Xiantu-Session':fresh.token}))).statusCode,401);
 const closedEnv=environment();delete closedEnv.JEV_PUBLIC_PLAY;const closed=createHandler({env:closedEnv,call:async()=>{throw Error('must not call')}});a.equal((await closed(event({task:'session',version:1}))).statusCode,403);
 console.log('PASS explicit public enable, session without paid calls, fixed scope, forged/expired/wrong-origin/revoked tickets rejected, private access retained');
 const f=game(),network=wire(f);a.equal(await f.run('bootJevFriendsV2850()'),true);a.equal(network.paid,0);a.equal(network.sent.length,1);a.equal(f.run('MONSTER_JEV_V2844.enabled&&JEV_WORLD_V2846.heroEnabled&&NPC_JEV_V2849.allyCloud'),true);
 const ticket=f.run('JEV_FRIENDS_V2850.token');a(ticket);a(!JSON.stringify([...f.storage]).includes(ticket));a(!f.run('JSON.stringify(player)').includes(ticket));a(!JSON.stringify(network.sent).includes(privateCode));
 f.run('showJevHubV2846()');a(!f.ids.get('jevWorldPanelV2846').innerHTML.includes('jevHubAccessV2846'));a.match(f.ids.get('jevWorldPanelV2846').innerHTML,/无需输入口令/);f.run('closeJevWorldV2846()');await f.run('jevMapNpcV2849("mentor")');a.equal(network.paid,1);a.equal(network.sent.at(-1).body.task,'mapnpc');a.equal(network.sent.at(-1).headers['X-Xiantu-Access'],undefined);a.equal(network.sent.at(-1).headers['X-Xiantu-Session'],ticket);a.match(f.ids.get('jevDecisionStatusV2846').textContent,/Jev 置信度/);
 f.advance(901000);f.run('closeJevWorldV2846();JEV_WORLD_V2846.cache.clear()');await f.run('jevMapNpcV2849("mentor")');a.equal(network.sent.filter(x=>x.body.task==='session').length,2);a.notEqual(f.run('JEV_FRIENDS_V2850.token'),ticket);a.equal(network.paid,2);a.match(f.ids.get('jevDecisionStatusV2846').textContent,/Jev 置信度/,'renewal must not invalidate the legitimate decision');
 const saved=[...f.storage];f.run('setHeroJevV2846(false);setCompanionCloudV2849(false);disableMonsterJevV2844()');const off=game([...f.storage]);const offNet=wire(off);await off.run('bootJevFriendsV2850()');a.equal(off.run('MONSTER_JEV_V2844.enabled||JEV_WORLD_V2846.heroEnabled||NPC_JEV_V2849.allyCloud'),false);a.equal(offNet.paid,0);
 off.run('clearJevDeviceV2845()');a.equal(off.run('JEV_FRIENDS_V2850.token'),'');const stopped=game([...off.storage]),stoppedNet=wire(stopped);a.equal(await stopped.run('bootJevFriendsV2850()'),false);a.equal(stoppedNet.sent.length,0);a.equal(await stopped.run('retryJevFriendsV2850()'),true);a.equal(stopped.run('MONSTER_JEV_V2844.enabled&&JEV_WORLD_V2846.heroEnabled&&NPC_JEV_V2849.allyCloud'),true);
 console.log('PASS fresh player defaults, no long-term secret sent/stored, credential-free controls, real NPC request, automatic renewal and remembered manual stop');
 const combat=game(),combatNet=wire(combat);await combat.run('bootJevFriendsV2850()');combat.run('startCombat({name:"野狼",hp:50000,maxHp:50000,atk:2,def:2,gold:1,exp:1});player.hp=getMaxHp();isPlayerTurn=false');await combat.run('enemyTurn()');combat.flush(150);a.equal(combatNet.sent.at(-1).body.task,'monster');a.equal(combat.run('isPlayerTurn'),true);a.equal(combatNet.paid,1);a.equal(combat.ids.get('monsterAccessV2844'),undefined);a.match(combat.ids.get('monsterAiV2844').innerHTML,/无需输入口令/);
 const expiredByServer=game(),esNet=wire(expiredByServer);await expiredByServer.run('bootJevFriendsV2850()');esNet.env.JEV_API_KEY='rotated_server_key';await expiredByServer.run('jevMapNpcV2849("mentor")');a.equal(esNet.sent.filter(x=>x.body.task==='session').length,2);a.equal(esNet.paid,1);
 const disabled=game(),disabledEnv=environment();disabledEnv.JEV_PUBLIC_PLAY='false';const disabledNet=wire(disabled,disabledEnv);a.equal(await disabled.run('bootJevFriendsV2850()'),false);await disabled.run('jevMapNpcV2849("mentor")');a.equal(disabledNet.paid,0);a.match(disabled.ids.get('jevDecisionStatusV2846').textContent,/本地|暂不可用/);
 const late=game();let release;late.c.fetch=()=>new Promise(r=>release=r);const waiting=late.run('bootJevFriendsV2850()');late.run('clearJevDeviceV2845()');a.equal(await waiting,false);release({ok:true,status:200,json:async()=>session});await tick();a.equal(late.run('JEV_FRIENDS_V2850.token'),'');a.equal(late.run('FORGE_ADVICE_V2842.access'),'');
 const slow=game();slow.c.fetch=async()=>({ok:true,status:200,json:()=>new Promise(()=>{})});const stall=slow.run('bootJevFriendsV2850()');await tick();slow.flush(4000);a.equal(await stall,false);a.equal(slow.run('JEV_FRIENDS_V2850.pending'),null);
 const duplicate=game(),dupNet=wire(duplicate);await Promise.all([duplicate.run('bootJevFriendsV2850()'),duplicate.run('bootJevFriendsV2850()')]);a.equal(dupNet.sent.length,1);
 const diag=game(),diagNet=wire(diag);const diagPage=diag.c.document.createElement('div');diagPage.innerHTML=fs.readFileSync(root+'/jev-check.html','utf8');diag.c.document.body.appendChild(diagPage);diag.load('jev-check-v2843.js');await tick();await diag.run('ensureJevFriendSessionV2850()');a.equal(diag.ids.get('access').hidden,true);a.equal(diagNet.paid,0);await diag.ids.get('jevCheckForm').listeners.submit[0]({preventDefault(){}});a.equal(diagNet.paid,1);a.match(diag.ids.get('result').textContent,/连接成功/);a(!diag.ids.get('result').textContent.includes(ticket));
 for(const item of fixtures)a.equal(item.errors.length,0,JSON.stringify(item.errors));
 console.log('PASS actual enemy turn, rotation retry, disabled/offline fallback, late response after stop, bounded session timeout, deduplication and no-input diagnostic');
})().catch(e=>{console.error(e);process.exitCode=1});
