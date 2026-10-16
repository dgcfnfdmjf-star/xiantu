/* Visual ownership only. The combat engine supplies state and explicit application/tick/reflection events. */
function createThunderState(read,clock){
 let records={},serial=0;
 const alive=d=>d.active!==false&&d.playerHp>0&&d.enemyHp>0;
 const active=(kind,d)=>kind==='armor'?d.thunderArmorTurns>0:d.thunderDomainTurns>0&&d.thunderDomainDamage>0;
 function clear(){for(const r of Object.values(records))r.action.thunderOwned=false;records={};}
 function sync(){
  const d=read(),t=clock();if(!alive(d)){clear();return d;}
  for(const [key,r]of Object.entries(records)){
   if(r.target!==d.targetToken||r.owner!==d.ownerToken){delete records[key];continue;}
   if(!active(key,d)&&r.end===Infinity)r.end=t;
   r.events=r.events.filter(e=>t-e.at<600);
   if(t>=r.end+420)delete records[key];
  }
  return d;
 }
 function notify(kind,detail={},action=null){
  const d=read(),t=clock();if(!alive(d)){clear();return;}
  if(detail.target&&detail.target!==d.targetToken||detail.owner&&detail.owner!==d.ownerToken)return;
  const key=kind==='armor'||kind==='reflect'?'armor':'domain';
  if(!active(key,d))return;
  if(kind==='domain'||kind==='armor'){
   if(action)action.thunderOwned=true;
   records[key]={name:key==='armor'?'雷神附体':detail.name==='九霄雷云'?'九霄雷云':'万雷噬狱',target:d.targetToken,owner:d.ownerToken,action:action||{name:detail.name,at:t-1000,impactAt:310},end:Infinity,events:[]};
  }else if(kind==='tick'||kind==='reflect'){
   // A scene may become ready after the original application. Recover only a currently real state.
   if(!records[key])records[key]={name:key==='armor'?'雷神附体':'万雷噬狱',target:d.targetToken,owner:d.ownerToken,action:{at:t-1000,impactAt:310},end:Infinity,events:[]};
   records[key].events.push({id:++serial,type:kind,at:t});
  }
 }
 function collect(makeJob){
  sync();const t=clock(),out=[];
  for(const r of Object.values(records)){
   if(r.action.waiting)continue;
   const base=makeJob(r.name,r.action);if(!base)continue;
   const at=r.action.at,age=t-at;
   const job={...base,stateActive:true,stateEndAt:r.end-at,events:r.events.map(e=>({...e,at:e.at-at})),duration:Infinity,hitAt:r.action.impactAt??base.arriveAt??310};
   out.push({job,age});
  }
  return out;
 }
 function pause(){sync();const t=clock();for(const r of Object.values(records)){r.events=[];r.action={at:t-1000,impactAt:310};} }
 return {notify,collect,clear,pause,sync,inspect:()=>Object.entries(records).map(([kind,r])=>({kind,name:r.name,ending:Number.isFinite(r.end),events:r.events.length}))};
}
if(typeof module!=='undefined')module.exports={createThunderState};
