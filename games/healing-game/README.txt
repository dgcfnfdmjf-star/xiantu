暮色浮岛 V9.4 · 月汐莲湾（2026-11-10）

基于 main a43994e（含 PR #72）的五章体验反馈修复。原岛、树、池塘、五章解锁顺序、无失败玩法与旧存档继续沿用。

交互与反馈
- 第一关统一提示「轻点蝴蝶」。种花成功后自动切回捕蝶；本关停止自动绕岛，手动旋转和缩放保留。蝴蝶接近镜头时按视深和屏幕尺寸平滑缩小、退隐，不推入原岛地物；不可见蝴蝶不能截获点击。
- 捕蝶进度一直是心动点数：普通蝶 +1、稀有蝶 +3。现在界面明确标点数，结局进度固定显示30/30，图鉴另列累计真实只数；旧 total 与 caught 不重算。修复29→32（以及29→30）触发结局时手势已清空、后续仍访问 stroke.n 的异常；点击和划动两条路径均覆盖。
- 第二关第一次点小猫后，固定任务文字和跟随猫咪的气泡明确提示「玩毛线球 · 再点抱抱」。沿用原来可立即再次点击的规则，没有新增等待；点错猫或空处有反馈，准备好的猫不会因隐藏时间窗失效，旧开场提示不再覆盖操作反馈。
- 进行中的猫咪章节每种毛色最多贡献4次抱抱，随后引导找其他毛色；新来的猫偏向较少陪玩的毛色。新字段 companions 只记录本程、明确重玩时清空；旧 total/caught/通关状态完整保留，旧图鉴不会锁死重玩，完成后的自由陪玩照常。
- 第三关所有颜色成功拾取均 +1 星光，偏爱色只额外庆祝，不影响充能。入口、任务卡与捕获反馈明确这一规则；新物种反馈与充能合并；开场、天气、成长、纸船和延迟发现通知遵守同一保护规则，不覆盖操作及满4点点灯指引。
- 星萤光晕增大变亮、轨道速度放缓，点击区域扩大；空点、未满灯、已亮灯都有温和解释。满4点时所有可点星灯同时出现明亮呼吸光晕与世界文字「点我点亮」，可点任意未亮灯，上方编号按钮仍可用。
- 第五关独立曲目《月汐摇光》：F大调、64 BPM、16小节的拨弦/长笛/钢琴合成配乐，复用原音频时钟、总线、音乐/音效开关与手势解锁。第三关仍用原《星灯夜曲》MP3及其网络失败合成回退；切关和异步解码不会串音。
- 潮璃莲月镜光束加粗、增亮；未对准时说明最短向左/右转几格，提示相应按钮并轻亮目标，正确对准后高亮送光按钮。失败不扣分、不改已得进度。
- 雨仅在第二关出现且较轻，离开立即清空；原睡猫及其命中代理只在第二关启用。第三关树上薄环的实际归属是成长奖励「云上星环」，现仅在未完成第三关显示，完成/离开即隐藏；第五关的月镜和月环保留。
- 结局对话框采用深色背景与不透明卡片；右上新增明确的「🗺 选关」文案，直接打开现有选关页，切换保留进度。标题、garden-version、手账页脚统一V9.4。

兼容边界
- healingGarden.journey.v1、healingGarden.kittens.v1、healingGarden.butterflies.v1 与 lotus.version=2 不变；新增 companions 字段缺失时安全初始化，不改旧猫图鉴或分数。
- 第五关六目标、首次奖励总计50、已完成练习隔离、第四关完成后解锁、47种手账保持。原岛与原池塘对象继续复用，无新岛盘。
- nightvoyage-bgm.mp3：2161729 bytes；SHA256 19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31。源与包内文件不变。
- 不修改仙途/Jev逻辑、不合并main、不部署。改动范围仅 games/healing-game 与用户授权的三层校验清单。

