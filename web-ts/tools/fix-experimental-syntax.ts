/**
 * Fix syntax errors in modes index where experimental flag was added incorrectly
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODES_INDEX_PATH = join(__dirname, '../src/modes/index.ts');

let content = readFileSync(MODES_INDEX_PATH, 'utf-8');

// Fix pattern: mode: ClassName,\n  ,\n    experimental: true}
// Should be: mode: ClassName,\n    experimental: true,
content = content.replace(/,\s*,\s*experimental:\s*true\}/g, ',\n    experimental: true,\n  }');

// Also fix cases where there's a trailing comma before experimental
content = content.replace(/(mode:\s*\w+),\s*,\s*experimental:\s*true/g, '$1,\n    experimental: true');

writeFileSync(MODES_INDEX_PATH, content, 'utf-8');
console.log('Fixed syntax errors in modes index');

