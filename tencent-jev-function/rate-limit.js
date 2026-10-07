'use strict';
const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const positive = (value, fallback) => value == null ? fallback : (/^[1-9]\d*$/.test(value) && Number(value) <= 10000 ? Number(value) : NaN);
// One atomic acquisition covers caller cooldown, aggregate budget and concurrent leases.
const ACQUIRE = `
local t=redis.call('TIME'); local now=t[1]*1000+math.floor(t[2]/1000)
redis.call('ZREMRANGEBYSCORE',KEYS[3],'-inf',now)
if tonumber(redis.call('GET',KEYS[1]) or '0')>=tonumber(ARGV[5]) or tonumber(redis.call('GET',KEYS[2]) or '0')>=tonumber(ARGV[2]) or redis.call('ZCARD',KEYS[3])>=tonumber(ARGV[3]) then return 0 end
if redis.call('INCR',KEYS[1])==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end
if redis.call('INCR',KEYS[2])==1 then redis.call('PEXPIRE',KEYS[2],60000) end
redis.call('ZADD',KEYS[3],now+30000,ARGV[4]); redis.call('PEXPIRE',KEYS[3],60000)
return 1`;
function createLimiter(env, now = Date.now, request = globalThis.fetch) {
  const paidLimit = positive(env.JEV_MAX_REQUESTS_PER_MINUTE, 6);
  const concurrent = positive(env.JEV_MAX_CONCURRENT, 2);
  const sessionLimit = positive(env.JEV_MAX_SESSIONS_PER_MINUTE, 30);
  const url = env.JEV_RATE_LIMIT_URL, token = env.JEV_RATE_LIMIT_TOKEN;
  const configured = Number.isFinite(paidLimit) && Number.isFinite(concurrent) && Number.isFinite(sessionLimit);
  const remote = !!(url || token || env.JEV_REQUIRE_SHARED_LIMITER === 'true');
  const groups = new Map();
  async function command(args) {
    const endpoint = new URL(url);
    if(endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !token) throw Error('limiter_config');
    const response = await request(endpoint.href, {method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(2000),redirect:'error'});
    if(!response.ok)throw Error('limiter_unavailable');
    const body=await response.json();if(body.error)throw Error('limiter_unavailable');return body.result;
  }
  return { async acquire(kind, identity) {
    if(!configured)throw Error('limiter_config');
    const limit=kind==='session'?sessionLimit:paidLimit, max=kind==='session'?sessionLimit:concurrent;
    const cooldown=kind==='session'?60000:10000, actorLimit=kind==='session'?5:1, lease=crypto.randomBytes(16).toString('hex');
    const prefix='xiantu:{rate-v1}:'+kind, actor=hash(identity);
    if(remote){
      const ok=await command(['EVAL',ACQUIRE,3,prefix+':actor:'+actor,prefix+':budget',prefix+':active',cooldown,limit,max,lease,actorLimit]);
      if(ok!==1)return null;
      return async()=>{await command(['ZREM',prefix+':active',lease]);};
    }
    const time=now();let group=groups.get(kind);
    if(!group){group={actors:new Map(),active:new Map(),count:0,reset:time+60000};groups.set(kind,group);}
    for(const [key,record] of group.actors)if(record.end<=time)group.actors.delete(key);
    for(const [key,end] of group.active)if(end<=time)group.active.delete(key);
    if(time>=group.reset){group.count=0;group.reset=time+60000;}
    if((group.actors.get(actor)?.count||0)>=actorLimit||group.count>=limit||group.active.size>=max)return null;
    const record=group.actors.get(actor)||{count:0,end:time+cooldown};record.count++;group.actors.set(actor,record);group.active.set(lease,time+30000);group.count++;
    return async()=>{group.active.delete(lease);};
  }};
}
module.exports={createLimiter,ACQUIRE};
