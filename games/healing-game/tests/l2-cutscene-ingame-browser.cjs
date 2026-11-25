'use strict';

// Real level-2 clear path: 20th hug -> startEnding -> cutscene with its score -> skip -> tap to continue ->
// the existing #kitEnding card -> 继续陪玩; then a reload of the ended save must not replay. Synthetic saves only.
// Run after python3 games/healing-game/scripts/build.py:
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l2-cutscene-ingame-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const OUT = path.resolve(__dirname, '../../../output/playwright/l2-cutscene');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.kittens.v1';

// Sample the actual seated rig and the soles of the glow cat's four rendered
// leg meshes. Advancing the film clock explicitly also works on a slow GPU.
async function checkStroll(page, reduced) {
  const { rows, revisits } = await page.evaluate(() => {
    const cs = __l2Cutscene, island = GardenClip.world.island, actors = [];
    island.traverse(o => { if (o.l2cat) actors.push(o); });
    const glow = actors[6], legs = glow.children[0].children.filter(o => o.geometry?.type === 'CylinderGeometry');
    if (legs.length !== 4) throw Error('Expected four procedural legs on the glow cat');
    const origin = performance.now(), v = new THREE.Vector3();
    const sample = () => {
      const t = cs.time();
      GardenPlay.update(0, t, .4);
      island.updateMatrixWorld(true);
      const inv = island.matrixWorld.clone().invert(), frame = cs.frame().cats;
      const feet = legs.map(leg => {
        const matrix = new THREE.Matrix4().multiplyMatrices(inv, leg.matrixWorld), pos = leg.geometry.attributes.position;
        let low = Infinity, sole = Infinity;
        for (let j = 0; j < pos.count; j++) {
          v.fromBufferAttribute(pos, j);
          sole = Math.min(sole, v.y);
          low = Math.min(low, v.applyMatrix4(matrix).y);
        }
        v.set(0, sole, 0).applyMatrix4(matrix);
        return [v.x, v.z, low - (glow.position.y - frame[6].y)];
      });
      const black = actors[2];
      return { x: black.position.x, z: black.position.z, yaw: black.rotation.y, head: cs.stage().rig[2].head,
        seated: frame[2].stand === 0, glowStand: frame[6].stand, feet };
    };
    cs.pause();
    cs.seek(37);
    let now = origin;
    const rows = [], revisits = [];
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    try {
      cs.resume();
      for (let i = 0; i <= 270; i++) { now = origin + i * 1000 / 60; rows.push(sample()); }
      cs.pause();
      now += 2000;
      revisits.push([270, sample()]);
      for (const i of [54, 132, 22, 107, 189, 23, 103, 270, 22]) {
        cs.seek(37 + i / 60);
        revisits.push([i, sample()]);
      }
    } finally {
      delete performance.now;
      cs.resume();
    }
    return { rows, revisits };
  });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, reduced ? 'stroll-reduced.json' : 'stroll.json'), JSON.stringify(rows));
  const degrees = a => a * 180 / Math.PI;
  const delta = (a, b) => Math.abs(degrees(Math.atan2(Math.sin(b - a), Math.cos(b - a))));
  const peak = Math.max(...rows.slice(1, 91).map((r, i) => delta(rows[i].yaw, r.yaw)));
  assert(rows.slice(0, 91).every(r => r.seated && r.x === rows[0].x && r.z === rows[0].z), 'black cat turns on its seat');
  assert(peak < 4 && delta(rows[0].yaw, rows[90].yaw) > 150, 'full seated turn, below 4 degrees per frame: ' + peak);
  // Bearing of the head bone's forward (+Z) axis, ignoring its pitch and roll.
  const headYaw = ([x, y, z, w]) => Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
  const headLead = degrees(headYaw(rows[10].head) - headYaw(rows[0].head));
  assert(headLead > 4 && delta(rows[0].yaw, rows[10].yaw) < 1, 'head turns toward the viewer before the seated chest');
  assert(rows[96].glowStand > .99, 'glow cat stands before the radius starts closing at 38.6 s');
  for (const [from, to, support, swing] of [[102, 112, 0, 1], [114, 126, 1, 0]]) {
    const stance = rows.slice(from, to + 1), [x, z] = stance[0].feet[support];
    assert(stance.every(r => Math.hypot(r.feet[support][0] - x, r.feet[support][1] - z) < .001 &&
      Math.abs(r.feet[support][2]) < .006), 'support sole holds its island footprint');
    assert(Math.max(...stance.map(r => r.feet[swing][2])) > .022, 'opposite sole lifts');
  }
  for (const [i, pose] of revisits) {
    const expected = rows[i];
    assert(delta(pose.yaw, expected.yaw) < .00001);
    assert.deepEqual(pose.head, expected.head, 'paused / random seek head @' + i);
    const feet = expected.feet.flat();
    assert(pose.feet.flat().every((v, j) => Math.abs(v - feet[j]) < 1e-6), 'paused / random seek soles @' + i);
  }
  return { frames: rows.length, peakDegrees: peak, initialHeadYawDegrees: headLead };
}

