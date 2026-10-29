# Camera synchronization audit

The supplied outer camera wrapper is not needed for the current renderer. The game uses one 2D world camera step per drawn frame. `drawFlatWorld` calculates the target, calls `worldCameraStepV2893`, and saves the pixel-snapped result in `_camDrawV2893`. Terrain cropping, actor coordinates and map tap conversion use that same result.

The Three.js avatar path is inactive (`AVATAR3D.ready === false`, `THREE` absent). Even an explicit `init3DAvatar()` call returns in offline 2D mode before creating WebGL. Adding the reference wrapper would introduce a second smoothing calculation around the existing step, then restore a different camera coordinate after drawing. The existing follow rate, look-ahead, movement and region rules were therefore retained without a runtime camera change.

## Browser evidence

Measured on 2026-10-29 using local system Chromium, headless, fresh temporary browser profiles and synthetic characters. External services were blocked. The scenes used existing south/north maps and warmed artwork; the initial sampled scenes contained 14 POIs, 28 mobile / 39 desktop decorations and 2 spawned monsters. Runtime instrumentation was confined to the temporary browser and ignored files under `output/playwright/camera-v286880/`.

| Scenario | Samples | Camera steps other than one | Terrain/actor camera mismatch |
| --- | ---: | ---: | ---: |
| Mobile 390×844 → 844×390, device DPR 3, capped canvas DPR 1 | 319 | 0 | 0 |
| Desktop 1366×768 → 1024×768, device DPR 2, automatic canvas DPR 1 during this run | 628 | 0 | 0 |
| Desktop 1024×768, explicit fine quality, actual canvas DPR 1.5 | 107 | 0 | 0 |

The mobile and desktop runs covered idle, keyboard movement, south-to-north map changes, overlay open/close and `pauseVisualsV2767` / repeated `resumeVisualsV2767` calls. Both overlay and pause samples produced zero map frames and zero pending map animation callbacks. Repeated resume never exceeded one pending map RAF. Pixel rounding remained within half a backing pixel, including DPR 1.5.

For the sampled south movement, mobile draw JS time was median 0.7ms / p95 2.2ms and frame interval median 33.3ms / p95 33.4ms. Desktop draw JS time was median 1.3ms / p95 2.1ms and frame interval median/p95 16.7ms. These are current-path observations, not a before/after speedup, physical iPhone validation, GPU timings, or a real operating-system background test. Desktop fine-quality follow-up was stationary after a small test position adjustment to avoid north-domain combat interrupting the sample.

Raw evidence: `mobile.json`, `desktop.json`, `desktop-high.json`, `mobile-north.png`, `desktop-north.png` in the ignored output directory. Reproduce by serving the game locally, starting a fresh character, blocking external network requests, recording `worldCameraStepV2893` calls and the world-context transform at `drawWorldPlayer`, then comparing them with the static-map `drawImage` source coordinates and `_camDrawV2893`.

## Regression guard

Run `node xiantu-v2831-scroll/QA/v286880-test-camera.cjs`.

This checks 78 frames across portrait, landscape, DPR 1 / 1.5, two regions and alternating frame steps: one camera update, matching terrain/actor/tap coordinates, region snapping, unchanged player position/resources, no save writes, inactive 3D and paused-loop guards. Existing `v2893-test-map-alive.cjs` continues to cover damping, look-ahead and reduced-motion behavior.
