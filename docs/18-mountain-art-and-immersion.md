# 山域美术与尺度 · 参考图复现试作

本次通过内置 imagegen 生成并接入可独立渲染的素材：cliff-atlas-v1.png、building-atlas-v1.png、mountain-distance-v1.png、foreground-atlas-v1.png、rock-detail-v1.png。源参考位于 `参考图片/`。原图保留在 Codex generated_images，项目副本均在 `sideview/assets/`。

## 可玩场景

- 七块山地的可走坐标横向放大 1.5 倍，负高程放大 1.25 倍；人物、移动速度不变。主要场景约 12,750 单位宽、5,250 单位高，不等同于全世界大小。
- 近景默认跟随，V 切换总览；镜头不改变实际地形。
- 山体轮廓纹理对齐同一份行走面；近处岩壁附加可重复细节材质，限制材质缓存为三块 1024×2048 画布。
- 建筑由现有宗门状态逐栋放置，可交互，废墟仍由模拟状态决定，不把建筑烘焙进背景。
- 远山作为背景；近处植被、建筑和通路为独立画面对象。
- **用户最终确认：前景只在屏幕下沿。** 近景前景裁切在画面底部 22%，中部人物、道路和洞口保持清楚，不再绘制顶部垂枝。低处为草丛，崖边为石块，高空为薄云、雾丝和偶尔经过的峰尖。
- 前景随镜头产生更快的视差；前景不参与碰撞与生态账本，也不会改变地图。

## 边界

这是基于参考风格的可玩美术试作，不是对参考图的逐像素复制。地形仍为人工布置，岩壁完整实体碰撞、局部纵深切换与精细角色动画尚未完成。素材中极小装饰字形不作为地名或世界事实。此前 R 切换整幅剖面的交互已停用。

## 生成提示词（内置 imagegen）

### cliff

Use case: stylized-concept. Create a production sprite atlas for a playable Chinese xianxia side-view game. Use the provided Tianxuan mountain reference only for the richly painted blue-green limestone, craggy mountain faces, pine roots, vines, and painterly realism style. NOT a poster or screenshot. Output a transparent PNG atlas, landscape 1536x1024 if possible, three equal vertical columns with generous fully transparent gutters between them. Each column contains one tall isolated grounded mountain/cliff mass: left a broad irregular mossy terraced granite face; middle a slender jagged green-blue pinnacle with a broad lower root; right a pale high-altitude rock mountain. Every mass has a nearly horizontal walkable grass-and-stone shelf about 12 percent from the top, subtly irregular rock peaks behind it, and long detailed rock reaching to the BOTTOM (NOT a floating island, NO tapered point in midair). Plenty of fine rock facets, cracks, mineral color and ivy on side walls; natural asymmetric silhouettes, not a square column or smooth cylinder. Each column entirely within its own third of the canvas, no overlap. Orthographic side elevation with slight depth visible on ledge top. Sparse small pines at ledge edges. No buildings, people, bridges, sky, clouds, text, lettering, labels, grid, frames, shadows outside silhouette, checkerboard. True transparent surroundings. Painted premium 2D game environment art, close-up detail crisp enough for walking at human scale.

### building

Use case: stylized-concept. Production game sprite atlas for a detailed painterly Chinese xianxia side-scrolling game, matching the blue-green mountain reference style, NOT a poster. Landscape 1536x1024 image, exactly FOUR separate buildings in a clean 2 columns by 2 rows arrangement. Each completely isolated on genuine transparent PNG background, no sky, no terrain, no trees, no labels, no text, no human figures, no frames or grid. Each fits well INSIDE its quarter with wide transparent margins and its foundation baseline close to 90% of that quarter height. Top left: a modest white-plaster timber inn with curved blue-grey tiled roofs, warm amber windows, small entrance veranda, detailed eaves. Top right: a red and black ornate mountain gate with open central passage, double curved roof and stone stairs. Bottom left: a luxurious two-storey sect hall with dark jade tiled roofs, red pillars, warm lanterns, stone terrace, readable front door at center. Bottom right: an elegant three-storey narrow pavilion / pagoda with flared eaves and lanterns. Orthographic FRONT ELEVATION with a little top roof visible, foundations horizontal, compatible with player walking horizontally in front. Intricate hand painted concept art, realistic miniature architecture, subtle aged materials, sunlit edges and soft shadows. Crisp at close zoom. Four buildings only and true alpha transparency, no painted checkerboard.

### background

Use case: stylized-concept. Wide panoramic BACKGROUND layer for a premium Chinese xianxia side-scrolling playable game, 2048x1024 landscape. Match the supplied mountain reference's exquisite painterly blue green realism. Vast receding karst mountains, sharp pale granite pinnacles, dark pine forests, deep mist-filled valleys, immense distant snowy high peaks. Dawn daylight, soft blue jade atmospheric perspective and sunlit cream rock edges. Many distinct overlapping depths. Top quarter open pale blue sky with delicate cloud wisps. Bottom quarter mist and distant forest valley, never black soil. All mountains distant and mid-distance, no close dark foreground wall. No architecture, bridges, roads, characters, text, labels, titles, logos or frame. No central single hero peak, balanced irregular panorama of a huge mountain range extending beyond both edges. This is not a map, poster or UI. Rich high-frequency rock and forest detail, dreamy yet geographical, highly immersive hand-painted fantasy environment.

### foreground

Use case: stylized-concept. Transparent foreground sprite atlas for a premium painterly Chinese xianxia side-scrolling game. EXACTLY four isolated foreground nature props laid out in a 2x2 grid with generous transparent gutters, 1536x1024 landscape. TOP LEFT: a dark gnarled pine trunk at left with elegant branches and dense deep-jade needles sweeping across upper edge, frame corner, open below. TOP RIGHT: hanging leafy vines and thin twisting branch descending from top right, airy open gaps. BOTTOM LEFT: a low dense cluster of ferns, grasses, tiny white flowers and mossy roots rooted on a horizontal baseline. BOTTOM RIGHT: a low asymmetric grouping of dark textured limestone boulders, ferns and trailing ivy on a horizontal baseline. Subjects each fit fully within their quarter. Rich hand-painted natural detail, finely resolved leaf silhouettes, deep blue-green shaded foliage, subtle warm rim light. Genuine transparent alpha background. No sky, landscape, colored fill, labels, letters, frame, grid, structures, people, checkerboard. Designed as near-camera occluding foliage, not a complete landscape.

### rock

Use case: stylized-concept. Seamless tileable close-up rock wall material texture for a hand-painted premium Chinese xianxia side-view game. Entire image 1536x1024 FILLED edge to edge with a nearly planar weathered cool grey blue-green limestone cliff face. Fine angular stone facets and small cracks, subtle pale mineral streaks, small sparse moss patches in fissures. Texture seen straight on orthographic, consistent even diffuse light, no horizon, no silhouette, no sky, no mountains as subjects, no large features, no trees, no branches, no leaves, no vines, no holes, no cave, no text. A stone wall SURFACE material, suitable repeating over large cliff polygons. Small intricate fissures at human scale, restrained painterly texture detail, natural variation without high contrast or obvious vertical stripes. Opaque image.

