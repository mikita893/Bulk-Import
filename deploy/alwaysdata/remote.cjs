'use strict';
// Sent over verified SSH. Only this application's releases and symlinks are touched.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
function createRemoteOperations(
  root,
  sha,
  {
    install = (cwd) =>
      execFileSync('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
        cwd,
        stdio: 'pipe',
        timeout: 180000,
      }),
  } = {},
) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Error('Invalid release ID');
  const releases = path.join(root, 'releases'),
    current = path.join(root, 'current'),
    target = 'releases/' + sha,
    archive = path.join(root, 'incoming-' + sha + '.tar.gz');
  function previous() {
    if (!fs.existsSync(current) && !fs.lstatSync(current, { throwIfNoEntry: false })) return '';
    if (!fs.lstatSync(current).isSymbolicLink())
      throw Error('current must be a managed symlink, not a directory');
    const link = fs.readlinkSync(current);
    if (!/^releases\/[a-f0-9]{40}$/.test(link)) throw Error('Unknown current release path');
    if (!fs.existsSync(path.join(root, link))) throw Error('Current release is missing');
    return link;
  }
  function switchTo(link) {
    const next = path.join(root, '.next-' + sha);
    if (fs.existsSync(next) || fs.lstatSync(next, { throwIfNoEntry: false })) fs.unlinkSync(next);
    fs.symlinkSync(link, next);
    fs.renameSync(next, current);
  }
  return {
    prepare() {
      fs.mkdirSync(releases, { recursive: true });
      return previous();
    },
    install() {
      const stage = fs.mkdtempSync(path.join(root, '.stage-'));
      try {
        execFileSync('tar', ['-xzf', archive, '-C', stage, '--no-same-owner']);
        const metadata = JSON.parse(fs.readFileSync(path.join(stage, 'DEPLOYMENT.json'), 'utf8'));
        if (metadata.sha !== sha) throw Error('Bundle commit does not match deployment');
        install(stage);
        execFileSync(
          process.execPath,
          [
            '-e',
            "require('ws');require('./server/index.cjs');require('./deploy/alwaysdata/start.cjs');const r=require('./release.cjs'),d=require('./DEPLOYMENT.json');if(r.version!==d.version)process.exit(1);",
          ],
          { cwd: stage, stdio: 'pipe' },
        );
        const release = path.join(releases, sha);
        if (fs.existsSync(release)) {
          const old = JSON.parse(fs.readFileSync(path.join(release, 'DEPLOYMENT.json'), 'utf8'));
          if (old.sha !== sha) throw Error('Existing release has unexpected contents');
        } else fs.renameSync(stage, release);
        fs.unlinkSync(archive);
      } finally {
        fs.rmSync(stage, { recursive: true, force: true });
      }
    },
    activate() {
      previous();
      if (!fs.existsSync(path.join(root, target, 'DEPLOYMENT.json')))
        throw Error('Release not installed');
      switchTo(target);
    },
    rollback(link) {
      if (
        !/^releases\/[a-f0-9]{40}$/.test(link) ||
        !fs.existsSync(path.join(root, link, 'DEPLOYMENT.json'))
      )
        throw Error('Rollback release not available');
      const active = previous();
      if (active === link) return;
      if (active !== target) throw Error('Another deployment changed current; refusing rollback');
      switchTo(link);
    },
    prune(keepPrevious) {
      const active = previous(),
        candidates = fs
          .readdirSync(releases)
          .filter(
            (name) =>
              /^[a-f0-9]{40}$/.test(name) && fs.lstatSync(path.join(releases, name)).isDirectory(),
          )
          .sort(
            (a, b) =>
              fs.statSync(path.join(releases, b)).mtimeMs -
              fs.statSync(path.join(releases, a)).mtimeMs,
          );
      const keep = new Set([active.slice(9), keepPrevious.slice(9), ...candidates.slice(0, 3)]);
      for (const id of candidates)
        if (!keep.has(id)) fs.rmSync(path.join(releases, id), { recursive: true, force: true });
    },
  };
}
async function main() {
  const [account, sha, command, prior = ''] = process.argv.slice(2);
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(account || '')) throw Error('Invalid alwaysdata account');
  const operations = createRemoteOperations('/home/' + account + '/bulk-import', sha);
  if (!['prepare', 'install', 'activate', 'rollback', 'prune'].includes(command))
    throw Error('Unknown deployment operation');
  const result = operations[command](prior);
  if (command === 'prepare') process.stdout.write(JSON.stringify({ previous: result }));
}
if (require.main === module || process.argv[1] === '-')
  main().catch((error) => {
    console.error('Deployment operation failed: ' + error.message);
    process.exitCode = 1;
  });
module.exports = { createRemoteOperations };
