import os
import pygame
import math

"""
EYESY Mode Template

This is a basic template for creating custom EYESY modes.
Each mode needs at least two functions: setup() and draw()

Knob Assignments (customize as needed):
- Knob1 - Parameter 1
- Knob2 - Parameter 2
- Knob3 - Parameter 3
- Knob4 - Foreground color
- Knob5 - Background color
"""

def setup(screen, eyesy):
    """
    Called once when the mode is loaded.
    Use this to initialize variables, load images, etc.
    """
    pass

def draw(screen, eyesy):
    """
    Called once per frame to render visuals.
    This is where your main drawing code goes.
    """
    # Set background color
    eyesy.color_picker_bg(eyesy.knob5)
    
    # Get foreground color
    color = eyesy.color_picker(eyesy.knob4)
    
    # Example: Draw a circle at the center
    center_x = eyesy.xres // 2
    center_y = eyesy.yres // 2
    radius = int(eyesy.knob1 * min(eyesy.xres, eyesy.yres) * 0.3)
    
    pygame.draw.circle(screen, color, (center_x, center_y), radius)
    
    # Example: Draw a line based on audio input
    if len(eyesy.audio_in) > 0:
        audio_level = abs(eyesy.audio_in[0]) / 32768.0
        line_height = int(audio_level * eyesy.yres * eyesy.knob2)
        pygame.draw.line(
            screen, 
            color, 
            (0, eyesy.yres // 2), 
            (line_height, eyesy.yres // 2), 
            5
        )


