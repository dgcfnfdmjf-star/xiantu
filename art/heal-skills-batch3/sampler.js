/* Pure presentation sampler. Guard ownership/consume metadata comes from combat, never a local timer. */
(function(root){
function sampleHealGuard(D,j,age){
 const C=x=>Math.max(0,Math.min(1,x)),T=D.timing.durationMs;
 if(!Number.isFinite(age)||age<0||j.hidden||j.exited||j.alive===false||j.sameActor===false||j.sameTarget===false)return [];
 const base=j.fromGround||{x:245,y:302},scale=(Number.isFinite(j.scale)?j.scale:1)*D.scale,out=[];
 const heal=Number.isFinite(j.actualHeal)&&j.actualHeal>0;
 const own=j.guardOwned===true,consume=Number.isFinite(j.guardConsumedAt)?j.guardConsumedAt:Infinity;
 // Replacement is immediate; a consumed status may finish one short outro only.
 const replaced=Number.isFinite(j.guardReplacedAt)&&age>=j.guardReplacedAt;
 function push(name,u,opacity,y,frame){
  const L=D.layers[name];if(!(opacity>0))return;
  const index=frame??(j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor(C(u)*L.frames)));
  out.push({id:name,layer:name,file:L.file,anchor:'origin',x:base.x+D.offsetX*scale,y:base.y+y*scale+D.offsetY*scale,width:D.display[name]*scale,height:D.display[name]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.light?Math.floor(index/2)*2:index,opacity:C(opacity),rotation:0});
 }
 for(const name of ['telegraph','body','impact','residue']){
  const w=D.preview.layers[name],a=w.start*T,b=w.end*T;
  if(age<a||age>=b)continue;
  const u=(age-a)/(b-a),fade=C(u/w.fadeIn)*C((1-u)/w.fadeOut);
  // Body is a healing bloom. Full-HP casting still establishes the independent guard below.
  if((name==='body'||name==='impact')&&!heal)continue;
  push(name,u,fade*(heal?1:.25),name==='impact'?-65:name==='residue'?-40:-18);
 }
 if(own&&!replaced&&age<consume){
  const start=D.timing.guardStartMs,fadeIn=D.timing.guardFadeMs;
  if(age>=start){const t=age-start,u=((t%D.timing.guardLoopMs)+D.timing.guardLoopMs)%D.timing.guardLoopMs/D.timing.guardLoopMs;
   const frame=j.reduced?0:Math.floor(u*D.layers.guard.frames);
   push('guard',u,C(t/fadeIn),-25,frame);
  }
 }else if(own&&!replaced&&age>=consume&&age<consume+D.timing.consumeMs){
  const u=(age-consume)/D.timing.consumeMs;
  push('consume',u,1-C(u),-25);
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleHealGuard};if(root)root.sampleHealGuard=sampleHealGuard;
})(typeof window!=='undefined'?window:null);
