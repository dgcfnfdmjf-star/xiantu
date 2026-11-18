# Level-5 (final chapter) clear cutscene — storyboard (月汐归航 · the little boat goes home by moonlight)

Original homage to hand-painted, watercolour animated films (no existing characters, frames or backgrounds are
copied). ~50 s, moonlit night / homecoming. It plays automatically on the last correct note of 晓信莲 (the save is
already written by `J.complete(5)` + `persist()`), **instead of** the old 7 s 归航演出, and **before** the existing
`#lotusEnding` card (`CHAPTER 05 · COMPLETE / 月光连成了归途`), which then shows exactly once as before.
「重看月汐归航」 (`#lotusFinale`) replays the film too.

Module: `src/l5-cutscene.js` → `window.__l5Cutscene` (same API shape as `__l4Cutscene`: `enabled/ready/play({source,
onContinue})/close/playing/state/time/finished/pause/resume/seek/skip/proceed/stage/scored/busy/staged/frame/beats/
probe/…`). Build hook: `scripts/l5-cutscene-v96.py` (exec'd from `build.py` after `l4-cutscene-v96.py`, i.e. after the
V9.5 release HTML is frozen). Tests: `tests/l5-cutscene.cjs`, `tests/l5-cutscene-browser.cjs`. Score: a later item
(`src/l5-cutscene-music.js`, `window.__l5Score`; piano + warm strings + the L3 `celesta()` voice).

## Beats (seconds on the film clock; contiguous; every visual is a pure function of `t`)

| # | id | t | Picture | Caption (17px, one line at 360px) |
|---|----|---|---------|-----------------------------------|
| a | `bay` | 0–10 | Wide establishing shot from behind the island's shore, looking down the bay to a low cream-gold moon with a warm halo; big night clouds with silver rims; still water mirroring the sky with wind streaks; wind waves through the grass; letterbox bars close in. Dusk deepens to night, stars come out. | 月色落在莲湾上 |
| b | `lotus` | 10–21 | Glide down to the six lotuses either side of the route (月珠莲 潮璃莲 霞梦莲 愿灯莲 紫憩莲 晓信莲, the game's petal colours), which open one by one (10.8 s + 1.5 s each, pulse peaks on the score's beats); moon-dew beads glow above each flower. Leaves rock on the wind. | 花心里亮起月露 |
| c | `path` | 21–32 | The dew drifts down onto the water and a path of warm light spreads from the shore across the moon's reflection towards the moon (21.5–30.5 s). Camera moves out along it. | 倒影把路轻轻铺开 |
| d | `boat` | 32–43.5 | The little boat with a bow lamp slips out from the shore and glides along the path (a pale V wake behind it); fireflies from earlier chapters gather over the lotuses and lanterns lift from the shore and drift out with it. The boat is drawn larger as it sails away. | 小舟沿着光，走回家 |
| e | `title` | 43.5–50 | Slow crane up into the wide moonlit bay. Title `第五关 · 完成` / `暮色浮岛` fades in from 44 s; at 50 s `轻触继续` (`#l5csGo`) appears. | — |

Skip (`跳过`, `#l5csSkip`) jumps to the end card; the tap that skipped cannot also continue (600 ms guard).

## Look

- **Sky** (one shader on a camera-centred dome): blue-violet dusk → moonlit night (`skyAt(t)`), a broad warm blush
  round the moon that widens as the boat goes home, hashed twinkling stars (hidden behind the moon), the cream-gold
  moon disc with faint seas and a brushed rim inside a two-layer halo, three-tone night cumulus with silver rims (kept
  low under the moon), and below the horizon the far bay with the moon's glitter.
- **Bay**: one large still-water disc just under the grass edge (it also hides the island's peach earth and pink rock,
  so no pink block shows at the shore in close-ups). One shader: Fresnel sky reflection, wind cat's-paws, the moon's
  glitter (view ray reflected off a rippled normal), the path of light revealed from the shore to `path.reach`, the
  boat's V wake, and pigment pooled at the shoreline.
