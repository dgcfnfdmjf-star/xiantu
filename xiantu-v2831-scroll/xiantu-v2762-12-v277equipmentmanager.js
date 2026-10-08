// ===== V27.7 装备管理：锁定 / 品质筛选 / 安全分解 / 战力显示 =====
let equipmentBagQualityFilter='ALL';
let equipmentDismantleQuality='GOOD';

function ensureEquipmentManagerState(){
  if(!player)return;
  if(!Array.isArray(player.equipmentLocks))player.equipmentLocks=[];
  player.equipmentLocks=[...new Set(player.equipmentLocks.filter(n=>typeof n==='string'&&EQUIPMENT_DB[n]))];
}
function isEquipmentLocked(name){ensureEquipmentManagerState();return !!name&&player.equipmentLocks.includes(name);}
function isEquipmentSetPiece(name){return !!getEquipData(name)?.familyV2790||Object.values(EQUIPMENT_SET_BONUSES||{}).some(s=>Array.isArray(s.items)&&s.items.includes(name));}
function getEquipmentSetNames(name){return Object.entries(EQUIPMENT_SET_BONUSES||{}).filter(([,s])=>s.items?.includes(name)||s.familyV2790&&s.familyV2790===getEquipData(name)?.familyV2790).map(([n])=>n);}
function toggleEquipmentLock(name){
  ensureEquipmentManagerState();if(!name||!EQUIPMENT_DB[name])return false;
  const i=player.equipmentLocks.indexOf(name);
  if(i>=0){player.equipmentLocks.splice(i,1);showFloatingText?.(`🔓 已解除【${name}】锁定`,'#aaa');}
  else{player.equipmentLocks.push(name);showFloatingText?.(`🔒 已锁定【${name}】`,'#ffd76a');}
  autoSave?.();return i<0;
}
function toggleEquipmentLockEncoded(encoded){const name=decodeURIComponent(encoded);toggleEquipmentLock(name);setTimeout(showEquipmentInventory,30);}
function toggleEquippedLockEncoded(encoded){const name=decodeURIComponent(encoded);toggleEquipmentLock(name);setTimeout(showEquipmentPanel,30);}
function equipItemFromEncoded(encoded){return equipItemFromInventory(decodeURIComponent(encoded));}

function getEquippedPower(){return Math.max(0,calculateEquipmentLoadoutScore(player.equipment||{}));}
function getItemPowerDisplay(name){const s=getEquipItemScore(name);return Number.isFinite(s)?Math.max(0,Math.round(s)):0;}

