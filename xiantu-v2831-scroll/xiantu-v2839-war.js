// V28.47 · 正魔大战：一场战役、三处目标、可续行的亲自交锋。
const WAR_FRONTS_V2839=[
 {name:'夺回前哨',objective:'打通联军进军的通道',enemy:'魔军斥候统领',reward:'成功：战备 +1',intro:'被毁的传讯碑只剩半截。斥候带回消息：前哨还守着通往山门的最后一条路。'},
 {name:'护住灵脉',objective:'保护补给阵与撤离伤员',enemy:'破阵魔将',reward:'成功：额外士气 +6',intro:'灵脉阵旗正在熄灭。医修将伤员移向后方，联军必须守住补给才能继续前进。'},
 {name:'破阵决战',objective:'摧毁敌军核心阵旗',enemy:'镇阵魔帅',reward:'成功：额外优势 +1',intro:'核心阵旗已现，敌军仍在死守。此战能赢下一段归路，却不是三万年仙魔大战的终点。'}
];
const WAR_GOODS_V2839=[
 {name:'行军丹药',cost:20,desc:'大还丹 ×3、聚灵丹 ×3',items:['大还丹','大还丹','大还丹','聚灵丹','聚灵丹','聚灵丹']},
 {name:'草药补给',cost:35,desc:'灵草 ×10、仙果 ×5',materials:{'灵草':10,'仙果':5}},
 {name:'锻造珍材',cost:80,desc:'星辰砂 ×5、血玉 ×3',materials:{'星辰砂':5,'血玉':3}}
];
function warIntV2839(n,min=0,max=1e9){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
function warAllowedV2839(){return gameState==='exploring'&&!player.breakthrough?.isAnimating&&!COMBAT_FINISH_V2764.settling;}
function warIdV2839(w=player.warState){w.serialV2839=warIntV2839(w.serialV2839)+1;return Date.now().toString(36)+'-'+w.serialV2839.toString(36);}
function normalizeWarV2839(p){
 const w=p.warState;if(!w)return;
 w.meritV2839=warIntV2839(w.meritV2839);w.meritEarnedV2839=Math.max(w.meritV2839,warIntV2839(w.meritEarnedV2839));
 if(w.incomingV2839&&(!DEMON_FACTION_POWER[w.incomingV2839.enemy]||typeof w.incomingV2839.id!=='string'))w.incomingV2839=null;
 let c=w.campaignV2775;if(!c)return;
 if(typeof c!=='object'||!DEMON_FACTION_POWER[c.enemy]||!Number.isInteger(c.step)||c.step<0||c.step>3||!Number.isFinite(c.our)||c.our<=0||!Number.isFinite(c.foe)||c.foe<=0||!Array.isArray(c.reports)||c.reports.length!==3||c.reports.some(x=>!Number.isInteger(x)||x<0||x>2)||c.settled){
  w.campaignV2775=null;w.status=WAR_STATUS.PEACE;w.enemy=null;w.phase=0;w.lastNotice={text:'旧战役记录不完整，已结束该次行军。角色财物与已有战史保留，可重新整备。',date:'',result:'整备'};return;
 }
 c.rulesV286841=c.rulesV286841===1?1:0;normalizeWarOfficersV286841(c);
 const legacy=c.versionV2839!==1;
 c.versionV2839=1;c.id=typeof c.id==='string'?c.id.slice(0,100):warIdV2839(w);c.originSect=typeof c.originSect==='string'?c.originSect:p.sect;
 c.mode=c.mode==='defense'?'defense':'attack';c.score=warIntV2839(c.score,0,13);c.morale=warIntV2839(c.morale??60,0,100);c.supplies=warIntV2839(c.supplies??3,0,4);
 c.realm=warIntV2839(c.realm??p.level,0,CULTIVATION_REALMS.length-1);c.phase=warIntV2839(c.phase??p.phase,0,3);c.rests=warIntV2839(c.rests,0,2);c.personalWins=warIntV2839(c.personalWins,0,3);
 c.legacy=!!c.legacy||legacy;c.selected=[0,1,2].map(i=>[0,1,2].includes(c.selected?.[i])?c.selected[i]:null);
 c.rolls=[0,1,2].map(i=>Number.isFinite(c.rolls?.[i])?Math.max(0,Math.min(.999999,c.rolls[i])):Math.random());
 c.attempts=[0,1,2].map(i=>warIntV2839(c.attempts?.[i],0,20));c.killRoll=Number.isFinite(c.killRoll)?Math.max(0,Math.min(.999999,c.killRoll)):Math.random();
 c.log=Array.isArray(c.log)?c.log.filter(x=>typeof x==='string').slice(-30):[];
 c.records=Array.isArray(c.records)?c.records.filter(x=>x&&Number.isInteger(x.stage)&&x.stage>=0&&x.stage<3&&typeof x.text==='string').slice(-12):[];
 c.roster=Array.isArray(c.roster)?c.roster.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.power)&&x.power>=0).slice(0,28):[];
 if(c.pending&&(!c.pending.id||c.pending.stage!==c.step||![0,1,2].includes(c.pending.tactic)))c.pending=null;
 if(legacy)c.log.push('旧版战役已接续：既有阶段、优势与战力保留，剩余目标可选择亲自交锋或指挥联军。');
 w.status=WAR_STATUS.BATTLE;w.enemy=c.enemy;w.phase=c.step;
}
const warNormalizeBeforeV2839=normalizePlayer;
normalizePlayer=function(saved={}){const p=warNormalizeBeforeV2839(saved);normalizeWarV2839(p);return p;};
function warStateV2839(){
 const w=player.warState;
 if(w.campaignV2775?.versionV2839!==1)normalizeWarV2839(player);
 if(w.incomingV2839&&isFactionDestroyed(w.incomingV2839.enemy))w.incomingV2839=null;
 w.meritV2839=warIntV2839(w.meritV2839);w.meritEarnedV2839=Math.max(w.meritV2839,warIntV2839(w.meritEarnedV2839));return w;
}
function warCampaignV2839(id,stage){
 const c=warStateV2839().campaignV2775;if(!c||c.settled||(id&&c.id!==id)||(stage!=null&&c.step!==stage))return null;return c;
}
function warRosterV2839(){
 const w=warStateV2839(),names=[player.sect,...new Set(w.alliedSects||[])].filter((n,i,a)=>n&&a.indexOf(n)===i&&!isFactionDestroyed(n));
 const rows=names.map(n=>({name:n,power:calculateSectPower(n).total,role:n===player.sect?'本宗主力':'盟军',detail:n===player.sect?'含主角、弟子与地利':'该宗实际投入'}));
 const aid=getImmortalWarSupportV2807();if(aid>0)rows.push({name:w.immortalAlly,power:aid,role:'仙门支援',detail:'宗门基础战力的35%'});return rows;
}
function warLogV2839(c,text){c.log.push(text);c.log=c.log.slice(-30);}
function warStageValidV2839(c){return !!c&&c.originSect===player.sect&&c.enemy!==c.originSect&&!isFactionDestroyed(c.enemy)&&!isFactionDestroyed(c.originSect);}
function warChanceV2839(c){const counter=c.selected[c.step]===c.reports[c.step];return Math.max(.15,Math.min(.92,c.our/Math.max(1,c.foe)*.48+(counter ? .20 : -.08)+(c.morale-50)*.002));}
function warEnemyV2839(c){
 const stage=c.step,front=WAR_FRONTS_V2839[stage],phase=Math.min(3,c.phase+(stage===2?1:0));
 const e={name:c.enemy+' · '+front.enemy,hp:240+c.realm*50,maxHp:240+c.realm*50,atk:25+c.realm*6,def:8+c.realm*4,gold:0,exp:0,_realmLevel:c.realm,_realmPhase:phase,_isTaskBattle:true};
 balanceEnemyV2802(e,false,false);return e;
}
// Override existing routes so every old button enters the same guarded war flow.
showWarTargetList=function(){showWarHubV2839();};
declareWar=function(enemy){
 if(!warAllowedV2839())return;
 const w=warStateV2839();if(w.campaignV2775)return showWarCampaignV2775();
 if(!player.sect||!DEMON_FACTION_POWER[enemy]||enemy===player.sect||isFactionDestroyed(enemy))return showWarHubV2839();
 showWarPreparationV2839(enemy);
};
executeWar=function(enemy){
 if(!warAllowedV2839()||!player.sect||isFactionDestroyed(player.sect))return;
 const w=warStateV2839();if(w.campaignV2775)return showWarCampaignV2775();
 if(!DEMON_FACTION_POWER[enemy]||enemy===player.sect||isFactionDestroyed(enemy))return;
 const incoming=w.incomingV2839,defense=incoming?.enemy===enemy;if(incoming&&!defense)return showWarHubV2839();
 if(!defense&&w.warCooldown>0)return showWarHubV2839();
 const roster=warRosterV2839(),our=roster.reduce((s,r)=>s+r.power,0),foe=calculateSectPower(enemy).total*(defense?1+getWarLevel()*.12:1);
 if(our<=0||foe<=0||(!defense&&our/foe<=.5))return showWarPreparationV2839(enemy);
 if(!commitWarV286841(()=>{const c={rulesV286841:1,officersV286841:[null,null,null],commanderV286841:null,versionV2839:1,id:warIdV2839(),originSect:player.sect,enemy,mode:defense?'defense':'attack',step:0,score:0,log:[],records:[],settled:false,legacy:false,taisuiIntel:!!player._taisuiWarIntel,
  our:Math.round(our),foe:Math.round(foe),roster,realm:player.level,phase:player.phase||0,morale:60,supplies:3,rests:0,personalWins:0,selected:[null,null,null],attempts:[0,0,0],reports:Array.from({length:3},()=>Math.floor(Math.random()*3)),rolls:Array.from({length:3},()=>Math.random()),killRoll:Math.random(),pending:null};
 w.campaignV2775=c;w.status=WAR_STATUS.BATTLE;w.enemy=enemy;w.phase=0;if(defense){w.incomingV2839=null;w.lastNotice={text:`已集结迎击${enemy}，战役进行中。`,date:getGameDateLabel(),result:'迎敌'};}
 warLogV2839(c,`${player.sect}领军${defense?'迎敌':'出征'}，本次投入 ${c.our} 战力，对阵 ${c.foe} 战力。`);}))return;showWarCampaignV2775();
};
chooseWarTacticV2775=function(tactic,stage){
 if(!warAllowedV2839())return;const c=warCampaignV2839(null,stage);
 if(!warStageValidV2839(c)||c.pending||stage>=3||![0,1,2].includes(tactic))return;
 if(commitWarV286841(()=>{c.selected[stage]=tactic}))showWarCampaignV2775();
};
function resolveWarStageV2839(c,won,mode){
 const stage=c.step,correct=c.selected[stage]===c.reports[stage],points=(correct?2:0)+(won?1:0);
 c.score+=points;c.morale=Math.max(0,Math.min(100,c.morale+(won?6:-10)));
 if(won){if(stage===0)c.supplies=Math.min(4,c.supplies+1);if(stage===1)c.morale=Math.min(100,c.morale+6);if(stage===2)c.score++;if(mode==='personal')c.personalWins++;}
 const text=`${WAR_FRONTS_V2839[stage].name}：${WAR_TACTICS_V2775[c.selected[stage]].name} · ${mode==='personal'?'亲自交锋':mode==='held'?'限时重创':'统领联军'} · ${won?'目标达成':'推进受挫'} · 优势 +${points}${won&&stage===2?'（破阵额外 +1）':''}`;
 warOfficerEffectV286841(c,stage,won);
 c.records.push({stage,won,mode,tactic:c.selected[stage],text});warLogV2839(c,text);c.step++;player.warState.phase=c.step;
}
function commandWarStageV2839(id,stage){
 if(!warAllowedV2839())return;const c=warCampaignV2839(id,stage);
 if(!warStageValidV2839(c)||c.pending||stage>=3||c.selected[stage]==null)return;
 const won=c.rolls[stage]<warChanceV2839(c);if(commitWarV286841(()=>resolveWarStageV2839(c,won,'command')))showWarCampaignV2775();
}
function startWarDuelV2839(id,stage){
 if(!warAllowedV2839())return;const c=warCampaignV2839(id,stage);
 if(!warStageValidV2839(c)||stage>=3||c.selected[stage]==null||player.hp<=1)return;
 const commander=c.rulesV286841===1&&stage===2;
 if(commander&&!c.pending&&c.commanderV286841)return;
 if(!commitWarV286841(()=>{if(!c.pending){if(c.supplies<1)throw Error('no supplies');c.supplies--;c.attempts[stage]++;c.pending={id:warIdV2839(),stage,tactic:c.selected[stage]};if(commander)c.commanderV286841='fighting';}}))return;
 const p=c.pending,enemy=warEnemyV2839(c);enemy._warV2839={campaignId:c.id,stage,encounterId:p.id,turns:0,awaitingAction:false};
 closeWarPanelV2839();startCombat(enemy,false,false,null);
 if(commander)addCombatLog('阵前斩将：8次行动内取胜，联军最终战力+30%；限时重创至30%气血，战力+15%。每场仅一次，未完成刷新可续行。','boss');
}
function finishWarDuelV2839(won,reason=''){
 if(gameState!=='combat'||!currentEnemy?._warV2839||COMBAT_FINISH_V2764.settling)return;
 const enemy=currentEnemy,tag=enemy._warV2839,c=warCampaignV2839(tag.campaignId,tag.stage),owner=player;
 const valid=c&&c.pending?.id===tag.encounterId&&warStageValidV2839(c),commander=valid&&c.rulesV286841===1&&tag.stage===2;
 const held=commander&&!won&&reason==='timeout'&&enemy.hp<=enemy.maxHp*.30;
 beginCombatFinishV2764(won||held?'victory':'defeat',{disabled:true});
 const saved=valid&&commitWarV286841(()=>{
  c.pending=null;
  if(commander)c.commanderV286841=won?'win':held?'held':'failed';
  if(won||held){resolveWarStageV2839(c,true,won?'personal':'held');warLogV2839(c,commander?(won?'阵前斩将成功，联军最终战力+30%。':'敌将已遭重创，联军最终战力+15%。'):'亲自交锋获胜。');}
  else{player.hp=Math.max(1,player.hp);c.morale=Math.max(0,c.morale-10);warLogV2839(c,`${WAR_FRONTS_V2839[c.step].name}：${reason==='timeout'?'限时已到':'负伤'}撤回，士气-10；${commander?'本场斩将机会已用，可统领联军继续。':'可整备重试或统领联军。'}`);}
  player.hp=Math.max(1,player.hp);
 },true);
 addCombatLog(saved?(won?'阵前获胜！战果已保存，整场结束统一领取奖励。':held?'敌将重创！战力加成已保存。':'已撤回军阵，未扣灵石；返回军务继续推进。'):'交锋结算未保存或战役记录已变化，返回军务查看可续行记录。','boss');
 player.hp=Math.max(1,player.hp);updateStats();
 readyCombatFinishV2764({kind:saved&&(won||held)?'victory':'defeat',delay:550,skipReturn:true,label:'返回正魔战场',afterReturn:()=>{if(player===owner)showWarCampaignV2775();}});
}

