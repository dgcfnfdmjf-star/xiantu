暮色浮岛 V9.0 · 月汐莲湾

V9.0 本轮内容
- 第一、二、四关接入 PR #62（1e6551f）的 PADsynth、Karplus–Strong 竖琴、毡音钢琴、七秒等功率淡化和独立大厅混响。__musicLush.setStyle('classic'|'lush') 仍可切回经典曲；风格选择不写存档。
- 第三关原 MP3、音量、解锁、循环、开关、立即停止和原合成回退保留；不引入 PR #62 的 lush nightvoyage，也不改变第三关原混响。
- 第五关「月汐莲湾」：第四关通关后，从结局或手账进入。轻触六朵月莲，或点击花名/送光按钮，每朵收到三缕月光就绽开。无顺序要求、无需等候、没有限时或失败状态。触屏、鼠标和键盘均可操作。
- 六朵月莲加入统一收藏，总计47种；每朵首次盛开+5成长，首次通关+20，共50。通关后自由荡起涟漪，不会重复发奖。
- 第五关复用第三关同一个 nightvoyage-bgm.mp3 和已解码缓冲区，切换两关也只有一份音频下载。风格切换不会重启第三或第五关的录音。
- 沿用 healingGarden.journey.v1；新增可恢复的 lotus.light/found 字段。旧存档默认未送光，第四关已通关即解锁第五关；旧收藏、成长和所有其他关卡进度保留。每次送光都保存，写入失败沿用原提示与重试机制。
- 新场景仅首次进入创建，复用现有岛屿和帧循环；切关隐藏，后台暂停。减少动态效果下无浮动、涟漪缩放，不延迟通关。
- 构建继续只有 healing-game/index.html + healing-game/nightvoyage-bgm.mp3 两个部署文件；详见 downloads/healing-game-v9-README.txt 与 MUSIC-UPGRADE.md。

新增检查
node games/healing-game/tests/lotus-rules.cjs
scripts/browser-cli.sh -s=healing9 run-code --filename games/healing-game/tests/lotus-browser.js
scripts/browser-cli.sh -s=healing9 run-code --filename games/healing-game/tests/shared-audio-browser.js
scripts/browser-cli.sh -s=healing9 run-code --filename games/healing-game/tests/music-lush-browser.js

V8.1 基线与历史验证


V8.1 第三关音乐
- 星灯夜航改用本地 90 秒 MP3，解码后以 AudioBufferSourceNode 无间隙循环；用户手势解锁后播放，切关或关闭音乐立即停止，音量沿用现有控制。
- 下载或解码失败（含15秒超时）自动回退原合成《星灯夜曲》。
- 第一、二、四关配乐、玩法、成长与存档键不变。手动在其他关选择星灯夜曲也保留原合成曲。
- MP3 增益2.512（+8dB）；同一 Chromium 输出的10秒采样：第一关 -23.6、第二关 -24.7、第三关 -24.7、第四关 -27.9 dBFS RMS。保持原音乐/总音量总线，第三关样本峰值0.245，无削波。
- MP3 原始字节不变：2161729 bytes；SHA256 19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31。

原有第四关
- 三灯通关后，从第三关结局或旅程手账进入「晨风铃谷」。
- 六座场景风铃和六个编号按钮，三段旋律（3音、3音、4音）；听一遍、看编号或展开乐谱均可。无倒计时、无需付费，错音仅重置当前段输入。
- 六枚新音符加入统一手账，总收藏41种。首次发现每枚+5成长，首次通关+20，第四关最多新增50成长。前三级的数值和奖励保持原样。
- 每个正确音保存进度；可以刷新、切关后接着奏。通关后自由合奏，不重复领奖。
- 第四关晨光、风铃摇摆、成就光环与独立「晨风来信」配乐复用现有3D引擎；场景首次进入时才构建，之后切换仅隐藏/显示。
- 通关演出可跳过，减少动态效果偏好下直接展示结局；音乐和音效沿用现有开关。

基线与参考
- source/healing-game-v5.html 是此前用户提供的 V5 原始单文件，保留其中的 Three.js MIT 版权声明。
- V7 在 V6 三关、35种收藏、五级成长基础上，整合附件 healing-game-v7.html 的星灯夜曲、星萤光轨、灯心偏好、纸船巡航与夜航记事；V8 在此基础上增加第四关。
- V8.1 为 index.html + nightvoyage-bgm.mp3 两文件，无外部 CDN、数据库、广告、付费接口或新增云函数。
- 同一浏览器、同一域名继续沿用 healingGarden.* 和 hg_level2_unlocked 存档键。V7 字段为 stars/joys/memories，V8 增加 chimes.round/step/found，兼容已有 V5/V6 进度；成长仍由首次收藏和首次通关计算。

