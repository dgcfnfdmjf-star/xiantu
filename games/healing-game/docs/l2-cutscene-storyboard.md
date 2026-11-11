# 第二关通关过场 · Level-2 clear cutscene storyboard

Status: **scenes animated** (item 2). The 60 s clock drives a cinematic in the live three.js
island: camera rig, display-only kitten cast (Blender coats when loaded, code-built otherwise,
one 星光猫 always), bush rustle, lanterns, extra stars, cat teaser, three butterflies, hearts,
z's, the 图鉴 panel and the end title. Music is still silent. In-game hook still behind the flag.

- Module: `src/l2-cutscene.js` (ES5, no dependencies, no save access) → `window.__l2Cutscene`
- Build hook: `scripts/l2-cutscene-v96.py`, run by `scripts/build.py` after the V9.5 HTML is frozen
- Total length: **60 s** (`duration()`; allowed range 55–65 s). Beats are contiguous.

## Beat sheet

| # | id | Clock | Len | Picture | Camera | Sound (planned) |
|---|----|-------|-----|---------|--------|-----------------|
| 1 | `settle` | 0–8 s | 8 | The island quiets. Letterbox bars slide in (0–2.5 s), dusk deepens, lanterns light one by one, first stars. HUD fades. | Slow pull back and up from the gameplay angle to a wide three-quarter view of the whole island; ~10° orbit. | Felt piano alone, 2 sparse phrases; hall reverb tail. |
| 2 | `gather` | 8–22 s | 14 | Bushes rustle; kittens of the caught colours step out one at a time and trot toward the pile point (-0.6, 1.4). The 星光猫 arrives last (~17 s) with a soft halo and sparkle trail. | Low dolly along the flower row following the first cat, then a rack to the glowing cat's entrance. | Harp arpeggio enters at 8 s; a single quiet meow per entrance (existing `meow()`), strings swell at the rare cat. |
| 3 | `play` | 22–38 s | 16 | The cat teaser sweeps a slow figure-eight above the pile; cats bat at it, two tumble. Three chapter-1 butterflies drift through and one lands on a cat's nose (~33 s). Hearts pop. | Slow 40° orbit around the pile at cat height; brief push-in on the nose landing. | Full texture: piano + harp + strings, choir pad underneath; the lightest moment. |
| 4 | `codex` | 38–50 s | 12 | The 图鉴 opens as a translucent book over the lower third; its cat cards light up left to right (caught kinds only, rare card last with a gold edge) while behind it the cats circle once and curl up. Book closes at 49 s. | Camera settles and rises slightly; the book is screen-space UI, the scene stays in soft focus behind it. | Choir pad and strings hold; harp marks each card; texture thins. |
| 5 | `sleep` | 50–60 s | 10 | Sleep pile under lanterns and stars; slow "z" particles and breathing. Title 「第二关 · 完成」 fades in 52–55 s with 「暮色浮岛」 beneath. At 60 s the clock holds and 「轻触继续」 appears. | Very slow crane up and tilt to the sky, pile kept in the lower third. | Final piano phrase, choir fade, purr (`purr()`), resolve on the last second. |

Sum: 8 + 14 + 16 + 12 + 10 = **60 s**. Later items may move a boundary by a second or two but
must keep the total inside 55–65 s and update `BEATS` in `src/l2-cutscene.js` in the same change
(`tests/l2-cutscene.cjs` checks contiguity and the total).

Screenshot checkpoints used by tests: 5 s (settle), 20 s (gather, rare cat on screen),
40 s (codex open), 58 s (title fully visible, continue not yet shown).

## Assets to reuse (nothing new is downloaded)

| Need | Existing source |
|------|-----------------|
| Cats | Blender GLBs through `window.GardenCatModels` (`attach`, `pose`, `setLevel`) for orange / calico / black / tabby; 小雪团 and 星光猫 keep the original code-built model, exactly as in play. Kinds shown come from `S.caught`, so the cast matches the player's own book. |
| Rare glow | The 星光猫 material/halo and `H.emitSpark`, `H.glowTex`. |
| Gather | The existing `startEnding` walk: `setTarget` toward `pile` (-0.6, 1.4), `state = 'gather'`, then `sleep`. Beat 2 stretches it from 7 s to 14 s and staggers the entrances; it is not replaced. |
| Flowers / bushes | `H.flowers` and the level-2 bush group (`group`), unchanged. |
| Butterflies | Chapter-1 butterfly meshes and wing flap from `butterflies.js` (three display-only instances, not catchable, not counted). |
| Teaser / yarn | Level-2 lure prop (`dropYarn` / yarn mesh) animated on a scripted path. |
| Lanterns, stars, dusk | `H.setNightTarget(0.8 → 1)`, the lantern meshes and star field of the base island. |
| Particles | `emitPart` with `texHeart` and `texZ`. |
| 图鉴 | `renderCodex()` icons (`icons[kind.id]`) drawn into a cutscene-owned book panel; the real `#bfCodex` overlay is not opened. |
| UI look | `.glass`, `.btn`, page font stack; jade-tinted glass for skip / continue. |
| Music | `src/music-lush.js` instruments (felt piano, Karplus–Strong harp, PADsynth choir/pad, strings, 4.2 s hall send) on `GardenAudio.context()`. A dedicated one-shot 60 s score in the `cozy` key, original and procedural; no samples, no MP3. `seek(t)` restarts the score scheduler at bar granularity; `?mute=1` skips audio entirely. |

## UX

