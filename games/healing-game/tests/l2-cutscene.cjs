// Level-2 clear cutscene: timeline API, storyboard model at the 5/20/40/58 s marks, skip/seek/continue, build hooks and kitten save parsing.
// Run: node games/healing-game/tests/l2-cutscene.cjs   (builds the working site first)
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'src/l2-cutscene.js'), 'utf8');

// Fresh module per case, on a fake clock and without a DOM.
function load(search) {
  let now = 1000;
  const sandbox = { location: { search: search || '' }, performance: { now: () => now } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox);
  return { cs: sandbox.__l2Cutscene, tick: seconds => { now += seconds * 1000; } };
}
const near = (a, b, message) => assert(Math.abs(a - b) < 1e-6, `${message}: ${a} vs ${b}`);
// vm objects come from another realm; compare their plain JSON form.
const plain = value => JSON.parse(JSON.stringify(value));
const checks = [];
function check(name, fn) { fn(); checks.push(name); }

check('API surface', () => {
  const { cs } = load();
  for (const name of ['play', 'skip', 'seek', 'time', 'duration', 'playing', 'finished', 'ready']) assert.strictEqual(typeof cs[name], 'function', name);
  assert.strictEqual(cs.ready(), true);
  assert.strictEqual(cs.playing(), false);
  assert.strictEqual(cs.finished(), false);
  assert.strictEqual(cs.time(), 0);
});

check('duration is 55-65s and beats cover it', () => {
  const { cs } = load();
  assert(cs.duration() >= 55 && cs.duration() <= 65, 'duration ' + cs.duration());
  const beats = cs.beats();
  assert.deepStrictEqual(plain(beats.map(b => b.id)), ['settle', 'gather', 'play', 'codex', 'sleep']);
  assert.strictEqual(beats[0].t0, 0);
  for (let i = 1; i < beats.length; i++) assert.strictEqual(beats[i].t0, beats[i - 1].t1, 'contiguous ' + beats[i].id);
  assert.strictEqual(beats[beats.length - 1].t1, cs.duration());
  assert.strictEqual(beats.reduce((sum, b) => sum + b.t1 - b.t0, 0), cs.duration());
});

check('clock runs to the end card in measured time', () => {
  const { cs, tick } = load();
  assert.strictEqual(cs.play(), true);
  assert.strictEqual(cs.playing(), true);
  tick(5); near(cs.time(), 5, 'after 5s');
  assert.strictEqual(cs.beat(), 'settle');
  tick(54.9); near(cs.time(), 59.9, 'after 59.9s');
  assert.strictEqual(cs.playing(), true);
  assert.strictEqual(cs.finished(), false);
  tick(0.1);
  assert.strictEqual(cs.finished(), true);
  assert.strictEqual(cs.playing(), false);
  tick(30); assert.strictEqual(cs.time(), cs.duration(), 'clock holds on the end card');
});

check('seek(5)/seek(20) update time() and keep playing', () => {
  const { cs, tick } = load();
  cs.play();
  assert.strictEqual(cs.seek(5), 5); near(cs.time(), 5, 'seek 5');
  assert.strictEqual(cs.beat(), 'settle');
  cs.seek(20); near(cs.time(), 20, 'seek 20');
  assert.strictEqual(cs.beat(), 'gather');
  tick(2); near(cs.time(), 22, 'runs on after seek');
  assert.strictEqual(cs.beat(), 'play');
  cs.seek(40); assert.strictEqual(cs.beat(), 'codex');
  cs.seek(58); assert.strictEqual(cs.beat(), 'sleep');
  assert(cs.frame().title > 0.99, 'title is up at 58s');
  assert.strictEqual(cs.frame().canContinue, false);
  assert.strictEqual(cs.seek(-3), 0);
  assert.strictEqual(cs.seek(999), cs.duration());
  assert.strictEqual(cs.finished(), true);
  cs.seek(20); assert.strictEqual(cs.playing(), true, 'seeking back from the end resumes');
  assert.strictEqual(cs.finished(), true, 'finished stays set until the next play()');
});

check('seek without play shows a still frame; pause/resume', () => {
  const { cs, tick } = load();
  cs.seek(20); tick(10);
  near(cs.time(), 20, 'still frame');
  assert.strictEqual(cs.state(), 'paused');
  assert.strictEqual(cs.resume(), true); tick(1); near(cs.time(), 21, 'resumed');
  assert.strictEqual(cs.pause(), true); tick(5); near(cs.time(), 21, 'paused');
});

