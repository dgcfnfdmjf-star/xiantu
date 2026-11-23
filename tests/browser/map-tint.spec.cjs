'use strict';
const {test, expect} = require('@playwright/test');

test('cold and cached map tints preserve gray levels, fireflies and the meteor', async ({page}) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/game-v2762.html');
  await page.locator('#introSkipChoiceV2898').check();
  await page.locator('#xiantuSafeBootButton').click();
  await page.locator('#playerName').waitFor({state: 'visible'});

  const clip = {x: 0, y: 0, width: 256, height: 96};
  await page.evaluate(({width, height}) => {
    const panel = document.getElementById('worldPanel'), world = document.getElementById('worldCanvas');
    document.body.append(panel);
    panel.replaceChildren(world);
    panel.style.cssText = `position:fixed;inset:0 auto auto 0;display:block;width:${width}px!important;height:${height}px!important;z-index:2147483647`;
    world.width = width;
    world.height = height;
    world._dpr = 1;
    const ctx = world.getContext('2d'), reference = document.createElement('canvas');
    reference.style.display = 'block';
    reference.width = width;
    reference.height = height;
    const ref = reference.getContext('2d');
    function drawRamp() {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = `rgb(${x},${x},${x})`;
        ctx.fillRect(x, 0, 1, height);
      }
    }
    player = createDefaultPlayer();
    resetMapAliveV2893(true);
    mapWeatherV2893 = () => 'mist';
    mapDayPhaseV2893 = () => 'night';
    setMapAliveQualityV2893('high');
    setScene25dV2888(false);
    ALIVE_V2893.meteor = {x: 70, y: 30, age: .2};

    // Capture the exact backdrop just before either tint, including the frame's particles.
    const drawRain = drawRainV2893;
    drawRainV2893 = (...args) => { drawRain(...args); ref.drawImage(world, 0, 0); };
    let fullFills = 0, fullImages = 0;
    const fill = ctx.fillRect.bind(ctx), draw = ctx.drawImage.bind(ctx);
    ctx.fillRect = (x, y, w, h) => { if (w === width && h === height) fullFills++; fill(x, y, w, h); };
    ctx.drawImage = (image, ...args) => {
      const [x, y, w = image.width, h = image.height] = args.slice(-4);
      if (x === 0 && y === 0 && w === width && h === height) fullImages++;
      draw(image, ...args);
    };
    window.paintTintSample = () => {
      drawRamp();
      fullFills = fullImages = 0;
      mapAliveFrameV2893(1000, 1 / 30);
      ref.fillStyle = MAP_ALIVE_V2893.weatherTint.mist;
      ref.fillRect(0, 0, width, height);
      ref.fillStyle = MAP_ALIVE_V2893.dayNight.tints.night;
      ref.fillRect(0, 0, width, height);
      ref.globalCompositeOperation = 'lighter';
      drawGlowV2893(ref, ALIVE_V2893.clock);
      ref.globalCompositeOperation = 'source-over';
      drawMeteorV2893(ref, 1);
      return {fullFills, fullImages, glows: ALIVE_V2893.glow.length, meteor: !!ALIVE_V2893.meteor,
        reference: reference.toDataURL().split(',')[1]};
    };
  }, clip);

  async function expectSamePixels(frame) {
    const screenshot = await page.screenshot({clip});
    const differences = await page.evaluate(async pngs => {
      const pixels = await Promise.all(pngs.map(async png => {
        const bytes = Uint8Array.from(atob(png), c => c.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], {type: 'image/png'}));
        const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      }));
      return pixels[0].reduce((n, v, i) => n + Number(v !== pixels[1][i]), 0);
    }, [screenshot.toString('base64'), frame.reference]);
    expect(differences).toBe(0);
    expect(frame.glows).toBeGreaterThan(0);
    expect(frame.meteor).toBe(true);
  }
  const cold = await page.evaluate(() => window.paintTintSample());
  expect(cold.fullFills).toBe(2);
  await expectSamePixels(cold);
  let hot;
  await expect.poll(async () => {
    hot = await page.evaluate(() => window.paintTintSample());
    return [hot.fullFills, hot.fullImages];
  }).toEqual([0, 1]);
  await expectSamePixels(hot);
});
