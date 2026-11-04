'use strict';
const bulkDoubleEscape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

class BulkDoubleRemoteView {
  constructor(snapshot, network) {
    Object.assign(this, snapshot);
    this.network = network;
    this.receivedAt = performance.now();
    this.pile = { length: snapshot.remaining };
    this.settings = { ...snapshot.settings, training: false, difficulty: 'normal' };
  }
  projectedTime(now) {
    return (
      this.time +
      (this.network.connected && !['PAUSED', 'GAME_OVER'].includes(this.state)
        ? Math.max(0, now - this.receivedAt)
        : 0)
    );
  }
  token() {
    return { session: this.session, roundId: this.roundId };
  }
  nextDeadline() {
    return Infinity;
  }
  results() {
    return this.result;
  }
}

class BulkDoubleNetwork {
  constructor(owner, options = {}) {
    this.owner = owner;
    this.enabled = options.enabled === true;
    this.endpoint = options.endpoint || '';
    this.active = false;
    this.connected = false;
    this.socket = null;
    this.room = null;
    this.notice = '';
    this.seq = 0;
    this.attempts = 0;
    this.generation = 0;
    this.dead = false;
    this.localModel = owner.model;
    this.resume = null;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem('bulk-import-csv-double-session-v1') || 'null',
      );
      if (
        saved?.endpoint === this.endpoint &&
        typeof saved.code === 'string' &&
        typeof saved.token === 'string'
      )
        this.resume = saved;
    } catch {}
  }
  get host() {
    return !!this.room && this.room.hostId === this.room.meId;
  }
  get me() {
    return this.room?.players.find((p) => p.id === this.room.meId);
  }
  menuHTML() {
    const disabled = this.enabled ? '' : 'disabled';
    return `<section class="dbl-online"><div><div class="eyebrow">NOWOŚĆ / IMPORT ZNAJOMYCH</div><h2>CSV Double ze znajomymi</h2><p>2–4 osoby, wspólny stos, własne karty. Serwer liczy punkty i kary. Niech wygra szybszy upsert.</p></div><div class="dbl-online-form"><p class="dbl-net-notice" role="status">${bulkDoubleEscape(this.notice || (this.enabled ? 'Serwer obsługuje stoły online. Utwórz pokój lub podaj kod znajomego.' : 'Multiplayer przygotowany, ale wyłączony. Czeka na uruchomienie serwera. Solo i boty działają normalnie.'))}</p><label>Pseudonim<input id="double-net-name" maxlength="24" autocomplete="nickname" value="Ptasia Admin" ${disabled}></label><div class="dbl-net-actions"><button data-double-action="net-create" ${disabled}>Utwórz pokój</button><label>Kod pokoju<input id="double-net-code" maxlength="6" placeholder="A1B2C3" autocomplete="off" spellcheck="false" ${disabled}></label><button data-double-action="net-join" ${disabled}>Dołącz kodem</button>${this.resume ? `<button data-double-action="net-resume" ${disabled}>Wznów pokój ${bulkDoubleEscape(this.resume.code)}</button>` : ''}</div></div></section>`;
  }
  lobbyHTML() {
    const r = this.room;
    if (!r)
      return `<section class="dbl-net-lobby"><h2>Łączenie ze stołem…</h2><p role="status">${bulkDoubleEscape(this.notice || 'Czekamy na odpowiedź serwera.')}</p><button data-double-action="net-leave">Wróć do solo</button></section>`;
    const allReady = r.players.length >= 2 && r.players.every((p) => p.ready && p.connected);
    return `<section class="dbl-net-lobby"><div class="dbl-net-lobby-top"><div><div class="eyebrow">STÓŁ ONLINE / ${r.players.length}/4 GRACZY</div><h2>Kod: <span id="double-room-code">${bulkDoubleEscape(r.code)}</span></h2></div><button data-double-action="net-copy">Kopiuj kod</button></div><p>Znajomi: terminal statku → Bird Game 3 → CSV Double → wpisz ten kod. Wszyscy grają na tym samym serwerze.</p><ul class="dbl-net-roster">${r.players.map((p) => `<li><b>${bulkDoubleEscape(p.name)}${p.id === r.meId ? ' · TY' : ''}</b><span>${p.id === r.hostId ? 'GOSPODARZ · ' : ''}${!p.connected ? 'ROZŁĄCZONY' : p.ready ? 'GOTOWY' : 'CZEKA'}</span></li>`).join('')}</ul><label>Kara za pomyłkę<select id="double-net-cooldown" ${!this.host || !this.connected ? 'disabled' : ''}>${[1000, 1500, 2000].map((ms) => `<option value="${ms}" ${ms === r.cooldown ? 'selected' : ''}>${ms / 1000} s</option>`).join('')}</select></label><p class="dbl-net-notice" role="status">${bulkDoubleEscape(this.notice || 'Ustaw gotowość. Gospodarz rozpocznie mecz, gdy wszyscy będą gotowi.')}</p><div class="dbl-net-actions"><button class="primary" data-double-action="net-ready" ${!this.connected ? 'disabled' : ''}>${this.me?.ready ? 'Cofnij gotowość' : 'Jestem gotowy'}</button><button data-double-action="net-start" ${!this.host || !allReady || !this.connected ? 'disabled' : ''}>Rozpocznij wspólny mecz</button><button data-double-action="net-leave">Opuść pokój</button></div><p class="micro">Wspólny start i 31 kart. Wygrywa najwięcej przejętych kart. Błędna odpowiedź blokuje tylko jej autora. Pierwszą poprawną odpowiedź rozstrzyga serwer według kolejności odbioru; opóźnienie połączenia ma znaczenie.</p></section>`;
  }
  controlsHTML() {
    return `<div class="dbl-controls"><span>ONLINE · POKÓJ ${bulkDoubleEscape(this.room?.code || '')}</span><button data-double-action="sound">Dźwięk: ${this.owner.settings.sound ? 'ON' : 'OFF'}</button><button data-double-action="net-pause" ${!this.host || !this.connected ? 'disabled' : ''}>${this.owner.model.state === 'PAUSED' ? '▶ Wznów' : 'Ⅱ Pauza gospodarza'}</button><button data-double-action="net-leave">Opuść pokój</button></div>${this.notice ? `<p class="dbl-net-notice" role="status">${bulkDoubleEscape(this.notice)}</p>` : ''}`;
  }
  pauseHTML() {
    const reconnecting = !this.connected || this.room?.pauseReason === 'connection';
    const canResume = this.host && this.connected && this.room.players.every((p) => p.connected);
    return `<div class="dbl-cover"><div><span>${reconnecting ? 'ODZYSKIWANIE POŁĄCZENIA' : 'WSPÓLNA PAUZA'}</span><h2>Wstrzymano stół.</h2><p>${bulkDoubleEscape(reconnecting ? 'Serwer czeka do 30 s na powrót graczy. Czas i kary stoją.' : 'Gospodarz wstrzymał mecz. Pozostali gracze nie mogą zmieniać jego zegara.')}</p>${this.notice ? `<p role="status">${bulkDoubleEscape(this.notice)}</p>` : ''}<button class="primary" data-double-action="net-pause" ${canResume ? '' : 'disabled'}>▶ Wznów jako gospodarz</button><button data-double-action="net-leave">Opuść pokój</button></div></div>`;
  }
  setNotice(text) {
    this.notice = text;
    this.owner.render();
  }
  send(message) {
    if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  action(action) {
    if (['net-create', 'net-join', 'net-resume'].includes(action)) {
      if (!this.enabled || this.active) return;
      const name = this.owner.$('double-net-name')?.value.trim().slice(0, 24) || 'Ptasia Admin';
      const code = this.owner.$('double-net-code')?.value.trim().toUpperCase();
      if (action === 'net-join' && !/^[A-F0-9]{6}$/.test(code || '')) {
        this.setNotice('Wpisz sześcioznakowy kod pokoju.');
        return;
      }
      if (action === 'net-resume' && !this.resume) return;
      this.active = true;
      this.localModel = this.owner.model;
      this.attempts = 0;
      this.intent =
        action === 'net-create'
          ? { t: 'create', name }
          : action === 'net-resume'
            ? { t: 'join', code: this.resume.code, token: this.resume.token }
            : { t: 'join', code, name };
      this.notice = 'Łączę ze stołem CSV Double…';
      this.open();
      this.owner.render();
      return;
    }
    if (action === 'net-leave') {
      this.leave();
      return;
    }
    if (action === 'net-copy') {
      navigator.clipboard?.writeText(this.room.code).then(
        () => this.setNotice('Kod pokoju skopiowany.'),
        () => this.setNotice('Kod do skopiowania: ' + this.room.code),
      );
      return;
    }
    if (action === 'net-ready') this.send({ t: 'ready', ready: !this.me?.ready });
    if (action === 'net-start') this.send({ t: 'start' });
    if (action === 'net-pause' && this.host) this.send({ t: 'pause' });
    if (action === 'net-lobby' && this.host) this.send({ t: 'lobby' });
  }
  changeCooldown(value) {
    if (this.host) this.send({ t: 'settings', cooldown: Number(value) });
  }
  answer(symbol, token) {
    if (!this.active) return;
    this.send({ t: 'answer', symbol, ...token, seq: ++this.seq });
  }
  open() {
    if (this.dead || !this.active || !this.enabled) return;
    clearTimeout(this.retryTimer);
    clearTimeout(this.handshake);
    clearInterval(this.ping);
    this.ping = null;
    const generation = ++this.generation;
    this.connected = false;
    let sentIntent = false;
    try {
      const url = new URL(this.endpoint);
      if (
        !['ws:', 'wss:'].includes(url.protocol) ||
        url.pathname !== '/ws/double' ||
        url.username ||
        url.password
      )
        throw Error('Niepoprawny adres serwera.');
      this.socket = new WebSocket(url);
    } catch {
      this.failed('Nie udało się otworzyć połączenia ze stołem.');
      return;
    }
    const socket = this.socket;
    const current = () =>
      !this.dead && this.active && generation === this.generation && this.socket === socket;
    this.handshake = setTimeout(() => {
      if (current()) {
        socket.close();
        this.failed('Serwer CSV Double nie odpowiedział. Solo jest nadal dostępne.');
      }
    }, 8000);
    socket.onmessage = (event) => {
      if (!current()) return;
      let m;
      try {
        m = JSON.parse(event.data);
      } catch {
        return;
      }
      if (m.t === 'welcome') {
        this.credentials = { id: m.id, token: m.token };
        if (!sentIntent) {
          sentIntent = true;
          socket.send(JSON.stringify(this.intent));
        }
        return;
      }
      if (m.t === 'room') {
        clearTimeout(this.handshake);
        this.connected = true;
        this.attempts = 0;
        this.notice = '';
        this.room = m.room;
        this.resume = { endpoint: this.endpoint, code: m.room.code, token: this.credentials.token };
        try {
          sessionStorage.setItem('bulk-import-csv-double-session-v1', JSON.stringify(this.resume));
        } catch {}
        if (m.room.phase === 'LOBBY') {
          this.owner.model = this.localModel;
          this.owner.model.state = 'MENU';
        }
        if (!this.ping) this.ping = setInterval(() => this.send({ t: 'ping' }), 20000);
        this.owner.render();
        return;
      }
      if (m.t === 'state') {
        const previous = this.owner.model;
        if (
          previous instanceof BulkDoubleRemoteView &&
          (m.state.session < previous.session ||
            (m.state.session === previous.session && m.state.revision < previous.revision))
        )
          return;
        this.connected = true;
        this.owner.model = new BulkDoubleRemoteView(m.state, this);
        if (m.state.session !== previous.session) this.owner.lastCountdown = 0;
        if (m.state.state === 'GAME_OVER' && previous.state !== 'GAME_OVER') this.owner.tone(1150);
        else if (m.state.feedback?.at !== previous.feedback?.at && m.state.feedback)
          this.owner.tone(155);
        else if (m.state.lastAward?.roundId !== previous.lastAward?.roundId && m.state.lastAward)
          this.owner.tone(m.state.lastAward.participant === 0 ? 880 : 430);
        this.owner.render();
        return;
      }
      if (m.t === 'error') {
        if (!this.room || !this.connected) {
          this.failed(m.message || 'Nie udało się dołączyć do stołu.');
          return;
        }
        this.setNotice(m.message);
        return;
      }
    };
    socket.onclose = () => {
      if (!current()) return;
      clearTimeout(this.handshake);
      clearInterval(this.ping);
      this.ping = null;
      this.connected = false;
      if (!this.room || !this.resume) {
        this.failed('Serwer stołu jest niedostępny. Solo i boty nadal działają.');
        return;
      }
      this.notice = 'Utracono połączenie. Wznawiam ten sam mecz… (serwer czeka do 30 s)';
      if (this.owner.model instanceof BulkDoubleRemoteView) this.owner.model.state = 'PAUSED';
      this.owner.render();
      if (this.attempts >= 5) {
        this.notice = 'Nie udało się wznowić połączenia. Opuść pokój i spróbuj ponownie.';
        this.owner.render();
        return;
      }
      this.intent = { t: 'join', code: this.resume.code, token: this.resume.token };
      this.retryTimer = setTimeout(() => this.open(), Math.min(4000, 500 * 2 ** this.attempts++));
    };
    socket.onerror = () => {};
  }
  failed(message) {
    this.leave(false);
    this.notice = message;
    this.owner.render();
  }
  leave(clear = true) {
    this.send({ t: 'leave' });
    this.active = false;
    this.connected = false;
    this.generation++;
    clearTimeout(this.retryTimer);
    clearTimeout(this.handshake);
    clearInterval(this.ping);
    this.ping = null;
    this.socket?.close();
    this.socket = null;
    this.room = null;
    this.seq = 0;
    if (clear) {
      this.resume = null;
      try {
        sessionStorage.removeItem('bulk-import-csv-double-session-v1');
      } catch {}
    }
    this.owner.model = this.localModel;
    this.owner.render();
  }
  destroy() {
    this.dead = true;
    this.leave();
  }
}
if (typeof window !== 'undefined') window.BulkDoubleNetwork = BulkDoubleNetwork;
