/* Explicit, fixed-input connectivity check. No game state or persistent credentials. */
(function () {
  'use strict';
  const form = document.getElementById('jevCheckForm');
  const input = document.getElementById('access');
  const button = document.getElementById('testButton');
  const result = document.getElementById('result');
  const endpoint = typeof forgeJevEndpointV2842 === 'function' ? forgeJevEndpointV2842() : '';
  const status = (message, state = '') => { result.textContent = message; result.dataset.state = state; };
  document.getElementById('pageOrigin').textContent = window.location.origin;
  document.getElementById('apiEndpoint').textContent = endpoint || '未配置';
  const hosted = window.location.protocol === 'https:' || window.location.protocol === 'http:';
  button.textContent = '测试 Jev 连接';
  if (!endpoint || !hosted) {
    status(!hosted ? '请上传后从腾讯云网址打开本页，再测试连接。' : '接口配置未加载，请完整覆盖 V28.68 文件夹后刷新。', 'error');
    return;
  }
  const friends=typeof bootJevFriendsV2850==='function';
  if(friends){
    bootJevFriendsV2850();
    input.hidden=true;document.getElementById('accessHint').hidden=true;
    const label=document.querySelector('label[for="access"]');if(label)label.hidden=true;
    document.getElementById('clearDeviceV2845').hidden=true;
  }
  let revision=0, activeController=null;
  button.disabled = false;
  document.getElementById('jevDeviceControlsV2845').innerHTML=friends?jevFriendsControlsV2850():jevRememberHtmlV2845('check');
  document.getElementById('clearDeviceV2845').onclick=()=>{revision++;activeController?.abort();clearJevDeviceV2845();status('已清除本页访问口令。需要使用时请重新输入。');};
  syncJevRememberUiV2845();
  status(friends?'试玩无需口令，点击下方测试即可。':FORGE_ADVICE_V2842.access?'已自动恢复访问口令，直接点击测试即可。':'准备就绪。填写游戏访问口令后点击测试。');
  let busy = false, nextAt = 0;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy) return;
    if (Date.now() < nextAt) { status('请稍候几秒再测试，避免重复请求。'); return; }
    const requestRevision=revision;
    const selectedTask=document.getElementById('checkTask')?.value;
    const task=['monster','sect','mapnpc'].includes(selectedTask)?selectedTask:'forge';
    let token = input.value.trim() || FORGE_ADVICE_V2842.access;
    input.value = '';
    if (!validJevAccessV2845(token)) {
      status('游戏访问口令需为 16—128 位字母、数字、下划线或短横线。请填写 JEV_ACCESS_TOKEN 对应的值。', 'error');
      return;
    }
    busy = true; button.disabled = true; input.disabled = true; nextAt = Date.now() + 10000;
    status('正在请求腾讯云和 Jev，最多等待 10 秒…');
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    activeController=controller;
    let timer;
    try {
      const data = await Promise.race([
        (async () => {
          const response = await (typeof jevFetchV2850==='function'?jevFetchV2850:fetch)(endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Xiantu-Access': token },
            body: JSON.stringify(task === 'mapnpc' ? {task:'mapnpc',version:1,context:[0,0,0,100,0],options:[{id:'o0',a:0,b:0,c:0,d:0,e:0},{id:'o1',a:2,b:0,c:0,d:0,e:0}]} : task === 'sect' ? {task:'sect',version:1,context:[500,0,20,0,0,0,0],options:[{id:'o0',a:0,b:0,c:0,d:0,e:0},{id:'o1',a:2,b:0,c:0,d:0,e:0}]} : task === 'monster' ? {task:'monster',version:1,round:1,phase:1,enemyHp:60,enemyMp:100,playerHp:70,playerMp:60,playerGuard:false,enemyWeakened:false,spellPower:0,available:['attack','heavy','guard']} : { version: 1, grade: 1, goal: 'survival',
              before: { atk: 4, def: 0, hp: 10, mp: 0 }, after: { atk: 0, def: 4, hp: 30, mp: 0 } }),
            credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller?.signal
          });
          if (!response.ok) throw Error(String(response.status));
          try { return await response.json(); } catch (_) { throw Error('format'); }
        })(),
        new Promise((_, reject) => { timer = setTimeout(() => { controller?.abort(); reject(Error('timeout')); }, 10000); })
      ]);
      if(requestRevision!==revision)return;
      let message;
      try {
        if(task==='mapnpc'){
          if(data?.source!=='jev'||data.task!=='mapnpc'||!['o0','o1'].includes(data.choice)||typeof data.confidence!=='number'||!Number.isFinite(data.confidence)||data.confidence<0||data.confidence>1)throw Error('format');
          message='NPC接口可用；示例选择：'+(data.choice==='o0'?'提供线索':'谨慎交谈')+'。本次检测不改变游戏资源。';
        }else if(task==='sect'){
          if(data?.source!=='jev'||data.task!=='sect'||!['o0','o1'].includes(data.choice)||typeof data.confidence!=='number'||!Number.isFinite(data.confidence)||data.confidence<0||data.confidence>1)throw Error('format');
          message='宗门经营接口可用；宗门优先事项示例：'+(data.choice==='o0'?'宗门委托':'藏经阁')+'。本次检测不改变游戏资源。';
        }else if(task==='monster'){
          if(data?.source!=='jev'||data.task!=='monster'||!['attack','heavy','guard'].includes(data.choice)||typeof data.confidence!=='number'||!Number.isFinite(data.confidence)||data.confidence<0||data.confidence>1)throw Error('format');
          message='怪兽选择：'+({attack:'普通攻击',heavy:'蓄力重击',guard:'凝气护体'})[data.choice]+'（模型置信度 '+Math.round(data.confidence*100)+'%）。这只是示例检测，不影响游戏战斗。';
        }else message = forgeJevMessageV2842(data);
      } catch (_) { throw Error('format'); }
      FORGE_ADVICE_V2842.access=token;saveJevDeviceV2845();
      status('连接成功：腾讯云已返回 Jev 判断。\n示例结果：' + message + '\n现在可以进入游戏开启对应的 Jev 功能。', 'success');
    } catch (error) {
      if(requestRevision!==revision)return;
      const messages = {
        '400': 'HTTP 400：请求类型不受支持。请先将云函数更新为 V28.50，再测试新玩法。',
        '401': 'HTTP 401：访问口令不正确，或网关要求额外鉴权。先核对 JEV_ACCESS_TOKEN。',
        '403': 'HTTP 403：请求被拒绝。核对 HTTP 安全域名、网关鉴权，以及 JEV_ALLOWED_ORIGINS。',
        '404': 'HTTP 404：接口不存在。检查 /api/jev-forge 是否关联 xiantu-jev-forge。',
        '429': 'HTTP 429：请求过多，请稍后再试。',
        '502': 'HTTP 502：云端暂未取得 Jev 的有效响应。检查云函数日志、API 密钥、额度和出网连接。',
        '503': 'HTTP 503：云函数尚未配置完成，或服务暂不可用。核对环境变量。',
        format: '返回内容不是预期的 Jev 结果。检查路由是否指向正确云函数，以及代码是否已保存。',
        timeout: '等待超过 10 秒。可检查云函数日志，稍后手动重试。'
      };
      status(messages[error.message] || '无法读取接口响应，可能是网络、跨域或网关拦截。请检查安全域名和 JEV_ALLOWED_ORIGINS，并从腾讯云网址打开本页。', 'error');
    } finally {
      activeController=null;clearTimeout(timer); token = ''; busy = false; button.disabled = false; input.disabled = false;
    }
  });
})();
