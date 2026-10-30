// V27.68：存档工具、建筑消耗与宗主传承。
const SECT_MASTER_RULES_V2872=Object.freeze({realm:4,contribution:SECT_RANKS.find(r=>r.name==='宗主').contributionRequired,tasks:5});
function normalizePromotionV2768(raw={},sect='') {
 const count=Number(raw?.tasksCompleted),same=!raw?.sect||raw.sect===sect;
 return {version:1,sect:typeof sect==='string'?sect:'',tasksCompleted:same&&Number.isFinite(count)?Math.min(1e9,Math.max(0,Math.floor(count))):0,inherited:same&&!!sect&&sect!=='散修'&&raw?.inherited===true};
}
function sectMasterRequirementsV2872(owner=player){
 const rules=SECT_MASTER_RULES_V2872,promotion=normalizePromotionV2768(owner?.sectPromotion,owner?.sect),realm=(owner?.level||0)>=rules.realm,contribution=(owner?.sectTotalContribution||0)>=rules.contribution,tasks=promotion.tasksCompleted>=rules.tasks;
 return {rules,promotion,realm,contribution,tasks,ready:!!owner?.sect&&owner.sect!=='散修'&&!isFactionDestroyed(owner.sect)&&realm&&contribution&&tasks&&!promotion.inherited};
}
function sectMasterRequirementTextV2872(){const r=SECT_MASTER_RULES_V2872;return `${CULTIVATION_REALMS[r.realm].name}境、累计贡献${r.contribution}、完成${r.tasks}次宗门委托`;}
function normalizeSectMasterV2872(raw={},sect=''){
 const same=raw?.sect===sect,n=v=>Number.isFinite(Number(v))?Math.min(1e9,Math.max(0,Math.floor(Number(v)))):0;
 return {version:1,sect:typeof sect==='string'?sect:'',nextDay:same?n(raw.nextDay):0,repairs:same?n(raw.repairs):0,lessons:same?n(raw.lessons):0};
}
const BUILDING_RULES_V2768={
 herb:{days:1,cooldown:3,gold:0},master:{days:1,cooldown:7,gold:0},reading:{days:1,cooldown:3,gold:0},
 insight:{days:1,cooldown:7,gold:30},spring:{days:0,cooldown:0,gold:0},pet:{days:1,cooldown:7,gold:100},
 repair_array:{days:1,cooldown:3,gold:20},defense:{days:1,cooldown:3,gold:0},
 cave:{days:1,cooldown:7,gold:20},mini_secret:{days:1,cooldown:7,gold:30}
};
function normalizeBuildingUseV2768(raw={}) {
 const out={};for(const op of Object.keys(BUILDING_RULES_V2768)){if(op==='spring')continue;const n=Number(raw?.[op]);if(Number.isFinite(n)&&n>=0)out[op]=Math.floor(n);}return out;
}
const normalizePlayerBeforeV2768=normalizePlayer;
normalizePlayer=function(saved={}){
 const p=normalizePlayerBeforeV2768(saved);
 p.bossV2887=normalizeBossV2887(saved.bossV2887,p);
 if(typeof normalizeEliteHuntV2883==='function')p.eliteHuntV2883=normalizeEliteHuntV2883(saved.eliteHuntV2883);
 if(typeof normalizeAbyssV2882==='function')p.abyssBossV2882=normalizeAbyssV2882(saved.abyssBossV2882);
 p.sectPromotion=normalizePromotionV2768(saved.sectPromotion,p.sect);
 p.sectMasterV2872=normalizeSectMasterV2872(saved.sectMasterV2872,p.sect);
 if(typeof normalizeSectPathV2880==='function')p.sectPathV2880=normalizeSectPathV2880(saved.sectPathV2880,p.sect);
 if(typeof normalizeSectAdminV2873==='function')p.sectAdminV2873=normalizeSectAdminV2873(saved.sectAdminV2873,p.sect);
 if(typeof normalizeRivalChronicleV2874==='function')p.rivalChronicleV2874=normalizeRivalChronicleV2874(saved.rivalChronicleV2874);
 if(typeof normalizeBattleReviewV2878==='function')p.lastBattleReviewV2878=normalizeBattleReviewV2878(saved.lastBattleReviewV2878);
 if(typeof normalizeEnlightenmentV2879==='function')p.enlightenmentV2870=normalizeEnlightenmentV2879(saved.enlightenmentV2870);
 p.companionWinDayV2875=Number.isInteger(saved.companionWinDayV2875)?Math.min(1e9,Math.max(-1,saved.companionWinDayV2875)):-1;
 p.buildingReadyDaysV2768=normalizeBuildingUseV2768(saved.buildingReadyDaysV2768);
 for(const key of ['sectContribution','sectTotalContribution']){const value=Number(p[key]);p[key]=Number.isFinite(value)&&value>=0?value:0;}
 p.sectRank=getRankInfoForContribution(p.sectTotalContribution,p).name;
 return p;
};
function grantSectContributionV2768(amount){
 if(!Number.isFinite(amount)||amount<=0)return;
 player.sectContribution=(player.sectContribution||0)+amount;
 player.sectTotalContribution=(player.sectTotalContribution||0)+amount;
 player.sectRank=getCurrentRankInfo().name;
}
function getBuildingWaitV2768(op){if(op==='spring')return 0;return Math.max(0,(player.buildingReadyDaysV2768?.[op]||0)-(player.worldTime?.totalDays||0));}
function beginBuildingOpV2768(op,id){
 if(op==='spring')return id==='spirit_spring';
 const rule=BUILDING_RULES_V2768[op];if(!rule)return true;
 const wait=getBuildingWaitV2768(op);
 if(wait){showFloatingText?.(`本项活动还需${wait}个游戏日，可休息或进行其他活动`,'#ffd76a');return false;}
 if(player.gold<rule.gold){showFloatingText?.(`需${rule.gold}灵石，尚未扣款`,'#ffd76a');return false;}
 if(op==='pet'&&(player.pets||[]).length>=5){showFloatingText?.('灵宠栏已满，未消耗时间或灵石','#ffd76a');return false;}
 player.buildingReadyDaysV2768=normalizeBuildingUseV2768(player.buildingReadyDaysV2768);
 player.buildingReadyDaysV2768[op]=(player.worldTime?.totalDays||0)+rule.days+rule.cooldown;
 player.gold-=rule.gold;
 advanceGameTime(rule.days,'宗门活动');
 // 在可能进入战斗的活动之前保存冷却，刷新页面不能重新免费领取。
 autoSave();return true;
}
function showSectPromotionV2768(){
 if(!sectCanManageV2866())return;
 const gate=sectMasterRequirementsV2872(),p=gate.promotion,ready=gate.ready,r=gate.rules;
 showStory(`${sectStewardCardV286865('discipline')}<h3>👑 宗主传承考核</h3><p>${CULTIVATION_REALMS[r.realm].name}境：${gate.realm?'✅':'未达成'}</p><p>累计贡献：${player.sectTotalContribution||0} / ${r.contribution}</p><p>宗门委托考核：${p.tasksCompleted} / ${r.tasks}（本版本起完成的委托计入）</p><p>达标后须完成问心、守山、受印三试并选择道统。守山布阵方案每次需100贡献，失败也扣；其他方案免费。</p>${p.inherited?'<p>✅ 已接受宗主传承</p>':`<button class="choice-btn" onclick="inheritSectV2768()" ${ready?'':'disabled'}>宗主三试 · 开始或继续</button>`}`,[{text:'返回宗门大殿',action:'sect_hall'}]);
}
function inheritSectV2768(){
 if(!sectCanManageV2866())return;
 const gate=sectMasterRequirementsV2872(),p=gate.promotion;if(!gate.ready)return;
 showSectPathV2880();return true;
}
function showSectMasterCeremonyV2870(){
 document.getElementById('sectCeremonyV2870')?.remove();
 const el=document.createElement('div');el.id='sectCeremonyV2870';el.className='mobile-inventory-overlay';el.style.zIndex='100001';
 el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','sectCeremonyTitleV2870');
 el.innerHTML=`<div class="mobile-inventory-card" style="padding:24px;max-height:85vh;overflow:auto;text-align:center;border-color:#dfbd68"><div style="font-size:44px">👑</div><h2 id="sectCeremonyTitleV2870" style="color:#ffe099">执掌宗门 · 掌教受箓</h2><p style="line-height:1.8">五次委托见证担当，千点贡献凝聚人心。<br>自今日起，你接过${escapeGameText(player.sect)}掌门信物，承担全宗兴衰之责。</p><button class="choice-btn" style="width:100%;min-height:44px">执掌山门</button></div>`;
 const previous=document.activeElement,button=el.querySelector('button');
 const close=()=>{el.remove();if(previous?.isConnected)previous.focus();};
 button.onclick=close;el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Tab'){e.preventDefault();button.focus();}});
 document.body.appendChild(el);button.focus();
}
function showSaveManagerV2768(){
 document.getElementById('saveManagerV2768')?.remove();
 const el=document.createElement('div');el.id='saveManagerV2768';el.className='mobile-inventory-overlay';el.style.zIndex='100000';
 el.innerHTML='<div class="mobile-inventory-card" style="padding:20px;max-height:85vh;overflow:auto"><h3>📁 存档管理</h3><p>修行记录保存在当前浏览器。导出文件可转移到其他设备；导入会替换当前主存档。</p><button class="choice-btn" onclick="exportSaveV2768()">导出当前存档</button><button class="choice-btn" onclick="copySaveTextV2870()">复制当前存档文本</button><button class="choice-btn" onclick="exportSaveV2768(true)">导出上一次有效备份</button><p>导入存档文件（JSON，最大8MB）</p><input type="file" accept=".json,application/json" onchange="importSaveV2768(this.files[0]);this.value=\'\'"><button class="choice-btn" onclick="restoreBackupV2768()">恢复上一次有效备份</button><hr><h4>替换前记录</h4><p>导入或恢复前保留，仅存一份；空间不足时停止替换，请先导出。</p><button class="choice-btn" onclick="restoreBeforeReplaceV2870()">恢复替换前记录</button><button class="choice-btn" onclick="exportBeforeReplaceV2870()">导出替换前记录</button><hr><h4>上一位角色</h4><p>重新入世时保留，自动保存不会覆盖这里。</p><button class="choice-btn" onclick="restorePreviousV2838()">恢复上一位角色</button><button class="choice-btn" onclick="exportPreviousV2838()">导出上一位角色</button><p>导入和恢复前会要求确认。不要清除浏览器的网站数据。</p><button class="choice-btn" onclick="document.getElementById(\'saveManagerV2768\').remove()">关闭</button></div>';
 el.addEventListener('pointerdown',e=>{if(e.target===el)el.remove()});document.body.appendChild(el);
 try{window.saveManagerExtraV2895?.(el)?.catch(()=>{});window.saveManagerStatsV2901?.(el);}catch(_){}
}
// Parse and normalize detached data before any reset or persistent replacement.
function dryRunLoadV2870(raw){
 const data=parseSaveV2768(raw);
 if(data.player.testAccount999)throw Error('测试角色不能导入普通角色存档');
 const normalized=normalizePlayer(data.player);
 const progress=data.achievements?.progress;
 const completed=data.achievements?.completed;
 if(progress!=null&&(!progress||typeof progress!=='object'||Array.isArray(progress)))throw Error('成就记录格式无效');
 if(completed!=null&&(!Array.isArray(completed)||completed.some(x=>typeof x!=='string')))throw Error('成就完成记录格式无效');
 return {...data,player:normalized};
}
const BEFORE_REPLACE_SAVE_V2870='xiantu_save_before_replace_v2870';
function currentSaveRawV2870(){
 const live=gameState!=='start'&&!document.getElementById('gameScreen')?.classList.contains('hidden');
 return live&&!player.testAccount999?JSON.stringify(createSaveDataV2768()):(localStorage.getItem(SAVE_KEY)||localStorage.getItem(SAVE_BACKUP_KEY));
}
function isMobileV2870(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(/Macintosh/i.test(navigator.userAgent)&&navigator.maxTouchPoints>1);}
function showRawSaveTextV2870(raw){
 document.getElementById('rawSaveTextV2870')?.remove();
 const overlay=document.createElement('div');overlay.id='rawSaveTextV2870';overlay.className='mobile-inventory-overlay';overlay.style.zIndex='100001';
 const card=document.createElement('div');card.className='mobile-inventory-card';card.style.padding='20px';
 const title=document.createElement('h3');title.textContent='复制存档文本';
 const tip=document.createElement('p');tip.textContent='请全选下方文字并复制，保存为 .json 文件。不要公开分享个人存档。';
 const area=document.createElement('textarea');area.value=raw;area.readOnly=true;area.setAttribute('aria-label','存档原文');area.style.cssText='width:100%;height:40vh';
 const close=document.createElement('button');close.className='choice-btn';close.textContent='关闭';close.onclick=()=>overlay.remove();
 card.append(title,tip,area,close);overlay.appendChild(card);document.body.appendChild(overlay);area.focus();area.select?.();
}
// Showing a manual-copy window is not proof that the player copied the text.
async function copyRawSaveV2870(raw){
 try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(raw);alert('存档文本已复制，请粘贴保存为 .json 文件。');}
 catch(_){showRawSaveTextV2870(raw);return false;}
 return true;
}
async function exportRawSaveV2870(raw,name){
 if(!raw)throw Error('暂无可导出的记录');
 // Export is a recovery path, including records rejected by current import validation.
 try{parseSaveV2768(raw);}catch(_){alert('该记录未通过导入安全校验，仍将原样导出供备份或修复。');}
 if(isMobileV2870()&&typeof File==='function'&&navigator.share&&navigator.canShare){
  try{const file=new File([raw],name,{type:'application/json'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file]});return true;}}
  catch(e){if(e?.name==='AbortError')return false;}
 }
 let url,a;
 try{
  url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();
  return true;
 }catch(_){return await copyRawSaveV2870(raw);}
 finally{a?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),10000);}
}
async function copySaveTextV2870(){
 try{const raw=currentSaveRawV2870();if(!raw)throw Error('暂无可导出的记录');if(await copyRawSaveV2870(raw))window.saveExportedV2895?.('text',raw);}catch(e){alert('导出失败：'+e.message);}
}
// Fail closed when the old record cannot be archived. No quota override can silently lose it.
function replaceSaveV2870(raw,prepared,archiveKey=BEFORE_REPLACE_SAVE_V2870){
 const current=currentSaveRawV2870();
 const keys=[archiveKey,SAVE_BACKUP_KEY,SAVE_KEY],old=new Map(keys.map(k=>[k,localStorage.getItem(k)])),written=[];
 try{
  if(current){localStorage.setItem(archiveKey,current);written.push(archiveKey);}
  // Preserve the previous valid main as the rolling backup as well.
  let valid=false;try{if(old.get(SAVE_KEY)){parseSaveV2768(old.get(SAVE_KEY));valid=true;}}catch(_){}
  if(valid&&old.get(SAVE_KEY)!==raw){localStorage.setItem(SAVE_BACKUP_KEY,old.get(SAVE_KEY));written.push(SAVE_BACKUP_KEY);}
  localStorage.setItem(SAVE_KEY,raw);written.push(SAVE_KEY);
 }catch(e){
  let rollbackFailed=false;
  for(const k of written.reverse()){try{old.get(k)==null?localStorage.removeItem(k):localStorage.setItem(k,old.get(k));}catch(_){rollbackFailed=true;}}
  throw Error((e.name==='QuotaExceededError'?'存储空间不足，请先导出记录后再重试。':e.message)+(rollbackFailed?'部分备份未能回滚，请先导出检查。':'当前角色未切换。'));
 }
 try{window.saveMirrorV2895?.(raw);}catch(_){}
 document.getElementById('saveManagerV2768')?.remove();loadAndStart(prepared);
}
function restoreBeforeReplaceV2870(){
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破。');return;}
 try{const raw=localStorage.getItem(BEFORE_REPLACE_SAVE_V2870);if(!raw)throw Error('暂无替换前记录');const data=dryRunLoadV2870(raw);
  if(confirm('将当前记录与替换前的记录互换，是否继续？'))replaceSaveV2870(raw,data);
 }catch(e){alert('恢复失败：'+e.message);}
}
async function exportBeforeReplaceV2870(){
 try{await exportRawSaveV2870(localStorage.getItem(BEFORE_REPLACE_SAVE_V2870),'xiantu-before-replace-'+Date.now()+'.json');}catch(e){alert('导出失败：'+e.message);}
}
async function exportSaveV2768(backup=false){
 try{const raw=backup?localStorage.getItem(SAVE_BACKUP_KEY):currentSaveRawV2870();const ok=await exportRawSaveV2870(raw,`xiantu-${backup?'backup':'save'}-${Date.now()}.json`);if(ok&&!backup)window.saveExportedV2895?.('file',raw);}
 catch(e){alert('导出失败：'+e.message);}
}
let saveImportBusyV2768=false;
async function importSaveV2768(file){
 if(!file||saveImportBusyV2768)return;
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破再导入存档');return;}
 if(file.size>8*1024*1024){alert('文件超过8MB，未修改存档');return;}
 const ownerV2838=player;
 saveImportBusyV2768=true;
 try{
  const raw=await file.text(),data=dryRunLoadV2870(raw);
  if(player!==ownerV2838||!saveChangeAllowedV2838())throw Error('读取期间角色或战斗状态已变化，请重新选择文件');
  if(data.player.testAccount999)throw Error('测试角色不能导入普通角色存档');
  if(!confirm('导入将替换当前修行记录，替换前的记录会单独保留（仅一份）。是否继续？'))return;
  replaceSaveV2870(raw,data);
 }catch(e){alert(`导入未完成：${e.message}`);}finally{saveImportBusyV2768=false;}
}
function restoreBackupV2768(){
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破再恢复备份');return;}
 try{
  const raw=localStorage.getItem(SAVE_BACKUP_KEY);if(!raw)throw Error('暂无备用档');const data=dryRunLoadV2870(raw);
  if(!confirm('将恢复到上一次有效保存，之后的进度会回退；替换前的记录会单独保留（仅一份）。是否继续？'))return;
  replaceSaveV2870(raw,data);
 }catch(e){alert(`恢复失败：${e.message}`);}
}

