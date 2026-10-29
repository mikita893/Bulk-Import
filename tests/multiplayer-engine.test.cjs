'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createMatch,
  stepMatch,
  snapshotMatch,
  normalizeInput,
  continueMatch,
  buyTeamUpgrade,
  setPlayerConnected,
  finishMatch,
} = require('../multiplayer/engine.cjs');
const {
  VS_STATS,
  FACTION_KITS,
  versusStats,
  MAPS,
  MISSIONS,
  UPGRADES,
  LIMITS,
} = require('../multiplayer/shared.cjs');
const roster = [
  { id: 'sf', name: 'Admin', team: 'salesforce' },
  { id: 'xls', name: 'Arkusz', team: 'excel' },
];
function input(seq, values = {}) {
  return {
    seq,
    mx: 0,
    mz: 0,
    ax: 0,
    az: 0,
    fire: false,
    dash: false,
    ability: false,
    interact: false,
    ...values,
  };
}
function tick(m, seconds, inputs = () => ({})) {
  for (let n = 0; n < Math.ceil(seconds * 30) && m.phase === 'playing'; n++)
    stepMatch(m, 1 / 30, typeof inputs === 'function' ? inputs(n) : inputs);
  return m;
}
function quota(m) {
  return 7 + m.wave * 3 + m.mission * 2 + (m.partySize - 1) * 4;
}
function safe(m) {
  for (const p of m.players) {
    p.inv = 0;
    p.spawnProtected = false;
  }
  m.spawnClock = 999;
  for (const pickup of m.pickups) {
    pickup.ready = false;
    pickup.timer = 999;
  }
  return m;
}

test('untrusted input rejects nonfinite values and cannot set position or damage', () => {
  for (const raw of [
    null,
    {},
    input(-1),
    input(1, { mx: Infinity }),
    input(1, { ax: NaN }),
    input(1, { dash: 'true' }),
    input(1, { sprint: 1 }),
  ])
    assert.equal(normalizeInput(raw), null);
  const raw = input(2, { mx: 5, mz: 5, ax: 999, az: -999, x: 1000, hp: 10000, damage: 999 }),
    clean = normalizeInput(raw);
  assert(Math.hypot(clean.mx, clean.mz) <= 1.00000001);
  assert.equal(clean.ax, 100);
  assert.equal(clean.az, -100);
  assert.equal(clean.x, undefined);
  assert.equal(clean.damage, undefined);
  assert.equal(raw.mx, 5);
});

test('VS keeps equal core weapons and survivability with distinct kits, mirrored cover and equal-team capacity', () => {
  const m = createMatch({
    mode: 'versus',
    players: roster,
    upgrades: { damage: 5, armor: 5, shield: 5 },
    seed: 1,
  });
  for (const p of m.players) {
    assert.deepEqual(p.stats, versusStats(p.team));
    for (const key of [
      'maxHp',
      'maxShield',
      'damage',
      'interval',
      'speed',
      'sprintSpeed',
      'projectileSpeed',
      'projectileLife',
      'shieldRegen',
      'rechargeDelay',
      'armor',
    ])
      assert.equal(p.stats[key], VS_STATS[key], key + ' stays fair');
  }
  assert.notEqual(FACTION_KITS.salesforce.ability.name, FACTION_KITS.excel.ability.name);
  assert.notEqual(m.players[0].stats.dashDuration, m.players[1].stats.dashDuration);
  assert.equal(m.upgrades.damage, 0);
  assert.equal(m.players[0].x, -m.players[1].x);
  for (const o of MAPS.arena)
    assert(MAPS.arena.some((v) => v.x === -o.x && v.z === o.z && v.w === o.w && v.d === o.d));
  assert.throws(() => createMatch({ mode: 'versus', players: roster.slice(0, 1) }));
  assert.throws(() =>
    createMatch({ mode: 'versus', players: [...roster, { id: 'extra', team: 'salesforce' }] }),
  );
  const six = [];
  for (const team of ['salesforce', 'excel'])
    for (let i = 0; i < 3; i++) six.push({ id: team + i, team });
  assert.equal(createMatch({ mode: 'versus', players: six }).players.length, 6);
  assert.throws(() => createMatch({ mode: 'coop', players: six.slice(0, 4) }));
});

