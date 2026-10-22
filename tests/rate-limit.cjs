const {test}=require('node:test'),assert=require('node:assert/strict');
const {createLimiter}=require('../tencent-jev-function/rate-limit');
const {createHandler}=require('../tencent-jev-function');
const env={JEV_API_KEY:'test-only-key',JEV_ACCESS_TOKEN:'test-only-owner-access',JEV_ALLOWED_ORIGINS:'https://game.test',JEV_PUBLIC_PLAY:'true'};
const event=(body,token,ip='192.0.2.1')=>({httpMethod:'POST',requestContext:{sourceIp:ip},headers:{origin:'https://game.test','content-type':'application/json','x-xiantu-session':token||''},body:JSON.stringify(body)});
const state=goal=>({version:1,grade:1,goal,before:{atk:0,def:0,hp:0,mp:0},after:{atk:0,def:0,hp:0,mp:0}});
const answer={answers:{forge:{type:'choice',choice:'keep',confidence:1,probabilities:{keep:1,replace:0,consider:0}}}};
test('independent sessions proceed concurrently; one player retains cooldown; shared budget remains',async()=>{
 let clock=100000,finish=[];const handler=createHandler({env,now:()=>clock,call:()=>new Promise(r=>finish.push(()=>r(answer)))});
 const ticket=async ip=>JSON.parse((await handler(event({task:'session',version:1},'',ip))).body).token;
 const a=await ticket('192.0.2.1'),b=await ticket('192.0.2.2');const first=handler(event(state('attack'),a));const second=handler(event(state('survival'),b));await new Promise(r=>setImmediate(r));assert.equal(finish.length,2);
 assert.equal((await handler(event(state('mana'),a))).statusCode,429);finish.forEach(f=>f());assert.deepEqual((await Promise.all([first,second])).map(r=>r.statusCode),[200,200]);
 const limiter=createLimiter({JEV_MAX_REQUESTS_PER_MINUTE:'2'},()=>clock);await(await limiter.acquire('paid','one'))();await(await limiter.acquire('paid','two'))();assert.equal(await limiter.acquire('paid','three'),null);clock+=60001;assert.ok(await limiter.acquire('paid','three'));
});
test('session issuance is bounded even when forwarding headers vary',async()=>{
 const h=createHandler({env,now:()=>10000});for(let i=0;i<5;i++)assert.equal((await h(event({task:'session',version:1}))).statusCode,200);
 const e=event({task:'session',version:1});e.headers['x-forwarded-for']='192.0.2.2';assert.equal((await h(e)).statusCode,429);
});
test('shared limiter fails closed, validates config, and sends atomic commands',async()=>{
 await assert.rejects(createLimiter({JEV_REQUIRE_SHARED_LIMITER:'true'}).acquire('paid','a'));
 await assert.rejects(createLimiter({JEV_MAX_CONCURRENT:'0'}).acquire('paid','a'));
 const sent=[];const limiter=createLimiter({JEV_RATE_LIMIT_URL:'https://redis.example.test',JEV_RATE_LIMIT_TOKEN:'test-only'},Date.now,async(u,o)=>{sent.push(JSON.parse(o.body));return {ok:true,json:async()=>({result:1})}});
 const release=await limiter.acquire('paid','secret-session');await release();assert.equal(sent[0][0],'EVAL');assert.equal(sent[1][0],'ZREM');assert(!JSON.stringify(sent).includes('secret-session'));
 let calls=0;const h=createHandler({env:{...env,JEV_REQUIRE_SHARED_LIMITER:'true'},call:async()=>{calls++;return answer;}});const e=event(state('balanced'));e.headers['x-xiantu-access']=env.JEV_ACCESS_TOKEN;assert.equal((await h(e)).statusCode,503);assert.equal(calls,0);
});
test('hour/day budgets survive minute resets and lease release, then expire independently',async()=>{
 let clock=0;
 const limiter=createLimiter({JEV_MAX_REQUESTS_PER_HOUR:'2',JEV_MAX_REQUESTS_PER_DAY:'3'},()=>clock);
 const use=async()=>{const release=await limiter.acquire('paid','one');assert.equal(typeof release,'function');await release();};
 await use();clock=60000;await use();clock=120000;
 assert.equal(await limiter.acquire('paid','two'),null);
 clock=3600000;await use();clock=7200000;
 assert.equal(await limiter.acquire('paid','three'),null);
 clock=86400000;await use();
});
test('session hour/day limits cannot be bypassed with a different IP; budgets are separate',async()=>{
 let clock=0;
 const limiter=createLimiter({JEV_MAX_SESSIONS_PER_HOUR:'1',JEV_MAX_SESSIONS_PER_DAY:'2'},()=>clock);
 await(await limiter.acquire('session','ip1'))();clock=60000;
 assert.equal(await limiter.acquire('session','ip2'),null);
 assert.equal(typeof await limiter.acquire('paid','player'),'function');
 clock=3600000;await(await limiter.acquire('session','ip2'))();clock=7200000;
 assert.equal(await limiter.acquire('session','ip3'),null);
 clock=86400000;assert.equal(typeof await limiter.acquire('session','ip3'),'function');
});
test('invalid long-term budget fails closed before any network operation',async()=>{
 for(const name of ['JEV_MAX_REQUESTS_PER_HOUR','JEV_MAX_REQUESTS_PER_DAY','JEV_MAX_SESSIONS_PER_HOUR','JEV_MAX_SESSIONS_PER_DAY'])
  for(const value of ['0','-1','abc','10001','1.5'])await assert.rejects(createLimiter({[name]:value}).acquire('paid','one'),/limiter_config/);
});
