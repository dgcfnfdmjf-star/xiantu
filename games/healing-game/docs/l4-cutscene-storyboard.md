# Level-4 clear cutscene — storyboard (晨风铃谷 · the morning wind carries the song home)

Original homage to hand-painted, watercolour animated films (no existing characters, frames or backgrounds are
copied). ~50 s. It plays automatically on the last correct note of the third melody and **replaces** the old 3.2 s
通关演出 (finale timer, `#chimeSkip`, toast) — it is not stacked after it. The existing `#chimeEnding` card
(`CHAPTER 04 · COMPLETE / 风把早安送到了`) then shows exactly once, as before.

Module: `src/l4-cutscene.js` → `window.__l4Cutscene` (same API shape as `__l3Cutscene` / `__l1Cutscene`:
`enabled/ready/play({source,onContinue})/close/playing/state/time/finished/pause/resume/seek/skip/proceed/stage/
scored/frame/beats/busy/staged/…`, plus `layout()` (incl. the strike table), `chime(i,t)`, `note(j,t)`, `petal(j,t)`, `probe()`).
Build hook: `scripts/l4-cutscene-v96.py` (exec'd from `build.py` after `l3-cutscene-v96.py`, i.e. after the V9.5
release HTML is frozen). Tests: `tests/l4-cutscene.cjs`, `tests/l4-cutscene-browser.cjs`.

## Beats (seconds on the film clock; contiguous; every visual is a pure function of `t`)

| # | id | t | Picture | Caption (17px, one line at 360px) |
|---|----|---|---------|-----------------------------------|
| a | `predawn` | 0–10 | Wide establishing shot. Cool blue-grey sky with a rose band on the horizon, the sun's first rim in the cloud sea, heaped dawn clouds, wind waves crossing the tall grass and wildflowers. | 天还没亮，风先醒了 |
| b | `chimes` | 10–21 | Slow glide down to the valley. The edge of first sunlight crosses the grass far side → near side (9–20.5 s); the six chimes wake one after another (first strikes 11.7 s → 20.7 s, two beats = 1.8 s apart): each swings, glows in its tone colour, throws a ring of light and sends up its first note and petal. | 晨光漫过山谷，风铃一枚枚醒来 |
| c | `notes` | 21–32 | Crane up after the notes: each lifts from its chime in the chime's colour and rides the wind downwind (right and towards the lens, away from the sun); petals lift from the flowers and tumble with them. The chimes play the level's last song 把早安送回家 `[0, 3, 2, 5]` (21.6 s), answered by all six together (26.1 s); the phrase starts again at 29.7 s. | 音符和花瓣，乘上了晨风 |
| d | `send` | 32–43.5 | Drift downwind. The wind carries further (`reachAt`), notes and petals go out past the island's edge over the sea of clouds; all six ring (34.2 s), the song a third time (37.8 s), all six (42.3 s); the sky is fully peach-gold. | 风把早安，送过了云海 |
| e | `title` | 43.5–50 | Wide sunrise. Title `第四关 · 完成` / `暮色浮岛` fades in while all six ring once more, softly (45.9 s); at 50 s `轻触继续` (`#l4csGo`) appears. | — |

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

- **Six wind chimes**: display-only copies built exactly like `chime-chapter.js` builds the game's (stone foot, wooden
  post and bar, cord, swinging shell, bead, paper tail, glow sprite) at the game's six island coordinates in the six
  tone colours (芽响 / 露铃 / 晨羽 / 晴风 / 云歌 / 归音), ×1.3 so they read in the wide shots. The numbered HUD labels
  are left out (it is a film, not the puzzle). Additions for the film: the paper tail hangs on its own pivot, a warm
  additive core and a tone-coloured ring of light per chime.
- **The cue** (`layout().strikes`, a fixed table on a 0.9 s beat grid — item 3's score should land on it):

  | t (s) | chimes | what |
  |-------|--------|------|
  | 11.7, 13.5, 15.3, 17.1, 18.9, 20.7 | 0, 1, 2, 3, 4, 5 | waking: one clear strike each, two beats apart |
  | 21.6, 22.5, 23.4, 24.3 | 0, 3, 2, 5 | 把早安送回家, one beat apart (strength 1) |
  | 26.1 (+0.07 s per chime) | all six | together, a soft roll (strength 0.7) |
  | 29.7, 30.6, 31.5, 32.4 → 34.2 | 0, 3, 2, 5 → all six | the phrase again (9 beats after the first) |
  | 37.8, 38.7, 39.6, 40.5 → 42.3 | 0, 3, 2, 5 → all six | and a third time, out over the cloud sea |
  | 45.9 | all six | under the title, softly (strength 0.6) |

  Pose (`chimeAt`, a sum over the strikes at or before `t`, so `seek` is exact): **swing** = a damped pendulum per
  strike (0.36 rad × strength, 1.16 s period, e-fold 1.2 s) + the wind's lean + a small idle sway; **sway** across the
  bar from the wind; **tail** = the paper tail trailing 0.18 s behind and ringing longer, plus wind flutter;
  **pulse** = strength × e^(−1.3·age) drives the shell's emissive, the tone-coloured halo (painted over the picture so
  it reads on the bright sky), the warm additive core, and the ring that opens ×0.8 → ×4.6 over 1.7 s.
