# 雷系首批三招 · 透明资源试播

> 后续进展：用户已确认并要求接入，三招完成本地实战接入。见 [接入记录](thunder-skills-batch1-integration.md)。以下保留该阶段的历史验收范围。

2026-10-16，基线 main `127783e` / V28.68.41。用户已确认设计，完成制作与独立资源试播。**尚未接入游戏、提交 GitHub 或部署腾讯云**；这不是实战完成报告。

## 交付

| 技能 | 独立主体 | 命中与退出 |
| --- | --- | --- |
| 雷法 | 窄雷柱向下移动，地面细雷印固定 | 脚下电冠短促爆发，低位碎电消散 |
| 惊雷闪 | 固定尺寸雷梭横移，短尾与主体一起移动 | 定向碎电；本阶段不模拟实际封脉状态 |
| 裂地奔雷 | 三段相连的低矮电脊作为一体推进 | 单次上挑电叉，地纹消散；不增加三次伤害 |

每招独立材质母版、四阶段关键板；共12张RGBA帧条、72帧，PNG合计799331字节（约780.6 KiB）。主体使用独立母版与关键板插值，其他一次性层以透明度变化展开，不把72帧描述为72张手绘原画。预览图层均用普通source-over混合。

目录 `art/thunder-skills-batch1/preview/`：同源生成的运行配置/预览清单、纯采样器及DOM图片层预览。当前这些文件尚未复制进游戏网站目录。预览支持播放、暂停、重播、逐帧、命中时刻、未命中、轻量/减少动态、慢放、帧率、背景、缩放和偏移。

浏览入口：在仓库根目录启动 `python3 -m http.server 8782 --bind 127.0.0.1`，打开 `/art/thunder-skills-batch1/preview/`。本地HTML直接打开也只依赖同目录资源。

## 源图与修正

首版3×2关键板因光晕进入安全边界被拒绝，保留为 `keyplates-rejected.png`；未供任何导出使用。重新绘制2×2独立图层，先验证2%的无截断边界，再扩大完整单元格画布并通过18%安全边界检查，随后才切片。独立母版同样保留全部图像、扩展透明画布，未裁掉伸出边缘的素材。

导出审计每一帧：非空、透明边、稳定对齐、颜色、独立帧字节和尺寸。白色像素占比最高：雷法2.70%、惊雷闪2.04%、裂地奔雷2.48%；蓝色主材质占比最低均超过96%。统计口径为alpha>16的像素，不是屏幕白色占比。

原始来源、当前输入哈希、输出哈希分别见 `provenance.json`、`asset-audit.json`、`evidence/provenance.json`。对比图用旧素材自己的清单切片，按可见范围归一化，并使用实际项目战场底图。分镜图是风格参考；三招不是改色复用同一母版。

## 验证结果

- `python3 scripts/build-thunder-skills-batch1-vfx.py`：3个效果、12张帧条及72帧，源图边界/颜色/非空检查通过。
- `node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/thunder-skills-batch1/preview/effect-manifest.json`：3个效果有效。
- `node scripts/check-thunder-skills-batch1-vfx.cjs`：162000次纯采样，覆盖三种命中时刻、左右方向、三画质、命中/未命中、末帧可达、固定尺寸及寿命结束；采样不访问随机数或修改输入。
- Chromium 151.0.7922.173：三招实际DOM图片试播、控件与缺图隔离、390×844和844×390布局通过，无脚本错误、无横向溢出。单招资源损坏只阻止该招，另外两招仍可播放。
- `npm test`：54组游戏回归脚本及限流测试通过。
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`：7项既有浏览器回归通过。
- `git diff --exit-code -- xiantu-v2831-scroll tencent-jev-function`：游戏与Jev运行文件未改动。因此既有回归通过不代表新特效已经完成真实战斗验收。

预览中记录60个RAF间隔，中位数和p95约16.7ms；条件为无头Chromium、1000×950、DPR1、已加载资源、播放状态、软件渲染环境。这里只测预览调度，不是游戏渲染耗时、手机GPU表现或优化前后对比。浏览器尺寸模拟不等同实体手机实测。

CLI首次运行因沙盒网络权限未能安装，先使用环境已有Playwright驱动检查；随后安装仓库锁定依赖并运行标准浏览器回归。复现独立资源检查可运行 `node art/thunder-skills-batch1/qa/browser.cjs`（须先启动8782本地服务）。

## 证据与下一阶段

- `art/thunder-skills-batch1/evidence/thunder-batch-animation.webp`：三招循环资源试播。
- 同目录 `thunder-batch-animation.mp4`：将同源采样合成的PNG序列以25fps编码，循环4次；不是实战录屏。
- `comparison.jpg`：代表设计、独立母版、旧共享资源、新资源对比。
- `*-overlaps.jpg`：引导/主体、主体/命中、命中/消散的起点、中点、终点检查。
- `*-390.png` / `*-844.png` 与 `browser-results.json`：真实浏览器预览证据。

人工核对：三招主要轮廓和运动方向可辨；血条无遮挡；主体与命中阶段没有两道完整雷体重叠；结束后没有常驻电圈。设计中引雷阶段的长弧已收为低位雷印，落雷主体单独进入。尚需用户确认资源风格，然后接入真实命中、闪避、封脉事件，检查战斗结束/暂停/换敌清理并重跑实战验收。
