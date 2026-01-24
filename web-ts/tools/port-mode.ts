/**
 * Mode Porting Helper Script
 * Analyzes Python modes and generates TypeScript stubs
 * 
 * Usage: npm run port-mode <path-to-python-mode>
 */

import * as fs from 'fs';
import * as path from 'path';

interface ModeInfo {
  name: string;
  category: string;
  file: string;
  hasImages: boolean;
  complexity: 'simple' | 'medium' | 'complex';
}

function analyzePythonMode(filePath: string): ModeInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const dirName = path.basename(path.dirname(filePath));
  
  // Extract mode name from directory
  const name = dirName.replace(/^[STU] - /, '');
  const category = dirName.startsWith('S - ') ? 'scopes' : 
                   dirName.startsWith('T - ') ? 'triggers' : 
                   dirName.startsWith('U - ') ? 'utilities' : 'custom';
  
  // Check for images
  const hasImages = content.includes('glob.glob') && content.includes('Images');
  
  // Determine complexity
  let complexity: 'simple' | 'medium' | 'complex' = 'simple';
  if (content.includes('pygame.gfxdraw') || content.includes('transform') || content.includes('blit')) {
    complexity = 'complex';
  } else if (content.includes('math.') && (content.match(/math\./g) || []).length > 5) {
    complexity = 'medium';
  }
  
  return {
    name: dirName,
    category,
    file: fileName,
    hasImages,
    complexity
  };
}

function generateTypeScriptStub(modeInfo: ModeInfo, pythonCode: string): string {
  const className = modeInfo.name
    .replace(/^[STU] - /, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[a-z]/, (c) => c.toUpperCase());
  
  const categoryDir = modeInfo.category === 'scopes' ? 'scopes' : 
                      modeInfo.category === 'triggers' ? 'triggers' : 
                      modeInfo.category === 'utilities' ? 'utilities' : 'custom';
  
  // Extract knob comments
  const knobComments: string[] = [];
  const knobMatches = pythonCode.matchAll(/#Knob(\d+)\s*-\s*(.+)/g);
  for (const match of knobMatches) {
    knobComments.push(` * Knob${match[1]}: ${match[2]}`);
  }
  
  const stub = `import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * ${modeInfo.name}
 * Ported from Python version
${knobComments.length > 0 ? ' *\n' + knobComments.join('\n') : ''}
 */
export class ${className} implements Mode {
  setup(canvas: Canvas, eyesy: EYESY): void {
    // TODO: Port setup logic
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // TODO: Port draw logic
    // Original Python code:
    // ${pythonCode.split('\n').slice(0, 5).join('\n    // ')}
  }
}
`;
  
  return stub;
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage: npm run port-mode <path-to-python-mode>');
  console.log('Example: npm run port-mode ../examples/scopes/S\\ -\\ Classic\\ Horizontal/main.py');
  process.exit(1);
}

const pythonPath = process.argv[2];
if (!fs.existsSync(pythonPath)) {
  console.error(`File not found: ${pythonPath}`);
  process.exit(1);
}

const modeInfo = analyzePythonMode(pythonPath);
const pythonCode = fs.readFileSync(pythonPath, 'utf-8');
const stub = generateTypeScriptStub(modeInfo, pythonCode);

console.log('Mode Analysis:');
console.log(JSON.stringify(modeInfo, null, 2));
console.log('\n--- TypeScript Stub ---\n');
console.log(stub);

// Optionally write to file
const outputPath = `src/modes/${modeInfo.category}/${modeInfo.name.replace(/^[STU] - /, '').replace(/[^a-zA-Z0-9]/g, '')}.ts`;
console.log(`\nSuggested output path: ${outputPath}`);





