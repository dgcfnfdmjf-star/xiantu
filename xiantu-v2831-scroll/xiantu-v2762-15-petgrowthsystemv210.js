// ===== V27.10 灵宠完整养成体系：升级 → 进阶 → 变异 → 进化 → 血脉返祖 =====
const PET_GROWTH_STAGES_V210=[
  {key:'initial',label:'初阶',quality:'common',levelCap:10,color:'#9e9e9e',passive:'灵躯凝实'},
  {key:'mortal',label:'凡阶',quality:'uncommon',levelCap:20,color:'#63bd6b',passive:'强体：基础战力提升'},
  {key:'spirit',label:'灵阶',quality:'rare',levelCap:30,color:'#61a9ff',passive:'灵威：技能伤害提升'},
  {key:'king',label:'王阶',quality:'epic',levelCap:45,color:'#c276e8',passive:'王息：战斗增幅提升'},
  {key:'emperor',label:'皇阶',quality:'legendary',levelCap:60,color:'#ffae54',passive:'皇血：全属性强化'},
  {key:'divine',label:'神阶',quality:'mythic',levelCap:80,color:'#ffd75b',passive:'神性：心境共鸣'}
];
const PET_GROWTH_QUALITY_STAGE_V210={common:0,uncommon:1,rare:2,epic:3,legendary:4,mythic:5};
const PET_EVOLUTION_ESSENCES_V210={
  '普通血脉精元':{rate:.35,label:'普通血脉',color:'#9fb7b1'},
  '优质血脉精元':{rate:.50,label:'优质血脉',color:'#72ce8c'},
  '极品血脉精元':{rate:.75,label:'极品血脉',color:'#77baff'}
};
if(!PET_FOOD['灵果'])PET_FOOD['灵果']={exp:35,desc:'宠物经验+35，并恢复灵宠巅峰状态'};
const PET_ADVANCE_MATERIALS_V210=['兽魂晶','魔魂晶','木灵液','水灵液','火灵液','雷灵液','风灵液'];
const PET_MUTATION_MATERIALS_V210=['变异灵晶','纯净灵髓'];
const PET_ENDGAME_MATERIALS_V210=['普通血脉精元','优质血脉精元','极品血脉精元','上古返祖灵珠','深渊魔核'];
const PET_ALL_GROWTH_MATERIALS_V210=[...PET_ADVANCE_MATERIALS_V210,...PET_MUTATION_MATERIALS_V210,...PET_ENDGAME_MATERIALS_V210];
const PET_STAGE_PASSIVES_V210=['凝灵','强体','灵威','王息','皇血','神性'];
const PET_MUTATION_TRAITS_V210={
  normal:[['灵敏', '速度+5%','speed',.05],['健体','生命成长+6%','hp',.06],['锐爪','攻击成长+5%','damage',.05],['厚甲','防御成长+5%','def',.05]],
  quality:[['破军','增伤+8%','damage',.08],['玄甲','减伤+8%','reduce',.08],['疾风','速度+10%','speed',.10],['灵抗','抗性+10%','resistance',.10]],
  epic:[['苍蓝战纹','技能伤害倍率+0.2','skill',.20],['真灵脉动','综合战力+18%','damage',.18],['御灵天骨','技能触发率+12%','speed',.12]],
  supreme:[['万灵共主','专属变异天赋：战斗增幅+35%','supreme',.35],['太古异血','专属变异天赋：血脉成长大幅提升','supreme',.35],['天命兽印','专属变异天赋：技能与进化共鸣','supreme',.35]]
};
const PET_SECOND_SKILLS_V210={灵狐:'幻影狐火',玄龟:'玄水镇岳',雷鹰:'雷羽天袭',仙鹤:'清霄灵羽',火凤:'凤焰燎原',冰龙:'玄冰龙息'};
let petGrowthOpenIdV210=null,petEvolutionOpenIdV210=null;

function petGameDayV210(){return Math.max(0,Number(player?.worldTime?.totalDays)||0)}
function petMatCountV210(name){return Math.max(0,Number(player?.petMaterials?.[name])||0)}
function givePetMatV210(name,count=1,log=true){if(!player.petMaterials||typeof player.petMaterials!=='object')player.petMaterials={};player.petMaterials[name]=(player.petMaterials[name]||0)+count;if(log)addCombatLog?.(`🐾 获得御兽材料【${name}】×${count}`,'pet')}
function consumePetMatsV210(cost={},pet=null){for(const [n,c] of Object.entries(cost))if(petMatCountV210(n)<c)return false;for(const [n,c] of Object.entries(cost)){player.petMaterials[n]-=c;if(player.petMaterials[n]<=0)delete player.petMaterials[n]}if(pet)recordPetInvestmentV286846(pet,cost);return true}
// Record actual paid quantities; neither captured levels nor battle XP create refunds.
function getPetInvestmentV286846(pet){
  const spent=pet?.investmentV286846,clean={};
  for(const name of [...Object.keys(PET_FOOD),...PET_ALL_GROWTH_MATERIALS_V210]){
    const n=spent?.[name];if(Number.isSafeInteger(n)&&n>0)clean[name]=n;
  }
  return clean;
}
function recordPetInvestmentV286846(pet,cost){
  const spent=getPetInvestmentV286846(pet);
  for(const [name,count] of Object.entries(cost))if(Number.isSafeInteger(count)&&count>0&&Number.isSafeInteger((spent[name]||0)+count))spent[name]=(spent[name]||0)+count;
  pet.investmentV286846=spent;
}
function getPetReleaseRefundV286846(pet){
  return Object.fromEntries(Object.entries(getPetInvestmentV286846(pet)).map(([name,n])=>[name,Math.floor(n/5)*4+Math.floor(n%5*4/5)]).filter(([,n])=>n>0));
}
function formatPetMatCostV210(cost={}){return Object.entries(cost).map(([n,c])=>`${n}×${c}`).join(' · ')}
function getPetElementV210(pet){const t=pet?.type||'';if(t==='火凤')return'火';if(t==='冰龙'||t==='玄龟')return'水';if(t==='雷鹰')return'雷';if(t==='仙鹤')return'风';return'木'}
function getPetAdvanceLiquidV210(pet){return `${getPetElementV210(pet)}灵液`}
function getOwnerPetLevelCapV210(){const realm=Math.max(0,Number(player?.level)||0),phase=Math.max(0,Number(player?.phase)||0);return Math.min(80,10+Math.max(realm,player.petRealmFloorV2793||0)*5+phase*2)}
function getPetStageV210(pet){ensurePetGrowthStateV210(pet);return PET_GROWTH_STAGES_V210[pet.growthStage]||PET_GROWTH_STAGES_V210[0]}
function getPetLevelCapV210(pet){return Math.max(1,Math.min(getPetStageV210(pet).levelCap,getOwnerPetLevelCapV210()))}
function getPetExpNeedV210(pet){return Math.max(30,Math.max(1,Number(pet?.level)||1)*30)}
function isDivinePetV210(pet){return !!pet&&(pet.quality==='mythic'||pet.isBonded||pet.growthStage>=5)}
function getPetCultivationLockV210(pet){ensurePetGrowthStateV210(pet);const now=petGameDayV210();if(Number(pet.cultivationLockUntilDay||0)>now)return Math.ceil(pet.cultivationLockUntilDay-now);return 0}
function getPetSpecificCooldownV210(pet,key){ensurePetGrowthStateV210(pet);const now=petGameDayV210(),until=Number(pet[key]||0);return until>now?Math.max(.5,until-now):0}
function getPetStageFromQualityV210(pet){return Math.max(0,Math.min(5,PET_GROWTH_QUALITY_STAGE_V210[String(pet?.quality||'common')]??0))}
function ensurePetGrowthStateV210(pet){
  if(!pet||typeof pet!=='object')return pet;
  if(!Number.isFinite(Number(pet.growthStage)))pet.growthStage=getPetStageFromQualityV210(pet);pet.growthStage=Math.max(0,Math.min(5,Math.floor(Number(pet.growthStage)||0)));
  pet.growthValue=Math.max(0,Math.min(100,Number(pet.growthValue)||0));pet.proficiency=Math.max(0,Math.min(100,Number(pet.proficiency)||0));pet.intimacy=Math.max(0,Math.min(100,Number(pet.intimacy??(pet.isBonded?60:25))||0));pet.vitality=Math.max(0,Math.min(100,(pet.vitality!=null&&Number.isFinite(Number(pet.vitality))?Number(pet.vitality):100)));
  pet.mutationCount=Math.max(0,Math.floor(Number(pet.mutationCount)||0));pet.mutationTier=String(pet.mutationTier||'none');pet.mutationPerfect=!!pet.mutationPerfect;pet.mutationTraits=Array.isArray(pet.mutationTraits)?pet.mutationTraits:[];pet.skillDamageBonus=Math.max(0,Number(pet.skillDamageBonus)||0);pet.baseStatMultiplier=Math.max(1,Number(pet.baseStatMultiplier)||1);
  pet.evolutionStage=Math.max(0,Math.min(2,Math.floor(Number(pet.evolutionStage)||0)));pet.bloodlineValue=Math.max(0,Math.min(100,Number(pet.bloodlineValue)||0));pet.bloodlineUnlocked=!!pet.bloodlineUnlocked||pet.evolutionStage>0;pet.perfectEvolution=!!pet.perfectEvolution||pet.evolutionStage>=2;
  pet.ancestralAwakened=!!pet.ancestralAwakened;pet.abyssForm=!!pet.abyssForm;pet.divineAncestryDone=!!pet.divineAncestryDone;pet.stagePassive=pet.stagePassive||PET_STAGE_PASSIVES_V210[pet.growthStage];pet.visualForm=Math.max(0,Math.floor(Number(pet.visualForm)||0));
  pet.ancestryPity=Number.isFinite(Number(pet.ancestryPity))?Math.max(0,Math.min(3,Math.floor(Number(pet.ancestryPity)))):0;
  pet.advanceCooldownUntilDay=Math.max(0,Number(pet.advanceCooldownUntilDay)||0);pet.evolutionCooldownUntilDay=Math.max(0,Number(pet.evolutionCooldownUntilDay)||0);pet.cultivationLockUntilDay=Math.max(0,Number(pet.cultivationLockUntilDay)||0);
  if(pet.isDemon&&!pet.mutationTraits.some(t=>t?.name==='嗜血'))pet.mutationTraits.push({name:'嗜血',desc:'魔宠天生词条：伤害+12%',key:'damage',value:.12,tier:'demon'});
  mergePetMutationTraitsV286849(pet);
  pet.quality=PET_GROWTH_STAGES_V210[pet.growthStage]?.quality||pet.quality||'common';return pet
}
function ensureAllPetGrowthV210(target=player){if(!target)return;ensurePetSystemState(target);target.petMaterials=target.petMaterials&&typeof target.petMaterials==='object'?target.petMaterials:{};(target.pets||[]).forEach(ensurePetGrowthStateV210);if(target.activePet)ensurePetGrowthStateV210(target.activePet)}

