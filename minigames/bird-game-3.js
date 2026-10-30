'use strict';
function bulkBirdPortrait(id) {
  const colors = {
      pigeon: ['#94aab3', '#397f76'],
      crow: ['#3d4254', '#252a39'],
      owl: ['#a7835f', '#d5bc86'],
      hummingbird: ['#5ac6a3', '#368f83'],
      duck: ['#5fa780', '#e1d7b3'],
    },
    [body, wing] = colors[id];
  const owl = id === 'owl',
    bill =
      id === 'hummingbird'
        ? 'M61 29l25 0-24 5'
        : id === 'duck'
          ? 'M60 28h17v9H60'
          : 'M61 28l13 5-13 5';
  return (
    '<svg viewBox="0 0 90 65" aria-hidden="true"><path d="M13 43L3 51l7-19" fill="' +
    wing +
    '"/><ellipse cx="36" cy="38" rx="26" ry="17" fill="' +
    body +
    '"/><path d="M16 37q16-23 36 6-22 11-36-6" fill="' +
    wing +
    '"/><circle cx="53" cy="25" r="' +
    (owl ? 17 : 13) +
    '" fill="' +
    body +
    '"/>' +
    (owl
      ? '<path d="M39 15l-2-12 12 8M58 11l13-8-4 16" fill="' +
        wing +
        '"/><circle cx="46" cy="24" r="6" fill="#e4d39d"/><circle cx="59" cy="24" r="6" fill="#e4d39d"/>'
      : '') +
    '<path d="' +
    bill +
    '" fill="#f4bd5e"/><circle cx="' +
    (owl ? 59 : 57) +
    '" cy="24" r="3" fill="#152820"/><path d="M28 52v7h8M43 52v7h8" fill="none" stroke="#dfb060" stroke-width="3"/></svg>'
  );
}
class BulkBirdGame {
  constructor(host, options = {}) {
    this.host = host;
    this.storage = options.storage;
    this.openDouble = options.openDouble;
    this.nestedSuspended = false;
    this.soundEnabled = options.soundEnabled || (() => true);
    this.storageOK = true;
    this.frameId = 0;
    this.dead = false;
    this.last = 0;
    this.lastRender = 0;
    this.accumulator = 0;
    this.hudClock = 0;
    this.keys = {};
    this.edge = {};
    this.orbit = false;
    this.audio = null;
    try {
      this.saveData = readBulkBirdSave(this.storage.getItem('bulk-import-bird-game-3-v1'));
    } catch {
      this.saveData = readBulkBirdSave(null);
      this.storageOK = false;
    }
    this.best = this.saveData.best;
    this.game = new BulkBirdState(Date.now(), this.saveData.selected);
    host.innerHTML = `<div class="bird-page"><div class="bird-heading"><div><div class="eyebrow">WYBIERZ SWOJEGO MAINA / POZNAJ PTAKA PO COMMITACH</div><h1>BIRD GAME <em>3</em></h1><p>Leśna arena BvB · lokalna rozgrywka z botami · hotfix 3.0.416</p></div><div class="bird-record"><small>REKORD ARENY</small><strong id="bird-best">0</strong><span id="bird-storage-note"></span><span id="bird-legacy"></span></div></div>
  <div class="bird-arena is-selecting" id="bird-arena"><canvas id="bird-canvas" tabindex="0" aria-label="Bird Game 3: leśna arena 3D i podgląd wybranego ptaka"></canvas>
   <div class="bird-selection-scene" id="bird-selection-scene"><div class="bird-select-label">◂ CHARACTER SELECTION <span>WYBÓR PTAKA</span></div><div class="bird-preview-caption"><b id="bird-preview-name"></b><span>Wszystkie ptaki odblokowane. Bez kupowania piórek.</span></div><div class="bird-loadout"><div class="eyebrow">TWÓJ MAIN / KARTA POSTACI</div><h2 id="bird-name"></h2><div id="bird-role" class="bird-role"></div><p id="bird-description"></p><div id="bird-stats"></div><div class="bird-power"><kbd>Q</kbd><div><b id="bird-skill-name"></b><p id="bird-power"></p></div></div><p id="bird-meme" class="bird-meme"></p><button id="bird-start" class="primary">▶ Wybieram tego ptaka</button><small class="bird-mission">CEL: dostarcz 8 CSV do niebieskiego gniazda w 120 s. Pula: 12 plików, bez odrastania. Leć po CSV w powietrzu i odbierz dane botom lub z Camp Cache.</small></div></div>
   <div id="bird-hud" class="bird-hud" hidden><div class="bird-vitals"><span id="bird-player-name"></span><div class="bird-health-track"><i id="bird-hp-fill"></i><b id="bird-hp"></b></div><div class="bird-stamina-track"><i id="bird-stamina-fill"></i></div><small id="bird-cargo"></small></div><div class="bird-objective"><b id="bird-delivered"></b><span id="bird-timer"></span><small id="bird-lives"></small></div><div class="bird-bottom-hud"><span id="bird-skill-status"></span><span id="bird-dash-status"></span><b id="bird-score"></b></div><div id="bird-cargo-full" class="bird-cargo-full" role="status" hidden>PEŁNY DZIÓB · 3/3 CSV — wróć do niebieskiego gniazda!</div><div id="bird-respawn" hidden></div></div>
   <div id="bird-overlay" class="bird-overlay" hidden><div class="bird-card-content"><div class="eyebrow" id="bird-overlay-tag"></div><h2 id="bird-overlay-title"></h2><p id="bird-overlay-text"></p><button id="bird-resume" class="primary">▶ Wznów</button><button id="bird-reselect">Wybierz innego ptaka</button></div></div>
  </div><div class="bird-roster" id="bird-roster" aria-label="Wybór gatunku ptaka">${Object.entries(
    BULK_BIRDS,
  )
    .map(
      ([id, c]) =>
        '<button class="bird-choice" data-bird="' +
        id +
        '" aria-pressed="false">' +
        bulkBirdPortrait(id) +
        '<span><b>' +
        c.name +
        '</b><small>' +
        c.role +
        '</small></span></button>',
    )
    .join('')}</div>
  <div class="bird-bottom"><p><kbd>WASD</kbd> ruch · <kbd>SPACJA</kbd> wzlot · <kbd>SHIFT</kbd> sprint · <kbd>J / LPM</kbd> dziób · <kbd>Q</kbd> moc · <kbd>C</kbd> unik · <kbd>P / ESC</kbd> pauza · PPM: kamera</p><div><button id="bird-double">CSV Double · gra w symbole</button><button id="bird-pause" disabled>Pauza</button><button id="bird-restart">Wybierz ptaka</button></div></div>
  <div class="bird-touch" aria-label="Sterowanie dotykowe"><div><button data-key="KeyW">↑</button><button data-key="KeyA">←</button><button data-key="KeyS">↓</button><button data-key="KeyD">→</button></div><div><button data-key="Space">LOT</button><button data-key="KeyJ">DZIÓB</button><button data-key="KeyQ">Q</button><button data-key="KeyC">UNIK</button></div></div>
  <p class="bird-joke" id="bird-joke">„Koliber dostał nerfa? Nie, tylko zmniejszono czcionkę w patch notes.”</p><div class="bird-phases"><span>1 / WYBIERZ PTAKA</span><span>2 / ZBIERZ CSV · MAKS. 3 W DZIOBIE</span><span>3 / ODBIERZ CSV BOTOM LUB Z CAMP CACHE</span></div></div>`;
    this.$ = (id) => host.querySelector('#' + id);
    this.canvas = this.$('bird-canvas');
    try {
      this.renderer = new BulkBirdRenderer(this.canvas);
    } catch (e) {
      this.renderer = null;
      this.$('bird-description').textContent =
        'Arena 3D wymaga WebGL. Włącz akcelerację sprzętową i otwórz grę ponownie.';
      this.$('bird-start').disabled = true;
    }
    this.onKey = (e) => {
      if (this.nestedSuspended) return;
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      )
        return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
        e.preventDefault();
      if (['KeyP', 'Escape'].includes(e.code) && !e.repeat) {
        e.preventDefault();
        this.togglePause();
        return;
      }
      this.keys[e.code] = true;
      if (!e.repeat && ['KeyQ', 'KeyC'].includes(e.code)) this.edge[e.code] = true;
    };
    this.onUp = (e) => (this.keys[e.code] = false);
    this.onBlur = () => this.pause();
    this.onHidden = () => {
      if (document.hidden) this.pause();
    };
    this.onPointer = (e) => {
      e.preventDefault();
      this.canvas.focus({ preventScroll: true });
      if (e.button === 2) this.orbit = true;
      else if (e.button === 0) this.keys.MouseFire = true;
      this.canvas.setPointerCapture(e.pointerId);
    };
    this.onMove = (e) => {
      if (this.orbit && this.renderer) this.renderer.yaw -= e.movementX * 0.006;
    };
    this.onPointerUp = (e) => {
      if (e.button === 2) this.orbit = false;
      else this.keys.MouseFire = false;
    };
    this.onContext = (e) => e.preventDefault();
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onHidden);
    this.canvas.addEventListener('pointerdown', this.onPointer);
    this.canvas.addEventListener('pointermove', this.onMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', this.onContext);
    for (const button of host.querySelectorAll('[data-bird]'))
      button.onclick = () => this.selectBird(button.dataset.bird);
    for (const button of host.querySelectorAll('[data-key]')) {
      const key = button.dataset.key;
      button.onpointerdown = (e) => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        this.keys[key] = true;
        this.edge[key] = true;
      };
      button.onpointerup = button.onpointercancel = (e) => {
        e.preventDefault();
        this.keys[key] = false;
      };
    }
    this.$('bird-double').onclick = () => this.openDouble?.();
    this.$('bird-start').onclick = () => this.start();
    this.$('bird-resume').onclick = () => this.start();
    this.$('bird-pause').onclick = () => this.togglePause();
    this.$('bird-restart').onclick = this.$('bird-reselect').onclick = () =>
      this.selectBird(this.game.selected);
    this.selectBird(this.game.selected);
  }
  set(id, value) {
    const s = String(value);
    if (this.$(id).textContent !== s) this.$(id).textContent = s;
  }
  chirp(freq = 500) {
    if (!this.soundEnabled()) return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      this.audio.resume();
      const o = this.audio.createOscillator(),
        g = this.audio.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, this.audio.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * 0.7, this.audio.currentTime + 0.08);
      g.gain.setValueAtTime(0.018, this.audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.audio.currentTime + 0.1);
      o.connect(g);
      g.connect(this.audio.destination);
      o.start();
      o.stop(this.audio.currentTime + 0.11);
    } catch {}
  }
  persist() {
    this.saveData.best = this.best;
    this.saveData.selected = this.game.selected;
    try {
      this.storage.setItem('bulk-import-bird-game-3-v1', JSON.stringify(this.saveData));
    } catch {
      this.storageOK = false;
    }
  }
  saveBest() {
    const points = Math.min(1000000, this.game.score);
    this.best = Math.max(this.best, points);
    this.saveData.records[this.game.selected] = Math.max(
      this.saveData.records[this.game.selected] || 0,
      points,
    );
    this.persist();
  }
  selectBird(id) {
    if (!Object.hasOwn(BULK_BIRDS, id)) return;
    this.saveBest();
    this.keys = {};
    this.edge = {};
    this.game.reset(Date.now(), id);
    this.persist();
    const c = BULK_BIRDS[id];
    this.set('bird-name', c.name);
    this.set('bird-role', c.code + ' / ' + c.role);
    this.set('bird-preview-name', c.code);
    this.set(
      'bird-description',
      this.renderer
        ? c.description
        : 'Arena 3D wymaga WebGL. Włącz akcelerację sprzętową i otwórz grę ponownie.',
    );
    this.set('bird-skill-name', c.skill + ' · ' + c.cooldown + ' s');
    this.set('bird-power', c.power);
    this.set('bird-meme', c.meme);
    this.$('bird-stats').innerHTML = [
      ['ŻYCIE', c.hp, 140, c.hp + ' HP'],
      ['SZYBKOŚĆ', c.speed, 12, c.speed.toFixed(1)],
      ['DZIÓB', c.damage, 25, c.damage + ' / ' + c.interval.toFixed(2) + ' s'],
    ]
      .map(
        ([name, value, max, label]) =>
          '<div class="bird-stat"><label>' +
          name +
          '<b>' +
          label +
          '</b></label><div><i style="width:' +
          (value / max) * 100 +
          '%"></i></div></div>',
      )
      .join('');
    for (const b of this.host.querySelectorAll('[data-bird]'))
      b.setAttribute('aria-pressed', String(b.dataset.bird === id));
    this.$('bird-selection-scene').hidden = false;
    this.$('bird-roster').hidden = false;
    this.$('bird-overlay').hidden = true;
    this.$('bird-hud').hidden = true;
    this.$('bird-arena').classList.add('is-selecting');
    this.$('bird-pause').disabled = true;
    this.$('bird-pause').textContent = 'Pauza';
    this.updateHud();
    this.last = performance.now();
    this.lastRender = 0;
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }
  start() {
    if (this.dead || !this.renderer) return;
    const resuming = this.game.mode === 'paused';
    if (this.game.mode === 'over') this.game.reset(Date.now(), this.game.selected);
    this.game.mode = 'playing';
    this.keys = {};
    this.edge = {};
    this.accumulator = 0;
    this.last = performance.now();
    this.$('bird-selection-scene').hidden = true;
    this.$('bird-roster').hidden = true;
    this.$('bird-overlay').hidden = true;
    this.$('bird-hud').hidden = false;
    this.$('bird-arena').classList.remove('is-selecting');
    this.$('bird-pause').disabled = false;
    this.$('bird-pause').textContent = 'Pauza';
    if (!resuming) {
      this.game.event(
        '8 z 12 CSV do niebieskiego gniazda. Pliki też w powietrzu! Czerwony stożek: nadchodzi atak, użyj C albo odleć.',
      );
      this.renderer.render(this.game, 1, this.game.time);
    }
    this.canvas.focus({ preventScroll: true });
    this.chirp(840);
    this.updateHud();
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }
  pause() {
    if (this.game.mode !== 'playing') return;
    this.game.mode = 'paused';
    this.keys = {};
    this.edge = {};
    this.orbit = false;
    cancelAnimationFrame(this.frameId);
    this.$('bird-overlay').hidden = false;
    this.set('bird-overlay-tag', 'PAUZA / TWÓJ MAIN TEŻ POTRZEBUJE PRZERWY');
    this.set(
      'bird-overlay-title',
      BULK_BIRDS[this.game.selected].name + ' w kolejce asynchronicznej.',
    );
    this.set('bird-overlay-text', 'Arena i zegar czekają. Wznów lot albo wybierz innego ptaka.');
    this.set('bird-resume', '▶ Wznów');
    this.set('bird-pause', 'Wznów');
  }
  togglePause() {
    if (this.game.mode === 'playing') this.pause();
    else if (this.game.mode === 'paused') this.start();
  }
  updateHud() {
    const g = this.game,
      p = g.player,
      c = BULK_BIRDS[g.selected];
    this.set('bird-best', this.best);
    this.set(
      'bird-storage-note',
      this.storageOK ? 'Zapis lokalny · bez konta' : 'Pamięć zablokowana · rekord w tej sesji',
    );
    this.set(
      'bird-legacy',
      this.saveData.legacyBest ? 'Archiwum v13: ' + this.saveData.legacyBest + ' przelotów' : '',
    );
    this.set('bird-player-name', c.name + ' / ' + c.code);
    this.set(
      'bird-hp',
      Math.ceil(p.hp) +
        ' / ' +
        p.maxHp +
        ' HP' +
        (p.shield ? ' + ' + Math.ceil(p.shield) + ' osłony' : ''),
    );
    this.$('bird-hp-fill').style.width = (p.hp / p.maxHp) * 100 + '%';
    this.$('bird-stamina-fill').style.width = p.stamina + '%';
    this.set(
      'bird-cargo',
      'CSV W DZIOBIE: ' +
        p.cargo +
        '/3 · ' +
        ('Wysokość ' + p.y.toFixed(1) + ' m · pliki: ziemia i powietrze'),
    );
    this.$('bird-cargo-full').hidden = p.cargo < 3;
    this.set('bird-delivered', 'IMPORT ' + g.delivered + ' / ' + g.goal);
    this.set('bird-timer', Math.ceil(g.remaining) + ' s');
    this.set(
      'bird-lives',
      'PRÓBY: ' + '♥ '.repeat(g.lives) + ' · CSV u botów / w bazie: ' + g.csvOnEnemies,
    );
    this.set('bird-score', g.score + ' PKT');
    this.set(
      'bird-skill-status',
      'Q · ' +
        c.skill +
        ' / ' +
        (p.skillCooldown > 0 ? p.skillCooldown.toFixed(1) + ' s' : 'GOTOWE'),
    );
    this.set(
      'bird-dash-status',
      'C · Ptasia migracja / ' + (p.dashCooldown > 0 ? p.dashCooldown.toFixed(1) + ' s' : 'GOTOWA'),
    );
    this.set('bird-joke', g.status);
    this.$('bird-respawn').hidden = p.alive;
    if (!p.alive)
      this.set('bird-respawn', 'ODRODZENIE ZA ' + Math.max(0, Math.ceil(p.respawn)) + ' s');
  }
  frame(now) {
    if (this.dead || this.nestedSuspended || this.game.mode === 'paused') return;
    const dt = Math.min(0.12, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (document.hidden) {
      this.pause();
      if (this.game.mode === 'ready') this.frameId = requestAnimationFrame((t) => this.frame(t));
      return;
    }
    if (this.game.mode === 'playing') {
      const g = this.game,
        score = g.score,
        hp = g.player.hp;
      this.accumulator = Math.min(0.12, this.accumulator + dt);
      const mx =
          (this.keys.KeyD || this.keys.ArrowRight ? 1 : 0) -
          (this.keys.KeyA || this.keys.ArrowLeft ? 1 : 0),
        mz =
          (this.keys.KeyS || this.keys.ArrowDown ? 1 : 0) -
          (this.keys.KeyW || this.keys.ArrowUp ? 1 : 0),
        move = this.renderer.moveVector(mx, mz);
      while (this.accumulator >= 1 / 60 && g.mode === 'playing') {
        g.step(1 / 60, {
          mx: move.x,
          mz: move.z,
          fly: !!this.keys.Space,
          sprint: !!(this.keys.ShiftLeft || this.keys.ShiftRight),
          fire: !!(this.keys.KeyJ || this.keys.MouseFire),
          skill: !!this.edge.KeyQ,
          dash: !!this.edge.KeyC,
        });
        this.edge = {};
        this.accumulator -= 1 / 60;
      }
      if (g.score > score) {
        this.chirp(950);
        this.saveBest();
      } else if (g.player.hp < hp) this.chirp(130);
    }
    this.hudClock += dt;
    if (this.hudClock > 0.1) {
      this.hudClock = 0;
      this.updateHud();
    }
    if (this.game.mode !== 'ready' || now - this.lastRender > 33) {
      this.renderer?.render(this.game, dt, now / 1000);
      this.lastRender = now;
    }
    if (this.game.mode === 'over') {
      this.saveBest();
      this.updateHud();
      this.$('bird-overlay').hidden = false;
      this.set(
        'bird-overlay-tag',
        this.game.won ? 'IMPORT ZAKOŃCZONY / GG WP' : 'RETRY / ŻADEN PTAK NIE STRACIŁ LICENCJI',
      );
      this.set(
        'bird-overlay-title',
        this.game.won ? 'Ptasia rada zatwierdza deployment.' : 'CSV wrócił do backlogu.',
      );
      this.set(
        'bird-overlay-text',
        this.game.status +
          ' Wynik: ' +
          this.game.score +
          ' pkt, importy: ' +
          this.game.delivered +
          '/' +
          this.game.goal +
          ', dziobnięte boty: ' +
          this.game.kills +
          '.',
      );
      this.set('bird-resume', '↻ Rewanż tym ptakiem');
      this.$('bird-pause').disabled = true;
      return;
    }
    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }
  suspendForMinigame() {
    this.pause();
    this.nestedSuspended = true;
    this.keys = {};
    this.edge = {};
    this.orbit = false;
    cancelAnimationFrame(this.frameId);
    this.saveBest();
  }
  resumeFromMinigame() {
    this.nestedSuspended = false;
    this.keys = {};
    this.edge = {};
    this.last = performance.now();
    this.accumulator = 0;
    this.renderer?.resize();
    this.renderer?.render(this.game, 0, performance.now() / 1000);
    if (this.game.mode === 'ready') {
      cancelAnimationFrame(this.frameId);
      this.frameId = requestAnimationFrame((t) => this.frame(t));
    }
  }
  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.frameId);
    this.saveBest();
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onHidden);
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('contextmenu', this.onContext);
    this.renderer?.dispose();
    this.audio?.close();
  }
}
if (typeof window !== 'undefined') window.BulkBirdGame = BulkBirdGame;
