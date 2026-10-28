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
      <span style="font-size:18px;text-align:center">${realmLocked?'🔒':s.icon}</span><div class="slot-main"><span class="slot-name">${s.label}</span><span class="item-name" style="color:${color}">${itemText}</span>${data?`<span style="font-size:9px;color:${q.color}">${q.icon} ${q.name} · ${formatEquipItemStatsV286813(name)}</span><span class="equip-item-power">⚡ 单件战力 ${getItemPowerDisplay(name)} ${itemLocked?'<span class="equip-lock-badge">锁定</span>':''}</span>`:''}${upgrade?`<span class="slot-upgrade-hint">↑ 背包有更优：${upgrade.name}</span>`:''}</div>${name?`<button class="equip-lock-btn ${itemLocked?'locked':''}" onclick="event.stopPropagation();toggleEquippedLockEncoded('${enc}')" title="${itemLocked?'解除锁定':'锁定装备'}">${itemLocked?'🔒':'🔓'}</button>`:`<span style="font-size:9px;color:#555">${equipTypeLabelV2895(s.type)}</span>`}</div>`;
  }).join('');
}

function showEquipmentPanel(){
  toggleCharacterPanel?.(false);document.getElementById('equipmentPanel')?.remove();migrateLooseEquipmentToEquipmentInventory(player);ensureEquipmentManagerState();checkSetBonuses();
  const panel=document.createElement('div');panel.id='equipmentPanel';panel.className='equipment-panel-overlay';
  const content=document.createElement('div');content.className='equipment-panel-content';
  const power=Math.round(getEquippedPower()),lockedEquipped=Object.values(player.equipment||{}).filter(n=>n&&isEquipmentLocked(n)).length,upgradeCount=getEquipmentUpgradeCount();
  content.innerHTML=`<button aria-label="关闭" onclick="document.getElementById('equipmentPanel')?.remove()" style="position:absolute;right:12px;top:10px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#ddd;font-size:16px">✕</button>
    <div style="margin-bottom:14px"><span style="font-size:20px;font-weight:bold;color:#ffd700">🎒 角色装备</span><span class="equip-power-chip">⚡ 装备战力 ${power}</span><span style="font-size:12px;color:#aaa;margin-left:8px">最高品质：${getEquipQualitySummary()}${lockedEquipped?` · 🔒${lockedEquipped}`:''}</span></div>
    <div class="equipment-grid-primary"><div><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">🛡️ 防具 · 6件</div>${renderEquipSlots(['head','robe','bracer','belt','pants','boots'])}</div><div><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">💎 首饰 · 5件</div>${renderEquipSlots(['necklace','bracelet','ring1','ring2','jade'])}</div></div>
    <div style="margin-top:12px"><div style="color:#ffd700;font-size:13px;font-weight:bold;margin-bottom:6px">⚔️ 武器法宝</div>${renderEquipSlots(['weapon','offhand','artifact1','artifact2','artifact3','flying'])}</div>
    <div style="margin-top:12px"><div style="color:#d9b5ec;font-size:13px;font-weight:bold;margin-bottom:6px">✨ 本命法宝 <span style="font-size:11px;color:#888">（金丹境解锁）</span></div>${renderEquipSlots(['lifeArtifact'])}</div>
    <div style="margin-top:12px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:9px"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:7px;font-size:12px">${renderEquipStatsSummary()}</div></div>
    <p style="font-size:12px;color:#aaa">单件属性已含品质倍率。角色总属性另计境界、套装等加成并取整；闪避面板上限30%，格挡面板上限25%。</p>
    ${renderSetProgressV2789()}
    ${renderLoadoutPresetsV2870()}<div class="equip-toolbar"><button class="panel-action-btn" id="gradeUpgradeBtnV2869" onclick="showGradeUpgradePanelV2869()">⬆️ 升品 / 继承</button><button class="panel-action-btn" onclick="showForgeV2825()">⚒️ 强化 / 洗练</button><button class="panel-action-btn equip-auto-btn" onclick="autoEquipBest()">⚡ 一键装备最佳${upgradeCount?` ↑${upgradeCount}`:''}</button><button class="panel-action-btn" onclick="showEquipmentInventory()">📦 背包装备（${player.equipmentInventory.length}）</button><button class="panel-action-btn equip-danger-btn" onclick="unequipAllGear()">↩️ 一键卸下未锁定</button><button class="panel-action-btn" onclick="document.getElementById('equipmentPanel')?.remove()">关闭</button></div>`;
  panel.appendChild(content);document.body.appendChild(panel);
}

function setEquipmentBagQualityFilter(key){equipmentBagQualityFilter=key;showEquipmentInventory();}
function getDismantleOptionsV286846(){return ['MORTAL','GOOD','FINE','EXCELLENT',...(player.level>=3?['LING_PIN']:[]),...(player.level>=7?['BAO_QI']:[])];}
function setEquipmentDismantleQuality(key){if(!getDismantleOptionsV286846().includes(key))return false;equipmentDismantleQuality=key;showEquipmentInventory();return true;}
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
  const d=getEquipData(name);if(!d)return 0;const bases={MORTAL:5,GOOD:12,FINE:30,EXCELLENT:75,LING_PIN:180,BAO_QI:500,SPIRIT:180,IMMORTAL:1400,TIAN_QI:3600,SHENG_QI:8500,DAO_QI:18000,GOD:25000};
  return Math.max(1,Math.round((bases[d.quality]||5)*(1+Math.max(0,Number(d.realmRequired)||0)*.12)));
}
function getBulkDismantlePreview(threshold=equipmentDismantleQuality){
  if(!getDismantleOptionsV286846().includes(threshold))threshold='EXCELLENT';
  const maxIdx=Math.max(0,QUALITY_KEYS.indexOf(threshold)),counts={};for(const n of (player.equipmentInventory||[]))counts[n]=(counts[n]||0)+1;
  const rows=[];let count=0,gold=0;
  for(const [name,total] of Object.entries(counts)){
    const d=getEquipData(name);if(!d)continue;const qi=QUALITY_KEYS.indexOf(d.quality);if(qi<0||qi>maxIdx)continue;
    const safe=Math.max(0,total-getProtectedBagCount(name));if(!safe)continue;const each=getDismantleValue(name);rows.push({name,count:safe,each,total:each*safe});count+=safe;gold+=each*safe;
  }
  return {rows,count,gold};
}
function bulkDismantleEquipment(){
  if(gameState==='start'||!forgeAllowedV2825())return false;
  ensureEquipmentManagerState();if(!getDismantleOptionsV286846().includes(equipmentDismantleQuality))equipmentDismantleQuality='EXCELLENT';
  const owner=player,preview=getBulkDismantlePreview();
  if(!preview.count){showFloatingText?.('没有符合安全分解条件的装备','#aaa');return false;}
  const q=getQualityInfo(equipmentDismantleQuality);
  if(typeof confirm==='function'&&!confirm(`安全分解 ${preview.count} 件【${q.name}及以下】装备？\n预计返还 ${preview.gold} 灵石。\n\n已锁定、更优装备、必要套装件会自动保留。`))return false;
  if(player!==owner||gameState==='start'||!forgeAllowedV2825()||JSON.stringify(getBulkDismantlePreview())!==JSON.stringify(preview))return false;
  const remove={};for(const r of preview.rows)remove[r.name]=r.count;const next=[];
  for(const name of (player.equipmentInventory||[])){if((remove[name]||0)>0)remove[name]--;else next.push(name);}
  player.equipmentInventory=next;player.gold=(Number(player.gold)||0)+preview.gold;updateStats();updateWorldHUD?.();autoSave?.();
  showFloatingText?.(`🧩 分解 ${preview.count} 件装备 · +${preview.gold} 灵石`,'#ffbd8e');setTimeout(()=>{if(player===owner&&gameState!=='start'&&forgeAllowedV2825())showEquipmentInventory();},60);return true;
}
function dismantleOneEquipmentEncoded(encoded){
  if(gameState==='start'||!forgeAllowedV2825())return false;const owner=player;
  const name=decodeURIComponent(encoded),safe=getSafeDismantleCountForName(name);if(!safe){showFloatingText?.('该装备受锁定/升级/套装保护','#ffd76a');return false;}
  const d=getEquipData(name),q=getQualityInfo(d?.quality),value=getDismantleValue(name),qi=Math.max(0,QUALITY_KEYS.indexOf(d?.quality));
  if(qi>=4&&typeof confirm==='function'&&!confirm(`【${name}】为${q?.name||'高品质'}装备，确定分解 1 件吗？`))return false;
  if(player!==owner||gameState==='start'||!forgeAllowedV2825()||!getSafeDismantleCountForName(name))return false;
  const idx=player.equipmentInventory.indexOf(name);if(idx<0)return false;player.equipmentInventory.splice(idx,1);player.gold=(Number(player.gold)||0)+value;
  updateStats();updateWorldHUD?.();autoSave?.();showFloatingText?.(`🧩 分解【${name}】 · +${value} 灵石`,'#ffbd8e');setTimeout(()=>{if(player===owner&&gameState!=='start'&&forgeAllowedV2825())showEquipmentInventory();},50);return true;
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
  const dismantleOptions=getDismantleOptionsV286846();if(!dismantleOptions.includes(equipmentDismantleQuality))equipmentDismantleQuality='EXCELLENT';
  const preview=getBulkDismantlePreview(),lockedCount=items.filter(n=>isEquipmentLocked(n)).length;
  const visible=Object.entries(counts).filter(([name])=>{const d=getEquipData(name);return d&&(equipmentBagQualityFilter==='ALL'||d.quality===equipmentBagQualityFilter);}).sort((a,b)=>{const da=getEquipData(a[0]),db=getEquipData(b[0]);const qa=QUALITY_KEYS.indexOf(da?.quality),qb=QUALITY_KEYS.indexOf(db?.quality);return qb-qa||getEquipItemScore(b[0])-getEquipItemScore(a[0])||a[0].localeCompare(b[0],'zh-CN');});
  let html=`<div class="equipment-bag-toolbar-v2803"><strong>装备背包</strong><div><button type="button" id="equipmentBagSizeV2803" onclick="toggleEquipmentBagSizeV2803()">收起面板</button><button type="button" onclick="closeWorldOverlay()" aria-label="关闭装备背包">关闭 ✕</button></div></div><p>📦 <b>装备背包</b>（${items.length}件） <span class="equip-power-chip">⚡ 当前装备 ${Math.round(getEquippedPower())}</span> ${lockedCount?`<span style="color:#ffd76a;font-size:11px">🔒 锁定${lockedCount}件</span>`:''}</p>
    <div class="equip-manager-row"><span style="font-size:10px;color:#888">品质筛选</span>${qualityFilters.map(([k,label])=>`<button class="equip-filter-btn ${equipmentBagQualityFilter===k?'active':''}" onclick="setEquipmentBagQualityFilter('${k}')">${label}</button>`).join('')}</div>
    <div class="equip-dismantle-box"><div class="equip-dismantle-title">🧩 安全分解：只处理背包中的低品质冗余装备；锁定、更优装备、未达境界装备、必要套装件自动保留。</div><div class="equip-manager-row" style="margin:0"><span style="font-size:10px;color:#888">分解上限</span>${dismantleOptions.map(k=>`<button class="equip-filter-btn ${equipmentDismantleQuality===k?'active':''}" onclick="setEquipmentDismantleQuality('${k}')">≤${getQualityInfo(k).name}</button>`).join('')}<button class="equip-dismantle-btn" onclick="bulkDismantleEquipment()">🔥 一键安全分解 ${preview.count?`${preview.count}件 · +${preview.gold}灵石`:'（无可分解）'}</button></div></div>
    <div class="equipment-bag-grid">`;
  if(!visible.length)html+=`<div class="equip-empty-filter">${items.length?'当前品质筛选下没有装备':'装备背包为空'}</div>`;
  for(const [name,count] of visible){
    const d=getEquipData(name);if(!d)continue;const q=getQualityInfo(d.quality),check=canEquipItem(name),slotLabel=equipSlotLabelV2895(d.slot),upgrade=isInventoryEquipUpgrade(name),itemLocked=isEquipmentLocked(name),setNames=getEquipmentSetNames(name),compare=check.ok?getEquipStatComparisonHtml(name):'',safeCount=getSafeDismantleCountForName(name),enc=encodeURIComponent(name);
    html+=`<div class="equipment-bag-card ${check.ok?'can-equip':''} ${upgrade?'upgrade':''} ${itemLocked?'item-locked':''}" style="border-left:4px solid ${q.color};border-top:1px solid ${itemLocked?'rgba(255,215,0,.45)':upgrade?'rgba(105,240,174,.55)':q.color+'55'};${check.ok?'':'opacity:.58'}" ${check.ok?`onclick="equipItemFromEncoded('${enc}')"`:''}>${upgrade?'<span class="equip-upgrade-badge">↑ 更优</span>':''}<div style="font-size:20px;color:${q.color}">${q.icon}</div><div style="font-size:12px;color:${q.color};font-weight:bold;padding-right:${upgrade?'42px':'0'}">${name}${count>1?` ×${count}`:''}</div><div style="font-size:10px;color:#999">${slotLabel} · <span class="gear-grade-badge-v2791" style="--gear-color:${q.color}">${q.icon} ${q.name}</span> · 需${CULTIVATION_REALMS[d.realmRequired]?.name||'凡人'}</div><div style="font-size:10px;color:#bbb;margin-top:3px">${formatEquipItemStatsV286813(name)}${d.forgeBaseV2825?`<br>强化 +${d.forgeLevelV2825} · 铭器保护`:""}</div><div class="equip-item-power">⚡ 单件战力 ${getItemPowerDisplay(name)}</div><div style="margin-top:4px">${itemLocked?'<span class="equip-lock-badge">🔒 已锁定</span>':''}${setNames.length?`<span class="equip-set-badge">🎯 ${setNames.join(' / ')}</span>`:''}</div>${compare}${!check.ok?`<div style="font-size:9px;color:#ff7b7b;margin-top:3px">${check.reason}</div>`:''}<div class="equip-card-actions"><button class="equip-card-mini ${itemLocked?'locked':''}" onclick="event.stopPropagation();toggleEquipmentLockEncoded('${enc}')">${itemLocked?'🔓 解锁':'🔒 锁定'}</button><button class="equip-card-mini dismantle" ${safeCount?'':'disabled'} onclick="event.stopPropagation();dismantleOneEquipmentEncoded('${enc}')">🧩 分解1件${safeCount?` (${safeCount}可分)`:''}</button></div></div>`;
  }
  html+=`</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="choice-btn" onclick="showGradeUpgradePanelV2869()">⬆️ 升品 / 继承</button><button class="choice-btn" style="flex:1;min-width:150px;background:linear-gradient(135deg,#237a52,#14543a);border-color:#69f0ae" onclick="autoEquipBest()">⚡ 一键装备最佳</button><button class="choice-btn" style="flex:1;min-width:150px" onclick="showEquipmentPanel()">← 返回装备栏</button></div>`;showStory(html,[]);
  const panel=document.getElementById('storyPanel');panel?.classList.add('equipment-bag-view-v2803');syncEquipmentBagSizeV2803();if(panel)panel.scrollTop=0;
}

// Grade upgrades use the same set catalogue, prices and forge serializer as the shop/workshop.
let gradeUpgradeSessionV2869=null,gradeUpgradeNonceV2869=0;
function gradeUpgradeIndexV2869(){
  const index=new Map();
  for(const name of Object.keys(EQUIPMENT_DB)){
    const d=EQUIPMENT_DB[name];
    if(d.familyV2790&&Number.isInteger(d.pieceV2790)&&Number.isInteger(d.gradeV2790)&&!d.forgeBaseV2825)
      index.set(JSON.stringify([d.familyV2790,d.pieceV2790,d.slot,d.gradeV2790]),name);
  }
  return index;
}
function findNextGradeEquipV2869(itemName,index=gradeUpgradeIndexV2869()){
  const d=getEquipData(itemName);if(!d)return null;
  const storedBase=d.forgeBaseV2825||itemName,baseName=OLD_GEAR_ALIASES_V2792[storedBase]||storedBase,baseData=EQUIPMENT_DB[baseName];
  const record=d.forgeBaseV2825?player.forgeV2825?.items?.[itemName]:null;
  if(!baseData||!baseData.familyV2790||!Number.isInteger(baseData.gradeV2790)||d.forgeBaseV2825&&record?.base!==storedBase)return null;
  const nextBaseName=index.get(JSON.stringify([baseData.familyV2790,baseData.pieceV2790,baseData.slot,baseData.gradeV2790+1]));
  const nextBaseData=EQUIPMENT_DB[nextBaseName];if(!nextBaseData)return null;
  const currentPrice=baseData.priceV2790,nextPrice=nextBaseData.priceV2790;
  if(!Number.isSafeInteger(currentPrice)||!Number.isSafeInteger(nextPrice)||nextPrice<=currentPrice)return null;
  const fodderIndex=(player.equipmentLocks||[]).includes(nextBaseName)?-1:(player.equipmentInventory||[]).indexOf(nextBaseName);
  return {itemName,baseName,nextBaseName,baseData,nextBaseData,record,isForged:!!record,forgeLevel:record?.level||0,
    goldDiff:nextPrice-currentPrice,hasBagFodder:fodderIndex>=0,fodderIndex,actualGoldCost:fodderIndex>=0?0:nextPrice-currentPrice,realmRequired:nextBaseData.realmRequired||0};
}
function gradeUpgradeFingerprintV2869(){
  return JSON.stringify([player.equipment,player.equipmentInventory,player.equipmentLocks,player.forgeV2825,player.gold,player.level]);
}
function gradeUpgradeCurrentV2869(source,nonce){
  const s=gradeUpgradeSessionV2869,panel=document.getElementById('gradeUpgradePanelV2869');
  if(!s||s.owner!==player||s.nonce!==nonce||s.panel!==panel||!panel||!forgeAllowedV2825()||gameState!=='exploring'||
    document.getElementById('storyPanel')?.classList.contains('hidden')||document.getElementById('equipmentPanel')||
    document.getElementById('characterPanel')?.classList.contains('hidden')===false||
    gradeUpgradeFingerprintV2869()!==s.fingerprint)return null;
  const row=s.rows.get(source);if(!row)return null;
  const name=row.kind==='slot'?player.equipment?.[row.index]:player.equipmentInventory?.[row.index];
  const info=findNextGradeEquipV2869(name,s.index);
  if(name!==row.name||!info||info.nextBaseName!==row.info.nextBaseName||info.actualGoldCost!==row.info.actualGoldCost||info.fodderIndex!==row.info.fodderIndex)return null;
  if(row.kind==='slot'&&!canEquipItem(info.nextBaseName).ok)return null;
  if(!Number.isFinite(player.gold)||player.gold<info.actualGoldCost)return null;
  // A forged key represents one item; reject malformed archives that alias one key into multiple slots.
  if(info.isForged&&getBagCountByName(name)+getEquippedCountByName(name)!==1)return null;
  return {...row,info};
}
function executeGradeUpgradeV2869(source,nonce){
  const session=gradeUpgradeSessionV2869;if(session?.busy)return false;
  const row=gradeUpgradeCurrentV2869(source,nonce);if(!row){showFloatingText?.('装备或状态已变化，请重新打开升品面板。','#ffd76a');return false;}
  session.busy=true;
  try{
    const {info}=row,locked=(player.equipmentLocks||[]).includes(row.name);
    const cost=info.hasBagFodder?`消耗未锁定的【${info.nextBaseName}】×1，不扣灵石`:`消耗 ${info.actualGoldCost} 灵石，剩余 ${player.gold-info.actualGoldCost}`;
    const inherit=info.isForged?`\n保留强化 +${info.forgeLevel}、当前洗练词条${info.record.pending?'及待选词条':''}。`:'';
    if(!window.confirm(`将【${row.name}】升为【${info.nextBaseName}】？\n${cost}\n穿戴需${CULTIVATION_REALMS[info.realmRequired]?.name||'对应境界'}。${inherit}${locked?'\n原装备锁定将保留。':''}`))return false;
    if(!gradeUpgradeCurrentV2869(source,nonce)){showFloatingText?.('确认期间装备或状态已变化，未扣除资源。','#ffd76a');return false;}
    const owner=player,previous={equipment:owner.equipment,equipmentInventory:owner.equipmentInventory,equipmentLocks:owner.equipmentLocks,
      forgeV2825:owner.forgeV2825,gold:owner.gold,hp:owner.hp,mp:owner.mp,activeSetBonuses:owner.activeSetBonuses};
    const bag=[...owner.equipmentInventory],equipment={...owner.equipment};let nextName=info.nextBaseName,newForge=owner.forgeV2825,registered=false;
    const oldDefinition=info.isForged?EQUIPMENT_DB[row.name]:null;
    if(info.isForged){
      let n=Number.isSafeInteger(owner.forgeV2825.next)&&owner.forgeV2825.next>0?owner.forgeV2825.next:1;
      do{nextName=info.nextBaseName+'〔铭器'+n+'〕';n=n>=Number.MAX_SAFE_INTEGER?1:n+1;}while(EQUIPMENT_DB[nextName]||owner.forgeV2825.items[nextName]);
      const record={...JSON.parse(JSON.stringify(info.record)),base:info.nextBaseName};
      const items={...owner.forgeV2825.items,[nextName]:record};delete items[row.name];newForge={...owner.forgeV2825,next:n,items};
    }
    if(row.kind==='slot')equipment[row.index]=nextName;else bag[row.index]=nextName;
    if(info.hasBagFodder)bag.splice(info.fodderIndex,1);
    const locks=[...(owner.equipmentLocks||[])];
    if(info.isForged){const i=locks.indexOf(row.name);if(i>=0)locks.splice(i,1);}
    if(locked&&!locks.includes(nextName))locks.push(nextName);
    try{
      if(info.isForged){registered=true;forgeRegisterV2825(nextName,newForge.items[nextName]);delete EQUIPMENT_DB[row.name];FORGE_KEYS_V2825.delete(row.name);}
      Object.assign(owner,{equipment,equipmentInventory:bag,equipmentLocks:locks,forgeV2825:newForge,gold:owner.gold-info.actualGoldCost});
      checkSetBonuses();owner.hp=Math.min(owner.hp,getMaxHp());owner.mp=Math.min(owner.mp,getMaxMp());
      if(!saveGame())throw Error('save failed');
    }catch(_){
      Object.assign(owner,previous);
      if(registered){delete EQUIPMENT_DB[nextName];FORGE_KEYS_V2825.delete(nextName);Object.defineProperty(EQUIPMENT_DB,row.name,{configurable:true,writable:true,enumerable:false,value:oldDefinition});FORGE_KEYS_V2825.add(row.name);}
      showFloatingText?.('升品未保存，装备和消耗已恢复，请稍后重试。','#ff8a80');return false;
    }
    gradeUpgradeSessionV2869=null;forgeSelectionV2825=null;
    updateStats();updateWorldHUD?.();showFloatingText?.(`升品成功：${info.nextBaseName}${info.isForged?' · 强化与词条已继承':''}`,'#ffd700');
    showGradeUpgradePanelV2869();return true;
  }finally{session.busy=false;}
}
function showGradeUpgradePanelV2869(){
  if(!forgeAllowedV2825()||gameState!=='exploring')return showFloatingText?.('请先结束战斗或突破。','#ffd76a');
  toggleCharacterPanel?.(false);document.getElementById('equipmentPanel')?.remove();
  migrateLooseEquipmentToEquipmentInventory(player);forgeRestoreV2825(player);ensureEquipmentManagerState();
  const index=gradeUpgradeIndexV2869(),rows=new Map(),nonce=++gradeUpgradeNonceV2869,esc=discipleEscV2815;
  const add=(name,kind,i)=>{const info=findNextGradeEquipV2869(name,index);if(info)rows.set(`${kind}:${i}`,{name,kind,index:i,info});};
  for(const [slot,name] of Object.entries(player.equipment||{}))if(name)add(name,'slot',slot);
  const seen=new Set();(player.equipmentInventory||[]).forEach((name,i)=>{if(!seen.has(name)){seen.add(name);add(name,'bag',i);}});
  let html='<section id="gradeUpgradePanelV2869" class="grade-upgrade-panel"><div class="equipment-bag-toolbar-v2803"><strong>装备升品 · 铭器继承</strong><button type="button" onclick="closeWorldOverlay()" aria-label="关闭装备升品">关闭 ✕</button></div><p>每次升至同套装、同部位的下一品级。优先消耗背包中一件未锁定的同名高阶胚子；没有可用胚子时，按现有商店价格补差价。</p><p>铭器保留强化等级、当前及待选词条。锁定胚子不会被消耗；主动升品的装备保留锁定。背包装备可提前升品，穿戴时仍需满足境界。</p>';
  if(!rows.size)html+='<p class="equip-empty-filter">暂无可升品的套装装备；最高品级和无对应高阶版本的装备不列入。</p>';
  for(const [source,row] of rows){
    const {info,name,kind}=row,q=getQualityInfo(info.nextBaseData.quality),realm=canEquipItem(info.nextBaseName),realmOk=kind==='bag'||realm.ok;
    const enough=player.gold>=info.actualGoldCost,unique=!info.isForged||getBagCountByName(name)+getEquippedCountByName(name)===1;
    const where=kind==='slot'?`已穿戴 · ${EQUIPMENT_SLOTS[row.index]?.label||row.index}`:`背包 · 持有${getBagCountByName(name)}件（本次1件）`;
    const cost=info.hasBagFodder?`消耗【${info.nextBaseName}】×1 · 不扣灵石`:`补差价 ${info.actualGoldCost} 灵石`;
    html+=`<article class="grade-upgrade-card" style="--grade-color:${q.color}"><small>${esc(where)}</small><h4>${esc(name)}</h4><p class="grade-upgrade-target">→ ${esc(info.nextBaseName)}</p><p>当前：${esc(formatEquipItemStatsV286813(name))}</p>${info.isForged?`<p>继承强化 +${info.forgeLevel} · ${esc(forgeAffixTextV2825(info.record.affixes))}${info.record.pending?`<br>待选词条亦保留：${esc(forgeAffixTextV2825(info.record.pending))}`:''}</p>`:''}<p>穿戴需${esc(CULTIVATION_REALMS[info.realmRequired]?.name||'对应境界')}${!realm.ok?(kind==='bag'?' · 升品后先存放背包':' · 当前境界不足'):''}</p><p>${esc(cost)}${!enough?` · 现有${player.gold}灵石`:''}${!unique?' · 铭器记录重复，请先恢复有效存档':''}</p><button type="button" class="choice-btn" ${realmOk&&enough&&unique?'':'disabled'} onclick="executeGradeUpgradeV2869('${source}',${nonce})">${info.hasBagFodder?'消耗胚子升品':'补差价升品'}${info.isForged?'并继承':''}</button></article>`;
  }
  html+='<div class="grade-upgrade-actions"><button class="choice-btn" onclick="closeWorldOverlay();showEquipmentPanel()">返回装备栏</button><button class="choice-btn" onclick="showForgeV2825()">强化 / 洗练</button><button class="choice-btn" onclick="closeWorldOverlay()">返回地图</button></div></section>';
  showStory(html,[]);
  const story=document.getElementById('storyPanel');story?.classList.add('equipment-bag-view-v2803','equipment-bag-expanded-v2803');if(story)story.scrollTop=0;
  gradeUpgradeSessionV2869={owner:player,nonce,index,rows,panel:document.getElementById('gradeUpgradePanelV2869'),fingerprint:gradeUpgradeFingerprintV2869(),busy:false};
}

// 初始化锁定字段；旧存档无需迁移结构，下一次保存会自动写入 player。
try{ensureEquipmentManagerState();}catch(_){ }

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-12-v277equipmentmanager.js"]="28.68.68";

const LOADOUT_NAMES_V2870=['方案一·日常','方案二·爆发','方案三·护体'];
function saveLoadoutPresetV2870(index){
 if(!petBatchAllowedV286845()||!Number.isInteger(index)||index<0||index>2)return false;
 const owner=player,old=player.loadoutPresetsV2870;
 if(old?.[index]&&!confirm('覆盖这套已保存的装备与功法方案？'))return false;
 if(player!==owner||!petBatchAllowedV286845())return false;
 const next=Array.from({length:3},(_,i)=>old?.[i]||null);
 next[index]={equipment:{...player.equipment},skills:sanitizeSkillLoadoutV212(player.skillLoadoutV212,player,!player.skillLoadoutInitializedV212)};
 player.loadoutPresetsV2870=next;
 if(!saveGame()){if(old===undefined)delete player.loadoutPresetsV2870;else player.loadoutPresetsV2870=old;return false;}
 showEquipmentPanel();return true;
}
function applyLoadoutPresetV2870(index){
 if(!petBatchAllowedV286845()||!Number.isInteger(index)||index<0||index>2)return false;
 const preset=player.loadoutPresetsV2870?.[index];if(!preset?.equipment||typeof preset.equipment!=='object'||Array.isArray(preset.equipment))return false;
 if(Object.keys(preset.equipment).some(k=>!Object.hasOwn(EQUIPMENT_SLOTS,k)))return false;
 const pool=[...(player.equipmentInventory||[]),...Object.values(player.equipment||{}).filter(Boolean)],equipment=createEmptyEquipmentSlots();
 for(const slot of Object.keys(EQUIPMENT_SLOTS)){
   const wanted=preset.equipment[slot]||null,old=player.equipment?.[slot];
   if(old&&isEquipmentLocked(old)&&old!==wanted){showFloatingText('方案会更换锁定装备，请先解锁','#ff8a80');return false;}
   if(!wanted)continue;
   const at=pool.indexOf(wanted),data=getEquipData(wanted);
   if(typeof wanted!=='string'||at<0||!isEquipSlotUnlocked(slot)||!getAllowedSlotsForEquip(data).includes(slot)||!canEquipItem(wanted).ok){showFloatingText('方案装备缺失、已升品或不可穿戴，请重新保存方案','#ff8a80');return false;}
   equipment[slot]=wanted;pool.splice(at,1);
 }
 const old={equipment:player.equipment,bag:player.equipmentInventory,skills:player.skillLoadoutV212,initialized:player.skillLoadoutInitializedV212,hp:player.hp,mp:player.mp,bonuses:player.activeSetBonuses};
 player.equipment=equipment;player.equipmentInventory=pool;player.skillLoadoutV212=sanitizeSkillLoadoutV212(preset.skills,player,false);player.skillLoadoutInitializedV212=true;
 checkSetBonuses();player.hp=Math.min(player.hp,getMaxHp());player.mp=Math.min(player.mp,getMaxMp());
 if(!saveGame()){player.equipment=old.equipment;player.equipmentInventory=old.bag;player.skillLoadoutV212=old.skills;player.skillLoadoutInitializedV212=old.initialized;player.hp=old.hp;player.mp=old.mp;player.activeSetBonuses=old.bonuses;return false;}
 updateStats();updateWorldHUD();showEquipmentPanel();showFloatingText('配装与已学功法已切换','#69f0ae');return true;
}
function renderLoadoutPresetsV2870(){return '<section id="equipPresetsBarV2870"><h3>装备与功法预设</h3><p>按原装备精确匹配；缺件或已升品时停止切换，现有装备不受影响。</p>'+LOADOUT_NAMES_V2870.map((name,i)=>`<div style="margin:8px 0"><b>${name}</b> · ${player.loadoutPresetsV2870?.[i]?'已保存':'未保存'} <button class="panel-action-btn" style="min-height:44px" onclick="saveLoadoutPresetV2870(${i})">保存当前</button><button class="panel-action-btn" style="min-height:44px" ${player.loadoutPresetsV2870?.[i]?'':'disabled'} onclick="applyLoadoutPresetV2870(${i})">启用</button></div>`).join('')+'</section>';}
