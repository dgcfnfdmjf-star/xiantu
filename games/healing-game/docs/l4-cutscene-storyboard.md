# Level-4 clear cutscene — storyboard (晨风铃谷 · the morning wind carries the song home)

Original homage to hand-painted, watercolour animated films (no existing characters, frames or backgrounds are
copied). ~50 s. It plays automatically on the last correct note of the third melody and **replaces** the old 3.2 s
通关演出 (finale timer, `#chimeSkip`, toast) — it is not stacked after it. The existing `#chimeEnding` card
(`CHAPTER 04 · COMPLETE / 风把早安送到了`) then shows exactly once, as before.

Module: `src/l4-cutscene.js` → `window.__l4Cutscene` (same API shape as `__l3Cutscene` / `__l1Cutscene`:
`enabled/ready/play({source,onContinue})/close/playing/state/time/finished/pause/resume/seek/skip/proceed/stage/
scored/frame/beats/busy/staged/…`, plus `layout()`, `chime(i,t)`, `note(j,t)`, `petal(j,t)`, `probe()`).
Build hook: `scripts/l4-cutscene-v96.py` (exec'd from `build.py` after `l3-cutscene-v96.py`, i.e. after the V9.5
release HTML is frozen). Tests: `tests/l4-cutscene.cjs`, `tests/l4-cutscene-browser.cjs`.

## Beats (seconds on the film clock; contiguous; every visual is a pure function of `t`)

| # | id | t | Picture | Caption (17px, one line at 360px) |
|---|----|---|---------|-----------------------------------|
| a | `predawn` | 0–10 | Wide establishing shot. Cool blue-grey sky with a rose band on the horizon, the sun's first rim in the cloud sea, heaped dawn clouds, wind waves crossing the tall grass and wildflowers. | 天还没亮，风先醒了 |
| b | `chimes` | 10–21 | Slow glide down to the valley. The edge of first sunlight crosses the grass far side → near side (9–20.5 s); the six chimes wake one after another (first strikes from 11.2 s, 1.5 s apart) and glow in their tone colours. | 晨光漫过山谷，风铃一枚枚醒来 |
| c | `notes` | 21–32 | Crane up after the notes: each lifts from its chime in the chime's colour and rides the wind downwind (right and towards the lens, away from the sun); petals lift from the flowers and tumble with them. Chimes keep ringing on a slow round (from 21.6 s, 4.8 s per round). | 音符和花瓣，乘上了晨风 |
| d | `send` | 32–43.5 | Drift downwind. The wind carries further (`reachAt`), notes and petals go out over the sea of clouds; the sky is fully peach-gold and warm light fills the island. | 风把早安，送过了云海 |
| e | `title` | 43.5–50 | Wide sunrise. Title `第四关 · 完成` / `暮色浮岛` fades in; at 50 s `轻触继续` (`#l4csGo`) appears. | — |

Skip (`跳过`, `#l4csSkip`) jumps to the end card; the tap that skipped cannot also continue (600 ms guard).

## Look

- **Sky** (one shader on a camera-centred dome): washed gradient mixed cool → warm (`skyAt(t)`: blue-grey-rose before
  dawn, peach-gold at sunrise), a warm first-light band low on the sun's side, a **gold core / peach edge sun with a
  wide halo** (mixed into the sky, never added up to white; `sunAt(t)` rises slowly and stays low), three-tone dawn
  cumulus with warm rims (kept low under the sun so the disc is clear), and below the horizon the **cloud sea**
  (drifting billows on a far plane, lit tops, rose troughs, a path of sunlight along the sun's bearing).
- **Wind**: `windAt(x,z,t)` — a primary wave along the wind direction, a slower cross wave ×1.7 frequency and a fine
  ripple under a slow gust envelope. The grass shader evaluates the same formula in GLSL, so blades, flower heads and
  the chime swing all lean with one visible travelling wave. Two instanced meshes (blades, flower heads): 2 draw calls.
- **Light**: the island is repainted with flat toon materials for the film (put back on close); key/hemisphere light
  and fog follow the palette; grass turns gold where `frontAt(t)` (the sunlight edge) has passed.
- **Paper**: speckle in the sky shader plus a tiled procedural paper texture and a warm uneven edge as DOM blend
  layers. Letterbox bars, caption, title and buttons are DOM (sharp at any pixel ratio; renderer capped at 1.5).
- **Camera**: one cubic-Hermite path through nine keys (C1 — no stop or jump between beats); framing is by half-width
  `w`, so the island fills the same share of a portrait or landscape frame.

## Actors (display-only; nothing reads or writes a save)

- **Six wind chimes**: copies of the game's (stone foot, post, bar, swinging shell, bead, paper tail) at the game's six
  positions in the six tone colours (芽响 / 露铃 / 晨羽 / 晴风 / 云歌 / 归音), ×1.3 and without number labels so they
  read in the wide shots; each has a tone-coloured glow driven by its closed-form strike pulse.
- **Notes (18) and petals (42)** — *placeholders in item 1* (item 2 gives them their proper motion): sprites on
  closed-form paths in `t`, held at a readable minimum on-screen size, and slid round the sun's rim by `keepOffSun()`
  so none crosses the disc (`probe().sunClear` > `sunDisc` is asserted in the browser test).
- The gameplay chime group (bells, number labels, gates, halo), the game's sky dome, star points, sun/moon sprites,
  islets and cloud puffs are hidden while staged and restored on close/skip.

## Trigger and switches

- Hook (added lines only, each naming `__l4Cutscene`): in `chime-chapter.js` `play()`, after `J.complete(4)` +
  `J.changed()` have written the save, `if (!reduced && __l4Cutscene.enabled()) { play({source:'level4',
  onContinue: showEnding}); return; }` sits in front of the old `finale = 3.2` branch.
- `prefers-reduced-motion`: unchanged — the card opens at once, no film, `#chimeSkip` hidden.
- `?l4cutscene=0`: the old 3.2 s finale + `#chimeSkip` + card, unchanged.
- While open the film counts as an open dialog (`journey.js blocked()` asks `__l4Cutscene.busy()`) and the chapter
  updates return early while `staged()`: no chime taps, melody preview, journal or level switch underneath.
- **Preview gate**: `if (query('cutscene') !== 'l4') return;` appears exactly once in the built `index.html`.
  `?cutscene=l4` plays the film on the first gesture; `?cutscene=l4&mute=1` at once (headless capture). A pack script
  can replace that one line to make a one-tap `preview.html`.

## Later items

- Item 2: proper motion for chimes, notes and petals. Item 3: the score (`src/l4-cutscene-music.js`,
  `window.__l4Score`; piano + warm strings + the level-3 `celesta()` voice). `scored()` is false until then.
