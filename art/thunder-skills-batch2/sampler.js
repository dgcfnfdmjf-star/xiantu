/* Pure sprite choreography. Caller owns damage, hit timestamps, state and targets. */
function sampleThunderBatch(D,j,age){
 const clamp=v=>Math.max(0,Math.min(1,v)),T=D.timing,out=[];
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const fade=T.crossfadeMs,start=arrival*T.gatherRatio,ground=j.toGround??j.to,front=D.visualArchetype==='moving-front',fall=D.visualArchetype==='falling';
 const from=front?(j.fromGround??j.from):j.from,to=front||fall?ground:j.to;
 const end=hit===null?arrival+fade:arrival+T.aftermathMs;
 if(age<0||age>=Math.min(end,j.duration??Infinity))return out;
 const scale=(j.scale??1)*D.scale;
 function add(layer,p,begin,duration,alpha,anchor){
  if(alpha<=0||age<begin||age>=begin+duration)return;
  const L=D.layers[layer],progress=(age-begin)/duration;
  out.push({id:layer,layer,anchor,x:p.x+D.offsetX+(j.offsetX??0),y:p.y+D.offsetY+(j.offsetY??0),width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor(progress*L.frames)),opacity:clamp(alpha),rotation:0,flipX:!fall&&to.x<from.x});
 }
 const teleEnd=fall?arrival+fade:start+fade;
 add('telegraph',fall?ground:from,0,teleEnd,clamp(age/60)*clamp((teleEnd-age)/fade)*.8,fall?'target':'origin');
 if(!j.reduced){
  const progress=clamp((age-start-fade)/Math.max(1,arrival-start-fade));
  const p=fall?{x:ground.x,y:ground.y-T.fallDistance*(1-progress)}:{x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress};
  add('body',p,start,arrival+fade-start,clamp((age-start)/fade)*clamp((arrival+fade-age)/fade),'moving');
 }
 if(hit===null||age<hit)return out;
 const elapsed=age-hit;
 add('impact',to,hit,T.impactMs,clamp(elapsed/fade)*clamp((T.impactMs-elapsed)/fade),'target');
 if(!j.light&&!j.reduced)add('residue',to,hit+T.impactMs-fade,T.aftermathMs-T.impactMs+fade,clamp((elapsed-T.impactMs+fade)/fade)*clamp((T.aftermathMs-elapsed)/100),'target');
 return out;
}
if(typeof module!=='undefined')module.exports={sampleThunderBatch};