// 锁定装备：一键换装时，已穿戴锁定件固定在原槽；背包锁定件不参与自动换装。
function getAutoEquipFixedLoadout(){
  ensureEquipmentManagerState();const out=createEmptyEquipmentSlots();
  for(const slot of Object.keys(EQUIPMENT_SLOTS)){const name=player.equipment?.[slot];if(name&&isEquipmentLocked(name))out[slot]=name;}
  return out;
}
function getAutoEquipAvailableCounts(){
  ensureEquipmentManagerState();const counts={};
  const add=name=>{if(name&&!isEquipmentLocked(name))counts[name]=(counts[name]||0)+1;};
  for(const name of (player.equipmentInventory||[]))add(name);
  for(const name of Object.values(player.equipment||{}))add(name);
  return counts;
}
function buildAutoEquipLoadoutForForcedSetsV277(forcedSets=[]){
  const counts=getAutoEquipAvailableCounts(),loadout=getAutoEquipFixedLoadout();
  const alreadyHas=name=>Object.values(loadout).includes(name);
  const take=(name,slot)=>{
    if(!counts[name]||!isEquipSlotUnlocked(slot)||loadout[slot])return false;
    const d=getEquipData(name);if(!d||!canEquipItem(name).ok||!getAllowedSlotsForEquip(d).includes(slot))return false;
    loadout[slot]=name;counts[name]--;return true;
  };
  for(const setName of forcedSets){
    const set=EQUIPMENT_SET_BONUSES[setName];if(!set)return null;
    const wanted=set.familyV2790?Array.from({length:set.items.length},(_,i)=>Object.keys(counts).filter(n=>getEquipData(n)?.familyV2790===set.familyV2790&&getEquipData(n)?.pieceV2790===i&&canEquipItem(n).ok).sort((a,b)=>getEquipItemScore(b)-getEquipItemScore(a))[0]).filter(Boolean):set.items;
    for(const name of wanted){
      if(alreadyHas(name))continue;
      const d=getEquipData(name);if(!d||!canEquipItem(name).ok||!counts[name])continue;
      const slot=getAllowedSlotsForEquip(d).find(s=>isEquipSlotUnlocked(s)&&!loadout[s]);
      if(!slot)continue;take(name,slot);
    }
  }
  const chooseBestForSlot=slot=>{
    if(loadout[slot]||!isEquipSlotUnlocked(slot))return;
    let best=null,bestScore=-Infinity;
    for(const [name,count] of Object.entries(counts)){
      if(count<=0)continue;const d=getEquipData(name);
      if(!d||!canEquipItem(name).ok||!getAllowedSlotsForEquip(d).includes(slot))continue;
      const sc=getEquipItemScore(name);if(sc>bestScore+.001){best=name;bestScore=sc;}
    }
    if(best)take(best,slot);
  };
  for(const slot of Object.keys(EQUIPMENT_SLOTS))chooseBestForSlot(slot);
  return loadout;
}
function getBestEquipmentLoadout(){
  migrateLooseEquipmentToEquipmentInventory(player);ensureEquipmentManagerState();
  const setNames=Object.keys(EQUIPMENT_SET_BONUSES),candidates=[cloneCurrentEquipment()];
  if(setNames.length<=8){
    const total=1<<setNames.length;
    for(let mask=0;mask<total;mask++){
      const forced=[];for(let i=0;i<setNames.length;i++)if(mask&(1<<i))forced.push(setNames[i]);
      const loadout=buildAutoEquipLoadoutForForcedSetsV277(forced);if(loadout)candidates.push(loadout);
    }
  }else{
    const greedy=buildAutoEquipLoadoutForForcedSetsV277([]);if(greedy)candidates.push(greedy);
    for(const setName of setNames){const one=buildAutoEquipLoadoutForForcedSetsV277([setName]);if(one)candidates.push(one);}
  }
  let best=candidates[0],bestScore=calculateEquipmentLoadoutScore(best);
  for(const loadout of candidates.slice(1)){const score=calculateEquipmentLoadoutScore(loadout);if(score>bestScore+.001){best=loadout;bestScore=score;}}
  return {loadout:best,score:bestScore};
}
function getEquipmentUpgradeCount(){
  const current=cloneCurrentEquipment(),currentScore=calculateEquipmentLoadoutScore(current),best=getBestEquipmentLoadout();if(!best||best.score<=currentScore+1)return 0;
  let changed=0;for(const slot of Object.keys(EQUIPMENT_SLOTS))if((current[slot]||null)!==(best.loadout?.[slot]||null))changed++;return changed;
}

// 一键卸下只卸未锁定装备，锁定件原位保留。
function unequipAllGear(){
  ensureEquipmentManagerState();const equipped=Object.entries(player.equipment||{}).filter(([,n])=>n),movable=equipped.filter(([,n])=>!isEquipmentLocked(n));
  const lockedCount=equipped.length-movable.length;
  if(!movable.length){showFloatingText?.(lockedCount?'🔒 当前穿戴装备均已锁定':'装备栏已经是空的',lockedCount?'#ffd76a':'#aaa');return false;}
  if(typeof confirm==='function'&&!confirm(`确定卸下 ${movable.length} 件未锁定装备吗？${lockedCount?`\n另有 ${lockedCount} 件锁定装备会保留。`:''}`))return false;
  for(const [slot,name] of movable){player.equipmentInventory.push(name);player.equipment[slot]=null;}
  checkSetBonuses();player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());updateStats();updateWorldHUD?.();autoSave?.();
  showFloatingText?.(`↩️ 已卸下 ${movable.length} 件${lockedCount?` · 保留锁定${lockedCount}件`:''}`,'#ffd700');setTimeout(showEquipmentPanel,80);return true;
}

// 手动操作锁定装备仍允许，但增加一次确认，避免误点。
const v277DoEquipBase=window.doEquip;
window.doEquip=function(itemName,slot){
  const old=player.equipment?.[slot];
  if(old&&isEquipmentLocked(old)&&old!==itemName&&typeof confirm==='function'&&!confirm(`🔒【${old}】已锁定。仍要替换 ${EQUIPMENT_SLOTS[slot]?.label||slot} 吗？`))return false;
  return v277DoEquipBase.apply(this,arguments);
};
const v277UnequipItemBase=window.unequipItem;
window.unequipItem=function(slot,reopen=false){
  const name=player.equipment?.[slot];
  if(name&&isEquipmentLocked(name)&&typeof confirm==='function'&&!confirm(`🔒【${name}】已锁定。仍要卸下吗？`))return false;
  return v277UnequipItemBase.apply(this,arguments);
};

