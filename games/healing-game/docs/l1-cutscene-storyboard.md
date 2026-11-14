# 第一关通关过场 · Level-1 clear cutscene storyboard

Status: **item 4: polish pass** (after item 3: the score). Timeline, camera, sky, clouds, grass wind, light, paper, captions,
skip / continue and the build hook came with item 1; item 2 replaced the placeholder butterflies with
the game's own butterflies on deterministic flight paths (see "Butterflies" below) and gave the net a
shape; item 3 added the score (see "Score" below).

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
| b | `release` | 9–19 s | Glide down to the front of the island. The net lies open in the grass (`NET`) under a warm glow, and the 18 butterflies corkscrew out of it one by one (0.42 s apart), in the species the player caught. | 你轻轻打开网，三十份心动回到风里 |
| c | `dance` | 19–32 s | Slow drift across the flowers. The flock swirls over the meadow; in three waves each butterfly peels off to its own blossom, settles on the swaying flower head (wings slowly opening and closing), then lifts off again. | 它们绕着花丛打转，在花心上歇一歇 |
| d | `ribbon` | 32–43 s | They fall into one line that circles low and then peels upward from the front: a three-lane ribbon from the meadow to the clouds, shedding soft pale trails, drifting toward the low sun; the camera cranes up and widens; the sky turns from gold to rose. | 然后一起飞起来，像一条丝带，飘向晚霞 |
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
- **Camera**: nine slow keys joined by a cubic Hermite spline (C1: one continuous move that never stops
  at a key; a channel pauses only where it reverses): far and wide → down to the net → across the flowers
  → crane up and wide for the title. It overrides the gameplay orbit per frame only; the game's own
  camera state (orbit, zoom) is never written, so pinch / wheel zoom work as before on close (the game has no zoom buttons).
- **Item-4 polish**: captions 17 px on a soft dusk wash, heavier title; the sun is a warm soft-edged disc
  with a halo; cloud edges vary between wet-soft and crisp, tone steps are softened; the game's orbiting
  mini-islets and low-poly cloud puffs are hidden while staged (they crossed the lens at random) and
  restored on close.
- `prefers-reduced-motion`: same story, smaller movement (`soft = 0.3`).

## Butterflies (all a function of `t`)

- **Look**: display-only copies of the level-1 butterflies: the same wing textures/materials, wing, body
  and head meshes, handed over read-only by `window.__bf.look(species)` (one line added by
  `l1-cutscene-v96.py`; flat species-coloured wings if the hook is missing). Species = the ones in the
  player's `caught` record (read through `__bf.state()`, never written); every species on an empty
  preview save. Rare species keep their additive sheen. 18 butterflies (`layout().count`), 4 draw calls each.
- **Flight** (`flyPos(j, t)`, closed form, no integration, no allocation): a loose flock — everyone
  circles a shared wandering centre on its own orbit (cohesion + common swirl, boids-like but solved
  instead of simulated) with a small divergence-free flutter on top and a body bob on every wing beat.
  Out of the net on a widening corkscrew; towards its blossom ~2.5 s before landing; `perchAt` pins it
  to the flower head (`headAt`, which leans with the wind); `riseAt` blends it onto the ribbon curve.
  Height never goes below `layout().floor` (0.5 m above the grass).
- **Wings** (`beatAtJ`): bursts of fast beats (11–14 rad/s) broken every 2.4–4.2 s by a 0.3–0.6 s glide
  with the wings held in a shallow V; the phase is piecewise linear in `t`, so it needs no state. At
  rest the wings open and close slowly (≈4 s period). Heading and pitch follow the path's derivative.
- **Trails**: one `Points` cloud (18 × 8 points): five soft dabs along the path just flown plus three
  slow-falling flecks per butterfly, sampled from `flyPos` at earlier times, so they seek too. Pale
  species-tinted cream with normal blending (white gouache, not additive neon); faint in the dance,
  full in the ribbon, off while perched.
- `frame(t).flies[j]` = `fly(j, t)`: `x y z alpha yaw pitch perch rise flower wing flap glide scale trail`;
  `frame(t).flowers[i]` = the flower heads. `stage().cast3` lists the posed mesh positions.

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

