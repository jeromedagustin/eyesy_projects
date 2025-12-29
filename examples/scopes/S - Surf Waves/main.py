import os
import pygame
import math
import time
import random
#Knob1 - Wave speed
#Knob2 - Wave size/scale
#Knob3 - 2D/3D mode switch (0-0.5: 2D waves, 0.5-1: 3D waves) + Wave direction/frequency
#Knob4 - Foreground color (wave color)
#Knob5 - Background color (sky color)
#
#Note: Audio gain is controlled by Shift + Knob 1 (per EYESY documentation).
#      Wave speed and scale also respond to audio amplitude for dynamic reactivity.
#
#Trigger - Creates a "big wave" splash effect at a random horizontal position
#
# Shift+Knob Features (COMMENTED OUT - Experimental, not in official API):
# Shift+Knob1 - Wave turbulence/chaos (adds noise and variation)
# Shift+Knob2 - Number of wave layers (2-5 layers)
# Shift+Knob3 - Camera angle/perspective rotation (for 3D mode, -45 to +45 degrees)
# Shift+Knob4 - Wave color saturation/intensity multiplier
# Shift+Knob5 - Background gradient/atmosphere (0=solid, 1=gradient sky)
#
# Note: These shift+knob features work in the test runner. On actual EYESY hardware,
# they require the shift button state to be exposed via eyesy.shift in the API.
# Currently, the official EYESY OS v3 API doesn't expose shift state to modes.
def setup(screen, eyesy):
    global trigger_waves, last_trigger_state
    trigger_waves = []  # List of active trigger wave effects
    last_trigger_state = False  # Track previous trigger state for edge detection