// 接入新档与旧档；不破坏 V27.8/V27.9 的稳定宠物ID与收服状态。
(function(){const c=window.createDefaultPlayer;if(typeof c==='function'&&!c._v210Growth){const w=function(){const p=c.apply(this,arguments);p.petMaterials=p.petMaterials||{};return p};w._v210Growth=true;window.createDefaultPlayer=w}const n=window.normalizePlayer;if(typeof n==='function'&&!n._v210Growth){const w=function(saved={}){const p=n.apply(this,arguments);ensureAllPetGrowthV210(p);return p};w._v210Growth=true;window.normalizePlayer=w}})();
ensureAllPetGrowthV210();

function petTraitBonusV210(pet,key){ensurePetGrowthStateV210(pet);return pet.mutationTraits.reduce((s,t)=>s+(t?.key===key?Number(t.value)||0:0),0)}
// Defensive mutation benefits apply only while this owned pet is active.
function getOwnerPetTraitBonusV286849(key){
  const pet=player?.pets?.find(p=>p&&p._petId===player.activePet?._petId);
  return pet?Math.max(0,petTraitBonusV210(pet,key)):0;
}
function petDefensiveTraitTextV286849(pet){
  return [['hp','主人气血上限'],['def','主人防御'],['reduce','主人命中减伤'],['resistance','主人威压控制抵抗']].map(([key,label])=>{const n=petTraitBonusV210(pet,key);return n?`${label}+${Number((n*100).toFixed(2))}${key==='hp'||key==='def'?'%':'个百分点'}`:''}).filter(Boolean).join(' · ');
}
function getPetGrowthCombatMultiplierV210(pet){ensurePetGrowthStateV210(pet);const stage=pet.growthStage,level=Math.max(1,Number(pet.level)||1);let m=pet.baseStatMultiplier*(1+stage*.08)*(1+Math.floor(level/5)*.03);m*=1+petTraitBonusV210(pet,'damage')+pet.skillDamageBonus;if(pet.evolutionStage===1)m*=1.5;if(pet.evolutionStage>=2)m*=2;if(pet.ancestralAwakened||pet.abyssForm)m*=1.8;if(isDivinePetV210(pet)){const attach=Math.max(0,Math.min(100,Number(player?.heartDemon?.attachment)||0));m*=1+(100-attach)/500}return m}
const v210CombatMultBase=window.getPetCombatMultiplier;
window.getPetCombatMultiplier=function(pet){const base=typeof v210CombatMultBase==='function'?v210CombatMultBase(pet):1;return base*getPetGrowthCombatMultiplierV210(pet)};
window.getPetAttackPreview=function(pet){if(!pet)return 0;ensurePetGrowthStateV210(pet);const t=PET_TYPES[pet.type]||{baseAtk:3,growthAtk:1};const lv=Math.max(1,Number(pet.level)||1),raw=(Number(t.baseAtk)||0)+lv*(Number(t.growthAtk)||1)+(Number(pet.stats?.atk)||0);return Math.max(1,Math.floor(raw*getPetCombatMultiplier(pet)))};
window.getPetPower=function(pet){if(!pet)return 0;ensurePetGrowthStateV210(pet);const q=getPetQualityInfo(pet.quality),atk=getPetAttackPreview(pet),def=(Number(pet.stats?.def)||0)*pet.baseStatMultiplier*(1+petTraitBonusV210(pet,'def')),hp=(Number(pet.stats?.hp)||0)*pet.baseStatMultiplier*(1+petTraitBonusV210(pet,'hp'))/(1-Math.min(.6,petTraitBonusV210(pet,'reduce'))),trait=pet.mutationTraits.reduce((n,t)=>n+t.level,0)*18,form=pet.evolutionStage*120+(pet.ancestralAwakened||pet.abyssForm?450:0);return Math.round(atk*2+def*1.5+hp*.22+pet.level*6+q.rarity*18+trait+form+Math.min(.6,petTraitBonusV210(pet,'resistance'))*100)};

function applyPetLevelGrowthV210(pet,levels=1){ensurePetGrowthStateV210(pet);pet.stats=pet.stats&&typeof pet.stats==='object'?pet.stats:{};const s=Math.max(1,levels),stage=pet.growthStage;pet.stats.atk=(Number(pet.stats.atk)||0)+Math.ceil(s*(1+stage*.25));pet.stats.def=(Number(pet.stats.def)||0)+Math.ceil(s*(.7+stage*.18));pet.stats.hp=(Number(pet.stats.hp)||0)+Math.ceil(s*(4+stage*1.2));pet.growthValue=Math.min(100,pet.growthValue+s*2);pet.proficiency=Math.min(100,pet.proficiency+s*2);if(s>0)pet.intimacy=Math.min(100,pet.intimacy+s*.5)}
function processPetLevelUpsV210(pet,show=true){ensurePetGrowthStateV210(pet);const cap=getPetLevelCapV210(pet);let gain=0,safe=0;while(safe++<100&&(pet.level||1)<cap){const need=getPetExpNeedV210(pet);if((pet.exp||0)<need)break;pet.exp-=need;pet.level++;gain++;applyPetLevelGrowthV210(pet,1)}if((pet.level||1)>=cap){const need=getPetExpNeedV210(pet);pet.exp=Math.min(Math.max(0,Number(pet.exp)||0),Math.max(0,need-1))}if(gain&&show){playSound?.('levelup');showFloatingText?.(`✨ ${pet.name} 连升 ${gain} 级 → Lv.${pet.level}`,'#8ff0cf');flashPetCardV210(pet._petId,'pet-stage-flare-v210')}return gain}
function grantPetExpV210(pet,amount,{growth=0,proficiency=0,intimacy=0,show=false}={}){if(!pet||amount<=0)return 0;ensurePetGrowthStateV210(pet);pet.exp=Math.max(0,Number(pet.exp)||0)+Math.floor(amount);pet.growthValue=Math.min(100,pet.growthValue+growth);pet.proficiency=Math.min(100,pet.proficiency+proficiency);pet.intimacy=Math.min(100,pet.intimacy+intimacy);const g=processPetLevelUpsV210(pet,show);return g}

