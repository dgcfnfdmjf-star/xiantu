const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root),requests=[],images=[];
const Base=f.c.Image;
f.c.Image=class extends Base{constructor(){super();images.push(this)}set src(v){requests.push(v);super.src=v}get src(){return super.src}};
for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);
const battleRequests=()=>requests.filter(v=>/duel-ink-poses|scroll-landscape-v2831/.test(v));
a.equal(battleRequests().length,0,'loading all modules must not fetch the battle shell');
f.run("XiantuDuel25D.create(null,()=>({}));XiantuDuel25D.create(document.body,()=>({}),'unsupported')");
a.equal(battleRequests().length,0,'invalid hosts/species do not fetch art');
f.run("var lazyHost=document.createElement('div');document.body.appendChild(lazyHost);var lazyState={active:true,playerHp:100,playerMax:100,enemyHp:100,enemyMax:100};var lazyScene=XiantuDuel25D.create(lazyHost,()=>lazyState)");
a.equal(battleRequests().length,2,'first valid scene requests the action atlas and backdrop');
const state=f.run('JSON.stringify(lazyState)');f.run('lazyScene.destroy()');
for(const im of images.filter(i=>/duel-ink-poses|scroll-landscape-v2831/.test(i.src||''))){im.naturalWidth=1536;im.naturalHeight=1024;im.onload();}
a.equal(f.run("lazyHost.classList.contains('duel25-active')"),false,'late asset load cannot revive a closed scene');
a.equal(f.run('JSON.stringify(lazyState)'),state);
f.run('lazyScene=XiantuDuel25D.create(lazyHost,()=>lazyState);lazyScene.destroy()');
a.equal(battleRequests().length,2,'reopening reuses both images without a new request');
console.log('PASS no boot battle art, demand loading, invalid target, late completion and bounded reuse');
