extends Node2D

const Traveler = preload("res://scripts/traveler.gd")
const SAVE_PATH := "user://layered-world-v2.json"
const ROCK = preload("res://assets/ink-rock.png")
const ATLAS = preload("res://assets/ink-atlas.png")
var ROUTES: Array = []
var STAIRS: Array = []
var SITES: Array = []
var ledges: Array = []
var lands: Array = []
var cavities: Array = []
var solid_polygons: Array[PackedVector2Array] = []
var void_polygons: Array[PackedVector2Array] = []
var surface_holes: Array = []
var route_overlay := false
var collision_debug := false
var overview := false
var paused := false
var cave := false
var cave_name := ""
var captures := false
var player: Node2D
var camera: Camera2D
var hud: CanvasLayer
var status: Label
var prompt_label: Label
var banner: Label
var energy_bar: ProgressBar
var nearest := -1
var stair_index := -1
var stair_distance := 0.0
var message_time := 0.0
var elapsed := 0.0
var autosave := 0.0
var discovered: Array = []
var world_font := SystemFont.new()
var scenery: Node2D
var far_layer: Node2D
var paper: ColorRect
var mesh_count := 0

func point(raw: Array) -> Vector2:
	return Vector2(float(raw[0]),float(raw[1]))
func _ready() -> void:
	world_font.font_names = PackedStringArray(["Songti SC", "Noto Serif CJK SC", "SimSun"])
	_load_layout()
	_build_background()
	_build_mountains()
	_build_scenery()
	player = Traveler.new()
	player.z_index = 20
	add_child(player)
	camera = Camera2D.new()
	add_child(camera)
	_build_ui()
	_reset_player()
	captures = "--capture" in OS.get_cmdline_user_args()
	if not captures and not "--test" in OS.get_cmdline_user_args(): _load_game()
	_update_camera(1)
	if "--test" in OS.get_cmdline_user_args(): _run_tests()
	elif captures: _capture()

func _load_layout() -> void:
	var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://assets/layered-world.json"))
	ledges = data.ledges
	for l in ledges:
		if l.kind == "stairs": STAIRS.append(l.points)
		else: ROUTES.append(l.points)
		if l.kind == "land": lands.append(l)
	# Cave entry is a physical notch leading down inside this mountain's rock.
	for i in range(data.caves.size()):
		var c: Dictionary = data.caves[i]
		var x: float = c.x
		var y: float = c.y
		var floor_path := [[x-100,y],[x+75,y+105],[x+210,y+215],[x+420,y+250],[x+650,y+250]]
		var outline := [[x-180,y-60],[x+35,y-60],[x+160,y+100],[x+235,y+110],[x+290,y+64],[x+540,y+66],[x+687,y+142],[x+705,y+258],[x+625,y+265],[x+420,y+265],[x+205,y+230],[x-80,y+140]]
		var poly := PackedVector2Array()
		for v in outline: poly.append(point(v))
		void_polygons.append(poly)
		surface_holes.append(Rect2(x-78,y-30,125,60))
		ROUTES.append(floor_path)
		cavities.append({"name":c.name,"x":x,"y":y,"floor":floor_path,"outline":poly})
		SITES.append({"name":c.name,"pos":[x+420,y+250],"text":"洞中石壁有形，洞顶与洞底均可碰撞。沿坡原路返回山路。"})
	for item in [["山腰院落",4950.0,-1550.0],["山麓林台",1300.0,-814.0],["云上主峰",6750.0,-5250.0],["东峰林院",9360.0,-2950.0]]:
		SITES.append({"name":item[0],"pos":[item[1],item[2]],"text":"青山层叠，台地、桥路和石阶沿用网页版坐标。气息已恢复。"})

