暮色浮岛 V7.0 · 星灯夜航

基线与参考
- source/healing-game-v5.html 是此前用户提供的 V5 原始单文件，保留其中的 Three.js MIT 版权声明。
- 在已完成的 V6 三关、35种收藏、五级成长基础上，整合本轮附件 healing-game-v7.html 的星灯夜曲、星萤光轨、灯心偏好、纸船巡航与夜航记事。
- V7 仍是一个自包含 HTML，无外部 CDN、数据库、广告、付费接口或新增云函数。
- 同一浏览器、同一域名继续沿用 healingGarden.* 和 hg_level2_unlocked 存档键。新增字段为 stars/joys/memories，兼容已有 V5/V6 进度；成长仍由首次收藏和首次通关计算。

构建（仓库根目录）
python3 games/healing-game/scripts/build.py

生成：
- games/healing-game/site/healing-game/index.html（忽略的本地预览目录）
- downloads/healing-game-v7-tencent.zip（仅 healing-game/index.html）
- downloads/healing-game-v7-SHA256SUMS.txt

构建使用固定 ZIP 时间戳，重复构建字节相同。修改在 src/ 与 scripts/build.py，勿直接改生成的 HTML。V5 原始文件无需编辑；构建替换锚点丢失或重复会立即报错。

浏览器检查（仓库放在 /workspace/xiantu 时）
python3 -m http.server 8784 --bind 127.0.0.1 --directory /workspace
使用 scripts/browser-cli.sh 打开本地页面（系统 Chromium /usr/bin/chromium），然后：
scripts/browser-cli.sh -s=healing-v7 run-code --filename games/healing-game/tests/journey-browser.js
scripts/browser-cli.sh -s=healing-v7 run-code --filename games/healing-game/tests/voyage-browser.js

测试使用全新临时浏览器上下文和合成存档，拦截非本地请求。截图与日志写在 output/playwright/。如果仓库路径不同，调整测试里的本地 URL。没有加载真实玩家存档。

整合时的修正
- 统一标题、手账和 garden-version 为 7.0.0。
- 星萤与灯座重叠时优先响应星萤，减少误点灯。
- 三灯演出使用现有帧循环，切后台暂停；支持跳过，减少动态效果偏好下直接展示结局。
- 触控支持划动拾光，双指手势、失去捕获、切后台清理划动状态。
- 花园/蝴蝶/猫咪/旅程分开报告保存失败，保留未写入数据并在存储恢复后重试；一个系统保存成功不会掩盖另一个系统的失败。
- 夜空最多60颗收藏星，记事限定已知条目且去重，不会累积重复奖励。
- 星光仍为4点点亮一盏灯，3灯通关。灯心偏好只增加声光反馈与纪念次数，不消耗货币、不增加成长星光。

部署与限制
仅部署独立 healing-game/index.html；不要把它传到仙途入口或根目录。详见 downloads/healing-game-v7-README.txt。
浏览器验证使用 Linux Chromium 触屏模拟；不是 iPhone 真机。软件渲染环境帧间隔偏高，不能据此承诺手机帧率。没有新增独立绘制循环；未替用户部署腾讯云。

本轮验证记录（2026-11-05）
- python3 games/healing-game/tests/test_package.py：5 项通过；11 段内联脚本全部通过 Node 语法检查；ZIP CRC、字节一致性、SHA-256 与重复构建一致性通过。
- tests/journey-browser.js：V5 迁移、三关解锁、35种收藏、真实触屏拾光、星光上限、三灯通关、刷新恢复、成长去重、装饰记忆、切关、横屏、存档隔离与保存失败提示通过。
- tests/voyage-browser.js：V6 未完成进度迁移、星灯夜曲、后台暂停、跳过演出、划动/双指分离、分系统保存错误与恢复、异常新增字段清理、60星上限及减少动态效果通过。
- tests/finale-audio-browser.js：三灯演出自然结束，纸船一圈后恢复慢航；六种音色在关闭音效时不创建振荡器，开启后正常发声；无页面异常。
- 所有浏览器检查使用新建上下文与合成测试存档；游戏未请求外部资源。未验证物理 iPhone。
- 同一 Linux Chromium 软件渲染环境，390×844、DPR 2、触屏模拟，参考/整合版第三关各采样4.5秒：帧间隔中位109.3/120.6ms，JS绘制调用中位1.4/1.3ms，场景44个几何体、8张纹理。小样本及程序生成场景有波动，本轮不声称帧率提升或真机流畅度保证。
- 没有更改仙途运行目录、仙途下载 ZIP、Jev、#58 部署流程。