check('frames are a pure function of time', () => {
  const { cs } = load();
  for (const t of [0, 5, 20, 40, 58, 60]) assert.deepStrictEqual(cs.frame(t), cs.frame(t));
  assert.strictEqual(cs.frame(5).title, 0);
  assert(cs.frame(40).dusk > cs.frame(1).dusk, 'dusk deepens');
  assert(cs.frame(20).captionAlpha > 0.99 && cs.frame(20).caption.length > 0);
  for (let t = 0; t <= 60; t += 0.25) {
    const f = cs.frame(t);
    for (const key of ['dusk', 'stars', 'bars', 'title', 'captionAlpha']) assert(f[key] >= 0 && f[key] <= 1, key + '@' + t);
  }
});

check('skip jumps to the end title, which still needs a tap', () => {
  const { cs, tick } = load();
  let continued = 0;
  assert.strictEqual(cs.skip(), false, 'nothing to skip before play');
  cs.play({ onContinue: () => { continued++; } });
  tick(3);
  assert.strictEqual(cs.skip(), true);
  assert.strictEqual(cs.time(), cs.duration());
  assert.strictEqual(cs.finished(), true);
  assert.strictEqual(cs.playing(), false);
  assert.strictEqual(cs.state(), 'ended');
  assert.strictEqual(cs.frame().title, 1);
  assert.strictEqual(cs.frame().canContinue, true);
  assert.deepStrictEqual(plain(cs.text()), { title: '第二关 · 完成', subtitle: '暮色浮岛', cont: '轻触继续', skip: '跳过' });
  assert.strictEqual(continued, 0, 'skip does not dismiss the end card');
  assert.strictEqual(cs.proceed(), false, 'the skipping tap cannot also continue');
  tick(1);
  assert.strictEqual(cs.proceed(), true);
  assert.strictEqual(continued, 1);
  assert.strictEqual(cs.state(), 'closed');
  assert.strictEqual(cs.proceed(), false);
  assert.strictEqual(continued, 1, 'onContinue fires once');
  assert.strictEqual(cs.skip(), false);
});

check('continue is refused before the end; close() drops the callback', () => {
  const { cs, tick } = load();
  let continued = 0;
  cs.play({ onContinue: () => { continued++; } });
  tick(30);
  assert.strictEqual(cs.proceed(true), false);
  assert.strictEqual(cs.close(), true);
  assert.strictEqual(cs.playing(), false);
  assert.strictEqual(continued, 0);
  cs.play(); near(cs.time(), 0, 'replay restarts');
  assert.strictEqual(cs.finished(), false);
});

check('feature flag and preview query', () => {
  assert.strictEqual(load().cs.enabled(), true, 'in-game path is on by default');
  assert.strictEqual(load('?l2cutscene=0').cs.enabled(), false, 'opt-out keeps the 7s card');
  assert.strictEqual(load().cs.scored(), false, 'no score without the audio engine');
  assert.strictEqual(load('?cutscene=1&mute=1').cs.muted(), true);
  const { cs } = load();
  assert.strictEqual(cs.setEnabled(false), false);
  assert.strictEqual(cs.enabled(), false);
});

