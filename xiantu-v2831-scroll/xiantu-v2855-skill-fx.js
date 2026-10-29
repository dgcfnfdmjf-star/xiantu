/* V28.68 · 墨意斗法. Visuals only: no combat timers, RNG, damage or paid calls. */
(function(){
  'use strict';
  const W=window, D=document, TAU=Math.PI*2, KEY='xiantu_skill_fx_v2854';
  const palettes={sword:['#a7d5cf','#f5e7b4','#284d50'],heal:['#8dbfa0','#f6e4b0','#31594b'],ice:['#b6d7e0','#eff5dd','#3b6578'],fire:['#d88b57','#f8dda3','#824b43'],thunder:['#b9adcf','#f8e6bc','#595075'],earth:['#bda674','#f3deaa','#685b45'],spear:['#dfc48a','#fff2c9','#61553c'],dark:['#b9a4be','#ddc8cb','#564757'],blood:['#c77678','#f3cab0','#723e4c'],spirit:['#a6c9b9','#e8e5bd','#3b5b55']};
  const styles={御剑术:'blade',清风剑诀:'blade',剑气纵横:'fan',万剑归宗:'rain',天地一剑:'great',破甲剑罡:'pierce',追魂一剑:'pierce',饮血剑诀:'return',玄罡护体剑:'guardblade',镇岳山河震:'mountain',穿云贯日:'lance',凝露诀:'dew',治愈术:'dew',回春术:'dew',灵泉归元:'spring',青莲护心:'lotus',生生不息:'lotus',莲华济世:'lotus',逆命回元:'revive',起死回生:'revive'};
  const forms={'九霄雷云':'storm','雷法':'bolt','惊雷闪':'dart','裂地奔雷':'ground','紫霄落雷':'bolt','万雷噬狱':'cage','九天神雷':'storm','闪电链':'chain','雷神附体':'armor','雷神附体·反噬':'bolt','无音神雷':'silent','寒冰掌':'frost','冰封千里':'field','绝对零度':'prison','玄冰刺':'icicle','冰爆术':'burst','霜寒结界':'field','冰蝶幻舞':'butterfly','霜龙吐息':'breath','冰河葬狱':'prison','寒渊领域':'field','冰甲护身':'armor','冰魄封魂':'seal','万载寒晶':'crystal','烈焰斩':'slash','焚天烈焰':'pillar','天火焚世':'meteor','炎爆术':'burst','红莲业火':'lotus','火墙术':'wall','三昧真火':'triple','赤焰龙息':'breath','焚心炎':'heart','燎原火域':'field','太阳真火':'sun','流火飞索':'bind','炎阳护盾':'armor'};
  // BEGIN FIRE BATCH GENERATED
  const FIRE_BATCH=[{"key":"flame_slash","name":"烈焰斩","element":"fire","visualArchetype":"projectile","layers":{"telegraph":{"file":"flame_slash_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"flame_slash_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":true,"holdLast":false},"impact":{"file":"flame_slash_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"flame_slash_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.72,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":248,"body":215,"impact":190,"residue":180,"detonation":350},"acceptance":["Independent authored master and stage plates; source-over compositing","Impact and conditional detonation require acknowledged events","Fixed moving size; ground registered pillar; no combat mutations"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":248,"height":248,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":215,"height":215,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":190,"height":190,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":180,"height":180,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"flame_burst","name":"炎爆术","element":"fire","visualArchetype":"projectile","layers":{"telegraph":{"file":"flame_burst_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"flame_burst_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":true,"holdLast":false},"impact":{"file":"flame_burst_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"flame_burst_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.72,"fps":30,"loop":false,"holdLast":false},"detonation":{"file":"flame_burst_detonation.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"impactMs":180,"aftermathMs":650,"durationMs":1100},"display":{"telegraph":180,"body":155,"impact":190,"residue":180,"detonation":350},"acceptance":["Independent authored master and stage plates; source-over compositing","Impact and conditional detonation require acknowledged events","Fixed moving size; ground registered pillar; no combat mutations"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":180,"height":180,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":155,"height":155,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":190,"height":190,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.8727272727272727,"anchor":"target","width":180,"height":180,"fadeIn":0.0784313725490196,"fadeOut":0.0784313725490196}}}},{"key":"flame_pillar","name":"焚天烈焰","element":"fire","visualArchetype":"ground-eruption","layers":{"telegraph":{"file":"flame_pillar_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.72,"fps":30,"loop":false,"holdLast":false},"body":{"file":"flame_pillar_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.8,"fps":30,"loop":true,"holdLast":false},"impact":{"file":"flame_pillar_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.72,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"flame_pillar_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.72,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"impactMs":180,"aftermathMs":650,"durationMs":1100},"display":{"telegraph":155,"body":350,"impact":190,"residue":180,"detonation":350},"acceptance":["Independent authored master and stage plates; source-over compositing","Impact and conditional detonation require acknowledged events","Fixed moving size; ground registered pillar; no combat mutations"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":155,"height":155,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6454545454545455,"anchor":"target","width":350,"height":350,"fadeIn":0.1,"fadeOut":0.1},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":190,"height":190,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5909090909090909,"end":0.8727272727272727,"anchor":"target","width":180,"height":180,"fadeIn":0.12903225806451613,"fadeOut":0.12903225806451613}}}}];
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
  // END FIRE BATCH GENERATED
  // BEGIN FIRE BATCH2 GENERATED
  const FIRE_BATCH2=[{"key":"karmic_lotus","name":"红莲业火","element":"fire","visualArchetype":"ground-eruption","layers":{"telegraph":{"file":"karmic_lotus_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"body":{"file":"karmic_lotus_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"karmic_lotus_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"karmic_lotus_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"status":{"file":"karmic_lotus_status.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":8,"loop":true,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":620,"durationMs":2400},"display":{"telegraph":115,"body":285,"impact":245,"residue":245,"status":49},"acceptance":["Independent authored master and stage plates; source-over","Authoritative hit event; same living target state for lotus mark","Fixed moving size; target ground registration; no combat writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":115,"height":115,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":285,"height":285,"fadeIn":0.1111111111111111,"fadeOut":0.16666666666666666},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":245,"height":245,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8454545454545455,"anchor":"target","width":245,"height":245,"fadeIn":0.125,"fadeOut":0.125},"status":{"start":0.8454545454545455,"end":1,"anchor":"target","width":49,"height":49,"fadeIn":0,"fadeOut":0}}}},{"key":"ember_wall","name":"火墙术","element":"fire","visualArchetype":"ground-eruption","layers":{"telegraph":{"file":"ember_wall_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"body":{"file":"ember_wall_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"ember_wall_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"ember_wall_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":580,"durationMs":2400},"display":{"telegraph":350,"body":365,"impact":310,"residue":330},"acceptance":["Independent authored master and stage plates; source-over","Authoritative hit event; same living target state for lotus mark","Fixed moving size; target ground registration; no combat writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":350,"height":350,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":365,"height":365,"fadeIn":0.1111111111111111,"fadeOut":0.16666666666666666},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":310,"height":310,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8090909090909091,"anchor":"target","width":330,"height":330,"fadeIn":0.14285714285714285,"fadeOut":0.14285714285714285}}}},{"key":"samadhi_fire","name":"三昧真火","element":"fire","visualArchetype":"projectile","layers":{"telegraph":{"file":"samadhi_fire_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"samadhi_fire_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"samadhi_fire_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"samadhi_fire_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":2400},"display":{"telegraph":150,"body":210,"impact":190,"residue":200},"acceptance":["Independent authored master and stage plates; source-over","Authoritative hit event; same living target state for lotus mark","Fixed moving size; target ground registration; no combat writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":150,"height":150,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":210,"height":210,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":190,"height":190,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":200,"height":200,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}}];
/* Read-only resource choreography; all hit and burn state belongs to the caller. */
function sampleFireBatch2(D, j, age) {
 const clamp=v=>Math.max(0,Math.min(1,v)),T=D.timing,out=[];
 if(age<0||j.hidden||j.exited||j.alive===false||j.sameTarget===false)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const ground=D.visualArchetype==='ground-eruption',lotus=D.key==='karmic_lotus';
 const from=j.from,to=j.to,foot=j.toGround??to,scale=(j.scale??1)*D.scale;
 function add(layer,p,start,duration,alpha,anchor='target'){
  if(alpha<=0||age<start||age>=start+duration)return;
  const L=D.layers[layer],elapsed=age-start;
  let frame=L.loop?Math.floor(elapsed*L.fps/1000)%L.frames:Math.min(L.frames-1,Math.floor(elapsed/duration*L.frames));
  if(j.reduced)frame=Math.min(2,L.frames-1);
  out.push({id:layer,layer,anchor,x:p.x+(j.offsetX??0)+D.offsetX,y:p.y+(j.offsetY??0)+D.offsetY,width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:clamp(alpha),rotation:!ground&&layer!=='residue'&&to.x<from.x?Math.PI:0});
 }
 const fade=T.crossfadeMs,shortEnd=hit===null?arrival+fade:hit+T.aftermathMs;
 if(age<Math.min(shortEnd,j.duration??Infinity)){
  if(ground){
   add('telegraph',foot,0,arrival+fade,clamp(age/35)*clamp((arrival+fade-age)/fade));
  }else{
   const gather=arrival*T.gatherMs/T.arrivalMs,blend=clamp((age-gather)/fade);
   const p=clamp((age-gather-fade)/Math.max(1,arrival-gather-fade));
   add('telegraph',from,0,gather+fade,clamp(age/30)*(1-blend),'origin');
   if(!j.reduced)add('body',{x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p},gather,arrival+fade-gather,blend*clamp((arrival+fade-age)/fade),'moving');
  }
  if(hit!==null&&age>=hit){
   const e=age-hit;
   if(ground){
    add('body',foot,hit,T.bodyMs,clamp(e/fade)*clamp((T.bodyMs-e)/60));
    if(!j.light&&!j.reduced)add('impact',foot,hit,180,clamp(e/fade)*clamp((180-e)/60)*.6);
    add('residue',foot,hit+300,T.aftermathMs-300,clamp((e-300)/60)*clamp((T.aftermathMs-e)/120));
   }else{
    add('impact',to,hit,180,clamp(e/fade)*clamp((180-e)/40));
    add('residue',foot,hit+140,T.aftermathMs-140,clamp((e-140)/40)*clamp((T.aftermathMs-e)/120));
   }
  }
 }
 // Preview feeds the same state fields required by the eventual runtime owner.
 // Time alone never expires a real burn, and repeated fire never restarts this loop.
 const state=j.burn;
 if(lotus&&hit!==null&&age>=shortEnd&&state?.burnTurns>0&&state?.burnStacks>0&&state?._burnHealBlockV286818)
  add('status',foot,shortEnd,Infinity,1);
 return out;
}
if(typeof module!=='undefined')module.exports={sampleFireBatch2};
  // END FIRE BATCH2 GENERATED
  // BEGIN ELEMENT BATCH GENERATED
  const ELEMENT_BATCH=[{"key":"thunder_strike","name":"雷法","element":"thunder","visualArchetype":"ground-eruption","skills":[],"layers":{"telegraph":{"file":"thunder_strike_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"thunder_strike_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"thunder_strike_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"thunder_strike_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":210,"body":330,"impact":270,"residue":230},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":210,"height":210,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":330,"height":330,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":270,"height":270,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":230,"height":230,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"sword_qi","name":"御剑术","element":"sword","visualArchetype":"projectile","skills":["追魂一剑","饮血剑诀","玄罡护体剑"],"layers":{"telegraph":{"file":"sword_qi_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"sword_qi_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"sword_qi_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"sword_qi_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":150,"body":215,"impact":220,"residue":190},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":150,"height":150,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":215,"height":215,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":220,"height":220,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":190,"height":190,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"jade_lotus_heal","name":"回春术","element":"heal","visualArchetype":"ground-eruption","skills":["回春术","治愈术","生生不息","起死回生","凝露诀","青莲护心","灵泉归元","逆命回元","莲华济世"],"layers":{"telegraph":{"file":"jade_lotus_heal_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"jade_lotus_heal_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"jade_lotus_heal_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"jade_lotus_heal_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":200,"body":290,"impact":250,"residue":210},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":200,"height":200,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":290,"height":290,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":250,"height":250,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":210,"height":210,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"frost_palm","name":"寒冰掌","element":"ice","visualArchetype":"projectile","skills":["寒冰掌"],"layers":{"telegraph":{"file":"frost_palm_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"frost_palm_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"frost_palm_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"frost_palm_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":160,"body":210,"impact":230,"residue":190},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":160,"height":160,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":210,"height":210,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":230,"height":230,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":190,"height":190,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"ice_spike","name":"玄冰刺","element":"ice","visualArchetype":"projectile","skills":["玄冰刺"],"layers":{"telegraph":{"file":"ice_spike_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"ice_spike_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"ice_spike_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"ice_spike_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":160,"body":220,"impact":230,"residue":200},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":160,"height":160,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":220,"height":220,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":230,"height":230,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":200,"height":200,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"ice_burst","name":"冰爆术","element":"ice","visualArchetype":"ground-eruption","skills":["冰爆术"],"layers":{"telegraph":{"file":"ice_burst_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"ice_burst_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"ice_burst_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"ice_burst_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":190,"body":250,"impact":290,"residue":220},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":190,"height":190,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":250,"height":250,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":290,"height":290,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":220,"height":220,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"frost_dragon_breath","name":"霜龙吐息","element":"ice","visualArchetype":"projectile","skills":["霜龙吐息"],"layers":{"telegraph":{"file":"frost_dragon_breath_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"frost_dragon_breath_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"frost_dragon_breath_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"frost_dragon_breath_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":170,"body":250,"impact":250,"residue":210},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":170,"height":170,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":250,"height":250,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":250,"height":250,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":210,"height":210,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"frozen_expanse","name":"冰封千里","element":"ice","visualArchetype":"ground-eruption","skills":["冰封千里"],"layers":{"telegraph":{"file":"frozen_expanse_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"frozen_expanse_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"frozen_expanse_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"frozen_expanse_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":260,"body":340,"impact":300,"residue":270},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":260,"height":260,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":340,"height":340,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":300,"height":300,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":270,"height":270,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"frost_barrier","name":"霜寒结界","element":"ice","visualArchetype":"ground-eruption","skills":["霜寒结界"],"layers":{"telegraph":{"file":"frost_barrier_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"frost_barrier_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"frost_barrier_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"frost_barrier_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":220,"body":280,"impact":260,"residue":230},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":220,"height":220,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":280,"height":280,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":260,"height":260,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":230,"height":230,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"glacier_prison","name":"冰河葬狱","element":"ice","visualArchetype":"ground-eruption","skills":["冰河葬狱"],"layers":{"telegraph":{"file":"glacier_prison_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"glacier_prison_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"glacier_prison_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"glacier_prison_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":220,"body":310,"impact":280,"residue":230},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":220,"height":220,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":310,"height":310,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":280,"height":280,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":230,"height":230,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"abyss_domain","name":"寒渊领域","element":"ice","visualArchetype":"ground-eruption","skills":["寒渊领域"],"layers":{"telegraph":{"file":"abyss_domain_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"abyss_domain_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"abyss_domain_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"abyss_domain_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":240,"body":320,"impact":280,"residue":240},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":240,"height":240,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":320,"height":320,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":280,"height":280,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":240,"height":240,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"soul_seal","name":"冰魄封魂","element":"ice","visualArchetype":"ground-eruption","skills":["冰魄封魂"],"layers":{"telegraph":{"file":"soul_seal_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"soul_seal_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"soul_seal_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"soul_seal_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":220,"body":300,"impact":270,"residue":230},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":220,"height":220,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":300,"height":300,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":270,"height":270,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":230,"height":230,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"eternal_crystal","name":"万载寒晶","element":"ice","visualArchetype":"ground-eruption","skills":["万载寒晶"],"layers":{"telegraph":{"file":"eternal_crystal_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"eternal_crystal_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"eternal_crystal_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"eternal_crystal_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":220,"body":320,"impact":270,"residue":230},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":220,"height":220,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":320,"height":320,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":270,"height":270,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":230,"height":230,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"frost_armor","name":"冰甲护身","element":"ice","visualArchetype":"ground-eruption","skills":["冰甲护身"],"layers":{"telegraph":{"file":"frost_armor_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"frost_armor_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"frost_armor_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"frost_armor_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":200,"body":270,"impact":250,"residue":210},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":200,"height":200,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":270,"height":270,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":250,"height":250,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":210,"height":210,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"solar_aegis","name":"炎阳护盾","element":"fire","visualArchetype":"ground-eruption","skills":["炎阳护盾"],"layers":{"telegraph":{"file":"solar_aegis_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"solar_aegis_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"solar_aegis_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"solar_aegis_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":200,"body":270,"impact":250,"residue":210},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":200,"height":200,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":270,"height":270,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":250,"height":250,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":210,"height":210,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"flame_bind","name":"流火飞索","element":"fire","visualArchetype":"projectile","skills":["流火飞索"],"layers":{"telegraph":{"file":"flame_bind_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"flame_bind_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"flame_bind_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"flame_bind_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":160,"body":220,"impact":230,"residue":200},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":160,"height":160,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":220,"height":220,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":230,"height":230,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":200,"height":200,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"mountain_quake","name":"镇岳山河震","element":"earth","visualArchetype":"ground-eruption","skills":["镇岳山河震"],"layers":{"telegraph":{"file":"mountain_quake_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"body":{"file":"mountain_quake_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"mountain_quake_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"mountain_quake_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":600,"durationMs":1100},"display":{"telegraph":220,"body":320,"impact":280,"residue":230},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"ground-eruption","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3181818181818182,"anchor":"target","width":220,"height":220,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.2818181818181818,"end":0.6090909090909091,"anchor":"target","width":320,"height":320,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":280,"height":280,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.5545454545454546,"end":0.8272727272727273,"anchor":"target","width":230,"height":230,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}},{"key":"sun_spear","name":"穿云贯日","element":"spear","visualArchetype":"projectile","skills":["穿云贯日"],"layers":{"telegraph":{"file":"sun_spear_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"sun_spear_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"sun_spear_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"sun_spear_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.78125,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherMs":100,"crossfadeMs":40,"bodyMs":360,"impactMs":180,"aftermathMs":440,"durationMs":1100},"display":{"telegraph":160,"body":240,"impact":240,"residue":200},"acceptance":["Independent authored 3x3 stage plates per family; source-over","Impact waits for the authoritative hit event; self casts anchor on the caster foot","Shared textures per family; no combat, RNG or timer writes"],"preview":{"displayMode":"projectile","durationMs":1100,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12727272727272726,"anchor":"origin","width":160,"height":160,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.09090909090909091,"end":0.3181818181818182,"anchor":"moving","width":240,"height":240,"fadeIn":0.16,"fadeOut":0.16},"impact":{"start":0.2818181818181818,"end":0.44545454545454544,"anchor":"target","width":240,"height":240,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.4090909090909091,"end":0.6818181818181818,"anchor":"target","width":200,"height":200,"fadeIn":0.13333333333333333,"fadeOut":0.13333333333333333}}}}];
  // END ELEMENT BATCH GENERATED
  // BEGIN FIRE BATCH3 GENERATED
  const FIRE_BATCH3=[{"key":"heaven_meteor","name":"天火焚世","element":"fire","visualArchetype":"falling","layers":{"telegraph":{"file":"heaven_meteor_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"body":{"file":"heaven_meteor_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"heaven_meteor_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"heaven_meteor_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"crossfadeMs":40,"aftermathMs":580,"durationMs":2400},"display":{"telegraph":250,"body":220,"impact":325,"residue":180},"acceptance":["Independent approved raster material; source-over","Fixed-size travel; authoritative hit gates contact","Single target burn owner; no combat mutation or timers"],"preview":{"displayMode":"falling","durationMs":2400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.14583333333333334,"anchor":"target","width":250,"height":250,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.03333333333333333,"end":0.14583333333333334,"anchor":"moving","width":220,"height":220,"fadeIn":0.14814814814814814,"fadeOut":0.14814814814814814},"impact":{"start":0.12916666666666668,"end":0.22083333333333333,"anchor":"target","width":325,"height":325,"fadeIn":0.18181818181818182,"fadeOut":0.18181818181818182},"residue":{"start":0.20416666666666666,"end":0.37083333333333335,"anchor":"target","width":180,"height":180,"fadeIn":0.1,"fadeOut":0.1}}}},{"key":"dragon_breath","name":"赤焰龙息","element":"fire","visualArchetype":"moving-front","layers":{"telegraph":{"file":"dragon_breath_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"body":{"file":"dragon_breath_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"dragon_breath_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"dragon_breath_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"source":{"file":"dragon_breath_source.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"crossfadeMs":40,"aftermathMs":480,"durationMs":2400},"display":{"telegraph":105,"source":105,"body":132,"impact":155,"residue":180},"acceptance":["Independent approved raster material; source-over","Fixed-size travel; authoritative hit gates contact","Single target burn owner; no combat mutation or timers"],"preview":{"displayMode":"moving-front","durationMs":2400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.058333333333333334,"anchor":"origin","width":105,"height":105,"fadeIn":0.2857142857142857,"fadeOut":0.2857142857142857},"body":{"start":0.041666666666666664,"end":0.14583333333333334,"anchor":"moving","width":132,"height":132,"fadeIn":0.16,"fadeOut":0.16},"source":{"start":0.041666666666666664,"end":0.17083333333333334,"anchor":"origin","width":105,"height":105,"fadeIn":0.12903225806451613,"fadeOut":0.12903225806451613},"impact":{"start":0.12916666666666668,"end":0.20416666666666666,"anchor":"target","width":155,"height":155,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222},"residue":{"start":0.1875,"end":0.32916666666666666,"anchor":"target","width":180,"height":180,"fadeIn":0.11764705882352941,"fadeOut":0.11764705882352941}}}},{"key":"wildfire_domain","name":"燎原火域","element":"fire","visualArchetype":"ground-eruption","layers":{"telegraph":{"file":"wildfire_domain_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"body":{"file":"wildfire_domain_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"impact":{"file":"wildfire_domain_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"residue":{"file":"wildfire_domain_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":30,"loop":false,"holdLast":false},"status":{"file":"wildfire_domain_status.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.75,"fps":8,"loop":true,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"crossfadeMs":40,"aftermathMs":620,"durationMs":2400},"display":{"telegraph":240,"body":300,"impact":255,"residue":300,"status":130},"acceptance":["Independent approved raster material; source-over","Fixed-size travel; authoritative hit gates contact","Single target burn owner; no combat mutation or timers"],"preview":{"displayMode":"ground-eruption","durationMs":2400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.14583333333333334,"anchor":"target","width":240,"height":240,"fadeIn":0.11428571428571428,"fadeOut":0.11428571428571428},"body":{"start":0.12916666666666668,"end":0.2791666666666667,"anchor":"target","width":300,"height":300,"fadeIn":0.1111111111111111,"fadeOut":0.1111111111111111},"impact":{"start":0.12916666666666668,"end":0.19583333333333333,"anchor":"target","width":255,"height":255,"fadeIn":0.25,"fadeOut":0.25},"residue":{"start":0.25416666666666665,"end":0.3875,"anchor":"target","width":300,"height":300,"fadeIn":0.125,"fadeOut":0.125},"status":{"start":0.3625,"end":1.0,"anchor":"target","width":130,"height":130,"fadeIn":0.026143790849673203,"fadeOut":0}}}}];
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
  // END FIRE BATCH3 GENERATED
  // BEGIN THUNDER BATCH1 GENERATED
  const THUNDER_BATCH=[{"key":"thunder_strike_unique","name":"雷法","element":"thunder","visualArchetype":"falling","layers":{"telegraph":{"file":"thunder_strike_unique_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":9.523809523809524,"loop":false,"holdLast":false},"body":{"file":"thunder_strike_unique_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":31.007751937984494,"loop":false,"holdLast":false},"impact":{"file":"thunder_strike_unique_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":30.0,"loop":false,"holdLast":false},"residue":{"file":"thunder_strike_unique_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":20.0,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":180,"body":240,"impact":190,"residue":150},"timing":{"arrivalMs":360,"gatherRatio":0.45,"crossfadeMs":60,"impactMs":200,"aftermathMs":440,"durationMs":800,"fallDistance":55},"acceptance":["Authored independent master and keyplates; normal source-over","Fixed body size and attached painted trail; actual target only","Impact requires acknowledged hit; no combat writes or RNG"],"preview":{"displayMode":"falling","durationMs":800,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.525,"anchor":"target","width":180,"height":180,"fadeIn":0.14285714285714285,"fadeOut":0.14285714285714285},"body":{"start":0.2025,"end":0.525,"anchor":"moving","width":240,"height":240,"fadeIn":0.23255813953488372,"fadeOut":0.23255813953488372},"impact":{"start":0.45,"end":0.7,"anchor":"target","width":190,"height":190,"fadeIn":0.3,"fadeOut":0.3},"residue":{"start":0.625,"end":1.0,"anchor":"target","width":150,"height":150,"fadeIn":0.2,"fadeOut":0.2}}}},{"key":"thunder_flash","name":"惊雷闪","element":"thunder","visualArchetype":"projectile","layers":{"telegraph":{"file":"thunder_flash_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":19.607843137254903,"loop":false,"holdLast":false},"body":{"file":"thunder_flash_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.7578125,"pivotY":0.5,"fps":33.898305084745765,"loop":false,"holdLast":false},"impact":{"file":"thunder_flash_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":30.0,"loop":false,"holdLast":false},"residue":{"file":"thunder_flash_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":20.0,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":110,"body":190,"impact":190,"residue":150},"timing":{"arrivalMs":320,"gatherRatio":0.45,"crossfadeMs":60,"impactMs":200,"aftermathMs":440,"durationMs":760,"fallDistance":55},"acceptance":["Authored independent master and keyplates; normal source-over","Fixed body size and attached painted trail; actual target only","Impact requires acknowledged hit; no combat writes or RNG"],"preview":{"displayMode":"projectile","durationMs":760,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.26842105263157895,"anchor":"origin","width":110,"height":110,"fadeIn":0.29411764705882354,"fadeOut":0.29411764705882354},"body":{"start":0.18947368421052632,"end":0.5,"anchor":"moving","width":190,"height":190,"fadeIn":0.2542372881355932,"fadeOut":0.2542372881355932},"impact":{"start":0.42105263157894735,"end":0.6842105263157895,"anchor":"target","width":190,"height":190,"fadeIn":0.3,"fadeOut":0.3},"residue":{"start":0.6052631578947368,"end":1.0,"anchor":"target","width":150,"height":150,"fadeIn":0.2,"fadeOut":0.2}}}},{"key":"ground_thunder","name":"裂地奔雷","element":"thunder","visualArchetype":"moving-front","layers":{"telegraph":{"file":"ground_thunder_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":15.503875968992247,"loop":false,"holdLast":false},"body":{"file":"ground_thunder_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.7578125,"pivotY":0.71875,"fps":26.490066225165563,"loop":false,"holdLast":false},"impact":{"file":"ground_thunder_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":30.0,"loop":false,"holdLast":false},"residue":{"file":"ground_thunder_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":20.0,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":110,"body":230,"impact":190,"residue":150},"timing":{"arrivalMs":440,"gatherRatio":0.45,"crossfadeMs":60,"impactMs":200,"aftermathMs":440,"durationMs":880,"fallDistance":55},"acceptance":["Authored independent master and keyplates; normal source-over","Fixed body size and attached painted trail; actual target only","Impact requires acknowledged hit; no combat writes or RNG"],"preview":{"displayMode":"moving-front","durationMs":880,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.29318181818181815,"anchor":"origin","width":110,"height":110,"fadeIn":0.23255813953488372,"fadeOut":0.23255813953488372},"body":{"start":0.225,"end":0.5681818181818182,"anchor":"moving","width":230,"height":230,"fadeIn":0.1986754966887417,"fadeOut":0.1986754966887417},"impact":{"start":0.5,"end":0.7272727272727273,"anchor":"target","width":190,"height":190,"fadeIn":0.3,"fadeOut":0.3},"residue":{"start":0.6590909090909091,"end":1.0,"anchor":"target","width":150,"height":150,"fadeIn":0.2,"fadeOut":0.2}}}}];
/* Pure sprite choreography. Caller owns damage, hit timestamps, state and targets. */
function sampleThunderBatch(D,j,age){
 const clamp=v=>Math.max(0,Math.min(1,v)),T=D.timing,out=[];
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const fade=T.crossfadeMs,start=arrival*T.gatherRatio,ground=j.toGround??j.to,front=D.visualArchetype==='moving-front',fall=D.visualArchetype==='falling';
 const from=front?(j.fromGround??j.from):j.from,to=front||fall?ground:j.to;
 const end=hit===null?arrival+fade:arrival+T.aftermathMs;
 if(age<0||age>=Math.min(end,j.duration??Infinity))return out;
 const scale=(j.scale??1)*D.scale;
 function add(layer,p,begin,duration,alpha,anchor){
  if(alpha<=0||age<begin||age>=begin+duration)return;
  const L=D.layers[layer],progress=(age-begin)/duration;
  out.push({id:layer,layer,anchor,x:p.x+D.offsetX+(j.offsetX??0),y:p.y+D.offsetY+(j.offsetY??0),width:D.display[layer]*scale,height:D.display[layer]*scale,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor(progress*L.frames)),opacity:clamp(alpha),rotation:0,flipX:!fall&&to.x<from.x});
 }
 const teleEnd=fall?arrival+fade:start+fade;
 add('telegraph',fall?ground:from,0,teleEnd,clamp(age/60)*clamp((teleEnd-age)/fade)*.8,fall?'target':'origin');
 if(!j.reduced){
  const progress=clamp((age-start-fade)/Math.max(1,arrival-start-fade));
  const p=fall?{x:ground.x,y:ground.y-T.fallDistance*(1-progress)}:{x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress};
  add('body',p,start,arrival+fade-start,clamp((age-start)/fade)*clamp((arrival+fade-age)/fade),'moving');
 }
 if(hit===null||age<hit)return out;
 const elapsed=age-hit;
 add('impact',to,hit,T.impactMs,clamp(elapsed/fade)*clamp((T.impactMs-elapsed)/fade),'target');
 if(!j.light&&!j.reduced)add('residue',to,hit+T.impactMs-fade,T.aftermathMs-T.impactMs+fade,clamp((elapsed-T.impactMs+fade)/fade)*clamp((T.aftermathMs-elapsed)/100),'target');
 return out;
}
if(typeof module!=='undefined')module.exports={sampleThunderBatch};

  // END THUNDER BATCH1 GENERATED
  // BEGIN THUNDER BATCH2 GENERATED
  const THUNDER_BATCH2=[{"key":"violet_judgement","name":"紫霄落雷","element":"thunder","visualArchetype":"falling","layers":{"telegraph":{"file":"violet_judgement_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":8.695652173913043,"loop":false,"holdLast":false},"body":{"file":"violet_judgement_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":28.571428571428573,"loop":false,"holdLast":false},"impact":{"file":"violet_judgement_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":30.0,"loop":false,"holdLast":false},"residue":{"file":"violet_judgement_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":20.0,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":160,"body":280,"impact":180,"residue":130},"timing":{"arrivalMs":400,"gatherRatio":0.45,"crossfadeMs":60,"impactMs":200,"aftermathMs":440,"durationMs":840,"fallDistance":60},"acceptance":["Authored independent master and keyplates; normal source-over","Fixed body size and attached painted trail; actual target only","Impact requires acknowledged hit; no combat writes or RNG"],"preview":{"displayMode":"falling","durationMs":840,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.5476190476190477,"anchor":"target","width":160,"height":160,"fadeIn":0.13043478260869565,"fadeOut":0.13043478260869565},"body":{"start":0.21428571428571427,"end":0.5476190476190477,"anchor":"moving","width":280,"height":280,"fadeIn":0.21428571428571427,"fadeOut":0.21428571428571427},"impact":{"start":0.47619047619047616,"end":0.7142857142857143,"anchor":"target","width":180,"height":180,"fadeIn":0.3,"fadeOut":0.3},"residue":{"start":0.6428571428571429,"end":1.0,"anchor":"target","width":130,"height":130,"fadeIn":0.2,"fadeOut":0.2}}}},{"key":"silent_thunder","name":"无音神雷","element":"thunder","visualArchetype":"falling","layers":{"telegraph":{"file":"silent_thunder_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":12.5,"loop":false,"holdLast":false},"body":{"file":"silent_thunder_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":41.23711340206186,"loop":false,"holdLast":false},"impact":{"file":"silent_thunder_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":50.0,"loop":false,"holdLast":false},"residue":{"file":"silent_thunder_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":33.333333333333336,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":55,"body":240,"impact":65,"residue":55},"timing":{"arrivalMs":280,"gatherRatio":0.45,"crossfadeMs":40,"impactMs":120,"aftermathMs":260,"durationMs":540,"fallDistance":60},"acceptance":["Authored independent master and keyplates; normal source-over","Fixed body size and attached painted trail; actual target only","Impact requires acknowledged hit; no combat writes or RNG"],"preview":{"displayMode":"falling","durationMs":540,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.5925925925925926,"anchor":"target","width":55,"height":55,"fadeIn":0.125,"fadeOut":0.125},"body":{"start":0.23333333333333334,"end":0.5925925925925926,"anchor":"moving","width":240,"height":240,"fadeIn":0.20618556701030927,"fadeOut":0.20618556701030927},"impact":{"start":0.5185185185185185,"end":0.7407407407407407,"anchor":"target","width":65,"height":65,"fadeIn":0.3333333333333333,"fadeOut":0.3333333333333333},"residue":{"start":0.6666666666666666,"end":1.0,"anchor":"target","width":55,"height":55,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222}}}},{"key":"heavenly_thunder","name":"九天神雷","element":"thunder","visualArchetype":"falling","layers":{"telegraph":{"file":"heavenly_thunder_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":7.6923076923076925,"loop":false,"holdLast":false},"body":{"file":"heavenly_thunder_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25.559105431309906,"loop":false,"holdLast":false},"impact":{"file":"heavenly_thunder_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":30.0,"loop":false,"holdLast":false},"residue":{"file":"heavenly_thunder_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":20.0,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":200,"body":310,"impact":240,"residue":180},"timing":{"arrivalMs":460,"gatherRatio":0.45,"crossfadeMs":60,"impactMs":200,"aftermathMs":440,"durationMs":900,"fallDistance":60},"acceptance":["Authored independent master and keyplates; normal source-over","Fixed body size and attached painted trail; actual target only","Impact requires acknowledged hit; no combat writes or RNG"],"preview":{"displayMode":"falling","durationMs":900,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.5777777777777777,"anchor":"target","width":200,"height":200,"fadeIn":0.11538461538461539,"fadeOut":0.11538461538461539},"body":{"start":0.23,"end":0.5777777777777777,"anchor":"moving","width":310,"height":310,"fadeIn":0.19169329073482427,"fadeOut":0.19169329073482427},"impact":{"start":0.5111111111111111,"end":0.7333333333333333,"anchor":"target","width":240,"height":240,"fadeIn":0.3,"fadeOut":0.3},"residue":{"start":0.6666666666666666,"end":1.0,"anchor":"target","width":180,"height":180,"fadeIn":0.2,"fadeOut":0.2}}}}];
  // END THUNDER BATCH2 GENERATED
  // BEGIN THUNDER BATCH3 GENERATED
  const THUNDER_BATCH3=[{"key":"chain_lightning","name":"闪电链","element":"thunder","visualArchetype":"target-beam","layers":{"telegraph":{"file":"chain_lightning_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"body":{"file":"chain_lightning_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":10,"loop":false,"holdLast":false},"impact":{"file":"chain_lightning_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"residue":{"file":"chain_lightning_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"event":{"file":"chain_lightning_event.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":100,"body":400,"impact":120,"residue":110,"event":110},"timing":{"arrivalMs":340,"gatherRatio":0.45,"crossfadeMs":80,"impactMs":240,"aftermathMs":520,"durationMs":3400,"loopMs":800,"outroMs":300,"cloudHeight":145},"acceptance":["Independent authored master and six stage plates; source-over","State lifetime and event timestamps supplied by caller; no gameplay writes","Shared domain ownership must be resolved during integration; no invented chain targets"],"preview":{"displayMode":"target-beam","durationMs":3400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.06852941176470588,"anchor":"origin","width":100,"height":100,"fadeIn":0.34334763948497854,"fadeOut":0.34334763948497854},"body":{"start":0.045,"end":0.12352941176470589,"anchor":"moving","width":400,"height":400,"fadeIn":0.299625468164794,"fadeOut":0.299625468164794},"impact":{"start":0.1,"end":0.17058823529411765,"anchor":"target","width":120,"height":120,"fadeIn":0.3333333333333333,"fadeOut":0.3333333333333333},"residue":{"start":0.14705882352941177,"end":0.2529411764705882,"anchor":"target","width":110,"height":110,"fadeIn":0.2222222222222222,"fadeOut":0.2222222222222222}}}},{"key":"thunder_prison","name":"万雷噬狱","element":"thunder","visualArchetype":"persistent-zone","layers":{"telegraph":{"file":"thunder_prison_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false},"body":{"file":"thunder_prison_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":10,"loop":true,"holdLast":false},"impact":{"file":"thunder_prison_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false},"residue":{"file":"thunder_prison_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false},"event":{"file":"thunder_prison_event.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":300,"body":350,"impact":310,"residue":280,"event":270},"timing":{"arrivalMs":430,"gatherRatio":0.45,"crossfadeMs":80,"impactMs":240,"aftermathMs":520,"durationMs":3400,"loopMs":800,"outroMs":300,"cloudHeight":145},"acceptance":["Independent authored master and six stage plates; source-over","State lifetime and event timestamps supplied by caller; no gameplay writes","Shared domain ownership must be resolved during integration; no invented chain targets"],"preview":{"displayMode":"persistent-zone","durationMs":3400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.08044117647058824,"anchor":"target","width":300,"height":300,"fadeIn":0.29250457038391225,"fadeOut":0.29250457038391225},"body":{"start":0.056911764705882356,"end":0.788235294117647,"anchor":"target","width":350,"height":350,"fadeIn":0.03217373818620551,"fadeOut":0.03217373818620551},"impact":{"start":0.1264705882352941,"end":0.19705882352941176,"anchor":"target","width":310,"height":310,"fadeIn":0.3333333333333333,"fadeOut":0.3333333333333333},"residue":{"start":0.7647058823529411,"end":0.8529411764705882,"anchor":"target","width":280,"height":280,"fadeIn":0.26666666666666666,"fadeOut":0.26666666666666666}}}},{"key":"thunder_mantle","name":"雷神附体","element":"thunder","visualArchetype":"shield-orbit","layers":{"telegraph":{"file":"thunder_mantle_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false},"body":{"file":"thunder_mantle_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":10,"loop":true,"holdLast":false},"impact":{"file":"thunder_mantle_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"residue":{"file":"thunder_mantle_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"event":{"file":"thunder_mantle_event.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":150,"body":270,"impact":210,"residue":200,"event":150,"reflectImpact":70},"timing":{"arrivalMs":360,"gatherRatio":0.45,"crossfadeMs":80,"impactMs":240,"aftermathMs":520,"durationMs":3400,"loopMs":800,"outroMs":300,"cloudHeight":145},"acceptance":["Independent authored master and six stage plates; source-over","State lifetime and event timestamps supplied by caller; no gameplay writes","Shared domain ownership must be resolved during integration; no invented chain targets"],"preview":{"displayMode":"shield-orbit","durationMs":3400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.0711764705882353,"anchor":"origin","width":150,"height":150,"fadeIn":0.3305785123966942,"fadeOut":0.3305785123966942},"body":{"start":0.04764705882352941,"end":0.788235294117647,"anchor":"origin","width":270,"height":270,"fadeIn":0.03177124702144559,"fadeOut":0.03177124702144559},"impact":{"start":0.10588235294117647,"end":0.17647058823529413,"anchor":"origin","width":210,"height":210,"fadeIn":0.3333333333333333,"fadeOut":0.3333333333333333},"residue":{"start":0.7647058823529411,"end":0.8529411764705882,"anchor":"origin","width":200,"height":200,"fadeIn":0.26666666666666666,"fadeOut":0.26666666666666666}}}},{"key":"high_cloud","name":"九霄雷云","element":"thunder","visualArchetype":"persistent-zone","layers":{"telegraph":{"file":"high_cloud_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"body":{"file":"high_cloud_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":10,"loop":true,"holdLast":false},"impact":{"file":"high_cloud_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false},"residue":{"file":"high_cloud_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":25,"loop":false,"holdLast":false},"event":{"file":"high_cloud_event.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.71875,"fps":25,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":140,"body":260,"impact":230,"residue":200,"event":270},"timing":{"arrivalMs":460,"gatherRatio":0.45,"crossfadeMs":80,"impactMs":240,"aftermathMs":520,"durationMs":3400,"loopMs":800,"outroMs":300,"cloudHeight":145},"acceptance":["Independent authored master and six stage plates; source-over","State lifetime and event timestamps supplied by caller; no gameplay writes","Shared domain ownership must be resolved during integration; no invented chain targets"],"preview":{"displayMode":"persistent-zone","durationMs":3400,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.08441176470588235,"anchor":"target","width":140,"height":140,"fadeIn":0.2787456445993031,"fadeOut":0.2787456445993031},"body":{"start":0.06088235294117647,"end":0.788235294117647,"anchor":"target","width":260,"height":260,"fadeIn":0.03234937323089365,"fadeOut":0.03234937323089365},"impact":{"start":0.13529411764705881,"end":0.20588235294117646,"anchor":"target","width":230,"height":230,"fadeIn":0.3333333333333333,"fadeOut":0.3333333333333333},"residue":{"start":0.7647058823529411,"end":0.8529411764705882,"anchor":"target","width":200,"height":200,"fadeIn":0.26666666666666666,"fadeOut":0.26666666666666666}}}}];
/* Resource-only pure choreography. All lifetimes/events come from caller, never from damage guesses. */
function sampleThunderBatch3(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v)),out=[];
 if(age<0||age>=(j.duration??Infinity)||j.destroyed)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const chain=D.key==='chain_lightning',mantle=D.key==='thunder_mantle',cloud=D.key==='high_cloud';
 const from=j.from,to=j.to,ground=j.toGround??to,fromGround=j.fromGround??from;
 const base=mantle?from:cloud?{x:ground.x,y:ground.y-(j.cloudHeight??T.cloudHeight)}:ground;
 const anchor=mantle?'origin':'target',start=arrival*T.gatherRatio,fade=T.crossfadeMs;
 const acknowledged=hit!==null&&age>=hit;
 const hasState=!chain&&hit!==null&&j.stateActive!==false;
 const stop=hasState?(j.stateEndAt??Infinity):arrival+(chain?180:240);
 const events=Array.isArray(j.events)?j.events:[];
 const eventEnd=hit===null||chain?0:events.reduce((end,ev)=>Number.isFinite(ev.at)&&ev.at>=hit&&ev.at<=stop&&ev.type===(mantle?'reflect':'tick')?Math.max(end,ev.at+(mantle?420:220)):end,0);
 const end=hit===null?arrival+fade:Math.max(arrival+T.aftermathMs,stop+T.outroMs,eventEnd);
 if(age>=end)return out;
 function add(layer,p,begin,end,alpha,id=layer,attach=anchor,loop=false,rotation=0,size){
  if(age<begin||age>=end||alpha<=0)return;
  const L=D.layers[layer],s=(j.scale??1)*D.scale,w=(size??D.display[layer])*s;
  const phase=loop?((age-begin)%T.loopMs)/T.loopMs:(age-begin)/(end-begin);
  out.push({id,layer,anchor:attach,x:p.x+D.offsetX+(j.offsetX??0),y:p.y+D.offsetY+(j.offsetY??0),width:w,height:w,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?0:Math.min(L.frames-1,Math.floor(phase*L.frames)),opacity:clamp(alpha),rotation,flipX:false});
 }
 const telePoint=chain?from:mantle?fromGround:base;
 const teleEnd=start+fade;
 add('telegraph',telePoint,0,teleEnd,clamp(age/80)*clamp((teleEnd-age)/fade), 'telegraph',chain||mantle?'origin':'target');
 if(chain){
  // Uniform size is selected once from real endpoint distance, never increased over time to fake travel.
  const length=Math.hypot(to.x-from.x,to.y-from.y),mid={x:(from.x+to.x)/2,y:(from.y+to.y)/2};
  if(!j.reduced)add('body',mid,start,arrival+fade,clamp((age-start)/fade)*clamp((arrival+fade-age)/fade),'body','moving',false,Math.atan2(to.y-from.y,to.x-from.x),length/.58);
  if(acknowledged){add('impact',to,hit,hit+240,clamp((age-hit)/fade)*clamp((hit+240-age)/fade));if(!j.light&&!j.reduced)add('residue',to,hit+160,hit+520,clamp((age-hit-160)/fade)*clamp((hit+520-age)/180));}
  return out;
 }
 const bodyEnd=hit===null?arrival+fade:stop+fade;
 // Reduced motion holds a legible state silhouette; it must not erase the status itself.
 add('body',base,start,bodyEnd,clamp((age-start)/fade)*clamp((bodyEnd-age)/fade),'body',anchor,true);
 if(acknowledged){
  const impact=mantle?from:ground;
  add('impact',impact,hit,hit+240,clamp((age-hit)/fade)*clamp((hit+240-age)/fade),'impact',anchor);
  if(Number.isFinite(stop)&&!j.light&&!j.reduced)add('residue',base,stop,stop+300,clamp((age-stop)/fade)*clamp((stop+300-age)/180));
 }
 // Incoming explicit events include unique IDs, so resampling cannot invent new hits or repeats.
 const seen=new Set();
 for(const ev of events){
  if(seen.has(ev.id)||!Number.isFinite(ev.at))continue;seen.add(ev.id);
  if(hit===null||ev.at<hit||ev.at>stop)continue;
  if(ev.type==='reflect'&&mantle){
   const duration=240,progress=clamp((age-ev.at)/duration),p={x:from.x+(to.x-from.x)*progress,y:from.y+(to.y-from.y)*progress};
   if(!j.reduced)add('event',p,ev.at,ev.at+duration,clamp((age-ev.at)/40)*clamp((ev.at+duration-age)/60),'reflect:'+ev.id,'moving',false,Math.atan2(to.y-from.y,to.x-from.x));
   add('impact',to,ev.at+duration,ev.at+duration+180,clamp((age-ev.at-duration)/40)*clamp((ev.at+duration+180-age)/60),'reflect-hit:'+ev.id,'target',false,0,D.display.reflectImpact);
  }else if(ev.type==='tick'&&!mantle){
   add('event',ground,ev.at,ev.at+220,clamp((age-ev.at)/40)*clamp((ev.at+220-age)/80),'tick:'+ev.id,'target');
  }
 }
 // Cloud's first strike is a separate descending body; fixed size, not a stretched beam.
 if(cloud&&!j.reduced){
  const progress=clamp((age-start)/(arrival-start));
  add('event',{x:ground.x,y:ground.y-45*(1-progress)},start,arrival+fade,clamp((age-start)/fade)*clamp((arrival+fade-age)/fade),'first-bolt','moving');
 }
 return out;
}
if(typeof module!=='undefined')module.exports={sampleThunderBatch3};

/* Visual ownership only. The combat engine supplies state and explicit application/tick/reflection events. */
function createThunderState(read,clock){
 let records={},serial=0;
 const alive=d=>d.active!==false&&d.playerHp>0&&d.enemyHp>0;
 const active=(kind,d)=>kind==='armor'?d.thunderArmorTurns>0:d.thunderDomainTurns>0&&d.thunderDomainDamage>0;
 function clear(){for(const r of Object.values(records))r.action.thunderOwned=false;records={};}
 function sync(){
  const d=read(),t=clock();if(!alive(d)){clear();return d;}
  for(const [key,r]of Object.entries(records)){
   if(r.target!==d.targetToken||r.owner!==d.ownerToken){delete records[key];continue;}
   if(!active(key,d)&&r.end===Infinity)r.end=t;
   r.events=r.events.filter(e=>t-e.at<600);
   if(t>=r.end+420)delete records[key];
  }
  return d;
 }
 function notify(kind,detail={},action=null){
  const d=read(),t=clock();if(!alive(d)){clear();return;}
  if(detail.target&&detail.target!==d.targetToken||detail.owner&&detail.owner!==d.ownerToken)return;
  const key=kind==='armor'||kind==='reflect'?'armor':'domain';
  if(!active(key,d))return;
  if(kind==='domain'||kind==='armor'){
   if(action)action.thunderOwned=true;
   records[key]={name:key==='armor'?'雷神附体':detail.name==='九霄雷云'?'九霄雷云':'万雷噬狱',target:d.targetToken,owner:d.ownerToken,action:action||{name:detail.name,at:t-1000,impactAt:310},end:Infinity,events:[]};
  }else if(kind==='tick'||kind==='reflect'){
   // A scene may become ready after the original application. Recover only a currently real state.
   if(!records[key])records[key]={name:key==='armor'?'雷神附体':'万雷噬狱',target:d.targetToken,owner:d.ownerToken,action:{at:t-1000,impactAt:310},end:Infinity,events:[]};
   records[key].events.push({id:++serial,type:kind,at:t});
  }
 }
 function collect(makeJob){
  sync();const t=clock(),out=[];
  for(const r of Object.values(records)){
   if(r.action.waiting)continue;
   const base=makeJob(r.name,r.action);if(!base)continue;
   const at=r.action.at,age=t-at;
   const job={...base,stateActive:true,stateEndAt:r.end-at,events:r.events.map(e=>({...e,at:e.at-at})),duration:Infinity,hitAt:r.action.impactAt??base.arriveAt??310};
   out.push({job,age});
  }
  return out;
 }
 function pause(){sync();const t=clock();for(const r of Object.values(records)){r.events=[];r.action={at:t-1000,impactAt:310};} }
 return {notify,collect,clear,pause,sync,inspect:()=>Object.entries(records).map(([kind,r])=>({kind,name:r.name,ending:Number.isFinite(r.end),events:r.events.length}))};
}
if(typeof module!=='undefined')module.exports={createThunderState};

  // END THUNDER BATCH3 GENERATED
  // BEGIN SWORD BATCH1 GENERATED
  const SWORD_BATCH=[{"key":"sword_flight","name":"御剑术","element":"sword","visualArchetype":"projectile","layers":{"telegraph":{"file":"sword_flight_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"body":{"file":"sword_flight_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.7578125,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"impact":{"file":"sword_flight_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"residue":{"file":"sword_flight_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":125,"body":210,"impact":135,"residue":110},"timing":{"arrivalMs":310,"gatherMs":90,"crossfadeMs":40,"aftermathMs":540,"durationMs":1050},"acceptance":["Independent authored raster master and stage plates","Fixed sword scale and attached painted trails; no gameplay mutation","Actual hit controls contact; volley is one mechanical hit","Colored source-over, HUD avoidance, explicit cancellation"],"preview":{"displayMode":"projectile","durationMs":1050,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3333333333333333,"anchor":"origin","width":125,"height":125,"fadeIn":0.11428571428571428,"fadeOut":0.17142857142857143},"body":{"start":0.08571428571428572,"end":0.3333333333333333,"anchor":"moving","width":210,"height":210,"fadeIn":0.15384615384615385,"fadeOut":0.23076923076923078},"impact":{"start":0.29523809523809524,"end":0.5238095238095238,"anchor":"target","width":135,"height":135,"fadeIn":0.16666666666666666,"fadeOut":0.25},"residue":{"start":0.4666666666666667,"end":0.8095238095238095,"anchor":"target","width":110,"height":110,"fadeIn":0.1111111111111111,"fadeOut":0.16666666666666666}}}},{"key":"myriad_swords","name":"万剑归宗","element":"sword","visualArchetype":"projectile-volley","layers":{"telegraph":{"file":"myriad_swords_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"body":{"file":"myriad_swords_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.7578125,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"impact":{"file":"myriad_swords_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"residue":{"file":"myriad_swords_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":150,"body":155,"impact":135,"residue":110},"timing":{"arrivalMs":310,"gatherMs":90,"crossfadeMs":40,"aftermathMs":540,"durationMs":1050},"acceptance":["Independent authored raster master and stage plates","Fixed sword scale and attached painted trails; no gameplay mutation","Actual hit controls contact; volley is one mechanical hit","Colored source-over, HUD avoidance, explicit cancellation"],"preview":{"displayMode":"projectile-volley","durationMs":1050,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3333333333333333,"anchor":"origin","width":150,"height":150,"fadeIn":0.11428571428571428,"fadeOut":0.17142857142857143},"body":{"start":0.08571428571428572,"end":0.3333333333333333,"anchor":"moving","width":155,"height":155,"fadeIn":0.15384615384615385,"fadeOut":0.23076923076923078},"impact":{"start":0.29523809523809524,"end":0.5238095238095238,"anchor":"target","width":135,"height":135,"fadeIn":0.16666666666666666,"fadeOut":0.25},"residue":{"start":0.4666666666666667,"end":0.8095238095238095,"anchor":"target","width":110,"height":110,"fadeIn":0.1111111111111111,"fadeOut":0.16666666666666666}}}},{"key":"heaven_earth_blade","name":"天地一剑","element":"sword","visualArchetype":"falling","layers":{"telegraph":{"file":"heaven_earth_blade_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.765625,"fps":24,"loop":false,"holdLast":false},"body":{"file":"heaven_earth_blade_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.765625,"fps":24,"loop":false,"holdLast":false},"impact":{"file":"heaven_earth_blade_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.765625,"fps":24,"loop":false,"holdLast":false},"residue":{"file":"heaven_earth_blade_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.765625,"fps":24,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":125,"body":310,"impact":240,"residue":210},"timing":{"arrivalMs":310,"gatherMs":90,"crossfadeMs":40,"aftermathMs":540,"durationMs":1050},"acceptance":["Independent authored raster master and stage plates","Fixed sword scale and attached painted trails; no gameplay mutation","Actual hit controls contact; volley is one mechanical hit","Colored source-over, HUD avoidance, explicit cancellation"],"preview":{"displayMode":"falling","durationMs":1050,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.3333333333333333,"anchor":"target","width":125,"height":125,"fadeIn":0.11428571428571428,"fadeOut":0.17142857142857143},"body":{"start":0.08571428571428572,"end":0.3333333333333333,"anchor":"moving","width":310,"height":310,"fadeIn":0.15384615384615385,"fadeOut":0.23076923076923078},"impact":{"start":0.29523809523809524,"end":0.5238095238095238,"anchor":"target","width":240,"height":240,"fadeIn":0.16666666666666666,"fadeOut":0.25},"residue":{"start":0.4666666666666667,"end":0.8095238095238095,"anchor":"target","width":210,"height":210,"fadeIn":0.1111111111111111,"fadeOut":0.16666666666666666}}}}];
function sampleSwordBatch(D,j,age){
 const C=v=>Math.max(0,Math.min(1,v)),out=[],T=D.timing;
 if(age<0||age>=(j.duration??T.durationMs)||j.hidden||j.exited||j.alive===false||j.sameTarget===false)return out;
 const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,arrival=hit??j.arriveAt??T.arrivalMs;
 const start=Math.max(15,arrival*T.gatherMs/T.arrivalMs),fade=T.crossfadeMs;
 const from=j.from||{x:260,y:205},to=j.to||{x:493,y:210},ground=j.toGround||{x:493,y:278};
 const gold=D.key==='heaven_earth_blade',volley=D.key==='myriad_swords',scale=(j.scale??1)*D.scale;
 function add(id,layer,p,a,b,alpha,anchor,rotation=0,size=1){
  if(age<a||age>=b||alpha<=0)return;
  const L=D.layers[layer],frame=j.reduced?Math.min(2,L.frames-1):Math.min(L.frames-1,Math.floor((age-a)/(b-a)*L.frames));
  out.push({id,layer,anchor,x:p.x+D.offsetX,y:p.y+D.offsetY,width:D.display[layer]*scale*size,height:D.display[layer]*scale*size,pivotX:L.pivotX,pivotY:L.pivotY,frame,opacity:C(alpha),rotation});
 }
 const teleEnd=gold?arrival+fade:start+fade;
 add('telegraph','telegraph',gold?ground:{x:from.x-22,y:from.y-12},0,teleEnd,C(age/45)*C((teleEnd-age)/fade),gold?'target':'origin');
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
  // END SWORD BATCH1 GENERATED
  // BEGIN SWORD BATCH2 GENERATED
  const SWORD_BATCH2=[{"key":"breeze_slash","name":"清风剑诀","element":"sword","visualArchetype":"projectile","layers":{"telegraph":{"file":"breeze_slash_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"body":{"file":"breeze_slash_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.7578125,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"impact":{"file":"breeze_slash_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"residue":{"file":"breeze_slash_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":125,"body":210,"impact":120,"residue":100},"timing":{"arrivalMs":310,"gatherMs":90,"crossfadeMs":40,"aftermathMs":540,"durationMs":1050},"acceptance":["Independent authored raster master and stage plates","Fixed sword scale and attached painted trails; no gameplay mutation","Actual hit controls contact; crossing blades are one mechanical hit","Colored source-over, HUD avoidance, explicit cancellation"],"preview":{"displayMode":"projectile","durationMs":1050,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12380952380952381,"anchor":"origin","width":125,"height":125,"fadeIn":0.34615384615384615,"fadeOut":0.3076923076923077},"body":{"start":0.08571428571428572,"end":0.3333333333333333,"anchor":"moving","width":210,"height":210,"fadeIn":0.15384615384615385,"fadeOut":0.15384615384615385},"impact":{"start":0.29523809523809524,"end":0.5238095238095238,"anchor":"target","width":120,"height":120,"fadeIn":0.16666666666666666,"fadeOut":0.25},"residue":{"start":0.4666666666666667,"end":0.7523809523809524,"anchor":"target","width":100,"height":100,"fadeIn":0.2,"fadeOut":0.3333333333333333}}}},{"key":"crossing_sword_qi","name":"剑气纵横","element":"sword","visualArchetype":"projectile","layers":{"telegraph":{"file":"crossing_sword_qi_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"body":{"file":"crossing_sword_qi_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"impact":{"file":"crossing_sword_qi_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"residue":{"file":"crossing_sword_qi_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":125,"body":300,"impact":120,"residue":100},"timing":{"arrivalMs":310,"gatherMs":90,"crossfadeMs":40,"aftermathMs":540,"durationMs":1050},"acceptance":["Independent authored raster master and stage plates","Fixed sword scale and attached painted trails; no gameplay mutation","Actual hit controls contact; crossing blades are one mechanical hit","Colored source-over, HUD avoidance, explicit cancellation"],"preview":{"displayMode":"projectile","durationMs":1050,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12380952380952381,"anchor":"origin","width":125,"height":125,"fadeIn":0.34615384615384615,"fadeOut":0.3076923076923077},"body":{"start":0.08571428571428572,"end":0.3333333333333333,"anchor":"moving","width":300,"height":300,"fadeIn":0.15384615384615385,"fadeOut":0.15384615384615385},"impact":{"start":0.29523809523809524,"end":0.5238095238095238,"anchor":"target","width":120,"height":120,"fadeIn":0.16666666666666666,"fadeOut":0.25},"residue":{"start":0.4666666666666667,"end":0.7523809523809524,"anchor":"target","width":100,"height":100,"fadeIn":0.2,"fadeOut":0.3333333333333333}}}},{"key":"armor_piercing_edge","name":"破甲剑罡","element":"sword","visualArchetype":"projectile","layers":{"telegraph":{"file":"armor_piercing_edge_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"body":{"file":"armor_piercing_edge_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.7578125,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"impact":{"file":"armor_piercing_edge_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false},"residue":{"file":"armor_piercing_edge_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":24,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"display":{"telegraph":125,"body":230,"impact":120,"residue":100},"timing":{"arrivalMs":310,"gatherMs":90,"crossfadeMs":40,"aftermathMs":540,"durationMs":1050},"acceptance":["Independent authored raster master and stage plates","Fixed sword scale and attached painted trails; no gameplay mutation","Actual hit controls contact; crossing blades are one mechanical hit","Colored source-over, HUD avoidance, explicit cancellation"],"preview":{"displayMode":"projectile","durationMs":1050,"distance":233,"layers":{"telegraph":{"start":0.0,"end":0.12380952380952381,"anchor":"origin","width":125,"height":125,"fadeIn":0.34615384615384615,"fadeOut":0.3076923076923077},"body":{"start":0.08571428571428572,"end":0.3333333333333333,"anchor":"moving","width":230,"height":230,"fadeIn":0.15384615384615385,"fadeOut":0.15384615384615385},"impact":{"start":0.29523809523809524,"end":0.5238095238095238,"anchor":"target","width":120,"height":120,"fadeIn":0.16666666666666666,"fadeOut":0.25},"residue":{"start":0.4666666666666667,"end":0.7523809523809524,"anchor":"target","width":100,"height":100,"fadeIn":0.2,"fadeOut":0.3333333333333333}}}}];
function sampleSwordBatch2(D,j,age){
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
  // END SWORD BATCH2 GENERATED
  // BEGIN SOLAR GENERATED CONFIG
  const SOLAR = {"key":"solar_true_fire","name":"太阳真火","element":"fire","visualArchetype":"projectile","layers":{"telegraph":{"file":"solar_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":32,"loop":false,"holdLast":false},"body":{"file":"solar_body.png","frames":8,"frameWidth":192,"frameHeight":192,"pivotX":0.5,"pivotY":0.5,"fps":32,"loop":true,"holdLast":false},"impact":{"file":"solar_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.65,"fps":34,"loop":false,"holdLast":false},"residue":{"file":"solar_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.65,"fps":17,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":42,"timing":{"defaultArrival":310,"anticipationFraction":0.35,"impactMs":180,"aftermathMs":540,"transitionMs":60,"missedFadeMs":150},"display":{"body":128,"telegraph":205,"impact":350,"residue":350},"preview":{"displayMode":"projectile","motion":"travel","durationMs":850,"distance":233,"layers":{"telegraph":{"start":0,"end":0.16,"anchor":"origin","width":205,"height":205,"fadeOut":0.22},"body":{"start":0,"end":0.36470588235294116,"anchor":"moving","width":128,"height":128},"impact":{"start":0.36470588235294116,"end":0.5764705882352941,"anchor":"target","width":350,"height":350,"fadeOut":0.3333333333333333},"residue":{"start":0.5058823529411764,"end":1,"anchor":"target","width":350,"height":350,"fadeIn":0.14285714285714285,"fadeOut":0.25}}},"acceptance":["Fixed-size solar body; no additional hits or RNG","Impact requires the existing hit event; locked target ground","Shared ground pivot and complementary impact/residue opacity","All layers expire, including misses and reduced-motion mode"]};
  // END SOLAR GENERATED CONFIG
  // BEGIN ICE BUTTERFLY GENERATED
  const ICE_BUTTERFLY = {"key":"ice_butterfly_dance","name":"冰蝶幻舞","element":"ice","visualArchetype":"projectile-volley","layers":{"telegraph":{"file":"ice_butterfly_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.6696428571428571,"fps":30.769230769230766,"loop":false,"holdLast":false},"body":{"file":"ice_butterfly_body.png","frames":8,"frameWidth":128,"frameHeight":128,"pivotX":0.5,"pivotY":0.5,"fps":32,"loop":true,"holdLast":false},"impact":{"file":"ice_butterfly_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.6696428571428571,"fps":33.333333333333336,"loop":false,"holdLast":false},"residue":{"file":"ice_butterfly_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.6696428571428571,"fps":15.0,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":18,"timing":{"arrivalMs":310,"gatherMs":95,"impactMs":180,"crossfadeMs":60,"residueEndMs":830,"durationMs":900},"display":{"body":76,"telegraph":256,"impact":260,"residue":260},"volley":{"count":7,"lightCount":4,"arcHeight":40},"preview":{"displayMode":"projectile-volley","motion":"travel","durationMs":900,"distance":233,"layers":{"telegraph":{"start":0,"end":0.14444444444444443,"anchor":"origin","width":256,"height":256,"fadeIn":0.2,"fadeOut":0.3},"body":{"start":0,"end":0.34444444444444444,"anchor":"moving","width":76,"height":76,"fadeIn":0.08},"impact":{"start":0.34444444444444444,"end":0.5444444444444444,"anchor":"target","width":260,"height":260,"fadeOut":0.3333333333333333},"residue":{"start":0.4777777777777778,"end":0.9222222222222223,"anchor":"target","width":260,"height":260,"fadeIn":0.15,"fadeOut":0.25}}},"acceptance":["Independent crystal butterfly master and three authored wing poses","Fixed-size bodies and parent-attached short trails","Impact consumes existing hit event; does not roll freeze or damage","Registered target ground pivot; complementary impact/residue opacity","Approved resources; hit, freeze, damage and RNG remain engine-owned"]};
/* Shared pure choreography. Only the caller's acknowledged hit spawns impact. */
function sampleIceButterfly(D,j,age){
 const T=D.timing,clamp=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,t)=>a+(b-a)*t;
 if(age<0||age>=(j.duration??T.durationMs))return [];
 const hit=Number.isFinite(j.hitAt)?j.hitAt:null,arrive=Math.max(1,hit??j.arriveAt??T.arrivalMs);
 const gather=arrive*T.gatherMs/T.arrivalMs,ringEnd=arrive*130/T.arrivalMs;
 const from=j.from,to=j.to,groundFrom=j.fromGround||{x:from.x,y:from.y+30*(j.scale||1)},groundTo=j.toGround||{x:to.x,y:to.y+30*(j.scale||1)};
 const s=(j.scale||1)*D.scale,reduced=!!j.reduced,light=!!j.light,direction=to.x>=from.x?1:-1,out=[];
 const add=(id,layer,anchor,x,y,frame,opacity,rotation=0,trail=0)=>{
  const spec=D.layers[layer];if(opacity<=0)return;
  out.push({id,layer,anchor,x:x+D.offsetX*s,y:y+D.offsetY*s,width:D.display[layer]*s,height:D.display[layer]*s,
   pivotX:spec.pivotX,pivotY:spec.pivotY,frame:Math.max(0,Math.min(spec.frames-1,frame)),opacity:clamp(opacity),rotation:reduced?0:rotation,trail:reduced?0:trail});
 };
 if(age<ringEnd&&(hit===null||age<hit)&&!reduced)add('sigil','telegraph','origin',groundFrom.x,groundFrom.y,Math.floor(age/ringEnd*D.layers.telegraph.frames),Math.min(clamp(age/(ringEnd*25/130)),clamp((ringEnd-age)/(ringEnd*35/130))));
 const count=reduced?2:light?D.volley.lightCount:D.volley.count;
 if(hit===null||age<hit){
  for(let i=0;i<count;i++){
   const launch=Math.min(arrive-1,gather+i*6*arrive/T.arrivalMs),travel=reduced?0:Math.pow(clamp((age-launch)/(arrive-launch)),.65+i*.35);
   const theta=i/count*Math.PI*2,spread=reduced?0:Math.min(age,gather)*.004;
   const origin={x:from.x+Math.cos(theta+spread)*22*s,y:from.y+Math.sin(theta+spread)*28*s};
   const x=lerp(origin.x,to.x,travel),arc=(i%2?1:-1)*(D.volley.arcHeight+i%3*7)*s;
   const y=lerp(origin.y,to.y+(i%3-1)*8*s,travel)+Math.sin(travel*Math.PI)*arc;
   add('butterfly-'+i,'body',reduced?'origin':'moving',x,y,reduced?0:Math.floor(age*D.layers.body.fps/1000+i*1.7)%D.layers.body.frames,
    clamp((age-i*5)/30)*(hit!==null?1:clamp((arrive+140-age)/140)),direction*(.3+travel*.8+Math.sin(age*.012+i)*.12),travel>0?D.trailLength*s:0);
  }
 }else{
  const elapsed=age-hit,overlapStart=T.impactMs-T.crossfadeMs,afterDuration=T.residueEndMs-T.arrivalMs;
  if(elapsed>=afterDuration)return [];
  const blend=clamp((elapsed-overlapStart)/T.crossfadeMs);
  if(elapsed<T.impactMs)add('impact','impact','target',groundTo.x,groundTo.y,reduced?2:Math.floor(elapsed/T.impactMs*D.layers.impact.frames),1-blend);
  if(elapsed>=overlapStart){
   const progress=(elapsed-overlapStart)/(afterDuration-overlapStart),fade=clamp((afterDuration-elapsed)/100);
   add('residue','residue','target',groundTo.x,groundTo.y,reduced?3:Math.floor(progress*D.layers.residue.frames),blend*fade);
   if(!reduced)for(let i=0;i<(light?1:2);i++)add('outro-'+i,'body','moving',groundTo.x+(i?1:-1)*(22+progress*28)*s,groundTo.y-(33+progress*48)*s,
    Math.floor(age*.024+i*3)%D.layers.body.frames,blend*fade*(1-progress)*.65,(i?1:-1)*.45);
  }
 }
 return out;
}
  // END ICE BUTTERFLY GENERATED
  // BEGIN HEART FIRE GENERATED
  const HEART_FIRE={"key":"heart_scorching_fire","name":"焚心炎","element":"fire","visualArchetype":"projectile","layers":{"telegraph":{"file":"heart_fire_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":32,"loop":false,"holdLast":false},"body":{"file":"heart_fire_body.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.6993243243243243,"pivotY":0.5,"fps":36.86635944700461,"loop":true,"holdLast":false},"impact":{"file":"heart_fire_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":33.333333333333336,"loop":false,"holdLast":false},"residue":{"file":"heart_fire_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":14.285714285714286,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"gatherFraction":0.3,"impactMs":180,"crossfadeMs":60,"aftermathMs":540,"missFadeMs":140,"durationMs":900},"display":{"telegraph":200,"body":390,"impact":230,"residue":230},"preview":{"displayMode":"projectile","motion":"travel","durationMs":900,"distance":233,"layers":{"telegraph":{"start":0,"end":0.13444444444444445,"anchor":"origin","width":200,"height":200,"fadeOut":0.23140495867768596},"body":{"start":0.10333333333333333,"end":0.34444444444444444,"anchor":"moving","width":390,"height":390,"fadeIn":0.12903225806451613},"impact":{"start":0.34444444444444444,"end":0.5444444444444444,"anchor":"target","width":230,"height":230,"fadeOut":0.3333333333333333},"residue":{"start":0.4777777777777778,"end":0.9444444444444444,"anchor":"target","width":230,"height":230,"fadeIn":0.14285714285714285,"fadeOut":0.23809523809523808}}},"acceptance":["Independent crimson-black material master, no reused solar art","Fixed-size tip-aligned projectile; torso-centered impact only after real hit","Registered target pivot and complementary impact/residue alpha","No damage, shield break, debuff, RNG or save mutations"]};
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
  // END HEART FIRE GENERATED
  // BEGIN ABSOLUTE ZERO GENERATED
  const ABSOLUTE_ZERO={"key":"absolute_zero","name":"绝对零度","element":"ice","visualArchetype":"ground-eruption","layers":{"telegraph":{"file":"absolute_zero_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.76,"fps":28,"loop":false,"holdLast":false},"body":{"file":"absolute_zero_body.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.76,"fps":35,"loop":false,"holdLast":false},"impact":{"file":"absolute_zero_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.76,"fps":25,"loop":false,"holdLast":false},"residue":{"file":"absolute_zero_residue.png","frames":8,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.76,"fps":20,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":0,"timing":{"arrivalMs":310,"impactMs":240,"crossfadeMs":60,"aftermathMs":560,"durationMs":900},"display":{"telegraph":340,"body":340,"impact":340,"residue":340},"preview":{"displayMode":"ground-eruption","motion":"anchored","durationMs":900,"distance":0,"layers":{"telegraph":{"start":0,"end":0.217,"anchor":"target","width":340,"height":340,"fadeIn":0,"fadeOut":0.28},"body":{"start":0.155,"end":0.345,"anchor":"target","width":340,"height":340,"fadeIn":0.3,"fadeOut":0},"impact":{"start":0.345,"end":0.612,"anchor":"target","width":340,"height":340,"fadeIn":0,"fadeOut":0.25},"residue":{"start":0.545,"end":0.967,"anchor":"target","width":340,"height":340,"fadeIn":0.16,"fadeOut":0.26}}},"acceptance":["Independent blue-cyan crystalline plates, no copied actor","Target-ground anchored frost, impact only after authoritative hit","Hollow target silhouette, source-over color, no broad white bloom","No damage, MP, freeze, RNG or save mutation"]};
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
  // END ABSOLUTE ZERO GENERATED
  let quality='auto';try{const v=localStorage.getItem(KEY);if(['auto','rich','light'].includes(v))quality=v}catch(_){}
  let canvas=null,ctx=null,jobs=[],raf=0,timer=0,lastFrame=-Infinity,serial=0,observer=null,finishUntil=0;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
  const point=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
  // Stateless noise keeps visual particles from consuming the gameplay random stream.
  const noise=(n)=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)};
  const now=()=>performance.now();
  function settings(){
    const reduced=!!W.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const mobile=!!W.matchMedia?.('(max-width: 820px)').matches||W.innerWidth<=820;
    const low=typeof PERF_CONFIG!=='undefined'&&PERF_CONFIG.lowEnd;
    const cinemaLight=D.getElementById('combatPanel')?.classList.contains('cinema-light-v2776');
    const light=quality==='light'||(quality==='auto'&&(mobile||low||cinemaLight));
    return {reduced,light,fps:light?24:30,pixels:light?400000:900000,dpr:light?1:1.5};
  }
  const solarTextures=new Map();
  function prepareSolar(){
    for(const [name,layer] of Object.entries(SOLAR.layers)){
      if(solarTextures.has(name))continue;
      const image=new Image(),entry={image,ready:false,failed:false};solarTextures.set(name,entry);
      image.decoding='async';
      image.onload=()=>{entry.ready=image.naturalWidth===layer.frameWidth*layer.frames&&image.naturalHeight===layer.frameHeight;entry.failed=!entry.ready;};
      image.onerror=()=>{entry.ready=false;entry.failed=true;};
      image.src='./solar-fire-v286830/'+layer.file;
    }
  }
  function solarReady(){return solarTextures.size===4&&[...solarTextures.values()].every(t=>t.ready&&!t.failed)}
  // One pure sample powers the game Canvas and the DOM resource preview. Only an
  // acknowledged hit can create a target-ground layer; all clocks are visual.
  function solarSample(j,age){
    if(age<0||age>=j.duration)return [];
    const hit=Number.isFinite(j.hitAt)?j.hitAt:null;
    const arrive=Math.max(1,hit??j.arriveAt??SOLAR.timing.defaultArrival);
    const start=arrive*SOLAR.timing.anticipationFraction;
    const g=groundAnchors(j),s=(j.scale||1)*SOLAR.scale,parts=[];
    const add=(layer,anchor,pos,progress,opacity,size,rotation=0)=>{
      if(opacity<=0)return;
      const spec=SOLAR.layers[layer];
      const frame=j.reduced?Math.min(2,spec.frames-1):layer==='body'?Math.floor(age*spec.fps/1000)%spec.frames:Math.min(spec.frames-1,Math.floor(clamp(progress)*spec.frames));
      parts.push({layer,anchor,x:pos.x+SOLAR.offsetX*s,y:pos.y+SOLAR.offsetY*s,
        width:size*s,height:size*s,pivotX:spec.pivotX,pivotY:spec.pivotY,frame,
        opacity:clamp(opacity),rotation:j.reduced?0:rotation});
    };
    if(hit===null||age<hit){
      const travel=j.reduced?0:clamp((age-start)/Math.max(1,arrive-start));
      const pos=point(j.from,j.to,travel);
      const missFade=hit===null?clamp((arrive+SOLAR.timing.missedFadeMs-age)/SOLAR.timing.missedFadeMs):1;
      const ringEnd=start+Math.min(28,arrive-start);
      if(!j.reduced&&age<ringEnd)add('telegraph','origin',j.from,age/ringEnd,clamp((ringEnd-age)/28),SOLAR.display.telegraph);
      add('body',j.reduced?'origin':'moving',pos,0,missFade*clamp(age/40,.35,1),SOLAR.display.body);
    }else{
      const elapsed=age-hit,end=SOLAR.timing.impactMs,transition=SOLAR.timing.transitionMs;
      if(elapsed>=SOLAR.timing.aftermathMs)return [];
      const blend=clamp((elapsed-(end-transition))/transition);
      if(elapsed<end)add('impact','target',g.to,elapsed/end,1-blend,SOLAR.display.impact);
      if(elapsed>=end-transition){
        const progress=(elapsed-(end-transition))/(SOLAR.timing.aftermathMs-(end-transition));
        add('residue','target',g.to,progress,blend*clamp((SOLAR.timing.aftermathMs-elapsed)/100),SOLAR.display.residue);
      }
    }
    return parts;
  }
  function drawSolar(c,j,age){
    prepareSolar();if(!solarReady())return false;
    const parts=solarSample(j,age);
    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();c.globalCompositeOperation='source-over';
    for(const part of parts){
      // Short connector follows the current body, never a second solar silhouette.
      if(part.layer==='body'&&!j.reduced&&part.x!==j.from.x){
        const dx=part.x-j.from.x,dy=part.y-j.from.y,len=Math.hypot(dx,dy),tail=Math.min(SOLAR.trailLength*(j.scale||1),len);
        for(let i=0;i<(j.light?1:3);i++){
          const offset=(i-(j.light?0:1))*4;
          path(c,[{x:part.x-dx/len*tail,y:part.y-dy/len*tail+offset},{x:part.x-dx/len*tail*.4,y:part.y+offset*.6},{x:part.x,y:part.y}],i===0?'#ea7217':'#ffb847',i===0?2:1,part.opacity*.6);
        }
      }
      const spec=SOLAR.layers[part.layer],texture=solarTextures.get(part.layer).image;
      c.save();c.translate(part.x,part.y);c.rotate(part.rotation);c.globalAlpha=part.opacity;
      c.drawImage(texture,part.frame*spec.frameWidth,0,spec.frameWidth,spec.frameHeight,
        -part.width*part.pivotX,-part.height*part.pivotY,part.width,part.height);c.restore();
    }
    c.restore();return true;
  }
  const butterflyTextures=new Map();
  function prepareButterfly(){
    for(const [name,layer] of Object.entries(ICE_BUTTERFLY.layers)){
      if(butterflyTextures.has(name))continue;
      const image=new Image(),entry={image,ready:false,failed:false};butterflyTextures.set(name,entry);
      image.decoding='async';
      image.onload=()=>{entry.ready=image.naturalWidth===layer.frames*layer.frameWidth&&image.naturalHeight===layer.frameHeight;entry.failed=!entry.ready;};
      image.onerror=()=>{entry.ready=false;entry.failed=true;};
      image.src='./ice-butterfly-v286831/'+layer.file;
    }
  }
  function butterflyReady(){return butterflyTextures.size===4&&[...butterflyTextures.values()].every(t=>t.ready&&!t.failed)}
  function butterflySample(j,age){return sampleIceButterfly(ICE_BUTTERFLY,j,age)}
  function drawButterfly(c,j,age){
    prepareButterfly();if(!butterflyReady())return false;
    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();c.globalCompositeOperation='source-over';
    for(const p of butterflySample(j,age)){
      if(p.trail){
        const dx=p.x-j.from.x,dy=p.y-j.from.y,length=Math.hypot(dx,dy),tail=Math.min(p.trail,length);
        if(length>0)path(c,[{x:p.x-dx/length*tail,y:p.y-dy/length*tail},{x:p.x,y:p.y}],'#58caff',1,p.opacity*.45);
      }
      const spec=ICE_BUTTERFLY.layers[p.layer],texture=butterflyTextures.get(p.layer).image;
      c.save();c.translate(p.x,p.y);c.rotate(p.rotation);c.globalAlpha=p.opacity;
      c.drawImage(texture,p.frame*spec.frameWidth,0,spec.frameWidth,spec.frameHeight,-p.width*p.pivotX,-p.height*p.pivotY,p.width,p.height);c.restore();
    }
    c.restore();return true;
  }
  const fireBatchTextures=new Map();
  function thunderDefinition(name){return THUNDER_BATCH3.find(d=>d.name===name)||THUNDER_BATCH.find(d=>d.name===name)||THUNDER_BATCH2.find(d=>d.name===name)}
  function elementDefinition(name){return ELEMENT_BATCH.find(d=>d.skills.includes(name))}
  function fireDefinition(name){return SWORD_BATCH2.find(d=>d.name===name)||SWORD_BATCH.find(d=>d.name===name)||thunderDefinition(name)||FIRE_BATCH.find(d=>d.name===name)||FIRE_BATCH2.find(d=>d.name===name)||FIRE_BATCH3.find(d=>d.name===name)||elementDefinition(name)}
  function batchFolder(D){return SWORD_BATCH2.includes(D)?'./sword-skills-batch2/':SWORD_BATCH.includes(D)?'./sword-skills-batch1/':THUNDER_BATCH3.includes(D)?'./thunder-skills-batch3/':THUNDER_BATCH2.includes(D)?'./thunder-skills-batch2/':THUNDER_BATCH.includes(D)?'./thunder-skills-batch1/':ELEMENT_BATCH.includes(D)?'./element-skills-v286838/':FIRE_BATCH3.includes(D)?'./fire-skills-batch3/':FIRE_BATCH2.includes(D)?'./fire-skills-batch2/':'./fire-skills-batch1/'}
  // Family sheets are shared by every skill of that family, so textures are keyed by effect.
  function prepareFireBatch(name){
    const D=fireDefinition(name);if(!D)return;
    if(!fireBatchTextures.has(D.key))fireBatchTextures.set(D.key,new Map());
    const textures=fireBatchTextures.get(D.key);
    for(const [key,L] of Object.entries(D.layers)){
      if(textures.has(key))continue;
      const image=new Image(),entry={image,ready:false};textures.set(key,entry);image.decoding='async';
      image.onload=()=>{entry.ready=image.naturalWidth===L.frames*L.frameWidth&&image.naturalHeight===L.frameHeight};
      image.onerror=()=>{entry.ready=false};image.src=batchFolder(D)+L.file;
    }
  }
  function fireBatchReady(name){const D=fireDefinition(name),textures=D&&fireBatchTextures.get(D.key);return !!D&&textures?.size===Object.keys(D.layers).length&&[...textures.values()].every(t=>t.ready)}
  function fireBatchSample(j,age){if(j.profile.name==='冰甲护身'&&j.guardActive===false)return [];const D=fireDefinition(j.profile.name);return D?(SWORD_BATCH2.includes(D)?sampleSwordBatch2(D,j,age):SWORD_BATCH.includes(D)?sampleSwordBatch(D,j,age):THUNDER_BATCH3.includes(D)?sampleThunderBatch3(D,{stateActive:false,...j},age):(THUNDER_BATCH.includes(D)||THUNDER_BATCH2.includes(D))?sampleThunderBatch(D,j,age):D.key==='solar_aegis'?sampleSolarAegis(D,j,age):FIRE_BATCH3.includes(D)?sampleFireBatch3(D,j,age):FIRE_BATCH.includes(D)?sampleFireBatch(D,j,age):sampleFireBatch2(D,j,age)):[]}
  // The shield's formation belongs to the cast; its continuing dome belongs to the live pool.
  function sampleSolarAegis(D,j,age){
    if(age<0||age>=j.duration||j.hidden||j.exited||j.alive===false||j.sameTarget===false||j.guardActive===false)return [];
    const hit=Number.isFinite(j.hitAt)&&j.hitAt>=0?j.hitAt:null,H=hit??j.arriveAt??310,foot=j.toGround||j.to,scale=j.scale??1,out=[];
    function add(layer,start,end,fi,fo){
      if(age<start||age>=end)return;const L=D.layers[layer],opacity=Math.min(1,(age-start)/fi,(end-age)/fo);if(opacity<=0)return;
      out.push({id:layer,layer,anchor:'target',x:foot.x+D.offsetX+(j.offsetX??0),y:foot.y+D.offsetY+(j.offsetY??0),width:D.display[layer]*scale*D.scale,height:D.display[layer]*scale*D.scale,pivotX:L.pivotX,pivotY:L.pivotY,frame:j.reduced?2:Math.min(L.frames-1,Math.floor((age-start)/(end-start)*L.frames)),opacity,rotation:0});
    }
    add('telegraph',0,H+40,40,40);
    if(hit!==null){add('body',H,H+360,40,40);add('impact',H+320,H+540,40,40);add('residue',H+500,H+700,40,80);}
    return out;
  }
  function drawFireBatch(c,j,age){
    prepareFireBatch(j.profile.name);if(!fireBatchReady(j.profile.name))return false;
    const D=fireDefinition(j.profile.name),textures=fireBatchTextures.get(D.key);
    const top=(SWORD_BATCH.includes(D)||SWORD_BATCH2.includes(D))?Math.min(85,j.clipBottom*.24):0;
    c.save();c.beginPath();c.rect(0,top,j.width,Math.max(0,j.clipBottom-top));c.clip();c.globalCompositeOperation='source-over';
    for(const p of fireBatchSample(j,age)){
      const L=D.layers[p.layer];c.save();c.translate(p.x,p.y);c.rotate(p.rotation);if(p.flipX)c.scale(-1,1);c.globalAlpha=p.opacity;
      if(p.clipStart!=null){c.beginPath();c.rect((p.clipStart-p.pivotX)*p.width,-p.pivotY*p.height,(p.clipEnd-p.clipStart)*p.width,p.height);c.clip();}
      c.drawImage(textures.get(p.layer).image,p.frame*L.frameWidth,0,L.frameWidth,L.frameHeight,-p.width*p.pivotX,-p.height*p.pivotY,p.width,p.height);c.restore();
    }
    c.restore();return true;
  }
  function fireDetonate(side){
    for(const j of jobs){if(j.profile.name!=='炎爆术'||j.side===side||j.hitAt===null||j.detonationAt!=null)continue;
      const age=now()-j.started;if(age>=j.duration)continue;j.detonationAt=Math.max(age,j.hitAt)+60;
      if(j.reduced&&ctx){ctx.setTransform(j.ratio,0,0,j.ratio,0,0);ctx.clearRect(0,0,j.width,j.height);draw(ctx,j,j.detonationAt+100);}
    }
  }
  const swordBatch2={definitions:SWORD_BATCH2,definition:name=>SWORD_BATCH2.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};
  const swordBatch={definitions:SWORD_BATCH,definition:name=>SWORD_BATCH.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};
  const fireBatch={definitions:FIRE_BATCH,prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample,detonate:fireDetonate};
  function lotusStatusActive(data){return data.enemyHp>0&&data.burnTurns>0&&data.burnDamage>0&&data.burnHealBlock===true}
  function drawLotusStatus(c,x,y,age,reduced,scale=1){
    prepareFireBatch('红莲业火');if(!fireBatchReady('红莲业火'))return false;
    const D=fireDefinition('红莲业火'),L=D.layers.status,size=D.display.status*scale;
    const frame=reduced?2:Math.floor(Math.max(0,age)*L.fps/1000)%L.frames;
    c.save();c.globalCompositeOperation='source-over';c.globalAlpha=1;
    c.drawImage(fireBatchTextures.get(D.key).get('status').image,frame*L.frameWidth,0,L.frameWidth,L.frameHeight,x-size*L.pivotX,y-size*L.pivotY,size,size);c.restore();return true;
  }
  const fireBatch2={definitions:FIRE_BATCH2,prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample,statusActive:lotusStatusActive,drawStatus:drawLotusStatus};
  const thunderBatch={definitions:THUNDER_BATCH,definition:name=>THUNDER_BATCH.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};
  const thunderBatch2={definitions:THUNDER_BATCH2,definition:name=>THUNDER_BATCH2.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};
  const thunderListeners=new Set();
  function readThunderState(foe,owner){return {active:!!foe&&!!owner,ownerToken:owner,targetToken:foe,playerHp:owner?.hp||0,enemyHp:foe?.hp||0,thunderDomainTurns:foe?.thunderDomainTurns||0,thunderDomainDamage:foe?.thunderDomainDamage||0,thunderArmorTurns:owner?._thunderArmorTurns||0};}
  const reportThunder=createThunderState(()=>({...readThunderState(typeof currentEnemy==='undefined'?null:currentEnemy,typeof player==='undefined'?null:player),active:typeof gameState!=='undefined'&&gameState==='combat'}),now);
  const thunderBatch3={definitions:THUNDER_BATCH3,definition:name=>THUNDER_BATCH3.find(d=>d.name===name),prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample,createState:createThunderState,readState:readThunderState,
    subscribe(fn){thunderListeners.add(fn);return ()=>thunderListeners.delete(fn)},
    notify(kind,detail){let handled=false;for(const fn of thunderListeners){try{handled=fn(kind,detail)||handled}catch(_){}}if(!handled){const action=[...jobs].reverse().find(j=>j.profile.name===detail.name);if(action){action.at=action.started;action.impactAt=action.hitAt??310;}reportThunder.notify(kind,detail,action);if(canvas){if(timer)clearTimeout(timer);timer=0;if(!raf)raf=requestAnimationFrame(frame);}}},
    drawState(c,j,age){
      if(drawFireBatch(c,j,age))return;
      // Missing textures retain a bounded status cue with ordinary canvas drawing.
      const D=thunderBatch3.definition(j.profile.name),parts=sampleThunderBatch3(D,j,age);
      c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();
      for(const p of parts){if(p.layer==='body'){const q=j.profile.self?j.from:j.toGround;ellipse(c,q,36*(j.scale||1),j.profile.self?55*(j.scale||1):14*(j.scale||1),'#678bff',2,p.opacity);}else if(p.id.startsWith('tick:')||p.id.startsWith('reflect'))lightning(c,j.from,j.to,['#678bff','#90dfff','#27235b'],p.opacity,3,1.5);}
      c.restore();
    }
  };
  // Presentation-only provenance: shared stun/seal counters are not proof of an ice cast.
  // Records belong to a scene, never to the save. No timers, RNG or combat writes.
  function createIceState(read,clock){
    const records=new Map();let paused=false;
    const alive=d=>d.active!==false&&d.playerHp>0&&d.enemyHp>0;
    const active=(k,d)=>k==='freeze'?d.frozen===true:k==='frost'?d.frostTurns>0&&d.frostDamage>0:k==='seal'?d.sealTurns>0:d.guardElement==='ice'&&d.guardPool>0&&d.guardTurns>0;
    function sync(){
      const d=read(),t=clock();if(!alive(d)){records.clear();return d;}
      for(const [k,r] of records){
        if(r.owner!==d.ownerToken||r.target!==d.targetToken||k==='guard'&&d.guardElement&&d.guardElement!=='ice'){records.delete(k);continue;}
        if(k==='guard'&&d.guardPool<r.pool&&r.end===Infinity)r.pulse=t;
        r.pool=d.guardPool;
        if(paused&&!active(k,d)){records.delete(k);continue;}
        if(!active(k,d)&&r.end===Infinity)r.end=t;
        if(t>=r.end+220)records.delete(k);
      }
      return d;
    }
    function notify(kind,detail={}){
      const d=sync(),t=clock();if(!alive(d)||detail.owner&&detail.owner!==d.ownerToken||detail.target&&detail.target!==d.targetToken)return;
      if(kind==='seal-clear'){records.delete('seal');return;}
      if(kind==='freeze-clear'){const r=records.get('freeze');if(r)r.end=t;return;}
      if(kind==='tick'){const r=records.get('frost');if(r)r.pulse=t;return;}
      const keys=kind==='guard'?['guard']:kind==='apply'?['freeze','frost','seal'].filter(k=>detail[k]):[];
      for(const k of keys)if(active(k,d))records.set(k,{kind:k,name:k==='guard'?'冰甲护身':detail.name,owner:d.ownerToken,target:d.targetToken,at:t,end:Infinity,pulse:-Infinity,pool:d.guardPool});
    }
    function collect(){
      sync();paused=false;const t=clock();return [...records.values()].map(r=>({...r,age:t-r.at,ending:Number.isFinite(r.end),endAge:t-r.end,pulse:Math.max(0,1-(t-r.pulse)/220),opacity:Math.max(0,Math.min(1,(t-r.at)/80,1-(t-r.end)/220))}));
    }
    function pause(){sync();paused=true;for(const [k,r] of records){if(Number.isFinite(r.end))records.delete(k);else{r.pulse=-Infinity;r.at=clock()-1200;r.pool=read().guardPool;}}}
    return {notify,collect,sync,pause,clear:()=>records.clear(),inspect:()=>[...records.keys()]};
  }
  function readIceState(foe,owner){
    const g=typeof elementGuardsV286818!=='undefined'&&foe?elementGuardsV286818.get(foe):null;
    return {active:!!foe&&!!owner,ownerToken:owner,targetToken:foe,playerHp:owner?.hp||0,enemyHp:foe?.hp||0,
      frozen:typeof currentEnemy!=='undefined'&&foe===currentEnemy&&typeof skipEnemyTurn!=='undefined'&&skipEnemyTurn&&foe?._skipReason==='冻结',
      frostTurns:foe?._frostTurnsV286818||0,frostDamage:foe?._frostDamageV286818||0,sealTurns:foe?._spellSealTurnsV286817||0,
      guardPool:g?.owner===owner?g.pool:0,guardTurns:g?.owner===owner?g.turns:0,guardElement:g?.owner===owner?g.element:null};
  }
  const iceListeners=new Set();
  const reportIce=createIceState(()=>({...readIceState(typeof currentEnemy==='undefined'?null:currentEnemy,typeof player==='undefined'?null:player),active:typeof gameState!=='undefined'&&gameState==='combat'}),now);
  const iceFinale={createState:createIceState,readState:readIceState,
    subscribe(fn){iceListeners.add(fn);return ()=>iceListeners.delete(fn)},
    notify(kind,detail={}){let handled=false;for(const fn of iceListeners){try{handled=fn(kind,detail)||handled}catch(_){}}
      if(!handled){reportIce.notify(kind,detail);if(reportIce.inspect().length){if(timer)clearTimeout(timer);timer=0;resumeThunder();}}},
    drawStatus(c,r,point,{scale=1,reduced=false,width=720,clipBottom=355}={}){
      if(r.opacity<=0)return false;
      // Ice armor hands over after the existing cast has completely faded. The
      // other marks are small attached status cues, not replayed full-size hits.
      const guard=r.kind==='guard';if(guard&&r.age<1100&&!r.ending)return false;
      const name=guard?'冰甲护身':r.kind==='freeze'?'冰河葬狱':r.kind==='seal'?'冰魄封魂':elementDefinition(r.name)?r.name:'万载寒晶';
      const layer=r.ending?'residue':guard?'body':r.kind==='freeze'?'body':r.kind==='seal'?'telegraph':'residue';
      const def=elementDefinition(name),L=def.layers[layer];prepareFireBatch(name);
      const size=(guard?270:r.kind==='freeze'?165:r.kind==='seal'?90:195)*scale;
      const phase=Math.floor(Math.max(0,r.age)*6/1000)%(2*L.frames-2);
      const frame=r.ending?Math.min(L.frames-1,Math.floor(r.endAge/220*L.frames)):reduced?Math.min(2,L.frames-1):phase<L.frames?phase:2*L.frames-2-phase;
      c.save();c.beginPath();c.rect(0,0,width,clipBottom);c.clip();c.globalCompositeOperation='source-over';
      c.globalAlpha=r.opacity*(guard?.8:r.kind==='freeze'?.8:.9);
      const texture=fireBatchTextures.get(def.key)?.get(layer);
      if(texture?.ready)c.drawImage(texture.image,frame*L.frameWidth,0,L.frameWidth,L.frameHeight,point.x-size*L.pivotX,point.y-size*L.pivotY,size,size);
      else{c.strokeStyle='#8bd5e8';c.lineWidth=2*scale;c.beginPath();c.ellipse(point.x,point.y-18*scale,30*scale,18*scale,0,0,Math.PI*2);c.stroke();}
      // Only a real absorption or frost tick creates a pulse; loops never do.
      if(r.pulse>0){c.globalAlpha=r.pulse*.7;c.strokeStyle='#b9f0ff';c.lineWidth=2*scale;c.beginPath();c.ellipse(point.x,point.y-8*scale,(30+12*(1-r.pulse))*scale,12*scale,0,0,Math.PI*2);c.stroke();}
      c.restore();return true;
    }
  };
  const elementBatch={definitions:ELEMENT_BATCH,definition:elementDefinition,prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample};
  const fireFinale={
    bindActive:d=>d.active!==false&&d.playerHp>0&&d.enemyHp>0&&d.bindConfirmed===true&&d.chillTurns>0,
    guardActive:d=>d.active!==false&&d.playerHp>0&&d.enemyHp>0&&d.guardElement==='fire'&&d.guardPool>0&&d.guardTurns>0,
    drawStatus(c,kind,x,y,age,reduced,scale=1,opacity=1,pulse=0){
      const name=kind==='bind'?'流火飞索':'炎阳护盾',D=elementDefinition(name);prepareFireBatch(name);
      c.save();c.globalCompositeOperation='source-over';c.globalAlpha=Math.max(0,Math.min(1,opacity));
      if(!fireBatchReady(name)){
        // A small outline remains readable if the authored texture failed to load.
        c.strokeStyle='#ed8d36';c.lineWidth=2*scale;c.beginPath();c.ellipse(x,y-(kind==='bind'?0:30)*scale,(kind==='bind'?42:52)*scale,(kind==='bind'?16:44)*scale,0,0,Math.PI*2);c.stroke();c.restore();return true;
      }
      const layer=kind==='bind'?'telegraph':kind==='break'?'residue':'body',L=D.layers[layer];
      const phase=Math.floor(Math.max(0,age)*8/1000)%(2*L.frames-2);
      const frame=kind==='break'?Math.min(L.frames-1,Math.floor(age/180*L.frames)):reduced?Math.min(2,L.frames-1):phase<L.frames?phase:2*L.frames-2-phase;
      const size=(kind==='bind'?190:210)*scale;
      if(kind==='guard')c.globalAlpha*=.85+.15*Math.max(0,Math.min(1,pulse));
      c.drawImage(fireBatchTextures.get(D.key).get(layer).image,frame*L.frameWidth,0,L.frameWidth,L.frameHeight,x-size*L.pivotX,y-size*L.pivotY,size,size);c.restore();return true;
    }
  };
  function domainStatusActive(data){return data.domainConfirmed===true&&data.enemyHp>0&&data.burnTurns>0&&data.burnDamage>0&&!data.burnHealBlock}
  function drawDomainStatus(c,x,y,age,reduced,scale=1,opacity=1){
    prepareFireBatch('燎原火域');if(!fireBatchReady('燎原火域'))return false;
    const D=fireDefinition('燎原火域'),L=D.layers.status,size=D.display.status*scale;
    const frame=reduced?2:Math.floor(Math.max(0,age)*L.fps/1000)%L.frames;
    c.save();c.globalCompositeOperation='source-over';c.globalAlpha=Math.max(0,Math.min(1,opacity));
    c.drawImage(fireBatchTextures.get(D.key).get('status').image,frame*L.frameWidth,0,L.frameWidth,L.frameHeight,x-size*L.pivotX,y-size*L.pivotY,size,size);c.restore();return true;
  }
  const fireBatch3={definitions:FIRE_BATCH3,prepare:prepareFireBatch,ready:fireBatchReady,sample:fireBatchSample,statusActive:domainStatusActive,drawStatus:drawDomainStatus};

  const heartTextures=new Map();
  function prepareHeart(){
    for(const [name,layer] of Object.entries(HEART_FIRE.layers)){
      if(heartTextures.has(name))continue;
      const image=new Image(),entry={image,ready:false,failed:false};heartTextures.set(name,entry);image.decoding='async';
      image.onload=()=>{entry.ready=image.naturalWidth===layer.frames*layer.frameWidth&&image.naturalHeight===layer.frameHeight;entry.failed=!entry.ready;};
      image.onerror=()=>{entry.ready=false;entry.failed=true;};image.src='./heart-fire-v286833/'+layer.file;
    }
  }
  function heartReady(){return heartTextures.size===4&&[...heartTextures.values()].every(t=>t.ready&&!t.failed)}
  function heartSample(j,age){return sampleHeartFire(HEART_FIRE,j,age)}
  function drawHeart(c,j,age){
    prepareHeart();if(!heartReady())return false;
    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();c.globalCompositeOperation='source-over';
    for(const p of heartSample(j,age)){
      const spec=HEART_FIRE.layers[p.layer],texture=heartTextures.get(p.layer).image;
      c.save();c.translate(p.x,p.y);c.rotate(p.rotation);c.globalAlpha=p.opacity;
      c.drawImage(texture,p.frame*spec.frameWidth,0,spec.frameWidth,spec.frameHeight,-p.width*p.pivotX,-p.height*p.pivotY,p.width,p.height);c.restore();
    }
    c.restore();return true;
  }
  // Persistent status reuses a dim residue plate; no extra timer or animation owner.
  function drawBurnStatus(c,x,y,age,pulse,reduced){
    prepareHeart();if(!heartReady())return;
    const spec=HEART_FIRE.layers.residue,texture=heartTextures.get('residue').image;
    c.save();c.globalCompositeOperation='source-over';
    c.globalAlpha=reduced?.45:.45+.25*Math.max(0,Math.min(1,pulse));
    const frame=1,size=130; // Static low ember: tick changes opacity, never restarts the full cast.
    c.drawImage(texture,frame*spec.frameWidth,0,spec.frameWidth,spec.frameHeight,x-size/2,y-size/2,size,size);c.restore();
  }
  const heart=Object.freeze({definition:HEART_FIRE,sample:heartSample,prepare:prepareHeart,ready:heartReady,drawStatus:drawBurnStatus});
  const zeroTextures=new Map();
  function prepareAbsoluteZero(){
    for(const [key,spec] of Object.entries(ABSOLUTE_ZERO.layers)){
      if(zeroTextures.has(key))continue;
      const image=new Image(),entry={image,ready:false,failed:false};zeroTextures.set(key,entry);image.decoding='async';
      image.onload=()=>{entry.ready=image.naturalWidth===spec.frameWidth*spec.frames&&image.naturalHeight===spec.frameHeight;entry.failed=!entry.ready;};
      image.onerror=()=>{entry.ready=false;entry.failed=true;};image.src='./absolute-zero-v286835/'+spec.file;
    }
  }
  function absoluteZeroReady(){return zeroTextures.size===4&&[...zeroTextures.values()].every(t=>t.ready&&!t.failed)}
  function zeroSample(j,age){return sampleAbsoluteZero(ABSOLUTE_ZERO,j,age)}
  function drawAbsoluteZero(c,j,age){
    prepareAbsoluteZero();if(!absoluteZeroReady())return false;
    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();c.globalCompositeOperation='source-over';
    for(const p of zeroSample(j,age)){
      const spec=ABSOLUTE_ZERO.layers[p.layer];c.save();c.globalAlpha=p.opacity;
      c.drawImage(zeroTextures.get(p.layer).image,p.frame*spec.frameWidth,0,spec.frameWidth,spec.frameHeight,p.x-p.width*p.pivotX,p.y-p.height*p.pivotY,p.width,p.height);c.restore();
    }
    c.restore();return true;
  }
  const absoluteZero=Object.freeze({definition:ABSOLUTE_ZERO,sample:zeroSample,prepare:prepareAbsoluteZero,ready:absoluteZeroReady});
  function profile(name,element='',info=null,source='active'){
    name=String(name||'灵力冲击');
    if(!info&&typeof SKILLS!=='undefined')info=SKILLS.find(s=>s.name===name)||null;
    let family=element||info?.element||(/凝露|治愈|回春|灵泉|青莲|生生不息|莲华|逆命回元|起死回生/.test(name)?'heal':/雷|天劫/.test(name)?'thunder':/冰|霜|寒/.test(name)?'ice':/火|焰|炎/.test(name)?'fire':/剑|斩|试锋/.test(name)?'sword':/血/.test(name)?'blood':/幽冥|鬼|魂/.test(name)?'spirit':/魔|妖/.test(name)?'dark':'earth');
    if(name==='镇岳山河震')family='earth';if(name==='穿云贯日')family='spear';
    if(!palettes[family])family='spirit';
    let kind=styles[name]||forms[name]||({sword:'blade',heal:'dew',ice:'breath',fire:'burst',thunder:'bolt',dark:'wave',blood:'wave',spirit:'wave',earth:'ground',spear:'lance'}[family]);
    if(fireDefinition(name))prepareFireBatch(name);
    if(name==='绝对零度')prepareAbsoluteZero();
    if(kind==='sun')prepareSolar();
    if(kind==='butterfly')prepareButterfly();
    if(kind==='heart')prepareHeart();
    const self=family==='heal'||kind==='armor'||!!(info&&Number(info.damage)===0&&/护|甲|附体/.test(name));
    const tier=/天地|万剑|万载|九天|天火|太阳|绝对|灭世|济世/.test(name)?3:info?.damage>=2.5||/领域|雷云|结界|龙息|千里/.test(name)?2:1;
    return {name,family,kind,self,tier,source,palette:name==='天地一剑'?['#dccc93','#fff0c4','#595335']:palettes[family],guard:!!info?.guardRatio||kind==='guardblade'||/护心|济世/.test(name)};
  }
  function path(c,pts,color,width=1,alpha=1){
    if(!pts.length||alpha<=0)return;
    c.globalAlpha=clamp(alpha);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);c.stroke();
  }
  function ellipse(c,p,rx,ry,color,width=1,alpha=1,angle=0,start=0,end=TAU){
    c.globalAlpha=clamp(alpha);c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.ellipse(p.x,p.y,Math.max(.1,rx),Math.max(.1,ry),angle,start,end);c.stroke();
  }
  function halo(c,p,r,color,alpha){
    if(alpha<=0)return;const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(1,r));g.addColorStop(0,color);g.addColorStop(.32,color+'80');g.addColorStop(1,color+'00');c.globalAlpha=clamp(alpha);c.fillStyle=g;c.fillRect(p.x-r,p.y-r,r*2,r*2);
  }
  function seal(c,p,r,pal,alpha,rotation=0){
    ellipse(c,p,r,r*.36,pal[0],1.3,alpha);ellipse(c,p,r*.82,r*.29,pal[1],.6,alpha*.8);
    for(let i=0;i<8;i++){const a=rotation+i*TAU/8;const q={x:p.x+Math.cos(a)*r*.94,y:p.y+Math.sin(a)*r*.34};path(c,[{x:q.x-2,y:q.y-2},{x:q.x+2,y:q.y+2}],pal[1],1,alpha*.9)}
  }
  function blade(c,p,angle,length,pal,alpha,width=5){
    c.save();c.translate(p.x,p.y);c.rotate(angle);c.globalAlpha=clamp(alpha);c.fillStyle=pal[2];c.beginPath();c.moveTo(-length,0);c.quadraticCurveTo(-length*.3,-width*1.8,8,0);c.quadraticCurveTo(-length*.25,width*.8,-length,0);c.fill();
    c.fillStyle=pal[0];c.beginPath();c.moveTo(-length*.76,-width*.55);c.lineTo(-length*.16,-width*.8);c.lineTo(8,0);c.lineTo(-length*.16,width*.8);c.lineTo(-length*.76,width*.55);c.closePath();c.fill();
    path(c,[{x:-length*.76,y:-width*.55},{x:-length*.16,y:-width*.8},{x:7,y:0},{x:-length*.16,y:width*.8},{x:-length*.76,y:width*.55}],pal[1],.8,alpha);
    path(c,[{x:-length*.74,y:-width*1.8},{x:-length*.74,y:width*1.8}],pal[1],2,alpha);path(c,[{x:-length*.92,y:0},{x:7,y:0}],pal[1],1.2,alpha);c.restore();
  }
  function ribbon(c,from,to,t,pal,width=5,bend=-20,alpha=1){
    const head=point(from,to,t),tail=point(from,to,Math.max(0,t-.56));
    for(let i=0;i<3;i++){
      c.globalAlpha=alpha*(i===0?.30:i===1?.85:.95);c.strokeStyle=pal[i===0?2:i===1?0:1];c.lineWidth=i===0?width*2.4:i===1?width:1;c.lineCap='round';c.beginPath();c.moveTo(tail.x,tail.y);c.quadraticCurveTo((tail.x+head.x)/2,(tail.y+head.y)/2+bend,head.x,head.y);c.stroke();
    }
    return head;
  }
  function shard(c,p,size,angle,pal,alpha){
    c.save();c.translate(p.x,p.y);c.rotate(angle);c.globalAlpha=alpha;c.fillStyle=pal[0];c.beginPath();c.moveTo(0,-size);c.lineTo(size*.27,0);c.lineTo(0,size*.32);c.lineTo(-size*.24,0);c.closePath();c.fill();path(c,[{x:0,y:-size},{x:0,y:size*.25}],pal[1],.8,alpha);c.restore();
  }
  function lightning(c,a,b,pal,alpha,seed,width=2){
    const pts=[a];for(let i=1;i<9;i++){const q=point(a,b,i/9);q.x+=(noise(seed+i)-.5)*24;q.y+=(noise(seed+20+i)-.5)*12;pts.push(q)}pts.push(b);
    path(c,pts,pal[2],width*5,alpha*.25);path(c,pts,pal[0],width*2,alpha*.8);path(c,pts,pal[1],width*.65,alpha);
    for(let i=2;i<7;i+=3)path(c,[pts[i],{x:pts[i].x+18,y:pts[i].y-7},{x:pts[i].x+25,y:pts[i].y+5}],pal[0],.8,alpha*.6);
  }
  function petals(c,p,r,pal,alpha,t,count=5){
    for(let i=0;i<count;i++){
      c.save();c.translate(p.x,p.y);c.rotate((i-(count-1)/2)*.42);c.globalAlpha=alpha;c.fillStyle=pal[0]+'55';c.strokeStyle=i%2?pal[1]:pal[0];c.lineWidth=1;c.beginPath();c.moveTo(0,r*.2);c.bezierCurveTo(-r*.55,-r*.24,-r*.28,-r*.85,0,-r*(.8+.15*t));c.bezierCurveTo(r*.28,-r*.8,r*.55,-r*.24,0,r*.2);c.fill();c.stroke();c.restore();
    }
  }
  // Filled silhouettes survive a narrow phone arena; a trail is only the connector.
  function flame(c,p,r,pal,alpha,phase=0){
    c.save();c.translate(p.x,p.y);c.globalAlpha=clamp(alpha);
    const drift=Math.sin(phase)*r*.13;
    const g=c.createLinearGradient(0,-r,0,r*.7);g.addColorStop(0,pal[1]);g.addColorStop(.42,pal[0]);g.addColorStop(1,pal[2]);
    c.fillStyle=g;c.strokeStyle=pal[1];c.lineWidth=.9;
    c.beginPath();c.moveTo(0,r*.7);c.bezierCurveTo(-r*.9,r*.45,-r*.8,-r*.25,-r*.42,-r*.48);c.quadraticCurveTo(-r*.5,r*.1,-r*.08,-r*.1);c.quadraticCurveTo(r*.33,-r*.7,drift,-r*1.3);c.bezierCurveTo(r*.83,-r*.66,r*.83,r*.55,0,r*.7);c.fill();c.stroke();
    c.fillStyle=pal[1];c.globalAlpha=alpha*.75;c.beginPath();c.moveTo(0,r*.57);c.quadraticCurveTo(-r*.37,0,r*.06,-r*.45);c.quadraticCurveTo(r*.46,r*.18,0,r*.57);c.fill();c.restore();
  }
  function crystal(c,p,h,angle,pal,alpha){
    c.save();c.translate(p.x,p.y);c.rotate(angle);const w=h*.23;
    c.globalAlpha=alpha;c.fillStyle=pal[2];c.strokeStyle=pal[1];c.lineWidth=1.25;
    c.beginPath();c.moveTo(0,-h);c.lineTo(w,-h*.55);c.lineTo(w*.66,h*.16);c.lineTo(-w*.7,h*.16);c.lineTo(-w,-h*.55);c.closePath();c.fill();c.stroke();
    c.fillStyle=pal[0];c.beginPath();c.moveTo(0,-h);c.lineTo(0,h*.16);c.lineTo(-w*.7,h*.16);c.lineTo(-w,-h*.55);c.closePath();c.fill();path(c,[{x:0,y:-h},{x:0,y:h*.16}],pal[1],1,alpha);c.restore();
  }
  function snow(c,p,r,pal,alpha,turn=0){
    for(let i=0;i<6;i++){const a=turn+i*TAU/6,q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};path(c,[p,q],pal[0],1.5,alpha);const m=point(p,q,.62);for(const sign of [-1,1])path(c,[m,{x:m.x+Math.cos(a+sign*.75)*r*.28,y:m.y+Math.sin(a+sign*.75)*r*.28}],pal[1],1,alpha*.9)}
  }
  function cloud(c,p,r,pal,alpha){
    c.save();c.globalAlpha=alpha;c.fillStyle=pal[2];c.strokeStyle=pal[0];c.lineWidth=1.5;c.beginPath();c.moveTo(p.x-r,p.y+7);
    c.bezierCurveTo(p.x-r*1.2,p.y-r*.36,p.x-r*.56,p.y-r*.55,p.x-r*.32,p.y-r*.22);
    c.bezierCurveTo(p.x-r*.15,p.y-r*.82,p.x+r*.45,p.y-r*.7,p.x+r*.55,p.y-r*.22);
    c.bezierCurveTo(p.x+r*.95,p.y-r*.44,p.x+r*1.25,p.y+r*.1,p.x+r,p.y+9);
    c.closePath();c.fill();c.stroke();c.restore();
  }
  // Pure presentation samples: stagger launches, share an arrival, never invent a hit.
  function sample(j,age,delay=0){
    const arrive=Math.max(90,j.arriveAt??(j.hitAt===null?250:Math.max(120,j.hitAt)));
    delay=Math.min(Math.max(0,delay),arrive-75);
    const struck=j.hitAt!==null&&age>=j.hitAt;
    return {visible:age>=0&&age<j.duration,arrive,travel:clamp((age-45-delay)/(arrive-45-delay)),struck,
      burst:struck?clamp((age-j.hitAt)/540):0,
      flight:clamp((j.hitAt===null?500-age:j.hitAt+120-age)/(j.hitAt===null?210:120))*clamp((j.duration-age)/260)};
  }
  function groundAnchors(j){return {from:j.fromGround||{x:j.from.x,y:j.from.y+30*(j.scale||1)},to:j.toGround||{x:j.to.x,y:j.to.y+30*(j.scale||1)}}}
  function drawGround(c,j,age){
    const state=sample(j,age);if(!state.visible)return;
    if(fireBatchReady(j.profile.name))return;
    if(j.profile.name==='绝对零度'&&absoluteZeroReady())return;
    if((j.profile.kind==='sun'&&solarReady())||(j.profile.kind==='butterfly'&&butterflyReady())||(j.profile.kind==='heart'&&heartReady()))return; // Solar plates own their single foot ring.
    const p=j.profile,pal=p.palette,s=j.scale||1,g=groundAnchors(j),fade=clamp((j.duration-age)/260);
    const groundKind=['field','prison','seal','crystal','meteor','pillar','wall','ground','mountain','lotus'].includes(p.kind);
    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();
    if(p.self)seal(c,g.from,(27+15*clamp(age/340))*s,pal,fade*.7,j.reduced?0:age*.0004);
    else if(p.source!=='passive'&&age<state.arrive)seal(c,g.from,(16+24*clamp(age/170))*s,pal,clamp((state.arrive-age)/150)*.6);
    if(!p.self&&groundKind){
      const a=state.struck?(1-state.burst)*fade*.7:clamp(age/120)*clamp((state.arrive+120-age)/120)*.4;
      seal(c,g.to,(state.struck?32+25*state.burst:32)*s,pal,a);
    }
    c.restore();
  }
  function draw(c,j,age){
    const p=j.profile,pal=p.palette,from=j.from,to=j.to,s=j.scale||1,light=j.light;
    const state=sample(j,age);if(!state.visible)return;
    if(fireDefinition(p.name)&&drawFireBatch(c,j,age))return;
    if(p.name==='绝对零度'&&drawAbsoluteZero(c,j,age))return;
    if(p.kind==='sun'&&drawSolar(c,j,age))return;
    if(p.kind==='butterfly'&&drawButterfly(c,j,age))return;
    if(p.kind==='heart'&&drawHeart(c,j,age))return;
    const duration=j.duration,fade=clamp((duration-age)/260),cast=clamp(age/170),hit=j.hitAt;
    const {arrive,travel,struck,burst}=state,flightAlpha=state.flight,g=groundAnchors(j);
    if(!j.groundDrawn)drawGround(c,j,age);
    c.save();c.beginPath();c.rect(0,0,j.width,j.clipBottom);c.clip();
    if(j.reduced){seal(c,p.self?from:to,34*s,pal,.75);halo(c,p.self?from:to,36*s,pal[0],.18);c.restore();return}
    // Keep the uploaded patch's local impact accent, bounded on mobile.
    if(struck&&!p.self&&p.tier>=2){const decay=clamp(1-burst/.3);if(decay){const a=noise((j.id||1)+Math.floor(age/60))*TAU,mag=(light?1.5:3)*s*decay;c.translate(Math.cos(a)*mag,Math.sin(a)*mag)}}
    if(p.source!=='passive'&&age<330){halo(c,from,30*s,pal[0],.16*(1-cast/2))}
    if(p.self){
      const rise=clamp(age/340),a=fade*.8;

      if(p.family==='heal'){
        if(p.kind==='lotus'||p.kind==='revive')petals(c,g.from,(39+19*rise)*s,pal,a,rise,light?5:7);
        else {for(let i=0;i<(light?2:3);i++){const t=(age/1100+i*.32)%1;ellipse(c,{x:from.x,y:g.from.y-t*75*s},(8+22*Math.sin(t*Math.PI))*s,5*s,pal[i%2],1,(1-t)*fade*.75)}}
        if(p.kind==='spring')for(let i=0;i<2;i++)ellipse(c,from,31*s,18*s,pal[0],1,a*.7,age*.001+i*Math.PI/2,0,Math.PI*1.45);
        if(p.kind==='revive')halo(c,from,62*s,pal[1],.2*fade*Math.sin(cast*Math.PI/2));
      }
      if(p.kind==='armor'||p.guard){ellipse(c,from,33*s,51*s,pal[0],1.6,a*.9);ellipse(c,from,37*s,55*s,pal[1],.6,a*.45);if(p.family==='thunder')lightning(c,{x:from.x-24*s,y:from.y-30*s},{x:from.x+23*s,y:from.y+25*s},pal,a*.65,7,1)}
      for(let i=0;i<(light?7:12);i++){const t=(age/1000+noise(i+9))%1,x=from.x+(noise(i+3)-.5)*64*s,y=from.y+(35-t*90)*s;shard(c,{x,y},(2+noise(i)*2)*s,.2,pal,Math.sin(t*Math.PI)*fade*.65)}
    }else if(p.family==='sword'||p.family==='spear'){
      const count=p.kind==='rain'?(light?5:9):p.kind==='fan'?3:1;
      for(let i=0;i<count;i++){
        const offset=(i-(count-1)/2),origin=p.kind==='rain'?{x:from.x+offset*11*s,y:from.y-42*s-Math.abs(offset)*7*s}:from;
        const target={x:to.x,y:to.y+offset*8*s};
        const t=sample(j,age,i*10).travel,a=flightAlpha;
        const end=ribbon(c,origin,target,t,pal,(p.kind==='great'?9:p.kind==='lance'?4:3)*s,offset*7*s-10*s,a*.8);
        if(t<1||age<arrive+220)blade(c,end,Math.atan2(target.y-origin.y,target.x-origin.x),(p.kind==='great'?100:p.kind==='lance'?90:55)*s,pal,a,(p.kind==='great'?10:5)*s);
      }
      if(struck&&burst<1){

        const r=(22+30*burst)*s;c.save();c.translate(to.x,to.y);c.rotate(-.6);ellipse(c,{x:0,y:0},r,r*.6,pal[0],(4-3*burst)*s,(1-burst)*.8,0,-1.5,1.4);ellipse(c,{x:0,y:0},r*.93,r*.57,pal[1],1,(1-burst),0,-1.4,1.2);c.restore();
        if(p.kind==='return'){const t=clamp((age-hit-100)/400);ribbon(c,to,from,t,pal,2*s,28*s,Math.sin(t*Math.PI)*fade)}
        if(p.guard)ellipse(c,from,32*s,49*s,pal[0],1.5,fade*.65);
      }
    }else if(p.family==='thunder'){
      if(p.kind==='armor'){}else if(p.kind==='storm'||p.kind==='bolt'||p.kind==='cage'){
        const high={x:to.x,y:Math.max(12,to.y-110*s)};
        if(p.kind==='storm'||p.kind==='cage')cloud(c,{x:high.x,y:high.y+10*s},42*s,pal,flightAlpha*.8);
        if(travel>.25){const n=p.kind==='storm'?(light?2:3):1;for(let i=0;i<n;i++)lightning(c,{x:high.x+(i-(n-1)/2)*28*s,y:high.y+12*s},point(high,to,travel),pal,flightAlpha,11+i,2.6*s)}
      }else lightning(c,from,point(from,to,travel),pal,flightAlpha,17,1.5*s);
      if(struck&&p.kind==='cage')for(let i=0;i<3;i++)ellipse(c,to,(22+i*5)*s,48*s,pal[0],1,fade*.5,i*Math.PI/3);

    }else if(p.family==='ice'){
      for(let i=0;i<(light?4:7);i++){
        const t=sample(j,age,i*8).travel,q=point(from,to,t);q.y+=(i-(light?1.5:3))*10*s*Math.sin(t*Math.PI);
        if(p.kind==='butterfly'){petals(c,q,10*s,pal,flightAlpha*.7,travel,2)}
        else if(p.kind==='breath'||p.kind==='icicle'||p.kind==='frost')crystal(c,q,(16+noise(i)*13)*s,Math.atan2(to.y-from.y,to.x-from.x)+Math.PI/2,pal,flightAlpha*.9);
        else if(struck){const o=(i-(light?1.5:3))*16*s;crystal(c,{x:g.to.x+o,y:g.to.y},(36+noise(i)*32)*s,o*.008,pal,(1-burst)*.85)}
      }
      if(!struck&&!['field','prison','seal','crystal'].includes(p.kind))ribbon(c,from,to,travel,pal,3*s,-10*s,flightAlpha*.55);
      if(struck&&(p.kind==='field'||p.kind==='prison'||p.kind==='seal'||p.kind==='crystal')){

        if(p.kind==='crystal')crystal(c,g.to,96*s,0,pal,(1-burst)*.85);
        if(p.kind==='prison')for(let i=0;i<3;i++)ellipse(c,to,(22+i*6)*s,46*s,pal[0],1,(1-burst)*.8,i*.4-.4);
      }
      if(struck)snow(c,to,(28+21*burst)*s,pal,(1-burst)*.9,burst*.18);
    }else if(p.family==='fire'){
      if(p.kind==='meteor'){
        for(let i=0;i<(light?3:5);i++){const offset=i-((light?3:5)-1)/2,start={x:g.to.x+offset*29*s-35*s,y:Math.max(8,to.y-125*s)},target={x:g.to.x+offset*19*s,y:g.to.y};const q=ribbon(c,start,target,sample(j,age,i*12).travel,pal,4*s,0,flightAlpha*.5);flame(c,q,17*s,pal,flightAlpha,age*.009+i)}
      }else if(p.kind==='breath'){for(let i=0;i<(light?4:6);i++){const t=sample(j,age,i*22).travel,q=point(from,to,t);q.y+=Math.sin(t*Math.PI+i)*8*s;flame(c,q,(12+t*16)*s,pal,flightAlpha*.85,age*.009+i)}}
      else {const q=ribbon(c,from,to,travel,pal,3*s,-18*s,flightAlpha*.4);flame(c,q,24*s,pal,flightAlpha,age*.01)}
      if(struck){

        if(p.kind==='lotus')petals(c,g.to,(44+16*burst)*s,pal,(1-burst)*.95,burst,7);
        else if(p.kind==='bind')for(let i=0;i<2;i++)ellipse(c,to,(29+i*5)*s,43*s,pal[0],2,(1-burst)*.8,i*.8-.4);
        else {for(let i=0;i<(light?4:7);i++){const t=burst;const base=['meteor','field','wall','pillar'].includes(p.kind)?g.to:to;const q={x:base.x+(noise(i+40)-.5)*(62+35*t)*s,y:base.y-t*(25+noise(i)*30)*s};flame(c,q,(21+noise(i+3)*18)*(1-t*.45)*s,pal,(1-t)*.9,age*.01+i)}}
        if(p.kind==='sun'){halo(c,to,(24+26*burst)*s,pal[1],(1-burst)*.4);ellipse(c,to,26*s,26*s,pal[1],1,(1-burst)*.9)}
      }
    }else if(p.family==='earth'){
      if(!struck)ribbon(c,from,to,travel,pal,7*s,24*s,flightAlpha*.7);
      if(struck){

        if(p.kind==='mountain'){
          const h=(1-clamp(burst*.3))*104*s,w=62*s,base=g.to.y;
          const ridge=[{x:to.x-w,y:base},{x:to.x-w*.72,y:to.y-h*.45},{x:to.x-w*.42,y:to.y-h*.26},{x:to.x-w*.08,y:to.y-h},{x:to.x+w*.24,y:to.y-h*.37},{x:to.x+w*.54,y:to.y-h*.64},{x:to.x+w,y:base}];
          c.globalAlpha=(1-burst)*.4;c.fillStyle='#182e2b';c.beginPath();c.moveTo(ridge[0].x,ridge[0].y);for(const q of ridge.slice(1))c.lineTo(q.x,q.y);c.closePath();c.fill();
          path(c,ridge,'#172724',5*s,(1-burst)*.95);path(c,ridge,pal[1],1.8*s,(1-burst)*.95);
          for(let i=1;i<6;i+=2)path(c,[ridge[i],{x:ridge[i].x-8*s,y:ridge[i].y+22*s},{x:ridge[i].x+4*s,y:base-6*s}],pal[0],1,(1-burst)*.75);
        }
        for(let i=0;i<5;i++){const a=i*TAU/5,r=(18+38*burst)*s;path(c,[{x:to.x,y:g.to.y},{x:to.x+Math.cos(a)*r*.6,y:g.to.y+Math.sin(a)*r*.18},{x:to.x+Math.cos(a+.15)*r,y:g.to.y+Math.sin(a+.15)*r*.32}],pal[2],1.7,(1-burst)*.8)}
      }
    }else{
      for(let i=0;i<(light?2:3);i++)ribbon(c,from,to,travel,pal,4*s,(i-1)*23*s,flightAlpha*.7);
      if(struck){ellipse(c,to,(20+26*burst)*s,(36+10*burst)*s,pal[0],2,(1-burst)*.8,burst*.3);halo(c,to,45*s,pal[2],(1-burst)*.3)}
    }
    if(struck&&!p.self){
      const a=(1-burst)*fade;
      if(burst<.18)halo(c,to,(28+p.tier*8)*s,'#fff6df',(1-burst/.18)*.32*fade);
      halo(c,to,(12+36*burst)*s,pal[0],a*.22);
      ellipse(c,to,(10+44*burst)*s,(6+23*burst)*s,pal[0],1.3,a*.65,-.25);
      if(p.tier===3){const ring=clamp(burst*1.3);ellipse(c,to,(18+70*ring)*s,(10+38*ring)*s,pal[1],Math.max(.3,2.4*(1-ring)*s),(1-ring)*.6,-.25)}
      const count=light?9:18;
      for(let i=0;i<count;i++){const angle=noise(i+41)*TAU,r=(6+burst*(22+noise(i+31)*49))*s,q={x:to.x+Math.cos(angle)*r,y:to.y+Math.sin(angle)*r*.7+burst*burst*14*s};shard(c,q,(1.5+noise(i+2)*3)*s,angle,pal,a*.75)}
    }
    c.restore();c.globalAlpha=1;
  }
  function live(){return !D.hidden&&(typeof gameState==='undefined'||gameState==='combat'||(gameState==='combat-ending'&&now()<finishUntil))&&!D.getElementById('combatPanel')?.classList.contains('hidden')}
  function clear(resetLabel=false,preserveThunder=false){
    if(preserveThunder){reportThunder.pause();reportIce.pause();}else{reportThunder.clear();reportIce.clear();}
    finishUntil=0;
    if(raf)cancelAnimationFrame(raf);raf=0;if(timer)clearTimeout(timer);timer=0;jobs=[];lastFrame=-Infinity;
    if(canvas){canvas.width=canvas.height=1;canvas.remove();canvas=null;ctx=null}
    if(resetLabel){const label=D.getElementById('inkFxNameV2854');if(label)label.textContent='术法招式'}
  }
  function resumeThunder(){
    reportThunder.sync();reportIce.sync();
    if(!live()||(!reportThunder.inspect().length&&!reportIce.inspect().length)||D.getElementById('combatArena')?.classList.contains('duel25-active'))return;
    const host=D.getElementById('skillEffect'),box=host?.getBoundingClientRect();if(!box||box.width<1||box.height<1)return;
    if(!canvas){const opt=settings(),ratio=Math.min(W.devicePixelRatio||1,opt.dpr,Math.sqrt(opt.pixels/(box.width*box.height)));
      canvas=D.createElement('canvas');canvas.className='ink-skill-canvas-v2854';canvas.setAttribute('aria-hidden','true');ctx=canvas.getContext('2d');if(!ctx){canvas=null;return;}
      host.replaceChildren(canvas);canvas.width=Math.max(1,Math.floor(box.width*ratio));canvas.height=Math.max(1,Math.floor(box.height*ratio));
    }
    if(!raf)raf=requestAnimationFrame(frame);
  }
  function refreshThunder(){clear(false,true);resumeThunder();sync();}
  // Preserve only an already-confirmed impact during settlement; never delay rewards,
  // start another cast, or replay the attack. Manual exit and visibility cleanup win.
  function finish(){
    reportThunder.clear();reportIce.clear();
    if(typeof gameState==='undefined'||gameState!=='combat-ending'||D.hidden){clear(true);return}
    if(finishUntil)return;
    const stamp=now();jobs=jobs.filter(j=>j.hitAt!==null&&stamp-j.started<j.hitAt+540);
    if(!jobs.length){clear(true);return}
    finishUntil=stamp+560;
    for(const j of jobs)j.duration=Math.min(j.duration,j.hitAt+540);
    if(timer)clearTimeout(timer);timer=setTimeout(()=>clear(true),560);
    if(!raf&&!settings().reduced)raf=requestAnimationFrame(frame);
  }
  function cinemaClear(){if(typeof gameState!=='undefined'&&gameState==='combat-ending')finish();else clear(false,D.hidden&&typeof gameState!=='undefined'&&gameState==='combat')}
  function frame(stamp){
    raf=0;if(!live()){clear();return}
    if(D.getElementById('combatArena')?.classList.contains('duel25-active')){clear();return}
    const thunderJobs=reportThunder.collect((name,a)=>{
      if(!canvas)return null;const box=D.getElementById('skillEffect').getBoundingClientRect(),hero=anchor('combatPlayerChar',box,'player'),enemy=anchor('enemyChar',box,'enemy'),opt=settings();
      a.reportGround??={x:enemy.x,y:enemy.bottom};
      return {profile:profile(name),from:hero,to:enemy,fromGround:{x:hero.x,y:hero.bottom},toGround:a.reportGround,width:box.width,height:box.height,clipBottom:box.height,...reportThunderLayout(name,box,hero,{...enemy,x:a.reportGround.x,bottom:a.reportGround.y}),ratio:canvas.width/box.width,light:opt.light,reduced:opt.reduced,arriveAt:310};
    });
    const iceRecords=reportIce.collect();
    jobs=jobs.filter(j=>stamp-j.started<j.duration);
    if(!jobs.length&&!thunderJobs.length&&!iceRecords.length){clear();return}
    const fps=jobs.some(j=>!j.light)?30:24;
    if(stamp-lastFrame>=1000/fps){lastFrame=stamp;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);const box=D.getElementById('skillEffect').getBoundingClientRect(),ratio=jobs[0]?.ratio??thunderJobs[0]?.job.ratio??canvas.width/Math.max(1,box.width);ctx.setTransform(ratio,0,0,ratio,0,0);for(const j of jobs)if(!j.thunderOwned){if(j.profile.name==='冰甲护身'){const d=readIceState(typeof currentEnemy==='undefined'?null:currentEnemy,typeof player==='undefined'?null:player);j.guardActive=d.guardElement==='ice'&&d.guardPool>0&&d.guardTurns>0;}draw(ctx,j,stamp-j.started);}for(const {job,age}of thunderJobs)thunderBatch3.drawState(ctx,job,age);for(const r of iceRecords){const a=anchor(r.kind==='guard'?'combatPlayerChar':'enemyChar',box,r.kind==='guard'?'player':'enemy');iceFinale.drawStatus(ctx,r,{x:a.x,y:r.kind==='seal'?a.y-22:a.bottom},{scale:clamp(box.width/720,.4,1.1),reduced:settings().reduced,width:box.width,clipBottom:box.height});}}
    raf=requestAnimationFrame(frame);
  }
  function anchor(id,host,side){
    const r=D.getElementById(id)?.getBoundingClientRect();
    if(r&&r.width&&r.height)return {x:clamp(r.left+r.width*.5-host.left,24,host.width-24),y:clamp(r.top+r.height*.46-host.top,24,host.height-24),bottom:clamp(r.bottom-host.top+6,40,host.height)};
    return {x:host.width*(side==='player'?.24:.76),y:host.height*.43,bottom:host.height*.76};
  }
  function reportThunderLayout(name,box,hero,enemy){
    const D=thunderBatch3.definition(name),base=clamp(box.width/460,.67,1.12);
    if(!D||D.key==='chain_lightning')return {scale:base};
    const point=D.key==='thunder_mantle'?hero:enemy;
    const scale=Math.min(base,Math.max(.05,2*(Math.min(point.x,box.width-point.x)-6)/Math.max(...Object.values(D.display))));
    const hud=D.key==='high_cloud'?document.getElementById('battleVitalsV286816')?.getBoundingClientRect():null;
    return {scale,cloudHeight:Math.min(D.timing.cloudHeight,Math.max(0,enemy.bottom-Math.max(16,hud?hud.bottom-box.top+8:16)-D.display.body*scale/2))};
  }
  function play(name,element='',side='player',source='active'){
    if(name==='雷神附体·反噬')return true;
    if(typeof gameState!=='undefined'&&gameState==='combat-ending')return true;
    if(!live())return true;
    const host=D.getElementById('skillEffect');if(!host)return false;
    const box=host.getBoundingClientRect();if(box.width<1||box.height<1)return true;
    const opt=settings(),p=profile(name,element,null,source);
    if(typeof clearSkillFxV2786==='function')clearSkillFxV2786();
    if(canvas&&!canvas.isConnected)clear(false,true);
    const ratio=Math.min(W.devicePixelRatio||1,opt.dpr,Math.sqrt(opt.pixels/(box.width*box.height)));
    if(canvas&&(canvas.width!==Math.floor(box.width*ratio)||canvas.height!==Math.floor(box.height*ratio)))clear(false,true);
    if(!canvas){canvas=D.createElement('canvas');canvas.className='ink-skill-canvas-v2854';canvas.setAttribute('aria-hidden','true');ctx=canvas.getContext('2d');if(!ctx){canvas=null;return false}host.replaceChildren(canvas);canvas.width=Math.max(1,Math.floor(box.width*ratio));canvas.height=Math.max(1,Math.floor(box.height*ratio));}
    const a=anchor('combatPlayerChar',box,'player'),b=anchor('enemyChar',box,'enemy'),from=side==='enemy'?b:a,to=p.self?from:side==='enemy'?a:b;
    const started=now(),job={id:++serial,profile:p,side,from,to,width:box.width,height:box.height,clipBottom:Math.min(a.bottom,b.bottom),scale:clamp(box.width/460,.67,1.12),ratio,started,light:opt.light,reduced:opt.reduced,duration:opt.reduced?360:source==='passive'?620:opt.light?880:1040,hitAt:p.self?170:source==='passive'?120:null};
    if(fireDefinition(name)){if(!(opt.reduced&&(elementDefinition(name)||swordBatch.definition(name)||swordBatch2.definition(name))))job.duration=1100;job.arriveAt=310;job.fromGround={x:from.x,y:from.bottom};job.toGround={x:to.x,y:to.bottom};}
    if(thunderBatch3.definition(name))Object.assign(job,reportThunderLayout(name,box,a,b));
    jobs=jobs.filter(j=>j.side!==side&&started-j.started<j.duration);jobs.push(job);if(jobs.length>2)jobs.shift();
    const label=D.getElementById('inkFxNameV2854');if(label){label.textContent=(source==='passive'?'被动':side==='enemy'?'敌方':'我方')+' · '+p.name;label.style.color=p.palette[0]}
    if(timer)clearTimeout(timer);timer=(reportThunder.inspect().length||reportIce.inspect().length)?0:setTimeout(()=>clear(),Math.max(...jobs.map(j=>j.started+j.duration))-started+80);
    if(opt.reduced){if(raf)cancelAnimationFrame(raf);raf=0;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,box.width,box.height);draw(ctx,job,200);if(reportIce.inspect().length||reportThunder.inspect().length)raf=requestAnimationFrame(frame)}else if(!raf)raf=requestAnimationFrame(frame);
    return true;
  }
  function hit(side){for(const j of jobs){if(j.profile.self||j.hitAt!==null||j.side===side)continue;const age=now()-j.started;if(age<600){j.hitAt=Math.max(120,age);if(j.reduced&&(['sun','butterfly','heart'].includes(j.profile.kind)||j.profile.name==='绝对零度'||fireDefinition(j.profile.name))&&ctx){ctx.setTransform(j.ratio,0,0,j.ratio,0,0);ctx.clearRect(0,0,j.width,j.height);for(const active of jobs)draw(ctx,active,Math.max(now()-active.started,(active.hitAt??0)+(active.reduced&&fireDefinition(active.profile.name)?100:0)));}}}}
  function sync(){const btn=D.getElementById('inkFxQualityV2854');if(btn){btn.textContent='特效：'+(settings().reduced?'静态':({auto:'自动',rich:'精致',light:'省电'}[quality]));btn.setAttribute('aria-label',btn.textContent+'，点击切换');}}
  function cycle(){quality={auto:'rich',rich:'light',light:'auto'}[quality];try{localStorage.setItem(KEY,quality)}catch(_){}refreshThunder()}
  function install(){
    const btn=D.getElementById('inkFxQualityV2854');if(btn&&!btn.dataset.boundV2854){btn.dataset.boundV2854='1';btn.addEventListener('click',cycle)}sync();
    const panel=D.getElementById('combatPanel');panel?.classList.add('ink-fx-ready-v2854');if(panel&&!observer&&typeof MutationObserver==='function'){observer=new MutationObserver(()=>{if(panel.classList.contains('hidden'))clear(true)});observer.observe(panel,{attributes:true,attributeFilter:['class']})}
  }
  D.addEventListener('visibilitychange',()=>{if(D.hidden)clear(false,true);else resumeThunder()});W.addEventListener('pagehide',()=>clear());W.addEventListener('resize',refreshThunder);W.addEventListener('orientationchange',refreshThunder);W.addEventListener('xiantu:combat-finishing',finish);
  W.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',refreshThunder);
  // Presentation controls cancel visuals without touching the battle queue.
  for(const name of ['pauseVisualsV2767']){const base=W[name];if(typeof base==='function')W[name]=function(...args){clear(false,true);return base.apply(this,args)}}
  for(const name of ['resumeVisualsV2767']){const base=W[name];if(typeof base==='function')W[name]=function(...args){const result=base.apply(this,args);resumeThunder();return result}}
  W.playInkSkillV2854=play;
  const solar={definition:SOLAR,prepare:prepareSolar,ready:solarReady,sample:solarSample};
  const butterfly={definition:ICE_BUTTERFLY,prepare:prepareButterfly,ready:butterflyReady,sample:butterflySample};
  W.InkSkillFxV2854={profile,draw,drawGround,sample,solar,butterfly,heart,absoluteZero,swordBatch,swordBatch2,fireBatch,fireBatch2,fireBatch3,elementBatch,thunderBatch,thunderBatch2,thunderBatch3,fireFinale,iceFinale,authoredDuration:name=>fireDefinition(name)?1100:0,catalog:()=>[...new Set([...Object.keys(styles),...Object.keys(forms),...(typeof SKILLS!=='undefined'?SKILLS.map(s=>s.name):[])])].map(name=>profile(name)),play,hit,clear,finish,cinemaClear,install,cycle,settings,inspect:()=>({version:'28.68',quality,finishing:finishUntil>now(),active:jobs.length,iceStates:reportIce.inspect(),raf:!!raf,pixels:canvas?canvas.width*canvas.height:0,jobs:jobs.map(j=>({name:j.profile.name,kind:j.profile.kind,family:j.profile.family,side:j.side,self:j.profile.self,hitAt:j.hitAt,from:{...j.from},to:{...j.to}}))})};
  install();
})();
;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2855-skill-fx.js']='28.68.85';
