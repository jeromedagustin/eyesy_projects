import os
import pygame
import math
import random

"""
Dancing Character Mode

A simple animated character that dances to audio and MIDI input.

Knob Assignments:
- Knob1 - Character size
- Knob2 - Dance intensity (how much audio affects movement)
- Knob3 - Number of characters (1-25, perfect 5x5 grid at max)
- Knob4 - Foreground color (character color)
- Knob5 - Background color
"""

# Global variables for character state
dance_time = 0.0  # Continuous dance timer
last_trigger = False  # Track trigger state
special_move = 0.0  # Special dance move animation (for triggers)
cached_positions = []  # Cached random positions
cached_num_characters = 0  # Track when to regenerate positions

def setup(screen, eyesy):
    """Initialize the mode"""
    global dance_time, last_trigger, special_move, cached_positions, cached_num_characters
    dance_time = 0.0
    last_trigger = False
    special_move = 0.0
    cached_positions = []
    cached_num_characters = 0

def draw_character(screen, color, char_x, char_y, character_size, intensity, 
                   audio_amplitude, audio_beat, audio_low, audio_mid, audio_high,
                   dance_time_local, 
                   phase_offset, speed_multiplier, move_type, 
                   is_couple=False, mirror_couple=False):
    """Draw a single dancing character with unique parameters
    
    move_type: Different dance styles:
    0 = Standard (alternating arms/legs)
    1 = Wave (smooth flowing movements)
    2 = Jump (bouncy, energetic)
    3 = Spin (rotating body movements)
    4 = Squat (up and down movements)
    5 = Kick (leg-focused movements)
    6 = Arm Circles (circular arm movements)
    7 = Side Step (lateral movements)
    8 = Breakdance (spinning low to ground)
    9 = Low Squat (very low to ground)
    10 = One Knee (one knee down pose)
    11 = Floor Spin (lying down spinning)
    12 = Moonwalk (sliding backward motion)
    13 = Robot (stiff, mechanical movements)
    14 = Floss (side-to-side arm swinging)
    15 = Running Man (alternating leg lifts)
    16 = Windmill (continuous spinning)
    17 = Freeze (sharp, popping movements)
    18 = Shuffle (quick side steps)
    19 = C-Walk (complex footwork)
    """
    
    # Each character has different dance parameters
    # phase_offset: shifts the dance timing (makes them out of sync)
    # speed_multiplier: makes some dance faster/slower
    # move_type: determines the dance style
    
    # Character proportions
    head_radius = character_size * 0.15
    body_length = character_size * 0.4
    arm_length = character_size * 0.35
    leg_length = character_size * 0.4
    
    # Apply phase offset and speed multiplier to local dance time
    local_dance_time = dance_time_local * speed_multiplier + phase_offset
    
    # Different dance move types create different movement patterns
    # Enhanced audio reactivity: use different frequency bands for different effects
    audio_boost = 1.0 + audio_amplitude * intensity * 0.5
    # Bass (low) affects body bounce and leg movements more
    bass_boost = 1.0 + audio_low * intensity * 0.8
    # Mid affects arm movements
    mid_boost = 1.0 + audio_mid * intensity * 0.6
    # High affects head and quick movements
    high_boost = 1.0 + audio_high * intensity * 0.4
    
    # Initialize movement variables based on move type
    # Initialize ground_offset for all moves (will be set for floor moves)
    ground_offset = 0.0
    
    if move_type == 0:  # Standard - alternating arms/legs
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 0.7) * intensity * 0.3
        horizontal_sway = math.sin(local_dance_time * 0.5) * intensity * character_size * 0.2
        rhythm_speed = 1.5
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.6
        arm_horizontal_freq = 1.2
        leg_swing_intensity = 0.5
        
    elif move_type == 1:  # Wave - smooth flowing movements
        dance_bounce = math.sin(local_dance_time * 1.5) * character_size * 0.1
        body_lean = math.sin(local_dance_time * 0.5) * intensity * 0.4  # More lean
        horizontal_sway = math.sin(local_dance_time * 0.4) * intensity * character_size * 0.25
        rhythm_speed = 1.0  # Slower, smoother
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.sin(local_dance_time * rhythm_speed + math.pi * 0.3)  # Phase shift
        arm_swing_intensity = 0.8  # More arm movement
        arm_horizontal_freq = 0.8
        leg_swing_intensity = 0.4  # Less leg movement
        
    elif move_type == 2:  # Jump - bouncy, energetic
        dance_bounce = math.sin(local_dance_time * 3.0) * character_size * 0.15  # Bigger bounce
        body_lean = math.sin(local_dance_time * 1.2) * intensity * 0.2
        horizontal_sway = math.sin(local_dance_time * 0.8) * intensity * character_size * 0.15
        rhythm_speed = 2.0  # Faster
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.7
        arm_horizontal_freq = 1.5
        leg_swing_intensity = 0.7  # More leg movement
        
    elif move_type == 3:  # Spin - rotating body movements
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.06
        body_lean = math.sin(local_dance_time * 1.5) * intensity * 0.5  # More rotation
        horizontal_sway = math.cos(local_dance_time * 0.6) * intensity * character_size * 0.3
        rhythm_speed = 1.2
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = -math.sin(local_dance_time * rhythm_speed)  # Opposite
        arm_swing_intensity = 0.9  # Big arm movements
        arm_horizontal_freq = 1.0
        leg_swing_intensity = 0.3
        
    elif move_type == 4:  # Squat - up and down movements
        dance_bounce = math.sin(local_dance_time * 1.8) * character_size * 0.2  # Big vertical movement
        body_lean = math.sin(local_dance_time * 0.4) * intensity * 0.2
        horizontal_sway = math.sin(local_dance_time * 0.3) * intensity * character_size * 0.1
        rhythm_speed = 1.3
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.5
        arm_horizontal_freq = 0.9
        leg_swing_intensity = 0.8  # Big leg movements
        
    elif move_type == 5:  # Kick - leg-focused movements
        dance_bounce = math.sin(local_dance_time * 2.2) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 0.9) * intensity * 0.25
        horizontal_sway = math.sin(local_dance_time * 0.6) * intensity * character_size * 0.18
        rhythm_speed = 1.8
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.4  # Less arm movement
        arm_horizontal_freq = 1.1
        leg_swing_intensity = 1.0  # Maximum leg movement
        
    elif move_type == 6:  # Arm Circles - circular arm movements
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 0.6) * intensity * 0.3
        horizontal_sway = math.sin(local_dance_time * 0.5) * intensity * character_size * 0.2
        rhythm_speed = 1.0
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 1.0  # Maximum arm movement
        arm_horizontal_freq = 0.7  # Slower for circles
        leg_swing_intensity = 0.3  # Minimal leg movement
        
    elif move_type == 7:  # Side Step - lateral movements
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 0.8) * intensity * 0.35
        horizontal_sway = math.sin(local_dance_time * 1.0) * intensity * character_size * 0.35  # Big side movement
        rhythm_speed = 1.4
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.6
        arm_horizontal_freq = 1.3
        leg_swing_intensity = 0.6
        
    elif move_type == 8:  # Breakdance - spinning low to ground
        # Character gets very low, almost on ground
        dance_bounce = math.sin(local_dance_time * 2.5) * character_size * 0.05
        ground_offset = character_size * 0.6  # Push character down toward ground
        body_lean = math.sin(local_dance_time * 2.0) * intensity * 0.6  # Big rotation
        horizontal_sway = math.cos(local_dance_time * 1.5) * intensity * character_size * 0.3
        rhythm_speed = 2.0
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.8
        arm_horizontal_freq = 1.8
        leg_swing_intensity = 0.7
        
    elif move_type == 9:  # Low Squat - very low to ground
        # Character squats very low
        dance_bounce = math.sin(local_dance_time * 1.5) * character_size * 0.03
        ground_offset = character_size * 0.5  # Push character down
        body_lean = math.sin(local_dance_time * 0.6) * intensity * 0.2
        horizontal_sway = math.sin(local_dance_time * 0.4) * intensity * character_size * 0.15
        rhythm_speed = 1.2
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.5
        arm_horizontal_freq = 1.0
        leg_swing_intensity = 0.9  # Big leg movements
        
    elif move_type == 10:  # One Knee - one knee down pose
        # Character kneels on one knee
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.04
        ground_offset = character_size * 0.4  # Push character down
        body_lean = math.sin(local_dance_time * 0.7) * intensity * 0.3
        horizontal_sway = math.sin(local_dance_time * 0.5) * intensity * character_size * 0.2
        rhythm_speed = 1.3
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.7
        arm_horizontal_freq = 1.2
        leg_swing_intensity = 0.6
        
    elif move_type == 11:  # Floor Spin - lying down spinning
        # Character lies down and spins
        dance_bounce = math.sin(local_dance_time * 1.8) * character_size * 0.02
        ground_offset = character_size * 0.7  # Push character way down
        body_lean = math.sin(local_dance_time * 2.5) * intensity * 0.8  # Big rotation
        horizontal_sway = math.cos(local_dance_time * 2.0) * intensity * character_size * 0.25
        rhythm_speed = 1.6
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.9
        arm_horizontal_freq = 2.0
        leg_swing_intensity = 0.4
        
    elif move_type == 12:  # Moonwalk - sliding backward motion
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.05
        body_lean = math.sin(local_dance_time * 0.6) * intensity * 0.2
        horizontal_sway = -math.sin(local_dance_time * 1.5) * intensity * character_size * 0.3  # Backward motion
        rhythm_speed = 1.8
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.5
        arm_horizontal_freq = 1.0
        leg_swing_intensity = 0.7  # Focus on leg movement
        
    elif move_type == 13:  # Robot - stiff, mechanical movements
        dance_bounce = math.sin(local_dance_time * 1.0) * character_size * 0.06  # Slower, stiffer
        body_lean = math.sin(local_dance_time * 0.4) * intensity * 0.15  # Minimal lean
        horizontal_sway = math.sin(local_dance_time * 0.3) * intensity * character_size * 0.1
        rhythm_speed = 0.8  # Slower, more mechanical
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = -math.sin(local_dance_time * rhythm_speed)  # Opposite, robotic
        arm_swing_intensity = 0.4  # Stiff movements
        arm_horizontal_freq = 0.6
        leg_swing_intensity = 0.3  # Minimal leg movement
        
    elif move_type == 14:  # Floss - side-to-side arm swinging
        dance_bounce = math.sin(local_dance_time * 2.5) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 1.2) * intensity * 0.25
        horizontal_sway = math.sin(local_dance_time * 1.5) * intensity * character_size * 0.2
        rhythm_speed = 2.0  # Fast
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = -math.sin(local_dance_time * rhythm_speed)  # Opposite arms
        arm_swing_intensity = 1.0  # Maximum arm movement
        arm_horizontal_freq = 2.0  # Fast horizontal swings
        leg_swing_intensity = 0.2  # Minimal leg movement
        
    elif move_type == 15:  # Running Man - alternating leg lifts
        dance_bounce = math.sin(local_dance_time * 2.2) * character_size * 0.1
        body_lean = math.sin(local_dance_time * 0.8) * intensity * 0.2
        horizontal_sway = math.sin(local_dance_time * 0.6) * intensity * character_size * 0.15
        rhythm_speed = 2.2  # Fast alternating
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.6
        arm_horizontal_freq = 1.4
        leg_swing_intensity = 1.0  # Maximum leg movement (running motion)
        
    elif move_type == 16:  # Windmill - continuous spinning
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 3.0) * intensity * 0.6  # Continuous rotation
        horizontal_sway = math.cos(local_dance_time * 2.5) * intensity * character_size * 0.3
        rhythm_speed = 2.5  # Fast spinning
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.9  # Big arm movements
        arm_horizontal_freq = 2.5
        leg_swing_intensity = 0.5
        
    elif move_type == 17:  # Freeze - sharp, popping movements
        # Sharp, staccato movements with pauses
        freeze_phase = math.floor(local_dance_time * 2.0) % 2  # Alternates between 0 and 1
        dance_bounce = math.sin(local_dance_time * 3.0) * character_size * 0.12 * (1 if freeze_phase == 0 else 0.3)
        body_lean = math.sin(local_dance_time * 1.5) * intensity * 0.4 * (1 if freeze_phase == 0 else 0.2)
        horizontal_sway = math.sin(local_dance_time * 1.0) * intensity * character_size * 0.2
        rhythm_speed = 1.5
        left_side_phase = math.sin(local_dance_time * rhythm_speed) * (1 if freeze_phase == 0 else 0.3)
        right_side_phase = math.cos(local_dance_time * rhythm_speed) * (1 if freeze_phase == 0 else 0.3)
        arm_swing_intensity = 0.7
        arm_horizontal_freq = 1.5
        leg_swing_intensity = 0.6
        
    elif move_type == 18:  # Shuffle - quick side steps
        dance_bounce = math.sin(local_dance_time * 2.5) * character_size * 0.08
        body_lean = math.sin(local_dance_time * 1.0) * intensity * 0.3
        horizontal_sway = math.sin(local_dance_time * 2.0) * intensity * character_size * 0.4  # Big side movement
        rhythm_speed = 2.5  # Very fast
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed)
        arm_swing_intensity = 0.5
        arm_horizontal_freq = 2.0
        leg_swing_intensity = 0.8  # Quick leg movements
        
    else:  # move_type == 19: C-Walk - complex footwork
        dance_bounce = math.sin(local_dance_time * 2.0) * character_size * 0.06
        body_lean = math.sin(local_dance_time * 0.9) * intensity * 0.35
        horizontal_sway = math.cos(local_dance_time * 1.5) * intensity * character_size * 0.25
        rhythm_speed = 1.8
        left_side_phase = math.sin(local_dance_time * rhythm_speed)
        right_side_phase = math.cos(local_dance_time * rhythm_speed + math.pi * 0.3)  # Offset phase
        arm_swing_intensity = 0.4  # Less arm movement
        arm_horizontal_freq = 1.3
        leg_swing_intensity = 0.9  # Complex leg movements
    
    # Add audio-reactive bounce (bass affects bounce more)
    audio_bounce = audio_amplitude * intensity * character_size * 0.15
    bass_bounce = audio_low * intensity * character_size * 0.2  # Extra bounce from bass
    total_bounce = dance_bounce + audio_bounce + bass_bounce
    
    # Add audio-reactive sway (beat affects horizontal movement)
    audio_sway = (audio_beat - 0.5) * intensity * character_size * 0.15
    # Add high-frequency jitter for more dynamic movement
    high_sway = (audio_high - 0.5) * intensity * character_size * 0.1
    
    # Calculate character position
    final_char_x = char_x + horizontal_sway + audio_sway + high_sway
    final_char_y = char_y - total_bounce + ground_offset  # Add ground offset for floor moves
    
    # For couples, mirror movements if needed (swap left/right)
    if is_couple and mirror_couple:
        left_side_phase, right_side_phase = right_side_phase, left_side_phase
    
    # Calculate arm movements (mid frequencies affect arms more)
    left_arm_vertical_swing = left_side_phase * intensity * arm_swing_intensity * audio_boost * mid_boost
    left_arm_horizontal_swing = math.cos(local_dance_time * arm_horizontal_freq) * intensity * 0.5 * mid_boost
    
    right_arm_vertical_swing = right_side_phase * intensity * arm_swing_intensity * audio_boost * mid_boost
    right_arm_horizontal_swing = -math.cos(local_dance_time * arm_horizontal_freq) * intensity * 0.5 * mid_boost
    
    # For couples, mirror arm movements
    if is_couple and mirror_couple:
        left_arm_vertical_swing, right_arm_vertical_swing = right_arm_vertical_swing, left_arm_vertical_swing
        left_arm_horizontal_swing, right_arm_horizontal_swing = -right_arm_horizontal_swing, -left_arm_horizontal_swing
    
    # Special handling for Arm Circles move type
    if move_type == 6:
        # Create circular arm movements
        circle_radius = arm_length * 0.5
        left_arm_circle_angle = local_dance_time * 1.5
        right_arm_circle_angle = local_dance_time * 1.5 + math.pi  # Opposite direction
        if is_couple and mirror_couple:
            # Reverse circle direction for mirrored partner
            left_arm_circle_angle = local_dance_time * 1.5 + math.pi
            right_arm_circle_angle = local_dance_time * 1.5
        left_arm_horizontal_swing = math.cos(left_arm_circle_angle) * circle_radius / arm_length
        left_arm_vertical_swing = math.sin(left_arm_circle_angle) * intensity * 0.8 * audio_boost
        right_arm_horizontal_swing = math.cos(right_arm_circle_angle) * circle_radius / arm_length
        right_arm_vertical_swing = math.sin(right_arm_circle_angle) * intensity * 0.8 * audio_boost
    
    # Special handling for Floss move type (move_type 14)
    elif move_type == 14:
        # Floss: arms swing side to side in opposite directions
        floss_angle = local_dance_time * 2.0
        # Left arm swings right, right arm swings left (crossing motion)
        left_arm_horizontal_swing = math.sin(floss_angle) * 1.2  # Big side-to-side
        left_arm_vertical_swing = math.cos(floss_angle) * intensity * 0.3 * audio_boost  # Small vertical
        right_arm_horizontal_swing = -math.sin(floss_angle) * 1.2  # Opposite direction
        right_arm_vertical_swing = math.cos(floss_angle + math.pi) * intensity * 0.3 * audio_boost
    
    # Draw character
    
    # For floor moves, adjust body orientation to be more horizontal
    if move_type >= 8:  # Floor moves (8-11)
        # Body is more horizontal for floor moves
        body_tilt = math.pi / 2 - 0.3  # Tilt body toward horizontal
        body_angle_adjusted = body_lean + body_tilt
    else:
        body_angle_adjusted = body_lean
    
    # Head (bobs slightly with bounce, reacts to high frequencies)
    head_y = final_char_y - body_length - head_radius
    head_x = final_char_x + body_lean * character_size * 0.2
    # Add high-frequency head bob (high frequencies make head bob more)
    head_high_bob = audio_high * intensity * character_size * 0.1
    
    # For floor moves, head is closer to ground level
    if move_type >= 8:
        head_y = final_char_y - body_length * 0.3 - head_radius - head_high_bob
    else:
        head_y = head_y - head_high_bob
    
    pygame.draw.circle(screen, color, (int(head_x), int(head_y)), int(head_radius))
    
    # Body (leans with dance, more horizontal for floor moves)
    body_start_y = head_y + head_radius
    body_end_y = final_char_y
    body_angle = body_angle_adjusted
    body_end_x = final_char_x + math.sin(body_angle) * body_length * 0.3
    body_end_y_actual = body_end_y - math.cos(body_angle) * body_length * 0.3
    pygame.draw.line(screen, color, 
                    (int(head_x), int(body_start_y)), 
                    (int(body_end_x), int(body_end_y_actual)), 
                    max(2, int(character_size * 0.08)))
    
    # Shoulder position (where arms attach - top third of body)
    shoulder_y_pos = body_start_y + (body_end_y_actual - body_start_y) * 0.25  # Top quarter of body
    shoulder_x = head_x + math.sin(body_angle) * (body_end_y_actual - body_start_y) * 0.25
    shoulder_y = shoulder_y_pos
    
    # Hip position (where legs attach - bottom of body)
    hip_x = body_end_x
    hip_y = body_end_y_actual
    
    # Arms - extend from shoulders horizontally, then angle up/down
    # Left arm (dancing motion - swings left and up/down)
    left_arm_base_x = shoulder_x - arm_length * 0.7  # Base horizontal position (left)
    left_arm_end_x = left_arm_base_x + left_arm_horizontal_swing * arm_length * 0.3
    left_arm_end_y = shoulder_y + left_arm_vertical_swing * arm_length * 0.8
    
    pygame.draw.line(screen, color,
                    (int(shoulder_x), int(shoulder_y)),
                    (int(left_arm_end_x), int(left_arm_end_y)),
                    max(2, int(character_size * 0.06)))
    
    # Right arm (dancing motion - swings right and up/down)
    right_arm_base_x = shoulder_x + arm_length * 0.7  # Base horizontal position (right)
    right_arm_end_x = right_arm_base_x + right_arm_horizontal_swing * arm_length * 0.3
    right_arm_end_y = shoulder_y + right_arm_vertical_swing * arm_length * 0.8
    
    pygame.draw.line(screen, color,
                    (int(shoulder_x), int(shoulder_y)),
                    (int(right_arm_end_x), int(right_arm_end_y)),
                    max(2, int(character_size * 0.06)))
    
    # Legs - stepping dance motion (alternating)
    # Different move types affect leg movements
    # Leg movements react more to bass (low frequencies)
    left_leg_swing = left_side_phase * intensity * leg_swing_intensity * audio_boost * bass_boost
    right_leg_swing = right_side_phase * intensity * leg_swing_intensity * audio_boost * bass_boost
    
    # Adjust leg angles based on move type
    if move_type == 5:  # Kick - bigger leg movements
        left_leg_base_angle = math.pi / 2 + 0.2
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.6
        right_leg_base_angle = math.pi / 2 - 0.2
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.6
    elif move_type == 4:  # Squat - legs spread more
        left_leg_base_angle = math.pi / 2 + 0.25
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.5
        right_leg_base_angle = math.pi / 2 - 0.25
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.5
    elif move_type == 8:  # Breakdance - legs spread out horizontally on ground
        left_leg_base_angle = math.pi * 0.7  # More horizontal, angled left
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.3
        right_leg_base_angle = math.pi * 0.3  # More horizontal, angled right
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.3
    elif move_type == 9:  # Low Squat - legs very spread out
        left_leg_base_angle = math.pi / 2 + 0.35
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.4
        right_leg_base_angle = math.pi / 2 - 0.35
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.4
    elif move_type == 10:  # One Knee - one leg down, one leg up
        # Left leg is the kneeling one (more horizontal)
        left_leg_base_angle = math.pi * 0.75  # More horizontal
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.2
        # Right leg is up (more vertical)
        right_leg_base_angle = math.pi / 2 - 0.1
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.5
    elif move_type == 11:  # Floor Spin - legs spread out horizontally
        left_leg_base_angle = math.pi * 0.65  # Horizontal
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.4
        right_leg_base_angle = math.pi * 0.35  # Horizontal
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.4
    elif move_type == 12:  # Moonwalk - legs slide backward
        left_leg_base_angle = math.pi / 2 + 0.1
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.5
        right_leg_base_angle = math.pi / 2 - 0.1
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.5
    elif move_type == 13:  # Robot - stiff, minimal leg movement
        left_leg_base_angle = math.pi / 2 + 0.1
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.2  # Small movements
        right_leg_base_angle = math.pi / 2 - 0.1
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.2
    elif move_type == 14:  # Floss - minimal leg movement, focus on arms
        left_leg_base_angle = math.pi / 2 + 0.1
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.2
        right_leg_base_angle = math.pi / 2 - 0.1
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.2
    elif move_type == 15:  # Running Man - big leg lifts
        left_leg_base_angle = math.pi / 2 + 0.3
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.7  # Big lifts
        right_leg_base_angle = math.pi / 2 - 0.3
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.7
    elif move_type == 16:  # Windmill - legs spread for spinning
        left_leg_base_angle = math.pi / 2 + 0.2
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.5
        right_leg_base_angle = math.pi / 2 - 0.2
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.5
    elif move_type == 17:  # Freeze - sharp leg movements
        left_leg_base_angle = math.pi / 2 + 0.2
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.5
        right_leg_base_angle = math.pi / 2 - 0.2
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.5
    elif move_type == 18:  # Shuffle - quick side leg movements
        left_leg_base_angle = math.pi / 2 + 0.25
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.6
        right_leg_base_angle = math.pi / 2 - 0.25
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.6
    else:  # move_type == 19: C-Walk - complex footwork
        left_leg_base_angle = math.pi / 2 + 0.2
        left_leg_angle = left_leg_base_angle + left_leg_swing * 0.6
        right_leg_base_angle = math.pi / 2 - 0.2
        right_leg_angle = right_leg_base_angle - right_leg_swing * 0.6
    
    left_leg_end_x = hip_x + math.cos(left_leg_angle) * leg_length
    left_leg_end_y = hip_y + math.sin(left_leg_angle) * leg_length
    pygame.draw.line(screen, color,
                    (int(hip_x), int(hip_y)),
                    (int(left_leg_end_x), int(left_leg_end_y)),
                    max(2, int(character_size * 0.06)))
    
    right_leg_end_x = hip_x + math.cos(right_leg_angle) * leg_length
    right_leg_end_y = hip_y + math.sin(right_leg_angle) * leg_length
    pygame.draw.line(screen, color,
                    (int(hip_x), int(hip_y)),
                    (int(right_leg_end_x), int(right_leg_end_y)),
                    max(2, int(character_size * 0.06)))

