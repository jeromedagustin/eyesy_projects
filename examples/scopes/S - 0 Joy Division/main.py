import pygame
import math
# Global waveform buffer
line_buffer = []
def setup(screen, eyesy):
    global line_buffer
    line_buffer = []
def draw(screen, eyesy):
    global line_buffer
    # Set black background
    screen.fill((0, 0, 0))
    # Get screen dimensions
    w, h = int(eyesy.xres), int(eyesy.yres)
    # Number of horizontal segments across width
    num_points = 100
    #spacing = w / num_points
    line_width_ratio = 0.6  # or 0.4 for narrower lines
    x_start = (1 - line_width_ratio) * w / 2
    x_end = w - x_start
    usable_width = x_end - x_start
    spacing = usable_width / num_points
    # Normalize audio into waveform
    audio = eyesy.audio_in
    waveform = []
    for i in range(num_points):
        idx = int(i * len(audio) / num_points)
        sample = audio[idx] / 32768  # normalize to -1 to 1
        #y_offset = sample * 75  # scale height of waveform
        y_offset = sample * (10 + eyesy.knob5 * 100)
        waveform.append(y_offset)
    # Add new line to buffer
    line_buffer.insert(0, waveform)
    # Keep only enough lines to fill screen
    max_lines = int(h / 6)
    #max_lines = 24         # only show 24 lines
    line_spacing = 16
    line_buffer = line_buffer[:max_lines]
    # Draw each horizontal line
    for i, line in enumerate(line_buffer):
        y = h - i * line_spacing  # spacing between lines
        points = []
        for j, offset in enumerate(line):
            #x = int(j * spacing)
            x = int(x_start + j * spacing)
            wave = offset
            # Apply center pull (like the original artwork)
            dist_from_center = abs(j - num_points / 2)
            wave *= 1 - (dist_from_center / (num_points / 2))
            points.append((x, int(y + wave)))
        if len(points) > 1:
            pygame.draw.lines(screen, (255, 255, 255), False, points, 1)