func _build_background() -> void:
	paper = ColorRect.new()
	paper.position = Vector2(-30000,-20000)
	paper.size = Vector2(60000,40000)
	paper.color = Color("e8e3d0")
	paper.z_index = -100
	add_child(paper)
	far_layer = Node2D.new()
	far_layer.z_index = -80
	add_child(far_layer)
	var rng := RandomNumberGenerator.new()
	rng.seed = 876
	for layer in range(3):
		for i in range(14):
			var x := i*1400.0-2500+layer*330
			var y := rng.randf_range(-2200,-600)-layer*300
			var h := rng.randf_range(1600,3300)
			var poly := PackedVector2Array([Vector2(x-800,1600),Vector2(x-640,y+300),Vector2(x-220,y-h*.66),Vector2(x-80,y-h),Vector2(x+45,y-h-65),Vector2(x+180,y-h*.65),Vector2(x+490,y),Vector2(x+800,1600)])
			var n := Polygon2D.new()
			n.polygon = poly
			n.color = [Color("d2d7c9"),Color("c4cec0"),Color("b4c3b6")][layer]
			n.texture = ROCK
			n.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
			var mountain_uv := PackedVector2Array()
			for vertex in poly: mountain_uv.append(vertex*.6)
			n.uv = mountain_uv
			n.modulate = Color(1,1,1,.27)
			far_layer.add_child(n)
			var line := Line2D.new()
			line.points = poly
			line.width = 3
			line.default_color = Color(0.3,0.4,0.34,0.2)
			far_layer.add_child(line)
	for band in range(4):
		for i in range(7):
			_add_cloud(Vector2(i*2300-1400+band*470,-4200+band*1350),950+((i+band)%3)*310,95,-65)

func _add_cloud(center: Vector2, width: float, height: float, z: int) -> void:
	var poly := PackedVector2Array()
	for i in range(41):
		var t := i/40.0
		var x := center.x+(t-.5)*width
		var envelope := pow(sin(t*PI),.65)
		poly.append(Vector2(x,center.y-height*envelope*(.6+.25*sin(t*PI*7)+.15*sin(t*PI*13))))
	for i in range(40,-1,-1):
		var t := i/40.0
		poly.append(Vector2(center.x+(t-.5)*width,center.y+height*.35*sin(t*PI)))
	var fill := Polygon2D.new()
	fill.polygon=poly
	fill.color=Color("e8e3d0")
	fill.z_index=z
	add_child(fill)
	var rim := Line2D.new()
	rim.points=poly
	rim.width=3
	rim.default_color=Color(.38,.46,.37,.26)
	rim.z_index=z+1
	add_child(rim)

func _build_mountains() -> void:
	var sorted := lands.duplicate()
	sorted.sort_custom(func(a,b): return point(a.points[1]).y < point(b.points[1]).y)
	var index := 0
	for l in sorted:
		var top: Array = l.points
		var x1 := point(top[0]).x
		var x2 := point(top[-1]).x
		var foot := 650.0
		var p := PackedVector2Array()
		for v in top: p.append(point(v))
		var y_right := point(top[-1]).y
		var y_left := point(top[0]).y
		for j in range(1,19):
			var t := j/18.0
			p.append(Vector2(x2+sin(t*2.7)*110+t*t*280+sin(j*2.3+index)*32,lerpf(y_right,foot,t)))
		for j in range(18,0,-1):
			var t := j/18.0
			p.append(Vector2(x1-sin(t*2.3)*125-t*t*220+sin(j*2.8+index)*35,lerpf(y_left,foot,t)))
		solid_polygons.append(p)
		_add_rock_mesh(p,Color(1.0-index*.014,1.0-index*.007,1.0-index*.009),-50+index)
		index += 1
	var ground := PackedVector2Array()
	for v in ledges[0].points: ground.append(point(v))
	ground.append(Vector2(31000,2000))
	ground.append(Vector2(-10000,2000))
	solid_polygons.append(ground)
	_add_rock_mesh(ground,Color("b4b49a"),-39)

func _add_rock_mesh(poly: PackedVector2Array, tint: Color, z: int) -> void:
	var mesh := Polygon2D.new()
	mesh.polygon = poly
	mesh.texture = ROCK
	mesh.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
	mesh.color = tint
	mesh.z_index = z
	# World-anchored texels: zoom never stretches the material to the whole mountain.
	var uv := PackedVector2Array()
	for p in poly: uv.append(p*1.25)
	mesh.uv = uv
	add_child(mesh)
	mesh_count += 1
	# A few broad faces soften the repeated fine hatching.
	var shade := Polygon2D.new()
	shade.polygon = PackedVector2Array([poly[0],poly[1],poly[-2],poly[-1]])
	shade.color = Color(.22,.34,.28,.09)
	shade.z_index = z+1
	add_child(shade)
	var outline := Line2D.new()
	var edge := poly.duplicate()
	edge.append(poly[0])
	outline.points = edge
	outline.width = 5
	outline.default_color = Color("43574a")
	outline.z_index = z+1
	add_child(outline)

