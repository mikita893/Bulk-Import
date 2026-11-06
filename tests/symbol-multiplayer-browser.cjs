'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createGameServer } = require('../server/index.cjs');
const release = require('../release.cjs');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const app = createGameServer({ port: 0, host: '127.0.0.1', doubleEnabled: true });
  const { url } = await app.listen();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.BULK_CHROMIUM || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
    const errors = [],
      contexts = [];
    async function player(mobile = false) {
      const context = await browser.newContext({
        viewport: mobile ? { width: 430, height: 932 } : { width: 1440, height: 1050 },
        hasTouch: true,
      });
      contexts.push(context);
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(url + '/' + release.filename);
      await page.waitForFunction(() => __bulkMultiplayer.connected);
      await page.locator('#play-campaign').click();
      await page.waitForFunction(
        () => document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign,
      );
      const frame = await (await page.locator('#campaign-frame').elementHandle()).contentFrame();
      await frame.getByRole('button', { name: '▶ ROZPOCZNIJ KAMPANIĘ', exact: true }).click();
      await frame.waitForFunction(() => active && mode === 'hub');
      const center = await frame
        .locator('#world')
        .evaluate((c) => ({ x: c.clientWidth / 2, y: c.clientHeight / 2 }));
      await frame.locator('#world').click({ position: center });
      await page.keyboard.down('KeyW');
      await frame.waitForFunction(() => nearShipTerminal(), null, { timeout: 6000 });
      await page.keyboard.up('KeyW');
      await page.keyboard.press('KeyE');
      await frame.getByRole('button', { name: 'Rekreacja: Bird Game 3', exact: true }).click();
      await page.waitForFunction(() => BulkUnified.screen === 'bird');
      await page.locator('#bird-start').click();
      await page.locator('#bird-double').click();
      await page.waitForFunction(() => BulkUnified.screen === 'double');
      assert(await page.evaluate(() => BulkUnified.double.online.enabled));
      return page;
    }
    const a = await player(),
      b = await player(true);
    const frozen = await a.evaluate(() => JSON.stringify(BulkUnified.bird.game));
    await a.locator('#double-net-name').fill('Admin & CSV');
    await a.locator('[data-double-action="net-create"]').click();
    await a.waitForFunction(() => BulkUnified.double.online.room?.code);
    const code = await a.locator('#double-room-code').textContent();
    assert.match(code, /^[A-F0-9]{6}$/);
    await b.locator('#double-net-name').fill('Pivot & CSV');
    await b.locator('#double-net-code').fill(code);
    await b.locator('[data-double-action="net-join"]').click();
    await a.waitForFunction(() => BulkUnified.double.online.room.players.length === 2);
    await b.waitForFunction(() => BulkUnified.double.online.room?.players.length === 2);
    assert(await b.locator('[data-double-action="net-start"]').isDisabled());
    assert(await b.locator('#double-sudoku').isDisabled());
    assert.equal(await b.evaluate(() => BulkUnified.openSudoku()), false);
    await a.locator('#double-net-cooldown').selectOption('1500');
    await a.locator('[data-double-action="net-ready"]').click();
    await b.locator('[data-double-action="net-ready"]').click();
    await a.waitForFunction(() => BulkUnified.double.online.room.players.every((p) => p.ready));
    await a.screenshot({ path: '/tmp/bulk-v' + release.major + '-double-lobby.png' });
    await a.locator('[data-double-action="net-start"]').click();
    for (const page of [a, b])
      await page.waitForFunction(() => BulkUnified.double.model.state === 'PLAYING');
    assert.equal(app.rooms.size, 0);
    assert.equal(app.doubleService.rooms.size, 1);
    const bad = await b.evaluate(() => {
      const m = BulkUnified.double.model;
      return m.participants[0].card.symbols.find((id) => !m.center.symbols.includes(id));
    });
    await b.locator('[data-double-symbol="' + bad + '"]').tap();
    await b.waitForFunction(() => BulkUnified.double.model.result.wrong === 1);
    assert(await b.locator('#double-lock').isVisible());
    const first = await a.evaluate(() => {
      const m = BulkUnified.double.model;
      return BulkDoubleDeck.commonDoubleSymbol(m.participants[0].card, m.center);
    });
    await a.locator('[data-double-symbol="' + first + '"]').click();
    await b.waitForFunction(() => BulkUnified.double.model.state === 'ROUND_TRANSITION');
    await b.waitForFunction(() => BulkUnified.double.model.state === 'PLAYING');
    assert(await b.locator('#double-lock').isVisible());
    await a.screenshot({ path: '/tmp/bulk-v' + release.major + '-double-online.png' });
    await b.screenshot({ path: '/tmp/bulk-v' + release.major + '-double-online-mobile.png' });
    assert(await b.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    const room = app.doubleService.rooms.get(code);
    assert.equal(
      room.match.state,
      'PLAYING',
      'Switching browser focus does not pause an online match',
    );
    await a.locator('[data-double-action="net-pause"]').click();
    for (const page of [a, b])
      await page.waitForFunction(() => BulkUnified.double.model.state === 'PAUSED');
    const paused = room.match.time;
    await sleep(150);
    assert.equal(room.match.time, paused);
    assert(await b.locator('.dbl-cover [data-double-action="net-pause"]').isDisabled());
    await a.locator('.dbl-cover [data-double-action="net-pause"]').click();
    await a.waitForFunction(() => BulkUnified.double.model.state === 'PLAYING');
    const id = await b.evaluate(() => BulkUnified.double.online.room.meId);
    await b.evaluate(() => BulkUnified.double.online.socket.close());
    await a.waitForFunction(() => BulkUnified.double.model.state === 'PAUSED');
    await b.waitForFunction(
      () => BulkUnified.double.online.connected && BulkUnified.double.model.state === 'PLAYING',
      null,
      { timeout: 10000 },
    );
    assert.equal(await b.evaluate(() => BulkUnified.double.online.room.meId), id);
    assert.equal(await b.evaluate(() => BulkUnified.double.model.result.wrong), 1);
    let moves = 1;
    while (room.match.state !== 'GAME_OVER') {
      assert(moves < 32);
      const page = moves % 2 ? b : a;
      await page.waitForFunction(() => {
        const m = BulkUnified.double.model;
        return (
          m.state === 'GAME_OVER' ||
          (m.state === 'PLAYING' && m.projectedTime(performance.now()) >= m.lockedUntil)
        );
      });
      if (await page.evaluate(() => BulkUnified.double.model.state === 'GAME_OVER')) break;
      const before = room.match.history.length;
      const symbol = await page.evaluate(() => {
        const m = BulkUnified.double.model;
        return BulkDoubleDeck.commonDoubleSymbol(m.participants[0].card, m.center);
      });
      await page.locator('[data-double-symbol="' + symbol + '"]').click();
      await page.waitForFunction(
        (n) => BulkUnified.double.model.result.ranking.reduce((sum, p) => sum + p.score, 0) > n,
        before,
      );
      moves++;
      await page.waitForFunction(() =>
        ['PLAYING', 'GAME_OVER'].includes(BulkUnified.double.model.state),
      );
    }
    for (const page of [a, b])
      await page.waitForFunction(() => BulkUnified.double.model.state === 'GAME_OVER');
    assert.equal(room.match.history.length, 29);
    assert.equal(
      room.match.participants.reduce((sum, p) => sum + p.score, 0),
      29,
    );
    assert.equal(await a.locator('.dbl-ranking li').count(), 2);
    assert.equal(await b.locator('.dbl-ranking li').count(), 2);
    await a.screenshot({ path: '/tmp/bulk-v' + release.major + '-double-online-results.png' });
    await a.locator('[data-double-action="net-lobby"]').click();
    await b.waitForFunction(() => BulkUnified.double.model.state === 'MENU');
    assert(await b.locator('[data-double-action="net-start"]').isDisabled());
    await b.locator('[data-double-action="net-leave"]').click();
    await a.waitForFunction(() => BulkUnified.double.online.room.players.length === 1);
    await a.locator('[data-double-action="net-leave"]').click();
    assert.equal(await a.evaluate(() => BulkUnified.double.online.active), false);
    assert.equal(await a.evaluate(() => JSON.stringify(BulkUnified.bird.game)), frozen);
    await a.locator('#unified-back').click();
    assert.equal(await a.evaluate(() => BulkUnified.screen), 'bird');
    await sleep(150);
    assert.equal(app.doubleService.rooms.size, 0);
    assert.equal(app.doubleService.connections.size, 0);
    assert.deepEqual(errors, []);
    for (const context of contexts) await context.close();
    console.log(
      'PASS CSV Double multiplayer: two real browsers, nested entry, lobby/code/readiness, private hands, independent penalty, human card race, pause, reconnect, 29-card complete match, shared results, rematch lobby, mobile and frozen solo restoration.',
    );
  } finally {
    await browser?.close();
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
