/* 月汐莲湾: one lazily built scene, driven by the island's existing frame loop. */
(function(window,document){
  'use strict';
  var R=window.LotusRules,GA=window.GardenAudio,M=window.__music2;
  // Same definition and recording transport as chapter 3; same cached buffer and URL.
  if(M){
    var original=M.tracks.filter(function(t){return t.id==='nightvoyage';})[0],score={};
    Object.keys(original).forEach(function(k){score[k]=original[k];});
    score.id='moonlotus';score.name='星灯夜曲';M.register(score);
  }
  var H,T,J,group,pool,moon,flowers=[],ripples=[],temp,active=false,reduced=false,lastFocus=null;
  var coords=[[-1.65,.8],[-1.5,-1.15],[0,-1.9],[1.5,-1.15],[1.65,.8],[0,1.7]];
  function $(id){return document.getElementById(id);}
  function progress(){return J.progress.lotus;}
  function finished(){return progress().found.length===6;}
  function canPlay(){return active&&H.isStarted()&&!J.blocked()&&!document.hidden;}
  function hint(){return '轻触莲花，送去三缕月光 · 不用等待，没有限时';}
  function sound(i){if(GA&&GA.isSfxOn())GA.melody([[0,2],[2,4],[4,7],[5,9],[7,9],[9,12]][i],.16,true);}
  function give(i){
    if(!canPlay())return;
    var result=R.give(progress(),i);flowers[i].pulse=1;flowers[i].g.getWorldPosition(temp);
    sound(i);var ring=ripples[i];ring.time=1;ring.mesh.position.x=coords[i][0];ring.mesh.position.z=coords[i][1];
    if(!result.changed){H.toast('这朵莲花记得你的光。留下来，听听月色吧。',2000);return;}
    if(result.finished)J.complete(5);
    J.changed();render();
    if(result.finished)showEnding();
    else H.toast(result.bloomed?'「'+R.blooms[i].name+'」绽开了 · 已收入手账':R.blooms[i].name+'收到了第 '+progress().light[i]+' 缕月光',2200);
  }
  function next(){var i=progress().light.indexOf(0);if(i<0)i=progress().light.findIndex(function(n){return n<3;});give(i<0?0:i);}
  function showEnding(){lastFocus=document.activeElement;$('lotusEnding').hidden=false;$('lotusStay').focus();}
  function closeEnding(){$('lotusEnding').hidden=true;if(lastFocus&&document.contains(lastFocus)&&lastFocus.getClientRects().length)lastFocus.focus();}
  function buildWorld(){
    if(group)return;
    group=new T.Group();group.position.y=H.TOP_Y+1.5;H.island.add(group);
    var water=new T.MeshPhongMaterial({color:0x426b89,emissive:0x15283e,shininess:65,transparent:true,opacity:.94});
    pool=new T.Mesh(new T.CylinderGeometry(2.65,2.45,.12,64),water);pool.position.y=-.08;group.add(pool);
    var rim=new T.Mesh(new T.TorusGeometry(2.65,.055,6,64),new T.MeshLambertMaterial({color:0xb8c7dc}));rim.rotation.x=Math.PI/2;group.add(rim);
    var under=new T.Mesh(new T.SphereGeometry(2.4,24,12),new T.MeshLambertMaterial({color:0x737ca8}));under.scale.set(1,.15,1);under.position.y=-.18;group.add(under);
    var petalGeo=new T.SphereGeometry(1,10,6),leafGeo=new T.CylinderGeometry(.46,.46,.025,24),seedGeo=new T.SphereGeometry(.14,10,6),ringGeo=new T.TorusGeometry(.36,.018,4,28);
    R.blooms.forEach(function(b,i){
      var g=new T.Group();g.position.set(coords[i][0],.06,coords[i][1]);group.add(g);
      var leaf=new T.Mesh(leafGeo,new T.MeshLambertMaterial({color:0x5b9b99}));leaf.position.y=-.025;g.add(leaf);
      var petals=[],mat=new T.MeshLambertMaterial({color:b.color,emissive:b.color,emissiveIntensity:.22});
      for(var j=0;j<10;j++){
        var a=j/10*Math.PI*2,pivot=new T.Group();pivot.rotation.y=a;g.add(pivot);
        var petal=new T.Mesh(petalGeo,mat);petal.scale.set(.16,.12,.4);petal.position.set(0,.15,.25);pivot.add(petal);petals.push(pivot);
      }
      var seed=new T.Mesh(seedGeo,new T.MeshBasicMaterial({color:0xffe7ad}));seed.position.y=.2;g.add(seed);
      var glow=new T.Sprite(new T.SpriteMaterial({map:H.glowTex,color:b.color,transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending}));glow.position.y=.18;glow.scale.set(1.4,1.4,1);g.add(glow);
      flowers.push({g:g,petals:petals,seed:seed,glow:glow,pulse:0});
      var ring=new T.Mesh(ringGeo,new T.MeshBasicMaterial({color:b.color,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;group.add(ring);ripples.push({mesh:ring,time:0});
    });
    moon=new T.Group();moon.position.set(0,1.8,-2.1);group.add(moon);
    var moonRing=new T.Mesh(new T.TorusGeometry(.53,.055,8,48,Math.PI*1.65),new T.MeshBasicMaterial({color:0xffefc7}));moonRing.rotation.z=.3;moon.add(moonRing);
    var moonGlow=new T.Sprite(new T.SpriteMaterial({map:H.glowTex,color:0xc8d8ff,transparent:true,opacity:.35,depthWrite:false,blending:T.AdditiveBlending}));moonGlow.scale.set(2.4,2.4,1);moon.add(moonGlow);
    render();
  }
  function render(){
    if(!J)return;
    var s=progress(),sum=s.light.reduce(function(a,b){return a+b;},0);
    $('lotusCount').textContent=finished()?'月汐莲湾 · 月下小憩':'月汐莲湾 · '+s.found.length+' / 6 朵莲花';
    $('lotusHint').textContent=finished()?'六朵莲花都记得你送来的光。':'已送 '+sum+' / 18 缕月光 · 每朵三缕便会绽开';
    $('lotusNext').textContent=finished()?'让涟漪再荡一圈':'☾ 送一缕月光';
    R.blooms.forEach(function(b,i){var button=$('lotusKey'+i);button.textContent=b.name+' '+s.light[i]+'/3';button.classList.toggle('bloomed',s.light[i]===3);button.setAttribute('aria-label',b.name+'，已收到'+s.light[i]+'缕月光，共需3缕');});
  }
  function buildUI(){
    var hud=document.createElement('div');hud.id='lotusHud';hud.hidden=true;hud.className='glass';hud.innerHTML='<strong id="lotusCount"></strong><p id="lotusHint"></p><small>没有限时 · 每一缕光都会留下</small>';$('topbar').insertBefore(hud,$('topbar').firstChild);
    var dock=document.createElement('div');dock.id='lotusDock';dock.hidden=true;dock.className='glass';dock.innerHTML='<p>轻触水面的莲花，或在这里把月光送给它。</p><div id="lotusKeys"></div><button id="lotusNext" class="jr-action"></button>';document.body.appendChild(dock);
    R.blooms.forEach(function(b,i){var button=document.createElement('button');button.id='lotusKey'+i;button.style.setProperty('--lotus','#'+b.color.toString(16));button.onclick=function(){give(i);};$('lotusKeys').appendChild(button);});$('lotusNext').onclick=next;
    var end=document.createElement('div');end.id='lotusEnding';end.hidden=true;end.setAttribute('role','dialog');end.setAttribute('aria-modal','true');end.setAttribute('aria-labelledby','lotusEndTitle');
    end.innerHTML='<div class="jr-card"><div class="jr-eyebrow">CHAPTER 05 · COMPLETE</div><h2 id="lotusEndTitle">月光也有停靠的地方</h2><p>你没有催促一朵花。<br>只是把光，一点一点送到它身边。<br>愿你也被这样温柔地等待。</p><p class="jr-note">六朵月莲已入手账 · 首次完成 +20 成长星光</p><button class="jr-action" id="lotusStay">留下来，听听月色</button><button class="jr-action" id="lotusJournal">翻开成长手账</button></div>';document.body.appendChild(end);
    $('lotusStay').onclick=closeEnding;$('lotusJournal').onclick=function(){closeEnding();J.open('growth');};
    var nextButton=document.createElement('button');nextButton.id='lotusFromChime';nextButton.className='jr-action';nextButton.textContent='第五关：月汐莲湾';nextButton.onclick=function(){$('chimeStay').click();J.go(5);};$('chimeEnding').querySelector('.jr-card').appendChild(nextButton);
    document.addEventListener('keydown',function(e){if(end.hidden)return;if(e.key==='Escape'){e.preventDefault();closeEnding();}if(e.key==='Tab'){var first=$('lotusStay'),last=$('lotusJournal');if(e.shiftKey&&(document.activeElement===first||!end.contains(document.activeElement))){last.focus();e.preventDefault();}else if(!e.shiftKey&&(document.activeElement===last||!end.contains(document.activeElement))){first.focus();e.preventDefault();}}});
    render();
  }
  window.LotusChapter={
    init:function(hooks,bridge){H=hooks;T=hooks.THREE;J=bridge;temp=new T.Vector3();reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;buildUI();return this;},
    onLevel:function(n){active=n===5;$('lotusEnding').hidden=true;$('lotusHud').hidden=$('lotusDock').hidden=!active;if(active){buildWorld();H.setNightTarget(.9);H.setDeepNight(0);}if(group)group.visible=active;ripples.forEach(function(r){r.time=0;r.mesh.material.opacity=0;});render();},
    update:function(dt,t){if(!active||document.hidden)return;H.setNightTarget(.9);H.setDeepNight(0);if(J.blocked())return;
      flowers.forEach(function(f,i){var v=progress().light[i]/3;f.pulse=Math.max(0,f.pulse-dt);f.g.position.y=.06+(reduced?0:Math.sin(t*.6+i)*.025);f.glow.material.opacity=.15+v*.3+f.pulse*.25;f.petals.forEach(function(p){p.rotation.x=-.8*(1-v);p.scale.setScalar(.45+v*.55);});});
      ripples.forEach(function(r){r.time=Math.max(0,r.time-dt*.65);var v=1-r.time;r.mesh.scale.setScalar(reduced?1:1+v*3);r.mesh.material.opacity=r.time*.5;});
    },
    tap:function(ray){if(!canPlay())return false;temp.copy(ray.ray.origin).addScaledVector(ray.ray.direction,10).project(H.camera);var x=(temp.x+1)*innerWidth/2,y=(1-temp.y)*innerHeight/2,best=-1,distance=40;flowers.forEach(function(f,i){f.seed.getWorldPosition(temp);temp.project(H.camera);var d=Math.hypot((temp.x+1)*innerWidth/2-x,(1-temp.y)*innerHeight/2-y);if(temp.z>=-1&&temp.z<=1&&d<distance){best=i;distance=d;}});if(best>=0){give(best);return true;}return false;},
    isModalOpen:function(){return !!$('lotusEnding')&&!$('lotusEnding').hidden;},hint:hint
  };
})(window,document);