- **Skip** 「跳过」: top-right, inside the safe area, 64×44 px minimum, jade glass. Visible for the
  whole cutscene, hidden on the end card. `skip()` jumps to 60 s: title fully shown plus
  「轻触继续」. Skip never dismisses the end card.
- **End card**: 「第二关 · 完成」 / 「暮色浮岛」 / 「轻触继续」. A tap anywhere (or the button) continues.
  Taps in the first 600 ms after the end card appears are ignored, so the tap that skipped cannot
  also continue.
- **After continue**: the cutscene closes and the existing `#kitEnding` card opens with its two
  unchanged buttons, 继续 · 陪它们玩 (`closeEnding(false)`) and 重新抱 20 只 (`closeEnding(true)`).
  Save and reset behaviour stay entirely in `closeEnding`.
- While the cutscene is up it is an input shield: the island keeps rendering underneath but
  cannot be tapped. The veil tints the scene rather than covering it.
- Layout: portrait 390×844 primary; 844×390 uses smaller type and tighter spacing (media query).

## Hook into the current flow

Existing (unchanged): the 20th point sets `S.ended = true`, `endingUp = true`, saves, and calls
`startEnding()` 1.4 s later. `startEnding` tops the cast up to 7–9 cats, sends them to the pile
with `timer = 7`, sets night to 0.8, plays `GardenAudio.ending()`, and showed `#kitEnding` at 7 s.

Changed by `scripts/l2-cutscene-v96.py` (working site only):

```js
var showCard = function () { $('kitEnding').classList.remove('hidden'); };
if (window.__l2Cutscene && window.__l2Cutscene.enabled()) window.__l2Cutscene.play({ source: 'level2', onContinue: showCard });
else setTimeout(showCard, 7000);
```

`closeEnding` also calls `__l2Cutscene.close()` first, so the card's buttons can never leave a
cutscene behind. The save is already written before the cutscene starts, so closing the tab
mid-cutscene loses nothing; on reload `S.ended` is true and the cutscene does not replay.

**Feature flag.** During the scaffold the in-game path is off unless the URL has `?l2cutscene=1`
(or a test calls `__l2Cutscene.setEnabled(true)`); the flag is session-only and never saved.
Default players and the existing browser tests still get the 7 s card. Flip the default once the
real visuals and score land.

## API (`window.__l2Cutscene`)

`play(opts)`, `skip()`, `seek(tSeconds)`, `time()`, `duration()`, `playing()`, `finished()`,
`ready()`; extras: `pause()`, `resume()`, `close()`, `proceed()`, `state()`, `beat()`, `beats()`,
`frame(t)`, `text()`, `muted()`, `enabled()`, `setEnabled(v)`.

- The clock is `performance.now()` based; every visual is computed from the timeline second by
  `frame(t)`, so `seek(t)` reproduces a frame exactly. For still screenshots call `pause()` then
  `seek(t)`; seeking a closed cutscene shows a paused still frame.
- `finished()` turns true when the end card is reached (naturally or by skip) and stays true
  until the next `play()`.
- Preview: `?cutscene=1` starts on the first gesture; `?cutscene=1&mute=1` starts immediately.

## How item 2 is built

- **Pure model** (`frame(t)`): camera keys, every cat's position / yaw / curl / state, teaser,
  butterflies, lanterns, book and card light are numbers computed from `t` only. No tweens exist,
  so `seek()` cannot leave anything behind; `tests/l2-cutscene.cjs` checks the 5 / 20 / 40 / 58 s
  marks and speed/camera continuity on this model.
- **Stage**: chained onto `GardenPlay.init/update`. On entry it hides the gameplay kittens and the
  catchable butterflies, shows the level-2 bushes, hides all game UI (`body.l2cs-on`), and poses
  its own actors built with the game's `buildKitten` (through `window.__l2Stage`, added by the
  build hook). `GardenCatModels.attachStage` + `pose` give the four Blender coats. While staged,
  kittens.js skips its own kitten update. On close everything is restored; the game recomputes
  its camera every frame, so the camera needs no restore.
- **Cast**: six kittens in the coats the player has hugged (all five on an empty preview save)
  plus one 星光猫 that always visits. Book cards light only for kinds really hugged.
- **Pile point**: (-0.2, 1.1), half a metre from the gameplay pile, so the front bush never
  covers the ring; pile azimuth stays in 0.9–1.5 rad for the same reason.
- **Reduced motion** (`prefers-reduced-motion`): duration and story unchanged; hops, wander, bush
  rustle and teaser bob run at 30 % amplitude, tumbles are removed, the continue pulse stops.
- Dusk uses the game's `setNightTarget` (0.45 → 0.75 → 0.9), which eases over a few seconds, so
  a still taken right after a seek shows the sky slightly behind; everything else is exact.
- `?csclock=1` shows the debug clock chip. `__l2Cutscene.stage()` reports stage state for tests.

## Approach comparison

Timeline libraries looked at on GitHub: anime.js (MIT; `timeline().seek()`), tween.js (MIT;
tween groups driven by an external time), Theatre.js (Apache-2.0; keyframed sheets with a
sequence position), GSAP (own licence; `timeline.seek()`). All share the idea adopted here: state
is a function of one playhead, and seeking is setting that playhead. None is bundled: the game is
a single ES5 inline HTML with no CDN, its scene runs on the existing three r128 loop, and one
linear 60 s sequence needs only ramps and easing. Theatre.js's studio and GSAP's licence add
weight without a matching need.

## Next items

3. The 60 s lush score and seek-aware scheduling; duck `GardenAudio.ending()`.
4. Flip the feature flag on by default; update the two browser tests that wait for `#kitEnding` within 20 s.
