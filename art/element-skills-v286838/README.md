# 雷系 · 剑系 · 治疗系 家族共享资源（V28.68.38）

- `source/<family>/keyplates-original.jpg`：AI 绘制（GenerateImage）的 3×3 阶段原图，黑底。格序：0–2 主体，3–4 预兆，5–6 命中，7–8 余韵。
- `source/<family>/keyplates-keyed.png`、`keyplates-safe.png`：黑底按亮度转透明后的原图，以及按自动检测的格线切开、加边距后的安全网格（通过 `validate_sprite_source_grid.py`）。
- `preview/effect-manifest.json`：与运行时 `ELEMENT_BATCH` 同源，通过 `validate_effect_manifest.mjs`。
- `asset-audit.json`：输入哈希、边界检查、本系色相占比、帧唯一性与实际可见尺寸。

生成与检查：

```sh
python3 scripts/build-element-skills-vfx.py
node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/element-skills-v286838/preview/effect-manifest.json
node xiantu-v2831-scroll/QA/v286838-test-element-vfx.cjs
```

设计稿与资源预览两个确认节点本轮未单独经过用户确认，资源按用户“参照火系补上特效”的要求直接接入，可整体替换。