// V27.10 喂养：遵守“阶段上限 + 主人境界上限”，同时增长熟练/成长/亲密。
window.feedPet=function(index,foodName){if(!petBatchAllowedV286845())return;ensureAllPetGrowthV210();const pet=player.pets[index],food=PET_FOOD[foodName],count=petMatCountV210(foodName);if(!pet||!food||count<=0)return;const lock=getPetCultivationLockV210(pet);if(lock){showFloatingText?.(`🔒 ${pet.name} 培养封禁还剩 ${lock} 天`,'#ff8c8c');return}const cap=getPetLevelCapV210(pet);if((pet.level||1)>=cap&&foodName!=='灵果'){const ownerCap=getOwnerPetLevelCapV210(),stageCap=getPetStageV210(pet).levelCap;showFloatingText?.(ownerCap<stageCap?`🔒 主人境界限制：灵宠当前最高 Lv.${cap}`:`📈 ${pet.name} 已达${getPetStageV210(pet).label}满级 Lv.${cap}，可准备进阶`,'#ffd879');return}player.petMaterials[foodName]=count-1;if(player.petMaterials[foodName]<=0)delete player.petMaterials[foodName];recordPetInvestmentV286846(pet,{[foodName]:1});grantPetExpV210(pet,Number(food.exp)||0,{growth:foodName==='仙兽丹'?6:foodName==='高级灵兽丹'?4:2,proficiency:foodName==='仙兽丹'?5:3,intimacy:1,show:true});pet.vitality=100;showFloatingText?.(`🍖 ${pet.name} 吸收${foodName}，${(pet.level||1)>=cap&&foodName==='灵果'?'恢复巅峰状态':`经验 +${food.exp}`}`,'#d9c98e');updatePetPanel?.();updateStats?.();autoSave?.()};
function petBatchAllowedV286845(){return !!player&&gameState!=='start'&&forgeAllowedV2825();}
function getPetFeedPlanV286845(pet,foodName){
  const food=PET_FOOD[foodName],cap=getPetLevelCapV210(pet),have=Math.floor(petMatCountV210(foodName));
  if(!food||!Number.isFinite(have)||have<=0||getPetCultivationLockV210(pet)||(pet.level||1)>=cap)return {count:0,cap};
  let needed=-(Number(pet.exp)||0);
  for(let level=pet.level||1;level<cap;level++)needed+=getPetExpNeedV210({...pet,level});
  const exp=Number(food.exp)||0;
  return {count:exp>0?Math.min(have,Math.max(1,Math.ceil(needed/exp))):0,cap};
}
window.feedPetMaxByIdV286845=function(id,foodName){
  if(!petBatchAllowedV286845())return false;
  ensureAllPetGrowthV210();const pet=getPetById(id);if(!pet)return false;
  const {count}=getPetFeedPlanV286845(pet,foodName),before=pet.level;if(!count)return false;
  for(let used=0;used<count;used++){
    player.petMaterials[foodName]--;if(player.petMaterials[foodName]<=0)delete player.petMaterials[foodName];
    recordPetInvestmentV286846(pet,{[foodName]:1});grantPetExpV210(pet,Number(PET_FOOD[foodName].exp)||0,{growth:foodName==='仙兽丹'?6:foodName==='高级灵兽丹'?4:2,proficiency:foodName==='仙兽丹'?5:3,intimacy:1,show:false});
  }
  pet.vitality=100;showFloatingText?.(`🍖 ${pet.name} 喂养 ${foodName} ×${count} · Lv.${before} → Lv.${pet.level}`,'#8ff0cf');
  playSound?.('item');updatePetPanel?.();updateStats?.();autoSave?.();return true;
};
function renderPetFeedBatchV286845(pet){
  return Object.keys(PET_FOOD).map(name=>{const plan=getPetFeedPlanV286845(pet,name);return plan.count>1?`<button class="pet-feed-btn pet-feed-max-v286845" onclick="feedPetMaxByIdV286845('${pet._petId}','${name}')">一键喂养 ${escapePetText(name)} ×${plan.count}<br><b>至 Lv.${plan.cap} 或用尽该食物</b></button>`:'';}).join('');
}
window.feedPetById=function(id,foodName){const i=getPetIndexById?.(id)??-1;if(i>=0)feedPet(i,foodName)};

function getPetAdvanceRateV210(pet){ensurePetGrowthStateV210(pet);let base=pet.growthStage<=1?.60:pet.growthStage===2?.45:.30;if(isDivinePetV210(pet))base=.12;return Math.min(.95,base+.05+getPetMindBonusV210(pet,.05))}
function getPetMindBonusV210(pet,max=.05){const a=Math.max(0,Math.min(100,Number(player?.heartDemon?.attachment)||50));return ((100-a)/100)*max}
function getPetAdvanceCostV210(pet){ensurePetGrowthStateV210(pet);const n=pet.growthStage+1,core=pet.isDemon?'魔魂晶':'兽魂晶';return{materials:{[core]:Math.max(1,n),[getPetAdvanceLiquidV210(pet)]:Math.max(1,Math.ceil(n/2))},gold:Math.round(180*n*n+120)}}
function canPetAdvanceV210(pet){ensurePetGrowthStateV210(pet);if(pet.growthStage>=5)return{ok:false,reason:'已达神阶'};const lock=getPetCultivationLockV210(pet);if(lock)return{ok:false,reason:`培养封禁 ${lock}天`};const cd=getPetSpecificCooldownV210(pet,'advanceCooldownUntilDay');if(cd)return{ok:false,reason:`进阶调息 ${Math.ceil(cd)}天`};const stageCap=getPetStageV210(pet).levelCap;if((pet.level||1)<stageCap)return{ok:false,reason:`需达到本阶满级 Lv.${stageCap}`};if(pet.growthValue<100||pet.proficiency<100)return{ok:false,reason:`成长/熟练需满值（${Math.floor(pet.growthValue)}/${Math.floor(pet.proficiency)}）`};const c=getPetAdvanceCostV210(pet);if(player.gold<c.gold)return{ok:false,reason:`灵石不足 ${c.gold}`};for(const [n,v] of Object.entries(c.materials))if(petMatCountV210(n)<v)return{ok:false,reason:`缺少${n}×${v}`};return{ok:true,cost:c,rate:getPetAdvanceRateV210(pet)}}
function advancePetByIdV210(id){if(!petBatchAllowedV286845())return false;const pet=getPetById?.(id);if(!pet)return;const c=canPetAdvanceV210(pet);if(!c.ok){showFloatingText?.(`❌ ${c.reason}`,'#ff7878');return}player.gold-=c.cost.gold;consumePetMatsV210(c.cost.materials,pet);const success=Math.random()<c.rate;if(success){pet.growthStage++;const st=PET_GROWTH_STAGES_V210[pet.growthStage];pet.quality=st.quality;pet.growthValue=0;pet.proficiency=0;pet.baseStatMultiplier*=1.18+pet.growthStage*.015;pet.stagePassive=PET_STAGE_PASSIVES_V210[pet.growthStage];pet.visualForm++;pet.stats=pet.stats||{};pet.stats.atk=Math.ceil((Number(pet.stats.atk)||1)*1.15+pet.growthStage*2);pet.stats.def=Math.ceil((Number(pet.stats.def)||1)*1.15+pet.growthStage);pet.stats.hp=Math.ceil((Number(pet.stats.hp)||20)*1.18+pet.growthStage*5);showPetGrowthResultV210(pet,true,'进阶',`【进阶成功！宠物品质提升！】<br>${pet.name} 已踏入 <b style="color:${st.color}">${st.label}</b>，解锁被动「${pet.stagePassive}」。`,'🌈');flashPetCardV210(id,'pet-stage-flare-v210')}else{if(!isDivinePetV210(pet))pet.level=Math.max(1,(pet.level||1)-5);pet.advanceCooldownUntilDay=petGameDayV210()+.5;showPetGrowthResultV210(pet,false,'进阶',`【进阶失败！】<br>灵气溃散，材料已消耗${isDivinePetV210(pet)?'，但神兽不会掉级':'，等级跌落5级'}；约半日内不可再次进阶。`,'💥')}autoSave?.();updatePetPanel?.();updateStats?.()}

