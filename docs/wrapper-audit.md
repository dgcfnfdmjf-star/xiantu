# 函数包装与覆盖关系扫描器

参考用户提供的 `map-wrappers.cjs` 接入 `scripts/map-wrappers.cjs`，用于维护当前 40 脚本的全局函数关系。工具仅读取源码；默认报告到终端，指定输出参数时保存报告。不改变游戏运行时、技能、资源消耗或发布版本。

## 使用

从仓库根目录运行：

```sh
npm run audit:wrappers
npm run audit:wrappers -- --list-only
npm run audit:wrappers -- --all
npm run audit:wrappers -- --md output/playwright/wrapper-audit/current.md --json output/playwright/wrapper-audit/current.json
npm run test:wrappers
```

默认 HTML 为 `xiantu-v2831-scroll/game-v2762.html`，默认要求 40 个脚本。优先读取 `xiantu-v2762-loader` 中的字面量 JSON `var files` 数组，保留其顺序；不会把页面注释、示例字符串、资源预加载等 `.js` 字样当成加载脚本。

其他入口可传 `--html path`；未发现该加载器时，从静态 script src 标签取本地脚本，跳过远程 URL。`--root path` 指定脚本目录，默认是 HTML 所在目录。`--order path` 提供逐行脚本相对路径，允许空行和 `#` 注释，路径相对 root 解析。数量可用 `--expect N` 指定，或 `--expect 0` 关闭数量检查。

不执行 HTML、JS、动态表达式或提供的脚本。数量不符、重复路径、缺少文件、无效参数或输出覆盖输入时退出码为 1，不以成功状态输出不完整报告。JSON 与 Markdown 可同时保存，父目录会自动建立；两种报告不可指定同一路径。

## 相对参考版的修正

- 排除仅由数据别名触发的误报。参考版将 `player.hp`、`player.mp`、`player` 等非函数值误判为函数覆盖。
- 旧函数别名按识别到的词法作用域处理，退出作用域或重新赋值后不继续作为包装证据；局部 `window` 参数不会被误当作真正全局对象。
- 支持常见的 `old?.()` 可选调用识别，避免漏报已有委托调用。
- 输出保留脚本相对路径，子目录同名文件不会被合并成同一来源。行号仍对应原始源码。
- 原版“丢弃 N 层”“从不调用旧函数”改成待复核提示。捕获到别名但看不到直接调用，不足以证明旧功能丢失。
- 命令行参数、实际加载顺序、输出路径检查及失败状态更明确。

## 如何解读

`define`：检测到函数定义。
`wrap`：新函数中检测到对所捕获旧函数别名的调用或成员引用。
`wrap-decorator`：对已知函数的赋值表达式包含同名引用，可能是装饰包装。
`wrap?`：可见旧函数别名，但当前赋值表达式没有检测到直接使用，需人工追踪。
`overwrite`：对已知函数的另一处定义或赋值；可以是有意替换、恢复旧值或清理回调。

这些分类是启发式候选。不能证明调用一定执行，成员引用不一定是调用；出现 `overwrite` 也不一定意味着旧包装失效。文件排序是加载顺序，同一文件里使用源码顺序，**不是运行时调用顺序**。函数体内、条件分支内和延迟回调内的写入都会列出，不代表页面启动时已执行。

本次在 V28.68.46 代码上扫描：40 个脚本，1427 个检测到的函数/函数属性，默认展示 92 项含包装或覆盖的关系；6 项包含复核提示：`normalizePlayer`、`updatePetPanel`、`createDefaultPlayer`、`canUpgradeArtifact`、`resizeWorldCanvas`、`COMBAT_FINISH_V2764.deferredAfterReturn`。

示例：`normalizePlayer` 的部分模块先声明 `wrapped` 再赋回 `window.normalizePlayer`，旧函数调用在 `wrapped` 的定义体内。仅看最后的赋值就下“没有调用旧函数”的结论会误判。`deferredAfterReturn` 本身是可清空的一次性回调，覆盖提示也不等于业务逻辑被丢弃。这些示例说明不能依据报告批量删除包装或自动重构。

## 识别边界

这是无第三方依赖的静态启发式工具，不是完整 JavaScript 解析器。方括号属性、对象字面量批量补丁、Object.defineProperty、eval、模板表达式里的代码、复杂提升/解构/作用域、多级别名、计算属性和动态构造的名称可能漏报或误报。模板内容与注释/字符串会屏蔽，正则与除法依赖上下文猜测。需要确认运行路径时，应补充实际调用检查和相关游戏回归。

## 验证

`tests/map-wrappers.cjs` 的 6 项测试覆盖真实 loader 数组优先级、数据误报、别名作用域/重赋值/全局根遮蔽、可选调用、源码行号、显式顺序与同名文件、参数/数量/缺失文件、输出覆盖保护、静态 script 标签回退与重复路径。

工具测试接入 `npm test`，也可通过 `npm run test:wrappers` 单独运行。诊断报告放在忽略目录 `output/playwright/wrapper-audit/`，不进入游戏部署 ZIP。当前网页资源与 V28.68.46 部署包保持一致；使用此开发工具无需重新部署游戏。
