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
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
const KEY = 'healingGarden.kittens.v1';

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
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
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
    await hug();
    assert.equal((await save()).ended, true, 'clear is saved before the cutscene starts');

    // startEnding (1.4 s after the hug) plays the cutscene instead of the 7 s card.
    await page.waitForFunction(() => __l2Cutscene.playing(), null, { timeout: 8000 });
    assert.equal(await cardHidden(), true, 'existing card waits behind the cutscene');
    assert.equal(await cs(() => __l2Cutscene.duration()), 60);
    assert.equal(await cs(() => __l2Cutscene.scored()), true, 'score started with the cutscene');
    await page.waitForFunction(() => __l2Score.state().steps >= 6, null, { timeout: 8000 });
    let score = await cs(() => ({ s: __l2Score.state(), t: __l2Cutscene.time(), audio: GardenAudio.context().state }));
    assert.equal(score.audio, 'running');
    assert(score.s.active && score.s.current && score.s.track === '猫团圆舞曲', 'waltz owns the music bus: ' + JSON.stringify(score.s));
    assert(Math.abs(score.s.position - score.t) < 0.45, 'score follows the cutscene clock: ' + JSON.stringify(score));
    assert.equal(await page.locator('#l2csSkip').isVisible(), true, 'skip is reachable');

    // seek() moves the score with the picture.
    await cs(() => __l2Cutscene.seek(30));
    let peakLive = 0;
    await page.waitForTimeout(3000); // let the level theme's tails from before the seek ring out
    for (let i = 0; i < 16; i++) { await page.waitForTimeout(250); peakLive = Math.max(peakLive, await cs(() => __musicLush.live())); }
    score = await cs(() => ({ s: __l2Score.state(), t: __l2Cutscene.time() }));
    assert(score.t > 36 && score.t < 39.5, 'seek keeps real time: ' + score.t);
    assert(Math.abs(score.s.position - score.t) < 0.45 && score.s.lastStep >= 105, 'score jumped with seek: ' + JSON.stringify(score));
    assert(peakLive > 4 && peakLive <= 34, 'voice count in the busiest strain: ' + peakLive);
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
    await page.screenshot({ path: path.resolve(__dirname, '../../../output/playwright/l2-cutscene/ingame-card.png') });

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

    // 重新抱 20 只 still resets the run; the next clear would go through startEnding again.
    await cs(() => document.getElementById('kitEnding').classList.remove('hidden'));
    await page.locator('#kitAgain').click();
    const again = await save();
    assert(again.total === 0 && again.ended === false, 'kitAgain reset unchanged');
    assert.equal(await cs(() => __l2Cutscene.playing()), false);
    assert.deepEqual(report.errors, []);
    await context.close();
    console.log('l2-cutscene in-game OK ' + JSON.stringify(report));
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
