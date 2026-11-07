# Music upgrade (鸣潮-inspired, original)

Sample-free procedural BGM for 暮色浮岛 V8. Style inspiration from airy cinematic ambient (Wuthering Waves OST *feel* only) — **no copyrighted audio**, no external URLs, no CDN.

## Research (GitHub-first)

Compared approaches before implementing:

| Approach | Source ideas | Fit |
| --- | --- | --- |
| PADsynth / spectral IFFT tables | Paul Nasca PADsynth, various Tone.js pad demos, `padsynth` ports | **Chosen** for lush choir/pad one-shots cached as AudioBuffers |
| Karplus–Strong plucked string | Classic KS + WebAudio ports (e.g. harp/guitar sketches on GitHub) | **Chosen** for harp plucks (one buffer per pitch) |
| Additive felt piano | Soft-hammer additive + inharmonic stiffness (common sample-free piano notes) | **Chosen** over live oscillators for CPU |
| Freeverb / Schroeder delays | tunapanda/freeverb, simple-reverb | Hall still uses **generated impulse + ConvolverNode** (already in GardenAudio); lengthened + dedicated `hallBus` wet send |
| Live Tone.js / AudioWorklet synths | Tone.js Transport patterns | Rejected: dependency + Worklet flaky in QQ/iOS WebViews |

Playback stays on the existing `__music2` 16th-note scheduler; lush voices are buffer sources (≤ ~34 live).

## What changed

### Engine (`scripts/build.py` + `src/music-lush.js`)

- `FADE` 3.5 → **7s** equal-power crossfade (`fadeCurve` sin/cos segments).
- Shared darker hall impulse (~4.2s) + `hallBus` wet send that follows music gain.
- `__music2.theme` / `.level()` so lush module can retarget LEVEL_THEME.
- New voices: `felt`, `harp`, `choir`, `vocalise`, `padTone` on `__music2.voices`.
- Original track defs renamed to `<id>_classic` at load; lush scores take `dreamy` / `cozy` / `nightvoyage` / `morningchimes`.
- Session A/B: `__musicLush.setStyle('classic'|'lush')` (not persisted).

### Per-track musical changes

| Id | Name | Was | Now |
| --- | --- | --- | --- |
| dreamy | 蝶梦 | 66 BPM, short maj9 loop, triangle pad + flute/piano | **60 BPM**, A/B/C sections (~maj9 / relative colour / lift), choir+warm pad, felt piano, sparse harp answers, long wet hall |
| cozy | 小猫午后 | 96 BPM swing guitar lounge | **72 BPM**, warmer maj7/m9 afternoon, gentler rhythm, felt + soft harp, less “bouncy” |
| nightvoyage | 星灯夜曲 | 58 BPM short nocturne | **50 BPM**, sparse starlit, long held choir pads, very wet, slow melodic fragments |
| morningchimes | 晨风来信 | 66 BPM short music-box loop | **66 BPM**, dawn mist → brightening sections, chime+felt+choir air |

Dynamics / voicing vary by `loop` and section so repeats feel like ~60–90s forms, not 8-bar earworms.

## Mobile / CPU

- Audio still starts on first user gesture (existing GardenAudio).
- Instruments pre-rendered to buffers (chunked warm-up); live graph = BufferSource + Gain (+ shared convolver).
- Caps: `MAX_LIVE ≈ 34`; no AudioWorklet / ScriptProcessor.
- iOS/QQ: ES5, no modules, no external fetches.

## Size

- Built HTML ~951 KB; phone zip ~259 KB (procedural — no sample packs).

## Previews

Offline renders (Playwright + OfflineAudioContext) → WAV under `output/playwright/music/`, then ffmpeg → `/workspace/hg-pub/music-preview/{dreamy,cozy,nightvoyage,morningchimes}.{mp3,ogg}` (~45s each).

## Tests

- `python3 games/healing-game/tests/test_package.py`
- `games/healing-game/tests/music-lush-browser.js` (offline render, peak/silence/voice/crossfade checks)

## Limits

- Not a licensed OST recreation; original harmony/melody only.
- First-load buffer warm may hitch briefly on very low-end phones (mitigated by chunked queue).
- Classic toggle is session-only.
- Previews are engine renders, not studio masters.
