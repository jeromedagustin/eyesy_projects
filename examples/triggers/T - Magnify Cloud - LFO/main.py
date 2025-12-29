import os
import pygame
import random
#Knob1 - size/linewidth
#Knob2 - number of balls
#Knob3 - LFO step speed
#Knob4 - foreground color
#Knob5 - background color
trigger = False
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
        if (self.current <= self.start) :
            self.direction = 1
            self.current = self.start  # in case it steps below min
        return self.current
denser = LFO(1,360,10)
def setup(screen, eyesy):
    global xr, yr, xhalf, yhalf, pos
    xr = eyesy.xres
    yr = eyesy.yres
    xhalf = (xr/2)
    yhalf = (yr/2)
    pos = [(random.randrange(int(xhalf),int(xhalf+2)),random.randrange(int(yhalf),int(yhalf+2))) for i in range(0,12)]
    denser.max = yhalf
def draw(screen, eyesy):
    global trigger, pos, xr, yr, xhalf, yhalf
    eyesy.color_picker_bg(eyesy.knob5)
    # Ensure pos is initialized (in case setup() hasn't been called)
    if not pos or len(pos) == 0:
        # Initialize pos with default values
        if 'xhalf' not in globals() or 'yhalf' not in globals():
            xr = eyesy.xres
            yr = eyesy.yres
            xhalf = (xr/2)
            yhalf = (yr/2)
            denser.max = yhalf
        pos = [(int(xhalf), int(yhalf)) for i in range(0,12)]
    balls = int(eyesy.knob2*10)+1
    denser.step = int(eyesy.knob3*12)
    x20 = int(xr * 0.016)#((20*xr)/1280)
    # Update LFO once per frame and store the value
    lfo_value = denser.update()
    xdensity = lfo_value * 2
    ydensity = lfo_value
    size = abs(int(eyesy.knob1*x20)*lfo_value/30+1)
    # Use audio_trig if available (test runner), otherwise use trig (official API)
    audio_trigger = getattr(eyesy, 'audio_trig', False) or eyesy.trig
    if audio_trigger or eyesy.midi_note_new:
        trigger = True
    if trigger == True :
        # Calculate valid ranges for random positions
        x_min = max(0, int(xhalf - xdensity))
        x_max = min(xr, int((xhalf + 2) + xdensity + 10))
        y_min = max(0, int(yhalf - ydensity))
        y_max = min(yr, int((yhalf + 2) + ydensity + 10))
        # Ensure valid ranges
        if x_max <= x_min:
            x_max = x_min + 1
        if y_max <= y_min:
            y_max = y_min + 1
        pos = [(random.randrange(x_min, x_max), random.randrange(y_min, y_max)) for i in range(0,12)]
    # Ensure we don't access beyond pos array bounds
    balls = min(balls, len(pos))
    for i in range (0, balls):
        color = eyesy.color_picker_lfo(eyesy.knob4)
        pygame.draw.circle(screen, color, pos[i], int(size), 0)
    trigger = False
