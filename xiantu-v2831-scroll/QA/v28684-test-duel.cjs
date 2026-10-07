const fs=require('fs'),path=require('path'),a=require('assert/strict');const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');const f=require('./v2858-dom-fixture.cjs')(root);
const images=[];const BaseImage=f.c.Image;f.c.Image=class extends BaseImage{constructor(){super();images.push(this)}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const ink=images.find(i=>(i.src||'').includes('duel-ink-poses'));a.ok(ink);ink.naturalWidth=1536;ink.naturalHeight=1024;ink.onload();
let seq=0;const pending=new Map();f.c.requestAnimationFrame=cb=>{pending.set(++seq,cb);return seq};f.c.cancelAnimationFrame=id=>pending.delete(id);
f.run("var probeHost=document.createElement('div');document.body.appendChild(probeHost);var probeState={active:true,playerHp:100,playerMax:100,enemyHp:200,enemyMax:200};var probeScene=XiantuDuel25D.create(probeHost,()=>probeState)");
const before=f.run('JSON.stringify(probeState)');
function tick(t){const jobs=[...pending.values()];pending.clear();for(const cb of jobs)cb(t);}
for(let t=1100;t<3000;t+=34)tick(t);
f.run("probeScene.act('player');probeScene.hit('enemy',23);probeScene.act('enemy');probeScene.hit('player',12)");tick(3100);a.equal(f.run('JSON.stringify(probeState)'),before);a.equal(pending.size,1);
f.c.document.hidden=true;for(const cb of f.events.visibilitychange||[])cb();a.equal(pending.size,0);
f.c.performance.now=()=>3100;f.c.document.hidden=false;for(const cb of f.events.visibilitychange||[])cb();a.equal(pending.size,1);
// Observe only rendered output: queued turns must not overwrite the first action,
// and a skill enhancement must not create a second cast. Reset drops old visuals.
const painted=[],positions=[];const context=f.run('probeScene.canvas.getContext("2d")');
context.fillText=(text)=>painted.push(text);context.translate=(x,y)=>positions.push([x,y]);
f.run('probeScene.reset();probeScene.act("player","heal","回春测试");probeScene.hit("player",8,true)');
painted.length=positions.length=0;tick(3200);
a(painted.includes('回春测试'));a(positions.some(([x,y])=>x===242&&y===305),'healer must stay at home position without recoil');
f.run('probeScene.reset();probeScene.act("player","sword","第一招");probeScene.act("player","thunder","雷法测试",true);probeScene.act("enemy","sword","第二招")');
painted.length=0;tick(3250);a(painted.includes('雷法测试'));a(!painted.includes('第二招'));
for(let t=3300;t<=3850;t+=50)tick(t);
painted.length=0;tick(3900);a(painted.includes('第二招'),'queued counterattack follows the first action');
f.run('probeScene.hit("enemy",25,false,true);probeScene.hit("enemy",6,false,false,true)');
painted.length=0;tick(3950);a(painted.includes('暴击 −25'));a(painted.includes('灵宠 −6'));
f.run('probeScene.reset()');painted.length=0;tick(4000);a(!painted.includes('第二招'));a(!painted.includes('暴击 −25'));
console.log('PASS stationary healing, skill enrichment, ordered counterattack, critical/pet feedback and clean reset');
// The duel reuses named skill profiles on its own Canvas/RAF, while preserving state.
const fxDraw=f.c.InkSkillFxV2854.draw,fxSettings=f.c.InkSkillFxV2854.settings,fxJobs=[];
f.c.InkSkillFxV2854.draw=(ctx,job,age)=>{fxJobs.push({...job,age});fxDraw(ctx,job,age)};
let fxTime=4100;
for(const [name,element,kind] of [['万剑归宗','sword','rain'],['九天神雷','thunder','storm'],['玄冰刺','ice','icicle'],['天火焚世','fire','meteor'],['青莲护心','heal','lotus']]){
 f.run(`probeScene.reset();probeScene.act('player','${element}','${name}');probeScene.hit('${element==='heal'?'player':'enemy'}',17,${element==='heal'});`);
 fxJobs.length=0;tick(fxTime+=50);
 a.equal(fxJobs.at(-1).profile.kind,kind);a.equal(fxJobs.at(-1).profile.self,element==='heal');
 a.equal(fxJobs.at(-1).arriveAt,element==='heal'?155:310);
 a.equal(fxJobs.at(-1).fromGround.y,305);a.equal(fxJobs.at(-1).toGround.y,element==='heal'?305:278);
 a.equal(fxJobs.at(-1).groundDrawn,true,'floor layer is painted separately before actors');
 for(let i=0;i<7;i++)tick(fxTime+=50);
 a(fxJobs.some(j=>j.hitAt!==null&&j.age>=j.hitAt),'impact is acknowledged at contact');
 a.equal(pending.size,1,'no extra animation loop');a.equal(f.run('JSON.stringify(probeState)'),before);
}
f.c.InkSkillFxV2854.settings=()=>({reduced:true,light:true});tick(fxTime+=50);
a.equal(fxJobs.at(-1).reduced,true);a.equal(fxJobs.at(-1).light,true);
f.c.InkSkillFxV2854.settings=fxSettings;f.c.InkSkillFxV2854.draw=fxDraw;
console.log('PASS five named skill families, contact-bound impact, reduced motion, single RAF and read-only state');
// Death consumes only presentation time and never rotates the painted actor.
f.run('probeScene.reset();probeState.enemyHp=0');
const rotations=[];context.rotate=angle=>rotations.push(angle);
const deadState=f.run('JSON.stringify(probeState)');
for(let i=0;i<12;i++)tick(fxTime+=50);
a.equal(rotations.length,0,'death stays upright');a.equal(f.run('JSON.stringify(probeState)'),deadState);a.equal(pending.size,1);
f.run('probeScene.reset();probeState.enemyHp=200');tick(fxTime+=50);
console.log('PASS upright death dissolve, reset, single RAF and no combat mutation');
f.run('probeScene.destroy();probeScene.destroy()');a.equal(pending.size,0);a.equal(f.run('probeHost.children.length'),0);
f.run('startGame();closeWorldOverlay();setBattlePresentationV2756("report");startCombat({...ENEMIES[0]});');tick(fxTime+100);a(f.ids.get('combatArena').classList.contains('duel25-active'));a.equal(f.c.document.querySelectorAll('.duel25-canvas').length,1);
f.run('resetRuntimeState();');a(!f.ids.get('combatArena').classList.contains('duel25-active'));a(!f.ids.get('combatPanel').classList.contains('duel25-panel'));
const roster=JSON.parse(f.run('JSON.stringify(XiantuDuel25D.roster)'));a.equal(roster.length,23);
const catalog=JSON.parse(f.run('JSON.stringify([...ENEMIES,...Object.values(LOCATION_ENEMIES).flat(),...Object.values(LOCATION_BOSSES)].map(e=>e.name))'));
for(const name of catalog)a(roster.some(p=>p.key===f.run(`scrollMonsterKeyV2853(${JSON.stringify(name)})`)),name+' must have a battle profile');
let time=fxTime+200;const drawn=[];context.drawImage=image=>drawn.push(image?.src||'');
for(const profile of roster){
 for(const elite of [false,true]){
  const name=(elite?'【精英】·':'')+profile.name;
  a.equal(f.run(`scrollMonsterKeyV2853(${JSON.stringify(name)})`),profile.key);
  f.run(`resetRuntimeState();startCombat({...ENEMIES[0],name:${JSON.stringify(name)}});`);
  for(const im of images.filter(i=>/duel-(beasts|wings|fighters|bosses)-/.test(i.src||''))){im.naturalWidth=1024;im.naturalHeight=1536;im.onload();}
  drawn.length=0;tick(time+=100);
  a(f.ids.get('combatArena').classList.contains('duel25-active'),name);
  a.equal(f.c.document.querySelectorAll('.duel25-canvas').length,1,name);
  a(drawn.some(src=>src.includes(profile.key==='wolf'?'duel-ink-poses':'v286811.png')),name+' uses action atlas');
  const saved=f.run('JSON.stringify(player)');f.run('playAttackAnimation("enemy");showDamageNumber(5,"player");');
  for(let i=0;i<5;i++)tick(time+=50);
  a.equal(f.run('JSON.stringify(player)'),saved,name+' animation must not settle damage');
 }
}
a.equal(images.filter(i=>/duel-(beasts|wings|fighters|bosses)-/.test(i.src||'')).length,4,'share four lazy-loaded atlases across all encounters');
f.run('resetRuntimeState();startCombat({...ENEMIES[0],name:"未知访客"});');tick(time+=100);a.equal(f.c.document.querySelectorAll('.duel25-canvas').length,0);
f.run('resetRuntimeState();startCombat({...ENEMIES[0],name:"血魔老祖"});');
images.find(i=>(i.src||'').includes('duel-bosses-')).onerror();tick(time+=100);a(!f.ids.get('combatArena').classList.contains('duel25-active'));
console.log('PASS 23 species and 23 elite variants, read-only attacks, lazy atlas reuse, unsupported names and enemy asset failure fallback');
f.run('resetRuntimeState();startCombat({...ENEMIES[0]});currentEnemy=null;gameState="exploring";');tick(time+=100);a.equal(f.c.document.querySelectorAll('.duel25-canvas').length,0);
// Static scenery has its own layer; idle draws halve while attack cadence remains 30fps.
f.c.performance.now=()=>20000;
f.run("var idleHost=document.createElement('div');document.body.appendChild(idleHost);var idleScene=XiantuDuel25D.create(idleHost,()=>({active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100}))");
let draws=0;f.run('idleScene.canvas.getContext("2d")').clearRect=()=>draws++;
for(let t=20034;t<=20680;t+=34)tick(t);
a.equal(draws,10);a.equal(f.run('idleHost.querySelectorAll(".duel25-backdrop").length'),1);
draws=0;f.run('idleScene.act("player","sword")');for(let t=20714;t<=21020;t+=34)tick(t);a.equal(draws,10);
f.run('idleScene.destroy()');a.equal(f.run('idleHost.children.length'),0);
console.log('PASS separate static layer, 15fps idle / 30fps active and complete scene disposal');

f.run('startCombat({...ENEMIES[0]});');ink.onerror();tick(time+=100);a(!f.ids.get('combatArena').classList.contains('duel25-active'));a.equal(f.c.document.querySelectorAll('.duel25-canvas').length,0);
console.log('PASS failed illustrated asset falls back without hiding original battle');

