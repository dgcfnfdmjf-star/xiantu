暮色浮岛 V9.2 · 月汐莲湾（2026-11-07）

本轮仅修正第五关的场景复用。
第五关直接在第一至第四关的同一个 H.island 上继续旅程，保留原来的草地、土层、锥形岩体、粉色花树、睡猫、云和浮石。原池塘、水面材质、岸石与岛屿模型不重建，也不隐藏；上一版独立的蓝色莲湾圆盘、池体和外圈岸沿已删除。

场景与交互
- 六朵月莲按原池塘的尺度种在水中。花、叶片、涟漪与岸石各有净空；小叶舟和归航舟沿池塘中央的空水道活动，六束愿光从花冠上方升起。
- 当前目标的月露、月镜、引光路标、冷暖光和音柱浮在池塘上方，叶舟位于水面。六个目标仍为接月露、转月镜、牵引光路、调和晨曦、转叶舟、回应晚安；顺序、判定、按钮、旋律、七秒舟灯结局和跳过行为全部沿用 V9.1。
- 第五关对象挂在原岛下，跟随同样的浮动与轻摇；牵引光的射线平面和命中点按父级变换转换，拖动不因岛屿浮动而偏移。新光晕参与深度测试，不从实体背后透出。
- 旧存档的花朵可能被已有风铃摆件推向池塘。本关只临时分开它们的显示位置，不修改已保存坐标；离开时由原关卡的布局恢复。
- 前一关尚在飘升的临时灯笼在第五关暂时隐藏，寿命照常推进；离开时恢复仍存活灯笼原来的可见性。第五关自己的归航愿光、原岛地标和天空景物继续显示。
- 保留月环和夜色；月环抬高到原鸟类起飞/落栖轨迹上方。镜头按整个原岛的真实网格顶点与月环取景，显示完整岩体；桌面使用左右控件之间的空间，手机竖屏把原声音/手账按钮排成两行，给原岛留出空间。手动绕行、缩放、横竖屏与返回其他关卡仍可用。
- 320×568 的最小屏幕同时容纳完整岛屿与操作面板时，池塘内物体较小；所有目标继续提供原来的44像素按钮操作。390×844 默认岛屿约333像素宽。

兼容与未改变的行为
- 第四关完成后解锁；没有计时、失败、扣分或进度重置。
- healingGarden.journey.v1 存档键与 lotus.version=2 不变；V9.0/V9.1 的逐朵进度、镜面、叶舟、收藏与通关奖励保留。
- 六个首次收藏各+5、首次通关+20，总计50成长；练习不覆盖完成存档、不重复领奖。手账仍为47种。
- 第三、第五关继续共用原 nightvoyage-bgm.mp3；音频代码没有改动。原文件2161729 bytes，SHA256 19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31。
- 提示/保存失败警告仍在第五关任务面板中，离开恢复；菜单、后台暂停、减少动态效果及保存失败重试保留。

构建（仓库根目录）
python3 games/healing-game/scripts/build.py
python3 games/healing-game/tests/test_package.py
node games/healing-game/tests/chime-rules.cjs
node games/healing-game/tests/lotus-rules.cjs

预览：games/healing-game/site/healing-game/
发布：downloads/healing-game-v9.2-tencent.zip、healing-game-v9.2-SHA256SUMS.txt。
ZIP严格只含 healing-game/index.html 与 healing-game/nightvoyage-bgm.mp3。
HTML：989472 bytes；ZIP：2402217 bytes。
ZIP SHA256：765d660ca3601eb6335cf3223bc7c06f558b206f5c4f1e20520d5cc38445cb05。
固定ZIP元数据，重复构建字节一致。只编辑 src/ 与 scripts/build.py，不直接修改生成HTML或保留的V5源文件。旧发布包保留。上传说明见 downloads/healing-game-v9.2-README.txt。

