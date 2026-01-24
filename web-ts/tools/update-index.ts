/**
 * Update modes/index.ts with all generated modes
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toClassName(name: string): string {
  return name
    .replace(/^[STU] - /, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toId(name: string): string {
  return name
    .toLowerCase()
    .replace(/^[stu] - /, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
}

function scanGeneratedModes(): Array<{ className: string; id: string; name: string; category: string }> {
  const modes: Array<{ className: string; id: string; name: string; category: string }> = [];
  const modesDir = path.join(__dirname, '../src/modes');

  const categories = ['scopes', 'triggers', 'utilities'];
  
  for (const category of categories) {
    const categoryDir = path.join(modesDir, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts');

    for (const file of files) {
      const className = file.replace('.ts', '');
      // Try to reconstruct name from class name (approximate)
      const name = `S - ${className}`; // Will need manual fixing for T/U modes
      const id = className.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
      
      modes.push({ className, id, name, category });
    }
  }

  return modes;
}

// Read existing index to preserve manually ported modes
const indexPath = path.join(__dirname, '../src/modes/index.ts');
const existingContent = fs.readFileSync(indexPath, 'utf-8');

// Extract existing imports and entries
const existingImports = new Set<string>();
const existingEntries = new Set<string>();

// Parse existing file
const importMatches = existingContent.matchAll(/import \{ (\w+) \} from '\.\/(scopes|triggers|utilities)\/(\w+)';/g);
for (const match of importMatches) {
  existingImports.add(match[0]);
}

const entryMatches = existingContent.matchAll(/id: '([^']+)',/g);
for (const match of entryMatches) {
  existingEntries.add(match[1]);
}

// Generate new index
const generatedModes = scanGeneratedModes();
const allImports = new Set<string>();
const allEntries: string[] = [];

// Add existing
existingImports.forEach(imp => allImports.add(imp));

// Add new
for (const mode of generatedModes) {
  if (!existingEntries.has(mode.id)) {
    allImports.add(`import { ${mode.className} } from './${mode.category}/${mode.className}';`);
    allEntries.push(`  {
    id: '${mode.id}',
    name: '${mode.name}',
    category: '${mode.category}',
    mode: ${mode.className},
  },`);
  }
}

const newIndex = `/**
 * Mode registry - exports all available modes
 */
import { Mode } from './base/Mode';
import { ModeInfo } from '../ui/ModeSelector';

${Array.from(allImports).sort().join('\n')}

// Export all modes
export const modes: ModeInfo[] = [
${allEntries.join('\n')}
];

// Helper to get mode by ID
export function getModeById(id: string): ModeInfo | undefined {
  return modes.find(m => m.id === id);
}
`;

console.log('Generated new index.ts');
console.log(`Total modes: ${allEntries.length}`);
console.log(`\nPreview (first 10 entries):`);
allEntries.slice(0, 10).forEach(e => console.log(e));

// Write to file
fs.writeFileSync(indexPath, newIndex);
console.log(`\nUpdated: ${indexPath}`);





