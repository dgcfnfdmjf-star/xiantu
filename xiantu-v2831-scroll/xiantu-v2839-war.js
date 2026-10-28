// V28.47 · 正魔大战：一场战役、三处目标、可续行的亲自交锋。
const WAR_FRONTS_V2839=[
 {name:'夺回前哨',objective:'打通联军进军的通道',enemy:'魔军斥候统领',reward:'成功：战备 +1',intro:'被毁的传讯碑只剩半截。斥候带回消息：前哨还守着通往山门的最后一条路。'},
 {name:'护住灵脉',objective:'保护补给阵与撤离伤员',enemy:'破阵魔将',reward:'成功：额外士气 +6',intro:'灵脉阵旗正在熄灭。医修将伤员移向后方，联军必须守住补给才能继续前进。'},
 {name:'破阵决战',objective:'摧毁敌军核心阵旗',enemy:'镇阵魔帅',reward:'成功：额外优势 +1',intro:'核心阵旗已现，敌军仍在死守。此战能赢下一段归路，却不是三万年仙魔大战的终点。'}
];
const WAR_GOODS_V2839=[
 {name:'行军丹药',cost:20,desc:'大还丹 ×3、聚灵丹 ×3',items:['大还丹','大还丹','大还丹','聚灵丹','聚灵丹','聚灵丹']},
 {name:'草药补给',cost:35,desc:'灵草 ×10、仙果 ×5',materials:{'灵草':10,'仙果':5}},
 {name:'锻造珍材',cost:80,desc:'星辰砂 ×5、血玉 ×3',materials:{'星辰砂':5,'血玉':3}},
 {name:'玄寒仙材匣',cost:120,desc:'万年寒玉×3、仙灵草×4、冰晶石×5',materials:{'万年寒玉':3,'仙灵草':4,'冰晶石':5}},
 {name:'幽冥秘材匣',cost:150,desc:'龙血果×3、幽冥花×3、魔核×4',materials:{'龙血果':3,'幽冥花':3,'魔核':4}},
 {name:'御兽灵髓匣',cost:180,desc:'变异灵晶×2、纯净灵髓×1、优质血脉精元×1',petMaterials:{'变异灵晶':2,'纯净灵髓':1,'优质血脉精元':1}},
 {name:'太古返祖宝匣',cost:320,desc:'上古返祖灵珠×1、深渊魔核×1、极品血脉精元×1',petMaterials:{'上古返祖灵珠':1,'深渊魔核':1,'极品血脉精元':1}}
];
function warIntV2839(n,min=0,max=1e9){n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
function warSectEligibleV2891(p=player){return !!p?.sect&&p.sect!=='散修'&&!isFactionDestroyed(p.sect);}
function warTargetEligibleV2891(enemy){return warSectEligibleV2891()&&!!DEMON_FACTION_POWER[enemy]&&enemy!==player.sect&&!isFactionDestroyed(enemy);}
function warProsperityV2891(){const n=Number(player.sectData?.prosperity);return Number.isFinite(n)?n:20;}
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
 // A pending duel is a paid resume ticket, including outside combat after reload.
 // Normalize from the saved campaign itself, never from another character's runtime state.
 if(c.pending){
  const q=c.pending;
  if(typeof q!=='object'||typeof q.id!=='string'||!q.id.trim()||q.id.length>100||c.step>=3||q.stage!==c.step||![0,1,2].includes(q.tactic)){
   c.pending=null;warLogV2839(c,'交锋记录不完整，已解除异常锁定；已付战备不返还，可继续统领联军。');
  }else c.selected[c.step]=q.tactic;
 }
 if(!c.pending&&c.commanderV286841==='fighting'){
  c.commanderV286841='failed';warLogV2839(c,'主将交锋记录已中断，本场斩将机会不重置，可继续统领联军。');
 }
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
 const rows=names.map(n=>({name:n,power:calculateSectPower(n).total,role:n===player.sect?'本宗主力':'盟军',detail:n===player.sect?`含主角、弟子与地利；道统与先锋加成 +${calculateSectPower(n).masterBonusV2880||0}`:'该宗实际投入'}));
 const aid=getImmortalWarSupportV2807();if(aid>0)rows.push({name:w.immortalAlly,power:aid,role:'仙门支援',detail:'宗门基础战力的35%'});return rows;
}
function warLogV2839(c,text){c.log.push(text);c.log=c.log.slice(-30);}
function warStageValidV2839(c){return warSectEligibleV2891()&&!!c&&c.originSect===player.sect&&c.enemy!==c.originSect&&!isFactionDestroyed(c.enemy)&&!isFactionDestroyed(c.originSect);}
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
 if(!warTargetEligibleV2891(enemy))return showWarHubV2839();
 showWarPreparationV2839(enemy);
};
executeWar=function(enemy){
 if(!warAllowedV2839()||!warSectEligibleV2891())return;
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
 if(base){player.sectData.prosperity=warProsperityV2891()+Math.floor(kills/2);addFactionReputation(c.originSect,Math.max(5,Math.floor(kills/2)),'宗门战争胜利');for(const ally of w.alliedSects)addFactionReputation(ally,5,'并肩参战');}
 else{player.sectData.prosperity=Math.max(Math.min(10,warProsperityV2891()),warProsperityV2891()-10);addFactionReputation(c.originSect,-5,'宗门战争战败');}
 addFactionReputation(c.enemy,base?-Math.min(25,10+Math.floor(kills/5)):-5,'正魔交战');
 if(mercy)player.sectData.prosperity=warProsperityV2891()+(mercy>=.75?6:3);
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
 for(const [name,n] of Object.entries(goods.petMaterials||{})){player.petMaterials ||= {};player.petMaterials[name]=(player.petMaterials[name]||0)+n;}
 }))return;updateStats();showWarMeritV2839();
}
// Incoming assaults are dispatches awaiting the player's decision. Resting never silently bills a battle loss.
checkDemonInvasion=function(){
 if(!warSectEligibleV2891()||!player.warState)return;const w=warStateV2839();
 if(w.campaignV2775||w.incomingV2839||w.status===WAR_STATUS.BATTLE||getGameDate().day!==1)return;
 const day=player.worldTime.totalDays;if(w.lastInvasionCheckV2775===day)return;w.lastInvasionCheckV2775=day;
 const chance=Math.max(.003,[.01,.03,.07,.15][getWarLevel()]-warProsperityV2891()/1800);if(Math.random()>=chance)return;
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
  if(w.incomingV2839&&warSectEligibleV2891()){const enemy=w.incomingV2839.enemy;html+=`<section class="war-notice-v2839"><h3>山门急报 · ${esc(enemy)}</h3><p>守军正在集结，等待你调度。迎敌不受主动出征冷却限制。</p>${warButtonV2839('查看来敌 · 整备迎战',()=>declareWar(enemy),false,'primary')}</section>`;}
  if(!warSectEligibleV2891())html+='<p>须加入尚存宗门才能领军。已有战史和军功仍可查看、使用。</p>';
  html+='<h3>选择战场</h3><p class="war-muted-v2839">先查看双方投入、补给与预期，再确认出征。筹备页面不会自动开战。</p><div class="war-targets-v2839">';
  for(const enemy of Object.keys(DEMON_FACTION_POWER).filter(n=>n!==player.sect&&!isFactionDestroyed(n))){const n=calculateSectPower(enemy).total;html+=warButtonV2839(`${enemy} · ${n} 战力`,()=>declareWar(enemy),!warSectEligibleV2891()||!!w.incomingV2839||w.warCooldown>0);}
  html+='</div>';if(w.warCooldown>0)html+='<p>休整按游戏时间推进，可进行修炼、宗门事务或休息，无需等现实倒计时。</p>';
  if(w.lastNotice)html+=`<p class="war-muted-v2839">${esc(w.lastNotice.text||'')}</p>`;return html;
 },()=>warButtonV2839('军功兑换',showWarMeritV2839)+warButtonV2839('历次战报',showWarHistory)+warButtonV2839('返回宗门',()=>{closeWarPanelV2839();showSectHall();}));
}
function showWarPreparationV2839(enemy){
 if(!warAllowedV2839()||!warTargetEligibleV2891(enemy))return;
 const w=warStateV2839(),rows=warRosterV2839(),our=rows.reduce((s,r)=>s+r.power,0),defense=w.incomingV2839?.enemy===enemy,foe=calculateSectPower(enemy).total*(defense?1+getWarLevel()*.12:1),ratio=our/Math.max(1,foe),esc=discipleEscV2815;
 openWarPanelV2839((defense?'山门迎敌':'战前筹备')+' · '+enemy,()=>`<div class="war-hero-v2839"><span>${defense?'守住来路':'战前军议'}</span><h3>${esc(getWarOutlook(ratio).name)}</h3><p>${esc(getWarOutlook(ratio).desc)}</p></div>${warRosterHtmlV2839(rows,foe)}<section class="war-notice-v2839"><h3>这场怎么打</h3><p>确认后进入地图战场，可见弟子护阵、修士斗法与军令台，战场表现按境界分层。点击地图下方“参战”下达军令：前哨、灵脉、核心阵三处目标，先选克制战术，再亲自交锋或指挥联军。初始士气60、战备3，可暂离保存。</p><p>亲自交锋获胜增加军功；负伤只降士气，可整备重试。整场战败沿用战争损失：身上灵石8%，最多500，不再叠加普通战斗的20%。撤军不发奖励。</p><p>战役结束统一发放灵石、修为、宗门贡献与军功。主动出征休整30个游戏日；迎敌与撤军至少休整7日，已有更长休整保留。</p></section><p>本次出征灵石/修为倍率 ×${WAR_SCALE_V286841[warIntV2839(player.level,0,16)]}，出征时锁定；贡献和军功沿用原值。第三阶段可进行8次行动限时斩将，取胜战力+30%，重创+15%。可在各阶段委任一名空闲弟子。</p><h3>战前状态</h3><p>气血 ${Math.floor(player.hp)}/${getMaxHp()}　灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p><div class="war-actions-v2839">${warButtonV2839('邀请人族盟军 · 每宗30贡献',()=>showWarAlliesV2839(enemy))}${warButtonV2839('请求仙门支援 · 需150贡献',()=>requestWarImmortalV2839(enemy),w.immortalSupport||getWarLevel()<2||player.sectContribution<150)}</div><p class="war-muted-v2839">仙援需达到局部会战且声望符合条件。成功扣150贡献；未获回应扣75，请求前会确认。</p>`,()=>warButtonV2839(defense?'确认迎敌':'确认出征',()=>executeWar(enemy),!player.sect||(!defense&&(ratio<=.5||w.warCooldown>0))||!!w.incomingV2839&&!defense,'primary')+warButtonV2839('返回军务',showWarHubV2839));
}
function showWarAlliesV2839(enemy){
 if(!warAllowedV2839()||!warTargetEligibleV2891(enemy)||warCampaignV2839())return;const w=warStateV2839(),esc=discipleEscV2815;
 openWarPanelV2839('联军招募',()=>`<p>每宗30贡献，确认后结盟。本次战役结束或撤军后解散。</p><p>可用贡献：${player.sectContribution}</p>${allyBatchButtonV2892(enemy)}<div class="war-targets-v2839">${Object.keys(HUMAN_FACTION_POWER).filter(n=>n!==player.sect&&!isFactionDestroyed(n)).map(n=>warButtonV2839(`${n} · ${calculateSectPower(n).total} 战力${w.alliedSects.includes(n)?' · 已结盟':''}`,()=>{
  const owner=player,originSect=player.sect;if(!confirm(`支付30贡献，邀请${n}加入本次联军？`))return;
  if(player!==owner||player.sect!==originSect||player.warState!==w||!warTargetEligibleV2891(enemy)||n===player.sect||!warAllowedV2839()||warCampaignV2839()||w.alliedSects.includes(n)||player.sectContribution<30||isFactionDestroyed(n))return;
  if(!commitWarV286841(()=>{player.sectContribution-=30;w.alliedSects.push(n);})){showWarAlliesV2839(enemy);return;}updateStats();showWarAlliesV2839(enemy);
 },w.alliedSects.includes(n)||player.sectContribution<30)).join('')}</div>`,()=>warButtonV2839('返回战前筹备',()=>declareWar(enemy)));
}
// Same eligibility and 30-contribution price as individual invitations; no new ally cap.
function allyPlanV2892(){
 if(!warSectEligibleV2891())return {picks:[],cost:0};
 const allied=player.warState?.alliedSects||[],balance=Number(player.sectContribution),budget=Number.isFinite(balance)?Math.max(0,balance):0;
 const pool=Object.keys(HUMAN_FACTION_POWER).filter(n=>n!==player.sect&&!isFactionDestroyed(n)&&!allied.includes(n))
  .map(name=>({name,power:calculateSectPower(name).total})).sort((a,b)=>b.power-a.power||a.name.localeCompare(b.name));
 const picks=pool.slice(0,Math.floor(budget/30));return {picks,cost:picks.length*30};
}
function allyBatchButtonV2892(enemy){
 const plan=allyPlanV2892(),owner=player,sect=player.sect,w=player.warState;
 return '<p class="war-muted-v2839">批量邀请按当前战力优先，在贡献预算内选择；确认前显示全部名单。</p>'+warButtonV2839(plan.picks.length?`一键邀请 · ${plan.picks.length}宗 · ${plan.cost}贡献`:'暂无可批量邀请的宗门',()=>{
  if(player!==owner||player.sect!==sect||player.warState!==w)return;
  allyAllV2892(enemy,plan);
 },!plan.picks.length,'primary');
}
function allyAllV2892(enemy,expected){
 if(!warAllowedV2839()||!warTargetEligibleV2891(enemy)||warCampaignV2839())return false;
 const owner=player,sect=player.sect,w=player.warState,plan=allyPlanV2892(),signature=JSON.stringify(plan);
 if(!plan.picks.length||expected&&signature!==JSON.stringify(expected))return false;
 if(!confirm(`邀请 ${plan.picks.map(p=>p.name).join('、')}，共 ${plan.picks.length} 宗？每宗30贡献，总计 ${plan.cost}，剩余 ${player.sectContribution-plan.cost} 贡献。`))return false;
 if(player!==owner||player.sect!==sect||player.warState!==w||!warAllowedV2839()||!warTargetEligibleV2891(enemy)||warCampaignV2839()||JSON.stringify(allyPlanV2892())!==signature)return false;
 const ok=commitWarV286841(()=>{player.sectContribution-=plan.cost;w.alliedSects.push(...plan.picks.map(p=>p.name));});
 if(ok)updateStats();showWarAlliesV2839(enemy);return ok;
}
function requestWarImmortalV2839(enemy){
 if(!warAllowedV2839()||!warTargetEligibleV2891(enemy)||warCampaignV2839())return;
 const w=warStateV2839();if(w.immortalSupport||getWarLevel()<2||player.sectContribution<150)return;
 const eligible=IMMORTAL_SECTS_FULL.filter(f=>f.name!=='太岁书院'&&canRequestAid(f.name)&&!isFactionDestroyed(f.name));
 openWarPanelV2839('向仙门求援',()=>`<p>可用贡献 ${player.sectContribution}。选定仙门后仍需确认：成功消耗150贡献，未获回应消耗75贡献。</p>${eligible.length?eligible.map(f=>{
  const rate=Math.min(.85,.3+warProsperityV2891()/500+(player.factionReputation?.[f.name]||0)/250);
  return '<article class="war-history-v2839"><h3>'+discipleEscV2815(f.name)+'</h3><p>支援战力 '+Math.round(getFactionWorldBasePower(f.name)*.35)+' · 应援概率 '+Math.round(rate*100)+'%</p>'+warButtonV2839('请求'+f.name+'支援',()=>{
   const owner=player,originSect=player.sect;if(!confirm('向'+f.name+'求援？成功扣150贡献，未获回应扣75贡献。'))return;
   if(player!==owner||player.sect!==originSect||player.warState!==w||!warTargetEligibleV2891(enemy)||getWarLevel()<2||!warAllowedV2839()||warCampaignV2839()||w.immortalSupport||player.sectContribution<150||isFactionDestroyed(f.name)||!canRequestAid(f.name))return;
   const currentRate=Math.min(.85,.3+warProsperityV2891()/500+(player.factionReputation?.[f.name]||0)/250),ok=Math.random()<currentRate;
   if(!commitWarV286841(()=>{player.sectContribution-=ok?150:75;
   if(ok){w.immortalSupport=true;w.immortalAlly=f.name;addFactionReputation(f.name,5,'宗门战争求援');}
   w.lastNotice={text:ok?f.name+'同意支援，已消耗150贡献。':f.name+'未回应，已消耗75贡献。',date:getGameDateLabel(),result:'求援'};})){requestWarImmortalV2839(enemy);return;}updateStats();
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
   html+=`<section class="war-scene-v2839"><small>${front.objective}</small><h3>${front.name}</h3><p>${front.intro}</p><p class="war-report-v2839">敌情：${WAR_REPORTS_V2775[c.reports[stage]]}</p><p>${front.reward}</p></section><h3>① 选择本阶段战术</h3>${warButtonV2839('军师布阵 · 按敌情选择战术与统领',()=>autoDeployWarV2886(c.id,stage),!!c.pending)}<p>按已显示敌情选择克制战术；优先契合性格的空闲弟子，可手动调整。只完成部署，不自动开战，不保证胜利。</p>${warButtonV2839('☯ 天机战术参议',jevWarV2846,!!c.pending)}<div class="war-tactics-v2839">${WAR_TACTICS_V2775.map((t,i)=>warButtonV2839(`${tactic===i?'✓ ':''}${t.name} · ${t.hint}`,()=>chooseWarTacticV2775(i,stage),!!c.pending,tactic===i?'selected':'')).join('')}</div><h3>② 推进目标</h3><div class="war-mission-v2839"><b>${esc(enemy.name)}</b><p>${esc(CULTIVATION_REALMS[c.realm].name)}${['初期','中期','后期','圆满'][enemy._realmPhase]} · 气血 ${enemy.maxHp} · 攻击 ${enemy.atk} · 防御 ${enemy.def}</p><p>你的气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p>${c.pending?'<p>上次交锋尚未结算。可以重新进入，敌方恢复到开战状态；沿用当前气血灵力，不再扣战备。</p>':''}<div class="war-actions-v2839">${warButtonV2839(c.pending?'继续未结算交锋':c.rulesV286841===1&&stage===2?'主将阵前单挑 · 8次行动 / 战备−1':'亲自交锋 · 战备 −1',()=>startWarDuelV2839(c.id,stage),tactic==null||player.hp<=1||(!c.pending&&(c.supplies<1||(c.rulesV286841===1&&stage===2&&!!c.commanderV286841))),'primary')}${warButtonV2839(tactic==null?'统领联军 · 先选择战术':`统领联军 · 预估成功 ${Math.round(warChanceV2839(c)*100)}%`,()=>commandWarStageV2839(c.id,stage),tactic==null||!!c.pending)}</div>${c.rulesV286841===1&&stage===2?'<p>限时斩将胜利：最终战力+30%；到时敌将气血≤30%：+15%。本场仅一次；失败后仍可统领联军。此加成影响实际战果，不保证必胜。</p>':''}<p class="war-muted-v2839">亲自交锋沿用已装配招式与自动战斗策略，需真正获胜。联军推进受战力、克制战术与士气影响，受挫也会进入下一阶段。</p></div>`;
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
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2839-war.js']='28.68.74';

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
  html+=warButtonV2839('归墟断桥 · 三形态首领',showAbyssBossHubV2882);
  html+=warButtonV2839(warSectEligibleV2891()?'宗门会战 · 整备 / 继续':'先拜入宗门，再参与会战',leave(warSectEligibleV2891()?showWarHubV2839:showSect));
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
function warAutoPlanV2886(c){
 if(!warStageValidV2839(c)||c.pending||c.step>=3||![0,1,2].includes(c.reports?.[c.step]))return null;
 const tactic=c.reports[c.step],current=warOfficerV286841(c),wanted=[0,2,1][tactic];
 const candidates=c.rulesV286841===1?sectMembersReadV2868().filter(d=>!d.job&&(!warDiscipleBusyV286841(d.id)||current?.id===d.id)).map(d=>({id:d.id,name:d.name,personality:discipleTraitsV2867(d).personality,healer:lifeTitlesV2868(d).includes('济危同门')})):[];
 const score=o=>(o.personality===wanted?100:o.personality===2?50:0)+(o.personality===2&&o.healer?20:0)+(o.id===current?.id?1:0);
 candidates.sort((a,b)=>score(b)-score(a)||a.id-b.id);
 return {tactic,officer:candidates[0]||null};
}
function autoDeployWarV2886(id,stage){
 if(!warAllowedV2839())return false;const c=warCampaignV2839(id,stage),plan=warAutoPlanV2886(c);if(!plan)return false;
 if(c.selected[stage]===plan.tactic&&JSON.stringify(warOfficerV286841(c))===JSON.stringify(plan.officer))return false;
 const ok=commitWarV286841(()=>{c.selected[stage]=plan.tactic;if(c.rulesV286841===1)c.officersV286841[stage]=plan.officer;});
 if(ok){showFloatingText(`按敌情布阵：${WAR_TACTICS_V2775[plan.tactic].name}${plan.officer?' · 统领'+plan.officer.name:' · 暂不委任统领'}`,'#69f0ae');showWarCampaignV2775();}return ok;
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

// Optional three-form challenge. Runtime ownership never enters the save.
const ABYSS_PLANS_V2882={
 chain:['斩断渡魂锁链','开局骨盾由15%降为7.5%首领气血；前两次首领实际行动内共享15%自身最大气血护盾。'],
 mind:['照心定魂守脉','免疫二阶段抽灵；每次首领实际行动恢复8%最大灵力。'],
 breach:['业火焚毁无名册','基础防御降低18%；三阶段主角暴击额外伤害由25%提高至55%。']
};
const ABYSS_PRIZES_V2882=['上古返祖灵珠','深渊魔核','极品血脉精元'];
const abyssBattlesV2882=new WeakMap();
let abyssViewV2882=null;
function normalizeAbyssV2882(raw){
 const r=raw&&typeof raw==='object'?raw:{},realm=n=>Number.isInteger(n)&&n>=5&&n<CULTIVATION_REALMS.length;
 const cleared=[...new Set((Array.isArray(r.cleared)?r.cleared:[]).filter(realm))];
 const p=r.pending,pending=p&&realm(p.realm)?{realm:p.realm,first:p.first===true,rare:ABYSS_PRIZES_V2882.includes(p.rare)?p.rare:null}:null;
 if(pending&&!cleared.includes(pending.realm))cleared.push(pending.realm);
 return {version:1,plan:Object.hasOwn(ABYSS_PLANS_V2882,r.plan)?r.plan:'chain',wins:Number.isSafeInteger(r.wins)?Math.max(0,Math.min(1e9,r.wins)):0,cleared,pending};
}
function abyssBattleV2882(enemy){
 const b=enemy&&abyssBattlesV2882.get(enemy);
 return b&&b.owner===player&&currentEnemy===enemy&&(COMBAT_FINISH_V2764.token===b.token||COMBAT_FINISH_V2764.pending?.token===b.token+1)?b:null;
}
function createAbyssBossV2882(plan='chain'){
 if(!Object.hasOwn(ABYSS_PLANS_V2882,plan))plan='chain';
 const level=Math.min(CULTIVATION_REALMS.length-1,Math.max(5,Math.floor(Number(player.level)||5))+1);
 const e={name:'归墟造桥主·战神之魂',hp:900+level*380,maxHp:900+level*380,atk:85+level*28,def:45+level*16,gold:0,exp:0,_realmLevel:level,_realmPhase:3,_isElite:true,_isTaskBattle:true,_abyssBossV2882:true};
 balanceEnemyV2802(e,true,false);
 e.hp=e.maxHp=Math.round(e.maxHp*1.35);e.atk=Math.round(e.atk*1.18);e.def=Math.round(e.def*1.18);
 if(plan==='breach')e.def=Math.floor(e.def*.82);
 return e;
}
function syncAbyssPhaseV2882(enemy){
 const b=abyssBattleV2882(enemy);if(!b||gameState!=='combat'||enemy.hp<=0)return;
 const ratio=enemy.hp/Math.max(1,enemy.maxHp);
 if(b.stage===1&&ratio<=.65){b.stage=2;enemy.atk=Math.round(enemy.atk*1.2);enemy.def=Math.round(enemy.def*1.15);addCombatLog('🌑 窃忆魔相：攻击+20%、防御+15%；每次实际行动抽灵化盾。','boss');}
 if(b.stage===2&&ratio<=.30){b.stage=3;enemy.atk=Math.round(enemy.atk*1.22);enemy.def=Math.round(enemy.def*.85);addCombatLog('🔥 归墟同葬：攻击再增22%、防御降低15%；主角暴击加深，行动引动罡风。','boss');}
 if(b.stage!==currentBossPhase){currentBossPhase=b.stage;const el=document.getElementById('bossPhase');if(el)el.textContent=`第 ${b.stage} 阶段`;}
}
function abyssOutgoingV2882(enemy,damage,crit){
 const b=abyssBattleV2882(enemy);if(!b)return damage;
 damage=Math.max(0,Math.floor(Number(damage)||0));
 if(b.stage===3&&crit)damage+=Math.floor(damage*(b.plan==='breach'?.55:.25));
 const absorb=Math.min(b.shield,Math.floor(damage*.6));
 if(absorb>0){b.shield-=absorb;addCombatLog(`千魂骨盾吸收 ${absorb} 点伤害，剩余 ${b.shield}。`,'boss');}
 return damage-absorb;
}
// Called inside the owner-checked attack callback, after pressure/freeze skips.
// The heavy strike replaces the normal hit and uses the ordinary mitigation path.
function abyssActionV2882(enemy){
 const b=abyssBattleV2882(enemy);if(!b||gameState!=='combat'||isPlayerTurn||enemy.hp<=0||player.hp<=0)return null;
 syncAbyssPhaseV2882(enemy);b.turn++;
 if(b.turn>2)b.guard=0;
 if(b.plan==='mind'){
  const gain=Math.max(0,Math.min(getMaxMp()-player.mp,Math.ceil(getMaxMp()*.08)));player.mp+=gain;
  if(gain)addCombatLog(`照心定魂恢复 ${gain} 点灵力。`,'heal');
 }
 if(b.stage===2&&b.plan!=='mind'&&player.mp>0){
  const drain=Math.min(player.mp,Math.max(8,Math.floor(player.mp*.15)));player.mp-=drain;b.shield+=drain*3;
  addCombatLog(`剥忆噬灵：抽取 ${drain} 点灵力，转为 ${drain*3} 点骨盾。`,'boss');
 }
 if(b.stage===3){
  const damage=Math.min(Math.max(0,player.hp-1),Math.max(12,Math.floor(getMaxHp()*.07)));
  if(damage){player.hp-=damage;showDamageNumber(damage,'player',false,false,true,false,'归墟罡风');addCombatLog(`归墟罡风造成 ${damage} 点伤害（自身最低保留1点，随后首领攻击仍可致命）。`,'damage');}
 }
 return b.stage===1&&b.turn%3===0?{name:'战戟裂界',damage:1.35,mpCost:0}:null;
}
function abyssIncomingV2882(enemy,damage){
 const b=abyssBattleV2882(enemy);if(!b||b.turn>2||b.guard<=0)return damage;
 const absorb=Math.min(b.guard,damage);b.guard-=absorb;
 if(absorb)addCombatLog(`断链护盾抵挡 ${absorb} 点伤害。`,'heal');
 return damage-absorb;
}
function abyssRewardV2882(p){
 const foe=Math.min(CULTIVATION_REALMS.length-1,p.realm+1);
 return {gold:1500+foe*450+(p.first?2000+p.realm*600:0),exp:600+foe*220+(p.first?800+p.realm*300:0),prizes:p.first?ABYSS_PRIZES_V2882:p.rare?[p.rare]:[]};
}
function abyssRewardTextV2882(p){
 const r=abyssRewardV2882(p);
 return `灵石 ${r.gold}、修为 ${r.exp}、军功45、星辰砂×3、万年寒玉×2${r.prizes.length?'、'+r.prizes.map(n=>n+'×1').join('、'):''}`;
}
function abyssViewValidV2882(view=abyssViewV2882){return warAllowedV2839()&&view&&view===abyssViewV2882&&view.owner===player&&view.ui===warUiV2839&&!!document.getElementById('warPanelV2839');}
function selectAbyssPlanV2882(plan){
 if(!abyssViewValidV2882()||!Object.hasOwn(ABYSS_PLANS_V2882,plan))return false;
 // Selection is saved at launch; viewing and comparing plans cannot award resources.
 abyssViewV2882.plan=plan;showAbyssBossHubV2882(plan);return true;
}
function launchAbyssBossV2882(){
 if(!abyssViewValidV2882()||player.level<5||player.hp<=1)return false;
 const view=abyssViewV2882,owner=player,state=normalizeAbyssV2882(player.abyssBossV2882);if(state.pending)return false;
 const stamp=JSON.stringify([player.level,player.phase,player.hp,player.mp,player.abyssBossV2882]),e=createAbyssBossV2882(view.plan);
 if(!confirm(`迎战${getEnemyRealmNameV2811(e)}的战神之魂？三阶段连续交锋，不能脱战；战败不扣灵石。胜利后回断桥领取悬赏。`)||owner!==player||!abyssViewValidV2882(view)||stamp!==JSON.stringify([player.level,player.phase,player.hp,player.mp,player.abyssBossV2882]))return false;
 const realm=player.level;
 closeWarPanelV2839();closeWorldOverlay();startCombat(e,true,false,null);
 if(currentEnemy!==e||gameState!=='combat')return false;
 player.abyssBossV2882={...state,plan:view.plan};
 abyssBattlesV2882.set(e,{owner,token:COMBAT_FINISH_V2764.token,realm,plan:view.plan,stage:1,turn:0,shield:Math.floor(e.maxHp*(view.plan==='chain'?.075:.15)),guard:view.plan==='chain'?Math.floor(getMaxHp()*.15):0,settled:false});
 addCombatLog(`归墟断桥 · ${ABYSS_PLANS_V2882[view.plan][0]}：${ABYSS_PLANS_V2882[view.plan][1]}`,'boss');
 updateCombatUI();return true;
}
function recordAbyssFinishV2882(){
 const e=currentEnemy,b=abyssBattleV2882(e),p=COMBAT_FINISH_V2764.pending;
 if(!b||b.settled||p?.owner!==player||p.token!==b.token+1)return;
 b.settled=true;
 if(p.kind!=='victory'||e.hp>0)return;
 const state=normalizeAbyssV2882(player.abyssBossV2882);if(state.pending)return;
 const first=!state.cleared.includes(b.realm);
 state.pending={realm:b.realm,first,rare:!first&&Math.random()<.35?ABYSS_PRIZES_V2882[Math.floor(Math.random()*3)]:null};
 state.wins=Math.min(1e9,state.wins+1);if(first)state.cleared.push(b.realm);player.abyssBossV2882=state;
 addCombatLog(`归墟悬赏已记录，返回「三万年仙魔战 → 归墟断桥」领取：${abyssRewardTextV2882(state.pending)}。`,'gold');
 // Core finishing saves pending loot with the outcome; no extra save mid-settlement.
}
window.addEventListener('xiantu:combat-finishing',recordAbyssFinishV2882);
function claimAbyssRewardV2882(){
 if(!abyssViewValidV2882())return false;
 const state=normalizeAbyssV2882(player.abyssBossV2882),pending=state.pending;if(!pending)return false;
 const owner=player,before=JSON.stringify(player),r=abyssRewardV2882(pending);
 try{
  state.pending=null;player.abyssBossV2882=state;player.gold+=r.gold;player.exp+=r.exp;
  player.materials=player.materials||{};player.petMaterials=player.petMaterials||{};
  for(const [n,q] of [['星辰砂',3],['万年寒玉',2]])player.materials[n]=(player.materials[n]||0)+q;
  for(const n of r.prizes)player.petMaterials[n]=(player.petMaterials[n]||0)+1;
  const w=warStateV2839();w.meritV2839+=45;w.meritEarnedV2839+=45;
  if(!saveGame())throw Error('save failed');
 }catch(_){
  for(const k of Object.keys(owner))delete owner[k];Object.assign(owner,JSON.parse(before));
  if(owner.activePet?._petId)owner.activePet=owner.pets.find(p=>p._petId===owner.activePet._petId)||null;
  showFloatingText('记录未保存，悬赏仍待领取，请重试。','#ff8a80');return false;
 }
 checkLevelUp();updateStats();showAbyssBossHubV2882();return true;
}
function showAbyssBossHubV2882(selected){
 if(!warAllowedV2839())return;
 const state=normalizeAbyssV2882(player.abyssBossV2882),plan=Object.hasOwn(ABYSS_PLANS_V2882,selected)?selected:state.plan,e=createAbyssBossV2882(plan);
 openWarPanelV2839('归墟断桥 · 战神之魂',()=>{
  let html=`<section class="war-notice-v2839"><h3>古战神残魂，欲以万名修士的记忆补合断桥</h3><p>化神境开启；首领高于入场境界一阶（最高圣人），圆满阶段。三形态连续交锋，不能脱战；败战不扣灵石。</p><p>${discipleEscV2815(getEnemyRealmNameV2811(e))} · 气血 ${e.maxHp} · 攻击 ${e.atk} · 防御 ${e.def}</p><p>累计击破 ${state.wins} 次 · 气血 ${Math.floor(player.hp)}/${getMaxHp()} · 灵力 ${Math.floor(player.mp)}/${getMaxMp()}</p></section>`;
  html+='<details class="war-details-v2839"><summary>三形态机制 · 开战前查看</summary><p>一重：骨盾吸收每击60%伤害，池耗尽失效；每第3次实际行动以1.35倍招式替代普攻。</p><p>二重（气血≤65%）：攻击+20%、防御+15%；每次实际行动抽取当前灵力15%（至少8、不超过现有），按实际抽取量×3化盾。</p><p>三重（气血≤30%）：攻击再增22%、防御降低15%；主角暴击伤害额外+25%。每次实际行动先造成7%最大气血罡风伤害（至少12、最低留1血），随后正常攻击可致命。</p><p>冻结或威压跳过行动时，不触发抽灵、回灵和罡风。跨过两个阈值会依次转换，不回退形态；治疗仍可正常使用。</p></details>';
  html+='<h3>破阵部署 · 三选一</h3>';
  for(const [key,[name,desc]] of Object.entries(ABYSS_PLANS_V2882))html+=`<article class="war-notice-v2839"><p>${desc}</p>${warButtonV2839((plan===key?'✓ 已选 · ':'选择 · ')+name,()=>selectAbyssPlanV2882(key),false,plan===key?'primary':'')}</article>`;
  const first=!state.cleared.includes(player.level),quote={realm:Math.max(5,Math.min(CULTIVATION_REALMS.length-1,player.level)),first};
  html+=`<section class="war-notice-v2839"><h3>${first?'本境首通悬赏':'重复讨伐悬赏'}</h3><p>${abyssRewardTextV2882(quote)}。</p><p>首通按入场境界分别记录；重复胜利有35%概率额外获得三种御兽珍材之一，抽中后等概率选一种。固定悬赏不叠加野外收益倍率；领取前不可再次开战。备战沿用现有补给。</p></section>`;
  if(state.pending)html+=`<section class="war-notice-v2839"><h3>待领取 · ${discipleEscV2815(CULTIVATION_REALMS[state.pending.realm].name)}${state.pending.first?'首通':''}</h3><p>${abyssRewardTextV2882(state.pending)}</p>${warButtonV2839('领取已记录悬赏',claimAbyssRewardV2882,false,'primary')}</section>`;
  return html;
 },()=>warButtonV2839(player.level<5?'化神境解锁':state.pending?'先领取上次悬赏':player.hp<=1?'先恢复气血':'踏入断桥 · 开始挑战',launchAbyssBossV2882,player.level<5||!!state.pending||player.hp<=1,'primary')+warButtonV2839('返回仙魔战卷宗',showAncientWarV2859));
 abyssViewV2882={owner:player,ui:warUiV2839,plan};
}

// Six optional bounty encounters; fixed local mechanics, no hidden AI actions.
const ELITES_V2883={
 ape:{name:'【精英】裂山玄甲巨猿',region:'south',level:2,trait:'玄岩震甲',desc:'20%气血岩盾吸收每击65%伤害；盾在时反震主角直接伤害的15%（最低留1血）。破盾后防御降低25%。',tip:'持续伤害、灵宠可磨盾而不触发反震；破盾后集中输出。',materials:{兽骨:3,灵草:4},pets:{兽魂晶:1}},
 treant:{name:'【精英】千年噬魂树妖',region:'east',level:3,trait:'枯荣寄生',desc:'每次实际行动恢复6%最大气血；灼烧期间改为自损5%最大气血（至少10、最低留1血）。',tip:'保持火系灼烧，阻断回血并引发火噬。',materials:{灵木:3,千年灵芝:1},pets:{变异灵晶:1}},
 spider:{name:'【精英】九幽血煞魔蛛',region:'east',level:4,trait:'蚀脉蛛网',desc:'每第2次实际行动抽取12%当前灵力（至少6、不超过现有），并使主角下一次直接伤害降低15%。',tip:'携带回灵补给；蛛网不会封禁技能，也不影响灵宠和持续伤害。',materials:{妖丹:2,暗灵草:2},pets:{魔魂晶:1}},
 wolf:{name:'【精英】极北霜狱狼王',region:'north',level:5,trait:'极寒孤狼',desc:'气血≤50%时攻击提升25%，随后以1.5倍霜爪连击招式替代普攻（合并一次承伤结算）。',tip:'半血前准备护盾和灵力；冻结可阻止其实际行动。',materials:{雪莲:2,万年寒玉:1},pets:{纯净灵髓:1}},
 general:{name:'【精英】古战残甲魔将',region:'west',level:6,trait:'百战不屈',desc:'首次致死伤害后恢复至15%气血，攻击提升30%，本场仅一次；后续致死正常结算。',tip:'触发不屈后预留护盾与治疗。持续伤害同样会触发不屈。',materials:{星辰砂:2,魔核:2},pets:{优质血脉精元:1}},
 guard:{name:'【精英】巡天镇界仙卫',region:'immortal_domain',level:10,trait:'诸天雷罚',desc:'每次实际行动积1道雷印，满2道时以1.45倍、穿透30%防御的神雷替代普攻并清印；主角暴击震散1印。',tip:'暴击压制雷印；封脉期间仍积印但不释放神雷。',materials:{仙灵草:3,龙血果:2},pets:{极品血脉精元:1}}
};
const eliteBattlesV2883=new WeakMap();
let eliteViewV2883=null;
function eliteDayV2883(){return Math.max(0,Math.min(1e9,Math.floor(Number(player.worldTime?.totalDays)||0)));}
function normalizeEliteHuntV2883(raw){
 const r=raw&&typeof raw==='object'?raw:{},records={};
 for(const id of Object.keys(ELITES_V2883)){
  const x=r.records?.[id]||{};
  records[id]={kills:Number.isSafeInteger(x.kills)?Math.max(0,Math.min(1e9,x.kills)):0,lastDay:Number.isInteger(x.lastDay)?Math.max(-1,Math.min(1e9,x.lastDay)):-1};
 }
 const p=r.pending,c=p&&Object.hasOwn(ELITES_V2883,p.id)?ELITES_V2883[p.id]:null;
 const pending=c&&Number.isInteger(p.realm)&&p.realm>=c.level&&p.realm<CULTIVATION_REALMS.length&&Number.isInteger(p.day)&&p.day>=0&&p.day<=1e9?{id:p.id,realm:p.realm,day:p.day,first:p.first===true}:null;
 return {version:1,records,pending};
}
function eliteBattleV2883(enemy){
 const b=enemy&&eliteBattlesV2883.get(enemy);
 return b&&b.owner===player&&enemy===currentEnemy&&(COMBAT_FINISH_V2764.token===b.token||COMBAT_FINISH_V2764.pending?.token===b.token+1)?b:null;
}
function createEliteV2883(id){
 if(!Object.hasOwn(ELITES_V2883,id))return null;
 const c=ELITES_V2883[id],level=Math.min(CULTIVATION_REALMS.length-1,Math.max(c.level,Math.floor(Number(player.level)||0))),phase=Math.min(3,Math.max(0,Math.floor(Number(player.phase)||0))+1);
 const e={name:c.name,hp:320+level*160,maxHp:320+level*160,atk:35+level*14,def:16+level*8,gold:0,exp:0,_realmLevel:level,_realmPhase:phase,_isElite:true,_isTaskBattle:true,_eliteHuntV2883:id};
 // Use the actual elite template once; do not accidentally apply tribulation scaling.
 return balanceEnemyV2802(e,false,false);
}
function initEliteEncounterV2883(enemy){
 const id=enemy?._eliteHuntV2883;if(!Object.hasOwn(ELITES_V2883,id)||eliteBattlesV2883.has(enemy))return;
 eliteBattlesV2883.set(enemy,{owner:player,token:COMBAT_FINISH_V2764.token,id,realm:player.level,day:eliteDayV2883(),turn:0,shield:id==='ape'?Math.floor(enemy.maxHp*.2):0,enraged:false,undying:false,web:false,marks:0,settled:false,acting:false});
}
function eliteOutgoingV2883(enemy,damage,crit,source){
 const b=eliteBattleV2883(enemy);if(!b)return damage;
 damage=Math.max(0,Math.floor(Number(damage)||0));
 if(source==='direct'&&damage>0){
  if(b.web){damage=Math.floor(damage*.85);b.web=false;addCombatLog('蚀脉蛛网削弱本次直接伤害15%，蛛丝已挣脱。','boss');}
  if(b.id==='guard'&&crit&&b.marks>0){b.marks--;addCombatLog('锋芒破印：暴击震散一道天罚雷印。','gold');}
 }
 if(b.id==='ape'&&b.shield>0&&damage>0){
  if(source==='direct'){
   const reflect=Math.max(0,Math.min(player.hp-1,Math.floor(damage*.15)));
   if(reflect){player.hp-=reflect;showDamageNumber(reflect,'player',false,false,false,false,'玄岩反震');addCombatLog(`玄岩反震 ${reflect} 点气血（最低留1血）。`,'damage');}
  }
  const absorb=Math.min(b.shield,Math.floor(damage*.65));b.shield-=absorb;damage-=absorb;
  if(absorb)addCombatLog(`玄岩盾吸收 ${absorb}，剩余 ${b.shield}。`,'boss');
  if(b.shield===0){enemy.def=Math.floor(enemy.def*.75);addCombatLog('岩盾破碎，巨猿防御降低25%。','gold');}
 }
 return damage;
}
function eliteAfterHitV2883(enemy){
 const b=eliteBattleV2883(enemy);if(!b)return;
 if(b.id==='general'&&!b.undying&&enemy.hp<=0){b.undying=true;enemy.hp=Math.max(1,Math.floor(enemy.maxHp*.15));enemy.atk=Math.round(enemy.atk*1.3);addCombatLog('百战不屈：残甲魔将恢复至15%气血，攻击+30%；本场不屈已耗尽。','boss');}
 if(b.id==='wolf'&&!b.enraged&&enemy.hp>0&&enemy.hp<=enemy.maxHp*.5){b.enraged=true;enemy.atk=Math.round(enemy.atk*1.25);addCombatLog('霜狼狂嗥：攻击+25%，后续出招改为霜爪连击。','boss');}
}
function eliteActionV2883(enemy,sealed=false){
 const b=eliteBattleV2883(enemy);if(!b||gameState!=='combat'||isPlayerTurn||enemy.hp<=0||player.hp<=0)return null;
 b.turn++;eliteAfterHitV2883(enemy);
 if(b.id==='treant'){
  if(enemy.burnTurns>0){
   const damage=Math.min(Math.max(0,enemy.hp-1),Math.max(10,Math.floor(enemy.maxHp*.05)));
   dealEnemyDamageV2882(enemy,damage,false,'passive');showDamageNumber(damage,'enemy',false,false,false,false,'火克木灵');addCombatLog(`火克枯荣：阻断恢复，反噬 ${damage} 点气血。`,'gold');
  }else{
   const heal=Math.max(0,Math.min(enemy.maxHp-enemy.hp,Math.floor(enemy.maxHp*.06)));enemy.hp+=heal;
   if(heal){showDamageNumber(heal,'enemy',true,false,false,false,'枯荣寄生');addCombatLog(`枯荣寄生恢复 ${heal} 点气血；灼烧可克制。`,'boss');}
  }
 }
 if(b.id==='spider'&&b.turn%2===0){
  const drain=Math.max(0,Math.min(player.mp,Math.max(6,Math.floor(player.mp*.12))));player.mp-=drain;b.web=true;
  addCombatLog(`蚀脉蛛网抽取 ${drain} 点灵力，下一次主角直接伤害-15%。`,'boss');
 }
 if(b.id==='wolf'&&b.enraged)return {name:'霜爪连击',damage:1.5,mpCost:0};
 if(b.id==='guard'){
  b.marks=Math.min(2,b.marks+1);
  if(b.marks===2&&!sealed){b.marks=0;return {name:'诸天雷罚',damage:1.45,armorPierce:.30,mpCost:0};}
  addCombatLog(`仙卫蓄雷 ${b.marks}/2${sealed?'，封脉阻止本次神雷':''}。`,'boss');
 }
 return null;
}
function eliteRewardV2883(p){const c=ELITES_V2883[p.id];return {gold:360+p.realm*140+(p.first?300+p.realm*120:0),exp:180+p.realm*85,merit:p.first?15:0,materials:c.materials,pets:c.pets};}
function eliteRewardTextV2883(p){const r=eliteRewardV2883(p);return `灵石${r.gold}、修为${r.exp}${r.merit?'、军功'+r.merit:''}、`+Object.entries({...r.materials,...r.pets}).map(([n,q])=>`${n}×${q}`).join('、');}
function recordEliteFinishV2883(){
 const enemy=currentEnemy,b=eliteBattleV2883(enemy),p=COMBAT_FINISH_V2764.pending;
 if(!b||b.settled||p?.owner!==player||p.token!==b.token+1)return;
 b.settled=true;if(p.kind!=='victory'||enemy.hp>0)return;
 const s=normalizeEliteHuntV2883(player.eliteHuntV2883);if(s.pending)return;
 const rec=s.records[b.id],first=b.day>rec.lastDay;
 rec.kills=Math.min(1e9,rec.kills+1);rec.lastDay=Math.max(rec.lastDay,b.day);
 s.pending={id:b.id,realm:b.realm,day:b.day,first};player.eliteHuntV2883=s;
 addCombatLog(`凶煞讨伐已记入悬赏榜，返回领取：${eliteRewardTextV2883(s.pending)}。`,'gold');
}
window.addEventListener('xiantu:combat-finishing',recordEliteFinishV2883);
function eliteViewValidV2883(view=eliteViewV2883){return warAllowedV2839()&&view&&view===eliteViewV2883&&view.owner===player&&view.ui===warUiV2839&&!!document.getElementById('warPanelV2839');}
function launchEliteV2883(id){
 if(!eliteViewValidV2883()||!Object.hasOwn(ELITES_V2883,id))return false;
 const c=ELITES_V2883[id],s=normalizeEliteHuntV2883(player.eliteHuntV2883);
 if(player.level<c.level||!isRegionUnlocked(c.region)||player.hp<=1||s.pending)return false;
 const view=eliteViewV2883,owner=player,stamp=()=>JSON.stringify([player.level,player.phase,player.hp,player.mp,eliteDayV2883(),player.eliteHuntV2883]),before=stamp(),enemy=createEliteV2883(id);
 if(!confirm(`讨伐${c.name}（${getEnemyRealmNameV2811(enemy)}）？${c.desc} 此战不能脱战；战败沿用20%灵石损失。`)||owner!==player||!eliteViewValidV2883(view)||stamp()!==before)return false;
 closeWarPanelV2839();closeWorldOverlay();startCombat(enemy,false,false,null);
 if(currentEnemy!==enemy||gameState!=='combat')return false;
 addCombatLog(`${c.trait}：${c.desc}`,'boss');updateCombatUI();return true;
}
function claimEliteV2883(){
 if(!eliteViewValidV2883())return false;
 const s=normalizeEliteHuntV2883(player.eliteHuntV2883),p=s.pending;if(!p)return false;
 const r=eliteRewardV2883(p);
 const ok=commitWarV286841(()=>{
  s.pending=null;player.eliteHuntV2883=s;player.gold+=r.gold;player.exp+=r.exp;
  player.materials=player.materials||{};player.petMaterials=player.petMaterials||{};
  for(const [n,q] of Object.entries(r.materials)){player.materials[n]=(player.materials[n]||0)+q;onCollectMaterial(n,q);}
  for(const [n,q] of Object.entries(r.pets))player.petMaterials[n]=(player.petMaterials[n]||0)+q;
  if(r.merit){const w=warStateV2839();w.meritV2839+=r.merit;w.meritEarnedV2839+=r.merit;}
 });
 if(ok){checkLevelUp();updateStats();showEliteBoardV2883();}return ok;
}
function showEliteBoardV2883(){
 if(!warAllowedV2839())return;
 const s=normalizeEliteHuntV2883(player.eliteHuntV2883),day=eliteDayV2883();
 openWarPanelV2839('四域凶煞 · 悬赏榜',()=>{
  let html='<p>四域与仙界的六路凶煞，可从悬赏榜主动追踪；达到所需境界和地域门槛后开放。不替换地图上的普通怪物。</p><p>每个仙历日、每种凶煞首次击败额外获得300＋入场境界×120灵石及15军功；以入场日期为准，跨日结算不多领。固定悬赏不叠加野外收益倍率。</p>';
  if(s.pending)html+=`<section class="war-notice-v2839"><h3>待领取 · ${discipleEscV2815(ELITES_V2883[s.pending.id].name)}</h3><p>${eliteRewardTextV2883(s.pending)}</p>${warButtonV2839('领取本次凶煞悬赏',claimEliteV2883,false,'primary')}</section>`;
  for(const [id,c] of Object.entries(ELITES_V2883)){
   const e=createEliteV2883(id),first=day>s.records[id].lastDay,unlocked=player.level>=c.level&&isRegionUnlocked(c.region);
   html+=`<details class="war-details-v2839"><summary>${discipleEscV2815(c.name)} · ${unlocked?(first?'今日首赏可得':'今日首赏已记'):CULTIVATION_REALMS[c.level].name+'解锁'}</summary><p>${discipleEscV2815(getRegionInfo(c.region).name)} · 累计${s.records[id].kills}次</p><h3>${c.trait}</h3><p>${c.desc}</p><p>破敌要诀：${c.tip}</p><p>${getEnemyRealmNameV2811(e)} · 气血${e.maxHp} · 攻击${e.atk} · 防御${e.def}</p><p>悬赏：${eliteRewardTextV2883({id,realm:Math.max(c.level,player.level),first})}</p>${warButtonV2839('寻踪讨伐 · '+c.trait,()=>launchEliteV2883(id),!unlocked||player.hp<=1||!!s.pending,'primary')}</details>`;
  }
  return html+'<p>胜利后回本榜领取，领取前不可再次寻猎。重复挑战仍有基础悬赏；原有成就和御兽战斗成长另计。战败损失20%灵石，出发前先检查配装与补给。</p>';
 },()=>warButtonV2839('探索手册',()=>{closeWarPanelV2839();showExplorationJournalV2829();})+warButtonV2839('返回地图',()=>{closeWarPanelV2839();closeWorldOverlay();}));
 eliteViewV2883={owner:player,ui:warUiV2839};
}
