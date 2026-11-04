'use strict';
const { DoubleMatch } = require('../minigames/symbol-sim.js');

// Reuse the exact deck, countdown, transition and awarding rules of the local game.
// Each human has a separate penalty ledger; no client supplies scores or clocks.
class DoubleOnlineMatch extends DoubleMatch {
  constructor(players, cooldown, seed, session) {
    super({ bots: players.length - 1, cooldown }, seed);
    this.roster = players;
    this.session = session - 1;
  }
  start(now) {
    super.start(now, this.settings);
    this.participants.forEach((p, i) =>
      Object.assign(p, {
        id: this.roster[i].id,
        name: this.roster[i].name,
        avatar: ['🪶', '🐦', '🦉', '🦜'][i],
        correct: 0,
        wrong: 0,
        latencies: [],
        lockedUntil: 0,
        lastAttempt: -Infinity,
        feedback: null,
      }),
    );
    return true;
  }
  beginRound() {
    super.beginRound();
    this.botEvents = [];
  }
  answerPlayer(id, symbol, token, now) {
    if (!this.advance(now)) return 'ignored';
    const index = this.participants.findIndex((p) => p.id === id),
      p = this.participants[index];
    if (
      !p ||
      this.state !== 'PLAYING' ||
      !this.validToken(token) ||
      this.time < p.lockedUntil ||
      this.time - p.lastAttempt < 160 ||
      !Number.isInteger(symbol) ||
      !p.card.symbols.includes(symbol)
    )
      return 'ignored';
    p.lastAttempt = this.time;
    if (!this.center.symbols.includes(symbol)) {
      p.wrong++;
      p.lockedUntil = this.time + this.settings.cooldown;
      p.feedback = { type: 'wrong', symbol, at: this.time };
      this.revision++;
      return 'wrong';
    }
    p.correct++;
    p.latencies.push(this.time - this.roundStarted);
    p.feedback = null;
    this.award(index, token);
    return 'correct';
  }
  finish(reason) {
    this.advance(this.wallAt);
    this.state = 'GAME_OVER';
    this.center = null;
    this.botEvents = [];
    this.reason = reason;
    this.revision++;
  }
  view(id) {
    const mine = this.participants.findIndex((p) => p.id === id);
    if (mine < 0) return null;
    const order = [mine, ...this.participants.map((_, i) => i).filter((i) => i !== mine)];
    const self = this.participants[mine],
      top = Math.max(...this.participants.map((p) => p.score));
    // Never serialize the model, its seed, the future pile, or another player's hand.
    const participants = order.map((i) => {
      const p = this.participants[i];
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        ...(i === mine ? { card: p.card } : {}),
      };
    });
    const ranking = participants
      .map((p, index) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        index,
        rank: 1 + participants.filter((other) => other.score > p.score).length,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    return {
      session: this.session,
      roundId: this.roundId,
      revision: this.revision,
      state: this.state,
      time: this.time,
      deadline: this.deadline,
      roundStarted: this.roundStarted,
      total: this.total,
      remaining: this.pile.length,
      participants,
      center: this.center,
      lastAward: this.lastAward
        ? { ...this.lastAward, participant: order.indexOf(this.lastAward.participant) }
        : null,
      lockedUntil: self.lockedUntil,
      feedback: self.feedback,
      settings: { cooldown: this.settings.cooldown },
      reason: this.reason || null,
      result: {
        ranking,
        correct: self.correct,
        wrong: self.wrong,
        percent: this.total ? (100 * self.score) / this.total : 0,
        average: self.latencies.length
          ? self.latencies.reduce((a, b) => a + b, 0) / self.latencies.length
          : null,
        outcome: this.reason
          ? 'aborted'
          : self.score === top
            ? participants.filter((p) => p.score === top).length > 1
              ? 'draw'
              : 'win'
            : 'loss',
      },
    };
  }
}
module.exports = { DoubleOnlineMatch };
