#!/usr/bin/env python3
"""
EYESY Script Runner
A custom application to run and test EYESY mode scripts locally.

Usage:
    python tools/eyesy_runner.py [mode_path]
    
    If mode_path is not provided, a file browser will open to select a mode.
"""

import sys
import os
import pygame
import math
import time
import importlib.util
from pathlib import Path
import numpy as np
from typing import Optional
import threading
import queue

# Try to import tkinter (optional - only needed for file browser)
try:
    import tkinter as tk
    from tkinter import filedialog, messagebox
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

# Try to import pyaudio for microphone input
try:
    import pyaudio
    HAS_PYAUDIO = True
except ImportError:
    HAS_PYAUDIO = False
    print("Warning: pyaudio not available. Install with: pip install pyaudio")
    print("Microphone input will be disabled.")

# Try to import pygame.midi for MIDI support
try:
    import pygame.midi
    HAS_MIDI = True
except ImportError:
    HAS_MIDI = False
    print("Warning: pygame.midi not available. MIDI input will be disabled.")

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class EYESYSimulator:
    """Simulates the EYESY hardware environment"""
    
    def __init__(self, screen_width=1280, screen_height=720):
        self.xres = screen_width
        self.yres = screen_height
        
        # Knob values (0.0 to 1.0)
        self.knob1 = 0.5
        self.knob2 = 0.5
        self.knob3 = 0.5
        self.knob4 = 0.5  # Foreground color
        self.knob5 = 0.5  # Background color
        
        # Button states
        self.button1 = False
        self.button2 = False
        self.button3 = False
        self.button4 = False
        
        # Shift button state
        self.shift = False
        
        # Audio input gain (controlled by Shift + Knob 1)
        # Range: 0.0 to 2.0+ (default 1.0 = normal gain)
        self.audio_gain = 1.0
        
        # Trigger state
        self.trig = False
        
        # Audio input (simulated or real)
        self._audio_time = 0.0
        self._audio_file = None
        self._beat_time = 0.0
        self._pattern_time = 0.0
        # Initialize audio_in with some default values so modes don't crash
        self.audio_in = []
        self.audio_in_r = []  # Right audio channel
        # Generate initial audio samples
        self.audio_in = self.generate_audio_samples()
        self.audio_in_r = self.audio_in.copy()
        
        # Real audio input (microphone)
        self.use_microphone = False
        self._audio_stream = None
        self._audio_queue = queue.Queue()
        self._audio_thread = None
        self._audio_buffer = []
        
        # Settings
        self.auto_clear = True  # True = persist mode, False = clear each frame
        
        # Mode root (will be set when mode is loaded)
        self.mode_root = ""
        self.mode = ""  # Current mode name
        
        # Color picker state
        self._color_lfo_time = 0.0
        
        # Background color (stored when color_picker_bg is called)
        # Initialize with default background color based on knob5
        default_bg = self.color_picker(self.knob5)
        self.bg_color = [default_bg[0], default_bg[1], default_bg[2]]
        
        # MIDI support
        self.midi_notes = [False] * 128  # List of 128 MIDI notes (on/off)
        self.midi_note_new = False  # New MIDI note received this frame
        
        # Legacy audio_trig attribute for backward compatibility
        # This mirrors trig but is specifically for audio-based triggers
        # In the current API, trig can be from audio, MIDI, or button
        self._audio_trig = False
        self.audio_trig = False  # Initialize as public attribute
        
    def set_mode_root(self, path):
        """Set the root path for the current mode"""
        self.mode_root = str(path)
    
    def generate_audio_samples(self, num_samples=200):
        """Generate simulated audio samples with dynamic patterns"""
        if self._audio_file:
            return self._audio_file
        else:
            samples = []
            self._beat_time += 0.016
            self._pattern_time += 0.016
            
            beat_phase = (self._beat_time % 0.5) / 0.5
            beat_envelope = 1.0
            if beat_phase < 0.1:
                beat_envelope = 1.0 - (beat_phase / 0.1)
            else:
                beat_envelope = max(0.1, 1.0 - (beat_phase - 0.1) * 2.0)
            
            pattern_phase = (self._pattern_time % 2.0) / 2.0
            
            for i in range(num_samples):
                t = self._audio_time + (i / num_samples) * 0.01
                base_freq = 220 + math.sin(self._pattern_time * 0.5) * 100
                
                sample = (
                    math.sin(t * base_freq) * 0.4 * beat_envelope +
                    math.sin(t * base_freq * 2) * 0.25 * beat_envelope +
                    math.sin(t * base_freq * 3) * 0.15 * beat_envelope +
                    math.sin(t * base_freq * 0.5) * 0.2 * beat_envelope
                )
                sample += math.sin(t * base_freq * 4) * 0.1 * beat_envelope * 0.5
                sample += math.sin(t * base_freq * 5) * 0.05 * beat_envelope * 0.5
                sample += (np.random.random() - 0.5) * 0.15 * beat_envelope
                
                if pattern_phase > 0.3 and pattern_phase < 0.35:
                    sample += math.sin(t * base_freq * 8) * 0.3 * beat_envelope
                
                amplitude_mod = 0.7 + 0.3 * math.sin(self._pattern_time * 0.3)
                sample *= amplitude_mod
                samples.append(int(sample * 32768))
            
            self._audio_time += 0.01
            return samples
    
    def update_audio(self):
        """Update audio input array with gain control"""
        # Reset audio_trig at start of each frame (will be set if audio exceeds threshold)
        self._audio_trig = False
        
        if self.use_microphone:
            # Use real microphone input
            # Get latest samples from buffer
            num_samples_needed = 200  # Standard number of samples for EYESY
            raw_audio = None
            
            if len(self._audio_buffer) >= num_samples_needed:
                # Take the most recent samples
                raw_audio = self._audio_buffer[-num_samples_needed:].copy()
            elif len(self._audio_buffer) > 0:
                # Use whatever samples we have, pad with last sample if needed
                raw_audio = self._audio_buffer.copy()
                if len(raw_audio) < num_samples_needed:
                    # Pad with the last sample value to reach desired length
                    last_sample = raw_audio[-1] if raw_audio else 0
                    raw_audio.extend([last_sample] * (num_samples_needed - len(raw_audio)))
            
            if raw_audio is not None:
                # Apply stored audio gain (controlled by Shift + Knob 1)
                # Apply gain to audio samples
                self.audio_in = [int(sample * self.audio_gain) for sample in raw_audio]
                # Clamp to valid range
                self.audio_in = [max(-32768, min(32767, s)) for s in self.audio_in]
                
                # For stereo, duplicate left channel
                self.audio_in_r = self.audio_in.copy()
            else:
                # Buffer is empty, use simulated audio temporarily until mic data arrives
                self.audio_in = self.generate_audio_samples()
                self.audio_in_r = self.audio_in.copy()
        else:
            # Use simulated audio
            self.audio_in = self.generate_audio_samples()
            # Right channel is same as left for simulation (stereo would require separate generation)
            self.audio_in_r = self.audio_in.copy()
        
        # Check if audio exceeds threshold for audio_trig (approximately -5dB or 80% of max)
        # Threshold is around 26214 (80% of 32768)
        # This works for both real and simulated audio
        if len(self.audio_in) > 0:
            audio_peak = max([abs(s) for s in self.audio_in])
            if audio_peak > 26214:
                self._audio_trig = True
        
        # Add audio_trig as a property-like attribute for backward compatibility
        # This allows modes to access it as eyesy.audio_trig or etc.audio_trig
        self.audio_trig = self._audio_trig
    
    def start_microphone(self):
        """Start capturing audio from microphone"""
        if not HAS_PYAUDIO:
            print("pyaudio not available. Cannot use microphone.")
            return False
        
        if self.use_microphone:
            return True  # Already started
        
        try:
            self._pyaudio_instance = pyaudio.PyAudio()
            
            # Audio settings
            CHUNK = 1024
            FORMAT = pyaudio.paInt16
            CHANNELS = 1  # Mono input
            RATE = 44100
            
            # Create callback wrapper that has access to self
            def audio_callback_wrapper(in_data, frame_count, time_info, status):
                return self._audio_callback(in_data, frame_count, time_info, status)
            
            stream = self._pyaudio_instance.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK,
                stream_callback=audio_callback_wrapper
            )
            
            self._audio_stream_instance = stream
            stream.start_stream()
            self.use_microphone = True
            print("Microphone input enabled")
            return True
        except Exception as e:
            print(f"Error starting microphone: {e}")
            self.use_microphone = False
            if hasattr(self, '_pyaudio_instance'):
                try:
                    self._pyaudio_instance.terminate()
                except:
                    pass
            return False
    
    def stop_microphone(self):
        """Stop capturing audio from microphone"""
        if hasattr(self, '_audio_stream_instance') and self._audio_stream_instance:
            try:
                self._audio_stream_instance.stop_stream()
                self._audio_stream_instance.close()
            except:
                pass
        if hasattr(self, '_pyaudio_instance') and self._pyaudio_instance:
            try:
                self._pyaudio_instance.terminate()
            except:
                pass
        self.use_microphone = False
        self._audio_buffer = []
        print("Microphone input disabled")
    
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """Callback for audio stream - called by pyaudio"""
        try:
            # Convert bytes to numpy array of int16 samples
            audio_data = np.frombuffer(in_data, dtype=np.int16)
            # Add to queue for processing in main thread
            self._audio_queue.put(audio_data)
        except:
            pass
        return (None, pyaudio.paContinue)
    
    def color_picker(self, knob):
        """Convert knob value (0-1) to RGB color"""
        hue = knob * 360.0
        h = hue / 60.0
        i = int(h)
        f = h - i
        p = 0
        q = 1 - f
        t = f
        
        if i == 0:
            r, g, b = 1, t, p
        elif i == 1:
            r, g, b = q, 1, p
        elif i == 2:
            r, g, b = p, 1, t
        elif i == 3:
            r, g, b = p, q, 1
        elif i == 4:
            r, g, b = t, p, 1
        else:
            r, g, b = 1, p, q
        
        return (int(r * 255), int(g * 255), int(b * 255))
    
    def color_picker_lfo(self, knob, max_rate=0.1):
        """Color picker with LFO animation"""
        if knob < 0.5:
            base_hue = knob * 2.0 * 360.0
            hue = base_hue
        else:
            base_hue = 360.0
            lfo_rate = (knob - 0.5) * 2.0 * max_rate
            hue = (base_hue + math.sin(self._color_lfo_time * lfo_rate * 10) * 30) % 360
        
        h = hue / 60.0
        i = int(h)
        f = h - i
        p = 0
        q = 1 - f
        t = f
        
        if i == 0:
            r, g, b = 1, t, p
        elif i == 1:
            r, g, b = q, 1, p
        elif i == 2:
            r, g, b = p, 1, t
        elif i == 3:
            r, g, b = p, q, 1
        elif i == 4:
            r, g, b = t, p, 1
        else:
            r, g, b = 1, p, q
        
        self._color_lfo_time += 0.016
        return (int(r * 255), int(g * 255), int(b * 255))
    
    def color_picker_bg(self, knob):
        """Set background color based on knob value"""
        color = self.color_picker(knob)
        # Store background color for modes that access eyesy.bg_color
        self.bg_color = [color[0], color[1], color[2]]
        return color


