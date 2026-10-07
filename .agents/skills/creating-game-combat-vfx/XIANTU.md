# 《仙途》接入说明

本文件是项目本地补充；上游 SKILL.md、引用文件和许可证保持原样。

## 使用范围

用于技能分镜、透明序列帧资源、施法与命中特效、资源预览和视觉验收。
本次仅安装开发技能及工具，不代表已生成新特效或部署网站。

## 项目定位

- 网站目录：`xiantu-v2831-scroll`。
- 当前战场：`xiantu-v28684-duel.js`，Canvas 立绘 2.5D，保留角色和怪物外观。
- 技能特效：`xiantu-v2855-skill-fx.js`，`InkSkillFxV2854.profile/draw` 提供具名效果。
- 动作预览：`battle-25d-preview.html`；这里不能替代真实战斗验收。
- 战斗逻辑和耗蓝由原战斗系统负责，表现层消费命中事件，不自行扣血或发奖励。
- `QA/v28684-test-duel.cjs`、`QA/v286812-test-combat-integrity.cjs` 检查表现只读和命中同步。

制作时同时遵循 `../xiantu-web-game/SKILL.md`、`../xiantu-canvas-performance/SKILL.md` 和 `../playwright/SKILL.md`。采用标准工作流；只有用户明确选择才启用上游的可选多 Agent 模式。依据任务已有授权选择阶段，复用已确认的立绘和风格。

## 已验证的本地工具

在仓库根目录运行：

```sh
PYTHON=python3 node --test .agents/skills/creating-game-combat-vfx/tests/*.test.mjs
```

无需安装额外 npm/Python 包。预览器为 `tools/vfx-preview/index.html`，通过选择本地目录载入特效清单及PNG，不上传资源。制作后使用 `scripts/validate_effect_manifest.mjs` 和 `scripts/validate_sprite_source_grid.py` 验证清单和图集边界；参数见上游参考文件。

资源通过预览后再接入游戏。复用现有 Canvas/动画循环；保持轻量画质、减少动态效果、暂停及销毁清理。真实战斗验证原耗蓝、伤害和存档语义，手机尺寸检查遮挡及帧间隔。

## 安装与更新

`UPSTREAM.json` 记录来源提交和所有上游文件 SHA-256，LICENSE 保留 MIT 声明。更新前比较上游差异及本地说明，不盲目覆盖。

这是仓库本地开发技能，不加入玩家下载包，也不需要更新腾讯云或 Jev。制作游戏内容后再执行项目发布检查。
