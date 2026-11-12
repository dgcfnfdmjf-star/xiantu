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
    await ctx2.close();

    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ pass: true, rigged, screenshots: OUT }));
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
