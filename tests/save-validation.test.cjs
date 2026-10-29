const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'Bulk-Import-Omega-3D-v6.html'), 'utf8');
const app = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const validator = app.slice(app.indexOf('function nums('), app.indexOf('function plain('));
const context = {
  TYPES: { reaper: {}, elite: {}, collector: {}, boss: {} },
  MISSIONS: [3, 3, 4, 3].map((waves) => ({ waves })),
};
vm.createContext(context);
vm.runInContext(validator, context);
const active = {
  run: { mission: 0, wave: 1, spawned: 1, clock: 1 },
  player: { x: 0, z: 8, hp: 77 },
  enemies: [{ type: 'reaper', x: 0, z: -5, hp: 3, maxHp: 4, t: 1, phase: 0 }],
  bullets: [],
  hostile: [],
  drops: [],
  medkits: [
    { x: 0, z: -17, timer: 0, ready: true },
    { x: 0, z: 17, timer: 0, ready: true },
  ],
  massCooldown: 0,
  relayCooldown: 0,
  indo: 12,
};
assert(context.validActive(active), 'Legacy v5 saves without modifiers must migrate');
assert(context.validActive({ ...active, overdrive: 4, dodgeCooldown: 1, combo: 3, comboTime: 2 }));
for (const field of ['overdrive', 'dodgeCooldown', 'combo', 'comboTime']) {
  for (const bad of ['oops', -1, Infinity, NaN, null]) {
    assert(!context.validActive({ ...active, [field]: bad }), `${field} must reject ${bad}`);
  }
}
assert(!context.validActive({ ...active, combo: 2.5 }));
for (const type of ['toString', '__proto__', 'constructor', 'unrecognized']) {
  assert(
    !context.validActive({ ...active, enemies: [{ ...active.enemies[0], type }] }),
    `Reject ${type}`,
  );
}
console.log('PASS: v5/v6 save compatibility, invalid modifiers, inherited/unknown enemy types.');