// 镇岳台 · 玄冥蜕影. Adapted from supplied candidate v2; real runtime adapters and atomic UI transactions.
// ---------------------------------------------------------------- data ----
const BOSS_V2887={
 version:2,
 window:{openOffset:270,days:10},                 // 封印松动: days 270-279 of every game year
 maxRounds:30,
 mp:{regen:0.05,guardGain:0.12,breakCost:0.25,cleanseCost:0.15,evadeCost:0.10},
 charge:{max:3,bonus:0.25,evade:1},              // 道韵: each stack = +25% on the next 强攻
 riposte:0.5,                                    // a clean 避让 counter-strikes for this share of a 强攻
 guardHeal:0.03,
 dmgScale:1.0,                                   // global multiplier on every boss hit (balance knob)
 level:{bonusPerLevel:0.06,bonusCap:6},
 curse:{strike:0.7},
 read:{after:2,strike:0.5,memoPhase:2},         // 看破: a move used twice in a row, or (from phase 2) last time's answer to the same skill
 armor:{per:0.10,max:3},
 tide:{every:4,you:1.3,boss:1.5},
 leech:0.02,
 ward:1,                                         // 护法舍身 leaves you at this much life
 opening:0.06,                                   // 先锋破阵: the boss starts this much weaker
 masterHp:1.15,                                  // 宗主之劫: the shade hates the masters who sealed it
 locksMax:4,
 seal:{missedHp:0.10,missedCap:5,memberCap:2,missedProsperity:3,catchUpYears:3,reinforceBones:3,reinforceProsperity:2},
 offering:{bones:2,locks:1},                     // 献骨入阵: anyone may spend bones for one more lock
 defeatDays:2,
 bone:'玄冥残骨',
 tiers:[                                         // Realm bands; annual full reward, daily limited practice.
  {id:1,minLevel:4,hp:1.0,dmg:1.0,gold:1500,exp:500,contribution:80,bones:2,relic:'zhenyue'},
  {id:2,minLevel:7,hp:1.2,dmg:1.1,gold:2600,exp:900,contribution:150,bones:3,relic:'gudi'},
  {id:3,minLevel:11,hp:1.25,dmg:1.2,gold:4200,exp:1500,contribution:260,bones:4,relic:'suopian'}
 ],
 grade:{fastBase:14,fastPerTier:2,hpShare:0.5,names:{A:'甲',B:'乙',C:'丙'},gold:{A:0.30,B:0.15,C:0},bones:{A:1,B:0,C:0}},
 firstTier:{goldMult:0.5},
 missedGold:0.10,
 repeat:{gold:0.10,bones:1},                     // a second win in the same year is practice
 prosperity:{member:2,master:3},
 relics:{
  zhenyue:{name:'镇岳印',desc:'强攻 +2%'},
  gudi:{name:'玄冥骨笛',desc:'开战道韵 +1'},
  suopian:{name:'九锁残片',desc:'开战镇岳锁 +1'}
 },
 boons:{                                        // 九锁回应: after each phase change pick one; each only once per fight
  suo:{name:'锁鸣',desc:'镇岳锁 +1',locks:1,text:'一道锁链自台下重新亮起：镇岳锁 +1。'},
  quan:{name:'灵泉',desc:'回复 25% 气血、30% 灵力',hp:0.25,mp:0.30,text:'锁下涌出一泓灵泉，你的伤势与灵力随之回复。'},
  jian:{name:'剑意',desc:'道韵 +2，并清除蚀咒与噬名',charge:2,cleanse:true,text:'九锁齐鸣，剑意贯体：道韵 +2，异状尽消。'}
 },
 masterBoons:{                                   // the 4th answer of the locks, only for a master, by 道统
  jian:{name:'万剑归宗',desc:'立即一击：两倍强攻，无视骨甲',strike:2,text:'万剑归宗！宗门剑阵自天而降'},
  dan:{name:'归元丹',desc:'回复 40% 气血，灵力全满',hp:0.40,mp:1,text:'你吞下归元丹，气血与灵力奔涌而回。'},
  zhen:{name:'九锁大阵',desc:'镇岳锁 +2',locks:2,text:'九锁大阵应宗主之令重燃：镇岳锁 +2。'},
  none:{name:'宗门同心',desc:'回复 20% 气血，道韵 +1',hp:0.20,charge:1,text:'山门方向传来同门的呼喊，你心神一振。'}
 },
 allies:{
  hufa:{name:'护法',desc:'舍身：替你挡下一次致命之击'},
  zhishi:{name:'执事',desc:'调度灵脉：灵力回复 +25%'},
  xianfeng:{name:'先锋',desc:'先锋破阵：蜕影开战时气血 −6%'}
 },
 aspectOrder:['gu','shi','chao'],                // 年相 rotates by game year, so it can be foreseen
 aspects:{
  gu:{name:'骨甲相',icon:'🦴',desc:'蜕影披着九锁磨出的骨甲：每层甲令你的伤害 −10%。破阵可碎一层甲；每入新相，甲重生一层。',armor:1,regrow:1},
  shi:{name:'噬魂相',icon:'👄',desc:'咒与噬更频繁；你身负异状时，蜕影每回合回复 2% 气血。清心只需 10% 灵力。',inject:{1:'devour',2:'curse',3:'curse'},leech:true,cleanseCost:0.10},
  chao:{name:'潮汐相',icon:'🌊',desc:'灵潮起落：每逢第 4 回合涨潮：蜕影伤害 +50%，你的伤害 +30%，你的招式不耗灵力。吞灵诀与归墟坠更频繁。',inject:{1:'channel',2:'abyss'},tide:true}
 },
 actions:['strike','guard','evade','break','cleanse','lock'],
 actionNames:{strike:'强攻',guard:'守势',evade:'避让',break:'破阵',cleanse:'清心',lock:'镇岳锁'},
 bosses:{
  xuanming:{
   name:'玄冥蜕影',title:'蚀灵尊者 · 玄冥残蜕',hpStrikes:9,
   intro:'万年前，修士玄冥欲以天下灵脉为薪，吞脉越天门。三界联手，凌霄祖师以「九锁」将其镇于山腹。每逢灵潮之秋，封印松动，玄冥便蜕下一缕「蜕影」，沿锁链爬上镇岳台——它记得，每一次被镇，都是被一位宗主点了名。',
   skills:{
    heavy:{name:'骨爪重击',icon:'🦴',tag:'重',dmg:0.26,guard:0.4,evadable:true,omen:'沉重的骨响',tele:'蜕影抬起骨爪，灵气向掌心坍缩。',counter:'守势减伤六成；避让可完全躲开。'},
    sweep:{name:'横扫千灵',icon:'🌪️',tag:'扫',dmg:0.20,guard:0.7,evadable:true,omen:'袖风渐起',tele:'袖袍鼓荡，周身灵气如潮横推。',counter:'守势只减三成；应当避让。'},
    curse:{name:'蚀咒',icon:'☠️',tag:'咒',dmg:0.08,guard:1,evadable:true,effect:{curse:2},omen:'阴冷的低语',tele:'黑雾自脚下爬满石阶。',counter:'避让可躲开；中咒后两回合伤害 −30%，清心可解。'},
    devour:{name:'噬名',icon:'👄',tag:'噬',dmg:0.05,guard:1,evadable:true,effect:{seal:2},omen:'阴冷的低语',tele:'蜕影低声念出一个名字——你的名字。',counter:'避让可躲开；被噬则刚用的招式封印两回合，清心可解。'},
    channel:{name:'吞灵诀',icon:'🌀',tag:'蓄',type:'channel',omen:'灵脉微颤',tele:'蜕影张口，山腹灵脉被一寸寸吸干——蓄力中，下回合释放！',counter:'此回合「破阵」可打断并使其僵直；否则下回合硬接。',
             release:{name:'吞灵诀·释放',icon:'💥',tag:'释',dmg:0.40,guard:0.5,evadable:false,heal:0.08,counter:'无法避让；守势减半，或以镇岳锁封住。'}},
    abyss:{name:'归墟坠',icon:'🕳️',tag:'坠',dmg:0.32,guard:0.4,evadable:false,omen:'沉重的骨响',tele:'穹顶塌陷，万钧之势——无处可避！',counter:'无法避让，唯有守势或镇岳锁。'}
   },
   phases:[   // idx restarts at 0 on every phase; the first skill of phases 2 and 3 is that phase's signature
    {from:1.00,name:'蜕影初现',icon:'🌫️',bg:'#15232b',accent:'#7fc4d6',
     scene:'霜雾漫过镇岳台。九道锁链在雾里低鸣，一道灰白的人影从锁缝间缓缓爬出——没有脸，只有一张会说话的嘴。',
     cycle:{1:['heavy','sweep','curse','heavy','sweep'],2:['heavy','sweep','devour','heavy','curse'],3:['heavy','sweep','devour','heavy','curse','sweep']}},
    {from:0.65,name:'噬灵',icon:'🌀',bg:'#22142e',accent:'#c09cf0',
     enter:'蜕影的背脊裂开，旧皮簌簌剥落。台下灵脉被抽成万千光丝，倒灌入它口中——它开始学你的招式了。',
     scene:'灵脉被抽成光丝，汇入蜕影口中。石阶上的苔痕一寸寸枯白。',
     cycle:{1:['channel','heavy','devour','sweep'],2:['channel','heavy','devour','sweep','curse'],3:['channel','heavy','devour','sweep','abyss']}},
    {from:0.30,name:'归墟',icon:'🕳️',bg:'#2a0f12',accent:'#ff8a7a',
     enter:'九锁崩断六道。山腹裂开一线深渊，蜕影的半身已是虚无，声音却清清楚楚地念出了你的名字。',
     scene:'深渊在台下张口，天光被一寸寸吞没。只剩三道锁还在鸣。',
     masterLine:'「{sect}的宗主……又是你们。九锁是你们的祖师钉的，这一次，由你来还。」',
     cycle:{1:['abyss','sweep','channel','heavy','curse'],2:['abyss','sweep','channel','heavy','devour'],3:['abyss','sweep','channel','heavy','devour','sweep']}}
   ]
  }
 }
};