class EYESYRunner:
    """Main application to run EYESY modes"""
    
    def __init__(self, mode_path: Optional[str] = None):
        pygame.init()
        
        self.screen_width = 1280
        self.screen_height = 720
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        pygame.display.set_caption("EYESY Script Runner")
        
        self.clock = pygame.time.Clock()
        self.fps = 60
        
        self.eyesy = EYESYSimulator(self.screen_width, self.screen_height)
        
        self.setup_func = None
        self.draw_func = None
        self.mode_path = mode_path
        
        self.show_controls = True
        self.font = pygame.font.Font(None, 24)
        
        self.auto_trigger_enabled = False
        self.auto_trigger_timer = 0.0
        self.auto_trigger_interval = 1.0
        self.auto_trigger_active = False
        
        self.paused = False
        self.paused_screen = None  # Store frozen frame when paused
        
        self.screenshot_dir = project_root / "screenshots"
        self.screenshot_dir.mkdir(exist_ok=True)
        self.screenshot_counter = 0
        self.screenshot_message_timer = 0.0
        self.screenshot_message = None
        self.take_screenshot_flag = False
        
        # Audio/MIDI input settings
        self.microphone_enabled = False
        self.midi_enabled = False
        self.midi_input = None
        self.midi_device_id = None
        
        # Initialize MIDI if available
        if HAS_MIDI:
            try:
                pygame.midi.init()
                self.midi_available = True
            except:
                self.midi_available = False
                print("Warning: Could not initialize pygame.midi")
        else:
            self.midi_available = False
        
        # Mode switching
        self.available_modes = []
        self.current_mode_index = -1
        self.scan_available_modes()
        
        if mode_path:
            self.load_mode(mode_path)
        else:
            self.select_mode()
    
    def list_midi_devices(self):
        """List available MIDI input devices"""
        if not self.midi_available:
            return []
        
        devices = []
        for i in range(pygame.midi.get_count()):
            info = pygame.midi.get_device_info(i)
            if info[2] == 1:  # Input device
                devices.append((i, info[1].decode('utf-8')))
        return devices
    
    def start_midi(self, device_id=None):
        """Start MIDI input from specified device or first available"""
        if not self.midi_available:
            print("MIDI not available")
            return False
        
        if self.midi_enabled:
            return True  # Already started
        
        devices = self.list_midi_devices()
        if not devices:
            print("No MIDI input devices found")
            return False
        
        if device_id is None:
            # Use first available device
            device_id = devices[0][0]
            print(f"Using MIDI device: {devices[0][1]}")
        else:
            # Find device name
            device_name = "Unknown"
            for dev_id, dev_name in devices:
                if dev_id == device_id:
                    device_name = dev_name
                    break
            print(f"Using MIDI device: {device_name}")
        
        try:
            self.midi_input = pygame.midi.Input(device_id)
            self.midi_device_id = device_id
            self.midi_enabled = True
            print("MIDI input enabled")
            return True
        except Exception as e:
            print(f"Error starting MIDI: {e}")
            self.midi_enabled = False
            return False
    
    def stop_midi(self):
        """Stop MIDI input"""
        if self.midi_input:
            try:
                self.midi_input.close()
            except:
                pass
        self.midi_input = None
        self.midi_device_id = None
        self.midi_enabled = False
        print("MIDI input disabled")
    
    def process_midi_events(self):
        """Process MIDI events from input device"""
        if not self.midi_enabled or not self.midi_input:
            return
        
        if self.midi_input.poll():
            midi_events = self.midi_input.read(10)  # Read up to 10 events
            
            for event in midi_events:
                status = event[0][0]
                data1 = event[0][1]  # Note or CC number
                data2 = event[0][2]  # Velocity or CC value
                
                if status == 0x90 and data2 > 0:  # Note On
                    if data1 < 128:
                        self.eyesy.midi_notes[data1] = True
                        self.eyesy.midi_note_new = True
                        # Trigger on MIDI note
                        self.eyesy.trig = True
                elif status == 0x80 or (status == 0x90 and data2 == 0):  # Note Off
                    if data1 < 128:
                        self.eyesy.midi_notes[data1] = False
                elif status == 0xB0:  # Control Change
                    cc_value = data2 / 127.0  # Normalize to 0-1
                    # Map common CCs to knobs (EYESY default mapping)
                    if data1 == 21:
                        self.eyesy.knob1 = cc_value
                    elif data1 == 22:
                        self.eyesy.knob2 = cc_value
                    elif data1 == 23:
                        self.eyesy.knob3 = cc_value
                    elif data1 == 24:
                        self.eyesy.knob4 = cc_value
                    elif data1 == 25:
                        self.eyesy.knob5 = cc_value
    
    def scan_available_modes(self):
        """Scan for available modes in examples/ and custom/ directories"""
        self.available_modes = []
        
        # Scan examples directory
        examples_dir = project_root / "examples"
        if examples_dir.exists():
            for category in ["scopes", "triggers", "utilities", "mixed"]:
                category_dir = examples_dir / category
                if category_dir.exists():
                    for mode_folder in sorted(category_dir.iterdir()):
                        if mode_folder.is_dir() and (mode_folder / "main.py").exists():
                            self.available_modes.append(str(mode_folder))
        
        # Scan custom directory
        custom_dir = project_root / "custom"
        if custom_dir.exists():
            for mode_folder in sorted(custom_dir.iterdir()):
                if mode_folder.is_dir() and (mode_folder / "main.py").exists():
                    self.available_modes.append(str(mode_folder))
        
        print(f"Found {len(self.available_modes)} available modes")
    
    def find_mode_index(self, mode_path):
        """Find the index of a mode in the available modes list"""
        mode_path_str = str(Path(mode_path).resolve())
        for i, available_mode in enumerate(self.available_modes):
            if str(Path(available_mode).resolve()) == mode_path_str:
                return i
        return -1
    
    def switch_to_next_mode(self):
        """Switch to the next mode in the list"""
        if len(self.available_modes) == 0:
            print("No modes available")
            return False
        
        if self.current_mode_index < 0:
            self.current_mode_index = 0
        else:
            self.current_mode_index = (self.current_mode_index + 1) % len(self.available_modes)
        
        mode_path = self.available_modes[self.current_mode_index]
        print(f"Switching to mode {self.current_mode_index + 1}/{len(self.available_modes)}: {Path(mode_path).name}")
        return self.load_mode(mode_path)
    
    def switch_to_previous_mode(self):
        """Switch to the previous mode in the list"""
        if len(self.available_modes) == 0:
            print("No modes available")
            return False
        
        if self.current_mode_index < 0:
            self.current_mode_index = len(self.available_modes) - 1
        else:
            self.current_mode_index = (self.current_mode_index - 1) % len(self.available_modes)
        
        mode_path = self.available_modes[self.current_mode_index]
        print(f"Switching to mode {self.current_mode_index + 1}/{len(self.available_modes)}: {Path(mode_path).name}")
        return self.load_mode(mode_path)
    
    def select_mode(self):
        """Open file dialog to select a mode"""
        if not HAS_TKINTER:
            # If no tkinter, try to load first available mode
            if len(self.available_modes) > 0:
                print("No tkinter available. Loading first available mode.")
                self.current_mode_index = 0
                self.load_mode(self.available_modes[0])
                return
            else:
                print("Error: tkinter is not available and no modes found.")
                print("Usage: python tools/eyesy_runner.py <mode_path>")
                print(f"Example: python tools/eyesy_runner.py 'examples/scopes/S - Classic Horizontal'")
                sys.exit(1)
        
        root = tk.Tk()
        root.withdraw()
        
        mode_path = filedialog.askdirectory(
            title="Select EYESY Mode Folder",
            initialdir=str(project_root)
        )
        
        if mode_path:
            self.load_mode(mode_path)
        else:
            # If no mode selected but we have available modes, load first one
            if len(self.available_modes) > 0:
                print("No mode selected. Loading first available mode.")
                self.current_mode_index = 0
                self.load_mode(self.available_modes[0])
            else:
                print("No mode selected. Exiting.")
                sys.exit(0)
    
    def load_mode(self, mode_path):
        """Load an EYESY mode from a directory"""
        mode_path = Path(mode_path)
        main_py = mode_path / "main.py"
        
        if not main_py.exists():
            error_msg = f"main.py not found in {mode_path}"
            print(f"Error: {error_msg}")
            if HAS_TKINTER:
                messagebox.showerror("Error", error_msg)
            return False
        
        try:
            spec = importlib.util.spec_from_file_location("eyesy_mode", main_py)
            module = importlib.util.module_from_spec(spec)
            
            self.eyesy.set_mode_root(mode_path)
            # Ensure audio_trig is initialized before loading module
            self.eyesy.audio_trig = False
            self.eyesy._audio_trig = False
            spec.loader.exec_module(module)
            
            if not hasattr(module, 'setup'):
                raise AttributeError("Mode must have a setup() function")
            if not hasattr(module, 'draw'):
                raise AttributeError("Mode must have a draw() function")
            
            self.setup_func = module.setup
            self.draw_func = module.draw
            self.mode_path = str(mode_path)
            
            # Set mode name for eyesy.mode API
            self.eyesy.mode = mode_path.name
            
            # Update current mode index
            self.current_mode_index = self.find_mode_index(mode_path)
            
            # Initialize audio before setup (ensures audio_trig is available)
            self.eyesy.update_audio()
            
            self.setup_func(self.screen, self.eyesy)
            
            print(f"Loaded mode: {mode_path.name}")
            return True
            
        except Exception as e:
            error_msg = f"Error loading mode:\n{str(e)}"
            print(error_msg)
            if HAS_TKINTER:
                messagebox.showerror("Error", error_msg)
            return False
    
    def handle_events(self):
        """Handle pygame events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                elif event.key == pygame.K_h:
                    self.show_controls = not self.show_controls
                elif event.key == pygame.K_l:
                    if self.mode_path:
                        self.load_mode(self.mode_path)
                elif event.key == pygame.K_SPACE:
                    self.eyesy.trig = not self.eyesy.trig
                elif event.key == pygame.K_c:
                    self.eyesy.auto_clear = not self.eyesy.auto_clear
                elif event.key == pygame.K_m:
                    # Toggle microphone input
                    if HAS_PYAUDIO:
                        if self.microphone_enabled:
                            self.eyesy.stop_microphone()
                            self.microphone_enabled = False
                        else:
                            if self.eyesy.start_microphone():
                                self.microphone_enabled = True
                            else:
                                print("Failed to start microphone")
                    else:
                        print("Microphone support not available (pyaudio not installed)")
                elif event.key == pygame.K_i:
                    # Toggle MIDI input
                    if self.midi_available:
                        if self.midi_enabled:
                            self.stop_midi()
                        else:
                            self.start_midi()
                    else:
                        print("MIDI support not available")
                elif event.key == pygame.K_u:
                    # Auto-trigger (old M key behavior)
                    self.auto_trigger_enabled = not self.auto_trigger_enabled
                    print(f"Auto-trigger: {'ON' if self.auto_trigger_enabled else 'OFF'}")
                elif event.key == pygame.K_p:
                    self.paused = not self.paused
                    print(f"Paused: {'ON' if self.paused else 'OFF'}")
                elif event.key == pygame.K_x:
                    self.take_screenshot_flag = True
                elif event.key == pygame.K_RIGHT or event.key == pygame.K_RETURN:
                    # Switch to next mode
                    self.switch_to_next_mode()
                elif event.key == pygame.K_LEFT or event.key == pygame.K_BACKSPACE:
                    # Switch to previous mode
                    self.switch_to_previous_mode()
            
            # MIDI events are handled separately via process_midi_events()
            
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    self.eyesy.trig = True
                elif event.button == 4:
                    mouse_x, mouse_y = pygame.mouse.get_pos()
                    if mouse_x < self.screen_width // 5:
                        self.eyesy.knob1 = min(1.0, self.eyesy.knob1 + 0.01)
                    elif mouse_x < 2 * self.screen_width // 5:
                        self.eyesy.knob2 = min(1.0, self.eyesy.knob2 + 0.01)
                    elif mouse_x < 3 * self.screen_width // 5:
                        self.eyesy.knob3 = min(1.0, self.eyesy.knob3 + 0.01)
                    elif mouse_x < 4 * self.screen_width // 5:
                        self.eyesy.knob4 = min(1.0, self.eyesy.knob4 + 0.01)
                    else:
                        self.eyesy.knob5 = min(1.0, self.eyesy.knob5 + 0.01)
                elif event.button == 5:
                    mouse_x, mouse_y = pygame.mouse.get_pos()
                    if mouse_x < self.screen_width // 5:
                        self.eyesy.knob1 = max(0.0, self.eyesy.knob1 - 0.01)
                    elif mouse_x < 2 * self.screen_width // 5:
                        self.eyesy.knob2 = max(0.0, self.eyesy.knob2 - 0.01)
                    elif mouse_x < 3 * self.screen_width // 5:
                        self.eyesy.knob3 = max(0.0, self.eyesy.knob3 - 0.01)
                    elif mouse_x < 4 * self.screen_width // 5:
                        self.eyesy.knob4 = max(0.0, self.eyesy.knob4 - 0.01)
                    else:
                        self.eyesy.knob5 = max(0.0, self.eyesy.knob5 - 0.01)
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    self.eyesy.trig = False
        
        keys = pygame.key.get_pressed()
        
        # Shift button (Left Shift or Right Shift)
        self.eyesy.shift = keys[pygame.K_LSHIFT] or keys[pygame.K_RSHIFT]
        
        # Shift + Knob 1: Audio input gain (per EYESY documentation)
        if self.eyesy.shift:
            # When shift is held, Knob 1 controls audio gain (0.0 to 2.0+)
            # Map knob1 (0.0-1.0) to gain range (0.0 to 2.0)
            self.eyesy.audio_gain = self.eyesy.knob1 * 2.0
        
        if keys[pygame.K_q]:
            self.eyesy.knob1 = min(1.0, self.eyesy.knob1 + 0.01)
        if keys[pygame.K_a]:
            self.eyesy.knob1 = max(0.0, self.eyesy.knob1 - 0.01)
        
        if keys[pygame.K_w]:
            self.eyesy.knob2 = min(1.0, self.eyesy.knob2 + 0.01)
        if keys[pygame.K_s]:
            self.eyesy.knob2 = max(0.0, self.eyesy.knob2 - 0.01)
        
        if keys[pygame.K_e]:
            self.eyesy.knob3 = min(1.0, self.eyesy.knob3 + 0.01)
        if keys[pygame.K_d]:
            self.eyesy.knob3 = max(0.0, self.eyesy.knob3 - 0.01)
        
        if keys[pygame.K_r]:
            self.eyesy.knob4 = min(1.0, self.eyesy.knob4 + 0.01)
        if keys[pygame.K_f]:
            self.eyesy.knob4 = max(0.0, self.eyesy.knob4 - 0.01)
        
        if keys[pygame.K_t]:
            self.eyesy.knob5 = min(1.0, self.eyesy.knob5 + 0.01)
        if keys[pygame.K_g]:
            self.eyesy.knob5 = max(0.0, self.eyesy.knob5 - 0.01)
        
        # Process audio queue from microphone
        if self.microphone_enabled:
            try:
                while True:
                    try:
                        audio_data = self.eyesy._audio_queue.get_nowait()
                        # Convert to list of int16 values and add to buffer
                        self.eyesy._audio_buffer.extend(audio_data.tolist())
                        # Keep buffer size reasonable (last 1000 samples)
                        if len(self.eyesy._audio_buffer) > 1000:
                            self.eyesy._audio_buffer = self.eyesy._audio_buffer[-1000:]
                    except queue.Empty:
                        break
            except:
                pass
        
        # Process MIDI events
        self.process_midi_events()
        
        # Reset MIDI note new flag after processing
        self.eyesy.midi_note_new = False
        
        return True
    
    def take_screenshot(self):
        """Capture a screenshot of the current screen (without controls overlay)"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.screenshot_dir / f"eyesy_snapshot_{timestamp}.png"
        
        pygame.image.save(self.screen, str(filename))
        
        self.screenshot_counter += 1
        self.screenshot_message = f"Screenshot saved: {filename.name}"
        self.screenshot_message_timer = 2.0
        print(f"Screenshot saved: {filename}")
    
    def draw_controls(self):
        """Draw control panel overlay"""
        if not self.show_controls:
            return
        
        overlay = pygame.Surface((300, 280))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (10, 10))
        
        y_offset = 20
        line_height = 25
        
        title = self.font.render("EYESY Runner Controls", True, (255, 255, 255))
        self.screen.blit(title, (20, y_offset))
        y_offset += line_height + 5
        
        # Show current mode
        if self.mode_path and self.current_mode_index >= 0:
            mode_name = Path(self.mode_path).name
            mode_text = f"Mode: {mode_name} ({self.current_mode_index + 1}/{len(self.available_modes)})"
            mode_rendered = self.font.render(mode_text, True, (100, 255, 100))
            self.screen.blit(mode_rendered, (20, y_offset))
            y_offset += line_height + 2
        
        controls = [
            ("Knob 1: Q/A", self.eyesy.knob1),
            ("Knob 2: W/S", self.eyesy.knob2),
            ("Knob 3: E/D", self.eyesy.knob3),
            ("Color: R/F", self.eyesy.knob4),
            ("BG Color: T/G", self.eyesy.knob5),
        ]
        
        # Show audio gain info if shift is held and microphone is enabled
        if self.eyesy.shift and self.microphone_enabled:
            gain_text = f"Audio Gain: {self.eyesy.audio_gain:.2f}x (Shift+Knob1)"
            gain_rendered = self.font.render(gain_text, True, (100, 255, 255))
            self.screen.blit(gain_rendered, (20, y_offset + len(controls) * line_height + 10))
        
        # Show shift state
        shift_text = "SHIFT: " + ("ON" if self.eyesy.shift else "OFF")
        shift_color = (255, 200, 100) if self.eyesy.shift else (150, 150, 150)
        shift_rendered = self.font.render(shift_text, True, shift_color)
        self.screen.blit(shift_rendered, (20, y_offset))
        y_offset += line_height
        
        for label, value in controls:
            text = f"{label}: {value:.2f}"
            rendered = self.font.render(text, True, (255, 255, 255))
            self.screen.blit(rendered, (20, y_offset))
            y_offset += line_height
        
        y_offset += 5
        other_controls = [
            ("SPACE: Toggle Trigger", self.eyesy.trig),
            ("U: Auto-Trigger", self.auto_trigger_enabled),
            ("M: Toggle Mic", self.microphone_enabled),
            ("I: Toggle MIDI", self.midi_enabled),
            ("P: Pause/Snapshot", self.paused),
            ("X: Screenshot", None),
            ("C: Auto Clear", self.eyesy.auto_clear),
            ("H: Hide Controls", None),
            ("L: Reload", None),
            ("←/→: Switch Mode", None),
            ("ESC: Exit", None),
        ]
        
        for label, state in other_controls:
            if state is not None:
                text = f"{label}: {'ON' if state else 'OFF'}"
            else:
                text = label
            rendered = self.font.render(text, True, (200, 200, 200))
            self.screen.blit(rendered, (20, y_offset))
            y_offset += line_height
    
    def run(self):
        """Main run loop"""
        if not self.setup_func or not self.draw_func:
            print("No mode loaded. Exiting.")
            return
        
        running = True
        
        print("\n=== EYESY Script Runner ===")
        print("Controls:")
        print("  Q/A - Knob 1")
        print("  W/S - Knob 2")
        print("  E/D - Knob 3")
        print("  R/F - Color (Knob 4)")
        print("  T/G - BG Color (Knob 5)")
        print("  SHIFT + Q/A - Audio Input Gain (when mic enabled)")
        print("  SPACE - Toggle Trigger")
        print("  M - Toggle Microphone Input")
        print("  I - Toggle MIDI Input")
        print("  U - Toggle Auto-Trigger (MIDI simulation)")
        print("  P - Pause/Snapshot (freeze current frame)")
        print("  X - Take Screenshot (saves to screenshots/ folder)")
        print("  C - Toggle Auto Clear")
        print("  H - Hide/Show Controls")
        print("  L - Reload Mode")
        print("  ←/→ or ENTER/BACKSPACE - Switch Between Modes")
        print("  ESC - Exit")
        print(f"\nFound {len(self.available_modes)} available modes")
        if HAS_PYAUDIO:
            print("Microphone input available - Press M to enable")
        if self.midi_available:
            devices = self.list_midi_devices()
            if devices:
                print(f"MIDI input available ({len(devices)} device(s)) - Press I to enable")
            else:
                print("MIDI input available but no devices found")
        if not HAS_PYAUDIO and not self.midi_available:
            print("Note: Audio is automatically simulated with dynamic patterns!")
        print("===========================\n")
        
        while running:
            running = self.handle_events()
            
            if not self.paused:
                self.eyesy.update_audio()
                
                # Reset MIDI note new flag at start of each frame
                self.eyesy.midi_note_new = False
                
                if self.auto_trigger_enabled:
                    dt = self.clock.get_time() / 1000.0
                    self.auto_trigger_timer += dt
                    
                    if not self.auto_trigger_active:
                        if self.auto_trigger_timer >= self.auto_trigger_interval:
                            self.eyesy.trig = True
                            self.auto_trigger_active = True
                            self.auto_trigger_timer = 0.0
                            self.auto_trigger_interval = 0.5 + np.random.random() * 1.5
                    else:
                        if self.auto_trigger_timer >= 0.1:
                            self.eyesy.trig = False
                            self.auto_trigger_active = False
                            self.auto_trigger_timer = 0.0
            else:
                self.clock.tick(self.fps)
            
            if not self.paused:
                # Only update and draw when not paused
                # When auto_clear is True, clear screen before drawing (normal mode)
                # When auto_clear is False, don't clear (persist mode)
                # Use the bg_color that was set in the previous frame's draw() call
                if self.eyesy.auto_clear:
                    bg_color = tuple(self.eyesy.bg_color)
                    self.screen.fill(bg_color)
                
                try:
                    self.draw_func(self.screen, self.eyesy)
                    # Store the current frame for pause mode
                    self.paused_screen = self.screen.copy()
                except Exception as e:
                    print(f"Error in draw(): {e}")
                    error_text = self.font.render(f"Error: {str(e)}", True, (255, 0, 0))
                    self.screen.blit(error_text, (20, 20))
            else:
                # When paused, restore the frozen frame
                if self.paused_screen is not None:
                    self.screen.blit(self.paused_screen, (0, 0))
                else:
                    # If we paused before first draw, draw once
                    if self.eyesy.auto_clear:
                        bg_color = self.eyesy.color_picker_bg(self.eyesy.knob5)
                        self.screen.fill(bg_color)
                    try:
                        self.draw_func(self.screen, self.eyesy)
                        self.paused_screen = self.screen.copy()
                    except Exception as e:
                        print(f"Error in draw(): {e}")
                        error_text = self.font.render(f"Error: {str(e)}", True, (255, 0, 0))
                        self.screen.blit(error_text, (20, 20))
            
            if self.take_screenshot_flag:
                self.take_screenshot()
                self.take_screenshot_flag = False
            
            self.draw_controls()
            
            if self.paused:
                pause_text = self.font.render("PAUSED (Snapshot Mode)", True, (255, 255, 0))
                text_rect = pause_text.get_rect(center=(self.screen_width // 2, 30))
                bg_rect = text_rect.inflate(20, 10)
                pause_bg = pygame.Surface((bg_rect.width, bg_rect.height))
                pause_bg.set_alpha(200)
                pause_bg.fill((0, 0, 0))
                self.screen.blit(pause_bg, bg_rect)
                self.screen.blit(pause_text, text_rect)
            
            if self.screenshot_message_timer > 0:
                self.screenshot_message_timer -= self.clock.get_time() / 1000.0
                if self.screenshot_message:
                    msg_text = self.font.render(self.screenshot_message, True, (0, 255, 0))
                    msg_rect = msg_text.get_rect(center=(self.screen_width // 2, self.screen_height - 50))
                    msg_bg_rect = msg_rect.inflate(20, 10)
                    msg_bg = pygame.Surface((msg_bg_rect.width, msg_bg_rect.height))
                    msg_bg.set_alpha(200)
                    msg_bg.fill((0, 0, 0))
                    self.screen.blit(msg_bg, msg_bg_rect)
                    self.screen.blit(msg_text, msg_rect)
                if self.screenshot_message_timer <= 0:
                    self.screenshot_message = None
            
            pygame.display.flip()
            
            if not self.paused:
                self.clock.tick(self.fps)
        
        # Cleanup
        if self.microphone_enabled:
            self.eyesy.stop_microphone()
        if self.midi_enabled:
            self.stop_midi()
        if self.midi_available:
            try:
                pygame.midi.quit()
            except:
                pass
        
        pygame.quit()


def main():
    """Entry point"""
    mode_path = sys.argv[1] if len(sys.argv) > 1 else None
    runner = EYESYRunner(mode_path)
    runner.run()


if __name__ == "__main__":
    main()
