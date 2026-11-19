# 腾讯云部署下载

当前提供 **仙途 V28.68.124** 网页完整包。解压后，游戏入口与仓库首页的版本均为 V28.68.124。

[下载 V28.68.124 完整包](xiantu-v2831-scroll.zip) · [SHA-256 校验值](SHA256SUMS.txt)

如果仓库为私有，请先登录有权限的 GitHub 账号。也可以打开本目录中的 ZIP 文件，点击下载原始文件按钮。

更新后请关闭旧游戏窗口，保留网站数据，重新打开游戏读取进度。

部署前请核对 [浏览器与CDN缓存、压缩及上传步骤](../docs/cloudbase-static-cache.txt)。

## 更新原腾讯云环境

1. 在旧游戏的存档管理中导出 JSON 备份，保留浏览器网站数据。
2. 下载并解压 `xiantu-v2831-scroll.zip`，得到同名文件夹，里面直接包含 `index.html`、`game-v2762.html`、脚本、样式与 `art` 资源目录。
3. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)，选择原游戏环境，进入「静态网站托管 → 文件管理」。
4. 在托管根目录上传整个 `xiantu-v2831-scroll` 文件夹并覆盖同名文件；如果已经进入云端同名目录，就上传本地文件夹里面的内容，避免套两层目录。上传实际文件，不要只上传 ZIP。
5. 等待所有文件完成后，打开原 `/xiantu-v2831-scroll/` 游戏网址，Ctrl+F5 刷新。角色设置中的版本应为 **V28.68.124**。

部署层级：

```text
静态托管根目录/
└── xiantu-v2831-scroll/
    ├── index.html
    ├── game-v2762.html
    ├── xiantu-v2762.css
    ├── 其余脚本与资源
    └── art/
```

本包是完整网页资源，无需安装 Node.js，也无需先构建。**从 V28.68.70 更新到本包，无需重传 Jev。** 本轮只改静态游戏，云函数包仍是 V28.68.70 的接口安全版本；如果之前还没更新接口加固，可另用 [现有云函数包](xiantu-jev-cloud-function.zip)，保留 `index.main` 入口与原环境变量。详见 [本轮场景粒子](../docs/scene-particle-followup.txt)、[此前开场体验](../docs/launch-experience-review.txt)、[地图特效](../docs/map-effects-phase1.txt)、[任务指引](../docs/playtest-ch7-followup.txt)、[此前安全与操作修复](../docs/playtest-safety-followup.txt)、[南域整景](../docs/south-region-scene.txt)、[地图与操作优化](../docs/map-controls-followup.txt)、[启动与兼容优化](../docs/readiness-review-v286899.txt)、[东、西域整景](../docs/wild-region-scenes.txt)、[青云村优化](../docs/village-sheet.txt)、[宗门整景](../docs/sect-panorama.txt)、[可走动室内](../docs/walkable-interiors.txt)、[夜景说明](../docs/night-lights.txt)、[手机横屏说明](../docs/mobile-landscape.txt)、[突破与结算说明](../docs/breakthrough-depth.txt)、[突破平衡评估](../docs/breakthrough-balance-v286883.txt)、[山河图与采集说明](../docs/scroll-map-landmarks.txt)、[地图边缘与寻路说明](../docs/map-edges-routes.txt)、[宗门地图与行路说明](../docs/map-courts-labels.txt)、[稳定性与加载说明](../docs/reliability-polish.txt)、[物品与背包说明](../docs/inventory-safety-bag.txt)、[建筑点击说明](../docs/building-tap-entry.txt)、[指引与统计说明](../docs/onboarding-local-stats.txt)、[扩界与寻路说明](../docs/map-expansion-navigation.txt)、[冰系状态说明](../docs/ice-state-finale.txt)、[启动优化说明](../docs/startup-loading.txt) 和 [接口兼容说明](../docs/security-hardening.txt)。 包内不含云函数代码、QA、源码仓库、真实存档或凭据。本次提供部署文件，尚未替用户上传腾讯云。若使用全新环境，Jev 服务需另按仓库的云函数接入说明配置。

打包使用 `npm run package:game`，逐文件比对 ZIP 内容与当前源码；校验值见本目录 `SHA256SUMS.txt`。解压后的文件夹名称固定保留 `xiantu-v2831-scroll`。

## 暮色浮岛 V8.0 晨风铃谷

完整游戏下载：[healing-game-v8-tencent.zip](healing-game-v8-tencent.zip)。新增第四关：第三关通关后，听风铃并奏回三段旋律；六枚新音符加入手账，支持逐音存档和自由合奏，兼容 V5—V7 进度。

解压得到 `healing-game/index.html`，只覆盖 `xiantu-v2831-scroll/healing-game/` 内的同名文件。无需修改仙途或 Jev；GitHub 合并不会自动部署腾讯云。

[更新与上传步骤](healing-game-v8-README.txt) · [SHA-256](healing-game-v8-SHA256SUMS.txt) · [源码与检查](../games/healing-game/README.txt)

## 暮色浮岛 V7.0 星灯夜航

独立游戏下载：[healing-game-v7-tencent.zip](healing-game-v7-tencent.zip)。在 V6 基础上接入星灯夜曲、划动拾光、光轨与灯座蓄光、三灯演出、纸船巡航和夜航记事，保留旧收藏与成长进度。

解压得到 `healing-game/index.html`；只覆盖 `xiantu-v2831-scroll/healing-game/` 内的同名文件。不要覆盖仙途或根目录入口。GitHub 合并不会自动更新腾讯云。

[更新内容与部署步骤](healing-game-v7-README.txt) · [SHA-256](healing-game-v7-SHA256SUMS.txt) · [源码与构建方法](../games/healing-game/README.txt)
