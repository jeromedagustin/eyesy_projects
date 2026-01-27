import os
import pygame
import math
import time
"""
Breathing Circles - Smooth Pulsing Animation
A meditative breathing animation with concentric circles that expand and contract
in a smooth, rhythmic pattern. The animation creates a calming, breathing effect.
Knob Assignments:
- Knob1 - Breathing speed/rate (0.0 = slow, 1.0 = fast)
- Knob2 - Breathing amplitude (0.0 = small, 1.0 = large expansion)
- Knob3 - Number of concentric circles (0.0 = few, 1.0 = many)
- Knob4 - Foreground color
- Knob5 - Background color
"""
# Global variable to track start time for smooth animation
start_time = None
def setup(screen, eyesy):
    """Initialize the mode"""
    global start_time
    start_time = time.time()
def draw(screen, eyesy):
    """Draw the breathing circles animation"""
    global start_time
    # Set background color
    eyesy.color_picker_bg(eyesy.knob5)
    # Get foreground color
    color = eyesy.color_picker(eyesy.knob4)
    # Calculate center of screen
    center_x = eyesy.xres // 2
    center_y = eyesy.yres // 2
    # Calculate breathing parameters
    # Knob1 controls speed: 0.0 = very slow (0.5 cycles/sec), 1.0 = fast (3 cycles/sec)
    breathing_speed = 0.5 + (eyesy.knob1 * 2.5)
    # Knob2 controls amplitude: 0.0 = small (20% variation), 1.0 = large (80% variation)
    breathing_amplitude = 0.2 + (eyesy.knob2 * 0.6)
    # Knob3 controls number of circles: 0.0 = 3 circles, 1.0 = 12 circles
    num_circles = int(3 + (eyesy.knob3 * 9))
    # Calculate base radius (use smaller dimension to ensure circles fit)
    max_radius = min(eyesy.xres, eyesy.yres) * 0.4
    # Calculate breathing phase using sine wave for smooth animation
    current_time = time.time()
    if start_time is None:
        start_time = current_time
    elapsed = current_time - start_time
    phase = math.sin(elapsed * breathing_speed * 2 * math.pi)
    # Normalize phase from [-1, 1] to [0, 1] for easier calculation
    # This creates a smooth expansion and contraction
    normalized_phase = (phase + 1.0) / 2.0
    # Draw concentric circles with breathing effect
    for i in range(num_circles):
        # Calculate radius for this circle
        # Each circle has a different phase offset for a wave-like effect
        circle_phase = normalized_phase + (i * 0.1)
        circle_phase = circle_phase % 1.0  # Keep in [0, 1] range
        # Apply breathing effect: radius varies between base and expanded
        # Use a smooth curve (sine of the phase) for more natural breathing
        breathing_factor = 0.5 + 0.5 * math.sin(circle_phase * 2 * math.pi)
        radius_multiplier = 1.0 - breathing_amplitude + (breathing_amplitude * breathing_factor)
        # Calculate actual radius for this circle
        # Outer circles are larger, inner circles are smaller
        base_radius = max_radius * (1.0 - (i / num_circles) * 0.7)
        radius = int(base_radius * radius_multiplier)
        # Draw the circle
        if radius > 0:
            pygame.draw.circle(screen, color, (center_x, center_y), radius, 2)
    # Optional: Draw a filled center circle for more visual interest
    center_radius = int(max_radius * 0.15 * (1.0 + breathing_amplitude * phase))
    if center_radius > 0:
        pygame.draw.circle(screen, color, (center_x, center_y), center_radius)
