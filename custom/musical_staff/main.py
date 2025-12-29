import os
import pygame
import math

"""
Musical Staff - Audio to Musical Notation

This mode detects musical notes from audio input and displays them on a musical staff.
It can also use MIDI note input if available.

Knob Assignments:
- Knob1 - Sensitivity/Threshold for pitch detection (0.0 = less sensitive, 1.0 = more sensitive)
- Knob2 - Note display size/scale
- Knob3 - Staff position (vertical offset)
- Knob4 - Foreground color (note color)
- Knob5 - Background color
"""

# Musical note names
NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# MIDI note to frequency mapping (A4 = 440Hz, MIDI note 69)
A4_FREQ = 440.0
A4_MIDI = 69

# Sample rate (EYESY typically uses ~44.1kHz, but audio_in array is small)
# We'll estimate based on typical audio buffer sizes
ESTIMATED_SAMPLE_RATE = 44100

# Global variables
detected_note = None
detected_frequency = 0.0
note_history = []  # Store recent notes for persistence
max_history = 20  # Number of recent notes to display

def setup(screen, eyesy):
    """Initialize the mode"""
    global note_history
    note_history = []

def frequency_to_midi_note(frequency):
    """
    Convert frequency (Hz) to MIDI note number.
    Returns (midi_note, note_name, octave)
    """
    if frequency <= 0:
        return None, None, None
    
    # Calculate MIDI note: midi = 69 + 12 * log2(freq / 440)
    midi_note = 69 + 12 * math.log2(frequency / A4_FREQ)
    midi_note = round(midi_note)
    
    # Clamp to valid MIDI range (0-127)
    midi_note = max(0, min(127, midi_note))
    
    # Get note name and octave
    note_index = midi_note % 12
    octave = (midi_note // 12) - 1  # MIDI note 0 is C-1, but we'll display as C0
    note_name = NOTE_NAMES[note_index]
    
    return midi_note, note_name, octave

def midi_note_to_staff_position(midi_note):
    """
    Convert MIDI note number to vertical position on staff.
    Returns (y_position, needs_ledger_line)
    Staff is treble clef: E4 (MIDI 64) is on bottom line, F5 (MIDI 77) is on top line
    """
    # Treble clef reference: E4 (MIDI 64) is the bottom line
    # Each line/space is a semitone
    # Staff lines are at: E4, G4, B4, D5, F5 (MIDI 64, 67, 71, 74, 77)
    
    base_note = 64  # E4 (bottom line of treble clef)
    offset = midi_note - base_note
    
    # Each semitone is one staff position
    # Staff has 5 lines, so we need to calculate position
    # Line spacing is typically about 12-15 pixels
    
    return offset, abs(offset) > 7  # Needs ledger line if outside staff range

def detect_pitch_autocorrelation(audio_samples, sample_rate, min_threshold=0.3):
    """
    Detect fundamental frequency using autocorrelation.
    Returns frequency in Hz, or None if no clear pitch detected.
    """
    if len(audio_samples) < 100:
        return None
    
    # Normalize audio samples
    normalized = [s / 32768.0 for s in audio_samples]
    
    # Calculate RMS to check if there's enough signal
    rms = math.sqrt(sum(s * s for s in normalized) / len(normalized))
    if rms < 0.01:  # Too quiet
        return None
    
    # Calculate autocorrelation
    min_period = int(sample_rate / 2000)  # Minimum period for 2000 Hz (highest reasonable note)
    max_period = int(sample_rate / 80)    # Maximum period for 80 Hz (lowest reasonable note)
    
    if max_period >= len(normalized) // 2:
        max_period = len(normalized) // 2 - 1
    
    if min_period >= max_period:
        return None
    
    best_period = min_period
    best_correlation = 0.0
    
    # Autocorrelation for different periods
    for period in range(min_period, max_period):
        correlation = 0.0
        count = 0
        
        for i in range(len(normalized) - period):
            correlation += normalized[i] * normalized[i + period]
            count += 1
        
        if count > 0:
            correlation /= count
            
            if correlation > best_correlation:
                best_correlation = correlation
                best_period = period
    
    # Check if correlation is strong enough (threshold adjustable)
    if best_period > 0 and best_correlation > min_threshold:
        frequency = sample_rate / best_period
        # Clamp to reasonable range
        if 80 <= frequency <= 2000:
            return frequency
    
    return None

def get_active_midi_note(eyesy):
    """
    Get the highest active MIDI note, or None if no notes are active.
    Returns (midi_note, note_name, octave)
    """
    if not hasattr(eyesy, 'midi_notes'):
        return None, None, None
    
    # Find highest active MIDI note
    for midi_note in range(127, -1, -1):
        if eyesy.midi_notes[midi_note]:
            note_index = midi_note % 12
            octave = (midi_note // 12) - 1
            note_name = NOTE_NAMES[note_index]
            return midi_note, note_name, octave
    
    return None, None, None

def draw_note_on_staff(screen, x, y_base, midi_note, note_size, color, is_treble=True):
    """
    Draw a musical note on the staff at the correct position.
    y_base is the center line of the staff.
    For treble: middle line is B4 (MIDI 71)
    For bass: middle line is D3 (MIDI 50)
    """
    # Staff line spacing (adjust based on note_size)
    line_spacing = note_size * 0.4
    
    if is_treble:
        # Treble clef: B4 (MIDI 71) is the middle line
        base_midi = 71
        staff_top = y_base - line_spacing * 2  # Top line (F5, MIDI 77)
        staff_bottom = y_base + line_spacing * 2  # Bottom line (E4, MIDI 64)
    else:
        # Bass clef: D3 (MIDI 50) is the middle line
        base_midi = 50
        staff_top = y_base - line_spacing * 2  # Top line (A3, MIDI 57)
        staff_bottom = y_base + line_spacing * 2  # Bottom line (G2, MIDI 43)
    
    # Calculate position on staff
    offset = midi_note - base_midi
    
    # Calculate y position
    y = y_base - (offset * line_spacing / 2)
    
    # Draw note head (oval)
    note_width = note_size * 0.6
    note_height = note_size * 0.4
    
    # Draw note head as an ellipse
    pygame.draw.ellipse(screen, color, 
                       (x - note_width/2, y - note_height/2, note_width, note_height))
    
    # Draw stem - goes down for notes on or above middle line, up for below
    stem_length = note_size * 1.2
    if midi_note >= base_midi:  # On or above middle line, stem goes down
        pygame.draw.line(screen, color, 
                        (x + note_width/2, y), 
                        (x + note_width/2, y + stem_length), 
                        max(1, int(note_size * 0.1)))
    else:  # Below middle line, stem goes up
        pygame.draw.line(screen, color, 
                        (x + note_width/2, y), 
                        (x + note_width/2, y - stem_length), 
                        max(1, int(note_size * 0.1)))
    
    # Draw ledger lines if needed
    if y < staff_top:  # Above staff
        num_lines = int((staff_top - y) / (line_spacing / 2)) + 1
        for i in range(num_lines):
            ledger_y = staff_top - (i * line_spacing / 2)
            pygame.draw.line(screen, color, 
                           (x - note_width, ledger_y), 
                           (x + note_width, ledger_y), 
                           max(1, int(note_size * 0.08)))
    
    if y > staff_bottom:  # Below staff
        num_lines = int((y - staff_bottom) / (line_spacing / 2)) + 1
        for i in range(num_lines):
            ledger_y = staff_bottom + (i * line_spacing / 2)
            pygame.draw.line(screen, color, 
                           (x - note_width, ledger_y), 
                           (x + note_width, ledger_y), 
                           max(1, int(note_size * 0.08)))

def draw_staff(screen, x_start, x_end, y_center, line_spacing, color, is_treble=True):
    """
    Draw a musical staff (5 horizontal lines).
    y_center is the middle line.
    For treble: middle line is B4
    For bass: middle line is D3
    """
    # Draw 5 lines
    for i in range(-2, 3):  # -2, -1, 0, 1, 2 (5 lines)
        y = y_center + (i * line_spacing / 2)
        pygame.draw.line(screen, color, (x_start, y), (x_end, y), 2)
    
    clef_x = x_start + 20
    
    if is_treble:
        # Draw simplified treble clef symbol (G clef)
        clef_y = y_center - line_spacing * 0.3
        
        # Draw a stylized "G" shape for treble clef
        # Vertical line
        pygame.draw.line(screen, color, 
                        (clef_x, clef_y - line_spacing * 0.8), 
                        (clef_x, clef_y + line_spacing * 0.8), 3)
        
        # Curved part (simplified)
        for i in range(5):
            angle = -90 + i * 30
            rad = math.radians(angle)
            r = line_spacing * 0.3
            px = clef_x + r * math.cos(rad)
            py = clef_y + r * math.sin(rad)
            if i > 0:
                pygame.draw.circle(screen, color, (int(px), int(py)), 2)
    else:
        # Draw simplified bass clef symbol (F clef)
        clef_y = y_center
        
        # Draw two dots on either side of the F line (4th line from top)
        dot_y = y_center + line_spacing  # F line (4th line)
        pygame.draw.circle(screen, color, (clef_x - 8, int(dot_y)), 3)
        pygame.draw.circle(screen, color, (clef_x + 8, int(dot_y)), 3)
        
        # Draw stylized "F" shape
        # Vertical line
        pygame.draw.line(screen, color,
                        (clef_x, clef_y - line_spacing * 0.6),
                        (clef_x, clef_y + line_spacing * 0.6), 3)
        
        # Curved part at top
        for i in range(8):
            angle = 180 + i * 20
            rad = math.radians(angle)
            r = line_spacing * 0.25
            px = clef_x + r * math.cos(rad)
            py = clef_y - line_spacing * 0.4 + r * math.sin(rad)
            if i > 0:
                pygame.draw.circle(screen, color, (int(px), int(py)), 2)

def draw(screen, eyesy):
    """Main draw function - called every frame"""
    global detected_note, detected_frequency, note_history
    
    # Set background
    eyesy.color_picker_bg(eyesy.knob5)
    color = eyesy.color_picker(eyesy.knob4)
    
    # Get screen dimensions
    screen_width = eyesy.xres
    screen_height = eyesy.yres
    
    # Calculate staff parameters
    note_size = 20 + (eyesy.knob2 * 40)  # Note size based on knob2
    line_spacing = note_size * 0.4
    staff_width = screen_width * 0.8
    staff_x_start = screen_width * 0.1
    staff_x_end = staff_x_start + staff_width
    
    # Calculate positions for both staffs
    # Staff vertical position (controlled by knob3)
    staff_center_y = screen_height * 0.5 + (eyesy.knob3 - 0.5) * screen_height * 0.2
    
    # Spacing between treble and bass staffs
    staff_gap = line_spacing * 3
    
    # Treble clef staff (upper)
    treble_y_center = staff_center_y - staff_gap / 2
    
    # Bass clef staff (lower)
    bass_y_center = staff_center_y + staff_gap / 2
    
    # Draw both staffs
    draw_staff(screen, staff_x_start, staff_x_end, treble_y_center, line_spacing, color, is_treble=True)
    draw_staff(screen, staff_x_start, staff_x_end, bass_y_center, line_spacing, color, is_treble=False)
    
    # Draw brace connecting the two staffs (on the left)
    brace_x = staff_x_start - 20
    brace_top = treble_y_center - line_spacing * 2.5
    brace_bottom = bass_y_center + line_spacing * 2.5
    brace_height = brace_bottom - brace_top
    
    # Draw a stylized brace (curly bracket shape)
    # Left side curve (top)
    for i in range(15):
        t = i / 14.0
        angle = 180 - t * 90  # 180 to 90 degrees
        rad = math.radians(angle)
        r = brace_height * 0.15
        px = brace_x + r * math.cos(rad)
        py = brace_top + brace_height * 0.2 + r * math.sin(rad)
        if i > 0:
            prev_t = (i - 1) / 14.0
            prev_angle = 180 - prev_t * 90
            prev_rad = math.radians(prev_angle)
            prev_px = brace_x + r * math.cos(prev_rad)
            prev_py = brace_top + brace_height * 0.2 + r * math.sin(prev_rad)
            pygame.draw.line(screen, color, (int(prev_px), int(prev_py)), (int(px), int(py)), 2)
    
    # Middle vertical line
    pygame.draw.line(screen, color, 
                    (brace_x, int(brace_top + brace_height * 0.2)), 
                    (brace_x, int(brace_bottom - brace_height * 0.2)), 2)
    
    # Right side curve (bottom)
    for i in range(15):
        t = i / 14.0
        angle = 90 - t * 90  # 90 to 0 degrees
        rad = math.radians(angle)
        r = brace_height * 0.15
        px = brace_x + r * math.cos(rad)
        py = brace_bottom - brace_height * 0.2 + r * math.sin(rad)
        if i > 0:
            prev_t = (i - 1) / 14.0
            prev_angle = 90 - prev_t * 90
            prev_rad = math.radians(prev_angle)
            prev_px = brace_x + r * math.cos(prev_rad)
            prev_py = brace_bottom - brace_height * 0.2 + r * math.sin(prev_rad)
            pygame.draw.line(screen, color, (int(prev_px), int(prev_py)), (int(px), int(py)), 2)
    
    # Try to get MIDI note first (if available)
    midi_note, note_name, octave = get_active_midi_note(eyesy)
    use_midi = midi_note is not None
    
    # If no MIDI note, detect pitch from audio
    if not use_midi and len(eyesy.audio_in) > 0:
        # Estimate sample rate based on audio buffer size
        # Typical EYESY audio buffer is 100-200 samples at ~44.1kHz
        buffer_duration = len(eyesy.audio_in) / ESTIMATED_SAMPLE_RATE
        sample_rate = len(eyesy.audio_in) / buffer_duration if buffer_duration > 0 else ESTIMATED_SAMPLE_RATE
        
        # Adjust sensitivity threshold based on knob1
        # Lower threshold = more sensitive (detects quieter/less clear pitches)
        min_threshold = 0.2 + (eyesy.knob1 * 0.5)  # 0.2 to 0.7
        
        # Detect pitch with sensitivity based on knob1
        frequency = detect_pitch_autocorrelation(eyesy.audio_in, sample_rate, min_threshold)
        
        if frequency:
            detected_frequency = frequency
            midi_note, note_name, octave = frequency_to_midi_note(frequency)
        else:
            detected_frequency = 0.0
            midi_note = None
    
    # Update note history
    if midi_note is not None:
        # Add to history if it's a new note or significant change
        if len(note_history) == 0 or note_history[-1][0] != midi_note:
            note_history.append((midi_note, note_name, octave))
            # Keep only recent notes
            if len(note_history) > max_history:
                note_history.pop(0)
    
    # Draw notes on appropriate staff
    # Middle C (C4, MIDI 60) is the dividing point
    # Notes >= C4 go on treble clef, notes < C4 go on bass clef
    if len(note_history) > 0:
        # Calculate spacing between notes
        note_spacing = staff_width / max(len(note_history), 1)
        
        for i, (note_midi, note_n, note_oct) in enumerate(note_history):
            x_pos = staff_x_start + (i * note_spacing) + note_spacing * 0.5
            
            # Determine which staff to use
            # Middle C (MIDI 60) and above go on treble clef
            # Below Middle C goes on bass clef
            if note_midi >= 60:  # C4 and above - treble clef
                draw_note_on_staff(screen, x_pos, treble_y_center, note_midi, note_size, color, is_treble=True)
            else:  # Below C4 - bass clef
                draw_note_on_staff(screen, x_pos, bass_y_center, note_midi, note_size, color, is_treble=False)
    
    # Draw current note info (optional - can be removed for cleaner display)
    if midi_note is not None and note_name is not None:
        # Draw note name and octave in corner
        font = pygame.font.Font(None, 36)
        note_text = f"{note_name}{note_oct}"
        if use_midi:
            note_text += " (MIDI)"
        else:
            note_text += f" ({int(detected_frequency)}Hz)"
        text_surface = font.render(note_text, True, color)
        screen.blit(text_surface, (10, 10))