构建（仓库根目录）
python3 games/healing-game/scripts/build.py
python3 games/healing-game/tests/test_package.py
node games/healing-game/tests/chime-rules.cjs

生成：
- games/healing-game/site/healing-game/index.html（忽略的本地预览目录）
- downloads/healing-game-v9-tencent.zip（healing-game/index.html + healing-game/nightvoyage-bgm.mp3）
- downloads/healing-game-v9-SHA256SUMS.txt

构建使用固定 ZIP 时间戳，重复构建字节相同。修改在 src/ 与 scripts/build.py，勿直接改生成的 HTML。V5 原始文件无需编辑；构建替换锚点丢失或重复会立即报错。

浏览器检查（仓库放在 /workspace/xiantu 时）
python3 -m http.server 8784 --bind 127.0.0.1 --directory /workspace
使用 scripts/browser-cli.sh 打开本地页面（系统 Chromium /usr/bin/chromium），然后：
scripts/browser-cli.sh -s=healing-v8 run-code --filename games/healing-game/tests/journey-browser.js
scripts/browser-cli.sh -s=healing-v8 run-code --filename games/healing-game/tests/voyage-browser.js
scripts/browser-cli.sh -s=healing-v8 run-code --filename games/healing-game/tests/nightvoyage-audio-browser.js
scripts/browser-cli.sh -s=healing-v8 run-code --filename games/healing-game/tests/finale-audio-browser.js
scripts/browser-cli.sh -s=healing-v8 run-code --filename games/healing-game/tests/chapter4-browser.js

测试使用全新临时浏览器上下文和合成存档，拦截非本地请求。截图与日志写在 output/playwright/。如果仓库路径不同，调整测试里的本地 URL。没有加载真实玩家存档。

V7 已有修正
- 统一标题、手账和 garden-version 为 7.0.0。
- 星萤与灯座重叠时优先响应星萤，减少误点灯。
- 三灯演出使用现有帧循环，切后台暂停；支持跳过，减少动态效果偏好下直接展示结局。
- 触控支持划动拾光，双指手势、失去捕获、切后台清理划动状态。
- 花园/蝴蝶/猫咪/旅程分开报告保存失败，保留未写入数据并在存储恢复后重试；一个系统保存成功不会掩盖另一个系统的失败。
- 夜空最多60颗收藏星，记事限定已知条目且去重，不会累积重复奖励。
- 星光仍为4点点亮一盏灯，3灯通关。灯心偏好只增加声光反馈与纪念次数，不消耗货币、不增加成长星光。

部署与限制
部署独立 healing-game/index.html 和同目录 nightvoyage-bgm.mp3；不要把它传到仙途入口或根目录。详见 downloads/healing-game-v9-README.txt。
浏览器验证使用 Linux Chromium 触屏模拟；不是 iPhone 真机。软件渲染环境帧间隔偏高，不能据此承诺手机帧率。没有新增独立绘制循环；未替用户部署腾讯云。

V8 验证记录（2026-11-05）
- test_package.py：5项通过；13段内联脚本全部通过 Node 语法检查，ZIP CRC、发布字节、SHA-256、重复构建一致性通过。完整 HTML 914329字节，ZIP 247252字节。
- chime-rules.cjs：6项通过，覆盖异常存档、逐音恢复、错音保留收藏、三段通关、奖励去重与无效输入。
- chapter4-browser.js：新存档解锁门槛、V7迁移、真实场景触点、编号乐谱、静音反馈、刷新续奏、50成长上限、自由合奏、保存失败恢复、减少动态效果、手机横竖屏和桌面通过。所有测试页面无脚本异常、无外部资源请求。
- 反复切换四关三轮后，测试场景几何体67、纹理23、第四关容器10个子节点均未增长；后台暂停渲染。使用临时响应插桩检查，发布包没有新增测试钩子。
- journey-browser.js / voyage-browser.js：原三关、旧收藏、V5/V6迁移、划动/双指手势、夜航、三灯、保存失败重试及仙途存档隔离回归通过。
- finale-audio-browser.js：第三关自然结局、结局按钮进入第四关、第四关自然结局及演出按钮状态通过；实际三段旋律产生10次风铃发声，关闭音效后不发声，自由合奏不重复领奖。
- npm test 中147个仙途回归脚本和9项打包测试通过；wrapper套件初次在沙箱内丢失子进程输出，连同API/限流/保存套件在正常执行环境重跑，20项全部通过。node scripts/analyze-balance.cjs 完成204个仙途基线探针；仙途数值与运行文件未修改。
- 原有 V7 下载包保持原字节；本轮没有修改仙途运行目录、仙途 ZIP 或 Jev。

