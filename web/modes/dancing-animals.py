import os
import pygame
import math
import random

"""
Dancing Animals Circle Mode

2D animal characters arranged in a circle, dancing to audio with a smaller set of dance moves.

Knob Assignments:
- Knob1 - Animal size
- Knob2 - Dance intensity (controls overall movement amplitude and speed)
- Knob3 - Number of animals (1-25)
- Knob4 - Foreground color (animal color)
- Knob5 - Background color
"""

# Global variables
dance_time = 0.0
animal_types = ['cat', 'dog', 'bird', 'rabbit', 'bear', 'fox', 'elephant', 'giraffe', 'penguin', 'monkey', 'lion', 'pig', 'horse', 'duck', 'tiger', 'zebra', 'panda', 'kangaroo', 'owl', 'turtle', 'snake', 'octopus']
cached_positions = []  # Cached random positions
cached_num_animals = 0  # Track when to regenerate positions

def setup(screen, eyesy):
    """Initialize the mode"""
    global dance_time, cached_positions, cached_num_animals
    dance_time = 0.0
    cached_positions = []
    cached_num_animals = 0

def draw_cat(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a cat character"""
    # Head (circle)
    head_radius = size * 0.2
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (triangles)
    ear_size = size * 0.15
    # Left ear
    ear1_points = [
        (int(head_x - head_radius * 0.5), int(head_y - head_radius * 0.3)),
        (int(head_x - head_radius * 0.2), int(head_y - head_radius * 1.2)),
        (int(head_x), int(head_y - head_radius * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    # Right ear
    ear2_points = [
        (int(head_x + head_radius * 0.5), int(head_y - head_radius * 0.3)),
        (int(head_x + head_radius * 0.2), int(head_y - head_radius * 1.2)),
        (int(head_x), int(head_y - head_radius * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Body (oval) - positioned directly below head, no double lean/bounce
    body_width = size * 0.3
    body_height = size * 0.4
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Tail (multi-segment with wave motion, like a real cat tail)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius + body_height * 0.3
    tail_length = size * 0.35
    
    # Create wave motion - base moves less, tip moves more (like real tail)
    # Tail has 3 segments for smooth wave motion
    tail_wave_base = arm_swing * 0.6  # Base movement
    tail_wave_mid = arm_swing * 0.8 + math.sin(leg_swing * 0.5) * 0.3  # Middle movement
    tail_wave_tip = arm_swing * 1.0 + math.sin(leg_swing) * 0.5  # Tip moves most
    
    # Segment 1: Base to middle (moves less)
    mid_x = tail_start_x + math.cos(tail_wave_base) * tail_length * 0.4
    mid_y = tail_start_y + math.sin(tail_wave_base) * tail_length * 0.25
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(mid_x), int(mid_y)),
                    max(2, int(size * 0.08)))
    
    # Segment 2: Middle to tip (moves more)
    tip_x = mid_x + math.cos(tail_wave_tip) * tail_length * 0.6
    tip_y = mid_y + math.sin(tail_wave_tip) * tail_length * 0.4
    pygame.draw.line(screen, color,
                    (int(mid_x), int(mid_y)),
                    (int(tip_x), int(tip_y)),
                    max(2, int(size * 0.07)))
    
    # Legs (4 legs)
    leg_length = size * 0.25
    leg_width = size * 0.06
    hip_y = head_y + head_radius + body_height
    
    # Front legs
    front_leg1_x = head_x - body_width * 0.3
    front_leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg1_x), int(hip_y)),
                    (int(front_leg1_x), int(front_leg1_y)),
                    max(2, int(leg_width)))
    
    front_leg2_x = head_x + body_width * 0.3
    front_leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg2_x), int(hip_y)),
                    (int(front_leg2_x), int(front_leg2_y)),
                    max(2, int(leg_width)))
    
    # Back legs
    back_leg1_x = head_x - body_width * 0.2
    back_leg1_y = hip_y + math.sin(leg_swing + math.pi * 0.5) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg1_x), int(hip_y)),
                    (int(back_leg1_x), int(back_leg1_y)),
                    max(2, int(leg_width)))
    
    back_leg2_x = head_x + body_width * 0.2
    back_leg2_y = hip_y + math.sin(leg_swing + math.pi * 1.5) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg2_x), int(hip_y)),
                    (int(back_leg2_x), int(back_leg2_y)),
                    max(2, int(leg_width)))

def draw_dog(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a dog character"""
    # Head (circle)
    head_radius = size * 0.2
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (droopy)
    ear_length = size * 0.2
    # Left ear
    pygame.draw.ellipse(screen, color,
                       (int(head_x - head_radius * 0.7), int(head_y - head_radius * 0.3),
                        int(head_radius * 0.4), int(ear_length)))
    # Right ear
    pygame.draw.ellipse(screen, color,
                       (int(head_x + head_radius * 0.3), int(head_y - head_radius * 0.3),
                        int(head_radius * 0.4), int(ear_length)))
    
    # Body (oval) - positioned directly below head
    body_width = size * 0.35
    body_height = size * 0.4
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Tail (wagging with wave motion, like a real dog tail)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius + body_height * 0.2
    tail_length = size * 0.3
    
    # Dog tail wags side to side with wave motion
    # Base moves less, tip wags more (characteristic dog wag)
    tail_wag_base = arm_swing * 0.7  # Base wag
    tail_wag_mid = arm_swing * 0.9 + math.sin(leg_swing * 0.6) * 0.4  # Middle wag
    tail_wag_tip = arm_swing * 1.2 + math.sin(leg_swing * 0.8) * 0.6  # Tip wags most
    
    # Segment 1: Base to middle
    mid_x = tail_start_x + math.cos(tail_wag_base) * tail_length * 0.35
    mid_y = tail_start_y + math.sin(tail_wag_base) * tail_length * 0.2
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(mid_x), int(mid_y)),
                    max(2, int(size * 0.08)))
    
    # Segment 2: Middle to tip (wags more)
    tip_x = mid_x + math.cos(tail_wag_tip) * tail_length * 0.65
    tip_y = mid_y + math.sin(tail_wag_tip) * tail_length * 0.3
    pygame.draw.line(screen, color,
                    (int(mid_x), int(mid_y)),
                    (int(tip_x), int(tip_y)),
                    max(2, int(size * 0.07)))
    
    # Legs (4 legs)
    leg_length = size * 0.25
    leg_width = size * 0.06
    hip_y = head_y + head_radius + body_height
    
    # Front legs
    front_leg1_x = head_x - body_width * 0.3
    front_leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg1_x), int(hip_y)),
                    (int(front_leg1_x), int(front_leg1_y)),
                    max(2, int(leg_width)))
    
    front_leg2_x = head_x + body_width * 0.3
    front_leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg2_x), int(hip_y)),
                    (int(front_leg2_x), int(front_leg2_y)),
                    max(2, int(leg_width)))
    
    # Back legs
    back_leg1_x = head_x - body_width * 0.2
    back_leg1_y = hip_y + math.sin(leg_swing + math.pi * 0.5) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg1_x), int(hip_y)),
                    (int(back_leg1_x), int(back_leg1_y)),
                    max(2, int(leg_width)))
    
    back_leg2_x = head_x + body_width * 0.2
    back_leg2_y = hip_y + math.sin(leg_swing + math.pi * 1.5) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg2_x), int(hip_y)),
                    (int(back_leg2_x), int(back_leg2_y)),
                    max(2, int(leg_width)))

