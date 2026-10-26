// ===== V27.8 灵宠界面 / 存档身份 / 培养体验优化 =====
let petFeedOpenId = null;
function createPetRuntimeId(){return 'pet_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function ensurePetSystemState(target=player){
  if(!target)return;
  if(!Array.isArray(target.pets))target.pets=[];
  if(!target.petMaterials||typeof target.petMaterials!=='object')target.petMaterials={};
  // 先给列表中的每只宠物补稳定ID。
  target.pets.forEach(p=>{if(p&&!p._petId)p._petId=createPetRuntimeId()});
  // JSON存档会让 activePet 成为一个独立对象；通过ID重新绑定回宠物列表。
  if(target.activePet){
    let linked=null;
    if(target.activePet._petId)linked=target.pets.find(p=>p?._petId===target.activePet._petId)||null;
    if(!linked&&!target.activePet._petId){
      const matches=target.pets.filter(p=>p&&p.type===target.activePet.type&&p.name===target.activePet.name&&Number(p.level||1)===Number(target.activePet.level||1)&&Number(p.exp||0)===Number(target.activePet.exp||0));
      linked=matches.length===1?matches[0]:null;
    }
    target.activePet=linked;
  }
}
function getPetById(id){ensurePetSystemState();return player.pets.find(p=>p?._petId===id)||null}
function getPetIndexById(id){ensurePetSystemState();return player.pets.findIndex(p=>p?._petId===id)}
function getPetAttackPreview(pet){const t=pet&&PET_TYPES[pet.type];return t?Math.max(1,Math.floor(t.baseAtk+Number(pet.level||1)*t.growthAtk)):0}
function getPetTalentText(pet){
  const t=pet&&PET_TYPES[pet.type];if(!t)return '未知天赋';const lv=Math.max(1,Number(pet.level)||1);
  switch(t.bonus?.type){
    case 'crit': return `主人暴击率 +${Math.round((t.bonus.value+lv*.01)*100)}%`;
    case 'def': return `主人防御 +${Math.floor(t.bonus.value+lv*3)}`;
    case 'atk': return `主人攻击 +${Math.floor(t.bonus.value+lv*2)}`;
    case 'mpRegen': return `每回合恢复 ${Math.floor(t.bonus.value+lv*.5)} 点灵力`;
    case 'burn': return `灵宠攻击附带 ${Math.round(t.bonus.value*100)}% 灼烧伤害`;
    case 'freeze': return `${Math.round(t.bonus.value*100)}% 概率冻结敌人1回合`;
    default:return t.desc||'灵宠天赋';
  }
}
function getPetPower(pet){
  const t=pet&&PET_TYPES[pet.type];if(!t)return 0;const lv=Math.max(1,Number(pet.level)||1);let bonus=0;
  switch(t.bonus?.type){case'crit':bonus=(t.bonus.value+lv*.01)*180;break;case'def':bonus=t.bonus.value+lv*3;break;case'atk':bonus=(t.bonus.value+lv*2)*1.6;break;case'mpRegen':bonus=(t.bonus.value+lv*.5)*2;break;case'burn':bonus=t.bonus.value*70;break;case'freeze':bonus=t.bonus.value*100;break}
  return Math.round(getPetAttackPreview(pet)*2+lv*5+bonus);
}
function isActivePetV28(pet){return !!(player.activePet&&pet&&player.activePet._petId===pet._petId)}
function escapePetText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.showPets=function(){
  ensurePetSystemState();
  document.getElementById('storyPanel')?.classList.add('hidden');
  document.getElementById('combatPanel')?.classList.add('hidden');
  document.getElementById('alchemyPanel')?.classList.add('hidden');
  document.getElementById('petPanel')?.classList.remove('hidden');
  document.getElementById('artifactPanel')?.classList.add('hidden');
  updatePetPanel();gameState='pets';
};
window.togglePetFeedMenu=function(id){petFeedOpenId=petFeedOpenId===id?null:id;updatePetPanel()};
window.updatePetPanel=function(){
  ensurePetSystemState();
  const pets=player.pets||[], active=player.activePet;
  const summary=document.getElementById('petCollectionSummary');
  if(summary)summary.textContent=`灵宠 ${pets.length}/5 · ${active?`出战：${active.name} Lv.${active.level}`:'当前无出战灵宠'}`;
  const cap=document.getElementById('petCapacityBadge');if(cap)cap.textContent=`${pets.length} / 5`;
  const spotlight=document.getElementById('activePetSpotlight');
  if(spotlight){
    if(active){const t=PET_TYPES[active.type]||{icon:'🐾'};spotlight.innerHTML=`<div class="pet-active-card"><div class="pet-active-avatar">${t.icon||'🐾'}</div><div><div class="pet-active-name">正在出战 · ${escapePetText(active.name)} <span class="pet-level-chip">Lv.${active.level}</span></div><div class="pet-active-desc">${escapePetText(getPetTalentText(active))}</div></div><div class="pet-active-power">灵宠战力<b>${getPetPower(active)}</b></div></div>`}
    else spotlight.innerHTML='<div class="pet-active-card empty">尚未选择出战灵宠 · 选择一只灵宠即可获得战斗加成</div>';
  }
  const list=document.getElementById('petList');
  if(list){
    if(!pets.length)list.innerHTML='<div class="pet-empty-v28">暂无灵宠。探索、普通战斗都有机会与灵宠结缘。</div>';
    else list.innerHTML=pets.map(pet=>{
      const t=PET_TYPES[pet.type]||{icon:'🐾',name:pet.type||'灵宠'};const activeNow=isActivePetV28(pet);const lv=Math.max(1,Number(pet.level)||1);const need=lv*30;const exp=Math.max(0,Number(pet.exp)||0);const pct=Math.max(0,Math.min(100,exp/Math.max(1,need)*100));const feedOpen=petFeedOpenId===pet._petId;
      const feedButtons=Object.entries(PET_FOOD).map(([name,food])=>{const count=Math.max(0,Number(player.petMaterials?.[name])||0);return `<button class="pet-feed-btn" ${count?'':'disabled'} onclick="feedPetById('${pet._petId}','${name}')">${escapePetText(name)} ×${count}<br><b>+${food.exp}经验</b></button>`}).join('');
      return `<div class="pet-card-v28 ${activeNow?'active':''}">${activeNow?'<span class="pet-active-tag">出战中</span>':''}<div class="pet-avatar-v28">${t.icon||'🐾'}</div><div><div class="pet-name-v28">${escapePetText(pet.name)}<span class="pet-level-chip">Lv.${lv}</span></div><div class="pet-stat-row-v28"><span class="pet-stat-chip-v28">⚔ ${getPetAttackPreview(pet)}</span><span class="pet-stat-chip-v28">战力 ${getPetPower(pet)}</span></div><div class="pet-bonus-v28">${escapePetText(getPetTalentText(pet))}</div></div><div class="pet-exp-wrap"><div class="pet-exp-line"><span>成长经验</span><span>${exp} / ${need}</span></div><div class="pet-exp-track"><div class="pet-exp-fill" style="width:${pct.toFixed(1)}%"></div></div></div><div class="pet-actions-v28"><button class="pet-action-v28 ${activeNow?'active':''}" onclick="setActivePetById('${pet._petId}')">${activeNow?'✓ 已出战':'⚔ 出战'}</button><button class="pet-action-v28 secondary" onclick="togglePetFeedMenu('${pet._petId}')">🍖 ${feedOpen?'收起培养':'培养'}</button></div>${feedOpen?`<div class="pet-feed-menu">${feedButtons}</div>`:''}</div>`;
    }).join('');
  }
  const mat=document.getElementById('petMaterialInventory');
  if(mat){const entries=Object.entries(PET_FOOD);mat.innerHTML=entries.map(([name,food])=>`<span class="pet-material-chip-v28">🍖 ${escapePetText(name)} <b>×${Math.max(0,Number(player.petMaterials?.[name])||0)}</b> · +${food.exp}经验</span>`).join('')}
};
window.setActivePetById=function(id){
  ensurePetSystemState();const pet=getPetById(id);if(!pet)return;
  player.activePet=isActivePetV28(pet)?null:pet;
  petFeedOpenId=null;updatePetPanel();updateStats();autoSave();
  showFloatingText?.(player.activePet?`🐾 ${pet.name} 已出战`:`↩️ ${pet.name} 已休战`,player.activePet?'#7ff0c0':'#d5bd86');
};
window.setActivePet=function(index){ensurePetSystemState();const pet=player.pets[index];if(pet)setActivePetById(pet._petId)};
window.feedPetById=function(id,foodName){const i=getPetIndexById(id);if(i>=0)feedPet(i,foodName)};
window.feedPet=function(index,foodName){
  ensurePetSystemState();const pet=player.pets[index];const food=PET_FOOD[foodName];const count=Math.max(0,Number(player.petMaterials?.[foodName])||0);if(!pet||!food||count<=0)return;
  player.petMaterials[foodName]=count-1;if(player.petMaterials[foodName]<=0)delete player.petMaterials[foodName];
  pet.exp=Math.max(0,Number(pet.exp)||0)+Number(food.exp||0);let gained=0,safety=0;
  while(safety++<50){const need=Math.max(1,Number(pet.level||1)*30);if(pet.exp<need)break;pet.exp-=need;pet.level=Math.max(1,Number(pet.level)||1)+1;gained++}
  if(gained){playSound?.('levelup');showFloatingText?.(`🎉 ${pet.name} 提升 ${gained} 级 → Lv.${pet.level}`,'#8ff0cf')}else showFloatingText?.(`🍖 ${pet.name} 经验 +${food.exp}`,'#d9c98e');
  updatePetPanel();updateStats?.();autoSave();
};

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-13-feature-13.js"]="28.68.57";
