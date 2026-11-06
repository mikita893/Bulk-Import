'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BulkVoice = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'bulk-import-dubbing-v1';
  const SPEAKERS = {
    hero: 'Komandor Admin',
    vael: 'Vael',
    syra: 'Syra',
    excel: 'Excel',
    reaper: 'Zwiastun',
    marc: 'Marc · hologram',
    ship: 'Komputer statku',
  };
  class Player {
    constructor({
      pack = [],
      storage,
      soundEnabled = () => true,
      onState = () => {},
      createAudio = () => new Audio(),
      makeURL,
      releaseURL,
      now = () => performance.now(),
    } = {}) {
      this.storage = storage;
      this.soundEnabled = soundEnabled;
      this.onState = onState;
      this.now = now;
      this.clips = new Map(pack.map((c) => [c.speaker + '\n' + c.text.trim(), c]));
      this.cache = new Map();
      this.queue = [];
      this.cooldowns = new Map();
      this.current = this.last = null;
      this.epoch = 0;
      this.disposed = false;
      this.status = 'idle';
      this.paused = false;
      this.settings = { enabled: true, volume: 0.8 };
      try {
        const s = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
        if (
          s &&
          typeof s.enabled === 'boolean' &&
          Number.isFinite(s.volume) &&
          s.volume >= 0 &&
          s.volume <= 1
        )
          this.settings = { enabled: s.enabled, volume: s.volume };
      } catch (e) {}
      this.audio = createAudio();
      this.audio.preload = 'none';
      this.audio.volume = this.settings.volume;
      this.makeURL =
        makeURL ||
        ((clip) => {
          const raw = atob(clip.data),
            bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
        });
      this.releaseURL = releaseURL || ((url) => URL.revokeObjectURL(url));
      this.audio.onended = () => {
        this.current = null;
        this.status = 'ended';
        this.emit();
        this.drain();
      };
      this.audio.onerror = () => {
        this.current = null;
        this.queue = [];
        this.status = 'error';
        this.emit();
      };
    }
    emit() {
      const c = this.current || this.last;
      this.onState({
        status: this.status,
        clip: c
          ? {
              id: c.clip.id,
              speaker: c.clip.speaker,
              text: c.clip.text,
              duration: c.clip.duration,
              kind: c.kind,
            }
          : null,
        enabled: this.settings.enabled,
        volume: this.settings.volume,
      });
    }
    allowed() {
      return (
        !this.disposed && this.settings.enabled && this.settings.volume > 0 && this.soundEnabled()
      );
    }
    persist() {
      try {
        this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (e) {}
      this.emit();
    }
    setEnabled(value) {
      this.settings.enabled = !!value;
      if (!value) this.stop();
      this.persist();
    }
    setVolume(value) {
      if (!Number.isFinite(value)) return;
      this.settings.volume = Math.max(0, Math.min(1, value));
      this.audio.volume = this.settings.volume;
      if (!this.settings.volume) this.stop();
      this.persist();
    }
    play(speaker, text, { kind = 'event', priority = 0, cooldown = 0 } = {}) {
      if (!this.allowed()) return false;
      const clip = this.clips.get(speaker + '\n' + text.trim());
      if (!clip) return false;
      const now = this.now();
      if (cooldown && now < (this.cooldowns.get(clip.id) || 0)) return false;
      const item = {
        clip,
        kind,
        priority,
        expires: now + (kind === 'dialogueTail' ? 60000 : 6000),
      };
      if (this.current) {
        if (kind === 'dialogue' || kind === 'sample' || priority > this.current.priority) {
          this.stop(false);
        } else {
          if (
            this.current.clip.id === clip.id ||
            this.queue.some((x) => x.clip.id === clip.id) ||
            this.queue.length >= 2
          )
            return false;
          this.queue.push(item);
          if (cooldown) this.cooldowns.set(clip.id, now + cooldown * 1000);
          return true;
        }
      }
      if (cooldown) this.cooldowns.set(clip.id, now + cooldown * 1000);
      this.start(item);
      return true;
    }
    start(item) {
      if (!this.allowed()) return;
      this.audio.pause();
      this.paused = false;
      let url = this.cache.get(item.clip.id);
      if (url) this.cache.delete(item.clip.id);
      else url = this.makeURL(item.clip);
      this.cache.set(item.clip.id, url);
      while (this.cache.size > 6) {
        const [id, old] = this.cache.entries().next().value;
        this.cache.delete(id);
        this.releaseURL(old);
      }
      this.audio.src = url;
      this.current = this.last = item;
      this.status = 'playing';
      const epoch = ++this.epoch;
      this.emit();
      try {
        Promise.resolve(this.audio.play()).catch((error) => {
          if (epoch !== this.epoch || this.disposed) return;
          this.status = error.name === 'NotAllowedError' ? 'blocked' : 'error';
          this.current = null;
          this.queue = [];
          this.emit();
        });
      } catch (error) {
        this.current = null;
        this.status = 'error';
        this.emit();
      }
    }
    drain() {
      if (this.paused || !this.allowed()) return;
      const now = this.now();
      while (this.queue.length) {
        const next = this.queue.shift();
        if (next.expires >= now) {
          this.start(next);
          break;
        }
      }
    }
    stop(forget = true) {
      ++this.epoch;
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.current = null;
      this.queue = [];
      this.paused = false;
      this.status = 'idle';
      if (forget) this.last = null;
      this.emit();
    }
    skip() {
      ++this.epoch;
      this.audio.pause();
      this.current = null;
      this.paused = false;
      this.status = 'ended';
      this.emit();
      this.drain();
    }
    replay() {
      if (!this.last || !this.allowed()) return false;
      const item = { ...this.last };
      this.stop(false);
      this.start(item);
      return true;
    }
    pause() {
      if (!this.current || this.paused) return;
      ++this.epoch;
      this.audio.pause();
      this.paused = true;
      this.status = 'paused';
      this.emit();
    }
    resume() {
      if (!this.paused || !this.current || !this.allowed()) return;
      this.paused = false;
      this.status = 'playing';
      const epoch = ++this.epoch;
      this.emit();
      Promise.resolve(this.audio.play()).catch(() => {
        if (epoch === this.epoch) {
          this.current = null;
          this.status = 'blocked';
          this.emit();
        }
      });
    }
    destroy() {
      if (this.disposed) return;
      this.stop();
      this.disposed = true;
      this.audio.onended = this.audio.onerror = null;
      for (const url of this.cache.values()) this.releaseURL(url);
      this.cache.clear();
    }
  }
  return { Player, STORAGE_KEY, SPEAKERS };
});