def draw_bird(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a bird character"""
    # Body (oval)
    body_width = size * 0.25
    body_height = size * 0.3
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.2 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Head (small circle)
    head_radius = size * 0.12
    head_x = body_x - body_width * 0.3
    head_y = body_y - body_height * 0.2
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Beak (triangle)
    beak_size = size * 0.08
    beak_points = [
        (int(head_x - head_radius), int(head_y)),
        (int(head_x - head_radius - beak_size), int(head_y - beak_size * 0.5)),
        (int(head_x - head_radius - beak_size), int(head_y + beak_size * 0.5))
    ]
    pygame.draw.polygon(screen, color, beak_points)
    
    # Wings (flapping)
    wing_span = size * 0.4
    wing_angle = arm_swing * 0.8
    # Left wing
    wing1_start_x = body_x - body_width * 0.2
    wing1_start_y = body_y
    wing1_end_x = wing1_start_x + math.cos(wing_angle - math.pi * 0.5) * wing_span
    wing1_end_y = wing1_start_y + math.sin(wing_angle - math.pi * 0.5) * wing_span
    pygame.draw.line(screen, color,
                    (int(wing1_start_x), int(wing1_start_y)),
                    (int(wing1_end_x), int(wing1_end_y)),
                    max(2, int(size * 0.1)))
    # Right wing
    wing2_start_x = body_x + body_width * 0.2
    wing2_start_y = body_y
    wing2_end_x = wing2_start_x + math.cos(-wing_angle - math.pi * 0.5) * wing_span
    wing2_end_y = wing2_start_y + math.sin(-wing_angle - math.pi * 0.5) * wing_span
    pygame.draw.line(screen, color,
                    (int(wing2_start_x), int(wing2_start_y)),
                    (int(wing2_end_x), int(wing2_end_y)),
                    max(2, int(size * 0.1)))
    
    # Legs (2 legs)
    leg_length = size * 0.2
    leg_width = size * 0.04
    leg_y = body_y + body_height // 2
    
    leg1_x = body_x - body_width * 0.15
    leg1_end_y = leg_y + leg_length + math.sin(leg_swing) * leg_length * 0.2
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(leg_y)),
                    (int(leg1_x), int(leg1_end_y)),
                    max(2, int(leg_width)))
    
    leg2_x = body_x + body_width * 0.15
    leg2_end_y = leg_y + leg_length + math.sin(leg_swing + math.pi) * leg_length * 0.2
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(leg_y)),
                    (int(leg2_x), int(leg2_end_y)),
                    max(2, int(leg_width)))

def draw_rabbit(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a rabbit character"""
    # Head (circle)
    head_radius = size * 0.2
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (long, upright)
    ear_length = size * 0.35
    ear_width = size * 0.08
    # Left ear
    ear1_rect = pygame.Rect(
        int(head_x - head_radius * 0.3 - ear_width // 2),
        int(head_y - head_radius * 1.2),
        int(ear_width),
        int(ear_length)
    )
    pygame.draw.ellipse(screen, color, ear1_rect)
    # Right ear
    ear2_rect = pygame.Rect(
        int(head_x + head_radius * 0.3 - ear_width // 2),
        int(head_y - head_radius * 1.2),
        int(ear_width),
        int(ear_length)
    )
    pygame.draw.ellipse(screen, color, ear2_rect)
    
    # Body (oval) - positioned directly below head
    body_width = size * 0.3
    body_height = size * 0.35
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Tail (small circle)
    tail_radius = size * 0.08
    tail_x = head_x + body_width // 2
    tail_y = head_y + head_radius + body_height * 0.3
    pygame.draw.circle(screen, color, (int(tail_x), int(tail_y)), int(tail_radius))
    
    # Legs (4 legs, back legs bigger)
    leg_length = size * 0.25
    leg_width = size * 0.06
    hip_y = head_y + head_radius + body_height
    
    # Front legs
    front_leg1_x = head_x - body_width * 0.25
    front_leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg1_x), int(hip_y)),
                    (int(front_leg1_x), int(front_leg1_y)),
                    max(2, int(leg_width)))
    
    front_leg2_x = head_x + body_width * 0.25
    front_leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg2_x), int(hip_y)),
                    (int(front_leg2_x), int(front_leg2_y)),
                    max(2, int(leg_width)))
    
    # Back legs (bigger)
    back_leg_length = size * 0.3
    back_leg1_x = head_x - body_width * 0.15
    back_leg1_y = hip_y + math.sin(leg_swing + math.pi * 0.5) * back_leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg1_x), int(hip_y)),
                    (int(back_leg1_x), int(back_leg1_y)),
                    max(2, int(leg_width * 1.2)))
    
    back_leg2_x = head_x + body_width * 0.15
    back_leg2_y = hip_y + math.sin(leg_swing + math.pi * 1.5) * back_leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg2_x), int(hip_y)),
                    (int(back_leg2_x), int(back_leg2_y)),
                    max(2, int(leg_width * 1.2)))

def draw_bear(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a bear character"""
    # Head (circle)
    head_radius = size * 0.22
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (small circles)
    ear_radius = size * 0.08
    pygame.draw.circle(screen, color, 
                      (int(head_x - head_radius * 0.6), int(head_y - head_radius * 0.5)),
                      int(ear_radius))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.6), int(head_y - head_radius * 0.5)),
                      int(ear_radius))
    
    # Body (large oval) - positioned directly below head
    body_width = size * 0.4
    body_height = size * 0.45
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Arms (thick)
    arm_length = size * 0.3
    arm_width = size * 0.08
    shoulder_y = head_y + head_radius + body_height * 0.2
    
    # Left arm
    left_arm_x = head_x - body_width // 2
    left_arm_end_x = left_arm_x + math.cos(arm_swing - math.pi * 0.5) * arm_length
    left_arm_end_y = shoulder_y + math.sin(arm_swing - math.pi * 0.5) * arm_length
    pygame.draw.line(screen, color,
                    (int(left_arm_x), int(shoulder_y)),
                    (int(left_arm_end_x), int(left_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Right arm
    right_arm_x = head_x + body_width // 2
    right_arm_end_x = right_arm_x + math.cos(-arm_swing - math.pi * 0.5) * arm_length
    right_arm_end_y = shoulder_y + math.sin(-arm_swing - math.pi * 0.5) * arm_length
    pygame.draw.line(screen, color,
                    (int(right_arm_x), int(shoulder_y)),
                    (int(right_arm_end_x), int(right_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Legs (thick)
    leg_length = size * 0.28
    leg_width = size * 0.08
    hip_y = head_y + head_radius + body_height
    
    leg1_x = head_x - body_width * 0.25
    leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(hip_y)),
                    (int(leg1_x), int(leg1_y)),
                    max(2, int(leg_width)))
    
    leg2_x = head_x + body_width * 0.25
    leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(hip_y)),
                    (int(leg2_x), int(leg2_y)),
                    max(2, int(leg_width)))

def draw_fox(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a fox character"""
    # Head (pointed)
    head_radius = size * 0.18
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    # Head shape (triangle-like)
    head_points = [
        (int(head_x), int(head_y - head_radius * 0.8)),
        (int(head_x - head_radius * 0.6), int(head_y + head_radius * 0.3)),
        (int(head_x + head_radius * 0.6), int(head_y + head_radius * 0.3))
    ]
    pygame.draw.polygon(screen, color, head_points)
    
    # Ears (pointed triangles)
    ear_size = size * 0.12
    # Left ear
    ear1_points = [
        (int(head_x - head_radius * 0.4), int(head_y - head_radius * 0.5)),
        (int(head_x - head_radius * 0.6), int(head_y - head_radius * 1.2)),
        (int(head_x - head_radius * 0.1), int(head_y - head_radius * 0.7))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    # Right ear
    ear2_points = [
        (int(head_x + head_radius * 0.4), int(head_y - head_radius * 0.5)),
        (int(head_x + head_radius * 0.6), int(head_y - head_radius * 1.2)),
        (int(head_x + head_radius * 0.1), int(head_y - head_radius * 0.7))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Body (oval) - positioned directly below head
    body_width = size * 0.32
    body_height = size * 0.38
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius * 0.5),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Tail (fluffy, curved)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius * 0.5 + body_height * 0.2
    tail_mid_x = tail_start_x + math.cos(arm_swing * 0.6) * size * 0.25
    tail_mid_y = tail_start_y + math.sin(arm_swing * 0.6) * size * 0.15
    tail_end_x = tail_mid_x + math.cos(arm_swing * 0.6 + 0.5) * size * 0.2
    tail_end_y = tail_mid_y + math.sin(arm_swing * 0.6 + 0.5) * size * 0.1
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_mid_x), int(tail_mid_y)),
                    max(2, int(size * 0.08)))
    pygame.draw.line(screen, color,
                    (int(tail_mid_x), int(tail_mid_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.08)))
    
    # Legs (4 legs)
    leg_length = size * 0.26
    leg_width = size * 0.06
    hip_y = head_y + head_radius * 0.5 + body_height
    
    # Front legs
    front_leg1_x = head_x - body_width * 0.28
    front_leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg1_x), int(hip_y)),
                    (int(front_leg1_x), int(front_leg1_y)),
                    max(2, int(leg_width)))
    
    front_leg2_x = head_x + body_width * 0.28
    front_leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(front_leg2_x), int(hip_y)),
                    (int(front_leg2_x), int(front_leg2_y)),
                    max(2, int(leg_width)))
    
    # Back legs
    back_leg1_x = head_x - body_width * 0.18
    back_leg1_y = hip_y + math.sin(leg_swing + math.pi * 0.5) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg1_x), int(hip_y)),
                    (int(back_leg1_x), int(back_leg1_y)),
                    max(2, int(leg_width)))
    
    back_leg2_x = head_x + body_width * 0.18
    back_leg2_y = hip_y + math.sin(leg_swing + math.pi * 1.5) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(back_leg2_x), int(hip_y)),
                    (int(back_leg2_x), int(back_leg2_y)),
                    max(2, int(leg_width)))

