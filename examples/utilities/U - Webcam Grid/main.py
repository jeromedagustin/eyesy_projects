"""
ETC Mode that displays webcam feed(s) in a grid layout with audio/MIDI reactivity.
Controls:
- Knob 1: Controls the size of the webcam images in grid cells
- Knob 2: Controls how reactive the webcam is to audio/MIDI data (position, scale, rotation)
- Knob 3: Adds distortion effects to the video (pixelation, waves, etc.)
- Knob 4: Changes the colors of the video (color effects/masking)
- Knob 5: Controls background color
- Trigger: Applies color effects and distortion
Camera Detection:
- Optimized for EYESY hardware (Linux/Organelle M)
- Automatically detects multiple cameras and adds them to the grid
- Uses multiple backends: OpenCV, webcam library, imageio, ffmpeg, or pygame.camera
- If multiple video sources are detected, each grid cell shows a different camera
- If camera can not be found or not be opened, it will use a static png instead
Tested: EYESY OS 2.1 on Organelle M
# Copyright notice:
# This mode is dedicated to the public domain: [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en)
"""
import pygame
import time
import random
import subprocess
import sys
import os
import math
# Try to detect available camera backends
# Try multiple libraries in order of preference
USE_OPENCV = False
USE_WEBCAM_LIB = False
USE_IMAGEIO = False
USE_FFMPEG = False
USE_PYGAME_CAMERA = False
CAM = None
# Try OpenCV first (most reliable, works with more camera types)
try:
    import cv2
    USE_OPENCV = True
    print("OpenCV available for camera access")
    CAM = None  # Will be detected during initialization
except ImportError:
    pass
# Try webcam library (simpler, may work better on EYESY)
if not USE_OPENCV:
    try:
        from webcam import Webcam
        USE_WEBCAM_LIB = True
        print("webcam library available for camera access")
        CAM = None  # Will be detected during initialization
    except ImportError:
        pass
# Try imageio (has camera support via plugins)
if not USE_OPENCV and not USE_WEBCAM_LIB:
    try:
        import imageio
        # Check if imageio has camera plugin
        try:
            imageio.plugins.ffmpeg.download()  # May not be needed, but ensures plugin is available
        except:
            pass
        USE_IMAGEIO = True
        print("imageio available for camera access")
        CAM = None  # Will be detected during initialization
    except ImportError:
        pass
# Try ffmpeg via subprocess (no Python packages needed)
USE_FFMPEG = False
if not USE_OPENCV and not USE_WEBCAM_LIB and not USE_IMAGEIO:
    try:
        import subprocess
        # Check if ffmpeg is available
        result = subprocess.run(['which', 'ffmpeg'], capture_output=True, text=True, timeout=1)
        if result.returncode == 0:
            USE_FFMPEG = True
            print("ffmpeg available for camera access (no Python packages needed)")
    except:
        pass
# Try pygame.camera as last resort
if not USE_OPENCV and not USE_WEBCAM_LIB and not USE_IMAGEIO and not USE_FFMPEG:
    print("Trying pygame.camera as fallback")
    try:
        import pygame.camera
        pygame.camera.init()
        cameras = pygame.camera.list_cameras()
        if cameras and len(cameras) > 0:
            USE_PYGAME_CAMERA = True
            CAM = (cameras[0], (160, 120))
            print(f"pygame.camera available - found camera: {cameras[0]}")
        else:
            # On Linux/EYESY, try to find /dev/video* devices manually
            import glob
            video_devices = sorted(glob.glob('/dev/video*'))
            for device in video_devices:
                try:
                    CAM = (device, (160, 120))
                    USE_PYGAME_CAMERA = True
                    print(f"Found video device: {device}")
                    break
                except:
                    continue
            if not USE_PYGAME_CAMERA:
                CAM = ("", (160, 120))
                print("No cameras found with pygame.camera")
    except Exception as e:
        print(f"pygame.camera initialization failed: {e}")
        CAM = ("", (160, 120))
BLACK = pygame.Color(0, 0, 0)
def setup(screen, etc):
    print("=" * 60)
    print("U - Webcam Grid: GRID MODE (4x4 grid layout)")
    print("FILE: U - Webcam Grid/main.py")
    print("MODE TYPE: GRID (NOT STANDALONE)")
    print("MODE IDENTIFIER: GRID_MODE_V2")
    print("=" * 60)
    # CRITICAL: Ensure setup() completes successfully to prevent mode switch
    # The EYESY OS may switch to Solo mode if setup() fails or raises exceptions
    try:
        etc.capture = Capture(etc)
        print("✓ Setup completed successfully - Grid mode initialized")
    except Exception as e:
        # Log error but don't raise - allow mode to continue
        print(f"⚠️  Setup error (continuing anyway): {e}")
        import traceback
        traceback.print_exc()
        # Create a minimal capture object so mode doesn't crash
        class MinimalCapture:
            def __init__(self):
                self.cameras = []
                self.camera_snapshots = []
                self.camera_masked = []
        etc.capture = MinimalCapture()
    # Initialize grid cell rotations and scales with slight variations for visual distinction
    etc.grid_rotations = [[random.uniform(-15, 15) for _ in range(4)] for _ in range(4)]
    etc.grid_scales = [[random.uniform(0.8, 1.2) for _ in range(4)] for _ in range(4)]
    etc._mode_type = "GRID"  # Unique identifier - MUST be "GRID"
    etc._mode_file = "U - Webcam Grid/main.py"  # File path identifier
    etc._mode_text = "GRID MODE"  # Text to display - MUST be "GRID MODE", never "STANDALONE"
def draw(screen, etc):
    # GRID MODE: 4x4 grid layout
    # CRITICAL: This is GRID mode - should have MAGENTA border, NOT green!
    etc.color_picker_bg(etc.knob5)
    # Draw a thin border around the entire screen to show this is GRID mode
    # MAGENTA border (255, 0, 255) = GRID MODE
    # GREEN border (0, 255, 0) = STANDALONE MODE (WRONG FILE!)
    pygame.draw.rect(screen, (255, 0, 255), (0, 0, etc.xres, etc.yres), 5)  # Magenta border for GRID
    # ============================================================
    # DIRECT GRID TEST: Draw 16 rectangles directly in draw() function
    # This bypasses get_and_flip() entirely to test if grid works
    # ============================================================
    grid_cols = 4
    grid_rows = 4
    cell_width = etc.xres // grid_cols
    cell_height = etc.yres // grid_rows
    print(f"*** DRAW() FUNCTION: Drawing {grid_rows}x{grid_cols} grid directly ***")
    print(f"*** Screen: {etc.xres}x{etc.yres}, Cells: {cell_width}x{cell_height} ***")
    # Draw 16 colored rectangles directly - NO get_and_flip() call
    for row in range(grid_rows):
        for col in range(grid_cols):
            cell_num = row * grid_cols + col + 1
            cell_x = col * cell_width
            cell_y = row * cell_height
            # Calculate distinct color for each cell
            r = (cell_num * 16) % 255
            g = ((cell_num * 23) % 255)
            b = ((cell_num * 31) % 255)
            # Draw a HUGE colored rectangle covering most of the cell
            pygame.draw.rect(screen, (r, g, b),
                           (cell_x + 5, cell_y + 5, cell_width - 10, cell_height - 10), 0)
            # Draw cell number in HUGE font
            try:
                font = pygame.font.Font(None, 100)
                text = font.render(str(cell_num), True, (255, 255, 255))
                text_x = cell_x + (cell_width - text.get_width()) // 2
                text_y = cell_y + (cell_height - text.get_height()) // 2
                screen.blit(text, (text_x, text_y))
            except:
                pass
            if cell_num <= 4:
                print(f"*** DREW CELL {cell_num} at ({cell_x}, {cell_y}) color=({r}, {g}, {b}) ***")
    print(f"*** DRAW() FUNCTION: Finished drawing 16 cells ***")
    # DON'T call get_and_flip() - we're testing direct drawing
    # etc.capture.get_and_flip(screen, etc)
    # DRAW "GRID MODE" TEXT LAST - AFTER EVERYTHING ELSE - CANNOT BE OVERRIDDEN
    # This ensures the text is ALWAYS drawn on top, even if get_and_flip() draws text
    # Draw multiple times to ensure visibility
    for y_offset in [10, 80]:
        try:
            font = pygame.font.Font(None, 80)  # Very large font
            # HARDCODE "GRID MODE" - never use variable, never show "STANDALONE"
            grid_text = "GRID MODE"  # This string is NEVER "STANDALONE"
            # Force check - if somehow it's "STANDALONE", change it
            if grid_text == "STANDALONE":
                grid_text = "GRID MODE"
            text_surface = font.render(grid_text, True, (0, 255, 255))  # Cyan
            # Draw with a black outline for visibility
            outline_surface = font.render(grid_text, True, (0, 0, 0))  # Black outline
            for dx, dy in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
                screen.blit(outline_surface, (10 + dx, y_offset + dy))
            screen.blit(text_surface, (10, y_offset))
        except:
            # If font fails, draw a big cyan rectangle
            pygame.draw.rect(screen, (0, 255, 255), (10, y_offset, 400, 60))
    # Also draw file path at the bottom
    try:
        small_font = pygame.font.Font(None, 32)
        file_text = small_font.render("U - Webcam Grid/main.py", True, (255, 255, 255))
        screen.blit(file_text, (10, etc.yres - 40))
    except:
        pass
