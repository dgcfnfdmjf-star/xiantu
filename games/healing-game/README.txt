暮色浮岛 V9.1 · 月汐莲湾

本轮仅修改第五关的玩法与穿模问题。

六段月光归途
- 月珠莲：看花心的颜色，接住月白、暖金、潮蓝三滴月露。
- 潮璃莲：左右转动月镜，把光线对准亮起的目标刻度，再送入花心。放大的镜环、六枚刻度与明亮指针让方向可见。镜面位置与已找到的倒影都会保存。
- 霞梦莲：牵住漂浮的光，依次经过三个路标。也可点击世界中的光标或底部路标按钮；双指操作、取消触控、切后台会安全结束牵引，不误领奖。
- 愿灯莲：收一束暖光、一束冷光，再调和成晨曦。暖、冷两束光靠近并融进花心，短暂合光后开启下一朵；减少动态效果时立即完成。
- 紫憩莲：分别旋转三片叶舟，把光纹转向月亮。已摆好的叶舟不再被打乱，未摆好的朝向也会保存。
- 晓信莲：听一遍或看编号，回应 1 → 3 → 2。按错也保留正确的前缀。示范与实际敲击共用相同的三个音高，错音也能听见；音柱随敲击轻轻回应。
- 六朵莲花逐一醒来，花瓣舒展、涟漪与短小和声回应完成的目标，外圈光路逐段亮起。全部完成后，七秒归航演出让一叶小舟沿外圈巡游，六束愿光升起；可跳过，减少动态效果时直接展示结局。
- 没有倒计时、失败、扣分或重置。已绽放的莲花可回看并继续当前光路。完成存档可「再游一程」体验全部新玩法，或重看归航；练习不覆盖原存档，不重复发放收藏或成长。

兼容与音频
- 仍在第四关完成后解锁第五关；第三、第五关继续使用同一个 MP3，音乐行为未改。
- healingGarden.journey.v1 存档键不变。V9.0 的 lotus.light、已收集莲花与首次通关保留；新版补充 mirror/leaves 字段，并标注 lotus.version=2。每次有效解谜或旋转都会保存，沿用原写入失败提示和重试。
- 第五关仍为六个首次收藏各+5、首次通关+20，总计50成长；已有完成存档不重复领奖。其他关卡进度与仙途存档不变。
- nightvoyage-bgm.mp3 原始字节保持2161729 bytes，SHA256 19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31。

第五关空间修正
- 改为独立、封闭的莲湾模型。仅在第五关隐藏继承的花园地形、树、动物、植物、飘石、云与粒子；离开时先恢复可见性，再应用目标关卡的场景状态。原模型位置与保存坐标不改。
- 水面为不透明平面，与池体、岸沿有明确高度；莲叶浮在水面上方，花茎连接花瓣与叶，所有花瓣展开阶段均保持净空。六朵莲花各占互不重叠的空间。
- 涟漪从叶片外侧出现，最大半径小于0.75；只扩大平面半径，不加厚到水下。光标的实体低于牵引光的飞行平面，拖动范围限制在中央安全区域。
- 归航舟沿半径3.05的外侧水道移动，避开莲花与岸沿；愿光从花冠上方升起，不穿过花瓣、水面或月环。
- 第五关暂停自动绕行相机，保留手动旋转/缩放。镜头在主相机更新后，根据实际HUD和任务面板之间的空白区域调整取景，覆盖320×568、568×320、390×844和844×390；初次加载和旋转返回采用同一尺度。月环随镜头保持可辨识的月牙轮廓；离开恢复原镜头。镜头最近缩放和最高/最低俯仰均验证近裁剪净空。
- 第五关把普通提示与保存失败提示放进任务面板，避免覆盖莲湾；旧花园成就浮层仅在第五关隐藏。离开时恢复共享提示原来的位置。
- 复用原渲染循环，场景只创建一次。菜单、后台与减少动态效果均有相应处理。

构建（仓库根目录）
python3 games/healing-game/scripts/build.py
python3 games/healing-game/tests/test_package.py
node games/healing-game/tests/chime-rules.cjs
node games/healing-game/tests/lotus-rules.cjs

