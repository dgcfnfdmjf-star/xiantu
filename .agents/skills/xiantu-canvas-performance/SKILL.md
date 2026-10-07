---
name: xiantu-canvas-performance
description: Profile Xiantu Canvas map rendering, frame pacing, DPR, image loading, pause/resume and memory before making measurable performance changes.
---
# Xiantu Canvas performance

Project-specific performance workflow. Apply the sibling web-game and Playwright skills where relevant.

1. Start with a concrete scene and a fresh local browser profile. Record browser, viewport, DPR, headless/headed, hardware limitations, region, entity counts, warmed/cold assets, and mobile FPS cap. Block live Jev calls for repeatability.
2. Measure actual `drawFlatWorld`, `updateFlatWorld`, minimap and asset work using temporary browser instrumentation or Chromium profiling. Capture real frame intervals and draw durations separately. Never infer GPU speed from JavaScript function timing or compare different scenes as a before/after improvement.
3. Exercise standing, movement, menu open/close, portrait/landscape, and tab background/foreground. Verify no map draws while an overlay is open, only one active animation loop after resume, and no growth in canvas backing sizes or pending timers across repeats.
4. Inspect existing mechanisms before adding new ones: map frustum culling, static terrain cache, mobile 30 FPS cap, DPR cap, minimap throttle, image cache, and `pauseVisualsV2767` / `resumeVisualsV2767`.
5. Optimize only a demonstrated hot path, with one change at a time. Prefer reusing stable assets and reducing offscreen work. Never change simulation timing, spawn rate, rewards or player speed just to improve FPS. Avoid global caches that survive player/region changes incorrectly.
6. Re-measure the same scenario and inspect screenshots. Preserve gameplay/state invariants using existing tests. Do not disable assertions or hide errors to reach a performance target.
7. Store ignored raw evidence in `output/playwright/`; summarize reproducible steps, sample counts, median/p95, limitations and actionable findings in `docs/`. If no bottleneck is demonstrated, report that and avoid speculative code changes.

No runtime diagnostics or profiling hooks belong in the shipped game unless separately designed and requested.
