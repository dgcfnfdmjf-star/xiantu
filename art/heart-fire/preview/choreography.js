/* Read-only choreography, shared verbatim by DOM preview and game renderer. */
function sampleHeartFire(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v));
 if(age<0||age>=(j.duration??T.durationMs))return [];
 const hit=Number.isFinite(j.hitAt)?j.hitAt:null,arrival=Math.max(1,hit??j.arriveAt??T.arrivalMs);
 const gather=arrival*T.gatherFraction,from=j.from,to=j.to,s=(j.scale||1)*D.scale,out=[];
 const angle=Math.atan2(to.y-from.y,to.x-from.x);
 const add=(layer,anchor,p,frame,opacity,rotation=0)=>{
  const spec=D.layers[layer];if(opacity<=0)return;
  out.push({id:layer,layer,anchor,x:p.x+D.offsetX*s,y:p.y+D.offsetY*s,
   width:D.display[layer]*s,height:D.display[layer]*s,pivotX:spec.pivotX,pivotY:spec.pivotY,
   frame:Math.max(0,Math.min(spec.frames-1,frame)),opacity:clamp(opacity),rotation});
 };
 if(hit===null||age<hit){
  const end=gather+Math.min(28,arrival-gather),miss=hit===null?clamp((arrival+T.missFadeMs-age)/T.missFadeMs):1;
  if(j.reduced){add('telegraph','origin',from,2,miss*.85);return out;}
  const blend=clamp((age-gather)/Math.max(1,end-gather));
  if(age<end)add('telegraph','origin',from,Math.floor(age/end*D.layers.telegraph.frames),clamp(age/25)*(1-blend));
  if(age>=gather){
   const t=clamp((age-gather)/Math.max(1,arrival-gather));
   const p={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
   add('body','moving',p,Math.floor((age-gather)/Math.max(1,arrival-gather)*D.layers.body.frames)%D.layers.body.frames,blend*miss,angle);
  }
 }else{
  const elapsed=age-hit,overlap=T.impactMs-T.crossfadeMs;
  if(elapsed>=T.aftermathMs)return [];
  const blend=clamp((elapsed-overlap)/T.crossfadeMs);
  if(elapsed<T.impactMs)add('impact','target',to,j.reduced?2:Math.floor(elapsed/T.impactMs*D.layers.impact.frames),1-blend);
  if(elapsed>=overlap){
   const progress=(elapsed-overlap)/(T.aftermathMs-overlap);
   add('residue','target',to,j.reduced?3:Math.floor(progress*D.layers.residue.frames),blend*clamp((T.aftermathMs-elapsed)/100));
  }
 }
 return out;
}

(()=>{const D=window.HeartFireDefinition;window.HeartFirePreview={definition:D,sample(age,{quality='rich',hit=true,scale=1,offsetX=0,offsetY=0}={}){const move=p=>({x:p.x+offsetX,y:p.y+offsetY});return sampleHeartFire(D,{from:move({x:260,y:205}),to:move({x:493,y:210}),scale,light:quality==='light',reduced:quality==='reduced',duration:900,arriveAt:310,hitAt:hit?310:null},age)}}})();
