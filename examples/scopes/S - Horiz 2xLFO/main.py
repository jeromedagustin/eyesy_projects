import os
import pygame
import glob
import random
import math
import time
#Knob1 = Oscilloscope Shape & Size Selector - 3 divisions.
    #Within each division of Knob1, the LFO rate of change for scope elements is set -
    #turning to the right will increase the LFO frequency.
#Knob2 = 'Trails' LFO rate of change - turn on "persist" to see it!
#Knob3 = 'Trails' Opacity
#Knob4 = Foreground Color - 8 positions
#Knob5 = Background Color
class LFO : #uses three arguments: start point, max, and how far each step is.
    def __init__(self, start, max, step):
        self.start = start
        self.max = max
        self.step = step
        self.current = 0
        self.direction = 1
    def update(self):
        self.current += self.step * self.direction
        # when it gets to the top, flip direction
        if (self.current >= self.max) :
            self.direction = -1
            self.current = self.max  # in case it steps above max
        # when it gets to the bottom, flip direction
        if (self.current <= self.start):
            self.direction = 1
            self.current = self.start  # in case it steps below min
        return self.current
lastScreenLFO = LFO(0, 200, 0.01)
shapeLFO = LFO(0, 0.33, 0.01)
shapey = 0
last_screen = pygame.Surface((1280,720))
xr = 320
yr = 240
lines = 100
def setup(screen, eyesy) :
    global last_screen, xr, yr
    xr = eyesy.xres
    yr = eyesy.yres
    last_screen = pygame.Surface((xr,yr))
def draw(screen, eyesy) :
    global last_screen, seg, lastScreenLFO, xr, yr, shapeLFO, shapey
    eyesy.color_picker_bg(eyesy.knob5)
    lastScreenLFO.max = 250
    for i in range(0, lines) :
        seg(screen, eyesy, i)
    shapey = shapeLFO.update()
    image = last_screen
    last_screen = screen.copy()
    lastScreenLFO.step = int(eyesy.knob2*50) #LFO rate of change
    lastScreenSize = lastScreenLFO.update()
    thingX = int(xr-(lastScreenSize))#int(xr-(eyesy.knob2*200))
    thingY = int(yr-(lastScreenSize*0.5625))#int(yr-(eyesy.knob2*200))
    placeX = int(xr/2)-int(((thingX/2)*xr)/1280)
    placeY = int(yr/2)-int(((thingY/2)*yr)/720)
    thing = pygame.transform.scale(image, (thingX, thingY)) # mirror screen scale
    thing.set_alpha(int(eyesy.knob3 * 180)) # adjust transparency on knob3
    screen.blit(thing, (placeX, placeY)) # mirror screen scale
def seg(screen, eyesy, i) :
    global shapey
    space = eyesy.xres/(lines-2)
    y0 = 0
    y1 = (eyesy.audio_in[i] / 90)
    x = i*space
    position = eyesy.yres/2
    #set the size of the graphic elements with Knob 1:
    if eyesy.knob1 < 0.33 :
        linewidth = int(((abs(shapey)*3.5)*eyesy.xres)/(lines-75)+1)
        ballSize = 0 #no balls shown
        shapeLFO.step = eyesy.knob1*eyesy.knob1 #LFO rate of change
    if eyesy.knob1 >= 0.33 and eyesy.knob1 < 0.66 :
        linewidth = 0 #no lines shown
        ballSize = int((((0.66-abs(shapey*2))*3)*eyesy.xres)/(lines-75)+1)
        shapeLFO.step = (eyesy.knob1-0.33)*(eyesy.knob1-0.33) #LFO rate of change
    if eyesy.knob1 >= 0.66 :
        linewidth = int(((abs(1-shapey)-0.66)*1.5)*eyesy.xres/(lines-75))
        ballSize = int((((abs(shapey*3-0.66))*3)*eyesy.xres)/(lines-75))
        shapeLFO.step = (eyesy.knob1-0.66)*(eyesy.knob1-0.66) #LFO rate of change
    sel = eyesy.knob4*8 #select the colors with Knob 4
    Cmod = 0.02 #how quickly the color shifts
    if 1 > sel :
        color = (int(127 + 127 * math.sin(i * 1*Cmod + time.time())),
                int(127 + 127 * math.sin(i * 1*Cmod + time.time())),
                int(127 + 127 * math.sin(i * 1*Cmod + time.time())))
    if 1 <= sel < 2 :
        color = (int(127+127 * math.sin(i * 1*Cmod + time.time())),0,45)
    if 2 <= sel < 3 :
        color = (255,int(155 + 100 * math.sin(i * 1*Cmod + time.time())),30)
    if 3 <= sel < 4 :
        color = (0,200,int(127 + 127 * math.sin(i * 1*Cmod + time.time())))
    if 5 > sel >= 4 :
        color = ((127*Cmod)%255,
                (127*Cmod)%255,
                int(127 + 127 * math.sin(i * (Cmod+.1) + time.time())))
    if 6 > sel >= 5 :
        color = ((127*Cmod)%255,
                int(127 + 127 * math.sin(i * (Cmod+.1) + time.time())),
                (127*Cmod)%255)
    if 7 > sel >= 6 :
        color = (int(127 + 127 * math.sin(i * (Cmod+.1) + time.time())),
                (127*Cmod)%255,
                (127*Cmod)%255)
    if  sel >= 7 :
        color = (int(127 + 127 * math.sin((i+30) * (1*Cmod+.01) + time.time())),
                int(127 + 127 * math.sin((i+30) * (.5*Cmod+.005) + time.time())),
                int(127 + 127 * math.sin((i+15) * (.1*Cmod+.001) + time.time())))
    pygame.draw.circle(screen,color,(x, y1+position),ballSize, 0)
    pygame.draw.line(screen, color, [x, y0+position], [x, y1+position], linewidth)