function renderEquipSlots(slots){
  ensureEquipmentManagerState();
  return slots.map(slot=>{
    const s=EQUIPMENT_SLOTS[slot];if(!s)return '';
    const realmLocked=slot==='lifeArtifact'&&(player.level||0)<3,name=player.equipment?.[slot],data=name&&getEquipData(name),q=data?getQualityInfo(data.quality):null,upgrade=!realmLocked?getBestBagUpgradeForSlot(slot):null,itemLocked=name&&isEquipmentLocked(name);
    const itemText=realmLocked?'🔒 未解锁':name||'空',color=realmLocked?'#555':q?.color||(name?'#ddd':'#666'),enc=name?encodeURIComponent(name):'';
    return `<div style="border-left:4px solid ${q?.color||'#555'}" class="equipment-slot-row ${name?'equipped':''} ${upgrade?'has-upgrade':''} ${itemLocked?'item-locked':''}" ${name?`onclick="unequipItem('${slot}',true)" title="${itemLocked?'已锁定；点击后确认卸下':'点击卸下'}"`:''}>
      <span style="font-size:18px;text-align:center">${realmLocked?'🔒':s.icon}</span><div class="slot-main"><span class="slot-name">${s.label}</span><span class="item-name" style="color:${color}">${itemText}</span>${data?`<span style="font-size:9px;color:${q.color}">${q.icon} ${q.name} · ${formatEquipItemStatsV286813(name)}</span><span class="equip-item-power">⚡ 单件战力 ${getItemPowerDisplay(name)} ${itemLocked?'<span class="equip-lock-badge">锁定</span>':''}</span>`:''}${upgrade?`<span class="slot-upgrade-hint">↑ 背包有更优：${upgrade.name}</span>`:''}</div>${name?`<button class="equip-lock-btn ${itemLocked?'locked':''}" onclick="event.stopPropagation();toggleEquippedLockEncoded('${enc}')" title="${itemLocked?'解除锁定':'锁定装备'}">${itemLocked?'🔒':'🔓'}</button>`:`<span style="font-size:9px;color:#555">${s.type}</span>`}</div>`;
  }).join('');
}

function showEquipmentPanel(){
  toggleCharacterPanel?.(false);document.getElementById('equipmentPanel')?.remove();migrateLooseEquipmentToEquipmentInventory(player);ensureEquipmentManagerState();checkSetBonuses();
  const panel=document.createElement('div');panel.id='equipmentPanel';panel.className='equipment-panel-overlay';
  const content=document.createElement('div');content.className='equipment-panel-content';
  const power=Math.round(getEquippedPower()),lockedEquipped=Object.values(player.equipment||{}).filter(n=>n&&isEquipmentLocked(n)).length,upgradeCount=getEquipmentUpgradeCount();
  content.innerHTML=`<button onclick="document.getElementById('equipmentPanel')?.remove()" style="position:absolute;right:12px;top:10px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#ddd;font-size:16px">✕</button>
    <div style="margin-bottom:14px"><span style="font-size:20px;font-weight:bold;color:#ffd700">🎒 角色装备</span><span class="equip-power-chip">⚡ 装备战力 ${power}</span><span style="font-size:12px;color:#aaa;margin-left:8px">最高品质：${getEquipQualitySummary()}${lockedEquipped?` · 🔒${lockedEquipped}`:''}</span></div>
    <div class="equipment-grid-primary"><div><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">🛡️ 防具 · 6件</div>${renderEquipSlots(['head','robe','bracer','belt','pants','boots'])}</div><div><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">💎 首饰 · 5件</div>${renderEquipSlots(['necklace','bracelet','ring1','ring2','jade'])}</div></div>
    <div style="margin-top:12px"><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">⚔️ 武器法宝</div>${renderEquipSlots(['weapon','offhand','artifact1','artifact2','artifact3','flying'])}</div>
    <div style="margin-top:12px"><div style="color:#d9b5ec;font-size:13px;font-weight:bold;margin-bottom:6px">✨ 本命法宝 <span style="font-size:11px;color:#888">（金丹境解锁）</span></div>${renderEquipSlots(['lifeArtifact'])}</div>
    <div style="margin-top:12px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:9px"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:7px;font-size:12px">${renderEquipStatsSummary()}</div></div>
    <p style="font-size:12px;color:#aaa">单件属性已含品质倍率。角色总属性另计境界、套装等加成并取整；闪避面板上限30%，格挡面板上限25%。</p>
    ${renderSetProgressV2789()}
    <div class="equip-toolbar"><button class="panel-action-btn" onclick="showForgeV2825()">⚒️ 强化 / 洗练</button><button class="panel-action-btn equip-auto-btn" onclick="autoEquipBest()">⚡ 一键装备最佳${upgradeCount?` ↑${upgradeCount}`:''}</button><button class="panel-action-btn" onclick="showEquipmentInventory()">📦 背包装备（${player.equipmentInventory.length}）</button><button class="panel-action-btn equip-danger-btn" onclick="unequipAllGear()">↩️ 一键卸下未锁定</button><button class="panel-action-btn" onclick="document.getElementById('equipmentPanel')?.remove()">关闭</button></div>`;
  panel.appendChild(content);document.body.appendChild(panel);
}