function getMutationWeatherBonusV210(){let b=0;const d=typeof getGameDate==='function'?getGameDate():null;const moon=!!d&&d.day>=14&&d.day<=16;const rain=typeof isLingxiaoRainy==='function'&&isLingxiaoRainy();const night=typeof isLingxiaoNight==='function'&&isLingxiaoNight();if((moon&&night)||(rain&&night))b=.08;return b}
function canMutatePetV210(pet){ensurePetGrowthStateV210(pet);if(isDivinePetV210(pet)&&pet.mutationCount>=1)return{ok:false,reason:'神兽只允许一次极致异变'};if(pet.growthStage<2)return{ok:false,reason:'需达到灵阶以上'};const lock=getPetCultivationLockV210(pet);if(lock)return{ok:false,reason:`培养封禁 ${lock}天`};if(pet.vitality<100)return{ok:false,reason:'灵宠状态未达巅峰'};if(petMatCountV210('变异灵晶')<1||petMatCountV210('纯净灵髓')<1)return{ok:false,reason:'需要变异灵晶×1、纯净灵髓×1'};return{ok:true}}
function pickMutationTierV210(pet){const weather=getMutationWeatherBonusV210(),hero=.03,mind=getPetMindBonusV210(pet,.04),extra=weather+hero+mind;const supreme=.005+extra*.08,epic=.03+extra*.20,quality=.10+extra*.30,normal=.25+extra*.42;const r=Math.random();if(r<supreme)return'supreme';if(r<supreme+epic)return'epic';if(r<supreme+epic+quality)return'quality';if(r<supreme+epic+quality+normal)return'normal';return'fail'}
// Merge legacy duplicates without losing their accumulated bonuses; repeated normalization is idempotent.
function mergePetMutationTraitsV286849(pet){
  const merged=[],seen=new Map();
  for(const trait of pet.mutationTraits){
    if(!trait||typeof trait!=='object')continue;
    const key=JSON.stringify([trait.name,trait.key]),value=Number(trait.value);
    const level=Number.isFinite(Number(trait.level))?Math.max(1,Math.floor(Number(trait.level))):1;
    const existing=seen.get(key);
    if(existing){existing.value=Number((existing.value+(Number.isFinite(value)?Math.max(0,value):0)).toFixed(6));existing.level+=level;existing.desc=formatPetMutationTraitV286849(existing);}
    else{const t={...trait,value:Number.isFinite(value)?Math.max(0,value):0,level};merged.push(t);seen.set(key,t);}
  }
  pet.mutationTraits=merged;
}
function formatPetMutationTraitV286849(t){
  const labels={hp:'出战：主人气血上限',def:'出战：主人防御',damage:'增伤',reduce:'出战：主人命中减伤',resistance:'出战：主人威压控制抵抗',speed:'速度/触发加成',skill:'技能伤害',supreme:'战斗增幅'};
  return `${labels[t.key]||'词条效果'} +${Number((t.value*100).toFixed(2))}%（Lv.${t.level}）`;
}
function addMutationTraitV210(pet,tier){
  ensurePetGrowthStateV210(pet);
  const pool=PET_MUTATION_TRAITS_V210[tier]||PET_MUTATION_TRAITS_V210.normal;
  const unowned=pool.filter(raw=>!pet.mutationTraits.some(t=>t.name===raw[0]));
  const choices=unowned.length?unowned:pool,raw=choices[Math.floor(Math.random()*choices.length)];
  let trait=pet.mutationTraits.find(t=>t.name===raw[0]&&t.key===raw[2]);
  if(trait){trait.level++;trait.value=Number((trait.value+raw[3]*.5).toFixed(6));trait.desc=formatPetMutationTraitV286849(trait);}
  else{trait={name:raw[0],desc:raw[1],key:raw[2],value:raw[3],tier,level:1};pet.mutationTraits.push(trait);}
  // Existing tier bonus is already consumed by the attack formula; do not add it twice.
  if(tier==='epic')pet.skillDamageBonus+=.20;
  if(tier==='supreme'){pet.skillDamageBonus+=.35;pet.mutationPerfect=true;}
  return trait;
}
function comfortPetByIdV286849(id){
  if(!petBatchAllowedV286845())return false;
  const pet=getPetById(id);if(!pet)return false;ensurePetGrowthStateV210(pet);
  if(getPetCultivationLockV210(pet)){showFloatingText?.('培养封禁期间暂不可温养','#ffd879');return false;}
  const day=petGameDayV210(),gain=(!Number.isFinite(pet.lastComfortDayV286849)||pet.lastComfortDayV286849<day)&&pet.intimacy<100;
  if(pet.vitality===100&&!gain){showFloatingText?.('已达巅峰，今日温养亲密奖励已领取','#d9c98e');return false;}
  const before={vitality:pet.vitality,intimacy:pet.intimacy,last:pet.lastComfortDayV286849};
  pet.vitality=100;if(gain){pet.intimacy=Math.min(100,pet.intimacy+1);pet.lastComfortDayV286849=day;}
  try{if(!saveGame())throw new Error('comfort save failed');}catch(e){pet.vitality=before.vitality;pet.intimacy=before.intimacy;if(before.last===undefined)delete pet.lastComfortDayV286849;else pet.lastComfortDayV286849=before.last;showFloatingText?.('温养未保存，状态已恢复，请稍后重试','#ff7878');return false;}
  showFloatingText?.(`🤚 ${pet.name} 恢复巅峰${gain?' · 亲密 +1':''}`,'#8ff0cf');updatePetPanel?.();updateStats?.();return true;
}

function mutatePetByIdV210(id){if(!petBatchAllowedV286845())return false;const pet=getPetById?.(id);if(!pet)return;const c=canMutatePetV210(pet);if(!c.ok){showFloatingText?.(`❌ ${c.reason}`,'#ff7878');return}consumePetMatsV210({'变异灵晶':1,'纯净灵髓':1},pet);const tier=pickMutationTierV210(pet);pet.mutationCount++;if(tier==='fail'){showPetGrowthResultV210(pet,false,'变异','【变异失败】<br>灵光重组未能稳定，仅消耗材料，无其他惩罚。','🌫️')}else{pet.mutationTier=tier;const tr=addMutationTraitV210(pet,tier),labels={normal:'普通变异',quality:'优质变异',epic:'极品变异',supreme:'至尊变异'};pet.visualForm++;showPetGrowthResultV210(pet,true,'变异',`【${labels[tier]}成功！】<br>获得词条 <b>${tr.name}</b>：${tr.desc}${tier==='supreme'?'<br>✨ 已达“完美变异”标准，可冲击终极血脉。':''}`,'🧬');flashPetCardV210(id,'pet-mutation-flare-v210')}autoSave?.();updatePetPanel?.();updateStats?.()}

