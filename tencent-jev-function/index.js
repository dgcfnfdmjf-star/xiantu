'use strict';
// CloudBase Node.js event function, handler: index.main. No third-party packages.
const https = require('node:https');
const crypto = require('node:crypto');
const publicSession = require('./public-session.js');
const {createLimiter} = require('./rate-limit.js');
const STATS = { atk: 18, def: 15, hp: 90, mp: 36 };
const STATS_V2 = { atk: 27, def: 24, hp: 180, mp: 60 };
const GOALS = { balanced: 'Balance all four stats', attack: 'Prioritize attack', survival: 'Prioritize health and defense', mana: 'Prioritize mana capacity' };
const CHOICES = ['keep', 'replace', 'consider'];
const { CONTRACTS, validWorldState, worldProviderBody } = require('./world.js');
const { validMonsterState, monsterProviderBody } = require('./monster.js');
function validState(input) {
  if(input && Object.hasOwn(CONTRACTS,input.task))return validWorldState(input);
  if(input?.task==='monster')return validMonsterState(input);
  if(input?.task != null && input.task!=='forge')throw Error('task');
  if (!input || ![1,2,3].includes(input.version) || !Number.isInteger(input.grade) || input.grade < 1 || input.grade > 3 || !Object.hasOwn(GOALS, input.goal)) throw Error('state');
  const pick = rows => {
    if (!rows || typeof rows !== 'object' || Array.isArray(rows)) throw Error('stats');
    const out = {};
    for (const [key, max] of Object.entries(input.version===3?{atk:1000000000,def:1000000000,hp:1000000000,mp:1000000000}:input.version===2?STATS_V2:STATS)) {
      if (!Number.isInteger(rows[key]) || rows[key] < 0 || rows[key] > max) throw Error('stats');
      out[key] = rows[key];
    }
    if (input.version!==3 && Object.values(out).filter(v => v > 0).length > 2) throw Error('stats');
    return out;
  };
  // Whitelist only numbers and a known goal. Never forward arbitrary client prompts or saves.
  return { version: input.version, grade: input.grade, goal: input.goal, before: pick(input.before), after: pick(input.after) };
}
function providerBody(state) {
  if(Object.hasOwn(CONTRACTS,state.task))return worldProviderBody(state);
  if(state.task==='monster')return monsterProviderBody(state);
  return { model: 'jev-latest', state: { ...state, preference: GOALS[state.goal],
    rules: { atk: 'attack', def: 'defense', hp: 'maximum health, NOT lifespan or immediate healing', mp: 'maximum mana, NOT immediate recovery',
      basis: state.version===3?'before and after are projected whole-character attack, defense, maximum health and mana when the SAME item is worn in the SAME slot with old or new affixes. Compare relative changes, not raw magnitude across different stats. Flat legacy and additive percentage affixes are already included. Do not apply another multiplier.': 'Only affixes change. Base item, enhancement and set are unchanged. Flat stats apply when worn, before other character modifiers.',
      maximumAffixByStat: state.version===3?null:state.version===2?STATS_V2:STATS, note: 'No skill loadout or enemies are supplied. Avoid assuming them.' } },
    questions: { forge: { type: 'choice', instructions: 'Advise whether to keep old affixes (before) or adopt new affixes (after), respecting the selected preference. All-zero difference: keep. Strict improvement without loss: replace; strict loss without gain: keep. For mixed stats, consider relative stat scales and preference; use consider if the tradeoff cannot be decided with the supplied information. Never interpret HP as lifespan. This is advice, not an instruction to execute.',
      criteria: { keep: 'Old affixes better fit the preference or values are identical.', replace: 'New affixes better fit the preference.', consider: 'Tradeoff is close or information is insufficient to favor either.' } } } };
}
function parseAnswer(body, choices=CHOICES, question='forge') {
  const a = body?.answers?.[question];
  if (a?.type !== 'choice' || !choices.includes(a.choice) || typeof a.confidence !== 'number' || !Number.isFinite(a.confidence) || a.confidence < 0 || a.confidence > 1) throw Error('answer');
  const p = a.probabilities;
  if (!p || Object.keys(p).length !== choices.length || choices.some(k => typeof p[k] !== 'number' || !Number.isFinite(p[k]) || p[k] < 0 || p[k] > 1) || Math.abs(choices.reduce((s, k) => s + p[k], 0) - 1) > .01 || choices.some(k => p[k] > p[a.choice] + .00001)) throw Error('answer');
  return { source: 'jev', ...(question!=='forge'?{task:question}:{}), choice: a.choice, confidence: a.confidence };
}
function evaluate(body, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    let settled = false, timer, req;
    const done = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(value); };
    req = https.request('https://api.typesafe.ai/v1/systemone', { method: 'POST', headers: {
      Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload)
    } }, res => {
      let size = 0; const chunks = [];
      res.on('data', chunk => { size += chunk.length; if (size > 16384) { done(Error('response_size')); res.destroy(); req.destroy(); } else chunks.push(chunk); });
      res.on('error', error => done(error));
      res.on('aborted', () => done(Error('response_aborted')));
      res.on('end', () => {
        if (res.statusCode !== 200) return done(Error('provider_unavailable'));
        try { done(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (_) { done(Error('response_json')); }
      });
    });
    timer = setTimeout(() => { done(Error('timeout')); req.destroy(); }, 8000);
    req.on('error', error => done(error)); req.end(payload);
  });
}
function safeEqual(a, b) {
  const hash = text => crypto.createHash('sha256').update(String(text)).digest();
  return crypto.timingSafeEqual(hash(a), hash(b));
}
function createHandler({ env = process.env, call = evaluate, now = Date.now, limiter = createLimiter(env, now), log = line => console.warn(line) } = {}) {
  const cache = new Map();
  // Bounded diagnostics: never include the request, IP, token, provider error or model output.
  const logged = new Map();
  const logCodes = new Set(['origin','method','not_configured','session_config','content_type','body_size','invalid_state','public_disabled','rate_limit_unavailable','rate_limit','access','jev_unavailable']);
  function refused(status, code) {
    if(env.JEV_LOG==='off'||status<400||!logCodes.has(code))return;
    const time=now(),last=logged.get(code);
    if(last!==undefined&&time>=last&&time-last<60000)return;
    logged.set(code,time);
    try{log(JSON.stringify({evt:'xiantu_jev',status,error:code}));}catch(_){}
  }
  return async function main(event = {}) {
    const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
    const allowed = (env.JEV_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
    const origin = headers.origin || '', cors = allowed.includes(origin) ? origin : '';
    const response = (status, data) => {refused(status,data?.error);return { statusCode: status, isBase64Encoded: false, headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin',
      'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY', 'Strict-Transport-Security':'max-age=31536000',
      ...(cors ? { 'Access-Control-Allow-Origin': cors, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Xiantu-Access, X-Xiantu-Session', 'Access-Control-Max-Age': '600' } : {})
    }, body: data ? JSON.stringify(data) : '' };};
    if (!cors) return response(403, { error: 'origin' });
    if (event.httpMethod === 'OPTIONS') return response(204);
    if (event.httpMethod !== 'POST') return response(405, { error: 'method' });
    if (!env.JEV_API_KEY || !/^[A-Za-z0-9_-]{16,128}$/.test(env.JEV_ACCESS_TOKEN || '')) return response(503, { error: 'not_configured' });
    const ownerAccess = safeEqual(headers['x-xiantu-access'] || '', env.JEV_ACCESS_TOKEN);
    if (!(headers['content-type'] || '').toLowerCase().startsWith('application/json')) return response(415, { error: 'content_type' });
    if (typeof event.body !== 'string' || Buffer.byteLength(event.body) > 8192) return response(413, { error: 'body_size' });
    let state, input;
    try {
      const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
      if (Buffer.byteLength(raw) > 4096) return response(413, { error: 'body_size' });
      input = JSON.parse(raw);
    } catch (_) { return response(400, { error: 'invalid_state' }); }
    if(input?.task==='session'){
      if(input.version!==1||Object.keys(input).some(k=>!['task','version'].includes(k)))return response(400,{error:'invalid_state'});
      if(!publicSession.enabled(env))return response(403,{error:'public_disabled'});
      if(!publicSession.configured(env))return response(503,{error:'session_config'});
      // Trust only the gateway event field, never client-supplied forwarding headers.
      const client=String(event.requestContext?.sourceIp || 'unknown');
      let release;
      try{release=await limiter.acquire('session',client);}catch(_){return response(503,{error:'rate_limit_unavailable'});}
      if(!release)return response(429,{error:'rate_limit'});
      try{return response(200,publicSession.issue(origin,env,now()));}
      finally{await release().catch(()=>{});}
    }
    if(!ownerAccess&&!publicSession.configured(env))return response(503,{error:'session_config'});
    if(!ownerAccess&&!publicSession.verify(headers['x-xiantu-session'],origin,env,now()))return response(401,{error:'access'});
    try{state=validState(input);}catch(_){return response(400,{error:'invalid_state'});}
    const time = now(), key = JSON.stringify(state), cached = cache.get(key);
    if (cached && time - cached.time < 60000) return response(200, {...cached.value, cached:true, usage:{input_tokens:0,output_tokens:0}});
    const identity=ownerAccess?'owner':headers['x-xiantu-session'];
    let release;
    try{release=await limiter.acquire('paid',identity);}catch(_){return response(503,{error:'rate_limit_unavailable'});}
    if(!release)return response(429,{error:'rate_limit'});
    try {
      const raw = await call(providerBody(state), env.JEV_API_KEY);
      const question=state.task||'forge';
      const choices=question==='monster'?state.available:question==='forge'?CHOICES:state.options.map(o=>o.id);
      const value=parseAnswer(raw,choices,question);
      if(raw?.usage && ['input_tokens','output_tokens'].every(k=>Number.isSafeInteger(raw.usage[k])&&raw.usage[k]>=0&&raw.usage[k]<=1000000)) {
        value.usage={input_tokens:raw.usage.input_tokens,output_tokens:raw.usage.output_tokens};
      }
      value.cached=false;
      cache.set(key, { value, time: now() });
      if (cache.size > 20) cache.delete(cache.keys().next().value);
      return response(200, value);
    } catch (_) { return response(502, { error: 'jev_unavailable' }); }
    finally { await release().catch(()=>{}); }
  };
}
exports.main = createHandler();
exports.createHandler = createHandler;
exports.validState = validState;
exports.parseAnswer = parseAnswer;
