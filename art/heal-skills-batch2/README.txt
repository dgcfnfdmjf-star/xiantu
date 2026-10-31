仙途 · 治疗技能第二批资源预览
日期：2026-10-31
分支：codex/heal-skills-batch2
基线：main 28b324f5193a1f0e0d68df93a56e21f1e1fce04e（V28.68.93）
状态：用户已确认接入；已集成到 V28.68.94，上传分支待合并。尚未部署腾讯云。

打开 evidence/heal-skills-preview.html 即可离线试播，不需要运行游戏或读取存档。
也可在仓库根目录启动本地HTTP服务，打开 art/heal-skills-batch2/preview/index.html。

本批三招
灵泉归元：青绿生命泉、钴蓝灵力泉分别归身；实际回血与回蓝各自控制成功层。
逆命回元：碎玉归印；普通薄金缝、危急增强金缮，分支必须来自施法前血量判定。
起死回生：青金羽扇收束，一次大量恢复；不表示复活，也不产生额外治疗。
青莲护心和莲华济世仍留下一批，需要单独处理一次承伤护持状态。

资源
3套独立材质母版，各有一张6格关键帧；全部原始源格通过12%边界检查后才切片。
24张透明PNG序列图，共144帧（含HP/MP拆分及普通金缮分支）。
四阶段每招分别4/8/6/6帧；body使用同一已配准主体的渐显，保留另一主体姿态作源稿比较，不交叠两套骨架。
12张基础四阶段图供通用预览；灵泉实际按8张HP/MP分层图采样，逆命普通分支另有4张细金缝图。
灵泉用相邻有色材质归属传播给中性高光，保持蓝色水珠的亮点属于蓝色层；不按屏幕左右简单裁切。
PNG总大小3,437,104字节，离线HTML为4,794,902字节。
全量预览图集解码像素预算约36MiB（不含浏览器额外开销）；接入时应按需加载分支，不能以此代替手机性能测量。

校验与复现
node scripts/build-heal-skills-batch2-vfx.cjs
node scripts/check-heal-skills-batch2-vfx.cjs
node .agents/skills/creating-game-combat-vfx/scripts/validate_effect_manifest.mjs art/heal-skills-batch2/preview/effect-manifest.json
XDG_CACHE_HOME=/tmp/xiantu-font-cache node scripts/render-heal-skills-batch2-evidence.cjs
浏览器入口和命令见 evidence/browser-results.json；脚本为 evidence/browser-check.js。
27项浏览器检查通过：播放/暂停/逐帧、HP/MP、普通/危急、取消与到期、减少动态、390×844和844×390、缺失/损坏资源隔离、离线预览文件。
采样器检查逐毫秒验证只读、面部/血条/敌方区域避让、各结果通道交叉淡化和清场；真实游戏战斗验收见 docs/vfx/heal-skills-batch2-integration.txt。
全导出帧白色覆盖峰值：灵泉3.40%，逆命1.24%，羽光1.35%，低于6%上限。

视觉审阅
evidence/contact-sheet.png：三招四阶段。
evidence/result-variants.png：回血回蓝、只回蓝、无恢复、危急分支。
evidence/*-overlaps.png：每招三组相邻层交接的起/中/末时刻，共27次交叠采样。
evidence/design-comparison.png：已确认分镜、独立母版、旧共享莲花、新主体在同一实景上的对照。
主体保留彩色材质和墨边，头部、上方血条、敌人不受遮挡；交接为单次收束，没有重叠完整主体或残留地圈。
最终照片式概念稿与小尺寸运行帧的密度不同，以实景试播为资源确认依据。

接入契约
权威战斗逻辑提供 actualHeal、actualMpRestore、施法前 emergency 和本次施法身份；不要用动画反写HP/MP或改变500ms敌方调度。
保持既有耗蓝/恢复量/随机数/回合/存档规则。需要真实战斗、连续施法、轻量画质、隐藏退出和销毁检查。
已接入网站目录并同步版本、下载包和回归测试；按既有授权上传GitHub并创建PR。
main合并、腾讯云部署仍单独处理；本批没有修改Jev。