生成本地预览：games/healing-game/site/healing-game/
发布：downloads/healing-game-v9.1-tencent.zip、healing-game-v9.1-SHA256SUMS.txt
ZIP 严格只含 healing-game/index.html 与 healing-game/nightvoyage-bgm.mp3。
当前HTML 987712 bytes，ZIP 2401641 bytes。ZIP SHA256：c9d3dd8b0a58e16bbf41984e3f37258be2bc5ad7a7c5cd19cf211dd93e808162。
固定ZIP元数据，重复构建字节相同。修改src/与scripts/build.py，不直接编辑生成HTML，也不编辑保留的V5源文件。
部署详见 downloads/healing-game-v9.1-README.txt；旧发布包保持不变。

浏览器检查
python3 -m http.server 8784 --bind 127.0.0.1 --directory /workspace
使用 scripts/browser-cli.sh 的新会话和系统Chromium（/usr/bin/chromium）。例如：
scripts/browser-cli.sh -s=lotus91 run-code --filename games/healing-game/tests/lotus-browser.js
scripts/browser-cli.sh -s=lotus91 run-code --filename games/healing-game/tests/lotus-clipping-browser.js
scripts/browser-cli.sh -s=lotus91 run-code --filename games/healing-game/tests/lotus-finale-browser.js
scripts/browser-cli.sh -s=lotus91 run-code --filename games/healing-game/tests/lotus-layout-browser.js
其余 journey/voyage/finale-audio/chapter4/nightvoyage-audio/shared-audio/music-lush/clipping-browser.js 沿用原入口。
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser

实测记录（2026-11-07）
- npm test：147个游戏回归脚本，以及限流、保存/错误、包装工具和打包套件通过；系统Chromium的根浏览器套件27/27通过。
- 第五关逻辑6项、原第四关逻辑6项、打包6项通过；包内17段脚本全部可解析。
- 浏览器实走六种交互、错输入保留进度、断点续玩、旧存档、50点一次性成长、已完成重玩、保存失败重试、自然/跳过结局、后台暂停、键盘焦点与关卡往返通过。示范音高[0,4,2]与逐次敲击一致；第二指落在目标上不误领奖，放开后可重新牵引。
- 四种视口各六个任务布局（24组）通过；首载和横竖屏返回尺度一致。检查水面、月环和六朵花的投影顶点不被HUD、任务面板或可见提示覆盖，并人工检查截图。
- 几何扫查通过：288个阶段/方位姿态、120帧绽放、30帧合光、64组叶舟朝向、29个归航位置、64组相机近远/俯仰/方位。最低水面净空0.006500017，最大涟漪半径0.738520011；最近模型距相机4.9691，近裁剪面0.5。
- 第五关场景反复进出后的资源计数稳定；一次软件渲染样本47帧，帧间隔中位66.8ms、渲染调用中位1.3ms。该主机同时运行回归，数据只记录环境情况，不代表手机帧率。
- journey、voyage、finale-audio、chapter4、nightvoyage-audio、shared-audio、music-lush浏览器回归通过；原音频模块、MP3、第四关和第三关的玩法/几何源文件比对main一致（level3fx仅第五关开场文案变动）。

验证边界
测试使用全新浏览器上下文、合成存档、临时响应插桩，不加载真实玩家数据。截图、音频预览和原始日志位于忽略的 output/playwright/。没有向发布版加入测试接口，未部署腾讯云，未修改Jev。Linux软件渲染与触屏模拟不等于物理iPhone验证。
旧 clipping-browser.js 在本轮最终运行中仍失败：第三关星萤间距0.589846445568015低于断言0.7。基线确认使用origin/main 6abe73a的原V9 ZIP，按25000步×0.05秒固定推进；main最小间距0.5789664，当前0.5918612，都低于0.7。较短的按墙钟时间采样可能未覆盖靠近阶段而通过。该旧问题与第五关独立几何审计分开报告，本轮不修改第三关几何或放宽其断言。