浏览器检查
python3 -m http.server 8784 --bind 127.0.0.1 --directory /workspace
使用 scripts/browser-cli.sh 的新会话和系统Chromium（/usr/bin/chromium）。
scripts/browser-cli.sh -s=lotus92 run-code --filename games/healing-game/tests/lotus-browser.js
scripts/browser-cli.sh -s=lotus92 run-code --filename games/healing-game/tests/lotus-clipping-browser.js
scripts/browser-cli.sh -s=lotus92 run-code --filename games/healing-game/tests/lotus-finale-browser.js
scripts/browser-cli.sh -s=lotus92 run-code --filename games/healing-game/tests/lotus-layout-browser.js
scripts/browser-cli.sh -s=lotus92 run-code --filename games/healing-game/tests/lotus-carryover-browser.js
其余 journey/voyage/finale-audio/chapter4/nightvoyage-audio/shared-audio/music-lush/clipping-browser.js 沿用原入口。
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser

验证记录
- 原第四关与第五关的岛屿、草地/土层/岩体/树/池塘为相同对象，原几何、材质、本地变换与可见性一致；云与浮石继续显示。4→5→4恢复原镜头、提示位置与音乐，临时花朵避让不改变存档。
- 六目标实走通过：键盘与世界点击、真实拖动、双指取消、错输入保留进度、断点续玩、旧存档、50点一次奖励、已完成练习、菜单/后台、保存失败重试、自然/跳过结局和减少动态效果。
- 五种视口各六任务布局共30组通过，覆盖320×568、568×320、390×844、844×390、1280×800；初次加载与旋转返回尺度一致。检查完整原岛、六莲、目标道具和月环的投影顶点不被HUD/任务面板覆盖，并检查实际截图。
- 原池塘几何扫查通过：288组姿态（包含岛屿浮动/轻摇）、120帧绽放、30帧合光、64组叶舟朝向、29个归航位置、64组相机方位/俯仰/缩放。最低水面净空0.00250000568，莲花最大半径0.192600，涟漪最大半径0.208195，舟与花最小包络间隙0.043300；整个岛屿距相机最近3.511759，近裁剪面0.5。
- 反复进出时，第五关32个根对象及其所有子对象、几何和材质身份完全复用。全场景GPU计数包含原关卡临时动物/效果，单独记录而不当作第五关泄漏判据。审计时并发软件渲染样本21帧，帧间隔中位268.5ms、渲染调用中位6ms，只记录该测试主机的负载状况，不代表手机帧率。
- 根 npm test：147个游戏回归脚本及限流、保存/错误、包装工具和打包套件全部通过；根Chromium浏览器27/27通过。第四关逻辑6项、第五关逻辑6项、包测试6项通过，17段内联脚本全部可解析。
- 原灯笼跨关回归覆盖六目标与归航共420帧；保留原15个地标和13个云/浮石对象的可见性，并验证离开后的灯笼可见性恢复。原鸟类起飞/绕行/落栖与月环的1680个姿态组合无实体顶点穿入月环。
- journey、voyage、finale-audio、chapter4、nightvoyage-audio、shared-audio、music-lush浏览器回归全部通过；原clipping最终结果见下。

验证边界
所有检查使用全新浏览器上下文、合成存档及临时响应插桩，不加载真实玩家数据，发布版不加入测试接口。截图与原始日志位于忽略的 output/playwright/healing-v9.2-validation/，独立审阅证据在 output/playwright/astra92-*。未部署腾讯云、未合并main、未修改仙途或Jev。Linux软件渲染和触屏模拟不等同于物理iPhone验证。
已知旧回归例外：本轮原 clipping-browser.js 仍在第三关星萤间距断言失败（0.589846445568015 < 0.7），第一、二关几何检查通过。本轮没有修改该断言或第三关几何。上一轮已用origin/main 6abe73a的V9原包按25000步×0.05秒固定推进，基线最小0.5789664、当时工作版本0.5918612，均低于0.7，证明该问题已存在；短时间按墙钟采样可能未覆盖靠近阶段。本轮第五关的原池塘/鸟/月环/舟灯及跨关审计均通过，独立复核无未解决发现。