function canEvolvePetV210(pet,essence){ensurePetGrowthStateV210(pet);if(isDivinePetV210(pet))return{ok:false,reason:'神兽不走普通进化路线'};if(pet.mutationCount<1)return{ok:false,reason:'至少完成一次变异'};if(pet.growthStage<3)return{ok:false,reason:'需达到王阶以上'};if(pet.evolutionStage>=2)return{ok:false,reason:'已完成完全进化'};const lock=getPetCultivationLockV210(pet);if(lock)return{ok:false,reason:`培养封禁 ${lock}天`};const cd=getPetSpecificCooldownV210(pet,'evolutionCooldownUntilDay');if(cd)return{ok:false,reason:`进化冷却 ${Math.ceil(cd)}天`};if(pet.evolutionStage===1&&pet.bloodlineValue<100)return{ok:false,reason:`血脉值需满100（当前${Math.floor(pet.bloodlineValue)}）`};if(!PET_EVOLUTION_ESSENCES_V210[essence]||petMatCountV210(essence)<1)return{ok:false,reason:`缺少${essence}`};return{ok:true,rate:PET_EVOLUTION_ESSENCES_V210[essence].rate}}
function evolvePetByIdV210(id,essence){if(!petBatchAllowedV286845())return false;const pet=getPetById?.(id);if(!pet)return;const c=canEvolvePetV210(pet,essence);if(!c.ok){showFloatingText?.(`❌ ${c.reason}`,'#ff7878');return}player.petMaterials[essence]--;if(player.petMaterials[essence]<=0)delete player.petMaterials[essence];recordPetInvestmentV286846(pet,{[essence]:1});const success=Math.random()<c.rate;if(success){pet.evolutionStage++;pet.bloodlineUnlocked=true;pet.bloodlineValue=pet.evolutionStage>=2?100:20;pet.perfectEvolution=pet.evolutionStage>=2;pet.visualForm+=2;pet.baseStatMultiplier*=1.28;pet.skillDamageBonus+=.20;const skill=PET_SECOND_SKILLS_V210[pet.type]||'血脉灵术';showPetGrowthResultV210(pet,true,'进化',pet.evolutionStage>=2?`【血脉觉醒！完成完全进化！】<br>真形稳定，战力进入跃迁状态；第二技能「${skill}」获得完全强化。`:`【血脉觉醒！形态进化！】<br>解锁第二技能「${skill}」，开启【血脉值】系统。`,'🪽');flashPetCardV210(id,'pet-evolution-flare-v210')}else{pet.bloodlineValue=0;pet.evolutionStage=Math.max(0,pet.evolutionStage-1);pet.perfectEvolution=false;pet.evolutionCooldownUntilDay=petGameDayV210()+3;showPetGrowthResultV210(pet,false,'进化','【进化失败！】<br>血脉溃散，血脉值清空并退回上一形态；3个仙历日内不可再次进化。','💔')}petEvolutionOpenIdV210=null;autoSave?.();updatePetPanel?.();updateStats?.()}

function getAncestryNameV210(pet){if(pet.isDemon)return'深渊魔化';if(pet.type==='灵狐')return'九尾天狐血脉';if(pet.type==='冰龙'||/蛇/.test(pet.name||''))return'真龙祖脉';if(pet.type==='雷鹰')return'金翅大鹏残血';if(pet.type==='火凤')return'太古凤凰祖血';return'上古荒兽祖血'}
function canAncestryPetV210(pet){ensurePetGrowthStateV210(pet);if(pet.ancestralAwakened||pet.abyssForm||pet.divineAncestryDone)return{ok:false,reason:'终极血脉已完成'};const lock=getPetCultivationLockV210(pet);if(lock)return{ok:false,reason:`培养封禁 ${lock}天`};if((player.level||0)<3)return{ok:false,reason:'主人需达到金丹境'};if(pet.intimacy<100)return{ok:false,reason:`亲密度需满100（当前${Math.floor(pet.intimacy)}）`};if(pet.isDemon){if(!pet.mutationPerfect||pet.evolutionStage<2)return{ok:false,reason:'魔宠需完美变异 + 完全进化'};if(petMatCountV210('深渊魔核')<1||petMatCountV210('魔魂晶')<3)return{ok:false,reason:'需要深渊魔核×1、魔魂晶×3'};return{ok:true,material:'深渊魔核',demon:true}}
  if(isDivinePetV210(pet)){const cap=getPetLevelCapV210(pet);if((pet.level||1)<cap||pet.growthValue<100||pet.proficiency<100)return{ok:false,reason:'神兽需满级、满成长、满熟练'};if(petMatCountV210('上古返祖灵珠')<1)return{ok:false,reason:'缺少上古返祖灵珠'};return{ok:true,material:'上古返祖灵珠',divine:true}}
  if(!pet.mutationPerfect||pet.evolutionStage<2)return{ok:false,reason:'需完美变异 + 完全进化'};if(petMatCountV210('上古返祖灵珠')<1)return{ok:false,reason:'缺少上古返祖灵珠'};return{ok:true,material:'上古返祖灵珠'}
}
// 保底按灵宠独立记录；仙历日调息不使用现实时间。
function getPetAncestryRateV210(pet){ensurePetGrowthStateV210(pet);return pet?.ancestryPity>=3?1:.20+(pet?.ancestryPity||0)*.25}
let petAncestryBusyV210=false;
function ancestryPetByIdV210(id){
  if(petAncestryBusyV210)return false;
  // 战斗存档保存的是开战前快照，不允许在此时提交养成消耗。
  if(!['exploring','pets'].includes(gameState)||player.breakthrough?.isAnimating){showFloatingText?.('请在战斗或突破结束后进行血脉觉醒','#ff7878');return false}
  const pet=getPetById?.(id);if(!pet)return false;
  const c=canAncestryPetV210(pet);if(!c.ok){showFloatingText?.(`❌ ${c.reason}`,'#ff7878');return false}
  const before=JSON.parse(JSON.stringify(pet)),materials={...player.petMaterials};
  const cost=c.demon?{'深渊魔核':1,'魔魂晶':3}:{'上古返祖灵珠':1};
  let success=false;petAncestryBusyV210=true;
  try{
    if(!consumePetMatsV210(cost,pet))return false;
    const rate=getPetAncestryRateV210(pet);success=rate>=1||Math.random()<rate;
    if(success){
      if(c.demon)pet.abyssForm=true;else pet.ancestralAwakened=true;
      pet.divineAncestryDone=!!c.divine;pet.ancestryPity=0;pet.visualForm+=3;
      pet.baseStatMultiplier*=1.55;pet.skillDamageBonus+=.80;pet.bloodlineValue=100;
    }else{
      pet.ancestryPity=Math.min(3,pet.ancestryPity+1);
      pet.cultivationLockUntilDay=petGameDayV210()+3;
    }
    if(!saveGame())throw new Error('ancestry save failed');
  }catch(err){
    for(const key of Object.keys(pet))delete pet[key];Object.assign(pet,before);
    for(const key of Object.keys(player.petMaterials))delete player.petMaterials[key];Object.assign(player.petMaterials,materials);
    showFloatingText?.('本次觉醒未保存，材料与灵宠状态已恢复，请稍后重试','#ff7878');return false;
  }finally{petAncestryBusyV210=false}
  const title=c.demon?'深渊魔化':'返祖';
  if(success){
    showPetGrowthResultV210(pet,true,title,`【${c.demon?'深渊魔躯觉醒':'万古血脉苏醒'}！】<br>${pet.name} 激活「${getAncestryNameV210(pet)}」，全部技能倍率永久 +0.8。`,'🌟');
    flashPetCardV210(id,'pet-ancestor-flare-v210');
  }else{
    showPetGrowthResultV210(pet,false,title,`【血脉感悟积累 ${pet.ancestryPity}/3】<br>进化形态、变异词条与养成属性全部保留；调息3个仙历日后可继续培养。<br>${pet.ancestryPity>=3?'下次觉醒必定成功':`下次成功率 ${Math.round(getPetAncestryRateV210(pet)*100)}%`}。`,'🌑');
  }
  updatePetPanel?.();updateStats?.();return true;
}

