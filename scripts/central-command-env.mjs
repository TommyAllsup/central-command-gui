import { existsSync } from 'node:fs';
import path from 'node:path';

/** Used by setup and launch; remove stale Windows PATH entries only in their child processes. */
export function commandEnvironment() {
  const environment = { ...process.env };
  if (process.platform !== 'win32') return environment;
  const pathKey = Object.keys(environment).find((key) => key.toLowerCase() === 'path') || 'Path';
  const entries = [path.dirname(process.execPath), ...(environment[pathKey] || '').split(';')];
  const seen = new Set();
  environment[pathKey] = entries.filter((entry) => {
    const key = entry.replace(/[\\/]+$/, '').toLowerCase();
    if (!entry || seen.has(key) || !existsSync(entry)) return false;
    seen.add(key);
    return true;
  }).join(';');
  return environment;
}