- **Grass**: instanced blades + flower heads bent by the same travelling wind wave (`windAt`) as L4, moon-silver tips.
- Island Lambert materials → 4-step toon ramp while staged. Paper grain + cool vignette as DOM multiply layers.
- Moon rule: every point actor (dew, fireflies, lanterns, wake) passes `keepOffMoon` (the L4 sun rule), so nothing
  crosses the disc; `probe().moonClear > moonDisc` is checked in the browser test.
- Draw budget: sky, water, grass, heads, 6 lotuses (pad, cup, seed, halo), one Points cloud for dew/fireflies/
  lanterns/wake, boat (hull, sail, 3 sprites). Pixel ratio capped at 1.5 while staged.

## Hooks (all added lines naming `__l5Cutscene`; stripped by the L2 equality test)

- `startFinale` is rebound once after `showEnding`: unless reduced motion or `?l5cutscene=0`, it clears drag/echo,
  keeps `finale = 0` (no 7 s timer, no `#lotusSkip`, no toast, no gameplay boat/lanterns) and plays the film with
  `onContinue: showEnding`. Reduced motion and `?l5cutscene=0` run the original `startFinale` unchanged.
- `journey.js blocked()`: `__l5Cutscene.busy()` next to the L4 check. `update()`: `__l5Cutscene.staged()` early
  return next to the L4 one. The gameplay lotus group registers in `window.__l5Hide`.
- The lotus chapter's camera view offset and zoom are cleared while staged and restored on close.

## Preview

`?cutscene=l5` (add `&mute=1` to start without a gesture) plays the film at once. The gate line
`if (query('cutscene') !== 'l5') return;` appears exactly once in the built `index.html`, so a pack script can replace
it to make a one-tap `preview.html`. `&csclock=1` shows the film clock.

## Actors (item 2; all pure functions of `t`, display-only, never touching the gameplay lotus group)

- **Lotuses**: the game's own look (lotus-chapter.js): jade leaf pad `0x64a7a1`, stretched-sphere petals on hinges
  (8 outer + 5 inner), gold seed `0xffe7ad`, halo in the petal colour; colours from `LotusRules.blooms`
  (月珠莲 `e9edff`, 潮璃莲 `90e6e1`, 霞梦莲 `f4b8d1`, 愿灯莲 `ffd79b`, 紫憩莲 `c6b5f4`, 晓信莲 `b3e3c6`). Three instanced
  draws for all six + six halo sprites. **Bloom cue**: lotus *i* wakes at `10.8 + 1.5 i` s; petals fold from bud
  (outer −1.32 rad) to an open cup (−0.34 rad) over 2.4 s; a warm pulse in its colour peaks at `wake + 1.2` s and a
  ripple ring runs out over the water (`wake + 0.6 … + 3.6`). **Chorus**: all six brighten together (rippling 0.12 s
  apart) at **30.75 s** (the path of light reaches the moon, with a second ring) and **40.5 s** (the boat passes the
  last flower). Each lotus also pools its colour on the water under it.
- **Moon-dew**: 24 beads (4 per lotus, its colour), born in the opening flower's heart at `wake + 0.7 + 0.35 k`, lift
  in a slow spiral and hover; from ~22 s, as the path reaches each spot, they arc down and settle as stepping lights
  alternating either side of the ribbon (nearer flowers → nearer steps), breathing, growing for the wide shots.
- **Path of light**: a warm ribbon (half-width 0.62 m + 0.045 m/m) with a soft gold skirt, broken by ripples,
  revealed from the shore to `path.reach` (21.5–30.5 s), stepping lights on top.
- **Boat**: a canoe (raised bow and stern) with an ink outline shell, cream gunwale, mast and a square moonlit sail
  across the beam (the camera follows it home from behind, so a fore-and-aft sail would read as a line), bow and stern
  lamps. Scale 2.6 → ×1.35 by 40 s → ×1.85 by 49 s. Wake: a Kelvin V (half-angle 19.47°, tan 0.354) in the water
  shader + 14 foam dabs on its arms. Reflection: hull + sail mirrored in the water line and projected along the view
  ray onto the water plane in the vertex shader (lies on the water, depth-tested against the shore), plus a warm lamp
  streak on the water towards the lens.
