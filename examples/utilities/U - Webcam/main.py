"""
ETC Mode that displays a webcam feed with audio/MIDI reactivity and effects.
Controls:
- Knob 1: Controls the size of the webcam image
- Knob 2: Controls how reactive the webcam is to audio/MIDI data (position, scale, rotation)
- Knob 3: Adds distortion effects to the video (pixelation, waves, etc.)
- Knob 4: Changes the colors of the video (color effects/masking)
- Knob 5: Controls background color
- Trigger: Applies color effects and distortion
The webcam feed is centered and reacts to audio/MIDI input based on knob 2.
If camera can not be found or not be opened, it will use a static png instead.
Camera Detection:
- Optimized for EYESY hardware (Linux/Organelle M)
- Uses pygame.camera (preferred) or OpenCV (fallback)
- Uses ONLY the first camera (/dev/video0 or camera index 0)
- For multiple cameras, use "U - Webcam Grid" mode instead
- If camera fails, check: ls -l /dev/video* to see available devices
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
X_CENTER = 1280 / 2
Y_CENTER = 720 / 2
def setup(screen, etc):
    print("=" * 60)
    print("U - Webcam: STANDALONE MODE (single centered image, NOT a grid)")
    print("FILE: U - Webcam/main.py")
    print("MODE TYPE: STANDALONE (NOT GRID)")
    print("MODE IDENTIFIER: STANDALONE_MODE_V2")
    print("=" * 60)
    etc.capture = Capture(etc)
    etc._mode_type = "STANDALONE"  # Unique identifier
    etc._mode_file = "U - Webcam/main.py"  # File path identifier
def draw(screen, etc):
    # STANDALONE MODE: Single centered image
    # CRITICAL: This is STANDALONE mode - should have GREEN border, NOT magenta!
    # Draw a subtle border to distinguish from grid mode
    etc.color_picker_bg(etc.knob5)
    # Draw a thin border around the entire screen to show this is STANDALONE mode
    # GREEN border (0, 255, 0) = STANDALONE MODE
    # MAGENTA border (255, 0, 255) = GRID MODE (WRONG FILE!)
    pygame.draw.rect(screen, (0, 255, 0), (0, 0, etc.xres, etc.yres), 5)  # Green border for STANDALONE
    etc.capture.get_and_flip(screen, etc)
class Capture(object):
    def __init__(self, etc):
        print("=== U - Webcam (STANDALONE MODE) - Initializing first camera only ===")
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
        # STANDALONE MODE: Don't create a full-screen surface - we'll blit directly to screen
        # This mode displays a SINGLE centered image, NOT a grid
        # Count triggers
        self.triggers = 0
        self.scale = (etc.xres / self.size[0]) * 0.3  # full size uses too much cpu
        self.threshold = pygame.Color(0, 0, 0, 255)
        self.thr_color = pygame.Color(0, 0, 0, 255)
        # For distortion effects
        self.distortion_time = 0.0
        # For audio reactivity smoothing
        self.prev_audio_reactivity = 0.0
        # Try to initialize and start camera
        # Wrap entire initialization in try/except to ensure mode always loads
        camera_initialized = False
        needs_static_fallback = False
        try:
            if self.use_opencv:
                # Use OpenCV - more reliable than pygame.camera
                # STANDALONE MODE: Try all video devices but use only the FIRST working one
                import os
                import glob
                # Try all /dev/video* devices, but stop at the first working one
                # Limit to first 10 devices to prevent hanging on invalid devices
                video_devices = sorted(glob.glob('/dev/video*'))[:10]
                import time
                init_start_time = time.time()
                max_init_time = 5.0  # Don't spend more than 5 seconds on initialization
                for video_dev in video_devices:
                    # Check timeout
                    if time.time() - init_start_time > max_init_time:
                        print("Initialization timeout - stopping camera search")
                        break
                    if camera_initialized:
                        break
                    # Skip devices above video10 (usually not capture devices)
                    try:
                        dev_num = int(video_dev.split('video')[-1])
                        if dev_num > 10:
                            continue
                    except:
                        pass
                    try:
                        print(f"Trying {video_dev} with OpenCV (standalone mode - first camera only)")
                        self.cv2_cap = cv2.VideoCapture(video_dev)
                        if self.cv2_cap.isOpened():
                            # Set timeout
                            self.cv2_cap.set(cv2.CAP_PROP_TIMEOUT, 1000)  # 1 second timeout
                            time.sleep(0.2)
                            device_start_time = time.time()
                            timeout = 2.0  # 2 second max per device
                            # Simplified initialization - just check if we can read a frame
                            while time.time() - device_start_time < timeout:
                                ret, test_frame = self.cv2_cap.read()
                                if ret and test_frame is not None and test_frame.size > 0:
                                    # Get actual resolution
                                    actual_height, actual_width = test_frame.shape[:2]
                                    self.size = (actual_width, actual_height)
                                    self.snapshot = pygame.surface.Surface(self.size, 0)
                                    self.masked = pygame.surface.Surface(self.size, 0)
                                    self.static = None
                                    print(f"✓ OpenCV camera initialized (STANDALONE): {video_dev} at {actual_width}x{actual_height}")
                                    camera_initialized = True
                                    break
                                time.sleep(0.1)
                            if not camera_initialized:
                                self.cv2_cap.release()
                                self.cv2_cap = None
                    except Exception as e:
                        if self.cv2_cap:
                            try:
                                self.cv2_cap.release()
                            except:
                                pass
                            self.cv2_cap = None
                        # Silently skip invalid devices
                        continue
                # If no /dev/video* devices worked, try camera indices 0-5, but stop at first working
                if not camera_initialized and (time.time() - init_start_time < max_init_time):
                    for cam_idx in range(5):  # Reduced from 10 to 5
                        if camera_initialized:
                            break
                        if time.time() - init_start_time > max_init_time:
                            break
                        try:
                            print(f"Trying camera index {cam_idx} with OpenCV (standalone mode)")
                            self.cv2_cap = cv2.VideoCapture(cam_idx)
                            if self.cv2_cap.isOpened():
                                self.cv2_cap.set(cv2.CAP_PROP_TIMEOUT, 1000)  # 1 second timeout
                                time.sleep(0.2)
                                device_start_time = time.time()
                                timeout = 2.0  # 2 second max
                                # Simplified initialization - just check if we can read a frame
                                while time.time() - device_start_time < timeout:
                                    ret, test_frame = self.cv2_cap.read()
                                    if ret and test_frame is not None and test_frame.size > 0:
                                        actual_height, actual_width = test_frame.shape[:2]
                                        self.size = (actual_width, actual_height)
                                        self.snapshot = pygame.surface.Surface(self.size, 0)
                                        self.masked = pygame.surface.Surface(self.size, 0)
                                        self.static = None
                                        print(f"✓ OpenCV camera initialized (STANDALONE) at index {cam_idx} at {actual_width}x{actual_height}")
                                        camera_initialized = True
                                        break
                                    time.sleep(0.1)
                                if not camera_initialized:
                                    self.cv2_cap.release()
                                    self.cv2_cap = None
                        except Exception as e:
                            if self.cv2_cap:
                                try:
                                    self.cv2_cap.release()
                                except:
                                    pass
                                self.cv2_cap = None
                            continue
                if not camera_initialized:
                    # Don't raise error - just log and fall back to static image
                    print("OpenCV could not initialize any camera - will use static image fallback")
                    # Continue to fallback handling below
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
                # Use imageio for camera access - only first camera
                try:
                    import imageio
                    print("Initializing imageio camera (first camera only)...")
                    # Try camera index 0 only
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
            elif self.use_pygame_camera:
                # Use pygame.camera (Linux/EYESY) - workaround for format issues
                # STANDALONE MODE: Try all video devices but use only the FIRST working one
                import glob
                import time
                video_devices = sorted(glob.glob('/dev/video*'))[:10]  # Limit to first 10 devices
                # If no /dev/video* found, try the CAM device if available
                if not video_devices and CAM and isinstance(CAM, tuple) and CAM[0]:
                    video_devices = [CAM[0]]
                init_start_time = time.time()
                max_init_time = 5.0  # Don't spend more than 5 seconds on initialization
                for video_dev in video_devices:
                    # Check timeout
                    if time.time() - init_start_time > max_init_time:
                        print("Initialization timeout - stopping camera search")
                        break
                    if camera_initialized:
                        break  # Stop at first working camera (standalone mode)
                    # Skip devices above video10 (usually not capture devices)
                    try:
                        dev_num = int(video_dev.split('video')[-1])
                        if dev_num > 10:
                            continue
                    except:
                        pass
                    print(f"Trying video device: {video_dev} (STANDALONE MODE - first camera only)")
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
                                    print(f"✓ SUCCESS! Camera initialized (STANDALONE): {video_dev} at {actual_size[0]}x{actual_size[1]}")
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
                # Check if we successfully initialized a camera after trying all devices
                if not camera_initialized:
                    if video_devices:
                        print(f"Could not initialize any camera device. Tried: {', '.join(video_devices[:5])}. Will use static image fallback.")
                    else:
                        print("No camera device available for pygame.camera. Will use static image fallback.")
            else:
                print("No camera backend available (neither OpenCV nor pygame.camera). Will use static image fallback.")
                needs_static_fallback = True
            # Check if we successfully initialized a camera
            if not camera_initialized:
                needs_static_fallback = True
        except (SystemError, Exception) as e:
            # camera not available or initialization failed
            print(f"Camera initialization error (will use static image): {e}")
            needs_static_fallback = True
        # Always set up static image fallback if no camera was initialized
        if needs_static_fallback or (not camera_initialized and self.cv2_cap is None and self.cam is None and self.webcam_lib is None and self.imageio_reader is None):
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
        # STANDALONE MODE: Draw single centered image (NOT a grid)
        if self.use_opencv and self.cv2_cap is not None:
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
        # Ensure snapshot is initialized and correct size
        if self.snapshot is None or self.snapshot.get_size()[0] == 0:
            # Fallback to static if snapshot is invalid
            if self.static is not None:
                self.snapshot = self.static.copy()
            else:
                # Create a blank surface as last resort
                self.snapshot = pygame.surface.Surface(self.size, 0)
                self.snapshot.fill((100, 100, 100))
        # Ensure snapshot is the correct size for threshold operation
        if self.snapshot.get_size() != self.size:
            self.snapshot = pygame.transform.scale(self.snapshot, self.size)
        # Ensure masked surface matches snapshot size
        if self.masked.get_size() != self.snapshot.get_size():
            self.masked = pygame.surface.Surface(self.snapshot.get_size(), 0)
        # Knob 4: Color effects/masking
        self.threshold.hsla = ((etc.knob4 * 360, 50, 50))
        self.thr_color.hsla = (360, etc.knob4 * 100, 50)
        # When set_behavior==2, set_color must be None
        try:
            pygame.transform.threshold(
                    self.masked,
                    self.snapshot,
                    self.thr_color,
                    self.threshold,
                    None,  # set_color must be None when set_behavior==2
                    2,
            )
        except Exception as e:
            # If threshold fails, just use snapshot directly
            if not hasattr(self, '_threshold_error_logged'):
                print(f"Threshold operation failed: {e}")
                self._threshold_error_logged = True
            self.masked = self.snapshot.copy()
        # Knob 1: Base size of the webcam image (0.1 to 1.0 of screen)
        base_size_scale = 0.1 + etc.knob1 * 0.9
        # Knob 2: Audio/MIDI reactivity (affects position, scale, rotation)
        reactivity = etc.knob2
        # Calculate audio reactivity
        audio_reactivity = 0.0
        if len(etc.audio_in) > 0:
            # Get average audio amplitude (normalized to 0-1)
            audio_sum = sum(abs(sample) for sample in etc.audio_in[:min(100, len(etc.audio_in))])
            audio_avg = audio_sum / (32768.0 * min(100, len(etc.audio_in)))
            # Smooth the reactivity with a simple low-pass filter
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
                    # Only try v4l2-ctl on Linux with pygame.camera
                    try:
                        if isinstance(CAM, tuple) and CAM[0]:
                            subprocess.Popen(
                                "v4l2-ctl -d {} --set-ctrl=hue={}".format(CAM[0], hue).split()
                            )
                    except:
                        pass  # Ignore if v4l2-ctl fails
        # Apply audio reactivity to scale and position
        reactive_scale = base_size_scale * (1.0 + audio_reactivity * 0.5)  # Scale can grow up to 50% with audio
        reactive_rotation = audio_reactivity * 360 * reactivity  # Rotation based on audio
        # Center position with audio-reactive offset
        center_x = etc.xres // 2
        center_y = etc.yres // 2
        # Audio affects position (bounce effect)
        offset_x = int(audio_reactivity * etc.xres * 0.1 * math.sin(time.time() * 2))
        offset_y = int(audio_reactivity * etc.yres * 0.1 * math.cos(time.time() * 2))
        # Knob 3: Distortion effects
        distortion_amount = etc.knob3
        self.distortion_time += 0.05
        # Apply distortion if knob 3 is turned up
        distorted = self.masked
        if distortion_amount > 0.05:
            # Pixelation distortion (0.05 to 0.5)
            if distortion_amount < 0.5:
                pixel_size = max(1, int(1 + (distortion_amount * 0.45) * 20))
                # Scale down then up for pixelation effect
                small_w = max(1, distorted.get_width() // pixel_size)
                small_h = max(1, distorted.get_height() // pixel_size)
                small = pygame.transform.scale(distorted, (small_w, small_h))
                distorted = pygame.transform.scale(small, (distorted.get_width(), distorted.get_height()))
            else:
                # Wave/ripple distortion (0.5 to 1.0)
                # Simpler wave effect using transform
                wave_amount = (distortion_amount - 0.5) * 2.0  # 0.0 to 1.0
                wave_offset = int(wave_amount * 10 * math.sin(self.distortion_time))
                # Apply subtle wave by rotating slightly
                wave_rotation = wave_amount * 5 * math.sin(self.distortion_time * 0.5)
                distorted = pygame.transform.rotate(distorted, wave_rotation)
                # Scale slightly for wave effect
                wave_scale = 1.0 + wave_amount * 0.1 * math.sin(self.distortion_time)
                if wave_scale != 1.0:
                    new_w = int(distorted.get_width() * wave_scale)
                    new_h = int(distorted.get_height() * wave_scale)
                    distorted = pygame.transform.scale(distorted, (new_w, new_h))
        # Calculate final scale
        final_scale = reactive_scale * (etc.xres / self.size[0])
        # Transform the webcam feed with rotation and scale
        transformed = pygame.transform.rotozoom(
            distorted,
            reactive_rotation,
            final_scale
        )
        # Calculate centered position with audio-reactive offset
        X = center_x - transformed.get_width() // 2 + offset_x
        Y = center_y - transformed.get_height() // 2 + offset_y
        # STANDALONE MODE: Blit single centered image (NOT a grid - this is the ONLY blit call)
        # This should be a SINGLE centered image, NOT a grid
        screen.blit(transformed, (int(X), int(Y)))
        # Visual indicator: Draw "STANDALONE" text in corner to prove this is the right file
        # If you see "GRID MODE" here, the WRONG FILE is being loaded!
        try:
            font = pygame.font.Font(None, 48)  # Larger font for visibility
            text = font.render("STANDALONE", True, (255, 255, 0))  # Yellow text
            screen.blit(text, (10, 10))
            # Also draw file path to confirm
            small_font = pygame.font.Font(None, 24)
            file_text = small_font.render("File: U - Webcam/main.py", True, (255, 255, 255))
            screen.blit(file_text, (10, 50))
        except:
            pass
        # DEBUG: If you see a grid here, the WRONG FILE is being loaded!
        # This file should ONLY draw ONE image, not a grid