def draw_elephant(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw an elephant character"""
    # Head (large circle)
    head_radius = size * 0.25
    head_y = y - size * 0.25 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Trunk (curved line)
    trunk_length = size * 0.35
    trunk_angle = math.sin(arm_swing * 0.8) * 0.3
    trunk_end_x = head_x + math.sin(trunk_angle) * trunk_length
    trunk_end_y = head_y + head_radius * 0.3 + math.cos(trunk_angle) * trunk_length
    pygame.draw.line(screen, color,
                    (int(head_x), int(head_y + head_radius * 0.3)),
                    (int(trunk_end_x), int(trunk_end_y)),
                    max(3, int(size * 0.1)))
    
    # Ears (large circles)
    ear_radius = size * 0.18
    pygame.draw.circle(screen, color,
                      (int(head_x - head_radius * 0.7), int(head_y)),
                      int(ear_radius))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.7), int(head_y)),
                      int(ear_radius))
    
    # Body (large oval)
    body_width = size * 0.45
    body_height = size * 0.5
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Legs (4 thick legs)
    leg_length = size * 0.3
    leg_width = size * 0.1
    hip_y = head_y + head_radius + body_height
    
    for leg_offset in [-body_width * 0.3, -body_width * 0.1, body_width * 0.1, body_width * 0.3]:
        leg_x = head_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.2
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))
    
    # Tail (small line)
    tail_x = head_x + body_width // 2
    tail_y = head_y + head_radius + body_height * 0.3
    tail_end_x = tail_x + math.cos(arm_swing) * size * 0.2
    tail_end_y = tail_y + math.sin(arm_swing) * size * 0.1
    pygame.draw.line(screen, color,
                    (int(tail_x), int(tail_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.06)))

def draw_giraffe(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a giraffe character"""
    # Body (oval)
    body_width = size * 0.3
    body_height = size * 0.35
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.15 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Long neck
    neck_length = size * 0.5
    neck_start_y = body_y - body_height // 2
    neck_end_y = neck_start_y - neck_length
    neck_x = body_x + lean * size * 0.05
    pygame.draw.line(screen, color,
                    (int(neck_x), int(neck_start_y)),
                    (int(neck_x), int(neck_end_y)),
                    max(3, int(size * 0.08)))
    
    # Head (small circle at top of neck)
    head_radius = size * 0.15
    head_x = neck_x
    head_y = neck_end_y
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Small horns/ossicones
    horn_size = size * 0.08
    pygame.draw.line(screen, color,
                    (int(head_x - head_radius * 0.3), int(head_y - head_radius)),
                    (int(head_x - head_radius * 0.3), int(head_y - head_radius - horn_size)),
                    max(2, int(size * 0.04)))
    pygame.draw.line(screen, color,
                    (int(head_x + head_radius * 0.3), int(head_y - head_radius)),
                    (int(head_x + head_radius * 0.3), int(head_y - head_radius - horn_size)),
                    max(2, int(size * 0.04)))
    
    # Legs (4 long legs)
    leg_length = size * 0.4
    leg_width = size * 0.06
    hip_y = body_y + body_height // 2
    
    for leg_offset in [-body_width * 0.35, -body_width * 0.15, body_width * 0.15, body_width * 0.35]:
        leg_x = body_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.25
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))
    
    # Tail (small line)
    tail_x = body_x + body_width // 2
    tail_y = body_y + body_height * 0.2
    tail_end_x = tail_x + math.cos(arm_swing) * size * 0.15
    tail_end_y = tail_y + math.sin(arm_swing) * size * 0.1
    pygame.draw.line(screen, color,
                    (int(tail_x), int(tail_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.05)))

