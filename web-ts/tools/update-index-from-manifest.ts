/**
 * Update modes/index.ts from manifest.json
 * This ensures mode names match exactly
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

// Read manifest
const manifestPath = path.join(__dirname, '../../web/modes/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Read existing index to preserve manually ported modes
const indexPath = path.join(__dirname, '../src/modes/index.ts');
const existingContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf-8') : '';

// Extract existing mode IDs
const existingIds = new Set<string>();
const existingIdMatches = existingContent.matchAll(/id: '([^']+)',/g);
for (const match of existingIdMatches) {
  existingIds.add(match[1]);
}

// Generate imports and entries
const imports = new Set<string>();
const entries: string[] = [];

// Add existing imports (manually ported modes)
const existingImportMatches = existingContent.matchAll(/import \{ (\w+) \} from '\.\/(scopes|triggers|utilities)\/(\w+)';/g);
for (const match of existingImportMatches) {
  imports.add(match[0]);
}

// Process all modes from manifest
for (const mode of manifest.modes) {
  const className = toClassName(mode.name);
  const category = mode.category;
  const modeFile = path.join(__dirname, `../src/modes/${category}/${className}.ts`);
  
  // Only add if file exists
  if (fs.existsSync(modeFile)) {
    imports.add(`import { ${className} } from './${category}/${className}';`);
    
    if (!existingIds.has(mode.id)) {
      entries.push(`  {
    id: '${mode.id}',
    name: '${mode.name}',
    category: '${mode.category}',
    mode: ${className},
  },`);
    }
  }
}

// Generate new index
const sortedImports = Array.from(imports).sort();
const sortedEntries = entries.sort((a, b) => {
  const aName = a.match(/name: '([^']+)'/)?.[1] || '';
  const bName = b.match(/name: '([^']+)'/)?.[1] || '';
  return aName.localeCompare(bName);
});

const newIndex = `/**
 * Mode registry - exports all available modes
 * Auto-generated from manifest.json
 */
import { ModeInfo } from '../ui/ModeSelector';

${sortedImports.join('\n')}

// Export all modes
export const modes: ModeInfo[] = [
${sortedEntries.join('\n')}
];

// Helper to get mode by ID
export function getModeById(id: string): ModeInfo | undefined {
  return modes.find(m => m.id === id);
}
`;

fs.writeFileSync(indexPath, newIndex);

console.log(`Updated index.ts with ${sortedEntries.length} modes`);
console.log(`Total imports: ${sortedImports.length}`);