// ------------------------------------------------- calendar and seal ----
function bossTodayV2887(p=player){const n=Math.floor(Number(p?.worldTime?.totalDays)||0);return n>0?n:0;}
function bossYearLenV2887(){const y=typeof GAME_DAYS_PER_YEAR!=='undefined'?Number(GAME_DAYS_PER_YEAR):NaN;return Number.isFinite(y)&&y>=300?Math.floor(y):360;}
function bossWindowStartV2887(){return Math.min(BOSS_V2887.window.openOffset,bossYearLenV2887()-BOSS_V2887.window.days);}
function bossWindowV2887(p=player){
 const C=BOSS_V2887,Y=bossYearLenV2887(),day=bossTodayV2887(p),off=day%Y,start=bossWindowStartV2887(),end=start+C.window.days,open=off>=start&&off<end;
 return {year:Math.floor(day/Y),open,daysLeft:open?end-off:0,daysToOpen:open?0:(off<start?start-off:Y-off+start)};
}
function bossLastDoneYearV2887(p=player){const C=BOSS_V2887,Y=bossYearLenV2887();return Math.floor((bossTodayV2887(p)-bossWindowStartV2887()-C.window.days)/Y);}
function bossTierV2887(level){let t=null;for(const x of BOSS_V2887.tiers)if((Number(level)||0)>=x.minLevel)t=x;return t;}
function bossAspectIdV2887(year){const o=BOSS_V2887.aspectOrder,y=Math.max(0,Math.floor(Number(year)||0));return o[y%o.length];}