function restWarV2839(id){
 if(!warAllowedV2839())return;const c=warCampaignV2839(id);if(!warStageValidV2839(c)||c.step>=3||c.rests>=2)return;
 const cost=80+c.realm*30;if(player.gold<cost)return;
 if(!confirm(`消耗 ${cost} 灵石与 1 个游戏日，恢复气血、灵力并补充 2 点战备？每场限两次。`))return;
 if(!warAllowedV2839()||warCampaignV2839(id)!==c||player.gold<cost||c.rests>=2)return;
 if(!commitWarV286841(()=>{player.gold-=cost;c.rests++;c.supplies=Math.min(4,c.supplies+2);player.hp=getMaxHp();player.mp=getMaxMp();advanceGameTime(1,'军营整备');warLogV2839(c,`军营整备：支出 ${cost} 灵石，恢复状态并补充战备。`);}))return;updateStats();showWarCampaignV2775();
}
retreatWarV2775=function(){
 if(!warAllowedV2839())return;const c=warCampaignV2839();if(!c)return;
 if(!confirm('确认撤军？保留战史，不发战役奖励；盟友解散，已付费用不返还，主动出征至少休整7个游戏日，已有更长休整保留。'))return;
 if(warCampaignV2839(c.id)!==c||!warAllowedV2839())return;
 const w=warStateV2839();if(!commitWarV286841(()=>{c.settled=true;
 w.history.push({id:c.id,enemy:c.enemy,result:'撤军',ourPower:c.our,enemyPower:c.foe,type:c.mode==='defense'?'defense_v2839':'declared',date:getGameDateLabel(),rounds:c.step,kills:0,ratio:0,roster:c.roster,tactics:c.log.slice(),score:c.score,personalWins:c.personalWins,rewards:{gold:0,exp:0,contribution:0,merit:0},versionV2839:1});
 w.history=w.history.slice(-60);w.lastNotice={text:`对${c.enemy}的行动已撤军，未发放战役奖励。`,date:getGameDateLabel(),result:'撤军'};clearWarCampaignV2839(w,7,WAR_STATUS.PEACE);}))return;updateStats();showWarReceiptV2839(c.id);
};
function clearWarCampaignV2839(w,cooldown,status){
 w.campaignV2775=null;w.status=status;w.enemy=null;w.phase=0;w.warCooldown=Math.max(w.warCooldown||0,cooldown);w.alliedSects=[];w.immortalSupport=false;w.immortalAlly=null;
}
settleWarV2775=function(enemy){
 if(!warAllowedV2839())return;const c=warCampaignV2839();if(!c||c.enemy!==enemy||c.step!==3||c.pending)return;
 if(!warStageValidV2839(c))return showWarCampaignV2775();
 const w=warStateV2839(),factor=warFactorV286841(c),our=c.our*factor,ratio=our/Math.max(1,c.foe);
 const tier=ratio>1.8?'total':ratio>1.2?'major':ratio>.8?'minor':ratio>.5?'defense':null;
 const result=tier?WAR_REWARDS[tier].desc:'战败',kills=tier==='total'?20+Math.floor(c.killRoll*30):tier==='major'?10+Math.floor(c.killRoll*20):tier==='minor'?5+Math.floor(c.killRoll*15):tier==='defense'?2+Math.floor(c.killRoll*8):0;
 const base=tier?WAR_REWARDS[tier]:null,merit=base?({total:100,major:60,minor:35,defense:15}[tier]+c.personalWins*10):0;
 const reward=base?{gold:Math.floor(base.gold*(1+kills/100)*warRewardScaleV286841(c)),exp:Math.floor(base.exp*(1+kills/100)*warRewardScaleV286841(c)),contribution:Math.floor(base.contribution*(1+kills/100)),merit}:{gold:0,exp:0,contribution:0,merit:0};
 const mercy=warMercyV286841(c),penalty=base?0:Math.floor(Math.min(500,Math.floor(player.gold*.08))*(1-mercy));
 // Close first: repeated UI callbacks cannot grant a second receipt.
 if(!commitWarV286841(()=>{
 c.settled=true;const record={id:c.id,versionV2839:1,enemy:c.enemy,result,ourPower:Math.round(our),enemyPower:Math.round(c.foe),ratio,kills,date:getGameDateLabel(),rounds:3,allies:[...w.alliedSects],immortalSupport:w.immortalSupport,immortalAlly:w.immortalAlly,taisuiIntel:c.taisuiIntel,type:c.mode==='defense'?'defense_v2839':'declared',roster:c.roster,tactics:c.log.slice(),score:c.score,personalWins:c.personalWins,records:c.records.slice(),rewards:reward,penalty,rewardScale:warRewardScaleV286841(c),commander:c.commanderV286841||null,officers:c.officersV286841||[],mercy};
 w.history.push(record);w.history=w.history.slice(-60);w.playerKills=(w.playerKills||0)+kills;
 player.gold+=reward.gold-penalty;player.exp+=reward.exp;player.sectContribution=(player.sectContribution||0)+reward.contribution;player.sectTotalContribution=(player.sectTotalContribution||0)+reward.contribution;
 w.meritV2839+=merit;w.meritEarnedV2839+=merit;
 if(base){player.sectData.prosperity=(player.sectData.prosperity||20)+Math.floor(kills/2);addFactionReputation(c.originSect,Math.max(5,Math.floor(kills/2)),'宗门战争胜利');for(const ally of w.alliedSects)addFactionReputation(ally,5,'并肩参战');}
 else{player.sectData.prosperity=Math.max(10,(player.sectData.prosperity||20)-10);addFactionReputation(c.originSect,-5,'宗门战争战败');}
 addFactionReputation(c.enemy,base?-Math.min(25,10+Math.floor(kills/5)):-5,'正魔交战');
 if(mercy)player.sectData.prosperity=(player.sectData.prosperity||20)+(mercy>=.75?6:3);
 if(c.taisuiIntel)player._taisuiWarIntel=false;
 w.lastNotice={text:`对${c.enemy}的会战已${result}，战果已结算，可在战争史查看。`,date:getGameDateLabel(),result};
 clearWarCampaignV2839(w,c.mode==='defense'?7:30,base?WAR_STATUS.VICTORY:WAR_STATUS.DEFEAT);
 player.sectRank=getCurrentRankInfo().name;
 }))return;
 updateStats();showWarReceiptV2839(c.id);checkLevelUp({silentCooldown:true});
};
function exchangeWarMeritV2839(index){
 if(!warAllowedV2839()||!Number.isInteger(index))return;const goods=WAR_GOODS_V2839[index],w=warStateV2839();if(!goods||w.meritV2839<goods.cost)return;
 const owner=player;if(!confirm(`使用 ${goods.cost} 军功兑换${goods.name}：${goods.desc}？`))return;
 if(player!==owner||!warAllowedV2839()||player.warState!==w||w.meritV2839<goods.cost)return;
 if(!commitWarV286841(()=>{w.meritV2839-=goods.cost;if(goods.items)player.inventory.push(...goods.items);
 for(const [name,n] of Object.entries(goods.materials||{})){player.materials[name]=(player.materials[name]||0)+n;onCollectMaterial(name,n);}
 }))return;updateStats();showWarMeritV2839();
}
// Incoming assaults are dispatches awaiting the player's decision. Resting never silently bills a battle loss.
checkDemonInvasion=function(){
 if(!player?.sect||!player.warState)return;const w=warStateV2839();
 if(w.campaignV2775||w.incomingV2839||w.status===WAR_STATUS.BATTLE||getGameDate().day!==1)return;
 const day=player.worldTime.totalDays;if(w.lastInvasionCheckV2775===day)return;w.lastInvasionCheckV2775=day;
 const chance=Math.max(.003,[.01,.03,.07,.15][getWarLevel()]-(player.sectData?.prosperity||20)/1800);if(Math.random()>=chance)return;
 const names=Object.keys(DEMON_FACTION_POWER).filter(n=>n!==player.sect&&!isFactionDestroyed(n));if(!names.length)return;
 const enemy=names[Math.floor(Math.random()*names.length)];w.incomingV2839={id:warIdV2839(),enemy,day};
 w.lastNotice={text:`${enemy}逼近山门，守军请求调度。请进入正魔大战处理；尚未交战，未扣灵石。`,date:getGameDateLabel(),result:'待迎敌'};autoSave();
};
let warUiV2839=null;
function closeWarPanelV2839(){const old=warUiV2839;warUiV2839=null;document.getElementById('warPanelV2839')?.remove();FLAT_WORLD.keys={};if(old?.opener?.isConnected)old.opener.focus?.();}
function warButtonV2839(label,fn,disabled=false,kind=''){
 const s=warUiV2839,id=String(s.actions.length);s.actions.push(fn);
 return `<button type="button" class="war-btn-v2839 ${kind}" data-war-action="${id}" ${disabled?'disabled':''}>${discipleEscV2815(label)}</button>`;
}
function openWarPanelV2839(title,body,footer){
 if(!warAllowedV2839())return;const opener=document.activeElement;closeWarPanelV2839();closeTaskPanel();closeSceneV2838();document.getElementById('afterBattleV2838')?.remove();stopNavigationV2830();FLAT_WORLD.target=null;FLAT_WORLD.keys={};
 const s={owner:player,opener,actions:[]};warUiV2839=s;const el=document.createElement('div');el.id='warPanelV2839';el.className='war-overlay-v2839';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','warTitleV2839');
 const content=body(),bottom=footer?footer():warButtonV2839('返回军务',showWarHubV2839);
 const close=warButtonV2839('收起',()=>{autoSave();closeWarPanelV2839();});
 el.innerHTML=`<section class="war-sheet-v2839"><header><div><small>仙途 · 烽火三界</small><h2 id="warTitleV2839">${discipleEscV2815(title)}</h2></div>${close}</header><div class="war-content-v2839">${content}</div><footer>${bottom}</footer></section>`;
 el.onclick=e=>{const btn=e.target.closest('[data-war-action]');if(!btn||btn.disabled||warUiV2839!==s||s.owner!==player||!warAllowedV2839())return;if(!el.contains(btn))return;const fn=s.actions[Number(btn.dataset.warAction)];if(typeof fn==='function')fn();};
 el.onkeydown=e=>{e.stopPropagation();if(warUiV2839!==s||s.owner!==player)return;if(e.key==='Escape'){e.preventDefault();autoSave();closeWarPanelV2839();}else trapJourneyFocusV2838(e,el);};document.body.appendChild(el);el.querySelector('button:not([disabled])')?.focus();
}
function warStatsV2839(c){return `<div class="war-stats-v2839"><div><small>士气</small><b>${c.morale}<em>/100</em></b><progress max="100" value="${c.morale}"></progress></div><div><small>战备</small><b>${c.supplies}<em>/4</em></b><span>亲自交锋消耗 1</span></div><div><small>战术优势</small><b>${c.score}</b><span>目标 ${c.step}/3</span></div></div>`;}
function warRosterHtmlV2839(rows,foe,lockedOur){const esc=discipleEscV2815;if(!rows.length)return `<p class="war-muted-v2839">旧版记录未保存各宗投入明细。锁定联军战力 ${Math.round(lockedOur||0)} / 敌军 ${Math.round(foe||0)}。</p>`;return `<details class="war-details-v2839"><summary>参战宗门与投入战力 · 联军 ${Math.round(rows.reduce((s,r)=>s+r.power,0))} / 敌军 ${Math.round(foe)}</summary><table><thead><tr><th>宗门</th><th>职责</th><th>投入</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}<small>${esc(r.detail||'本次行军记录')}</small></td><td>${esc(r.role||'参战')}</td><td>${Math.round(r.power)}</td></tr>`).join('')}</tbody></table><p>以上为本次参战投入，出征后固定。盟友与地利在出征时计入，临时换装不会重复增加联军战力。</p></details>`;}
function showWarHubV2839(){
 if(!warAllowedV2839())return;const w=warStateV2839(),c=w.campaignV2775,esc=discipleEscV2815;
 if(c)return showWarCampaignV2775();
 openWarPanelV2839('正魔大战 · 军务',()=>{
  let html=`<div class="war-hero-v2839"><span>三万年烽火 · 此战为护归途</span><h3>${esc(player.sect||'尚未加入宗门')}</h3><p>备战结盟 → 三阶段会战 → 战果复盘</p></div><div class="war-stats-v2839"><div><small>可用军功</small><b>${w.meritV2839}</b></div><div><small>主动出征休整</small><b>${w.warCooldown||0}<em>游戏日</em></b></div><div><small>战史</small><b>${w.history.length}</b></div></div>`;
  if(w.incomingV2839){const enemy=w.incomingV2839.enemy;html+=`<section class="war-notice-v2839"><h3>山门急报 · ${esc(enemy)}</h3><p>守军正在集结，等待你调度。迎敌不受主动出征冷却限制。</p>${warButtonV2839('查看来敌 · 整备迎战',()=>declareWar(enemy),false,'primary')}</section>`;}
  html+='<h3>选择战场</h3><p class="war-muted-v2839">先查看双方投入、补给与预期，再确认出征。筹备页面不会自动开战。</p><div class="war-targets-v2839">';
  for(const enemy of Object.keys(DEMON_FACTION_POWER).filter(n=>n!==player.sect&&!isFactionDestroyed(n))){const n=calculateSectPower(enemy).total;html+=warButtonV2839(`${enemy} · ${n} 战力`,()=>declareWar(enemy),!player.sect||!!w.incomingV2839||w.warCooldown>0);}
  html+='</div>';if(w.warCooldown>0)html+='<p>休整按游戏时间推进，可进行修炼、宗门事务或休息，无需等现实倒计时。</p>';
  if(w.lastNotice)html+=`<p class="war-muted-v2839">${esc(w.lastNotice.text||'')}</p>`;return html;
 },()=>warButtonV2839('军功兑换',showWarMeritV2839)+warButtonV2839('历次战报',showWarHistory)+warButtonV2839('返回宗门',()=>{closeWarPanelV2839();showSectHall();}));
}
function showWarPreparationV2839(enemy){
 const w=warStateV2839(),rows=warRosterV2839(),our=rows.reduce((s,r)=>s+r.power,0),defense=w.incomingV2839?.enemy===enemy,foe=calculateSectPower(enemy).total*(defense?1+getWarLevel()*.12:1),ratio=our/Math.max(1,foe),esc=discipleEscV2815;
 openWarPanelV2839((defense?'山门迎敌':'战前筹备')+' · '+enemy,()=>`<div class="war-hero-v2839"><span>${defense?'守住来路':'战前军议'}</span><h3>${esc(getWarOutlook(ratio).name)}</h3><p>${esc(getWarOutlook(ratio).desc)}</p></div>${warRosterHtmlV2839(rows,foe)}<section class="war-notice-v2839"><h3>这场怎么打</h3><p>确认后进入地图战场，可见弟子护阵、修士斗法与军令台，战场表现按境界分层。点击地图下方“参战”下达军令：前哨、灵脉、核心阵三处目标，先选克制战术，再亲自交锋或指挥联军。初始士气60、战备3，可暂离保存。</p><p>亲自交锋获胜增加军功；负伤只降士气，可整备重试。整场战败沿用战争损失：身上灵石8%，最多500，不再叠加普通战斗的20%。撤军不发奖励。</p><p>战役结束统一发放灵石、修为、宗门贡献与军功。主动出征休整30个游戏日；迎敌与撤军至少休整7日，已有更长休整保留。</p></section><p>本次出征灵石/修为倍率 ×${WAR_SCALE_V286841[warIntV2839(player.level,0,16)]}，出征时锁定；贡献和军功沿用原值。第三阶段可进行8次行动限时斩将，取胜战力+30%，重创+15%。可在各阶段委任一名空闲弟子。</p><h3>战前状态</h3><p>气血 ${Math.floor(player.hp)}/${getMaxHp()}　灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p><div class="war-actions-v2839">${warButtonV2839('邀请人族盟军 · 每宗30贡献',()=>showWarAlliesV2839(enemy))}${warButtonV2839('请求仙门支援 · 需150贡献',()=>requestWarImmortalV2839(enemy),w.immortalSupport||getWarLevel()<2||player.sectContribution<150)}</div><p class="war-muted-v2839">仙援需达到局部会战且声望符合条件。成功扣150贡献；未获回应扣75，请求前会确认。</p>`,()=>warButtonV2839(defense?'确认迎敌':'确认出征',()=>executeWar(enemy),!player.sect||(!defense&&(ratio<=.5||w.warCooldown>0))||!!w.incomingV2839&&!defense,'primary')+warButtonV2839('返回军务',showWarHubV2839));
}
function showWarAlliesV2839(enemy){
 if(!warAllowedV2839()||warCampaignV2839())return;const w=warStateV2839(),esc=discipleEscV2815;
 openWarPanelV2839('联军招募',()=>`<p>每宗30贡献，确认后结盟。本次战役结束或撤军后解散。</p><p>可用贡献：${player.sectContribution}</p><div class="war-targets-v2839">${Object.keys(HUMAN_FACTION_POWER).filter(n=>n!==player.sect&&!isFactionDestroyed(n)).map(n=>warButtonV2839(`${n} · ${calculateSectPower(n).total} 战力${w.alliedSects.includes(n)?' · 已结盟':''}`,()=>{
  const owner=player;if(!confirm(`支付30贡献，邀请${n}加入本次联军？`))return;
  if(player!==owner||!warAllowedV2839()||warCampaignV2839()||w.alliedSects.includes(n)||player.sectContribution<30||isFactionDestroyed(n))return;
  player.sectContribution-=30;w.alliedSects.push(n);autoSave();showWarAlliesV2839(enemy);
 },w.alliedSects.includes(n)||player.sectContribution<30)).join('')}</div>`,()=>warButtonV2839('返回战前筹备',()=>declareWar(enemy)));
}
function requestWarImmortalV2839(enemy){
 if(!warAllowedV2839()||warCampaignV2839()||!DEMON_FACTION_POWER[enemy]||enemy===player.sect||isFactionDestroyed(enemy))return;
 const w=warStateV2839();if(w.immortalSupport||getWarLevel()<2||player.sectContribution<150)return;
 const eligible=IMMORTAL_SECTS_FULL.filter(f=>f.name!=='太岁书院'&&canRequestAid(f.name)&&!isFactionDestroyed(f.name));
 openWarPanelV2839('向仙门求援',()=>`<p>可用贡献 ${player.sectContribution}。选定仙门后仍需确认：成功消耗150贡献，未获回应消耗75贡献。</p>${eligible.length?eligible.map(f=>{
  const rate=Math.min(.85,.3+(player.sectData?.prosperity||20)/500+(player.factionReputation?.[f.name]||0)/250);
  return '<article class="war-history-v2839"><h3>'+discipleEscV2815(f.name)+'</h3><p>支援战力 '+Math.round(getFactionWorldBasePower(f.name)*.35)+' · 应援概率 '+Math.round(rate*100)+'%</p>'+warButtonV2839('请求'+f.name+'支援',()=>{
   const owner=player;if(!confirm('向'+f.name+'求援？成功扣150贡献，未获回应扣75贡献。'))return;
   if(player!==owner||!warAllowedV2839()||warCampaignV2839()||w.immortalSupport||player.sectContribution<150||isFactionDestroyed(f.name)||!canRequestAid(f.name))return;
   const ok=Math.random()<rate;player.sectContribution-=ok?150:75;
   if(ok){w.immortalSupport=true;w.immortalAlly=f.name;addFactionReputation(f.name,5,'宗门战争求援');}
   w.lastNotice={text:ok?f.name+'同意支援，已消耗150贡献。':f.name+'未回应，已消耗75贡献。',date:getGameDateLabel(),result:'求援'};updateStats();autoSave();
   openWarPanelV2839('仙门回讯',()=>'<p>'+discipleEscV2815(w.lastNotice.text)+'</p>',()=>warButtonV2839('返回战前筹备',()=>declareWar(enemy)));
  })+'</article>';
 }).join(''):'<p>暂无达到声望与干预条件的仙门。可先通过三界势力玩法改善关系。</p>'}`,()=>warButtonV2839('返回战前筹备',()=>declareWar(enemy)));
}
requestImmortalSupport=requestWarImmortalV2839;
findAllies=showWarAlliesV2839;
showWarCampaignV2775=function(){
 if(!warAllowedV2839())return;const c=warCampaignV2839();if(!c)return showWarHubV2839();
 const esc=discipleEscV2815,valid=warStageValidV2839(c),stage=c.step;
 openWarPanelV2839('正魔大战 · '+c.enemy,()=>{
  let html=`<div class="war-fronts-v2839">${WAR_FRONTS_V2839.map((f,i)=>`<div class="${i<stage?'done':i===stage?'current':''}"><small>${i<stage?'已推进':i===stage?'当前目标':'后续目标'}</small><strong>${i+1}. ${f.name}</strong></div>`).join('')}</div>${warStatsV2839(c)}<p>本场灵石/修为奖励 ×${warRewardScaleV286841(c)} · 按出征境界锁定，贡献与军功不乘倍。</p>${warOfficersHtmlV286841(c)}`;
  if(!valid)html+='<p class="war-notice-v2839">宗门归属或目标状态已变化，无法继续使用原联军。请有序撤军后重新整备。</p>';
  else if(stage<3){const front=WAR_FRONTS_V2839[stage],tactic=c.selected[stage],enemy=warEnemyV2839(c);
   html+=`<section class="war-scene-v2839"><small>${front.objective}</small><h3>${front.name}</h3><p>${front.intro}</p><p class="war-report-v2839">敌情：${WAR_REPORTS_V2775[c.reports[stage]]}</p><p>${front.reward}</p></section><h3>① 选择本阶段战术</h3>${warButtonV2839('☯ Jev 战术参议',jevWarV2846,!!c.pending)}<div class="war-tactics-v2839">${WAR_TACTICS_V2775.map((t,i)=>warButtonV2839(`${tactic===i?'✓ ':''}${t.name} · ${t.hint}`,()=>chooseWarTacticV2775(i,stage),!!c.pending,tactic===i?'selected':'')).join('')}</div><h3>② 推进目标</h3><div class="war-mission-v2839"><b>${esc(enemy.name)}</b><p>${esc(CULTIVATION_REALMS[c.realm].name)}${['初期','中期','后期','圆满'][enemy._realmPhase]} · 气血 ${enemy.maxHp} · 攻击 ${enemy.atk} · 防御 ${enemy.def}</p><p>你的气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p>${c.pending?'<p>上次交锋尚未结算。可以重新进入，敌方恢复到开战状态；沿用当前气血灵力，不再扣战备。</p>':''}<div class="war-actions-v2839">${warButtonV2839(c.pending?'继续未结算交锋':c.rulesV286841===1&&stage===2?'主将阵前单挑 · 8次行动 / 战备−1':'亲自交锋 · 战备 −1',()=>startWarDuelV2839(c.id,stage),tactic==null||player.hp<=1||(!c.pending&&(c.supplies<1||(c.rulesV286841===1&&stage===2&&!!c.commanderV286841))),'primary')}${warButtonV2839(tactic==null?'统领联军 · 先选择战术':`统领联军 · 预估成功 ${Math.round(warChanceV2839(c)*100)}%`,()=>commandWarStageV2839(c.id,stage),tactic==null||!!c.pending)}</div>${c.rulesV286841===1&&stage===2?'<p>限时斩将胜利：最终战力+30%；到时敌将气血≤30%：+15%。本场仅一次；失败后仍可统领联军。此加成影响实际战果，不保证必胜。</p>':''}<p class="war-muted-v2839">亲自交锋沿用已装配招式与自动战斗策略，需真正获胜。联军推进受战力、克制战术与士气影响，受挫也会进入下一阶段。</p></div>`;
  }else html+='<section class="war-notice-v2839"><h3>三个阶段已结束</h3><p>军功与战利品尚未发放，请查看战报并完成战役结算。</p></section>';
  html+=warRosterHtmlV2839(c.roster,c.foe,c.our)+`<details class="war-details-v2839" ${stage===3?'open':''}><summary>本次行军记录 · ${c.log.length} 条</summary><ol>${c.log.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></details>`;return html;
 },()=> (stage===3&&valid?warButtonV2839('结算本场战役',()=>settleWarV2775(c.enemy),false,'primary'):warButtonV2839(`军营整备 · ${80+c.realm*30}灵石`,()=>restWarV2839(c.id),!valid||c.rests>=2||player.gold<80+c.realm*30))+warButtonV2839('查看地图战况',viewWarMapV2840)+warButtonV2839('暂离 · 保存进度',()=>{autoSave();closeWarPanelV2839();showSectHall();})+warButtonV2839('有序撤军',retreatWarV2775,false,'danger'));
};
showWarHistory=function(){
 if(!warAllowedV2839())return;const w=warStateV2839(),esc=discipleEscV2815;
 openWarPanelV2839('宗门战争史',()=>`<p>保留最近60场战报。回看只展示记录，不重复发放战利品。</p>${w.history.length?[...w.history].reverse().map((h,n)=>`<article class="war-history-v2839"><h3>${esc(h.result)} · ${esc(h.enemy)}</h3><p>${esc(h.date||'旧日战报')} · ${h.type==='invasion'||h.type==='defense_v2839'?'守卫山门':'主动出征'} · ${warIntV2839(h.rounds)}阶段</p>${h.versionV2839===1?warButtonV2839('查看投入、战术与所得',()=>showWarReceiptV2839(h.id)):`<p>旧版战报：斩敌 ${warIntV2839(h.kills)} · ${esc(getWarOutlook(Number(h.ratio)||0).name)}</p>`}</article>`).join(''):'<p>还没有战报。首场战役结束后会记录在这里。</p>'}`,()=>warButtonV2839('返回军务',showWarHubV2839)+warButtonV2839('军功兑换',showWarMeritV2839));
};
function showWarReceiptV2839(id){
 if(!warAllowedV2839())return;const h=warStateV2839().history.find(x=>x.id===id);if(!h)return showWarHistory();const r=h.rewards||{},esc=discipleEscV2815;
 openWarPanelV2839('战役复盘 · '+h.result,()=>`<div class="war-hero-v2839"><span>${esc(h.date)}</span><h3>${esc(h.result)} · ${esc(h.enemy)}</h3><p>亲自取胜 ${h.personalWins||0} 次 · 战术优势 ${h.score||0}</p><p>出征境界奖励倍率 ×${h.rewardScale||1}${h.commander==='win'?' · 斩将战力+30%':h.commander==='held'?' · 重创战力+15%':''}</p><p>随军：${(h.officers||[]).filter(Boolean).map(o=>esc(o.name)).join('、')||'无委任'}${h.mercy?` · 仁厚护阵减少${Math.round(h.mercy*100)}%战败损失`:''}</p></div><section class="war-notice-v2839"><h3>本场所得 · 已结算</h3><div class="war-rewards-v2839"><span>灵石 <b>+${r.gold||0}</b></span><span>修为 <b>+${r.exp||0}</b></span><span>贡献 <b>+${r.contribution||0}</b></span><span>军功 <b>+${r.merit||0}</b></span></div>${h.penalty?`<p>战败扣除灵石 ${h.penalty}（基础为身上8%、上限500；已计入本场护阵减免）。阵前负伤未重复扣款。</p>`:''}<p>气血 ${Math.floor(player.hp)}/${getMaxHp()}　灵力 ${Math.floor(player.mp)}/${getMaxMp()}（当前状态）</p></section>${warRosterHtmlV2839(h.roster||[],h.enemyPower||0,h.ourPower)}<h3>战局过程</h3><ol class="war-log-v2839">${(h.tactics||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ol><p>当前可用军功 ${warStateV2839().meritV2839} · 主动出征休整 ${player.warState.warCooldown} 个游戏日。</p>`,()=>warButtonV2839('军功兑换',showWarMeritV2839,false,'primary')+warButtonV2839('返回军务',showWarHubV2839)+warButtonV2839('历次战报',showWarHistory));
}
function showWarMeritV2839(){
 if(!warAllowedV2839())return;const w=warStateV2839();
 openWarPanelV2839('军功补给处',()=>`<div class="war-stats-v2839"><div><small>可用军功</small><b>${w.meritV2839}</b></div><div><small>累计所得</small><b>${w.meritEarnedV2839}</b></div></div><p>完成会战获得军功；每次亲自交锋获胜另计10军功，随战役胜利统一发放。</p>${WAR_GOODS_V2839.map((g,i)=>`<article class="war-history-v2839"><h3>${g.name}</h3><p>${g.desc}</p>${warButtonV2839(`兑换 · ${g.cost}军功`,()=>exchangeWarMeritV2839(i),w.meritV2839<g.cost)}</article>`).join('')}<p class="war-muted-v2839">点兑换后仍需确认，取消不会扣除军功。</p>`,()=>warButtonV2839('返回军务',showWarHubV2839)+warButtonV2839('历次战报',showWarHistory));
}
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2839-war.js']='28.68.47';

// V28.68: one readable entry for the long war, existing story and campaign routes.
function showAncientWarV2859(){
 if(!warAllowedV2839())return;
 const chapters=yeChaptersV2816(),p=yeStateV2816(),next=p.choices.length;
 const leave=fn=>()=>{closeWarPanelV2839();fn();};
 openWarPanelV2839('三万年仙魔战',()=>{
  let html='<div class="war-hero-v2839"><span>三界战事卷宗</span><h3>战火三万年，归途仍未平</h3><p>仙族凭诸天大阵守界，魔族以禁法破阵，人族在两者之间守护山河。夜无疆的崛起打破旧日均势，却没能终结战争。</p></div>';
  html+='<section class="war-notice-v2839"><h3>你可以从哪里开始</h3><p>现在即可阅读下面的旧战纪年；练气起逐章经历夜无疆的宿敌故事。加入宗门后可筹备三阶段会战，实际出征会进入地图战场。主线“三万年烽火”需达到化神并推进前序主线。</p>';
  html+=warButtonV2839(next<8?(yeStoryAvailableV2816(next)?'继续剧情 · '+chapters[next].title:'宿敌纪事 · 查看解锁条件'):'宿敌纪事 · 八章回顾',leave(()=>next<8&&yeStoryAvailableV2816(next)?showYeChapterV2816(next):showYeChronicleV2816()),false,'primary');
  html+=warButtonV2839('夜无疆 · 人物与挑战',leave(showYeWujiV2810));
  html+=warButtonV2839(player.sect?'宗门会战 · 整备 / 继续':'先拜入宗门，再参与会战',leave(player.sect?showWarHubV2839:showSect));
  html+=warButtonV2839('查看主线进度',leave(()=>showTaskPanel('main')));html+='</section>';
  const eras=[
   ['一 · 界门初裂','仙魔边界的灵脉枯竭，旧约随之崩解。仙族布下诸天守界大阵，魔门转向裂隙夺取灵源。人族村镇不得不一次次迁离，最初以为数年便能结束的战争，成了后世修士出生时就已存在的烽火。'],
   ['二 · 万载拉锯','大阵保住仙门，也把边地变成长久的战场。每当一处灵脉失守，医修、商队与守军便沿残桥撤离。仙族的底蕴仍然更强，魔族却以分散袭扰牵制阵眼；人族诸宗结成守土盟约，竭力为凡人留下一条生路。'],
   ['三 · 魔典破阵','夜无疆从魔族败战中崛起，融汇五大魔门禁法，创出逆天魔典。诸天阵眼接连被破，强大仙门也无法独自将他压制，只能联手守界。但他每次强行越过关口，都在损伤自己的本源。'],
   ['四 · 重修与今世','旧战末期，夜无疆自斩本源、转生重修。如今他与你同世争道，前期领先一个大境界，最终止步半圣圆满，永远无法成圣。你能救下此地的人、改变一场战役的结局，却不能凭一次胜利抹去三万年的伤痕。']
  ];
  html+='<h3>旧战纪年 · 随时可读</h3>'+eras.map(([title,body])=>`<article class="war-notice-v2839"><h4>${title}</h4><p>${body}</p></article>`).join('');
  html+=renderWorldPowerLoreV2859();
  html+='<h3>宿敌篇章 · '+next+'/8 已完成</h3><div class="war-targets-v2839">';
  chapters.forEach((ch,i)=>{const done=i<next,available=yeStoryAvailableV2816(i),reason=done?'已完成，可回看':available?'已解锁':i>next?'先完成前章':player.level<ch.level?CULTIVATION_REALMS[ch.level].name+'解锁':ch.win?'圣人境实际击退夜无疆后解锁':'先完成前章';html+=`<article class="war-notice-v2839"><h4>${i+1}. ${ch.title}</h4><p>${ch.place} · ${reason}</p>${warButtonV2839(done?'回看':available?'进入剧情':'尚未解锁',leave(()=>showYeChapterV2816(i)),!available)}</article>`;});
  return html+'</div><p>阅读卷宗不消耗寿元、灵石或灵力，不发放重复奖励，也不会自动替你完成主线。实际战斗仍按原有规则结算。</p>';
 },()=>warButtonV2839('历次战报',leave(showWarHistory))+warButtonV2839('返回地图',()=>{closeWarPanelV2839();closeWorldOverlay();}));
}
function renderWorldPowerLoreV2859(){return '<section class="war-notice-v2839"><h3>三界当前基础战力</h3><p>仙族 5000 · 魔族 4000 · 人族 2000</p><p>这是现有设定的人族增强版本。单场战役按参战宗门、盟军与地利计算，不等于三族全军同时出动。</p></section>';}

// V28.68.46: realm-locked rewards, commander pressure and assigned disciples.
const WAR_SCALE_V286841=[1,1,1.2,1.5,1.8,2.2,2.6,3,3.6,4.2,5,5.8,6.6,7.4,8.2,9,10];
const WAR_POSTS_V286841=['前哨先锋','攻坚统领','护阵统领'];
function warRewardScaleV286841(c){return c?.rulesV286841===1?WAR_SCALE_V286841[warIntV2839(c.realm,0,16)]:1;}
function warOfficerV286841(c,stage=c?.step){return c?.rulesV286841===1?c.officersV286841?.[stage]||null:null;}
function warDiscipleBusyV286841(id){const c=player?.warState?.campaignV2775;return !!(c&&!c.settled&&c.originSect===player.sect&&c.officersV286841?.some(o=>o?.id===id));}
function normalizeWarOfficersV286841(c){
 const seen=new Set();c.officersV286841=[0,1,2].map(i=>{const o=c.officersV286841?.[i];if(!o||!Number.isSafeInteger(o.id)||o.id<1||seen.has(o.id)||!Number.isInteger(o.personality)||o.personality<0||o.personality>2)return null;seen.add(o.id);return {id:o.id,name:String(o.name||'随军弟子').slice(0,40),personality:o.personality,healer:!!o.healer};});
 c.commanderV286841=['fighting','win','held','failed'].includes(c.commanderV286841)?c.commanderV286841:null;
}
let warCommitBusyV286841=false;
function commitWarV286841(change,combat=false){
 if(warCommitBusyV286841||(!combat&&!warAllowedV2839()))return false;
 const owner=player,raw=combat&&battleCheckpointV286812?.owner===owner?JSON.parse(battleCheckpointV286812.raw).player:player;
 const before=JSON.stringify(raw),progress={...achievementProgress},completed=new Set(completedAchievements);
 warCommitBusyV286841=true;miniSaveDeferredV286840=true;
 try{change();miniSaveDeferredV286840=false;if(!saveGame())throw Error('war save failed');return true}
 catch(e){for(const k of Object.keys(owner))delete owner[k];Object.assign(owner,JSON.parse(before));player=owner;if(player.activePet?._petId)player.activePet=player.pets.find(p=>p._petId===player.activePet._petId)||null;achievementProgress=progress;completedAchievements=completed;showFloatingText('战报未保存，本次操作已恢复；请重试','#ff8a80');return false}
 finally{warCommitBusyV286841=false;miniSaveDeferredV286840=false}
}
function assignWarOfficerV286841(id,stage,discipleId){
 if(!warAllowedV2839())return false;const c=warCampaignV2839(id,stage);
 if(!warStageValidV2839(c)||c.rulesV286841!==1||c.pending||stage>=3)return false;
 const d=sectMembersReadV2868().find(d=>d.id===discipleId);
 if(discipleId!==null&&(!d||d.job||warDiscipleBusyV286841(d.id)))return false;
 const ok=commitWarV286841(()=>{c.officersV286841[stage]=d?{id:d.id,name:d.name,personality:discipleTraitsV2867(d).personality,healer:lifeTitlesV2868(d).includes('济危同门')}:null;});
 if(ok)showWarCampaignV2775();return ok;
}
function warOfficersHtmlV286841(c){
 if(c.rulesV286841!==1||c.step>=3)return '';const stage=c.step,o=warOfficerV286841(c),esc=discipleEscV2815;
 let html=`<section class="war-notice-v2839"><h3>随军点兵 · ${WAR_POSTS_V286841[c.step]}</h3><p>果敢配突击：优势+1；谨慎配稳守：整场战力修正最低100%；仁厚：战败损失减半，有「济危同门」则减少75%。完成阶段后锁定，战役结束解任。</p><p>当前：${o?esc(o.name)+' · '+['谨慎','果敢','仁厚'][o.personality]:'未委任，可直接推进'}</p>`;
 if(!c.pending){if(o)html+=warButtonV2839('撤换本阶段统领',()=>assignWarOfficerV286841(c.id,stage,null));
 const available=sectMembersReadV2868().filter(d=>!d.job&&!warDiscipleBusyV286841(d.id));html+='<details><summary>选择空闲弟子 · '+available.length+'位</summary><div class="war-targets-v2839">'+available.map(d=>warButtonV2839(d.name+' · '+['谨慎','果敢','仁厚'][discipleTraitsV2867(d).personality],()=>assignWarOfficerV286841(c.id,stage,d.id))).join('')+'</div></details>';}
 return html+'</section>';
}
function warOfficerEffectV286841(c,stage,won){
 const o=warOfficerV286841(c,stage);if(!o)return;
 if(o.personality===1&&c.selected[stage]===2){c.score++;warLogV2839(c,`${o.name}果敢领突击，额外优势+1。`);}
 if(o.personality===0&&c.selected[stage]===0){c.cautiousV286841=true;warLogV2839(c,`${o.name}稳住阵脚，整场基础战力修正保底100%。`);}
 const d=sectMembersReadV2868().find(d=>d.id===o.id);if(d){lifeAddV2868(d,'war_stage');if(won)lifeAddV2868(d,'war_victory');}
}
function warMercyV286841(c){
 if(c.rulesV286841!==1)return 0;
 const officers=(c.officersV286841||[]).filter((o,i)=>o?.personality===2&&c.records.some(r=>r.stage===i));
 return officers.some(o=>o.healer)?.75:officers.length?.5:0;
}
function warFactorV286841(c){
 let factor=c.legacy?.88+c.score*.06:(.82+c.score*.045)*(1+(c.morale-60)*.003);
 if(c.rulesV286841===1){if(c.cautiousV286841)factor=Math.max(1,factor);factor*=1+(c.commanderV286841==='win'?.30:c.commanderV286841==='held'?.15:0);}return factor;
}
function warDuelLimitV286841(){
 const tag=currentEnemy?._warV2839,c=tag&&warCampaignV2839(tag.campaignId,tag.stage);
 if(!c||c.rulesV286841!==1||tag.stage!==2||!tag.awaitingAction)return false;
 tag.awaitingAction=false;tag.turns=warIntV2839(tag.turns,0,8)+1;
 if(tag.turns>=8){finishWarDuelV2839(false,'timeout');return true;}
 addCombatLog(`阵前斩将：剩余 ${8-tag.turns} 次行动。`,'boss');return false;
}
