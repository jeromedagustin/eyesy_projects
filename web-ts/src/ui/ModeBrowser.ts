/**
 * Mode Browser - Grid view for browsing modes
 */
import { ModeInfo } from './ModeSelector';

export class ModeBrowser {
  private container: HTMLElement;
  private modes: ModeInfo[] = [];
  private onModeSelect?: (mode: ModeInfo) => void;
  private onFavoriteToggle?: (modeId: string, isFavorite: boolean) => void;
  private favorites: Set<string> = new Set();
  private isVisible = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  setModes(modes: ModeInfo[]) {
    this.modes = modes;
    this.updateGrid();
  }

  setOnModeSelect(callback: (mode: ModeInfo) => void) {
    this.onModeSelect = callback;
  }

  setOnFavoriteToggle(callback: (modeId: string, isFavorite: boolean) => void) {
    this.onFavoriteToggle = callback;
  }

  setFavorites(favorites: string[]) {
    this.favorites = new Set(favorites);
    this.updateGrid();
  }

  toggle() {
    this.isVisible = !this.isVisible;
    const overlay = this.container.querySelector('#mode-browser-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = this.isVisible ? 'block' : 'none';
      if (this.isVisible) {
        // Scroll to current mode when opening
        setTimeout(() => this.scrollToCurrentMode(), 100);
      }
    } else {
      this.container.style.display = this.isVisible ? 'block' : 'none';
    }
  }
  
  setCurrentMode(modeId: string) {
    this.currentModeId = modeId;
  }
  
  private currentModeId: string | null = null;
  
  private scrollToCurrentMode() {
    if (!this.currentModeId) return;
    
    const grid = document.getElementById('mode-grid');
    if (!grid) return;
    
    // Find the card for the current mode
    const cards = grid.querySelectorAll('[data-mode-id]');
    cards.forEach(card => {
      if ((card as HTMLElement).dataset.modeId === this.currentModeId) {
        // Scroll to the card
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight it briefly
        const htmlCard = card as HTMLElement;
        const originalBorder = htmlCard.style.borderColor;
        htmlCard.style.borderColor = '#4a9eff';
        htmlCard.style.boxShadow = '0 0 20px rgba(74, 158, 255, 0.5)';
        setTimeout(() => {
          htmlCard.style.borderColor = originalBorder;
          htmlCard.style.boxShadow = '';
        }, 2000);
      }
    });
  }

  show() {
    this.isVisible = true;
    const overlay = this.container.querySelector('#mode-browser-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = 'block';
    } else {
      this.container.style.display = 'block';
    }
  }

  hide() {
    this.isVisible = false;
    const overlay = this.container.querySelector('#mode-browser-overlay') as HTMLElement;
    if (overlay) {
      overlay.style.display = 'none';
    } else {
      this.container.style.display = 'none';
    }
  }

