'use strict';
const test = require('node:test'),
  assert = require('node:assert/strict');
const D = require('../minigames/symbol-deck.js'),
  R = require('../minigames/symbol-sim.js');
function begun(settings = {}, seed = 1) {
  const g = new R.DoubleMatch(settings, seed);
  g.start(0);
  g.advance(3000);
  assert.equal(g.state, 'PLAYING');
  return g;
}
function match(g) {
  return D.commonDoubleSymbol(g.participants[0].card, g.center);
}
function wrong(g) {
  return g.participants[0].card.symbols.find((id) => !g.center.symbols.includes(id));
}
function at(g, logical) {
  g.advance(g.wallAt + logical - g.time);
}
test('31 seven-symbol cards have exactly one shared symbol in every one of 465 pairs', () => {
  assert.equal(D.validateDoubleDeck(), true);
  assert.equal(D.DOUBLE_SYMBOLS.length, 62);
  assert.equal(new Set(D.DOUBLE_SYMBOLS.map((s) => s.glyph)).size, 62);
  let pairs = 0;
  for (let i = 0; i < 31; i++) {
    const c = D.DOUBLE_DECK[i];
    assert.equal(c.symbols.length, 7);
    assert.equal(new Set(c.symbols).size, 7);
    assert(c.symbols.includes(31 + i));
    for (let j = i + 1; j < 31; j++) {
      assert.equal(c.symbols.filter((id) => D.DOUBLE_DECK[j].symbols.includes(id)).length, 1);
      pairs++;
    }
  }
  assert.equal(pairs, 465);
  assert(!D.validateDoubleDeck(D.DOUBLE_DECK.slice(0, 30)));
  assert.deepEqual(D.generateDoubleDeck(), D.DOUBLE_DECK);
});
test('settings retain five bounded configurable reaction ranges and reject malformed values', () => {
  assert.deepEqual(
    Object.values(R.DIFFICULTIES).map((d) => [d.min, d.max]),
    [
      [6000, 10000],
      [4000, 6000],
      [2500, 4000],
      [1500, 2500],
      [800, 1500],
    ],
  );
  const s = R.normalizeDoubleSettings({
    difficulty: 'toString',
    bots: 99,
    cooldown: 0,
    ranges: { normal: { min: NaN, max: 100 } },
  });
  assert.equal(s.difficulty, 'normal');
  assert.equal(s.bots, 1);
  assert.equal(s.cooldown, 1500);
  assert.deepEqual(s.ranges.normal, { min: 2500, max: 4000 });
  assert.deepEqual(
    R.normalizeDoubleSettings({ ranges: { normal: { min: 200, max: 700 } } }).ranges.normal,
    { min: 200, max: 700 },
  );
  assert.equal(R.normalizeDoubleSettings(null).training, false);
});
test('deal gives each participant a distinct card, leaving the correct number in the pile', () => {
  for (const bots of [1, 2, 3]) {
    const g = begun({ bots });
    assert.equal(g.total, 30 - bots);
    assert.equal(g.participants.length, bots + 1);
    assert.equal(
      new Set([...g.pile, ...g.participants.map((p) => p.card)].map((c) => c.id)).size,
      31,
    );
    for (const p of g.participants)
      assert.notEqual(D.commonDoubleSymbol(p.card, g.center), undefined);
  }
  const training = begun({ training: true, bots: 3 });
  assert.equal(training.participants.length, 1);
  assert.equal(training.total, 30);
  assert.equal(training.botEvents.length, 0);
});
test('player immediately wins one card, replaces only their own card, and stale input cannot score again', () => {
  const g = begun({ bots: 3 }),
    center = g.center,
    others = g.participants.slice(1).map((p) => p.card),
    token = g.token(),
    symbol = match(g);
  assert.equal(g.answer(symbol, token, 3001), 'correct');
  assert.equal(g.participants[0].score, 1);
  assert.equal(g.participants[0].card, center);
  assert.deepEqual(
    g.participants.slice(1).map((p) => p.card),
    others,
  );
  assert.equal(g.pile.length, g.total - 1);
  assert.equal(g.state, 'ROUND_TRANSITION');
  assert.equal(g.answer(symbol, token, 3001), 'ignored');
  at(g, g.deadline);
  assert.equal(g.state, 'PLAYING');
  assert.equal(g.answer(match(g), token, g.wallAt), 'ignored');
  assert.equal(g.history.length, 1);
});
test('bots cannot act early; each draws independent bounded times and replaces only its own card', () => {
  const g = begun({ bots: 3 }, 51),
    events = [...g.botEvents],
    oldCards = g.participants.map((p) => p.card),
    center = g.center;
  assert.equal(new Set(events.map((e) => e.at)).size, 3);
  for (const e of events) assert(e.at >= 5500 && e.at <= 7000);
  at(g, events[0].at - 0.001);
  assert.equal(g.history.length, 0);
  at(g, events[0].at);
  assert.equal(g.history.length, 1);
  assert.equal(g.participants[events[0].participant].card, center);
  for (let i = 0; i < oldCards.length; i++)
    if (i !== events[0].participant) assert.equal(g.participants[i].card, oldCards[i]);
  at(g, g.deadline);
  assert(!g.resolveBot(events[1]));
  assert.equal(g.history.length, 1);
  assert.notDeepEqual(
    g.botEvents.map((e) => e.at - g.roundStarted),
    events.map((e) => e.at - 3000),
  );
});
test('an exact player/bot tie is deterministic and a fractional earlier player answer wins', () => {
  for (const offset of [-0.001, 0, 0.001]) {
    const g = begun(),
      event = g.botEvents[0],
      symbol = match(g);
    const result = g.answer(symbol, g.token(), event.at + offset);
    assert.equal(g.history.length, 1);
    assert.equal(g.participants[0].score, offset < 0 ? 1 : 0);
    assert.equal(result, offset < 0 ? 'correct' : 'ignored');
  }
});
test('rapid multi-button input accepts one wrong attempt and blocks even the correct symbol', () => {
  const g = begun({ bots: 3 }),
    token = g.token(),
    correct = match(g),
    bad = wrong(g),
    when = 3001;
  assert.equal(g.answer(bad, token, when), 'wrong');
  for (const id of g.participants[0].card.symbols)
    assert.equal(g.answer(id, token, when), 'ignored');
  assert.equal(g.answer(correct, token, when + 100), 'ignored');
  assert.equal(g.wrong, 1);
  assert.equal(g.correct, 0);
  assert.equal(g.history.length, 0);
});
test('a mistake immediately before a bot capture stays locked through the next round', () => {
  const g = begun({ difficulty: 'expert' }),
    event = g.botEvents[0];
  assert.equal(g.answer(wrong(g), g.token(), event.at - 1), 'wrong');
  const lock = g.lockedUntil;
  at(g, event.at);
  assert.equal(g.state, 'ROUND_TRANSITION');
  assert.equal(g.lockedUntil, lock);
  at(g, g.deadline);
  assert.equal(g.state, 'PLAYING');
  assert(g.time < lock);
  assert.equal(g.answer(match(g), g.token(), g.wallAt), 'ignored');
  assert.equal(g.lockedUntil, lock);
});
test('the selected penalty expires exactly; rejected spam does not reset it', () => {
  for (const cooldown of [1000, 1500, 2000]) {
    const g = begun({ training: true, cooldown });
    g.answer(wrong(g), g.token(), 3001);
    const lock = g.lockedUntil;
    assert.equal(g.answer(match(g), g.token(), lock - 0.01), 'ignored');
    assert.equal(g.lockedUntil, lock);
    assert.equal(g.answer(match(g), g.token(), lock), 'correct');
    assert.equal(g.correct, 1);
    assert.equal(g.wrong, 1);
  }
});
test('pause freezes countdown and preserves its exact remaining time', () => {
  const g = new R.DoubleMatch();
  g.start(0);
  g.pause(1000);
  g.advance(50000);
  assert.equal(g.time, 1000);
  assert.equal(g.state, 'PAUSED');
  g.resume(100000);
  g.advance(101999);
  assert.equal(g.state, 'COUNTDOWN');
  g.advance(102000);
  assert.equal(g.state, 'PLAYING');
  assert.equal(g.roundStarted, 3000);
});
test('pause freezes bot clocks and a running penalty, with no catch-up after resume', () => {
  const g = begun();
  g.answer(wrong(g), g.token(), 3001);
  const before = g.lockedUntil - g.time,
    event = g.botEvents[0];
  g.pause(3001);
  g.advance(60000);
  assert.equal(g.lockedUntil - g.time, before);
  assert.equal(g.history.length, 0);
  g.resume(100000);
  g.advance(100100);
  assert.equal(g.time, 3101);
  assert.equal(g.history.length, 0);
  at(g, event.at);
  assert.equal(g.history.length, 1);
});
test('pause during card animation preserves the transition deadline', () => {
  const g = begun({ training: true });
  g.answer(match(g), g.token(), 3001);
  g.pause(3101);
  g.advance(99999);
  g.resume(100000);
  g.advance(100259);
  assert.equal(g.state, 'ROUND_TRANSITION');
  g.advance(100260);
  assert.equal(g.state, 'PLAYING');
  assert.equal(g.history.length, 1);
});
test('restart during transition invalidates old rounds and bot reactions', () => {
  const g = begun(),
    oldEvent = { ...g.botEvents[0] },
    oldToken = g.token();
  g.answer(match(g), oldToken, 3001);
  g.start(3100);
  g.advance(6100);
  assert.equal(g.history.length, 0);
  assert(!g.resolveBot(oldEvent));
  assert.equal(g.answer(match(g), oldToken, 6101), 'ignored');
  assert.equal(g.correct, 0);
});
test('the last card is awarded once, then produces final statistics and a frozen result', () => {
  const g = begun({ training: true });
  g.pile = [g.center];
  g.total = 1;
  assert.equal(g.answer(match(g), g.token(), 3500), 'correct');
  assert.equal(g.pile.length, 0);
  at(g, g.deadline);
  assert.equal(g.state, 'GAME_OVER');
  const r = g.results();
  assert.equal(r.percent, 100);
  assert.equal(r.average, 500);
  assert.equal(r.correct, 1);
  assert.equal(r.outcome, 'training');
  const before = JSON.stringify(g.history);
  g.advance(1e6);
  assert.equal(JSON.stringify(g.history), before);
});
test('ranking handles a shared first place as a draw without inventing a winner', () => {
  const g = begun({ bots: 2 });
  g.participants.forEach((p, i) => (p.score = [10, 10, 8][i]));
  const r = g.results();
  assert.equal(r.outcome, 'draw');
  assert.deepEqual(
    r.ranking.map((p) => p.rank),
    [1, 1, 3],
  );
  assert.equal(r.average, null);
});
test('coarse and fine clock updates produce identical bot results independently of rendering', () => {
  const a = begun({ bots: 3 }, 81),
    b = begun({ bots: 3 }, 81);
  a.advance(200000);
  for (let n = 3100; n <= 200000; n += 100) b.advance(n);
  assert.equal(a.state, 'GAME_OVER');
  assert.deepEqual(a.history, b.history);
  assert.deepEqual(
    a.participants.map((p) => p.score),
    b.participants.map((p) => p.score),
  );
});
test('150 seeded competitive games conserve pile points, use distinct cards and always finish', () => {
  for (const difficulty of Object.keys(R.DIFFICULTIES))
    for (let seed = 1; seed <= 30; seed++) {
      const g = begun({ difficulty, bots: 1 + (seed % 3) }, seed);
      let steps = 0;
      while (g.state !== 'GAME_OVER' && steps++ < 100) {
        if (g.state === 'ROUND_TRANSITION') {
          at(g, g.deadline);
          continue;
        }
        if ((seed + steps) % 3 === 0) {
          const now = g.wallAt + (g.botEvents[0].at - g.time) * 0.45;
          g.answer(match(g), g.token(), now);
        } else at(g, g.botEvents[0].at);
        assert.equal(g.participants.reduce((n, p) => n + p.score, 0) + g.pile.length, g.total);
        assert.equal(new Set(g.history.map((h) => h.card)).size, g.history.length);
      }
      assert.equal(g.state, 'GAME_OVER');
      assert.equal(g.history.length, g.total);
      assert.equal(g.results().correct, g.participants[0].score);
    }
});
test('invalid timestamps, symbols and stale tokens never count as accepted attempts', () => {
  const g = begun(),
    token = g.token();
  for (const now of [NaN, Infinity, 2999]) assert.equal(g.answer(match(g), token, now), 'ignored');
  for (const id of [-1, 62, '1', null]) assert.equal(g.answer(id, token, 3001), 'ignored');
  assert.equal(g.wrong, 0);
  assert.equal(g.correct, 0);
  assert(!g.pause(NaN));
});
