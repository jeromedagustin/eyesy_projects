/**
 * Tool to automatically mark stub modes (with TODO comments) as experimental
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODES_DIR = join(__dirname, '../src/modes');
const MODES_INDEX_PATH = join(__dirname, '../src/modes/index.ts');

function findStubModes(): string[] {
  const stubModeIds: string[] = [];
  const indexContent = readFileSync(MODES_INDEX_PATH, 'utf-8');
  
  // Read all mode files recursively
  function scanDirectory(dir: string): void {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === 'base' || entry === 'index.ts') continue;
      
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.endsWith('.ts')) {
        const content = readFileSync(fullPath, 'utf-8');
        
        // Check if it has TODO in draw method
        if (content.includes('TODO') && content.includes('Port') && content.includes('draw')) {
          // Extract mode class name from file
          const classNameMatch = content.match(/export class (\w+)/);
          if (classNameMatch) {
            const className = classNameMatch[1];
            
            // Find the mode ID in index.ts by class name
            const modeIdMatch = new RegExp(
              `id:\\s*['"]([^'"]+)['"][^}]*mode:\\s*${className}`,
              's'
            ).exec(indexContent);
            
            if (modeIdMatch) {
              stubModeIds.push(modeIdMatch[1]);
              console.log(`Found stub: ${modeIdMatch[1]} (${className})`);
            }
          }
        }
      }
    }
  }
  
  scanDirectory(MODES_DIR);
  return stubModeIds;
}

function markStubModes() {
  console.log('Finding stub modes...');
  const stubModeIds = findStubModes();
  
  console.log(`\nFound ${stubModeIds.length} stub modes to mark as experimental`);
  
  let content = readFileSync(MODES_INDEX_PATH, 'utf-8');
  let markedCount = 0;
  
  for (const modeId of stubModeIds) {
    // Find the mode definition by ID - look for the closing brace
    const escapedId = modeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match the entire mode object, being careful about nested braces
    const modePattern = new RegExp(
      `(\\{[^}]*id:\\s*['"]${escapedId}['"][^}]*mode:[^}]+)(\\})`,
      's'
    );
    
    const match = content.match(modePattern);
    if (match) {
      const fullMatch = match[0];
      // Check if experimental flag already exists
      if (!fullMatch.includes('experimental:')) {
        // Add experimental flag before the closing brace, after the last property
        const replacement = match[1] + ',\n    experimental: true' + match[2];
        content = content.replace(modePattern, replacement);
        markedCount++;
      }
    } else {
      console.warn(`Could not find mode with ID: ${modeId}`);
    }
  }
  
  writeFileSync(MODES_INDEX_PATH, content, 'utf-8');
  console.log(`\n✅ Marked ${markedCount} modes as experimental`);
}

markStubModes();