test('simultaneous mirrored gunfight scores equally regardless of roster order', () => {
  function duel(players) {
    const m = safe(createMatch({ mode: 'versus', players, seed: 6 }));
    for (const p of m.players) {
      p.x = p.team === 'salesforce' ? -6 : 6;
      p.z = 16;
    }
    tick(m, 3, (n) =>
      Object.fromEntries(m.players.map((p) => [p.id, input(n, { fire: true, ax: -p.x, az: 16 })])),
    );
    return m;
  }
  const first = duel(roster),
    reversed = duel([...roster].reverse());
  assert.deepEqual(first.scores, { salesforce: 1, excel: 1 });
  assert.deepEqual(reversed.scores, first.scores);
  assert.equal(first.players[0].deaths, 1);
  assert(first.players.every((p) => p.respawnIn > 0));
});

test('movement and dashes respect cover and duplicated sequence cannot retrigger', () => {
  const m = safe(createMatch({ mode: 'versus', players: roster })),
    p = m.players[0];
  p.x = -11;
  p.z = -7;
  stepMatch(m, 1 / 30, { sf: input(1, { mx: 1, ax: 20, az: -7, dash: true }) });
  tick(m, 0.3, { sf: input(1, { mx: 1, ax: 20, az: -7, dash: true }) });
  assert(p.x <= -10.09, 'No wall phasing');
  const first = p.x;
  tick(m, 3.3, { sf: input(1, { mx: 1, ax: 20, az: -7, dash: true }) });
  assert.equal(p.dashCooldown, 0);
  assert(p.x >= first);
  assert.equal(p.dashTime, 0, 'Same sequence cannot consume another dash');
  const outside = input(3, { x: 999, hp: 999, mx: 0, ax: 0, az: 0 });
  stepMatch(m, 1 / 30, { sf: outside });
  assert(p.x < 25);
  assert(p.hp <= VS_STATS.maxHp);
});

test('dash invulnerability survives held fire and spawn protection ends on offense', () => {
  const m = createMatch({ mode: 'versus', players: roster }),
    p = m.players[0];
  p.x = -15;
  p.z = 16;
  stepMatch(m, 1 / 30, { sf: input(1, { dash: true, fire: true, mz: -1, ax: 19, az: 16 }) });
  assert(p.inv > 0.2);
  assert.equal(p.spawnProtected, false);
  const fresh = createMatch({ mode: 'versus', players: roster });
  stepMatch(fresh, 1 / 30, { sf: input(1, { fire: true, ax: 19, az: -10 }) });
  assert.equal(fresh.players[0].inv, 0);
});

test('friendly fire is disabled, respawn and timed draw are authoritative', () => {
  const players = [...roster, { id: 'sf2', team: 'salesforce' }, { id: 'xls2', team: 'excel' }],
    m = safe(createMatch({ mode: 'versus', players }));
  m.players.forEach((p, i) => {
    p.x = i === 0 ? -5 : i === 2 ? 5 : 20;
    p.z = i === 0 || i === 2 ? 16 : -16;
  });
  tick(m, 1.5, (n) => ({ sf: input(n, { fire: true, ax: 5, az: 16 }) }));
  assert.equal(m.players.find((p) => p.id === 'sf2').hp, VS_STATS.maxHp);
  assert.equal(m.players.find((p) => p.id === 'sf2').shield, VS_STATS.maxShield);
  m.remaining = 0.01;
  stepMatch(m, 1 / 30, {});
  assert.deepEqual(m.result, { outcome: 'draw', winner: 'draw' });
  assert.equal(m.phase, 'finished');
});