func _sprite(slot: int, pos: Vector2, width: float, z: int = 2) -> void:
	var sprite := Sprite2D.new()
	sprite.texture = ATLAS
	sprite.region_enabled = true
	var cell := ATLAS.get_size()/Vector2(3,2)
	sprite.region_rect = Rect2(Vector2(slot%3,slot/3)*cell,cell)
	sprite.centered = false
	sprite.scale = Vector2.ONE*width/cell.x
	sprite.position = pos-Vector2(width/2,width*.965)
	sprite.z_index = z
	scenery.add_child(sprite)

func _build_scenery() -> void:
	scenery = Node2D.new()
	add_child(scenery)
	var buildings := [[4950,-1550,2,390],[4350,-1550,1,220],[6750,-5250,2,420],[5900,-3600,1,270],[1650,-810,4,180],[1700,-2670,1,240],[9450,-2950,2,310],[7900,-1062,1,240]]
	for c in cavities:
		var back := Polygon2D.new()
		back.polygon = c.outline
		back.texture = ROCK
		back.texture_repeat = CanvasItem.TEXTURE_REPEAT_ENABLED
		var uv := PackedVector2Array()
		for p in c.outline: uv.append(p*1.4)
		back.uv=uv
		back.color=Color("46594b")
		back.z_index=-1
		scenery.add_child(back)
		# The texture is inside the same cavity polygon used by collision queries.
	for b in buildings: _sprite(b[2],Vector2(b[0],b[1]),b[3],4)
	var rng := RandomNumberGenerator.new()
	rng.seed = 203
	for l in lands:
		var x := point(l.points[0]).x + 65
		while x < point(l.points[-1]).x-50:
			var y := raw_route_y(l.points,x)
			var clear := true
			for b in buildings:
				if absf(x-b[0]) < b[3]*.6 and absf(y-b[1])<100: clear = false
			for c in cavities:
				if absf(x-c.x)<140 and absf(y-c.y)<50: clear = false
			if clear:
				_sprite(0 if rng.randf()>.4 else 3,Vector2(x,y),rng.randf_range(140,240),2)
				if rng.randf()>.6: _sprite(5,Vector2(x+55,y),95,5)
			x += rng.randf_range(130,230)
