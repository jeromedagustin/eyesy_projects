/**
 * Mode Selector UI Component
 */
import { Mode } from '../modes/base/Mode';

export interface ModeInfo {
  id: string;
  name: string;
  category: string;
  mode: new () => Mode;
  experimental?: boolean; // Mark modes that don't work correctly
  disabled?: boolean; // Mark modes that are disabled (e.g., require permission)
  seizureRisk?: 'low' | 'medium' | 'high'; // Risk level for photosensitive epilepsy (default: 'low')
  supportsWebcam?: boolean; // Whether this mode supports webcam layering (default: true)
  knobDescriptions?: {
    knob1?: string;
    knob2?: string;
    knob3?: string;
    knob4?: string; // Usually "Foreground Color"
    knob5?: string; // Usually "Background Color"
  };
}

/**
 * Detailed group definitions for dropdown categorization
 */
interface GroupDef {
  id: string;
  label: string;
  keywords: string[];
  category?: string; // Optional: only match modes in this category
}

const DROPDOWN_GROUPS: GroupDef[] = [
  // === SCOPES ===
  { id: 'classic-lines', label: '📊 Classic Lines', keywords: ['classic horizontal', 'classic vertical', 'horizontal', 'horiz', 'left & right', 'two scope', 'three scope', 'oscilloscope'], category: 'scopes' },
  { id: 'bits-audio', label: '🔊 Bits & Audio', keywords: ['bits horizontal', 'bits vertical', 'audio printer'], category: 'scopes' },
  { id: 'bezier-curves', label: '〰️ Bezier & Curves', keywords: ['bezier', 'surf wave', 'folia'], category: 'scopes' },
  { id: 'circles', label: '⭕ Circles', keywords: ['circle scope', 'breathing circle', 'circle row', 'concentric', 'spinning disc'], category: 'scopes' },
  { id: 'amp-color', label: '🎨 Amp & Color', keywords: ['amp color', 'zach'], category: 'scopes' },
  { id: 'grids', label: '🔲 Grids', keywords: ['grid circle', 'grid polygon', 'grid slide', 'grid triangle', 'mirror grid'], category: 'scopes' },
  { id: 'lines-bounce', label: '📈 Lines & Bounce', keywords: ['line bounce', 'line traveller', 'bouncing bar', 'five lines', 'perspective line'], category: 'scopes' },
  { id: 'radial', label: '☀️ Radial & Radiating', keywords: ['radial', 'radiating', 'cone scope', 'x scope', 'zoom scope'], category: 'scopes' },
  { id: 'shapes', label: '🔷 Shapes', keywords: ['ellipse', 'square shadow', 'sound jaws', 'football', 'trigon'], category: 'scopes' },
  { id: 'gradients', label: '🌈 Gradients & Clouds', keywords: ['gradient', 'cloud', 'breezy', 'feather'], category: 'scopes' },
  { id: 'nature', label: '🌧️ Nature & Particles', keywords: ['rain', 'snow', 'boids', 'aquarium', 'googly'], category: 'scopes' },
  { id: 'other-scopes', label: '✨ Other Scopes', keywords: [], category: 'scopes' },
  // === TRIGGERS ===  
  { id: 'balls-circles-t', label: '🔵 Ball & Circle Triggers', keywords: ['ball of mirror', 'migrating circle'], category: 'triggers' },
  { id: 'bits-t', label: '🔢 Bits Triggers', keywords: ['bits h', 'bits v'], category: 'triggers' },
  { id: 'tiles-grids-t', label: '🧱 Tiles & Grids', keywords: ['tile', 'woven'], category: 'triggers' },
  { id: 'isometric', label: '📐 Isometric', keywords: ['isometric'], category: 'triggers' },
  { id: 'hashmarks', label: '〽️ Patterns & Hashmarks', keywords: ['hashmark', '10 print', 'origami', 'density'], category: 'triggers' },
  { id: 'lines-bezier-t', label: '↗️ Lines & Bezier Triggers', keywords: ['bezier', 'line rotate', 'spiral', 'trigon traveller'], category: 'triggers' },
  { id: 'other-triggers', label: '⚡ Other Triggers', keywords: [], category: 'triggers' },
  // === UTILITIES ===
  { id: 'utilities', label: '🛠️ Utilities', keywords: ['timer', 'midi'], category: 'utilities' },
  // === NEW CATEGORIES (separate from scopes/triggers) ===
  { id: 'lfo-modes', label: '📊 LFO-Based', keywords: ['l - lfo'], category: 'lfo' },
  { id: 'time-modes', label: '⏱️ Time-Based', keywords: ['t - time', 'rotating', 'pulsing'], category: 'time' },
  { id: 'noise-modes', label: '🌊 Noise-Based', keywords: ['n - noise', 'perlin', 'simplex'], category: 'noise' },
  { id: 'geometric-modes', label: '📐 Geometric', keywords: ['g - geometric', 'tile', 'tessellation'], category: 'geometric' },
  { id: 'pattern-modes', label: '🔄 Pattern', keywords: ['pt - pattern', 'pattern'], category: 'pattern' },
  { id: '3d-modes', label: '🎲 3D', keywords: ['3d', '3d -'], category: '3d' },
  // === FONT MODES ===
  { id: 'fonts', label: '🔤 Font Modes', keywords: ['font -'], category: 'font' },
  { id: 'images', label: '🖼️ Image Modes (Beta)', keywords: ['image -', 'slideshow'] },
  { id: 'webcam', label: '📹 Video/Webcam (Beta)', keywords: ['webcam'] },
];

