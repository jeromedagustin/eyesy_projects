/**
 * Mode Grouper - Groups modes by similarity for better transitions
 */
import { ModeInfo } from '../ui/ModeSelector';

export interface ModeGroup {
  id: string;
  name: string;
  modes: ModeInfo[];
  priority: number; // Lower = shown first
}

export class ModeGrouper {
  /**
   * Check if a mode name matches any of the given keywords
   */
  private static matchesKeywords(nameLower: string, keywords: string[]): boolean {
    return keywords.some(keyword => nameLower.includes(keyword));
  }

  /**
   * Group modes by movement pattern for better transitions
   * Modes with similar movement (rotate, horizontal, vertical, random) are grouped together
   */
  static groupModes(modes: ModeInfo[]): ModeInfo[] {
    // Define groups based on movement patterns (excluding Image/Video which go at end)
    const groupDefs: { id: string; name: string; priority: number; keywords: string[]; category?: string }[] = [
      // === ROTATING/SPINNING MODES ===
      {
        id: 'rotating-scopes',
        name: '🔄 Rotating & Spinning',
        priority: 1,
        keywords: ['spin', 'spinning', 'radial', 'radiating', 'cone scope', 'zoom scope', 'x scope', 'circular trigon', 'zach spiral', 'circle row'],
        category: 'scopes',
      },
      {
        id: 'rotating-triggers',
        name: '🔄 Rotating Triggers',
        priority: 2,
        keywords: ['spiral', 'line rotate', 'trigon traveller'],
        category: 'triggers',
      },
      
      // === HORIZONTAL MOVEMENT ===
      {
        id: 'horizontal-scopes',
        name: '↔️ Horizontal Movement',
        priority: 3,
        keywords: ['horizontal', 'horiz', 'bezier h scope', 'left & right', 'two scope', 'three scope', 'line traveller'],
        category: 'scopes',
      },
      {
        id: 'horizontal-triggers',
        name: '↔️ Horizontal Triggers',
        priority: 4,
        keywords: ['bits h', 'bits horizontal'],
        category: 'triggers',
      },
      
      // === VERTICAL MOVEMENT ===
      {
        id: 'vertical-scopes',
        name: '↕️ Vertical Movement',
        priority: 5,
        keywords: ['vertical', 'bezier v scope', 'bouncing bar', 'gradient column'],
        category: 'scopes',
      },
      {
        id: 'vertical-triggers',
        name: '↕️ Vertical Triggers',
        priority: 6,
        keywords: ['bits v', 'bits vertical'],
        category: 'triggers',
      },
      
      // === FALLING (Rain/Snow) ===
      {
        id: 'falling-scopes',
        name: '❄️ Falling Particles',
        priority: 7,
        keywords: ['rain', 'snow'],
        category: 'scopes',
      },
      
      // === RANDOM/CHAOTIC MOVEMENT ===
      {
        id: 'random-scopes',
        name: '🎲 Random & Chaotic',
        priority: 8,
        keywords: ['boids', 'aquarium', 'googly', 'mess a sketch', 'gradient cloud', 'breezy feather'],
        category: 'scopes',
      },
      
      // === PULSING/EXPANDING ===
      {
        id: 'pulsing-scopes',
        name: '💓 Pulsing & Expanding',
        priority: 9,
        keywords: ['breathing circle', 'concentric', 'sound jaws', 'football scope'],
        category: 'scopes',
      },
      
      // === CURVES & WAVES ===
      {
        id: 'curves-waves',
        name: '🌊 Curves & Waves',
        priority: 10,
        keywords: ['bezier h scope', 'bezier v scope', 'surf wave', 'folia', 'arcway', 'perspective line'],
        category: 'scopes',
      },
      
      // === STATIC/GRID-BASED ===
      {
        id: 'grid-scopes',
        name: '📊 Grid & Static',
        priority: 11,
        keywords: ['grid circle', 'grid polygon', 'grid slide', 'grid triangle', 'mirror grid', 'square shadow'],
        category: 'scopes',
      },
      {
        id: 'grid-triggers',
        name: '📊 Grid Triggers',
        priority: 12,
        keywords: ['tile', 'woven', 'midi grid', 'migrating circle'],
        category: 'triggers',
      },
      
      // === CLASSIC AUDIO SCOPES ===
      {
        id: 'audio-scopes',
        name: '🎵 Classic Audio Scopes',
        priority: 13,
        keywords: ['circle scope', 'oscilloscope', 'connected scope', 'arrival scope', 'audio printer', 'joy division'],
        category: 'scopes',
      },
      
      // === AMP/COLOR REACTIVE ===
      {
        id: 'amp-color-scopes',
        name: '🎨 Amp & Color Reactive',
        priority: 14,
        keywords: ['amp color', 'zach', 'gradient friend'],
        category: 'scopes',
      },
      
      // === SHAPE-BASED ===
      {
        id: 'shape-scopes',
        name: '🔷 Shape-Based',
        priority: 15,
        keywords: ['ellipse', 'trigon field', 'aa selector'],
        category: 'scopes',
      },
      
      // === OTHER SCOPES ===
      {
        id: 'other-scopes',
        name: 'Other Scopes',
        priority: 16,
        keywords: [],
        category: 'scopes',
      },
      
      // === TRIGGER MODES (by pattern) ===
      {
        id: 'ball-triggers',
        name: '⚪ Ball & Circle Triggers',
        priority: 17,
        keywords: ['ball of mirror'],
        category: 'triggers',
      },
      {
        id: 'pattern-triggers',
        name: '📐 Pattern Triggers',
        priority: 18,
        keywords: ['hashmark', '10 print', 'origami', 'density', 'draws'],
        category: 'triggers',
      },
      {
        id: 'isometric-triggers',
        name: '🔺 Isometric Triggers',
        priority: 19,
        keywords: ['isometric'],
        category: 'triggers',
      },
      {
        id: 'bezier-triggers',
        name: '📈 Bezier Triggers',
        priority: 20,
        keywords: ['bezier'],
        category: 'triggers',
      },
      {
        id: 'other-triggers',
        name: 'Other Triggers',
        priority: 21,
        keywords: [],
        category: 'triggers',
      },
      
      // === FONT-BASED MODES ===
      {
        id: 'font-modes',
        name: '🔤 Font Modes',
        priority: 22,
        keywords: ['font'],
      },
      
      // === UTILITIES ===
      {
        id: 'utilities',
        name: '⚙️ Utilities',
        priority: 23,
        keywords: [],
        category: 'utilities',
      },
      
      // === NEW CATEGORIES (separate from scopes/triggers) ===
      
      // === LFO-BASED MODES ===
      {
        id: 'lfo-modes',
        name: '📊 LFO-Based',
        priority: 24,
        keywords: ['lfo'],
        category: 'lfo',
      },
      
      // === TIME-BASED MODES ===
      {
        id: 'time-modes',
        name: '⏱️ Time-Based',
        priority: 25,
        keywords: ['time', 'rotating', 'pulsing', 'oscillating'],
        category: 'time',
      },
      
      // === NOISE-BASED MODES ===
      {
        id: 'noise-modes',
        name: '🌊 Noise-Based',
        priority: 26,
        keywords: ['noise', 'perlin', 'simplex', 'flow'],
        category: 'noise',
      },
      
      // === GEOMETRIC MODES ===
      {
        id: 'geometric-modes',
        name: '📐 Geometric',
        priority: 27,
        keywords: ['geometric', 'tile', 'tessellation', 'sacred geometry'],
        category: 'geometric',
      },
      
      // === PATTERN MODES ===
      {
        id: 'pattern-modes',
        name: '🔄 Pattern',
        priority: 28,
        keywords: ['pattern', 'tessellation', 'repeat'],
        category: 'pattern',
      },
      
      // === IMAGE & VIDEO MODES (at end) ===
      {
        id: 'image-modes',
        name: '🖼️ Image Modes',
        priority: 100,
        keywords: ['image', 'slideshow'],
      },
      {
        id: 'webcam-modes',
        name: '📹 Webcam/Video Modes',
        priority: 101,
        keywords: ['webcam'],
      },
    ];

    // Create groups
    const groups: ModeGroup[] = groupDefs.map(def => ({
      id: def.id,
      name: def.name,
      modes: [],
      priority: def.priority,
    }));

    // Helper to find group index
    const findGroupIndex = (id: string): number => groups.findIndex(g => g.id === id);

    // Categorize each mode
    modes.forEach(mode => {
      const nameLower = mode.name.toLowerCase();
      const category = mode.category;
      let assigned = false;

      // First check for image-based modes (applies to any category)
      // New naming: "Image - ..." or legacy "... - Image" or "slideshow"
      if (nameLower.startsWith('image -') || this.matchesKeywords(nameLower, ['- image', 'slideshow'])) {
        const idx = findGroupIndex('image-modes');
        if (idx >= 0) {
          groups[idx].modes.push(mode);
          assigned = true;
        }
      }
      
      // Check for font-based modes (applies to any category)
      // New naming: "Font - ..." or legacy "T - Font ..."
      if (!assigned && (nameLower.startsWith('font -') || this.matchesKeywords(nameLower, ['- font']))) {
        const idx = findGroupIndex('font-modes');
        if (idx >= 0) {
          groups[idx].modes.push(mode);
          assigned = true;
        }
      }
      
      // Check for webcam/video modes
      if (!assigned && nameLower.startsWith('webcam')) {
        const idx = findGroupIndex('webcam-modes');
        if (idx >= 0) {
          groups[idx].modes.push(mode);
          assigned = true;
        }
      }

      if (!assigned) {
        // Try to match by keywords within the appropriate category
        for (let i = 0; i < groupDefs.length; i++) {
          const def = groupDefs[i];
          
          // Skip if category doesn't match (unless category is undefined)
          if (def.category && def.category !== category) continue;
          
          // Skip "other" and catch-all groups for now
          if (def.keywords.length === 0) continue;
          
          if (this.matchesKeywords(nameLower, def.keywords)) {
            groups[i].modes.push(mode);
            assigned = true;
            break;
          }
        }
      }

      // If not assigned, put in appropriate category
      if (!assigned) {
        if (category === 'scopes') {
          const idx = findGroupIndex('other-scopes');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'triggers') {
          const idx = findGroupIndex('other-triggers');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'utilities') {
          const idx = findGroupIndex('utilities');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'lfo') {
          const idx = findGroupIndex('lfo-modes');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'time') {
          const idx = findGroupIndex('time-modes');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'noise') {
          const idx = findGroupIndex('noise-modes');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'geometric') {
          const idx = findGroupIndex('geometric-modes');
          if (idx >= 0) groups[idx].modes.push(mode);
        } else if (category === 'pattern') {
          const idx = findGroupIndex('pattern-modes');
          if (idx >= 0) groups[idx].modes.push(mode);
        }
      }
    });

    // Sort modes within each group by name (for consistency)
    groups.forEach(group => {
      group.modes.sort((a, b) => {
        // Non-experimental first
        if (a.experimental !== b.experimental) {
          return a.experimental ? 1 : -1;
        }
        // Disabled modes last
        if (a.disabled !== b.disabled) {
          return a.disabled ? 1 : -1;
        }
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });
    });

    // Check if scope modes are all disabled
    // Scope groups are those with category 'scopes' or IDs containing 'scope'/'scopes'
    const scopeGroupIds = new Set<string>();
    groupDefs.forEach(def => {
      if (def.category === 'scopes' || def.id.includes('scope') || def.id.includes('scopes')) {
        scopeGroupIds.add(def.id);
      }
    });
    
    const scopeGroups = groups.filter(g => scopeGroupIds.has(g.id));
    const allScopeModesDisabled = scopeGroups.length > 0 && scopeGroups.every(group => 
      group.modes.length === 0 || group.modes.every(m => m.disabled)
    );

    // If all scope modes are disabled, prioritize non-scope groups
    if (allScopeModesDisabled) {
      groups.forEach(group => {
        const isScopeGroup = scopeGroupIds.has(group.id);
        if (!isScopeGroup) {
          // Non-scope groups get priority boost (lower number = higher priority)
          // Give them priorities 0-10 (before scope groups which will be 100+)
          if (group.priority >= 24) {
            // LFO, time, noise, geometric, pattern modes (24-28)
            group.priority = group.priority - 24; // 24->0, 25->1, 26->2, 27->3, 28->4
          } else if (group.priority >= 17 && group.priority < 22) {
            // Trigger groups (17-21)
            group.priority = group.priority - 17 + 5; // 17->5, 18->6, 19->7, 20->8, 21->9
          } else if (group.priority >= 22 && group.priority < 24) {
            // Font/utility groups (22-23)
            group.priority = group.priority - 22 + 10; // 22->10, 23->11
          }
        } else {
          // Scope groups get pushed to the end
          group.priority = group.priority + 100;
        }
      });
    }

    // Sort groups by priority
    groups.sort((a, b) => a.priority - b.priority);

    // Flatten groups into single array (skip empty groups)
    const result: ModeInfo[] = [];
    groups.forEach(group => {
      if (group.modes.length > 0) {
        result.push(...group.modes);
      }
    });

    return result;
  }

  /**
   * Calculate similarity score between two modes (0.0 to 1.0)
   */
  static calculateSimilarity(mode1: ModeInfo, mode2: ModeInfo): number {
    if (mode1.id === mode2.id) return 1.0;

    const name1 = mode1.name.toLowerCase();
    const name2 = mode2.name.toLowerCase();

    // Same category
    if (mode1.category === mode2.category) {
      // Check for common keywords
      const keywords1 = this.extractKeywords(name1);
      const keywords2 = this.extractKeywords(name2);
      
      let commonKeywords = 0;
      keywords1.forEach(k => {
        if (keywords2.includes(k)) commonKeywords++;
      });

      if (keywords1.length > 0 && keywords2.length > 0) {
        const jaccard = commonKeywords / (keywords1.length + keywords2.length - commonKeywords);
        return jaccard;
      }
    }

    return 0.0;
  }

  private static extractKeywords(name: string): string[] {
    const keywords: string[] = [];
    const words = name.split(/[\s-]+/);
    
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 2) {
        keywords.push(clean);
      }
    });

    return keywords;
  }
}

