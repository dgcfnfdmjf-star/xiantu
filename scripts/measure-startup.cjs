'use strict';

// Start scripts/serve.cjs for each checkout, then pass its local URL here.
// Each sample starts with an empty browser context and Chromium's HTTP cache disabled.
const { chromium } = require('playwright');

const origin = new URL(process.argv[2] || 'http://127.0.0.1:8765');
const repeats = Number(process.argv[3] || 3);
if (origin.hostname !== '127.0.0.1' || !Number.isInteger(repeats) || repeats < 1) {
  throw new Error('Usage: node scripts/measure-startup.cjs http://127.0.0.1:PORT [positive sample count]');
}

async function sample(browser) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, serviceWorkers: 'block'
  });
  try {
    await context.route(url => !['data:', 'blob:'].includes(url.protocol) && url.origin !== origin.origin,
      route => route.abort());
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 100, downloadThroughput: 1_600_000 / 8, uploadThroughput: 1_600_000 / 8
    });
    await page.goto(new URL('/game-v2762.html', origin).href, { waitUntil: 'domcontentloaded' });
    await page.locator('#introSkipChoiceV2898').check();
    await page.evaluate(() => {
      document.getElementById('xiantuSafeBootButton').addEventListener('click', () => {
        const start = performance.now();
        function measureFrame() {
          if (!document.documentElement.classList.contains('xiantu-v2762-ready')) {
            requestAnimationFrame(measureFrame);
            return;
          }
          const elapsedMs = Math.round(performance.now() - start);
          const resources = performance.getEntriesByType('resource').filter(entry => entry.transferSize > 0);
          const scripts = resources.filter(entry => new URL(entry.name).pathname.endsWith('.js'));
          const styles = resources.filter(entry => new URL(entry.name).pathname.endsWith('.css'));
          window.startupSample = {
            elapsedMs, scripts: scripts.length, styles: styles.length,
            resourceBodyBytes: [...scripts, ...styles].reduce((sum, entry) => sum + entry.encodedBodySize, 0)
          };
        }
        requestAnimationFrame(measureFrame);
      }, { capture: true, once: true });
    });
    await page.locator('#xiantuSafeBootButton').click();
    await page.waitForFunction(() => window.startupSample, null, { timeout: 90_000 });
    // Confirm the title's primary action can receive a real click.
    await page.getByRole('button', { name: '开始修仙', exact: true }).click({ trial: true });
    return await page.evaluate(() => window.startupSample);
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    console.log('Chromium', browser.version(), '· 393×852 · 1.6 Mbps · 100 ms');
    const times = [];
    for (let i = 0; i < repeats; i++) {
      const result = await sample(browser);
      console.log(JSON.stringify(result));
      times.push(result.elapsedMs);
    }
    times.sort((a, b) => a - b);
    const middle = Math.floor(times.length / 2);
    const median = times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2;
    console.log('Median (ms)', median);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
