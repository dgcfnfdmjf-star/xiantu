"""V9.4 chapter-one feedback patches; exec before the build's source injection.

Uses build.py's html and checked replace() in the caller's globals. The preserved
V5 source and the weighted butterflies.v1 save schema remain unchanged.
"""

replace('试着轻轻网住 30 只吧。', '轻点蝴蝶，收集 30 点心动吧。')
replace('🦋 轻点或划过蝴蝶，用网捉住它', '🦋 轻点蝴蝶，用网捉住它')
replace('✨ 发光的稀有蝴蝶值 3 只', '✨ 普通蝶 +1 点，稀有发光蝶 +3 点心动')
replace('🦋 用手指划过蝴蝶，轻轻把它网住', '🦋 轻点蝴蝶，轻轻把它网住 · 稀有蝶 +3 点心动')
replace('划过蝴蝶就能网住它 · 双指旋转视角', '轻点蝴蝶就能网住它 · 双指旋转视角')
replace("desc: '捕到 5 只蝴蝶'", "desc: '捕蝶收集 5 点心动'")
replace('重新收集 30 只', '重新收集 30 点心动')

replace('''  function seenCount() { var n = 0; for (var k in S.caught) if (S.caught[k] > 0) n++; return n; }

  /* --------------------------- Wing textures''', '''  function seenCount() { var n = 0; for (var k in S.caught) if (S.caught[k] > 0) n++; return n; }
  // total is the original weighted score. caught stores real individuals,
  // including earlier journeys, and is deliberately not reset by "again".
  function caughtCount() { var n = 0; for (var k in S.caught) if (S.caught[k] > 0) n += S.caught[k]; return n; }

  /* --------------------------- Wing textures''')
replace("floatText(x, y - 24, '+' + value + ' ' + sp.name, sp.rare);", "floatText(x, y - 24, '+' + value + ' 点心动 · ' + sp.name, sp.rare);")
replace('''    if (isNew) {
      var bb = $('gpBookBtn'); if (bb) bb.classList.add('pulse');
      setTimeout(function () { H.toast((sp.rare ? '✨ 稀有发光蝶！' : '蝶谱新发现：') + sp.name, 2400); }, sp.rare ? 200 : 900);
    }''', '''    if (isNew || sp.rare) {
      var bb = $('gpBookBtn'); if (bb && isNew) bb.classList.add('pulse');
      setTimeout(function () { if (window.GardenJourney && window.GardenJourney.feedbackBusy()) return; H.toast((sp.rare ? '✨ 稀有发光蝶 +3 点心动：' : '蝶谱新发现：') + sp.name, 2400); }, sp.rare ? 200 : 900);
    }''')
replace("    el.textContent = S.ended ? '🦋 ' + n + ' · 自由捕蝶' : '🦋 ' + Math.min(n, GOAL) + ' / ' + GOAL;", "    el.textContent = endingUp ? '🦋 心动 ' + GOAL + ' / ' + GOAL + ' 点 · 正在放飞' :\n      S.ended ? '🦋 心动 ' + n + ' 点 · 自由捕蝶' : '🦋 心动 ' + Math.min(n, GOAL) + ' / ' + GOAL + ' 点';")
replace("    $('bfSub').textContent = '已遇见 ' + seenCount() + ' / ' + SPECIES.length + ' 种 · 共捕获 ' + S.total + ' 只 · 发光的蝴蝶值 3 只';", "    $('bfSub').textContent = '已遇见 ' + seenCount() + ' / ' + SPECIES.length + ' 种 · 累计捕获 ' + caughtCount() + ' 只 · 本程心动 ' + S.total + ' 点 · 稀有蝶 +3 点';")
replace("H.toast('你轻轻打开了网……', 2800)", "H.toast('已集满 30 点心动，你轻轻打开了网……', 2800)")
replace("row(1, '第一关：捕蝴蝶', '🦋 ' + bf.total + (bf.ended ? ' · 已完成' : ' / 30'))", "row(1, '第一关：捕蝴蝶', '🦋 心动 ' + Math.min(30, bf.total) + ' / 30 点' + (bf.ended ? ' · 已完成' : ''))")
replace('''      return { total: S.total, seen: seenCount(), caught: S.caught, ended: S.ended, codex: codexOpen, endingUp: endingUp,''', '''      return { total: S.total, points: S.total, goalPoints: Math.min(S.total, GOAL), individuals: caughtCount(), seen: seenCount(), caught: S.caught, ended: S.ended, codex: codexOpen, endingUp: endingUp,''')

