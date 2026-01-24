/**
 * Test script to verify mode groupings by movement pattern
 */
import { modes } from '../src/modes/index.js';
import { ModeGrouper } from '../src/core/ModeGrouper.js';

const grouped = ModeGrouper.groupModes(modes);

// Group by group name to see how modes are distributed
const groups: { [key: string]: string[] } = {};

// We'll track which group each mode ends up in
const modeToGroup: { [modeId: string]: string } = {};

// Since groupModes returns a flat array, we need to infer groups
// by looking at consecutive modes with similar characteristics
let currentGroup = '';
let groupStart = 0;

for (let i = 0; i < grouped.length; i++) {
  const mode = grouped[i];
  const nameLower = mode.name.toLowerCase();
  
  // Determine group based on keywords
  let groupName = 'Other';
  
  if (nameLower.includes('image') || nameLower.includes('slideshow')) {
    groupName = '🖼️ Image Modes';
  } else if (nameLower.includes('webcam')) {
    groupName = '📹 Webcam/Video Modes';
  } else if (nameLower.includes('font')) {
    groupName = '🔤 Font Modes';
  } else if (nameLower.includes('timer')) {
    groupName = '⚙️ Utilities';
  } else if (nameLower.includes('spin') || nameLower.includes('radial') || nameLower.includes('radiating') || 
             nameLower.includes('cone scope') || nameLower.includes('zoom scope') || nameLower.includes('x scope') ||
             nameLower.includes('circular trigon') || nameLower.includes('zach spiral') || nameLower.includes('line rotate') ||
             nameLower.includes('spiral') || nameLower.includes('circle row')) {
    groupName = '🔄 Rotating';
  } else if (nameLower.includes('horizontal') || nameLower.includes('horiz') || nameLower.includes('left & right') ||
             nameLower.includes('two scope') || nameLower.includes('three scope') || nameLower.includes('line traveller')) {
    groupName = '↔️ Horizontal';
  } else if (nameLower.includes('vertical') || nameLower.includes('bouncing bar') || nameLower.includes('gradient column') ||
             nameLower.includes('rain') || nameLower.includes('snow')) {
    groupName = '↕️ Vertical';
  } else if (nameLower.includes('boids') || nameLower.includes('aquarium') || nameLower.includes('googly') ||
             nameLower.includes('mess a sketch') || nameLower.includes('gradient cloud') || nameLower.includes('breezy')) {
    groupName = '🎲 Random';
  } else if (nameLower.includes('breathing') || nameLower.includes('concentric') || nameLower.includes('sound jaws') ||
             nameLower.includes('football scope')) {
    groupName = '💓 Pulsing';
  } else if (nameLower.includes('bezier') || nameLower.includes('surf wave') || nameLower.includes('folia') ||
             nameLower.includes('arcway') || nameLower.includes('perspective line')) {
    groupName = '🌊 Curves & Waves';
  } else if (nameLower.includes('grid') || nameLower.includes('mirror grid') || nameLower.includes('square shadow') ||
             nameLower.includes('tile') || nameLower.includes('woven')) {
    groupName = '📊 Grid';
  } else if (nameLower.includes('circle scope') || nameLower.includes('oscilloscope') || nameLower.includes('connected scope') ||
             nameLower.includes('arrival scope') || nameLower.includes('audio printer') || nameLower.includes('joy division')) {
    groupName = '🎵 Audio Scopes';
  } else if (nameLower.includes('amp color') || nameLower.includes('zach') || nameLower.includes('gradient friend')) {
    groupName = '🎨 Amp & Color';
  } else if (nameLower.includes('ellipse') || nameLower.includes('trigon field') || nameLower.includes('aa selector')) {
    groupName = '🔷 Shape-Based';
  }
  
  if (!groups[groupName]) {
    groups[groupName] = [];
  }
  groups[groupName].push(mode.name);
  modeToGroup[mode.id] = groupName;
}

console.log('=== MODE GROUPING BY MOVEMENT PATTERN ===\n');
console.log(`Total modes: ${grouped.length}\n`);

Object.keys(groups).sort().forEach(groupName => {
  console.log(`\n${groupName} (${groups[groupName].length} modes):`);
  groups[groupName].forEach(modeName => {
    console.log(`  • ${modeName}`);
  });
});

// Check for ungrouped modes
const allGrouped = new Set(Object.values(modeToGroup));
console.log(`\n\n=== SUMMARY ===`);
console.log(`Groups created: ${Object.keys(groups).length}`);
console.log(`Modes grouped: ${Object.keys(modeToGroup).length}`);
console.log(`Total modes: ${modes.length}`);





