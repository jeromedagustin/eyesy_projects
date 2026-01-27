/**
 * Fix index.ts to remove duplicates and use correct class names
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getClassNameFromFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/export class (\w+) implements Mode/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function scanActualModes(): Map<string, { className: string; category: string; filePath: string }> {
  const modes = new Map<string, { className: string; category: string; filePath: string }>();
  const modesDir = path.join(__dirname, '../src/modes');

  const categories = ['scopes', 'triggers', 'utilities'];
  
  for (const category of categories) {
    const categoryDir = path.join(modesDir, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.ts') && f !== 'index.ts');

    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const className = getClassNameFromFile(filePath);
      if (className) {
        const key = `${category}/${file.replace('.ts', '')}`;
        modes.set(key, { className, category, filePath });
      }
    }
  }

  return modes;
}

// Read manifest for mode names
const manifestPath = path.join(__dirname, '../../web/modes/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

// Scan actual files
const actualModes = scanActualModes();

// Build imports and entries
const imports = new Set<string>();
const entries: string[] = [];

// Helper to find file by mode name
function findFileForMode(modeName: string, category: string): string | null {
  // Try different naming conventions
  const baseName = modeName
    .replace(/^[STU] - /, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  
  const variations = [
    baseName,
    baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase(),
    baseName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(''),
  ];

  for (const variation of variations) {
    const key = `${category}/${variation}`;
    if (actualModes.has(key)) {
      return key;
    }
  }

  // Try to find by scanning all files
  for (const [key, info] of actualModes.entries()) {
    if (info.category === category) {
      // Check if class name matches
      const classBase = info.className.replace(/^Mode/, '');
      if (classBase.toLowerCase() === baseName.toLowerCase()) {
        return key;
      }
    }
  }

  return null;
}

// Process manifest modes
for (const mode of manifest.modes) {
  const fileKey = findFileForMode(mode.name, mode.category);
  if (fileKey && actualModes.has(fileKey)) {
    const info = actualModes.get(fileKey)!;
    imports.add(`import { ${info.className} } from './${fileKey}';`);
    entries.push(`  {
    id: '${mode.id}',
    name: '${mode.name}',
    category: '${mode.category}',
    mode: ${info.className},
  },`);
  }
}

// Generate new index
const sortedImports = Array.from(imports).sort();
const sortedEntries = entries.sort((a, b) => {
  const aName = a.match(/name: '([^']+)'/)?.[1] || '';
  const bName = b.match(/name: '([^']+)'/)?.[1] || '';
  return aName.localeCompare(bName);
});

const indexPath = path.join(__dirname, '../src/modes/index.ts');
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

console.log(`Fixed index.ts`);
console.log(`Total modes: ${sortedEntries.length}`);
console.log(`Total imports: ${sortedImports.length}`);






