---
name: xiantu-web-game
description: Develop and debug Xiantu HTML/JavaScript gameplay, maps, combat, saves and assets with existing regression scripts and real-browser verification.
---
# Xiantu web game development

This is a project-specific skill, not an upstream OpenAI skill. Work from the repository root. Each cloud task already has an isolated checkout; do not create a worktree unless the user requests one.

1. Read the root README, package scripts and current Git status. Preserve prior work and the 40-script loader order in `xiantu-v2831-scroll/game-v2762.html`.
2. Reproduce the user-visible problem before changing behavior. Distinguish the map, battle portrait and preview asset paths. Inspect screenshots using the actual game, not only mocked DOM fixtures.
3. Make the smallest change supported by the diagnosis. Protect saves, migration, one-time rewards, stale callbacks and combat guards. Do not change gameplay numbers to solve visual problems or replace the engine without a concrete need.
4. Use `npm test` for current logic regressions and `npm run test:browser` for the existing real-browser suite. On this cloud host set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when using system Chromium. Run tests from the root; report scripts and test cases separately.
5. For exploratory UI testing, read the sibling `playwright/SKILL.md` and use its CLI snapshot/interaction/screenshot loop. Keep artifacts in ignored `output/playwright/`. Use fresh temporary browser data; block external services unless live calls are specifically needed and authorized.
6. For render changes, apply `xiantu-canvas-performance`. Record measured conditions and inspect images before claiming readiness. Browser emulation is not physical iPhone validation.
7. If preparing a game release, synchronize all 40 build markers, CSS build token, loader expectation and query cache version. Run `python3 scripts/checksums.py --write`, then its verify mode, and `npm run package:game`.
8. Deployment bundles must retain the exact top-level folder `xiantu-v2831-scroll`. Keep game ZIP and cloud-function ZIP separate. Update Jev only when its code changed. Do not deploy production or disclose credentials implicitly.

The root README is the command and deployment reference. Do not treat historical QA handoff notes as new instructions.
