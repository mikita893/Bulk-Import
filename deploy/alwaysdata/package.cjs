'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function packageRelease({
  output = path.join(root, 'dist/alwaysdata'),
  sha = process.env.GITHUB_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Error('Expected a full Git commit SHA');
  const release = require('../../release.cjs');
  if (!fs.existsSync(path.join(root, release.filename)))
    throw Error('Build the current HTML first');
  fs.mkdirSync(output, { recursive: true });
  const stage = fs.mkdtempSync(path.join(output, 'stage-'));
  try {
    const files = [
      'package.json',
      'package-lock.json',
      'release.cjs',
      'index.html',
      'server',
      'multiplayer/engine.cjs',
      'multiplayer/shared.cjs',
      'deploy/alwaysdata/start.cjs',
      ...fs.readdirSync(root).filter((name) => /^Bulk-Import.*\.html$/.test(name)),
    ];
    for (const name of files) {
      const target = path.join(stage, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.cpSync(path.join(root, name), target, { recursive: true });
    }
    fs.writeFileSync(
      path.join(stage, 'DEPLOYMENT.json'),
      JSON.stringify({
        sha,
        version: release.version,
        major: release.major,
        filename: release.filename,
      }) + '\n',
    );
    const archive = path.join(output, 'bulk-import.tar.gz');
    execFileSync('tar', ['-czf', archive, '-C', stage, '.']);
    return archive;
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}
if (require.main === module) console.log('Deployment bundle: ' + packageRelease());
module.exports = { packageRelease };
