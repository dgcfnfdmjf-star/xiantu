'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const site = path.resolve(__dirname, '../site/healing-game');

async function check(browser, blocked) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://garden.test') return route.abort();
      return route.fulfill({ path: path.join(site, url.pathname === '/' ? 'index.html' : url.pathname.slice(1)) });
    });
    await context.addInitScript(blocked => {
      const probe = window.audioProbe = { gestureBuffers: [], samples: 0, oscillators: 0, replies: [], held: true };
      // Isolate audio from the CI host's continuously running software GPU.
      const frame = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = fn => fn.name === 'frame' ? 0 : frame(fn);
      let gesture = false, started = 0;
      for (const name of ['touchend', 'click']) {
        window.addEventListener(name, e => {
          if (e.target.closest('#start')) { gesture = true; started = performance.now(); }
        }, true);
        window.addEventListener(name, () => {
          if (gesture) { probe[name] = performance.now() - started; gesture = false; }
        });
      }
      const alloc = BaseAudioContext.prototype.createBuffer;
      BaseAudioContext.prototype.createBuffer = function (count, length, rate) {
        if (gesture) probe.gestureBuffers.push(length);
        return alloc.call(this, count, length, rate);
      };
      const play = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (this.buffer && this.buffer.length > 1) probe.samples++;
        return play.apply(this, args);
      };
      const osc = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (...args) { probe.oscillators++; return osc.apply(this, args); };
      const Worker = window.Worker;
      window.Worker = class {
        constructor(url) {
          if (blocked) throw new Error('Blob workers blocked on this device');
          this.native = new Worker(url);
          this.native.onmessage = e => {
            const deliver = () => this.onmessage(e);
            if (probe.held) probe.replies.push(deliver);
            else deliver();
          };
          this.native.onerror = e => this.onerror(e);
        }
        postMessage(message) { this.native.postMessage(message); }
        terminate() { this.native.terminate(); }
      };
    }, blocked);
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(120000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://garden.test/');
    const start = await page.locator('#startButton').boundingBox();
    await page.touchscreen.tap(start.x + start.width / 2, start.y + start.height / 2);
    await page.waitForFunction(() => audioProbe.oscillators > 0 && GardenAudio.context().state === 'running');
    const first = await page.evaluate(() => ({
      sizes: audioProbe.gestureBuffers, clickMs: Math.round(audioProbe.click),
      hidden: document.getElementById('start').classList.contains('hidden')
    }));
    assert.deepEqual(first.sizes, [1], 'only the iOS unlock buffer is created during the start gesture');
    assert(first.hidden, 'the start screen acknowledged the tap');
    const voiceBudget = await page.evaluate(() => {
      const before = __musicLush.live(), ctx = GardenAudio.context(), silent = GardenAudio.kit.gain(0, ctx.destination);
      for (let i = 0; i < 60; i++) __music2.voices.felt(ctx.currentTime + 0.05, 60, 0.05, silent);
      return { before, after: __musicLush.live() };
    });
    assert(voiceBudget.before > 0, 'the cold opening chord consumes voice slots');
    assert.equal(voiceBudget.after, Math.max(34, voiceBudget.before), 'cold plucks respect the same cap as decoded voices');
    if (!blocked) await page.waitForFunction(() => audioProbe.replies.length > 0);
    const result = await page.evaluate(async () => {
      GardenAudio.setMusic(false);
      const ctx = GardenAudio.context();
      await ctx.suspend();
      const before = audioProbe.samples;
      audioProbe.held = false;
      audioProbe.replies.splice(0).forEach(deliver => deliver());
      const warm = await GardenAudioSamples.get(ctx, 'warm', 45).ready;
      return { generated: warm ? [warm.numberOfChannels, warm.length, warm.sampleRate] : null,
        samplesWhileMuted: audioProbe.samples - before, enabled: GardenAudio.isMusicOn(), state: ctx.state };
    });
    assert.deepEqual(result.generated, blocked ? null : [2, 131072, 22050]);
    assert.equal(result.samplesWhileMuted, 0);
    assert.equal(result.enabled, false);
    assert.equal(result.state, 'suspended');
    await page.waitForTimeout(1100); // let the normal mute fade retire its player
    await page.evaluate(async () => {
      await GardenAudio.context().resume();
      audioProbe.oscillators = 0;
      GardenAudio.setMusic(true);
    });
    await page.waitForFunction(blocked => blocked ? audioProbe.oscillators > 0 : audioProbe.samples > 0, blocked);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ blocked, ...first, ...result }));
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
  try {
    await check(browser, false);
    await check(browser, true);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