function setEquipmentBagQualityFilter(key){equipmentBagQualityFilter=key;showEquipmentInventory();}
function setEquipmentDismantleQuality(key){equipmentDismantleQuality=key;showEquipmentInventory();}
function getBagCountByName(name){return (player.equipmentInventory||[]).reduce((n,x)=>n+(x===name?1:0),0);}
function getEquippedCountByName(name){return Object.values(player.equipment||{}).reduce((n,x)=>n+(x===name?1:0),0);}
function getProtectedBagCount(name){
  const bagCount=getBagCountByName(name);if(!bagCount)return 0;if(getEquipData(name)?.forgeBaseV2825||isEquipmentLocked(name))return bagCount;
  let protect=0;
  // 更优装备至少保留一件；套装关键件如果当前没穿，也至少保留一件。
  if(isInventoryEquipUpgrade(name))protect=Math.max(protect,1);
  // 当前境界尚不能穿的装备可能是未来成长装备，至少保留一件。
  if(!canEquipItem(name).ok)protect=Math.max(protect,1);
  if(isEquipmentSetPiece(name)&&getEquippedCountByName(name)===0)protect=Math.max(protect,1);
  return Math.min(bagCount,protect);
}
function getSafeDismantleCountForName(name){if(getEquipData(name)?.forgeBaseV2825)return 0;return Math.max(0,getBagCountByName(name)-getProtectedBagCount(name));}
function getDismantleValue(name){
  const d=getEquipData(name);if(!d)return 0;const qi=Math.max(0,QUALITY_KEYS.indexOf(d.quality)),bases=[5,12,30,75,180,500,1500];
  return Math.max(1,Math.round((bases[qi]||5)*(1+Math.max(0,Number(d.realmRequired)||0)*.12)));
}
function getBulkDismantlePreview(threshold=equipmentDismantleQuality){
  const maxIdx=Math.max(0,QUALITY_KEYS.indexOf(threshold)),counts={};for(const n of (player.equipmentInventory||[]))counts[n]=(counts[n]||0)+1;
  const rows=[];let count=0,gold=0;
  for(const [name,total] of Object.entries(counts)){
    const d=getEquipData(name);if(!d)continue;const qi=QUALITY_KEYS.indexOf(d.quality);if(qi<0||qi>maxIdx)continue;
    const safe=Math.max(0,total-getProtectedBagCount(name));if(!safe)continue;const each=getDismantleValue(name);rows.push({name,count:safe,each,total:each*safe});count+=safe;gold+=each*safe;
  }
  return {rows,count,gold};
}
function bulkDismantleEquipment(){
  ensureEquipmentManagerState();const preview=getBulkDismantlePreview();
  if(!preview.count){showFloatingText?.('没有符合安全分解条件的装备','#aaa');return false;}
  const q=getQualityInfo(equipmentDismantleQuality);
  if(typeof confirm==='function'&&!confirm(`安全分解 ${preview.count} 件【${q.name}及以下】装备？\n预计返还 ${preview.gold} 灵石。\n\n已锁定、更优装备、必要套装件会自动保留。`))return false;
  const remove={};for(const r of preview.rows)remove[r.name]=r.count;const next=[];
  for(const name of (player.equipmentInventory||[])){if((remove[name]||0)>0)remove[name]--;else next.push(name);}
  player.equipmentInventory=next;player.gold=(Number(player.gold)||0)+preview.gold;updateStats();updateWorldHUD?.();autoSave?.();
  showFloatingText?.(`🧩 分解 ${preview.count} 件装备 · +${preview.gold} 灵石`,'#ffbd8e');setTimeout(showEquipmentInventory,60);return true;
}
function dismantleOneEquipmentEncoded(encoded){
  const name=decodeURIComponent(encoded),safe=getSafeDismantleCountForName(name);if(!safe){showFloatingText?.('该装备受锁定/升级/套装保护','#ffd76a');return false;}
  const d=getEquipData(name),q=getQualityInfo(d?.quality),value=getDismantleValue(name),qi=Math.max(0,QUALITY_KEYS.indexOf(d?.quality));
  if(qi>=4&&typeof confirm==='function'&&!confirm(`【${name}】为${q?.name||'高品质'}装备，确定分解 1 件吗？`))return false;
  const idx=player.equipmentInventory.indexOf(name);if(idx<0)return false;player.equipmentInventory.splice(idx,1);player.gold=(Number(player.gold)||0)+value;
  updateStats();updateWorldHUD?.();autoSave?.();showFloatingText?.(`🧩 分解【${name}】 · +${value} 灵石`,'#ffbd8e');setTimeout(showEquipmentInventory,50);return true;
}

