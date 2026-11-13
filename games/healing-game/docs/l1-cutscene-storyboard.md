# 第一关通关过场 · Level-1 clear cutscene storyboard

Status: **item 1: skeleton, trigger hook and the painterly world**. Timeline, camera, sky, clouds, grass
wind, light, paper, captions, skip / continue and the build hook are in; the butterflies are
placeholders (flat two-wing actors on simple blended paths). Item 2 gives them proper motion and the
net a shape; item 3 adds the score (`src/l1-cutscene-music.js` → `window.__l1Score`, already looked
up by `play()`; silent until it exists).

- Module: `src/l1-cutscene.js` (ES5, no dependencies, no save access) → `window.__l1Cutscene`
- Build hook: `scripts/l1-cutscene-v96.py`, run by `scripts/build.py` after `l2-cutscene-v96.py`
  (so after the V9.5 release HTML is frozen)
- Total length: **50 s** (`duration()`; allowed range 45–60 s). Beats are contiguous.
- An original Ghibli-inspired homage in mood only: no character, frame, background or melody is
  copied from any film.

## Beats

| # | id | time | picture | caption |
|---|----|------|---------|---------|
| a | `meadow` | 0–9 s | Far, wide establishing shot: the island small under a watercolour sky with big sunlit cumulus; wind sweeps waves through the tall grass and wildflowers; letterbox bars slide in. | 风从云下吹来，草浪一层层漫过小岛 |
| b | `release` | 9–19 s | Glide down to the front of the island. A warm glow opens where the net is (`NET`), and the butterflies come out one by one (0.5 s apart), in the colours of the species the player caught. | 你轻轻打开网，三十份心动回到风里 |
| c | `dance` | 19–32 s | Slow drift across the flowers. Each butterfly circles its own blossom, and one after another settles on the flower head for a moment (wings slow down), then lifts off again. | 它们绕着花丛打转，在花心上歇一歇 |
| d | `ribbon` | 32–43 s | They gather into one rising spiral — a ribbon — that drifts toward the low sun; the camera cranes up and widens; the sky turns from gold to rose. | 然后一起飞起来，像一条丝带，飘向晚霞 |
| e | `title` | 43–50 s | Wide shot of the island under the sunset clouds, the ribbon high above. Title fades in from 43.5 s: **第一关 · 完成** / **暮色浮岛**. At 50 s the clock holds and 轻触继续 appears. | (none) |

## Look (all a function of `t`)

- **Sky**: a cutscene-owned dome (the game's sky is hidden while staged): washed gradient with
  pigment blooms, a low sun that sinks the whole time (never night), and cumulus towers heaped along
  the horizon — billowed hard edges, sunlit rim, cool belly, three flat poster tones. Palette blends
  `gold` (blue afternoon, white clouds) → `rose` (sunset) over 16–44 s (`frame(t).sky`).
- **Wind**: one travelling-wave field (`windAt`, mirrored in GLSL) bends ~2 600 instanced grass
  blades (1 700 on mobile) and ~200 wildflower heads; crests are lighter, so gusts read as waves.
  The eight visited blossoms sway with the same field.
- **Light**: island Lambert materials are swapped for `MeshToonMaterial` + a 4-step ramp while
  staged; the game's hemisphere / key lights and fog are tinted warm, then rose; all handed back on
  close. `night` stays low (0.36–0.58): this is sunset, not night.
- **Paper**: procedural paper grain (`multiply`) and a bleached edge (`soft-light`) over the canvas,
  only while the cutscene is open.
- **Camera**: nine slow keys, smoothstep-eased: far and wide → down to the net → across the flowers
  → crane up and wide for the title. It overrides the gameplay orbit per frame only; the game's own
  camera state (orbit, zoom) is never written, so pinch / wheel / button zoom work as before on close.
- `prefers-reduced-motion`: same story, smaller movement (`soft = 0.3`).

## Controls and flow

- **跳过** (top right, ≥ 44 px): jumps to the end card (`skip()`); it never continues by itself.
- **轻触继续**: only from the end card, and not within 600 ms of reaching it (so the skipping tap
  cannot also continue). It closes the cutscene and calls `onContinue` exactly once.
- Taps during the film are swallowed by the cutscene layer; the catchable butterflies are hidden,
  frozen (`ButterflyCatch.update` returns early while `staged()`) and not catchable (`endingUp`).
- The cutscene never reads or writes a save. In game, `startEnding()` (30th point of 心动) has already
  written `ended: true` before it starts, exactly as before; `onContinue` reveals the existing
  `#bfEnding` card (继续散步 / 再来一程 / 第二关：抓小猫), which behaves as before.

## Queries

- `?l1cutscene=0`: in-game hook off; the old 5.2 s timer shows the card.
- `?cutscene=l1`: standalone preview on the start screen (first tap starts it; with `&mute=1` it
  starts at once, for headless capture). Gate line, unique in the built page, for pack scripts:
  `if (query('cutscene') !== 'l1') return;` (the level-2 gate `if (query('cutscene') !== '1') return;`
  is unchanged, and `?cutscene=1` still starts only the level-2 preview).
- `?csclock=1`: small timeline clock, as in level 2.

## API (`window.__l1Cutscene`)

Same shape as `__l2Cutscene`: `enabled() / setEnabled(v)`, `play({source, onContinue, muted, from})`,
`skip()`, `seek(t)`, `pause() / resume()`, `close()`, `proceed(force)`, `time()`, `duration()`,
`state()` (`idle → playing ⇄ paused → ended → closed`), `playing()`, `finished()`, `ready()`,
`staged()`, `stage()`, `beat()`, `beats()`, `frame(t)`, `text()`, `layout()`, `muted()`, `scored()`.

## Tests

- `tests/l1-cutscene.cjs`: pure model (duration, contiguous beats, `frame(t)` determinism and
  continuity, story marks, state machine on a fake clock, no storage access, distinct preview gate).
- `tests/l1-cutscene-browser.cjs`: built page at 390×844: real clear path → cutscene → skip →
  continue → card exactly once → level 2; `?l1cutscene=0` reference run; preview; zoom after close;
  no console errors.

Open-source references compared (ideas only; no code or assets copied, no dependency added):
`Steve245270533/three-stylized` and `James-Smyth/three-grass-demo` (instanced blades bent in the
vertex shader by a scrolling wave — the approach used, shared in spirit with the level-2 cutscene),
`leoawen/fluffytree-threejs` (anime foliage + wind), `ossianravn/pigment-drift-generator` (noise-driven
watercolour pigment washes — the idea behind the sky wash), `smrghsh/butterfly` (many simple
two-quad butterflies with a flap angle — the placeholder actors). Alternatives rejected: a
full-screen post-process watercolour pass (Kuwahara filter: too heavy for a low-end phone GPU and it
would need a render target the game does not have) and volumetric ray-marched clouds (same cost
problem); a single analytic sky-dome shader with 4-octave value noise costs one cheap pass.