def draw(screen, eyesy):
    global trigger_waves, last_trigger_state
    # Get background (sky) color
    bg_color = eyesy.color_picker_bg(eyesy.knob5)
    screen.fill(bg_color)
    # Handle trigger events - create big wave splash (only on rising edge)
    if eyesy.trig and not last_trigger_state:
        # Create a new trigger wave at random position
        trigger_x = random.uniform(0.2, 0.8) * eyesy.xres  # Random position across screen
        trigger_waves.append({
            'x': trigger_x,
            'time': time.time(),
            'life': 0.0  # Will increase over time
        })
    # Update last trigger state
    last_trigger_state = eyesy.trig
    # Shift+Knob5: Background gradient/atmosphere (COMMENTED OUT)
    # if hasattr(eyesy, 'shift') and eyesy.shift:
    #     gradient_amount = eyesy.knob5
    #     if gradient_amount > 0.1:  # Only draw gradient if knob is turned up
    #         draw_gradient_background(screen, eyesy, bg_color, gradient_amount)
    #     else:
    #         screen.fill(bg_color)
    # else:
    #     screen.fill(bg_color)
    # Get wave color
    wave_color = eyesy.color_picker(eyesy.knob4)
    # Shift+Knob4: Wave color saturation/intensity multiplier (COMMENTED OUT)
    # base_wave_color = eyesy.color_picker(eyesy.knob4)
    # if hasattr(eyesy, 'shift') and eyesy.shift:
    #     saturation_mult = 0.5 + eyesy.knob4 * 1.5  # 0.5x to 2.0x intensity
    #     wave_color = (
    #         min(255, int(base_wave_color[0] * saturation_mult)),
    #         min(255, int(base_wave_color[1] * saturation_mult)),
    #         min(255, int(base_wave_color[2] * saturation_mult))
    #     )
    # else:
    #     wave_color = base_wave_color
    # Get audio amplitude for reactivity - enhanced for better responsiveness
    audio_amplitude = 0.0
    audio_peak = 0.0
    audio_samples_used = []
    if len(eyesy.audio_in) > 0:
        # Calculate average amplitude
        total = 0.0
        for i in range(len(eyesy.audio_in)):
            abs_val = abs(eyesy.audio_in[i])
            total += abs_val
            if abs_val > audio_peak:
                audio_peak = abs_val
        audio_amplitude = (total / len(eyesy.audio_in)) / 32768.0
        # Also get peak for more dynamic response
        audio_peak = audio_peak / 32768.0
        # Store normalized samples for direct wave shaping
        audio_samples_used = [(eyesy.audio_in[i] / 32768.0) for i in range(min(len(eyesy.audio_in), 200))]
    # Wave parameters
    wave_speed = eyesy.knob1 * 0.02 + 0.003
    wave_scale = eyesy.knob2 * 2.5 + 0.5  # Increased range for bigger wave height
    # Audio reactivity adds dynamic variation
    speed_mod = audio_amplitude * 0.015  # Audio affects speed
    wave_speed += speed_mod
    audio_scale_mod = audio_amplitude * 1.0  # Audio adds up to 1.0x more scale
    wave_scale += audio_scale_mod
    # Shift+Knob1: Wave turbulence/chaos (COMMENTED OUT)
    turbulence = 0.0
    # if hasattr(eyesy, 'shift') and eyesy.shift:
    #     turbulence = eyesy.knob1 * 0.3  # 0 to 0.3 turbulence amount
    # Knob3 controls 2D/3D mode switch and direction
    # 0-0.5: 2D waves (original behavior)
    # 0.5-1: 3D waves (perspective view)
    use_3d = eyesy.knob3 >= 0.5
    mode_blend = (eyesy.knob3 - 0.5) * 2.0 if use_3d else 0.0  # 0 to 1 for 3D mode
    # Shift+Knob3: Camera angle/perspective rotation (COMMENTED OUT)
    camera_angle = 0.0
    # if hasattr(eyesy, 'shift') and eyesy.shift and use_3d:
    #     camera_angle = (eyesy.knob3 - 0.5) * 90.0 - 45.0  # -45 to +45 degrees
    # For 2D mode, keep original direction and frequency behavior
    if not use_3d:
        # 2D mode: knob3 controls direction and frequency
        if eyesy.knob3 < 0.25:
            wave_direction = -1  # Left
            breaking_intensity = (0.25 - eyesy.knob3) * 4.0
            wave_frequency = 0.5 + (0.25 - eyesy.knob3) * 3.0
        else:
            wave_direction = 1  # Right
            breaking_intensity = (eyesy.knob3 - 0.25) * 4.0
            wave_frequency = 0.5 + (eyesy.knob3 - 0.25) * 3.0
    else:
        # 3D mode: knob3 controls direction and frequency (similar to 2D)
        # Map 0.5-1.0 range to direction control
        # 0.5-0.75: Left direction
        # 0.75-1.0: Right direction
        if eyesy.knob3 < 0.75:
            wave_direction = -1  # Left
            breaking_intensity = (0.75 - eyesy.knob3) * 4.0  # 0 to 1 as knob goes from 0.75 to 0.5
            wave_frequency = 1.0 + (0.75 - eyesy.knob3) * 1.5  # 1.0 to 2.5
        else:
            wave_direction = 1  # Right
            breaking_intensity = (eyesy.knob3 - 0.75) * 4.0  # 0 to 1 as knob goes from 0.75 to 1.0
            wave_frequency = 1.0 + (eyesy.knob3 - 0.75) * 1.5  # 1.0 to 2.5
    current_time = time.time()
    # Shift+Knob2: Number of wave layers (COMMENTED OUT)
    num_layers = 3
    # if hasattr(eyesy, 'shift') and eyesy.shift:
    #     num_layers = int(2 + eyesy.knob2 * 3)  # 2 to 5 layers
    #     num_layers = max(2, min(5, num_layers))
    # else:
    #     num_layers = 3
    # Draw waves in 2D or 3D mode based on knob3
    if use_3d:
        # 3D WAVE RENDERING
        draw_3d_waves(screen, eyesy, wave_color, bg_color, wave_speed, wave_scale,
                     wave_frequency, audio_amplitude, current_time, mode_blend,
                     wave_direction, camera_angle, audio_samples_used)
    else:
        # 2D WAVE RENDERING (original)
        draw_2d_waves(screen, eyesy, wave_color, wave_speed, wave_scale,
                     wave_direction, breaking_intensity, wave_frequency,
                     audio_amplitude, current_time, num_layers, turbulence, audio_samples_used)
    # Draw trigger wave effects (big wave splashes)
    draw_trigger_waves(screen, eyesy, wave_color, current_time)
