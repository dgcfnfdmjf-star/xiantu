橘猫 Walk 候选 V24 — 未通过验收

本目录只供查看上轮最后的橘猫候选，没有继续修模型，也没有替换四只正式 GLB/.blend 或接入游戏。

先看这些文件：
- orange-walk-candidate.mp4：真实浏览器录屏，15.80 秒，1100×900，H.264，25 fps，无音轨。
  坐姿 → 正面走路 → 侧面走路 → 回到坐姿；显示原始 Walk 片段，1×，原地播放。
- orange-walk-candidate.gif：同一录屏的压缩便览，15.76 秒，600 像素宽，8 fps；细节与颜色以 PNG/可转预览为准。
- orange-walk-front.png：正面 Walk 的 1/4 周期，查看迈步。
- orange-walk-side.png：侧面 Walk 的 1/4 周期，查看臀部、尾根及脚掌封口面。
- orange-sit-front.png：默认坐姿正面。
- orange-sit-seam-detail.png：浏览器放近镜头拍摄的胸口/前腿细缝特写，没有修图或增强。
- preview-orange-walk.html：可切换坐姿/走路、正面/侧面，支持拖动旋转与滚轮/双指缩放。默认坐姿。

当前仍存在的问题：
1. 坐姿胸口与前腿交界有细小接缝。
2. 行走时臀部、尾根及脚掌封口面仍显出切面/色块。
3. 后腿跗关节转折偏硬。

预览页运行方法（从仓库根目录）：
  python3 -m http.server 8000
打开：
  http://localhost:8000/games/healing-game/assets/cats/walk-candidate/preview-orange-walk.html
预览只读取本目录的候选 GLB 和 ../vendor/three-r128/ 下已有的三个本地脚本，不访问玩家存档。

候选文件：orange-cat-walk-v24.glb
字节数：380140
SHA256：c992a7fa4294ee4d3fd9331dba484096010f5b19ba222a565feca343a25d4fb1
三角面：8044；Walk 循环：1.6 秒。此文件为上轮 v24 compact 的逐字节副本，未修改。

录制条件：151.0.7922.173，云端 Linux headless 桌面浏览器，1100×900 CSS 像素，DPR 1。
沿用原预览的相机、灯光与阴影；录屏保留实际浏览器画面，无补帧、磨皮或模型修饰。
MP4 仅裁掉开始的加载画面并进行正常编码：显式 full→limited 色域数值范围转换，避免 ffmpeg 错解范围造成发白；PNG 是无损浏览器截图。
GIF 为同一视频的降尺寸/降帧率便览。25 fps 是视频文件规格，不代表手机运行性能。
浏览器检查：页面错误 0；只加载指定候选 GLB；坐姿/走路/旋转控件可用。此结果不代表模型通过验收。
逐项文件大小、SHA256、相机与截帧参数见 review-metadata.json。
