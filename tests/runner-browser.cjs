'use strict';
const { chromium } = require('playwright'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const { createGameServer } = require('../server/index.cjs'),
  release = require('../release.cjs');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const app = createGameServer({ port: 0, host: '127.0.0.1' }),
    { url } = await app.listen();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.BULK_CHROMIUM || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1050 },
        hasTouch: true,
      }),
      page = await context.newPage(),
      errors = [],
      traffic = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (!/^(blob|data):/.test(r.url())) traffic.push(r.url());
    });
    page.on('websocket', (s) => traffic.push(s.url()));
    // The managed browser blocks file://. An in-memory Storage provides the same optional persistence contract in this network-free about:blank document.
    await page.evaluate(() => {
      const data = new Map();
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: (k) => data.get(k) ?? null,
          setItem: (k, v) => data.set(k, String(v)),
          removeItem: (k) => data.delete(k),
        },
      });
    });
    await page.setContent(fs.readFileSync(release.filename, 'utf8'));
    await page.waitForFunction(() => window.BulkUnified);
    assert.equal(await page.evaluate(() => BulkUnified.openRunner()), false);
    assert.equal(await page.locator('#play-runner,#nav-runner').count(), 0);
    await page.locator('#play-campaign').click();
    await page.waitForFunction(
      () => document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign,
    );
    const campaign = await (await page.locator('#campaign-frame').elementHandle()).contentFrame();
    await campaign.getByRole('button', { name: '▶ ROZPOCZNIJ KAMPANIĘ', exact: true }).click();
    await campaign.evaluate(() => {
      audioOn = false;
      dubbing.stop();
    });
    await campaign.locator('#world').click({ position: { x: 500, y: 350 } });
    await page.keyboard.down('KeyW');
    await campaign.waitForFunction(() => nearShipTerminal(), null, { timeout: 6000 });
    await page.keyboard.up('KeyW');
    await page.keyboard.press('KeyE');
    await campaign
      .getByRole('button', { name: 'Rekreacja: Gwintforce / wojna rekordów', exact: true })
      .click();
    await page.waitForFunction(() => BulkUnified.screen === 'cards');
    await page.locator('.gw-builder summary').click();
    assert.equal(await page.locator('.gw-collection [data-card-art]').count(), 20);
    assert.equal(await page.locator('svg.gw-art').count(), 0);
    assert.equal(
      await page.evaluate(
        () =>
          Object.keys(BulkCards.CARD_CATALOG).filter(
            (id) => !Number.isInteger(BulkCardArt.tiles[id]),
          ).length,
      ),
      0,
    );
    const decoded = await page
      .locator('.gw-art')
      .first()
      .evaluate(async (el) => {
        const css = getComputedStyle(el).backgroundImage;
        const src = css.slice(5, -2);
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = src;
        });
        return {
          width: image.naturalWidth,
          height: image.naturalHeight,
          css: css.startsWith('url("data:image/webp;base64,'),
        };
      });
    assert(decoded.css && decoded.width > 800 && decoded.height > 800);
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-painted-cards.png' });
    await page.locator('[data-rival="vael"]').click();
    assert.equal(await page.locator('.gw-hand [data-card-art]').count(), 10);
    const unit = await page.evaluate(() => {
      const m = BulkUnified.cards.match;
      return m.hands.player.find(
        (u) =>
          BulkCards.CARD_CATALOG[u.card].row !== 'special' &&
          !['spy', 'medic'].includes(BulkCards.CARD_CATALOG[u.card].ability),
      ).uid;
    });
    await page.locator('[data-hand="' + unit + '"]').click();
    await page.locator('[data-deploy]').first().click();
    assert((await page.locator('.gw-side.player [data-card-art]').count()) > 0);
    const sizes = await page
      .locator('.gw-side.player .gw-card')
      .first()
      .evaluate((el) => ({
        card: el.getBoundingClientRect().height,
        art: el.querySelector('.gw-art').getBoundingClientRect().height,
      }));
    assert(sizes.card >= 120 && sizes.art >= 70);
    assert(
      await page
        .locator('.gw-hand .gw-card')
        .first()
        .evaluate(
          (el) =>
            el.querySelector('strong').getBoundingClientRect().bottom <=
            el.getBoundingClientRect().bottom,
        ),
    );
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-painted-table.png' });
    await page.locator('#unified-back').click();
    await campaign.getByRole('button', { name: 'Rekreacja: Bird Game 3', exact: true }).click();
    await page.locator('#bird-start').click();
    await page.locator('#bird-double').click();
    await page.locator('#double-training').check();
    await page.locator('[data-double-action="start"]').click();
    await page.waitForFunction(() => BulkUnified.double.model.state === 'PLAYING');
    await page.locator('#double-sudoku').click();
    assert.equal(await page.evaluate(() => BulkUnified.openRunner()), false);
    const last = await page.evaluate(() => {
      const g = BulkUnified.sudoku.game,
        holes = g.puzzle.flatMap((n, i) => (!n ? [i] : [])),
        last = holes.pop();
      for (const i of holes) {
        g.select(i);
        g.enter(g.solution[i]);
      }
      g.select(last);
      BulkUnified.sudoku.render();
      return { i: last, n: g.solution[last] };
    });
    await page.locator('[data-sudoku-cell="' + last.i + '"]').click();
    await page.keyboard.press(String(last.n));
    await page.waitForFunction(() => BulkUnified.screen === 'runner');
    assert(await page.locator('#runner-world').isVisible());
    assert(
      await page.evaluate(() => BulkUnified.sudoku.suspended && BulkUnified.sudoku.game.solved),
    );
    const frozen = await page.evaluate(() => ({
        double: JSON.stringify(BulkUnified.double.model),
        bird: JSON.stringify(BulkUnified.bird.game),
        sudoku: JSON.stringify(BulkUnified.sudoku.game.snapshot()),
      })),
      frozenCampaign = await campaign.evaluate(() => JSON.stringify({ time, player }));
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-metro-ready.png' });
    await page.locator('[data-run-action="start"]').click();
    await page.waitForFunction(() => BulkUnified.runner.game.distance > 2);
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(
      () => BulkUnified.runner.game.lane === 0 && BulkUnified.runner.game.x < -2.7,
    );
    await page.keyboard.press('Space');
    await page.waitForFunction(() => BulkUnified.runner.game.y > 1);
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(
      () => BulkUnified.runner.game.y === 0 && BulkUnified.runner.game.slide > 0,
    );
    await page.keyboard.press('KeyP');
    const paused = await page.evaluate(() => JSON.stringify(BulkUnified.runner.game));
    await sleep(250);
    assert.equal(await page.evaluate(() => JSON.stringify(BulkUnified.runner.game)), paused);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => JSON.stringify(BulkUnified.runner.game)), paused);
    await page.locator('.run-cover [data-run-action="pause"]').click();
    await page.setViewportSize({ width: 430, height: 932 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.locator('[data-run-action="right"]').tap();
    await page.waitForFunction(() => BulkUnified.runner.game.lane === 1);
    await page.locator('[data-run-action="jump"]').tap();
    await page.waitForFunction(() => BulkUnified.runner.game.y > 0.3);
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-metro-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 1050 });
    const bounds = await page.locator('#runner-world').boundingBox();
    await page.mouse.move(bounds.x + bounds.width * 0.55, bounds.y + bounds.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.55 - 100, bounds.y + bounds.height * 0.5);
    await page.mouse.up();
    await page.waitForFunction(() => BulkUnified.runner.game.lane === 0);
    const budget = await page.evaluate(() => {
      const r = BulkUnified.runner;
      r.game.inv = 999;
      const memory = r.view.renderer.info.memory.geometries;
      for (let i = 0; i < 120; i++) {
        r.game.tick(1 / 60);
        r.view.render(r.game, i / 60);
      }
      if (r.view.renderer.info.memory.geometries !== memory)
        throw Error('Runner allocates GPU geometry during play');
      return { calls: r.view.renderer.info.render.calls, items: r.game.items.length, memory };
    });
    assert(budget.calls < 100);
    assert(budget.items < 100);
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-metro-run.png' });
    await page.evaluate(() => {
      const g = BulkUnified.runner.game;
      g.hearts = 1;
      g.inv = 0;
      g.boost = 0;
      g.shields = 0;
      g.items = [];
      g.nextRow = 1e8;
      g.add('train', g.lane, g.distance + 1);
    });
    await page.waitForFunction(() => BulkUnified.runner.game.state === 'over');
    assert(await page.locator('[data-run-action="restart"]').isVisible());
    const score = await page.evaluate(() => BulkUnified.runner.record.score);
    assert(score > 0);
    await page.locator('[data-run-action="restart"]').click();
    await page.waitForFunction(() => BulkUnified.runner.game.state === 'playing');
    assert.equal(await page.evaluate(() => BulkUnified.openSouls()), false);
    // Put the runner immediately before the finish; normal RAF physics must cross the exact gate.
    await page.evaluate(() => {
      const g = BulkUnified.runner.game;
      g.distance = 29999;
      g.items = [];
      g.nextRow = 1e8;
      g.inv = 0;
    });
    await page.waitForFunction(() => BulkUnified.runner.game.state === 'won');
    assert.equal(await page.evaluate(() => BulkUnified.runner.game.distance), 30000);
    await page.waitForFunction(() => BulkUnified.screen === 'souls');
    assert(await page.locator('#souls-world').isVisible());
    assert(
      await page.evaluate(
        () => BulkUnified.runner.suspended && BulkUnified.runner.record.completed,
      ),
    );
    const frozenRunner = await page.evaluate(() => JSON.stringify(BulkUnified.runner.game));
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-souls-ready.png' });
    await page.locator('[data-souls-action="start"]').click();
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => BulkUnified.souls.game.player.z < 7);
    await page.keyboard.up('KeyW');
    await page.evaluate(() => {
      const g = BulkUnified.souls.game;
      g.player.x = 0;
      g.player.z = 0;
      g.player.inv = 0;
      g.enemies = [{ ...g.enemies[0], x: 0, z: -2, state: 'chase', timer: 10 }];
      g.target = g.enemies[0].id;
    });
    await page.keyboard.press('KeyJ');
    await page.waitForFunction(() => BulkUnified.souls.game.enemies[0].hp === 50);
    await page.waitForFunction(() => !BulkUnified.souls.game.player.action);
    await page.keyboard.press('KeyK');
    await page.waitForFunction(() => BulkUnified.souls.game.enemies[0].hp === 2);
    await page.waitForFunction(() => !BulkUnified.souls.game.player.action);
    await page.keyboard.press('KeyJ');
    await page.waitForFunction(() => BulkUnified.souls.game.enemies[0].hp === 0);
    assert.equal(await page.evaluate(() => BulkUnified.souls.game.progress.runes), 35);
    await page.waitForFunction(() => !BulkUnified.souls.game.player.action);
    await page.waitForFunction(() => BulkUnified.souls.game.player.stamina >= 28);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => BulkUnified.souls.game.player.roll > 0);
    await page.waitForFunction(() => BulkUnified.souls.game.player.roll === 0);
    await page.keyboard.press('KeyP');
    const soulsPaused = await page.evaluate(() => JSON.stringify(BulkUnified.souls.game));
    await sleep(200);
    await page.keyboard.press('KeyK');
    assert.equal(await page.evaluate(() => JSON.stringify(BulkUnified.souls.game)), soulsPaused);
    await page.locator('.souls-cover [data-souls-action="pause"]').click();
    await page.evaluate(() => {
      const g = BulkUnified.souls.game;
      g.player.x = 0;
      g.player.z = 8;
      g.progress.runes = 100;
      g.player.hp = 30;
      g.player.flasks = 1;
    });
    await page.keyboard.press('KeyE');
    await page.waitForFunction(() => BulkUnified.souls.game.state === 'rest');
    await page.locator('[data-souls-action="level"]').click();
    assert.equal(await page.evaluate(() => BulkUnified.souls.game.progress.level), 1);
    await page.locator('[data-souls-action="rest"]').click();
    assert.equal(await page.evaluate(() => BulkUnified.souls.game.player.flasks), 3);
    await page.locator('[data-souls-action="leaveRest"]').click();
    await page.setViewportSize({ width: 430, height: 932 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.locator('[data-souls-action="roll"]').tap();
    await page.waitForFunction(() => BulkUnified.souls.game.player.roll > 0);
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-souls-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 1050 });
    // Telegraphed boss states are rendered from the same radius/direction as simulation collisions.
    await page.evaluate(() => {
      const s = BulkUnified.souls,
        g = s.game;
      g.area = 2;
      g.progress.room = 2;
      g.spawnRoom();
      g.player.z = -3;
      g.target = g.enemies[0].id;
      const e = g.enemies[0];
      e.hp = 250;
      e.timer = 0;
      e.state = 'chase';
    });
    await page.waitForFunction(() => BulkUnified.souls.game.enemies[0].phase === 3);
    await page.waitForFunction(() => BulkUnified.souls.game.enemies[0].state === 'windup');
    assert.equal(await page.locator('#souls-boss-phase').textContent(), 'FAZA 3 / 3');
    assert(await page.evaluate(() => BulkUnified.souls.view.models.get('2-0').marker.visible));
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-souls-boss.png' });
    const soulsBudget = await page.evaluate(() => {
      const s = BulkUnified.souls;
      s.game.pause();
      s.view.render(s.game, 0.016, s.viewState);
      const memory = s.view.renderer.info.memory.geometries;
      for (let i = 0; i < 60; i++) s.view.render(s.game, 0.016, s.viewState);
      return {
        memory,
        after: s.view.renderer.info.memory.geometries,
        calls: s.view.renderer.info.render.calls,
        bolts: s.game.bolts.length,
      };
    });
    assert.equal(soulsBudget.after, soulsBudget.memory);
    assert(soulsBudget.calls < 180);
    await page.evaluate(() => {
      const s = BulkUnified.souls,
        g = s.game;
      g.resume();
      g.player.hp = 1;
      g.player.inv = 0;
      g.progress.runes = 80;
      g.hurtPlayer(99, g.player.x, g.player.z - 1);
      s.cover();
      s.persist();
    });
    assert(await page.locator('[data-souls-action="retry"]').isVisible());
    assert.equal(await page.evaluate(() => BulkUnified.souls.game.progress.lost.runes), 80);
    await page.locator('[data-souls-action="retry"]').click();
    assert.equal(await page.evaluate(() => BulkUnified.souls.game.progress.runes), 0);
    await page.evaluate(() => {
      const g = BulkUnified.souls.game;
      g.player.x = g.progress.lost.x;
      g.player.z = g.progress.lost.z;
    });
    await page.waitForFunction(() => BulkUnified.souls.game.progress.runes === 80);
    await page.evaluate(() => {
      const g = BulkUnified.souls.game,
        e = g.enemies[0];
      g.player.x = 0;
      g.player.z = 0;
      g.player.stamina = 100;
      g.player.inv = 1;
      e.x = 0;
      e.z = -2;
      e.hp = 20;
      e.state = 'recover';
      e.timer = 3;
      g.target = e.id;
    });
    await page.keyboard.press('KeyJ');
    await page.waitForFunction(() => BulkUnified.souls.game.state === 'victory');
    assert(await page.locator('[data-souls-action="new"]').isVisible());
    await page.evaluate(() => (window._formerSouls = BulkUnified.souls));
    await page.locator('#unified-back').click();
    assert(await page.evaluate(() => _formerSouls.dead && BulkUnified.souls === null));
    assert.equal(await page.locator('#souls-host canvas').count(), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(BulkUnified.runner.game)), frozenRunner);
    await sleep(1400);
    assert.equal(await page.evaluate(() => BulkUnified.screen), 'runner');
    await page.locator('[data-run-action="souls"]').click();
    assert.equal(await page.evaluate(() => BulkUnified.souls.game.state), 'victory');
    await page.locator('#unified-back').click();
    console.log(
      'PASS 30,000m gate, automatic Apex Souls, real keyboard melee/roll, pause, bonfire upgrades, mobile touch, boss phases/telegraphs, GPU budget, death/rune retrieval, victory save and suspended parent cleanup.',
      JSON.stringify(soulsBudget),
    );
    await page.evaluate(() => (window._formerRunner = BulkUnified.runner));
    await page.locator('#unified-back').click();
    assert(await page.evaluate(() => _formerRunner.dead && BulkUnified.runner === null));
    assert.equal(await page.locator('#runner-host canvas').count(), 0);
    assert.equal(await page.evaluate(() => BulkUnified.screen), 'sudoku');
    assert(await page.locator('.sdk-win').isVisible());
    assert.deepEqual(
      await page.evaluate(() => ({
        double: JSON.stringify(BulkUnified.double.model),
        bird: JSON.stringify(BulkUnified.bird.game),
        sudoku: JSON.stringify(BulkUnified.sudoku.game.snapshot()),
      })),
      frozen,
    );
    assert.equal(await campaign.evaluate(() => JSON.stringify({ time, player })), frozenCampaign);
    await page.locator('[data-sudoku-action="runner"]').click();
    assert.equal(await page.evaluate(() => BulkUnified.runner.game.state), 'ready');
    await page.locator('#unified-back').click();
    await page.locator('#unified-back').click();
    assert.equal(await page.evaluate(() => BulkUnified.screen), 'double');
    assert.equal(
      await page.evaluate(() => JSON.stringify(BulkUnified.double.model)),
      frozen.double,
    );
    assert.deepEqual(traffic, []);
    assert.deepEqual(errors, []);
    await context.close();
    const online = await browser.newPage();
    await online.goto(url + '/' + release.filename);
    await online.evaluate(() =>
      localStorage.setItem(
        'bulk-import-metro-runner-v1',
        JSON.stringify({ version: 1, score: 777, coins: 19 }),
      ),
    );
    await online.reload();
    assert.equal(
      await online.evaluate(
        () => BulkRunner.readRecord(localStorage.getItem('bulk-import-metro-runner-v1')).score,
      ),
      777,
    );
    console.log(
      'PASS painted card atlas, collection/hand/board and unchanged deployment; automatic Sudoku → Metro 3D, real movement/jump/slide, pause, mobile touch, bounded draw calls/geometry/items, defeat/restart, nested return/cleanup and standalone without traffic.',
      JSON.stringify(budget),
    );
  } finally {
    await browser?.close();
    await app.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
