'use strict';
const fs=require('node:fs'),vm=require('node:vm'),a=require('node:assert/strict'),fixture=require('./v2843-dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||'release-v2843/xiantu-v2831-scroll';
const {createHandler,parseAnswer}=require(require('node:path').resolve(root,'../tencent-jev-function/index.js'));
const origin='https://example.test',token='test_access_token_32characters_ok';
const good={type:'choice',choice:'replace',probabilities:{keep:.04,replace:.92,consider:.04},confidence:.86};
const payload={version:1,grade:1,goal:'survival',before:{atk:4,def:0,hp:10,mp:0},after:{atk:0,def:4,hp:30,mp:0}};
function event(state=payload){return {httpMethod:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Xiantu-Access':token},body:JSON.stringify(state)}}
function game(configured=true){
 const f=fixture(root);f.c.AbortController=AbortController;
 for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1])){
  if(file==='xiantu-v2842-jev-forge.js')vm.runInContext(fs.readFileSync(root+'/'+file,'utf8').replace(/endpoint: '[^']*'/,configured?"endpoint: 'https://example.test/api/jev-forge'":"endpoint: ''"),f.c);
  else f.load(file);
 }
 f.run(`startGame();closeWorldOverlay();player.gold=10000;player.equipmentInventory=[Object.keys(EQUIPMENT_DB).find(k=>EQUIPMENT_DB[k].slot==='weapon')];selectForgeV2825('bag',0);mutateForgeV2825(forgeSelectionV2825.nonce,'wash');`);
 f.timers.clear();return f;
}
const state=f=>f.run('JSON.stringify({p:player,ref:forgeSelectionV2825?.name})');
function unlock(f){f.ids.get('forgeAccessV2842').value=token;f.run('unlockForgeJevV2842(forgeSelectionV2825.nonce)');}
function result(f){return f.ids.get('forgeJevResultV2842').textContent;}
async function request(f){return await f.run('requestForgeJevV2842(forgeSelectionV2825.nonce)')}
(async()=>{
 // Server authorization, limits, whitelist and official response schema.
 let clock=100000,used=0,bodySeen;
 const env={JEV_API_KEY:'test_server_key',JEV_ACCESS_TOKEN:token,JEV_ALLOWED_ORIGINS:origin};
 const handler=createHandler({env,now:()=>clock,call:async b=>{used++;bodySeen=b;return {answers:{forge:good}}}});
 a.equal((await handler({...event(),httpMethod:'OPTIONS'})).statusCode,204);a.equal(used,0);
 a.equal((await handler({...event(),headers:{...event().headers,Origin:'https://untrusted.test'}})).statusCode,403);
 a.equal((await handler({...event(),headers:{...event().headers,'X-Xiantu-Access':'wrong'}})).statusCode,401);
 a.equal((await handler(event({...payload,after:{...payload.after,hp:999999}}))).statusCode,400);
 a.equal((await handler(event({...payload,goal:'__proto__'}))).statusCode,400);
 a.equal((await handler(event({...payload,grade:NaN}))).statusCode,400);a.equal(used,0);
 const accepted=await handler(event({...payload,playerName:'NEVER_SEND',apiKey:'NEVER_SEND',questions:{inject:'NEVER_SEND'}}));
 a.equal(accepted.statusCode,200);a.equal(JSON.parse(accepted.body).source,'jev');a(!JSON.stringify(bodySeen).includes('NEVER_SEND'));
 a.equal(bodySeen.model,'jev-latest');a.equal(bodySeen.questions.forge.type,'choice');
 a.equal((await handler(event())).statusCode,200);a.equal(used,1,'same state cached');
 a.equal((await handler(event({...payload,goal:'attack'}))).statusCode,429);
 clock+=10001;const encoded=event({...payload,goal:'attack'});encoded.body=Buffer.from(encoded.body).toString('base64');encoded.isBase64Encoded=true;
 a.equal((await handler(encoded)).statusCode,200);a.equal(used,2);
 a.throws(()=>parseAnswer({answers:{forge:{...good,confidence:'0.9'}}}));
 a.throws(()=>parseAnswer({answers:{forge:{...good,choice:'equip'}}}));
 a.throws(()=>parseAnswer({answers:{forge:{...good,probabilities:{keep:.6,replace:.9,consider:.1}}}}));
 a.throws(()=>parseAnswer({answers:{forge:{...good,choice:'keep'}}}));
 const bad=createHandler({env,call:async()=>{throw Error('test_server_key')}});
 const badResp=await bad(event());a.equal(badResp.statusCode,502);a(!badResp.body.includes('test_server_key'));
 const missing=createHandler({env:{...env,JEV_API_KEY:''}});a.equal((await missing(event())).statusCode,503);
 let serverDone;const busy=createHandler({env,call:()=>new Promise(r=>serverDone=r)});const first=busy(event());
 a.equal((await busy(event())).statusCode,429);serverDone({answers:{forge:good}});await first;
 let n=0,t=1000000;
 // Rate gate per-hour tested with 10-second spacing and unique four-stat payloads.
 t=1000000;n=0;const hourly=createHandler({env,now:()=>t,call:async()=>{n++;return {answers:{forge:good}}}});
 for(let i=0;i<120;i++){t+=10001;a.equal((await hourly(event({...payload,after:{atk:0,def:(i%15)+1,hp:Math.floor(i/15)+1,mp:0}}))).statusCode,200)}
 t+=10001;a.equal((await hourly(event())).statusCode,429);a.equal(n,120);
 console.log('PASS server auth/origin, strict numeric input, prompt whitelist, response schema, base64, cache, concurrent/rate gates, no secret in errors');
 // Real game paths: offline advice never pays/replaces; existing manual flow stays authoritative.
 const f=game(false);a(f.ids.has('forgeAdviceV2842'));a(!f.ids.has('forgeJevButtonV2842'));const snapshot=state(f),saved=[...f.storage];
 f.run("setForgeGoalV2842(forgeSelectionV2825.nonce,'survival')");a.equal(state(f),snapshot);a.deepEqual([...f.storage],saved);
 a.match(f.ids.get('storyText').innerHTML,/不增加寿元/);
 const gold=f.run('player.gold');f.run("mutateForgeV2825(forgeSelectionV2825.nonce,'wash')");a.equal(f.run('player.gold'),gold,'pending wash cannot charge again');
 f.run('chooseForgeAffixesV2825(forgeSelectionV2825.nonce,true)');a.equal(f.run('player.gold'),gold);a(!f.run('player.forgeV2825.items[forgeSelectionV2825.name].pending'));
 f.run('saveGame();loadAndStart();selectForgeV2825("bag",0)');a.equal(f.run('player.forgeV2825.items[forgeSelectionV2825.name].affixes.length'),2);
 f.run("selectForgeV2825('bag',0);mutateForgeV2825(forgeSelectionV2825.nonce,'wash');chooseForgeAffixesV2825(forgeSelectionV2825.nonce,false)");a.equal(f.run('player.forgeV2825.items[forgeSelectionV2825.name].affixes.length'),2);
 f.run(`window.testState=${JSON.stringify(payload)}`);
 a.match(f.run('forgeLocalAdviceV2842({...testState,after:testState.before})'),/相同/);
 a.match(f.run('forgeLocalAdviceV2842({...testState,before:{atk:0,def:0,hp:0,mp:0}})'),/建议替换/);
 a.match(f.run('forgeLocalAdviceV2842({...testState,after:{atk:0,def:0,hp:0,mp:0}})'),/建议保留/);
 console.log('PASS offline compare, honest HP/MP labels, local goals, no extra charge, explicit keep/replace, affixes save/load');
 // Full client -> actual function handler -> mocked Jev; not a live provider call.
 const g=game();unlock(g);let requests=0;const adapter=createHandler({env,call:async()=>({answers:{forge:good}})});
 g.c.fetch=async(url,opt)=>{requests++;a(!opt.body.includes('test_access'));a.equal(Object.keys(JSON.parse(opt.body)).sort().join(','),'after,before,goal,grade,version');const response=await adapter({httpMethod:opt.method,headers:{...opt.headers,Origin:origin},body:opt.body});return {ok:response.statusCode===200,status:response.statusCode,json:async()=>JSON.parse(response.body)}};
 const before=state(g);await request(g);a.match(result(g),/采用新词条/);a.equal(state(g),before);await request(g);a.equal(requests,1);
 a(!JSON.stringify([...g.storage]).includes(token));a(!state(g).includes(token));
 a.match(g.run(`forgeJevMessageV2842({source:'jev',choice:'replace',confidence:.4})`),/暂无明确建议/);
 console.log('PASS client/function integration with mocked Jev, low confidence, cache, no automatic mutation or persisted access token');
 // Async results never overwrite a new item, closed window, new goal, character or confirmed wash.
 for(const change of ["showForgeV2825()", "chooseForgeAffixesV2825(forgeSelectionV2825.nonce,false)", "setForgeGoalV2842(forgeSelectionV2825.nonce,'attack')", "player={...player}", "document.getElementById('storyPanel').classList.add('hidden')"]){
  const h=game();unlock(h);let done;h.c.fetch=()=>new Promise(r=>done=r);const p=request(h);await Promise.resolve();h.run(change);const snap=state(h);done({ok:true,json:async()=>({source:'jev',choice:'replace',confidence:.9})});await p;a.equal(state(h),snap);a(!h.ids.get('forgeJevResultV2842')?.textContent.includes('建议采用'));a.equal(h.errors.length,0);
 }
 const slow=game();unlock(slow);slow.c.fetch=async()=>({ok:true,json:()=>new Promise(()=>{})});const waiting=request(slow);await Promise.resolve();await Promise.resolve();slow.flush(10000);await waiting;a.match(result(slow),/超时/);a(!slow.ids.get('forgeJevButtonV2842').disabled);
 const offline=game();unlock(offline);const offSnapshot=state(offline);await request(offline);a.match(result(offline),/本地对比仍可用/);a.equal(state(offline),offSnapshot);
 const twice=game();unlock(twice);let done,count=0;twice.c.fetch=()=>{count++;return new Promise(r=>done=r)};const pending=request(twice);await request(twice);a.equal(count,1);done({ok:true,json:async()=>({source:'jev',choice:'keep',confidence:.9})});await pending;
 console.log('PASS stale item/goal/character/window/confirmation results ignored; JSON-body timeout, offline fallback, duplicate tap guard');
 for(const x of [f,g,slow,offline,twice])a.equal(x.errors.length,0,JSON.stringify(x.errors));
})().catch(e=>{console.error(e);process.exitCode=1});
