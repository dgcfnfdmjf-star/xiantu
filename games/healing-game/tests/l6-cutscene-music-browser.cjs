'use strict';

// Level-6 cutscene score 「雪窗归途」 on the built page (390x844 phone): the first tap of the ?cutscene=l6 preview starts
// the score, its music-lush voices and celesta actually play through the real Web Audio graph, the peak output level
// stays in line with the level-5 film's score (measured the same way on ?cutscene=l5), pause silences it, skip settles
// it, close hands the track back, and &mute=1 never starts it.
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome node games/healing-game/tests/l6-cutscene-music-browser.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const SITE = path.resolve(__dirname, '../site/healing-game');
const MIME = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };

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
  const errors = [], report = {};
  async function open(q) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    // Tap every connection into the speakers with one analyser, and count celesta partials (sine oscillators started
    // while the film plays), without changing what is heard.
    await page.addInitScript(() => {
      const connect = AudioNode.prototype.connect;
      window.__peak = 0; window.__sines = 0;
      AudioNode.prototype.connect = function (dst) {
        if (dst instanceof AudioDestinationNode) {
          const ctx = this.context;
          if (!ctx.__an) { ctx.__an = ctx.createAnalyser(); ctx.__an.fftSize = 2048; ctx.__buf = new Float32Array(2048); window.__an = ctx.__an; window.__buf = ctx.__buf; }
          connect.call(this, ctx.__an);
        }
        return connect.apply(this, arguments);
      };
      const start = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function () { if (this.type === 'sine') window.__sines++; return start.apply(this, arguments); };
      setInterval(() => { if (!window.__an) return; window.__an.getFloatTimeDomainData(window.__buf); let m = 0; for (const v of window.__buf) m = Math.max(m, Math.abs(v)); window.__peak = Math.max(window.__peak, m); }, 20);
    });
    await page.goto(url + q, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__l6Cutscene && window.__l5Cutscene && window.GardenAudio, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    return { context, page };
  }
  // Peak level over a window of the film (seconds of film time), after the first tap started it.
  async function peakOver(page, film, from, secs) {
    await page.evaluate(([f, t]) => { window[f].seek(t); window.__peak = 0; }, [film, from]);
    await page.waitForTimeout(secs * 1000);
    return page.evaluate(() => window.__peak);
  }

  /* ---- level 6 ---- */
  let { context, page } = await open('?cutscene=l6');
  assert.equal(await page.evaluate(() => __l6Score.state().active), false, 'idle before the first tap');
  await page.mouse.click(195, 600);
  await page.waitForTimeout(800);
  let st = await page.evaluate(() => ({ s: __l6Score.state(), scored: __l6Cutscene.scored(), playing: __l6Cutscene.playing(), others: [__l1Score, __l2Score, __l3Score, __l4Score, __l5Score].map(x => x.state().active) }));
  assert(st.scored && st.playing && st.s.active && st.s.current, 'first tap starts film and score: ' + JSON.stringify(st));
  assert.equal(st.s.track, '雪窗归途'); assert.deepEqual(st.others, [false, false, false, false, false], 'no other score plays');
  assert.equal(await page.evaluate(() => __l6Score.sparkleVoice), 'celesta');
  // the lantern bells: seek to the lanterns and count celesta partials and voices
  await page.evaluate(() => { __l6Cutscene.seek(10.2); window.__sines = 0; });
  let live = 0;
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(250); live = Math.max(live, await page.evaluate(() => __musicLush.live())); }
  const sines = await page.evaluate(() => window.__sines), steps = await page.evaluate(() => __l6Score.state().steps);
  assert(live > 3 && live <= 38, 'piano/strings voices sound in the lantern bars: ' + live);
  assert(sines >= 6, 'celesta bells ring for the lanterns: ' + sines);
  assert(steps > 10, 'score steps advance: ' + steps);
  report.l6Live = live; report.l6Sines = sines;
  const p6 = Math.max(await peakOver(page, '__l6Cutscene', 33, 7), await peakOver(page, '__l6Cutscene', 22, 4));
  report.l6Peak = +p6.toFixed(4);
  assert(p6 > 0.01, 'audible: ' + p6);
  // pause: silence
  await page.evaluate(() => __l6Cutscene.pause()); await page.waitForTimeout(700);
  const held = await page.evaluate(() => __l6Score.state().steps); await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => __l6Score.state().steps), held, 'paused film, silent score');
  await page.evaluate(() => __l6Cutscene.resume()); await page.waitForTimeout(500);
  // skip: settle (free), then close hands the track back
  await page.evaluate(() => __l6Cutscene.skip()); await page.waitForTimeout(300);
  st = await page.evaluate(() => __l6Score.state());
  assert(st.active && st.free, 'skip settles the score into the title bars');
  await page.waitForTimeout(3000);
  await page.evaluate(() => __l6Cutscene.close()); await page.waitForTimeout(300);
  st = await page.evaluate(() => ({ s: __l6Score.state(), scored: __l6Cutscene.scored() }));
  assert(!st.s.active && !st.scored && st.s.track !== '雪窗归途', 'close hands the track back: ' + JSON.stringify(st));
  await context.close();

  /* ---- level 5, measured the same way ---- */
  ({ context, page } = await open('?cutscene=l5'));
  await page.mouse.click(195, 600); await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => __l5Score.state().active), true);
  const p5 = Math.max(await peakOver(page, '__l5Cutscene', 30, 7), await peakOver(page, '__l5Cutscene', 21, 4));
  report.l5Peak = +p5.toFixed(4);
  assert(p6 <= p5 * 1.25 + 0.01 && p6 >= p5 * 0.6, 'level-6 peak in line with level 5: ' + JSON.stringify(report));
  await context.close();

  /* ---- muted preview never starts the score ---- */
  ({ context, page } = await open('?cutscene=l6&mute=1'));
  await page.waitForTimeout(1000);
  assert.deepEqual(await page.evaluate(() => [__l6Cutscene.muted(), __l6Cutscene.scored(), __l6Score.state().active]), [true, false, false], '&mute=1 never starts the score');
  await context.close();

  assert.deepEqual(errors, [], 'no page errors');
  await browser.close(); server.close();
  console.log('l6-cutscene-music-browser: ok ' + JSON.stringify(report));
})().catch(e => { console.error(e); process.exit(1); });
