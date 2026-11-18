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
| b | `lotus` | 10–21 | Glide down to the six lotuses either side of the route (月珠莲 潮璃莲 霞梦莲 愿灯莲 紫憩莲 晓信莲, the game's petal colours), which open one by one (11 s + 1.45 s each); moon-dew beads glow above each flower. Leaves rock on the wind. | 花心里亮起月露 |
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

## Item status

Item 1 (this): timeline, camera, sky/moon/clouds/water/grass/wind/paper, captions, skip/continue, placeholder
lotuses/dew/boat/path/fireflies/lanterns, hooks, tests. Item 2: proper actor motion and models. Item 3: the score.
