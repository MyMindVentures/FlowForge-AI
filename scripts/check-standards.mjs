import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import module from 'node:module';

const rootDir = process.cwd();
const builtinModules = new Set(module.builtinModules.concat(module.builtinModules.map((entry) => `node:${entry}`)));
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const declaredDependencies = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.optionalDependencies || {}),
]);
const validExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const commentExclusions = [
  /\.test\.[cm]?[jt]sx?$/,
  /setupTests\.[cm]?[jt]s$/,
  /vite\.config\.ts$/,
  /vitest\.config\.ts$/,
];

function getStagedFiles() {
  try {
    return execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
      cwd: rootDir,
      encoding: 'utf8',
    })
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function walk(dirPath, files = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (validExtensions.has(path.extname(entry.name))) {
      files.push(path.relative(rootDir, fullPath));
    }
  }

  return files;
}

function getPackageName(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }

  return specifier.split('/')[0];
}

function getStaticImportSpecifiers(source) {
  const importRegex = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  const specifiers = [];

  for (const match of source.matchAll(importRegex)) {
    const specifier = match[1];
    if (specifier) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

function hasJsDocBefore(lines, index) {
  let cursor = index - 1;

  while (cursor >= 0 && lines[cursor].trim() === '') {
    cursor -= 1;
  }

  if (cursor < 0 || lines[cursor].trim() !== '*/') {
    return false;
  }

  while (cursor >= 0) {
    const line = lines[cursor].trim();
    if (line.startsWith('/**')) {
      return true;
    }
    if (line.startsWith('*') || line === '*/') {
      cursor -= 1;
      continue;
    }
    return false;
  }

  return false;
}

function checkImports(relativePath, source, errors, enforceDuplicateImports) {
  const imports = getStaticImportSpecifiers(source);
  const seen = new Set();

  for (const specifier of imports) {
    if (enforceDuplicateImports && seen.has(specifier)) {
      errors.push(`${relativePath} Duplicate import source detected: ${specifier}`);
    }
    seen.add(specifier);

    if (
      specifier.startsWith('.') ||
      specifier.startsWith('/') ||
      specifier.startsWith('file:') ||
      builtinModules.has(specifier)
    ) {
      continue;
    }

    const packageName = getPackageName(specifier);
    if (!declaredDependencies.has(packageName)) {
      errors.push(`${relativePath} imports ${specifier}, but ${packageName} is not declared in package.json.`);
    }
  }
}

function checkComments(relativePath, source, errors) {
  if (commentExclusions.some((pattern) => pattern.test(relativePath))) {
    return;
  }

  const lines = source.split(/\r?\n/);
  const exportedFunctionPattern = /^export\s+(default\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)/;
  const exportedConstFunctionPattern = /^export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(async\s*)?(\(|<[A-Za-z])/;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const match = trimmed.match(exportedFunctionPattern) || trimmed.match(exportedConstFunctionPattern);
    if (!match) {
      return;
    }

    const functionName = match[3] || match[1] || 'anonymous';
    if (!hasJsDocBefore(lines, index)) {
      errors.push(`${relativePath}:${index + 1} Missing JSDoc comment before exported function ${functionName}.`);
    }
  });
}

function main() {
  const stagedOnly = process.argv.includes('--staged');
  const files = (stagedOnly ? getStagedFiles() : walk(rootDir)).filter((filePath) => {
    const fullPath = path.join(rootDir, filePath);
    return fs.existsSync(fullPath) && validExtensions.has(path.extname(filePath));
  });
  const errors = [];

  for (const relativePath of files) {
    const source = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
    checkImports(relativePath, source, errors, stagedOnly);
    if (stagedOnly) {
      checkComments(relativePath, source, errors);
    }
  }

  if (errors.length > 0) {
    console.error('\nStandards check failed.\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Standards check passed for ${files.length} file(s).`);
}

main();