func label_at(text: String, pos: Vector2, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.position = pos
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l

func _build_ui() -> void:
	hud = CanvasLayer.new()
	add_child(hud)
	var font := SystemFont.new()
	font.font_names = PackedStringArray(["Songti SC", "Noto Serif CJK SC", "SimSun"])
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var theme := Theme.new()
	theme.default_font = font
	root.theme = theme
	hud.add_child(root)
	var top := ColorRect.new()
	top.color = Color("e7e1cf")
	top.size = Vector2(1440,81)
	root.add_child(top)
	root.add_child(label_at("层 峦 山 域",Vector2(36,12),34,Color("293f39")))
	root.add_child(label_at("玄 岳   /   连 续 横 版 山 域",Vector2(286,29),15,Color("667368")))
	root.add_child(label_at("Godot · 青绿山水",Vector2(1190,27),18,Color("637165")))
	var bottom := ColorRect.new()
	bottom.color = Color("243a34")
	bottom.position = Vector2(0,865)
	bottom.size = Vector2(1440,95)
	root.add_child(bottom)
	status = label_at("",Vector2(36,879),20,Color("eee7d3"))
	root.add_child(status)
	prompt_label = label_at("",Vector2(36,918),15,Color("c4cdbb"))
	root.add_child(prompt_label)
	energy_bar = ProgressBar.new()
	energy_bar.position = Vector2(1180,894)
	energy_bar.size = Vector2(210,6)
	var track := StyleBoxFlat.new()
	track.bg_color = Color("40534a")
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("c6c59a")
	energy_bar.add_theme_stylebox_override("background",track)
	energy_bar.add_theme_stylebox_override("fill",fill)
	energy_bar.show_percentage = false
	energy_bar.modulate = Color("b7cbb5")
	root.add_child(energy_bar)
	root.add_child(label_at("御器气息",Vector2(1180,913),13,Color("bcc6b2")))
	banner = label_at("",Vector2(440,108),19,Color("f1e7cd"))
	banner.add_theme_color_override("font_shadow_color",Color("263b34"))
	banner.add_theme_constant_override("shadow_offset_x",2)
	banner.add_theme_constant_override("shadow_offset_y",2)
	root.add_child(banner)
	var buttons := [["全景 / 跟随  V", _toggle_view],["山路标记  H", _toggle_routes],["返回院落  R", _reset_player]]
	for i in range(buttons.size()):
		var b := Button.new()
		b.text = buttons[i][0]
		b.position = Vector2(35+i*174, 822)
		b.size = Vector2(163,32)
		b.add_theme_font_size_override("font_size",14)
		b.modulate = Color("dce1cc")
		b.pressed.connect(buttons[i][1])
		root.add_child(b)


func _toggle_view() -> void: overview = !overview
func _toggle_routes() -> void: route_overlay = !route_overlay
func _reset_player() -> void:
	player.position = Vector2(4950,-1550)
	player.velocity = Vector2.ZERO
	player.grounded = true
	player.flying = false
	player.energy = 100
	stair_index = -1
	cave = false

func _unhandled_key_input(event: InputEvent) -> void:
	if not event.is_pressed() or event.is_echo(): return
	match event.keycode:
		KEY_V: _toggle_view()
		KEY_H: _toggle_routes()
		KEY_C: collision_debug = !collision_debug
		KEY_R: _reset_player()
		KEY_F:
			player.flying = not player.flying and player.energy>0
			player.velocity = Vector2.ZERO
			stair_index = -1
		KEY_E:
			if nearest>=0:
				player.energy = 100
				_notify(SITES[nearest].text)
		KEY_ESCAPE:
			paused = !paused
			if paused:
				banner.text = "已暂停 · Esc 继续"
				banner.visible = true
			else: message_time = 0
			_save_game()

func raw_route_y(path: Array, x: float) -> float:
	for i in range(1,path.size()):
		var a := point(path[i-1])
		var b := point(path[i])
		if x>=minf(a.x,b.x) and x<=maxf(a.x,b.x): return lerpf(a.y,b.y,(x-a.x)/maxf(b.x-a.x,.001))
	return INF
func route_y(path: Array, x: float) -> float:
	var y := raw_route_y(path,x)
	for c in cavities:
		if path == c.floor: return y
	for hole in surface_holes:
		if hole.has_point(Vector2(x,y)): return INF
	return y

func _physics_process(delta: float) -> void:
	if paused: return
	elapsed += delta
	var axis := float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT))-float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT))
	var vertical := float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN))-float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP))
	_move_player(delta,axis,vertical,Input.is_physical_key_pressed(KEY_SPACE))
	nearest = -1
	for i in range(SITES.size()):
		if player.position.distance_to(point(SITES[i].pos))<170:
			nearest = i
			if not SITES[i].name in discovered: discovered.append(SITES[i].name)
	_update_camera(delta)
	status.text = (cave_name if cave else SITES[nearest].name if nearest>=0 else "层峦山域") + "   /   " + ("御器" if player.flying else "石阶" if stair_index>=0 else "步行")
	prompt_label.text = "A / D 行走   空格 跳跃   W / S 石阶   F 御器   V 全景   H 通路   C 实体   R 回院落"
	if cave: prompt_label.text = "山体内部 · 直接沿洞道行走，无场景切换   F 御器   V 全景   C 实体"
	energy_bar.value = player.energy
	message_time -= delta
	banner.visible = message_time > 0
	autosave += delta
	if autosave>8:
		autosave=0
		_save_game()
	queue_redraw()
