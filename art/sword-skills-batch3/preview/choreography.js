/* Pure presentation sampler. Preview simulates events; integration must supply real ones. */
(function(root){
function sampleSwordBatch(D,j,age){
 const C=v=>Math.max(0,Math.min(1,v)),out=[],T=D.timing;
 if(!Number.isFinite(age)||age<0||age>=(j.duration??T.durationMs)||j.hidden||j.exited||j.alive===false||j.sameTarget===false)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null;
 const arrival=hit??j.arriveAt??T.arrivalMs,start=Math.max(15,arrival*T.gatherMs/T.arrivalMs),fade=T.crossfadeMs;
 const from=j.from||{x:260,y:205},to=j.to||{x:493,y:210},base=j.fromGround||{x:245,y:302},scale=(j.scale??1)*D.scale;
 function add(id,layer,p,a,b,alpha,anchor,rotation=0,loop=false){
  if(age<a||age>=b||alpha<=0)return;
  const L=D.layers[layer];if(!L)return;
  const progress=loop?((age-a)/800)%1:(age-a)/(b-a);
  const frame=j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor(progress*L.frames));
  out.push({id,layer,anchor,x:p.x+D.offsetX,y:p.y+D.offsetY,width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:C(alpha),rotation});
 }
 const teleEnd=start+fade;
 add('telegraph','telegraph',from,0,teleEnd,C(age/45)*C((teleEnd-age)/fade),'origin');
 const p=C((age-start)/Math.max(1,arrival-start));
 add('body','body',{x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p},start,arrival+fade,C((age-start)/fade)*C((arrival+fade-age)/fade),'moving',Math.atan2(to.y-from.y,to.x-from.x));
 if(hit!==null){
  add('impact','impact',to,hit,hit+240,C((age-hit)/fade)*C((hit+240-age)/60),'target');
  add('residue','residue',{x:to.x+6,y:to.y+12},hit+180,hit+480,C((age-hit-180)/60)*C((hit+480-age)/100),'target');
  if(D.key==='blood_return'&&j.actualHeal>0){
   const a=hit+150,b=hit+500,q=C((age-a)/(b-a));
   add('return','support',{x:to.x+(from.x-to.x)*q,y:to.y+(from.y-to.y)*q-22*Math.sin(q*Math.PI)},a,b,C((age-a)/60)*C((b-age)/70),'moving',0,false);
  }
 }
 if(D.key==='astral_guard'&&Number.isFinite(j.guardAt)&&j.guardAt>=0){
  const a=j.guardAt,end=Number.isFinite(j.guardEnd)?j.guardEnd:Infinity;
  if(age>=a&&age<end+220){
   const alpha=C((age-a)/100)*(age<end?1:C((end+220-age)/220));
   for(let i=0;i<3;i++){
    const angle=i*Math.PI*2/3+(j.reduced?0:(age-a)*.0015);
    add('guard:'+i,'support',{x:base.x+Math.cos(angle)*65*scale,y:base.y-40*scale+Math.sin(angle)*16*scale},a,end+220,alpha,'origin',0,true);
   }
  }
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleSwordBatch};
if(root)root.sampleSwordBatch=sampleSwordBatch;
})(typeof window!=='undefined'?window:null);
