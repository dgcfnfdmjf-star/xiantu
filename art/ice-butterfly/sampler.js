/* Shared pure choreography. Only the caller's acknowledged hit spawns impact. */
function sampleIceButterfly(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,t)=>a+(b-a)*t;
 if(age<0||age>=(j.duration??T.durationMs))return [];
 const hit=Number.isFinite(j.hitAt)?j.hitAt:null,arrive=Math.max(1,hit??j.arriveAt??T.arrivalMs);
 const gather=arrive*T.gatherMs/T.arrivalMs,ringEnd=arrive*130/T.arrivalMs;
 const from=j.from,to=j.to,groundFrom=j.fromGround||{x:from.x,y:from.y+30*(j.scale||1)},groundTo=j.toGround||{x:to.x,y:to.y+30*(j.scale||1)};
 const s=(j.scale||1)*D.scale,reduced=!!j.reduced,light=!!j.light,direction=to.x>=from.x?1:-1,out=[];
 const add=(id,layer,anchor,x,y,frame,opacity,rotation=0,trail=0)=>{
  const spec=D.layers[layer];if(opacity<=0)return;
  out.push({id,layer,anchor,x:x+D.offsetX*s,y:y+D.offsetY*s,width:D.display[layer]*s,height:D.display[layer]*s,
   pivotX:spec.pivotX,pivotY:spec.pivotY,frame:Math.max(0,Math.min(spec.frames-1,frame)),opacity:clamp(opacity),rotation:reduced?0:rotation,trail:reduced?0:trail});
 };
 if(age<ringEnd&&(hit===null||age<hit)&&!reduced)add('sigil','telegraph','origin',groundFrom.x,groundFrom.y,Math.floor(age/ringEnd*D.layers.telegraph.frames),Math.min(clamp(age/(ringEnd*25/130)),clamp((ringEnd-age)/(ringEnd*35/130))));
 const count=reduced?2:light?D.volley.lightCount:D.volley.count;
 if(hit===null||age<hit){
  for(let i=0;i<count;i++){
   const launch=Math.min(arrive-1,gather+i*6*arrive/T.arrivalMs),travel=reduced?0:Math.pow(clamp((age-launch)/(arrive-launch)),.65+i*.35);
   const theta=i/count*Math.PI*2,spread=reduced?0:Math.min(age,gather)*.004;
   const origin={x:from.x+Math.cos(theta+spread)*22*s,y:from.y+Math.sin(theta+spread)*28*s};
   const x=lerp(origin.x,to.x,travel),arc=(i%2?1:-1)*(D.volley.arcHeight+i%3*7)*s;
   const y=lerp(origin.y,to.y+(i%3-1)*8*s,travel)+Math.sin(travel*Math.PI)*arc;
   add('butterfly-'+i,'body',reduced?'origin':'moving',x,y,reduced?0:Math.floor(age*D.layers.body.fps/1000+i*1.7)%D.layers.body.frames,
    clamp((age-i*5)/30)*(hit!==null?1:clamp((arrive+140-age)/140)),direction*(.3+travel*.8+Math.sin(age*.012+i)*.12),travel>0?D.trailLength*s:0);
  }
 }else{
  const elapsed=age-hit,overlapStart=T.impactMs-T.crossfadeMs,afterDuration=T.residueEndMs-T.arrivalMs;
  if(elapsed>=afterDuration)return [];
  const blend=clamp((elapsed-overlapStart)/T.crossfadeMs);
  if(elapsed<T.impactMs)add('impact','impact','target',groundTo.x,groundTo.y,reduced?2:Math.floor(elapsed/T.impactMs*D.layers.impact.frames),1-blend);
  if(elapsed>=overlapStart){
   const progress=(elapsed-overlapStart)/(afterDuration-overlapStart),fade=clamp((afterDuration-elapsed)/100);
   add('residue','residue','target',groundTo.x,groundTo.y,reduced?3:Math.floor(progress*D.layers.residue.frames),blend*fade);
   if(!reduced)for(let i=0;i<(light?1:2);i++)add('outro-'+i,'body','moving',groundTo.x+(i?1:-1)*(22+progress*28)*s,groundTo.y-(33+progress*48)*s,
    Math.floor(age*.024+i*3)%D.layers.body.frames,blend*fade*(1-progress)*.65,(i?1:-1)*.45);
  }
 }
 return out;
}