check('module is ES5 and never touches saves', () => {
  assert(!/localStorage|sessionStorage|healingGarden/.test(source));
  assert(!/=>|\b(?:let|const|class)\s|`/.test(source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), 'ES5 syntax only');
});

check('storyboard beats at the 5 / 20 / 40 / 58 s marks', () => {
  const { cs } = load();
  const at = t => plain(cs.frame(t));
  const five = at(5), twenty = at(20), forty = at(40), last = at(58);
  // 5 s: island settling, lanterns lighting one by one, no cat out yet.
  assert(five.cats.every(c => c.state === 'hide' && c.fade === 0), 'no cats at 5s');
  assert(five.lanterns[0] === 1 && five.lanterns[4] < 1 && five.lanterns.some(v => v > 0 && v < 1), 'lanterns mid-lighting');
  assert(five.book === 0 && five.teaser === 0 && five.title === 0);
  // 20 s: six kittens seated, the glowing one still walking in.
  assert.strictEqual(twenty.cats.length, 7);
  assert.strictEqual(twenty.cats.filter(c => c.rare).length, 1, 'one glowing rare kitten');
  assert(twenty.cats.every(c => c.fade === 1), 'whole cast visible at 20s');
  const rare = twenty.cats.find(c => c.rare);
  assert(rare.state === 'gather' && rare.moving, 'rare cat is on its way at 20s');
  assert.strictEqual(twenty.cats.filter(c => c.state === 'idle').length, 6);
  assert(new Set(twenty.cats.map(c => c.kind)).size >= 6, 'various coats');
  assert(twenty.lanterns.every(v => v === 1));
  // 30 s: teaser, butterflies, hearts.
  const play = at(30);
  assert(play.teaser === 1 && play.butterflies === 1 && play.hearts && play.cats.every(c => c.state === 'play'));
  assert(at(34).landed > 0.99, 'butterfly on a nose at 34s');
  // 40 s: book open, first card lit, later cards not yet; cats circling.
  assert(forty.book === 1 && forty.cards[0] === 1 && forty.cards[5] === 0 && forty.teaser === 0);
  assert(forty.cats.every(c => c.state === 'gather' && c.moving && c.curl === 0));
  assert(at(47).cards.every(v => v === 1), 'all cards lit before the book closes');
  // 58 s: sleep pile, title up, book gone.
  assert(last.cats.every(c => c.state === 'sleep' && c.curl === 1 && !c.moving && c.y === 0));
  assert(last.book === 0 && last.zs && last.title === 1 && last.canContinue === false);
  // Painterly look: golden hour -> dusk -> soft blue night; wind, seeds and the chime are part of every frame.
  assert.strictEqual(five.look, 'painterly');
  assert(five.sky.gold === 1 && twenty.sky.gold > 0.7 && forty.sky.dusk === 1 && last.sky.night === 1, 'sky palette follows the beats');
  for (const f of [five, twenty, forty, last]) assert(Math.abs(f.sky.gold + f.sky.dusk + f.sky.night - 1) < 1e-9 && Math.abs(f.wind) <= 1 && f.seeds >= 20);
  assert(five.stars === 0 && last.stars === 1, 'stars belong to the night');
  const gusts = []; for (let t = 0; t < 60; t += 0.25) gusts.push(cs.frame(t).wind);
  assert(Math.max(...gusts) > 0.5 && Math.min(...gusts) < -0.3, 'wind sweeps in waves');
  assert(gusts.some((w, i) => cs.frame(i * 0.25).chime.ring > 0.5), 'the chime rings on a gust');
  // One kitten chases a drifting seed during play and is back in the ring before the book opens.
  const chase = at(27.5), chaser = chase.cats.find(c => c.chase > 0.99);
  assert(chaser && chase.seed.alpha === 1 && Math.hypot(chaser.x - chase.seed.x, chaser.z - chase.seed.z) < 1.2, 'kitten close behind the seed');
  assert(at(22).chase === 0 && at(33).chase === 0 && forty.seed.alpha === 0);
  assert(twenty.cats.some(c => c.ear > 0) || at(21).cats.some(c => c.ear > 0), 'ears twitch');
  const spread = last.cats.map(c => Math.hypot(c.x - last.cats[6].x, c.z - last.cats[6].z));
  assert(Math.max(...spread) < 1.5, 'pile is tight');
});

check('motion is gentle and continuous', () => {
  const { cs } = load();
  let prev = cs.frame(0);
  for (let t = 0.05; t <= 60; t += 0.05) {
    const f = cs.frame(t);
    f.cats.forEach((c, i) => {
      const step = Math.hypot(c.x - prev.cats[i].x, c.z - prev.cats[i].z) / 0.05;
      assert(step < 2.2, 'cat ' + i + ' speed ' + step.toFixed(2) + ' @' + t.toFixed(2));
      assert(c.y >= 0 && c.y < 0.4, 'hop height');
    });
    for (const key of ['x', 'y', 'z', 'th', 'phi', 'w', 'lift']) assert(Math.abs(f.camera[key] - prev.camera[key]) < 0.05, 'camera ' + key + ' @' + t.toFixed(2));
    prev = f;
  }
});

// ---- Built working site: hooks present, numbers and save parsing untouched ----
execFileSync('python3', [path.join(ROOT, 'scripts/build.py')], { stdio: 'pipe' });
const site = fs.readFileSync(path.join(ROOT, 'site/healing-game/index.html'), 'utf8');
const release = fs.readFileSync(path.join(ROOT, 'site/healing-game-v9.5-baseline/index.html'), 'utf8');
const kit = site.slice(site.indexOf('<script>/* kittens.js'));

check('build wires the module and the flagged startEnding hook', () => {
  assert(site.includes(source), 'module inlined in the working site');
  assert(!release.includes('__l2Cutscene'), 'V9.5 release HTML is free of the cutscene');
  assert(kit.includes("if (window.__l2Cutscene && window.__l2Cutscene.enabled()) window.__l2Cutscene.play({ source: 'level2', onContinue: showCard });"));
  assert(kit.includes('else setTimeout(showCard, 7000);'), 'opt-out path keeps the 7s card');
  const music = fs.readFileSync(path.join(ROOT, 'src/l2-cutscene-music.js'), 'utf8');
  assert(site.includes(music) && !release.includes('__l2Score'), 'score inlined in the working site only');
  assert(site.indexOf('window.__musicLush = {') < site.indexOf('window.__l2Score = {'), 'score loads after the music-lush voices');
  assert(kit.includes("$('kitStay').addEventListener('click', function () { closeEnding(false); });"));
  assert(kit.includes("$('kitAgain').addEventListener('click', function () { closeEnding(true); });"));
  assert(site.indexOf('window.__l2Cutscene = api') < site.indexOf('<script>/* kittens.js'), 'module loads before kittens.js');
});

check('gameplay numbers unchanged', () => {
  const head = kit.slice(0, 4000);
  assert(head.includes("var SAVE_KEY = 'healingGarden.kittens.v1', UNLOCK_KEY = 'hg_level2_unlocked';"));
  assert(head.includes('var GOAL = 20;'));
  assert(head.includes('var RARE_CHANCE = 0.08;'));
  assert(head.includes("value: 3, rare: true }"));
  // Outside the cutscene block and its two hooks the working site equals the release HTML.
  const strip = text => text.split('\n').filter(line => !/__l2Cutscene|__l2Stage|showCard|garden-working/.test(line)).join('\n');
  const score = fs.readFileSync(path.join(ROOT, 'src/l2-cutscene-music.js'), 'utf8');
  const without = site.replace('<script>\n' + source + '\n</script>\n', '').replace('<script>\n' + score + '\n</script>\n', '');
  const base = release.split('\n').filter(line => !line.includes("$('kitEnding').classList.remove('hidden'); }, 7000);")).join('\n');
  assert.strictEqual(strip(without), base);
});

check('existing kitten save fields still parse', () => {
  const from = kit.indexOf('  var KINDS = ['), to = kit.indexOf('  function isUnlocked()');
  assert(from > 0 && to > from, 'save block found');
  const run = saved => {
    const box = { saved, written: null };
    vm.runInNewContext('var SAVE_KEY = "healingGarden.kittens.v1";\n' +
      'function store(k, v) { if (v === undefined) return box.saved[k] === undefined ? null : box.saved[k]; box.written = [k, v]; return null; }\n' +
      kit.slice(from, to) + '\nload(); box.S = S; save();', { box });
    return box;
  };
  const old = { caught: { orange: 6, calico: 3, black: 2, glow: 1, nope: 9 }, total: 20, ended: true, level: 2, companions: { orange: 4, calico: 3, tabby: 9 } };
  const got = run({ 'healingGarden.kittens.v1': JSON.stringify(old) });
  assert.deepStrictEqual(plain(got.S.caught), { orange: 6, calico: 3, black: 2, glow: 1 });
  assert.strictEqual(got.S.total, 20);
  assert.strictEqual(got.S.ended, true);
  assert.strictEqual(got.S.level, 2);
  assert.deepStrictEqual(plain(got.S.companions), { orange: 4, calico: 3, tabby: 4 });
  assert.strictEqual(got.written[0], 'healingGarden.kittens.v1');
  assert.deepStrictEqual(Object.keys(JSON.parse(got.written[1])).sort(), ['caught', 'companions', 'ended', 'level', 'total'], 'no new save field');
  // A pre-companions save and an empty slot both load with defaults.
  const legacy = run({ 'healingGarden.kittens.v1': JSON.stringify({ caught: { white: 1 }, total: 1, ended: false }) });
  assert.strictEqual(legacy.S.total, 1);
  assert.strictEqual(legacy.S.ended, false);
  assert.deepStrictEqual(plain(legacy.S.companions), {});
  const empty = run({});
  assert.strictEqual(empty.S.total, 0);
  assert.strictEqual(empty.S.ended, false);
});

console.log(JSON.stringify({ pass: true, duration: load().cs.duration(), checks }, null, 1));