def draw(screen, eyesy):
    """Draw multiple dancing characters"""
    global dance_time, last_trigger, special_move
    
    # Set background
    eyesy.color_picker_bg(eyesy.knob5)
    
    # Get character color
    color = eyesy.color_picker(eyesy.knob4)
    
    # Screen dimensions
    xr = eyesy.xres
    yr = eyesy.yres
    
    # Calculate audio amplitude for reactivity
    audio_amplitude = 0.0
    audio_beat = 0.0
    audio_low = 0.0  # Low frequency (bass) component
    audio_mid = 0.0  # Mid frequency component
    audio_high = 0.0  # High frequency component
    
    if len(eyesy.audio_in) > 0:
        # Calculate average amplitude
        total = 0.0
        peak = 0.0
        low_total = 0.0
        mid_total = 0.0
        high_total = 0.0
        
        for i in range(len(eyesy.audio_in)):
            abs_val = abs(eyesy.audio_in[i])
            total += abs_val
            if abs_val > peak:
                peak = abs_val
            
            # Simple frequency separation (rough approximation)
            # Lower indices = lower frequencies (in typical audio processing)
            if i < len(eyesy.audio_in) // 3:
                low_total += abs_val
            elif i < 2 * len(eyesy.audio_in) // 3:
                mid_total += abs_val
            else:
                high_total += abs_val
        
        audio_amplitude = (total / len(eyesy.audio_in)) / 32768.0  # Normalize to 0-1
        audio_beat = peak / 32768.0  # Peak for beat detection
        
        # Normalize frequency components
        low_count = max(1, len(eyesy.audio_in) // 3)
        mid_count = max(1, len(eyesy.audio_in) // 3)
        high_count = max(1, len(eyesy.audio_in) - 2 * (len(eyesy.audio_in) // 3))
        
        audio_low = (low_total / low_count) / 32768.0
        audio_mid = (mid_total / mid_count) / 32768.0
        audio_high = (high_total / high_count) / 32768.0
    
    # Number of characters (Knob3) - 1 to 25 characters (perfect 5x5 grid at max)
    num_characters = int(1 + eyesy.knob3 * 24.99)  # 1-25 characters
    num_characters = max(1, min(25, num_characters))  # Clamp to 1-25
    
    # Character size (Knob1)
    # Scale down slightly when there are many characters to prevent overlap
    base_size = min(xr, yr) * 0.15  # Base size as fraction of screen
    # Knob1 now controls 1.0x to 2.0x (smallest is what largest used to be)
    size_multiplier = 1.0 + eyesy.knob1 * 1.0  # Knob1 controls 1.0x to 2.0x
    # Reduce size slightly for many characters (scale factor based on sqrt of count)
    crowd_factor = 1.0 / (1.0 + (num_characters - 1) * 0.05)  # Gradual reduction
    character_size = base_size * size_multiplier * crowd_factor
    
    # Dance intensity (Knob2) - how much audio affects movement
    intensity = eyesy.knob2
    
    # Base dance speed (constant for all)
    base_speed = 0.1
    # Speed up with audio
    speed = base_speed * (1.0 + audio_amplitude * intensity * 0.5)
    
    # Update dance time (continuous dancing)
    dance_time += speed
    
    # Handle trigger for special moves (optional enhancement)
    if eyesy.trig and not last_trigger:
        special_move = 1.0  # Start special move
        last_trigger = True
    elif not eyesy.trig:
        last_trigger = False
    
    # Decay special move
    if special_move > 0:
        special_move -= 0.05
        if special_move < 0:
            special_move = 0
    
    # Calculate positions for multiple characters
    # Use random positions with overlap prevention, but pair some as couples
    # Cache positions and only regenerate when number of characters changes
    global cached_positions, cached_num_characters
    
    # Determine which characters should be couples
    # Pair up characters when there are 4+ characters (every 2nd pair starting from index 2)
    couple_pairs = []
    if num_characters >= 4:
        # Pair up some characters (e.g., indices 2-3, 4-5, 6-7, etc.)
        for i in range(2, num_characters - 1, 2):
            if i + 1 < num_characters:
                couple_pairs.append((i, i + 1))
    
    # Regenerate positions if number of characters changed or screen size changed
    if (len(cached_positions) != num_characters or 
        cached_num_characters != num_characters):
        
        positions = []
        
        # Minimum spacing between characters (based on character size)
        # Use character size plus some padding to prevent overlap
        min_spacing = character_size * 1.5  # 1.5x character size for safe spacing
        couple_spacing = character_size * 0.8  # Closer spacing for couples
        
        # Screen margins to keep characters away from edges
        margin_x = character_size * 0.8
        margin_y = character_size * 0.8
        
        # Available area for positioning
        min_x = int(margin_x)
        max_x = int(xr - margin_x)
        min_y = int(margin_y)
        max_y = int(yr - margin_y)
        
        if num_characters == 1:
            # Single character in center
            positions = [(xr // 2, yr // 2)]
        else:
            # Use deterministic seed based on number of characters for consistent positions
            random.seed(num_characters * 42)  # Seed ensures consistency
            
            # Track which characters are already placed (for couples)
            placed_couples = set()
            
            # Generate random positions for each character
            max_attempts = 1000  # Maximum attempts to find a non-overlapping position
            
            for i in range(num_characters):
                attempts = 0
                found_position = False
                
                # Check if this character is part of a couple
                is_in_couple = False
                partner_idx = None
                for pair in couple_pairs:
                    if i in pair:
                        is_in_couple = True
                        partner_idx = pair[1] if pair[0] == i else pair[0]
                        break
                
                # If this is the first partner in a couple, place both together
                if is_in_couple and i < partner_idx and i not in placed_couples:
                    while not found_position and attempts < max_attempts:
                        # Generate random position for first partner
                        pos_x = random.randint(min_x, max_x)
                        pos_y = random.randint(min_y, max_y)
                        
                        # Place partner nearby (to the right or left)
                        partner_offset_x = random.choice([-1, 1]) * couple_spacing
                        partner_offset_y = random.randint(-int(couple_spacing * 0.5), int(couple_spacing * 0.5))
                        partner_x = pos_x + partner_offset_x
                        partner_y = pos_y + partner_offset_y
                        
                        # Clamp partner position to screen
                        partner_x = max(min_x, min(max_x, partner_x))
                        partner_y = max(min_y, min(max_y, partner_y))
                        
                        # Check if both positions are valid
                        overlaps = False
                        for existing_x, existing_y in positions:
                            distance1 = math.sqrt((pos_x - existing_x)**2 + (pos_y - existing_y)**2)
                            distance2 = math.sqrt((partner_x - existing_x)**2 + (partner_y - existing_y)**2)
                            if distance1 < min_spacing or distance2 < min_spacing:
                                overlaps = True
                                break
                        
                        if not overlaps:
                            positions.append((pos_x, pos_y))
                            positions.append((partner_x, partner_y))
                            placed_couples.add(i)
                            placed_couples.add(partner_idx)
                            found_position = True
                        else:
                            attempts += 1
                
                # If this character is the second partner in a couple, skip (already placed)
                elif is_in_couple and i in placed_couples:
                    continue
                
                # Otherwise, place character normally
                else:
                    while not found_position and attempts < max_attempts:
                        # Generate random position
                        pos_x = random.randint(min_x, max_x)
                        pos_y = random.randint(min_y, max_y)
                        
                        # Check if this position overlaps with any existing character
                        overlaps = False
                        for existing_x, existing_y in positions:
                            distance = math.sqrt((pos_x - existing_x)**2 + (pos_y - existing_y)**2)
                            if distance < min_spacing:
                                overlaps = True
                                break
                        
                        if not overlaps:
                            positions.append((pos_x, pos_y))
                            found_position = True
                        else:
                            attempts += 1
                
                # If we couldn't find a position after max attempts, place it anyway
                if not found_position and not (is_in_couple and i in placed_couples):
                    if is_in_couple and i < partner_idx:
                        # Place couple together even if overlapping
                        pos_x = random.randint(min_x, max_x)
                        pos_y = random.randint(min_y, max_y)
                        positions.append((pos_x, pos_y))
                        positions.append((pos_x + couple_spacing, pos_y))
                    else:
                        positions.append((pos_x, pos_y))
        
        # Cache the positions
        cached_positions = positions
        cached_num_characters = num_characters
    else:
        # Use cached positions
        positions = cached_positions
    
    # Determine which characters should be couples (same logic as positioning)
    couple_pairs = []
    couple_map = {}  # Map character index to partner index
    if num_characters >= 4:
        for i in range(2, num_characters - 1, 2):
            if i + 1 < num_characters:
                couple_pairs.append((i, i + 1))
                couple_map[i] = i + 1
                couple_map[i + 1] = i
    
    # Draw each character with unique dance parameters
    for i, (pos_x, pos_y) in enumerate(positions):
        # Check if this character is part of a couple
        is_in_couple = i in couple_map
        is_first_partner = is_in_couple and i < couple_map[i] if is_in_couple else False
        
        # Each character has different parameters to make them dance differently
        # Couples share the same phase for synchronization
        if is_in_couple:
            # Use the first partner's index for phase (so they're in sync)
            partner_idx = couple_map[i]
            phase_idx = min(i, partner_idx)  # Use the lower index
            phase_offset = (phase_idx * math.pi * 2) / num_characters
        else:
            phase_offset = (i * math.pi * 2) / num_characters  # Stagger their phases
        
        speed_multiplier = 0.8 + (i % 3) * 0.2  # Some dance faster (0.8x to 1.2x)
        move_type = i % 20  # Cycle through 20 different dance move types
        
        # First partner mirrors, second partner doesn't (creates mirror effect)
        mirror_couple = is_in_couple and is_first_partner
        
        draw_character(screen, color, pos_x, pos_y, character_size, intensity,
                     audio_amplitude, audio_beat, audio_low, audio_mid, audio_high,
                     dance_time,
                     phase_offset, speed_multiplier, move_type,
                     is_in_couple, mirror_couple)
    
    # Add a dedicated breakdancer character (appears conditionally)
    # Appears when there are 3+ characters, with varying probability
    show_breakdancer = False
    if num_characters >= 3:
        # Use deterministic but varying condition based on num_characters
        # This makes it appear/disappear as you change the number
        # More likely to appear with more characters
        breakdancer_seed = num_characters * 17  # Different seed for breakdancer
        random.seed(breakdancer_seed)
        # Probability increases with more characters (but not always)
        # For 3-5 chars: 30% chance, 6-10: 50%, 11-15: 70%, 16+: 80%
        if num_characters <= 5:
            show_breakdancer = (breakdancer_seed % 10 < 3)  # 30% chance
        elif num_characters <= 10:
            show_breakdancer = (breakdancer_seed % 10 < 5)  # 50% chance
        elif num_characters <= 15:
            show_breakdancer = (breakdancer_seed % 10 < 7)  # 70% chance
        else:
            show_breakdancer = (breakdancer_seed % 10 < 8)  # 80% chance
    
    if show_breakdancer:
        # Position breakdancer in different corners/edges based on num_characters
        # This makes it appear in different spots
        position_variant = num_characters % 4
        if position_variant == 0:
            breakdancer_x = int(xr * 0.85)  # Right side
            breakdancer_y = int(yr * 0.8)   # Lower area
        elif position_variant == 1:
            breakdancer_x = int(xr * 0.15)  # Left side
            breakdancer_y = int(yr * 0.8)   # Lower area
        elif position_variant == 2:
            breakdancer_x = int(xr * 0.85)  # Right side
            breakdancer_y = int(yr * 0.2)   # Upper area
        else:
            breakdancer_x = int(xr * 0.15)  # Left side
            breakdancer_y = int(yr * 0.2)   # Upper area
        
        # Breakdancer always uses breakdance move (move_type 8)
        # Has unique phase and speed for variety
        breakdancer_phase = dance_time * 0.3  # Different phase from others
        breakdancer_speed = 1.2  # Slightly faster for more dynamic breakdancing
        
        draw_character(screen, color, breakdancer_x, breakdancer_y, character_size, intensity,
                     audio_amplitude, audio_beat, audio_low, audio_mid, audio_high,
                     dance_time,
                     breakdancer_phase, breakdancer_speed, 8,  # Always breakdance (move_type 8)
                     False, False)  # Not part of a couple
