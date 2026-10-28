'use strict';
const crypto=require('node:crypto');
const TTL=15*60*1000;
// Public play is opt-in. The browser receives only a short-lived game-scoped ticket.
function enabled(env){return env.JEV_PUBLIC_PLAY==='true';}
// An explicitly configured but invalid key must not silently fall back to the provider key.
function configured(env){return env.JEV_SESSION_SECRET===undefined||(typeof env.JEV_SESSION_SECRET==='string'&&env.JEV_SESSION_SECRET.trim().length>=32&&env.JEV_SESSION_SECRET.length<=4096);}
function signature(payload,env){
  if(!configured(env))throw Error('session_config');
  return crypto.createHmac('sha256',env.JEV_SESSION_SECRET===undefined?env.JEV_API_KEY:env.JEV_SESSION_SECRET).update('xiantu-public-session-v1:'+payload).digest('base64url');
}
function issue(origin,env,time){
  const expiresAt=time+TTL;
  const payload=Buffer.from(JSON.stringify({v:1,aud:'xiantu-game-decisions',origin,iat:time,exp:expiresAt,id:crypto.randomBytes(16).toString('hex')})).toString('base64url');
  return {mode:'public',token:payload+'.'+signature(payload,env),expiresAt};
}
function verify(token,origin,env,time){
  if(!enabled(env)||!configured(env)||typeof token!=='string'||token.length>1024)return false;
  const parts=token.split('.');if(parts.length!==2||!parts.every(s=>/^[A-Za-z0-9_-]+$/.test(s)))return false;
  const [payload,mac]=parts,expected=signature(payload,env);
  if(mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return false;
  try{
    const s=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return s.v===1&&s.aud==='xiantu-game-decisions'&&s.origin===origin&&Number.isSafeInteger(s.iat)&&Number.isSafeInteger(s.exp)&&s.iat<=time&&s.exp>time&&s.exp-s.iat===TTL&&typeof s.id==='string'&&/^[a-f0-9]{32}$/.test(s.id);
  }catch(_){return false;}
}
module.exports={enabled,configured,issue,verify};
