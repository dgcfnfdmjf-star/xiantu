/* Pure resource choreography. Caller owns hit events, target identity and burn state. */
function sampleFireBatch3(D,j,age){
 const out=[],clamp=v=>Math.max(0,Math.min(1,v)),T=D.timing;
 if(age<0||j.hidden||j.exited||j.alive===false||j.sameTarget===false)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,H=hit??j.arriveAt??T.arrivalMs;
 const from=j.from,to=j.to,foot=j.toGround??to,scale=(j.scale??1)*D.scale;
 const delta={x:to.x-from.x,y:to.y-from.y},angle=Math.atan2(delta.y,delta.x),length=Math.hypot(delta.x,delta.y);
 const fade=(t,start,end,fi=40,fo=40)=>clamp((t-start)/fi)*clamp((end-t)/fo);
 function add(layer,p,start,end,opacity,anchor='target',extra={}){
  if(age<start||age>=end||opacity<=0)return;
  const L=D.layers[layer],phase=age-start;
  const frame=j.reduced?Math.min(2,L.frames-1):L.loop?Math.floor((j.sceneAge??age)*L.fps/1000)%L.frames:Math.min(L.frames-1,Math.floor(phase/(end-start)*L.frames));
  out.push({id:layer,layer,anchor,x:p.x+(j.offsetX??0)+D.offsetX,y:p.y+(j.offsetY??0)+D.offsetY,width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:clamp(opacity),rotation:0,...extra});
 }
 const shortEnd=H+T.aftermathMs,shortActive=age<Math.min(shortEnd,j.duration??Infinity);
 if(shortActive&&D.key==='heaven_meteor'){
  add('telegraph',foot,0,H+40,fade(age,0,H+40));
  const begin=H*80/310,p=clamp((age-begin)/Math.max(1,H-begin));
  if(!j.reduced)add('body',{x:foot.x-35*(1-p),y:foot.y-210*(1-p)},begin,H+40,fade(age,begin,H+40),'moving');
  if(hit!==null){
   add('impact',foot,H,H+220,fade(age,H,H+220));
   add('residue',foot,H+180,shortEnd,fade(age,H+180,shortEnd,40,120));
  }
 }
 if(shortActive&&D.key==='dragon_breath'){
  const gather=H*100/310,sourceEnd=H+100;
  add('telegraph',from,0,gather+40,fade(age,0,gather+40),'origin');
  if(!j.reduced){
   add('source',from,gather,sourceEnd,fade(age,gather,sourceEnd),'origin');
   // Authored flame segments retain size; clipping reveals only the advancing front.
   // The source head is separate; there is never a stretched complete dragon image.
   const startDistance=25*scale,front=length*clamp((age-gather)/Math.max(1,H-gather));
   const step=38*scale,span=D.display.body*scale*.59;
   for(let n=0;n<9;n++){
    const left=startDistance+n*step;if(left>=length||left>=front)break;
    const center=left+span/2,ratio=center/Math.max(1,length);
    const clip=clamp((Math.min(front,length)-left)/span);
    add('body',{x:from.x+delta.x*ratio,y:from.y+delta.y*ratio},gather,H+40,fade(age,gather,H+40),'moving',{id:'body-'+n,rotation:angle,clipStart:.205,clipEnd:.205+.59*clip});
   }
  }
  if(hit!==null){
   add('impact',to,H,H+180,fade(age,H,H+180));
   add('residue',foot,H+140,shortEnd,fade(age,H+140,shortEnd,40,120));
  }
 }
 if(shortActive&&D.key==='wildfire_domain'){
  add('telegraph',foot,0,H+40,fade(age,0,H+40));
  if(hit!==null){
   add('body',foot,H,H+360,fade(age,H,H+360,40,60));
   if(!j.light&&!j.reduced)add('impact',foot,H,H+160,fade(age,H,H+160)*.55);
   add('residue',foot,H+300,shortEnd,fade(age,H+300,shortEnd,60,60));
  }
 }
 // This is a preview input contract, not a combat field or a new damage timer.
 const burn=j.burn,domain=D.key==='wildfire_domain'&&hit!==null&&j.domainConfirmed===true;
 if(domain&&age>=shortEnd-60&&burn?.burnTurns>0&&burn?.burnStacks>0&&!burn?._burnHealBlockV286818)
  add('status',foot,shortEnd-60,Infinity,clamp((age-shortEnd+60)/60));
 return out;
}
if(typeof module!=='undefined')module.exports={sampleFireBatch3};
