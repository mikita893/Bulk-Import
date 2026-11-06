'use strict';
const { test } = require('node:test'),
  assert = require('node:assert/strict');
const { Player, STORAGE_KEY } = require('../voice/player.js');
const { catalogue } = require('../voice/catalog.cjs');
function fixture() {
  let clock = 0;
  const values = new Map(),
    urls = [],
    revoked = [];
  const audio = {
    src: '',
    volume: 1,
    paused: true,
    playCount: 0,
    pause() {
      this.paused = true;
    },
    load() {},
    removeAttribute() {
      this.src = '';
    },
    play() {
      this.paused = false;
      this.playCount++;
      return Promise.resolve();
    },
  };
  const pack = catalogue().map((c) => ({ ...c, duration: 2, data: 'fake-test-recording' }));
  const options = {
    pack,
    storage: { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) },
    createAudio: () => audio,
    makeURL: (c) => {
      urls.push(c.id);
      return 'blob:' + c.id;
    },
    releaseURL: (u) => revoked.push(u),
    now: () => clock,
  };
  const player = new Player(options);
  return { player, audio, pack, values, options, urls, revoked, advance: (n) => (clock += n) };
}
test('recording catalogue covers every dialogue and ships verified playable-sized MP3 assets', () => {
  const pack = require('../voice/build.cjs')(),
    rows = catalogue();
  assert.equal(pack.length, rows.length);
  assert(pack.length >= 290);
  assert.equal(new Set(pack.map((c) => c.id)).size, pack.length);
  assert.equal(new Set(pack.map((c) => c.speaker)).size, 7);
  for (const c of pack) {
    assert(c.duration > 0.3 && c.duration < 40);
    assert(Buffer.from(c.data, 'base64').length > 2000);
    assert.match(c.id, /^[a-z]+-[a-f0-9]{16}$/);
  }
});
test('one voice channel replaces a dialogue immediately and prioritizes urgent Marc support', () => {
  const { player: p, audio } = fixture();
  const [a, b] = catalogue();
  p.play(a.speaker, a.text, { kind: 'dialogue', priority: 4 });
  p.play(b.speaker, b.text, { kind: 'dialogue', priority: 4 });
  assert.equal(p.current.clip.id, b.id);
  assert.equal(p.queue.length, 0);
  assert.equal(audio.playCount, 2);
  p.play(a.speaker, a.text, { kind: 'sample', priority: 4 });
  assert.equal(p.current.clip.id, a.id);
  assert.equal(p.queue.length, 0);
  p.stop();
  const excel = catalogue().find((c) => c.speaker === 'excel'),
    marc = catalogue().find((c) => c.speaker === 'marc');
  p.play('excel', excel.text, { priority: 1 });
  p.play('marc', marc.text, { priority: 3 });
  assert.equal(p.current.clip.speaker, 'marc');
  assert.equal(p.queue.length, 0);
});
test('events deduplicate, honor cooldowns, bound the queue and discard expired warnings', () => {
  const { player: p, audio, pack, advance } = fixture();
  const rows = pack.filter((c) => c.speaker === 'excel');
  const say = (i) => p.play('excel', rows[i].text, { cooldown: 20 });
  assert(say(0));
  assert(!say(0));
  assert(say(1));
  assert(say(2));
  assert(!say(3));
  assert.equal(p.queue.length, 2);
  advance(7000);
  audio.onended();
  assert.equal(p.current, null);
  assert.equal(p.queue.length, 0);
  assert(!say(0));
  advance(14000);
  assert(say(0));
});
test('settings persist separately, global mute blocks speech and inaccessible storage is optional', () => {
  const { player: p, pack, options, values } = fixture();
  const c = pack[0];
  p.setVolume(0.35);
  p.setEnabled(false);
  assert(!p.play(c.speaker, c.text));
  assert.equal(p.current, null);
  assert(values.has(STORAGE_KEY));
  const next = new Player(options);
  assert.deepEqual(next.settings, { enabled: false, volume: 0.35 });
  next.setEnabled(true);
  next.soundEnabled = () => false;
  assert(!next.play(c.speaker, c.text));
  next.setVolume(0);
  assert(!next.play(c.speaker, c.text));
  const broken = new Player({
    ...options,
    storage: {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    },
  });
  broken.setEnabled(false);
  assert.equal(broken.settings.enabled, false);
});
test('pause/resume, skip and replay keep one bounded audio element; teardown revokes all URLs', () => {
  const { player: p, audio, pack, urls, revoked } = fixture();
  const c = pack[0];
  p.play(c.speaker, c.text);
  p.pause();
  assert(audio.paused);
  assert.equal(p.status, 'paused');
  p.resume();
  assert(!audio.paused);
  p.skip();
  assert.equal(p.current, null);
  assert(p.replay());
  for (const c of pack.slice(0, 10)) p.play(c.speaker, c.text, { kind: 'dialogue' });
  assert.equal(p.cache.size, 6);
  assert(revoked.length >= 4);
  p.destroy();
  assert.equal(p.cache.size, 0);
  assert.equal(urls.length, revoked.length);
  assert(!p.play(c.speaker, c.text));
});
test('autoplay rejection remains retryable and late rejected plays cannot clear a newer voice', async () => {
  const { player: p, audio, pack } = fixture(),
    c = pack[0];
  audio.play = () => Promise.reject(Object.assign(Error(), { name: 'NotAllowedError' }));
  p.play(c.speaker, c.text);
  await new Promise((r) => setImmediate(r));
  assert.equal(p.status, 'blocked');
  assert.equal(p.current, null);
  assert(p.last);
  audio.play = () => Promise.resolve();
  assert(p.replay());
  let reject;
  audio.play = () => new Promise((_, r) => (reject = r));
  p.play(pack[1].speaker, pack[1].text, { kind: 'dialogue' });
  audio.play = () => Promise.resolve();
  p.play(pack[2].speaker, pack[2].text, { kind: 'dialogue' });
  reject(Error('old'));
  await new Promise((r) => setImmediate(r));
  assert.equal(p.current.clip.id, pack[2].id);
});