(async () => {
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(SITE, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(SITE + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const report = { errors: [] };
  try {
    const reduced = process.env.L2_REDUCED_MOTION === '1';
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message));
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.addInitScript(([key, save]) => {
      if (sessionStorage.getItem('l2cs')) return;
      sessionStorage.setItem('l2cs', '1');
      localStorage.setItem('hg_level2_unlocked', '1');
      localStorage.setItem(key, JSON.stringify(save));
      localStorage.setItem('healingGarden.journey.v1', JSON.stringify({ completed: [1] }));
    }, [KEY, { level: 2, total: 19, ended: false, caught: { orange: 3, calico: 2, black: 2, white: 1, tabby: 2 }, companions: {} }]);
    const cs = fn => page.evaluate(fn);
    const save = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    const cardHidden = () => page.evaluate(() => document.getElementById('kitEnding').classList.contains('hidden'));
    const open = async () => { await page.goto(url); await page.locator('#start').click(); await page.waitForTimeout(1500); };
    const pick = async () => {
      for (let tries = 0; tries < 40; tries++) {
        const t = await page.evaluate(() => __kittens.list.filter(k => !k.dead && k.state !== 'hug').map(k => ({ ...__kittens.screenOf(k), state: k.state }))
          .find(q => q.y > 280 && q.y < 660 && q.x > 12 && q.x < 378 && document.elementFromPoint(q.x, q.y)?.tagName === 'CANVAS'));
        if (t) { await page.touchscreen.tap(t.x, t.y); return t; }
        await page.waitForTimeout(200);
      }
      throw Error('no visible kitten');
    };
    const hug = async () => {
      for (let round = 0; round < 6; round++) {
        await pick();
        const t = await page.evaluate(() => { const k = __kittens.list.find(k => k.state === 'lure' || k.state === 'play'); return k && __kittens.screenOf(k); });
        if (t) await page.touchscreen.tap(t.x, t.y);
        if ((await page.evaluate(() => __kittens.state().total)) >= 20) return;
        await page.waitForTimeout(400);
      }
      throw Error('could not hug the 20th kitten');
    };

    await open();
    assert.equal(await cs(() => __l2Cutscene.enabled()), true, 'hook is on by default');
    assert.equal(await cs(() => __l2Cutscene.state()), 'idle', 'nothing plays before the clear');
    const themeBefore = await cs(() => GardenAudio.currentTrackName());
    await page.evaluate(key => {
      const play = window.__l2Cutscene.play;
      window.__l2Cutscene.play = function (...args) {
        window.__savedAtFilmStart = JSON.parse(localStorage.getItem(key));
        return play.apply(this, args);
      };
    }, KEY);
    await hug();

    // startEnding (1.4 s after the hug) plays the cutscene instead of the 7 s card.
    await page.waitForFunction(() => __l2Cutscene.playing(), null, { timeout: 8000 });
    const atStart = await cs(() => window.__savedAtFilmStart);
    assert(atStart && atStart.ended && atStart.total >= 20, 'clear is saved before the cutscene starts');
    assert.equal(await cardHidden(), true, 'existing card waits behind the cutscene');
    assert.equal(await cs(() => __l2Cutscene.duration()), 60);
    assert.equal(await cs(() => __l2Cutscene.scored()), true, 'score started with the cutscene');
    await page.waitForFunction(() => __l2Score.state().steps >= 6, null, { timeout: 8000 });
    let score = await cs(() => ({ s: __l2Score.state(), t: __l2Cutscene.time(), audio: GardenAudio.context().state }));
    assert.equal(score.audio, 'running');
    assert(score.s.active && score.s.current && score.s.track === '猫团圆舞曲', 'waltz owns the music bus: ' + JSON.stringify(score.s));
    assert(Math.abs(score.s.position - score.t) < 0.45, 'score follows the cutscene clock: ' + JSON.stringify(score));
    assert.equal(await page.locator('#l2csSkip').isVisible(), true, 'skip is reachable');
    await page.waitForFunction(() => __l2Cutscene.stage().rig[2]);
    assert.equal(await cs(() => __l2Cutscene.stage().reduced), reduced);
    report.stroll = await checkStroll(page, reduced);

    // seek() moves the score with the picture.
    const seekStart = await cs(() => {
      __l2Cutscene.seek(30);
      return { at: performance.now(), t: __l2Cutscene.time() };
    });
    assert(Math.abs(seekStart.t - 30) < 0.15, 'seek starts at the requested time: ' + seekStart.t);
    let peakLive = 0;
    await page.waitForTimeout(3000); // let the level theme's tails from before the seek ring out
    for (let i = 0; i < 16; i++) { await page.waitForTimeout(250); peakLive = Math.max(peakLive, await cs(() => __musicLush.live())); }
    score = await cs(() => ({ s: __l2Score.state(), t: __l2Cutscene.time(), at: performance.now() }));
    // Browser round trips add time to the 16 samples, especially with software
    // rendering. Compare the timeline with the actual monotonic clock, rather
    // than assuming the waitForTimeout calls are the entire elapsed duration.
    const elapsed = (score.at - seekStart.at) / 1000, advanced = score.t - seekStart.t;
    report.seekTiming = { elapsed, advanced, drift: Math.abs(advanced - elapsed) };
    assert(elapsed >= 7 && score.t < 60 && report.seekTiming.drift < 0.15,
      'seek keeps real time: ' + JSON.stringify(report.seekTiming));
    assert(Math.abs(score.s.position - score.t) < 0.45 && score.s.lastStep >= 105, 'score jumped with seek: ' + JSON.stringify(score));
    // music-lush stops adding felt/harp at 34 live sources, but padTone is not
    // subject to that cutoff. A string chord adds four sustained voices
    // (three chord tones plus bass), so the combined counter can reach 38.
    assert(peakLive > 4 && peakLive <= 34 + 4, 'voice count including the string chord: ' + peakLive);
    report.peakLive = peakLive;

    // Skip lands on the end title; the card still needs its own tap.
    await page.locator('#l2csSkip').tap();
    assert.equal(await cs(() => __l2Cutscene.state()), 'ended');
    assert.equal(await cs(() => __l2Cutscene.finished()), true);
    assert.equal(await cardHidden(), true, 'skip does not skip the end card');
    score = await cs(() => __l2Score.state());
    assert(score.active && score.free, 'score settles into its closing bars after skip');
    await page.waitForTimeout(1500);
    assert(await cs(() => __l2Score.state().lastStep) >= 168, 'closing bars play after skip');
    await page.locator('#l2csGo').tap();
    await page.waitForFunction(() => !document.getElementById('kitEnding').classList.contains('hidden'), null, { timeout: 3000 });
    assert.equal(await cs(() => __l2Cutscene.state()), 'closed');
    assert.equal(await cs(() => __l2Cutscene.stage().staged), false, 'island handed back');
    score = await cs(() => __l2Score.state());
    assert(!score.active && score.track === themeBefore, 'level music returns: ' + JSON.stringify(score));
    await page.screenshot({ path: path.join(OUT, 'ingame-card.png') });

    // 继续陪玩 keeps the old behaviour and never replays.
    await page.locator('#kitStay').click();
    assert.equal(await cardHidden(), true);
    let state = await cs(() => __kittens.state());
    assert(state.ended && !state.endingUp && state.total >= 20, 'free play after the card');
    await page.waitForTimeout(2500);
    assert.equal(await cs(() => __l2Cutscene.playing()), false, 'no replay after continue');
    const after = await save();
    assert(after.ended === true && after.total >= 20 && after.caught && after.companions, 'save fields intact: ' + JSON.stringify(after));
    assert.deepEqual(Object.keys(after).filter(k => /cutscene|l2/i.test(k)), [], 'cutscene adds no save field');

    // An already-ended save does not auto-replay on load.
    await page.reload();
    await page.locator('#start').click();
    await page.waitForTimeout(4000);
    assert.equal(await cs(() => __l2Cutscene.state()), 'idle', 'ended save loads straight into free play');
    assert.equal(await cardHidden(), true);
    assert.equal(await cs(() => __l2Score.state().active), false);
    assert.equal((await save()).ended, true);

    // Showing the old card's DOM during free play cannot restart a completed run.
    await cs(() => document.getElementById('kitEnding').classList.remove('hidden'));
    await page.locator('#kitAgain').click();
    assert.equal(await cs(() => __kittens.state().ended), true);
    assert.deepEqual(await save(), after);

    // Start a second trial with the same pre-clear fixture and use its real ending card.
    await page.evaluate(() => sessionStorage.removeItem('l2cs'));
    await open();
    assert.equal(await cs(() => __kittens.state().total), 19);
    await hug();
    await page.locator('#l2csSkip').tap();
    await page.waitForTimeout(750);
    await page.locator('#l2csGo').tap();
    await page.locator('#kitAgain').click();
    const again = await cs(() => __kittens.state());
    assert(again.total === 0 && again.ended === false, 'kitAgain resets the run');
    await page.waitForFunction(key => {
      const saved = JSON.parse(localStorage.getItem(key));
      return saved && saved.total === 0 && saved.ended === false;
    }, KEY);
    assert.equal(await cs(() => __l2Cutscene.playing()), false);
    assert.deepEqual(report.errors, []);
    await context.close();
    console.log('l2-cutscene in-game OK ' + JSON.stringify(report));
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
