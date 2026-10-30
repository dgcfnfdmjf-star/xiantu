/* Read-only healing presentation. The preview simulates actualHeal; runtime must supply it. */
(function(root){
function sampleHealBatch(D,j,age){
 const T=D.timing.durationMs,C=x=>Math.max(0,Math.min(1,x));
 if(!Number.isFinite(age)||age<0||age>=Math.min(T,j.duration??T)||j.hidden||j.exited||j.alive===false||j.sameActor===false||j.sameTarget===false)return [];
 const out=[],base=j.fromGround||{x:245,y:302},scale=(j.scale??1)*D.scale,bodyY=base.y-(D.key==='dew_return'?72:57)*scale;
 const body=D.preview.layers.body,bodyStart=body.start*T,bodyEnd=body.end*T;
 const q=C((age-bodyStart)/Math.max(1,bodyEnd-bodyStart)),rise=j.reduced?1:q;
 for(const [name,L] of Object.entries(D.layers)){
  if(!(j.actualHeal>0)&&['body','impact'].includes(name))continue;
  const w=D.preview.layers[name],a=w.start*T,b=w.end*T;if(age<a||age>=b)continue;
  const u=(age-a)/(b-a),opacity=C(u/w.fadeIn)*C((1-u)/w.fadeOut)*(j.actualHeal>0?1:.35);
  const y=name==='telegraph'?base.y-16*scale:(name==='body'?(D.key==='dew_return'?base.y-32*scale-(base.y-32*scale-bodyY)*rise:bodyY):bodyY-(name==='residue'?8*C(u)*scale:0));
  out.push({id:name,layer:name,anchor:'origin',x:base.x+D.offsetX,y:y+D.offsetY,width:D.display[name]*scale,height:D.display[name]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor(u*L.frames)),opacity,rotation:0});
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleHealBatch};if(root)root.sampleHealBatch=sampleHealBatch;
})(typeof window!=='undefined'?window:null);
