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
 showStory(`<h3>👑 宗主传承考核</h3><p>${CULTIVATION_REALMS[r.realm].name}境：${gate.realm?'✅':'未达成'}</p><p>累计贡献：${player.sectTotalContribution||0} / ${r.contribution}</p><p>宗门委托考核：${p.tasksCompleted} / ${r.tasks}（本版本起完成的委托计入）</p><p>达标后须完成问心、守山、受印三试并选择道统。守山布阵方案每次需100贡献，失败也扣；其他方案免费。</p>${p.inherited?'<p>✅ 已接受宗主传承</p>':`<button class="choice-btn" onclick="inheritSectV2768()" ${ready?'':'disabled'}>宗主三试 · 开始或继续</button>`}`,[{text:'返回宗门大殿',action:'sect_hall'}]);
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
async function copyRawSaveV2870(raw){
 try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(raw);alert('存档文本已复制，请粘贴保存为 .json 文件。');}
 catch(_){showRawSaveTextV2870(raw);}
}
async function exportRawSaveV2870(raw,name){
 if(!raw)throw Error('暂无可导出的记录');
 // Export is a recovery path, including records rejected by current import validation.
 try{parseSaveV2768(raw);}catch(_){alert('该记录未通过导入安全校验，仍将原样导出供备份或修复。');}
 if(isMobileV2870()&&typeof File==='function'&&navigator.share&&navigator.canShare){
  try{const file=new File([raw],name,{type:'application/json'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file]});return;}}
  catch(e){if(e?.name==='AbortError')return;}
 }
 let url,a;
 try{
  url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();
 }catch(_){await copyRawSaveV2870(raw);}
 finally{a?.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),10000);}
}
async function copySaveTextV2870(){
 try{const raw=currentSaveRawV2870();if(!raw)throw Error('暂无可导出的记录');await copyRawSaveV2870(raw);}catch(e){alert('导出失败：'+e.message);}
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
 try{await exportRawSaveV2870(backup?localStorage.getItem(SAVE_BACKUP_KEY):currentSaveRawV2870(),`xiantu-${backup?'backup':'save'}-${Date.now()}.json`);}
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

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2768-systems.js"]="28.68.56";
