'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/map-wrappers.cjs');
function fixture(t,sources){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'xiantu-wrappers-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const [name,source] of Object.entries(sources)){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),source);}
 const html=path.join(root,'game.html');fs.writeFileSync(html,`<!-- "ghost.js" --><script>const irrelevant="not-loaded.js";</script><script id="xiantu-v2762-loader">var files=${JSON.stringify(Object.keys(sources))};</script>`);
 const invoke=(args=[])=>spawnSync(process.execPath,[script,'--html',html,'--expect',String(Object.keys(sources).length),...args],{encoding:'utf8'});
 const scan=()=>{const dest=path.join(root,'reports','audit.json'),r=invoke(['--all','--json',dest]);assert.equal(r.status,0,r.stderr);return JSON.parse(fs.readFileSync(dest,'utf8'));};
 return {root,html,invoke,scan};
}
test('loader manifest is authoritative; aliases do not turn data into functions',t=>{
 const f=fixture(t,{'a.js':'function update() {}\nconst savedHp=player.hp; player.hp=100;','b.js':'const old=window.update;\nwindow.update=function(){old?.();};'}),data=f.scan();
 assert(!data['player.hp']);assert.equal(data.update.length,2);assert.equal(data.update[1].kind,'wrap');assert.equal(data.update[1].line,2);
 const list=f.invoke(['--list-only']);assert.equal(list.status,0);assert.equal(list.stdout.trim(),'01  a.js\n02  b.js');
});
test('lexical alias scope, reassignments and shadowed global roots',t=>{
 const f=fixture(t,{'a.js':`function f() {}
(function(){const old=window.f;window.f=function(){old()};})();
(function(){window.f=function(){};})();
function local(window){window.f=function(){};}
const raw=window.f;
{const raw=()=>{};window.f=function(){raw()};}
`}),events=f.scan().f;
 assert.deepEqual(events.map(e=>e.kind),['define','wrap','overwrite','overwrite']);
 // The shadowed raw is not evidence of delegation to the old global function.
 assert.equal(events.at(-1).line,6);
 const g=fixture(t,{'a.js':'function f(){};let old=window.f;old=()=>{};window.f=function(){old()};'});
 assert.equal(g.scan().f.at(-1).kind,'overwrite');
});
test('comments, strings and regex do not add fake definitions; source lines survive',t=>{
 const f=fixture(t,{'a.js':'// function fake1() {}\nconst a="window.fake2=function(){}";\nconst b=/function fake3\\(\\)/;\nconst c=`function fake4() {}\nmore`;\nfunction real(){}\nwindow.real=()=>42;'}),data=f.scan();
 assert.deepEqual(Object.keys(data),['real']);assert.deepEqual(data.real.map(e=>e.line),[6,7]);
});
test('explicit order preserves paths and handles same basenames independently',t=>{
 const f=fixture(t,{'one/a.js':'function f() {}','two/a.js':'window.f=()=>1;'}),order=path.join(f.root,'order.txt');fs.writeFileSync(order,'# order\none/a.js\ntwo/a.js\n');
 const dest=path.join(f.root,'out.json'),r=f.invoke(['--order',order,'--json',dest]);assert.equal(r.status,0,r.stderr);
 assert.deepEqual(JSON.parse(fs.readFileSync(dest)).f.map(e=>e.file),['one/a.js','two/a.js']);
 assert.notEqual(f.invoke(['--order',order,'--json',order]).status,0);
});
test('invalid CLI/count/missing files fail without successful partial reports',t=>{
 const f=fixture(t,{'a.js':'function f() {}'});
 for(const args of [['--wat'],['--json'],['--expect','NaN'],['--expect','-1'],['--expect','2'],['--json',f.html]])assert.notEqual(f.invoke(args).status,0,args.join(' '));
 assert.equal(f.invoke(['--expect','0']).status,0);
 fs.unlinkSync(path.join(f.root,'a.js'));const output=path.join(f.root,'out.json');assert.notEqual(f.invoke(['--json',output]).status,0);assert(!fs.existsSync(output));
});
test('fallback static script tags ignore comments and remote scripts; duplicates fail',t=>{
 const f=fixture(t,{'a.js':'function f() {}'});fs.writeFileSync(f.html,'<!-- <script src="bad.js"></script> --><script src="https://example.test/x.js"></script><script src="a.js?v=1"></script>');assert.equal(f.invoke().status,0);
 fs.appendFileSync(f.html,'<script src="a.js?v=2"></script>');assert.match(f.invoke(['--expect','0']).stderr,/Duplicate/);
});