  private render() {
    this.container.innerHTML = `
      <div id="mode-browser-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        padding: 1rem;
        overflow-y: auto;
        display: none;
        -webkit-overflow-scrolling: touch;
      ">
        <div style="max-width: 1400px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
            <h2 style="font-size: 1.5rem; margin: 0;">Mode Browser</h2>
            <button id="close-browser" style="
              padding: 0.75rem 1.5rem;
              background: #4a9eff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
              min-height: 44px;
              touch-action: manipulation;
            ">Close (ESC)</button>
          </div>
          <div id="mode-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
          "></div>
          <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #3a3a3a; color: #888; font-size: 0.9rem;">
            Tap a mode to load it. Press ESC or click Close to exit.
          </div>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('close-browser');
    closeBtn?.addEventListener('click', () => this.hide());

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    this.updateGrid();
  }

  private updateGrid() {
    const grid = document.getElementById('mode-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Group by category
    const categories = new Map<string, ModeInfo[]>();
    this.modes.forEach(mode => {
      if (!categories.has(mode.category)) {
        categories.set(mode.category, []);
      }
      categories.get(mode.category)!.push(mode);
    });

    // Render each category
    const sortedCategories = Array.from(categories.keys()).sort();
    sortedCategories.forEach(category => {
      // Create category container
      const categoryContainer = document.createElement('div');
      categoryContainer.style.cssText = 'grid-column: 1 / -1; margin-top: 2rem;';
      if (sortedCategories.indexOf(category) === 0) {
        categoryContainer.style.marginTop = '0';
      }
      
      // Create collapsible header
      const categoryHeader = document.createElement('div');
      categoryHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: #1a1a1a;
        border: 1px solid #3a3a3a;
        border-radius: 4px;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
      `;
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categoryTitle.style.cssText = 'margin: 0; font-size: 1.2rem; color: #4a9eff; font-weight: 600;';
      
      const expandIcon = document.createElement('span');
      expandIcon.textContent = '▶';
      expandIcon.style.cssText = 'font-size: 0.8rem; color: #888; transition: transform 0.2s; margin-left: 1rem;';
      expandIcon.className = 'category-expand-icon';
      
      categoryHeader.appendChild(categoryTitle);
      categoryHeader.appendChild(expandIcon);
      
      // Create collapsible content container
      const categoryContent = document.createElement('div');
      categoryContent.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #3a3a3a;
      `;
      categoryContent.className = 'category-content';
      categoryContent.setAttribute('data-expanded', 'false');
      
      // Function to calculate number of columns and show/hide items accordingly
      const updateCollapsedState = () => {
        const isExpanded = categoryContent.getAttribute('data-expanded') === 'true';
        if (isExpanded) {
          // Show all items
          const cards = categoryContent.querySelectorAll('[data-mode-id]');
          cards.forEach(card => {
            (card as HTMLElement).style.display = '';
          });
        } else {
          // Collapse: show only first row
          // Calculate number of columns by checking the actual rendered grid
          // First, temporarily show all items to get accurate column count
          const cards = categoryContent.querySelectorAll('[data-mode-id]');
          const allCards = Array.from(cards) as HTMLElement[];
          
          // Show all cards temporarily to measure
          allCards.forEach(card => {
            card.style.display = '';
          });
          
          // Force a reflow to ensure layout is calculated
          void categoryContent.offsetHeight;
          
          // Calculate columns by checking the position of the second row's first item
          let itemsPerRow = allCards.length; // Default to all if we can't determine
          
          if (allCards.length > 0) {
            const firstCard = allCards[0];
            const firstCardRect = firstCard.getBoundingClientRect();
            const firstCardTop = firstCardRect.top;
            
            // Find the first card that's on a different row (different top position)
            for (let i = 1; i < allCards.length; i++) {
              const cardRect = allCards[i].getBoundingClientRect();
              // If this card is on a different row (different top), we've found the row break
              if (Math.abs(cardRect.top - firstCardTop) > 10) {
                itemsPerRow = i;
                break;
              }
            }
          }
          
          // Now hide items beyond the first row
          allCards.forEach((card, index) => {
            if (index < itemsPerRow) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        }
      };
      
      // Toggle collapse/expand on header click
      categoryHeader.addEventListener('click', () => {
        const isExpanded = categoryContent.getAttribute('data-expanded') === 'true';
        if (isExpanded) {
          // Collapse: show only first row
          categoryContent.setAttribute('data-expanded', 'false');
          expandIcon.textContent = '▶';
          expandIcon.style.transform = 'rotate(0deg)';
        } else {
          // Expand: show all items
          categoryContent.setAttribute('data-expanded', 'true');
          expandIcon.textContent = '▼';
          expandIcon.style.transform = 'rotate(0deg)';
        }
        updateCollapsedState();
      });
      
      // Update on window resize to recalculate columns
      let resizeTimeout: number | null = null;
      window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          if (categoryContent.getAttribute('data-expanded') === 'false') {
            updateCollapsedState();
          }
        }, 100);
      });
      
      categoryHeader.addEventListener('mouseenter', () => {
        categoryHeader.style.background = '#222';
      });
      
      categoryHeader.addEventListener('mouseleave', () => {
        categoryHeader.style.background = '#1a1a1a';
      });
      
      categoryContainer.appendChild(categoryHeader);
      categoryContainer.appendChild(categoryContent);
      grid.appendChild(categoryContainer);

      // Sort modes: non-experimental first, then experimental
      const categoryModes = categories.get(category)!;
      categoryModes.sort((a, b) => {
        if (a.experimental === b.experimental) return 0;
        return a.experimental ? 1 : -1; // Experimental modes go to bottom
      });

      categoryModes.forEach(mode => {
        const card = document.createElement('div');
        const isDisabled = mode.disabled || false;
        const isCurrentMode = mode.id === this.currentModeId;
        
        // Determine disabled reason
        let disabledReason = '';
        if (isDisabled) {
          const nameLower = mode.name.toLowerCase();
          if (nameLower.startsWith('image -') || nameLower.includes('slideshow')) {
            disabledReason = '(No Images)';
          } else if (nameLower.startsWith('webcam')) {
            disabledReason = '(Enable Webcam)';
          } else if (mode.category === 'scopes') {
            disabledReason = '(Enable Microphone)';
          } else {
            disabledReason = '(Requires Permission)';
          }
        }
        
        // Set data attribute for finding current mode
        card.setAttribute('data-mode-id', mode.id);
        
        card.style.cssText = `
          background: #2a2a2a;
          border: 2px solid ${isCurrentMode ? '#4a9eff' : mode.experimental ? '#ff6b6b' : isDisabled ? '#666' : '#3a3a3a'};
          border-radius: 8px;
          padding: 1rem;
          cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
          transition: all 0.2s;
          opacity: ${mode.experimental || isDisabled ? '0.7' : '1'};
          ${isCurrentMode ? 'box-shadow: 0 0 20px rgba(74, 158, 255, 0.3);' : ''}
        `;
        const isFavorite = this.favorites.has(mode.id);
        const heartIcon = isFavorite ? '❤️' : '🤍';
        
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div style="font-weight: bold; color: ${isDisabled ? '#888' : '#fff'}; flex: 1;">
              ${mode.name}${mode.experimental ? ' <span style="color: #ff6b6b; font-size: 0.8em;">(Experimental)</span>' : ''}${isDisabled ? ` <span style="color: #888; font-size: 0.8em;">${disabledReason}</span>` : ''}
            </div>
            <button class="favorite-btn" data-mode-id="${mode.id}" style="
              background: none;
              border: none;
              font-size: 1.2rem;
              cursor: pointer;
              padding: 0.25rem;
              margin-left: 0.5rem;
              line-height: 1;
              transition: transform 0.2s;
            " title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${heartIcon}</button>
          </div>
          <div style="font-size: 0.8rem; color: #aaa;">${mode.category}</div>
        `;

        if (!isDisabled) {
          card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#4a9eff';
            card.style.transform = 'translateY(-2px)';
          });

