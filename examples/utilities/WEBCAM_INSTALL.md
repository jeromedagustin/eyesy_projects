# Installing Camera Libraries on EYESY

The webcam modes now support multiple camera backends. If one doesn't work, try installing another.

## ⚠️ IMPORTANT: Read-Only Filesystem Issue

**If you get "Read-only file system" errors**, EYESY's root filesystem is mounted read-only. You need to remount it as read-write first:

```bash
# Remount root filesystem as read-write
sudo mount -o remount,rw /

# Now try installing packages
sudo apt update
sudo apt install python3-opencv
```

**Note:** After rebooting, the filesystem will be read-only again. If you need packages to persist, you may need to install them to a writable location or configure the system to remount as read-write on boot.

## Installation Options (in order of preference):

### 1. OpenCV (Best, but may not be installable)
```bash
# Try via system package manager (EYESY may use opkg or apt)
# IMPORTANT: Use sudo for apt commands!
sudo opkg install python3-opencv
# OR if using apt:
sudo apt install python3-opencv
```

### 2. webcam library (May not be in package manager)
If available via package manager:
```bash
# IMPORTANT: Use sudo for apt/opkg commands!
sudo apt install python3-webcam
# OR
sudo opkg install python3-webcam
```

If not available, you may need to use pip with system packages override:
```bash
pip3 install webcam --break-system-packages
```

### 3. imageio (May be in package manager)
```bash
# IMPORTANT: Use sudo for apt/opkg commands!
sudo apt install python3-imageio
# OR
sudo opkg install python3-imageio
```

### 4. pygame.camera (Built-in, but has compatibility issues)
Already included with pygame - no installation needed, but may not work with all cameras.

## Important Note for EYESY:

**IMPORTANT: Always use `sudo` for package installation commands!**

EYESY uses a system-managed Python environment. If `pip3` tells you to use `apt install` instead, that means you should use the system package manager. Try:

```bash
# Check what Python camera packages are available (no sudo needed for search)
apt search python3 | grep -i camera
apt search python3 | grep -i opencv
apt search python3 | grep -i imageio

# Or if EYESY uses opkg (no sudo needed for list):
opkg list | grep -i python3 | grep -i camera
opkg list | grep -i python3 | grep -i opencv
```

**For installation, always use sudo:**
```bash
sudo apt install <package-name>
# OR
sudo opkg install <package-name>
```

## Alternative Solutions if Package Installation Fails

### Option 1: Remount Filesystem as Read-Write

If you get "Read-only file system" errors:

```bash
# Remount root filesystem as read-write
sudo mount -o remount,rw /

# Update package lists
sudo apt update

# Now install packages
sudo apt install python3-opencv
```

**Important:** The filesystem will revert to read-only after reboot. If you need persistent packages, consider installing to a writable location (like `/home` or SD card).

### Option 2: Use pygame.camera (Already Available)

The code already tries `pygame.camera` as a fallback. If it's detecting your camera (`/dev/video2` in your case) but not showing images, the issue might be format compatibility. The code includes workarounds for this.

### Option 3: Using System Tools (No Python Packages Needed)

If you can't install Python packages, the code will try to use `ffmpeg` (if available) as a last resort. Check if ffmpeg is installed:

```bash
which ffmpeg
# OR
ffmpeg -version
```

If ffmpeg is not installed, you can try:
```bash
# IMPORTANT: Use sudo for apt/opkg commands!
sudo apt install ffmpeg
# OR
sudo opkg install ffmpeg
```

The code will automatically try to use ffmpeg if no Python camera libraries are available.

## How It Works:

The code tries libraries in this order:
1. OpenCV (if installed)
2. webcam library (if installed)
3. imageio (if installed)
4. pygame.camera (fallback)

If none work, the mode will use a static fallback image.

## Troubleshooting

### Read-Only Filesystem Error

If you see "Read-only file system" when trying to install:
1. Remount as read-write: `sudo mount -o remount,rw /`
2. Try installation again
3. If it still fails, the system may have additional protections

### Camera Detected But No Image

If the console shows a camera was found (e.g., `/dev/video2`) but no image appears:
- This is often a format compatibility issue with `pygame.camera`
- Try installing OpenCV (if filesystem allows)
- Or check if the camera needs specific format settings (the code tries to handle this automatically)

### No Camera Found

If no cameras are detected:
- Check available devices: `ls -l /dev/video*`
- Verify camera is connected and recognized by the system
- Some USB cameras may need specific drivers

## Testing:

After installing a library (or if using pygame.camera), restart the EYESY mode. Check the console output to see which library is being used:
- `OpenCV available for camera access`
- `webcam library available for camera access`
- `imageio available for camera access`
- `Trying pygame.camera as fallback`

Look for initialization messages:
- `✓ OpenCV camera initialized (STANDALONE): /dev/video2` (non-grid mode)
- `✓ Camera 1 initialized: /dev/video2` (grid mode)

