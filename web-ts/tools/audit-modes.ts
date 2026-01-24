#!/usr/bin/env node
/**
 * Mode Audit Script
 * Checks for inconsistencies in mode implementations and experimental flags
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ModeAuditResult {
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
  // Check if draw method has actual implementation (not just TODO)
  const drawMatch = content.match(/draw\s*\([^)]*\)\s*:\s*void\s*\{([^}]*)\}/s);
  if (!drawMatch) return false;
  
  const drawBody = drawMatch[1];
  // Has implementation if it's not just comments/TODOs
  const hasCode = drawBody
    .split('\n')
    .some(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('*') &&
             !/TODO|FIXME/i.test(trimmed);
    });
  
  return hasCode;
}

interface ModeEntry {
  id: string;
  name: string;
  category: string;
  className: string;
  experimental?: boolean;
}

function getModeInfoFromIndex(): Map<string, ModeEntry> {
  const indexPath = path.join(__dirname, '../src/modes/index.ts');
  const content = fs.readFileSync(indexPath, 'utf-8');
  const modeMap = new Map<string, ModeEntry>();
  
  // Extract imports to map class names
  const importMap = new Map<string, string>();
  const importRegex = /import\s+{\s*(\w+)\s*}\s+from\s+['"]\.\/(scopes|triggers|utilities|mixed)\/(\w+)['"]/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    const className = importMatch[1];
    const category = importMatch[2];
    const fileName = importMatch[3];
    importMap.set(className, path.join(category, fileName));
  }
  
  // Extract mode entries from the modes array
  // Match: { id: '...', name: '...', category: '...', mode: ClassName, experimental: true/false }
  // Handle both formats: with and without experimental flag
  const modeEntryRegex = /{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*mode:\s*(\w+)(?:,\s*experimental:\s*(true|false))?\s*}/gs;
  
  let modeMatch;
  while ((modeMatch = modeEntryRegex.exec(content)) !== null) {
    const id = modeMatch[1];
    const name = modeMatch[2];
    const category = modeMatch[3];
    const className = modeMatch[4];
    const experimentalStr = modeMatch[5];
    const experimental = experimentalStr === 'true' ? true : experimentalStr === 'false' ? false : undefined;
    
    modeMap.set(id, {
      id,
      name,
      category,
      className,
      experimental
    });
  }
  
  return modeMap;
}

function findModeFile(entry: ModeEntry): string | null {
  const indexPath = path.join(__dirname, '../src/modes/index.ts');
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Find the import for this class
  const importRegex = new RegExp(`import\\s+{\\s*${entry.className}\\s*}\\s+from\\s+['"]\\.\\/(scopes|triggers|utilities|mixed)\\/(\\w+)['"]`);
  const match = content.match(importRegex);
  
  if (match) {
    const category = match[1];
    const fileName = match[2];
    const filePath = path.join(__dirname, '../src/modes', category, `${fileName}.ts`);
    
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

function auditModes(): ModeAuditResult[] {
  const results: ModeAuditResult[] = [];
  const modeInfo = getModeInfoFromIndex();
  
  for (const [id, entry] of modeInfo.entries()) {
    const filePath = findModeFile(entry);
    
    if (!filePath) {
      results.push({
        name: entry.name,
        file: 'NOT FOUND',
        hasTodo: false,
        hasImplementation: false,
        isExperimental: entry.experimental,
        issues: [`Mode file not found for class ${entry.className}`]
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

if (withIssues.length > 0 && withIssues.length !== incorrectlyMarked.length) {
  console.log('\n\n⚠️  Other Issues:');
  console.log('-'.repeat(80));
  withIssues
    .filter(r => !incorrectlyMarked.includes(r))
    .forEach(mode => {
      console.log(`\n${mode.name}`);
      console.log(`  Issues: ${mode.issues.join(', ')}`);
    });
}

console.log('\n\n✅ Summary:');
console.log(`  Fully implemented (non-experimental): ${results.filter(r => r.hasImplementation && r.isExperimental === false).length}`);
console.log(`  Fully implemented (experimental): ${results.filter(r => r.hasImplementation && r.isExperimental === true).length}`);
console.log(`  Stubs (experimental): ${results.filter(r => !r.hasImplementation && r.isExperimental === true).length}`);
console.log(`  Stubs (not marked): ${results.filter(r => !r.hasImplementation && r.isExperimental === undefined).length}`);