func _move_player(dt: float, axis: float, vertical: float, jump: bool) -> void:
	player.walking = absf(axis) > 0.0
	if axis != 0: player.facing = axis
	if player.flying:
		player.grounded = false
		_sweep_move(Vector2(axis,vertical).limit_length(1.0)*900.0*dt)
		player.energy = maxf(0,player.energy-dt*2.2)
		if player.energy <= 0: player.flying = false
		_clamp_player()
		return
	if vertical != 0 and stair_index < 0:
		for si in range(STAIRS.size()):
			var path: Array = STAIRS[si]
			var ys: Array = path.map(func(v): return float(v[1]))
			if vertical < 0 and player.position.y <= ys.min()+.5: continue
			if vertical > 0 and player.position.y >= ys.max()-.5: continue
			var cumulative := 0.0
			for j in range(1,path.size()):
				var a := point(path[j-1])
				var b := point(path[j])
				var closest := Geometry2D.get_closest_point_to_segment(player.position,a,b)
				if closest.distance_to(player.position) < 48:
					stair_index = si
					stair_distance = cumulative + a.distance_to(closest)
					break
				cumulative += a.distance_to(b)
			if stair_index >= 0: break
	if stair_index >= 0:
		if jump or axis != 0:
			stair_index = -1
			player.grounded = false
			if jump: player.velocity.y = -player.JUMP
		else:
			var path: Array = STAIRS[stair_index]
			var total := _path_length(path)
			var goes_up: bool = point(path[-1]).y < point(path[0]).y
			stair_distance = clampf(stair_distance + vertical * (-1.0 if goes_up else 1.0)*230.0*dt,0,total)
			_sweep_move(_path_point(path,stair_distance)-player.position)
			player.velocity = Vector2.ZERO
			player.grounded = true
			player.energy = minf(100,player.energy+dt*8)
			if stair_distance <= 0 or stair_distance >= total: stair_index = -1
			return
	var support := -1
	if player.grounded:
		for i in range(ROUTES.size()):
			if absf(route_y(ROUTES[i],player.position.x)-player.position.y)<8:
				support = i
				break
	# Follow the surface as a swept vector, so uphill motion doesn't collide with the slope itself.
	if support >= 0 and not jump:
		var next_x: float = player.position.x + axis*230.0*dt
		var next_y := route_y(ROUTES[support],next_x)
		if is_finite(next_y):
			_sweep_move(Vector2(next_x,next_y)-player.position)
			player.velocity.y = 0
			player.energy = minf(100,player.energy+dt*12)
			return
	var old := player.position
	_sweep_move(Vector2(axis*230.0*dt,0))
	if jump and player.grounded:
		player.velocity.y = -player.JUMP
		support = -1
		player.grounded = false
	if support >= 0:
		var floor_y := route_y(ROUTES[support],player.position.x)
		if is_finite(floor_y):
			player.position.y = floor_y
			player.velocity.y = 0
			player.energy = minf(100,player.energy+dt*12)
			return
	player.grounded = false
	player.velocity.y += player.GRAVITY*dt
	var before_fall: float = player.position.y
	_sweep_move(Vector2(0,player.velocity.y*dt))
	if is_equal_approx(before_fall,player.position.y) and player.velocity.y > 0:
		player.grounded = true
		player.velocity.y = 0
	if player.velocity.y >= 0:
		var hit := INF
		for path in ROUTES:
			var y := route_y(path,player.position.x)
			if is_finite(y) and old.y <= y+2 and player.position.y >= y: hit = minf(hit,y)
		if is_finite(hit):
			player.position.y = hit
			player.velocity.y = 0
			player.grounded = true
	_clamp_player()


func _clamp_player() -> void:
	player.position.x = clampf(player.position.x,-600,13300)
	player.position.y = clampf(player.position.y,-6100,1400)
	if player.position.y>1200: _reset_player()
func _path_length(path: Array) -> float:
	var total := 0.0
	for i in range(1,path.size()): total += point(path[i-1]).distance_to(point(path[i]))
	return total
func _path_point(path: Array, distance: float) -> Vector2:
	for i in range(1,path.size()):
		var a := point(path[i-1])
		var b := point(path[i])
		var length := a.distance_to(b)
		if distance <= length: return a.lerp(b,distance/length)
		distance -= length
	return point(path[-1])


func _update_camera(dt: float) -> void:
	var zoom_level := .8
	var target: Vector2 = player.position+Vector2(90,-130)
	if overview:
		zoom_level = .10
		target = Vector2(6400,-2350)
	var weight := minf(1,dt*8)
	camera.zoom = camera.zoom.lerp(Vector2.ONE*zoom_level,weight)
	camera.position = camera.position.lerp(target,weight)
	far_layer.position = camera.position * .05

func _is_rock(p: Vector2) -> bool:
	var inside := false
	for poly in solid_polygons:
		if Geometry2D.is_point_in_polygon(p,poly):
			inside = true
			break
	if not inside: return false
	for poly in void_polygons:
		if Geometry2D.is_point_in_polygon(p,poly): return false
	# Source map's lower terraces are exposed on the front of overlapping higher crags.
	# Their exterior passage has real clearance; deeper rock below remains solid.
	for l in ledges:
		if l.kind == "stairs": continue
		var y := raw_route_y(l.points,p.x)
		if p.y<y and p.y>y-410: return false
	for path in STAIRS:
		for i in range(1,path.size()):
			var a := point(path[i-1])-Vector2(0,23)
			var b := point(path[i])-Vector2(0,23)
			if Geometry2D.get_closest_point_to_segment(p,a,b).distance_to(p)<35: return false
	return true
