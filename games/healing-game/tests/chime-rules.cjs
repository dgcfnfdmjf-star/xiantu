const assert = require('node:assert/strict');
require('../src/chime-rules.js');
const R=globalThis.ChimeRules;
let checks=0;
function check(name,run){run();checks++;console.log('PASS '+name)}
check('invalid saves start safely and whitelist collectibles',()=>{
 for(const raw of [null,{},[],{round:99,step:99},{round:-1,step:NaN},{round:'3',step:'1'}])assert.equal(R.normalize(raw).round,0);
 assert.deepEqual(R.normalize({found:['sprout','sprout','__proto__','<script>']}),{round:0,step:0,found:['sprout']});
});
check('correct partial melody survives serialization',()=>{
 let s=R.normalize();R.press(s,0);R.press(s,2);s=R.normalize(JSON.parse(JSON.stringify(s)));
 assert.equal(s.round,0);assert.equal(s.step,2);assert.deepEqual(s.found,['sprout','feather']);
 assert.equal(R.press(s,4).roundComplete,true);assert.equal(s.round,1);
});
check('wrong note only resets current phrase, retaining collection',()=>{
 const s=R.normalize();[0,2,4,1].forEach(i=>R.press(s,i));const found=s.found.slice();
 assert.equal(R.press(s,0).correct,false);assert.equal(s.round,1);assert.equal(s.step,0);assert.deepEqual(s.found,found);
});
check('three melodies collect all six tones and complete once',()=>{
 const s=R.normalize();let completions=0;
 for(const song of R.songs)for(const i of song.notes){if(R.press(s,i).finished)completions++}
 assert.equal(completions,1);assert.equal(s.round,3);assert.equal(s.found.length,6);
 const old=JSON.stringify(s);for(let i=0;i<30;i++)assert.equal(R.press(s,i%6).changed,false);
 assert.equal(JSON.stringify(s),old);
});
check('completed and in-progress saves recover their proven collectibles',()=>{
 const s=R.normalize({round:1,step:2});assert.equal(s.found.length,5);
 assert.equal(R.normalize({round:3,step:0,found:[]}).found.length,6);
 assert.equal(R.normalize({round:2,step:4}).step,0);
});
check('invalid inputs never award or reset progress',()=>{
 const s=R.normalize({round:1,step:1}),before=JSON.stringify(s);
 for(const i of [-1,6,.5,null,undefined,'1',NaN,Infinity])assert.equal(R.press(s,i).changed,false);
 assert.equal(JSON.stringify(s),before);
});
console.log(checks+' progression checks passed');