test('six different coop missions, scaled enemy health and final boss', () => {
  assert.equal(MISSIONS.length, 6);
  assert.equal(new Set(MISSIONS.map((m) => m.map)).size, 6);
  assert(MISSIONS.at(-1).difficulty > MISSIONS[0].difficulty);
  const solo = createMatch({ mode: 'coop', players: roster.slice(0, 1), seed: 2 }),
    team = createMatch({ mode: 'coop', players: [...roster, { id: 'third' }], seed: 2 });
  tick(solo, 1.5);
  tick(team, 1.5);
  assert(team.enemies[0].maxHp > solo.enemies[0].maxHp);
  assert(team.partySize === 3);
  const final = createMatch({ mode: 'coop', players: roster.slice(0, 1), mission: 5 });
  assert.equal(final.enemies.length, 1);
  assert.equal(final.enemies[0].type, 'excel');
  assert(final.support);
  assert.equal(final.waves, 1);
});

test('wave completion enters ship intermission; shared upgrades and continue preserve earned progress', () => {
  const m = safe(createMatch({ mode: 'coop', players: roster.slice(0, 1), credits: 1000 }));
  m.spawned = quota(m);
  stepMatch(m, 1 / 30, {});
  assert.equal(m.phase, 'intermission');
  assert.equal(m.wave, 1);
  const oldHp = m.players[0].hp;
  m.players[0].hp = 70;
  assert(buyTeamUpgrade(m, 'armor'));
  assert.equal(m.players[0].hp, 90);
  assert.equal(m.players[0].stats.maxHp, oldHp + 20);
  assert.equal(m.upgrades.armor, 1);
  assert(!buyTeamUpgrade(m, 'constructor'));
  assert(continueMatch(m));
  assert.equal(m.wave, 2);
  assert.equal(m.phase, 'playing');
  assert.equal(m.players[0].hp, m.players[0].stats.maxHp);
  assert(!buyTeamUpgrade(m, 'damage'));
  assert(!continueMatch(m));
});

test('boss harvest cannot complete before boss exists and is defeated', () => {
  const m = safe(createMatch({ mode: 'coop', players: roster.slice(0, 1), mission: 2 }));
  m.wave = m.waves;
  m.spawned = quota(m);
  stepMatch(m, 1 / 30, {});
  assert.equal(m.phase, 'playing');
  assert.equal(m.enemies.length, 1);
  assert.equal(m.enemies[0].type, 'boss');
  m.enemies[0].hp = 0;
  stepMatch(m, 1 / 30, {});
  assert.equal(m.phase, 'finished');
  assert.equal(m.result.outcome, 'victory');
  assert.equal(m.result.nextMission, 3);
});

test('cooperative E revive takes two seconds and emergency tokens prevent solo softlock', () => {
  const m = safe(createMatch({ mode: 'coop', players: roster })),
    [helper, down] = m.players;
  helper.x = 0;
  helper.z = 12;
  down.x = 1;
  down.z = 12;
  down.alive = false;
  down.downed = true;
  down.bleedOut = 18;
  down.hp = 0;
  tick(m, 1, (n) => ({ sf: input(n, { interact: true }) }));
  assert.equal(down.alive, false);
  assert(down.reviveProgress > 0.45 && down.reviveProgress < 0.55);
  tick(m, 1.1, (n) => ({ sf: input(n + 100, { interact: true }) }));
  assert(down.alive);
  assert.equal(helper.revives, 1);
  const solo = safe(createMatch({ mode: 'coop', players: roster.slice(0, 1) }));
  solo.players[0].alive = false;
  solo.players[0].downed = true;
  solo.players[0].bleedOut = 18;
  stepMatch(solo, 1 / 30, {});
  assert.equal(solo.teamLives, 2);
  assert(solo.players[0].respawnIn > 0);
  tick(solo, 4.1);
  assert(solo.players[0].alive);
  solo.teamLives = 0;
  solo.players[0].alive = false;
  solo.players[0].downed = true;
  solo.players[0].respawnIn = 0;
  solo.players[0].bleedOut = 18;
  stepMatch(solo, 1 / 30, {});
  assert.equal(solo.result.outcome, 'defeat');
});