def draw_gradient_background(screen, eyesy, base_color, gradient_amount):
    """Draw a gradient sky background"""
    # Create gradient from horizon (bottom) to sky (top)
    horizon_y = int(eyesy.yres * 0.6)  # Horizon at 60% of screen
    for y in range(eyesy.yres):
        # Calculate gradient factor (0.0 at top, 1.0 at bottom)
        if y < horizon_y:
            factor = y / horizon_y if horizon_y > 0 else 0
        else:
            factor = 1.0
        # Blend between lighter sky color and base color
        sky_color = (
            min(255, base_color[0] + int((255 - base_color[0]) * (1.0 - factor) * gradient_amount)),
            min(255, base_color[1] + int((255 - base_color[1]) * (1.0 - factor) * gradient_amount)),
            min(255, base_color[2] + int((255 - base_color[2]) * (1.0 - factor) * gradient_amount))
        )
        pygame.draw.line(screen, sky_color, (0, y), (eyesy.xres, y))
def draw_2d_waves(screen, eyesy, wave_color, wave_speed, wave_scale,
                  wave_direction, breaking_intensity, wave_frequency,
                  audio_amplitude, current_time, num_layers, turbulence=0.0, audio_samples_used=None):
    """Draw 2D waves with enhanced audio reactivity"""
    if audio_samples_used is None:
        audio_samples_used = []
    """Draw 2D waves (original implementation)"""
    # Draw wave layers from back to front
    for layer in range(num_layers):
        layer_progress = layer / max(num_layers - 1, 1)
        # Wave properties vary by depth
        layer_speed = wave_speed * (0.4 + layer_progress * 0.6)
        layer_scale = wave_scale * (0.5 + layer_progress * 0.5)
        # Wave frequency affects wavelength - more frequency = shorter waves = more waves on screen
        base_wavelength = 200 + layer_progress * 150
        layer_wavelength = base_wavelength / wave_frequency  # Shorter wavelength = more waves
        # Color gets lighter as waves get closer
        depth_factor = 0.4 + layer_progress * 0.6
        layer_color = (
            int(wave_color[0] * depth_factor),
            int(wave_color[1] * depth_factor),
            int(wave_color[2] * depth_factor)
        )
        wave_offset = current_time * layer_speed * 150 * wave_direction
        # Adjust base position - waves should take up more vertical space
        # Start waves higher and make them taller
        base_y_offset = (wave_scale - 0.5) * 0.4  # More aggressive offset
        # Waves start at 30% of screen height and extend down
        base_y = eyesy.yres * (0.30 - base_y_offset + layer_progress * (0.55 + base_y_offset * 0.6))
        # Build wave points with realistic ocean wave physics
        points = []
        # Generate points across full width, including edges
        for x in range(0, eyesy.xres, 1):  # Full width coverage, high resolution
            # Simplified, more realistic ocean wave physics
            # Primary wave - smooth rolling motion
            phase1 = (x / layer_wavelength) * 2 * math.pi + wave_offset
            # Use a smoother wave function - combination of sine and cosine
            # This creates more natural rolling waves
            primary_wave = math.sin(phase1) * 0.7 + math.cos(phase1) * 0.3
            # Add gentle secondary waves for texture (much smaller amplitude)
            phase2 = (x / (layer_wavelength * 1.3)) * 2 * math.pi + wave_offset * 0.95
            phase3 = (x / (layer_wavelength * 0.8)) * 2 * math.pi + wave_offset * 1.05
            secondary1 = math.sin(phase2) * 0.15
            secondary2 = math.cos(phase3) * 0.1
            # Create smooth, rolling wave shape
            # Ocean waves are smoother and more flowing
            if primary_wave > 0:
                # Front face - slightly steeper but still smooth
                wave_value = primary_wave * (1.0 + breaking_intensity * 0.2)
            else:
                # Back face - gentle, smooth slope
                wave_value = primary_wave * 0.85
            # Combine waves smoothly
            wave_value = wave_value + secondary1 + secondary2
            # Very subtle variation for organic feel (much smaller)
            subtle_variation = math.sin(phase1 * 3.5) * 0.015
            wave_value += subtle_variation
            # Shift+Knob1: Add turbulence/chaos (COMMENTED OUT)
            # if turbulence > 0.0:
            #     # Add noise based on position and time for turbulence
            #     noise_phase = (x / 50.0) * 2 * math.pi + current_time * 2.0
            #     turbulence_noise = (
            #         math.sin(noise_phase) * 0.3 +
            #         math.sin(noise_phase * 2.3) * 0.2 +
            #         math.sin(noise_phase * 3.7) * 0.1
            #     ) * turbulence
            #     wave_value += turbulence_noise
            # Apply smooth wave height scaling
            base_height = wave_value * layer_scale * 100
            # Enhanced audio reactivity - direct mapping of audio to wave shape
            # Map x position to audio sample index for direct audio-to-wave mapping
            audio_index = int((x / eyesy.xres) * len(audio_samples_used)) if len(audio_samples_used) > 0 else 0
            audio_index = min(audio_index, len(audio_samples_used) - 1) if len(audio_samples_used) > 0 else 0
            # Direct audio influence on wave height
            if len(audio_samples_used) > 0:
                # Use actual audio sample value for direct reactivity
                audio_sample = audio_samples_used[audio_index]
                # Stronger audio influence - audio directly affects wave height
                audio_mod = audio_sample * layer_scale * 150  # Direct audio-to-wave mapping
                # Also add amplitude-based scaling
                amplitude_mod = audio_amplitude * layer_scale * 80
                wave_height = base_height + audio_mod + amplitude_mod
            else:
                # Fallback if no audio
                audio_mod = audio_amplitude * 20 * math.sin(phase1 * 1.5)
                wave_height = base_height * (1.0 + audio_amplitude * 0.25) + audio_mod
            # Simple 2D wave rendering - no 3D transformation
            x_screen = x
            y_screen = int(base_y + wave_height)
            # Clamp to screen bounds, but ensure we can reach full width
            x_screen = max(0, min(x_screen, eyesy.xres - 1))
            y_screen = max(0, min(y_screen, eyesy.yres - 1))
            points.append((x_screen, y_screen))
        # Ensure we have points at both edges for full width coverage
        if len(points) > 0:
            # Ensure first point is at x=0
            if points[0][0] > 0:
                first_y = points[0][1]
                points.insert(0, (0, first_y))
            # Ensure last point is at x=eyesy.xres-1
            if points[-1][0] < eyesy.xres - 1:
                last_y = points[-1][1]
                points.append((eyesy.xres - 1, last_y))
        # Draw wave as filled polygon with smooth rendering
        if len(points) > 1:
            # Ensure polygon extends full width and closes properly
            polygon_points = [(0, eyesy.yres)]
            polygon_points.extend(points)
            polygon_points.append((eyesy.xres - 1, eyesy.yres))
            # Ensure all y values are within screen bounds
            safe_points = [(px, min(eyesy.yres - 1, max(0, py))) for px, py in polygon_points]
            # Draw main wave polygon - this creates smooth filled waves
            pygame.draw.polygon(screen, layer_color, safe_points)
        # Draw wave details on top layer - subtle highlights only
        if layer == num_layers - 1:
            # Draw subtle wave crest highlight for realism
            if len(points) > 1:
                # Very subtle lighter color for the wave crest
                crest_color = (
                    min(255, layer_color[0] + 20),
                    min(255, layer_color[1] + 20),
                    min(255, layer_color[2] + 20)
                )
                # Draw smooth crest line
                pygame.draw.lines(screen, crest_color, False, points, 1)
            # Draw subtle highlights on wave peaks (sun reflection)
            highlight_color = (
                min(255, layer_color[0] + 40),
                min(255, layer_color[1] + 40),
                min(255, layer_color[2] + 40)
            )
            # Only draw highlights on actual peaks for subtle effect
            for i in range(1, len(points) - 1, 2):
                if i < len(points):
                    x, y = points[i]
                    # Check if this is actually a peak
                    if i > 0 and i < len(points) - 1:
                        prev_y = points[i-1][1]
                        next_y = points[i+1][1]
                        if y < prev_y and y < next_y:  # Local minimum (peak)
                            phase = (x / layer_wavelength) * 2 * math.pi + wave_offset
                            wave_val = math.cos(phase)
                            if wave_val > 0.7:
                                highlight_size = int(1 + (wave_val - 0.7) * 4)
                                pygame.draw.circle(screen, highlight_color, (x, y - 1), highlight_size)
