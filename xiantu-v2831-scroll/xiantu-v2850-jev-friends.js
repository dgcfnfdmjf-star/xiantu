/* Public play uses a short-lived ticket. No owner access code or API key is shipped. */
const JEV_PUBLIC_MARKER_V2850='xiantu-public-play-v2850'; // UI marker, never accepted by the server.
const JEV_FRIENDS_V2850={mode:false,paused:false,token:'',expiresAt:0,pending:null,revision:0,retryAt:0,status:'正在连接试玩 Jev…'};
function jevFriendsModeV2850(){return JEV_FRIENDS_V2850.mode;}
function jevFriendsStatusV2850(text){
  JEV_FRIENDS_V2850.status=text;
  for(const el of document.querySelectorAll('[data-jev-friends-status]'))el.textContent=text;
}
function jevFriendsControlsV2850(){
  return `<div class="jev-friends-controls-v2850"><p data-jev-friends-status role="status">${JEV_FRIENDS_V2850.status}</p><p>试玩无需输入口令。连接失败时会继续使用本地策略。</p><button type="button" class="choice-btn" onclick="retryJevFriendsV2850()">开启 / 重连 Jev</button><button type="button" class="choice-btn" onclick="clearJevDeviceV2845()">停止本设备 Jev</button></div>`;
}
function jevFriendPreferenceV2850(key,fallback){try{const v=localStorage.getItem(key);return v==='1'?true:v==='0'?false:fallback;}catch(_){return fallback;}}
function saveJevFriendPreferenceV2850(key,on){try{localStorage.setItem(key,on?'1':'0');}catch(_){}}
function jevFriendsDefaultsV2850(force=false){
  const first=!jevFriendPreferenceV2850('xiantu_jev_defaults_v2850',false),on=force||first;
  if(typeof MONSTER_JEV_V2844!=='undefined')MONSTER_JEV_V2844.enabled=on||jevFriendPreferenceV2850('xiantu_jev_monster_v2850',true);
  if(typeof setHeroJevV2846==='function')setHeroJevV2846(on||jevFriendPreferenceV2850('xiantu_jev_hero_v2846',true));
  if(typeof setCompanionCloudV2849==='function')setCompanionCloudV2849(on||jevFriendPreferenceV2850('xiantu_jev_ally_v2849',true));
  if(typeof MONSTER_JEV_V2844!=='undefined'){
    saveJevFriendPreferenceV2850('xiantu_jev_monster_v2850',MONSTER_JEV_V2844.enabled);
    saveJevFriendPreferenceV2850('xiantu_jev_defaults_v2850',true);
  }
}
function stopJevFriendsV2850(){
  const s=JEV_FRIENDS_V2850;s.paused=true;s.revision++;s.token='';s.expiresAt=0;s.retryAt=0;
  s.pending?.controller?.abort();s.pending?.cancel();s.pending=null;
  saveJevFriendPreferenceV2850('xiantu_jev_paused_v2850',true);jevFriendsStatusV2850('本设备 Jev 已停止，继续使用本地策略。');
}
function bootJevFriendsV2850(){
  const s=JEV_FRIENDS_V2850,firstOpen=!s.mode;s.mode=true;
  if(firstOpen&&typeof renderMonsterAiV2844==='function'){document.getElementById('monsterAiV2844')?.remove();renderMonsterAiV2844();}
  s.paused=jevFriendPreferenceV2850('xiantu_jev_paused_v2850',false);
  if(s.paused){FORGE_ADVICE_V2842.access='';jevFriendsStatusV2850('本设备 Jev 已停止，继续使用本地策略。');return Promise.resolve(false);}
  FORGE_ADVICE_V2842.access=JEV_PUBLIC_MARKER_V2850;jevFriendsDefaultsV2850();
  // Prepare local controls only; the first decision request obtains its own session.
  if(!s.token)jevFriendsStatusV2850('Jev 已准备，首次使用时连接；暂不可用时使用本地策略。');
  return Promise.resolve(true);
}
function retryJevFriendsV2850(){
  const s=JEV_FRIENDS_V2850,wasPaused=s.paused;s.paused=false;s.retryAt=0;s.failuresV286838=0;
  saveJevFriendPreferenceV2850('xiantu_jev_paused_v2850',false);
  FORGE_ADVICE_V2842.access=JEV_PUBLIC_MARKER_V2850;
  if(wasPaused)jevFriendsDefaultsV2850(true);
  if(typeof monsterStateV2844==='function'){const enemy=monsterStateV2844();if(enemy)enemy.failed=false;}
  return ensureJevFriendSessionV2850().then(()=>true,()=>false);
}
function ensureJevFriendSessionV2850(){
  const s=JEV_FRIENDS_V2850;
  if(!s.mode||s.paused)return Promise.reject(Error('public_stopped'));
  if(s.token&&s.expiresAt>Date.now()+30000)return Promise.resolve(s.token);
  if(s.pending)return s.pending.promise;
  if(Date.now()<s.retryAt)return Promise.reject(Error('public_wait'));
  const endpoint=forgeJevEndpointV2842();if(!endpoint)return Promise.reject(Error('public_endpoint'));
  const rev=s.revision,controller=typeof AbortController==='function'?new AbortController():null;
  let timer,cancel;const pending={controller,promise:null,cancel:()=>cancel?.()};s.pending=pending;
  jevFriendsStatusV2850('正在连接试玩 Jev…');
  pending.promise=(async()=>{
    try{
      const data=await Promise.race([
        (async()=>{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'session',version:1}),credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:controller?.signal});if(!r.ok)throw Error('public_'+r.status);return r.json();})(),
        new Promise((_,reject)=>{cancel=()=>reject(Error('public_stopped'));timer=setTimeout(()=>{controller?.abort();reject(Error('public_timeout'));},4000);})
      ]);
      if(s.paused||s.revision!==rev)throw Error('public_stopped');
      if(data?.mode!=='public'||typeof data.token!=='string'||data.token.length>1024||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(data.token)||!Number.isSafeInteger(data.expiresAt)||data.expiresAt<=Date.now()||data.expiresAt>Date.now()+20*60*1000)throw Error('public_format');
      s.token=data.token;s.expiresAt=data.expiresAt;s.retryAt=0;s.failuresV286838=0;jevFriendsStatusV2850('Jev 试玩已连接 · 无需口令');return s.token;
    }catch(error){
      if(s.revision===rev&&!s.paused){s.token='';s.expiresAt=0;s.failuresV286838=(s.failuresV286838||0)+1;
        // An origin the gateway refuses stays refused; only a manual reconnect clears retryAt.
        s.retryAt=error.message==='public_403'?Infinity:Date.now()+Math.min(600000,15000*2**(s.failuresV286838-1));jevFriendsStatusV2850(error.message==='public_403'?'云端未开放试玩或域名未放行，请联系发布者；当前使用本地策略。':'试玩 Jev 暂未连接，当前使用本地策略，可稍后重连。');}
      throw error;
    }finally{clearTimeout(timer);if(s.pending===pending)s.pending=null;}
  })();return pending.promise;
}
async function jevFetchV2850(endpoint,options){
  if(options.headers?.['X-Xiantu-Access']!==JEV_PUBLIC_MARKER_V2850)return fetch(endpoint,options);
  // Tickets go only to the fixed game gateway, never to a caller-supplied host.
  if(endpoint!==forgeJevEndpointV2842())throw Error('public_endpoint');
  const s=JEV_FRIENDS_V2850,rev=s.revision;
  for(let attempt=0;attempt<2;attempt++){
    const token=await ensureJevFriendSessionV2850();
    if(s.paused||s.revision!==rev||options.signal?.aborted)throw Error('public_stopped');
    const headers={...options.headers};delete headers['X-Xiantu-Access'];headers['X-Xiantu-Session']=token;
    const response=await fetch(endpoint,{...options,headers});
    if(response.status!==401||attempt===1)return response;
    if(s.token===token){s.token='';s.expiresAt=0;}
  }
}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};
window.__xiantuBuildFilesV2814['xiantu-v2850-jev-friends.js']='28.68.90';
