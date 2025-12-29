import pygame
import math
import random
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
def setup(screen, eyesy):
    global screen_res_x, screen_res_y, screen_center_x, screen_center_y, spiral_angle_offset, current_note, num_spirals, spiral_centers, color_palette
    screen_res_x = eyesy.xres
    screen_res_y = eyesy.yres
    screen_center_x = eyesy.xres // 2
    screen_center_y = eyesy.yres // 2
    spiral_angle_offset = 0
    current_note = eyesy.audio_in[0]
    num_spirals = 11
    spiral_centers = generate_spiral_centers(num_spirals)
    color_palette = generate_color_palette(num_spirals)
def draw(screen, eyesy):
    global spiral_angle_offset, num_spirals, spiral_centers, color_palette
    pygame.time.Clock().tick(60)
    background_color = eyesy.color_picker_bg(eyesy.knob5)
    if eyesy.knob4 > 0.75:
        draw_spiral_alley(screen, eyesy)
    elif eyesy.knob4 <= 0.75:
        if eyesy.trig:
            num_spirals = random.randint(1, 11)
            spiral_centers = generate_spiral_centers(num_spirals)
            random.shuffle(color_palette)
        if eyesy.knob4 == 0:
            color_palette = generate_color_palette(num_spirals)
        for center, color in zip(spiral_centers, color_palette):
            x = center[0] - (eyesy.knob3 * 50)
            y = center[1] + (eyesy.knob3 * 50)
            draw_spiral_line(screen, x, y, 1, eyesy, color)
def generate_spiral_centers(num_spirals):
    spiral_centers = []
    for _ in range(num_spirals):
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(0, screen_center_x)
        x = screen_center_x + distance * math.cos(angle)
        y = screen_center_y + distance * math.sin(angle)
        spiral_centers.append((x, y))
    return spiral_centers
def generate_color_palette(num_spirals):
    color_palette = [random_color() for _ in range(num_spirals)]
    return color_palette
def random_color():
    return (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
def draw_spiral_line(screen, x, y, radius, eyesy, color):
    radius += 500 * eyesy.knob1
    global spiral_angle_offset
    spiral_angle_offset += 0.001
    if spiral_angle_offset > 2 * math.pi:
        spiral_angle_offset = 0
    num_points = int(500 * eyesy.knob2 + 10)
    spiral_points = []
    for i in range(num_points):
        theta = (i / num_points * (2 * math.pi))
        r = radius + i * 0.5
        px = x + r * math.cos(theta + i * eyesy.knob3 + spiral_angle_offset)
        py = y + r * math.sin(theta + i * eyesy.knob3 + spiral_angle_offset)
        spiral_points.append((px, py))
    pygame.draw.lines(screen, color, False, spiral_points, 2)
def draw_spiral_alley(screen, eyesy):
    num_of_spirals = 7
    alley_location = int(eyesy.knob3 * screen_res_x)
    left_alley_x = 0 + alley_location
    right_alley_x = screen_res_x - alley_location
    alley_height = screen_res_y
    height_diff = screen_res_y // num_of_spirals
    for _ in range(num_of_spirals + 1):
        draw_spiral_line(screen, right_alley_x, alley_height, 1, eyesy, WHITE)
        draw_spiral_line(screen, left_alley_x, alley_height, 1, eyesy, BLACK)
        alley_height -= height_diff
