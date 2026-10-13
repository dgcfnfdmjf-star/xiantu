# 火系第二批 · 透明资源预览

范围：红莲业火 `karmic_lotus`、火墙术 `ember_wall`、三昧真火 `samadhi_fire`。

2026-10-13 用户已确认三张设计。用户随后“记入”确认接入。当前三招已完成本地实战接入与回归；第一批成果保留，版本、技能数值和存档规则不变，尚未合并 main 或发布线上。

- `design/*-storyboard.png`：已确认的四阶段设计；`*-draft.png` 仅保留历史。
- `source/`：各技能独立透明母稿、阶段原图、完整单格扩边图和旧效果对照。
- `preview/index.html`：可直接打开的实景 DOM 图集试播，支持逐帧、快慢、提前/延迟命中、背景、画质、缩放及偏移。
- `preview/effect-manifest.preview.json` 与运行配置同源，通用预览器可选择本目录载入。
- `evidence/fire-batch-animation.webp`：三招合并动图；莲印末段示范一次显式的灼烧结束事件，不把三次主动出招换算成固定秒数。
- `evidence/*-overlaps.jpg`、`comparison.jpg`：用实际 sampler、透明资源和战场底图合成的衔接与新旧对照。
- `asset-audit.json`：当前输入 SHA-256、边界检查、颜色、帧唯一性及实际可见尺寸。
- `sampler.js`：只读预览合同，未来接入时复用；目标死亡、换目标、隐藏、退出优先清理。

生成与检查：

```sh
python3 scripts/build-fire-skills-batch2-vfx.py
node scripts/check-fire-skills-batch2-vfx.cjs
node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/fire-skills-batch2/preview/effect-manifest.json
python3 scripts/render-fire-skills-batch2-evidence.py
```

红莲标记只在同一存活目标的 `burnTurns > 0 && burnStacks > 0 && _burnHealBlockV286818` 成立时显示；短动画完成后切换到独立小莲印。火墙短时命中后散去，不增加阻挡、碰撞或区域伤害。三昧三股焰舌为同一个投射主体，保持一次命中。

实景底图用于比例对照，试播中的状态为模拟输入。实战接入验收见 docs/vfx/fire-skills-batch2-integration.md；实体手机仍待后续验收。