func _body_blocked(at: Vector2) -> bool:
	for off in [Vector2(-7,-2),Vector2(7,-2),Vector2(-7,-21),Vector2(7,-21),Vector2(-6,-43),Vector2(6,-43)]:
		if _is_rock(at+off): return true
	return false
func _sweep_move(displacement: Vector2) -> void:
	var count := maxi(1,int(ceil(displacement.length()/3)))
	var step := displacement/float(count)
	for i in range(count):
		var next: Vector2 = player.position+Vector2(step.x,0)
		if not _body_blocked(next): player.position=next
		next=player.position+Vector2(0,step.y)
		if not _body_blocked(next): player.position=next
		elif step.y<0: player.velocity.y=0
	cave=false
	for i in range(void_polygons.size()):
		if Geometry2D.is_point_in_polygon(player.position-Vector2(0,20),void_polygons[i]):
			cave=true
			cave_name=cavities[i].name

func _notify(text: String) -> void:
	banner.text=text
	message_time=6
func _save_game() -> void:
	if captures or "--test" in OS.get_cmdline_user_args(): return
	var f := FileAccess.open(SAVE_PATH,FileAccess.WRITE)
	if f: f.store_string(JSON.stringify({"version":2,"x":player.position.x,"y":player.position.y,"energy":player.energy,"overview":overview,"discovered":discovered}))
func _load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH): return
	var d=JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if not d is Dictionary or d.get("version")!=2: return
	var x := float(d.get("x",4950))
	var y := float(d.get("y",-1550))
	if not is_finite(x) or not is_finite(y): return
	player.position=Vector2(clampf(x,-600,13300),clampf(y,-6100,1100))
	if _body_blocked(player.position): _reset_player()
	player.energy=clampf(float(d.get("energy",100)),0,100)
	overview=bool(d.get("overview",false))
	if d.get("discovered") is Array: discovered=d.discovered

func _draw() -> void:
	if not is_instance_valid(player): return
	for c in cavities:
		draw_colored_polygon(c.outline,Color(.10,.20,.16,.40))
		var outline: PackedVector2Array = c.outline.duplicate()
		outline.append(outline[0])
		draw_polyline(outline,Color("536752"),10,true)
		var floor_pts := PackedVector2Array()
		for p in c.floor: floor_pts.append(point(p))
		draw_polyline(floor_pts,Color("c1b89b"),8,true)
		for i in range(9):
			var x: float=c.x+285+i*36
			var y: float=c.y+80
			var pts := PackedVector2Array([Vector2(x,y),Vector2(x+4,y+12),Vector2(x+9,y+30+(i%3)*11),Vector2(x+12,y+17),Vector2(x+18,y)])
			draw_colored_polygon(pts,Color("738c7e"))
			draw_polyline(pts,Color("a9ae92"),1.2,true)
		for i in range(6):
			var x: float=c.x+390+i*42
			var y: float=c.y+245
			draw_colored_polygon(PackedVector2Array([Vector2(x,y),Vector2(x+7,y-30-i%2*17),Vector2(x+15,y)]),Color("8ab3a0"))
	for l in ledges:
		var path: Array=l.points
		var length := _path_length(path)
		var pts := PackedVector2Array()
		for v in path: pts.append(point(v))
		if l.kind == "stairs":
			draw_polyline(pts,Color("485548"),32,true)
			for d in range(0,int(length),25):
				var p := _path_point(path,d)
				draw_line(p-Vector2(17,0),p+Vector2(17,0),Color("c4b99b"),5,true)
		elif l.kind == "bridge":
			draw_polyline(pts,Color("6e6551"),20,true)
			var rail := PackedVector2Array()
			for p in pts: rail.append(p-Vector2(0,52))
			draw_polyline(rail,Color("a49773"),4,true)
			for d in range(0,int(length),48):
				var p := _path_point(path,d)
				draw_line(p,p-Vector2(0,52),Color("726d55"),4,true)
		else:
			# Split the surface strip at real cave openings.
			for j in range(1,path.size()):
				var a := point(path[j-1])
				var b := point(path[j])
				var n := maxi(1,int(a.distance_to(b)/18))
				for k in range(n):
					var p := a.lerp(b,float(k)/n)
					var q := a.lerp(b,float(k+1)/n)
					if not is_finite(route_y(path,p.x)): continue
					draw_line(p+Vector2(0,7),q+Vector2(0,7),Color("52654d"),24,true)
					draw_line(p,q,Color("c5bda1"),5,true)
		if route_overlay: draw_polyline(pts,Color(1,.85,.47,.8),5,true)
	if overview:
		for site in SITES:
			var pos := point(site.pos)-Vector2(0,240)
			draw_string_outline(world_font,pos,site.name,HORIZONTAL_ALIGNMENT_CENTER,-1,130,14,Color("e8e3d0"))
			draw_string(world_font,pos,site.name,HORIZONTAL_ALIGNMENT_CENTER,-1,130,Color("314839"))
		draw_arc(player.position-Vector2(0,18),62,0,TAU,40,Color("a77546"),10,true)
	if collision_debug:
		# Sample the actual shared collision query, not just the visual outlines.
		var half := Vector2(740,440)/camera.zoom.x
		var rect := Rect2(camera.position-half,half*2)
		for y in range(int(rect.position.y/24)*24,int(rect.end.y),24):
			for x in range(int(rect.position.x/24)*24,int(rect.end.x),24):
				if _is_rock(Vector2(x+12,y+12)): draw_rect(Rect2(x,y,22,22),Color(.72,.35,.15,.25))

