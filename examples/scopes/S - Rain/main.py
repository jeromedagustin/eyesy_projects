import os
import pygame
import math
import random
# Knob Assignments:
# Knob 1 - Size and style of raindrops (affects both size and visual appearance)
# Knob 2 - Intensity of rain (number of raindrops)
# Knob 3 - Wind variability and rain speed (0 = slow/calm, 1 = fast/windy)
# Knob 4 - Color of rain and other elements
# Knob 5 - Background color
# Rain drop class
class Raindrop:
    def __init__(self, x, y, screen_width, screen_height):
        self.x = x
        self.y = y
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.speed = random.uniform(3, 8)  # Base falling speed
        self.wind_offset = 0.0  # Horizontal wind effect
        self.prev_y = y  # Track previous position for motion trail
        self.angle = 0.0  # Slight angle for wind effect
    def update(self, wind_strength, speed_multiplier):
        # Store previous position for motion trail
        self.prev_y = self.y
        # Apply wind effect with slight angle
        self.wind_offset += wind_strength * random.uniform(-0.3, 0.3)
        self.x += self.wind_offset
        # Slight angle based on wind (raindrops tilt in wind)
        self.angle = wind_strength * 0.15  # Max ~8.5 degrees
        # Fall down with speed multiplier (affected by knob3)
        self.y += self.speed * speed_multiplier
        # Reset if off screen
        if self.y > self.screen_height:
            self.y = random.uniform(-50, 0)
            self.x = random.uniform(0, self.screen_width)
            self.wind_offset = 0.0
            self.angle = 0.0
            self.prev_y = self.y
        elif self.x < 0 or self.x > self.screen_width:
            # Reset if blown off screen horizontally
            self.y = random.uniform(-50, 0)
            self.x = random.uniform(0, self.screen_width)
            self.wind_offset = 0.0
            self.angle = 0.0
            self.prev_y = self.y
    def draw(self, screen, color, size, style_factor):
        # Draw raindrop as a teardrop shape with motion trail
        # style_factor (0-1) controls the visual style/appearance
        x = float(self.x)
        y = float(self.y)
        # For very small drops, use a simple circle with trail
        if size <= 1.5:
            # Draw motion trail
            if abs(self.y - self.prev_y) > 0.5:
                trail_length = min(3, abs(self.y - self.prev_y))
                trail_color = tuple(max(0, int(c * 0.4)) for c in color)
                pygame.draw.line(screen, trail_color,
                               (int(x), int(self.prev_y)),
                               (int(x), int(y)), 1)
            pygame.draw.circle(screen, color, (int(x), int(y)), 1)
            return
        # Style-based dimensions - appearance changes with knob1
        # Small sizes (low style_factor): more rounded, shorter
        # Large sizes (high style_factor): more elongated, sleeker
        # Width varies with style - smaller at low, wider at high
        width_base = 0.6 + (style_factor * 0.4)  # 0.6 to 1.0
        drop_width = max(2, int(size * width_base))
        # Length varies with style - shorter at low, longer at high
        length_base = 0.8 + (style_factor * 0.8)  # 0.8 to 1.6
        drop_length = max(4, int(4 + size * length_base))
        # Draw motion trail first (faded) - style affects trail intensity
        trail_intensity = 0.2 + (style_factor * 0.15)  # 0.2 to 0.35
        if abs(self.y - self.prev_y) > 1.0 and size > 2:
            trail_length = min(drop_length * 0.6, abs(self.y - self.prev_y))
            trail_start_y = self.prev_y
            trail_end_y = y - drop_length * 0.3
            # Create faded trail teardrop
            trail_width = max(1, int(drop_width * 0.5))
            trail_points = self._create_teardrop_points(x, trail_start_y, trail_width,
                                                       int(trail_length * 0.7), self.angle, style_factor)
            trail_color = tuple(max(0, int(c * trail_intensity)) for c in color)
            if len(trail_points) > 2:
                pygame.draw.polygon(screen, trail_color, trail_points)
        # Create main teardrop shape with style variation
        points = self._create_teardrop_points(x, y, drop_width, drop_length, self.angle, style_factor)
        # Draw filled teardrop
        pygame.draw.polygon(screen, color, points)
        # Add highlight at the top - style affects highlight appearance
        if size > 2:
            # Highlight size and position vary with style
            highlight_base = 0.25 + (style_factor * 0.15)  # 0.25 to 0.4
            highlight_size = max(1, min(3, int(size * highlight_base)))
            highlight_x = x + math.sin(self.angle) * highlight_size * 0.5
            highlight_y = y + highlight_size + math.cos(self.angle) * highlight_size * 0.5
            # Highlight brightness varies with style - blend toward white while preserving color
            highlight_brightness = 0.3 + (style_factor * 0.2)  # 0.3 to 0.5 (blend factor)
            # Blend color with white to create highlight that preserves hue
            highlight_color = tuple(
                int(c * (1 - highlight_brightness) + 255 * highlight_brightness)
                for c in color
            )
            pygame.draw.circle(screen, highlight_color,
                             (int(highlight_x), int(highlight_y)), highlight_size)
    def _create_teardrop_points(self, center_x, center_y, width, length, angle, style_factor):
        """Create teardrop shape points with optional rotation and style variation"""
        # Calculate rotation offsets
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        # Style affects shape characteristics:
        # - Number of points (smoother at higher style)
        # - Top cap size (smaller cap at higher style = sleeker)
        # - Taper curve (different taper exponent)
        num_points = int(12 + (style_factor * 8))  # 12 to 20 points
        # Top cap size varies with style (smaller cap = sleeker look)
        cap_size = 0.25 - (style_factor * 0.1)  # 0.25 to 0.15
        cap_size = max(0.1, min(0.3, cap_size))
        # Taper exponent varies with style (higher = sharper taper)
        taper_exponent = 1.3 + (style_factor * 0.4)  # 1.3 to 1.7
        points = []
        for i in range(num_points):
            t = i / (num_points - 1)  # 0 to 1
            # Calculate y position along drop
            y_offset = t * length
            # Teardrop width profile: rounded top, then smooth taper
            if t < cap_size:
                # Top rounded cap (semicircle-like)
                t_cap = t / cap_size  # 0 to 1 for the cap
                angle_offset = t_cap * math.pi  # 0 to pi
                x_offset = math.sin(angle_offset) * width * 0.5
            else:
                # Tapering body - use exponential curve, exponent varies with style
                t_body = (t - cap_size) / (1 - cap_size)  # 0 to 1 for the body
                # Exponential taper: starts at full width, tapers to point
                taper_factor = (1 - t_body) ** taper_exponent
                x_offset = width * 0.5 * taper_factor
            # Rotate point around center
            rot_x = x_offset * cos_a - y_offset * sin_a
            rot_y = x_offset * sin_a + y_offset * cos_a
            points.append((int(center_x + rot_x), int(center_y + rot_y)))
        return points
