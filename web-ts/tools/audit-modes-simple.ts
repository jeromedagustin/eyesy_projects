#!/usr/bin/env node
/**
 * Simple Mode Audit Script
 * Checks for inconsistencies in mode implementations and experimental flags
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuditResult {
  name: string;
  file: string;
  hasTodo: boolean;
  hasImplementation: boolean;
  isExperimental: boolean | undefined;
  issues: string[];
}

function checkFileForTodos(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return /TODO|FIXME|XXX/i.test(content);
}

function checkFileForImplementation(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Check if draw method has actual implementation
  const drawMatch = content.match(/draw\s*\([^)]*\)\s*:\s*void\s*\{([^}]*)\}/s);
  if (!drawMatch) return false;
  
  const drawBody = drawMatch[1];
  // Has implementation if it's not just comments/TODOs
  const lines = drawBody.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0 && 
        !trimmed.startsWith('//') && 
        !trimmed.startsWith('*') &&
        !/TODO|FIXME/i.test(trimmed)) {
      return true;
    }
  }
  
  return false;
}

function auditModes(): AuditResult[] {
  const results: AuditResult[] = [];
  const indexPath = path.join(__dirname, '../src/modes/index.ts');
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Find all mode entries
  const modeEntries: Array<{id: string, name: string, className: string, experimental?: boolean}> = [];
  
  // Extract mode entries - look for patterns like:
  // { id: '...', name: '...', category: '...', mode: ClassName, experimental: true/false }
  const lines = content.split('\n');
  let inModesArray = false;
  let currentEntry: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('export const modes:')) {
      inModesArray = true;
      continue;
    }
    
    if (!inModesArray) continue;
    
    // Match id
    const idMatch = line.match(/id:\s*['"]([^'"]+)['"]/);
    if (idMatch) {
      currentEntry = { id: idMatch[1] };
      continue;
    }
    
    // Match name
    const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
    if (nameMatch && currentEntry) {
      currentEntry.name = nameMatch[1];
      continue;
    }
    
    // Match mode (class name)
    const modeMatch = line.match(/mode:\s*(\w+)/);
    if (modeMatch && currentEntry) {
      currentEntry.className = modeMatch[1];
      continue;
    }
    
    // Match experimental
    const expMatch = line.match(/experimental:\s*(true|false)/);
    if (expMatch && currentEntry) {
      currentEntry.experimental = expMatch[1] === 'true';
      continue;
    }
    
    // End of entry
    if (line.trim() === '},' || line.trim() === '}') {
      if (currentEntry && currentEntry.className) {
        modeEntries.push(currentEntry);
      }
      currentEntry = null;
    }
  }
  
  // Now find the file for each mode
  for (const entry of modeEntries) {
    // Find import for this class
    const importMatch = content.match(new RegExp(`import\\s+{\\s*${entry.className}\\s*}\\s+from\\s+['"]\\.\\/(scopes|triggers|utilities|mixed)\\/(\\w+)['"]`));
    
    let filePath: string | null = null;
    if (importMatch) {
      const category = importMatch[1];
      const fileName = importMatch[2];
      filePath = path.join(__dirname, '../src/modes', category, `${fileName}.ts`);
      if (!fs.existsSync(filePath)) {
        filePath = null;
      }
    }
    
    if (!filePath) {
      results.push({
        name: entry.name,
        file: 'NOT FOUND',
        hasTodo: false,
        hasImplementation: false,
        isExperimental: entry.experimental,
        issues: [`File not found for class ${entry.className}`]
      });
      continue;
    }
    
    const hasTodo = checkFileForTodos(filePath);
    const hasImplementation = checkFileForImplementation(filePath);
    const issues: string[] = [];
    
    // Check for inconsistencies
    if (hasImplementation && entry.experimental === true) {
      issues.push('Has implementation but marked as experimental');
    }
    
    if (!hasImplementation && entry.experimental === false) {
      issues.push('No implementation but marked as non-experimental');
    }
    
    if (hasTodo && !hasImplementation && entry.experimental === undefined) {
      issues.push('Has TODO but not marked as experimental');
    }
    
    results.push({
      name: entry.name,
      file: path.relative(path.join(__dirname, '..'), filePath),
      hasTodo,
      hasImplementation,
      isExperimental: entry.experimental,
      issues
    });
  }
  
  return results;
}

// Run audit
const results = auditModes();

console.log('Mode Audit Results\n');
console.log('='.repeat(80));

const withIssues = results.filter(r => r.issues.length > 0);
const withoutImplementation = results.filter(r => !r.hasImplementation);
const incorrectlyMarked = results.filter(r => 
  (r.hasImplementation && r.isExperimental === true) ||
  (!r.hasImplementation && r.isExperimental === false)
);

console.log(`\nTotal modes: ${results.length}`);
console.log(`Modes with issues: ${withIssues.length}`);
console.log(`Modes without implementation: ${withoutImplementation.length}`);
console.log(`Incorrectly marked: ${incorrectlyMarked.length}`);

if (incorrectlyMarked.length > 0) {
  console.log('\n\n❌ Incorrectly Marked Modes:');
  console.log('-'.repeat(80));
  incorrectlyMarked.forEach(mode => {
    console.log(`\n${mode.name}`);
    console.log(`  File: ${mode.file}`);
    console.log(`  Experimental: ${mode.isExperimental}`);
    console.log(`  Has Implementation: ${mode.hasImplementation}`);
    console.log(`  Issues: ${mode.issues.join(', ')}`);
  });
}

const stubsNotMarked = results.filter(r => !r.hasImplementation && r.isExperimental === undefined);
if (stubsNotMarked.length > 0) {
  console.log('\n\n⚠️  Stubs Not Marked as Experimental:');
  console.log('-'.repeat(80));
  stubsNotMarked.slice(0, 20).forEach(mode => {
    console.log(`  ${mode.name}`);
  });
  if (stubsNotMarked.length > 20) {
    console.log(`  ... and ${stubsNotMarked.length - 20} more`);
  }
}

console.log('\n\n✅ Summary:');
console.log(`  Fully implemented (non-experimental): ${results.filter(r => r.hasImplementation && r.isExperimental === false).length}`);
console.log(`  Fully implemented (experimental): ${results.filter(r => r.hasImplementation && r.isExperimental === true).length}`);
console.log(`  Stubs (experimental): ${results.filter(r => !r.hasImplementation && r.isExperimental === true).length}`);
console.log(`  Stubs (not marked): ${results.filter(r => !r.hasImplementation && r.isExperimental === undefined).length}`);