# A successful chapter-one flower tap returns to catching immediately. Failed
# planting still keeps the tool selected so the player can choose another spot.
replace('''      plantFlower(lp.x, lp.z);
      Sound.plant();
      onFlowerCountChanged();''', '''      plantFlower(lp.x, lp.z);
      Sound.plant();
      onFlowerCountChanged();
      if (!window.__kittens || window.__kittens.state().level === 1) {
        mode = 'net';
        for (var j = 0; j < modeBtns.length; j++) modeBtns[j].classList.toggle('on', modeBtns[j].getAttribute('data-mode') === 'net');
        toast('花已种好，已切回捕蝶 · 轻点蝴蝶吧 🦋', 2800);
      }''')

# Only the first chapter holds its idle azimuth; the existing pointer/zoom
# interpolation and later chapters' idle rotation are unchanged.
replace('''if (performance.now() - cam.lastInput > 4000 && !(window.LotusChapter && window.LotusChapter.cameraBusy()))''', '''if (performance.now() - cam.lastInput > 4000 && window.__kittens && window.__kittens.state().level !== 1 && !(window.LotusChapter && window.LotusChapter.cameraBusy()))''')

# The base camera has already advanced this frame. Apply clearance after the
# final wing pose/scale, and raycast the same displayed centre the player sees.
replace('''    window.GardenClip.keepFromCamera(b.g.position, H.camera.position, 1.6);
''', '')
replace('''    b.g.scale.set(k, k, k);
    if (b.halo) {''', '''    b.g.scale.set(k, k, k);
    window.GardenClip.keepButterflyFromCamera(b.g, H.camera);
    if (b.halo) {''')
replace('var d2 = ray.distanceSqToPoint(b.pos);', 'var d2 = ray.distanceSqToPoint(b.g.position);')
replace('var along = tmp.copy(b.pos).sub(ray.origin).dot(ray.direction);', 'var along = tmp.copy(b.g.position).sub(ray.origin).dot(ray.direction);')
replace("if (b.dead || b.state === 'release' || b.fade < 0.4) continue;", "if (b.dead || !b.g.visible || b.state === 'release' || b.fade < 0.4) continue;")
replace('tmp2.copy((b || bfs[0]).pos).project(H.camera);', 'tmp2.copy((b || bfs[0]).g.position).project(H.camera);')
replace('front: tmp2.z < 1 };\n    },\n    spawnRare:', 'front: (b || bfs[0]).g.visible && tmp2.z >= -1 && tmp2.z < 1 };\n    },\n    spawnRare:')

# The winning catch starts the ending synchronously, which clears stroke.
# Re-read the guard after catchAt so a rare 29 -> 32 catch cannot dereference it.
replace('if (catchAt(e.clientX, e.clientY)) stroke.n++;', 'if (catchAt(e.clientX, e.clientY) && stroke) stroke.n++;')
replace('for (var i = 1; i <= steps && stroke.n < NET_MAX; i++) {', 'for (var i = 1; i <= steps && stroke && canCatch() && stroke.n < NET_MAX; i++) {')
replace('if (catchAt(stroke.x + dx * i / steps, stroke.y + dy * i / steps)) stroke.n++;', 'if (catchAt(stroke.x + dx * i / steps, stroke.y + dy * i / steps) && stroke) stroke.n++;')
replace('''      stroke.x = e.clientX; stroke.y = e.clientY;
      addTrail(e.clientX, e.clientY);''', '''      if (stroke) { stroke.x = e.clientX; stroke.y = e.clientY; addTrail(e.clientX, e.clientY); }''')
