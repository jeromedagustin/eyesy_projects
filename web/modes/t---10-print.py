import pygame
import os
import random
import time
import math
# squares is square width in pixels
squares = 40#80
lines = []
def rotate(origin, point, angle):
    ox, oy = origin
    px, py = point
    qx = ox + math.cos(angle) * (px - ox) - math.sin(angle) * (py - oy)
    qy = oy + math.sin(angle) * (px - ox) + math.cos(angle) * (py - oy)
    return float(qx), float(qy)
def rotateLinePoints(start, end, degrees):
    startx, starty = start
    endx, endy = end
    middleX = (startx + endx) // 2
    middleY = (starty + endy) // 2
    inRadians = math.radians(degrees)
    newStart = rotate((middleX, middleY), start, inRadians)
    newEnd = rotate((middleX, middleY), end, inRadians)
    return newStart, newEnd
def generate_lines(squares, etc):
    lines = []
    for x in range(0, 1280, squares):
        for y in range(0, 720, squares):
            if random.random() > .5:#(1*etc.knob3):
                lines.append([x, y, x + squares, y + squares])
            else:
                lines.append([x, y + squares, x + squares, y])
    return lines
def setup(screen, etc):
    global lines
    lines = generate_lines(squares, etc)
def draw(screen, etc):
    global lines, squares
    etc.color_picker_bg(etc.knob5)
    sel = etc.knob4*8
    thickness = int(1 + etc.knob1 * 20)
    squares = int(40 + 80 * etc.knob3)
    # Use audio_trig if available (test runner), otherwise use trig (official API)
    audio_trigger = getattr(etc, 'audio_trig', False) or etc.trig
    if audio_trigger:
        lines = generate_lines(squares, etc)
        for p, line in enumerate(lines):
            l1, l2 = line[2:], line[:2]
            if sel >= 7 :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),
                        int(127 + 127 * math.sin((p*1) * .05+ time.time())),
                        int(127 + 127 * math.sin((p*1) * .01 + time.time())))
            if 1 <= sel < 2 :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),42,75)
            if 2 <= sel < 3 :
                color = (75,int(127 + 127 * math.sin((p*1) * .1 + time.time())),42)
            if 3 <= sel < 4 :
                color = (42,75,int(127 + 127 * math.sin((p*1) * .1 + time.time())))
            if 4 <= sel < 5 :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),255,127)
            if 5 <= sel < 6 :
                color = (255,int(127 + 127 * math.sin((p*1) * .1 + time.time())),127)
            if 6 <= sel < 7 :
                color = (205,200,int(127 + 127 * math.sin((p*1) * .1 + time.time())))
            if 1 > sel :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),
                        int(127 + 127 * math.sin((p*1) * .1 + time.time())),
                        int(127 + 127 * math.sin((p*1) * .1 + time.time())))
            # Ensure coordinates are integers for pygame.draw.line
            l1_int = (int(l1[0]), int(l1[1]))
            l2_int = (int(l2[0]), int(l2[1]))
            pygame.draw.line(screen, color, l1_int, l2_int, thickness)
    else:
        for p, line in enumerate(lines):
            audio_idx = p % len(etc.audio_in) if len(etc.audio_in) > 0 else 0
            rotation_angle = etc.audio_in[audio_idx] * .01 * etc.knob2 if len(etc.audio_in) > 0 else 0
            l1, l2 = rotateLinePoints(line[:2], line[2:], rotation_angle)
            if sel >= 7 :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),
                        int(127 + 127 * math.sin((p*1) * .05+ time.time())),
                        int(127 + 127 * math.sin((p*1) * .01 + time.time())))
            if 1 <= sel < 2 :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),42,75)
            if 2 <= sel < 3 :
                color = (75,int(127 + 127 * math.sin((p*1) * .1 + time.time())),42)
            if 3 <= sel < 4 :
                color = (42,75,int(127 + 127 * math.sin((p*1) * .1 + time.time())))
            if 4 <= sel < 5 :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),255,127)
            if 5 <= sel < 6 :
                color = (255,int(127 + 127 * math.sin((p*1) * .1 + time.time())),127)
            if 6 <= sel < 7 :
                color = (205,200,int(127 + 127 * math.sin((p*1) * .1 + time.time())))
            if 1 > sel :
                color = (int(127 + 127 * math.sin((p*1) * .1 + time.time())),
                        int(127 + 127 * math.sin((p*1) * .1 + time.time())),
                        int(127 + 127 * math.sin((p*1) * .1 + time.time())))
            # Ensure coordinates are integers for pygame.draw.line
            l1_int = (int(l1[0]), int(l1[1]))
            l2_int = (int(l2[0]), int(l2[1]))
            pygame.draw.line(screen, color, l1_int, l2_int, thickness)
