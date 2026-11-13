const { chromium } = require('playwright'),
  fs = require('fs'),
  assert = require('assert/strict');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    let p = await b.newPage();
    await p.setContent('<div id="host"></div>');
    await p.addScriptTag({ content: fs.readFileSync('minigames/obscure-game.js', 'utf8') });
    await p.evaluate(() => {
      window.store = new Map();
      window.g = new BulkObscureGame(
        document.querySelector('#host'),
        { getItem: (k) => store.get(k), setItem: (k, v) => store.set(k, v) },
        () => {},
        { play() {}, stop() {} },
      );
      cancelAnimationFrame(g.raf);
    });
    assert(
      await p.evaluate(() => {
        g.action('attack');
        g.tick(0.8);
        g.action('parry');
        g.tick(0.4);
        return g.hp === 150 && g.ap === 6;
      }),
    );
    assert(
      await p.evaluate(() => {
        g.action('attack');
        g.action('pause');
        const t = g.time;
        g.tick(2);
        g.action('pause');
        return t === g.time;
      }),
    );
    await p.evaluate(() => {
      g.tick(2);
      for (let n = 0; n < 100 && g.phase !== 'won'; n++) {
        if (g.phase === 'clear') g.action('next');
        if (g.phase === 'player') g.action(g.ap >= 3 ? 'skill' : 'attack');
        if (g.phase === 'enemy') {
          g.tick(0.8);
          g.action('parry');
          g.tick(0.4);
        }
      }
    });
    assert.equal(await p.evaluate(() => g.stage), 3);
    assert.equal(await p.evaluate(() => JSON.parse(store.get('bulk-import-cellule-v1')).stage), 3);
    await p.screenshot({ path: '/tmp/cellule-v29.png' });
    await p.evaluate(() => g.destroy());
    await p.close();
    p = await b.newPage();
    await p.setContent(fs.readFileSync(require('../release.cjs').filename, 'utf8'));
    await p.evaluate(() => {
      const h = document.createElement('div');
      h.style.cssText = 'position:fixed;inset:0;z-index:999';
      document.body.append(h);
      window.parentGame = new BulkColonyGame(h, {
        storage: { getItem: () => null, setItem() {} },
        soundEnabled: () => false,
      });
      parentGame.game.progress.wins = 1;
      parentGame.game.state = 'victory';
      parentGame.cover();
    });
    await p.locator('[data-col-action="obscure"]').click();
    assert(await p.evaluate(() => !!parentGame.obscure));
    await p.screenshot({ path: '/tmp/cellule-v29-integrated.png' });
    await p.locator('[data-ob="exit"]').click();
    assert(await p.evaluate(() => !parentGame.obscure && parentGame.game.state === 'victory'));
    await p.evaluate(() => parentGame.destroy());
    console.log('PASS parry, pause, all encounters, victory, checkpoint and cleanup');
  } finally {
    await b.close();
  }
})();
