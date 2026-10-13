/* Pure presentation contract. Event timestamps are supplied by the caller. */
function sampleFireBatch(D, j, age) {
 const clamp=v=>Math.max(0,Math.min(1,v)),T=D.timing,out=[];
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const pillar=D.key==='flame_pillar',burst=D.key==='flame_burst',scale=(j.scale??1)*D.scale;
 const from=j.from,to=j.to,ground=j.toGround??to, end=hit===null?arrival+140:hit+T.aftermathMs;
 if(age<0||age>=Math.min(end,j.duration??Infinity))return out;
 const add=(layer,p,start,duration,alpha,anchor='target')=>{
  if(alpha<=0||age<start||age>=start+duration)return;
  const L=D.layers[layer];let frame=Math.min(L.frames-1,Math.floor((age-start)/duration*L.frames));
  if(j.reduced)frame=Math.min(2,L.frames-1);
  out.push({id:layer,layer,anchor,x:p.x+(j.offsetX??0)+D.offsetX,y:p.y+(j.offsetY??0)+D.offsetY,width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:clamp(alpha),rotation:(!pillar&&layer!=='residue'&&to.x<from.x)?Math.PI:0});
 };
 const gather=arrival*T.gatherMs/T.arrivalMs,fade=T.crossfadeMs,miss=hit===null?clamp((end-age)/140):1;
 if(pillar){
  add('telegraph',ground,0,arrival+fade,clamp(age/35)*clamp((arrival+fade-age)/fade)*miss);
 }else if(age<arrival+fade){
  const blend=clamp((age-gather)/fade),p=clamp((age-gather-fade)/Math.max(1,arrival-gather-fade));
  add('telegraph',from,0,gather+fade,clamp(age/30)*(1-blend)*miss,'origin');
  if(!j.reduced)add('body',{x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p},gather,arrival+fade-gather,blend*clamp((arrival+fade-age)/fade)*miss,'moving');
 }
 if(hit===null||age<hit)return out;
 const elapsed=age-hit;
 const det=burst&&Number.isFinite(j.detonationAt)&&j.detonationAt>=hit&&j.detonationAt<hit+300?j.detonationAt:null;
 if(pillar){
  add('body',ground,hit,400,clamp(elapsed/fade)*clamp((400-elapsed)/60));
  if(!j.light&&!j.reduced)add('impact',ground,hit,180,clamp(elapsed/fade)*clamp((180-elapsed)/60)*.6);
  add('residue',ground,hit+340,310,clamp((elapsed-340)/60)*clamp((650-elapsed)/120));
 }else{
  let alpha=clamp(elapsed/fade)*clamp((180-elapsed)/40);
  if(det!==null)alpha*=clamp((det+40-age)/40);
  add('impact',to,hit,det===null?180:Math.min(180,det+40-hit),alpha);
  if(det!==null){
   add('detonation',to,det,320,clamp((age-det)/40)*clamp((det+320-age)/100));
   add('residue',ground,det+260,hit+T.aftermathMs-det-260,clamp((age-det-260)/60)*clamp((hit+T.aftermathMs-age)/120));
  }else add('residue',ground,hit+140,T.aftermathMs-140,clamp((elapsed-140)/40)*clamp((T.aftermathMs-elapsed)/120));
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleFireBatch};
