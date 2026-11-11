// Execute the shipped butterfly/input/camera code with synthetic state only.
// Browser-only captures are injected into this test's copy, never the release.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(process.env.HEALING_HTML || path.join(ROOT, 'site/healing-game/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const threeSource = scripts.find(s => s.includes('THREE={}') && s.includes('PerspectiveCamera'));
assert.ok(threeSource, 'bundled Three.js found');
const threeContext = { console };
vm.runInNewContext(threeSource, threeContext);
const T = threeContext.THREE;
const clipContext = { window: {} };
vm.runInNewContext(scripts.find(s => s.includes('clipping.js —')), clipContext);
const clip = clipContext.window.GardenClip;
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }
function target() {
  const listeners = {};
  return { addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, fire(type, event) { for (const fn of listeners[type] || []) fn(event); } };
}
function node() {
  const classes = new Set();
  return { ...target(), style: {}, textContent: '', innerHTML: '', classList: {
    add(s) { classes.add(s); }, remove(s) { classes.delete(s); },
    toggle(s, on) { if (on) classes.add(s); else classes.delete(s); }, contains(s) { return classes.has(s); }
  } };
}
function butterflyFixture(saved) {
  const cvs = target(), elements = {}, timers = [], floats = [], toasts = [], writes = {};
  for (const id of ['bfCount', 'bfBar', 'bfHud', 'bfGrid', 'bfSub', 'bfEnding', 'bfCodex', 'gpBookBtn']) elements[id] = node();
  const camera = new T.PerspectiveCamera(48, 1280 / 800, .5, 300);
  camera.position.set(0, 3, 12); camera.lookAt(0, 1, 0); camera.updateMatrixWorld();
  const scene = new T.Scene();
  const win = { ...target(), innerWidth: 1280, innerHeight: 800, GardenClip: clip,
    __kittens: { state: () => ({ level: 1 }) }, localStorage: {
      getItem: () => JSON.stringify(saved), setItem: (key, value) => { writes[key] = JSON.parse(value); }
    } };
  const doc = { ...target(), hidden: false, getElementById: id => elements[id] || null,
    querySelector: selector => selector.includes('#modes') ? { getAttribute: () => 'net' } : cvs,
    createElement: node, body: { appendChild(el) { floats.push(el); } } };
  const ctx = { window: win, document: doc, console, setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {} };
  let source = scripts.find(s => s.includes('butterflies.js —'));
  assert.ok(source, 'butterfly runtime found');
  source = source.replace('  // Test hooks', `  window.__feedbackProbe = {
    setup: function (hooks) { H = hooks; T = hooks.THREE; tmp = new T.Vector3(); tmp2 = new T.Vector3(); tmpC = new T.Color();
      raycaster = new T.Raycaster(); ndc = new T.Vector2(); icons = {};
      SPECIES.forEach(function (sp) { icons[sp.id] = { on: '', off: '' }; });
      load(); bindInput(); renderHud(false); },
    codex: renderCodex, closeEnding: closeEnding, flush: flushSave
  };
  // Test hooks`);
  vm.runInNewContext(source, ctx);
  win.__feedbackProbe.setup({ THREE: T, canvas: cvs, camera, scene, flowers: [], TOP_Y: .25,
    island: { position: { y: 0 } }, isStarted: () => true, toast: text => toasts.push(text) });
  function add(rare = true, pos = new T.Vector3(0, 1, 0)) {
    const g = new T.Group(); g.position.copy(pos); scene.add(g);
    const b = { sp: win.__bf.species.find(s => !!s.rare === rare), g, pos: pos.clone(), scale: 1,
      fade: 1, state: 'wander', dead: false, age: 1 };
    win.__bf.butterflies.push(b); return b;
  }
  const event = (x = 640, y = 400) => ({ pointerId: 1, clientX: x, clientY: y });
  return { win, cvs, elements, timers, floats, toasts, writes, add, event };
}

