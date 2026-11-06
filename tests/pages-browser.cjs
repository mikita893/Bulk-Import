'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { buildPages } = require('../deploy/pages/build.cjs');
const release = require('../release.cjs');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'bulk-pages-'));
  const index = buildPages({ output });
  const html = fs.readFileSync(index);
  const original = fs.readFileSync(path.join(__dirname, '..', release.filename));
  assert(fs.existsSync(path.join(output, '.nojekyll')));
  // Deliberately serve only one file under a project prefix: no API or WebSocket handler.
  const server = http.createServer((req, res) => {
    if (req.url === '/Bulk-Import/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else {
      res.writeHead(404);
      res.end('No backend');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.BULK_CHROMIUM || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [],
      requests = [],
      sockets = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/^https?:/.test(request.url())) requests.push(request.url());
    });
    page.on('websocket', (socket) => sockets.push(socket.url()));
    const url = `http://127.0.0.1:${server.address().port}/Bulk-Import/`;
    async function gameFrame() {
      const frame = await (await page.locator('#solo-game').elementHandle()).contentFrame();
      await frame.waitForFunction(() => window.BulkUnified && window.__bulkMultiplayer);
      return frame;
    }
    await page.goto(url);
    let game = await gameFrame();
    assert(await game.evaluate(() => BulkUnified.local));
    assert.equal(await game.evaluate(() => location.protocol), 'about:');
    assert.equal(await game.evaluate(() => __bulkMultiplayer.socket), null);
    for (const id of ['create-coop', 'create-versus', 'join-code', 'join-room', 'connect-server']) {
      assert(await game.locator('#' + id).isDisabled(), id + ' must stay disabled on Pages');
    }
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#download').click(),
    ]);
    assert.equal(download.suggestedFilename(), release.filename);
    assert.deepEqual(
      fs.readFileSync(await download.path()),
      original,
      'Download is the unchanged release HTML',
    );
    await page.screenshot({ path: '/tmp/bulk-pages-v' + release.major + '-menu.png' });
    await game.locator('#play-campaign').click();
    await game.waitForFunction(
      () => document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign,
    );
    const campaign = await (await game.locator('#campaign-frame').elementHandle()).contentFrame();
    await campaign.getByRole('button', { name: '▶ ROZPOCZNIJ KAMPANIĘ', exact: true }).click();
    await campaign.waitForFunction(() => active && mode === 'hub');
    const center = await campaign
      .locator('#world')
      .evaluate((canvas) => ({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 }));
    await campaign.locator('#world').click({ position: center });
    await page.keyboard.down('KeyW');
    await campaign.waitForFunction(() => nearShipTerminal(), null, { timeout: 6000 });
    await page.keyboard.up('KeyW');
    await page.keyboard.press('KeyE');
    await campaign.getByRole('button', { name: 'Rekreacja: Bird Game 3', exact: true }).click();
    await game.waitForFunction(() => BulkUnified.screen === 'bird');
    await game.locator('[data-bird="opium"]').click();
    assert.equal(await game.evaluate(() => BulkUnified.bird.game.selected), 'opium');
    await page.setViewportSize({ width: 430, height: 932 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert(await game.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.screenshot({ path: '/tmp/bulk-pages-v' + release.major + '-bird-mobile.png' });
    await game.locator('#bird-double').click();
    await game.waitForFunction(() => BulkUnified.screen === 'double');
    assert(await game.locator('[data-double-action="net-create"]').isDisabled());
    assert(await game.locator('[data-double-action="net-join"]').isDisabled());
    assert.equal(await game.evaluate(() => BulkUnified.double.online.socket), null);
    await game.locator('#double-sudoku').click();
    await game.waitForFunction(() => BulkUnified.screen === 'sudoku');
    assert.equal(await game.locator('[data-sudoku-cell]').count(), 81);
    await game.locator('#unified-back').click();
    assert.equal(await game.evaluate(() => BulkUnified.screen), 'double');
    await game.locator('#unified-back').click();
    assert.equal(await game.evaluate(() => BulkUnified.screen), 'bird');
    await game.locator('#unified-back').click();
    await campaign
      .getByRole('button', { name: 'Rekreacja: Gwintforce / wojna rekordów', exact: true })
      .click();
    await game.waitForFunction(() => BulkUnified.screen === 'cards');
    assert.equal(await game.locator('[data-rival]').count(), 3);
    await game.locator('#unified-back').click();
    await game.locator('#unified-back').click();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('bulk-import-omega-3d-v10')),
    );
    assert.equal(saved.progress.version, 10);
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('bulk-import-bird-game-3-v1')).selected,
      ),
      'opium',
    );
    // The in-game brand returns to the public wrapper, preserving static mode and origin.
    await game.locator('header .brand').click();
    await page.waitForURL(url);
    game = await gameFrame();
    assert(await game.evaluate(() => BulkUnified.local));
    await game.locator('#play-campaign').click();
    await game.waitForFunction(
      () => document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign,
    );
    const restored = await (await game.locator('#campaign-frame').elementHandle()).contentFrame();
    await restored.getByRole('button', { name: '▶ KONTYNUUJ KAMPANIĘ', exact: true }).click();
    await restored.waitForFunction(() => active && mode === 'hub');
    assert.equal(await restored.evaluate(() => progress.credits), saved.progress.credits);
    assert.deepEqual(await restored.evaluate(() => progress.completed), saved.progress.completed);
    assert.equal(sockets.length, 0, 'Static play never attempts WebSockets');
    assert(requests.length >= 2);
    assert(
      requests.every((request) => request === url),
      'Only the public index is requested; all game assets stay embedded',
    );
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      'PASS GitHub Pages: one static file under /Bulk-Import/, no backend or WebSockets, original HTML download, campaign/physical terminal/all minigames, mobile, brand navigation and saved progress across reload.',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(output, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
