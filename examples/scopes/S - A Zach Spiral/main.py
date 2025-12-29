import pygame
import pygame.gfxdraw
import time
import math
from pygame.locals import *

# original code adapted from zach lieberman's talk
# https://www.youtube.com/watch?v=bmztlO9_Wvo
# http://www.mathrecreation.com/2016/10/some-familiar-spirals-in-desmos.html

w1 = 0
h1 = 0

def setup(screen, eyesy):
    global w1, h1
    w1 = screen.get_width()
    h1 = screen.get_height()
    pass

def draw(screen, eyesy):
    global w1, h1
    eyesy.color_picker_bg(eyesy.knob5)
    k = int(((h1)) + ((h1)) * (math.sin(time.time() * (.1 + eyesy.knob2 * 2))))
    j = int(((h1 / 2) - 10) + ((h1 / 2) - 10) * (math.cos(time.time() * (.8 + 1 + eyesy.knob2))))
    l = int((h1) - 25) - k
    for i in range(0, (h1 + 20), 1):
        i = i * 2
        color = (int(127 + 120 * math.sin(i * .01 + time.time())),
                 int(127 + 120 * math.sin(i * (.01 + eyesy.knob5 * .01) + time.time())),
                 int(127 + 120 * math.sin(i * (.01 + eyesy.knob5 * .02) + time.time())))
        r1 = (abs(eyesy.audio_in[i % 100]))
        radius_2 = int(50 - 20 * math.sin(i * (eyesy.knob2 * .2) + .0001 + time.time()))
        radius2 = int((eyesy.knob3 / 2) * radius_2 + (.4 + eyesy.knob2 / 3) * (r1 / 400))
        xoffset1 = i
        xpos3 = (w1 / 2)
        ypos2 = (h1 / 2)
        spiral_angle = (1 + math.sqrt(5) * math.pi / (math.pi + 12 * eyesy.knob1))
        xpos4 = int(xpos3 + (20 * eyesy.knob2 + 1) * math.sqrt(i) * math.cos(i * spiral_angle))
        ypos3 = int(ypos2 + (20 * eyesy.knob2 + 1) * math.sqrt(i) * math.sin(i * spiral_angle))
        rect3 = Rect(xpos4, ypos3, radius2 * 1.5, radius2 * 1.5)
        radius3 = int(radius2 + (math.sin(i * (eyesy.knob2 * .2) + time.time())))
        radius4 = int(radius2 + (math.cos(i * (eyesy.knob2 * .2) + time.time())))
        if (k - ((h1 * 2) + 30) * eyesy.knob4 - 5) <= i <= (k + ((h1 * 2) + 30) * eyesy.knob4 + 5):
            pygame.gfxdraw.ellipse(screen, xpos4, ypos3, radius3, radius4, color)