def draw_3d_waves(screen, eyesy, wave_color, bg_color, wave_speed, wave_scale,
                  wave_frequency, audio_amplitude, current_time, mode_blend,
                  wave_direction, camera_angle=0.0, audio_samples_used=None):
    """Draw 3D waves with enhanced audio reactivity"""
    if audio_samples_used is None:
        audio_samples_used = []
    """Draw 3D waves with perspective projection - optimized for performance"""
    # 3D parameters - optimized for performance (reduced from 40x100 to 25x60)
    num_rows = 25  # Number of depth rows (reduced for better performance)
    num_cols = 60  # Number of horizontal points (reduced for better performance)
    depth_range = 600.0  # How far back waves extend in 3D space
    # Camera/view parameters - adjusted for better coverage
    camera_z = -150.0  # Camera position in Z (moved closer for larger view)
    focal_length = 400.0  # Perspective focal length (increased for wider view)
    # Wave parameters - direction controls X movement, Z always moves forward
    wave_offset_x = current_time * wave_speed * 150 * wave_direction
    wave_offset_z = current_time * wave_speed * 100  # Z always moves forward for depth effect
    # Generate 3D wave mesh
    mesh_points = []  # List of (x, y, z) for each point
    screen_points = []  # List of (screen_x, screen_y) for each point
    for row in range(num_rows):
        z_3d = row * (depth_range / num_rows)  # Z position (depth)
        depth_factor = 1.0 - (z_3d / depth_range)  # 1.0 at front, 0.0 at back
        # Color gets darker with depth
        color_factor = 0.3 + depth_factor * 0.7
        row_color = (
            int(wave_color[0] * color_factor),
            int(wave_color[1] * color_factor),
            int(wave_color[2] * color_factor)
        )
        row_points = []
        row_screen_points = []
        for col in range(num_cols):
            x_3d = (col / (num_cols - 1)) * eyesy.xres * 1.2 - (eyesy.xres * 1.2) / 2  # X position centered, wider
            # Calculate wave height at this 3D position
            # Use both X and Z for wave pattern
            phase_x = (x_3d / (200.0 / wave_frequency)) * 2 * math.pi + wave_offset_x
            phase_z = (z_3d / (150.0 / wave_frequency)) * 2 * math.pi + wave_offset_z
            # Combine waves in X and Z directions for 3D effect
            wave_x = math.sin(phase_x) * 0.7 + math.cos(phase_x) * 0.3
            wave_z = math.sin(phase_z) * 0.5 + math.cos(phase_z * 0.7) * 0.3
            # Combine for 3D wave surface - increased height multiplier
            wave_height_3d = (wave_x + wave_z * 0.5) * wave_scale * 150  # Increased from 80 to 150
            # Enhanced audio reactivity for 3D mode - direct audio mapping
            # Map x position to audio sample index
            audio_index = int((col / num_cols) * len(audio_samples_used)) if len(audio_samples_used) > 0 else 0
            audio_index = min(audio_index, len(audio_samples_used) - 1) if len(audio_samples_used) > 0 else 0
            if len(audio_samples_used) > 0:
                # Direct audio sample influence
                audio_sample = audio_samples_used[audio_index]
                # Strong audio influence on 3D waves
                audio_mod = audio_sample * wave_scale * 200
                # Amplitude-based scaling
                amplitude_mod = audio_amplitude * wave_scale * 100
                wave_height_3d = wave_height_3d + audio_mod + amplitude_mod
            else:
                # Fallback
                audio_mod = audio_amplitude * 25 * math.sin(phase_x * 1.5)
                wave_height_3d = wave_height_3d * (1.0 + audio_amplitude * 0.4) + audio_mod
            # Y position in 3D space (wave height)
            y_3d = wave_height_3d
            # Base Y position - waves start at 20% of screen and extend upward to fill more space
            # Front waves (depth_factor = 1.0) start at 20%, back waves start lower
            base_y_3d = eyesy.yres * (0.20 + (1.0 - depth_factor) * 0.5)  # Start at 20%, extend to 70%
            y_3d += base_y_3d
            # Store 3D point
            mesh_points.append((x_3d, y_3d, z_3d))
            # Shift+Knob3: Apply camera rotation (COMMENTED OUT)
            # if abs(camera_angle) > 0.1:
            #     angle_rad = math.radians(camera_angle)
            #     # Rotate X coordinate based on camera angle
            #     x_rotated = x_3d * math.cos(angle_rad) - z_3d * math.sin(angle_rad)
            #     z_rotated = x_3d * math.sin(angle_rad) + z_3d * math.cos(angle_rad)
            # else:
            x_rotated = x_3d
            z_rotated = z_3d
            # Project 3D to 2D screen coordinates with perspective
            # Perspective projection: screen_x = (x_3d * focal_length) / (z_3d - camera_z)
            z_distance = z_rotated - camera_z
            if z_distance > 0:
                screen_x = (x_rotated * focal_length) / z_distance + eyesy.xres / 2
                screen_y = (y_3d * focal_length) / z_distance + eyesy.yres * 0.1  # Offset upward to fill more space
                # Allow points to extend beyond screen for full coverage, but clamp for drawing
                row_screen_points.append((int(screen_x), int(screen_y)))
            else:
                row_screen_points.append(None)
        screen_points.append(row_screen_points)
    # Draw 3D wave mesh as filled polygons - optimized for performance
    for row in range(num_rows - 1):
        z_3d = row * (depth_range / num_rows)
        depth_factor = 1.0 - (z_3d / depth_range)
        # Color gets darker with depth
        color_factor = 0.3 + depth_factor * 0.7
        row_color = (
            int(wave_color[0] * color_factor),
            int(wave_color[1] * color_factor),
            int(wave_color[2] * color_factor)
        )
        # Draw quads between this row and next row
        for col in range(num_cols - 1):
            p1 = screen_points[row][col]
            p2 = screen_points[row][col + 1]
            p3 = screen_points[row + 1][col + 1]
            p4 = screen_points[row + 1][col]
            # Only draw if all points are valid
            if p1 and p2 and p3 and p4:
                # Quick visibility check - skip quads completely off-screen
                min_x = min(p1[0], p2[0], p3[0], p4[0])
                max_x = max(p1[0], p2[0], p3[0], p4[0])
                min_y = min(p1[1], p2[1], p3[1], p4[1])
                max_y = max(p1[1], p2[1], p3[1], p4[1])
                # Skip if completely off-screen
                if max_x < 0 or min_x >= eyesy.xres or max_y < 0 or min_y >= eyesy.yres:
                    continue
                # Clamp points to screen bounds for drawing
                safe_quad_points = [
                    (max(0, min(p1[0], eyesy.xres - 1)), max(0, min(p1[1], eyesy.yres - 1))),
                    (max(0, min(p2[0], eyesy.xres - 1)), max(0, min(p2[1], eyesy.yres - 1))),
                    (max(0, min(p3[0], eyesy.xres - 1)), max(0, min(p3[1], eyesy.yres - 1))),
                    (max(0, min(p4[0], eyesy.xres - 1)), max(0, min(p4[1], eyesy.yres - 1)))
                ]
                # Draw filled quad
                pygame.draw.polygon(screen, row_color, safe_quad_points)
                # Only draw outline for front rows (reduces drawing overhead)
                if row < num_rows // 3:  # Only front third of rows get outlines
                    outline_color = (
                        max(0, row_color[0] - 20),
                        max(0, row_color[1] - 20),
                        max(0, row_color[2] - 20)
                    )
                    pygame.draw.lines(screen, outline_color, True, safe_quad_points, 1)
    # Draw wave crest highlights on front row
    if len(screen_points) > 0:
        front_row = screen_points[0]
        crest_points = [p for p in front_row if p is not None]
        if len(crest_points) > 1:
            crest_color = (
                min(255, wave_color[0] + 30),
                min(255, wave_color[1] + 30),
                min(255, wave_color[2] + 30)
            )
            pygame.draw.lines(screen, crest_color, False, crest_points, 2)
