'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {createHandler}=require('../tencent-jev-function'),session=require('../tencent-jev-function/public-session');
const env={JEV_API_KEY:'test-provider-key',JEV_ACCESS_TOKEN:'test-owner-access-token',JEV_ALLOWED_ORIGINS:'https://game.test',JEV_PUBLIC_PLAY:'true'};
const state={version:1,grade:1,goal:'balanced',before:{atk:0,def:0,hp:0,mp:0},after:{atk:1,def:0,hp:0,mp:0}};
const event=(body=state)=>({httpMethod:'POST',requestContext:{sourceIp:'192.0.2.23'},headers:{origin:'https://game.test','content-type':'application/json','x-xiantu-access':env.JEV_ACCESS_TOKEN},body:JSON.stringify(body)});
const answer={answers:{forge:{type:'choice',choice:'keep',confidence:1,probabilities:{keep:1,replace:0,consider:0}}}};
test('API success, cache, preflight and every refusal receive security headers without losing CORS',async()=>{
 const h=createHandler({env,call:async()=>answer,log:()=>{}}),good=event();
 const events=[good,good,{...good,httpMethod:'OPTIONS'},{...good,headers:{...good.headers,origin:'https://else.test'}},{...good,httpMethod:'GET'}, {...good,headers:{...good.headers,'content-type':'text/plain'}},{...good,body:'x'.repeat(8193)},{...good,body:'['},{...good,headers:{...good.headers,'x-xiantu-access':''}}];
 const responses=[];for(const e of events)responses.push(await h(e));
 a.deepEqual(responses.map(r=>r.statusCode),[200,200,204,403,405,415,413,400,401]);
 for(const r of responses){a.equal(r.headers['X-Content-Type-Options'],'nosniff');a.equal(r.headers['X-Frame-Options'],'DENY');a.equal(r.headers['Referrer-Policy'],'no-referrer');a.match(r.headers['Content-Security-Policy'],/frame-ancestors 'none'/);a.equal(r.headers['Cache-Control'],'no-store');}
 a.equal(responses[0].headers['Access-Control-Allow-Origin'],env.JEV_ALLOWED_ORIGINS);a(!responses[3].headers['Access-Control-Allow-Origin']);
});
test('independent session secret survives provider rotation, rejects old signatures, origin changes and expiry',()=>{
 const time=100000,origin=env.JEV_ALLOWED_ORIGINS;
 const legacy=session.issue(origin,env,time);a(session.verify(legacy.token,origin,env,time));
 const isolated={...env,JEV_SESSION_SECRET:'test-session-key-'.repeat(3)},ticket=session.issue(origin,isolated,time);
 a(session.verify(ticket.token,origin,{...isolated,JEV_API_KEY:'new-provider'},time));
 a(!session.verify(legacy.token,origin,isolated,time));a(!session.verify(ticket.token,origin,env,time));
 a(!session.verify(ticket.token,'https://else.test',isolated,time));a(!session.verify(ticket.token,origin,isolated,ticket.expiresAt));
 a(!session.verify(ticket.token,origin,{...isolated,JEV_SESSION_SECRET:'new-session-key-'.repeat(3)},time));
});
test('invalid explicit session keys fail closed before issuance/payment; owner mode remains available',async()=>{
 for(const key of ['',null,31,'short',' '.repeat(40),'a'.repeat(4097)]){
  const bad={...env,JEV_SESSION_SECRET:key};a.equal(session.configured(bad),false);a.throws(()=>session.issue(env.JEV_ALLOWED_ORIGINS,bad,0),/session_config/);
  let paid=0,leases=0;const h=createHandler({env:bad,limiter:{acquire:async()=>{leases++;return async()=>{}}},call:async()=>{paid++;return answer},log:()=>{}});
  a.equal((await h(event({task:'session',version:1}))).statusCode,503);
  const guest=event();delete guest.headers['x-xiantu-access'];a.equal((await h(guest)).statusCode,503);a.equal(paid,0);a.equal(leases,0);
  a.equal((await h(event())).statusCode,200);a.equal(paid,1);
 }
});
test('refusal logs contain only allowlisted codes and are sampled per code/minute',async()=>{
 let time=0;const logs=[],h=createHandler({env,now:()=>time,log:s=>logs.push(JSON.parse(s)),call:async()=>{throw Error(env.JEV_API_KEY+' '+env.JEV_ACCESS_TOKEN+' 192.0.2.23')}});
 a.equal((await h(event())).statusCode,502);
 const denied=event();denied.headers.origin='https://attacker.test/'+env.JEV_ACCESS_TOKEN;
 for(let i=0;i<100;i++)await h(denied);
 a.deepEqual(logs,[{evt:'xiantu_jev',status:502,error:'jev_unavailable'},{evt:'xiantu_jev',status:403,error:'origin'}]);
 time=60000;await h(denied);a.equal(logs.length,3);
 const off=createHandler({env:{...env,JEV_LOG:'off'},log:()=>{throw Error('must not log')}});a.equal((await off(denied)).statusCode,403);
 const failedLogger=createHandler({env,log:()=>{throw Error('logger unavailable')}});a.equal((await failedLogger(denied)).statusCode,403);
});
