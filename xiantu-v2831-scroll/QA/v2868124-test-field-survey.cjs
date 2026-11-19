'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
const fixture=require('./v2858-dom-fixture.cjs')(root);
fixture.c.console.log=()=>{};
const files=JSON.parse(fs.readFileSync(path.join(root,'game-v2762.html'),'utf8').match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files)fixture.load(file);
const run=code=>fixture.run(code);
const survey=()=>fixture.ids.get('fieldSurveyV2868124');
const action=id=>survey().querySelector('[data-survey="'+id+'"]');
const step=()=>run('surveyStepV2868124()');
const scrolls=()=>run("player.inventory.filter(item=>item==='神行符').length");
const visit=id=>{
  fixture.c.site=id;
  run('clearInteriorV286886();closeWorldOverlay();{const here=FLAT_WORLD.pois.find(p=>p.id===site);FLAT_WORLD.player.x=here.x;FLAT_WORLD.player.y=here.y;FLAT_WORLD.nearby=here;interactFlatWorld();}');
};

run("player=createDefaultPlayer();player.level=10;player.tutorial.skipped=true;gameState='exploring'");
const regions=run('Object.keys(WORLD_MAP_CONFIGS)');
for(const [index,region] of regions.entries()){
  fixture.c.region=region;
  run('applyWorldMapLayout(region,true);for(const p of FLAT_WORLD.pois.filter(p=>p.action==="explore_v2828"))explorationV2828().claimed[p.id]="take";showExplorationJournalV2829()');
  const route=run('FIELD_SURVEYS_V2868124[region]');
  assert.equal(step(),0);
  const before=scrolls(),claimed=run('JSON.stringify(explorationV2828().claimed)');
  action('accept').click();
  assert.equal(step(),1);
  assert.equal(run('markedExplorationV2829().id'),route.stops[0]);
  visit(route.stops[1]);
  assert.equal(step(),1);
  assert(!survey()?.querySelector('[data-survey="record"]'));
  visit(route.stops[0]);
  const record=action('record');
  run('FLAT_WORLD.player.x=-1000');record.click();
  assert.equal(step(),1,'record requires reach');
  visit(route.stops[0]);
  record.click();assert.equal(step(),1,'closed survey panel cannot advance');
  action('record').click();
  assert.equal(step(),2);
  assert.equal(run('markedExplorationV2829().id'),route.stops[1]);
  if(index===0){
    run('loadAndStart()');
    assert.equal(step(),2,'actual game reload restores the first station');
    run("showExplorationJournalV2829()");
    assert(run('document.getElementById("storyText").innerHTML').includes(route.trace));
  }
  visit(route.stops[1]);
  action(1-route.answer).click();assert.equal(step(),2);assert.equal(scrolls(),before);
  const submit=action(route.answer);
  if(index===0){
    run('globalThis.originalBag=player.inventory;player.inventory=Array(100000).fill("灵石袋")');submit.click();
    assert.match(survey().querySelector('[data-survey-notice]').textContent,/行囊已满/);
    assert.equal(step(),2);run('player.inventory=originalBag');
    run('currentRegion="east"');submit.click();
    run('currentRegion="south";gameState="combat"');submit.click();
    run('gameState="exploring";globalThis.surveyOwner=player;player={...player}');submit.click();
    run('player=surveyOwner;globalThis.originalSave=saveGame;saveGame=()=>false');submit.click();
    assert.equal(step(),2);assert.equal(scrolls(),before);
    assert.equal(run('markedExplorationV2829().id'),route.stops[1],'storage failure restores map mark');
    run('saveGame=originalSave');
  }
  submit.click();submit.click();
  assert.equal(step(),3);
  assert.equal(scrolls(),before+1);
  assert.equal(run('JSON.stringify(explorationV2828().claimed)'),claimed);
  assert(!action('accept'));
}
run('loadAndStart()');assert.equal(step(),3);
assert.equal(run('Object.values(player.explorationV2828.maps).filter(m=>m.surveyStepV2868124===3).length'),regions.length);
console.log('PASS field surveys: eight two-stop routes, original map interactions and claims, matching evidence, reload, stale/wrong-site/combat guards and atomic single payment');
