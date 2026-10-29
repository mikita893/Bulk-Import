'use strict';
const fs = require('fs'),
  vm = require('vm'),
  assert = require('node:assert/strict');
const path = require('node:path'),
  html = fs.readFileSync(path.join(__dirname, '..', 'Bulk-Import-Omega-3D-v10.html'), 'utf8');
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
  'excelMaxHealth',
  'startExcelRage',
  'queueExcelDuplicateWarning',
  'queueExcelRageAttack',
  'addExcelDuplicateShot',
  'resolveExcelDuplicateWarning',
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
function simulate({
  support = true,
  skilled = true,
  maxTime = 600,
  startStage = 1,
  stopAfterStageOne = false,
} = {}) {
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
      duplicateShots: 0,
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
      excelFirstFormCleared: startStage === 2,
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
  cx.run.excel = cx.createExcelState(startStage);
  const boss = {
    type: 'excel',
    x: 0,
    z: -8,
    hp: cx.excelMaxHealth(startStage),
    maxHp: cx.excelMaxHealth(startStage),
    castTime: 0,
  };
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
  for (
    clock = 0;
    clock < maxTime &&
    !cx.run.excel.defeated &&
    cx.player.hp > 0 &&
    !(stopAfterStageOne && cx.progress.excelFirstFormCleared);
    clock += dt
  ) {
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
    const phase = s.stage + '/' + s.phase;
    if (!seen.has(phase)) {
      seen.add(phase);
      out.phases.push(phase);
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
        const hp = boss.hp,
          beforeStage = cx.run.excel.stage;
        cx.excelDamage(boss, 5.3);
        if (boss.hp < hp || cx.run.excel.stage !== beforeStage) out.hits++;
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
    for (const b of cx.hostile) {
      if (b.duplicate && !b.counted) {
        out.duplicateShots++;
        b.counted = true;
      }
    }
    cx.hostile = cx.hostile.filter((b) => !b.dead && Math.abs(b.x) < 27 && Math.abs(b.z) < 24);
  }
  return {
    ...out,
    seconds: +clock.toFixed(2),
    won: cx.run.excel.defeated,
    stage: cx.run.excel.stage,
    firstFormCleared: !!cx.progress.excelFirstFormCleared,
    hp: +cx.player.hp.toFixed(2),
    shield: +cx.player.shield.toFixed(2),
    bossHP: +boss.hp.toFixed(2),
  };
}
function declarationFrom(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, 'Function exists: ' + name);
  let i = source.indexOf('(', start),
    parens = 0;
  for (; i < source.length; i++) {
    if (source[i] === '(') parens++;
    if (source[i] === ')' && --parens === 0) break;
  }
  let depth = 0,
    quote = null,
    escape = false;
  for (i = source.indexOf('{', i); i < source.length; i++) {
    const c = source[i];
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
    else if (c === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw Error('Unclosed ' + name);
}
function compareOriginalFirstForm() {
  const previous = fs.readFileSync(
    path.join(__dirname, '..', 'Bulk-Import-Omega-3D-v9.html'),
    'utf8',
  );
  const previousApp = previous.slice(
    previous.lastIndexOf('<script>') + 8,
    previous.lastIndexOf('</script>'),
  );
  const previousFunctions = [
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
  function makeContext(source, functions) {
    const context = {
      Math,
      Number,
      Object,
      Array,
      EXCEL_MISSION: 7,
      run: { mission: 7 },
      player: { x: 2.5, z: 6.75 },
      hostile: [],
      combatWarnings: [],
      notify() {},
      sound() {},
      projectile() {
        return {};
      },
      time: 0,
    };
    vm.createContext(context);
    vm.runInContext(functions.map((name) => declarationFrom(source, name)).join('\n'), context);
    for (const name of ['queueCombatWarning', 'addHostileShot'])
      vm.runInContext(declarationFrom(source, name), context);
    return context;
  }
  const oldContext = makeContext(previousApp, previousFunctions),
    currentContext = makeContext(base, moduleFunctions);
  const oldState = JSON.parse(JSON.stringify(oldContext.createExcelState())),
    currentState = JSON.parse(JSON.stringify(currentContext.createExcelState()));
  delete currentState.stage;
  delete currentState.rageHelpUsed;
  assert.deepEqual(currentState, oldState, 'Original initial timers/state remain intact');
  for (const phase of [1, 2, 3])
    for (const attackIndex of [0, 1, 2]) {
      function execute(context) {
        context.run.excel = context.createExcelState();
        context.run.excel.phase = phase;
        context.run.excel.attackIndex = attackIndex;
        context.hostile = [];
        context.combatWarnings = [];
        const e = {
          type: 'excel',
          x: 0,
          z: -8,
          hp: phase === 1 ? 2400 : phase === 2 ? 1200 : 400,
          maxHp: 2400,
        };
        context.queueExcelAttack(e);
        const warnings = context.combatWarnings.map((w) =>
          Object.fromEntries(Object.entries(w).filter(([key]) => key !== 'owner')),
        );
        const handled = context.combatWarnings.map((w) => context.resolveExcelWarning(w));
        const projectiles = context.hostile.map((b) =>
          Object.fromEntries(Object.entries(b).filter(([key]) => key !== 'model')),
        );
        return JSON.parse(
          JSON.stringify({
            warnings,
            handled,
            projectiles,
            castTime: e.castTime,
            attackIndex: context.run.excel.attackIndex,
          }),
        );
      }
      assert.deepEqual(
        execute(currentContext),
        execute(oldContext),
        'Stage1 v9 attack parity: phase' + phase + ' pattern' + attackIndex,
      );
    }
}
compareOriginalFirstForm();

const firstForm = simulate({ stopAfterStageOne: true }),
  veteran = simulate(),
  rageOnly = simulate({ startStage: 2 }),
  unsupported = simulate({ support: false, maxTime: 90, startStage: 2 }),
  casualRage = simulate({ skilled: false, startStage: 2 });
assert(
  firstForm.firstFormCleared && !firstForm.won && firstForm.stage === 2,
  'First lethal unlocks rage checkpoint rather than campaign victory',
);
assert(
  Math.abs(firstForm.seconds - 83.2) < 1,
  'Original first form retains v9 balance in this deterministic model',
);
assert(
  veteran.won && veteran.phases.length === 6 && veteran.stage === 2,
  'Skilled veteran can complete both forms and all six health phases',
);
assert(
  rageOnly.won && rageOnly.assists > 0 && rageOnly.duplicateShots > 0,
  'Rage checkpoint remains beatable with required help and duplicated-data attacks',
);
assert(unsupported.bossHP === 3200 && !unsupported.won, 'No damage to furious Excel without Marc');
assert(!casualRage.won, 'Ignoring visible warnings loses the rage form');
assert(veteran.seconds < 420, 'Full skilled encounter should stay under seven minutes');
for (const result of [firstForm, veteran, rageOnly, unsupported, casualRage])
  assert(result.hostilePeak <= 240, 'Retain projectile cap');
// This feasibility model uses shipped combat/defense/warning functions, actual radius and final arena obstacles.
// It approximates the renderer's shooting, medkit and projectile-substep clocks, aims continuously,
// chooses motion using visible warnings, and activates E immediately in range. No R or ZIPsert is used.
// The naive comparison runs toward support/orbit targets without reading hazards.
// These deterministic outcomes are not predictions of human win rates or rendering performance.
console.log(JSON.stringify({ firstForm, veteran, rageOnly, unsupported, casualRage }, null, 2));
