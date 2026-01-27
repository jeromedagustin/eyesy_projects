/**
 * Mobile UI Manager - Handles mobile-specific UI elements and interactions
 */
import { TouchManager, vibrate } from './TouchManager';

export interface MobileUICallbacks {
  onPrevMode?: () => void;
  onNextMode?: () => void;
  onTrigger?: () => void;
  onToggleTrigger?: () => void;
  onToggleControls?: () => void;
  onZoomChange?: (delta: number) => void;
  onRotationChange?: (delta: number) => void;
  onOpenBrowser?: () => void;
  onToggleFavorite?: () => void;
}

export class MobileUI {
  private container: HTMLElement;
  private callbacks: MobileUICallbacks;
  private touchManager: TouchManager | null = null;
  private controlsOpen = false;
  private currentModeName = '';
  
  // UI Elements
  private modeNavElement: HTMLElement | null = null;
  private controlsToggle: HTMLElement | null = null;
  private controlsBackdrop: HTMLElement | null = null;
  private touchHint: HTMLElement | null = null;
  
  constructor(container: HTMLElement, callbacks: MobileUICallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    
    this.createMobileElements();
    this.setupDelegatedControlClose();
    // Allow other UI components to force-close controls reliably
    window.addEventListener('eyesy:close-controls', () => this.closeControls());
    this.setupResizeListener();
    this.updateLayout();
    
    // Ensure controls panel starts closed on mobile
    if (TouchManager.isMobileScreen()) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.closeControls();
      });
    }
  }

  /**
   * Ensure the Controls panel close button always works, even if the controls
   * UI re-renders and recreates the button element.
   */
  private setupDelegatedControlClose() {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const closeBtn = target?.closest?.('#close-controls-btn');
      if (closeBtn) {
        e.preventDefault();
        this.closeControls();
      }
    });
  }

  /**
   * Set the current mode name
   */
  setModeName(name: string) {
    this.currentModeName = name;
    const modeNameEl = this.modeNavElement?.querySelector('#mode-name-btn');
    if (modeNameEl) {
      modeNameEl.textContent = name;
    }
  }

  /**
   * Update favorite button state
   */
  setFavoriteState(isFavorite: boolean) {
    const favoriteBtn = this.modeNavElement?.querySelector('#mobile-favorite-btn') as HTMLElement;
    if (favoriteBtn) {
      favoriteBtn.textContent = isFavorite ? '❤️' : '🤍';
      favoriteBtn.setAttribute('title', isFavorite ? 'Remove from favorites' : 'Add to favorites');
      favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
    }
  }

  /**
   * Initialize touch gestures on the canvas
   */
  setupCanvasTouch(canvas: HTMLCanvasElement) {
    this.touchManager = new TouchManager(canvas, {
      onTap: () => {
        // Single tap = trigger
        vibrate(30);
        this.callbacks.onTrigger?.();
        this.showTouchHint('Tap: Trigger');
      },
      onDoubleTap: () => {
        // Double tap = toggle fullscreen
        vibrate([20, 50, 20]);
        this.toggleFullscreen();
        this.showTouchHint('Double-tap: Fullscreen');
      },
      onLongPress: () => {
        // Long press = toggle trigger hold
        vibrate(100);
        this.callbacks.onToggleTrigger?.();
        this.showTouchHint('Long press: Toggle Trigger');
      },
      onSwipeLeft: () => {
        // Swipe left = next mode
        vibrate(20);
        this.callbacks.onNextMode?.();
        this.showTouchHint('← Next Mode');
      },
      onSwipeRight: () => {
        // Swipe right = prev mode
        vibrate(20);
        this.callbacks.onPrevMode?.();
        this.showTouchHint('→ Previous Mode');
      },
      onSwipeUp: () => {
        // Swipe up = open controls
        vibrate(20);
        this.openControls();
        this.showTouchHint('↑ Open Controls');
      },
      onSwipeDown: () => {
        // Swipe down = close controls
        vibrate(20);
        this.closeControls();
        this.showTouchHint('↓ Close Controls');
      },
      onPinch: (scale: number) => {
        // Pinch = zoom
        const delta = (scale - 1) * 0.1; // Scale to reasonable delta
        this.callbacks.onZoomChange?.(delta);
      },
      onRotate: (angle: number) => {
        // Rotate = rotation knob
        const delta = angle / 360; // Normalize to 0-1 range
        this.callbacks.onRotationChange?.(delta);
      }
    });
  }

  private createMobileElements() {
    // Mobile mode navigation bar (positioned at bottom of canvas)
    this.modeNavElement = document.createElement('div');
    this.modeNavElement.className = 'mode-nav-mobile';
    this.modeNavElement.innerHTML = `
      <div class="mode-nav-content">
        <button class="mode-nav-btn" id="prev-mode-btn" aria-label="Previous mode">◀</button>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <button class="mode-name" id="mode-name-btn" aria-label="Select mode">${this.currentModeName || 'Loading...'}</button>
          <button id="mobile-favorite-btn" style="
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0.25rem;
            line-height: 1;
            transition: transform 0.2s;
            min-width: 32px;
            min-height: 32px;
          " aria-label="Toggle favorite" title="Toggle favorite">🤍</button>
        </div>
        <button class="mode-nav-btn" id="next-mode-btn" aria-label="Next mode">▶</button>
      </div>
    `;
    
    // Insert into canvas container (for overlay positioning)
    const canvasContainer = this.container.querySelector('.canvas-container');
    if (canvasContainer) {
      canvasContainer.appendChild(this.modeNavElement);
    }
    
    // Mode nav buttons
    const prevBtn = this.modeNavElement.querySelector('#prev-mode-btn');
    const nextBtn = this.modeNavElement.querySelector('#next-mode-btn');
    const modeNameBtn = this.modeNavElement.querySelector('#mode-name-btn');
    
    prevBtn?.addEventListener('click', () => {
      vibrate(20);
      this.callbacks.onPrevMode?.();
    });
    
    nextBtn?.addEventListener('click', () => {
      vibrate(20);
      this.callbacks.onNextMode?.();
    });
    
    // Make mode name clickable to open browser
    modeNameBtn?.addEventListener('click', () => {
      vibrate(30);
      this.callbacks.onOpenBrowser?.();
    });
    
    // Favorite button
    const favoriteBtn = this.modeNavElement.querySelector('#mobile-favorite-btn') as HTMLElement;
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        vibrate(20);
        this.callbacks.onToggleFavorite?.();
      });
    }
    
    // Controls toggle button (FAB)
    this.controlsToggle = document.createElement('button');
    this.controlsToggle.className = 'controls-toggle';
    this.controlsToggle.innerHTML = '⚙️';
    this.controlsToggle.setAttribute('aria-label', 'Toggle controls');
    this.controlsToggle.addEventListener('click', () => {
      vibrate(30);
      this.toggleControls();
    });
    this.container.appendChild(this.controlsToggle);
    
    // Backdrop for controls panel
    this.controlsBackdrop = document.createElement('div');
    this.controlsBackdrop.className = 'controls-backdrop';
    this.controlsBackdrop.addEventListener('click', () => {
      this.closeControls();
    });
    this.container.appendChild(this.controlsBackdrop);
    
    // Touch hint element
    this.touchHint = document.createElement('div');
    this.touchHint.className = 'touch-hint';
    const canvasContainerForHint = this.container.querySelector('.canvas-container');
    if (canvasContainerForHint) {
      canvasContainerForHint.appendChild(this.touchHint);
    }
  }

  private setupResizeListener() {
    let resizeTimeout: number;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.updateLayout();
      }, 100);
    });
    
    // Also listen for orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateLayout(), 100);
    });
  }

  private updateLayout() {
    const layoutType = TouchManager.getLayoutType();
    const isMobile = layoutType === 'phone-portrait' || layoutType === 'phone-landscape';
    const isLandscape = window.innerWidth > window.innerHeight;
    const isPortrait = !isLandscape;
    
    // Update body class for CSS
    document.body.classList.toggle('mobile', isMobile);
    document.body.classList.toggle('tablet', layoutType === 'tablet');
    document.body.classList.toggle('desktop', layoutType === 'desktop');
    document.body.classList.toggle('landscape', isLandscape);
    document.body.classList.toggle('portrait', isPortrait);
    
    // Show/hide mobile elements
    if (this.modeNavElement) {
      // Hide mode nav in landscape to maximize canvas space
      this.modeNavElement.style.display = (isMobile && isPortrait) ? 'block' : 'none';
    }
    if (this.controlsToggle) {
      // Hide controls toggle in landscape (controls are always visible side-by-side)
      this.controlsToggle.style.display = (isMobile && isPortrait) ? 'flex' : 'none';
    }
    
    // Show/hide FX button on mobile
    const fxButton = document.getElementById('fx-button');
    if (fxButton) {
      // Always show FX button on mobile (positioned by CSS)
      fxButton.style.display = isMobile ? 'flex' : 'flex';
    }
    
    // Show/hide settings button on mobile
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      // Always show settings button on mobile (positioned by CSS)
      settingsButton.style.display = isMobile ? 'flex' : 'flex';
    }
    
    // Handle controls visibility based on orientation
    const controlsPanel = this.container.querySelector('.controls-panel') as HTMLElement;
    if (controlsPanel) {
      if (isLandscape) {
        // In landscape, show controls side-by-side (CSS handles this)
        controlsPanel.classList.remove('collapsed');
        controlsPanel.classList.remove('open'); // Remove open class, let CSS handle positioning
      } else if (isMobile) {
        // On mobile portrait, ensure controls start closed (overlay)
        this.closeControls();
        controlsPanel.classList.remove('open');
      } else {
        // On desktop, ensure controls are visible
        this.closeControls();
        controlsPanel.classList.remove('open', 'collapsed');
      }
    }
  }

  private showTouchHint(message: string) {
    if (!this.touchHint) return;
    
    this.touchHint.textContent = message;
    this.touchHint.classList.add('visible');
    
    // Hide after 1.5 seconds
    setTimeout(() => {
      this.touchHint?.classList.remove('visible');
    }, 1500);
  }

  toggleControls() {
    if (this.controlsOpen) {
      this.closeControls();
    } else {
      this.openControls();
    }
  }

  openControls() {
    this.controlsOpen = true;
    
    const controlsPanel = this.container.querySelector('.controls-panel');
    if (controlsPanel) {
      controlsPanel.classList.add('open');
      controlsPanel.classList.remove('collapsed');
    }
    
    this.controlsBackdrop?.classList.add('visible');
    
    if (this.controlsToggle) {
      this.controlsToggle.innerHTML = '✕';
      this.controlsToggle.style.display = 'none'; // Hide FAB when panel is open
    }
    
    // Setup close button listener
    const closeBtn = document.getElementById('close-controls-btn');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeControls();
    }
    
    this.callbacks.onToggleControls?.();
  }

  closeControls() {
    this.controlsOpen = false;
    
    const controlsPanel = this.container.querySelector('.controls-panel');
    if (controlsPanel) {
      controlsPanel.classList.remove('open');
      // On mobile, ensure it's collapsed/hidden
      if (TouchManager.isMobileScreen()) {
        // Don't add 'collapsed' class as CSS handles the transform
        // Just ensure 'open' is removed so it slides off screen
      }
    }
    
    this.controlsBackdrop?.classList.remove('visible');
    
    if (this.controlsToggle) {
      this.controlsToggle.innerHTML = '⚙️';
      // Show FAB again on mobile
      if (TouchManager.isMobileScreen()) {
        this.controlsToggle.style.display = 'flex';
      }
    }
    
    this.callbacks.onToggleControls?.();
  }

  private toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.container.requestFullscreen?.().catch(err => {
        console.warn('Fullscreen not supported:', err);
      });
    } else {
      document.exitFullscreen?.();
    }
  }

  /**
   * Check if controls panel is currently open
   */
  isControlsOpen(): boolean {
    return this.controlsOpen;
  }

  /**
   * Update FAB position based on left-handed mode
   */
  updateFABPosition(leftHanded: boolean) {
    if (!this.controlsToggle) return;
    
    if (leftHanded) {
      this.controlsToggle.classList.add('left-handed');
      this.controlsToggle.classList.remove('right-handed');
    } else {
      this.controlsToggle.classList.add('right-handed');
      this.controlsToggle.classList.remove('left-handed');
    }
    
    // Also update FX button position
    const fxButton = document.getElementById('fx-button');
    if (fxButton) {
      if (leftHanded) {
        fxButton.classList.add('left-handed');
        fxButton.classList.remove('right-handed');
      } else {
        fxButton.classList.add('right-handed');
        fxButton.classList.remove('left-handed');
      }
    }
    
    // Also update settings button position
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      if (leftHanded) {
        settingsButton.classList.add('left-handed');
        settingsButton.classList.remove('right-handed');
      } else {
        settingsButton.classList.add('right-handed');
        settingsButton.classList.remove('left-handed');
      }
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this.touchManager?.destroy();
    this.modeNavElement?.remove();
    this.controlsToggle?.remove();
    this.controlsBackdrop?.remove();
    this.touchHint?.remove();
  }
}

