/**
 * Batch Mode Porting Script
 * Scans all Python modes and generates a list for porting
 */

import * as fs from 'fs';
import * as path from 'path';

interface ModeInfo {
  name: string;
  category: string;
  filePath: string;
  hasImages: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  lines: number;
}

function scanModes(examplesDir: string): ModeInfo[] {
  const modes: ModeInfo[] = [];
  
  const categories = ['scopes', 'triggers', 'utilities'];
  
  for (const category of categories) {
    const categoryDir = path.join(examplesDir, category);
    if (!fs.existsSync(categoryDir)) continue;
    
    const modeDirs = fs.readdirSync(categoryDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const modeDir of modeDirs) {
      const mainPy = path.join(categoryDir, modeDir, 'main.py');
      if (fs.existsSync(mainPy)) {
        const content = fs.readFileSync(mainPy, 'utf-8');
        const lines = content.split('\n').length;
        
        const hasImages = content.includes('glob.glob') && content.includes('Images');
        
        let complexity: 'simple' | 'medium' | 'complex' = 'simple';
        if (content.includes('pygame.gfxdraw') || content.includes('transform') || content.includes('blit')) {
          complexity = 'complex';
        } else if (content.includes('math.') && (content.match(/math\./g) || []).length > 5) {
          complexity = 'medium';
        }
        
        modes.push({
          name: modeDir,
          category,
          filePath: mainPy,
          hasImages,
          complexity,
          lines
        });
      }
    }
  }
  
  return modes.sort((a, b) => {
    // Sort by complexity (simple first), then by name
    const complexityOrder = { simple: 0, medium: 1, complex: 2 };
    if (complexityOrder[a.complexity] !== complexityOrder[b.complexity]) {
      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    }
    return a.name.localeCompare(b.name);
  });
}

// Main execution
const examplesDir = path.join(__dirname, '../../examples');
const modes = scanModes(examplesDir);

console.log(`Found ${modes.length} modes to port:\n`);

// Group by category
const byCategory = new Map<string, ModeInfo[]>();
modes.forEach(mode => {
  if (!byCategory.has(mode.category)) {
    byCategory.set(mode.category, []);
  }
  byCategory.get(mode.category)!.push(mode);
});

// Print summary
for (const [category, categoryModes] of byCategory.entries()) {
  console.log(`${category.toUpperCase()} (${categoryModes.length} modes):`);
  
  const byComplexity = new Map<string, ModeInfo[]>();
  categoryModes.forEach(mode => {
    if (!byComplexity.has(mode.complexity)) {
      byComplexity.set(mode.complexity, []);
    }
    byComplexity.get(mode.complexity)!.push(mode);
  });
  
  for (const [complexity, complexityModes] of byComplexity.entries()) {
    console.log(`  ${complexity} (${complexityModes.length}):`);
    complexityModes.forEach(mode => {
      const imageFlag = mode.hasImages ? ' [IMAGES]' : '';
      console.log(`    - ${mode.name}${imageFlag}`);
    });
  }
  console.log();
}

// Generate porting checklist
const checklistPath = path.join(__dirname, '../PORTING_CHECKLIST.md');
const checklist = `# Mode Porting Checklist

Total modes: ${modes.length}

## Simple Modes (Start Here)
${modes.filter(m => m.complexity === 'simple').map(m => `- [ ] ${m.name}${m.hasImages ? ' [IMAGES]' : ''}`).join('\n')}

## Medium Complexity
${modes.filter(m => m.complexity === 'medium').map(m => `- [ ] ${m.name}${m.hasImages ? ' [IMAGES]' : ''}`).join('\n')}

## Complex Modes
${modes.filter(m => m.complexity === 'complex').map(m => `- [ ] ${m.name}${m.hasImages ? ' [IMAGES]' : ''}`).join('\n')}

## Notes
- Modes marked [IMAGES] require image loading support
- Port modes in order: Simple → Medium → Complex
- Test each mode after porting
`;

fs.writeFileSync(checklistPath, checklist);
console.log(`\nChecklist saved to: ${checklistPath}`);






