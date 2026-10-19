/* Read-only choreography. Preview supplies hitAt; integration must use real contact. */
(function(root){
function sampleSwordBatch(D,j,age){
 const C=v=>Math.max(0,Math.min(1,v)),out=[],T=D.timing;
 if(age<0||age>=(j.duration??T.durationMs)||j.hidden||j.exited||j.alive===false||j.sameTarget===false)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const start=Math.max(15,arrival*T.gatherMs/T.arrivalMs),fade=T.crossfadeMs;
 const from=j.from||{x:260,y:205},to=j.to||{x:493,y:210},ground=j.toGround||{x:493,y:278};
 const gold=false,volley=false,scale=(j.scale??1)*D.scale;
 function add(id,layer,p,a,b,alpha,anchor,rotation=0,size=1){
  if(age<a||age>=b||alpha<=0)return;
  const L=D.layers[layer],frame=j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor((age-a)/(b-a)*L.frames));
  out.push({id,layer,anchor,x:p.x+D.offsetX,y:p.y+D.offsetY,width:D.display[layer]*scale*size,height:D.display[layer]*scale*size,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:C(alpha),rotation});
 }
 const teleEnd=gold?arrival+fade:start+fade;
 add('telegraph','telegraph',gold?ground:from,0,teleEnd,C(age/45)*C((teleEnd-age)/fade),gold?'target':'origin');
 const direction=to.x>=from.x?1:-1;
 const count=volley?(j.light||j.reduced?3:7):1;
 for(let i=0;i<count;i++){
  const delay=volley?i*22:0,begin=start+delay,contact=arrival+delay,end=contact+fade;
  if(age<begin||age>=end)continue;
  const p=C((age-begin)/(contact-begin)),slot=i-(count-1)/2;
  const origin=volley?{x:from.x-direction*(42+Math.abs(slot)*7),y:from.y-35+slot*19}:from;
  const target=gold?ground:{x:to.x,y:to.y+(volley?slot*3:0)};
  const pos=gold?{x:ground.x,y:ground.y-190*(1-p)}:{x:origin.x+(target.x-origin.x)*p,y:origin.y+(target.y-origin.y)*p};
  const rotation=gold?0:Math.atan2(target.y-origin.y,target.x-origin.x);
  add('body:'+i,'body',pos,begin,end,C((age-begin)/fade)*C((end-age)/fade),'moving',rotation);
  // Presentation-only late sword contacts never create extra damage events.
 }
 if(hit===null||age<hit)return out;
 const lastDelay=volley?(count-1)*22:0,contactEnd=hit+240+lastDelay;
 const point=gold?ground:to;
 add('impact','impact',point,hit,contactEnd,C((age-hit)/fade)*C((contactEnd-age)/60),'target');
 const residueStart=contactEnd-60,residueEnd=residueStart+300;
 add('residue','residue',gold?ground:{x:to.x+6,y:to.y+12},residueStart,residueEnd,C((age-residueStart)/60)*C((residueEnd-age)/100),'target');
 return out;
}
if(typeof module!=='undefined')module.exports={sampleSwordBatch};
if(root)root.sampleSwordBatch=sampleSwordBatch;
})(typeof window!=='undefined'?window:null);
