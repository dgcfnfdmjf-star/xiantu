'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.console.log=()=>{};f.El.prototype.before=function(el){this.parentNode?.insertBefore(el,this);};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const run=s=>f.run(s),json=s=>JSON.parse(run(`JSON.stringify(${s})`));
function fresh(){
 run("player=createDefaultPlayer();initAchievements();player.level=1;player.gold=321;player.worldMapId='south';currentRegion='south';gameState='exploring';COMBAT_FINISH_V2764.settling=false;document.hidden=false;closeWorldOverlay();updateRegionStatusHUD();");
 f.timers.clear();
}
fresh();
const button=f.ids.get('worldRegionStatus'),firstClick=button.onclick,firstText=button.textContent;
a.equal(button.tagName,'BUTTON');a.equal(button.type,'button');a.match(button.getAttribute('aria-label'),/三界行路/);
for(let i=0;i<20;i++)run('updateRegionStatusHUD()');
a.equal(f.ids.get('worldRegionStatus'),button);a.equal(button.onclick,firstClick);a.equal(button.textContent,firstText);a.equal(firstText.match(/⇄ 行路/g).length,1);
let opens=0;const menu=f.c.showWorldTravelMenu;f.c.showWorldTravelMenu=function(...args){opens++;return menu.apply(this,args);};
run('FLAT_WORLD.target={x:1,y:2};FLAT_WORLD.keys={ArrowUp:true};');button.click();a.equal(opens,1);a.equal(run('FLAT_WORLD.target'),null);
a.equal(run('currentChoices.find(c=>c.regionId==="east").condition()'),false);
a.equal(run('player.gold'),321);a.equal(run('currentRegion'),'south');
// Closed/replaced menus and old-character controls cannot act on the next UI or character.
const choice=run('currentChoices.at(-1)');run('closeWorldOverlay()');a.equal(choice.condition(),false);
run('showWorldTravelMenu()');const replaced=run('currentChoices.at(-1)');run('showStory("另一个面板",[])');a.equal(replaced.condition(),false);
run('closeWorldOverlay();player=createDefaultPlayer();gameState="exploring";');const count=opens;firstClick({stopPropagation(){}});a.equal(opens,count);
run('updateRegionStatusHUD()');button.click();a.equal(opens,count+1);
// Admission is checked both when opening and immediately before travel, including stale choices.
for(const busy of ["gameState='combat'","gameState='combat-ending'","gameState='start'","player.breakthrough={isAnimating:true}","document.hidden=true","COMBAT_FINISH_V2764.settling=true"]){
 fresh();run('player.level=10;showWorldTravelMenu()');const pending=run('currentChoices.find(c=>c.regionId==="north")');
 run(busy);const before=json('[currentRegion,player.worldMapId,player.gold,player.exp]');
 a.equal(pending.condition(),false,busy);a.equal(run('showWorldTravelMenu()'),false,busy);a.equal(run('travelToWorldMap("north")'),false,busy);
 const n=opens;f.ids.get('worldRegionStatus').click();a.equal(opens,n,busy);a.deepEqual(json('[currentRegion,player.worldMapId,player.gold,player.exp]'),before,busy);
}
fresh();run('travelToWorldMap("north")');a.equal(run('currentRegion'),'south');
a.equal(run('travelToWorldMap("not-a-region")'),false);a.equal(run('currentRegion'),'south');
// Original unlock levels and cost/time rules are unchanged; destination remains the map spawn.
a.deepEqual(json('REGION_UNLOCK_LEVEL'),{south:0,east:2,north:2,west:3,human_peaks:2,human_valleys:2,demon_domain:4,immortal_domain:10});
fresh();run('player.level=2;showWorldTravelMenu()');a.equal(run('currentChoices.find(c=>c.regionId==="north").condition()'),true);a.equal(run('currentChoices.find(c=>c.regionId==="west").condition()'),false);
const before=json('[player.gold,player.exp,player.worldTime,player.inventory]');run('travelToWorldMap("north")');
a.equal(run('currentRegion'),'north');a.equal(run('player.worldMapId'),'north');a.deepEqual(json('[FLAT_WORLD.player.x,FLAT_WORLD.player.y]'),json('[WORLD_MAP_CONFIGS.north.spawn.x,WORLD_MAP_CONFIGS.north.spawn.y]'));
a.deepEqual(json('[player.gold,player.exp,player.worldTime,player.inventory]'),before);
console.log('PASS native region shortcut, stable binding/text, movement reset, busy/hidden/old-owner guards, stale menu invalidation and unchanged unlock/cost/spawn rules');
