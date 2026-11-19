# Level-6 clear cutscene 「雪灯归林」 — storyboard (~50 s)

Shown when the last kitten reaches the cabin (and from 「重看雪灯归林」), INSTEAD of the short 7 s finale; tap-to-continue
then opens the unchanged `#snowEnding` card exactly once. `?l6cutscene=0` keeps the old finale; reduced motion shows the
card at once. Preview: `?cutscene=l6` (`&mute=1` starts at once). Source: `src/l6-cutscene.js`, hooks
`scripts/l6-cutscene-v96.py` (after the V9.5 freeze, after `l6-chapter-v96.py`).

Set: the SAME shared floating island (H.island, same camera and frame loop). The film borrows the snow chapter's set
through `SnowChapter.stage(true)` (snow tint, pines, pressed-snow path, cabin) on any level and gives it back on close;
its own display-only additions (sky shader, film snowfall, film lanterns) live in one group parented to H.island plus a
sky sphere. Look: Ghibli-inspired homage, original — watercolour sky washes, big soft cumulus with silver moon-side
rims, a sea of cloud below the floating island, gouache toon shading (4-step ramp), paper grain and a cool vignette,
warm amber lamp and window light against the blue snow. Every visual is a pure function of the timeline second.

| Beat | Time | Caption (17px, one line at 360px) | Picture | Camera |
|---|---|---|---|---|
| snow | 0–10 s | 雪轻轻落在浮岛上 | Blue snowy dusk deepening to night, stars come out, big soft clouds drift; snow falls over the front of the path, the cabin window already warm in the distance. | Low over the snow at the island's front edge, looking up the path to the cabin. |
| lanterns | 10–21 s | 小路边的雪灯亮了 | The six snow lanterns warm one by one (10.5 s + 1.5 s each) from the front of the path to the cabin door; the pressed-snow patches turn amber behind them. Each ignition flares the halo and throws six sparks; flakes drifting through a lamp turn amber. | Glides along the path as it lights. |
| cabin | 21–32 s | 小木屋的窗，暖暖的 | Close on the cabin: the window light swells, snow on the roof. The four kittens (gameplay Blender models, Walk clip phased by distance) set off one by one (21 / 22.5 / 24 / 25.5 s) along the last stretch of path and curl up together under the window; the window steps brighter as each arrives; chimney smoke curls away from the moon. | Settles close on the cabin window. |
| island | 32–43.5 s | 整座岛都睡在雪里 | The lantern halos and window grow for readability as the frame widens; snowfall thins; fireflies and three paper sky lanterns (earlier chapters' lights) softly return, right of the island, never over the moon. | One slow, continuous pull-back and rise. |
| title | 43.5–50 s | — | 第六关 · 完成 / 暮色浮岛 high in the frame; the whole snowy island floats below it over the cloud sea, lanterns and window glowing. 轻触继续 at the end (600 ms guard after 跳过). | Wide, still drifting out. |

Beat grid: 80 bpm (0.75 s); lantern cues every 2 beats from beat 14, kitten departures every 2 beats from beat 28.

Music: none yet (item 5: an original score through the music-lush voices / level-3 celesta, `window.__l6Score`).
