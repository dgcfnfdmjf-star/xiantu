# 火系首批资源试播

2026-10-13，开发分支 `codex/skill-vfx-expansion`，游戏基线 V28.68.35。

已完成：烈焰斩、炎爆术、焚天烈焰各自的材质母版、阶段板、透明图集、同源纯采样器和 DOM 试播。用户已确认代表分镜；资源预览已获用户“接入”确认，三招已完成本地游戏接入与验收，尚未合并 main 或发布线上；详见 `docs/vfx/fire-skills-batch1-integration.md`。

## 打开与重建

直接打开 `preview/index.html`，或在仓库运行 `python -m http.server 8767` 后访问 `/art/fire-skills-batch1/preview/`。

- `python scripts/build-fire-skills-batch1-vfx.py`：检查未裁断原格，完整扩格至 18% 留白，验证后切片、注册锚点、插值导出。
- `node scripts/check-fire-skills-batch1-vfx.cjs`：三招 21,600 次采样检查，覆盖提前/正常/延后/无命中与有无引爆。
- `node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/fire-skills-batch1/preview/effect-manifest.json`。
- `python scripts/render-fire-skills-batch1-evidence.py`：按纯采样器的实际位置、尺寸、透明度合成动画和交接图，不绘制特效主体。

通用图集检查器 `.agents/skills/creating-game-combat-vfx/tools/vfx-preview/index.html` 支持选择 `preview` 目录。三招均通过检查。通用检查器使用简化四阶段窗口；以本目录 DOM 试播为事件、地面锚点和引爆分支的正式资源验收入口。

## 美术与播放合同

每招 4 帧蓄力、8 帧主体、6 帧命中、6 帧短余韵；炎爆术另有 6 帧条件引爆。RGB 颜色保留在透明 PNG 内，普通 source-over 合成。

- 烈焰斩：单枚定尺寸弯月火刃；命中火花不再描画完整火刃。蓄力/主体的交接可见大小统一；余韵窗口 300ms。
- 炎爆术：小火核、普通接触爆发；只有传入独立 `detonationAt` 才显示大裂焰，未命中一律禁止。灰烬短暂消失，不新建持久灼烧。
- 焚天烈焰：脚下蓄热，确认命中后固定脚底的火柱上涌；不新增多段伤害或持续伤害区域。峰值会暂时遮住狼身部分，头部、前腿与血条仍可辨，实战需继续核对不同体型。

图中角色与血条是实际战场静态比例参考，不表示已经运行战斗逻辑。灼烧持续状态将在接入时沿用主版已有所有者，避免叠两层持久火焰。

## 检查与证据

- `asset-audit.json`：源文件哈希、边界验证结果、导出帧色彩/近白比例/可见边界/唯一性。
- `evidence/`：动画、旧/新/母版对照、每个交接开始/中间/结束的合成图，以及采样和输入哈希。
- `output/playwright/fire-skills-batch1/`（不入 Git）：390×844 竖屏、844×390 横屏、逐帧与播放控制、故障注入、通用预览器检查日志。

首轮阶段图出现贴边/跨格，保留为 `keyplates-draft.png`，已重新生成完整格；失败图不参与导出。额外图像生成原件保留在 `/workspace/generated_images`。

资源验收通过后才进入真实命中接入、死亡/换目标清理、持续状态衔接与战斗回归。已做浏览器实战与性能检查，尚未做实体手机验收；详情见接入报告。