- **Notes (54) + sparks (108)**: every strike sends up its own note (two for a song note) in the chime's colour — an
  eighth note or a beamed pair with a dark brushed outline and a tone-coloured halo. It pops out of the shell, lifts
  2–4 m and rides the wind downwind (right and towards the lens, away from the sun) with a two-sine flutter and a
  surge on each gust, past the island's edge in the fourth beat (`reachAt`), then fades; one life (8.5–10 s) each, at
  most ~20 in the air. Each trails two four-point music-box sparks: the same path 0.3 s and 0.6 s earlier.
- **Petals (72)**: 18 loosen from the meadow on their own (a few on the first wind before dawn), 54 are shaken loose
  round the foot of a chime by each strike. Drift along the wind + two-sine flutter + tumble (spin in the picture
  plane, flip through it — the sprite is squashed by cos(flip)); an oval with a notched tip, two tones.
- Notes, sparks and petals are two `Points` draws; a frame rewrites four small typed arrays and allocates nothing.
  They are held at a readable minimum on-screen size (note 4.5 %, petal 2.3 %, spark ≥ 1.6 % of the frame height), fade
  rather than brush the lens (< 7 m), and are slid round the sun by `keepOffSun()`, whose clear ring is widened by the
  particle's own radius, so not even an edge or halo touches the disc (`probe().sunClear` = nearest *edge* to the
  sun's centre, asserted > 1.2 × `sunDisc` every 0.25 s of the film in the browser test).
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

## Music (item 3)

`src/l4-cutscene-music.js` → `window.__l4Score` (`start/sync/settle/stop/state/score/sparkles/celesta/sparkleVoice`),
「晨铃圆舞曲」: an original waltz in **D major, 3/4**, locked to the film's strike grid — one beat = 0.9 s (≈ 66.7 bpm),
one bar = 2.7 s, six eighth-steps of 0.45 s a bar, 19 bars (the 19th is the held last chord under the end of the film).
Voices: felt piano (tune + left hand) and the warm string pad from music-lush, and the level-3 score's `celesta()`
(`window.__l3Score.celesta`, reused as is; the kit's music box only if that score is missing). **No harp anywhere.**
Registered as a GardenAudio track, so the music switch / volume / reverb apply; the level track 晨风来信 crossfades out
(1.2 s) on `start()` and back in (3 s) on `stop()`, unless the player picked another track meanwhile.

| bars | film time | picture | music |
|---|---|---|---|
| 1–4 | 0–10.8 s | before dawn | low strings hold; the piano tries three notes of the tune and waits |
| 5–8 | 10.8–21.6 s | chimes wake | the tune, solo piano over an oom-pah-pah left hand; strings slip back in at bar 7; one celesta note per waking chime |
| 9–12 | 21.6–32.4 s | notes and petals lift | flowing eighths, tune a sixth higher, strings fuller; celesta plays 把早安送回家 with the chimes |
| 13–16 | 32.4–43.2 s | out over the cloud sea | IV–V–vi, tune doubled at the octave on downbeats, fullest strings, top note A6 at 37.8 s (the chimes' last song), then a suspended dominant |
| 17–19 | 43.2 s → | title | home on D: the first bars of the tune as an echo, a plagal bar, the last soft roll of all six chimes, a held D |

- **Celesta = the picture**: `sparkles()` is exactly `layout().strikes` (42 strikes; the unit test compares time and
  chime): each strike is one celesta note at that chime's own pitch (D5 E5 F#5 A5 B5 D6) an octave up. Single strikes
  fall on beats, each song phrase starts on a downbeat, and where all six ring on a third beat the left hand lifts so
  the roll has the air (this also keeps the voice count at the level of the other scores).
- **Clock**: the track's `play()` follows `__l4Cutscene.time()`; a jump of more than 0.4 s (seek, stalled tab)
  re-anchors with a 0.3 s fade instead of chasing; pause → fade and hold; skip → 1.4 s fade, then only the three
  closing bars; `&mute=1` never starts it; with the music switch off nothing sounds and the switch is left alone.

## Polish (item 4)

- **Sunlit island**: the warm palette's key and hemisphere light were over-driving the toon ramp (0.95 + 0.9), so the
  island top went near-white from ~22 s. Now 0.6 + 0.6 with a deeper gold key and a mossy ground bounce; grass root/tip
  and the wind-crest and sunlight tints are richer greens and ochres, never white.
- **Chimes**: darker wood, shell tone deepened (`offsetHSL(0, 0.14, -0.11)`), a dark brushed outline (inverted hull,
  one shared material), a stronger resting halo from 28 s, and `chimeAt(t).scale` grows ×1.34 between 27 s and 41 s
  (slowly, with the crane up) so all six read in the wide title shot.
- **Sky**: blue enters lower, stronger sun halo, deeper cloud-sea troughs, and low heaped cloud banks either side of
  the sun (the old clearance kept every cloud out of the narrow portrait frame).
- **Title** sits at 33 % (was 28 %), clear of the sun disc.
