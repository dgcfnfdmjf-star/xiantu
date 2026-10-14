# 雷系 · 剑系 · 治疗系 · 冰系 · 护盾与棍枪 序列帧资源（V28.68.38 起）

| 资源 | 原图目录 | 类型 | 技能 |
| --- | --- | --- | --- |
| `thunder_strike` | `thunder` | 家族共享 | 雷系 10 招 |
| `sword_qi` | `sword` | 家族共享 | 剑系 9 招 |
| `jade_lotus_heal` | `heal` | 家族共享 | 治疗 9 招 |
| `frost_palm` | `ice_palm` | 独立（投射） | 寒冰掌 |
| `ice_spike` | `ice_spike` | 独立（投射） | 玄冰刺 |
| `ice_burst` | `ice_burst` | 独立（目标脚下） | 冰爆术 |
| `frost_dragon_breath` | `ice_dragon` | 独立（投射） | 霜龙吐息 |
| `frozen_expanse` | `ice_expanse` | 独立（目标脚下） | 冰封千里 |
| `frost_barrier` | `ice_barrier` | 独立（目标脚下） | 霜寒结界 |
| `glacier_prison` | `ice_glacier` | 独立（目标脚下） | 冰河葬狱 |
| `abyss_domain` | `ice_abyss` | 独立（目标脚下） | 寒渊领域 |
| `soul_seal` | `ice_soulseal` | 独立（目标脚下） | 冰魄封魂 |
| `eternal_crystal` | `ice_crystal` | 独立（目标脚下） | 万载寒晶 |
| `frost_armor` | `ice_armor` | 独立（施法者脚下） | 冰甲护身 |
| `solar_aegis` | `fire_shield` | 独立（施法者脚下） | 炎阳护盾 |
| `flame_bind` | `fire_bind` | 独立（投射） | 流火飞索 |
| `mountain_quake` | `mountain` | 独立（目标脚下） | 镇岳山河震 |
| `sun_spear` | `spear` | 独立（投射） | 穿云贯日 |

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
