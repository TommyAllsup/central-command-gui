#!/usr/bin/env node
/** Check authenticated discovery against a disposable account database; never send agent work. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { commandEnvironment } from './central-command-env.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = path.resolve(tmpdir());
const testDirectory = mkdtempSync(path.join(temporaryRoot, 'central-command-smoke-'));
const portProbe = net.createServer();
await new Promise((resolve, reject) => {
  portProbe.once('error', reject);
  portProbe.listen(0, '127.0.0.1', resolve);
});
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const origin = `http://127.0.0.1:${port}`;

const server = spawn(process.execPath, ['dist-server/server/index.js'], {
  cwd: projectRoot,
  env: {
    ...commandEnvironment(),
    HOST: '127.0.0.1',
    SERVER_PORT: String(port),
    DATABASE_PATH: path.join(testDirectory, 'auth.db'),
    VITE_IS_PLATFORM: 'false',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
let synchronized = false;
let serverError;
server.on('error', (error) => { serverError = error; });
server.stdout.on('data', (data) => {
  if (data.toString().includes('Initial session synchronization complete')) synchronized = true;
});
// Consume startup diagnostics without printing private project/session metadata.
server.stderr.on('data', () => {});
const serverClosed = new Promise((resolve) => server.once('close', resolve));

try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error(`Smoke server exited with code ${server.exitCode}. Build it first.`);
    try {
      const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(1000) });
      ready = response.ok && synchronized;
      if (ready) break;
    } catch {}
    await delay(200);
  }
  assert.ok(ready, 'Server did not become ready and finish initial discovery within 30 seconds.');

  const status = await fetch(`${origin}/api/auth/status`).then((response) => response.json());
  assert.equal(status.needsSetup, true, 'The test must use an empty account database.');
  assert.equal((await fetch(`${origin}/api/providers/sessions/recent`)).status, 401);

  const registrationResponse = await fetch(`${origin}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'central-command-qa', password: randomUUID() }),
  });
  assert.equal(registrationResponse.status, 200);
  const registration = await registrationResponse.json();
  assert.equal(typeof registration.token, 'string');
  const headers = { Authorization: `Bearer ${registration.token}` };

  const projectResponse = await fetch(`${origin}/api/projects`, { headers });
  assert.equal(projectResponse.status, 200);
  const projects = await projectResponse.json();
  assert.ok(Array.isArray(projects), 'Projects API must return the array the adapter consumes.');
  const [recentResponse, runningResponse] = await Promise.all([
    fetch(`${origin}/api/providers/sessions/recent?limit=40&offset=0`, { headers }),
    fetch(`${origin}/api/providers/sessions/running`, { headers }),
  ]);
  assert.equal(recentResponse.status, 200);
  assert.equal(runningResponse.status, 200);
  const recent = await recentResponse.json();
  const running = await runningResponse.json();
  assert.ok(Array.isArray(recent.data?.conversations), 'Recent sessions envelope must match the adapter.');
  assert.equal(typeof recent.data.total, 'number');
  assert.ok(Array.isArray(running.data?.sessions), 'Running sessions envelope must match the adapter.');
  for (const session of recent.data.conversations) {
    assert.equal(typeof session.sessionId, 'string');
    assert.equal(typeof session.provider, 'string');
  }
  console.log(JSON.stringify({
    result: 'PASS',
    checks: ['first-use setup', 'unauthenticated rejection', 'temporary registration', 'projects', 'recent sessions envelope', 'running sessions envelope'],
    projects: projects.length,
    recentSessions: recent.data.conversations.length,
    totalSessions: recent.data.total,
    activeRunsInTestServer: running.data.sessions.length,
    inferenceRequests: 0,
  }, null, 2));
} finally {
  server.kill('SIGTERM');
  await Promise.race([serverClosed, delay(5000)]);
  // Delete only the exact temporary directory this test created, inside the OS temp root.
  const resolvedTestDirectory = path.resolve(testDirectory);
  if (path.dirname(resolvedTestDirectory) !== temporaryRoot
      || !path.basename(resolvedTestDirectory).startsWith('central-command-smoke-')) {
    throw new Error('Refusing cleanup outside the smoke-test temporary directory.');
  }
  rmSync(resolvedTestDirectory, { recursive: true, force: true });
}
