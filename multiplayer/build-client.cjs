'use strict';
const fs = require('node:fs'),
  path = require('node:path');
const shared = require('./shared.cjs'),
  release = require('../release.cjs');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const versioned = (value) => value.replaceAll('__VERSION__', String(release.major));
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const cardArtStyle =
  '\n.gw-art,.gw-avatar{background-image:url(data:image/webp;base64,' +
  fs.readFileSync(path.join(root, 'assets/cards/portraits.webp')).toString('base64') +
  ')}\n';
const bakedConfig = {
  missions: shared.MISSIONS,
  upgrades: shared.UPGRADES,
  factionKits: shared.FACTION_KITS,
};
const vendor =
  '<!-- ' +
  read('vendor/THREE-LICENSE.txt').trim() +
  ' -->\n<script id="bulk-three">' +
  read('vendor/three.min.js') +
  '</script>';
const campaign = versioned(
  read('campaign/shell.html')
    .replace('/*CAMPAIGN_STYLE*/', () => read('campaign/style.css'))
    .replace(
      '<!--THREE_LICENSE-->',
      () => '<' + '!-- ' + read('vendor/THREE-LICENSE.txt').trim() + ' -->',
    )
    .replace('/*CAMPAIGN_APP*/', () =>
      [
        'campaign/dialogues.js',
        'campaign/game.js',
        'campaign/enemy-models.js',
        'campaign/actor-animation.js',
        'campaign/dubbing-ui.js',
      ]
        .map(read)
        .join('\n'),
    ),
);
const app =
  "'use strict';\nwindow.BULK_VOICE_PACK=" +
  json(require('../voice/build.cjs')()) +
  ';\nwindow.BULK_RELEASE=' +
  json(release) +
  ';\nwindow.BULK_CLIENT_CONFIG=' +
  json(bakedConfig) +
  ';\nwindow.BULK_CAMPAIGN_DOCUMENT=' +
  json(campaign) +
  ';\n' +
  [
    'audio/effects.js',
    'voice/player.js',
    'minigames/bird-sim.js',
    'minigames/bird-render.js',
    'minigames/bird-game-3.js',
    'minigames/cards-sim.js',
    'minigames/cards-art.js',
    'minigames/cards-game.js',
    'minigames/symbol-deck.js',
    'minigames/symbol-sim.js',
    'minigames/symbol-network.js',
    'minigames/symbol-game.js',
    'minigames/sudoku-sim.js',
    'minigames/sudoku-game.js',
    'minigames/runner-sim.js',
    'minigames/runner-render.js',
    'minigames/runner-game.js',
    'minigames/souls-sim.js',
    'minigames/souls-render.js',
    'minigames/souls-game.js',
    'multiplayer/unified.js',
    'multiplayer/render.js',
    'multiplayer/client.js',
  ]
    .map(read)
    .join('\n');
const output = versioned(read('multiplayer/client-shell.html'))
  .replace(
    '/*CLIENT_STYLE*/',
    () =>
      [
        'multiplayer/client.css',
        'multiplayer/unified.css',
        'minigames/bird-game-3.css',
        'minigames/cards-game.css',
        'minigames/symbol-game.css',
        'minigames/sudoku-game.css',
        'minigames/runner-game.css',
        'minigames/souls-game.css',
      ]
        .map(read)
        .join('\n') + cardArtStyle,
  )
  .replace('<!--THREE_BUNDLE-->', () => vendor)
  .replace('/*CLIENT_APP*/', () => app);
fs.writeFileSync(path.join(root, release.filename), output);
fs.writeFileSync(
  path.join(root, 'index.html'),
  '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=' +
    release.filename +
    '"><title>Bulk Import v' +
    release.major +
    '</title></head><body style="background:#07121d;color:#dff5f5;font:18px Arial;padding:40px"><h1>Bulk Import: Wspólna Galaktyka</h1><p><a style="color:#80e9e2" href="' +
    release.filename +
    '">Otwórz grę v' +
    release.major +
    ' — kampania solo i multiplayer</a></p></body></html>\n',
);
console.log(
  'Built ' +
    release.filename +
    ' (' +
    Buffer.byteLength(output) +
    ' bytes): standalone campaign + multiplayer + Bird Game 3 + Gwintforce + CSV Double + Sudoku + Metro Import 3D + Apex Souls',
);
console.log('GitHub Pages: ' + require('../deploy/pages/build.cjs').buildPages());
