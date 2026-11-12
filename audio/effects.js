'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BulkEffects = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  class Effects {
    constructor({
      enabled = () => true,
      duck = () => false,
      contextFactory = () => new (window.AudioContext || window.webkitAudioContext)(),
    } = {}) {
      this.enabled = enabled;
      this.duck = duck;
      this.contextFactory = contextFactory;
      this.context = null;
      this.active = new Set();
      this.counts = {};
      this.dead = false;
    }
    ready() {
      if (this.dead || !this.enabled() || this.active.size >= 32) return false;
      try {
        this.context ??= this.contextFactory();
        this.context.resume().catch(() => {});
        return true;
      } catch (e) {
        return false;
      }
    }
    node(source, frequency, volume, duration, delay = 0, endFrequency) {
      if (!this.ready()) return;
      const c = this.context,
        t = c.currentTime + delay,
        g = c.createGain(),
        o = source === 'noise' ? c.createBufferSource() : c.createOscillator();
      if (source === 'noise') {
        if (!this.noise) {
          this.noise = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
          const data = this.noise.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        o.buffer = this.noise;
      } else {
        o.type = source;
        o.frequency.setValueAtTime(frequency, t);
        if (endFrequency) o.frequency.exponentialRampToValueAtTime(endFrequency, t + duration);
      }
      g.gain.setValueAtTime(volume * (this.duck() ? 0.25 : 1), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      o.connect(g).connect(c.destination);
      this.active.add(o);
      o.onended = () => {
        this.active.delete(o);
        o.disconnect();
        g.disconnect();
      };
      o.start(t);
      o.stop(t + duration);
    }
    play(name) {
      if (!this.ready()) return false;
      this.counts[name] = (this.counts[name] || 0) + 1;
      if (name === 'shot') {
        this.node('noise', 0, 0.035, 0.065);
        this.node('triangle', 190, 0.085, 0.1, 0, 40);
        this.node('sine', 1600, 0.018, 0.075, 0.025, 750);
      } else if (name === 'slash') {
        this.node('noise', 0, 0.028, 0.13);
        this.node('triangle', 620, 0.025, 0.12, 0, 120);
      } else if (name === 'greatsword') {
        this.node('noise', 0, 0.05, 0.2);
        this.node('triangle', 140, 0.07, 0.23, 0, 35);
      } else if (name === 'parry') {
        this.node('triangle', 1700, 0.055, 0.22, 0, 650);
        this.node('sine', 2400, 0.035, 0.27, 0.03, 900);
        this.node('noise', 0, 0.025, 0.06);
      } else if (name === 'critical') {
        this.node('noise', 0, 0.065, 0.18);
        this.node('triangle', 180, 0.085, 0.28, 0, 35);
        this.node('sine', 650, 0.03, 0.24, 0.1, 160);
      } else if (name === 'door') {
        this.node('noise', 0, 0.025, 0.08);
        this.node('triangle', 150, 0.045, 0.1, 0, 50);
      } else if (name === 'rotor') {
        this.node('sawtooth', 85, 0.022, 0.35, 0, 65);
        this.node('noise', 0, 0.012, 0.22);
      } else if (name === 'payload') {
        this.node('triangle', 780, 0.025, 0.2, 0, 140);
        this.node('noise', 0, 0.025, 0.15);
      } else if (name === 'horn') {
        this.node('sawtooth', 220, 0.018, 0.25);
        this.node('sawtooth', 277, 0.015, 0.25);
      } else if (name === 'siren') {
        this.node('triangle', 600, 0.018, 0.32, 0, 1050);
        this.node('triangle', 1050, 0.018, 0.32, 0.32, 600);
      } else if (name === 'alert') {
        this.node('square', 880, 0.012, 0.07);
        this.node('sine', 1320, 0.018, 0.09, 0.13);
      } else if (name === 'enemyShot') {
        this.node('sawtooth', 360, 0.02, 0.09, 0, 90);
        this.node('noise', 0, 0.015, 0.06);
      } else if (name === 'upgrade') {
        [520, 780, 1040, 1560].forEach((f, i) => this.node('sine', f, 0.05, 0.17, i * 0.075));
        this.node('noise', 0, 0.013, 0.18);
      } else if (name === 'click') {
        this.node('sine', 850, 0.025, 0.025, 0, 450);
      } else if (name === 'hit') {
        this.node('noise', 0, 0.055, 0.13);
        this.node('triangle', 100, 0.08, 0.16, 0, 30);
      } else if (name === 'shield') {
        this.node('sine', 1100, 0.04, 0.16, 0, 180);
        this.node('triangle', 220, 0.025, 0.18);
      } else if (name === 'kill') {
        this.node('noise', 0, 0.035, 0.14);
        this.node('sine', 650, 0.035, 0.1, 0, 130);
      } else if (name === 'dash') {
        this.node('noise', 0, 0.025, 0.17);
        this.node('sine', 240, 0.03, 0.16, 0, 1200);
      } else if (name === 'heal' || name === 'powerup') {
        [440, 660, 880].forEach((f, i) => this.node('sine', f, 0.04, 0.19, i * 0.055));
      } else if (name === 'coin') {
        this.node('sine', 1350, 0.025, 0.075);
        this.node('sine', 1800, 0.02, 0.1, 0.03);
      } else if (name === 'jump') {
        this.node('triangle', 230, 0.025, 0.1, 0, 570);
      } else if (name === 'slide') {
        this.node('noise', 0, 0.023, 0.2);
      }
      return true;
    }
    stop() {
      for (const node of this.active) {
        try {
          node.stop();
        } catch (e) {}
      }
      this.active.clear();
    }
    destroy() {
      if (this.dead) return;
      this.stop();
      this.dead = true;
      this.context?.close();
      this.noise = null;
    }
  }
  return { Effects };
});
