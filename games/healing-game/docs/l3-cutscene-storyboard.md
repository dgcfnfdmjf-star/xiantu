# Level-3 clear cutscene — storyboard (星灯夜航 · the lamps' light sails home)

Original homage to hand-painted, watercolour animated films (no existing characters, frames or backgrounds are
copied). ~50 s, plays automatically when the third star lamp is lit and the beam finale ends, **before** the existing
`#starEnding` card (`CHAPTER 03 · COMPLETE / 为晚归的人留一盏灯`), which then shows exactly once as before.

Module: `src/l3-cutscene.js` → `window.__l3Cutscene` (same API shape as `__l1Cutscene`: `enabled/ready/play({source,
onContinue})/close/playing/state/time/finished/pause/resume/seek/skip/proceed/stage/scored/frame/beats/…`, plus
`busy()` and `castFor()`). Build hook: `scripts/l3-cutscene-v96.py` (exec'd from `build.py` after the V9.5 release
HTML is frozen). Tests: `tests/l3-cutscene.cjs`, `tests/l3-cutscene-browser.cjs`.

## Beats (seconds on the film clock; contiguous; every visual is a pure function of `t`)

| # | id | t | Picture | Caption (17px, one line at 360px) |
|---|----|---|---------|-----------------------------------|
| a | `dusk` | 0–10 | Wide establishing shot. Blue-violet dusk with a rose afterglow on the horizon, cream-gold moon low in front, silver-rimmed cumulus, the sea of clouds drifting below the island, wind waves running through grass and flowers. Letterbox bars close in. | 暮色落下来，风吹过草尖和花 |
| b | `lamps` | 10–20 | Slow glide down to the three pedestals. Night deepens, stars come out; the lamps warm up one after another (10.6 s, 13.3 s, 16.0 s), each with a halo and a warm pool on the grass. | 三盏星灯，一盏一盏暖了起来 |
| c | `fireflies` | 20–31 | The 星萤 the player caught (their real colours, in proportion to the counts; all six on an empty/preview save) leave the lamps one by one, spiral up and settle among the stars. Camera cranes up after them. | 你接住的星萤，飞回了星星里 |
| d | `boat` | 31–43.5 | The paper boat slips off the front of the island, rounds its right side and sails out over the cloud sea towards the moon, lit from inside, leaving a soft glowing wake. | 纸船载着灯火，送晚归的人回家 |
| e | `title` | 43.5–50 | Wide night sky. Title `第三关 · 完成` / `暮色浮岛` fades in from 44 s; at 50 s `轻触继续` (`#l3csGo`) appears. | — |

Skip (`跳过`, `#l3csSkip`) jumps to the end card; the tap that skipped cannot also continue (600 ms guard).

## Look

- **Sky** (one shader on a camera-centred dome): washed gradient mixed dusk→night (`skyAt(t)`), hashed twinkling stars
  (`sky.stars`), a cream-gold moon disc with faint seas and a wide warm halo (`moonAt(t)`), three-tone cumulus with a
  silver rim (kept low under the moon), and below the horizon the **cloud sea** (drifting billows on a far plane, with a
  path of moonlight along the moon's bearing). Paper speckle in the shader plus a tiled paper texture and a deepened
  edge as DOM blend layers.
- **Island**: Lambert materials swapped for a 4-step toon ramp while staged; hemisphere/key light and fog follow the
  dusk→night palette. Instanced grass and flower heads bend with `windAt(x,z,t)` (same formula in GLSL), silver on
  the wave crests, warm near each lit lamp.
- **Camera**: one C1 Hermite path through nine keys (wide → lamps → crane up → follow the boat → wide), no cuts.
- **Item 1 placeholders** (item 2 gives them their proper motion): fireflies are one additive `Points` cloud on a
  closed-form spiral; lamps are display-only copies of the pedestals; the boat is a small folded-paper mesh on a quadratic
  path with ten wake sprites. Music (item 3) will be `src/l3-cutscene-music.js` → `window.__l3Score` (`start/sync/settle/stop`).

## Hook, switches, preview

- Level-3 clear today: `journey.js light(index)` spends 4 星光, sets `S.lamps[index]`, `complete(3)`, **`save()`**, then
  `L3.startFinale(index, showEnding)` (`level3plus.js`: 6.5 s of beams, `跳过演出` button, instant under reduced motion)
  → `showEnding()` → `setModal('starEnding', true)`. `voyage.js` starts the boat's finale loop from `onLamp`.
  `chime-chapter.js` appends the next-chapter button to the card.
- The hook wraps `showEnding` (added lines only): cutscene first, `onContinue` = the original `showEnding`. The save is
  already written before the finale, so the cutscene changes nothing about saves; the card and its three buttons are untouched.
- While open: `GardenJourney.blocked()` is true (`busy()`), `journey.js update` stops before wisps / level3fx / voyage /
  beams (`staged()`), and the stage hides the gameplay world group, beams, effects, boat, game sky/stars/moon. All restored on close.
- `?l3cutscene=0` — cutscene off, old behaviour (card straight after the finale).
- `?cutscene=l3` — standalone preview: plays on the first gesture (`&mute=1`: at once, silent). The gate is the single
  line `if (query('cutscene') !== 'l3') return;` (exactly once in the built `index.html`); a pack script can replace it
  to make a one-tap `preview.html`. `&csclock=1` shows the film clock.
- The module never reads or writes a save; the cast colours come from an in-memory copy (`__l3Stage.caught()`).
