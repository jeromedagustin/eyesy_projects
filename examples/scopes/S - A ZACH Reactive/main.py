import pygame
import pygame.gfxdraw
import time
import math
from pygame.locals import *
# original code adapted from zach lieberman's talk
# https://www.youtube.com/watch?v=bmztlO9_Wvo
w1 = 0
h1 = 0
def setup(screen, eyesy) :
    global w1,h1
    w1 = screen.get_width()
    h1 = screen.get_height()
    pass
def draw(screen, eyesy):
    global w1, h1
    eyesy.color_picker_bg(eyesy.knob5)
    for i in range(int((h1 / 2) - 10)):
        i=i*2
        color = (int(127 + 120 * math.sin(i * .01 + time.time())),
                 int(127 + 120 * math.sin(i * (.01 + eyesy.knob4 * .01) + time.time())),
                 int(127 + 120 * math.sin(i * (.01 + eyesy.knob4 * .02) + time.time())))
        audio_idx = int(i / 50) if len(eyesy.audio_in) > 0 else 0
        r1 = (abs(eyesy.audio_in[audio_idx % len(eyesy.audio_in)] / 900)) if len(eyesy.audio_in) > 0 else 0
        radius_1 = int(100 + r1 + 40 * math.sin(i * (eyesy.knob1 * .05) + .0001 + time.time()))
        radius1 = int(eyesy.knob3 * radius_1)
        radius_2 = int(70 + r1 - 20 * math.sin(i * (eyesy.knob2 * .2) + .0001 + time.time()))
        radius2 = int(eyesy.knob3 * radius_2)
        xoffset1 = i
        xpos1 = int(((w1 / 2) - i) * math.sin(i * .01 + (time.time() * 0.3)) +
                    (w1 / 2 - i) + xoffset1) + int(r1 * 1.5)
        xpos2 = int(((w1 / 2) - i) * math.sin(i * .01 + (time.time() * 0.3)) +
                    (w1 / 2 - i) + xoffset1 + (h1 / 2)) + int(r1 * 1.5)
        xpos3 = int(((w1 / 2) - i) * math.sin(i * .01 + (time.time() * 0.3)) +
                    (w1 / 2 - i) + xoffset1 - (h1 / 2)) + int(r1 * 1.5)
        rect2 = Rect(int(xpos2), int(i), int(radius2 * 1.5), int(radius2 * 1.5))
        radius3 = int(radius2 + 10 + 10 * (math.sin(i * (eyesy.knob2 * .2) + time.time())))
        radius4 = int(radius2 + 10 + 10 * (math.cos(i * (eyesy.knob1 * .2) + time.time())))
        pygame.gfxdraw.circle(screen, int(xpos1), int(i), int(radius1), color)
        pygame.gfxdraw.rectangle(screen, rect2, color)
        pygame.gfxdraw.ellipse(screen, int(xpos3), int(i), int(radius3), int(radius4), color)
