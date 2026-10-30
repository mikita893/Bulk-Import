'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const required = [
  'ALWAYSDATA_ACCOUNT',
  'ALWAYSDATA_SITE_ID',
  'ALWAYSDATA_SSH_FINGERPRINT',
  'ALWAYSDATA_SSH_PASSWORD',
  'ALWAYSDATA_API_TOKEN',
];
function readConfiguration(env = process.env) {
  const missing = required.filter((name) => !env[name]);
  if (missing.length) throw Error('Uzupełnij konfigurację GitHub: ' + missing.join(', '));
  const account = env.ALWAYSDATA_ACCOUNT,
    site = env.ALWAYSDATA_SITE_ID,
    fingerprint = env.ALWAYSDATA_SSH_FINGERPRINT.trim(),
    user = env.ALWAYSDATA_SSH_USER || account;
  if (
    !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(account) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/.test(user)
  )
    throw Error('Niepoprawna nazwa konta lub użytkownika SSH');
  if (!/^[1-9]\d*$/.test(site)) throw Error('SITE_ID musi być dodatnią liczbą z panelu alwaysdata');
  if (!/^SHA256:[A-Za-z0-9+/]{43}=?$/.test(fingerprint))
    throw Error('Wklej odcisk SHA256 klucza SSH ED25519 z panelu alwaysdata');
  return {
    account,
    site,
    fingerprint,
    user,
    host: 'ssh-' + account + '.alwaysdata.net',
    url: 'https://' + account + '.alwaysdata.net',
  };
}
function verifyHostKey(output, expected) {
  const keys = output.split(/\r?\n/).filter((line) => line && !line.startsWith('#'));
  if (!keys.length) throw Error('Nie udało się odczytać klucza hosta SSH');
  for (const line of keys) {
    const fields = line.trim().split(/\s+/);
    if (fields[1] !== 'ssh-ed25519' || !fields[2]) throw Error('Nieoczekiwany typ klucza hosta');
    const actual =
      'SHA256:' +
      crypto
        .createHash('sha256')
        .update(Buffer.from(fields[2], 'base64'))
        .digest('base64')
        .replace(/=+$/, '');
    if (actual !== expected.replace(/=+$/, ''))
      throw Error('Odcisk SSH różni się od zapisanego w GitHub. Publikacja zatrzymana.');
  }
  return keys.join('\n') + '\n';
}
function run(file, args, { input, env = process.env, timeout = 240000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '',
      stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(Error(file + ': przekroczono czas operacji'));
    }, timeout);
    child.stdout.on('data', (data) => (stdout += data));
    child.stderr.on('data', (data) => (stderr += data));
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(Error(file + ' zakończył się kodem ' + code + ': ' + stderr.slice(-1500)));
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
async function publish({ remote, upload, restart, verify, log = console.log }) {
  const { previous } = JSON.parse(await remote('prepare'));
  if (previous !== '' && !/^releases\/[a-f0-9]{40}$/.test(previous))
    throw Error('Niepoprawna poprzednia wersja');
  let activated = false;
  try {
    log('Przesyłam i instaluję nową wersję.');
    await upload();
    await remote('install');
    activated = true;
    await remote('activate');
    log('Restartuję witrynę.');
    await restart();
    await verify();
  } catch (error) {
    if (activated && previous) {
      log('Wdrożenie nie przeszło kontroli. Przywracam poprzednią wersję.');
      try {
        await remote('rollback', previous);
        await restart();
      } catch (rollbackError) {
        throw Error(
          error.message + '; powrót wymaga sprawdzenia panelu alwaysdata: ' + rollbackError.message,
        );
      }
    } else if (activated)
      log(
        'To pierwsze wdrożenie; brak poprzedniej wersji. Pliki pozostają do sprawdzenia konfiguracji.',
      );
    throw error;
  }
  try {
    await remote('prune', previous);
  } catch {
    log('Wersja działa. Sprzątanie starszych katalogów wymaga ponowienia.');
  }
}
async function main() {
  if (require('./settings.json').paused)
    throw Error('Publikacja na alwaysdata jest wstrzymana na prośbę użytkownika.');
  const config = readConfiguration();
  if (process.argv.includes('--check')) {
    console.log('Dane do wdrożenia są ustawione.');
    return;
  }
  const sha = process.env.GITHUB_SHA;
  if (!/^[a-f0-9]{40}$/.test(sha || '')) throw Error('Brak pełnego GITHUB_SHA');
  const archive = path.resolve(__dirname, '../../dist/alwaysdata/bulk-import.tar.gz');
  if (!fs.existsSync(archive)) throw Error('Najpierw zbuduj paczkę wdrożeniową');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bulk-alwaysdata-'));
  try {
    const scanned = await run('ssh-keyscan', ['-T', '15', '-t', 'ed25519', config.host], {
      timeout: 25000,
    });
    const known = path.join(temp, 'known_hosts');
    fs.writeFileSync(known, verifyHostKey(scanned, config.fingerprint), { mode: 0o600 });
    const askpass = path.join(temp, 'askpass.cjs');
    fs.writeFileSync(
      askpass,
      "#!/usr/bin/env node\nprocess.stdout.write(process.env.ALWAYSDATA_SSH_PASSWORD||'');\n",
      { mode: 0o700 },
    );
    const env = {
      ...process.env,
      SSH_ASKPASS: askpass,
      SSH_ASKPASS_REQUIRE: 'force',
      DISPLAY: ':0',
    };
    const options = [
      '-o',
      'StrictHostKeyChecking=yes',
      '-o',
      'UserKnownHostsFile=' + known,
      '-o',
      'NumberOfPasswordPrompts=1',
      '-o',
      'PreferredAuthentications=password',
      '-o',
      'PubkeyAuthentication=no',
      '-o',
      'ConnectTimeout=15',
      '-o',
      'ServerAliveInterval=15',
      '-o',
      'ServerAliveCountMax=2',
    ];
    const source = fs.readFileSync(path.join(__dirname, 'remote.cjs'), 'utf8');
    const remote = (command, prior = '') =>
      run(
        'ssh',
        [
          '-T',
          ...options,
          config.user + '@' + config.host,
          'NODEJS_VERSION=22 node - ' +
            config.account +
            ' ' +
            sha +
            ' ' +
            command +
            (prior ? ' ' + prior : ''),
        ],
        { input: source, env },
      );
    const upload = () =>
      run(
        'scp',
        [
          '-q',
          ...options,
          archive,
          config.user +
            '@' +
            config.host +
            ':/home/' +
            config.account +
            '/bulk-import/incoming-' +
            sha +
            '.tar.gz',
        ],
        { env },
      );
    const restart = async () => {
      const auth = Buffer.from(
        process.env.ALWAYSDATA_API_TOKEN + ' account=' + config.account + ':',
      ).toString('base64');
      const response = await fetch(
        'https://api.alwaysdata.com/v1/site/' + config.site + '/restart/',
        {
          method: 'POST',
          redirect: 'error',
          headers: { Authorization: 'Basic ' + auth },
          signal: AbortSignal.timeout(20000),
        },
      );
      if (!response.ok) throw Error('Restart alwaysdata: HTTP ' + response.status);
    };
    const verify = async () => {
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          const response = await fetch(config.url + '/healthz?deployment=' + sha, {
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(5000),
          });
          const health = await response.json();
          if (response.ok && health.ok && response.headers.get('x-bulk-import-deployment') === sha)
            return;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      throw Error('Nowa wersja nie odpowiedziała poprawnie na /healthz');
    };
    await publish({ remote, upload, restart, verify });
    console.log('Gra opublikowana: ' + config.url);
    if (process.env.GITHUB_STEP_SUMMARY)
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        'Gra: ' + config.url + '\n\nCommit: `' + sha + '`\n',
      );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { readConfiguration, verifyHostKey, publish };