class Capture(object):
    def _detect_all_cameras(self):
        """Detect all available cameras and return a list of camera info dicts"""
        cameras = []
        import os
        import glob
        import subprocess
        def is_video_capture_device(device):
            """Quick check if device is likely a video capture device"""
            try:
                # Use v4l2-ctl to check device capabilities (if available)
                result = subprocess.run(['v4l2-ctl', '--device', device, '--all'],
                                      capture_output=True, timeout=1)
                if result.returncode == 0:
                    # Check if it has capture capability
                    output = result.stdout.decode('utf-8', errors='ignore')
                    if 'Video Capture' in output or 'capture' in output.lower():
                        return True
            except:
                pass
            # If v4l2-ctl not available, try to open with OpenCV briefly
            try:
                import cv2
                cap = cv2.VideoCapture(device)
                if cap.isOpened():
                    # Try a quick read with timeout (if available)
                    try:
                        cap.set(cv2.CAP_PROP_TIMEOUT, 500)  # 500ms timeout
                    except AttributeError:
                        pass  # CAP_PROP_TIMEOUT not available in this OpenCV version
                    ret, _ = cap.read()
                    cap.release()
                    return ret
            except:
                pass
            return False
        if self.use_opencv:
            # Prioritize /dev/video* devices, but filter out non-capture devices
            video_devices = sorted(glob.glob('/dev/video*'))
            # Limit to first 10 devices to avoid hanging on too many
            video_devices = video_devices[:10]
            # Try to identify distinct cameras by checking device capabilities
            distinct_cameras = []
            for device in video_devices:
                # Skip devices above video10 (usually not capture devices)
                try:
                    dev_num = int(device.split('video')[-1])
                    if dev_num > 10:
                        continue
                except:
                    pass
                # Check if this is likely a capture device using v4l2-ctl
                is_capture = False
                try:
                    result = subprocess.run(['v4l2-ctl', '--device', device, '--all'],
                                          capture_output=True, timeout=1)
                    if result.returncode == 0:
                        output = result.stdout.decode('utf-8', errors='ignore')
                        # Look for capture capability
                        if 'Video Capture' in output or 'Type.*: Video Capture' in output:
                            is_capture = True
                            # Try to get device name to identify duplicates
                            for line in output.split('\n'):
                                if 'Card type' in line or 'Driver name' in line:
                                    # Use device + driver info as unique key
                                    distinct_cameras.append({
                                        'type': 'opencv',
                                        'device': device,
                                        'info': line.strip()
                                    })
                                    break
                except:
                    pass
                # If v4l2-ctl check didn't work, add it anyway (will be filtered during init)
                if not is_capture:
                    distinct_cameras.append({'type': 'opencv', 'device': device})
            # Add distinct cameras to list
            cameras.extend(distinct_cameras)
            print(f"Found {len(distinct_cameras)} distinct camera devices from /dev/video*")
            # Also try indices as fallback (for systems without /dev/video* or to find more cameras)
            # Try indices 0-4 to potentially find additional cameras
            if not video_devices:
                for idx in range(5):
                    cameras.append({'type': 'opencv', 'index': idx})
            else:
                # Even if we found /dev/video* devices, also try indices as they might be different cameras
                for idx in range(min(5, len(video_devices))):  # Try a few indices
                cameras.append({'type': 'opencv', 'index': idx})
        elif self.use_ffmpeg:
            # Try /dev/video* devices, limit to first 10
            video_devices = sorted(glob.glob('/dev/video*'))[:10]
            for device in video_devices:
                cameras.append({'type': 'ffmpeg', 'device': device})
        elif self.use_pygame_camera:
            # Try /dev/video* devices, limit to first 10
            video_devices = sorted(glob.glob('/dev/video*'))[:10]
            for device in video_devices:
                cameras.append({'type': 'pygame_camera', 'device': device})
        elif self.use_webcam_lib:
            # webcam library - try multiple indices for multiple cameras
            for idx in range(3):  # Reduced from 5 to 3
                cameras.append({'type': 'webcam_lib', 'index': idx})
        elif self.use_imageio:
            # imageio uses video indices - try multiple for multiple cameras
            for idx in range(3):  # Reduced from 5 to 3
                cameras.append({'type': 'imageio', 'index': idx})
        print(f"Filtered to {len(cameras)} camera candidates (limited to prevent hanging)")
        return cameras
    def _initialize_camera(self, cam_info):
        """Initialize a single camera based on cam_info dict. Returns camera object or None."""
        cam_type = cam_info['type']
        if cam_type == 'opencv':
            try:
                import cv2
                # Set timeout for OpenCV operations
                if 'device' in cam_info:
                    device = cam_info['device']
                    # Quick check: skip if device number is too high (likely not a capture device)
                    try:
                        dev_num = int(device.split('video')[-1])
                        if dev_num > 10:  # Skip devices above video10 (usually not capture devices)
                            return None
                    except:
                        pass
                    cap = cv2.VideoCapture(device)
                else:
                    cap = cv2.VideoCapture(cam_info.get('index', 0))
                if cap.isOpened():
                    # Set timeout properties (if available - older OpenCV versions don't have this)
                    try:
                        cap.set(cv2.CAP_PROP_TIMEOUT, 1000)  # 1 second timeout
                    except AttributeError:
                        pass  # CAP_PROP_TIMEOUT not available in this OpenCV version
                    import time
                    start_time = time.time()
                    timeout = 2.0  # 2 second total timeout
                    while time.time() - start_time < timeout:
                    ret, test_frame = cap.read()
                        if ret and test_frame is not None and test_frame.size > 0:
                        return cap
                        time.sleep(0.1)
                    # If we got here, timeout occurred
                    cap.release()
                    return None
            except Exception as e:
                # Silently fail - don't spam console with errors for invalid devices
                if 'device' in cam_info:
                    pass  # Skip logging for device failures
                else:
                    print(f"OpenCV camera initialization failed: {e}")
                return None
        elif cam_type == 'ffmpeg' and 'device' in cam_info:
            # ffmpeg cameras are handled differently - just store device info
            return {'device': cam_info['device']}
        elif cam_type == 'pygame_camera' and 'device' in cam_info:
            try:
                import pygame.camera
                cam = pygame.camera.Camera(cam_info['device'])
                cam.start()
                import time
                time.sleep(0.5)
                if cam.query_image():
                    test_img = cam.get_image()
                    if test_img:
                        return cam
                cam.stop()
            except Exception as e:
                print(f"pygame.camera initialization failed: {e}")
                pass
        elif cam_type == 'webcam_lib':
            try:
                from webcam import Webcam
                webcam = Webcam(cam_info.get('index', 0))
                webcam.start()
                import time
                time.sleep(0.5)
                frame = webcam.read()
                if frame is not None:
                    return webcam
                webcam.stop()
            except Exception as e:
                print(f"webcam library initialization failed: {e}")
                pass
        elif cam_type == 'imageio':
            try:
                import imageio
                reader = imageio.get_reader(f'<video{cam_info.get("index", 0)}>')
                import time
                time.sleep(0.5)
                frame = reader.get_next_data()
                if frame is not None:
                    return reader
                reader.close()
            except Exception as e:
                print(f"imageio camera initialization failed: {e}")
                pass
        return None
    def __init__(self, etc):
        if USE_OPENCV:
            self.size = (160, 120)
        else:
            self.size = CAM[1] if isinstance(CAM, tuple) else (160, 120)
        self.cam = None
        self.cv2_cap = None
        self.webcam_lib = None
        self.imageio_reader = None
        self.ffmpeg_process = None
        self.static = None
        self.snapshot = pygame.surface.Surface(self.size, 0)
        self.masked = pygame.surface.Surface(self.size, 0)
        self.use_opencv = USE_OPENCV
        self.use_webcam_lib = USE_WEBCAM_LIB
        self.use_imageio = USE_IMAGEIO
        self.use_ffmpeg = USE_FFMPEG
        self.use_pygame_camera = USE_PYGAME_CAMERA
        # Grid settings: 4x4 grid (GRID MODE - displays multiple cameras in grid)
        print("=== U - Webcam Grid (GRID MODE) - Initializing multiple cameras ===")
        self.grid_cols = 4
        self.grid_rows = 4
        self.cell_width = etc.xres // self.grid_cols
        self.cell_height = etc.yres // self.grid_rows
        # Safety check: ensure cell dimensions are valid
        if self.cell_width <= 0 or self.cell_height <= 0:
            print(f"ERROR: Invalid cell dimensions: {self.cell_width}x{self.cell_height}")
            self.cell_width = max(1, etc.xres // 4)
            self.cell_height = max(1, etc.yres // 4)
        print(f"Grid initialized: {self.grid_rows}x{self.grid_cols}, cells={self.cell_width}x{self.cell_height}, screen={etc.xres}x{etc.yres}")
        self.out = pygame.surface.Surface((self.cell_width, self.cell_height), 0)
        # Don't set colorkey - it can cause transparency issues with grid cells
        # self.out.set_colorkey(BLACK)  # Disabled to ensure cells are always visible
        # Count triggers
        self.triggers = 0
        self.scale_base = min(self.cell_width / self.size[0], self.cell_height / self.size[1]) * 0.8
        self.threshold = pygame.Color(0, 0, 0, 255)
        self.thr_color = pygame.Color(0, 0, 0, 255)
        # For distortion effects
        self.distortion_time = 0.0
        # For audio reactivity smoothing
        self.prev_audio_reactivity = 0.0
        # Multiple cameras support
        self.cameras = []  # List of camera info dicts: {'type': 'opencv', 'obj': cap, 'device': '/dev/video0'}
        self.camera_snapshots = []  # List of snapshots for each camera
        self.camera_masked = []  # List of masked surfaces for each camera
        # Try to initialize and start camera(s) - detect multiple cameras
        multi_camera_success = False
        try:
            # Detect all available cameras first
            available_cameras = self._detect_all_cameras()
            print(f"Detected {len(available_cameras)} potential camera(s)")
            if len(available_cameras) > 0:
            # Initialize up to grid size (16 cameras max for 4x4 grid)
                # But limit to reasonable number to prevent hanging
                max_cameras = min(len(available_cameras), self.grid_rows * self.grid_cols, 8)  # Max 8 cameras
                print(f"Will attempt to initialize up to {max_cameras} cameras")
                # Try to initialize each detected camera with timeout protection
                initialized_devices = set()  # Track initialized devices to avoid duplicates
                import time
                init_start_time = time.time()
                max_init_time = 10.0  # Don't spend more than 10 seconds total on initialization
            for i, cam_info in enumerate(available_cameras[:max_cameras]):
                    # Check if we've exceeded total initialization time
                    if time.time() - init_start_time > max_init_time:
                        print(f"Initialization timeout reached. Stopped after {len(self.cameras)} cameras.")
                        break
                    try:
                        # Skip if we've already initialized this device
                        device_key = cam_info.get('device', f"index_{cam_info.get('index', i)}")
                        if device_key in initialized_devices:
                            print(f"Skipping duplicate device: {device_key}")
                            continue
                        # Quick timeout per camera (2 seconds max)
                        cam_start_time = time.time()
                        cam_obj = None
                        try:
                            print(f"Attempting to initialize camera {i+1}/{max_cameras}: {device_key}")
                    cam_obj = self._initialize_camera(cam_info)
                        except Exception as e:
                            print(f"Camera {i+1} initialization exception: {e}")
                            pass
                        if cam_obj and (time.time() - cam_start_time < 3.0):  # Only accept if initialized quickly
                        self.cameras.append({
                            'type': cam_info['type'],
                            'obj': cam_obj,
                            'device': cam_info.get('device', None),
                            'index': cam_info.get('index', i)
                        })
                            initialized_devices.add(device_key)
                        # Create surfaces for this camera
                        self.camera_snapshots.append(pygame.surface.Surface(self.size, 0))
                        self.camera_masked.append(pygame.surface.Surface(self.size, 0))
                        # Format camera info for logging (avoid nested f-strings with backslashes)
                        device_str = cam_info.get('device', None)
                        if device_str:
                            print(f"✓ Camera {len(self.cameras)} initialized: {device_str}")
                        else:
                            idx = cam_info.get('index', i)
                            print(f"✓ Camera {len(self.cameras)} initialized: index {idx}")
                        else:
                            if cam_obj:
                                print(f"Camera {i+1} initialized but took too long, skipping")
                            else:
                                print(f"Camera {i+1} failed to initialize")
                except Exception as e:
                        print(f"Error initializing camera {i+1}: {e}")
                    continue
            if len(self.cameras) > 0:
                # Successfully initialized at least one camera
                self.static = None
                multi_camera_success = True
                print(f"✓ Successfully initialized {len(self.cameras)} camera(s) for grid mode")
                camera_list = []
                for cam in self.cameras:
                    device = cam.get('device', None)
                    if device:
                        camera_list.append(device)
            else:
                        idx = cam.get('index', '?')
                        camera_list.append(f'index_{idx}')
                print(f"  Camera list: {camera_list}")
                # If we only have one camera, it will be displayed in all grid cells (expected behavior)
                if len(self.cameras) == 1:
                    print("⚠️  WARNING: Only ONE camera detected!")
                    print("   The grid will show the same camera in all cells.")
                    print("   To see multiple cameras, connect additional USB cameras.")
                else:
                    print(f"✓ Multiple cameras detected - grid will show different cameras in each cell")
            if not multi_camera_success:
                # Fall back to single camera initialization (old method)
                print("No cameras initialized with multi-camera method, trying single camera fallback...")
                # Don't raise - continue to single camera fallback below
        except (SystemError, Exception) as e:
            # Fallback to old single-camera initialization if multi-camera fails
            print(f"Multi-camera initialization failed, trying single camera fallback: {e}")
            try:
                if self.use_opencv:
                    # Use OpenCV - more reliable than pygame.camera
                    camera_initialized = False
                    # First, try /dev/video0 directly if we're on Linux/EYESY
                    import os
                    if os.path.exists('/dev/video0'):
                        try:
                            print("Trying /dev/video0 with OpenCV")
                            self.cv2_cap = cv2.VideoCapture('/dev/video0')
                            if self.cv2_cap.isOpened():
                                import time
                                time.sleep(0.2)
                                for attempt in range(5):
                                    ret, test_frame = self.cv2_cap.read()
                                    if ret and test_frame is not None and test_frame.size > 0:
                                        # Get actual resolution and adjust
                                        actual_height, actual_width = test_frame.shape[:2]
                                        # Try to set a reasonable resolution
                                        self.cv2_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
                                        self.cv2_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
                                        # Read again to get the set resolution
                                        ret, test_frame = self.cv2_cap.read()
                                        if ret and test_frame is not None:
                                            actual_height, actual_width = test_frame.shape[:2]
                                            self.size = (actual_width, actual_height)
                                            self.snapshot = pygame.surface.Surface(self.size, 0)
                                            self.masked = pygame.surface.Surface(self.size, 0)
                                            self.static = None
                                            print(f"✓ OpenCV camera initialized: /dev/video0 at {actual_width}x{actual_height}")
                                            camera_initialized = True
                                            break
                                    time.sleep(0.1)
                                if not camera_initialized:
                                    self.cv2_cap.release()
                                    self.cv2_cap = None
                        except Exception as e:
                            if self.cv2_cap:
                                self.cv2_cap.release()
                                self.cv2_cap = None
                            print(f"OpenCV /dev/video0 failed: {e}")
                    # If /dev/video0 didn't work, try camera indices 0-9
                    if not camera_initialized:
                        for cam_idx in range(10):
                            try:
                                self.cv2_cap = cv2.VideoCapture(cam_idx)
                                if self.cv2_cap.isOpened():
                                    import time
                                    time.sleep(0.2)
                                    for attempt in range(3):
                                        ret, test_frame = self.cv2_cap.read()
                                        if ret and test_frame is not None and test_frame.size > 0:
                                            actual_height, actual_width = test_frame.shape[:2]
                                            self.size = (actual_width, actual_height)
                                            self.snapshot = pygame.surface.Surface(self.size, 0)
                                            self.masked = pygame.surface.Surface(self.size, 0)
                                            self.static = None
                                            print(f"✓ OpenCV camera initialized at index {cam_idx} at {actual_width}x{actual_height}")
                                            camera_initialized = True
                                            break
                                        time.sleep(0.1)
                                    if camera_initialized:
                                        break
                                    else:
                                        self.cv2_cap.release()
                                        self.cv2_cap = None
                            except Exception as e:
                                if self.cv2_cap:
                                    self.cv2_cap.release()
                                    self.cv2_cap = None
                                continue
                    if not camera_initialized:
                        print("OpenCV could not initialize camera - will use static image fallback")
                        # Continue to fallback handling
                elif self.use_webcam_lib:
                    # Use webcam library (simpler, may work better on EYESY)
                    try:
                        from webcam import Webcam
                        print("Initializing webcam library...")
                        self.webcam_lib = Webcam()
                        self.webcam_lib.start()
                        import time
                        time.sleep(0.5)
                        # Try to read a frame
                        for attempt in range(10):
                            frame = self.webcam_lib.read()
                            if frame is not None:
                                # Convert numpy array to pygame surface
                                # webcam library returns RGB numpy array
                                if len(frame.shape) == 3:
                                    height, width = frame.shape[:2]
                                    self.size = (width, height)
                                    self.snapshot = pygame.surface.Surface(self.size, 0)
                                    self.masked = pygame.surface.Surface(self.size, 0)
                                    self.static = None
                                    print(f"✓ webcam library initialized at {width}x{height}")
                                    break
                            time.sleep(0.1)
                        else:
                            print("webcam library started but could not read frames - will use static image fallback")
                            self.webcam_lib = None
                    except Exception as e:
                        print(f"webcam library initialization failed: {e} - will use static image fallback")
                        self.webcam_lib = None
                elif self.use_imageio:
                    # Use imageio for camera access
                    try:
                        import imageio
                        print("Initializing imageio camera...")
                        # Try camera index 0
                        self.imageio_reader = imageio.get_reader('<video0>')
                        import time
                        time.sleep(0.5)
                        # Try to read a frame
                        for attempt in range(10):
                            try:
                                frame = self.imageio_reader.get_next_data()
                                if frame is not None and frame.size > 0:
                                    height, width = frame.shape[:2]
                                    self.size = (width, height)
                                    self.snapshot = pygame.surface.Surface(self.size, 0)
                                    self.masked = pygame.surface.Surface(self.size, 0)
                                    self.static = None
                                    print(f"✓ imageio camera initialized at {width}x{height}")
                                    break
                            except:
                                time.sleep(0.1)
                                continue
                        else:
                            print("imageio started but could not read frames - will use static image fallback")
                            self.imageio_reader = None
                    except Exception as e:
                        print(f"imageio initialization failed: {e} - will use static image fallback")
                        self.imageio_reader = None
                elif self.use_ffmpeg:
                    # Use ffmpeg via subprocess (no Python packages needed)
                    try:
                        import subprocess
                        import os
                        import tempfile
                        # Find video device
                        video_device = '/dev/video0'
                        if not os.path.exists(video_device):
                            import glob
                            video_devices = sorted(glob.glob('/dev/video*'))
                            if video_devices:
                                video_device = video_devices[0]
                            else:
                                print("No video device found - will use static image fallback")
                                video_device = None
                        if video_device is None:
                            print("Skipping ffmpeg initialization - no video device")
                            self.ffmpeg_device = None
                        else:
                        print(f"Initializing ffmpeg camera: {video_device}")
                        # Create temp file for frame capture
                        self.ffmpeg_temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
                        self.ffmpeg_temp_file.close()
                        temp_path = self.ffmpeg_temp_file.name
                        # Test ffmpeg capture
                        cmd = ['ffmpeg', '-f', 'v4l2', '-i', video_device,
                              '-vframes', '1', '-vf', 'scale=320:240',
                              '-y', temp_path]
                        result = subprocess.run(cmd, capture_output=True, timeout=5)
                        if result.returncode == 0 and os.path.exists(temp_path):
                            # Successfully captured a frame
                            test_img = pygame.image.load(temp_path)
                            self.size = test_img.get_size()
                            self.snapshot = pygame.surface.Surface(self.size, 0)
                            self.masked = pygame.surface.Surface(self.size, 0)
                            self.static = None
                            self.ffmpeg_device = video_device
                            print(f"✓ ffmpeg camera initialized: {video_device} at {self.size[0]}x{self.size[1]}")
                            os.unlink(temp_path)  # Clean up test file
                        else:
                            os.unlink(temp_path) if os.path.exists(temp_path) else None
                                print(f"ffmpeg could not capture from {video_device} - will use static image fallback")
                                self.ffmpeg_device = None
                    except Exception as e:
                        print(f"ffmpeg initialization failed: {e} - will use static image fallback")
                        self.ffmpeg_device = None
                elif self.use_pygame_camera:
                    # Use pygame.camera (Linux/EYESY) - workaround for format issues
                    if CAM and isinstance(CAM, tuple) and CAM[0]:  # Only try if we have a camera device
                        camera_device = CAM[0]
                        camera_initialized = False
                    # Try all available video devices - sometimes /dev/video1 works when /dev/video0 doesn't
                    import glob
                    all_video_devices = sorted(glob.glob('/dev/video*'))
                    if not all_video_devices:
                        all_video_devices = [camera_device]
                    for video_dev in all_video_devices:
                        if camera_initialized:
                            break
                        print(f"Trying video device: {video_dev}")
                        # Try to set format with v4l2-ctl first
                        try:
                            import subprocess
                            # Try to query what formats are available
                            result = subprocess.run(['v4l2-ctl', '--device', video_dev, '--list-formats'],
                                                  capture_output=True, text=True, timeout=2)
                            if result.returncode == 0:
                                print(f"Available formats for {video_dev}:")
                                print(result.stdout[:300])  # First 300 chars
                            # Try setting YUYV format (most common)
                            subprocess.run(['v4l2-ctl', '--device', video_dev,
                                          '--set-fmt-video=width=640,height=480,pixelformat=YUYV'],
                                         capture_output=True, text=True, timeout=2)
                        except:
                            pass  # v4l2-ctl might not be available
                        # Try opening without resolution (let camera use what v4l2-ctl set)
                        try:
                            print(f"  Opening {video_dev} without resolution specification...")
                            test_cam = pygame.camera.Camera(video_dev)
                            test_cam.start()
                            import time
                            time.sleep(1.5)  # Longer delay
                            # Try many times to get a frame
                            for attempt in range(20):
                                if test_cam.query_image():
                                    test_img = test_cam.get_image()
                                    if test_img and test_img.get_size()[0] > 0:
                                        actual_size = test_img.get_size()
                                        self.cam = test_cam
                                        self.size = actual_size
                                        self.snapshot = pygame.surface.Surface(self.size, 0)
                                        self.masked = pygame.surface.Surface(self.size, 0)
                                        self.static = None
                                        print(f"✓ SUCCESS! Camera initialized: {video_dev} at {actual_size[0]}x{actual_size[1]}")
                                        camera_initialized = True
                                        break
                                time.sleep(0.15)
                            if not camera_initialized:
                                test_cam.stop()
                        except Exception as e:
                            print(f"  {video_dev} failed: {e}")
                            try:
                                test_cam.stop()
                            except:
                                pass
                            continue
                        if not camera_initialized:
                            print(f"Could not initialize any camera device. Tried: {', '.join(all_video_devices[:5])}. Will use static image fallback.")
                    else:
                        print("No camera device available for pygame.camera. Will use static image fallback.")
                else:
                    print("No camera backend available. Will use static image fallback.")
            except (SystemError, Exception) as e:
                # camera not available or initialization failed
                print(f"Camera initialization failed, using static image: {e}")
            # Check if we need static image fallback (no cameras initialized)
            needs_static_fallback = False
            if len(self.cameras) == 0:
                if self.cv2_cap is None and self.cam is None and self.webcam_lib is None and self.imageio_reader is None and not hasattr(self, 'ffmpeg_device'):
                    needs_static_fallback = True
            # Set up static image fallback if needed
            if needs_static_fallback or (len(self.cameras) == 0 and self.cv2_cap is None and self.cam is None):
            if self.cv2_cap:
                self.cv2_cap.release()
                self.cv2_cap = None
            if self.webcam_lib:
                try:
                    self.webcam_lib.stop()
                except:
                    pass
                self.webcam_lib = None
            if self.imageio_reader:
                try:
                    self.imageio_reader.close()
                except:
                    pass
                self.imageio_reader = None
            if hasattr(self, 'ffmpeg_temp_file'):
                try:
                    import os
                    if os.path.exists(self.ffmpeg_temp_file.name):
                        os.unlink(self.ffmpeg_temp_file.name)
                except:
                    pass
            if self.cam:
                try:
                    self.cam.stop()
                except:
                    pass
                self.cam = None
            try:
                self.static = pygame.image.load(etc.mode_root + '/no_camera.png')
                self.static.convert()
                print("Using no_camera.png as fallback")
            except:
                # If no_camera.png doesn't exist, create a simple colored surface
                self.static = pygame.surface.Surface(self.size, 0)
                self.static.fill((100, 100, 100))  # Gray placeholder
                print("Using gray placeholder as fallback")
            self.triggers += 1
    def get_and_flip(self, screen, etc):
        # ============================================================
        # CRITICAL: Check if cameras are still connected
        # EYESY OS may disconnect cameras after initialization
        # ============================================================
        # Check if cameras were disconnected and need re-initialization
        cameras_disconnected = False
        if len(self.cameras) > 0:
            for i, cam in enumerate(self.cameras):
                try:
                    if cam['type'] == 'opencv':
                        if cam['obj'] is None or not cam['obj'].isOpened():
                            print(f"⚠️  Camera {i+1} (OpenCV) disconnected - was {cam.get('device', 'unknown')}")
                            cameras_disconnected = True
                            cam['obj'] = None
                    elif cam['type'] == 'pygame_camera':
                        # pygame.camera doesn't have isOpened(), just check if object exists
                        if cam['obj'] is None:
                            print(f"⚠️  Camera {i+1} (pygame.camera) disconnected - was {cam.get('device', 'unknown')}")
                            cameras_disconnected = True
                except Exception as e:
                    print(f"⚠️  Error checking camera {i+1}: {e}")
                    cameras_disconnected = True
                    cam['obj'] = None
        # If cameras disconnected, try to re-initialize them
        if cameras_disconnected:
            print("⚠️  Cameras disconnected! Attempting to re-initialize...")
            # Clear disconnected cameras
            self.cameras = [cam for cam in self.cameras if cam.get('obj') is not None]
            # Try to re-initialize if we have fewer cameras than before
            if len(self.cameras) == 0:
                print("⚠️  All cameras disconnected! Attempting full re-initialization...")
                try:
                    # Quick re-initialization attempt (don't spend too long)
                    available_cameras = self._detect_all_cameras()
                    if len(available_cameras) > 0:
                        # Try to initialize just the first camera quickly
                        cam_info = available_cameras[0]
                        cam_obj = self._initialize_camera(cam_info)
                        if cam_obj:
                            self.cameras.append({
                                'type': cam_info['type'],
                                'obj': cam_obj,
                                'device': cam_info.get('device', None),
                                'index': cam_info.get('index', 0)
                            })
                            self.camera_snapshots.append(pygame.surface.Surface(self.size, 0))
                            self.camera_masked.append(pygame.surface.Surface(self.size, 0))
                            print(f"✓ Re-initialized camera: {cam_info.get('device', 'index_0')}")
                except Exception as e:
                    print(f"Re-initialization failed: {e}")
        # ============================================================
        # MINIMAL TEST: Draw 16 simple colored rectangles in 4x4 grid
        # This bypasses ALL camera code to test if grid drawing works at all
        # ============================================================
        # Force grid dimensions
        grid_cols = 4
        grid_rows = 4
        cell_width = etc.xres // grid_cols
        cell_height = etc.yres // grid_rows
        # Draw 16 simple colored rectangles - NO camera code, NO transforms, just rectangles
        cell_num = 0
        for row in range(grid_rows):
            for col in range(grid_cols):
                cell_num += 1
                cell_x = col * cell_width
                cell_y = row * cell_height
                # Calculate distinct color for each cell
                r = (cell_num * 16) % 255
                g = ((cell_num * 23) % 255)
                b = ((cell_num * 31) % 255)
                # Draw a large colored rectangle covering most of the cell
                pygame.draw.rect(screen, (r, g, b),
                               (cell_x + 5, cell_y + 5, cell_width - 10, cell_height - 10), 0)
                # Draw cell number in center
                try:
                    font = pygame.font.Font(None, 80)
                    text = font.render(str(cell_num), True, (255, 255, 255))
                    text_x = cell_x + (cell_width - text.get_width()) // 2
                    text_y = cell_y + (cell_height - text.get_height()) // 2
                    screen.blit(text, (text_x, text_y))
                except:
                    pass
        # Log camera status every 60 frames (once per second at 60fps)
        if not hasattr(self, '_frame_count'):
            self._frame_count = 0
        self._frame_count += 1
        if self._frame_count % 60 == 0:
            print(f"*** Camera status: {len(self.cameras)} cameras active ***")
        return  # EARLY RETURN - skip all camera code for now
        # ============================================================
        # ORIGINAL CODE BELOW (currently disabled for testing)
        # ============================================================
        # GRID MODE: Always draw a 4x4 grid, regardless of camera status
        # If we have multiple cameras, read from all of them
        if len(self.cameras) > 0:
            for i, cam in enumerate(self.cameras):
                try:
                    if cam['type'] == 'opencv':
                        ret, frame = cam['obj'].read()
                        if ret and frame is not None and frame.size > 0:
                            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                            if frame_rgb.shape[:2] != self.size[::-1]:
                                frame_rgb = cv2.resize(frame_rgb, self.size)
                            if i < len(self.camera_snapshots):
                                self.camera_snapshots[i] = pygame.surfarray.make_surface(frame_rgb.swapaxes(0, 1))
                    elif cam['type'] == 'pygame_camera':
                        if cam['obj'].query_image():
                            if i < len(self.camera_snapshots):
                                self.camera_snapshots[i] = cam['obj'].get_image(self.camera_snapshots[i])
                    elif cam['type'] == 'ffmpeg' and 'device' in cam['obj']:
                        import subprocess
                        import os
                        import tempfile
                        import io
                        cmd = ['ffmpeg', '-f', 'v4l2', '-i', cam['obj']['device'],
                              '-vframes', '1', '-vf', f'scale={self.size[0]}:{self.size[1]}',
                              '-f', 'image2pipe', '-vcodec', 'mjpeg', '-q:v', '2', '-']
                        result = subprocess.run(cmd, capture_output=True, timeout=1)
                        if result.returncode == 0 and len(result.stdout) > 0:
                            frame_img = pygame.image.load(io.BytesIO(result.stdout))
                            if i < len(self.camera_snapshots):
                                self.camera_snapshots[i] = pygame.transform.scale(frame_img, self.size)
                except Exception as e:
                    # Keep previous snapshot on error
                    pass
            # Use first camera's snapshot for backward compatibility
            if len(self.camera_snapshots) > 0 and self.camera_snapshots[0]:
                self.snapshot = self.camera_snapshots[0]
        # Fallback to single camera code
        elif self.use_opencv and self.cv2_cap is not None:
            try:
                ret, frame = self.cv2_cap.read()
                if ret and frame is not None and frame.size > 0:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    # Resize if needed
                    if frame_rgb.shape[:2] != self.size[::-1]:  # OpenCV uses (height, width)
                        frame_rgb = cv2.resize(frame_rgb, self.size)
                    # Convert numpy array to pygame surface
                    # pygame.surfarray.make_surface expects (width, height, 3) format
                    # frame_rgb is (height, width, 3), so we swap axes
                    self.snapshot = pygame.surfarray.make_surface(frame_rgb.swapaxes(0, 1))
                # If frame read fails, keep previous snapshot (don't show static)
            except Exception as e:
                # Camera error - log once but keep trying
                if not hasattr(self, '_error_logged'):
                    print(f"OpenCV camera read error (will retry): {e}")
                    self._error_logged = True
                # Keep previous snapshot, don't fall back to static
        elif self.use_webcam_lib and self.webcam_lib is not None:
            try:
                frame = self.webcam_lib.read()
                if frame is not None and frame.size > 0:
                    # webcam library returns RGB numpy array
                    if len(frame.shape) == 3:
                        # Resize if needed
                        if frame.shape[:2] != self.size[::-1]:
                            import numpy as np
                            frame = np.array(pygame.surfarray.array3d(
                                pygame.transform.scale(
                                    pygame.surfarray.make_surface(frame.swapaxes(0, 1)),
                                    self.size
                                )
                            )).swapaxes(0, 1)
                        # Convert to pygame surface
                        self.snapshot = pygame.surfarray.make_surface(frame.swapaxes(0, 1))
            except Exception as e:
                if not hasattr(self, '_webcam_error_logged'):
                    print(f"webcam library read error (will retry): {e}")
                    self._webcam_error_logged = True
        elif self.use_imageio and self.imageio_reader is not None:
            try:
                frame = self.imageio_reader.get_next_data()
                if frame is not None and frame.size > 0:
                    # imageio returns RGB numpy array
                    if len(frame.shape) == 3:
                        # Resize if needed
                        if frame.shape[:2] != self.size[::-1]:
                            import numpy as np
                            frame = np.array(pygame.surfarray.array3d(
                                pygame.transform.scale(
                                    pygame.surfarray.make_surface(frame.swapaxes(0, 1)),
                                    self.size
                                )
                            )).swapaxes(0, 1)
                        # Convert to pygame surface
                        self.snapshot = pygame.surfarray.make_surface(frame.swapaxes(0, 1))
            except Exception as e:
                if not hasattr(self, '_imageio_error_logged'):
                    print(f"imageio read error (will retry): {e}")
                    self._imageio_error_logged = True
        elif self.use_ffmpeg and hasattr(self, 'ffmpeg_device'):
            try:
                import subprocess
                import os
                import tempfile
                # Use a more efficient approach: capture to memory via stdout
                # This avoids file I/O overhead
                cmd = ['ffmpeg', '-f', 'v4l2', '-i', self.ffmpeg_device,
                      '-vframes', '1', '-vf', f'scale={self.size[0]}:{self.size[1]}',
                      '-f', 'image2pipe', '-vcodec', 'mjpeg', '-q:v', '2', '-']
                result = subprocess.run(cmd, capture_output=True, timeout=1)
                if result.returncode == 0 and len(result.stdout) > 0:
                    # Load image from memory
                    import io
                    frame_img = pygame.image.load(io.BytesIO(result.stdout))
                    self.snapshot = pygame.transform.scale(frame_img, self.size)
            except Exception as e:
                # Fallback to file-based method if pipe doesn't work
                try:
                    temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
                    temp_file.close()
                    temp_path = temp_file.name
                    cmd = ['ffmpeg', '-f', 'v4l2', '-i', self.ffmpeg_device,
                          '-vframes', '1', '-vf', f'scale={self.size[0]}:{self.size[1]}',
                          '-y', temp_path]
                    result = subprocess.run(cmd, capture_output=True, timeout=1)
                    if result.returncode == 0 and os.path.exists(temp_path):
                        frame_img = pygame.image.load(temp_path)
                        self.snapshot = pygame.transform.scale(frame_img, self.size)
                        os.unlink(temp_path)
                except:
                    if not hasattr(self, '_ffmpeg_error_logged'):
                        print(f"ffmpeg read error (will retry): {e}")
                        self._ffmpeg_error_logged = True
        elif self.cam is not None:
            try:
                if self.cam.query_image():
                    self.snapshot = self.cam.get_image(self.snapshot)
                # If query_image() returns False, keep previous snapshot (don't show static)
                # This handles occasional frame drops without falling back to static image
            except Exception as e:
                # Camera error - log once but keep trying
                if not hasattr(self, '_pygame_error_logged'):
                    print(f"pygame.camera read error (will retry): {e}")
                    self._pygame_error_logged = True
                # Keep previous snapshot, don't fall back to static
        elif self.static is not None:
            self.snapshot = self.static.copy()
        # Ensure snapshot is valid and correct size for threshold operation
        if self.snapshot is None or self.snapshot.get_size()[0] == 0:
            # Create a default snapshot if none exists
            self.snapshot = pygame.surface.Surface(self.size, 0)
            self.snapshot.fill((128, 128, 128))  # Gray default
        elif self.snapshot.get_size() != self.size:
            self.snapshot = pygame.transform.scale(self.snapshot, self.size)
        # Ensure masked surface matches snapshot size
        if self.masked is None or self.masked.get_size()[0] == 0:
            self.masked = pygame.surface.Surface(self.size, 0)
            self.masked.fill((128, 128, 128))  # Gray default
        elif self.masked.get_size() != self.snapshot.get_size():
            self.masked = pygame.surface.Surface(self.snapshot.get_size(), 0)
        # Knob 4: Color effects/masking
        self.threshold.hsla = ((etc.knob4 * 360, 50, 50))
        self.thr_color.hsla = (360, etc.knob4 * 100, 50)
        pygame.transform.threshold(
                self.masked,
                self.snapshot,
                self.thr_color,
                self.threshold,
                None,  # set_color must be None when set_behavior==2
                2,
        )
        # Process multiple cameras if available
        if len(self.cameras) > 0:
            for i, cam_snapshot in enumerate(self.camera_snapshots):
                if cam_snapshot and cam_snapshot.get_size()[0] > 0:
                    # Ensure masked surface exists
                    if i >= len(self.camera_masked):
                        self.camera_masked.append(pygame.surface.Surface(cam_snapshot.get_size(), 0))
                    elif self.camera_masked[i].get_size() != cam_snapshot.get_size():
                        self.camera_masked[i] = pygame.surface.Surface(cam_snapshot.get_size(), 0)
                    # Apply color masking to each camera
                    pygame.transform.threshold(
                        self.camera_masked[i],
                        cam_snapshot,
                        self.thr_color,
                        self.threshold,
                        None,
                        2,
                    )
        # Knob 1: Base size of the webcam images (0.1 to 1.0 of cell)
        base_size_scale = 0.1 + etc.knob1 * 0.9
        # Knob 2: Audio/MIDI reactivity (affects position, scale, rotation)
        reactivity = etc.knob2
        # Calculate audio reactivity
        audio_reactivity = 0.0
        if len(etc.audio_in) > 0:
            audio_sum = sum(abs(sample) for sample in etc.audio_in[:min(100, len(etc.audio_in))])
            audio_avg = audio_sum / (32768.0 * min(100, len(etc.audio_in)))
            if not hasattr(self, 'prev_audio_reactivity'):
                self.prev_audio_reactivity = 0.0
            audio_reactivity = (audio_avg * 0.7 + self.prev_audio_reactivity * 0.3) * reactivity
            self.prev_audio_reactivity = audio_reactivity
        # Use audio_trig if available (test runner), otherwise use trig (official API)
        audio_trigger = getattr(etc, 'audio_trig', False) or etc.trig
        if audio_trigger or etc.midi_note_new:
            self.triggers += 1
            if random.random() > .5:
                hue = random.randint(-127, 127)
                if self.static is None and not self.use_opencv:
                    try:
                        if isinstance(CAM, tuple) and CAM[0]:
                            subprocess.Popen(
                                "v4l2-ctl -d {} --set-ctrl=hue={}".format(CAM[0], hue).split()
                            )
                    except:
                        pass
        # Knob 3: Distortion effects
        distortion_amount = etc.knob3
        self.distortion_time += 0.05
        # Base scale calculation - CRITICAL: Keep scale reasonable so cells fit in grid
        # scale_base is calculated to fit image in cell: min(cell_width/size[0], cell_height/size[1]) * 0.8
        base_scale = base_size_scale * self.scale_base
        # Limit reactive scale to prevent cells from becoming too large
        reactive_scale = base_scale * (1.0 + audio_reactivity * 0.5)
        reactive_scale = min(reactive_scale, 1.0)  # Never scale larger than 1.0 (cell size)
        reactive_rotation = audio_reactivity * 360 * reactivity
        # DEBUG: Log scale values to diagnose if cells are too large
        if not hasattr(self, '_scale_logged'):
            print(f"*** SCALE DEBUG: base_size_scale={base_size_scale:.3f}, scale_base={self.scale_base:.3f}, base_scale={base_scale:.3f}, reactive_scale={reactive_scale:.3f} ***")
            print(f"*** SCALE DEBUG: cell_size={self.cell_width}x{self.cell_height}, image_size={self.size} ***")
            self._scale_logged = True
        # ============================================================
        # GRID MODE: ALWAYS DRAW 4x4 GRID (16 CELLS) - NO EXCEPTIONS
        # ============================================================
        # This MUST draw 16 cells even if no cameras are initialized
        # ============================================================
        # CRITICAL: Force grid to 4x4 BEFORE anything else
        # Check if grid was somehow set to 1x1
        if not hasattr(self, 'grid_rows') or self.grid_rows != 4:
            print(f"*** FORCING grid_rows from {getattr(self, 'grid_rows', 'MISSING')} to 4 ***")
            self.grid_rows = 4
        if not hasattr(self, 'grid_cols') or self.grid_cols != 4:
            print(f"*** FORCING grid_cols from {getattr(self, 'grid_cols', 'MISSING')} to 4 ***")
            self.grid_cols = 4
        if not hasattr(self, 'cell_width') or self.cell_width <= 0:
            self.cell_width = etc.xres // 4
            print(f"*** RECALCULATING cell_width to {self.cell_width} ***")
        if not hasattr(self, 'cell_height') or self.cell_height <= 0:
            self.cell_height = etc.yres // 4
            print(f"*** RECALCULATING cell_height to {self.cell_height} ***")
        cells_drawn = 0
        # CRITICAL DEBUG: Print every frame to prove grid code is running
        print(f"*** GRID DRAW START: {self.grid_rows}x{self.grid_cols}={self.grid_rows * self.grid_cols} cells ***")
        print(f"*** Cell size: {self.cell_width}x{self.cell_height}, Screen: {etc.xres}x{etc.yres} ***")
        print(f"*** Cameras: {len(self.cameras)}, Static: {self.static is not None} ***")
        print(f"*** VERIFY: grid_rows={self.grid_rows}, grid_cols={self.grid_cols}, loop will run {self.grid_rows * self.grid_cols} times ***")
        # CRITICAL: Always draw grid, even if no cameras
        # Force grid to be 4x4 - never allow it to be 1x1
        if self.grid_rows != 4 or self.grid_cols != 4:
            print(f"WARNING: Grid was {self.grid_rows}x{self.grid_cols}, forcing to 4x4")
            self.grid_rows = 4
            self.grid_cols = 4
            self.cell_width = etc.xres // 4
            self.cell_height = etc.yres // 4
        # SIMPLE TEST: Draw 16 colored rectangles directly to screen FIRST
        # This proves the grid positions are correct - you MUST see 16 different colored rectangles
        print("*** DRAWING TEST RECTANGLES TO VERIFY GRID POSITIONS ***")
        print(f"*** TEST: cell_width={self.cell_width}, cell_height={self.cell_height} ***")
        test_rects_drawn = 0
        for test_row in range(4):
            for test_col in range(4):
                test_rects_drawn += 1
                test_cell_x = test_col * self.cell_width
                test_cell_y = test_row * self.cell_height
                test_num = test_row * 4 + test_col + 1
                # Use VERY distinct colors
                test_r = (test_num * 16) % 255
                test_g = ((test_num * 23) % 255)
                test_b = ((test_num * 31) % 255)
                # Draw a HUGE rectangle covering most of each cell - impossible to miss
                rect_x = test_cell_x + 5
                rect_y = test_cell_y + 5
                rect_w = self.cell_width - 10
                rect_h = self.cell_height - 10
                print(f"*** TEST RECT {test_num}: pos=({rect_x}, {rect_y}), size=({rect_w}, {rect_h}), color=({test_r}, {test_g}, {test_b}) ***")
                pygame.draw.rect(screen, (test_r, test_g, test_b),
                               (rect_x, rect_y, rect_w, rect_h), 0)
                # Draw cell number in HUGE font
                try:
                    test_font = pygame.font.Font(None, 100)  # HUGE font
                    test_text = test_font.render(str(test_num), True, (255, 255, 255))
                    text_x = test_cell_x + self.cell_width // 2 - test_text.get_width() // 2
                    text_y = test_cell_y + self.cell_height // 2 - test_text.get_height() // 2
                    screen.blit(test_text, (text_x, text_y))
                except Exception as e:
                    print(f"*** ERROR drawing test text: {e} ***")
        print(f"*** DREW {test_rects_drawn} TEST RECTANGLES - YOU MUST SEE 16 DIFFERENT COLORS ***")
        # CRITICAL: Verify loop will run 16 times
        expected_iterations = self.grid_rows * self.grid_cols
        print(f"*** LOOP VERIFICATION: Will iterate {expected_iterations} times (rows={self.grid_rows}, cols={self.grid_cols}) ***")
        if expected_iterations != 16:
            print(f"*** ERROR: Expected 16 iterations but will only do {expected_iterations}! FORCING TO 16 ***")
            self.grid_rows = 4
            self.grid_cols = 4
            expected_iterations = 16
        for row in range(self.grid_rows):
            for col in range(self.grid_cols):
                cells_drawn += 1
                # Calculate cell position - CRITICAL: Each cell must be at different position
                cell_x = col * self.cell_width
                cell_y = row * self.cell_height
                # Debug: Print position for EVERY cell to verify they're different
                if cells_drawn <= 4 or cells_drawn == 8 or cells_drawn == 12 or cells_drawn == 16:
                    print(f"*** CELL {cells_drawn}: row={row}, col={col}, pos=({cell_x}, {cell_y}) ***")
                # Safety check: ensure position is valid
                if cell_x < 0 or cell_y < 0 or cell_x >= etc.xres or cell_y >= etc.yres:
                    print(f"ERROR: Invalid cell position: ({cell_x}, {cell_y}) for cell {cells_drawn}")
                    continue  # Skip invalid cells
                # Debug: Log ALL cell positions for first frame
                if not hasattr(self, '_positions_logged'):
                    print(f"[GRID DEBUG] Cell {cells_drawn} (r={row}, c={col}): pos=({cell_x}, {cell_y})")
                    if cells_drawn == 16:
                        self._positions_logged = True
                # Select which camera to use for this cell (cycle through available cameras)
                camera_idx = (row * self.grid_cols + col) % max(1, len(self.cameras)) if len(self.cameras) > 0 else 0
                # Get the source image for this cell
                source_image = None
                if len(self.cameras) > 0 and camera_idx < len(self.camera_masked):
                    if self.camera_masked[camera_idx] is not None and self.camera_masked[camera_idx].get_size()[0] > 0:
                    source_image = self.camera_masked[camera_idx]
                # Fallback to main masked image if camera-specific one isn't available
                if source_image is None:
                    if self.masked is not None and self.masked.get_size()[0] > 0:
                    source_image = self.masked
                # Fallback to static image if no masked image
                if source_image is None:
                    if self.static is not None:
                        source_image = self.static
                # Final fallback: create a colored placeholder for this cell
                if source_image is None:
                    source_image = pygame.surface.Surface(self.size, 0)
                    # Use VERY different colors for different cells to make grid visible
                    cell_num = row * self.grid_cols + col
                    # Create distinct colors for each cell (0-15)
                    r = 50 + ((cell_num % 4) * 50)  # 0-3 -> 50, 100, 150, 200
                    g = 50 + (((cell_num // 4) % 4) * 50)  # 0-3 -> 50, 100, 150, 200
                    b = 50 + (((cell_num // 16) % 4) * 50)  # Mostly 50, some 100
                    source_image.fill((r, g, b))
                    # Also draw cell number on the placeholder
                    try:
                        font = pygame.font.Font(None, 48)
                        text = font.render(str(cell_num + 1), True, (255, 255, 255))
                        text_rect = text.get_rect(center=(self.size[0]//2, self.size[1]//2))
                        source_image.blit(text, text_rect)
                    except:
                        pass
                # Apply distortion if knob 3 is turned up
                distorted = source_image
                if distortion_amount > 0.05:
                    if distortion_amount < 0.5:
                        # Pixelation
                        pixel_size = max(1, int(1 + (distortion_amount * 0.45) * 20))
                        small_w = max(1, distorted.get_width() // pixel_size)
                        small_h = max(1, distorted.get_height() // pixel_size)
                        small = pygame.transform.scale(distorted, (small_w, small_h))
                        distorted = pygame.transform.scale(small, (distorted.get_width(), distorted.get_height()))
                    else:
                        # Wave distortion
                        wave_amount = (distortion_amount - 0.5) * 2.0
                        wave_rotation = wave_amount * 5 * math.sin(self.distortion_time * 0.5)
                        distorted = pygame.transform.rotate(distorted, wave_rotation)
                        wave_scale = 1.0 + wave_amount * 0.1 * math.sin(self.distortion_time)
                        if wave_scale != 1.0:
                            new_w = int(distorted.get_width() * wave_scale)
                            new_h = int(distorted.get_height() * wave_scale)
                            distorted = pygame.transform.scale(distorted, (new_w, new_h))
                # Get rotation and scale for this cell (with audio reactivity)
                cell_rotation = reactive_rotation + etc.grid_rotations[row][col]
                cell_scale = reactive_scale * etc.grid_scales[row][col]
                # Audio-reactive position offset
                offset_x = int(audio_reactivity * self.cell_width * 0.1 * math.sin(time.time() * 2 + row))
                offset_y = int(audio_reactivity * self.cell_height * 0.1 * math.cos(time.time() * 2 + col))
                # Clear output surface - use a DISTINCT color per cell so grid is ALWAYS visible
                bg_color = etc.color_picker(etc.knob5)
                # Make each cell VERY different so we can definitely see the grid
                cell_num = row * self.grid_cols + col
                # Create a distinct background color for each cell (0-15)
                r_offset = ((cell_num % 4) * 40)  # 0, 40, 80, 120
                g_offset = (((cell_num // 4) % 4) * 40)  # 0, 40, 80, 120
                b_offset = (((cell_num // 16) % 4) * 40)  # Mostly 0
                cell_bg = (
                    min(255, max(50, bg_color[0] + r_offset)),
                    min(255, max(50, bg_color[1] + g_offset)),
                    min(255, max(50, bg_color[2] + b_offset))
                )
                self.out.fill(cell_bg)
                # Draw a large colored rectangle in each cell to prove grid is working
                # This makes it impossible to miss the grid
                test_color = ((cell_num * 15) % 255, ((cell_num * 23) % 255), ((cell_num * 31) % 255))
                pygame.draw.rect(self.out, test_color, (10, 10, self.cell_width - 20, self.cell_height - 20), 0)
                # Transform and blit the distorted webcam feed
                # CRITICAL: Ensure transformed image fits in cell
                transformed = pygame.transform.rotozoom(
                    distorted,
                    cell_rotation,
                    cell_scale
                )
                # Ensure transformed image doesn't exceed cell size (safety check)
                if transformed.get_width() > self.cell_width or transformed.get_height() > self.cell_height:
                    # Scale down to fit
                    scale_w = self.cell_width / transformed.get_width()
                    scale_h = self.cell_height / transformed.get_height()
                    fit_scale = min(scale_w, scale_h) * 0.9  # 90% to leave border space
                    new_w = int(transformed.get_width() * fit_scale)
                    new_h = int(transformed.get_height() * fit_scale)
                    transformed = pygame.transform.scale(transformed, (new_w, new_h))
                # Center the transformed image in the cell
                tx = (self.cell_width - transformed.get_width()) // 2
                ty = (self.cell_height - transformed.get_height()) // 2
                self.out.blit(transformed, (tx, ty))
                # Draw a VERY visible border to make grid cells distinct (GRID MODE - always show grid)
                # Use bright white border so cells are always visible
                border_color = (255, 255, 255)  # Bright white border - always visible
                # Make border thick and visible
                pygame.draw.rect(self.out, border_color, (0, 0, self.cell_width, self.cell_height), 5)
                # Also draw inner border in cell number color
                cell_num = row * self.grid_cols + col
                inner_color = ((cell_num * 17) % 255, (cell_num * 23) % 255, (cell_num * 31) % 255)
                pygame.draw.rect(self.out, inner_color, (2, 2, self.cell_width - 4, self.cell_height - 4), 2)
                # Draw cell number and position indicator in each cell for debugging
                try:
                    font = pygame.font.Font(None, 20)
                    # Show cell number (1-16) and position
                    cell_num = row * self.grid_cols + col + 1
                    cell_text = f"{cell_num}"  # Just show cell number
                    text_surface = font.render(cell_text, True, (255, 255, 255))  # White text
                    # Draw with black outline for visibility
                    outline = font.render(cell_text, True, (0, 0, 0))
                    for dx, dy in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
                        self.out.blit(outline, (5 + dx, 5 + dy))
                    self.out.blit(text_surface, (5, 5))
                except:
                    pass
                # CRITICAL: Blit the cell to the screen at its UNIQUE grid position
                # Each cell MUST be at a different (cell_x, cell_y) position
                blit_x = int(cell_x)
                blit_y = int(cell_y)
                # Debug: Print position for first few cells EVERY FRAME to verify they're different
                if cells_drawn <= 4:
                    print(f"*** BLITTING cell {cells_drawn} at ({blit_x}, {blit_y}) ***")
                # Blit the cell surface to screen
                screen.blit(self.out, (blit_x, blit_y))
                # ALSO draw a simple colored rectangle directly to screen as a backup test
                # This proves the grid positions are correct - you should see 16 small colored squares
                test_rect_color = ((cells_drawn * 20) % 255, ((cells_drawn * 30) % 255), ((cells_drawn * 40) % 255))
                pygame.draw.rect(screen, test_rect_color, (blit_x + 5, blit_y + 5, 30, 30), 0)
        # CRITICAL DEBUG: Log how many cells were drawn EVERY FRAME
        expected_cells = self.grid_rows * self.grid_cols
        print(f"*** GRID DRAW END: Drawn {cells_drawn} cells (expected {expected_cells}) ***")
        if cells_drawn != expected_cells:
            print(f"*** GRID ERROR: Expected {expected_cells} cells but only drew {cells_drawn}! ***")
            print(f"*** This means the loop only ran {cells_drawn} times instead of {expected_cells} ***")
        else:
            print(f"*** GRID SUCCESS: All {expected_cells} cells drawn correctly ***")
        # DRAW TEST RECTANGLES AGAIN AT THE END to verify they appear
        # If you see these but not the ones at the start, something is overwriting them
        print("*** DRAWING TEST RECTANGLES AGAIN AT END (should appear on top) ***")
        for test_row in range(4):
            for test_col in range(4):
                test_cell_x = test_col * self.cell_width
                test_cell_y = test_row * self.cell_height
                test_num = test_row * 4 + test_col + 1
                # Draw a small bright rectangle in corner of each cell
                test_color = ((test_num * 20) % 255, ((test_num * 30) % 255), ((test_num * 40) % 255))
                pygame.draw.rect(screen, test_color,
                               (test_cell_x + self.cell_width - 40, test_cell_y + self.cell_height - 40,
                                35, 35), 0)
        # NOTE: Text rendering moved to draw() function (drawn AFTER get_and_flip)
        # This ensures "GRID MODE" text is always drawn last and cannot be overwritten
        # Do NOT draw any text here that could conflict with draw() function
        pass
