'use strict';
/*
 * QA/v2890-test-guide.cjs - 修行指引 V2890 (GUIDE_V2890 block in xiantu-v28684-duel.js), against the installed code.
 * Checks: loading and build stamp; the paged guide (8 tabs, tab/pager/keyboard switching, remembered tab, Esc);
 * old hooks still work (灵宠完整指引 button, 问号提示, 初入仙途); every number the guide states matches the live
 * code (constants read directly, plus the hard-coded rules re-checked against the function sources); the
 * tutorial text fix and the one-time 镇岳台 popup; nothing in the save changes; works without V2888/V2889.
 * Run:  XIANTU_TEST_ROOT=xiantu-v2831-scroll node xiantu-v2831-scroll/QA/v2890-test-guide.cjs
 */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),fixture=require('./v2858-dom-fixture.cjs');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
const ME='xiantu-v28684-duel.js';
function game(skip=[]){const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=(...x)=>f.errors.push(['warn',...x]);for(const file of files){if(file===ME&&skip.length)f.run(fs.readFileSync(root+'/'+file,'utf8').replace(/\/\/ BEGIN SCENE25D_V2888[\s\S]*?\/\/ END SCENE25D_V2888/,'').replace(/\/\/ BEGIN BATTLE25D_V2889[\s\S]*?\/\/ END BATTLE25D_V2889/,''));else f.load(file);}return f;}
const fresh=(f,setup='')=>f.run(`resetRuntimeState();player=createDefaultPlayer();gameState='exploring';closeWorldOverlay();document.getElementById('gameScreen').classList.remove('hidden');document.getElementById('startScreen').classList.add('hidden');${setup}`);
const runTimers=f=>{for(let i=0;i<10&&f.timers.size;i++)for(const [id,t] of [...f.timers]){f.timers.delete(id);try{t.f();}catch(e){f.errors.push(['timer',e]);}}};
const text=el=>{const out=[];const walk=n=>{out.push(n._text||'',n._html||'');n.children.forEach(walk);};walk(el);return out.join(' ');};
const body=f=>f.run("document.getElementById('guideBodyV2890')").innerHTML;

// ---------------------------------------------------------------- loading ----
a.equal(files.length,40);a.equal(files.at(-1),ME,'guide installs after dependencies');
const f=game();
a.equal(f.run(`window.__xiantuBuildFilesV2814["${ME}"]`),html.match(/var expectedBuild='([^']+)'/)[1],'build stamp');
a.equal(f.run('!!window.showHelpManual.__guideV2890'),true,'showHelpManual wrapped');
a.equal(f.run('!!window.checkTutorialRealm.__guideV2890'),true,'checkTutorialRealm wrapped');
{const before=f.run('window.showHelpManual');f.run('installGuideV2890()');a.equal(f.run('window.showHelpManual'),before,'no double wrap');}
a.equal(f.run("document.getElementById('guideStyleV2890')?.tagName"),'STYLE');
// the sheet calls event.stopPropagation() on clicks, so the tab handler must listen in the capture phase
a(/addEventListener\('click',guideClickV2890,true\)/.test(fs.readFileSync(root+'/'+ME,'utf8')),'click listener uses capture');

// ---------------------------------------------------------------- panel ----
fresh(f);f.run("localStorage.removeItem('xiantu_guide_tab_v2890')");
const p0=f.run('JSON.stringify(player)');
f.run('showHelpManual()');
const overlay=()=>f.run("document.getElementById('helpManual')");
a(overlay()&&overlay().classList.contains('guide-v2890')&&overlay().classList.contains('active'),'guide overlay open');
a.equal(f.run("document.querySelectorAll('#helpManual').length"),1,'one overlay');
const tabs=()=>f.run("document.getElementById('helpManual').querySelectorAll('.guide-tab-v2890')");
a.deepEqual(tabs().map(t=>t.getAttribute('data-guide-tab')),['start','cultivate','combat','sect','boss','travel','items','save'],'8 tabs in order');
a.equal(tabs().filter(t=>t.getAttribute('aria-selected')==='true').length,1,'one selected tab');
a.equal(f.run('guideTabV2890'),'start','opens on 起步 the first time');
a.equal(f.run("document.getElementById('guideBodyV2890').getAttribute('role')"),'tabpanel');
a(f.run("document.getElementById('helpManual').querySelector('.guide-sheet-v2890')").getAttribute('aria-modal')==='true','dialog semantics');