# Global variables
raindrops = []
max_raindrops = 500  # Maximum number of raindrops
def setup(screen, eyesy):
    """
    Initialize rain system
    """
    global raindrops
    raindrops = []
    # Create initial raindrops
    initial_count = int(eyesy.knob2 * max_raindrops)
    for _ in range(initial_count):
        x = random.uniform(0, eyesy.xres)
        y = random.uniform(-eyesy.yres, 0)
        raindrops.append(Raindrop(x, y, eyesy.xres, eyesy.yres))
def draw(screen, eyesy):
    """
    Draw rain effect
    """
    global raindrops
    # Set background color
    eyesy.color_picker_bg(eyesy.knob5)
    # Get rain color
    color = eyesy.color_picker(eyesy.knob4)
    # Calculate raindrop size (2-8 pixels, capped to prevent oversized drops)
    drop_size = max(2, min(8, int(eyesy.knob1 * 8)))
    # Calculate style factor from knob1 (0-1) - affects visual appearance
    # This makes the same knob control both size AND style
    style_factor = eyesy.knob1
    # Calculate rain intensity (number of raindrops)
    target_count = int(eyesy.knob2 * max_raindrops)
    # Adjust number of raindrops to match intensity
    while len(raindrops) < target_count:
        x = random.uniform(0, eyesy.xres)
        y = random.uniform(-eyesy.yres, 0)
        raindrops.append(Raindrop(x, y, eyesy.xres, eyesy.yres))
    while len(raindrops) > target_count:
        raindrops.pop(0)
    # Calculate wind strength from knob3
    # knob3 controls variability: 0 = no wind, 1 = strong wind
    wind_strength = (eyesy.knob3 - 0.5) * 2.0  # Map to -1.0 to 1.0
    # Calculate speed multiplier from knob3
    # knob3 also controls rain speed: 0 = slow, 1 = fast
    # Map knob3 (0-1) to speed multiplier (0.3 to 2.0)
    speed_multiplier = 0.3 + (eyesy.knob3 * 1.7)  # Range: 0.3x to 2.0x speed
    # Update and draw raindrops
    for drop in raindrops:
        drop.update(wind_strength, speed_multiplier)
        drop.draw(screen, color, drop_size, style_factor)
