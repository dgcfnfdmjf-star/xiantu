/* Presentation only. Each cast must supply authoritative HP/MP results and pre-heal emergency flag. */
(function(root){
function sampleHealBatch(D,j,age){
 const T=D.timing.durationMs,C=x=>Math.max(0,Math.min(1,x));
 if(!Number.isFinite(age)||age<0||age>=Math.min(T,j.duration??T)||j.hidden||j.exited||j.alive===false||j.sameActor===false||j.sameTarget===false)return [];
 const out=[],base=j.fromGround||{x:245,y:302},scale=(j.scale??1)*D.scale;
 for(const [name,L] of Object.entries(D.layers)){
  const w=D.preview.layers[name],a=w.start*T,b=w.end*T;if(age<a||age>=b)continue;
  const u=(age-a)/(b-a),fade=C(u/w.fadeIn)*C((1-u)/w.fadeOut),success=['body','impact'].includes(name);
  const channels=D.key==='spring_reflux'?['hp','mp']:['hp'];
  for(const channel of channels){
   const amount=channel==='mp'?j.actualMpRestore:j.actualHeal,positive=Number.isFinite(amount)&&amount>0;
   if(success&&!positive)continue;
   const file=D.key==='spring_reflux'?L.channels[channel]:D.key==='fate_mend'&&j.emergency!==true?L.channels.normal:L.file;
   const rise=j.reduced?1:C(u),y=name==='telegraph'?base.y-18*scale:base.y-(name==='body'?52+8*rise:60+(name==='residue'?8*u:0))*scale;
   out.push({id:name+':'+channel,layer:name,file,channel,anchor:'origin',x:base.x+D.offsetX,y:y+D.offsetY,width:D.display[name]*scale,height:D.display[name]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor(u*L.frames)),opacity:fade*(positive?1:.28),rotation:0});
  }
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleHealBatch};if(root)root.sampleHealBatch=sampleHealBatch;
})(typeof window!=='undefined'?window:null);
