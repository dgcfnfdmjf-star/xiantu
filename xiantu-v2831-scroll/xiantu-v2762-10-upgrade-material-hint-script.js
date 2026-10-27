(function(){
  function ensureUnified(){ try{window.unifyLegacyMaterialPools?.();}catch(_){} }
  function getArtifactUpgradeCheck(art){
    ensureUnified();
    const type=art&&ARTIFACT_TYPES?.[art.type];
    if(!art||!type) return {ok:false,max:false,missing:['法宝数据异常'],requirements:[]};
    if((art.level||0)>=type.maxLevel) return {ok:false,max:true,missing:[],requirements:[]};
    const lv=Math.max(1,Number(art.level)||1), requirements=[], missing=[];
    for(const [mat,base] of Object.entries(type.upgradeCost||{})){
      const need=Math.max(0,Number(base)||0)*lv;
      const have=mat==='灵石' ? Math.max(0,Number(player?.gold)||0) : Math.max(0,Number(player?.materials?.[mat])||0);
      const row={mat,need,have,lack:Math.max(0,need-have)};requirements.push(row);
      if(row.lack>0) missing.push(row);
    }
    return {ok:missing.length===0,max:false,missing,requirements};
  }
  function upgradeRequirementText(check, html=false){
    if(check.max) return html?'<span class="max">已满级</span>':'已满级';
    return check.requirements.map(r=>{
      const icon=r.mat==='灵石'?'💰':(MATERIALS?.[r.mat]?.icon||'💎');
      if(html) return `<span class="${r.lack?'lack':'ok'}">${icon}${r.mat} ${r.have}/${r.need}</span>`;
      return `${icon}${r.mat} ${r.have}/${r.need}`;
    }).join(html?' · ':'、');
  }
  function showUpgradeMissing(art,check){
    if(check.max){
      window.showFloatingText?.(`✨ ${art?.name||'法宝'} 已强化至最高等级`,'#ffd76a');
      return;
    }
    if(!check.missing.length) return;
    const msg=check.missing.map(r=>`${r.mat}缺${r.lack}（现有${r.have}/需要${r.need}）`).join('、');
    window.showFloatingText?.(`❌ 强化材料不足：${msg}`,'#ff6b6b');
    if(typeof window.showStory==='function'){
      const rows=check.requirements.map(r=>{
        const icon=r.mat==='灵石'?'💰':(MATERIALS?.[r.mat]?.icon||'💎');
        return `<div style="display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)"><span>${icon} ${r.mat}</span><span style="color:${r.lack?'#ff8a80':'#69f0ae'}">${r.have} / ${r.need}${r.lack?`　缺 ${r.lack}`:'　✓'}</span></div>`;
      }).join('');
      window.showStory(`<p style="font-size:17px;color:#ffd76a;font-weight:800">⚒️ ${art.name} +${art.level} 强化材料不足</p><p style="font-size:11px;color:#aaa">补齐以下材料后即可强化：</p><div style="margin-top:8px">${rows}</div>`,[{text:'← 返回法宝强化',action:'artifacts'}]);
    }
  }

  window.getArtifactUpgradeCheck=getArtifactUpgradeCheck;

  // 材料不足时也允许点击“强化”，点击后明确告诉玩家缺什么。
  const prevCanUpgrade=window.canUpgradeArtifact;
  window.canUpgradeArtifact=function(art){ return getArtifactUpgradeCheck(art).ok; };

  window.upgradeArtifact=function(index){
    if(gameState==='combat'||gameState==='combat-ending'||player?.breakthrough?.isAnimating)return;
    ensureUnified();
    const art=player?.artifacts?.[index], type=art&&ARTIFACT_TYPES?.[art.type];
    if(!art||!type){window.showFloatingText?.('❌ 法宝数据异常','#ff6b6b');return;}
    const check=getArtifactUpgradeCheck(art);
    if(!check.ok){showUpgradeMissing(art,check);return;}
    for(const r of check.requirements){
      if(r.mat==='灵石') player.gold=Math.max(0,(player.gold||0)-r.need);
      else {
        player.materials[r.mat]=Math.max(0,(player.materials?.[r.mat]||0)-r.need);
        if(player.materials[r.mat]<=0) delete player.materials[r.mat];
      }
    }
    art.level=(art.level||1)+1;
    window.showFloatingText?.(`✨ ${art.name} 强化成功 → +${art.level}`,'#ffd76a');
    window.playSound?.('item');window.updateArtifactPanel?.();window.updateStats?.();window.updateWorldHUD?.();window.autoSave?.();
  };

  window.getArtifactUpgradePlanV286845=function(art){
    ensureUnified();const type=art&&ARTIFACT_TYPES[art.type],costs={};let levels=0;
    if(!type)return {levels,costs};
    for(let level=Math.max(1,Number(art.level)||1);level<type.maxLevel;level++){
      const requirements=Object.entries(type.upgradeCost||{}).map(([mat,base])=>({mat,need:Math.max(0,Number(base)||0)*level}));
      if(requirements.some(({mat,need})=>(costs[mat]||0)+need>Math.max(0,Number(mat==='灵石'?player.gold:player.materials?.[mat])||0)))break;
      for(const {mat,need}of requirements)costs[mat]=(costs[mat]||0)+need;
      levels++;
    }
    return {levels,costs};
  };
  window.upgradeArtifactMaxV286845=function(index){
    if(!Number.isInteger(index)||!forgeAllowedV2825())return false;
    const art=player?.artifacts?.[index],plan=getArtifactUpgradePlanV286845(art);
    if(!plan.levels){if(art)showUpgradeMissing(art,getArtifactUpgradeCheck(art));return false;}
    for(const [mat,need]of Object.entries(plan.costs)){
      if(mat==='灵石')player.gold-=need;
      else {player.materials[mat]-=need;if(player.materials[mat]<=0)delete player.materials[mat];}
    }
    art.level=(Number(art.level)||1)+plan.levels;
    window.showFloatingText?.(`✨ ${art.name} 连续强化 ${plan.levels} 级 → +${art.level}`,'#ffd76a');
    window.playSound?.('item');window.updateArtifactPanel?.();window.updateStats?.();window.updateWorldHUD?.();window.autoSave?.();return true;
  };

  const prevUpdate=window.updateArtifactPanel;
  window.updateArtifactPanel=function(){
    ensureUnified();
    const out=prevUpdate?.apply(this,arguments);
    const list=document.getElementById('artifactList');
    if(!list||!player?.artifacts) return out;
    const cards=[...list.querySelectorAll('.artifact-card')];
    cards.forEach((card,index)=>{
      const art=player.artifacts[index]; if(!art)return;
      const check=getArtifactUpgradeCheck(art);
      const buttons=[...card.querySelectorAll('.artifact-btn')];
      const btn=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('upgradeArtifact')) || buttons[1];
      if(btn){
        btn.disabled=!!check.max;
        btn.classList.toggle('material-lack',!check.ok&&!check.max);
        btn.textContent=check.max?'已满级':(check.ok?'强化':'材料不足');
        btn.title=check.max?'已达到最高强化等级':upgradeRequirementText(check,false);
      }
      const plan=getArtifactUpgradePlanV286845(art);
      const maxBtn=document.createElement('button');maxBtn.className='artifact-btn artifact-max-btn-v286845';
      maxBtn.textContent=plan.levels?`一键强化 · +${plan.levels}级`:'一键强化';maxBtn.disabled=!plan.levels;
      maxBtn.title=plan.levels?'合计消耗：'+Object.entries(plan.costs).map(([mat,count])=>`${mat} ×${count}`).join('、'):'材料不足或已满级';
      maxBtn.onclick=()=>{if(player.artifacts?.[index]===art)upgradeArtifactMaxV286845(index);};
      card.querySelector('.artifact-max-btn-v286845')?.remove();const actions=btn?.parentNode||card;actions.classList.add('artifact-batch-actions-v286845');actions.appendChild(maxBtn);
      let hint=card.querySelector('.artifact-upgrade-cost-hint');
      if(!hint){hint=document.createElement('div');hint.className='artifact-upgrade-cost-hint';(card.querySelector('.artifact-info')||card).appendChild(hint);}
      hint.innerHTML=check.max?'<span class="max">✨ 已达到最高强化等级</span>':`本次强化：${upgradeRequirementText(check,true)}${plan.levels?'<br>连续强化共需：'+Object.entries(plan.costs).map(([mat,count])=>`${mat} ×${count}`).join(' · '):''}`;
    });
    return out;
  };

  // 材料工坊锻造失败也改成显示精确缺口，避免只说“材料或灵石不足”。
  const prevForge=window.forgeMaterialEquipment;
  if(typeof prevForge==='function'){
    window.forgeMaterialEquipment=function(id){
      const r=MATERIAL_FORGE_RECIPES?.[id];
      if(!r) return prevForge.apply(this,arguments);
      const lacks=[];
      if((player.level||0)<r.realm) lacks.push(`境界不足（需要${CULTIVATION_REALMS?.[r.realm]?.name||r.realm}）`);
      for(const [mat,needRaw] of Object.entries(r.materials||{})){
        const need=Number(needRaw)||0,have=Number(player.materials?.[mat])||0;
        if(have<need) lacks.push(`${mat}缺${need-have}（${have}/${need}）`);
      }
      const goldNeed=Number(r.gold)||0,goldHave=Number(player.gold)||0;
      if(goldHave<goldNeed) lacks.push(`灵石缺${goldNeed-goldHave}（${goldHave}/${goldNeed}）`);
      if(lacks.length){window.showFloatingText?.(`❌ 无法锻造：${lacks.join('、')}`,'#ff6b6b');return;}
      return prevForge.apply(this,arguments);
    };
  }
})();

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-10-upgrade-material-hint-script.js"]="28.68.63";
