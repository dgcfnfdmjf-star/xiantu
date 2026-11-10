橘猫坐姿样品
============

这是一只供造型评审的独立橘猫。游戏尚未加载它；没有替换其他毛色、
修改关卡或存档，也没有打包进线上游戏。当前样品为静态坐姿，无骨骼动画。

交付文件
--------
orange-cat.glb          模型和内嵌的 2048×2048 毛色贴图
orange-cat.blend        Blender 源场景；毛色贴图已打包，含灯光与渲染相机
orange-cat-preview.png  Blender Cycles CPU 渲染的正面坐姿图
preview-cat-orange.html 独立 Three.js 查看页，可拖动旋转、缩放和切换视角
build-orange-cat.py     原创网格、毛色绘制、导出和渲染的 bpy 构建脚本
orange-cat-metrics.json 构建时记录的面数、尺寸、GLB 大小和 SHA-256
vendor/three-r128/      固定版本的本地查看器依赖及 MIT 许可
tests/preview-cat-orange.cjs 独立模型与真实浏览器检查

造型与尺寸
----------
使用平滑网格、柔边虎斑和低对比毛色纹理，不使用粒子毛发或外部模型/照片。
毛色 #f6a457、肚皮 #ffe3c0、条纹 #d97f33、眼睛 #33262a，参考
../../source/healing-game-v5.html 的 KINDS.orange。渲染光照会影响屏幕颜色。

参考旧猫约 0.71 单位的模型高度及 1.2–1.4 的生成缩放（约 0.85–0.99）。
样品按这一场景尺度制作，具体包围盒记录在 orange-cat-metrics.json。
Blender 为 Z 向上、-Y 朝前；GLB 转为 Y 向上、+Z 朝前，脚底接近 Y=0。
只导出猫，地面、灯光和相机保留在 .blend 内的独立渲染集合中。
构建和测试均检查低于 50,000 个三角面；实际手机游戏帧率尚未测量。

本地看模型
----------
在本目录运行：
  python3 -m http.server 8000
浏览器访问：
  http://localhost:8000/preview-cat-orange.html

页面使用本目录的 GLB 和 JavaScript，无 CDN 请求，也不读写玩家存档。
鼠标拖动或触屏旋转，滚轮/双指缩放；也有正面、侧面、背面、重置按钮。
键盘方向键旋转，+/- 缩放，Home 重置。加载失败会明确显示静态 PNG 回退。
直接用 file:// 打开可能被浏览器的资源安全策略阻止，请使用上述本地服务。

重新生成
--------
从仓库根目录，使用 Blender 4.3.2（本次验证版本）：
  blender --background --factory-startup --python games/healing-game/assets/cats/build-orange-cat.py

脚本会覆盖本目录的 GLB、.blend、PNG 和 metrics；正式渲染为 1024×1024。
加 -- --draft 可输出较快的审稿图，但会覆盖上述文件，不用于最终交付。
中间贴图写入系统临时目录；可用 ORANGE_CAT_WORK_DIR 指定其他位置。
贴图内嵌后不依赖这个临时目录。源模型不含下载的第三方美术素材。

验证命令（仓库根目录）
----------------------
  npm test
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node games/healing-game/assets/cats/tests/preview-cat-orange.cjs

独立检查覆盖 GLB 内嵌资源/三角面数、实际拖动后的画面变化、缩放边界、
视角切换、手机横竖屏与双指操作、空闲/后台停止渲染、WebGL 上下文恢复、
加载失败回退，以及没有外部服务请求和存档访问。截图与报告写入忽略目录
output/playwright/cat-orange/。浏览器手机模拟不等于真机性能测试。
