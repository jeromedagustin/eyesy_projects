import os
import pygame
import math
import random
# Knob Assignments:
# Knob 1 - Size and style of snowflakes (affects both size and visual appearance)
# Knob 2 - Intensity of snow (number of snowflakes)
# Knob 3 - Wind variability and snow speed (0 = slow/calm, 1 = fast/windy)
# Knob 4 - Color of snow and other elements
# Knob 5 - Background color
# Snowflake class
class Snowflake:
    def __init__(self, x, y, screen_width, screen_height):
        self.x = x
        self.y = y
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.speed = random.uniform(1, 4)  # Base falling speed (slower than rain)
        self.wind_offset = 0.0  # Horizontal wind effect
        self.rotation = random.uniform(0, math.pi * 2)  # Random starting rotation
        self.rotation_speed = random.uniform(-0.05, 0.05)  # Rotation speed
        self.flutter = random.uniform(0, math.pi * 2)  # Fluttering motion phase
        self.flutter_speed = random.uniform(0.02, 0.08)  # Flutter speed
        self.pattern_type = random.randint(0, 2)  # Different snowflake patterns
    def update(self, wind_strength, speed_multiplier):
        # Apply wind effect with horizontal drift
        self.wind_offset += wind_strength * random.uniform(-0.2, 0.2)
        self.x += self.wind_offset
        # Rotate snowflake as it falls
        self.rotation += self.rotation_speed
        # Fluttering motion (side-to-side swaying)
        self.flutter += self.flutter_speed
        flutter_offset = math.sin(self.flutter) * 0.5
        self.x += flutter_offset
        # Fall down with speed multiplier (slower than rain)
        self.y += self.speed * speed_multiplier * 0.6  # Snow falls slower
        # Reset if off screen
        if self.y > self.screen_height:
            self.y = random.uniform(-50, 0)
            self.x = random.uniform(0, self.screen_width)
            self.wind_offset = 0.0
            self.rotation = random.uniform(0, math.pi * 2)
            self.flutter = random.uniform(0, math.pi * 2)
        elif self.x < 0 or self.x > self.screen_width:
            # Reset if blown off screen horizontally
            self.y = random.uniform(-50, 0)
            self.x = random.uniform(0, self.screen_width)
            self.wind_offset = 0.0
            self.rotation = random.uniform(0, math.pi * 2)
            self.flutter = random.uniform(0, math.pi * 2)
    def draw(self, screen, color, size, style_factor):
        # Draw snowflake with different patterns based on style
        x = int(self.x)
        y = int(self.y)
        # For very small snowflakes, use a simple star
        if size <= 1.5:
            self._draw_simple_star(screen, x, y, 2, color, self.rotation)
            return
        # Style affects snowflake complexity
        # Low style_factor: simpler patterns
        # High style_factor: more complex, detailed patterns
        # Base radius for snowflake
        base_radius = max(2, int(size * 1.5))
        # Pattern complexity varies with style
        if style_factor < 0.33:
            # Simple 6-pointed star
            self._draw_simple_star(screen, x, y, base_radius, color, self.rotation)
        elif style_factor < 0.66:
            # Hexagonal snowflake with branches
            self._draw_hexagonal_snowflake(screen, x, y, base_radius, color, self.rotation, 1)
        else:
            # Complex snowflake with multiple branches
            self._draw_hexagonal_snowflake(screen, x, y, base_radius, color, self.rotation, 2)
    def _draw_simple_star(self, screen, x, y, radius, color, rotation):
        """Draw a simple 6-pointed star"""
        points = []
        for i in range(6):
            angle = (i * math.pi / 3) + rotation
            px = x + math.cos(angle) * radius
            py = y + math.sin(angle) * radius
            points.append((int(px), int(py)))
        # Draw star outline
        if len(points) >= 3:
            pygame.draw.polygon(screen, color, points, 1)
            # Fill center
            pygame.draw.circle(screen, color, (x, y), max(1, radius // 3))
    def _draw_hexagonal_snowflake(self, screen, x, y, radius, color, rotation, complexity):
        """Draw hexagonal snowflake with branches"""
        # Draw center hexagon
        center_points = []
        for i in range(6):
            angle = (i * math.pi / 3) + rotation
            px = x + math.cos(angle) * (radius * 0.3)
            py = y + math.sin(angle) * (radius * 0.3)
            center_points.append((int(px), int(py)))
        if len(center_points) >= 3:
            pygame.draw.polygon(screen, color, center_points)
        # Draw 6 main branches
        for i in range(6):
            angle = (i * math.pi / 3) + rotation
            # Main branch line
            end_x = x + math.cos(angle) * radius
            end_y = y + math.sin(angle) * radius
            pygame.draw.line(screen, color, (x, y), (int(end_x), int(end_y)), 1)
            # Side branches (perpendicular to main branch)
            if complexity >= 1:
                side_angle1 = angle + math.pi / 2
                side_angle2 = angle - math.pi / 2
                branch_length = radius * 0.4
                side1_x = x + math.cos(angle) * (radius * 0.6) + math.cos(side_angle1) * branch_length
                side1_y = y + math.sin(angle) * (radius * 0.6) + math.sin(side_angle1) * branch_length
                side2_x = x + math.cos(angle) * (radius * 0.6) + math.cos(side_angle2) * branch_length
                side2_y = y + math.sin(angle) * (radius * 0.6) + math.sin(side_angle2) * branch_length
                mid_x = x + math.cos(angle) * (radius * 0.6)
                mid_y = y + math.sin(angle) * (radius * 0.6)
                pygame.draw.line(screen, color, (int(mid_x), int(mid_y)),
                               (int(side1_x), int(side1_y)), 1)
                pygame.draw.line(screen, color, (int(mid_x), int(mid_y)),
                               (int(side2_x), int(side2_y)), 1)
            # Additional smaller branches for complexity level 2
            if complexity >= 2:
                small_branch_length = radius * 0.25
                small1_x = x + math.cos(angle) * (radius * 0.3) + math.cos(side_angle1) * small_branch_length
                small1_y = y + math.sin(angle) * (radius * 0.3) + math.sin(side_angle1) * small_branch_length
                small2_x = x + math.cos(angle) * (radius * 0.3) + math.cos(side_angle2) * small_branch_length
                small2_y = y + math.sin(angle) * (radius * 0.3) + math.sin(side_angle2) * small_branch_length
                small_mid_x = x + math.cos(angle) * (radius * 0.3)
                small_mid_y = y + math.sin(angle) * (radius * 0.3)
                pygame.draw.line(screen, color, (int(small_mid_x), int(small_mid_y)),
                               (int(small1_x), int(small1_y)), 1)
                pygame.draw.line(screen, color, (int(small_mid_x), int(small_mid_y)),
                               (int(small2_x), int(small2_y)), 1)
# Global variables
snowflakes = []
max_snowflakes = 300  # Maximum number of snowflakes (fewer than rain)
def setup(screen, eyesy):
    """
    Initialize snow system
    """
    global snowflakes
    snowflakes = []
    # Create initial snowflakes
    initial_count = int(eyesy.knob2 * max_snowflakes)
    for _ in range(initial_count):
        x = random.uniform(0, eyesy.xres)
        y = random.uniform(-eyesy.yres, 0)
        snowflakes.append(Snowflake(x, y, eyesy.xres, eyesy.yres))
def draw(screen, eyesy):
    """
    Draw snow effect
    """
    global snowflakes
    # Set background color
    eyesy.color_picker_bg(eyesy.knob5)
    # Get snow color
    color = eyesy.color_picker(eyesy.knob4)
    # Calculate snowflake size (2-10 pixels)
    flake_size = max(2, min(10, int(eyesy.knob1 * 10)))
    # Calculate style factor from knob1 (0-1) - affects visual appearance
    style_factor = eyesy.knob1
    # Calculate snow intensity (number of snowflakes)
    target_count = int(eyesy.knob2 * max_snowflakes)
    # Adjust number of snowflakes to match intensity
    while len(snowflakes) < target_count:
        x = random.uniform(0, eyesy.xres)
        y = random.uniform(-eyesy.yres, 0)
        snowflakes.append(Snowflake(x, y, eyesy.xres, eyesy.yres))
    while len(snowflakes) > target_count:
        snowflakes.pop(0)
    # Calculate wind strength from knob3
    # knob3 controls variability: 0 = no wind, 1 = strong wind
    wind_strength = (eyesy.knob3 - 0.5) * 2.0  # Map to -1.0 to 1.0
    # Calculate speed multiplier from knob3
    # knob3 also controls snow speed: 0 = slow, 1 = fast
    # Map knob3 (0-1) to speed multiplier (0.2 to 1.5) - slower than rain
    speed_multiplier = 0.2 + (eyesy.knob3 * 1.3)  # Range: 0.2x to 1.5x speed
    # Update and draw snowflakes
    for flake in snowflakes:
        flake.update(wind_strength, speed_multiplier)
        flake.draw(screen, color, flake_size, style_factor)