V7 验证记录（2026-11-05）
- python3 games/healing-game/tests/test_package.py：5 项通过；11 段内联脚本全部通过 Node 语法检查；ZIP CRC、字节一致性、SHA-256 与重复构建一致性通过。
- tests/journey-browser.js：V5 迁移、三关解锁、35种收藏、真实触屏拾光、星光上限、三灯通关、刷新恢复、成长去重、装饰记忆、切关、横屏、存档隔离与保存失败提示通过。
- tests/voyage-browser.js：V6 未完成进度迁移、星灯夜曲、后台暂停、跳过演出、划动/双指分离、分系统保存错误与恢复、异常新增字段清理、60星上限及减少动态效果通过。
- tests/finale-audio-browser.js：三灯演出自然结束，纸船一圈后恢复慢航；六种音色在关闭音效时不创建振荡器，开启后正常发声；无页面异常。
- 所有浏览器检查使用新建上下文与合成测试存档；游戏未请求外部资源。未验证物理 iPhone。
- 同一 Linux Chromium 软件渲染环境，390×844、DPR 2、触屏模拟，参考/整合版第三关各采样4.5秒：帧间隔中位109.3/120.6ms，JS绘制调用中位1.4/1.3ms，场景44个几何体、8张纹理。小样本及程序生成场景有波动，本轮不声称帧率提升或真机流畅度保证。
- 没有更改仙途运行目录、仙途下载 ZIP、Jev、#58 部署流程。

V8.1 验证记录（2026-11-07）
- MP3 下载字节数、SHA256 与分支原件完全一致；ffprobe 确认44.1kHz双声道、约90秒，音频未重编码。
- test_package.py：6项通过，包含两文件 ZIP、音频身份、14段脚本语法、CRC、版本/校验和及重复构建一致性；chime-rules.cjs：6项通过。
- nightvoyage-audio-browser.js：真实解码播放、手势前静音、循环边界（加速播放）、音乐开关、切至其他三关、其他关手动选择原夜曲、HTTP/解码/超时回退、延迟加载切关通过。测试插桩仅在测试浏览器，发布版无新增测试钩子。
- journey-browser.js、voyage-browser.js、finale-audio-browser.js、chapter4-browser.js 通过；使用全新上下文和合成存档。
- npm test：147个游戏回归脚本及限流、保存/错误、wrapper工具和打包套件通过；npm run test:browser：27项通过（系统 Chromium）。
- 本轮只生成 V8.1 独立包，既有V8/V7包保持原字节，未部署腾讯云。

V9.0 验证记录（2026-11-07）
- test_package.py：6项通过；部署ZIP严格包含index.html与唯一MP3，17段脚本通过语法检查，CRC/原音频哈希/重复构建一致性通过。chime-rules.cjs 6项与lotus-rules.cjs 4项通过。
- lotus-browser.js：V8迁移、第五关解锁、第四关结局入口、场景触点与键盘、逐缕保存/刷新、后台暂停绘制、50成长上限、自由游玩、切换全部五关、横竖屏与桌面、写入失败恢复、减少动态效果、仙途存档隔离通过。三轮切关后稳定为78个几何体、23张纹理，第五关容器16个子节点。
- music-lush-browser.js：三首lush曲、三首classic曲、所有乐段与六次循环变奏、300秒长播放与七秒交叉淡化通过；输出峰值不超过0.372，长播放最多34个活跃声部，交叉淡化最多38个。classic/lush风格API在第一、二、四关通过，第三关原曲定义保持不变。
- nightvoyage-audio-browser.js、shared-audio-browser.js：MP3实际解码/循环边界、手势、开关、立即离场停止、HTTP/解码/超时回退、延迟加载切关、第三/第五关风格切换不重启、两关共享一次下载与解码缓冲区通过。
- journey/voyage/finale-audio/chapter4浏览器回归通过。npm test：147个回归脚本及限流、保存/错误、wrapper工具与打包套件通过；npm run test:browser：27项通过。
- 已知基线失败：旧clipping-browser.js的第三关星萤间距断言要求至少0.7，当前main（99c69ae）与本分支都测得0.589846445568015；原未固定种子的本分支运行另遇一次猫咪/毛线间距0.3866（要求0.4）。用相同固定种子、静音夹具复核main，确认星萤失败已存在。未放宽断言，也未为此修改旧关卡几何或玩法。
- 截图已人工检查；Linux系统Chromium、软件渲染、手机390×844/DPR2、横屏844×390与桌面1280×800，非物理iPhone验证。无新增渲染循环，未部署腾讯云。
