/**
 * Touch Manager - Handle touch gestures for mobile controls
 */
export interface TouchCallbacks {
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onRotate?: (angle: number) => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export class TouchManager {
  private element: HTMLElement;
  private callbacks: TouchCallbacks;
  
  // Touch state
  private touchStartPoint: TouchPoint | null = null;
  private lastTapTime = 0;
  private longPressTimer: number | null = null;
  private isSwiping = false;
  
  // Multi-touch state
  private initialPinchDistance = 0;
  private initialRotationAngle = 0;
  
  // Configuration
  private readonly TAP_THRESHOLD = 10; // pixels - max movement for tap
  private readonly SWIPE_THRESHOLD = 50; // pixels - min movement for swipe
  private readonly DOUBLE_TAP_DELAY = 300; // ms
  private readonly LONG_PRESS_DELAY = 500; // ms
  
  constructor(element: HTMLElement, callbacks: TouchCallbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  /**
   * Update callbacks at runtime
   */
  setCallbacks(callbacks: Partial<TouchCallbacks>) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private setupEventListeners() {
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleTouchStart(e: TouchEvent) {
    // Single touch
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.touchStartPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      this.isSwiping = false;
      
      // Start long press timer
      this.longPressTimer = window.setTimeout(() => {
        if (this.touchStartPoint && !this.isSwiping) {
          this.callbacks.onLongPress?.();
          this.touchStartPoint = null; // Prevent other actions
        }
      }, this.LONG_PRESS_DELAY);
    }
    
    // Two-finger touch (pinch/rotate)
    if (e.touches.length === 2) {
      this.clearLongPressTimer();
      this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
      this.initialRotationAngle = this.getAngle(e.touches[0], e.touches[1]);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.touchStartPoint) return;
    
    // Single touch - check for swipe
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStartPoint.x;
      const deltaY = touch.clientY - this.touchStartPoint.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > this.TAP_THRESHOLD) {
        this.isSwiping = true;
        this.clearLongPressTimer();
      }
    }
    
    // Two-finger touch - pinch and rotate
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent browser zoom
      
      const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
      const currentAngle = this.getAngle(e.touches[0], e.touches[1]);
      
      // Pinch
      if (this.initialPinchDistance > 0) {
        const scale = currentDistance / this.initialPinchDistance;
        this.callbacks.onPinch?.(scale);
        this.initialPinchDistance = currentDistance; // Update for continuous gesture
      }
      
      // Rotate
      const angleDelta = currentAngle - this.initialRotationAngle;
      if (Math.abs(angleDelta) > 2) { // Minimum rotation threshold
        this.callbacks.onRotate?.(angleDelta);
        this.initialRotationAngle = currentAngle;
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    this.clearLongPressTimer();
    
    if (!this.touchStartPoint) return;
    
    const endPoint = e.changedTouches[0];
    const deltaX = endPoint.clientX - this.touchStartPoint.x;
    const deltaY = endPoint.clientY - this.touchStartPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - this.touchStartPoint.time;
    
    // Tap detection (quick touch with minimal movement)
    if (distance < this.TAP_THRESHOLD && duration < 300) {
      const now = Date.now();
      
      // Double tap detection
      if (now - this.lastTapTime < this.DOUBLE_TAP_DELAY) {
        this.callbacks.onDoubleTap?.();
        this.lastTapTime = 0; // Reset to prevent triple-tap
      } else {
        // Single tap - with delay to detect double tap
        setTimeout(() => {
          if (Date.now() - this.lastTapTime >= this.DOUBLE_TAP_DELAY) {
            this.callbacks.onTap?.();
          }
        }, this.DOUBLE_TAP_DELAY);
        this.lastTapTime = now;
      }
    }
    // Swipe detection
    else if (distance > this.SWIPE_THRESHOLD && this.isSwiping) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Determine swipe direction
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.callbacks.onSwipeRight?.();
        } else {
          this.callbacks.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.callbacks.onSwipeDown?.();
        } else {
          this.callbacks.onSwipeUp?.();
        }
      }
    }
    
    this.touchStartPoint = null;
    this.isSwiping = false;
  }

  private handleTouchCancel() {
    this.clearLongPressTimer();
    this.touchStartPoint = null;
    this.isSwiping = false;
  }

  private clearLongPressTimer() {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getAngle(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Check if device supports touch
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Check if device is mobile based on screen size
   */
  static isMobileScreen(): boolean {
    return window.innerWidth <= 768;
  }

  /**
   * Get current device layout type
   */
  static getLayoutType(): 'phone-portrait' | 'phone-landscape' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    
    if (width <= 480 || (isPortrait && width <= 768)) {
      return isPortrait ? 'phone-portrait' : 'phone-landscape';
    }
    if (width <= 1024) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.clearLongPressTimer();
    // Note: Event listeners are automatically cleaned up when element is removed
  }
}

/**
 * Vibrate device for haptic feedback (if supported)
 */
export function vibrate(pattern: number | number[] = 50): boolean {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
    return true;
  }
  return false;
}

/**
 * Request wake lock to prevent screen sleep during performance
 */
export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if ('wakeLock' in navigator) {
    try {
      return await navigator.wakeLock.request('screen');
    } catch (err) {
      console.warn('Wake Lock not available:', err);
    }
  }
  return null;
}

