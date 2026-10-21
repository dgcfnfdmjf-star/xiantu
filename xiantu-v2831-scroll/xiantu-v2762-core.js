// 启动错误保留恢复提示；运行期错误提供可关闭提示，并保留控制台诊断。
    window.addEventListener('error', function(e){
      const ready=document.documentElement.classList.contains('xiantu-v2762-ready');
      console.error(ready?'运行异常：':'启动异常：', e.message||e);
      try {
        const id=ready?'mobileRuntimeError':'mobileBootError';
        if(document.getElementById(id))return;
        const box=document.createElement('div');box.id=id;
        box.setAttribute('role',ready?'status':'alert');
        box.style.cssText='position:fixed;z-index:999999;left:12px;right:12px;top:12px;padding:12px;border-radius:10px;background:#2a1116;color:#ffd7dc;font:13px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;white-space:pre-wrap';
        box.textContent=ready?'部分功能遇到异常；若操作无响应，请导出存档后刷新。':'仙途暂未能启程，请重新打开页面。';
        if(ready){
          const close=document.createElement('button');close.type='button';close.textContent='关闭提示';
          close.style.cssText='margin-left:12px;min-height:44px;padding:6px 12px';
          close.onclick=()=>box.remove();box.appendChild(close);
        }
        document.body.appendChild(box);
      } catch(_) {}
    });
    window.addEventListener('unhandledrejection', function(e){
      console.error('未处理异步异常：', e.reason);
    });


    // ================== 手机版储物袋 ==================
    let mobileInventoryTab = 'items';

    function closeMobileInventory() {
      document.getElementById('mobileInventoryOverlay')?.remove();
      updateWorldHUD?.();
    }

    function setMobileInventoryTab(tab) {
      mobileInventoryTab = tab || 'items';
      renderMobileInventory();
    }

    function groupInventoryItems() {
      const bucket = {};
      (player?.inventory || []).forEach(name => { bucket[name] = (bucket[name] || 0) + 1; });
      return Object.entries(bucket).map(([name,count]) => ({name,count,data:ITEMS?.[name] || null}));
    }

    function showMobileInventory() {
      if (!player) return;
      if (gameState === 'combat') {
        showFloatingText?.('⚔️ 战斗中请使用【战斗背包】','#ffd76a');
        return;
      }
      document.getElementById('mobileInventoryOverlay')?.remove();
      const overlay=document.createElement('div');
      overlay.id='mobileInventoryOverlay';
      overlay.className='mobile-inventory-overlay';
      overlay.addEventListener('pointerdown',e=>{if(e.target===overlay) closeMobileInventory();});
      overlay.innerHTML='<div class="mobile-inventory-card" id="mobileInventoryCard"></div>';
      document.body.appendChild(overlay);
      renderMobileInventory();
    }

    function renderMobileInventory() {
      const card=document.getElementById('mobileInventoryCard');
      if(!card || !player) return;
      const itemRows=groupInventoryItems();
      const materialRows=Object.entries(player.materials||{}).filter(([,count])=>Number(count)>0).map(([name,count])=>({name,count,data:MATERIALS?.[name]||null}));
      const equipmentRows=(player.equipmentInventory||[]).map(name=>({name,count:1,data:EQUIPMENT_DB?.[name]||ITEMS?.[name]||null}));
      const tabs=[['items','💊 丹药/物品'],['materials','🌿 材料'],['equipment','⚔️ 装备']];
      let rows=[], footer='';
      if(mobileInventoryTab==='materials'){
        rows=materialRows;
        footer='材料主要用于炼丹、任务、锻造与宗门委托。';
      }else if(mobileInventoryTab==='equipment'){
        rows=equipmentRows;
        footer='装备统一存放在装备背包；点击下方按钮可进入完整装备界面。';
      }else{
        rows=itemRows;
        footer='可使用的丹药/物品可直接点击；战斗中请使用战斗背包。';
      }
      const htmlRows=rows.length?rows.map(row=>{
        const d=row.data||{};
        const icon=d.icon || (d.type==='heal'?'💊':d.type==='mp'?'🔹':mobileInventoryTab==='materials'?'🌿':mobileInventoryTab==='equipment'?'⚔️':'🎐');
        const desc=d.desc || (mobileInventoryTab==='materials'?'修仙材料':mobileInventoryTab==='equipment'?'装备物品':'储物袋物品');
        if(mobileInventoryTab==='items'){
          return `<button class="mobile-inventory-item usable" onclick="useItem('${row.name.replace(/'/g,"\\'")}');renderMobileInventory();"><span class="name">${icon} ${row.name}</span><span class="count">×${row.count}</span><span class="desc">${desc}</span></button>`;
        }
        return `<div class="mobile-inventory-item"><span class="name">${icon} ${row.name}</span><span class="count">×${row.count}</span><span class="desc">${desc}</span></div>`;
      }).join(''):`<div class="mobile-inventory-empty">这一栏目前是空的</div>`;
      card.innerHTML=`
        <div class="mobile-inventory-head"><div><div class="mobile-inventory-title">🎒 储物袋</div><div style="font-size:10px;color:#8f99a4;margin-top:2px">随身物资与修行资源</div></div><button aria-label="关闭" class="mobile-inventory-close" onclick="closeMobileInventory()">✕</button></div>
        <div class="mobile-inventory-summary"><span>💰 灵石 ${player.gold||0}</span><span>💠 灵力 ${Math.max(0,Math.round(player.mp||0))} / ${typeof getMaxMp==='function'?getMaxMp():Math.max(0,Math.round(player.maxMp||0))}</span><span>🎐 物品 ${itemRows.reduce((a,b)=>a+b.count,0)}</span><span>🌿 材料 ${materialRows.reduce((a,b)=>a+Number(b.count||0),0)}</span><span>⚔️ 装备 ${equipmentRows.length}</span></div>
        <div class="mobile-inventory-tabs">${tabs.map(([id,label])=>`<button class="mobile-inventory-tab ${mobileInventoryTab===id?'active':''}" onclick="setMobileInventoryTab('${id}')">${label}</button>`).join('')}</div>
        <div class="mobile-inventory-grid">${htmlRows}</div>
        ${mobileInventoryTab==='equipment'?`<button class="choice-btn" style="margin-top:10px;width:100%" onclick="closeMobileInventory();showEquipmentPanel();">📦 打开完整装备栏</button>`:''}
        <div class="mobile-inventory-footer">${footer}</div>`;
    }

    // ================== 存档系统 ==================
    
    const SAVE_KEY = 'xiantu_save';
    const SAVE_VERSION = 12;
    let autoSaveTimer = null;
    
    const SAVE_BACKUP_KEY='xiantu_save_backup';
    let lastSaveFailureNoticeV2768=0;
    function escapeGameText(value) {
      return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    // Saves contain data, never markup or executable identifiers. Validate before writing.
    function validateSaveTextV2869(data) {
      const stack=[{value:data,key:'',depth:0}];let nodes=0;
      const identifier=/^(?:name|daoName|id|.*Id|.*ID|type|action|slot|sect|inventory|equipmentInventory|skills|equipment|materials|petMaterials|artifactMaterials)$/;
      while(stack.length){
        const {value,key,depth}=stack.pop();
        if(++nodes>300000||depth>60)throw Error('存档结构过于复杂');
        if(typeof value==='string'){
          if(value.length>20000||/[<>]|&(?:#|quot;|apos;)|(?:^|[\s;"'])on[a-z]+\s*=|javascript\s*:/i.test(value))throw Error('存档含不安全的文本，请使用原始游戏导出的存档');
          if(/^(?:id|.*Id|.*ID)$/.test(key)&&/[^\p{L}\p{N}_.:\-]/u.test(value))throw Error('存档标识格式无效');
          if(identifier.test(key)&&/["'`\\&\r\n]/.test(value))throw Error('存档名称或标识含不支持的字符');
        }else if(value&&typeof value==='object'){
          for(const [k,v] of Object.entries(value)){
            if(['__proto__','prototype','constructor'].includes(k)||/[<>"'`\\&]/.test(k))throw Error('存档字段无效');
            stack.push({value:v,key:Array.isArray(value)||identifier.test(key)?key:k,depth:depth+1});
          }
        }
      }
    }
    function parseSaveV2768(raw) {
      if(typeof raw!=='string'||raw.length>8*1024*1024)throw Error('存档大小无效');
      const data=JSON.parse(raw),p=data?.player;
      if(!p||typeof p!=='object'||Array.isArray(p)||!Number.isInteger(p.level)||p.level<0||p.level>=CULTIVATION_REALMS.length||!Array.isArray(p.inventory))throw Error('存档结构无效');
      if(!Number.isInteger(data.version)||data.version<1||data.version>SAVE_VERSION)throw Error('存档版本不支持');
      if(p.inventory.some(n=>typeof n!=='string')||p.inventory.length>100000)throw Error('背包数据无效');
      for(const k of ['gold','exp','hp','mp'])if(!Number.isFinite(p[k])||p[k]<0)throw Error('角色数值无效');
      validateSaveTextV2869(data);
      return data;
    }
    // Incomplete battles save the pre-battle snapshot, never a paid half-action.
    // This is a whole-battle rollback on reload, not animation/timer serialization.
    let battleCheckpointV286812 = null;
    function createSaveDataV2768() {
      if(gameState==='combat' && battleCheckpointV286812?.owner===player){
        return {...JSON.parse(battleCheckpointV286812.raw),timestamp:Date.now(),interruptedBattleV286812:true};
      }
      return {player:JSON.parse(JSON.stringify(player)),achievements:{progress:{...achievementProgress},completed:Array.from(completedAchievements)},timestamp:Date.now(),version:SAVE_VERSION};
    }
    function writeSaveV2768(raw) {
      parseSaveV2768(raw);
      const old=localStorage.getItem(SAVE_KEY);
      let validOld=false;
      try{if(old){parseSaveV2768(old);validOld=true;}}catch(_){}
      // 备份写入失败时不覆盖主档，保留已有记录。
      if(validOld && old!==raw)localStorage.setItem(SAVE_BACKUP_KEY,old);
      localStorage.setItem(SAVE_KEY,raw);
    }
    let miniSaveDeferredV286840=false;
    function saveGame() {
      if(miniSaveDeferredV286840)return true;
      if(player?.testAccount999) return saveTest999V2760();
      try {
        writeSaveV2768(JSON.stringify(createSaveDataV2768()));
        showSaveIndicator();return true;
      }catch(e){
        console.error('保存失败:',e);
        if(Date.now()-lastSaveFailureNoticeV2768>30000){lastSaveFailureNoticeV2768=Date.now();showFloatingText?.('⚠️ 存档未保存，请打开【存档管理】导出备份','#ff8a80');}
        return false;
      }
    }
    function loadGame() {
      try {
        const raw=localStorage.getItem(SAVE_KEY);
        if(raw){try{return parseSaveV2768(raw);}catch(e){console.warn('主档无效，尝试备用档',e);}}
        const backup=localStorage.getItem(SAVE_BACKUP_KEY);
        if(backup){const data=parseSaveV2768(backup);data._recoveredFromBackup=true;return data;}
      }catch(e){console.error('读取存档失败:',e);}
      return null;
    }

    function deleteSave() {
      try {
        // 先删备用档：若失败保留主档，避免只删主档后又从备用档恢复。
        localStorage.removeItem(SAVE_BACKUP_KEY);
        localStorage.removeItem(SAVE_KEY);
        return true;
      } catch(e) { console.warn('无法删除本地存档：', e); return false; }
    }
    
    function showSaveIndicator() {
      const indicator = document.getElementById('saveIndicator');
      if(!indicator)return;
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 1500);
    }
    
    function manualSave() {
      if (saveGame()) {
        alert(gameState==='combat'?'💾 已保留开战前记录；未结算时退出，会恢复当场消耗并返回开战前。':'💾 修行记录已记入玉简');
      } else {
        alert('修行记录未能写入，请稍后再试');
      }
    }
    
    function autoSave() {
      if (gameState !== 'start') {
        saveGame();
      }
      if(typeof syncSectTodoV2868==='function')syncSectTodoV2868();
    }
    
    function startAutoSave() {
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      autoSaveTimer = setInterval(autoSave, 30000); // 30秒自动保存
    }

    // 切到后台/关闭页面前也保存一次，减少意外丢档
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && document.getElementById('gameScreen') && !document.getElementById('gameScreen').classList.contains('hidden')) {
        autoSave();
      }
    });
    window.addEventListener('pagehide', () => {
      const screen=document.getElementById('gameScreen');
      if(screen&&!screen.classList.contains('hidden'))autoSave();
    });
    window.addEventListener('beforeunload', () => {
      if (document.getElementById('gameScreen') && !document.getElementById('gameScreen').classList.contains('hidden')) {
        try { autoSave(); } catch (_) {}
      }
    });
    
    function formatSaveTime(timestamp) {
      const date = new Date(timestamp);
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    }
    
    // ================== 音效系统 ==================
    
    let audioCtx = null;
    const activeTonesV286820 = new Set();
    let audioResumeV286820 = null;
    let masterVolume = 0.5;
    let isMuted = false;
    let bgmOscillators = [];
    let bgmGain = null;
    let isBgmPlaying = false;
    
    function initAudio() {
      if (audioCtx) return;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {
        console.log('Web Audio API 不可用');
      }
    }
    
    // Oscillators are single-use WebAudio nodes. Bound live voices and disconnect on end.
    function unlockAudioV286820() {
      initAudio();
      if (!audioCtx || isMuted || audioCtx.state === 'running' || audioCtx.state === 'closed' || audioResumeV286820) return;
      try {
        audioResumeV286820 = Promise.resolve(audioCtx.resume()).catch(()=>{}).finally(()=>{audioResumeV286820=null;});
      } catch (_) { audioResumeV286820=null; }
    }
    document.addEventListener('pointerdown', unlockAudioV286820, true);
    document.addEventListener('keydown', unlockAudioV286820, true);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)return;
      for(const node of [...activeTonesV286820]){try{node.stop();}catch(_){}node.onended?.();}
    });

    function playTone(frequency, duration, type = 'sine', volume = 0.3) {
      if (!audioCtx || isMuted || document.hidden || audioCtx.state !== 'running' || activeTonesV286820.size >= 3) return;
      let oscillator, gainNode;
      const release=()=>{activeTonesV286820.delete(oscillator);try{oscillator?.disconnect();gainNode?.disconnect();}catch(_){}};
      try {
        oscillator=audioCtx.createOscillator();gainNode=audioCtx.createGain();
        oscillator.type=type;
        oscillator.frequency.setValueAtTime(frequency,audioCtx.currentTime);
        gainNode.gain.setValueAtTime(Math.max(.0001,volume*masterVolume),audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);
        oscillator.connect(gainNode);gainNode.connect(audioCtx.destination);
        oscillator.onended=release;activeTonesV286820.add(oscillator);
        oscillator.start();oscillator.stop(audioCtx.currentTime+duration);
      } catch (_) { release(); }
    }

    function playSound(type) {
      if (!audioCtx || isMuted) return;
      
      unlockAudioV286820();
      
      switch(type) {
        case 'click':
          playTone(800, 0.1, 'sine', 0.2);
          break;
        case 'attack':
          playTone(200, 0.15, 'sawtooth', 0.3);
          setTimeout(() => playTone(150, 0.1, 'sawtooth', 0.2), 50);
          break;
        case 'skill':
          playTone(400, 0.1, 'sine', 0.3);
          setTimeout(() => playTone(600, 0.1, 'sine', 0.3), 100);
          setTimeout(() => playTone(800, 0.15, 'sine', 0.2), 200);
          break;
        case 'hit':
          playTone(100, 0.2, 'square', 0.4);
          break;
        case 'heal':
          playTone(523, 0.15, 'sine', 0.3);
          setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 100);
          setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 200);
          break;
        case 'levelup':
          [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.3, 'sine', 0.4), i * 150);
          });
          break;
        case 'boss':
          playTone(100, 0.5, 'sawtooth', 0.5);
          setTimeout(() => playTone(80, 0.5, 'sawtooth', 0.5), 300);
          setTimeout(() => playTone(60, 0.8, 'sawtooth', 0.5), 600);
          break;
        case 'item':
          playTone(800, 0.1, 'sine', 0.3);
          setTimeout(() => playTone(1000, 0.15, 'sine', 0.3), 80);
          break;
        case 'victory':
          [392, 523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.4, 'sine', 0.4), i * 120);
          });
          break;
        case 'defeat':
          [392, 349, 330, 294, 262].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.5, 'sine', 0.3), i * 200);
          });
          break;
        case 'achievement':
          [523, 659, 784, 1047, 1319].forEach((f, i) => {
            setTimeout(() => playTone(f, 0.25, 'sine', 0.4), i * 100);
          });
          break;
      }
    }
    
    function startBGM() {
      if (!audioCtx || isBgmPlaying) return;
      
      unlockAudioV286820();
      
      isBgmPlaying = true;
      bgmGain = audioCtx.createGain();
      bgmGain.gain.setValueAtTime(0.1 * masterVolume, audioCtx.currentTime);
      bgmGain.connect(audioCtx.destination);
      
      playBGMLoop();
    }
    
    function playBGMLoop() {
      if (!isBgmPlaying || isMuted) return;
      
      // 简单的中国风旋律循环
      const melody = [
        { note: 262, dur: 0.5 },  // C4
        { note: 294, dur: 0.5 },  // D4
        { note: 330, dur: 0.5 },  // E4
        { note: 392, dur: 0.5 },  // G4
        { note: 440, dur: 0.5 },  // A4
        { note: 392, dur: 0.5 },  // G4
        { note: 330, dur: 0.5 },  // E4
        { note: 294, dur: 1.0 },  // D4
      ];
      
      let time = audioCtx.currentTime;
      melody.forEach(({ note, dur }) => {
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, time);
        
        env.gain.setValueAtTime(0.08 * masterVolume, time);
        env.gain.exponentialRampToValueAtTime(0.01, time + dur * 0.9);
        
        osc.connect(env);
        env.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + dur);
        
        time += dur;
      });
      
      // 循环播放
      const totalDuration = melody.reduce((sum, n) => sum + n.dur, 0);
      setTimeout(() => {
        if (isBgmPlaying && !isMuted) {
          playBGMLoop();
        }
      }, totalDuration * 1000);
    }
    
    function stopBGM() {
      isBgmPlaying = false;
    }
    
    function toggleMute() {
      isMuted = !isMuted;
      const btn = document.getElementById('muteBtn');
      if(btn){btn.textContent = isMuted ? '🔇' : '🔊';btn.classList.toggle('muted', isMuted);btn.setAttribute('aria-label',isMuted?'取消静音':'静音');}
      const quick = document.getElementById('quickMuteV286838');
      if(quick){quick.textContent = isMuted ? '🔇 取消静音' : '🔊 静音';quick.setAttribute('aria-pressed',String(isMuted));}
      if (isMuted) stopBGM();
    }
    
    function setVolume(value) {
      masterVolume = value / 100;
      if (bgmGain) {
        bgmGain.gain.setValueAtTime(0.1 * masterVolume, audioCtx.currentTime);
      }
    }
    
    function toggleBGM() {
      if (isBgmPlaying) {
        stopBGM();
      } else {
        startBGM();
      }
    }
    
    // ================== 成就系统 ==================
    
    const ACHIEVEMENTS = {
      // 战斗成就
      first_blood: { name: '初次胜利', desc: '击败第一只怪物', icon: '⚔️', type: 'combat', target: 1, reward: { gold: 50, exp: 30 } },
      monster_slayer_10: { name: '斩妖除魔', desc: '击败10只怪物', icon: '🗡️', type: 'combat', target: 10, reward: { gold: 100, exp: 50 } },
      monster_slayer_50: { name: '妖魔克星', desc: '击败50只怪物', icon: '⚔️', type: 'combat', target: 50, reward: { gold: 300, exp: 150 } },
      monster_slayer_100: { name: '屠魔真君', desc: '击败100只怪物', icon: '🔥', type: 'combat', target: 100, reward: { gold: 500, exp: 300, item: '天元丹' } },
      boss_first: { name: '初战首领', desc: '首次击败首领', icon: '👹', type: 'boss', target: 1, reward: { gold: 200, exp: 100 } },
      boss_master: { name: '首领猎手', desc: '击败所有首领', icon: '👑', type: 'boss', target: 3, reward: { gold: 1000, exp: 500, item: '仙剑' } },
      
      // 成长成就（按大境界解锁）
      realm_qi: { name:'练气入门', desc:'达到练气境', icon:'✨', type:'realm', target:1, reward:{ gold:50 } },
      realm_foundation: { name:'筑基有成', desc:'达到筑基境', icon:'🌟', type:'realm', target:2, reward:{ gold:100, exp:50 } },
      realm_kaiguang: { name:'灵台筑基', desc:'达到筑基中期', icon:'🔆', type:'realm', target:2, phase:1, reward:{ gold:140, exp:70 } },
      realm_ronghe: { name:'灵脉筑基', desc:'达到筑基后期', icon:'🌀', type:'realm', target:2, phase:2, reward:{ gold:180, exp:90 } },
      realm_xindong: { name:'筑基问道', desc:'达到筑基圆满', icon:'💗', type:'realm', target:2, phase:3, reward:{ gold:220, exp:110 } },
      realm_golden: { name:'金丹大道', desc:'达到金丹境', icon:'💫', type:'realm', target:3, reward:{ gold:300, exp:150 } },
      realm_nascent: { name:'元婴诞生', desc:'达到元婴境', icon:'🔮', type:'realm', target:4, reward:{ gold:450, exp:220, item:'灵剑' } },
      realm_chuqiao: { name:'元神化神', desc:'达到化神境', icon:'👁️', type:'realm', target:5, reward:{ gold:550, exp:280 } },
      realm_fenshen: { name:'神念万千', desc:'达到炼虚境', icon:'🌌', type:'realm', target:6, reward:{ gold:700, exp:350 } },
      realm_heti: { name:'天人合体', desc:'达到合体境', icon:'☯️', type:'realm', target:7, reward:{ gold:850, exp:420 } },
      realm_dongxu: { name:'合体见真', desc:'达到合体圆满', icon:'🕳️', type:'realm', target:7, phase:3, reward:{ gold:1050, exp:520 } },
      realm_dacheng: { name:'大道将成', desc:'达到大乘境', icon:'🌠', type:'realm', target:8, reward:{ gold:1300, exp:650 } },
      realm_tribulation: { name:'渡劫问天', desc:'达到渡劫境', icon:'⚡', type:'realm', target:9, reward:{ gold:1800, exp:900, item:'仙甲' } },
      realm_dixian: { name:'地仙证道', desc:'达到地仙境', icon:'🏔️', type:'realm', target:10, reward:{ gold:2000, exp:1000 } },
      realm_tianxian: { name:'天仙御风', desc:'达到天仙境', icon:'🌤️', type:'realm', target:11, reward:{ gold:2300, exp:1150 } },
      realm_jinxian: { name:'金仙登临', desc:'达到金仙境', icon:'🌞', type:'realm', target:12, reward:{ gold:2600, exp:1400 } },
      realm_xuanxian: { name:'金仙妙境', desc:'达到金仙圆满', icon:'🌙', type:'realm', target:12, phase:3, reward:{ gold:3600, exp:1900 } },
      realm_taiyizhen: { name:'太乙凝道', desc:'达到太乙金仙境', icon:'🪷', type:'realm', target:13, reward:{ gold:5000, exp:2600 } },
      realm_taiyijin: { name:'太乙金仙', desc:'达到太乙金仙圆满', icon:'☀️', type:'realm', target:13, phase:3, reward:{ gold:7000, exp:3500 } },
      realm_taiyixuan: { name:'大罗证道', desc:'达到大罗金仙境', icon:'🌀', type:'realm', target:14, reward:{ gold:9500, exp:4700 } },
      realm_daluo: { name:'大罗不朽', desc:'达到大罗金仙圆满', icon:'🌌', type:'realm', target:14, phase:3, reward:{ gold:13000, exp:6500 } },
      realm_zhunsheng: { name:'准圣之境', desc:'达到准圣境', icon:'🔱', type:'realm', target:15, reward:{ gold:18000, exp:9000 } },
      realm_shengren: { name:'混元圣人', desc:'达到圣人境', icon:'👑', type:'realm', target:16, reward:{ gold:30000, exp:15000 } },
      
      // 感情线成就
      reunion_complete: { name:'情断再续', desc:'与苏晚晴解开旧结，重新选择彼此', icon:'🌸', type:'special', target:1, reward:{} },
      release_complete: { name:'道心释然', desc:'与苏晚晴坦诚过往，选择各自安好', icon:'🌅', type:'special', target:1, reward:{} },

      // 收集成就
      collector_weapon: { name: '兵器收藏家', desc: '收集3种武器', icon: '⚔️', type: 'collect', target: 3, reward: { gold: 100 } },
      collector_armor: { name: '防具收藏家', desc: '收集3种防具', icon: '🛡️', type: 'collect', target: 3, reward: { gold: 100 } },
      pet_master: { name: '驯兽师', desc: '拥有3只宠物', icon: '🐾', type: 'pet', target: 3, reward: { gold: 200, item: '灵兽丹' } },
      artifact_collector: { name: '法宝收藏家', desc: '拥有3件法宝', icon: '✨', type: 'artifact', target: 3, reward: { gold: 300, item: '星辰砂' } },
      alchemy_master: { name: '炼丹大师', desc: '成功炼制10次丹药', icon: '🔥', type: 'alchemy', target: 10, reward: { gold: 200, exp: 100 } },
      
      // 特殊成就
      survivor: { name: '不屈意志', desc: '战斗中从1点气血存活', icon: '💪', type: 'special', target: 1, reward: { gold: 100, exp: 50 } },
      rich: { name: '富甲一方', desc: '拥有5000灵石', icon: '💰', type: 'gold', target: 5000, reward: { exp: 200 } },
      story_complete: { name: '仙途圆满', desc: '完成所有主线剧情', icon: '📖', type: 'story', target: 1, reward: { gold: 2000, exp: 1000 } }
    };
    
    let achievementProgress = {};
    let completedAchievements = new Set();
    
    function initAchievements() {
      achievementProgress = {
        monstersKilled: 0,
        bossesDefeated: 0,
        weaponsCollected: 0,
        armorsCollected: 0,
        petsOwned: 0,
        artifactsOwned: 0,
        alchemyCount: 0,
        goldPeak: 0,
        storyComplete: false,
        survivedOneHp: false
      };
      completedAchievements = new Set();
    }
    
    function updateAchievementProgress(type, value = 1) {
      switch(type) {
        case 'monster':
          achievementProgress.monstersKilled += value;
          checkAchievement('combat', achievementProgress.monstersKilled);
          break;
        case 'boss':
          achievementProgress.bossesDefeated += value;
          checkAchievement('boss', achievementProgress.bossesDefeated);
          break;
        case 'realm':
          checkAchievement('realm', player.level);
          break;
        case 'weapon':
          achievementProgress.weaponsCollected = value;
          checkAchievement('collect', achievementProgress.weaponsCollected);
          break;
        case 'armor':
          achievementProgress.armorsCollected = value;
          checkAchievement('collect', achievementProgress.armorsCollected);
          break;
        case 'pet':
          achievementProgress.petsOwned = player.pets.length;
          checkAchievement('pet', achievementProgress.petsOwned);
          break;
        case 'artifact':
          achievementProgress.artifactsOwned = player.artifacts.length;
          checkAchievement('artifact', achievementProgress.artifactsOwned);
          break;
        case 'alchemy':
          achievementProgress.alchemyCount++;
          checkAchievement('alchemy', achievementProgress.alchemyCount);
          break;
        case 'gold':
          if (player.gold > achievementProgress.goldPeak) {
            achievementProgress.goldPeak = player.gold;
            checkAchievement('gold', achievementProgress.goldPeak);
          }
          break;
        case 'survive':
          achievementProgress.survivedOneHp = true;
          checkAchievement('special', 1);
          break;
        case 'story':
          achievementProgress.storyComplete = true;
          checkAchievement('story', 1);
          break;
      }
    }
    
    function checkAchievement(type, value) {
      for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
        if (completedAchievements.has(id)) continue;
        if (ach.type !== type) continue;
        
        let progress = 0;
        switch(type) {
          case 'combat':
            progress = achievementProgress.monstersKilled;
            break;
          case 'boss':
            progress = achievementProgress.bossesDefeated;
            break;
          case 'realm':
            progress = player.level;
            if (progress === ach.target && (player.phase || 0) < (ach.phase || 0)) progress = ach.target - 1;
            break;
          case 'collect':
            progress = Math.max(achievementProgress.weaponsCollected, achievementProgress.armorsCollected);
            break;
          case 'pet':
            progress = achievementProgress.petsOwned;
            break;
          case 'artifact':
            progress = achievementProgress.artifactsOwned;
            break;
          case 'alchemy':
            progress = achievementProgress.alchemyCount;
            break;
          case 'gold':
            progress = achievementProgress.goldPeak;
            break;
          case 'special':
            progress = achievementProgress.survivedOneHp ? 1 : 0;
            break;
          case 'story':
            progress = achievementProgress.storyComplete ? 1 : 0;
            break;
        }
        
        if (progress >= ach.target) {
          unlockAchievement(id);
        }
      }
    }
    
    function unlockAchievement(id) {
      if (completedAchievements.has(id)) return;
      
      const ach = ACHIEVEMENTS[id];
      completedAchievements.add(id);
      
      // 发放奖励
      if (ach.reward.gold) player.gold += ach.reward.gold;
      if (ach.reward.exp) {
        player.exp += ach.reward.exp;
        checkLevelUp();
      }
      if (ach.reward.item) player.inventory.push(ach.reward.item);
      
      // 播放音效和显示提示
      playSound('achievement');
      showAchievementPopup(ach);
      
      // 保存
      autoSave();
    }
    
    function showAchievementPopup(ach) {
      // 同一时刻只展示一个成就；整张卡可轻触关闭，并有独立硬超时兜底。
      document.querySelectorAll('.achievement-popup').forEach(el => el.remove());
      const popup = document.createElement('div');
      popup.className = 'achievement-popup';
      popup.setAttribute('role', 'status');
      popup.setAttribute('aria-live', 'polite');
      popup.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 5px;">🏆 成就解锁！</div>
        <div style="font-size: 18px; color: #ffd700;">${ach.icon} ${ach.name}</div>
        <div style="font-size: 12px; color: #aaa; margin-top: 5px;">${ach.desc}</div>
        <div class="achievement-dismiss-v2764">轻触关闭 · 将自动消失</div>
      `;
      const dismiss = () => { if (popup.isConnected) popup.remove(); };
      popup.addEventListener('pointerup', dismiss, {once:true});
      popup.addEventListener('click', dismiss, {once:true});
      document.body.appendChild(popup);
      setTimeout(dismiss, 2200);
    }
    
    function showAchievements() {
      const panel = document.createElement('div');
      panel.className = 'panel achievement-panel';
      panel.style.position = 'fixed';
      panel.style.top = '50%';
      panel.style.left = '50%';
      panel.style.transform = 'translate(-50%, -50%)';
      panel.style.width = '90%';
      panel.style.maxWidth = '500px';
      panel.style.maxHeight = '80vh';
      panel.style.overflowY = 'auto';
      panel.style.zIndex = '2000';
      
      let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="color: #ffd700; margin: 0;">🏆 仙途成就录</h3>
          <button class="save-btn" onclick="this.parentElement.parentElement.remove()">✕ 关闭</button>
        </div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 15px;">
          已完成: ${completedAchievements.size} / ${Object.keys(ACHIEVEMENTS).length}
        </div>
      `;
      
      const categories = [
        { type: 'combat', name: '⚔️ 战斗成就', types: ['combat', 'boss'] },
        { type: 'realm', name: '🌟 成长成就', types: ['realm'] },
        { type: 'collect', name: '📦 收集成就', types: ['collect', 'pet', 'artifact', 'alchemy'] },
        { type: 'special', name: '✨ 特殊成就', types: ['special', 'gold', 'story'] }
      ];
      
      categories.forEach(cat => {
        html += `<div style="color: #ffd700; font-size: 14px; margin: 15px 0 10px; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 5px;">${cat.name}</div>`;
        
        for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
          if (!cat.types.includes(ach.type)) continue;
          
          const completed = completedAchievements.has(id);
          let progress = 0;
          
          switch(ach.type) {
            case 'combat': progress = achievementProgress.monstersKilled; break;
            case 'boss': progress = achievementProgress.bossesDefeated; break;
            case 'realm': progress = player.level; break;
            case 'collect': progress = Math.max(achievementProgress.weaponsCollected, achievementProgress.armorsCollected); break;
            case 'pet': progress = achievementProgress.petsOwned; break;
            case 'artifact': progress = achievementProgress.artifactsOwned; break;
            case 'alchemy': progress = achievementProgress.alchemyCount; break;
            case 'gold': progress = achievementProgress.goldPeak; break;
            case 'special': progress = achievementProgress.survivedOneHp ? 1 : 0; break;
            case 'story': progress = achievementProgress.storyComplete ? 1 : 0; break;
          }
          
          const progressPercent = Math.min(100, (progress / ach.target) * 100);
          
          html += `
            <div class="achievement-card ${completed ? 'completed' : ''}">
              <div class="achievement-icon">${completed ? '✓' : ach.icon}</div>
              <div class="achievement-info">
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
                <div class="achievement-progress">
                  <div class="achievement-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="achievement-reward">
                  ${progress} / ${ach.target} | 奖励: ${ach.reward.gold ? `💰${ach.reward.gold}` : ''} ${ach.reward.exp ? `⭐${ach.reward.exp}` : ''} ${ach.reward.item ? `📦${ach.reward.item}` : ''}
                </div>
              </div>
            </div>
          `;
        }
      });
      
      panel.innerHTML = html;
      document.body.appendChild(panel);
    }
    
    // ================== 角色移动系统 ==================
    
    let isMoveMode = false;
    let playerX = 0;
    let playerY = 0;
    let moveDirection = { x: 0, y: 0 };
    let isMoving = false;
    let currentZone = null;
    
    function initMoveSystem() {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      // 设置移动区域位置
      updateMoveZones();
      window.addEventListener('resize', updateMoveZones);
    }
    
    function updateMoveZones() {
      const zones = [
        { id: 'moveZoneVillage', x: '5%', y: '15%', w: '15%', h: '20%' },
        { id: 'moveZoneShop', x: '5%', y: '40%', w: '15%', h: '15%' },
        { id: 'moveZoneExplore', x: '80%', y: '15%', w: '15%', h: '20%' },
        { id: 'moveZoneAlchemy', x: '80%', y: '40%', w: '15%', h: '15%' },
        { id: 'moveZoneRest', x: '45%', y: '80%', w: '10%', h: '15%' }
      ];
      
      zones.forEach(z => {
        const el = document.getElementById(z.id);
        if (el) {
          el.style.left = z.x;
          el.style.top = z.y;
          el.style.width = z.w;
          el.style.height = z.h;
        }
      });
    }
    
    function toggleMoveMode() {
      isMoveMode = !isMoveMode;
      const btn = document.getElementById('moveToggle');
      const hint = document.getElementById('moveHint');
      const moveChar = document.getElementById('playerMoveChar');
      const zones = document.querySelectorAll('.move-zone');
      
      btn.classList.toggle('active', isMoveMode);
      hint.classList.toggle('show', isMoveMode);
      moveChar.style.display = isMoveMode ? 'block' : 'none';
      
      zones.forEach(z => z.classList.toggle('active', isMoveMode));
      
      if (isMoveMode) {
        // 初始化角色位置
        playerX = window.innerWidth / 2 - 30;
        playerY = window.innerHeight / 2 - 40;
        updatePlayerPosition();
        drawMoveCharacter();
      }
    }
    
    function handleKeyDown(e) {
      if (!isMoveMode) return;
      
      const key = e.key.toLowerCase();
      let dx = 0, dy = 0;
      
      switch(key) {
        case 'w': case 'arrowup': dy = -1; break;
        case 's': case 'arrowdown': dy = 1; break;
        case 'a': case 'arrowleft': dx = -1; break;
        case 'd': case 'arrowright': dx = 1; break;
        default: return;
      }
      
      e.preventDefault();
      moveDirection = { x: dx, y: dy };
      
      if (!isMoving) {
        isMoving = true;
        requestAnimationFrame(movePlayer);
      }
    }
    
    function handleKeyUp(e) {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        moveDirection = { x: 0, y: 0 };
        isMoving = false;
      }
    }
    
    function movePlayer() {
      if (!isMoving || !isMoveMode) return;
      
      const speed = 5;
      playerX += moveDirection.x * speed;
      playerY += moveDirection.y * speed;
      
      // 边界检测
      playerX = Math.max(0, Math.min(window.innerWidth - 60, playerX));
      playerY = Math.max(0, Math.min(window.innerHeight - 80, playerY));
      
      updatePlayerPosition();
      checkZoneCollision();
      
      requestAnimationFrame(movePlayer);
    }
    
    function updatePlayerPosition() {
      const moveChar = document.getElementById('playerMoveChar');
      moveChar.style.left = playerX + 'px';
      moveChar.style.top = playerY + 'px';
      
      // 移动动画
      if (isMoving) {
        moveChar.classList.add('player-moving');
      } else {
        moveChar.classList.remove('player-moving');
      }
    }
    
    function drawMoveCharacter() {
      const canvas = document.getElementById('playerMoveChar');
      drawCharacter(canvas, 'player', player.level, false);
    }
    
    function checkZoneCollision() {
      const moveChar = document.getElementById('playerMoveChar');
      const charRect = {
        left: playerX,
        right: playerX + 60,
        top: playerY,
        bottom: playerY + 80
      };
      
      const zones = document.querySelectorAll('.move-zone');
      let newZone = null;
      
      zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        const zoneRect = {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom
        };
        
        // 检测碰撞
        if (charRect.right > zoneRect.left &&
            charRect.left < zoneRect.right &&
            charRect.bottom > zoneRect.top &&
            charRect.top < zoneRect.bottom) {
          newZone = zone.dataset.zone;
        }
      });
      
      if (newZone && newZone !== currentZone) {
        currentZone = newZone;
        playSound('click');
        triggerZoneAction(newZone);
      } else if (!newZone) {
        currentZone = null;
      }
    }
    
    function triggerZoneAction(zone) {
      // 退出移动模式
      isMoveMode = false;
      document.getElementById('moveToggle').classList.remove('active');
      document.getElementById('moveHint').classList.remove('show');
      document.getElementById('playerMoveChar').style.display = 'none';
      document.querySelectorAll('.move-zone').forEach(z => z.classList.remove('active'));
      
      // 触发对应功能
      switch(zone) {
        case 'village': showLocation('village'); break;
        case 'shop': showLocation('shop'); break;
        case 'explore': showLocation('explore'); break;
        case 'alchemy': showLocation('alchemy'); break;
        case 'rest': showLocation('rest'); break;
      }
    }
    
    // ================== 游戏核心数据 ==================
    
    // ================== 随机事件系统 ==================
    
    const RANDOM_EVENTS = {
      // 奇遇类事件
      '高人指点': {
        type: 'encounter',
        weight: 10,
        minLevel:0,
        desc: '一位白发老者出现在你面前，传授你修炼心得。',
        effect: (p) => {
          const expGain = 100 + p.level * 50;
          p.exp += expGain;
          return { text: `获得修为 +${expGain}`, type: 'exp' };
        }
      },
      '发现秘境': {
        type: 'encounter',
        weight: 5,
        minLevel:2,
        desc: '你发现了一处隐藏的秘境入口！',
        effect: (p) => {
          const goldGain = 100 + p.level * 30;
          p.gold += goldGain;
          p.materials['天心草'] = (p.materials['天心草'] || 0) + 1;
          return { text: `获得灵石 +${goldGain}，发现天心草！`, type: 'gold' };
        }
      },
      // 宝物类事件
      '藏宝图': {
        type: 'treasure',
        weight: 8,
        minLevel:1,
        desc: '你捡到一张残破的藏宝图，按图索骥...',
        effect: (p) => {
          const roll = Math.random();
          if (roll < 0.3) {
            p.gold += 150 + p.level * 20;
            return { text: `找到宝藏！灵石 +${150 + p.level * 20}`, type: 'gold' };
          } else if (roll < 0.6) {
            const items = ['铁剑', '铁甲', '精钢剑'];
            const item = items[Math.floor(Math.random() * items.length)];
            p.inventory.push(item);
            return { text: `找到装备：${item}！`, type: 'item' };
          } else {
            p.gold += 50;
            return { text: `只找到少量灵石 +50`, type: 'gold' };
          }
        }
      },
      '遗落物品': {
        type: 'treasure',
        weight: 12,
        minLevel:0,
        desc: '路边有一个遗落的包裹。',
        effect: (p) => {
          const items = ['小还丹', '聚灵丹', '悟道茶'];
          const item = items[Math.floor(Math.random() * items.length)];
          p.inventory.push(item);
          return { text: `获得 ${item}`, type: 'item' };
        }
      },
      // 危机类事件
      '中毒': {
        type: 'crisis',
        weight: 8,
        minLevel:0,
        desc: '你不小心触碰了毒草，身中剧毒！',
        effect: (p) => {
          const damage = Math.floor(p.hp * 0.2);
          p.hp = Math.max(1, p.hp - damage);
          return { text: `损失气血 -${damage}`, type: 'damage' };
        }
      },
      '陷阱': {
        type: 'crisis',
        weight: 8,
        minLevel:1,
        desc: '你踩中了猎人留下的陷阱！',
        effect: (p) => {
          const damage = Math.floor(p.hp * 0.15);
          p.hp = Math.max(1, p.hp - damage);
          return { text: `损失气血 -${damage}`, type: 'damage' };
        }
      },
      '被偷窃': {
        type: 'crisis',
        weight: 6,
        minLevel:0,
        desc: '一个黑影闪过，你的钱袋轻了...',
        effect: (p) => {
          const stolen = Math.floor(p.gold * 0.1);
          p.gold = Math.max(0, p.gold - stolen);
          return { text: `灵石 -${stolen}`, type: 'damage' };
        }
      },
      // NPC类事件
      '神秘商人': {
        type: 'npc',
        weight: 5,
        minLevel:2,
        desc: '一位神秘商人出现在你面前，"道友，要买点好东西吗？"',
        effect: (p) => {
          if (p.gold >= 100) {
            p.gold -= 100;
            const rareItems = ['天元丹', '仙果', '妖丹'];
            const item = rareItems[Math.floor(Math.random() * rareItems.length)];
            if (ITEMS[item]) {
              p.inventory.push(item);
            } else {
              p.materials[item] = (p.materials[item] || 0) + 1;
            }
            return { text: `花费100灵石，获得 ${item}！`, type: 'item' };
          }
          return { text: '灵石不足，商人摇头离去...', type: 'none' };
        }
      },
      '求救者': {
        type: 'npc',
        weight: 10,
        minLevel:0,
        desc: '一个修士模样的路人向你求救。',
        effect: (p) => {
          const roll = Math.random();
          if (roll < 0.4) {
            p.gold += 50;
            return { text: `你帮助了他，他赠送你50灵石作为谢礼。`, type: 'gold' };
          } else if (roll < 0.7) {
            p.inventory.push('小还丹');
            return { text: `你帮助了他，他赠送你一枚小还丹。`, type: 'item' };
          } else {
            p.exp += 30;
            return { text: `你帮助了他，获得修为 +30（善有善报）`, type: 'exp' };
          }
        }
      },
      // 修炼类事件
      '顿悟': {
        type: 'cultivation',
        weight: 3,
        minLevel:2,
        desc: '你突然灵光一闪，对道法有了新的领悟！',
        effect: (p) => {
          const expGain = 200 + p.level * 100;
          p.exp += expGain;
          return { text: `顿悟！修为 +${expGain}`, type: 'exp' };
        }
      },
      '心魔入侵': {
        type: 'cultivation',
        weight: 4,
        minLevel:2,
        desc: '修炼时心魔突然入侵你的识海！',
        effect: (p) => {
          if (Math.random() < 0.6) {
            const expLoss = Math.floor(p.exp * 0.1);
            p.exp = Math.max(0, p.exp - expLoss);
            return { text: `心魔被击退，但修为受损 -${expLoss}`, type: 'damage' };
          } else {
            p.exp += 100;
            return { text: `成功镇压心魔，心境提升！修为 +100`, type: 'exp' };
          }
        }
      },
      // 特殊事件
      '灵泉发现': {
        type: 'special',
        weight: 4,
        minLevel:1,
        desc: '你发现了一眼灵泉，泉水晶莹剔透。',
        effect: (p) => {
          p.hp = getMaxHp();
          p.mp = getMaxMp();
          p.exp += 50;
          return { text: `气血灵力全满！修为 +50`, type: 'heal' };
        }
      },
      '古迹探索': {
        type: 'special',
        weight: 3,
        minLevel:2,
        desc: '你发现了一处上古遗迹...',
        effect: (p) => {
          const roll = Math.random();
          if (roll < 0.3) {
            // 法宝
            if (p.artifacts.length < 10) {
              dropRandomArtifact();
              return { text: `发现上古法宝！`, type: 'item' };
            }
          } else if (roll < 0.6) {
            // 稀有材料
            const rareMats = ['星辰砂', '龙血果', '血玉'];
            const mat = rareMats[Math.floor(Math.random() * rareMats.length)];
            p.materials[mat] = (p.materials[mat] || 0) + 1;
            return { text: `发现稀有材料：${mat}`, type: 'item' };
          }
          p.gold += 200;
          return { text: `发现灵石 +200`, type: 'gold' };
        }
      }
    };
    
    // 触发随机事件
    function triggerRandomEvent(location) {
      // 根据地点调整事件权重
      const locationModifiers = {
        'explore': { crisis: 1.2, treasure: 1.3 },
        'mountain': { encounter: 1.5, cultivation: 1.3 },
        'youmingu': { crisis: 1.5, encounter: 0.8 },
        'forest': { crisis: 1.3, treasure: 1.2, encounter: 1.1 },
        'battlefield': { crisis: 1.4, treasure: 1.4, npc: 0.7 },
        'secret': { encounter: 1.5, treasure: 1.5, cultivation: 1.3 }
      };
      
      const modifiers = locationModifiers[location] || {};
      
      // 筛选可用事件
      const availableEvents = Object.entries(RANDOM_EVENTS).filter(([name, event]) => {
        return hasReachedRealm(event.minLevel);
      });
      
      if (availableEvents.length === 0) return null;
      
      // 计算权重
      let totalWeight = 0;
      const weightedEvents = availableEvents.map(([name, event]) => {
        let weight = event.weight;
        if (modifiers[event.type]) {
          weight *= modifiers[event.type];
        }
        totalWeight += weight;
        return { name, event, weight };
      });
      
      // 随机选择
      let roll = Math.random() * totalWeight;
      for (const { name, event, weight } of weightedEvents) {
        roll -= weight;
        if (roll <= 0) {
          return { name, event };
        }
      }
      
      return null;
    }
    
    // 打击效果函数
    const combatValueTimersV2818=new Map();
    function removeCombatValueV2818(el){
      clearTimeout(combatValueTimersV2818.get(el));combatValueTimersV2818.delete(el);el.remove();
    }
    function clearCombatValuesV2818(){
      for(const el of [...combatValueTimersV2818.keys()])removeCombatValueV2818(el);
      document.getElementById('combatValuesV2817')?.remove();
    }
    function showDamageNumber(damage,target,isHeal=false,isCrit=false,isBossSkill=false,isPet=false,skillName='',mpCost=0){
      const arena=document.getElementById('combatArena');if(!arena)return;
      const amount=Number(damage);if(!Number.isFinite(amount))return;
      const title=skillName||(isPet?'灵宠追击':isHeal?'恢复':'普通攻击');
      const result=`${isCrit?'暴击 ':''}${isHeal?'+':'-'}${Math.max(0,Math.floor(amount))}`;
      let history=document.getElementById('combatResultHistoryV2818');
      if(!history){history=document.createElement('div');history.id='combatResultHistoryV2818';history.setAttribute('aria-live','polite');arena.insertAdjacentElement('afterend',history);}
      const record=document.createElement('div');record.className='combat-result-line-v2818 '+(isHeal?'result-heal':target==='enemy'?'result-outgoing':'result-incoming');
      const label=document.createElement('span');label.textContent=(target==='enemy'?'敌方':'己方')+' · '+title;
      const value=document.createElement('strong');value.textContent=result;
      const meta=document.createElement('small');meta.textContent=Number(mpCost)>0?`灵力 −${mpCost}`:isHeal?'恢复气血':'伤害';
      record.append(label,value,meta);history.prepend(record);while(history.children.length>3)history.lastElementChild.remove();
      if(document.hidden)return;
      let layer=document.getElementById('combatValuesV2817');
      if(!layer){layer=document.createElement('div');layer.id='combatValuesV2817';layer.className='combat-values-v2817';layer.setAttribute('aria-hidden','true');arena.appendChild(layer);}
      const side=target==='enemy'?'enemy':'player';
      let same=[...layer.querySelectorAll('.value-target-'+side)];
      if(same.length>=2){removeCombatValueV2818(same[0]);same=same.slice(1);}
      const slot=same.some(x=>x.dataset.valueSlot==='0')?1:0;
      const el=document.createElement('div');el.dataset.valueSlot=String(slot);
      el.className='damage-number value-target-'+side+' '+(isHeal?'heal':isBossSkill?'boss-skill':isPet?'pet-damage':side+'-damage')+(isCrit?' crit':'');
      el.style.setProperty('--value-stack',String(slot));
      const name=document.createElement('span');name.className='combat-value-skill-v2817';name.textContent=title;
      const number=document.createElement('strong');number.className='combat-value-number-v2817';number.textContent=result;
      el.append(name,number);layer.appendChild(el);
      el.addEventListener('animationend',()=>removeCombatValueV2818(el),{once:true});
      combatValueTimersV2818.set(el,setTimeout(()=>removeCombatValueV2818(el),1700));
    }

    function playHitEffect(target) {
      window.InkSkillFxV2854?.hit(target);
      const avatar = target === 'enemy' ? 
        document.getElementById('enemyChar') : 
        document.getElementById('combatPlayerChar');
      const combatant = target === 'enemy' ?
        document.getElementById('enemyCombatant') :
        document.getElementById('playerCombatant');
      
      avatar.classList.add('hit-flash');
      setTimeout(() => avatar.classList.remove('hit-flash'), 200);
      
      combatant.classList.add('shake');
      setTimeout(() => combatant.classList.remove('shake'), 300);
    }
    
    function playAttackAnimation(attacker) {
      const combatant = attacker === 'player' ?
        document.getElementById('playerCombatant') :
        document.getElementById('enemyCombatant');
      
      combatant.classList.add(attacker === 'player' ? 'attack-swing' : 'enemy-attack-swing');
      setTimeout(() => combatant.classList.remove('attack-swing', 'enemy-attack-swing'), 300);
    }
    
    function skillAccentFor(element, skillName='') {
      if (element === 'fire') return '#ff9348';
      if (element === 'ice') return '#9fe8ff';
      if (element === 'thunder') return '#efe88f';
      if (element === 'heal') return '#84ffd0';
      if (element === 'sword') return skillName === '天地一剑' ? '#b7d8ff' : '#dce9ff';
      return '#ffffff';
    }

    function addSkillBanner(container, skillName, accent) {
      const banner = document.createElement('div');
      banner.className = 'skill-banner';
      banner.textContent = `✦ ${skillName} ✦`;
      banner.style.boxShadow = `0 6px 22px rgba(0,0,0,.28), 0 0 18px ${accent}55`;
      banner.style.borderColor = `${accent}66`;
      banner.style.color = accent;
      container.appendChild(banner);
      setTimeout(() => banner.remove(), 700);
    }

    function addElementOverlay(container, element) {
      const layer = document.createElement('div');
      layer.className = `element-screen ${element}`;
      container.appendChild(layer);
      setTimeout(() => layer.remove(), 600);
    }

    function addImpactRing(container, x, y, element='sword', size=120, duration=560) {
      const ring = document.createElement('div');
      ring.className = `impact-ring ${element}`;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.left = `${x}%`;
      ring.style.top = `${y}%`;
      container.appendChild(ring);
      setTimeout(() => ring.remove(), duration);
    }

    function spawnSkillParticles(container, { element='sword', x=70, y=45, count=12, spreadX=120, spreadY=90, dur=620, size=10 }) {
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = `skill-particle ${element}`;
        p.style.left = `${x}%`;
        p.style.top = `${y}%`;
        const dx = (Math.random() - 0.5) * spreadX;
        const dy = (Math.random() - 0.5) * spreadY - Math.random() * spreadY * 0.35;
        const ps = size * (0.65 + Math.random() * 0.9);
        p.style.setProperty('--dx', `${dx}px`);
        p.style.setProperty('--dy', `${dy}px`);
        p.style.setProperty('--rot', `${Math.random() * 260 - 130}deg`);
        p.style.setProperty('--dur', `${dur * (0.8 + Math.random() * 0.45)}ms`);
        p.style.setProperty('--size', `${ps}px`);
        if (element === 'sword') {
          p.style.width = `${Math.max(4, ps * 0.42)}px`;
          p.style.height = `${Math.max(18, ps * 2.2)}px`;
        }
        container.appendChild(p);
        setTimeout(() => p.remove(), dur + 240);
      }
    }

    function triggerArenaShake(arena, duration=260, strength='soft') {
      if(!arena) return;
      arena.classList.remove('screen-shake','fx-shake-soft','fx-shake-heavy');
      const cls=strength==='heavy'?'fx-shake-heavy':'fx-shake-soft';
      void arena.offsetWidth;
      arena.classList.add(cls);
      setTimeout(() => arena.classList.remove(cls), duration);
    }

    function getSkillFxTier(skillName, skillInfo=null) {
      if(skillName==='天地一剑') return 4;
      if(['万剑归宗','绝对零度','天火焚世','起死回生'].includes(skillName)) return 3;
      if(['剑气纵横','冰封千里','焚天烈焰','生生不息'].includes(skillName)) return 2;
      const power=Number(skillInfo?.damage || 0) || Number(skillInfo?.heal || 0)*5;
      if(power>=4.5) return 3;
      if(power>=2.5) return 2;
      return 1;
    }

    function fxCount(base) {
      const low=(typeof PERF_CONFIG!=='undefined' && PERF_CONFIG.lowEnd);
      return Math.max(4, Math.round(base*(low?.62:1)));
    }

    function makeFx(container, className, styles={}) {
      const el=document.createElement('div');
      el.className=className;
      Object.assign(el.style, styles);
      container.appendChild(el);
      return el;
    }

    function removeFxLater(el, ms=800){ setTimeout(()=>el?.remove(),ms); }

    function addCastRingV14(container, x, y, accent){
      const ring=makeFx(container,'fx-cast-ring-v14',{left:`${x}%`,top:`${y}%`,color:accent});
      ring.style.setProperty('--fx',accent);removeFxLater(ring,500);
    }

    function addImpactV14(container,x,y,accent,size='normal',delay=110){
      setTimeout(()=>{
        const el=makeFx(container,`fx-impact-v14 ${size==='huge'?'huge':size==='large'?'large':''}`,{left:`${x}%`,top:`${y}%`});
        el.style.setProperty('--fx',accent);removeFxLater(el,520);
      },delay);
    }

    function addIceShardsV14(container,x,y,count=8){
      for(let i=0;i<count;i++){
        const a=(360/count)*i + (Math.random()*14-7);
        const el=makeFx(container,'fx-ice-shard-v14',{left:`${x}%`,top:`${y}%`});
        el.style.setProperty('--r',`${a}deg`);
        removeFxLater(el,700);
      }
    }

    function addHealMotesV14(container,x,y,count=10){
      for(let i=0;i<count;i++){
        const el=makeFx(container,'fx-heal-mote-v14',{left:`calc(${x}% + ${(Math.random()-.5)*55}px)`,top:`calc(${y}% + ${(Math.random()-.5)*35}px)`});
        el.style.setProperty('--dx',`${(Math.random()-.5)*50}px`);
        el.style.setProperty('--dy',`${-30-Math.random()*55}px`);
        removeFxLater(el,850);
      }
    }

    function addWindStreaksV16(container,count=4){
      for(let i=0;i<count;i++){
        const el=makeFx(container,'fx-wind-streak-v16',{left:`${31+Math.random()*7}%`,top:`${43+Math.random()*16}%`,width:`${48+Math.random()*52}px`,animationDelay:`${i*35}ms`});
        removeFxLater(el,560);
      }
    }

    function addFanSwordSlashesV16(container,count=5){
      for(let i=0;i<count;i++){
        const el=makeFx(container,'fx-fan-slash-v16',{left:'31%',top:`${48+(i-(count-1)/2)*3.3}%`,animationDelay:`${i*42}ms`});
        el.style.setProperty('--ang',`${-18+i*(36/Math.max(1,count-1))}deg`);
        removeFxLater(el,720);
      }
    }

    function addWanJianV16(container,count=16){
      for(let i=0;i<count;i++){
        const angle=(360/count)*i;
        const el=makeFx(container,'fx-sword-orbit-v16',{left:`${30+Math.cos(angle*Math.PI/180)*8}%`,top:`${49+Math.sin(angle*Math.PI/180)*16}%`,animationDelay:`${Math.random()*120}ms`});
        el.style.setProperty('--ang',`${angle}deg`);
        el.style.setProperty('--dx',`${160+Math.random()*120}px`);
        el.style.setProperty('--dy',`${-18+Math.random()*95}px`);
        el.style.setProperty('--fall',`${70+Math.random()*30}deg`);
        removeFxLater(el,900);
      }
    }

    function addLightningPathV16(container){
      const pts=[[31,50],[38,42],[44,49],[50,39],[57,48],[63,41],[70,46]];
      for(let i=0;i<pts.length-1;i++){
        const [x1,y1]=pts[i],[x2,y2]=pts[i+1];
        const dx=x2-x1,dy=y2-y1;
        const ang=Math.atan2(dy,dx)*180/Math.PI;
        const el=makeFx(container,'fx-lightning-seg-v16',{left:`${x1}%`,top:`${y1}%`,width:`${Math.hypot(dx,dy)*1.52}%`,transform:`rotate(${ang}deg)`,animationDelay:`${i*18}ms`});
        removeFxLater(el,520);
      }
      for(let i=0;i<5;i++){
        const x=54+Math.random()*17,y=39+Math.random()*14;
        const el=makeFx(container,'fx-lightning-seg-v16',{left:`${x}%`,top:`${y}%`,width:`${18+Math.random()*24}px`,height:'2px',transform:`rotate(${Math.random()*110-55}deg)`,animationDelay:`${80+i*18}ms`});
        removeFxLater(el,520);
      }
    }

    function addFireRainV16(container,count=14){
      for(let i=0;i<count;i++){
        const el=makeFx(container,'fx-fire-rain-v16',{left:`${48+Math.random()*42}%`,top:`${-8-Math.random()*18}%`,animationDelay:`${Math.random()*220}ms`});
        el.style.setProperty('--r',`${14+Math.random()*14}deg`);
        el.style.setProperty('--dx',`${-25+Math.random()*55}px`);
        el.style.setProperty('--dur',`${520+Math.random()*230}ms`);
        removeFxLater(el,1050);
      }
    }

    // V27.86: bounded CSS-only sword/heal effects; one cleanup timer, no animation loop.
    let skillFxRunV2786=null;
    function clearSkillFxV2786(){
      if(!skillFxRunV2786)return;
      clearTimeout(skillFxRunV2786.timer);
      skillFxRunV2786.root.remove();skillFxRunV2786=null;
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearSkillFxV2786()});
    window.addEventListener('pagehide',clearSkillFxV2786);
    // V27.87 visual profiles only: combat statuses are resolved by combat(), never here.
    const skillProfilesV2787={
      '九霄雷云':['storm',6,'#b694ff'], '雷法':['bolt',2,'#bdadff'], '惊雷闪':['dart',1,'#b9b1ff'],
      '裂地奔雷':['ground',4,'#a89cff'], '紫霄落雷':['bolt',3,'#c896ff'],
      '万雷噬狱':['cage',5,'#a48bff'], '九天神雷':['storm',7,'#e2c1ff'],
      '闪电链':['chain',3,'#85dfff'], '雷神附体':['armor',4,'#b3a2ff'],
      '雷神附体·反噬':['bolt',2,'#b3a2ff'], '无音神雷':['silent',1,'#a7bcff'],
      '寒冰掌':['frost',3,'#bef5ff'], '冰封千里':['field',5,'#a1e7ff'],
      '绝对零度':['prison',6,'#d7fbff'], '玄冰刺':['icicle',2,'#a4efff'],
      '冰爆术':['burst',5,'#c0f7ff'], '霜寒结界':['field',4,'#9addff'],
      '冰蝶幻舞':['butterfly',5,'#c3d8ff'], '霜龙吐息':['breath',4,'#a1e6ff'],
      '冰河葬狱':['prison',5,'#94cbff'], '寒渊领域':['field',6,'#8eb6fa'],
      '冰甲护身':['armor',4,'#bdefff'], '冰魄封魂':['seal',4,'#d2d7ff'],
      '万载寒晶':['crystal',6,'#e1faff'],
      '烈焰斩':['slash',2,'#ffb173'], '焚天烈焰':['pillar',4,'#ff9965'],
      '天火焚世':['meteor',6,'#ffd17b'], '炎爆术':['burst',5,'#ffb15a'],
      '红莲业火':['lotus',5,'#ff7989'], '火墙术':['wall',5,'#ffad65'],
      '三昧真火':['triple',3,'#ffdb91'], '赤焰龙息':['breath',4,'#ff9d66'],
      '焚心炎':['heart',3,'#ff7587'], '燎原火域':['field',6,'#ffae65'],
      '太阳真火':['sun',6,'#ffe6a1'], '流火飞索':['bind',3,'#ffb26f'],
      '炎阳护盾':['armor',4,'#ffd78c']
    };
    function renderSkillFxV2786(name,element,host){
      if(!['sword','heal','thunder','ice','fire'].includes(element))return false;
      if(document.hidden)return true;
      const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const light=reduced||!!window.matchMedia?.('(max-width: 820px)').matches||!!document.querySelector('.cinema-light-v2776');
      const profile=skillProfilesV2787[name];
      const kind=profile?.[0]||'burst';
      const root=document.createElement('div');root.className='skill-fx-v2786'+(reduced?' reduced':'');root.setAttribute('aria-hidden','true');
      const palette={清风剑诀:'#a8f5de',破甲剑罡:'#ffd475',追魂一剑:'#b6a5ff',饮血剑诀:'#ff829a',玄罡护体剑:'#8cd8ff',凝露诀:'#b5f8e5',青莲护心:'#93e5bb',灵泉归元:'#80dcff',逆命回元:'#ffd59a',莲华济世:'#f9dc8b',天地一剑:'#ffdf88',起死回生:'#ffe9ab'};
      root.style.setProperty('--c',palette[name]||profile?.[2]||({heal:'#9aefbd',sword:'#b9edff',thunder:'#c5afff',ice:'#bcefff',fire:'#ffb77c'}[element]));
      host.appendChild(root);
      const point=(id,fallback)=>{const actor=document.getElementById(id),box=host.getBoundingClientRect(),r=actor?.getBoundingClientRect();return r&&box.width&&box.height?{x:Math.max(8,Math.min(92,(r.left+r.width/2-box.left)/box.width*100)),y:Math.max(15,Math.min(80,(r.top+r.height*.5-box.top)/box.height*100))}:fallback};
      const from=point('playerCombatant',{x:30,y:52}),to=point('enemyCombatant',{x:70,y:47});
      function node(type,p,delay=0,angle=0){const el=document.createElement('i');el.className='sfx-'+type;el.style.left=p.x+'%';el.style.top=p.y+'%';el.style.setProperty('--delay',delay+'ms');el.style.setProperty('--angle',angle+'deg');root.appendChild(el);return el}
      const label=document.createElement('span');label.className='sfx-name';label.textContent=name;root.appendChild(label);
      const target=element==='heal'||kind==='armor'?from:to;
      if(reduced){node('ring',target);}
      else if(element==='sword'){
        node('ring',from);
        if(name==='镇岳山河震'){node('field-v2787',{x:to.x,y:to.y+12},20);node('monolith-v2787',to,80);}
        if(name==='穿云贯日'){const lance=node('dart-v2787',from);const rect=host.getBoundingClientRect();lance.style.width='100px';lance.style.setProperty('--dx',(to.x-from.x)*rect.width/100+'px');lance.style.setProperty('--dy',(to.y-from.y)*rect.height/100+'px');}
        const count=name==='万剑归宗'?(light?5:9):name==='剑气纵横'?(light?3:5):name==='追魂一剑'?2:1;
        for(let i=0;i<count;i++){
          const slash=node(name==='天地一剑'?'greatblade':'slash',to,80+i*45,name==='破甲剑罡'?0:-35+i*14);
          if(name==='清风剑诀')slash.style.setProperty('--length','100px');
        }
        node('ring',to,140);
        if(name==='破甲剑罡'){node('shard',{x:to.x-4,y:to.y},160,-35);node('shard',{x:to.x+4,y:to.y},160,35);}
        if(name==='追魂一剑')node('seal',to,70);
        if(name==='饮血剑诀'){
          // Return ribbon denotes the skill's lifesteal; no invented extra damage number.
          const ribbon=node('return',to,190);
          const rect=host.getBoundingClientRect();
          ribbon.style.setProperty('--dx',(from.x-to.x)*rect.width/100+'px');
          ribbon.style.setProperty('--dy',(from.y-to.y)*rect.height/100+'px');
        }
        if(name==='玄罡护体剑')node('shield',from,240);
      }else if(element==='heal'){
        node('ring',from);
        const lotus=['青莲护心','莲华济世','生生不息'].includes(name);
        if(lotus){for(let i=0;i<(light?4:6);i++)node('petal',from,i*30,-65+i*(light?43:26));}
        else node(name==='逆命回元'?'seal':'column',from,50);
        if(['青莲护心','莲华济世'].includes(name))node('shield',from,120);
        if(name==='灵泉归元')node('orbit',from,70);
        if(name==='逆命回元'||name==='起死回生')node('ring',from,200);
        for(let i=0;i<(light?3:6);i++)node('mote',{x:from.x-6+(i*7)%13,y:from.y+10},80+i*50);
      }
      if(!reduced && ['thunder','ice','fire'].includes(element)){
        const count=Math.min(light?4:7,profile?.[1]||3);
        const offset=i=>({x:target.x+(i-(count-1)/2)*3,y:target.y});
        const mote=(type,n=count)=>{for(let i=0;i<n;i++)node(type,{x:target.x-6+(i*5)%13,y:target.y+7},70+i*40,-50+i*24)};
        // All pulses stay on the actual combatant; wide effects do not invent extra targets.
        node('ring',target,100);
        if(kind==='armor'){
          node('shield',from,40);
          mote(element==='thunder'?'arc-v2787':element==='ice'?'crystal-v2787':'flame-v2787');
        }else if(element==='thunder'){
          if(kind==='dart'){
            const dart=node('dart-v2787',from,0);
            const box=host.getBoundingClientRect();
            dart.style.setProperty('--dx',(to.x-from.x)*box.width/100+'px');
            dart.style.setProperty('--dy',(to.y-from.y)*box.height/100+'px');
          }else if(kind==='silent'){
            node('seal',to,100);node('arc-v2787',to,200,35);
          }else{
            if(kind==='cage')node('cage-v2787',to,70);
            if(kind==='ground')node('field-v2787',{x:to.x,y:to.y+12},30);
            for(let i=0;i<count;i++)node(kind==='chain'?'arc-v2787':'bolt-v2787',offset(i),i*45,kind==='chain'?(i-1)*45:0);
            if(kind==='storm')node('cloud-v2787',{x:to.x,y:Math.max(10,to.y-25)},0);
          }
        }else if(element==='ice'){
          if(kind==='field')node('field-v2787',{x:to.x,y:to.y+12});
          if(kind==='prison')node('cage-v2787',to,70);
          if(kind==='seal')node('seal',to,120);
          if(kind==='crystal')node('monolith-v2787',to,80);
          if(kind==='breath'){
            for(let i=0;i<count;i++)node('frost-v2787',{x:from.x+(to.x-from.x)*(i+1)/count,y:from.y+(to.y-from.y)*(i+1)/count},i*55);
          }else if(kind==='butterfly'){
            for(let i=0;i<count;i++)node('butterfly-v2787',offset(i),i*40,-30+i*15);
          }else if(kind==='burst')mote('shard',count);
          else for(let i=0;i<count;i++)node(kind==='frost'?'frost-v2787':'crystal-v2787',offset(i),i*35,-20+i*10);
        }else{
          if(kind==='slash')node('slash',to,60,-30);
          if(kind==='sun'){node('sun-v2787',to,60);node('ring',to,180);}
          if(kind==='field'||kind==='wall')node('field-v2787',{x:to.x,y:to.y+12},40);
          if(kind==='bind')node('bind-v2787',to,80);
          if(kind==='heart')node('seal',to,80);
          if(kind==='lotus')for(let i=0;i<count;i++)node('petal',to,i*30,-65+i*130/Math.max(1,count-1));
          else if(kind==='breath')for(let i=0;i<count;i++)node('flame-v2787',{x:from.x+(to.x-from.x)*(i+1)/count,y:from.y+(to.y-from.y)*(i+1)/count},i*50);
          else if(kind==='meteor')for(let i=0;i<count;i++)node('meteor-v2787',offset(i),i*45,-20);
          else if(kind==='triple')for(let i=0;i<3;i++){const f=node('flame-v2787',offset(i),i*80);f.style.color=['#ff7b55','#ffd878','#e4efff'][i]}
          else if(kind==='burst'){node('sun-v2787',to,30);mote('ember-v2787');}
          else for(let i=0;i<count;i++)node(kind==='pillar'||kind==='wall'?'pillar-v2787':'flame-v2787',offset(i),i*35);
        }
      }
      const run={root,timer:0};skillFxRunV2786=run;
      run.timer=setTimeout(()=>{root.remove();if(skillFxRunV2786===run)skillFxRunV2786=null},reduced?450:1150);
      return true;
    }

    function playSkillEffect(skillName, skillElement='', source='active') {
      if(window.playInkSkillV2854?.(skillName,skillElement,'player',source))return;
      const effectContainer=document.getElementById('skillEffect');
      if(!effectContainer) return;
      clearSkillFxV2786();
      effectContainer.replaceChildren();
      const arena=document.getElementById('combatArena');
      const skillInfo=(typeof SKILLS!=='undefined'?SKILLS.find(s=>s.name===skillName):null);
      const element=skillElement || skillInfo?.element || '';
      if(renderSkillFxV2786(skillName,element,effectContainer))return;
      const sourceX=30,targetX=70,targetY=47;
      const accent=skillAccentFor(element,skillName);
      addSkillBanner(effectContainer,skillName,accent);

      // ==================== 剑系 ====================
      if(skillName==='御剑术'){
        addCastRingV14(effectContainer,sourceX,52,'#b8f6ed');
        addWindStreaksV16(effectContainer,fxCount(5));
        const blade=makeFx(effectContainer,'fx-yujian-blade-v16');
        addImpactV14(effectContainer,targetX,targetY,'#c9fff6','normal',245);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'sword',x:targetX,y:targetY,count:fxCount(5),spreadX:56,spreadY:44,dur:400,size:5}),230);
        removeFxLater(blade,560);return;
      }

      if(skillName==='剑气纵横'){
        addCastRingV14(effectContainer,sourceX,52,'#b9efe6');
        addFanSwordSlashesV16(effectContainer,fxCount(6));
        addImpactV14(effectContainer,targetX,targetY,'#e8cf83','large',230);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'sword',x:targetX,y:targetY,count:fxCount(10),spreadX:130,spreadY:92,dur:520,size:7}),180);
        return;
      }

      if(skillName==='万剑归宗'){
        addElementOverlay(effectContainer,'sword');
        addCastRingV14(effectContainer,sourceX,52,'#d2f5ed');
        addWanJianV16(effectContainer,fxCount(22));
        for(let i=0;i<fxCount(12);i++){
          const blade=makeFx(effectContainer,'fx-sword-rain-v14',{left:`${54+Math.random()*32}%`,top:`${3+Math.random()*18}%`,animationDelay:`${210+Math.random()*190}ms`});
          blade.style.setProperty('--r',`${-25+Math.random()*15}deg`);
          blade.style.setProperty('--dx',`${15+Math.random()*32}px`);removeFxLater(blade,980);
        }
        addImpactV14(effectContainer,targetX,targetY,'#e8d08b','huge',410);
        setTimeout(()=>triggerArenaShake(arena,230,'soft'),410);
        return;
      }

      if(skillName==='天地一剑'){
        addElementOverlay(effectContainer,'sword');
        const cloud=makeFx(effectContainer,'fx-heaven-cloud-v16',{left:`${targetX}%`,top:'13%'});
        const sword=makeFx(effectContainer,'fx-heaven-gold-sword-v16',{left:`${targetX}%`});
        addCastRingV14(effectContainer,sourceX,52,'#d6b866');
        addImpactV14(effectContainer,targetX,targetY,'#ddb75c','huge',390);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'sword',x:targetX,y:targetY,count:fxCount(18),spreadX:180,spreadY:125,dur:650,size:9}),360);
        setTimeout(()=>triggerArenaShake(arena,340,'heavy'),380);
        removeFxLater(cloud,980);removeFxLater(sword,900);return;
      }

      // ==================== 雷系 ====================
      if(skillName==='雷法'){
        addCastRingV14(effectContainer,sourceX,52,'#9c8dff');
        addLightningPathV16(effectContainer);
        const rune=makeFx(effectContainer,'fx-thunder-rune-v16',{left:`${targetX}%`,top:'62%'});
        addImpactV14(effectContainer,targetX,targetY,'#b8d8ff','normal',170);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'thunder',x:targetX,y:targetY,count:fxCount(9),spreadX:82,spreadY:74,dur:440,size:6}),150);
        removeFxLater(rune,760);return;
      }
      if(skillName==='惊雷闪'){
        addCastRingV14(effectContainer,sourceX,52,'#a884ff');
        const bolt=makeFx(effectContainer,'fx-thunder-dart-v25');
        addImpactV14(effectContainer,targetX,targetY,'#b9a2ff','normal',160);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'thunder',x:targetX,y:targetY,count:fxCount(8),spreadX:55,spreadY:52,dur:430,size:5}),135);
        removeFxLater(bolt,560);return;
      }
      if(skillName==='裂地奔雷'){
        addElementOverlay(effectContainer,'thunder');
        const ground=makeFx(effectContainer,'fx-thunder-ground-v25',{left:`${targetX}%`,top:'68%'});
        for(let i=0;i<fxCount(5);i++){
          const col=makeFx(effectContainer,'fx-thunder-earth-column-v25',{left:`${52+i*7}%`,top:`${48+Math.abs(i-2)*3}%`,animationDelay:`${i*55}ms`});removeFxLater(col,760);
        }
        addImpactV14(effectContainer,targetX,targetY,'#8d8cff','large',260);setTimeout(()=>triggerArenaShake(arena,180,'soft'),260);removeFxLater(ground,880);return;
      }
      if(skillName==='紫霄落雷'){
        addElementOverlay(effectContainer,'thunder');
        const cloud=makeFx(effectContainer,'fx-zixiao-cloud-v25',{left:`${targetX}%`});
        const bolt=makeFx(effectContainer,'fx-zixiao-bolt-v25',{left:`${targetX}%`});
        const ring=makeFx(effectContainer,'fx-thunder-ground-v25',{left:`${targetX}%`,top:'68%'});
        addImpactV14(effectContainer,targetX,targetY,'#aa6dff','huge',240);setTimeout(()=>triggerArenaShake(arena,210,'soft'),230);
        removeFxLater(cloud,900);removeFxLater(bolt,720);removeFxLater(ring,900);return;
      }
      if(skillName==='万雷噬狱'){
        addElementOverlay(effectContainer,'thunder');
        const cage=makeFx(effectContainer,'fx-thunder-cage-v25',{left:`${targetX}%`,top:`${targetY}%`});
        for(let i=0;i<fxCount(12);i++){
          const bolt=makeFx(effectContainer,'fx-domain-bolt-v25',{left:`${38+Math.random()*48}%`,top:`${-4-Math.random()*12}%`,animationDelay:`${Math.random()*300}ms`});removeFxLater(bolt,1050);
        }
        const ground=makeFx(effectContainer,'fx-thunder-ground-v25',{left:`${targetX}%`,top:'70%',width:'170px',height:'70px'});
        addImpactV14(effectContainer,targetX,targetY,'#865dff','huge',310);setTimeout(()=>triggerArenaShake(arena,250,'soft'),300);
        removeFxLater(cage,1150);removeFxLater(ground,1200);return;
      }
      if(skillName==='九天神雷'){
        addElementOverlay(effectContainer,'thunder');
        const sky=makeFx(effectContainer,'fx-nine-sky-flash-v25');
        for(let i=0;i<fxCount(18);i++){
          const bolt=makeFx(effectContainer,'fx-nine-sky-bolt-v25',{left:`${10+Math.random()*80}%`,top:`${-10-Math.random()*15}%`,animationDelay:`${Math.random()*260}ms`});removeFxLater(bolt,1050);
        }
        addImpactV14(effectContainer,targetX,targetY,'#e2b8ff','huge',340);setTimeout(()=>triggerArenaShake(arena,360,'heavy'),300);
        removeFxLater(sky,1050);return;
      }
      if(skillName==='闪电链'){
        addCastRingV14(effectContainer,sourceX,52,'#72d7ff');
        addLightningPathV16(effectContainer);
        for(let i=0;i<fxCount(4);i++){
          const arc=makeFx(effectContainer,'fx-chain-arc-v25',{left:`${56+i*7}%`,top:`${34+(i%2)*18}%`,animationDelay:`${120+i*70}ms`});arc.style.setProperty('--rot',`${i%2?25:-28}deg`);removeFxLater(arc,850);
        }
        addImpactV14(effectContainer,targetX,targetY,'#70dfff','large',190);return;
      }
      if(skillName==='雷神附体' || skillName==='雷神附体·反噬'){
        const armor=makeFx(effectContainer,'fx-thunder-armor-v25',{left:`${skillName.includes('反噬')?targetX:sourceX}%`,top:`${skillName.includes('反噬')?targetY:52}%`});
        for(let i=0;i<fxCount(8);i++){
          const arc=makeFx(effectContainer,'fx-armor-arc-v25',{left:`${(skillName.includes('反噬')?targetX:sourceX)+(-6+Math.random()*12)}%`,top:`${36+Math.random()*28}%`,animationDelay:`${Math.random()*260}ms`});removeFxLater(arc,850);
        }
        addImpactV14(effectContainer,skillName.includes('反噬')?targetX:sourceX,skillName.includes('反噬')?targetY:52,'#a985ff','large',210);removeFxLater(armor,980);return;
      }
      if(skillName==='无音神雷'){
        const warp=makeFx(effectContainer,'fx-silent-warp-v25');
        const burst=makeFx(effectContainer,'fx-silent-burst-v25',{left:`${targetX}%`,top:`${targetY}%`});
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'thunder',x:targetX,y:targetY,count:fxCount(6),spreadX:45,spreadY:45,dur:360,size:4}),250);
        removeFxLater(warp,680);removeFxLater(burst,720);return;
      }

      // ==================== 冰系 ====================
      if(skillName==='寒冰掌'){
        addCastRingV14(effectContainer,sourceX,52,'#e8fbff');
        const palm=makeFx(effectContainer,'fx-frost-palm-v16');
        addImpactV14(effectContainer,targetX,targetY,'#c9f4ff','normal',280);
        setTimeout(()=>{
          const frost=makeFx(effectContainer,'fx-ice-seal-v14',{left:`${targetX}%`,top:`${targetY}%`,width:'78px',height:'78px'});removeFxLater(frost,580);
          spawnSkillParticles(effectContainer,{element:'ice',x:targetX,y:targetY,count:fxCount(7),spreadX:70,spreadY:58,dur:500,size:6});
        },260);
        removeFxLater(palm,650);return;
      }

      if(skillName==='冰封千里'){
        addElementOverlay(effectContainer,'ice');
        addCastRingV14(effectContainer,sourceX,52,'#bdefff');
        const wave=makeFx(effectContainer,'fx-frost-wave-v16');
        const prison=makeFx(effectContainer,'fx-ice-prison-v16',{left:`${targetX}%`,top:`${targetY}%`,animationDelay:'250ms'});
        for(let i=0;i<fxCount(9);i++){
          const shard=makeFx(effectContainer,'fx-ice-shard-v14',{left:`${42+Math.random()*36}%`,top:`${55+Math.random()*14}%`,animationDelay:`${80+Math.random()*190}ms`});
          shard.style.setProperty('--r',`${-55+Math.random()*110}deg`);removeFxLater(shard,900);
        }
        addImpactV14(effectContainer,targetX,targetY,'#b6eaff','large',390);
        removeFxLater(wave,930);removeFxLater(prison,1000);return;
      }

      if(skillName==='绝对零度'){
        addElementOverlay(effectContainer,'ice');
        const pillar=makeFx(effectContainer,'fx-zero-pillar-v16',{left:`${targetX}%`});
        const prison=makeFx(effectContainer,'fx-ice-prison-v16',{left:`${targetX}%`,top:`${targetY}%`,width:'132px',height:'154px',animationDelay:'180ms'});
        addIceShardsV14(effectContainer,targetX,targetY,fxCount(16));
        addImpactV14(effectContainer,targetX,targetY,'#e7fdff','huge',260);
        setTimeout(()=>triggerArenaShake(arena,220,'soft'),260);
        removeFxLater(pillar,860);removeFxLater(prison,980);return;
      }

      // ==================== 火系 ====================
      if(skillName==='烈焰斩'){
        addCastRingV14(effectContainer,sourceX,52,'#ff874a');
        const slash=makeFx(effectContainer,'fx-fire-slash-v16');
        addImpactV14(effectContainer,targetX,targetY,'#ff8d45','normal',280);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'fire',x:targetX,y:targetY,count:fxCount(8),spreadX:70,spreadY:64,dur:500,size:7}),250);
        removeFxLater(slash,650);return;
      }

      if(skillName==='焚天烈焰'){
        addElementOverlay(effectContainer,'fire');
        addCastRingV14(effectContainer,sourceX,52,'#ff8d43');
        const wave=makeFx(effectContainer,'fx-fire-wave-v16');
        for(let i=0;i<3;i++){
          const p=makeFx(effectContainer,'fx-flame-pillar-v14',{left:`${64+i*6}%`,animationDelay:`${260+i*70}ms`});removeFxLater(p,1100);
        }
        addImpactV14(effectContainer,targetX,targetY,'#ff9d4e','large',350);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'fire',x:targetX,y:targetY,count:fxCount(13),spreadX:120,spreadY:96,dur:650,size:8}),300);
        removeFxLater(wave,1100);return;
      }

      if(skillName==='天火焚世'){
        addElementOverlay(effectContainer,'fire');
        const scorch=makeFx(effectContainer,'fx-scorch-v16',{left:`${targetX}%`,top:'64%'});
        addFireRainV16(effectContainer,fxCount(18));
        addImpactV14(effectContainer,targetX,targetY,'#ffc04e','huge',450);
        setTimeout(()=>spawnSkillParticles(effectContainer,{element:'fire',x:targetX,y:targetY,count:fxCount(18),spreadX:160,spreadY:130,dur:700,size:9}),420);
        setTimeout(()=>triggerArenaShake(arena,300,'soft'),450);
        removeFxLater(scorch,1250);return;
      }

      // ==================== 治疗系 ====================
      if(skillName==='回春术'){
        addCastRingV14(effectContainer,sourceX,54,'#91efad');
        const aura=makeFx(effectContainer,'fx-heal-soft-v16',{left:`${sourceX}%`,top:'53%'});
        addHealMotesV14(effectContainer,sourceX,54,fxCount(11));
        addImpactV14(effectContainer,sourceX,54,'#aaf0ba','normal',100);
        removeFxLater(aura,980);return;
      }

      if(skillName==='生生不息'){
        addCastRingV14(effectContainer,sourceX,54,'#7ee69a');
        const aura=makeFx(effectContainer,'fx-heal-soft-v16',{left:`${sourceX}%`,top:'53%',width:'160px',height:'122px'});
        for(let i=0;i<3;i++){
          const vine=makeFx(effectContainer,'fx-vine-v16',{left:`${sourceX}%`,top:'53%',animationDelay:`${i*90}ms`});
          vine.style.setProperty('--r',`${i*120-30}deg`);removeFxLater(vine,1200);
        }
        addHealMotesV14(effectContainer,sourceX,54,fxCount(17));
        removeFxLater(aura,1120);return;
      }

      if(skillName==='起死回生'){
        addElementOverlay(effectContainer,'heal');
        const light=makeFx(effectContainer,'fx-sacred-light-v16',{left:`${sourceX}%`});
        const halo=makeFx(effectContainer,'fx-golden-halo-v16',{left:`${sourceX}%`,top:'55%'});
        const halo2=makeFx(effectContainer,'fx-golden-halo-v16',{left:`${sourceX}%`,top:'48%',width:'112px',height:'54px',animationDelay:'160ms'});
        addHealMotesV14(effectContainer,sourceX,54,fxCount(20));
        addImpactV14(effectContainer,sourceX,54,'#ffe59d','large',180);
        removeFxLater(light,1350);removeFxLater(halo,1300);removeFxLater(halo2,1300);return;
      }

      // 兜底：若未来增加技能，仍保留基础元素特效。
      addCastRingV14(effectContainer,sourceX,52,accent);
      addImpactV14(effectContainer,targetX,targetY,accent,'normal',120);
      spawnSkillParticles(effectContainer,{element:element || 'sword',x:targetX,y:targetY,count:fxCount(7),spreadX:80,spreadY:65,dur:500,size:7});
    }

    // Boss技能特效
    function playBossSkillEffect(skillName) {
      if(window.playInkSkillV2854?.(skillName,'','enemy','active'))return;
      const effectContainer=document.getElementById('skillEffect');
      if(!effectContainer) return;
      clearSkillFxV2786();
      effectContainer.replaceChildren();
      const arena=document.getElementById('combatArena');
      const sourceX=70,targetX=30,y=48;
      let accent='#ff8a8a';
      if(skillName.includes('幽冥')||skillName.includes('鬼')||skillName.includes('魂')) accent='#83f0d7';
      else if(skillName.includes('血')) accent='#e94b67';
      else if(skillName.includes('雷')||skillName.includes('天劫')) accent='#f3ed9f';
      else if(skillName.includes('剑')||skillName.includes('斩')) accent='#dfeaff';
      else if(skillName.includes('魔')) accent='#c38be8';
      addCastRingV14(effectContainer,sourceX,50,accent);

      if(skillName.includes('雷')||skillName.includes('天劫')){
        const bolt=makeFx(effectContainer,'fx-thunder-bolt-v14',{left:`${targetX}%`});
        const branch=makeFx(effectContainer,'fx-thunder-bolt-v14 branch',{left:`${targetX+5}%`,top:'7%'});
        addImpactV14(effectContainer,targetX,y,'#fff3a9',skillName.includes('灭世')?'huge':'large',80);
        spawnSkillParticles(effectContainer,{element:'thunder',x:targetX,y,count:fxCount(skillName.includes('灭世')?18:12),spreadX:110,spreadY:110,dur:560,size:9});
        setTimeout(()=>triggerArenaShake(arena,skillName.includes('灭世')?330:240,skillName.includes('灭世')?'heavy':'soft'),100);
        removeFxLater(bolt,560);removeFxLater(branch,560);return;
      }

      if(skillName.includes('剑')||skillName.includes('斩')){
        const count=skillName.includes('剑阵')?5:2;
        for(let i=0;i<count;i++){
          const trail=makeFx(effectContainer,'fx-sword-trail-v14',{left:'28%',top:`${42+i*4}%`,width:'43%',animationDelay:`${i*45}ms`});
          trail.style.setProperty('--fx',accent);trail.style.setProperty('--ang',`${155+i*6}deg`);removeFxLater(trail,700);
        }
        addImpactV14(effectContainer,targetX,y,accent,'large',120);
        setTimeout(()=>triggerArenaShake(arena,220,'soft'),120);return;
      }

      if(skillName.includes('血')){
        const link=makeFx(effectContainer,'fx-blood-link-v14',{left:'31%',top:'48%',width:'38%',transformOrigin:'right center'});
        addImpactV14(effectContainer,targetX,y,accent,skillName.includes('灭世')?'huge':'large',100);
        spawnSkillParticles(effectContainer,{element:'fire',x:targetX,y,count:fxCount(skillName.includes('灭世')?18:10),spreadX:105,spreadY:90,dur:620,size:8});
        if(skillName.includes('血海')||skillName.includes('灭世')) addElementOverlay(effectContainer,'fire');
        setTimeout(()=>triggerArenaShake(arena,skillName.includes('灭世')?320:210,skillName.includes('灭世')?'heavy':'soft'),110);
        removeFxLater(link,700);return;
      }

      if(skillName.includes('幽冥')||skillName.includes('鬼')||skillName.includes('魂')){
        const wave=makeFx(effectContainer,'fx-ghost-wave-v14',{left:`${targetX}%`,top:`${y}%`});
        spawnSkillParticles(effectContainer,{element:'heal',x:targetX,y,count:fxCount(12),spreadX:115,spreadY:95,dur:620,size:8});
        addImpactV14(effectContainer,targetX,y,accent,'large',130);
        setTimeout(()=>triggerArenaShake(arena,210,'soft'),120);
        removeFxLater(wave,820);return;
      }

      if(skillName.includes('魔')){
        const gate=makeFx(effectContainer,'fx-dark-gate-v14',{left:`${sourceX}%`,top:'47%'});
        addImpactV14(effectContainer,targetX,y,accent,skillName.includes('灭世')?'huge':'large',150);
        setTimeout(()=>triggerArenaShake(arena,skillName.includes('灭世')?340:240,skillName.includes('灭世')?'heavy':'soft'),140);
        removeFxLater(gate,900);return;
      }

      addImpactV14(effectContainer,targetX,y,accent,'large',100);
      setTimeout(()=>triggerArenaShake(arena,200,'soft'),100);
    }

    // 绘制角色函数
    const REALM_AURA_PRESETS = [
      { inner:'#ffffff', outer:'#ffffff', secondary:'#d9d9d9', rune:'#ffffff', emissive:'#ffffff', intensity:0.00 }, // 凡人
      { inner:'#b6ffcb', outer:'#5bd588', secondary:'#dffff0', rune:'#b6ffcb', emissive:'#74d49b', intensity:0.10 }, // 练气
      { inner:'#c7f1ff', outer:'#64befe', secondary:'#e8fbff', rune:'#b0e9ff', emissive:'#5ca7de', intensity:0.15 }, // 筑基
      { inner:'#fff6c8', outer:'#f0d46a', secondary:'#fffbe8', rune:'#fff0a8', emissive:'#d8bf62', intensity:0.20 }, // 筑基
      { inner:'#e0ccff', outer:'#9a7be8', secondary:'#efe5ff', rune:'#d7c8ff', emissive:'#8067c2', intensity:0.24 }, // 筑基
      { inner:'#ffd5e8', outer:'#e47aaa', secondary:'#ffeef5', rune:'#ffc0da', emissive:'#c96898', intensity:0.28 }, // 筑基
      { inner:'#fff0a8', outer:'#e6af32', secondary:'#ffe27b', rune:'#fff0b7', emissive:'#d1a132', intensity:0.34 }, // 金丹
      { inner:'#d9ffff', outer:'#4fd8cf', secondary:'#a6fff7', rune:'#e5ffff', emissive:'#48bfc1', intensity:0.38 }, // 元婴
      { inner:'#ffffff', outer:'#beddff', secondary:'#dff4ff', rune:'#ffffff', emissive:'#9fc8e8', intensity:0.43 }, // 化神
      { inner:'#ddcbff', outer:'#815ee8', secondary:'#c9b4ff', rune:'#eee6ff', emissive:'#7658c7', intensity:0.48 }, // 炼虚
      { inner:'#d9fff3', outer:'#55d9ba', secondary:'#fff0a4', rune:'#e9fff9', emissive:'#4db89f', intensity:0.53 }, // 合体
      { inner:'#c8d4ff', outer:'#4d57a8', secondary:'#e2e7ff', rune:'#bfcaff', emissive:'#414a8f', intensity:0.58 }, // 合体
      { inner:'#fff8d8', outer:'#f0d16d', secondary:'#ffffff', rune:'#fff4bd', emissive:'#d8bd62', intensity:0.64 }, // 大乘
      { inner:'#ffffff', outer:'#72baff', secondary:'#fff08b', rune:'#e9f5ff', emissive:'#62a9ed', intensity:0.72 }, // 渡劫
      { inner:'#fff7bd', outer:'#f7c84b', secondary:'#ffffff', rune:'#ffe784', emissive:'#e1b640', intensity:0.78 }, // 金仙
      { inner:'#d9f4ff', outer:'#70c8ff', secondary:'#d8ddff', rune:'#effaff', emissive:'#62b2e2', intensity:0.83 }, // 玄仙
      { inner:'#e8ddff', outer:'#a988ff', secondary:'#fff0ff', rune:'#efe5ff', emissive:'#9276df', intensity:0.88 }, // 太乙真仙
      { inner:'#fff5c7', outer:'#ffb94e', secondary:'#ffe7a0', rune:'#fff7d8', emissive:'#e4a33f', intensity:0.94 }, // 太乙金仙
      { inner:'#d9fff8', outer:'#56e0cb', secondary:'#d6eeff', rune:'#effffc', emissive:'#49c5b3', intensity:1.00 }, // 太乙玄仙
      { inner:'#ffffff', outer:'#c899ff', secondary:'#ffe3a1', rune:'#ffffff', emissive:'#a97ae0', intensity:1.08 }, // 大罗金仙
      { inner:'#fff8e8', outer:'#ff7fd8', secondary:'#b7d7ff', rune:'#fff2fc', emissive:'#d865b6', intensity:1.16 }, // 准圣
      { inner:'#ffffff', outer:'#fff2a6', secondary:'#cde9ff', rune:'#ffffff', emissive:'#fff0b0', intensity:1.28 }  // 圣人
    ];

    function hexToRgba(hex, alpha=1) {
      const value = (hex || '#ffffff').replace('#','');
      const full = value.length === 3 ? value.split('').map(ch => ch + ch).join('') : value.padEnd(6, 'f');
      const num = parseInt(full.slice(0,6), 16);
      const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function getRealmAuraPreset(level=0) {
      return REALM_AURA_PRESETS[Math.max(0, Math.min(level, REALM_AURA_PRESETS.length - 1))];
    }

    function drawRealmAura(ctx, cx, cy, size, level=0, options={}) {
      if (level <= 0) return;
      const preset = getRealmAuraPreset(level);
      const time = Date.now() * 0.0016;
      const pulse = 1 + Math.sin(time * 1.8) * 0.045;
      const alphaMul = options.alpha ?? 1;
      const compact = !!options.compact;
      const baseOuter = size * (compact ? 0.88 : 1.02) * pulse;
      const baseInner = size * (compact ? 0.56 : 0.66);

      ctx.save();
      const gradient = ctx.createRadialGradient(cx, cy - size * 0.18, size * 0.08, cx, cy, baseOuter);
      gradient.addColorStop(0, hexToRgba(preset.inner, 0.18 * alphaMul));
      gradient.addColorStop(0.55, hexToRgba(preset.outer, 0.11 * alphaMul));
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseOuter, baseOuter * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = hexToRgba(preset.outer, 0.26 * alphaMul);
      ctx.lineWidth = Math.max(1.2, size * 0.03);
      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.12, baseInner * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const moteCount = PERF_CONFIG?.lowEnd ? Math.min(5, 2 + level) : Math.min(10, 3 + level);
      for (let i = 0; i < moteCount; i++) {
        const ang = time * (0.65 + level * 0.08) + (Math.PI * 2 * i / moteCount);
        const radius = baseOuter * (0.58 + 0.12 * Math.sin(time * 1.15 + i));
        const px = cx + Math.cos(ang) * radius;
        const py = cy + Math.sin(ang) * radius * 0.7 - size * 0.08;
        ctx.save();
        ctx.globalAlpha = (0.32 + 0.18 * Math.sin(time * 2 + i)) * alphaMul;
        ctx.fillStyle = i % 2 ? preset.secondary : preset.inner;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.4, size * 0.036), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (level >= 2) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(preset.secondary, 0.36 * alphaMul);
        ctx.lineWidth = Math.max(1, size * 0.018);
        ctx.beginPath();
        ctx.ellipse(cx, cy + size * 0.06, baseOuter * 0.78, baseOuter * 0.24, time * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (level >= 3) {
        ctx.save();
        ctx.strokeStyle = hexToRgba('#ffd86d', 0.52 * alphaMul);
        ctx.lineWidth = Math.max(1.6, size * 0.03);
        ctx.beginPath();
        ctx.arc(cx, cy + size * 0.18, size * 0.3 + Math.sin(time * 1.7) * size * 0.03, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (level >= 4 && !(typeof PERF_CONFIG!=='undefined' && PERF_CONFIG.lowEnd)) {
        for (let k = 0; k < 2; k++) {
          ctx.save();
          ctx.strokeStyle = hexToRgba(preset.outer, (0.26 + k * 0.07) * alphaMul);
          ctx.lineWidth = Math.max(1.1, size * 0.016);
          ctx.beginPath();
          const start = time * (k ? -1.1 : 1.1) + k;
          ctx.ellipse(cx, cy - size * 0.02, baseOuter * (0.88 - k * 0.1), baseOuter * (0.37 - k * 0.04), 0, start, start + Math.PI * 1.3);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (level >= 5) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(preset.secondary, 0.44 * alphaMul);
        ctx.lineWidth = Math.max(1, size * 0.015);
        for (let i = 0; i < 3; i++) {
          const sway = Math.sin(time * 1.9 + i * 1.7) * size * 0.06;
          ctx.beginPath();
          ctx.moveTo(cx - size * 0.56 + i * size * 0.28, cy + size * 0.34);
          ctx.quadraticCurveTo(cx - size * 0.28 + i * size * 0.2 + sway, cy - size * 0.6, cx - size * 0.04 + i * size * 0.28, cy + size * 0.18);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (level >= 6) {
        ctx.save();
        ctx.strokeStyle = hexToRgba('#fff1c0', 0.75 * alphaMul);
        ctx.lineWidth = Math.max(1.4, size * 0.02);
        for (let i = 0; i < 3; i++) {
          const dir = i - 1;
          const x0 = cx + dir * size * 0.34;
          const y0 = cy - size * 0.52 + Math.sin(time * 2.6 + i) * size * 0.05;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + dir * size * 0.06, y0 + size * 0.16);
          ctx.lineTo(x0 - dir * size * 0.03, y0 + size * 0.27);
          ctx.lineTo(x0 + dir * size * 0.08, y0 + size * 0.42);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (level >= 7) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(preset.rune, 0.6 * alphaMul);
        ctx.lineWidth = Math.max(1.2, size * 0.017);
        for (let i = 0; i < 6; i++) {
          const ang = time * 0.7 + i * Math.PI / 3;
          const rx = cx + Math.cos(ang) * baseOuter * 0.92;
          const ry = cy + Math.sin(ang) * baseOuter * 0.42 - size * 0.02;
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(ang + time * 0.6);
          ctx.strokeRect(-size * 0.035, -size * 0.035, size * 0.07, size * 0.07);
          ctx.restore();
        }
        ctx.restore();
      }

      if (level >= 8) {
        ctx.save();
        ctx.strokeStyle = hexToRgba('#ffffff', 0.55 * alphaMul);
        ctx.lineWidth = Math.max(1.1, size * 0.014);
        ctx.beginPath();
        ctx.arc(cx, cy - size * 0.58, size * 0.2 + Math.sin(time * 1.6) * size * 0.015, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 5; i++) {
          const ang = -time * 0.85 + i * Math.PI * 0.4;
          const px = cx + Math.cos(ang) * baseOuter * 0.42;
          const py = cy - size * 0.7 + Math.sin(ang) * size * 0.08;
          ctx.save();
          ctx.fillStyle = hexToRgba('#fff8d8', 0.85 * alphaMul);
          ctx.beginPath();
          for (let p = 0; p < 4; p++) {
            const a = ang + p * Math.PI / 2;
            const r = p % 2 === 0 ? size * 0.045 : size * 0.02;
            const x = px + Math.cos(a) * r;
            const y = py + Math.sin(a) * r;
            if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }


      // 仙界境界：金仙以上出现更明显的仙轮、道纹与圣辉
      if (level >= 10) {
        const immortalRank = level - 9;
        ctx.save();
        ctx.strokeStyle = hexToRgba(preset.rune, Math.min(0.78, (0.34 + immortalRank * 0.045) * alphaMul));
        ctx.lineWidth = Math.max(1.3, size * 0.019);
        ctx.setLineDash([size * 0.08, size * 0.055]);
        ctx.beginPath();
        ctx.ellipse(cx, cy - size * 0.03, baseOuter * 1.03, baseOuter * 0.46, -time * 0.34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (level >= 12) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(preset.secondary, 0.48 * alphaMul);
        ctx.lineWidth = Math.max(1.2, size * 0.016);
        for (let i=0;i<3;i++) {
          const r = baseOuter * (0.52 + i * 0.13);
          ctx.beginPath();
          ctx.arc(cx, cy - size * 0.05, r, time * (0.22 + i*0.06) + i, time * (0.22 + i*0.06) + i + Math.PI * 1.15);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (level >= 15) {
        ctx.save();
        ctx.translate(cx, cy - size * 0.08);
        ctx.rotate(time * 0.13);
        ctx.strokeStyle = hexToRgba(preset.rune, 0.62 * alphaMul);
        ctx.lineWidth = Math.max(1.1, size * 0.014);
        const rr = baseOuter * 0.9;
        ctx.beginPath();
        for (let i=0;i<12;i++) {
          const a=i*Math.PI/6, r=i%2===0?rr:rr*0.82;
          const x=Math.cos(a)*r, y=Math.sin(a)*r*0.56;
          if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.closePath(); ctx.stroke(); ctx.restore();
      }

      if (level >= 16) {
        ctx.save();
        const holy = ctx.createRadialGradient(cx, cy-size*0.35, 0, cx, cy-size*0.12, baseOuter*1.25);
        holy.addColorStop(0, hexToRgba('#ffffff', 0.25*alphaMul));
        holy.addColorStop(0.4, hexToRgba(preset.outer, 0.12*alphaMul));
        holy.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle=holy; ctx.beginPath(); ctx.arc(cx,cy-size*0.1,baseOuter*1.25,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    }

    function apply3DAvatarRealmStyle(level=0) {
      if (!AVATAR3D.ready) return;
      const idx = Math.max(0, Math.min(getRealmVisualTier(level), REALM_AURA_PRESETS.length - 1));
      const phase = Math.max(0, Math.min(3, Number(player?.phase) || 0));
      const styleKey = `${idx}:${phase}`;
      if (AVATAR3D._realmStyleLevel === styleKey) return;
      AVATAR3D._realmStyleLevel = styleKey;
      const preset = REALM_AURA_PRESETS[idx];
      const robeMat = AVATAR3D.robe?.material;
      const jadeMat = AVATAR3D.jade?.material;
      if (robeMat) {
        const c = preset.outer.replace('#', '0x');
        if (robeMat.emissive && typeof robeMat.emissive.set === 'function') robeMat.emissive.set(Number(c));
        robeMat.emissiveIntensity = preset.intensity + phase * 0.045;
      }
      if (jadeMat) {
        const c = preset.inner.replace('#', '0x');
        if (jadeMat.emissive && typeof jadeMat.emissive.set === 'function') jadeMat.emissive.set(Number(c));
        jadeMat.emissiveIntensity = Math.max(0.12, preset.intensity + 0.08 + phase * 0.06);
      }
    }

    // V27.67：三个敌人立绘模块共享最近使用缓存，最多保留6张图片。
    // 淘汰时断开回调及资源引用；实际解码内存回收由浏览器决定。
    const ENEMY_IMAGE_CACHE_V2767 = (() => {
      const entries=new Map(), limit=6;
      function release(src) {
        const im=entries.get(src); if(!im)return;
        entries.delete(src); im.onload=null; im.onerror=null;
        im.removeAttribute('src');
      }
      return {
        get(src,onReady) {
          if(!src)return null;
          if(entries.has(src)) {
            const im=entries.get(src); entries.delete(src); entries.set(src,im);
            return im;
          }
          while(entries.size>=limit)release(entries.keys().next().value);
          const im=new Image(); im.decoding='async'; entries.set(src,im);
          im.onload=()=>{im.onload=null;im.onerror=null;if(entries.get(src)===im&&!document.hidden)onReady?.();};
          im.onerror=()=>{im.onload=null;im.onerror=null;};
          im.src=src;
          return im;
        },
        clear(){for(const src of Array.from(entries.keys()))release(src);},
        get size(){return entries.size;},
        limit
      };
    })();

    // ================== 男主固定立绘资源 ==================
    // 立绘使用同目录 WebP；避免 iPhone Safari 解析超大 Base64 页面。
    const PROTAGONIST_PORTRAIT_SRC = './v2762-asset-protagonist.webp?v=2765-observer-loop-fix-20260904';
    const PROTAGONIST_PORTRAIT_IMAGE = new Image();
    PROTAGONIST_PORTRAIT_IMAGE.decoding = 'async';
    let protagonistPortraitRequestedV2762 = false;
    function ensureProtagonistPortraitV2762() {
      if (!protagonistPortraitRequestedV2762) {
        protagonistPortraitRequestedV2762 = true;
        PROTAGONIST_PORTRAIT_IMAGE.src = PROTAGONIST_PORTRAIT_SRC;
      }
      return PROTAGONIST_PORTRAIT_IMAGE;
    }

    function drawProtagonistPortrait(canvas) {
      if (!canvas || !canvas.getContext) return false;
      const ctx=canvas.getContext('2d');
      const w=canvas.width||100, h=canvas.height||120;
      ctx.clearRect(0,0,w,h);
      ensureProtagonistPortraitV2762();
      if (!PROTAGONIST_PORTRAIT_IMAGE.complete || !PROTAGONIST_PORTRAIT_IMAGE.naturalWidth) {
        ctx.fillStyle='#6f7f7a'; ctx.font=`700 ${Math.max(11,Math.round(w*.1))}px Microsoft YaHei`;
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('男主立绘',w/2,h/2);
        return false;
      }
      const iw=PROTAGONIST_PORTRAIT_IMAGE.naturalWidth, ih=PROTAGONIST_PORTRAIT_IMAGE.naturalHeight;
      const scale=Math.min(w/iw,h/ih);
      const dw=iw*scale, dh=ih*scale;
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(PROTAGONIST_PORTRAIT_IMAGE,(w-dw)/2,(h-dh)/2,dw,dh);
      return true;
    }

    function refreshProtagonistPortraits() {
      ['startChar','panelAvatar','playerChar','combatPlayerChar'].forEach(id=>{
        const c=document.getElementById(id);
        const visible=id==='startChar'||!!(c&&c.offsetParent!==null&&!c.closest('.hidden'));
        if(c&&visible) drawProtagonistPortrait(c);
      });
      const storyImg=document.getElementById('storyProtagonistPortrait');
      if(storyImg && storyImg.src!==PROTAGONIST_PORTRAIT_SRC) storyImg.src=PROTAGONIST_PORTRAIT_SRC;
    }
    PROTAGONIST_PORTRAIT_IMAGE.addEventListener('load',refreshProtagonistPortraits);

    function drawCharacter(canvas, type, level, isEnemy = false) {
      if (!canvas) return;
      // 玩家相关立绘统一使用用户指定的男主原图；敌人仍使用原有程序绘制。
      if (!isEnemy && ['startChar','panelAvatar','playerChar','combatPlayerChar'].includes(canvas.id)) {
        drawProtagonistPortrait(canvas);
        return;
      }
      if (!isEnemy) level = getRealmVisualTier(level);
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      let hairColor, clothColor, skinColor, glowColor;
      
      if (isEnemy) {
        const enemyStyles = {
          '野狼': { hair: '#555', cloth: '#8B4513', skin: '#a0a0a0', glow: '#ff0000' },
          '山贼': { hair: '#2a2a2a', cloth: '#4a3728', skin: '#d4a574', glow: '#8b4513' },
          '妖兽': { hair: '#1a1a1a', cloth: '#2d1b4e', skin: '#9370DB', glow: '#9400D3' },
          '邪修': { hair: '#1a1a1a', cloth: '#2d0a0a', skin: '#e8e8e8', glow: '#8b0000' },
          '妖王': { hair: '#4a0080', cloth: '#1a0a2e', skin: '#DDA0DD', glow: '#FF00FF' },
          '魔修': { hair: '#0a0a0a', cloth: '#0a0a0a', skin: '#2a2a2a', glow: '#300' },
          '幽冥鬼': { hair: '#00ffff', cloth: '#1a3a3a', skin: '#a0ffff', glow: '#00ffff' },
          '鬼将': { hair: '#00ffaa', cloth: '#0a2a2a', skin: '#88ffcc', glow: '#00ffaa' },
          '鬼王': { hair: '#00ff88', cloth: '#0a1a2a', skin: '#66ffaa', glow: '#00ff88' },
          '宗门试炼守将': { hair: '#c0c0c0', cloth: '#4a6a8a', skin: '#f5d0c5', glow: '#4fc3f7' },
          '幽冥鬼王': { hair: '#00ff88', cloth: '#0a1a3a', skin: '#44ffaa', glow: '#00ffcc' },
          '血魔老祖': { hair: '#ff0000', cloth: '#1a0000', skin: '#aa0000', glow: '#ff0000' },
          '天劫': { hair: '#ffd700', cloth: '#ffffff', skin: '#ffff88', glow: '#ffd700' }
        };
        const style = enemyStyles[type] || enemyStyles['山贼'];
        hairColor = style.hair;
        clothColor = style.cloth;
        skinColor = style.skin;
        glowColor = style.glow;
      } else {
        const realmStyles = [
          { hair: '#2a2a2a', cloth: '#5a5a5a', skin: '#f5d0c5', glow: '#ffffff' },
          { hair: '#3a3a3a', cloth: '#4a6741', skin: '#f5d0c5', glow: '#90EE90' },
          { hair: '#4a4a6a', cloth: '#3a5a8a', skin: '#f5d0c5', glow: '#87CEEB' },
          { hair: '#6a5a2a', cloth: '#8a6a2a', skin: '#f5d0c5', glow: '#FFD700' },
          { hair: '#8a4a8a', cloth: '#5a2a5a', skin: '#f5e8e0', glow: '#DA70D6' },
          { hair: '#2a8a8a', cloth: '#1a5a5a', skin: '#f8f0e8', glow: '#00CED1' },
          { hair: '#aa3a3a', cloth: '#aa2a1a', skin: '#f8f0e8', glow: '#FF4500' },
          { hair: '#ffd700', cloth: '#ffffff', skin: '#fff8f0', glow: '#FFD700' },
          { hair: '#ffffff', cloth: '#ffffff', skin: '#ffffff', glow: '#ffffff' }
        ];
        const style = realmStyles[Math.min(level, realmStyles.length - 1)];
        hairColor = style.hair;
        clothColor = style.cloth;
        skinColor = style.skin;
        glowColor = style.glow;
      }
      
      if (isEnemy) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.1;
        const gradient = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.4, w*0.6);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(w/2, h*0.4, w*0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        drawRealmAura(ctx, w * 0.5, h * 0.5, Math.min(w, h) * 0.42, level, { compact:true, alpha:0.82 + Math.min(3, player?.phase || 0) * 0.12 });
      }
      
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.ellipse(w*0.5, h*0.18, w*0.18, h*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w*0.32, h*0.15, w*0.36, h*0.12);
      
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.ellipse(w*0.5, h*0.28, w*0.15, h*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(w*0.43, h*0.27, w*0.025, h*0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w*0.57, h*0.27, w*0.025, h*0.02, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = clothColor;
      ctx.beginPath();
      ctx.moveTo(w*0.35, h*0.38);
      ctx.lineTo(w*0.65, h*0.38);
      ctx.lineTo(w*0.72, h*0.85);
      ctx.lineTo(w*0.28, h*0.85);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w*0.5, h*0.38);
      ctx.lineTo(w*0.5, h*0.85);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(w*0.42, h*0.38);
      ctx.lineTo(w*0.5, h*0.5);
      ctx.lineTo(w*0.58, h*0.38);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();
      
      ctx.fillStyle = clothColor;
      ctx.beginPath();
      ctx.moveTo(w*0.35, h*0.4);
      ctx.lineTo(w*0.2, h*0.6);
      ctx.lineTo(w*0.25, h*0.62);
      ctx.lineTo(w*0.38, h*0.45);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(w*0.65, h*0.4);
      ctx.lineTo(w*0.8, h*0.6);
      ctx.lineTo(w*0.75, h*0.62);
      ctx.lineTo(w*0.62, h*0.45);
      ctx.closePath();
      ctx.fill();
      
      if (level >= 4 && !isEnemy) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        const time = Date.now() / 1000;
        ctx.beginPath();
        ctx.moveTo(w*0.2, h*0.5);
        ctx.quadraticCurveTo(w*0.15 + Math.sin(time)*5, h*0.6, w*0.1, h*0.75);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w*0.8, h*0.5);
        ctx.quadraticCurveTo(w*0.85 + Math.sin(time+1)*5, h*0.6, w*0.9, h*0.75);
        ctx.stroke();
      }
      
      if (level >= 1) {
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(w*0.75, h*0.35, w*0.04, h*0.5);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(w*0.74, h*0.32, w*0.06, h*0.06);
        
        if (level >= 3) {
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5 + Math.sin(Date.now()/200) * 0.3;
          ctx.beginPath();
          ctx.moveTo(w*0.77, h*0.35);
          ctx.lineTo(w*0.77, h*0.1);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    
    let animationFrame = null;
    let lastAnimationDraw = 0;
    const ANIMATION_FRAME_INTERVAL = 1000 / ((/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') || window.matchMedia?.('(pointer: coarse)').matches) ? 15 : 30); // 手机15FPS，动画演武本身仍由CSS与计时器驱动
    function startAnimation() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lastAnimationDraw = 0;
      function animate(timestamp = 0) {
        animationFrame=null;
        if(document.hidden)return;
        if (!document.hidden && timestamp - lastAnimationDraw >= ANIMATION_FRAME_INTERVAL) {
          lastAnimationDraw = timestamp;
          if (gameState === 'combat') {
            drawCharacter(document.getElementById('combatPlayerChar'), 'player', player.level, false);
            if (currentEnemy) {
              drawCharacter(document.getElementById('enemyChar'), currentEnemy.name, player.level, true);
            }
          } else if (!document.body.classList.contains('flat-world-active')) {
            // 世界模式已经由 Canvas + Three.js 绘制角色，不再后台重复刷新旧2D人物。
            drawCharacter(document.getElementById('playerChar'), 'player', player.level, false);
          }
        }
        animationFrame = requestAnimationFrame(animate);
      }
      animationFrame = requestAnimationFrame(animate);
    }
    
    // ================== 游戏数据定义 ==================
    
    const REALM_PHASES = ['初期', '中期', '后期', '圆满'];
    const CULTIVATION_REALMS = [
      { name:'凡人', phaseExp:[25,35,45,60], hpBonus:150, atkBonus:15, defBonus:7.5, powerRatio:0.05 },
      { name:'练气', phaseExp:[100,130,160,192], hpBonus:300, atkBonus:30, defBonus:15, powerRatio:0.1 },
      { name:'筑基', phaseExp:[200,250,320,384], hpBonus:600, atkBonus:60, defBonus:30, powerRatio:0.2 },
      { name:'金丹', phaseExp:[1750,2050,2400,2880], hpBonus:900, atkBonus:90, defBonus:45, powerRatio:0.3 },
      { name:'元婴', phaseExp:[2800,3250,3800,4560], hpBonus:1200, atkBonus:120, defBonus:60, powerRatio:0.4 },
      { name:'化神', phaseExp:[4500,5200,6100,7320], hpBonus:1500, atkBonus:150, defBonus:75, powerRatio:0.5 },
      { name:'炼虚', phaseExp:[7000,8200,9600,11520], hpBonus:1800, atkBonus:180, defBonus:90, powerRatio:0.6 },
      { name:'合体', phaseExp:[11000,13000,15500,18600], hpBonus:2100, atkBonus:210, defBonus:105, powerRatio:0.7 },
      { name:'大乘', phaseExp:[28000,33000,39000,46800], hpBonus:2400, atkBonus:240, defBonus:120, powerRatio:0.8 },
      { name:'渡劫', phaseExp:[45000,54000,65000,78000], hpBonus:2700, atkBonus:270, defBonus:135, powerRatio:0.9 },
      { name:'地仙', phaseExp:[85000,102000,122400,146880], hpBonus:3000, atkBonus:300, defBonus:150, powerRatio:1 },
      { name:'天仙', phaseExp:[155000,186000,223200,267840], hpBonus:6000, atkBonus:600, defBonus:300, powerRatio:2 },
      { name:'金仙', phaseExp:[280000,336000,403200,483840], hpBonus:9000, atkBonus:900, defBonus:450, powerRatio:3 },
      { name:'太乙金仙', phaseExp:[510000,612000,734400,881280], hpBonus:12000, atkBonus:1200, defBonus:600, powerRatio:4 },
      { name:'大罗金仙', phaseExp:[1700000,2040000,2448000,2937600], hpBonus:13500, atkBonus:1350, defBonus:675, powerRatio:4.5 },
      { name:'准圣', phaseExp:[3100000,3720000,4464000,5356800], hpBonus:15000, atkBonus:1500, defBonus:750, powerRatio:5 },
      { name:'圣人', phaseExp:[5650000,6780000,8136000,9763200], hpBonus:30000, atkBonus:3000, defBonus:1500, powerRatio:10 }
    ];
    const COMPAT_REALMS_V2794=[{ name:'凡人', phaseExp:[25,35,45,60], hpBonus:0, atkBonus:0, defBonus:0 },{ name:'练气', phaseExp:[100,130,160,192], hpBonus:20, atkBonus:5, defBonus:3 },{ name:'筑基', phaseExp:[200,250,320,384], hpBonus:45, atkBonus:9, defBonus:5 },{ name:'金丹', phaseExp:[1750,2050,2400,2880], hpBonus:230, atkBonus:38, defBonus:20 },{ name:'元婴', phaseExp:[2800,3250,3800,4560], hpBonus:320, atkBonus:50, defBonus:26 },{ name:'化神', phaseExp:[4500,5200,6100,7320], hpBonus:430, atkBonus:65, defBonus:33 },{ name:'炼虚', phaseExp:[7000,8200,9600,11520], hpBonus:570, atkBonus:83, defBonus:41 },{ name:'合体', phaseExp:[11000,13000,15500,18600], hpBonus:750, atkBonus:104, defBonus:50 },{ name:'大乘', phaseExp:[28000,33000,39000,46800], hpBonus:1280, atkBonus:155, defBonus:72 },{ name:'渡劫', phaseExp:[45000,54000,65000,78000], hpBonus:1680, atkBonus:190, defBonus:88 },{ name:'金仙', phaseExp:[85000,102000,122000,146400], hpBonus:2200, atkBonus:235, defBonus:108 },{ name:'玄仙', phaseExp:[155000,185000,220000,264000], hpBonus:2900, atkBonus:290, defBonus:132 },{ name:'太乙真仙', phaseExp:[280000,335000,400000,480000], hpBonus:3800, atkBonus:360, defBonus:162 },{ name:'太乙金仙', phaseExp:[510000,610000,730000,876000], hpBonus:5000, atkBonus:445, defBonus:198 },{ name:'太乙玄仙', phaseExp:[930000,1110000,1330000,1596000], hpBonus:6600, atkBonus:550, defBonus:242 },{ name:'大罗金仙', phaseExp:[1700000,2040000,2450000,2940000], hpBonus:8700, atkBonus:680, defBonus:296 },{ name:'准圣（大罗金仙）', phaseExp:[3100000,3720000,4460000,5352000], hpBonus:11500, atkBonus:840, defBonus:362 },{ name:'圣人（混元大罗金仙）', phaseExp:[5650000,6780000,8140000,9768000], hpBonus:15200, atkBonus:1040, defBonus:445 }];



    // ================== 深度角色面板 / 寿元 / 状态 ==================
    const STATUS_TEMPLATES = {
      '固元': { id:'guyuan', name:'固元', icon:'🛡️', type:'buff', desc:'防御力 +10%' },
      '经脉暗伤': { id:'jingmai', name:'经脉暗伤', icon:'💔', type:'debuff', desc:'灵力恢复 -20%，突破评估 -10%' },
      '心魔种子': { id:'xinmo', name:'心魔种子', icon:'🌑', type:'debuff', desc:'突破评估 -20%，心魔劫风险显著提高' },
      '剑气贯体': { id:'jianqi', name:'剑气贯体', icon:'⚔️', type:'buff', desc:'剑系技能伤害 +15%' },
      '灵脉通透': { id:'lingmai', name:'灵脉通透', icon:'💠', type:'buff', desc:'灵力恢复速度 +30%' }
    };


    const OLD_REALMS_V2793=[{ name:'凡人', phaseExp:[100], hpBonus:0, atkBonus:0, defBonus:0 },{ name:'练气', phaseExp:[100,130,160], hpBonus:20, atkBonus:5, defBonus:3 },{ name:'筑基', phaseExp:[200,250,320], hpBonus:45, atkBonus:9, defBonus:5 },{ name:'开光', phaseExp:[380,460,560], hpBonus:75, atkBonus:14, defBonus:8 },{ name:'融合', phaseExp:[650,780,920], hpBonus:115, atkBonus:20, defBonus:11 },{ name:'心动', phaseExp:[1050,1250,1500], hpBonus:165, atkBonus:28, defBonus:15 },{ name:'金丹', phaseExp:[1750,2050,2400], hpBonus:230, atkBonus:38, defBonus:20 },{ name:'元婴', phaseExp:[2800,3250,3800], hpBonus:320, atkBonus:50, defBonus:26 },{ name:'出窍', phaseExp:[4500,5200,6100], hpBonus:430, atkBonus:65, defBonus:33 },{ name:'分神', phaseExp:[7000,8200,9600], hpBonus:570, atkBonus:83, defBonus:41 },{ name:'合体', phaseExp:[11000,13000,15500], hpBonus:750, atkBonus:104, defBonus:50 },{ name:'洞虚', phaseExp:[17500,20500,24000], hpBonus:980, atkBonus:128, defBonus:60 },{ name:'大乘', phaseExp:[28000,33000,39000], hpBonus:1280, atkBonus:155, defBonus:72 },{ name:'渡劫', phaseExp:[45000,54000,65000], hpBonus:1680, atkBonus:190, defBonus:88 },{ name:'金仙', phaseExp:[85000,102000,122000], hpBonus:2200, atkBonus:235, defBonus:108 },{ name:'玄仙', phaseExp:[155000,185000,220000], hpBonus:2900, atkBonus:290, defBonus:132 },{ name:'太乙真仙', phaseExp:[280000,335000,400000], hpBonus:3800, atkBonus:360, defBonus:162 },{ name:'太乙金仙', phaseExp:[510000,610000,730000], hpBonus:5000, atkBonus:445, defBonus:198 },{ name:'太乙玄仙', phaseExp:[930000,1110000,1330000], hpBonus:6600, atkBonus:550, defBonus:242 },{ name:'大罗金仙', phaseExp:[1700000,2040000,2450000], hpBonus:8700, atkBonus:680, defBonus:296 },{ name:'准圣（大罗金仙）', phaseExp:[3100000,3720000,4460000], hpBonus:11500, atkBonus:840, defBonus:362 },{ name:'圣人（混元大罗金仙）', phaseExp:[5650000,6780000,8140000], hpBonus:15200, atkBonus:1040, defBonus:445 }];
    const REALM_MAP_V2793=[0, 1, 2, 2, 2, 2, 3, 4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    function remapRealmV2793(n){return REALM_MAP_V2793[Math.max(0,Math.min(21,Math.floor(Number(n)||0)))]||0;}
    function migrateCultivationV2793(p,saved){
      if(Number(saved.realmSchemaVersion||0)>=3){p.level=Math.max(0,Math.min(17,Math.floor(Number(p.level)||0)));p.phase=Math.max(0,Math.min(3,Math.floor(Number(p.phase)||0)));p.realmSchemaVersion=3;return;}
      let lv=Math.max(0,Math.min(21,Math.floor(Number(saved.level)||0))),ph=Math.max(0,Math.min(2,Math.floor(Number(saved.phase)||0)));
      if(Number(saved.realmSchemaVersion||0)<2){const legacy=[0,1,2,6,7,9,13,12,13];ph=lv===8?2:0;lv=legacy[Math.min(8,lv)];}
      const old=OLD_REALMS_V2793[lv],level=remapRealmV2793(lv),phase=[3,4,5,11].includes(lv)?3:ph,newRealm=COMPAT_REALMS_V2794[level];
      const oldNeed=old.phaseExp[lv===0?0:ph],newNeed=newRealm.phaseExp[phase];
      p.exp=Math.floor(Math.max(0,Number(p.exp)||0)/oldNeed*newNeed);
      // Preserve already-earned realm stats when collapsed levels map into a lower base.
      const oldScale=lv?1+ph*.12:1,newScale=level?1+phase*.12:1;
      for(const [key,bonus] of [['baseAtk','atkBonus'],['baseDef','defBonus'],['maxHp','hpBonus']])p[key]=(Number(p[key])||0)+Math.max(0,Math.floor(old[bonus]*oldScale)-Math.floor(newRealm[bonus]*newScale));
      p.maxMp=(Number(p.maxMp)||0)+Math.max(0,lv*12+ph*4-level*12-phase*4);
      const oldLives=[80, 120, 200, 300, 450, 600, 800, 1500, 2500, 4000, 6000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 99999999];
      p.realmLifeCreditV2793=Math.max(0,Number(p.realmLifeCreditV2793)||0)+Math.max(0,oldLives[lv]-[80,120,200,800,1500,2500,4000,6000,20000,50000,100000,200000,500000,1000000,2000000,5000000,10000000,99999999][level]);
      p.petRealmFloorV2793=Math.max(lv,Number(p.petRealmFloorV2793)||0);
      p.level=level;p.phase=phase;p.realmSchemaVersion=3;
      // Rebind saved task requirements and enemies without altering pet/building levels.
      function visit(o){if(!o||typeof o!=='object')return;for(const k of Object.keys(o)){if(['_realmLevel','targetRealm','unlockRealm','realmRequired','minRealm'].includes(k)&&typeof o[k]==='number')o[k]=remapRealmV2793(o[k]);else if(k!=='skills')visit(o[k]);}}
      visit(p.tasks);visit(p.sectTournament);visit(p.sectData?.miniRealmV2778);
      if(p.sectTournament?.active?.snapshot?.level!==undefined)p.sectTournament.active.snapshot.level=remapRealmV2793(p.sectTournament.active.snapshot.level);
    }
    const IMMORTAL_MAP_V2794=[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 12, 13, 13, 14, 14, 15, 16];
    function migrateImmortalV2794(p,saved){
      if(Number(saved.realmSchemaVersion||0)>=4){p.level=Math.max(0,Math.min(16,Math.floor(Number(p.level)||0)));p.realmSchemaVersion=4;return;}
      const oldLevel=p.level,level=IMMORTAL_MAP_V2794[oldLevel]??0;
      const oldNeed=COMPAT_REALMS_V2794[oldLevel].phaseExp[p.phase],need=CULTIVATION_REALMS[level].phaseExp[p.phase];
      p.exp=Math.floor(Math.max(0,Number(p.exp)||0)/oldNeed*need);p.level=level;p.realmSchemaVersion=4;
      const map=n=>IMMORTAL_MAP_V2794[Math.max(0,Math.min(17,Number(n)||0))]??0;
      function visit(o){if(!o||typeof o!=='object')return;for(const k of Object.keys(o)){if(['_realmLevel','targetRealm','unlockRealm','realmRequired','minRealm'].includes(k)&&typeof o[k]==='number')o[k]=map(o[k]);else visit(o[k]);}}
      visit(p.tasks);visit(p.sectTournament);visit(p.sectData?.miniRealmV2778);
      if(p.sectTournament?.active?.snapshot?.level!==undefined)p.sectTournament.active.snapshot.level=map(p.sectTournament.active.snapshot.level);
    }
    function getRealmStageMultiplierV2794(level,phase){return 1+Math.max(0,Math.min(3,Number(phase)||0))*.02;}
    function getPowerRatioLabelV2794(){const r=CULTIVATION_REALMS[player.level];return r?.powerRatio?` · 基础系数${r.powerRatio}${player.level===15?'（半步圣人）':''}`:'';}

    function calculateMaxLifespan(level=player?.level || 0) {
      const map=[80,120,200,800,1500,2500,4000,6000,20000,50000,100000,200000,500000,1000000,5000000,10000000,99999999];
      return map[Math.max(0,Math.min(map.length-1,Number(level)||0))] || 80;
    }

    // V27.67：延寿次数是唯一存档来源；加成由次数计算，避免读档重复叠加。
    const LONGEVITY_PILLS = {
      '养元丹': {years:10, limit:5, cost:300, level:0},
      '延寿丹': {years:50, limit:3, cost:1800, level:2},
      '万寿丹': {years:200, limit:2, cost:8000, level:3}
    };
    function normalizeLongevity(raw={}) {
      const uses={};
      for(const [name,d] of Object.entries(LONGEVITY_PILLS)) {
        const n=Number(raw?.uses?.[name]);
        uses[name]=Number.isFinite(n)?Math.max(0,Math.min(d.limit,Math.floor(n))):0;
      }
      return {uses};
    }
    function getLongevityBonus(p=player) {
      const state=normalizeLongevity(p?.longevity);
      return Object.entries(LONGEVITY_PILLS).reduce((sum,[name,d])=>sum+state.uses[name]*d.years,0);
    }
    function getTotalMaxLifespan(p=player) {
      return calculateMaxLifespan(p?.level||0)+getLongevityBonus(p)+Math.max(0,Number(p?.realmLifeCreditV2793)||0);
    }
    function useLongevityPill(name) {
      const d=LONGEVITY_PILLS[name];
      if(!d || !player || gameState==='combat')return showFloatingText?.('请在战斗结束后服用延寿丹药','#ffd76a');
      if(!player.inventory.includes(name))return showFloatingText?.('储物袋中没有这枚丹药','#ffd76a');
      const state=normalizeLongevity(player.longevity);
      if(player.level<d.level)return showFloatingText?.(`需达到${CULTIVATION_REALMS[d.level].name}境界才能服用`,'#ffd76a');
      if(state.uses[name]>=d.limit)return showFloatingText?.(`${name}已达终身服用上限，丹药未消耗`,'#ffd76a');
      removeItem(name);
      state.uses[name]++;
      player.longevity=state;
      player.maxLifespan=getTotalMaxLifespan();
      updateStats(); updateCharacterPanelDeep(); autoSave();
      showFloatingText?.(`服用${name}：寿元上限 +${d.years}年，剩余${getRemainingLifespan().remaining}年`,'#69f0ae');
      renderMobileInventory();
      if(document.getElementById('longevityOverlay'))showLongevityPanel();
    }
    function buyLongevityPill(name) {
      const d=LONGEVITY_PILLS[name];
      if(!d || !player || gameState==='combat')return;
      if(player.level<d.level)return showFloatingText?.(`需达到${CULTIVATION_REALMS[d.level].name}境界`,'#ffd76a');
      const used=normalizeLongevity(player.longevity).uses[name];
      const owned=player.inventory.filter(n=>n===name).length;
      if(used+owned>=d.limit)return showFloatingText?.('已服用与库存已足够达到终身上限，无需再买','#ffd76a');
      if(player.gold<d.cost)return showFloatingText?.('灵石不足','#ffd76a');
      player.gold-=d.cost; player.inventory.push(name);
      updateStats(); autoSave(); showRarePillShop();
      showFloatingText?.(`已购买${name}，请在储物袋中服用`,'#69f0ae');
    }
    function showLongevityPanel() {
      if(!player || gameState==='combat')return;
      document.getElementById('longevityOverlay')?.remove();
      const life=getRemainingLifespan(), state=normalizeLongevity(player.longevity);
      const overlay=document.createElement('div');
      overlay.id='longevityOverlay'; overlay.className='mobile-inventory-overlay';
      overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)overlay.remove();});
      overlay.innerHTML=`<div class="mobile-inventory-card" style="overflow-y:auto;max-height:85vh;padding:20px">
        <button class="choice-btn" onclick="document.getElementById('longevityOverlay').remove()">关闭</button>
        <h3>⏳ 寿元与延寿</h3><p>剩余 <b>${life.remaining}</b> 年 / 上限 ${life.max} 年 · 年龄 ${player.age} 岁</p>
        <p>境界寿元 ${calculateMaxLifespan(player.level)} 年 + 丹药延寿 ${getLongevityBonus()} 年。</p>
        <p>突破大境界或服用延寿丹药可提高上限。游戏内每过一年，年龄增加一岁。延寿不会让年龄倒退。</p>
        ${life.remaining<=Math.max(10,life.max*.05)?'<p style="color:#ff8a80">寿元告急：请尽快突破或服丹。本版寿尽保留补救机会，不清档、不强制死亡。</p>':''}
        ${Object.entries(LONGEVITY_PILLS).map(([name,d])=>`<p><b>${name}</b>：每枚 +${d.years}年，终身 ${state.uses[name]}/${d.limit} 枚；需${CULTIVATION_REALMS[d.level].name}。库存 ${player.inventory.filter(n=>n===name).length} 枚。</p><button class="choice-btn" onclick="useLongevityPill('${name}')" ${!player.inventory.includes(name)||state.uses[name]>=d.limit||player.level<d.level?'disabled':''}>服用${name}</button>`).join('')}
        <p>获取：南域 → 仙市 → 稀有丹药；或炼丹房按丹方炼制。三种丹药合计最多延寿600年，突破与读档不重置服用次数。</p>
        </div>`;
      document.body.appendChild(overlay);
    }

    function hasStatusEffect(id) { return !!player?.statusEffects?.some(e=>e?.id===id); }

    function addStatusEffect(effect) {
      if(!player || !effect?.id)return;
      if(!Array.isArray(player.statusEffects))player.statusEffects=[];
      const incoming={...effect};
      const existing=player.statusEffects.find(e=>e.id===incoming.id);
      if(existing){Object.assign(existing,incoming);if(incoming.remainingDays!=null)existing.remainingDays=Math.max(0,Number(incoming.remainingDays)||0);}
      else player.statusEffects.push(incoming);
      updateCharacterPanelDeep?.(); autoSave?.();
    }

    function removeStatusEffect(id) {
      if(!player || !Array.isArray(player.statusEffects))return;
      player.statusEffects=player.statusEffects.filter(e=>e?.id!==id);
      updateCharacterPanelDeep?.();
    }

    function getRemainingLifespan() {
      const max=getTotalMaxLifespan();
      const age=Math.max(0,Number(player?.age)||18);
      return {max,remaining:Math.max(0,max-age)};
    }

    let lastLifespanCrisisYear=-1;
    function triggerLifespanCrisis() {
      const year=getGameDate?.().year || 1;
      if(lastLifespanCrisisYear===year)return;
      lastLifespanCrisisYear=year;
      showFloatingText?.('⚠️ 寿元告急：突破大境界，或到仙市购买延寿丹药；点击角色面板【延寿说明】查看','#ff6b6b');
    }

    function getDisplayTitles() {
      const titles=[];
      if(player?.mainTitle)titles.push({name:player.mainTitle,type:'main',icon:'🏅'});
      if(player?.hiddenTitle)titles.push({name:player.hiddenTitle,type:'hidden',icon:'🔮'});
      if(player?.infamousTitle)titles.push({name:player.infamousTitle,type:'infamous',icon:'☠️'});
      return titles;
    }
    function unlockHiddenTitle(title){if(!player.hiddenTitle){player.hiddenTitle=String(title||'');showFloatingText?.(`🔮 解锁隐藏称号：${player.hiddenTitle}`,'#b388ff');autoSave?.();}}
    function addInfamousTitle(title){player.infamousTitle=String(title||'');showFloatingText?.(`☠️ 获得恶名：${player.infamousTitle}`,'#ff6b6b');autoSave?.();}
    function setMainTitle(title){player.mainTitle=String(title||'寻道者');updateCharacterPanelDeep?.();autoSave?.();}

    const BREAKTHROUGH_PILLS_V28683={
      '破障丹':{bonus:.15,cost:300,level:2},
      '渡劫丹':{bonus:.20,cost:500,level:5},
      '九转金丹':{bonus:.30,cost:900,level:9}
    };
    function breakthroughProtectionV28683(){
      const key=`${player.level}:${player.phase||0}`,old=player.breakthrough?.protectionV28683;
      return {key,failures:old?.key===key?Math.min(5,Math.max(0,Math.floor(Number(old.failures)||0))):0};
    }
    function selectedBreakthroughPillV28683(){
      if(breakthroughProtectionV28683().failures>=5)return null;
      const name=player.breakthrough?.pillV28683,d=BREAKTHROUGH_PILLS_V28683[name];
      return d&&player.level>=d.level&&player.inventory?.includes(name)?name:null;
    }
    function selectBreakthroughPillV28683(name){
      if(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating)return;
      if(name&&(!BREAKTHROUGH_PILLS_V28683[name]||player.level<BREAKTHROUGH_PILLS_V28683[name].level||!player.inventory.includes(name)))return;
      player.breakthrough ||= {};player.breakthrough.pillV28683=name||null;
      autoSave();showRetreatBreakthroughV2798();
    }
    function buyBreakthroughPillV28683(name){
      const d=BREAKTHROUGH_PILLS_V28683[name];
      if(!d||gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating||player.level<d.level||player.gold<d.cost)return;
      player.gold-=d.cost;player.inventory.push(name);autoSave();updateStats();showRarePillShop();
    }
    function breakthroughDetailsV28683(){
      const d=calculateBreakthroughSuccess();
      return `<p>本次成功率：${Math.round(d.rate*100)}% · 当前瓶颈已失败 ${d.failures} 次${d.guaranteed?' · 本次保底成功':''}<br>基础 ${Math.round(d.base*100)}% · 丹药 +${Math.round(d.pillBonus*100)}% · 宗门 +${Math.round(d.sectBonus*100)}% · 状态/心结 -${Math.round(d.statusPenalty*100)}%<br>常规概率限制在5%—95%，再加失败保护 +${Math.round(d.pityBonus*100)} 个百分点；连续失败5次后下一次必成。成功后清零，读档保留。</p><p>本次丹药：${d.pillName||'不使用'}。开始尝试时消耗一颗，成功或失败均消耗；预览不消耗，不叠加多种丹药；保底时不消耗丹药。<br>失败损失 ${Math.floor(getCurrentExpNeed()*.15)} 修为，气血变为上限60%、灵力变为上限50%，调息30—49个游戏日。飞升天劫不适用此保底。</p>`;
    }
    function battleGoldV28683(enemy){
      const base=Math.max(0,Number(enemy?.gold)||0);
      if(!base||enemy._isTutorial||enemy._isTaskBattle||enemy._taskId||enemy._warV2839||enemy.tournamentFight||isBossFight||isTribulation)return base;
      const lv=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(enemy._realmLevel)||0));
      if(lv<2)return base;
      // Early elites consume healing before higher-realm skill/gear sustain exists.
      // Only this tier receives the additional gold floor; scripted fights stay excluded.
      if(lv===2&&enemy._isElite)return Math.max(base,280);
      return Math.max(base,Math.floor(Math.min(400,40*(lv+1))*(enemy._isElite?1.5:1)));
    }
    function battleExpV28683(enemy){
      const base=Math.max(0,Number(enemy?.exp)||0);
      if(!base||enemy._isTutorial||enemy._isTaskBattle||enemy._taskId||enemy._warV2839||enemy.tournamentFight||isBossFight||isTribulation)return base;
      const lv=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(enemy._realmLevel)||0));
      if(lv<3)return base;
      const phase=Math.max(0,Math.min(3,Number(enemy._realmPhase)||0));
      const floor=Math.floor(Math.min(getCurrentExpNeed(lv,phase)*(enemy._isElite?.03:.02),getCurrentExpNeed()*.04));
      return Math.max(base,floor);
    }

    function calculateBreakthroughSuccess() {
      const level=Math.max(0,Number(player?.level)||0), phase=Math.max(0,Number(player?.phase)||0);
      const baseRates=[.95,.85,.75,.55,.45,.35,.30,.25,.18,.10];
      let base=baseRates[Math.min(level,baseRates.length-1)] ?? .10;
      if(phase<3)base+=.20;
      const pillName=selectedBreakthroughPillV28683(),pillBonus=pillName?BREAKTHROUGH_PILLS_V28683[pillName].bonus:0;
      const sectLevel=Math.max(1,Number(player.sectData?.level)||1);
      const sectBonus=(sectLevel-1)*.02;
      let statusPenalty=0;
      if(hasStatusEffect('jingmai'))statusPenalty+=.10;
      if(hasStatusEffect('xinmo'))statusPenalty+=.20;
      // 未解除的心结扣减实际成功率；结算与预览共用本函数。
      const romanceHeartPenalty=getHeartDemonBreakthroughPenalty();
      statusPenalty+=romanceHeartPenalty;
      const heartDemonRisk=level>=3?Math.min(.75,.10+(level-3)*.03+(player.heartDemon?.broken?0:.08)):0;
      const {failures}=breakthroughProtectionV28683(),guaranteed=failures>=5&&!isFinalTribulationGate(),pityBonus=isFinalTribulationGate()?0:failures*.15;
      const rate=guaranteed?1:Math.min(.95,Math.max(.05,Math.min(.95,base+pillBonus+sectBonus-statusPenalty))+pityBonus);
      return {rate,base,failures,guaranteed,pityBonus,pillName,heartDemonRisk,hasHeartDemon:hasStatusEffect('xinmo'),pillBonus,sectBonus,statusPenalty};
    }

    function isAtRealmBottleneck() { return (Number(player?.exp)||0) >= getCurrentExpNeed(); }

    function getNextCultivationName() {
      const lv=Math.max(0,Number(player?.level)||0), ph=Math.max(0,Number(player?.phase)||0);
      if(lv===CULTIVATION_REALMS.length-1 && ph>=3)return '道途圆满';

      if(ph<3)return `${CULTIVATION_REALMS[lv].name}${REALM_PHASES[ph+1]}`;
      return `${CULTIVATION_REALMS[Math.min(CULTIVATION_REALMS.length-1,lv+1)].name}${REALM_PHASES[0]}`;
    }

    function getBreakthroughStatus() {
      const bt=player?.breakthrough||{};
      const details=calculateBreakthroughSuccess();
      const protection=details.guaranteed?' · 本次保底':details.failures?` · 失败保护${details.failures}次`:'';
      if(bt.isAnimating) return {text:'灵机涌动 · 正在突破',rate:Math.round(details.rate*100),rateText:'突破中',hasHeartDemon:details.hasHeartDemon,details};
      if(Number(bt.cooldownDays)>0) return {text:`经脉调息 · 还需${Math.ceil(bt.cooldownDays)}天`,rate:Math.round(details.rate*100),rateText:'冷却中',hasHeartDemon:details.hasHeartDemon,details};
      if((player?.level||0)===9 && (player?.phase||0)>=3) return {text:'飞升瓶颈 · 需渡飞升天劫',rate:0,rateText:'天劫',hasHeartDemon:details.hasHeartDemon,details};
      return {text:`${getNextCultivationName()}${protection}`,rate:Math.round(details.rate*100),rateText:`${Math.round(details.rate*100)}%`,hasHeartDemon:details.hasHeartDemon,details};
    }

    function processCharacterTime(days) {
      if(!player)return;
      const elapsed=Math.max(0,Math.floor(Number(days)||0));
      const calculatedAge=18+Math.floor((player.worldTime?.totalDays||0)/GAME_DAYS_PER_YEAR);
      player.age=Math.max(18,calculatedAge);
      player.maxLifespan=getTotalMaxLifespan();
      if(player.maxLifespan-player.age<=Math.max(10,player.maxLifespan*.05))triggerLifespanCrisis();
      if(Array.isArray(player.statusEffects)&&elapsed>0){
        const expired=[];
        for(const effect of player.statusEffects){
          if(Number(effect.remainingDays)>0){effect.remainingDays=Math.max(0,Number(effect.remainingDays)-elapsed);if(effect.remainingDays<=0)expired.push(effect.name||effect.id);}
        }
        player.statusEffects=player.statusEffects.filter(e=>!(Number(e.remainingDays)===0 && expired.includes(e.name||e.id)));
        if(expired.length)showFloatingText?.(`⏳ ${expired.join('、')} 状态已消失`,'#b8c7e8');
      }
      updateCharacterPanelDeep?.();
    }

    function toggleCharacterPanel(forceOpen=null) {
      const panel=document.getElementById('characterPanel'); if(!panel)return;
      const open=forceOpen===null?panel.classList.contains('hidden'):!!forceOpen;
      panel.classList.toggle('hidden',!open); panel.setAttribute('aria-hidden',open?'false':'true');
      if(typeof FLAT_WORLD!=='undefined')FLAT_WORLD._panelOpen=open;
      if(open)updateCharacterPanelDeep();
    }

    function setDaoNameFromPanel() {
      const input=document.getElementById('panelDaoInput'); if(!input)return;
      player.daoName=String(input.value||'').trim().slice(0,8);
      input.value=''; updateCharacterPanelDeep(); autoSave?.();
      showFloatingText?.(player.daoName?`道号已定：${player.daoName}`:'已清除道号','#ffd700');
    }

    function updateCharacterPanelDeep() {
      const panel=document.getElementById('characterPanel'); if(!panel||!player)return;
      const avatar=document.getElementById('panelAvatar'); if(avatar)drawCharacter(avatar,'player',player.level,false);
      const titles=document.getElementById('panelTitles');
      if(titles){const list=getDisplayTitles();titles.innerHTML=list.length?list.map(t=>`<span class="title-badge ${t.type==='hidden'?'hidden-title':t.type==='infamous'?'infamous':''}">${t.icon} ${t.name}</span>`).join(''):'<span style="color:#666;font-size:10px">无称号</span>';}
      const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;return e;};
      set('panelName',player.name||'无名'); set('panelDao',player.daoName?`道号：${player.daoName}`:'道号：无');
      set('panelIdentity',`${player.sect||'散修'} · ${player.sectRank||'无职位'}`); set('panelGender',player.gender||'男');
      if(Number(player.birthYear)>0){const y=Number(player.birthYear),gan=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(y-1)%10],zhi=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(y-1)%12];set('panelBirth',`${gan}${zhi}年 · 秋七月`);}else set('panelBirth','未知');
      set('panelAge',`${player.age||18}岁`);
      const life=getRemainingLifespan(),lifeEl=set('panelLifespan',`${life.remaining} / ${life.max}`); if(lifeEl)lifeEl.classList.toggle('lifespan-danger',life.remaining<=Math.max(10,life.max*.05));
      set('panelLongevityBonus',`+${getLongevityBonus()}年`);
      set('panelRealmFull',getCultivationName()+getPowerRatioLabelV2794()); set('panelBottleneck',isAtRealmBottleneck()?'⚠️ 修为已满':'✅ 修炼顺畅');
      const need=Math.max(1,getCurrentExpNeed());set('panelExpFull',`${Math.min(need,Math.floor(player.exp))} / ${need}`);set('panelExpTotalV2799',Math.floor(player.exp));set('panelExpCostV2799',need);set('panelExpReserveV2798',player.exp>=need?Math.floor(player.exp-need):'—');
      const atMax=player.level===CULTIVATION_REALMS.length-1&&(player.phase||0)>=3;
      set('panelExpHintV2799',atMax?'已达道途圆满，无需继续突破。':player.exp>=need?'突破成功扣除本阶段所需修为，剩余保留。失败另有修为损失。':`还需 ${Math.ceil(need-player.exp)} 修为，达标后才能闭关突破。`);
      if(atMax){set('panelExpCostV2799','—');set('panelExpReserveV2798','—');}
      set('panelBottleneck',atMax?'道途圆满':player.breakthrough?.isAnimating?'正在突破':player.breakthrough?.cooldownDays>0?'经脉调息中':player.exp>=need?'修为达标 · 可准备突破':'积累修为中');
      document.getElementById('cultivationProgressV2799')?.setAttribute('aria-valuenow',String(Math.max(0,Math.min(100,Math.floor(player.exp/need*100)))));
      syncBreakthroughRecoveryV2781();
      const br=getBreakthroughStatus();set('panelBreakthroughStatus',br.text);const rateEl=set('panelBreakthroughRate',br.rateText||`${br.rate}%`);if(rateEl)rateEl.style.color=br.rateText==='冷却中'?'#ff9b9b':br.rateText==='天劫'?'#9fd1ff':br.rate>70?'#69f0ae':br.rate>40?'#ffd700':'#ff6b6b';
      const bar=document.getElementById('panelExpBarFull');if(bar)bar.style.width=`${Math.max(0,Math.min(100,player.exp/need*100))}%`;
      set('panelSectFull',player.sect||'散修');set('panelRankFull',getCurrentRankInfo().name);set('panelContributionFull',`${player.sectContribution||0}（累计${player.sectTotalContribution||0}）`);
      const partner=player.romance?.partner; const pn=partner&&ROMANCE_NPCS[partner]?ROMANCE_NPCS[partner].name:'无';const pe=set('panelPartnerFull',pn);if(pe)pe.style.color=partner?(ROMANCE_NPCS[partner]?.color||'#ffb6c9'):'#aaa';
      set('panelMaster',player.master||'无');set('panelDisciplesFull',player.disciples?.length?player.disciples.join('、'):'无');
      const suRel=player.romance?.npcs?.[MAIN_HEROINE_ID];
      set('panelSuStage',getRomanceStage(suRel?.affection||0,player.romance?.partner===MAIN_HEROINE_ID,MAIN_HEROINE_ID));
      const hdEl=set('panelHeartDemon',getHeartDemonDescription()); if(hdEl) hdEl.style.color=player.heartDemon?.broken?'#69f0ae':'#d9b5ec';
      set('panelRivalState',getRivalV2Status());
      const statuses=document.getElementById('panelStatuses');
      if(statuses){let arr=(player.statusEffects||[]).map(e=>({...e,_region:false}));if(activeRegionDebuff)arr.push({name:activeRegionDebuff.desc,icon:'🗺️',type:'debuff',_region:true});if(activeRegionBuff)arr.push({name:activeRegionBuff.desc,icon:'🗺️',type:'buff',_region:true});statuses.innerHTML=arr.length?arr.map(e=>`<span class="status-tag ${e._region?'region':e.type==='buff'?'buff':'debuff'}" title="${e.desc||e.name||''}">${e.icon||'•'} ${e.name||e.desc}${Number(e.remainingDays)>0?` (${Math.ceil(e.remainingDays)}天)`:''}</span>`).join(''):'<span style="color:#888;font-size:12px">无特殊状态</span>';}
      const eq=document.getElementById('panelEquipmentFull');if(eq){const filled=Object.entries(player.equipment||{}).filter(([,v])=>v);let h=filled.slice(0,7).map(([slot,name])=>{const s=EQUIPMENT_SLOTS[slot],d=getEquipData(name),q=d?getQualityInfo(d.quality):null;return `<span class="equip-slot" style="color:${q?.color||'#ffd96f'}">${s?.icon||'•'} ${name}</span>`}).join('');h+=`<span class="equip-slot" style="cursor:pointer;border-color:#ffd76a" onclick="showEquipmentPanel()">🎒 查看全部 ${filled.length}/${Object.keys(EQUIPMENT_SLOTS).length}</span>`;if(player.activeArtifact){const t=ARTIFACT_TYPES[player.activeArtifact.type];h+=`<span class="equip-slot" style="color:#ff8cff">旧法宝：${t?.icon||'🔮'} ${player.activeArtifact.name}+${player.activeArtifact.level}</span>`;}if(player.activePet){const t=PET_TYPES[player.activePet.type];h+=`<span class="equip-slot" style="color:#79e8ff">🐾 ${t?.icon||'🐾'} ${player.activePet.name} Lv.${player.activePet.level}</span>`;}eq.innerHTML=h||'<span style="color:#888;font-size:12px">未装备</span>';}
    }

    // ================== 境界压制战斗系统 ==================
    const REALM_PRESSURE_CONFIG = {
      basePressurePerRealm: 0.20,
      basePenetrationPerRealm: 0.15,
      maxPressureCap: 0.75,
      minPressureFloor: -0.80,
      pressureStatusChance: 0.05,
      underdogCritChance: 0.02,
      underdogExpBonus: 0.50
    };

    // V27.95：以地仙为1，境界属性与战斗基础使用同一比例。
    const REALM_BASE_POWER = Object.fromEntries(CULTIVATION_REALMS.map((r,i)=>[i,{power:3000*r.powerRatio,defense:800*r.powerRatio}]));

    const PRESSURE_STATUS = {
      NONE:{name:'无',icon:'',effect:1,desc:''},
      SUPPRESSED:{name:'被压制',icon:'📉',effect:.7,desc:'受到高境界威压，全属性下降'},
      OVERWHELMED:{name:'威压',icon:'👑',effect:.5,desc:'境界差距明显，行动受到压迫'},
      DOMINATING:{name:'碾压',icon:'💥',effect:.3,desc:'境界差距悬殊，几乎无法正面抗衡'},
      UNDERDOG:{name:'越级挑战',icon:'⚡',effect:1.2,desc:'以弱战强，存在顿悟爆发机会'}
    };

    function calculateRealmPressure(attackerLevel, attackerPhase=0, defenderLevel=0, defenderPhase=0) {
      const av=(Number(attackerLevel)||0)+(Math.max(0,Math.min(3,Number(attackerPhase)||0))/4);
      const dv=(Number(defenderLevel)||0)+(Math.max(0,Math.min(3,Number(defenderPhase)||0))/4);
      const realmDiff=av-dv;
      let multiplier=1, penetration=0, isUnderdog=false;
      if(realmDiff>0){
        multiplier=1+Math.min(realmDiff*REALM_PRESSURE_CONFIG.basePressurePerRealm,REALM_PRESSURE_CONFIG.maxPressureCap);
        penetration=Math.min(realmDiff*REALM_PRESSURE_CONFIG.basePenetrationPerRealm,.6);
      }else if(realmDiff<0){
        const gap=Math.abs(realmDiff);
        multiplier=1-Math.min(gap*REALM_PRESSURE_CONFIG.basePressurePerRealm,Math.abs(REALM_PRESSURE_CONFIG.minPressureFloor));
        penetration=-Math.min(gap*REALM_PRESSURE_CONFIG.basePenetrationPerRealm,.5);
        isUnderdog=gap>=2;
      }
      multiplier=Math.max(.2,Math.min(1.75,multiplier));
      penetration=Math.max(-.5,Math.min(.6,penetration));
      return {multiplier,penetration,realmDiff,isUnderdog,pressureLevel:getPressureLevel(realmDiff)};
    }

    function getPressureLevel(realmDiff) {
      if(realmDiff>=4)return PRESSURE_STATUS.DOMINATING;
      if(realmDiff>=2)return PRESSURE_STATUS.OVERWHELMED;
      if(realmDiff>=.5)return PRESSURE_STATUS.SUPPRESSED;
      if(realmDiff<=-2)return PRESSURE_STATUS.UNDERDOG;
      return PRESSURE_STATUS.NONE;
    }

    function calculatePressureStatusChance(attackerLevel, defenderLevel) {
      const diff=(Number(attackerLevel)||0)-(Number(defenderLevel)||0);
      return diff<=0?0:Math.min(.4,diff*REALM_PRESSURE_CONFIG.pressureStatusChance);
    }

    function getRealmBasePower(level=0, phase=0) {
      const lv=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(level)||0));
      const data=REALM_BASE_POWER[lv]||REALM_BASE_POWER[0];
      const phaseBonus=getRealmStageMultiplierV2794(lv,phase);
      return {power:Math.floor(data.power*phaseBonus),defense:Math.floor(data.defense*phaseBonus)};
    }

    function getPressureDisplay(info) {
      if(!info)return '';
      const d=info.realmDiff;
      if(d>=4)return '💥 境界碾压！';
      if(d>=2)return '👑 境界压制！';
      if(d>=.5)return '📈 境界优势';
      if(d<=-2)return '⚡ 越级挑战！';
      if(d<=-.5)return '📉 境界劣势';
      return '';
    }

    function calculateFinalDamage({attacker={},defender={},skill=null,isCrit=false,isHeal=false,isPet=false,isBoss=false,critMultiplier=null}) {
      if(isHeal){
        const healAmount=Math.floor(getMaxHp()*(skill?.heal||.3));
        return {damage:healAmount,isCrit:false,isUnderdog:false,pressureInfo:null,pressureStatus:null,isHeal:true};
      }
      const attackerLevel=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(attacker.level)||0));
      const defenderLevel=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(defender.level)||0));
      const attackerPhase=Math.max(0,Math.min(3,Number(attacker.phase)||0));
      const defenderPhase=Math.max(0,Math.min(3,Number(defender.phase)||0));
      const pressure=calculateRealmPressure(attackerLevel,attackerPhase,defenderLevel,defenderPhase);
      const attackerBase=getRealmBasePower(attackerLevel,attackerPhase);
      const defenderBase=getRealmBasePower(defenderLevel,defenderPhase);
      const attackerStatusMult=(Number(attacker.pressureTurns)||0)>0?.7:1;
      const defenderStatusMult=(Number(defender.pressureTurns)||0)>0?.7:1;
      const baseAtk=Math.max(1,Number(attacker.atk)||1)*attackerStatusMult;
      const baseDef=Math.max(0,Number(defender.def)||0)*defenderStatusMult;
      const skillMultiplier=skill?Math.max(.1,Number(skill.damage)||1):1;
      let rawDamage=(baseAtk*skillMultiplier)+(attackerBase.power*.30);
      let effectiveDef=baseDef+(defenderBase.defense*.20)*defenderStatusMult;
      // 技能自身破甲与境界穿透叠加计算；紫霄落雷、无音神雷会直接削减目标有效防御。
      if(skill?.armorPierce) effectiveDef*=Math.max(0,1-Math.min(.85,Math.max(0,Number(skill.armorPierce)||0)));
      if(pressure.penetration>0)effectiveDef*=1-pressure.penetration;
      else if(pressure.penetration<0)effectiveDef*=1+Math.abs(pressure.penetration)*.5;
      let damage=Math.max(1,rawDamage-Math.max(0,effectiveDef));
      damage*=pressure.multiplier;
      damage*=.9+Math.random()*.2;
      let isCritFinal=!!isCrit;
      if(isCritFinal)damage*=(Number(critMultiplier)||1.5)+(pressure.realmDiff>0?.2:0);
      let isUnderdog=false;
      if(pressure.isUnderdog&&Math.random()<REALM_PRESSURE_CONFIG.underdogCritChance){
        damage*=2;isUnderdog=true;isCritFinal=true;
      }
      if(isBoss){
        const bossReduce=Math.min(.30,.10+defenderLevel/100);
        damage*=1-bossReduce;
      }
      if(isPet)damage*=.6;
      let pressureStatus=null;
      const chance=calculatePressureStatusChance(attackerLevel,defenderLevel);
      if(!isBoss&&chance>0&&Math.random()<chance){
        pressureStatus={type:'pressure',turns:1+Math.floor(Math.random()*2),effect:.7,name:'威压',stun:pressure.realmDiff>=2&&Math.random()<.35};
      }
      return {damage:Math.max(1,Math.floor(damage)),isCrit:isCritFinal,isUnderdog,pressureInfo:pressure,pressureStatus,isHeal:false,pressureLevel:pressure.pressureLevel,realmDiff:pressure.realmDiff};
    }

    function ensureEnemyRealm(enemy) {
      if(!enemy)return enemy;
      if(Number.isFinite(enemy._realmLevel)&&Number.isFinite(enemy._realmPhase))return enemy;
      const maxRealm=CULTIVATION_REALMS.length-1;
      if(enemy.name==='宗门试炼守将'){enemy._realmLevel=2;enemy._realmPhase=0;return enemy;}
      if(enemy.name==='幽冥鬼王'){enemy._realmLevel=2;enemy._realmPhase=3;return enemy;}
      if(enemy.name==='血魔老祖'){enemy._realmLevel=6;enemy._realmPhase=1;return enemy;}
      if(enemy.name==='天劫'){enemy._realmLevel=9;enemy._realmPhase=3;return enemy;}
      if(enemy.tournamentFight){
        const r=Math.max(0,Math.min(2,Number(enemy.tournamentRound)||0));
        let lv=player.level, ph=(player.phase||0)+(r-1);
        if(ph<0){lv=Math.max(0,lv-1);ph=3;}else if(ph>3){lv=Math.min(maxRealm,lv+1);ph=0;}
        enemy._realmLevel=lv;enemy._realmPhase=ph;return enemy;
      }
      const elite=Math.random()<.20;
      let lv=Math.max(0,(player.level||0)-(Math.random()<.55?0:1));
      let ph=Math.floor(Math.random()*4);
      if(elite){lv=Math.min(maxRealm,(player.level||0)+1);ph=Math.floor(Math.random()*4);enemy._isElite=true;}
      enemy._realmLevel=lv;enemy._realmPhase=ph;
      return enemy;
    }

    function applyPressureToEnemy(result) {
      if(!result?.pressureStatus||!currentEnemy)return;
      currentEnemy._pressureTurns=Math.max(Number(currentEnemy._pressureTurns)||0,result.pressureStatus.turns);
      if(result.pressureStatus.stun)currentEnemy._pressureStun=true;
      addCombatLog(`👑 境界威压笼罩${currentEnemy.name}：${result.pressureStatus.turns}回合属性受压${result.pressureStatus.stun?'，并被震慑':''}！`,'boss');
    }

    function applyPressureToPlayer(result) {
      if(!result?.pressureStatus)return;
      playerPressureTurns=Math.max(playerPressureTurns,result.pressureStatus.turns);
      if(result.pressureStatus.stun)playerPressureStun=true;
      addCombatLog(`📉 ${currentEnemy.name}的境界威压压在你身上：${result.pressureStatus.turns}回合属性受压${result.pressureStatus.stun?'，并被震慑':''}！`,'boss');
    }

    function getCultivationName(level=player?.level || 0, phase=player?.phase || 0) {
      const realm = CULTIVATION_REALMS[Math.max(0, Math.min(CULTIVATION_REALMS.length - 1, Number(level) || 0))];
      if (!realm) return '凡人初期';
      const p = Math.max(0, Math.min(3, Number(phase) || 0));
      return `${realm.name}${REALM_PHASES[p]}`;
    }

    function getCurrentExpNeed(level=player?.level || 0, phase=player?.phase || 0) {
      const realm = CULTIVATION_REALMS[Math.max(0, Math.min(CULTIVATION_REALMS.length - 1, Number(level) || 0))];
      if (!realm) return 100;

      const p = Math.max(0, Math.min(3, Number(phase) || 0));
      return realm.phaseExp?.[p] || realm.phaseExp?.[0] || 100;
    }

    function hasReachedRealm(levelRequired=0, phaseRequired=0) {
      if (player.level > levelRequired) return true;
      if (player.level < levelRequired) return false;

      return (player.phase || 0) >= phaseRequired;
    }

    function getRealmVisualTier(level=player?.level || 0) {
      if (level <= 0) return 0;
      return Math.max(1, Math.min(16, Number(level) || 0));
    }

    function getPhaseScaledBonus(type) {
      const realm = CULTIVATION_REALMS[player.level] || CULTIVATION_REALMS[0];
      const base = Number(realm[type]) || 0;
      const phase = Math.max(0, Math.min(3, Number(player.phase) || 0));
      return Math.floor(base * getRealmStageMultiplierV2794(player.level,phase));
    }

    function syncUnlockedSkills() {
      const unlockByRealm = [1,2,2,2,2,3,4,5,6,7,7,8,9,9,9];
      for (let i=0; i<SKILLS.length; i++) {
        const skill = SKILLS[i];
        // 宗门藏经阁中的功法不再随境界自动赠送；旧档已有技能会原样保留。
        if (typeof SECT_LIBRARY_SKILL_NAMES !== 'undefined' && SECT_LIBRARY_SKILL_NAMES.has(skill.name)) continue;
        const needRealm = skill.unlockRealm ?? (unlockByRealm[i] || 9);
        const extraPhase = skill.unlockRealm !== undefined ? 0 : (i >= 13 ? Math.min(3,i - 12) : 0);
        if (hasReachedRealm(needRealm, extraPhase) && !player.skills.some(s => s?.name === skill.name)) {
          player.skills.push(skill);
        }
      }
    }
    
    // ================== 修仙纪年 / 百年宗门大比 ==================
    const GAME_DAYS_PER_MONTH = 30;
    const GAME_MONTHS_PER_YEAR = 12;
    const GAME_DAYS_PER_YEAR = GAME_DAYS_PER_MONTH * GAME_MONTHS_PER_YEAR;

    function getGameDate() {
      const total = Math.max(0, Math.floor(player?.worldTime?.totalDays || 0));
      const year = Math.floor(total / GAME_DAYS_PER_YEAR) + 1;
      const dayOfYear = total % GAME_DAYS_PER_YEAR;
      const month = Math.floor(dayOfYear / GAME_DAYS_PER_MONTH) + 1;
      const day = (dayOfYear % GAME_DAYS_PER_MONTH) + 1;
      return { year, month, day, totalDays: total };
    }

    function getGameDateLabel() {
      const d = getGameDate();
      return `仙历${d.year}年${d.month}月${d.day}日`;
    }

    function hasTournamentRecord(century) {
      const t = player?.sectTournament;
      return !!t && (t.pending?.includes(century) || t.active?.century === century || t.history?.some(h => h.century === century));
    }

    function queueTournamentCentury(century) {
      if (!century || century < 100 || hasTournamentRecord(century)) return;
      player.sectTournament.pending.push(century);
      player.sectTournament.pending.sort((a,b)=>a-b);
      checkLingxiaoEvent?.(century);
    }

    function advanceGameTime(days, reason='') {
      if (!player.worldTime) player.worldTime = { totalDays: 0 };
      if (!player.sectTournament) player.sectTournament = { pending:[], history:[], active:null, secretQualifiedCentury:0 };
      const elapsedDays = Math.max(0, Math.floor(days || 0));
      const beforeYear = getGameDate().year;
      player.worldTime.totalDays = Math.max(0, Math.floor(player.worldTime.totalDays || 0) + elapsedDays);
      const afterYear = getGameDate().year;
      let century = Math.floor(beforeYear / 100) * 100 + 100;
      while (century <= afterYear) {
        queueTournamentCentury(century);
        century += 100;
      }
      if (player.warState) {
        player.warState.warCooldown = Math.max(0, Math.floor(Number(player.warState.warCooldown) || 0) - elapsedDays);
        if (player.warState.warCooldown <= 0 && (player.warState.status === WAR_STATUS.VICTORY || player.warState.status === WAR_STATUS.DEFEAT)) {
          player.warState.status = WAR_STATUS.PEACE;
        }
        if(player._immortalBlessing && Number(player._immortalBlessingUntilDay||0) <= player.worldTime.totalDays) {
          player._immortalBlessing=false;
          player._immortalBlessingSource=null;
          player._immortalBlessingUntilDay=0;
        }
        checkDemonInvasion?.();
      }
      // 突破失败冷却随游戏时间自然消退。
      if (player.breakthrough && player.breakthrough.cooldownDays > 0 && elapsedDays > 0) {
        const beforeCooldown = Number(player.breakthrough.cooldownDays) || 0;
        player.breakthrough.cooldownDays = Math.max(0, beforeCooldown - elapsedDays);
        if (beforeCooldown > 0 && player.breakthrough.cooldownDays === 0) {
          showFloatingText?.('✨ 经脉已稳，突破冷却结束','#69f0ae');
          if (player.breakthrough.pendingBreakthrough && player.exp >= getCurrentExpNeed()) {
            showBreakthroughNotice('✨ 调息结束，可在角色面板选择闭关突破','#69f0ae');
          }
        }
      }
      processCharacterTime(elapsedDays);
      resetDailyTasks?.(); resetWeeklyTasks?.(); checkTaskPassiveConditions?.();
      updateWorldHUD?.(); updateTaskTracker?.();
      return { beforeYear, afterYear, reason, label:getGameDateLabel() };
    }

    function getNextTournamentYear() {
      const year = getGameDate().year;
      return Math.floor(year / 100) * 100 + 100;
    }

    function getPendingTournamentCentury() {
      return player?.sectTournament?.active?.century || player?.sectTournament?.pending?.[0] || 0;
    }

    function getLatestTournamentResult() {
      const h = player?.sectTournament?.history || [];
      return h.length ? h[h.length - 1] : null;
    }

    function hasSectSecretQualification() {
      const q = Number(player?.sectTournament?.secretQualifiedCentury || 0);
      const year = getGameDate().year;
      return q >= 100 && year >= q && year < q + 100;
    }

    const SECT_TOURNAMENT_POWER = {
      '战神殿':155, '青鸾宫':145, '雷音山':105, '紫薇堂':100, '凌霄宗':95,
      '青莲宗':90, '雪魂殿':88, '碧云谷':85, '琉璃府':83, '金璧阁':80,
      '星月洞':75, '霓裳阁':60, '莲华宗':55, '彩凤楼':50, '翠竹宫':48,
      '盘玉洞':45, '紫霞庄':40
    };

    function getTournamentOpponents(century) {
      const preferred = ['紫薇堂','雷音山','青鸾宫','战神殿','青莲宗','雪魂殿'].filter(n=>n!==player.sect);
      const offset = Math.floor((century / 100) % preferred.length);
      return [preferred[offset % preferred.length], preferred[(offset+2) % preferred.length], preferred[(offset+4) % preferred.length]];
    }

    function showSectTournamentLegacyV2780() {
      if(gameState==='combat')return;
      const t = player.sectTournament;
      if(t.active){ensureTournamentV2779(t.active);if(t.active.round===3)return finalizeSectTournament(t.active.century,t.active.wins,t.active.losses);}
      const pending = getPendingTournamentCentury();
      const latest = getLatestTournamentResult();
      const date = getGameDateLabel();
      let text = `<p>📯 <b>百年宗门大比</b></p><p>当前：<b>${date}</b></p><p style="color:#aaa">天下人类宗门每百年举行一次万宗大比。仙人宗门与魔族势力不参加此项人界赛事。最终排名前三的人类宗门，可获得本世纪进入【万宗秘境】的资格。</p>`;
      const choices = [];

      text+='<p>赛制：三轮对战，每胜增加宗门评分；三战全胜至少第三名。亲自完成三轮得参赛300灵石，每胜另加150；冠军/亚军/季军排名奖2000/1300/800灵石，另有修为。</p><p style="color:#aaa">赛程与对手在报名时锁定，进度自动保存。委托宗门参赛仅领取排名奖，无个人参赛及胜场奖。</p>';
      if (t.active) {
        const a=t.active;
        text+=a.opponents.map((n,i)=>`<p>${i+1}. ${n} · ${i<a.round?(a.resultsV2779.find(r=>r.round===i)?.win?'胜':'负'):i===a.round?'待挑战':'未开始'}</p>`).join('');
        text += `<p style="color:#ffd98a">第 ${a.century} 年大比正在进行 · 代表宗门：<b>${player.sect}</b></p>`;
        text += `<p>当前战绩：<b>${a.wins} 胜 ${a.losses} 负</b> · 已完成 ${a.round}/3 轮</p>`;
        if (a.round < 3) choices.push({text:`⚔️ 参加第 ${a.round+1} 轮比武`,action:'tournament_round'});
      } else if (pending) {
        text += `<p style="color:#ffcf70">📯 第 ${pending} 年万宗大比已经举行，各宗正在等待代表入场。</p>`;
        if (hasReachedRealm(2)) {
          choices.push({text:`⚔️ 代表${player.sect}报名出战`,action:'tournament_start'});
        } else {
          text += `<p style="color:#ff9e8e">你的修为尚不足以作为宗门代表出战（至少筑基境）。</p>`;
        }
        choices.push({text:'👁️ 不亲自出战，让宗门自行参赛',action:'tournament_auto'});
      } else {
        const next = getNextTournamentYear();
        text += `<p>下一届大比：<b>仙历 ${next} 年</b>，距离现在约 ${Math.max(0,next-getGameDate().year)} 年。</p>`;
        if (latest) {
          const top = latest.ranking.slice(0,3).map((n,i)=>`${i+1}.${n}`).join('　');
          text += `<p style="color:#aaa">上一届（${latest.century}年）前三：${top}</p>`;
        }
      }

      if (hasSectSecretQualification()) {
        text += `<p style="color:#69f0ae">✅ ${player.sect}拥有本世纪万宗秘境资格，有效至仙历 ${player.sectTournament.secretQualifiedCentury+100} 年大比开始前。</p>`;
        choices.push({text:'🌀 前往万宗秘境',action:'secret'});
      }
      choices.push({text:'← 返回宗门',action:'sect'});
      showStory(text,choices);
    }

    function ensureTournamentV2779(a){
      if(!a)return null;
      if(!a.sect)a.sect=player.sect;
      if(!a.enemiesV2779)a.enemiesV2779=a.opponents.map((n,i)=>({...buildTournamentEnemy(n,i),_realmLevel:player.level,_realmPhase:player.phase||0,tournamentCentury:a.century}));
      if(!a.scoresV2779)a.scoresV2779=HUMAN_SECTS.filter(f=>!isFactionDestroyed(f.name)).map(f=>({name:f.name,score:(SECT_TOURNAMENT_POWER[f.name]||78)+Math.floor(Math.random()*15)-7}));
      if(!Number.isFinite(a.levelV2779))a.levelV2779=Math.min(12,player.level);
      if(!Array.isArray(a.resultsV2779))a.resultsV2779=[];
      return a;
    }
    function startSectTournamentLegacyV2780() {
      if(gameState==='combat'||!hasReachedRealm(2)||!HUMAN_SECTS.some(f=>f.name===player.sect)||isFactionDestroyed(player.sect))return;
      const century=player.sectTournament.pending?.[0];
      if(!century||player.sectTournament.active)return showSectTournament();
      player.sectTournament.active=ensureTournamentV2779({century,round:0,wins:0,losses:0,opponents:getTournamentOpponents(century)});
      autoSave();showSectTournament();
    }

    function buildTournamentEnemy(opponentName, round) {
      const f = HUMAN_SECTS.find(x=>x.name===opponentName);
      const mult = [0.82, 1.00, 1.18][Math.max(0,Math.min(2,round))];
      const title = opponentName==='战神殿' ? '战殿真传' : opponentName==='青鸾宫' ? '青鸾仙子' : '宗门真传';
      const hp = Math.max(80, Math.floor(getMaxHp() * (0.9 + round*0.22) + player.level*18));
      return {
        name:`${opponentName}·${title}`,
        hp, maxHp:hp,
        atk:Math.max(8,Math.floor(getAtk()*0.72*mult + player.level*2)),
        def:Math.max(3,Math.floor(getDef()*0.68*mult + player.level)),
        gold:0,
        exp:Math.floor((80 + player.level*35) * mult),
        tournamentFight:true,
        tournamentSect:opponentName,
        tournamentRound:round,
        desc:f?.specialty || '宗门传承'
      };
    }

    function startTournamentRoundLegacyV2780() {
      if(gameState==='combat')return;
      const a=ensureTournamentV2779(player.sectTournament.active);
      if(!a||a.round>=3)return showSectTournament();
      const enemy=a.enemiesV2779[a.round];autoSave();
      showStory(`<h3>📯 第${a.century}年大比 · 第${a.round+1}/3轮</h3><p>${a.sect} 对阵 ${a.opponents[a.round]}</p><p>${enemy.name} · ${enemy.desc}</p><p>气血 ${enemy.maxHp} · 攻击 ${enemy.atk} · 防御 ${enemy.def}</p><p>登台前恢复全部气血与灵力。对手属性已锁定，可返回调整装备与技能。落败不扣灵石。</p>`,[
        {text:'⚔️ 登台比武',action:'tournament_fight',enemy},
        {text:'返回大比 · 调整准备',action:'sect_tournament'}]);
    }
    function enterTournamentFightLegacyV2780(enemy){
      if(gameState==='combat')return;
      const a=ensureTournamentV2779(player.sectTournament.active);
      if(!a||a.round>=3||enemy?.tournamentCentury!==a.century||enemy?.tournamentRound!==a.round)return;
      a.startedV2779=a.round;
      player.hp=getMaxHp();player.mp=getMaxMp();player.location='sect';autoSave();
      startCombat({...a.enemiesV2779[a.round]},false,false);
    }

    function recordTournamentRoundLegacyV2780(win,enemy=currentEnemy) {
      const a=player.sectTournament.active;
      if(!a||a.round>=3||a.startedV2779!==a.round||enemy?.tournamentCentury!==a.century||enemy?.tournamentRound!==a.round)return;
      a.resultsV2779.push({round:a.round,opponent:a.opponents[a.round],win:!!win});
      a.startedV2779=null;
      if(win)a.wins++;else a.losses++;a.round++;
      player.hp=getMaxHp();player.mp=getMaxMp();autoSave();
      if(a.round>=3)return finalizeSectTournament(a.century,a.wins,a.losses);
      showStory(`<p>${win?'🏆 本轮获胜！':'⚠️ 本轮落败，不扣灵石。'}</p><p>当前战绩：${a.wins}胜${a.losses}负，已保存。可返回整备再继续。</p>`,[{text:'返回大比继续赛程',action:'sect_tournament'}]);
    }

    function simulateTournamentRanking(century,playerWins=0) {
      const a=ensureTournamentV2779(player.sectTournament.active);
      const sect=a?.sect||player.sect;
      const scores=(a?.scoresV2779||HUMAN_SECTS.filter(f=>!isFactionDestroyed(f.name)).map(f=>({name:f.name,score:(SECT_TOURNAMENT_POWER[f.name]||78)+Math.floor(Math.random()*15)-7}))).map(f=>({...f,score:f.score+(f.name===sect?playerWins*18+(a?.levelV2779??Math.min(12,player.level)):0)}));
      scores.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
      const ranking=scores.map(x=>x.name),position=ranking.indexOf(sect);
      if(playerWins===3&&position>2){ranking.splice(position,1);ranking.splice(2,0,sect);}
      return ranking;
    }

    function finalizeSectTournament(century, wins=0, losses=3, auto=false) {
      if(gameState==='combat')return;
      const t=player.sectTournament,a=t.active;
      if(t.history.some(h=>h.century===century)||!(t.pending||[]).includes(century))return;
      if(auto){if(a)return;wins=0;losses=3;}
      else {if(!a||a.century!==century||a.round!==3)return;wins=a.wins;losses=a.losses;}
      const representedSect=a?.sect||player.sect;
      const roundResults=a?.resultsV2779||[];
      const ranking=simulateTournamentRanking(century,wins);
      const position=ranking.indexOf(representedSect)+1;
      const qualified=position>0 && position<=3;
      player.sectTournament.pending = (player.sectTournament.pending||[]).filter(c=>c!==century);
      player.sectTournament.active=null;
      const record={century,sect:representedSect,wins,losses,position,qualified,ranking,roundResults,personal:!auto};
      player.sectTournament.history.push(record);
      if (qualified && representedSect===player.sect) player.sectTournament.secretQualifiedCentury=Math.max(player.sectTournament.secretQualifiedCentury||0,century);
      addFactionReputation(representedSect,(qualified?30:10)+wins*5,'百年宗门大比');
      const top3=ranking.slice(0,3);
      const rankGold=position===1?2000:position===2?1300:position===3?800:0;
      const rankExp=position===1?1000:position===2?650:position===3?400:0;
      const participation=auto?0:300,winGold=auto?0:wins*150;
      const gold=rankGold+participation+winGold,exp=rankExp+(auto?0:150+wins*80);
      player.gold+=gold;player.exp+=exp;record.gold=gold;record.exp=exp;
      const reward=`灵石 +${gold}（排名${rankGold}＋参赛${participation}＋胜场${winGold}），修为 +${exp}。`;
      checkLevelUp(); autoSave();
      showStory(`<p style="color:#ffd98a;font-size:17px"><b>📯 第 ${century} 年万宗大比落幕</b></p><p>前三宗门：</p><p>🥇 ${top3[0]}<br>🥈 ${top3[1]}<br>🥉 ${top3[2]}</p><p>${representedSect}最终排名：<b>第 ${position} 名</b>（你个人 ${wins}胜${losses}负）</p>${qualified?`<p style="color:#69f0ae">✅ 获得第${century}年大比秘境资格，有效至${century+100}年前${getGameDate().year>=century+100?'（现已过期）':''}。</p>`:`<p style="color:#ff8f8f">未进入前三，本世纪无万宗秘境资格。</p>`}${reward?`<p style="color:#ffd700">${reward}</p>`:''}<details><summary>查看完整宗门排名</summary>${ranking.map((name,i)=>`<p>${i+1}. ${name}</p>`).join('')}</details>`,[
        {text:qualified?'🌀 查看秘境资格':'返回宗门',action:qualified?'secret':'sect'}
      ]);
    }

    function autoResolveSectTournamentLegacyV2780() {
      const century=player.sectTournament.pending?.[0];
      if(!century) return showSectTournament();
      if(gameState==='combat'||player.sectTournament.active)return;
      finalizeSectTournament(century,0,3,true);
    }

    // V27.80：具名宗门代表与单败淘汰赛，半决赛败者争季军。
    const TALENTS_V2780={
      '战神殿':['秦烈','男','破军战诀','刚猛正攻','atk'],
      '青鸾宫':['顾青鸾','女','青鸾离火诀','火法与身法','atk'],
      '雷音山':['陆惊雷','男','九霄雷诀','雷法炼体','atk'],
      '紫薇堂':['沈星澜','女','紫薇星阵','星阵推演','def'],
      '凌霄宗':['林清越','男','凌霄御剑诀','剑道试炼','balanced'],
      '青莲宗':['叶扶苏','男','青莲剑歌','剑意凝练','atk'],
      '雪魂殿':['白凝霜','女','雪魂冰心诀','寒冰护体','def'],
      '碧云谷':['苏灵萱','女','碧云长春功','木灵养息','hp'],
      '琉璃府':['宁玄钰','男','琉璃金身诀','坚甲护身','def'],
      '金璧阁':['金照棠','女','金璧宝光诀','御器护体','def'],
      '星月洞':['江映月','女','星月幻典','幻术扰敌','balanced'],
      '霓裳阁':['柳听音','女','霓裳天音谱','音律轻身','balanced'],
      '莲华宗':['温知莲','女','莲华净心功','生息护体','hp'],
      '彩凤楼':['凤栖梧','女','彩凤焚霞诀','火羽突击','atk'],
      '翠竹宫':['许听竹','男','翠竹清风剑','风剑轻灵','balanced'],
      '盘玉洞':['石怀瑾','男','盘玉镇山诀','土灵守御','def'],
      '紫霞庄':['谢朝霞','女','紫霞归元功','紫气养元','hp']
    };
    const KO_STAGES_V2780=['入围赛','十六强赛','八强赛','半决赛','决赛与季军赛'];
    function koEscapeV2780(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
    function koHashV2780(text){let n=2166136261;for(const c of String(text)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0}
    function koActiveV2780(){const a=player.sectTournament?.active;return a?.knockoutV2780?a:null}
    function koNameV2780(a,id){const p=a.roster.find(p=>p.id===id);return p?`${koEscapeV2780(p.name)} · ${koEscapeV2780(p.sect)}`:'轮空'}
    function makeKnockoutV2780(century,personal){
      const sects=HUMAN_SECTS.filter(f=>!isFactionDestroyed(f.name));
      if(!sects.some(f=>f.name===player.sect))return null;
      const snapshot={hp:getMaxHp(),atk:getAtk(),def:getDef(),level:player.level,phase:player.phase||0};
      const generation=Math.floor(century/100);
      const roster=sects.map((f,i)=>{
        const t=TALENTS_V2780[f.name]||['云初','男','宗门心法','均衡攻守','balanced'];
        const isPlayer=personal&&f.name===player.sect;
        const h=koHashV2780(`${century}:${f.name}`);
        const suffix=['','宁','安','衡'][generation%4];
        return {id:f.name,sect:f.name,name:isPlayer?(player.name||'你'):(generation===1?t[0]:t[0].slice(0,1)+t[0].slice(1,2)+suffix),gender:isPlayer?'主角':t[1],age:isPlayer?Math.floor(player.age||18):18+h%5,art:isPlayer?'当前装备功法':t[2],style:t[3],kind:t[4],isPlayer,rating:(SECT_TOURNAMENT_POWER[f.name]||78)+h%15};
      });
      // 高种子优先轮空；参赛17宗时进行一场入围赛，余下15宗直接进入十六强。
      roster.sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id));
      let size=1;while(size<roster.length)size*=2;
      const stage=Math.max(0,5-Math.log2(size));
      const a={knockoutV2780:true,century,sect:player.sect,personal,roster,snapshot,stage,round:0,wins:0,losses:0,matches:[],past:[],eliminated:[],started:null};
      let seeds=[1];while(seeds.length<size){const sum=seeds.length*2+1;seeds=seeds.flatMap(n=>[n,sum-n]);}
      for(let i=0;i<size/2;i++)a.matches.push({id:`${century}:${stage}:${i}`,left:roster[seeds[i*2]-1]?.id||null,right:roster[seeds[i*2+1]-1]?.id||null,kind:stage===4?'final':'normal',done:false});
      return a;
    }
    function koResolveMatchV2780(a,m,winner){
      if(m.done)return;
      m.done=true;m.winner=winner;m.loser=winner===m.left?m.right:m.left;
      m.bye=!m.left||!m.right;
      if(m.loser)a.eliminated.push({id:m.loser,stage:a.stage,kind:m.kind});
    }
    function koPlayerMatchV2780(a){return a.matches.find(m=>!m.done&&m.left&&m.right&&a.personal&&(m.left===a.sect||m.right===a.sect))}
    function koAdvanceV2780(a){
      // 最多五个赛段；已出局时自动完成余下NPC对阵，不留下无入口的赛事。
      for(let guard=0;guard<6;guard++){
        for(const m of a.matches){
          if(m.done)continue;
          if(!m.left||!m.right){koResolveMatchV2780(a,m,m.left||m.right);continue;}
          if(a.personal&&(m.left===a.sect||m.right===a.sect))continue;
          const l=a.roster.find(p=>p.id===m.left),r=a.roster.find(p=>p.id===m.right);
          const roll=koHashV2780(m.id+':'+m.left+':'+m.right)/4294967296;
          koResolveMatchV2780(a,m,roll<l.rating/(l.rating+r.rating)?m.left:m.right);
        }
        if(koPlayerMatchV2780(a)){autoSave();return;}
        if(a.matches.some(m=>!m.done)){autoSave();return;}
        a.past.push({stage:a.stage,matches:a.matches.map(m=>({...m}))});
        if(a.stage===4){finishKnockoutV2780(a);return;}
        const winners=a.matches.map(m=>m.winner).filter(Boolean);
        const losers=a.matches.map(m=>m.loser).filter(Boolean);
        a.stage++;a.matches=[];
        for(let i=0;i<winners.length;i+=2)a.matches.push({id:`${a.century}:${a.stage}:${i/2}`,left:winners[i],right:winners[i+1]||null,kind:a.stage===4?'final':'normal',done:false});
        if(a.stage===4&&losers.length===2)a.matches.push({id:`${a.century}:4:bronze`,left:losers[0],right:losers[1],kind:'bronze',done:false});
      }
    }
    function koBracketV2780(a){
      const stages=[...(a.past||[]),...(a.matches?.length?[{stage:a.stage,matches:a.matches}]:[])];
      return stages.map(s=>`<details ${s.stage===a.stage?'open':''}><summary>${KO_STAGES_V2780[s.stage]}</summary>${s.matches.map(m=>`<p>${m.kind==='bronze'?'🥉 季军争夺：':''}${koNameV2780(a,m.left)} 对 ${koNameV2780(a,m.right)}<br><small>${m.done?`${m.bye?'轮空晋级':'胜者'}：${koNameV2780(a,m.winner)}`:'待比武'}</small></p>`).join('')}</details>`).join('');
    }
    function showSectTournament(){
      if(gameState==='combat')return;
      const t=player.sectTournament;
      if(t.active&&!t.active.knockoutV2780)return showSectTournamentLegacyV2780();
      let a=koActiveV2780();
      if(a){koAdvanceV2780(a);if(!koActiveV2780())return;}
      let html='<h3>📯 百年宗门大比 · 淘汰赛</h3><p>每宗一名代表，负者淘汰；半决赛败者争夺季军。前三宗门获得对应世纪万宗秘境资格。轮空不计个人胜场。</p><p>亲自参赛：赛终300灵石，每场实战胜利另加150。冠/亚/季军排名奖2000/1300/800灵石，另有修为；落败不扣灵石。</p>';
      const choices=[];
      if(a){
        html+=`<p>仙历${a.century}年 · ${KO_STAGES_V2780[a.stage]} · ${a.wins}胜${a.losses}负</p>`+koBracketV2780(a);
        const match=koPlayerMatchV2780(a);
        if(match)choices.push({text:match.kind==='bronze'?'🥉 参加季军赛':'⚔️ 查看对手并登台',action:'tournament_round'});
      }else{
        const century=t.pending?.[0];
        html+=century?`<p>第${century}年大比开放报名，至少筑基境可亲自出战。</p>`:`<p>下一届：仙历${getNextTournamentYear()}年。</p>`;
        if(century){choices.push({text:'报名淘汰赛',action:'tournament_start',condition:()=>hasReachedRealm(2)});choices.push({text:'委托宗门代表参赛',action:'tournament_auto'});}
        a=makeKnockoutV2780(century||getNextTournamentYear(),false);
        if(!century)html+='<p style="color:#aaa">以下为下届预计代表名册，正式报名时锁定；亲自报名将替换本宗代表。</p>';
        const last=getLatestTournamentResult();
        if(last?.knockoutV2780)html+=`<details><summary>上届结果：${koEscapeV2780(last.placeLabel)} · 查看对阵</summary>${koBracketV2780(last.bracket)}</details>`;
      }
      if(a){html+='<details open><summary>📜 本届宗门天才名册</summary>'+a.roster.map(p=>`<div style="border-bottom:1px solid #665638;padding:8px 0"><b>${koEscapeV2780(p.name)}</b> · ${p.gender==='主角'?'主角':p.gender==='男'?'少年男修':'少女女修'} · ${p.age}岁<br>${koEscapeV2780(p.sect)} · ${koEscapeV2780(p.art)}<br><small>${koEscapeV2780(p.style)}${p.isPlayer?' · 由你代表本宗':''}</small></div>`).join('')+'</details>';}
      if(hasSectSecretQualification())choices.push({text:'🌀 前往万宗秘境',action:'secret'});
      choices.push({text:'返回宗门',action:'sect'});showStory(html,choices);
    }
    function startSectTournament(){
      if(gameState==='combat'||!hasReachedRealm(2))return;
      const t=player.sectTournament;
      if(t.active)return showSectTournament();
      const century=t.pending?.[0];if(!century||t.history.some(h=>h.century===century))return;
      const a=makeKnockoutV2780(century,true);if(!a)return;
      t.active=a;autoSave();showSectTournament();
    }
    function koEnemyV2780(a,m){
      const id=m.left===a.sect?m.right:m.left,p=a.roster.find(p=>p.id===id),b=a.snapshot;
      const mult=[.82,.9,1,1.1,1.18][a.stage],hp=Math.max(80,Math.floor((b.hp*.95+b.level*18)*mult*(p.kind==='hp'?1.18:1)));
      return {name:`${p.name}·${p.sect}`,hp,maxHp:hp,atk:Math.max(8,Math.floor((b.atk*.72+b.level*2)*mult*(p.kind==='atk'?1.12:1))),def:Math.max(3,Math.floor((b.def*.68+b.level)*mult*(p.kind==='def'?1.15:1))),gold:0,exp:Math.floor((80+b.level*35)*mult),tournamentFight:true,tournamentCentury:a.century,tournamentRound:a.round,tournamentSect:p.sect,_tournamentMatchV2780:m.id,_realmLevel:b.level,_realmPhase:b.phase,desc:`${p.art} · ${p.style}`};
    }
    function startTournamentRound(){
      if(gameState==='combat')return;
      const a=koActiveV2780();if(!a)return startTournamentRoundLegacyV2780();
      const m=koPlayerMatchV2780(a);if(!m)return showSectTournament();
      const e=koEnemyV2780(a,m);
      showStory(`<h3>${m.kind==='bronze'?'季军争夺':KO_STAGES_V2780[a.stage]}</h3><p>${koEscapeV2780(e.name)}</p><p>${koEscapeV2780(e.desc)}</p><p>气血${e.maxHp} · 攻击${e.atk} · 防御${e.def}</p><p>登台恢复全部气血灵力。除半决赛败者进入季军赛外，落败即结束本届个人赛程。</p>`,[{text:'⚔️ 登台比武',action:'tournament_fight',enemy:e},{text:'返回名册与对阵',action:'sect_tournament'}]);
    }
    function enterTournamentFightV2779(enemy){
      if(gameState==='combat')return;
      const a=koActiveV2780();if(!a)return enterTournamentFightLegacyV2780(enemy);
      const m=koPlayerMatchV2780(a);
      if(!m||enemy?._tournamentMatchV2780!==m.id||enemy.tournamentCentury!==a.century)return;
      a.started=m.id;player.hp=getMaxHp();player.mp=getMaxMp();player.location='sect';autoSave();startCombat(koEnemyV2780(a,m),false,false);
    }
    function recordTournamentRound(win,enemy=currentEnemy){
      const a=koActiveV2780();if(!a)return recordTournamentRoundLegacyV2780(win,enemy);
      const m=koPlayerMatchV2780(a);
      if(!m||a.started!==m.id||enemy?._tournamentMatchV2780!==m.id||enemy.tournamentCentury!==a.century)return;
      a.started=null;a.round++;if(win)a.wins++;else a.losses++;
      koResolveMatchV2780(a,m,win?a.sect:(m.left===a.sect?m.right:m.left));
      player.hp=getMaxHp();player.mp=getMaxMp();autoSave();showSectTournament();
    }
    function finishKnockoutV2780(a){
      const t=player.sectTournament;if(t.active!==a||t.history.some(h=>h.century===a.century))return;
      const final=a.matches.find(m=>m.kind==='final'),bronze=a.matches.find(m=>m.kind==='bronze');
      const medals=[final?.winner,final?.loser,bronze?.winner,bronze?.loser].filter(Boolean);
      const others=a.eliminated.slice().reverse().map(p=>p.id).filter(id=>!medals.includes(id));
      const ranking=[...new Set([...medals,...others,...a.roster.map(p=>p.id)])];
      const position=ranking.indexOf(a.sect)+1,qualified=position>0&&position<=3;
      const lastOut=a.eliminated.filter(p=>p.id===a.sect).pop();
      const placeLabel=position<=4?['冠军','亚军','季军','第四名'][position-1]:`${KO_STAGES_V2780[lastOut?.stage||0]}出局`;
      const rankGold=position===1?2000:position===2?1300:position===3?800:0,rankExp=position===1?1000:position===2?650:position===3?400:0;
      const gold=rankGold+(a.personal?300+a.wins*150:0),exp=rankExp+(a.personal?150+a.wins*80:0);
      const record={knockoutV2780:true,century:a.century,sect:a.sect,wins:a.wins,losses:a.losses,position,qualified,ranking,placeLabel,gold,exp,personal:a.personal,bracket:{roster:a.roster,past:a.past,stage:4,matches:[]}};
      t.history.push(record);t.pending=t.pending.filter(c=>c!==a.century);t.active=null;
      if(qualified&&a.sect===player.sect)t.secretQualifiedCentury=Math.max(t.secretQualifiedCentury||0,a.century);
      player.gold+=gold;player.exp+=exp;addFactionReputation(a.sect,(qualified?30:10)+a.wins*5,'百年淘汰赛');checkLevelUp();autoSave();
      showStory(`<h3>🏆 第${a.century}年大比落幕</h3><p>冠军：${koNameV2780(a,medals[0])}<br>亚军：${koNameV2780(a,medals[1])}<br>季军：${koNameV2780(a,medals[2])}</p><p>本宗成绩：${placeLabel}${a.personal?` · ${a.wins}胜${a.losses}负`:''}</p><p>灵石 +${gold} · 修为 +${exp}</p><p>${qualified?`获得本届秘境资格，有效至仙历${a.century+100}年前${getGameDate().year>=a.century+100?'（现已过期）':''}`:'未进入前三，无本届秘境资格'}</p>${koBracketV2780(record.bracket)}`,[{text:'返回大比',action:'sect_tournament'},{text:'返回宗门',action:'sect'}]);
    }
    function autoResolveSectTournament(){
      if(gameState==='combat')return;
      const t=player.sectTournament;if(t.active)return showSectTournament();
      const century=t.pending?.[0];if(!century||t.history.some(h=>h.century===century))return;
      const a=makeKnockoutV2780(century,false);if(!a)return;t.active=a;autoSave();koAdvanceV2780(a);
    }

    // ================== 宗门 / 势力系统 V2 ==================
    // 27 个势力的唯一主数据源。宗门目录、战争系统、关系网与势力查询均从这里读取。
    // 三界整体层级：仙人宗门 > 魔族势力 > 人类宗门。
    // 人族内部固定：战神殿第1，青鸾宫第2。

    const HUMAN_SECTS_FULL = [
      {
        id:'zhandian', name:'战神殿', rank:1, power:360, tier:'人族顶级', gender:'全男性', icon:'⚔️',
        specialty:'战阵·体修·兵道·正面战争',
        desc:'门中弟子与核心传承者皆为男性，以战阵、体修与兵道闻名。历代门人多活跃于人魔边线，外界常将其视作人族武道旗帜之一。',
        internalFactions:[
          {name:'血战派',desc:'杀伐主战，主张主动出击魔族'},
          {name:'守御派',desc:'固守人族防线，稳健防御'}
        ],
        relations:{ally:['青鸾宫'],enemy:['战魂殿'],rival:['雷音山']},
        isJoinable:true
      },
      {
        id:'qingluan', name:'青鸾宫', rank:2, power:340, tier:'人族顶级', gender:'全女性', icon:'🦚',
        specialty:'青鸾传承·火法·身法·阵法',
        desc:'宫中从弟子到核心传承皆为女性，青鸾一脉传承悠久。修真界常将其与战神殿并提，但宫中真正底蕴少有外人知晓。',
        internalFactions:[
          {name:'守脉派',desc:'守护青鸾血脉传承，不轻易入世'},
          {name:'云游派',desc:'入世行走历练，广结善缘'}
        ],
        relations:{ally:['战神殿','碧云谷'],enemy:['天蚕教']},
        isJoinable:false
      },
      {
        id:'leiyin', name:'雷音山', power:280, tier:'人族一流', icon:'⚡',
        specialty:'雷法·炼体·镇邪',
        desc:'山门多雷泽，门下弟子多肉身强横，以镇压妖魔为己任。',
        relations:{ally:['紫薇堂'],rival:['战神殿']}
      },
      {
        id:'ziwei', name:'紫薇堂', power:270, tier:'人族一流', icon:'🌌',
        specialty:'星象·推演·阵法',
        desc:'少主动征伐，擅长卜算天机，为人族各大宗门提供推演预警。',
        relations:{ally:['雷音山'],wary:['星月洞']}
      },
      {
        id:'qinglian', name:'青莲宗', power:245, tier:'人族一流', icon:'🪷',
        specialty:'剑道·青莲传承',
        desc:'剑道传承悠久，以青莲一脉功法名动修真界。',
        relations:{rival:['凌霄宗']}
      },
      {
        id:'xuehun', name:'雪魂殿', power:235, tier:'人族一流', icon:'❄️',
        specialty:'寒冰·魂道',
        desc:'地处极寒之地，功法以寒冰与神魂控制见长。与魔族战魂殿道统同源但互相敌视。',
        relations:{enemy:['战魂殿'],rival:['星月洞']}
      },
      {
        id:'biyun', name:'碧云谷', power:220, tier:'人族一流', icon:'🌿',
        specialty:'灵植·炼丹·木系功法',
        desc:'谷中灵田无数，是人族重要丹药与灵植传承之一，被称为“后勤支柱”。',
        relations:{ally:['青鸾宫'],trade:['金璧阁']}
      },
      {
        id:'liuli', name:'琉璃府', power:210, tier:'人族一流', icon:'💎',
        specialty:'炼器·防御·琉璃法',
        desc:'擅炼器与防御型法门，宗门宝器在修真界颇有名气。',
        relations:{trade:['金璧阁']}
      },
      {
        id:'jinbi', name:'金璧阁', power:195, tier:'人族一流', icon:'🏯',
        specialty:'炼器·鉴宝·商贸',
        desc:'商业宗门，遍布各地的分阁，掌控凡界修仙资源交易市场。',
        relations:{trade:['琉璃府','碧云谷','凌霄宗']}
      },
      {
        id:'xingyue', name:'星月洞', power:180, tier:'人族一流', icon:'🌙',
        specialty:'星月之力·幻术·夜战',
        desc:'功法引星月之力入体，在夜间战斗尤其强势。',
        relations:{rival:['狐妖宗'],wary:['紫薇堂']}
      },
      {
        id:'nishang', name:'霓裳阁', power:135, tier:'人族知名', icon:'🎐',
        specialty:'音律·幻术·轻身',
        desc:'门中术法华丽灵动，擅以音律与幻境制敌。'
      },
      {
        id:'lianhua', name:'莲华宗', power:115, tier:'人族知名', icon:'🌸',
        specialty:'莲华术·护体·疗伤',
        desc:'传承温和绵长，擅护体与恢复类法门。'
      },
      {
        id:'caifeng', name:'彩凤楼', power:95, tier:'人族知名', icon:'🔥',
        specialty:'火法·身法·御空',
        desc:'门中身法华丽迅疾，火系传承也颇具威名。'
      },
      {
        id:'cuizhu', name:'翠竹宫', power:80, tier:'人族知名', icon:'🎋',
        specialty:'竹剑·风系术法·清心',
        desc:'宗门坐落竹海，以清心功和灵动剑法著称。'
      },
      {
        id:'panyu', name:'盘玉洞', power:60, tier:'人族知名', icon:'🪨',
        specialty:'土系术法·阵法·洞天经营',
        desc:'依山开洞立宗，防御阵法和洞府经营极强。'
      },
      {
        id:'zixia', name:'紫霞庄', power:40, tier:'人族知名', icon:'🌅',
        specialty:'紫霞真气·炼气·护体',
        desc:'以紫霞真气闻名，功法根基扎实，门风稳健。'
      },
      {
        id:'lingxiao', name:'凌霄宗', power:260, tier:'人族一流', icon:'⛩️',
        specialty:'剑道·丹药·宗门试炼',
        desc:'男主早期所在宗门，苏晚晴与顾承渊相关主线发生之地。',
        isMainSect:true,
        internalFactions:[
          {
            name:'清玄一脉', leader:'清玄真人',
            desc:'重视弟子本心、心性修行，男主与苏晚晴归属此脉。不看重出身，看重天赋与道心。'
          },
          {
            name:'大长老一脉', leader:'顾玄岳',
            desc:'重宗门权柄、门第、规矩，顾承渊属于此脉。顾承渊刻意隐瞒自己是顾玄岳嫡孙。'
          }
        ],
        relations:{
          rival:['青莲宗'], trade:['碧云谷','金璧阁'],
          enemy:['天蚕教','狐妖宗'], seek:['太岁书院']
        },
        specialEvents:[
          '宗门试炼（主线第一章）',
          '夜间禁阁事件（金丹阶段，顾承渊身世真相）',
          '百年宗门大比（顾承渊身份曝光高潮）'
        ]
      }
    ];

    const DEMON_FACTIONS_FULL = [
      {
        id:'tiancan', name:'天蚕教', power:270, tier:'魔族次级', icon:'🕸️',
        specialty:'天蚕秘术·毒术·束缚',
        desc:'魔族老牌势力之一，功法诡谲，善于以丝、毒和秘术困敌。行事暗中投毒、腐蚀灵脉，不喜欢正面硬刚。',
        relations:{enemy:['青鸾宫','碧云谷']},
        tactics:'偷袭、投毒、渗透'
      },
      {
        id:'huyan', name:'狐妖宗', power:230, tier:'魔族次级', icon:'🦊',
        specialty:'幻术·魅惑·妖火',
        desc:'狐妖一脉聚集之地，幻术和惑心法门极难防备。擅长挑拨人族宗门内乱。',
        relations:{rival:['星月洞']},
        tactics:'离间、魅惑、幻阵'
      },
      {
        id:'moba', name:'魔界八邪', power:340, tier:'魔族次级', icon:'☠️',
        specialty:'八脉邪法·禁术·暗杀',
        desc:'由八个魔门势力松散结盟，内部矛盾重重，各怀鬼胎。只有魔灾降临之时才统一行动。',
        isAlliance:true,
        internalFactions:['血煞门','幽冥宗','万毒窟','白骨观','噬魂谷','黑风堂','赤炼宗','寒冥教'],
        tactics:'暗杀、劫掠、邪法'
      },
      {
        id:'zhanhun', name:'战魂殿', power:390, tier:'魔族顶级', icon:'👻',
        specialty:'战魂·魂道·战场秘术',
        desc:'以驾驭战魂与魂道秘术闻名，是魔族正面战争中的重要力量。热衷正面厮杀，收割修士魂魄修炼。',
        relations:{enemy:['战神殿','雪魂殿']},
        tactics:'正面强攻、魂道收割'
      },
      {
        id:'xianmo', name:'仙魔教', power:450, tier:'魔族顶级', icon:'☯️',
        specialty:'仙魔同修·禁法·夺灵',
        desc:'掌握大量上古禁术，行踪与多次界膜异动、魔潮传闻相连。诸宗对其所知有限，却很少有人愿意轻视仙魔教的动向。',
        relations:{enemy:['战神殿','青鸾宫','凌霄宗']},
        tactics:'禁法、渗透、魔潮'
      }
    ];

    const IMMORTAL_SECTS_FULL = [
      {
        id:'yinyue', name:'隐月灵渊阁', power:510, tier:'仙界宗门·超然仙宗', icon:'🌘',
        specialty:'月华·隐匿·灵渊秘法·聚灵',
        desc:'宗门常年被云雾遮挡，天穹只显一轮若隐若现的月影。阁下据说连着一座看不到底的灵气深渊。',
        stance:'中立，极少现身，接受修士前往秘境求道',
        interventionRule:'仅接受求援，不主动出手'
      },
      {
        id:'huanyu', name:'幻羽凌仙宫', power:495, tier:'仙界宗门·超然仙宗', icon:'🪽',
        specialty:'幻羽·御风·自然仙法·凌空术',
        desc:'宫阙若虚若实，仿佛由云海与羽光构成。门人讲求与天地自然相合。',
        stance:'偏向守护生灵',
        interventionRule:'魔族大肆屠戮时有限度出手'
      },
      {
        id:'taisui', name:'太岁书院', power:480, tier:'仙界宗门·古仙学府', icon:'📚',
        specialty:'仙文·阵理·推演·古法研究',
        desc:'三界的典籍档案馆，负责保存上古秘闻。任何人族宗门都可求书求典。',
        stance:'绝对中立，只保管知识，不站队参战',
        interventionRule:'不干涉凡界事务，仅提供典籍借阅'
      },
      {
        id:'fengqi', name:'凤栖坞', power:525, tier:'仙界宗门·祥瑞仙宗', icon:'🔥',
        specialty:'凤凰血脉·涅槃·火道·祥瑞',
        desc:'传闻曾有真凤在此栖息，整片山坞染上不灭凤火与祥瑞之气。宗门以凤凰传承闻名。',
        stance:'守护世间火种传承',
        interventionRule:'对玩火的魔族零容忍，但只针对特定情况'
      },
      {
        id:'taixu', name:'太虚堂', power:550, tier:'仙界宗门·虚空仙宗', icon:'🌀',
        specialty:'虚空·空间·挪移·太虚大道',
        desc:'掌握界域通道，长期看守凡界、仙界与魔界之间的空间裂隙。门人极少在凡世现身，其真正底蕴多存在于古籍与传闻之中。',
        stance:'守护三界屏障',
        interventionRule:'只有魔潮大规模爆发时才出手加固裂隙'
      }
    ];

    // 兼容旧代码：旧变量名直接指向 V2 完整数据，不再维护第二份势力表。
    const HUMAN_SECTS = HUMAN_SECTS_FULL;
    const DEMON_FACTIONS = DEMON_FACTIONS_FULL;
    const IMMORTAL_SECTS = IMMORTAL_SECTS_FULL;

    const FACTION_POWER_HIERARCHY = {
      immortal:{level:3,name:'仙人宗门',desc:'久居界外，凡世对其真正底蕴多凭古籍与传闻揣测。'},
      demon:{level:2,name:'魔族势力',desc:'行踪诡秘，手段各异，往往难以用凡界旧例衡量。'},
      human:{level:1,name:'人类宗门',desc:'宗派众多，各守传承，声望与底蕴往往随时代兴衰而变。'}
    };

    // V28.07：三族整体基础战力按仙魔人5:4:2分配。
    // 原始power用于族内权重，战争统一读取归一化后的基础战力。
    const FACTION_CLASS_MULTIPLIER = { human:1, demon:1, immortal:1 };
    const FACTION_BUDGETS_V2807={immortal:5000,demon:4000,human:2000};
    function allocateFactionPowerV2807(list,budget){
      const total=list.reduce((n,f)=>n+Math.max(0,Number(f.power)||0),0);
      if(!list.length||total<=0)return {};
      const rows=list.map((f,i)=>{const exact=budget*Math.max(0,Number(f.power)||0)/total;return {name:f.name,value:Math.floor(exact),remainder:exact-Math.floor(exact),i};});
      let left=budget-rows.reduce((n,r)=>n+r.value,0);
      const order=[...rows].sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
      for(let i=0;i<left;i++)order[i%order.length].value++;
      return Object.fromEntries(rows.map(r=>[r.name,r.value]));
    }
    const FACTION_BASE_V2807={...allocateFactionPowerV2807(IMMORTAL_SECTS_FULL,5000),...allocateFactionPowerV2807(DEMON_FACTIONS_FULL,4000),...allocateFactionPowerV2807(HUMAN_SECTS_FULL,2000)};


    function getFullFactionInfo(name) {
      return HUMAN_SECTS_FULL.find(s=>s.name===name)
        || DEMON_FACTIONS_FULL.find(s=>s.name===name)
        || IMMORTAL_SECTS_FULL.find(s=>s.name===name)
        || null;
    }

    function getFactionByName(name) { return getFullFactionInfo(name); }

    function getFactionType(name) {
      if (HUMAN_SECTS_FULL.some(s=>s.name===name)) return 'human';
      if (DEMON_FACTIONS_FULL.some(s=>s.name===name)) return 'demon';
      if (IMMORTAL_SECTS_FULL.some(s=>s.name===name)) return 'immortal';
      return 'unknown';
    }

    function getFactionGroup(f) {
      if (!f) return 'unknown';
      return getFactionType(f.name);
    }

    function getFactionWorldBasePower(name) {
      const info=getFullFactionInfo(name);
      if(!info) return 0;
      const type=getFactionType(name);
      return FACTION_BASE_V2807[name]||0;
    }

    function getFullTierDescription(name) {
      const info=getFullFactionInfo(name);
      if(!info) return '来历不明';
      const tierMap={
        '人族顶级':'声名极盛，诸宗议事时常会顾及其态度',
        '人族一流':'传承稳固，在修真界颇有名望',
        '人族知名':'立足一方，自有传承与根基',
        '魔族顶级':'凶名久传，真实底蕴鲜有人知',
        '魔族次级':'魔踪盘踞，手段诡谲，不宜轻视',
        '仙界宗门·超然仙宗':'仙踪缥缈，凡世所知多为传闻',
        '仙界宗门·古仙学府':'古籍浩瀚，深浅难以常理揣度',
        '仙界宗门·祥瑞仙宗':'凤火传承久远，外界难窥全貌',
        '仙界宗门·虚空仙宗':'久居界外，关于其底蕴众说纷纭'
      };
      return tierMap[info.tier]||'底蕴未明';
    }

    function getFactionPublicTierLabel(tier) {
      const labels={
        '人族顶级':'声名最盛',
        '人族一流':'名门传承',
        '人族知名':'一方宗派',
        '魔族顶级':'魔威深重',
        '魔族次级':'魔踪盘踞',
        '仙界宗门·超然仙宗':'隐世仙宗',
        '仙界宗门·古仙学府':'古仙学府',
        '仙界宗门·祥瑞仙宗':'祥瑞仙宗',
        '仙界宗门·虚空仙宗':'虚空道统'
      };
      return labels[tier]||'来历未详';
    }

    function getFactionPublicStrengthHint(name) {
      const info=getFullFactionInfo(name);
      if(!info) return '虚实难辨';
      const type=getFactionType(name), p=Number(info.power)||0;
      if(type==='immortal') {
        if(p>=530) return '仙踪罕现，一纸法旨便足以令诸方慎重';
        if(p>=500) return '底蕴藏于界外，凡世难窥其深浅';
        return '传承久远，所学多非凡世修士所能尽知';
      }
      if(type==='demon') {
        if(p>=400) return '魔威沉重，诸宗提及其名多有忌惮';
        if(p>=350) return '凶名远播，少有宗门愿独自与之正面相争';
        if(p>=300) return '势力盘根错节，动向常令边境宗门戒备';
        return '手段诡秘，虚实难测，贸然招惹容易吃亏';
      }
      if(p>=330) return '山门气象鼎盛，门中成名修士辈出';
      if(p>=250) return '根基深厚，声名遍及诸域，门中常有名宿坐镇';
      if(p>=180) return '传承稳固，在一方修真界颇有分量';
      return '经营一域多年，自有不可轻忽的底蕴';
    }

    function getWarOutlook(ratio) {
      ratio=Number(ratio)||0;
      if(ratio>1.8) return {name:'大势在握',color:'#69f0ae',desc:'从已知情报看，我方调度更从容，但战场仍可能生变。'};
      if(ratio>1.2) return {name:'略占上风',color:'#8ee8b0',desc:'我方准备较为充分，若无意外，可主动谋取战机。'};
      if(ratio>0.8) return {name:'胜负难料',color:'#ffd700',desc:'双方各有倚仗，胜负更看临阵发挥与盟友配合。'};
      if(ratio>0.5) return {name:'凶险',color:'#ff9d6b',desc:'敌势颇重，若无援手或额外准备，此战代价恐怕不小。'};
      return {name:'不宜轻启战端',color:'#ff6b6b',desc:'现有情报对我方极为不利，贸然开战近乎以卵击石。'};
    }

    function getLingxiaoBalanceNarrative() {
      const power=getLingxiaoFactionPower();
      const diff=power.qingxuan-power.dazhanglao;
      if(diff>25) return '清玄一脉近来声势明显，占据更多话语权';
      if(diff>10) return '清玄一脉略占上风，但大长老一脉仍有深厚根基';
      if(diff<-25) return '大长老一脉权势正盛，清玄一脉行事愈发谨慎';
      if(diff<-10) return '大长老一脉略占上风，两脉暗中角力不断';
      return '两脉彼此牵制，表面平静，暗流却从未停歇';
    }

    function getFactionRelation(name1,name2) {
      const info1=getFullFactionInfo(name1);
      if(!info1||!info1.relations) return '中立';
      const rel=info1.relations;
      if(rel.ally?.includes(name2)) return '同盟';
      if(rel.enemy?.includes(name2)) return '世仇';
      if(rel.rival?.includes(name2)) return '竞争';
      if(rel.trade?.includes(name2)) return '贸易往来';
      if(rel.wary?.includes(name2)) return '戒备';
      if(rel.seek?.includes(name2)) return '求援/求教';
      return '中立';
    }

    function getFactionFactions(name) {
      return getFullFactionInfo(name)?.internalFactions||[];
    }

    function isDemonAlliance(name) {
      return !!getFullFactionInfo(name)?.isAlliance;
    }

    function factionHierarchyBanner() {
      return `<div style="margin:8px 0 12px;padding:10px 12px;border:1px solid rgba(190,215,255,.3);border-radius:12px;background:linear-gradient(135deg,rgba(150,180,255,.08),rgba(130,40,70,.08),rgba(238,199,106,.06));"><b>🌌 三界势力传闻</b><br><span style="font-size:11px;color:#c8cfda">仙魔大战已持续三万年。夜无疆以逆天魔典破阵，令仙族不得不联手守界。三族整体基础战力：仙族5000（约45.45%）· 魔族4000（约36.36%）· 人族2000（约18.18%）。同族各宗按原有强弱分配。主角成长、盟军、地利、战术和宗门覆灭会改变实际战局。</span></div>`;
    }

    function addFactionReputation(factionName,amount,reason='') {
      if(!player.factionReputation) player.factionReputation={};
      if(!player.factionRelations) player.factionRelations={};
      const old=Number(player.factionReputation[factionName]||0);
      const next=Math.max(-100,Math.min(100,old+(Number(amount)||0)));
      player.factionReputation[factionName]=next;
      checkReputationThreshold(factionName,old,next,reason);
      return next;
    }

    function checkReputationThreshold(factionName,oldRep=0,newRep=null,reason='') {
      const rep=newRep==null?(player.factionReputation?.[factionName]||0):newRep;
      const info=getFullFactionInfo(factionName);
      if(!info) return;
      if(!player.factionRelations) player.factionRelations={};
      if(rep>=80) player.factionRelations[factionName]='ally';
      else if(rep<=-50) player.factionRelations[factionName]='enemy';
      else if(player.factionRelations[factionName]==='ally'||player.factionRelations[factionName]==='enemy') delete player.factionRelations[factionName];

      if(oldRep<80&&rep>=80) {
        showFloatingText?.(`📯 ${factionName}：敬仰`, '#69f0ae');
      } else if(oldRep>-50&&rep<=-50) {
        showFloatingText?.(`⚠️ ${factionName}：敌视`, '#ff6b6b');
      }
    }

    function isHostileToPlayer(factionName) {
      return (player.factionReputation?.[factionName]||0)<=-50;
    }

    function canRequestAid(factionName) {
      const rep=player.factionReputation?.[factionName]||0;
      const info=getFullFactionInfo(factionName);
      if(!info) return false;
      if(getFactionType(factionName)==='immortal') return (player.demonInvasionLevel||0)>=2&&rep>=20;
      return rep>=30;
    }

    function isFactionDestroyed(factionName) {
      return !!player.destroyedFactions?.includes(factionName);
    }

    function destroyFaction(factionName) {
      if(!getFullFactionInfo(factionName)||isFactionDestroyed(factionName)) return false;
      if(!player.destroyedFactions) player.destroyedFactions=[];
      player.destroyedFactions.push(factionName);
      const drops={
        '战神殿':['战阵秘典','血战令'],
        '青鸾宫':['青鸾羽','涅槃丹'],
        '天蚕教':['天蚕丝','万毒丹'],
        '战魂殿':['魂玉','战魂幡']
      };
      const items=drops[factionName]||['灵石','珍稀材料'];
      for(const item of items) player.inventory.push(item);
      showStory(`💀 ${factionName} 已被覆灭！其宝物流入黑市，你获得了 ${items.join('、')}。`,[]);
      autoSave();
      return true;
    }

    const WAR_LEVELS = {
      PEACE:{level:0,name:'和平',desc:'世间安宁，修士潜心修炼'},
      BORDER:{level:1,name:'边境袭扰',desc:'魔族小规模劫掠边境灵脉，单个一流宗门即可抵挡'},
      BATTLE:{level:2,name:'局部会战',desc:'魔族发动攻势，需要人族同盟互相驰援'},
      TOTAL_WAR:{level:3,name:'全域魔灾',desc:'仙魔教主导，魔族全部势力联合入侵人界！'}
    };

    function getWarLevel() { return Math.max(0,Math.min(3,Number(player.demonInvasionLevel)||0)); }

    function getWarLevelInfo() {
      return Object.values(WAR_LEVELS).find(w=>w.level===getWarLevel())||WAR_LEVELS.PEACE;
    }

    function escalateWar(newLevel) {
      const old=getWarLevel();
      newLevel=Math.max(0,Math.min(3,Number(newLevel)||0));
      if(newLevel<=old) return false;
      player.demonInvasionLevel=newLevel;
      const levelInfo=Object.values(WAR_LEVELS).find(w=>w.level===newLevel);
      if(!levelInfo) return false;
      showStory(`<p style="color:#ff6b6b;font-size:20px;font-weight:bold">⚠️ 战争升级！</p><p><b>${levelInfo.name}</b></p><p>${levelInfo.desc}</p>${newLevel===3?'<p style="color:#ff4444">🔥 全域魔灾爆发！人族存亡之际，各大宗门放下恩怨组成联军！</p>':''}`,[{text:'备战',action:'village'}]);
      autoSave();
      return true;
    }

    function isImmortalBlessingActive() {
      const until=Number(player._immortalBlessingUntilDay||0);
      return !!player._immortalBlessing && until>(player.worldTime?.totalDays||0);
    }

    function requestImmortalAid(factionName='太虚堂') {
      const info=getFullFactionInfo(factionName);
      if(!info||getFactionType(factionName)!=='immortal') return;
      if((player.demonInvasionLevel||0)<2) {
        return showStory('当前局势尚不危急，仙人宗门不会介入。',[{text:'返回仙界宗门录',action:'factions_immortal'}]);
      }
      const rep=player.factionReputation?.[factionName]||0;
      if(rep<20) {
        return showStory(`你在【${factionName}】中的声望不足，需要至少 20 声望才能获得正式回应。`,[{text:'返回仙界宗门录',action:'factions_immortal'}]);
      }
      if(factionName==='太岁书院') {
        player._taisuiWarIntel=true;
        autoSave();
        return showStory(`<p>📚 太岁书院回应了请求，却没有遣人直接参战。</p><p style="color:#aaa">“书院不站队参战。但关于界膜裂隙与魔潮的古籍，可借你一阅。”</p><p style="color:#69f0ae">你获得了战略情报：下一场宗门战争中，联军将更容易掌握敌情与战机。</p>`,[{text:'收下典籍',action:'factions_immortal'}]);
      }
      let baseChance=.4+rep/200;
      if(factionName==='太虚堂'&&getWarLevel()>=3) baseChance+=.15;
      const chance=Math.min(.9,baseChance);
      if(Math.random()<chance) {
        player._immortalBlessing=true;
        player._immortalBlessingSource=factionName;
        player._immortalBlessingUntilDay=(player.worldTime?.totalDays||0)+100*GAME_DAYS_PER_YEAR;
        showStory(`<p style="color:#d9e8ff;font-weight:bold">🌌 仙人回应！</p><p>${info.icon} <b>${factionName}</b> 接下了求援。</p><p style="color:#b8c7e8">仙力加固界域屏障，魔族在凡界的整体战争投射能力被削弱。</p><p style="color:#69f0ae">✅ 获得【护界仙阵】：界域受到仙力庇护，魔族在凡界的投射将明显受阻，持续百年。</p>`,[{text:'叩谢仙恩',action:'village'}]);
      } else {
        showStory(`<p style="color:#d9e8ff">${factionName} 此次没有直接出手。</p><p style="color:#aaa">${info.interventionRule||'仙门受天道规则约束，不可轻动。'}</p>`,[{text:'理解',action:'factions_immortal'}]);
      }
      autoSave();
    }

    function getLingxiaoFactionPower() {
      let qingxuanPower=50, dazhanglaoPower=50;
      if(player.romance?.npcs?.suwanqing?.events?.includes('cold_reunion')) qingxuanPower+=5;
      if(player.rivalState?.identityRevealed) dazhanglaoPower+=10;
      if(player.romance?.partner==='suwanqing') qingxuanPower+=15;
      if(player.rivalState?.hasExited) dazhanglaoPower-=10;
      if((player.sectTotalContribution||0)>200) qingxuanPower+=Math.floor((player.sectTotalContribution||0)/50);
      const total=Math.max(1,qingxuanPower+dazhanglaoPower);
      return {qingxuan:Math.round(qingxuanPower/total*100),dazhanglao:Math.round(dazhanglaoPower/total*100)};
    }

    function getLingxiaoDominantFaction() {
      const power=getLingxiaoFactionPower();
      if(power.qingxuan>power.dazhanglao+10) return '清玄一脉';
      if(power.dazhanglao>power.qingxuan+10) return '大长老一脉';
      return '平衡';
    }

    function checkLingxiaoEvent(century=null) {
      if((player.sect||'凌霄宗')!=='凌霄宗') return false;
      const year=Number(century||getGameDate().year);
      if(year<200||year%100!==0) return false;
      if(!player.lingxiaoEventYears) player.lingxiaoEventYears=[];
      if(player.lingxiaoEventYears.includes(year)) return false;
      player.lingxiaoEventYears.push(year);
      const dominant=getLingxiaoDominantFaction();
      const msg=dominant==='清玄一脉'
        ? '<p style="color:#69f0ae">目前清玄一脉占据上风，大长老一脉正在暗中布局。</p>'
        : dominant==='大长老一脉'
          ? '<p style="color:#ff6b6b">大长老一脉已掌控宗门话语权，顾承渊的身份随时可能被公开利用。</p>'
          : '<p style="color:#aaa">两派势均力敌，宗门气氛日益紧张。</p>';
      player._lingxiaoFactionNotice={year,dominant,text:`仙历${year}年百年大比前，凌霄宗两脉暗流加剧。当前：${dominant}`};
      autoSave();
      return true;
    }

    function showLingxiaoFactionBalance() {
      const dominant=getLingxiaoDominantFaction();
      showStory(`<p>⛩️ <b>凌霄宗 · 两脉格局</b></p><p style="color:#c9d8ef">${getLingxiaoBalanceNarrative()}</p><p>当前风向：<b>${dominant}</b></p><p style="color:#aaa;font-size:12px">苏晚晴剧情、顾承渊身份、玩家宗门资历与最终感情选择都会让宗内人心发生变化；具体力量不会以数值公开呈现。</p>`,[{text:'← 返回凌霄宗详情',action:'faction_detail_full',factionName:'凌霄宗'}]);
    }

    function showFullFactionDetail(name) {
      const info=getFullFactionInfo(name);
      if(!info) return showFactionDirectory('human');
      const type=getFactionType(name);
      const tierDesc=getFullTierDescription(name);
      const relations=info.relations||{};
      const factions=info.internalFactions||[];
      const destroyed=isFactionDestroyed(name);
      const rep=player.factionReputation?.[name]||0;
      const dynamicRelation=player.factionRelations?.[name];

      let html=`<p>${info.icon} <b style="font-size:20px">${info.name}</b> ${destroyed?'<span style="color:#ff6b6b">[已覆灭]</span>':''}</p>
        <p style="color:#aaa;font-size:12px">${info.desc}</p>
        <hr style="border-color:rgba(255,255,255,.1)">
        <p>📜 世间评语：<span style="color:#d8c99b">${tierDesc}</span></p>
        <p>🌫️ 山门气象：<span style="color:#b8c7e8">${getFactionPublicStrengthHint(name)}</span></p>
        <p>⚔️ 宗门基础战力：<b style="color:#ffd98a">${getFactionWorldBasePower(name)}</b>${destroyed?' · 已覆灭，实际参战战力为0':''}</p><p style="font-size:12px;color:#b8c7c9">按所属阵营总量与本宗原有强弱分配；战时再计算主角、盟军及其他加成。</p><p>🏷️ 主要传承：${info.specialty}</p>
        ${info.gender?`<p>🚻 门人规则：${info.gender}</p>`:''}
        ${info.isAlliance?'<p>🔗 联盟性质：由多个分支组成</p>':''}
        ${info.isMainSect?'<p>⭐ 主线宗门 · 剧情核心</p>':''}
        ${info.tactics?`<p>🎯 常用战术：${info.tactics}</p>`:''}
        ${info.stance?`<p>🕊️ 立场：${info.stance}</p>`:''}
        ${info.interventionRule?`<p>📜 干预规则：${info.interventionRule}</p>`:''}`;

      if(factions.length) {
        html+='<p style="color:#ffd700;font-weight:bold;margin-top:8px">🏛️ 内部派系</p>';
        for(const f of factions) {
          if(typeof f==='string') html+=`<p style="font-size:12px;color:#b8c7e8">• ${f}</p>`;
          else html+=`<p style="font-size:12px;color:#b8c7e8">• ${f.name}${f.leader?`（${f.leader}）`:''}：${f.desc||''}</p>`;
        }
      }

      if(info.specialEvents?.length) {
        html+='<p style="color:#ffd700;font-weight:bold;margin-top:8px">📖 特殊事件</p>';
        for(const ev of info.specialEvents) html+=`<p style="font-size:12px;color:#cfc4a8">• ${ev}</p>`;
      }

      const relationTypes=[
        {key:'ally',label:'🤝 同盟',color:'#69f0ae'},
        {key:'enemy',label:'⚔️ 世仇',color:'#ff6b6b'},
        {key:'rival',label:'🏁 竞争',color:'#ffd700'},
        {key:'trade',label:'💱 贸易往来',color:'#7ec9ff'},
        {key:'wary',label:'👁️ 戒备',color:'#ffb74d'},
        {key:'seek',label:'📖 求援/求教',color:'#d9b5ec'}
      ];
      let hasRelations=false;
      for(const rt of relationTypes) {
        const list=relations[rt.key]||[];
        if(list.length){hasRelations=true;html+=`<p style="color:${rt.color};font-size:12px">${rt.label}：${list.join('、')}</p>`;}
      }
      if(!hasRelations) html+='<p style="color:#aaa;font-size:12px">暂无明确的对外关系记录</p>';

      html+='<hr style="border-color:rgba(255,255,255,.1)">';
      html+=`<p>📈 你在 ${name} 中的声望：<b style="color:${rep>=30?'#69f0ae':rep>=0?'#ffd700':'#ff6b6b'}">${rep}</b></p>`;
      html+=`<p style="color:#aaa;font-size:11px">与你所属宗门的关系：${getFactionRelation(name,player.sect||'')} ${dynamicRelation?`· ${dynamicRelation==='ally'?'彼此颇为亲近':'关系紧张'}`:''}</p>`;

      const backAction=type==='immortal'?'factions_immortal':type==='demon'?'factions_demon':'factions_human';
      const backText=type==='immortal'?'← 返回仙界宗门录':type==='demon'?'← 返回魔族势力录':'← 返回人族万宗录';
      const choices=[{text:backText,action:backAction}];
      const mapLoc=FACTION_LOCATIONS_V2806[name];
      if(mapLoc){html+=`<p>📍 山门位置：${WORLD_REGIONS[mapLoc.region].name}</p>`;choices.push({text:isRegionUnlocked(mapLoc.region)?'📍 前往宗门山门':`🔒 前往山门需${getRegionUnlockRealmName(mapLoc.region)}境`,action:'faction_navigate_v2806',factionName:name,condition:()=>isRegionUnlocked(mapLoc.region)});}
      choices.push({text:'返回当前地图',action:'return_to_map'});

      if(info.id==='lingxiao') choices.unshift({text:'⛩️ 查看宗内两脉格局',action:'lingxiao_factions'});
      if(type==='immortal'&&(player.demonInvasionLevel||0)>=2) {
        choices.unshift({text:'🌌 向此仙门求援',action:'request_immortal_aid',factionName:name,condition:()=>canRequestAid(name)});
      }
      showStory(html,choices);
    }

    // 保留旧入口名，统一跳到完整版详情。
    function showFactionDetail(name) { return showFullFactionDetail(name); }

    function showFactionDirectory(group='human') {
      let list=[],title='',icon='',color='';
      if(group==='human'){list=HUMAN_SECTS_FULL;title='人族万宗录';icon='📜';color='#ffd700';}
      else if(group==='demon'){list=DEMON_FACTIONS_FULL;title='魔族势力录';icon='☠️';color='#ff6b6b';}
      else {list=IMMORTAL_SECTS_FULL;title='仙界宗门录';icon='🌌';color='#d9e8ff';}

      let html=`<p>${icon} <b style="font-size:18px;color:${color}">${title}</b></p>${factionHierarchyBanner()}`;
      html+=`<p style="color:#aaa;font-size:11px">收录 ${list.length} 个势力 · 阵营基础总战力 ${list.reduce((sum,f)=>sum+getFactionWorldBasePower(f.name),0)} · 当前魔灾：${getWarLevelInfo().name}</p>`;
      if(group==='human') {
        const latest=getLatestTournamentResult();
        if(latest){const top=latest.ranking.slice(0,3);html+=`<p style="color:#ffd98a">📯 最近一届（仙历${latest.century}年）人族大比前三：🥇${top[0]}　🥈${top[1]}　🥉${top[2]}</p>`;}
      }
      html+='<hr style="border-color:rgba(255,255,255,.1)">';
      const tiers=[...new Set(list.map(f=>f.tier))];
      for(const tier of tiers) {
        const items=list.filter(f=>f.tier===tier);
        html+=`<p style="color:${color};font-weight:bold;margin-top:10px">${getFactionPublicTierLabel(tier)}</p>`;
        for(const f of items) {
          const rep=player.factionReputation?.[f.name]||0;
          const repColor=rep>=30?'#69f0ae':rep>=0?'#ffd700':'#ff6b6b';
          const destroyed=isFactionDestroyed(f.name);
          html+=`<div style="margin:4px 0;padding:7px 10px;border:1px solid rgba(255,255,255,.06);border-radius:6px;cursor:pointer;${destroyed?'opacity:.48;':''}" onclick="showFullFactionDetail('${f.name}')">
            <span style="font-size:14px">${f.icon}</span> <b>${f.name}</b><div style="margin:6px 0;color:#ead59e;font-size:14px">⚔️ 基础战力 <strong>${getFactionWorldBasePower(f.name)}</strong>${destroyed?' · 参战0':''}</div>
            <span style="color:#9fa9b8;font-size:10px"> · ${getFactionPublicStrengthHint(f.name)}</span>
            <span style="color:${repColor};font-size:10px;float:right">声望 ${rep}</span>
            ${f.isAlliance?'<span style="color:#ff6b6b;font-size:10px">[联盟]</span>':''}
            ${f.isMainSect?'<span style="color:#ffd700;font-size:10px">[主线]</span>':''}
            ${destroyed?'<span style="color:#ff6b6b;font-size:10px">[已覆灭]</span>':''}
          </div>`;
        }
      }

      const choices=[];
      if(group!=='human') choices.push({text:'👥 查看人类宗门',action:'factions_human'});
      if(group!=='demon') choices.push({text:'☠️ 查看魔族势力',action:'factions_demon'});
      if(group!=='immortal') choices.push({text:'🌌 查看仙人宗门',action:'factions_immortal'});
      choices.push({text:'← 返回',action:'village'});
      showStory(html,choices);
    }

    // 主线剧情章节
    const STORY_CHAPTERS = [
      { id: 0, title: '序章：情断青云', realmRequired:0, description: '旧情断裂之后，在青云村意外获得修仙机缘', completed: false },
      { id: 1, title: '第一章：拜入宗门', realmRequired:1, description: '练气之后，通过考核进入凌霄宗', completed: false },
      { id: 2, title: '第二章：宗门试炼', realmRequired:2, description: '筑基之后完成宗门任务，调查妖魔踪迹', boss: '宗门试炼守将', completed: false },
      { id: 3, title: '第三章：秘境探索', realmRequired:2, description: '筑基境后进入幽冥谷调查', boss: '幽冥鬼王', completed: false },
      { id: 4, title: '第四章：魔影重重', realmRequired:3, description: '金丹境后发现幕后黑手', completed: false },
      { id: 5, title: '第五章：血魔降临', realmRequired:6, description: '炼虚境后迎战血魔老祖', boss: '血魔老祖', completed: false },
      { id: 6, title: '终章：飞升仙界', realmRequired:9, description: '渡劫圆满挑战飞升天劫', completed: false }
    ];
    
    // Boss定义
    const BOSSES = {
      '宗门试炼守将': {
        // 前期主线Boss：以筑基初期可挑战、筑基中期较稳定为基准
        name: '宗门试炼守将', hp: 250, atk: 22, def: 8, gold: 300, exp: 500, phases: 2,
        skills: [
          { name: '宗门剑阵', damage: 1.3, mpCost: 0, phase: 1, desc: '召唤剑阵攻击，威力经过试炼阵法压制' },
          { name: '破军斩', damage: 1.65, mpCost: 0, phase: 2, desc: '守将的压轴斩击，但不会下真正的杀手' }
        ],
        phaseMessages: ['守将神色一肃，拔出背后长剑：“接下来认真一些。”', '守将剑气骤然增强，但试炼阵法同时亮起，压制了杀伤力！']
      },
      '幽冥鬼王': {
        name: '幽冥鬼王', hp: 800, atk: 60, def: 30, gold: 600, exp: 1000, phases: 3,
        skills: [
          { name: '幽冥鬼嚎', damage: 2.0, mpCost: 0, phase: 1, desc: '鬼哭狼嚎，扰乱心智' },
          { name: '噬魂爪', damage: 2.5, mpCost: 0, phase: 2, desc: '利爪攻击，吸取气血' },
          { name: '万鬼缠身', damage: 3.5, mpCost: 0, phase: 3, desc: '召唤万鬼，造成巨大伤害' }
        ],
        phaseMessages: ['鬼王身形变得模糊，阴气更盛！', '鬼王发出凄厉的嚎叫，无数冤魂浮现！', '鬼王完全释放了力量，恐怖的威压笼罩全场！']
      },
      '血魔老祖': {
        name: '血魔老祖', hp: 2000, atk: 100, def: 50, gold: 1500, exp: 3000, phases: 4,
        skills: [
          { name: '血魔噬心', damage: 2.2, mpCost: 0, phase: 1, desc: '血魔之力侵蚀心智' },
          { name: '血海滔天', damage: 2.8, mpCost: 0, phase: 2, desc: '血海覆盖全场' },
          { name: '天魔降临', damage: 3.5, mpCost: 0, phase: 3, desc: '召唤天魔分身' },
          { name: '血魔灭世', damage: 5.0, mpCost: 0, phase: 4, desc: '终极技能，灭世一击' }
        ],
        phaseMessages: ['血魔老祖嘴角露出诡异的笑容！', '血魔老祖身体散发出浓烈的血腥气息！', '血魔老祖双眼变成血红色，恐怖的力量涌动！', '血魔老祖完全释放了血魔之体，准备最后一击！']
      }
    };
    
    // 天劫（渡劫期挑战）
    const TRIBULATION = {
      name: '天劫', hp: 1500, atk: 120, def: 20, gold: 2000, exp: 5000, phases: 3,
      skills: [
        { name: '天劫雷罚', damage: 2.5, mpCost: 0, phase: 1, desc: '天雷降下' },
        { name: '九天玄雷', damage: 3.5, mpCost: 0, phase: 2, desc: '玄雷轰击' },
        { name: '灭世天劫', damage: 4.5, mpCost: 0, phase: 3, desc: '最终天劫' }
      ],
      phaseMessages: ['天空乌云密布，雷声隆隆！', '天劫之力更加强大，雷光闪烁！', '最后一道天劫即将降下！']
    };
    
    const ENEMIES = [
      { name: '野狼', hp: 30, atk: 8, def: 2, gold: 10, exp: 20 },
      { name: '山贼', hp: 50, atk: 12, def: 5, gold: 25, exp: 35 },
      { name: '妖兽', hp: 80, atk: 18, def: 8, gold: 50, exp: 60 },
      { name: '邪修', hp: 120, atk: 25, def: 12, gold: 80, exp: 100 },
      { name: '妖王', hp: 200, atk: 40, def: 20, gold: 150, exp: 180 },
      { name: '魔修', hp: 350, atk: 60, def: 30, gold: 250, exp: 300 },
      { name: '幽冥鬼', hp: 300, atk: 50, def: 25, gold: 200, exp: 250 },
      { name: '鬼将', hp: 500, atk: 80, def: 40, gold: 350, exp: 400 }
    ];
    
    const ITEMS = {
      '神行符':{type:'escape',value:0,desc:'消耗一张，普通野外战必定脱战；首领、天劫、任务、擂台与正魔战禁用。'},
      '破障丹':{type:'breakthrough',desc:'突破预览选用，尝试消耗一颗，成功率+15个百分点'},
      '渡劫丹':{type:'breakthrough',desc:'突破预览选用，尝试消耗一颗，成功率+20个百分点'},
      '九转金丹':{type:'breakthrough',desc:'突破预览选用，尝试消耗一颗，成功率+30个百分点'},
      '养元丹': {type:'longevity',icon:'⏳',desc:'延寿10年；凡人可用，终身限5枚。仙市购买或炼制'},
      '延寿丹': {type:'longevity',icon:'⏳',desc:'延寿50年；筑基可用，终身限3枚。仙市购买或炼制'},
      '万寿丹': {type:'longevity',icon:'⏳',desc:'延寿200年；金丹可用，终身限2枚。仙市购买或炼制'},
      '小还丹': { type: 'heal', value: 30, desc: '恢复30点气血' },
      '大还丹': { type: 'heal', value: 80, desc: '恢复80点气血' },
      '聚灵丹': { type: 'mp', value: 30, desc: '恢复30点灵力' },
      '悟道丹': { type: 'exp', value: 100, desc: '增加100点修为' },
      '天元丹': { type: 'exp', value: 300, desc: '增加300点修为' },
      '铁剑': { type: 'weapon', atk: 5, desc: '攻击+5' },
      '精钢剑': { type: 'weapon', atk: 12, desc: '攻击+12' },
      '灵剑': { type: 'weapon', atk: 25, desc: '攻击+25' },
      '仙剑': { type: 'weapon', atk: 50, desc: '攻击+50' },
      '布衣': { type: 'armor', def: 3, desc: '防御+3' },
      '铁甲': { type: 'armor', def: 8, desc: '防御+8' },
      '灵甲': { type: 'armor', def: 18, desc: '防御+18' },
      '仙甲': { type: 'armor', def: 35, desc: '防御+35' },
      '悟道茶': { type: 'exp', value: 50, desc: '增加50点修为' },
      '天材地宝': { type: 'exp', value: 200, desc: '增加200点修为' }
    };
    


    // ================== 完整装备栏位系统 ==================
    const EQUIPMENT_QUALITIES = {
      MORTAL:{name:'凡品',color:'#9e9e9e',multiplier:1,icon:'○'},
      GOOD:{name:'良品',color:'#4caf50',multiplier:1.3,icon:'◐'},
      FINE:{name:'上品',color:'#2196f3',multiplier:1.6,icon:'◑'},
      EXCELLENT:{name:'精品',color:'#9c27b0',multiplier:2.0,icon:'◒'},
      SPIRIT:{name:'灵宝',color:'#ff9800',multiplier:2.5,icon:'◕'},
      IMMORTAL:{name:'仙器',color:'#ffd700',multiplier:3.2,icon:'✦'},
      GOD:{name:'神器',color:'#ff1744',multiplier:4.0,icon:'★'},
      TIAN_QI:{name:'天器',color:'#ffb347',multiplier:3.2,icon:'✧'},
      SHENG_QI:{name:'圣器',color:'#ff7ab6',multiplier:3.2,icon:'✪'},
      DAO_QI:{name:'道器',color:'#7fe3ff',multiplier:3.2,icon:'☯'}
    };
    const QUALITY_KEYS=['MORTAL','GOOD','FINE','EXCELLENT','SPIRIT','IMMORTAL','TIAN_QI','SHENG_QI','DAO_QI','GOD'];

    const EQUIPMENT_SLOTS = {
      head:{label:'头冠',icon:'👑',type:'armor'}, robe:{label:'法袍',icon:'👘',type:'armor'}, bracer:{label:'护腕',icon:'💪',type:'armor'},
      belt:{label:'腰带',icon:'🔗',type:'armor'}, pants:{label:'道裤',icon:'👖',type:'armor'}, boots:{label:'道靴',icon:'👢',type:'armor'},
      necklace:{label:'项链',icon:'📿',type:'jewelry'}, bracelet:{label:'手镯',icon:'💍',type:'jewelry'}, ring1:{label:'戒指·左',icon:'💍',type:'jewelry'},
      ring2:{label:'戒指·右',icon:'💍',type:'jewelry'}, jade:{label:'玉佩',icon:'🪙',type:'jewelry'}, weapon:{label:'主武器',icon:'⚔️',type:'weapon'},
      offhand:{label:'副手',icon:'🛡️',type:'weapon'}, artifact1:{label:'法宝·天',icon:'🔮',type:'artifact'}, artifact2:{label:'法宝·地',icon:'🔮',type:'artifact'},
      artifact3:{label:'法宝·人',icon:'🔮',type:'artifact'}, flying:{label:'飞行法器',icon:'🪁',type:'artifact'}, lifeArtifact:{label:'本命法宝',icon:'✨',type:'life_artifact'}
    };

    function createEmptyEquipmentSlots(){
      const out={}; for(const key of Object.keys(EQUIPMENT_SLOTS))out[key]=null; return out;
    }

    const EQUIPMENT_DB = {
      '素云冠':{slot:'head',quality:'MORTAL',realmRequired:0,stats:{hp:10,def:2,spirit:1},desc:'普通的道冠，略有灵气'},
      '青云冠':{slot:'head',quality:'GOOD',realmRequired:1,stats:{hp:25,def:5,spirit:3},desc:'青玉雕琢，灵韵内敛'},
      '紫金冠':{slot:'head',quality:'FINE',realmRequired:2,stats:{hp:50,def:10,spirit:6},desc:'紫金铸就，神魂稳固'},
      '玄冰冠':{slot:'head',quality:'EXCELLENT',realmRequired:3,stats:{hp:100,def:18,spirit:12},desc:'玄铁灵玉相合，护佑识海'},
      '天星冠':{slot:'head',quality:'SPIRIT',realmRequired:6,stats:{hp:180,def:30,spirit:20},desc:'凤羽炼化，神魂如焰'},
      '仙君冠':{slot:'head',quality:'IMMORTAL',realmRequired:10,stats:{hp:350,def:55,spirit:35},desc:'仙君遗物，神魂不灭'},

      '素布道袍':{slot:'robe',quality:'MORTAL',realmRequired:0,stats:{hp:20,def:3,mp:10},desc:'粗布道袍，朴素无华'},
      '青云法袍':{slot:'robe',quality:'GOOD',realmRequired:1,stats:{hp:45,def:8,mp:25},desc:'青衫飘逸，灵气流转'},
      '紫云袍':{slot:'robe',quality:'FINE',realmRequired:2,stats:{hp:90,def:16,mp:50},desc:'紫云织就，灵力充盈'},
      '玄冰法袍':{slot:'robe',quality:'EXCELLENT',realmRequired:3,stats:{hp:160,def:28,mp:90},desc:'玄冰蚕丝所织，寒暑不侵'},
      '天星法袍':{slot:'robe',quality:'SPIRIT',realmRequired:6,stats:{hp:280,def:45,mp:160},desc:'天蚕吐丝，灵光自生'},
      '太虚仙袍':{slot:'robe',quality:'IMMORTAL',realmRequired:10,stats:{hp:500,def:80,mp:300},desc:'太虚之气凝结，诸法不侵'},

      '麻布护腕':{slot:'bracer',quality:'MORTAL',realmRequired:0,stats:{atk:2,def:1,block:1},desc:'粗麻护腕，聊胜于无'},
      '铁皮护腕':{slot:'bracer',quality:'GOOD',realmRequired:1,stats:{atk:5,def:3,block:2},desc:'铁皮嵌铜，攻守兼备'},
      '玄冰护腕':{slot:'bracer',quality:'FINE',realmRequired:2,stats:{atk:10,def:6,block:4},desc:'玄钢锻造，力道倍增'},
      '金蛟护腕':{slot:'bracer',quality:'EXCELLENT',realmRequired:3,stats:{atk:18,def:10,block:7},desc:'蛟龙皮所制，刚柔并济'},
      '天星护腕':{slot:'bracer',quality:'SPIRIT',realmRequired:6,stats:{atk:30,def:16,block:12},desc:'星辰铁铸，攻伐无双'},

      '布带':{slot:'belt',quality:'MORTAL',realmRequired:0,stats:{mp:10,hpRegen:1},desc:'普通布带，堪堪束腰'},
      '灵纹腰带':{slot:'belt',quality:'GOOD',realmRequired:1,stats:{mp:30,hpRegen:2},desc:'刻有灵纹，真气流转'},
      '玄冰腰带':{slot:'belt',quality:'FINE',realmRequired:2,stats:{mp:60,hpRegen:4},desc:'玄玉为扣，真气源源'},
      '天星腰带':{slot:'belt',quality:'EXCELLENT',realmRequired:3,stats:{mp:110,hpRegen:7},desc:'蛟龙筋所制，生命力蓬勃'},

      '粗布裤':{slot:'pants',quality:'MORTAL',realmRequired:0,stats:{def:2,dodge:1},desc:'粗布长裤，便于活动'},
      '青云道裤':{slot:'pants',quality:'GOOD',realmRequired:1,stats:{def:5,dodge:3},desc:'青绸裁制，身法轻盈'},
      '云纹裤':{slot:'pants',quality:'FINE',realmRequired:2,stats:{def:10,dodge:5},desc:'云纹暗绣，步法如风'},
      '玄冰道裤':{slot:'pants',quality:'EXCELLENT',realmRequired:3,stats:{def:18,dodge:9},desc:'踏云而行，来去无踪'},

      '草鞋':{slot:'boots',quality:'MORTAL',realmRequired:0,stats:{def:1,speed:5,dodge:1},desc:'草编之履，脚踏实地'},
      '青云履':{slot:'boots',quality:'GOOD',realmRequired:1,stats:{def:3,speed:10,dodge:3},desc:'厚布纳底，步履稳健'},
      '踏风靴':{slot:'boots',quality:'FINE',realmRequired:2,stats:{def:6,speed:18,dodge:5},desc:'踏风而行，身轻如燕'},
      '玄冰履':{slot:'boots',quality:'EXCELLENT',realmRequired:3,stats:{def:12,speed:30,dodge:10},desc:'追云逐月，瞬息千里'},

      '石珠链':{slot:'necklace',quality:'MORTAL',realmRequired:0,stats:{mp:10,crit:1},desc:'石珠串成，微有灵气'},
      '青玉链':{slot:'necklace',quality:'GOOD',realmRequired:1,stats:{mp:25,crit:3},desc:'青玉温润，灵气凝聚'},
      '灵晶链':{slot:'necklace',quality:'FINE',realmRequired:2,stats:{mp:50,crit:6},desc:'灵晶璀璨，灵力充沛'},
      '天星链':{slot:'necklace',quality:'EXCELLENT',realmRequired:3,stats:{mp:90,crit:12},desc:'龙魂残魄寄于其中'},

      '木镯':{slot:'bracelet',quality:'MORTAL',realmRequired:0,stats:{spirit:1,hit:1},desc:'木制手镯，简朴无华'},
      '青云镯':{slot:'bracelet',quality:'GOOD',realmRequired:1,stats:{spirit:3,hit:3},desc:'白玉温润，神魂安宁'},
      '玄金镯':{slot:'bracelet',quality:'FINE',realmRequired:2,stats:{spirit:6,hit:5},desc:'玄金铸造，神魂与命中并重'},
      '凤纹镯':{slot:'bracelet',quality:'EXCELLENT',realmRequired:3,stats:{spirit:12,hit:10},desc:'凤纹暗刻，神魂如凤翱翔'},

      '铁戒':{slot:'ring',quality:'MORTAL',realmRequired:0,stats:{atk:1,critDmg:2},desc:'铁环一枚，聊作装饰'},
      '银戒':{slot:'ring',quality:'GOOD',realmRequired:1,stats:{atk:3,critDmg:5},desc:'银光闪烁，略有煞气'},
      '金戒':{slot:'ring',quality:'FINE',realmRequired:2,stats:{atk:6,critDmg:10},desc:'赤金铸就，锋芒暗藏'},
      '血玉戒':{slot:'ring',quality:'EXCELLENT',realmRequired:3,stats:{atk:12,critDmg:18},desc:'血玉为底，煞气逼人'},

      '石佩':{slot:'jade',quality:'MORTAL',realmRequired:0,stats:{resistance:1,dmgReduce:1},desc:'石质玉佩，古朴无光'},
      '青云佩':{slot:'jade',quality:'GOOD',realmRequired:1,stats:{resistance:3,dmgReduce:2},desc:'青玉含光，万邪不侵'},
      '紫玉佩':{slot:'jade',quality:'FINE',realmRequired:2,stats:{resistance:6,dmgReduce:4},desc:'紫玉生辉，百毒不侵'},
      '龙玉佩':{slot:'jade',quality:'EXCELLENT',realmRequired:3,stats:{resistance:12,dmgReduce:8},desc:'龙纹盘踞，护佑身周'},

      '木剑':{slot:'weapon',quality:'MORTAL',realmRequired:0,stats:{atk:3,crit:1},desc:'桃木削制，略通灵力'},
      '铁剑':{slot:'weapon',quality:'GOOD',realmRequired:1,stats:{atk:8,crit:3},desc:'凡铁铸造，锋芒初显'},
      '精钢剑':{slot:'weapon',quality:'FINE',realmRequired:2,stats:{atk:15,crit:5},desc:'精钢反复锻打，削铁如泥'},
      '灵剑':{slot:'weapon',quality:'EXCELLENT',realmRequired:2,stats:{atk:28,crit:10},desc:'灵铁淬炼，剑光如虹'},
      '仙剑':{slot:'weapon',quality:'SPIRIT',realmRequired:4,stats:{atk:50,crit:18},desc:'仙铁铸造，剑气纵横'},
      '太虚剑':{slot:'weapon',quality:'IMMORTAL',realmRequired:10,stats:{atk:100,crit:30},desc:'太虚之气凝聚，一剑破万法'},

      '木盾':{slot:'offhand',quality:'MORTAL',realmRequired:0,stats:{def:3,block:2},desc:'木制圆盾，聊作防护'},
      '铁盾':{slot:'offhand',quality:'GOOD',realmRequired:1,stats:{def:8,block:5},desc:'铁皮盾牌，格挡有力'},
      '灵盾':{slot:'offhand',quality:'FINE',realmRequired:2,stats:{def:15,block:10},desc:'灵铁铸盾，灵力化壁'},
      '玄冰盾':{slot:'offhand',quality:'EXCELLENT',realmRequired:3,stats:{def:28,block:18},desc:'玄光流转，万法难破'},

      '火葫芦':{slot:'artifact',quality:'FINE',realmRequired:2,stats:{atk:12,fireDmg:8},desc:'葫芦纳火，烈焰滔天'},
      '番天印':{slot:'artifact',quality:'EXCELLENT',realmRequired:3,stats:{atk:25,crit:10},desc:'翻天覆地，势不可挡'},
      '护心镜':{slot:'artifact',quality:'FINE',realmRequired:2,stats:{def:12,dmgReduce:5},desc:'护心宝镜，反射伤害'},
      '缩地尺':{slot:'artifact',quality:'EXCELLENT',realmRequired:2,stats:{speed:30,dodge:8},desc:'缩地成寸，瞬息百里'},
      '九转玲珑塔':{slot:'artifact',quality:'SPIRIT',realmRequired:6,stats:{hp:200,atk:30,def:20},desc:'玲珑九转，镇压诸邪'},

      '飞剑·初':{slot:'flying',quality:'GOOD',realmRequired:2,stats:{speed:40},desc:'初阶飞剑，可御空而行'},
      '青云舟':{slot:'flying',quality:'FINE',realmRequired:2,stats:{speed:70},desc:'青云作舟，遨游九天'},
      '星河梭':{slot:'flying',quality:'EXCELLENT',realmRequired:4,stats:{speed:120},desc:'星河流转，穿梭阴阳'},

      // 旧版防具兼容：保留名称，迁移到法袍槽，避免旧存档装备丢失。
      '布衣':{slot:'robe',quality:'MORTAL',realmRequired:0,stats:{def:3},desc:'旧制布衣，防御+3'},
      '铁甲':{slot:'robe',quality:'GOOD',realmRequired:1,stats:{def:8},desc:'旧制铁甲，防御+8'},
      '灵甲':{slot:'robe',quality:'FINE',realmRequired:2,stats:{def:18},desc:'旧制灵甲，防御+18'},
      '仙甲':{slot:'robe',quality:'SPIRIT',realmRequired:4,stats:{def:35},desc:'旧制仙甲，防御+35'}
    };

    const EQUIPMENT_SET_BONUSES = {
      '青云套装':{items:['青云法袍','青云冠','青云佩','青云道裤','青云镯','青云履'],bonus:{atk:12,def:12,hp:80},tiers:[{count:2,bonus:{hp:30}},{count:4,bonus:{atk:6,def:6}},{count:6,bonus:{atk:6,def:6,hp:50}}],desc:'2/4/6件递进，攻守兼备'},
      '玄冰套装':{items:['玄冰法袍','玄冰冠','玄冰护腕','玄冰腰带','玄冰道裤','玄冰履','玄冰盾'],bonus:{atk:30,def:35,hp:180,resist:15},tiers:[{count:2,bonus:{def:10,hp:60}},{count:4,bonus:{atk:10,def:10,hp:40}},{count:7,bonus:{atk:20,def:15,hp:80,resist:15}}],desc:'2/4/7件递进，满套敌方命中减伤15%'},
      '天星套装':{items:['天星法袍','天星冠','天星护腕','天星腰带','天星道裤','天星履','天星链'],bonus:{atk:55,def:40,hp:260,crit:15,damage:.1},tiers:[{count:2,bonus:{atk:15,hp:60}},{count:4,bonus:{atk:15,def:15,crit:5}},{count:7,bonus:{atk:25,def:25,hp:200,crit:10,damage:.1}}],desc:'2/4/7件递进，满套攻击伤害+10%'}
    };

    EQUIPMENT_DB['天星道裤']={...EQUIPMENT_DB['玄冰道裤']};
    EQUIPMENT_DB['天星履']={...EQUIPMENT_DB['玄冰履']};
    const GEAR_RENAMES_V2790={"青衫法袍": "青云法袍", "青玉冠": "青云冠", "青玉佩": "青云佩", "青绸裤": "青云道裤", "玉镯": "青云镯", "布靴": "青云履", "玄灵冠": "玄冰冠", "玄钢护腕": "玄冰护腕", "玄玉腰带": "玄冰腰带", "踏云裤": "玄冰道裤", "追云履": "玄冰履", "玄光盾": "玄冰盾", "天蚕灵袍": "天星法袍", "凤羽冠": "天星冠", "蛟筋带": "天星腰带", "龙魂链": "天星链"};
    function migrateGearNamesV2790(saved){
      const map=n=>GEAR_RENAMES_V2790[n]||n;
      const worn=Object.values(saved.equipment||{}),star=worn.filter(n=>['天蚕灵袍','凤羽冠','天星护腕','蛟筋带','龙魂链'].includes(n)).length>=3;
      const equipment={...saved.equipment};
      for(const [slot,name] of Object.entries(equipment))equipment[slot]=star&&name==='踏云裤'?'天星道裤':star&&name==='追云履'?'天星履':map(name);
      return {...saved,equipment,equipmentInventory:Array.isArray(saved.equipmentInventory)?saved.equipmentInventory.map(map):saved.equipmentInventory,inventory:Array.isArray(saved.inventory)?saved.inventory.map(map):saved.inventory,equipmentLocks:Array.isArray(saved.equipmentLocks)?[...new Set(saved.equipmentLocks.flatMap(n=>star&&n==='踏云裤'?['玄冰道裤','天星道裤']:star&&n==='追云履'?['玄冰履','天星履']:[map(n)]))]:saved.equipmentLocks};
    }
    const NEW_SETS_V2790={
      '镇岳禅心':{family:'staff',color:'#d2b478',names:['鸿蒙镇岳棍','归寂禅岳袍','定心禅冠','磐石稳云履','镇地玄玉佩'],slots:['weapon','robe','head','boots','jade'],look:['混沌玄棍，山岳古符与墨玉镇岳印，暗金山河微光。','素白玄黑广袖禅袍，暗金镇山纹与玄铁肩甲。','哑白玉冠，一点淡金佛印。','玄黑厚底灵靴，刻镇地固土纹。','墨玉方牌，镌山河符文。'],lore:'上古山神与佛门苦修传承，以地脉之力稳固肉身。',mods:[{atkPct:.30,defPct:.25,reducePct:.18},{defPct:.28,hpPct:.22},{controlResist:.12},{defPct:.12},{hpPct:.16,hpRegen:.08}],tiers:[{count:2,bonus:{resist:4}},{count:4,bonus:{def:25}},{count:5,bonus:{hp:180}}],mechanic:'2件：命中减伤+4%；4件：山河震降低敌人下次命中伤害20%；全套仙器：山河震每场首次施放抵挡下一次命中，另按自身血量比例获得最高10%减伤。'},
      '裂星穿云':{family:'spear',color:'#f1cf9b',names:['九霄寂灭枪','逐星凌劲袍','破云束星冠','掠影追风靴','流星破戒'],slots:['weapon','robe','head','boots','ring'],look:['陨星玄金枪，菱形寒锋与赤金枪缨。','银白劲袍，碎星灵丝轻甲，利落如风。','银玉束冠，中央嵌碎星晶石。','银纹轻底战靴，刻破空纹。','银星指环，嵌陨星碎晶。'],lore:'上古星陨枪修传承，以穿刺和连击破除坚甲。',mods:[{atkPct:.33,pierce:.15},{atkPct:.24},{critDmg:.10},{follow:.12},{crit:.14}],tiers:[{count:2,bonus:{atk:15}},{count:4,bonus:{crit:5}},{count:5,bonus:{atk:40}}],mechanic:'2件：枪击有15%概率追加20%伤害；4件：枪击额外穿透30%防御；全套仙器：对满血敌人枪击伤害+35%，穿云贯日击杀恢复15%最大灵力。'},
      '万象玄霆':{family:'wand',color:'#c5a4ff',names:['九霄玄霆杖','万法霄宸袍','御雷宸冠','踏雷虚宸履','万象雷灵珠'],slots:['weapon','robe','head','boots','jade'],look:['万年雷击神木法杖，紫金雷纹，杖首托雷核宝珠。','紫黑渐变仙袍，广袖织雷纹星图。','紫金雷云法冠，嵌雷晶珠。','紫黑云纹法靴，靴底雷光印。','球形雷玉，内部电光流转。'],lore:'上古雷尊传承，聚天地雷力，以雷云持续轰击强敌。',mods:[{spellPct:.35,thunderPct:.22},{spellPct:.26,mpPct:.25,pierce:.12},{spellCrit:.12},{followSpell:.14},{mpRegen:.18,spellPct:.13}],tiers:[{count:2,bonus:{mp:40}},{count:4,bonus:{atk:20}},{count:5,bonus:{mp:120}}],mechanic:'2件：雷系伤害+15%；4件：雷系命中25%概率麻痹1回合；全套仙器：九霄雷云附加2次持续雷伤，攻击法术有20%概率追加30%伤害。'}
    };
    const GRADES_V2790=[{name:'灵品',quality:'LING_PIN',level:2,scale:.4,cost:600},{name:'宝器',quality:'BAO_QI',level:3,scale:.7,cost:2400},{name:'仙器',quality:'IMMORTAL',level:7,scale:1,cost:9600},
      // Post-地仙 grades extend the existing curve: level 2/3/7 -> 10/12/14, mod scale +.3 per grade,
      // old-set stat curve steps +.6/+.8 -> +1.0/+1.2/+1.4, price x4 per grade. Earlier grades are unchanged.
      {name:'天器',quality:'TIAN_QI',level:10,scale:1.3,statScale:1.42,cost:38400},
      {name:'圣器',quality:'SHENG_QI',level:12,scale:1.6,statScale:1.92,cost:153600},
      {name:'道器',quality:'DAO_QI',level:14,scale:1.9,statScale:2.5,cost:614400}];
    const GRADE_STAT_CURVE_V286838=[1,1.6,2.4,3.4,4.6,6];
    EQUIPMENT_QUALITIES.LING_PIN={name:'灵品',color:'#67e8b5',multiplier:1,icon:'◈'};
    EQUIPMENT_QUALITIES.BAO_QI={name:'宝器',color:'#cc9cff',multiplier:1,icon:'◆'};
    QUALITY_KEYS.splice(4,0,'LING_PIN','BAO_QI');
    function newGearNameV2790(set,i,grade){return `${set}·${NEW_SETS_V2790[set].names[i]}·${GRADES_V2790[grade-1].name}`;}
    const MOD_NAMES_V2790={atkPct:'攻击',defPct:'防御',hpPct:'最大气血',mpPct:'最大灵力',reducePct:'命中减伤',controlResist:'威压控制抵抗',hpRegen:'每次敌方回合结束回血',pierce:'本次攻击穿透',crit:'暴击率',critDmg:'暴击伤害',follow:'枪击追击概率',spellPct:'攻击法术伤害',thunderPct:'雷伤',spellCrit:'法术暴击率',followSpell:'法术追击概率',mpRegen:'每次敌方回合结束回灵'};
    for(const [name,set] of Object.entries(NEW_SETS_V2790)){
      const items=[];
      for(let grade=1;grade<=GRADES_V2790.length;grade++)for(let i=0;i<5;i++){
        const g=GRADES_V2790[grade-1],key=newGearNameV2790(name,i,grade),mods={};
        for(const [k,v] of Object.entries(set.mods[i]))mods[k]=v*g.scale;
        const k=g.statScale??g.scale,stats=i===0?{atk:Math.round(40*k)}:i===1?{def:Math.round(25*k),hp:Math.round(90*k)}:i===2?{def:Math.round(12*k)}:i===3?{def:Math.round(8*k)}:{hp:Math.round(40*k)};
        EQUIPMENT_DB[key]={slot:set.slots[i],quality:g.quality,realmRequired:g.level,stats,modsV2790:mods,familyV2790:name,pieceV2790:i,gradeV2790:grade,weaponFamily:i===0?set.family:undefined,priceV2790:g.cost,desc:set.look[i]+' '+set.lore+' 实装：'+Object.entries(mods).map(([k,v])=>`${MOD_NAMES_V2790[k]}+${Math.round(v*100)}%`).join('、')+'。'};
        if(grade===3)items.push(key);
      }
      const total={};for(const t of set.tiers)for(const [k,v] of Object.entries(t.bonus))total[k]=(total[k]||0)+v;
      EQUIPMENT_SET_BONUSES[name+'套装']={items,tiers:set.tiers,bonus:total,desc:set.mechanic,familyV2790:name};
    }
    function gearModsV2790(){const out={};for(const name of Object.values(player.equipment||{})){for(const [k,v] of Object.entries(getEquipData(name)?.modsV2790||{}))out[k]=(out[k]||0)+v;}return out;}
    function familyStateV2790(name){const p=getSetProgressV2789().find(p=>p.set.familyV2790===name);return {count:p?.count||0,immortal:p?.immortal||false};}
    function weaponFamilyV2790(){return getEquipData(player.equipment?.weapon)?.weaponFamily||'';}
    const gearBattleV2790=new WeakMap();
    function battleGearStateV2790(){let s=gearBattleV2790.get(currentEnemy);if(!s||s.owner!==player){s={owner:player,guardUsed:false,guard:false,weaken:0};gearBattleV2790.set(currentEnemy,s);}return s;}
    function prepareGearSkillV2790(skill){
      const m=gearModsV2790(),spear=weaponFamilyV2790()==='spear'&&(!skill||skill.requiredWeapon==='spear');
      const pierce=Math.min(.85,(skill?.armorPierce||0)+(m.pierce||0)+(spear&&familyStateV2790('裂星穿云').count>=4?.3:0));
      return pierce?{...(skill||{damage:1}),armorPierce:pierce}:skill;
    }
    function gearHitV2790(damage,skill){
      const m=gearModsV2790(),f=weaponFamilyV2790(),tank=familyStateV2790('镇岳禅心'),spear=familyStateV2790('裂星穿云'),wand=familyStateV2790('万象玄霆'),state=battleGearStateV2790();
      const isSpell=!!skill&&['thunder','ice','fire'].includes(skill.element),isSpear=f==='spear'&&(!skill||skill.requiredWeapon==='spear');
      if(isSpell)damage*=1+(m.spellPct||0)+(skill.element==='thunder'?(m.thunderPct||0)+(wand.count>=2?.15:0):0);
      if(isSpear&&spear.immortal&&currentEnemy.hp>=currentEnemy.maxHp)damage*=1.35;
      const chance=isSpear?(m.follow||0)+(spear.count>=2?.15:0):isSpell?(m.followSpell||0)+(wand.immortal?.2:0):0;
      if(Math.random()<Math.min(.6,chance)){damage*=isSpell?1.3:1.2;addCombatLog('✨ 兵装追击追加伤害！','damage');}
      if(f==='staff'&&skill?.requiredWeapon==='staff'){
        if(Math.random()<.25){skipEnemyTurn=true;currentEnemy._skipReason='镇岳震慑';}
        if(tank.count>=4)state.weaken=.2;
        if(tank.immortal&&!state.guardUsed){state.guardUsed=true;state.guard=true;addCombatLog('镇岳霸体：本场首次山河震抵挡下一次命中。','heal');}
      }
      if(skill?.element==='thunder'&&wand.count>=4&&Math.random()<.25){sealEnemySpellsV286817(2);}
      damage=Math.max(1,Math.floor(damage));
      if(skill?.name==='九霄雷云'&&wand.immortal){currentEnemy.thunderDomainDamage=Math.max(currentEnemy.thunderDomainDamage||0,Math.floor(damage*.15));currentEnemy.thunderDomainTurns=Math.max(currentEnemy.thunderDomainTurns||0,2);addCombatLog('九霄雷云：未来两次行动前各结算15%持续雷伤。','damage');notifyThunderVfxV286844('domain','九霄雷云');}
      if(isSpear&&spear.immortal&&skill?.requiredWeapon==='spear'&&damage>=currentEnemy.hp){const before=player.mp;player.mp=Math.min(getMaxMp(),before+Math.floor(getMaxMp()*.15));addCombatLog(`穿云收势，恢复${player.mp-before}灵力。`,'heal');}
      if(f&& !skill)playSkillEffect(f==='staff'?'镇岳山河震':f==='spear'?'穿云贯日':'九霄雷云',f==='wand'?'thunder':'sword','passive');
      return damage;
    }
    function notifyThunderVfxV286844(kind,name,amount=0){try{window.InkSkillFxV2854?.thunderBatch3?.notify(kind,{name,amount,owner:player,target:currentEnemy});}catch(_){}}
    function gearIncomingV2790(damage){
      const state=battleGearStateV2790(),m=gearModsV2790(),t=familyStateV2790('镇岳禅心');
      if(damage<=0)return damage;
      if(state.guard){state.guard=false;addCombatLog('镇岳霸体抵挡本次命中！','heal');return 0;}
      const ratio=Math.min(.6,(m.reducePct||0)+ownerPetTraitBonusV286849('reduce')+(t.immortal?.1*player.hp/getMaxHp():0));
      const out=Math.max(0,Math.floor(damage*(1-ratio)*(1-state.weaken)));state.weaken=0;return out;
    }
    function gearRestoreV2790(){
      if(player.hp<=0)return;const m=gearModsV2790();
      for(const [key,ratio,max] of [['hp',m.hpRegen,getMaxHp()],['mp',m.mpRegen,getMaxMp()]])if(ratio){const n=Math.max(0,Math.min(max-player[key],Math.floor(max*Math.min(.2,ratio))));player[key]+=n;if(n)addCombatLog(`兵装滋养：${key==='hp'?'气血':'灵力'} +${n}`,'heal');}
    }
    function showNewGearShopV2790(family='镇岳禅心',grade=1){
      if(gameState==='combat'||!NEW_SETS_V2790[family]||!GRADES_V2790[grade-1])return;
      const set=NEW_SETS_V2790[family],g=GRADES_V2790[grade-1];
      let html='<h3>三脉仙装坊</h3><p>每套五部位，2/4/5件加成；不同品级可混穿，同部位不重复计数，五件均为仙器才激活终极机制。</p>';
      for(const old of ['青云','玄冰','天星'])html+=`<button class="choice-btn" onclick="showOldGearShopV2792('${old}',${grade})">${old}套装</button>`;
      for(const name of Object.keys(NEW_SETS_V2790))html+=`<button class="choice-btn" onclick="showNewGearShopV2790('${name}',${grade})">${name}</button>`;
      GRADES_V2790.forEach((v,i)=>html+=`<button class="choice-btn" style="color:${getQualityInfo(v.quality).color};border-color:${getQualityInfo(v.quality).color}" onclick="showNewGearShopV2790('${family}',${i+1})">${getQualityInfo(v.quality).icon} ${v.name} · ${CULTIVATION_REALMS[v.level].name}</button>`);
      html+=`<p>${set.mechanic}</p><p>现有灵石：${player.gold}；每件${g.cost}，全套${g.cost*5}灵石。每件单独购买。</p>`;
      for(let i=0;i<5;i++){const name=newGearNameV2790(family,i,grade),item=EQUIPMENT_DB[name];html+=`<div class="gear-grade-card-v2791" style="--gear-color:${getQualityInfo(item.quality).color}"><p><b style="color:var(--gear-color)">${getQualityInfo(item.quality).icon} ${name}</b><br><span class="gear-grade-badge-v2791">${g.name}</span><br>${formatEquipItemStatsV286813(name)}<br>${item.desc}</p><button class="choice-btn" style="color:var(--gear-color);border-color:var(--gear-color)" onclick="buyNewGearV2790('${family}',${i},${grade})" ${player.gold<g.cost||player.level<g.level?'disabled':''}>购买 ${name}</button></div>`;}
      html+='<p>回合制适配：追击代替攻速、一次命中抵挡代替短暂无敌、击杀回灵代替突进刷新；目前不模拟位移范围、击退浮空或Spine骨骼动画。</p>';
      showStory(html,[{text:'返回仙市',action:'market'}]);
    }
    function confirmGearPurchaseV2804(name,cost,qty=1){
      if(!Number.isFinite(cost)||cost<=0||!Number.isInteger(qty)||qty<1||player.gold<cost||typeof window.confirm!=='function')return false;
      const owned=(player.equipmentInventory||[]).filter(n=>n===name).length+(player.inventory||[]).filter(n=>n===name).length+Object.values(player.equipment||{}).filter(n=>n===name).length;
      return window.confirm(`确认购买装备？\n\n${name} ×${qty}\n已持有：${owned}件（含已穿戴）\n本次花费：${cost} 灵石\n购买后剩余：${player.gold-cost} 灵石\n\n确定后才会扣款；取消不购买。`);
    }

    function buyNewGearV2790(family,piece,grade){
      if(gameState==='combat'||!NEW_SETS_V2790[family]||!Number.isInteger(piece)||piece<0||piece>4||!Number.isInteger(grade)||grade<1||grade>GRADES_V2790.length)return;
      const name=newGearNameV2790(family,piece,grade),d=EQUIPMENT_DB[name];if(!canEquipItem(name).ok||player.gold<d.priceV2790)return;
      if(!confirmGearPurchaseV2804(name,d.priceV2790))return;
      player.gold-=d.priceV2790;(player.equipmentInventory||=[]).push(name);autoSave();updateStats();showNewGearShopV2790(family,grade);
    }

    // Old set pieces gain three versions. Baseline embeds the former quality multiplier.
    for(const [family,name,stats] of [
      ['青云','青云流风剑',{atk:20,hit:3}],
      ['玄冰','玄冰凝霜剑',{atk:18,def:4}],
      ['天星','天星逐辰剑',{atk:22,crit:3}]
    ]){
      EQUIPMENT_DB[name]={slot:'weapon',quality:'LING_PIN',realmRequired:2,weaponFamily:'sword',stats,desc:family+'剑修佩剑，可计入对应套装件数；只提供所列属性，无额外冰冻或追击效果。'};
      EQUIPMENT_SET_BONUSES[family+'套装'].items.push(name);
      EQUIPMENT_SET_BONUSES[family+'套装'].desc+='；新增佩剑可替代一件凑齐加成，原激活门槛不变';
    }
    const OLD_SET_VERSIONS_V2792={},OLD_GEAR_ALIASES_V2792={};
    for(const family of ['青云','玄冰','天星']){
      const set=EQUIPMENT_SET_BONUSES[family+'套装'],bases=[...set.items];
      OLD_SET_VERSIONS_V2792[family]=bases;
      for(let i=0;i<bases.length;i++){
        const baseName=bases[i],base=EQUIPMENT_DB[baseName],oldMult=getQualityInfo(base.quality).multiplier;
        for(let grade=1;grade<=GRADES_V2790.length;grade++){
          const g=GRADES_V2790[grade-1],qualityMult=getQualityInfo(g.quality).multiplier,stats={};
          for(const [k,v] of Object.entries(base.stats||{}))stats[k]=Number((v*oldMult*GRADE_STAT_CURVE_V286838[grade-1]/qualityMult).toFixed(6));
          const name=baseName+'·'+g.name;
          EQUIPMENT_DB[name]={...base,quality:g.quality,stats,realmRequired:grade===1?base.realmRequired:Math.max(base.realmRequired,g.level),familyV2790:family,pieceV2790:i,gradeV2790:grade,priceV2790:g.cost,desc:base.desc+'；'+g.name+'版本，同套不同品级可混穿，按部位计件。'};
        }
        OLD_GEAR_ALIASES_V2792[baseName]=baseName+'·灵品';
      }
      set.items=bases.map(n=>n+'·仙器');set.familyV2790=family;set.oldFamilyV2792=true;
    }
    function migrateUnifiedGearV2792(target){
      if(!target)return target;const map=n=>OLD_GEAR_ALIASES_V2792[n]||n;
      if(target.equipment)target.equipment=Object.fromEntries(Object.entries(target.equipment).map(([k,n])=>[k,map(n)]));
      for(const key of ['equipmentInventory','inventory','equipmentLocks'])if(Array.isArray(target[key]))target[key]=target[key].map(map);
      return target;
    }
    function oldVersionNameV2792(family,piece,grade){return OLD_SET_VERSIONS_V2792[family]?.[piece]+'·'+GRADES_V2790[grade-1]?.name;}
    function showOldGearShopV2792(family='青云',grade=1){
      if(gameState==='combat'||!OLD_SET_VERSIONS_V2792[family]||!Number.isInteger(grade)||grade<1||grade>GRADES_V2790.length)return;
      let html='<h3>套装坊 · 三品级成套装备</h3><p>灵品青绿、宝器紫色、仙器金色。旧三套保留原件数与分段加成，混品级可凑套。宝器与仙器提升单件属性。</p>';
      for(const f of Object.keys(OLD_SET_VERSIONS_V2792))html+=`<button class="choice-btn" onclick="showOldGearShopV2792('${f}',${grade})">${f}套装</button>`;
      for(const f of Object.keys(NEW_SETS_V2790))html+=`<button class="choice-btn" onclick="showNewGearShopV2790('${f}',${grade})">${f}</button>`;
      GRADES_V2790.forEach((g,i)=>html+=`<button class="choice-btn" style="color:${getQualityInfo(g.quality).color}" onclick="showOldGearShopV2792('${family}',${i+1})">${g.name}</button>`);
      html+=`<p>现有灵石 ${player.gold}；本套${OLD_SET_VERSIONS_V2792[family].length}件，每件${GRADES_V2790[grade-1].cost}灵石。</p>`;
      OLD_SET_VERSIONS_V2792[family].forEach((_,i)=>{const name=oldVersionNameV2792(family,i,grade),item=EQUIPMENT_DB[name],q=getQualityInfo(item.quality);html+=`<div class="gear-grade-card-v2791" style="--gear-color:${q.color}"><b style="color:var(--gear-color)">${q.icon} ${name}</b><p>${formatEquipItemStatsV286813(name)}</p><p>需${CULTIVATION_REALMS[item.realmRequired].name} · ${item.desc}</p><button class="choice-btn" style="color:var(--gear-color)" onclick="buyOldGearV2792('${family}',${i},${grade})" ${player.gold<item.priceV2790||!canEquipItem(name).ok?'disabled':''}>购买（${item.priceV2790}灵石）</button></div>`;});
      showStory(html,[{text:'返回仙市',action:'market'}]);
    }
    function buyOldGearV2792(family,piece,grade){
      if(gameState==='combat'||!OLD_SET_VERSIONS_V2792[family]||!Number.isInteger(piece)||piece<0||piece>=OLD_SET_VERSIONS_V2792[family].length||!Number.isInteger(grade)||grade<1||grade>GRADES_V2790.length)return;
      const name=oldVersionNameV2792(family,piece,grade),d=EQUIPMENT_DB[name];if(player.gold<d.priceV2790||!canEquipItem(name).ok)return;
      if(!confirmGearPurchaseV2804(name,d.priceV2790))return;
      player.gold-=d.priceV2790;(player.equipmentInventory||=[]).push(name);autoSave();updateStats();showOldGearShopV2792(family,grade);
    }

    const FORGE_KEYS_V2825=new Set();
    let forgeOwnerV2825=null,forgeSelectionV2825=null,forgeNonceV2825=0;
    const FORGE_STATS_V2825={atk:{name:'锋锐',label:'攻击',min:3,max:9},def:{name:'坚壁',label:'防御',min:3,max:8},hp:{name:'长生',label:'气血',min:20,max:60},mp:{name:'灵泉',label:'灵力',min:8,max:20}};
    const FORGE_PERCENT_V286825={atk:{min:1,max:3},def:{min:1,max:3},hp:{min:2,max:5},mp:{min:2,max:5}};
    function forgeRestoreV2825(target){
      if(forgeOwnerV2825===target)return;
      for(const key of FORGE_KEYS_V2825)delete EQUIPMENT_DB[key];FORGE_KEYS_V2825.clear();forgeOwnerV2825=target;
      target.forgeV2825 ||= {next:1,items:{}};
      if(!target.forgeV2825.items||typeof target.forgeV2825.items!=='object')target.forgeV2825.items={};
      for(const [key,record] of Object.entries(target.forgeV2825.items)){
        if(!record||!EQUIPMENT_DB[record.base]||!key.startsWith(record.base+'〔铭器'))continue;
        record.level=Math.max(0,Math.min(10,Math.floor(Number(record.level)||0)));
        record.affixes=forgeCleanAffixesV2825(record.affixes);if(record.pending)record.pending=forgeCleanAffixesV2825(record.pending);
        forgeRegisterV2825(key,record);
      }
    }
    function forgeCleanAffixesV2825(rows){
      const seen=new Set();return (Array.isArray(rows)?rows:[]).filter(a=>a&&FORGE_STATS_V2825[a.stat]&&!seen.has(a.stat)&&seen.add(a.stat)).slice(0,2).map(a=>({stat:a.stat,value:Math.max(1,Math.min((a.unit==='percent'?FORGE_PERCENT_V286825:FORGE_STATS_V2825)[a.stat].max*3,Math.floor(Number(a.value)||1))),...(a.unit==='percent'?{unit:'percent'}:{})}));
    }
    function forgeRegisterV2825(key,record){
      const base=EQUIPMENT_DB[record.base];if(!base)return;
      const stats={...base.stats},multi=getQualityInfo(base.quality).multiplier||1,affixStats={},percentStats={},mods={...base.modsV2790};
      for(const stat of ['atk','def','hp','mp'])if(stats[stat])stats[stat]=Math.round(stats[stat]*(1+record.level*.05)*100)/100;
      for(const a of forgeCleanAffixesV2825(record.affixes)){if(a.unit==='percent'){percentStats[a.stat]=(percentStats[a.stat]||0)+a.value;mods[a.stat+'Pct']=(mods[a.stat+'Pct']||0)+a.value/100;continue;}affixStats[a.stat]=(affixStats[a.stat]||0)+a.value/multi;stats[a.stat]=(stats[a.stat]||0)+a.value/multi;}
      Object.defineProperty(EQUIPMENT_DB,key,{configurable:true,writable:true,enumerable:false,value:{...base,stats,forgeBaseV2825:record.base,forgeLevelV2825:record.level,forgeAffixStatsV2825:affixStats,forgePercentStatsV286825:percentStats,modsV2790:mods}});FORGE_KEYS_V2825.add(key);
    }
    function forgeAllowedV2825(){return gameState!=='combat'&&gameState!=='combat-ending'&&!player.breakthrough?.isAnimating;}
    function forgeGradeV2825(data){
      const declared=Number(data?.gradeV2790),qualityFloor=({BAO_QI:2,EXCELLENT:2,SPIRIT:2,IMMORTAL:3,TIAN_QI:3,SHENG_QI:3,DAO_QI:3,GOD:3})[data?.quality]||1;
      return Math.max(qualityFloor,Number.isInteger(declared)&&declared>=1?Math.min(3,declared):1);
    }
    function forgeAffixTextV2825(rows){return rows?.length?rows.map(a=>`${FORGE_STATS_V2825[a.stat].name} · ${FORGE_STATS_V2825[a.stat].label} +${a.value}${a.unit==='percent'?'%':''}`).join('；'):'暂无词条';}
    function forgeCurrentV2825(nonce){
      const ref=forgeSelectionV2825;if(!ref||ref.owner!==player||nonce!==ref.nonce||!forgeAllowedV2825())return null;
      const name=ref.kind==='slot'?player.equipment?.[ref.index]:player.equipmentInventory?.[ref.index];
      if(name!==ref.name||!getEquipData(name))return null;return ref;
    }
    function showForgeV2825(){
      if(!forgeAllowedV2825())return showFloatingText?.('请先结束战斗或突破。','#ffd76a');
      document.getElementById('equipmentPanel')?.remove();migrateLooseEquipmentToEquipmentInventory(player);
      forgeSelectionV2825=null;const esc=discipleEscV2815;
      let html='<section class="main-overview-v2822"><h3>⚒️ 装备工坊</h3><p>强化最高+10，每级提升原有攻击、防御、气血、灵力5%，成功率100%，不降级。新洗练生成两条不同的百分比词条，先对比再决定替换。强化与洗练均消耗灵石，操作前确认。</p><p>每件单独保存，卸下或换装后保留；加工后自动锁定。相同名称的其他装备不受影响。洗练百分比不乘品质或强化倍率；同类加成与装备百分比相加，作用于角色对应属性。洗练档级按装备品质与档级识别，旧仙器同样按三档；新范围只用于之后的洗练，已有和待选词条原样保留。</p><h4>身上装备</h4>';
      const row=(name,kind,index)=>{const d=getEquipData(name);if(!d)return '';const rec=player.forgeV2825?.items?.[name],q=getQualityInfo(d.quality);return `<article class="task-card"><strong style="color:${q.color}">${esc(name)}${rec?` · +${rec.level}`:''}</strong><p>${esc(formatEquipItemStatsV286813(name))}</p><p>${esc(forgeAffixTextV2825(rec?.affixes))}</p><button class="choice-btn" onclick="selectForgeV2825('${kind}','${index}')">${rec?.pending?'处理待选词条':'强化 / 洗练'}</button></article>`;};
      for(const [slot,name] of Object.entries(player.equipment||{}))if(name)html+=row(name,'slot',slot);
      html+='<details><summary>背包装备 · '+(player.equipmentInventory||[]).length+' 件</summary>';
      (player.equipmentInventory||[]).forEach((name,i)=>html+=row(name,'bag',i));html+='</details></section>';html+='<button class="choice-btn" onclick="showEquipmentPanel()">返回装备</button>';showStory(html,[]);
    }
    function selectForgeV2825(kind,index){
      if(!forgeAllowedV2825()||!['slot','bag'].includes(kind))return;
      forgeRestoreV2825(player);const name=kind==='slot'?player.equipment?.[index]:player.equipmentInventory?.[index];if(!getEquipData(name))return;
      forgeSelectionV2825={owner:player,kind,index,name,nonce:++forgeNonceV2825};renderForgeV2825();
    }
    function renderForgeV2825(){
      const ref=forgeSelectionV2825;if(!ref)return;ref.nonce=++forgeNonceV2825;
      const d=getEquipData(ref.name),record=player.forgeV2825.items[ref.name],level=record?.level||0,grade=forgeGradeV2825(d),cost=100*grade*(level+1),wash=200*grade,esc=discipleEscV2815;
      const base=getEquipData(record?.base||ref.name),next={...base.stats};for(const k of ['atk','def','hp','mp'])if(next[k])next[k]=Math.round(next[k]*(1+(level+1)*.05)*100)/100;
      let html=`<section class="main-overview-v2822"><h3>⚒️ ${esc(ref.name)} · +${level}</h3><p>灵石 ${player.gold} · 品级 ${esc(getQualityInfo(d.quality).name)} · 洗练${grade}档</p><p>当前属性：${esc(formatEquipItemStatsV286813(ref.name))}</p><p>当前词条：${esc(forgeAffixTextV2825(record?.affixes))}</p>`;
      if(record?.pending)html+=`<div class="disciple-claim-v2821"><h4>本次洗练结果（已扣费）</h4><p>${esc(forgeAffixTextV2825(record.pending))}</p>${forgeAdvicePanelV2842(ref,record)}<p>替换后旧词条消失；保留旧词条不退还本次洗练费用。未选择前不能再次洗练或强化。</p><button class="choice-btn" onclick="chooseForgeAffixesV2825(${ref.nonce},true)">替换为新词条</button><button class="choice-btn" onclick="chooseForgeAffixesV2825(${ref.nonce},false)">保留旧词条</button></div>`;
      else html+=`<p>${level<10?`下级基础属性（未含词条）：${esc(formatEquipItemStatsV286813(record?.base||ref.name,next))}`:'强化已满级'}</p><button class="choice-btn" onclick="mutateForgeV2825(${ref.nonce},'enhance')" ${level>=10||player.gold<cost?'disabled':''}>${level>=10?'强化 +10 已满':`强化至 +${level+1} · ${cost}灵石`}</button><p>洗练范围（角色属性百分比）：${Object.entries(FORGE_PERCENT_V286825).map(([k,a])=>`${FORGE_STATS_V2825[k].label} ${a.min*grade}%—${a.max*grade}%`).join('；')}，随机两种。</p><button class="choice-btn" onclick="mutateForgeV2825(${ref.nonce},'wash')" ${player.gold<wash?'disabled':''}>洗练两条属性 · ${wash}灵石</button>`;
      html+='<button class="choice-btn" onclick="showForgeV2825()">返回装备工坊</button></section>';showStory(html,[]);
    }
    function forgeIndividualV2825(ref){
      const state=player.forgeV2825;let record=state.items[ref.name];if(record)return record;
      const base=ref.name;let n=Math.max(1,Math.floor(Number(state.next)||1)),key;
      do{key=base+'〔铭器'+n+++'〕';}while(EQUIPMENT_DB[key]||state.items[key]);state.next=n;
      record={base,level:0,affixes:[],pending:null};state.items[key]=record;
      if(ref.kind==='slot')player.equipment[ref.index]=key;else player.equipmentInventory[ref.index]=key;
      ref.name=key;forgeRegisterV2825(key,record);return record;
    }
    function mutateForgeV2825(nonce,op){
      const ref=forgeCurrentV2825(nonce);if(!ref||!['enhance','wash'].includes(op))return;
      const old=player.forgeV2825.items[ref.name],level=old?.level||0;if(old?.pending||(op==='enhance'&&level>=10))return;
      const grade=forgeGradeV2825(getEquipData(ref.name)),cost=op==='enhance'?100*grade*(level+1):200*grade;
      if(player.gold<cost)return;
      if(!window.confirm(`${op==='enhance'?`强化至 +${level+1}`:'洗练两条词条'}：${ref.name}\n消耗 ${cost} 灵石，剩余 ${player.gold-cost}。${op==='wash'?'结果可选替换或保留，费用不退。':'强化必定成功。'}`))return;
      if(!forgeCurrentV2825(nonce)||player.gold<cost)return;
      const record=forgeIndividualV2825(ref);player.gold-=cost;
      if(op==='enhance')record.level++;
      else{const pool=Object.keys(FORGE_STATS_V2825),rows=[];for(let i=0;i<2;i++){const stat=pool.splice(Math.floor(Math.random()*pool.length),1)[0],range=FORGE_PERCENT_V286825[stat];rows.push({stat,unit:'percent',value:grade*(range.min+Math.floor(Math.random()*(range.max-range.min+1)))});}record.pending=rows;}
      player.equipmentLocks ||= [];if(!player.equipmentLocks.includes(ref.name))player.equipmentLocks.push(ref.name);
      forgeRegisterV2825(ref.name,record);autoSave();updateStats();renderForgeV2825();
    }
    function chooseForgeAffixesV2825(nonce,replace){
      const ref=forgeCurrentV2825(nonce);if(!ref||typeof replace!=='boolean')return;const record=player.forgeV2825.items[ref.name];if(!record?.pending)return;
      if(replace)record.affixes=record.pending;record.pending=null;forgeRegisterV2825(ref.name,record);
      player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());autoSave();updateStats();renderForgeV2825();
    }

    function getEquipData(name){return EQUIPMENT_DB[OLD_GEAR_ALIASES_V2792[name]||name]||null;}
    function getQualityInfo(key){return EQUIPMENT_QUALITIES[key]||EQUIPMENT_QUALITIES.MORTAL;}
    function canEquipItem(itemName){
      const data=getEquipData(itemName); if(!data)return {ok:false,reason:'装备不存在'};
      if((data.realmRequired||0)>(player?.level||0)){const req=CULTIVATION_REALMS[data.realmRequired]?.name||`${data.realmRequired}境`;return {ok:false,reason:`需要${req}才能穿戴`};}
      if(data.slot==='life_artifact'&&(player?.level||0)<3)return {ok:false,reason:'需要金丹境才能祭炼本命法宝'};
      return {ok:true};
    }
    function normalizeEquipmentSlots(savedEq={}){
      const eq=createEmptyEquipmentSlots();
      for(const slot of Object.keys(EQUIPMENT_SLOTS))eq[slot]=savedEq?.[slot]||null;
      if(!eq.robe&&savedEq?.armor)eq.robe=savedEq.armor;
      return eq;
    }
    function migrateLooseEquipmentToEquipmentInventory(target=player){
      if(!target)return;
      forgeRestoreV2825(target);
      migrateUnifiedGearV2792(target);
      if(!Array.isArray(target.equipmentInventory))target.equipmentInventory=[];
      if(!Array.isArray(target.inventory))target.inventory=[];
      const keep=[];
      for(const raw of target.inventory){
        const name=TASK_REWARD_LEGACY_V286838[raw]||raw;
        if(EQUIPMENT_DB[name])target.equipmentInventory.push(name);
        else if(name!==raw&&MATERIALS[name]){if(!target.materials||typeof target.materials!=='object')target.materials={};target.materials[name]=(Number(target.materials[name])||0)+1;}
        else keep.push(name);
      }
      target.inventory=keep;
      if(!target.equipment)target.equipment=createEmptyEquipmentSlots();
      for(const slot of Object.keys(EQUIPMENT_SLOTS)){
        const name=target.equipment[slot];
        if(name&&!EQUIPMENT_DB[name]){target.equipmentInventory.push(name);target.equipment[slot]=null;}
      }
      checkSetBonuses(target);
    }
    function formatEquipStats(stats={}){
      const labels={atk:'攻击',def:'防御',hp:'气血',mp:'灵力',crit:'暴击',critDmg:'爆伤',dodge:'闪避',block:'格挡',resistance:'抗性',dmgReduce:'减伤',speed:'速度',spirit:'神魂',hit:'命中',hpRegen:'回血',fireDmg:'火伤'};
      return Object.entries(stats).map(([k,v])=>`${labels[k]||k}+${Number(Number(v).toFixed(2))}${['crit','critDmg','dodge','block','resistance','dmgReduce','hit','fireDmg'].includes(k)?'%':''}`).join(' · ');
    }

    const SKILLS = [
      { name: '御剑术', mpCost: 10, damage: 1.5, desc: '消耗10灵力，造成1.5倍攻击伤害', element: 'sword' },
      { name: '雷法', mpCost: 20, damage: 2.0, desc: '消耗20灵力，造成2倍攻击伤害', element: 'thunder' },
      // 雷系进阶技能
      { name: '惊雷闪', mpCost: 25, damage: 2.2, desc: '消耗25灵力，造成2.2倍攻击伤害，概率封脉，使目标接下来2次行动无法施展术法或回生', element: 'thunder', effect: 'paralyze', statusChance: 0.42 },
      { name: '裂地奔雷', mpCost: 38, damage: 2.7, desc: '消耗38灵力，造成2.7倍雷伤；当前战斗为单体对决，按单体结算', element: 'thunder', effect: 'thunder_aoe', scope: 'aoe' },
      { name: '紫霄落雷', mpCost: 52, damage: 3.4, desc: '消耗52灵力，造成3.4倍攻击伤害，并穿透45%防御', element: 'thunder', effect: 'armor_pierce', armorPierce: 0.45 },
      { name: '万雷噬狱', mpCost: 68, damage: 4.1, desc: '消耗68灵力，造成4.1倍攻击伤害，并形成持续3回合雷域', element: 'thunder', effect: 'thunder_domain', domainTurns: 3, domainRatio: 0.16, scope: 'aoe' },
      { name: '九天神雷', mpCost: 85, damage: 5.2, desc: '消耗85灵力，造成5.2倍巨额雷伤，并有较高概率眩晕', element: 'thunder', effect: 'stun', statusChance: 0.68, scope: 'all' },
      { name: '闪电链', mpCost: 30, damage: 2.4, desc: '消耗30灵力，造成2.4倍雷伤；多目标战斗可最多弹射4次', element: 'thunder', effect: 'chain', chainCount: 4, scope: 'chain' },
      { name: '雷神附体', mpCost: 45, damage: 0, desc: '消耗45灵力，3回合内雷系伤害+35%，受击反伤25%', element: 'thunder', effect: 'thunder_armor', buffTurns: 3, thunderBonus: 0.35, reflectRatio: 0.25 },
      { name: '无音神雷', mpCost: 60, damage: 3.8, desc: '消耗60灵力，造成3.8倍攻击伤害，并穿透65%防御', element: 'thunder', effect: 'armor_pierce', armorPierce: 0.65, silent: true },
      { name: '剑气纵横', mpCost: 35, damage: 2.5, desc: '消耗35灵力，造成2.5倍攻击伤害', element: 'sword' },
      { name: '万剑归宗', mpCost: 50, damage: 3.5, desc: '消耗50灵力，造成3.5倍攻击伤害', element: 'sword' },
      { name: '天地一剑', mpCost: 80, damage: 5.0, desc: '消耗80灵力，造成5倍攻击伤害', element: 'sword' },
      // 冰系技能
      { name: '寒冰掌', mpCost: 15, damage: 1.6, desc: '消耗15灵力，造成1.6倍伤害，有概率冻结敌人', element: 'ice', effect: 'freeze' },
      { name: '冰封千里', mpCost: 40, damage: 2.8, desc: '消耗40灵力，造成2.8倍伤害，冻结敌人1回合', element: 'ice', effect: 'freeze' },
      { name: '绝对零度', mpCost: 70, damage: 4.0, desc: '消耗70灵力，造成4倍伤害，必定冻结', element: 'ice', effect: 'freeze' },

      { name: '玄冰刺', mpCost: 22, damage: 1.9, desc: '消耗22灵力，1.9倍伤害，减速30%', element: 'ice', effect: 'slow', slow: 0.30 },
      { name: '冰爆术', mpCost: 28, damage: 2.3, desc: '消耗28灵力，2.3倍范围冰伤并降低防御', element: 'ice', effect: 'defDown', defDown: 0.25 },
      { name: '霜寒结界', mpCost: 33, damage: 2.5, desc: '消耗33灵力，群体减速并持续冰伤', element: 'ice', effect: 'iceField', duration: 3 },
      { name: '冰蝶幻舞', mpCost: 36, damage: 2.7, desc: '消耗36灵力，多段攻击并概率短时冻结', element: 'ice', effect: 'multiFreeze', freezeChance: 0.35 },
      { name: '霜龙吐息', mpCost: 48, damage: 3.3, desc: '消耗48灵力，大范围直线冰伤，高额减速', element: 'ice', effect: 'heavySlow', slow: 0.55 },
      { name: '冰河葬狱', mpCost: 56, damage: 3.7, desc: '消耗56灵力，群体禁锢并触发后续冰爆', element: 'ice', effect: 'icePrison', duration: 1 },
      { name: '寒渊领域', mpCost: 64, damage: 4.0, desc: '消耗64灵力，全域压制并持续冻结判定', element: 'ice', effect: 'coldDomain', duration: 3 },
      { name: '冰甲护身', mpCost: 30, damage: 0, desc: '消耗30灵力，玄冰护盾、近身反伤', element: 'ice', effect: 'iceArmor', duration: 3 },
      { name: '冰魄封魂', mpCost: 70, damage: 4.2, desc: '消耗70灵力，冻结神魂并沉默技能', element: 'ice', effect: 'freezeSilence', freezeChance: 1, duration: 1 },
      { name: '万载寒晶', mpCost: 82, damage: 5.1, desc: '消耗82灵力，终极单体爆发并施加长效冰寒侵蚀', element: 'ice', effect: 'eternalIce', freezeChance: 1, duration: 2 },
      // 火系技能
      { name: '烈焰斩', mpCost: 18, damage: 1.8, desc: '消耗18灵力，造成1.8倍伤害，附加灼烧', element: 'fire', effect: 'burn' },
      { name: '焚天烈焰', mpCost: 45, damage: 3.0, desc: '消耗45灵力，造成3倍伤害，持续灼烧3回合', element: 'fire', effect: 'burn' },
      { name: '天火焚世', mpCost: 75, damage: 4.5, desc: '消耗75灵力，造成4.5倍伤害，巨额灼烧', element: 'fire', effect: 'burn' },

      { name: '炎爆术', mpCost: 22, damage: 2.0, desc: '消耗22灵力，单体火伤；灼烧目标会被引爆', element: 'fire', effect: 'burnDetonate' },
      { name: '红莲业火', mpCost: 32, damage: 2.6, desc: '消耗32灵力，持续灼烧并禁疗', element: 'fire', effect: 'healBlockBurn', duration: 3 },
      { name: '火墙术', mpCost: 28, damage: 2.3, desc: '消耗28灵力，持续灼烧并限制移动', element: 'fire', effect: 'fireWall', duration: 3 },
      { name: '三昧真火', mpCost: 42, damage: 3.2, desc: '消耗42灵力，无视部分防御，对邪祟魔修增伤', element: 'fire', effect: 'trueFire', armorPierce: 0.40 },
      { name: '赤焰龙息', mpCost: 58, damage: 3.9, desc: '消耗58灵力，大范围直线火伤并高额灼烧', element: 'fire', effect: 'dragonBurn', duration: 3 },
      { name: '焚心炎', mpCost: 65, damage: 4.2, desc: '消耗65灵力，神魂灼烧并降低敌方输出', element: 'fire', effect: 'atkDownBurn', duration: 3 },
      { name: '燎原火域', mpCost: 72, damage: 4.4, desc: '消耗72灵力，大范围火领域持续群体灼烧', element: 'fire', effect: 'fireDomain', duration: 3 },
      { name: '太阳真火', mpCost: 88, damage: 5.3, desc: '消耗88灵力，终极爆发并必定高额灼烧', element: 'fire', effect: 'sunFire', duration: 4 },
      { name: '流火飞索', mpCost: 35, damage: 2.4, desc: '消耗35灵力，捆缚控制并持续灼烧', element: 'fire', effect: 'fireBind', duration: 2 },
      { name: '炎阳护盾', mpCost: 30, damage: 0, desc: '消耗30灵力，火焰护盾、反伤并提升火伤', element: 'fire', effect: 'fireShield', duration: 3 },
      // 治愈系技能
      { name: '回春术', mpCost: 20, heal: 0.3, desc: '消耗20灵力，恢复30%最大气血', element: 'heal' },
      { name: '生生不息', mpCost: 40, heal: 0.5, desc: '消耗40灵力，恢复50%最大气血', element: 'heal' },
      { name: '起死回生', mpCost: 60, heal: 0.8, desc: '消耗60灵力，恢复80%最大气血', element: 'heal' },

      // V27.85：追加而不插队，保留旧技能索引；明确境界解锁。
      {name:'清风剑诀',element:'sword',mpCost:8,damage:1.35,unlockRealm:0,desc:'消耗8灵力，1.35倍剑伤；凡人自动领悟'},
      {name:'破甲剑罡',element:'sword',mpCost:24,damage:2.1,armorPierce:.5,unlockRealm:1,desc:'消耗24灵力，2.1倍剑伤，本次穿透50%防御；练气解锁'},
      {name:'追魂一剑',element:'sword',mpCost:38,damage:2.8,executeBonus:.5,unlockRealm:2,desc:'消耗38灵力，2.8倍剑伤；目标气血不高于30%时本次伤害增加50%；筑基解锁'},
      {name:'饮血剑诀',element:'sword',mpCost:42,damage:2.7,lifeSteal:.2,unlockRealm:2,desc:'消耗42灵力，2.7倍剑伤；按实际扣血的20%回血，单次最多恢复15%最大气血；筑基解锁'},
      {name:'玄罡护体剑',element:'sword',mpCost:50,damage:3.1,guardRatio:.35,unlockRealm:2,desc:'消耗50灵力，3.1倍剑伤；本场下一次命中伤害降低35%，不可叠加；筑基解锁'},
      {name:'凝露诀',element:'heal',mpCost:8,heal:.15,unlockRealm:0,desc:'消耗8灵力，恢复15%最大气血；凡人自动领悟'},
      {name:'青莲护心',element:'heal',mpCost:26,heal:.25,guardRatio:.3,unlockRealm:1,desc:'消耗26灵力，恢复25%最大气血；本场下一次命中伤害降低30%，不可叠加；练气解锁'},
      {name:'灵泉归元',element:'heal',mpCost:35,heal:.3,mpRestore:12,unlockRealm:2,desc:'先消耗35灵力，恢复30%最大气血和12灵力（净耗23）；筑基解锁'},
      {name:'逆命回元',element:'heal',mpCost:48,heal:.35,emergencyHeal:.65,unlockRealm:2,desc:'消耗48灵力，恢复35%最大气血；施法前气血不高于25%时改为恢复65%；不复活、不延寿；筑基解锁'},
      {name:'莲华济世',element:'heal',mpCost:65,heal:.6,guardRatio:.4,unlockRealm:2,desc:'消耗65灵力，恢复60%最大气血；本场下一次命中伤害降低40%，不可叠加；筑基解锁'}
    ];


    for(const skill of SKILLS){
      if(!['ice','fire'].includes(skill.element))continue;
      const base=`消耗${skill.mpCost}灵力，${skill.damage}倍伤害；`;
      if(['iceArmor','fireShield'].includes(skill.effect)){skill.desc=`消耗${skill.mpCost}灵力，护盾吸收20%最大气血的伤害，持续敌方3次行动，同类不叠加`;continue;}
      if(skill.element==='ice'){
        skill.desc=base+`寒迟2次行动：追击速度降低${skill.effect==='heavySlow'?55:30}%，攻击面板降低${skill.effect==='heavySlow'?27.5:15}%；`;
        const freeze={'冰封千里':80,'绝对零度':100,'冰蝶幻舞':35,'冰河葬狱':100,'冰魄封魂':100,'万载寒晶':100,'寒渊领域':35}[skill.name];
        if(freeze)skill.desc+=`${freeze}%概率冻结下一次行动；`;
        if(skill.effect==='defDown')skill.desc+='防御降低25%，持续敌方2次行动；';
        if(['iceField','coldDomain','eternalIce'].includes(skill.effect))skill.desc+='12%本次伤害的冰蚀，持续3次主动出招；';
        if(skill.effect==='freezeSilence')skill.desc+='封脉1次行动';
      }else{
        skill.desc=base+(skill.effect==='burnDetonate'?'引爆剩余灼烧并消除灼烧破甲':`灼烧每次20%本次伤害，持续${skill.name==='太阳真火'?4:skill.duration||(skill.name==='焚天烈焰'?3:2)}次主动出招，期间防御降低15%，同类取最高`);
        if(skill.armorPierce)skill.desc+='；本次穿透40%防御';
        if(skill.effect==='healBlockBurn')skill.desc+='；灼烧期间禁回生';
        if(skill.effect==='atkDownBurn')skill.desc+='；灼烧期间攻击面板降低15%';
        if(skill.effect==='fireBind')skill.desc+='；缠绕使下次行动追击速度降低30%、攻击面板降低15%';
      }
    }


    SKILLS.push(
      {name:'镇岳山河震',element:'sword',requiredWeapon:'staff',mpCost:35,damage:2.8,unlockRealm:0,desc:'需装备镇岳棍；2.8倍伤害，25%概率震慑1回合，可触发镇岳套装效果'},
      {name:'穿云贯日',element:'sword',requiredWeapon:'spear',mpCost:32,damage:3.0,unlockRealm:0,desc:'需装备裂星枪；3倍伤害，触发枪击穿透、追击与仙器套装收势'},
      {name:'九霄雷云',element:'thunder',requiredWeapon:'wand',mpCost:55,damage:3.8,unlockRealm:0,desc:'需装备玄霆法杖；3.8倍雷伤，全套仙器追加两次15%持续雷伤'}
    );
    // ================== 宗门系统玩法 ==================
    const SECT_TASK_TEMPLATES = [
      { id:'collect_herb', type:'collect', name:'收集灵草', desc:'收集 {count} 株灵草上交宗门', materials:{'灵草':5}, expReward:30, contributionReward:20, goldReward:250 },
      { id:'collect_core', type:'collect', name:'收集妖丹', desc:'收集 {count} 颗妖丹上交宗门', materials:{'妖丹':2}, expReward:60, contributionReward:40, goldReward:500 },
      { id:'collect_fruit', type:'collect', name:'收集仙果', desc:'收集 {count} 颗仙果上交宗门', materials:{'仙果':3}, expReward:40, contributionReward:25, goldReward:350 },
      { id:'combat_monster', type:'combat', name:'清剿妖兽', desc:'击败 {count} 只野外妖兽', killTarget:3, expReward:80, contributionReward:50, goldReward:600 },
      { id:'donate_gold', type:'donate', name:'捐献灵石', desc:'向宗门捐献 {count} 灵石', goldCost:200, expReward:50, contributionReward:30, goldReward:0 },
      { id:'donate_stardust', type:'donate', name:'捐献珍材', desc:'捐献 {count} 份星辰砂', materials:{'星辰砂':1}, expReward:70, contributionReward:45, goldReward:0 }
    ];


    // ================== 宗门任务详细指引 ==================
    // 指引只描述游戏内真实存在的获取方式，并可直接在大地图上设置导航目标。
    const SECT_TASK_GUIDES = {
      collect_herb:{
        goal:'收集 5 株灵草并回宗门任务处提交',
        route:'推荐路线：南域活动 → 沿途采集；想快速完成可直接去【百宝阁】购买。',
        sources:['南域行走时有概率发现灵草','普通怪物胜利后有概率掉落灵草','百宝阁可用 20 灵石/株直接购买'],
        tips:'最省事：灵石充足就去百宝阁；想省钱就在南域活动并顺路打普通怪。',
        poiId:'shop', poiName:'百宝阁'
      },
      collect_core:{
        goal:'收集 2 颗妖丹并回宗门任务处提交',
        route:'推荐路线：前往【迷雾森林】或东域清剿普通灵兽；也可在百宝阁直接购买。',
        sources:['普通怪物胜利后有概率掉落妖丹','野外探索事件有概率获得妖丹','百宝阁可用 100 灵石/颗直接购买'],
        tips:'清剿妖兽任务与妖丹任务可以一起做；打普通怪既能累计击杀，也可能掉妖丹。',
        poiId:'forest', poiName:'迷雾森林'
      },
      collect_fruit:{
        goal:'收集 3 颗仙果并回宗门任务处提交',
        route:'推荐路线：南域活动/普通战斗搜集；需要快速完成可前往【百宝阁】购买。',
        sources:['南域行走时有概率发现仙果','普通怪物胜利后有概率掉落仙果','百宝阁可用 40 灵石/颗直接购买'],
        tips:'缺少数量不多时直接购买最快；不急的话可边做其他任务边积累。',
        poiId:'shop', poiName:'百宝阁'
      },
      combat_monster:{
        goal:'击败 3 只可计数的普通敌人',
        route:'推荐路线：前往【迷雾森林】寻找地图实体怪；南域也有少量低级怪，危险更低。',
        sources:['地图实体普通怪：计数','普通试炼怪：计数','首领、天劫、百年宗门大比对手：不计数'],
        tips:'击杀会自动更新，无需手动提交战利品；达到 3/3 后任务会自动完成并发奖。',
        poiId:'forest', poiName:'迷雾森林'
      },
      donate_gold:{
        goal:'向凌霄宗捐献 200 灵石',
        route:'不需要前往其他地点，灵石足够后在【宗门任务】界面直接提交。',
        sources:['打怪获得灵石','探索获得灵石','宗门战争/任务等奖励获得灵石'],
        tips:'提交会一次性扣除 200 灵石；任务本身不返还灵石，但会获得修为与宗门贡献。',
        poiId:'sect', poiName:'凌霄宗'
      },
      donate_stardust:{
        goal:'捐献 1 份星辰砂',
        route:'最快路线：南域【仙市】→ 稀有法宝材料铺购买；也可尝试越级挑战获取。',
        sources:['仙市·稀有法宝材料铺：300 灵石/份','越级击杀普通敌人时，稀有奖励池有概率出现星辰砂','部分成就/特殊奖励也可能获得'],
        tips:'如果只是为了交宗门任务，直接去仙市购买最稳定。',
        poiId:'market', poiName:'仙市'
      }
    };

    function getSectTaskGuide(task){
      return SECT_TASK_GUIDES[task?.templateId || task?.template?.id] || {
        goal:task?.desc || '完成宗门交代的任务', route:'按任务描述完成目标后返回宗门提交。',
        sources:[],tips:'',poiId:'sect',poiName:'凌霄宗'
      };
    }

    function getSectTaskProgressInfo(task){
      const tpl=task?.template||{};
      if(tpl.type==='combat'){
        const have=Math.max(0,Number(task.progress)||0), need=Math.max(1,Number(task.count)||1);
        return {have,need,missing:Math.max(0,need-have),ready:have>=need,label:`${have}/${need} 只`};
      }
      if(tpl.goldCost){
        const have=Math.max(0,Number(player.gold)||0), need=Math.max(1,Number(tpl.goldCost)||1);
        return {have,need,missing:Math.max(0,need-have),ready:have>=need,label:`${have}/${need} 灵石`};
      }
      const mats=tpl.materials||{};
      const entries=Object.entries(mats);
      if(entries.length){
        const [mat,needRaw]=entries[0], need=Math.max(1,Number(needRaw)||1), have=Math.max(0,Number(player.materials?.[mat])||0);
        return {have,need,missing:Math.max(0,need-have),ready:entries.every(([name,count])=>(Number(player.materials?.[name])||0)>=count),label:`${mat} ${have}/${need}`,material:mat};
      }
      return {have:0,need:1,missing:1,ready:false,label:'未完成'};
    }

    function getSectTaskGuideHtml(task){
      const tpl=task.template||{}, guide=getSectTaskGuide(task), p=getSectTaskProgressInfo(task);
      const reward=`贡献 +${tpl.contributionReward||0}　修为 +${tpl.expReward||0}${tpl.goldReward?`　灵石 +${tpl.goldReward}`:''}`;
      const status=p.ready?'✅ 已满足提交条件':`⏳ 还差 ${p.missing}${p.material?` ${p.material}`:tpl.type==='combat'?' 只':tpl.goldCost?' 灵石':''}`;
      return `<div style="border:1px solid rgba(255,215,0,.32);background:rgba(255,215,0,.035);border-radius:10px;padding:10px;margin:9px 0;line-height:1.65">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="color:#ffe08a">📜 ${tpl.name}</b><span style="font-size:11px;color:${p.ready?'#69f0ae':'#ffd166'}">${status}</span></div>
        <div style="font-size:12px;color:#ddd;margin-top:4px">🎯 <b>任务目标：</b>${guide.goal}</div>
        <div style="font-size:12px;color:#69f0ae">📊 <b>当前进度：</b>${p.label}</div>
        <div style="font-size:12px;color:#7ec9ff">🧭 <b>路线指引：</b>${guide.route}</div>
        ${guide.sources?.length?`<div style="font-size:11px;color:#aaa;margin-top:3px">📦 <b>获取方式：</b><br>${guide.sources.map((s,i)=>`${i+1}. ${s}`).join('<br>')}</div>`:''}
        ${guide.tips?`<div style="font-size:11px;color:#d9b5ec;margin-top:3px">💡 ${guide.tips}</div>`:''}
        <div style="font-size:11px;color:#ffd700;margin-top:4px">🎁 ${reward}</div>
      </div>`;
    }

    function navigateToSectTask(taskIndex){
      const task=player.sectTasks?.[taskIndex];
      if(!task || task.completed){ showSectTasks(); return; }
      const guide=getSectTaskGuide(task);
      const targetRegion=getPoiMapRegion(guide.poiId);
      if(!isRegionUnlocked(targetRegion)){
        const r=getRegionInfo(targetRegion);
        return showStory(`<p>🔒 任务目标位于 <b>${r.name}</b>。</p><p style="color:#ffb6b6">需要达到${getRegionUnlockRealmName(targetRegion)}境后才能前往。</p>`,[{text:'返回任务',action:'sect_tasks'}]);
      }
      if((currentRegion||'south')!==targetRegion){
        travelToWorldMap(targetRegion,guide.poiId);
      }else{
        const poi=FLAT_WORLD?.pois?.find(p=>p.id===guide.poiId);
        if(!poi){showStory('暂时找不到该任务的地图目标。',[{text:'返回任务',action:'sect_tasks'}]);return;}
        closeWorldOverlay(); FLAT_WORLD.target={x:poi.x,y:poi.y}; FLAT_WORLD.keys={};
      }
      FLAT_WORLD._taskNavPoiId=guide.poiId; FLAT_WORLD._taskNavName=guide.poiName;
      showFloatingText(`🧭 已追踪：${guide.poiName}`,'#7ec9ff');
    }

    const SECT_RANKS = [
      { name:'外门弟子', contributionRequired:0, icon:'🟢', desc:'初入宗门，需努力积累贡献' },
      { name:'内门弟子', contributionRequired:100, icon:'🔵', desc:'核心弟子，可进入藏经阁一层' },
      { name:'真传弟子', contributionRequired:300, icon:'🟣', desc:'宗门精英，可学习高阶功法' },
      { name:'长老', contributionRequired:600, icon:'🔶', desc:'宗门执事，可参与宗门决策' },
      { name:'宗主', contributionRequired:1000, icon:'👑', desc:'宗门之主，统御宗门事务' }
    ];

    const SECT_LIBRARY = [
      { skillName:'御剑术', contributionCost:0, requiredRank:'外门弟子' },
      { skillName:'雷法', contributionCost:20, requiredRank:'外门弟子' },
      { skillName:'惊雷闪', contributionCost:35, requiredRank:'外门弟子' },
      { skillName:'闪电链', contributionCost:45, requiredRank:'外门弟子' },
      { skillName:'裂地奔雷', contributionCost:70, requiredRank:'内门弟子' },
      { skillName:'紫霄落雷', contributionCost:95, requiredRank:'内门弟子' },
      { skillName:'雷神附体', contributionCost:125, requiredRank:'真传弟子' },
      { skillName:'无音神雷', contributionCost:155, requiredRank:'真传弟子' },
      { skillName:'万雷噬狱', contributionCost:185, requiredRank:'真传弟子' },
      { skillName:'九天神雷', contributionCost:280, requiredRank:'长老' },
      { skillName:'寒冰掌', contributionCost:25, requiredRank:'外门弟子' },
      { skillName:'玄冰刺', contributionCost:35, requiredRank:'外门弟子' },
      { skillName:'冰爆术', contributionCost:45, requiredRank:'外门弟子' },
      { skillName:'霜寒结界', contributionCost:60, requiredRank:'内门弟子' },
      { skillName:'冰蝶幻舞', contributionCost:70, requiredRank:'内门弟子' },
      { skillName:'霜龙吐息', contributionCost:95, requiredRank:'内门弟子' },
      { skillName:'冰河葬狱', contributionCost:120, requiredRank:'真传弟子' },
      { skillName:'寒渊领域', contributionCost:150, requiredRank:'真传弟子' },
      { skillName:'冰甲护身', contributionCost:80, requiredRank:'内门弟子' },
      { skillName:'冰魄封魂', contributionCost:180, requiredRank:'真传弟子' },
      { skillName:'万载寒晶', contributionCost:240, requiredRank:'长老' },
      { skillName:'烈焰斩', contributionCost:25, requiredRank:'外门弟子' },
      { skillName:'炎爆术', contributionCost:35, requiredRank:'外门弟子' },
      { skillName:'红莲业火', contributionCost:55, requiredRank:'外门弟子' },
      { skillName:'火墙术', contributionCost:45, requiredRank:'外门弟子' },
      { skillName:'三昧真火', contributionCost:85, requiredRank:'内门弟子' },
      { skillName:'赤焰龙息', contributionCost:120, requiredRank:'真传弟子' },
      { skillName:'焚心炎', contributionCost:145, requiredRank:'真传弟子' },
      { skillName:'燎原火域', contributionCost:170, requiredRank:'真传弟子' },
      { skillName:'太阳真火', contributionCost:250, requiredRank:'长老' },
      { skillName:'流火飞索', contributionCost:65, requiredRank:'内门弟子' },
      { skillName:'炎阳护盾', contributionCost:75, requiredRank:'内门弟子' },
      { skillName:'回春术', contributionCost:30, requiredRank:'外门弟子' },
      { skillName:'剑气纵横', contributionCost:50, requiredRank:'内门弟子' },
      { skillName:'冰封千里', contributionCost:60, requiredRank:'内门弟子' },
      { skillName:'焚天烈焰', contributionCost:60, requiredRank:'内门弟子' },
      { skillName:'生生不息', contributionCost:55, requiredRank:'内门弟子' },
      { skillName:'万剑归宗', contributionCost:120, requiredRank:'真传弟子' },
      { skillName:'绝对零度', contributionCost:130, requiredRank:'真传弟子' },
      { skillName:'天火焚世', contributionCost:130, requiredRank:'真传弟子' },
      { skillName:'起死回生', contributionCost:110, requiredRank:'真传弟子' },
      { skillName:'天地一剑', contributionCost:250, requiredRank:'长老' }
    ];

    const SECT_SHOP_ITEMS = [
      { name:'小还丹', cost:10, type:'heal', value:30, desc:'恢复30点气血' },
      { name:'大还丹', cost:30, type:'heal', value:80, desc:'恢复80点气血' },
      { name:'聚灵丹', cost:15, type:'mp', value:30, desc:'恢复30点灵力' },
      { name:'悟道丹', cost:50, type:'exp', value:100, desc:'增加100点修为' },
      { name:'天元丹', cost:120, type:'exp', value:300, desc:'增加300点修为' },
      { name:'灵草', cost:8, type:'material', value:'灵草', desc:'炼丹材料' },
      { name:'妖丹', cost:30, type:'material', value:'妖丹', desc:'炼丹材料' },
      { name:'铁剑', cost:40, type:'weapon', atk:5, desc:'攻击+5' },
      { name:'精钢剑', cost:100, type:'weapon', atk:12, desc:'攻击+12' },
      { name:'灵剑', cost:250, type:'weapon', atk:25, desc:'攻击+25' },
      { name:'布衣', cost:25, type:'armor', def:3, desc:'防御+3' },
      { name:'铁甲', cost:70, type:'armor', def:8, desc:'防御+8' },
      { name:'灵甲', cost:200, type:'armor', def:18, desc:'防御+18' }
    ];

    // 宗门功法改为贡献兑换；旧存档已经学会的技能不会被移除。
    const SECT_LIBRARY_SKILL_NAMES = new Set(SECT_LIBRARY.map(i => i.skillName));


    // ================== 宗门战争系统 ==================
    const WAR_STATUS = {
      PEACE:'和平', MOBILIZING:'动员中', BATTLE:'战斗中', VICTORY:'胜利', DEFEAT:'战败'
    };

    // 战争系统从 27 势力主数据表自动生成，不再维护重复战力表。
    const DEMON_FACTION_POWER = Object.fromEntries(DEMON_FACTIONS_FULL.map(f=>[
      f.name,{basePower:getFactionWorldBasePower(f.name),rawPower:f.power,special:f.specialty,icon:f.icon,tier:f.tier}
    ]));
    const IMMORTAL_FACTION_POWER = Object.fromEntries(IMMORTAL_SECTS_FULL.map(f=>[
      f.name,{basePower:getFactionWorldBasePower(f.name),rawPower:f.power,special:f.specialty,icon:f.icon,tier:f.tier}
    ]));
    const HUMAN_FACTION_POWER = Object.fromEntries(HUMAN_SECTS_FULL.map(f=>[
      f.name,{basePower:getFactionWorldBasePower(f.name),rawPower:f.power,special:f.specialty,icon:f.icon,tier:f.tier}
    ]));

    const WAR_REWARDS = {
      minor:{gold:400, exp:250, contribution:50, desc:'小胜'},
      major:{gold:1000, exp:650, contribution:120, desc:'大胜'},
      total:{gold:2400, exp:1500, contribution:260, desc:'全胜'},
      defense:{gold:200, exp:120, contribution:25, desc:'防守成功'}
    };
    
    // 套装效果定义
    const SET_BONUSES = {
      '青云套装': {
        items: ['青云剑', '青云甲'],
        bonus: { atk: 10, def: 5 },
        desc: '攻击+10，防御+5'
      },
      '玄铁套装': {
        items: ['玄铁剑', '玄铁甲'],
        bonus: { atk: 20, def: 15 },
        desc: '攻击+20，防御+15'
      },
      '紫金套装': {
        items: ['紫金剑', '紫金甲'],
        bonus: { atk: 35, def: 25, crit: 0.1 },
        desc: '攻击+35，防御+25，暴击率+10%'
      },
      '仙灵套装': {
        items: ['仙灵剑', '仙灵甲'],
        bonus: { atk: 60, def: 40, hp: 200, mp: 50 },
        desc: '攻击+60，防御+40，气血+200，灵力+50'
      },
      '神魔套装': {
        items: ['神魔剑', '神魔甲'],
        bonus: { atk: 100, def: 60, crit: 0.2, damage: 0.2 },
        desc: '攻击+100，防御+60，暴击率+20%，伤害+20%'
      }
    };
    
    // 新增套装装备
    const SET_ITEMS = {
      '青云剑': { type: 'weapon', atk: 15, desc: '攻击+15', set: '青云套装' },
      '青云甲': { type: 'armor', def: 10, desc: '防御+10', set: '青云套装' },
      '玄铁剑': { type: 'weapon', atk: 30, desc: '攻击+30', set: '玄铁套装' },
      '玄铁甲': { type: 'armor', def: 25, desc: '防御+25', set: '玄铁套装' },
      '紫金剑': { type: 'weapon', atk: 55, desc: '攻击+55', set: '紫金套装' },
      '紫金甲': { type: 'armor', def: 40, desc: '防御+40', set: '紫金套装' },
      '仙灵剑': { type: 'weapon', atk: 90, desc: '攻击+90', set: '仙灵套装' },
      '仙灵甲': { type: 'armor', def: 70, desc: '防御+70', set: '仙灵套装' },
      '神魔剑': { type: 'weapon', atk: 150, desc: '攻击+150', set: '神魔套装' },
      '神魔甲': { type: 'armor', def: 100, desc: '防御+100', set: '神魔套装' }
    };
    
    // 合并所有物品
    Object.assign(ITEMS, SET_ITEMS);
    
    // 新地图怪物定义
    const LOCATION_ENEMIES = {
      forest: [
        { name: '迷雾狼', hp: 60, atk: 15, def: 5, gold: 25, exp: 45 },
        { name: '毒蛇', hp: 45, atk: 20, def: 3, gold: 20, exp: 40 },
        { name: '迷雾妖', hp: 90, atk: 25, def: 12, gold: 40, exp: 70 },
        { name: '千年树妖', hp: 150, atk: 35, def: 20, gold: 80, exp: 120 }
      ],
      battlefield: [
        { name: '亡灵战士', hp: 180, atk: 45, def: 25, gold: 80, exp: 150 },
        { name: '战魂', hp: 250, atk: 60, def: 35, gold: 120, exp: 200 },
        { name: '古代将军', hp: 400, atk: 80, def: 50, gold: 200, exp: 350 },
        { name: '战神残魂', hp: 600, atk: 120, def: 70, gold: 350, exp: 600 }
      ],
      secret: [
        { name: '守阵傀儡', hp: 300, atk: 70, def: 40, gold: 150, exp: 250 },
        { name: '秘境守护者', hp: 500, atk: 100, def: 60, gold: 250, exp: 400 },
        { name: '远古妖兽', hp: 800, atk: 140, def: 80, gold: 400, exp: 700 }
      ]
    };
    
    // 地图Boss定义
    const LOCATION_BOSSES = {
      'forest': {
        name: '迷雾领主', hp: 500, atk: 60, def: 30, gold: 400, exp: 600, phases: 2,
        skills: [
          { name: '迷雾笼罩', damage: 2.0, mpCost: 0, phase: 1, desc: '迷雾遮蔽视野' },
          { name: '狂暴撕咬', damage: 3.0, mpCost: 0, phase: 2, desc: '疯狂攻击' }
        ],
        phaseMessages: ['迷雾领主发出低沉的咆哮！', '迷雾领主双眼泛红，进入狂暴状态！']
      },
      'battlefield': {
        name: '战神之魂', hp: 1000, atk: 100, def: 50, gold: 800, exp: 1200, phases: 3,
        skills: [
          { name: '战意斩', damage: 2.2, mpCost: 0, phase: 1, desc: '战神一击' },
          { name: '千军破', damage: 2.8, mpCost: 0, phase: 2, desc: '横扫千军' },
          { name: '灭世一击', damage: 4.0, mpCost: 0, phase: 3, desc: '终极一击' }
        ],
        phaseMessages: ['战神之魂战意更盛！', '战神之魂召唤万千战魂！', '战神之魂准备释放终极一击！']
      },
      'secret': {
        name: '秘境之主', hp: 1500, atk: 130, def: 60, gold: 1200, exp: 2000, phases: 3,
        skills: [
          { name: '空间撕裂', damage: 2.5, mpCost: 0, phase: 1, desc: '撕裂空间' },
          { name: '元素风暴', damage: 3.2, mpCost: 0, phase: 2, desc: '元素之力爆发' },
          { name: '虚空灭世', damage: 5.0, mpCost: 0, phase: 3, desc: '毁灭一切' }
        ],
        phaseMessages: ['秘境之主开始调动天地之力！', '秘境之主召唤元素风暴！', '秘境之主即将毁灭一切！']
      }
    };
    
    // ================== Boss数据统一读取 ==================
    // 主线Boss位于 BOSSES，地图Boss位于 LOCATION_BOSSES。统一入口避免地图Boss回合读取不到技能而卡死。
    const YEWUJI_LORE_V2810='仙魔大战，已持续三万年。仙族曾以诸天大阵将魔族阻于界外，人族则在漫长战火中守护故土。魔族天才夜无疆从一次次败战中悟道，融汇五大魔门禁法，开创逆天魔典，接连击碎仙族封锁。仙族整体仍强，却无人能独自压制他，只能五大仙门联手守界。旧战末期，他为突破魔典桎梏，自斩本源、转生重修。如今他与你同世争道，前期领先你一个大境界。然而逆天魔典以破坏仙阵为道，残缺本源已无法承载完整圣道；即使转生重修，他最终也只能止步半圣，永远无法成圣。待你越过这道门槛，便能真正超越这位宿敌。';
    function createYeWujiV2810(){
      const cap=CULTIVATION_REALMS.findIndex(r=>r.name==='准圣');
      const playerLevel=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(player.level)||0));
      const stage=Math.min(cap*4+3,playerLevel*4+Math.max(0,Math.min(3,Number(player.phase)||0))+4);
      const level=Math.floor(stage/4),phase=stage%4;
      const r=CULTIVATION_REALMS[level],scale=1+phase*.02;
      const hp=Math.round((180+r.hpBonus*3)*3.2*scale);
      return {name:'夜无疆',hp,maxHp:hp,atk:Math.round((18+r.atkBonus*.9)*1.3*scale),def:Math.round((8+r.defBonus*.85)*1.25*scale),gold:0,exp:0,phases:3,_realmLevel:level,_realmPhase:phase,_nightRivalV2810:true,_isTaskBattle:true,
        skills:[{name:'逆天·破阵指',damage:1.25,armorPierce:.25},{name:'无疆·裂界掌',damage:1.5,armorPierce:.35},{name:'魔典·万法归寂',damage:1.8,armorPierce:.45}],
        phaseMessages:['“三万年里，我见过太多不肯退的人。你又能走多远？”','玄金魔纹亮起，夜无疆抬手撕开护阵：“这一招，看仔细了。”','残阵崩散，夜无疆终于正视你：“很好。你有资格与我争道。”'],desc:'逆天魔典传人 · 前期领先一境，最终止步半圣圆满，无法成圣。'};
    }
    function getEnemyRealmNameV2811(enemy){
      const level=Number(enemy?._realmLevel)||0,phase=Math.max(0,Math.min(3,Number(enemy?._realmPhase)||0));
      if(enemy?._nightRivalV2810&&CULTIVATION_REALMS[level]?.name==='准圣')return `半圣${REALM_PHASES[phase]}（无法成圣）`;
      return getCultivationName(level,phase);
    }
    function yeChaptersV2816(){return [
      {level:1,title:'雨夜留名',place:'青云村外',body:'雨幕里，一名玄衣修士立在断桥上。追来的魔修看清他的背影，竟齐齐退入山林。你握紧兵刃，他却只看向你尚未稳固的灵息。\n“这点修为，也敢拦路？”他问。桥后还有未及撤走的村民。你没有让开。\n玄衣人忽然笑了：“记住，夜无疆。等你有资格问我的来意，再来找我。”',options:['先护送村民','记下他的气息'],responses:['你回身引村民渡河。再抬头时，断桥上的身影已不见，只留一道替众人挡住山洪的掌痕。','你没有贸然追去，将那缕锋锐魔息记入心中。夜无疆隔雨回首，像是察觉了你的打算。']},
      {level:2,title:'旧战碑',place:'北域残碑林',body:'石碑上的战名一层压着一层，最早的刻痕已有三万年。碑前，夜无疆拂去一行被刻意凿毁的名字。\n“三万年，仙族有更多山门、更多灵脉。可阵中死去的人，并不比魔族少。”\n你问他为何要毁仙阵。他答：“他们用阵续命，我用人命破阵。你若觉得两边都错，就拿出第三条路。”',options:['追问无辜者的代价','追问破阵的办法'],responses:['“你还记得问这个，便别忘。”他的语气冷下来，“有一天，你也会被人逼着在两群人之间选择。”','他在碑前划下一线：“阵眼不一定在最亮的地方。凡被保护得最好的，也可能只是饵。”你记住了这句话。']},
      {level:4,title:'魔典残页',place:'玄煞魔域边境',body:'一页黑金经文悬在荒台上，四周草木已枯。夜无疆将它合拢，掌心仍留着无法愈合的裂痕。\n“这就是仙族也压不住你的原因？”你问。\n“逆天魔典。”他并不掩饰，“它让我越过许多本不该越过的关口。每越一次，便从本源中剜去一部分。”\n你终于明白，三万年前那位破阵者的强大，并非没有代价。',options:['劝他停下魔典','问他是否后悔'],responses:['夜无疆收起残页：“我已经停得太晚。你还来得及选自己的路。”','他望着远处的旧战场，许久才答：“若再来一次，我仍会去破那座阵。但未必再用同一种办法。”']},
      {level:7,title:'重修之身',place:'裂界台',body:'你指出他的气息与古碑所载并不相同。夜无疆没有否认。\n“昔年之身，我亲手斩去了。如今是转生后重修的肉身，旧术还在，本源的伤也还在。”\n风穿过空台。他第一次认真审视你的修行：“你每向前一步，我也会往前走。可我不能保证，这条路永远还有下一步。”',options:['约定再战','询问修复本源'],responses:['你以剑鞘点地。他答：“好。下次相见，不必让我再等你出招。”','“我找过。”他只说了三个字。你没有继续问，从那片沉默里听出了漫长的年月。']},
      {level:10,title:'仙门之外',place:'九霄仙境边界',body:'飞升之后，你看见仙门之外仍有旧战阵。夜无疆站在界外，仙族守阵者严阵以待，却无人轻易动手。\n“仙界也没有结束这场战争。”你说。\n他望向你的新生仙躯：“境界变了，人未必变。别把飞升当成答案。”\n你们隔着界线立下约定：下一次论道，由彼此的修行作答。',options:['以护道为答','以求道为答'],responses:['“若你要护住身后的人，就别只学会赢。”夜无疆退入界外雾中。','“那便走到尽头给我看。”他掌心的裂纹闪了一瞬，又被衣袖遮住。']},
      {level:14,title:'半圣天堑',place:'寂灭古台',body:'夜无疆的威压已抵半圣圆满，却在最后一道关口前骤然止住。逆天魔典化作碎页，本源裂隙横贯灵台。\n“准圣，也就是你们所说的半圣。到这里为止。”他平静得出奇。\n你提出再寻续路之法。他摇头：“这不是少一味灵药，也不是再闭关万年。我的本源已无法承载圣位。”\n这一刻，你知道他的境界不会再随你提升。',options:['承诺走过这道关口','尊重他的选择'],responses:['你说，要亲眼看一看圣境之后的天地。他没有笑，只道：“去。别在我止步的地方也停下来。”','你收起劝说，与他并肩坐在古台。沉默不再像初见时那样锋利。']},
      {level:16,title:'道途终有别',place:'成圣之后',body:'你的气息越过圣境关口，夜无疆却仍是半圣圆满。曾经总走在前方的宿敌，如今停在了你的来路上。\n“终于轮到我看你的背影。”他展开掌势，旧日破阵的锋芒仍未消散。\n境界的差距并不等于一场已经赢下的战斗。你们约定最后一次正式论道，胜负交给交手本身。',options:['应下论道之约','先说这些年的见闻'],responses:['你郑重应下。这场约战不会因对话自动获胜；准备好后，可从人物页发起挑战。','你讲起飞升路上的人和事。他耐心听完，再次起身：“这些很好。现在，让我看看你的道。”']},
      {level:16,win:true,title:'无疆有岸',place:'胜负之后',body:'这一次交手，你确实击退了夜无疆。他收住掌势，没有再催动那本残破魔典。\n“我以为无疆，就是前面永远有路。”他说，“后来才知道，有些路走到这里便是尽头。”\n你没有替他许下不可能的圣位。他也不再掩饰半圣圆满的极限。三万年战争留下的伤痕仍需世人处理，而你们之间的胜负，终于有了答案。',options:['保留宿敌之约','以道友相称'],responses:['“往后若要再战，我仍在裂界台。”夜无疆转身离开。你们仍可切磋，他的境界不会再增长。','你向他行了一礼。他怔了片刻，回以同礼。裂界台仍可再访、再战，只是称呼已有不同。']}
    ];}
    function yeStateV2816(){
      const p=player.yewujiStoryV2816 ||= {choices:[],saintVictory:false};
      if(!Array.isArray(p.choices))p.choices=[];
      let n=0;while(n<8&&(p.choices[n]===0||p.choices[n]===1))n++;p.choices=p.choices.slice(0,n);
      return p;
    }
    function yeStoryAvailableV2816(index){const ch=yeChaptersV2816()[index],p=yeStateV2816();return !!ch&&Number.isInteger(index)&&index>=0&&index<=p.choices.length&&player.level>=ch.level&&(!ch.win||p.saintVictory===true);}
    function showYeChronicleV2816(){
      if(gameState==='combat'||gameState==='combat-ending')return;
      const p=yeStateV2816(),chapters=yeChaptersV2816();
      let html=`<section class="home-board-v2812"><h3>📜 夜无疆 · 宿敌纪事</h3><p>已完成 ${p.choices.length} / ${chapters.length} 章</p><p>随境界按顺序解锁；旧角色可补看前章。阅读不推进日期、不扣寿元，不影响现有主线。选择会保存在纪事中，已完成章节可回看。</p><div class="home-grid-v2812">`;
      chapters.forEach((ch,i)=>{const done=i<p.choices.length,open=yeStoryAvailableV2816(i);html+=`<article><h4>${i+1}. ${ch.title}</h4><p>${ch.place} · ${CULTIVATION_REALMS[ch.level].name}解锁</p><p>${done?'已完成 · '+ch.options[p.choices[i]]:open?'可以相遇':ch.win&&!p.saintVictory?'需先完成前章，并在圣人境实际击退夜无疆':'需达到境界并完成前章'}</p><button class="choice-btn" onclick="showYeChapterV2816(${i})" ${open?'':'disabled'}>${done?'回看纪事':'前往相遇'}</button></article>`;});
      html+='</div><p>另有「旧关回望」「残页余响」两篇番外，随相关主线完成开放。</p><button class="choice-btn" onclick="showExpansionV286827()">人物番外与旧案</button></section>';showStory(html,[{text:'返回夜无疆人物页',action:'yewuji_v2810'},{text:'前往挑战',action:'challenge_yewuji_v2810'},{text:'返回地图',action:'return_to_map'}]);
    }
    function showYeChapterV2816(index){
      if(gameState==='combat'||gameState==='combat-ending'||!yeStoryAvailableV2816(index))return;
      const ch=yeChaptersV2816()[index],p=yeStateV2816(),done=index<p.choices.length;
      let html=`<section class="home-board-v2812"><h3>${ch.title}</h3><p>${ch.place}</p>${ch.body.split('\n').map(t=>'<p>'+t+'</p>').join('')}`;
      if(done)html+=`<p class="home-notice-v2812">你的选择：${ch.options[p.choices[index]]}</p><p>${ch.responses[p.choices[index]]}</p>`;
      else ch.options.forEach((text,i)=>html+=`<button class="choice-btn" onclick="chooseYeChapterV2816(${index},${i})">${text}</button>`);
      showStory(html+'</section>',[{text:'返回宿敌纪事',action:'yewuji_story_v2816'}]);
    }
    function chooseYeChapterV2816(index,option){
      if(gameState==='combat'||gameState==='combat-ending'||(option!==0&&option!==1)||!yeStoryAvailableV2816(index))return;
      const p=yeStateV2816();if(index!==p.choices.length)return;
      p.choices.push(option);autoSave();showYeChapterV2816(index);
    }

    function showYeWujiV2810(){
      if(gameState==='combat'||gameState==='combat-ending')return;
      const e=createYeWujiV2810();
      showStory(`${jevEntryV2846('jevRivalV2849()','Jev 宿敌应对')}<section class="yewuji-card-v2810"><img src="./portrait-yewuji-v2810.webp" alt="夜无疆，玄黑暗金长袍立于破碎仙阵前" width="640" height="960" loading="lazy"><div><p>魔族共尊 · 逆天魔典</p><h3>夜无疆</h3><p>${YEWUJI_LORE_V2810}</p></div></section><p>你的境界：${getCultivationName()}<br>夜无疆：<b>${getEnemyRealmNameV2811(e)}</b></p><p>气血 ${e.hp} · 攻击 ${e.atk} · 防御 ${e.def}</p><p>境界极限：半圣圆满（对应现有准圣），永久无法突破圣人；到达极限后，主角继续成长也不会再提高他的属性。</p><p>三阶段招式：破阵指 → 裂界掌 → 万法归寂，逐步加强伤害与破甲。</p><p>备战建议：先到北域灵泉补满气血与灵力；储物袋备好大还丹或玄玉护脉丹；功法栏放入青莲护心、莲华济世或玄罡护体剑，在「万法归寂」前抵挡一次重击。战败不影响主线进度，可整备后再试。</p><p>这是宿敌挑战，可自行决定何时尝试。胜利代表击退，夜无疆不会永久死亡；本次不发放灵石和修为。战败沿用普通战斗扣款规则。</p>`,[{text:'📜 宿敌纪事 · '+yeStateV2816().choices.length+'/8章',action:'yewuji_story_v2816'},{text:'⚔️ 挑战夜无疆',action:'challenge_yewuji_v2810'},{text:'☠️ 前往玄煞魔域',action:'travel_world_map',regionId:'demon_domain',condition:()=>isRegionUnlocked('demon_domain')},{text:'返回地图',action:'return_to_map'}]);
    }
    function challengeYeWujiV2810(){
      if(gameState==='combat'||gameState==='combat-ending'||COMBAT_FINISH_V2764.settling)return;
      const e=createYeWujiV2810();
      if(!window.confirm(`挑战夜无疆（${getEnemyRealmNameV2811(e)}）？\n气血 ${e.hp} · 攻击 ${e.atk} · 防御 ${e.def}\n无灵石与修为奖励；战败按原规则扣款。`))return;
      startCombat(e,true,false);
    }

    function getCombatBossData(enemy = currentEnemy) {
      if(enemy?._nightRivalV2810)return enemy;
      if (isTribulation) return TRIBULATION;
      const name = enemy?.name;
      if (!name) return null;
      return BOSSES[name] || LOCATION_BOSSES[name] || null;
    }

    // ================== 炼丹系统数据 ==================
    
    // 材料类型
    const MATERIALS = {
      '灵草': { type: 'herb', desc: '常见灵草，炼丹基础材料', icon: '🌿' },
      '仙果': { type: 'fruit', desc: '蕴含灵气的果实', icon: '🍎' },
      '妖丹': { type: 'core', desc: '妖兽内丹，蕴含强大能量', icon: '🔮' },
      '血玉': { type: 'stone', desc: '血色玉石，炼制高级丹药材料', icon: '💎' },
      '天心草': { type: 'herb', desc: '稀世灵草，蕴含天地精华', icon: '🌱' },
      '龙血果': { type: 'fruit', desc: '龙血浇灌的灵果', icon: '🍒' },
      '魔核': { type: 'core', desc: '魔物核心，力量源泉', icon: '✴️' },
      '星辰砂': { type: 'stone', desc: '星辰陨落所化，珍贵无比', icon: '✨' },
      // 四域特产
      '雪莲': { type: 'herb', desc: '北域雪线之上生长的灵药', icon: '🌸' },
      '冰晶石': { type: 'stone', desc: '蕴含寒冰灵力的晶石', icon: '🧊' },
      '万年寒玉': { type: 'stone', desc: '万年冰脉孕育的寒玉', icon: '💠' },
      '仙灵草': { type: 'herb', desc: '沾染仙灵之气的珍稀灵草', icon: '🌿' },
      '千年灵芝': { type: 'herb', desc: '东域古林中生长千年的灵芝', icon: '🍄' },
      '兽骨': { type: 'bone', desc: '灵兽遗骨，可用于炼器与培养', icon: '🦴' },
      '灵木': { type: 'wood', desc: '蕴含灵性的古木材料', icon: '🪵' },
      '暗灵草': { type: 'herb', desc: '吸收西域魔气而生的异草', icon: '🥀' },
      '幽冥花': { type: 'herb', desc: '阴煞之地盛开的幽冥奇花', icon: '🌺' }
    };
    
    // 丹方定义
    const RECIPES = {
      '养元丹': {materials:{'灵草':8,'仙果':3},baseSuccess:0.85,result:'养元丹',desc:'延寿10年，终身限5枚；需炼丹1级',alchemyLevelRequired:1},
      '延寿丹': {materials:{'灵草':15,'妖丹':3,'天心草':1},baseSuccess:0.7,result:'延寿丹',desc:'延寿50年，筑基可服，终身限3枚；需炼丹3级',alchemyLevelRequired:3},
      '万寿丹': {materials:{'妖丹':8,'血玉':3,'天心草':5},baseSuccess:0.55,result:'万寿丹',desc:'延寿200年，金丹可服，终身限2枚；需炼丹5级',alchemyLevelRequired:5},
      '小还丹': {
        materials: { '灵草': 2 },
        baseSuccess: 0.9,
        result: '小还丹',
        desc: '恢复30点气血',
        alchemyLevelRequired: 1
      },
      '大还丹': {
        materials: { '灵草': 3, '仙果': 1 },
        baseSuccess: 0.8,
        result: '大还丹',
        desc: '恢复80点气血',
        alchemyLevelRequired: 2
      },
      '聚灵丹': {
        materials: { '灵草': 2, '仙果': 2 },
        baseSuccess: 0.85,
        result: '聚灵丹',
        desc: '恢复30点灵力',
        alchemyLevelRequired: 1
      },
      '悟道丹': {
        materials: { '妖丹': 1, '灵草': 3, '仙果': 2 },
        baseSuccess: 0.7,
        result: '悟道丹',
        desc: '增加100点修为',
        alchemyLevelRequired: 3
      },
      '天元丹': {
        materials: { '妖丹': 2, '血玉': 1, '天心草': 1 },
        baseSuccess: 0.6,
        result: '天元丹',
        desc: '增加300点修为',
        alchemyLevelRequired: 4
      }
    };
    
    // ================== 宠物系统数据 ==================
    
    const PET_TYPES = {
      '灵狐': {
        name: '灵狐',
        icon: '🦊',
        bonus: { type: 'crit', value: 0.1 },
        desc: '增加10%暴击率',
        baseAtk: 5,
        growthAtk: 2,
        captureRate: 0.15
      },
      '玄龟': {
        name: '玄龟',
        icon: '🐢',
        bonus: { type: 'def', value: 10 },
        desc: '防御+10',
        baseAtk: 3,
        growthAtk: 1,
        captureRate: 0.15
      },
      '雷鹰': {
        name: '雷鹰',
        icon: '🦅',
        bonus: { type: 'atk', value: 8 },
        desc: '攻击+8',
        baseAtk: 8,
        growthAtk: 3,
        captureRate: 0.12
      },
      '仙鹤': {
        name: '仙鹤',
        icon: '🦢',
        bonus: { type: 'mpRegen', value: 5 },
        desc: '每回合恢复5点灵力',
        baseAtk: 4,
        growthAtk: 2,
        captureRate: 0.12
      },
      '火凤': {
        name: '火凤',
        icon: '🐦',
        bonus: { type: 'burn', value: 0.3 },
        desc: '攻击附带30%灼烧伤害',
        baseAtk: 12,
        growthAtk: 4,
        captureRate: 0.05
      },
      '冰龙': {
        name: '冰龙',
        icon: '🐉',
        bonus: { type: 'freeze', value: 0.15 },
        desc: '15%概率冻结敌人一回合',
        baseAtk: 15,
        growthAtk: 5,
        captureRate: 0.03
      }
    };
    
    // 宠物培养材料
    const PET_FOOD = {
      '灵兽丹': { exp: 20, desc: '宠物经验+20' },
      '高级灵兽丹': { exp: 50, desc: '宠物经验+50' },
      '仙兽丹': { exp: 100, desc: '宠物经验+100' }
    };
    
    // ================== 法宝系统数据 ==================
    
    const ARTIFACT_TYPES = {
      // 攻击型
      '飞剑': {
        name: '飞剑',
        icon: '⚔️',
        type: 'attack',
        effect: { type: 'damage', value: 0.15 },
        desc: '攻击伤害+15%',
        maxLevel: 10,
        upgradeCost: { '星辰砂': 1, '灵石': 100 }
      },
      '雷珠': {
        name: '雷珠',
        icon: '⚡',
        type: 'attack',
        effect: { type: 'chain', value: 0.2 },
        desc: '20%概率造成连锁伤害',
        maxLevel: 10,
        upgradeCost: { '星辰砂': 2, '灵石': 200 }
      },
      // 防御型
      '护心镜': {
        name: '护心镜',
        icon: '🛡️',
        type: 'defense',
        effect: { type: 'reduce', value: 0.1 },
        desc: '受到伤害减少10%',
        maxLevel: 10,
        upgradeCost: { '血玉': 1, '灵石': 100 }
      },
      '遁光梭': {
        name: '遁光梭',
        icon: '💠',
        type: 'defense',
        effect: { type: 'dodge', value: 0.08 },
        desc: '8%概率闪避攻击',
        maxLevel: 10,
        upgradeCost: { '血玉': 1, '灵石': 150 }
      },
      // 辅助型
      '乾坤袋': {
        name: '乾坤袋',
        icon: '👜',
        type: 'support',
        effect: { type: 'gold', value: 0.2 },
        desc: '灵石获取+20%',
        maxLevel: 10,
        upgradeCost: { '灵石': 200 }
      },
      '聚灵珠': {
        name: '聚灵珠',
        icon: '🔮',
        type: 'support',
        effect: { type: 'exp', value: 0.15 },
        desc: '修为获取+15%',
        maxLevel: 10,
        upgradeCost: { '灵石': 150 }
      },
      '长生锁': {
        name: '长生锁',
        icon: '🔗',
        type: 'support',
        effect: { type: 'regen', value: 0.05 },
        desc: '每回合恢复5%气血',
        maxLevel: 10,
        upgradeCost: { '仙果': 2, '灵石': 100 }
      }
    };
    
    // ================== 感情 / 缘分系统 ==================
    // 所有可攻略角色均为成年修士。感情线独立于主线，可随时忽略。
    const ROMANCE_NPCS = {
      suwanqing: {
        id: 'suwanqing', name: '苏晚晴', icon: '🌿', title: '主线女主 · 青云村药师', unlockLevel:0,
        color: '#98e0aa', mainHeroine: true,
        intro: '曾与你青梅相伴、约定同行。可在你仍是凡人、前路未明时，她选择了自己的修仙前途，亲口与你分开。她并非因你弱小而厌弃你，而是当年的她没有勇气承担凡人与修士之间漫长而残酷的生死差距。后来你一步步踏上仙途，你们也不得不重新面对彼此。如今凌霄宗内，顾承渊正光明正大地追求她；所有人都只当他是一个天赋不错的普通内门弟子，无人知道他真正的出身。',
        gifts: { '灵草': 5, '仙果': 8, '妖丹': 2 },
        dialogues: [
          ['……你还是来了。','以前我以为我们不会再这样面对面说话。'],
          ['你现在和从前不一样了。不是境界，是眼神。','我听说了你的事。你不必向我证明什么，我知道你已经走出很远。'],
          ['有些话拖得越久，就越不知道该从哪里开口。','当初那句“到此为止”，这些年我其实想起过很多次。宗门里有人劝我向前看，可有些人不是说放下就能放下。'],
          ['若时间能倒回去，我未必会做出一样的选择。可我知道，道歉不能替你抹掉当时受的伤。','我不求你立刻原谅。我只想让你看到，这一次我不会先转身——就算有人比你更早站到我面前。']
        ],
        events: [
          { id:'cold_reunion', threshold:8, levelRequired:1, storyRequired:1, title:'练气 · 宗门前的重逢', text:`
            凌霄宗山门前，新入门弟子列队而立。<br><br>
            你站在人群中，看见苏晚晴从药庐方向走来，手中提着一篮灵草。她看见你时，脚步明显顿了一下。<br><br>
            <span style="color:#aaa">“……你来了。”</span><br><br>
            她的声音很轻，像是怕惊碎什么。<br><br>
            <span style="color:#d8c6aa">“你……是为了我来的吗？”</span><br><br>
            <span style="color:#666;font-size:12px">你注意到她握着药篮的手指微微收紧。</span>`, choices:[
            { text:'🗡️ “不是。我是来走我自己的道。”', delta:10, reply:'她怔了很久，最后轻轻点头：“这样最好。你本来就不该为任何人活。”那一刻，她第一次真正重新看你。' },
            { text:'🌿 “曾经有一部分是。现在不是了。”', delta:8, reply:'她垂下眼：“我明白。”语气很轻，却没有像从前那样转身离开。' }
          ]},
          { id:'trial_side_by_side', threshold:22, levelRequired:2, storyRequired:2, title:'筑基 · 再次并肩', text:`
            宗门秘境中，试炼妖兽突然失控。苏晚晴为救一名低阶弟子被逼退到山崖边，你赶到时，她手中的药针已经所剩无几。<br><br>
            <span style="color:#aaa">妖兽扑来的瞬间——</span><br><br>
            <b>她下意识地挡在了你身前。</b><br><br>
            <span style="color:#d8c6aa">“小心！”</span><br><br>
            这一声出口，她自己都愣住了。那是刻在骨子里的本能，多年未变。`, choices:[
            { text:'⚔️ 挡在她前面：“旧账以后再算，先活下来。”', delta:12, reply:'战斗结束后，她替你包扎手臂，指尖微微发抖：“你还是会先挡在别人前面……可这一次，我不想只站在你身后。”' },
            { text:'🤝 与她背靠背迎敌', delta:11, reply:'你们几乎没有交流，却像从前一样知道彼此下一步会往哪里走。战斗结束后，两人都沉默了很久。' }
          ]},
          { id:'courting_rival', threshold:32, levelRequired:2, storyRequired:2, title:'筑基 · 药庐外的追求者', text:`
            你去药庐寻苏晚晴时，正看见内门弟子顾承渊手捧一株罕见的月魄兰站在门前。<br><br>
            <span style="color:#aaa">宗门里没人觉得这有什么特别——在所有人眼里，他只是个天赋不错、待人温和的普通内门弟子。</span><br><br>
            顾承渊看着苏晚晴，毫不掩饰自己的心思：<br>
            <span style="color:#b8c7e8">“苏师妹，我知道你心里还有旧事。但若有一天你想往前走，我希望站在你身边的人，可以是我。”</span><br><br>
            说完，他才转头看向你。周围弟子窃窃私语：“郎才女貌啊……”<br><br>
            <span style="color:#666;font-size:12px">旧日那句“我不能把自己的未来押在一个凡人身上”再次回响。</span>`, choices:[
            { text:'🗡️ 平静开口：“她如何选，由她自己决定。”', delta:13, reply:'顾承渊没有动怒，只是看了你片刻。苏晚晴却先接过话头：“顾师兄，多谢你的心意。但我的事情，我会自己决定。”她转向你，眼神第一次没有躲闪。' },
            { text:'🔥 “我会靠自己重新站到她面前。”', delta:11, reply:'顾承渊淡淡一笑：“那我等着看。”苏晚晴却皱眉打断：“我不是你们用来分胜负的东西。”这句话既是说给他，也是说给你听。' }
          ]},
          { id:'rival_secret', threshold:42, levelRequired:3, storyRequired:3, title:'金丹 · 无人知晓的身份', text:`
            夜归途中，你看见顾承渊独自走进内门禁阁后院——那里连执事都不得擅入。<br><br>
            片刻后，闭关多年的内门大长老顾玄岳亲自出现。没有护卫，没有弟子，只有一句极轻的话：<br>
            <span style="color:#b8c7e8">“承渊，这些年委屈你了。”</span><br><br>
            顾承渊接过一枚只属于大长老一脉的玄金玉令。<br><br>
            <span style="color:#ff6b6b">你终于明白——他不是普通内门弟子。</span><br>
            <span style="color:#ffd700">他是顾玄岳唯一的亲孙子。</span><br><br>
            <span style="color:#666;font-size:12px">宗门上下竟无人知晓，连苏晚晴也一直被蒙在鼓里。当年一无所有的是你，如今温柔深情、家世顶尖的是他。执念如潮水般涌来：『果然，她本就该配更好的人。』</span>`, choices:[
            { text:'🌑 暂时不声张，继续观察', delta:10, reply:'你悄然退入夜色。第二日，顾承渊仍像往常一样与普通弟子排队领取月例，仿佛昨夜的一切从未发生。你意识到，这个身份被隐藏绝不是偶然。' },
            { text:'⚠️ 私下问顾承渊为何隐瞒', delta:8, reply:'顾承渊沉默很久，只说：“我若顶着他的名字活着，所有靠近我的人都会先看见顾玄岳，再看见我。”他看向你，“苏晚晴也不知道。我希望她看见的只是顾承渊。”临走前，他又补了一句：“至少现在，请别告诉她。”' }
          ]},
          { id:'truth_and_apology', threshold:52, levelRequired:3, storyRequired:3, title:'金丹 · 那年真正的答案', text:`
            幽冥谷归来后，苏晚晴在药庐等了你一夜。桌上放着当年她退还给你的那枚旧木牌——<br><br>
            <span style="color:#ffd700">她后来偷偷捡了回来。</span><br><br>
            <span style="color:#aaa">“青石桥一别，我走之后三步一回头。趁无人，含泪把它捡了回来，藏了数年。”</span><br><br>
            她没有为自己找借口：<br>
            <span style="color:#d8c6aa">“当年我选前路，不是厌你平凡。是年少的我，扛不住凡尘生死离别，赌不起两个人的一生。”</span><br>
            <span style="color:#d8c6aa">“我怕你老死凡尘，我怕自己眼睁睁看着你白发苍苍却无能为力。所以我说‘到此为止’——长痛不如短痛。”</span><br><br>
            她看着你，眼眶微红：<br>
            <span style="color:#ffb6c9">“对不起。当年是我先放开了手。”</span><br><br>
            <span style="color:#666;font-size:12px">你第一次知道——原来当年，不是你不够好，是你们都太年少无力。</span>`, choices:[
            { text:'🌙 听她把当年的话说完', delta:14, reply:'她握紧木牌，声音微颤：“我不求你立刻原谅。我只想让你看到，这一次我不会先转身——就算有人比你更早站到我面前。”' },
            { text:'💔 “我能理解，但不代表那时不痛。”', delta:12, reply:'她眼眶更红，却没有辩解：“我知道。所以我不求一句‘没关系’。那句话，不该由我替你说。”' }
          ]},
          { id:'blood_shadow_guard', threshold:66, levelRequired:4, storyRequired:4, title:'元婴 · 这一次她没有离开', text:`
            追查血魔踪迹时，你被魔气侵入经脉。苏晚晴明知留下可能被包围，仍守在阵中替你稳住灵脉。远处已经传来魔修的脚步声。<br><br>
            <span style="color:#d8c6aa">宗门长老传讯：“苏晚晴，立刻撤离！不要为一个外人搭上自己！”</span><br><br>
            她第一次公开忤逆宗门：<br>
            <span style="color:#ffd700;font-weight:bold">“他不是外人。当年我弃他而去，是我一生最大的憾事。”</span><br>
            <span style="color:#ffd700;font-weight:bold">“此生前路再险，我绝不会再独自抽身离开。”</span><br><br>
            <span style="color:#666;font-size:12px">那一刻，她握阵旗的手很稳，声音更稳。</span>`, choices:[
            { text:'🔥 “你现在走，还来得及。”', delta:14, reply:'她摇头：“当年我已经走过一次了。”她握紧阵旗，“这一次，就算结果很坏，我也想和你一起面对。”' },
            { text:'🤍 握住她的手：“那就一起出去。”', delta:13, reply:'她没有抽开手。阵光亮起时，你第一次觉得你们之间那道裂痕，不再只是无法跨越的过去。' }
          ]},
          { id:'second_choice', threshold:80, levelRequired:6, storyRequired:5, title:'炼虚 · 第二次选择', text:`
            血魔之战后，苏晚晴约你回到当初分开的青石桥。很多年前，她在这里把木牌还给你；今天，她重新把它放到你掌心。<br><br>
            <span style="color:#aaa">“当年我说‘到此为止’，是因为年少的我扛不住凡尘离别。”</span><br>
            <span style="color:#ffb6c9">“如今你已是大能，威震一方。顾承渊也好，宗门也好，所有人都觉得你已远超当年。”</span><br>
            <span style="color:#ffb6c9">“但我爱的，从来不是仙途大能的你。”</span><br>
            <span style="color:#ffd700;font-weight:bold">“是当年那个一无所有、却敢爱敢恨的少年。”</span><br>
            <span style="color:#ffb6c9">“经历风雨之后，依旧赤诚的，那个你。”</span><br><br>
            <span style="color:#d8c6aa">“若你还愿意，我想从头学一次怎么和你并肩。”</span><br><br>
            <span style="color:#666;font-size:12px">她的告白，全程不提你的境界、实力与名望。她爱的，是那个人本身。</span>`, choices:[
            { text:'❤️ 重新牵住她的手：“这一次，我愿意听你说完。”', delta:12, reply:'她深吸一口气：“我不是因为你变强才回来。这些年不是没人向我走近。顾承渊也待我很好，可我始终没办法因为‘他更合适’就把一个人放进心里。我是直到失去之后才明白，当年我把‘前途’和‘你’当成了只能选一个。”' },
            { text:'🌌 “过去不会消失，但我们可以重新开始。”', delta:10, reply:'她眼中终于有了久违的笑意：“好。不是回到以前，是从今天开始，重新认识彼此。”' }
          ]}
        ]
      },
      luoqinghan: {
        id: 'luoqinghan', name: '洛清寒', icon: '❄️', title: '凌霄宗剑修', unlockLevel:1,
        color: '#a7dfff', intro: '凌霄宗年轻剑修，言语不多，对剑道近乎苛刻。她欣赏真正能坚持到最后的人。',
        gifts: { '灵草': 2, '仙果': 6, '妖丹': 12 },
        dialogues: [
          ['你的步法还有破绽。若愿意，我可以再陪你练一遍。','剑不会说谎。你今日比昨日稳了一些。'],
          ['我不喜欢欠人情。不过你的这份……暂且记着。','同门都说我冷。你似乎从没这么觉得。'],
          ['我练剑时很少分心。最近却总能听见你走上山阶的声音。','若你要去危险的地方，至少先告诉我。'],
          ['剑心并非无情。直到遇见你，我才明白这句话。','以后若有人问我的道在何处……我大概会先看向你。']
        ],
        events: [
          { id:'sword_test', threshold:15, title:'试剑', text:'洛清寒在试炼场等你。她将木剑抛来：“十招。能接住，我便承认你这些日子没有偷懒。”', choices:[
            { text:'⚔️ 正面接招', delta:7, reply:'第十招落下时，她的剑锋停在你肩前。片刻后，她收剑：“不错。”' },
            { text:'🌀 以身法周旋', delta:6, reply:'你险险避开最后一剑。她嘴角似乎动了一下：“懂得变通，也算本事。”' }
          ]},
          { id:'snow_watch', threshold:42, title:'雪夜守山', text:'宗门大雪，洛清寒独自在山门值守。你发现她肩头积了一层薄雪，却没有离开的意思。', choices:[
            { text:'🍵 带热茶陪她守到天亮', delta:9, reply:'天色发白时，她接过最后一杯茶：“下次……不必等我开口。”' },
            { text:'🧥 将外袍披到她肩上', delta:8, reply:'她沉默很久，没有把外袍还你。' }
          ]},
          { id:'sword_heart', threshold:72, title:'剑心与人心', text:'剑坪月下，洛清寒忽然收剑：“师尊说，情会乱剑心。可这些日子，我的剑反而更稳了。”', choices:[
            { text:'💙 “因为你终于知道自己为何挥剑。”', delta:12, reply:'她望着你，眸中冰雪似乎在那一刻融开。' },
            { text:'🌌 “若会乱，我陪你一起乱一次。”', delta:10, reply:'她先是一怔，随后难得地笑出了声。' }
          ]}
        ]
      },
      jihongling: {
        id: 'jihongling', name: '姬红绫', age:24, icon: '🏮', title: '仙市游侠', unlockLevel:2,
        color: '#ff9f9f', intro: '二十四岁的仙市游侠，热烈洒脱。嘴上总爱开玩笑，却从不拿真心说笑；她想要的是并肩同行，而非被人替她决定去留。',
        gifts: { '灵草': 3, '仙果': 10, '妖丹': 8 },
        dialogues: [
          ['哟，又见面了。你该不会是专程来找我的吧？','仙市这么大，偏偏总能撞见你。缘分这东西，挺会挑地方。'],
          ['你这人太正经了。改天我带你看看仙市真正好玩的地方。','放心，我坑谁也不会坑你——至少今天不会。'],
          ['以前我习惯一个人来，一个人走。现在倒会下意识看看你在不在。','别笑。我难得认真一次。'],
          ['等你真成了仙，可别装作不认识我。我可是从你还没飞升时就认识你了。','江湖太大，一个人走久了也会累。若是你……我倒不介意同行。']
        ],
        events: [
          { id:'market_trouble', threshold:15, title:'仙市风波', text:'仙市里有人认出姬红绫，似乎想找她麻烦。她仍笑着，手却已经按在腰间短刃上。', choices:[
            { text:'🗡️ 站到她身边', delta:7, reply:'那群人最终没有动手。她侧头看你：“胆子不错。以后有热闹，我叫你。”' },
            { text:'🪙 花灵石请巡市修士出面', delta:6, reply:'事情很快平息。她笑道：“会用脑子的人，比只会拔剑的稀罕。”' }
          ]},
          { id:'night_lantern', threshold:42, title:'万灯夜', text:'仙市一年一度的万灯夜，姬红绫难得没有四处闲逛，只靠在桥边等你。', choices:[
            { text:'🏮 陪她沿河看灯', delta:9, reply:'灯影落在水面，她忽然说：“要是每年都能这么走一圈，好像也不错。”' },
            { text:'🎁 买一盏小灯送她', delta:8, reply:'她把灯举得很高：“这可是你送的。以后丢了，我就找你赔。”' }
          ]},
          { id:'rain_shelter', threshold:55, title:'檐下听雨', text:'同行归途骤雨初歇。你们在茶棚避雨，她望着檐角说：“从前每次告别，我都当是最后一面。可如今，我竟开始盼着下一次。”', choices:[
            {text:'“那就约好下次，我会来。”',delta:7,reply:'她伸出小指与你轻轻一勾：“说定了。可别只会说漂亮话。”'},
            {text:'把热茶递给她，认真听她说完',delta:7,reply:'她捧着茶笑了：“原来不必逞强的时候，是这样的。”'}
          ]},
          { id:'free_heart', threshold:65, title:'江湖与归处', text:'姬红绫问你：“若有一天我还想远游，你会要我留下吗？”她这次没有笑，只等你的回答。', choices:[
            {text:'“你决定去留，我愿与你同行。”',delta:8,reply:'她眼底亮起来：“我要的正是这个。喜欢一个人，也不必丢掉自己。”'},
            {text:'“放心去吧，我等你回来讲故事。”',delta:8,reply:'她轻轻握住你的手：“有个想回去的地方，江湖反而更辽阔了。”'}
          ]},
          { id:'red_ribbon', threshold:72, title:'红绫之约', text:'城楼风很大。姬红绫解下腕上一截红绫递给你：“拿着。江湖规矩，收了就得负责。”', choices:[
            { text:'❤️ 系在腕上：“那我认了。”', delta:12, reply:'她怔了一瞬，随后笑得比城下万盏灯都亮。' },
            { text:'🧧 收入怀中：“等我来兑现。”', delta:10, reply:'她拍了拍你的肩：“行，我等着。可别让我等太久。”' }
          ]}
        ]
      }
    };

    const MAIN_HEROINE_ID = 'suwanqing';
    const MAIN_HEROINE_RIVAL = { name:'顾承渊', title:'凌霄宗内门弟子', secretTitle:'内门大长老顾玄岳唯一的亲孙子' };
    const SU_REUNION_EVENT_IDS = ['cold_reunion','trial_side_by_side','courting_rival','rival_secret','truth_and_apology','blood_shadow_guard','second_choice'];


    // ================== 男主 × 苏晚晴 V2：执念、遗憾与双结局 ==================
    function getHeartDemonDescription() {
      const hd=player?.heartDemon || {attachment:60,broken:false};
      if(hd.broken) return '🌕 已放下执念 · 道心通明';
      const val=Math.max(0,Math.min(100,Number(hd.attachment)||0));
      if(val>=80) return '🌑 执念深重 · 「我若不够强，便不配被选择」';
      if(val>=50) return '🌘 执念缠绕 · 「我要证明自己值得」';
      if(val>=20) return '🌗 执念渐消 · 「或许我不必证明什么」';
      return '🌖 执念微弱 · 「爱本不该与强弱相关」';
    }

    function modifyHeartDemon(delta,reason='') {
      if(!player.heartDemon) player.heartDemon={attachment:60,type:'worth',broken:false,triggerCount:0};
      const old=Math.max(0,Math.min(100,Number(player.heartDemon.attachment)||0));
      player.heartDemon.attachment=Math.max(0,Math.min(100,old+(Number(delta)||0)));
      player.heartDemon.triggerCount=Math.max(0,Number(player.heartDemon.triggerCount)||0)+1;
      console.log(`心魔执念 ${delta>0?'+':''}${delta} (${reason})，当前：${player.heartDemon.attachment}`);
      if(player.heartDemon.attachment<=0 && !player.heartDemon.broken) triggerHeartDemonBreakthrough();
      return delta;
    }

    function triggerHeartDemonBreakthrough() {
      if(player.heartDemon?.broken) return;
      player.heartDemon.broken=true;
      player.heartDemon.attachment=0;
      player.romanceProgress.heartDemonResolved=true;
      const bonusExp=500+Math.max(0,Number(player.level)||0)*100;
      player.exp+=bonusExp;
      const unlockedBreakingTitle=!player.hiddenTitle;
      if(unlockedBreakingTitle) player.hiddenTitle='破执真人';
      checkLevelUp();
      autoSave();
      showStory(`
        <p style="color:#d9b5ec;font-size:18px;font-weight:bold;">🌅 心魔突破 · 执念尽释</p>
        <p>你独自立于山巅，忽然想通了一件事——</p>
        <p style="color:#aaa">「这些年我拼命变强，到底是为了修仙，还是为了证明给当年离开的人看？」</p>
        <p>风过衣袂，你终于笑了。</p>
        <p style="color:#69f0ae">「我已成道，无需证明。爱与不爱，只关乎本心，与强弱无关。」</p>
        <p style="color:#ffd700">🌸 心境突破！修为 +${bonusExp}${unlockedBreakingTitle?'，解锁称号【破执真人】':'，道心更加通明'}</p>
      `,[{text:'继续前行',action:'romance_npc',npcId:MAIN_HEROINE_ID}]);
    }

    function getHeartDemonBreakthroughPenalty() {
      return player?.heartDemon?.broken ? 0 : 0.15;
    }

    function getSuHiddenRegret() {
      const sh=player?.suwanqingHidden || {};
      if((sh.woodenTokenStage||0)>=2 && sh.confessed && sh.publiclyDefended) return '已释然 · 她已敢直面所有过往';
      if((sh.woodenTokenStage||0)>=1 && sh.confessed) return '渐敞心扉 · 已开始直面当年的选择';
      return '深藏于心 · 她仍有许多话没有说出口';
    }

    function getRivalV2Status() {
      const rs=player?.rivalState || {};
      if(rs.hasExited || rs.phase==='stepped_back') return '✅ 顾承渊已体面退场';
      if(player?.suwanqingHidden?.rejectedRival) return '🌙 顾承渊已被明确拒绝，保持距离';
      if(rs.identityRevealed || rs.phase==='revealed') return '🔍 顾承渊身份已被你发现';
      return '💕 顾承渊仍在追求苏晚晴';
    }

    const SU_HEART_DEMON_DELTAS={
      cold_reunion:-5,
      trial_side_by_side:-8,
      courting_rival:12,
      rival_secret:15,
      truth_and_apology:-25,
      blood_shadow_guard:-20
    };

    function applySuV2EventState(eventId) {
      if(eventId in SU_HEART_DEMON_DELTAS) modifyHeartDemon(SU_HEART_DEMON_DELTAS[eventId],eventId);
      const sh=player.suwanqingHidden;
      if(eventId==='cold_reunion') sh.trueAffection+=5;
      if(eventId==='trial_side_by_side'){sh.trueAffection+=8;sh.publiclyDefended=true;}
      if(eventId==='courting_rival') player.rivalState.phase='pursuing';
      if(eventId==='rival_secret'){player.rivalState.identityRevealed=true;player.rivalState.phase='revealed';}
      if(eventId==='truth_and_apology'){sh.confessed=true;sh.woodenTokenStage=Math.max(sh.woodenTokenStage,1);}
      if(eventId==='blood_shadow_guard'){sh.publiclyDefended=true;sh.trueAffection+=15;sh.rejectedRival=true;}
      if(eventId==='second_choice'){
        sh.woodenTokenStage=Math.max(sh.woodenTokenStage,2);
        sh.trueAffection+=20;
        if(!player.heartDemon.broken) player.heartDemon.attachment=0;
      }
      player.romanceProgress.stage=Math.max(player.romanceProgress.stage,SU_REUNION_EVENT_IDS.indexOf(eventId)+1);
      sh.trueAffection=Math.max(0,Math.min(100,Number(sh.trueAffection)||0));
    }

    function createDefaultRomanceState() {
      const npcs = {};
      for (const id of Object.keys(ROMANCE_NPCS)) npcs[id] = { affection:id===MAIN_HEROINE_ID ? 8 : 0, events:[], chats:0, gifts:0 };
      return { partner:null, breakupSeen:true, npcs };
    }

    function normalizeRomance(saved) {
      const base = createDefaultRomanceState();
      if (!saved || typeof saved !== 'object') return base;
      const out = { ...base, ...saved, npcs:{...base.npcs} };
      for (const id of Object.keys(ROMANCE_NPCS)) {
        const old = saved.npcs && saved.npcs[id] && typeof saved.npcs[id] === 'object' ? saved.npcs[id] : {};
        out.npcs[id] = { ...base.npcs[id], ...old };
        out.npcs[id].affection = Math.max(0, Math.min(100, Number(out.npcs[id].affection) || 0));
        out.npcs[id].resonanceV286826 = Math.max(0,Math.min(100-out.npcs[id].affection,Number.isFinite(Number(old.resonanceV286826))?Number(old.resonanceV286826):0));
        out.npcs[id].events = Array.isArray(out.npcs[id].events) ? out.npcs[id].events : [];
      }
      // 从上一版感情系统迁移苏晚晴进度，避免旧存档直接损坏。
      const su = out.npcs[MAIN_HEROINE_ID];
      const legacy = ['rain_herbs','old_wound','lamp_question'];
      const legacyCount = legacy.filter(id => su.events.includes(id)).length;
      if (legacyCount && !SU_REUNION_EVENT_IDS.some(id => su.events.includes(id))) {
        su.events = SU_REUNION_EVENT_IDS.slice(0, legacyCount);
      } else {
        su.events = su.events.filter(id => SU_REUNION_EVENT_IDS.includes(id));
      }
      if (!ROMANCE_NPCS[out.partner]) out.partner = null;
      return out;
    }

    function getSuReunionCount() {
      const r = player?.romance?.npcs?.[MAIN_HEROINE_ID];
      return r ? SU_REUNION_EVENT_IDS.filter(id => r.events.includes(id)).length : 0;
    }

    function getSuAffectionCap() {
      if (player?.romance?.partner === MAIN_HEROINE_ID) return 100;
      return [20,40,50,60,70,85,95,100][Math.min(7, getSuReunionCount())];
    }

    function getRomanceStage(affection, isPartner=false, npcId=null) {
      if (npcId === MAIN_HEROINE_ID) {
        if(player.romanceProgress?.endingType==='release')return '知己 · 各自安好';
        if (isPartner) return '重归于好 · 道侣';
        const stages = ['旧爱 · 已分开','冷淡重逢','重新认识','情敌出现','暗线浮现','旧情未散','彼此牵挂','等待重新开始'];
        return stages[Math.min(getSuReunionCount(), stages.length - 1)];
      }
      if (isPartner) return '道侣';
      if (affection >= 80) return '情意相通';
      if (affection >= 50) return '心生情愫';
      if (affection >= 20) return '渐渐相熟';
      return '初识';
    }


    function getMainHeroineRivalStatus() {
      if(expansionStateV286827().scenes.rumor_su)return '苏晚晴已知顾承渊的出身；他亲口回应了流言，她保留自己的判断。';
      if(player?.rivalState?.hasExited || player?.rivalState?.phase==='stepped_back') {
        return `${MAIN_HEROINE_RIVAL.name}已经体面退出这段关系。其真实出身仍只被极少数人知晓。`;
      }
      if(player?.suwanqingHidden?.rejectedRival) {
        return `苏晚晴已经明确拒绝${MAIN_HEROINE_RIVAL.name}的追求。他没有纠缠，只保持同门应有的距离。`;
      }
      if(player?.rivalState?.identityRevealed || player?.romance?.npcs?.[MAIN_HEROINE_ID]?.events?.includes('rival_secret')) {
        return `你已暗中发现：${MAIN_HEROINE_RIVAL.name}真正的身份是“${MAIN_HEROINE_RIVAL.secretTitle}”。目前宗门里几乎没人知道，苏晚晴也尚不知情。`;
      }
      if(player?.romance?.npcs?.[MAIN_HEROINE_ID]?.events?.includes('courting_rival')) {
        return `${MAIN_HEROINE_RIVAL.title}${MAIN_HEROINE_RIVAL.name}正在追求苏晚晴。在所有人眼里，他只是普通内门弟子。`;
      }
      return `${MAIN_HEROINE_RIVAL.title}${MAIN_HEROINE_RIVAL.name}近来常出现在苏晚晴身边，但他的背景看起来平平无奇。`;
    }

    function addAffection(npcId, amount) {
      const r = player.romance.npcs[npcId];
      if (!r) return 0;
      const before = r.affection;
      const cap = npcId === MAIN_HEROINE_ID ? getSuAffectionCap() : 100;
      const delta=Number.isFinite(Number(amount))?Number(amount):0;
      r.affection = delta>=0 ? Math.max(before,Math.min(cap,before+delta)) : Math.max(0,before+delta);
      if(npcId===MAIN_HEROINE_ID&&delta>0)r.resonanceV286826=Math.min(100-r.affection,Math.max(0,Number(r.resonanceV286826)||0)+delta-(r.affection-before));
      return r.affection - before;
    }

    // ================== 玩家状态 ==================
    

    function createDefaultMapNpcState() {
      return { chatted: {}, rewards: {}, affinity: {}, quests: {}, talkDays: {}, intelDays: {} };
    }

    function createDefaultPlayer() {
      return {
        name: '无名',
        level: 0,
        phase: 0,
        realmSchemaVersion: 4,
        exp: 0,
        maxHp: 100,
        hp: 100,
        maxMp: 50, // 基础值保留，getMaxMp 统一翻倍，避免旧存档重复叠加
        mp: 100,
        baseAtk: 10,
        baseDef: 5,
        gold: 0,
        inventory: [],
        equipment: createEmptyEquipmentSlots(),
        equipmentInventory: [],
        activeSetBonuses: [],
        // ====== 突破系统 ======
        breakthrough: {
          isAnimating: false,
          attemptCount: 0,
          lastAttemptTime: 0,
          cooldownDays: 0,
          pendingBreakthrough: false
        },
        // ====== 新手引路 ======
        tutorial: {
          completedSteps: [],
          activeStep: null,
          skipped: false,
          showTooltips: true,
          readPopups: []
        },
        skills: [SKILLS[0], ...SKILLS.filter(s=>s.unlockRealm===0)],
        location: 'village',
        worldMapId: 'south',
        sect: '凌霄宗',
        sectContribution: 0,
        sectTotalContribution: 0,
        sectRank: '外门弟子',
        sectTasks: [],
        sectTaskCooldown: 0,
        sectData: { prosperity: 20, disciples: [] },
        warState: {
          status: WAR_STATUS.PEACE,
          enemy: null,
          phase: 0,
          playerKills: 0,
          alliedSects: [],
          immortalSupport: false,
          immortalAlly: null,
          warCooldown: 0,
          history: [],
          lastNotice: null
        },
        factionAlignment: 'human',
        factionReputation: {},
        factionRelations: {},
        destroyedFactions: [],
        demonInvasionLevel: 0,
        civilWarActive: false,
        lingxiaoEventYears: [],
        _immortalBlessing: false,
        _immortalBlessingSource: null,
        _immortalBlessingUntilDay: 0,
        _taisuiWarIntel: false,
        worldTime: { totalDays: 0 },
        mapNpc: createDefaultMapNpcState(),
        // ====== 完整任务系统 ======
        tasks: { active: {}, completed: [], failed: [], choices: {} },
        taskCounters: { daily: 0, weekly: 0, lastDailyReset: -1, lastWeeklyReset: -1 },
        sectTournament: { pending: [], history: [], active: null, secretQualifiedCentury: 0 },
        storyProgress: 0,
        storyCompleted: [false, false, false, false, false, false, false],
        bossesDefeated: [],
        tribulationAttempted: false,
        alchemyLevel: 1,
        alchemyExp: 0,
        alchemyCount: 0,
        materials: {},
        pets: [],
        activePet: null,
        petMaterials: {},
        artifacts: [],
        activeArtifact: null,
        artifactMaterials: {},
        home: { level: 1, furniture: [], visitors: [] },
        burnStacks: 0,
        burnTurns: 0,
        isFrozen: false,
        secretRealmOpen: false,
        secretRealmTimer: 0,
        // 深度角色资料
        daoName: '',
        gender: '男',
        birthYear: 0,
        age: 18,
        maxLifespan: 80,
        longevity: {uses:{}},
        mainTitle: '寻道者',
        hiddenTitle: '',
        infamousTitle: '',
        master: '',
        disciples: [],
        statusEffects: [],
        // 男主心魔执念：证明自己“配得上被选择”的旧结
        heartDemon: { attachment:60, type:'worth', broken:false, triggerCount:0 },
        // 苏晚晴隐藏状态：不直接展示数值，仅用于剧情判定
        suwanqingHidden: { confessed:false, woodenTokenStage:0, publiclyDefended:false, rejectedRival:false, trueAffection:0 },
        rivalState: { phase:'pursuing', identityRevealed:false, hasExited:false },
        romanceProgress: { stage:0, heartDemonResolved:false, endingChosen:false, endingType:null },
        romance: createDefaultRomanceState()
      };
    }

    function normalizePlayer(saved = {}) {
      saved={...saved};
      const record=v=>v&&typeof v==='object'&&!Array.isArray(v)?{...v}:{};
      for(const group of ['mapNpc','tasks']){
        saved[group]=record(saved[group]);
        for(const key of (group==='mapNpc'?['chatted','rewards','affinity','quests','talkDays','intelDays']:['active','choices']))saved[group][key]=record(saved[group][key]);
      }
      saved.materials=record(saved.materials);
      saved.petMaterials=record(saved.petMaterials);
      saved.artifactMaterials=record(saved.artifactMaterials);
      forgeRestoreV2825(saved);
      saved=migrateUnifiedGearV2792(migrateGearNamesV2790(saved));
      const base = createDefaultPlayer();
      const merged = {
        ...base,
        ...saved,
        equipment: normalizeEquipmentSlots(saved.equipment || {}),
        equipmentInventory: Array.isArray(saved.equipmentInventory) ? saved.equipmentInventory.filter(n=>typeof n==='string') : [],
        activeSetBonuses: Array.isArray(saved.activeSetBonuses) ? saved.activeSetBonuses.filter(n=>EQUIPMENT_SET_BONUSES[n]) : [],
        breakthrough: {
          ...base.breakthrough,
          ...(saved.breakthrough || {}),
          isAnimating: false,
          attemptCount: Math.max(0, Number(saved?.breakthrough?.attemptCount) || 0),
          lastAttemptTime: Number(saved?.breakthrough?.lastAttemptTime) || 0,
          cooldownDays: Math.max(0, Number(saved?.breakthrough?.cooldownDays) || 0),
          pendingBreakthrough: !!saved?.breakthrough?.pendingBreakthrough
        },
        tutorial: {
          ...base.tutorial,
          ...(saved.tutorial || {}),
          completedSteps: Array.isArray(saved?.tutorial?.completedSteps) ? [...new Set(saved.tutorial.completedSteps.map(String))] : [],
          activeStep: saved?.tutorial?.activeStep ? String(saved.tutorial.activeStep) : null,
          // 旧存档默认不强制弹新手流程；可在【修行指引】中选择重走引路。
          skipped: saved.tutorial ? !!saved.tutorial.skipped : true,
          showTooltips: saved?.tutorial?.showTooltips !== false,
          readPopups: Array.isArray(saved?.tutorial?.readPopups) ? [...new Set(saved.tutorial.readPopups.map(String))] : []
        },
        home: { ...base.home, ...(saved.home || {}) },
        inventory: Array.isArray(saved.inventory) ? saved.inventory : base.inventory,
        skills: Array.isArray(saved.skills) && saved.skills.length ? saved.skills : base.skills,
        storyCompleted: Array.isArray(saved.storyCompleted)
          ? [...saved.storyCompleted, ...base.storyCompleted].slice(0, base.storyCompleted.length)
          : base.storyCompleted,
        bossesDefeated: Array.isArray(saved.bossesDefeated) ? saved.bossesDefeated : base.bossesDefeated,
        pets: Array.isArray(saved.pets) ? saved.pets : base.pets,
        artifacts: Array.isArray(saved.artifacts) ? saved.artifacts : base.artifacts,
        materials: saved.materials && typeof saved.materials === 'object' ? saved.materials : {},
        petMaterials: saved.petMaterials && typeof saved.petMaterials === 'object' ? saved.petMaterials : {},
        artifactMaterials: saved.artifactMaterials && typeof saved.artifactMaterials === 'object' ? saved.artifactMaterials : {},
        sectContribution: Math.max(0, Number(saved.sectContribution) || 0),
        // 用累计贡献决定职位，避免在贡献商店消费后“掉职位”；旧档没有该字段时以当前贡献补齐。
        sectTotalContribution: Math.max(0, Number(saved.sectTotalContribution ?? saved.sectContribution) || 0),
        sectRank: String(saved.sectRank || '外门弟子'),
        sectTasks: Array.isArray(saved.sectTasks) ? saved.sectTasks : [],
        sectTaskCooldown: Math.max(0, Number(saved.sectTaskCooldown) || 0),
        sectData: {
          ...base.sectData,
          ...(saved.sectData || {}),
          prosperity: Math.max(10, Number(saved.sectData?.prosperity) || 20),
          disciples: Array.isArray(saved.sectData?.disciples) ? saved.sectData.disciples : []
        },
        warState: {
          ...base.warState,
          ...(saved.warState || {}),
          status: Object.values(WAR_STATUS).includes(saved.warState?.status) ? saved.warState.status : WAR_STATUS.PEACE,
          enemy: saved.warState?.enemy || null,
          phase: Math.max(0, Number(saved.warState?.phase) || 0),
          playerKills: Math.max(0, Number(saved.warState?.playerKills) || 0),
          alliedSects: Array.isArray(saved.warState?.alliedSects) ? saved.warState.alliedSects.filter(n=>HUMAN_FACTION_POWER[n] && n!==saved.sect) : [],
          immortalSupport: !!saved.warState?.immortalSupport,
          immortalAlly: saved.warState?.immortalAlly || null,
          warCooldown: Math.max(0, Number(saved.warState?.warCooldown) || 0),
          history: Array.isArray(saved.warState?.history) ? saved.warState.history.slice(-60) : [],
          lastNotice: saved.warState?.lastNotice || null
        },
        factionReputation: saved.factionReputation && typeof saved.factionReputation === 'object' ? saved.factionReputation : {},
        factionRelations: saved.factionRelations && typeof saved.factionRelations === 'object' ? saved.factionRelations : {},
        destroyedFactions: Array.isArray(saved.destroyedFactions) ? [...new Set(saved.destroyedFactions.filter(n=>getFullFactionInfo(n)))].slice(0,27) : [],
        demonInvasionLevel: Math.max(0, Math.min(3, Number(saved.demonInvasionLevel) || 0)),
        civilWarActive: !!saved.civilWarActive,
        lingxiaoEventYears: Array.isArray(saved.lingxiaoEventYears) ? [...new Set(saved.lingxiaoEventYears.map(Number).filter(y=>y>=100&&y%100===0))] : [],
        _immortalBlessing: !!saved._immortalBlessing,
        _immortalBlessingSource: saved._immortalBlessingSource || null,
        _immortalBlessingUntilDay: Math.max(0, Number(saved._immortalBlessingUntilDay) || 0),
        _taisuiWarIntel: !!saved._taisuiWarIntel,
        worldTime: { ...base.worldTime, ...(saved.worldTime || {}) },
        worldMapId: ['south','east','north','west','human_peaks','human_valleys','demon_domain','immortal_domain'].includes(saved.worldMapId) ? saved.worldMapId : 'south',
        tasks: {
          active: saved.tasks && typeof saved.tasks.active === 'object' ? saved.tasks.active : {},
          completed: Array.isArray(saved.tasks?.completed) ? [...new Set(saved.tasks.completed.map(String))] : [],
          failed: Array.isArray(saved.tasks?.failed) ? [...new Set(saved.tasks.failed.map(String))] : [],
          choices: saved.tasks && typeof saved.tasks.choices === 'object' ? saved.tasks.choices : {}
        },
        taskCounters: {
          daily: Math.max(0, Number(saved.taskCounters?.daily) || 0),
          weekly: Math.max(0, Number(saved.taskCounters?.weekly) || 0),
          lastDailyReset: Number.isFinite(Number(saved.taskCounters?.lastDailyReset)) ? Number(saved.taskCounters.lastDailyReset) : -1,
          lastWeeklyReset: Number.isFinite(Number(saved.taskCounters?.lastWeeklyReset)) ? Number(saved.taskCounters.lastWeeklyReset) : -1
        },
        mapNpc: {
          chatted: saved.mapNpc && typeof saved.mapNpc.chatted === 'object' ? saved.mapNpc.chatted : {},
          rewards: saved.mapNpc && typeof saved.mapNpc.rewards === 'object' ? saved.mapNpc.rewards : {},
          affinity: saved.mapNpc && typeof saved.mapNpc.affinity === 'object' ? saved.mapNpc.affinity : {},
          quests: saved.mapNpc && typeof saved.mapNpc.quests === 'object' ? saved.mapNpc.quests : {},
          talkDays: saved.mapNpc && typeof saved.mapNpc.talkDays === 'object' ? saved.mapNpc.talkDays : {},
          intelDays: saved.mapNpc && typeof saved.mapNpc.intelDays === 'object' ? saved.mapNpc.intelDays : {}
        },
        daoName: String(saved.daoName || ''),
        gender: String(saved.gender || '男'),
        birthYear: Number(saved.birthYear) || 0,
        age: Math.max(18, Number(saved.age) || 18),
        maxLifespan: Math.max(0, Number(saved.maxLifespan) || 0),
        longevity: normalizeLongevity(saved.longevity),
        mainTitle: String(saved.mainTitle || '寻道者'),
        hiddenTitle: String(saved.hiddenTitle || ''),
        infamousTitle: String(saved.infamousTitle || ''),
        master: String(saved.master || ''),
        disciples: Array.isArray(saved.disciples) ? saved.disciples.map(String).slice(0,50) : [],
        statusEffects: Array.isArray(saved.statusEffects) ? saved.statusEffects.filter(e=>e&&typeof e==='object'&&e.id).map(e=>({...e,remainingDays:Math.max(0,Number(e.remainingDays)||0)})).slice(0,30) : [],
        heartDemon: {
          ...base.heartDemon, ...(saved.heartDemon||{}),
          attachment: Math.max(0,Math.min(100,Number(saved.heartDemon?.attachment ?? saved.zhinian ?? 0)||0)),
          type: String(saved.heartDemon?.type||'worth'), broken:!!saved.heartDemon?.broken,
          triggerCount:Math.max(0,Number(saved.heartDemon?.triggerCount)||0)
        },
        suwanqingHidden: {
          ...base.suwanqingHidden, ...(saved.suwanqingHidden||{}),
          confessed:!!saved.suwanqingHidden?.confessed, woodenTokenStage:Math.max(0,Math.min(2,Number(saved.suwanqingHidden?.woodenTokenStage)||0)),
          publiclyDefended:!!saved.suwanqingHidden?.publiclyDefended, rejectedRival:!!saved.suwanqingHidden?.rejectedRival,
          trueAffection:Math.max(0,Math.min(100,Number(saved.suwanqingHidden?.trueAffection)||0))
        },
        rivalState: {
          ...base.rivalState, ...(saved.rivalState||{}), phase:String(saved.rivalState?.phase||'pursuing'),
          identityRevealed:!!saved.rivalState?.identityRevealed, hasExited:!!saved.rivalState?.hasExited
        },
        romanceProgress: {
          ...base.romanceProgress, ...(saved.romanceProgress||{}), stage:Math.max(0,Math.min(7,Number(saved.romanceProgress?.stage)||0)),
          heartDemonResolved:!!saved.romanceProgress?.heartDemonResolved, endingChosen:!!saved.romanceProgress?.endingChosen,
          endingType:['reunion','release'].includes(saved.romanceProgress?.endingType)?saved.romanceProgress.endingType:null
        },
        sectTournament: {
          ...base.sectTournament,
          ...(saved.sectTournament || {}),
          pending: Array.isArray(saved.sectTournament?.pending) ? saved.sectTournament.pending : [],
          history: Array.isArray(saved.sectTournament?.history) ? saved.sectTournament.history : []
        },
        romance: normalizeRomance(saved.romance)
      };
      if(typeof normalizeRelationshipsV2852==='function')merged.relationshipStoriesV2852=normalizeRelationshipsV2852(saved.relationshipStoriesV2852);
      migrateCultivationV2793(merged,saved);
      migrateImmortalV2794(merged,saved);
      merged.skills=merged.skills.map(s=>({...s,...(SKILLS.find(k=>k.name===s?.name)||{})}));
      // 旧存档按已经流逝的仙历自动补算年龄；寿元由当前大境界与永久延寿次数共同决定。
      merged.age = Math.max(18, merged.age, 18 + Math.floor((merged.worldTime?.totalDays || 0) / GAME_DAYS_PER_YEAR));
      merged.maxLifespan = getTotalMaxLifespan(merged);
      merged.hp = Math.max(0, Number(merged.hp) || 0);
      merged.mp = Math.max(0, Number(merged.mp) || 0);
      merged.gold = Math.max(0, Number(merged.gold) || 0);
      merged.exp = Math.max(0, Number(merged.exp) || 0);
      merged.sectTasks = merged.sectTasks.map(task => {
        if (!task || typeof task !== 'object') return null;
        const templateId = task.templateId || task.template?.id;
        const templateName = task.template?.name;
        const template = SECT_TASK_TEMPLATES.find(t => t.id === templateId || t.name === templateName);
        if (!template) return null;
        const count = Math.max(1, Number(task.count) || getSectTaskCount(template));
        return {
          templateId: template.id,
          template: { ...template, materials: template.materials ? { ...template.materials } : undefined },
          progress: Math.max(0, Math.min(count, Number(task.progress) || 0)),
          completed: !!task.completed,
          _rewardClaimedV2768: !!task._rewardClaimedV2768 || !!task.completed,
          desc: String(task.desc || formatSectTaskDesc(template)),
          count
        };
      }).filter(Boolean).slice(-8);
      const rankInfo = getRankInfoForContribution(merged.sectTotalContribution,merged);
      merged.sectRank = rankInfo.name;
      // V2感情线旧档迁移：已有七段事件时补齐阶段，不倒扣旧档好感/称号。
      const suDone=SU_REUNION_EVENT_IDS.filter(id=>merged.romance?.npcs?.[MAIN_HEROINE_ID]?.events?.includes(id));
      merged.romanceProgress.stage=Math.max(merged.romanceProgress.stage,suDone.length);
      // Legacy zhinian is read above; a missing value is zero, never a falsy fallback to 60.
      if(!saved.heartDemon&&suDone.includes('second_choice')){
        merged.heartDemon.attachment=0;merged.heartDemon.broken=true;merged.romanceProgress.heartDemonResolved=true;
      }
      if(suDone.includes('rival_secret')){merged.rivalState.identityRevealed=true;if(merged.rivalState.phase==='pursuing')merged.rivalState.phase='revealed';}
      if(suDone.includes('truth_and_apology')){merged.suwanqingHidden.confessed=true;merged.suwanqingHidden.woodenTokenStage=Math.max(merged.suwanqingHidden.woodenTokenStage,1);}
      if(suDone.includes('blood_shadow_guard')){merged.suwanqingHidden.publiclyDefended=true;merged.suwanqingHidden.rejectedRival=true;}
      if(suDone.includes('second_choice')) merged.suwanqingHidden.woodenTokenStage=Math.max(merged.suwanqingHidden.woodenTokenStage,2);
      if(merged.romance?.partner===MAIN_HEROINE_ID && !merged.romanceProgress.endingChosen){merged.romanceProgress.endingChosen=true;merged.romanceProgress.endingType='reunion';merged.rivalState.phase='stepped_back';merged.rivalState.hasExited=true;}
      migrateLooseEquipmentToEquipmentInventory(merged);
      for(const skill of SKILLS.filter(s=>s.unlockRealm!==undefined && merged.level>=s.unlockRealm)) {
        if(!merged.skills.some(s=>s?.name===skill.name)) merged.skills.push({...skill});
      }
      normalizeHomeV2812(merged);
      if(typeof normalizeRoamingV286818==='function')merged.roamingV286818=normalizeRoamingV286818(saved.roamingV286818);
      normalizeNarrativeV286826(merged);
      merged.storyExpansionV286827=normalizeExpansionV286827(merged.storyExpansionV286827);
      return merged;
    }

    let player = createDefaultPlayer();
    
    let gameState = 'exploring';
    let currentEnemy = null;
    let currentMonsterRef = null; // 当前战斗关联的地图怪物实体（仅运行时，不写入存档）
    // V27.8：记录战斗应该返回“大地图”还是原地点面板。
    // 游荡怪战斗必须回大地图，避免 player.location 仍是 pets 时胜利后误弹灵宠界面。
    let currentCombatReturnMode = 'location';
    let currentCombatReturnLocation = null;
    // 当前独立地图；实际地图ID同步保存到 player.worldMapId。
    let currentRegion = null;

    // V27.65：退场保险在奖励结算之前启动。奖励、任务、存档任一步异常，都不会再锁死战斗面板。
    const COMBAT_FINISH_V2764 = {
      timer: 0, watchdog: 0, rescueTimer: 0, pending: null, token: 0,
      settling: false, deferredAfterReturn: null
    };
    function clearCombatFinishTimersV2764() {
      clearTimeout(COMBAT_FINISH_V2764.timer);
      clearTimeout(COMBAT_FINISH_V2764.watchdog);
      COMBAT_FINISH_V2764.timer = 0;
      COMBAT_FINISH_V2764.watchdog = 0;
    }
    function showCombatFinishChoiceV2764(label, disabled=false) {
      const choices = document.getElementById('combatChoices');
      if (!choices) return;
      choices.innerHTML = `<button type="button" class="choice-btn combat-finish-v2764" ${disabled ? 'disabled' : 'onclick="completeCombatFinishV2764()"'}>${label || '返回地图'}</button>`;
    }
    function beginCombatFinishV2764(kind='victory', options={}) {
      if (!COMBAT_FINISH_V2764.pending) {
        const token = ++COMBAT_FINISH_V2764.token;
        COMBAT_FINISH_V2764.pending = {
          token, kind, owner:player,
          returnMode: currentCombatReturnMode,
          returnLoc: currentCombatReturnLocation || player?.location || null,
          skipReturn: !!options.skipReturn,
          afterReturn: typeof options.afterReturn === 'function' ? options.afterReturn : null,
          startedAt: Date.now()
        };
      }
      const pending = COMBAT_FINISH_V2764.pending;
      if (typeof options.afterReturn === 'function') pending.afterReturn = options.afterReturn;
      if (options.skipReturn != null) pending.skipReturn = !!options.skipReturn;
      pending.kind = kind || pending.kind;
      COMBAT_FINISH_V2764.settling = true;
      gameState = 'combat-ending';
      isPlayerTurn = false;
      const panel = document.getElementById('combatPanel');
      panel?.classList.add('combat-settling-v2764');
      panel?.classList.remove('cinema-mode-v2756');
      document.body.classList.remove('cinema-battle-active-v2756');
      window.dispatchEvent(new CustomEvent('xiantu:combat-finishing'));
      showCombatFinishChoiceV2764(options.label || '🎁 正在结算战利品…', options.disabled !== false);
      clearCombatFinishTimersV2764();
      // 独立硬超时不依赖奖励代码的尾部；即使中途抛错，也会在 3.2 秒内退出。
      COMBAT_FINISH_V2764.watchdog = setTimeout(() => completeCombatFinishV2764(pending.token), Math.max(1600, Number(options.watchdogDelay) || 3200));
      return pending;
    }
    function readyCombatFinishV2764(options={}) {
      const pending = COMBAT_FINISH_V2764.pending;
      if (!pending) return null;
      // Includes flee/capture-like exits that did not use the victory autosave.
      battleCheckpointV286812=null;
      autoSave();
      if (typeof options.afterReturn === 'function') pending.afterReturn = options.afterReturn;
      if (options.skipReturn != null) pending.skipReturn = !!options.skipReturn;
      const kind = options.kind || pending.kind || 'victory';
      showCombatFinishChoiceV2764(options.label || (kind === 'flee' ? '🏃 已脱离战斗 · 返回地图' : kind === 'defeat' ? '疗伤并返回' : '🏆 战斗结束 · 返回地图'), false);
      clearTimeout(COMBAT_FINISH_V2764.timer);
      COMBAT_FINISH_V2764.timer = setTimeout(() => completeCombatFinishV2764(pending.token), Math.max(120, Number(options.delay) || 700));
      return pending;
    }
    function queueCombatFinishV2764(kind='victory', options={}) {
      beginCombatFinishV2764(kind, {...options, disabled:false});
      return readyCombatFinishV2764({...options, kind});
    }
    function completeCombatFinishV2764(expectedToken) {
      const pending = COMBAT_FINISH_V2764.pending;
      if (!pending || (expectedToken && expectedToken !== pending.token)) return;
      window.InkSkillFxV2854?.clear(true);
      COMBAT_FINISH_V2764.pending = null;
      COMBAT_FINISH_V2764.settling = false;
      clearCombatFinishTimersV2764();
      const combatPanelV2764 = document.getElementById('combatPanel');
      combatPanelV2764?.classList.add('hidden');
      combatPanelV2764?.classList.remove('combat-settling-v2764', 'cinema-mode-v2756');
      document.getElementById('bossSkillWarning')?.classList.add('hidden');
      document.getElementById('combatItemDrawer')?.classList.add('hidden');
      document.querySelectorAll('.achievement-popup').forEach(el => el.remove());
      document.body.classList.remove('cinema-battle-active-v2756');
      gameState = 'exploring'; currentEnemy = null; currentMonsterRef = null;
      isPlayerTurn = true; isBossFight = false; isTribulation = false; currentBossPhase = 1;
      skipEnemyTurn = false; playerPressureTurns = 0; playerPressureStun = false;
      currentCombatReturnMode = 'location'; currentCombatReturnLocation = null;
      try {
        updateStats?.(); updateWorldHUD?.();
        if (!pending.skipReturn) {
          if (pending.returnMode === 'world' && document.body.classList.contains('flat-world-active')) closeWorldOverlay?.();
          else if (pending.returnLoc) showLocation?.(pending.returnLoc);
          else closeWorldOverlay?.();
        }
      } catch (combatExitErrorV2764) {
        console.error('[V27.65] 返回地图时发生异常，战斗面板已强制关闭：', combatExitErrorV2764);
      } finally {
        if (pending.afterReturn) setTimeout(() => { if(player!==pending.owner||COMBAT_FINISH_V2764.token!==pending.token||gameState!=='exploring')return;try { pending.afterReturn(); } catch (_) {} }, 380);
        if(pending.kind==='victory'&&!pending.skipReturn&&typeof showAfterBattleV2838==='function')showAfterBattleV2838(pending.owner);
      }
    }
    window.completeCombatFinishV2764 = completeCombatFinishV2764;

    // 第二道保险：Safari 恢复前台或计时器偶发失效时，主动检查并结束已经完成的战斗。
    COMBAT_FINISH_V2764.rescueTimer = setInterval(() => {
      const pending = COMBAT_FINISH_V2764.pending;
      if (!pending || Date.now() - pending.startedAt < 3600) return;
      completeCombatFinishV2764(pending.token);
    }, 900);
    window.addEventListener('pageshow', () => {
      const pending = COMBAT_FINISH_V2764.pending;
      if (pending && Date.now() - pending.startedAt > 1000) completeCombatFinishV2764(pending.token);
    }, {passive:true});
    document.addEventListener('visibilitychange', () => {
      const pending = COMBAT_FINISH_V2764.pending;
      if (!document.hidden && pending && Date.now() - pending.startedAt > 1000) completeCombatFinishV2764(pending.token);
    }, {passive:true});


    // ================== 完整主线 + 支线任务系统 V11 ==================
    // Saves made before rewards matched the item tables may still hold these placeholder names.
    const TASK_REWARD_LEGACY_V286838={基础剑袍:'素布道袍',基础剑诀:'木剑',新手药瓶:'小还丹',基础护符:'石佩',内门令牌:'青云佩·灵品',高阶灵药:'大还丹',天机洞察buff:'悟道丹',道心突破:'破障丹',炼丹材料:'灵草',功法残页:'悟道茶',灵宠进阶材料:'妖丹',阵法熟练度:'星辰砂',心境修为:'悟道丹',后期关键分支解锁:'天材地宝',心魔抗性永久提升:'玄玉护脉丹',魔抗:'魔核',高阶防御材料:'冰晶石'};
    const TASK_TYPES={MAIN:'main',SIDE:'side',DAILY:'daily',WEEKLY:'weekly',HIDDEN:'hidden'};
    const TASK_STATUS={AVAILABLE:'available',ACTIVE:'active',COMPLETED:'completed',FAILED:'failed',LOCKED:'locked'};

    const MAIN_TASKS=[
      {id:'main_01',type:'main',title:'仙缘入世',desc:'凡尘少年在青云渡口得遇清玄真人，自此踏入凌霄宗仙途。',npc:'清玄真人',unlockRealm:0,nextTask:'main_02',rewards:{exp:100,gold:300,items:['素布道袍','木剑']},steps:[
        {text:'跟随清玄真人走上凌霄山门石阶',action:'walk_to_sect'},
        {text:'观看入门仙光洗礼',action:'watch_ritual'},
        {text:'完成引气入体，踏入练气初期',action:'breakthrough_realm',targetRealm:1,targetPhase:0}]},
      {id:'main_02',type:'main',title:'外门初修',desc:'正式成为凌霄宗外门弟子，熟悉宗门规矩与基础修行。',npc:'外门执事长老',unlockRealm:0,nextTask:'main_03',rewards:{exp:80,contribution:50,items:['小还丹']},steps:[
        {text:'前往外门演武场报到',action:'go_to_arena'},{text:'学习宗门基础吐纳法',action:'learn_breath'},{text:'完成一次基础修行打坐',action:'meditate'}]},
      {id:'main_03',type:'main',title:'山门重逢',desc:'山门石桥再遇苏晚晴。多年后重逢，彼此都已不是当初的模样。',npc:'苏晚晴',unlockRealm:1,loveEvent:'cold_reunion',nextTask:'main_04',rewards:{exp:150,affection_su:8,items:['石佩']},steps:[
        {text:'前往山门石桥',action:'go_to_bridge'},{text:'与苏晚晴对话',action:'talk_suwanqing'},{text:'平静完成初次重逢',action:'complete_reunion'}]},
      {id:'main_04',type:'main',title:'妖兽试炼',desc:'外门弟子需进入后山试炼林地，积累第一次真正的实战经验。',npc:'外门长老',unlockRealm:1,nextTask:'main_05',rewards:{exp:200,gold:150,contribution:30},steps:[
        {text:'进入后山试炼林地',action:'enter_forest'},
        {text:'斩杀灵纹野兔×3、青纹灵蛇×2',action:'kill_enemies',enemyCounts:{'灵纹野兔':3,'青纹灵蛇':2}},
        {text:'试炼完成，返回外门长老处复命',action:'report_back'}]},
      {id:'main_05',type:'main',title:'突破练气圆满',desc:'苦修多日，根基渐稳。先将当前阶段修为积满，再踏至练气圆满。',unlockRealm:1,nextTask:'main_06',rewards:{exp:300,hp:20,atk:5,def:3},steps:[
        {text:'打坐修行，积攒满当前阶段修为',action:'cultivate_to_full'},
        {text:'修至练气圆满',action:'breakthrough_realm',targetRealm:1,targetPhase:3}]},
      {id:'main_06',type:'main',title:'筑基天劫',desc:'练气圆满后冲击筑基，迎来第一次真正意义上的雷劫洗髓。',npc:'清玄真人',unlockRealm:1,nextTask:'main_07',rewards:{exp:500,hp:50,atk:12,def:8},steps:[
        {text:'前往宗门禁地筑基台',action:'go_to_platform'},
        {text:'扛过三重小天劫',action:'survive_tribulation',count:3},
        {text:'成功踏入筑基初期',action:'breakthrough_realm',targetRealm:2,targetPhase:0}]},
      {id:'main_07',type:'main',title:'内门考核',desc:'筑基弟子可参与内门晋升考核，笔试、实战、心性三关缺一不可。',unlockRealm:2,loveEvent:'trial_side_by_side',nextTask:'main_08',rewards:{exp:400,contribution:80,affection_su:14,items:['青云佩·灵品']},steps:[
        {text:'完成宗门道典笔试',action:'written_exam'},{text:'实战击败内门考核傀儡',action:'combat_puppet'},{text:'通过幻境心性测试',action:'mind_test'}]},
      {id:'main_08',type:'main',title:'秘境同行',desc:'你与苏晚晴被安排一同入秘境历练。再度并肩后，旧日隔阂开始松动。',unlockRealm:2,nextTask:'main_09',rewards:{exp:600,gold:500,affection_su:20,items:['大还丹']},steps:[
        {text:'与苏晚晴组队进入宗门秘境',action:'enter_secret_realm'},{text:'联手击败秘境妖王',action:'kill_secret_boss'},{text:'采集秘境灵材×3',action:'collect_task_materials',count:3},{text:'安全离开秘境',action:'exit_secret_realm'}]},
      {id:'main_09',type:'main',title:'药庐外的风',desc:'药庐外，顾承渊向苏晚晴示好。宗门里不少人都觉得他们十分般配。',unlockRealm:2,loveEvent:'courting_rival',nextTask:'main_10',rewards:{exp:200,affection_su:6},steps:[
        {text:'前往药庐外',action:'go_to_yaolu'},{text:'旁观顾承渊与苏晚晴对话',action:'watch_dialogue'},{text:'选择：默然离开 / 驻足观看',action:'choice',options:[['leave','默然离开'],['stay','驻足观看']]}]},
      {id:'main_10',type:'main',title:'禁阁夜影',desc:'深夜里，顾承渊独自进入内门禁阁，大长老顾玄岳亲自接见了他。',unlockRealm:3,nextTask:'main_11',rewards:{exp:500,items:['悟道丹']},steps:[
        {text:'深夜潜入禁阁外围',action:'go_to_jinge'},{text:'偷听禁阁内的密谈',action:'eavesdrop'},{text:'得知顾承渊是顾玄岳唯一嫡孙',action:'learn_secret'}]},
      {id:'main_11',type:'main',title:'无人知晓的身份',desc:'顾承渊私下找到你，希望你暂时不要公开他的真正身份。',unlockRealm:3,loveEvent:'rival_secret',nextTask:'main_12',rewards:{exp:300},steps:[
        {text:'与顾承渊私下对话',action:'talk_gu'},{text:'选择：答应保密 / 拒绝保密',action:'choice',options:[['promise','答应保密'],['refuse','拒绝保密']]}]},
      {id:'main_12',type:'main',title:'那年真正的答案',desc:'金丹雨夜，苏晚晴拿出当年旧木牌，将青石桥分开的真正原因全部说了出来。',unlockRealm:3,loveEvent:'truth_and_apology',nextTask:'main_13',rewards:{exp:800,affection_su:30,items:['破障丹']},steps:[
        {text:'雨夜进入药庐',action:'enter_yaolu_rain'},{text:'倾听苏晚晴完整坦白',action:'listen_confession'},{text:'选择：释然 / 沉默',action:'choice',options:[['release','释然'],['silent','沉默']]}]},
      {id:'main_13',type:'main',title:'金丹大比前奏',desc:'百年宗门大比将至，凌霄宗内部暗流涌动。你需要开始为真正的宗门争锋做准备。',unlockRealm:3,nextTask:null,rewards:{exp:500,contribution:100},steps:[
        {text:'接取宗门大比预备任务',action:'accept_prep'},{text:'研习一门高阶功法',action:'learn_high_skill'},{text:'完成宗门大比备战',action:'prepare_tournament'}]}
    ];

    MAIN_TASKS[12].nextTask='main_14';
    MAIN_TASKS.push(
      {id:'main_14',type:'main',title:'万宗争锋',desc:'预备名册上的名字，终于要走上真正的擂台。亲自完成一届百年淘汰赛，无论胜败，都将成为你的修行见证。',unlockRealm:3,nextTask:'main_15',rewards:{exp:800,gold:1200,contribution:100},steps:[{text:'亲自参加并完成一届百年宗门大比（历史记录有效，委托不计）',action:'tournament_record_v2823'},{text:'复盘擂台得失，决定下一步修行',action:'choice',options:[['steady','稳固根基，补足短板'],['edge','磨砺锋芒，再争高下']]}]},
      {id:'main_15',type:'main',title:'元婴照荒原',desc:'元婴初成，西域求援符接连亮起。护送流民越过荒原，才知宗门之外也有人等待修士守护。',unlockRealm:4,nextTask:'main_16',rewards:{exp:1200,gold:1800,contribution:120},steps:[{text:'阅读西域求援符',action:'border_letter_v2823'},{text:'击败截断归路的荒原魔将',action:'border_general_v2823'},{text:'决定流民的护送路线',action:'choice',options:[['shelter','先护送伤者进入人族据点'],['escort','亲自断后，让队伍先行']]}]},
      {id:'main_16',type:'main',title:'三万年烽火',desc:'化神后，你被派往三界交锋的灵脉前线。仙魔已战三万年，魔族天才夜无疆的名字再次出现在残缺战报里。',unlockRealm:5,nextTask:'main_17',rewards:{exp:1800,gold:2400,contribution:160},steps:[{text:'查阅仙魔旧战卷宗',action:'war_archive_v2823'},{text:'守住补给灵脉，击败破阵魔修',action:'war_defender_v2823'},{text:'带回残缺魔典的线索',action:'war_clue_v2823'}]},
      {id:'main_17',type:'main',title:'仙门之外',desc:'飞升地仙后，你终于有资格翻阅仙门深处的旧战碑。夜无疆为何随你成长，答案藏在他重修之前的残魂里。',unlockRealm:10,nextTask:'main_18',rewards:{exp:2500,gold:3200},steps:[{text:'达到地仙初期',action:'breakthrough_realm',targetRealm:10,targetPhase:0},{text:'完成宿敌纪事前五章（已有记录有效）',action:'rival_record_v2823'},{text:'决定如何面对魔典的秘密',action:'choice',options:[['understand','记住真相，仍守自己的道'],['resolve','不问出身，只问今日所为']]}]},
      {id:'main_18',type:'main',title:'半圣天堑',desc:'修至准圣，你终于看清夜无疆的极限。逆天魔典能助他重修，却补不回成圣所需的本源；他的道途永远止于半圣。',unlockRealm:15,nextTask:'main_19',rewards:{exp:3200,gold:4000},steps:[{text:'达到准圣初期',action:'breakthrough_realm',targetRealm:15,targetPhase:0},{text:'读懂残缺本源与半圣天堑',action:'saint_limit_v2823'},{text:'回应夜无疆的问道',action:'choice',options:[['respect','承认他的强大，但继续前行'],['beyond','道途未尽，我会走到更远处']]}]},
      {id:'main_19',type:'main',title:'无疆有岸',desc:'成圣之后，旧日高悬一境的宿敌终于停在身后。最后一战是为自己的道作答，并不意味着三万年的战争就此消失。',unlockRealm:16,nextTask:null,rewards:{exp:4000,gold:6000},steps:[{text:'达到圣人初期',action:'breakthrough_realm',targetRealm:16,targetPhase:0},{text:'在圣人境实际击退夜无疆（已有胜利记录有效）',action:'saint_win_v2823'},{text:'为这段宿敌之路留下答案',action:'choice',options:[['guard','以此身守住来时的人间'],['wander','踏遍诸天，继续寻找答案']]}]}
    );

    const SIDE_TASKS=[
      {id:'side_daily_01',type:'daily',title:'宗门采药',desc:'药庐童子需要新鲜灵草。',npc:'药庐童子',repeatable:true,dailyReset:true,rewards:{exp:50,gold:30,contribution:10,items:['灵草']},steps:[{text:'采集灵草×5',action:'collect_materials',material:'灵草',count:5}]},
      {id:'side_daily_02',type:'daily',title:'山门镇守',desc:'协助外门执事驱赶山门附近游荡的小妖。',npc:'外门执事',repeatable:true,dailyReset:true,rewards:{exp:60,gold:40,contribution:15},steps:[{text:'驱赶小妖×3',action:'kill_enemies',enemyCounts:{'小妖':3}}]},
      {id:'side_daily_03',type:'daily',title:'典籍抄录',desc:'前往藏书阁抄录基础道典，磨炼心性。',npc:'藏书阁长老',repeatable:true,dailyReset:true,rewards:{exp:40,items:['悟道茶']},steps:[{text:'完成一次道典抄录',action:'copy_text'}]},
      {id:'side_weekly_01',type:'weekly',title:'妖兽清剿',desc:'宗门发布清剿令，要求处理边境妖兽巢穴。',repeatable:true,weeklyReset:true,rewards:{exp:300,gold:200,contribution:50,items:['妖丹']},steps:[{text:'清剿边境妖兽巢穴',action:'clear_nest'}]},
      {id:'side_weekly_02',type:'weekly',title:'阵法维护',desc:'护山大阵灵纹磨损，需要弟子协助修补。',repeatable:true,weeklyReset:true,rewards:{exp:250,contribution:60,items:['星辰砂']},steps:[{text:'修补宗门护山大阵',action:'repair_array'}]},
      {id:'side_hidden_01',type:'hidden',title:'苏晚晴·月下谈心',desc:'月下庭院偶遇苏晚晴，两人安静谈心。',hidden:true,unlockCondition:{affection_su:50},rewards:{exp:200,affection_su:20,items:['悟道丹']},steps:[{text:'夜晚前往庭院',action:'go_to_courtyard_night'},{text:'与苏晚晴月下谈心',action:'talk_su_night'}]},
      {id:'side_hidden_02',type:'hidden',title:'顾承渊·君子之约',desc:'顾承渊与你约定，往后的竞争只凭各自本事。',hidden:true,unlockCondition:{questCompleted:['main_11'],choiceTask:'main_11',choice:'promise'},rewards:{exp:150,items:['天材地宝']},steps:[{text:'与顾承渊立下君子之约',action:'talk_gu_promise'}]},
      {id:'side_hidden_03',type:'hidden',title:'清玄真人·道心指点',desc:'清玄真人看出你的道心已有变化，准备传授独门心境法。',hidden:true,unlockCondition:{heartDemon:'low',realm:2},rewards:{exp:300,items:['玄玉护脉丹']},steps:[{text:'前往清玄真人处接受道心指点',action:'visit_master'}]},
      {id:'side_war_01',type:'side',title:'边境探查',desc:'前往西域边境探查魔族营地与补给动向。',unlockCondition:{realm:3,warLevel:1},rewards:{exp:400,gold:300,contribution:80,items:['魔核']},steps:[{text:'前往西域边境',action:'go_to_border'},{text:'探查魔族营地',action:'scout_camp'}]},
      {id:'side_war_02',type:'side',title:'灵脉守护',desc:'守护人族边境灵脉，抵御魔修偷袭。',unlockCondition:{realm:4,warLevel:2},rewards:{exp:500,gold:400,contribution:100,items:['冰晶石']},steps:[{text:'前往边境灵脉',action:'go_to_spirit_vein'},{text:'击退偷袭灵脉的魔修',action:'defend_attack'}]}
    ];

    const ALL_TASKS={}; MAIN_TASKS.forEach(t=>ALL_TASKS[t.id]=t); SIDE_TASKS.forEach(t=>ALL_TASKS[t.id]=t);
    let currentTaskTab='main';

    function ensureTaskState(){
      if(!player.tasks||typeof player.tasks!=='object')player.tasks={active:{},completed:[],failed:[],choices:{}};
      if(!player.tasks.active||typeof player.tasks.active!=='object')player.tasks.active={};
      if(!Array.isArray(player.tasks.completed))player.tasks.completed=[];
      if(!Array.isArray(player.tasks.failed))player.tasks.failed=[];
      if(!player.tasks.choices||typeof player.tasks.choices!=='object')player.tasks.choices={};
      if(!player.taskCounters)player.taskCounters={daily:0,weekly:0,lastDailyReset:-1,lastWeeklyReset:-1};
      if(typeof migrateMainV286823==='function')migrateMainV286823(player.tasks);
      return player.tasks;
    }
    function getTaskData(id){return ALL_TASKS[id]||null;}
    function getTaskInstance(id){ensureTaskState();return player.tasks.active[id]||null;}
    function isTaskUnlockConditionMet(task){
      if(!task)return false;
      if(Number.isFinite(task.unlockRealm) && (player.level||0)<task.unlockRealm)return false;
      if(task.type==='main'){
        const idx=MAIN_TASKS.findIndex(t=>t.id===task.id);
        if(!mainPredecessorMetV286823(task))return false;
      }
      const c=task.unlockCondition;if(!c)return true;
      if(Number.isFinite(c.realm)&&(player.level||0)<c.realm)return false;
      if(Number.isFinite(c.affection_su)){const r=player.romance?.npcs?.[MAIN_HEROINE_ID];if((r?.affection||0)<c.affection_su)return false;}
      if(Array.isArray(c.questCompleted)&&!c.questCompleted.every(q=>player.tasks.completed.includes(q)))return false;
      if(c.choiceTask&&c.choice&&player.tasks.choices[c.choiceTask]!==c.choice)return false;
      if(c.heartDemon==='low' && (!Number.isFinite(player.heartDemon?.attachment)||player.heartDemon.attachment>35))return false;
      if(Number.isFinite(c.warLevel) && Number(player.demonInvasionLevel||0)<c.warLevel)return false;
      return true;
    }
    function getTaskStatus(id){
      ensureTaskState(); const task=getTaskData(id); if(!task)return TASK_STATUS.LOCKED;
      const inst=player.tasks.active[id];
      if(inst?.failed||player.tasks.failed.includes(id))return TASK_STATUS.FAILED;
      if(inst?.completed||player.tasks.completed.includes(id))return TASK_STATUS.COMPLETED;
      if(inst)return TASK_STATUS.ACTIVE;
      return isTaskUnlockConditionMet(task)?TASK_STATUS.AVAILABLE:TASK_STATUS.LOCKED;
    }
    function createTaskInstance(task){return {currentStep:0,progress:{},completed:false,failed:false,acceptedDay:Math.floor(player.worldTime?.totalDays||0),acceptedAt:getGameDateLabel()};}
    function acceptTask(id,silent=false){
      ensureTaskState();const task=getTaskData(id);if(!task)return false;
      const status=getTaskStatus(id);if(status===TASK_STATUS.ACTIVE)return true;
      if(status===TASK_STATUS.COMPLETED && !task.repeatable)return false;
      if(!isTaskUnlockConditionMet(task)){if(!silent)showFloatingText?.('🔒 尚未满足任务条件','#ff8a80');return false;}
      player.tasks.active[id]=createTaskInstance(task);
      if(!silent)showFloatingText?.(`📜 接取任务：${task.title}`,'#69f0ae');
      updateTaskTracker();autoSave?.();return true;
    }
    function getTaskProgress(id){const task=getTaskData(id),inst=getTaskInstance(id);if(!task||!inst)return 0;if(inst.completed)return 100;return Math.min(99,Math.round((inst.currentStep/task.steps.length)*100));}
    function getCurrentTaskStep(id){const task=getTaskData(id),inst=getTaskInstance(id);return task&&inst?task.steps[inst.currentStep]||null:null;}
    function getCurrentStepDesc(id){const step=getCurrentTaskStep(id);return step?getTaskStepDisplay(id,step):'已完成';}
    function getTaskStepDisplay(id,step){
      const inst=getTaskInstance(id);if(!inst||!step)return '';
      if(step.action==='kill_enemies'&&step.enemyCounts){const parts=Object.entries(step.enemyCounts).map(([n,c])=>`${n} ${Math.min(c,inst.progress[n]||0)}/${c}`);return parts.join(' · ');}
      if(step.action==='collect_materials'&&step.material)return `${step.text}（${Math.min(step.count||1,inst.progress[step.material]||0)}/${step.count||1}）`;
      if(step.action==='survive_tribulation')return `${step.text}（${Math.min(step.count||3,inst.progress.tribulation||0)}/${step.count||3}）`;
      if(step.action==='collect_task_materials')return `${step.text}（${Math.min(step.count||3,inst.progress.taskMaterials||0)}/${step.count||3}）`;
      return step.text;
    }
    function completeTaskStep(id,action,meta={}){
      const task=getTaskData(id),inst=getTaskInstance(id);if(!task||!inst||inst.completed||inst.failed)return false;
      const step=task.steps[inst.currentStep];if(!step||step.action!==action)return false;
      inst.currentStep++;
      if(inst.currentStep>=task.steps.length)completeTask(id);else{showFloatingText?.(`✓ ${step.text}`,'#9edcff');updateTaskTracker();autoSave?.();}
      return true;
    }
    function taskRewardKindV286838(name){return EQUIPMENT_DB[name]?'equipment':MATERIALS[name]?'material':(ITEMS[name]||LONGEVITY_PILLS[name])?'item':null;}
    function addTaskRewardItem(name){
      name=TASK_REWARD_LEGACY_V286838[name]||name;const kind=taskRewardKindV286838(name);if(!kind)return;
      if(kind==='equipment'){if(!Array.isArray(player.equipmentInventory))player.equipmentInventory=[];player.equipmentInventory.push(name);}
      else if(kind==='material'){if(!player.materials)player.materials={};player.materials[name]=(player.materials[name]||0)+1;}
      else player.inventory.push(name);
    }
    function formatTaskRewards(rewards={}){const a=[];if(rewards.exp)a.push(`修为+${rewards.exp}`);if(rewards.gold)a.push(`灵石+${rewards.gold}`);if(rewards.contribution)a.push(`宗门贡献+${rewards.contribution}`);if(rewards.affection_su)a.push(`苏晚晴好感+${rewards.affection_su}`);if(rewards.hp)a.push(`基础气血+${rewards.hp}`);if(rewards.atk)a.push(`基础攻击+${rewards.atk}`);if(rewards.def)a.push(`基础防御+${rewards.def}`);if(rewards.items?.length)a.push(rewards.items.join('、'));return a.join(' · ')||'无';}
    function completeTask(id){
      const task=getTaskData(id),inst=getTaskInstance(id);if(!task||!inst||inst.completed||inst.failed||inst.currentStep<task.steps.length||(!task.repeatable&&player.tasks.completed.includes(id)))return;
      inst.completed=true;inst.currentStep=task.steps.length;const r=task.rewards||{};
      player.exp+=(r.exp||0);player.gold+=(r.gold||0);
      if(r.contribution){player.sectContribution=(player.sectContribution||0)+r.contribution;player.sectTotalContribution=(player.sectTotalContribution||0)+r.contribution;}
      if(r.affection_su){const su=player.romance?.npcs?.[MAIN_HEROINE_ID];if(su)su.affection=Math.min(100,(su.affection||0)+r.affection_su);}
      if(r.items)r.items.forEach(addTaskRewardItem);if(r.hp)player.maxHp+=r.hp;if(r.atk)player.baseAtk+=r.atk;if(r.def)player.baseDef+=r.def;
      if(!player.tasks.completed.includes(id))player.tasks.completed.push(id);
      if(task.type==='main')player.tasks.lastMainResultV2822={id:task.id};
      showFloatingText?.(`✅ 任务完成：${task.title}`,'#ffd76a');
      // 缘分事件由任务面板按已完成主线列出，玩家主动查看。
      if(task.nextTask){const owner=player;setTimeout(()=>{if(player!==owner)return;if(getTaskStatus(task.nextTask)===TASK_STATUS.AVAILABLE)acceptTask(task.nextTask,true);updateTaskTracker();},400);}
      checkLevelUp?.();updateStats?.();updateTaskTracker();autoSave?.();
    }
    function abandonTask(id){const task=getTaskData(id);if(!task||task.type==='main'){showFloatingText?.('主线任务不可放弃','#ff8a80');return;}delete player.tasks.active[id];updateTaskTracker();autoSave?.();renderTaskList(currentTaskTab);}
    function pendingTaskLoveV2824(){
      ensureTaskState();const npc=ROMANCE_NPCS?.[MAIN_HEROINE_ID],r=player.romance?.npcs?.[MAIN_HEROINE_ID];if(!npc||!r)return [];
      const ids=new Set(MAIN_TASKS.filter(t=>player.tasks.completed.includes(t.id)).map(t=>t.loveEvent).filter(Boolean));
      const expected=SU_REUNION_EVENT_IDS.find(id=>!r.events?.includes(id));
      return npc.events.filter(ev=>ids.has(ev.id)&&!r.events?.includes(ev.id)).map(ev=>{
        const reasons=[];if(ev.id!==expected)reasons.push('先完成前一段缘分');
        if(r.affection<ev.threshold)reasons.push(`好感 ${r.affection}/${ev.threshold}`);
        if(!hasReachedRealm(ev.levelRequired||0))reasons.push(`需${CULTIVATION_REALMS[ev.levelRequired]?.name||'更高境界'}`);
        if((player.storyProgress||0)<(ev.storyRequired||0))reasons.push('需推进地点剧情');
        return {ev,ready:reasons.length===0,reason:reasons.join(' · ')};
      });
    }
    function taskLovePanelV2824(){
      const rows=pendingTaskLoveV2824(),esc=discipleEscV2815;if(!rows.length)return '';
      return `<section class="main-overview-v2822"><h3>💗 待查看剧情 · ${rows.length}</h3><p>由你主动打开，退出后仍保留；完成剧情选择后移出列表。</p>${rows.map(({ev,ready,reason})=>`<article class="task-card"><strong>${esc(ev.title)}</strong><p>${ready?'可以查看':esc(reason)}</p><button class="task-action" onclick="tryOpenTaskLoveEvent('${ev.id}')" ${ready?'':'disabled'}>查看剧情</button></article>`).join('')}<button class="task-action" onclick="openTaskRomanceHubV2824()">前往缘分 · 查看前置剧情</button></section>`;
    }
    function openTaskRomanceHubV2824(){if(!taskInteractionAllowedV2822())return;closeTaskPanel();showRomanceHub();}
    function tryOpenTaskLoveEvent(eventId){
      if(!taskInteractionAllowedV2822())return;
      const row=pendingTaskLoveV2824().find(x=>x.ev.id===eventId);if(!row?.ready)return;
      closeTaskPanel();showRomanceEvent(MAIN_HEROINE_ID,eventId);
    }
    function checkTaskTriggers(){
      ensureTaskState();
      const firstIncomplete=preferredMainV286823(MAIN_TASKS.filter(t=>!player.tasks.completed.includes(t.id)));
      if(firstIncomplete&&getTaskStatus(firstIncomplete.id)===TASK_STATUS.AVAILABLE)acceptTask(firstIncomplete.id,true);
      checkTaskPassiveConditions();updateTaskTracker();
    }
    function checkTaskPassiveConditions(){
      for(const [id,inst] of Object.entries(ensureTaskState().active)){
        const task=getTaskData(id);if(!task)continue;
        for(let n=0;n<task.steps.length;n++){
          if(inst.completed||inst.failed)break;const step=getCurrentTaskStep(id);if(!step)break;
          const reached=(realm,phase=0)=>(player.level||0)>realm||((player.level||0)===realm&&(player.phase||0)>=phase);
          if(step.action==='cultivate_to_full'&&(player.exp>=getCurrentExpNeed()||(id==='main_05'&&reached(1,3))))completeTaskStep(id,step.action);
          else if(step.action==='breakthrough_realm'&&reached(Number(step.targetRealm||0),Number(step.targetPhase||0)))completeTaskStep(id,step.action);
          else if(mainEvidenceV2823(step.action))completeTaskStep(id,step.action);
          else break;
        }
      }
    }
    function onRealmBreakthrough(newLevel,newPhase=0){
      for(const [id,inst] of Object.entries(ensureTaskState().active)){if(inst.completed||inst.failed)continue;const step=getCurrentTaskStep(id);if(step?.action!=='breakthrough_realm')continue;const rr=Number(step.targetRealm||0),rp=Number(step.targetPhase||0);if(newLevel>rr||(newLevel===rr&&newPhase>=rp))completeTaskStep(id,'breakthrough_realm');}
      checkTaskTriggers();
    }
    function onCollectMaterial(material,count=1){
      for(const [id,inst] of Object.entries(ensureTaskState().active)){if(inst.completed||inst.failed)continue;const step=getCurrentTaskStep(id);if(step?.action!=='collect_materials'||step.material!==material)continue;inst.progress[material]=(inst.progress[material]||0)+count;if(inst.progress[material]>=(step.count||1))completeTaskStep(id,'collect_materials');}
      updateTaskTracker();
    }
    function onBattleVictory(enemy){
      if(!enemy)return;
      if(enemy._taskId==='main_08'&&enemy._taskAction==='gather_guard_v2823'){const i=getTaskInstance('main_08');if(i&&mainGatherStateV2823(i).pending)awardMainGatherV2823(2);return;}
      for(const [id,inst] of Object.entries(ensureTaskState().active)){
        if(inst.completed||inst.failed)continue;const step=getCurrentTaskStep(id);if(!step)continue;
        if(step.action==='kill_enemies'&&step.enemyCounts&&Object.prototype.hasOwnProperty.call(step.enemyCounts,enemy.name)){
          inst.progress[enemy.name]=Math.min(step.enemyCounts[enemy.name],(inst.progress[enemy.name]||0)+1);
          const done=Object.entries(step.enemyCounts).every(([n,c])=>(inst.progress[n]||0)>=c);if(done)completeTaskStep(id,'kill_enemies');else updateTaskTracker();
        }else if(enemy._taskId===id&&enemy._taskAction===step.action){completeTaskStep(id,step.action);}
      }
    }
    function onChoiceMade(id,option){const task=getTaskData(id),inst=getTaskInstance(id),step=getCurrentTaskStep(id);if(!task||!inst||inst.completed||inst.failed||step?.action!=='choice'||!taskInteractionAllowedV2822()||!step.options?.some(x=>x[0]===option))return;player.tasks.choices[id]=option;inst.progress.choice=option;if(id==='main_09'&&option==='neutral'){addAffection(MAIN_HEROINE_ID,1);player.rivalState.neutralV286827=1;}if(id==='main_09'&&option==='stay'){const su=player.romance?.npcs?.[MAIN_HEROINE_ID];if(su)su.affection=Math.min(100,(su.affection||0)+2);}if(id==='main_12'&&option==='release'){player.heartDemon ||= {};player.heartDemon.attachment=Math.max(0,(player.heartDemon.attachment||0)-8);}completeTaskStep(id,'choice');closeTaskPanel();}

    function resetDailyTasks(){
      ensureTaskState();const day=Math.floor(player.worldTime?.totalDays||0);if(player.taskCounters.lastDailyReset===day)return;
      for(const t of SIDE_TASKS.filter(x=>x.type==='daily')){delete player.tasks.active[t.id];const ix=player.tasks.completed.indexOf(t.id);if(ix>=0)player.tasks.completed.splice(ix,1);}
      player.taskCounters.daily=0;player.taskCounters.lastDailyReset=day;updateTaskTracker();
    }
    function resetWeeklyTasks(){
      ensureTaskState();const week=Math.floor((player.worldTime?.totalDays||0)/7);if(player.taskCounters.lastWeeklyReset===week)return;
      for(const t of SIDE_TASKS.filter(x=>x.type==='weekly')){delete player.tasks.active[t.id];const ix=player.tasks.completed.indexOf(t.id);if(ix>=0)player.tasks.completed.splice(ix,1);}
      player.taskCounters.weekly=0;player.taskCounters.lastWeeklyReset=week;updateTaskTracker();
    }

    function getTaskNarrative(action){
      const map={
        border_letter_v2823:['西域求援符','符中只有一张荒原路线图和一行急书：归路已断，尚有百姓未归。你收起求援符，向西行去。'],
        war_archive_v2823:['三万年旧战','卷宗中的纪年跨过无数代修士。仙族底蕴深厚，却始终无法压住魔族那位超级天才。夜无疆曾自斩重修，如今的境界远非昔日巅峰。'],
        war_clue_v2823:['残缺魔典','补给灵脉暂时保住，前线仍在交战。你从破阵残旗中取得一页拓印：魔典能够重塑修为，却不能补全早已破损的本源。'],
        saint_limit_v2823:['半圣天堑','夜无疆的气息依旧深不可测，但半圣圆满便是他永远的尽头。那一道本源裂痕不会随你突破而消失，更不会让他凭空踏入圣人。'],
        walk_to_sect:['⛩️ 凌霄山门','你跟随清玄真人踏上长长石阶。云海在脚下翻涌，山门古钟声第一次真正落入耳中。'],
        watch_ritual:['✨ 入门仙光','山门法阵亮起，温和灵光洗过经脉。你第一次感受到天地灵气并非传说。'],
        go_to_arena:['⚔️ 外门演武场','演武场上剑鸣不断。外门执事将你的姓名录入弟子册。'],learn_breath:['🌬️ 基础吐纳法','你按口诀收敛心神，第一次有规律地引导灵气沿经脉运行。'],meditate:['🧘 初次打坐','一炷香后，呼吸与灵气逐渐同步。外门修行终于不再只是纸上文字。'],
        go_to_bridge:['🌉 山门石桥','石桥另一端，一个熟悉的身影停下脚步。苏晚晴也看见了你。'],talk_suwanqing:['💗 山门重逢','“好久不见。没想到，你也走上了仙途。”她的声音很轻，像是不知道该从哪里说起。'],complete_reunion:['🍃 风过石桥','你们没有追问过去，只平静地互道珍重。第一次重逢，就这样结束。'],
        enter_forest:['🌲 后山试炼林','你领取外门试炼令，进入后山。树影间已经传来妖兽踩断枯枝的声音。'],report_back:['📜 试炼复命','外门长老核对试炼令，点了点头：“至少你没只会闭门打坐。”'],go_to_platform:['⚡ 宗门禁地','筑基台四周升起护法阵纹，清玄真人示意你守住本心。'],written_exam:['📚 宗门笔试','道典、戒律、基础灵脉辨识逐一答完，你顺利交卷。'],mind_test:['🪞 幻境心性','幻境里旧日得失不断浮现。你最终没有被困住，睁眼时香才燃过一半。'],
        enter_secret_realm:['🌀 秘境同行','你与苏晚晴一前一后跨过秘境门。她没有多说，只在拔剑时看了你一眼。'],exit_secret_realm:['🚪 离开秘境','秘境门在身后缓缓合拢。并肩的一路让沉默不再像从前那样刺人。'],go_to_yaolu:['🌿 药庐外','药香随风散来。顾承渊正站在廊下，将一只药盒递向苏晚晴。'],watch_dialogue:['🍂 廊下风声','顾承渊言辞温和，四周弟子低声议论。苏晚晴没有立即接下那只药盒。'],go_to_jinge:['🌙 禁阁夜影','夜深后，你沿着回廊来到禁阁外围，恰好看见顾承渊独自进入。'],eavesdrop:['👂 隔墙密谈','你从残缺阵纹旁听见顾玄岳的声音，其中提到了“嫡孙”和“身份暂不可公开”。'],learn_secret:['🔐 身份真相','所有零散线索终于拼在一起：顾承渊正是大长老顾玄岳唯一嫡孙。'],talk_gu:['🤝 私下会面','顾承渊没有否认，只希望你暂时别把这层身份传出去。'],enter_yaolu_rain:['🌧️ 金丹雨夜','雨水沿屋檐垂落。苏晚晴独自在药庐等你，掌心放着当年的旧木牌。'],listen_confession:['🪵 旧木牌','她终于把当年的恐惧、无力与选择全部说出来，没有替自己辩解。'],accept_prep:['📯 大比预备','宗门正式挂出百年大比预备名册，你在自己的名字后按下灵印。'],learn_high_skill:['📖 高阶功法','你在藏书阁挑选合适的高阶法门，开始为大比补足短板。'],prepare_tournament:['⚔️ 大比备战','丹药、装备、功法与状态逐一检查完毕。接下来只剩真正踏上擂台。'],
        copy_text:['📚 典籍抄录','你在藏书阁安静抄完一卷基础道典，字迹由浮躁渐渐变得沉稳。'],repair_array:['🔷 护山阵纹','你随阵法师逐段检查灵纹，重新嵌入灵石，将黯淡节点一一修复。'],go_to_courtyard_night:['🌙 月下庭院','夜色安静，月光落在石阶上。苏晚晴一个人坐在庭中。'],talk_su_night:['💗 月下谈心','没有任务，没有试炼，你们只是聊起这些年彼此错过的生活。'],talk_gu_promise:['🤝 君子之约','顾承渊伸出手：“不借身份，不借长辈。以后各凭本事。”'],visit_master:['☯️ 道心指点','清玄真人没有教你更强的招式，只让你先学会分辨“想赢”和“为何而赢”。'],go_to_border:['🩸 西域边境','离开人族腹地后，空气里开始混入淡淡魔息。'],scout_camp:['🔭 魔营侦察','你绕开巡逻队，记下魔族营地、粮道与阵旗位置后安全撤离。'],go_to_spirit_vein:['💠 边境灵脉','灵脉节点附近阵旗已经升起，远处黑雾正在快速逼近。']
      };return map[action]||['📜 任务推进','你完成了当前任务要求。'];
    }
    function performTaskAction(id){
      const task=getTaskData(id),inst=getTaskInstance(id),step=getCurrentTaskStep(id);if(!task||!inst||!step||inst.completed||inst.failed||!taskInteractionAllowedV2822())return;
      checkTaskPassiveConditions();if(getCurrentTaskStep(id)!==step){renderTaskList(currentTaskTab);return;}
      if(step.action==='collect_materials'){closeTaskPanel();showStory('<h3>采集委托</h3><p>接取后新采集的材料会自动累计。可在地图行走采集、探索草药点，或前往宗门药圃。买入材料不计采集进度。</p>',[{text:'返回地图采集',action:'return_to_map'},{text:'查看任务进度',action:'task_panel_open'}]);return;}
      if(step.action==='kill_enemies'){return launchNextKillTaskBattle(id);}
      if(['combat_puppet','kill_secret_boss','clear_nest','defend_attack'].includes(step.action)){return launchSpecialTaskBattle(id,step.action);}
      if(step.action==='breakthrough_realm'){closeTaskPanel();showRetreatV2782(false,1);return;}
      if(step.action==='cultivate_to_full'){if(player.exp>=getCurrentExpNeed())completeTaskStep(id,'cultivate_to_full');else{closeTaskPanel();showRetreatV2782(false,1);}return;}
      if(step.action==='survive_tribulation'){mainThunderV2823();return;}
      if(step.action==='collect_task_materials'){mainGatherV2823();return;}
      if(step.action==='learn_high_skill'){closeTaskPanel();showSectLibrary();return;}
      if(step.action==='tournament_record_v2823'){closeTaskPanel();showSectTournament();return;}
      if(step.action==='rival_record_v2823'){closeTaskPanel();showYeChronicleV2816();return;}
      if(step.action==='saint_win_v2823'){closeTaskPanel();showYeWujiV2810();return;}
      if(['border_general_v2823','war_defender_v2823'].includes(step.action)){launchSpecialTaskBattle(id,step.action);return;}
      if(step.action==='choice'){renderTaskList(currentTaskTab);return;}
      if(step.action==='journey_battle_v2838')return launchJourneyBattleV2838(id);
      openTaskSceneV2838(id);
    }
    function launchNextKillTaskBattle(id){
      const step=getCurrentTaskStep(id),inst=getTaskInstance(id);if(!step?.enemyCounts||!inst)return;let target=null;for(const [name,count] of Object.entries(step.enemyCounts)){if((inst.progress[name]||0)<count){target=name;break;}}if(!target)return;
      closeTaskPanel();const lv=Math.max(0,player.level||0),scale=1+lv*.18;const enemy={name:target,hp:Math.round((55+lv*18)*scale),maxHp:Math.round((55+lv*18)*scale),atk:Math.round(10+lv*4),def:Math.round(3+lv*2),gold:12+lv*5,exp:20+lv*8,_realmLevel:Math.max(0,lv-1),_realmPhase:0,_taskId:id,_taskAction:'kill_enemies',_isTaskBattle:true};startCombat(enemy,false,false,null);
    }
    function launchSpecialTaskBattle(id,action){
      const defs={gather_guard_v2823:['守巢灵兽',180,20,7],border_general_v2823:['荒原魔将',320,35,13],war_defender_v2823:['破阵魔修',400,42,17],combat_puppet:['内门考核傀儡',150,19,7],kill_secret_boss:['秘境妖王',230,25,9],clear_nest:['巢穴妖兽首领',190,22,8],defend_attack:['偷袭魔修',280,31,12]};const d=defs[action];if(!d)return;closeTaskPanel();const scale=1+Math.max(0,(player.level||0)-2)*.16;const enemy={name:d[0],hp:Math.round(d[1]*scale),maxHp:Math.round(d[1]*scale),atk:Math.round(d[2]*scale),def:Math.round(d[3]*scale),gold:45+player.level*10,exp:70+player.level*15,_realmLevel:player.level||0,_realmPhase:Math.max(0,(player.phase||0)-1),_taskId:id,_taskAction:action,_isTaskBattle:true};startCombat(enemy,false,false,null);
    }

    function getTaskActionLabel(id){const step=getCurrentTaskStep(id);if(!step)return '';const m={collect_materials:'🌿 查看采集途径',journey_battle_v2838:'⚔️ 查看对手与状态',learn_high_skill:'📚 前往藏经阁（需已学会筑基及以上功法）',tournament_record_v2823:'🏆 前往正式大比',rival_record_v2823:'📜 前往宿敌纪事',saint_win_v2823:'⚔️ 前往夜无疆挑战',border_general_v2823:'⚔️ 护送归途',war_defender_v2823:'⚔️ 守卫灵脉',kill_enemies:'⚔️ 挑战目标',combat_puppet:'⚔️ 开始实战',kill_secret_boss:'👹 挑战妖王',clear_nest:'⚔️ 清剿巢穴',defend_attack:'⚔️ 抵御偷袭',breakthrough_realm:'☯️ 修炼 / 突破预览',cultivate_to_full:'🧘 前往修炼预览',survive_tribulation:'⚡ 进入三重护法考验',collect_task_materials:'🌿 查看秘境采集点',choice:'请选择分支'};return m[step.action]||'▶ 推进当前步骤';}
    function renderTaskChoices(id,step){if(step?.action!=='choice')return '';return `<p>${choiceNoteV286826(id)}</p><div class="task-actions">${(step.options||[]).map(([value,label])=>`<button class="task-action gold" onclick="onChoiceMade('${id}','${value}')">${label}</button>`).join('')}</div>`;}
    function taskStatusText(status){return status==='completed'?'✅ 已完成':status==='active'?'● 进行中':status==='available'?'可接取':status==='failed'?'失败':'🔒 未解锁';}
    function getTaskListByFilter(filter){return Object.values(ALL_TASKS).filter(t=>t.type===filter).filter(t=>!(t.hidden&&getTaskStatus(t.id)===TASK_STATUS.LOCKED));}
    function taskInteractionAllowedV2822(){
      if(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating){showFloatingText?.('请先结束当前战斗或突破，再推进任务。','#ffd76a');return false;}return true;
    }
    function mainSkillReadyV2823(){return (player.skills||[]).some(owned=>SKILLS.some(s=>s.name===(owned?.name||owned)&&Number(s.unlockRealm)>=2&&Number(s.unlockRealm)<=player.level));}
    function mainEvidenceV2823(action){
      if(action==='learn_high_skill')return mainSkillReadyV2823();
      if(action==='tournament_record_v2823')return (player.sectTournament?.history||[]).some(h=>h.personal===true);
      if(action==='rival_record_v2823')return (player.yewujiStoryV2816?.choices?.length||0)>=5;
      if(action==='saint_win_v2823')return player.yewujiStoryV2816?.saintVictory===true;
      return false;
    }
    function mainThunderV2823(){
      const id='main_06',i=getTaskInstance(id);if(!i||i.completed||getCurrentTaskStep(id)?.action!=='survive_tribulation'||!taskInteractionAllowedV2822())return;
      const stage=Math.min(2,Math.max(0,i.progress.tribulation||0)),raw=Math.ceil(getMaxHp()*[.18,.25,.32][stage]),cost=Math.ceil(getMaxMp()*.18),ward=Math.ceil(raw*.45);
      closeTaskPanel();showStory(`<section class="main-overview-v2822"><h3>⚡ 筑基护法台 · 第 ${stage+1}/3 重</h3><p>${['洗髓雷：淬炼肉身根基。','问心雷：雷光沿经脉侵入。','凝基雷：守住灵台，凝聚道基。'][stage]}</p><p>气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p><p>直接承受：${raw} 伤害<br>灵力护盾：消耗 ${cost} 灵力，抵挡 ${raw-ward}，承受 ${ward} 伤害</p><p>护法考验不会扣灵石；气血不足则本重未通过，保留已通过重数，气血保留1点。可以退出恢复后继续。三重完成后仍需自行突破筑基，不直接提升境界。</p><button class="choice-btn" onclick="takeMainThunderV2823(${stage},true)" ${player.mp<cost?'disabled':''}>凝聚护盾</button><button class="choice-btn" onclick="takeMainThunderV2823(${stage},false)">以身承雷</button></section>`,[{text:'暂退调息',action:'sect'},{text:'返回任务',action:'task_panel_open'}]);
    }
    function takeMainThunderV2823(stage,shield){
      const i=getTaskInstance('main_06');if(!i||i.completed||getCurrentTaskStep('main_06')?.action!=='survive_tribulation'||!taskInteractionAllowedV2822()||stage!==(i.progress.tribulation||0)||typeof shield!=='boolean')return;
      const raw=Math.ceil(getMaxHp()*[.18,.25,.32][stage]),cost=Math.ceil(getMaxMp()*.18);if(shield&&player.mp<cost)return;
      if(shield)player.mp-=cost;const damage=shield?Math.ceil(raw*.45):raw;
      const passed=player.hp>damage;player.hp=Math.max(1,player.hp-damage);
      if(passed)i.progress.tribulation=stage+1;
      if(passed&&stage===2)completeTaskStep('main_06','survive_tribulation');
      autoSave();updateStats();
      if(!passed){closeTaskPanel();showStory(`<h3>护法阵接住了你</h3><p>本重未通过，气血保留1点；已通过 ${i.progress.tribulation||0}/3 重。请先恢复状态。</p>`,[{text:'返回宗门调息',action:'sect'},{text:'返回任务',action:'task_panel_open'}]);}
      else if(stage<2)mainThunderV2823();else showTaskPanel('main');
    }
    const MAIN_GATHER_V2823=[{name:'泉边灵草',material:'灵草',desc:'泉水滋养灵根，先梳理灵流再采集。',cost:8},{name:'石隙仙果',material:'仙果',desc:'陡壁藤蔓封住石隙，消耗灵力稳住身形。',cost:12},{name:'古巢妖丹',material:'妖丹',desc:'守巢灵兽尚未离去，胜利后才能取得妖丹。',cost:0}];
    function mainGatherStateV2823(i){if(!i.progress.gatherV2823){const n=Math.max(0,Math.min(3,i.progress.taskMaterials||0));i.progress.gatherV2823={done:[0,1,2].slice(0,n),pending:false};}return i.progress.gatherV2823;}
    function mainGatherV2823(){
      const i=getTaskInstance('main_08');if(!i||i.completed||getCurrentTaskStep('main_08')?.action!=='collect_task_materials'||!taskInteractionAllowedV2822())return;
      const state=mainGatherStateV2823(i);closeTaskPanel();
      showStory(`<section class="main-overview-v2822"><h3>🌿 秘境灵材探索 · ${state.done.length}/3</h3><p>三处采集点各领取一次，守巢战需获胜。可退出恢复状态，进度随存档保留。</p><p>当前灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p>${MAIN_GATHER_V2823.map((p,n)=>`<article class="task-card"><h4>${p.name}</h4><p>${p.desc}</p><p>取得 ${p.material} ×1${p.cost?` · 消耗 ${p.cost} 灵力`:''}</p><button class="choice-btn" onclick="takeMainGatherV2823(${n})" ${state.done.includes(n)||player.mp<p.cost?'disabled':''}>${state.done.includes(n)?'已采集':n===2?'挑战守巢灵兽':'采集灵材'}</button></article>`).join('')}</section>`,[{text:'返回任务',action:'task_panel_open'},{text:'暂退调息',action:'sect'}]);
    }
    function takeMainGatherV2823(n){
      const i=getTaskInstance('main_08');if(!i||i.completed||getCurrentTaskStep('main_08')?.action!=='collect_task_materials'||!taskInteractionAllowedV2822()||!Number.isInteger(n)||!MAIN_GATHER_V2823[n])return;
      const state=mainGatherStateV2823(i),p=MAIN_GATHER_V2823[n];if(state.done.includes(n)||player.mp<p.cost)return;
      if(n===2){state.pending=true;autoSave();launchSpecialTaskBattle('main_08','gather_guard_v2823');return;}
      player.mp-=p.cost;awardMainGatherV2823(n);mainGatherV2823();
    }
    function awardMainGatherV2823(n){
      const i=getTaskInstance('main_08');if(!i||i.completed||getCurrentTaskStep('main_08')?.action!=='collect_task_materials')return;
      const state=mainGatherStateV2823(i);if(state.done.includes(n)||!MAIN_GATHER_V2823[n])return;
      state.done.push(n);state.pending=false;i.progress.taskMaterials=state.done.length;
      const mat=MAIN_GATHER_V2823[n].material;player.materials ||= {};player.materials[mat]=(player.materials[mat]||0)+1;onCollectMaterial(mat,1);
      if(state.done.length===3)completeTaskStep('main_08','collect_task_materials');autoSave();updateStats();
    }

    function mainTaskGuideV2822(task){
      const locations=['青云渡口 · 凌霄山门','凌霄宗 · 外门演武场','凌霄宗 · 山门石桥','南域 · 后山试炼林','修炼 / 闭关','凌霄宗 · 筑基台','凌霄宗 · 内门考场','宗门秘境','凌霄宗 · 药庐','凌霄宗 · 禁阁','凌霄宗 · 内门回廊','凌霄宗 · 药庐','凌霄宗 · 大比备战','凌霄宗 · 百年宗门大比','西域 · 荒原归路','西域 · 三界灵脉前线','仙门 · 宿敌纪事','半圣天堑 · 问道','裂界台 · 宿敌终战'];
      return task.placeV286823||locations[Number(task.id.replace('main_',''))-1]||'查看当前目标';
    }
    function mainTaskLockV2822(task){
      const i=MAIN_TASKS.findIndex(t=>t.id===task.id),parts=[];
      if(i>0&&!mainPredecessorMetV286823(task))parts.push(`先完成「${MAIN_TASKS[i-1].title}」`);
      if(task.id==='main_17'&&(player.level||0)<(task.unlockRealm||10))parts.push('先在青云村把地点剧情推到终章，并打赢飞升天劫');
      if((player.level||0)<(task.unlockRealm||0))parts.push(`达到${CULTIVATION_REALMS[task.unlockRealm]?.name||'指定境界'}初期`);
      return parts.join('；');
    }
    function renderTaskList(filter='main'){
      currentTaskTab=filter;const c=document.getElementById('taskListContainer');if(!c)return;
      document.querySelectorAll('.task-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===filter));
      const list=filter==='main'?MAIN_TASKS:filter==='journey'?JOURNEYS_V2838.map(j=>getTaskData(j.id)):getTaskListByFilter(filter),esc=discipleEscV2815;
      if(filter==='journal'){renderJournalV2838(c);return;}
      if(!list.length){c.innerHTML='<div class="task-empty">当前没有可显示的任务</div>';return;}
      const card=task=>{
        const st=getTaskStatus(task.id),inst=getTaskInstance(task.id),step=inst&&!inst.completed?getCurrentTaskStep(task.id):null;let buttons='';
        if(st===TASK_STATUS.AVAILABLE)buttons=`<button class="task-action gold" onclick="acceptTask('${task.id}');renderTaskList('${filter}')">接取任务</button>`;
        else if(st===TASK_STATUS.ACTIVE)buttons=step?.action==='choice'?renderTaskChoices(task.id,step):`<button class="task-action gold" onclick="performTaskAction('${task.id}')">${getTaskActionLabel(task.id)}</button>${task.type!=='main'?`<button class="task-action danger" onclick="abandonTask('${task.id}')">放弃</button>`:''}`;
        const checklist=task.type==='main'&&step?`<details class="main-steps-v2822"><summary>本章步骤 · ${inst.currentStep}/${task.steps.length}</summary><ol>${task.steps.map((x,i)=>`<li class="${i===inst.currentStep?'current':''}">${i<inst.currentStep?'✓ ':i===inst.currentStep?'➤ ':''}${esc(x.text)}</li>`).join('')}</ol></details>`:'';
        return `<article class="task-card ${task.type==='main'?'main':''} ${st}"><div class="task-card-top"><div class="task-card-title">${esc(task.title)}</div><div class="task-status">${taskStatusText(st)}</div></div>${task.type==='main'&&st!==TASK_STATUS.LOCKED?mainIllustrationV286829(task.id):''}<p class="task-card-desc">${esc(task.desc)}</p>${task.type==='main'?`<p class="main-guide-v2822">📍 剧情地点：${esc(mainTaskGuideV2822(task))}${task.npc?` · ${esc(task.npc)}`:''}</p>`:''}${st===TASK_STATUS.LOCKED&&task.type==='main'?`<p class="main-lock-v2822">${esc(mainTaskLockV2822(task))}</p>`:''}${step?`<div class="task-step-box"><div class="task-step-label">当前目标 · 第 ${inst.currentStep+1}/${task.steps.length} 步</div><div class="task-step-text">${esc(getTaskStepDisplay(task.id,step))}</div></div>`:''}${checklist}<div class="task-reward">${st===TASK_STATUS.COMPLETED?'已发放':'完成后自动发放'}：${esc(formatTaskRewards(task.rewards))}</div><div class="task-actions">${buttons}</div></article>`;
      };
      if(filter!=='main'){c.innerHTML=(filter==='journey'?journeyIntroductionV2838():'')+list.map(card).join('');return;}
      const done=list.filter(t=>getTaskStatus(t.id)===TASK_STATUS.COMPLETED),todo=list.filter(t=>getTaskStatus(t.id)!==TASK_STATUS.COMPLETED),current=preferredMainV286823(todo),last=getTaskData(player.tasks.lastMainResultV2822?.id);
      c.innerHTML=expansionCardV286827()+rainCardV286822()+storyMailCardV286826()+postCaseCardV286826()+taskLovePanelV2824()+`<section class="main-overview-v2822"><h3>📜 主线旅程 · ${done.length}/${list.length} 章</h3><p>${current?`当前篇章：${esc(current.title)}`:'当前已开放主线全部完成，可继续宗门大比、三界历练与宿敌纪事。'}</p><progress max="${list.length}" value="${done.length}" aria-label="主线章节进度"></progress><p>剧情对话由下方按钮推进；实战需获胜，修炼与突破会先显示预览。</p>${last?`<details><summary>最近完成：${esc(last.title)} · 奖励已到账</summary><p>${esc(formatTaskRewards(last.rewards))}</p></details>`:''}</section>${current?card(current):''}${todo.length>1?`<details class="main-archive-v2822"><summary>后续章节 · ${todo.length-1}</summary>${todo.filter(t=>t!==current).map(card).join('')}</details>`:''}${done.length?`<details class="main-archive-v2822"><summary>已完成章节 · ${done.length}</summary>${done.map(card).join('')}</details>`:''}`;
    }
    function showTaskPanel(filter='main'){
      if(gameState!=='combat'&&gameState!=='combat-ending'&&!player.breakthrough?.isAnimating)checkTaskTriggers();
      closeTaskPanel();const ov=document.createElement('div');ov.id='taskPanel';ov.className='task-panel-overlay';ov.innerHTML=`<div class="task-panel-box"><div class="task-panel-head"><div><div class="task-panel-title">📜 仙途任务志</div><div class="task-panel-sub">主线 · 三界游历 · 修行纪事</div></div><button aria-label="关闭" class="task-close" onclick="closeTaskPanel()">✕</button></div><div class="task-tabs">${[['main','主线'],['journey','游历'],['journal','纪事'],['side','支线'],['daily','日常'],['weekly','周常'],['hidden','隐藏']].map(([id,n])=>`<button class="task-tab" data-tab="${id}" onclick="renderTaskList('${id}')">${n}</button>`).join('')}</div><div id="taskListContainer"></div></div>`;document.body.appendChild(ov);ov.addEventListener('pointerdown',e=>{if(e.target===ov)closeTaskPanel();});renderTaskList(filter);
    }
    function closeTaskPanel(){document.getElementById('taskPanel')?.remove();}
    function addTaskButton(){const actions=document.querySelector('.world-hud-top > div:last-child');if(!actions||document.getElementById('taskBtn'))return;const b=document.createElement('button');b.id='taskBtn';b.textContent='📜 任务';b.onclick=()=>showTaskPanel('main');actions.insertBefore(b,actions.firstChild);}
    function getTrackedTasks(){const active=getActiveTasks();const main=active.find(t=>t.type==='main');const other=active.find(t=>t.type!=='main');return [main,other].filter(Boolean);}
    function getActiveTasks(){const a=[];for(const [id,inst] of Object.entries(ensureTaskState().active)){if(inst.completed||inst.failed)continue;const t=getTaskData(id);if(t)a.push({...t,instance:inst});}return a;}
    function updateTaskTracker(){if(!player)return;ensureTaskState();let tr=document.getElementById('taskTrackerCompact');const hud=document.querySelector('.world-hud');if(!hud)return;if(!tr){tr=document.createElement('div');tr.id='taskTrackerCompact';hud.appendChild(tr);}const tasks=getTrackedTasks();if(!tasks.length){tr.innerHTML='<div style="color:#727d8a;padding:3px 2px">📜 暂无追踪任务</div>';return;}tr.innerHTML=tasks.map(t=>`<div class="task-track-row" onclick="showTaskPanel('${t.type}')"><div class="task-track-title"><span>${t.type==='main'?'主线':'任务'} · ${t.title}</span><span>${getTaskProgress(t.id)}%</span></div><div class="task-track-step">${getCurrentStepDesc(t.id)}</div><div class="task-track-progress"><i style="width:${getTaskProgress(t.id)}%"></i></div></div>`).join('');}
    function ensureTaskUI(){addTaskButton();checkTaskTriggers();updateTaskTracker();resetDailyTasks();resetWeeklyTasks();}

    let activeRegionDebuff = null;
    let activeRegionBuff = null;
    // 区域切换采用“缓冲区 + 短确认”机制，防止玩家在十字边界附近来回抖动触发重逻辑。
    let pendingRegion = null;
    let pendingRegionSince = 0;
    let regionNoticeTimer = null;
    const REGION_SWITCH_MARGIN = 52;
    const REGION_SWITCH_CONFIRM_MS = 140;
    let isPlayerTurn = true;
    let currentBossPhase = 1;
    let isBossFight = false;
    let isTribulation = false;
    let skipEnemyTurn = false; // 冰龙冻结效果
    let playerPressureTurns = 0; // 战斗运行时：玩家受到境界威压的剩余回合
    let playerPressureStun = false;

    function resetRuntimeState() {
      if(typeof closeExpansionV286827==='function')closeExpansionV286827();
      document.getElementById('postCaseV286826')?.remove();document.getElementById('storyBossPrepV286826')?.remove();
      if(typeof rainCloseV286822==='function')rainCloseV286822();
      battleCheckpointV286812=null;
      if(typeof resetWarMapV2840==='function')resetWarMapV2840();
      if(typeof closeWarPanelV2839==='function')closeWarPanelV2839();
      if(typeof closeSceneV2838==='function')closeSceneV2838(false);
      if(typeof closeJevWorldV2846==='function')closeJevWorldV2846();
      document.getElementById('afterBattleV2838')?.remove();
      document.getElementById('journeyPrepareV2838')?.remove();
      document.getElementById('scrollMapV2831')?.remove();
      document.getElementById('taskPanel')?.remove();
      gameState = 'exploring';
      clearSkillFxV2786();
      currentEnemy = null;
      currentMonsterRef = null;
      currentCombatReturnMode = 'location';
      currentCombatReturnLocation = null;
      currentRegion = null; activeRegionDebuff = null; activeRegionBuff = null;
      pendingRegion = null; pendingRegionSince = 0;
      if (regionNoticeTimer) { clearTimeout(regionNoticeTimer); regionNoticeTimer = null; }
      clearCombatFinishTimersV2764();
      window.InkSkillFxV2854?.clear(true);
      COMBAT_FINISH_V2764.pending = null;
      COMBAT_FINISH_V2764.settling = false;
      COMBAT_FINISH_V2764.deferredAfterReturn = null;
      COMBAT_FINISH_V2764.token++;
      document.getElementById('combatPanel')?.classList.remove('combat-settling-v2764');
      isPlayerTurn = true;
      currentBossPhase = 1;
      isBossFight = false;
      isTribulation = false;
      skipEnemyTurn = false;
      playerPressureTurns = 0;
      playerPressureStun = false;
      // 存档若恰好发生在突破动画中，重载后解除运行时锁，避免永久卡死。
      if (player?.breakthrough) player.breakthrough.isAnimating = false;
      document.getElementById('breakthroughOverlay')?.remove();
      document.getElementById('breakthroughSuccess')?.remove();
      document.getElementById('breakthroughFail')?.remove();
      document.body?.classList.remove('breakthrough-playing');
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }
    
    // ================== 工具函数 ==================
    
    // V27.89 unique piece counts and additive threshold bonuses, shared by stats/UI/scoring.
    function getSetProgressV2789(loadout=player.equipment){
      const worn=new Set(Object.values(loadout||{}).filter(Boolean).map(n=>getEquipData(n)?.forgeBaseV2825||n));
      return Object.entries(EQUIPMENT_SET_BONUSES).map(([name,set])=>{
        const pieces=new Map();
        if(set.familyV2790)for(const n of worn){const d=getEquipData(n);if(d?.familyV2790===set.familyV2790)pieces.set(d.pieceV2790,Math.max(pieces.get(d.pieceV2790)||0,d.gradeV2790));}
        const count=set.familyV2790?pieces.size:set.items.filter(n=>worn.has(n)).length,bonus={};
        const immortal=!!set.familyV2790&&pieces.size===set.items.length&&[...pieces.values()].every(g=>g>=3);
        for(const tier of set.tiers)if(count>=tier.count)for(const [key,value] of Object.entries(tier.bonus))bonus[key]=(bonus[key]||0)+value;
        return {name,set,count,bonus,immortal,missing:set.items.filter((n,i)=>set.familyV2790?!pieces.has(i):!worn.has(n))};
      });
    }
    function checkSetBonuses(target=player){
      if(!target)return [];
      return target.activeSetBonuses=getSetProgressV2789(target.equipment).filter(p=>p.count>=p.set.tiers[0].count).map(p=>p.name);
    }
    function getSetBonusStats(){
      checkSetBonuses(player);
      const result={atk:0,def:0,hp:0,mp:0,crit:0,resist:0,damage:0};
      for(const p of getSetProgressV2789())for(const [k,v] of Object.entries(p.bonus))result[k]=(result[k]||0)+v;
      return result;
    }
    function getSetBonus(){return getSetBonusStats();}
    function reduceSetDamageV2789(damage){
      const ratio=Math.min(.4,Math.max(0,getSetBonusStats().resist||0)/100);
      const after=Math.max(0,Math.floor(damage*(1-ratio)));
      if(ratio&&damage>0)addCombatLog(`套装抵消 ${damage-after} 点伤害。`,'heal');
      return after;
    }
    function describeSetBonusV2789(b){
      const names={atk:'攻击',def:'防御',hp:'气血',mp:'灵力',crit:'暴击率',resist:'敌方命中减伤',damage:'攻击伤害'};
      return Object.entries(b).map(([k,v])=>`${names[k]||k}+${k==='damage'?Math.round(v*100):v}${['crit','resist','damage'].includes(k)?'%':''}`).join('、')||'未激活';
    }
    function renderSetProgressV2789(){
      return '<button class="choice-btn" onclick="showOldGearShopV2792()">🏮 六套装备 · 灵品 / 宝器 / 仙器</button><details style="margin-top:12px"><summary style="color:#ffd76a;cursor:pointer">🧩 套装进度与获取提示</summary>'+getSetProgressV2789().map(p=>`<div style="padding:10px 0;border-bottom:1px solid #555"><b>${p.name} ${p.count}/${p.set.items.length}件</b>${p.set.familyV2790?`<p>${p.set.desc}</p><p>全仙器：${p.immortal?'已集齐':`需${p.set.items.length}件均为仙器`}${p.set.oldFamilyV2792?'（旧套装按件数加成，不另增终极机制）':''}</p>`:''}<p style="color:#69f0ae">当前：${describeSetBonusV2789(p.bonus)}</p>${p.set.tiers.map(t=>`<p style="color:${p.count>=t.count?'#69f0ae':'#aaa'}">${p.count>=t.count?'✅':'🔒'} ${t.count}件新增：${describeSetBonusV2789(t.bonus)}</p>`).join('')}<p>未穿戴：${p.missing.join('、')||'已集齐并穿戴'}</p></div>`).join('')+'<p>按不同部件计数，重复佩戴同名装备不增加件数。各档加成累加；玄冰与天星已使用独立前缀部件。 一键换装计入套装收益，已锁定装备保留。</p><p>可在装备商店查找部件，仍需满足装备境界要求。三套新增剑均有灵品、宝器、仙器版本，可计入套装；原加成门槛保持不变。旧版青云剑甲等两件套不属于以上套装。</p></details>';
    }

    function getEquipmentStat(statName, slots=null){
      let total=0;
      for(const slot of Object.keys(EQUIPMENT_SLOTS)){
        const name=player.equipment?.[slot],data=name&&getEquipData(name);if(!data)continue;
        const value=!slots||slots.includes(slot)?Number(data.stats?.[statName]||0):Number(data.forgeAffixStatsV2825?.[statName]||0);
        total+=value*getQualityInfo(data.quality).multiplier;
      }
      return Math.floor(total+1e-8);
    }
    function getEquipAtk(){return getEquipmentStat('atk',['weapon','offhand','bracer','ring1','ring2','artifact1','artifact2','artifact3','lifeArtifact'])+(getSetBonusStats().atk||0);}
    function getEquipDef(){return getEquipmentStat('def',['head','robe','bracer','belt','pants','boots','offhand','jade','artifact1','artifact2','artifact3','lifeArtifact'])+(getSetBonusStats().def||0);}
    function getEquipHp(){return getEquipmentStat('hp',['head','robe','belt','necklace','jade','artifact1','artifact2','artifact3','lifeArtifact'])+(getSetBonusStats().hp||0);}
    function getEquipMp(){return getEquipmentStat('mp',['robe','belt','necklace','artifact1','artifact2','artifact3','lifeArtifact'])+(getSetBonusStats().mp||0);}
    function getEquipCrit(){return getEquipmentStat('crit',['necklace','weapon','ring1','ring2','artifact1','artifact2','artifact3','lifeArtifact'])+(getSetBonusStats().crit||0);}
    function getEquipCritDmg(){return getEquipmentStat('critDmg',['ring1','ring2','weapon','lifeArtifact']);}
    function getEquipDodge(){return getEquipmentStat('dodge',['pants','boots','artifact1','artifact2','artifact3','lifeArtifact']);}
    function getEquipBlock(){return getEquipmentStat('block',['bracer','offhand','lifeArtifact']);}
    function getEquipResist(){return getEquipmentStat('resistance',['jade','head','lifeArtifact'])+(getSetBonusStats().resist||0);}

    function ownerPetTraitBonusV286849(key){return typeof getOwnerPetTraitBonusV286849==='function'?getOwnerPetTraitBonusV286849(key):0;}
    function getControlResistanceV286849(){return Math.min(.6,(gearModsV2790().controlResist||0)+ownerPetTraitBonusV286849('resistance'));}
    function getAtk(){
      let atk=player.baseAtk+getPhaseScaledBonus('atkBonus')+getEquipAtk()+calculateFurnitureBonus().atk;
      if(player.activePet){const t=PET_TYPES[player.activePet.type];if(t?.bonus?.type==='atk')atk+=t.bonus.value+player.activePet.level*2;}
      return Math.floor(atk*(1+(gearModsV2790().atkPct||0))*(1+miniBoonV286840('atk')));
    }
    
    function getDef(){
      let def=player.baseDef+getPhaseScaledBonus('defBonus')+getEquipDef()+calculateFurnitureBonus().def;
      if(player.activePet){const t=PET_TYPES[player.activePet.type];if(t?.bonus?.type==='def')def+=t.bonus.value+player.activePet.level*3;}
      if(hasStatusEffect('guyuan'))def=Math.floor(def*1.10);
      return Math.floor(def*(1+(gearModsV2790().defPct||0))*(1+miniBoonV286840('def'))*(1+ownerPetTraitBonusV286849('def')));
    }
    
    function getCritRateWithSet(){return getCritRate();}
    
    function getDamageBonusWithSet(){return getSetBonusStats().damage||0;}
    
    function getMaxHp(){let max=player.maxHp+getPhaseScaledBonus('hpBonus')+getEquipHp();if(activeRegionDebuff?.type==='corruption')max=Math.floor(max*.90);return Math.max(1,Math.floor(max*(1+(gearModsV2790().hpPct||0))*(1+ownerPetTraitBonusV286849('hp'))));}
    
    function getMaxMp(){const base=Math.max(0,Number(player.maxMp)||0)+Math.floor(player.level*12+(player.phase||0)*4);let max=base*2+getEquipMp();return Math.max(1,Math.floor(max*(1+(gearModsV2790().mpPct||0))));}


    // ================== 气血/灵力下限保护 ==================
    // 所有界面与战斗统一：HP 最低为 0，绝不显示负数。
    function clampPlayerVitals() {
      if (!player) return;
      const maxHp = Math.max(1, Number(getMaxHp()) || 1);
      const maxMp = Math.max(1, Number(getMaxMp()) || 1);
      player.hp = Math.max(0, Math.min(maxHp, Number(player.hp) || 0));
      player.mp = Math.max(0, Math.min(maxMp, Number(player.mp) || 0));
    }

    function clampEnemyVitals(enemy=currentEnemy) {
      if (!enemy) return;
      const maxHp = Math.max(1, Number(enemy.maxHp || enemy.hp || 1));
      enemy.maxHp = maxHp;
      enemy.hp = Math.max(0, Math.min(maxHp, Number(enemy.hp) || 0));
    }

    function getRegionMpRecoveryMultiplier() {
      let mult = activeRegionDebuff?.type === 'cold' ? 0.80 : 1;
      if (hasStatusEffect('jingmai')) mult *= 0.80;
      if (hasStatusEffect('lingmai')) mult *= 1.30;
      return mult;
    }
    
    function getCritRate(){let crit=.10+getEquipCrit()/100+(gearModsV2790().crit||0);if(player.activePet){const t=PET_TYPES[player.activePet.type];if(t?.bonus?.type==='crit')crit+=t.bonus.value+player.activePet.level*.01;}return Math.min(crit,.60);}
    

    function getCritDamage(){return 1.5+getEquipCritDmg()/100+(gearModsV2790().critDmg||0)+miniBoonV286840('crit');}
    function getDodgeRate(){return Math.min(.30,getEquipDodge()/100);}
    function getBlockRate(){return Math.min(.25,getEquipBlock()/100);}
    function getCharacterStats(){return {atk:getAtk(),def:getDef(),maxHp:getMaxHp(),maxMp:getMaxMp(),crit:getCritRate(),critDmg:getCritDamage(),dodge:getDodgeRate(),block:getBlockRate(),resist:getEquipResist()};}

    function getGoldBonus() {
      let bonus = 1 + calculateFurnitureBonus().gold;
      if (player.activeArtifact) {
        const artType = ARTIFACT_TYPES[player.activeArtifact.type];
        if (artType.effect.type === 'gold') {
          bonus += artType.effect.value + player.activeArtifact.level * 0.02;
        }
      }
      return bonus;
    }
    
    function getExpBonus() {
      let bonus = 1;
      if (player.activeArtifact) {
        const artType = ARTIFACT_TYPES[player.activeArtifact.type];
        if (artType.effect.type === 'exp') {
          bonus += artType.effect.value + player.activeArtifact.level * 0.02;
        }
      }
      return bonus;
    }
    
    function updateStats() {
      if(typeof syncSectTodoV2868==='function')syncSectTodoV2868();
      updateCombatMpV2820();
      if(typeof renderMonsterAiV2844==='function')renderMonsterAiV2844();
      if(typeof renderCompanionV2849==='function')renderCompanionV2849();
      migrateLooseEquipmentToEquipmentInventory(player);
      clampPlayerVitals();
      const realm = CULTIVATION_REALMS[player.level];
      
      document.getElementById('statName').textContent = player.name;
      document.getElementById('statCultivation').textContent = getCultivationName();
      document.getElementById('statHp').textContent = `${player.hp}/${getMaxHp()}`;
      document.getElementById('statMp').textContent = `${player.mp}/${getMaxMp()}`;
      document.getElementById('statAtk').textContent = getAtk();
      document.getElementById('statDef').textContent = getDef();
      document.getElementById('statGold').textContent = player.gold;
      document.getElementById('statExp').textContent = `${player.exp}/${getCurrentExpNeed()}`;
      
      // 更新装备显示
      const equipSlot=document.getElementById('equipmentSlot');
      if(equipSlot){const eqCount=Object.values(player.equipment||{}).filter(Boolean).length;const setText=player.activeSetBonuses?.length?` · 🎯${player.activeSetBonuses.join('、')}`:'';equipSlot.innerHTML=`<span class="equip-item">⚔️ ${player.equipment.weapon||'主武器空'}</span><span class="equip-item">👘 ${player.equipment.robe||'法袍空'}</span><span class="equip-item" style="border-color:#ffd76a;cursor:pointer" onclick="showEquipmentPanel()">🎒 全部装备 ${eqCount}/${Object.keys(EQUIPMENT_SLOTS).length}${setText}</span>`;}
      
      // 更新物品栏
      const invDiv = document.getElementById('inventory');
      if (player.inventory.length === 0) {
        invDiv.textContent = '空空如也';
      } else {
        invDiv.innerHTML = player.inventory.map(item => {
          const data = ITEMS[item];
          const equipTip = data?.type === 'weapon' ? '⚔️ 点击装备' : data?.type === 'armor' ? '🛡️ 点击装备' : '';
          return `<span class="inventory-item" onclick="useItem('${item}')" title="${data?.desc || ''}">${item}${equipTip ? `<small style="display:block;color:#ffd76a;margin-top:2px">${equipTip}</small>` : ''}</span>`;
        }).join('');
      }
      
      // 更新快捷栏
      updateQuickBar();
      
      // 更新故事进度
      updateStoryProgress();
      const deepPanel=document.getElementById('characterPanel');
      if(deepPanel && !deepPanel.classList.contains('hidden')) updateCharacterPanelDeep();
    }
    
    function updateQuickBar() {
      const quickBar = document.getElementById('quickBar');
      let html = '';
      
      if (player.activePet) {
        const petType = PET_TYPES[player.activePet.type];
        html += `<span class="equip-item" style="border-color: #00ffff; background: rgba(0,255,255,0.2);">
          ${petType.icon} Lv.${player.activePet.level} ${player.activePet.name}
        </span> `;
      }
      
      if (player.activeArtifact) {
        const artType = ARTIFACT_TYPES[player.activeArtifact.type];
        html += `<span class="equip-item" style="border-color: #ff00ff; background: rgba(255,0,255,0.2);">
          ${artType.icon} +${player.activeArtifact.level} ${player.activeArtifact.name}
        </span>`;
      }
      
      quickBar.innerHTML = html || '<span style="color: #aaa; font-size: 11px;">暂无宠物或法宝</span>';
    }
    
    function updateStoryProgress() {
      const maxIndex = Math.max(0, STORY_CHAPTERS.length - 1);
      let idx = Number(player?.storyProgress);
      if (!Number.isFinite(idx)) idx = 0;
      idx = Math.max(0, Math.min(maxIndex, Math.floor(idx)));
      if (player) player.storyProgress = idx;
      const currentChapter = STORY_CHAPTERS[idx] || STORY_CHAPTERS[0];
      const titleEl = document.getElementById('storyChapterTitle');
      const fillEl = document.getElementById('storyProgressFill');
      if (titleEl) titleEl.textContent = currentChapter?.title || '仙途';
      const progress = maxIndex > 0 ? (idx / maxIndex) * 100 : 100;
      if (fillEl) fillEl.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }
    
    function showStory(text, choices) {
      window.jevStoryChangedV2846?.();
      document.getElementById('storyPanel')?.classList.remove('equipment-bag-view-v2803','equipment-bag-expanded-v2803');
      refreshProtagonistPortraits();
      document.getElementById('storyPanel').classList.remove('hidden');
      document.getElementById('combatPanel').classList.add('hidden');
      document.getElementById('alchemyPanel').classList.add('hidden');
      document.getElementById('petPanel').classList.add('hidden');
      document.getElementById('artifactPanel').classList.add('hidden');
      document.getElementById('storyText').innerHTML = text;
      document.getElementById('storyPanel').classList.toggle('loop-panel-v286840',!!document.getElementById('storyText').querySelector('.loop-board-v286840'));
      
      const choicesDiv = document.getElementById('choices');
      choicesDiv.innerHTML = choices.map((c, i) => {
        const disabled = c.condition && !c.condition() ? 'disabled style="opacity:0.5"' : '';
        let btnClass = 'choice-btn';
        if (c.boss) btnClass += ' boss-btn';
        if (c.story) btnClass += ' story-btn';
        if (c.tribulation) btnClass += ' tribulation-btn';
        return `<button class="${btnClass}" onclick="handleChoice(${i})" ${disabled}>${c.text}</button>`;
      }).join('');
      
      gameState = 'exploring';
      currentChoices = choices;
      updateStats();
    }
    
    function authoredStoryCombatV286835(enemy){
      return enemy?.name==='宗门试炼守将'||enemy?.name==='幽冥鬼王'||enemy?.name==='血魔老祖'||enemy?.name==='天劫';
    }
    function makeAuthoredBossV286835(name){
      const src=name==='天劫'?TRIBULATION:BOSSES[name];
      if(!src)return null;
      return {name:src.name,hp:src.hp,maxHp:src.hp,atk:src.atk,def:src.def,gold:src.gold,exp:src.exp,phases:src.phases,skills:src.skills,phaseMessages:src.phaseMessages};
    }
    function balanceEnemyV2802(enemy,isBoss=false,isTrib=false){
      if(!enemy||enemy._isTutorial||enemy.tournamentFight||enemy._nightRivalV2810||[4,9].includes(enemy._rainChapterV286822)||authoredStoryCombatV286835(enemy))return enemy;
      ensureEnemyRealm(enemy);
      const lv=Math.max(0,Math.min(CULTIVATION_REALMS.length-1,Number(enemy._realmLevel)||0));
      const ph=Math.max(0,Math.min(3,Number(enemy._realmPhase)||0));
      const tier=isTrib?'tribulation':isBoss?'boss':enemy._isElite?'elite':'normal';
      const key=`${lv}:${ph}:${tier}`;
      if(enemy._balanceKeyV2802===key)return enemy;
      const oldMax=Math.max(1,Number(enemy.maxHp)||Number(enemy.hp)||1);
      const ratio=Math.max(0,Math.min(1,(Number(enemy.hp)||0)/oldMax));
      const base=enemy._balanceBaseV2802||(enemy._balanceBaseV2802={hp:oldMax,atk:Math.max(1,Number(enemy.atk)||1),def:Math.max(0,Number(enemy.def)||0)});
      const realm=CULTIVATION_REALMS[lv],stage=getRealmStageMultiplierV2794(lv,ph);
      const scale={normal:[1,1,1],elite:lv===2?[1.35,1.05,1.05]:[1.65,1.15,1.15],boss:[3.2,1.3,1.25],tribulation:[3.6,1.35,1.3]}[tier];
      enemy.maxHp=Math.max(base.hp,Math.round((180+realm.hpBonus*3)*stage*scale[0]));
      enemy.hp=ratio===0?0:Math.max(1,Math.round(enemy.maxHp*ratio));
      enemy.atk=Math.max(base.atk,Math.round((18+realm.atkBonus*.9)*stage*scale[1]));
      enemy.def=Math.max(base.def,Math.round((8+realm.defBonus*.85)*stage*scale[2]));
      enemy._balanceKeyV2802=key;
      return enemy;
    }

    function getEnemy() {
      const maxIndex = Math.min(Math.floor((player.level || 0) * .8) + 1, ENEMIES.length - 1);
      const index = Math.floor(Math.random() * (Math.max(0,maxIndex) + 1));
      const enemy = { ...ENEMIES[index] };
      ensureEnemyRealm(enemy);
      if(enemy._isElite){
        enemy.hp=Math.floor(enemy.hp*1.5);
        enemy.atk=Math.floor(enemy.atk*1.3);
        enemy.def=Math.floor(enemy.def*1.2);
      }
      enemy.maxHp = enemy.hp;
      return balanceEnemyV2802(enemy);
    }
    
    // ================== 战斗系统 ==================
    
    function startCombat(enemy, isBoss = false, isTrib = false, monsterRef = null) {
      if(!enemy || gameState==='combat' || gameState==='combat-ending' || COMBAT_FINISH_V2764.settling || player.breakthrough?.isAnimating)return false;
      battleCheckpointV286812={owner:player,raw:JSON.stringify(createSaveDataV2768())};
      document.getElementById('afterBattleV2838')?.remove();
      if(typeof closeWarPanelV2839==='function')closeWarPanelV2839();
      if(typeof closeSceneV2838==='function')closeSceneV2838(false);
      COMBAT_FINISH_V2764.token++;
      document.getElementById('scrollMapV2831')?.remove();
      stopNavigationV2830();
      clearCombatValuesV2818();document.getElementById('combatResultHistoryV2818')?.remove();
      currentMonsterRef = monsterRef;
      currentCombatReturnMode = monsterRef ? 'world' : 'location';
      currentCombatReturnLocation = player?.location || null;
      ensureEnemyRealm(enemy);
      balanceEnemyV2802(enemy,isBoss,isTrib);
      currentEnemy = enemy;
      if(enemy._nightRivalV2810&&player.level>=15)enemy._originV286826={turns:0,collapsed:false};
      guardsV2785.delete(currentEnemy);
      gearBattleV2790.delete(currentEnemy);
      setupTacticsV286821();
      gameState = 'combat';
      player.hp=Math.min(getMaxHp(),player.hp+Math.ceil(getMaxHp()*miniBoonV286840('hp')));
      player.mp=Math.min(getMaxMp(),player.mp+Math.ceil(getMaxMp()*miniBoonV286840('mp')));
      isPlayerTurn = true;
      isBossFight = isBoss;
      isTribulation = isTrib;
      currentBossPhase = 1;
      skipEnemyTurn = false;
      playerPressureTurns = 0;
      playerPressureStun = false;
      currentEnemy._pressureTurns = 0;
      currentEnemy._pressureStun = false;
      currentEnemy.thunderDomainDamage = 0;
      currentEnemy.thunderDomainTurns = 0;
      currentEnemy._skipReason = '';
      currentEnemy._spellSealTurnsV286817 = 0;
      for(const key of ['_chillTurnsV286818','_iceBreakTurnsV286818','_frostTurnsV286818','_frostDamageV286818'])currentEnemy[key]=0;
      currentEnemy.burnStacks=currentEnemy.burnTurns=0;
      currentEnemy._burnHealBlockV286818=currentEnemy._burnWeakV286818=false;
      elementGuardsV286818.delete(currentEnemy);
      player._thunderArmorTurns = 0;
      player._thunderDamageBonus = 0;
      player._thunderReflectRatio = 0;
      if(typeof initMonsterAiV2844==='function')initMonsterAiV2844();
      if(typeof initNpcBattleV2849==='function')initNpcBattleV2849();
      combatBagState.open = false;
      combatBagState.tab = 'all';
      
      // 初始化音频
      initAudio();
      
      // 设置战斗面板样式
      const combatPanel = document.getElementById('combatPanel');
      combatPanel.classList.remove('hidden');
      combatPanel.classList.remove('boss-panel');
      document.getElementById('storyPanel').classList.add('hidden');
      document.getElementById('alchemyPanel').classList.add('hidden');
      document.getElementById('petPanel').classList.add('hidden');
      document.getElementById('artifactPanel').classList.add('hidden');
      
      if (isBoss || isTrib) {
        combatPanel.classList.add('boss-panel');
        document.getElementById('enemyName').classList.add('boss-name');
        document.getElementById('bossPhase').classList.remove('hidden');
        document.getElementById('bossPhase').textContent = `第 ${currentBossPhase} 阶段`;
        playSound('boss');
      } else {
        document.getElementById('enemyName').classList.remove('boss-name');
        document.getElementById('bossPhase').classList.add('hidden');
      }
      
      document.getElementById('playerCombatName').textContent = player.name;
      document.getElementById('enemyName').textContent = enemy.name;
      updateCombatUI();
      
      let logText = `⚔️ 战斗开始！你遇到了 <b>${enemy.name}</b>！`;
      if (isBoss) logText = `👹 首领战开始！<b>${enemy.name}</b>现身！`;
      if (isTrib) logText = `⚡ 天劫降临！渡劫开始！`;
      
      document.getElementById('combatLog').innerHTML = `<div class="log-item">${logText}</div>`;
      const openingPressure = calculateRealmPressure(player.level, player.phase, currentEnemy._realmLevel || 0, currentEnemy._realmPhase || 0);
      const openingDesc = getPressureDisplay(openingPressure);
      addCombatLog(`⚖️ 境界对比：${getCultivationName()} vs ${getEnemyRealmNameV2811(currentEnemy)}${openingDesc ? ` · ${openingDesc}` : ''}`,'boss');
      if(currentEnemy._balanceKeyV2802)addCombatLog(`🛡️ ${isTrib?'天劫':isBoss?'首领':currentEnemy._isElite?'精英':'普通'} · 气血 ${currentEnemy.maxHp} · 攻击 ${currentEnemy.atk} · 防御 ${currentEnemy.def}`,'boss');
      if(currentEnemy._isElite) addCombatLog('⭐ 精英敌人：境界与基础属性更高，击败后更值得挑战。','boss');
      updateCombatChoices();
      autoSave();
    }
    
    function updateCombatMpV2820(){
      const text=document.getElementById('combatMpTextV2820'),meter=document.getElementById('combatMpMeterV2820'),fill=document.getElementById('combatMpFillV2820'),box=document.getElementById('combatMpStatusV2820'),hint=document.getElementById('combatMpHintV2820');
      if(!text||!meter||!fill||!box||!hint||!player)return;
      const max=Math.max(0,Math.floor(Number(getMaxMp())||0)),now=Math.max(0,Math.min(max,Math.floor(Number(player.mp)||0))),pct=max?now/max*100:0;
      text.textContent=`${now} / ${max}`;fill.style.width=pct+'%';meter.setAttribute('aria-valuemax',String(max));meter.setAttribute('aria-valuenow',String(now));meter.setAttribute('aria-valuetext',`${now} / ${max} 灵力`);
      box.classList.toggle('mp-low-v2820',pct<=20);hint.textContent=now===0?'灵力耗尽':pct<=20?'灵力偏低':'';
    }

    function updateCombatUI() {
      updateCombatMpV2820();
      if(typeof renderCompanionV2849==='function')renderCompanionV2849();
      clampPlayerVitals();
      clampEnemyVitals();
      const playerHpNow=Math.max(0,Math.round(player.hp));
      const playerHpMax=Math.max(1,Math.round(getMaxHp()));
      const enemyHpNow=Math.max(0,Math.round(currentEnemy.hp));
      const enemyHpMax=Math.max(1,Math.round(currentEnemy.maxHp));
      document.getElementById('playerCombatHp').textContent = `${playerHpNow}/${playerHpMax}`;
      document.getElementById('playerHpFill').style.width = `${Math.max(0,Math.min(100,(playerHpNow / playerHpMax) * 100))}%`;
      document.getElementById('enemyHpText').textContent = `${enemyHpNow}/${enemyHpMax}`;
      document.getElementById('enemyHpFill').style.width = `${Math.max(0,Math.min(100,(enemyHpNow / enemyHpMax) * 100))}%`;
      const enemyNameEl=document.getElementById('enemyName');
      if(enemyNameEl){
        const elite=currentEnemy._isElite?' ⭐':'';
        enemyNameEl.innerHTML=`${escapeGameText(currentEnemy.name)}${elite} <span style="font-size:11px;color:#aaa">(${getEnemyRealmNameV2811(currentEnemy)})</span>${currentEnemy._originV286826?`<small> · ${currentEnemy._originV286826.collapsed?'道基崩裂：攻击+20% / 禁疗 / 行动自损4%':'魔典燃源：攻击+10% / 防御+25% · '+Math.min(3,currentEnemy._originV286826.turns)+'/3'}</small>`:''}`;
      }
      const playerNameEl=document.getElementById('playerCombatName');
      if(playerNameEl) playerNameEl.innerHTML=`${escapeGameText(player.name)} <span style="font-size:11px;color:#aaa">(${getCultivationName()})</span>`;
      if (isBossFight || isTribulation) {
        document.getElementById('bossPhase').textContent = `第 ${currentBossPhase} 阶段`;
      }
      renderCombatMedicineDrawer?.();
    }
    
    function updateCombatChoices() {
      if (!isPlayerTurn) return;
      
      const choicesDiv = document.getElementById('combatChoices');
      let html = `<button class="choice-btn" onclick="combat('attack')">⚔️ 普攻 · 命中回灵</button>`;
      
      player.skills.forEach((skill, i) => {
        const disabled = player.mp < skill.mpCost ? 'disabled' : '';
        html += `<button class="choice-btn" onclick="combat('skill', ${i})" ${disabled}>✨ ${skill.name} (${skill.mpCost}灵力)</button>`;
      });
      
      // 主战斗界面不直接展示任何丹药，只保留一个“战斗背包”入口。
      // 回血/回灵丹药需要玩家主动打开背包后才显示，避免主界面拥挤。
      const combatConsumableCount = getCombatConsumables().reduce((sum,it)=>sum+(it.count||0),0);
      html += `<button class="choice-btn combat-bag-btn" onclick="toggleCombatMedicineDrawer()">🎒 战斗背包${combatConsumableCount?` (${combatConsumableCount})`:''}</button>`;
      
      // Boss战不能逃跑
      if (canFleeV286818()) {
        html += `<button class="choice-btn" onclick="combat('flee')">🏃 逃跑 ${Math.round(fleeChanceV286818()*100)}%</button>`;
        if(player.inventory.includes('神行符'))html+=`<button class="choice-btn" onclick="combat('escapeScroll')">神行符 · 必定脱战</button>`;
      }
      
      choicesDiv.innerHTML = html;
      renderCombatMedicineDrawer?.();
      updateStats();
    }
    
    function addCombatLog(text, type = '') {
      const log = document.getElementById('combatLog');
      const item = document.createElement('div');
      item.className = 'log-item ' + (type ? 'log-' + type : '');
      item.innerHTML = text;
      log.insertBefore(item, log.firstChild);
      // 只保留最近120条战斗日志，避免长战斗持续积累DOM。
      while(log.childElementCount>120)log.lastElementChild.remove();
    }
    
    // 宠物攻击
    function petAttack() {
      if (!player.activePet || !currentEnemy || gameState!=='combat') return 0;
      
      const pet = player.activePet;
      const petType = PET_TYPES[pet.type];
      const petBaseDamage = Math.max(1,Math.floor((petType.baseAtk + pet.level * petType.growthAtk + Math.floor(Math.random() * 5)) * (typeof getPetCombatMultiplier==='function'?getPetCombatMultiplier(pet):1)));
      // 灵宠继承主人的大境界层级，避免越级战斗时宠物固定伤害绕过境界压制。
      const petResult=calculateFinalDamage({
        attacker:{level:player.level,phase:player.phase,atk:petBaseDamage,def:0,pressureTurns:playerPressureTurns},
        defender:{level:currentEnemy._realmLevel||0,phase:currentEnemy._realmPhase||0,def:enemyDefenseV286818(),hp:currentEnemy.hp,name:currentEnemy.name,pressureTurns:currentEnemy._pressureTurns||0},
        skill:null,isCrit:false,isPet:true,isBoss:isBossFight||isTribulation
      });
      const petDamage=petResult.damage;
      
      // 火凤灼烧效果
      let burnDamage = 0;
      if (petType.bonus.type === 'burn') {
        burnDamage = Math.floor(petDamage * petType.bonus.value);
      }
      
      // 冰龙冻结效果
      let frozen = false;
      if (petType.bonus.type === 'freeze' && Math.random() < petType.bonus.value) {
        frozen = true;
        skipEnemyTurn = true;
      }
      
      currentEnemy.hp = Math.max(0, currentEnemy.hp - petDamage);
      showDamageNumber(petDamage, 'enemy', false, false, false, true, pet.name);
      playHitEffect('enemy');
      
      const speciesIcon=getWorldMonsterIcon(pet.speciesV286818||pet.name||'');
      let logText = `${speciesIcon==='👾'?petType.icon:speciesIcon} ${pet.name}攻击造成 ${petDamage} 点伤害！`;
      if (burnDamage > 0) {
        currentEnemy.hp = Math.max(0, currentEnemy.hp - burnDamage);
        logText += ` <span style="color:#ff6600;">灼烧${burnDamage}!</span>`;
      }
      if (frozen) {
        logText += ` <span style="color:#00ffff;">敌人被冻结!</span>`;
      }
      addCombatLog(logText, 'pet');
      // 灵宠补刀也必须进入统一结算，不能把敌人留在 0 血界面。
      if (currentEnemy.hp <= 0) checkBattleEnd();
      return petDamage + burnDamage;
    }
    
    // 法宝效果
    function applyArtifactEffects(phase) {
      if (!player.activeArtifact) return;
      
      const art = player.activeArtifact;
      const artType = ARTIFACT_TYPES[art.type];
      
      // 长生锁回血
      if (artType.effect.type === 'regen' && phase === 'start') {
        const heal = Math.floor(getMaxHp() * (artType.effect.value + art.level * 0.01));
        player.hp = Math.min(getMaxHp(), player.hp + heal);
        addCombatLog(`长生锁恢复 ${heal} 点气血！`, 'heal');
      }
      
      // 遁光梭闪避
      if (artType.effect.type === 'dodge' && phase === 'defense' && Math.random() < artType.effect.value + art.level * 0.01) {
        addCombatLog(`遁光梭发动，闪避了攻击！`, 'heal');
        return true; // 闪避成功
      }
      
      // 护心镜减伤
      if (artType.effect.type === 'reduce' && phase === 'damage') {
        return artType.effect.value + art.level * 0.015; // 返回减伤比例
      }
      
      return false;
    }
    
    // 元素状态随本场敌人存活；不写入角色永久面板。
    const elementGuardsV286818=new WeakMap();
    function enemyDefenseV286818(enemy=currentEnemy,skill=null){
      const weak=!!skill&&skill.element===weaknessV286821(enemy);
      return Math.max(0,Number(enemy?.def)||0)*Math.max(.5,(enemy?.burnTurns>0?.85:1)*(enemy?._iceBreakTurnsV286818>0?.75:1)*(weak?.75:1))*(enemy?._originV286826&&!enemy._originV286826.collapsed?1.25:1);
    }
    function enemyAttackV286818(enemy=currentEnemy){
      const chill=enemy?._chillTurnsV286818>0?Math.min(.55,enemy._chillV286818||.3):0;
      return Math.max(1,Number(enemy?.atk)||1)*(1-chill*.5)*(enemy?.burnTurns>0&&enemy?._burnWeakV286818 ? .85 : 1)*(enemy?._originV286826?(enemy._originV286826.collapsed?1.2:1.1):1);
    }
    function applyElementHitV286818(skill,damage){
      const e=currentEnemy;if(!e||e.hp<=0)return;
      if(skill.element==='ice'){
        const slow=skill.effect==='heavySlow'?.55:.3;
        e._chillV286818=Math.max(e._chillTurnsV286818>0?e._chillV286818||0:0,slow);
        e._chillTurnsV286818=Math.max(e._chillTurnsV286818||0,2);
        addCombatLog(`❄ 寒迟：接下来两次行动追击速度降低${Math.round(e._chillV286818*100)}%，攻击面板降低${Math.round(e._chillV286818*50)}%。`,'pet');
        if(skill.effect==='defDown')e._iceBreakTurnsV286818=2;
        const chances={'冰封千里':.8,'绝对零度':1,'冰蝶幻舞':.35,'冰河葬狱':1,'冰魄封魂':1,'万载寒晶':1,'寒渊领域':.35};
        if(chances[skill.name]&&Math.random()<chances[skill.name]){skipEnemyTurn=true;e._skipReason='冻结';addCombatLog('寒冰凝结，敌人下一次行动被冻结。','pet');}
        if(skill.effect==='freezeSilence')sealEnemySpellsV286817(1);
        if(['iceField','coldDomain','eternalIce'].includes(skill.effect)){
          e._frostDamageV286818=Math.max(e._frostDamageV286818||0,Math.max(1,Math.floor(damage*.12)));e._frostTurnsV286818=3;
          addCombatLog(`冰寒侵蚀：未来3次主动出招前各受到${e._frostDamageV286818}点冰伤。`,'damage');
        }
      }
      if(skill.element==='fire'){
        if(skill.effect==='burnDetonate'){
          const extra=Math.max(0,Math.floor(e.burnStacks||0))*Math.max(0,e.burnTurns||0);
          if(extra){e.hp=Math.max(0,e.hp-extra);showDamageNumber(extra,'enemy',false,false,false,false,'灼烧引爆');addCombatLog(`🔥 引爆剩余灼烧，追加${extra}点伤害，灼烧与破甲消散。`,'damage');}
          e.burnTurns=0;e.burnStacks=0;e._burnHealBlockV286818=false;e._burnWeakV286818=false;return;
        }
        e.burnStacks=Math.max(e.burnTurns>0?e.burnStacks||0:0,Math.max(1,Math.floor(damage*.2)));
        e.burnTurns=Math.max(e.burnTurns||0,skill.name==='太阳真火'?4:(skill.duration|| (skill.name==='焚天烈焰'?3:2)));
        e._burnHealBlockV286818=!!e._burnHealBlockV286818||skill.effect==='healBlockBurn';
        e._burnWeakV286818=!!e._burnWeakV286818||skill.effect==='atkDownBurn';
        addCombatLog(`🔥 灼烧${e.burnStacks}点×${e.burnTurns}次，期间防御降低15%；同类取最高、不累加。`,'damage');
        if(e._burnHealBlockV286818)addCombatLog('业火禁疗：灼烧期间无法妖元回生。','pet');
        if(skill.effect==='fireBind'){e._chillV286818=.3;e._chillTurnsV286818=1;addCombatLog('流火缠身，下次行动追击速度降低30%、攻击面板降低15%。','pet');}
      }
    }
    function applyElementGuardV286818(skill){
      const old=elementGuardsV286818.get(currentEnemy),pool=Math.floor(getMaxHp()*.2);
      elementGuardsV286818.set(currentEnemy,{owner:player,pool:Math.max(old?.owner===player?old.pool:0,pool),turns:3,element:skill.element});
      addCombatLog(`护盾展开：吸收最多${pool}点伤害，持续敌方3次行动；同类不叠加。`,'heal');
    }
    function absorbElementGuardV286818(damage){
      const g=elementGuardsV286818.get(currentEnemy);if(!g||g.owner!==player||g.turns<=0)return damage;
      const absorbed=Math.min(g.pool,damage);g.pool-=absorbed;
      if(absorbed>0)addCombatLog(`元素护盾吸收${absorbed}点伤害，剩余${g.pool}。`,'heal');
      return damage-absorbed;
    }
    function finishEnemyElementsV286818(enemy,owner){
      if(currentEnemy!==enemy||player!==owner)return;
      for(const key of ['_chillTurnsV286818','_iceBreakTurnsV286818'])if(enemy[key]>0)enemy[key]--;
      const g=elementGuardsV286818.get(enemy);if(g?.owner===owner&&--g.turns<=0)elementGuardsV286818.delete(enemy);
      if(gameState==='combat'){updateCombatUI();updateCombatChoices();}
    }
    function canFleeV286818(){return !!currentEnemy&&!isBossFight&&!isTribulation&&!currentEnemy.tournamentFight&&!currentEnemy._warV2839&&!currentEnemy._isTaskBattle&&!currentEnemy._isTutorial;}
    function fleeChanceV286818(){
      if(!canFleeV286818())return 0;
      const ours=100+Math.max(0,getEquipmentStat('speed')),chill=currentEnemy._chillTurnsV286818>0?currentEnemy._chillV286818||.3:0;
      const theirs=(100+Math.max(0,Number(currentEnemy.speed)||0))*(1-chill);
      const realm=Number(player.level||0)-Number(currentEnemy._realmLevel||0),phase=Number(player.phase||0)-Number(currentEnemy._realmPhase||0);
      return Math.max(.15,Math.min(.95,.6+.2*(ours-theirs)/Math.max(ours,theirs)+realm*.10+phase*.025));
    }

    // 普攻命中回灵：只属于主角直接普攻，宠物、持续伤害与技能不重复触发。
    function restoreAttackMpV286817(damage) {
      if (!(damage > 0)) return 0;
      const gain=Math.max(0,Math.min(getMaxMp()-player.mp,Math.max(1,Math.floor(10*getRegionMpRecoveryMultiplier()))));
      if(gain){player.mp+=gain;addCombatLog(`普攻调息，恢复 ${gain} 点灵力。`,'heal');}
      return gain;
    }
    function sealEnemySpellsV286817(turns=2) {
      if(!currentEnemy || currentEnemy.hp<=0)return;
      currentEnemy._spellSealTurnsV286817=Math.max(currentEnemy._spellSealTurnsV286817||0,turns);
      addCombatLog(`⚡ 封脉：${currentEnemy.name}接下来 ${turns} 次行动不能施展术法或回生，仍可物理攻击、护体与回气。`,'pet');
    }
    // 这是境界提示，不伪装为完整胜率预测；精英与当前气血另行提醒。
    function enemyRiskV286817(enemy) {
      const gap=Number(enemy?._realmLevel??player.level)-Number(player.level||0);
      if(gap>0)return {label:'越境危险',color:'#7f2028'};
      if(enemy?._isElite)return {label:'精英慎战',color:'#854818'};
      if(gap<0)return {label:'境界占优',color:'#245e43'};
      return {label:'同境交锋',color:'#403e39'};
    }
    // 仙鹤灵力恢复
    function applyMpRegen() {
      gearRestoreV2790();
      if (player.activePet) {
        const petType = PET_TYPES[player.activePet.type];
        if (petType.bonus.type === 'mpRegen') {
          const baseRegen = petType.bonus.value + Math.floor(player.activePet.level * 0.5);
          const regen = Math.max(1, Math.floor(baseRegen * getRegionMpRecoveryMultiplier()));
          player.mp = Math.min(getMaxMp(), player.mp + regen);
          addCombatLog(`仙鹤灵韵恢复 ${regen} 点灵力！${getRegionMpRecoveryMultiplier()<1?'（北域寒气影响）':''}`, 'heal');
        }
      }
    }
    
    const guardsV2785 = new WeakMap();
    function applyGuardV2785(skill) {
      if(!currentEnemy || !skill.guardRatio)return;
      const old=guardsV2785.get(currentEnemy);
      const ratio=Math.max(old?.owner===player?old.ratio:0,skill.guardRatio);
      guardsV2785.set(currentEnemy,{owner:player,ratio});
      addCombatLog(`护体生效：本场下一次命中伤害降低${Math.round(ratio*100)}%（同类取最高，不叠加）。`,'heal');
    }
    function consumeGuardV2785(damage) {
      const guard=guardsV2785.get(currentEnemy);
      if(!guard || guard.owner!==player || damage<=0)return damage;
      guardsV2785.delete(currentEnemy);
      const after=Math.max(0,Math.floor(damage*(1-guard.ratio)));
      addCombatLog(`护体抵消 ${damage-after} 点伤害，护体已消耗。`,'heal');
      return after;
    }
    function healSkillV2785(skill) {
      const max=getMaxHp(), before=player.hp;
      const ratio=skill.emergencyHeal && before<=max*.25?skill.emergencyHeal:skill.heal;
      const amount=Math.max(0,Math.min(max-before,Math.floor(max*ratio)));
      player.hp+=amount;
      showDamageNumber(amount,'player',true,false,false,false,skill.name,skill.mpCost);
      addCombatLog(`施展【${skill.name}】，实际恢复 ${amount} 点气血！`,'heal');
      if(skill.mpRestore){
        const mp=Math.max(0,Math.min(getMaxMp()-player.mp,skill.mpRestore));
        player.mp+=mp;addCombatLog(`归元恢复 ${mp} 点灵力。`,'heal');
      }
      applyGuardV2785(skill);
    }
    function swordAfterHitV2785(skill,actualLoss) {
      if(skill.element!=='sword')return;
      if(skill.lifeSteal){
        const heal=Math.max(0,Math.min(getMaxHp()-player.hp,Math.floor(actualLoss*skill.lifeSteal),Math.floor(getMaxHp()*.15)));
        player.hp+=heal;showDamageNumber(heal,'player',true,false,false,false,skill.name+'·吸血');
        addCombatLog(`饮血剑意实际恢复 ${heal} 点气血。`,'heal');
      }
      applyGuardV2785(skill);
    }

    function battleLaterV2838(callback,delay) {
      const owner=player,enemy=currentEnemy,token=COMBAT_FINISH_V2764.token;
      return setTimeout(()=>{if(player===owner&&currentEnemy===enemy&&gameState==='combat'&&COMBAT_FINISH_V2764.token===token)callback();},delay);
    }

    // Preserve the established multiplicative zones and per-zone rounding.
    // Defense, crit and variance remain in calculateFinalDamage; on-hit effects
    // remain in gearHitV2790. No additive rebalance is hidden in this cleanup.
    function playerDamageBonusesV286812(damage,skill=null){
      const factors=[1+getDamageBonusWithSet()];
      if(skill?.element==='sword'&&hasStatusEffect('jianqi'))factors.push(1.15);
      if(skill?.element==='thunder'&&(player._thunderArmorTurns||0)>0){
        factors.push(1+(player._thunderDamageBonus||.35));
        addCombatLog('⚡ 雷神附体强化了本次雷系伤害！','pet');
      }
      const artifact=player.activeArtifact,type=ARTIFACT_TYPES[artifact?.type];
      if(type?.effect.type==='damage')factors.push(1+type.effect.value+artifact.level*.02);
      if(!skill&&type?.effect.type==='chain'&&Math.random()<type.effect.value+artifact.level*.02){
        factors.push(1.5);addCombatLog('雷珠发动连锁！','damage');
      }
      if(skill?.executeBonus&&currentEnemy.hp<=currentEnemy.maxHp*.3){
        factors.push(1+skill.executeBonus);addCombatLog('追魂剑意：残血追击，伤害增加50%！','damage');
      }
      return factors.reduce((value,factor)=>Math.floor(value*factor),damage);
    }

    function combat(action, skillIndex) {
      if (!isPlayerTurn || gameState!=='combat' || !currentEnemy || currentEnemy.hp<=0) return;
      // 在扣回合、持续伤害和法宝效果之前检查，拒绝过期按钮及未携带技能。
      if(action==='flee'||action==='escapeScroll'){
        if(!canFleeV286818()){addCombatLog('此战必须分出胜负，无法脱战。');return;}
        if(action==='escapeScroll'&&!player.inventory.includes('神行符'))return;
      }
      if(action==='skill'){
        const usable=typeof getCombatSkillAvailabilityV2769==='function'?getCombatSkillAvailabilityV2769(skillIndex):{ok:false,reason:'技能配置尚未就绪'};
        if(!usable.ok){showFloatingText?.(usable.reason,'#ffd76a');updateCombatChoices?.();return;}
      }
      if(currentEnemy._warV2839)currentEnemy._warV2839.awaitingAction=true;
      if(playerPressureStun && Math.random()<getControlResistanceV286849()){playerPressureStun=false;addCombatLog('护持稳神，抵抗本次威压控制。','heal');}
      if(playerPressureStun && action !== 'flee' && action !== 'escapeScroll'){
        playerPressureStun=false;
        playerPressureTurns=Math.max(0,playerPressureTurns-1);
        isPlayerTurn=false;
        addCombatLog('👑 境界威压令你气机凝滞，本回合无法出手！','boss');
        battleLaterV2838(()=>enemyTurn(),500);
        return;
      }
      isPlayerTurn = false;
      
      if(currentEnemy._frostTurnsV286818>0){
        currentEnemy.hp=Math.max(0,currentEnemy.hp-currentEnemy._frostDamageV286818);currentEnemy._frostTurnsV286818--;
        addCombatLog(`冰寒侵蚀造成${currentEnemy._frostDamageV286818}点伤害。`,'damage');
      }
      // 处理灼烧伤害
      if (currentEnemy && currentEnemy.burnStacks > 0 && currentEnemy.burnTurns > 0) {
        currentEnemy.hp = Math.max(0, currentEnemy.hp - currentEnemy.burnStacks);
        addCombatLog(`灼烧造成 ${currentEnemy.burnStacks} 点伤害！`, 'damage');
        currentEnemy.burnTurns--;
        if (currentEnemy.burnTurns <= 0){currentEnemy.burnStacks=0;currentEnemy._burnHealBlockV286818=currentEnemy._burnWeakV286818=false;}
        updateCombatUI();
      }
      // 万雷噬狱持续雷域：在玩家行动前结算一次，不会把气血扣成负数。
      if (currentEnemy && currentEnemy.thunderDomainDamage > 0 && currentEnemy.thunderDomainTurns > 0) {
        const thunderTick=Math.max(1,Math.floor(currentEnemy.thunderDomainDamage));
        currentEnemy.hp=Math.max(0,currentEnemy.hp-thunderTick);
        notifyThunderVfxV286844('tick','雷域',thunderTick);
        currentEnemy.thunderDomainTurns--;
        addCombatLog(`⚡ 万雷噬狱雷域轰击，造成 ${thunderTick} 点持续雷伤！`, 'damage');
        if(currentEnemy.thunderDomainTurns<=0){currentEnemy.thunderDomainDamage=0;addCombatLog('⚡ 雷域渐渐消散。','pet');}
        updateCombatUI();
      }
      
      // 战斗开始时应用法宝效果
      applyArtifactEffects('start');
      if(currentEnemy.hp<=0){checkBattleEnd();return;}
      
      if (action === 'attack') {
        playAttackAnimation('player');
        playSound('attack');
        
        battleLaterV2838(() => {
          const attackResult=calculateFinalDamage({skill:prepareGearSkillV2790(null),
            attacker:{level:player.level,phase:player.phase,atk:getAtk(),def:getDef(),pressureTurns:playerPressureTurns},
            defender:{level:currentEnemy._realmLevel||0,phase:currentEnemy._realmPhase||0,def:enemyDefenseV286818(),hp:currentEnemy.hp,name:currentEnemy.name,pressureTurns:currentEnemy._pressureTurns||0},
            isCrit:Math.random()<getCritRateWithSet(),isBoss:isBossFight||isTribulation,critMultiplier:getCritDamage()
          });
          let damage=attackResult.damage;
          const isCrit=attackResult.isCrit;
          const pressureText=getPressureDisplay(attackResult.pressureInfo);
          if(pressureText)addCombatLog(pressureText,'boss');
          if(attackResult.isUnderdog)addCombatLog('⚡ 顿悟爆发！越级一击威力暴涨！','boss');
          applyPressureToEnemy(attackResult);
          if(playerPressureTurns>0)playerPressureTurns--;
          
          damage=playerDamageBonusesV286812(damage);
          damage=gearHitV2790(damage,null);
          if(typeof monsterGuardDamageV2844==='function')damage=monsterGuardDamageV2844(damage);
          currentEnemy.hp = Math.max(0, currentEnemy.hp - damage);
          restoreAttackMpV286817(damage);
          hitTacticsV286821(null,damage);
          showDamageNumber(damage, 'enemy', false, isCrit, false, false, '普通攻击');
          playHitEffect('enemy');
          playSound('hit');
          
          const critText = isCrit ? '【暴击】' : '';
          addCombatLog(`${critText}你对${currentEnemy.name}造成 ${damage} 点伤害！`, 'damage');
          
          // 宠物攻击
          if (player.activePet && currentEnemy.hp > 0) {
            battleLaterV2838(() => petAttack(), 200);
          }
          
          checkBattleEnd();
        }, 150);
        return;
        
      } else if (action === 'skill') {
        const skill = player.skills[skillIndex];
        player.mp -= skill.mpCost;
        updateCombatMpV2820();
        
        // 雷神附体：不直接造成伤害，开启3回合雷铠，强化后续雷系伤害并反伤。
        if (skill.effect === 'thunder_armor') {
          player._thunderArmorTurns=Math.max(1,Number(skill.buffTurns)||3);
          player._thunderDamageBonus=Math.max(0,Number(skill.thunderBonus)||.35);
          player._thunderReflectRatio=Math.max(0,Number(skill.reflectRatio)||.25);
          playSkillEffect(skill.name, skill.element);
          notifyThunderVfxV286844('armor',skill.name);
          playSound('skill');
          addCombatLog(`⚡ 施展【雷神附体】：${player._thunderArmorTurns}回合内雷系伤害 +${Math.round(player._thunderDamageBonus*100)}%，受击反伤 ${Math.round(player._thunderReflectRatio*100)}%！`, 'heal');
          updateCombatUI();
          battleLaterV2838(() => enemyTurn(), 500);
          return;
        }

        if(['iceArmor','fireShield'].includes(skill.effect)){
          applyElementGuardV286818(skill);playSkillEffect(skill.name,skill.element);updateCombatUI();
          battleLaterV2838(()=>enemyTurn(),500);return;
        }
        // 治愈技能
        if (skill.element === 'heal') {
          healSkillV2785(skill);
          playSound('heal');
          playSkillEffect(skill.name, skill.element);
          updateCombatUI();
          
          // 治愈后敌人回合
          battleLaterV2838(() => enemyTurn(), 500);
          return;
        }
        
        playAttackAnimation('player');
        if (!skill.silent) playSound('skill');
        
        battleLaterV2838(() => {
          playSkillEffect(skill.name, skill.element);
        }, 150);
        
        battleLaterV2838(() => {
          const skillResult=calculateFinalDamage({
            attacker:{level:player.level,phase:player.phase,atk:getAtk(),def:getDef(),pressureTurns:playerPressureTurns},
            defender:{level:currentEnemy._realmLevel||0,phase:currentEnemy._realmPhase||0,def:enemyDefenseV286818(currentEnemy,skill),hp:currentEnemy.hp,name:currentEnemy.name,pressureTurns:currentEnemy._pressureTurns||0},
            skill:prepareGearSkillV2790(skill),isCrit:Math.random()<Math.min(.6,getCritRateWithSet()+(['thunder','ice','fire'].includes(skill.element)?gearModsV2790().spellCrit||0:0)),isBoss:isBossFight||isTribulation,critMultiplier:getCritDamage()
          });
          let damage=skillResult.damage;
          const isCrit=skillResult.isCrit;
          const pressureText=getPressureDisplay(skillResult.pressureInfo);
          if(pressureText)addCombatLog(pressureText,'boss');
          if(skillResult.isUnderdog)addCombatLog('⚡ 顿悟爆发！越级施法突破极限！','boss');
          applyPressureToEnemy(skillResult);
          if(playerPressureTurns>0)playerPressureTurns--;
          
          damage=playerDamageBonusesV286812(damage,skill);
          damage=gearHitV2790(damage,skill);
          if(typeof monsterGuardDamageV2844==='function')damage=monsterGuardDamageV2844(damage);
          const actualLossV2785=Math.min(currentEnemy.hp,damage);
          currentEnemy.hp = Math.max(0, currentEnemy.hp - damage);
          swordAfterHitV2785(skill,actualLossV2785);
          showDamageNumber(damage, 'enemy', false, isCrit, false, false, skill.name,skill.mpCost);
          playHitEffect('enemy');
          if (!skill.silent) playSound('hit');
          
          const critText = isCrit ? '【暴击】' : '';
          addCombatLog(`${critText}施展【${skill.name}】，对${currentEnemy.name}造成 ${damage} 点伤害！`, 'damage');
          
          hitTacticsV286821(skill,damage);
          applyElementHitV286818(skill,damage);

          // 雷系进阶控制与持续效果。
          if (skill.element === 'thunder') {
            if (skill.effect === 'paralyze' && Math.random() < (skill.statusChance || .42)) {
              sealEnemySpellsV286817(2);
            } else if (skill.effect === 'stun' && Math.random() < (skill.statusChance || .68)) {
              skipEnemyTurn = true;
              currentEnemy._skipReason='眩晕';
              addCombatLog(`⚡ 九天神雷震荡神魂，${currentEnemy.name}陷入眩晕！`, 'boss');
            }
            if (skill.effect === 'thunder_domain') {
              currentEnemy.thunderDomainDamage=Math.max(1,Math.floor(damage*(skill.domainRatio||.16)));
              currentEnemy.thunderDomainTurns=Math.max(1,Number(skill.domainTurns)||3);
              notifyThunderVfxV286844('domain',skill.name);
              addCombatLog(`⚡ 雷域成形：未来 ${currentEnemy.thunderDomainTurns} 回合持续轰击，每回合约 ${currentEnemy.thunderDomainDamage} 点雷伤。`, 'damage');
            }
            if (skill.effect === 'armor_pierce') {
              addCombatLog(`⚡ 神雷贯体：本次攻击穿透 ${Math.round((skill.armorPierce||0)*100)}% 防御！`, 'pet');
            }
            if (skill.effect === 'chain') {
              addCombatLog(`⚡ 闪电链完成首击；当前战斗为单目标，连锁电弧将保留至多目标战斗使用。`, 'pet');
            }
          }
          
          // 宠物攻击
          if (player.activePet && currentEnemy.hp > 0) {
            battleLaterV2838(() => petAttack(), 200);
          }
          
          checkBattleEnd();
        }, 300);
        return;
        
      } else if (action === 'heal') {
        // V19：战斗中禁用丹药。保留分支仅用于兼容旧按钮/旧页面缓存。
        isPlayerTurn = true;
        addCombatLog('战斗中无法使用丹药，请使用治疗技能。');
        updateCombatChoices();
        return;
        const healItems = player.inventory.filter(i => ITEMS[i] && ITEMS[i].type === 'heal');
        if (healItems.length === 0) {
          isPlayerTurn = true;
          addCombatLog('没有丹药了！');
          return;
        }
        const item = healItems[0];
        const idx = player.inventory.indexOf(item);
        player.inventory.splice(idx, 1);
        player.hp = Math.min(getMaxHp(), player.hp + ITEMS[item].value);
        
        showDamageNumber(ITEMS[item].value, 'player', true, false, false, false, item);
        playSound('heal');
        addCombatLog(`使用${item}，恢复 ${ITEMS[item].value} 点气血！`, 'heal');
        
        updateCombatUI();
        battleLaterV2838(() => enemyTurn(), 500);
        return;
        
      } else if (action === 'flee'||action === 'escapeScroll') {
        if(currentEnemy?._warV2839){isPlayerTurn=true;addCombatLog('正魔交锋需分出胜负；退场后可在军务中撤军。');updateCombatChoices();return;}
        if (currentEnemy?.tournamentFight) {
          isPlayerTurn=true;updateCombatChoices();
          addCombatLog('📯 宗门大比擂台不可逃战！');
          return;
        }
        const assured=action==='escapeScroll';
        if(assured)player.inventory.splice(player.inventory.indexOf('神行符'),1);
        if (assured || Math.random() < fleeChanceV286818()) {
          addCombatLog(assured?'神行符化作清风，已脱离敌人！':'🏃 逃跑成功，已脱离敌人！', 'heal');
          beginCombatFinishV2764('flee', {disabled:false, watchdogDelay:1800});
          try { releaseCurrentMapMonster(false); }
          finally { readyCombatFinishV2764({kind:'flee', delay:220}); }
          return;
        } else {
          addCombatLog('逃跑失败！');
          battleLaterV2838(() => enemyTurn(), 500);
          return;
        }
      }
    }
    
    // ================== 地图怪物战利品 ==================
    // 普通地图怪可额外掉落装备；品质随怪物境界、地域危险度与精英状态提升。
    function rollWorldMonsterEquipmentDrop(enemy) {
      if (!enemy || typeof EQUIPMENT_DB === 'undefined' || !EQUIPMENT_DB) return null;
      const region = (typeof getRegionInfo === 'function') ? getRegionInfo(enemy._regionId || currentRegion || 'south') : null;
      const danger = Math.max(1, Number(region?.dangerLevel || 1));
      const realm = Math.max(0, Number(enemy._realmLevel ?? player?.level ?? 0));
      const elite = !!enemy._isElite;

      // 南域普通怪约10%，危险地域与精英逐步提高，最高约28%。
      const dropChance = Math.min(0.28, 0.08 + danger * 0.02 + (elite ? 0.08 : 0));
      if (Math.random() >= dropChance) return null;

      // Drop tiers keep their original order and weights; shop-only grades never enter this pool.
      const dropOrder = ['MORTAL','GOOD','FINE','EXCELLENT','SPIRIT','IMMORTAL'];
      const weights = [55, 28, 11, 4, 1.6, 0.4];
      let maxDrop = 0;
      if (realm >= 1) maxDrop = 1;      // 良品
      if (realm >= 2) maxDrop = 2;      // 上品
      if (realm >= 3) maxDrop = 3;      // 精品
      if (realm >= 6) maxDrop = 4;      // 灵宝
      if (realm >= 10) maxDrop = 5;     // 仙器
      if (elite && Math.random() < 0.25) maxDrop = Math.min(5, maxDrop + 1);

      const availableQualities = dropOrder.slice(0, maxDrop + 1);
      let total = availableQualities.reduce((sum, q, i) => sum + weights[i], 0);
      let roll = Math.random() * total;
      let pickedQuality = availableQualities[0];
      for (let i = 0; i < availableQualities.length; i++) {
        roll -= weights[i];
        if (roll <= 0) { pickedQuality = availableQualities[i]; break; }
      }

      // 穿戴型法宝/飞行法器保持稀有来源，不纳入普通装备掉落。
      let candidates = Object.entries(EQUIPMENT_DB).filter(([name, data]) => {
        if (!data || data.quality !== pickedQuality) return false;
        if ((data.realmRequired || 0) > realm + (elite ? 1 : 0)) return false;
        if (data.slot === 'artifact' || data.slot === 'flying' || data.slot === 'lifeArtifact') return false;
        return true;
      });

      // 若抽到的品质当前没有可用装备，向低品质回退，避免空掉落。
      if (!candidates.length) {
        for (let qi = maxDrop; qi >= 0 && !candidates.length; qi--) {
          const q = dropOrder[qi];
          candidates = Object.entries(EQUIPMENT_DB).filter(([name, data]) =>
            data && data.quality === q &&
            (data.realmRequired || 0) <= realm + (elite ? 1 : 0) &&
            !['artifact','flying','lifeArtifact'].includes(data.slot)
          );
          if (candidates.length) pickedQuality = q;
        }
      }
      if (!candidates.length) return null;

      const [name, data] = candidates[Math.floor(Math.random() * candidates.length)];
      if (!Array.isArray(player.equipmentInventory)) player.equipmentInventory = [];
      player.equipmentInventory.push(name);
      const q = EQUIPMENT_QUALITIES[data.quality] || {name:data.quality || '装备',icon:'',color:'#ffd98a'};
      addCombatLog(`🎁 装备掉落：${q.icon || ''} ${q.name}【${name}】！`, 'gold');
      playSound?.('item');
      return name;
    }

    function rollWorldMonsterBonusGold(enemy) {
      if (!enemy) return 0;
      const region = (typeof getRegionInfo === 'function') ? getRegionInfo(enemy._regionId || currentRegion || 'south') : null;
      const danger = Math.max(1, Number(region?.dangerLevel || 1));
      const realm = Math.max(0, Number(enemy._realmLevel ?? player?.level ?? 0));
      const elite = !!enemy._isElite;
      // 地图实体怪额外散落少量灵石，确保“地图打怪”有稳定战利品反馈。
      const min = 4 + danger * 3 + realm * 2;
      const max = min + 8 + danger * 5 + (elite ? 18 : 0);
      const amount = Math.max(1, Math.floor(min + Math.random() * Math.max(1, max - min + 1)));
      player.gold += amount;
      addCombatLog(`💰 搜得额外 ${amount} 灵石`, 'gold');
      return amount;
    }

    function checkBattleEnd() {
      if (!currentEnemy || gameState!=='combat' || COMBAT_FINISH_V2764.settling) return;
      updateCombatUI();
      
      if (currentEnemy.hp <= 0) {
        if(currentEnemy._warV2839){finishWarDuelV2839(true);return;}
        if (COMBAT_FINISH_V2764.settling) return;
        const tournamentFightV2764 = !!currentEnemy?.tournamentFight;
        const tournamentEnemyV2779=currentEnemy;
        let shouldBreakthroughV2764 = false;
        const rewardOwnerV2838=player,rewardBeforeV2838={gold:player.gold,exp:player.exp};
        beginCombatFinishV2764('victory', {disabled:true, watchdogDelay:3200});
        (() => {
          try {
          addCombatLog(`🎉 击败了 ${currentEnemy.name}！`, 'gold');
          miniBattleResultV2778(currentEnemy,true);
          onBattleVictory?.(currentEnemy);
          recordTripWinV286821(currentEnemy);
          finishRainBattleV286822(currentEnemy);
          finishRainTwoV286827(currentEnemy);
          if(typeof finishFirstJourneyBattleV28687==='function')finishFirstJourneyBattleV28687(currentEnemy);
          
          let goldGain = Math.floor(battleGoldV28683(currentEnemy) * getGoldBonus());
          const earlyGoldBonus=getEarlyBattleBonusV2773(currentEnemy);goldGain+=earlyGoldBonus;
          let expGain = Math.floor(battleExpV28683(currentEnemy) * getExpBonus());
          
          player.gold += goldGain;
          player.exp += expGain;
          addCombatLog(`获得 ${goldGain} 灵石，${expGain} 修为${earlyGoldBonus?`（含历练补贴 ${earlyGoldBonus} 灵石）`:''}`, 'gold');
          // 越级击杀：仅普通非大比敌人追加奖励
          const enemyRealmValue=(currentEnemy._realmLevel||0)+((currentEnemy._realmPhase||0)/4);
          const playerRealmValue=(player.level||0)+((player.phase||0)/4);
          if(!isBossFight&&!isTribulation&&!currentEnemy?.tournamentFight&&enemyRealmValue>playerRealmValue){
            const bonusExp=Math.max(1,Math.floor(expGain*REALM_PRESSURE_CONFIG.underdogExpBonus));
            player.exp+=bonusExp;
            addCombatLog(`⚡ 越级挑战成功！额外修为 +${bonusExp}！`,'heal');
            if(Math.random()<.15){
              const rare=['天元丹','星辰砂','龙血果'];
              const drop=rare[Math.floor(Math.random()*rare.length)];
              if(drop==='天元丹')player.inventory.push(drop);else player.materials[drop]=(player.materials[drop]||0)+1;
              addCombatLog(`🎁 越级奖励：获得 ${drop}！`,'gold');
            }
          }
          // Boss战胜利处理
          if (isBossFight) {
            addCombatLog(`🏆 击败首领【${currentEnemy.name}】！`, 'boss');
            if(currentEnemy._nightRivalV2810&&player.level>=16)yeStateV2816().saintVictory=true;
            if(!currentEnemy._nightRivalV2810)player.bossesDefeated.push(currentEnemy.name);
            else addCombatLog('夜无疆退入界隙：“今日是你胜了。你的路还没到尽头……我的圣道，却已断了。”','boss');
            playSound('victory');
            
            // Boss掉落特殊物品
            if (currentEnemy.name === '宗门试炼守将') {
              player.inventory.push('精钢剑');
              player.inventory.push('大还丹');
              addCombatLog(`获得 精钢剑、大还丹！`, 'gold');
              playSound('item');
            } else if (currentEnemy.name === '幽冥鬼王') {
              player.inventory.push('灵剑');
              player.inventory.push('天材地宝');
              addCombatLog(`获得 灵剑、天材地宝！`, 'gold');
              playSound('item');
            } else if (currentEnemy.name === '血魔老祖') {
              player.inventory.push('仙剑');
              player.inventory.push('仙甲');
              addCombatLog(`获得 仙剑、仙甲！`, 'gold');
              playSound('item');
            }
            
            // 只有打赢当前地点章节写明的 Boss 才推进；提前打死守将不能跳过幽冥鬼王或血魔老祖。
            if (STORY_CHAPTERS[player.storyProgress]?.boss===currentEnemy.name) advanceStory();
            updateAchievementProgress('boss');
          }
          
          // 渡劫胜利处理
          if (isTribulation) {
            addCombatLog(`🌟 成功渡过飞升天劫！`, 'boss');
            player.tribulationAttempted = true;
            // 渡劫圆满飞升：仍严格由天劫胜利触发，不允许普通突破绕过。
            if (player.level === 9 && (player.phase || 0) >= 3) {
              const ascensionSnapshot = createBreakthroughSnapshot();
              player.level = 10;
              player.phase = 0;
              player.exp = 0;
              syncUnlockedSkills();
              player.maxLifespan = getTotalMaxLifespan();
              player.hp = getMaxHp();
              player.mp = getMaxMp();
              addCombatLog(`☀️ 仙门洞开！你已飞升仙界，晋升【地仙初期】！`, 'heal');
              updateAchievementProgress('realm');
              COMBAT_FINISH_V2764.deferredAfterReturn = () => playForcedAscensionBreakthrough(ascensionSnapshot);
            }
            playSound('victory');
            advanceStory();
            updateAchievementProgress('story');
          }
          
          // 普通怪物掉落；演武傀儡仅用于新手引路，不计野外掉落、清剿和随机捕获。
          if (!isBossFight && !isTribulation && !currentEnemy?._isTutorial && !currentEnemy?._isTaskBattle) {
            playSound('victory');

            // 地图上可见的游荡怪：额外灵石 + 概率装备。
            // 其它普通战斗仍保留原材料、丹药、宠物和法宝掉落。
            if (currentMonsterRef) {
              rollWorldMonsterBonusGold(currentEnemy);
              rollWorldMonsterEquipmentDrop(currentEnemy);
            }
            
            // 更新击杀数成就
            updateAchievementProgress('monster');
            
            // 材料掉落
            if (Math.random() > 0.5) {
              const materialDrops = ['灵草', '仙果', '妖丹'];
              const drop = materialDrops[Math.floor(Math.random() * materialDrops.length)];
              player.materials[drop] = (player.materials[drop] || 0) + 1;
              onCollectMaterial?.(drop,1);
              addCombatLog(`获得材料 ${drop}！`, 'gold');
              playSound('item');
            }
            
            // 丹药掉落
            if (Math.random() > 0.6) {
              const drops = ['小还丹', '聚灵丹', '悟道茶'];
              const drop = drops[Math.floor(Math.random() * drops.length)];
              player.inventory.push(drop);
              addCombatLog(`获得 ${drop}！`, 'gold');
              playSound('item');
            }
            
            // V27.9：击杀不再“随机自动捕获宠物”，避免与主动收服系统冲突。
            // 改为小概率掉落培养丹；真正获得灵宠需要在其存活且气血≤25%时主动收服。
            if (Math.random() < 0.12) {
              player.petMaterials['灵兽丹'] = (player.petMaterials['灵兽丹'] || 0) + 1;
              addCombatLog(`🍖 获得灵兽丹 ×1`, 'pet');
            }
            
            // 法宝掉落（稀有）
            if (Math.random() < 0.03) {
              dropRandomArtifact();
            }

            // 宗门清剿任务：仅普通怪物计数；Boss、天劫、百年大比对手不计入。
            if (!currentEnemy?.tournamentFight) addSectKill();

            // 地图实体怪物：胜利后从世界中移除，并补充新的游荡怪物
            if (currentMonsterRef) {
              releaseCurrentMapMonster(true);
            }
          }
          
          // 更新灵石峰值成就
          updateAchievementProgress('gold');
          
          // 奖励阶段只登记突破，必须先完成战斗退场，避免三层界面重叠。
          shouldBreakthroughV2764 = player.exp >= getCurrentExpNeed();
          if (shouldBreakthroughV2764 && player.breakthrough) player.breakthrough.pendingBreakthrough = true;
          if(typeof recordBattleSummaryV2838==='function')recordBattleSummaryV2838(tournamentEnemyV2779,rewardBeforeV2838);
          updateStats();
          autoSave();
        } catch (combatRewardErrorV2764) {
          console.error('[V27.65] 战斗奖励结算异常，已强制继续退场：', combatRewardErrorV2764);
          try { addCombatLog('⚠️ 部分战利品结算异常，已安全返回地图。', 'boss'); } catch (_) {}
        } finally {
          const pendingFinishV2764 = COMBAT_FINISH_V2764.pending;
          if (pendingFinishV2764) {
            const deferredV2764 = COMBAT_FINISH_V2764.deferredAfterReturn;
            COMBAT_FINISH_V2764.deferredAfterReturn = null;
            if (tournamentFightV2764) {
              readyCombatFinishV2764({
                kind:'victory', delay:420, skipReturn:true,
                label:'🏆 本轮结束 · 返回大比',
                afterReturn:() => recordTournamentRound(true,tournamentEnemyV2779)
              });
            } else {
              readyCombatFinishV2764({
                kind:'victory', delay:720,
                afterReturn:() => {
                  if (typeof deferredV2764 === 'function') {
                    setTimeout(() => { if(player!==rewardOwnerV2838||gameState!=='exploring'||currentEnemy)return;try { deferredV2764(); } catch (_) {} }, 420);
                  } else if (shouldBreakthroughV2764) {
                    setTimeout(() => {if(player===rewardOwnerV2838&&gameState==='exploring'&&!currentEnemy)checkLevelUp({ silentCooldown: true });}, 900);
                  }
                }
              });
            }
          }
        }
        })();
        return;
      }
      
      // Boss阶段转换
      if ((isBossFight || isTribulation) && currentEnemy.phases) {
        const hpPercent = currentEnemy.hp / currentEnemy.maxHp;
        const bossData = getCombatBossData(currentEnemy);
        
        if (bossData && currentBossPhase < bossData.phases) {
          const phaseThresholds = [0.75, 0.5, 0.25];
          if (hpPercent <= phaseThresholds[currentBossPhase - 1]) {
            currentBossPhase++;
            addCombatLog(`⚠️ ${bossData.phaseMessages[currentBossPhase - 1]}`, 'boss');
            showBossSkillWarning(bossData.skills[currentBossPhase - 1].name);
            playSound('boss');
          }
        }
      }
      
      const turnEnemyV2838=currentEnemy,turnOwnerV2838=player;
      setTimeout(() => {if(player===turnOwnerV2838&&currentEnemy===turnEnemyV2838&&gameState==='combat')enemyTurn();}, 800);
    }
    
    function showBossSkillWarning(skillName) {
      const warning = document.getElementById('bossSkillWarning');
      warning.textContent = `首领准备施展【${skillName}】！`;
      warning.classList.remove('hidden');
      setTimeout(() => warning.classList.add('hidden'), 1500);
    }
    
    function enemyTurn() {
      if (!currentEnemy || gameState!=='combat' || isPlayerTurn || COMBAT_FINISH_V2764.settling) return;
      const owner=player,enemy=currentEnemy,token=COMBAT_FINISH_V2764.token;
      const next=()=>{
        if(player!==owner||currentEnemy!==enemy||gameState!=='combat'||isPlayerTurn||COMBAT_FINISH_V2764.token!==token)return;
        if(enemy.hp<=0)return checkBattleEnd();
        if(typeof warDuelLimitV286841==='function'&&warDuelLimitV286841())return;
        return typeof runMonsterTurnV2844==='function'?runMonsterTurnV2844(resolveEnemyTurnV2844):resolveEnemyTurnV2844();
      };
      return typeof runCompanionTurnV2849==='function'?runCompanionTurnV2849(next):next();
    }
    function resolveEnemyTurnV2844(decision=null, done=()=>{}) {
      if (!currentEnemy || gameState!=='combat') { done(); return; }
      const turnEnemyV2838=currentEnemy,turnOwnerV2838=player;
      if (currentEnemy.hp <= 0) {
        checkBattleEnd();
        done(); return;
      }
      if (COMBAT_FINISH_V2764.settling) {done();return;}
      tickRivalOriginV286826(currentEnemy);
      
      // 境界威压震慑检查
      if(currentEnemy._pressureStun){
        currentEnemy._pressureStun=false;
        currentEnemy._pressureTurns=Math.max(0,(currentEnemy._pressureTurns||0)-1);
        addCombatLog(`${currentEnemy.name}被境界威压震慑，本回合无法行动！`,'boss');
        isPlayerTurn=true;applyMpRegen();updateCombatChoices();done();return;
      }
      // 冰龙冻结效果检查
      if (skipEnemyTurn) {
        skipEnemyTurn = false;
        const reason=currentEnemy?._skipReason||'冻结';
        if(currentEnemy)currentEnemy._skipReason='';
        addCombatLog(`敌人因${reason}无法行动！`, 'pet');
        isPlayerTurn = true;
        applyMpRegen();
        updateCombatChoices();
        done(); return;
      }
      
      const originalDoneV286818=done;let finishedV286818=false;
      done=()=>{if(finishedV286818)return;finishedV286818=true;try{finishEnemyElementsV286818(turnEnemyV2838,turnOwnerV2838);}finally{originalDoneV286818();}};
      const spellSealedV286817=(currentEnemy._spellSealTurnsV286817||0)>0;
      if(decision && typeof commitMonsterActionV2844==='function') {
        decision=commitMonsterActionV2844(decision);
        if(spellSealedV286817)currentEnemy._spellSealTurnsV286817--;
        if(decision.ended){done();return;}
        if(decision.utility) {
          isPlayerTurn=true;applyMpRegen();updateCombatUI();updateStats();updateCombatChoices();done();return;
        }
      }
      if(!decision && spellSealedV286817)currentEnemy._spellSealTurnsV286817--;
      playAttackAnimation('enemy');
      
      setTimeout(() => {
        try {
        if(player!==turnOwnerV2838||currentEnemy!==turnEnemyV2838||gameState!=='combat')return;
        let isCrit = Math.random() > 0.9;
        let enemySkill=decision?.skill||null;
        if(enemySkill){playBossSkillEffect(enemySkill.name);addCombatLog(`【${currentEnemy.name}】施展【${enemySkill.name}】！`,'boss');}
        if (!decision && !spellSealedV286817 && (isBossFight || isTribulation) && currentEnemy.phases) {
          const bossData = getCombatBossData(currentEnemy);
          const currentSkill = bossData?.skills?.[Math.min(currentBossPhase - 1, Math.max(0,(bossData?.skills?.length||1) - 1))] || null;
          if (Math.random() > 0.7 && currentSkill) {
            enemySkill=currentSkill;
            playBossSkillEffect(currentSkill.name);
            addCombatLog(`👹【${currentEnemy.name}】施展【${currentSkill.name}】！`, 'boss');
            isCrit=true;
          }
        }
        const enemyAttackResult=calculateFinalDamage({
          attacker:{level:currentEnemy._realmLevel||0,phase:currentEnemy._realmPhase||0,atk:enemyAttackV286818(),def:currentEnemy.def,pressureTurns:currentEnemy._pressureTurns||0},
          defender:{level:player.level,phase:player.phase,def:getDef(),hp:player.hp,name:player.name,pressureTurns:playerPressureTurns},
          skill:enemySkill,isCrit,isBoss:false
        });
        let enemyDamage=enemyAttackResult.damage;
        if(typeof hostileDamageV2849==='function')enemyDamage=hostileDamageV2849(enemyDamage);
        isCrit=enemyAttackResult.isCrit;
        const enemyPressureText=getPressureDisplay(enemyAttackResult.pressureInfo);
        if(enemyPressureText)addCombatLog(`${currentEnemy.name}：${enemyPressureText}`,'boss');
        if(enemyAttackResult.isUnderdog)addCombatLog(`⚡ ${currentEnemy.name}越级爆发！`,'boss');
        applyPressureToPlayer(enemyAttackResult);
        if(currentEnemy._pressureTurns>0)currentEnemy._pressureTurns--;
        
        // 法宝效果 - 闪避
        if (applyArtifactEffects('defense')) {
          isPlayerTurn = true;
          applyMpRegen();
          updateCombatChoices();
          return;
        }
        
        // 法宝效果 - 减伤
        const reduceRatio = applyArtifactEffects('damage');
        if (reduceRatio) {
          enemyDamage = Math.floor(enemyDamage * (1 - reduceRatio));
          addCombatLog(`护心镜减免了 ${Math.floor(reduceRatio * 100)}% 伤害！`, 'heal');
        }
        
        enemyDamage=gearIncomingV2790(enemyDamage);
        enemyDamage=reduceSetDamageV2789(enemyDamage);
        enemyDamage=defendTacticsV286821(enemyDamage);
        enemyDamage=Math.floor(enemyDamage*(1-Math.min(.2,miniBoonV286840('reduce'))));
        enemyDamage=consumeGuardV2785(enemyDamage);
        if(typeof companionGuardV2849==='function')enemyDamage=companionGuardV2849(enemyDamage);
        enemyDamage=absorbElementGuardV286818(enemyDamage);
        player.hp = Math.max(0, player.hp - enemyDamage);
        showDamageNumber(enemyDamage, 'player', false, isCrit, !!enemySkill, false, enemySkill?.name||currentEnemy.name+'·攻击');
        playHitEffect('player');
        
        const critText = isCrit ? '【暴击】' : '';
        addCombatLog(`${critText}${currentEnemy.name}对你造成 ${enemyDamage} 点伤害！`, 'damage');

        // 雷神附体反伤：敌方实际命中后触发，最低不会把敌方气血扣成负数。
        if ((player._thunderArmorTurns||0)>0 && (player._thunderReflectRatio||0)>0 && enemyDamage>0 && currentEnemy.hp>0) {
          const reflected=Math.max(1,Math.floor(enemyDamage*player._thunderReflectRatio));
          currentEnemy.hp=Math.max(0,currentEnemy.hp-reflected);
          notifyThunderVfxV286844('reflect','雷神附体·反噬',reflected);
          showDamageNumber(reflected,'enemy',false,false,false,false,'雷神附体·反噬');
          addCombatLog(`⚡ 雷纹铠甲反噬，回敬 ${reflected} 点雷电伤害！`, 'pet');
          try{playSkillEffect('雷神附体·反噬','thunder','passive');}catch(_){ }
        }
        if((player._thunderArmorTurns||0)>0){
          player._thunderArmorTurns--;
          if(player._thunderArmorTurns<=0){player._thunderDamageBonus=0;player._thunderReflectRatio=0;addCombatLog('⚡ 雷神附体消散。','pet');}
        }
        
        updateCombatUI();
        updateStats();
        if(currentEnemy.hp<=0){checkBattleEnd();return;}
        
        if (player.hp <= 0) {
          if(currentEnemy?._warV2839){finishWarDuelV2839(false);return;}
          const tournamentDefeatV2764 = !!currentEnemy?.tournamentFight;
          const tournamentEnemyV2779=currentEnemy;
          beginCombatFinishV2764('defeat', {disabled:false, watchdogDelay:2200});
          if (tournamentDefeatV2764) {
            addCombatLog('📯 本轮比武落败，但大比仍将继续。');
            playSound('defeat');
            player.hp=getMaxHp(); player.mp=getMaxMp();
            readyCombatFinishV2764({kind:'defeat', delay:420, skipReturn:true, label:'📯 本轮结束 · 返回大比', afterReturn:() => recordTournamentRound(false,tournamentEnemyV2779)});
            return;
          }
          miniBattleResultV2778(currentEnemy,false);
          addCombatLog('💀 你重伤倒地...');
          playSound('defeat');
          player.hp = 1;
          const defeatGoldLossV2777 = Math.floor(player.gold * 0.2);
          player.gold -= defeatGoldLossV2777;
          autoSave();
          try { releaseCurrentMapMonster(false); }
          finally {
            if (isBossFight) addCombatLog('首领战失败，需要重新挑战...');
            readyCombatFinishV2764({
              kind:'defeat', delay:650, skipReturn:true,
              afterReturn:() => showStory(`你被击败了，身受重伤回到村庄休养。损失身上灵石的20%（${defeatGoldLossV2777}灵石，不足1灵石部分舍去）。`, [{ text: '继续', action: 'village' }])
            });
          }
          return;
        }
        
        // 检测存活成就（气血值很低时存活）
        if (player.hp <= 10 && player.hp > 0) {
          updateAchievementProgress('survive');
        }
        
        isPlayerTurn = true;
        applyMpRegen();
        updateCombatChoices();
        } finally { done(); }
      }, 150);
    }
    
    // ================== 境界突破沉浸式过场 ==================
    let breakthroughAnimFrame = null;
    let breakthroughFinishTimer = null;
    let breakthroughNoticeAt = 0;

    function isFinalTribulationGate() {
      return (player?.level || 0) === 9 && (player?.phase || 0) >= 3;
    }

    function showBreakthroughNotice(text,color='#ff6b6b') {
      const now=performance.now();
      if(now-breakthroughNoticeAt<1100)return;
      breakthroughNoticeAt=now;
      showFloatingText?.(text,color);
    }

    function createBreakthroughSnapshot() {
      return {
        name:getCultivationName(),
        level:Number(player?.level)||0,
        phase:Number(player?.phase)||0,
        atk:getAtk(), def:getDef(), hp:getMaxHp(), mp:getMaxMp(),
        lifespan:getTotalMaxLifespan(),
        skills:(player?.skills||[]).map(s=>s?.name||s).filter(Boolean),
        unlockedRegions:typeof REGION_UNLOCK_LEVEL==='object' ? Object.keys(REGION_UNLOCK_LEVEL).filter(isRegionUnlocked) : []
      };
    }

    function recoverPendingBreakthroughV28683(){
      const pending=player.breakthrough?.pendingV28683;
      if(!pending)return false;
      player.breakthrough.pendingV28683=null;
      if(pending.key!==`${player.level}:${player.phase||0}`)return false;
      if(pending.success)applyBreakthroughSuccess(pending.result);else applyBreakthroughFailure(pending.result);
      return true;
    }
    function canAttemptBreakthrough() {
      if(player.breakthrough?.pendingV28683&&!player.breakthrough.isAnimating){recoverPendingBreakthroughV28683();return false;}
      if(!player.breakthrough) player.breakthrough={isAnimating:false,attemptCount:0,lastAttemptTime:0,cooldownDays:0,pendingBreakthrough:false};
      const bt=player.breakthrough;
      if(bt.isAnimating)return false;
      if(bt.cooldownDays>0){
        bt.pendingBreakthrough = player.exp >= getCurrentExpNeed();
        showBreakthroughNotice(`⏳ 突破冷却中，还需 ${Math.ceil(bt.cooldownDays)} 天`);
        return false;
      }
      const need=getCurrentExpNeed();
      if(player.exp<need){showBreakthroughNotice('📖 修为尚未圆满，继续修炼吧','#aaa');return false;}
      if(player.level===CULTIVATION_REALMS.length-1 && (player.phase||0)>=3){showBreakthroughNotice('🌌 道途圆满，已至仙途尽头','#ffd700');return false;}
      // 既有主线规则：渡劫圆满不能靠普通突破直接进入地仙，必须先击败飞升天劫。
      if(isFinalTribulationGate()){
        bt.pendingBreakthrough=true;
        showBreakthroughNotice('⚡ 渡劫圆满已至极限！需挑战飞升天劫方可登临地仙','#9fd1ff');
        return false;
      }
      return true;
    }

    function triggerBreakthrough(skipAnimation=false) {
      if(!canAttemptBreakthrough())return;
      const bt=player.breakthrough;
      const snapshot=createBreakthroughSnapshot();
      const result={...calculateBreakthroughSuccess(),snapshot,fromName:snapshot.name,toName:getNextCultivationName(),expNeed:getCurrentExpNeed(),forced:false,noAdvance:false};
      if(result.pillName)player.inventory.splice(player.inventory.indexOf(result.pillName),1);
      bt.pillV28683=null;
      bt.isAnimating=true;
      bt.pendingBreakthrough=false;
      bt.attemptCount=(bt.attemptCount||0)+1;
      bt.lastAttemptTime=Date.now();
      const isSuccess=result.guaranteed||Math.random()<result.rate;
      bt.pendingV28683={key:`${player.level}:${player.phase||0}`,success:isSuccess,result};
      autoSave();
      playBreakthroughAnimation(isSuccess,result,skipAnimation);
    }

    function playForcedAscensionBreakthrough(snapshot=null) {
      if(!player.breakthrough) player.breakthrough={isAnimating:false,attemptCount:0,lastAttemptTime:0,cooldownDays:0,pendingBreakthrough:false};
      player.breakthrough.isAnimating=true;
      player.breakthrough.pendingBreakthrough=false;
      const before=snapshot||{name:'渡劫圆满',level:9,phase:3,atk:0,def:0,hp:0,mp:0,lifespan:0,skills:[],unlockedRegions:[]};
      const result={rate:1,heartDemonRisk:0,snapshot:before,fromName:before.name||'渡劫圆满',toName:getCultivationName(),forced:true,noAdvance:true,ascension:true,expNeed:0};
      playBreakthroughAnimation(true,result);
    }

    function getBreakthroughStageLabel(result,stage,success=true){
      if(result?.ascension){
        if(stage===1)return '天劫余威 · 仙门洞开';
        if(stage===2)return '凡躯洗炼 · 仙骨重塑';
        return '地仙道果 · 飞升仙界';
      }
      const lv=result?.snapshot?.level||0;
      if(stage===1)return '灵气汇聚 · 经脉流转';
      if(stage===2){
        if(!success)return '灵机逆乱 · 经脉震荡';
        if(lv>=4)return `${CULTIVATION_REALMS[lv]?.name||'元婴'}破而后立 · 道体重铸`;
        if(lv>=3)return '丹田蜕变 · 道基凝实';
        return '骨骼重塑 · 经脉冲关';
      }
      return success?'天地共鸣 · 境界升华':'灵气溃散 · 反噬归身';
    }

    function playBreakthroughTone(key){
      const seq={
        start:[[130,1.6,'sine',.12]],
        flow:[[220,.22,'sine',.07],[280,.22,'sine',.07],[340,.22,'sine',.07],[420,.25,'sine',.07]],
        shatter:[[820,.10,'square',.18],[1180,.08,'square',.14],[320,.30,'sawtooth',.12]],
        thunder:[[62,.65,'sawtooth',.22],[82,.45,'sawtooth',.18]],
        complete:[[523,.32,'sine',.13],[659,.32,'sine',.13],[784,.36,'sine',.13],[1047,.42,'sine',.12]],
        fail:[[392,.35,'sine',.16],[330,.38,'sine',.15],[294,.40,'sine',.14],[220,.52,'sine',.12]]
      }[key]||[];
      seq.forEach((v,i)=>setTimeout(()=>playTone?.(...v),i*(key==='complete'?115:90)));
    }

    let breakthroughRunV2781=null;
    function settleBreakthroughV2781(success,result){
      const run=breakthroughRunV2781;
      if(!run||run.done||run.result!==result)return;
      run.done=true;clearTimeout(run.timer);breakthroughRunV2781=null;
      clearTimeout(breakthroughFinishTimer);breakthroughFinishTimer=null;
      if(breakthroughAnimFrame)cancelAnimationFrame(breakthroughAnimFrame);breakthroughAnimFrame=null;
      run.cleanup?.();
      document.getElementById('breakthroughOverlay')?.remove();
      document.body.classList.remove('breakthrough-playing');
      if(player!==run.owner)return;
      player.breakthrough.isAnimating=false;
      player.breakthrough.pendingV28683=null;
      if(success)applyBreakthroughSuccess(result);else applyBreakthroughFailure(result);
    }
    function playBreakthroughAnimation(isSuccess,result={},skipAnimation=false){
      if(breakthroughRunV2781){clearTimeout(breakthroughRunV2781.timer);breakthroughRunV2781.cleanup?.();}
      const run={owner:player,result,success:isSuccess,done:false,timer:0,cleanup:null};
      breakthroughRunV2781=run;
      run.timer=setTimeout(()=>settleBreakthroughV2781(isSuccess,result),8000);
      if(skipAnimation){settleBreakthroughV2781(isSuccess,result);return;}
      try{renderBreakthroughAnimationV2781(isSuccess,result)}
      catch(error){console.warn('突破动画启动失败，转为结果结算',error);settleBreakthroughV2781(isSuccess,result);}
    }
    function recoverBreakthroughV2781(){
      if(gameState==='combat'||gameState==='combat-ending'||COMBAT_FINISH_V2764.settling)return;
      toggleCharacterPanel(false);
      const run=breakthroughRunV2781;
      if(run&&run.owner===player&&!run.done){settleBreakthroughV2781(run.success,run.result);return;}
      if(player.breakthrough)player.breakthrough.isAnimating=false;
      document.getElementById('breakthroughOverlay')?.remove();document.body.classList.remove('breakthrough-playing');
      triggerBreakthrough(true);
    }
    function startBreakthroughVisualV2783(){
      if(gameState==='combat'||gameState==='combat-ending'||COMBAT_FINISH_V2764.settling||breakthroughRunV2781)return;
      if(player.breakthrough)player.breakthrough.isAnimating=false;
      triggerBreakthrough(false);
    }
    function syncBreakthroughRecoveryV2781(){
      const rate=document.getElementById('panelBreakthroughRate');if(!rate)return;
      document.getElementById('breakthroughPlayV2783')?.remove();
      let box=document.getElementById('breakthroughActionsV2798');
      if(!box){box=document.createElement('div');box.id='breakthroughActionsV2798';rate.parentElement.parentElement.appendChild(box);}
      let button=document.getElementById('breakthroughRecoveryV2781');
      if(!button){button=document.createElement('button');button.id='breakthroughRecoveryV2781';button.type='button';button.className='choice-btn';}
      if(button.parentElement!==box)box.appendChild(button);
      const full=player.exp>=getCurrentExpNeed(),anim=!!player.breakthrough?.isAnimating;
      const max=player.level===CULTIVATION_REALMS.length-1&&(player.phase||0)>=3;
      button.textContent=anim?'跳过动画 · 完成本次突破':max?'已达道途圆满':!full?'修为不足 · 先修炼':player.breakthrough?.cooldownDays>0?'经脉调息 · 查看剩余时间':isFinalTribulationGate()?'查看飞升天劫要求':'闭关突破';
      button.hidden=false;button.disabled=!anim&&(!full||max);
      button.onclick=anim?recoverBreakthroughV2781:()=>showRetreatBreakthroughV2798();
    }
    function showRetreatBreakthroughV2798(){
      if(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating)return;
      const need=getCurrentExpNeed();
      if(player.exp<need){showBreakthroughNotice(`修为不足，还需 ${Math.ceil(need-player.exp)} 修为`);return;}
      if(player.level===CULTIVATION_REALMS.length-1&&(player.phase||0)>=3){showBreakthroughNotice('已达道途圆满');return;}
      toggleCharacterPanel(false);
      const days=Math.ceil(player.breakthrough?.cooldownDays||0);
      let text=`<h3>🧘 闭关突破</h3><p>${getCultivationName()} → ${getNextCultivationName()}</p><p>本次修为：${need} / ${need}（已满足）<br>持有修为：${Math.floor(player.exp)}<br>突破成功消耗：${need}<br>成功后剩余：${Math.max(0,Math.floor(player.exp-need))}</p><p>成功只扣本次所需修为，剩余保留；失败仍按原规则损失部分修为并进入调息。每次只尝试一个阶段。</p>`;
      const choices=[];
      if(isFinalTribulationGate())text+='<p>⚡ 渡劫圆满必须挑战飞升天劫，不能通过普通闭关飞升。</p>';
      else if(days>0){
        text+=`<p>经脉调息还需 ${days} 个游戏日。可一次调息至冷却结束，仙历与年龄按实际天数推进，不需要等待现实时间；调息后仍需手动确认突破。</p>`;
        choices.push({text:`调息 ${days} 天`,action:'breakthrough_rest_v2798',days});
      }else{
        text+=breakthroughDetailsV28683();
        text+=`<p>选用丹药（只为下一次尝试）：<button class="choice-btn" onclick="selectBreakthroughPillV28683('')">不使用</button>${Object.entries(BREAKTHROUGH_PILLS_V28683).map(([n,d])=>`<button class="choice-btn" onclick="selectBreakthroughPillV28683('${n}')" ${player.level<d.level||!player.inventory.includes(n)?'disabled':''}>${n} · 库存${player.inventory.filter(x=>x===n).length}</button>`).join('')}</p><p>丹药可在仙市稀有丹药铺购买；本次尝试不额外扣除整年闭关时间。</p>`;
        choices.push({text:'开始突破 · 播放动画',action:'retreat_animated_v2783'},{text:'开始突破 · 跳过动画',action:'retreat_breakthrough_v2782'});
      }
      choices.push({text:'暂不突破，返回洞府',action:'home'});showStory(text,choices);
    }
    function restBreakthroughV2798(expectedDays){
      if(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating)return;
      const days=Math.ceil(player.breakthrough?.cooldownDays||0);
      if(player.exp<getCurrentExpNeed()||days<=0||days!==Number(expectedDays))return showRetreatBreakthroughV2798();
      advanceGameTime(days,'突破前经脉调息');autoSave();updateStats();showRetreatBreakthroughV2798();
    }
    function makeBreakthroughSceneV2784(overlay,success,reduced){
      const box=document.createElement('div');box.className='breakthrough-scene-v2784';box.setAttribute('aria-hidden','true');overlay.appendChild(box);
      const images=[],ready=[],count=reduced?1:success?3:2;
      let disposed=false,last=0;
      const ease=(t)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
      function update(t){
        if(disposed)return;last=t;
        if(!ready[0])return;
        overlay.classList.add('breakthrough-realistic-v2784');
        images[0].style.opacity='1';
        if(images[1])images[1].style.opacity=ready[1]?String(ease((t-.24)/.13)):'0';
        if(images[2])images[2].style.opacity=ready[2]?String(ease((t-.53)/.15)):'0';
        box.style.transform=reduced?'none':`scale(${1+Math.min(1,t)*.04}) translateY(${-Math.min(1,t)*.7}%)`;
        box.classList.toggle('failed',!success&&t>.68);
      }
      for(let i=0;i<count;i++){
        const img=document.createElement('img');img.alt='';img.decoding='async';img.style.opacity='0';
        img.onload=()=>{if(!disposed){ready[i]=true;update(last)}};
        img.onerror=()=>{if(!disposed)ready[i]=false};
        images.push(img);box.appendChild(img);img.src=`./breakthrough-v2784-${i}.webp?v=2784`;
      }
      return {update,dispose(){disposed=true;for(const img of images){img.onload=null;img.onerror=null;img.removeAttribute('src')}box.remove();}};
    }

    function renderBreakthroughAnimationV2781(isSuccess,result={}) {
      document.getElementById('breakthroughOverlay')?.remove();
      document.getElementById('breakthroughSuccess')?.remove();
      document.getElementById('breakthroughFail')?.remove();
      document.body.classList.add('breakthrough-playing');
      document.getElementById('mobileQuickMenu')?.classList.remove('show');
      toggleCharacterPanel?.(false);

      const overlay=document.createElement('div');
      overlay.className='breakthrough-overlay active';
      overlay.id='breakthroughOverlay';
      overlay.innerHTML=`<div class="breakthrough-heading-v2783"><small>闭目凝神 · 叩问仙途</small><strong id="breakthroughRealmV2783"></strong></div><div class="breakthrough-meter-v2783"><div class="breakthrough-steps-v2783"><span>聚气</span><span>冲关</span><span>蜕变</span></div><div class="breakthrough-track-v2783"><i id="breakthroughProgressV2783"></i></div></div><div class="breakthrough-vignette"></div><img class="breakthrough-portrait" id="breakthroughPortrait" alt="男主突破立绘"><canvas class="breakthrough-canvas" id="breakthroughCanvas"></canvas><div class="breakthrough-stage" id="breakthroughStage"></div><button type="button" class="breakthrough-skip-v2764" aria-label="跳过突破动画">跳过动画 ›</button>`;
      document.body.appendChild(overlay);
      const portrait=overlay.querySelector('#breakthroughPortrait');
      portrait.src=PROTAGONIST_PORTRAIT_SRC;
      overlay.querySelector('#breakthroughRealmV2783').textContent=`${result.fromName||getCultivationName()} → ${result.toName||getNextCultivationName()}`;
      const progress=overlay.querySelector('#breakthroughProgressV2783');
      const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const duration=reduced?1600:(isSuccess?6600:4800);
      const realistic=makeBreakthroughSceneV2784(overlay,isSuccess,reduced);
      if(breakthroughRunV2781)breakthroughRunV2781.cleanup=()=>realistic.dispose();
      const canvas=overlay.querySelector('#breakthroughCanvas'),ctx=canvas.getContext('2d',{alpha:true});
      if(!ctx)throw new Error('突破动画画布不可用');
      const stageEl=overlay.querySelector('#breakthroughStage');
      let w=0,h=0;
      const resize=()=>{w=Math.max(320,window.innerWidth||390);h=Math.max(320,window.innerHeight||700);const scale=Math.min(1,900/Math.max(w,h));canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);ctx.setTransform(scale,0,0,scale,0,0);};
      const onHidden=()=>{if(document.hidden)settleBreakthroughV2781(isSuccess,result)};
      document.addEventListener('visibilitychange',onHidden);
      if(breakthroughRunV2781)breakthroughRunV2781.cleanup=()=>{realistic.dispose();window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onHidden);canvas.width=1;canvas.height=1;};
      resize(); window.addEventListener('resize',resize,{passive:true});
      const mobile=!!(PERF_CONFIG?.mobile || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||''));
      const maxParticles=reduced?0:(mobile?40:90);
      const state={start:performance.now(),particles:[],burst:false,failSound:false,completeSound:false,lastSpawn:0,lastFrame:0,lastStage:0};

      function spawn(count,cx,cy,palette,speed=240,inward=false){
        count=Math.min(count,maxParticles-state.particles.length);
        for(let i=0;i<count;i++){
          const a=Math.random()*Math.PI*2,d=55+Math.random()*Math.min(w,h)*.30;
          const sx=inward?cx+Math.cos(a)*d:cx+(Math.random()-.5)*25;
          const sy=inward?cy+Math.sin(a)*d:cy+(Math.random()-.5)*25;
          const dir=inward?a+Math.PI:a;
          state.particles.push({x:sx,y:sy,vx:Math.cos(dir)*(40+Math.random()*speed),vy:Math.sin(dir)*(40+Math.random()*speed),life:1,decay:.009+Math.random()*.012,size:2+Math.random()*5,color:palette[Math.floor(Math.random()*palette.length)]});
        }
      }
      function particles(dt){
        for(let i=state.particles.length-1;i>=0;i--){
          const p=state.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.982,dt*60);p.vy*=Math.pow(.982,dt*60);p.life-=p.decay*dt*60;
          if(p.life<=0){state.particles.splice(i,1);continue;}
          ctx.globalAlpha=Math.max(0,p.life*.82);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=mobile?0:6;
          ctx.beginPath();ctx.arc(p.x,p.y,p.size*Math.max(.3,p.life),0,Math.PI*2);ctx.fill();
        }
        ctx.globalAlpha=1;ctx.shadowBlur=0;
      }
      function ring(cx,cy,r,a,color='#ffd76a',line=2){ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=line;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
      function aura(cx,cy,r,a,color='255,215,112'){
        const g=ctx.createRadialGradient(cx,cy,8,cx,cy,r);g.addColorStop(0,`rgba(${color},${a})`);g.addColorStop(.45,`rgba(${color},${a*.38})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      }
      function meridians(cx,cy,t,intensity){
        ctx.save();ctx.globalAlpha=.15+intensity*.18;ctx.strokeStyle=isSuccess?'#9fdcff':'#ff8d8d';ctx.lineWidth=1.4;
        for(let i=0;i<7;i++){const off=(i-3)*14;ctx.beginPath();ctx.moveTo(cx+off,cy-150);ctx.bezierCurveTo(cx-off*.5,cy-70,cx+off*.7,cy+45,cx-off*.3,cy+145);ctx.stroke();}
        ctx.restore();
      }
      function drawFrame(ts){
        try{drawSceneV2783(ts)}catch(error){console.warn('突破绘制异常，完成原结果结算',error);settleBreakthroughV2781(isSuccess,result)}
      }
      function drawSceneV2783(ts){
        if(breakthroughRunV2781?.result!==result)return;
        breakthroughAnimFrame=requestAnimationFrame(drawFrame);
        const frameMs=mobile?1000/30:1000/60;
        if(ts-state.lastFrame<frameMs)return;
        const dt=Math.min(.06,Math.max(.001,(ts-(state.lastFrame||ts-16))/1000));state.lastFrame=ts;
        const elapsed=ts-state.start,e=elapsed/duration*(isSuccess?5.6:4.1),cx=w/2,cy=h*.51;
        progress.style.transform=`scaleX(${Math.min(1,Math.max(0,elapsed/duration))})`;
        realistic.update(Math.min(1,Math.max(0,elapsed/duration)));
        ctx.clearRect(0,0,w,h);
        let stage=1,p=0;
        if(isSuccess){
          if(e<1.5){stage=1;p=e/1.5;}
          else if(e<3.0){stage=2;p=(e-1.5)/1.5;}
          else {stage=3;p=Math.min(1,(e-3)/2.4);}
        }else{
          if(e<1.4){stage=1;p=e/1.4;}
          else if(e<2.7){stage=2;p=(e-1.4)/1.3;}
          else {stage=3;p=Math.min(1,(e-2.7)/1.25);}
        }
        if(stage!==state.lastStage){state.lastStage=stage;overlay.dataset.stage=String(stage);overlay.dataset.outcome=isSuccess?'success':'failure';stageEl.textContent=getBreakthroughStageLabel(result,stage,isSuccess);}
        if(reduced){ctx.clearRect(0,0,w,h);return;}

        if(stage===1){
          aura(cx,cy,130+p*120,.13+p*.08,'150,210,255');
          for(let i=0;i<10;i++){const a=ts*.0012+i*Math.PI/5,r=80+p*105+Math.sin(ts*.003+i)*13;ctx.fillStyle=`rgba(205,235,255,${.25+p*.22})`;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.55,2.2+(i%3),0,Math.PI*2);ctx.fill();}
          if(ts-state.lastSpawn>100){spawn(mobile?2:4,cx,cy,['#d9f1ff','#83cfff','#ffffff'],130,true);state.lastSpawn=ts;}
        } else if(stage===2){
          const good=isSuccess;
          aura(cx,cy,210+p*130,.16+p*.10,good?'255,205,70':'255,80,80');
          meridians(cx,cy,ts,p);
          for(let i=0;i<4;i++){const rp=Math.max(0,p-i*.17);if(rp>0)ring(cx,cy,55+rp*270,(1-rp)*.44,good?'#ffd76a':'#ff6868',2.5);}
          if(!state.burst&&p>.30){state.burst=true;spawn(mobile?48:76,cx,cy,good?['#ffd700','#fff1a8','#ffffff','#7ec9ff']:['#ff6767','#ffb067','#8b4d7a'],420,false);playBreakthroughTone('shatter');navigator.vibrate?.(good?[25,45,35]:[55,60,80]);}
        } else {
          if(isSuccess){
            aura(cx,cy,280+p*180,.18*(1-p*.35),'255,225,125');
            aura(cx,cy,200+p*110,.10,'180,145,255');
            meridians(cx,cy,ts,1);
            for(let i=0;i<6;i++){const a=ts*.00045+i*Math.PI/3,x=cx+Math.cos(a)*(110+p*80);const g=ctx.createLinearGradient(x,20,x,cy);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,225,130,.09)');g.addColorStop(1,'rgba(255,225,130,0)');ctx.fillStyle=g;ctx.fillRect(x-2,20,4,cy);}
            if(!state.completeSound&&p>.25){state.completeSound=true;playBreakthroughTone('complete');}
            if(ts-state.lastSpawn>145){spawn(mobile?2:4,cx+(Math.random()-.5)*130,cy+(Math.random()-.5)*140,['#ffd76a','#d9b5ec','#7ec9ff','#ffffff'],120,false);state.lastSpawn=ts;}
          }else{
            aura(cx,cy,200*(1-p*.45),.14*(1-p),'255,60,70');
            const shake=(1-p)*Math.sin(ts*.07)*6;ctx.save();ctx.translate(shake,0);meridians(cx,cy,ts,1-p*.3);ctx.restore();
            for(let i=0;i<7;i++){ctx.strokeStyle=`rgba(255,80,80,${.28*(1-p)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,cy);const a=i*Math.PI*2/7+ts*.0002;ctx.lineTo(cx+Math.cos(a)*(60+p*130),cy+Math.sin(a)*(60+p*130));ctx.stroke();}
            if(!state.failSound){state.failSound=true;playBreakthroughTone('fail');navigator.vibrate?.([90,70,120]);}
          }
        }
        particles(dt);
        const zoom=isSuccess?(stage===1?.84+p*.05:stage===2?.90+p*.08:.98+p*.05):(stage===3?.96-p*.06:.86+p*.08);
        const y=isSuccess?(stage===3?-50*p:0):(stage===3?12*p:0);
        portrait.style.transform=`translate(-50%, calc(-50% + ${y}px)) scale(${zoom})`;

      }

      let breakthroughSettledV2764=false;
      const finishBreakthroughV2764=()=>{
        if(breakthroughSettledV2764)return;
        breakthroughSettledV2764=true;
        clearTimeout(breakthroughFinishTimer);breakthroughFinishTimer=null;
        if(breakthroughAnimFrame)cancelAnimationFrame(breakthroughAnimFrame);
        breakthroughAnimFrame=null;window.removeEventListener('resize',resize);
        overlay.classList.add('finishing');
        setTimeout(()=>overlay.remove(),260);
        document.body.classList.remove('breakthrough-playing');
        settleBreakthroughV2781(isSuccess,result);
      };
      overlay.querySelector('.breakthrough-skip-v2764')?.addEventListener('click',finishBreakthroughV2764,{once:true});
      playBreakthroughTone('start');setTimeout(()=>{if(!breakthroughSettledV2764)playBreakthroughTone('flow')},330);
      breakthroughAnimFrame=requestAnimationFrame(drawFrame);
      clearTimeout(breakthroughFinishTimer);
      breakthroughFinishTimer=setTimeout(finishBreakthroughV2764,duration);
    }

    function applyBreakthroughSuccess(result={}) {
      const bt=player.breakthrough||{};
      bt.isAnimating=false;bt.cooldownDays=0;bt.pendingBreakthrough=false;player.breakthrough=bt;
      bt.protectionV28683=null;
      const before=result.snapshot||createBreakthroughSnapshot();
      let majorBreakthrough=false;
      if(!result.noAdvance){
        const need=Math.max(0,Number(result.expNeed)||getCurrentExpNeed());
        player.exp=Math.max(0,player.exp-need);
        const oldLevel=player.level;
        if((player.phase||0)<3){player.phase=(player.phase||0)+1;}
        else if(player.level<CULTIVATION_REALMS.length-1){player.level++;player.phase=0;}
        majorBreakthrough=player.level!==oldLevel;
      }else majorBreakthrough=(before.level||0)!==(player.level||0);
      syncUnlockedSkills();
      player.maxLifespan=getTotalMaxLifespan();
      player.hp=getMaxHp();player.mp=getMaxMp();
      updateAchievementProgress('realm');
      playSound?.('levelup');
      const after=createBreakthroughSnapshot();
      result.fromName=result.fromName||before.name;result.toName=getCultivationName();result.after=after;result.majorBreakthrough=majorBreakthrough;
      onRealmBreakthrough?.(player.level,player.phase||0);
      showBreakthroughSuccess(result);
      updateStats();updateWorldHUD?.();autoSave();
    }

    function showBreakthroughSuccess(result={}) {
      const before=result.snapshot||{},after=result.after||createBreakthroughSnapshot();
      const d=(a,b)=>Math.max(0,Math.round((Number(a)||0)-(Number(b)||0)));
      const newSkills=(after.skills||[]).filter(n=>!(before.skills||[]).includes(n));
      const newRegions=(after.unlockedRegions||[]).filter(id=>!(before.unlockedRegions||[]).includes(id));
      const regionText=newRegions.map(id=>getRegionInfo?.(id)?.shortName||id).join('、');
      const html=`<div class="breakthrough-success show" id="breakthroughSuccess">
        <div class="title">✦ ${result.ascension?'飞升成功':'突破成功'}！ ✦</div>
        <div class="subtitle">${result.fromName||before.name||''} → <span>${result.toName||after.name||getCultivationName()}</span></div>
        <hr class="divider"><div class="reward-list">
          <div class="item"><span class="icon">⏳</span><span class="label">寿元上限</span><span class="value">${after.lifespan||getTotalMaxLifespan()}${d(after.lifespan,before.lifespan)?`（+${d(after.lifespan,before.lifespan)}）`:''}</span></div>
          <div class="item"><span class="icon">⚔️</span><span class="label">攻击</span><span class="value">${after.atk}${d(after.atk,before.atk)?`（+${d(after.atk,before.atk)}）`:''}</span></div>
          <div class="item"><span class="icon">🛡️</span><span class="label">防御</span><span class="value">${after.def}${d(after.def,before.def)?`（+${d(after.def,before.def)}）`:''}</span></div>
          <div class="item"><span class="icon">❤️</span><span class="label">气血上限</span><span class="value">${after.hp}${d(after.hp,before.hp)?`（+${d(after.hp,before.hp)}）`:''}</span></div>
          ${newSkills.length?`<div class="item"><span class="icon">📖</span><span class="label">新功法</span><span class="value">${newSkills.join('、')}</span></div>`:''}
          ${regionText?`<div class="item"><span class="icon">🗺️</span><span class="label">新地域</span><span class="value">${regionText}已解锁</span></div>`:''}
        </div><hr class="divider"><button class="btn-continue" onclick="closeBreakthroughSuccess(false)">继续修仙</button><div class="auto-close-v2764">轻触按钮继续 · 5秒后自动收起</div></div>`;
      document.getElementById('breakthroughSuccess')?.remove();
      const wrap=document.createElement('div'),panelId=Symbol('breakthroughSuccess');
      wrap.innerHTML=html;const panel=wrap.firstElementChild;panel._v2764PanelId=panelId;document.body.appendChild(panel);
      setTimeout(()=>{if(panel.isConnected&&panel._v2764PanelId===panelId)closeBreakthroughSuccess(true)},5200);
    }

    function closeBreakthroughSuccess(autoClose=false) {
      const el=document.getElementById('breakthroughSuccess');if(el){el.classList.remove('show');setTimeout(()=>el.remove(),420);}
      updateStats();updateWorldHUD?.();
      // 手动继续时允许逐次突破；自动收起只登记待突破，避免无人操作时连续弹出。
      if(player.exp>=getCurrentExpNeed() && !isFinalTribulationGate() && !(player.level===CULTIVATION_REALMS.length-1&&(player.phase||0)>=3)){
        player.breakthrough.pendingBreakthrough=true;
        if(!autoClose)setTimeout(()=>checkLevelUp(),650);
      }
    }

    function applyBreakthroughFailure(result={}) {
      const protection=breakthroughProtectionV28683();
      const bt=player.breakthrough||{};bt.isAnimating=false;bt.cooldownDays=30+Math.floor(Math.random()*20);
      bt.protectionV28683={key:protection.key,failures:Math.min(5,protection.failures+1)};player.breakthrough=bt;
      const loss=Math.floor(getCurrentExpNeed()*.15);player.exp=Math.max(0,player.exp-loss);
      bt.pendingBreakthrough=player.exp>=getCurrentExpNeed();
      player.hp=Math.max(1,Math.floor(getMaxHp()*.60));player.mp=Math.max(1,Math.floor(getMaxMp()*.50));
      playSound?.('defeat');showBreakthroughFailure(result,loss);updateStats();updateWorldHUD?.();autoSave();
    }

    function showBreakthroughFailure(result,loss) {
      const html=`<div class="breakthrough-fail show" id="breakthroughFail"><div class="title">💔 突破失败</div><div class="subtitle">灵力反噬，经脉受损</div><hr class="divider">
        <div class="fail-list"><div>📉 修为损失：<b>-${loss}</b></div><div>❤️ 当前气血：<b>${player.hp}/${getMaxHp()}</b></div><div>⏳ 调息时间：<b>${Math.ceil(player.breakthrough.cooldownDays)} 天</b></div><div class="hint">沉淀心境，稳固修为后再尝试。调息会随仙历流逝逐日消退。</div></div>
        <button class="btn-retry" onclick="closeBreakthroughFail()">我明白了</button><div class="auto-close-v2764">轻触按钮关闭 · 5秒后自动收起</div></div>`;
      document.getElementById('breakthroughFail')?.remove();const wrap=document.createElement('div');wrap.innerHTML=html;const panel=wrap.firstElementChild;document.body.appendChild(panel);setTimeout(()=>{if(panel.isConnected)closeBreakthroughFail()},5200);
    }

    function closeBreakthroughFail(){const el=document.getElementById('breakthroughFail');if(el){el.classList.remove('show');setTimeout(()=>el.remove(),360);}updateStats();updateWorldHUD?.();}

    function checkLevelUp(options = {}) {
      // 战斗尚未真正退场时只登记“待突破”，绝不在战斗面板上叠加突破动画。
      if ((typeof COMBAT_FINISH_V2764 !== 'undefined' && COMBAT_FINISH_V2764.settling) || gameState === 'combat' || gameState === 'combat-ending') {
        if (!player.breakthrough) player.breakthrough={isAnimating:false,attemptCount:0,lastAttemptTime:0,cooldownDays:0,pendingBreakthrough:false};
        if (player.exp >= getCurrentExpNeed()) player.breakthrough.pendingBreakthrough = true;
        return;
      }
      const silentCooldown = !!options?.silentCooldown;
      const need=getCurrentExpNeed();
      if(player.exp<need)return;
      const atAbsoluteMax=player.level===CULTIVATION_REALMS.length-1&&(player.phase||0)>=3;
      if(atAbsoluteMax)return;
      if(!player.breakthrough)player.breakthrough={isAnimating:false,attemptCount:0,lastAttemptTime:0,cooldownDays:0,pendingBreakthrough:false};
      player.breakthrough.pendingBreakthrough=true;
      if(isFinalTribulationGate()){
        showBreakthroughNotice('⚡ 修为已至渡劫圆满极限：请挑战【飞升天劫】','#9fd1ff');
        updateStats();updateWorldHUD?.();return;
      }
      if(player.breakthrough.isAnimating)return;
      if(player.breakthrough.cooldownDays>0){
        if(!silentCooldown) showBreakthroughNotice(`⏳ 突破冷却中，还需 ${Math.ceil(player.breakthrough.cooldownDays)} 天`);
        updateStats();
        return;
      }
      updateStats();
    }
    
    // ================== 完整装备管理系统 ==================
    function getEquipmentBagItems(){migrateLooseEquipmentToEquipmentInventory(player);return player.equipmentInventory||[];}

    function resolveEquipTargetSlot(data){
      if(data.slot==='ring'){
        if(!player.equipment.ring1)return 'ring1'; if(!player.equipment.ring2)return 'ring2'; return null;
      }
      if(data.slot==='artifact'){
        if(!player.equipment.artifact1)return 'artifact1'; if(!player.equipment.artifact2)return 'artifact2'; if(!player.equipment.artifact3)return 'artifact3'; return null;
      }
      if(data.slot==='life_artifact')return 'lifeArtifact';
      return data.slot;
    }

    // ===== V27.6 装备智能优化：评分 / 对比 / 一键换装 =====
    const EQUIP_SCORE_WEIGHTS={damage:400,atk:2,def:1.5,hp:.15,mp:.1,crit:4,critDmg:2,dodge:3,block:3,resistance:2,resist:2,dmgReduce:4,speed:.15,spirit:.5,hit:2,hpRegen:.5,fireDmg:2};
    const EQUIP_COMPARE_LABELS={atk:'攻击',def:'防御',hp:'气血',mp:'灵力',crit:'暴击',critDmg:'爆伤',dodge:'闪避',block:'格挡',resistance:'抗性',dmgReduce:'减伤',speed:'速度',spirit:'神魂',hit:'命中',hpRegen:'回血',fireDmg:'火伤'};
    const EQUIP_PERCENT_STATS=new Set(['crit','critDmg','dodge','block','resistance','dmgReduce','hit','fireDmg']);

    function scoreEquipStats(stats={},multiplier=1){
      let score=0;
      for(const [k,v] of Object.entries(stats||{}))score+=Number(v||0)*multiplier*(EQUIP_SCORE_WEIGHTS[k]||0);
      return score;
    }

    function getEquipItemScore(itemName){
      const d=getEquipData(itemName);if(!d)return -Infinity;
      const q=getQualityInfo(d.quality),qualityTie=Math.max(0,QUALITY_KEYS.indexOf(d.quality))*.01;
      return scoreEquipStats(d.stats,q.multiplier)+Object.values(d.modsV2790||{}).reduce((n,v)=>n+v*100,0)+qualityTie;
    }

    function getScaledEquipStats(itemName,stats=null){
      const d=getEquipData(itemName);if(!d)return {};
      const m=getQualityInfo(d.quality).multiplier,out={};
      for(const [k,v] of Object.entries(stats||d.stats||{}))out[k]=Number(v||0)*m;
      return out;
    }

    function formatEquipItemStatsV286813(itemName,stats=null){
      const pct=!stats?getEquipData(itemName)?.forgePercentStatsV286825:null;return formatEquipStats(getScaledEquipStats(itemName,stats))+(pct&&Object.keys(pct).length?' · '+Object.entries(pct).map(([k,v])=>`洗练${FORGE_STATS_V2825[k].label}+${v}%`).join(' · '):'');
    }

    function getAllowedSlotsForEquip(data){
      if(!data)return [];
      if(data.slot==='ring')return ['ring1','ring2'];
      if(data.slot==='artifact')return ['artifact1','artifact2','artifact3'];
      if(data.slot==='life_artifact')return ['lifeArtifact'];
      return EQUIPMENT_SLOTS[data.slot]?[data.slot]:[];
    }

    function isEquipSlotUnlocked(slot){return !(slot==='lifeArtifact'&&(player.level||0)<3);}

    function getEquipmentOwnedList(){
      migrateLooseEquipmentToEquipmentInventory(player);
      return [...(player.equipmentInventory||[]),...Object.values(player.equipment||{}).filter(Boolean)];
    }

    function getEquipmentOwnedCounts(){
      const counts={};for(const name of getEquipmentOwnedList())counts[name]=(counts[name]||0)+1;return counts;
    }

    function getSetBonusScoreByName(setName){
      const b=EQUIPMENT_SET_BONUSES[setName]?.bonus||{};
      return scoreEquipStats(b,1);
    }

    function getLoadoutActiveSets(loadout){
      const equipped=Object.values(loadout||{}).filter(Boolean),active=[];
      for(const p of getSetProgressV2789(loadout))if(p.count>=p.set.tiers[0].count)active.push(p.name);
      return active;
    }

    function calculateEquipmentLoadoutScore(loadout){
      let score=0;for(const name of Object.values(loadout||{}).filter(Boolean))score+=getEquipItemScore(name);
      for(const p of getSetProgressV2789(loadout))score+=scoreEquipStats(p.bonus,1);
      return score;
    }

    function cloneCurrentEquipment(){const out=createEmptyEquipmentSlots();for(const slot of Object.keys(out))out[slot]=player.equipment?.[slot]||null;return out;}

    function buildEquipLoadoutForForcedSets(forcedSets=[]){
      const counts=getEquipmentOwnedCounts(),loadout=createEmptyEquipmentSlots();
      const take=(name,slot)=>{if(!counts[name]||!isEquipSlotUnlocked(slot)||loadout[slot])return false;const d=getEquipData(name);if(!d||!canEquipItem(name).ok||!getAllowedSlotsForEquip(d).includes(slot))return false;loadout[slot]=name;counts[name]--;return true;};

      // 先锁入候选套装所需部件，再用剩余装备填充最佳单件，确保套装不会被一键换装无脑拆散。
      for(const setName of forcedSets){
        const set=EQUIPMENT_SET_BONUSES[setName];if(!set)return null;
        for(const name of set.items){
          const d=getEquipData(name);if(!d||!canEquipItem(name).ok||!counts[name])return null;
          const slot=getAllowedSlotsForEquip(d).find(s=>isEquipSlotUnlocked(s)&&!loadout[s]);if(!slot||!take(name,slot))return null;
        }
      }

      const chooseBestForSlot=slot=>{
        let best=null,bestScore=-Infinity;
        for(const [name,count] of Object.entries(counts)){
          if(count<=0)continue;const d=getEquipData(name);if(!d||!canEquipItem(name).ok||!getAllowedSlotsForEquip(d).includes(slot))continue;
          const sc=getEquipItemScore(name);if(sc>bestScore){best=name;bestScore=sc;}
        }
        return best;
      };

      for(const slot of Object.keys(EQUIPMENT_SLOTS)){
        if(loadout[slot]||!isEquipSlotUnlocked(slot))continue;
        const best=chooseBestForSlot(slot);if(best)take(best,slot);
      }
      return loadout;
    }

    function getBestEquipmentLoadout(){
      migrateLooseEquipmentToEquipmentInventory(player);
      const setNames=Object.keys(EQUIPMENT_SET_BONUSES),candidates=[cloneCurrentEquipment()];
      // 当前仅 3 套；枚举套装组合可让“单件更高”和“成套更强”真正比较总收益。
      if(setNames.length<=8){
        const total=1<<setNames.length;
        for(let mask=0;mask<total;mask++){
          const forced=[];for(let i=0;i<setNames.length;i++)if(mask&(1<<i))forced.push(setNames[i]);
          const loadout=buildEquipLoadoutForForcedSets(forced);if(loadout)candidates.push(loadout);
        }
      }else{
        const greedy=buildEquipLoadoutForForcedSets([]);if(greedy)candidates.push(greedy);
        for(const setName of setNames){const one=buildEquipLoadoutForForcedSets([setName]);if(one)candidates.push(one);}
      }
      let best=candidates[0],bestScore=calculateEquipmentLoadoutScore(best);
      for(const loadout of candidates.slice(1)){const score=calculateEquipmentLoadoutScore(loadout);if(score>bestScore+.001){best=loadout;bestScore=score;}}
      return {loadout:best,score:bestScore};
    }

    function applyEquipmentLoadout(loadout,{reopen=true,toast=true}={}){
      if(!loadout)return false;
      const before=cloneCurrentEquipment(),beforeScore=calculateEquipmentLoadoutScore(before),all=getEquipmentOwnedList();
      let changed=0;for(const slot of Object.keys(EQUIPMENT_SLOTS))if((before[slot]||null)!==(loadout[slot]||null))changed++;
      if(!changed){if(toast)showFloatingText?.('✅ 当前已是最佳装备组合','#69f0ae');if(reopen)setTimeout(showEquipmentPanel,80);return false;}

      const bag=[...all],next=createEmptyEquipmentSlots();
      for(const slot of Object.keys(EQUIPMENT_SLOTS)){
        const name=loadout[slot]||null;next[slot]=name;
        if(name){const idx=bag.indexOf(name);if(idx>=0)bag.splice(idx,1);else next[slot]=null;}
      }
      player.equipment=next;player.equipmentInventory=bag;checkSetBonuses();
      player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());
      updateStats();updateWorldHUD?.();autoSave?.();
      const afterScore=calculateEquipmentLoadoutScore(player.equipment);
      if(toast)showFloatingText?.(`⚡ 一键换装：调整${changed}格 · 评分 ${Math.round(beforeScore)}→${Math.round(afterScore)}`,'#69f0ae');
      if(reopen)setTimeout(showEquipmentPanel,100);return true;
    }

    function autoEquipBest(){const best=getBestEquipmentLoadout();return applyEquipmentLoadout(best.loadout,{reopen:true,toast:true});}

    function unequipAllGear(){
      const count=Object.values(player.equipment||{}).filter(Boolean).length;if(!count){showFloatingText?.('装备栏已经是空的','#aaa');return false;}
      if(typeof confirm==='function'&&!confirm(`确定卸下全部 ${count} 件装备吗？`))return false;
      for(const slot of Object.keys(EQUIPMENT_SLOTS)){const name=player.equipment?.[slot];if(name)player.equipmentInventory.push(name);player.equipment[slot]=null;}
      checkSetBonuses();player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());updateStats();updateWorldHUD?.();autoSave?.();showFloatingText?.(`↩️ 已卸下全部 ${count} 件装备`,'#ffd700');setTimeout(showEquipmentPanel,80);return true;
    }

    function getEquipCompareTarget(itemName){
      const d=getEquipData(itemName);if(!d)return null;const slots=getAllowedSlotsForEquip(d).filter(isEquipSlotUnlocked);if(!slots.length)return null;
      const empty=slots.find(s=>!player.equipment?.[s]);if(empty)return {slot:empty,current:null,currentScore:0,itemScore:getEquipItemScore(itemName),delta:getEquipItemScore(itemName)};
      let slot=slots[0],current=player.equipment?.[slot],currentScore=getEquipItemScore(current);
      for(const s of slots.slice(1)){const n=player.equipment?.[s],sc=getEquipItemScore(n);if(sc<currentScore){slot=s;current=n;currentScore=sc;}}
      const itemScore=getEquipItemScore(itemName);return {slot,current,currentScore,itemScore,delta:itemScore-currentScore};
    }

    function getEquipStatComparisonHtml(itemName){
      const c=getEquipCompareTarget(itemName);if(!c)return '';
      const slotLabel=EQUIPMENT_SLOTS[c.slot]?.label||c.slot,next=getScaledEquipStats(itemName),cur=getScaledEquipStats(c.current),keys=[...new Set([...Object.keys(next),...Object.keys(cur)])];
      const changes=keys.map(k=>({k,v:(next[k]||0)-(cur[k]||0)})).filter(x=>Math.abs(x.v)>.001).sort((a,b)=>Math.abs(b.v*(EQUIP_SCORE_WEIGHTS[b.k]||1))-Math.abs(a.v*(EQUIP_SCORE_WEIGHTS[a.k]||1))).slice(0,4);
      const pctNext=getEquipData(itemName)?.forgePercentStatsV286825||{},pctOld=getEquipData(c.current)?.forgePercentStatsV286825||{};const pctDetail=Object.keys(FORGE_PERCENT_V286825).filter(k=>(pctNext[k]||0)!==(pctOld[k]||0)).map(k=>{const d=(pctNext[k]||0)-(pctOld[k]||0);return `洗练${FORGE_STATS_V2825[k].label} ${d>0?'+':''}${d}个百分点`;}).join(' · ');
      const detail=changes.map(({k,v})=>{const n=Math.round(v*10)/10,s=v>0?'+':'';return `<span style="color:${v>0?'#69f0ae':'#ff8f8f'}">${EQUIP_COMPARE_LABELS[k]||k} ${s}${n}${EQUIP_PERCENT_STATS.has(k)?'%':''}</span>`}).join(' · ');
      const cls=c.delta>1?'good':c.delta<-1?'bad':'';const head=c.current?`对比 ${slotLabel}【${c.current}】`:`${slotLabel}为空，可直接补位`;
      return `<div class="equip-compare ${cls}">${head}<br>${c.delta>1?'↑':c.delta<-1?'↓':'≈'} 综合评分 ${c.delta>=0?'+':''}${Math.round(c.delta)}${detail?` · ${detail}`:''}${pctDetail?`<br>${pctDetail}`:''}</div>`;
    }

    function isInventoryEquipUpgrade(itemName){const c=getEquipCompareTarget(itemName);return !!(c&&canEquipItem(itemName).ok&&c.delta>1);}

    function getBestBagUpgradeForSlot(slot){
      if(!isEquipSlotUnlocked(slot))return null;const current=player.equipment?.[slot],currentScore=current?getEquipItemScore(current):0;let best=null,bestScore=currentScore;
      for(const name of (player.equipmentInventory||[])){const d=getEquipData(name);if(!d||!canEquipItem(name).ok||!getAllowedSlotsForEquip(d).includes(slot))continue;const sc=getEquipItemScore(name);if(sc>bestScore+1){best=name;bestScore=sc;}}
      return best?{name:best,delta:bestScore-currentScore}:null;
    }

    function getEquipmentUpgradeCount(){
      const current=cloneCurrentEquipment(),currentScore=calculateEquipmentLoadoutScore(current),best=getBestEquipmentLoadout();if(!best||best.score<=currentScore+1)return 0;
      let changed=0;for(const slot of Object.keys(EQUIPMENT_SLOTS))if((current[slot]||null)!==(best.loadout?.[slot]||null))changed++;return changed;
    }

    function equipItem(itemName){
      migrateLooseEquipmentToEquipmentInventory(player);
      const data=getEquipData(itemName); if(!data){showFloatingText?.('❌ 装备不存在','#ff6b6b');return false;}
      const check=canEquipItem(itemName); if(!check.ok){showFloatingText?.(`❌ ${check.reason}`,'#ff6b6b');return false;}
      if(!player.equipmentInventory.includes(itemName)){showFloatingText?.('❌ 装备不在装备背包中','#ff6b6b');return false;}
      let targetSlot=resolveEquipTargetSlot(data);
      if(!targetSlot&&(data.slot==='ring'||data.slot==='artifact')){
        const slots=getAllowedSlotsForEquip(data),kind=data.slot==='ring'?'戒指':'法宝';
        const choices=slots.map(slot=>{const old=player.equipment?.[slot],delta=getEquipItemScore(itemName)-getEquipItemScore(old);return {text:`替换${EQUIPMENT_SLOTS[slot].label}【${old||'空'}】 ${delta>1?'↑':delta<-1?'↓':'≈'}${Math.round(delta)}`,action:'equip_to_slot',slot,itemName};});
        choices.push({text:'返回装备',action:'equip_panel'});
        showStory(`${kind}槽位已满。请选择要用【${itemName}】替换的位置：`,choices);return false;
      }
      return doEquip(itemName,targetSlot);
    }

    function doEquip(itemName,slot){
      const data=getEquipData(itemName); if(!data||!EQUIPMENT_SLOTS[slot])return false;
      const check=canEquipItem(itemName); if(!check.ok){showFloatingText?.(`❌ ${check.reason}`,'#ff6b6b');return false;}
      const idx=player.equipmentInventory.indexOf(itemName); if(idx<0)return false;
      const old=player.equipment[slot]; if(old)player.equipmentInventory.push(old);
      player.equipmentInventory.splice(idx,1); player.equipment[slot]=itemName; checkSetBonuses();
      player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());
      updateStats();updateWorldHUD?.();autoSave();
      const q=getQualityInfo(data.quality),s=EQUIPMENT_SLOTS[slot];showFloatingText?.(`✅ ${q.name}【${itemName}】→${s.label}`,'#69f0ae');return true;
    }

    function unequipItem(slot,reopen=false){
      if(!EQUIPMENT_SLOTS[slot])return false; const name=player.equipment?.[slot];
      if(!name){showFloatingText?.('该槽位没有装备','#aaa');return false;}
      player.equipmentInventory.push(name);player.equipment[slot]=null;checkSetBonuses();
      player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());
      updateStats();updateWorldHUD?.();autoSave();showFloatingText?.(`↩️ 已卸下【${name}】`,'#ffd700');
      if(reopen)setTimeout(showEquipmentPanel,80);return true;
    }

    function renderEquipSlots(slots){
      return slots.map(slot=>{
        const s=EQUIPMENT_SLOTS[slot];if(!s)return '';
        const locked=slot==='lifeArtifact'&&(player.level||0)<3, name=player.equipment?.[slot], data=name&&getEquipData(name), q=data?getQualityInfo(data.quality):null,upgrade=!locked?getBestBagUpgradeForSlot(slot):null;
        const itemText=locked?'🔒 未解锁':name||'空'; const color=locked?'#555':q?.color||(name?'#ddd':'#666');
        return `<div class="equipment-slot-row ${name?'equipped':''} ${upgrade?'has-upgrade':''}" ${name?`onclick="unequipItem('${slot}',true)" title="点击卸下"`:''}>
          <span style="font-size:18px;text-align:center">${locked?'🔒':s.icon}</span><div class="slot-main"><span class="slot-name">${s.label}</span><span class="item-name" style="color:${color}">${itemText}</span>${data?`<span style="font-size:9px;color:${q.color}">${q.icon} ${q.name} · ${formatEquipItemStatsV286813(name)}</span>`:''}${upgrade?`<span class="slot-upgrade-hint">↑ 背包有更优：${upgrade.name}</span>`:''}</div><span style="font-size:9px;color:#555">${s.type}</span></div>`;
      }).join('');
    }

    function renderEquipStatsSummary(){const s=getCharacterStats();return `<div>⚔️ 攻击 <b style="color:#ffd700">${s.atk}</b></div><div>🛡️ 防御 <b style="color:#7ec9ff">${s.def}</b></div><div>❤️ 气血 <b style="color:#ff7b7b">${s.maxHp}</b></div><div>💠 灵力 <b style="color:#b89cff">${s.maxMp}</b></div><div>💥 暴击 <b style="color:#ffad55">${Math.round(s.crit*100)}%</b></div><div>⚡ 爆伤 <b style="color:#ffad55">${Math.round(s.critDmg*100)}%</b></div><div>💨 闪避 <b style="color:#69f0ae">${Math.round(s.dodge*100)}%</b></div><div>🛡️ 格挡 <b style="color:#4fc3f7">${Math.round(s.block*100)}%</b></div><div>🔥 抗性 <b style="color:#d9b5ec">${s.resist}</b></div>`;}

    function getEquipQualitySummary(){let highest=-1;for(const slot of Object.keys(EQUIPMENT_SLOTS)){const d=getEquipData(player.equipment?.[slot]);if(!d)continue;highest=Math.max(highest,QUALITY_KEYS.indexOf(d.quality));}return highest<0?'无':EQUIPMENT_QUALITIES[QUALITY_KEYS[highest]].name;}

    function showEquipmentPanel(){
      toggleCharacterPanel?.(false);document.getElementById('equipmentPanel')?.remove();migrateLooseEquipmentToEquipmentInventory(player);checkSetBonuses();
      const panel=document.createElement('div');panel.id='equipmentPanel';panel.className='equipment-panel-overlay';
      const content=document.createElement('div');content.className='equipment-panel-content';
      content.innerHTML=`<button aria-label="关闭" onclick="document.getElementById('equipmentPanel')?.remove()" style="position:absolute;right:12px;top:10px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#ddd;font-size:16px">✕</button>
        <div style="margin-bottom:14px"><span style="font-size:20px;font-weight:bold;color:#ffd700">🎒 角色装备</span><span style="font-size:12px;color:#aaa;margin-left:10px">最高品质：${getEquipQualitySummary()}</span></div>
        <div class="equipment-grid-primary"><div><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">🛡️ 防具 · 6件</div>${renderEquipSlots(['head','robe','bracer','belt','pants','boots'])}</div><div><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">💎 首饰 · 5件</div>${renderEquipSlots(['necklace','bracelet','ring1','ring2','jade'])}</div></div>
        <div style="margin-top:12px"><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">⚔️ 武器法宝</div>${renderEquipSlots(['weapon','offhand','artifact1','artifact2','artifact3','flying'])}</div>
        <div style="margin-top:12px"><div style="color:#d9b5ec;font-size:13px;font-weight:bold;margin-bottom:6px">✨ 本命法宝 <span style="font-size:11px;color:#888">（金丹境解锁）</span></div>${renderEquipSlots(['lifeArtifact'])}</div>
        <div style="margin-top:12px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:9px"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:7px;font-size:12px">${renderEquipStatsSummary()}</div></div>
        ${renderSetProgressV2789()}
        <div class="equip-toolbar"><button class="panel-action-btn" onclick="showForgeV2825()">⚒️ 强化 / 洗练</button><button class="panel-action-btn equip-auto-btn" onclick="autoEquipBest()">⚡ 一键装备最佳${getEquipmentUpgradeCount()?` ↑${getEquipmentUpgradeCount()}`:''}</button><button class="panel-action-btn" onclick="showEquipmentInventory()">📦 背包装备（${player.equipmentInventory.length}）</button><button class="panel-action-btn equip-danger-btn" onclick="unequipAllGear()">↩️ 一键卸下</button><button class="panel-action-btn" onclick="document.getElementById('equipmentPanel')?.remove()">关闭</button></div>`;
      panel.appendChild(content);document.body.appendChild(panel);
    }

    function showEquipmentInventory(){
      migrateLooseEquipmentToEquipmentInventory(player);document.getElementById('equipmentPanel')?.remove();
      const items=player.equipmentInventory||[]; if(!items.length){showFloatingText?.('📦 装备背包为空','#aaa');return showEquipmentPanel();}
      const counts={};items.forEach(n=>counts[n]=(counts[n]||0)+1);
      let html=`<p>📦 <b>装备背包</b>（${items.length}件）</p><div class="equipment-bag-grid">`;
      for(const [name,count] of Object.entries(counts)){
        const d=getEquipData(name);if(!d)continue;const q=getQualityInfo(d.quality),check=canEquipItem(name);const slotLabel=d.slot==='ring'?'戒指':d.slot==='artifact'?'法宝':d.slot==='life_artifact'?'本命法宝':(EQUIPMENT_SLOTS[d.slot]?.label||d.slot);
        const upgrade=isInventoryEquipUpgrade(name),compare=check.ok?getEquipStatComparisonHtml(name):'';
        html+=`<div class="equipment-bag-card ${check.ok?'can-equip':''} ${upgrade?'upgrade':''}" style="border:1px solid ${upgrade?'rgba(105,240,174,.55)':q.color+'55'};${check.ok?'':'opacity:.58'}" ${check.ok?`onclick="equipItemFromInventory('${name}')"`:''}>${upgrade?'<span class="equip-upgrade-badge">↑ 更优</span>':''}<div style="font-size:20px;color:${q.color}">${q.icon}</div><div style="font-size:12px;color:${q.color};font-weight:bold;padding-right:${upgrade?'42px':'0'}">${name}${count>1?` ×${count}`:''}</div><div style="font-size:10px;color:#999">${slotLabel} · ${q.name} · 需${CULTIVATION_REALMS[d.realmRequired]?.name||'凡人'}</div><div style="font-size:10px;color:#bbb;margin-top:3px">${formatEquipItemStatsV286813(name)}</div>${compare}${!check.ok?`<div style="font-size:9px;color:#ff7b7b;margin-top:3px">${check.reason}</div>`:''}</div>`;
      }
      html+=`</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="choice-btn" style="flex:1;min-width:150px;background:linear-gradient(135deg,#237a52,#14543a);border-color:#69f0ae" onclick="autoEquipBest()">⚡ 一键装备最佳</button><button class="choice-btn" style="flex:1;min-width:150px" onclick="showEquipmentPanel()">← 返回装备栏</button></div>`;showStory(html,[]);
    }

    function equipItemFromInventory(name){if(equipItem(name))setTimeout(showEquipmentPanel,100);}
    function showEquipmentMenu(){showEquipmentPanel();}
    function equipGear(itemName){return equipItem(itemName);}
    function unequipGear(slot){return unequipItem(slot,true);}

    let lastItemUseV2768=-Infinity;
    function useItem(itemName) {
      if(!player||gameState==='combat')return showFloatingText?.('战斗结束后才能使用储物袋物品','#ffd76a');
      if(!player.inventory.includes(itemName))return showFloatingText?.('储物袋中没有该物品','#ffd76a');
      const now=performance.now();if(now-lastItemUseV2768<350)return;
      const def=ITEMS[itemName];
      if(def?.type==='breakthrough')return showFloatingText?.('请在修为圆满后的闭关突破预览中选用，此处不消耗','#ffd76a');
      if(def?.type==='heal'&&player.hp>=getMaxHp())return showFloatingText?.('气血已满，未消耗丹药','#ffd76a');
      if(def?.type==='mp'&&player.mp>=getMaxMp())return showFloatingText?.('灵力已满，未消耗丹药','#ffd76a');
      lastItemUseV2768=now;
      if(LONGEVITY_PILLS[itemName])return useLongevityPill(itemName);
      if (EQUIPMENT_DB[itemName]) {
        const idx=player.inventory.indexOf(itemName); if(idx>=0){player.inventory.splice(idx,1);player.equipmentInventory.push(itemName);}
        equipItem(itemName); updateStats(); autoSave(); return;
      }
      const item = ITEMS[itemName];
      if (!item) return;
      
      if (item.type === 'heal') {
        player.hp = Math.min(getMaxHp(), player.hp + item.value);
        removeItem(itemName);
        showStory(`使用${itemName}，恢复${item.value}点气血！`, [{ text: '继续', action: player.location }]);
      } else if (item.type === 'mp') {
        player.mp = Math.min(getMaxMp(), player.mp + item.value);
        removeItem(itemName);
        showStory(`使用${itemName}，恢复${item.value}点灵力！`, [{ text: '继续', action: player.location }]);
      } else if (item.type === 'exp') {
        player.exp += item.value;
        removeItem(itemName);
        checkLevelUp();
        showStory(`服用${itemName}，修为增加${item.value}点！`, [{ text: '继续', action: player.location }]);
      }
      updateStats(); autoSave(); renderMobileInventory();
    }
    
    function removeItem(itemName) {
      const idx = player.inventory.indexOf(itemName);
      if (idx > -1) player.inventory.splice(idx, 1);
    }
    
    // ================== 炼丹系统 ==================
    
    function showAlchemy() {
      document.getElementById('storyPanel').classList.add('hidden');
      document.getElementById('combatPanel').classList.add('hidden');
      document.getElementById('alchemyPanel').classList.remove('hidden');
      document.getElementById('petPanel').classList.add('hidden');
      document.getElementById('artifactPanel').classList.add('hidden');
      
      gameState = 'alchemy';
      updateAlchemyPanel();
    }
    
    function updateAlchemyPanel() {
      // 更新炼丹等级显示
      const successBonus = Math.floor((player.alchemyLevel - 1) * 3);
      document.getElementById('alchemyLevel').innerHTML = 
        `🔥 炼丹等级: <b>${player.alchemyLevel}</b> | 成功率加成: <b>+${successBonus}%</b> | 炼制次数: <b>${player.alchemyCount}</b>`;
      
      // 更新材料库存
      const matInv = document.getElementById('materialInventory');
      if (Object.keys(player.materials).length === 0) {
        matInv.innerHTML = '<span style="color: #aaa;">暂无材料</span>';
      } else {
        matInv.innerHTML = Object.entries(player.materials).map(([name, count]) => {
          const mat = MATERIALS[name];
          return `<span class="material-tag material-${mat?.type || 'herb'}" title="${mat?.desc || ''}">${mat?.icon || '🌿'} ${name} x${count}</span>`;
        }).join('');
      }
      
      // 更新丹方列表
      const recipeList = document.getElementById('recipeList');
      recipeList.innerHTML = Object.entries(RECIPES).map(([name, recipe]) => {
        const successRate = Math.min(1, recipe.baseSuccess + successBonus / 100);
        
        const materialText = Object.entries(recipe.materials)
          .map(([mat, count]) => {
            const have = player.materials[mat] || 0;
            const color = have >= count ? '#69f0ae' : '#ff6b6b';
            return `<span style="color:${color}">${mat}x${count}(${have})</span>`;
          }).join(', ');
        
        return `
          <div class="recipe-item">
            <div>
              <div class="recipe-name">${name}</div>
              <div class="recipe-materials">${materialText}</div>
              <div class="recipe-success">成功率: ${Math.floor(successRate * 100)}% | ${recipe.desc}</div>
            </div>
            <div class="alchemy-batch-actions" style="display:flex;gap:6px;flex-wrap:wrap">
              ${[1,5,10].map(n=>{const plan=getAlchemyPlanV286850(name,n);return `<button class="craft-btn" style="min-height:40px" onclick="craftPill('${name}',${n})" ${plan.count?'':'disabled'} title="${plan.reason||'按实际材料逐炉炼制，达到延寿上限停炉'}">×${n}${plan.count&&plan.count<n?'（可炼'+plan.count+'）':''}</button>`}).join('')}
            </div>
          </div>
        `;
      }).join('');
    }
    
    function getAlchemyPlanV286850(recipeName,times=1){
      const recipe=Object.prototype.hasOwnProperty.call(RECIPES,recipeName)?RECIPES[recipeName]:null;
      if(!recipe||![1,5,10].includes(times))return {count:0,reason:'无效丹方或炉数'};
      if(!player||gameState==='start'||!forgeAllowedV2825())return {count:0,reason:'当前状态无法炼丹'};
      if(player.alchemyLevel<recipe.alchemyLevelRequired)return {count:0,reason:`需要炼丹等级 ${recipe.alchemyLevelRequired}`};
      const result=recipe.result,limit=LONGEVITY_PILLS[result];
      if(limit&&normalizeLongevity(player.longevity).uses[result]+player.inventory.filter(n=>n===result).length>=limit.limit)return {count:0,reason:'库存与已服用数量已达终身上限'};
      const costs=Object.entries(recipe.materials);if(!costs.length)return {count:0,reason:'丹方缺少材料配置'};
      let count=times;
      for(const [mat,need] of costs){if(!Number.isSafeInteger(need)||need<=0)return {count:0,reason:'丹方材料配置异常'};const have=Number(player.materials[mat]||0);if(!Number.isSafeInteger(have)||have<0)return {count:0,reason:'材料数量异常'};count=Math.min(count,Math.floor(have/need));}
      return {count,reason:count?'':'材料不足',recipe};
    }
    function craftPill(recipeName,times=1) {
      const plan=getAlchemyPlanV286850(recipeName,times);
      if(!plan.count){showFloatingText?.(plan.reason,'#ff8a80');return false;}
      let attempted=0,success=0;const initialLevel=player.alchemyLevel;
      for(let i=0;i<plan.count;i++){
        // Recheck after each outcome: success may fill a lifetime cap or raise alchemy level.
        const step=getAlchemyPlanV286850(recipeName,1);if(!step.count)break;
        const recipe=step.recipe;
        for(const [mat,count] of Object.entries(recipe.materials)){player.materials[mat]-=count;if(player.materials[mat]<=0)delete player.materials[mat];}
        const successRate=Math.min(1,recipe.baseSuccess+Math.floor((player.alchemyLevel-1)*3)/100);
        player.alchemyCount++;attempted++;
        if(Math.random()<successRate){
          player.inventory.push(recipe.result);success++;player.alchemyExp+=10;
          if(player.alchemyExp>=player.alchemyLevel*50){player.alchemyExp=0;player.alchemyLevel++;}
          updateAchievementProgress('alchemy');
        }
      }
      showFloatingText?.(`🔥 投入 ${attempted} 炉 · ${plan.recipe.result} ×${success} · 失败 ${attempted-success} 炉${player.alchemyLevel>initialLevel?' · 炼丹升至 Lv.'+player.alchemyLevel:''}`,success?'#69f0ae':'#ff8a80');
      if(success)playSound(player.alchemyLevel>initialLevel?'levelup':'item');
      updateAlchemyPanel();updateStats();autoSave();return {attempted,success};
    }

    // ================== 宠物系统 ==================
    
    function showPets() {
      document.getElementById('storyPanel').classList.add('hidden');
      document.getElementById('combatPanel').classList.add('hidden');
      document.getElementById('alchemyPanel').classList.add('hidden');
      document.getElementById('petPanel').classList.remove('hidden');
      document.getElementById('artifactPanel').classList.add('hidden');
      
      updatePetPanel();
      gameState = 'pets';
    }
    
    function updatePetPanel() {
      // 更新宠物列表
      const petList = document.getElementById('petList');
      if (player.pets.length === 0) {
        petList.innerHTML = '<p style="color: #aaa; font-size: 12px;">暂无宠物，在战斗或探索中有机会捕获</p>';
      } else {
        petList.innerHTML = player.pets.map((pet, index) => {
          const petType = PET_TYPES[pet.type];
          const isActive = player.activePet === pet;
          const expNeed = pet.level * 30;
          
          return `
            <div class="pet-card">
              <div class="pet-avatar">${petType.icon}</div>
              <div class="pet-info">
                <div class="pet-name">${pet.name} Lv.${pet.level}</div>
                <div class="pet-stats">
                  攻击力: ${petType.baseAtk + pet.level * petType.growthAtk} | 
                  经验: ${pet.exp}/${expNeed}
                </div>
                <div class="pet-bonus">${petType.desc}</div>
              </div>
              <div>
                <button class="pet-btn ${isActive ? 'active' : ''}" onclick="setActivePet(${index})">
                  ${isActive ? '已出战' : '出战'}
                </button>
                <button class="pet-btn" onclick="feedPet(${index}, '灵兽丹')" 
                  ${player.petMaterials['灵兽丹'] ? '' : 'disabled'}>喂食</button>
              </div>
            </div>
          `;
        }).join('');
      }
      
      // 更新培养材料
      const matInv = document.getElementById('petMaterialInventory');
      if (Object.keys(player.petMaterials).length === 0) {
        matInv.innerHTML = '<span style="color: #aaa;">暂无培养材料</span>';
      } else {
        matInv.innerHTML = Object.entries(player.petMaterials)
          .map(([name, count]) => `<span class="material-tag" style="background: rgba(0,255,255,0.3); color: #00ffff;">🍖 ${name} x${count}</span>`)
          .join('');
      }
    }
    
    function setActivePet(index) {
      if (player.activePet === player.pets[index]) {
        player.activePet = null;
      } else {
        player.activePet = player.pets[index];
      }
      updatePetPanel();
      updateStats();
      autoSave();
    }
    
    function feedPet(index, foodName) {
      if (!player.petMaterials[foodName] || player.petMaterials[foodName] <= 0) return;
      
      const pet = player.pets[index];
      const food = PET_FOOD[foodName];
      
      player.petMaterials[foodName]--;
      if (player.petMaterials[foodName] <= 0) delete player.petMaterials[foodName];
      
      pet.exp += food.exp;
      const expNeed = pet.level * 30;
      
      if (pet.exp >= expNeed) {
        pet.exp -= expNeed;
        pet.level++;
        alert(`🎉 ${pet.name} 升级了！当前等级 ${pet.level}`);
        playSound('levelup');
      }
      
      updatePetPanel();
      autoSave();
    }
    
    function captureRandomPet() {
      if (player.pets.length >= 5) return;
      
      const types = Object.keys(PET_TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      const petType = PET_TYPES[type];
      
      if (Math.random() < petType.captureRate) {
        const pet = {
          type: type,
          name: petType.name,
          level: 1,
          exp: 0
        };
        player.pets.push(pet);
        addCombatLog(`🎉 捕获了宠物 ${petType.icon} ${petType.name}！`, 'pet');
        playSound('item');
        updateAchievementProgress('pet');
      }
    }
    
    // ================== 法宝系统 ==================
    
    function showArtifacts() {
      document.getElementById('storyPanel').classList.add('hidden');
      document.getElementById('combatPanel').classList.add('hidden');
      document.getElementById('alchemyPanel').classList.add('hidden');
      document.getElementById('petPanel').classList.add('hidden');
      document.getElementById('artifactPanel').classList.remove('hidden');
      
      updateArtifactPanel();
      gameState = 'artifacts';
    }
    
    function updateArtifactPanel() {
      // 更新法宝列表
      const artifactList = document.getElementById('artifactList');
      if (player.artifacts.length === 0) {
        artifactList.innerHTML = '<p style="color: #aaa; font-size: 12px;">暂无法宝，首领掉落或探索发现可获得</p>';
      } else {
        artifactList.innerHTML = player.artifacts.map((art, index) => {
          const artType = ARTIFACT_TYPES[art.type];
          const isActive = player.activeArtifact === art;
          
          return `
            <div class="artifact-card">
              <div class="artifact-icon">${artType.icon}</div>
              <div class="artifact-info">
                <div class="artifact-name">${art.name} +${art.level}</div>
                <div class="artifact-desc">${artType.desc}</div>
                <div class="artifact-level">类型: ${artType.type === 'attack' ? '攻击型' : artType.type === 'defense' ? '防御型' : '辅助型'}</div>
              </div>
              <div>
                <button class="artifact-btn ${isActive ? 'active' : ''}" onclick="setActiveArtifact(${index})">
                  ${isActive ? '已装备' : '装备'}
                </button>
                <button class="artifact-btn" onclick="upgradeArtifact(${index})"
                  ${canUpgradeArtifact(art) ? '' : 'disabled'}>强化</button>
              </div>
            </div>
          `;
        }).join('');
      }
      
      // 更新强化材料
      const matInv = document.getElementById('artifactMaterialInventory');
      const allMats = { ...player.artifactMaterials };
      allMats['灵石'] = player.gold;
      
      if (Object.keys(allMats).length === 0) {
        matInv.innerHTML = '<span style="color: #aaa;">暂无强化材料</span>';
      } else {
        matInv.innerHTML = Object.entries(allMats)
          .filter(([name, count]) => count > 0)
          .map(([name, count]) => {
            if (name === '灵石') return `<span class="material-tag material-stone">💰 ${name} x${count}</span>`;
            const mat = MATERIALS[name];
            return `<span class="material-tag material-${mat?.type || 'stone'}">${mat?.icon || '💎'} ${name} x${count}</span>`;
          }).join('');
      }
    }
    
    function canUpgradeArtifact(art) {
      const artType = ARTIFACT_TYPES[art.type];
      if (art.level >= artType.maxLevel) return false;
      
      for (const [mat, count] of Object.entries(artType.upgradeCost)) {
        if (mat === '灵石') {
          if (player.gold < count * art.level) return false;
        } else {
          if ((player.artifactMaterials[mat] || 0) < count) return false;
        }
      }
      return true;
    }
    
    function setActiveArtifact(index) {
      if (player.activeArtifact === player.artifacts[index]) {
        player.activeArtifact = null;
      } else {
        player.activeArtifact = player.artifacts[index];
      }
      updateArtifactPanel();
      updateStats();
      autoSave();
    }
    
    function upgradeArtifact(index) {
      const art = player.artifacts[index];
      const artType = ARTIFACT_TYPES[art.type];
      
      if (art.level >= artType.maxLevel) {
        alert('已达最大等级！');
        return;
      }
      
      // 消耗材料
      for (const [mat, count] of Object.entries(artType.upgradeCost)) {
        if (mat === '灵石') {
          player.gold -= count * art.level;
        } else {
          player.artifactMaterials[mat] -= count;
          if (player.artifactMaterials[mat] <= 0) delete player.artifactMaterials[mat];
        }
      }
      
      art.level++;
      alert(`✨ ${art.name} 强化成功！当前等级 +${art.level}`);
      playSound('item');
      
      updateArtifactPanel();
      updateStats();
      autoSave();
    }
    
    function dropRandomArtifact() {
      const types = Object.keys(ARTIFACT_TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      const artType = ARTIFACT_TYPES[type];
      
      const art = {
        type: type,
        name: artType.name,
        level: 1
      };
      player.artifacts.push(art);
      addCombatLog(`✨ 获得法宝 ${artType.icon} ${artType.name}！`, 'boss');
      playSound('item');
      updateAchievementProgress('artifact');
    }
    
    // ================== 剧情系统 ==================
    
    function advanceStory() {
      const currentChapter = STORY_CHAPTERS[player.storyProgress];
      player.storyCompleted[player.storyProgress] = true;
      if (player.storyProgress < STORY_CHAPTERS.length - 1) {
        player.storyProgress++;
      }
      updateStoryProgress();
    }
    
    function getStoryEvent() {
      const chapter = STORY_CHAPTERS[player.storyProgress];
      if (hasReachedRealm(chapter.realmRequired) && !player.storyCompleted[chapter.id]) {
        return chapter;
      }
      return null;
    }
    
    // ================== 地点系统 ==================
    
    function showLocation(loc) {
      if(loc==='rest'&&(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating||COMBAT_FINISH_V2764.settling))return;
      // 新手演武通过前不开放自由地点面板，防止教程与地点菜单叠层。
      if (typeof tutorialFreeExploreUnlocked === 'function' && typeof tutorialState !== 'undefined' && tutorialState.active && !tutorialFreeExploreUnlocked()) {
        if (typeof showTutorialToast === 'function') showTutorialToast('先完成当前引路。演武通过后即可自由探索。', 2200);
        return;
      }
      player.location = loc;
      
      const storyEvent = getStoryEvent();
      // 主线剧情不再从任意地点随机弹出，避免与地图、引导、地点面板叠层。
      // 改为：只给轻提示，并在对应地点面板中由玩家主动进入主线。
      if (loc !== 'romance' && storyEvent) {
        if (!window.__xiantuStoryToastLock) {
          window.__xiantuStoryToastLock = true;
          if (typeof showTutorialToast === 'function') {
            showTutorialToast(`📜 主线待办：${storyEvent.title}，请在地点面板中手动进入`, 2200);
          } else if (typeof showFloatingText === 'function') {
            showFloatingText(`📜 主线待办：${storyEvent.title}`, '#ffd98a');
          }
          setTimeout(() => { window.__xiantuStoryToastLock = false; }, 2400);
        }
      }
      
      switch(loc) {
        case 'village': showVillage(); break;
        case 'shop': showShop(); break;
        case 'explore': showExplore(); break;
        case 'mountain': showMountain(); break;
        case 'sect': showSect(); break;
        case 'youmingu': showYoumingu(); break;
        case 'alchemy': showAlchemy(); break;
        case 'pets': showPets(); break;
        case 'artifacts': showArtifacts(); break;
        case 'rest': doRest(); break;
        // 新地图
        case 'forest': showForest(); break;
        case 'battlefield': showBattlefield(); break;
        case 'market': showMarket(); break;
        case 'home': showHome(); break;
        case 'secret': showSecretRealm(); break;
        case 'romance': showRomanceHub(); break;
        case 'yewuji_story_v2816': showYeChronicleV2816(); break;
        case 'ancient_war_v2859': showAncientWarV2859(); break;
        case 'yewuji_v2810': showYeWujiV2810(); break;
        case 'challenge_yewuji_v2810': challengeYeWujiV2810(); break;
        case 'factions_human': showFactionDirectory('human'); break;
        case 'factions_demon': showFactionDirectory('demon'); break;
        case 'factions_immortal': showFactionDirectory('immortal'); break;

        case 'world_travel_menu': showWorldTravelMenu(); break;
        case 'npc_mentor': showMapNpcHub('mentor'); break;
        case 'npc_beast': showMapNpcHub('beast'); break;
        case 'npc_elder': showMapNpcHub('elder'); break;
        case 'npc_trader': showMapNpcHub('trader'); break;
      }
      updateStats();
    }
    
    // 迷雾森林
    function showForest() {
      const choices = [
        { text: '🌲 深入探索（高经验，有迷路风险）', action: 'forest_explore' },
        { text: '👹 挑战迷雾领主', action: 'forest_boss', boss: true, condition: () => hasReachedRealm(2) && !player.bossesDefeated.includes('迷雾领主') }
      ];
      let text = buildAreaSceneCard({
        icon:'🌲',
        title:'东域 · 迷雾森林',
        subtitle:'浓雾深林 / 经验丰厚 / 易迷路',
        desc:'古木遮天，雾气常年不散。林间妖兽数量密集，是早中期刷经验的好地方，但深入太快容易连续遭遇强敌。',
        accent:'#9fe08a',
        chips:['高经验','迷路事件','木系灵材'],
        info:'建议先确保背包里有足够丹药，再深入核心区域。若追求稳定收益，可先清外围妖兽。'
      });
      if (player.bossesDefeated.includes('迷雾领主')) {
        text += `<div class="area-info-box" style="color:#69f0ae">✅ 迷雾领主已被击败，森林核心已趋于平静。</div>`;
      }
      choices.push({ text: '← 返回东域地图', action: 'return_to_map' });
      showStory(text, choices);
    }
    
    // 古战场
    function showBattlefield() {
      let text = buildAreaSceneCard({
        icon:'⚔️',
        title:'西域 · 古战场',
        subtitle:'强敌盘踞 / 残垣断壁 / 危险度偏高',
        desc:'这里仍残留着上古大战的杀伐之气。怪物强度明显高于普通区域，但掉落战利品也更好，适合筑基之后反复挑战。',
        accent:'#ff9b7a',
        chips:['高危区域','高掉落','战意压制'],
        info:'<b style="color:#ffb39c">建议：</b> 至少筑基期再来，先准备回血丹药与更高防具。'
      });
      const choices = [
        { text: '⚔️ 搜索战场', action: 'battlefield_explore' },
        { text: '👹 挑战战神之魂', action: 'battlefield_boss', boss: true, condition: () => hasReachedRealm(2) && !player.bossesDefeated.includes('战神之魂') }
      ];
      if (player.bossesDefeated.includes('战神之魂')) {
        text += `<div class="area-info-box" style="color:#69f0ae">✅ 战神之魂已被击败。</div>`;
      }
      choices.push({ text: '← 返回西域地图', action: 'return_to_map' });
      showStory(text, choices);
    }
    
    // 仙市
    function showMarket() {
      showStory(`${jevEntryV2846('jevMerchantV2849()','Jev 商人按需推荐')}<section class="market-hub-v2800"><span class="market-kicker-v2800">南域商街</span><h3>仙市</h3><p>灵石 <b>${player.gold}</b> · 按用途挑选所需之物</p><div class="market-map-v2800"><div><b>⚔️ 神兵铺</b><p>主武器 · 剑 / 棍 / 枪 / 法杖</p></div><div><b>🛡️ 护身坊</b><p>防具 · 鞋履 · 首饰</p></div><div><b>🧪 丹药铺</b><p>修行补给与延寿丹药</p></div><div><b>✨ 法宝阁</b><p>稀有法宝与材料</p></div></div><p>六套装备统一提供灵品、宝器、仙器版本。武器与护具分店售卖，价格和套装加成沿用。</p></section>`,[
        {text:'⚔️ 神兵铺 · 购买武器',action:'shop_weapon_set'},
        {text:'🛡️ 护身坊 · 购买防具与饰品',action:'shop_armor_set'},
        {text:'🧪 丹药铺 · 补给与延寿',action:'shop_rare_pill'},
        {text:'✨ 法宝阁 · 法宝与材料',action:'shop_rare_artifact'},
        {text:'🏠 家具铺 · 洞府陈设',action:'shop_furniture'},
        {text:'← 返回南域地图',action:'return_to_map'}]);
    }
    function marketGearItemsV2800(category,grade,family='all'){
      if(!['weapon','armor'].includes(category)||!Number.isInteger(grade)||grade<1||grade>GRADES_V2790.length)return [];
      return Object.entries(EQUIPMENT_DB).filter(([name,d])=>d.familyV2790&&d.gradeV2790===grade&&(family==='all'||d.familyV2790===family)&&(category==='weapon'?d.slot==='weapon':d.slot!=='weapon'));
    }
    function showMarketGearV2800(category='weapon',grade=1,family='all'){
      if(gameState==='combat'||gameState==='combat-ending'||!['weapon','armor'].includes(category)||!GRADES_V2790[grade-1])return;
      const families=[...Object.keys(OLD_SET_VERSIONS_V2792),...Object.keys(NEW_SETS_V2790)];
      if(family!=='all'&&!families.includes(family))return;
      const items=marketGearItemsV2800(category,grade,family),g=GRADES_V2790[grade-1];
      let html=`<section class="market-hub-v2800"><span class="market-kicker-v2800">仙市 · ${category==='weapon'?'主武器专营':'防具与饰品专营'}</span><h3>${category==='weapon'?'⚔️ 神兵铺':'🛡️ 护身坊'}</h3><p>现有灵石 <b>${player.gold}</b> · 当前 ${items.length} 件商品</p><div class="market-filters-v2800">`;
      GRADES_V2790.forEach((v,i)=>html+=`<button type="button" aria-pressed="${grade===i+1}" style="color:${getQualityInfo(v.quality).color}" onclick="showMarketGearV2800('${category}',${i+1},'${family}')">${v.name}</button>`);
      html+='</div><div class="market-filters-v2800">';
      for(const f of ['all',...families])html+=`<button type="button" aria-pressed="${family===f}" onclick="showMarketGearV2800('${category}',${grade},'${f}')">${f==='all'?'全部套装':f}</button>`;
      html+='</div><p>同套不同品级可混穿；购买后进入装备背包。</p></section>';
      html+=jevEntryV2846('jevMerchantV2849()','Jev 推荐买得起的升级与补给');
      if(!items.length)html+='<p class="market-empty-v2800">这套装备在本店没有对应部位。请选择其他套装，或前往另一家店查看。</p>';
      for(const [name,d] of items){
        const q=getQualityInfo(d.quality),allowed=canEquipItem(name).ok,owned=(player.equipmentInventory||[]).filter(n=>n===name).length+Object.values(player.equipment||{}).filter(n=>n===name).length;
        const reason=!allowed?`需${CULTIVATION_REALMS[d.realmRequired]?.name||'更高境界'}`:player.gold<d.priceV2790?`还差 ${d.priceV2790-player.gold} 灵石`:'购买';
        html+=`<article class="gear-grade-card-v2791 market-item-v2800" style="--gear-color:${q.color}"><b style="color:var(--gear-color)">${name}</b><p>${EQUIPMENT_SLOTS[d.slot]?.name||d.slot} · 需${CULTIVATION_REALMS[d.realmRequired]?.name} · 已持有 ${owned}</p><p>${formatEquipItemStatsV286813(name)}</p><details><summary>查看装备说明</summary><p>${d.desc||''}</p></details><div class="market-buy-v2800"><strong>${d.priceV2790} 灵石</strong><button type="button" class="choice-btn" ${!allowed||player.gold<d.priceV2790?'disabled':''} onclick="buyMarketGearV2800('${category}',${grade},'${family}','${d.familyV2790}',${d.pieceV2790})">${reason}</button></div></article>`;
      }
      showStory(html,[{text:category==='weapon'?'🛡️ 前往护身坊':'⚔️ 前往神兵铺',action:'market_switch_v2800',category:category==='weapon'?'armor':'weapon',grade},{text:'← 返回仙市',action:'market'}]);
    }
    function buyMarketGearV2800(category,grade,filter,family,piece){
      if(gameState==='combat'||gameState==='combat-ending')return;
      const entry=marketGearItemsV2800(category,grade,filter).find(([n,d])=>d.familyV2790===family&&d.pieceV2790===piece);
      if(!entry)return;
      const [name,d]=entry;
      if(!canEquipItem(name).ok||!Number.isFinite(d.priceV2790)||d.priceV2790<=0||player.gold<d.priceV2790)return;
      if(!confirmGearPurchaseV2804(name,d.priceV2790))return;
      player.gold-=d.priceV2790;(player.equipmentInventory||=[]).push(name);autoSave();updateStats();showMarketGearV2800(category,grade,filter);
    }

    function showHome() {
      const home=normalizeHomeV2812(player),furnitureBonus=calculateFurnitureBonus(),furn=home.furniture.length?home.furniture.filter(f=>f.active!==false).map(f=>f.name).join('、')||'暂无摆放':'暂无';
      const text=buildAreaSceneCard({icon:'🏠',title:`我的洞府 · Lv.${home.level}`,subtitle:'前庭 / 静室 / 灵脉歇息区 / 陈设区',desc:'洞府现在按真正居所的逻辑分区，不再只是一个功能入口。',accent:'#bce59b',chips:['闭关修炼','家具增益','状态恢复'],info:`家具增益：<b style="color:#ffd700">${furnitureBonus.desc||'无'}</b><br>当前陈设：${furn}`})+
        buildInteriorStrip('洞府内室',[{icon:'🧘',name:'静修蒲团',desc:'一年修炼从这里开始。'},{icon:'🕯️',name:'闭关内室',desc:'十年闭关的核心区域。'},{icon:'🛏️',name:'灵脉歇息榻',desc:'恢复气血与灵力。'},{icon:'🪑',name:'家具陈设角',desc:'集中获得家具增益。'}]);
      const choices=[{text:'🧭 游历派遣与流派羁绊',action:'trip_v286821'},{text:'🧘 短期修炼（最多一年）',action:'home_cultivate'},{text:'🕯️ 洞府闭关（最多十年）',action:'home_cultivate_decade'},{text:'💤 休息一天（恢复气血灵力）',action:'home_rest'},{text:'📋 管理家具',action:'home_manage'}];
      if(home.level<5)choices.push({text:`🏠 升级洞府 (${home.level*200}灵石)`,action:'home_upgrade',condition:()=>player.gold>=home.level*200});
      choices.push({text:'← 返回南域地图',action:'return_to_map'});showStory(text,choices);
    }

    function showSecretRealm() {
      const qualified = hasSectSecretQualification();
      const qCentury = player.sectTournament?.secretQualifiedCentury || 0;
      let text = buildAreaSceneCard({
        icon:'🌀',
        title:'万宗秘境',
        subtitle:`当前：${getGameDateLabel()} · 所属宗门：${player.sect}`,
        desc:'这座秘境由人族各大宗门共同镇守，每百年只向万宗大比前三名开放。资格稀有，但产出也远超普通地图。',
        accent:'#c9a8ff',
        chips:['百年开放','宗门前三资格','高阶资源'],
        info:'只有拿到资格的宗门弟子才能进入。若暂时无缘，可先准备下一届大比。'
      });
      const choices = [];
      if (qualified) {
        text += `<p style="color:#69f0ae">🌟 ${player.sect}在第 ${qCentury} 年万宗大比进入前三，本世纪拥有秘境资格！</p><p style="font-size:11px;color:#aaa">资格将在仙历 ${qCentury+100} 年下一届大比开始时失效。</p>`;
        text+=jevEntryV2846('jevSecretV2846()','Jev 秘境探索 · 30个游戏日');
        choices.push({ text: '🚪 进入万宗秘境探索', action: 'secret_explore' });
        choices.push({ text: '👹 挑战秘境之主', action: 'secret_boss', boss: true, condition: () => hasReachedRealm(2) && !player.bossesDefeated.includes('秘境之主') });
      } else {
        const pending=getPendingTournamentCentury();
        text += `<p style="color:#ff6b6b">🔒 你所在的宗门当前没有万宗秘境资格。</p>`;
        if(pending) text += `<p style="color:#ffd98a">📯 第 ${pending} 年百年宗门大比正在等待参赛，打进前三即可获得资格。</p>`;
        else text += `<p style="color:#aaa">下一届大比将在仙历 ${getNextTournamentYear()} 年举行。</p>`;
        choices.push({text:'📯 查看百年宗门大比',action:'sect_tournament'});
      }
      if (player.bossesDefeated.includes('秘境之主')) text += `<p style="color:#69f0ae">✅ 秘境之主已被击败</p>`;
      choices.push({ text: '← 返回东域地图', action: 'return_to_map' });
      showStory(text, choices);
    }

    function romanceProgressBar(value, color='#ff9fb7') {
      const pct = Math.max(0, Math.min(100, value));
      return `<div style="height:8px;background:rgba(255,255,255,.1);border-radius:999px;overflow:hidden;margin:6px 0 3px;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${color},#ffd8e3);transition:width .25s;"></div></div>`;
    }

    function showRomanceHub() {
      const partner = player.romance.partner ? ROMANCE_NPCS[player.romance.partner] : null;
      const su = player.romance.npcs[MAIN_HEROINE_ID];
      const suStage = getRomanceStage(su.affection, player.romance.partner===MAIN_HEROINE_ID, MAIN_HEROINE_ID);
      let text = `<p>💗 <b>姻缘亭</b></p><p>有些缘分不是从相遇开始，而是从失去以后，才真正看清。</p>`;
      if (partner) text += `<p style="color:#ffb6c9;">❤️ 当前道侣：<b>${partner.name}</b></p>`;
      else text += `<p style="color:#d8c6aa;">🌿 主线旧缘：<b>苏晚晴</b> · ${suStage}</p><p style="font-size:11px;color:#aaa">你们曾经相爱，也曾在青石桥上分开。能否重新走到一起，取决于主线与境界，而不是单靠赠礼。</p><p style="font-size:11px;color:#d9b5ec">${getHeartDemonDescription()}</p><p style="font-size:11px;color:#cdb9a0">⚠ ${getMainHeroineRivalStatus()}</p>`;
      const choices=[];
      for (const [id,npc] of Object.entries(ROMANCE_NPCS)) {
        const r=player.romance.npcs[id];
        const unlocked=hasReachedRealm(npc.unlockLevel);
        const stage=getRomanceStage(r.affection, player.romance.partner===id, id);
        if (unlocked) {
          const badge=id===MAIN_HEROINE_ID ? ' <span style="font-size:10px;color:#ffd9a6">【主线女主·前任】</span>' : '';
          text += `<div style="margin-top:10px;padding:9px 10px;border:1px solid ${npc.color}55;border-radius:10px;background:${npc.color}0d;"><b style="color:${npc.color}">${npc.icon} ${npc.name}</b>${badge} · ${npc.title}<br><span style="font-size:11px;color:#aaa">${stage} · 好感 ${r.affection}/100</span>${romanceProgressBar(r.affection,npc.color)}</div>`;
          choices.push({text:`${npc.icon} 前往拜访 ${npc.name}`,action:'romance_npc',npcId:id,story:true});
        } else {
          text += `<p style="color:#777;margin-top:8px;">🔒 一段缘分尚未出现（需要达到 ${CULTIVATION_REALMS[npc.unlockLevel]?.name || '更高境界'}）</p>`;
        }
      }
      choices.push({text:'← 返回青云村',action:'village'});
      showStory(text,choices);
    }

    function romanceEventUnlocked(ev) {
      return hasReachedRealm(ev.levelRequired || 0) && player.storyProgress >= (ev.storyRequired || 0);
    }

    function getNextRomanceEvent(npcId) {
      const npc=ROMANCE_NPCS[npcId], r=player.romance.npcs[npcId];
      if(npcId==='jihongling'||npcId===MAIN_HEROINE_ID){const ev=npc.events.find(e=>!r.events.includes(e.id));return ev && r.affection>=ev.threshold && romanceEventUnlocked(ev)?ev:null;}
      return npc.events.find(ev=>r.affection>=ev.threshold && romanceEventUnlocked(ev) && !r.events.includes(ev.id)) || null;
    }

    function getFirstUnfinishedRomanceEvent(npcId) {
      const npc=ROMANCE_NPCS[npcId], r=player.romance.npcs[npcId];
      return npc?.events.find(ev=>!r.events.includes(ev.id)) || null;
    }

    function showRomanceNpc(npcId) {
      const npc=ROMANCE_NPCS[npcId];
      if (!npc || !hasReachedRealm(npc.unlockLevel)) return showRomanceHub();
      const r=player.romance.npcs[npcId];
      const partner=player.romance.partner===npcId;
      const stage=getRomanceStage(r.affection,partner,npcId);
      const nextEvent=getNextRomanceEvent(npcId);
      const unfinished=getFirstUnfinishedRomanceEvent(npcId);
      let text=`<p>${npc.icon} <b style="color:${npc.color}">${npc.name}</b> · ${npc.title}</p><p>${npc.intro}</p><p style="color:#ffb6c9">关系：<b>${stage}</b>　好感：${r.affection}/100</p>${romanceProgressBar(r.affection,npc.color)}`;
      if(npcId===MAIN_HEROINE_ID&&rainStateV286822().step>=13){text+=`<p>雨夜旧案：${escapeGameText(rainSummaryV286822())}</p><p>${rainStateV286822().trust==='share'?'苏晚晴：下次有事，也像那夜一样，把原信拿来给我看。':'苏晚晴：我还在等你把保留的那一半，亲口讲给我听。'}</p>`;}
      if(npcId===MAIN_HEROINE_ID)text+=`<p>心境共鸣：${Number(r.resonanceV286826)||0} 点 · 完成重逢事件后，按新好感上限补回；不跳过剧情条件。</p>`;
      if (npcId===MAIN_HEROINE_ID && !partner) {
        text += `<p style="font-size:11px;color:#d8c6aa">💔 你们不是初识，而是曾经在一起过。关系修复必须经历七段主线事件。</p><p style="font-size:11px;color:#d9b5ec">${getHeartDemonDescription()}</p><p style="font-size:11px;color:#cdb9a0">⚠ ${getMainHeroineRivalStatus()}</p>`;
        if (unfinished && !nextEvent) {
          const reqRealm=CULTIVATION_REALMS[unfinished.levelRequired||0]?.name || '当前境界';
          text += romanceGuideV286826(unfinished,r);
        }
      }
      if(npcId==='jihongling'){
        const done=npc.events.filter(e=>r.events.includes(e.id)).length;
        text+=`<p style="color:#ffd1dc">结缘故事 ${done}/5：仙市风波 → 万灯夜 → 檐下听雨 → 江湖与归处 → 红绫之约。</p>`;
        if(!partner)text+='<p>成为情侣：筑基境、好感80、完成五段故事，且当前没有道侣。交谈和赠送仙果均能提升好感。</p>';
        if(unfinished)text+=`<p>下一段【${unfinished.title}】：好感需达到 ${unfinished.threshold}。</p>`;
        if(partner)text+='<p>❤️ 情侣 · 已结为道侣。好感90可开启「红帐夜话」，也可选择只赏月聊天。</p>';
      } else if (partner) text += `<p style="color:#ffd1dc">❤️ 你们没有回到从前，而是选择从现在重新同行。</p>`;
      if(npcId===MAIN_HEROINE_ID && player.romanceProgress.endingChosen){
        text += player.romanceProgress.endingType==='reunion' ? `<p style="color:#ffd700;font-size:11px">🌸 结局：破尘归心</p>` : `<p style="color:#8ab4f8;font-size:11px">🌅 结局：山河各安</p>`;
      }
      const choices=[
        {text:'💬 与她交谈',action:'romance_chat',npcId},
        {text:'🎁 赠送礼物',action:'romance_gift_menu',npcId}
      ];
      if(npcId==='jihongling' && partner)choices.push({text:'🌙 红帐夜话',action:'ji_evening',story:true});
      if (nextEvent) choices.unshift({text:`📖 关系主线：${nextEvent.title}`,action:'romance_event',npcId,eventId:nextEvent.id,story:true});
      if (npcId===MAIN_HEROINE_ID && !player.romance.partner && !player.romanceProgress.endingChosen && r.affection>=85 && r.events.includes('second_choice') && hasReachedRealm(6) && player.storyProgress>=5) {
        choices.push({text:'❤️ 青石桥 · 做出最终选择',action:'romance_confess',npcId,story:true});
      } else if (npcId!==MAIN_HEROINE_ID && !player.romance.partner && r.affection>=80 && (npcId!=='jihongling'||npc.events.every(e=>r.events.includes(e.id)))) {
        choices.push({text:'❤️ 表明心意，结为道侣',action:'romance_confess',npcId,condition:()=>hasReachedRealm(2),story:true});
      }
      if (player.romance.partner && player.romance.partner!==npcId) text += `<p style="font-size:11px;color:#aaa">你已与 ${ROMANCE_NPCS[player.romance.partner].name} 结为道侣。</p>`;
      text+='<button class="choice-btn" onclick="showExpansionV286827()">人物拾遗 · 可选支线</button>';
      text+=jevEntryV2846("showRelationshipsV2852('"+npcId+"')",'知己往事 · 剧情 / 闲谈');
      text+=jevEntryV2846("jevNpcV2846('"+npcId+"')",'Jev 人物回应');
      if(partner)text+=jevEntryV2846('showCompanionV2849()','同伴随行 / Jev 支援');
      choices.push({text:'← 返回姻缘亭',action:'romance'});
      showStory(text,choices);
    }

    function doRomanceChat(npcId,jevTone=null) {
      const npc=ROMANCE_NPCS[npcId], r=player.romance.npcs[npcId];
      if (!npc || !r) return;
      const tier=npcId===MAIN_HEROINE_ID ? Math.min(3, getSuReunionCount()) : Math.min(3, Math.floor(r.affection/25));
      const lines=npc.dialogues[tier] || npc.dialogues[0];
      const tone=jevTone===0?'她略一颔首，回应仍保留着些许距离。':jevTone===1?'她收起心事，认真听你说起近况。':jevTone===2&&r.affection>=40?'她眉眼渐柔，主动问起你的修行与伤势。':'';
      const line=npcId===MAIN_HEROINE_ID&&player.romanceProgress?.endingType==='release'?'旧事我们都记得，却不必再用它决定以后。下次查案若需药师，仍可来寻我。':(tone?tone+' ':'')+lines[r.chats % lines.length];
      r.chats++;
      const gain=npcId===MAIN_HEROINE_ID&&player.romanceProgress?.endingType==='release'?0:addAffection(npcId, r.chats<=4 ? 3 : 2);
      const capNote=npcId===MAIN_HEROINE_ID && gain===0 && !player.romance.partner && player.romanceProgress?.endingType!=='release' ? '<p style="font-size:11px;color:#aaa">本次心意已记入心境共鸣（累计不超过满好感所需值）。请先完成下一段重逢，解开关系上限。</p>' : '';
      showStory(`<p>${npc.icon} <b style="color:${npc.color}">${npc.name}</b></p><p>“${line}”</p><p style="color:#ffb6c9">💗 好感 +${gain}（${r.affection}/100）</p>${capNote}`,[{text:'继续',action:'romance_npc',npcId}]);
    }

    function showRomanceGiftMenu(npcId) {
      const npc=ROMANCE_NPCS[npcId], r=player.romance.npcs[npcId];
      let text=`<p>🎁 <b>赠礼给 ${npc.name}</b></p><p style="color:#aaa">礼物能让关系变柔软，但修复旧伤不能只靠礼物。</p>`;
      const choices=[];
      for (const [item,delta] of Object.entries(npc.gifts)) {
        const count=player.materials[item]||0;
        choices.push({text:`${item} ×1（持有 ${count}）`,action:'romance_gift',npcId,item,delta,condition:()=> (player.materials[item]||0)>0});
      }
      choices.push({text:'← 返回',action:'romance_npc',npcId});
      showStory(text,choices);
    }

    function giveRomanceGift(npcId,item,delta) {
      const npc=ROMANCE_NPCS[npcId], r=player.romance.npcs[npcId];
      if (!npc || !r || (player.materials[item]||0)<=0) return showRomanceGiftMenu(npcId);
      player.materials[item]--; r.gifts++;
      const gain=npcId===MAIN_HEROINE_ID&&player.romanceProgress?.endingType==='release'?0:addAffection(npcId,delta);
      const reaction = gain>=10 ? '她明显很喜欢这份礼物。' : gain>=6 ? '她认真收下了礼物。' : gain>0 ? '她向你道谢，神色柔和了一些。' : '她收下了，但你能感觉到：有些隔阂不是一件礼物能跨过去的。';
      showStory(`<p>${npc.icon} 你将 <b>${item}</b> 送给 ${npc.name}。</p><p>${reaction}</p><p style="color:#ffb6c9">💗 好感 +${gain}（${r.affection}/100）</p>`,[{text:'继续',action:'romance_npc',npcId}]);
    }

    function showRomanceEvent(npcId,eventId) {
      const npc=ROMANCE_NPCS[npcId], ev=npc?.events.find(e=>e.id===eventId), r=player.romance.npcs[npcId];
      if (!npc || !ev || !r || r.events.includes(eventId) || r.affection<ev.threshold || !romanceEventUnlocked(ev)) return showRomanceNpc(npcId);
      if((npcId==='jihongling'||npcId===MAIN_HEROINE_ID) && getNextRomanceEvent(npcId)?.id!==eventId)return showRomanceNpc(npcId);
      showStory(`<p style="color:${npc.color};font-weight:bold">【${ev.title}】</p><p>${relationshipTextV286827(ev.text)}</p>`,ev.choices.map((c,option)=>({text:c.text,action:'romance_event_choice',npcId,eventId,option,story:true})));
    }

    function resolveRomanceEvent(npcId,eventId,option=0) {
      const npc=ROMANCE_NPCS[npcId], ev=npc?.events.find(e=>e.id===eventId), r=player.romance.npcs[npcId];
      if(!npc || !ev || !r || r.events.includes(eventId)||r.affection<ev.threshold||!romanceEventUnlocked(ev)) return showRomanceNpc(npcId);
      if(npcId==='jihongling' && getNextRomanceEvent(npcId)?.id!==eventId)return showRomanceNpc(npcId);
      // 苏晚晴主线严格按七阶段顺序，防止旧档/调试误跳事件。
      if(npcId===MAIN_HEROINE_ID){
        const expected=SU_REUNION_EVENT_IDS[getSuReunionCount()];
        if(expected && eventId!==expected) return showRomanceNpc(npcId);
      }
      const choice=ev.choices[Math.max(0,Math.min(ev.choices.length-1,option))];
      r.events.push(eventId);
      const restored=npcId===MAIN_HEROINE_ID&&!choice.distantV286827?releaseResonanceV286826():0;
      const gain=addAffection(npcId,choice.delta||0);
      recordRomanceV286827(npcId,eventId,option,choice);
      let extra=restored?`<p>心境共鸣化开：好感补回 ${restored}。</p>`:'';
      let nextAction={text:'继续',action:'romance_npc',npcId};
      if(npcId===MAIN_HEROINE_ID){
        applySuV2EventState(eventId);
        const hd=player.heartDemon;
        const sign=SU_HEART_DEMON_DELTAS[eventId];
        if(sign) extra+=`<p style="font-size:11px;color:#d9b5ec">🌘 道心执念 ${sign>0?'+':''}${sign} · 当前 ${hd.attachment}/100</p>`;
        if(eventId==='second_choice' && !hd.broken){
          extra+=`<p style="color:#d9b5ec">🌅 多年执念在这一刻抵达尽头。你需要真正回答自己：变强，究竟是为了谁？</p>`;
          nextAction={text:'🌅 直面心魔',action:'heart_demon_breakthrough'};
        }
      }
      if(choice.distantV286827&&eventId==='second_choice')nextAction={text:'以知己相待，继续修行',action:'romance_npc',npcId};
      const milestone=npcId===MAIN_HEROINE_ID?`<p style="font-size:11px;color:#d8c6aa">关系阶段：${getRomanceStage(r.affection,false,npcId)} · 七段主线 ${getSuReunionCount()}/7</p>`:'';
      autoSave();
      showStory(`<p style="color:${npc.color};font-weight:bold">【${ev.title}】</p><p>${relationshipTextV286827(choice.reply)}</p><p style="color:#ffb6c9">💗 好感 +${gain}（${r.affection}/100）</p>${milestone}${extra}`,[nextAction]);
    }

    function triggerEndingChoice() {
      const r=player.romance?.npcs?.[MAIN_HEROINE_ID];
      const completed=!!r && SU_REUNION_EVENT_IDS.every(id=>r.events.includes(id));
      if(!completed || r.affection<85 || !hasReachedRealm(6) || player.storyProgress<5){
        showStory('<p>你们的缘分还需要更多时间和真心来浇灌。</p><p style="color:#aaa">需要七段主线全部完成、好感≥85、至少炼虚境，并推进至第五章。</p>',[{text:'返回',action:'romance_npc',npcId:MAIN_HEROINE_ID}]);
        return;
      }
      if(player.romanceProgress.endingChosen){
        const ended=player.romanceProgress.endingType==='reunion'?'你们已经重新选择彼此。':'你们已经坦诚告别，各自安好。';
        showStory(`<p>${ended}</p>`,[{text:'返回',action:'romance_npc',npcId:MAIN_HEROINE_ID}]);return;
      }
      showStory(`
        <p style="color:#ffd700;font-size:20px;font-weight:bold">❤️ 最终抉择 · 青石桥</p>
        <p>你站在当年分开的地方，苏晚晴就在桥的另一头。她已经把旧木牌重新放回你掌心。</p>
        <p style="color:#aaa">风很轻，桥下的水依旧缓缓流淌。</p>
        <p style="color:#d8c6aa">你想起了这一路仙途：无数次生死绝境，无数次登高望远；她也终于承认，当年的选择并非无情，而是恐惧与年少无力。</p>
        <p style="color:#ffb6c9">如今，你们都已成为完整独立的自己。旧伤没有消失，但已经不再替你们决定未来。</p>
        <p style="color:#ffd700;font-weight:bold">现在，请你选择：</p>
      `,[
        {text:'❤️ 牵住她的手 —— “余生，一起走”',action:'ending_reunion',story:true},
        {text:'🌅 放手，各自安好 —— “爱过、错过、放过”',action:'ending_release',story:true}
      ]);
    }

    function endingReunion() {
      if(player.romanceProgress.endingChosen) return triggerEndingChoice();
      if(!SU_REUNION_EVENT_IDS.every(id=>player.romance.npcs[MAIN_HEROINE_ID].events.includes(id))||player.romance.npcs[MAIN_HEROINE_ID].affection<85||player.level<6||player.storyProgress<5)return triggerEndingChoice();
      player.romanceProgress.endingChosen=true; player.romanceProgress.endingType='reunion';
      player.romance.partner=MAIN_HEROINE_ID;
      const r=player.romance.npcs[MAIN_HEROINE_ID]; r.affection=100;
      player.exp+=1000; player.gold+=2000; player.sectContribution=(player.sectContribution||0)+100; player.sectTotalContribution=(player.sectTotalContribution||0)+100;
      player.heartDemon.broken=true; player.heartDemon.attachment=0; player.romanceProgress.heartDemonResolved=true;
      player.suwanqingHidden.trueAffection=100;
      checkLevelUp(); unlockAchievement('reunion_complete'); autoSave();
      showStory(`
        <p style="color:#ffd700;font-size:22px;font-weight:bold">🌸 圆满结局 · 破尘归心</p>
        <p style="color:#ffb6c9;font-size:16px">「无人回头重走年少路，但有情人终可共赴余生途。」</p>
        <p>青石桥上，你握住她的手。苏晚晴没有回避，眼眶微红，却笑了：</p>
        <p style="color:#ffd700;font-weight:bold">“好。这次谁都别替对方决定未来。”</p>
        <p style="color:#aaa">你们不是回到当初，是从今天开始重新认识彼此。从前各自泥泞独行，此后岁岁朝夕并肩。</p>
        <p style="color:#69f0ae">💗 修为 +1000 · 灵石 +2000 · 宗门贡献 +100</p>
        <p style="color:#69f0ae">🏅 达成成就：【情断再续】</p>
      `,[{text:'🌙 次日 · 顾承渊来访',action:'rival_exit',story:true}]);
    }

    function rivalSteppedBack() {
      if(player.rivalState.hasExited) return showRomanceNpc(MAIN_HEROINE_ID);
      if(player.romance.partner!==MAIN_HEROINE_ID) return showRomanceNpc(MAIN_HEROINE_ID);
      player.rivalState.phase='stepped_back'; player.rivalState.hasExited=true; autoSave();
      showStory(`
        <p style="color:#b8c7e8;font-weight:bold">【顾承渊 · 体面退场】</p>
        <p>深夜，顾承渊独自登门。他仍是一身素衣，神色平静，眼中却有一种坦荡的释然。</p>
        <p style="color:#b8c7e8">“我心悦她，从未作假。”</p>
        <p style="color:#b8c7e8">“但我知，她心中之人，从来不是我。”</p>
        <p style="color:#b8c7e8">“既得真心归属，我便不再打扰。”</p>
        <p>他放下手中的月魄兰，转身离去。</p>
        <p style="color:#aaa">那一夜，你没有追上去。有些人的退场，不需要挽留，只需要尊重。</p>
      `,[{text:'目送他离去，心中默默道谢',action:'romance'}]);
    }

    function endingRelease() {
      if(player.romanceProgress.endingChosen) return triggerEndingChoice();
      player.romanceProgress.endingChosen=true; player.romanceProgress.endingType='release';
      player.romance.partner=null; player.heartDemon.broken=true; player.heartDemon.attachment=0; player.romanceProgress.heartDemonResolved=true;
      player.exp+=500; player.gold+=500; checkLevelUp(); unlockAchievement('release_complete'); autoSave();
      showStory(`
        <p style="color:#8ab4f8;font-size:22px;font-weight:bold">🌅 留白结局 · 山河各安</p>
        <p style="color:#b8c7e8;font-size:16px">「年少情断于青石桥，半生释然于仙途巅。」</p>
        <p>你收回了伸出的手，不是不爱，是爱过之后，选择放过。</p>
        <p style="color:#d8c6aa">苏晚晴沉默很久，最终点头，眼中没有怨恨，只有释然：</p>
        <p style="color:#ffb6c9">“我明白了。你终于不再是当年那个需要证明自己的少年了。你已是你自己。”</p>
        <p style="color:#aaa">你们坦诚所有过往，解开所有心结。承认彼此当年身不由己，也承认彼此曾经深爱过。</p>
        <p style="color:#8ab4f8">从此山河辽阔，各自安好。不负过往，不负道心。</p>
        <p style="color:#69f0ae">💗 心境突破：修为 +500 · 灵石 +500</p>
        <p style="color:#69f0ae">🏅 达成成就：【道心释然】</p>
      `,[{text:'独行仙途，无愧于心',action:'romance'}]);
    }

    function jiReadyV2796(partner=false){
      const r=player.romance?.npcs?.jihongling;
      if(!r || !hasReachedRealm(2) || Number(player.age||18)<18)return false;
      if(partner)return player.romance.partner==='jihongling' && r.affection>=90;
      return !player.romance.partner && r.affection>=80 && ROMANCE_NPCS.jihongling.events.every(e=>r.events.includes(e.id));
    }

    function jiConfessV2796(confirm=false){
      if(!jiReadyV2796())return showRomanceNpc('jihongling');
      if(!confirm)return showStory('<p>❤️ 红绫定情</p><p>你认真说出心意。姬红绫将红绫绕在你们相握的手上，收起了惯常的玩笑。</p><p>“我心悦你。不是一时兴起，也不是要你还人情。往后山高水远，你愿意和我一起走吗？”</p>',[{text:'牵住她的手：“我愿意。”',action:'ji_commit',story:true},{text:'我想再认真想想',action:'romance_npc',npcId:'jihongling'}]);
      player.romance.partner='jihongling';addAffection('jihongling',10);player.exp+=80;checkLevelUp();autoSave();
      showStory('<p>❤️ 情侣关系确立 · 姬红绫</p><p>她笑着与你十指相扣：“那就说好了。吵架要好好说，想念也不许藏着。”</p><p>从此，你们既是恋人，也是同行仙途的道侣。</p><p>修为 +80；解锁情侣夜话。</p>',[{text:'和她再待一会儿',action:'romance_npc',npcId:'jihongling'}]);
    }

    function jiEveningV2796(scene='invite'){
      if(!jiReadyV2796(true))return showStory('<p>红帐夜话需要：与姬红绫结为道侣、好感达到90，双方成年。</p>',[{text:'返回',action:'romance_npc',npcId:'jihongling'}]);
      const back={text:'回到她身边',action:'romance_npc',npcId:'jihongling'};
      if(scene==='invite')return showStory('<p>🌙 红帐夜话</p><p>客舍临江，灯船从窗下缓缓驶过。姬红绫放下短刃，主动迎过来，将你的手拢在掌心：“在外面陪你看了半天江湖，现在，轮到你陪陪我了。”</p><p>她笑着拉你坐到窗边，却没有立刻松手：“从前总笑别人等人，如今听见楼下脚步声，我也会猜是不是你。”</p><p>说到这里，她认真望向你：“今晚愿意留下吗？我想多和你待一会儿。若只想赏月聊天，也很好。”</p>',[{text:'留下，与她相拥',action:'ji_night',story:true},{text:'一起赏月，说说往事',action:'ji_moon',story:true},back]);
      if(scene==='moon')return showStory('<p>🌙 月下并肩</p><p>你说想再听听她从前的游历。姬红绫欣然点头，将一杯热茶递给你：“好啊。不过今夜的故事，可不许听到一半就走神。”</p><p>你们从仙市初见聊到下次远行。她偶尔故意夸大自己的战绩，被你拆穿后便笑着碰一下你的肩。</p><p>月亮西沉，她才依依不舍地松开你的手：“今晚很开心。下回换你讲，我也认真听。”她送你到门口，与你道声好梦。</p>',[back]);
      if(scene!=='night')return showRomanceNpc('jihongling');
      const r=player.romance.npcs.jihongling;
      if(!r.events.includes('ji_private_evening')){r.events.push('ji_private_evening');autoSave();}
      showStory('<p>🏮 红帐微灯</p><p>“我愿意。”听见你的回答，姬红绫眼里有了笑意。她张开双臂，你迎上前，将她拥在怀里。</p><p>“平日我说十句，你才肯认真回一句。”她抬头望着你，“这一句，我可记住了。”</p><p>她轻声问能不能吻你。你点头回应，她主动吻了你，又有些不好意思地笑起来：“不许笑我。我也是头一回，这样喜欢一个人。”</p><p>你告诉她，自己也一样。她靠在你肩上，两人说起往后想去的城、想看的雪，连寻常的一日三餐也有了值得期待的模样。</p><p>夜深，你们再次确认都愿意留下相伴。她握紧你的手：“那就明早见，往后也见。”灯火渐暗，帷帐落下，画面缓缓淡出。</p><p>🌅 次日清晨</p><p>茶香将你唤醒。姬红绫坐在窗边，见你醒来便扬了扬手里的早点：“江湖第一等大事，先把早饭吃了。”</p><p>你走过去，她把温热的茶杯推到你面前，笑意里多了一份安定：“以前我觉得，停下来就不自在。现在才知道，原来和喜欢的人过寻常日子，也很好。”</p><p>出门前，她主动牵起你的手：“走吧。今日的江湖，还是我们一起。”</p><p style="color:#aaa">已收录这段共同回忆，可再次阅读；无数值奖励。</p>',[back]);
    }

    function confessRomance(npcId) {
      const npc=ROMANCE_NPCS[npcId], r=player.romance.npcs[npcId];
      if(!npc||!r)return;
      if(npcId==='jihongling'){jiConfessV2796(false);return;}
      if(npcId===MAIN_HEROINE_ID){ triggerEndingChoice(); return; }
      if(player.romance.partner){showRomanceNpc(npcId);return;}
      if(r.affection<80 || !hasReachedRealm(2)){
        showStory(`<p>你觉得现在还不是说出口的时候。</p><p style="color:#aaa">需要好感达到80，并至少达到筑基境。</p>`,[{text:'返回',action:'romance_npc',npcId}]);return;
      }
      player.romance.partner=npcId; addAffection(npcId,10); player.exp+=80; checkLevelUp(); autoSave();
      showStory(`<p style="color:#ffb6c9;font-size:17px;font-weight:bold">❤️ 缘定仙途</p><p>你终于向 <b>${npc.name}</b> 说出了心意。</p><p>${npc.name} 没有避开你的目光。</p><p>“既然如此，那往后的路，就一起走吧。”</p><p style="color:#ffd700">结为道侣 · 修为 +80</p>`,[{text:'回到姻缘亭',action:'romance'}]);
    }

    // 家具效果计算
    function calculateFurnitureBonus() {
      const bonus = { exp: 0, gold: 0, atk: 0, def: 0, desc: '' };
      const descs = [];
      
      bonus.exp=Math.max(0,(Number(player.home?.level)||1)-1)*.05;
      if(bonus.exp)descs.push(`洞府修炼+${Math.round(bonus.exp*100)}%（等级）`);
      const seen=new Set();
      for (const f of player.home?.furniture||[]) {
        if(!f||f.active===false||seen.has(f.name))continue;
        seen.add(f.name);
        switch(f.type) {
          case 'exp': bonus.exp += f.value; descs.push(`修为+${f.value * 100}%`); break;
          case 'gold': bonus.gold += f.value; descs.push(`战斗基础灵石+${Math.round(f.value * 100)}%`); break;
          case 'atk': bonus.atk += f.value; descs.push(`攻击+${f.value}`); break;
          case 'def': bonus.def += f.value; descs.push(`防御+${f.value}`); break;
        }
      }
      
      bonus.desc = descs.join('、');
      return bonus;
    }
    
    function showVillage() {
      let choices=[{text:'📜 三万年仙魔战 · 战事总览',action:'ancient_war_v2859',story:true},{text:'💰 赚取灵石（补助 / 跑腿 / 回收）',action:'early_economy_v2773'},{text:'🗺️ 前往其他地域',action:'world_travel_menu',story:true},{text:'🏪 杂货铺',action:'shop'},{text:'⚔️ 南域历练',action:'explore'},{text:'🏪 仙市',action:'market'},{text:'🏠 我的洞府',action:'home',condition:()=>hasReachedRealm(1)},{text:'💗 姻缘亭（感情线）',action:'romance',story:true},{text:'💤 灵泉休息',action:'rest'}];
      if(player.storyProgress>=3||hasReachedRealm(2))choices.push({text:'🌑 幽冥谷（特殊秘境）',action:'youmingu',story:true});
      const storyEvent=getStoryEvent();if(storyEvent)choices.unshift({text:`📜 当前主线：${storyEvent.title}`,action:'story_event',chapterId:storyEvent.id,story:true});
      if(storyEvent&&storyEvent.boss&&!player.bossesDefeated.includes(storyEvent.boss))choices.unshift({text:storyEvent.boss==='宗门试炼守将'?`👹 挑战【${storyEvent.boss}】（试炼阵法压制）`:`👹 挑战【${storyEvent.boss}】`,action:'boss_fight',bossName:storyEvent.boss,boss:true});
      if(hasReachedRealm(9,3)&&!player.tribulationAttempted&&player.storyProgress>=6)choices.unshift({text:'⚡ 挑战飞升天劫（渡劫圆满）',action:'tribulation',tribulation:true});
      const text=buildAreaSceneCard({icon:'🏘️',title:'南域 · 青云村',subtitle:`📅 ${getGameDateLabel()} · 起点聚落`,desc:'村口驿道、百宝阁、中央村舍、仙市、洞府与灵泉按用途分区，路线更容易理解。',accent:'#ffd98a',chips:['南域驿道','新手聚落','补给起点'],info:'推荐：先补给 → 再历练 → 之后再去仙市与洞府。'})+
        buildAreaLayout('村落布局',[{name:'村口驿道',desc:'跨地域远行入口。'},{name:'百宝阁西街',desc:'靠近入口，优先补给。'},{name:'中央村舍',desc:'聚落核心与任务中转。'},{name:'东南仙市',desc:'承担中期消费与稀有商品。'}])+
        buildInteriorStrip('村中分区',[{icon:'🧺',name:'百宝阁柜台',desc:'丹药、兵器与灵材。'},{icon:'🏮',name:'仙市主街',desc:'套装、法宝与家具。'},{icon:'🏠',name:'洞府坡道',desc:'远离主街，更适合闭关。'},{icon:'💧',name:'灵泉歇脚点',desc:'战后快速恢复。'}]);
      showStory(text+rainVillageV286822(),choices);
    }

    const GENERAL_SHOP_V2801=[{"name":"小还丹","cost":30,"level":0,"category":"pill","store":"auto"},{"name":"大还丹","cost":80,"level":0,"category":"pill","store":"auto"},{"name":"聚灵丹","cost":40,"level":0,"category":"pill","store":"auto"},{"name":"铁剑","cost":100,"level":0,"category":"gear","store":"auto"},{"name":"铁甲","cost":120,"level":0,"category":"gear","store":"auto"},{"name":"精钢剑","cost":300,"level":2,"category":"gear","store":"auto"},{"name":"灵剑","cost":800,"level":2,"category":"gear","store":"auto"},{"name":"灵甲","cost":600,"level":2,"category":"gear","store":"auto"},{"name":"灵草","cost":20,"level":0,"category":"material","store":"materials"},{"name":"仙果","cost":40,"level":0,"category":"material","store":"materials"},{"name":"妖丹","cost":100,"level":0,"category":"material","store":"materials"},{"name":"灵兽丹","cost":50,"level":0,"category":"pet","store":"petMaterials"},{"name":"灵兽绳","cost":50,"level":0,"category":"pet","store":"auto"},{"name":"缚灵玉","cost":200,"level":0,"category":"pet","store":"auto"},{"name":"御灵葫芦","cost":500,"level":0,"category":"pet","store":"auto"},{"name":"魔缚索","cost":300,"level":2,"category":"pet","store":"auto"},{"name":"神兽结缘印","cost":2000,"level":3,"category":"pet","store":"auto"},{"name":"平等契约符","cost":800,"level":2,"category":"pet","store":"auto"},{"name":"本命契约石","cost":1500,"level":3,"category":"pet","store":"auto"}];
    function generalOwnedV2801(item){
      if(item.store!=='auto')return Number(player[item.store]?.[item.name])||0;
      if(EQUIPMENT_DB[item.name])return (player.equipmentInventory||[]).filter(n=>n===item.name).length+Object.values(player.equipment||{}).filter(n=>n===item.name).length;
      return (player.inventory||[]).filter(n=>n===item.name).length;
    }
    function showShop(category='pill',notice='') {
      const tabs={pill:'丹药补给',gear:'基础装备',material:'常用灵材',pet:'灵宠用品'};
      if(!tabs[category]||gameState==='combat'||gameState==='combat-ending')return;
      let html=`<section class="market-hub-v2800"><span class="market-kicker-v2800">青云村 · 日常补给</span><h3>🧺 青云杂货铺</h3><p>灵石 <b>${player.gold}</b> · ${tabs[category]}</p><div class="market-filters-v2800">`;
      for(const [id,title] of Object.entries(tabs))html+=`<button type="button" aria-pressed="${category===id}" onclick="showShop('${id}')">${title}</button>`;
      html+=`</div><p>${category==='pill'?'补充气血与灵力，购买后到物品栏使用。':category==='gear'?'基础过渡装备；成套装备请前往仙市。':category==='material'?'用于炼制、宗门任务及赠礼。': '灵兽丹用于培养；捕捉与契约道具按各自条件使用。'}</p></section>`;
      if(notice)html+=`<p class="shop-notice-v2801" role="status">${notice}</p>`;
      for(const [index,item] of GENERAL_SHOP_V2801.entries()){
        if(item.category!==category)continue;
        const d=EQUIPMENT_DB[item.name],allowed=hasReachedRealm(item.level),desc=item.name==='灵兽丹'?'宠物经验 +20':ITEMS[item.name]?.desc||d?.desc||({灵草:'炼丹、宗门捐献与赠礼材料',仙果:'宗门差事与赠礼材料',妖丹:'炼制、宗门差事与赠礼材料'}[item.name])||'灵宠捕捉与契约用品';
        html+=`<article class="general-item-v2801"><div class="general-title-v2801"><b>${item.name}</b><span>持有 ${generalOwnedV2801(item)}</span></div><p>${desc}</p><div class="general-price-v2801">单价 <b>${item.cost}</b> 灵石${item.level>0?` · ${CULTIVATION_REALMS[item.level].name}可购买`:''}</div><div class="general-buy-v2801">`;
        for(const qty of category==='gear'?[1]:[1,5])html+=`<button type="button" ${!allowed||player.gold<item.cost*qty?'disabled':''} onclick="buyGeneralV2801(${index},${qty})">${!allowed?'境界未达标':`买 ${qty} 件 · ${item.cost*qty} 灵石`}</button>`;
        if(allowed&&player.gold<item.cost)html+=`<span>还差 ${item.cost-player.gold} 灵石</span>`;
        html+='</div></article>';
      }
      showStory(html,[{text:'🏮 前往仙市 · 套装与稀有商品',action:'market'},{text:'💰 赚取灵石 / 材料回收',action:'early_economy_v2773'},{text:'← 返回青云村',action:'village'}]);
    }
    function buyGeneralV2801(index,qty=1){
      if(gameState==='combat'||gameState==='combat-ending'||!Number.isInteger(index)||!Number.isInteger(qty))return;
      const item=GENERAL_SHOP_V2801[index];if(!item||![1,5].includes(qty)||(item.category==='gear'&&qty!==1))return;
      if(!hasReachedRealm(item.level)||player.gold<item.cost*qty)return;
      if(item.category==='gear'&&!confirmGearPurchaseV2804(item.name,item.cost*qty,qty))return;
      player.gold-=item.cost*qty;
      if(item.store!=='auto'){player[item.store]||={};player[item.store][item.name]=(Number(player[item.store][item.name])||0)+qty;}
      else{const bucket=EQUIPMENT_DB[item.name]?'equipmentInventory':'inventory';player[bucket]||=[];for(let i=0;i<qty;i++)player[bucket].push(item.name);}
      autoSave();updateStats();showShop(item.category,`已购买 ${item.name} ×${qty}，花费 ${item.cost*qty} 灵石。`);
    }

    function showExplore() {
      showStory(`
        <p>📍 <b>野外</b></p>
        <p>你来到村庄外的荒野，四周草木丛生。</p>
        <p>远处似乎有什么在移动...</p>
      `, [
        { text: '🌲 深入探索', action: 'random_encounter' },
        { text: '← 返回村庄', action: 'village' }
      ]);
    }
    
    function showMountain() {
      showStory(`
        <p>📍 <b>后山禁地</b></p>
        <p>云雾缭绕的山峰，传说有高人曾在此修炼。</p>
        <p>一股强大的气息从山顶传来...</p>
      `, [
        { text: '🏔️ 登山探索', action: 'mountain_encounter' },
        { text: '← 返回北域地图', action: 'return_to_map' }
      ]);
    }
    
    // ================== 宗门玩法：任务 / 职位 / 藏经阁 / 贡献商店 ==================
    function getSectTaskCount(template) {
      if (!template) return 1;
      if (template.type === 'combat') return Math.max(1, Number(template.killTarget) || 3);
      if (template.goldCost) return Math.max(1, Number(template.goldCost) || 200);
      if (template.materials) return Math.max(1, Number(Object.values(template.materials)[0]) || 1);
      return 1;
    }

    function formatSectTaskDesc(template) {
      return String(template?.desc || '').replace('{count}', getSectTaskCount(template));
    }

    function getRankInfoForContribution(totalContribution=0, owner=player) {
      let rank = SECT_RANKS[0];
      for (const r of SECT_RANKS) {
        if (totalContribution >= r.contributionRequired && (r.name!=='宗主'||owner?.sectPromotion?.inherited===true)) rank = r;
      }
      return rank;
    }

    function getCurrentRankInfo() {
      return getRankInfoForContribution(player?.sectTotalContribution || 0);
    }

    function hasRank(rankName) {
      const currentIndex = SECT_RANKS.findIndex(r => r.name === getCurrentRankInfo().name);
      const targetIndex = SECT_RANKS.findIndex(r => r.name === rankName);
      return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
    }

    function generateSectTask(templateId=null) {
      const template = templateId===null?SECT_TASK_TEMPLATES[Math.floor(Math.random() * SECT_TASK_TEMPLATES.length)]:SECT_TASK_TEMPLATES.find(t=>t.id===templateId);
      if(!template)return null;
      const count = getSectTaskCount(template);
      return {
        templateId: template.id,
        template: { ...template, materials: template.materials ? { ...template.materials } : undefined },
        progress: 0,
        completed: false,
        desc: formatSectTaskDesc(template),
        count
      };
    }

    function acceptSectTask(templateId=null) {
      if(!sectCanManageV2866())return;
      if (player.sectTasks.some(t => !t.completed)) {
        showStory('你已有未完成的宗门任务，请先完成当前任务。', [{text:'返回宗门任务', action:'sect_tasks'}]);
        return;
      }
      if(templateId!==null&&!SECT_TASK_TEMPLATES.some(t=>t.id===templateId))return;
      // 当前只保留少量最近记录，避免存档无限增大。
      player.sectTasks = player.sectTasks.filter(t => t.completed).slice(-3);
      const task = generateSectTask(templateId);
      player.sectTasks.push(task);
      autoSave();
      const guide=getSectTaskGuide(task);
      const realIndex=player.sectTasks.indexOf(task);
      showStory(`<p>📜 <b>已接取宗门任务</b></p>${getSectTaskGuideHtml(task)}<p style="font-size:11px;color:#aaa">任务已经加入追踪列表。你可以随时从宗门大殿 → 宗门任务查看详细进度。</p>`, [
        {text:`🧭 追踪目标：${guide.poiName}`, action:'sect_task_navigate', taskIndex:realIndex},
        {text:'📋 查看完整任务指引', action:'sect_tasks'},
        {text:'返回宗门大殿', action:'sect_hall'}
      ]);
    }

    function showSectTasks() {
      if(!sectCanManageV2866())return;
      const active = player.sectTasks.filter(t => !t.completed);
      const completed = player.sectTasks.filter(t => t.completed).slice(-3);
      let html = `<p>📜 <b>宗门任务 · 详细指引</b></p>
        <p style="color:#aaa;font-size:12px">这里会显示任务目标、当前持有/击杀进度、真实获取方式和推荐地点。完成任务可获得可消费贡献，同时累计宗门资历用于职位晋升。</p>`;
      if (!active.length) html += `<div style="padding:12px;border:1px dashed rgba(255,255,255,.18);border-radius:8px;color:#aaa">当前没有进行中的任务。领取任务后，这里会直接告诉你“去哪、打什么、还差多少”。</div>`;
      for (const task of active) html += getSectTaskGuideHtml(task);
      if (completed.length) {
        html += `<p style="font-size:11px;color:#999;margin-top:10px">最近完成：${completed.map(t=>`✅ ${t.template.name}`).join('　')}</p>`;
      }
      html+=jevEntryV2846('jevElderV2849()','Jev 执事安排合适的任务');
      const choices = [];
      active.forEach(task => {
        const realIndex = player.sectTasks.indexOf(task);
        const p=getSectTaskProgressInfo(task), guide=getSectTaskGuide(task);
        choices.push({text:`🧭 追踪：${guide.poiName}`, action:'sect_task_navigate', taskIndex:realIndex});
        if (task.template.type === 'combat') {
          choices.push({text:`⚔️ 查看击杀规则（${task.progress}/${task.count}）`, action:'sect_task_submit', taskIndex:realIndex});
        } else {
          choices.push({text:p.ready?`✅ 提交【${task.template.name}】`:`📤 尝试提交【${task.template.name}】`, action:'sect_task_submit', taskIndex:realIndex});
        }
      });
      choices.push({text:'📋 领取新任务', action:'sect_task_accept', condition:()=>!player.sectTasks.some(t=>!t.completed)});
      choices.push({text:'← 返回宗门大殿', action:'sect_hall'});
      showStory(html, choices);
    }

    function updateSectTaskProgress(index) {
      if(!sectCanManageV2866())return;
      const task = player.sectTasks[index];
      if (!task || task.completed) return showSectTasks();
      const template = task.template;
      const guide=getSectTaskGuide(task), p=getSectTaskProgressInfo(task);
      if(template.type!=='combat'&&p.ready){
        const costs=template.goldCost?`${template.goldCost} 灵石`:Object.entries(template.materials||{}).map(([name,n])=>`${name} ×${n}`).join('、');
        if(costs&&!window.confirm(`提交 ${template.name}？消耗 ${costs}。`))return;
      }
      if (template.type === 'combat') {
        showStory(`<p>⚔️ <b>${template.name}</b></p>${getSectTaskGuideHtml(task)}
          <p style="color:#aaa;font-size:12px">计数规则：地图实体普通怪和普通试炼怪胜利后自动 +1；首领、天劫、百年宗门大比对手不计入。无需回宗门手动登记。</p>`, [
          {text:`🧭 前往${guide.poiName}`,action:'sect_task_navigate',taskIndex:index},
          {text:'返回任务', action:'sect_tasks'}
        ]);
        return;
      }
      if (template.type === 'collect' || (template.type === 'donate' && template.materials)) {
        const materials = template.materials || {};
        const missing = Object.entries(materials).filter(([mat,count]) => (player.materials[mat] || 0) < count);
        if (missing.length) {
          const need = missing.map(([mat,count])=>`${mat}：当前 ${player.materials[mat]||0} / 需要 ${count}，还差 ${Math.max(0,count-(player.materials[mat]||0))}`).join('、');
          return showStory(`<p>❌ <b>暂时无法提交</b></p>${getSectTaskGuideHtml(task)}<p style="color:#ffb6b6">${need}</p>`, [
            {text:`🧭 前往${guide.poiName}`,action:'sect_task_navigate',taskIndex:index},
            {text:'返回任务', action:'sect_tasks'}
          ]);
        }
        for (const [mat,count] of Object.entries(materials)) {
          player.materials[mat] -= count;
          if (player.materials[mat] <= 0) delete player.materials[mat];
        }
        task.progress = task.count;
        task.completed = true;
        completeSectTask(task);
        return;
      }
      if (template.type === 'donate' && template.goldCost) {
        if (player.gold < template.goldCost) {
          const short=template.goldCost-player.gold;
          return showStory(`<p>❌ <b>灵石不足</b></p>${getSectTaskGuideHtml(task)}<p style="color:#ffb6b6">当前 ${player.gold} 灵石，还差 ${short} 灵石。</p>`, [
            {text:'返回任务', action:'sect_tasks'}
          ]);
        }
        player.gold -= template.goldCost;
        task.progress = task.count;
        task.completed = true;
        completeSectTask(task);
      }
    }

    function completeSectTask(task, options={}) {
      if(!task||task._rewardClaimedV2768)return;
      task._rewardClaimedV2768=true;
      player.sectPromotion=normalizePromotionV2768(player.sectPromotion);
      player.sectPromotion.tasksCompleted++;
      const template = task.template;
      const beforeRank = getCurrentRankInfo().name;
      player.sectContribution += template.contributionReward;
      player.sectTotalContribution = Math.max(player.sectTotalContribution || 0, 0) + template.contributionReward;
      player.exp += template.expReward;
      if (template.goldReward) player.gold += template.goldReward;
      const newRank = getCurrentRankInfo().name;
      player.sectRank = newRank;
      checkLevelUp();
      updateStats();
      autoSave();
      const rewardText = `贡献 +${template.contributionReward}，修为 +${template.expReward}${template.goldReward ? '，灵石 +'+template.goldReward : ''}`;
      if (options.silent) return { rewardText, promoted:newRank !== beforeRank, newRank };
      const rankText = newRank !== beforeRank ? `<br><b style="color:#ffd700">恭喜晋升为【${newRank}】！</b>` : '';
      showStory(`🎉 任务完成！<br>${rewardText}${rankText}`, [{text:'继续', action:'sect_tasks'}]);
      return { rewardText, promoted:newRank !== beforeRank, newRank };
    }

    function addSectKill() {
      const tasks = player.sectTasks.filter(t => !t.completed && t.template?.type === 'combat');
      for (const task of tasks) {
        task.progress = Math.min(task.count, task.progress + 1);
        addCombatLog?.(`📜 宗门任务【${task.template.name}】进度 ${task.progress}/${task.count}`, 'gold');
        if (task.progress >= task.count) {
          task.completed = true;
          const result = completeSectTask(task, {silent:true});
          addCombatLog?.(`🎉 宗门任务完成：${result.rewardText}${result.promoted ? `，晋升【${result.newRank}】` : ''}`, 'gold');
        }
      }
    }

    // ================== 宗门战争玩法 ==================
    function calculateSectPower(sectName) {
      const info = HUMAN_FACTION_POWER[sectName] || DEMON_FACTION_POWER[sectName] || IMMORTAL_FACTION_POWER[sectName] || {basePower:80,special:'未知传承',icon:'🏳️'};
      if(isFactionDestroyed(sectName)) {
        return {total:0,rawTotal:0,basePower:0,playerBonus:0,contributionBonus:0,discipleBonus:0,realmBonus:0,globalMultiplier:0,regionMultiplier:1,regionDesc:'势力已覆灭',special:info.special||'',icon:info.icon||'🏳️'};
      }
      const basePower=Number(info.basePower)||0;
      let playerBonus=0;
      if(sectName===player.sect) {
        playerBonus=Math.floor((player.level||0)*15+(player.phase||0)*5+getAtk()*.5);
        if(player.equipment?.weapon) playerBonus+=20;
        if(player.equipment?.robe||player.equipment?.armor) playerBonus+=15;
        if(player.activePet) playerBonus+=(Number(player.activePet.level)||1)*5;
        if(player.activeArtifact) playerBonus+=(Number(player.activeArtifact.level)||1)*8;
      }
      const contributionBonus=sectName===player.sect?Math.min(50,Math.floor((player.sectTotalContribution||0)/100)):0;
      const discipleBonus=sectName===player.sect?disciplePowerV2815():0;
      const realmBonus=sectName===player.sect?Math.floor(getRealmBasePower(player.level,player.phase).power/10):0;
      const rawTotal=basePower+playerBonus+contributionBonus+discipleBonus+realmBonus;
      const regionWar=sectName===player.sect?getRegionWarBonus():{multiplier:1,desc:'无区域修正'};
      let globalMultiplier=1;
      let globalDesc='';
      if(getFactionType(sectName)==='demon'&&isImmortalBlessingActive()) {
        globalMultiplier*=.70;
        globalDesc=`${player._immortalBlessingSource||'仙人宗门'}护界仙阵：界域稳固，魔族投射受到明显牵制`;
      }
      if(sectName===player.sect&&player._taisuiWarIntel) {
        globalMultiplier*=1.08;
        globalDesc+=(globalDesc?' · ':'')+'太岁书院战略推演：联军更易掌握敌情与战机';
      }
      const total=Math.max(0,Math.round(rawTotal*regionWar.multiplier*globalMultiplier));
      return {
        total,rawTotal,basePower,playerBonus,contributionBonus,discipleBonus,realmBonus,
        globalMultiplier,globalDesc,
        regionMultiplier:regionWar.multiplier,regionDesc:regionWar.desc,
        special:info.special||'',icon:info.icon||'🏳️'
      };
    }

    function getAvailableDemonTargets() {
      const demons=Object.keys(DEMON_FACTION_POWER).filter(d=>!isFactionDestroyed(d));
      if(player.warState?.status===WAR_STATUS.BATTLE&&player.warState.enemy) return demons.filter(d=>d!==player.warState.enemy);
      return demons;
    }

    function getAvailableAllies() {
      return Object.keys(HUMAN_FACTION_POWER).filter(h=>h!==player.sect&&!isFactionDestroyed(h)&&!player.warState.alliedSects.includes(h));
    }

    function showWarTargetList() {
      let html = `<p>⚔️ <b>选择宣战目标</b></p><p style="color:#aaa">三界势力的真实底蕴不会以数值公开。以下判断只来自宗门旧档、边境传闻与近年交锋记录。</p>`;
      const choices = getAvailableDemonTargets().map(t=>({
        text:`${DEMON_FACTION_POWER[t].icon} ${t} · ${getFactionPublicTierLabel(getFullFactionInfo(t)?.tier)} · ${DEMON_FACTION_POWER[t].special}`,
        action:'declare_war', demonFaction:t, story:true
      }));
      choices.push({text:'← 返回宗门大殿',action:'sect_hall'});
      showStory(html,choices);
    }

    function getImmortalWarSupportV2807(){
      const w=player.warState;
      if(!w?.immortalSupport)return 0;
      const name=w.immortalAlly;
      if(getFactionType(name)!=='immortal'||name==='太岁书院'||isFactionDestroyed(name))return 0;
      return Math.round(getFactionWorldBasePower(name)*.35);
    }

    function declareWar(demonFaction) {
      if(gameState==='combat') return;
      if(player.warState?.campaignV2775) return showWarCampaignV2775();
      if (player.warState.warCooldown > 0) {
        return showStory(`战争冷却中，还需 ${player.warState.warCooldown} 天才能再次发起战争。`,[{text:'返回宗门大殿',action:'sect_hall'}]);
      }
      if (player.warState.status === WAR_STATUS.BATTLE) {
        return showStory('当前已有战争进行中！',[{text:'返回宗门大殿',action:'sect_hall'}]);
      }
      if (!DEMON_FACTION_POWER[demonFaction] || isFactionDestroyed(demonFaction)) return showStory('目标势力不存在或已经覆灭。',[{text:'返回宗门大殿',action:'sect_hall'}]);
      player.warState.enemy = demonFaction;
      const ourPower=calculateSectPower(player.sect), enemyPower=calculateSectPower(demonFaction);
      let allyPower=0;
      for (const ally of player.warState.alliedSects) allyPower += calculateSectPower(ally).total;
      const immortalBonus = getImmortalWarSupportV2807();
      const totalOurPower=ourPower.total+allyPower+immortalBonus;
      showWarPreview(demonFaction,ourPower,enemyPower,allyPower,immortalBonus,totalOurPower/Math.max(1,enemyPower.total));
    }

    function showWarPreview(demonFaction, ourPower, enemyPower, allyPower, immortalBonus, ratio) {
      const enemyInfo=DEMON_FACTION_POWER[demonFaction];
      const outlook=getWarOutlook(ratio);
      const allyText=player.warState.alliedSects.length ? `🤝 已获盟友：${player.warState.alliedSects.join('、')}` : '🤝 暂无盟友同行';
      const immortalText=player.warState.immortalSupport ? `✨ ${player.warState.immortalAlly || '仙人宗门'}已答应有限度支援` : '✨ 尚无仙门直接支援';
      const html=`
        <p style="font-size:18px;font-weight:bold">⚔️ 宣战：${enemyInfo.icon} ${demonFaction}</p>
        <div style="border:1px solid rgba(255,215,0,.3);border-radius:8px;padding:10px;margin:10px 0">
          <p><b>${player.sect}</b>：<span style="color:#7ec9ff">${getFactionPublicStrengthHint(player.sect)}</span></p>
          <p><b>${enemyInfo.icon} ${demonFaction}</b>：<span style="color:#ffb0b0">${getFactionPublicStrengthHint(demonFaction)}</span></p>
          <p style="font-size:11px;color:#c7d7e8">🗺️ ${ourPower.regionDesc || '地利未见明显偏向'}</p>
          ${ourPower.globalDesc?`<p style="font-size:11px;color:#d9e8ff">✨ ${ourPower.globalDesc}</p>`:''}
          ${enemyPower.globalDesc?`<p style="font-size:11px;color:#69f0ae">🌌 ${enemyPower.globalDesc}</p>`:''}
          <p>${allyText}</p><p>${immortalText} · 支援战力 ${immortalBonus}</p><p style="font-size:12px;color:#d4c6a7">三族基础总量为仙5000、魔4000、人2000；援军投入其宗门基础战力的35%。实际胜负仍取决于本次参战力量和战术。</p>
          <p>📜 宗门判断：<b style="color:${outlook.color}">${outlook.name}</b></p>
          <p style="font-size:11px;color:#aaa">${outlook.desc}</p>
        </div><p style="color:#aaa">此判断并非绝对。开战后经历前哨、攻坚、决战三阶段，战术影响胜负；开战时锁定双方战力。小胜/大胜/全胜基础灵石为400/1000/2400，斩敌另有加成。战败损失8%灵石，最多500；战后冷却30天，撤军冷却7天。</p>`;
      showStory(html,[
        {text:`⚔️ 发动战争 · ${outlook.name}`,action:'execute_war',demonFaction,condition:()=>ratio>0.5},
        {text:'🤝 寻求人类宗门盟友',action:'find_allies',demonFaction},
        {text:'✨ 请求仙人宗门支援',action:'request_immortal',demonFaction,condition:()=>!player.warState.immortalSupport && getWarLevel()>=2},
        {text:'← 返回宗门大殿',action:'sect_hall'}
      ]);
    }

    // 三阶段宗门会战：无额外渲染循环，进度随原存档保存。
    const WAR_TACTICS_V2775=[
      {name:'稳守反击',hint:'克制敌军强攻'},
      {name:'侧翼迂回',hint:'克制敌军固守'},
      {name:'集中突击',hint:'克制敌军分兵'}
    ];
    const WAR_STAGES_V2775=['前哨争夺','山门攻坚','决战收阵'];
    const WAR_REPORTS_V2775=['敌军集结强攻，前锋来势凶猛。','敌军依托阵地固守，正面防线严密。','敌军分兵扰袭，主阵兵力分散。'];
    let warClickAtV2775=0;
    function executeWar(demonFaction) {
      if(gameState==='combat'||!player.sect||!player.warState) return;
      const w=player.warState;
      if(w.campaignV2775) return showWarCampaignV2775();
      if(w.warCooldown>0||w.status===WAR_STATUS.BATTLE||!DEMON_FACTION_POWER[demonFaction]||isFactionDestroyed(demonFaction)) return showSectHall();
      const allies=[...new Set(w.alliedSects)].filter(n=>HUMAN_FACTION_POWER[n]&&n!==player.sect&&!isFactionDestroyed(n));
      w.alliedSects=allies;
      const our=calculateSectPower(player.sect).total+allies.reduce((n,a)=>n+calculateSectPower(a).total,0)+getImmortalWarSupportV2807();
      const foe=calculateSectPower(demonFaction).total;
      if(our/Math.max(1,foe)<=0.5) return showStory('敌方优势过大，请先提升实力或邀请盟友。',[{text:'返回备战',action:'declare_war',demonFaction}]);
      w.campaignV2775={enemy:demonFaction,step:0,score:0,log:[],settled:false,taisuiIntel:!!player._taisuiWarIntel,our:our*(0.8+(player.level||0)/50+(player.phase||0)*0.05),foe:foe*(0.9+Math.random()*0.2),reports:Array.from({length:3},()=>Math.floor(Math.random()*3))};
      w.status=WAR_STATUS.BATTLE;w.enemy=demonFaction;w.phase=0;
      warClickAtV2775=Date.now();autoSave();showWarCampaignV2775();
    }
    function showWarCampaignV2775() {
      if(gameState==='combat') return;
      const c=player.warState?.campaignV2775;
      if(!c||c.settled) return showSectHall();
      if(c.step===3) return settleWarV2775(c.enemy);
      const stage=c.step;
      showStory(`<p style="font-size:20px;color:#ffd700">⚔️ 正邪大战 · ${WAR_STAGES_V2775[stage]}</p><p>敌方：${c.enemy} · 阶段 ${stage+1} / 3</p><p style="color:#ffb0b0">📯 ${WAR_REPORTS_V2775[c.reports[stage]]}</p><p>已获战术优势：${c.score} / ${stage*2}</p><p style="color:#aaa">选对克制战术获得2点优势，其余战术获得0点；最终优势修正己方战力为88%～124%。战力差距仍会影响胜负。</p>${c.log.map(t=>`<p style="color:#bde7ff">${t}</p>`).join('')}`, [
        ...WAR_TACTICS_V2775.map((t,i)=>({text:`${t.name} · ${t.hint}`,action:'war_tactic_v2775',tactic:i,step:stage})),
        {text:'🏳️ 撤军（无奖励，冷却7天）',action:'war_retreat_v2775'},
        {text:'暂离战场（保存进度）',action:'sect_hall'}
      ]);
    }
    function chooseWarTacticV2775(tactic,step) {
      if(gameState==='combat'||Date.now()-warClickAtV2775<450) return;
      const w=player.warState,c=w?.campaignV2775;
      if(!c||c.settled||w.status!==WAR_STATUS.BATTLE||step!==c.step||step>=3||!Number.isInteger(tactic)||tactic<0||tactic>2) return;
      warClickAtV2775=Date.now();
      const points=tactic===c.reports[step]?2:0;
      c.score+=points;c.log.push(`${WAR_STAGES_V2775[step]}：${WAR_TACTICS_V2775[tactic].name} · ${points?'克制敌军，优势+2':'未克制敌军，优势+0'}`);
      c.step++;w.phase=c.step;autoSave();showWarCampaignV2775();
    }
    function retreatWarV2775() {
      if(gameState==='combat') return;
      const w=player.warState,c=w?.campaignV2775;
      if(!c||c.settled) return;
      w.history.push({enemy:c.enemy,result:'撤军',date:getGameDateLabel(),rounds:c.step,kills:0,type:'retreat',ratio:0});
      w.history=w.history.slice(-60);w.campaignV2775=null;w.status=WAR_STATUS.PEACE;w.enemy=null;w.phase=0;w.warCooldown=7;
      w.alliedSects=[];w.immortalSupport=false;w.immortalAlly=null;
      updateStats();autoSave();showStory('联军有序撤回山门。未发放奖励；已邀盟友与仙援解散，邀请消耗不返还。7天后可再次出征。',[{text:'返回宗门',action:'sect_hall'}]);
    }

    function settleWarV2775(demonFaction) {
      const campaign=player.warState?.campaignV2775;
      if(gameState==='combat'||!campaign||campaign.enemy!==demonFaction||campaign.step!==3||campaign.settled||player.warState.status!==WAR_STATUS.BATTLE) return;
      if (!DEMON_FACTION_POWER[demonFaction] || isFactionDestroyed(demonFaction)) return retreatWarV2775();
      campaign.settled=true;
      const usedTaisuiIntel=!!campaign.taisuiIntel;
      player.warState.status=WAR_STATUS.BATTLE;
      player.warState.enemy=demonFaction;
      const finalOur=campaign.our*(0.88+campaign.score*0.06);
      const finalEnemy=campaign.foe;
      const ratio=finalOur/Math.max(1,finalEnemy);
      const rounds=3;
      let result='',reward=null,kills=0;
      if(ratio>1.8){result='全胜';reward=WAR_REWARDS.total;kills=20+Math.floor(Math.random()*30);}
      else if(ratio>1.2){result='大胜';reward=WAR_REWARDS.major;kills=10+Math.floor(Math.random()*20);}
      else if(ratio>0.8){result='小胜';reward=WAR_REWARDS.minor;kills=5+Math.floor(Math.random()*15);}
      else if(ratio>0.5){result='惨胜（防守成功）';reward=WAR_REWARDS.defense;kills=2+Math.floor(Math.random()*8);}
      else {result='战败';kills=0;}
      const usedImmortalSupport=!!player.warState.immortalSupport;
      const immortalAlly=player.warState.immortalAlly;
      const allies=[...player.warState.alliedSects];
      player.warState.history.push({enemy:demonFaction,result,ourPower:Math.round(finalOur),enemyPower:Math.round(finalEnemy),ratio,kills,date:getGameDateLabel(),rounds,allies,immortalSupport:usedImmortalSupport,immortalAlly,taisuiIntel:usedTaisuiIntel,type:'declared',tactics:campaign.log.slice(),score:campaign.score});
      player.warState.history=player.warState.history.slice(-60);
      let rewardText='';
      if(reward){
        const goldReward=Math.floor(reward.gold*(1+kills/100));
        const expReward=Math.floor(reward.exp*(1+kills/100));
        const contriReward=Math.floor(reward.contribution*(1+kills/100));
        player.gold+=goldReward; player.exp+=expReward;
        player.sectContribution=(player.sectContribution||0)+contriReward;
        player.sectTotalContribution=(player.sectTotalContribution||0)+contriReward;
        player.sectRank=getCurrentRankInfo().name;
        player.sectData.prosperity=(player.sectData.prosperity||20)+Math.floor(kills/2);
        addFactionReputation(player.sect,Math.max(5,Math.floor(kills/2)),'宗门战争胜利');
        addFactionReputation(demonFaction,-Math.min(25,10+Math.floor(kills/5)),'主动战争');
        for(const ally of allies) addFactionReputation(ally,5,'并肩参战');
        rewardText=`<p style="color:#ffd700">💰 灵石 +${goldReward}</p><p style="color:#69f0ae">⭐ 修为 +${expReward}</p><p style="color:#ffb6c9">📜 宗门贡献 +${contriReward}</p><p style="color:#7ec9ff">📈 宗门繁荣度 +${Math.floor(kills/2)}</p>`;
        checkLevelUp();
      }else{
        const penalty=Math.min(500,Math.floor(player.gold*0.08)); player.gold=Math.max(0,player.gold-penalty);
        player.sectData.prosperity=Math.max(10,(player.sectData.prosperity||20)-10);
        addFactionReputation(player.sect,-5,'宗门战争战败');
        addFactionReputation(demonFaction,-5,'战争敌对');
        rewardText=`<p style="color:#ff6b6b">💔 战败损失 ${penalty} 灵石</p><p style="color:#ff6b6b">📉 宗门繁荣度 -10</p>`;
      }
      player.warState.playerKills=(player.warState.playerKills||0)+kills;
      player.warState.status=result==='战败'?WAR_STATUS.DEFEAT:WAR_STATUS.VICTORY;
      player.warState.enemy=null; player.warState.phase=0;
      player.warState.warCooldown=30;
      player.warState.campaignV2775=null;
      player.warState.alliedSects=[]; player.warState.immortalSupport=false; player.warState.immortalAlly=null;
      if(usedTaisuiIntel) player._taisuiWarIntel=false;
      const supportText=(usedImmortalSupport?`<p style="color:#d9e8ff">✨ ${immortalAlly || '仙人宗门'}之力加持，威压战场。</p>`:'')+(usedTaisuiIntel?'<p style="color:#d9b5ec">📚 太岁书院古籍推演在此战中发挥作用。</p>':'');
      showStory(`<p style="font-size:20px;font-weight:bold;color:${result==='战败'?'#ff6b6b':'#ffd700'}">📜 战争结果：${result}</p><div style="border:1px solid rgba(255,215,0,.3);border-radius:8px;padding:10px;margin:10px 0"><p>📯 战场回报：<b style="color:${getWarOutlook(ratio).color}">${getWarOutlook(ratio).name}</b></p><p style="color:#aaa;font-size:11px">战报只记录局势与结果，不公开双方真实底蕴估值。</p><p>⚔️ 战斗轮数：${rounds} 轮</p><p>💀 斩杀魔族：${kills} 名</p></div>${supportText}<p>📋 战术表现：${campaign.score} / 6</p>${campaign.log.map(t=>`<p style="color:#bde7ff">${t}</p>`).join('')}${rewardText}<p style="color:#aaa">下次主动战争冷却：${player.warState.warCooldown} 天</p>`,[{text:'🏛️ 返回宗门',action:'sect_hall'}]);
      updateStats(); autoSave();
    }

    function findAllies(demonFaction) {
      const available=getAvailableAllies();
      if(!available.length) return showStory('没有可结盟的人类宗门。',[{text:'返回',action:'declare_war',demonFaction}]);
      const choices=[];
      let html=`<p>🤝 <b>寻求盟友</b> · 对抗 ${demonFaction}</p><p style="color:#aaa">邀请盟友需要消耗宗门贡献。各宗只公开立场与声望，不公开真实底蕴估值。</p>`;
      for(const ally of available){
        const info=getFullFactionInfo(ally), icon=info?.icon||'🏳️';
        choices.push({text:`${icon} ${ally} · ${getFactionPublicTierLabel(info?.tier)} · 30贡献`,action:'add_ally',allyName:ally,demonFaction,cost:30,condition:()=>player.sectContribution>=30});
      }
      choices.push({text:'← 返回战争预览',action:'declare_war',demonFaction});
      showStory(html,choices);
    }

    function addAlly(allyName,demonFaction,cost=30) {
      if(gameState==='combat'||player.warState?.campaignV2775||player.warState.warCooldown>0) return;
      if(!getAvailableAllies().includes(allyName)||!DEMON_FACTION_POWER[demonFaction]||isFactionDestroyed(demonFaction)) return;
      cost=30;
      if(player.sectContribution<cost) return showStory('贡献不足！',[{text:'返回',action:'find_allies',demonFaction}]);
      if(player.warState.alliedSects.includes(allyName)) return declareWar(demonFaction);
      player.sectContribution-=cost; player.warState.alliedSects.push(allyName); autoSave();
      showStory(`✅ ${allyName} 同意与${player.sect}结盟，共同对抗 ${demonFaction}。`,[{text:'继续战争准备',action:'declare_war',demonFaction}]);
    }

    function requestImmortalSupport(demonFaction) {
      if(gameState==='combat'||player.warState?.campaignV2775||player.warState.warCooldown>0) return;
      if(player.warState.immortalSupport) return declareWar(demonFaction);
      if(getWarLevel()<2) {
        return showStory('当前只是普通宗门冲突，仙人宗门受三界规则约束，不会直接下场。局部会战或全域魔灾时才可正式求援。',[{text:'返回战争预览',action:'declare_war',demonFaction}]);
      }
      const eligible=IMMORTAL_SECTS_FULL.filter(f=>f.name!=='太岁书院'&&canRequestAid(f.name)&&!isFactionDestroyed(f.name));
      if(!eligible.length) {
        return showStory('目前没有符合声望与干预条件的仙人宗门愿意直接参战。可先提升仙门声望，或在三界势力碑中请求特殊援助。',[{text:'返回战争预览',action:'declare_war',demonFaction},{text:'🌌 查看仙界宗门录',action:'factions_immortal'}]);
      }
      const cost=150;
      if(player.sectContribution<cost) return showStory(`贡献不足！请求仙人宗门支援需要 ${cost} 贡献。`,[{text:'返回',action:'declare_war',demonFaction}]);
      const prosperity=player.sectData?.prosperity||20;
      const avgRep=eligible.reduce((s,f)=>s+(player.factionReputation?.[f.name]||0),0)/eligible.length;
      const successRate=Math.min(.85,.3+prosperity/500+avgRep/250);
      if(Math.random()<successRate){
        player.sectContribution-=cost;
        const chosen=eligible[Math.floor(Math.random()*eligible.length)];
        player.warState.immortalSupport=true; player.warState.immortalAlly=chosen.name;
        addFactionReputation(chosen.name,5,'宗门战争求援');
        showStory(`✅ 【${chosen.name}】同意有限度支援！仙门气机降临战场，联军上下军心大振。<br><span style="color:#aaa;font-size:11px">${chosen.interventionRule||''}</span>`,[{text:'继续战争准备',action:'declare_war',demonFaction}]);
      }else{
        const spent=Math.floor(cost/2);player.sectContribution-=spent;
        showStory(`❌ 仙人宗门没有回应此次请求。（消耗 ${spent} 贡献）`,[{text:'再试一次',action:'request_immortal',demonFaction,condition:()=>player.sectContribution>=cost},{text:'返回战争预览',action:'declare_war',demonFaction}]);
      }
      autoSave();
    }

    function showWarHistory() {
      const history=player.warState.history||[];
      if(!history.length) return showStory('<p>📜 <b>宗门战争史</b></p><p style="color:#aaa">尚未有战争记录。</p>',[{text:'返回',action:'sect_hall'}]);
      let html=`<p>📜 <b>宗门战争史</b>（保留最近 ${history.length} 场）</p>`;
      [...history].reverse().slice(0,30).forEach(h=>{
        const color=h.result==='战败'?'#ff6b6b':h.result==='撤军'?'#aaa':'#ffd700';
        const support=h.immortalSupport?` · ✨${h.immortalAlly||'仙援'}`:'';
        const outlook=getWarOutlook(h.ratio||0);
        html+=`<div style="border:1px solid rgba(255,215,0,.2);border-radius:6px;padding:7px;margin:5px 0"><b style="color:${color}">${h.result}</b> vs ${h.enemy}${support}<br><span style="color:#aaa;font-size:11px">${h.date} · 斩杀 ${h.kills||0} 魔 · 战况：${outlook.name}</span></div>`;
      });
      const totalKills=history.reduce((sum,h)=>sum+(Number(h.kills)||0),0);
      html+=`<p style="color:#ffb6c9">💀 所展示战史斩杀魔族：${totalKills} 名</p>`;
      showStory(html,[{text:'← 返回宗门大殿',action:'sect_hall'}]);
    }

    function checkDemonInvasion() {
      if(!player?.sect || !player?.warState || player.warState.status===WAR_STATUS.BATTLE) return;
      const date=getGameDate(); if(date.day!==1) return;
      const invasionDay=player.worldTime.totalDays;
      if(player.warState.lastInvasionCheckV2775===invasionDay) return;
      player.warState.lastInvasionCheckV2775=invasionDay;
      const prosperity=player.sectData?.prosperity||20;
      const warLevel=getWarLevel();
      const baseByLevel=[.01,.03,.07,.15];
      const adjustedChance=Math.max(.003,(baseByLevel[warLevel]||.01)-prosperity/1800);
      if(Math.random()>=adjustedChance) return;
      const demons=Object.keys(DEMON_FACTION_POWER).filter(n=>!isFactionDestroyed(n));
      if(!demons.length) return;
      const invader=demons[Math.floor(Math.random()*demons.length)];
      const enemyPower=calculateSectPower(invader), ourPower=calculateSectPower(player.sect);
      const invasionScale=1+warLevel*.12;
      const ratio=ourPower.total/Math.max(1,enemyPower.total*invasionScale);
      let result=ratio>1.5?'大胜':ratio>.9?'小胜':'战败',notice='';
      if(result!=='战败'){
        const gold=Math.floor((100+Math.random()*200)*(1+warLevel*.25));
        const exp=Math.floor((80+Math.random()*150)*(1+warLevel*.25));
        player.gold+=gold; player.exp+=exp;
        addFactionReputation(player.sect,3+warLevel,'抵御魔族入侵');
        addFactionReputation(invader,-5-warLevel*2,'魔族入侵');
        notice=`⚠️ ${invader} 偷袭山门，${player.sect} ${result}！缴获 ${gold} 灵石，修为 +${exp}。`;
      }else{
        const loss=Math.floor(player.gold*(.08+warLevel*.02));
        player.gold=Math.max(0,player.gold-loss);
        player.sectData.prosperity=Math.max(10,(player.sectData.prosperity||20)-(5+warLevel*2));
        addFactionReputation(player.sect,-2,'魔族入侵战败');
        addFactionReputation(invader,-5,'魔族入侵');
        notice=`⚠️ ${invader} 偷袭山门，${player.sect} 战败。损失 ${loss} 灵石，宗门繁荣度下降。`;
      }
      const record={enemy:invader,result,ourPower:ourPower.total,enemyPower:Math.round(enemyPower.total*invasionScale),ratio,kills:0,date:getGameDateLabel(),rounds:1,allies:[],immortalSupport:isImmortalBlessingActive(),immortalAlly:player._immortalBlessingSource||null,type:'invasion',warLevel};
      player.warState.history.push(record);
      player.warState.history=player.warState.history.slice(-60);
      player.warState.lastNotice={text:notice,date:getGameDateLabel(),result};
      checkLevelUp(); autoSave();
    }

    function showSectHall() {
      if(!sectCanManageV2866())return;
      const rankInfo = getCurrentRankInfo();
      const nextRank = SECT_RANKS.find(r => r.contributionRequired > (player.sectTotalContribution || 0));
      const nextReq = getCurrentRankInfo().name==='长老' ? '宗主传承：元婴境、累计贡献1000、完成5次宗门委托' : (nextRank ? `晋升 ${nextRank.name} 需累计贡献 ${nextRank.contributionRequired}` : '已达最高职位');
      const pendingTasks = player.sectTasks.filter(t => !t.completed).length;
      const warStatus=player.warState?.status || WAR_STATUS.PEACE;
      const cooldown=Math.max(0,Math.floor(player.warState?.warCooldown||0));
      const inWar=warStatus===WAR_STATUS.BATTLE || warStatus===WAR_STATUS.MOBILIZING;
      let html = `
        <p>🏛️ <b>${player.sect || '凌霄宗'} · 宗门大殿</b></p>
        <p>📅 ${getGameDateLabel()}</p>
        <div style="border:1px solid rgba(255,215,0,.3);border-radius:8px;padding:10px;margin-bottom:10px">
          <p>🧑‍🎓 职位：<b style="color:#ffd700">${rankInfo.icon} ${rankInfo.name}</b></p>
          <p>💠 可用贡献：<b>${player.sectContribution}</b>　📈 累计贡献：<b>${player.sectTotalContribution || 0}</b></p>
          <p>🏯 宗门繁荣度：<b>${player.sectData?.prosperity || 20}</b></p>
          <p style="color:#aaa;font-size:12px">${rankInfo.desc}</p>
          <p style="color:#aaa;font-size:12px">${nextReq}</p>
        </div>`;
      const warLevelInfo=getWarLevelInfo();
      html+=`<p style="color:${getWarLevel()>=2?'#ff8f8f':'#aaa'}">🌍 三界战争态势：<b>${warLevelInfo.name}</b> · ${warLevelInfo.desc}</p>`;
      if(cooldown>0) html+=`<p style="color:#aaa">⏳ 主动战争冷却：${cooldown} 天</p>`;
      if(isImmortalBlessingActive()) {
        const remainYears=Math.max(0,Math.ceil((player._immortalBlessingUntilDay-player.worldTime.totalDays)/GAME_DAYS_PER_YEAR));
        html+=`<p style="color:#d9e8ff">🌌 ${player._immortalBlessingSource||'仙人宗门'}护界仙阵仍在运转，界外魔气受到明显压制（约剩${remainYears}年）</p>`;
      }
      if((player.sect||'凌霄宗')==='凌霄宗') {
        html+=`<p style="color:#c9d8ef">⛩️ 宗内两脉：${getLingxiaoBalanceNarrative()} · 当前${getLingxiaoDominantFaction()}</p>`;
      }
      if(warStatus===WAR_STATUS.VICTORY || warStatus===WAR_STATUS.DEFEAT) html+=`<p style="color:${warStatus===WAR_STATUS.VICTORY?'#69f0ae':'#ff6b6b'}">📯 最近一场主动战争：${warStatus}</p>`;
      if(player.warState?.lastNotice) html+=`<p style="color:${player.warState.lastNotice.result==='战败'?'#ff8f8f':'#ffd98a'}">${player.warState.lastNotice.text}</p>`;
      if(player.warState?.alliedSects?.length) html+=`<p style="color:#bde7ff">🤝 当前战争盟友：${player.warState.alliedSects.join('、')}</p>`;
      if(player.warState?.immortalSupport) html+=`<p style="color:#d9e8ff">✨ 仙人支援：${player.warState.immortalAlly || '仙人宗门'}</p>`;
      const choices = [
        {text: pendingTasks ? `📋 进行中的宗门任务（${pendingTasks}）` : '📜 宗门任务', action:'sect_tasks', story:true},
        {text:'📚 藏经阁（贡献兑换功法）', action:'sect_library', story:true},
        {text:'🏪 贡献商店', action:'sect_shop', story:true},
        {text:'📊 宗门贡献榜', action:'sect_rank', story:true},
        {text:'🌌 三界势力与关系网',action:'factions_human',story:true},
        ...(player.sect==='凌霄宗'?[{text:'⛩️ 查看凌霄宗两脉力量',action:'lingxiao_factions',story:true}]:[]),
        ...(player.warState?.campaignV2775?[{text:'⚔️ 继续正魔大战',action:'war_resume_v2775',story:true}]:[]),
        {text:player.warState?.incomingV2839?'🔥 正魔大战 · 山门求援':'⚔️ 正魔大战 · 军务与军功',action:'war_declare',story:true},
        {text:miniRunV2778()?'🌟 继续小秘境（含宝箱领取）':'🌟 宗门小秘境',action:'mini_realm_v2778',story:true},
        {text:'📜 宗门战争史',action:'war_history',story:true},
        {text:'← 返回宗门', action:'sect'}
      ];
      html='<button class="choice-btn" onclick="showSectOverviewV2866()">宗门总览 · 待办与晋升</button>'+html;
      html+=jevEntryV2846('jevSectV2846()','Jev 宗门经营参议');
      html+='<button class="choice-btn" onclick="showSectPromotionV2768()">👑 宗主传承考核</button>';
      showStory(html, choices);
    }

    function showSectLibrary() {
      let html = `<p>📚 <b>藏经阁</b></p><p>当前可用贡献：<b>${player.sectContribution}</b> · 职位：${getCurrentRankInfo().icon}${getCurrentRankInfo().name}</p><p style="font-size:11px;color:#aaa">已经参悟的功法可照常施展；其余宗门秘法需以贡献换取传承资格。</p>`;
      const choices = [];
      for (const item of SECT_LIBRARY) {
        const hasSkill = player.skills.some(skill => skill?.name === item.skillName);
        const canAfford = player.sectContribution >= item.contributionCost;
        const rankOk = hasRank(item.requiredRank);
        const status = hasSkill ? '✅ 已学习' : (!rankOk ? `🔒 需要${item.requiredRank}` : (!canAfford ? `🔒 贡献不足` : '可兑换'));
        html += `<p style="font-size:11px;color:${hasSkill?'#69f0ae':'#aaa'}">${item.skillName} · ${item.contributionCost}贡献 · ${item.requiredRank} · ${status}</p>`;
        if (!hasSkill) choices.push({
          text:`📖 兑换 ${item.skillName}（${item.contributionCost}贡献）`, action:'sect_buy_skill', skillName:item.skillName, cost:item.contributionCost, requiredRank:item.requiredRank,
          condition:()=>player.sectContribution >= item.contributionCost && hasRank(item.requiredRank) && !player.skills.some(skill=>skill?.name===item.skillName)
        });
      }
      choices.push({text:'← 返回宗门大殿', action:'sect_hall'});
      showStory(html, choices);
    }

    function buySectSkill(skillName, cost, requiredRank='外门弟子') {
      if (!hasRank(requiredRank)) return showStory(`职位不足，需要【${requiredRank}】。`, [{text:'返回', action:'sect_library'}]);
      if (player.skills.some(s=>s?.name===skillName)) return showSectLibrary();
      if (player.sectContribution < cost) return showStory('贡献不足！', [{text:'返回', action:'sect_library'}]);
      const skillObj = SKILLS.find(s=>s.name===skillName);
      if (!skillObj) return showSectLibrary();
      player.sectContribution -= cost;
      player.skills.push({...skillObj});
      autoSave();
      showStory(`✅ 成功兑换功法【${skillName}】！<br><span style="color:#aaa">剩余贡献：${player.sectContribution}</span>`, [{text:'继续', action:'sect_library'}]);
    }

    function showSectShop() {
      let html = `<p>🏪 <b>贡献商店</b></p><p>当前可用贡献：<b>${player.sectContribution}</b></p>`;
      const choices = [];
      for (const item of SECT_SHOP_ITEMS) {
        html += `<p style="font-size:11px;color:#aaa">${item.name} · ${item.cost}贡献 · ${item.desc}</p>`;
        choices.push({text:`🛒 ${item.name}（${item.cost}贡献）`, action:'sect_buy_item', itemName:item.name, cost:item.cost, condition:()=>player.sectContribution >= item.cost});
      }
      choices.push({text:'← 返回宗门大殿', action:'sect_hall'});
      showStory(html, choices);
    }

    function buySectItem(itemName, cost) {
      const itemDef = SECT_SHOP_ITEMS.find(i=>i.name===itemName);
      if (!itemDef) return showSectShop();
      if (player.sectContribution < cost) return showStory('贡献不足！', [{text:'返回', action:'sect_shop'}]);
      player.sectContribution -= cost;
      if (itemDef.type === 'material') player.materials[itemDef.value] = (player.materials[itemDef.value] || 0) + 1;
      else player.inventory.push(itemName);
      autoSave();
      showStory(`✅ 购买成功！获得【${itemName}】<br><span style="color:#aaa">剩余贡献：${player.sectContribution}</span>`, [{text:'继续', action:'sect_shop'}]);
    }

    function showSectRank() {
      const rankInfo=getCurrentRankInfo();
      // 以宗门内NPC作为背景榜单；玩家按累计贡献插入排行，仅为当前本地宗门榜。
      const npcRanks = [
        {name:'沈砚', contribution:860}, {name:'赵玄', contribution:520}, {name:'林青禾', contribution:280}, {name:'周远', contribution:150}, {name:'许宁', contribution:70}
      ];
      const rows=[...npcRanks,{name:`${escapeGameText(player.name)}（你）`,contribution:player.sectTotalContribution||0,player:true}].sort((a,b)=>b.contribution-a.contribution);
      let html=`<p>📊 <b>${player.sect || '凌霄宗'} · 宗门贡献榜</b></p><p>当前职位：${rankInfo.icon} ${rankInfo.name}</p><div style="border:1px solid rgba(255,215,0,.3);border-radius:8px;padding:10px">`;
      rows.forEach((r,i)=>{ html += `<p style="${r.player?'color:#ffd700;font-weight:bold':'color:#ccc'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`} ${r.name} · 累计贡献 ${r.contribution}</p>`; });
      html += `</div><p style="font-size:11px;color:#888">宗门榜为本地模拟榜单，按各宗势力与本地事件推算，不联网。</p>`;
      showStory(html,[{text:'← 返回宗门大殿',action:'sect_hall'}]);
    }

    function discipleDayV2815(){return Math.max(0,Math.floor(Number(player.worldTime?.totalDays)||0));}
    function discipleEscV2815(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
    function discipleRosterV2815(){
      const data=player.sectData ||= {disciples:[]};
      const state=data.managementV2815 ||= {rosters:{},legacyOwner:player.sect};
      const sect=String(player.sect||'散修');
      if(!Object.prototype.hasOwnProperty.call(state.rosters,sect)){
        const old=sect===state.legacyOwner&&Array.isArray(data.disciples)?data.disciples:[];
        Object.defineProperty(state.rosters,sect,{value:{members:old.map((d,i)=>({id:i+1,name:typeof d==='string'?d:String(d?.name||'旧宗门弟子'),level:1,specialty:i%3,job:null})),hired:[],batch:-1,nextId:old.length+1},enumerable:true,writable:true,configurable:true});
      }
      const roster=state.rosters[sect],batch=Math.floor(discipleDayV2815()/30);
      if(roster.batch!==batch){roster.batch=batch;roster.hired=[];}
      return roster;
    }
    function disciplePowerV2815(){return discipleRosterV2815().members.reduce((sum,d)=>sum+Math.max(1,Math.min(10,Number(d.level)||1))*2,0);}
    function discipleAllowedV2815(){return gameState==='exploring'&&!COMBAT_FINISH_V2764.settling&&!!player.sect&&player.sect!=='散修'&&!isFactionDestroyed(player.sect)&&hasRank('长老')&&gameState!=='combat'&&gameState!=='combat-ending'&&!player.breakthrough?.isAnimating;}
    function discipleCandidatesV2815(){
      const r=discipleRosterV2815(),surnames=['沈','陆','顾','许','温','秦','林','柳'],names=['清禾','长风','知微','景行','明霜','星遥','云舟','若竹'];
      return [0,1,2].map(i=>({id:i,batch:r.batch,name:surnames[(r.batch+i*3)%8]+names[(r.batch*3+i)%8],specialty:i,cost:300+i*100,age:18+(r.batch+i)%6}));
    }
    function discipleMissionV2815(type){return [{name:'灵田采集',days:3,gold:180,material:'灵草',count:2},{name:'商路护送',days:7,gold:420,material:'仙果',count:1},{name:'边境巡守',days:15,gold:900,material:'妖丹',count:1}][type];}
    function recruitDiscipleV2815(index,batch){
      if(!discipleAllowedV2815())return showDisciplesV2815('需要长老及以上职位，且当前可处理宗门事务。');
      const r=discipleRosterV2815(),d=discipleCandidatesV2815().find(x=>x.id===index);
      if(!d||d.batch!==batch||r.hired.includes(index)||r.members.length>=12)return showDisciplesV2815('候选或名额已变化，请重新查看。');
      if(player.gold<d.cost)return showDisciplesV2815('灵石不足。');
      if(!window.confirm(`招募 ${d.name}？消耗 ${d.cost} 灵石，剩余 ${player.gold-d.cost}。`))return;
      player.gold-=d.cost;r.hired.push(index);r.members.push({id:r.nextId++,name:d.name,level:1,specialty:d.specialty,traitsV2867:discipleTraitsV2867(d),job:null});autoSave();updateStats();showDisciplesV2815('招募成功。');
    }
    const DISCIPLE_TIERS_V2824=[{name:'普通',level:1,time:1,reward:1,count:1},{name:'进阶',level:3,time:1.5,reward:1.8,count:2},{name:'精英',level:6,time:2,reward:2.8,count:3}];
    function disciplePlanV2824(d,type,tier=0){
      if(!Number.isInteger(type)||!Number.isInteger(tier))return null;
      const m=discipleMissionV2815(type),t=DISCIPLE_TIERS_V2824[tier];if(!m||!t)return null;
      const level=Math.max(1,Math.min(10,Number(d.level)||1)),match=d.specialty===type;
      const traits=discipleTraitsV2867(d),bonus=(traits.aptitude*.05)+(traits.loyalty>=80?.05:0)+(traits.personality===1?.05:0);
      return {type:'mission',missionType:type,tier,name:`${m.name} · ${t.name}`,days:Math.ceil(m.days*t.time)+(traits.personality===0?1:0),requiredLevel:t.level,allowed:level>=t.level,
        gold:Math.floor(m.gold*t.reward*(1+(match ? 0.2 : 0)+(level-1)*.03+bonus)),material:m.material,count:m.count*t.count+(match&&tier>0?1:0)};
    }
    function repeatDiscipleV2824(id){
      if(!discipleAllowedV2815())return;
      const d=discipleRosterV2815().members.find(x=>x.id===id);if(!d||d.job||!d.lastMissionV2824)return;
      assignDiscipleV2815(id,d.lastMissionV2824.type,d.lastMissionV2824.tier);
    }
    function assignDiscipleV2815(id,type,tier=0){
      if(!discipleAllowedV2815())return showDisciplesV2815('当前无法处理宗门事务。');
      const d=discipleRosterV2815().members.find(x=>x.id===id);if(!d||d.job||warDiscipleBusyV286841(id))return;
      const owner=player;
      if(type==='train'){
        if(d.level>=10)return;const cost=d.level*100;if(player.gold<cost)return showDisciplesV2815('培养灵石不足。');
        if(!window.confirm(`培养 ${d.name}：消耗 ${cost} 灵石，需${discipleTrainDaysV2867(d)}个游戏日，完成后 Lv.${d.level} → Lv.${d.level+1}。`))return;
        if(player!==owner||!discipleAllowedV2815()||d.job||warDiscipleBusyV286841(id)||player.gold<cost)return;
        player.gold-=cost;d.job={type:'train',end:discipleDayV2815()+discipleTrainDaysV2867(d)};
      }else{
        const plan=disciplePlanV2824(d,type,tier);if(!plan)return;
        if(!plan.allowed)return showDisciplesV2815(`该难度需要弟子 Lv.${plan.requiredLevel}。`);
        if(!window.confirm(`派遣 ${d.name} · ${plan.name}\n耗时 ${plan.days} 个游戏日；完成领取 ${plan.gold} 灵石、${plan.material}×${plan.count}。\n已计入等级与专长加成，无派遣费用。`))return;
        if(player!==owner||!discipleAllowedV2815()||d.job||warDiscipleBusyV286841(id))return;
        d.job=discipleNewJobV2867(d,plan);d.lastMissionV2824={type,tier};
      }
      autoSave();showDisciplesV2815('已安排，推进游戏日期后回来结算。');
    }
    function discipleReadyV2821(d){
      return !!d.job && Number.isFinite(d.job.end) && d.job.end<=discipleDayV2815();
    }
    function disciplePendingV2821(){return discipleRosterV2815().members.filter(discipleReadyV2821).length;}
    function discipleRewardTextV2821(j){
      return j.type==='train'?'培养等级 +1（最高10级）':`${j.gold} 灵石 · ${j.material} ×${j.count}`;
    }
    function claimDiscipleV2815(id){settleDisciplesV2821(id);}
    function claimAllDisciplesV2821(){settleDisciplesV2821();}
    function settleDisciplesV2821(id){
      if(!discipleAllowedV2815())return;
      const ready=discipleRosterV2815().members.filter(d=>discipleReadyV2821(d)&&(id===undefined||d.id===id));
      if(!ready.length){showDisciplesV2815('暂无可领取成果，已领取的事务不会重复发奖。');return;}
      let gold=0,trained=0;const materials=new Map();
      // 先解除所有已完成事务，再统一发奖，重复点击不会再次结算。
      for(const d of ready){const j=d.job;d.job=null;lifeCompletedV2868(d,j);const traits=discipleTraitsV2867(d);d.traitsV2867={...traits,loyalty:Math.min(100,traits.loyalty+(j.withdrawnV2867?0:2))};
        if(j.type==='train'){d.level=Math.min(10,d.level+1);trained++;}
        else{
          const type=Number.isInteger(j.missionType)?j.missionType:[0,1,2].find(n=>discipleMissionV2815(n).name===j.name);
          if(type!==undefined)d.lastMissionV2824={type,tier:Number.isInteger(j.tier)?j.tier:0};
          gold+=j.gold;materials.set(j.material,(materials.get(j.material)||0)+j.count);
        }
      }
      player.gold+=gold;player.materials ||= {};
      for(const [name,count] of materials)player.materials[name]=(player.materials[name]||0)+count;
      for(const [name,count] of materials)onCollectMaterial?.(name,count);
      autoSave();updateStats();
      const rewards=[gold?`${gold} 灵石`:'',...Array.from(materials,([name,count])=>`${name} ×${count}`),trained?`${trained} 位弟子培养完成`:''].filter(Boolean).join('；');
      showDisciplesV2815(`已领取 ${ready.length} 项事务：${rewards}。弟子已空闲，可重新安排。`);
    }
    function showDisciplesV2815(notice=''){
      if(!sectCanManageV2866())return;
      const r=discipleRosterV2815(),allowed=discipleAllowedV2815(),day=discipleDayV2815(),esc=discipleEscV2815,special=['灵植','商路','巡防'];
      let html=`<section class="home-board-v2812"><h3>👥 ${esc(player.sect)} · 弟子事务</h3><p>名册 ${r.members.length}/12 · 弟子战力 +${disciplePowerV2815()} · 灵石 ${player.gold}</p><p>招募、培养与派遣需要长老及以上职位。每位弟子同时只能执行一项事务；培养等级1—10，每级提供2点宗门战力，派遣期间仍计入宗门战力。</p><p>按游戏日期结算，修炼、休息或历练可推进日期；无需等待现实时间。派遣奖励需返回领取。</p><details><summary>派遣难度与专长收益</summary><p>普通需Lv.1；进阶需Lv.3，耗时×1.5、基础灵石×1.8；精英需Lv.6，耗时×2、基础灵石×2.8。天数向上取整。</p><p>每提升一级，灵石加成增加3%；专长匹配再加20%。进阶/精英材料分别为基础的2/3倍，专长匹配额外+1份。资质每档增加5%灵石，果敢额外5%，忠诚80起额外5%；谨慎多用1天。出发时锁定奖励；途中选择探索或救援会按预览改变行程。未处理事件仍按原计划结算。不同任务仍各自占用一名弟子。</p></details>${notice?`<p class="home-notice-v2812">${esc(notice)}</p>`:''}`;
      if(allowed)html+=jevEntryV2846('jevDiscipleV2846()','Jev 推荐派遣（最多比较前5名空闲弟子）');
      if(!allowed)html+='<p>🔒 当前仅可查看，请先晋升长老并在非战斗状态管理。</p>';
      const ready=r.members.filter(discipleReadyV2821),busy=r.members.filter(d=>d.job&&!discipleReadyV2821(d));
      let pendingGold=0,training=0;const pendingMaterials=new Map();
      for(const d of ready){const j=d.job;if(j.type==='train')training++;else{pendingGold+=j.gold;pendingMaterials.set(j.material,(pendingMaterials.get(j.material)||0)+j.count);}}
      const summary=[pendingGold?`${pendingGold} 灵石`:'',...Array.from(pendingMaterials,([name,count])=>`${name} ×${count}`),training?`${training} 项培养成果`:''].filter(Boolean).join(' · ');
      html+=`<div class="disciple-claim-v2821"><strong>待领取 ${ready.length} · 进行中 ${busy.length} · 随军 ${r.members.filter(d=>warDiscipleBusyV286841(d.id)).length} · 空闲 ${r.members.filter(d=>!d.job&&!warDiscipleBusyV286841(d.id)).length}</strong><p>${ready.length?esc(summary):busy.length?`最近一项还需 ${Math.min(...busy.map(d=>Math.max(0,d.job.end-day)))} 个游戏日`:'暂无待领取事务，可安排培养或派遣。'}</p><button class="choice-btn" onclick="claimAllDisciplesV2821()" ${!allowed||!ready.length?'disabled':''}>${ready.length?`一键领取全部 · ${ready.length} 项`:'暂无可领取成果'}</button></div>`;

      html+=`<details ${r.members.length?'':'open'}><summary>招募候选 · ${30-day%30} 个游戏日后换批</summary><div class="home-grid-v2812">`;
      for(const d of discipleCandidatesV2815())html+=`<article><h4>${d.name}</h4><p>${d.age}岁 · ${special[d.specialty]}专长</p>${discipleTraitsHtmlV2867(d)}<p> · 同类派遣灵石 +20%</p><button class="choice-btn" onclick="recruitDiscipleV2815(${d.id},${d.batch})" ${!allowed||r.hired.includes(d.id)||r.members.length>=12||player.gold<d.cost?'disabled':''}>${r.hired.includes(d.id)?'已招募':`招募 · ${d.cost}灵石`}</button></article>`;
      html+='</div></details><h4>弟子名册</h4><div class="home-grid-v2812">';
      const order=d=>discipleReadyV2821(d)?0:d.job?1:2;
      const sorted=r.members.slice().sort((a,b)=>order(a)-order(b)||(a.job?.end||0)-(b.job?.end||0)||a.id-b.id);
      for(const d of sorted){
        html+=`<article class="${discipleReadyV2821(d)?'disciple-ready-v2821':''}"><h4>${esc(d.name)} · Lv.${d.level}</h4><p>${special[d.specialty]}专长 · 战力 +${d.level*2}</p>${discipleTraitsHtmlV2867(d)}${discipleEventButtonV2867(d)}${lifeCardV2868(d)}`;
        if(warDiscipleBusyV286841(d.id)){html+='<p>随军统领 · 战役结束后解任，当前不能培养或派遣。</p>';}
        else if(d.job){const left=Math.max(0,d.job.end-day);html+=`<p>${d.job.type==='train'?'修行培养':esc(d.job.name)} · ${left?`还需 ${left} 个游戏日`:'✅ 已完成，待领取'}</p><p>${esc(discipleRewardTextV2821(d.job))}</p><button class="choice-btn" onclick="claimDiscipleV2815(${d.id})" ${left||!allowed?'disabled':''}>${left?'进行中':d.job.type==='train'?'完成培养':'领取奖励'}</button>`;}
        else{
          html+=`<button class="choice-btn" onclick="assignDiscipleV2815(${d.id},'train')" ${!allowed||d.level>=10||player.gold<d.level*100?'disabled':''}>${d.level>=10?'培养已满级':`培养 · ${d.level*100}灵石 / ${discipleTrainDaysV2867(d)}天`}</button><details><summary>安排派遣</summary>`;
          for(let i=0;i<3;i++){
            html+=`<details ${d.specialty===i?'open':''}><summary>${discipleMissionV2815(i).name}${d.specialty===i?' · ★ 专长推荐':''}</summary>`;
            for(let tier=0;tier<3;tier++){const plan=disciplePlanV2824(d,i,tier);html+=`<button class="choice-btn" onclick="assignDiscipleV2815(${d.id},${i},${tier})" ${!allowed||!plan.allowed?'disabled':''}>${DISCIPLE_TIERS_V2824[tier].name} · ${plan.days}天 · 需Lv.${plan.requiredLevel}<br>${plan.gold}灵石 + ${plan.material}×${plan.count}</button>`;}
            html+='</details>';
          }html+='</details>';
          if(d.lastMissionV2824){const last=disciplePlanV2824(d,d.lastMissionV2824.type,d.lastMissionV2824.tier);if(last)html+=`<button class="choice-btn" onclick="repeatDiscipleV2824(${d.id})" ${!allowed||!last.allowed?'disabled':''}>↻ 再派遣 · ${last.name}<br>${last.days}天 · ${last.gold}灵石 + ${last.material}×${last.count}</button>`;}

        }
        html+='</article>';
      }
      if(!r.members.length)html+='<p>暂无弟子，可从上方候选中招募。</p>';
      html+='</div><button class="choice-btn" onclick="showDiscipleBatchV2866()">按专长批量派遣</button><button class="choice-btn" onclick="showSectOverviewV2866()">宗门总览</button></section>';showStory(html,[{text:'刷新事务状态',action:'disciples_v2815'},{text:'返回宗门',action:'sect'}]);
    }

    function showSect() {
      const pendingCentury=getPendingTournamentCentury();
      let text=buildAreaSceneCard({icon:'⛩️',title:'北域 · 凌霄宗',subtitle:`📅 ${getGameDateLabel()} · 宗门驻地`,desc:'前山门、中央大殿、演武场与后山修行区形成完整宗门建筑群。',accent:'#c7e4ff',chips:['主线节点','演武试炼','百年大比'],info:pendingCentury?`📯 第 ${pendingCentury} 年百年宗门大比已至。`:`下一届万宗大比：仙历 ${getNextTournamentYear()} 年。`})+
        buildAreaLayout('宗门建筑布局',[{name:'前山门',desc:'弟子进出与接引访客。'},{name:'中央大殿',desc:'主线与宗门事务核心。'},{name:'侧翼演武场',desc:'试炼与守将考核。'},{name:'后山修行区',desc:'静修、闭关与等待大比。'}])+
        buildInteriorStrip('宗门大殿',[{icon:'🏛️',name:'宗主主位',desc:'剧情与高层议事。'},{icon:'📜',name:'外务案台',desc:'任务与宗门公告。'},{icon:'⚔️',name:'演武传令处',desc:'试炼与大比报名。'},{icon:'🪶',name:'静修回廊',desc:'弟子休整区域。'}]);
      const guardianWaiting=player.storyProgress===2&&!player.bossesDefeated.includes('宗门试炼守将');
      if(guardianWaiting)text+=`<div class="area-info-box" style="color:#ffd700">宗门试炼守将正在试炼场等待挑战者。请点「挑战宗门试炼守将」；「试炼场（普通难度）」只是日常练习。</div>`;
      text='<button class="choice-btn" onclick="showSectOverviewV2866()">宗门总览 · 待办与晋升</button>'+text;
      const sectChoices=[{text:`👥 弟子事务${disciplePendingV2821()?` · ${disciplePendingV2821()} 项待领取`:' · 招募/培养/派遣'}`,action:'disciples_v2815'},{text:'💧 北域灵泉 · 恢复气血/灵力',action:'lingxiao_building',buildingId:'spirit_spring'},{text:'🏯 宗门建筑总览',action:'building_directory',story:true},{text:'🏛️ 宗门大殿',action:'sect_hall',story:true},{text:isLingxiaoNight()?'☀️ 等到天明':'🌙 静候入夜 · 开放夜间建筑',action:'lingxiao_night_v286838'},{text:'📚 静修一年',action:'cultivate'},{text:'🧘 闭关（最多十年）',action:'cultivate_decade'},{text:pendingCentury?'📯 参加百年宗门大比':'📯 查看百年宗门大比',action:'sect_tournament'},{text:'⚔️ 试炼场（普通难度）',action:'sect_battle'},{text:'🌌 查看三界宗门势力',action:'factions_human'},{text:'← 返回北域地图',action:'return_to_map'}];
      if(guardianWaiting)sectChoices.unshift({text:'👹 挑战宗门试炼守将',action:'boss_guardian',boss:true});
      showStory(text,sectChoices);
    }

    function showYoumingu() {
      let text = `
        <p>📍 <b>幽冥谷</b></p>
        <p>阴森的山谷，弥漫着诡异的雾气。</p>
        <p>传说这里是通往幽冥界的入口。</p>
      `;
      
      let choices = [
        { text: '🌑 深入探索', action: 'youmingu_explore' },
        { text: '← 返回村庄', action: 'village' }
      ];
      
      if (player.storyProgress === 3 && !player.bossesDefeated.includes('幽冥鬼王')) {
        text += `<p style="color: #00ff88;">一股强大的鬼气从谷底传来...</p>`;
      }
      
      showStory(text, choices);
    }
    
    function recoverAtSpringV2848() {
      if(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating||COMBAT_FINISH_V2764.settling)return null;
      const hp=getMaxHp(),mp=getMaxMp(),changed=player.hp!==hp||player.mp!==mp;
      player.hp=hp;player.mp=mp;
      const oldCooldown=Object.prototype.hasOwnProperty.call(player.buildingReadyDaysV2768||{},'spring');
      if(oldCooldown)delete player.buildingReadyDaysV2768.spring;
      updateStats();updateWorldHUD();if(changed||oldCooldown)autoSave();
      return {changed,hp,mp};
    }
    function doRest() {
      const result=recoverAtSpringV2848();if(!result)return;
      showStory(`<h3>💧 灵泉调息</h3><p>${result.changed?'泉水灵气流转，气血与灵力已全部恢复。':'当前气血与灵力已经全满，无需额外调息。'}</p><p>气血 ${Math.floor(player.hp)} / ${getMaxHp()}<br>灵力 ${Math.floor(player.mp)} / ${getMaxMp()}</p><p>免费 · 不限次数 · 无冷却 · 不消耗游戏时间</p>`,[
        {text:'再次调息',action:'rest'},
        {text:'返回当前地域地图',action:'return_to_map'}
      ]);
    }

    // ================== 剧情事件 ==================
    
    function showStoryEvent(chapter) {
      switch(chapter.id) {
        case 0: showPrologue(); break;
        case 1: showChapter1(); break;
        case 2: showChapter2(); break;
        case 3: showChapter3(); break;
        case 4: showChapter4(); break;
        case 5: showChapter5(); break;
        case 6: showFinalChapter(); break;
      }
    }
    
    function showPrologue() {
      if (player?.testAccount999 === true) {
        updateStats();
        saveTest999V2760();
        showStory(`
          <p style="color:#ffe08a;font-weight:900;font-size:20px">⚡ V27.71 满级测试账号</p>
          <p>道号：<b>999</b></p>
          <p>境界：<b>${getCultivationName()}</b></p>
          <p>普通存档与测试档完全分开。</p>
          <p>战斗默认启用：<b style="color:#9ff0c9">🎬 动画演武</b></p>
        `, [{ text:'进入满级测试', action:'village' }]);
        return;
      }

      showStory(`
        <p style="color:#ffb6c9;font-weight:bold;">【序章：情断青云】</p>
        <p>苏晚晴刚在青石桥上与你说了“到此为止”。</p>
        <p>她带着凌霄宗的接引令离开，而你仍只是尚未觉醒灵根的凡人。</p>
        <p>你独自回到青云村时，一位白发老者拦住去路。</p>
        <p>老者看向你掌心那枚旧木牌：“情断未必是路断。小友根骨不凡，可愿从今日开始，只走你自己的道？”</p>
        <p>他递来一枚玉简，上面记载着入门功法。</p>
      `, [
        { text: '🙏 接过玉简，从头修炼', action: 'prologue_accept', story: true }
      ]);
    }
    
    function showChapter1() {
      showStory(`
        <p style="color: #ffd700; font-weight: bold;">【第一章：拜入宗门】</p>
        <p>你已踏入练气期，听闻凌霄宗正在招收弟子。</p>
        <p>宗门考核就在今日，你决定前往一试。</p>
        <p>考核长老看了看你："你是来参加入门考核的？"</p>
      `, [
        { text: '👊 参加考核', action: 'sect_exam', story: true }
      ]);
    }
    
    function showChapter2() {
      showStory(`
        <p style="color: #ffd700; font-weight: bold;">【第二章：宗门试炼】</p>
        <p>你已成为凌霄宗弟子，筑基成功。</p>
        <p>宗主召见你："最近妖魔作乱，你去调查一下。"</p>
        <p>"但要先通过试炼守将的考验。"</p>
      `, [
        { text: '⚔️ 挑战试炼守将', action: 'boss_guardian', boss: true, story: true }
      ]);
    }
    
    function showChapter3() {
      showStory(`
        <p style="color: #ffd700; font-weight: bold;">【第三章：秘境探索】</p>
        <p>你已踏入筑基境，调查发现妖魔来自幽冥谷。</p>
        <p>谷中阴气森森，不时有鬼影闪过。</p>
        <p>深处传来一声怒吼，那是一位强大的鬼王！</p>
      `, [
        { text: '👹 挑战幽冥鬼王', action: 'boss_ghost_king', boss: true, story: true }
      ]);
    }
    
    function showChapter4() {
      showStory(`
        <p style="color: #ffd700; font-weight: bold;">【第四章：魔影重重】</p>
        <p>击败鬼王后，你发现这一切都是血魔老祖的阴谋。</p>
        <p>血魔老祖企图借幽冥谷之力，重返人间。</p>
        <p>你必须阻止他！但你目前还不是对手...</p>
        <p>需要修炼至炼虚境才有把握一战。</p>
      `, [
        { text: '🔒 继续修炼', action: 'village', story: true }
      ]);
      advanceStory();
    }
    
    function showChapter5() {
      if (!hasReachedRealm(6)) {
        showStory(`
          <p style="color: #ffd700; font-weight: bold;">【第五章准备中】</p>
          <p>血魔老祖实力强大，你需要达到炼虚境才能与之抗衡。</p>
          <p>当前境界：${getCultivationName()}</p>
          <p>继续修炼，提升实力！</p>
        `, [
          { text: '🔒 继续修炼', action: 'village', story: true }
        ]);
      } else {
        showStory(`
          <p style="color: #ffd700; font-weight: bold;">【第五章：血魔降临】</p>
          <p>你已踏入炼虚境，是时候面对血魔老祖了！</p>
          <p>血魔老祖正在幽冥谷深处积蓄力量。</p>
          <p>若不及时阻止，整个修仙界都将陷入血海！</p>
        `, [
          { text: '👹 挑战血魔老祖', action: 'boss_blood_demon', boss: true, story: true }
        ]);
      }
    }
    
    function showFinalChapter() {
      if (!hasReachedRealm(9, 3)) {
        showStory(`
          <p style="color: #ffd700; font-weight: bold;">【终章准备中】</p>
          <p>血魔老祖已灭，但你还需要渡过天劫才能真正飞升。</p>
          <p>当前境界：${getCultivationName()}</p>
          <p>需要达到渡劫圆满才能挑战飞升天劫！</p>
        `, [
          { text: '🔒 继续修炼', action: 'village', story: true }
        ]);
      } else {
        showStory(`
          <p style="color: #ffd700; font-weight: bold;">【终章：飞升仙界】</p>
          <p>你已踏入渡劫圆满，飞升天劫即将降临！</p>
          <p>渡过此劫，便可脱离凡界桎梏，踏入【地仙初期】。</p>
          <p>天空乌云密布，雷声隆隆...</p>
        `, [
          { text: '⚡ 挑战飞升天劫', action: 'tribulation_fight', tribulation: true, story: true }
        ]);
      }
    }
    
    // ================== 选择处理 ==================
    
    let currentChoices = [];
    
    function handleChoice(index) {
      const choice = currentChoices[index];
      if(!choice)return;
      if (choice.condition && !choice.condition()) {
        return;
      }
      
      switch(choice.action) {
        case 'tutorial_begin_world':
          // 进入游戏后优先进入新手引路，不先弹出村庄自由行动面板，避免与引导气泡重叠。
          closeWorldOverlay();
          player.location = 'world';
          setTimeout(() => checkAndStartTutorial(true), 320);
          break;
        case 'village':
        case 'shop':
        case 'explore':
        case 'mountain':
        case 'sect':
        case 'youmingu':
        case 'alchemy':
        case 'pets':
        case 'artifacts':
        case 'rest':
        case 'romance':
          showLocation(choice.action);
          break;

        case 'world_travel_menu':
          showWorldTravelMenu();
          break;

        case 'map_npc':
          showMapNpcHub(choice.npcId);
          break;
        case 'map_npc_chat':
          talkToMapNpc(choice.npcId);
          break;
        case 'map_npc_reward':
          claimMapNpcReward(choice.npcId);
          break;
        case 'map_npc_intel':
          showMapNpcIntel(choice.npcId);
          break;
        case 'map_npc_quest_accept':
          acceptMapNpcQuest(choice.npcId);
          break;
        case 'map_npc_quest_submit':
          submitMapNpcQuest(choice.npcId);
          break;
        case 'map_npc_quest_done':
          showMapNpcHub(choice.npcId);
          break;
        case 'map_npc_shop':
          showMapNpcShop(choice.npcId);
          break;
        case 'map_npc_buy':
          buyFromMapNpc(choice.npcId,choice.item,choice.cost);
          break;
        case 'map_npc_open':
          if (choice.openAction === 'map_npc_help') {
            closeWorldOverlay?.();
            if (typeof showHelpManual === 'function') showHelpManual();
          } else {
            showLocation(choice.openAction);
          }
          break;
        case 'early_economy_v2773':
          showEarlyEconomyV2773();break;
        case 'story_event': {
          const chapter = STORY_CHAPTERS.find(c => c.id === choice.chapterId);
          if (chapter) showStoryEvent(chapter);
          break;
        }
        case 'travel_world_map':
          travelToWorldMap(choice.regionId, choice.targetPoiId || null);
          break;
        case 'equipment_menu':
        case 'equip_panel':
          showEquipmentPanel();
          break;
        case 'equip_gear':
          equipGear(choice.itemName);
          break;
        case 'unequip_gear':
          unequipGear(choice.slot);
          break;
        case 'unequip_slot':
          unequipItem(choice.slot);
          showEquipmentPanel();
          break;
        case 'equip_to_slot':
          doEquip(choice.itemName,choice.slot);
          showEquipmentPanel();
          break;
        case 'task_panel_open':
          closeWorldOverlay(); showTaskPanel('main');
          break;
        case 'return_to_map':
          closeWorldOverlay();
          break;
        case 'building_directory':
          showBuildingDirectory();
          break;
        case 'lingxiao_building':
          enterLingxiaoBuilding(choice.buildingId);
          break;
        case 'lingxiao_mark':
          navigateToLingxiaoBuilding(choice.buildingId);
          break;
        case 'lingxiao_op':
          handleLingxiaoBuildingOp(choice.op,choice.buildingId);
          break;
        case 'lingxiao_event':
          triggerLingxiaoBuildingEvent(choice.buildingId,choice.event);
          break;
        case 'material_workshop':
          showMaterialWorkshop(choice.filter || 'all');
          break;
        case 'material_pet_craft':
          craftPetMaterialRecipe(choice.recipeId);
          break;
        case 'material_forge':
          forgeMaterialEquipment(choice.recipeId);
          break;

        case 'disciples_v2815':
          showDisciplesV2815();break;
        case 'sect_hall':
          showSectHall();
          break;
        case 'sect_tasks':
          showSectTasks();
          break;
        case 'sect_task_accept':
          acceptSectTask();
          break;
        case 'sect_task_submit':
          updateSectTaskProgress(choice.taskIndex);
          break;
        case 'sect_task_navigate':
          navigateToSectTask(choice.taskIndex);
          break;
        case 'sect_library':
          showSectLibrary();
          break;
        case 'sect_shop':
          showSectShop();
          break;
        case 'sect_rank':
          showSectRank();
          break;
        case 'sect_buy_skill':
          buySectSkill(choice.skillName, choice.cost, choice.requiredRank);
          break;
        case 'sect_buy_item':
          buySectItem(choice.itemName, choice.cost);
          break;
        case 'war_declare':
          showWarTargetList();
          break;
        case 'declare_war':
          declareWar(choice.demonFaction);
          break;
        case 'mini_realm_v2778': showMiniRealmV2778(); break;
        case 'mini_enter_v2778': enterMiniRealmV2778(); break;
        case 'mini_choice_v2778': chooseMiniRealmV2778(choice.pick,choice.step,choice.runId); break;
        case 'war_resume_v2775': showWarCampaignV2775(); break;
        case 'war_tactic_v2775': chooseWarTacticV2775(choice.tactic,choice.step); break;
        case 'war_retreat_v2775': retreatWarV2775(); break;
        case 'execute_war':
          executeWar(choice.demonFaction);
          break;
        case 'find_allies':
          findAllies(choice.demonFaction);
          break;
        case 'add_ally':
          addAlly(choice.allyName, choice.demonFaction, choice.cost);
          break;
        case 'request_immortal':
          requestImmortalSupport(choice.demonFaction);
          break;
        case 'war_history':
          showWarHistory();
          break;

        case 'factions_human':
          showFactionDirectory('human');
          break;
        case 'factions_demon':
          showFactionDirectory('demon');
          break;
        case 'factions_immortal':
          showFactionDirectory('immortal');
          break;
        case 'faction_guide_v2806': showFactionMapGuideV2806(); break;
        case 'faction_navigate_v2806': navigateFactionV2806(choice.factionName); break;
        case 'faction_detail':
        case 'faction_detail_full':
          showFullFactionDetail(choice.factionName);
          break;
        case 'request_immortal_aid':
          requestImmortalAid(choice.factionName || '太虚堂');
          break;
        case 'lingxiao_factions':
          showLingxiaoFactionBalance();
          break;
        case 'sect_tournament':
          showSectTournament();
          break;
        case 'tournament_start':
          startSectTournament();
          break;
        case 'tournament_round':
          startTournamentRound();
          break;
        case 'lingxiao_night_v286838':
          toggleLingxiaoNightV286838();
          break;
        case 'tournament_auto':
          if(!choice.confirmed&&getTaskStatus('main_14')===TASK_STATUS.ACTIVE){
            showStory('<h3>委托宗门代表参赛？</h3><p>主线《万宗争锋》要求亲自完成一届大比。委托参赛会结算本届名次，但<b>不计入主线</b>，需要等待下一届（约一百年）。</p>',[{text:'⚔️ 改为亲自报名',action:'tournament_start'},{text:'仍然委托（本届不计主线）',action:'tournament_auto',confirmed:true},{text:'返回大比',action:'sect_tournament'}]);
            break;
          }
          autoResolveSectTournament();
          break;
        case 'tournament_fight':
          enterTournamentFightV2779(choice.enemy);
          break;

        case 'romance_npc':
          showRomanceNpc(choice.npcId);
          break;
        case 'romance_chat':
          doRomanceChat(choice.npcId);
          break;
        case 'romance_gift_menu':
          showRomanceGiftMenu(choice.npcId);
          break;
        case 'romance_gift':
          giveRomanceGift(choice.npcId, choice.item, choice.delta);
          break;
        case 'romance_event':
          showRomanceEvent(choice.npcId, choice.eventId);
          break;
        case 'romance_event_choice':
          resolveRomanceEvent(choice.npcId, choice.eventId, choice.option);
          break;
        case 'ji_commit': jiConfessV2796(true); break;
        case 'ji_evening': jiEveningV2796('invite'); break;
        case 'ji_night': jiEveningV2796('night'); break;
        case 'ji_moon': jiEveningV2796('moon'); break;
        case 'romance_confess':
          confessRomance(choice.npcId);
          break;
        case 'heart_demon_breakthrough':
          triggerHeartDemonBreakthrough();
          break;
        case 'ending_reunion':
          endingReunion();
          break;
        case 'ending_release':
          endingRelease();
          break;
        case 'rival_exit':
          rivalSteppedBack();
          break;
          
        case 'buy':
          if(EQUIPMENT_DB[choice.item]&&!confirmGearPurchaseV2804(choice.item,choice.cost))break;
          if (player.gold >= choice.cost) {
            player.gold -= choice.cost;
            if(EQUIPMENT_DB[choice.item])player.equipmentInventory.push(choice.item);else player.inventory.push(choice.item);
            showStory(`购买了 ${choice.item}！${EQUIPMENT_DB[choice.item]?' 已放入装备背包。':''}`, [{ text: '继续', action: 'shop' }]);
          } else {
            showStory('灵石不足！', [{ text: '继续', action: 'shop' }]);
          }
          break;
          
        case 'buyMaterial':
          if (player.gold >= choice.cost) {
            player.gold -= choice.cost;
            player.materials[choice.item] = (player.materials[choice.item] || 0) + 1;
            autoSave?.();
            updateStats?.();
            showStory(`购买了 ${choice.item}！`, [{ text: '继续', action: 'shop' }]);
          } else {
            showStory('灵石不足！', [{ text: '继续', action: 'shop' }]);
          }
          break;

        case 'buyArtifactMaterial': {
          if (!player.materials || typeof player.materials !== 'object') player.materials = {};
          if (player.gold >= choice.cost) {
            player.gold -= choice.cost;
            player.materials[choice.item] = (player.materials[choice.item] || 0) + 1;
            autoSave?.();
            updateStats?.();

            const activeStardustTask = choice.item === '星辰砂' && player.sectTasks?.some(task =>
              !task.completed && task.template?.id === 'donate_stardust'
            );
            const taskHint = activeStardustTask
              ? `<p style="color:#69f0ae;margin-top:8px">📜 宗门任务【捐献珍材】所需星辰砂已经备齐，可以返回宗门任务提交。</p>`
              : '';

            showStory(`
              <p>✅ 购买了 <b>${choice.item}</b>！</p>
              <p>花费：${choice.cost} 灵石</p>
              <p>当前持有：<b>${player.materials[choice.item]}</b> 份</p>
              ${taskHint}
            `, [
              ...(activeStardustTask ? [{ text: '📜 前往宗门任务提交', action: 'sect_tasks' }] : []),
              { text: '继续购买', action: 'shop_rare_artifact' },
              { text: '← 返回仙市', action: 'market' }
            ]);
          } else {
            showStory(`
              <p>❌ 灵石不足！</p>
              <p>购买 ${choice.item} 需要 ${choice.cost} 灵石。</p>
              <p>当前灵石：${player.gold}</p>
            `, [
              { text: '返回材料铺', action: 'shop_rare_artifact' },
              { text: '← 返回仙市', action: 'market' }
            ]);
          }
          break;
        }
          
        case 'buyPetMaterial':
          if (player.gold >= choice.cost) {
            player.gold -= choice.cost;
            player.petMaterials[choice.item] = (player.petMaterials[choice.item] || 0) + 1;
            showStory(`购买了 ${choice.item}！`, [{ text: '继续', action: 'shop' }]);
          } else {
            showStory('灵石不足！', [{ text: '继续', action: 'shop' }]);
          }
          break;
          
        case 'random_encounter':
          advanceGameTime(3,'野外历练');
          // 触发随机事件
          if (Math.random() < 0.25) {
            const eventResult = triggerRandomEvent('explore');
            if (eventResult) {
              const result = eventResult.event.effect(player);
              showStory(`<p>${eventResult.event.desc}</p><p style="color: #ffd700;">${result.text}</p>`, [{ text: '继续', action: 'explore' }]);
              break;
            }
          }
          
          if (Math.random() > 0.3) {
            const enemy = getEnemy();
            showStory(`<p>你遇到了一只 <b>${enemy.name}</b>！</p>`, [
              { text: '⚔️ 战斗', action: 'fight', enemy: enemy },
              { text: '🏃 逃跑', action: 'explore' }
            ]);
          } else {
            // 探索发现
            const roll = Math.random();
            if (roll < 0.3) {
              // 发现材料
              const mats = ['灵草', '仙果', '妖丹'];
              const found = mats[Math.floor(Math.random() * mats.length)];
              player.materials[found] = (player.materials[found] || 0) + 1;
              showStory(`<p>你发现了一株${found}！</p>`, [{ text: '继续', action: 'explore' }]);
            } else if (roll < 0.5) {
              // 发现灵石
              const gold = 20 + Math.floor(Math.random() * 30);
              player.gold += gold;
              showStory(`<p>你发现了一个遗落的包裹，获得 <b>${gold}灵石</b>！</p>`, [{ text: '继续', action: 'explore' }]);
            } else if (roll < 0.6) {
              // V27.9：探索不再直接白送宠物，改为触发一只已受伤的可收服灵兽。
              const wildName = Math.random() < 0.72 ? '灵纹野兔' : '碧水灵龟';
              const region = getRegionInfo('south');
              const wild = createRegionEnemyTemplate(region, wildName);
              wild.maxHp = wild.hp;
              wild.hp = Math.max(1, Math.floor(wild.maxHp * 0.25));
              wild._realmLevel = Math.max(0, (player.level || 0) - 1);
              wild._realmPhase = 0;
              startCombat(wild, false, false, null);
              addCombatLog(`🐾 你发现受伤的【${wildName}】，现在正是尝试收服的机会。`, 'pet');
            } else {
              player.exp += 20;
              checkLevelUp();
              showStory(`<p>你四处探索，获得了一些修炼感悟。修为 +20</p>`, [{ text: '继续', action: 'explore' }]);
            }
          }
          break;
          
        case 'mountain_encounter':
          advanceGameTime(7,'后山历练');
          if (hasReachedRealm(2)) {
            const enemy = { ...ENEMIES[Math.min(player.level + 1, ENEMIES.length - 1)] };
            enemy.hp = Math.floor(enemy.hp * 1.5);
            enemy.maxHp = enemy.hp;
            enemy.name = '千年' + enemy.name;
            enemy.gold *= 2;
            enemy.exp *= 2;
            showStory(`<p>山顶传来一声怒吼！</p><p><b>${enemy.name}</b> 向你扑来！</p>`, [
              { text: '⚔️ 战斗', action: 'fight', enemy: enemy }
            ]);
          } else {
            player.exp += 30;
            checkLevelUp();
            showStory(`<p>你在灵气浓郁的半山腰打坐修炼。</p><p>修为 +30</p>`, [{ text: '继续', action: 'mountain' }]);
          }
          break;
          
        case 'fight':
          startCombat(choice.enemy);
          break;
          
        case 'prologue_accept':
          player.exp += 50;
          player.inventory.push('小还丹');
          player.materials['灵草'] = 3;
          advanceStory();
          showStory(`
            <p>老者微微一笑："好，此玉简赠予你，内有入门功法。"</p>
            <p>"修仙之路漫漫，切记心正道直。"</p>
            <p>说完，老者化作一道金光消失不见。</p>
            <p style="color: #69f0ae;">修为 +50，获得 小还丹、灵草x3</p>
          `, [{ text: '踏上仙途', action: 'tutorial_begin_world', story: true }]);
          break;
          
        case 'sect_exam':
          if (hasReachedRealm(1)) {
            advanceStory();
            showStory(`
              <p>你通过了入门考核！</p>
              <p>长老点头道："根骨不错，从今日起你便是凌霄宗弟子。"</p>
              <p>你获得了一枚宗门令牌和一些修炼资源。</p>
              <p style="color: #69f0ae;">获得 铁剑、布衣</p>
            `, [{ text: '进入宗门', action: 'sect' }]);
            player.sect = '凌霄宗';
            player.factionAlignment = 'human';
            player.sectContribution = Math.max(0, player.sectContribution || 0);
            player.sectTotalContribution = Math.max(player.sectContribution, player.sectTotalContribution || 0);
            player.sectRank = getCurrentRankInfo().name;
            player.inventory.push('铁剑');
            player.inventory.push('布衣');
          } else {
            showStory(`
              <p>长老摇头："你的修为还不够，先回去修炼吧。"</p>
              <p>"至少要达到练气期才能入门。"</p>
            `, [{ text: '返回修炼', action: 'village' }]);
          }
          break;
          
        case 'cultivate': {
          const expGain = 30 + player.level * 35 + (player.phase || 0) * 12;
          const gain=Math.floor(expGain * getExpBonus());
          player.exp += gain;
          advanceGameTime(GAME_DAYS_PER_YEAR,'宗门修炼一年');
          checkLevelUp();
          showStory(`<p>你在藏经阁静修了一年，悟得大道。</p><p>修为 +${gain}</p><p style="color:#aaa">📅 ${getGameDateLabel()}</p>`, [{ text: '继续', action: 'sect' }]);
          break;
        }
        case 'cultivate_decade': showRetreatV2782(false); break;
        case 'retreat_execute_v2782': executeRetreatV2782(choice.planId); break;
        case 'retreat_animated_v2783': startBreakthroughVisualV2783(); break;
        case 'breakthrough_rest_v2798': restBreakthroughV2798(choice.days); break;
        case 'retreat_breakthrough_v2782': recoverBreakthroughV2781(); break;
        case 'retreat_longevity_v2782': showLongevityPanel(); break;

        case 'sect_battle':
          const sectEnemy = getEnemy();
          // 宗门日常试炼以练习为主，不再额外增加20%气血
          sectEnemy.hp = Math.floor(sectEnemy.hp * 1.05);
          sectEnemy.atk = Math.max(1, Math.floor(sectEnemy.atk * 0.9));
          sectEnemy.maxHp = sectEnemy.hp;
          showStory(`<p>你在试炼场遇到了 <b>${sectEnemy.name}</b>！</p>`, [
            { text: '⚔️ 战斗', action: 'fight', enemy: sectEnemy },
            { text: '← 返回', action: 'sect' }
          ]);
          break;
          
        case 'youmingu_explore':
          advanceGameTime(10,'幽冥谷探索');
          if (Math.random() > 0.4) {
            const ghostEnemy = { 
              name: Math.random() > 0.5 ? '幽冥鬼' : '鬼将', 
              hp: Math.floor(200 + player.level * 50), 
              atk: 40 + player.level * 10, 
              def: 20 + player.level * 5, 
              gold: 150 + player.level * 30, 
              exp: 200 + player.level * 50 
            };
            ghostEnemy.maxHp = ghostEnemy.hp;
            showStory(`<p>一只 <b>${ghostEnemy.name}</b> 从雾中浮现！</p>`, [
              { text: '⚔️ 战斗', action: 'fight', enemy: ghostEnemy }
            ]);
          } else {
            // 探索发现稀有材料
            const rareMats = ['血玉', '天心草', '魔核'];
            const found = rareMats[Math.floor(Math.random() * rareMats.length)];
            player.materials[found] = (player.materials[found] || 0) + 1;
            player.exp += Math.floor((50 + player.level * 20) * getExpBonus());
            showStory(`<p>你在幽冥谷中发现了一株${found}！修为也有所增长。</p>`, [{ text: '继续', action: 'youmingu' }]);
          }
          break;
          
        case 'boss_fight': {
          const storyBossName=getStoryEvent()?.boss;
          const storyBoss=makeAuthoredBossV286835(storyBossName);
          if(!storyBoss){showStory('<p>当前青云村地点剧情没有待挑战的 首领。</p>',[{text:'返回村庄',action:'village'}]);break;}
          if(storyBossName==='宗门试炼守将')startCombat(storyBoss,true,false);
          else prepareStoryBossV286826(storyBoss);
          break;
        }
        case 'boss_guardian':
          startCombat(makeAuthoredBossV286835('宗门试炼守将'),true,false);
          break;
        case 'boss_ghost_king':
          prepareStoryBossV286826(makeAuthoredBossV286835('幽冥鬼王'));
          break;
        case 'boss_blood_demon':
          prepareStoryBossV286826(makeAuthoredBossV286835('血魔老祖'));
          break;
        case 'tribulation':
        case 'tribulation_fight':
          if (hasReachedRealm(9, 3)) startCombat(makeAuthoredBossV286835('天劫'), false, true);
          else showStory(`<p>你的修为还不够，需要达到渡劫圆满才能挑战飞升天劫。</p>`, [{ text: '返回', action: 'village' }]);
          break;
          
        // 新地图处理
        case 'forest':
        case 'battlefield':
        case 'market':
        case 'home':
        case 'secret':
          showLocation(choice.action);
          break;
          
        case 'forest_explore':
          handleForestExplore();
          break;
          
        case 'forest_boss':
          const forestBoss = LOCATION_BOSSES['forest'];
          const forestEnemy = {
            name: forestBoss.name, hp: forestBoss.hp, maxHp: forestBoss.hp,
            atk: forestBoss.atk, def: forestBoss.def, gold: forestBoss.gold, exp: forestBoss.exp,
            phases: forestBoss.phases, skills: forestBoss.skills, phaseMessages: forestBoss.phaseMessages
          };
          startCombat(forestEnemy, true, false);
          break;
          
        case 'battlefield_explore':
          handleBattlefieldExplore();
          break;
          
        case 'battlefield_boss':
          const battleBoss = LOCATION_BOSSES['battlefield'];
          const battleEnemy = {
            name: battleBoss.name, hp: battleBoss.hp, maxHp: battleBoss.hp,
            atk: battleBoss.atk, def: battleBoss.def, gold: battleBoss.gold, exp: battleBoss.exp,
            phases: battleBoss.phases, skills: battleBoss.skills, phaseMessages: battleBoss.phaseMessages
          };
          startCombat(battleEnemy, true, false);
          break;
          
        case 'secret_explore':
          handleSecretExplore();
          break;
          
        case 'secret_boss':
          if (!hasSectSecretQualification()) { showSecretRealm(); break; }
          const secretBoss = LOCATION_BOSSES['secret'];
          const secretEnemy = {
            name: secretBoss.name, hp: secretBoss.hp, maxHp: secretBoss.hp,
            atk: secretBoss.atk, def: secretBoss.def, gold: secretBoss.gold, exp: secretBoss.exp,
            phases: secretBoss.phases, skills: secretBoss.skills, phaseMessages: secretBoss.phaseMessages
          };
          startCombat(secretEnemy, true, false);
          break;
          
        case 'market_switch_v2800': showMarketGearV2800(choice.category,choice.grade); break;
        case 'shop_weapon_set':
          showSetWeaponShop();
          break;
          
        case 'shop_armor_set':
          showSetArmorShop();
          break;
          
        case 'shop_rare_pill':
          showRarePillShop();
          break;
          
        case 'shop_rare_artifact':
          showRareArtifactShop();
          break;
          
        case 'shop_furniture':
          showFurnitureShop();
          break;
          
        case 'trip_v286821': showTripV286821(); break;
        case 'home_cultivate':
          handleHomeCultivate();
          break;
        case 'home_cultivate_decade':
          handleHomeCultivateDecade();
          break;
          
        case 'home_rest':
          handleHomeRest();
          break;
          
        case 'home_manage':
          showHomeManage();
          break;
          
        case 'home_upgrade':
          handleHomeUpgrade();
          break;
          
        case 'buy_set_item':
          if(!confirmGearPurchaseV2804(choice.item,choice.cost))break;
          if (player.gold >= choice.cost) {
            player.gold -= choice.cost;
            player.inventory.push(choice.item);
            showStory(`购买了 ${choice.item}！`, [{ text: '继续', action: 'market' }]);
          } else {
            showStory('灵石不足！', [{ text: '继续', action: 'market' }]);
          }
          break;
          
        case 'buy_furniture':
          buyFurnitureV2812(choice.item);break;
        case 'set_furniture_v2812':
          setFurnitureV2812(choice.item,choice.active);break;
        case 'remove_furniture':
          // A stale legacy button must never destroy owned furniture.
          showHomeManage();break;
      }
      updateStats();
    }
    
    // 迷雾森林探索
    function handleForestExplore() {
      advanceGameTime(5,'迷雾森林探索');
      // 迷路风险
      if (Math.random() < 0.2) {
        player.gold = Math.max(0, player.gold - 20);
        showStory(`<p>你在迷雾中迷失了方向...</p><p>走了很久才找到出路，损失了20灵石。</p>`, [{ text: '继续', action: 'forest' }]);
        return;
      }
      
      // 随机事件
      if (Math.random() < 0.3) {
        const eventResult = triggerRandomEvent('forest');
        if (eventResult) {
          const result = eventResult.event.effect(player);
          showStory(`<p>${eventResult.event.desc}</p><p style="color: #ffd700;">${result.text}</p>`, [{ text: '继续', action: 'forest' }]);
          return;
        }
      }
      
      // 战斗（高经验）
      const enemies = LOCATION_ENEMIES['forest'];
      const enemy = { ...enemies[Math.min(Math.floor(Math.random() * enemies.length), enemies.length - 1)] };
      enemy.maxHp = enemy.hp;
      enemy.exp = Math.floor(enemy.exp * 1.3); // 高经验
      
      showStory(`<p>你在迷雾中遇到了 <b>${enemy.name}</b>！</p>`, [
        { text: '⚔️ 战斗', action: 'fight', enemy: enemy },
        { text: '🏃 逃跑', action: 'forest' }
      ]);
    }
    
    // 古战场探索
    function handleBattlefieldExplore() {
      advanceGameTime(7,'古战场探索');
      // 随机事件
      if (Math.random() < 0.25) {
        const eventResult = triggerRandomEvent('battlefield');
        if (eventResult) {
          const result = eventResult.event.effect(player);
          showStory(`<p>${eventResult.event.desc}</p><p style="color: #ffd700;">${result.text}</p>`, [{ text: '继续', action: 'battlefield' }]);
          return;
        }
      }
      
      // 战斗（强力怪物）
      const enemies = LOCATION_ENEMIES['battlefield'];
      const enemy = { ...enemies[Math.min(Math.floor(Math.random() * enemies.length), enemies.length - 1)] };
      enemy.maxHp = enemy.hp;
      
      // 稀有装备掉落机会
      if (Math.random() < 0.1) {
        const setNames = ['青云', '玄铁', '紫金'];
        const setTypes = ['剑', '甲'];
        const item = setNames[Math.min(player.level, 2)] + setTypes[Math.floor(Math.random() * 2)];
        enemy.dropItem = item;
      }
      
      showStory(`<p>战场上飘来一个 <b>${enemy.name}</b>！</p>`, [
        { text: '⚔️ 战斗', action: 'fight', enemy: enemy }
      ]);
    }
    
    function miniRunV2778(){return player.sectData?.miniRealmV2778||null}
    function showMiniRealmV2778(){
      if(!sectCanManageV2866())return;
      const c=miniRunV2778(),wait=getBuildingWaitV2768('mini_secret');
      let text='<h3>🌟 宗门小秘境</h3><p>万象迷阵：随机事件 → 祝福三选一 → 守关抉择</p>';
      if(!c){
        text+=`<p>入境30灵石，耗时1游戏日，之后冷却7日。${wait?`还需${wait}日可再次进入。`:''}</p><p>入境后选择稳妥、遗迹或险境路线。基础取宝240灵石、180修为；守关450灵石、320修为。遗迹收益×1.15，险境×1.5，守关敌人随之增强。另带回本次采集材料与悟道修为。</p><p>首次击败守关傀儡并领取宝箱：额外300灵石、小还丹×2。</p><p>中途撤离只带回已采材料和悟道修为；守关战败丢失未结算收获，并扣身上灵石20%。</p>`;
        return showStory(text,[{text:'进入小秘境',action:'mini_enter_v2778',condition:()=>!wait&&player.gold>=30&&canAccessBuilding('mini_secret_realm').allowed},{text:'返回宗门大殿',action:'sect_hall'}]);
      }
      if(c.routeV2867===null)return showMiniRouteV2867(c);
      if(showMiniWeaveV286840(c))return;
      text+=miniWeaveTextV286840(c);
      const route=miniRouteV2867(c);text+=`<p>${route.name} · 取宝收益×${route.reward} · 守关气血×${route.hp} / 攻击×${route.atk}</p>`;
      const labels=['采集灵材','灵泉休整','守关抉择','守关待战','通关宝箱'];
      text+=`<p>当前：${labels[c.step]} · 已保存进度</p><p>待带回：${c.herbs}灵草、${c.fruit}仙果、${c.insight}悟道修为</p>`;
      let choices=[];
      if(c.step===0)choices=[{text:'🌿 采集灵草×4',pick:'herb'},{text:'🍎 采集仙果×2',pick:'fruit'}];
      if(c.step===1)choices=[{text:'💧 调息：恢复30%最大气血和灵力',pick:'rest'},{text:'📖 悟道：离境时额外120修为',pick:'insight'}];
      if(c.step===1)choices.push({text:'救援受伤同门：消耗小还丹×1，带回灵草×2、悟道修为80',pick:'rescue',condition:()=>player.inventory.includes('小还丹')});
      if(c.step===2)choices=[{text:`📦 安全取宝：${Math.floor(240*route.reward)}灵石、${Math.floor(180*route.reward)}修为并离境`,pick:'safe'},{text:`⚔️ 查看守关敌情（胜利后${Math.floor(450*route.reward)}灵石、${Math.floor(320*route.reward)}修为）`,pick:'challenge'}];
      if(c.step===3){text+=`<p>守关傀儡：气血${c.enemy.maxHp}，攻击${c.enemy.atk}，防御${c.enemy.def}。可先返回宗门补给，再继续挑战。</p>`;choices=[{text:'⚔️ 挑战守关傀儡',pick:'fight'}];}
      if(c.step===4)choices=[{text:'🏆 领取通关宝箱并离境',pick:'claim'}];
      choices=choices.map(x=>({text:x.text,condition:x.condition,action:'mini_choice_v2778',pick:x.pick,step:c.step,runId:c.id}));
      if(c.step<4)choices.push({text:'🚪 提前撤离（只带回已采材料和悟道修为）',action:'mini_choice_v2778',pick:'leave',step:c.step,runId:c.id});
      choices.push({text:'暂离 · 返回宗门补给',action:'sect_hall'});showStory(text,choices);
    }
    function enterMiniRealmV2778(){
      if(!sectCanManageV2866()||!canAccessBuilding('mini_secret_realm').allowed)return;
      if(miniRunV2778())return showMiniRealmV2778();
      if(getBuildingWaitV2768('mini_secret')||player.gold<30)return;
      const ok=commitMiniWeaveV286840(()=>{
        if(!beginBuildingOpV2768('mini_secret','mini_secret_realm'))throw Error('entry unavailable');
        player.sectData.miniSeqV2778=(player.sectData.miniSeqV2778||0)+1;
        player.sectData.miniRealmV2778={id:player.sectData.miniSeqV2778,step:0,herbs:0,fruit:0,insight:0,enemy:null,routeV2867:null,weaveV286840:createMiniWeaveV286840()};
      });
      if(ok)showMiniRealmV2778();
    }
    let miniClickAtV2778=0;
    function chooseMiniRealmV2778(pick,step,runId){
      if(!sectCanManageV2866()||Date.now()-miniClickAtV2778<400)return;
      const c=miniRunV2778();if(!c||c.id!==runId||c.step!==step||c.routeV2867===null)return;
      if(pick==='leave'&&step<4)return finishMiniRealmV2778('leave');
      const weave=miniWeaveV286840(c);if(weave&&(weave.pending||step<2))return;
      miniClickAtV2778=Date.now();
      if(step===0&&(pick==='herb'||pick==='fruit')){if(pick==='herb')c.herbs=4;else c.fruit=2;if(c.routeV2867===1)c.insight+=80;c.step=1;}
      else if(step===1&&(pick==='rest'||pick==='insight')){if(pick==='rest'){player.hp=Math.min(getMaxHp(),player.hp+Math.ceil(getMaxHp()*.3));player.mp=Math.min(getMaxMp(),player.mp+Math.ceil(getMaxMp()*.3));}else c.insight+=120;c.step=2;}
      else if(step===1&&pick==='rescue'){const pill=player.inventory.indexOf('小还丹');if(pill<0)return;player.inventory.splice(pill,1);c.insight+=80;c.herbs+=2;c.rescuedV2867=true;c.step=2;}
      else if(step===2&&pick==='safe')return finishMiniRealmV2778('safe');
      else if(step===2&&pick==='challenge'){
        const e=getEnemy();c.enemy={name:'秘境守关傀儡',hp:Math.ceil(e.maxHp*1.15),maxHp:Math.ceil(e.maxHp*1.15),atk:Math.ceil(e.atk*1.1),def:e.def,gold:0,exp:0,_realmLevel:e._realmLevel||0,_realmPhase:e._realmPhase||0,_miniRunV2778:c.id};const route=miniRouteV2867(c);c.enemy.hp=c.enemy.maxHp=Math.ceil(c.enemy.maxHp*route.hp);c.enemy.atk=Math.ceil(c.enemy.atk*route.atk);c.step=3;
      }
      else if(step===3&&pick==='fight'){if(player.hp<=1)return showFloatingText?.('请先恢复气血，再挑战守关傀儡。','#ffd76a');if(!saveGame())return;startCombat({...c.enemy},false,false,null);return;}
      else if(step===4&&pick==='claim')return finishMiniRealmV2778('clear');
      else return;
      updateStats();autoSave();showMiniRealmV2778();
    }
    function finishMiniRealmV2778(kind){
      if(finishMiniWeaveV286840(kind))return;
      if(!sectCanManageV2866())return;
      const c=miniRunV2778();if(!c||(kind==='safe'&&c.step!==2)||(kind==='clear'&&c.step!==4)||!['safe','clear','leave'].includes(kind))return;
      if(kind==='leave'&&c.step>=4)return;
      const first=kind==='clear'&&!player.sectData.miniFirstV2778;
      const route=miniRouteV2867(c);const gold=Math.floor((kind==='clear'?450:kind==='safe'?240:0)*route.reward)+(first?300:0),exp=Math.floor((kind==='clear'?320:kind==='safe'?180:0)*route.reward)+c.insight;
      player.sectData.miniRealmV2778=null;
      if(first){player.sectData.miniFirstV2778=true;player.inventory.push('小还丹','小还丹');}
      player.gold+=gold;player.exp+=exp;
      player.materials['灵草']=(player.materials['灵草']||0)+c.herbs;player.materials['仙果']=(player.materials['仙果']||0)+c.fruit;
      if(c.herbs)onCollectMaterial?.('灵草',c.herbs);if(c.fruit)onCollectMaterial?.('仙果',c.fruit);
      checkLevelUp();updateStats();autoSave();
      showStory(`<h3>📦 小秘境离境结算</h3><p>灵石 +${gold} · 修为 +${exp}</p><p>灵草×${c.herbs} · 仙果×${c.fruit}</p>${first?'<p>🌟 已含首次通关额外300灵石，另得小还丹×2。</p>':''}`,[{text:'返回小秘境入口',action:'mini_realm_v2778'},{text:'返回宗门',action:'sect_hall'}]);
    }
    function miniBattleResultV2778(enemy,win){
      const c=miniRunV2778();if(!c||c.step!==3||enemy?._miniRunV2778!==c.id)return;
      if(win){c.step=4;addCombatLog('🌟 守关通过！返回宗门大殿 → 继续小秘境，领取宝箱。','gold');}
      else{player.sectData.miniRealmV2778=null;addCombatLog('小秘境试炼结束，未结算收获遗失。');}
    }

    // 秘境探索
    function handleSecretExplore(jevSelection=null) {
      if (!hasSectSecretQualification()) return showSecretRealm();
      advanceGameTime(30,'万宗秘境探索');
      // 随机事件（高收益）
      if (jevSelection ? !!jevSelection.eventResult : Math.random() < 0.4) {
        const eventResult = jevSelection ? jevSelection.eventResult : triggerRandomEvent('secret');
        if (eventResult) {
          const result = eventResult.event.effect(player);
          showStory(`<p>${eventResult.event.desc}</p><p style="color: #ffd700;">${result.text}</p>`, [{ text: '继续', action: 'secret' }]);
          return;
        }
      }
      
      // 战斗（高收益）
      const enemies = LOCATION_ENEMIES['secret'];
      const enemy = { ...enemies[Math.min(Math.floor(Math.random() * enemies.length), enemies.length - 1)] };
      enemy.maxHp = enemy.hp;
      enemy.gold = Math.floor(enemy.gold * 1.5);
      enemy.exp = Math.floor(enemy.exp * 1.5);
      
      showStory(`<p>秘境深处出现了 <b>${enemy.name}</b>！</p>`, [
        { text: '⚔️ 战斗', action: 'fight', enemy: enemy },
        { text: '← 退出秘境', action: 'village' }
      ]);
    }
    
    // 套装武器店
    function showSetWeaponShop() { return showMarketGearV2800('weapon'); }

    function showSetArmorShop() { return showMarketGearV2800('armor'); }

    function showRarePillShop() {
      const items = [
        { name: '大还丹', cost: 120 },
        { name: '悟道丹', cost: 200 },
        { name: '天元丹', cost: 500 },
        { name: '高级灵兽丹', cost: 150 },
        { name: '仙兽丹', cost: 350 }
      ];
      
      let text = `<p>📍 <b>稀有丹药铺</b></p><p>灵石: <b>${player.gold}</b></p><hr>
        <h3>⏳ 延寿丹药</h3><p>购入后在储物袋服用。终身限量，不随突破重置。</p>
        <h3>突破丹药</h3><p>购入后在闭关突破预览中选用，每次只用一颗；尝试时消耗。</p>
        ${Object.entries(BREAKTHROUGH_PILLS_V28683).map(([n,d])=>`<p>${n}：成功率 +${Math.round(d.bonus*100)} 个百分点 · 需${CULTIVATION_REALMS[d.level].name} · 库存${player.inventory.filter(x=>x===n).length}</p><button class="choice-btn" onclick="buyBreakthroughPillV28683('${n}')" ${player.level<d.level||player.gold<d.cost?'disabled':''}>购买${n}（${d.cost}灵石）</button>`).join('')}<hr>
        ${Object.entries(LONGEVITY_PILLS).map(([name,d])=>{
          const used=normalizeLongevity(player.longevity).uses[name],owned=player.inventory.filter(n=>n===name).length;
          return `<p>${name}：+${d.years}年 · 需${CULTIVATION_REALMS[d.level].name} · 已服${used}/${d.limit} · 库存${owned}</p><button class="choice-btn" onclick="buyLongevityPill('${name}')" ${player.level<d.level||used+owned>=d.limit||player.gold<d.cost?'disabled':''}>购买${name}（${d.cost}灵石）</button>`;
        }).join('')}<hr>`;
      
      const choices = items.map(i => ({
        text: `🧪 ${i.name} (${i.cost}灵石)`,
        action: i.name === '高级灵兽丹' || i.name === '仙兽丹' ? 'buyPetMaterial' : 'buy',
        item: i.name,
        cost: i.cost
      }));
      
      choices.push({ text: '← 返回仙市', action: 'market' });
      
      showStory(text, choices);
    }
    
    // 稀有法宝店
    function showRareArtifactShop() {
      const items = [
        { name: '星辰砂', cost: 300 },
        { name: '龙血果', cost: 250 },
        { name: '血玉', cost: 200 }
      ];
      
      let text = `<p>📍 <b>法宝材料铺</b></p><p>灵石: <b>${player.gold}</b></p><hr>`;
      
      const choices = items.map(i => ({
        text: `💎 ${i.name} (${i.cost}灵石)`,
        action: 'buyArtifactMaterial',
        item: i.name,
        cost: i.cost
      }));
      
      choices.push({ text: '← 返回仙市', action: 'market' });
      
      showStory(text, choices);
    }
    
    function furnitureCatalogV2812(){return [
      {name:'聚灵阵',type:'exp',value:.1,cost:500,desc:'洞府修炼收益 +10%'},
      {name:'聚宝盆',type:'gold',value:.1,cost:400,desc:'战斗基础灵石奖励 +10%（不含补贴）'},
      {name:'炼器台',type:'atk',value:5,cost:300,desc:'基础攻击 +5'},
      {name:'护法阵',type:'def',value:5,cost:300,desc:'基础防御 +5'},
      {name:'高级聚灵阵',type:'exp',value:.2,cost:1200,desc:'洞府修炼收益 +20%'},
      {name:'天工台',type:'atk',value:15,cost:1000,desc:'基础攻击 +15'}
    ];}
    function normalizeHomeV2812(p){
      const h=p.home ||= {level:1,furniture:[]};
      h.level=Math.max(1,Math.min(5,Math.floor(Number(h.level)||1)));
      const seen=new Set(),items=[],catalog=furnitureCatalogV2812();let refund=0;
      for(const f of Array.isArray(h.furniture)?h.furniture:[]){
        if(!f||typeof f.name!=='string')continue;
        const d=catalog.find(x=>x.name===f.name);
        if(seen.has(f.name)){if(d)refund+=d.cost;continue;}
        seen.add(f.name);items.push(d?{name:d.name,type:d.type,value:d.value,active:f.active!==false}:f);
      }
      h.furniture=items;
      if(refund){p.gold=(Number(p.gold)||0)+refund;h.duplicateRefundV2812=(Number(h.duplicateRefundV2812)||0)+refund;}
      return h;
    }
    function buyFurnitureV2812(name){
      const h=normalizeHomeV2812(player),d=furnitureCatalogV2812().find(f=>f.name===name);
      if(!d)return;
      if(h.furniture.some(f=>f.name===name)){showFurnitureShop('这件家具已经拥有，收纳后也无需再买。');return;}
      if(player.gold<d.cost){showFurnitureShop('灵石不足，还差 '+(d.cost-player.gold)+' 灵石。');return;}
      if(typeof window.confirm!=='function'||!window.confirm('购买 '+d.name+'？\n'+d.desc+'\n消耗 '+d.cost+' 灵石，剩余 '+(player.gold-d.cost)+' 灵石。\n每种限购一次，购买后自动摆放。'))return;
      player.gold-=d.cost;h.furniture.push({name:d.name,type:d.type,value:d.value,active:true});
      autoSave();updateStats();showFurnitureShop('购买成功，已摆放：'+d.name);
    }
    function setFurnitureV2812(name,active){
      const f=normalizeHomeV2812(player).furniture.find(x=>x.name===name);if(!f)return;
      f.active=!!active;autoSave();updateStats();showHomeManage();
    }

    // 家具店
    function showFurnitureShop(notice='') {
      const h=normalizeHomeV2812(player),choices=[];
      let text=`<section class="home-board-v2812"><h3>🪑 家具铺</h3><p>持有灵石 <b>${player.gold}</b> · 每种限购一件</p><p>购买前需确认；收纳不销毁，重新摆放免费。不同名称的家具可同时生效。</p>${notice?`<p class="home-notice-v2812">${notice}</p>`:''}<div class="home-grid-v2812">`;
      for(const d of furnitureCatalogV2812()){
        const owned=h.furniture.find(f=>f.name===d.name);
        text+=`<article><h4>${d.name}</h4><p>${d.desc}</p><strong>${owned?(owned.active===false?'已拥有 · 已收纳':'已拥有 · 已摆放'):d.cost+' 灵石'}</strong></article>`;
        if(!owned)choices.push({text:`购买 ${d.name} · ${d.cost}灵石${player.gold<d.cost?'（灵石不足）':''}`,action:'buy_furniture',item:d.name,condition:()=>player.gold>=d.cost});
      }
      text+='</div></section>';choices.push({text:'📋 管理洞府家具',action:'home_manage'},{text:'返回仙市',action:'market'});showStory(text,choices);
    }
    
    // 洞府修炼
    function handleHomeCultivate(){showRetreatV2782(true,1);}

    let retreatPlanV2782=null,retreatSeqV2782=0;
    function computeRetreatV2782(home=false,maxYears=10){
      maxYears=maxYears===1?1:10;
      const need=getCurrentExpNeed(),exp=Math.max(0,Number(player.exp)||0),missing=Math.max(0,need-exp);
      const now=Math.max(0,player.worldTime?.totalDays||0),remaining=getTotalMaxLifespan()-player.age;
      const bonus=Math.max(1,Number(getExpBonus())||1)*(home?Math.max(1,1+(Number(calculateFurnitureBonus().exp)||0)):1);
      const rate=need/(GAME_DAYS_PER_YEAR*10)*bonus;
      const fullDays=missing?Math.ceil(missing/rate):0;
      const safeDays=Math.max(0,Math.floor((remaining-1)*GAME_DAYS_PER_YEAR-(now%GAME_DAYS_PER_YEAR)));
      const tournamentDays=Math.max(0,(getNextTournamentYear()-1)*GAME_DAYS_PER_YEAR-now);
      const days=Math.min(GAME_DAYS_PER_YEAR*maxYears,fullDays,safeDays,tournamentDays);
      const gain=Math.min(missing,Math.floor(days*rate+1e-8));
      let reason=maxYears===1?'达到一年上限':'达到十年上限';
      if(!missing)reason='修为已满，可直接尝试突破';
      else if(safeDays===0)reason='寿元不足，先延寿或突破';
      else if(days===fullDays)reason='修为圆满，提前出关';
      else if(days===tournamentDays)reason='百年大比开启，提前出关';
      else if(days===safeDays)reason='保留至少一年寿元，提前出关';
      return {home,maxYears,need,exp,now,level:player.level,phase:player.phase||0,days,gain,remaining,reason,rate,safeDays,tournamentDays};
    }
    function showRetreatV2782(home=false,maxYears=10){
      if(player.exp>=getCurrentExpNeed()&&!player.breakthrough?.isAnimating)return showRetreatBreakthroughV2798();
      if(gameState==='combat'||gameState==='combat-ending')return;
      const p=computeRetreatV2782(home,maxYears);p.id=++retreatSeqV2782;retreatPlanV2782=p;
      const years=(p.days/GAME_DAYS_PER_YEAR).toFixed(2);
      const choices=[];
      if(player.breakthrough?.isAnimating||p.exp>=p.need)choices.push({text:'✨ 继续突破（不消耗闭关时间）',action:'retreat_breakthrough_v2782'});
      else if(p.days>0&&p.gain>0)choices.push({text:`🧘 入关 · ${p.days}天 / 修为+${p.gain}`,action:'retreat_execute_v2782',planId:p.id});
      if(p.remaining<=1)choices.push({text:'查看延寿办法',action:'retreat_longevity_v2782'});
      if(getPendingTournamentCentury())choices.push({text:'📯 已有大比可参加',action:'sect_tournament'});
      choices.push({text:'返回',action:home?'home':'sect'});
      showStory(`<h3>🧘 ${home?'洞府':'宗门'}闭关 · 最多${p.maxYears===1?'一年':'十年'}</h3><p>修为：${p.exp} / ${p.need}</p><p>预计耗时：${p.days}天（约${years}年）<br>预计修为：+${p.gain}<br>当前剩余寿元：${Math.max(0,p.remaining)}年</p><p style="color:#ffd98a">${p.reason}</p><p>修为满即出关；不连续跨境界，超额修为不清零。保留至少一年寿元，遇下届百年大比开启即停。修为收益受当前修炼加成${home?'和洞府家具':''}影响。</p><p>出关恢复气血和灵力；突破另行点击，成功率与失败冷却照常生效。</p>`,choices);
    }
    function executeRetreatV2782(id){
      if(gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating)return;
      const p=retreatPlanV2782;if(!p||p.id!==id)return;
      retreatPlanV2782=null;
      const fresh=computeRetreatV2782(p.home,p.maxYears);
      if(['exp','need','now','level','phase','days','gain','remaining'].some(k=>p[k]!==fresh[k]))return showRetreatV2782(p.home,p.maxYears);
      if(p.days<=0||p.gain<=0)return showRetreatV2782(p.home,p.maxYears);
      advanceGameTime(p.days,p.home?'洞府闭关':'宗门闭关');
      player.exp+=p.gain;
      player.hp=getMaxHp();player.mp=getMaxMp();
      if(!player.breakthrough)player.breakthrough={isAnimating:false,cooldownDays:0};
      player.breakthrough.pendingBreakthrough=player.exp>=getCurrentExpNeed();
      updateStats();autoSave();
      const choices=[];
      if(player.breakthrough.pendingBreakthrough)choices.push({text:'✨ 出关 · 播放突破动画',action:'retreat_animated_v2783'});
      if(player.breakthrough.pendingBreakthrough)choices.push({text:'✨ 出关 · 尝试突破（无需动画）',action:'retreat_breakthrough_v2782'});
      if(getPendingTournamentCentury())choices.push({text:'📯 查看百年大比',action:'sect_tournament'});
      choices.push({text:'返回',action:p.home?'home':'sect'});
      showStory(`<h3>🌤️ 闭关结束</h3><p>实际耗时：${p.days}天（约${(p.days/GAME_DAYS_PER_YEAR).toFixed(2)}年）<br>修为 +${p.gain}<br>气血与灵力已恢复。</p><p>${p.reason}</p><p>现年${player.age}岁，剩余寿元${Math.max(0,getTotalMaxLifespan()-player.age)}年。</p><p>${getGameDateLabel()}</p>`,choices);
    }

    function handleHomeCultivateDecade(){showRetreatV2782(true);}

    // 洞府休息
    function handleHomeRest() {
      const furnitureBonus = calculateFurnitureBonus();
      advanceGameTime(1,'洞府休息');
      const healBonus = 1 + furnitureBonus.def * 0.02;
      
      player.hp = getMaxHp();
      player.mp = getMaxMp();
      
      showStory(`<p>你在洞府中休息，身心舒畅。</p><p style="color: #69f0ae;">气血和灵力完全恢复！</p>`, [{ text: '继续', action: 'home' }]);
    }
    
    // 洞府管理
    function showHomeManage(){
      const h=normalizeHomeV2812(player),bonus=calculateFurnitureBonus(),active=h.furniture.filter(f=>f.active!==false).length,choices=[];
      let text=`<section class="home-board-v2812"><h3>🏡 洞府管理 · Lv.${h.level}</h3><p>已拥有 ${h.furniture.length} 件 · 摆放 ${active} 件 · 收纳 ${h.furniture.length-active} 件</p><p class="home-notice-v2812">当前生效：${bonus.desc||'暂无家具加成'}</p><p>洞府等级额外提供 ${(h.level-1)*5}% 洞府修炼收益。收纳的家具保留所有权，不再提供增益。</p>${h.duplicateRefundV2812?`<p>旧存档重复家具已合并，累计返还 ${h.duplicateRefundV2812} 灵石。</p>`:''}<div class="home-grid-v2812">`;
      for(const f of h.furniture){
        const d=furnitureCatalogV2812().find(x=>x.name===f.name);if(!d)continue;
        const active=f.active!==false;
        text+=`<article><h4>${d.name}</h4><p>${d.desc}</p><strong>${active?'🟢 已摆放 · 生效中':'📦 已收纳'}</strong></article>`;
        choices.push({text:(active?'收纳 ':'摆放 ')+f.name,action:'set_furniture_v2812',item:f.name,active:!active});
      }
      if(!h.furniture.length)text+='<p>洞府尚未添置家具，可先购买聚灵阵辅助修炼。</p>';
      text+='</div></section>';
      choices.push({text:'🪑 购置家具',action:'shop_furniture'});
      if(h.level<5)choices.push({text:`升级至 Lv.${h.level+1} · ${h.level*200}灵石 · 洞府修炼额外 +5%`,action:'home_upgrade',condition:()=>player.gold>=h.level*200});
      choices.push({text:'返回洞府',action:'home'});showStory(text,choices);
    }
    
    // 洞府升级
    function handleHomeUpgrade(){
      const h=normalizeHomeV2812(player),cost=h.level*200;
      if(h.level>=5||player.gold<cost){showHomeManage();return;}
      if(typeof window.confirm!=='function'||!window.confirm(`升级洞府至 Lv.${h.level+1}？\n消耗 ${cost} 灵石，剩余 ${player.gold-cost} 灵石。\n洞府修炼加成：${(h.level-1)*5}% → ${h.level*5}%`))return;
      player.gold-=cost;h.level++;autoSave();updateStats();showHomeManage();
    }
    



    // ================== 3D低模角色（Three.js） ==================
    const AVATAR3D = {
      ready:false, failed:false, renderer:null, scene:null, camera:null,
      root:null, rig:null, leftArm:null, rightArm:null, leftLeg:null, rightLeg:null,
      robe:null, head:null, lastFacing:0, startedAt:performance.now()
    };

    function setWorld3DBadge(text, fallback=false) { return; }

    function avatarMat(color, rough=.78, metal=.02) {
      return new THREE.MeshStandardMaterial({color, roughness:rough, metalness:metal, flatShading:true});
    }

    function mesh3D(geometry, material, parent, x=0,y=0,z=0) {
      const m=new THREE.Mesh(geometry,material); m.position.set(x,y,z); parent.add(m); return m;
    }

    function buildLowPolyCultivator() {
      const root=new THREE.Group();
      const rig=new THREE.Group(); root.add(rig);
      const robeMat=avatarMat(0x49668f), robeDark=avatarMat(0x2f405e), skin=avatarMat(0xe5c7a7);
      const hair=avatarMat(0x1e2025,.9), gold=avatarMat(0xd5ae54,.5,.25), boot=avatarMat(0x292b30,.95);
      const metal=avatarMat(0xcbd4dc,.28,.72), wood=avatarMat(0x5c392a,.8);

      // 双腿：枢轴在髋部，走路时前后摆动
      const makeLeg=(x)=>{
        const g=new THREE.Group(); g.position.set(x,15,0); rig.add(g);
        mesh3D(new THREE.CylinderGeometry(2.7,3.1,14,6), robeDark,g,0,-7,0);
        mesh3D(new THREE.BoxGeometry(6.2,3.2,8), boot,g,0,-14.5,1.2);
        return g;
      };
      const leftLeg=makeLeg(-4.4), rightLeg=makeLeg(4.4);

      // 长袍主体
      const robe=mesh3D(new THREE.CylinderGeometry(8.7,13.3,25,8),robeMat,rig,0,27,0);
      // 下摆稍向后展开
      mesh3D(new THREE.CylinderGeometry(12.5,15.4,8,8),robeMat,rig,0,14.8,-.8);
      // 腰带
      mesh3D(new THREE.CylinderGeometry(9.2,9.2,2.5,10),gold,rig,0,29,0);
      // 胸襟
      const lapel=mesh3D(new THREE.BoxGeometry(3.2,15,.8),gold,rig,0,36,8.2); lapel.rotation.z=-.18;

      // 手臂，肩部为旋转枢轴
      const makeArm=(x,side)=>{
        const g=new THREE.Group(); g.position.set(x,38,0); rig.add(g);
        const upper=mesh3D(new THREE.CylinderGeometry(2.6,2.25,16,6),robeMat,g,0,-7,0);
        upper.rotation.z=side*.10;
        mesh3D(new THREE.SphereGeometry(2.5,7,5),skin,g,side*.8,-15,0);
        return g;
      };
      const leftArm=makeArm(-10.3,-1), rightArm=makeArm(10.3,1);

      // 头、发型与发髻
      const head=mesh3D(new THREE.SphereGeometry(7.4,10,7),skin,rig,0,51,0);
      head.scale.z=.93;
      const hairCap=mesh3D(new THREE.SphereGeometry(7.65,10,6,0,Math.PI*2,0,Math.PI*.55),hair,rig,0,53.2,-.3);
      hairCap.rotation.x=.10;
      mesh3D(new THREE.CylinderGeometry(3.0,3.7,7,7),hair,rig,0,61,0);
      mesh3D(new THREE.SphereGeometry(3.5,7,5),hair,rig,0,65,0);
      // 簪子
      const pin=mesh3D(new THREE.CylinderGeometry(.55,.55,12,6),gold,rig,0,64.5,0); pin.rotation.z=Math.PI/2;
      // 简化五官，正面朝 +Z
      mesh3D(new THREE.SphereGeometry(.7,6,4),hair,rig,-2.5,52.2,6.7);
      mesh3D(new THREE.SphereGeometry(.7,6,4),hair,rig,2.5,52.2,6.7);

      // 背剑
      const sword=new THREE.Group(); sword.position.set(-9,35,-5); sword.rotation.z=-.48; rig.add(sword);
      mesh3D(new THREE.BoxGeometry(2.4,30,1.2),metal,sword,0,0,0);
      mesh3D(new THREE.BoxGeometry(10,1.8,2.2),gold,sword,0,-16,0);
      mesh3D(new THREE.CylinderGeometry(1.2,1.2,8,6),wood,sword,0,-21,0);

      // 灵气小玉佩
      const jade=mesh3D(new THREE.OctahedronGeometry(2.2,0),avatarMat(0x6fe6d2,.35,.12),rig,6,27,9);
      jade.rotation.z=.25;

      root.userData={leftArm,rightArm,leftLeg,rightLeg,robe,head,rig,jade};
      return root;
    }

    function init3DAvatar() {
      if(AVATAR3D.ready || AVATAR3D.failed)return;
      // 单文件离线版统一使用轻量2D角色，完全不依赖Three.js。
      AVATAR3D.failed=true; setWorld3DBadge('⚡ 离线流畅模式 · 2D',true); return;
      // 低配/手机优先保证移动60FPS：不创建全屏透明WebGL上下文。
      if(PERF_CONFIG.ultraSmooth){
        AVATAR3D.failed=true; setWorld3DBadge('⚡ 流畅模式 · 2D',true); return;
      }
      if(typeof THREE==='undefined'){
        AVATAR3D.failed=true; setWorld3DBadge('2D 兼容模式',true); return;
      }
      try {
        const canvas=document.getElementById('world3dCanvas'); if(!canvas)return;
        const lowMem=PERF_CONFIG.lowEnd;
        const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!lowMem,powerPreference:'high-performance'});
        renderer.setClearColor(0x000000,0);
        renderer.setPixelRatio(Math.min(lowMem?1:1.25,window.devicePixelRatio||1));
        renderer.outputEncoding=THREE.sRGBEncoding;
        const scene=new THREE.Scene();
        const camera=new THREE.OrthographicCamera(-500,500,300,-300,1,1200);
        camera.position.set(0,0,500); camera.lookAt(0,0,0);
        scene.add(new THREE.HemisphereLight(0xe9f4ff,0x39402c,1.15));
        const key=new THREE.DirectionalLight(0xffe5bd,1.35); key.position.set(-120,180,260); scene.add(key);
        const rim=new THREE.DirectionalLight(0x8ccfff,.55); rim.position.set(150,80,-120); scene.add(rim);
        const root=buildLowPolyCultivator(); scene.add(root);
        const u=root.userData;
        Object.assign(AVATAR3D,{ready:true,renderer,scene,camera,root,rig:u.rig,leftArm:u.leftArm,rightArm:u.rightArm,leftLeg:u.leftLeg,rightLeg:u.rightLeg,robe:u.robe,head:u.head,jade:u.jade});
        resize3DAvatar(); setWorld3DBadge(PERF_CONFIG.lowEnd?'3D角色 · 性能模式':'3D 角色');
      } catch(err) {
        console.warn('3D角色初始化失败，已回退2D：',err);
        AVATAR3D.failed=true; setWorld3DBadge('2D 兼容模式',true);
      }
    }

    function resize3DAvatar() {
      if(!AVATAR3D.ready)return;
      const canvas=document.getElementById('world3dCanvas'); if(!canvas)return;
      const w=Math.max(1,canvas.clientWidth||innerWidth), h=Math.max(1,canvas.clientHeight||innerHeight);
      AVATAR3D.renderer.setSize(w,h,false);
      const cam=AVATAR3D.camera; cam.left=-w/2;cam.right=w/2;cam.top=h/2;cam.bottom=-h/2;cam.updateProjectionMatrix();
    }

    function render3DAvatar(t) {
      if(!AVATAR3D.ready || document.hidden)return;
      const canvas=document.getElementById('world3dCanvas'); if(!canvas)return;
      if(canvas.width===0 || Math.abs((canvas.clientWidth||0)-(AVATAR3D._cw||0))>2 || Math.abs((canvas.clientHeight||0)-(AVATAR3D._ch||0))>2){
        AVATAR3D._cw=canvas.clientWidth;AVATAR3D._ch=canvas.clientHeight;resize3DAvatar();
      }
      const p=FLAT_WORLD.player, cam2=FLAT_WORLD.camera;
      const vw=canvas.clientWidth||innerWidth, vh=canvas.clientHeight||innerHeight;
      const sx=p.x-cam2.x, sy=p.y-cam2.y;
      AVATAR3D.root.position.set(sx-vw/2, vh/2-sy+2, 0);
      const moving=!!FLAT_WORLD.moving;
      const phase=(t||performance.now())*.012;
      const stride=moving?Math.sin(phase):0;
      const bob=moving?Math.abs(Math.sin(phase))*2.2:Math.sin((t||0)*.002)*.45;
      AVATAR3D.rig.position.y=bob;
      AVATAR3D.leftArm.rotation.x=stride*.72; AVATAR3D.rightArm.rotation.x=-stride*.72;
      AVATAR3D.leftLeg.rotation.x=-stride*.65; AVATAR3D.rightLeg.rotation.x=stride*.65;
      AVATAR3D.robe.rotation.z=moving?Math.sin(phase*.5)*.018:0;
      AVATAR3D.jade.rotation.y=(t||0)*.0025;
      // 根据屏幕移动方向转身；模型正面为 +Z
      if(moving){
        const dx=FLAT_WORLD.moveDirX||0, dy=FLAT_WORLD.moveDirY||0;
        AVATAR3D.lastFacing=Math.atan2(dx,dy);
      }
      AVATAR3D.rig.rotation.y=AVATAR3D.lastFacing;
      apply3DAvatarRealmStyle(player?.level || 0);
      // 轻微俯视感
      AVATAR3D.root.rotation.x=-.08;
      const scale=Math.max(.86,Math.min(1.08,Math.min(vw/900,vh/600)+.18));
      AVATAR3D.root.scale.setScalar(scale);
      AVATAR3D.renderer.render(AVATAR3D.scene,AVATAR3D.camera);
    }

    // ================== 四大区域系统 ==================
    // 地域资料仍保留原有四方世界观设定；实际游玩已改为四张独立地图，通过选项切换。
    const WORLD_REGION_CENTER = { x:1100, y:725 };
    const WORLD_REGIONS = {
      north: {
        id:'north', name:'北域 · 极寒仙疆', shortName:'北域', icon:'❄️', color:'#b0d4ff',
        desc:'终年积雪的极寒之地，仙迹深埋冰层，珍稀灵药与寒属性妖兽并存。',
        dangerLevel:3, maxMonsters:5, terrain:'snow', atmosphere:'冷冽', isSafe:false, immortalSect:'凤栖坞',
        bounds:{xMin:1100,xMax:2200,yMin:0,yMax:725},
        monsters:['冰霜巨狼','雪域妖狐','冰晶傀儡','寒冰蛟龙'],
        materials:['雪莲','冰晶石','万年寒玉','仙灵草']
      },
      south: {
        id:'south', name:'南域 · 繁华人间', shortName:'南域', icon:'🏘️', color:'#9bc85a',
        desc:'人类修士主要聚居地，宗门商路与仙市繁盛，是大多数修士踏上仙途的起点。',
        dangerLevel:1, maxMonsters:2, terrain:'plains', atmosphere:'祥和', isSafe:true, immortalSect:null,
        bounds:{xMin:0,xMax:1100,yMin:725,yMax:1450},
        monsters:['山贼','野狼','妖兽','邪修'],
        materials:['灵草','仙果','妖丹']
      },
      east: {
        id:'east', name:'东域 · 灵兽森林', shortName:'东域', icon:'🌲', color:'#65c66f',
        desc:'古木遮天，灵兽遍野。珍稀材料极多，也潜伏着远古血脉与森林霸主。',
        dangerLevel:2, maxMonsters:4, terrain:'forest', atmosphere:'幽静', isSafe:false, immortalSect:null,
        bounds:{xMin:1100,xMax:2200,yMin:725,yMax:1450},
        monsters:['灵兽','树精','毒蟒','远古巨猿'],
        materials:['千年灵芝','兽骨','灵木','龙血果']
      },
      west: {
        id:'west', name:'西域 · 魔渊之地', shortName:'西域', icon:'☠️', color:'#cf6f6f',
        desc:'靠近魔族势力范围的危险禁地，魔气弥漫，鬼物与魔修游荡，弱者难以久留。',
        dangerLevel:4, maxMonsters:6, terrain:'dark', atmosphere:'阴森', isSafe:false, immortalSect:null,
        bounds:{xMin:0,xMax:1100,yMin:0,yMax:725},
        monsters:['魔修','幽冥鬼','鬼将','魔界邪兽'],
        materials:['魔核','血玉','暗灵草','幽冥花']
      }
    };

    const REGION_ENTRY_EFFECTS = {
      north:{message:'❄️ 寒风刺骨，你踏入北域极寒仙疆……',debuff:{type:'cold',desc:'灵力恢复速度 -20%'}},
      south:{message:'🌤️ 暖风拂面，你回到南域繁华人间。',debuff:null},
      east:{message:'🌲 古木遮天，你进入东域灵兽森林……',debuff:null},
      west:{message:'☠️ 魔气侵体，你踏入危险的西域魔渊！',debuff:{type:'corruption',desc:'气血上限 -10%'}}
    };


    // ================== 独立地图 / 选项前往系统 ==================
    // 不再把南、东、北、西四域拼在同一张大地图；每个地域是独立地图实例。
    // 解锁条件保留在“前往地域”选项上：东域筑基、北域筑基、西域金丹。
    const REGION_UNLOCK_LEVEL = {
      south: 0,
      east: 2,
      north: 2,
      west: 3
    };

    function isRegionUnlocked(regionId) {
      const required = REGION_UNLOCK_LEVEL[regionId];
      if (required === undefined) return true;
      return (player?.level || 0) >= required;
    }

    function getRegionUnlockRealmName(regionId) {
      const required = REGION_UNLOCK_LEVEL[regionId] || 0;
      return CULTIVATION_REALMS[required]?.name || `${required}境`;
    }

    function getRegionUnlockStatus(regionId) {
      if (isRegionUnlocked(regionId)) return '已解锁';
      return `🔒 需要${getRegionUnlockRealmName(regionId)}境`;
    }


    const MAP_NPCS = {
      mentor: {
        id:'mentor', poiId:'mentor_npc', name:'云游道人', title:'南域指路人', icon:'🧙', color:'#ffd76a', region:'south',
        desc:'熟知南域风物，会给初行修士一些提点。',
        talks:[
          '修仙不只是闭门打坐，四处走走，常会有意外所得。',
          '先稳住境界，再谈远行。南域虽平和，也藏着不少机缘。',
          '若拿不定主意，就先去做宗门任务，资源来得最踏实。',
          '地图上的游荡妖物虽然危险，却也是灵石、丹药与装备的重要来源。'
        ],
        intel:[
          '青云村附近最适合初入仙途的修士活动，先熟悉地图再去远域。',
          '百宝阁能补充基础丹药；仙市则更容易找到稀有材料。',
          '南域怪物不算强，但掉落品质也普遍低于其余三域。'
        ],
        rewardText:'灵石 ×60、小还丹 ×1',
        quickText:'📖 查看修行指引', quickAction:'map_npc_help',
        quest:{id:'mentor_herb',title:'采药启程',desc:'替云游道人收集 3 株灵草。',item:'灵草',count:3,rewardText:'灵石 ×120、修为 +35、好感 +12'}
      },
      beast: {
        id:'beast', poiId:'beast_npc', name:'牧灵童子', title:'御兽堂学徒', icon:'🧒', color:'#7ee0b8', region:'east',
        desc:'常在东域照看灵兽，懂得一些驯养门道。',
        talks:[
          '灵宠不是越凶越好，能与你配合的，才是好伙伴。',
          '东域的妖兽多半性子野，出手前最好先备好丹药。',
          '若要培养灵宠，先去灵兽谷看看血脉与天赋。',
          '妖丹里残留着妖兽精气，对判断灵兽血脉很有用。'
        ],
        intel:[
          '迷雾森林里的普通妖物更容易掉妖丹，适合顺路收集。',
          '东域怪物比南域危险，装备掉落的品质上限也会更高。',
          '灵兽谷适合培养已经获得的灵宠，别只顾着捕捉而忘了养成。'
        ],
        rewardText:'聚灵丹 ×1、灵草 ×2',
        quickText:'🐾 前往灵兽谷', quickAction:'pets',
        quest:{id:'beast_core',title:'辨妖识灵',desc:'替牧灵童子收集 2 枚妖丹。',item:'妖丹',count:2,rewardText:'聚灵丹 ×2、修为 +70、好感 +12'}
      },
      elder: {
        id:'elder', poiId:'elder_npc', name:'宗门执事', title:'凌霄宗外务执事', icon:'👴', color:'#9fd3ff', region:'north',
        desc:'负责宗门外务与弟子差事，消息灵通。',
        talks:[
          '宗门看重的不是空口豪言，而是你能带回多少成果。',
          '若想升职，别忘了累计宗门贡献，光花掉当前贡献可不够。',
          '北域风雪重，修为不稳时，切莫轻易独自登山。',
          '仙果可入药，也可供宗门炼制养元之物，外务堂一直有缺口。'
        ],
        intel:[
          '宗门差事完成后记得及时提交，贡献既能消费，也会记录累计总数。',
          '北域怪物境界更高，越级挑战时境界威压会非常明显。',
          '问道山与凌霄宗都在北域，宗门相关主线最好在这里集中处理。'
        ],
        rewardText:'宗门贡献 +15、灵石 ×40',
        quickText:'⛩ 前往凌霄宗', quickAction:'sect',
        quest:{id:'elder_fruit',title:'外务补给',desc:'替外务堂收集 3 枚仙果。',item:'仙果',count:3,rewardText:'宗门贡献 +45、灵石 ×100、好感 +12'}
      },
      trader: {
        id:'trader', poiId:'trader_npc', name:'行脚商', title:'魔渊补给商', icon:'🧔', color:'#ffb2a2', region:'west',
        desc:'往来西域与南域之间，专做修士补给生意。',
        talks:[
          '西域怪物掉落更凶，也更值钱，敢打就别空手而归。',
          '法宝和丹药别只囤着，真正危险的时候，舍得用才能活命。',
          '要入古战场，身上多备几枚丹药，总不会错。',
          '星辰砂在仙市能买到，我也常拿它补修运输法器。'
        ],
        intel:[
          '西域普通怪也有机会掉更高品质装备，精英怪的收益尤其明显。',
          '星辰砂可在南域仙市购买，某些宗门差事也会需要它。',
          '古战场风险最高，最好先去炼丹房把补给准备齐全。'
        ],
        rewardText:'灵石 ×80、血玉 ×1',
        quickText:'🔥 前往炼丹房', quickAction:'alchemy',
        quest:{id:'trader_stardust',title:'修补商舟',desc:'替行脚商准备 1 份星辰砂。',item:'星辰砂',count:1,rewardText:'灵石 ×420、大还丹 ×1、修为 +100、好感 +12'}
      }
    };

    function ensureMapNpcState() {
      if (!player.mapNpc || typeof player.mapNpc !== 'object') player.mapNpc = createDefaultMapNpcState();
      for (const k of ['chatted','rewards','affinity','quests','talkDays','intelDays']) {
        if (!player.mapNpc[k] || typeof player.mapNpc[k] !== 'object') player.mapNpc[k] = {};
      }
      return player.mapNpc;
    }

    function getMapNpcDayKey() {
      return String(Math.floor(Number(player?.worldTime?.totalDays) || 0));
    }
    function getMapNpcRewardDayKey(){ return getMapNpcDayKey(); }
    function hasClaimedMapNpcRewardToday(npcId) {
      return ensureMapNpcState().rewards[npcId] === getMapNpcDayKey();
    }
    function getMapNpcAffinity(npcId){ return Math.max(0,Math.min(100,Number(ensureMapNpcState().affinity[npcId])||0)); }
    function addMapNpcAffinity(npcId,delta){
      const s=ensureMapNpcState(), before=getMapNpcAffinity(npcId);
      s.affinity[npcId]=Math.max(0,Math.min(100,before+(Number(delta)||0)));
      return s.affinity[npcId]-before;
    }
    function getMapNpcRelation(npcId){
      const a=getMapNpcAffinity(npcId);
      if(a>=80)return '莫逆之交'; if(a>=60)return '亲近'; if(a>=35)return '信任'; if(a>=15)return '熟面'; return '初识';
    }
    function getMapNpcQuestState(npcId){
      const s=ensureMapNpcState();
      if(!s.quests[npcId]||typeof s.quests[npcId]!=='object')s.quests[npcId]={status:'available'};
      return s.quests[npcId];
    }
    function getMapNpcQuestProgress(npcId){
      const npc=MAP_NPCS[npcId], q=npc?.quest;if(!q)return {have:0,need:0,ready:false};
      const have=Number(player.materials?.[q.item]||0);return {have,need:q.count,ready:have>=q.count};
    }
    function getMapNpcQuestButton(npcId){
      const npc=MAP_NPCS[npcId], q=npc?.quest, st=getMapNpcQuestState(npcId);if(!q)return null;
      if(st.status==='completed')return {text:`✅ 支线已完成：${q.title}`,action:'map_npc_quest_done',npcId};
      if(st.status==='accepted'){
        const p=getMapNpcQuestProgress(npcId);
        return {text:p.ready?`📜 提交支线：${q.title}（已备齐）`:`📜 支线：${q.title}（${p.have}/${p.need} ${q.item}）`,action:'map_npc_quest_submit',npcId};
      }
      return {text:`📜 接取支线：${q.title}`,action:'map_npc_quest_accept',npcId};
    }

    function showMapNpcHub(npcId) {
      if(!canMapNpcActV2864())return;
      const npc = MAP_NPCS[npcId];
      if (!npc) return closeWorldOverlay();
      const state = ensureMapNpcState(), talkCount=Number(state.chatted[npcId]||0), affinity=getMapNpcAffinity(npcId);
      const dailyText = hasClaimedMapNpcRewardToday(npcId) ? '✅ 今日赠礼已领取' : `🎁 领取今日赠礼（${npc.rewardText}）`;
      const qb=getMapNpcQuestButton(npcId);
      const html = `
        ${jevEntryV2846("jevMapNpcV2849('"+npcId+"')",'Jev 人物行为')}${npcId==='elder'?jevEntryV2846('jevElderV2849()','Jev 执事安排任务'):''}${npcId==='trader'?jevEntryV2846('jevMerchantV2849()','Jev 按需推荐'):''}
        ${buildNpcPanelHeader(npc, '', npc.desc)}
        <div class="npc-speech">关系：<b style="color:${npc.color}">${getMapNpcRelation(npcId)}</b> · 好感 <b>${affinity}/100</b> · 已交谈 ${talkCount} 次</div>
        <div style="height:7px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin:9px 0 10px"><div style="height:100%;width:${affinity}%;background:${npc.color};opacity:.85"></div></div>
        <div class="npc-note">不同地域的地图NPC会提供赠礼、支线与情报；关系越高，反馈越友好。</div>
      `;
      const choices = [
        { text:'💬 与他交谈', action:'map_npc_chat', npcId },
        qb,
        { text:'🔎 打听地域情报', action:'map_npc_intel', npcId },
        { text:dailyText, action:'map_npc_reward', npcId, condition:()=>!hasClaimedMapNpcRewardToday(npcId) }
      ].filter(Boolean);
      if(npcId==='trader')choices.push({text:'🧺 行脚商补给',action:'map_npc_shop',npcId});
      choices.push({ text:npc.quickText, action:'map_npc_open', npcId, openAction:npc.quickAction });
      choices.push({ text:'← 返回地图', action:'return_to_map' });
      showStory(html, choices);
    }

    function talkToMapNpc(npcId) {
      if(!canMapNpcActV2864())return;
      const npc=MAP_NPCS[npcId];if(!npc)return;
      const s=ensureMapNpcState(), day=getMapNpcDayKey();
      const td=s.talkDays[npcId]&&s.talkDays[npcId].day===day?s.talkDays[npcId]:{day,count:0};
      s.chatted[npcId]=Number(s.chatted[npcId]||0)+1;td.count++;s.talkDays[npcId]=td;
      const idx=Math.floor(Math.random()*npc.talks.length),line=npc.talks[idx];
      let gainText='';
      if(td.count<=3){player.exp+=4;const a=addMapNpcAffinity(npcId,1);gainText=`<p style="color:#ffd76a">✨ 修为 +4${a?` · 好感 +${a}`:''}</p>`;}
      else gainText='<p style="color:#888;font-size:11px">今日已经聊了不少，再聊不会继续增加修为与好感。</p>';
      autoSave?.();updateStats?.();
      showStory(`${buildNpcPanelHeader(npc)}<div class="npc-speech">“${line}”</div>${gainText}`,[{text:'继续',action:'map_npc',npcId}]);
    }

    function showMapNpcIntel(npcId){
      if(!canMapNpcActV2864())return;
      const npc=MAP_NPCS[npcId];if(!npc)return;
      const s=ensureMapNpcState(),day=getMapNpcDayKey(),first=s.intelDays[npcId]!==day;
      const line=npc.intel[Math.floor(Math.random()*npc.intel.length)];
      let extra='';
      if(first){s.intelDays[npcId]=day;const a=addMapNpcAffinity(npcId,1);extra=`<p style="color:#69f0ae">第一次认真听取今日情报${a?`，好感 +${a}`:''}</p>`;autoSave?.();}
      showStory(`${buildNpcPanelHeader(npc,'情报')}<div class="npc-speech">“${line}”</div>${extra}`,[{text:'记下了',action:'map_npc',npcId}]);
    }

    function acceptMapNpcQuest(npcId){
      if(!canMapNpcActV2864())return;
      const npc=MAP_NPCS[npcId],q=npc?.quest,st=getMapNpcQuestState(npcId);if(!q)return showMapNpcHub(npcId);
      if(st.status==='completed')return showMapNpcHub(npcId);
      st.status='accepted';st.acceptedDay=getMapNpcDayKey();autoSave?.();
      const p=getMapNpcQuestProgress(npcId);
      showStory(`${buildNpcPanelHeader(npc,'支线委托',q.desc)}<div class="npc-speech">当前持有：<b>${p.have}/${p.need} ${q.item}</b><br><span style="color:#69f0ae">奖励：${q.rewardText}</span></div>`,[{text:'接受',action:'map_npc',npcId}]);
    }

    function submitMapNpcQuest(npcId){
      if(!canMapNpcActV2864())return;
      const npc=MAP_NPCS[npcId],q=npc?.quest,st=getMapNpcQuestState(npcId);if(!q||st.status!=='accepted')return showMapNpcHub(npcId);
      const p=getMapNpcQuestProgress(npcId);
      if(!p.ready){
        showStory(`<p>材料还没有备齐。</p><p>需要：${q.item} ×${q.count}</p><p>当前：${q.item} ×${p.have}</p>`,[{text:'返回',action:'map_npc',npcId}]);return;
      }
      player.materials[q.item]-=q.count;
      if(npcId==='mentor'){player.gold+=120;player.exp+=35;}
      else if(npcId==='beast'){player.inventory.push('聚灵丹','聚灵丹');player.exp+=70;}
      else if(npcId==='elder'){player.sectContribution+=45;player.sectTotalContribution+=45;player.gold+=100;}
      else if(npcId==='trader'){player.gold+=420;player.inventory.push('大还丹');player.exp+=100;}
      const aff=addMapNpcAffinity(npcId,12);st.status='completed';st.completedDay=getMapNpcDayKey();
      checkLevelUp?.();updateStats?.();autoSave?.();
      showStory(`${buildNpcPanelHeader(npc,'委托完成')}<div class="npc-speech">“这件事你办得漂亮，我记下这份情了。”</div><p style="color:#69f0ae">获得：${q.rewardText}</p><p style="color:#ffb6c9">关系提升：好感 +${aff} · ${getMapNpcRelation(npcId)}</p>`,[{text:'继续',action:'map_npc',npcId}]);
    }

    function claimMapNpcReward(npcId) {
      if(!canMapNpcActV2864())return;
      const npc=MAP_NPCS[npcId];if(!npc)return;
      const state=ensureMapNpcState();
      if(hasClaimedMapNpcRewardToday(npcId)){
        showStory(`<p>${npc.icon} ${npc.name} 摇了摇头。</p><p>“今日能给你的东西已经给过了，改日再来吧。”</p>`,[{text:'返回',action:'map_npc',npcId}]);return;
      }
      let rewardDesc='';
      if(npcId==='mentor'){player.gold+=60;player.inventory.push('小还丹');rewardDesc='灵石 ×60、小还丹 ×1';}
      else if(npcId==='beast'){player.inventory.push('聚灵丹');player.materials['灵草']=(player.materials['灵草']||0)+2;rewardDesc='聚灵丹 ×1、灵草 ×2';}
      else if(npcId==='elder'){player.sectContribution+=15;player.sectTotalContribution+=15;player.gold+=40;rewardDesc='宗门贡献 +15、灵石 ×40';}
      else if(npcId==='trader'){player.gold+=80;player.materials['血玉']=(player.materials['血玉']||0)+1;rewardDesc='灵石 ×80、血玉 ×1';}
      state.rewards[npcId]=getMapNpcDayKey();autoSave?.();updateStats?.();
      showStory(`${buildNpcPanelHeader(npc)}<div class="npc-speech">“这些你先拿去，路上或许用得着。”</div><p style="color:#69f0ae">获得：${rewardDesc}</p>`,[{text:'继续',action:'map_npc',npcId}]);
    }

    function showMapNpcShop(npcId='trader'){
      if(!canMapNpcActV2864())return;
      const npc=MAP_NPCS[npcId]||MAP_NPCS.trader;
      const rows=[['小还丹',25],['聚灵丹',35],['大还丹',70],['神行符',120]];
      showStory(`${jevEntryV2846('jevMerchantV2849()','Jev 按需推荐')}${buildNpcPanelHeader(npc,'随身补给')}<div class="npc-speech">灵石：<b>${player.gold}</b></div>`,[
        ...rows.map(([item,cost])=>({text:`${item} · ${cost}灵石 · 已有${player.inventory.filter(x=>x===item).length}${player.gold<cost?' · 灵石不足':''}`,action:'map_npc_buy',npcId,item,cost,condition:()=>player.gold>=cost})),
        {text:'← 返回',action:'map_npc',npcId}
      ]);
    }

    function buyFromMapNpc(npcId,item,cost){
      if(!jevCanActV2846()||!MAP_NPCS[npcId])return;
      const prices={'小还丹':25,'聚灵丹':35,'大还丹':70,'神行符':120};if(!Object.hasOwn(prices,item)||cost!==prices[item])return;
      if(player.gold<cost){showStory('<p>灵石不足。</p>',[{text:'返回',action:'map_npc_shop',npcId}]);return;}
      if(!window.confirm(`购买 ${item} ×1？消耗 ${cost} 灵石，剩余 ${player.gold-cost}。`))return;
      player.gold-=cost;player.inventory.push(item);autoSave?.();updateStats?.();
      showStory(`<p>购买了 <b>${item}</b>。</p><p style="color:#ffd76a">-${cost} 灵石</p>`,[{text:'继续购买',action:'map_npc_shop',npcId},{text:'返回',action:'map_npc',npcId}]);
    }





    function buildAreaLayout(title, nodes, tip='') {
      return `<div class="area-layout-card"><div class="area-layout-title">🧭 ${title}</div><div class="area-layout-grid">${(nodes||[]).map(n=>`<div class="area-layout-node"><div class="n">${n.name}</div><div class="d">${n.desc}</div></div>`).join('')}</div>${tip?`<div class="area-layout-tip">${tip}</div>`:''}</div>`;
    }

    function buildInteriorStrip(title, rooms) {
      return `<div class="interior-strip"><div class="interior-strip-title">🏮 ${title}</div><div class="interior-room-grid">${(rooms||[]).map(r=>`<div class="interior-room"><span class="interior-room-icon">${r.icon||'📍'}</span><div class="interior-room-name">${r.name||''}</div><div class="interior-room-desc">${r.desc||''}</div></div>`).join('')}</div></div>`;
    }

    function getCombatExtraBagItems() {
      const bucket={};
      (player?.inventory||[]).forEach(name=>{
        const item=ITEMS?.[name]; if(!item)return;
        if(['heal','mp'].includes(item.type))return;
        bucket[name]=(bucket[name]||0)+1;
      });
      return Object.entries(bucket).map(([name,count])=>({name,count,...ITEMS[name]}));
    }

    function buildAreaSceneCard({icon='🗺️', title='', subtitle='', desc='', accent='#ffd98a', chips=[], info=''}) {
      return `
        <div class="area-scene-card">
          <div class="area-scene-head">
            <div class="area-scene-icon" style="box-shadow:0 8px 16px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.08), 0 0 0 1px ${accent}2e;">${icon}</div>
            <div class="area-scene-meta">
              <div class="area-scene-title" style="color:${accent}">${title}</div>
              <div class="area-scene-sub">${subtitle}</div>
              <div class="area-scene-desc">${desc}</div>
            </div>
          </div>
          ${chips?.length ? `<div class="area-chip-row">${chips.map(c=>`<span class="area-chip">${c}</span>`).join('')}</div>` : ''}
          ${info ? `<div class="area-info-box">${info}</div>` : ''}
        </div>`;
    }

    function formatCountMap(sourceNames) {
      return sourceNames.map(name => `${name}×${player.inventory.filter(i => i === name).length}`).join(' · ');
    }

    function buildNpcPanelHeader(npc, extraTitle='', extraDesc='') {
      if (!npc) return '';
      const tags=[npc.region?`所在：${getRegionInfo(npc.region)?.shortName||npc.region}`:'',npc.title||'',extraTitle||''].filter(Boolean).slice(0,2).map((tag,idx)=>`<span class="npc-tag ${idx===0?'strong':''}">${tag}</span>`).join('');
      return `<div class="npc-unified-card portrait-mode">
        <div class="npc-portrait-scene" style="box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 12px 24px rgba(0,0,0,.24),0 0 0 1px ${npc.color}33;">
          <div class="npc-portrait-bg" style="background:radial-gradient(circle at 50% 24%,${npc.color}55,rgba(255,255,255,0) 44%),linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.12));"></div>
          <div class="npc-portrait-halo"></div><div class="npc-portrait-head"></div>
          <div class="npc-portrait-body" style="background:linear-gradient(180deg,${npc.color}88,rgba(15,15,18,.18));"></div>
          <div class="npc-portrait-face">${npc.icon}</div><div class="npc-portrait-caption">${npc.title||npc.name}</div>
        </div>
        <div class="npc-unified-meta"><div class="npc-unified-name" style="color:${npc.color}">${npc.name}</div><div class="npc-unified-title">${npc.title||''}</div><div class="npc-unified-desc">${extraDesc||npc.desc||''}</div><div class="npc-unified-tags">${tags}</div><div class="npc-dialog-box">支线、赠礼、情报与专属入口都保留在同一人物面板里。</div></div>
      </div>`;
    }

    function getCombatConsumables() {
      const bucket = {};
      (player?.inventory || []).forEach(name => {
        const item = ITEMS?.[name];
        if (!item) return;
        if (item.type !== 'heal' && item.type !== 'mp') return;
        bucket[name] = (bucket[name] || 0) + 1;
      });
      return Object.entries(bucket).map(([name, count]) => ({ name, count, ...ITEMS[name] }))
        .sort((a, b) => (a.type === b.type ? a.value - b.value : (a.type === 'heal' ? -1 : 1)));
    }

    let combatBagState = { open: false, tab: 'all' };

    function toggleCombatMedicineDrawer(force) {
      if (typeof force === 'boolean') combatBagState.open = force;
      else combatBagState.open = !combatBagState.open;
      renderCombatMedicineDrawer();
    }

    function setCombatMedicineTab(tab) {
      combatBagState.tab = tab;
      renderCombatMedicineDrawer();
    }

    function renderCombatMedicineDrawer() {
      const panel=document.getElementById('combatPanel'),anchor=document.getElementById('combatChoices');
      if(!panel||!anchor)return;
      let drawer=document.getElementById('combatItemDrawer');
      if(!drawer){drawer=document.createElement('div');drawer.id='combatItemDrawer';drawer.className='combat-item-drawer hidden';anchor.insertAdjacentElement('afterend',drawer);}
      const pills=getCombatConsumables();
      const extras=getCombatExtraBagItems().filter(it=>it.type!=='escape');
      const tab=combatBagState.tab||'all';
      drawer.classList.toggle('hidden',!combatBagState.open);
      if(!combatBagState.open)return;
      let rows='';
      if(tab==='all'||tab==='heal'||tab==='mp'){
        const list=pills.filter(it=>tab==='all'||it.type===tab);
        rows=list.length?list.map(it=>{const ready=combatMedicineAvailabilityV2856(it.name),esc=skillTextEscapeV212;return `<button type="button" class="combat-item-btn" ${ready.ok?'':'disabled'} onclick="useCombatBagItem(${esc(JSON.stringify(it.name))})"><span>${it.type==='heal'?'💊':'🔹'} ${esc(it.name)}<span class="count">×${it.count}</span></span><span class="meta">${ready.ok?`实际恢复 ${ready.gain} 点${it.type==='heal'?'气血':'灵力'}`:esc(ready.reason)}${ready.ok&&ready.waste>0?` · 超出上限 ${ready.waste} 点`:''}<br>${esc(it.desc||'')}<br>使用消耗一个回合</span></button>`}).join(''):`<button class="combat-item-btn disabled" disabled>当前分类暂无丹药<span class="meta">去商铺或 NPC 处补给</span></button>`;
      }else{
        const list=extras.filter(it=>tab==='equip'?['weapon','armor'].includes(it.type):!['weapon','armor'].includes(it.type));
        rows=list.length?list.map(it=>`<button class="combat-item-btn combat-readonly" disabled><span>${['weapon','armor'].includes(it.type)?(it.type==='weapon'?'⚔️':'🛡️'):'🎐'} ${it.name}<span class="count">x${it.count}</span></span><span class="meta">${it.desc||'背包道具'}<br>${tab==='equip'?'战斗中可查看，脱战后再正式换装':'当前战斗仅查看，不会误用'}</span></button>`).join(''):`<button class="combat-item-btn disabled" disabled>当前分类暂无物品<span class="meta">获得后会自动显示在这里</span></button>`;
      }
      if(tab==='all'||tab==='item'){
        const count=player.inventory.filter(n=>n==='神行符').length;
        if(count)rows+=`<button class="combat-item-btn" ${canFleeV286818()&&isPlayerTurn?'':'disabled'} onclick="combat('escapeScroll')"><span>神行符 ×${count}</span><span class="meta">${canFleeV286818()?'消耗一张，必定脱战':'此战禁止脱战'}</span></button>`;
      }
      drawer.innerHTML=`<div class="combat-item-head"><span>🎒 战斗背包</span><button class="choice-btn" style="min-height:32px;padding:4px 10px;font-size:11px" onclick="toggleCombatMedicineDrawer(false)">收起</button></div>
        <div class="combat-tab-row"><button class="combat-tab-btn ${tab==='all'?'active':''}" onclick="setCombatMedicineTab('all')">补给</button><button class="combat-tab-btn ${tab==='heal'?'active':''}" onclick="setCombatMedicineTab('heal')">回血</button><button class="combat-tab-btn ${tab==='mp'?'active':''}" onclick="setCombatMedicineTab('mp')">回灵</button><button class="combat-tab-btn ${tab==='item'?'active':''}" onclick="setCombatMedicineTab('item')">道具</button><button class="combat-tab-btn ${tab==='equip'?'active':''}" onclick="setCombatMedicineTab('equip')">装备</button></div><div class="combat-item-grid">${rows}</div><div class="quick-tip">回血、回灵物品在这里使用会消耗本回合；主战斗界面不会直接摆出丹药按钮。</div>`;
    }

    function combatMedicineAvailabilityV2856(itemName) {
      const item=ITEMS?.[itemName],index=(player?.inventory||[]).indexOf(itemName);
      if(index<0||!item||!['heal','mp'].includes(item.type))return {ok:false,reason:'当前没有此补给',gain:0};
      const maximum=item.type==='heal'?getMaxHp():getMaxMp(),current=item.type==='heal'?player.hp:player.mp;
      const value=Number(item.value),gain=Math.max(0,Math.min(value,maximum-current));
      if(!Number.isFinite(value)||value<=0||!Number.isFinite(gain))return {ok:false,reason:'补给数据无效',gain:0};
      if(gameState!=='combat'||!currentEnemy||currentEnemy.hp<=0||COMBAT_FINISH_V2764.settling)return {ok:false,reason:'当前不在可行动的战斗中',gain};
      if(!isPlayerTurn)return {ok:false,reason:'等待行动结算',gain};
      if(gain<=0)return {ok:false,reason:item.type==='heal'?'气血已满，无需服用':'灵力已满，无需服用',gain:0};
      return {ok:true,item,index,gain,waste:Math.max(0,value-gain)};
    }

    function useCombatBagItem(itemName) {
      const ready=combatMedicineAvailabilityV2856(itemName);
      if(!ready.ok){showFloatingText?.(ready.reason,'#ffd76a');renderCombatMedicineDrawer();return;}
      const {item,index,gain}=ready;
      isPlayerTurn=false;
      player.inventory.splice(index,1);
      if(item.type==='heal'){
        player.hp=Math.min(getMaxHp(),player.hp+gain);
        showDamageNumber(gain,'player',true,false,false,false,itemName);
        playSound('heal');
      }else{
        player.mp=Math.min(getMaxMp(),player.mp+gain);
        playSound('heal');
      }
      addCombatLog(`使用${itemName}，实际恢复 ${gain} 点${item.type==='heal'?'气血':'灵力'}。`,'heal');
      updateCombatUI();updateCombatChoices();renderCombatMedicineDrawer();updateStats?.();
      battleLaterV2838(()=>enemyTurn(),500);
    }

    function getPoiVisualKind(o) {
      const id = o?.id || '';
      if (['village','shop','market','home','sect','alchemy','artifacts','rest','travel_gate'].includes(id)) return id;
      if (String(o?.action || '').startsWith('npc_')) return 'npc';
      if (o?.action === 'lingxiao_building') return 'lingxiao_building';
      if (['forest','mountain','battlefield','pets','secret','romance','factions'].includes(id)) return id;
      return 'default';
    }

    // Bounded reusable building sprites: at most 32 x 192 x 192 RGBA (~4.5 MiB).
    const BUILDING_ART_V2813=new Map();
    function clearBuildingArtV2813(){for(const c of BUILDING_ART_V2813.values()){c.width=1;c.height=1;}BUILDING_ART_V2813.clear();}
    function paintBuildingV2813(ctx,opts={}){
      const w=opts.w||64,h=opts.h||52,roof=opts.roof||'#45665d',front=opts.front||'#d6c8a7',side=opts.side||'#918975',trim=opts.trim||'#e6cca0',style=opts.style||'hall';
      const poly=(pts,color,stroke)=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.8;ctx.stroke();}};
      const line=(x1,y1,x2,y2,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1*w,y1*h);ctx.lineTo(x2*w,y2*h);ctx.stroke();};
      ctx.save();
      ctx.fillStyle='rgba(9,17,20,.23)';ctx.beginPath();ctx.ellipse(w*.09,h*.53,w*.67,h*.16,-.08,0,Math.PI*2);ctx.fill();
      // Cut-stone plinth and lit front steps.
      poly([[-.55,.24],[.24,.15],[.58,.38],[-.22,.57]],'#747a73');
      poly([[-.55,.24],[-.22,.47],[.58,.28],[.58,.38],[-.22,.57],[-.55,.34]],'#555e59');
      poly([[-.56,.2],[.22,.03],[.59,.28],[-.22,.47]],'#b3b4a2','#686f67');
      for(let i=0;i<3;i++)poly([[-.23,.4+i*.05],[.03,.34+i*.05],[.1,.4+i*.05],[-.16,.46+i*.05]],i%2? '#92998e':'#c6c4ad');
      // Two wall planes, exposed timber, lattice windows.
      poly([[-.43,-.2],[.12,-.34],[.12,.23],[-.43,.36]],front);
      poly([[.12,-.34],[.43,-.13],[.43,.39],[.12,.23]],side);
      for(const x of [-.43,-.18,.12])line(x,-.16,x,.3,style==='demon'?'#322b3c':'#604b37',2.6);
      line(.43,-.1,.43,.38,'#4c493d',2.5);
      poly([[-.15,-.02],[.03,-.065],[.03,.25],[-.15,.29]],style==='demon'?'#241e32':'#363b32',trim);
      line(-.06,-.04,-.06,.27,trim,.7);
      ctx.fillStyle=trim;ctx.beginPath();ctx.arc(-w*.04,h*.12,1,0,Math.PI*2);ctx.fill();
      for(const x of [-.35,.22]){
        const y=x<0?-.045:.025;
        poly([[x,y],[x+.1,y-.025],[x+.1,y+.1],[x,y+.125]],style==='demon'?'#bb6b88':'#ddba74','#594d3e');
        line(x+.05,y-.012,x+.05,y+.11,'#645339',.7);line(x,y+.055,x+.1,y+.03,'#645339',.7);
      }
      // Sweeping tiled hip roof: asymmetric lit slopes and raised corners.
      const roofLayer=(scale,offset)=>{
        ctx.save();ctx.translate(0,offset*h);ctx.scale(scale,scale);
        poly([[-.61,-.16],[-.08,-.59],[.58,-.2],[.14,-.06]],roof,'#33413d');
        poly([[-.61,-.16],[-.08,-.59],[.14,-.06],[-.35,.01]],roof);
        poly([[-.61,-.16],[-.08,-.59],[.14,-.06],[-.35,.01]],'rgba(255,255,223,.10)');
        poly([[.14,-.06],[-.08,-.59],[.58,-.2]],'rgba(7,16,28,.19)');
        for(let i=1;i<7;i++){
          const t=i/7;
          line(-.08+(-.53)*t,-.59+.43*t,.14-.49*t,-.06+.07*t,'rgba(232,230,196,.28)',.65);
          line(-.08+.66*t,-.59+.39*t,.14+.44*t,-.06-.14*t,'rgba(232,230,196,.20)',.65);
        }
        ctx.strokeStyle=trim;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-w*.64,-h*.23);ctx.quadraticCurveTo(-w*.56,-h*.06,-w*.35,h*.01);ctx.lineTo(w*.14,-h*.06);ctx.quadraticCurveTo(w*.53,-h*.14,w*.61,-h*.26);ctx.stroke();
        line(-.08,-.6,.14,-.07,trim,1.5);
        ctx.restore();
      };
      roofLayer(1,0);
      if(style==='pagoda'||style==='immortal'||style==='demon'){
        poly([[-.18,-.47],[.05,-.52],[.19,-.42],[-.03,-.35]],front);
        roofLayer(.57,-.36);
        line(-.045,-.73,-.045,-.85,trim,1.5);
        if(style==='demon'){
          poly([[-.46,-.29],[-.53,-.67],[-.27,-.4]],'#32283f',trim);
          poly([[.3,-.27],[.5,-.64],[.46,-.21]],'#32283f',trim);
        }
      }
      // Eave plaque and a pair of lanterns, no platform-dependent emoji.
      poly([[-.2,-.12],[.06,-.18],[.06,-.075],[-.2,-.015]],'#283e38',trim);
      for(let i=0;i<3;i++)line(-.16+i*.065,-.075-i*.016,-.13+i*.065,-.082-i*.016,trim,1);
      for(const x of [-.43,.4]){
        const y=x<0?-.04:.0;
        line(x,y-.08,x,y+.04,trim,.8);
        ctx.fillStyle=style==='demon'?'#b35779':style==='immortal'?'#a9d7db':'#d39656';ctx.beginPath();ctx.ellipse(x*w,(y+.07)*h,2.5,4,0,0,Math.PI*2);ctx.fill();
        line(x,y+.12,x,y+.16,trim,.6);
      }
      ctx.restore();
    }
    function drawIsoHouse(ctx,opts={}){
      const key=JSON.stringify(opts);let sprite=BUILDING_ART_V2813.get(key);
      if(!sprite){
        if(BUILDING_ART_V2813.size>=32){const first=BUILDING_ART_V2813.keys().next().value,old=BUILDING_ART_V2813.get(first);old.width=1;old.height=1;BUILDING_ART_V2813.delete(first);}
        sprite=document.createElement('canvas');sprite.width=192;sprite.height=192;
        const c=sprite.getContext('2d');c.scale(1.5,1.5);c.translate(64,68);paintBuildingV2813(c,opts);BUILDING_ART_V2813.set(key,sprite);
      }
      ctx.drawImage(sprite,-64,-68+(opts.baseY||0),128,128);
    }

    function drawWorldAmbient(ctx, t, minX, maxX, minY, maxY) {
      const regionId = currentRegion || 'south';
      const tt = t * 0.001;
      ctx.save();
      if (regionId === 'south' || regionId === 'east') {
        for (let i = 0; i < 10; i++) {
          const x = ((i * 137 + tt * 26 + i * i * 7) % (FLAT_WORLD.width + 240)) - 120;
          const y = 120 + ((i * 89 + tt * 8 + i * 31) % (FLAT_WORLD.height - 200));
          if (x < minX-40 || x > maxX+40 || y < minY-40 || y > maxY+40) continue;
          const drift = Math.sin(tt * 1.8 + i) * 7;
          ctx.save();
          ctx.translate(x, y + drift);
          ctx.rotate(tt * .7 + i);
          ctx.fillStyle = regionId === 'east' ? 'rgba(150,215,135,.34)' : 'rgba(248,218,121,.28)';
          ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, .5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.ellipse(-1.4, -1, 3.5, 1.4, .5, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        }
      }
      const fogColor = regionId === 'north' ? 'rgba(222,240,255,.14)' : (regionId === 'west' ? 'rgba(130,170,188,.10)' : 'rgba(255,255,255,.09)');
      for (let i = 0; i < 3; i++) {
        const fx = ((tt * (18 + i * 7) + i * 280) % (FLAT_WORLD.width + 420)) - 200;
        const fy = 150 + i * 170 + Math.sin(tt + i) * 32;
        if (fx > maxX + 240 || fx < minX - 280 || fy > maxY + 150 || fy < minY - 150) continue;
        const g = ctx.createRadialGradient(fx, fy, 20, fx, fy, 140 + i * 24);
        g.addColorStop(0, fogColor); g.addColorStop(.45, fogColor.replace(/\.\d+\)/, '.06)')); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(fx, fy, 150 + i * 20, 52 + i * 8, 0, 0, Math.PI*2); ctx.fill();
      }
      for (let i = 0; i < 16; i++) {
        const x = ((i * 173 + tt * 14 + i * 23) % (FLAT_WORLD.width + 80)) - 40;
        const y = 40 + ((i * 71 + tt * (5 + i % 3)) % (FLAT_WORLD.height - 80));
        if (x < minX || x > maxX || y < minY || y > maxY) continue;
        const r = 1.5 + (i % 3) * .8 + Math.sin(tt * 2 + i) * .25;
        ctx.fillStyle = regionId === 'west' ? 'rgba(255,197,120,.28)' : 'rgba(220,248,255,.28)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    const WORLD_MAP_CONFIGS = {"south": {"width": 1400, "height": 1000, "spawn": {"x": 540, "y": 700}, "hub": {"x": 650, "y": 560}, "poiPositions": {"village": [650, 360], "shop": [380, 480], "market": [920, 480], "home": [1080, 770], "romance": [1020, 200], "rest": [360, 770], "mentor_npc": [380, 200], "travel_gate": [650, 850]}, "safeZones": [{"x": 650, "y": 560, "r": 400}], "id": "south", "bg": "#56694a", "accent": "#b6d58c"}, "east": {"width": 1400, "height": 1000, "spawn": {"x": 320, "y": 800}, "hub": {"x": 600, "y": 600}, "poiPositions": {"forest": [860, 350], "pets": [360, 420], "secret": [1130, 740], "beast_npc": [320, 200], "travel_gate": [200, 800]}, "safeZones": [{"x": 300, "y": 610, "r": 210}], "id": "east", "bg": "#405f45", "accent": "#8fd19a"}, "north": {"width": 1600, "height": 1200, "spawn": {"x": 520, "y": 1060}, "hub": {"x": 900, "y": 760}, "poiPositions": {"mountain": [200, 180], "sect": [900, 760], "factions": [1440, 180], "elder_npc": [480, 880], "travel_gate": [240, 1060]}, "safeZones": [{"x": 950, "y": 850, "r": 420}], "id": "north", "bg": "#687887", "accent": "#c7e4ff"}, "west": {"width": 1400, "height": 1000, "spawn": {"x": 320, "y": 820}, "hub": {"x": 600, "y": 620}, "poiPositions": {"battlefield": [1020, 290], "alchemy": [400, 450], "artifacts": [780, 720], "trader_npc": [250, 610], "travel_gate": [200, 820]}, "safeZones": [{"x": 340, "y": 670, "r": 200}], "id": "west", "bg": "#493f3e", "accent": "#e3a0a0"}};

    const WORLD_POI_TEMPLATES = {
      village:{id:'village',name:'青云村',icon:'🏘',r:96,action:'village',region:'south',desc:'南域村舍与炊烟，是修士旅途的起点'},
      shop:{id:'shop',name:'百宝阁',icon:'🏪',r:74,action:'shop',region:'south',desc:'丹药、兵器与护甲'},
      market:{id:'market',name:'仙市',icon:'🏮',r:92,action:'market',region:'south',desc:'南域修士交换宝物的繁华集市'},
      home:{id:'home',name:'洞府',icon:'🏡',r:78,action:'home',region:'south',desc:'你的修炼居所'},
      romance:{id:'romance',name:'姻缘亭',icon:'💗',r:58,action:'romance',region:'south',desc:'旧缘未了，也许有些话终究要重新面对'},
      rest:{id:'rest',name:'灵泉',icon:'💧',r:65,action:'rest',region:'south',desc:'南域灵泉，可在此调息恢复'},
      mentor_npc:{id:'mentor_npc',name:'云游道人',icon:'🧙',r:58,action:'npc_mentor',region:'south',desc:'南域散修前辈，可交谈并领取每日赠礼'},
      forest:{id:'forest',name:'迷雾森林',icon:'🌲',r:120,action:'forest',region:'east',desc:'东域灵兽森林深处，奇遇与危险并存'},
      pets:{id:'pets',name:'灵兽谷',icon:'🐾',r:72,action:'pets',region:'east',desc:'东域灵兽聚居之谷，可查看与培养灵宠'},
      secret:{id:'secret',name:'万宗秘境',icon:'🌀',r:82,action:'secret',region:'east',desc:'隐藏在东域深处，仅向百年宗门大比前三宗门开放'},
      beast_npc:{id:'beast_npc',name:'牧灵童子',icon:'🧒',r:56,action:'npc_beast',region:'east',desc:'东域御兽堂学徒，可交流灵宠心得'},
      mountain:{id:'mountain',name:'问道山',icon:'⛰',r:125,action:'mountain',region:'north',desc:'北域雪线上的问道之山，灵气冷冽'},
      sect:{id:'sect',name:'凌霄宗',icon:'⛩',r:105,action:'sect',region:'north',desc:'男主早期所在宗门，坐落于北域山脉边缘'},
      factions:{id:'factions',name:'三界势力碑',icon:'🌌',r:74,action:'factions_human',region:'north',desc:'记载仙人宗门、魔族势力与人类万宗的三界层级'},
      elder_npc:{id:'elder_npc',name:'宗门执事',icon:'👴',r:58,action:'npc_elder',region:'north',desc:'可打听宗门事务并领取少量补贴'},
      battlefield:{id:'battlefield',name:'古战场',icon:'⚔',r:110,action:'battlefield',region:'west',desc:'西域魔渊中的古战场，残魂游荡'},
      alchemy:{id:'alchemy',name:'炼丹房',icon:'🔥',r:72,action:'alchemy',region:'west',desc:'西域边缘的丹火据点，可就近处理魔渊珍材'},
      artifacts:{id:'artifacts',name:'法宝台',icon:'✨',r:70,action:'artifacts',region:'west',desc:'魔渊边缘的古老法台，可祭炼与强化法宝'},
      trader_npc:{id:'trader_npc',name:'行脚商',icon:'🧔',r:58,action:'npc_trader',region:'west',desc:'魔渊边补给商，常给修士一些应急物资'},
      travel_gate:{id:'travel_gate',name:'四方驿道',icon:'🗺️',r:62,action:'world_travel_menu',region:'south',desc:'通过驿道前往其他地域'}
    };


    // V28.06 三族山门地图：每张只加载当前地域的建筑与装饰。
    const FACTION_MAPS_V2806={
      human_peaks:{name:'中州 · 群宗仙山',shortName:'群宗仙山',group:'human',level:2,terrain:'plains',bg:'#516657',color:'#c9db9d',icon:'⛰️',danger:2,description:'人族名门沿山脉分布，山门围绕中央驿站，常用补给位于西侧。',factions:HUMAN_SECTS_FULL.filter(f=>f.id!=='lingxiao').slice(0,8)},
      human_valleys:{name:'江南 · 百花灵谷',shortName:'百花灵谷',group:'human',level:2,terrain:'forest',bg:'#3e655e',color:'#a0dfcf',icon:'🌸',danger:2,description:'溪谷、竹林与花海之间，八家宗门各守传承，环谷道路相互连接。',factions:HUMAN_SECTS_FULL.filter(f=>f.id!=='lingxiao').slice(8)},
      demon_domain:{name:'魔界 · 玄煞魔域',shortName:'玄煞魔域',group:'demon',level:4,terrain:'dark',bg:'#453747',color:'#e5a0b5',icon:'☠️',danger:4,description:'五大魔族势力盘踞荒原。界门附近设中立补给，离开驿站后需提防魔物。',factions:DEMON_FACTIONS_FULL},
      immortal_domain:{name:'仙界 · 九霄仙境',shortName:'九霄仙境',group:'immortal',level:10,terrain:'snow',bg:'#758a99',color:'#e8d9ff',icon:'☁️',danger:3,description:'飞升后可抵达的仙门群山，五座仙宗坐落云海间，中央仙驿连通各处山门。',factions:IMMORTAL_SECTS_FULL}
    };
    const FACTION_LOCATIONS_V2806={凌霄宗:{region:'north',poi:'sect'}};
    const FACTION_MAP_POINTS_V2806=[[350,230],[700,200],[1050,230],[1320,440],[1320,790],[1050,980],[700,980],[350,850]];
    for(const [id,m] of Object.entries(FACTION_MAPS_V2806)){
      WORLD_REGIONS[id]={id,name:m.name,shortName:m.shortName,icon:m.icon,color:m.color,desc:m.description,dangerLevel:m.danger,maxMonsters:m.group==='demon'?5:3,terrain:m.terrain,atmosphere:m.group==='demon'?'肃杀':m.group==='immortal'?'缥缈':'清幽',isSafe:false,immortalSect:null,bounds:{xMin:0,xMax:1600,yMin:0,yMax:1200},monsters:m.group==='demon'?['魔修','幽冥鬼','魔界邪兽']:m.group==='immortal'?['冰晶傀儡','寒冰蛟龙']:['山贼','妖兽'],materials:m.group==='demon'?['魔核','血玉']:m.group==='immortal'?['仙灵草','万年寒玉']:['灵草','仙果']};
      REGION_UNLOCK_LEVEL[id]=m.level;
      REGION_ENTRY_EFFECTS[id]={message:m.description,debuff:null};
      const cfg={id,width:1600,height:1200,spawn:{x:320,y:1060},hub:{x:800,y:600},bg:m.bg,accent:m.color,safeZones:[{x:390,y:630,r:230}],poiPositions:{travel_gate:[170,1060]}};
      const services=[['supply','驿站补给','🧺','shop',220,510],['rest','驿站灵泉','💧','rest',460,650],['guide','山门路引','🧭','faction_guide_v2806',800,600]];
      for(const [key,name,icon,action,x,y] of services){const pid=id+'_'+key;WORLD_POI_TEMPLATES[pid]={id:pid,name,icon,action,r:55,region:id,desc:key==='guide'?'查看本图宗门位置并选择导航':key==='rest'?'调息恢复':'基础丹药与日常补给'};cfg.poiPositions[pid]=[x,y];}
      m.factions.forEach((f,index)=>{const pid='faction_'+f.id;cfg.poiPositions[pid]=FACTION_MAP_POINTS_V2806[index];WORLD_POI_TEMPLATES[pid]={id:pid,name:f.name,icon:f.icon||'⛩️',r:70,region:id,action:'faction_gate_v2806',factionName:f.name,factionGroup:m.group,desc:f.specialty};FACTION_LOCATIONS_V2806[f.name]={region:id,poi:pid};});
      WORLD_MAP_CONFIGS[id]=cfg;
    }
    WORLD_POI_TEMPLATES.yewuji_gate={id:'yewuji_gate',name:'夜无疆·裂界台',icon:'🌑',r:70,region:'demon_domain',action:'yewuji_v2810',desc:'三万年仙魔战的宿敌，点击查看人物与挑战'};
    WORLD_MAP_CONFIGS.demon_domain.poiPositions.yewuji_gate=[1050,980];
    function showFactionMapGuideV2806(){
      const id=currentRegion||player.worldMapId,m=FACTION_MAPS_V2806[id];if(!m)return showWorldTravelMenu();
      showStory(`<h3>${m.icon} ${m.shortName} · 山门路引</h3><p>${m.description}</p><p>点击宗门可沿地图方向前往，靠近山门后点击交互拜访。</p>`,[...m.factions.map(f=>({text:`${f.icon} 导航至${f.name}`,action:'faction_navigate_v2806',factionName:f.name})),{text:'界门 · 前往其他地图',action:'world_travel_menu'},{text:'返回地图',action:'return_to_map'}]);
    }
    function navigateFactionV2806(name){
      const loc=FACTION_LOCATIONS_V2806[name];if(!loc)return;
      if((currentRegion||player.worldMapId)!==loc.region)return travelToWorldMap(loc.region,loc.poi);
      const p=FLAT_WORLD.pois.find(p=>p.id===loc.poi);if(!p)return;
      closeWorldOverlay();FLAT_WORLD.target={x:p.x,y:p.y};FLAT_WORLD.tapTargetFx={x:p.x,y:p.y,startedAt:performance.now()};showFloatingText(`📍 前往${name}`,'#d9d3ab');
    }
    function showFactionGateV2806(name){
      const loc=FACTION_LOCATIONS_V2806[name],f=getFullFactionInfo(name);
      if(!loc||!f||(currentRegion||player.worldMapId)!==loc.region)return;
      const destroyed=isFactionDestroyed(name);
      showStory(`<h3>${f.icon} ${name} · ${destroyed?'山门遗址':'山门'}</h3><p>${f.desc}</p><p>⚔️ 基础战力：<b>${getFactionWorldBasePower(name)}</b>${destroyed?' · 参战0':''}</p><p>传承：${f.specialty}</p><p>${destroyed?'门庭已毁，旧日宗门资料仍可查阅。':'山门接引处可查阅宗门传承、对外关系和你在此地的声望。'}</p>`,[{text:'📜 查看宗门与势力事务',action:'faction_detail_full',factionName:name},{text:'🧭 查看附近山门',action:'faction_guide_v2806'},{text:'返回山门外',action:'return_to_map'}]);
    }

    // ================== 凌霄宗完整建筑体系 ==================
    const BUILDING_TIERS={OUTER:'outer',MIDDLE:'middle',INNER:'inner',CORE:'core',BACK:'back',FUNCTION:'function',SECRET:'secret',FORBIDDEN:'forbidden'};
    const BUILDING_ACCESS={
      outer:{minRealm:0,label:'外门区域'}, middle:{minRealm:2,label:'筑基可入'}, inner:{minRealm:2,label:'内门权限'},
      core:{minRealm:3,label:'金丹及长老权限'}, back:{minRealm:1,label:'练气可入'}, function:{minRealm:0,label:'全宗弟子可入'},
      secret:{minRealm:3,label:'金丹及特殊资格'}, forbidden:{minRealm:99,label:'仅剧情解锁'}
    };
    const LINGXIAO_TIER_META={
      outer:{label:'外门区域',color:'#8fdc9a'},middle:{label:'中门区域',color:'#88c8ff'},inner:{label:'内门核心区',color:'#c9a8ff'},core:{label:'核心禁区',color:'#ff9e9e'},
      back:{label:'后山灵域',color:'#9fd88d'},function:{label:'战争防卫',color:'#ffbe7d'},secret:{label:'秘境通道',color:'#c2a6ff'},forbidden:{label:'老祖洞天',color:'#9a9a9a'}
    };
    const LINGXIAO_BUILDINGS=[
      {id:'gate',name:'山门牌坊·凌霄正门',shortName:'凌霄正门',tier:'outer',desc:'宗门第一道界域，白玉石坊刻“凌霄”二字。',functions:['出入宗门','外门值守','新手剧情'],npcs:['外门小执事'],events:['序章入宗','苏晚晴初次重逢'],x:900,y:1060,icon:'⛩️'},
      {id:'arena',name:'外门演武场',shortName:'外门演武场',tier:'outer',desc:'青石大场布置傀儡木桩与试炼台。',functions:['基础斗法','弟子考核','日常任务'],npcs:['外门教习'],x:1110,y:1050,icon:'⚔️'},
      {id:'dormitory',name:'外门弟子居',shortName:'外门弟子居',tier:'outer',desc:'连片竹舍与小院，外门弟子日常起居处。',functions:['休息','打坐','恢复'],x:690,y:1050,icon:'🏠'},
      {id:'task_hall',name:'外门任务堂',shortName:'外门任务堂',tier:'outer',desc:'宗门差事、日常任务与功绩兑换中心。',functions:['宗门差事','日常任务','功绩兑换'],npcs:['外门执事长老'],x:1110,y:880,icon:'📜'},
      {id:'herb_garden',name:'外门药圃',shortName:'外门药圃',tier:'outer',desc:'大面积灵草种植园，是基础药材来源。',functions:['采药任务','灵草采集'],x:690,y:880,icon:'🌿'},
      {id:'stone_steps',name:'凌霄长阶·千阶云梯',shortName:'凌霄长阶',tier:'middle',desc:'连接外门与内门的通天石阶，云雾缭绕。',functions:['筑基晋升','心境试炼'],events:['筑基晋升'],x:900,y:920,icon:'🪜'},
      {id:'guest_hall',name:'迎宾殿',shortName:'迎宾殿',tier:'middle',desc:'接待外来宗门与修士访客的正式场所。',functions:['宗门外交','势力交流'],x:1310,y:880,icon:'🏛️'},
      {id:'outer_elder_hall',name:'外门长老院',shortName:'外门长老院',tier:'middle',desc:'掌管外门事务、外勤调度与山门防务。',functions:['外门管理','防务调度'],x:1310,y:1050,icon:'🏯'},
      {id:'main_hall',name:'凌霄大殿',shortName:'凌霄大殿',tier:'inner',desc:'宗主坐朝、宗门大会与重大决议之地。',functions:['宗门大会','重大决议','宗门事务'],events:['宗门大比','魔灾会议'],x:900,y:560,icon:'👑'},
      {id:'elder_hall',name:'内门长老阁',shortName:'内门长老阁',tier:'inner',desc:'刑罚、剑道、丹道、阵道与大长老各院所在。',functions:['宗门管理','派系博弈'],npcs:['顾玄岳'],events:['顾承渊身世暗线'],x:1080,y:560,icon:'📋'},
      {id:'qingxuan_academy',name:'清玄道院',shortName:'清玄道院',tier:'inner',desc:'清玄真人专属道院，清雅素净，重道心修行。',functions:['师徒对话','心境突破'],npcs:['清玄真人'],events:['道心指点'],x:720,y:560,icon:'🌸'},
      {id:'library',name:'藏经阁',shortName:'藏经阁',tier:'inner',desc:'多层通天阁楼，封存基础、高阶、秘传与禁典。',functions:['功法兑换','典籍查阅','技能学习'],x:900,y:380,icon:'📚'},
      {id:'alchemy_hall',name:'丹庐药堂',shortName:'丹庐药堂',tier:'inner',desc:'高阶炼丹区域与药庐庭院，苏晚晴常年在此修行。',functions:['炼丹','药庐剧情'],npcs:['苏晚晴'],events:['药庐外的风','那年真正的答案'],x:1260,y:560,icon:'🔥'},
      {id:'beast_hall',name:'御兽堂',shortName:'御兽堂',tier:'inner',desc:'灵宠驯养、兽丹兑换与灵兽契约所在。',functions:['灵宠培养','灵兽契约'],x:720,y:380,icon:'🐾'},
      {id:'forge_hall',name:'炼器阁',shortName:'炼器阁',tier:'inner',desc:'装备锻造、法宝修复与材料合成之地。',functions:['装备锻造','法宝强化'],x:1080,y:380,icon:'⚒️'},
      {id:'inner_arena',name:'内门试炼台',shortName:'内门试炼台',tier:'inner',desc:'内门弟子比试、晋升考核与精英对决区域。',functions:['内门比试','进阶考核'],x:1440,y:560,icon:'🥋'},
      {id:'forbidden_library',name:'禁书秘阁',shortName:'禁书秘阁',tier:'core',desc:'全宗最神秘的典籍禁区，封存宗门机密。',functions:['禁典查阅','宗门机密'],events:['顾承渊深夜密会'],x:1260,y:200,icon:'🌙'},
      {id:'insight_platform',name:'主峰悟道台',shortName:'主峰悟道台',tier:'core',desc:'悬空石台立于云海之上，是高阶突破与悟道之地。',functions:['境界突破','感悟大道'],events:['筑基突破','金丹突破'],x:900,y:200,icon:'🧘'},
      {id:'array_core',name:'护宗大阵核心台',shortName:'大阵核心台',tier:'core',desc:'掌控护宗结界，是宗门防御中枢。',functions:['阵法维护','魔灾防御'],x:1080,y:200,icon:'🌀'},
      {id:'ancestor_cave',name:'老祖静修洞天',shortName:'老祖洞天',tier:'forbidden',desc:'隐世老祖闭关之所，仅宗门覆灭级危机才会解封。',functions:['宗门底牌'],x:1450,y:360,icon:'🔒'},
      {id:'back_forest',name:'后山试炼森林',shortName:'后山试炼林',tier:'back',desc:'由低阶到高阶妖兽分层盘踞的宗门试炼林。',functions:['妖兽试炼','材料获取','灵兽捕捉'],x:250,y:500,icon:'🌲'},
      {id:'spirit_spring',name:'北域灵泉',shortName:'北域灵泉',tier:'back',desc:'位于宗门地图西侧、后山试炼林以南。可免费恢复全部气血与灵力；不限次数、无冷却、不消耗游戏时间。',functions:['恢复气血灵力','静修'],x:250,y:720,icon:'💧'},
      {id:'cliff_bridge',name:'后山断崖·青石桥',shortName:'青石桥',tier:'back',desc:'感情线核心地标，旧缘与最终选择都与此处有关。',functions:['感情剧情','回忆'],events:['情断青云','第二次选择'],x:480,y:720,icon:'🌉'},
      {id:'hidden_caves',name:'隐秘洞府区',shortName:'隐秘洞府区',tier:'back',desc:'后山深处散落着机缘洞府、宝箱与奇遇点。',functions:['机缘探索','隐藏宝箱'],x:480,y:300,icon:'🕳️'},
      {id:'border_towers',name:'边境哨塔群',shortName:'边境哨塔',tier:'function',desc:'人族防线前哨，承担魔灾探查与边境镇守。',functions:['魔灾探查','边境镇守'],x:120,y:880,icon:'🗼'},
      {id:'defense_wall',name:'聚灵防御壁垒',shortName:'聚灵壁垒',tier:'function',desc:'大型灵脉防线，是正魔大战的重要主战场。',functions:['灵脉守护','战争任务'],events:['魔灾战争'],x:470,y:1060,icon:'🛡️'},
      {id:'secret_realm_gate',name:'万宗秘境入口',shortName:'万宗秘境入口',tier:'secret',desc:'百年大比专属秘境入口，仅特殊资格弟子可入。',functions:['百年秘境','高阶奖励'],x:1440,y:720,icon:'🌀'},
      {id:'mini_secret_realm',name:'宗门小秘境',shortName:'宗门小秘境',tier:'secret',desc:'宗门内部的小型资源秘境与弟子历练副本。',functions:['资源副本','弟子历练'],x:470,y:500,icon:'🌟'},
      {id:'night_platform',name:'月下观星台',shortName:'月下观星台',tier:'inner',desc:'月夜观星之处，适合触发苏晚晴谈心支线。',functions:['感情支线'],events:['苏晚晴·月下谈心'],x:720,y:200,icon:'🌙',nightOnly:true},
      {id:'night_corridor',name:'禁阁夜廊',shortName:'禁阁夜廊',tier:'core',desc:'禁阁外围长廊，顾承渊身世暗线在此展开。',functions:['暗线剧情'],events:['禁阁夜影'],x:1260,y:380,icon:'🌑',nightOnly:true},
      {id:'night_yaolu',name:'深夜药庐',shortName:'深夜药庐',tier:'inner',desc:'夜雨中的药庐，是感情线核心剧情发生地。',functions:['感情核心剧情'],events:['那年真正的答案'],x:1260,y:720,icon:'🏮',nightOnly:true}
    ];
    const BUILDING_PATHS=[
      ['gate','arena'],['gate','dormitory'],['gate','task_hall'],['gate','herb_garden'],['arena','task_hall'],['dormitory','herb_garden'],
      ['arena','stone_steps'],['stone_steps','guest_hall'],['stone_steps','outer_elder_hall'],['stone_steps','main_hall'],
      ['main_hall','elder_hall'],['main_hall','qingxuan_academy'],['main_hall','library'],['main_hall','alchemy_hall'],['main_hall','beast_hall'],['main_hall','forge_hall'],['main_hall','inner_arena'],
      ['elder_hall','forbidden_library'],['main_hall','insight_platform'],['main_hall','array_core'],['forbidden_library','ancestor_cave'],
      ['gate','back_forest'],['back_forest','spirit_spring'],['spirit_spring','cliff_bridge'],['back_forest','hidden_caves'],
      ['gate','border_towers'],['border_towers','defense_wall'],['main_hall','secret_realm_gate'],['back_forest','mini_secret_realm'],
      ['qingxuan_academy','night_platform'],['forbidden_library','night_corridor'],['alchemy_hall','night_yaolu']
    ];
    const LINGXIAO_TASK_VISIT_ACTIONS={
      gate:['walk_to_sect'],arena:['go_to_arena'],cliff_bridge:['go_to_bridge'],back_forest:['enter_forest'],insight_platform:['go_to_platform'],
      secret_realm_gate:['enter_secret_realm'],alchemy_hall:['go_to_yaolu'],forbidden_library:['go_to_jinge'],night_corridor:['go_to_jinge'],
      night_yaolu:['enter_yaolu_rain'],night_platform:['go_to_courtyard_night'],qingxuan_academy:['visit_master'],border_towers:['go_to_border'],defense_wall:['go_to_spirit_vein']
    };
    function getBuildingData(id){return LINGXIAO_BUILDINGS.find(b=>b.id===id)||null;}
    function getBuildingsByTier(tier){return LINGXIAO_BUILDINGS.filter(b=>b.tier===tier);}
    function isLingxiaoNight(){return player?.worldTime?.night===true;}
    function toggleLingxiaoNightV286838(){if(!player)return;if(!player.worldTime)player.worldTime={totalDays:0};player.worldTime.night=!isLingxiaoNight();showFloatingText?.(isLingxiaoNight()?'🌙 夜色降临，夜间建筑已开放':'☀️ 天光已明','#c9d6ff');updateWorldHUD?.();autoSave?.();showSect();}
    function isLingxiaoRainy(){const d=getGameDate?.();return !!d && ((d.totalDays%9)===3||(d.totalDays%9)===4);}
    function canAccessBuilding(id){
      const b=getBuildingData(id);if(!b)return {allowed:false,reason:'建筑不存在'};
      if(id==='spirit_spring')return {allowed:true};
      if(b.nightOnly&&!isLingxiaoNight())return {allowed:false,reason:'仅夜间开放（可在宗门选择「静候入夜」）'};
      if(b.tier==='forbidden'){
        const plotOpen=(player?.storyProgress||0)>=5;
        return plotOpen?{allowed:true}:{allowed:false,reason:'仅宗门危机剧情开放'};
      }
      const access=BUILDING_ACCESS[b.tier]||{minRealm:0,label:'可进入'};
      if((player?.level||0)<access.minRealm){const realm=CULTIVATION_REALMS?.[access.minRealm]?.name||`${access.minRealm}境`;return {allowed:false,reason:`需要${realm}才能进入`};}
      if(b.id==='secret_realm_gate'&&typeof hasSectSecretQualification==='function'&&!hasSectSecretQualification())return {allowed:false,reason:'需百年宗门大比前三资格'};
      return {allowed:true};
    }
    function getBuildingTierLabel(b){return LINGXIAO_TIER_META[b?.tier]?.label||b?.tier||'宗门建筑';}
    function getBuildingTierColor(b){return LINGXIAO_TIER_META[b?.tier]?.color||'#e7d29c';}
    function buildLingxiaoBuildingPois(){
      return LINGXIAO_BUILDINGS.map(b=>({id:`lx_${b.id}`,buildingId:b.id,name:b.shortName||b.name,icon:b.icon,x:b.x,y:b.y,r:b.id==='spirit_spring'?55:28,action:'lingxiao_building',region:'north',desc:b.desc}));
    }
    function getLingxiaoPoiByBuilding(id){return FLAT_WORLD?.pois?.find(p=>p.action==='lingxiao_building'&&p.buildingId===id)||null;}
    function syncTaskWithLingxiaoBuilding(id){
      if(typeof ensureTaskState!=='function'||typeof getCurrentTaskStep!=='function')return;
      const actions=LINGXIAO_TASK_VISIT_ACTIONS[id]||[];if(!actions.length)return;
      for(const [tid,inst] of Object.entries(ensureTaskState().active||{})){
        if(inst.completed||inst.failed)continue;const step=getCurrentTaskStep(tid);if(step&&actions.includes(step.action)){completeTaskStep(tid,step.action,{buildingId:id});break;}
      }
    }
    function enterLingxiaoBuilding(id){
      const b=getBuildingData(id);if(!b)return;
      const access=canAccessBuilding(id);if(!access.allowed){showFloatingText?.(`🔒 ${access.reason}`,'#ff8a80');return;}
      syncTaskWithLingxiaoBuilding(id);showBuildingInterior(id);
    }
    function buildLingxiaoInfoHtml(b){
      const access=canAccessBuilding(b.id),meta=LINGXIAO_TIER_META[b.tier]||{};
      return `<div class="lx-building-card"><div class="lx-building-head"><div class="lx-building-icon" style="box-shadow:0 0 0 1px ${meta.color||'#fff'}33 inset">${b.icon}</div><div><div class="lx-building-title">${b.name}</div><div class="lx-building-tier">${meta.label||b.tier} · <span class="${access.allowed?'lx-access-ok':'lx-access-lock'}">${access.allowed?'✅ 可进入':'🔒 '+access.reason}</span></div><div class="lx-building-desc">${b.desc}</div></div></div>${b.functions?.length?`<div class="lx-building-tags">${b.functions.map(v=>`<span class="lx-building-tag">⚙️ ${v}</span>`).join('')}</div>`:''}${b.npcs?.length?`<div class="lx-building-tip">👤 常驻：${b.npcs.join('、')}</div>`:''}${b.events?.length?`<div class="lx-building-tip" style="color:#e6b4d4">📖 相关事件：${b.events.join('、')}</div>`:''}</div>`;
    }
    function showBuildingInterior(id){
      const b=getBuildingData(id);if(!b)return;let choices=[];
      if(id==='gate'){choices.push({text:'🚪 返回北域地图',action:'return_to_map'});if(isLingxiaoNight())choices.push({text:'🌙 山门夜色',action:'lingxiao_event',buildingId:id,event:'苏晚晴初次重逢'});}
      else if(id==='task_hall'){choices.push({text:'📜 查看宗门任务',action:'sect_tasks'},{text:'🏅 功绩兑换',action:'sect_shop'});}
      else if(id==='arena'||id==='inner_arena'){choices.push({text:'⚔️ 进入试炼',action:'sect_battle'});}
      else if(id==='dormitory'){choices.push({text:'💤 休息一日',action:'lingxiao_op',buildingId:id,op:'rest'});}
      else if(id==='herb_garden'){choices.push({text:'🌿 采集灵草',action:'lingxiao_op',buildingId:id,op:'herb'});}
      else if(id==='main_hall'){choices.push({text:'🏛️ 进入宗门大殿',action:'sect_hall'});}
      else if(id==='guest_hall'){choices.push({text:'🌌 查看三界势力',action:'factions_human'});}
      else if(id==='outer_elder_hall'){choices.push({text:'📜 查看宗门差事',action:'sect_tasks'});}
      else if(id==='elder_hall'){choices.push({text:'⚖️ 查看宗内派系',action:'lingxiao_factions'});}
      else if(id==='qingxuan_academy'){choices.push({text:'🌸 听清玄真人指点',action:'lingxiao_op',buildingId:id,op:'master'});if((player.level||0)>=2)choices.push({text:'🧘 道心指点',action:'lingxiao_event',buildingId:id,event:'道心指点'});}
      else if(id==='library'){choices.push({text:'📚 进入藏经阁',action:'sect_library'},{text:'📖 翻阅典籍',action:'lingxiao_op',buildingId:id,op:'reading'});}
      else if(id==='alchemy_hall'||id==='night_yaolu'){choices.push({text:'🔥 进入丹庐',action:'alchemy'},{text:'🧰 查看材料用途',action:'material_workshop',filter:'all'});if(player.romance?.npcs?.[MAIN_HEROINE_ID])choices.push({text:'💗 拜访苏晚晴',action:'romance_npc',npcId:MAIN_HEROINE_ID});if(id==='night_yaolu')choices.push({text:isLingxiaoRainy()?'🌧️ 雨夜药庐':'🌙 深夜药庐',action:'lingxiao_event',buildingId:id,event:'那年真正的答案'});}
      else if(id==='beast_hall'){choices.push({text:'🐾 进入御兽堂',action:'pets'},{text:'🧪 炼制灵兽培养丹',action:'material_workshop',filter:'pet'},{text:'🔗 尝试灵兽契约',action:'lingxiao_op',buildingId:id,op:'pet'});}
      else if(id==='forge_hall'){choices.push({text:'⚒️ 查看法宝/炼器',action:'artifacts'},{text:'🔨 材料锻造装备',action:'material_workshop',filter:'forge'});}
      else if(id==='forbidden_library'||id==='night_corridor'){choices.push({text:'🌑 查看禁阁暗线',action:'lingxiao_event',buildingId:id,event:'禁阁夜影'});}
      else if(id==='insight_platform'){choices.push({text:'🧘 登台悟道',action:'lingxiao_op',buildingId:id,op:'insight'},{text:'⚡ 尝试突破',action:'lingxiao_op',buildingId:id,op:'breakthrough'});}
      else if(id==='array_core'){choices.push({text:'🌀 维护护宗大阵',action:'lingxiao_op',buildingId:id,op:'repair_array'});}
      else if(id==='back_forest'){choices.push({text:'🌲 后山试炼',action:'lingxiao_op',buildingId:id,op:'forest_trial'});}
      else if(id==='spirit_spring'){choices.push({text:'💧 灵泉调息 · 免费恢复全部气血与灵力',action:'lingxiao_op',buildingId:id,op:'spring'});}
      else if(id==='cliff_bridge'){choices.push({text:'🌉 站在桥上回望',action:'lingxiao_event',buildingId:id,event:'情断青云'});if((player.romance?.npcs?.[MAIN_HEROINE_ID]?.affection||0)>=80)choices.push({text:'❤️ 第二次选择',action:'romance_npc',npcId:MAIN_HEROINE_ID});}
      else if(id==='hidden_caves'){choices.push({text:'🕳️ 搜寻机缘',action:'lingxiao_op',buildingId:id,op:'cave'});}
      else if(id==='border_towers'){choices.push({text:'🗼 探查魔踪',action:'lingxiao_op',buildingId:id,op:'scout'});}
      else if(id==='defense_wall'){choices.push({text:'🛡️ 巡查灵脉防线',action:'lingxiao_op',buildingId:id,op:'defense'});}
      else if(id==='secret_realm_gate'){choices.push({text:'🌀 进入万宗秘境',action:'secret'});}
      else if(id==='mini_secret_realm'){choices.push({text:'🌟 小秘境探索',action:'mini_realm_v2778'});}
      else if(id==='night_platform'){choices.push({text:'🌙 月下静坐',action:'lingxiao_event',buildingId:id,event:'月下谈心'});}
      else choices.push({text:'🚶 四处看看',action:'lingxiao_op',buildingId:id,op:'explore'});
      choices=choices.map(c=>{if(c.op==='spring'){c.text+='（不限次数 / 无冷却）';return c;}const rule=BUILDING_RULES_V2768[c.op];if(c.action==='lingxiao_op'&&rule){const wait=getBuildingWaitV2768(c.op);c.text+=`（耗时${rule.days}天 / 冷却${rule.cooldown}天${rule.gold?' / '+rule.gold+'灵石':''}${wait?' / 还需'+wait+'天':''}）`;c.condition=()=>getBuildingWaitV2768(c.op)===0;}return c;});
      if(id!=='gate')choices.push({text:'📍 在地图上标记此处',action:'lingxiao_mark',buildingId:id});
      choices.push({text:'← 返回地图',action:'return_to_map'});
      showStory(buildLingxiaoInfoHtml(b),choices);
    }
    function handleLingxiaoBuildingOp(op,id){
      const b=getBuildingData(id);if(!b||gameState==='combat'||gameState==='combat-ending'||player.breakthrough?.isAnimating)return;
      const access=canAccessBuilding(id);if(!access.allowed)return showFloatingText?.(access.reason,'#ffd76a');
      if(op==='mini_secret'&&id==='mini_secret_realm')return showMiniRealmV2778();
      if(op==='spring'){if(id!=='spirit_spring')return;const result=recoverAtSpringV2848();if(!result)return;showFloatingText?.(result.changed?'💧 气血与灵力已恢复满':'💧 气血与灵力已满，可随时再次调息','#7ec9ff');showBuildingInterior(id);return;}
      if(!beginBuildingOpV2768(op,id))return;
      if(op==='rest'){player.hp=getMaxHp();player.mp=getMaxMp();advanceGameTime(1,'外门弟子居休息');showFloatingText?.('💤 状态已恢复','#7ec9ff');}
      else if(op==='herb'){const n=1+Math.floor(Math.random()*2);player.materials['灵草']=(player.materials['灵草']||0)+n;onCollectMaterial?.('灵草',n);showFloatingText?.(`🌿 灵草 +${n}`,'#69f0ae');}
      else if(op==='master'){player.exp+=50;checkLevelUp?.();showFloatingText?.('🌸 清玄真人指点：修为 +50','#ffb6c9');}
      else if(op==='reading'){player.exp+=30;checkLevelUp?.();showFloatingText?.('📖 翻阅典籍：修为 +30','#d9b5ec');}
      else if(op==='insight'){const gain=100+(player.level||0)*35;player.exp+=gain;checkLevelUp?.();showFloatingText?.(`🧘 悟道有感：修为 +${gain}`,'#d9b5ec');}
      else if(op==='breakthrough'){triggerBreakthrough?.();return;}
      else if(op==='pet'){if((player.pets||[]).length<5){captureRandomPet?.();}else showFloatingText?.('⚠️ 灵宠栏已满','#ff8a80');}
      else if(op==='repair_array'){grantSectContributionV2768(8);for(const [tid,inst] of Object.entries(ensureTaskState?.().active||{})){if(inst.completed)continue;const st=getCurrentTaskStep?.(tid);if(st?.action==='repair_array'){completeTaskStep(tid,'repair_array');break;}}showFloatingText?.('🌀 大阵维护完成 · 宗门贡献 +8','#69f0ae');}
      else if(op==='cave'){const roll=Math.random();if(roll<.45){const g=60+Math.floor(Math.random()*141);player.gold+=g;showFloatingText?.(`💰 隐秘宝箱：灵石 +${g}`,'#ffd76a');}else if(roll<.75){player.materials['仙果']=(player.materials['仙果']||0)+1;showFloatingText?.('🍎 发现仙果 ×1','#69f0ae');}else{player.inventory.push('小还丹');showFloatingText?.('💊 发现小还丹 ×1','#69f0ae');}}
      else if(op==='scout'){const hp=150+(player.level||0)*28;startCombat({name:'魔族探子',hp,maxHp:hp,atk:28+(player.level||0)*5,def:12+(player.level||0)*3,gold:100,exp:150},false,false);return;}
      else if(op==='defense'){grantSectContributionV2768(10);showFloatingText?.('🛡️ 防线巡查完成 · 宗门贡献 +10','#69f0ae');}
      else if(op==='mini_secret'){const roll=Math.random();if(roll<.35){const g=80+Math.floor(Math.random()*121);player.gold+=g;showFloatingText?.(`💰 秘境灵石 +${g}`,'#ffd76a');}else if(roll<.7){player.exp+=120;checkLevelUp?.();showFloatingText?.('🌟 秘境感悟：修为 +120','#d9b5ec');}else{const e=getEnemy?.();if(e){e.hp=Math.max(1,Math.floor(e.hp*.85));e.maxHp=e.hp;startCombat(e,false,false);return;}}}
      else if(op==='forest_trial'){const e=getEnemy?.();if(e){e.name=`后山试炼·${e.name}`;startCombat(e,false,false);return;}}
      else {showFloatingText?.(`🚶 你在${b.shortName||b.name}四处查看`,'#b8c7d8');}
      updateStats?.();updateWorldHUD?.();autoSave?.();showBuildingInterior(id);
    }
    function triggerLingxiaoBuildingEvent(id,event){
      const b=getBuildingData(id);let html='',choices=[];
      if(event==='情断青云'){html='<p style="color:#ffb6c9;font-weight:800">💔 青石桥旧忆</p><p>桥下云雾翻涌，你想起当年苏晚晴将旧木牌还给你的背影。数年仙途，旧事仍在。</p>';choices=[{text:'收起回忆',action:'return_to_map'}];}
      else if(event==='苏晚晴初次重逢'){html='<p style="color:#ffb6c9;font-weight:800">🌙 山门重逢</p><p>夜色里，苏晚晴提灯走过白玉山门。她看见你时微微一怔，随后轻轻点头。</p>';choices=[{text:'上前交谈',action:'romance_npc',npcId:MAIN_HEROINE_ID},{text:'默然目送',action:'return_to_map'}];}
      else if(event==='道心指点'){html='<p style="color:#d9b5ec;font-weight:800">🌸 清玄真人·道心指点</p><p>“修行快慢只是表象。真正决定你能走多远的，是遇逆境时仍能守住的本心。”</p>';choices=[{text:'受教',action:'return_to_map'}];}
      else if(event==='禁阁夜影'){html='<p style="color:#b7a6ff;font-weight:800">🌑 禁阁夜影</p><p>夜廊尽头传来低声交谈。顾承渊进入禁阁深处，而大长老顾玄岳竟亲自为他开门。</p>';choices=[{text:'记下此事',action:'return_to_map'}];}
      else if(event==='那年真正的答案'){html=`<p style="color:#ffb6c9;font-weight:800">${isLingxiaoRainy()?'🌧️':'🌙'} 药庐深夜</p><p>药庐灯火昏黄，苏晚晴将那枚旧木牌放在桌上：“当年我不是弃你择仙途。我只是太年轻，也太无力。”</p>`;choices=[{text:'听她继续说',action:'romance_npc',npcId:MAIN_HEROINE_ID},{text:'沉默片刻',action:'return_to_map'}];}
      else if(event==='月下谈心'){html='<p style="color:#cfd8ff;font-weight:800">🌙 月下观星</p><p>观星台风声很轻，远处宗门灯火如星。苏晚晴难得没有谈修行，只与你说起这些年的心事。</p>';choices=[{text:'陪她坐一会',action:'romance_npc',npcId:MAIN_HEROINE_ID},{text:'返回',action:'return_to_map'}];}
      else {html=`<p>${b?.icon||'🏛️'} ${b?.name||'建筑'}</p><p>这里暂时没有新的特殊剧情。</p>`;choices=[{text:'返回',action:'return_to_map'}];}
      showStory(html,choices);
    }
    function navigateToLingxiaoBuilding(id){const p=getLingxiaoPoiByBuilding(id);if(!p){showFloatingText?.('建筑不在当前地图','#ff8a80');return;}closeWorldOverlay?.();FLAT_WORLD.target={x:p.x,y:p.y};FLAT_WORLD.tapTargetFx={x:p.x,y:p.y,startedAt:performance.now()};showFloatingText?.(`📍 正在前往 ${p.name}`,'#c7e4ff');}
    function showBuildingDirectory(){
      const order=['outer','middle','inner','core','back','function','secret','forbidden'];let html='<p style="font-size:18px;font-weight:850;color:#f2d68d">🏯 凌霄宗 · 建筑总览</p><p style="font-size:11px;color:#9ca8b6">建筑已实际分布在北域地图中；点击建筑可查看，地图上靠近后也能直接进入。</p>';
      for(const tier of order){const list=getBuildingsByTier(tier);if(!list.length)continue;const meta=LINGXIAO_TIER_META[tier]||{};html+=`<div class="lx-directory-group"><div class="lx-directory-title" style="color:${meta.color||'#f2d68d'}">${meta.label||tier} · ${list.length}处</div><div class="lx-directory-grid">${list.map(b=>{const a=canAccessBuilding(b.id);return `<div class="lx-directory-item ${a.allowed?'':'locked'}" onclick="enterLingxiaoBuilding('${b.id}')"><div class="lx-directory-name">${b.icon} ${b.shortName||b.name}</div><div class="lx-directory-access">${a.allowed?'✅ 可进入':'🔒 '+a.reason}</div></div>`;}).join('')}</div></div>`;}
      html+='<div class="lx-building-tip">🌙 月下观星台、禁阁夜廊、深夜药庐只在设备当地 18:00–06:00 开放互动。</div>';showStory(html,[{text:'📍 返回宗门总览',action:'sect'},{text:'← 返回地图',action:'return_to_map'}]);
    }
    function drawLingxiaoBuildingPaths(ctx,transform=null){ /* Routes intentionally hidden in V28.47. */ }

    function getWorldMapConfig(regionId=currentRegion || player?.worldMapId || 'south') {
      return WORLD_MAP_CONFIGS[regionId] || WORLD_MAP_CONFIGS.south;
    }

    function buildWorldMapPois(regionId) {
      const cfg=getWorldMapConfig(regionId), list=[];
      for(const [id,pos] of Object.entries(cfg.poiPositions)) {
        const base=WORLD_POI_TEMPLATES[id];
        if(!base) continue;
        const poi={...base,x:pos[0],y:pos[1]};
        if(id==='travel_gate') {
          poi.region=regionId;
          poi.name=regionId==='south'?'四方驿道':'归途界门';
          poi.desc=regionId==='south'?'选择前往四域或三族宗门地图':'可返回南域，也可转往其他已解锁地域';
        }
        list.push(poi);
      }
      if(regionId==='north') list.push(...buildLingxiaoBuildingPois());
      list.push(...buildExplorationPoisV2828(regionId,list));
      return list;
    }

    function getPoiMapRegion(poiId) {
      for(const [regionId,cfg] of Object.entries(WORLD_MAP_CONFIGS)) {
        if(Object.prototype.hasOwnProperty.call(cfg.poiPositions,poiId)) return regionId;
      }
      return 'south';
    }

    function getRegionIdAtPoint() { return currentRegion || player?.worldMapId || 'south'; }
    function getPlayerRegion() { return currentRegion || player?.worldMapId || 'south'; }
    function isDeepInsideRegion() { return true; }

    function warnRegionLocked(regionId, prefix='境界不足') {
      const now=performance.now();
      const key=`${regionId}:${getRegionUnlockRealmName(regionId)}`;
      if(FLAT_WORLD?._lastRegionLockWarnKey===key && now-(FLAT_WORLD._lastRegionLockWarnAt||0)<900) return;
      if(FLAT_WORLD){FLAT_WORLD._lastRegionLockWarnKey=key;FLAT_WORLD._lastRegionLockWarnAt=now;}
      const region=getRegionInfo(regionId);
      showFloatingText(`🔒 ${prefix}：需${getRegionUnlockRealmName(regionId)}方可前往${region.shortName||region.name}`,'#ff6b6b');
    }

    function getRegionInfo(regionId) {
      const id=regionId || currentRegion || 'south';
      const base=WORLD_REGIONS[id] || WORLD_REGIONS.south;
      if(typeof FLAT_WORLD!=='undefined' && currentRegion===id) {
        return {...base,bounds:{xMin:0,xMax:FLAT_WORLD.width,yMin:0,yMax:FLAT_WORLD.height}};
      }
      return base;
    }

    function isPointInRegion(x,y,regionId) {
      return regionId===(currentRegion||'south') && x>=0 && x<=FLAT_WORLD.width && y>=0 && y<=FLAT_WORLD.height;
    }

    function applyWorldMapLayout(regionId, silent=false, targetPoiId=null) {
      stopNavigationV2830();
      if(!WORLD_MAP_CONFIGS[regionId]) regionId='south';
      if(!isRegionUnlocked(regionId)) { warnRegionLocked(regionId,'无法前往'); return false; }
      const cfg=WORLD_MAP_CONFIGS[regionId];
      closeScrollMapV2837();
      currentRegion=regionId;
      if(player) player.worldMapId=regionId;
      FLAT_WORLD.width=cfg.width; FLAT_WORLD.height=cfg.height;
      FLAT_WORLD.pois=buildWorldMapPois(regionId);
      FLAT_WORLD.player.x=cfg.spawn.x; FLAT_WORLD.player.y=cfg.spawn.y;
      FLAT_WORLD.camera.x=0; FLAT_WORLD.camera.y=0;
      FLAT_WORLD.target=null; FLAT_WORLD.keys={}; FLAT_WORLD.nearby=null;
      FLAT_WORLD.monsters=[]; FLAT_WORLD.decor=[]; FLAT_WORLD.colliders=[];
      FLAT_WORLD.resourceTravelAccumulator=0;
      FLAT_WORLD._lastNearbyId=null; FLAT_WORLD._lastAreaKey='';
      FLAT_WORLD._regionSpawnPending=0; FLAT_WORLD._regionSpawnTimer=0;
      releaseStaticWorldCacheV2767();
      onRegionEnter(regionId,silent);
      seededWorldDecor();
      rebuildWorldColliders();
      if(FLAT_WORLD.initialized) resizeWorldCanvas();
      const targetPoi=targetPoiId?FLAT_WORLD.pois.find(p=>p.id===targetPoiId):null;
      if(targetPoi) FLAT_WORLD.target={x:targetPoi.x,y:targetPoi.y};
      return true;
    }

    function ensureWorldMapInitialized() {
      const desired=(player && WORLD_MAP_CONFIGS[player.worldMapId])?player.worldMapId:'south';
      if(!isRegionUnlocked(desired)) player.worldMapId='south';
      applyWorldMapLayout(player?.worldMapId||'south',true);
    }

    function showWorldTravelMenu() {
      const here=currentRegion || player?.worldMapId || 'south';
      const region=getRegionInfo(here);
      let html=`<p>🗺️ <b>三界行路</b></p><p>你当前位于：<b>${region.icon} ${region.name}</b></p><p style="color:#aaa;font-size:12px">四域与三族山门通过驿道、界门相连；仙界需地仙境，魔域需元婴境。</p>`;
      const order=Object.keys(WORLD_MAP_CONFIGS);
      const choices=[];
      for(const id of order){
        if(id===here) continue;
        const r=getRegionInfo(id), unlocked=isRegionUnlocked(id), req=getRegionUnlockRealmName(id);
        choices.push({
          text:unlocked?`${r.icon} 前往${r.shortName} · ${r.name.replace(/^.*?·\s*/, '')}`:`🔒 ${r.shortName} · 需要${req}境`,
          action:'travel_world_map', regionId:id,
          condition:()=>isRegionUnlocked(id)
        });
      }
      if(FACTION_MAPS_V2806[here])choices.unshift({text:'🧭 本图宗门导航',action:'faction_guide_v2806'});
      choices.push({text:'← 暂不启程',action:'return_to_map'});
      showStory(html,choices);
    }

    function travelToWorldMap(regionId, targetPoiId=null) {
      if(!isRegionUnlocked(regionId)) { warnRegionLocked(regionId,'无法前往'); return showWorldTravelMenu(); }
      if(!applyWorldMapLayout(regionId,false,targetPoiId)) return;
      closeWorldOverlay();
      const r=getRegionInfo(regionId);
      showFloatingText(`${r.icon} 已抵达${r.shortName}`,r.color);
      autoSave();
    }

    function ensureRegionStyles(){
      if(document.getElementById('xiantuRegionStyles'))return;
      const style=document.createElement('style'); style.id='xiantuRegionStyles';
      style.textContent=`
        @keyframes regionFadeInOut{0%{opacity:0;transform:translate(-50%,18px) scale(.92)}15%{opacity:1;transform:translate(-50%,0) scale(1)}82%{opacity:1}100%{opacity:0;transform:translate(-50%,-28px) scale(.96)}}
        @keyframes regionFloatUp{0%{opacity:0;transform:translate(-50%,18px) scale(.82)}18%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1;transform:translate(-50%,-18px)}100%{opacity:0;transform:translate(-50%,-55px) scale(.92)}}
        .world-atmosphere-overlay{position:absolute;inset:0;pointer-events:none;z-index:2;transition:background 1.2s ease,opacity 1.2s ease;}
      `;
      document.head.appendChild(style);
    }

    function showRegionEntryNotification(region, message=''){
      ensureRegionStyles();
      let n=document.getElementById('worldRegionNotice');
      if(!n){
        n=document.createElement('div'); n.id='worldRegionNotice';
        n.style.cssText='position:fixed;top:20%;left:50%;transform:translateX(-50%);background:rgba(8,10,10,.9);padding:12px 24px;border-radius:11px;font-size:17px;font-weight:800;z-index:5000;pointer-events:none;opacity:0;transition:opacity .16s linear;box-shadow:0 8px 24px rgba(0,0,0,.28)';
        document.body.appendChild(n);
      }
      n.style.border=`2px solid ${region.color}`; n.style.color=region.color;
      n.innerHTML=`${region.icon} ${region.name}<div style="font-size:11px;color:#ddd;margin-top:4px;font-weight:500">危险等级 ${'★'.repeat(region.dangerLevel)}${'☆'.repeat(4-region.dangerLevel)}${message?` · ${message.replace(/^[^ ]+\s*/, '')}`:''}</div>`;
      if(regionNoticeTimer){clearTimeout(regionNoticeTimer);regionNoticeTimer=null;}
      n.style.opacity='1';
      regionNoticeTimer=setTimeout(()=>{n.style.opacity='0';regionNoticeTimer=null;},PERF_CONFIG?.lowEnd?1200:1800);
    }

    function showFloatingText(text,color='#ffd700'){
      ensureRegionStyles();
      const el=document.createElement('div');
      el.style.cssText=`position:fixed;left:50%;bottom:39%;transform:translateX(-50%);color:${color};font-size:18px;font-weight:800;text-shadow:0 0 16px rgba(0,0,0,.95);z-index:3000;pointer-events:none;animation:regionFloatUp 1.5s ease-out forwards`;
      el.textContent=text; document.body.appendChild(el); setTimeout(()=>el.remove(),1600);
    }

    function updateWorldAtmosphere(terrainType){
      ensureRegionStyles();
      const panel=document.getElementById('worldPanel'); if(!panel)return;
      let overlay=FLAT_WORLD?._atmoOverlay || panel.querySelector('.world-atmosphere-overlay');
      if(!overlay){ overlay=document.createElement('div'); overlay.className='world-atmosphere-overlay'; panel.appendChild(overlay); if(FLAT_WORLD)FLAT_WORLD._atmoOverlay=overlay; }
      // 低配模式地图本身已有四域底色，关闭全屏半透明层，避免切区时触发大面积合成/重绘。
      if(PERF_CONFIG?.lowEnd){overlay.style.transition='none';overlay.style.opacity='0';overlay.style.background='transparent';return;}
      const colors={snow:'rgba(180,220,255,.10)',plains:'rgba(139,195,74,.035)',forest:'rgba(38,130,72,.08)',dark:'rgba(105,18,28,.15)'};
      overlay.style.transition='background .45s ease,opacity .45s ease';
      overlay.style.background=colors[terrainType]||'transparent'; overlay.style.opacity='1';
    }

    function updateRegionStatusHUD(){
      const region=getRegionInfo(currentRegion || getPlayerRegion());
      let el=document.getElementById('worldRegionStatus');
      if(!el){
        const hud=document.querySelector('.world-hud'); if(!hud)return;
        el=document.createElement('div'); el.id='worldRegionStatus';
        el.style.cssText='display:flex;align-items:center;gap:7px;font-size:11px;margin-top:7px;padding:5px 8px;border-radius:8px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08)';
        hud.appendChild(el);
      }
      let text=`${region.icon} ${region.name} · 危险${region.dangerLevel}`;
      if(activeRegionDebuff) text+=`　⚠ ${activeRegionDebuff.desc}`;
      if(activeRegionBuff) text+=`　✨ ${activeRegionBuff.desc}`;
      el.textContent=text; el.style.color=region.color;
    }

    function clearRegionEffects(){ activeRegionDebuff=null; activeRegionBuff=null; updateRegionStatusHUD(); }
    function applyRegionDebuff(regionId,debuff){ activeRegionDebuff=debuff?{regionId,...debuff}:null; updateRegionStatusHUD(); }
    function applyRegionBuff(regionId,buff){ activeRegionBuff=buff?{regionId,...buff}:null; updateRegionStatusHUD(); }

    function onRegionEnter(regionId, silent=false){
      const region=getRegionInfo(regionId), effect=REGION_ENTRY_EFFECTS[regionId];
      activeRegionDebuff=effect?.debuff?{regionId,...effect.debuff}:null;
      activeRegionBuff=effect?.buff?{regionId,...effect.buff}:null;
      // 西域降低最大气血后立即夹紧当前气血，离开西域不会自动补血。
      player.hp=Math.min(player.hp,getMaxHp());
      player.mp=Math.min(player.mp,getMaxMp());
      if(!silent) showRegionEntryNotification(region,effect?.message||'');
      updateWorldAtmosphere(region.terrain);
      updateRegionStatusHUD();

      // 不再切区瞬间 autoSave，也不再一次性生成整批怪物。旧区怪清理很轻量，
      // 新区怪物分帧补充，避免同一帧做几十次POI/距离检测。
      if(FLAT_WORLD?.monsters){
        FLAT_WORLD.monsters=FLAT_WORLD.monsters.filter(m=>m.inCombat || m.regionId===regionId);
        const cap=Math.min(FLAT_WORLD.maxMonsters,region.maxMonsters||FLAT_WORLD.maxMonsters);
        const active=FLAT_WORLD.monsters.filter(m=>m.alive&&m.regionId===regionId).length;
        FLAT_WORLD._regionSpawnPending=Math.max(0,cap-active);
        FLAT_WORLD._regionSpawnTimer=0;
      }
      // 标记静态HUD缓存需要下一次普通HUD更新时再同步，不在切区帧做整套DOM刷新。
      FLAT_WORLD._lastAreaKey='';
    }

    function checkRegionChange(){
      // 独立地图模式不再通过坐标跨区；地域切换只由“前往其他地域”选项触发。
      if(!currentRegion) currentRegion=player?.worldMapId || 'south';
      return currentRegion;
    }

    function getRegionWarBonus(){
      const region=currentRegion || getPlayerRegion();
      if(region==='west') return {multiplier:.8,desc:'深入敌境，补给线漫长，联军调度受到明显牵制'};
      if(region==='south') return {multiplier:1.1,desc:'本土作战，后方稳固，补给与士气更为有利'};
      return {multiplier:1,desc:'地利未见明显偏向'};
    }

    // ================== 俯视平面世界 ==================
    // ================== 性能优化配置 ==================
    // 低配置电脑和手机自动启用轻量渲染：降低像素比、限制地图/3D帧率、缓存静态地图。
    const PERF_CONFIG = {
      lowEnd: ((navigator.deviceMemory || 4) <= 8) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''),
      // 真流畅模式：世界移动不再人为锁30FPS，直接跟随浏览器RAF（通常60Hz）。
      // 低配设备默认关闭全屏透明WebGL角色层，换稳定帧率。
      ultraSmooth: ((navigator.deviceMemory || 4) <= 8) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''),
      minimapInterval: 1000 / 5,      // 小地图5FPS即可，避免抢主循环时间
      avatar3DInterval: 1000 / 30,    // 非低配设备的3D角色仍单独限制30FPS
      lastMinimapDraw: 0,
      last3DDraw: 0,
      fpsFrames: 0,
      fpsStartedAt: performance.now(),
      measuredFps: 0,
      staticWorldCanvas: null,
      staticWorldReady: false
    };

    const FLAT_WORLD = {
      width: 2200,
      height: 1450,
      player: { x: 1050, y: 760, r: 17, speed: 250 },
      keys: {},
      target: null,
      tapTargetFx: null,
      nearby: null,
      raf: null,
      lastTime: 0,
      initialized: false,
      camera: { x: 0, y: 0 },
      moving:false, moveDirX:0, moveDirY:0,
      pois: [
        { id:'village', name:'青云村', icon:'🏘', x:770, y:900, r:96, action:'village', region:'south', desc:'南域村舍与炊烟，是修士旅途的起点' },
        { id:'romance', name:'姻缘亭', icon:'💗', x:1020, y:1030, r:58, action:'romance', region:'south', desc:'旧缘未了，也许有些话终究要重新面对' },
        { id:'shop', name:'百宝阁', icon:'🏪', x:470, y:845, r:74, action:'shop', region:'south', desc:'丹药、兵器与护甲' },
        { id:'alchemy', name:'炼丹房', icon:'🔥', x:760, y:300, r:72, action:'alchemy', region:'west', desc:'西域边缘的丹火据点，可就近处理魔渊珍材' },
        { id:'forest', name:'迷雾森林', icon:'🌲', x:1470, y:955, r:120, action:'forest', region:'east', desc:'东域灵兽森林深处，奇遇与危险并存' },
        { id:'mountain', name:'问道山', icon:'⛰', x:1510, y:260, r:125, action:'mountain', region:'north', desc:'北域雪线上的问道之山，灵气冷冽' },
        { id:'sect', name:'凌霄宗', icon:'⛩', x:1760, y:520, r:105, action:'sect', region:'north', desc:'男主早期所在宗门，坐落于北域山脉边缘' },
        { id:'factions', name:'三界势力碑', icon:'🌌', x:2020, y:245, r:74, action:'factions_human', region:'north', desc:'记载仙人宗门、魔族势力与人类万宗的三界层级' },
        { id:'market', name:'仙市', icon:'🏮', x:720, y:1130, r:92, action:'market', region:'south', desc:'南域修士交换宝物的繁华集市' },
        { id:'home', name:'洞府', icon:'🏡', x:980, y:1260, r:78, action:'home', region:'south', desc:'你的修炼居所' },
        { id:'battlefield', name:'古战场', icon:'⚔', x:330, y:460, r:110, action:'battlefield', region:'west', desc:'西域魔渊中的古战场，残魂游荡' },
        { id:'pets', name:'灵兽谷', icon:'🐾', x:1880, y:845, r:72, action:'pets', region:'east', desc:'东域灵兽聚居之谷，可查看与培养灵宠' },
        { id:'artifacts', name:'法宝台', icon:'✨', x:900, y:570, r:70, action:'artifacts', region:'west', desc:'魔渊边缘的古老法台，可祭炼与强化法宝' },
        { id:'secret', name:'万宗秘境', icon:'🌀', x:1810, y:1220, r:82, action:'secret', region:'east', desc:'隐藏在东域深处，仅向百年宗门大比前三宗门开放' },
        { id:'rest', name:'灵泉', icon:'💧', x:430, y:1190, r:65, action:'rest', region:'south', desc:'南域灵泉，可在此调息恢复' }
      ],
      decor: [],
      monsters: [],
      monsterSpawnTimer: 0,
      maxMonsters: 6,
      monsterRespawnTime: 5,
      resourceTravelAccumulator: 0,
      _drawItems: [],
      _lastNearbyId: null,
      _lastAreaKey: '',
      _regionSpawnPending: 0,
      _regionSpawnTimer: 0,
      _atmoOverlay: null,
      _lastRegionLockWarnKey: '',
      _lastRegionLockWarnAt: 0,
      colliders: []
    };

    // ================== 地图怪物实体化系统 ==================
    function getWorldMonsterIcon(name='') {
      if(name.includes('兔'))return '🐇';
      if(name.includes('龟'))return '🐢';
      if(name.includes('蝙蝠'))return '🦇';
      if(name.includes('鹰'))return '🦅';
      if(name.includes('鹤'))return '🪶';
      if(name.includes('凤'))return '🔥';
      if(name.includes('龙'))return '🐉';
      if (name.includes('狼')) return '🐺';
      if (name.includes('狐')) return '🦊';
      if (name.includes('山贼') || name.includes('邪修')) return '🥷';
      if (name.includes('傀儡')) return '🗿';
      if (name.includes('蛟') || name.includes('蟒')) return '🐍';
      if (name.includes('树精')) return '🌳';
      if (name.includes('巨猿')) return '🦍';
      if (name.includes('灵兽') || name.includes('妖兽')) return '🐾';
      if (name.includes('妖')) return '🐉';
      if (name.includes('鬼')) return '👻';
      if (name.includes('魔')) return '💀';
      return '👾';
    }

    function createRegionEnemyTemplate(region, name) {
      const existing=ENEMIES.find(e=>e.name===name);
      if(existing) return {...existing};
      const d=region.dangerLevel;
      return {
        name,
        hp: 60 + d*45,
        atk: 12 + d*9,
        def: 4 + d*4,
        gold: 18 + d*28,
        exp: 25 + d*35
      };
    }

    function spawnSingleMonster() {
      if (!FLAT_WORLD?.monsters || FLAT_WORLD.monsters.length >= FLAT_WORLD.maxMonsters || !player) return null;
      const regionId=currentRegion || getPlayerRegion(), region=getRegionInfo(regionId);
      const regionCap=Math.min(FLAT_WORLD.maxMonsters,region.maxMonsters||FLAT_WORLD.maxMonsters);
      const regionCount=FLAT_WORLD.monsters.filter(m=>m.alive && (m.regionId||regionId)===regionId).length;
      if(regionCount>=regionCap)return null;

      // 南域为安全区域：最多仅保留2只低级游荡怪。
      if(region.isSafe && regionId==='south' && Math.random()>.45) return null;
      if(!region.monsters?.length) return null;

      let x=0,y=0,valid=false;
      const b=region.bounds;
      for(let attempts=0;attempts<45 && !valid;attempts++){
        // 以玩家附近为优先，同时严格限制在当前象限。
        x=Math.max(b.xMin+55,Math.min(b.xMax-55,FLAT_WORLD.player.x+(Math.random()-.5)*720));
        y=Math.max(b.yMin+55,Math.min(b.yMax-55,FLAT_WORLD.player.y+(Math.random()-.5)*620));
        const farFromPoi=!FLAT_WORLD.pois.some(p=>Math.hypot(x-p.x,y-p.y)<p.r+(p.action==='lingxiao_building'?34:105));
        const farFromPlayer=Math.hypot(x-FLAT_WORLD.player.x,y-FLAT_WORLD.player.y)>220;
        const farFromMonster=!FLAT_WORLD.monsters.some(m=>m.alive&&Math.hypot(x-m.x,y-m.y)<90);
        const outsideServices=!(getWorldMapConfig(regionId).safeZones||[]).some(z=>Math.hypot(x-z.x,y-z.y)<z.r);
        valid=outsideServices&&farFromPoi&&farFromPlayer&&farFromMonster&&isPointInRegion(x,y,regionId);
      }
      if(!valid)return null;

      const name=(typeof rollPetCaptureEncounterName==='function'?rollPetCaptureEncounterName(region):null)||region.monsters[Math.floor(Math.random()*region.monsters.length)];
      const enemyTemplate=createRegionEnemyTemplate(region,name);
      const maxRealm=CULTIVATION_REALMS.length-1;
      // 危险度决定境界偏移：南域偏弱、东域同阶、北/西域更可能出现高一境精英。
      let realmOffset=0;
      if(regionId==='south') realmOffset=Math.random()<.7?-1:0;
      else if(regionId==='east') realmOffset=Math.random()<.2?1:0;
      else if(regionId==='north') realmOffset=Math.random()<.28?1:0;
      else if(regionId==='west') realmOffset=Math.random()<.35?1:0;
      const elite=realmOffset>0 || Math.random() < (.08 + region.dangerLevel*.035);
      const monsterRealm=Math.max(0,Math.min(maxRealm,(player.level||0)+realmOffset));
      const monsterPhase=Math.floor(Math.random()*4);
      const realmScale=1+Math.max(0,monsterRealm-5)*.08+monsterPhase*.03;
      const dangerScale=.82+region.dangerLevel*.14;
      const enemy={
        ...enemyTemplate,
        hp:Math.max(1,Math.round(enemyTemplate.hp*realmScale*dangerScale*(elite?1.35:1))),
        atk:Math.max(1,Math.round(enemyTemplate.atk*Math.sqrt(realmScale)*dangerScale*(elite?1.18:1))),
        def:Math.max(0,Math.round(enemyTemplate.def*Math.sqrt(realmScale)*dangerScale*(elite?1.12:1))),
        gold:Math.max(1,Math.round(enemyTemplate.gold*dangerScale*(elite?1.35:1))),
        exp:Math.max(1,Math.round(enemyTemplate.exp*dangerScale*(elite?1.45:1))),
        _realmLevel:monsterRealm,_realmPhase:monsterPhase,_isElite:elite,_regionId:regionId
      };
      enemy.maxHp=enemy.hp;
      balanceEnemyV2802(enemy);
      const dirX=Math.random()-.5,dirY=Math.random()-.5,len=Math.hypot(dirX,dirY)||1;
      const monster={
        id:`wm_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,x,y,radius:22,
        speed:18+Math.random()*28,enemy,regionId,
        dir:{x:dirX/len,y:dirY/len},dirTimer:1+Math.random()*4,
        alive:true,inCombat:false,battleCooldown:1.5
      };
      FLAT_WORLD.monsters.push(monster); return monster;
    }

    function spawnMonsters(count = FLAT_WORLD.maxMonsters) {
      const region=getRegionInfo(currentRegion || getPlayerRegion());
      const cap=Math.min(count,FLAT_WORLD.maxMonsters,region.maxMonsters||FLAT_WORLD.maxMonsters);
      const active=FLAT_WORLD.monsters.filter(m=>m.alive && m.regionId===region.id).length;
      const need=Math.max(0,cap-active);
      // 多尝试几次，兼容南域低刷怪概率。
      for(let i=0,attempts=0;i<need && attempts<need*4;attempts++){if(spawnSingleMonster())i++;}
    }

    function removeMonster(monsterRef) {
      if (!monsterRef || !FLAT_WORLD?.monsters) return;
      const idx = FLAT_WORLD.monsters.indexOf(monsterRef);
      if (idx !== -1) FLAT_WORLD.monsters.splice(idx, 1);
      const region=getRegionInfo(currentRegion || getPlayerRegion());
      const cap=Math.min(FLAT_WORLD.maxMonsters,region.maxMonsters||FLAT_WORLD.maxMonsters);
      if (FLAT_WORLD.monsters.filter(m=>m.alive&&m.regionId===region.id).length < cap) spawnSingleMonster();
    }

    function releaseCurrentMapMonster(defeated = false) {
      const monster = currentMonsterRef;
      if (!monster) return;
      if (defeated) {
        removeMonster(monster);
      } else {
        monster.inCombat = false;
        monster.alive = true;
        monster.battleCooldown = 8;
        // 逃跑/战败后保留本次已造成的伤害，但至少留1点气血。
        if (currentEnemy && Number.isFinite(currentEnemy.hp)) {
          monster.enemy.hp = Math.max(1, Math.min(monster.enemy.maxHp || currentEnemy.maxHp || currentEnemy.hp, currentEnemy.hp));
        }
      }
      currentMonsterRef = null;
    }

    function updateWorldMonsters(dt) {
      const introduction=typeof firstJourneyV28687==='function'?firstJourneyV28687():null;
      if(introduction&&!introduction.paused&&introduction.step<4)return;
      const warSceneV2840=typeof WAR_MAP_V2840!=='undefined'?WAR_MAP_V2840.scene:null;
      if(warSceneV2840?.local&&Math.hypot(FLAT_WORLD.player.x-warSceneV2840.site.x,FLAT_WORLD.player.y-warSceneV2840.site.y)<235)return;
      for (const monster of FLAT_WORLD.monsters) {
        if (!monster.alive || monster.inCombat) continue;
        if (monster.battleCooldown > 0) monster.battleCooldown = Math.max(0, monster.battleCooldown - dt);
        monster.dirTimer -= dt;
        if (monster.dirTimer <= 0) {
          const dx = Math.random() - 0.5, dy = Math.random() - 0.5;
          const len = Math.hypot(dx, dy) || 1;
          monster.dir.x = dx / len;
          monster.dir.y = dy / len;
          monster.dirTimer = 2 + Math.random() * 4;
        }

        const nextX = monster.x + monster.dir.x * monster.speed * dt;
        const nextY = monster.y + monster.dir.y * monster.speed * dt;
        const rb = getRegionInfo(monster.regionId || currentRegion || getPlayerRegion()).bounds;
        const minX=rb.xMin+30,maxX=rb.xMax-30,minY=rb.yMin+30,maxY=rb.yMax-30;
        let candidateX = Math.max(minX, Math.min(maxX, nextX));
        let candidateY = Math.max(minY, Math.min(maxY, nextY));
        const resolvedMonsterPos = resolveWorldCollisionForActor(monster.x, monster.y, candidateX, candidateY, monster.radius || 18, c => c.type !== 'tree' || Math.random() > 0.03);
        if (Math.abs(resolvedMonsterPos.x - candidateX) > 0.6) monster.dir.x *= -1;
        if (Math.abs(resolvedMonsterPos.y - candidateY) > 0.6) monster.dir.y *= -1;
        monster.x = Math.max(minX, Math.min(maxX, resolvedMonsterPos.x));
        monster.y = Math.max(minY, Math.min(maxY, resolvedMonsterPos.y));
        if (monster.x <= minX || monster.x >= maxX) monster.dir.x *= -1;
        if (monster.y <= minY || monster.y >= maxY) monster.dir.y *= -1;

        // 怪物不会主动穿进城镇/宗门/商店等安全区；靠近时转向。
        const unsafePoi = FLAT_WORLD.pois.find(p => Math.hypot(monster.x - p.x, monster.y - p.y) < p.r + 78);
        if (unsafePoi) {
          const ax = monster.x - unsafePoi.x, ay = monster.y - unsafePoi.y;
          const al = Math.hypot(ax, ay) || 1;
          monster.dir.x = ax / al; monster.dir.y = ay / al;
          monster.x += monster.dir.x * 28 * dt;
          monster.y += monster.dir.y * 28 * dt;
        }
      }

      if (!isWorldOverlayOpen() && gameState !== 'combat') {
        const p = FLAT_WORLD.player;
        for (const monster of FLAT_WORLD.monsters) {
          if (!monster.alive || monster.inCombat || monster.battleCooldown > 0) continue;
          if (Math.hypot(p.x - monster.x, p.y - monster.y) < 60) {
            monster.inCombat = true;
            FLAT_WORLD.target = null;
            FLAT_WORLD.moving = false;
            const enemy = { ...monster.enemy, maxHp: monster.enemy.maxHp || monster.enemy.hp };
            startCombat(enemy, false, false, monster);
            break;
          }
        }
      }

      // 切区后的怪物分批补充：每约0.42秒最多生成1只，避免跨区瞬间卡顿。
      if((FLAT_WORLD._regionSpawnPending||0)>0){
        FLAT_WORLD._regionSpawnTimer=(FLAT_WORLD._regionSpawnTimer||0)+dt;
        if(FLAT_WORLD._regionSpawnTimer>=.42){
          FLAT_WORLD._regionSpawnTimer=0;
          const before=FLAT_WORLD.monsters.length;
          const spawned=spawnSingleMonster();
          if(spawned || FLAT_WORLD.monsters.length>before) FLAT_WORLD._regionSpawnPending=Math.max(0,FLAT_WORLD._regionSpawnPending-1);
          else if((currentRegion||getPlayerRegion())==='south') FLAT_WORLD._regionSpawnPending=Math.max(0,FLAT_WORLD._regionSpawnPending-1);
        }
      }

      FLAT_WORLD.monsterSpawnTimer += dt;
      if (FLAT_WORLD.monsterSpawnTimer >= FLAT_WORLD.monsterRespawnTime) {
        FLAT_WORLD.monsterSpawnTimer = 0;
        const region=getRegionInfo(currentRegion || getPlayerRegion());
        const cap=Math.min(FLAT_WORLD.maxMonsters,region.maxMonsters||FLAT_WORLD.maxMonsters);
        const activeCount = FLAT_WORLD.monsters.filter(m => m.alive && m.regionId===region.id).length;
        if (activeCount < cap) spawnSingleMonster();
      }
    }

    function mapEnemyArtV2833(monster){
      const n=String(monster.enemy?.name||'');
      if(/狐/.test(n))return ['beasts',0,2];
      if(/傀儡/.test(n))return ['beasts',1,2];
      if(/树精|树妖/.test(n))return ['beasts',2,2];
      if(/猿|猴/.test(n))return ['beasts',3,2];
      if(/狼/.test(n))return ['enemies',0,4];
      if(/虎|灵兽|妖兽|邪兽/.test(n))return ['enemies',1,4];
      if(/蛇|蟒|蛟|龙/.test(n))return ['enemies',2,4];
      if(/蛛|蝎|虫/.test(n))return ['enemies',3,4];
      if(/山贼|邪修|盗|刺客/.test(n))return ['enemies',4,4];
      if(/鬼|魂|幽灵/.test(n))return ['enemies',7,4];
      if(/魔/.test(n))return ['enemies',5,4];
      if(/仙|天兵|护卫/.test(n))return ['enemies',6,4];
      return ['enemies',monster.regionId==='demon_domain'?5:monster.regionId==='immortal_domain'?6:4,4];
    }
    function drawInkEnemyV2833(ctx,monster){
      loadScrollArtV2831();const [key,cell,cols]=mapEnemyArtV2833(monster),im=SCROLL_ART_V2831[key];if(!im)return false;
      const cw=im.width/cols,ch=im.height/2,h=monster.enemy?._isElite?86:76,w=h*cw/ch;
      ctx.drawImage(im,cell%cols*cw,Math.floor(cell/cols)*ch,cw,ch,-w/2,24-h,w,h);return true;
    }
    function drawWorldMonster(ctx, monster) {
      if (!monster?.alive || monster.inCombat) return;
      ctx.save();
      ctx.translate(monster.x, monster.y);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(0, 18, 19, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = '32px "Segoe UI Emoji"';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if(!drawInkEnemyV2833(ctx,monster))ctx.fillText(getWorldMonsterIcon(monster.enemy?.name), 0, 0);
      if(monster.enemy?._isElite){ctx.font='13px Microsoft YaHei';ctx.fillStyle='#ffd86b';ctx.fillText('★',26,-52);}
      const maxHp = Math.max(1, monster.enemy?.maxHp || monster.enemy?.hp || 1);
      const hpPct = Math.max(0, Math.min(1, (monster.enemy?.hp || 0) / maxHp));
      ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(-22, -62, 44, 5);
      ctx.fillStyle = hpPct > .5 ? '#4caf50' : (hpPct > .25 ? '#ffb74d' : '#f44336');
      ctx.fillRect(-22, -62, 44 * hpPct, 5);
      const close=Math.hypot(monster.x-FLAT_WORLD.player.x,monster.y-FLAT_WORLD.player.y)<150;
      if(close){
        const risk=enemyRiskV286817(monster.enemy);
        const title=String(monster.enemy?.name||'敌人').slice(0,12)+' · '+risk.label+(weaknessV286821(monster.enemy)?' · '+SKILL_ELEMENT_META_V212[weaknessV286821(monster.enemy)].short+'弱点':'')+(monster.battleCooldown>0?' · 警戒':'');
        ctx.font='700 11px Microsoft YaHei';const tw=ctx.measureText(title).width;
        ctx.fillStyle='rgba(247,235,207,.96)';ctx.fillRect(-tw/2-6,27,tw+12,19);
        ctx.fillStyle=risk.color;ctx.fillText(title,0,37);
      }else if(monster.battleCooldown>0){ctx.font='700 10px Microsoft YaHei';ctx.fillStyle='#702f29';ctx.fillText('警戒',0,32);}

      ctx.restore();
    }

    function seededWorldDecor() {
      if (FLAT_WORLD.decor.length) return;
      let seed = 82631+String(currentRegion||'south').split('').reduce((n,c)=>n+c.charCodeAt(0)*71,0);
      const roadSegments=worldRoadSegmentsV2827();
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const decorTarget=PERF_CONFIG.mobile?38:(PERF_CONFIG.lowEnd?48:64);
      for (let i=0;i<decorTarget;i++) {
        const x=60+rnd()*(FLAT_WORLD.width-120), y=60+rnd()*(FLAT_WORLD.height-120);
        if (FLAT_WORLD.pois.some(p=>Math.hypot(x-p.x,y-p.y)<p.r+(p.action==='lingxiao_building'?25:90))) continue;
        if(roadSegments.some(([a,b])=>worldDistanceSegmentV2827(x,y,a,b)<40))continue;
        const roll=rnd();
        FLAT_WORLD.decor.push({x,y,t:roll<.68?'tree':(roll<.75?'stone':'grass'),s:.7+rnd()*.65,v:Math.floor(rnd()*3),rot:(rnd()-.5)*0.6,hue:rnd(),lean:(rnd()-.5)*0.16});
      }
      releaseStaticWorldCacheV2767();
      rebuildWorldColliders();
    }

    function getPoiCollisionRadius(poi) {
      const kind=getPoiVisualKind(poi);
      const byKind={
        village:46, shop:36, market:42, home:30, sect:46, alchemy:34, artifacts:24, lingxiao_building:22,
        rest:20, travel_gate:24, forest:28, mountain:44, battlefield:30,
        romance:20, secret:22, factions:26
      };
      if(kind==='npc') return 0;
      return Math.max(18, Math.min(byKind[kind] || Math.round((poi.r||40)*0.42), (poi.r||40)-10));
    }

    function rebuildWorldColliders() {
      if(!FLAT_WORLD) return [];
      const colliders=[];
      for(const poi of (FLAT_WORLD.pois||[])) {
        const radius=getPoiCollisionRadius(poi);
        if(radius>0) colliders.push({type:'poi', id:poi.id, x:poi.x, y:poi.y, radius});
      }
      for(const d of (FLAT_WORLD.decor||[])) {
        let radius=0;
        if(d.t==='tree') radius=14*(d.s||1)+8;
        else if(d.t==='stone') radius=11*(d.s||1)+5;
        if(radius>0) colliders.push({type:d.t, x:d.x, y:d.y, radius});
      }
      FLAT_WORLD.colliders=colliders;
      return colliders;
    }

    function resolveWorldCollisionForActor(fromX, fromY, toX, toY, actorRadius=16, filterFn=null) {
      const result={x:toX,y:toY};
      const colliders=FLAT_WORLD?.colliders||[];
      if(!colliders.length) return result;
      for(let pass=0; pass<2; pass++){
        for(const c of colliders){
          if(filterFn && !filterFn(c)) continue;
          const limit=(c.radius||0)+actorRadius;
          if(limit<=0) continue;
          let dx=result.x-c.x, dy=result.y-c.y;
          let dist=Math.hypot(dx,dy);
          if(dist<limit){
            if(dist<0.0001){
              dx=result.x-fromX; dy=result.y-fromY; dist=Math.hypot(dx,dy);
              if(dist<0.0001){ dx=1; dy=0; dist=1; }
            }
            const push=(limit-dist)+0.35;
            result.x += dx/dist*push;
            result.y += dy/dist*push;
          }
        }
      }
      result.x=Math.max(30,Math.min(FLAT_WORLD.width-30,result.x));
      result.y=Math.max(30,Math.min(FLAT_WORLD.height-30,result.y));
      return result;
    }

    function enableWorldMode() {
      const gs=document.getElementById('gameScreen');
      if (!gs || gs.classList.contains('hidden')) return;
      document.body.classList.add('flat-world-active');
      gs.classList.add('world-mode');
      const wp=document.getElementById('worldPanel'); if (wp) wp.style.display='block';
      ensureWorldMapInitialized();
      seededWorldDecor();
      initFlatWorld();
      // 2.5D角色统一绘入地图，无需额外WebGL画布。
      updateWorldHUD();
      ensureTaskUI?.();
    }

    function initFlatWorld() {
      if (FLAT_WORLD.initialized) { resizeWorldCanvas();if(!FLAT_WORLD.raf){FLAT_WORLD.lastTime=performance.now();FLAT_WORLD.raf=requestAnimationFrame(flatWorldLoop);}return; }
      FLAT_WORLD.initialized=true;
      const canvas=document.getElementById('worldCanvas');
      if (!canvas) return;
      resizeWorldCanvas();
      window.addEventListener('resize', resizeWorldCanvas);
      window.addEventListener('keydown', e=>{
        if (!document.body.classList.contains('flat-world-active')) return;
        const tag=document.activeElement?.tagName;
        if (tag==='INPUT' || tag==='TEXTAREA') return;
        const k=e.key.toLowerCase();
        if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) { FLAT_WORLD.keys[k]=true; FLAT_WORLD.target=null; e.preventDefault(); }
        if ((k==='e' || k===' ') && !isWorldOverlayOpen()) { interactFlatWorld(); e.preventDefault(); }
        if (k==='escape' && isWorldOverlayOpen()) closeWorldOverlay();
      });
      window.addEventListener('keyup', e=>{ FLAT_WORLD.keys[e.key.toLowerCase()]=false; });
      const setWorldTapTarget = (clientX, clientY) => {
        if (isWorldOverlayOpen()) return false;
        const rect=canvas.getBoundingClientRect();
        if(clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom) return false;
        const sx=(clientX-rect.left)*(canvas.width/rect.width), sy=(clientY-rect.top)*(canvas.height/rect.height);
        const worldX=sx+FLAT_WORLD.camera.x, worldY=sy+FLAT_WORLD.camera.y;
        FLAT_WORLD.target={x:worldX, y:worldY};
        FLAT_WORLD.tapTargetFx={x:worldX,y:worldY,startedAt:performance.now()};
        FLAT_WORLD.keys={};
        if (typeof tutorialState!=='undefined' && tutorialState.currentStepId==='movement') {
          goTutorialNext('movement','interaction');
          showTutorialToast('✅ 已掌握点击移动',1800);
        }
        return true;
      };
      canvas.addEventListener('pointerdown', e=>{
        if (e.pointerType && e.pointerType !== 'mouse') return;
        setWorldTapTarget(e.clientX, e.clientY);
      });
      let worldTouchTap=null;
      canvas.addEventListener('touchstart', e=>{
        if (isWorldOverlayOpen() || e.touches.length!==1) return;
        const t=e.touches[0];
        worldTouchTap={x:t.clientX,y:t.clientY,moved:false};
      }, {passive:false});
      canvas.addEventListener('touchmove', e=>{
        if (worldTouchTap && e.touches[0]) {
          const t=e.touches[0];
          if (Math.hypot(t.clientX-worldTouchTap.x,t.clientY-worldTouchTap.y)>14) worldTouchTap.moved=true;
        }
        e.preventDefault();
      }, {passive:false});
      canvas.addEventListener('touchend', e=>{
        if (!worldTouchTap) return;
        const touch=e.changedTouches?.[0];
        const moved=worldTouchTap.moved;
        worldTouchTap=null;
        if (!moved && touch) setWorldTapTarget(touch.clientX,touch.clientY);
        e.preventDefault();
      }, {passive:false});
      document.querySelectorAll('.touch-pad button').forEach(btn=>{
        const d=btn.dataset.dir;
        const key={up:'w',down:'s',left:'a',right:'d'}[d];
        const on=e=>{e.preventDefault();FLAT_WORLD.keys[key]=true;FLAT_WORLD.target=null};
        const off=e=>{e.preventDefault();FLAT_WORLD.keys[key]=false};
        btn.addEventListener('pointerdown',on); btn.addEventListener('pointerup',off); btn.addEventListener('pointercancel',off); btn.addEventListener('pointerleave',off);
      });
      document.getElementById('touchAction')?.addEventListener('click',interactFlatWorld);
      document.getElementById('minimapCanvas')?.addEventListener('pointerdown', onMinimapPointer);
      ensureRegionStyles();
      processCharacterTime(0);
      spawnMonsters();
      FLAT_WORLD._regionSpawnPending=0; FLAT_WORLD._regionSpawnTimer=0;
      FLAT_WORLD.lastTime=performance.now();
      FLAT_WORLD.raf=requestAnimationFrame(flatWorldLoop);
    }

    const MINIMAP_VIEW_STATE={zoom:1,minZoom:1,maxZoom:3,step:.5};

    function getMinimapWorldViewport(){
      const zoom=Math.max(MINIMAP_VIEW_STATE.minZoom,Math.min(MINIMAP_VIEW_STATE.maxZoom,MINIMAP_VIEW_STATE.zoom||1));
      const viewW=FLAT_WORLD.width/zoom, viewH=FLAT_WORLD.height/zoom;
      const p=FLAT_WORLD.player;
      const left=Math.max(0,Math.min(FLAT_WORLD.width-viewW,p.x-viewW/2));
      const top=Math.max(0,Math.min(FLAT_WORLD.height-viewH,p.y-viewH/2));
      return {zoom,left,top,width:viewW,height:viewH};
    }

    function changeMinimapZoom(delta){
      const next=Math.max(MINIMAP_VIEW_STATE.minZoom,Math.min(MINIMAP_VIEW_STATE.maxZoom,(MINIMAP_VIEW_STATE.zoom||1)+Number(delta||0)));
      MINIMAP_VIEW_STATE.zoom=Math.round(next*2)/2;
      const label=document.getElementById('minimapZoomLabel');
      if(label) label.textContent=`${MINIMAP_VIEW_STATE.zoom.toFixed(1)}×`;
      const minus=document.getElementById('minimapZoomOut'), plus=document.getElementById('minimapZoomIn');
      if(minus) minus.disabled=MINIMAP_VIEW_STATE.zoom<=MINIMAP_VIEW_STATE.minZoom;
      if(plus) plus.disabled=MINIMAP_VIEW_STATE.zoom>=MINIMAP_VIEW_STATE.maxZoom;
      try{ drawWorldMinimap(window.innerWidth,window.innerHeight); }catch(_){ }
    }
    window.changeMinimapZoom=changeMinimapZoom;

    // Shared reset for keyboard, point navigation and control-mode transitions.
    function resetWorldMovementV28686(){
      stopNavigationV2830();
      FLAT_WORLD.keys={};FLAT_WORLD.target=null;FLAT_WORLD.tapTargetFx=null;
      FLAT_WORLD.moving=false;FLAT_WORLD.moveDirX=0;FLAT_WORLD.moveDirY=0;
      window.dispatchEvent(new CustomEvent('xiantu-movement-reset'));
    }
    window.addEventListener('blur',resetWorldMovementV28686);
    window.addEventListener('pagehide',resetWorldMovementV28686);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)resetWorldMovementV28686()});

    function onMinimapPointer(e) {
      if (isWorldOverlayOpen()){showFloatingText?.('请先关闭当前界面，再点击小地图寻路。','#ffd76a');return;}
      const canvas=document.getElementById('minimapCanvas'); if(!canvas)return;
      const rect=canvas.getBoundingClientRect();
      const localX=e.clientX-rect.left, localY=e.clientY-rect.top;
      // 圆形地图外的透明四角不响应寻路。
      const cx=rect.width/2,cy=rect.height/2,r=Math.min(rect.width,rect.height)/2;
      if(Math.hypot(localX-cx,localY-cy)>r) return;
      const px=Math.max(0,Math.min(1,localX/rect.width)), py=Math.max(0,Math.min(1,localY/rect.height));
      const view=getMinimapWorldViewport();
      startPointNavigationV28685({
        x:Math.max(30,Math.min(FLAT_WORLD.width-30,view.left+px*view.width)),
        y:Math.max(30,Math.min(FLAT_WORLD.height-30,view.top+py*view.height)),r:0
      });
    }

    function resizeWorldCanvas() {
      const c=document.getElementById('worldCanvas'); if(!c)return;
      const dpr=Math.min(PERF_CONFIG.lowEnd?1:1.5,window.devicePixelRatio||1);
      const root=document.documentElement;
      const ucActive=root.classList.contains('uc-landscape-active');
      const logicalW=ucActive?(parseFloat(root.style.getPropertyValue('--uc-lw'))||innerWidth):innerWidth;
      const logicalH=ucActive?(parseFloat(root.style.getPropertyValue('--uc-lh'))||innerHeight):innerHeight;
      const w=Math.max(640,Math.floor(logicalW*dpr)),h=Math.max(360,Math.floor(logicalH*dpr));
      if(c.width===w && c.height===h && c._dpr===dpr)return;
      c.width=w; c.height=h;
      c._dpr=dpr;
      resize3DAvatar();
    }

    function isWorldOverlayOpen() {
      if(['rainChapterV286822','expansionV286827','postCaseV286826','storyBossPrepV286826'].some(id=>document.getElementById(id)))return true;
      if(document.getElementById('jevWorldPanelV2846'))return true;
      if(document.getElementById('warPanelV2839'))return true;
      if(document.getElementById('sceneV2838')||document.getElementById('journeyPrepareV2838')||document.getElementById('scrollMapV2831'))return true;
      if(document.getElementById('taskPanel')) return true;
      if(document.getElementById('mobileInventoryOverlay')) return true;
      if(document.getElementById('longevityOverlay')) return true;
      if(document.getElementById('saveManagerV2768')) return true;
      return ['storyPanel','combatPanel','alchemyPanel','petPanel','artifactPanel','characterPanel'].some(id=>!document.getElementById(id)?.classList.contains('hidden'));
    }

    function closeWorldOverlay() {
      if(typeof closeExpansionV286827==='function')closeExpansionV286827();
      document.getElementById('postCaseV286826')?.remove();document.getElementById('storyBossPrepV286826')?.remove();
      if(typeof rainCloseV286822==='function')rainCloseV286822();
      window.jevStoryChangedV2846?.();
      ['storyPanel','combatPanel','alchemyPanel','petPanel','artifactPanel','characterPanel'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));
      if(typeof FLAT_WORLD!=='undefined')FLAT_WORLD._panelOpen=false;
      gameState='exploring';
      resumeVisualsV2767();
      updateWorldHUD();
    }

    let mapIdleTimerV2865=null;
    function flatWorldLoop(t) {
      FLAT_WORLD.raf=null;
      if(document.hidden)return;
      if(isWorldOverlayOpen() || !document.body.classList.contains('flat-world-active')) {
        clearTimeout(mapIdleTimerV2865);
        mapIdleTimerV2865=setTimeout(()=>{mapIdleTimerV2865=null;resumeVisualsV2767();},200);
        return;
      }
      // iPhone 地图固定最高30FPS；战斗动画仍独立运行，不受此限制。
      if (PERF_CONFIG.mobile && t-(FLAT_WORLD._lastMobileFrame||0)<32) {
        FLAT_WORLD.raf=requestAnimationFrame(flatWorldLoop);
        return;
      }
      if (PERF_CONFIG.mobile) FLAT_WORLD._lastMobileFrame=t;
      const elapsed=Math.max(0,Math.min(34,t-FLAT_WORLD.lastTime));
      const dt=elapsed/1000;
      FLAT_WORLD.lastTime=t;
      PERF_CONFIG.fpsFrames++;
      if(t-PERF_CONFIG.fpsStartedAt>=700){
        PERF_CONFIG.measuredFps=Math.round(PERF_CONFIG.fpsFrames*1000/(t-PERF_CONFIG.fpsStartedAt));
        PERF_CONFIG.fpsFrames=0;PERF_CONFIG.fpsStartedAt=t;
        if(PERF_CONFIG.ultraSmooth) setWorld3DBadge(`⚡ 流畅模式 · ${PERF_CONFIG.measuredFps} FPS`,true);
      }
      if (document.body.classList.contains('flat-world-active') && !document.hidden) {
        // 战斗/剧情/角色面板打开时冻结地图在最后一帧，避免 iPhone 后台仍以 60FPS 重绘。
        const overlayOpen=isWorldOverlayOpen();
        if(!overlayOpen){
          updateFlatWorld(dt);
          drawFlatWorld(t,dt);
          if(AVATAR3D.ready && t-PERF_CONFIG.last3DDraw>=PERF_CONFIG.avatar3DInterval){
            PERF_CONFIG.last3DDraw=t;
            render3DAvatar(t);
          }
        }
      }
      FLAT_WORLD.raf=requestAnimationFrame(flatWorldLoop);
    }

    function checkResourceCollection(distanceMoved=0) {
      if(distanceMoved<=0 || !player?.materials)return;
      FLAT_WORLD.resourceTravelAccumulator=(FLAT_WORLD.resourceTravelAccumulator||0)+distanceMoved;
      if(FLAT_WORLD.resourceTravelAccumulator<150)return;
      FLAT_WORLD.resourceTravelAccumulator%=150;
      // 每行走约150世界单位进行一次发现判定，避免原补丁按帧随机导致站桩刷材料。
      if(Math.random()>.14)return;
      const region=getRegionInfo(currentRegion || getPlayerRegion());
      const pool=region.materials?.filter(m=>MATERIALS[m])||[]; if(!pool.length)return;
      const mat=pool[Math.floor(Math.random()*pool.length)];
      player.materials[mat]=(player.materials[mat]||0)+1;
      onCollectMaterial?.(mat,1);
      showFloatingText(`${MATERIALS[mat]?.icon||'🌿'} 发现 ${mat}`,region.color);
      // 不在行走采集瞬间序列化整个存档，避免移动时随机顿帧；交给定时自动保存。
    }

    function drawRegionBoundaries(ctx){
      const region=getRegionInfo(currentRegion||'south');
      ctx.save();
      ctx.globalAlpha=.22;
      ctx.globalAlpha=.32;
      ctx.font='800 30px Microsoft YaHei'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillStyle=region.color;
      ctx.fillText(`${region.icon} ${region.name}`,FLAT_WORLD.width/2,38);
      ctx.restore();
    }

    function updateFlatWorld(dt) {
      if(typeof syncWarMapV2840==='function')syncWarMapV2840();
      if(document.getElementById("scrollMapV2831"))return;
      tickNavigationV2830(dt);
      revealExplorationV2828();
      const oldPX=FLAT_WORLD.player.x, oldPY=FLAT_WORLD.player.y;
      let dx=0,dy=0,k=FLAT_WORLD.keys;
      if(k.w||k.arrowup)dy--; if(k.s||k.arrowdown)dy++; if(k.a||k.arrowleft)dx--; if(k.d||k.arrowright)dx++;
      if(dx||dy){ const l=Math.hypot(dx,dy)||1; dx/=l;dy/=l; FLAT_WORLD.target=null; }
      else if(FLAT_WORLD.target){ const tx=FLAT_WORLD.target.x-FLAT_WORLD.player.x, ty=FLAT_WORLD.target.y-FLAT_WORLD.player.y, l=Math.hypot(tx,ty); if(l<(autoNavigationV2830?1:8)){FLAT_WORLD.target=null;FLAT_WORLD.tapTargetFx=null;} else {const scale=autoNavigationV2830?Math.min(1,l/Math.max(.001,FLAT_WORLD.player.speed*dt)):1;dx=tx/l*scale;dy=ty/l*scale;} }
      FLAT_WORLD.moving=!!(dx||dy); FLAT_WORLD.moveDirX=dx; FLAT_WORLD.moveDirY=dy;
      const desiredX=Math.max(30,Math.min(FLAT_WORLD.width-30,FLAT_WORLD.player.x+dx*FLAT_WORLD.player.speed*dt));
      const desiredY=Math.max(30,Math.min(FLAT_WORLD.height-30,FLAT_WORLD.player.y+dy*FLAT_WORLD.player.speed*dt));
      const resolvedPlayerPos=resolveWorldCollisionForActor(oldPX, oldPY, desiredX, desiredY, FLAT_WORLD.player.r || 17);
      FLAT_WORLD.player.x=resolvedPlayerPos.x;
      FLAT_WORLD.player.y=resolvedPlayerPos.y;
      if (FLAT_WORLD.target && Math.hypot(FLAT_WORLD.target.x-FLAT_WORLD.player.x,FLAT_WORLD.target.y-FLAT_WORLD.player.y) < (autoNavigationV2830?1:Math.max(10,(FLAT_WORLD.player.r||17)+4))) {
        FLAT_WORLD.target=null;
        FLAT_WORLD.tapTargetFx=null;
      }

      // 独立地图内行走采集；地域切换只通过选项完成。
      checkResourceCollection(Math.hypot(FLAT_WORLD.player.x-oldPX,FLAT_WORLD.player.y-oldPY));

      // 地图怪物随机游走、碰撞触发战斗与自动补充
      updateWorldMonsters(dt);

      let near=null, nd=1e9;
      for(const p of FLAT_WORLD.pois){ const d=Math.hypot(FLAT_WORLD.player.x-p.x,FLAT_WORLD.player.y-p.y); if(d<p.r+62 && d<nd){near=p;nd=d;} }
      FLAT_WORLD.nearby=near;
      const nearId=near?.id||'';
      if(nearId!==FLAT_WORLD._lastNearbyId){
        FLAT_WORLD._lastNearbyId=nearId;
        const hint=document.getElementById('worldInteract'),txt=document.getElementById('worldInteractText');
        if(near){if(txt){const verb=near.id==='travel_gate'?'选择':(String(near.action||'').startsWith('npc_')?'交谈':'进入');txt.innerHTML=`${verb} <b>${near.name}</b> · ${near.desc}`;}hint?.classList.add('show')}else hint?.classList.remove('show');
      }
    }

    function interactFlatWorld() {
      if(!canMapNpcActV2864())return;
      const p=FLAT_WORLD.nearby; if(!p||!FLAT_WORLD.pois.includes(p)||Math.hypot(FLAT_WORLD.player.x-p.x,FLAT_WORLD.player.y-p.y)>p.r+62)return;
      playSound?.('click');
      if(p.action==='war_map_v2840'){openWarOrdersV2840();return;}
      if(p.action==='world_travel_menu') showWorldTravelMenu();
      else if(p.action==='yewuji_v2810')showYeWujiV2810();
      else if(p.action==='faction_gate_v2806')showFactionGateV2806(p.factionName);
      else if(p.action==='faction_guide_v2806')showFactionMapGuideV2806();
      else if(p.action==='lingxiao_building') enterLingxiaoBuilding(p.buildingId);
      else if(p.action==='explore_v2828')showExplorationV2828(p.id);
      else if(p.action==='rest') showLocation('rest');
      else showLocation(p.action);
      updateWorldHUD();
    }

    function releaseStaticWorldCacheV2767() {
      clearBuildingArtV2813();
      const old=PERF_CONFIG.staticWorldCanvas;
      PERF_CONFIG.staticWorldCanvas=null; PERF_CONFIG.staticWorldReady=false;
      if(old){old.width=1;old.height=1;}
    }

    function ensureStaticWorldCache() {
      if (PERF_CONFIG.staticWorldReady && PERF_CONFIG.staticWorldCanvas) return PERF_CONFIG.staticWorldCanvas;
      const cache=document.createElement('canvas');
      cache.width=FLAT_WORLD.width; cache.height=FLAT_WORLD.height;
      const sctx=cache.getContext('2d',{alpha:false});
      drawWorldGround(sctx);
      drawRegionBoundaries(sctx);
      // 装饰物是静态的，预先绘制一次，避免每帧重画130棵树/石头/草。
      for(const d of FLAT_WORLD.decor) if(d.t!=='tree')drawWorldDecor(sctx,d);
      drawLingxiaoBuildingPaths(sctx);
      PERF_CONFIG.staticWorldCanvas=cache;
      PERF_CONFIG.staticWorldReady=true;
      return cache;
    }

    function drawFlatWorld(t=performance.now(),dt=1/60) {
      const c=document.getElementById('worldCanvas'); if(!c)return; const ctx=c.getContext('2d');
      const dpr=c._dpr||1, vw=c.width/dpr, vh=c.height/dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const cam=FLAT_WORLD.camera, p=FLAT_WORLD.player;
      const targetCamX=Math.max(0,Math.min(Math.max(0,FLAT_WORLD.width-vw),p.x-vw/2));
      const targetCamY=Math.max(0,Math.min(Math.max(0,FLAT_WORLD.height-vh),typeof warCameraYV2840==='function'?warCameraYV2840(p,vh):p.y-vh/2));
      // 相机采用指数跟随，消除偶发长帧带来的“一格一格”跳动。
      const follow=1-Math.exp(-Math.max(.001,dt)*24);
      cam.x+=(targetCamX-cam.x)*follow;
      cam.y+=(targetCamY-cam.y)*follow;
      if(Math.abs(targetCamX-cam.x)<.02)cam.x=targetCamX;
      if(Math.abs(targetCamY-cam.y)<.02)cam.y=targetCamY;
      ctx.clearRect(0,0,vw,vh);

      // 静态背景只生成一次，并按当前视口裁切复制。
      const staticMap=ensureStaticWorldCache();
      ctx.drawImage(staticMap,cam.x,cam.y,vw,vh,0,0,vw,vh);
      drawExplorationFogV2828(ctx,cam,vw,vh);

      ctx.save(); ctx.translate(-cam.x,-cam.y);
      const items=FLAT_WORLD._drawItems; items.length=0;
      const minX=cam.x-130,maxX=cam.x+vw+130,minY=cam.y-130,maxY=cam.y+vh+130;
      const visible=o=>o.x>=minX&&o.x<=maxX&&o.y>=minY&&o.y<=maxY;
      for(const poi of FLAT_WORLD.pois)if(visible(poi)&&(poi.action!=='explore_v2828'||exploredPointV2828(poi.x,poi.y)))items.push(poi);
      for(const mon of FLAT_WORLD.monsters)if(mon.alive&&!mon.inCombat&&visible(mon)&&exploredPointV2828(mon.x,mon.y))items.push(mon);
      for(const tree of FLAT_WORLD.decor)if(tree.t==='tree'&&visible(tree)&&exploredPointV2828(tree.x,tree.y))items.push(tree);
      const warViewV2840={minX,maxX,minY,maxY};
      if(typeof appendWarUnitsV2840==='function')appendWarUnitsV2840(items,dt,warViewV2840);
      items.sort((a,b)=>worldDepthV2770(a)-worldDepthV2770(b));
      drawWorldAmbient(ctx, t, minX, maxX, minY, maxY);
      if(typeof drawWarGroundV2840==='function')drawWarGroundV2840(ctx,warViewV2840);
      FLAT_WORLD.deferLabelsV2836=true;
      let playerDrawn=false;
      for(const it of items){
        if(!playerDrawn && worldDepthV2770(it)>p.y+17){drawWorldPlayer(ctx,p);playerDrawn=true;}
        if(it.x<minX||it.x>maxX||it.y<minY||it.y>maxY) continue;
        if(it._warUnitV2840)drawWarUnitV2840(ctx,it);else if(it.action==='war_map_v2840')drawWarPostV2840(ctx,it);else if(it.t==='tree')drawDepthTreeV2770(ctx,it);else if(it.enemy)drawWorldMonster(ctx,it);else{
          const fade=worldDepthV2770(it)>p.y+17&&Math.abs(it.x-p.x)<82&&it.y-p.y<165;
          ctx.save();if(fade)ctx.globalAlpha=.38;drawWorldPoi(ctx,it);ctx.restore();
        }
      }
      if(!playerDrawn)drawWorldPlayer(ctx,p);
      FLAT_WORLD.deferLabelsV2836=false;
      if(typeof drawWorldLabelsV2836==='function')drawWorldLabelsV2836(ctx,items.filter(o=>!o._warUnitV2840&&o.action!=='war_map_v2840'));
      if(typeof drawWarEffectsV2840==='function')drawWarEffectsV2840(ctx,warViewV2840);


      // 点地移动视觉反馈：落点脉冲 + 引导虚线。只针对玩家轻点地面产生的目标。
      if(FLAT_WORLD.tapTargetFx){
        const fx=FLAT_WORLD.tapTargetFx;
        const active=!!FLAT_WORLD.target && Math.hypot((FLAT_WORLD.target.x||0)-fx.x,(FLAT_WORLD.target.y||0)-fx.y)<4;
        if(active){
          const age=Math.max(0,t-(fx.startedAt||t));
          const pulse=(Math.sin(age*.012)+1)*.5;
          const dist=Math.hypot(fx.x-p.x,fx.y-p.y);
          ctx.save();
          // 外圈脉冲
          ctx.strokeStyle=`rgba(255,221,126,${0.58-0.18*pulse})`;
          ctx.lineWidth=2.4;
          ctx.beginPath();ctx.arc(fx.x,fx.y,18+pulse*8,0,Math.PI*2);ctx.stroke();
          // 内圈
          ctx.strokeStyle='rgba(255,239,183,.92)';ctx.lineWidth=1.5;
          ctx.beginPath();ctx.arc(fx.x,fx.y,8,0,Math.PI*2);ctx.stroke();
          // 四向短刻度，让落点更像手游指令标记
          ctx.strokeStyle='rgba(255,220,112,.82)';ctx.lineWidth=2;
          for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(fx.x+Math.cos(a)*12,fx.y+Math.sin(a)*12);ctx.lineTo(fx.x+Math.cos(a)*(16+pulse*3),fx.y+Math.sin(a)*(16+pulse*3));ctx.stroke();}
          ctx.restore();
        }else{
          FLAT_WORLD.tapTargetFx=null;
        }
      }
      ctx.restore();

      const near=FLAT_WORLD.nearby;
      const region=getRegionInfo(currentRegion || getPlayerRegion());
      const areaKey=near?`p:${near.id}`:`r:${region.id}`;
      if(areaKey!==FLAT_WORLD._lastAreaKey){
        FLAT_WORLD._lastAreaKey=areaKey;
        const area=document.getElementById('worldAreaName'), desc=document.getElementById('worldAreaDesc');
        if(near){if(area)area.textContent=`${near.icon} ${near.name}`;if(desc)desc.textContent=near.desc;}
        else {if(area)area.textContent=`${region.icon} ${region.name}`;if(desc)desc.textContent=region.desc;}
      }

      if(t-PERF_CONFIG.lastMinimapDraw>=PERF_CONFIG.minimapInterval){
        PERF_CONFIG.lastMinimapDraw=t;
        drawWorldMinimap(vw,vh);
      }
    }

    function drawWorldMinimap(viewW, viewH) {
      ensureExplorationButtonV2829();
      const canvas=document.getElementById('minimapCanvas'); if(!canvas)return;
      const ctx=canvas.getContext('2d'), w=canvas.width, h=canvas.height;
      const view=getMinimapWorldViewport();
      const sx=w/view.width, sy=h/view.height;
      const cfg=getWorldMapConfig(), region=getRegionInfo(currentRegion||'south');
      const mx=x=>(x-view.left)*sx, my=y=>(y-view.top)*sy;
      const visible=(x,y,pad=20)=>x>=view.left-pad/sx&&x<=view.left+view.width+pad/sx&&y>=view.top-pad/sy&&y<=view.top+view.height+pad/sy;

      ctx.clearRect(0,0,w,h);
      ctx.save();
      ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)/2-3,0,Math.PI*2);ctx.clip();
      ctx.fillStyle=cfg.bg;ctx.fillRect(0,0,w,h);
      drawRegionScrollV2834(ctx,mx(0),my(0),FLAT_WORLD.width*sx,FLAT_WORLD.height*sy);

      for(const poi of FLAT_WORLD.pois){
        if(!visible(poi.x,poi.y,10)||(poi.action==='explore_v2828'&&!exploredPointV2828(poi.x,poi.y))) continue;
        const x=mx(poi.x),y=my(poi.y);
        if(markedExplorationV2829()?.id===poi.id){ctx.strokeStyle='#ffe27e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.stroke();}
        if(FLAT_WORLD.nearby?.id===poi.id){ctx.fillStyle='rgba(241,209,134,.16)';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill()}
        ctx.fillStyle='#2a241b';ctx.beginPath();ctx.arc(x,y,3.8,0,Math.PI*2);ctx.fill();
        const poiColor=poi.id==='travel_gate'?'#7ec9ff':(String(poi.action||'').startsWith('npc_')?'#ffb6d9':(poi.action==='lingxiao_building'?(getBuildingTierColor(getBuildingData(poi.buildingId))||'#c7e4ff'):'#f1d186'));
        ctx.fillStyle=poiColor;ctx.beginPath();ctx.arc(x,y,poi.action==='lingxiao_building'?2.45:(String(poi.action||'').startsWith('npc_')?2.8:2.2),0,Math.PI*2);ctx.fill();
      }
      for(const monster of FLAT_WORLD.monsters){
        if(!monster.alive||monster.inCombat||!visible(monster.x,monster.y,6)||!exploredPointV2828(monster.x,monster.y))continue;
        ctx.fillStyle=monster.battleCooldown>0?'rgba(255,155,90,.78)':'rgba(255,78,78,.92)';ctx.beginPath();ctx.arc(mx(monster.x),my(monster.y),2.6,0,Math.PI*2);ctx.fill();
      }
      if(FLAT_WORLD.target&&visible(FLAT_WORLD.target.x,FLAT_WORLD.target.y,8)){
        ctx.strokeStyle='rgba(191,239,255,.95)';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(mx(FLAT_WORLD.target.x),my(FLAT_WORLD.target.y),5.8,0,Math.PI*2);ctx.stroke();
      }
      if(typeof drawWarMinimapV2840==='function')drawWarMinimapV2840(ctx,mx,my);
      const camX=mx(FLAT_WORLD.camera.x),camY=my(FLAT_WORLD.camera.y);
      ctx.strokeStyle='rgba(255,255,255,.62)';ctx.lineWidth=1.1;
      ctx.strokeRect(camX,camY,Math.max(14,viewW*sx),Math.max(14,viewH*sy));
      const pulse=5+Math.sin(performance.now()*.008)*.9;
      ctx.fillStyle='#7ec9ff';ctx.beginPath();ctx.arc(mx(FLAT_WORLD.player.x),my(FLAT_WORLD.player.y),pulse,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mx(FLAT_WORLD.player.x),my(FLAT_WORLD.player.y),2.2,0,Math.PI*2);ctx.fill();
      ctx.restore();

      // 圆形外框
      ctx.save();ctx.strokeStyle='rgba(233,216,170,.55)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)/2-3,0,Math.PI*2);ctx.stroke();ctx.restore();
      const info=document.getElementById('minimapCoords');if(info)info.textContent=`${region.shortName} · ${view.zoom.toFixed(1)}×`;
      const label=document.getElementById('minimapZoomLabel');if(label)label.textContent=`${view.zoom.toFixed(1)}×`;
    }

    let exploreCellV2828='',exploreOwnerV2828=null,exploreDirtyV2828=false,exploreSaveAtV2828=0;
    function explorationV2828(region=currentRegion||'south'){
      const state=player.explorationV2828 ||= {maps:{}};state.maps ||= {};
      return state.maps[region] ||= {seen:{},claimed:{}};
    }
    function revealExplorationV2828(){
      if(exploreOwnerV2828!==player){exploreOwnerV2828=player;exploreCellV2828='';exploreDirtyV2828=false;}
      const p=FLAT_WORLD.player,region=currentRegion||'south',cx=Math.floor(p.x/96),cy=Math.floor(p.y/96),key=region+':'+cx+','+cy;
      if(key!==exploreCellV2828){exploreCellV2828=key;const map=explorationV2828();
        if(typeof discoverRoamingV286818==='function')discoverRoamingV286818(cx+','+cy);
        for(let y=cy-3;y<=cy+3;y++)for(let x=cx-3;x<=cx+3;x++)if(x>=0&&y>=0&&x*96<FLAT_WORLD.width&&y*96<FLAT_WORLD.height&&Math.hypot((x+.5)*96-p.x,(y+.5)*96-p.y)<285){const cell=x+','+y;if(!map.seen[cell]){map.seen[cell]=1;exploreDirtyV2828=true;}}
      }
      if(exploreDirtyV2828&&Date.now()-exploreSaveAtV2828>5000){exploreSaveAtV2828=Date.now();exploreDirtyV2828=false;autoSave();}
    }
    function exploredPointV2828(x,y){return !!explorationV2828().seen[Math.floor(x/96)+','+Math.floor(y/96)];}
    function drawExplorationFogV2828(ctx,cam,vw,vh){
      const map=explorationV2828();ctx.save();ctx.fillStyle='rgba(239,227,194,.70)';
      for(let y=Math.max(0,Math.floor(cam.y/96));y<Math.min(Math.ceil(FLAT_WORLD.height/96),Math.ceil((cam.y+vh)/96));y++)for(let x=Math.max(0,Math.floor(cam.x/96));x<Math.min(Math.ceil(FLAT_WORLD.width/96),Math.ceil((cam.x+vw)/96));x++)if(!map.seen[x+','+y])ctx.fillRect(x*96-cam.x,y*96-cam.y,96,96);
      ctx.restore();
    }
    function buildExplorationPoisV2828(region,pois){
      const cfg=getWorldMapConfig(region),rows=[],types=[['野生灵草','🌿'],['遗落行囊','🎒'],['残旧道碑','🪨']];let seed=region.split('').reduce((n,ch)=>n+ch.charCodeAt(0),817);
      const rnd=()=>((seed=seed*16807%2147483647)/2147483647);
      for(let attempt=0;attempt<150&&rows.length<6;attempt++){
        const x=100+rnd()*(cfg.width-200),y=100+rnd()*(cfg.height-200);
        if([...pois,...rows].some(p=>Math.hypot(p.x-x,p.y-y)<(p.r||30)+100))continue;
        const n=rows.length,type=n%3;rows.push({id:'explore_v2828_'+n,name:types[type][0],icon:types[type][1],x,y,r:24,action:'explore_v2828',region,exploreTypeV2828:type,desc:'靠近后探索，资源仅可领取一次'});
      }return rows;
    }
    function explorationRewardV2828(p,choice){
      const level=Number(WORLD_MAP_CONFIGS[p.region]?.unlockRealm||REGION_UNLOCK_LEVEL[p.region])||0;
      return p.exploreTypeV2828===0?{material:'灵草',count:3}:p.exploreTypeV2828===1?{gold:200+level*60}:choice==='study'?{exp:120+level*40}:{gold:120+level*40};
    }
    function showExplorationV2828(id){
      if(!forgeAllowedV2825())return;const p=FLAT_WORLD.pois.find(p=>p.id===id&&p.action==='explore_v2828');if(!p||Math.hypot(p.x-FLAT_WORLD.player.x,p.y-FLAT_WORLD.player.y)>p.r+70)return;
      const done=explorationV2828().claimed[id],esc=discipleEscV2815;
      const text=r=>r.material?`${r.material} ×${r.count}`:r.gold?`${r.gold} 灵石`:`${r.exp} 修为`;
      let html=`<section class="main-overview-v2822"><h3>${p.icon} ${esc(p.name)}</h3><p>${['沿着叶脉的微光，你找到一丛成熟灵草。采下后，这处灵根需要漫长岁月休养。','旧行囊半埋在荒草中，里面留有无主灵石。','风霜磨损了碑文，尚能辨认出一段修行心得。你可以原地参悟，或整理拓本换取灵石。'][p.exploreTypeV2828]}</p><p>本地图探索点仅领取一次，切图和重载不会刷新。不会自动推进游戏日期。</p>`;
      if(done)html+='<p>✓ 此处已探索，奖励已领取。</p>';
      else for(const choice of p.exploreTypeV2828===2?['study','copy']:['take'])html+=`<button class="choice-btn" onclick="claimExplorationV2828('${id}','${choice}')">${choice==='study'?'参悟碑文':choice==='copy'?'整理拓本':'领取资源'} · ${text(explorationRewardV2828(p,choice))}</button>`;
      html+='</section>';showStory(html,[{text:'返回地图',action:'return_to_map'}]);
    }
    function claimExplorationV2828(id,choice){
      if(!forgeAllowedV2825())return;const p=FLAT_WORLD.pois.find(p=>p.id===id&&p.action==='explore_v2828');if(!p||p.region!==(currentRegion||'south')||Math.hypot(p.x-FLAT_WORLD.player.x,p.y-FLAT_WORLD.player.y)>p.r+70)return;
      if(!(p.exploreTypeV2828===2?['study','copy']:['take']).includes(choice))return;
      const map=explorationV2828();if(map.claimed[id])return;const reward=explorationRewardV2828(p,choice);map.claimed[id]=choice;
      if(reward.gold)player.gold+=reward.gold;if(reward.exp)player.exp+=reward.exp;
      if(reward.material){player.materials ||= {};player.materials[reward.material]=(player.materials[reward.material]||0)+reward.count;onCollectMaterial(reward.material,reward.count);}
      checkLevelUp();autoSave();updateStats();showExplorationV2828(id);
    }

    let autoNavigationV2830=null;
    function planNavigationV2830(goal){
      const p=FLAT_WORLD.player,step=40,cols=Math.ceil(FLAT_WORLD.width/step),rows=Math.ceil(FLAT_WORLD.height/step),radius=(p.r||17)+4;
      const clear=(a,b)=>(FLAT_WORLD.colliders||[]).every(c=>worldDistanceSegmentV2827(c.x,c.y,a,b)>=c.radius+radius);
      const point=id=>({x:(id%cols)*step+20,y:Math.floor(id/cols)*step+20});
      const open=new Uint8Array(cols*rows);for(let id=0;id<open.length;id++){const q=point(id);open[id]=q.x>=30&&q.y>=30&&q.x<=FLAT_WORLD.width-30&&q.y<=FLAT_WORLD.height-30&&clear(q,q)?1:0;}
      let start=-1,best=Infinity;for(let id=0;id<open.length;id++)if(open[id]){const q=point(id),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<best&&d<120&&clear(p,q)){start=id;best=d;}}if(start<0)return null;
      const queue=[start],prev=new Int32Array(open.length);prev.fill(-2);prev[start]=-1;let found=-1;
      for(let head=0;head<queue.length;head++){
        const id=queue[head],q=point(id);if(Math.hypot(q.x-goal.x,q.y-goal.y)<goal.r+(goal.id?43:28)){found=id;break;}
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
          const x=id%cols+dx,y=Math.floor(id/cols)+dy,n=y*cols+x;
          if(x<0||y<0||x>=cols||y>=rows||!open[n]||prev[n]!==-2||!clear(q,point(n)))continue;
          prev[n]=id;queue.push(n);
        }
      }
      if(found<0)return null;const path=[];for(let id=found;id!==-1;id=prev[id])path.push(point(id));path.reverse();
      // Smooth only across collision-free segments; never cut through a trunk or roof footprint.
      const smooth=[];let anchor=p,i=0;while(i<path.length){let far=i;for(let j=i+1;j<path.length;j++){if(clear(anchor,path[j]))far=j;else break;}smooth.push(path[far]);anchor=path[far];i=far+1;}return smooth;
    }
    function stopNavigationV2830(message=''){
      if(autoNavigationV2830&&FLAT_WORLD.target===autoNavigationV2830.target){FLAT_WORLD.target=null;FLAT_WORLD.tapTargetFx=null;}
      autoNavigationV2830=null;if(message)showFloatingText?.(message,'#ffd76a');
    }
    function startNavigationV2830(id){
      if(!forgeAllowedV2825())return;const goal=FLAT_WORLD.pois.find(p=>p.id===id);if(!goal)return showFloatingText?.('目标不在当前地图。','#ffd76a');
      if(goal.action==='explore_v2828'&&(!exploredPointV2828(goal.x,goal.y)||explorationV2828().claimed[id]))return showFloatingText?.('该探索点尚未发现或已经领取。','#ffd76a');
      return startPointNavigationV28685(goal);
    }
    function startPointNavigationV28685(goal){
      if(!forgeAllowedV2825()||!goal||!Number.isFinite(goal.x)||!Number.isFinite(goal.y))return;
      stopNavigationV2830();const p=FLAT_WORLD.player;
      if(Math.hypot(p.x-goal.x,p.y-goal.y)<goal.r+55){closeWorldOverlay();showFloatingText?.('已在目标附近，请点击交互。','#9edcff');return;}
      const route=planNavigationV2830(goal);if(!route?.length)return showFloatingText?.('暂未找到安全路线，请手动绕开障碍后重试。','#ffd76a');
      if(goal.id){explorationV2828();player.explorationV2828.marked={region:currentRegion,id:goal.id};autoSave();}closeWorldOverlay();
      autoNavigationV2830={owner:player,region:currentRegion,goal:goal.id||null,route,index:0,target:route[0],lastX:p.x,lastY:p.y,stuck:0};
      FLAT_WORLD.keys={};FLAT_WORLD.target=route[0];FLAT_WORLD.tapTargetFx={...route[0],startedAt:performance.now()};
      showFloatingText?.('🧭 自动寻路中，操作摇杆或点击地图可接管。','#9edcff');
    }
    function tickNavigationV2830(dt){
      const nav=autoNavigationV2830;if(!nav)return;const p=FLAT_WORLD.player;
      if(nav.owner!==player||nav.region!==currentRegion||!forgeAllowedV2825()||Object.values(FLAT_WORLD.keys||{}).some(Boolean))return stopNavigationV2830();
      const near=Math.hypot(p.x-nav.target.x,p.y-nav.target.y)<1;
      if(FLAT_WORLD.target!==nav.target&&!(FLAT_WORLD.target===null&&near))return stopNavigationV2830();
      const moved=Math.hypot(p.x-nav.lastX,p.y-nav.lastY);nav.stuck=moved<.1?nav.stuck+Math.min(dt,.1):0;nav.lastX=p.x;nav.lastY=p.y;
      if(nav.stuck>2)return stopNavigationV2830('路径受阻，已停止；可手动移动后重试。');
      if(near){nav.index++;if(nav.index>=nav.route.length)return stopNavigationV2830('已到目标附近，请点击交互。');nav.target=nav.route[nav.index];FLAT_WORLD.target=nav.target;FLAT_WORLD.tapTargetFx={...nav.target,startedAt:performance.now()};}
    }

    function explorationProgressV2829(){
      const map=explorationV2828(),cols=Math.ceil(FLAT_WORLD.width/96),rows=Math.ceil(FLAT_WORLD.height/96);
      const visited=Object.keys(map.seen).filter(key=>{const [x,y]=key.split(',').map(Number);return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<cols&&y<rows;}).length;
      const points=FLAT_WORLD.pois.filter(p=>p.action==='explore_v2828'),found=points.filter(p=>exploredPointV2828(p.x,p.y)),claimed=points.filter(p=>!!map.claimed[p.id]);
      return {percent:Math.min(100,Math.floor(visited/(cols*rows)*100)),points,found,claimed};
    }
    function markedExplorationV2829(){
      const mark=player.explorationV2828?.marked;if(!mark||mark.region!==(currentRegion||'south'))return null;
      const p=FLAT_WORLD.pois.find(p=>p.id===mark.id);if(!p)return null;
      if(p.action==='explore_v2828'&&(!exploredPointV2828(p.x,p.y)||explorationV2828().claimed[p.id]))return null;return p;
    }
    function explorationDirectionV2829(p){
      const dx=p.x-FLAT_WORLD.player.x,dy=p.y-FLAT_WORLD.player.y,distance=Math.round(Math.hypot(dx,dy));
      if(distance<p.r+62)return '已到附近 · 点交互';
      const dirs=['东','东南','南','西南','西','西北','北','东北'],index=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
      return `${dirs[index]} · ${distance}步距`;
    }
    function ensureExplorationButtonV2829(){
      const actions=document.getElementById('worldExploreActions');if(!actions)return;
      let b=document.getElementById('explorationButtonV2829');if(!b){b=document.createElement('button');b.id='explorationButtonV2829';b.onclick=showExplorationJournalV2829;actions.appendChild(b);}
      const p=markedExplorationV2829(),label=p?`🧭 探索手册 · ${explorationDirectionV2829(p)}`:'🧭 探索手册';if(b.textContent!==label)b.textContent=label;
      b.title=p?`${p.name} · ${explorationDirectionV2829(p)}`:'查看地图探索进度和补给点';
    }
    function markExplorationV2829(id){
      if(!forgeAllowedV2825())return;
      if(id===null){stopNavigationV2830();player.explorationV2828.marked=null;autoSave();ensureExplorationButtonV2829();showExplorationJournalV2829();return;}
      const p=FLAT_WORLD.pois.find(p=>p.id===id);if(!p)return;
      if(p.action==='explore_v2828'&&(!exploredPointV2828(p.x,p.y)||explorationV2828().claimed[p.id]))return;
      explorationV2828();player.explorationV2828.marked={region:currentRegion||'south',id};autoSave();ensureExplorationButtonV2829();showFloatingText?.(`🧭 已标记 ${p.name}，按顶部方向寻找`,'#ffd76a');showExplorationJournalV2829();
    }
    function showExplorationJournalV2829(){
      if(!forgeAllowedV2825())return;revealExplorationV2828();const progress=explorationProgressV2829(),map=explorationV2828(),esc=discipleEscV2815,marked=markedExplorationV2829();
      const distance=p=>Math.hypot(p.x-FLAT_WORLD.player.x,p.y-FLAT_WORLD.player.y);
      const pending=progress.found.filter(p=>!map.claimed[p.id]).sort((a,b)=>distance(a)-distance(b));
      const services=FLAT_WORLD.pois.filter(p=>p.action==='rest'||p.buildingId==='spirit_spring'||p.id==='travel_gate'||p.action==='shop').sort((a,b)=>distance(a)-distance(b));
      const row=p=>`<article class="task-card"><strong>${p.icon} ${esc(p.name)}</strong><p>${esc(explorationDirectionV2829(p))}</p><button class="choice-btn" onclick="markExplorationV2829('${p.id}')">${marked?.id===p.id?'已标记 · 更新指引':'标记方向'}</button><button class="choice-btn" onclick="startNavigationV2830('${p.id}')">自动前往</button>${p.action==='explore_v2828'&&distance(p)<p.r+62?`<button class="choice-btn" onclick="showExplorationV2828('${p.id}')">查看探索点</button>`:''}</article>`;
      showStory(`<section class="main-overview-v2822"><h3>🧭 ${esc(getRegionInfo(currentRegion||'south').name)} · 探索手册</h3><p>地面探索 ${progress.percent}% · 地点发现 ${progress.found.length}/${progress.points.length} · 已领取 ${progress.claimed.length}/${progress.points.length}</p><progress value="${progress.percent}" max="100" aria-label="地图探索进度"></progress><p>可选择方向标记或自动前往。自动寻路绕开静态障碍，到附近停下；摇杆、键盘或点地图可接管，遭遇战会停止。未发现探索点不显示坐标。</p>${marked?`<p>当前标记：${esc(marked.name)} · ${esc(explorationDirectionV2829(marked))}</p><button class="choice-btn" onclick="markExplorationV2829(null)">清除标记</button>`:''}${autoNavigationV2830?`<button class="choice-btn" onclick="stopNavigationV2830();showExplorationJournalV2829()">停止自动寻路</button>`:""}${typeof roamingNoticeV286818==='function'?roamingNoticeV286818():''}<h4>已发现 · 待领取</h4>${pending.length?pending.map(row).join(''):'<p>暂无待领取地点，继续探索周围区域吧。</p>'}<details><summary>补给与返回入口</summary>${services.map(row).join('')}</details><p>每处探索资源仅领取一次。切换地图后，仅显示当前地图的标记。</p></section>`,[{text:'返回地图',action:'return_to_map'}]);
    }

    const SCROLL_ART_V2831={started:false,landscape:null,palace:null};
    function loadScrollArtV2831(){
      if(SCROLL_ART_V2831.started)return;SCROLL_ART_V2831.started=true;
      const request=(key,file,ground=false)=>{
        const img=new Image();img.decoding='async';
        img.onload=()=>{SCROLL_ART_V2831[key]=img;if(ground)releaseStaticWorldCacheV2767();img.onload=img.onerror=null;if((key==='monstersV2853'||key==='smallBeastsV28682')&&currentEnemy&&!document.hidden&&gameState==='combat')window.drawCharacter?.(document.getElementById('enemyChar'),currentEnemy.name,player.level,true);};
        img.onerror=()=>{SCROLL_ART_V2831[key]=null;img.onload=img.onerror=null;if(key==='regions')request('landscape','scroll-landscape-v2831.webp',true);if(key==='monstersV2853'){request('enemies','ink-enemies-v2833.webp');request('beasts','ink-beasts-v2833.webp');}};
        img.src='./'+file;
      };
      request('regions','scroll-regions-v2834.webp',true);
      for(const [key,file] of [['smallBeastsV28682','monster-small-beasts-v28682.webp'],['palace','scroll-palace-v2831.webp'],['buildings','scroll-buildings-v2832.webp'],['monstersV2853','monster-map-v2853.webp?v=2868-mini-return-20261015'],['regionalBuildings','region-buildings-v2835.webp']])request(key,file);
    }
    function scrollRegionCellV2834(region=currentRegion){
      const n=['south','east','west','north','human_peaks','human_valleys','demon_domain','immortal_domain'].indexOf(region);return n<0?0:n;
    }
    function drawRegionScrollV2834(ctx,x,y,w,h){
      const im=SCROLL_ART_V2831.regions;if(!im)return false;
      const n=scrollRegionCellV2834(),cw=im.width/2,ch=im.height/4;
      ctx.drawImage(im,n%2*cw,Math.floor(n/2)*ch,cw,ch,x,y,w,h);return true;
    }
    function scrollRegionStyleV2834(){
      const n=scrollRegionCellV2834();return `background-image:url('./scroll-regions-v2834.webp');background-size:200% 400%;background-position:${n%2*100}% ${Math.floor(n/2)/3*100}%;`;
    }
    function drawScrollGroundV2831(ctx){
      loadScrollArtV2831();if(drawRegionScrollV2834(ctx,0,0,FLAT_WORLD.width,FLAT_WORLD.height))return true;const im=SCROLL_ART_V2831.landscape;if(!im)return false;
      ctx.drawImage(im,0,0,FLAT_WORLD.width,FLAT_WORLD.height);
      const tint={north:'rgba(191,220,224,.17)',west:'rgba(125,90,70,.1)',demon_domain:'rgba(100,67,91,.18)',immortal_domain:'rgba(255,224,141,.1)',east:'rgba(66,125,103,.08)'}[currentRegion];
      if(tint){ctx.fillStyle=tint;ctx.fillRect(0,0,FLAT_WORLD.width,FLAT_WORLD.height);}return true;
    }
    function scrollPalacePoiV2831(p){return p.action==='faction_gate_v2806'||p.id==='sect'||p.id==='mountain'||['main_hall','elder_hall','forbidden_library','ancestor_cave','qingxuan_academy'].includes(p.buildingId);}
    function drawScrollPalaceV2831(ctx,p){
      const im=SCROLL_ART_V2831.palace;if(!im)return false;
      const w=p.action==='lingxiao_building'?128:180,h=w*im.height/im.width;
      const locked=p.action==='lingxiao_building'&&!canAccessBuilding(p.buildingId).allowed;
      ctx.save();if(locked)ctx.globalAlpha*=.58;ctx.drawImage(im,-w/2,-h+42,w,h);ctx.restore();
      if(locked){ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('🔒',w/3,-25);}
      ctx.strokeStyle='rgba(177,132,55,.8)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,28,w*.24,8,0,0,Math.PI*2);ctx.stroke();return true;
    }
    function scrollBuildingCellV2832(p){
      if(p.action==='explore_v2828'||scrollPalacePoiV2831(p))return -1;
      const k=getPoiVisualKind(p);
      if(k==='lingxiao_building'){
        if(p.buildingId==='spirit_spring')return -1;
        if(/丹|炼器|锻/.test(p.name))return 4;
        if(/洞|居|舍/.test(p.name))return 3;
        if(/市|商/.test(p.name))return 2;
        return 5;
      }
      return ({village:0,shop:1,market:2,home:3,alchemy:4,artifacts:5,sect:5,travel_gate:5,romance:5,secret:3})[k]??-1;
    }
    function drawScrollBuildingV2832(ctx,p){
      const n=scrollBuildingCellV2832(p),im=SCROLL_ART_V2831.buildings;if(n<0||!im)return false;
      const w=p.action==='lingxiao_building'?96:(n===0||n===2?150:120),h=w;
      const locked=p.action==='lingxiao_building'&&!canAccessBuilding(p.buildingId).allowed;
      ctx.save();if(locked)ctx.globalAlpha*=.58;
      ctx.drawImage(im,n%3*im.width/3,Math.floor(n/3)*im.height/2,im.width/3,im.height/2,-w/2,-h+32,w,h);ctx.restore();
      if(locked){ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('🔒',w/3,-20);}return true;
    }
    function regionBuildingCellV2835(p){
      const col=currentRegion==='north'?0:currentRegion==='demon_domain'?1:currentRegion==='immortal_domain'?2:-1;
      if(col<0)return null;
      if(scrollPalacePoiV2831(p))return {col,row:2};
      const base=scrollBuildingCellV2832(p);if(base<0)return null;
      return {col,row:base===0?0:base===3?3:base===5?2:1};
    }
    function drawRegionBuildingV2835(ctx,p){
      const cell=regionBuildingCellV2835(p),im=SCROLL_ART_V2831.regionalBuildings;if(!cell||!im)return false;
      const w=p.action==='lingxiao_building'?100:cell.row===2?180:cell.row===0?150:125;
      const cw=im.width/3,ch=im.height/4,h=w*ch/cw;
      const locked=p.action==='lingxiao_building'&&!canAccessBuilding(p.buildingId).allowed;
      ctx.save();if(locked)ctx.globalAlpha*=.58;
      ctx.drawImage(im,cell.col*cw,cell.row*ch,cw,ch,-w/2,-h+32,w,h);ctx.restore();
      if(locked){ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('🔒',w/3,-20);}return true;
    }
    function scrollPoiArtV2832(p){
      if(p.action==='war_map_v2840')return '<i class="war-scroll-flag-v2840">令</i>';
      const cell=regionBuildingCellV2835(p);
      if(cell)return `<i class="region-building-v2835" style="background-position:${cell.col*50}% ${cell.row/3*100}%"></i>`;
      if(scrollPalacePoiV2831(p))return '<img src="./scroll-palace-v2831.webp" alt="">';
      const n=scrollBuildingCellV2832(p);
      if(n>=0)return `<i class="scroll-building-v2832" style="background-position:${n%3*50}% ${Math.floor(n/3)*100}%"></i>`;
      return `<i>${p.icon||'◇'}</i>`;
    }
    function ensureScrollButtonV2831(){
      const host=document.getElementById('worldExploreActions');if(!host||document.getElementById('scrollMapButtonV2831'))return;
      const b=document.createElement('button');b.id='scrollMapButtonV2831';b.textContent='卷 山河图';b.onclick=showScrollMapV2831;host.appendChild(b);
    }
    function scrollPoiGroupV2837(p){
      if(p.action==='explore_v2828')return 'explore';
      if(p.buildingId==='spirit_spring')return 'service';
      if(p.action==='lingxiao_building'||p.action==='faction_gate_v2806'||p.id==='sect')return 'sect';
      if(['shop','market','rest','travel_gate','home','alchemy','artifacts'].includes(p.id)||p.action==='rest')return 'service';
      return 'other';
    }
    function scrollKnownPoisV2837(){
      return FLAT_WORLD.pois.filter(p=>p.action!=='explore_v2828'||exploredPointV2828(p.x,p.y));
    }
    function scrollPoiAccessV2837(p){
      return p.action==='lingxiao_building'?canAccessBuilding(p.buildingId):{allowed:true};
    }
    function scrollPoiDoneV2837(p){return p.action==='explore_v2828'&&!!explorationV2828().claimed[p.id];}
    function scrollFilteredPoisV2837(state){
      const q=String(state.query||'').trim().toLowerCase(),p=FLAT_WORLD.player;
      return scrollKnownPoisV2837().filter(o=>(state.filter==='all'||scrollPoiGroupV2837(o)===state.filter)&&(!q||String(o.name||'').toLowerCase().includes(q)))
        .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||String(a.id).localeCompare(String(b.id)));
    }
    function scrollSessionV2837(){
      const wrap=document.getElementById('scrollMapV2831'),state=wrap?._scrollStateV2837;
      if(!state)return null;
      if(state.region!==currentRegion||state.owner!==player){wrap.remove();return null;}
      return {wrap,state};
    }
    function closeScrollMapV2837(){
      const wrap=document.getElementById('scrollMapV2831');if(!wrap)return;
      const opener=wrap._scrollStateV2837?.opener;wrap.remove();FLAT_WORLD.keys={};
      if(opener?.isConnected)opener.focus({preventScroll:true});
    }
    function renderScrollTargetsV2837(){
      const session=scrollSessionV2837();if(!session)return;
      const {wrap,state}=session,esc=discipleEscV2815,cfg=getWorldMapConfig(),p=FLAT_WORLD.player,pois=scrollFilteredPoisV2837(state);
      if(!pois.some(o=>o.id===state.selected))state.selected=null;
      const field=document.getElementById('scrollFieldV2831');if(!field)return;
      field.innerHTML=pois.map(o=>`<button type="button" data-scroll-action="select" data-poi="${esc(o.id)}" class="scroll-poi-v2831 ${state.selected===o.id?'is-selected':''} ${scrollPoiDoneV2837(o)?'is-claimed':''}" style="left:${o.x/cfg.width*100}%;top:${o.y/cfg.height*100}%" aria-label="${esc(o.name)}" aria-pressed="${state.selected===o.id}">${scrollPoiArtV2832(o)}<span>${esc(o.name)}</span></button>`).join('')+`<div class="scroll-player-v2831" style="left:${p.x/cfg.width*100}%;top:${p.y/cfg.height*100}%">●<span>你在此</span></div>`;
      const list=document.getElementById('scrollDirectoryV2837');
      list.innerHTML=pois.length?pois.map(o=>`<button type="button" class="scroll-directory-row-v2837 ${state.selected===o.id?'is-selected':''}" data-scroll-action="locate" data-poi="${esc(o.id)}" aria-pressed="${state.selected===o.id}"><span><strong>${esc(o.name)}</strong><small>${scrollPoiDoneV2837(o)?'已领取':!scrollPoiAccessV2837(o).allowed?'未解锁':esc(explorationDirectionV2829(o))}</small></span><span aria-hidden="true">定位 ›</span></button>`).join(''):'<p class="scroll-empty-v2837">没有找到已知地点，试试其他名称或分类。</p>';
      document.getElementById('scrollCountV2837').textContent=String(pois.length);
      document.getElementById('scrollResultV2837').textContent=`显示 ${pois.length} / ${scrollKnownPoisV2837().length} 个已知地点`;
      for(const b of wrap.querySelectorAll('[data-scroll-filter]'))b.setAttribute('aria-pressed',String(b.dataset.scrollFilter===state.filter));
      renderScrollSelectionV2837();
    }
    function renderScrollSelectionV2837(){
      const session=scrollSessionV2837(),el=document.getElementById('scrollSelectionV2831');if(!session||!el)return;
      const poi=scrollKnownPoisV2837().find(p=>p.id===session.state.selected),esc=discipleEscV2815;
      if(!poi){el.innerHTML='<p>点选地标或展开地点目录，再选择前往方式。</p>';return;}
      const access=scrollPoiAccessV2837(poi),done=scrollPoiDoneV2837(poi),disabled=!access.allowed||done;
      el.innerHTML=`<strong>${esc(poi.name)}</strong><p>${esc(explorationDirectionV2829(poi))}${!access.allowed?' · 未解锁':done?' · 已领取':''}</p><p class="scroll-detail-v2837">${esc(poi.desc||'')}${poi.action==='village'&&rainStateV286822().step>=13?' · 青云渡口已复航 · '+esc(rainSummaryV286822()):''}${!access.allowed&&access.reason?' · '+esc(access.reason):''}</p><div class="scroll-journey-v2837"><button type="button" data-scroll-action="go" ${disabled?'disabled':''}>${done?'已完成探索':!access.allowed?'尚未解锁':'自动前往'}</button><button type="button" data-scroll-action="mark" ${disabled?'disabled':''}>标记方向</button></div>`;
    }
    function centerScrollPointV2837(point){
      const view=document.getElementById('scrollWindowV2831'),field=document.getElementById('scrollFieldV2831');if(!view||!field)return;
      const cfg=getWorldMapConfig(),w=field.clientWidth,h=field.clientHeight||w*cfg.height/cfg.width;
      view.scrollLeft=Math.max(0,Math.min(Math.max(0,w-view.clientWidth),point.x/cfg.width*w-view.clientWidth/2));
      view.scrollTop=Math.max(0,Math.min(Math.max(0,h-view.clientHeight),point.y/cfg.height*h-view.clientHeight/2));
    }
    function zoomScrollV2837(zoom,point=null){
      const session=scrollSessionV2837(),view=document.getElementById('scrollWindowV2831'),field=document.getElementById('scrollFieldV2831');if(!session||!view||!field)return;
      const cfg=getWorldMapConfig(),oldW=Math.max(1,field.clientWidth),oldH=Math.max(1,field.clientHeight||oldW*cfg.height/cfg.width);
      const anchor=point||{x:Math.min(1,(view.scrollLeft+view.clientWidth/2)/oldW)*cfg.width,y:Math.min(1,(view.scrollTop+view.clientHeight/2)/oldH)*cfg.height};
      const next=Math.max(1,Math.min(4,Number(zoom)||1));session.state.zoom=next;
      field.style.width=next===1?'100%':`${Math.round(Math.max(1,view.clientWidth)*next)}px`;
      field.dataset.overview=String(next<2);centerScrollPointV2837(anchor);
      document.getElementById('scrollZoomV2837').textContent=`${next.toFixed(1)}×`;
      for(const b of session.wrap.querySelectorAll('[data-scroll-action="minus"]'))b.disabled=next<=1;
      for(const b of session.wrap.querySelectorAll('[data-scroll-action="plus"]'))b.disabled=next>=4;
    }
    function scaleScrollMapV2831(big){zoomScrollV2837(big?3:1);}
    function selectScrollPoiV2831(id,locate=false){
      if(!forgeAllowedV2825())return;
      const session=scrollSessionV2837();if(!session)return;
      const poi=scrollFilteredPoisV2837(session.state).find(p=>p.id===id);if(!poi)return;
      session.state.selected=id;renderScrollTargetsV2837();
      if(locate)zoomScrollV2837(Math.max(2,session.state.zoom),poi);
    }
    function nearestScrollRestV2837(){
      const session=scrollSessionV2837();if(!session||!forgeAllowedV2825())return;
      const p=FLAT_WORLD.player,candidates=scrollKnownPoisV2837().filter(o=>(o.id==='rest'||o.action==='rest'||o.buildingId==='spirit_spring')&&scrollPoiAccessV2837(o).allowed);
      candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      if(!candidates.length){document.getElementById('scrollSelectionV2831').textContent='本地域暂无可用补给点，可通过驿道返回其他地域。';return;}
      session.state.filter='all';session.state.query='';document.getElementById('scrollSearchV2837').value='';
      renderScrollTargetsV2837();selectScrollPoiV2831(candidates[0].id,true);
    }
    function startScrollJourneyV2837(mark=false){
      if(!forgeAllowedV2825())return;
      const session=scrollSessionV2837();if(!session)return;
      const poi=scrollFilteredPoisV2837(session.state).find(p=>p.id===session.state.selected);
      if(!poi||scrollPoiDoneV2837(poi)||!scrollPoiAccessV2837(poi).allowed)return;
      closeScrollMapV2837();if(mark)markExplorationV2829(poi.id);else startNavigationV2830(poi.id);
    }
    function showScrollMapV2831(){
      if(typeof syncWarMapV2840==='function')syncWarMapV2840();
      if(!forgeAllowedV2825())return;
      const opener=document.activeElement;stopNavigationV2830();FLAT_WORLD.keys={};FLAT_WORLD.target=null;FLAT_WORLD.moving=false;FLAT_WORLD.tapTargetFx=null;
      document.getElementById('scrollMapV2831')?.remove();loadScrollArtV2831();
      const esc=discipleEscV2815,cfg=getWorldMapConfig(),wrap=document.createElement('div');wrap.id='scrollMapV2831';wrap.className='scroll-map-v2831 scroll-map-v2837';
      wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-labelledby','scrollTitleV2837');
      wrap._scrollStateV2837={region:currentRegion,owner:player,opener,filter:'all',query:'',zoom:1,selected:null};
      wrap.innerHTML=`<section class="scroll-sheet-v2831"><header><div><small>仙途 · 山河绘卷</small><h2 id="scrollTitleV2837">${esc(getRegionInfo(currentRegion||'south').name)}</h2></div><button type="button" data-scroll-action="close" aria-label="关闭山河图">✕</button></header><div class="scroll-search-v2837"><input type="search" id="scrollSearchV2837" maxlength="40" placeholder="搜索已知地点名称" aria-label="搜索已知地点名称"><button type="button" data-scroll-action="rest">最近补给</button></div><nav class="scroll-filters-v2837" aria-label="地点分类">${[['all','全部'],['service','生活补给'],['sect','宗门'],['explore','探索']].map(([id,name])=>`<button type="button" data-scroll-filter="${id}" aria-pressed="${id==='all'}">${name}</button>`).join('')}</nav><div class="scroll-toolbar-v2837"><button type="button" data-scroll-action="minus" aria-label="缩小地图" disabled>−</button><output id="scrollZoomV2837">1.0×</output><button type="button" data-scroll-action="plus" aria-label="放大地图">＋</button><button type="button" data-scroll-action="fit">全图</button><button type="button" data-scroll-action="player">回到主角</button></div><div class="scroll-window-v2831" id="scrollWindowV2831"><div class="scroll-field-v2831" id="scrollFieldV2831" data-overview="true" style="aspect-ratio:${cfg.width}/${cfg.height};${scrollRegionStyleV2834()}"></div></div><div class="scroll-result-v2837" id="scrollResultV2837" aria-live="polite"></div><details class="scroll-directory-v2837" id="scrollDetailsV2837"><summary>地点目录 · <span id="scrollCountV2837">0</span><span>按距离排列</span></summary><div id="scrollDirectoryV2837"></div></details><div id="scrollSelectionV2831" class="scroll-selection-v2831" aria-live="polite"></div></section>`;
      wrap.onclick=e=>{
        const b=e.target.closest('button');if(!b||!wrap.contains(b)||b.disabled)return;
        const session=scrollSessionV2837();if(!session)return;
        if(b.dataset.scrollFilter){session.state.filter=b.dataset.scrollFilter;renderScrollTargetsV2837();return;}
        const action=b.dataset.scrollAction;
        if(action==='close')closeScrollMapV2837();
        else if(action==='select'||action==='locate')selectScrollPoiV2831(b.dataset.poi,action==='locate');
        else if(action==='plus'||action==='minus')zoomScrollV2837(session.state.zoom+(action==='plus'?0.5:-0.5));
        else if(action==='fit')zoomScrollV2837(1);
        else if(action==='player')zoomScrollV2837(Math.max(2,session.state.zoom),FLAT_WORLD.player);
        else if(action==='rest')nearestScrollRestV2837();
        else if(action==='go'||action==='mark')startScrollJourneyV2837(action==='mark');
      };
      wrap.oninput=e=>{if(e.target.id!=='scrollSearchV2837')return;const session=scrollSessionV2837();if(!session)return;session.state.query=e.target.value.slice(0,40);renderScrollTargetsV2837();};
      wrap.onkeydown=e=>{
        e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closeScrollMapV2837();return;}
        if(e.key==='Tab'){
          const focusable=Array.from(wrap.querySelectorAll('button:not([disabled]),input,summary')).filter(el=>el.getClientRects().length),first=focusable[0],last=focusable[focusable.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
        }
      };
      document.body.appendChild(wrap);renderScrollTargetsV2837();wrap.querySelector('[data-scroll-action="close"]').focus({preventScroll:true});
    }

    function worldThemeV2827(){
      const palettes={south:['#617452','#8b9867','#314b37','#819d64'],east:['#425d50','#6d8470','#24483f','#76aa8b'],west:['#695f54','#998268','#463e39','#8a725d'],north:['#a9bcb7','#d2dfd6','#354b48','#b7d1c9'],human_peaks:['#737e69','#a7ae8a','#425747','#93ad72'],human_valleys:['#526b50','#85966a','#304d39','#8aa861'],demon_domain:['#40383f','#6b515a','#312b36','#8b5969'],immortal_domain:['#829c98','#bad2c4','#4a6c68','#afd8b5']};
      const p=palettes[currentRegion||'south']||palettes.south;return {ground:p[0],patch:p[1],dark:p[2],leaf:p[3]};
    }
    function worldRoutesV2827(){
      const hub=getWorldMapConfig().hub;
      return FLAT_WORLD.pois.filter(p=>p.action!=='lingxiao_building'&&p.action!=='explore_v2828').map((p,i)=>{const dx=p.x-hub.x,dy=p.y-hub.y,l=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(65,l*.1)*(i%2?1:-1);return {a:hub,b:p,c:{x:(hub.x+p.x)/2-dy/l*bend,y:(hub.y+p.y)/2+dx/l*bend}};});
    }
    function worldRoutePointV2827(r,t){const u=1-t;return {x:u*u*r.a.x+2*u*t*r.c.x+t*t*r.b.x,y:u*u*r.a.y+2*u*t*r.c.y+t*t*r.b.y};}
    function worldDistanceSegmentV2827(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);}
    function worldRoadSegmentsV2827(){
      const segments=[];for(const r of worldRoutesV2827())for(let i=0;i<12;i++)segments.push([worldRoutePointV2827(r,i/12),worldRoutePointV2827(r,(i+1)/12)]);
      if(currentRegion==='north')for(const [a,b] of BUILDING_PATHS){const start=getBuildingData(a),end=getBuildingData(b);if(start&&end)segments.push([start,end]);}return segments;
    }
    function drawTerrainV2827(ctx){
      if(drawScrollGroundV2831(ctx))return;
      const theme=worldThemeV2827(),w=FLAT_WORLD.width,h=FLAT_WORLD.height;ctx.fillStyle=theme.ground;ctx.fillRect(0,0,w,h);
      // Fixed organic patches are baked into the existing ground cache, never animated.
      for(let i=0;i<24;i++){
        const x=70+(i*367.1)%(w-140),y=70+(i*241.7)%(h-140),radius=65+(i%5)*24;
        ctx.fillStyle=i%3===0?theme.dark:theme.patch;ctx.globalAlpha=i%3===0?.12:.25;ctx.beginPath();
        for(let j=0;j<14;j++){const angle=j*Math.PI/7,rr=radius*(.82+.15*Math.sin(j*2.7+i));const px=x+Math.cos(angle)*rr,py=y+Math.sin(angle)*rr*.62;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();
        if(currentRegion==='demon_domain'&&i%3===0){ctx.strokeStyle='#b17a73';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-25,y-15);ctx.lineTo(x,y);ctx.lineTo(x-8,y+14);ctx.lineTo(x+22,y+25);ctx.stroke();}
      }ctx.globalAlpha=1;
    }
    function drawRoutesV2827(ctx){ /* Routes intentionally hidden in V28.47. */ }

    function drawBiomeTreeV2827(ctx,o){
      const s=o.s||1,t=worldThemeV2827(),region=currentRegion||'south';ctx.save();ctx.translate(o.x,o.y);ctx.scale(s,s);ctx.strokeStyle=t.dark;ctx.lineWidth=2;
      ctx.fillStyle='rgba(12,23,22,.18)';ctx.beginPath();ctx.ellipse(0,25,23,7,0,0,Math.PI*2);ctx.fill();
      if(region==='demon_domain'||region==='west'){
        ctx.strokeStyle=region==='demon_domain'?'#292731':'#544238';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,26);ctx.lineTo(-3,-12);ctx.lineTo(3,-46);ctx.stroke();ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(-20,-20);ctx.lineTo(-26,-34);ctx.moveTo(0,-20);ctx.lineTo(20,-31);ctx.lineTo(27,-45);ctx.stroke();
        ctx.strokeStyle=t.leaf;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(2,20);ctx.lineTo(0,-9);ctx.stroke();
      }else if(region==='north'||region==='human_peaks'){
        ctx.fillStyle='#5f5142';ctx.fillRect(-4,0,8,28);
        for(let i=0;i<3;i++){const y=8-i*16,width=29-i*6;ctx.fillStyle=t.dark;ctx.beginPath();ctx.moveTo(-width,y+10);ctx.lineTo(0,y-30);ctx.lineTo(width,y+10);ctx.lineTo(10,y+6);ctx.lineTo(0,y+12);ctx.closePath();ctx.fill();ctx.stroke();if(region==='north'){ctx.fillStyle=t.leaf;ctx.beginPath();ctx.moveTo(0,y-30);ctx.lineTo(-width*.6,y-4);ctx.lineTo(0,y-9);ctx.lineTo(width*.55,y-5);ctx.closePath();ctx.fill();}}
      }else{
        ctx.fillStyle='#66513d';ctx.fillRect(-4,-5,8,33);
        const colors=[t.dark,t.leaf,t.patch];for(let i=0;i<3;i++){ctx.fillStyle=colors[i];ctx.beginPath();ctx.ellipse((i-1)*12,-14-i*8,22-i*3,27-i*3,(i-1)*.25,0,Math.PI*2);ctx.fill();ctx.stroke();}
        ctx.strokeStyle=t.dark;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(3,-24);ctx.moveTo(2,-7);ctx.lineTo(-9,-16);ctx.stroke();
      }ctx.restore();
    }

    function drawWorldGround(ctx) {
      loadScrollArtV2831();if(drawRegionScrollV2834(ctx,0,0,FLAT_WORLD.width,FLAT_WORLD.height))return;
      const cfg=getWorldMapConfig(), region=getRegionInfo(currentRegion||'south');
      drawTerrainV2827(ctx);
      ctx.save();
      for(let i=0;i<8;i++){
        const px=((i*173)%FLAT_WORLD.width),py=((i*241)%FLAT_WORLD.height);
        const rg=ctx.createRadialGradient(px,py,20,px,py,120+(i%3)*30);
        rg.addColorStop(0,'rgba(255,255,255,.028)');rg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=rg;ctx.beginPath();ctx.arc(px,py,120+(i%3)*30,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
      const demon=currentRegion==='demon_domain',immortal=currentRegion==='immortal_domain',stone=immortal||currentRegion==='north';
      ctx.save();
      for(let i=0;i<150;i++){
        const x=24+(i*193.73)%(FLAT_WORLD.width-48),y=24+(i*317.19)%(FLAT_WORLD.height-48);
        ctx.strokeStyle=demon?'rgba(209,122,145,.12)':stone?'rgba(228,234,211,.12)':'rgba(193,209,151,.14)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+9,y-4,x+20,y+1);ctx.stroke();
        if(i%3===0){ctx.fillStyle=demon?'#433443':stone?'#929e94':'#617652';ctx.beginPath();ctx.ellipse(x+8,y+6,2.8,1.3,.2,0,Math.PI*2);ctx.fill();}
      }
      ctx.restore();
      const hub=cfg.hub;
      drawRoutesV2827(ctx);
      ctx.fillStyle='rgba(255,255,255,.035)';ctx.beginPath();ctx.arc(hub.x,hub.y,78,0,Math.PI*2);ctx.fill();
      ctx.font='700 15px Microsoft YaHei';ctx.textAlign='center';ctx.fillStyle=region.color;ctx.fillText(region.shortName,hub.x,hub.y+5);
    }

    function drawWorldDecor(ctx,o){
      const x=o.x,y=o.y,s=o.s||1,variant=o.v||0;
      ctx.save();ctx.translate(x,y);ctx.rotate(o.rot||0);
      const shadowScale=o.t==='tree'?1.15:(o.t==='stone'?1:.72);
      ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(0,18*s,20*s*shadowScale,7*s*shadowScale,0,0,Math.PI*2);ctx.fill();
      if(o.t==='tree'){
        const trunkGrad=ctx.createLinearGradient(-6*s,0,7*s,26*s);trunkGrad.addColorStop(0,'#7e5b43');trunkGrad.addColorStop(.45,'#654632');trunkGrad.addColorStop(1,'#3c281d');
        ctx.fillStyle=trunkGrad;
        ctx.beginPath();ctx.moveTo(-5.5*s,2*s);ctx.lineTo(5.5*s,2*s);ctx.lineTo(7*s,28*s);ctx.lineTo(-4.5*s,28*s);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.moveTo(-3.2*s,4*s);ctx.lineTo(-.6*s,4*s);ctx.lineTo(-.1*s,24*s);ctx.lineTo(-2.8*s,24*s);ctx.closePath();ctx.fill();
        const tone=variant===0?['#31583a','#4c7c4f','#7dad6e','rgba(210,255,211,.20)']:(variant===1?['#2f5133','#467049','#699761','rgba(235,255,225,.18)']:['#385e3d','#558759','#83b27b','rgba(226,255,220,.18)']);
        const clumps=[
          {x:-15*s,y:-4*s,rx:15*s,ry:18*s,r:-.35},
          {x:14*s,y:-6*s,rx:14*s,ry:17*s,r:.28},
          {x:-3*s,y:-19*s,rx:18*s,ry:19*s,r:.08},
          {x:13*s,y:-19*s,rx:13*s,ry:16*s,r:.22},
          {x:-15*s,y:-18*s,rx:12*s,ry:15*s,r:-.18},
          {x:0,y:-8*s,rx:22*s,ry:19*s,r:0}
        ];
        clumps.forEach((c,idx)=>{
          const g=ctx.createRadialGradient(c.x-4*s,c.y-8*s,2,c.x,c.y,Math.max(c.rx,c.ry));
          g.addColorStop(0,tone[2]);g.addColorStop(.55,tone[1]);g.addColorStop(1,tone[0]);
          ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(c.x,c.y,c.rx,c.ry,c.r+(o.lean||0),0,Math.PI*2);ctx.fill();
          if(idx<3){ctx.fillStyle=tone[3];ctx.beginPath();ctx.ellipse(c.x-c.rx*.2,c.y-c.ry*.32,c.rx*.34,c.ry*.2,c.r,0,Math.PI*2);ctx.fill();}
        });
        ctx.strokeStyle='rgba(27,43,25,.28)';ctx.lineWidth=Math.max(.7,1.1*s);ctx.beginPath();ctx.ellipse(0,-9*s,24*s,26*s,-.1,0,Math.PI*2);ctx.stroke();
      }else if(o.t==='stone'){
        const pts=[[-17,8],[-15,-3],[-7,-15],[7,-12],[18,-1],[14,12],[0,16]].map(([px,py])=>[px*s,py*s]);
        ctx.strokeStyle='rgba(54,56,50,.62)';ctx.lineWidth=Math.max(1.2,2*s);
        ctx.fillStyle='#70746c';ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
        for(const [px,py] of pts.slice(1))ctx.lineTo(px,py);
        ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#91968b';ctx.beginPath();ctx.moveTo(-15*s,-3*s);ctx.lineTo(-7*s,-15*s);ctx.lineTo(2*s,-6*s);ctx.lineTo(-1*s,5*s);ctx.closePath();ctx.fill();
        ctx.fillStyle='#5b5f59';ctx.beginPath();ctx.moveTo(2*s,-6*s);ctx.lineTo(7*s,-12*s);ctx.lineTo(18*s,-1*s);ctx.lineTo(10*s,12*s);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.ellipse(-3*s,-8*s,5.5*s,2.2*s,-.18,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.09)';ctx.beginPath();ctx.moveTo(-8*s,-4*s);ctx.lineTo(6*s,6*s);ctx.stroke();
      }else{
        for(let i=-1;i<=1;i++){
          const off=i*5.5*s;
          ctx.strokeStyle='#355137';ctx.lineWidth=Math.max(.9,1.55*s);
          ctx.beginPath();ctx.moveTo(off,8*s);ctx.quadraticCurveTo(off-2*s,-1*s,off+(i*3+4)*s,-12*s);ctx.stroke();
          ctx.strokeStyle='rgba(170,211,128,.56)';ctx.beginPath();ctx.moveTo(off,8*s);ctx.quadraticCurveTo(off-1.3*s,1*s,off+(i*3+2)*s,-9*s);ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawWorldPoi(ctx,o){
      ctx.save();ctx.translate(o.x,o.y);
      const near=FLAT_WORLD.nearby?.id===o.id;
      const kind=getPoiVisualKind(o);
      if(near){ctx.fillStyle='rgba(239,201,108,.12)';ctx.beginPath();ctx.arc(0,2,o.r+16,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(239,201,108,.78)';ctx.setLineDash([8,8]);ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([])}
      if(kind==='npc'){
        drawMapNpcV2863(ctx,o);
        drawMapNpcStatusV2864(ctx,o);
      }else if(drawRegionBuildingV2835(ctx,o)){
        // Regional painted architecture shares existing collision and access rules.
      }else if(scrollPalacePoiV2831(o)&&drawScrollPalaceV2831(ctx,o)){
        // Painted landmark uses the same gameplay location and collision footprint.
      }else if(drawScrollBuildingV2832(ctx,o)){
        // Shared painted atlas; gameplay location and access unchanged.
      }else if(o.action==='explore_v2828'){
        const done=explorationV2828().claimed[o.id];ctx.fillStyle=done?'#7c8980':'#d4bd7e';ctx.beginPath();ctx.ellipse(0,13,20,7,0,0,Math.PI*2);ctx.fill();ctx.font='27px "Segoe UI Emoji"';ctx.textAlign='center';ctx.fillText(done?'✓':o.icon,0,5);
      }else if(o.action==='faction_gate_v2806'){
        const roof=o.factionGroup==='demon'?'#6d344c':o.factionGroup==='immortal'?'#8b87b8':'#477365';
        drawIsoHouse(ctx,{w:78,h:64,roof,front:o.factionGroup==='demon'?'#756371':'#d3d5c7',side:'#7e8b86',style:o.factionGroup==='human'?'pagoda':o.factionGroup,trim:o.factionGroup==='demon'?'#c18b9f':'#e5d5a3'});
      }else if(o.buildingId==='spirit_spring'){
        ctx.fillStyle='#526f75';ctx.beginPath();ctx.ellipse(0,9,54,32,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#3bafc8';ctx.beginPath();ctx.ellipse(0,4,46,26,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#b9f4ff';ctx.lineWidth=2;
        for(const radius of [16,30,41]){ctx.beginPath();ctx.ellipse(0,3,radius,radius*.5,0,0,Math.PI*2);ctx.stroke();}
        ctx.fillStyle='rgba(212,250,255,.7)';ctx.beginPath();ctx.ellipse(0,-7,8,17,0,0,Math.PI*2);ctx.fill();
        ctx.font='20px "Segoe UI Emoji"';ctx.textAlign='center';ctx.fillText('💧',0,-25);
      }else if(kind==='lingxiao_building'){
        const b=getBuildingData(o.buildingId), access=b?canAccessBuilding(b.id):{allowed:true}, tierColor=b?getBuildingTierColor(b):'#c7e4ff';
        const tower=/阁|塔|殿/.test(o.name||'');
        ctx.globalAlpha*=access.allowed?1:.58;
        drawIsoHouse(ctx,{w:43,h:35,roof:tower?'#496b78':'#587060',front:'#d5d0b5',side:'#88918a',trim:'#d4c492',style:tower?'pagoda':'hall'});
        ctx.globalAlpha=1;
        if(!access.allowed){ctx.font='11px "Segoe UI Emoji"';ctx.textAlign='center';ctx.fillText('🔒',17,-20);}
      }else if(kind==='village'){
        drawIsoHouse(ctx,{w:62,h:52,roof:'#8f5941',front:'#cab38e',side:'#9d8667'});
        ctx.save();ctx.translate(-36,12);ctx.scale(.8,.8);drawIsoHouse(ctx,{w:48,h:40,roof:'#7e4c39',front:'#bca987',side:'#8d785f'});ctx.restore();
        ctx.save();ctx.translate(34,12);ctx.scale(.76,.76);drawIsoHouse(ctx,{w:44,h:37,roof:'#8f6343',front:'#cdb792',side:'#9c8868'});ctx.restore();
        ctx.save();ctx.translate(2,-6);ctx.scale(.58,.58);drawIsoHouse(ctx,{w:40,h:34,roof:'#84553d',front:'#ceb895',side:'#9f8969'});ctx.restore();
        ctx.strokeStyle='rgba(141,113,81,.85)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-48,30);ctx.lineTo(48,30);ctx.stroke();
        [-34,-18,-2,14,30].forEach(dx=>{ctx.strokeStyle='rgba(116,90,62,.75)';ctx.beginPath();ctx.moveTo(dx,26);ctx.lineTo(dx,34);ctx.stroke();});
      }else if(kind==='shop'){
        drawIsoHouse(ctx,{w:56,h:48,roof:'#536781',front:'#d2c0a0',side:'#aa9677'});
        ctx.fillStyle='rgba(255,230,145,.92)';ctx.fillRect(-14,4,28,7);
      }else if(kind==='market'){
        drawIsoHouse(ctx,{w:68,h:50,roof:'#b14e48',front:'#d7c39e',side:'#aa8c68'});
        [['#ffcf6f',-32],['#ff8db0',0],['#7edbff',32]].forEach(([c,dx])=>{ctx.strokeStyle='#6d4a36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dx,-2);ctx.lineTo(dx,18);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.arc(dx,23,4.5,0,Math.PI*2);ctx.fill();});
        ctx.fillStyle='rgba(252,219,144,.82)';ctx.fillRect(-18,12,36,6);ctx.fillStyle='rgba(134,88,60,.76)';ctx.fillRect(-3,8,6,18);
        ctx.save();ctx.translate(-44,16);ctx.scale(.52,.52);drawIsoHouse(ctx,{w:42,h:30,roof:'#8d3d37',front:'#cda97f',side:'#976d4c'});ctx.restore();
        ctx.save();ctx.translate(44,16);ctx.scale(.52,.52);drawIsoHouse(ctx,{w:42,h:30,roof:'#8d3d37',front:'#cda97f',side:'#976d4c'});ctx.restore();
      }else if(kind==='home'){
        ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,28,40,12,0,0,Math.PI*2);ctx.fill();
        const hill=ctx.createLinearGradient(0,-24,0,34);hill.addColorStop(0,'#8b9a73');hill.addColorStop(.5,'#60734f');hill.addColorStop(1,'#42553a');
        ctx.fillStyle=hill;ctx.beginPath();ctx.moveTo(-40,20);ctx.quadraticCurveTo(-32,-18,-8,-24);ctx.quadraticCurveTo(12,-30,28,-16);ctx.quadraticCurveTo(42,-2,44,20);ctx.closePath();ctx.fill();
        ctx.fillStyle='#2d261e';ctx.beginPath();ctx.arc(4,8,17,Math.PI,0);ctx.fill();ctx.fillRect(-13,8,34,13);
        ctx.fillStyle='rgba(255,220,152,.38)';ctx.beginPath();ctx.arc(4,8,8,Math.PI,0);ctx.fill();
        ctx.fillStyle='#9fae86';ctx.beginPath();ctx.ellipse(-18,-10,12,7,-.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(20,-11,10,6,.3,0,Math.PI*2);ctx.fill();
      }else if(kind==='sect'){
        drawIsoHouse(ctx,{w:74,h:56,roof:'#8f3434',front:'#d5cab5',side:'#ac9b86',trim:'#f3dfbb'});
        ctx.strokeStyle='#5d2f2f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-25,-6);ctx.lineTo(-25,30);ctx.moveTo(25,-6);ctx.lineTo(25,30);ctx.stroke();
        ctx.strokeStyle='#e9d4ab';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-36,-2);ctx.lineTo(36,-2);ctx.stroke();
        ctx.fillStyle='rgba(191,150,104,.78)';ctx.fillRect(-18,30,36,6);ctx.fillStyle='rgba(225,206,171,.7)';ctx.fillRect(-11,36,22,4);
        ctx.save();ctx.translate(-42,18);ctx.scale(.5,.5);drawIsoHouse(ctx,{w:40,h:32,roof:'#7d2c2c',front:'#ccb8a3',side:'#9e8974'});ctx.restore();
        ctx.save();ctx.translate(42,18);ctx.scale(.5,.5);drawIsoHouse(ctx,{w:40,h:32,roof:'#7d2c2c',front:'#ccb8a3',side:'#9e8974'});ctx.restore();
      }else if(kind==='alchemy'){
        drawIsoHouse(ctx,{w:56,h:48,roof:'#924c28',front:'#bca98e',side:'#8a775f'});
        ctx.fillStyle='rgba(255,138,83,.78)';ctx.beginPath();ctx.arc(16,-10,6,0,Math.PI*2);ctx.fill();
      }else if(kind==='artifacts'){
        ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,22,34,10,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#9ca6bb';ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(25,-6);ctx.lineTo(0,14);ctx.lineTo(-25,-6);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(190,227,255,.48)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='rgba(126,201,255,.56)';ctx.beginPath();ctx.arc(0,-6,7,0,Math.PI*2);ctx.fill();
      }else if(kind==='rest'){
        ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,18,28,8,0,0,Math.PI*2);ctx.fill();
        const pool=ctx.createRadialGradient(0,4,2,0,4,24);pool.addColorStop(0,'#b5f3ff');pool.addColorStop(.55,'#70bdd5');pool.addColorStop(1,'#2b6377');
        ctx.fillStyle=pool;ctx.beginPath();ctx.ellipse(0,4,28,18,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(227,245,255,.54)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,4,28,18,0,0,Math.PI*2);ctx.stroke();
      }else if(kind==='travel_gate'){
        ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(0,23,32,10,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#7ec9ff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-24,18);ctx.lineTo(-24,-18);ctx.moveTo(24,18);ctx.lineTo(24,-18);ctx.stroke();
        ctx.strokeStyle='rgba(191,234,255,.88)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='rgba(126,201,255,.22)';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
      }else if(kind==='forest'){
        ctx.save();ctx.scale(1.15,1.15);drawWorldDecor(ctx,{x:0,y:0,t:'tree',s:1.35,v:1,rot:0,lean:.05});ctx.restore();
      }else if(kind==='mountain'){
        ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,26,44,12,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#748191';ctx.beginPath();ctx.moveTo(-42,22);ctx.lineTo(-15,-18);ctx.lineTo(0,-2);ctx.lineTo(20,-28);ctx.lineTo(44,22);ctx.closePath();ctx.fill();
        ctx.fillStyle='#8d9aab';ctx.beginPath();ctx.moveTo(-14,-16);ctx.lineTo(0,-2);ctx.lineTo(20,-28);ctx.lineTo(8,-2);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.76)';ctx.beginPath();ctx.moveTo(-15,-18);ctx.lineTo(-7,-9);ctx.lineTo(-2,-14);ctx.lineTo(3,-6);ctx.lineTo(9,-12);ctx.lineTo(20,-28);ctx.closePath();ctx.fill();
      }else if(kind==='battlefield'){
        ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,18,34,9,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#7a5d49';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,-8);ctx.lineTo(16,20);ctx.moveTo(16,-8);ctx.lineTo(-18,20);ctx.stroke();
        ctx.strokeStyle='rgba(255,160,120,.4)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,-2);ctx.lineTo(10,16);ctx.moveTo(10,-2);ctx.lineTo(-12,16);ctx.stroke();
      }else if(kind==='romance'){
        ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(0,18,24,7,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#d79ac0';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,15);ctx.quadraticCurveTo(-26,-6,-8,-14);ctx.quadraticCurveTo(0,-20,8,-14);ctx.quadraticCurveTo(26,-6,0,15);ctx.stroke();
      }else if(kind==='secret'){
        ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(0,18,24,7,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(148,124,255,.86)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();
      }else {
        if(!PERF_CONFIG.ultraSmooth){ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=8;ctx.shadowOffsetY=8}
        ctx.font=`${Math.round(Math.min(68,o.r*.75))}px "Segoe UI Emoji"`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(o.icon,0,0);ctx.shadowColor='transparent';ctx.shadowBlur=0;
      }
      ctx.textAlign='center';
      if(o.action==='yewuji_v2810'){ctx.save();ctx.translate(0,16);drawMapNpcV2863(ctx,o);ctx.restore();}
      if(typeof drawSectTodoV2868==='function')drawSectTodoV2868(ctx,o);
      if(kind==='npc'||typeof drawPoiNamePlateV211!=='function'){
      ctx.font=kind==='lingxiao_building'?'700 11px Microsoft YaHei':'700 15px Microsoft YaHei';ctx.fillStyle=o.id==='travel_gate'?'#bfeaff':(kind==='npc'?'#ffd2ec':(kind==='lingxiao_building'?(canAccessBuilding(o.buildingId).allowed?getBuildingTierColor(getBuildingData(o.buildingId)):'#888'):'#ede1c0'));
      if(!PERF_CONFIG.ultraSmooth){ctx.strokeStyle='#2b2a24';ctx.lineWidth=4;ctx.strokeText(o.name,0,o.r*.72)}
      ctx.fillText(o.name,0,o.r*.72);
      }
      ctx.restore();
    }

    function drawWorldPlayer(ctx,p){
      ctx.save();ctx.translate(p.x,p.y);
      const visualLevel=getRealmVisualTier(player?.level || 0);
      if(PERF_CONFIG.ultraSmooth && visualLevel>0){
        // 流畅模式只保留轻量境界辉光，不再每帧创建渐变、粒子、道纹和多重光环。
        const preset=getRealmAuraPreset(visualLevel);
        const pulse=1+Math.sin(performance.now()*.004)*.035;
        ctx.globalAlpha=.16;
        ctx.fillStyle=preset.outer;
        ctx.beginPath();ctx.arc(0,0,37*pulse,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=.42;
        ctx.strokeStyle=preset.inner;ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(0,2,25*pulse,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=1;
      } else {
        drawRealmAura(ctx, 0, 0, 38, visualLevel, { alpha:0.82 + Math.min(3, player?.phase || 0) * 0.12 });
      }
      ctx.restore();
      drawActor25DV2770(ctx,p);
    }

    function updateWorldHUD(){
      if(typeof syncFirstJourneyV28687==='function')syncFirstJourneyV28687();
      if(typeof syncSectTodoV2868==='function')syncSectTodoV2868();
      ensureScrollButtonV2831();
      ensureExplorationButtonV2829();
      if(!document.getElementById('worldPlayerName') || !player)return;
      clampPlayerVitals();
      const realm=CULTIVATION_REALMS[player.level];
      const maxHp=getMaxHp(),maxMp=getMaxMp(),need=getCurrentExpNeed();
      document.getElementById('worldPlayerName').textContent=player.name||'无名';
      document.getElementById('worldRealm').textContent=getCultivationName();
      document.getElementById('worldHpText').textContent=`${Math.max(0,Math.round(player.hp))} / ${maxHp}`;
      document.getElementById('worldMpText').textContent=`${Math.max(0,Math.round(player.mp))} / ${Math.max(0,Math.round(maxMp))}`;
      document.getElementById('worldExpText').textContent=`${Math.round(player.exp)} / ${need}`;
      document.getElementById('worldHpBar').style.width=`${Math.max(0,Math.min(100,Math.max(0,player.hp)/maxHp*100))}%`;
      document.getElementById('worldMpBar').style.width=`${Math.max(0,Math.min(100,Math.max(0,player.mp)/Math.max(1,maxMp)*100))}%`;
      document.getElementById('worldExpBar').style.width=`${Math.max(0,Math.min(100,player.exp/need*100))}%`;
      document.getElementById('worldGold').textContent=player.gold;
      document.getElementById('worldAtk').textContent=getAtk();document.getElementById('worldDef').textContent=getDef();
      const timeHud=document.getElementById('worldTime');
      if(timeHud) timeHud.textContent=getGameDateLabel()+(isLingxiaoNight()?' · 夜':'');
      updateRegionStatusHUD?.();
      const cp=document.getElementById('characterPanel'); if(cp && !cp.classList.contains('hidden')) updateCharacterPanelDeep();
      const tournamentHud=document.getElementById('worldTournament');
      if(tournamentHud){const pending=getPendingTournamentCentury();tournamentHud.style.display=pending?'inline':'none';tournamentHud.textContent=pending?`📯 ${pending}年大比待参加`:'📯 百年大比';}
      const romanceHud=document.getElementById('worldRomance');
      if (romanceHud) {
        if (player.romance?.partner) romanceHud.textContent=`道侣·${ROMANCE_NPCS[player.romance.partner]?.name || '缘定'}`;
        else {
          const su=player.romance?.npcs?.[MAIN_HEROINE_ID];
          romanceHud.textContent=su ? `苏晚晴·${getRomanceStage(su.affection,false,MAIN_HEROINE_ID)}` : '旧缘未了';
        }
      }
    }

    // ================== 游戏启动 ==================
    
    let hasCheckedSave = false;
    

    // ================== V27.65 本地稳定版：999 满级测试账号 ==================
    const TEST_SAVE_KEY_999_V2760 = 'xiantu_save_test_999';

    function applyMaxTestPreset999V2760(p) {
      if (!p || typeof p !== 'object') p = createDefaultPlayer();

      const maxRealm = Math.max(0, CULTIVATION_REALMS.length - 1);
      const maxPhase = Math.max(0, (CULTIVATION_REALMS[maxRealm]?.phaseExp?.length || 1) - 1);

      p.name = '999';
      p.daoName = '999';
      p.testAccount999 = true;
      p.level = maxRealm;
      p.phase = maxPhase;
      p.exp = Number(CULTIVATION_REALMS[maxRealm]?.phaseExp?.[maxPhase] || 0);
      p.gold = Math.max(99999999, Number(p.gold) || 0);
      p.baseAtk = Math.max(999, Number(p.baseAtk) || 0);
      p.baseDef = Math.max(999, Number(p.baseDef) || 0);
      p.age = 18;
      p.maxLifespan = typeof calculateMaxLifespan === 'function'
        ? getTotalMaxLifespan(p)
        : Math.max(9999, Number(p.maxLifespan) || 80);
      p.mainTitle = '混元圣人';
      p.hiddenTitle = '满级测试者';
      p.statusEffects = [];
      p.tutorial = { ...(p.tutorial || {}), skipped:true, activeStep:null, showTooltips:false };

      // 关键修复：7 个章节的合法下标是 0..6，不能再写 7。
      const storyCount = Array.isArray(STORY_CHAPTERS) ? STORY_CHAPTERS.length : 7;
      p.storyProgress = Math.max(0, storyCount - 1);
      p.storyCompleted = Array(storyCount).fill(true);

      // 全技能。旧版 player.skills 存的是技能对象，因此保持同一结构。
      if (Array.isArray(SKILLS)) p.skills = SKILLS.slice();

      // 基础资源拉满，但不写入不存在的数据结构。
      p.inventory = Array.isArray(p.inventory) ? p.inventory : [];
      p.materials = p.materials && typeof p.materials === 'object' ? p.materials : {};
      p.equipmentInventory = Array.isArray(p.equipmentInventory) ? p.equipmentInventory : [];

      try {
        Object.keys(ITEMS || {}).forEach(name => {
          // 消耗品放 3 份，装备仍由装备背包管理。
          const d = ITEMS[name];
          if (d && !['weapon','armor'].includes(d.type)) {
            p.inventory.push(name, name, name);
          }
        });
      } catch (_) {}

      try {
        Object.keys(MATERIALS || {}).forEach(name => {
          p.materials[name] = Math.max(999, Number(p.materials[name]) || 0);
        });
      } catch (_) {}

      try {
        Object.keys(EQUIPMENT_DB || {}).forEach(name => {
          if (!p.equipmentInventory.includes(name)) p.equipmentInventory.push(name);
        });
      } catch (_) {}

      p.sect = '凌霄宗';
      p.sectRank = '首席长老';
      p.sectContribution = Math.max(999999, Number(p.sectContribution) || 0);
      p.sectTotalContribution = Math.max(999999, Number(p.sectTotalContribution) || 0);
      p.sectData = {
        ...(p.sectData || {}),
        prosperity: Math.max(999999, Number(p.sectData?.prosperity) || 0),
        disciples: Array.isArray(p.sectData?.disciples) ? p.sectData.disciples : []
      };

      // 999 默认动画演武。
      try {
        localStorage.setItem('xiantu_battle_presentation_v2756','cinema');
        localStorage.setItem('xiantu_battle_speed_v2756','1');
      } catch (_) {}

      // 拉满气血和灵力必须放在境界赋值之后。
      try { p.hp = getMaxHp.call({}); } catch (_) { p.hp = Math.max(9999, Number(p.hp)||100); }
      try { p.mp = getMaxMp.call({}); } catch (_) { p.mp = Math.max(9999, Number(p.mp)||50); }

      return p;
    }

    function saveTest999V2760() {
      try {
        const saveData = {...createSaveDataV2768(),version:2761,saveSlot:'test999'};
        localStorage.setItem(TEST_SAVE_KEY_999_V2760, JSON.stringify(saveData));
        return true;
      } catch (e) {
        console.warn('999测试档保存失败:', e);
        return false;
      }
    }

    function loadTest999V2760() {
      try {
        const raw = localStorage.getItem(TEST_SAVE_KEY_999_V2760);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !data.player) return null;
        return data;
      } catch (_) {
        return null;
      }
    }

    function devToolsAllowedV286838(){
      const loc=typeof location==='undefined'?{}:location,host=String(loc.hostname||'');
      return loc.protocol==='file:'||host==='localhost'||host==='127.0.0.1'||host==='[::1]'||host.endsWith('.localhost');
    }
    function startGame() {
      const rawName = document.getElementById('playerName').value.trim();
      const name = rawName || '无名';
      try{validateSaveTextV2869({name});}catch(e){alert('道号请使用文字、数字或空格，不要包含代码符号');return;}
      const isTest999 = rawName === '999' && devToolsAllowedV286838();
      resetRuntimeState();

      if (isTest999) {
        const testSave = loadTest999V2760();
        player = testSave?.player ? normalizePlayer(testSave.player) : createDefaultPlayer();
        player = applyMaxTestPreset999V2760(player);
      } else {
        player = createDefaultPlayer();
        player.name = name;
        player.inventory = ['小还丹', '小还丹'];
        player.materials = { '灵草': 2 };
      }
      
      // 初始化成就系统
      initAchievements();
      
      // 初始化音频
      initAudio();
      
      // 初始化移动系统
      initMoveSystem();
      
      // 显示控制按钮
      document.getElementById('saveControls').style.display = 'flex';
      document.getElementById('audioControls').style.display = 'flex';
      document.getElementById('moveToggle').style.display = 'block';
      
      document.getElementById('startScreen').classList.add('hidden');
      document.getElementById('gameScreen').classList.remove('hidden');
      enableWorldMode();
      acceptTask?.('main_01',true); updateTaskTracker?.();
      
      // 启动自动保存
      startAutoSave();
      
      startAnimation();
      
      showStory(`
        <p style="color:#ffb6c9;font-weight:bold;">【序章：情断青云】</p>
        <p>青云村外的青石桥上，苏晚晴将一枚旧木牌放回你掌心。</p>
        <p>那是很多年前，你们约定以后无论走到哪里都要带着的东西。</p>
        <p>她没有看你，只低声说道：</p>
        <p style="color:#d8c6aa">“凌霄宗的接引令已经到了。我不能把自己的未来，押在一个连灵根都还没有觉醒的人身上。”</p>
        <p>你问她，是不是连一起等一等都不愿意。</p>
        <p>苏晚晴沉默很久，最终只说了四个字：</p>
        <p style="color:#ff9f9f;font-weight:bold;font-size:17px">“到此为止。”</p>
        <p>她转身离开，没有回头。</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,.12);margin:12px 0">
        <p>你在桥边站到天色渐暗，才独自走回青云村。</p>
        <p>村口，一位白发老者忽然拦住了你。他看了你一眼，又看向苏晚晴离开的方向。</p>
        <p>“少年，情之一字能断人心，也能磨人道心。你可愿看看，你自己的路究竟能走多远？”</p>
      `, [
        { text: '握紧木牌，抬头看向老者', action: 'prologue_accept', story: true }
      ]);
      
      // 首次保存
      saveGame();
    }
    
    function loadAndStart() {
      const saveData = loadGame();
      if (!saveData) {
        alert('存档无法读取，请在存档管理中导入或恢复备份。原记录未删除。');
        showSaveManagerV2768();
        return;
      }
      
      if(saveData._recoveredFromBackup)alert('主存档无法读取，已使用最近一次有效备用档恢复。');
      // 恢复玩家数据
      resetRuntimeState();
      player = normalizePlayer(saveData.player);
      
      // 恢复成就数据
      if (saveData.achievements) {
        achievementProgress = saveData.achievements.progress || achievementProgress;
        completedAchievements = new Set(saveData.achievements.completed || []);
      } else {
        initAchievements();
      }
      
      // 初始化音频
      initAudio();
      
      // 初始化移动系统
      initMoveSystem();
      
      // 显示控制按钮
      document.getElementById('saveControls').style.display = 'flex';
      document.getElementById('audioControls').style.display = 'flex';
      document.getElementById('moveToggle').style.display = 'block';
      
      document.getElementById('loadDialog').style.display = 'none';
      document.getElementById('startScreen').classList.add('hidden');
      document.getElementById('gameScreen').classList.remove('hidden');
      enableWorldMode();
      checkTaskTriggers?.(); updateTaskTracker?.();
      
      // 启动自动保存
      startAutoSave();
      
      startAnimation();
      updateStats();
      
      showStory(`
        <p style="color: #69f0ae;">📜 修行记录已恢复</p>
        <p>欢迎回来，<b>${escapeGameText(player.name)}</b>！</p>
        <p>当前境界：${getCultivationName()}</p>
        <p>记录时间：${formatSaveTime(saveData.timestamp)}</p>
        ${returnBriefHtmlV286840(saveData.timestamp)}
        ${saveData.interruptedBattleV286812?'<p>上次战斗尚未结算，已恢复到开战前；当场消耗的丹药、气血和灵力已恢复，未发放战利品。</p>':''}
      `, [
        { text: '续行仙途', action: 'village' }
      ]);
      recoverPendingBreakthroughV28683();
    }
    
    function newGame() {
      if(!prepareNewGameV2838())return;
      resetRuntimeState();
      document.getElementById('loadDialog').style.display = 'none';
      player = createDefaultPlayer();
      gameState='start';
      document.body.classList.remove('flat-world-active');
      stopNavigationV2830();FLAT_WORLD.keys={};FLAT_WORLD.target=null;
      if(FLAT_WORLD.raf){cancelAnimationFrame(FLAT_WORLD.raf);FLAT_WORLD.raf=null;}
      for(const id of ['saveControls','audioControls','moveToggle']){const el=document.getElementById(id);if(el)el.style.display='none';}
      if(autoSaveTimer){clearInterval(autoSaveTimer);autoSaveTimer=null;}
      initAchievements();
      document.getElementById('playerName').value = '';
      document.getElementById('startScreen').classList.remove('hidden');
      document.getElementById('gameScreen').classList.add('hidden');
    }

    function checkSaveOnStart() {
      if (hasCheckedSave) return;
      hasCheckedSave = true;
      // 安全启动阶段只检测存档是否存在；点击“继续修行”后才解析并迁移完整存档。
      // 这样旧版大存档与 999 满级档不会在 Safari 首屏造成瞬时内存峰值。
      let hasSave = false;
      try {
        for (let i=0; i<localStorage.length; i++) {
          if ([SAVE_KEY,SAVE_BACKUP_KEY].includes(localStorage.key(i))) { hasSave = true; break; }
        }
      } catch (_) {}
      if (hasSave) {
        const info = document.getElementById('saveInfo');
        if (info) info.innerHTML = '检测到旧日修行记录。<br>点击“继续修行”后读取，道具、境界与剧情均会保留。';
        const dialog = document.getElementById('loadDialog');
        if (dialog) dialog.style.display = 'flex';
      }
    }
    

    const _flatOriginalUpdateStats = updateStats;
    updateStats = function() {
      const result = _flatOriginalUpdateStats.apply(this, arguments);
      updateWorldHUD();
      checkTaskPassiveConditions?.(); updateTaskTracker?.();
      return result;
    };

    window.onload = function() {
      refreshProtagonistPortraits();
      checkSaveOnStart();
    };
    
    // 点击按钮时初始化音频（用户交互后才能播放音频）
    document.addEventListener('click', function initAudioOnClick() {
      initAudio();
      document.removeEventListener('click', initAudioOnClick);
    }, { once: true });
  


    // ================== 手机专用交互 / 性能配置 ==================
    const MOBILE_GAME = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    PERF_CONFIG.mobile = MOBILE_GAME;
    if (MOBILE_GAME) {
      PERF_CONFIG.lowEnd = true;
      PERF_CONFIG.ultraSmooth = true;
      PERF_CONFIG.minimapInterval = 1000 / 4;
      FLAT_WORLD.maxMonsters = Math.min(4, FLAT_WORLD.maxMonsters || 4);
      document.documentElement.classList.add('mobile-game');
    }

    // 稳定手机视口：忽略地址栏/底部栏造成的“仅高度变化”，只有真正旋转/宽度变化才更新。
    const MOBILE_STABLE_VIEWPORT = {
      width: Math.max(320, Math.round(window.innerWidth || 390)),
      height: Math.max(320, Math.round(window.innerHeight || 640)),
      portrait: (window.innerHeight || 640) >= (window.innerWidth || 390)
    };

    function applyStableMobileViewport(force = false) {
      if (!MOBILE_GAME) return false;
      const nextW = Math.max(320, Math.round(window.innerWidth || MOBILE_STABLE_VIEWPORT.width));
      const nextH = Math.max(320, Math.round(window.innerHeight || MOBILE_STABLE_VIEWPORT.height));
      const nextPortrait = nextH >= nextW;
      const widthChanged = Math.abs(nextW - MOBILE_STABLE_VIEWPORT.width) > 48;
      const orientationChanged = nextPortrait !== MOBILE_STABLE_VIEWPORT.portrait;
      if (force || widthChanged || orientationChanged) {
        MOBILE_STABLE_VIEWPORT.width = nextW;
        MOBILE_STABLE_VIEWPORT.height = nextH;
        MOBILE_STABLE_VIEWPORT.portrait = nextPortrait;
      }
      const root = document.documentElement;
      root.style.setProperty('--xiantu-mobile-vw', MOBILE_STABLE_VIEWPORT.width + 'px');
      root.style.setProperty('--xiantu-mobile-vh', MOBILE_STABLE_VIEWPORT.height + 'px');
      return force || widthChanged || orientationChanged;
    }

    if (MOBILE_GAME) applyStableMobileViewport(true);

    // 手机上不要维持640px的最低内部画布宽度，否则390px手机会无意义超采样。
    const _desktopResizeWorldCanvas = resizeWorldCanvas;
    resizeWorldCanvas = function() {
      if (!MOBILE_GAME) return _desktopResizeWorldCanvas.apply(this, arguments);
      const c = document.getElementById('worldCanvas');
      if (!c) return;
      const w = MOBILE_STABLE_VIEWPORT.width;
      const h = MOBILE_STABLE_VIEWPORT.height;

      // 地址栏收起/展开也会触发 window.resize。尺寸没真正变化时绝不能重设 canvas，
      // 否则 canvas 会被清空并重建静态地图缓存，看起来就像“全屏/窗口”来回跳。
      if (c.width === w && c.height === h && c._dpr === 1) return;

      c.width = w;
      c.height = h;
      c._dpr = 1;
      resize3DAvatar();
      // 静态地图不依赖屏幕尺寸；旋转手机只重设视口画布。
    };

    function setupMobileGameUI() {
      if (!MOBILE_GAME) return;
      document.documentElement.classList.add('mobile-game');
      document.body.classList.add('mobile-ui-ready');

      const hud = document.querySelector('.world-hud');
      const actions = document.querySelector('.world-hud-top > div:last-child');
      if (hud && actions) {
        hud.classList.add('mobile-hud-collapsed');
        if (!document.getElementById('mobileHudToggle')) {
          const btn = document.createElement('button');
          btn.id = 'mobileHudToggle';
          btn.className = 'mobile-hud-toggle';
          btn.textContent = '▾';
          btn.title = '展开/收起状态栏';
          btn.setAttribute('aria-label','展开或收起状态栏');
          btn.onclick = () => {
            const collapsed = hud.classList.toggle('mobile-hud-collapsed');
            btn.textContent = collapsed ? '▾' : '▴';
            navigator.vibrate?.(12);
          };
          hud.querySelector('.world-hud-top > div:first-child').appendChild(btn);
        }
        if (!document.getElementById('mobileMenuBtn')) {
          const btn = document.createElement('button');
          btn.id = 'mobileMenuBtn';
          btn.className = 'mobile-menu-btn';
          btn.textContent = '☰';
          btn.title = '快捷菜单';
          btn.setAttribute('aria-label','打开手机快捷菜单');
          btn.onclick = () => {
            document.getElementById('mobileQuickMenu')?.classList.toggle('show');
            navigator.vibrate?.(10);
          };
          actions.appendChild(btn);
        }
      }

      const worldPanel = document.getElementById('worldPanel');
      if (worldPanel && !document.getElementById('mobileQuickMenu')) {
        const menu = document.createElement('div');
        menu.id = 'mobileQuickMenu';
        menu.className = 'mobile-quick-menu';
        menu.innerHTML = `
          <button type="button" onclick="manualSave();document.getElementById('mobileQuickMenu').classList.remove('show')">💾 记档</button><button type="button" onclick="showSaveManagerV2768();document.getElementById('mobileQuickMenu').classList.remove('show')">📁 存档管理</button>
          <button type="button" onclick="showAchievements();document.getElementById('mobileQuickMenu').classList.remove('show')">🏆 成就录</button>
          <button type="button" id="quickMuteV286838" onclick="toggleMute()" aria-pressed="${isMuted}">${isMuted?'🔇 取消静音':'🔊 静音'}</button>
          <button type="button" onclick="toggleBGM()">🎵 音乐</button>
          <button type="button" onclick="showSectTasks();document.getElementById('mobileQuickMenu').classList.remove('show')">📜 宗门任务</button>
          <button type="button" onclick="showEquipmentPanel();document.getElementById('mobileQuickMenu').classList.remove('show')">🎒 装备</button>
          <button type="button" onclick="showHelpManual();document.getElementById('mobileQuickMenu').classList.remove('show')">📖 修行指引</button>
          <button type="button" onclick="toggleCharacterPanel();document.getElementById('mobileQuickMenu').classList.remove('show')">📋 角色</button>`;
        worldPanel.appendChild(menu);
      }

      const canvas = document.getElementById('worldCanvas');
      if (canvas) {
        canvas.style.touchAction = 'none';
        canvas.addEventListener('touchmove', e => e.preventDefault(), {passive:false});
        canvas.addEventListener('contextmenu', e => e.preventDefault());
      }

      document.querySelectorAll('.touch-pad button, #touchAction').forEach(btn => {
        btn.addEventListener('pointerdown', e => {
          try { btn.setPointerCapture?.(e.pointerId); } catch(_) {}
          navigator.vibrate?.(8);
        });
      });

      // 不监听 visualViewport.resize：手机地址栏动画每一小步都会触发它。
      // window.resize 仍可能由旧主循环监听，但 resizeWorldCanvas 已做同尺寸短路。
      let orientationTimer = 0;
      const refreshForOrientation = () => {
        clearTimeout(orientationTimer);
        orientationTimer = setTimeout(() => {
          if (applyStableMobileViewport(true)) resizeWorldCanvas();
        }, 280);
      };
      window.addEventListener('orientationchange', refreshForOrientation, {passive:true});
      if (screen.orientation?.addEventListener) {
        screen.orientation.addEventListener('change', refreshForOrientation, {passive:true});
      }

      // 点面板外不做误操作；打开弹窗时关闭快捷菜单。
      document.addEventListener('pointerdown', e => {
        const menu = document.getElementById('mobileQuickMenu');
        const menuBtn = document.getElementById('mobileMenuBtn');
        if (menu?.classList.contains('show') && !menu.contains(e.target) && !menuBtn?.contains(e.target)) {
          menu.classList.remove('show');
        }
      }, {passive:true});

      const gameScreen = document.getElementById('gameScreen');
      if (gameScreen && !gameScreen.classList.contains('hidden')) resizeWorldCanvas();
    }

    const _xiantuBaseOnload = window.onload;
    window.onload = function() {
      if (typeof _xiantuBaseOnload === 'function') _xiantuBaseOnload.apply(this, arguments);
      setupMobileGameUI();
    };


    // ====== 苏晚晴双向完整感情线 V2.0 已实装 ======


    // V27.65：切到后台时暂停 CSS 动画，回到前台再恢复，降低 iOS 内存与合成压力。
    document.addEventListener('visibilitychange', function(){
      document.body.classList.toggle('xiantu-v2762-page-hidden', document.hidden);
    }, {passive:true});

    // V27.67：后台停止地图/人物绘制，前台按需恢复，防止生成重复动画循环。
    let characterAnimationPausedV2767=false;
    function pauseVisualsV2767() {
      clearTimeout(mapIdleTimerV2865);mapIdleTimerV2865=null;
      clearCombatValuesV2818();
      if(FLAT_WORLD.raf!=null){cancelAnimationFrame(FLAT_WORLD.raf);FLAT_WORLD.raf=null;}
      if(animationFrame!=null){characterAnimationPausedV2767=true;cancelAnimationFrame(animationFrame);animationFrame=null;}
      FLAT_WORLD.keys={};
      ENEMY_IMAGE_CACHE_V2767.clear();
      releaseStaticWorldCacheV2767();
    }
    function resumeVisualsV2767() {
      if(document.hidden)return;
      clearTimeout(mapIdleTimerV2865);mapIdleTimerV2865=null;
      if(FLAT_WORLD.initialized && FLAT_WORLD.raf==null){
        FLAT_WORLD.lastTime=performance.now();
        FLAT_WORLD._lastMobileFrame=0;
        FLAT_WORLD.raf=requestAnimationFrame(flatWorldLoop);
      }
      if(characterAnimationPausedV2767){characterAnimationPausedV2767=false;startAnimation();}
    }
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)pauseVisualsV2767();else resumeVisualsV2767();
    });
    window.addEventListener('pagehide',pauseVisualsV2767);
    window.addEventListener('pageshow',resumeVisualsV2767);

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-core.js"]="28.68.50";

// Map-space ink-style elder, drawn at the existing NPC anchor.
function drawWanderingMentorV2862(ctx){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 function shape(points,fill,stroke){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}}
 function oval(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 oval(0,23,26,8,'rgba(28,45,37,.24)');
 oval(-8,21,7,3,'#333e3c');oval(9,21,7,3,'#333e3c');
 const robe=ctx.createLinearGradient(-20,-40,22,25);robe.addColorStop(0,'#879c95');robe.addColorStop(.5,'#526f69');robe.addColorStop(1,'#2d4c49');
 shape([[-11,-36],[-21,-26],[-29,-4],[-18,2],[-13,-12],[-18,19],[-7,24],[12,23],[20,18],[14,-16],[25,-3],[32,-10],[19,-31],[9,-36]],robe,'#344b46');
 shape([[-7,-34],[-2,-8],[-10,19],[1,22],[8,-9],[7,-33]],'#c0c6af','#7e9182');
 shape([[-10,-31],[2,-18],[10,-32],[5,-34],[1,-25],[-6,-34]],'#e7dfc6');
 ctx.strokeStyle='#a5b09b';ctx.lineWidth=1;for(const x of [-13,-6,8,14]){ctx.beginPath();ctx.moveTo(x,-3);ctx.quadraticCurveTo(x-3,9,x,18);ctx.stroke();}
 shape([[-15,-8],[15,-8],[15,-3],[-15,-3]],'#423e31');
 oval(1,-6,3,3,'#d1b374');
 // Hair, topknot and warm face sit above the broad collar.
 oval(0,-45,12,14,'#d6d8c7');oval(0,-45,8,11,'#ceb799');
 shape([[-10,-53],[-7,-59],[4,-59],[11,-52],[8,-49],[2,-54],[-5,-50]],'#e2e2d2','#7a8980');
 oval(0,-61,5,5,'#aebbad');ctx.strokeStyle='#514c39';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-60);ctx.lineTo(10,-60);ctx.stroke();
 ctx.strokeStyle='#efe7d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-46);ctx.lineTo(-2,-47);ctx.moveTo(2,-47);ctx.lineTo(7,-46);ctx.stroke();
 oval(-4,-44,1,1,'#343932');oval(4,-44,1,1,'#343932');
 shape([[-7,-38],[-3,-40],[0,-38],[4,-40],[7,-37],[5,-27],[0,-19],[-4,-29]],'#e0dfcb','#9da996');
 ctx.strokeStyle='#b8c0ad';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-2,-35);ctx.lineTo(0,-24);ctx.moveTo(3,-35);ctx.lineTo(1,-25);ctx.stroke();
 // Travelling gourd, bamboo whisk handle and pale horsehair.
 oval(-18,1,4,5,'#b79459');oval(-18,8,6,7,'#9b733e');ctx.strokeStyle='#4c503b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,-5);ctx.lineTo(-18,-1);ctx.stroke();
 ctx.strokeStyle='#79644b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(22,13);ctx.lineTo(29,-39);ctx.stroke();
 oval(24,-12,4,3,'#cfb595');
 shape([[27,-40],[31,-40],[38,-29],[38,-9],[33,-15],[30,-5],[26,-14],[28,-27]],'#dcdcca','#939f8a');
 ctx.strokeStyle='#aeb8a2';ctx.lineWidth=.7;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(29+i,-36);ctx.quadraticCurveTo(34+i,-21,29+i*2,-12);ctx.stroke();}
 ctx.restore();
}

// Shared low-cost map silhouettes, individual clothing and props.
function drawMapNpcV2863(ctx,o){
 if(o.action==='npc_mentor'||o.id==='mentor_npc'){drawWanderingMentorV2862(ctx);return;}
 const role=o.action==='yewuji_v2810'?'rival':o.action==='npc_beast'?'beast':o.action==='npc_trader'?'trader':o.action==='npc_elder'?'elder':'traveller';
 const palette={beast:['#85b798','#416f64','#d1d6a8'],trader:['#b59c71','#705643','#e0c28c'],elder:['#93b4c3','#3f6279','#deded0'],rival:['#665568','#292638','#bd9a59'],traveller:['#94a797','#4a6459','#dbd1af']}[role];
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 if(role==='beast'){ctx.translate(0,5);ctx.scale(.83,.83);}
 function poly(a,fill,stroke='#34433d'){ctx.beginPath();ctx.moveTo(...a[0]);a.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();}
 function ellipse(x,y,w,h,col){ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();}
 function line(a,b,col,width=2){ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
 ellipse(0,23,25,7,'rgba(22,37,31,.25)');
 if(role==='trader'){
  poly([[-27,-35],[-9,-39],[-7,8],[-28,5]],'#806a4c');
  for(let y=-30;y<5;y+=8)line([-26,y],[-9,y-2],'#c0aa7c',1);
  line([-29,-37],[-28,10],'#4b4635',3);
 }
 if(role==='rival')poly([[-16,-34],[-23,-10],[-29,21],[-17,15],[-7,25],[19,21],[27,14],[18,-30]],'#34303f','#776447');
 ellipse(-8,21,7,3,'#313939');ellipse(9,21,7,3,'#313939');
 const g=ctx.createLinearGradient(-20,-30,20,25);g.addColorStop(0,palette[0]);g.addColorStop(1,palette[1]);
 poly([[-10,-34],[-20,-27],[-29,-7],[-21,0],[-12,-11],[-17,18],[-5,23],[17,20],[13,-13],[22,-3],[29,-9],[18,-29],[8,-34]],g);
 poly([[-6,-32],[0,-20],[7,-32],[5,-33],[0,-26]],palette[2]);
 for(const x of [-12,-5,7,12])line([x,-3],[x-2,17],palette[0],1);
 poly([[-14,-8],[14,-8],[14,-3],[-14,-3]],'#4c4639');ellipse(0,-5,3,3,palette[2]);
 const hair=role==='elder'?'#b9c2bd':'#293833';
 ellipse(0,-45,11,14,hair);ellipse(0,-44,8,10,'#d1b692');
 poly([[-10,-50],[-6,-57],[6,-57],[11,-50],[6,-48],[0,-53],[-6,-48]],hair);
 ellipse(-3,-44,1,1,'#343930');ellipse(4,-44,1,1,'#343930');line([-2,-39],[3,-39],'#95745d',1);
 if(role==='beast'){
  ellipse(-10,-54,5,5,hair);ellipse(10,-54,5,5,hair);
  line([-13,-54],[-7,-53],'#c8dcb1',2);line([8,-54],[13,-54],'#c8dcb1',2);
  line([-18,-15],[22,-17],'#ceb883',4);ellipse(-19,-14,4,3,'#d1b692');ellipse(23,-16,4,3,'#d1b692');
  for(let x=-10;x<15;x+=7)ellipse(x,-17,1,1,'#5c6745');
  ellipse(28,16,9,6,'#d4d4b5');ellipse(33,10,5,5,'#e2dfc5');
  poly([[30,7],[29,0],[34,6]],'#c9caae');ellipse(35,10,1,1,'#34463b');
 }else if(role==='elder'){
  poly([[-7,-37],[7,-37],[4,-28],[0,-25],[-5,-31]],'#d0d6c8');
  poly([[-8,-55],[-7,-62],[7,-62],[9,-55]],'#405c70');line([-5,-59],[5,-59],'#c9bb85');
  poly([[13,-24],[27,-22],[26,-2],[13,-4]],'#d7ceac');line([18,-20],[18,-7],'#7b816c',1);line([22,-18],[22,-9],'#7b816c',1);ellipse(13,-10,4,3,'#d1b692');
 }else if(role==='trader'){
  poly([[-17,-50],[0,-63],[18,-50],[0,-47]],'#a99365');line([-16,-50],[18,-50],'#4b4934',2);
  poly([[-5,-37],[6,-37],[2,-32]],'#414338');ellipse(20,4,8,11,'#957347');line([15,-5],[24,-5],'#d3bb80',2);ellipse(21,-8,4,3,'#d1b692');
 }else if(role==='rival'){
  poly([[-8,-55],[-6,-63],[0,-59],[6,-63],[9,-55]],'#a58752');
  line([-20,-30],[-26,17],'#b29255',3);line([-26,-21],[-14,-19],'#ddc084',3);
  poly([[14,-30],[22,-21],[12,-18]],'#9c824e');line([2,-1],[7,16],'#bd9a59',1);
 }else {ellipse(0,-59,5,5,hair);line([23,-29],[25,20],'#897654',3);}
 ctx.restore();
}

function canMapNpcActV2864(){return !!player&&gameState==='exploring'&&!player.breakthrough?.isAnimating&&!COMBAT_FINISH_V2764.settling;}
function mapNpcStatusV2864(o){
 const id=String(o.action||'').replace(/^npc_/,''),npc=MAP_NPCS[id];if(!npc)return '';
 const state=player.mapNpc,q=npc.quest,quest=state?.quests?.[id];
 if(quest?.status==='accepted'&&q&&Number(player.materials?.[q.item]||0)>=q.count)return '可交付';
 if(state?.rewards?.[id]!==getMapNpcDayKey())return '可领取';
 if(!quest||quest.status==='available')return '有委托';
 return '';
}
function drawMapNpcStatusV2864(ctx,o){
 const text=mapNpcStatusV2864(o);if(!text)return;
 ctx.save();ctx.fillStyle=text==='可交付'?'#315f4c':'#655437';ctx.fillRect(-26,-86,52,19);
 ctx.strokeStyle='#c8ba87';ctx.lineWidth=1;ctx.strokeRect(-26,-86,52,19);
 ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4ead0';ctx.fillText(text,0,-76);ctx.restore();
}

// Sect overview uses existing progression and reward handlers.
function sectCanManageV2866(){return !!player?.sect&&player.sect!=='散修'&&!isFactionDestroyed(player.sect)&&gameState==='exploring'&&!COMBAT_FINISH_V2764.settling&&!player.breakthrough?.isAnimating;}
function sectPromotionViewV2866(){
 const total=Math.max(0,player.sectTotalContribution||0),rank=getCurrentRankInfo(),index=SECT_RANKS.indexOf(rank),next=SECT_RANKS[index+1];
 if(!next)return '<p>已执掌宗门，可安排弟子与山门军务。</p>';
 const count=normalizePromotionV2768(player.sectPromotion).tasksCompleted;
 return `<h4>下一职位 · ${next.name}</h4><progress max="${next.contributionRequired}" value="${Math.min(total,next.contributionRequired)}"></progress><p>累计贡献 ${total} / ${next.contributionRequired}${total<next.contributionRequired?` · 还差 ${next.contributionRequired-total}`:' · 已达标'}</p>${next.name==='宗主'?`<p>${player.level>=4?'✓':'○'} 元婴境　${count>=5?'✓':'○'} 完成委托 ${count} / 5</p><button class="choice-btn" onclick="showSectPromotionV2768()">查看传承考核</button>`:'<p>贡献达标自动晋升；商店消费不会降低累计贡献。</p>'}`;
}
function showSectOverviewV2866(notice=''){
 if(!sectCanManageV2866())return;
 const esc=discipleEscV2815,r=discipleRosterV2815(),ready=r.members.filter(discipleReadyV2821),idle=r.members.filter(d=>!d.job&&!warDiscipleBusyV286841(d.id)),busy=r.members.filter(d=>d.job&&!discipleReadyV2821(d));
 const active=player.sectTasks.filter(t=>!t.completed),rank=getCurrentRankInfo(),allowed=discipleAllowedV2815();
 let html=`<section class="sect-board-v2866"><header><small>${esc(getGameDateLabel())}</small><h3>${esc(player.sect)} · 宗门总览</h3><button class="choice-btn" onclick="showSectTodoV2868()">待办直达 · ${sectTodoReadV2868().total}</button><p>${rank.icon} ${rank.name}</p></header>${notice?`<p role="status">${esc(notice)}</p>`:''}<div class="sect-stats-v2866"><div>可用贡献<b>${player.sectContribution||0}</b></div><div>累计贡献<b>${player.sectTotalContribution||0}</b></div><div>空闲弟子<b>${idle.length}</b></div><div>待领成果<b>${ready.length}</b></div></div><article>${sectPromotionViewV2866()}</article><article><h4>我的委托 · ${active.length}</h4>`;
 for(const t of active){const progress=getSectTaskProgressInfo(t),idx=player.sectTasks.indexOf(t);html+=`<p>${esc(t.template.name)} · ${progress.ready?'可以交付':'进行中'}</p><button class="choice-btn" onclick="${progress.ready&&t.template.type!=='combat'?`updateSectTaskProgress(${idx})`:'showSectTasks()'}">${progress.ready&&t.template.type!=='combat'?'交付委托':'查看目标与去向'}</button>`;}
 if(!active.length)html+='<p>暂无进行中的委托</p><button class="choice-btn" onclick="showSectTasks()">领取宗门委托</button>';
 html+=`</article><article><h4>弟子事务 · ${r.members.length}/12</h4><p>途中来信 ${r.members.filter(discipleEventReadyV2867).length} 封</p><p>进行中 ${busy.length}${busy.length?` · 最近还需 ${Math.min(...busy.map(d=>Math.max(0,d.job.end-discipleDayV2815())))} 个游戏日`:''}</p>${allowed?'':'<p>招募、培养、派遣与领取需长老职位。</p>'}<div class="sect-actions-v2866"><button class="choice-btn" onclick="claimAllDisciplesV2821()" ${!allowed||!ready.length?'disabled':''}>领取成果 · ${ready.length}</button><button class="choice-btn" onclick="showDiscipleBatchV2866()" ${!allowed||!idle.length?'disabled':''}>批量派遣 · ${idle.length}</button><button class="choice-btn" onclick="showDisciplesV2815()">弟子名册与招募</button></div></article><article><h4>山门军务</h4><p>${esc(getWarLevelInfo().name)}${player.warState?.incomingV2839?' · 山门求援':''}</p><button class="choice-btn" onclick="showSectHall()">大殿 · 军务与秘境</button></article></section>`;
 showStory(html,[{text:'返回宗门',action:'sect'},{text:'返回地图',action:'return_to_map'}]);
}
let discipleBatchV2866=null,discipleBatchSerialV2866=0;
function discipleBatchSignatureV2866(){return JSON.stringify([player.sect,discipleDayV2815(),getCurrentRankInfo().name,discipleRosterV2815().members,player.warState?.campaignV2775?.officersV286841]);}
function showDiscipleBatchV2866(tier=0,notice=''){
 if(!discipleAllowedV2815()||!Number.isInteger(tier)||tier<0||tier>2)return;
 const entries=discipleRosterV2815().members.filter(d=>!d.job&&!warDiscipleBusyV286841(d.id)).map(d=>{const type=Number.isInteger(d.specialty)&&d.specialty>=0&&d.specialty<=2?d.specialty:0;let target=tier;while(target>0&&!disciplePlanV2824(d,type,target).allowed)target--;return {id:d.id,name:d.name,plan:disciplePlanV2824(d,type,target)};});
 const token=++discipleBatchSerialV2866;discipleBatchV2866={token,owner:player,signature:discipleBatchSignatureV2866(),entries};
 const esc=discipleEscV2815;let html=`<section class="sect-board-v2866"><h3>派遣预览 · ${entries.length} 位空闲弟子</h3><p>按专长安排；等级不足会选用较低难度。已在执行事务或随军的弟子不参与。</p>${notice?`<p role="status">${esc(notice)}</p>`:''}<div class="sect-actions-v2866">${DISCIPLE_TIERS_V2824.map((t,i)=>`<button class="choice-btn" onclick="showDiscipleBatchV2866(${i})" aria-pressed="${i===tier}">${t.name}${i===tier?' ✓':''}</button>`).join('')}</div>`;
 for(const e of entries)html+=`<article><b>${esc(e.name)}</b><p>${esc(e.plan.name)} · ${e.plan.days} 个游戏日</p><p>${e.plan.gold} 灵石 · ${esc(e.plan.material)} ×${e.plan.count}</p></article>`;
 html+=`<p>${entries.length?'无派遣费用，成果到期后领取。':'没有空闲弟子。'}</p><button class="choice-btn" id="discipleBatchConfirmV2866" data-token="${token}" onclick="confirmDiscipleBatchV2866(${token})" ${entries.length?'':'disabled'}>确认派遣 ${entries.length} 位</button><button class="choice-btn" onclick="cancelDiscipleBatchV2866()">取消并返回</button></section>`;showStory(html,[]);
}
function cancelDiscipleBatchV2866(){discipleBatchV2866=null;showSectOverviewV2866();}
function confirmDiscipleBatchV2866(token){
 const batch=discipleBatchV2866;
 if(!discipleAllowedV2815()||!batch||batch.token!==token||batch.owner!==player||document.getElementById('storyPanel')?.classList.contains('hidden')||document.getElementById('discipleBatchConfirmV2866')?.dataset.token!==String(token))return;
 if(batch.signature!==discipleBatchSignatureV2866()){discipleBatchV2866=null;return showDiscipleBatchV2866(0,'弟子或日期已变化，请重新确认。');}
 discipleBatchV2866=null;
 const roster=discipleRosterV2815();
 if(batch.entries.some(e=>{const d=roster.members.find(x=>x.id===e.id);return !d||d.job||warDiscipleBusyV286841(e.id)}))return showDiscipleBatchV2866(0,'弟子状态已变化，请重新确认。');
 for(const e of batch.entries){const d=roster.members.find(x=>x.id===e.id);d.job=discipleNewJobV2867(d,e.plan);d.lastMissionV2824={type:e.plan.missionType,tier:e.plan.tier};}
 autoSave();showSectOverviewV2866(`已派遣 ${batch.entries.length} 位弟子。`);
}

function discipleTraitsV2867(d){let h=0;for(const c of `${player.sect}|${d.name}|${d.batch??d.id}`)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;const o=d.traitsV2867||{};return {aptitude:[0,1,2].includes(o.aptitude)?o.aptitude:h%3,personality:[0,1,2].includes(o.personality)?o.personality:Math.floor(h/3)%3,loyalty:Number.isFinite(o.loyalty)?Math.max(0,Math.min(100,o.loyalty)):60};}
function discipleTrainDaysV2867(d){return discipleTraitsV2867(d).aptitude===2?2:3;}
function discipleTraitsHtmlV2867(d){const t=discipleTraitsV2867(d);return `<p>${['勤修','颖悟','天资'][t.aptitude]} · ${['谨慎','果敢','仁厚'][t.personality]} · 忠诚 ${t.loyalty}</p><small>培养${discipleTrainDaysV2867(d)}天 · 资质灵石加成${t.aptitude*5}%${t.personality===0?' · 行程多1天':t.personality===1?' · 灵石额外5%':' · 救援忠诚额外+2'}</small>`;}
function discipleNewJobV2867(d,p){d.traitsV2867=discipleTraitsV2867(d);d.missionSeqV2867=(d.missionSeqV2867||0)+1;const start=discipleDayV2815();return {...p,end:start+p.days,eventV2867:{id:d.missionSeqV2867,at:start+Math.max(1,Math.floor(p.days/2)),kind:(d.id+d.missionSeqV2867)%3,resolved:false}};}
function discipleEventReadyV2867(d){const e=d.job?.eventV2867;return !!e&&!e.resolved&&discipleDayV2815()>=e.at&&discipleDayV2815()<d.job.end;}
function discipleEventButtonV2867(d){return discipleEventReadyV2867(d)?`<button class="choice-btn" onclick="showDiscipleEventV2867(${d.id})">途中来信 · 待处理</button>`:'';}
let discipleEventContextV2867=null;
function showDiscipleEventV2867(id){if(!discipleAllowedV2815())return;const d=discipleRosterV2815().members.find(d=>d.id===id);if(!d||!discipleEventReadyV2867(d))return;const e=d.job.eventV2867;discipleEventContextV2867={owner:player,sect:player.sect,event:e};const texts=['山道旁传来呼救，同门被困在坍塌的药棚下。队伍可以停下救援，也可以沿原路继续。','峡谷雾散，石壁露出一处旧修士的洞窟。探查需要绕路，原定行程也会延长。','前方出现伏击痕迹。弟子已找到安全小路，也可以就此撤回，先保住一部分收获。'];const labels=['救援同门 · 延后1天，忠诚+8（仁厚+10）','探索遗迹 · 延后2天，灵石+25%，忠诚+3','提前撤回 · 即刻完成，灵石减半、材料归零、忠诚−3'];showStory(`<section class="sect-board-v2866"><h3 id="discipleEventTitleV2867">${discipleEscV2815(d.name)} · 途中来信</h3><p>${texts[e.kind]}</p><p>尚需 ${d.job.end-discipleDayV2815()} 个游戏日 · ${discipleEscV2815(discipleRewardTextV2821(d.job))}</p><button class="choice-btn" onclick="resolveDiscipleEventV2867(${id},${e.id},0)">稳妥前行 · 时间奖励不变</button><button class="choice-btn" onclick="resolveDiscipleEventV2867(${id},${e.id},1)">${labels[e.kind]}</button><button class="choice-btn" onclick="showDisciplesV2815()">稍后处理</button><p>未处理来信仍按原计划完成。</p></section>`,[]);}
function resolveDiscipleEventV2867(id,eventId,choice){if(!discipleAllowedV2815()||![0,1].includes(choice))return;const d=discipleRosterV2815().members.find(d=>d.id===id);if(!d||!discipleEventReadyV2867(d)||d.job.eventV2867.id!==eventId)return;const j=d.job,e=j.eventV2867,t=discipleTraitsV2867(d),ctx=discipleEventContextV2867;if(!ctx||ctx.owner!==player||ctx.sect!==player.sect||ctx.event!==e||!document.getElementById('discipleEventTitleV2867')||document.getElementById('storyPanel')?.classList.contains('hidden'))return;discipleEventContextV2867=null;e.resolved=true;if(choice===1){if(e.kind===0){j.end++;t.loyalty+=t.personality===2?10:8;}else if(e.kind===1){j.end+=2;j.gold=Math.floor(j.gold*1.25);t.loyalty+=3;}else{j.end=discipleDayV2815();j.gold=Math.floor(j.gold*.5);j.count=0;j.withdrawnV2867=true;t.loyalty-=3;}}d.traitsV2867={...t,loyalty:Math.max(0,Math.min(100,t.loyalty))};lifeEventV2868(d,e,choice);autoSave();showDisciplesV2815('指令已传回，本次来信处理完毕。');}
const MINI_ROUTES_V2867=[{name:'稳妥 · 外围药径',reward:1,hp:1,atk:1},{name:'遗迹 · 古修洞天',reward:1.15,hp:1.2,atk:1.1},{name:'险境 · 断剑深谷',reward:1.5,hp:1.6,atk:1.25}];
function miniRouteV2867(c){return MINI_ROUTES_V2867[c?.routeV2867]||MINI_ROUTES_V2867[0];}
function showMiniRouteV2867(c){if(!sectCanManageV2866())return;showStory(`<section class="sect-board-v2866"><h3>秘境岔路</h3><p>穿过山门后的云雾，三条小径通向不同深处。选定后，本次路线不会变化。</p>${MINI_ROUTES_V2867.map((r,i)=>`<article><h4>${r.name}</h4><p>取宝灵石/修为×${r.reward}；守关气血×${r.hp}，攻击×${r.atk}。</p>${i===1?'<p>完成首层采集额外积累80悟道修为。</p>':''}<button class="choice-btn" onclick="selectMiniRouteV2867(${c.id},${i})">选择此路</button></article>`).join('')}<p>途中可撤离，带回已采材料与悟道修为；守关战败失去未结算收获，并扣身上20%灵石。</p></section>`,[{text:'暂离 · 返回宗门',action:'sect_hall'}]);}
function selectMiniRouteV2867(id,route){if(!sectCanManageV2866()||!Number.isInteger(route)||!MINI_ROUTES_V2867[route])return;const c=miniRunV2778();if(!c||c.id!==id||c.step!==0||c.routeV2867!==null)return;if(miniWeaveV286840(c)){if(commitMiniWeaveV286840(()=>{c.routeV2867=route}))showMiniRealmV2778();}else{c.routeV2867=route;autoSave();showMiniRealmV2778();}}

// V28.68.29: bounded elemental openings, equipment/loadout synergies and timed expeditions.
const tacticsV286821=new WeakMap();
function weaknessV286821(enemy){
 const key=typeof scrollMonsterKeyV2853==='function'?scrollMonsterKeyV2853(enemy?.name):null;
 return ({treant:'fire',spider:'fire','frost-wolf':'fire',turtle:'thunder',serpent:'thunder',golem:'sword',phoenix:'ice'})[key]||null;
}
function weaknessTextV286821(enemy){const el=weaknessV286821(enemy);return el?'弱点：'+SKILL_ELEMENT_META_V212[el].label+'（命中护甲降低25%，元素状态破甲至多50%）':'无已知元素弱点';}
function buildFlagsV286821(){
 const l=typeof ensureSkillLoadoutV212==='function'?ensureSkillLoadoutV212():{};
 const skills=(player.skills||[]).filter(s=>Object.values(l).some(v=>v.includes(s.name)));
 const sword=weaponFamilyV2790()==='sword'||/剑/.test(player.equipment?.weapon||'');
 return {sword:sword&&(l.sword?.length||0)>=2,thunder:(gearModsV2790().spellCrit||0)>0&&(l.thunder?.length||0)>=2,
 guard:!!getEquipData(player.equipment?.robe||player.equipment?.armor)&&skills.some(s=>s.heal)&&skills.some(s=>s.guardRatio||['iceArmor','fireShield'].includes(s.effect))};
}
function setupTacticsV286821(){tacticsV286821.set(currentEnemy,{owner:player,marks:0,opened:false,builds:buildFlagsV286821()});}
function hitTacticsV286821(skill,damage){
 const e=currentEnemy,s=tacticsV286821.get(e);if(!s||s.owner!==player||damage<=0||e.hp<=0)return;
 if(skill?.element===weaknessV286821(e)&&!s.opened){s.opened=true;
  if(canFleeV286818()&&!e._isElite){skipEnemyTurn=true;e._skipReason='弱点破绽';addCombatLog('击中弱点：本战首次破绽，敌人硬直一次。','pet');}
  else addCombatLog('击中弱点：破甲生效，强敌免疫破绽硬直。','pet');
 }
 if(s.builds.sword&&skill?.element==='sword'){
  s.marks=Math.min(3,s.marks+1);addCombatLog(`剑气印记 ${s.marks}/3；满层后普攻引爆。`,'pet');
 }else if(s.builds.sword&&!skill&&s.marks>=3){
  s.marks=0;const extra=Math.max(1,Math.floor(getAtk()*.8));e.hp=Math.max(0,e.hp-extra);
  showDamageNumber(extra,'enemy',false,false,false,false,'剑气引爆');addCombatLog(`剑气引爆：追加${extra}点单体贯穿伤害。`,'damage');
 }
}
function defendTacticsV286821(damage){
 const s=tacticsV286821.get(currentEnemy);if(!s||s.owner!==player||damage<=0)return damage;
 if(s.builds.thunder&&player._thunderArmorTurns>0){const before=player.mp;player.mp=Math.min(getMaxMp(),player.mp+Math.max(1,Math.floor(5*getRegionMpRecoveryMultiplier())));addCombatLog(`五雷回流：雷甲承击，回复${player.mp-before}灵力。`,'heal');}
 const g=elementGuardsV286818.get(currentEnemy);
 if(s.builds.guard&&(guardsV2785.get(currentEnemy)?.owner===player||(g?.owner===player&&g.pool>0&&g.turns>0))){
  const after=Math.floor(damage*.9);addCombatLog(`不动护体：护盾期间额外减免${damage-after}点伤害。`,'heal');return after;
 }return damage;
}
function buildGuideV286821(){const b=buildFlagsV286821();return `<h3>流派羁绊</h3><p>开战时锁定本场羁绊；换装与招式配置于下场生效。</p><p>${b.sword?'✓':'○'} 纯阳剑意：装备剑类武器、携带至少2招兵刃。剑技命中叠印记，上限3层；满层普攻追加80%攻击力单体贯穿伤害。</p><p>${b.thunder?'✓':'○'} 五雷回流：装备含术法暴击词条、携带至少2招雷法。雷甲期间承受攻击回复5灵力，受区域恢复倍率及上限影响。</p><p>${b.guard?'✓':'○'} 不动护体：穿戴护甲、携带治疗及护体招式。护体/元素盾期间额外减伤10%，不提供无限反伤。</p>`;}
const TRIP_ROUTES_V286821=[{key:'wolf',name:'狼谷旧道',gold:1},{key:'bandit',name:'山道巡行',gold:2},{key:'ghost',name:'幽林巡行',gold:10}];
function tripStateV286821(){
 const raw=player.expeditionV286821||{},wins={};
 for(const r of TRIP_ROUTES_V286821){const n=raw.wins?.[r.key];if(Number.isInteger(n)&&n>=0&&n<CULTIVATION_REALMS.length)wins[r.key]=n;}
 const t=raw.active;const active=t&&TRIP_ROUTES_V286821.some(r=>r.key===t.key)&&Number.isSafeInteger(t.started)&&t.started>=0&&Number.isInteger(t.level)&&t.level>=0&&t.level<CULTIVATION_REALMS.length?{key:t.key,started:t.started,level:t.level}:null;
 return {wins,active};
}
function recordTripWinV286821(enemy){
 if(!canFleeV286818()||enemy._isElite||enemy._firstJourneyV28687)return;
 const key=scrollMonsterKeyV2853(enemy.name);if(!TRIP_ROUTES_V286821.some(r=>r.key===key))return;
 const n=Number(enemy._realmLevel);if(!Number.isInteger(n)||n<0||n>=CULTIVATION_REALMS.length)return;
 const s=tripStateV286821();s.wins[key]=Math.min(s.wins[key]??n,n);player.expeditionV286821=s;
}
function tripYieldV286821(now=Date.now()){
 const t=tripStateV286821().active,r=TRIP_ROUTES_V286821.find(r=>r.key===t?.key);
 if(!r)return {units:0,gold:0,herbs:0};
 const units=Math.min(48,Math.max(0,Math.floor((now-t.started)/600000)));
 return {units,gold:units*r.gold,herbs:Math.floor(units/6)};
}
function commitTripV286821(change){
 if(gameState!=='exploring')return false;
 const old={state:player.expeditionV286821,gold:player.gold,materials:player.materials};
 change();if(saveGame())return true;
 player.expeditionV286821=old.state;player.gold=old.gold;player.materials=old.materials;
 showFloatingText('保存失败，游历操作未生效，可重试','#ff8a80');return false;
}
function startTripV286821(index){
 if(gameState!=='exploring')return false;
 const r=TRIP_ROUTES_V286821[index],s=tripStateV286821();
 if(!r||s.active||!Number.isInteger(s.wins[r.key])||player.level<s.wins[r.key]+1)return false;
 const ok=commitTripV286821(()=>{player.expeditionV286821={wins:s.wins,active:{key:r.key,started:Date.now(),level:s.wins[r.key]}};});
 if(ok)showTripV286821();return ok;
}
function claimTripV286821(){
 const s=tripStateV286821(),y=tripYieldV286821();if(!s.active||!y.units)return false;
 const ok=commitTripV286821(()=>{player.expeditionV286821={wins:s.wins,active:null};player.gold+=y.gold;player.materials={...player.materials,'灵草':(Number(player.materials?.['灵草'])||0)+y.herbs};});
 if(ok){showFloatingText(`游历归来：灵石+${y.gold}，灵草+${y.herbs}`);updateStats();showTripV286821();}return ok;
}
function showTripV286821(){
 if(gameState!=='exploring')return;
 const s=tripStateV286821(),y=tripYieldV286821(),r=TRIP_ROUTES_V286821.find(r=>r.key===s.active?.key);
 let html='<h3>游历派遣</h3><p>派遣后可离线，也可继续修行。按现实时间每10分钟结算一段，上限8小时；提前领取结束本趟，未满10分钟不结算。不消耗灵石，不掉落首领或突破材料。</p>';
 if(r)html+=`<p>${r.name} · 已积累${y.units*10}分钟 / 480分钟，灵石${y.gold}、灵草${y.herbs}。${Date.now()<s.active.started?'设备时间早于出发时间，暂不累计收益。':''}</p><button class="choice-btn" onclick="claimTripV286821()" ${y.units?'':'disabled'}>领取并结束本趟</button><button class="choice-btn" onclick="showTripV286821()">刷新游历进度</button>`;
 else html+=TRIP_ROUTES_V286821.map((r,i)=>{const n=s.wins[r.key],ok=Number.isInteger(n)&&player.level>=n+1;return `<p>${r.name}：每10分钟${r.gold}灵石，每小时1灵草。${n===undefined?'需先击败该类普通怪':ok?'可派遣':'需高于已击败敌人至少一个大境界'}</p><button class="choice-btn" onclick="startTripV286821(${i})" ${ok?'':'disabled'}>派遣 · ${r.name}</button>`;}).join('');
 showStory(html+'<button class="choice-btn" onclick="showReturnBriefV286840()">归来简报 · 宗门与洞府</button>'+buildGuideV286821(),[{text:'返回洞府',action:'home'}]);
}
