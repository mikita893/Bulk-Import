'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { VERSION } = require('../multiplayer/shared.cjs');

const ROOT = path.resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function inspectServer(port) {
  try {
    const [health, config] = await Promise.all(['/healthz', '/api/config'].map(async endpoint => {
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, { signal: AbortSignal.timeout(750) });
      if (!response.ok) throw new Error('Nieprawidłowa odpowiedź serwera');
      return response.json();
    }));
    return health.ok === true && health.version === VERSION && config.version === VERSION &&
      config.protocol === 1 && config.factionKits?.salesforce && config.factionKits?.excel ? 'ready' : 'occupied';
  } catch (error) {
    return error.cause?.code === 'ECONNREFUSED' ? 'free' : 'occupied';
  }
}

async function startServer(options = {}) {
  const port = Number(options.port ?? process.env.BULK_IMPORT_PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port musi być liczbą od 1 do 65535.');
  const logFile = options.logFile || process.env.BULK_IMPORT_LOG || path.join(os.tmpdir(), 'bulk-import-server.log');
  const initial = await inspectServer(port);
  if (initial === 'ready') return { started: false, port, logFile };
  if (initial !== 'free') throw new Error(`Port ${port} zajmuje inna lub starsza aplikacja. Nie zatrzymano jej. Log gry: ${logFile}`);

  const logFd = fs.openSync(logFile, 'a', 0o600);
  let child;
  try {
    child = spawn(process.execPath, [path.join(ROOT, 'server/index.cjs')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port) },
      detached: true,
      stdio: ['ignore', logFd, logFd]
    });
  } finally {
    fs.closeSync(logFd);
  }
  let spawnError = null;
  child.on('error', error => { spawnError = error; });
  child.unref();
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await inspectServer(port) === 'ready') return { started: true, pid: child.pid, port, logFile };
    if (spawnError || child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Nie udało się uruchomić gry${spawnError ? `: ${spawnError.message}` : ''}. Sprawdź log: ${logFile}`);
    }
    await delay(100);
  }
  throw new Error(`Gra nie potwierdziła gotowości na porcie ${port}. Sprawdź log: ${logFile}`);
}

if (require.main === module) {
  startServer().then(result => {
    console.log(`Bulk Import v${VERSION}: ${result.started ? 'uruchomiono' : 'już działa'}, port ${result.port}. Log: ${result.logFile}`);
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { startServer };
