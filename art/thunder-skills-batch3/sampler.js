/* Resource-only pure choreography. All lifetimes/events come from caller, never from damage guesses. */
function sampleThunderBatch(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v)),out=[];
 if(age<0||age>=(j.duration??Infinity)||j.destroyed)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const chain=D.key==='chain_lightning',mantle=D.key==='thunder_mantle',cloud=D.key==='high_cloud';
 const from=j.from,to=j.to,ground=j.toGround??to,fromGround=j.fromGround??from;
 const base=mantle?from:cloud?{x:ground.x,y:ground.y-(j.cloudHeight??T.cloudHeight)}:ground;
 const anchor=mantle?'origin':'target',start=arrival*T.gatherRatio,fade=T.crossfadeMs;
 const acknowledged=hit!==null&&age>=hit;
 const hasState=!chain&&hit!==null&&j.stateActive!==false;
 const stop=hasState?(j.stateEndAt??Infinity):arrival+(chain?180:240);
 const events=Array.isArray(j.events)?j.events:[];
 const eventEnd=hit===null||chain?0:events.reduce((end,ev)=>Number.isFinite(ev.at)&&ev.at>=hit&&ev.at<=stop&&ev.type===(mantle?'reflect':'tick')?Math.max(end,ev.at+(mantle?420:220)):end,0);
 const end=hit===null?arrival+fade:Math.max(arrival+T.aftermathMs,stop+T.outroMs,eventEnd);
 if(age>=end)return out;
 function add(layer,p,begin,end,alpha,id=layer,attach=anchor,loop=false,rotation=0,size){
  if(age<begin||age>=end||alpha<=0)return;
  const L=D.layers[layer],s=(j.scale??1)*D.scale,w=(size??D.display[layer])*s;
  const phase=loop?((age-begin)%T.loopMs)/T.loopMs:(age-begin)/(end-begin);
  out.push({id,layer,anchor:attach,x:p.x+D.offsetX+(j.offsetX??0),y:p.y+D.offsetY+(j.offsetY??0),width:w,height:w,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?0:Math.min(L.frames-1,Math.floor(phase*L.frames)),opacity:clamp(alpha),rotation,flipX:false});
 }
 const telePoint=chain?from:mantle?fromGround:base;
 const teleEnd=start+fade;
 add('telegraph',telePoint,0,teleEnd,clamp(age/80)*clamp((teleEnd-age)/fade), 'telegraph',chain||mantle?'origin':'target');
 if(chain){
  // Uniform size is selected once from real endpoint distance, never increased over time to fake travel.
  const length=Math.hypot(to.x-from.x,to.y-from.y),mid={x:(from.x+to.x)/2,y:(from.y+to.y)/2};
  if(!j.reduced)add('body',mid,start,arrival+fade,clamp((age-start)/fade)*clamp((arrival+fade-age)/fade),'body','moving',false,Math.atan2(to.y-from.y,to.x-from.x),length/.58);
  if(acknowledged){add('impact',to,hit,hit+240,clamp((age-hit)/fade)*clamp((hit+240-age)/fade));if(!j.light&&!j.reduced)add('residue',to,hit+160,hit+520,clamp((age-hit-160)/fade)*clamp((hit+520-age)/180));}
  return out;
 }
 const bodyEnd=hit===null?arrival+fade:stop+fade;
 // Reduced motion holds a legible state silhouette; it must not erase the status itself.
 add('body',base,start,bodyEnd,clamp((age-start)/fade)*clamp((bodyEnd-age)/fade),'body',anchor,true);
 if(acknowledged){
  const impact=mantle?from:ground;
  add('impact',impact,hit,hit+240,clamp((age-hit)/fade)*clamp((hit+240-age)/fade),'impact',anchor);
  if(Number.isFinite(stop)&&!j.light&&!j.reduced)add('residue',base,stop,stop+300,clamp((age-stop)/fade)*clamp((stop+300-age)/180));
 }
 // Incoming explicit events include unique IDs, so resampling cannot invent new hits or repeats.
 const seen=new Set();
 for(const ev of events){
  if(seen.has(ev.id)||!Number.isFinite(ev.at))continue;seen.add(ev.id);
  if(hit===null||ev.at<hit||ev.at>stop)continue;
  if(ev.type==='reflect'&&mantle){
   const duration=240,progress=clamp((age-ev.at)/duration),p={x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress};
   if(!j.reduced)add('event',p,ev.at,ev.at+duration,clamp((age-ev.at)/40)*clamp((ev.at+duration-age)/60),'reflect:'+ev.id,'moving',false,Math.atan2(to.y-from.y,to.x-from.x));
   add('impact',to,ev.at+duration,ev.at+duration+180,clamp((age-ev.at-duration)/40)*clamp((ev.at+duration+180-age)/60),'reflect-hit:'+ev.id,'target',false,0,D.display.reflectImpact);
  }else if(ev.type==='tick'&&!mantle){
   add('event',ground,ev.at,ev.at+220,clamp((age-ev.at)/40)*clamp((ev.at+220-age)/80),'tick:'+ev.id,'target');
  }
 }
 // Cloud's first strike is a separate descending body; fixed size, not a stretched beam.
 if(cloud&&!j.reduced){
  const progress=clamp((age-start)/(arrival-start));
  add('event',{x:ground.x,y:ground.y-45*(1-progress)},start,arrival+fade,clamp((age-start)/fade)*clamp((arrival+fade-age)/fade),'first-bolt','moving');
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleThunderBatch};