          card.addEventListener('mouseleave', () => {
            card.style.borderColor = '#3a3a3a';
            card.style.transform = 'translateY(0)';
          });
        }

        // Handle favorite button click (stop propagation to prevent mode selection)
        const favoriteBtn = card.querySelector('.favorite-btn') as HTMLElement;
        if (favoriteBtn) {
          favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modeId = favoriteBtn.getAttribute('data-mode-id');
            if (modeId) {
              const newFavoriteState = !this.favorites.has(modeId);
              if (this.onFavoriteToggle) {
                this.onFavoriteToggle(modeId, newFavoriteState);
              }
              // Update local state immediately for responsive UI
              if (newFavoriteState) {
                this.favorites.add(modeId);
              } else {
                this.favorites.delete(modeId);
              }
              // Update the heart icon
              favoriteBtn.textContent = newFavoriteState ? '❤️' : '🤍';
              favoriteBtn.setAttribute('title', newFavoriteState ? 'Remove from favorites' : 'Add to favorites');
              favoriteBtn.setAttribute('aria-label', newFavoriteState ? 'Remove from favorites' : 'Add to favorites');
            }
          });
        }

        card.addEventListener('click', () => {
          if (isDisabled) {
            return; // Don't allow clicking disabled modes
          }
          if (this.onModeSelect) {
            this.onModeSelect(mode);
            this.hide();
          }
        });

        categoryContent.appendChild(card);
      });
      
      // Update collapsed state after all cards are added to this category
      // Use requestAnimationFrame to ensure DOM is updated and grid columns are calculated
      requestAnimationFrame(() => {
        if (categoryContent.getAttribute('data-expanded') === 'false') {
          updateCollapsedState();
        }
      });
    });
  }
}

