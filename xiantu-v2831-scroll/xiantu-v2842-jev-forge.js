/* Optional Jev advice. Public endpoint only; provider keys belong in the cloud function. */
const JEV_FORGE_CONFIG_V2842 = Object.freeze({ endpoint: 'https://xiantu-game-d9gy5heze4b039bf1-1255918878.ap-shanghai.app.tcloudbase.com/api/jev-forge' });
const JEV_DEVICE_V2845 = readJevDeviceV2845();
const FORGE_ADVICE_V2842 = {
  goal: 'balanced', access: JEV_DEVICE_V2845.access, busy: null, cache: new Map(), nextAt: 0
};
const FORGE_GOALS_V2842 = {
  balanced: { label: '均衡', weights: [1, 1, 1, 1] },
  attack: { label: '输出', weights: [4, 1, 1, 1] },
  survival: { label: '生存', weights: [1, 2, 3, 1] },
  mana: { label: '续航', weights: [1, 1, 1, 4] }
};
const FORGE_LABELS_V2842 = { atk: '攻击', def: '防御', hp: '气血上限', mp: '灵力上限' };
// Compare complete projected panels in the same slot, restoring all temporary state.
function forgeProjectedPanelV286825(ref,record,affixes){
 const definition=Object.getOwnPropertyDescriptor(EQUIPMENT_DB,ref.name),equipment=player.equipment,sets=player.activeSetBonuses,hadSets=Object.hasOwn(player,'activeSetBonuses');
 const allowed=getAllowedSlotsForEquip(getEquipData(ref.name)),slot=ref.kind==='slot'?ref.index:allowed.find(s=>!equipment[s])||allowed[0];
 if(!slot)return {atk:0,def:0,hp:0,mp:0};
 try{
  forgeRegisterV2825(ref.name,{...record,affixes});player.equipment={...equipment,[slot]:ref.name};
  return {atk:getAtk(),def:getDef(),hp:getMaxHp(),mp:getMaxMp()};
 }finally{
  if(definition)Object.defineProperty(EQUIPMENT_DB,ref.name,definition);else delete EQUIPMENT_DB[ref.name];
  player.equipment=equipment;if(hadSets)player.activeSetBonuses=sets;else delete player.activeSetBonuses;
 }
}
function forgeAdviceStateV2842(ref, record) {
 return {version:3,grade:forgeGradeV2825(getEquipData(ref.name)),goal:FORGE_ADVICE_V2842.goal,
  before:forgeProjectedPanelV286825(ref,record,record.affixes),after:forgeProjectedPanelV286825(ref,record,record.pending)};
}
function forgeLocalAdviceV2842(state) {
  const keys = Object.keys(FORGE_LABELS_V2842), diff = keys.map(k => state.after[k] - state.before[k]);
  if (diff.every(v => v === 0)) return '新旧数值相同，建议保留。';
  if (diff.every(v => v >= 0)) return '新词条有提升且没有属性损失，建议替换。';
  if (diff.every(v => v <= 0)) return '新词条有降低且没有属性提升，建议保留。';
  const weights = FORGE_GOALS_V2842[state.goal].weights;
  const score = diff.reduce((sum, v, i) => sum + v / (state.version===3?Math.max(1,state.before[keys[i]]):(FORGE_STATS_V2825[keys[i]].max * state.grade)) * weights[i], 0);
  const preference = FORGE_GOALS_V2842[state.goal].label;
  if (Math.abs(score) < (state.version===3?.01:.15)) return `按${preference}偏好，两组词条接近，建议结合技能需求手动选择。`;
  return `按${preference}偏好，${score > 0 ? '新' : '旧'}词条更合适，倾向${score > 0 ? '替换' : '保留'}。不同属性有取舍，请看上方增减。`;
}
function forgeJevEndpointV2842() {
  const raw = JEV_FORGE_CONFIG_V2842.endpoint;
  if (!raw) return '';
  try {
    const u = new URL(raw, window.location.href);
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash ? u.href : '';
  } catch (_) { return ''; }
}
function forgeAdvicePanelV2842(ref, record) {
  const state = forgeAdviceStateV2842(ref, record), esc = discipleEscV2815;
  const rows = Object.entries(FORGE_LABELS_V2842).map(([k, label]) => {
    const d = state.after[k] - state.before[k];
    return `<tr><th scope="row">${label}</th><td>${state.before[k]}</td><td>${state.after[k]}</td><td class="${d > 0 ? 'forge-gain' : d < 0 ? 'forge-loss' : ''}">${d > 0 ? '↑ +' : d < 0 ? '↓ ' : '—'}${d ? d : ''}</td></tr>`;
  }).join('');
  const endpoint = forgeJevEndpointV2842();
  const connection = typeof jevFriendsModeV2850==='function'&&jevFriendsModeV2850()
    ? jevFriendsControlsV2850()+`<p>仅发送新旧词条试穿后的四项面板、档级和偏好。</p><button id="forgeJevButtonV2842" class="choice-btn" onclick="requestForgeJevV2842(${ref.nonce})" ${FORGE_ADVICE_V2842.access?'':'disabled'}>请天机参详</button>`
    : endpoint
    ? `<details class="forge-connection"><summary>Jev 访问设置 · ${FORGE_ADVICE_V2842.access ? '已解锁' : '待解锁'}</summary><p>输入一次游戏访问口令，勾选记住本设备后，下次同一浏览器自动恢复。API 密钥仍只放云函数。</p><label for="forgeAccessV2842">游戏访问口令（不是 Jev API 密钥）</label><input id="forgeAccessV2842" type="password" maxlength="128" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="已保存时无需再填">${jevRememberHtmlV2845('forge')}<button class="choice-btn" onclick="unlockForgeJevV2842(${ref.nonce})">解锁本次判断</button><button class="choice-btn" onclick="lockForgeJevV2842(${ref.nonce})">清除此设备口令</button></details><p>点击后仅发送新旧词条试穿后的四项面板、档级和偏好，由 Jev 判断；不发送角色名或存档。</p><button id="forgeJevButtonV2842" class="choice-btn" onclick="requestForgeJevV2842(${ref.nonce})" ${FORGE_ADVICE_V2842.access ? '' : 'disabled'}>请天机参详</button>`
    : '<p class="forge-muted">Jev 云端尚未配置，本地判读已可用。</p>';
  return `<section id="forgeAdviceV2842" class="forge-advice-v2842"><h4>词条判读</h4><p>对比本件装备采用新旧词条时的角色面板，基础属性与强化不变。背包装备按首个空槽或首个可用槽试穿计算。</p><table><caption>试穿后角色面板对比</caption><thead><tr><th>属性</th><th>原有</th><th>新词条</th><th>增减</th></tr></thead><tbody>${rows}</tbody></table><p>长生加气血上限，不增加寿元或立即回血；灵泉加灵力上限，不立即回灵。穿戴后生效，角色最终数值还受套装与状态影响。</p><div class="forge-goals" role="group" aria-label="判读偏好">${Object.entries(FORGE_GOALS_V2842).map(([key, goal]) => `<button class="choice-btn" aria-pressed="${state.goal === key}" onclick="setForgeGoalV2842(${ref.nonce},'${key}')">${goal.label}</button>`).join('')}</div><p class="forge-local"><b>本地参考：</b>${esc(forgeLocalAdviceV2842(state))}</p><p class="forge-muted">偏好按各属性相对原面板的变化加权，不是实战胜率或伤害预测。</p>${connection}<p id="forgeJevResultV2842" role="status" aria-live="polite"></p><p class="forge-muted">判断不扣游戏灵石，不自动替换。请用下方按钮确认选择。</p></section>`;
}
function cancelForgeJevV2842() {
  const request = FORGE_ADVICE_V2842.busy;
  if (request) { FORGE_ADVICE_V2842.busy = null; request.controller?.abort(); }
}
function setForgeGoalV2842(nonce, goal) {
  if (!forgeCurrentV2825(nonce) || !Object.prototype.hasOwnProperty.call(FORGE_GOALS_V2842, goal)) return;
  cancelForgeJevV2842(); FORGE_ADVICE_V2842.goal = goal; renderForgeV2825();
}
function unlockForgeJevV2842(nonce) {
  if (!forgeCurrentV2825(nonce)) return;
  const input = document.getElementById('forgeAccessV2842'), token = input?.value.trim() || FORGE_ADVICE_V2842.access;
  if (input) input.value = '';
  if (!validJevAccessV2845(token)) {
    const result = document.getElementById('forgeJevResultV2842');
    if (result) result.textContent = '访问口令需为 16—128 位字母、数字、下划线或短横线。请使用云端设置的游戏口令。';
    return;
  }
  cancelForgeJevV2842(); FORGE_ADVICE_V2842.access = token; FORGE_ADVICE_V2842.cache.clear(); saveJevDeviceV2845(); renderForgeV2825();
}
function lockForgeJevV2842(nonce) {
  if (!forgeCurrentV2825(nonce)) return;
  clearJevDeviceV2845(); renderForgeV2825();
}
function forgeJevMessageV2842(data) {
  if (!data || data.source !== 'jev' || !['keep', 'replace', 'consider'].includes(data.choice) ||
      typeof data.confidence !== 'number' || !Number.isFinite(data.confidence) || data.confidence < 0 || data.confidence > 1) throw Error('invalid');
  const confidence = Math.round(data.confidence * 100);
  if (data.confidence < .7 || data.choice === 'consider') return `Jev 暂无明确建议（模型置信度 ${confidence}%），请参考上方数值自行选择。置信度不是胜率。`;
  return `Jev 建议${data.choice === 'replace' ? '采用新词条' : '保留旧词条'}（模型置信度 ${confidence}%）。仅供参考，不代表胜率，尚未替你操作。`;
}
async function requestForgeJevV2842(nonce) {
  const ref = forgeCurrentV2825(nonce), panel = document.getElementById('forgeAdviceV2842');
  const record = ref && player.forgeV2825?.items?.[ref.name], endpoint = forgeJevEndpointV2842();
  if (!record?.pending || !panel || !endpoint || !FORGE_ADVICE_V2842.access) return;
  const state = forgeAdviceStateV2842(ref, record), signature = JSON.stringify(state), key = endpoint + signature;
  const owner = player, pending = JSON.stringify(record.pending), before = JSON.stringify(record.affixes);
  const result = document.getElementById('forgeJevResultV2842'), button = document.getElementById('forgeJevButtonV2842');
  const fresh = () => player === owner && forgeCurrentV2825(nonce) === ref &&
    document.getElementById('forgeAdviceV2842') === panel && document.getElementById('storyPanel')?.classList.contains('hidden') === false &&
    owner.forgeV2825?.items?.[ref.name] === record && JSON.stringify(record.pending) === pending &&
    JSON.stringify(record.affixes) === before && JSON.stringify(forgeAdviceStateV2842(ref, record)) === signature;
  const cached = FORGE_ADVICE_V2842.cache.get(key);
  if (cached) { result.textContent = forgeJevMessageV2842(cached); return; }
  if (FORGE_ADVICE_V2842.busy) { result.textContent = '已有判断正在进行，请稍候。'; return; }
  if (Date.now() < FORGE_ADVICE_V2842.nextAt) { result.textContent = '请稍候几秒再判断，本地对比仍可使用。'; return; }
  if(typeof jevReserveV2846==='function')jevReserveV2846();
  const request = { controller: typeof AbortController === 'function' ? new AbortController() : null };
  FORGE_ADVICE_V2842.busy = request; FORGE_ADVICE_V2842.nextAt = Date.now() + 10000;
  button.disabled = true; result.textContent = 'Jev 正在比较词条，你仍可直接保留或替换。';
  let timer;
  try {
    const data = await Promise.race([
      (async () => {
        const response = await (typeof jevFetchV2850==='function'?jevFetchV2850:fetch)(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Xiantu-Access': FORGE_ADVICE_V2842.access },
          body: signature, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: request.controller?.signal });
        if (!response.ok) throw Error(String(response.status));
        const value=await response.json();if(typeof jevUsageV2846==='function')jevUsageV2846(value);return value;
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { request.controller?.abort(); reject(Error('timeout')); }, 10000); })
    ]);
    const message = forgeJevMessageV2842(data);
    if (FORGE_ADVICE_V2842.busy !== request || !fresh()) return;
    FORGE_ADVICE_V2842.cache.set(key, data);
    if (FORGE_ADVICE_V2842.cache.size > 12) FORGE_ADVICE_V2842.cache.delete(FORGE_ADVICE_V2842.cache.keys().next().value);
    result.textContent = message;
  } catch (error) {
    if (FORGE_ADVICE_V2842.busy === request && fresh()) {
      const text = { '400': '云端未接受新版词条，请确认已更新本次 Jev 云函数包。', '401': '访问口令不正确，请重新解锁。', '403': '云端尚未允许当前游戏域名。', '429': '判断请求过多，请稍后再试。', '503': '云端 Jev 尚未配置完成。', timeout: 'Jev 响应超时。' }[error.message] || 'Jev 暂时无法判断。';
      result.textContent = text + ' 本地对比仍可用，新旧词条均未被改动。';
    }
  } finally {
    clearTimeout(timer);
    if (FORGE_ADVICE_V2842.busy === request) FORGE_ADVICE_V2842.busy = null;
    if (fresh()) button.disabled = !FORGE_ADVICE_V2842.access;
  }
}
window.__xiantuBuildFilesV2814 = window.__xiantuBuildFilesV2814 || {};
window.__xiantuBuildFilesV2814['xiantu-v2842-jev-forge.js'] = '28.68.73';