def draw_trigger_waves(screen, eyesy, wave_color, current_time):
    """Draw trigger wave ripple effects - creates expanding wave ripples"""
    global trigger_waves
    # Update and draw trigger waves
    active_waves = []
    for wave in trigger_waves:
        wave['life'] = current_time - wave['time']
        max_life = 3.0  # Wave effect lasts 3 seconds
        if wave['life'] < max_life:
            active_waves.append(wave)
            # Calculate wave properties based on life
            life_ratio = wave['life'] / max_life  # 0.0 to 1.0
            # Wave expands outward
            max_radius = eyesy.xres * 0.8  # Max radius is 80% of screen width
            current_radius = life_ratio * max_radius
            # Create multiple wave ripples that expand outward
            num_ripples = 5  # Number of wave ripples
            ripple_spacing = max_radius / num_ripples
            for ripple_num in range(num_ripples):
                # Calculate this ripple's position
                ripple_radius = current_radius - (ripple_num * ripple_spacing)
                if ripple_radius > 0 and ripple_radius < max_radius:
                    # Calculate wave amplitude (fades with distance and time)
                    distance_factor = 1.0 - (ripple_radius / max_radius)
                    time_factor = 1.0 - life_ratio
                    amplitude = distance_factor * time_factor * 80  # Max wave height
                    # Wave frequency - more ripples = higher frequency
                    frequency = 3.0 + ripple_num * 0.5
                    # Create wave points that ripple outward
                    points = []
                    num_points = int(eyesy.xres * 0.8)  # High resolution for smooth waves
                    for i in range(num_points):
                        # X position along the wave
                        x = wave['x'] - max_radius/2 + (i / num_points) * max_radius
                        if 0 <= x < eyesy.xres:
                            # Distance from trigger center
                            dist_from_center = abs(x - wave['x'])
                            # Calculate wave height using sine wave
                            # Wave travels outward, so phase depends on distance
                            phase = (dist_from_center / ripple_spacing) * 2 * math.pi - (life_ratio * frequency * 2 * math.pi)
                            wave_height = math.sin(phase) * amplitude * (1.0 - life_ratio)
                            # Y position - waves appear at horizon level
                            base_y = eyesy.yres * 0.5
                            y = int(base_y + wave_height)
                            # Clamp to screen
                            y = max(0, min(eyesy.yres - 1, y))
                            points.append((int(x), y))
                    # Draw wave ripple as a line
                    if len(points) > 1:
                        # Color fades with distance and time
                        color_factor = (1.0 - life_ratio) * (1.0 - ripple_radius / max_radius) * 0.8
                        ripple_color = (
                            int(wave_color[0] * (0.5 + color_factor * 0.5)),
                            int(wave_color[1] * (0.5 + color_factor * 0.5)),
                            int(wave_color[2] * (0.5 + color_factor * 0.5))
                        )
                        # Draw wave line
                        line_width = max(1, int(3 * (1.0 - life_ratio)))
                        pygame.draw.lines(screen, ripple_color, False, points, line_width)
            # Draw central impact point (briefly)
            if life_ratio < 0.15:
                impact_size = int((1.0 - life_ratio / 0.15) * 15)
                if impact_size > 0:
                    impact_color = (
                        min(255, wave_color[0] + 40),
                        min(255, wave_color[1] + 40),
                        min(255, wave_color[2] + 40)
                    )
                    impact_y = int(eyesy.yres * 0.5)
                    pygame.draw.circle(screen, impact_color, (int(wave['x']), impact_y), impact_size)
    # Update global list with active waves only
    trigger_waves = active_waves
