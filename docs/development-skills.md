# 开发技能与首轮验证（2026-10-05）

## 已保存的技能

| 技能 | 来源 | 用途 |
| --- | --- | --- |
| `.agents/skills/xiantu-web-game` | 为本项目编写 | 地图、战斗、存档、素材修改的开发和发布流程 |
| `.agents/skills/playwright` | OpenAI 官方 skills 仓库 | 真实浏览器的快照、点击、输入、截图和诊断 |
| `.agents/skills/xiantu-canvas-performance` | 为本项目编写 | Canvas 测量、暂停恢复、DPR 和缓存检查 |

官方来源固定在 [openai/skills@49f948f](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright)，原技能与许可证均保留。该提交的官方目录没有独立的 develop-web-game 或 Canvas 性能技能，因此另两项明确为项目专用工作流，并非冒称官方插件。

根目录 AGENTS.md 指向这些技能。它们是仓库内的开发指令，不是面向玩家的游戏技能，也不需要打包到网站。`scripts/browser-cli.sh` 固定使用 Playwright CLI 0.1.22 并将缓存放到可写位置；官方原始脚本保留原样。当前会话已按官方 CLI 技能完成实际浏览器操作。

## 本轮执行结果

- `npm test`：19 个游戏回归脚本通过，另有 3 个限流测试通过。
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`：7 个浏览器测试通过。
- 官方 CLI 实际操作：打开入口、跳过动画、填写新角色名、开始游戏、返回地图、打开角色面板、返回游戏、键盘移动、切换横竖屏、截图。
- 阻断全部非本地网页请求，未调用付费 Jev；控制台唯一资源错误来自被主动阻断的 Jev 请求。使用临时测试角色，未读取真实玩家存档。

## Canvas 测量

条件：云端 Linux、系统 Chromium 无头模式、手机尺寸模拟、DPR 2；游戏识别为 mobile。南域初始地图，开始测量时 2 个怪物，素材预热完毕。本地 HTTP，不限速。通过只存在于临时浏览器内的函数包裹计时，不修改发布代码。

| 场景 | 样本/检查 | 结果 |
| --- | --- | --- |
| 390×844 静止地图，3 秒 | 90 次 drawFlatWorld | JS 绘制耗时中位数约 0.4 ms，P95 约 1.0 ms |
| 同一静止场景 | 89 个绘制间隔 | 中位数约 33.3 ms，P95 约 34.3 ms，符合手机 30 FPS 上限 |
| 同一静止场景 | 90 次 updateFlatWorld | JS 更新 P95 约 0.1 ms；接近计时分辨率，不代表没有成本 |
| 按住右方向键 0.8 秒，合计采样 2 秒 | 60 次绘制 | x 从 540 移到约 739.975，仍为 exploring；绘制 P95 约 1.8 ms |
| 角色面板打开，稳定后观察 1 秒 | draw 调用计数差值 | 0；地图 RAF 为 null，保留已有低频恢复检查 |
| 竖屏→横屏→竖屏 | 画布尺寸与数量 | 390×844→844×390→390×844；画布数量保持 9；恢复后 RAF 有效 |

截图已查看；原始 CLI 输出和截图在忽略目录 `output/playwright/skills-check/`。截图为 standing.png 和 landscape.png；测量为 standing.json.txt、movement.json.txt、overlay.json.txt、landscape.json.txt 和 restored.json.txt。

复现：在根目录 `PORT=8767 npm start`；使用 CLI 打开本地 game-v2762.html，启用手机视口并拦截非本地请求；通过页面入口新建临时角色。用 performance.now 在 drawFlatWorld 和 updateFlatWorld 前后采样，固定场景和时长；打开角色面板比较绘制调用次数；再用 CLI resize 检查两种方向。CLI 所需 Chromium 路径可通过 --config 指定，示例配置已保存在本轮原始证据目录 cli.json。

## 判断与下一步

当前轻量场景没有证据支持重写渲染引擎或改变现有帧率策略，已有暂停地图绘制的机制有效。本轮完成了技能接入与性能基线，没有为了“优化”而改动游戏运行代码，网站和 Jev 均无需重传。

后续具体性能优化应在大型战争场景、更多怪物、真机 iPhone/Safari 上复测，并分别定位 JS、GPU 和资源解码成本；后台/前台切换、长期内存增长也需专项测量。本轮的 JavaScript 耗时不代表 GPU 合成耗时，短时云端模拟不能证明真机不会卡顿。

## 游戏数值分析补充

已接入项目定制技能 `.agents/skills/xiantu-game-balance/SKILL.md`，通过 AGENTS.md 在伤害、成长和经济任务中触发。复现命令：`node scripts/analyze-balance.cjs`；参见 [首轮数值分析](game-balance-baseline.md)。该技能不是官方插件，接入不代表已经完成调参或完整战斗胜率验证。
