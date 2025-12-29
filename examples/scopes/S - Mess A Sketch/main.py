import pygame
import random
def setup(screen, eyesy):
    global drawing, current_pos, mess
    current_pos = (
        (int(eyesy.knob1 * eyesy.xres), int((1 - eyesy.knob2) * eyesy.yres)),
        eyesy.color_picker(eyesy.knob4),
        int(eyesy.knob3 * 0)
        )
    drawing = [current_pos]
    mess = False
def draw(screen, eyesy):
    global drawing, current_pos, mess
    pygame.time.Clock().tick(60)
    screen.fill(eyesy.color_picker_bg(eyesy.knob5))
    if drawing[-1][0] == current_pos[0]:
        drawing[-1] == current_pos
    elif drawing[-1] != current_pos and int(eyesy.knob3 * 30) > 0:
        drawing.append(current_pos)
    if mess:
        audio_level = abs(eyesy.audio_in[0]) / 32767.0
        random_offset = int(audio_level * 50)
        for i in range(1, len(drawing)):
            pygame.draw.line(screen, drawing[i][1],
                            (drawing[i-1][0][0] + random.randint(-random_offset, random_offset),
                                        drawing[i-1][0][1] + random.randint(-random_offset, random_offset)),
                            (drawing[i][0][0] + random.randint(-random_offset, random_offset),
                                    drawing[i][0][1] + random.randint(-random_offset, random_offset)),
                            drawing[i][2])
    else:
        for i in range(1, len(drawing)):
            pygame.draw.line(screen, drawing[i][1], drawing[i-1][0], drawing[i][0], drawing[i][2])
    if eyesy.trig:
        mess = not mess
    # clear the drawing
    if eyesy.trig and all((eyesy.knob1 == 1, eyesy.knob2 == 1, eyesy.knob3 == 0, eyesy.knob4 == 1, eyesy.knob5 == 1)):
        drawing = [current_pos]
    current_pos = (
        (int(eyesy.knob1 * eyesy.xres), int((1 -eyesy.knob2) * eyesy.yres)),
        eyesy.color_picker(eyesy.knob4),
        int(eyesy.knob3 * 30)
        )
    pygame.draw.line(screen, eyesy.color_picker(eyesy.knob4), (int(eyesy.knob1 * eyesy.xres), int((1 -eyesy.knob2) * eyesy.yres)), (int(eyesy.knob1 * eyesy.xres), int((1 -eyesy.knob2) * eyesy.yres)), int(eyesy.knob3 * 30) + 5)