// Device memory contains only the user-selected game access code, never a provider API key.
function validJevAccessV2845(value) {
  return typeof value==='string' && /^[A-Za-z0-9_-]{16,128}$/.test(value) && !/^apikey_/i.test(value);
}
function readJevDeviceV2845() {
  const empty={remember:true,access:'',monster:false,saved:false,error:''};
  try {
    const raw=localStorage.getItem('xiantu_jev_device_v1');
    if(!raw||raw.length>1024)return empty;
    const data=JSON.parse(raw);
    if(data?.v!==1)return empty;
    if(data.remember===false)return {...empty,remember:false};
    if(data.remember!==true||data.endpoint!==JEV_FORGE_CONFIG_V2842.endpoint||!validJevAccessV2845(data.access)||typeof data.monster!=='boolean')return empty;
    return {...empty,access:data.access,monster:data.monster,saved:true};
  }catch(_){return empty;}
}
function jevDeviceStatusV2845() {
  if(JEV_DEVICE_V2845.error)return JEV_DEVICE_V2845.error;
  if(JEV_DEVICE_V2845.saved)return '已记住此设备，下次自动恢复口令与怪兽开关。';
  return JEV_DEVICE_V2845.remember?'首次解锁或连接测试成功后记住。仅在本设备的同一浏览器生效。':'仅本次使用，关闭页面后需重新输入。';
}
function jevRememberHtmlV2845(scope) {
  return `<label class="jev-remember-v2845"><input type="checkbox" id="${scope}RememberV2845" data-jev-remember ${JEV_DEVICE_V2845.remember?'checked':''} onchange="setJevRememberV2845(this.checked)">记住本设备，自动恢复设置</label><p class="jev-device-status-v2845" data-jev-device-status role="status">${jevDeviceStatusV2845()}</p>`;
}
function syncJevRememberUiV2845() {
  for(const input of document.querySelectorAll('[data-jev-remember]'))input.checked=JEV_DEVICE_V2845.remember;
  for(const text of document.querySelectorAll('[data-jev-device-status]'))text.textContent=jevDeviceStatusV2845();
}
function saveJevDeviceV2845() {
  if(typeof jevFriendsModeV2850==='function'&&jevFriendsModeV2850()){
    if(typeof MONSTER_JEV_V2844!=='undefined')saveJevFriendPreferenceV2850('xiantu_jev_monster_v2850',MONSTER_JEV_V2844.enabled);
    return;
  }
  JEV_DEVICE_V2845.error='';JEV_DEVICE_V2845.saved=false;
  const access=FORGE_ADVICE_V2842.access;
  const monster=typeof MONSTER_JEV_V2844!=='undefined'?MONSTER_JEV_V2844.enabled:JEV_DEVICE_V2845.monster;
  try {
    if(!JEV_DEVICE_V2845.remember||!validJevAccessV2845(access)) {
      // Remove the old credential before writing the non-secret preference.
      localStorage.removeItem('xiantu_jev_device_v1');
      localStorage.setItem('xiantu_jev_device_v1',JSON.stringify({v:1,remember:JEV_DEVICE_V2845.remember}));
      JEV_DEVICE_V2845.access='';JEV_DEVICE_V2845.monster=false;
    }else{
      localStorage.setItem('xiantu_jev_device_v1',JSON.stringify({v:1,remember:true,endpoint:JEV_FORGE_CONFIG_V2842.endpoint,access,monster:!!monster}));
      JEV_DEVICE_V2845.access=access;JEV_DEVICE_V2845.monster=!!monster;JEV_DEVICE_V2845.saved=true;
    }
  }catch(_){JEV_DEVICE_V2845.error='浏览器未能保存或更新设备记忆，本次仍可使用；下次可能需要重新输入。';}
  syncJevRememberUiV2845();
}
function setJevRememberV2845(remember) {
  JEV_DEVICE_V2845.remember=!!remember;saveJevDeviceV2845();
}
function clearJevDeviceV2845() {
  if(typeof jevFriendsModeV2850==='function'&&jevFriendsModeV2850())stopJevFriendsV2850();
  if(typeof NPC_JEV_V2849!=='undefined')setCompanionCloudV2849(false);
  if(typeof JEV_WORLD_V2846!=='undefined'){closeJevWorldV2846();JEV_WORLD_V2846.cache.clear();setHeroJevV2846(false);}
  if(typeof MONSTER_JEV_V2844!=='undefined') {MONSTER_JEV_V2844.enabled=false;cancelMonsterJevV2844('disabled');}
  cancelForgeJevV2842();FORGE_ADVICE_V2842.access='';FORGE_ADVICE_V2842.cache.clear();
  Object.assign(JEV_DEVICE_V2845,{remember:false,access:'',monster:false,saved:false,error:''});
  try{localStorage.removeItem('xiantu_jev_device_v1');}catch(_){JEV_DEVICE_V2845.error='本页口令已清除，但浏览器拒绝删除设备记忆。';}
  for(const id of ['forgeAccessV2842','monsterAccessV2844','access']) {const input=document.getElementById(id);if(input)input.value='';}
  syncJevRememberUiV2845();
}
