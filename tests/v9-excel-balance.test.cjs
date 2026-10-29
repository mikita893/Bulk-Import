'use strict';
const fs = require('fs'),
  vm = require('vm'),
  assert = require('node:assert/strict');
const path = require('node:path'),
  html = fs.readFileSync(path.join(__dirname, '..', 'Bulk-Import-Omega-3D-v9.html'), 'utf8');
const base = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const moduleFunctions = [
  'createExcelState',
  'validExcelState',
  'excelEncounter',
  'excelPhase',
  'excelBoss',
  'initializeExcelEncounter',
  'excelSupportPoint',
  'announceMarcSupport',
  'advanceExcelPhase',
  'updateExcelEncounter',
  'tryMarcSupport',
  'excelDamage',
  'queueExcelAttack',
  'resolveExcelWarning',
  'updateExcelEnemy',
];
const moduleCode = moduleFunctions.map(declaration).join('\n');
const excelLiteral = base.match(/excel:\{name:[^}]+\}/);
assert(excelLiteral, 'Shipped Excel stats exist');
const excelType = vm.runInNewContext('(' + excelLiteral[0].slice(6) + ')');
function declaration(name) {
  const start = base.indexOf('function ' + name + '(');
  let p = base.indexOf('(', start),
    parens = 0;
  for (; p < base.length; p++) {
    if (base[p] === '(') parens++;
    if (base[p] === ')' && --parens === 0) break;
  }
  let i = base.indexOf('{', p),
    depth = 0,
    quote = null,
    escape = false;
  for (; i < base.length; i++) {
    const c = base[i];
    if (quote) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return base.slice(start, i + 1);
  }
  throw Error(name);
}
function simulate({ support = true, skilled = true, maxTime = 360 } = {}) {
  const warnings = [],
    out = {
      assists: 0,
      shots: 0,
      hits: 0,
      received: 0,
      shieldDamage: 0,
      healthDamage: 0,
      phases: [],
      hostilePeak: 0,
    };
  const obstacles = [
    { x: -13, z: -1, w: 5.2, d: 2 },
    { x: 13, z: -1, w: 5.2, d: 2 },
    { x: -12, z: 9, w: 4, d: 1.8 },
    { x: 12, z: 9, w: 4, d: 1.8 },
  ];
  const cx = {
    Math,
    Number,
    Object,
    Array,
    EXCEL_MISSION: 7,
    mode: 'combat',
    run: { mission: 7 },
    player: { x: 0, z: 15, hp: 225, shield: 125, rechargeWait: 0 },
    inv: 0,
    time: 0,
    enemies: [],
    hostile: [],
    combatWarnings: warnings,
    progress: {
      upgrades: { damage: 5, rate: 5, armor: 5, shield: 5, plating: 5, biotic: 5, mobility: 5 },
    },
    UPGRADE_LIMIT: 5,
    TYPES: { excel: excelType },
    obstacleDefs: obstacles,
    maxHealth: () => 225,
    maxShield: () => 125,
    hud() {},
    save() {},
    notify() {},
    sound() {},
    burst() {},
    combatToast() {},
    showMarcSupport() {},
    killEnemy(e) {
      e.hp = 0;
      e.dead = true;
      cx.run.excel.defeated = true;
    },
    projectile() {
      return { position: { set() {} } };
    },
  };
  vm.createContext(cx);
  for (const f of [
    'blocked',
    'moveActor',
    'queueCombatWarning',
    'addHostileShot',
    'upgradeLevel',
    'damageReduction',
    'applyIncomingDamage',
    'maxHealth',
    'maxShield',
    'healAmount',
    'shieldRegenRate',
    'updateDefenses',
  ])
    vm.runInContext(declaration(f), cx);
  cx.hurtPlayer = function (n) {
    if (cx.inv > 0) return;
    const hit = cx.applyIncomingDamage(n);
    out.received++;
    out.shieldDamage += hit.shieldDamage;
    out.healthDamage += hit.healthDamage;
  };
  vm.runInContext(moduleCode, cx);
  cx.run.excel = cx.createExcelState();
  const boss = { type: 'excel', x: 0, z: -8, hp: excelType.hp, maxHp: excelType.hp, castTime: 0 };
  cx.enemies.push(boss);
  let shot = 0,
    clock = 0,
    medA = 0,
    medB = 0,
    seen = new Set(),
    playerBullets = [];
  const dt = 1 / 60;
  function hazard(x, z, vx, vz, horizon = 0.7) {
    let danger = 0;
    for (const w of warnings) {
      if (w.kind !== 'impact') continue;
      const h = Math.min(horizon, w.timer),
        px = x + vx * h,
        pz = z + vz * h,
        dist = Math.hypot(px - w.x, pz - w.z);
      if (dist < w.r + 0.8) danger += (w.r + 0.8 - dist) * 150;
    }
    for (const b of cx.hostile) {
      if (b.dead) continue;
      const dx = x - b.x,
        dz = z - b.z,
        dvx = vx - b.vx,
        dvz = vz - b.vz,
        t = Math.max(0, Math.min(horizon, -(dx * dvx + dz * dvz) / (dvx * dvx + dvz * dvz || 1))),
        dist = Math.hypot(dx + dvx * t, dz + dvz * t);
      if (dist < 1.2) danger += (1.2 - dist) * 100;
    }
    if (Math.hypot(x + vx * 0.5 - boss.x, z + vz * 0.5 - boss.z) < excelType.r + 1.35)
      danger += 1000;
    if (cx.blocked(x + vx * 0.45, z + vz * 0.45, 0.7)) danger += 400;
    if (Math.abs(x + vx * 0.6) > 23 || Math.abs(z + vz * 0.6) > 19) danger += 400;
    return danger;
  }
  for (clock = 0; clock < maxTime && boss.hp > 0 && cx.player.hp > 0; clock += dt) {
    cx.time = clock;
    cx.inv = Math.max(0, cx.inv - dt);
    boss.castTime = Math.max(0, boss.castTime - dt);
    const p = cx.player,
      s = cx.run.excel;
    cx.updateDefenses(dt);
    medA = Math.max(0, medA - dt);
    medB = Math.max(0, medB - dt);
    let tx = Math.sin(clock * 0.55) * 15,
      tz = Math.cos(clock * 0.55) * 14;
    if (support && s.support === 'available') {
      tx = s.supportX;
      tz = s.supportZ;
    } else if (skilled && p.hp < 110) {
      if (medA === 0 && Math.hypot(p.x, p.z + 17) < Math.hypot(p.x, p.z - 17)) {
        tx = 0;
        tz = -17;
      } else if (medB === 0) {
        tx = 0;
        tz = 17;
      }
    }
    let vx = 0,
      vz = 0;
    if (skilled) {
      let best = Infinity;
      for (let j = -1; j < 24; j++) {
        let a = (j * Math.PI * 2) / 24,
          xx = j < 0 ? 0 : Math.sin(a) * 11,
          zz = j < 0 ? 0 : Math.cos(a) * 11,
          score = hazard(p.x, p.z, xx, zz) + Math.hypot(p.x + xx * 0.5 - tx, p.z + zz * 0.5 - tz);
        if (score < best) {
          best = score;
          vx = xx;
          vz = zz;
        }
      }
    } else {
      const d = Math.hypot(tx - p.x, tz - p.z) || 1;
      vx = ((tx - p.x) / d) * 7.2;
      vz = ((tz - p.z) / d) * 7.2;
    }
    cx.moveActor(p, vx * dt, vz * dt);
    if (p.hp < 225 && medA === 0 && Math.hypot(p.x, p.z + 17) < 1.35) {
      p.hp = Math.min(225, p.hp + 50);
      medA = 18;
    }
    if (p.hp < 225 && medB === 0 && Math.hypot(p.x, p.z - 17) < 1.35) {
      p.hp = Math.min(225, p.hp + 50);
      medB = 18;
    }
    cx.updateExcelEncounter(dt);
    if (
      support &&
      s.support === 'available' &&
      Math.hypot(p.x - s.supportX, p.z - s.supportZ) <= 3.7
    ) {
      cx.tryMarcSupport();
      out.assists++;
    }
    if (!seen.has(s.phase)) {
      seen.add(s.phase);
      out.phases.push(s.phase);
    }
    if (cx.inv === 0 && Math.hypot(p.x - boss.x, p.z - boss.z) < excelType.r + 0.65)
      cx.hurtPlayer(34);
    shot -= dt;
    if (shot <= 0) {
      shot += 0.155 / 2.1;
      out.shots++;
      const dx = boss.x - p.x,
        dz = boss.z - p.z,
        d = Math.hypot(dx, dz);
      playerBullets.push({ x: p.x, z: p.z, vx: (dx / d) * 34, vz: (dz / d) * 34 });
    }
    for (const b of playerBullets) {
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      if (cx.blocked(b.x, b.z, 0.05)) b.dead = true;
      else if (Math.hypot(b.x - boss.x, b.z - boss.z) < excelType.r) {
        const hp = boss.hp;
        cx.excelDamage(boss, 5.3);
        if (boss.hp < hp) out.hits++;
        b.dead = true;
      }
    }
    playerBullets = playerBullets.filter(
      (b) => !b.dead && Math.abs(b.x) < 27 && Math.abs(b.z) < 24,
    );
    for (let i = warnings.length - 1; i >= 0; i--) {
      const w = warnings[i];
      w.timer -= dt;
      if (w.timer > 0) continue;
      if (
        !cx.resolveExcelWarning(w) &&
        w.kind === 'impact' &&
        Math.hypot(p.x - w.x, p.z - w.z) < w.r &&
        cx.inv === 0
      )
        cx.hurtPlayer(w.damage);
      warnings.splice(i, 1);
    }
    for (const b of cx.hostile) {
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      if (cx.blocked(b.x, b.z, 0.1)) b.dead = true;
      if (!b.dead && cx.inv === 0 && Math.hypot(p.x - b.x, p.z - b.z) < 0.72) {
        cx.hurtPlayer(b.damage);
        b.dead = true;
      }
    }
    out.hostilePeak = Math.max(out.hostilePeak, cx.hostile.length);
    cx.hostile = cx.hostile.filter((b) => !b.dead && Math.abs(b.x) < 27 && Math.abs(b.z) < 24);
  }
  return {
    ...out,
    seconds: +clock.toFixed(2),
    won: boss.hp <= 0,
    hp: +cx.player.hp.toFixed(2),
    shield: +cx.player.shield.toFixed(2),
    bossHP: +boss.hp.toFixed(2),
  };
}
const veteran = simulate(),
  unsupported = simulate({ support: false, maxTime: 90 }),
  casual = simulate({ skilled: false });
assert(veteran.won, 'Skilled veteran must be able to win');
assert(veteran.assists > 0);
assert(veteran.phases.length === 3);
assert(unsupported.bossHP === excelType.hp, 'No damage without Marc support');
assert(!unsupported.won);
assert(veteran.seconds < 300, 'Skillful fight should stay under five minutes');
assert(!casual.won, 'Ignoring warning fields should lose this deterministic encounter');
assert(
  veteran.hostilePeak <= 240 && unsupported.hostilePeak <= 240 && casual.hostilePeak <= 240,
  'Respect existing projectile cap',
);
// Feasibility check: perfect continuous aim, visible-hazard avoidance and immediate E in range.
// The contrasting movement-only bot follows an orbit/support target without reading warnings.
// Uses shipped defense/damage/state/warning helpers and boss radius, plus final arena obstacles.
// Player shooting/medkit clocks and obstacle substeps approximate the full renderer loop.
// No use of the player's R-dodge or Q-mass-effect, which can improve actual player outcomes.
// This does not predict human win rates, reaction times or rendering performance.
console.log(JSON.stringify({ veteran, unsupported, casual }, null, 2));
