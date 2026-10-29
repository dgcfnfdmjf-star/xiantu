// Presentation-only provenance for the existing one-hit guard. No save fields/timers.
function createSwordState(read,clock){
 let record=null,paused=false;
 function sync(){
  const d=read(),t=clock();
  if(!record)return d;
  if(d.active===false||d.playerHp<=0||d.enemyHp<=0||record.owner!==d.ownerToken||record.target!==d.targetToken){record=null;return d;}
  if(!(d.swordGuardRatio>0)&&record.end===Infinity){if(paused)record=null;else record.end=t;}
  if(record&&t>=record.end+220)record=null;
  return d;
 }
 function notify(kind,detail={}){
  const d=sync(),t=clock();
  if(d.active===false||d.playerHp<=0||d.enemyHp<=0||detail.owner&&detail.owner!==d.ownerToken||detail.target&&detail.target!==d.targetToken)return;
  if(kind==='guard'&&!detail.retain){
   record=detail.name==='玄罡护体剑'&&d.swordGuardRatio>0?{owner:d.ownerToken,target:d.targetToken,at:t,end:Infinity}:null;
  }
  if(kind==='consume'&&record){if(paused)record=null;else record.end=t;}
 }
 return {notify,sync,collect(){sync();paused=false;return record?[{...record,age:clock()-record.at}]:[];},
  pause(){sync();paused=true;if(record&&Number.isFinite(record.end))record=null;},clear(){record=null;},inspect:()=>record?['guard']:[]};
}
