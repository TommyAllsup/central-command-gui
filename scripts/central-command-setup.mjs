#!/usr/bin/env node
/** Install and build with npm's normal lifecycle scripts on Windows and macOS. */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandEnvironment } from './central-command-env.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeDirectory = path.dirname(process.execPath);
const npmCandidates = [
  process.env.npm_execpath,
  path.join(nodeDirectory, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  path.resolve(nodeDirectory, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
].filter(Boolean);
const npmCli = npmCandidates.find((candidate) => existsSync(candidate));
if (!npmCli) {
  console.error('Could not locate npm beside Node.js. Run npm ci and npm run build manually.');
  process.exit(1);
}

for (const command of [['ci'], ['run', 'build']]) {
  const result = spawnSync(process.execPath, [npmCli, ...command], {
    cwd: projectRoot,
    env: { ...commandEnvironment(), VITE_IS_PLATFORM: 'false' },
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
console.log('Ready. Run node scripts/central-command-start.mjs');
