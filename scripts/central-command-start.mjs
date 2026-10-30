#!/usr/bin/env node
/** Local launcher for the Central Command fork. No shell or global configuration changes. */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandEnvironment } from './central-command-env.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const development = process.argv.includes('--dev');
const unsupported = process.argv.slice(2).filter((argument) => argument !== '--dev');
if (unsupported.length > 0) {
  console.error('Usage: node scripts/central-command-start.mjs [--dev]');
  process.exit(1);
}

function portFromEnvironment(name, fallback) {
  const value = process.env[name] ?? String(fallback);
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error(`${name} must be a port between 1 and 65535.`);
  }
  return value;
}

const serverPort = portFromEnvironment('CENTRAL_COMMAND_PORT', 4311);
const clientPort = portFromEnvironment('CENTRAL_COMMAND_DEV_PORT', 4310);
if (development && serverPort === clientPort) {
  throw new Error('CENTRAL_COMMAND_PORT and CENTRAL_COMMAND_DEV_PORT must be different.');
}

const dependenciesPresent = existsSync(path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'));
if (!dependenciesPresent) {
  console.error('Dependencies are missing. Run npm ci in the repository, then try again.');
  process.exit(1);
}
if (!development && (!existsSync(path.join(projectRoot, 'dist', 'index.html'))
    || !existsSync(path.join(projectRoot, 'dist-server', 'server', 'index.js')))) {
  console.error('Central Command has not been built. Run npm run build, then try again.');
  process.exit(1);
}

const environment = {
  ...commandEnvironment(),
  HOST: '127.0.0.1',
  SERVER_PORT: serverPort,
  VITE_PORT: clientPort,
  // This fork does not reuse another CloudCLI install's account or preferences.
  DATABASE_PATH: process.env.CENTRAL_COMMAND_DATABASE_PATH
    || path.join(homedir(), '.central-command', 'auth.db'),
  // Keep upstream authentication active even if the host has platform flags set.
  VITE_IS_PLATFORM: 'false',
};

console.log(`Central Command: http://127.0.0.1:${development ? clientPort : serverPort}`);
console.log('Local access only. Press Ctrl+C to stop.');

const children = [];
let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
}

function launch(arguments_) {
  const child = spawn(process.execPath, arguments_, {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
    windowsHide: true,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Could not start Central Command: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) stop(signal ? 1 : (code ?? 1));
  });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

if (development) {
  launch(['node_modules/tsx/dist/cli.mjs', '--tsconfig', 'server/tsconfig.json', 'server/index.ts']);
  launch(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', clientPort, '--strictPort']);
} else {
  launch(['dist-server/server/index.js']);
}
