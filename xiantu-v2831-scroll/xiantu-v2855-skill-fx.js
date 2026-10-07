/* V28.68 · 墨意斗法. Visuals only: no combat timers, RNG, damage or paid calls. */
(function(){
  'use strict';
  const W=window, D=document, TAU=Math.PI*2, KEY='xiantu_skill_fx_v2854';
  const palettes={sword:['#a7d5cf','#f5e7b4','#284d50'],heal:['#8dbfa0','#f6e4b0','#31594b'],ice:['#b6d7e0','#eff5dd','#3b6578'],fire:['#d88b57','#f8dda3','#824b43'],thunder:['#b9adcf','#f8e6bc','#595075'],earth:['#bda674','#f3deaa','#685b45'],spear:['#dfc48a','#fff2c9','#61553c'],dark:['#b9a4be','#ddc8cb','#564757'],blood:['#c77678','#f3cab0','#723e4c'],spirit:['#a6c9b9','#e8e5bd','#3b5b55']};
  const styles={御剑术:'blade',清风剑诀:'blade',剑气纵横:'fan',万剑归宗:'rain',天地一剑:'great',破甲剑罡:'pierce',追魂一剑:'pierce',饮血剑诀:'return',玄罡护体剑:'guardblade',镇岳山河震:'mountain',穿云贯日:'lance',凝露诀:'dew',治愈术:'dew',回春术:'dew',灵泉归元:'spring',青莲护心:'lotus',生生不息:'lotus',莲华济世:'lotus',逆命回元:'revive',起死回生:'revive'};
  const forms={'九霄雷云':'storm','雷法':'bolt','惊雷闪':'dart','裂地奔雷':'ground','紫霄落雷':'bolt','万雷噬狱':'cage','九天神雷':'storm','闪电链':'chain','雷神附体':'armor','雷神附体·反噬':'bolt','无音神雷':'silent','寒冰掌':'frost','冰封千里':'field','绝对零度':'prison','玄冰刺':'icicle','冰爆术':'burst','霜寒结界':'field','冰蝶幻舞':'butterfly','霜龙吐息':'breath','冰河葬狱':'prison','寒渊领域':'field','冰甲护身':'armor','冰魄封魂':'seal','万载寒晶':'crystal','烈焰斩':'slash','焚天烈焰':'pillar','天火焚世':'meteor','炎爆术':'burst','红莲业火':'lotus','火墙术':'wall','三昧真火':'triple','赤焰龙息':'breath','焚心炎':'heart','燎原火域':'field','太阳真火':'sun','流火飞索':'bind','炎阳护盾':'armor'};
  // BEGIN SOLAR GENERATED CONFIG
  const SOLAR = {"key":"solar_true_fire","name":"太阳真火","element":"fire","visualArchetype":"projectile","layers":{"telegraph":{"file":"solar_telegraph.png","frames":4,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.5,"fps":32,"loop":false,"holdLast":false},"body":{"file":"solar_body.png","frames":8,"frameWidth":192,"frameHeight":192,"pivotX":0.5,"pivotY":0.5,"fps":32,"loop":true,"holdLast":false},"impact":{"file":"solar_impact.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.65,"fps":34,"loop":false,"holdLast":false},"residue":{"file":"solar_residue.png","frames":6,"frameWidth":256,"frameHeight":256,"pivotX":0.5,"pivotY":0.65,"fps":17,"loop":false,"holdLast":false}},"scale":1,"offsetX":0,"offsetY":0,"trailLength":42,"timing":{"defaultArrival":310,"anticipationFraction":0.35,"impactMs":180,"aftermathMs":540,"transitionMs":60,"missedFadeMs":150},"display":{"body":128,"telegraph":205,"impact":350,"residue":350},"preview":{"displayMode":"projectile","motion":"travel","durationMs":850,"distance":233,"layers":{"telegraph":{"start":0,"end":0.16,"anchor":"origin","width":205,"height":205,"fadeOut":0.22},"body":{"start":0,"end":0.36470588235294116,"anchor":"moving","width":128,"height":128},"impact":{"start":0.36470588235294116,"end":0.5764705882352941,"anchor":"target","width":350,"height":350,"fadeOut":0.3333333333333333},"residue":{"start":0.5058823529411764,"end":1,"anchor":"target","width":350,"height":350,"fadeIn":0.14285714285714285,"fadeOut":0.25}}},"acceptance":["Fixed-size solar body; no additional hits or RNG","Impact requires the existing hit event; locked target ground","Shared ground pivot and complementary impact/residue opacity","All layers expire, including misses and reduced-motion mode"]};
  // END SOLAR GENERATED CONFIG
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
  function profile(name,element='',info=null,source='active'){
    name=String(name||'灵力冲击');
    if(!info&&typeof SKILLS!=='undefined')info=SKILLS.find(s=>s.name===name)||null;
    let family=element||info?.element||(/凝露|治愈|回春|灵泉|青莲|生生不息|莲华|逆命回元|起死回生/.test(name)?'heal':/雷|天劫/.test(name)?'thunder':/冰|霜|寒/.test(name)?'ice':/火|焰|炎/.test(name)?'fire':/剑|斩|试锋/.test(name)?'sword':/血/.test(name)?'blood':/幽冥|鬼|魂/.test(name)?'spirit':/魔|妖/.test(name)?'dark':'earth');
    if(name==='镇岳山河震')family='earth';if(name==='穿云贯日')family='spear';
    if(!palettes[family])family='spirit';
    let kind=styles[name]||forms[name]||({sword:'blade',heal:'dew',ice:'breath',fire:'burst',thunder:'bolt',dark:'wave',blood:'wave',spirit:'wave',earth:'ground',spear:'lance'}[family]);
    if(kind==='sun')prepareSolar();
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
    if(j.profile.kind==='sun'&&solarReady())return; // Solar plates own their single foot ring.
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
    if(p.kind==='sun'&&drawSolar(c,j,age))return;
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
  function clear(resetLabel=false){
    finishUntil=0;
    if(raf)cancelAnimationFrame(raf);raf=0;if(timer)clearTimeout(timer);timer=0;jobs=[];lastFrame=-Infinity;
    if(canvas){canvas.width=canvas.height=1;canvas.remove();canvas=null;ctx=null}
    if(resetLabel){const label=D.getElementById('inkFxNameV2854');if(label)label.textContent='术法招式'}
  }
  // Preserve only an already-confirmed impact during settlement; never delay rewards,
  // start another cast, or replay the attack. Manual exit and visibility cleanup win.
  function finish(){
    if(typeof gameState==='undefined'||gameState!=='combat-ending'||D.hidden){clear(true);return}
    if(finishUntil)return;
    const stamp=now();jobs=jobs.filter(j=>j.hitAt!==null&&stamp-j.started<j.hitAt+540);
    if(!jobs.length){clear(true);return}
    finishUntil=stamp+560;
    for(const j of jobs)j.duration=Math.min(j.duration,j.hitAt+540);
    if(timer)clearTimeout(timer);timer=setTimeout(()=>clear(true),560);
    if(!raf&&!settings().reduced)raf=requestAnimationFrame(frame);
  }
  function cinemaClear(){if(typeof gameState!=='undefined'&&gameState==='combat-ending')finish();else clear()}
  function frame(stamp){
    raf=0;if(!live()){clear();return}
    jobs=jobs.filter(j=>stamp-j.started<j.duration);
    if(!jobs.length){clear();return}
    const fps=jobs.some(j=>!j.light)?30:24;
    if(stamp-lastFrame>=1000/fps){lastFrame=stamp;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(jobs[0].ratio,0,0,jobs[0].ratio,0,0);for(const j of jobs)draw(ctx,j,stamp-j.started)}
    raf=requestAnimationFrame(frame);
  }
  function anchor(id,host,side){
    const r=D.getElementById(id)?.getBoundingClientRect();
    if(r&&r.width&&r.height)return {x:clamp(r.left+r.width*.5-host.left,24,host.width-24),y:clamp(r.top+r.height*.46-host.top,24,host.height-24),bottom:clamp(r.bottom-host.top+6,40,host.height)};
    return {x:host.width*(side==='player'?.24:.76),y:host.height*.43,bottom:host.height*.76};
  }
  function play(name,element='',side='player',source='active'){
    if(typeof gameState!=='undefined'&&gameState==='combat-ending')return true;
    if(!live())return true;
    const host=D.getElementById('skillEffect');if(!host)return false;
    const box=host.getBoundingClientRect();if(box.width<1||box.height<1)return true;
    const opt=settings(),p=profile(name,element,null,source);
    if(typeof clearSkillFxV2786==='function')clearSkillFxV2786();
    if(canvas&&!canvas.isConnected)clear();
    const ratio=Math.min(W.devicePixelRatio||1,opt.dpr,Math.sqrt(opt.pixels/(box.width*box.height)));
    if(canvas&&(canvas.width!==Math.floor(box.width*ratio)||canvas.height!==Math.floor(box.height*ratio)))clear();
    if(!canvas){canvas=D.createElement('canvas');canvas.className='ink-skill-canvas-v2854';canvas.setAttribute('aria-hidden','true');ctx=canvas.getContext('2d');if(!ctx){canvas=null;return false}host.replaceChildren(canvas);canvas.width=Math.max(1,Math.floor(box.width*ratio));canvas.height=Math.max(1,Math.floor(box.height*ratio));}
    const a=anchor('combatPlayerChar',box,'player'),b=anchor('enemyChar',box,'enemy'),from=side==='enemy'?b:a,to=p.self?from:side==='enemy'?a:b;
    const started=now(),job={id:++serial,profile:p,side,from,to,width:box.width,height:box.height,clipBottom:Math.min(a.bottom,b.bottom),scale:clamp(box.width/460,.67,1.12),ratio,started,light:opt.light,reduced:opt.reduced,duration:opt.reduced?360:source==='passive'?620:opt.light?880:1040,hitAt:p.self?170:source==='passive'?120:null};
    jobs=jobs.filter(j=>j.side!==side&&started-j.started<j.duration);jobs.push(job);if(jobs.length>2)jobs.shift();
    const label=D.getElementById('inkFxNameV2854');if(label){label.textContent=(source==='passive'?'被动':side==='enemy'?'敌方':'我方')+' · '+p.name;label.style.color=p.palette[0]}
    if(timer)clearTimeout(timer);timer=setTimeout(()=>clear(),Math.max(...jobs.map(j=>j.started+j.duration))-started+80);
    if(opt.reduced){if(raf)cancelAnimationFrame(raf);raf=0;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,box.width,box.height);draw(ctx,job,200)}else if(!raf)raf=requestAnimationFrame(frame);
    return true;
  }
  function hit(side){for(const j of jobs){if(j.profile.self||j.hitAt!==null||j.side===side)continue;const age=now()-j.started;if(age<600){j.hitAt=Math.max(120,age);if(j.reduced&&j.profile.kind==='sun'&&ctx){ctx.setTransform(j.ratio,0,0,j.ratio,0,0);ctx.clearRect(0,0,j.width,j.height);for(const active of jobs)draw(ctx,active,Math.max(now()-active.started,active.hitAt??0));}}}}
  function sync(){const btn=D.getElementById('inkFxQualityV2854');if(btn){btn.textContent='特效：'+(settings().reduced?'静态':({auto:'自动',rich:'精致',light:'省电'}[quality]));btn.setAttribute('aria-label',btn.textContent+'，点击切换');}}
  function cycle(){quality={auto:'rich',rich:'light',light:'auto'}[quality];try{localStorage.setItem(KEY,quality)}catch(_){}clear();sync()}
  function install(){
    const btn=D.getElementById('inkFxQualityV2854');if(btn&&!btn.dataset.boundV2854){btn.dataset.boundV2854='1';btn.addEventListener('click',cycle)}sync();
    const panel=D.getElementById('combatPanel');panel?.classList.add('ink-fx-ready-v2854');if(panel&&!observer&&typeof MutationObserver==='function'){observer=new MutationObserver(()=>{if(panel.classList.contains('hidden'))clear(true)});observer.observe(panel,{attributes:true,attributeFilter:['class']})}
  }
  D.addEventListener('visibilitychange',()=>{if(D.hidden)clear()});W.addEventListener('pagehide',()=>clear());W.addEventListener('resize',()=>{clear();sync()});W.addEventListener('orientationchange',()=>clear());W.addEventListener('xiantu:combat-finishing',finish);
  W.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>{clear();sync()});
  // Presentation controls cancel visuals without touching the battle queue.
  for(const name of ['pauseVisualsV2767']){const base=W[name];if(typeof base==='function')W[name]=function(...args){clear();return base.apply(this,args)}}
  W.playInkSkillV2854=play;
  const solar={definition:SOLAR,prepare:prepareSolar,ready:solarReady,sample:solarSample};
  W.InkSkillFxV2854={profile,draw,drawGround,sample,solar,catalog:()=>[...new Set([...Object.keys(styles),...Object.keys(forms),...(typeof SKILLS!=='undefined'?SKILLS.map(s=>s.name):[])])].map(name=>profile(name)),play,hit,clear,finish,cinemaClear,install,cycle,settings,inspect:()=>({version:'28.68',quality,finishing:finishUntil>now(),active:jobs.length,raf:!!raf,pixels:canvas?canvas.width*canvas.height:0,jobs:jobs.map(j=>({name:j.profile.name,kind:j.profile.kind,family:j.profile.family,side:j.side,self:j.profile.self,hitAt:j.hitAt,from:{...j.from},to:{...j.to}}))})};
  install();
})();
;window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2855-skill-fx.js']='28.68.30';
