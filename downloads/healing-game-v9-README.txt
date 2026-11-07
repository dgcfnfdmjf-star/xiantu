暮色浮岛 V9.0 · 月汐莲湾（2026-11-07）

本轮只有两项
1. 第一、二、四关升级为柔和的合唱铺底、竖琴与毡音钢琴，七秒等功率淡化和独立大厅混响。第三关原音乐不变。__musicLush.setStyle('classic'|'lush') 可在本次会话切换风格，不改存档，也不重启第三/第五关的MP3。
2. 第五关「月汐莲湾」：第四关完成后，从结局或旅程手账进入。每朵莲花收到三缕月光后盛开，无顺序要求、没有限时和失败状态；触摸花朵或点花名，也可使用键盘。六朵月莲加入手账，首次收藏共+30成长、首次完成+20，通关后可自由荡起涟漪，不重复奖励。

保存与音乐
旧V5—V8.1存档兼容，旧进度与奖励不变。第五关每缕光都保存，刷新或切关可以继续；保持同一浏览器、同一域名，才能继续原本地存档。
第三与第五关共用唯一 nightvoyage-bgm.mp3，保留循环、手势解锁、音乐开关、切关立即停止和加载失败时原合成夜曲回退。MP3原始字节不变：2161729 bytes；SHA256 19a90003e4b3b45c075b4c1da5a81341fddac954397d481e680a6ea3c1a5cb31。

上传腾讯云
下载 healing-game-v9-tencent.zip 并解压。部署包包含且仅包含：
- healing-game/index.html
- healing-game/nightvoyage-bgm.mp3

腾讯云 https://console.cloud.tencent.com/tcb → 静态网站托管 → 文件管理。
进入 xiantu-v2831-scroll/healing-game/，先备份旧文件，再上传这两个文件到同一目录；MP3文件名必须保持不变，类型使用 audio/mpeg。
不要覆盖仙途入口、根目录 index.html 或 game-v2762.html；不要上传 ZIP 作为网页。
访问：
https://xiantu-game-d9gy5heze4b039bf1-1255918878.tcloudbaseapp.com/xiantu-v2831-scroll/healing-game/index.html?v=9
浏览器标题应为「暮色浮岛 · 月汐莲湾 V9.0」。

本包不修改仙途、不更新Jev、不读写仙途存档。GitHub合并不代表腾讯云已部署，需实际上传文件后线上才更新。
浏览器验证使用系统Chromium触屏模拟，不是物理iPhone测试。
