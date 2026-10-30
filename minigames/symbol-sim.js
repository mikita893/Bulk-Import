'use strict';
(() => {
  const D = typeof module !== 'undefined' ? require('./symbol-deck.js') : window.BulkDoubleDeck;
  const DIFFICULTIES = Object.freeze({
    gentle: { name: 'Bardzo łatwy', min: 6000, max: 10000 },
    easy: { name: 'Łatwy', min: 4000, max: 6000 },
    normal: { name: 'Normalny', min: 2500, max: 4000 },
    hard: { name: 'Trudny', min: 1500, max: 2500 },
    expert: { name: 'Ekspert', min: 800, max: 1500 },
  });
  const BOT_NAMES = ['CacheThief', 'Pani Pivot', 'Lord VLOOKUP'];
  const STATES = Object.freeze([
    'MENU',
    'COUNTDOWN',
    'PLAYING',
    'ROUND_TRANSITION',
    'PAUSED',
    'GAME_OVER',
  ]);
  function normalizeDoubleSettings(raw = {}) {
    const input = raw && typeof raw === 'object' ? raw : {};
    const difficulty = Object.hasOwn(DIFFICULTIES, input.difficulty) ? input.difficulty : 'normal';
    const ranges = {};
    for (const [id, base] of Object.entries(DIFFICULTIES)) {
      const v = input.ranges?.[id];
      ranges[id] =
        v &&
        Number.isFinite(v.min) &&
        Number.isFinite(v.max) &&
        v.min >= 200 &&
        v.max <= 60000 &&
        v.max >= v.min
          ? { min: v.min, max: v.max }
          : { min: base.min, max: base.max };
    }
    return {
      bots: [1, 2, 3].includes(input.bots) ? input.bots : 1,
      difficulty,
      cooldown: [1000, 1500, 2000].includes(input.cooldown) ? input.cooldown : 1500,
      sound: input.sound !== false,
      training: input.training === true,
      ranges,
    };
  }
  function doubleRandom(model) {
    model.seed = (Math.imul(model.seed, 1664525) + 1013904223) >>> 0;
    return model.seed / 4294967296;
  }
  function doubleShuffle(model, list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(doubleRandom(model) * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function scheduleDoubleBots(model) {
    const range = model.settings.ranges[model.settings.difficulty];
    // Triangular bounded variation: independent samples, no synchronized fixed cadence.
    return model.participants
      .slice(1)
      .map((bot, index) => ({
        participant: index + 1,
        session: model.session,
        roundId: model.roundId,
        at:
          model.time +
          range.min +
          ((range.max - range.min) * (doubleRandom(model) + doubleRandom(model))) / 2,
      }))
      .sort((a, b) => a.at - b.at || a.participant - b.participant);
  }
  function rankDoubleMatch(model) {
    return model.participants
      .map((p, index) => ({
        ...p,
        index,
        rank: 1 + model.participants.filter((other) => other.score > p.score).length,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
  }
  class DoubleMatch {
    constructor(settings = {}, seed = 1) {
      this.settings = normalizeDoubleSettings(settings);
      this.seed = seed >>> 0 || 1;
      this.session = 0;
      this.roundId = 0;
      this.revision = 0;
      this.state = 'MENU';
      this.time = 0;
      this.wallAt = 0;
      this.participants = [];
      this.pile = [];
      this.botEvents = [];
      this.center = null;
      this.lastAward = null;
      this.correct = 0;
      this.wrong = 0;
      this.latencies = [];
      this.lockedUntil = 0;
      this.lastAttempt = -Infinity;
      this.feedback = null;
      this.history = [];
      this.total = 0;
    }
    start(now = 0, settings = this.settings) {
      if (!Number.isFinite(now) || now < 0) return false;
      this.settings = normalizeDoubleSettings(settings);
      this.session++;
      this.roundId++;
      this.time = 0;
      this.wallAt = now;
      this.correct = 0;
      this.wrong = 0;
      this.latencies = [];
      this.lockedUntil = 0;
      this.lastAttempt = -Infinity;
      this.feedback = null;
      this.lastAward = null;
      this.history = [];
      this.botEvents = [];
      this.pausedFrom = null;
      const deck = doubleShuffle(this, D.DOUBLE_DECK),
        count = this.settings.training ? 0 : this.settings.bots;
      this.participants = [
        { name: 'TY', avatar: '🪶', score: 0, card: deck.shift() },
        ...Array.from({ length: count }, (_, i) => ({
          name: BOT_NAMES[i],
          avatar: ['🐦', '🤖', '🦉'][i],
          score: 0,
          card: deck.shift(),
        })),
      ];
      this.pile = deck;
      this.total = deck.length;
      this.center = null;
      this.state = 'COUNTDOWN';
      this.deadline = 3000;
      this.revision++;
      return true;
    }
    token() {
      return { session: this.session, roundId: this.roundId };
    }
    validToken(token) {
      return token?.session === this.session && token?.roundId === this.roundId;
    }
    projectedTime(now) {
      if (['MENU', 'PAUSED', 'GAME_OVER'].includes(this.state)) return this.time;
      return this.time + Math.max(0, Number.isFinite(now) ? now - this.wallAt : 0);
    }
    nextDeadline() {
      if (this.state === 'COUNTDOWN' || this.state === 'ROUND_TRANSITION') return this.deadline;
      if (this.state === 'PLAYING')
        return Math.min(
          this.botEvents[0]?.at ?? Infinity,
          this.lockedUntil > this.time ? this.lockedUntil : Infinity,
        );
      return Infinity;
    }
    beginRound() {
      if (!this.pile.length) {
        this.state = 'GAME_OVER';
        this.center = null;
        this.botEvents = [];
        this.revision++;
        return;
      }
      this.roundId++;
      this.center = this.pile[0];
      this.roundStarted = this.time;
      this.state = 'PLAYING';
      this.feedback = null;
      this.botEvents = scheduleDoubleBots(this);
      this.revision++;
    }
    advance(now) {
      if (!Number.isFinite(now) || now < this.wallAt) return false;
      const target = this.projectedTime(now);
      this.wallAt = now;
      if (['MENU', 'PAUSED', 'GAME_OVER'].includes(this.state)) return true;
      // Resolve all dated events in chronological order, regardless of rendering frequency.
      // At an exact player/bot tie the already-due bot event is resolved first.
      for (let guard = 0; guard < 100; guard++) {
        const next = this.nextDeadline();
        if (next > target) break;
        this.time = next;
        if (this.state === 'COUNTDOWN' || this.state === 'ROUND_TRANSITION') this.beginRound();
        else if (this.state === 'PLAYING') {
          const event = this.botEvents[0];
          if (event && event.at <= this.time) {
            this.botEvents.shift();
            this.resolveBot(event);
          } else this.revision++;
        }
        if (this.state === 'GAME_OVER') break;
      }
      if (this.state !== 'GAME_OVER') this.time = target;
      return true;
    }
    resolveBot(event) {
      if (
        this.state !== 'PLAYING' ||
        !this.validToken(event) ||
        event.at > this.time ||
        !this.participants[event.participant] ||
        event.participant === 0
      )
        return false;
      return this.award(event.participant, event);
    }
    award(participant, token) {
      if (
        this.state !== 'PLAYING' ||
        !this.validToken(token) ||
        !this.center ||
        !Number.isInteger(participant) ||
        !this.participants[participant]
      )
        return false;
      const winner = this.participants[participant],
        card = this.center,
        symbol = D.commonDoubleSymbol(winner.card, card);
      if (symbol === undefined) return false;
      winner.card = card;
      winner.score++;
      this.pile.shift();
      this.lastAward = { participant, card, symbol, roundId: this.roundId, at: this.time };
      this.history.push({ card: card.id, participant, roundId: this.roundId });
      this.center = null;
      this.botEvents = [];
      this.state = 'ROUND_TRANSITION';
      this.deadline = this.time + 360;
      this.revision++;
      return true;
    }
    answer(symbol, token, now) {
      if (!Number.isFinite(now) || now < this.wallAt) return 'ignored';
      this.advance(now);
      if (
        this.state !== 'PLAYING' ||
        !this.validToken(token) ||
        this.time < this.lockedUntil ||
        this.time - this.lastAttempt < 160 ||
        !Number.isInteger(symbol) ||
        !this.participants[0].card.symbols.includes(symbol)
      )
        return 'ignored';
      this.lastAttempt = this.time;
      if (!this.center.symbols.includes(symbol)) {
        this.wrong++;
        this.lockedUntil = this.time + this.settings.cooldown;
        this.feedback = { type: 'wrong', symbol, at: this.time };
        this.revision++;
        return 'wrong';
      }
      this.correct++;
      this.latencies.push(this.time - this.roundStarted);
      this.award(0, token);
      return 'correct';
    }
    pause(now) {
      if (!this.advance(now)) return false;
      if (!['COUNTDOWN', 'PLAYING', 'ROUND_TRANSITION'].includes(this.state)) return false;
      this.pausedFrom = this.state;
      this.state = 'PAUSED';
      this.revision++;
      return true;
    }
    resume(now) {
      if (this.state !== 'PAUSED' || !Number.isFinite(now) || now < this.wallAt) return false;
      this.wallAt = now;
      this.state = this.pausedFrom;
      this.pausedFrom = null;
      this.revision++;
      return true;
    }
    results() {
      const ranking = rankDoubleMatch(this),
        top = ranking[0]?.score ?? 0,
        winners = ranking.filter((p) => p.score === top),
        player = this.participants[0];
      return {
        ranking,
        correct: this.correct,
        wrong: this.wrong,
        percent: this.total ? (100 * (player?.score || 0)) / this.total : 0,
        average: this.latencies.length
          ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
          : null,
        outcome: this.settings.training
          ? 'training'
          : player?.score === top
            ? winners.length > 1
              ? 'draw'
              : 'win'
            : 'loss',
      };
    }
  }
  const api = Object.freeze({
    DoubleMatch,
    DIFFICULTIES,
    STATES,
    normalizeDoubleSettings,
    scheduleDoubleBots,
    rankDoubleMatch,
  });
  if (typeof window !== 'undefined') window.BulkDouble = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