test('a real rare pointerdown at 29 scores 32 points, ends once, and displays 30/30', () => {
  const f = butterflyFixture({ total: 29, ended: false, caught: { pieris: 29 } });
  f.add();
  assert.doesNotThrow(() => f.cvs.fire('pointerdown', f.event()));
  const s = f.win.__bf.state();
  assert.equal(s.total, 32); assert.equal(s.points, 32); assert.equal(s.goalPoints, 30);
  assert.equal(s.individuals, 30); assert.equal(s.caught.morpho, 1);
  assert.equal(s.ended, true); assert.equal(s.endingUp, true);
  assert.match(f.elements.bfCount.textContent, /30 \/ 30 点 · 正在放飞/);
  assert.doesNotMatch(f.elements.bfCount.textContent, /32|自由捕蝶/);
  assert.equal(f.elements.bfBar.style.width, '100%');
  assert.ok(f.floats.some(el => el.textContent.includes('+3 点心动')));
  f.timers.filter(t => t.ms === 200).forEach(t => t.fn());
  assert.ok(f.toasts.some(text => text.includes('稀有发光蝶 +3 点心动')));
  f.win.__feedbackProbe.codex();
  assert.match(f.elements.bfSub.textContent, /累计捕获 30 只 · 本程心动 32 点/);
  f.cvs.fire('pointerdown', f.event());
  assert.equal(f.win.__bf.state().total, 32, 'ending blocks duplicate input');
  f.win.__feedbackProbe.flush();
  assert.equal(f.writes['healingGarden.butterflies.v1'].total, 32, 'legacy weighted save preserved');
  f.win.__feedbackProbe.closeEnding(false);
  assert.match(f.elements.bfCount.textContent, /32 点 · 自由捕蝶/);
  f.win.__feedbackProbe.closeEnding(true);
  assert.equal(f.win.__bf.state().total, 0);
  assert.equal(f.win.__bf.state().individuals, 30, 'replay keeps the lifetime collection');
});

test('a winning rare catch during pointermove safely stops the active stroke', () => {
  const f = butterflyFixture({ total: 29, ended: false, caught: { pieris: 29 } });
  f.add(); f.add();
  f.cvs.fire('pointerdown', f.event(0, 0));
  assert.equal(f.win.__bf.state().total, 29, 'stroke starts off target');
  assert.doesNotThrow(() => f.cvs.fire('pointermove', f.event()));
  assert.equal(f.win.__bf.state().total, 32);
  assert.equal(f.win.__bf.state().caught.morpho, 1);
  assert.equal(f.win.__bf.state().endingUp, true);
});

test('known rare species still announce +3 and ordinary catches add one individual', () => {
  const f = butterflyFixture({ total: 10, ended: false, caught: { pieris: 7, morpho: 1 } });
  f.add(); f.cvs.fire('pointerdown', f.event()); f.cvs.fire('pointerup', f.event());
  f.timers.filter(t => t.ms === 200).forEach(t => t.fn());
  assert.ok(f.toasts.some(text => text.includes('+3 点心动')));
  f.add(false); f.cvs.fire('pointerdown', f.event());
  assert.equal(f.win.__bf.state().total, 14); assert.equal(f.win.__bf.state().individuals, 10);
  assert.match(f.elements.bfCount.textContent, /14 \/ 30 点/);
});

test('a hidden near-camera butterfly cannot intercept a tap', () => {
  const f = butterflyFixture({ total: 0, ended: false, caught: {} });
  const b = f.add(); b.g.visible = false;
  f.cvs.fire('pointerdown', f.event());
  assert.equal(f.win.__bf.state().total, 0);
  assert.equal(f.win.__bf.screenOf(b).front, false);
});

test('first chapter holds its idle camera, preserves manual rotation, and leaves later idle orbit', () => {
  const a = html.indexOf('    // Camera\n'), b = html.indexOf('    // Island bob', a);
  assert.ok(a > 0 && b > a);
  let level = 1;
  const ctx = { dt: .05, performance: { now: () => 10000 },
    cam: { th: .8, tTh: .8, phi: 1, tPhi: 1, zoom: 1, tZoom: 1, baseR: 14, lastInput: 0 },
    window: { __kittens: { state: () => ({ level }) } }, camera: new T.PerspectiveCamera(),
    target: new T.Vector3(), sky: new T.Group() };
  vm.createContext(ctx);
  const step = new vm.Script(html.slice(a, b));
  for (let i = 0; i < 100; i++) step.runInContext(ctx);
  assert.equal(ctx.cam.th, .8); assert.equal(ctx.cam.tTh, .8);
  ctx.cam.tTh = 1.4; step.runInContext(ctx);
  assert.ok(ctx.cam.th > .8 && ctx.cam.th < 1.4, 'manual target still interpolates');
  assert.equal(ctx.cam.tTh, 1.4);
  level = 2; step.runInContext(ctx); assert.ok(ctx.cam.tTh > 1.4);
});

