# 腾讯云部署下载

当前包：**仙途 V28.68.58**，新增游历一并调查、圣念巡天、临阵换宠和战报条数提示，并包含归墟断桥三形态首领、六种机制精英悬赏、宗主结算与预览修复，以及此前全部优化。

[下载 V28.68.58 xiantu-v2831-scroll.zip](https://github.com/dgcfnfdmjf-star/xiantu/raw/refs/heads/codex/sect-settlement-polish/downloads/xiantu-v2831-scroll.zip)

如果仓库为私有，请先登录有权限的 GitHub 账号。也可以打开本目录中的 ZIP 文件，点击下载原始文件按钮。

## 更新原腾讯云环境

1. 在旧游戏的存档管理中导出 JSON 备份，保留浏览器网站数据。
2. 下载并解压 `xiantu-v2831-scroll.zip`，得到同名文件夹，里面直接包含 `index.html`、`game-v2762.html`、脚本、样式与 `art` 资源目录。
3. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)，选择原游戏环境，进入「静态网站托管 → 文件管理」。
4. 在托管根目录上传整个 `xiantu-v2831-scroll` 文件夹并覆盖同名文件；如果已经进入云端同名目录，就上传本地文件夹里面的内容，避免套两层目录。上传实际文件，不要只上传 ZIP。
5. 等待所有文件完成后，打开原 `/xiantu-v2831-scroll/` 游戏网址，Ctrl+F5 刷新。角色设置中的版本应为 **V28.68.58**；三万年仙魔战可进入归墟断桥，探索手册可打开四域凶煞悬赏榜。

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

本包是完整网页资源，无需安装 Node.js，也无需先构建。**从V28.68.56更新到本包，无需重传Jev云函数。** 若尚未部署上一轮小时/每日限流，可另行更新已有云函数包： [下载云函数包](xiantu-jev-cloud-function.zip)，在原云函数更新代码，入口保持`index.main`，保留现有环境变量；多实例需配置共享Redis，详见根README。 包内不含云函数代码、QA、源码仓库、真实存档或凭据。本次提供部署文件，尚未替用户上传腾讯云。若使用全新环境，Jev 服务需另按仓库的云函数接入说明配置。

打包使用 `npm run package:game`，逐文件比对 ZIP 内容与当前源码；校验值见本目录 `SHA256SUMS.txt`。解压后的文件夹名称固定保留 `xiantu-v2831-scroll`。
