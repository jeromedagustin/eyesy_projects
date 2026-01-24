/**
 * Tool to mark experimental modes based on validation test results
 * Run: npm test -- mode-validation.test.ts --run
 * Then run this script to update the modes index
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// List of mode IDs that are known to be experimental (failing validation)
// This should be updated after running validation tests
const EXPERIMENTAL_MODE_IDS = [
  // Add mode IDs here after running validation tests
  // Example: 's---aquarium', 't---basic-image'
];

const MODES_INDEX_PATH = join(__dirname, '../src/modes/index.ts');

function markExperimentalModes() {
  const content = readFileSync(MODES_INDEX_PATH, 'utf-8');
  
  // Find each mode definition and add experimental flag if needed
  let updatedContent = content;
  
  EXPERIMENTAL_MODE_IDS.forEach(modeId => {
    // Find the mode definition by ID
    const modeRegex = new RegExp(
      `(\\{[^}]*id:\\s*['"]${modeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][^}]*)(\\})`,
      'g'
    );
    
    updatedContent = updatedContent.replace(modeRegex, (match, before, after) => {
      // Check if experimental flag already exists
      if (match.includes('experimental:')) {
        return match; // Already marked
      }
      // Add experimental flag before the closing brace
      return before + ',\n    experimental: true' + after;
    });
  });
  
  writeFileSync(MODES_INDEX_PATH, updatedContent, 'utf-8');
  console.log(`Marked ${EXPERIMENTAL_MODE_IDS.length} modes as experimental`);
}

markExperimentalModes();