构建与校验（仓库根目录）
python3 games/healing-game/scripts/build.py
python3 games/healing-game/tests/test_package.py
node games/healing-game/tests/feedback-butterfly.cjs
node games/healing-game/tests/chime-rules.cjs
node games/healing-game/tests/lotus-rules.cjs
node games/healing-game/tests/save-guard-rules.cjs
node games/healing-game/tests/pointer-cleanup.cjs
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser

预览输出 games/healing-game/site/healing-game/index.html（1,009,664 bytes，未直接编辑）。V9.4包与包SHA256位于 games/healing-game/releases/，严格只含 healing-game/index.html 和 healing-game/nightvoyage-bgm.mp3；原 downloads/ 历史包保留。固定ZIP元数据使重复构建字节一致。保留V5源文件不修改；scripts/feedback-v94.py 与 scripts/butterfly-v94.py 提供检查唯一匹配的兼容补丁。
校验按PR #70流程依次生成/验证 xiantu-v2831-scroll/checksums.sha256、根 checksums.sha256、handoff-checksums.sha256（含根清单对应条目），使用 python3 scripts/checksums.py --write 后 python3 scripts/checksums.py。

真实浏览器验证
使用 scripts/browser-cli.sh 的独立会话、系统 Chromium /usr/bin/chromium 与8784本地HTTP服务。所有上下文全新、只用合成存档并阻止外网，不加载真实玩家数据。测试响应中的观测插桩不进入发布版。
运行 tests/ 下 journey、voyage、finale-audio、chapter4、nightvoyage-audio、shared-audio、music-lush、mode-reset、chapter3-feedback、feedback-v94、feedback-lifecycle、feedback-cat-save、wisp-geometry，以及 lotus-browser、lotus-finale、lotus-clipping、lotus-layout、lotus-carryover 浏览器套件。截图/原始日志保留于忽略的 output/playwright/healing-v94-validation、astra94-review、lotus94-own 与 chapter3v94。
Linux软件渲染与触屏模拟不代表实体手机帧率。原 clipping-browser.js 的第三关星萤间距 <0.7 为已知旧基线问题，本轮不降低断言、不扩展到无关几何修正；最新实测结果见PR验证记录。

本轮验证记录
- npm test：154个游戏回归脚本与限流、保存/错误、包装工具、打包套件全部通过；根Chromium浏览器66/66通过。
- 包测试6项（17段脚本解析、资源不外链、固定元数据重复构建）、蝴蝶反馈7项、风铃6项、月莲6项、保存保护8项、指针清理5项通过。
- 实际触屏覆盖猫咪首次/错误/再次点击、单毛色上限、旧图鉴100次仍可玩、刷新、完成与重玩；第三关六色各两次真实拾取、任意顺序3→1→2世界点灯、满星光升级提示优先、刷新与跨章生命周期通过。
- 第五关五套浏览器回归通过：六目标/50奖励、自然结局与手势、288姿态/120绽放/30合光/64叶舟/29归航/64相机、五视口六任务、420跨关灯笼帧及1680鸟/月环姿态。独立音频与第三关MP3共8种成功/失败/延迟解码上下文通过。
- 蝴蝶相机回归扫查15,552组合，10,368组可见，最近可见翼顶点视深3.207296（近面0.5），最大投影占短边25.902%；真实手动缩放/旋转后的390px截图最大翼跨度73.09px，无巨大近镜翅膀。
- 原 clipping-browser.js 本次也通过：第一关3056步、第二关3744步、第三关3664步；星萤中心最小间距0.869700。历史长时间基线曾低于0.7，本次保留原断言，短时通过不代表修复该旧问题。
- V9.4 ZIP：2409608 bytes；SHA256 8bd24f66c76749964ddd4f802e5d68ded7afaf93fd201af4a3b0c0c7791504a3。
- 星萤实体另以25,000步完整分离轴检测复核：693,234组网格配对，最终新增交叠0。以较大光晕增强可见性，原实体尺寸保留。真实旧版路径的树接触样本340，最终336；灯接触均0。历史接触未冒充本轮修复。
