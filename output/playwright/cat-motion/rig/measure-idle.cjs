const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const window = {};
vm.runInNewContext(fs.readFileSync('games/healing-game/src/cat-pose.js', 'utf8'), {window});
function series(field, phase) {
  const s = [];
  for(let f=0;f<90*120;f++) s.push(window.GardenCatPose.sample(f/120,phase)[field]);
  return s;
}
function events(samples) {
  const event=[];
  samples.forEach((v,i) => {if (v>.03 && !(samples[i-1]>.03)) event.push(i/120)});
  return event;
}
const report = [0,.81,1.97,3.6,4.7,5.5,6.1].map(phase=>{
  const yaw=series('yaw',phase), roll=series('tilt',phase), base=roll.slice().sort((a,b)=>a-b)[Math.floor(roll.length/2)];
  const hold=[];
  for(let i=1,start=-1;i<roll.length;i++){
    if(roll[i]===roll[i-1]){if(start<0)start=i;continue;}
    if(start>1 && (i-start)/120>0.5 && Math.abs(roll[start]-base)>.08)hold.push((i-start)/120);
    start=-1;
  }
  const ear=events(series('earPulse',phase)),blink=events(series('blink',phase));
  const intervals = at=>at.slice(1).map((t,i)=>+(t-at[i]).toFixed(2));
  assert(Math.min(...yaw)<-.149 && Math.max(...yaw)>.149);
  assert(new Set(intervals(ear)).size>4 && new Set(intervals(blink)).size>4);
  assert(hold.length && hold.every(t=>t>=.983 && t<=2));
  return {phase,yaw:[Math.min(...yaw),Math.max(...yaw)],hold:hold.map(t=>+t.toFixed(3)), earIntervals:intervals(ear),blinkIntervals:intervals(blink),paw:window.GardenCatPose.sample(0,phase).paw};
});
console.log(JSON.stringify({utc:new Date().toISOString(),sampleRate:120,seconds:90,report},null,2));