def draw_penguin(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a penguin character"""
    # Body (oval, more vertical)
    body_width = size * 0.28
    body_height = size * 0.45
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.2 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Head (circle on top)
    head_radius = size * 0.18
    head_x = body_x
    head_y = body_y - body_height // 2 - head_radius * 0.3
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Beak (small triangle)
    beak_size = size * 0.06
    beak_points = [
        (int(head_x), int(head_y + head_radius * 0.3)),
        (int(head_x - beak_size * 0.5), int(head_y + head_radius * 0.6)),
        (int(head_x + beak_size * 0.5), int(head_y + head_radius * 0.6))
    ]
    pygame.draw.polygon(screen, color, beak_points)
    
    # Wings (flippers on sides)
    wing_length = size * 0.25
    wing_angle = arm_swing * 0.7
    # Left wing
    wing1_x = body_x - body_width // 2
    wing1_y = body_y
    wing1_end_x = wing1_x + math.cos(wing_angle - math.pi * 0.5) * wing_length
    wing1_end_y = wing1_y + math.sin(wing_angle - math.pi * 0.5) * wing_length
    pygame.draw.line(screen, color,
                    (int(wing1_x), int(wing1_y)),
                    (int(wing1_end_x), int(wing1_end_y)),
                    max(3, int(size * 0.08)))
    # Right wing
    wing2_x = body_x + body_width // 2
    wing2_y = body_y
    wing2_end_x = wing2_x + math.cos(-wing_angle - math.pi * 0.5) * wing_length
    wing2_end_y = wing2_y + math.sin(-wing_angle - math.pi * 0.5) * wing_length
    pygame.draw.line(screen, color,
                    (int(wing2_x), int(wing2_y)),
                    (int(wing2_end_x), int(wing2_end_y)),
                    max(3, int(size * 0.08)))
    
    # Legs (2 short legs)
    leg_length = size * 0.15
    leg_width = size * 0.05
    leg_y = body_y + body_height // 2
    
    leg1_x = body_x - body_width * 0.2
    leg1_end_y = leg_y + leg_length + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(leg_y)),
                    (int(leg1_x), int(leg1_end_y)),
                    max(2, int(leg_width)))
    
    leg2_x = body_x + body_width * 0.2
    leg2_end_y = leg_y + leg_length + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(leg_y)),
                    (int(leg2_x), int(leg2_end_y)),
                    max(2, int(leg_width)))

def draw_monkey(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a monkey character"""
    # Head (circle)
    head_radius = size * 0.2
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (small circles)
    ear_radius = size * 0.08
    pygame.draw.circle(screen, color,
                      (int(head_x - head_radius * 0.6), int(head_y)),
                      int(ear_radius))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.6), int(head_y)),
                      int(ear_radius))
    
    # Body (oval)
    body_width = size * 0.32
    body_height = size * 0.38
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Arms (long, swinging)
    arm_length = size * 0.35
    arm_width = size * 0.07
    shoulder_y = head_y + head_radius + body_height * 0.2
    
    # Left arm
    left_arm_x = head_x - body_width // 2
    left_arm_end_x = left_arm_x + math.cos(arm_swing - math.pi * 0.5) * arm_length
    left_arm_end_y = shoulder_y + math.sin(arm_swing - math.pi * 0.5) * arm_length
    pygame.draw.line(screen, color,
                    (int(left_arm_x), int(shoulder_y)),
                    (int(left_arm_end_x), int(left_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Right arm
    right_arm_x = head_x + body_width // 2
    right_arm_end_x = right_arm_x + math.cos(-arm_swing - math.pi * 0.5) * arm_length
    right_arm_end_y = shoulder_y + math.sin(-arm_swing - math.pi * 0.5) * arm_length
    pygame.draw.line(screen, color,
                    (int(right_arm_x), int(shoulder_y)),
                    (int(right_arm_end_x), int(right_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Legs (4 legs)
    leg_length = size * 0.28
    leg_width = size * 0.06
    hip_y = head_y + head_radius + body_height
    
    for leg_offset in [-body_width * 0.28, -body_width * 0.12, body_width * 0.12, body_width * 0.28]:
        leg_x = head_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.3
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))
    
    # Tail (curved, long)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius + body_height * 0.3
    tail_mid_x = tail_start_x + math.cos(arm_swing * 0.7) * size * 0.3
    tail_mid_y = tail_start_y + math.sin(arm_swing * 0.7) * size * 0.2
    tail_end_x = tail_mid_x + math.cos(arm_swing * 0.7 + 0.4) * size * 0.25
    tail_end_y = tail_mid_y + math.sin(arm_swing * 0.7 + 0.4) * size * 0.15
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_mid_x), int(tail_mid_y)),
                    max(2, int(size * 0.07)))
    pygame.draw.line(screen, color,
                    (int(tail_mid_x), int(tail_mid_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.07)))

def draw_lion(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a lion character (similar to cat but with mane)"""
    # Head (circle)
    head_radius = size * 0.2
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    # Mane (larger circle around head)
    mane_radius = head_radius * 1.4
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(mane_radius))
    
    # Head (drawn on top of mane)
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Body (oval)
    body_width = size * 0.32
    body_height = size * 0.4
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Tail (with tuft)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius + body_height * 0.3
    tail_end_x = tail_start_x + math.cos(arm_swing * 0.5) * size * 0.3
    tail_end_y = tail_start_y + math.sin(arm_swing * 0.5) * size * 0.2
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.08)))
    # Tail tuft
    pygame.draw.circle(screen, color, (int(tail_end_x), int(tail_end_y)), int(size * 0.06))
    
    # Legs (4 legs)
    leg_length = size * 0.26
    leg_width = size * 0.06
    hip_y = head_y + head_radius + body_height
    
    for leg_offset in [-body_width * 0.3, -body_width * 0.15, body_width * 0.15, body_width * 0.3]:
        leg_x = head_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.3
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))

def draw_pig(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a pig character"""
    # Body (large round oval)
    body_width = size * 0.4
    body_height = size * 0.38
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.2 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Head (smaller circle, attached to body)
    head_radius = size * 0.18
    head_x = body_x - body_width * 0.25
    head_y = body_y
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Snout (small oval)
    snout_width = size * 0.12
    snout_height = size * 0.08
    snout_x = head_x - head_radius
    snout_y = head_y
    snout_rect = pygame.Rect(
        int(snout_x - snout_width // 2),
        int(snout_y - snout_height // 2),
        int(snout_width),
        int(snout_height)
    )
    pygame.draw.ellipse(screen, color, snout_rect)
    
    # Ears (small triangles)
    ear_size = size * 0.1
    # Left ear
    ear1_points = [
        (int(head_x - head_radius * 0.3), int(head_y - head_radius * 0.5)),
        (int(head_x - head_radius * 0.7), int(head_y - head_radius * 0.8)),
        (int(head_x - head_radius * 0.1), int(head_y - head_radius * 0.6))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    # Right ear
    ear2_points = [
        (int(head_x + head_radius * 0.3), int(head_y - head_radius * 0.5)),
        (int(head_x + head_radius * 0.7), int(head_y - head_radius * 0.8)),
        (int(head_x + head_radius * 0.1), int(head_y - head_radius * 0.6))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Tail (curly)
    tail_start_x = body_x + body_width // 2
    tail_start_y = body_y + body_height * 0.2
    tail_angle = arm_swing * 0.6
    tail_mid_x = tail_start_x + math.cos(tail_angle) * size * 0.2
    tail_mid_y = tail_start_y + math.sin(tail_angle) * size * 0.15
    tail_end_x = tail_mid_x + math.cos(tail_angle + 1.0) * size * 0.15
    tail_end_y = tail_mid_y + math.sin(tail_angle + 1.0) * size * 0.1
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_mid_x), int(tail_mid_y)),
                    max(2, int(size * 0.07)))
    pygame.draw.line(screen, color,
                    (int(tail_mid_x), int(tail_mid_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.07)))
    
    # Legs (4 short legs)
    leg_length = size * 0.22
    leg_width = size * 0.07
    leg_y = body_y + body_height // 2
    
    for leg_offset in [-body_width * 0.3, -body_width * 0.1, body_width * 0.1, body_width * 0.3]:
        leg_x = body_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y_end = leg_y + leg_length + math.sin(leg_phase) * leg_length * 0.2
        pygame.draw.line(screen, color,
                        (int(leg_x), int(leg_y)),
                        (int(leg_x), int(leg_y_end)),
                        max(2, int(leg_width)))

def draw_horse(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a horse character"""
    # Body (oval)
    body_width = size * 0.35
    body_height = size * 0.32
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.15 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Neck (long, curved)
    neck_length = size * 0.4
    neck_start_y = body_y - body_height // 2
    neck_angle = lean * 0.3
    neck_end_y = neck_start_y - neck_length
    neck_end_x = body_x + math.sin(neck_angle) * neck_length * 0.3
    pygame.draw.line(screen, color,
                    (int(body_x), int(neck_start_y)),
                    (int(neck_end_x), int(neck_end_y)),
                    max(3, int(size * 0.08)))
    
    # Head (oval at end of neck)
    head_width = size * 0.18
    head_height = size * 0.15
    head_x = neck_end_x
    head_y = neck_end_y
    head_rect = pygame.Rect(
        int(head_x - head_width // 2),
        int(head_y - head_height // 2),
        int(head_width),
        int(head_height)
    )
    pygame.draw.ellipse(screen, color, head_rect)
    
    # Ears (small triangles)
    ear_size = size * 0.08
    ear1_points = [
        (int(head_x - head_width * 0.2), int(head_y - head_height * 0.4)),
        (int(head_x - head_width * 0.4), int(head_y - head_height * 0.8)),
        (int(head_x - head_width * 0.05), int(head_y - head_height * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    ear2_points = [
        (int(head_x + head_width * 0.2), int(head_y - head_height * 0.4)),
        (int(head_x + head_width * 0.4), int(head_y - head_height * 0.8)),
        (int(head_x + head_width * 0.05), int(head_y - head_height * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Mane (along neck)
    for i in range(3):
        mane_y = neck_start_y - (neck_length * i / 3)
        mane_x = body_x + math.sin(neck_angle) * (neck_length * i / 3) * 0.3 + math.cos(arm_swing) * size * 0.05
        pygame.draw.circle(screen, color, (int(mane_x), int(mane_y)), int(size * 0.04))
    
    # Legs (4 long legs)
    leg_length = size * 0.38
    leg_width = size * 0.06
    hip_y = body_y + body_height // 2
    
    for leg_offset in [-body_width * 0.32, -body_width * 0.15, body_width * 0.15, body_width * 0.32]:
        leg_x = body_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.25
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))
    
    # Tail (flowing)
    tail_start_x = body_x + body_width // 2
    tail_start_y = body_y + body_height * 0.1
    tail_mid_x = tail_start_x + math.cos(arm_swing * 0.6) * size * 0.25
    tail_mid_y = tail_start_y + math.sin(arm_swing * 0.6) * size * 0.2
    tail_end_x = tail_mid_x + math.cos(arm_swing * 0.6 + 0.5) * size * 0.2
    tail_end_y = tail_mid_y + math.sin(arm_swing * 0.6 + 0.5) * size * 0.15
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_mid_x), int(tail_mid_y)),
                    max(2, int(size * 0.08)))
    pygame.draw.line(screen, color,
                    (int(tail_mid_x), int(tail_mid_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.08)))

def draw_duck(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a duck character"""
    # Body (oval)
    body_width = size * 0.3
    body_height = size * 0.28
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.18 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Head (circle, attached to front of body)
    head_radius = size * 0.16
    head_x = body_x - body_width * 0.2
    head_y = body_y - body_height * 0.1
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Beak (flat, wide)
    beak_width = size * 0.12
    beak_height = size * 0.06
    beak_x = head_x - head_radius
    beak_y = head_y
    beak_rect = pygame.Rect(
        int(beak_x - beak_width // 2),
        int(beak_y - beak_height // 2),
        int(beak_width),
        int(beak_height)
    )
    pygame.draw.ellipse(screen, color, beak_rect)
    
    # Wings (on sides)
    wing_length = size * 0.22
    wing_angle = arm_swing * 0.8
    # Left wing
    wing1_x = body_x - body_width * 0.15
    wing1_y = body_y
    wing1_end_x = wing1_x + math.cos(wing_angle - math.pi * 0.5) * wing_length
    wing1_end_y = wing1_y + math.sin(wing_angle - math.pi * 0.5) * wing_length
    pygame.draw.line(screen, color,
                    (int(wing1_x), int(wing1_y)),
                    (int(wing1_end_x), int(wing1_end_y)),
                    max(2, int(size * 0.09)))
    # Right wing
    wing2_x = body_x + body_width * 0.15
    wing2_y = body_y
    wing2_end_x = wing2_x + math.cos(-wing_angle - math.pi * 0.5) * wing_length
    wing2_end_y = wing2_y + math.sin(-wing_angle - math.pi * 0.5) * wing_length
    pygame.draw.line(screen, color,
                    (int(wing2_x), int(wing2_y)),
                    (int(wing2_end_x), int(wing2_end_y)),
                    max(2, int(size * 0.09)))
    
    # Legs (2 webbed feet)
    leg_length = size * 0.18
    leg_width = size * 0.04
    leg_y = body_y + body_height // 2
    
    leg1_x = body_x - body_width * 0.15
    leg1_end_y = leg_y + leg_length + math.sin(leg_swing) * leg_length * 0.25
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(leg_y)),
                    (int(leg1_x), int(leg1_end_y)),
                    max(2, int(leg_width)))
    # Webbed foot
    pygame.draw.circle(screen, color, (int(leg1_x), int(leg1_end_y)), int(size * 0.05))
    
    leg2_x = body_x + body_width * 0.15
    leg2_end_y = leg_y + leg_length + math.sin(leg_swing + math.pi) * leg_length * 0.25
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(leg_y)),
                    (int(leg2_x), int(leg2_end_y)),
                    max(2, int(leg_width)))
    # Webbed foot
    pygame.draw.circle(screen, color, (int(leg2_x), int(leg2_end_y)), int(size * 0.05))

def draw_tiger(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a tiger character (similar to cat but with stripes)"""
    # Head (circle)
    head_radius = size * 0.2
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (triangles)
    ear_size = size * 0.15
    # Left ear
    ear1_points = [
        (int(head_x - head_radius * 0.5), int(head_y - head_radius * 0.3)),
        (int(head_x - head_radius * 0.2), int(head_y - head_radius * 1.2)),
        (int(head_x), int(head_y - head_radius * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    # Right ear
    ear2_points = [
        (int(head_x + head_radius * 0.5), int(head_y - head_radius * 0.3)),
        (int(head_x + head_radius * 0.2), int(head_y - head_radius * 1.2)),
        (int(head_x), int(head_y - head_radius * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Body (oval)
    body_width = size * 0.32
    body_height = size * 0.4
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Stripes (vertical lines on body)
    for i in range(3):
        stripe_x = head_x - body_width * 0.3 + (i * body_width * 0.3)
        stripe_start_y = head_y + head_radius
        stripe_end_y = head_y + head_radius + body_height
        pygame.draw.line(screen, color,
                        (int(stripe_x), int(stripe_start_y)),
                        (int(stripe_x), int(stripe_end_y)),
                        max(2, int(size * 0.04)))
    
    # Tail (with stripes)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius + body_height * 0.3
    tail_end_x = tail_start_x + math.cos(arm_swing * 0.5) * size * 0.3
    tail_end_y = tail_start_y + math.sin(arm_swing * 0.5) * size * 0.2
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.08)))
    
    # Legs (4 legs)
    leg_length = size * 0.26
    leg_width = size * 0.06
    hip_y = head_y + head_radius + body_height
    
    for leg_offset in [-body_width * 0.28, -body_width * 0.15, body_width * 0.15, body_width * 0.28]:
        leg_x = head_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.3
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))

def draw_zebra(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a zebra character (horse-like with stripes)"""
    # Body (oval)
    body_width = size * 0.35
    body_height = size * 0.32
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.15 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Stripes (horizontal lines on body)
    for i in range(4):
        stripe_y = body_y - body_height // 2 + (i * body_height / 4)
        pygame.draw.line(screen, color,
                        (int(body_x - body_width // 2), int(stripe_y)),
                        (int(body_x + body_width // 2), int(stripe_y)),
                        max(2, int(size * 0.05)))
    
    # Neck (long, curved)
    neck_length = size * 0.4
    neck_start_y = body_y - body_height // 2
    neck_angle = lean * 0.3
    neck_end_y = neck_start_y - neck_length
    neck_end_x = body_x + math.sin(neck_angle) * neck_length * 0.3
    pygame.draw.line(screen, color,
                    (int(body_x), int(neck_start_y)),
                    (int(neck_end_x), int(neck_end_y)),
                    max(3, int(size * 0.08)))
    
    # Head (oval at end of neck)
    head_width = size * 0.18
    head_height = size * 0.15
    head_x = neck_end_x
    head_y = neck_end_y
    head_rect = pygame.Rect(
        int(head_x - head_width // 2),
        int(head_y - head_height // 2),
        int(head_width),
        int(head_height)
    )
    pygame.draw.ellipse(screen, color, head_rect)
    
    # Ears (small triangles)
    ear_size = size * 0.08
    ear1_points = [
        (int(head_x - head_width * 0.2), int(head_y - head_height * 0.4)),
        (int(head_x - head_width * 0.4), int(head_y - head_height * 0.8)),
        (int(head_x - head_width * 0.05), int(head_y - head_height * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    ear2_points = [
        (int(head_x + head_width * 0.2), int(head_y - head_height * 0.4)),
        (int(head_x + head_width * 0.4), int(head_y - head_height * 0.8)),
        (int(head_x + head_width * 0.05), int(head_y - head_height * 0.5))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Legs (4 long legs with stripes)
    leg_length = size * 0.38
    leg_width = size * 0.06
    hip_y = body_y + body_height // 2
    
    for leg_offset in [-body_width * 0.32, -body_width * 0.15, body_width * 0.15, body_width * 0.32]:
        leg_x = body_x + leg_offset
        leg_phase = leg_swing if leg_offset < 0 else leg_swing + math.pi
        leg_y = hip_y + math.sin(leg_phase) * leg_length * 0.25
        pygame.draw.line(screen, color,
                        (int(leg_x), int(hip_y)),
                        (int(leg_x), int(leg_y)),
                        max(2, int(leg_width)))
        # Stripes on legs
        for stripe_i in range(2):
            stripe_y = hip_y + (leg_y - hip_y) * (stripe_i + 1) / 3
            pygame.draw.line(screen, color,
                            (int(leg_x - leg_width), int(stripe_y)),
                            (int(leg_x + leg_width), int(stripe_y)),
                            max(1, int(size * 0.03)))
    
    # Tail (with stripes)
    tail_start_x = body_x + body_width // 2
    tail_start_y = body_y + body_height * 0.1
    tail_mid_x = tail_start_x + math.cos(arm_swing * 0.6) * size * 0.25
    tail_mid_y = tail_start_y + math.sin(arm_swing * 0.6) * size * 0.2
    tail_end_x = tail_mid_x + math.cos(arm_swing * 0.6 + 0.5) * size * 0.2
    tail_end_y = tail_mid_y + math.sin(arm_swing * 0.6 + 0.5) * size * 0.15
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_mid_x), int(tail_mid_y)),
                    max(2, int(size * 0.08)))
    pygame.draw.line(screen, color,
                    (int(tail_mid_x), int(tail_mid_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.08)))

def draw_panda(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a panda character (bear-like with distinctive features)"""
    # Head (circle)
    head_radius = size * 0.22
    head_y = y - size * 0.3 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (small circles)
    ear_radius = size * 0.08
    pygame.draw.circle(screen, color, 
                      (int(head_x - head_radius * 0.6), int(head_y - head_radius * 0.5)),
                      int(ear_radius))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.6), int(head_y - head_radius * 0.5)),
                      int(ear_radius))
    
    # Body (large oval)
    body_width = size * 0.4
    body_height = size * 0.45
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Arms (thick, rounded)
    arm_length = size * 0.3
    arm_width = size * 0.08
    shoulder_y = head_y + head_radius + body_height * 0.2
    
    # Left arm
    left_arm_x = head_x - body_width // 2
    left_arm_end_x = left_arm_x + math.cos(arm_swing - math.pi * 0.5) * arm_length
    left_arm_end_y = shoulder_y + math.sin(arm_swing - math.pi * 0.5) * arm_length
    pygame.draw.line(screen, color,
                    (int(left_arm_x), int(shoulder_y)),
                    (int(left_arm_end_x), int(left_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Right arm
    right_arm_x = head_x + body_width // 2
    right_arm_end_x = right_arm_x + math.cos(-arm_swing - math.pi * 0.5) * arm_length
    right_arm_end_y = shoulder_y + math.sin(-arm_swing - math.pi * 0.5) * arm_length
    pygame.draw.line(screen, color,
                    (int(right_arm_x), int(shoulder_y)),
                    (int(right_arm_end_x), int(right_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Legs (thick, short)
    leg_length = size * 0.28
    leg_width = size * 0.08
    hip_y = head_y + head_radius + body_height
    
    leg1_x = head_x - body_width * 0.25
    leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(hip_y)),
                    (int(leg1_x), int(leg1_y)),
                    max(2, int(leg_width)))
    
    leg2_x = head_x + body_width * 0.25
    leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(hip_y)),
                    (int(leg2_x), int(leg2_y)),
                    max(2, int(leg_width)))

def draw_kangaroo(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a kangaroo character"""
    # Head (small circle)
    head_radius = size * 0.18
    head_y = y - size * 0.35 - bounce
    head_x = x + lean * size * 0.1
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Ears (long, pointed)
    ear_length = size * 0.25
    ear_width = size * 0.06
    # Left ear
    ear1_points = [
        (int(head_x - head_radius * 0.3), int(head_y - head_radius * 0.5)),
        (int(head_x - head_radius * 0.5), int(head_y - head_radius * 1.5)),
        (int(head_x - head_radius * 0.1), int(head_y - head_radius * 0.7))
    ]
    pygame.draw.polygon(screen, color, ear1_points)
    # Right ear
    ear2_points = [
        (int(head_x + head_radius * 0.3), int(head_y - head_radius * 0.5)),
        (int(head_x + head_radius * 0.5), int(head_y - head_radius * 1.5)),
        (int(head_x + head_radius * 0.1), int(head_y - head_radius * 0.7))
    ]
    pygame.draw.polygon(screen, color, ear2_points)
    
    # Body (oval, more vertical)
    body_width = size * 0.28
    body_height = size * 0.42
    body_rect = pygame.Rect(
        int(head_x - body_width // 2),
        int(head_y + head_radius),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Pouch (small oval on front)
    pouch_width = size * 0.12
    pouch_height = size * 0.15
    pouch_x = head_x - body_width * 0.15
    pouch_y = head_y + head_radius + body_height * 0.3
    pouch_rect = pygame.Rect(
        int(pouch_x - pouch_width // 2),
        int(pouch_y - pouch_height // 2),
        int(pouch_width),
        int(pouch_height)
    )
    pygame.draw.ellipse(screen, color, pouch_rect)
    
    # Arms (small, in front)
    arm_length = size * 0.25
    arm_width = size * 0.06
    shoulder_y = head_y + head_radius + body_height * 0.15
    
    # Left arm
    left_arm_x = head_x - body_width * 0.2
    left_arm_end_x = left_arm_x + math.cos(arm_swing - math.pi * 0.4) * arm_length
    left_arm_end_y = shoulder_y + math.sin(arm_swing - math.pi * 0.4) * arm_length
    pygame.draw.line(screen, color,
                    (int(left_arm_x), int(shoulder_y)),
                    (int(left_arm_end_x), int(left_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Right arm
    right_arm_x = head_x - body_width * 0.1
    right_arm_end_x = right_arm_x + math.cos(-arm_swing - math.pi * 0.4) * arm_length
    right_arm_end_y = shoulder_y + math.sin(-arm_swing - math.pi * 0.4) * arm_length
    pygame.draw.line(screen, color,
                    (int(right_arm_x), int(shoulder_y)),
                    (int(right_arm_end_x), int(right_arm_end_y)),
                    max(2, int(arm_width)))
    
    # Legs (2 large, powerful legs)
    leg_length = size * 0.35
    leg_width = size * 0.1
    hip_y = head_y + head_radius + body_height
    
    leg1_x = head_x - body_width * 0.15
    leg1_y = hip_y + math.sin(leg_swing) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(hip_y)),
                    (int(leg1_x), int(leg1_y)),
                    max(2, int(leg_width)))
    
    leg2_x = head_x + body_width * 0.15
    leg2_y = hip_y + math.sin(leg_swing + math.pi) * leg_length * 0.3
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(hip_y)),
                    (int(leg2_x), int(leg2_y)),
                    max(2, int(leg_width)))
    
    # Tail (long, thick, used for balance)
    tail_start_x = head_x + body_width // 2
    tail_start_y = head_y + head_radius + body_height * 0.4
    tail_mid_x = tail_start_x + math.cos(arm_swing * 0.5) * size * 0.35
    tail_mid_y = tail_start_y + math.sin(arm_swing * 0.5) * size * 0.25
    tail_end_x = tail_mid_x + math.cos(arm_swing * 0.5 + 0.3) * size * 0.3
    tail_end_y = tail_mid_y + math.sin(arm_swing * 0.5 + 0.3) * size * 0.2
    pygame.draw.line(screen, color,
                    (int(tail_start_x), int(tail_start_y)),
                    (int(tail_mid_x), int(tail_mid_y)),
                    max(3, int(size * 0.1)))
    pygame.draw.line(screen, color,
                    (int(tail_mid_x), int(tail_mid_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(3, int(size * 0.1)))

def draw_owl(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw an owl character"""
    # Body (round)
    body_width = size * 0.32
    body_height = size * 0.35
    body_x = x + lean * size * 0.1
    body_y = y - size * 0.2 - bounce
    
    body_rect = pygame.Rect(
        int(body_x - body_width // 2),
        int(body_y - body_height // 2),
        int(body_width),
        int(body_height)
    )
    pygame.draw.ellipse(screen, color, body_rect)
    
    # Head (large circle, merged with body)
    head_radius = size * 0.2
    head_x = body_x
    head_y = body_y - body_height * 0.2
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Large eyes (circles)
    eye_radius = size * 0.08
    pygame.draw.circle(screen, color,
                      (int(head_x - head_radius * 0.3), int(head_y)),
                      int(eye_radius))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.3), int(head_y)),
                      int(eye_radius))
    
    # Beak (small triangle)
    beak_size = size * 0.06
    beak_points = [
        (int(head_x), int(head_y + head_radius * 0.3)),
        (int(head_x - beak_size * 0.5), int(head_y + head_radius * 0.6)),
        (int(head_x + beak_size * 0.5), int(head_y + head_radius * 0.6))
    ]
    pygame.draw.polygon(screen, color, beak_points)
    
    # Wings (large, rounded)
    wing_span = size * 0.4
    wing_angle = arm_swing * 0.7
    # Left wing
    wing1_start_x = body_x - body_width * 0.15
    wing1_start_y = body_y
    wing1_end_x = wing1_start_x + math.cos(wing_angle - math.pi * 0.5) * wing_span
    wing1_end_y = wing1_start_y + math.sin(wing_angle - math.pi * 0.5) * wing_span
    pygame.draw.line(screen, color,
                    (int(wing1_start_x), int(wing1_start_y)),
                    (int(wing1_end_x), int(wing1_end_y)),
                    max(3, int(size * 0.12)))
    # Right wing
    wing2_start_x = body_x + body_width * 0.15
    wing2_start_y = body_y
    wing2_end_x = wing2_start_x + math.cos(-wing_angle - math.pi * 0.5) * wing_span
    wing2_end_y = wing2_start_y + math.sin(-wing_angle - math.pi * 0.5) * wing_span
    pygame.draw.line(screen, color,
                    (int(wing2_start_x), int(wing2_start_y)),
                    (int(wing2_end_x), int(wing2_end_y)),
                    max(3, int(size * 0.12)))
    
    # Legs (2 short legs with talons)
    leg_length = size * 0.18
    leg_width = size * 0.05
    leg_y = body_y + body_height // 2
    
    leg1_x = body_x - body_width * 0.15
    leg1_end_y = leg_y + leg_length + math.sin(leg_swing) * leg_length * 0.2
    pygame.draw.line(screen, color,
                    (int(leg1_x), int(leg_y)),
                    (int(leg1_x), int(leg1_end_y)),
                    max(2, int(leg_width)))
    # Talons
    for talon_offset in [-size * 0.04, 0, size * 0.04]:
        pygame.draw.line(screen, color,
                        (int(leg1_x), int(leg1_end_y)),
                        (int(leg1_x + talon_offset), int(leg1_end_y + size * 0.05)),
                        max(1, int(size * 0.03)))
    
    leg2_x = body_x + body_width * 0.15
    leg2_end_y = leg_y + leg_length + math.sin(leg_swing + math.pi) * leg_length * 0.2
    pygame.draw.line(screen, color,
                    (int(leg2_x), int(leg_y)),
                    (int(leg2_x), int(leg2_end_y)),
                    max(2, int(leg_width)))
    # Talons
    for talon_offset in [-size * 0.04, 0, size * 0.04]:
        pygame.draw.line(screen, color,
                        (int(leg2_x), int(leg2_end_y)),
                        (int(leg2_x + talon_offset), int(leg2_end_y + size * 0.05)),
                        max(1, int(size * 0.03)))

def draw_turtle(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a turtle character"""
    # Shell (large oval, main body)
    shell_width = size * 0.4
    shell_height = size * 0.32
    shell_x = x + lean * size * 0.1
    shell_y = y - size * 0.15 - bounce
    
    shell_rect = pygame.Rect(
        int(shell_x - shell_width // 2),
        int(shell_y - shell_height // 2),
        int(shell_width),
        int(shell_height)
    )
    pygame.draw.ellipse(screen, color, shell_rect)
    
    # Shell pattern (hexagonal pattern suggestion)
    for i in range(3):
        for j in range(2):
            pattern_x = shell_x - shell_width * 0.25 + (i * shell_width * 0.25)
            pattern_y = shell_y - shell_height * 0.15 + (j * shell_height * 0.3)
            pygame.draw.circle(screen, color, (int(pattern_x), int(pattern_y)), int(size * 0.04))
    
    # Head (small, extends from shell)
    head_radius = size * 0.12
    head_x = shell_x - shell_width * 0.3
    head_y = shell_y
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Legs (4 small legs)
    leg_length = size * 0.15
    leg_width = size * 0.06
    shell_bottom = shell_y + shell_height // 2
    
    leg_phases = [leg_swing, leg_swing + math.pi, leg_swing + math.pi * 0.5, leg_swing + math.pi * 1.5]
    leg_positions = [(-shell_width * 0.35, -shell_height * 0.2), 
                    (-shell_width * 0.35, shell_height * 0.2),
                    (shell_width * 0.35, -shell_height * 0.2),
                    (shell_width * 0.35, shell_height * 0.2)]
    
    for idx, leg_pos in enumerate(leg_positions):
        leg_x = shell_x + leg_pos[0]
        leg_y = shell_y + leg_pos[1]
        leg_phase = leg_phases[idx] if idx < len(leg_phases) else leg_swing
        leg_end_y = leg_y + leg_length + math.sin(leg_phase) * leg_length * 0.2
        pygame.draw.line(screen, color,
                        (int(leg_x), int(leg_y)),
                        (int(leg_x), int(leg_end_y)),
                        max(2, int(leg_width)))
    
    # Tail (small)
    tail_x = shell_x + shell_width // 2
    tail_y = shell_y + shell_height * 0.15
    tail_end_x = tail_x + math.cos(arm_swing) * size * 0.1
    tail_end_y = tail_y + math.sin(arm_swing) * size * 0.08
    pygame.draw.line(screen, color,
                    (int(tail_x), int(tail_y)),
                    (int(tail_end_x), int(tail_end_y)),
                    max(2, int(size * 0.05)))

def draw_snake(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw a snake character"""
    # Body (long, curved segments)
    body_segments = 5
    segment_length = size * 0.15
    body_start_x = x - size * 0.3 + lean * size * 0.1
    body_start_y = y - bounce
    
    # Draw curved body (start from tail, work toward head)
    for i in range(body_segments):
        if body_segments > 0:  # Safety check
            # Calculate position along curve
            progress = i / max(1, body_segments - 1) if body_segments > 1 else 0
            segment_angle = progress * math.pi * 0.4 + arm_swing * 0.5
            segment_x = body_start_x + math.cos(segment_angle) * segment_length * i
            segment_y = body_start_y + math.sin(segment_angle) * segment_length * i
            # Taper radius from base to tip
            segment_radius = max(2, size * 0.12 * (1.0 - progress * 0.3))
            pygame.draw.circle(screen, color, (int(segment_x), int(segment_y)), int(segment_radius))
    
    # Head (larger circle at front - last segment position)
    head_radius = size * 0.15
    if body_segments > 1:
        head_angle = (body_segments - 1) / max(1, body_segments - 1) * math.pi * 0.4 + arm_swing * 0.5
        head_x = body_start_x + math.cos(head_angle) * segment_length * (body_segments - 1)
        head_y = body_start_y + math.sin(head_angle) * segment_length * (body_segments - 1)
    else:
        head_x = body_start_x
        head_y = body_start_y
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Eyes (small dots)
    eye_size = size * 0.03
    pygame.draw.circle(screen, color,
                      (int(head_x - head_radius * 0.3), int(head_y - head_radius * 0.2)),
                      int(eye_size))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.3), int(head_y - head_radius * 0.2)),
                      int(eye_size))
    
    # Tongue (forked, flickering)
    tongue_length = size * 0.1
    tongue_angle = math.sin(arm_swing * 2.0) * 0.3
    tongue_base_x = head_x + head_radius * 0.7
    tongue_base_y = head_y
    tongue1_end_x = tongue_base_x + math.cos(tongue_angle) * tongue_length
    tongue1_end_y = tongue_base_y + math.sin(tongue_angle) * tongue_length
    tongue2_end_x = tongue_base_x + math.cos(-tongue_angle) * tongue_length
    tongue2_end_y = tongue_base_y + math.sin(-tongue_angle) * tongue_length
    pygame.draw.line(screen, color,
                    (int(tongue_base_x), int(tongue_base_y)),
                    (int(tongue1_end_x), int(tongue1_end_y)),
                    max(1, int(size * 0.03)))
    pygame.draw.line(screen, color,
                    (int(tongue_base_x), int(tongue_base_y)),
                    (int(tongue2_end_x), int(tongue2_end_y)),
                    max(1, int(size * 0.03)))

def draw_octopus(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw an octopus character"""
    # Body (round head)
    head_radius = size * 0.22
    head_x = x + lean * size * 0.1
    head_y = y - size * 0.2 - bounce
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Eyes (large)
    eye_radius = size * 0.08
    pygame.draw.circle(screen, color,
                      (int(head_x - head_radius * 0.3), int(head_y - head_radius * 0.2)),
                      int(eye_radius))
    pygame.draw.circle(screen, color,
                      (int(head_x + head_radius * 0.3), int(head_y - head_radius * 0.2)),
                      int(eye_radius))
    
    # Tentacles (8 tentacles, waving)
    tentacle_count = 8
    tentacle_length = size * 0.35
    tentacle_width = size * 0.05
    tentacle_base_y = head_y + head_radius * 0.7
    
    for i in range(tentacle_count):
        angle = (i / tentacle_count) * math.pi * 2.0
        base_x = head_x + math.cos(angle) * head_radius * 0.8
        base_y = tentacle_base_y + math.sin(angle) * head_radius * 0.3
        
        # Waving motion
        wave_angle = angle + arm_swing * 0.8 + math.sin(leg_swing + i) * 0.2
        end_x = base_x + math.cos(wave_angle) * tentacle_length
        end_y = base_y + math.sin(wave_angle) * tentacle_length
        
        pygame.draw.line(screen, color,
                        (int(base_x), int(base_y)),
                        (int(end_x), int(end_y)),
                        max(2, int(tentacle_width)))

def draw_animal(screen, color, animal_type, x, y, size, bounce, lean, arm_swing, leg_swing):
    """Draw an animal based on type"""
    # Safety checks to prevent invalid rendering
    if size <= 0 or not math.isfinite(size):
        return  # Skip drawing if size is invalid
    if not math.isfinite(x) or not math.isfinite(y):
        return  # Skip drawing if coordinates are invalid
    if not math.isfinite(bounce) or not math.isfinite(lean):
        bounce = 0.0
        lean = 0.0
    if not math.isfinite(arm_swing) or not math.isfinite(leg_swing):
        arm_swing = 0.0
        leg_swing = 0.0
    
    # Clamp size to reasonable range
    size = max(5, min(size, 500))  # Between 5 and 500 pixels
    
    if animal_type == 'cat':
        draw_cat(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'dog':
        draw_dog(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'bird':
        draw_bird(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'rabbit':
        draw_rabbit(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'bear':
        draw_bear(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'fox':
        draw_fox(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'elephant':
        draw_elephant(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'giraffe':
        draw_giraffe(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'penguin':
        draw_penguin(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'monkey':
        draw_monkey(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'lion':
        draw_lion(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'pig':
        draw_pig(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'horse':
        draw_horse(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'duck':
        draw_duck(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'tiger':
        draw_tiger(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'zebra':
        draw_zebra(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'panda':
        draw_panda(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'kangaroo':
        draw_kangaroo(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'owl':
        draw_owl(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'turtle':
        draw_turtle(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'snake':
        draw_snake(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)
    elif animal_type == 'octopus':
        draw_octopus(screen, color, x, y, size, bounce, lean, arm_swing, leg_swing)

def get_dance_move_params(move_type, local_time, intensity, size, audio_amplitude):
    """Get dance movement parameters for different move types
    
    Move types:
    0 = Bounce (up and down)
    1 = Sway (side to side)
    2 = Jump (bigger bounces)
    3 = Spin (rotating)
    4 = Wiggle (quick movements)
    5 = Stomp (rhythmic up/down)
    """
    # Intensity now directly controls movement amplitude (0.3x to 1.5x)
    # This makes Knob 2 always visible, not just with audio
    intensity_multiplier = 0.3 + intensity * 1.2  # Range: 0.3 to 1.5
    audio_boost = 1.0 + audio_amplitude * 0.3  # Audio adds extra boost
    
    if move_type == 0:  # Bounce
        bounce = math.sin(local_time * 2.0) * size * 0.1 * intensity_multiplier * audio_boost
        lean = math.sin(local_time * 0.5) * intensity * 0.3 * intensity_multiplier
        arm_swing = math.sin(local_time * 1.5) * intensity_multiplier
        leg_swing = math.sin(local_time * 1.5) * intensity_multiplier
        
    elif move_type == 1:  # Sway
        bounce = math.sin(local_time * 1.5) * size * 0.06 * intensity_multiplier * audio_boost
        lean = math.sin(local_time * 1.0) * intensity * 0.5 * intensity_multiplier
        arm_swing = math.sin(local_time * 1.2) * intensity_multiplier
        leg_swing = math.sin(local_time * 1.2) * intensity_multiplier
        
    elif move_type == 2:  # Jump
        bounce = math.sin(local_time * 2.5) * size * 0.15 * intensity_multiplier * audio_boost
        lean = math.sin(local_time * 0.8) * intensity * 0.2 * intensity_multiplier
        arm_swing = math.sin(local_time * 2.0) * intensity_multiplier
        leg_swing = math.sin(local_time * 2.0) * intensity_multiplier
        
    elif move_type == 3:  # Spin
        bounce = math.sin(local_time * 2.0) * size * 0.08 * intensity_multiplier * audio_boost
        lean = math.sin(local_time * 1.5) * intensity * 0.6 * intensity_multiplier
        arm_swing = math.sin(local_time * 1.8) * intensity_multiplier
        leg_swing = math.sin(local_time * 1.8) * intensity_multiplier
        
    elif move_type == 4:  # Wiggle
        bounce = math.sin(local_time * 3.0) * size * 0.08 * intensity_multiplier * audio_boost
        lean = math.sin(local_time * 2.0) * intensity * 0.4 * intensity_multiplier
        arm_swing = math.sin(local_time * 2.5) * intensity_multiplier
        leg_swing = math.sin(local_time * 2.5) * intensity_multiplier
        
    else:  # move_type == 5: Stomp
        bounce = math.sin(local_time * 1.8) * size * 0.12 * intensity_multiplier * audio_boost
        lean = math.sin(local_time * 0.6) * intensity * 0.25 * intensity_multiplier
        arm_swing = math.sin(local_time * 1.6) * intensity_multiplier
        leg_swing = math.sin(local_time * 1.6) * intensity_multiplier
    
    return bounce, lean, arm_swing, leg_swing

def draw(screen, eyesy):
    """Draw dancing animals in a circle"""
    global dance_time
    
    # Set background
    eyesy.color_picker_bg(eyesy.knob5)
    
    # Get animal color
    color = eyesy.color_picker(eyesy.knob4)
    
    # Screen dimensions
    xr = eyesy.xres
    yr = eyesy.yres
    center_x = xr // 2
    center_y = yr // 2
    
    # Calculate audio amplitude for reactivity
    audio_amplitude = 0.0
    if len(eyesy.audio_in) > 0:
        total = 0.0
        for i in range(len(eyesy.audio_in)):
            total += abs(eyesy.audio_in[i])
        audio_amplitude = (total / len(eyesy.audio_in)) / 32768.0  # Normalize to 0-1
    
    # Number of animals (Knob3) - 1 to 25
    num_animals = int(1 + eyesy.knob3 * 24.99)
    num_animals = max(1, min(25, num_animals))
    
    # Animal size (Knob1)
    base_size = min(xr, yr) * 0.25  # Increased from 0.18 to 0.25 for better visibility
    size_multiplier = 0.8 + eyesy.knob1 * 2.2  # 0.8x to 3.0x (increased from 0.7x-2.0x)
    # Scale down more aggressively when there are many animals to prevent overlap
    # More aggressive scaling for larger groups to ensure better separation
    # Progressive scaling: more aggressive for larger groups
    if num_animals <= 6:
        crowd_factor = 1.0 / (1.0 + (num_animals - 1) * 0.15)
    elif num_animals <= 12:
        crowd_factor = 1.0 / (1.0 + (num_animals - 1) * 0.22)
    else:
        crowd_factor = 1.0 / (1.0 + (num_animals - 1) * 0.28)  # Very aggressive for large groups
    animal_size = base_size * size_multiplier * crowd_factor
    animal_size = max(20, animal_size)  # Increased minimum from 15 to 20 for better visibility
    
    # Dance intensity (Knob2) - controls overall movement amplitude and speed
    intensity = eyesy.knob2
    
    # Base dance speed - now also affected by intensity
    base_speed = 0.08
    # Intensity affects speed: 0.2x at min (very slow), 1.5x at max (fast)
    # Lower minimum for slower movement when knob is at 0
    speed_multiplier = 0.2 + intensity * 1.3
    speed = base_speed * speed_multiplier * (1.0 + audio_amplitude * 0.3)
    
    # Update dance time
    dance_time += speed
    
    # Generate random positions for animals with spacing
    # Cache positions and only regenerate when number of animals changes
    global cached_positions, cached_num_animals
    
    if len(cached_positions) != num_animals or cached_num_animals != num_animals:
        # Regenerate positions when count changes
        positions = []
        
        # Minimum spacing between animals (based on animal size)
        # Spacing scales with number of animals - more animals need more space to prevent clustering
        # Account for maximum possible movement: base size + max bounce + max lean + max intensity movement
        # Max bounce with intensity: size * 0.15 * 1.5 (intensity max) * 1.3 (audio) = size * 0.29
        # Max lean with intensity: intensity * 0.6 * size * 0.1 = size * 0.06 (at max intensity)
        # Max audio sway: size * 0.15 (reduced)
        # Animal radius: ~size * 0.5
        # Total per animal: size * 0.5 + size * 0.29 + size * 0.06 + size * 0.15 = size * 1.0
        # For two animals: need 2 * size * 1.0 = size * 2.0 minimum
        # Using 16.0x base with more aggressive scaling for very large safety margin
        base_spacing_multiplier = 16.0  # Increased from 13.0 for better separation
        # Scale spacing up when there are more animals (prevents clustering)
        # More aggressive scaling for larger groups
        if num_animals <= 6:
            spacing_scale = 1.0 + (num_animals - 1) * 0.2  # 20% for small groups
        elif num_animals <= 12:
            spacing_scale = 1.0 + (num_animals - 1) * 0.3  # 30% for medium groups
        else:
            spacing_scale = 1.0 + (num_animals - 1) * 0.4  # 40% for large groups
        min_spacing = animal_size * base_spacing_multiplier * spacing_scale
        
        # Screen margins to keep animals away from edges
        # Increased margins to account for dance movements (bounce, lean, audio sway)
        # Larger margins for more animals to prevent edge clustering
        # But ensure margins don't exceed screen size
        margin_multiplier = 2.5 if num_animals <= 6 else 3.0
        margin_x = min(animal_size * margin_multiplier, xr * 0.3)  # Cap at 30% of screen width
        margin_y = min(animal_size * margin_multiplier, yr * 0.3)  # Cap at 30% of screen height
        
        # Available area for positioning
        # Ensure valid bounds (min < max)
        min_x = max(0, int(margin_x))
        max_x = max(min_x + 50, int(xr - margin_x))  # Ensure at least 50px width
        min_y = max(0, int(margin_y))
        max_y = max(min_y + 50, int(yr - margin_y))  # Ensure at least 50px height
        
        # Final safety check - if bounds are still invalid, use screen center
        if min_x >= max_x:
            min_x = max(0, xr // 4)
            max_x = min(xr, xr * 3 // 4)
        if min_y >= max_y:
            min_y = max(0, yr // 4)
            max_y = min(yr, yr * 3 // 4)
        
        if num_animals == 1:
            # Single animal at center
            positions = [(center_x, center_y)]
        else:
            # Use deterministic seed based on number of animals for consistent positions
            random.seed(num_animals * 42)  # Seed ensures consistency
            
            # Try grid-based initial distribution for better spacing, then refine
            # Calculate grid dimensions - use more columns/rows for better distribution
            # For many animals, use a more spread out grid
            if num_animals <= 4:
                grid_cols = int(math.ceil(math.sqrt(num_animals * 1.2)))
            elif num_animals <= 8:
                grid_cols = int(math.ceil(math.sqrt(num_animals * 1.5)))
            else:
                # For many animals, use wider grid to prevent vertical stacking
                grid_cols = int(math.ceil(math.sqrt(num_animals * 2.0)))
            grid_rows = int(math.ceil(num_animals / grid_cols))
            
            # Grid cell size should be at least min_spacing with extra margin
            # Use larger cells to ensure better separation, especially for many animals
            if num_animals <= 6:
                cell_margin = 1.6
            elif num_animals <= 12:
                cell_margin = 2.0
            else:
                cell_margin = 2.4  # Very large margin for many animals
            cell_width = max(min_spacing * cell_margin, (max_x - min_x) / max(1, grid_cols - 1))
            cell_height = max(min_spacing * cell_margin, (max_y - min_y) / max(1, grid_rows - 1))
            
            # Generate positions using improved algorithm
            max_attempts = 2000  # Increased attempts for better placement
            grid_positions = []
            
            # First, try placing animals in a loose grid pattern
            for row in range(grid_rows):
                for col in range(grid_cols):
                    if len(grid_positions) >= num_animals:
                        break
                    base_x = min_x + col * cell_width
                    base_y = min_y + row * cell_height
                    # Add very small random offset within cell to keep animals separated
                    # Further reduced offset range to prevent clustering, especially with many animals
                    if num_animals <= 6:
                        offset_range = 0.06
                    elif num_animals <= 12:
                        offset_range = 0.03
                    else:
                        offset_range = 0.01  # Minimal offset for many animals
                    offset_x = random.uniform(-cell_width * offset_range, cell_width * offset_range)
                    offset_y = random.uniform(-cell_height * offset_range, cell_height * offset_range)
                    pos_x = int(base_x + offset_x)
                    pos_y = int(base_y + offset_y)
                    # Clamp to bounds
                    pos_x = max(min_x, min(max_x, pos_x))
                    pos_y = max(min_y, min(max_y, pos_y))
                    grid_positions.append((pos_x, pos_y))
                if len(grid_positions) >= num_animals:
                    break
            
            # Now refine positions to ensure proper spacing
            positions = []
            for i, (pos_x, pos_y) in enumerate(grid_positions):
                attempts = 0
                found_position = False
                current_x, current_y = pos_x, pos_y
                
                while not found_position and attempts < max_attempts:
                    # Check if current position overlaps - use stricter check
                    overlaps = False
                    min_distance_found = float('inf')
                    for existing_x, existing_y in positions:
                        distance = math.sqrt((current_x - existing_x)**2 + (current_y - existing_y)**2)
                        if distance < min_spacing:
                            overlaps = True
                            min_distance_found = min(min_distance_found, distance)
                            break
                    
                    if not overlaps:
                        positions.append((current_x, current_y))
                        found_position = True
                    else:
                        # Try a new random position - push away from closest animal
                        # Use smaller search radius for many animals to prevent clustering
                        if num_animals <= 6:
                            search_radius = 0.15
                        elif num_animals <= 12:
                            search_radius = 0.08
                        else:
                            search_radius = 0.05  # Very small search radius for many animals
                        # If we found a too-close animal, try to move away from it
                        if min_distance_found < float('inf'):
                            # Move further away from the closest animal
                            push_away_factor = (min_spacing - min_distance_found) / min_spacing
                            current_x = pos_x + random.uniform(-cell_width * search_radius, cell_width * search_radius) * (1 + push_away_factor)
                            current_y = pos_y + random.uniform(-cell_height * search_radius, cell_height * search_radius) * (1 + push_away_factor)
                        else:
                            current_x = pos_x + random.uniform(-cell_width * search_radius, cell_width * search_radius)
                            current_y = pos_y + random.uniform(-cell_height * search_radius, cell_height * search_radius)
                        current_x = max(min_x, min(max_x, int(current_x)))
                        current_y = max(min_y, min(max_y, int(current_y)))
                        attempts += 1
                
                # If we couldn't find a position after max attempts, try completely random
                # Use more attempts and stricter spacing check
                if not found_position:
                    # Ensure valid bounds before using random.randint
                    if min_x < max_x and min_y < max_y:
                        fallback_attempts = 1000 if num_animals <= 6 else 1500  # More attempts for many animals
                        for fallback_attempt in range(fallback_attempts):
                            fallback_x = random.randint(min_x, max_x)
                            fallback_y = random.randint(min_y, max_y)
                            overlaps = False
                            # Check against all existing positions with strict spacing
                            for existing_x, existing_y in positions:
                                distance = math.sqrt((fallback_x - existing_x)**2 + (fallback_y - existing_y)**2)
                                if distance < min_spacing:
                                    overlaps = True
                                    break
                            if not overlaps:
                                positions.append((fallback_x, fallback_y))
                                found_position = True
                                break
                    else:
                        # If bounds are invalid, just place at center with offset
                        offset_x = (i % 3 - 1) * animal_size * 2
                        offset_y = (i // 3 - 1) * animal_size * 2
                        positions.append((center_x + offset_x, center_y + offset_y))
                        found_position = True
                
                # Last resort: place it anyway (shouldn't happen with proper spacing)
                if not found_position:
                    positions.append((current_x, current_y))
        
        # Cache the positions
        cached_positions = positions
        cached_num_animals = num_animals
    else:
        # Use cached positions
        positions = cached_positions
    
    # Calculate minimum safe distance for runtime checking
    # Use a slightly smaller value than min_spacing since positions are already spaced
    runtime_min_distance = animal_size * 12.0  # Runtime check distance
    
    # Draw each animal at its random position
    final_positions = []  # Track final positions for collision checking
    for i in range(num_animals):
        animal_x, animal_y = positions[i]
        
        # Add minimal audio-reactive movement (very small to prevent drift toward partners)
        # Greatly reduced audio sway to prevent animals from drifting together or partnering up
        # Each animal uses a unique phase offset to ensure independent movement
        # Reduce movement even more when there are many animals
        unique_phase = i * math.pi * 2.0 / max(1, num_animals)  # Unique phase per animal
        # Scale down movement for larger groups - even more aggressive reduction
        if num_animals <= 6:
            movement_scale = 0.06
        elif num_animals <= 12:
            movement_scale = 0.03
        else:
            movement_scale = 0.02  # Very minimal movement for many animals
        audio_sway_x = math.sin(dance_time * 0.3 + unique_phase) * audio_amplitude * intensity * animal_size * movement_scale
        audio_sway_y = math.cos(dance_time * 0.3 + unique_phase) * audio_amplitude * intensity * animal_size * movement_scale
        
        # Apply movement
        new_x = animal_x + audio_sway_x
        new_y = animal_y + audio_sway_y
        
        # Check if movement would bring this animal too close to others
        # Constrain movement to maintain safe distance
        for j, (other_x, other_y) in enumerate(final_positions):
            distance = math.sqrt((new_x - other_x)**2 + (new_y - other_y)**2)
            if distance < runtime_min_distance and distance > 0:
                # Push away from the other animal
                dx = new_x - other_x
                dy = new_y - other_y
                dist = math.sqrt(dx*dx + dy*dy)
                if dist > 0.001:  # Avoid division by zero
                    # Scale back movement to maintain distance
                    push_factor = (runtime_min_distance - dist) / dist
                    new_x = other_x + dx * (1 + push_factor * 0.3)
                    new_y = other_y + dy * (1 + push_factor * 0.3)
        
        animal_x = new_x
        animal_y = new_y
        final_positions.append((animal_x, animal_y))
        
        # Select animal type (cycles through types)
        animal_type = animal_types[i % len(animal_types)]
        
        # Each animal has different dance parameters (staggered phases)
        phase_offset = (i * math.pi * 2.0) / max(1, num_animals)  # Stagger phases
        local_time = dance_time + phase_offset
        
        # Select dance move type (cycles through 6 moves)
        move_type = i % 6
        
        # Get dance movement parameters
        bounce, lean, arm_swing, leg_swing = get_dance_move_params(
            move_type, local_time, intensity, animal_size, audio_amplitude
        )
        
        # Ensure coordinates are within screen bounds
        animal_x = max(0, min(eyesy.xres, animal_x))
        animal_y = max(0, min(eyesy.yres, animal_y))
        
        # Ensure size is valid
        if animal_size > 0 and math.isfinite(animal_size):
            # Draw the animal
            draw_animal(screen, color, animal_type, animal_x, animal_y, 
                       animal_size, bounce, lean, arm_swing, leg_swing)
