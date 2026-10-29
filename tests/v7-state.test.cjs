const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'Bulk-Import-Omega-3D-v7.html'), 'utf8');
const app = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
function declaration(name) {
  const start = app.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' exists in shipped HTML');
  let depth = 0,
    quote = null,
    escape = false;
  for (let i = app.indexOf('{', start); i < app.length; i++) {
    const ch = app[i];
    if (quote) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return app.slice(start, i + 1);
  }
  throw Error('Unclosed declaration: ' + name);
}

const context = {
  MISSIONS: Array.from({ length: 7 }, (_, i) => ({ waves: [3, 3, 4, 3, 4, 4, 4][i] })),
  FINAL_MISSION: 6,
  MAX_ACTIVE_ENEMIES: 18,
  TYPES: { reaper: {}, elite: {}, collector: {}, boss: {}, husk: {}, geth: {}, banshee: {} },
};
vm.createContext(context);
for (const name of [
  'relationshipClamp',
  'createCrewDefaults',
  'normalizeCrew',
  'validCrewState',
  'validProgress',
  'nums',
  'validActive',
  'fresh',
])
  vm.runInContext(declaration(name), context);
const p = context.fresh();
assert(context.validProgress(p));
assert.equal(p.version, 7);
assert.equal(p.crew[0].affection, 35);
for (const key of ['affection', 'trust'])
  for (const value of [-1, 101, '80', NaN]) {
    const copy = JSON.parse(JSON.stringify(p));
    copy.crew[0][key] = value;
    assert(!context.validProgress(copy), `${key} rejects ${value}`);
  }
let bad = JSON.parse(JSON.stringify(p));
bad.crew[0].usedTopics = ['personal', 'personal'];
assert(!context.validProgress(bad));
bad = JSON.parse(JSON.stringify(p));
bad.crew[0].history = ['a'.repeat(221)];
assert(!context.validProgress(bad));
const crew = context.normalizeCrew([{ bond: 0 }, { bond: 3 }], 'Vael');
assert(crew[0].affection >= 75 && crew[0].trust >= 60);
assert(context.validCrewState(crew[0], 0));
const active = {
  run: { mission: 6, wave: 4, spawned: 18, clock: 1, bossSpawned: true },
  player: { x: 0, z: 15, hp: 77 },
  enemies: [{ type: 'banshee', x: 4, z: 0, hp: 20, maxHp: 27, t: 1, phase: 1 }],
  bullets: [],
  hostile: [],
  drops: [],
  medkits: [
    { x: 0, z: 17, ready: true, timer: 0 },
    { x: 0, z: -17, ready: true, timer: 0 },
  ],
  massCooldown: 0,
  relayCooldown: 0,
  indo: 10,
};
assert(context.validActive(active));
for (const mission of [-1, 7, 3.5])
  assert(!context.validActive({ ...active, run: { ...active.run, mission } }));
for (const type of ['constructor', 'toString', '__proto__', 'unknown'])
  assert(!context.validActive({ ...active, enemies: [{ ...active.enemies[0], type }] }));
for (const key of ['overdrive', 'dodgeCooldown', 'combo', 'comboTime'])
  assert(!context.validActive({ ...active, [key]: 'oops' }));
assert(
  !context.validActive({ ...active, enemies: Array.from({ length: 19 }, () => active.enemies[0]) }),
);
assert(!context.validActive({ ...active, enemies: [{ ...active.enemies[0], attackDamage: -5 }] }));
console.log(
  'PASS: shipped v7 relationship bounds, legacy normalization, seven-mission bounds, enemy caps and invalid save rejection.',
);
