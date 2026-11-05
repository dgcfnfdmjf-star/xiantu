/* 晨风铃谷 — gentle melody puzzles in the existing island and frame loop. */
(function (window, document) {
  'use strict';
  var R = window.ChimeRules, GA = window.GardenAudio, M = window.__music2, K = GA && GA.kit, V = M && M.voices;
  if (K && V) M.register({ id: 'morningchimes', name: '晨风来信', key: 62, bpm: 66, swing: 0, delay: .28, level: 1,
    prog: [[0, 'add9'], [5, 'add9'], [9, 'm7'], [7, 'sus']], mel: ['3---5---', '6---8---', '5-3-2---', '1-------'],
    play: function (t, s, bar, ch, sd, p) {
      var out = V.bus(p, 2400);
      if (s === 0) { K.pad(t, ch.notes, sd * 15, .025, out, 'triangle', 850); K.bass(t, ch.bass, .055, sd * 12, out); }
      if (s % 4 === 2) V.guitar(t, ch.notes[(s - 2) / 4 % ch.notes.length] + 12, .035, sd * 3, out);
      var n = K.melNote(this, bar, s, sd); if (n) K.musicBox(t, n.m + 12, .045, out);
    }
  });
  var H, T, J, group, bells = [], gates = [], halo, temp, active = false, shownScore = false;
  var preview = null, echoTimer = 0, lock = 0, lastNote = -1, finale = 0, lastFocus = null, reduced = false;
  function $(id) { return document.getElementById(id); }
  function progress() { return J.progress.chimes; }
  function finished() { return progress().round === R.songs.length; }
  function canPlay() { return active && H.isStarted() && !J.blocked() && !document.hidden; }
  function hex(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function sound(index) {
    var out = GA && K && GA.sfxOut(); if (!out) return;
    // The same six pitches in the preview and player input; independent of BGM selection.
    K.musicBox(GA.context().currentTime + .015, [74, 76, 78, 81, 83, 86][index], .065, out);
  }
  function feedback(index) {
    bells[index].pulse = 1; sound(index);
    $('chimeKey' + index).classList.add('ringing');
    $('chimeEcho').textContent = (index + 1) + ' · ' + R.tones[index].name;
    echoTimer = .7;
  }
  function cancelPreview() {
    preview = null; echoTimer = 0;
    if (!$('chimeEcho')) return;
    $('chimeEcho').textContent = '';
    for (var i = 0; i < 6; i++) $('chimeKey' + i).classList.remove('ringing');
    render();
  }
  function listen() {
    if (!canPlay() || finale > 0 || preview) return;
    var song = R.songs[Math.min(progress().round, R.songs.length - 1)];
    preview = { notes: song.notes, next: 0, wait: .15 };
    render();
  }
  function play(index) {
    if (!canPlay() || preview || finale > 0 || (lock > 0 && lastNote === index) || index < 0 || index > 5) return;
    lock = .12; lastNote = index; feedback(index);
    var result = R.press(progress(), index);
    if (!result.changed) return;
    if (result.finished) J.complete(4);
    // Progress, collection and the first-clear reward live in the same save.
    J.changed(); render();
    if (!result.correct) { H.toast('风绕了一小段路，慢慢从第一个音再来。已完成的乐章都还在。', 2700); return; }
    if (result.finished) {
      if (reduced) showEnding(); else { finale = 3.2; $('chimeSkip').hidden = false; render(); H.toast('六枚风铃一起唱起了早安……', 2800); }
    } else if (result.roundComplete) {
      H.toast('这一段旋律找到了 ✧ 下一段也可以先听一遍', 2600);
    } else if (result.first) H.toast('收集到「' + R.tones[index].name + '」· 成长星光 +5', 1800);
  }
  function showEnding() {
    if (!active) return;
    finale = 0; $('chimeSkip').hidden = true;
    lastFocus = document.activeElement; $('chimeEnding').hidden = false; $('chimeStay').focus(); render();
  }
  function closeEnding() {
    $('chimeEnding').hidden = true;
    if (lastFocus && document.contains(lastFocus) && lastFocus.getClientRects().length) lastFocus.focus();
  }
  function makeLabel(index) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var ctx = c.getContext('2d'); ctx.fillStyle = '#303d4b'; ctx.beginPath(); ctx.arc(32, 32, 29, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hex(R.tones[index].color); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff9e5'; ctx.font = '600 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(index + 1, 32, 34);
    var label = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false, depthWrite: false }));
    label.scale.set(.43, .43, 1); label.position.y = 2.05; label.renderOrder = 4; return label;
  }
  function buildWorld() {
    if (group) return;
    group = new T.Group(); H.island.add(group);
    var wood = new T.MeshLambertMaterial({ color: 0xc9b292 }), stone = new T.MeshLambertMaterial({ color: 0xdce6d1 });
    var poleGeo = new T.CylinderGeometry(.045, .06, 1.9, 6), barGeo = new T.BoxGeometry(.85, .07, .07);
    var shellGeo = new T.CylinderGeometry(.19, .33, .48, 8, 1, true), cordGeo = new T.CylinderGeometry(.012, .012, .36, 4);
    var leafGeo = new T.PlaneGeometry(.18, .36), beadGeo = new T.SphereGeometry(.065, 6, 4), baseGeo = new T.CylinderGeometry(.38, .47, .12, 8);
    var coords = [[-2.8,1.2],[-2.4,-1.6],[0,-2.9],[2.5,-1.5],[2.9,1.2],[0,2.8]];
    R.tones.forEach(function (tone, i) {
      var g = new T.Group(); g.position.set(coords[i][0], H.TOP_Y, coords[i][1]);
      var base = new T.Mesh(baseGeo, stone); base.position.y = .06; g.add(base);
      var pole = new T.Mesh(poleGeo, wood); pole.position.set(-.34,.97,0); g.add(pole);
      var bar = new T.Mesh(barGeo, wood); bar.position.y = 1.9; g.add(bar);
      var swing = new T.Group(); swing.position.set(0,1.86,0); g.add(swing);
      var cord = new T.Mesh(cordGeo, wood); cord.position.y = -.17; swing.add(cord);
      var mat = new T.MeshLambertMaterial({color:tone.color,side:T.DoubleSide});
      var shell = new T.Mesh(shellGeo,mat); shell.position.y = -.59; swing.add(shell);
      var bead = new T.Mesh(beadGeo,wood); bead.position.y = -.84; swing.add(bead);
      var paper = new T.Mesh(leafGeo,mat); paper.position.y = -1.08; swing.add(paper);
      var glow = new T.Sprite(new T.SpriteMaterial({map:H.glowTex,color:tone.color,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending}));
      glow.position.y = 1.3; glow.scale.set(1.2,1.2,1); g.add(glow); g.add(makeLabel(i)); group.add(g);
      bells.push({g:g,swing:swing,shell:shell,glow:glow,pulse:0});
    });
    var ringGeo = new T.TorusGeometry(.55,.035,5,28);
    for (var j=0;j<3;j++) {
      var ring = new T.Mesh(ringGeo,new T.MeshBasicMaterial({color:R.tones[j*2].color,transparent:true,opacity:.15}));
      ring.rotation.x = -Math.PI/2; ring.position.set((j-1)*1.05,H.TOP_Y+.08,-.2); group.add(ring); gates.push(ring);
    }
    halo = new T.Mesh(new T.TorusGeometry(3.7,.028,4,64), new T.MeshBasicMaterial({color:0xffedba,transparent:true,opacity:0}));
    halo.rotation.x = -Math.PI/2; halo.position.y = H.TOP_Y+.15; group.add(halo);
  }
  function render() {
    if (!J || !$('chimeHud')) return;
    var s = progress(), complete = finished(), song = R.songs[Math.min(s.round,2)];
    $('chimeCount').textContent = complete ? '晨风铃谷 · 自由合奏' : '晨风铃谷 · ' + s.round + ' / 3 乐章';
    $('chimeHint').textContent = complete ? '六枚音符都已收入手账，随心奏一曲吧。' : song.name + ' · 已奏 ' + s.step + ' / ' + song.notes.length + ' 音';
    $('chimePrompt').textContent = preview ? '听风，也看发亮的编号…' : complete ? '轻触风铃，把早安送给小岛' : s.step ? '接着奏第 ' + (s.step+1) + ' 个音' : '先听一遍，再按顺序敲响风铃';
    $('chimeListen').disabled = !!preview || finale > 0;
    $('chimeListen').textContent = preview ? '正在聆听…' : '♪ 听一遍';
    $('chimeScore').hidden = !shownScore;
    $('chimeScore').textContent = song.notes.map(function(i){return (i+1)+'·'+R.tones[i].name;}).join(' → ');
    $('chimeScoreToggle').setAttribute('aria-expanded', String(shownScore));
    $('chimeScoreToggle').textContent = shownScore ? '收起乐谱' : '查看乐谱';
    for(var i=0;i<6;i++) {
      $('chimeKey'+i).disabled = !!preview || finale>0;
      $('chimeKey'+i).classList.toggle('collected',s.found.indexOf(R.tones[i].id)>=0);
    }
  }
  function buildUI() {
    var hud = document.createElement('div'); hud.id='chimeHud'; hud.className='glass'; hud.hidden=true;
    hud.innerHTML='<strong id="chimeCount"></strong><p id="chimeHint"></p><span class="ch-note">没有限时 · 错音可以重来</span>';
    $('topbar').insertBefore(hud,$('topbar').firstChild);
    var dock=document.createElement('div');dock.id='chimeDock';dock.hidden=true;dock.className='glass';
    dock.innerHTML='<div class="ch-top"><span id="chimePrompt" role="status"></span><span id="chimeEcho" aria-live="polite"></span></div><div class="ch-actions"><button id="chimeListen">♪ 听一遍</button><button id="chimeScoreToggle" aria-expanded="false" aria-controls="chimeScore">查看乐谱</button></div><p id="chimeScore" hidden></p><div id="chimeKeys"></div>';
    document.body.appendChild(dock);
    R.tones.forEach(function(t,i){var b=document.createElement('button');b.id='chimeKey'+i;b.style.setProperty('--tone',hex(t.color));b.setAttribute('aria-label',(i+1)+'号风铃 '+t.name);b.innerHTML='<b>'+(i+1)+'</b><span>'+t.name+'</span>';b.onclick=function(){play(i);};$('chimeKeys').appendChild(b);});
    $('chimeListen').onclick=listen;
    $('chimeScoreToggle').onclick=function(){shownScore=!shownScore;render();};
    var end=document.createElement('div');end.id='chimeEnding';end.hidden=true;end.setAttribute('role','dialog');end.setAttribute('aria-modal','true');end.setAttribute('aria-labelledby','chimeEndTitle');
    end.innerHTML='<div class="jr-card"><div class="jr-eyebrow">CHAPTER 04 · COMPLETE</div><h2 id="chimeEndTitle">风把早安送到了</h2><p>六枚风铃把散落的旋律连成了一首歌。<br>星灯守了一夜，晨风接过了温柔。<br>愿你也有一个轻轻开始的早晨。</p><p class="jr-note">首次通关 +20 成长星光 · 六枚音符已入手账</p><button class="jr-action" id="chimeStay">留下来，自由合奏</button><button class="jr-action" id="chimeJournal">翻开成长手账</button></div>';
    document.body.appendChild(end);
    $('chimeStay').onclick=closeEnding;
    $('chimeJournal').onclick=function(){closeEnding();J.open('growth');};
    var skip=document.createElement('button');skip.id='chimeSkip';skip.hidden=true;skip.className='jr-action';skip.textContent='跳过演出';skip.onclick=showEnding;document.body.appendChild(skip);
    var next=document.createElement('button');next.id='chimeNext';next.className='jr-action';next.textContent='第四关：晨风铃谷';next.onclick=function(){$('starStay').click();J.go(4);};
    $('starEnding').querySelector('.jr-card').appendChild(next);
    document.addEventListener('keydown',function(e){
      if(end.hidden)return;
      if(e.key==='Escape'){e.preventDefault();closeEnding();}
      if(e.key==='Tab'){var first=$('chimeStay'),last=$('chimeJournal');if(e.shiftKey&&(document.activeElement===first||!end.contains(document.activeElement))){last.focus();e.preventDefault();}else if(!e.shiftKey&&(document.activeElement===last||!end.contains(document.activeElement))){first.focus();e.preventDefault();}}
    });
  }
  window.ChimeChapter={
    init:function(hooks,bridge){H=hooks;T=hooks.THREE;J=bridge;temp=new T.Vector3();reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;buildUI();return this;},
    onLevel:function(n){active=n===4;cancelPreview();finale=0;lock=0;$('chimeSkip').hidden=true;$('chimeEnding').hidden=true;$('chimeHud').hidden=$('chimeDock').hidden=!active;if(active){buildWorld();H.setNightTarget(.12);H.setDeepNight(0);}if(group)group.visible=active;render();},
    update:function(dt,t){
      if(!active)return;
      H.setNightTarget(.12);H.setDeepNight(0);
      if(J.blocked()||document.hidden){if(preview)cancelPreview();return;}
      lock=Math.max(0,lock-dt);
      if(preview){preview.wait-=dt;if(preview.wait<=0){if(preview.next<preview.notes.length){feedback(preview.notes[preview.next++]);preview.wait=.85;}else{preview=null;render();}}}
      echoTimer=Math.max(0,echoTimer-dt);if(echoTimer===0){$('chimeEcho').textContent='';for(var i=0;i<6;i++)$('chimeKey'+i).classList.remove('ringing');}
      bells.forEach(function(b,i){b.pulse=Math.max(0,b.pulse-dt*1.4);b.swing.rotation.z=reduced ? 0 : Math.sin(t*1.6+i)*(.035+b.pulse*.22);b.glow.material.opacity=.12+b.pulse*.65+(finished() ? .12 : 0);});
      gates.forEach(function(g,i){g.material.opacity=progress().round>i ? .8 : .15;});
      halo.material.opacity=finished() ? (finale>0 ? .55 : .18) : 0;
      if(finale>0){finale=Math.max(0,finale-dt);if(!finale)showEnding();}
    },
    tap:function(ray){
      if(!active||!canPlay())return false;
      temp.copy(ray.ray.origin).addScaledVector(ray.ray.direction,10).project(H.camera);var x=(temp.x+1)*innerWidth/2,y=(1-temp.y)*innerHeight/2,best=-1,dist=34;
      bells.forEach(function(b,i){b.shell.getWorldPosition(temp);temp.project(H.camera);if(temp.z< -1||temp.z>1)return;var d=Math.hypot((temp.x+1)*innerWidth/2-x,(1-temp.y)*innerHeight/2-y);if(d<dist){best=i;dist=d;}});
      if(best>=0){play(best);return true;}return false;
    },
    isModalOpen:function(){return !!$('chimeEnding')&&!$('chimeEnding').hidden;},
    cancelPreview:cancelPreview,
    hint:function(){return '先听一遍，再按顺序敲响风铃 · 可查看乐谱，没有限时';}
  };
})(window,document);