## Score

`src/l1-cutscene-music.js` → `window.__l1Score`, 「蝶归晚风」: an original D-major waltz, 3/4, one bar = 2 s,
25 bars = 50 s. No samples, no quoted melody.

| Bars | Time | Picture | Music |
|---|---|---|---|
| 1–5 | 0–10 s | meadow | harp ripples over a slow string swell, a few single piano notes |
| 6–10 | 10–20 s | release | the tune on solo felt piano over an oom-pah-pah left hand (IV–V–iii–vi); strings from bar 8 |
| 11–16 | 20–32 s | dance | home key, harp eighths, flute holding a line below; six harp glints on the first landings |
| 17–22 | 32–44 s | ribbon | the tune returns with the harp an octave above, fullest strings, top note at 40 s, then the dominant |
| 23–25 | 44–50 s | title | cadence on D as the title fades in, harp roll, last low chord at about half level |

Voices are the game's own (music-lush `felt`, `harp`, `padTone('warm')`, music2 `flute`) through a track
registered on GardenAudio, the same way as the level-2 score (separate file, so that one stays
byte-identical). So the music switch, the volume slider and the bus/reverb apply unchanged. `start()`
remembers the level's track and crossfades to the waltz (1.2 s); `stop()` (continue, close, the card's
own close) crossfades back (3 s) unless the player picked another track meanwhile. Each step is placed
on the cutscene clock: `seek()` or a stalled tab re-anchors with a short fade of what was ringing, a
paused film is silent, `skip()` fades and plays only the three closing bars. A muted run (`&mute=1`)
never touches the score; with the player's music switch off nothing sounds and the switch is left off.

## Tests

- `tests/l1-cutscene-music.cjs`: the score on a fake engine: length and sync marks against `beats()`,
  dynamic arc, cadence, voice budget compared with the level-2 score, start / seek / stall / pause /
  skip / stop with the level track handed back, cutscene wiring, no storage access.

- `tests/l1-cutscene.cjs`: pure model (duration, contiguous beats, `frame(t)` determinism and
  continuity, butterfly determinism, wing rhythm, one butterfly per blossom, floor height, ribbon shape, story marks, state machine on a fake clock, no storage access, distinct preview gate).
- `tests/l1-cutscene-browser.cjs`: built page at 390×844: real clear path → cutscene → skip →
  continue → card exactly once → level 2; `?l1cutscene=0` reference run; preview; zoom after close;
  no console errors.

Open-source references compared (ideas only; no code or assets copied, no dependency added):
`Steve245270533/three-stylized` and `James-Smyth/three-grass-demo` (instanced blades bent in the
vertex shader by a scrolling wave — the approach used, shared in spirit with the level-2 cutscene),
`leoawen/fluffytree-threejs` (anime foliage + wind), `ossianravn/pigment-drift-generator` (noise-driven
watercolour pigment washes — the idea behind the sky wash), `smrghsh/butterfly` (many simple
two-quad butterflies with a flap angle — the item-1 placeholders). For the butterfly motion: three.js
`webgl_gpgpu_birds` and `vibe-motion/threejs-boids` (velocity-integrated boids),
`juniorxsound/Particle-Curl-Noise` and `SahilK-027/glsl-curl-noise` (FBO / shader curl-noise advection).
All of these integrate state frame by frame, so a seek could not reproduce a frame; the cutscene keeps
their ingredients (cohesion around a moving centre, a shared swirl, divergence-free flutter) but in
closed form. Alternatives rejected: a
full-screen post-process watercolour pass (Kuwahara filter: too heavy for a low-end phone GPU and it
would need a render target the game does not have) and volumetric ray-marched clouds (same cost
problem); a single analytic sky-dome shader with 4-octave value noise costs one cheap pass. For the
score's timing: `cwilso/metronome` (lookahead scheduling on the audio clock — what the game's engine
already does), `sebpiq/WAAClock` and Tone.js `Transport` (a seekable transport with its own clock),
`generativefm/generators` (sample-based generative pieces). A second transport or a library would
duplicate the engine's clock and add weight, and samples would add download size, so the score stays a
registered track whose steps are re-anchored to the cutscene clock.
