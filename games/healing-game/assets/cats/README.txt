四种 Blender 坐姿 / Walk 猫 · 暮色浮岛 V9.5
=================================

PR #74 从已通过的橘猫样品扩展为橘猫、三花猫、小煤球和狸花猫，接入第二关。
本次在已审坐姿上加入同一套轻量骨骼、Walk 和内侧修形；没有粒子毛发。

每个毛色的交付文件
------------------
{orange,calico,black,tabby}-cat.glb          内嵌 1024×1024 JPEG 毛色贴图
{orange,calico,black,tabby}-cat.blend        Blender 场景与打包纹理
{orange,calico,black,tabby}-cat-preview.png  实际 Blender 正面渲染
{orange,calico,black,tabby}-cat-metrics.json 构建时记录的面数、尺寸、大小和 SHA-256
build-cats.py                             公用 bpy 建模、绘色、导出和渲染流程
cat_atlas.py / cat_uv.py                  原配色烘焙、UV 展开修复和覆盖检查
update-preview.py                        将四个 GLB 同步为查看页内嵌快照
build-orange-cat.py                       兼容原橘猫构建入口
preview-cat-orange.html                   四猫独立 Three.js 查看页（保留原文件名）
vendor/three-r128/                        固定版本依赖及 MIT 许可

造型与颜色
----------
保留已审头身比例、坐姿、卷尾和毛色方向；减面后的运行网格使用平滑法线。
原 35,280 三角面源网格与原贴图保留在 .blend 的隐藏源集合中，运行 GLB 只含
优化后的网格。每只 7,430 三角面（原 6,886，增加 7.9%）；游戏坐姿 6 次、
Walk 8 次模型绘制调用；
本目录 PNG 也渲染实际运行网格。原外侧 5,254 个毛皮三角面、眼睛、眼睛高光
均保留，只简化鼻子/胡须/细线的小网格以容纳隐藏的腿部和接触面。
四只 GLB 合计 1,143,052 字节（原静态版 1,149,404）；文件大小和哈希见各 metrics，测量结果见 VALIDATION.txt。
柔边毛色以原 source/healing-game-v5.html 的 KINDS 定义为准：
- orange：#f6a457 / 肚皮 #ffe3c0 / 条纹 #d97f33 / 深色眼睛 #33262a。
- calico：#fff4e6 / 肚皮 #ffffff / 花斑 #e58f45 和 #3b3238 / 深色眼睛。
- black：#35303c / 肚皮 #4a4452 / 无花纹 / 黄色眼睛 #ffe27a。
- tabby：#b09a80 / 肚皮 #eadfce / 条纹 #5c4c40 / 绿色眼睛 #4f7a3a。

光照会影响屏幕观感。没有下载的模型、照片或纹理素材。
GLB：Y 向上、+Z 朝前，脚底接近 Y=0，高约 0.885 单位。
游戏按旧猫大小归一化到原 1.2–1.4 缩放下的约 0.85–0.99 单位高度。
GLB 只含猫；地面、灯光和相机保留在 .blend 的独立渲染集合中。
具体面数、包围盒、资源大小和哈希以各 *-metrics.json 为准。

体积与运行
----------
原橘猫 GLB 2,932,264 字节，使用 2048px PNG。现对已审坐姿减面，转移平滑
法线并使用 1024px JPEG 毛色。Walk 保留原 JPEG 字节；新内侧使用同配色的
256px JPEG，避免脚掌封口大色块。采用有界位置/UV/法线量化及官方 meshopt
无损压缩；查看页和游戏均附带本地解码器，贴图内嵌，无 CDN 请求。原 V9.5 已修复后脚和
尾巴的 UV 重叠；Walk 继承原贴图和展开，只做有界坐标量化，独立检查仍为零冲突。
最终大小、加载与渲染对比、视觉检查及测量限制见 VALIDATION.txt。
游戏对同毛色实例复用模板几何体、材质与纹理，不逐猫重复下载。
小雪团和稀有星光猫的原造型及规则保留。模型加载失败时游戏继续显示原代码猫。
.blend、预览 PNG 和本查看页均不进入游戏包；只打包四个 GLB。

