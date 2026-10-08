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
    ITEMS['玄玉护脉丹']={type:'heal',value:150,desc:'寒玉护脉，恢复150点生命',icon:'💠'};
    ITEMS['幽冥悟道丹']={type:'exp',value:260,desc:'炼化幽冥之气，增加260点修为',icon:'🌑'};
    ITEMS['血玉淬体丹']={type:'exp',value:180,desc:'以龙血果与血玉淬炼，增加180点修为',icon:'❤️‍🔥'};
  }
  if(typeof RECIPES!=='undefined'){
    RECIPES['冰魄丹']={materials:{'雪莲':2,'冰晶石':1},baseSuccess:.78,result:'冰魄丹',desc:'恢复80点灵力',alchemyLevelRequired:2};
    RECIPES['玄玉护脉丹']={materials:{'万年寒玉':1,'仙灵草':2},baseSuccess:.64,result:'玄玉护脉丹',desc:'恢复150点生命',alchemyLevelRequired:4};
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
          btn.textContent='🧰 打开材料工坊';
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
      inv.innerHTML=`<span class="material-tag material-stone">💰 灵石 x${player.gold||0}</span>${chips||'<span style="color:#888;margin-left:6px">暂无可用强化材料</span>'}<div style="font-size:10px;color:#8f99a4;margin-top:6px">强化现在直接消耗储物袋材料，不再使用独立材料库存。</div>`;
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
  function matText(req){return Object.entries(req||{}).map(([n,c])=>{const h=player.materials?.[n]||0;return `<span style="color:${h>=c?'#69f0ae':'#ff8a80'}">${MATERIALS?.[n]?.icon||'🌿'} ${n} ${h}/${c}</span>`;}).join(' · ');}

  window.showMaterialWorkshop=function(filter='all'){
    unifyLegacyMaterialPools();
    let html='<p style="font-size:18px;font-weight:850;color:#f2d68d">🧰 材料工坊</p><p style="font-size:11px;color:#9ca8b6">所有基础材料统一放在储物袋中。炼丹、御兽、炼器、法宝强化、宗门任务会真正消耗对应材料。</p>';
    const choices=[];
    if(filter==='all'){
      html+='<div style="padding:8px;border:1px solid rgba(126,201,255,.18);border-radius:10px;margin:8px 0"><b style="color:#7ec9ff">🔥 丹药炼制</b><div style="font-size:11px;color:#9ca8b6;margin-top:3px">普通材料与四域珍材均已加入丹方，包括冰魄丹、玄玉护脉丹、幽冥悟道丹、血玉淬体丹。</div></div>';
      choices.push({text:'🔥 前往炼丹',action:'alchemy'});
    }
    if(filter==='all'||filter==='pet'){
      html+='<p style="color:#76e0d0;font-weight:800;margin-top:10px">🐾 灵宠培养材料</p>';
      for(const [id,r] of Object.entries(PET_MATERIAL_RECIPES)){
        const ok=hasMaterials(r.materials);html+=`<div style="padding:7px 8px;margin:5px 0;border:1px solid rgba(118,224,208,.16);border-radius:9px"><b>${r.name}</b> · <span style="font-size:10px;color:#aaa">${r.desc}</span><div style="font-size:10px;margin-top:3px">${matText(r.materials)}</div></div>`;
        choices.push({text:`${ok?'🧪':'🔒'} 炼制 ${r.name}`,action:'material_pet_craft',recipeId:id,condition:()=>hasMaterials(PET_MATERIAL_RECIPES[id].materials)});
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
    showStory(html,choices);
  };

  window.craftPetMaterialRecipe=function(id){
    const r=PET_MATERIAL_RECIPES[id];if(!r||!hasMaterials(r.materials)){showFloatingText?.('❌ 培养材料不足','#ff6b6b');return showMaterialWorkshop('pet');}
    consumeMaterials(r.materials);player.petMaterials=player.petMaterials||{};player.petMaterials[r.output]=(player.petMaterials[r.output]||0)+(r.count||1);
    showFloatingText?.(`🧪 炼制 ${r.output} ×${r.count||1}`,'#69f0ae');autoSave?.();showMaterialWorkshop('pet');
  };
  window.forgeMaterialEquipment=function(id){
    const r=MATERIAL_FORGE_RECIPES[id];if(!r)return;
    if((player.level||0)<r.realm){showFloatingText?.(`🔒 需要 ${CULTIVATION_REALMS?.[r.realm]?.name||'更高境界'}`,'#ff8a80');return showMaterialWorkshop('forge');}
    if(!hasMaterials(r.materials)||(player.gold||0)<r.gold){showFloatingText?.('❌ 锻造材料或灵石不足','#ff6b6b');return showMaterialWorkshop('forge');}
    if(typeof EQUIPMENT_DB!=='undefined'&&!EQUIPMENT_DB[r.result]){showFloatingText?.('❌ 装备数据不存在','#ff6b6b');return;}
    consumeMaterials(r.materials);player.gold-=r.gold;player.equipmentInventory=player.equipmentInventory||[];player.equipmentInventory.push(r.result);
    showFloatingText?.(`⚒️ 锻造成功：${r.result}`,'#ffd76a');playSound?.('item');updateStats?.();updateWorldHUD?.();autoSave?.();showMaterialWorkshop('forge');
  };

  // 进入世界或打开相关面板时自动迁移旧档中的法宝材料。
  const oldEnableWorldMode=window.enableWorldMode;
  window.enableWorldMode=function(){unifyLegacyMaterialPools();const out=oldEnableWorldMode?.apply(this,arguments);updateWorldHUD?.();return out;};
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-08-feature-08.js"]="28.68.33";
