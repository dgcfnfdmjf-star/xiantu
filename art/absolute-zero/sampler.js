/* Pure visual sampler; the caller supplies the acknowledged hit and freeze exit. */
function sampleAbsoluteZero(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v));
 if(age<0||j.targetPresent===false)return [];
 const hit=Number.isFinite(j.hitAt)?j.hitAt:null,arrival=Math.max(1,hit??j.arriveAt??T.arrivalMs);
 const freezeEnd=j.freezeEnd??hit,from=j.from,groundFrom=j.fromGround||{x:from.x,y:from.y+30*(j.scale||1)},groundTo=j.toGround||{x:j.to.x,y:j.to.y+30*(j.scale||1)};
 const reduced=!!j.reduced,out=[],s=(j.scale||1)*D.scale,gather=arrival*T.gatherMs/T.arrivalMs,coreEnd=arrival*150/T.arrivalMs;
 const add=(id,layer,anchor,p,frame,opacity)=>{
  if(opacity<=0)return;const m=D.layers[layer],size=D.display[layer]*s*(['impact','sustain'].includes(layer)?j.shellScale||1:1);
  out.push({id,layer,anchor,x:p.x+D.offsetX*s,y:p.y+D.offsetY*s,width:size,height:size,pivotX:m.pivotX,pivotY:m.pivotY,frame:Math.min(m.frames-1,Math.max(0,frame)),opacity:clamp(opacity),rotation:0,flipX:layer==='body'&&groundTo.x<groundFrom.x});
 };
 if(j.zeroPhase!=='status'){
  if(age<coreEnd)add('core','telegraph','origin',from,reduced?2:Math.floor(age/coreEnd*D.layers.telegraph.frames),Math.min(clamp(age/(coreEnd/6)),clamp((coreEnd-age)/(coreEnd*.4))));
  const fade=hit!==null?60:140;
  if(!reduced&&age>=gather&&age<arrival+fade){
   const t=clamp((age-gather)/Math.max(1,arrival-gather));
   add('front','body','moving',{x:groundFrom.x+(groundTo.x-groundFrom.x)*t,y:groundFrom.y+(groundTo.y-groundFrom.y)*t},Math.floor(age*D.layers.body.fps/1000)%D.layers.body.frames,Math.min(clamp((age-gather)/40),clamp((arrival+fade-age)/fade)));
  }
 }
 if(j.zeroPhase!=='cast'&&hit!==null&&age>=hit&&freezeEnd>hit&&age<freezeEnd+T.releaseMs){
  const elapsed=Math.min(age,freezeEnd)-hit,overlap=T.impactMs-T.crossfadeMs,blend=clamp((elapsed-overlap)/T.crossfadeMs),release=clamp((freezeEnd+T.releaseMs-age)/T.releaseMs);
  if(elapsed<T.impactMs)add('forming','impact','target',groundTo,reduced?2:Math.floor(elapsed/T.impactMs*D.layers.impact.frames),(1-blend)*release);
  if(elapsed>=overlap)add('frozen','sustain','target',groundTo,reduced?0:Math.floor(Math.max(0,elapsed-T.impactMs)*(j.light?8:D.layers.sustain.fps)/1000)%D.layers.sustain.frames,blend*release);
  if(Number.isFinite(freezeEnd)&&age>=freezeEnd){const t=(age-freezeEnd)/T.releaseMs;add('outro','residue','target',groundTo,reduced?3:Math.floor(t*D.layers.residue.frames),Math.min(clamp(t*5),clamp((1-t)*2)));}
 }
 return out;
}
