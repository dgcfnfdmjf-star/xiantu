# 腾讯云部署下载

当前包：**仙途 V28.68.48**，新增清风剑诀、剑气纵横、破甲剑罡独立特效，包含最新教程、法宝／灵宠批量养成、分解、放生返还和捕捉中断修复，以及此前接入的技能特效。

本批部署包位于技能第二批开发分支；main 合并状态请查看对应合并请求。

[下载 V28.68.48 xiantu-v2831-scroll.zip](https://github.com/dgcfnfdmjf-star/xiantu/raw/refs/heads/codex/sword-skills-batch2/downloads/xiantu-v2831-scroll.zip)

如果仓库为私有，请先登录有权限的 GitHub 账号。也可以打开本目录中的 ZIP 文件，点击下载原始文件按钮。

## 更新原腾讯云环境

1. 在旧游戏的存档管理中导出 JSON 备份，保留浏览器网站数据。
2. 下载并解压 `xiantu-v2831-scroll.zip`，得到同名文件夹，里面直接包含 `index.html`、`game-v2762.html`、脚本、样式与 `art` 资源目录。
3. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)，选择原游戏环境，进入「静态网站托管 → 文件管理」。
4. 在托管根目录上传整个 `xiantu-v2831-scroll` 文件夹并覆盖同名文件；如果已经进入云端同名目录，就上传本地文件夹里面的内容，避免套两层目录。上传实际文件，不要只上传 ZIP。
5. 等待所有文件完成后，打开原 `/xiantu-v2831-scroll/` 游戏网址，Ctrl+F5 刷新。角色设置中的版本应为 **V28.68.48**；法宝出现一键强化，百艺工坊兽丹卡片出现 ×1／×5／全部。

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

本包是完整网页资源，无需安装 Node.js，也无需先构建。**此次无需更新 Jev 云函数。** 包内不含云函数代码、QA、源码仓库、真实存档或凭据。本次提供部署文件，尚未替用户上传腾讯云。若使用全新环境，Jev 服务需另按仓库的云函数接入说明配置。

打包使用 `npm run package:game`，逐文件比对 ZIP 内容与当前源码；校验值见本目录 `SHA256SUMS.txt`。解压后的文件夹名称固定保留 `xiantu-v2831-scroll`。
