// ================== V21 材料循环系统 ==================
(function(){
  const MATERIAL_USE_TEXT = {
    '灵草':'炼制还丹/聚灵丹 · 灵兽丹 · 宗门采药 · 苏晚晴赠礼',
    '仙果':'大还丹/聚灵丹 · 高级灵兽丹 · 长生类法宝 · 人物赠礼',
    '妖丹':'悟道丹/天元丹 · 高级/仙兽丹 · 聚灵类法宝 · 宗门委托',
    '血玉':'天元丹/血玉淬体丹 · 防御法宝强化 · 血玉戒/火葫芦锻造',
    '天心草':'天元丹核心药材，高阶修为丹用途',
    '龙血果':'血玉淬体丹 · 仙兽丹，主要用于高阶培养',
    '魔核':'幽冥悟道丹 · 雷系法宝强化 · 火葫芦锻造',
    '星辰砂':'飞剑/法宝强化 · 灵剑/血玉戒/星河梭锻造 · 宗门珍材任务',
    '雪莲':'冰魄丹 · 玄冰法袍锻造',
    '冰晶石':'冰魄丹 · 遁光法宝强化 · 玄冰法袍/星河梭锻造',
    '万年寒玉':'玄玉护脉丹 · 护心法宝强化 · 玄冰法袍/护心镜锻造',
    '仙灵草':'玄玉护脉丹 · 仙兽丹 · 聚灵法宝/护心镜锻造',
    '千年灵芝':'高级灵兽丹 · 长生类法宝强化',
    '兽骨':'灵兽丹 · 灵剑剑胚锻造',
    '灵木':'飞剑/乾坤类法宝强化 · 灵剑/星河梭锻造',
    '暗灵草':'幽冥悟道丹 · 火葫芦锻造',
    '幽冥花':'幽冥悟道丹的稀有主药'
  };
  window.getMaterialUseText = name => MATERIAL_USE_TEXT[name] || '可用于任务、炼丹、炼器或特殊交换';

  // 区域材料真正进入炼丹循环。
  if(typeof ITEMS!=='undefined'){
    ITEMS['冰魄丹']={type:'mp',value:80,desc:'北域寒气凝丹，恢复80点灵力',icon:'🧊'};
    ITEMS['玄玉护脉丹']={type:'heal',value:150,desc:'寒玉护脉，恢复150点气血',icon:'💠'};
    ITEMS['幽冥悟道丹']={type:'exp',value:260,desc:'炼化幽冥之气，增加260点修为',icon:'🌑'};
    ITEMS['血玉淬体丹']={type:'exp',value:180,desc:'以龙血果与血玉淬炼，增加180点修为',icon:'❤️‍🔥'};
  }
  if(typeof RECIPES!=='undefined'){
    RECIPES['冰魄丹']={materials:{'雪莲':2,'冰晶石':1},baseSuccess:.78,result:'冰魄丹',desc:'恢复80点灵力',alchemyLevelRequired:2};
    RECIPES['玄玉护脉丹']={materials:{'万年寒玉':1,'仙灵草':2},baseSuccess:.64,result:'玄玉护脉丹',desc:'恢复150点气血',alchemyLevelRequired:4};
    RECIPES['幽冥悟道丹']={materials:{'暗灵草':2,'幽冥花':1,'魔核':1},baseSuccess:.58,result:'幽冥悟道丹',desc:'增加260点修为',alchemyLevelRequired:4};
    RECIPES['血玉淬体丹']={materials:{'血玉':1,'龙血果':1,'灵草':2},baseSuccess:.66,result:'血玉淬体丹',desc:'增加180点修为',alchemyLevelRequired:3};
  }

  // 法宝强化统一消耗正式储物袋中的材料，不再另建一套隐藏库存。
  if(typeof ARTIFACT_TYPES!=='undefined'){
    if(ARTIFACT_TYPES['飞剑']) ARTIFACT_TYPES['飞剑'].upgradeCost={'星辰砂':1,'灵木':1,'灵石':100};
    if(ARTIFACT_TYPES['雷珠']) ARTIFACT_TYPES['雷珠'].upgradeCost={'星辰砂':1,'魔核':1,'灵石':180};
    if(ARTIFACT_TYPES['护心镜']) ARTIFACT_TYPES['护心镜'].upgradeCost={'血玉':1,'万年寒玉':1,'灵石':130};
    if(ARTIFACT_TYPES['遁光梭']) ARTIFACT_TYPES['遁光梭'].upgradeCost={'冰晶石':1,'星辰砂':1,'灵石':150};
    if(ARTIFACT_TYPES['乾坤袋']) ARTIFACT_TYPES['乾坤袋'].upgradeCost={'灵木':2,'灵石':180};
    if(ARTIFACT_TYPES['聚灵珠']) ARTIFACT_TYPES['聚灵珠'].upgradeCost={'妖丹':1,'仙灵草':1,'灵石':180};
    if(ARTIFACT_TYPES['长生锁']) ARTIFACT_TYPES['长生锁'].upgradeCost={'仙果':2,'千年灵芝':1,'灵石':120};
  }

  window.unifyLegacyMaterialPools = function(){
    if(!player) return;
    player.materials = player.materials || {};
    player.artifactMaterials = player.artifactMaterials || {};
    for(const [name,count] of Object.entries(player.artifactMaterials)){
      const n=Number(count)||0;
      if(n>0) player.materials[name]=(player.materials[name]||0)+n;
    }
    player.artifactMaterials={};
  };

  const oldShowMobileInventory = window.showMobileInventory;
  window.showMobileInventory = function(){
    unifyLegacyMaterialPools();
    return oldShowMobileInventory?.apply(this,arguments);
  };
  const oldRenderMobileInventory = window.renderMobileInventory;
  window.renderMobileInventory = function(){
    unifyLegacyMaterialPools();
    const out=oldRenderMobileInventory?.apply(this,arguments);
    if(typeof mobileInventoryTab!=='undefined' && mobileInventoryTab==='materials'){
      const card=document.getElementById('mobileInventoryCard');
      if(card){
        card.querySelectorAll('.mobile-inventory-item').forEach(row=>{
          const nameText=row.querySelector('.name')?.textContent||'';
          const matName=Object.keys(MATERIAL_USE_TEXT).find(n=>nameText.includes(n));
          const desc=row.querySelector('.desc');
          if(matName&&desc) desc.textContent=`用途：${getMaterialUseText(matName)}`;
        });
        const footer=card.querySelector('.mobile-inventory-footer');
        if(footer&&!card.querySelector('#materialWorkshopBtn')){
          const btn=document.createElement('button');
          btn.id='materialWorkshopBtn';btn.className='choice-btn';btn.style.cssText='width:100%;margin:10px 0 0';
          btn.textContent='🧰 打开百艺工坊';
          btn.onclick=()=>{closeMobileInventory();showMaterialWorkshop('all');};
          footer.before(btn);
        }
      }
    }
    return out;
  };

  window.canUpgradeArtifact = function(art){
    if(!art||typeof ARTIFACT_TYPES==='undefined') return false;
    unifyLegacyMaterialPools();
    const artType=ARTIFACT_TYPES[art.type];if(!artType||art.level>=artType.maxLevel)return false;
    for(const [mat,count] of Object.entries(artType.upgradeCost||{})){
      const need=count*Math.max(1,art.level||1);
      if(mat==='灵石'){if((player.gold||0)<need)return false;}
      else if((player.materials?.[mat]||0)<need)return false;
    }
    return true;
  };
  window.upgradeArtifact = function(index){
    unifyLegacyMaterialPools();
    const art=player.artifacts?.[index], artType=art&&ARTIFACT_TYPES?.[art.type];if(!art||!artType)return;
    if(!canUpgradeArtifact(art)){showFloatingText?.('❌ 强化材料不足或已满级','#ff6b6b');return;}
    for(const [mat,count] of Object.entries(artType.upgradeCost||{})){
      const need=count*Math.max(1,art.level||1);
      if(mat==='灵石')player.gold=Math.max(0,(player.gold||0)-need);
      else {player.materials[mat]=(player.materials[mat]||0)-need;if(player.materials[mat]<=0)delete player.materials[mat];}
    }
    art.level++;showFloatingText?.(`✨ ${art.name} 强化至 +${art.level}`,'#ffd76a');playSound?.('item');
    updateArtifactPanel?.();updateStats?.();updateWorldHUD?.();autoSave?.();
  };
  const oldUpdateArtifactPanel=window.updateArtifactPanel;
  window.updateArtifactPanel=function(){
    unifyLegacyMaterialPools();
    const out=oldUpdateArtifactPanel?.apply(this,arguments);
    const inv=document.getElementById('artifactMaterialInventory');
    if(inv&&player){
      const names=['星辰砂','血玉','万年寒玉','冰晶石','灵木','魔核','妖丹','仙灵草','千年灵芝','仙果'];
      const chips=names.filter(n=>(player.materials?.[n]||0)>0).map(n=>`<span class="material-tag material-${MATERIALS?.[n]?.type||'stone'}">${MATERIALS?.[n]?.icon||'💎'} ${n} x${player.materials[n]}</span>`).join('');
      inv.innerHTML=`<span class="material-tag material-stone">💰 灵石 x${player.gold||0}</span>${chips||'<span style="color:#888;margin-left:6px">储物袋中暂无对应淬炼灵材</span>'}`;
    }
    return out;
  };

  const oldUpdatePetPanel=window.updatePetPanel;
  window.updatePetPanel=function(){
    const out=oldUpdatePetPanel?.apply(this,arguments);
    const inv=document.getElementById('petMaterialInventory');
    if(inv&&!document.getElementById('petMaterialCraftBtn')){
      const btn=document.createElement('button');btn.id='petMaterialCraftBtn';btn.className='pet-btn';btn.style.cssText='margin-left:8px';btn.textContent='🧪 材料炼制';
      btn.onclick=()=>showMaterialWorkshop('pet');inv.appendChild(btn);
    }
    return out;
  };

  const PET_MATERIAL_RECIPES={
    basic:{name:'灵兽丹',output:'灵兽丹',count:1,materials:{'灵草':2,'兽骨':1},desc:'普通灵宠培养，宠物经验 +20'},
    high:{name:'高级灵兽丹',output:'高级灵兽丹',count:1,materials:{'千年灵芝':1,'仙果':1,'妖丹':1},desc:'中阶灵宠培养，宠物经验 +50'},
    immortal:{name:'仙兽丹',output:'仙兽丹',count:1,materials:{'龙血果':1,'仙灵草':1,'妖丹':2},desc:'高阶灵宠培养，宠物经验 +100'}
  };
  const MATERIAL_FORGE_RECIPES={
    spirit_sword:{name:'灵剑',result:'灵剑',realm:2,gold:400,materials:{'灵木':3,'兽骨':2,'星辰砂':1},desc:'东域灵木作剑胎，星砂淬锋'},
    ice_robe:{name:'玄冰法袍',result:'玄冰法袍',realm:3,gold:650,materials:{'雪莲':3,'冰晶石':2,'万年寒玉':1},desc:'北域寒材织炼而成'},
    blood_ring:{name:'血玉戒',result:'血玉戒',realm:3,gold:500,materials:{'血玉':2,'星辰砂':1},desc:'血玉凝煞，适合金丹修士'},
    fire_gourd:{name:'火葫芦',result:'火葫芦',realm:2,gold:450,materials:{'魔核':2,'暗灵草':2,'血玉':1},desc:'以西域魔材祭炼火道法宝'},
    heart_mirror:{name:'护心镜',result:'护心镜',realm:2,gold:550,materials:{'万年寒玉':1,'星辰砂':2,'仙灵草':1},desc:'寒玉定心，星砂成镜'},
    star_shuttle:{name:'星河梭',result:'星河梭',realm:4,gold:900,materials:{'星辰砂':3,'灵木':2,'冰晶石':2},desc:'高阶飞行法器，星砂为核'}
  };
  window.PET_MATERIAL_RECIPES=PET_MATERIAL_RECIPES;
  window.MATERIAL_FORGE_RECIPES=MATERIAL_FORGE_RECIPES;

  function hasMaterials(req){return Object.entries(req||{}).every(([n,c])=>(player.materials?.[n]||0)>=c);}
  function consumeMaterials(req){for(const [n,c] of Object.entries(req||{})){player.materials[n]=(player.materials[n]||0)-c;if(player.materials[n]<=0)delete player.materials[n];}}
  function maxPetCraftsV286846(r){
    const counts=Object.entries(r.materials).map(([n,c])=>Math.floor(Math.max(0,Number(player.materials?.[n])||0)/c));
    const max=Math.min(...counts);return Number.isSafeInteger(max)?max:0;
  }
  function matText(req){return Object.entries(req||{}).map(([n,c])=>{const h=player.materials?.[n]||0;return `<span style="color:${h>=c?'#69f0ae':'#ff8a80'}">${MATERIALS?.[n]?.icon||'🌿'} ${n} ${h}/${c}</span>`;}).join(' · ');}

  window.showMaterialWorkshop=function(filter='all'){
    unifyLegacyMaterialPools();
    let html='<p style="font-size:18px;font-weight:850;color:#f2d68d">🧰 百艺工坊</p><p style="font-size:11px;color:#9ca8b6">集四域天材地宝，于此炉中炼丹、育兽、铸器。</p>';
    const choices=[];
    if(filter==='all'){
      html+='<div style="padding:8px;border:1px solid rgba(126,201,255,.18);border-radius:10px;margin:8px 0"><b style="color:#7ec9ff">🔥 丹道炉火</b><div style="font-size:11px;color:#9ca8b6;margin-top:3px">以四域灵草珍材入药，可炼制冰魄丹、玄玉护脉丹、幽冥悟道丹、血玉淬体丹等灵丹。</div></div>';
      choices.push({text:'🔥 前往炼丹',action:'alchemy'});
    }
    if(filter==='all'||filter==='pet'){
      html+='<p style="color:#76e0d0;font-weight:800;margin-top:10px">🐾 灵宠培养材料</p>';
      for(const [id,r] of Object.entries(PET_MATERIAL_RECIPES)){
        const max=maxPetCraftsV286846(r);html+=`<div class="pet-craft-card-v286846" style="padding:7px 8px;margin:5px 0;border:1px solid rgba(118,224,208,.16);border-radius:9px"><b>${r.name}</b> · <span style="font-size:10px;color:#aaa">${r.desc}</span><div style="font-size:10px;margin-top:3px">每份：${matText(r.materials)}</div><p>持有 ${Number(player.petMaterials?.[r.output])||0} · 可炼 ${max} 份</p><div style="display:flex;flex-wrap:wrap;gap:6px">${[1,5,'all'].map(n=>`<button class="panel-action-btn" ${max>=(n==='all'?1:n)?'':'disabled'} onclick="craftPetMaterialBatchV286846('${id}',${n==='all'?"'all'":n})">${n==='all'?`全部（${max}）`:`×${n}`}</button>`).join('')}</div></div>`;
      }
    }
    if(filter==='all'||filter==='forge'){
      html+='<p style="color:#f1bd79;font-weight:800;margin-top:10px">⚒️ 材料锻造</p>';
      for(const [id,r] of Object.entries(MATERIAL_FORGE_RECIPES)){
        const realmOk=(player.level||0)>=r.realm,matOk=hasMaterials(r.materials),goldOk=(player.gold||0)>=r.gold;
        html+=`<div style="padding:7px 8px;margin:5px 0;border:1px solid rgba(241,189,121,.16);border-radius:9px"><b>${r.name}</b> · <span style="font-size:10px;color:#aaa">${r.desc}</span><div style="font-size:10px;margin-top:3px">${matText(r.materials)} · <span style="color:${goldOk?'#ffd76a':'#ff8a80'}">💰 ${player.gold||0}/${r.gold}</span> · <span style="color:${realmOk?'#69f0ae':'#ff8a80'}">境界 ${CULTIVATION_REALMS?.[r.realm]?.name||r.realm}</span></div></div>`;
        choices.push({text:`${realmOk&&matOk&&goldOk?'🔨':'🔒'} 锻造 ${r.name}`,action:'material_forge',recipeId:id,condition:()=>{const x=MATERIAL_FORGE_RECIPES[id];return (player.level||0)>=x.realm&&hasMaterials(x.materials)&&(player.gold||0)>=x.gold;}});
      }
    }
    choices.push({text:'← 返回地图',action:'return_to_map'});
    if(filter==='all')html+=renderMaterialRefineV2870();
    showStory(html,choices);
  };

  window.craftPetMaterialBatchV286846=function(id,mode=1){
    if(gameState==='start'||!forgeAllowedV2825()||![1,5,'all'].includes(mode)||!Object.hasOwn(PET_MATERIAL_RECIPES,id))return false;
    unifyLegacyMaterialPools();const r=PET_MATERIAL_RECIPES[id],max=maxPetCraftsV286846(r),count=mode==='all'?max:mode;
    if(count<1||max<count){showFloatingText?.('❌ 培养材料不足','#ff6b6b');showMaterialWorkshop('pet');return false;}
    const output=(r.count||1)*count,have=Number(player.petMaterials?.[r.output])||0;
    if(!Number.isSafeInteger(have+output))return false;
    consumeMaterials(Object.fromEntries(Object.entries(r.materials).map(([n,c])=>[n,c*count])));
    player.petMaterials=player.petMaterials||{};player.petMaterials[r.output]=have+output;
    showFloatingText?.(`🧪 炼制 ${r.output} ×${output}`,'#69f0ae');playSound?.('item');autoSave?.();showMaterialWorkshop('pet');return true;
  };
  window.craftPetMaterialRecipe=function(id){return craftPetMaterialBatchV286846(id,1);};
  window.getOwnedEquipTotalV2870=function(name){
    const canonical=n=>OLD_GEAR_ALIASES_V2792[n]||n;
    return [...(player.equipmentInventory||[]),...Object.values(player.equipment||{})].filter(n=>n&&canonical(getEquipData(n)?.forgeBaseV2825||n)===canonical(name)).length;
  };
  window.forgeMaterialEquipment=function(id){
    if(!petBatchAllowedV286845())return false;
    const r=MATERIAL_FORGE_RECIPES[id];if(!r)return;
    if((player.level||0)<r.realm){showFloatingText?.(`🔒 需要 ${CULTIVATION_REALMS?.[r.realm]?.name||'更高境界'}`,'#ff8a80');return showMaterialWorkshop('forge');}
    if(!hasMaterials(r.materials)||(player.gold||0)<r.gold){showFloatingText?.('❌ 锻造材料或灵石不足','#ff6b6b');return showMaterialWorkshop('forge');}
    if(typeof EQUIPMENT_DB!=='undefined'&&!EQUIPMENT_DB[r.result]){showFloatingText?.('❌ 装备数据不存在','#ff6b6b');return;}
    const owner=player;
    if(!confirm(`确定铸造【${r.name}】×1？\n已持有 ${getOwnedEquipTotalV2870(r.result)} 件（含穿戴及同底材铭器）\n材料：${Object.entries(r.materials).map(([n,c])=>n+'×'+c).join('、')}\n灵石：${r.gold}，铸造后剩余 ${player.gold-r.gold}`))return false;
    if(player!==owner||!petBatchAllowedV286845()||player.level<r.realm||!hasMaterials(r.materials)||player.gold<r.gold)return false;
    const gold=player.gold,materials={...player.materials},equipment=player.equipmentInventory.slice();
    consumeMaterials(r.materials);player.gold-=r.gold;player.equipmentInventory=player.equipmentInventory||[];player.equipmentInventory.push(r.result);
    if(!saveGame()){player.gold=gold;player.materials=materials;player.equipmentInventory=equipment;return false;}
    showFloatingText?.(`⚒️ 锻造成功：${r.result}`,'#ffd76a');playSound?.('item');updateStats?.();updateWorldHUD?.();showMaterialWorkshop('forge');return true;
  };

  // 进入世界或打开相关面板时自动迁移旧档中的法宝材料。
  const oldEnableWorldMode=window.enableWorldMode;
  window.enableWorldMode=function(){unifyLegacyMaterialPools();const out=oldEnableWorldMode?.apply(this,arguments);updateWorldHUD?.();return out;};
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-08-feature-08.js"]="28.68.76";

const MAT_REFINE_RECIPES_V2870={
 '仙灵草':{'灵草':5,'仙果':1},'千年灵芝':{'灵草':6,'兽骨':2},'星辰砂':{'妖丹':2,'灵木':2},'万年寒玉':{'冰晶石':3,'雪莲':1},'龙血果':{'仙果':3,'血玉':1}
};
function refineMaterialV2870(name){
 if(!petBatchAllowedV286845()||!Object.hasOwn(MAT_REFINE_RECIPES_V2870,name))return false;
 const inputs=MAT_REFINE_RECIPES_V2870[name],old=player.materials||{};
 if(!Object.entries(inputs).every(([n,c])=>Number.isFinite(old[n])&&old[n]>=c))return false;
 player.materials={...old};for(const [n,c] of Object.entries(inputs)){player.materials[n]-=c;if(!player.materials[n])delete player.materials[n];}
 player.materials[name]=(Number(player.materials[name])||0)+1;
 if(!saveGame()){player.materials=old;return false;}updateStats();showMaterialWorkshop('all');return true;
}
function renderMaterialRefineV2870(){return '<section id="matRefineBoxV2870"><h3>灵材萃炼</h3>'+Object.entries(MAT_REFINE_RECIPES_V2870).map(([n,inputs])=>`<p>${n} ×1 · 持有${Number(player.materials?.[n])||0}<br>${Object.entries(inputs).map(([k,c])=>`${k} ${Number(player.materials?.[k])||0}/${c}`).join(' + ')} <button class="panel-action-btn" style="min-height:44px" ${Object.entries(inputs).every(([k,c])=>player.materials?.[k]>=c)?'':'disabled'} onclick="refineMaterialV2870('${n}')">萃炼×1</button></p>`).join('')+'</section>';}