test('Excel blocks all unsupported damage; shared Marc event opens damage window and retries', () => {
  const m = safe(createMatch({ mode: 'coop', players: roster.slice(0, 1), mission: 5, seed: 5 })),
    p = m.players[0],
    boss = m.enemies[0];
  p.x = 0;
  p.z = 0;
  p.inv = 999;
  boss.timer = 999;
  boss.special = 999;
  const hp = boss.hp;
  tick(m, 1.5, (n) => ({ sf: input(n, { fire: true, ax: 0, az: -8 }) }));
  assert.equal(boss.hp, hp);
  m.support.active = true;
  m.support.x = 0;
  m.support.z = 0;
  m.support.remaining = 12;
  stepMatch(m, 1 / 30, { sf: input(100, { interact: true, ax: 0, az: -8 }) });
  assert(m.support.exposure > 6.9);
  assert.equal(m.support.used, 1);
  tick(m, 1, (n) => ({ sf: input(n + 101, { fire: true, ax: 0, az: -8 }) }));
  assert(boss.hp < hp);
  m.support.exposure = 0;
  m.support.active = true;
  m.support.remaining = 0.01;
  stepMatch(m, 1 / 30, {});
  assert.equal(m.support.active, false);
  assert.equal(m.support.remaining, 5);
  tick(m, 5.1);
  assert.equal(m.support.active, true);
});

test('bounded snapshots, disconnect handling and result freezing', () => {
  const m = createMatch({ mode: 'coop', players: roster, mission: 5, seed: 11 });
  for (const p of m.players) p.inv = 1e6;
  tick(m, 30);
  assert(m.enemies.length <= LIMITS.enemies);
  assert(m.projectiles.length <= LIMITS.projectiles);
  assert(m.warnings.length <= LIMITS.warnings);
  assert(m.events.length <= LIMITS.events);
  setPlayerConnected(m, 'sf', false);
  assert.equal(m.players[0].connected, false);
  const x = m.players[0].x;
  stepMatch(m, 1 / 30, { sf: input(1, { mx: 1, ax: 20, az: 0 }) });
  assert.equal(m.players[0].x, x);
  const snapshot = snapshotMatch(m);
  snapshot.players[0].hp = 999;
  assert.notEqual(m.players[0].hp, 999);
  assert(snapshot.enemies[0].shielded);
  assert(snapshot.events.every((e) => typeof e.text === 'string'));
  finishMatch(m, { outcome: 'defeat', mission: 5 });
  const t = m.time;
  stepMatch(m, 1 / 30, {});
  assert.equal(m.time, t);
});

test('reconnecting a reloaded client resets only input sequence, not health or cooldown', () => {
  const m = safe(createMatch({ mode: 'versus', players: roster })),
    p = m.players[0];
  p.x = -15;
  p.z = 16;
  p.hp = 91;
  p.shield = 7;
  p.dashCooldown = 1.7;
  p.lastSeq = 5000;
  setPlayerConnected(m, p.id, true);
  assert.equal(p.lastSeq, -1);
  p.lastSeq = 5000;
  setPlayerConnected(m, p.id, false);
  setPlayerConnected(m, p.id, true);
  assert.equal(p.lastSeq, -1);
  assert.equal(p.hp, 91);
  assert.equal(p.shield, 7);
  assert.equal(p.dashCooldown, 1.7);
  const x = p.x;
  stepMatch(m, 1 / 30, { sf: input(0, { mx: 1, ax: 20, az: 16 }) });
  assert(p.x > x);
});
