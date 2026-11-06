'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict');
const C = require('../minigames/city-sim.js');
function advance(g, seconds, input = {}) {
  for (let i = 0; i < seconds * 120 && g.state === 'playing'; i++) g.tick(1 / 120, input);
}
function flight(progress = {}) {
  const g = new C.Game({ ...C.fresh(), stage: 1, ...progress });
  g.start();
  assert(g.action('interact'));
  assert.equal(g.mode, 'heli');
  return g;
}
test('city saves are independent, bounded and reject incomplete or corrupt progress', () => {
  assert(C.valid(C.fresh()));
  for (const raw of [
    'bad',
    'null',
    '{}',
    JSON.stringify({ ...C.fresh(), stage: 4 }),
    JSON.stringify({ ...C.fresh(), stage: 2 }),
    JSON.stringify({ ...C.fresh(), delivered: [true, false, false, false] }),
    JSON.stringify({ ...C.fresh(), cash: -1 }),
  ])
    assert.deepEqual(C.read(raw), C.fresh());
  const g = flight();
  const s = g.snapshot();
  s.delivered[0] = true;
  assert.equal(g.progress.delivered[0], false);
  assert(C.blocked(20, 20));
  assert(!C.blocked(0, 20));
  assert(C.blocked(125, 0));
});
test('walking, entering/exiting a car and collision clearance use physical proximity and speed', () => {
  const g = new C.Game();
  assert(!g.action('interact'));
  g.start();
  assert(!g.action('interact'));
  advance(g, 0.4, { z: -1 });
  assert(g.action('interact'));
  assert.equal(g.mode, 'car');
  advance(g, 1, { z: -1 });
  assert(g.car.z < 95);
  assert(!g.action('interact'));
  advance(g, 1, { up: true });
  assert(g.action('interact'));
  assert.equal(g.mode, 'foot');
  g.player.x = 6;
  g.player.z = 20;
  advance(g, 1, { x: 1 });
  assert(g.player.x < 7);
});
test('Bulk Boost is finite and car impacts cause bounded damage instead of passing through buildings', () => {
  const g = new C.Game();
  g.start();
  g.mode = 'car';
  g.car.z = 60;
  g.traffic = [];
  advance(g, 1, { z: -1, boost: true });
  assert(g.car.speed > 30 && g.car.speed <= 42);
  assert(g.car.nitro < 100);
  const fuel = g.car.nitro;
  advance(g, 0.5);
  assert(g.car.nitro > fuel);
  g.car.x = 5.7;
  g.car.z = 20;
  g.car.angle = Math.PI / 2;
  g.car.speed = 20;
  advance(g, 0.05);
  assert(g.car.hp < 100);
  assert(g.car.x < 5.8);
  assert(g.car.speed < 0);
});
test('helicopter climbs, hovers, respects altitude bounds and cannot descend through a roof', () => {
  const g = flight();
  advance(g, 7, { up: true });
  assert.equal(g.heli.y, 55);
  advance(g, 1);
  assert(Math.abs(g.heli.vy) < 0.3);
  const b = C.BUILDINGS[10];
  g.heli.x = b.x;
  g.heli.z = b.z;
  g.heli.y = b.h + 2.3;
  g.heli.vy = 0;
  advance(g, 0.6, { down: true });
  assert(g.heli.hp < 100);
  assert(g.heli.y >= b.h + 1.6);
  assert(!g.action('interact'));
});
test('DELETE requires an undelivered rooftop, safe height and low speed, then saves only after payload impact', () => {
  const g = flight(),
    t = C.TARGETS[0];
  assert(!g.action('drop'));
  Object.assign(g.heli, { x: t.x, z: t.z, y: t.h + 8, vx: 15, vz: 0 });
  assert(!g.action('drop'));
  g.heli.vx = 0;
  assert(g.action('drop'));
  assert(!g.action('drop'));
  assert(!g.progress.delivered[0]);
  advance(g, 1.5);
  assert(g.progress.delivered[0]);
  assert.equal(g.progress.cash, 1000);
  assert(!g.action('drop'));
  assert(C.valid(g.snapshot()));
  assert.equal(new C.Game(C.read(JSON.stringify(g.snapshot()))).progress.delivered[0], true);
});
test('audit drones lock a red target before attacking, and movement can escape the scan', () => {
  const g = flight();
  g.drones = [g.drones[0]];
  g.drones[0].cooldown = 0;
  Object.assign(g.heli, { x: -42, z: -60, y: 33 });
  g.tick(0.01);
  assert(g.drones[0].warning);
  advance(g, 1);
  assert.equal(g.heli.hp, 100);
  g.heli.x += 9;
  advance(g, 0.5);
  assert.equal(g.heli.hp, 100);
  g.drones[0].cooldown = 0;
  g.tick(0.01);
  assert(g.drones[0].warning);
  advance(g, 1.5);
  assert.equal(g.heli.hp, 90);
  advance(g, 0.2);
  assert.equal(g.heli.hp, 90);
});
test('pause freezes traffic, drone warnings and mission clocks; failure retains delivered checkpoints', () => {
  const g = flight({ delivered: [true, false, false, false], cash: 1500 });
  g.pause();
  const paused = JSON.stringify(g);
  g.tick(20, { up: true });
  assert(!g.action('drop'));
  assert.equal(JSON.stringify(g), paused);
  g.resume();
  g.hurt(1000, 'test');
  assert.equal(g.state, 'failed');
  assert(g.retry());
  assert.equal(g.progress.stage, 1);
  assert(g.progress.delivered[0]);
  assert.equal(g.progress.cash, 1500);
  assert.equal(g.progress.deaths, 1);
  assert(g.action('interact'));
  g.flightTime = 0.01;
  g.inv = 1;
  g.tick(0.1);
  assert.equal(g.state, 'failed');
  assert.equal(g.progress.deaths, 2);
});
test('both missions are winnable using only real walking, driving, helicopter controls, drops and landing', () => {
  const g = new C.Game();
  g.start();
  advance(g, 0.4, { z: -1 });
  assert(g.action('interact'));
  for (let i = 0; i < 3000 && g.phase === 'pickup' && g.state === 'playing'; i++)
    g.tick(1 / 120, { z: -1 });
  assert.equal(g.phase, 'delivery');
  assert.equal(g.heat, 2);
  assert.equal(g.cops.length, 2);
  advance(g, 1, { up: true });
  for (let i = 0; i < 5000 && g.car.z < 72 && g.state === 'playing'; i++) g.tick(1 / 120, { z: 1 });
  advance(g, 1, { up: true });
  assert.equal(g.state, 'briefing');
  assert.equal(g.progress.cash, 500);
  assert.equal(g.progress.stage, 1);
  g.start();
  assert(g.action('interact'));
  function pilotTo(x, z, height) {
    for (let i = 0; i < 5000 && g.state === 'playing'; i++) {
      const h = g.heli,
        dx = x - h.x,
        dz = z - h.z;
      g.tick(1 / 120, {
        x: Math.max(-0.7, Math.min(0.7, dx * 0.08)),
        z: Math.max(-0.7, Math.min(0.7, dz * 0.08)),
        up: h.y < height - 2,
        down: h.y > height + 3,
      });
      if (
        Math.hypot(dx, dz) < 0.5 &&
        Math.hypot(h.vx, h.vz) < 0.5 &&
        h.y > height - 3 &&
        h.y < height + 4
      )
        return;
    }
    assert.fail('Pilot could not reach waypoint');
  }
  for (const [i, t] of C.TARGETS.entries()) {
    pilotTo(g.heli.x, g.heli.z, 46);
    pilotTo(t.x, t.z, 46);
    pilotTo(t.x, t.z, t.h + 8);
    assert(g.action('drop'));
    advance(g, 2);
    assert(g.progress.delivered[i]);
  }
  assert.equal(g.phase, 'return');
  pilotTo(g.heli.x, g.heli.z, 46);
  pilotTo(C.PAD.x, C.PAD.z, 46);
  for (let i = 0; i < 2000 && g.state === 'playing'; i++) g.tick(1 / 120, { down: true });
  assert.equal(g.state, 'victory');
  assert.equal(g.progress.stage, 2);
  assert.equal(g.progress.wins, 1);
  assert.equal(g.progress.cash, 7000);
  assert.equal(g.progress.deaths, 0);
  assert(g.progress.bestTime > 0 && g.progress.bestTime < 240);
  assert(C.valid(g.snapshot()));
  const before = JSON.stringify(g);
  g.tick(20);
  assert.equal(JSON.stringify(g), before);
  assert.equal(new C.Game(C.read(JSON.stringify(g.snapshot()))).state, 'victory');
});
test('post-story free ride keeps victory, unlocks both vehicles and has no helicopter countdown', () => {
  const g = new C.Game({
    ...C.fresh(),
    stage: 2,
    delivered: [true, true, true, true],
    wins: 1,
    cash: 7000,
  });
  assert(g.freeRide());
  assert.equal(g.phase, 'free');
  assert(g.action('interact'));
  assert.equal(g.mode, 'heli');
  g.flightTime = 1;
  advance(g, 3, { up: true });
  assert.equal(g.state, 'playing');
  assert.equal(g.flightTime, 1);
  assert(!g.action('drop'));
  assert.equal(g.progress.wins, 1);
});
