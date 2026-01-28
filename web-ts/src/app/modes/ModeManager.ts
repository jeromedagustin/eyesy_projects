/**
 * Mode management - loading, switching, navigation
 */
import { Mode } from '../../modes/base/Mode';
import { ModeInfo } from '../../ui/ModeSelector';
import { ModeGrouper } from '../../core/ModeGrouper';
import { modes } from '../../modes/index';

export interface ModeManagerContext {
  // State properties (read-only access)
  getCurrentMode(): Mode | null;
  getCurrentModeIndex(): number;
  getSortedModes(): ModeInfo[];
  getNavigationModes(): ModeInfo[];
  getPreviousModeInfo(): ModeInfo | null;
  getPendingModeInfo(): ModeInfo | null;
  getPendingMode(): Mode | null;
  getTransitionsEnabled(): boolean;
  getShowOnlyFavorites(): boolean;
  getFavorites(): string[];
  getWebcamPermissionGranted(): boolean;
  getHasUploadedImages(): boolean;
  getUseMicrophone(): boolean;
  getMockAudioEnabled(): boolean;
  
  // Methods
  updateStatus(message: string): void;
  updateHeaderModeName(name: string): void;
  ensureColorContrast(): void;
  updateWebcamCompositorForMode(modeInfo: ModeInfo): void;
  updateFavoriteButtons(): void;
  startAnimation(): void;
  loadMode(modeInfo: ModeInfo): Promise<void>;
  getTransitionManager(): any; // TransitionManager
  getAnimationId(): number | null;
  
  // Setters
  setCurrentModeIndex(index: number): void;
  setSortedModes(modes: ModeInfo[]): void;
  setNavigationModes(modes: ModeInfo[]): void;
  setPendingModeInfo(info: ModeInfo | null): void;
  setPendingMode(mode: Mode | null): void;
}

export class ModeManager {
  private context: ModeManagerContext;

  constructor(context: ModeManagerContext) {
    this.context = context;
  }