// every tab renders, without the error fallback
const pages={};
for(const id of ['start','cultivate','combat','sect','boss','travel','items','save']){
  a.equal(f.run(`guideTabV2890Go('${id}',false)`),true,id);pages[id]=body(f);
  a(!pages[id].includes('此页暂时无法显示'),id+' rendered');a(!/undefined|NaN|\[object/.test(pages[id]),id+' has no undefined/NaN');
  a.equal(tabs().find(t=>t.getAttribute('aria-selected')==='true').getAttribute('data-guide-tab'),id,id+' selected');
}
a.equal(f.run('JSON.stringify(player)'),p0,'reading the guide does not change the save');

// ---------------------------------------------------------------- facts vs code ----
const has=(id,s,why)=>a(pages[id].includes(s),`${id}: "${s}"${why?' ('+why+')':''}`);
const realm=i=>f.run(`CULTIVATION_REALMS[${i}].name`);
for(const r of ['south','east','north','west'])has('travel',realm(f.run(`REGION_UNLOCK_LEVEL.${r}`)),'unlock realm for '+r);
a.deepEqual(['南域','东域','北域','西域'].map(n=>pages.travel.match(new RegExp(n+' ([^<]+)<'))[1]),['south','east','north','west'].map(r=>realm(f.run(`REGION_UNLOCK_LEVEL.${r}`))),'region tags in order');
has('items',`本命法宝位于${realm(3)}境开启`);

// boss: window, tiers, rewards and rules straight from BOSS_V2887
{const B=f.run('BOSS_V2887'),Y=f.run('GAME_DAYS_PER_YEAR'),M=f.run('GAME_DAYS_PER_MONTH'),s=f.run('bossWindowStartV2887()'),e=s+B.window.days-1;
 const md=d=>`${Math.floor(d/M)+1}月${d%M+1}日`;a.equal(Y,360);has('boss',`${md(s)}～${md(e)}`,'opening window');a.equal(md(s),'10月1日');
 for(const t of B.tiers)for(const v of [`第${t.id}层`,realm(t.minLevel),String(t.gold),String(t.exp),String(t.contribution)])has('boss',v,'tier '+t.id);
 has('boss',`${B.repeat.gold*100}% 灵石与 ${B.repeat.bones} 枚${B.bone}`,'practice reward');
 has('boss',`献 ${B.offering.bones} 枚${B.bone}，开战多 ${B.offering.locks} 道`,'offering');
 has('boss',`+${Math.round(B.seal.missedHp*100)}%/年`);has('boss',`门人最多感受 ${B.seal.memberCap} 年，宗主最多 ${B.seal.missedCap} 年`);has('boss',`繁荣度 −${B.seal.missedProsperity}`);
 has('boss',`以 ${B.seal.reinforceBones} 枚${B.bone}加固封印：清除失守，繁荣度 +${B.seal.reinforceProsperity}`);
 has('boss',`调息 ${B.defeatDays} 日`);has('boss',`最多 ${B.maxRounds} 回合`);has('boss',`气血 +${Math.round((B.masterHp-1)*100)}%`);
 has('boss',realm(B.tiers[0].minLevel)+'境','eligibility');a.equal(f.run('bossTierV2887(3)'),null,'below the first tier is not eligible');
 for(const id of B.aspectOrder)has('boss',B.aspects[id].name);for(const b of Object.values(B.boons))has('boss',b.name);
 for(const n of Object.values(B.actionNames))has('boss',n);
 a.equal(B.charge.bonus,.25);has('boss','每层增伤 25%');a.equal(B.guardHeal,.03);a.equal(B.mp.guardGain,.12);has('boss','回 3% 气血、12% 灵力');a.equal(B.mp.breakCost,.25);has('boss','耗 25% 灵力');
 a.equal(B.read.after,2);has('boss','连用两次后，再用会被<b>看破</b>');
 a(f.run("bossHallButtonV2887.toString()").length>0);a(fs.readFileSync(root+'/xiantu-v2762-core.js','utf8').includes("html+=bossHallButtonV2887()"),'boss entry is in the sect hall');}
// sect and master
{const r=f.run('SECT_MASTER_RULES_V2872'),c=f.run('SECT_MASTER_COUNCIL_V2872');
 has('sect',`须${realm(r.realm)}境、累计贡献 ${r.contribution}、完成 ${r.tasks} 次宗门委托`);
 for(const k of f.run('SECT_RANKS'))has('sect',`${k.name} ${k.contributionRequired}`,'rank');
 has('sect',`${c.repairContribution} 贡献、${c.repairGold} 灵石，繁荣度 +${c.prosperityGain}`);has('sect',`${c.lessonContribution} 贡献`);has('sect',`${c.cooldown} 个游戏日冷却`);
 for(const d of f.run('SECT_DOCTRINES_V2880'))has('sect',d.name);
 a(/\?16:12/.test(f.run('sectDiscipleCapV2880.toString()')));has('sect','最多 12 人，宗主可收 16 人');
 a(/cost=id==='array'\?100:0/.test(f.run('sectPathPlanV2880.toString()')));has('sect','布阵每次耗 100 贡献');
 a(/retryDay/.test(f.run('sectPathPlanV2880.toString()'))&&/调息3个游戏日/.test(f.run('sectPathPlanV2880.toString()')));has('sect','调息 3 日');}
// rules quoted from function bodies
const src=n=>f.run(`${n}.toString()`);
a(/Math\.max\(\.15,Math\.min\(\.95/.test(src('fleeChanceV286818')));has('combat','15%～95%');
for(const k of ['isBossFight','isTribulation','tournamentFight','_warV2839','_isTaskBattle','_isTutorial'])a(src('canFleeV286818').includes(k),'no flee: '+k);
a(fs.readFileSync(root+'/xiantu-v2762-14-v279-pet-capture-system.js','utf8').includes('if(hpPct>.25)'));has('combat','25% 气血及以下');
a(fs.readFileSync(root+'/xiantu-v2762-17-combatskillloadoutv212.js','utf8').includes('每个系最多携带3个'));has('combat','每系最多携带 3 个');
a(/maxYears===1\?1:10/.test(src('computeRetreatV2782')));has('cultivate','最多一年');has('cultivate','最多十年');has('cultivate','每次只进一段');
a(!Object.values(pages).some(p=>p.includes('闭关十年最多推进一个小段')),'the ambiguous old line is gone');
a.equal(f.run('JSON.stringify(REALM_PHASES)'),'["初期","中期","后期","圆满"]');has('cultivate','初期、中期、后期、圆满');
a(src('showForgeV2825').includes('强化最高+10，每级提升原有攻击、防御、气血、灵力5%，成功率100%'));has('items','最高 +10');has('items','5%，成功率 100%');
a(src('startAutoSave').includes('30000'));has('save','每 30 秒');
a(src('showSaveManagerV2768').includes('最大8MB'));has('save','最大 8MB');
for(const s of ['exportSaveV2768','copySaveTextV2870','restoreBackupV2768','restoreBeforeReplaceV2870','restorePreviousV2838'])a.equal(f.run(`typeof ${s}`),'function',s);
a(src('manualSave').includes('已保留开战前记录'));has('save','只保留开战前的记录');
a(fs.readFileSync(root+'/xiantu-v2762-core.js','utf8').includes('三种丹药合计最多延寿600年'));has('cultivate','最多延寿 600 年');
a.equal(f.run('localStorage.getItem("xiantu_battle25d_v2889")===null'),true);has('combat','【立体战场】');has('travel','【立体】');
for(const s of ['修真造化之路','上一场战斗 · 回看','☯ 天机'])a(html.includes(s.replace(' · ',' · ')),'HUD button exists: '+s),has('start',s);

// ---------------------------------------------------------------- switching ----
f.run('closeHelpManual()');a.equal(overlay(),null,'closed');
f.run('showHelpManual()');a.equal(f.run('guideTabV2890'),'save','remembers the last tab');
const click=el=>f.run('dispatchEvent')({type:'click',target:el});
click(tabs()[4]);a.equal(f.run('guideTabV2890'),'boss','tab click');a.equal(f.run("localStorage.getItem('xiantu_guide_tab_v2890')"),'boss');
{const next=f.run("document.getElementById('guideBodyV2890')").querySelectorAll('button').find(b=>b.getAttribute('data-guide-tab')==='travel');click(next);a.equal(f.run('guideTabV2890'),'travel','pager');a.equal(f.run('document.activeElement')?.getAttribute('data-guide-tab'),'travel','pager moves focus to the tab');}
const key=(k,target)=>f.run('dispatchEvent')({type:'keydown',key:k,target,preventDefault(){}});
key('ArrowRight',tabs()[5]);a.equal(f.run('guideTabV2890'),'items','ArrowRight');
key('End',tabs()[6]);a.equal(f.run('guideTabV2890'),'save','End');
key('ArrowRight',tabs()[7]);a.equal(f.run('guideTabV2890'),'start','wraps around');
key('ArrowLeft',tabs()[0]);a.equal(f.run('guideTabV2890'),'save','ArrowLeft wraps');
key('ArrowRight',f.run("document.getElementById('guideBodyV2890')"));a.equal(f.run('guideTabV2890'),'save','arrows outside the tab list do nothing');
f.run("showHelpManual('boss')");a.equal(f.run('guideTabV2890'),'boss','open on a named tab');
f.run("showHelpManual('nope')");a.equal(f.run('guideTabV2890'),'boss','unknown tab falls back to the remembered one');
key('Escape',tabs()[0]);a.equal(overlay(),null,'Esc closes');
key('Escape',null);a.equal(overlay(),null);

// ---------------------------------------------------------------- old hooks ----
// the fixture has no descendant selectors; give the V211 hook the one it uses, as a browser would
{const q=f.c.document.querySelector;f.c.document.querySelector=s=>s==='#helpManual .help-manual-actions'?(f.run("document.getElementById('helpManual')")?.querySelector('.help-manual-actions')||null):q(s);}
f.run('showHelpManual()');runTimers(f);
{const acts=f.run("document.getElementById('helpManual').querySelector('.guide-actions-v2890')");
 a(acts.children.some(b=>b.id==='helpPetGuideV211'),'灵宠完整指引 button still added by the V211 hook');
 const all=overlay().innerHTML,labels=[all];
 a(labels.some(t=>t.includes('重走新手引路')));a(labels.some(t=>t.includes('问号提示')));a(labels.some(t=>t.includes('返回仙途')));
 a(labels.some(t=>t.includes('开始初入仙途')),'new characters can start 初入仙途 here');}
{const tip=f.run('player.tutorial.showTooltips');f.run('guideTabV2890Go("combat",false);toggleTutorialTooltips()');a.equal(f.run('player.tutorial.showTooltips'),!tip,'tooltips toggled');
 a(overlay().classList.contains('guide-v2890'),'reopened as the new guide');a.equal(f.run('guideTabV2890'),'combat','same tab after toggling');}
f.run("player.firstJourneyV28687={step:2}");f.run('showHelpManual()');
a(text(overlay()).includes('继续初入仙途'),'continue 初入仙途 shown mid-way');
f.run("player.firstJourneyV28687={step:5}");f.run('showHelpManual()');a(!text(overlay()).includes('初入仙途</button>'),'hidden when finished');
f.run('closeHelpManual()');
// base throws -> still renders
{const g=game();fresh(g);g.run("window.showHelpManual=(()=>{const w=window.showHelpManual;return w;})()");
 const base=g.run('v211HelpManualBase');a.equal(typeof base,'function');
 g.run("ensureTutorialState=()=>{throw Error('boom')}");g.run('showHelpManual()');a(g.run("document.getElementById('helpManual')").classList.contains('guide-v2890'),'renders even if the old panel throws');}

// ---------------------------------------------------------------- next steps ----
fresh(f,"player.level=0;player.sect='散修';player.firstJourneyV28687=null");f.run("showHelpManual('start')");
a(body(f).includes('起步之路 0/11'));a(body(f).includes('尚无宗门'));
fresh(f,"player.level=4;player.phase=0;player.sect='凌霄宗';player.exp=getCurrentExpNeed();player.worldTime.totalDays=270");f.run("showHelpManual('start')");
a(body(f).includes('修为已至瓶颈'),'exp full');a(body(f).includes('镇岳台封印松动中（余 10 天）'),'boss window open');a(!body(f).includes('尚无宗门'));
fresh(f,"player.level=4;player.sect='凌霄宗';player.exp=0;player.worldTime.totalDays=100;player.firstJourneyV28687={step:5}");f.run("showHelpManual('start')");
a(body(f).includes('接宗门任务'),'default suggestion');
f.run("bossWindowV2887=()=>{throw Error('x')}");f.run("showHelpManual('start')");a(body(f).includes('此刻宜行'),'a failing check is skipped');
f.run('closeHelpManual()');

// ---------------------------------------------------------------- tutorial text + popup ----
{const d=f.run('TUTORIAL_STEPS.cultivation.desc');a(d.includes('每次突破只进一段')&&d.includes('不会自行破境')&&!d.includes('闭关十年最多推进一个小段'));}
const g=game();fresh(g,"player.level=4;player.sect='散修'");g.run('checkTutorialRealm(4)');
a(!g.run('player.tutorial.readPopups').includes('unlock_boss_v2890'),'no 镇岳台 popup outside a sect');
fresh(g,"player.level=4;player.sect='凌霄宗'");g.run("player.tutorial.readPopups=['unlock_east','unlock_north','unlock_west'];showTutorialUnlockPopup('qa_existing','现有提示','x')");g.run('checkTutorialRealm(4)');
a(!g.run('player.tutorial.readPopups').includes('unlock_boss_v2890'),'existing unlock is not overwritten');g.run("document.getElementById('tutorialUnlock')?.remove();noticeTickV2901();NQ_V2901.lastEnd=Date.now()-1000;noticeTickV2901();checkTutorialRealm(4)");
a(g.run('player.tutorial.readPopups').includes('unlock_boss_v2890'),'popup recorded once');
a(g.run("document.getElementById('tutorialUnlock')").innerHTML.includes('镇岳台可往'));a(g.run("document.getElementById('tutorialUnlock')").innerHTML.includes('10月1日～10月10日'));
g.run("document.getElementById('tutorialUnlock')?.remove();noticeTickV2901();NQ_V2901.lastEnd=Date.now()-1000;noticeTickV2901();checkTutorialRealm(4)");a.equal(g.run("document.getElementById('tutorialUnlock')"),null,'shown only once');
fresh(g,"player.level=2;player.sect='凌霄宗'");g.run('checkTutorialRealm(2)');a(!g.run('player.tutorial.readPopups').includes('unlock_boss_v2890'),'not before 元婴');
a(g.run('player.tutorial.readPopups').includes('unlock_east'),'old unlock popups still run');
a.equal(g.run("guideEscV2890('<b>&')"),'&lt;b&gt;&amp;');

// ---------------------------------------------------------------- without V2888/V2889 ----
{const h=game(['xiantu-v2888-scene25d.js','xiantu-v2889-battle25d.js']);fresh(h);h.run("showHelpManual('combat')");
 a(h.run("document.getElementById('helpManual')").classList.contains('guide-v2890'),'works without V2888/V2889');a(!h.errors.some(e=>e[0]==='timer'));}

// Reading malformed/legacy fields must remain read-only, including no implicit tutorial normalization.
{const h=game();fresh(h,"delete player.tutorial;player.firstJourneyV28687={step:'bad'}");const before=h.run('JSON.stringify(player)');let saves=0;h.c.saveGame=()=>{saves++;return true};h.run("showHelpManual('start');guideTabV2890Go('sect');closeHelpManual()");a.equal(h.run('JSON.stringify(player)'),before);a.equal(saves,0);}
{const h=game();fresh(h);const opener=h.c.document.createElement('button');h.c.document.body.appendChild(opener);opener.focus();h.run("showHelpManual('combat')");a(h.run('isWorldOverlayOpen()'));a(h.run('document.activeElement').getAttribute('data-guide-tab')==='combat');h.run('closeHelpManual()');a.equal(h.c.document.activeElement,opener);h.run("showHelpManual();resetRuntimeState()");a.equal(h.run("document.getElementById('helpManual')"),null);}
a.deepEqual(f.errors.filter(e=>e[0]!=='warn'||/修行指引|镇岳台提示/.test(String(e[1]))),[],'no errors');
console.log('v2890-test-guide: all checks passed');
