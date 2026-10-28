'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
const html=fs.readFileSync(root+'/game-v2762.html','utf8'),files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
a.equal(files.length,40);
for(const file of files)f.load(file);
f.run("player=createDefaultPlayer();player.name='验收';player.daoName='青云';gameState='exploring';updateCharacterPanelDeep=()=>{}");
const base=f.run('JSON.stringify(createSaveDataV2768())');
for(const text of ['x/onpointerenter=alert(1)','"/onmouseover=alert(1)',"'/onfocus=alert(1)",'<script>x</script>','x\tonclick=1','javascript :alert(1)','&#34;']){
 const d=JSON.parse(base);d.player.testNote=text;
 a.throws(()=>f.run(`parseSaveV2768(${JSON.stringify(JSON.stringify(d))})`),undefined,text);
}
for(const text of ['phone=1 iron=2','普通纪事',`He said "hello"; O'Reilly`,String.raw`C:\notes\text`]){
 const d=JSON.parse(base);d.player.testNote=text;
 a.equal(f.run(`parseSaveV2768(${JSON.stringify(JSON.stringify(d))}).player.testNote`),text,'valid free text is preserved');
}
const input=f.c.document.getElementById('panelDaoInput');
let saves=0;f.c.saveGame=()=>{saves++;return true;};
for(const text of ["O'Reilly",'x"y','<青云>','青`云','青\\云','青云长天万里无尽<']){
 input.value=text;a.equal(f.run('setDaoNameFromPanel()'),false);a.equal(f.run('player.daoName'),'青云');a.equal(input.value,text);
}
a.equal(saves,0,'invalid names do not attempt saving');
input.value='  太虚散人  ';a.equal(f.run('setDaoNameFromPanel()'),true);a.equal(f.run('player.daoName'),'太虚散人');a.equal(input.value,'');
f.c.saveGame=()=>false;input.value='无尘';a.equal(f.run('setDaoNameFromPanel()'),false);a.equal(f.run('player.daoName'),'太虚散人');a.equal(input.value,'无尘');
f.c.saveGame=()=>true;input.value='';a.equal(f.run('setDaoNameFromPanel()'),true);a.equal(f.run('player.daoName'),'');
input.value='𠮷一二三四五六七八';a.equal(f.run('setDaoNameFromPanel()'),true);a.equal(f.run('player.daoName'),'𠮷一二三四五六七');
const endpoint=fs.readFileSync(root+'/xiantu-v2842-jev-forge.js','utf8').match(/endpoint: '([^']+)'/)[1],origin=new URL(endpoint).origin;
for(const name of ['game-v2762.html','game.html','index.html','health-v2762.html','jev-check.html']){
 const s=fs.readFileSync(root+'/'+name,'utf8');const policy=s.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
 a(!policy.includes('unsafe-eval'));a(policy.includes("object-src 'none'"));a(policy.includes("base-uri 'none'"));a(policy.includes(origin));
 a(!policy.includes('frame-ancestors'),'response-only directives do not belong in meta');
 a(s.indexOf('Content-Security-Policy')<s.indexOf('<script')||!s.includes('<script'));
}
console.log('PASS security: slash-event rejection, free-text preservation, rename validation/rollback/Unicode, 40-script CSP compatibility');
