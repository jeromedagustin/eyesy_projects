import os
import pygame
import glob
import random
from pygame.locals import *
images = []
patterns = []
def setup(screen, eyesy) :
    global w1, h1, images, patterns
    for filepath in sorted(glob.glob(eyesy.mode_root + '/Images/*.png')):
        filename = os.path.basename(filepath)
        print('loading image file: ' + filename)
        img = pygame.image.load(filepath)
        images.append(img)
    patterns = generate_pattern(80, screen, eyesy)
def generate_pattern(TILEWIDTH_HALF, screen, eyesy):
    lines = []
    # Ensure TILEWIDTH_HALF is valid
    if TILEWIDTH_HALF <= 0:
        TILEWIDTH_HALF = 1.0
    step = int(max(1, TILEWIDTH_HALF))
    max_range = int(max(1, 600-200*eyesy.knob1))
    for  x in range(0, max_range, step):
        for y in range(0, max_range, step):
            cart_x = x
            cart_y = y
            iso_x = (cart_x - cart_y)
            iso_y = (cart_x + cart_y)/2
            centered_x = screen.get_rect().centerx + iso_x - 60
            centered_y = screen.get_rect().centery/8 + iso_y
            if random.random() > (1*eyesy.knob3):
                lines.append([0, centered_x, centered_y])
            else:
                lines.append([1, centered_x, centered_y])
    return lines
def draw(screen, eyesy):
    global images, patterns
    eyesy.color_picker_bg(eyesy.knob5)
    # Safety check: if no images loaded, skip drawing
    if not images or len(images) == 0:
        return
    TileSize=int(160-64*eyesy.knob1)#+96*eyesy.knob1
    TILEWIDTH = TileSize  #holds the tile width and height
    TILEWIDTH_HALF = TILEWIDTH /2
    # Use audio_trig if available (test runner), otherwise use trig (official API)
    audio_trigger = getattr(eyesy, 'audio_trig', False) or eyesy.trig
    if audio_trigger:
        patterns = generate_pattern(TILEWIDTH_HALF, screen, eyesy)
    # Safety check: ensure patterns is valid and not empty
    if not patterns or len(patterns) == 0:
        return
    # Process patterns - use non-destructive indexing instead of pop()
    for p, pattern in enumerate(patterns):
        # Validate pattern structure
        if not pattern or len(pattern) < 3:
            continue
        # Extract values using indexing (non-destructive)
        i = int(pattern[0])  # Image index (0 or 1)
        j = float(pattern[1])  # X position
        k = float(pattern[2])  # Y position
        # Ensure index is within bounds
        i = i % len(images) if len(images) > 0 else 0
        # Calculate audio-reactive Y position
        audio_index = p % len(eyesy.audio_in) if len(eyesy.audio_in) > 0 else 0
        audio_val = eyesy.audio_in[audio_index] if audio_index < len(eyesy.audio_in) else 0
        y = k + audio_val * .01 * eyesy.knob2
        # Draw the image
        pic = images[i]
        screen.blit(pic, (int(j), int(y)))
    #Trails
    veil = pygame.Surface((eyesy.xres, eyesy.yres))
    veil.set_alpha(int(eyesy.knob4 * 50))
    # Get background color - bg_color is set by color_picker_bg() call above
    bg_color = getattr(eyesy, 'bg_color', eyesy.color_picker(eyesy.knob5))
    veil.fill((bg_color[0], bg_color[1], bg_color[2]))
    screen.blit(veil, (0,0))