function getPetGraduationV210(pet){ensurePetGrowthStateV210(pet);if(pet.ancestralAwakened||pet.abyssForm||pet.divineAncestryDone)return'终极毕业';if(isDivinePetV210(pet))return'神兽·待极致返祖';if(pet.growthStage>=4&&pet.perfectEvolution)return'完美进化';if(pet.growthStage>=2&&pet.evolutionStage>=2&&pet.mutationTier==='epic')return'极品变异·进化';if(pet.evolutionStage>=2)return'进化封顶';return'养成中'}
function getPetCooldownTextV210(pet){const arr=[];const a=getPetSpecificCooldownV210(pet,'advanceCooldownUntilDay');if(a)arr.push(`进阶${Math.ceil(a)}天`);const e=getPetSpecificCooldownV210(pet,'evolutionCooldownUntilDay');if(e)arr.push(`进化${Math.ceil(e)}天`);const l=getPetCultivationLockV210(pet);if(l)arr.push(`培养封禁${l}天`);return arr.join(' · ')}
function renderPetTraitListV210(pet){if(!pet.mutationTraits.length)return'';return `<div class="pet-trait-list-v210">${pet.mutationTraits.map(t=>`<span class="pet-trait-v210 ${t.tier==='epic'?'epic':t.tier==='supreme'?'supreme':''}">${escapePetText(t.name)} · ${escapePetText(t.desc)}</span>`).join('')}</div>`}
function renderPetGrowthMenuV210(pet){const a=canPetAdvanceV210(pet),m=canMutatePetV210(pet),anc=canAncestryPetV210(pet),openEvo=petEvolutionOpenIdV210===pet._petId;const eNote=pet.evolutionStage>=2?'完全进化':pet.evolutionStage===1?`血脉值 ${Math.floor(pet.bloodlineValue)}/100`:'需王阶+且至少变异1次';return `<div class="pet-growth-menu-v210"><div class="pet-growth-menu-title-v210"><span>🧬 深度养成</span><span>${getPetGraduationV210(pet)}</span></div><div class="pet-growth-menu-note-v210">进阶：${a.ok?`成功率 ${Math.round(a.rate*100)}% · ${formatPetMatCostV210(a.cost.materials)} · ${a.cost.gold}灵石`:a.reason}<br>变异：${m.ok?`基础成功池 38.5% · 主角+3%${getMutationWeatherBonusV210()?` · 天时+8%`:''}`:m.reason}<br>进化：${eNote}<br>${pet.isDemon?'深渊魔化':isDivinePetV210(pet)?'神兽极致返祖':'血脉返祖'}：${anc.ok?'条件已齐备':anc.reason} · 成功率 ${Math.round(getPetAncestryRateV210(pet)*100)}% · 感悟 ${pet.ancestryPity}/3${pet.ancestryPity>=3?'（本次必成）':''}<br>材料：${formatPetMatCostV210(pet.isDemon?{'深渊魔核':1,'魔魂晶':3}:{'上古返祖灵珠':1})}<br>失败保留形态与词条，调息3个仙历日；每次失败成功率+25个百分点，最多4次必成</div><div class="pet-growth-actions-v210"><button class="pet-growth-action-v210 gold" ${a.ok?'':'disabled'} onclick="advancePetByIdV210('${pet._petId}')">🌈 进阶</button><button class="pet-growth-action-v210 purple" ${m.ok?'':'disabled'} onclick="mutatePetByIdV210('${pet._petId}')">🧬 变异</button><button class="pet-growth-action-v210 blue" ${(!isDivinePetV210(pet)&&pet.evolutionStage<2)?'':'disabled'} onclick="togglePetEvolutionV210('${pet._petId}')">🪽 ${pet.evolutionStage?'继续进化':'形态进化'}</button><button class="pet-growth-action-v210 gold" ${anc.ok?'':'disabled'} onclick="ancestryPetByIdV210('${pet._petId}')">🌟 ${pet.isDemon?'深渊魔化':'血脉返祖'}</button></div>${openEvo?renderEvolutionChoicesV210(pet):''}${renderPetTraitListV210(pet)}${getPetCooldownTextV210(pet)?`<div class="pet-growth-lock-v210">⏳ ${getPetCooldownTextV210(pet)}</div>`:''}</div>`}
function renderEvolutionChoicesV210(pet){return `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:7px">${Object.entries(PET_EVOLUTION_ESSENCES_V210).map(([n,d])=>{const c=canEvolvePetV210(pet,n);return `<button class="pet-growth-action-v210" ${c.ok?'':'disabled'} onclick="evolvePetByIdV210('${pet._petId}','${n}')">${d.label}<br>${Math.round(d.rate*100)}% · ×${petMatCountV210(n)}</button>`}).join('')}</div>`}
function togglePetGrowthV210(id){petGrowthOpenIdV210=petGrowthOpenIdV210===id?null:id;if(petGrowthOpenIdV210!==id)petEvolutionOpenIdV210=null;updatePetPanel?.()}
function togglePetEvolutionV210(id){petEvolutionOpenIdV210=petEvolutionOpenIdV210===id?null:id;updatePetPanel?.()}
function flashPetCardV210(id,cls){requestAnimationFrame(()=>{const el=document.querySelector(`[data-pet-id="${CSS.escape(id)}"]`);if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),1200)})}
function showPetGrowthResultV210(pet,success,type,message,icon){document.getElementById('petGrowthResultV210')?.remove();const el=document.createElement('div');el.id='petGrowthResultV210';el.className=`pet-growth-result-v210 ${success?'':'fail'}`;el.innerHTML=`<div class="pet-growth-result-card-v210"><div class="pet-growth-result-icon-v210">${icon}</div><div class="pet-growth-result-title-v210">${success?'✨':'⚠️'} ${escapePetText(type)}${success?'成功':'失败'}</div><div class="pet-growth-result-text-v210"><b>${escapePetText(pet.name)}</b><br>${message}</div><button class="pet-growth-result-btn-v210" onclick="document.getElementById('petGrowthResultV210')?.remove()">继续养成</button></div>`;document.body.appendChild(el)}

function renderPetGrowthMaterialsV210(){return [...Object.keys(PET_FOOD),...PET_ALL_GROWTH_MATERIALS_V210].map(n=>`<span class="pet-growth-material-v210">${n} <b>×${petMatCountV210(n)}</b></span>`).join('')}

