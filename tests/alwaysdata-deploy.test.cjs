'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  crypto = require('node:crypto');
const { execFileSync, spawnSync, spawn } = require('node:child_process');
const { once } = require('node:events');
const WebSocket = require('ws');
const { readConfiguration, verifyHostKey, publish } = require('../deploy/alwaysdata/deploy.cjs');
const { packageRelease } = require('../deploy/alwaysdata/package.cjs');
const { createRemoteOperations } = require('../deploy/alwaysdata/remote.cjs');
const { createAlwaysdataServer } = require('../deploy/alwaysdata/start.cjs');
const sha = 'a'.repeat(40),
  oldSha = 'b'.repeat(40);
function config() {
  return {
    ALWAYSDATA_ACCOUNT: 'bulkimport',
    ALWAYSDATA_SITE_ID: '1234',
    ALWAYSDATA_SSH_FINGERPRINT: 'SHA256:' + 'a'.repeat(43),
    ALWAYSDATA_SSH_PASSWORD: 'secret-password-example',
    ALWAYSDATA_API_TOKEN: 'secret-api-example',
  };
}
function temporary(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bulk-hosting-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
test('deployment configuration accepts the account and rejects shell syntax without exposing secrets', () => {
  const good = config(),
    c = readConfiguration(good);
  assert.equal(c.host, 'ssh-bulkimport.alwaysdata.net');
  assert.equal(c.url, 'https://bulkimport.alwaysdata.net');
  assert.equal(c.user, 'bulkimport');
  for (const [key, value] of [
    ['ALWAYSDATA_ACCOUNT', 'a;exit'],
    ['ALWAYSDATA_SITE_ID', '../1'],
    ['ALWAYSDATA_SSH_USER', 'root@other'],
    ['ALWAYSDATA_SSH_FINGERPRINT', 'MD5:abcd'],
  ])
    assert.throws(() => readConfiguration({ ...good, [key]: value }));
  const missing = { ...good, ALWAYSDATA_API_TOKEN: '' };
  assert.throws(
    () => readConfiguration(missing),
    (error) =>
      !error.message.includes(good.ALWAYSDATA_SSH_PASSWORD) &&
      error.message.includes('ALWAYSDATA_API_TOKEN'),
  );
});
test('SSH host key must match the fingerprint pinned by the owner before authentication', () => {
  const blob = crypto.randomBytes(51),
    fingerprint =
      'SHA256:' + crypto.createHash('sha256').update(blob).digest('base64').replace(/=+$/, '');
  const scanned =
    '# banner\nssh-bulkimport.alwaysdata.net ssh-ed25519 ' + blob.toString('base64') + '\n';
  assert.match(verifyHostKey(scanned, fingerprint), /^ssh-bulkimport/);
  assert.throws(() => verifyHostKey(scanned, 'SHA256:' + 'A'.repeat(43)));
  assert.throws(() => verifyHostKey('', fingerprint));
  assert.throws(() => verifyHostKey(scanned.replace('ssh-ed25519', 'ssh-rsa'), fingerprint));
});
test('remote helper really runs when streamed to node over SSH stdin', () => {
  const source = fs.readFileSync(path.join(__dirname, '../deploy/alwaysdata/remote.cjs'), 'utf8');
  const r = spawnSync(process.execPath, ['-', 'invalid/account', sha, 'prepare'], {
    input: source,
    encoding: 'utf8',
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Invalid alwaysdata account/);
});
test('bundle installs real production dependencies, switches atomically and rolls back without losing previous files', async (t) => {
  const dir = temporary(t),
    root = path.join(dir, 'host'),
    output = path.join(dir, 'bundle');
  const archive = packageRelease({ output, sha });
  const op = createRemoteOperations(root, sha, {
    install: (cwd) =>
      execFileSync(
        'npm',
        ['ci', '--omit=dev', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'],
        { cwd, stdio: 'pipe' },
      ),
  });
  assert.equal(op.prepare(), '');
  const previous = path.join(root, 'releases', oldSha);
  fs.mkdirSync(previous, { recursive: true });
  fs.writeFileSync(path.join(previous, 'DEPLOYMENT.json'), JSON.stringify({ sha: oldSha }));
  fs.writeFileSync(path.join(previous, 'sentinel.txt'), 'old game');
  fs.symlinkSync('releases/' + oldSha, path.join(root, 'current'));
  fs.copyFileSync(archive, path.join(root, 'incoming-' + sha + '.tar.gz'));
  op.install();
  assert.equal(
    fs.readlinkSync(path.join(root, 'current')),
    'releases/' + oldSha,
    'Installing never changes the running release',
  );
  const release = path.join(root, 'releases', sha),
    metadata = JSON.parse(fs.readFileSync(path.join(release, 'DEPLOYMENT.json')));
  assert.equal(metadata.sha, sha);
  assert(fs.existsSync(path.join(release, metadata.filename)));
  assert(fs.existsSync(path.join(release, 'node_modules/ws')));
  for (const name of ['.git', '.env', '.github', 'tests', 'vendor', 'campaign'])
    assert(!fs.existsSync(path.join(release, name)), 'Not included: ' + name);
  const child = spawn(process.execPath, [path.join(release, 'deploy/alwaysdata/start.cjs')], {
    env: { ...process.env, IP: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => {
    if (child.exitCode === null) child.kill('SIGTERM');
  });
  const port = await new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(Error('Packed app did not start')), 5000);
    child.once('error', reject);
    child.stdout.on('data', (data) => {
      text += data;
      const match = text.match(/port (\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
  });
  const response = await fetch('http://127.0.0.1:' + port + '/healthz');
  assert.equal(response.headers.get('x-bulk-import-deployment'), sha);
  assert.equal((await response.json()).ok, true);
  const closed = once(child, 'exit');
  child.kill('SIGTERM');
  await closed;

  op.activate();
  assert.equal(fs.readlinkSync(path.join(root, 'current')), 'releases/' + sha);
  op.rollback('releases/' + oldSha);
  assert.equal(fs.readlinkSync(path.join(root, 'current')), 'releases/' + oldSha);
  assert.equal(fs.readFileSync(path.join(previous, 'sentinel.txt'), 'utf8'), 'old game');
  op.rollback('releases/' + oldSha);
  assert.throws(() => op.rollback('../../other'));
  op.prune('releases/' + oldSha);
  assert(fs.existsSync(previous));
});
test('installer rejects a mislabeled bundle and never replaces an unmanaged current directory', (t) => {
  const dir = temporary(t),
    root = path.join(dir, 'host');
  let installed = false;
  const op = createRemoteOperations(root, sha, { install: () => (installed = true) });
  op.prepare();
  fs.mkdirSync(path.join(root, 'current'));
  assert.throws(() => op.prepare(), /symlink/);
  fs.rmdirSync(path.join(root, 'current'));
  const archive = packageRelease({ output: path.join(dir, 'bundle'), sha: oldSha });
  fs.copyFileSync(archive, path.join(root, 'incoming-' + sha + '.tar.gz'));
  assert.throws(() => op.install(), /does not match/);
  assert.equal(installed, false);
  assert(!fs.existsSync(path.join(root, 'current')));
});
test('failed health check restores the previous release and restarts it; installation failure leaves it untouched', async () => {
  for (const phase of ['install', 'verify']) {
    let current = 'releases/' + oldSha,
      restarts = 0,
      pruned = false;
    const prior = current;
    const remote = async (command, arg) => {
      if (command === 'prepare') return JSON.stringify({ previous: prior });
      if (command === phase) throw Error('test failure');
      if (command === 'activate') current = 'releases/' + sha;
      if (command === 'rollback') current = arg;
      if (command === 'prune') pruned = true;
    };
    await assert.rejects(
      () =>
        publish({
          remote,
          upload: async () => {},
          restart: async () => restarts++,
          verify: async () => {
            if (phase === 'verify') throw Error('test failure');
          },
          log: () => {},
        }),
      /test failure/,
    );
    assert.equal(current, prior);
    assert.equal(restarts, phase === 'verify' ? 2 : 0);
    assert.equal(pruned, false);
  }
});
test('successful deployment prunes only after verification and first deployment failure reports no false rollback', async () => {
  for (const failed of [false, true]) {
    const calls = [];
    const remote = async (command) => {
      calls.push(command);
      return command === 'prepare' ? JSON.stringify({ previous: '' }) : '';
    };
    const action = publish({
      remote,
      upload: async () => calls.push('upload'),
      restart: async () => calls.push('restart'),
      verify: async () => {
        calls.push('verify');
        if (failed) throw Error('unhealthy');
      },
      log: () => {},
    });
    if (failed) {
      await assert.rejects(() => action, /unhealthy/);
      assert(!calls.includes('rollback'));
      assert(!calls.includes('prune'));
    } else {
      await action;
      assert.deepEqual(calls, [
        'prepare',
        'upload',
        'install',
        'activate',
        'restart',
        'verify',
        'prune',
      ]);
    }
  }
});
test('alwaysdata entry serves the actual HTML and WebSocket game using the platform IP', async (t) => {
  const beforeIP = process.env.IP,
    beforeHOST = process.env.HOST;
  process.env.IP = '127.0.0.1';
  process.env.HOST = 'invalid.example';
  let game;
  try {
    game = createAlwaysdataServer({ port: 0 });
  } finally {
    if (beforeIP === undefined) delete process.env.IP;
    else process.env.IP = beforeIP;
    if (beforeHOST === undefined) delete process.env.HOST;
    else process.env.HOST = beforeHOST;
  }
  const { url } = await game.listen();
  t.after(() => game.close());
  const health = await fetch(url + '/healthz').then((r) => r.json());
  assert.equal(health.ok, true);
  assert.equal(health.version, require('../release.cjs').major);
  const html = await fetch(url + '/play').then((r) => r.text());
  assert(html.includes('GWINTFORCE'));
  const ws = new WebSocket(url.replace('http:', 'ws:') + '/ws');
  t.after(() => ws.terminate());
  const [message] = await once(ws, 'message');
  assert.equal(JSON.parse(String(message)).t, 'welcome');
  ws.close();
  await once(ws, 'close');
});