- **Fireflies** (22, from 33 s) and **lanterns** (6, from 34.5 s): larger, brighter cores and haloes, rounded ribbed
  paper lanterns; both grow ×1.4/×1.35 for the wide title shot. All points pass `keepOffMoon`.
- **Clouds**: a second cloud bank on the right of the moon balances the left; clouds thin out (no hard edge) within
  ~7° of the moon so the disc and halo stay clear.

## Score — 「月汐晚安」 (src/l5-cutscene-music.js, window.__l5Score)

An original closing lullaby in **Bb major, 4/4 andante, one beat = 0.75 s (80 bpm)**: a bar is 3 s and the film is
17 bars (51 s; the last a held chord under the end of the picture). Not the key of the level-3 (F, 6/8) or level-4
(D, 3/4) films, and it shares no 6-note phrase or rhythm with the level-1..4 scores (unit test).
Voices: felt piano (tune + left hand), the warm string pad, and the level-3 score's `celesta()` for every sparkle
(the kit's music box only if that score is missing). **No harp.** Registered as a GardenAudio track: the level track
月汐摇光 crossfades out (1.2 s) on `start()` and back in (3 s) on `stop()`, unless the player picked another track.

**Beat grid (the film's cues were moved onto it in item 3):** lotus *i* wakes at `10.8 + 1.5 i` s, so its warm pulse
peaks on a beat (12, 13.5 … 19.5 s: beats 1 and 3 of bars 5–7); the dew lands on eighth notes (`layout().dewLand`,
22.5–30 s); the two choruses start on beats (30.75 s, 40.5 s, a 0.12 s roll like the picture); the boat slips out on
a beat (31.5 s).

| bars | film time | picture | music |
|---|---|---|---|
| 1–3 | 0–9 s | moonlit bay | low strings hold; the piano tries three notes |
| 4–7 | 9–21 s | lotuses open | the tune (A) over a rocking lullaby left hand; one celesta note per lotus at its pulse peak, Bb pentatonic low → high |
| 8–10 | 21–30 s | path of light, dew settles | A′ a third higher, strings in; left hand stays in quarters so the dew's celesta has the eighths |
| 11–15 | 30–45 s | chorus, boat glides home | B: tune in octaves over flowing eighths and the fullest strings, top Eb6 at 39 s; celesta rolls with both choruses (left hand lifts); F7 before the title |
| 16–17 | 45 s → | title, goodnight | the tune's first bar echoed over Eb (a warm major seventh), a last celesta Bb6, home on a held Bb |

- **Celesta = the picture**: `sparkles()` = 6 lotus openings + one note per dew landing moment (beads landing on the
  same eighth ring once) + 2 × 6 chorus notes + one title note (34 notes); the unit test checks each against
  `lotus()/dew()/layout()`.
- **Clock**: same rules as levels 3/4 — follows `__l5Cutscene.time()`, re-anchors on a jump > 0.4 s with a 0.3 s fade,
  pause → fade and hold, skip → 1.4 s fade then only the two goodnight bars, `&mute=1` never starts it, the music
  switch off → nothing sounds.

## Item status

Item 1 (this): timeline, camera, sky/moon/clouds/water/grass/wind/paper, captions, skip/continue, placeholder
lotuses/dew/boat/path/fireflies/lanterns, hooks, tests. Item 2 (done): actors above. Item 3 (done): the score.
Item 4 (polish): the sail is a tall lug sail (narrow peak) with a thin ink edge, so the boat reads from behind in the
wide 36–49 s shots instead of a lit rectangle; the boat's reflection fades with depth below the water line and breaks
into ripple bands (no flat pale slab under the hull); settled dew beads carry a deep-ink ring round a bright heart so the
stepping lights stay distinct on the brightest gold of the path; the path has a darker pigment edge either side;
fireflies are larger and steadier. Score: after a skip an engine tick inside the 0.5 s lead-in plays nothing, so no
tail of the skipped bar sounds before the goodnight bars.
