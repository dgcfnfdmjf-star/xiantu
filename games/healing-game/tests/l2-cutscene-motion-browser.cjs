'use strict';

// Level-2 cutscene cat motion: the stage cats must walk with the exported "Walk" clip while they travel and
// move bones (head, tail, front legs, body) in the seated beats, all reproducibly from seek().
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l2-cutscene-motion-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l2-cutscene-motion');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const angle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])));
const span = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let failGlb = false;
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(SITE, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(SITE + path.sep) || !fs.existsSync(file) || (failGlb && file.endsWith('.glb'))) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errors.push(m.text()); });
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.goto(url + '?cutscene=1&mute=1');
    await page.waitForFunction(() => window.__l2Cutscene && window.__l2Cutscene.playing());
    await page.waitForFunction(() => window.__l2Cutscene.stage().staged && window.__l2Cutscene.stage().blender >= 4);
    // The standalone preview is not level 2: the stage rig must not depend on the gameplay `active` flag.
    assert.notEqual(await page.evaluate(() => window.__kittens.state().level), 2, 'preview runs outside level 2');
    const at = async (t, shot) => {
      await page.evaluate(t => { window.__l2Cutscene.pause(); window.__l2Cutscene.seek(t); }, t);
      await page.waitForTimeout(160);
      if (shot) await page.screenshot({ path: path.join(OUT, 't' + String(t).replace('.', '_') + '.png') });
      return page.evaluate(() => ({ frame: window.__l2Cutscene.frame().cats, rig: window.__l2Cutscene.stage().rig }));
    };
    // Cast: 0 orange, 1 calico, 2 black (the chaser), 3 white (no Blender coat), 4 tabby, 5 orange, 6 glow (procedural).
    const first = await at(20, true);
    const rigged = first.rig.map((r, i) => r ? i : -1).filter(i => i >= 0);
    assert(rigged.length >= 4 && rigged.includes(0) && rigged.includes(2), 'Blender coats carry a rig: ' + rigged);
    assert(first.rig.every(r => !r || r.mixer), 'every stage coat owns an AnimationMixer');

    // Gather: cat 0 leaves its bush at 8.6s. Walk is running, weighted in, on the walking surface, and steps with distance.
    const g1 = await at(9.6, true), g2 = await at(9.9), g3 = await at(10.2);
    for (const g of [g1, g2, g3]) {
      assert.equal(g.frame[0].state, 'gather');
      assert(g.rig[0].walking && g.rig[0].running && g.rig[0].weight > 0.9 && g.rig[0].surface, 'Walk action running during gather: ' + JSON.stringify(g.rig[0]));
    }
    assert(g1.rig[0].time !== g2.rig[0].time && g2.rig[0].time !== g3.rig[0].time, 'Walk time advances with the ground covered');
    assert(angle(g1.rig[0].frontUpperL, g2.rig[0].frontUpperL) + angle(g2.rig[0].frontUpperL, g3.rig[0].frontUpperL) > 0.08, 'front leg swings through the stride');
    assert(span(g1.rig[0].frontPawL, g2.rig[0].frontPawL) + span(g2.rig[0].frontPawL, g3.rig[0].frontPawL) > 0.03, 'front paw steps');
    // Cadence matches ground speed: cycles advanced == distance / world stride.
    const cyc = (g3.frame[0].dist - g1.frame[0].dist);
    assert(cyc > 0.15, 'cat 0 covers ground between 9.6s and 10.2s: ' + cyc);
    // Cats that have not left yet (or already sit) are not walking at the same moment: no unison.
    assert(g1.rig.some((r, i) => r && i !== 0 && !r.walking), 'cats start walking one by one');

    // Chase: the black cat trots after the seed while the others stay seated and play.
    const chase = await at(27.5, true), chase2 = await at(27.7);
    assert(chase.rig[2].running && chase.rig[2].weight > 0.5, 'chaser trots: ' + JSON.stringify(chase.rig[2]));
    assert(chase.rig[2].time !== chase2.rig[2].time);
    assert(!chase.rig[0].walking && !chase.rig[0].running && chase.rig[0].weight === 0, 'seated players do not walk');

    // Seated beats: idle (20s), play (26s / 30s), codex stroll (42s), sleep (56s). Bones differ between beats and inside a beat.
    const idle = first, playA = await at(26, true), playB = await at(30, true), stroll = await at(42, true), sleepA = await at(56, true), sleepB = await at(57.6);
    const marks = [idle, playA, sleepA];
    for (const bone of ['frontUpperL', 'head', 'tail']) {
      let moved = 0;
      for (const i of rigged) {
        const d = [angle(marks[0].rig[i][bone], marks[1].rig[i][bone]), angle(marks[1].rig[i][bone], marks[2].rig[i][bone]), angle(marks[0].rig[i][bone], marks[2].rig[i][bone])];
        if (Math.min(...d) > 0.02) moved++;
      }
      assert(moved >= 2, bone + ' differs across idle/play/sleep on ' + moved + ' cats');
    }
    for (const i of rigged) {
      assert(angle(idle.rig[i].head, playA.rig[i].head) > 0.05, 'head follows the toy on cat ' + i);
      assert(angle(playA.rig[i].tail, playB.rig[i].tail) > 0.01 || angle(playA.rig[i].head, playB.rig[i].head) > 0.02, 'cat ' + i + ' keeps moving inside the play beat');
      assert(!idle.rig[i].rest && !playA.rig[i].rest && !sleepA.rig[i].rest, 'cat ' + i + ' is never frozen in the bind pose');
    }
    // A paw bats at the teaser: some seated cat has a front paw lifted clear of its rest height during play.
    const lifted = [];
    for (const t of [24.6, 25.4, 26.2, 27, 28.4, 29.2, 33, 34]) {
      const s = await at(t);
      s.rig.forEach((r, i) => { if (r && !r.walking && Math.max(r.frontPawL[1], r.frontPawR[1]) > 0.12) lifted.push(i); });
    }
    assert(new Set(lifted).size >= 2, 'paws bat at the teaser: ' + lifted);
    // Not in unison: two rigged cats have different head and tail poses at the same instant.
    assert(angle(playA.rig[rigged[0]].tail, playA.rig[rigged[1]].tail) > 0.01 && angle(playA.rig[rigged[0]].head, playA.rig[rigged[1]].head) > 0.01, 'phase offsets');
    // Stroll into the pile uses the Walk again.
    assert(stroll.rig.filter(r => r && r.running && r.weight > 0.5).length >= 3, 'cats walk the ring before curling up');

    // Sleep: Walk stopped, seated surface restored, weight zero; only the slow breath/tuck layer remains.
    for (const i of rigged) {
      for (const s of [sleepA, sleepB]) assert(!s.rig[i].walking && !s.rig[i].running && !s.rig[i].surface, 'Walk stopped in sleep on cat ' + i);
      assert(span(sleepA.rig[i].frontPawL, sleepB.rig[i].frontPawL) < 0.02, 'paws rest in sleep');
      assert(angle(sleepA.rig[i].head, [0, 0, 0, 1]) > 0.2, 'head tucked in sleep');
    }
    /* Personal space (穿模). Radii come from the posed meshes themselves: bounds() measures every actor's skinned
     * vertices around its root (tail excluded). Measured at stage scale: Blender coat 0.30 m seated, <= 0.45 with a
     * paw/stretch out, 0.36 curled, 0.46-0.50 mid-Walk; procedural white 0.47, glow 0.53. Threshold: centre distance
     * >= 1.05 * (r_i + r_j) with the live radii, and >= 1.05 * the design radii the layout was solved for. */
    const space = await page.evaluate(() => window.__l2Cutscene.space());
    assert(space.comfort >= 1.05 && space.body >= 0.49 && space.glow >= 0.53 && space.proc < 1, 'documented radii');
    const gaps = {};
    for (const t of [20, 26, 27.5, 28, 34, 40.2, 42, 44, 56]) {
      const s = await at(t), b = await page.evaluate(() => window.__l2Cutscene.bounds());
      let min = 9;
      b.forEach((o, i) => {
        assert(o.visible && o.n > 500, 'cat ' + i + ' measured @' + t);
        assert(o.r <= space.cast[i].body + 0.005, 'cat ' + i + ' fits its design radius @' + t + ': ' + o.r);
        assert(o.lo > -0.02, 'cat ' + i + ' does not sink into the grass @' + t + ': ' + o.lo);
        assert(o.lo < (s.frame[i].y > 0.001 ? 0.2 : 0.03), 'cat ' + i + ' does not hover @' + t + ': ' + o.lo);
        if (s.frame[i].walk > 0.9) assert(o.lo > -0.01 && o.lo < 0.02, 'walking paws on the grass, cat ' + i + ' @' + t + ': ' + o.lo);
      });
      for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) {
        const d = Math.hypot(s.frame[i].x - s.frame[j].x, s.frame[i].z - s.frame[j].z);
        min = Math.min(min, d);
        assert(d >= space.comfort * (b[i].r + b[j].r), 'cats ' + i + '/' + j + ' share a volume @' + t + ': ' + d.toFixed(3) + ' < 1.05 * (' + b[i].r + ' + ' + b[j].r + ')');
        assert(d >= space.comfort * (space.cast[i].body + space.cast[j].body) - 1e-6, 'cats ' + i + '/' + j + ' inside the design spacing @' + t + ': ' + d.toFixed(3));
      }
      // Nobody stands in a bush (other than the one it is walking out of), the pond, the tree or the chime pole.
      s.frame.forEach((c, i) => {
        space.bush.forEach((p, n) => assert(Math.hypot(c.x - p[0], c.z - p[1]) >= b[i].r + space.bushR, 'cat ' + i + ' in bush ' + n + ' @' + t));
        space.solid.forEach((p, n) => assert(Math.hypot(c.x - p[0], c.z - p[1]) >= b[i].r + p[2], 'cat ' + i + ' in obstacle ' + n + ' @' + t));
      });
      gaps[t] = +min.toFixed(3);
    }
    // The chaser loops outside the ring: never closer to the pile than the seats, and facing where it runs.
    for (const t of [26, 27, 28, 29]) {
      const c = (await at(t)).frame[2], p = (await at(t + 0.1)).frame[2];
      assert(Math.hypot(c.x - space.pile[0], c.z - space.pile[1]) > space.ring + 0.5, 'chaser stays outside the ring @' + t);
      const dir = Math.atan2(p.x - c.x, p.z - c.z), off = Math.abs(((c.yaw - dir + 9.42477796) % 6.28318531) - 3.14159265);
      assert(off < 0.5, 'chaser faces its travel direction @' + t + ': ' + off.toFixed(2));
    }
    for (const t of [41.5, 43]) {
      const a = (await at(t)).frame, b = (await at(t + 0.1)).frame;
      a.forEach((c, i) => { if (c.walk < 0.9) return; const dir = Math.atan2(b[i].x - c.x, b[i].z - c.z), off = Math.abs(((c.yaw - dir + 9.42477796) % 6.28318531) - 3.14159265); assert(off < 0.5, 'cat ' + i + ' side-slides @' + t + ': ' + off.toFixed(2)); });
    }
    /* Tails (尾巴偏离). tails() gives, per actor in world metres: root (TailRoot bone / first joint of the procedural
     * chain), rump (rear end of the spine on the body midline), dist = |root - rump|, lat = sideways offset from the
     * midline, surf = distance from the root to the nearest drawn body vertex.
     * Before the fix a walking Blender coat measured dist 0.168-0.176, lat 0.156-0.164 (the tail left the side of the
     * hip); now the walking root is re-seated on the rump: dist 0.000, lat 0.000, surf 0.011. Procedural: dist 0.000,
     * surf 0.006. Thresholds: walking and procedural dist <= 0.03, |lat| <= 0.02, surf <= 0.03.
     * The seated sculpt is drawn as authored (tail laid along the right flank, round the paws, rooted in the haunch):
     * surf 0.038-0.042, dist 0.164-0.188; it must stay buried in the haunch (surf <= 0.05) and never drift (dist <= 0.2). */
    const checkTails = (list, t, label) => list.forEach((o, i) => {
      const id = label + ' cat ' + i + ' @' + t + ': ' + JSON.stringify(o);
      assert(o.visible, 'tail measured, ' + id);
      if (!o.blender || o.walking) assert(o.dist <= 0.03 && Math.abs(o.lat) <= 0.02 && o.surf <= 0.03, 'tail root on the rump midline, ' + id);
      else assert(o.surf <= 0.05 && o.dist <= 0.2, 'seated tail rooted in the haunch, ' + id);
    });
    const tailGaps = {};
    for (const t of [20, 26, 28, 34, 42, 56]) {
      const s = await at(t), tails = await page.evaluate(() => window.__l2Cutscene.tails());
      assert.equal(tails.length, 7);
      checkTails(tails, t, 'stage');
      tails.forEach((o, i) => assert.equal(o.blender && o.walking, !!(s.rig[i] && s.rig[i].surface), 'walking tails are the corrected ones, cat ' + i + ' @' + t));
      tailGaps[t] = Math.max(...tails.filter(o => !o.blender || o.walking).map(o => o.dist));
    }
    assert((await page.evaluate(() => window.__l2Cutscene.tails())).filter(o => o.blender && o.walking).length === 0, 'everyone seated in sleep');
    const tw = async t => { await at(t); return page.evaluate(() => window.__l2Cutscene.tails()); };
    const w1 = await tw(42), w2 = await tw(42.6), w3 = await tw(26), w4 = await tw(42);
    assert(w1.filter(o => o.blender && o.walking).length >= 3, 'stroll tails measured while walking');
    const rel = list => list.map(o => [o.blender, o.walking, o.dist, o.lat, o.surf]); // world positions ride the island's idle bob
    assert.deepEqual(rel(w4), rel(w1), 'seek(42) repeats the tails');
    assert(angle((await at(42)).rig[0].tail, (await at(42.6)).rig[0].tail) > 0.02, 'walking tail sways');
    assert(w2.length === 7 && w3.length === 7);
    await at(56);

    /* Eyes (像戴了眼镜). eyes() lists, per actor, every drawn eye / catchlight / iris mesh with the material on it,
     * whether a cutscene outline hull hangs on it, sprites parented to it, additive sprites within 0.3 m of the face
     * and the game's fireflies still lit inside the face cone. Before the fix every Blender coat had hull=true on
     * "Cat_eyes" and "Soft_eye_catchlight" (and on the nose and whiskers): 0.02 m of dark outline round 0.04 m eyes,
     * i.e. goggles; and a firefly drifting over a face read as a glowing eye. Now: one unlit stage iris material per
     * actor (no emissive, not additive, opaque), no hull, no sprite on the eye, no spark or firefly on a face. */
    const checkEyes = (list, t, label) => list.forEach((o, i) => {
      const id = label + ' cat ' + i + ' (' + o.kind + ') @' + t + ': ' + JSON.stringify(o);
      assert(o.visible && o.meshes.length >= 1, 'eyes drawn, ' + id);
      for (const m of o.meshes) {
        assert(m.emissive === null || m.emissive === '#000000' || m.emissiveIntensity === 0, 'eye material is not emissive, ' + id);
        assert(!m.additive && m.opacity === 1 && m.sprites.length === 0, 'eye is not a lamp, ' + id);
        assert(!m.hull, 'no outline hull on an eye part, ' + id);
        assert(m.role !== 'catchlight', 'the sculpted catchlight blob is not drawn on stage, ' + id);
      }
      assert(o.meshes.some(m => m.role === 'iris' && m.type === 'ShaderMaterial' && !m.lit), 'stage iris (slit pupil) material in place, ' + id);
      assert(o.w < 0.3 && o.meshes.every(m => Math.min(...m.size) < 0.1), 'eyes stay small, ' + id);
      assert(o.near.every(n => n.what !== 'spark' || n.opacity < 0.25), 'no bright spark by the face, ' + id);
      assert.equal(o.motes, 0, 'no firefly lit on the face, ' + id);
    });
    for (const t of [20, 26, 28, 34, 42, 56]) {
      await at(t);
      const eyes = await page.evaluate(() => window.__l2Cutscene.eyes());
      assert.equal(eyes.length, 7);
      checkEyes(eyes, t, 'stage');
      assert.equal(eyes.filter(o => o.blender).length, rigged.length, 'every Blender coat measured @' + t);
    }
    // Outlines: none left anywhere on a Blender coat (its unskinned parts are all face details).
    assert.equal(await page.evaluate(() => window.__l2Cutscene.eyes().filter(o => o.blender && o.coatHulls > 0).length), 0, 'no hull on a coat face part');
    // Blink and sleep are a function of t: shut in the pile, open while playing, and the same on a repeat seek.
    const lids = async t => { await at(t); return page.evaluate(() => window.__l2Cutscene.eyes().map(o => o.lid)); };
    const lidSleep = await lids(56), lidPlay = await lids(26.05), lidAgain = await lids(56);
    assert(lidSleep.every(v => v > 0.9), 'eyes shut asleep: ' + lidSleep);
    assert(lidPlay.filter(v => v < 0.5).length >= 5, 'eyes open in play: ' + lidPlay);
    assert.deepEqual(lidAgain, lidSleep, 'seek(56) repeats the lids');
    await at(56);

    /* Walk <-> sit (走到坐很生硬). Before: the walking mesh and the seated sculpt were swapped in one frame when the walk
     * weight crossed 0.5 (mesh top 0.827 -> 0.892 between two 0.1 s samples, tail and head jumping with it), and a
     * procedural cat's leg swing was cut off the instant its speed fell under 0.12. Now frame().cats[i].stand eases
     * 1 <-> 0 over 0.8 s (0.5 s under reduced motion) and sit() reports what is drawn: on a Blender coat the walking
     * vertices move between seated and fully skinned endpoints on one opaque surface; on a procedural coat the stride
     * amplitude and haunch tilt follow the same ramp. Sampled every 0.05 s through each window. Thresholds per
     * sample: stand / surface step <= 0.15 (ease slope at 0.8 s is 0.094; at 0.5 s 0.15, limit 0.2), root x/z step
     * <= 0.1 m, hop height step <= 0.03, heading step <= 0.3 rad (0.45 in the shorter reduced-motion blend), drawn height step <= 0.06 m (all coats), paws never more
     * than 0.02 under the grass; blend length 0.5-1.0 s (reduced motion 0.3-0.6 s). */
    const sitScan = async (pg, label, cats, from, to, dir, reduced) => {
      const rows = [];
      for (let t = from; t <= to + 1e-9; t = +(t + 0.05).toFixed(2)) {
        await pg.evaluate(t => { window.__l2Cutscene.pause(); window.__l2Cutscene.seek(t); }, t);
        await pg.waitForTimeout(70);
        rows.push(await pg.evaluate(() => { const cs = window.__l2Cutscene; return { f: cs.frame().cats, s: cs.sit(), b: cs.bounds() }; }));
      }
      const out = {};
      for (const i of cats) {
        const id = label + ' cat ' + i, st = rows.map(r => r.f[i].stand), step = reduced ? 0.2 : 0.15;
        assert(dir > 0 ? st[0] < 0.01 && st[st.length - 1] > 0.99 : st[0] > 0.99 && st[st.length - 1] < 0.01, id + ' crosses the whole transition: ' + st[0] + ' -> ' + st[st.length - 1]);
        const len = st.filter(v => v > 0.01 && v < 0.99).length * 0.05;
        assert(reduced ? len >= 0.3 && len <= 0.6 : len >= 0.5 && len <= 1.0, id + ' blends for ' + len.toFixed(2) + ' s, not one frame');
        let worst = 0;
        for (let n = 0; n < rows.length; n++) {
          const c = rows[n].f[i], s = rows[n].s[i], b = rows[n].b[i], at = id + ' @' + (from + n * 0.05).toFixed(2) + ': ' + JSON.stringify(s);
          assert(b.lo > -0.02, 'paws stay on the grass through the blend, ' + at + ' lo=' + b.lo);
          if (s.blender) {
            assert(Math.abs(s.stand - c.stand) < 3e-3 && Math.abs(s.surface - c.stand) < 3e-3, 'stage shows the model stand amount, ' + at);
            assert(s.opaque && s.fur === 1, 'one opaque fur surface throughout the transition, ' + at);
            assert.equal(s.face, 3, 'one set of eyes, nose and whiskers, ' + at);
            assert(s.triangles <= 7430, 'transition does not draw duplicate anatomy, ' + at);
          } else assert(s.legs <= 0.65 * c.stand + 0.3 * c.bat + 1e-3 || c.bat > 0.5, 'procedural stride follows the stand ramp, ' + at);
          if (!n) continue;
          const p = rows[n - 1].f[i], q = rows[n - 1].s[i], a = rows[n - 1].b[i];
          let dy = Math.abs(c.yaw - p.yaw) % 6.28318531; if (dy > 3.14159265) dy = 6.28318531 - dy;
          assert(Math.abs(c.stand - p.stand) <= step, 'stand does not jump, ' + at);
          assert(Math.hypot(c.x - p.x, c.z - p.z) <= 0.1 && Math.hypot(s.x - q.x, s.z - q.z) <= 0.1, 'root position continuous, ' + at);
          assert(Math.abs(c.y - p.y) <= 0.03 && Math.abs(s.y - q.y) <= 0.03, 'root height continuous, ' + at);
          assert(dy <= (reduced ? 0.45 : 0.3), 'heading continuous, ' + at + ' dyaw=' + dy.toFixed(3));
          // The actual rendered silhouette must be continuous, including Blender coats.
          assert(Math.abs(b.hi - a.hi) <= 0.06, 'drawn height continuous, ' + at + ' ' + a.hi + ' -> ' + b.hi);
          worst = Math.max(worst, Math.abs(c.stand - p.stand));
          if (s.blender) {
            assert(Math.abs(s.surface - q.surface) <= step, 'surface interpolation does not jump, ' + at);
          } else assert(Math.abs(s.tilt - q.tilt) <= 0.03 && Math.abs(s.bodyY - q.bodyY) <= 0.03, 'procedural settle is gradual, ' + at);
        }
        out[i] = { blend: +len.toFixed(2), step: +worst.toFixed(3) };
      }
      return out;
    };
    const sits = {};
    sits.gatherSit = await sitScan(page, 'gather sit-down', [0], 10.7, 12.2, -1);
    sits.gatherSitWhite = await sitScan(page, 'gather sit-down', [3], 16.4, 17.9, -1);
    sits.chaseUp = await sitScan(page, 'chase stand-up', [2], 24.2, 25.7, 1);
    sits.chaseSit = await sitScan(page, 'chase sit-down', [2], 30.9, 32.4, -1);
    sits.strollUp = await sitScan(page, 'stroll stand-up', [0, 1, 2, 3, 4, 5], 38.6, 40.1, 1);
    sits.glowSit = await sitScan(page, 'stroll sit-down', [6], 40.5, 42.0, -1);
    sits.strollSit = await sitScan(page, 'stroll sit-down', [0, 1, 2, 3, 4, 5], 43.8, 45.6, -1);
    // Seek lands on the same in-between pose, and the curl only starts once the cat is down (one settle).
    const mid = async t => { await at(t); return page.evaluate(() => ({ sit: window.__l2Cutscene.sit(), cats: window.__l2Cutscene.frame().cats.map(c => [c.stand, c.curl]) })); };
    const midA = await mid(44.6), midB = (await mid(20), await mid(44.6));
    assert.deepEqual(midB, midA, 'seek(44.6) repeats the half-seated pose');
    assert(midA.sit[0].surface > 0.05 && midA.sit[0].surface < 0.95, 'single interpolated surface mid sit-down: ' + JSON.stringify(midA.sit[0]));
    midA.cats.forEach((c, i) => assert(c[1] <= 1 - c[0] + 1e-9, 'cat ' + i + ' sits before it curls'));
    await at(56);

    // Stopping the Walk hands back the exact seated bind pose (checked through the mixer, with the layer off).
    const restored = await page.evaluate(() => {
      const cs = window.__l2Cutscene; cs.seek(9.8);
      return new Promise(done => setTimeout(() => { cs.seek(56); setTimeout(() => done(cs.stage().rig.filter(Boolean).map(r => r.walking || r.running)), 200); }, 200));
    });
    assert(restored.every(v => v === false), 'walk -> sleep seek stops every action');

    // Deterministic: any route to a mark gives the same bones.
    for (const [t, was] of [[9.6, g1], [26, playA], [56, sleepA], [27.5, chase]]) {
      const again = await at(t);
      again.rig.forEach((r, i) => { if (r) for (const key of Object.keys(r)) assert.deepEqual(r[key], was.rig[i][key], 'seek(' + t + ') repeats ' + key + ' on cat ' + i); });
    }

    // Skip still lands on the end card with the pile asleep.
    await page.evaluate(() => { window.__l2Cutscene.seek(12); window.__l2Cutscene.resume(); });
    await page.locator('#l2csSkip').tap();
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#l2csTitle').innerText(), '第二关 · 完成');
    const end = await page.evaluate(() => window.__l2Cutscene.stage().rig);
    assert(end.every(r => !r || (!r.running && !r.surface)), 'skip settles every cat');
    await page.screenshot({ path: path.join(OUT, 'end.png') });
    await context.close();

    // A failed GLB keeps the procedural cats on stage, with no errors.
    failGlb = true;
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errors.push('fallback: ' + e.message));
    await p2.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await p2.goto(url + '?cutscene=1&mute=1');
    await p2.waitForFunction(() => window.__l2Cutscene && window.__l2Cutscene.stage().staged);
    await p2.evaluate(() => { window.__l2Cutscene.pause(); window.__l2Cutscene.seek(26); });
    await p2.waitForTimeout(400);
    const fb = await p2.evaluate(() => window.__l2Cutscene.stage());
    assert(fb.blender === 0 && fb.actors === 7 && fb.rig.every(r => r === null), 'procedural fallback cast');
    for (const t of [20, 26, 28, 34, 42, 56]) {
      await p2.evaluate(t => { window.__l2Cutscene.pause(); window.__l2Cutscene.seek(t); }, t);
      await p2.waitForTimeout(160);
      const tails = await p2.evaluate(() => window.__l2Cutscene.tails());
      assert(tails.length === 7 && tails.every(o => !o.blender), 'fallback tails are procedural @' + t);
      checkTails(tails, t, 'fallback');
      const eyes = await p2.evaluate(() => window.__l2Cutscene.eyes());
      assert(eyes.length === 7 && eyes.every(o => !o.blender), 'fallback eyes are procedural @' + t);
      checkEyes(eyes, t, 'fallback');
    }
    const fbSits = { gatherSit: await sitScan(p2, 'fallback gather sit-down', [0], 10.7, 12.2, -1), strollUp: await sitScan(p2, 'fallback stroll stand-up', [0, 3, 5], 38.6, 40.1, 1), strollSit: await sitScan(p2, 'fallback stroll sit-down', [0, 3, 5], 43.8, 45.6, -1) };
    await ctx2.close();

    // Reduced motion: a shorter blend (0.5 s), still not a snap, and the film is the same length.
    failGlb = false;
    const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const p3 = await ctx3.newPage();
    p3.on('pageerror', e => errors.push('reduced: ' + e.message));
    await p3.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await p3.goto(url + '?cutscene=1&mute=1');
    await p3.waitForFunction(() => window.__l2Cutscene && window.__l2Cutscene.stage().staged && window.__l2Cutscene.stage().blender >= 4);
    assert(await p3.evaluate(() => window.__l2Cutscene.stage().reduced), 'reduced-motion context');
    const rdSits = { gatherSit: await sitScan(p3, 'reduced gather sit-down', [0], 10.7, 12.2, -1, true), strollUp: await sitScan(p3, 'reduced stroll stand-up', [0, 3], 38.6, 40.1, 1, true) };
    await ctx3.close();

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ pass: true, rigged, minPairDistance: gaps, maxTailRootToRump: tailGaps, sits, fbSits, rdSits, screenshots: OUT }));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