// ------------------------------------------------------------ state ----
function bossValidateFightV2887(raw){
 const C=BOSS_V2887;if(!raw||typeof raw!=='object')return null;
 const B=Object.hasOwn(C.bosses,raw.id)?C.bosses[raw.id]:null;if(!B)return null;
 const num=(v,lo,hi,d)=>{const n=Number(v);return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):d;},int=(v,lo,hi,d)=>Math.trunc(num(v,lo,hi,d));
 const act=a=>C.actions.includes(a)?a:null,sr=raw.seal&&typeof raw.seal==='object'?raw.seal:{},st=raw.streak&&typeof raw.streak==='object'?raw.streak:{};
 const name=x=>typeof x==='string'?x.slice(0,20):null;
 const F={id:raw.id,tier:int(raw.tier,1,C.tiers.length,1),year:int(raw.year,0,1e6,0),round:int(raw.round,1,C.maxRounds+1,1),
  aspect:Object.hasOwn(C.aspects,raw.aspect)?raw.aspect:bossAspectIdV2887(raw.year),
  sect:typeof raw.sect==='string'?raw.sect.slice(0,80):'',day:int(raw.day,0,1e9,0),
  bossMax:num(raw.bossMax,1,1e12,1),bossHp:0,hpMax:num(raw.hpMax,1,1e12,1),hp:0,mpMax:num(raw.mpMax,0,1e9,0),mp:0,
  charge:int(raw.charge,0,C.charge.max,0),phase:int(raw.phase,1,3,1),idx:int(raw.idx,0,9999,0),pendingRelease:raw.pendingRelease===true,
  stun:int(raw.stun,0,1,0),curse:int(raw.curse,0,2,0),seal:{action:act(sr.action),left:int(sr.left,0,2,0)},last:act(raw.last),
  streak:{action:act(st.action),n:int(st.n,0,99,0)},armor:int(raw.armor,0,C.armor.max,0),
  locks:int(raw.locks,0,C.locksMax,0),flawless:raw.flawless!==false,atk:num(raw.atk,1,1e12,1),strike:num(raw.strike,0.1,5,1),
  guardCut:num(raw.guardCut,0,0.5,0),mpRegen:num(raw.mpRegen,0.5,3,1),master:raw.master===true,
  doctrine:['jian','dan','zhen'].includes(raw.doctrine)?raw.doctrine:null,ward:raw.ward===true,
  allies:{hufa:name(raw.allies?.hufa),zhishi:name(raw.allies?.zhishi),xianfeng:name(raw.allies?.xianfeng)},
  missed:int(raw.missed,0,C.seal.missedCap,0),offered:raw.offered===true,
  boonsTaken:[...new Set((Array.isArray(raw.boonsTaken)?raw.boonsTaken:[]).filter(x=>typeof x==='string'&&(Object.hasOwn(C.boons,x)||x==='master')))],
  memo:{},boon:null,over:['win','lose','exhausted'].includes(raw.over)?raw.over:null,intent:null};
 for(const k of Object.keys(B.skills)){const v=raw.memo?.[k];if(C.actions.includes(v))F.memo[k]=v;}
 F.bossHp=num(raw.bossHp,-1e12,F.bossMax,F.bossMax);F.hp=num(raw.hp,-1e12,F.hpMax,F.hpMax);F.mp=num(raw.mp,0,F.mpMax,F.mpMax);
 if(raw.boon&&typeof raw.boon==='object'&&!F.over){const opts=bossBoonOptionsV2887(F);if(opts.length)F.boon={phase:int(raw.boon.phase,2,3,F.phase),options:opts};}
 const it=raw.intent&&typeof raw.intent==='object'?raw.intent:{};
 const okStage=['act','charge','release','stunned'].includes(it.stage),okSkill=it.skill===null||(typeof it.skill==='string'&&Object.prototype.hasOwnProperty.call(B.skills,it.skill));
 F.intent=okStage&&okSkill&&(it.stage==='stunned')===(it.skill===null)?{skill:it.skill,stage:it.stage,read:['evade','guard','strike'].includes(it.read)?it.read:null,why:['evade','guard','strike'].includes(it.read)?(it.why==='memo'?'memo':'streak'):null,tide:it.tide===true}:null;
 if(F.intent&&((['charge','release'].includes(F.intent.stage)&&F.intent.skill!=='channel')||(F.intent.stage==='act'&&F.intent.skill==='channel')))F.intent=null;
 if(!F.intent)F.intent=bossSelectIntentV2887(F);
 return F;
}
function normalizeBossV2887(raw,p){
 const C=BOSS_V2887,r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const int=(v,lo,hi,d)=>{const n=Math.trunc(Number(v));return Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):d;};
 const sr=r.seal&&typeof r.seal==='object'?r.seal:{},ids=Object.keys(C.bosses);
 const per=src=>{const o={};for(const id of ids)o[id]=int(src?.[id],0,99999,0);return o;};
 const same=typeof r.sect!=='string'||r.sect===p?.sect,sect=typeof p?.sect==='string'?p.sect:'';
 const fight=r.v===C.version&&same?bossValidateFightV2887(r.fight):null;
 return {v:C.version,sect,highDay:int(r.highDay,0,1e9,bossTodayV2887(p)),rewardDay:int(r.rewardDay,-1,1e9,-1),kills:per(r.kills),best:per(r.best),
  relics:[...new Set((Array.isArray(r.relics)?r.relics:[]).filter(x=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(C.relics,x)))],
  seal:{settledYear:!same||sr.settledYear===undefined?bossLastDoneYearV2887(p):int(sr.settledYear,-1,1e6,-1),
        wonYears:(Array.isArray(sr.wonYears)?sr.wonYears:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=1e6).slice(-6),
        missed:same?int(sr.missed,0,C.seal.missedCap,0):0},
  fight:fight&&fight.sect===sect?fight:null};     // a fight is kept only if it was saved by this version and belongs to the current sect
}
function ensureBossV2887(p=player){if(!p.bossV2887||p.bossV2887.v!==BOSS_V2887.version||p.bossV2887.sect!==p.sect)p.bossV2887=normalizeBossV2887(p.bossV2887,p);return p.bossV2887;}
function bossPeekV2887(p=player){const b=p?.bossV2887;return b&&b.v===BOSS_V2887.version&&b.sect===p.sect?b:normalizeBossV2887(b,p);}

// -------------------------------------- actual character stat adapter ----
function bossPlayerStatsV2887(p=player){
 const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:0;};
 const call=n=>{try{return typeof globalThis[n]==='function'?num(globalThis[n]()):0;}catch(_){return 0;}};
 const lv=Math.max(0,Math.floor(Number(p.level)||0));
 return {level:lv,hpMax:call('getMaxHp')||num(p.maxHp)||100+80*lv,mpMax:call('getMaxMp')||num(p.maxMp)||50+10*lv,
         atk:call('getAtk')||num(p.attack)||num(p.atk)||20+12*lv};
}
// What you bring to the altar: relics for everyone; for a master, the current doctrine and available officers
function bossAdvantagesV2887(p=player){
 const b=bossPeekV2887(p),A={master:false,strike:1,hp:1,guardCut:0,mpRegen:1,locks:0,charge:0,doctrine:null,ward:false,opening:0,allies:{hufa:null,zhishi:null,xianfeng:null}};
 try{
  if(typeof sectPathMasterV2880==='function'&&p===player&&sectPathMasterV2880()){
   const m={power:sectPathPowerV2880()},s={...sectAdminReadV2873(),doctrine:sectPathReadV2880().doctrine};
   const roster=typeof sectMembersReadV2868==='function'?sectMembersReadV2868():[];
   const nameOf=id=>{if(id===null||id===undefined)return null;const d=roster.find(x=>String(x.id)===String(id));return d&&!d.job&&!warDiscipleBusyV286841(d.id)?String(d.name||'无名弟子').slice(0,20):null;};
   Object.assign(A,{master:true,strike:Number(m.power)>0?m.power:1,locks:2,charge:1,doctrine:['jian','dan','zhen'].includes(s.doctrine)?s.doctrine:null});
   if(s.doctrine==='zhen')A.guardCut=0.1;
   if(s.doctrine==='dan')A.mpRegen*=1.5;
   A.allies={hufa:nameOf(s.officers.hufa),zhishi:nameOf(s.officers.zhishi),xianfeng:nameOf(s.officers.xianfeng)};
   if(A.allies.hufa)A.ward=true;
   if(A.allies.zhishi)A.mpRegen*=1.25;
   if(A.allies.xianfeng)A.opening=BOSS_V2887.opening;
  }
 }catch(e){console.warn('宗主镇岳加成失败',e);Object.assign(A,{master:false,strike:1,hp:1,guardCut:0,mpRegen:1,locks:0,charge:0,doctrine:null,ward:false,opening:0,allies:{hufa:null,zhishi:null,xianfeng:null}});}
 if(b.relics.includes('zhenyue'))A.strike+=0.02;
 if(b.relics.includes('gudi'))A.charge+=1;
 if(b.relics.includes('suopian'))A.locks+=1;
 return A;
}

