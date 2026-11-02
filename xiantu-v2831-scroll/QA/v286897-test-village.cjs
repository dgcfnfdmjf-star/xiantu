'use strict';
/* Village presentation: preserves choices, live state, lifecycle cleanup and rollback.
 * Browser measurements: docs/village-sheet.txt. Based on the user's V2908 reference,
 * adapted to the existing 40-script loader and current battle/map pause rules. */
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=path.resolve(process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..')),fixture=require('./v2858-dom-fixture.cjs');
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);

const f=fixture(root);f.c.console.log=()=>{};f.c.console.warn=()=>{};f.c.confirm=()=>true;for(const file of files)f.load(file);
f.run("document.body.classList[Symbol.iterator]=function(){return document.body._classes[Symbol.iterator]()}");
const J=c=>JSON.parse(f.run(`JSON.stringify(${c})`));
const fresh=(setup='')=>f.run(`resetRuntimeState();initAchievements();player=createDefaultPlayer();player.name='青云';gameState='exploring';player.level=2;player.gold=120;player.inventory=['小还丹','小还丹'];${setup}`);

a.equal(files.length,40,'loader order/count unchanged');
// ---------------------------------------------------------------- village screen → sheet
fresh();f.run('showVillage()');
const choices=J('currentChoices.map(c=>({text:c.text,action:c.action}))');a(choices.length>=8,'village choices built by the core');
a.equal(f.run("document.getElementById('storyPanel').classList.contains('village-v286897')"),true,'village mode on');
a.equal(f.run("document.getElementById('storyPanel').querySelector('.vsheet-v286897')?.className"),'vsheet-v286897','sheet built');
a.equal(f.run("document.getElementById('choices').parentNode.className"),'vsheet-v286897','choices moved into the sheet');
const kids=()=>J("document.getElementById('storyPanel').children.map(e=>e.className||e.id)");   // the fixture's querySelectorAll also sees detached nodes
a.equal(kids().filter(c=>c==='vsnap-v286897').length,3,'three snap markers');
const cardsHtml=f.run("document.getElementById('choices')._html");
const idx=[...cardsHtml.matchAll(/onclick="villageChoiceV286897\((\d+),\d+\)"/g)].map(m=>+m[1]).sort((x,y)=>x-y);
a.deepEqual(idx,choices.map((_,i)=>i),'every choice exactly once, original indexes');
a.equal((cardsHtml.match(/class="vcard-v286897/g)||[]).length,choices.length,'one card per choice');
// groups
const groups=J('villageGroupsV286897(currentChoices).map(g=>[g.id,g.items.map(x=>x.c.action)])');
const where=Object.fromEntries(groups.flatMap(([g,acts])=>acts.map(x=>[x,g])));
for(const [act,g] of [['explore','train'],['early_economy_v2773','train'],['rest','train'],['shop','trade'],['market','trade'],['home','home'],['romance','home'],['ancient_war_v2859','world'],['world_travel_menu','world']])a.equal(where[act],g,`${act} in ${g}`);
a(groups.findIndex(g=>g[0]==='quest')<=0,'机缘 (story/boss) first when present');
a.deepEqual(J("villageGroupsV286897([{text:'🧪 新玩法',action:'new_thing_v3000'}]).map(g=>g.id)"),['other'],'unknown actions land in 其他, never dropped');
// NPC tip strip merges portrait / scene card / layout header
a.match(f.run("document.querySelector('.vsheet-v286897')._html"),/vstrip-v286897[\s\S]*南域 · 青云村/,'tip strip with the place name');
const css=fs.readFileSync(root+'/xiantu-v2762.css','utf8').split('/* Village sheet:')[1];
a.match(css,/\.story-protagonist-card,[^{]*\.area-scene-card,[^{]*\.area-layout-card,[^{]*\.interior-strip\{display:none!important\}/,'portrait, scene card, layout header and strip folded into the tip strip');

// ---------------------------------------------------------------- live status lines
const st=act=>J(`villageStatusV286897(currentChoices.find(c=>c.action==='${act}'))`);
fresh("player.hp=Math.floor(getMaxHp()*.3);player.mp=getMaxMp()");f.run('showVillage()');
a.match(st('rest').text,/^气血 30% · 灵力 100%$/);a.equal(st('rest').ready,true,'low HP: 灵泉 highlighted');a.match(st('explore').text,/先去灵泉/);
fresh("player.hp=getMaxHp();player.mp=getMaxMp()");f.run('showVillage()');a.equal(st('rest').text,'气血灵力俱满');a(!st('rest').ready);
a.equal(st('shop').text,'灵石 120 · 小还丹 ×2');fresh("player.inventory=[];player.gold=500");f.run('showVillage()');a.equal(st('shop').ready,true,'no healing pills: 杂货铺 highlighted');
fresh("player.exp=getCurrentExpNeed()");f.run('showVillage()');a.deepEqual(st('home'),{text:'修为圆满 · 可闭关突破',ready:true});
fresh("player.level=0;player.exp=0");f.run('showVillage()');a.equal(st('home').text,'练气后开放','locked 洞府 explained');a.match(f.run("document.getElementById('choices')._html"),/villageChoiceV286897\(\d+,\d+\)" disabled/,'locked card disabled');
fresh();f.run('showVillage()');a.match(st('world_travel_menu').text,/^已开 \d+\/\d+ 处地域$/);
a.equal(st('early_economy_v2773').text,'补助 / 跑腿 / 回收','static lines come from the choice text');
// html is escaped
a.equal(f.run("villageEscV286897('<b>\"x\"</b>')"),'&lt;b&gt;&quot;x&quot;&lt;/b&gt;');

// ---------------------------------------------------------------- other screens restore the panel
fresh();f.run('showVillage()');f.run("showStory('别处',[{text:'返回',action:'village'}])");
a.equal(f.run("document.getElementById('storyPanel').classList.contains('village-v286897')"),false,'other story screens: normal panel');
a.equal(f.run("document.getElementById('choices').parentNode.id"),'storyPanel','choices back in the panel');
a.deepEqual(kids().filter(c=>/v286897/.test(c)),[],'sheet removed');
a.match(f.run("document.getElementById('choices')._html"),/class="choice-btn"/,'plain buttons elsewhere');
f.run('showVillage()');f.run('showVillage()');a.equal(kids().filter(c=>c==='vsheet-v286897').length,1,'re-entering never stacks sheets');a.equal(kids().filter(c=>c==='vsnap-v286897').length,3);
// a failure inside the enhancement falls back to the old screen
f.run("window.__vg=villageGroupsV286897;villageGroupsV286897=function(){throw new Error('x')}");f.run('showVillage()');
a.equal(f.run("document.getElementById('storyPanel').classList.contains('village-v286897')"),false,'error: old screen');a.equal(f.run("document.getElementById('choices').parentNode.id"),'storyPanel','error: elements back in place');a.match(f.run("document.getElementById('choices')._html"),/class="choice-btn"/,'error: the core buttons stay');f.run('villageGroupsV286897=window.__vg');

// ---------------------------------------------------------------- remembered position
f.storage.set('xiantu_village_sheet_v286897','bogus');f.run('showVillage()');a.equal(f.run('VILLAGE_RT_V286897.snap'),'peek','bad saved value → peek');
f.storage.set('xiantu_village_sheet_v286897','half');f.run('showVillage()');a.equal(f.run('VILLAGE_RT_V286897.snap'),'half','saved position restored');

// ---------------------------------------------------------------- CSS contract
const V=J('VILLAGE_V286897');
a.match(css,/scroll-snap-type:y proximity/,'scroll-snap sheet (no JS drag)');a.match(css,/pointer-events:none;z-index:40/,'empty area passes taps to the map');a.match(css,/\.vsheet-v286897\{pointer-events:auto/);
a(css.includes('.vspacer-v286897{height:76vh;height:76dvh'),'peek keeps map visible');
a(css.includes('.vsnap-v286897[data-snap="half"]{top:31vh;top:31dvh}'),'half snap');a.match(css,/data-snap="full"\]\{top:calc\(/,'full snap');
for(const side of ['right','left','bottom'])a(css.includes(`env(safe-area-inset-${side}, 0px)`),'notch: '+side);
a.match(css,new RegExp(`@media \\(orientation:landscape\\) and \\(max-height:${V.landscape.maxHeight}px\\)\\{[\\s\\S]*left:50%!important`),'landscape: centred sheet');
a(![...css.matchAll(/font-size:(\d+)px/g)].some(m=>+m[1]<12),'no text below 12px');
a.match(css,/prefers-reduced-motion:reduce/);

// Real action IDs, unchanged underlying choices, and no stale callback can act on a replacement screen.
fresh();f.run('showVillage()');
a.equal(J("villageGroupsV286897([{text:'首领',action:'boss_fight',boss:true}])[0].id"),'quest');
a.equal(J("villageStatusV286897({action:'boss_fight'}).ready"),true);
const before=f.run('JSON.stringify(player)');f.run('showVillage();showVillage()');a.equal(f.run('JSON.stringify(player)'),before,'presentation cannot mutate saves');
f.run('globalThis.oldVillageGeneration=VILLAGE_RT_V286897.generation;globalThis.choiceCalls=0;globalThis.rawChoice=handleChoice;handleChoice=()=>choiceCalls++');
f.run('villageChoiceV286897(0,oldVillageGeneration)');a.equal(f.run('choiceCalls'),1);
f.run("showStory('new page',[{text:'new action',action:'rest'}]);villageChoiceV286897(0,oldVillageGeneration)");a.equal(f.run('choiceCalls'),1,'stale village index cannot invoke another screen');
f.run('handleChoice=rawChoice;showVillage();VILLAGE_RT_V286897.onScroll()');const oldTimer=f.run('VILLAGE_RT_V286897.timer');a(f.timers.has(oldTimer));f.run('closeWorldOverlay()');a(!f.timers.has(oldTimer),'close cancels debounce');a.equal(f.run('VILLAGE_RT_V286897.active'),false);
f.run('showVillage();resetRuntimeState()');a.equal(f.run('VILLAGE_RT_V286897.active'),false,'load/new-game resets panel');
// Failure AFTER replacing choices must also restore the original usable markup.
fresh();f.run('showVillage();villageResetV286897();globalThis.nativeAdd=document.getElementById("storyPanel").addEventListener;document.getElementById("storyPanel").addEventListener=()=>{throw Error("listener failure")}');
f.run('showVillage()');a.equal(f.run('VILLAGE_RT_V286897.active'),false);a.match(f.run('document.getElementById("choices").innerHTML'),/onclick="handleChoice\(\d+\)"/);
f.run('document.getElementById("storyPanel").addEventListener=nativeAdd;showVillage();villageGoV286897("invalid")');a(['peek','half','full'].includes(f.run('VILLAGE_RT_V286897.snap')));
// Preferences are optional; denied storage cannot prevent opening or closing.
f.run('globalThis.savedStorage=localStorage;localStorage={getItem(){throw Error("denied")},setItem(){throw Error("denied")}};showVillage()');a.equal(f.run('VILLAGE_RT_V286897.active'),true);f.run('villageGoV286897("half");closeWorldOverlay();localStorage=savedStorage');
// Starting combat restores the original layout and removes pending sheet work.
fresh();f.run('showVillage();startCombat({name:"测试妖兽",hp:10,maxHp:10,atk:1,def:0,gold:0,exp:0})');a.equal(f.run('VILLAGE_RT_V286897.active'),false);a.equal(f.run('document.getElementById("choices").parentNode.id'),'storyPanel');
console.log('v286897-test-village: all checks passed');

