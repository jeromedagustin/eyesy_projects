/**
 * Auto-port Python modes to TypeScript
 * Generates TypeScript files for all Python modes
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PythonMode {
  name: string;
  category: 'scopes' | 'triggers' | 'utilities' | 'custom';
  filePath: string;
  hasImages: boolean;
  code: string;
}

function scanPythonModes(): PythonMode[] {
  const modes: PythonMode[] = [];
  const examplesDir = path.join(__dirname, '../../examples');

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
        const code = fs.readFileSync(mainPy, 'utf-8');
        const hasImages = code.includes('glob.glob') && code.includes('Images');
        
        modes.push({
          name: modeDir,
          category: category as 'scopes' | 'triggers' | 'utilities',
          filePath: mainPy,
          hasImages,
          code
        });
      }
    }
  }

  return modes;
}

function toClassName(name: string): string {
  let className = name
    .replace(/^[STU] - /, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // If class name starts with a number, prefix with "Mode"
  if (/^\d/.test(className)) {
    className = 'Mode' + className;
  }
  
  return className;
}

function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/^[stu] - /, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
}

function extractKnobComments(code: string): string[] {
  const comments: string[] = [];
  const matches = code.matchAll(/#Knob(\d+)\s*-\s*(.+)/g);
  for (const match of matches) {
    comments.push(` * Knob${match[1]}: ${match[2]}`);
  }
  return comments;
}

function generateTypeScriptMode(mode: PythonMode): string {
  const className = toClassName(mode.name);
  const knobComments = extractKnobComments(mode.code);
  
  // Check if mode uses images
  const imageNote = mode.hasImages ? '\n * Note: This mode requires image loading support' : '';

  return `import { Mode } from '../base/Mode';
import { Canvas } from '../../core/Canvas';
import { EYESY } from '../../core/EYESY';

/**
 * ${mode.name}
 * Ported from Python version
${knobComments.length > 0 ? ' *\n' + knobComments.join('\n') : ''}${imageNote}
 */
export class ${className} implements Mode {
  setup(canvas: Canvas, eyesy: EYESY): void {
    // TODO: Port setup logic from Python
  }

  draw(canvas: Canvas, eyesy: EYESY): void {
    // TODO: Port draw logic from Python
    // See: ${mode.filePath.replace(/.*\/examples\//, 'examples/')}
  }
}
`;
}

function generateIndexEntry(mode: PythonMode): string {
  const className = toClassName(mode.name);
  const id = toId(mode.name);
  const importName = className;
  
  return `  {
    id: '${id}',
    name: '${mode.name}',
    category: '${mode.category}',
    mode: ${importName},
  },`;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Scanning Python modes...\n');

  const modes = scanPythonModes();
console.log(`Found ${modes.length} modes to port\n`);

// Create output directory structure
const outputDir = path.join(__dirname, '../src/modes');
['scopes', 'triggers', 'utilities'].forEach(cat => {
  const dir = path.join(outputDir, cat);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Generate TypeScript files
const generated: string[] = [];
const skipped: string[] = [];

for (const mode of modes) {
  const className = toClassName(mode.name);
  const outputFile = path.join(outputDir, mode.category, `${className}.ts`);
  
  // Skip if already exists (don't overwrite manually ported modes)
  if (fs.existsSync(outputFile)) {
    skipped.push(mode.name);
    continue;
  }

  const tsCode = generateTypeScriptMode(mode);
  fs.writeFileSync(outputFile, tsCode);
  generated.push(mode.name);
  console.log(`Generated: ${mode.category}/${className}.ts`);
}

console.log(`\nGenerated ${generated.length} new mode files`);
if (skipped.length > 0) {
  console.log(`Skipped ${skipped.length} existing files`);
}

// Generate index entries
console.log('\n--- Add these to src/modes/index.ts ---\n');

const imports = new Set<string>();
const entries: string[] = [];

for (const mode of modes) {
  const className = toClassName(mode.name);
  imports.add(`import { ${className} } from './${mode.category}/${className}';`);
  entries.push(generateIndexEntry(mode));
}

console.log('// Imports:');
Array.from(imports).sort().forEach(imp => console.log(imp));
console.log('\n// Mode entries:');
entries.forEach(entry => console.log(entry));

console.log('\nDone! Review and add imports/entries to index.ts');
}

