'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),images=[];
f.c.console.log=()=>{};const Base=f.c.Image;f.c.Image=class extends Base{constructor(){super();images.push(this);}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const art=images.find(i=>(i.src||'').includes('duel-ink-poses'));art.naturalWidth=1536;art.naturalHeight=1024;art.onload();
let now=1000,seq=0;const raf=new Map();f.c.performance.now=()=>now;f.c.requestAnimationFrame=cb=>{raf.set(++seq,cb);return seq};f.c.cancelAnimationFrame=id=>raf.delete(id);
const run=s=>f.run(s);function tick(dt){now+=dt;const jobs=[...raf.values()];raf.clear();for(const cb of jobs)cb(now);}
run("var toolHost=document.createElement('div');document.body.appendChild(toolHost);var toolState={active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100};var toolScene=null;localStorage.setItem('xiantu_battle_speed_v2756','2')");
const ctx=run('document.createElement("canvas").getContext("2d")'),texts=[],ages=[];ctx.fillText=t=>texts.push(t);
const fx=f.c.InkSkillFxV2854.draw;f.c.InkSkillFxV2854.draw=(c,j,age)=>{ages.push(age);};
const snapshot=run('JSON.stringify(player)'),clock=run('battleLaterV2838.toString()'),durations=[];
function make(speed){f.c.__speed=speed;run("toolScene?.destroy();localStorage.setItem('xiantu_duel_speed_v2892',String(__speed));toolScene=XiantuDuel25D.create(toolHost,()=>toolState)");tick(100);}
for(const speed of [1,2,3]){
 make(speed);run("toolScene.act('player','fire','倍速测试')");const begin=now;let last=0;
 while(now-begin<800){texts.length=0;tick(34);if(texts.includes('倍速测试'))last=now-begin;else if(last)break;}
 durations.push(now-begin);a.equal(raf.size,1,'one RAF');a.equal(run('JSON.stringify(player)'),snapshot,'rendering cannot mutate player');
}
a(durations[0]>durations[1]*1.7&&durations[1]>durations[2]*1.3,JSON.stringify(durations));
a.equal(run("localStorage.getItem('xiantu_battle_speed_v2756')"),'2','auto cadence preference untouched');a.equal(run('battleLaterV2838.toString()'),clock);
// 150ms engine enhancement still enriches one action at 3x; no second cast or lost counterattack.
make(3);run("toolScene.act('player','sword','第一招')");tick(150);run("toolScene.act('player','fire','增强招',true);toolScene.act('enemy','sword','敌方招')");texts.length=0;tick(70);a(texts.includes('敌方招'));a(!texts.includes('增强招'));
const stage=()=>run("toolHost.querySelector('.duel25-stage')"),buttons=()=>run("toolHost.querySelector('.duel-tools-v2892')").querySelectorAll('button');
make(1);buttons()[0].onclick();a.equal(buttons()[0].textContent,'画面 2×');a.equal(run("localStorage.getItem('xiantu_duel_speed_v2892')"),'2');
// Storage denial retains a usable in-memory setting; same-page frames do not poll storage.
const set=f.c.localStorage.setItem;f.c.localStorage.setItem=()=>{throw Error('denied')};buttons()[0].onclick();a.equal(buttons()[0].textContent,'画面 3×');f.c.localStorage.setItem=set;
// Export merges both layers, handles async errors/null, rejects callbacks after disposal and revokes URLs.
let callback,clicks=0;const layers=[],revoked=[];ctx.drawImage=im=>layers.push(im.className);f.El.prototype.toBlob=function(cb){callback=cb;};const click=f.El.prototype.click;f.El.prototype.click=function(){if(this.tagName==='A')clicks++;return click.call(this);};f.c.URL={createObjectURL:()=> 'blob:probe',revokeObjectURL:u=>revoked.push(u)};
buttons()[1].onclick();a.deepEqual(layers.slice(-2),['duel25-backdrop','duel25-canvas']);buttons()[1].onclick();a.equal(clicks,0,'one export in flight');callback({size:20});a.equal(clicks,1);a.equal(buttons()[1].disabled,false);
buttons()[1].onclick();callback(null);a.equal(clicks,1);a.equal(buttons()[1].disabled,false);
buttons()[1].onclick();f.c.URL.createObjectURL=()=>{throw Error('download denied')};a.doesNotThrow(()=>callback({size:20}));a.equal(buttons()[1].disabled,false);
f.c.URL.createObjectURL=()=> 'blob:probe';buttons()[1].onclick();run('toolScene.destroy()');callback({size:20});a.equal(clicks,1);a(revoked.includes('blob:probe'));a.equal(raf.size,0);a.equal(run('toolHost.children.length'),0);
delete f.El.prototype.toBlob;f.El.prototype.toDataURL=()=>{throw Error('tainted')};make(1);a.doesNotThrow(()=>buttons()[1].onclick());a.equal(buttons()[1].disabled,false);delete f.El.prototype.toDataURL;f.El.prototype.click=click;
// Pause/resume and replacement have one loop; preference is clamped and toolbar is instance-owned.
make(99);a.equal(buttons()[0].textContent,'画面 1×');const oldButton=buttons()[0];make(1);oldButton.onclick();a.equal(buttons()[0].textContent,'画面 1×');
f.c.document.hidden=true;for(const cb of f.events.visibilitychange||[])cb();a.equal(raf.size,0);f.c.document.hidden=false;for(const cb of f.events.visibilitychange||[])cb();a.equal(raf.size,1);run('toolScene.destroy()');a.equal(raf.size,0);
f.c.InkSkillFxV2854.draw=fx;
console.log('PASS real duel render durations '+durations.join('/')+'ms at 1/2/3x; skill enrichment, engine-state/cadence isolation, single RAF, export layering/errors/disposal and storage denial');
