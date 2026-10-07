# Skill provenance

- `playwright/`: copied from https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright . Upstream commit pinned above; bundled license preserved. This is an official upstream browser automation workflow.
- `xiantu-web-game/`: authored specifically for this repository; not an upstream official skill.
- `xiantu-canvas-performance/`: authored specifically for this repository; not an upstream official skill.

Skills are repository-local development instructions, not dependencies shipped to players. Read the matching SKILL.md when working on gameplay, UI/browser behavior, or Canvas performance. Existing test scripts remain the primary regression entry points.

- `xiantu-game-balance/`: authored specifically for this repository; offline combat, progression and economy analysis, not an upstream official skill.

- `creating-game-combat-vfx/`: vendored from https://github.com/John-Sun27/creating-game-combat-vfx/tree/22fafd72b8b3faadb5c64937df47f29dbd6cb722 . MIT license and upstream files preserved. `UPSTREAM.json` pins file hashes; `XIANTU.md` is the local integration note.
