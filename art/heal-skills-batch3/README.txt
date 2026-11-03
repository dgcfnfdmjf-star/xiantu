青莲护心、莲华济世：第三批治疗技能资源预览
2026-11-03；基线 V28.68.106 / 3f84c4ae843c385f0868512dbb4575125826cace。
状态：设计和资源预览已确认，用户回复“接入”后完成运行时接入。交付记录见 docs/vfx/heal-skills-batch3-integration.txt。

直接查看
evidence/heal-guard-preview.html：独立 HTML，下载后可离线打开，无外部依赖。
evidence/heal-guard-preview.mp4：9 秒，两招同时演示，先正常速度、后半速。
preview/index.html：开发预览页面，需连同目录内资源一起提供。
视频与页面使用真实 PNG 序列叠加原战场截图，治疗、护持事件为模拟输入，不是正式游戏实战录像。

资源
两招分别生成独立母版、8 格关键画面；透明原图保存在 source/。
母版和关键帧通过原始格子 12% 安全边距检查后才切图；不合格原图保留并重新生成。
12 张透明 PNG 横条，76 帧，总计 1,748,788 字节。
每招 4 帧起势、8 帧主体、6 帧归身、6 帧余韵、8 帧护持、6 帧消耗。
固定自身锚点，source-over 混合；使用原画切片、透明度过渡和轻微刚性转动，没有程序绘制特效主体。
持续护持的分离瓣片轻微倾转呼吸；不会表现成完整球形护罩。

检查
node scripts/check-heal-skills-batch3-vfx.cjs：80 组资源与状态采样检查通过。
清单校验：2 招通过；preview.js 语法检查通过。
Chromium：38 项检查通过，无页面异常。结果见 evidence/browser-results.json。
覆盖满血、缺血、护持保留、提前消耗、不重生、强状态替换、离场清理、暂停/重播/步进、低画质、减少动态、缺图和无效清单隔离。
390×844、844×390 横向无溢出，明暗背景可辨；脸部、血条和敌人保持可见。
原图及每帧边界、透明度、颜色、哈希见 asset-audit.json；最终帧近白色占比不超过 0.14%。
帧间交接见 evidence/*-overlaps.png，来源对照见 comparison.png 和 design-comparison.png。
上方为资源阶段记录；后续真实战斗事件绑定、战报模式与浏览器耗时验证见接入记录。实体旧手机仍需实机验证。

重建
node scripts/build-heal-skills-batch3-vfx.cjs
node scripts/check-heal-skills-batch3-vfx.cjs
node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/heal-skills-batch3/preview/effect-manifest.json
XDG_CACHE_HOME=/tmp/xiantu-fontcache node scripts/render-heal-skills-batch3-evidence.cjs
XDG_CACHE_HOME=/tmp/xiantu-fontcache node scripts/render-heal-skills-batch3-evidence.cjs --video
浏览器检查源：evidence/browser-check.js，由 scripts/browser-cli.sh run-code 在本地预览页执行。

接入约束
真实治疗结果 actualHeal 与护持状态独立；满血省去治疗主体，仍可建立护持。
护持无固定时长；弱状态不能覆盖强状态，提前消耗后不能在动画结束时重生。
正式接入应由现有 guardsV2785 状态及事件驱动，不能用预览定时器代替真实结算。
需要补测玄罡护体剑切换、同强度刷新、零伤害、死亡/换敌/隐藏、试剑坪和正式战斗两种模式。
本文件上方检查为接入前的资源阶段记录；运行时检查、版本、包与提交状态见接入记录。Jev 未修改。