test('successful chapter-one planting returns to net with feedback; failed and chapter-two planting stay selected', () => {
  const a = html.lastIndexOf('  function onTap(x, y) {'), b = html.indexOf('  /* ------------------------------------------------------------------', a);
  assert.ok(a > 0 && b > a);
  function run(level, hit) {
    const toasts = [], flowers = [], buttons = ['net', 'plant'].map(mode => ({ ...node(), getAttribute: () => mode }));
    const ctx = { mode: 'plant', started: true, ndc: new T.Vector2(), camera: {}, grassTop: {}, flowers,
      MAX_FLOWERS: 20, raycaster: { setFromCamera() {}, intersectObject: () => hit ? [{ face: { normal: { y: 1 } }, point: new T.Vector3(2, .25, 0) }] : [] },
      island: { worldToLocal: v => v }, canPlant: () => null, plantFlower: () => flowers.push({}),
      Sound: { plant() {} }, onFlowerCountChanged() {}, modeBtns: buttons, toast: text => toasts.push(text),
      window: { innerWidth: 1280, innerHeight: 800, GardenClip: { plantBlocked: () => null }, __kittens: { state: () => ({ level }) } } };
    vm.runInNewContext(html.slice(a, b) + '\nonTap(640,400);', ctx);
    return { ctx, toasts, buttons };
  }
  const success = run(1, true);
  assert.equal(success.ctx.flowers.length, 1); assert.equal(success.ctx.mode, 'net');
  assert.equal(success.buttons[0].classList.contains('on'), true);
  assert.ok(success.toasts.some(text => text.includes('已切回捕蝶')));
  assert.equal(run(1, false).ctx.mode, 'plant');
  assert.equal(run(2, true).ctx.mode, 'plant');
});

test('visible wing vertices remain clear of the camera and bounded across manual orbit, zoom and aspect changes', () => {
  const wing = new T.PlaneGeometry(.62, .62); wing.translate(.31, 0, 0); wing.rotateX(Math.PI / 2);
  const g = new T.Group(), wl = new T.Group(), wr = new T.Group();
  wl.scale.x = -1; wl.add(new T.Mesh(wing)); wr.add(new T.Mesh(wing)); g.add(wl, wr);
  const forward = new T.Vector3(), right = new T.Vector3(), vertex = new T.Vector3(), local = new T.Vector3();
  let samples = 0, visible = 0, minDepth = Infinity, maxFraction = 0;
  for (const [w, h] of [[320, 568], [390, 844], [1280, 800], [844, 390]]) {
    const camera = new T.PerspectiveCamera(w < h ? 55 : 48, w / h, .5, 300);
    const half = camera.fov * Math.PI / 360;
    const base = Math.max(14, 5.6 / Math.tan(Math.min(half, Math.atan(Math.tan(half) * w / h))));
    for (const zoom of [.6, 1, 1.5]) for (let az = 0; az < 12; az++) for (const phi of [.75, 1.1, 1.4]) {
      camera.position.set(base * zoom * Math.sin(phi) * Math.cos(az), .4 + base * zoom * Math.cos(phi), base * zoom * Math.sin(phi) * Math.sin(az));
      camera.lookAt(0, .4, 0); camera.getWorldDirection(forward);
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      for (const depth of [-1, .5, 3.1, 3.21, 3.6, 4.5, 6, 9, 14]) for (const side of [0, .5, 2, 5]) {
        g.position.copy(camera.position).addScaledVector(forward, depth).addScaledVector(right, side);
        const original = g.position.clone();
        g.scale.setScalar(1.15 * 1.15); g.rotation.set(-.75, az, .5);
        wl.rotation.z = -Math.sin(samples) * 1.05 - .2; wr.rotation.z = -wl.rotation.z;
        clip.keepButterflyFromCamera(g, camera); samples++;
        assert.equal(g.position.distanceTo(original), 0, 'camera protection does not move butterflies into props');
        if (!g.visible) { assert.ok(depth <= 3.2); continue; }
        visible++; assert.ok(depth > 3.2);
        g.updateMatrixWorld(true);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const hinge of [wl, wr]) {
          const mesh = hinge.children[0], attr = mesh.geometry.attributes.position;
          for (let i = 0; i < attr.count; i++) {
            vertex.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld);
            const z = local.copy(vertex).sub(camera.position).dot(forward);
            minDepth = Math.min(minDepth, z); assert.ok(z > camera.near, 'no wing vertex reaches the near plane');
            vertex.project(camera);
            const x = (vertex.x + 1) * w / 2, y = (1 - vertex.y) * h / 2;
            minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
        }
        const fraction = Math.max(maxX - minX, maxY - minY) / Math.min(w, h);
        maxFraction = Math.max(maxFraction, fraction);
        assert.ok(fraction <= .280001, 'wing span bounded on the shorter viewport dimension: ' + fraction);
      }
    }
  }
  console.log(JSON.stringify({ samples, visible, minWingDepth: minDepth, maxWingScreenFraction: maxFraction }));
});

console.log(checks + ' butterfly feedback checks passed');
