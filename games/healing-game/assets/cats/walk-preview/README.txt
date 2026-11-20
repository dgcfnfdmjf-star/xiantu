四猫 Walk 浏览器验收 · 2026-11-14
================================

four-cats-walk-browser.mp4 为实际第二关游戏的 8 秒逐帧录像：
橘猫、三花、小煤球、狸花各 2 秒。Chromium 加载正式压缩 GLB，使用原
GardenPlay.update 按 1/60 秒步进，诊断相机跟随；每 3 帧保留一张截图，
20 FPS 组装为 MP4。只裁切画面、标记毛色和编码，没有替换猫或插帧。
不是云端浏览器墙钟帧率演示；性能测量另见 performance-results.json。

four-cats-walk-keyframes.png 为同次游戏截图的 0/25/50/75% 相位拼图。
{kind}-walk-{00,25,50,75}.png 保留完整游戏原图。
game-*-moving.png 为桌面与手机竖屏实际漫游、点击抱猫回归截图。
原 four-cats-seated-check.png / *-sit-*.png 保留已审坐姿对照；本次坐姿
表面、UV、贴图字节由独立资产测试确认不变，新的 Blender 正面渲染在上级目录。
acceptance-results.json 包含逐猫脚底接触、步频、循环、坐姿恢复及视觉检查。
performance-results.json 为当前 main 与本次修改的 Fast 4G 三次交替对照。

复录实际游戏：
  python3 games/healing-game/scripts/build.py
  CAT_GAIT_FRAMES=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/tests/cat-gait-browser.cjs
原始帧和报告在忽略目录 output/playwright/cat-gait/。按 orange、calico、black、
tabby 顺序，以 20 FPS 编码各自 *-frames/%03d.png，再连接四段即可；本次视频
裁切为 x=330,y=220,w=640,h=470，缩放至 800×588，H.264/yuv420p。

也可在 ../preview-cat-orange.html 切换四种毛色、坐姿/Walk，拖动旋转。
独立查看页实时录屏工具 ../tests/cat-walk-evidence.cjs 仍可使用；当前提交
视频来自游戏本身。旧 ../walk-candidate/ 是历史候选，不是本次正式资产。
