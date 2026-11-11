'use strict';

// Shared, local-only browser fixture. All saves and diagnostic hooks are synthetic.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const repo = path.resolve(__dirname, '../../..');
const site = path.join(repo, 'games/healing-game/site/healing-game');
const output = path.join(repo, 'output/playwright/cat-models');
const kinds = ['orange', 'calico', 'black', 'tabby'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png', '.mp3': 'audio/mpeg' };

function instrument(html, spawnSequence) {
  const marker = 'renderer.setPixelRatio(DPR);';
  if (!html.includes(marker)) throw Error('Renderer diagnostic injection point missing');
  html = html.replace(marker, `window.__catTestRenderer=renderer;
    window.__catTestFrames=[];window.__catTestDraws=0;
    var catTestRender=renderer.render,catTestLast=null;
    renderer.render=function(){var begin=performance.now(),value=catTestRender.apply(this,arguments),end=performance.now();
      window.__catTestDraws++;if(window.__catTestFrames.length<1500)window.__catTestFrames.push({at:begin,interval:catTestLast===null?null:begin-catTestLast,draw:end-begin});catTestLast=begin;return value;};
    ${marker}`);
  html = html.replace('cat = { root: root, head:', 'cat = window.__catTestAmbient = { root: root, head:');
  if (spawnSequence) {
    const needle = 'function pickKind() {';
    if (!html.includes(needle)) throw Error('Synthetic spawn fixture injection point missing');
    html = html.replace(needle, `var catTestKinds=${JSON.stringify(spawnSequence)}; ${needle} if(catTestKinds.length)return byId[catTestKinds.shift()];`);
  }
  return html;
}

async function server(options = {}) {
  const root = path.resolve(options.root || site), requests = [];
  const instance = http.createServer((request, response) => {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    requests.push(name);
    const file = path.resolve(root, '.' + (name.endsWith('/') ? name + 'index.html' : name));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    fs.readFile(file, (error, data) => {
      if (!error && path.extname(file) === '.html') data = Buffer.from(instrument(data.toString(), options.spawnSequence));
      response.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(error ? 'Missing test fixture' : data);
    });
  });
  await new Promise(resolve => instance.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${instance.address().port}/`, requests, close: () => new Promise(resolve => instance.close(resolve)) };
}

async function browser() {
  fs.mkdirSync(output, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  return chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
}

async function fresh(browser, options = {}) {
  const mobile = options.mobile !== false;
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1200, height: 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const external = [], errors = [], requests = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') { external.push(url.href); return route.abort(); }
    requests.push(url.pathname);
    return route.continue();
  });
  await context.addInitScript(({ save, progress, randomSeed }) => {
    if (randomSeed !== null) {
      let state = randomSeed >>> 0;
      Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    }
    if (sessionStorage.getItem('cat-models-fixture')) return;
    sessionStorage.setItem('cat-models-fixture', '1');
    localStorage.setItem('hg_level2_unlocked', '1');
    localStorage.setItem('healingGarden.kittens.v1', JSON.stringify(save));
    localStorage.setItem('healingGarden.journey.v1', JSON.stringify(progress));
    localStorage.setItem('xiantu_save', 'CAT_TEST_UNRELATED_SAVE');
  }, { save: options.save || { level: 2, total: 0, ended: false, caught: {}, companions: {} }, progress: options.progress || { completed: [1] }, randomSeed: options.randomSeed ?? null });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, mobile, external, errors, requests };
}

async function start(test, url) {
  await test.page.goto(url || process.env.CAT_MODELS_BASE_URL);
  await test.page.locator('#start').click();
  await test.page.waitForFunction(() => window.__kittens && window.GardenJourney?.ready);
}

async function scene(page, duration = 3000) {
  await page.evaluate(() => { window.__catTestFrames.length = 0; });
  await page.waitForTimeout(duration);
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas'), renderer = window.__catTestRenderer;
    const gl = renderer.getContext(), extension = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      backing: { width: canvas.width, height: canvas.height },
      count: __kittens.list.length, states: __kittens.list.map(k => ({ kind: k.kind.id, state: k.state })),
      render: { ...renderer.info.render }, memory: { ...renderer.info.memory },
      heap: performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize } : null,
      renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      frames: __catTestFrames.slice(1), modelReady: __kittens.list.filter(k => k.catModel).length,
      resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, duration: r.duration, startTime: r.startTime, responseEnd: r.responseEnd, transferSize: r.transferSize, encodedBodySize: r.encodedBodySize }))
    };
  });
}

function summarize(samples) {
  const sorted = samples.filter(Number.isFinite).sort((a, b) => a - b);
  return { n: sorted.length, median: sorted[Math.floor(sorted.length / 2)] ?? null, p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * .95) - 1)] ?? null };
}

module.exports = { fs, path, repo, site, output, kinds, server, browser, fresh, start, scene, summarize };