func _capture() -> void:
	await get_tree().create_timer(2).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://evidence/follow.png")
	overview=true
	await get_tree().create_timer(2).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://evidence/overview.png")
	overview=false
	player.position=Vector2(cavities[1].x+430,cavities[1].y+250)
	player.grounded=true
	await get_tree().create_timer(2).timeout
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://evidence/cave.png")
	print("CAPTURES_OK")
	get_tree().quit()

func _run_tests() -> void:
	assert(lands.size()==7 and STAIRS.size()==5)
	assert(mesh_count==8 and cavities.size()==3)
	assert(point(lands[1].points[1])==Vector2(4350,-1550))
	_reset_player()
	for i in range(60): _move_player(1.0/60,1,0,false)
	assert(player.position.x>5120 and player.grounded)
	var before: float=player.position.y
	_move_player(1.0/60,0,0,true)
	assert(player.position.y<before)
	for i in range(120): _move_player(1.0/60,0,0,false)
	assert(player.grounded)
	var c: Dictionary=cavities[1]
	player.position=Vector2(c.x-110,c.y)
	player.velocity=Vector2.ZERO
	player.grounded=true
	for i in range(210): _move_player(1.0/60,1,0,false)
	assert(cave and player.position.y>c.y+140)
	assert(player.position.x>c.x+370)
	player.flying=true
	player.energy=100
	for i in range(120): _move_player(1.0/60,0,-1,false)
	assert(player.position.y>c.y+45) # Roof blocks flight inside mountain.
	player.energy=.01
	_move_player(.1,0,-1,false)
	assert(not player.flying and player.energy==0)
	player.position=Vector2(c.x+430,c.y+250)
	player.flying=false
	player.grounded=true
	player.velocity=Vector2.ZERO
	for i in range(200): _move_player(1.0/60,-1,0,false)
	assert(not cave and player.position.x<c.x-80)
	# All source stairs share the same traversal controller.
	for si in range(STAIRS.size()):
		var path: Array=STAIRS[si]
		player.position=point(path[0])
		player.grounded=true
		player.flying=false
		player.velocity=Vector2.ZERO
		stair_index=-1
		var direction := -1.0 if point(path[-1]).y<point(path[0]).y else 1.0
		var frames := int(ceil(_path_length(path)/230*60))
		for i in range(frames): _move_player(1.0/60,0,direction,false)
		assert(player.position.distance_to(point(path[-1]))<10)
		stair_index=-1
		for i in range(frames): _move_player(1.0/60,0,-direction,false)
		assert(player.position.distance_to(point(path[0]))<10)
	print("PASS: exact web ledges, seven meshes, five stair paths, walking, jump/landing, continuous cave entry/exit, bidirectional stairs, solid roof, flight exhaustion")
	get_tree().quit()
