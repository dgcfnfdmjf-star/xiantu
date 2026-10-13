/* Read-only resource choreography; all hit and burn state belongs to the caller. */
function sampleFireBatch2(D, j, age) {
 const clamp=v=>Math.max(0,Math.min(1,v)),T=D.timing,out=[];
 if(age<0||j.hidden||j.exited||j.alive===false||j.sameTarget===false)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const ground=D.visualArchetype==='ground-eruption',lotus=D.key==='karmic_lotus';
 const from=j.from,to=j.to,foot=j.toGround??to,scale=(j.scale??1)*D.scale;
 function add(layer,p,start,duration,alpha,anchor='target'){
  if(alpha<=0||age<start||age>=start+duration)return;
  const L=D.layers[layer],elapsed=age-start;
  let frame=L.loop?Math.floor(elapsed*L.fps/1000)%L.frames:Math.min(L.frames-1,Math.floor(elapsed/duration*L.frames));
  if(j.reduced)frame=Math.min(2,L.frames-1);
  out.push({id:layer,layer,anchor,x:p.x+(j.offsetX??0)+D.offsetX,y:p.y+(j.offsetY??0)+D.offsetY,width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:clamp(alpha),rotation:!ground&&layer!=='residue'&&to.x<from.x?Math.PI:0});
 }
 const fade=T.crossfadeMs,shortEnd=hit===null?arrival+fade:hit+T.aftermathMs;
 if(age<Math.min(shortEnd,j.duration??Infinity)){
  if(ground){
   add('telegraph',foot,0,arrival+fade,clamp(age/35)*clamp((arrival+fade-age)/fade));
  }else{
   const gather=arrival*T.gatherMs/T.arrivalMs,blend=clamp((age-gather)/fade);
   const p=clamp((age-gather-fade)/Math.max(1,arrival-gather-fade));
   add('telegraph',from,0,gather+fade,clamp(age/30)*(1-blend),'origin');
   if(!j.reduced)add('body',{x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p},gather,arrival+fade-gather,blend*clamp((arrival+fade-age)/fade),'moving');
  }
  if(hit!==null&&age>=hit){
   const e=age-hit;
   if(ground){
    add('body',foot,hit,T.bodyMs,clamp(e/fade)*clamp((T.bodyMs-e)/60));
    if(!j.light&&!j.reduced)add('impact',foot,hit,180,clamp(e/fade)*clamp((180-e)/60)*.6);
    add('residue',foot,hit+300,T.aftermathMs-300,clamp((e-300)/60)*clamp((T.aftermathMs-e)/120));
   }else{
    add('impact',to,hit,180,clamp(e/fade)*clamp((180-e)/40));
    add('residue',foot,hit+140,T.aftermathMs-140,clamp((e-140)/40)*clamp((T.aftermathMs-e)/120));
   }
  }
 }
 // Preview feeds the same state fields required by the eventual runtime owner.
 // Time alone never expires a real burn, and repeated fire never restarts this loop.
 const state=j.burn;
 if(lotus&&hit!==null&&age>=shortEnd&&state?.burnTurns>0&&state?.burnStacks>0&&state?._burnHealBlockV286818)
  add('status',foot,shortEnd,Infinity,1);
 return out;
}
if(typeof module!=='undefined')module.exports={sampleFireBatch2};
