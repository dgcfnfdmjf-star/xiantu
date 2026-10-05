# 仙途 V28.68.1 下载包

本分支用于分发修复后的部署文件，不是源码分支。

- xiantu-v2868.1-game.zip：解压后完整覆盖腾讯云原静态网站目录，保留原域名和路径。
- xiantu-jev-cloud-function.zip：上传到原 /api/jev-forge 对应的云函数，入口 index.main，保留原有环境变量。
- SHA256SUMS：用于校验下载完整性。

多实例共享限流需要另行配置 Redis；上传云函数本身不会自动创建 Redis 服务。