// ---------------------------------------------------- engine (pure) ----
// a missed year weighs fully on the master who holds the seal; an ordinary member feels at most two
function bossMissedEffectV2887(missed,master){const C=BOSS_V2887;return Math.min(master?C.seal.missedCap:C.seal.memberCap,Math.max(0,Math.floor(Number(missed)||0)));}
function bossCycleV2887(F){
 const C=BOSS_V2887,B=C.bosses[F.id],base=B.phases[F.phase-1].cycle[F.tier],inj=C.aspects[F.aspect]?.inject?.[F.phase];
 return inj?[...base,inj]:base;
}
function bossCostV2887(F,action){
 const C=BOSS_V2887,A=C.aspects[F.aspect]||{};
 if(F.intent?.tide)return 0;
 if(action==='break')return A.breakCost??C.mp.breakCost;
 if(action==='cleanse')return A.cleanseCost??C.mp.cleanseCost;
 if(action==='evade')return C.mp.evadeCost;
 return 0;
}
function bossSelectIntentV2887(F){
 const C=BOSS_V2887,B=C.bosses[F.id],tide=!!C.aspects[F.aspect]?.tide&&F.round%C.tide.every===0;
 if(F.stun>0)return {skill:null,stage:'stunned',read:null,why:null,tide};
 let it;
 if(F.pendingRelease){F.pendingRelease=false;it={skill:'channel',stage:'release'};}
 else{const cyc=bossCycleV2887(F),sk=cyc[F.idx%cyc.length];F.idx++;
  if(B.skills[sk].type==='channel'){F.pendingRelease=true;it={skill:sk,stage:'charge'};}else it={skill:sk,stage:'act'};}
 it.read=null;it.why=null;it.tide=tide;
 // 看破: (a) a move used twice in a row; (b) from 噬灵 on, the answer you gave this skill last time (记招)
 if(it.stage!=='charge'){
  const d=it.stage==='release'?B.skills[it.skill].release:B.skills[it.skill];
  const fits=a=>(a==='evade'&&d.evadable)||(a==='guard'&&d.guard<1)||a==='strike';
  if(F.streak.n>=C.read.after&&fits(F.streak.action)){it.read=F.streak.action;it.why='streak';F.streak={action:null,n:0};}
  else if(F.phase>=C.read.memoPhase&&(F.memo[it.skill]==='evade'||F.memo[it.skill]==='guard')&&fits(F.memo[it.skill])){it.read=F.memo[it.skill];it.why='memo';}
 }
 return it;
}
function bossBoonOptionsV2887(F){
 const C=BOSS_V2887,out=Object.keys(C.boons).filter(k=>!F.boonsTaken.includes(k));
 if(F.master&&!F.boonsTaken.includes('master'))out.push('master');
 return out;
}
function bossMasterBoonV2887(F){return BOSS_V2887.masterBoons[F.doctrine||'none'];}
function bossNewFightV2887(id,tierId,stats,adv,missed,year=0){
 const C=BOSS_V2887,T=C.tiers[tierId-1],B=C.bosses[id],aspect=bossAspectIdV2887(year),m=bossMissedEffectV2887(missed,adv.master);
 const bossMax=Math.round(stats.atk*B.hpStrikes*T.hp*(1+C.seal.missedHp*m)*(adv.master?C.masterHp:1));
 const over=Math.min(C.level.bonusCap,Math.max(0,stats.level-T.minLevel)),hpMax=Math.round(stats.hpMax*adv.hp);
 const F={id,tier:tierId,year,round:1,aspect,bossMax,bossHp:Math.round(bossMax*(1-(adv.opening||0))),hpMax,hp:hpMax,mpMax:stats.mpMax,mp:stats.mpMax,
  charge:Math.min(C.charge.max,adv.charge),phase:1,idx:0,pendingRelease:false,stun:0,curse:0,seal:{action:null,left:0},last:null,streak:{action:null,n:0},
  armor:C.aspects[aspect].armor||0,locks:Math.min(C.locksMax,adv.locks+(adv.offered?C.offering.locks:0)),flawless:true,atk:stats.atk,
  strike:adv.strike*(1+C.level.bonusPerLevel*over),guardCut:adv.guardCut,mpRegen:adv.mpRegen,master:!!adv.master,doctrine:adv.doctrine||null,
  ward:!!adv.ward,allies:{hufa:adv.allies?.hufa||null,zhishi:adv.allies?.zhishi||null,xianfeng:adv.allies?.xianfeng||null},
  missed:m,offered:!!adv.offered,boonsTaken:[],boon:null,memo:{},over:null,intent:null};
 F.intent=bossSelectIntentV2887(F);return F;
}
// how much of a hit lands: your damage multiplier this round (curse, armor, 看破, tide)
function bossOutMultV2887(F,hadCurse){
 const C=BOSS_V2887;
 return (hadCurse?C.curse.strike:1)*(1-C.armor.per*F.armor)*(F.intent.tide?C.tide.you:1);
}
function bossApplyBoonV2887(F,id,ev){
 const C=BOSS_V2887,d=id==='master'?bossMasterBoonV2887(F):C.boons[id];
 if(d.locks)F.locks=Math.min(C.locksMax,F.locks+d.locks);
 if(d.hp)F.hp=Math.min(F.hpMax,F.hp+Math.round(d.hp*F.hpMax));
 if(d.mp)F.mp=Math.min(F.mpMax,F.mp+d.mp*F.mpMax);
 if(d.charge)F.charge=Math.min(C.charge.max,F.charge+d.charge);
 if(d.cleanse){F.curse=0;F.seal={action:null,left:0};}
 if(d.strike){const dmg=Math.round(d.strike*F.atk*F.strike);F.bossHp-=dmg;ev.push(`${d.text}，造成 ${dmg} 伤害。`);}else ev.push(d.text);
 F.boonsTaken.push(id);
}
function bossTransitionV2887(F,ev){
 const C=BOSS_V2887,B=C.bosses[F.id],frac=F.bossHp/F.bossMax,ph=frac<=B.phases[2].from?3:frac<=B.phases[1].from?2:1;
 if(ph<=F.phase)return false;
 F.phase=ph;F.idx=0;F.pendingRelease=false;F.stun=0;
 if(C.aspects[F.aspect].armor)F.armor=Math.min(C.armor.max,F.armor+C.aspects[F.aspect].regrow);
 ev.push(`——${B.phases[ph-1].name}——`,B.phases[ph-1].enter);
 const opts=bossBoonOptionsV2887(F);if(opts.length)F.boon={phase:ph,options:opts};
 return true;
}
// One round (or one free boon choice). Returns {ev:[text...], invalid?:true, over?, transition?}. Mutates F.
function bossStepV2887(F,action){
 const C=BOSS_V2887,B=C.bosses[F.id],T=C.tiers[F.tier-1],ev=[];
 if(F.over)return {ev,over:F.over};
 // 九锁回应: a free choice after a phase change; the boss waits
 if(F.boon){
  const id=typeof action==='string'&&action.startsWith('boon:')?action.slice(5):null;
  if(!id||!F.boon.options.includes(id))return {ev:['请先回应九锁。'],invalid:true};
  F.boon=null;bossApplyBoonV2887(F,id,ev);
  if(F.bossHp<=0){F.over='win';ev.push('蜕影寸寸崩解，沉回山腹。');return {ev,over:'win'};}
  const transition=bossTransitionV2887(F,ev);
  F.intent=F.boon?{skill:null,stage:'stunned',read:null,why:null,tide:false}:bossSelectIntentV2887(F);return {ev,transition};
 }
 const it=F.intent;
 if(!C.actions.includes(action))return {ev:['无此招式。'],invalid:true};
 if(F.seal.left>0&&F.seal.action===action)return {ev:['此招式被噬名封住。'],invalid:true};
 const cost=bossCostV2887(F,action);
 if(cost&&F.mp<cost*F.mpMax-1e-9)return {ev:['灵力不足。'],invalid:true};
 if(action==='lock'&&(F.locks<1||it.stage==='stunned'))return {ev:['镇岳锁此刻无法使用。'],invalid:true};
 if(action==='cleanse'&&F.curse<=0&&F.seal.left<=0)return {ev:['并无异常可清。'],invalid:true};
 const hadCurse=F.curse>0,hadSeal=F.seal.left>0,out=bossOutMultV2887(F,hadCurse);
 let newCurse=false,newSeal=false,guarding=false,evading=false,cancelled=false;
 F.mp-=cost*F.mpMax;
 if(it.tide)ev.push('🌊 灵潮涌上镇岳台！');
 if(action==='strike'){
  const dmg=Math.round(F.atk*F.strike*(1+C.charge.bonus*F.charge)*out*(it.read==='strike'?C.read.strike:1));
  F.bossHp-=dmg;F.charge=0;ev.push(it.read==='strike'?`蜕影早有防备，你只造成 ${dmg} 伤害。`:`你一击命中，造成 ${dmg} 伤害。`);
 }else if(action==='guard'){guarding=true;F.charge=Math.min(C.charge.max,F.charge+1);F.mp=Math.min(F.mpMax,F.mp+C.mp.guardGain*F.mpMax);F.hp=Math.min(F.hpMax,F.hp+Math.round(C.guardHeal*F.hpMax));ev.push('你收束灵力，稳住守势，气息渐复。');}
 else if(action==='evade'){evading=true;ev.push('你身形一晃，拉开距离。');}
 else if(action==='break'){
  if(it.stage==='charge')ev.push('你一指点向灵脉节点！');
  else if(F.armor>0){F.armor--;ev.push(`破阵之力震碎一层骨甲（余 ${F.armor} 层）。`);}
  else ev.push('破阵落空，灵力白白散去。');
 }
 else if(action==='cleanse'){F.curse=0;F.seal={action:null,left:0};ev.push('你默诵清心咒，异状尽消。');}
 else if(action==='lock'){F.locks--;cancelled=true;ev.push('镇岳锁自石阶亮起，锁住了蜕影的动作。');}
 F.last=action;
 if(it.stage==='act'||it.stage==='release')F.memo[it.skill]=action;
 F.streak=F.streak.action===action?{action,n:F.streak.n+1}:{action,n:1};
 if(F.bossHp<=0){F.over='win';ev.push('蜕影寸寸崩解，沉回山腹。');return {ev,over:'win'};}
 // the boss acts
 if(cancelled){if(it.stage==='charge')F.pendingRelease=false;ev.push('蜕影这一回合动弹不得。');}
 else if(it.stage==='stunned'){F.stun=Math.max(0,F.stun-1);ev.push('蜕影僵立原地，无力出手。');}
 else if(it.stage==='charge'){
  if(action==='break'){F.stun=1;F.pendingRelease=false;ev.push('吞灵诀被打断，蜕影僵直！');}else ev.push('蜕影仍在蓄力，灵脉哀鸣。');
 }else{
  const d=it.stage==='release'?B.skills[it.skill].release:B.skills[it.skill];
  const canEvade=d.evadable&&it.read!=='evade';
  if(evading&&canEvade){
   F.charge=Math.min(C.charge.max,F.charge+C.charge.evade);
   const rd=Math.round(F.atk*F.strike*C.riposte*out);F.bossHp-=rd;
   ev.push(`${d.name}落空，你借势凝聚道韵，反手一击造成 ${rd} 伤害。`);
  }else{
   let dmg=d.dmg*F.hpMax*T.dmg*C.dmgScale*(it.tide?C.tide.boss:1);
   const guarded=guarding&&d.guard<1&&it.read!=='guard';
   if(guarded)dmg*=Math.max(0.2,d.guard-F.guardCut);
   dmg=Math.round(dmg);F.hp-=dmg;
   ev.push(evading&&d.evadable?`它看穿了你的身法——${d.name}正中，你损失 ${dmg} 气血。`:guarding&&it.read==='guard'?`它看穿了你的守势——${d.name}破守而入，你损失 ${dmg} 气血。`:`${d.name}命中，你损失 ${dmg} 气血${guarded?'（已守）':''}。`);
   if(F.hp<=0&&F.ward){F.hp=C.ward;F.ward=false;ev.push(`护法${F.allies.hufa?'「'+F.allies.hufa+'」':''}舍身挡在你身前，你保住了一口气。`);}
   if(F.hp<F.hpMax*C.grade.hpShare)F.flawless=false;
   if(d.effect?.curse){F.curse=d.effect.curse;newCurse=true;ev.push('蚀咒缠身：两回合伤害 −30%。');}
   if(d.effect?.seal&&F.last){F.seal={action:F.last,left:d.effect.seal};newSeal=true;ev.push(`噬名：「${C.actionNames[F.last]}」被封印。`);}
   if(d.heal){const h=Math.round(d.heal*F.bossMax);F.bossHp=Math.min(F.bossMax,F.bossHp+h);ev.push(`蜕影吞噬灵脉，回复 ${h} 气血。`);}
  }
 }
 if(F.bossHp<=0){F.over='win';F.boon=null;ev.push('蜕影寸寸崩解，沉回山腹。');return {ev,over:'win'};}
 const transition=bossTransitionV2887(F,ev);
 if(C.aspects[F.aspect].leech&&(F.curse>0||F.seal.left>0)){const h=Math.round(C.leech*F.bossMax);F.bossHp=Math.min(F.bossMax,F.bossHp+h);ev.push(`异状缠身，蜕影借你的灵气回复 ${h} 气血。`);}
 F.mp=Math.min(F.mpMax,F.mp+C.mp.regen*F.mpRegen*F.mpMax);
 if(hadCurse&&!newCurse&&F.curse>0)F.curse--;
 if(hadSeal&&!newSeal&&F.seal.left>0){F.seal.left--;if(F.seal.left===0)F.seal.action=null;}
 if(F.hp<=0){F.over='lose';F.boon=null;ev.push('你气血耗尽，魂影溃散。');return {ev,over:'lose'};}
 F.round++;
 if(F.round>C.maxRounds){F.over='exhausted';F.boon=null;ev.push('封印之力耗尽，蜕影退回山腹。');return {ev,over:'exhausted'};}
 if(!F.boon)F.intent=bossSelectIntentV2887(F);
 else F.intent={skill:null,stage:'stunned',read:null,why:null,tide:false};   // placeholder, replaced right after the boon
 return transition?{ev,transition:true}:{ev};
}
// Exact outcome of each move this round (the engine is deterministic). Pure.
function bossPreviewV2887(F){
 const out={};
 for(const a of BOSS_V2887.actions){
  const G=JSON.parse(JSON.stringify(F)),r=bossStepV2887(G,a);
  out[a]=r.invalid?{ok:false}:{ok:true,taken:Math.max(0,F.hp-G.hp),healed:Math.max(0,G.hp-F.hp),dealt:Math.max(0,F.bossHp-Math.max(0,G.bossHp)),over:G.over,transition:!!r.transition};
 }
 return out;
}
// What the boss will do after the announced move, if nothing interferes. Pure.
function bossForeshadowV2887(F){
 const C=BOSS_V2887,B=C.bosses[F.id];
 if(F.boon||F.over)return null;
 if(F.pendingRelease)return {skill:'channel',omen:'灵脉已被吸空——释放就在眼前'};
 const cyc=bossCycleV2887(F),sk=cyc[F.idx%cyc.length];
 return {skill:sk,omen:B.skills[sk].omen};
}
function bossGradeV2887(F){
 const C=BOSS_V2887,fast=F.round<=C.grade.fastBase+C.grade.fastPerTier*F.tier;
 return fast&&F.flawless?'A':fast||F.flawless?'B':'C';
}
function bossRewardsV2887(F,b,day=F.day){
 const C=BOSS_V2887,T=C.tiers[F.tier-1],grade=bossGradeV2887(F);
 if(b.seal.wonYears.includes(F.year)){
  const paid=b.rewardDay>=day;return {repeat:true,limited:paid,grade,gold:paid?0:Math.round(T.gold*C.repeat.gold),exp:0,contribution:0,bones:paid?0:C.repeat.bones,prosperity:0,relic:null,firstTier:false};
 }
 const relic=b.relics.includes(T.relic)?null:T.relic;
 const baseGold=Math.max(T.gold,lateGoldPerKillV2902(T.minLevel)*LATE_ECONOMY_V2902.annualBossKills);
 const gold=Math.round(baseGold*(1+(relic?C.firstTier.goldMult:0)+C.grade.gold[grade]+C.missedGold*F.missed));
 return {repeat:false,grade,gold,exp:T.exp,contribution:T.contribution,bones:T.bones+C.grade.bones[grade],
  prosperity:F.master?C.prosperity.master:C.prosperity.member,relic,firstTier:!!relic};
}

