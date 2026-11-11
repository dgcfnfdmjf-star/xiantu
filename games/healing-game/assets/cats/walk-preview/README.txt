四猫 Walk 最终浏览器验收
=======================

four-cats-walk-browser.mp4 是 Chromium 实际加载正式压缩 GLB 的 43.6 秒录屏，
顺序为橘猫、三花、小煤球、狸花。每只先看坐姿，再看侧面连续 Walk，最后
停在 0/25/50/75% 相位。没有用 Blender 渲染替换浏览器画面。

four-cats-walk-keyframes.png / four-cats-seated-check.png 是原截图排版拼图。
每只的单张原尺寸截图也保留；game-*-moving.png 来自第二关游戏实际页面。
performance-results.json 为 Fast 4G 三次交替测量及同站位显示开销原始记录，
acceptance-results.json 为自动验收与视觉检查摘要。详细结论见 ../VALIDATION.txt。

复录（仓库根目录，需要 Playwright 的 ffmpeg 可执行文件）：
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/assets/cats/tests/cat-walk-evidence.cjs
录制源输出到忽略目录 output/playwright/cat-walk/evidence/，MP4 由系统 ffmpeg
从录制 WebM 转码为 H.264/yuv420p/faststart；模型和游戏代码不参与转码。

可交互检查 ../preview-cat-orange.html，支持四种毛色、坐姿/Walk 与拖动旋转。
旧 ../walk-candidate/ 为之前未通过的候选，不是本次最终模型。