// 覆盖灵宠面板展示：保留 V27.9 收服/契约，加入完整养成状态和操作。
window.updatePetPanel=function(){
  ensurePetSystemState?.();ensurePetCaptureState?.();ensureAllPetGrowthV210();const pets=player.pets||[],active=player.activePet;const summary=document.getElementById('petCollectionSummary');if(summary)summary.textContent=`灵宠 ${pets.length}/5 · 主人御宠等级上限 Lv.${getOwnerPetLevelCapV210()} · ${active?`出战：${active.name}`:'无出战灵宠'}`;const cap=document.getElementById('petCapacityBadge');if(cap)cap.textContent=`${pets.length} / 5`;
  const spot=document.getElementById('activePetSpotlight');if(spot){if(active){ensurePetGrowthStateV210(active);const t=PET_TYPES[active.type]||{icon:'🐾'},q=getPetQualityInfo(active.quality),st=getPetStageV210(active);spot.innerHTML=`<div class="pet-active-card"><div class="pet-active-avatar">${t.icon||'🐾'}</div><div><div class="pet-active-name">正在出战 · ${escapePetText(active.name)} <span class="pet-level-chip">Lv.${active.level}/${getPetLevelCapV210(active)}</span></div><div class="pet-quality-line-v29"><span class="pet-quality-badge-v29" style="color:${q.color}">${q.icon} ${q.label}</span><span class="pet-growth-badge-v210 stage">${st.label}</span><span class="pet-bond-badge-v29">${getPetBondLabel(active.bondType)}</span></div><div class="pet-active-desc">${escapePetText(getPetTalentText(active))} · ${getPetGraduationV210(active)}</div></div><div class="pet-active-power">灵宠战力<b>${getPetPower(active)}</b></div></div>`}else spot.innerHTML='<div class="pet-active-card empty">尚未选择出战灵宠 · 出战后战斗会获得兽经验、熟练度、成长值与血脉值</div>'}
  const dash=document.getElementById('petCaptureDashboard');if(dash){const pc=player.petCapture,lv=pc.beastTamingLevel,costGold=lv*100+50,costExp=lv*50,counts={};for(const n of player.inventory||[])if(CAPTURE_ITEMS[n])counts[n]=(counts[n]||0)+1;dash.innerHTML=`<div class="pet-taming-card-v29"><div class="pet-v29-kicker">御兽功法</div><div class="pet-v29-title"><span>🪄 御灵诀</span><span class="pet-v29-level">Lv.${lv}/10</span></div><div class="pet-v29-desc">收服成功率每级 +3% · 目标气血≤25%<br>主角隐藏加成：进阶 +5% · 变异 +3% · 返祖 +2%</div><button class="pet-taming-upgrade-v29" ${lv>=10?'disabled':''} onclick="upgradeBeastTaming()">${lv>=10?'已修至圆满':`升级 · ${costGold}灵石 + ${costExp}修为`}</button></div><div class="pet-capture-items-v29"><div class="pet-v29-kicker">御兽与养成资源</div><div class="pet-v29-title"><span>🎒 灵宠资源</span><span style="font-size:9px;color:#809a95">战斗/商店/秘境</span></div><div class="pet-capture-item-grid-v29">${Object.entries(CAPTURE_ITEMS).map(([n,d])=>`<span class="pet-capture-chip-v29">${d.icon}${n} <b>×${counts[n]||0}</b></span>`).join('')}</div><div class="pet-growth-dashboard-v210">养成闭环：<b>升级 → 进阶 → 变异 → 进化 → 返祖</b><div class="pet-growth-materials-v210">${renderPetGrowthMaterialsV210()}</div></div></div>`}
  const list=document.getElementById('petList');if(list){if(!pets.length)list.innerHTML='<div class="pet-empty-v28">暂无灵宠。野外将可收服的灵兽压至25%气血以下，再使用捕捉道具。</div>';else list.innerHTML=pets.map(pet=>{ensurePetGrowthStateV210(pet);const t=PET_TYPES[pet.type]||{icon:'🐾'},q=getPetQualityInfo(pet.quality),st=getPetStageV210(pet),activeNow=isActivePetV28(pet),lv=Math.max(1,Number(pet.level)||1),capLv=getPetLevelCapV210(pet),need=getPetExpNeedV210(pet),exp=Math.max(0,Number(pet.exp)||0),pct=Math.max(0,Math.min(100,exp/Math.max(1,need)*100)),feedOpen=petFeedOpenId===pet._petId,contractOpen=petContractOpenIdV29===pet._petId,growthOpen=petGrowthOpenIdV210===pet._petId;const feedBtns=Object.entries(PET_FOOD).map(([n,f])=>{const c=petMatCountV210(n),lock=getPetCultivationLockV210(pet);return `<button class="pet-feed-btn" ${c&&(lv<capLv||n==='灵果')&&!lock?'':'disabled'} onclick="feedPetById('${pet._petId}','${n}')">${escapePetText(n)} ×${c}<br><b>${n==='灵果'?(lv>=capLv?'恢复巅峰状态':`+${f.exp}经验 · 恢复状态`):lv>=capLv?'等级受限':`+${f.exp}经验`}</b></button>`}).join('');const anc=pet.ancestralAwakened||pet.abyssForm?'<span class="pet-growth-badge-v210 ancestor">🌟终极血脉</span>':'';return `<div class="pet-card-v28 ${activeNow?'active':''} ${pet.isDemon?'pet-demon-v29':''} ${pet.isBonded?'pet-bonded-v29':''}" data-pet-id="${escapePetText(pet._petId)}">${activeNow?'<span class="pet-active-tag">出战中</span>':''}<div class="pet-avatar-v28">${t.icon||'🐾'}</div><div><div class="pet-name-v28">${escapePetText(pet.name)}<span class="pet-level-chip">Lv.${lv}/${capLv}</span></div><div class="pet-quality-line-v29"><span class="pet-quality-badge-v29" style="color:${q.color}">${q.icon} ${q.label}</span><span class="pet-bond-badge-v29">${getPetBondLabel(pet.bondType)}</span>${pet.isDemon?'<span class="pet-bond-badge-v29" style="color:#f18a9a">魔宠</span>':''}</div><div class="pet-growth-strip-v210"><span class="pet-growth-badge-v210 stage">${st.label}</span><span class="pet-growth-badge-v210">❤️状态 ${Math.floor(pet.vitality)}%</span>${pet.mutationCount?`<span class="pet-growth-badge-v210 mutation">🧬变异×${pet.mutationCount}</span>`:''}${pet.evolutionStage?`<span class="pet-growth-badge-v210 evolution">🪽形态${pet.evolutionStage}/2</span>`:''}${anc}</div><div class="pet-stat-row-v28"><span class="pet-stat-chip-v28">⚔ ${getPetAttackPreview(pet)}</span><span class="pet-stat-chip-v28">战力 ${getPetPower(pet)}</span></div><div class="pet-bonus-v28">${escapePetText(getPetTalentText(pet))}${petDefensiveTraitTextV286849(pet)?' · 出战加成：'+escapePetText(petDefensiveTraitTextV286849(pet)):''} · 被动【${escapePetText(pet.stagePassive)}】</div></div><div class="pet-exp-wrap"><div class="pet-exp-line"><span>兽经验</span><span>${lv>=capLv?'等级上限':`${exp} / ${need}`}</span></div><div class="pet-exp-track"><div class="pet-exp-fill" style="width:${lv>=capLv?100:pct.toFixed(1)}%"></div></div></div><div class="pet-growth-progress-v210"><div class="pet-growth-mini-v210">成长值<b>${Math.floor(pet.growthValue)}/100</b><div class="bar"><div class="fill" style="width:${pet.growthValue}%"></div></div></div><div class="pet-growth-mini-v210">熟练度<b>${Math.floor(pet.proficiency)}/100</b><div class="bar"><div class="fill" style="width:${pet.proficiency}%"></div></div></div><div class="pet-growth-mini-v210">亲密度<b>${Math.floor(pet.intimacy)}/100</b><div class="bar"><div class="fill" style="width:${pet.intimacy}%"></div></div></div></div>${pet.bloodlineUnlocked?`<div class="pet-exp-wrap"><div class="pet-exp-line"><span>血脉值</span><span>${Math.floor(pet.bloodlineValue)} / 100</span></div><div class="pet-exp-track"><div class="pet-exp-fill" style="width:${pet.bloodlineValue}%"></div></div></div>`:''}<div class="pet-actions-v28"><button class="pet-action-v28 ${activeNow?'active':''}" onclick="setActivePetById('${pet._petId}')">${activeNow?'✓ 已出战':'⚔ 出战'}</button><button class="pet-action-v28 secondary" onclick="togglePetFeedMenu('${pet._petId}')">🍖 ${feedOpen?'收起':'培养'}</button><button class="pet-action-v28 secondary" onclick="togglePetGrowthV210('${pet._petId}')">🧬 ${growthOpen?'收起养成':'深度养成'}</button><button class="pet-action-v28 secondary" onclick="togglePetContractMenuV29('${pet._petId}')">📜 契约</button><button class="pet-action-v28 pet-release-btn-v29" onclick="releasePetById('${pet._petId}')">放生</button></div>${feedOpen?`<div class="pet-feed-menu">${feedBtns}<button class="pet-feed-btn" onclick="comfortPetByIdV286849('${pet._petId}')" ${getPetCultivationLockV210(pet)?'disabled':''}>🤚 抚摸温养<br><b>免费恢复状态 · 每仙历日亲密+1</b></button>${renderPetFeedBatchV286845(pet)}</div>`:''}${growthOpen?renderPetGrowthMenuV210(pet):''}${contractOpen?`<div class="pet-contract-menu-v29"><button class="pet-contract-btn-v29" ${pet.bondType==='blood'?'disabled':''} onclick="changePetBondById('${pet._petId}','blood')">滴血灵契</button><button class="pet-contract-btn-v29" ${pet.bondType==='soul'?'disabled':''} onclick="changePetBondById('${pet._petId}','equal')">平等灵契<br>需契约符</button><button class="pet-contract-btn-v29" ${pet.bondType==='soul'?'disabled':''} onclick="changePetBondById('${pet._petId}','soul')">神魂本命契<br>需契约石</button></div>`:''}${renderPetTraitListV210(pet)}</div>`}).join('')}
  const mat=document.getElementById('petMaterialInventory');if(mat)mat.innerHTML=`<div class="pet-growth-materials-v210">${renderPetGrowthMaterialsV210()}</div>`
};

