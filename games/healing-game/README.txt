暮色浮岛 V9.5 · 四种 Blender 猫咪行走修复（2026-11-11）

基于包含 PR #74 的 main 8812ff5 修复第二关猫咪移动时仍保持静态坐姿的问题。
本次保持 V9.5 版本、已审坐姿与配色、玩法数值和存档不变；只提交新 PR 评审。

本版变化
- 橘猫、三花猫、小煤球、狸花猫使用同一套 Blender 4.3.2 bpy 流程和坐姿。
  每种提供内嵌纹理 GLB、打包纹理的 .blend、实际 Blender 渲染 PNG。
  已审静态运行网格为每只 6,886 面；原 35,280 面源网格保留在 .blend 中。
  静态初版四只 GLB 合计 1,149,404 字节；本次增加轻量骨骼
  和可循环 Walk 片段，没有粒子毛发。每只 7,430 三角面，四只共 1,143,052 字节；
  体积略小于原静态版。当前大小和 SHA 见各 metrics 文件。
- 毛色按原 KINDS 定义。橘猫保留已审造型；三花有橘/深色花斑，小煤球无纹，
  狸花有深色条纹，眼睛分别为原定的深色/黄色/绿色。
- 2048px PNG 毛色贴图改为 1024px 内嵌 JPEG；已审坐姿、配色和花纹保留。
  拆分重叠的后脚/尾巴 UV 区域，修正像素中心采样并重新烘焙；导出前检查
  重叠与覆盖，避免减面后出现贴图碎斑。渲染 PNG 与实际运行 GLB 使用同一网格。
  实际各文件大小、哈希、贴图参数和面数见 assets/cats/*-metrics.json。
- 第二关按需加载 ./cats/{orange,calico,black,tabby}-cat.glb；同毛色实例共享
  模板几何体、材质和纹理。装饰橘猫也复用橘猫模板。模型以原猫场景尺度放置，
  每只猫独立持有骨骼与 AnimationMixer；几何体、材质和贴图仍共享。
  移动时播放 Walk，按现有移动速度与导出步幅调整步频；停下还原已审坐姿。
  hop、hug、sleep、play 不播放走路，保留原有整体反馈与呼吸，没有额外渲染循环。
- 加载期间或失败时使用原代码猫，玩法可继续；离开第二关后异步结果不挂回场景。
  返回第二关复用已下载模板；每种失败本页不反复重试，刷新可重新加载。
- 真实模型的地面尺寸用于第二关避让，点选中心随实际模型调整。
  GLB 材质单独适配旧页面的线性色彩输出，修复黑猫被压暗的问题；不改全局渲染。
  未改相机、其他关卡的光照/造型、音乐、数值或存档格式。

玩法与兼容性
先丢毛线球，再点同一只抱抱；每种毛色每程最多 4 次、集满 20 点解锁第三关，
稀有猫的原价值与出现规则全部保留。源码还定义小雪团和稀有星光猫，它们继续
使用原造型，避免本次四种替换改变毛色种类、旧图鉴和通关条件。
healingGarden.kittens.v1、companions、caught、total、ended 与其他存档键不变。
第三关 nightvoyage-bgm.mp3 保持 2161729 bytes，SHA256：
19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31。
V9.4 试玩反馈和第五关六个目标、原岛、终章配乐继续保留。

构建与部署包说明
在仓库根目录执行：
  python3 games/healing-game/scripts/build.py
  python3 games/healing-game/tests/test_package.py

生成 games/healing-game/site/healing-game/ 和 releases/healing-game-v9.5-tencent.zip。
ZIP 必须完整保留 healing-game/ 目录，当前包含六个文件：
  healing-game/index.html
  healing-game/nightvoyage-bgm.mp3
  healing-game/cats/orange-cat.glb
  healing-game/cats/calico-cat.glb
  healing-game/cats/black-cat.glb
  healing-game/cats/tabby-cat.glb

本版不再是 V9.4 的两文件包；只上传 index.html 会丢失模型。GLTFLoader、meshopt 解码器及其 WASM 已内联，
没有 CDN 或额外运行文件请求。Blender 源文件、渲染预览、独立查看页和构建脚本均
不进入游戏 ZIP。构建使用固定元数据，重复运行字节一致；ZIP 校验见同目录
healing-game-v9.5-SHA256SUMS.txt。V9.4 与更早历史包保留。
source/healing-game-v5.html 保持原上传；新外观挂钩在 scripts/cats-v95.py，
模型适配在 src/cat-models.js。发布 HTML 不直接编辑。
标题、garden-version 和手账页脚统一为 V9.5 / 9.5.0。

查看四只猫
assets/cats/preview-cat-orange.html 保留原文件名，可切换四毛色、坐姿/走路、旋转与缩放。
本地服务与 Blender 重建步骤见 assets/cats/README.txt。

验证
  npm test
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/assets/cats/tests/preview-cat-orange.cjs
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/tests/cat-models-browser.cjs
  node games/healing-game/tests/cat-walk-runtime.cjs
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/tests/cat-walk-browser.cjs
  python3 games/healing-game/assets/cats/tests/test_compact_skin_glb.py
  CAT_WALK_BASELINE_DIR=/path/to/main-8812ff5/site/healing-game PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/tests/cat-walk-performance.cjs

性能对照需要先在独立目录用 main 8812ff5 构建六文件站点，再将上面的占位路径
替换为该站点目录；测量时不要同时运行 Blender 渲染或其他浏览器任务。
保留原猫咪反馈/存档、选关/旅程、音频等浏览器回归。只使用合成存档，阻止外部
服务请求。加载与渲染测量的网络参数、样本及限制见 assets/cats/VALIDATION.txt。
云端 Chromium 手机布局模拟不等于实体手机性能保证。
按顺序更新与校验三层清单：python3 scripts/checksums.py --write，随后
python3 scripts/checksums.py；不改仙途/Jev 代码，不部署任何游戏或云函数。
