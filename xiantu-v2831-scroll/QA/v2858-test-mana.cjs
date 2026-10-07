const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('node:path').join(process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..'),'xiantu-v2762-core.js'),'utf8');
const fn=source.match(/function getMaxMp\(\)\{[^\n]+\}/)[0];
const c={player:{maxMp:50,mp:23,level:0,phase:0},equip:0,pct:0};c.getEquipMp=()=>c.equip;c.gearModsV2790=()=>({mpPct:c.pct});vm.createContext(c);vm.runInContext(fn,c);
assert.equal(c.getMaxMp(),100);
for(let l=0;l<17;l++)for(let p=0;p<4;p++){
 c.player.level=l;c.player.phase=p;
 for(const e of [0,25,200])for(const pct of [0,.25]){
  c.equip=e;c.pct=pct;const snapshot=JSON.stringify(c.player);
  assert.equal(c.getMaxMp(),Math.floor(((50+l*12+p*4)*2+e)*(1+pct)));
  for(let n=0;n<10;n++)c.getMaxMp();assert.equal(JSON.stringify(c.player),snapshot);
 }
}
assert.match(source,/maxMp: 50,[^\n]*\n        mp: 100,/);
console.log('PASS mana capacity across 17 realms / four phases, equipment additions, repeated read without save mutation, starter mana100');
