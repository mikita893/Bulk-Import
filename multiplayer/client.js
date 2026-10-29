'use strict';
(() => {
  const $ = (id) => document.getElementById(id),
    SESSION_KEY = 'bulk-import-multi-session-v11',
    COOP_KEY = 'bulk-import-coop-v11';
  const sessionStore = {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key),
  };
  const persistentStore = window.BulkUnified.storage;
  const sharedUpgrades = {
    damage: { label: 'External ID', description: 'Silniejszy import pocisków.', baseCost: 250 },
    rate: {
      label: 'Bulk API',
      description: 'Szybsze strzelanie, mniej czekania na batch.',
      baseCost: 250,
    },
    armor: {
      label: 'Pancerz Enterprise',
      description: 'Większa pojemność życia oddziału.',
      baseCost: 250,
    },
    shield: {
      label: 'Permission Set',
      description: 'Więcej tarczy dla całej załogi.',
      baseCost: 250,
    },
    plating: { label: 'Validation Rule', description: 'Mniejsze obrażenia życia.', baseCost: 250 },
    biotic: { label: 'Apex Trigger', description: 'Mocniejszy efekt masy.', baseCost: 250 },
    mobility: { label: 'Async ZIPsert', description: 'Krótsze odnowienie dasha.', baseCost: 250 },
  };
  const fallbackFactionKits = {
    salesforce: {
      ability: {
        name: 'Apex: SELECT * FROM WROGOWIE',
        description:
          'Celowany promień zapytania. 30 obrażeń, zasięg 18 m, do dwóch wrogów; osłony zatrzymują zapytanie.',
        cooldown: 9,
      },
      secondary: {
        name: 'Permission Set: NIE MASZ DOSTĘPU',
        description:
          'Kierunkowa osłona na 2,2 s, budżet 42 obrażeń. Ustaw ją w kierunku ostrzału; nie chroni pleców.',
        cooldown: 12,
      },
      dash: {
        name: 'ZIPsert',
        description: 'Długi skok 5,6 m; odnawia się co 3,5 s.',
        cooldown: 3.5,
      },
    },
    excel: {
      ability: {
        name: 'Tabela przestawna',
        description:
          'Wskazana kratka 6×5 m wybucha po 0,9 s: 28 obrażeń i krótkie spowolnienie. Wyjdź z zaznaczenia!',
        cooldown: 9,
      },
      secondary: {
        name: 'Cofnij — Ctrl+Z',
        description:
          'Po 0,25 s cofa do 28 obrażeń otrzymanych w ostatnich 2 s. Nie wskrzesza i nie leczy starego długu.',
        cooldown: 12,
      },
      dash: {
        name: 'Przeciągnij komórkę',
        description: 'Krótki skok 4,2 m; odnawia się co 2,6 s.',
        cooldown: 2.6,
      },
    },
  };
  const initialMissions = [
    'Port Duplikatów',
    'Archiwum Zaginionych ID',
    'Kolejka Zbieraczy',
    'Firewall Gethów',
    'Dreamforce: Czerwony Alarm',
    'Excel: Import Ostateczny',
  ];
  const app = {
    room: null,
    state: null,
    id: null,
    token: null,
    socket: null,
    ready: false,
    attempts: 0,
    desired: true,
    endpoint: '',
    resume: null,
    resumeAttempted: false,
    resumePending: false,
    pending: [],
    seq: 0,
    ping: 0,
    lastStateAt: 0,
    noticeUntil: 0,
    toastUntil: 0,
    manualLobby: false,
    help: false,
    config: {
      missions: window.BULK_CLIENT_CONFIG?.missions || initialMissions.map((name) => ({ name })),
      upgrades: window.BULK_CLIENT_CONFIG?.upgrades || sharedUpgrades,
      factionKits:
        window.BULK_CLIENT_CONFIG?.factionKits ||
        window.BULK_CLIENT_CONFIG?.kits ||
        fallbackFactionKits,
    },
    campaign: null,
    lastRoomKey: '',
    lastStatePhase: '',
    lastRoster: '',
    lastScores: '',
    lastCampaign: '',
    lastUpgrade: '',
    lastKits: '',
    kitRevision: 0,
    lastEventId: -1,
    lastSoundShots: new Set(),
    renderError: null,
  };
  let renderer = null,
    reconnectTimer = null,
    pingTimer = null,
    sessionTimer = null,
    last = 0,
    hudTimer = 0,
    radarTimer = 0,
    audioCtx = null,
    audioOn = true,
    quality = 'auto',
    mouse = { has: false, x: 0, y: 0, fire: false },
    keys = {},
    edge = { dash: false, ability: false, secondary: false },
    aim = { x: 0, z: -10 };
  const sounds = { shotAt: 0, hitAt: 0 };
  function loadJSON(store, key) {
    try {
      return JSON.parse(store.getItem(key) || 'null');
    } catch {
      return null;
    }
  }
  function storeJSON(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  function removeStored(store, key) {
    try {
      store.removeItem(key);
    } catch {}
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }
  function text(id, value) {
    const node = $(id),
      str = String(value);
    if (node.textContent !== str) node.textContent = str;
  }
  function bar(id, fraction) {
    const width =
      (Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0)) * 100).toFixed(1) + '%';
    if ($(id).style.width !== width) $(id).style.width = width;
  }
  function sound(freq, duration = 0.08, type = 'sine', volume = 0.02) {
    if (!audioOn) return;
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator(),
        g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        Math.max(30, freq * 0.5),
        audioCtx.currentTime + duration,
      );
      g.gain.setValueAtTime(volume, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + duration);
    } catch {}
  }
  function notice(message, seconds = 6) {
    text('notice', message);
    app.noticeUntil = performance.now() + seconds * 1000;
  }
  function toast(message, seconds = 1.8) {
    text('combat-toast', message);
    $('combat-toast').style.opacity = '1';
    app.toastUntil = performance.now() + seconds * 1000;
  }
  function setConnection(state, label) {
    window.BulkUnified.networkReady(state === 'online');
    $('connection').dataset.state = state;
    text('connection', label);
    $('world').classList.toggle('offline-cover', state === 'offline' && !!app.room);
  }
  function localPlayer() {
    return app.state?.players?.find((p) => p.id === app.id) || null;
  }
  function localMember() {
    return app.room?.players?.find((p) => p.id === app.id) || null;
  }
  function isHost() {
    return !!app.room && app.room.hostId === app.id;
  }
  function displayName() {
    return $('player-name').value.trim().slice(0, 20) || 'Administrator';
  }
  function updateSavedSession() {
    if (
      app.ready &&
      app.room &&
      app.id &&
      app.token &&
      !app.resumePending &&
      app.room.players?.some((p) => p.id === app.id && p.connected !== false)
    ) {
      app.resume = {
        code: app.room.code,
        name: displayName(),
        token: app.token,
        endpoint: app.endpoint,
      };
      storeJSON(sessionStore, SESSION_KEY, app.resume);
    }
  }
  function clearSession() {
    app.resume = null;
    app.resumePending = false;
    removeStored(sessionStore, SESSION_KEY);
  }
  function serverURL(value) {
    const raw = (value || '').trim();
    if (!raw) throw Error('Wpisz adres serwera multiplayer.');
    const u = new URL(raw, /^https?:$/.test(location.protocol) ? location.href : undefined);
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(u.protocol))
      throw Error('Adres serwera musi zaczynać się od https:// lub http://.');
    if (u.username || u.password) throw Error('Wpisz adres bez danych logowania.');
    if (location.protocol === 'https:' && ['http:', 'ws:'].includes(u.protocol))
      throw Error('Ta strona wymaga bezpiecznego serwera https://.');
    u.protocol = ['https:', 'wss:'].includes(u.protocol) ? 'wss:' : 'ws:';
    u.pathname = '/ws';
    u.search = '';
    u.hash = '';
    return u.toString();
  }
  function send(data, queue = false) {
    if (window.BulkUnified.local) return false;
    if (app.socket?.readyState === WebSocket.OPEN && app.ready) {
      app.socket.send(JSON.stringify(data));
      return true;
    }
    if (queue) {
      app.pending.push(data);
      if (app.pending.length > 4) app.pending.shift();
      if (!app.socket || app.socket.readyState >= WebSocket.CLOSING) connect();
    } else notice('Brak połączenia. Przywróć łączność z serwerem.');
    return false;
  }
  function updateName() {
    storeJSON(persistentStore, 'bulk-import-player-name-v11', displayName());
  }
  function startRequest(mode) {
    if (window.BulkUnified.local || window.BulkUnified.screen !== 'main') return;
    ensureRenderer();
    updateName();
    clearSession();
    app.manualLobby = false;
    app.pending = [];
    const request = { t: 'create', name: displayName(), mode };
    if (!send(request, true)) notice('Łączę z serwerem, aby utworzyć pokój…');
  }
  function joinRequest() {
    if (window.BulkUnified.local || window.BulkUnified.screen !== 'main') return;
    ensureRenderer();
    const code = $('join-code')
      .value.toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) {
      notice('Wpisz kod pokoju otrzymany od znajomego.');
      $('join-code').focus();
      return;
    }
    updateName();
    clearSession();
    app.pending = [];
    send({ t: 'join', code, name: displayName() }, true);
  }
  function scheduleReconnect() {
    if (!app.desired || app.attempts >= 6) {
      setConnection('offline', 'BRAK POŁĄCZENIA');
      notice(
        'Nie udało się wznowić połączenia. Użyj „Połącz ponownie” lub sprawdź adres serwera.',
        12,
      );
      return;
    }
    const delay = Math.min(10000, 1000 * 2 ** app.attempts);
    app.attempts++;
    setConnection('connecting', 'PONAWIANIE ' + app.attempts + '/6');
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connect(false), delay);
  }
  function connect(manual = false) {
    if (window.BulkUnified.local || window.BulkUnified.screen !== 'main') return;
    if (manual) {
      app.attempts = 0;
      app.desired = true;
    }
    if (app.socket && app.socket.readyState <= WebSocket.OPEN) return;
    let endpoint;
    try {
      endpoint = serverURL($('server-url').value);
    } catch (e) {
      setConnection('offline', 'PODAJ SERWER');
      text('network-note', e.message);
      $('network-details').open = true;
      return;
    }
    clearTimeout(reconnectTimer);
    app.endpoint = endpoint;
    app.ready = false;
    app.resumeAttempted = false;
    app.resumePending = false;
    setConnection('connecting', 'ŁĄCZENIE…');
    let socket;
    try {
      socket = new WebSocket(endpoint);
    } catch (e) {
      setConnection('offline', 'BŁĄD ADRESU');
      notice(e.message);
      return;
    }
    app.socket = socket;
    const handshake = setTimeout(() => {
      if (app.socket === socket && !app.ready) {
        try {
          socket.close();
        } catch {}
      }
    }, 10000);
    socket.addEventListener('open', () => {
      if (app.socket !== socket) return;
      text('network-note', 'Połączenie WebSocket: ' + endpoint);
    });
    socket.addEventListener('message', (event) => {
      if (app.socket !== socket) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      handleMessage(data);
    });
    socket.addEventListener('close', () => {
      clearTimeout(handshake);
      if (app.socket !== socket) return;
      app.ready = false;
      keys = {};
      mouse.fire = false;
      edge = { dash: false, ability: false, secondary: false };
      clearInterval(pingTimer);
      if (app.room) {
        const member = app.room.players?.find((p) => p.id === app.id);
        if (member) member.connected = false;
        app.manualLobby = false;
        renderLobby(true);
        notice('Połączenie przerwane. Próbuję wrócić do twojego miejsca w pokoju.', 10);
      }
      if (app.desired) scheduleReconnect();
    });
    socket.addEventListener('error', () => {
      if (app.socket !== socket) return;
      setConnection('offline', 'SERWER NIEDOSTĘPNY');
    });
  }
  async function loadConfig() {
    try {
      const u = new URL(app.endpoint);
      u.protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
      u.pathname = '/api/config';
      const response = await fetch(u.toString(), { credentials: 'omit' });
      if (!response.ok) return;
      const config = await response.json();
      if (Array.isArray(config.missions)) app.config.missions = config.missions;
      if (config.upgrades && typeof config.upgrades === 'object')
        app.config.upgrades = config.upgrades;
      if (config.factionKits && typeof config.factionKits === 'object')
        app.config.factionKits = config.factionKits;
      else if (config.kits && typeof config.kits === 'object') app.config.factionKits = config.kits;
      app.kitRevision++;
      app.lastUpgrade = '';
      renderLobby(true);
      updateHud();
    } catch {}
  }
  function handleMessage(data) {
    if (!data || typeof data.t !== 'string') return;
    switch (data.t) {
      case 'welcome': {
        const saved = app.resume;
        app.id = data.id;
        app.token = data.token;
        app.ready = true;
        app.attempts = 0;
        setConnection('online', 'POŁĄCZONO');
        clearInterval(pingTimer);
        pingTimer = setInterval(() => {
          if (app.ready) send({ t: 'ping', at: Date.now() });
        }, 3000);
        send({ t: 'ping', at: Date.now() });
        if (!app.resumeAttempted) {
          app.resumeAttempted = true;
          if (saved?.code && saved?.token && app.pending.length === 0) {
            app.resumePending = true;
            send({
              t: 'join',
              code: saved.code,
              name: saved.name || displayName(),
              token: saved.token,
            });
            notice('Wznawiam połączenie z pokojem ' + saved.code + '…');
          } else {
            const pending = app.pending.splice(0);
            for (const msg of pending) send(msg);
          }
        }
        loadConfig();
        break;
      }
      case 'room': {
        const previousCode = app.room?.code;
        app.room = data.room;
        if (app.room?.meId) app.id = app.room.meId;
        app.resumePending = false;
        if (!app.room) {
          app.state = null;
          clearSession();
          renderer?.reset();
          showPanels();
          break;
        }
        updateSavedSession();
        if (previousCode !== app.room.code) {
          app.state = null;
          app.manualLobby = false;
          app.lastEventId = -1;
          renderer?.reset();
          sound(620, 0.18, 'triangle', 0.025);
        }
        renderLobby(true);
        updateHud();
        showPanels();
        break;
      }
      case 'state': {
        if (!data.state) return;
        ensureRenderer();
        const oldPhase = app.state?.phase;
        app.state = data.state;
        app.lastStateAt = performance.now();
        renderer?.setState(app.state, app.id);
        if (oldPhase === 'finished' && app.state.phase === 'playing') app.lastEventId = -1;
        if (oldPhase !== app.state.phase) {
          app.manualLobby = false;
          keys = {};
          mouse.fire = false;
          edge = { dash: false, ability: false, secondary: false };
          if (app.state.phase === 'intermission') sound(640, 0.25, 'triangle', 0.025);
          if (app.state.phase === 'finished')
            sound(app.state.result?.winner === 'excel' ? 170 : 830, 0.4, 'triangle', 0.035);
        }
        processEvents(app.state.events);
        updateHud();
        showPanels();
        break;
      }
      case 'pong': {
        if (Number.isFinite(data.at)) {
          app.ping = Math.max(0, Math.min(9999, Date.now() - data.at));
          text('ping', app.ping + ' ms');
        }
        break;
      }
      case 'error': {
        notice(data.message || 'Serwer odrzucił tę operację.');
        if (app.resumePending) {
          app.resumePending = false;
          app.room = null;
          app.state = null;
          clearSession();
          renderer?.reset();
          showPanels();
        }
        renderLobby(true);
        break;
      }
      case 'campaign': {
        if (data.campaign) {
          app.campaign = data.campaign;
          storeJSON(persistentStore, COOP_KEY, data.campaign);
          $('resume-campaign').hidden = false;
          if (app.exportRequested) {
            app.exportRequested = false;
            downloadJSON(data.campaign);
            notice(
              'Checkpoint kooperacji wyeksportowany. Kopia zapisana również w tej przeglądarce.',
            );
          }
        }
        break;
      }
      case 'left': {
        app.room = null;
        app.state = null;
        clearSession();
        renderer?.reset();
        showPanels();
        break;
      }
    }
  }
  function processEvents(events) {
    if (!Array.isArray(events)) return;
    for (const event of events) {
      if (typeof event.id === 'number' && event.id <= app.lastEventId) continue;
      if (typeof event.id === 'number') app.lastEventId = event.id;
      if (typeof event.text === 'string') {
        text('radio', event.text);
        notice(event.text);
        if (/MARC|ZWIASTUN|EXCEL|ZWYCIĘ|WYGR|DUPLICATE|URATOW|POKON/i.test(event.text)) {
          toast(event.text.length > 105 ? event.text.slice(0, 102) + '…' : event.text);
          sound(620, 0.1, 'triangle', 0.015);
        }
      }
    }
  }
  function showPanels() {
    const room = app.room,
      phase = app.state?.phase || room?.phase;
    const hasRoom = !!room;
    $('home').hidden = hasRoom;
    $('lobby').hidden = !hasRoom || !(phase === 'lobby' || app.manualLobby);
    $('between').hidden =
      !hasRoom || app.manualLobby || !['intermission', 'finished'].includes(phase);
    $('help').hidden = !app.help;
    $('live-actions').hidden = !hasRoom;
    $('room-menu').hidden = !hasRoom;
    if (hasRoom && ['intermission', 'finished'].includes(phase)) renderBetween();
  }
  function readyState() {
    return localMember()?.ready === true;
  }
  function kitFor(team = 'salesforce', mode = 'versus') {
    const key = team === 'excel' ? 'excel' : 'salesforce',
      fallback = fallbackFactionKits[key],
      configured = app.config.factionKits?.[key] || {};
    const kit = {
      ability: { ...fallback.ability, ...configured.ability },
      secondary: { ...fallback.secondary, ...configured.secondary },
      dash: { ...fallback.dash, ...configured.dash },
    };
    if (mode === 'coop')
      kit.ability = {
        name: 'Mass Update: efekt masy',
        description:
          'Impuls wokół administratora rani wrogów i usuwa nadlatujące pociski. Ulepszenie biotyki wzmacnia moc.',
        cooldown: 10,
      };
    return kit;
  }
  function skillCard(team, selected = false, mode = 'versus') {
    const kit = kitFor(team, mode),
      sf = team === 'salesforce';
    const rows = [
      ['Q', kit.ability],
      ['F', kit.secondary],
      ['C / R', kit.dash],
    ]
      .map(
        ([key, skill]) =>
          '<div class="kit-skill"><kbd>' +
          key +
          '</kbd><div><b>' +
          escapeHTML(skill.name) +
          '</b><p>' +
          escapeHTML(skill.description || '') +
          '</p><small>' +
          (Number.isFinite(skill.cooldown) ? 'Odnowienie: ' + skill.cooldown + ' s' : '') +
          '</small></div></div>',
      )
      .join('');
    const counter = sf
      ? 'Kontra: schowaj się za osłoną przed zapytaniem. Permission Set ma przód i plecy — obejdź go, zamiast kłócić się z administratorem.'
      : 'Kontra: wyjdź z zaznaczonej kratki przed 0,9 s. Ctrl+Z cofa tylko świeże obrażenia; nie zostawiaj starego długu na później.';
    return (
      '<article class="faction-kit ' +
      (sf ? 'salesforce' : 'excel') +
      (selected ? ' selected' : '') +
      '" data-faction-kit="' +
      team +
      '"><header><h3>' +
      (sf ? '☁ Salesforce' : '▦ Excel') +
      '</h3><span>' +
      (selected ? 'TWÓJ ZESTAW' : sf ? 'PRECYZJA / OSŁONA' : 'OBSZAR / COFNIĘCIE') +
      '</span></header>' +
      rows +
      '<p class="kit-counter">' +
      escapeHTML(counter) +
      '</p></article>'
    );
  }
  function renderFactionInformation(force = false) {
    const mode = app.room?.mode || app.state?.mode || 'versus',
      team = localMember()?.team || localPlayer()?.team || 'salesforce',
      key = mode + '|' + team + '|' + app.kitRevision;
    if (!force && key === app.lastKits) return;
    app.lastKits = key;
    const kit = kitFor(team, mode),
      sf = team !== 'excel';
    $('selected-kit').innerHTML =
      '<div class="kit-summary-title">TWÓJ ZESTAW · ' +
      (sf ? 'SALESFORCE' : 'EXCEL') +
      '</div><div class="kit-summary-skills">' +
      [
        ['Q', kit.ability],
        ['F', kit.secondary],
        ['C / R', kit.dash],
      ]
        .map(([k, skill]) => '<span><kbd>' + k + '</kbd> ' + escapeHTML(skill.name) + '</span>')
        .join('') +
      '</div><p>' +
      escapeHTML(
        mode === 'coop'
          ? 'Wspieraj drużynę impulsem Q i ustawiaj osłonę F w kierunku ostrzału.'
          : sf
            ? 'Trafiaj zapytaniem po linii. Osłona F broni przodu; Excel może cię obejść.'
            : 'Wskaż pole pod tabelę Q. F cofa tylko najświeższe obrażenia — księgowość nie uznaje starych faktur.',
      ) +
      '</p>';
    $('kit-comparison').hidden = mode === 'coop';
    $('faction-kits').innerHTML =
      skillCard('salesforce', team === 'salesforce') + skillCard('excel', team === 'excel');
    $('help-faction-kits').innerHTML =
      mode === 'coop'
        ? skillCard('salesforce', true, 'coop')
        : skillCard('salesforce', team === 'salesforce') + skillCard('excel', team === 'excel');
  }
  function renderLobby(force = false) {
    const room = app.room;
    if (!room) return;
    const phase = app.state?.phase || room.phase || 'lobby',
      lobby = phase === 'lobby',
      host = isHost(),
      members = room.players || [],
      team = localMember()?.team;
    text('room-code', room.code);
    text('room-badge', room.code);
    text(
      'lobby-mode',
      room.mode === 'coop' ? 'KOOPERACJA / WSPÓLNA KAMPANIA' : 'VERSUS / SALESFORCE KONTRA EXCEL',
    );
    text(
      'lobby-hint',
      room.mode === 'coop'
        ? 'Oddział do 3 graczy. Host wybiera misję i rozpoczyna wspólny import. Apteczka jest tańsza niż utrata całego batcha.'
        : 'Maksymalnie 3 graczy na frakcję. Aby wystartować, obie strony muszą mieć tyle samo gotowych graczy. Kolejność w Excelu nie daje bonusu.',
    );
    renderFactionInformation(force);
    const invite = new URL(location.href);
    invite.search = '';
    invite.hash = '';
    invite.searchParams.set('room', room.code);
    $('invite-link').value = invite.toString();
    const key = JSON.stringify(members.map((p) => [p.id, p.name, p.team, p.ready, p.connected]));
    if (force || key !== app.lastRoster) {
      app.lastRoster = key;
      $('roster').innerHTML = members
        .map(
          (p) =>
            '<div class="roster-row"><div><b>' +
            escapeHTML(p.name) +
            (p.id === app.id ? ' · TY' : '') +
            '</b><small>' +
            (p.id === room.hostId ? 'HOST · ' : '') +
            (p.connected === false ? 'ODŁĄCZONY' : 'POŁĄCZONY') +
            '</small></div><span class="team-tag ' +
            (p.team === 'excel' ? 'excel' : '') +
            '">' +
            (p.team === 'excel' ? '▦ Excel' : '☁ Salesforce') +
            '</span><span class="ready-tag ' +
            (p.ready ? 'ready' : '') +
            '">' +
            (p.ready ? 'GOTOWY' : 'CZEKA') +
            '</span></div>',
        )
        .join('');
    }
    $('team-actions').hidden = room.mode !== 'versus';
    $('team-salesforce').disabled = !lobby || team === 'salesforce';
    $('team-excel').disabled = !lobby || team === 'excel';
    $('team-salesforce').classList.toggle('active', team === 'salesforce');
    $('team-excel').classList.toggle('active', team === 'excel');
    $('ready-button').disabled = !lobby;
    text('ready-button', readyState() ? '✓ Gotowy — zmień' : 'Jestem gotowy');
    const sf = members.filter((p) => p.team === 'salesforce' && p.connected !== false).length,
      ex = members.filter((p) => p.team === 'excel' && p.connected !== false).length,
      allReady = members.length > 0 && members.every((p) => p.ready && p.connected !== false),
      balanced =
        room.mode === 'coop'
          ? members.length >= 1 && members.length <= 3
          : sf >= 1 && sf === ex && sf <= 3;
    $('return-game').hidden = lobby;
    text(
      'return-game',
      ['intermission', 'finished'].includes(phase) ? 'Wróć do raportu' : 'Wróć do walki',
    );
    $('start-match').disabled = !host || !lobby || !allReady || !balanced;
    text(
      'start-reason',
      !lobby
        ? 'Trwa wspólna rozgrywka. Widok pokoju nie zatrzymuje walki.'
        : !host
          ? 'Mecz rozpoczyna host po potwierdzeniu gotowości.'
          : !balanced
            ? 'VS wymaga równych drużyn: 1×1, 2×2 lub 3×3.'
            : !allReady
              ? 'Każdy gracz musi wybrać „Jestem gotowy”.'
              : 'Wszyscy gotowi. Niech wygra najlepszy import.',
    );
    $('mission-picker').hidden = room.mode !== 'coop';
    $('coop-mission').disabled = !host || !lobby;
    const cp = room.campaign || {},
      missions = app.config.missions || [],
      unlocked = Number.isInteger(cp.unlocked) ? cp.unlocked : 0;
    const optionsKey = missions
      .map((m, i) => [i, m.name, i > unlocked])
      .flat()
      .join('|');
    if ($('coop-mission').dataset.key !== optionsKey) {
      $('coop-mission').dataset.key = optionsKey;
      $('coop-mission').innerHTML = missions
        .map(
          (m, i) =>
            '<option value="' +
            i +
            '"' +
            (i > unlocked ? ' disabled' : '') +
            '>' +
            String(i + 1).padStart(2, '0') +
            ' / ' +
            escapeHTML(m.name || 'Operacja ' + (i + 1)) +
            (i > unlocked ? ' · ZABLOKOWANA' : '') +
            '</option>',
        )
        .join('');
    }
    $('coop-mission').value = String(cp.mission || 0);
    text(
      'campaign-info',
      'Wspólny budżet: ' +
        (cp.credits || 0) +
        ' CR · Odblokowane misje: ' +
        Math.min(missions.length, unlocked + 1) +
        ' / ' +
        missions.length,
    );
    $('export-campaign').hidden = $('import-campaign').hidden = room.mode !== 'coop';
    $('export-campaign').disabled = !host;
    $('import-campaign').disabled = !host || !lobby;
    $('resume-campaign').hidden = room.mode !== 'coop' || !loadJSON(persistentStore, COOP_KEY);
    $('resume-campaign').disabled = !host || !lobby;
  }
  function resultText(state) {
    const r = state.result;
    if (!r) return state.phase === 'intermission' ? 'Żniwa zakończone' : 'Mecz zakończony';
    if (typeof r === 'string')
      return r === 'victory' ? 'OPERACJA UKOŃCZONA' : r === 'defeat' ? 'EWAKUACJA ODDZIAŁU' : r;
    if (r.winner === 'draw' || r.draw) return 'REMIS / DWA POPRAWNE IMPORTY';
    if (r.winner === 'salesforce') return 'SALESFORCE WYGRYWA';
    if (r.winner === 'excel') return 'EXCEL WYGRYWA';
    if (r.victory || r.type === 'victory' || r.outcome === 'victory') return 'OPERACJA UKOŃCZONA';
    if (r.defeat || r.type === 'defeat' || r.outcome === 'defeat') return 'EWAKUACJA ODDZIAŁU';
    return r.reason || 'MECZ ZAKOŃCZONY';
  }
  function hasVictory(state) {
    const r = state.result;
    return (
      r === 'victory' ||
      r?.victory ||
      r?.type === 'victory' ||
      r?.outcome === 'victory' ||
      r?.winner === 'coop' ||
      (r?.winner === 'salesforce' && state.mode === 'coop')
    );
  }
  function renderBetween() {
    const state = app.state;
    if (!state) return;
    const co = state.mode === 'coop',
      finished = state.phase === 'finished',
      host = isHost();
    text(
      'between-tag',
      co ? 'SSV BULK IMPORT / WSPÓLNY DEPLOYMENT' : 'RAPORT / SALESFORCE KONTRA EXCEL',
    );
    text('between-title', finished ? resultText(state) : 'ŻNIWA ZAKOŃCZONE');
    text(
      'between-description',
      co
        ? finished
          ? hasVictory(state)
            ? 'Oddział zakończył operację. Postęp i wspólny sprzęt czekają na kolejną misję. Wyeksportuj checkpoint, żeby mieć kopię po restarcie serwera.'
            : 'Oddział został ewakuowany. Ulepszenia kampanii pozostają; przygotuj się i ponów operację.'
          : 'Chwila na wspólne ulepszenia. Każdy zakup wzmacnia cały oddział — bez rozliczania kolegi za API calle.'
        : 'Równa broń, różne sztuczki. Rewanż odnawia oba zestawy — teraz już wiesz, jak obchodzić osłonę i unikać tabel.',
    );
    $('between-scores').innerHTML = co
      ? '<p class="muted">Wspólny budżet: <b>' +
        Math.floor(state.teamCredits || app.room?.campaign?.credits || 0) +
        ' CR</b> · Misja: ' +
        escapeHTML(state.missionName || '') +
        '</p>'
      : '<div class="result-score"><span class="salesforce">☁ ' +
        (state.scores?.salesforce || 0) +
        '</span><span>:</span><span class="excel">▦ ' +
        (state.scores?.excel || 0) +
        '</span></div>';
    $('upgrade-shop').hidden = !co;
    if (co) {
      const levels = state.upgrades || app.room?.campaign?.upgrades || {},
        credits = state.teamCredits ?? app.room?.campaign?.credits ?? 0,
        defs = app.config.upgrades || sharedUpgrades;
      const sig = JSON.stringify([levels, credits, host]);
      if (app.lastUpgrade !== sig) {
        app.lastUpgrade = sig;
        $('upgrade-shop').replaceChildren();
        for (const [key, def] of Object.entries(defs)) {
          const level = levels[key] || 0,
            max = def.maxLevel || 5,
            cost = (def.baseCost || 250) * (level + 1),
            card = document.createElement('div');
          card.className = 'upgrade-card';
          const b = document.createElement('b');
          b.textContent = (def.label || key) + ' · ' + level + '/' + max;
          const small = document.createElement('small');
          small.textContent = def.description || '';
          const buy = document.createElement('button');
          buy.textContent = level >= max ? 'MAX' : cost + ' CR · ulepsz oddział';
          buy.disabled = !host || level >= max || credits < cost;
          buy.onclick = () => send({ t: 'upgrade', key });
          card.append(b, small, buy);
          $('upgrade-shop').appendChild(card);
        }
      }
    }
    text(
      'next-button',
      !co
        ? 'Rewanż'
        : !finished
          ? '▶ Następne żniwa'
          : hasVictory(state)
            ? '▶ Następna misja / kontynuuj'
            : '▶ Ponów misję',
    );
    $('next-button').disabled = !host;
    $('between-export').hidden = !co;
    $('between-export').disabled = !host;
    text(
      'between-note',
      host
        ? 'Host kontynuuje, kiedy oddział jest gotowy.'
        : 'Czekasz na decyzję hosta. Wróć do pokoju, aby sprawdzić załogę.',
    );
  }
  function updateHud() {
    const state = app.state,
      p = localPlayer(),
      room = app.room,
      phase = state?.phase || room?.phase;
    if (room) {
      text('room-badge', room.code);
      text(
        'mode-label',
        room.mode === 'coop'
          ? 'KOOPERACJA / ODDZIAŁ SALESFORCE'
          : 'VERSUS / SALESFORCE KONTRA EXCEL',
      );
    }
    if (state) {
      text(
        'mission-label',
        state.missionName || (state.mode === 'coop' ? 'IMPORT ODDZIAŁOWY' : 'SALESFORCE VS EXCEL'),
      );
      text(
        'objective',
        state.mode === 'coop'
          ? 'Osłaniaj oddział, omijaj ostrzeżenia i trzymaj E przy rannym koledze.'
          : 'Apex trafia po linii, tabela przestawna zaznacza obszar. Omijaj kratkę i atakuj osłonę od tyłu.',
      );
      text(
        'score-label',
        state.mode === 'coop'
          ? state.waves > 1
            ? 'ŻNIWA ' + state.wave + ' / ' + state.waves
            : 'OSTATECZNY POJEDYNEK'
          : (state.scores?.salesforce || 0) + ' : ' + (state.scores?.excel || 0),
      );
      const t = Math.max(0, Math.ceil(state.remaining || 0));
      text(
        'timer-label',
        state.mode === 'coop'
          ? 'ODDZIAŁ ' + (state.players?.length || 0) + ' · ŻYCIA ' + (state.teamLives ?? '—')
          : String(Math.floor(t / 60)).padStart(2, '0') +
              ':' +
              String(t % 60).padStart(2, '0') +
              ' / DO 15 ELIMINACJI',
      );
      const boss = state.enemies?.find((e) => ['boss', 'excel'].includes(e.type) && e.hp > 0);
      $('boss-hud').hidden = !boss;
      if (boss) {
        text(
          'boss-title',
          boss.type === 'excel' ? 'EXCEL / DUPLICATE_VALUE' : 'ZWIASTUN / ADMIN NADRZĘDNY',
        );
        text(
          'boss-state',
          boss.shielded
            ? 'NIETYKALNY / UŻYJ E PRZY WSPARCIU MARCA'
            : 'FAZA ' + (boss.phase || 1) + ' / CEL DOSTĘPNY',
        );
        bar('boss-fill', boss.hp / boss.maxHp);
      }
      text(
        'campaign-status',
        state.mode === 'coop'
          ? 'Misja ' +
              (state.mission + 1) +
              ' · Wspólny budżet ' +
              Math.floor(state.teamCredits || 0) +
              ' CR. Zakupy i checkpoint pomiędzy żniwami.'
          : 'Symetryczna arena · Bez przewagi z kampanii solo · Odrodzenie po eliminacji.',
      );
    }
    if (p) {
      text('hp-label', Math.max(0, Math.ceil(p.hp)) + ' / ' + p.maxHp);
      text('shield-label', Math.max(0, Math.ceil(p.shield)) + ' / ' + p.maxShield);
      bar('hp-fill', p.hp / p.maxHp);
      bar('shield-fill', p.maxShield ? p.shield / p.maxShield : 0);
      text(
        'player-state',
        p.connected === false
          ? 'ODŁĄCZONY'
          : p.downed
            ? 'RANNY / KOLEGA MOŻE CIĘ PODNIEŚĆ'
            : !p.alive
              ? 'ODRODZENIE ZA ' + Math.ceil(p.respawnIn || 0) + ' s'
              : p.barrierRemaining > 0
                ? 'OSŁONA Z PRZODU · ' + Math.ceil(p.barrierHp || 0) + ' PKT'
                : p.undoPending > 0
                  ? 'CTRL+Z · COFAMY ŚWIEŻE OBRAŻENIA'
                  : p.slowRemaining > 0
                    ? 'UTKNĄŁEŚ W TABELI · RUSZAJ SIĘ!'
                    : p.invulnerable
                      ? 'KRÓTKA OCHRONA / UNIK'
                      : 'KOMANDOR ' + (p.team === 'excel' ? 'ARKUSZ' : 'ADMIN'),
      );
      text('weapon-label', p.team === 'excel' ? 'DZIAŁO ARKUSZOWE' : 'DATA LOADER');
      const kit = kitFor(p.team, state?.mode);
      text(
        'dash-label',
        'C / R · ' +
          (p.dashName || kit.dash.name) +
          ' / ' +
          (p.dashCooldown > 0 ? p.dashCooldown.toFixed(1) + ' s' : 'GOTOWY'),
      );
      text(
        'cooldown-label',
        'Q · ' +
          (state?.mode === 'coop' ? kit.ability.name : p.abilityName || kit.ability.name) +
          ' / ' +
          (p.abilityCooldown > 0 ? p.abilityCooldown.toFixed(1) + ' s' : 'GOTOWE'),
      );
      text(
        'secondary-label',
        'F · ' +
          (p.secondaryName || kit.secondary.name) +
          ' / ' +
          (p.secondaryCooldown > 0 ? p.secondaryCooldown.toFixed(1) + ' s' : 'GOTOWE'),
      );
      text(
        'interact-label',
        state?.support?.active
          ? 'E · AKTYWUJ NIEBIESKIE WSPARCIE'
          : 'PRZYTRZYMAJ E · REANIMACJA KOLEGI',
      );
    }
    if (!state) {
      text('hp-label', '—');
      text('shield-label', '—');
      bar('hp-fill', 1);
      bar('shield-fill', 1);
      text('player-state', phase === 'lobby' ? 'POKÓJ GOTOWY NA ZAŁOGĘ' : 'GOTOWY NA DEPLOYMENT');
    }
    const players = state?.players || room?.players || [];
    const scoreSig = JSON.stringify(
      players.map((p) => [p.id, p.name, p.team, p.kills, p.deaths, p.hp, p.downed, p.connected]),
    );
    if (scoreSig !== app.lastScores) {
      app.lastScores = scoreSig;
      $('scoreboard').innerHTML =
        players
          .map(
            (p) =>
              '<div class="score-row ' +
              (p.id === app.id ? 'me' : '') +
              '"><div>' +
              escapeHTML(p.name) +
              (p.id === app.id ? ' · TY' : '') +
              '<small>' +
              (p.team === 'excel' ? '▦ Excel' : '☁ Salesforce') +
              (p.connected === false ? ' · ODŁĄCZONY' : p.downed ? ' · RANNY' : '') +
              '</small></div><span class="score-numbers">' +
              (p.kills || 0) +
              ' / ' +
              (p.deaths || 0) +
              '</span></div>',
          )
          .join('') || '<p class="muted">Tutaj pojawi się twoja załoga.</p>';
    }
    if (app.manualLobby) renderLobby();
    if (['intermission', 'finished'].includes(phase)) renderBetween();
  }
  function drawRadar() {
    const canvas = $('radar'),
      c = canvas.getContext('2d'),
      w = canvas.width,
      h = canvas.height,
      s = app.state;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#081521';
    c.fillRect(0, 0, w, h);
    const px = (x) => w / 2 + (x * w) / 56,
      pz = (z) => h / 2 + (z * h) / 48;
    c.strokeStyle = '#1d3c4d';
    c.lineWidth = 1;
    for (let x = 0; x < w; x += w / 8) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }
    for (let z = 0; z < h; z += h / 6) {
      c.beginPath();
      c.moveTo(0, z);
      c.lineTo(w, z);
      c.stroke();
    }
    c.strokeStyle = '#426b7b';
    c.strokeRect(px(-24), pz(-20), (48 * w) / 56, (40 * h) / 48);
    if (!s) return;
    c.fillStyle = '#3b5b6c';
    for (const o of s.obstacles || [])
      c.fillRect(px(o.x - o.w / 2), pz(o.z - o.d / 2), (o.w * w) / 56, (o.d * h) / 48);
    for (const e of s.enemies || []) {
      if (e.hp <= 0) continue;
      c.fillStyle = ['boss', 'excel'].includes(e.type) ? '#ffc27c' : '#ff7b90';
      c.beginPath();
      c.arc(px(e.x), pz(e.z), ['boss', 'excel'].includes(e.type) ? 7 : 3, 0, Math.PI * 2);
      c.fill();
    }
    for (const p of s.players || []) {
      c.fillStyle = p.downed ? '#ff8a7c' : p.team === 'excel' ? '#95e7aa' : '#7ce9e5';
      c.beginPath();
      c.arc(px(p.x), pz(p.z), p.id === app.id ? 5 : 3.5, 0, Math.PI * 2);
      c.fill();
      if (p.id === app.id) {
        c.strokeStyle = '#fff';
        c.stroke();
      }
    }
    if (s.support?.active) {
      c.fillStyle = '#70cfff';
      c.beginPath();
      c.arc(px(s.support.x), pz(s.support.z), 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff';
      c.font = 'bold 13px Arial';
      c.fillText('M', px(s.support.x) - 4, pz(s.support.z) - 9);
    }
  }
  function downloadJSON(data) {
    const u = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      ),
      a = document.createElement('a');
    a.href = u;
    a.download =
      'Bulk-Import-Kooperacja-v' +
      window.BULK_RELEASE.major +
      '-' +
      new Date().toISOString().replace(/[:.]/g, '-') +
      '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  function exportCampaign() {
    if (!isHost() || app.room?.mode !== 'coop') return;
    app.exportRequested = true;
    if (!send({ t: 'exportCampaign' })) app.exportRequested = false;
  }
  function leaveRoom() {
    if (app.ready) send({ t: 'leave' });
    app.room = null;
    app.state = null;
    app.manualLobby = false;
    app.help = false;
    clearSession();
    renderer?.reset();
    keys = {};
    mouse.fire = false;
    showPanels();
    text('room-badge', 'ONLINE');
  }
  function inputBlocked() {
    return (
      window.BulkUnified.screen !== 'main' ||
      !app.ready ||
      !app.room ||
      app.state?.phase !== 'playing' ||
      app.help ||
      app.manualLobby ||
      !$('home').hidden ||
      !$('lobby').hidden ||
      localPlayer()?.downed === true ||
      localPlayer()?.alive === false
    );
  }
  function sendInput() {
    if (!app.ready || !app.room || app.state?.phase !== 'playing') return;
    let mx = 0,
      mz = 0,
      fire = false,
      interact = false;
    if (!inputBlocked()) {
      if (mouse.has) {
        const target = renderer?.aim(mouse.x, mouse.y);
        if (target) {
          aim.x = target.x;
          aim.z = target.z;
        }
      }
      mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      mz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
      fire = mouse.fire || !!keys.Space;
      interact = !!keys.KeyE;
      const l = Math.hypot(mx, mz);
      if (l > 1) {
        mx /= l;
        mz /= l;
      }
    }
    send({
      t: 'input',
      seq: ++app.seq,
      mx,
      mz,
      ax: aim.x,
      az: aim.z,
      fire,
      sprint: !inputBlocked() && !!(keys.ShiftLeft || keys.ShiftRight),
      dash: !inputBlocked() && edge.dash,
      ability: !inputBlocked() && edge.ability,
      secondary: !inputBlocked() && edge.secondary,
      interact,
    });
    edge.dash = edge.ability = edge.secondary = false;
  }
  function toggleHelp() {
    app.help = !app.help;
    renderFactionInformation();
    keys = {};
    mouse.fire = false;
    edge.dash = edge.ability = edge.secondary = false;
    showPanels();
  }
  function pointer(e) {
    const r = $('world').getBoundingClientRect();
    mouse.has = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    const target = renderer?.aim(e.clientX, e.clientY);
    if (target) {
      aim.x = target.x;
      aim.z = target.z;
    }
    $('crosshair').style.left = e.clientX - r.left + 'px';
    $('crosshair').style.top = e.clientY - r.top + 'px';
    $('crosshair').style.display = 'block';
  }
  $('create-coop').onclick = () => startRequest('coop');
  $('create-versus').onclick = () => startRequest('versus');
  $('join-room').onclick = joinRequest;
  $('join-code').onkeydown = (e) => {
    if (e.key === 'Enter') joinRequest();
  };
  $('join-code').oninput = () => {
    $('join-code').value = $('join-code')
      .value.toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  };
  $('player-name').onchange = updateName;
  $('team-salesforce').onclick = () => send({ t: 'team', team: 'salesforce' });
  $('team-excel').onclick = () => send({ t: 'team', team: 'excel' });
  $('ready-button').onclick = () => send({ t: 'ready', ready: !readyState() });
  $('start-match').onclick = () => send({ t: 'start' });
  $('leave-room').onclick = leaveRoom;
  $('copy-invite').onclick = async () => {
    try {
      await navigator.clipboard.writeText($('invite-link').value);
      notice('Zaproszenie skopiowane. Wyślij je znajomym.');
    } catch {
      $('invite-link').focus();
      $('invite-link').select();
      notice('Zaznaczono link — skopiuj go skrótem Ctrl+C.');
    }
  };
  $('return-game').onclick = () => {
    app.manualLobby = false;
    keys = {};
    mouse.fire = false;
    showPanels();
  };
  $('room-menu').onclick = () => {
    app.manualLobby = true;
    keys = {};
    mouse.fire = false;
    renderLobby(true);
    showPanels();
  };
  $('open-lobby').onclick = () => {
    app.manualLobby = true;
    keys = {};
    mouse.fire = false;
    renderLobby(true);
    showPanels();
  };
  $('show-lobby').onclick = () => {
    app.manualLobby = true;
    renderLobby(true);
    showPanels();
  };
  $('next-button').onclick = () => send({ t: 'next' });
  $('coop-mission').onchange = () =>
    send({ t: 'mission', mission: Number($('coop-mission').value) });
  $('export-campaign').onclick = $('between-export').onclick = exportCampaign;
  $('import-campaign').onclick = () => $('campaign-file').click();
  $('resume-campaign').onclick = () => {
    const cp = loadJSON(persistentStore, COOP_KEY);
    if (cp) send({ t: 'importCampaign', campaign: cp });
  };
  $('campaign-file').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      if (f.size > 128000) throw Error('Za duży plik. Wybierz checkpoint kooperacji.');
      const data = JSON.parse(await f.text());
      send({ t: 'importCampaign', campaign: data });
    } catch (err) {
      notice(err.message || 'Niepoprawny plik kooperacji.');
    }
    e.target.value = '';
  };
  $('help-button').onclick = $('close-help').onclick = toggleHelp;
  $('sound-toggle').onclick = () => {
    audioOn = !audioOn;
    text('sound-toggle', 'DŹWIĘK: ' + (audioOn ? 'ON' : 'OFF'));
    sound(600, 0.1);
  };
  $('quality-toggle').onclick = () => {
    quality = quality === 'auto' ? 'fast' : 'auto';
    renderer?.setQuality(quality);
    text('quality-toggle', 'GRAFIKA: ' + (quality === 'fast' ? 'SZYBKA' : 'AUTO'));
    storeJSON(persistentStore, 'bulk-import-multi-quality-v11', quality);
  };
  $('connect-server').onclick = () => {
    app.desired = false;
    clearTimeout(reconnectTimer);
    if (app.socket) {
      app.socket.onclose = null;
      const old = app.socket;
      app.socket = null;
      old.close();
    }
    app.desired = true;
    app.attempts = 0;
    connect(true);
  };
  $('reconnect').onclick = () => {
    if (app.socket?.readyState === WebSocket.OPEN) {
      notice('Połączenie działa. ' + app.ping + ' ms');
      return;
    }
    app.desired = true;
    app.attempts = 0;
    connect(true);
  };
  $('world').addEventListener('pointermove', pointer);
  $('world').addEventListener('pointerdown', (e) => {
    pointer(e);
    if (e.button === 0 && !inputBlocked()) {
      mouse.fire = true;
      sound(480, 0.05, 'sawtooth', 0.012);
    }
    $('world').setPointerCapture?.(e.pointerId);
  });
  $('world').addEventListener('pointerup', (e) => {
    if (e.button === 0) mouse.fire = false;
  });
  $('world').addEventListener('pointercancel', () => (mouse.fire = false));
  $('world').addEventListener('pointerleave', () => {
    $('crosshair').style.display = 'none';
    if (!mouse.fire) mouse.has = false;
  });
  $('world').addEventListener('contextmenu', (e) => e.preventDefault());
  $('world').addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      renderer?.zoom(e.deltaY);
    },
    { passive: false },
  );
  addEventListener('keydown', (e) => {
    if (window.BulkUnified.screen !== 'main') return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
      e.preventDefault();
    if (['KeyP', 'Escape'].includes(e.code)) {
      if (e.repeat) return;
      if (app.manualLobby && app.state?.phase === 'playing') {
        app.manualLobby = false;
        showPanels();
      } else toggleHelp();
      return;
    }
    keys[e.code] = true;
    if (e.repeat || inputBlocked()) return;
    if (['KeyC', 'KeyR'].includes(e.code)) edge.dash = true;
    if (e.code === 'KeyQ') edge.ability = true;
    if (e.code === 'KeyF') edge.secondary = true;
  });
  addEventListener('keyup', (e) => (keys[e.code] = false));
  addEventListener('blur', () => {
    keys = {};
    mouse.fire = false;
    edge.dash = edge.ability = edge.secondary = false;
    sendInput();
  });
  addEventListener('resize', () => renderer?.resize());
  addEventListener('pagehide', () => {
    updateSavedSession();
    app.desired = false;
  });
  function ensureRenderer() {
    if (renderer) return;
    try {
      renderer = new BulkArenaRenderer($('world'));
      if (quality === 'fast') renderer.setQuality(quality);
    } catch (e) {
      app.renderError = e.message;
      notice('Nie udało się uruchomić WebGL: ' + e.message, 30);
      console.error(e);
    }
  }
  const savedName = loadJSON(persistentStore, 'bulk-import-player-name-v11');
  if (typeof savedName === 'string') $('player-name').value = savedName.slice(0, 20);
  const savedQuality = loadJSON(persistentStore, 'bulk-import-multi-quality-v11');
  if (savedQuality === 'fast') {
    quality = 'fast';
    renderer?.setQuality('fast');
    text('quality-toggle', 'GRAFIKA: SZYBKA');
  }
  const saved = loadJSON(sessionStore, SESSION_KEY);
  if (saved && typeof saved.code === 'string' && typeof saved.token === 'string') {
    app.resume = saved;
    $('player-name').value = saved.name || displayName();
  }
  const urlRoom = new URLSearchParams(location.search).get('room');
  if (urlRoom)
    $('join-code').value = urlRoom
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
  $('server-url').value = /^https?:$/.test(location.protocol)
    ? location.origin
    : app.resume?.endpoint || '';
  if (window.BulkUnified.local) {
    setConnection('offline', 'PLIK LOKALNY');
    text(
      'network-note',
      'Kampania i Bird Game 3 są w tym pliku. Multiplayer jest dostępny po wejściu na adres serwera.',
    );
    text('room-badge', 'SOLO');
    $('network-details').hidden = true;
  } else connect();
  setInterval(sendInput, 50);
  sessionTimer = setInterval(() => {
    if (app.ready && app.room) updateSavedSession();
  }, 5000);
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000 || 0.016));
    last = now;
    if (document.hidden || window.BulkUnified.screen !== 'main') return;
    renderer?.render(dt, now / 1000);
    hudTimer += dt;
    radarTimer += dt;
    if (hudTimer >= 0.1) {
      hudTimer = 0;
      updateHud();
      if (app.noticeUntil && now > app.noticeUntil) {
        text('notice', '');
        app.noticeUntil = 0;
      }
      if (app.toastUntil && now > app.toastUntil) {
        $('combat-toast').style.opacity = '0';
        app.toastUntil = 0;
      }
    }
    if (radarTimer >= 0.15) {
      radarTimer = 0;
      drawRadar();
    }
    if (app.ready && app.state?.phase === 'playing' && now - app.lastStateAt > 6000)
      text('connection', 'OCZEKIWANIE NA STAN…');
    if (mouse.fire && !inputBlocked() && now - sounds.shotAt > 150) {
      sounds.shotAt = now;
      sound(localPlayer()?.team === 'excel' ? 310 : 480, 0.05, 'sawtooth', 0.006);
    }
  }
  Object.defineProperty(window, '__bulkMultiplayer', {
    value: Object.freeze({
      get room() {
        return app.room;
      },
      get state() {
        return app.state;
      },
      get localId() {
        return app.id;
      },
      get renderer() {
        return renderer;
      },
      get socket() {
        return app.socket;
      },
      get connected() {
        return app.ready && !app.resumePending;
      },
      get renderError() {
        return app.renderError;
      },
    }),
    writable: false,
    configurable: false,
  });
  window.BulkUnified.registerNetwork({
    suspend() {
      if (app.room) {
        notice('Najpierw opuść pokój, aby uruchomić kampanię albo automat. Koledzy nadal grają.');
        return false;
      }
      app.desired = false;
      app.pending = [];
      clearTimeout(reconnectTimer);
      clearInterval(pingTimer);
      app.ready = false;
      keys = {};
      mouse.fire = false;
      app.socket?.close();
      app.socket = null;
      audioCtx?.suspend();
      return true;
    },
    resume() {
      if (window.BulkUnified.local) return;
      app.desired = true;
      app.attempts = 0;
      connect();
    },
  });
  renderFactionInformation();
  showPanels();
  drawRadar();
  requestAnimationFrame(frame);
})();