本地看模型
----------
在本目录执行 python3 -m http.server 8000，打开：
  http://localhost:8000/preview-cat-orange.html
可加 ?cat=calico、?cat=black 或 ?cat=tabby 直接选毛色。
页面内切换四只猫和坐姿/Walk，拖动/触屏旋转，滚轮/双指缩放；提供正面、侧面、背面、重置。
查看页内嵌四只运行 GLB 的一致快照，并复用本目录已固定版本的 vendor 脚本。
打开后切换猫不需要再请求独立 GLB；嵌入数据与各 GLB 的一致性由测试检查。
键盘方向键旋转，+/- 缩放，Home 重置。加载失败明确显示对应猫的静态 PNG。
只请求本目录资源，不读写玩家存档。请通过 HTTP 打开而非 file://。

重新生成
--------
Walk 构建使用 Blender 4.3.2、Python numpy/scipy、Node 24，在仓库根目录执行：
  python3 games/healing-game/scripts/cat-walk/build.py --output-dir /tmp/cat-walk-build
该命令从 main 8812ff5 提取已审坐姿输入，仅写指定暂存目录，不覆盖正式资产。
也可传 --kind orange 和 --baseline-dir 指定已提取的原始输入。
每只随后执行（将 orange 换成其他毛色）：
  blender -b -t 3 --python games/healing-game/scripts/cat-walk/save-blend.py -- --kind orange --baseline-dir /tmp/cat-walk-build/baseline --output-dir /tmp/cat-walk-build
生成 .blend、正面 PNG 和 Walk 的 0/12/24/36 帧 PNG。Blender 源文件的 -1 帧
为坐姿，0–47 帧为 30 FPS、1.6 秒 Walk；原高模和坐姿输入保留在隐藏集合。
浏览器验收后再将暂存 GLB / .blend / PNG 放回本目录并同步：
  python3 games/healing-game/assets/cats/update-preview.py
  python3 games/healing-game/scripts/build.py
旧 build-cats.py / build-orange-cat.py 仍是静态建模入口，会覆盖文件；需要 Walk
时使用上述新流程。关键帧在 walk-preview/，历史 walk-candidate/ 保留原候选证据。

动画与接线
----------
四足交替踏步、髋/膝/跗关节弯曲、身体轻起伏、头尾摆动。接触面的默认位置
收在原身体内部；Walk 时恢复圆润内侧，并用四个周期修形保持后腿体积。
停止 Walk 立即恢复原坐姿，避免不适用于该接触网格的半权重混合产生穿地。
步幅 0.40 模型单位；游戏用原速度、模型归一化比例和猫尺寸计算 AnimationMixer
的 timeScale，不改变 .55 / 1.1 / .75 / 1.0 这些移动数值。
游戏加载时预计算坐姿/Walk 两份固定接触面，避免每帧重复做常量修形；
后腿四个周期修形继续动态播放。两份固定面在同毛色实例间共享，不影响 GLB
在普通查看器中的完整动画。每只实例独有骨骼和 mixer；hop/hug/sleep/play
不走路。加载失败仍保留程序猫。走路外沿提供给原有避让，+Z 朝向和地面轴心不变。

验证（仓库根目录）
------------------
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/assets/cats/tests/preview-cat-orange.cjs
覆盖四种 GLB 的内嵌资源/面数、导出后毛皮 UV 重叠、查看页快照一致性、
实际旋转/缩放、切换与异步竞态、失败回退、
桌面和手机横竖屏、空闲/后台渲染、上下文恢复以及资源释放。
截图和报告写入忽略目录 output/playwright/cat-variants/。
游戏交互与网络加载测试另见 ../../tests/cat-models-browser.cjs 和
../../tests/cat-models-performance.cjs。浏览器触屏模拟不代表真机帧率。