  /**
   * Create navigation order for arrow key navigation
   */
  createNavigationOrder(modes: ModeInfo[]): ModeInfo[] {
    // Category priority order (lower = earlier in navigation)
    const categoryOrder: Record<string, number> = {
      'scopes': 1,
      'triggers': 2,
      'lfo': 3,
      'time': 4,
      'noise': 5,
      'geometric': 6,
      'pattern': 7,
      '3d': 8,
      'utilities': 9,
      'font': 10,
    };
    
    // Sort modes: by category priority, then alphabetically within category
    const sorted = [...modes].sort((a, b) => {
      const aCategory = categoryOrder[a.category] || 99;
      const bCategory = categoryOrder[b.category] || 99;
      
      if (aCategory !== bCategory) {
        return aCategory - bCategory;
      }
      
      // Within same category, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return sorted;
  }

  /**
   * Update mode selector with current state
   */
  updateModeSelector(): void {
    const ctx = this.context;
    
    // Helper to check if a mode is an image mode
    const isImageMode = (mode: ModeInfo): boolean => {
      const nameLower = mode.name.toLowerCase();
      return nameLower.startsWith('image -') || nameLower.includes('slideshow');
    };

    // Helper to check if a mode is a scope mode
    const isScopeMode = (mode: ModeInfo): boolean => {
      return mode.category === 'scopes';
    };

    // Check if microphone is enabled
    const micEnabled = ctx.getUseMicrophone() && (ctx as any).microphoneAudio?.active;
    
    // Check if mock audio is enabled (allows scope modes to work without real mic)
    const audioAvailable = micEnabled || (ctx.getMockAudioEnabled() && !ctx.getUseMicrophone());

    // Process modes with current permission states
    let processedModes = [...modes].map(mode => {
      // Mark webcam mode as disabled if permission not granted
      if (mode.id === 'u---webcam' && !ctx.getWebcamPermissionGranted()) {
        return { ...mode, disabled: true };
      }
      // Mark image modes as disabled if no images uploaded
      if (isImageMode(mode) && !ctx.getHasUploadedImages()) {
        return { ...mode, disabled: true };
      }
      // Mark scope modes as disabled if neither microphone nor mock audio is enabled
      if (isScopeMode(mode) && !audioAvailable) {
        return { ...mode, disabled: true };
      }
      return { ...mode, disabled: false };
    });

    // Filter by favorites if enabled
    if (ctx.getShowOnlyFavorites() && ctx.getFavorites().length > 0) {
      // Always include the current mode in the list, even if not favorited
      // This ensures navigation works correctly
      const currentModeId = ctx.getPreviousModeInfo()?.id;
      processedModes = processedModes.filter(mode => 
        ctx.getFavorites().includes(mode.id) || mode.id === currentModeId
      );
    }

    // Use intelligent grouping for browser/dropdown (same as setupModeSelector)
    const sortedModes = ModeGrouper.groupModes(processedModes);
    ctx.setSortedModes(sortedModes);

    // Create simpler navigation order for arrow keys: by category, then alphabetical
    const navigationModes = this.createNavigationOrder(processedModes);
    ctx.setNavigationModes(navigationModes);
  }

  /**
   * Navigate to next/previous mode
   */
  navigateMode(direction: 1 | -1): void {
    const ctx = this.context;
    const modesToUse = ctx.getNavigationModes().length > 0 ? ctx.getNavigationModes() : ctx.getSortedModes();
    
    if (modesToUse.length === 0) return;
    
    // Don't navigate if transition is active or mode is loading
    const transitionManager = ctx.getTransitionManager();
    const transitionActive = transitionManager.isActive();
    const transitionStartTime = transitionManager.getStartTime();
    const maxTransitionTime = 10.0; // 10 seconds max
    const transitionStuck = transitionActive && transitionStartTime > 0 && 
      (performance.now() - transitionStartTime) / 1000 > maxTransitionTime;
    
    // If transitions are disabled, ignore transition state
    if (ctx.getTransitionsEnabled()) {
      if ((transitionActive && !transitionStuck) || (ctx.getPendingModeInfo() !== null && !transitionStuck)) {
        return;
      }
      
      // If transition is stuck, cancel it
      if (transitionStuck) {
        console.warn('Transition appears stuck, canceling to allow navigation');
        transitionManager.cancel();
        ctx.setPendingModeInfo(null);
        ctx.setPendingMode(null);
      }
    } else {
      // Transitions disabled - only block if mode is actively loading
      if (ctx.getPendingModeInfo() !== null) {
        return;
      }
    }
    
    // Find current mode index in navigation order
    let currentIndex = ctx.getCurrentModeIndex();
    if (currentIndex < 0 || currentIndex >= modesToUse.length) {
      // Find by ID if index is invalid
      const currentModeId = ctx.getPreviousModeInfo()?.id;
      if (currentModeId) {
        currentIndex = modesToUse.findIndex(m => m.id === currentModeId);
        if (currentIndex === -1) {
          currentIndex = 0;
        }
      } else {
        currentIndex = 0;
      }
    }
    
    // Find next enabled mode
    let attempts = 0;
    let newIndex = currentIndex;
    while (attempts < modesToUse.length) {
      newIndex = (newIndex + direction + modesToUse.length) % modesToUse.length;
      if (!modesToUse[newIndex].disabled) {
        break;
      }
      attempts++;
    }
    
    if (newIndex !== currentIndex) {
      ctx.setCurrentModeIndex(newIndex);
      ctx.loadMode(modesToUse[newIndex]);
    }
  }

  /**
   * Update navigation button states
   */
  updateNavigationButtons(): void {
    const ctx = this.context;
    const prevModeHeaderBtn = document.getElementById('prev-mode-header-btn') as HTMLButtonElement;
    const nextModeHeaderBtn = document.getElementById('next-mode-header-btn') as HTMLButtonElement;
    
    // Check if navigation should be disabled
    const transitionManager = ctx.getTransitionManager();
    const isTransitionActive = transitionManager.isActive();
    const isModeLoading = ctx.getPendingModeInfo() !== null;
    const canNavigate = !isTransitionActive && !isModeLoading;
    
    // Check if there are enabled modes in each direction
    let canGoPrev = false;
    let canGoNext = false;
    
    const sortedModes = ctx.getSortedModes();
    const currentModeIndex = ctx.getCurrentModeIndex();
    
    if (canNavigate && sortedModes.length > 0 && currentModeIndex >= 0) {
      // Check previous direction
      let attempts = 0;
      let checkIndex = currentModeIndex;
      while (attempts < sortedModes.length) {
        checkIndex = (checkIndex - 1 + sortedModes.length) % sortedModes.length;
        if (!sortedModes[checkIndex].disabled) {
          canGoPrev = true;
          break;
        }
        attempts++;
      }
      
      // Check next direction
      attempts = 0;
      checkIndex = currentModeIndex;
      while (attempts < sortedModes.length) {
        checkIndex = (checkIndex + 1) % sortedModes.length;
        if (!sortedModes[checkIndex].disabled) {
          canGoNext = true;
          break;
        }
        attempts++;
      }
    }
    
    // Update previous button
    if (prevModeHeaderBtn) {
      const shouldDisable = !canNavigate || !canGoPrev;
      prevModeHeaderBtn.disabled = shouldDisable;
      prevModeHeaderBtn.style.opacity = shouldDisable ? '0.5' : '1';
      prevModeHeaderBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
    
    // Update next button
    if (nextModeHeaderBtn) {
      const shouldDisable = !canNavigate || !canGoNext;
      nextModeHeaderBtn.disabled = shouldDisable;
      nextModeHeaderBtn.style.opacity = shouldDisable ? '0.5' : '1';
      nextModeHeaderBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
    
    // Also update mobile navigation buttons if they exist
    const prevModeBtn = document.getElementById('prev-mode-btn') as HTMLButtonElement;
    const nextModeBtn = document.getElementById('next-mode-btn') as HTMLButtonElement;
    
    if (prevModeBtn) {
      const shouldDisable = !canNavigate || !canGoPrev;
      prevModeBtn.disabled = shouldDisable;
      prevModeBtn.style.opacity = shouldDisable ? '0.5' : '1';
      prevModeBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
    
    if (nextModeBtn) {
      const shouldDisable = !canNavigate || !canGoNext;
      nextModeBtn.disabled = shouldDisable;
      nextModeBtn.style.opacity = shouldDisable ? '0.5' : '1';
      nextModeBtn.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
    }
  }
}