export class ModeSelector {
  private container: HTMLElement;
  private modes: ModeInfo[] = [];
  private onModeSelect?: (mode: ModeInfo) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  setModes(modes: ModeInfo[]) {
    this.modes = modes;
    this.updateSelect();
  }

  setOnModeSelect(callback: (mode: ModeInfo) => void) {
    this.onModeSelect = callback;
  }

  /**
   * Set the currently selected mode in the dropdown
   */
  setSelectedMode(modeId: string) {
    const select = document.getElementById('mode-select') as HTMLSelectElement;
    if (select) {
      select.value = modeId;
    }
  }

  /**
   * Get the currently selected mode ID
   */
  getSelectedModeId(): string {
    const select = document.getElementById('mode-select') as HTMLSelectElement;
    return select?.value || '';
  }

  /**
   * Determine which group a mode belongs to
   */
  private getGroupForMode(mode: ModeInfo): string {
    const nameLower = mode.name.toLowerCase();
    
    // Check media types FIRST (they have unique naming: "Image -", "Font -", "Webcam -")
    if (nameLower.startsWith('image -') || nameLower.includes('slideshow')) {
      return 'images';
    }
    if (nameLower.startsWith('font -')) {
      return 'fonts';
    }
    if (nameLower.startsWith('webcam')) {
      return 'webcam';
    }
    
    // Then check other groups
    for (const group of DROPDOWN_GROUPS) {
      // Skip media groups (already checked above) - but fonts is now a category, not a media group
      if (['images', 'webcam'].includes(group.id)) continue;
      
      // Skip if category doesn't match (when specified)
      if (group.category && group.category !== mode.category) continue;
      
      // Skip catch-all groups (empty keywords) for now
      if (group.keywords.length === 0) continue;
      
      // Check if mode name matches any keyword
      if (group.keywords.some(kw => nameLower.includes(kw))) {
        return group.id;
      }
    }
    
    // Fall back to catch-all groups
    if (mode.category === 'scopes') return 'other-scopes';
    if (mode.category === 'triggers') return 'other-triggers';
    if (mode.category === 'utilities') return 'utilities';
    if (mode.category === 'font') return 'fonts';
    if (mode.category === 'lfo') return 'lfo-modes';
    if (mode.category === 'time') return 'time-modes';
    if (mode.category === 'noise') return 'noise-modes';
    if (mode.category === 'geometric') return 'geometric-modes';
    if (mode.category === 'pattern') return 'pattern-modes';
    if (mode.category === '3d') return '3d-modes';
    return 'other-scopes';
  }

  private render() {
    this.container.innerHTML = `
      <div style="
        padding: 1rem;
        background: #2a2a2a;
        border-bottom: 1px solid #3a3a3a;
      ">
        <select id="mode-select" style="
          width: 100%;
          padding: 0.5rem;
          background: #3a3a3a;
          color: #fff;
          border: 1px solid #4a4a4a;
          border-radius: 4px;
          font-size: 0.9rem;
        ">
          <option value="">Select a mode...</option>
        </select>
      </div>
    `;

    const select = document.getElementById('mode-select') as HTMLSelectElement;
    select.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (value) {
        const mode = this.modes.find(m => m.id === value);
        if (mode && this.onModeSelect) {
          this.onModeSelect(mode);
        }
      }
    });
  }

  private updateSelect() {
    const select = document.getElementById('mode-select') as HTMLSelectElement;
    
    // Clear existing options (except first)
    while (select.options.length > 1) {
      select.remove(1);
    }

    // Group modes by detailed category
    const groupedModes = new Map<string, ModeInfo[]>();
    
    // Initialize groups in order
    DROPDOWN_GROUPS.forEach(group => {
      groupedModes.set(group.id, []);
    });
    
    // Assign each mode to a group
    this.modes.forEach(mode => {
      const groupId = this.getGroupForMode(mode);
      if (groupedModes.has(groupId)) {
        groupedModes.get(groupId)!.push(mode);
      }
    });

    // Create optgroups for each non-empty group
    DROPDOWN_GROUPS.forEach(group => {
      const modes = groupedModes.get(group.id) || [];
      if (modes.length === 0) return;
      
      const optgroup = document.createElement('optgroup');
      optgroup.label = `${group.label} (${modes.length})`;
      
      // Sort modes within group: non-experimental first, then alphabetically
      modes.sort((a, b) => {
        if (a.experimental !== b.experimental) {
          return a.experimental ? 1 : -1;
        }
        if (a.disabled !== b.disabled) {
          return a.disabled ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      });

      modes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode.id;
        option.textContent = mode.experimental ? `${mode.name} (Experimental)` : mode.name;
        if (mode.disabled) {
          option.disabled = true;
          // Show appropriate reason for being disabled
          const nameLower = mode.name.toLowerCase();
          if (nameLower.startsWith('image -') || nameLower.includes('slideshow')) {
            option.textContent += ' (No Images)';
          } else if (nameLower.startsWith('webcam')) {
            option.textContent += ' (Enable Webcam)';
          } else if (mode.category === 'scopes') {
            option.textContent += ' (Enable Microphone)';
          } else {
            option.textContent += ' (Requires Permission)';
          }
          option.style.color = '#888';
        }
        optgroup.appendChild(option);
      });
      
      select.appendChild(optgroup);
    });
  }
}

