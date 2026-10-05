'use strict';
const crypto=require('node:crypto');
const TTL=15*60*1000;
// Public play is opt-in. The browser receives only a short-lived game-scoped ticket.
function enabled(env){return env.JEV_PUBLIC_PLAY==='true';}
function signature(payload,env){return crypto.createHmac('sha256',env.JEV_API_KEY).update('xiantu-public-session-v1:'+payload).digest('base64url');}
function issue(origin,env,time){
  const expiresAt=time+TTL;
  const payload=Buffer.from(JSON.stringify({v:1,aud:'xiantu-game-decisions',origin,iat:time,exp:expiresAt,id:crypto.randomBytes(16).toString('hex')})).toString('base64url');
  return {mode:'public',token:payload+'.'+signature(payload,env),expiresAt};
}
function verify(token,origin,env,time){
  if(!enabled(env)||typeof token!=='string'||token.length>1024)return false;
  const parts=token.split('.');if(parts.length!==2||!parts.every(s=>/^[A-Za-z0-9_-]+$/.test(s)))return false;
  const [payload,mac]=parts,expected=signature(payload,env);
  if(mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return false;
  try{
    const s=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    return s.v===1&&s.aud==='xiantu-game-decisions'&&s.origin===origin&&Number.isSafeInteger(s.iat)&&Number.isSafeInteger(s.exp)&&s.iat<=time&&s.exp>time&&s.exp-s.iat===TTL&&typeof s.id==='string'&&/^[a-f0-9]{32}$/.test(s.id);
  }catch(_){return false;}
}
module.exports={enabled,issue,verify};
