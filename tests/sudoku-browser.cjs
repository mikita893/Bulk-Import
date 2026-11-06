'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createGameServer } = require('../server/index.cjs');
const release = require('../release.cjs');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  const app = createGameServer({ port: 0, host: '127.0.0.1' }),
    { url } = await app.listen();
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bulk-sudoku-'));
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.BULK_CHROMIUM || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
    const errors = [];
    async function enterDouble(page, fresh = true) {
      await page.waitForFunction(() => window.BulkUnified);
      assert.equal(await page.evaluate(() => BulkUnified.openSudoku()), false);
      assert.equal(await page.locator('#play-sudoku,#nav-sudoku').count(), 0);
      await page.locator('#play-campaign').click();
      await page.waitForFunction(
        () => document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign,
      );
      const frame = await (await page.locator('#campaign-frame').elementHandle()).contentFrame();
      await frame
        .getByRole('button', {
          name: fresh ? '▶ ROZPOCZNIJ KAMPANIĘ' : '▶ KONTYNUUJ KAMPANIĘ',
          exact: true,
        })
        .click();
      await frame.waitForFunction(() => active && mode === 'hub');
      if (!(await frame.evaluate(() => nearShipTerminal()))) {
        const center = await frame
          .locator('#world')
          .evaluate((c) => ({ x: c.clientWidth / 2, y: c.clientHeight / 2 }));
        await frame.locator('#world').click({ position: center });
        await page.keyboard.down('KeyW');
        await frame.waitForFunction(() => nearShipTerminal(), null, { timeout: 6000 });
        await page.keyboard.up('KeyW');
      }
      await page.keyboard.press('KeyE');
      await frame.getByRole('button', { name: 'Rekreacja: Bird Game 3', exact: true }).click();
      await page.waitForFunction(() => BulkUnified.screen === 'bird');
      assert.equal(await page.evaluate(() => BulkUnified.openSudoku()), false);
      await page.locator('#bird-start').click();
      await page.locator('#bird-double').click();
      await page.waitForFunction(() => BulkUnified.screen === 'double');
      return frame;
    }
    async function openSudoku(page) {
      await page.locator('#double-sudoku').click();
      await page.waitForFunction(() => BulkUnified.screen === 'sudoku');
      assert.equal(await page.locator('[data-sudoku-cell]').count(), 81);
    }
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      hasTouch: true,
    });
    let page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    const html = fs.readFileSync(path.join(__dirname, '..', release.filename), 'utf8'),
      file = path.join(temp, release.filename);
    fs.writeFileSync(file, html);
    try {
      await page.goto(pathToFileURL(file).href);
    } catch (error) {
      if (!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR')) throw error;
      await page.close();
      page = await context.newPage();
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setContent(html);
    }
    const traffic = [];
    page.on('request', (r) => {
      if (!/^(blob|data):/.test(r.url())) traffic.push(r.url());
    });
    page.on('websocket', (ws) => traffic.push(ws.url()));
    const campaign = await enterDouble(page);
    await page.locator('#double-training').check();
    await page.locator('[data-double-action="start"]').click();
    await page.waitForFunction(() => BulkUnified.double.model.state === 'PLAYING');
    await openSudoku(page);
    assert.equal(await page.evaluate(() => BulkUnified.double.model.state), 'PAUSED');
    const frozen = await page.evaluate(() => ({
      double: JSON.stringify(BulkUnified.double.model),
      bird: JSON.stringify(BulkUnified.bird.game),
    }));
    const frozenCampaign = await campaign.evaluate(() => JSON.stringify({ player, time }));
    assert.equal(await page.locator('#sudoku-grid [role="row"]').count(), 9);
    const setup = await page.evaluate(() => {
      const g = BulkUnified.sudoku.game;
      return {
        given: g.puzzle.findIndex(Boolean),
        empty: g.puzzle.findIndex((n) => !n),
        solution: g.solution,
      };
    });
    await page.locator('[data-sudoku-cell="' + setup.given + '"]').click();
    await page.keyboard.press(String((setup.solution[setup.given] % 9) + 1));
    assert.equal(
      await page.evaluate((i) => BulkUnified.sudoku.game.values[i], setup.given),
      setup.solution[setup.given],
    );
    await page.locator('[data-sudoku-cell="' + setup.empty + '"]').click();
    await page.keyboard.press('KeyN');
    await page.keyboard.press('Digit3');
    assert.equal(await page.evaluate((i) => BulkUnified.sudoku.game.notes[i], setup.empty), 4);
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await page.evaluate(() => BulkUnified.sudoku.game.selected),
      Math.floor(setup.empty / 9) * 9 + Math.min(8, (setup.empty % 9) + 1),
    );
    await page.keyboard.press('KeyN');
    await page.locator('[data-sudoku-cell="' + setup.empty + '"]').click();
    await page.keyboard.press(String((setup.solution[setup.empty] % 9) + 1));
    await page.locator('[data-sudoku-action="check"]').click();
    assert(await page.locator('[data-sudoku-cell="' + setup.empty + '"]').isVisible());
    assert(
      await page
        .locator('[data-sudoku-cell="' + setup.empty + '"]')
        .evaluate((el) => el.classList.contains('invalid')),
    );
    await page.locator('[data-sudoku-action="undo"]').click();
    assert.equal(await page.evaluate((i) => BulkUnified.sudoku.game.values[i], setup.empty), 0);
    await page.locator('[data-sudoku-action="hint"]').click();
    assert.equal(
      await page.evaluate((i) => BulkUnified.sudoku.game.values[i], setup.empty),
      setup.solution[setup.empty],
    );
    await page.keyboard.press('KeyP');
    const elapsed = await page.evaluate(() => BulkUnified.sudoku.game.elapsed);
    await sleep(700);
    assert.equal(await page.evaluate(() => BulkUnified.sudoku.game.elapsed), elapsed);
    await page.locator('.sdk-cover [data-sudoku-action="pause"]').click();
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-sudoku.png' });
    await page.setViewportSize({ width: 430, height: 932 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert(await page.locator('.sdk-panel').isVisible());
    await page.locator('[data-sudoku-action="notes"]').tap();
    assert(await page.evaluate(() => BulkUnified.sudoku.game.notesMode));
    const noteCell = await page.evaluate(() => BulkUnified.sudoku.game.values.findIndex((n) => !n));
    await page.locator('[data-sudoku-cell="' + noteCell + '"]').tap();
    await page.locator('[data-sudoku-digit="7"]').tap();
    assert(await page.evaluate((i) => !!(BulkUnified.sudoku.game.notes[i] & 64), noteCell));
    await page.locator('[data-sudoku-action="notes"]').tap();
    await page.evaluate(() => (document.getElementById('sudoku-host').scrollTop = 0));
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-sudoku-mobile.png' });
    const holes = await page.evaluate(() => {
      const g = BulkUnified.sudoku.game;
      return g.values.flatMap((n, i) => (n !== g.solution[i] ? [{ i, n: g.solution[i] }] : []));
    });
    for (const { i, n } of holes) {
      await page.locator('[data-sudoku-cell="' + i + '"]').click();
      await page.keyboard.press(String(n));
    }
    assert(await page.locator('.sdk-win').isVisible());
    assert(await page.evaluate(() => BulkUnified.sudoku.game.solved));
    const completeTime = await page.evaluate(() => BulkUnified.sudoku.game.elapsed);
    await sleep(400);
    assert.equal(await page.evaluate(() => BulkUnified.sudoku.game.elapsed), completeTime);
    await page.waitForFunction(() => BulkUnified.screen === 'runner');
    assert(await page.locator('#runner-world').isVisible());
    await page.locator('#unified-back').click();
    await page.waitForFunction(() => BulkUnified.screen === 'sudoku');
    await page.screenshot({ path: '/tmp/bulk-v' + release.major + '-sudoku-complete.png' });
    assert.equal(
      await page.evaluate(() => JSON.stringify(BulkUnified.double.model)),
      frozen.double,
    );
    assert.equal(await page.evaluate(() => JSON.stringify(BulkUnified.bird.game)), frozen.bird);
    assert.equal(await campaign.evaluate(() => JSON.stringify({ player, time })), frozenCampaign);
    await page.evaluate(() => (window._oldSudoku = BulkUnified.sudoku));
    await page.locator('#unified-back').click();
    assert.equal(await page.evaluate(() => BulkUnified.screen), 'double');
    assert(await page.evaluate(() => window._oldSudoku.dead));
    await page.keyboard.press('Digit1');
    assert.equal(
      await page.evaluate(() => JSON.stringify(BulkUnified.double.model)),
      frozen.double,
    );
    await page.locator('.dbl-cover [data-double-action="pause"]').click();
    await page.waitForFunction(() => BulkUnified.double.model.state === 'PLAYING');
    await page.keyboard.press('KeyP');
    assert.equal(traffic.length, 0);
    await context.close();

    const onlineContext = await browser.newContext({ viewport: { width: 1440, height: 1050 } }),
      online = await onlineContext.newPage();
    online.on('pageerror', (e) => errors.push(e.message));
    await online.goto(url + '/' + release.filename);
    await enterDouble(online);
    await openSudoku(online);
    for (const level of ['easy', 'hard', 'normal']) {
      await online.locator('#sudoku-level').selectOption(level);
      await online.locator('[data-sudoku-action="new"]').click();
      assert.equal(await online.evaluate(() => BulkUnified.sudoku.game.level), level);
    }
    const i = await online.evaluate(() => BulkUnified.sudoku.game.puzzle.findIndex((n) => !n));
    await online.locator('[data-sudoku-cell="' + i + '"]').click();
    await online.keyboard.press('KeyN');
    await online.keyboard.press('Digit4');
    const saved = await online.evaluate(() => BulkUnified.sudoku.game.snapshot());
    await online.locator('#unified-back').click();
    await openSudoku(online);
    assert.deepEqual(await online.evaluate(() => BulkUnified.sudoku.game.values), saved.values);
    assert.deepEqual(await online.evaluate(() => BulkUnified.sudoku.game.notes), saved.notes);
    await online.reload();
    await enterDouble(online, false);
    await openSudoku(online);
    assert.deepEqual(await online.evaluate(() => BulkUnified.sudoku.game.puzzle), saved.puzzle);
    assert.deepEqual(await online.evaluate(() => BulkUnified.sudoku.game.notes), saved.notes);
    assert.equal(await online.evaluate(() => BulkUnified.sudoku.game.notesMode), true);
    assert.deepEqual(errors, []);
    await onlineContext.close();
    console.log(
      'PASS Sudoku: nested physical entry, standalone/no traffic, 81 cells, locked givens, keyboard/touch-ready keypad, notes, wrong-answer check, undo, hint, pause/timer, full solved board, mobile, frozen Double/Bird/campaign, return/resume and saved puzzle after HTTP reload.',
    );
  } finally {
    await browser?.close();
    await app.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