let equipmentBagExpandedV2803=true;
function syncEquipmentBagSizeV2803(){
  const panel=document.getElementById('storyPanel');if(!panel?.classList.contains('equipment-bag-view-v2803'))return;
  panel.classList.toggle('equipment-bag-expanded-v2803',equipmentBagExpandedV2803);
  const button=document.getElementById('equipmentBagSizeV2803');
  if(button){button.textContent=equipmentBagExpandedV2803?'收起面板':'展开面板';button.setAttribute('aria-expanded',String(equipmentBagExpandedV2803));}
}
function toggleEquipmentBagSizeV2803(){equipmentBagExpandedV2803=!equipmentBagExpandedV2803;syncEquipmentBagSizeV2803();}
function showEquipmentInventory(){
  migrateLooseEquipmentToEquipmentInventory(player);ensureEquipmentManagerState();document.getElementById('equipmentPanel')?.remove();
  const items=player.equipmentInventory||[],counts={};items.forEach(n=>counts[n]=(counts[n]||0)+1);
  const qualityFilters=[['ALL','全部'],...QUALITY_KEYS.map(k=>[k,getQualityInfo(k).name])];
  const dismantleOptions=['MORTAL','GOOD','FINE','EXCELLENT'];
  const preview=getBulkDismantlePreview(),lockedCount=items.filter(n=>isEquipmentLocked(n)).length;
  const visible=Object.entries(counts).filter(([name])=>{const d=getEquipData(name);return d&&(equipmentBagQualityFilter==='ALL'||d.quality===equipmentBagQualityFilter);}).sort((a,b)=>{const da=getEquipData(a[0]),db=getEquipData(b[0]);const qa=QUALITY_KEYS.indexOf(da?.quality),qb=QUALITY_KEYS.indexOf(db?.quality);return qb-qa||getEquipItemScore(b[0])-getEquipItemScore(a[0])||a[0].localeCompare(b[0],'zh-CN');});
  let html=`<div class="equipment-bag-toolbar-v2803"><strong>装备背包</strong><div><button type="button" id="equipmentBagSizeV2803" onclick="toggleEquipmentBagSizeV2803()">收起面板</button><button type="button" onclick="closeWorldOverlay()" aria-label="关闭装备背包">关闭 ✕</button></div></div><p>📦 <b>装备背包</b>（${items.length}件） <span class="equip-power-chip">⚡ 当前装备 ${Math.round(getEquippedPower())}</span> ${lockedCount?`<span style="color:#ffd76a;font-size:11px">🔒 锁定${lockedCount}件</span>`:''}</p>
    <div class="equip-manager-row"><span style="font-size:10px;color:#888">品质筛选</span>${qualityFilters.map(([k,label])=>`<button class="equip-filter-btn ${equipmentBagQualityFilter===k?'active':''}" onclick="setEquipmentBagQualityFilter('${k}')">${label}</button>`).join('')}</div>
    <div class="equip-dismantle-box"><div class="equip-dismantle-title">🧩 安全分解：只处理背包中的低品质冗余装备；锁定、更优装备、未达境界装备、必要套装件自动保留。</div><div class="equip-manager-row" style="margin:0"><span style="font-size:10px;color:#888">分解上限</span>${dismantleOptions.map(k=>`<button class="equip-filter-btn ${equipmentDismantleQuality===k?'active':''}" onclick="setEquipmentDismantleQuality('${k}')">≤${getQualityInfo(k).name}</button>`).join('')}<button class="equip-dismantle-btn" onclick="bulkDismantleEquipment()">🔥 一键安全分解 ${preview.count?`${preview.count}件 · +${preview.gold}灵石`:'（无可分解）'}</button></div></div>
    <div class="equipment-bag-grid">`;
  if(!visible.length)html+=`<div class="equip-empty-filter">${items.length?'当前品质筛选下没有装备':'装备背包为空'}</div>`;
  for(const [name,count] of visible){
    const d=getEquipData(name);if(!d)continue;const q=getQualityInfo(d.quality),check=canEquipItem(name),slotLabel=d.slot==='ring'?'戒指':d.slot==='artifact'?'法宝':d.slot==='life_artifact'?'本命法宝':(EQUIPMENT_SLOTS[d.slot]?.label||d.slot),upgrade=isInventoryEquipUpgrade(name),itemLocked=isEquipmentLocked(name),setNames=getEquipmentSetNames(name),compare=check.ok?getEquipStatComparisonHtml(name):'',safeCount=getSafeDismantleCountForName(name),enc=encodeURIComponent(name);
    html+=`<div class="equipment-bag-card ${check.ok?'can-equip':''} ${upgrade?'upgrade':''} ${itemLocked?'item-locked':''}" style="border-left:4px solid ${q.color};border-top:1px solid ${itemLocked?'rgba(255,215,0,.45)':upgrade?'rgba(105,240,174,.55)':q.color+'55'};${check.ok?'':'opacity:.58'}" ${check.ok?`onclick="equipItemFromEncoded('${enc}')"`:''}>${upgrade?'<span class="equip-upgrade-badge">↑ 更优</span>':''}<div style="font-size:20px;color:${q.color}">${q.icon}</div><div style="font-size:12px;color:${q.color};font-weight:bold;padding-right:${upgrade?'42px':'0'}">${name}${count>1?` ×${count}`:''}</div><div style="font-size:10px;color:#999">${slotLabel} · <span class="gear-grade-badge-v2791" style="--gear-color:${q.color}">${q.icon} ${q.name}</span> · 需${CULTIVATION_REALMS[d.realmRequired]?.name||'凡人'}</div><div style="font-size:10px;color:#bbb;margin-top:3px">${formatEquipItemStatsV286813(name)}${d.forgeBaseV2825?`<br>强化 +${d.forgeLevelV2825} · 铭器保护`:""}</div><div class="equip-item-power">⚡ 单件战力 ${getItemPowerDisplay(name)}</div><div style="margin-top:4px">${itemLocked?'<span class="equip-lock-badge">🔒 已锁定</span>':''}${setNames.length?`<span class="equip-set-badge">🎯 ${setNames.join(' / ')}</span>`:''}</div>${compare}${!check.ok?`<div style="font-size:9px;color:#ff7b7b;margin-top:3px">${check.reason}</div>`:''}<div class="equip-card-actions"><button class="equip-card-mini ${itemLocked?'locked':''}" onclick="event.stopPropagation();toggleEquipmentLockEncoded('${enc}')">${itemLocked?'🔓 解锁':'🔒 锁定'}</button><button class="equip-card-mini dismantle" ${safeCount?'':'disabled'} onclick="event.stopPropagation();dismantleOneEquipmentEncoded('${enc}')">🧩 分解1件${safeCount?` (${safeCount}可分)`:''}</button></div></div>`;
  }
  html+=`</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="choice-btn" style="flex:1;min-width:150px;background:linear-gradient(135deg,#237a52,#14543a);border-color:#69f0ae" onclick="autoEquipBest()">⚡ 一键装备最佳</button><button class="choice-btn" style="flex:1;min-width:150px" onclick="showEquipmentPanel()">← 返回装备栏</button></div>`;showStory(html,[]);
  const panel=document.getElementById('storyPanel');panel?.classList.add('equipment-bag-view-v2803');syncEquipmentBagSizeV2803();if(panel)panel.scrollTop=0;
}

// 初始化锁定字段；旧存档无需迁移结构，下一次保存会自动写入 player。
try{ensureEquipmentManagerState();}catch(_){ }

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-12-v277equipmentmanager.js"]="28.68.35";
