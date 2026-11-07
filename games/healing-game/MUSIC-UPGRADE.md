# V9.0 music integration

Adapted from PR #62, commit `1e6551f`: original PADsynth choir/pads, Karplus–Strong harp, felt piano and evolving scores. Lush replaces only `dreamy`, `cozy` and `morningchimes` (chapters 1, 2 and 4). Their original definitions remain available as `dreamy_classic`, `cozy_classic` and `morningchimes_classic`.

`__musicLush.setStyle('classic'|'lush')` switches those three themes for the session; it does not write saves. Calling it during chapter 3 or 5 updates the other themes without restarting or replacing the active recording.

Lush players use seven-second sine/cosine equal-power fades. A dedicated hall send uses a cached 4.2-second impulse and returns before each player's gain, so retirement and existing music/master controls apply to wet and dry audio. Hall nodes are disconnected when a player retires. The original engine convolver, recording gain, linear recording fades, scheduler and sound-effect graph remain intact. Transitions involving a recording retain its original transition duration and immediate stop behavior.

The lush `nightvoyage` score from PR #62 is deliberately excluded. `nightvoyage` keeps its original definition, name, MP3 and synthesized fallback from PR #63. `src/nightvoyage-audio.js` and the original MP3 are unchanged. Packaging extends the recording eligibility to chapter 5, whose `moonlotus` definition copies the original nocturne and shares its decoded buffer and URL. No second audio asset is created.

The MP3 remains 2,161,729 bytes, SHA256 `19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31`. Both recording chapters retain the +8 dB gain, gesture unlock, loop, music toggle, suspension, immediate stop on exit and HTTP/decode/15-second timeout fallback.

Validation commands:

```sh
python3 games/healing-game/tests/test_package.py
scripts/browser-cli.sh -s=healing9 run-code --filename games/healing-game/tests/music-lush-browser.js
scripts/browser-cli.sh -s=healing9 run-code --filename games/healing-game/tests/nightvoyage-audio-browser.js
scripts/browser-cli.sh -s=healing9 run-code --filename games/healing-game/tests/shared-audio-browser.js
```

The lush test offline-renders each score through the real engine, checks non-silence, peaks, voices, long playback and crossfade, and produces listening copies under ignored `output/playwright/music/`. Audio lifecycle tests use fresh contexts and temporary instrumentation. Browser emulation is not a physical iPhone test. Instrument warm-up can still briefly stall very low-end devices; no extra synthesis package, CDN, AudioWorklet or independent transport is added.