// --------------------------------------- commit with rollback (saves) ----

function bossCommitV2887(apply){return commitMiniWeaveV286840(apply);}
function bossClampProsperityV2887(cur,delta){const next=cur+delta;return delta>0?Math.min(next,Math.max(cur,100)):Math.max(next,Math.min(cur,10));}
function bossAdjustProsperityV2887(p,delta){
 p.sectData=p.sectData&&typeof p.sectData==='object'?p.sectData:{};
 const cur=Number.isFinite(p.sectData.prosperity)?p.sectData.prosperity:20;
 p.sectData.prosperity=bossClampProsperityV2887(cur,delta);
}
function bossBonesV2887(p=player){const n=Number(p?.materials?.[BOSS_V2887.bone]);return Number.isFinite(n)&&n>0?Math.floor(n):0;}
function bossAddBonesV2887(p,n){p.materials=p.materials&&typeof p.materials==='object'?p.materials:{};p.materials[BOSS_V2887.bone]=Math.max(0,bossBonesV2887(p)+n);}
// Pure: what settling the missed years would do, read from the small boss state only (no save copy).
function bossSettlePlanV2887(p=player,master=bossIsMasterV2887()){
 const C=BOSS_V2887,b=bossPeekV2887(p),last=bossLastDoneYearV2887(p);
 let y=b.seal.settledYear+1,n=0,lost=0,missed=b.seal.missed;
 while(y<=last&&n<C.seal.catchUpYears){if(!b.seal.wonYears.includes(y)){missed=Math.min(C.seal.missedCap,missed+1);lost++;}y++;n++;}
 const cur=p?.sectData?.prosperity,pay=lost&&master;
 return {lost,missed,settledYear:Math.max(b.seal.settledYear,last),highDay:Math.max(b.highDay,bossTodayV2887(p)),
  prosperity:pay?bossClampProsperityV2887(Number.isFinite(cur)?cur:20,-C.seal.missedProsperity*lost):(cur??20),pay};
}
function bossSettleV2887(p=player){
 const C=BOSS_V2887,plan=bossSettlePlanV2887(p),b=ensureBossV2887(p);
 b.seal.missed=plan.missed;b.seal.settledYear=plan.settledYear;
 if(plan.pay)bossAdjustProsperityV2887(p,-C.seal.missedProsperity*plan.lost);
 b.highDay=plan.highDay;return plan.lost;
}
function bossEligibleV2887(p=player){
 return !!p?.sect&&p.sect!=='散修'&&!(typeof isFactionDestroyed==='function'&&isFactionDestroyed(p.sect))&&!!bossTierV2887(p.level);
}

