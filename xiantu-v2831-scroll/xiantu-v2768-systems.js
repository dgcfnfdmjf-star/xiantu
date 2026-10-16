// V27.68：存档工具、建筑消耗与宗主传承。
function normalizePromotionV2768(raw={}) {
  const count=Number(raw?.tasksCompleted);
  return {tasksCompleted:Number.isFinite(count)?Math.max(0,Math.floor(count)):0,inherited:raw?.inherited===true};
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
 p.sectPromotion=normalizePromotionV2768(saved.sectPromotion);
 p.buildingReadyDaysV2768=normalizeBuildingUseV2768(saved.buildingReadyDaysV2768);
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
 const p=normalizePromotionV2768(player.sectPromotion),ready=player.level>=4&&(player.sectTotalContribution||0)>=1000&&p.tasksCompleted>=5;
 showStory(`<h3>👑 宗主传承考核</h3><p>元婴境：${player.level>=4?'✅':'未达成'}</p><p>累计贡献：${player.sectTotalContribution||0} / 1000</p><p>宗门委托考核：${p.tasksCompleted} / 5（本版本起完成的委托计入）</p><p>贡献达标后仍需完成考核并亲自接受传承。接受传承不扣贡献。</p>${p.inherited?'<p>✅ 已接受宗主传承</p>':`<button class="choice-btn" onclick="inheritSectV2768()" ${ready?'':'disabled'}>接受宗主传承</button>`}`,[{text:'返回宗门大殿',action:'sect_hall'}]);
}
function inheritSectV2768(){
 if(!sectCanManageV2866())return;
 const p=normalizePromotionV2768(player.sectPromotion);
 if(gameState==='combat'||p.inherited||player.level<4||(player.sectTotalContribution||0)<1000||p.tasksCompleted<5)return;
 p.inherited=true;player.sectPromotion=p;player.sectRank=getCurrentRankInfo().name;
 updateStats();autoSave();
 showStory('<h3>👑 宗门传承</h3><p>五次宗门委托见证了你的担当，元婴修为足以护佑一方。你接过掌门信物，从今日起承担宗门兴衰之责。</p>',[{text:'执掌宗门',action:'sect_hall'}]);
}
function showSaveManagerV2768(){
 document.getElementById('saveManagerV2768')?.remove();
 const el=document.createElement('div');el.id='saveManagerV2768';el.className='mobile-inventory-overlay';el.style.zIndex='100000';
 el.innerHTML='<div class="mobile-inventory-card" style="padding:20px;max-height:85vh;overflow:auto"><h3>📁 存档管理</h3><p>修行记录保存在当前浏览器。导出文件可转移到其他设备；导入会替换当前主存档。</p><button class="choice-btn" onclick="exportSaveV2768()">导出当前存档</button><button class="choice-btn" onclick="exportSaveV2768(true)">导出上一次有效备份</button><p>导入存档文件（JSON，最大8MB）</p><input type="file" accept=".json,application/json" onchange="importSaveV2768(this.files[0]);this.value=\'\'"><button class="choice-btn" onclick="restoreBackupV2768()">恢复上一次有效备份</button><hr><h4>上一位角色</h4><p>重新入世时保留，自动保存不会覆盖这里。</p><button class="choice-btn" onclick="restorePreviousV2838()">恢复上一位角色</button><button class="choice-btn" onclick="exportPreviousV2838()">导出上一位角色</button><p>导入和恢复前会要求确认。不要清除浏览器的网站数据。</p><button class="choice-btn" onclick="document.getElementById(\'saveManagerV2768\').remove()">关闭</button></div>';
 el.addEventListener('pointerdown',e=>{if(e.target===el)el.remove()});document.body.appendChild(el);
}
function exportSaveV2768(backup=false){
 try{
  let raw=backup?localStorage.getItem(SAVE_BACKUP_KEY):null;
  if(!backup)raw=!document.getElementById('gameScreen')?.classList.contains('hidden')?JSON.stringify(createSaveDataV2768()):localStorage.getItem(SAVE_KEY);
  if(!raw)throw Error('暂无可导出的记录');parseSaveV2768(raw);
  const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');
  a.href=url;a.download=`xiantu-${backup?'backup':'save'}-${Date.now()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch(e){alert(`导出失败：${e.message}`);}
}
let saveImportBusyV2768=false;
async function importSaveV2768(file){
 if(!file||saveImportBusyV2768)return;
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破再导入存档');return;}
 if(file.size>8*1024*1024){alert('文件超过8MB，未修改存档');return;}
 const ownerV2838=player;
 saveImportBusyV2768=true;
 try{
  const raw=await file.text(),data=parseSaveV2768(raw);
  if(player!==ownerV2838||!saveChangeAllowedV2838())throw Error('读取期间角色或战斗状态已变化，请重新选择文件');
  if(data.player.testAccount999)throw Error('测试角色不能导入普通角色存档');
  if(!confirm('导入将替换当前修行记录。是否继续？建议先导出当前记录。'))return;
  writeSaveV2768(raw);document.getElementById('saveManagerV2768')?.remove();loadAndStart();
 }catch(e){alert(`导入未完成：${e.message}`);}finally{saveImportBusyV2768=false;}
}
function restoreBackupV2768(){
 if(!saveChangeAllowedV2838()){alert('请先结束战斗或突破再恢复备份');return;}
 try{
  const raw=localStorage.getItem(SAVE_BACKUP_KEY);if(!raw)throw Error('暂无备用档');parseSaveV2768(raw);
  if(!confirm('将恢复到上一次有效保存，之后的进度会回退。是否继续？'))return;
  writeSaveV2768(raw);document.getElementById('saveManagerV2768')?.remove();loadAndStart();
 }catch(e){alert(`恢复失败：${e.message}`);}
}

;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814["xiantu-v2768-systems.js"]="28.68.46";
