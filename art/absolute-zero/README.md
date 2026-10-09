# 绝对零度 · 资源候选版

2026-10-09：按用户确认的四阶段设计完成透明资源。用户随后确认接入，现已完成本地 V28.68.32 整合；未上传 GitHub 或部署腾讯云。以下保留资源阶段记录，实战验收见 `docs/absolute-zero-v286832.md`。

## 资源与来源

`source/approved-storyboard.png` 为已确认设计；`master-original.png` 为最终透明冰棺母版，`keyplates-original.png` 为独立绘制的九格阶段板。保留两个弃用母版：`master-rejected-opaque.png` 的晶面遮挡过重；`master-rejected-open-frame.png` 缺少细晶面，过于像门框。最终母版保留细冰纹和晶面接缝，目标仍清晰可见。

五张 PNG 条带共 34 帧、754,904 字节（约 737 KiB）：聚核 6 帧、推进寒潮 8 帧、冰棺成形 6 帧、冻结维持 8 帧、霜痕消散 6 帧。推进层固定尺寸移动，不拉伸成光束。成形使用母版逐步显露；持续层使用原晶面材质的透明度微动；消散使用阶段板插值与淡出，不在运行时绘制新的特效主体。

原始完整单元先扩充透明留白，再进行边界检查和切片。源图 18%、条带 12% 安全边距检查通过，未通过裁掉主体解决越界。`asset-audit.json` 记录哈希、枢轴和各帧检查。所有受检图层近白覆盖率最高 4.23%，冰蓝覆盖率最低 96.23%；冰棺中心检测区 96.15% 的像素 alpha 不超过 12，平均不透明度约 2%。余下细线用于表达透明晶面，并非用整体降透明度掩盖不透明母版。

## 生命周期契约

`preview/choreography.js` 为确定性资源试播，不读取玩家存档或调用游戏逻辑。默认 310ms 模拟命中，180ms 成形；成形与维持共用枢轴、尺寸，交接透明度互补。冻结层可超过原施法 900ms 作业寿命；状态结束后 300ms 消散。提前解除时停止继续成形，目标消失立即清除；未命中不形成冰棺。支持丰富、轻量和减少动态模式。

预览以输入模拟命中、冻结结束和目标存在。正式接入必须绑定真实命中事件、当前敌人身份和冻结状态，覆盖死亡、换敌、逃跑、重置及页面隐藏清理。现有 70 灵力、4.0 倍率、冻结和寒迟机制本次未改动。当前战场及人物为静态参考底图，不能将资源试播当成实战验证。

## 复现

从仓库根目录执行：

```sh
python3 scripts/build-absolute-zero-vfx.py --runtime
node art/absolute-zero/check-preview.cjs
node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/absolute-zero/preview/effect-manifest.json
python3 -m http.server 8767 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8767/art/absolute-zero/preview/`。提供播放、暂停、重播、逐帧、速度、帧率、循环、背景、大小、偏移、画质、命中、目标存在、冻结时长及手动解除控制。

## 检查结果

- 合同检查通过：30 组画质/命中/冻结配置，长时间维持、提前解除、目标清理、未命中、固定推进尺寸、共享锚点、透明度交接和末帧处理。
- 清单与通用预览器的资源、序列帧几何检查通过。真实冻结生命周期由专用预览器验证。
- Chromium 录制 58 帧与 12 个交接时点；检查播放控制、四分之一速、非循环结束、三种背景、画质切换、无限冻结直到 5900ms 手动解除、提前解除和目标移除，未报告浏览器错误。
- 390×844 手机视口无横向溢出，冰棺中心目标和血条可读。此项为浏览器模拟视口，未做实体手机 GPU 测试。
- 游戏代码未改动，因此本阶段未重跑完整游戏回归；接入后需要实战与性能验收。

本地证据位于 `output/playwright/absolute-zero-resources/`：`absolute-zero-preview.webp`、`absolute-zero-slow-preview.webp`、`four-stages.png`、`overlap-comparison.png`、`material-comparison.png`、`reference-comparison.png`、`mobile-preview.png`。其中对比图分别包含批准设计、旧运行时表现和新资源；旧表现不是新资源的同一帧。

`check-browser.js` 与 `check-generic.js` 保存浏览器检查过程，`build-evidence.py` 从实际逐帧截图制作正常/半速动画和对比图；`evidence-hashes.json` 记录相关输入输出哈希。审计详情见 `build.log`、`browser-check.log` 与 `generic-check.json`。这些运行证据位于忽略输出目录，正式资源与重建脚本保存在仓库工作区中。
