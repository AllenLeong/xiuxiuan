extends Node2D

var velocity := Vector2.ZERO
var grounded := true
var flying := false
var energy := 100.0
var facing := 1.0
var elapsed := 0.0
var walking := false
const SPEED := 170.0
const FLIGHT_SPEED := 470.0
const GRAVITY := 1000.0
const JUMP := 380.0

func _process(delta: float) -> void:
	elapsed += delta
	queue_redraw()

func _draw() -> void:
	var ink := Color("293e39")
	var cream := Color("ede6cc")
	var stride: float = sin(elapsed * 12.0) * 7.0 if walking and grounded else 0.0
	draw_set_transform(Vector2.ZERO, 0, Vector2(facing, 1))
	if flying:
		draw_line(Vector2(-26, 5), Vector2(34, 5), Color("e6d5a2"), 4, true)
		draw_line(Vector2(-22, 7), Vector2(30, 7), ink, 1.5, true)
		for i in range(3):
			draw_line(Vector2(-35-i*12, 5+i*3), Vector2(-58-i*16, 5+i*3), Color(0.62,0.83,0.77,0.4-i*.08), 2, true)
	else:
		draw_line(Vector2(-4,-11),Vector2(-6+stride,0),ink,4,true)
		draw_line(Vector2(4,-11),Vector2(6-stride,0),ink,4,true)
	draw_colored_polygon(PackedVector2Array([Vector2(-6,-32),Vector2(5,-32),Vector2(11,-8),Vector2(-12,-8)]),ink)
	draw_colored_polygon(PackedVector2Array([Vector2(-4,-30),Vector2(3,-30),Vector2(8,-10),Vector2(-9,-10)]),cream)
	draw_line(Vector2(-6,-20),Vector2(6,-20),Color("8b5345"),3,true)
	draw_circle(Vector2(0,-38),6,cream)
	draw_arc(Vector2(0,-38),6,PI,TAU,16,ink,3,true)
	draw_circle(Vector2(-2,-45),3,ink)
	draw_line(Vector2(-6,-29),Vector2(-18,-19+sin(elapsed*3)*2),cream,4,true)
	draw_line(Vector2(5,-29),Vector2(13,-20),cream,4,true)
	draw_line(Vector2(-6,-32),Vector2(-24,-27+sin(elapsed*4)*3),Color("8b5345"),2,true)
	draw_set_transform(Vector2.ZERO)