// ------------------------------------------------------------ screens ----
const bossBarV2887=(cur,max,color)=>{const pct=Math.max(0,Math.min(100,Math.round(100*cur/Math.max(1,max))));return `<span role="meter" aria-label="气血比例" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="display:inline-block;width:min(140px,40vw);height:8px;background:#444;border-radius:4px;vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:${color}"></span></span>`;};
function bossHallButtonV2887(){                // Read-only entry in the sect hall.
 try{
  if(!bossEligibleV2887())return '';
  const b=bossPeekV2887(),w=bossWindowV2887(),A=BOSS_V2887.aspects[bossAspectIdV2887(w.year)];
  if(b.fight)return '<button class="choice-btn" onclick="showBossAltarV2887()">⛰️ 镇岳台 · 战斗未完</button>';
  if(w.open)return `<button class="choice-btn" onclick="showBossAltarV2887()">⛰️ 镇岳台 · 封印松动 · ${A.icon}${A.name}（余 ${w.daysLeft} 天）</button>`;
  return `<button class="choice-btn" onclick="showBossAltarV2887()">⛰️ 镇岳台 · 封印稳固（${w.daysToOpen} 天后松动）</button>`;
 }catch(e){return '';}
}
function bossAlliesTextV2887(allies,esc){
 const C=BOSS_V2887,parts=[];
 for(const k of Object.keys(C.allies))if(allies[k])parts.push(`${C.allies[k].name}「${esc(allies[k])}」· ${C.allies[k].desc}`);
 return parts;
}
function showBossAltarV2887(notice=''){
 if(!sectCanManageV2866()||!bossEligibleV2887())return;
 const token=bossOpenViewV2887('altar');

 const C=BOSS_V2887,id='xuanming',B=C.bosses[id],b=bossPeekV2887(),w=bossWindowV2887(),T=bossTierV2887(player.level),esc=escapeGameText;
 const A=C.aspects[bossAspectIdV2887(w.year)],An=C.aspects[bossAspectIdV2887(w.year+1)],bones=bossBonesV2887(),adv=bossAdvantagesV2887();
 const settle=bossSettlementPreviewV2887(),won=b.seal.wonYears.includes(w.year),eff=bossMissedEffectV2887(b.seal.missed,adv.master);
 let html=`<div id="bossAltarV2887" class="loop-board-v286840" style="background:linear-gradient(180deg,#15232b,#0d1418);border:1px solid #7fc4d6;border-radius:8px;padding:10px">`
  +`<h3>⛰️ 镇岳台 · ${B.title}</h3>${notice?`<p role="status">${esc(notice)}</p>`:''}<p>${B.intro}</p>`
  +`<p>封印：<b>${b.fight?'战斗未完':w.open?`松动（余 ${w.daysLeft} 天）`:`稳固（${w.daysToOpen} 天后松动）`}</b> · 失守 ${b.seal.missed} 年${b.seal.missed?`（对你：蜕影气血 +${eff*10}%，灵石 +${eff*10}%${eff<b.seal.missed?'；余下的分量压在宗主肩上':''}）`:''}</p>`
  +`<p>${A.icon} 今年之相：<b>${A.name}</b> · ${A.desc}</p><p style="color:#aaa;font-size:12px">来年之相：${An.icon}${An.name}</p>`
  +`<p>你的境界对应：第 ${T.id} 层（${CULTIVATION_REALMS[T.minLevel].name}境起）· 已镇 ${b.kills[id]} 次${b.best[id]?`，最快 ${b.best[id]} 合`:''}${won?' · <b>今年已镇</b>：再战只算练手':''}</p>`
  +(b.relics.length?`<p>🏅 ${b.relics.map(r=>`${C.relics[r].name}（${C.relics[r].desc}）`).join('、')}</p>`:'')
  +`<p>年度首胜全额奖励；同年练手仅当日尚未领奖时给10%灵石和1残骨，每游戏日最多一份。同日再战只练习。遗物仅用于镇岳台。</p><p>待结旧账：${settle.lost}年 · 失守将变为${settle.missed} · 繁荣度${settle.prosperity}。开始挑战或加固时一起确认保存，查看不扣除。</p>`
  +(adv.master?`<p>👑 宗主亲临：开战镇岳锁 ${adv.locks}、道韵 ${Math.min(C.charge.max,adv.charge)}；九锁另有一应「${bossMasterBoonV2887({doctrine:adv.doctrine}).name}」</p>`+bossAlliesTextV2887(adv.allies,esc).map(t=>`<p style="font-size:12px">⚔️ 随行${t}</p>`).join(''):'')
  +'<p style="color:#aaa;font-size:12px">镇岳台以魂影代身：战斗中的损伤不会伤及真身，战败只耗去数日调息。</p></div>';
 if(b.fight){html+='<button class="choice-btn" onclick="showBossFightV2887()">继续战斗</button>';if(!b.fight.over)html+=`<button class="choice-btn" onclick="abandonBossV2887(${token})">放弃本场魂影 · 不退献骨</button>`;}
 else{
  html+=`<button class="choice-btn" onclick="startBossFightV2887(false,${token})" ${w.open&&bossTodayV2887()>=b.highDay?'':'disabled'}>开始镇岳之战</button>`;
  html+=`<button class="choice-btn" onclick="startBossFightV2887(true,${token})" ${w.open&&bossTodayV2887()>=b.highDay&&bones>=C.offering.bones?'':'disabled'}>献骨入阵（${C.bone} ×${C.offering.bones}：镇岳锁 +${C.offering.locks}，现有 ${bones}）</button>`;
 }
 showStory(html,[{text:'返回宗门大殿',action:'sect_hall'}]);
}
function bossIntentViewV2887(F){
 const C=BOSS_V2887,B=C.bosses[F.id],it=F.intent;
 const s=B.skills[it.skill];
 let v=it.stage==='stunned'?{icon:'💫',tag:'僵',title:'蜕影僵直',tele:'它无力出手，正是强攻的时机。',counter:''}
  :it.stage==='charge'?{icon:s.icon,tag:s.tag,title:s.name+'·蓄力',tele:s.tele,counter:s.counter}
  :it.stage==='release'?{icon:s.release.icon,tag:s.release.tag,title:s.release.name,tele:'灵脉已被吸干，蜕影抬头——释放！',counter:s.release.counter}
  :{icon:s.icon,tag:s.tag,title:s.name,tele:s.tele,counter:s.counter};
 const mods=[];
 if(it.read==='evade')mods.push(`👁️ 看破：${it.why==='memo'?'它记住了你上次应对此招时的避让':'你连续使用避让'}——这一击无法避开。`);
 if(it.read==='guard')mods.push(`👁️ 看破：${it.why==='memo'?'它记住了你上次应对此招时的守势':'你连续使用守势'}——这一击破守而入。`);
 if(it.read==='strike')mods.push('👁️ 看破：它记住了你连续的强攻——这一回合你的伤害减半。');
 if(it.tide)mods.push('🌊 涨潮：蜕影伤害 +50%，你的伤害 +30%，招式不耗灵力。');
 return {...v,mods};
}
function bossMoveLabelV2887(F,a,pv){
 const C=BOSS_V2887,n=C.actionNames[a];
 if(!pv.ok)return n;
 const bits=[];
 if(a==='break'||a==='cleanse'||a==='evade'){const c=bossCostV2887(F,a);bits.push(c?`灵力 ${Math.round(c*100)}%`:'不耗灵力');}
 if(pv.dealt)bits.push(`敌方净减 ${pv.dealt}`);
 if(pv.taken)bits.push(`气血净减 ${pv.taken}`);else if(!pv.over&&!pv.transition)bits.push(pv.healed?`气血净回 ${pv.healed}`:'无伤');
 if(pv.over==='win')bits.push('✨ 胜');if(pv.over==='lose')bits.push('☠ 溃');if(pv.transition)bits.push('入新相');
 return `${n}（${bits.join(' · ')}）`;
}
function showBossFightV2887(notice=''){
 if(!sectCanManageV2866()||!bossEligibleV2887())return;
 const token=bossOpenViewV2887('fight');
 const C=BOSS_V2887,b=bossPeekV2887(),F=b.fight;
 if(!F)return showBossAltarV2887();
 if(!bossFightFreshV2887(F))return showBossExpiredV2887(token);
 if(F.over)return showBossResultV2887(token,notice);
 const B=C.bosses[F.id],ph=B.phases[F.phase-1],A=C.aspects[F.aspect],esc=escapeGameText;
 let html=`<div id="bossFightV2887" class="loop-board-v286840" style="background:linear-gradient(180deg,${ph.bg},#090909);border:1px solid ${ph.accent};border-radius:8px;padding:10px">`
  +`<h3 style="color:${ph.accent}">${ph.icon} ${ph.name} · 第 ${Math.min(F.round,C.maxRounds)} 合 <small style="color:#aaa">${A.icon}${A.name}</small></h3>`
  +`<p style="color:#cfd8dc;font-size:12px">${ph.scene}</p>${notice?`<p role="status">${esc(notice)}</p>`:''}`
  +`<p>👤 蜕影 ${bossBarV2887(F.bossHp,F.bossMax,ph.accent)} ${Math.max(0,Math.round(100*F.bossHp/F.bossMax))}%${F.armor?` · 🦴骨甲 ${F.armor}`:''}${F.stun?' · 💫僵直':''}</p>`
  +`<p>🧍 气血 ${bossBarV2887(F.hp,F.hpMax,'#8fd18f')} ${Math.max(0,F.hp)}/${F.hpMax}</p>`
  +`<p>灵力 ${Math.round(F.mp)}/${Math.round(F.mpMax)} · 道韵 ${'●'.repeat(F.charge)}${'○'.repeat(C.charge.max-F.charge)}${F.locks?` · 🔒镇岳锁 ×${F.locks}`:''}${F.curse?` · ☠️蚀咒(${F.curse})`:''}${F.seal.left?` · 👄被封「${C.actionNames[F.seal.action]}」(${F.seal.left})`:''}${F.ward?' · 🛡️护法在侧':''}${F.streak.n>=1&&['evade','guard','strike'].includes(F.streak.action)?` · <span style="color:#aaa">连用「${C.actionNames[F.streak.action]}」×${F.streak.n}${F.streak.n>=C.read.after-1?'（再用会被看破）':''}</span>`:''}</p>`;
 if(F.boon){
  html+=`<p style="color:${ph.accent};font-size:15px"><b>——${ph.name}——</b></p><p>${ph.enter}</p><p style="color:${ph.accent}"><b>九锁回应</b>：残存的锁链向你伸来。择其一（不耗回合，每种一战只应一次）。</p>`;
  if(F.phase===3&&F.master&&ph.masterLine)html+=`<p style="color:${ph.accent}">${esc(ph.masterLine.replace('{sect}',String(player.sect||'')))}</p>`;
  html+='</div>';
  for(const id of F.boon.options){const d=id==='master'?bossMasterBoonV2887(F):C.boons[id];html+=`<button class="choice-btn" onclick="bossActV2887('boon:${id}',${token})">${id==='master'?'👑 ':''}${d.name}：${d.desc}</button>`;}
  return showStory(html,[{text:'返回宗门大殿',action:'sect_hall'}]);
 }
 const v=bossIntentViewV2887(F),fs=bossForeshadowV2887(F),pv=bossPreviewV2887(F);
 html+='<details><summary>招式与预告说明</summary><p>强攻消耗全部道韵，每层增伤25%；守势回3%气血、12%灵力并积1层道韵；成功避让会反击并积1层。破阵耗25%灵力，打断蓄力或碎一层骨甲；清心解除蚀咒与封招。每回合自然回复5%灵力，官职与丹道可加成。按钮显示本回合双方气血净变化，包含回复与吸血；入新相仍承受本回合预告招式。每次换相可选一次九锁回应，每项每战一次。普通魂影战最多30回合。</p></details>';
 html+=`<div style="border-left:3px solid ${ph.accent};padding-left:8px;margin:6px 0"><p>⚠️ <b>下一击：${v.icon}【${v.tag}】${v.title}</b><br>${v.tele}${v.counter?`<br><small>应对：${v.counter}</small>`:''}</p>`
  +v.mods.map(m=>`<p style="color:${ph.accent};font-size:12px">${m}</p>`).join('')
  +(fs?`<p style="color:#aaa;font-size:12px">之后：${fs.omen}……</p>`:'')+'</div></div>';
 for(const a of C.actions){if(a==='lock'&&!F.locks)continue;html+=`<button class="choice-btn" onclick="bossActV2887('${a}',${token})" ${pv[a].ok?'':'disabled'}>${bossMoveLabelV2887(F,a,pv[a])}</button>`;}
 showStory(html,[{text:'返回宗门大殿',action:'sect_hall'}]);
}


// ----------------------------------- Sect Master tie-in: the seal in 宗主殿 ----
function bossSealSectionV2887(){               // Read-only section in the current sect administration panel.
 try{
  const token=bossOpenViewV2887('seal');
  const C=BOSS_V2887,b=bossPeekV2887(),w=bossWindowV2887(),bones=bossBonesV2887(),need=C.seal.reinforceBones,A=C.aspects[bossAspectIdV2887(w.year)],adv=bossAdvantagesV2887(),esc=escapeGameText;
  const allies=bossAlliesTextV2887(adv.allies,esc);
  const plan=bossSettlementPreviewV2887();
  return `<h4 id="bossSealV2887">镇岳封印</h4><p>待结旧账${plan.lost}年；加固前失守将为${plan.missed}，繁荣度${plan.prosperity}。确认加固时一并结清。</p><p>封印：${w.open?`松动，余 ${w.daysLeft} 天`:`稳固，${w.daysToOpen} 天后松动`} · ${A.icon}${A.name} · 失守 ${b.seal.missed} 年 · ${C.bone} ×${bones}</p>`
   +`<p style="font-size:12px">九锁之应：${bossMasterBoonV2887({doctrine:adv.doctrine}).name}（由道统决定）${allies.length?'<br>随行：'+allies.join('<br>随行：'):'<br>随行：无（任命护法、执事、先锋，空闲且未随军者会随你上台）'}</p>`
   +`<button class="choice-btn" onclick="reinforceSealV2887(${token})" ${bones>=need&&plan.missed>0&&!b.fight?'':'disabled'}>加固封印（${C.bone} ×${need}：清除失守，繁荣度 +${C.seal.reinforceProsperity}）</button>`
   +'<button class="choice-btn" onclick="showBossAltarV2887()">前往镇岳台</button>';
 }catch(e){return '';}
}