// 出战灵宠参与战斗即可获得兽经验、成长与熟练；完全进化后同时积累血脉值。
function awardPetBattleGrowthV210(enemy){const pet=player?.activePet;if(!pet||!enemy||enemy._petGrowthAwardedV210)return;enemy._petGrowthAwardedV210=true;ensurePetGrowthStateV210(pet);pet.vitality=Math.max(60,pet.vitality-4);const exp=Math.max(6,Math.floor((Number(enemy.exp)||20)*.28));grantPetExpV210(pet,exp,{growth:Math.min(8,2+(enemy._isElite?3:0)),proficiency:Math.min(8,3+(enemy._isElite?2:0)),intimacy:1,show:false});if(pet.bloodlineUnlocked)pet.bloodlineValue=Math.min(100,pet.bloodlineValue+(enemy._isElite?6:3));addCombatLog?.(`🐾 ${pet.name} 获得兽经验 ${exp} · 成长/熟练提升`,'pet');rollPetGrowthMaterialDropV210(enemy)}
function rollPetGrowthMaterialDropV210(enemy){const demon=/魔|鬼|邪|煞|渊/.test(enemy?.name||'');const elite=!!enemy?._isElite;const boss=!!isBossFight;let r=Math.random();if(r<(elite ? .16 : .08))givePetMatV210(demon?'魔魂晶':'兽魂晶',1);r=Math.random();if(r<(elite ? .10 : .05)){const liquids=['木灵液','水灵液','火灵液','雷灵液','风灵液'];givePetMatV210(liquids[Math.floor(Math.random()*liquids.length)],1)}r=Math.random();if(r<(elite ? .05 : .025))givePetMatV210('变异灵晶',1);r=Math.random();if(r<(elite ? .035 : .015))givePetMatV210('纯净灵髓',1);r=Math.random();if(r<(boss ? .08 : (elite ? .025 : .01)))givePetMatV210('普通血脉精元',1);r=Math.random();if(r<(boss ? .04 : (elite ? .012 : .004)))givePetMatV210('优质血脉精元',1);r=Math.random();if(r<(boss ? .018 : (elite ? .004 : .0015)))givePetMatV210('极品血脉精元',1);if(boss&&Math.random()<.035)givePetMatV210(demon?'深渊魔核':'上古返祖灵珠',1)}
const v210BattleEndBase=window.checkBattleEnd;window.checkBattleEnd=function(){if(currentEnemy?.hp<=0)awardPetBattleGrowthV210(currentEnemy);return v210BattleEndBase?.apply(this,arguments)};

// 完全进化后有概率触发第二灵宠技能；“每5级技能伤害小幅提升”已纳入成长倍率。
const v210PetAttackBase=window.petAttack;window.petAttack=function(){const pet=player?.activePet;const base=v210PetAttackBase?.apply(this,arguments)||0;if(!pet||!currentEnemy||currentEnemy.hp<=0)return base;ensurePetGrowthStateV210(pet);if(pet.evolutionStage<1)return base;const chance=.18+pet.evolutionStage*.07+petTraitBonusV210(pet,'speed')*.4;if(Math.random()>=chance)return base;const extra=Math.max(1,Math.floor(base*(.28+pet.evolutionStage*.12+pet.skillDamageBonus*.15)));currentEnemy.hp=Math.max(0,currentEnemy.hp-extra);const skill=PET_SECOND_SKILLS_V210[pet.type]||'血脉灵术';showDamageNumber?.(extra,'enemy',false,false,false,true);addCombatLog?.(`🪽 ${pet.name} 触发第二技能【${skill}】，追加 ${extra} 点伤害！`,'pet');updateCombatUI?.();if(currentEnemy.hp<=0)checkBattleEnd?.();return base+extra};

// 御兽材料铺：基础养成材料可以买，终极返祖珠/深渊魔核保持秘境与高阶战斗稀有掉落。
const PET_GROWTH_SHOP_V286845=[
  {item:'灵果',cost:80},{item:'兽魂晶',cost:180},{item:'魔魂晶',cost:220},
  ...['木','水','火','雷','风'].map(e=>({item:e+'灵液',cost:150})),
  {item:'变异灵晶',cost:500},{item:'纯净灵髓',cost:650},{item:'普通血脉精元',cost:900},{item:'优质血脉精元',cost:1800,realm:4}
];
let petShopBatchV286845=1;
function setPetShopBatchV286845(count){if(!petBatchAllowedV286845()||![1,5,10].includes(count))return;petShopBatchV286845=count;showPetGrowthShopV210();}
function buyPetGrowthBatchV286845(item,count=1){
  if(!petBatchAllowedV286845()||![1,5,10].includes(count))return false;
  const entry=PET_GROWTH_SHOP_V286845.find(x=>x.item===item);if(!entry||entry.realm&&!hasReachedRealm(entry.realm))return false;
  const total=entry.cost*count;if(!Number.isFinite(player.gold)||player.gold<total){showFloatingText?.(`❌ 灵石不足，需要 ${total} 灵石`,'#ff6b6b');return false;}
  player.gold-=total;givePetMatV210(item,count,false);showFloatingText?.(`✅ 获得【${item}】×${count}`,'#8fe3c4');
  autoSave?.();updateStats?.();showPetGrowthShopV210();return true;
}
function showPetGrowthShopV210(){
  if(!petBatchAllowedV286845())return;
  const count=petShopBatchV286845;
  showStory(`<p>🐾 <b>御兽养成材料铺</b></p><p style="color:#aaa;font-size:12px">灵石 ${player.gold} · 上古返祖灵珠与深渊魔核仍须寻访高阶首领与秘境。</p><div style="display:flex;gap:8px;flex-wrap:wrap">${[1,5,10].map(n=>`<button class="panel-action-btn" aria-pressed="${n===count}" onclick="setPetShopBatchV286845(${n})">${n===count?'✓ ':''}购置 ×${n}</button>`).join('')}</div>`,[
    ...PET_GROWTH_SHOP_V286845.map(entry=>({text:`${entry.item} ×${count}（${entry.cost*count}灵石 · 已有 ${petMatCountV210(entry.item)}）`,action:'buy_pet_growth_v210',item:entry.item,count,cost:entry.cost*count,condition:()=>!entry.realm||hasReachedRealm(entry.realm)})),
    {text:'← 返回百宝阁',action:'shop'}
  ]);
}
const v210ShowShopBase=window.showShop;window.showShop=function(){v210ShowShopBase?.apply(this,arguments);const text=document.getElementById('storyText')?.innerHTML||'',choices=Array.isArray(currentChoices)?[...currentChoices]:[];if(!choices.some(c=>c.action==='pet_growth_shop_v210')){choices.splice(Math.max(0,choices.length-1),0,{text:'🐾 御兽养成材料铺',action:'pet_growth_shop_v210'});showStory(text,choices)}};
const v210HandleChoiceBase=window.handleChoice;window.handleChoice=function(index){const c=currentChoices?.[index];if(c?.action==='pet_growth_shop_v210'){showPetGrowthShopV210();return}if(c?.action==='buy_pet_growth_v210'){buyPetGrowthBatchV286845(c.item,c.count??1);return}return v210HandleChoiceBase?.apply(this,arguments)};

// 捕捉新灵宠时立即补齐养成字段。
const v210CaptureSuccessBase=window.captureSuccess;if(typeof v210CaptureSuccessBase==='function')window.captureSuccess=function(){const r=v210CaptureSuccessBase.apply(this,arguments);ensureAllPetGrowthV210();return r};
const v210BondBase=window.startBondingProcess;if(typeof v210BondBase==='function')window.startBondingProcess=function(){const r=v210BondBase.apply(this,arguments);setTimeout(()=>ensureAllPetGrowthV210(),0);return r};

// 每次打开灵宠界面时都进行旧档迁移；旧存档无需重开。
const v210ShowPetsBase=window.showPets;window.showPets=function(){ensureAllPetGrowthV210();const r=v210ShowPetsBase?.apply(this,arguments);updatePetPanel?.();return r};

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2762-15-petgrowthsystemv210.js"]="28.68.50";
