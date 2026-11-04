'use strict';
const {DoubleOnlineMatch} = require('./double-match.cjs');
const MAX_DOUBLE_SESSIONS = 64, MAX_DOUBLE_ROOMS = 16, RECONNECT_MS = 30000, IDLE_MS = 15 * 60 * 1000;
const cleanName = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 24) : '';
const randomHex = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => x.toString(16).padStart(2, '0')).join('');
function createDoubleRoomService({now = () => performance.now()} = {}) {
  const rooms = new Map(), sessions = new Map(), connections = new Set();
  function send(s, message) {
    if (s.ws?.readyState !== 1) return;
    if (s.ws.bufferedAmount > 256 * 1024) { s.ws.terminate(); return; }
    s.ws.send(JSON.stringify(message));
  }
  const error = (s, message) => send(s, {t: 'error', message});
  const welcome = s => send(s, {t: 'welcome', id: s.id, token: s.token, protocol: 1});
  function transferHost(room) {
    if (!room.players.some(p => p.id === room.hostId && p.ws)) room.hostId = room.players.find(p => p.ws)?.id || room.players[0]?.id;
  }
  function roomView(room, s) {
    return {code: room.code, hostId: room.hostId, meId: s.id, cooldown: room.cooldown,
      phase: room.match?.state || 'LOBBY', pauseReason: room.pauseReason || null,
      players: room.players.map(p => ({id: p.id, name: p.name, ready: p.ready, connected: !!p.ws})), limit: 4};
  }
  function broadcast(room) {
    for (const s of room.players) {
      send(s, {t: 'room', room: roomView(room, s)});
      if (room.match) send(s, {t: 'state', state: room.match.view(s.id)});
    }
    room.revision = room.match?.revision; room.lastBroadcast = now();
  }
  function detach(s) {
    const room = rooms.get(s.room); s.room = null;
    if (!room) return;
    room.players = room.players.filter(p => p !== s);
    if (!room.players.length) { rooms.delete(room.code); return; }
    if (room.match && room.match.state !== 'GAME_OVER') room.match.finish('Gracz opuścił pokój. Mecz przerwany bez przyznawania zwycięstwa.');
    room.pauseReason = null; room.players.forEach(p => {p.ready = false;}); transferHost(room); broadcast(room);
  }
  function handle(s, m) {
    if (!m || typeof m !== 'object' || Array.isArray(m) || typeof m.t !== 'string') return error(s, 'Niepoprawna wiadomość.');
    s.seen = now();
    if (m.t === 'ping') {send(s, {t: 'pong'}); return;}
    if (m.t === 'create') {
      if (s.room) return error(s, 'Najpierw opuść obecny pokój.');
      const name = cleanName(m.name); if (!name) return error(s, 'Podaj pseudonim.');
      if (rooms.size >= MAX_DOUBLE_ROOMS) return error(s, 'Serwer ma komplet stołów. Spróbuj później.');
      let code; do {code = randomHex(3).toUpperCase();} while (rooms.has(code));
      const room = {code, players: [s], hostId: s.id, cooldown: 1500, series: 0, match: null, touched: now(), lastBroadcast: 0};
      rooms.set(code, room); s.room = code; s.name = name; s.ready = false; broadcast(room); return;
    }
    if (m.t === 'join') {
      if (s.room || typeof m.code !== 'string' || !/^[A-F0-9]{6}$/i.test(m.code)) return error(s, 'Podaj sześcioznakowy kod pokoju.');
      const room = rooms.get(m.code.toUpperCase()); if (!room) return error(s, 'Pokój nie istnieje lub wygasł.');
      if (typeof m.token === 'string') {
        const old = sessions.get(m.token);
        if (!old || old.room !== room.code || !room.players.includes(old)) return error(s, 'Sesja wygasła. Dołącz do nowego lobby.');
        if (old.ws && old.ws !== s.ws) return error(s, 'Ta sesja jest już połączona w innej karcie.');
        sessions.delete(s.token); connections.delete(s);
        old.ws = s.ws; old.ws._session = old; old.seen = now(); old.lastSeq = -1; old.pong = true; s.ws = null;
        connections.add(old); welcome(old); transferHost(room);
        if (room.players.every(p => p.ws)) {
          room.disconnectedAt = null;
          if (room.match?.state === 'PAUSED' && room.pauseReason === 'connection') {room.match.resume(now()); room.pauseReason = null;}
        }
        broadcast(room); return;
      }
      if (room.match) return error(s, 'Mecz już trwa. Poczekaj na nowe lobby.');
      if (room.players.length >= 4) return error(s, 'Stół ma już czterech graczy.');
      const name = cleanName(m.name); if (!name) return error(s, 'Podaj pseudonim.');
      s.name = name; s.room = room.code; s.ready = false; room.players.push(s);
      room.players.forEach(p => {p.ready = false;}); broadcast(room); return;
    }
    const room = rooms.get(s.room);
    if (!room || !room.players.includes(s)) return error(s, 'Najpierw utwórz pokój lub dołącz kodem.');
    room.touched = now();
    if (m.t === 'leave') {detach(s); send(s, {t: 'left'}); return;}
    if (m.t === 'ready') {
      if (room.match || typeof m.ready !== 'boolean') return error(s, 'Gotowość zmienia się w lobby.');
      s.ready = m.ready; broadcast(room); return;
    }
    if (m.t === 'answer') {
      if (!room.match || !Number.isSafeInteger(m.seq) || m.seq < 0 || m.seq <= s.lastSeq) return;
      s.lastSeq = m.seq;
      room.match.answerPlayer(s.id, m.symbol, {session: m.session, roundId: m.roundId}, now());
      if (room.match.revision !== room.revision) broadcast(room); return;
    }
    if (s.id !== room.hostId) return error(s, 'Tę opcję wybiera gospodarz pokoju.');
    if (m.t === 'settings') {
      if (room.match || ![1000, 1500, 2000].includes(m.cooldown)) return error(s, 'Karę ustala się przed meczem: 1 / 1,5 / 2 s.');
      room.cooldown = m.cooldown; room.players.forEach(p => {p.ready = false;}); broadcast(room); return;
    }
    if (m.t === 'start') {
      if (room.match || room.players.length < 2 || !room.players.every(p => p.ws && p.ready)) return error(s, 'Potrzeba 2–4 połączonych i gotowych graczy.');
      room.match = new DoubleOnlineMatch(room.players.map(p => ({id: p.id, name: p.name})), room.cooldown, crypto.getRandomValues(new Uint32Array(1))[0], ++room.series);
      room.match.start(now()); room.players.forEach(p => {p.lastSeq = -1;}); room.pauseReason = null; room.disconnectedAt = null; broadcast(room); return;
    }
    if (m.t === 'pause') {
      if (!room.match || room.match.state === 'GAME_OVER') return;
      if (room.match.state === 'PAUSED') {
        if (!room.players.every(p => p.ws)) return error(s, 'Czekamy na ponowne połączenie graczy.');
        room.match.resume(now()); room.pauseReason = null;
      } else {room.match.pause(now()); room.pauseReason = 'host';}
      broadcast(room); return;
    }
    if (m.t === 'lobby') {
      if (!room.match || room.match.state !== 'GAME_OVER') return error(s, 'Najpierw zakończ mecz.');
      room.players = room.players.filter(p => {
        if (p.ws) return true;
        p.room = null; sessions.delete(p.token); return false;
      });
      room.match = null; room.pauseReason = null; room.disconnectedAt = null; room.players.forEach(p => {p.ready = false;}); transferHost(room); broadcast(room); return;
    }
    error(s, 'Nieznana komenda.');
  }
  function tick() {
    const at = now();
    for (const room of rooms.values()) {
      const connected = room.players.filter(p => p.ws);
      if (!connected.length && at - room.touched > IDLE_MS) {
        room.players.forEach(p => {p.room = null; sessions.delete(p.token);}); rooms.delete(room.code); continue;
      }
      if (!room.match) {
        const expired = room.players.filter(p => !p.ws && at - p.seen >= RECONNECT_MS);
        if (expired.length) {
          room.players = room.players.filter(p => !expired.includes(p)); expired.forEach(p => {p.room = null; sessions.delete(p.token);});
          if (!room.players.length) {rooms.delete(room.code); continue;} transferHost(room); broadcast(room);
        }
        continue;
      }
      room.match.advance(at);
      if (room.match.state !== 'GAME_OVER' && room.disconnectedAt != null && at - room.disconnectedAt >= RECONNECT_MS) {
        room.match.finish('Nie udało się odzyskać połączenia w 30 s. Mecz przerwany bez przyznawania zwycięstwa.'); room.pauseReason = null;
      }
      if (room.match.revision !== room.revision || at - room.lastBroadcast >= 1000) broadcast(room);
    }
  }
  function connect(ws) {
    // Workers stop their loop while nobody is connected. Expire old grace periods
    // before accepting a returning session, just as the continuously ticking Node host does.
    tick();
    if (connections.size >= MAX_DOUBLE_SESSIONS) {ws.close(1013, 'Server full'); return false;}
    const s = {id: crypto.randomUUID(), token: randomHex(24), ws, room: null, ready: false, lastSeq: -1, seen: now(), rateAt: now(), rate: 0, pong: true};
    ws._session = s; sessions.set(s.token, s); connections.add(s); welcome(s);
    ws.on('pong', () => {if (ws._session) ws._session.pong = true;});
    ws.on('message', (raw, binary) => {
      const current = ws._session; if (!current || current.ws !== ws) return;
      const at = now(); if (at - current.rateAt >= 1000) {current.rateAt = at; current.rate = 0;}
      if (++current.rate > 40) {ws.close(1008, 'Message rate exceeded'); return;}
      const text = typeof raw === 'string' ? raw : raw.toString();
      if (binary || new TextEncoder().encode(text).length > 2048) {ws.close(1009, 'Invalid message'); return;}
      let m; try {m = JSON.parse(text);} catch {error(current, 'Niepoprawny JSON.'); return;}
      try {handle(current, m);} catch (err) {console.error('CSV Double:', err.message); error(current, 'Nie udało się wykonać komendy.');}
    });
    ws.on('close', () => {
      const current = ws._session; if (!current || current.ws !== ws) return;
      current.ws = null; current.seen = now(); connections.delete(current);
      const room = rooms.get(current.room); if (!room) {sessions.delete(current.token); return;}
      current.ready = false; room.touched = now(); transferHost(room);
      if (room.match && room.match.state !== 'GAME_OVER') {
        if (room.match.state !== 'PAUSED') {room.match.pause(now()); room.pauseReason = 'connection';}
        room.disconnectedAt ??= now();
      }
      broadcast(room);
    });
    ws.on('error', () => {}); return true;
  }
  function heartbeat() {
    for (const s of connections) {
      if (typeof s.ws?.ping === 'function') {
        if (!s.pong) {s.ws.terminate(); continue;} s.pong = false; s.ws.ping();
      } else if (now() - s.seen > 60000) s.ws?.terminate();
    }
  }
  function disconnectAll() {for (const s of connections) s.ws?.terminate(); connections.clear(); sessions.clear(); rooms.clear();}
  return {rooms, sessions, connections, connect, tick, heartbeat, disconnectAll};
}
module.exports = {createDoubleRoomService, MAX_DOUBLE_SESSIONS, RECONNECT_MS};