// UI requests belong to one character, sect, view and exact state. Renderers never settle debt or rewards.
let bossViewV2887=null,bossViewSerialV2887=0;
function bossIsMasterV2887(){try{return sectPathMasterV2880();}catch(_){return false;}}
function bossFingerprintV2887(){return JSON.stringify([player.sect,player.level,bossTodayV2887(),bossPeekV2887(),bossBonesV2887(),bossPlayerStatsV2887(),bossAdvantagesV2887()]);}
function bossOpenViewV2887(kind){const token=++bossViewSerialV2887;bossViewV2887={token,owner:player,sect:player.sect,kind,state:bossFingerprintV2887()};return token;}
function bossRequestV2887(token,kinds){
 const v=bossViewV2887,id={altar:'bossAltarV2887',fight:'bossFightV2887',seal:'bossSealV2887'};
 return !!(v&&v.token===token&&v.owner===player&&v.sect===player.sect&&kinds.includes(v.kind)&&sectCanManageV2866()&&bossEligibleV2887()&&document.getElementById(id[v.kind])&&!document.getElementById('storyPanel')?.classList.contains('hidden')&&v.state===bossFingerprintV2887()&&bossTodayV2887()>=bossPeekV2887().highDay);
}
function bossRefuseV2887(kind,msg){
 let text=msg;
 if(!text){
  if(!sectCanManageV2866())text='当前无法处理镇岳台事务（战斗、突破或结算中）。';
  else if(!bossEligibleV2887())text='你已不符合镇岳台的条件。';
  else if(bossTodayV2887()<bossPeekV2887().highDay)text=`当前日期早于镇岳台记录（第${bossPeekV2887().highDay}日），请到那天之后再来。`;
  else text='画面已过期，请使用当前页面的按钮重新选择。';
 }
 try{showFloatingText(text,'#ff9f43');}catch(_){}
 try{
  const v=bossViewV2887,ids={altar:'bossAltarV2887',fight:'bossFightV2887',seal:'bossSealV2887'};
  const visible=v&&v.owner===player&&v.sect===player.sect&&document.getElementById(ids[v.kind])&&!document.getElementById('storyPanel')?.classList.contains('hidden');
  if(visible&&sectCanManageV2866()&&bossEligibleV2887()){
   if(kind==='seal'){if(typeof showSectAdminV2873==='function')showSectAdminV2873();}
   else if(kind==='fight'&&bossPeekV2887().fight)showBossFightV2887(text);
   else showBossAltarV2887(text);
  }
 }catch(e){console.warn('镇岳台刷新失败',e);}
 return false;
}
function bossFightFreshV2887(F){
 const w=bossWindowV2887();return !!(F&&F.sect===player.sect&&bossEligibleV2887()&&bossTodayV2887()>=F.day&&(F.over||w.open&&w.year===F.year));
}
function bossSettlementPreviewV2887(){const plan=bossSettlePlanV2887(player);return {lost:plan.lost,missed:plan.missed,prosperity:plan.prosperity};}
function startBossFightV2887(offer=false,token){
 if(typeof offer!=='boolean')return false;
 if(!bossRequestV2887(token,['altar']))return bossRefuseV2887('altar');
 const C=BOSS_V2887,w=bossWindowV2887();
 if(!w.open)return bossRefuseV2887('altar','封印稳固，尚未松动。');
 if(bossPeekV2887().fight)return bossRefuseV2887('altar','已有一场魂影未结束。');
 if(offer&&bossBonesV2887()<C.offering.bones)return bossRefuseV2887('altar',`${C.bone}不足。`);
 const ok=bossCommitV2887(()=>{
  bossSettleV2887();const b=ensureBossV2887(),T=bossTierV2887(player.level),adv={...bossAdvantagesV2887(),offered:offer};
  const F=bossNewFightV2887('xuanming',T.id,bossPlayerStatsV2887(),adv,b.seal.missed,w.year);
  F.sect=player.sect;F.day=bossTodayV2887();if(offer)bossAddBonesV2887(player,-C.offering.bones);b.fight=F;
 });
 if(ok){bossViewV2887=null;showBossFightV2887('魂影入阵。战斗使用入场面板快照，暂离不会恢复魂影气血或灵力。');}return ok;
}
function bossActV2887(action,token){
 if(!bossRequestV2887(token,['fight']))return bossRefuseV2887('fight');
 const F=bossPeekV2887().fight;if(!bossFightFreshV2887(F)||F.over)return bossRefuseV2887('fight');
 const next=JSON.parse(JSON.stringify(F)),r=bossStepV2887(next,action);if(r.invalid){try{showFloatingText(r.ev[0]||'此招此刻无法使用。','#ff9f43');}catch(_){}return false;}
 const ok=bossCommitV2887(()=>{ensureBossV2887().fight=next;});
 if(ok){bossViewV2887=null;showBossFightV2887(r.ev.join(' '));}return ok;
}
function showBossExpiredV2887(token){
 showStory(`<section id="bossFightV2887" class="loop-board-v286840"><h3>镇岳魂影已过期</h3><p>本场所属宗门或年度开放期已变化，不能继续或领取奖励。已献残骨不退，可放弃后重新挑战。</p><button class="choice-btn" onclick="abandonBossV2887(${token})">放弃本场魂影</button></section>`,[{text:'返回宗门',action:'sect_hall'}]);
}
function showBossResultV2887(token,report=''){
 const b=bossPeekV2887(),F=b.fight,C=BOSS_V2887,esc=escapeGameText,win=F.over==='win',R=win?bossRewardsV2887(F,b,bossTodayV2887()):null;
 const text=win?`评定「${C.grade.names[R.grade]}」 · ${F.round}合。${R.limited?'今日已领奖，本场只计练习。':`灵石+${R.gold} · 修为+${R.exp} · 贡献+${R.contribution} · 残骨+${R.bones} · 繁荣度+${R.prosperity}${!R.repeat?' · 宗门声望+'+(3+F.tier):''}${R.relic?' · '+C.relics[R.relic].name:''}`}`:`打至「${C.bosses[F.id].phases[F.phase-1].name}」，敌方剩余${Math.max(0,Math.round(F.bossHp/F.bossMax*100))}%气血；本次调息${C.defeatDays}游戏日。`;
 showStory(`<section id="bossFightV2887" class="sect-board-v2866 loop-board-v286840"><h3>镇岳${win?'功成':'未成'} · 待结算</h3><p>${esc(report)}</p><p>${text}</p><p>魂影损伤不影响真身。确认后保存本场结果，失败可重试，刷新可继续结算。</p><button class="choice-btn" onclick="bossFinalizeV2887(${token})">${win?'确认战果':'确认调息'}</button></section>`,[{text:'暂离 · 返回宗门',action:'sect_hall'}]);
}
function bossFinalizeV2887(token){
 if(!bossRequestV2887(token,['fight']))return bossRefuseV2887('fight');
 const b=bossPeekV2887(),F=b.fight;if(!F?.over||!bossFightFreshV2887(F))return bossRefuseV2887('fight');
 const win=F.over==='win',R=win?bossRewardsV2887(F,b,bossTodayV2887()):null;
 const ok=bossCommitV2887(()=>{
  const s=ensureBossV2887();
  if(win){
   player.gold+=R.gold;player.exp+=R.exp;grantSectContributionV2768(R.contribution);
   if(R.prosperity)bossAdjustProsperityV2887(player,R.prosperity);if(R.bones)bossAddBonesV2887(player,R.bones);
   s.kills[F.id]++;s.best[F.id]=s.best[F.id]?Math.min(s.best[F.id],F.round):F.round;
   if(!R.limited)s.rewardDay=bossTodayV2887();
   if(!R.repeat){s.seal.wonYears=[...new Set([...s.seal.wonYears,F.year])].sort((a,b)=>a-b).slice(-6);if(F.year===bossWindowV2887().year)s.seal.missed=0;addFactionReputation(player.sect,3+F.tier,'镇岳台');}
   if(R.relic&&!s.relics.includes(R.relic))s.relics.push(R.relic);
   checkLevelUp({silentCooldown:true});
  }else advanceGameTime(BOSS_V2887.defeatDays,'镇岳台调息');
  s.fight=null;s.highDay=Math.max(s.highDay,bossTodayV2887());
 });
 if(ok){bossViewV2887=null;updateStats();showBossAltarV2887(win?'战果已保存，同年首胜与当日练手奖励不会重复领取。':'已完成调息；魂影战损未影响真身。');}return ok;
}
function abandonBossV2887(token){
 if(!bossRequestV2887(token,['altar','fight'])||!bossPeekV2887().fight)return bossRefuseV2887('altar');
 if(!confirm('放弃本场魂影？不发战果、不退献骨；已经结束的战斗请先确认结算。'))return false;
 if(!bossRequestV2887(token,['altar','fight'])||bossPeekV2887().fight?.over)return false;
 const ok=bossCommitV2887(()=>{ensureBossV2887().fight=null;});if(ok){bossViewV2887=null;showBossAltarV2887('已放弃魂影，本场无奖励。');}return ok;
}
function reinforceSealV2887(token){
 if(!bossRequestV2887(token,['seal']))return bossRefuseV2887('seal');
 if(!bossIsMasterV2887())return bossRefuseV2887('seal','只有宗主可以加固封印。');
 if(bossPeekV2887().fight)return bossRefuseV2887('seal','镇岳台的战斗尚未结束，不能加固封印。');
 if(bossBonesV2887()<BOSS_V2887.seal.reinforceBones)return bossRefuseV2887('seal',`${BOSS_V2887.bone}不足。`);
 if(bossSettlementPreviewV2887().missed<=0)return bossRefuseV2887('seal','封印并无失守，无需加固。');
 const ok=bossCommitV2887(()=>{bossSettleV2887();bossAddBonesV2887(player,-BOSS_V2887.seal.reinforceBones);ensureBossV2887().seal.missed=0;bossAdjustProsperityV2887(player,BOSS_V2887.seal.reinforceProsperity);});
 if(ok){bossViewV2887=null;showSectAdminV2873();showFloatingText('九锁重鸣，旧账与加固已保存。','#ffd76a');}return ok;
}

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2768-systems.js"]="28.68.93";
