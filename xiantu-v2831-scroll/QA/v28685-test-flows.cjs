const fs=require('fs'),path=require('path'),a=require('assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
f.c.Image.prototype.removeAttribute=function(){};f.El.prototype.removeAttribute=function(k){delete this.attributes[k]};
for(const s of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(s);
f.run('startGame();closeWorldOverlay();player.level=4;');
for(const type of f.run('Object.keys(ARTIFACT_TYPES)')){
 f.c.testType=type;
 f.run(`player.artifacts=[{type:testType,name:testType,level:1}];player.gold=10000;player.materials={};for(const [m,n] of Object.entries(ARTIFACT_TYPES[testType].upgradeCost))if(m!=='灵石')player.materials[m]=n;`);
 a.equal(f.run('getArtifactUpgradeCheck(player.artifacts[0]).ok'),true,type);
 const gold=f.run('player.gold'),cost=f.run('ARTIFACT_TYPES[testType].upgradeCost.灵石||0');
 f.run('upgradeArtifact(0)');a.equal(f.run('player.artifacts[0].level'),2);a.equal(f.run('player.gold'),gold-cost);
 f.run('player.gold=0;player.materials={};upgradeArtifact(0)');a.equal(f.run('player.artifacts[0].level'),2);
 f.run('player.artifacts[0].level=ARTIFACT_TYPES[testType].maxLevel');a.equal(f.run('getArtifactUpgradeCheck(player.artifacts[0]).max'),true);
}
console.log('PASS all artifact types: valid lookup, exact costs, missing materials, cap');
f.run(`closeWorldOverlay();player.pets=[{type:Object.keys(PET_TYPES)[0],name:'回归灵宠',level:1}];player.petMaterials={'灵果':2,'灵兽丹':2};ensureAllPetGrowthV210();player.pets[0].level=getPetLevelCapV210(player.pets[0]);player.pets[0].vitality=60;showPets();petFeedOpenId=player.pets[0]._petId;updatePetPanel();`);
function foodButton(name){return [...f.c.document.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('feedPetById')&&(b.getAttribute('onclick')||'').includes(name))}
a.ok(foodButton('灵果'));a.equal(foodButton('灵果').getAttribute('disabled'),null);a.notEqual(foodButton('灵兽丹').getAttribute('disabled'),null);
const cap=f.run('player.pets[0].level');f.run("feedPet(0,'灵果')");a.equal(f.run('player.pets[0].vitality'),100);a.equal(f.run('player.pets[0].level'),cap);a.equal(f.run("player.petMaterials['灵果']"),1);
f.run("player.pets[0].cultivationLockUntilDay=petGameDayV210()+2;feedPet(0,'灵果');updatePetPanel()");a.equal(f.run("player.petMaterials['灵果']"),1);a.notEqual(foodButton('灵果').getAttribute('disabled'),null);
console.log('PASS capped pet fruit remains usable, consumes once, restores vitality, lock preserved');
f.run('player.romance.npcs[MAIN_HEROINE_ID].affection=60;doRomanceChat(MAIN_HEROINE_ID);doRomanceChat(MAIN_HEROINE_ID)');a.equal(f.run('player.romance.npcs[MAIN_HEROINE_ID].affection'),60);
f.run('addAffection(MAIN_HEROINE_ID,-3)');a.equal(f.run('player.romance.npcs[MAIN_HEROINE_ID].affection'),57);
f.run('player.romance.npcs[MAIN_HEROINE_ID].affection=0;addAffection(MAIN_HEROINE_ID,2)');a.equal(f.run('player.romance.npcs[MAIN_HEROINE_ID].affection'),2);
console.log('PASS repeated chat preserves above-cap affection; normal gains/penalties remain');
f.run('closeWorldOverlay();player.level=4;travelToWorldMap("north");closeWorldOverlay();updateWorldMonsters=()=>{};');
const goals=f.run('FLAT_WORLD.pois.filter(p=>p.action!=="explore_v2828").map(p=>p.id)');
for(const id of goals){f.c.testGoal=id;f.run('FLAT_WORLD.player.x=520;FLAT_WORLD.player.y=1060;startNavigationV2830(testGoal)');a.ok(f.run('autoNavigationV2830')||f.run('(()=>{const g=FLAT_WORLD.pois.find(p=>p.id===testGoal);return Math.hypot(g.x-520,g.y-1060)<g.r+55})()'),id);f.run('for(let i=0;i<4000&&autoNavigationV2830;i++)updateFlatWorld(.016)');a.equal(f.run('autoNavigationV2830'),null,id);a.ok(f.run('(()=>{const g=FLAT_WORLD.pois.find(p=>p.id===testGoal);return Math.hypot(g.x-FLAT_WORLD.player.x,g.y-FLAT_WORLD.player.y)<g.r+62})()'),id+' arrived');}
f.run('FLAT_WORLD.player.x=520;FLAT_WORLD.player.y=1060;startPointNavigationV28685({x:1000,y:1100,r:0})');a.ok(f.run('autoNavigationV2830'));f.run('FLAT_WORLD.keys={w:true};tickNavigationV2830(.016)');a.equal(f.run('autoNavigationV2830'),null);
console.log('PASS north POI routes physically arrive, anonymous route starts, manual input cancels');
f.run('FLAT_WORLD.keys={};tutorialState.currentStepId="interaction";player.tutorial.completedSteps=[];FLAT_WORLD.nearby=null;interactFlatWorld()');a.equal(f.run('isTutorialStepCompleted("interaction")'),false);
f.run('FLAT_WORLD.nearby=FLAT_WORLD.pois[0];FLAT_WORLD.player.x=FLAT_WORLD.nearby.x;FLAT_WORLD.player.y=FLAT_WORLD.nearby.y;interactFlatWorld()');a.equal(f.run('isTutorialStepCompleted("interaction")'),true);
console.log('PASS desktop interaction advances tutorial only near a valid current-map POI');
// V28.68.6: restore identity before any panel opens or battle growth occurs.
f.run(`globalThis.petSaveCheck=(()=>{const pet={type:'灵狐',name:'测试灵狐',level:2,exp:1,_petId:'pet_saved'};return JSON.parse(JSON.stringify({pets:[pet],activePet:pet}))})();`);
f.run('globalThis.restoredPetCheck=normalizePlayer(petSaveCheck)');a.equal(f.run('restoredPetCheck.activePet===restoredPetCheck.pets[0]'),true);
f.run('restoredPetCheck.activePet.vitality=71');a.equal(f.run('restoredPetCheck.pets[0].vitality'),71);
a.equal(f.run('player===restoredPetCheck'),false);
f.run('delete petSaveCheck.activePet._petId;delete petSaveCheck.pets[0]._petId;restoredPetCheck=normalizePlayer(petSaveCheck)');a.equal(f.run('restoredPetCheck.activePet===restoredPetCheck.pets[0]'),true);
f.run('petSaveCheck.activePet._petId="pet_missing";restoredPetCheck=normalizePlayer(petSaveCheck)');a.equal(f.run('restoredPetCheck.activePet'),null);
f.run('delete petSaveCheck.activePet._petId;petSaveCheck.pets.push({...petSaveCheck.pets[0]});restoredPetCheck=normalizePlayer(petSaveCheck)');a.equal(f.run('restoredPetCheck.activePet'),null);
console.log('PASS load-time pet identity, shared growth, unique legacy match, missing/ambiguous pet not rebound');
for(const event of ['blur','pagehide','visibilitychange','mode']){
 f.run('FLAT_WORLD.player.x=520;FLAT_WORLD.player.y=1060;startPointNavigationV28685({x:1000,y:1100,r:0});FLAT_WORLD.keys={arrowup:true,w:true};FLAT_WORLD.moving=true;FLAT_WORLD.moveDirX=1');
 if(event==='mode')f.run('toggleControlMoveMode()');else {if(event==='visibilitychange')f.c.document.hidden=true;for(const cb of f.events[event]||[])cb({});f.c.document.hidden=false;}
 a.equal(f.run('Object.values(FLAT_WORLD.keys).some(Boolean)'),false,event);a.equal(f.run('FLAT_WORLD.target'),null,event);a.equal(f.run('autoNavigationV2830'),null,event);a.equal(f.run('FLAT_WORLD.moving'),false,event);
}
console.log('PASS blur/pagehide/hidden/mode clear all keys, target, navigation and movement');
