'use strict';
class BulkSoulsGame {
  constructor(host, { storage, onExit, soundEnabled = () => true } = {}) {
    this.host = host;
    this.storage = storage;
    this.onExit = onExit;
    this.dead = false;
    this.keys = {};
    this.viewState = { yaw: 0 };
    this.mouse = { active: false, drag: false };
    this.last = performance.now();
    this.renderAt = 0;
    this.uiAt = 0;
    this.savedAt = 0;
    this.lastState = null;
    let progress = BulkSouls.defaultProgress();
    try {
      progress = BulkSouls.readProgress(storage.getItem('bulk-import-apex-souls-v1'));
    } catch (e) {}
    this.game = new BulkSouls.Game(progress);
    this.effects = new BulkEffects.Effects({ enabled: soundEnabled });
    host.innerHTML =
      '<div class="souls-page"><canvas id="souls-world" aria-label="Apex Souls: trójwymiarowa walka rycerza w ruinach Legacy"></canvas><div class="souls-vignette"></div><div class="souls-top"><div><small>POZA OSTATNIM PRZYSTANKIEM / NOWA KLĄTWA</small><h1>APEX <em>SOULS</em></h1><p id="souls-area"></p></div><button data-souls-action="pause">Ⅱ Pauza</button></div><div class="souls-vitals"><label>ŻYCIE <b id="souls-hp"></b></label><div class="souls-track"><i id="souls-health"></i></div><label>WYTRZYMAŁOŚĆ</label><div class="souls-track stamina"><i id="souls-stamina"></i></div><div class="souls-currency"><span id="souls-runes"></span><span id="souls-flasks"></span></div></div><div id="souls-boss" class="souls-boss" hidden><div><span id="souls-boss-name"></span><small id="souls-boss-phase"></small></div><div class="souls-track"><i id="souls-boss-hp"></i></div></div><div class="souls-bottom"><p id="souls-message" role="status"></p><div id="souls-prompt"></div><small>WASD: ruch · J / LPM: atak · K: mocny atak · spacja: unik · F: blok · R: leczenie · E: interakcja · Q: namierz · P: pauza · PPM + ruch: kamera</small></div><div class="souls-touch"><div class="souls-pad"><button data-souls-hold="KeyW" aria-label="Ruch do przodu">↑</button><button data-souls-hold="KeyA" aria-label="Ruch w lewo">←</button><button data-souls-hold="KeyS" aria-label="Ruch do tyłu">↓</button><button data-souls-hold="KeyD" aria-label="Ruch w prawo">→</button></div><div class="souls-touch-actions"><button data-souls-action="light">Miecz</button><button data-souls-action="heavy">Mocny</button><button data-souls-action="roll">Unik</button><button data-souls-hold="KeyF">Blok</button><button data-souls-action="heal">Flakon</button><button data-souls-action="interact">E</button><button data-souls-action="lock">Cel</button></div></div><div id="souls-cover" class="souls-cover"></div></div>';
    try {
      this.view = new BulkSoulsRenderer(this.$('souls-world'));
    } catch (e) {
      this.renderError = true;
      this.$('souls-cover').innerHTML =
        '<div><h2>Potrzebny WebGL</h2><p>Włącz akcelerację sprzętową.</p><button data-souls-action="exit">Wróć do Metro</button></div>';
    }
    this.onClick = (e) => {
      const b = e.target.closest('[data-souls-action]');
      if (b && host.contains(b)) this.action(b.dataset.soulsAction);
    };
    this.onKey = (e) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      )
        return;
      const actions = {
          KeyJ: 'light',
          KeyK: 'heavy',
          Space: 'roll',
          KeyR: 'heal',
          KeyE: 'interact',
          KeyQ: 'lock',
          KeyP: 'pause',
          Escape: 'pause',
        },
        movement = [
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyF',
          'ShiftLeft',
          'ShiftRight',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
        ];
      if (!actions[e.code] && !movement.includes(e.code)) return;
      e.preventDefault();
      this.keys[e.code] = true;
      if (actions[e.code] && !e.repeat) this.action(actions[e.code]);
    };
    this.onUp = (e) => {
      this.keys[e.code] = false;
    };
    this.onBlur = () => this.pause();
    this.onHidden = () => {
      if (document.hidden) this.pause();
    };
    this.onResize = () => this.view?.resize();
    this.onPointerDown = (e) => {
      const hold = e.target.closest('[data-souls-hold]');
      if (hold) {
        this.keys[hold.dataset.soulsHold] = true;
        hold.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      if (e.target !== this.$('souls-world')) return;
      this.pointerAim(e);
      if (e.button === 2) {
        this.mouse.drag = true;
        e.target.setPointerCapture(e.pointerId);
      } else if (e.button === 0) this.action('light');
    };
    this.onPointerUp = (e) => {
      const hold = e.target.closest('[data-souls-hold]');
      if (hold) this.keys[hold.dataset.soulsHold] = false;
      this.mouse.drag = false;
    };
    this.onPointerMove = (e) => {
      if (e.target !== this.$('souls-world') || this.game.state !== 'playing') return;
      if (this.mouse.drag) {
        this.viewState.yaw -= e.movementX * 0.006;
        this.mouse.active = false;
      } else this.pointerAim(e);
    };
    this.onContext = (e) => e.preventDefault();
    host.addEventListener('click', this.onClick);
    host.addEventListener('pointerdown', this.onPointerDown);
    host.addEventListener('pointerup', this.onPointerUp);
    host.addEventListener('pointercancel', this.onPointerUp);
    host.addEventListener('pointermove', this.onPointerMove);
    host.addEventListener('contextmenu', this.onContext);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onHidden);
    this.ray = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.hitPoint = new THREE.Vector3();
    this.cover();
    this.hud();
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
  }
  $(id) {
    return this.host.querySelector('#' + id);
  }
  pointerAim(e) {
    if (!this.view) return;
    const box = this.$('souls-world').getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - box.left) / box.width) * 2 - 1,
      (-(e.clientY - box.top) / box.height) * 2 + 1,
    );
    this.view.camera.updateMatrixWorld();
    this.ray.setFromCamera(this.pointer, this.view.camera);
    if (this.ray.ray.intersectPlane(this.plane, this.hitPoint)) {
      this.mouse.angle = Math.atan2(
        this.hitPoint.x - this.game.player.x,
        this.hitPoint.z - this.game.player.z,
      );
      this.mouse.active = true;
    }
  }
  input() {
    const k = this.keys,
      x = Number(!!(k.KeyD || k.ArrowRight)) - Number(!!(k.KeyA || k.ArrowLeft)),
      z = Number(!!(k.KeyS || k.ArrowDown)) - Number(!!(k.KeyW || k.ArrowUp)),
      a = this.viewState.yaw;
    return {
      x: x * Math.cos(a) + z * Math.sin(a),
      z: z * Math.cos(a) - x * Math.sin(a),
      block: !!k.KeyF,
      sprint: !!(k.ShiftLeft || k.ShiftRight),
      ...(this.mouse.active ? { angle: this.mouse.angle } : {}),
    };
  }
  action(kind) {
    if (this.dead) return;
    if (kind === 'exit') {
      this.onExit?.();
      return;
    }
    if (this.renderError) return;
    if (kind === 'start') {
      this.game.start();
      this.keys = {};
      this.last = performance.now();
      this.effects.play('powerup');
      this.cover();
      return;
    }
    if (kind === 'new') {
      const old = this.game.progress;
      this.game = new BulkSouls.Game({
        ...BulkSouls.defaultProgress(),
        wins: old.wins,
        deaths: old.deaths,
      });
      this.game.start();
      this.keys = {};
      this.last = performance.now();
      this.persist();
      this.cover();
      return;
    }
    if (kind === 'retry') {
      this.game.retry();
      this.keys = {};
      this.last = performance.now();
      this.persist();
      this.cover();
      return;
    }
    if (kind === 'pause') {
      if (this.game.state === 'paused') {
        this.game.resume();
        this.keys = {};
        this.last = performance.now();
        this.cover();
      } else this.pause();
      return;
    }
    if (kind === 'rest') {
      if (this.game.rest()) this.effects.play('heal');
      this.persist();
      this.cover();
      this.hud();
      return;
    }
    if (kind === 'level') {
      if (this.game.buyLevel()) this.effects.play('upgrade');
      this.persist();
      this.cover();
      this.hud();
      return;
    }
    if (kind === 'leaveRest') {
      this.game.leaveRest();
      this.keys = {};
      this.last = performance.now();
      this.cover();
      return;
    }
    if (this.game.action(kind, this.input())) {
      const sound = {
        light: 'slash',
        heavy: 'greatsword',
        roll: 'dash',
        heal: 'click',
        lock: 'click',
        interact: 'click',
      }[kind];
      if (sound) this.effects.play(sound);
      if (this.game.state === 'rest') this.keys = {};
      this.cover();
      if (kind === 'interact') this.persist();
    } else if (
      this.game.state === 'playing' &&
      !this.game.player.action &&
      this.game.player.roll <= 0
    ) {
      const cost = { light: 22, heavy: 40, roll: 28 }[kind];
      if (cost && this.game.player.stamina < cost)
        this.game.message = 'Brak wytrzymałości. Odpuść na chwilę — nawet Apex ma limity.';
      if (kind === 'heal')
        this.game.message =
          this.game.player.flasks <= 0
            ? 'Brak flakonów. Ognisko Backupu uzupełnia zapas.'
            : 'Życie jest pełne albo leczenie przerwane.';
    }
  }
  pause() {
    if (this.dead) return;
    this.keys = {};
    this.mouse.drag = false;
    this.game.pause();
    this.effects.stop();
    this.cover();
  }
  persist() {
    try {
      this.storage.setItem('bulk-import-apex-souls-v1', JSON.stringify(this.game.snapshot()));
    } catch (e) {}
    this.savedAt = performance.now();
  }
  cover() {
    if (this.renderError) return;
    const g = this.game,
      state = g.state,
      box = this.$('souls-cover');
    this.lastState = state;
    if (state === 'playing') {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (state === 'ready') {
      box.innerHTML =
        '<div><div class="souls-eyebrow">30 000 METRÓW ZA TOBĄ / KLĄTWA DOPIERO SIĘ ZACZYNA</div><h2>APEX <em>SOULS</em></h2><h3>Klątwa Legacy</h3><p>Trzy lokacje, miecz, tarcza i przeciwnicy, którzy telegrafują ataki. Zarządzaj wytrzymałością. Unik ma krótkie okno nietykalności. Ogniska odnawiają flakony i pozwalają kupować poziomy.</p><p>Po śmierci zostawiasz runy na ziemi. Lord Legacy czeka w katedrze — i nadal używa makr z 2007 roku.</p><button class="primary" data-souls-action="start">⚔ ' +
        (g.area > 0 ? 'KONTYNUUJ WYPRAWĘ' : 'ROZPOCZNIJ WYPRAWĘ') +
        '</button><button data-souls-action="exit">Wróć do Metro Import</button><small>J / LPM: cios · K: mocny cios · spacja: unik · F: blok · R: flakon · Q: namierz · E: ognisko/brama · P: pauza</small></div>';
      return;
    }
    if (state === 'rest') {
      box.innerHTML =
        '<div><div class="souls-eyebrow">OGNISKO BACKUPU / PUNKT KONTROLNY</div><h2>Jeszcze jeden<br><em>bezpieczny zapis.</em></h2><p>' +
        g.message +
        '</p><p>Poziom ' +
        g.progress.level +
        ' / 8 · ' +
        g.progress.runes +
        ' run ID. Wyższy poziom: +10 życia, +5 wytrzymałości i +2 obrażeń.</p><button class="primary" data-souls-action="rest">Odpocznij · odnów życie i 3 flakony</button><button data-souls-action="level" ' +
        (g.progress.level >= 8 || g.progress.runes < g.levelCost ? 'disabled' : '') +
        '>Zwiększ poziom · ' +
        (g.progress.level >= 8 ? 'MAX' : g.levelCost + ' run ID') +
        '</button><button data-souls-action="leaveRest">Odejdź od ogniska</button><button data-souls-action="exit">Wróć do Metro</button></div>';
      return;
    }
    const dead = state === 'dead',
      won = state === 'victory';
    box.innerHTML =
      '<div class="' +
      (dead ? 'souls-death' : '') +
      '"><div class="souls-eyebrow">' +
      (dead
        ? 'KOPIA ZAPASOWA NIE OBEJMUJE GODNOŚCI'
        : won
          ? 'KLĄTWA LEGACY ZDJĘTA'
          : 'PAUZA / ZAPYTANIE WSTRZYMANE') +
      '</div><h2>' +
      (dead
        ? 'UMARŁEŚ'
        : won
          ? 'IMPORT<br><em>ZAKOŃCZONY</em>'
          : 'Odpoczynek<br><em>od przekleństw.</em>') +
      '</h2><p>' +
      g.message +
      '</p><p>Poziom: ' +
      g.progress.level +
      ' · zgony: ' +
      g.progress.deaths +
      ' · zwycięstwa: ' +
      g.progress.wins +
      '.</p><button class="primary" data-souls-action="' +
      (dead ? 'retry' : won ? 'new' : 'pause') +
      '">' +
      (dead ? '↻ POWRÓT DO OGNISKA' : won ? '⚔ NOWA PODRÓŻ' : '▶ WZNÓW') +
      '</button><button data-souls-action="exit">Wróć do Metro Import</button></div>';
  }
  hud() {
    const g = this.game,
      p = g.player;
    this.$('souls-area').textContent = g.area + 1 + ' / 3 · ' + BulkSouls.AREAS[g.area];
    this.$('souls-hp').textContent = Math.ceil(p.hp) + ' / ' + g.maxHp;
    this.$('souls-health').style.width = Math.max(0, (p.hp / g.maxHp) * 100) + '%';
    this.$('souls-stamina').style.width = (p.stamina / g.maxStamina) * 100 + '%';
    this.$('souls-runes').textContent = g.progress.runes + ' RUN ID · POZ. ' + g.progress.level;
    this.$('souls-flasks').textContent = 'FLAKONY ' + p.flasks + ' / 3';
    this.$('souls-message').textContent = g.message;
    const nearFire = Math.hypot(p.x, p.z - 8) < 2.3,
      nearGate = g.area < 2 && Math.hypot(p.x, p.z + 11) < 2.4;
    this.$('souls-prompt').textContent = nearFire
      ? 'E · OGNISKO BACKUPU'
      : nearGate
        ? g.enemies.some((e) => e.hp > 0)
          ? 'BRAMA ZAMKNIĘTA · POKONAJ STRAŻNIKÓW'
          : 'E · NASTĘPNA LOKACJA'
        : g.target
          ? 'Q · NAMIERZANIE AKTYWNE'
          : 'Q · NAMIERZ NAJBLIŻSZEGO WROGA';
    const boss = g.enemies.find((e) => e.type === 'boss' && e.hp > 0);
    this.$('souls-boss').hidden = !boss;
    if (boss) {
      this.$('souls-boss-name').textContent = BulkSouls.ENEMIES.boss.name;
      this.$('souls-boss-phase').textContent = 'FAZA ' + boss.phase + ' / 3';
      this.$('souls-boss-hp').style.width = (boss.hp / boss.maxHp) * 100 + '%';
    }
  }
  frame(now) {
    if (this.dead) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (document.hidden) return;
    if (this.game.state === 'playing') {
      this.game.tick(dt, this.input());
      const sounds = {
        light: 'slash',
        heavy: 'greatsword',
        roll: 'dash',
        flask: 'click',
        healed: 'heal',
        block: 'shield',
        hurt: 'hit',
        enemyHit: 'kill',
        enemyAttack: 'slash',
        enemyDead: 'powerup',
        phase: 'greatsword',
        victory: 'upgrade',
        reclaim: 'powerup',
        area: 'powerup',
      };
      for (const e of this.game.events) if (sounds[e.type]) this.effects.play(sounds[e.type]);
      if (
        this.game.events.some((e) =>
          ['enemyDead', 'death', 'victory', 'reclaim', 'area'].includes(e.type),
        )
      )
        this.persist();
      if (this.lastState !== this.game.state) {
        this.keys = {};
        this.mouse.drag = false;
        this.cover();
      }
    }
    if (this.game.state === 'playing' || now - this.renderAt >= 50) {
      this.renderAt = now;
      this.view?.render(this.game, dt, this.viewState);
    }
    if (now - this.uiAt >= 100) {
      this.uiAt = now;
      this.hud();
    }
    if (now - this.savedAt > 10000) this.persist();
  }
  destroy() {
    if (this.dead) return;
    this.persist();
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.host.removeEventListener('click', this.onClick);
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    this.host.removeEventListener('pointerup', this.onPointerUp);
    this.host.removeEventListener('pointercancel', this.onPointerUp);
    this.host.removeEventListener('pointermove', this.onPointerMove);
    this.host.removeEventListener('contextmenu', this.onContext);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onHidden);
    this.effects.destroy();
    this.view?.destroy();
    this.host.replaceChildren();
  }
}
if (typeof window !== 'undefined') window.BulkSoulsGame = BulkSoulsGame;
