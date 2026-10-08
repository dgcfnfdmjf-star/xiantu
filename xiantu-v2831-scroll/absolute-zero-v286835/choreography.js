/* Pure target-ground choreography shared by preview and game. */
function sampleAbsoluteZero(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v)),out=[];
 if(age<0||age>=(j.duration??T.durationMs))return out;
 const hit=Number.isFinite(j.hitAt)?j.hitAt:null,arrival=Math.max(1,hit??j.arriveAt??T.arrivalMs),p=j.toGround||j.to,s=(j.scale||1)*D.scale;
 function add(layer,frame,alpha){const spec=D.layers[layer];if(alpha<=0)return;out.push({id:layer,layer,anchor:'target',x:p.x+D.offsetX*s,y:p.y+D.offsetY*s,width:D.display[layer]*s,height:D.display[layer]*s,pivotX:spec.pivotX,pivotY:spec.pivotY,frame:Math.max(0,Math.min(spec.frames-1,frame)),opacity:clamp(alpha),rotation:0});}
 if(hit===null||age<hit){
  const gather=arrival*.45,blend=clamp((age-gather)/Math.max(1,arrival*.18)),miss=hit===null?clamp((arrival+140-age)/140):1;
  if(j.reduced){add('telegraph',3,miss*.85);return out;}
  add('telegraph',Math.floor(age/Math.max(1,gather)*4),clamp(age/30)*(1-blend)*miss);
  if(age>=gather)add('body',Math.floor((age-gather)/Math.max(1,arrival-gather)*6),blend*miss);
 }else{
  const elapsed=age-hit;if(elapsed>=T.aftermathMs)return out;
  const blend=clamp((elapsed-(T.impactMs-T.crossfadeMs))/T.crossfadeMs);
  add('impact',j.reduced?2:Math.floor(elapsed/T.impactMs*6),1-blend);
  if(blend>0)add('residue',j.reduced?5:Math.floor((elapsed-(T.impactMs-T.crossfadeMs))/(T.aftermathMs-(T.impactMs-T.crossfadeMs))*8),blend*clamp((T.aftermathMs-elapsed)/100));
 }
 return out;
}

(()=>{const D=window.AbsoluteZeroDefinition;window.AbsoluteZeroPreview={definition:D,sample(age,{quality='rich',hit=true,scale=1,offsetX=0,offsetY=0}={}){return sampleAbsoluteZero(D,{toGround:{x:493+offsetX,y:278+offsetY},scale,light:quality==='light',reduced:quality==='reduced',duration:900,arriveAt:310,hitAt:hit?310:null},age)}}})();
