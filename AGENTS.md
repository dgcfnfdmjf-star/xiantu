# Xiantu development

Use the existing checkout and preserve in-progress user changes. Current development commands and release contracts are in README.md.

For gameplay, map, combat, save or art changes, read `.agents/skills/xiantu-web-game/SKILL.md`.
For real-browser inspection, read `.agents/skills/playwright/SKILL.md`; the repository wrapper `scripts/browser-cli.sh` pins the CLI and uses writable caches.
For combat numbers, progression, rewards or economy analysis, read `.agents/skills/xiantu-game-balance/SKILL.md` and run `node scripts/analyze-balance.cjs`.
For combat skill VFX design, sprite production, preview or integration, read `.agents/skills/creating-game-combat-vfx/SKILL.md` and `.agents/skills/creating-game-combat-vfx/XIANTU.md`. Installing the skill alone does not request asset production or a game release.
For Canvas performance, read `.agents/skills/xiantu-canvas-performance/SKILL.md`; measure first and retain gameplay semantics.

Use the existing regression suites (`npm test`, `npm run test:browser`). Keep diagnostic output under ignored `output/playwright/`. Never load real player saves into temporary tests or make paid Jev calls as part of routine checks.

Website archives retain the top-level folder `xiantu-v2831-scroll`. Browser-only fixes do not require a Jev cloud-function update. Changes to development skills alone do not require a website deployment.

User workflow preference (2026-10-19): after each skill batch is integrated and required checks pass, commit and push the completed batch to GitHub and create or update its pull request without asking again for upload approval. Main-branch merges and Tencent Cloud deployment remain separate actions requiring user authorization.
