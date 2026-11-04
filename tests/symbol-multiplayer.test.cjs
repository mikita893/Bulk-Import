'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {EventEmitter, once} = require('node:events');
const WebSocket = require('ws');
const {createGameServer} = require('../server/index.cjs');
const {createDoubleRoomService, RECONNECT_MS} = require('../server/double-rooms.cjs');
const {DoubleOnlineMatch} = require('../server/double-match.cjs');
const {commonDoubleSymbol} = require('../minigames/symbol-deck.js');

class Socket extends EventEmitter {
  constructor() {super();this.readyState=1;this.bufferedAmount=0;this.messages=[];}
  send(raw) {this.messages.push(JSON.parse(raw));}
  command(message) {this.emit('message', JSON.stringify(message), false);}
  close() {if(this.readyState===3)return;this.readyState=3;this.emit('close');}
  terminate() {this.close();}
  last(type) {return this.messages.findLast(m=>m.t===type);}
}
function table(count=2, cooldown=1500) {
  let clock=10000;
  const service=createDoubleRoomService({now:()=>clock});
  function peer() {const ws=new Socket();service.connect(ws);return ws;}
  const peers=Array.from({length:count},peer), host=peers[0];
  host.command({t:'create',name:'Admin & CSV'}); const code=host.last('room').room.code;
  peers.slice(1).forEach((p,i)=>p.command({t:'join',code,name:'Gracz '+(i+2)}));
  host.command({t:'settings',cooldown});
  function start() {peers.forEach(p=>p.command({t:'ready',ready:true}));host.command({t:'start'});}
  function advance(ms) {clock+=ms;service.tick();}
  function answer(p,symbol,seq=1,token) {
    const state=p.last('state').state;
    p.command({t:'answer',symbol,seq,session:token?.session??state.session,roundId:token?.roundId??state.roundId});
  }
  return {service,peers,host,code,peer,start,advance,answer,elapse(ms){clock+=ms;},get clock(){return clock;},get room(){return service.rooms.get(code);}};
}
const correct = p => {const s=p.last('state').state;return commonDoubleSymbol(s.participants[0].card,s.center);};

test('CSV Double backend is disabled by default and rejects a direct WebSocket connection', async t=>{
  const previous=process.env.BULK_DOUBLE_MULTIPLAYER;delete process.env.BULK_DOUBLE_MULTIPLAYER;
  const app=createGameServer({port:0,host:'127.0.0.1'});
  if(previous!==undefined)process.env.BULK_DOUBLE_MULTIPLAYER=previous;
  const {url}=await app.listen();t.after(()=>app.close());
  const config=await fetch(url+'/api/config').then(r=>r.json());assert.equal(config.features.csvDoubleMultiplayer,false);
  const status=await new Promise((resolve,reject)=>{
    const ws=new WebSocket(url.replace('http:','ws:')+'/ws/double');
    ws.on('unexpected-response',(_,res)=>{res.resume();ws.terminate();resolve(res.statusCode);});
    ws.on('open',()=>{ws.terminate();reject(Error('Disabled endpoint accepted a connection'));});ws.on('error',()=>{});
  });
  assert.equal(status,503);assert.equal(app.doubleService.connections.size,0);
});

test('2–4 humans receive distinct cards without bots, private hands or future deck leaks',()=>{
  for(const count of [2,3,4]) {
    const env=table(count);env.start();env.advance(3000);const match=env.room.match;
    assert.equal(match.participants.length,count);assert.equal(match.total,31-count);assert.equal(match.botEvents.length,0);
    assert.equal(new Set(match.participants.map(p=>p.card.id)).size,count);
    env.advance(100000);assert.equal(match.state,'PLAYING');assert.equal(match.history.length,0);
    for(const p of env.peers) {
      const view=p.last('state').state;
      assert.equal(view.participants[0].id,p.last('welcome').id);
      assert(view.participants[0].card);assert(view.participants.slice(1).every(other=>!Object.hasOwn(other,'card')));
      assert(!Object.hasOwn(view,'seed'));assert(!Object.hasOwn(view,'pile'));assert(!Object.hasOwn(view.result.ranking[0],'card'));
      for(const m of p.messages.filter(m=>m.t==='room'||m.t==='state'))assert(env.peers.every(other=>!JSON.stringify(m).includes(other.last('welcome').token)));
    }
  }
});

test('room capacity, ready checks and host-only settings/start/pause are enforced',()=>{
  const e=table(4),guest=e.peers[1];e.host.command({t:'start'});assert(!e.room.match);
  guest.command({t:'settings',cooldown:1000});assert.equal(e.room.cooldown,1500);
  guest.command({t:'start'});assert(!e.room.match);
  const fifth=e.peer();fifth.command({t:'join',code:e.code,name:'Nadmiar'});assert.match(fifth.last('error').message,/czterech/);
  e.peers.forEach(p=>p.command({t:'ready',ready:true}));e.host.command({t:'settings',cooldown:2000});assert(e.room.players.every(p=>!p.ready));
  e.start();e.advance(3000);guest.command({t:'pause'});assert.equal(e.room.match.state,'PLAYING');
  e.host.command({t:'pause'});assert.equal(e.room.match.state,'PAUSED');e.advance(50000);assert.equal(e.room.match.time,3000);
  e.host.command({t:'pause'});assert.equal(e.room.match.state,'PLAYING');
  fifth.command({t:'join',code:e.code,name:'Jeszcze raz'});assert.match(fifth.last('error').message,/trwa/);
});

test('simultaneous answers award once, first received wins without host priority; stale and replayed inputs cannot score',()=>{
  const e=table();e.start();e.advance(3000);const [a,b]=e.peers, old=a.last('state').state;
  const symbolA=correct(a),symbolB=correct(b);e.answer(b,symbolB,10);e.answer(a,symbolA,10);
  assert.equal(e.room.match.history.length,1);assert.equal(e.room.match.participants[1].score,1);
  e.advance(360);e.answer(a,correct(a),9);assert.equal(e.room.match.history.length,1);
  e.answer(a,correct(a),11,old);assert.equal(e.room.match.history.length,1);
  e.answer(a,correct(a),12);assert.equal(e.room.match.history.length,2);
  assert.equal(a.last('state').state.participants[0].score,1);assert.equal(b.last('state').state.participants[0].score,1);
});

test('each player has a separate penalty which survives other captures and blocks answer spam',()=>{
  for(const cooldown of [1000,1500,2000]) {
    const e=table(2,cooldown);e.start();e.advance(3000);const [a,b]=e.peers,s=a.last('state').state;
    const wrong=s.participants[0].card.symbols.find(id=>!s.center.symbols.includes(id));
    e.answer(a,wrong,1);for(let i=2;i<9;i++)e.answer(a,correct(a),i);
    assert.equal(e.room.match.participants[0].wrong,1);assert.equal(e.room.match.history.length,0);
    e.answer(b,correct(b),1);e.advance(360);assert(a.last('state').state.lockedUntil>e.room.match.time);
    e.answer(a,correct(a),9);assert.equal(e.room.match.participants[0].score,0);
    e.advance(cooldown-361);e.answer(a,correct(a),10);assert.equal(e.room.match.participants[0].score,0);
    e.advance(1);e.answer(a,correct(a),11);assert.equal(e.room.match.participants[0].score,1);
  }
});

test('malformed symbols/tokens/sequences, client clocks and forged scores cannot mutate the match',()=>{
  const e=table();e.start();e.advance(3000);const a=e.host;
  for(const symbol of [-1,62,'1',null])e.answer(a,symbol,1+e.host.messages.length);
  assert.equal(e.room.match.history.length,0);assert.equal(e.room.match.participants[0].wrong,0);
  for(const seq of [-1,null,'500'])a.command({t:'answer',symbol:correct(a),seq,...e.room.match.token(),score:999,time:1e9});
  assert.equal(e.room.match.history.length,0);
  a.command({t:'answer',symbol:correct(a),seq:10000,...e.room.match.token(),score:999,time:1e9,participant:1});
  assert.equal(e.room.match.participants[0].score,1);assert.equal(e.room.match.participants[1].score,0);
});

test('disconnect freezes clocks/penalties, private token resumes the same seat and keeps manual pauses',()=>{
  const e=table();e.start();e.advance(3000);const b=e.peers[1],credentials=b.last('welcome');
  b.close();const paused=e.room.match.time;e.advance(20000);assert.equal(e.room.match.time,paused);assert.equal(e.room.match.state,'PAUSED');
  const intruder=e.peer();intruder.command({t:'join',code:e.code,token:'forged'});assert(intruder.last('error'));
  const returning=e.peer();returning.command({t:'join',code:e.code,token:credentials.token});
  assert.equal(returning.last('welcome').id,credentials.id);assert.equal(e.room.players.length,2);assert.equal(e.room.match.state,'PLAYING');
  const duplicate=e.peer();duplicate.command({t:'join',code:e.code,token:credentials.token});assert(duplicate.last('error'));
  e.host.command({t:'pause'});returning.close();e.advance(1000);
  const again=e.peer();again.command({t:'join',code:e.code,token:credentials.token});assert.equal(e.room.match.state,'PAUSED');
  e.advance(31000);assert.equal(e.room.match.state,'PAUSED','A manual pause must not expire after everyone reconnects');
  e.host.command({t:'pause'});assert.equal(e.room.match.state,'PLAYING');
});

test('connection grace and explicit exit abort without a false winner; rematches invalidate previous tokens',()=>{
  const e=table();e.start();e.advance(3000);const old=e.room.match.token();e.peers[1].close();e.advance(RECONNECT_MS);
  assert.equal(e.room.match.state,'GAME_OVER');assert.equal(e.host.last('state').state.result.outcome,'aborted');
  e.host.command({t:'lobby'});assert.equal(e.room.match,null);assert.equal(e.room.players.length,1);
  const fresh=e.peer();fresh.command({t:'join',code:e.code,name:'Nowy'});e.host.command({t:'ready',ready:true});fresh.command({t:'ready',ready:true});e.host.command({t:'start'});e.advance(3000);
  assert.equal(e.room.match.state,'PLAYING');assert(e.room.match.session>old.session);
  e.answer(e.host,correct(e.host),1,old);assert.equal(e.room.match.history.length,0);
  e.host.command({t:'leave'});assert.equal(fresh.last('state').state.result.outcome,'aborted');assert.equal(e.room.hostId,fresh.last('welcome').id);
});

test('an idle Workers loop cannot extend reconnection grace when everyone was offline',()=>{
  const e=table();e.start();e.advance(3000);const credentials=e.host.last('welcome');
  e.peers.forEach(p=>p.close());e.elapse(RECONNECT_MS+1); // No ticks while the Worker sleeps.
  const returning=e.peer();returning.command({t:'join',code:e.code,token:credentials.token});
  assert.equal(e.room.match.state,'GAME_OVER');
  assert.equal(returning.last('state').state.result.outcome,'aborted');
});

test('empty/lost lobby sessions are removed and transport limits reject oversized/binary/flood input',()=>{
  const e=table();e.peers[1].close();e.advance(RECONNECT_MS);assert.equal(e.room.players.length,1);
  const single=e.peer();single.close();assert(!e.service.sessions.has(single.last('welcome').token));
  const flood=e.peer();for(let i=0;i<42;i++)flood.command({t:'ping'});assert.equal(flood.readyState,3);
  const binary=e.peer();binary.emit('message','{}',true);assert.equal(binary.readyState,3);
  const huge=e.peer();huge.emit('message','x'.repeat(2049),false);assert.equal(huge.readyState,3);
  e.host.close();e.advance(15*60*1000+1);assert.equal(e.service.rooms.size,0);e.service.disconnectAll();assert.equal(e.service.sessions.size,0);
});

test('100 seeded human matches conserve all cards, per-player statistics and final standings',()=>{
  for(let seed=1;seed<=100;seed++) {
    const count=2+seed%3,players=Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+i}));
    const m=new DoubleOnlineMatch(players,1500,seed,seed);m.start(0);m.advance(3000);
    let now=3001,round=0;
    while(m.state!=='GAME_OVER') {
      const p=m.participants[(seed+round++)%count],symbol=commonDoubleSymbol(p.card,m.center);
      assert.equal(m.answerPlayer(p.id,symbol,m.token(),now),'correct');now+=360;m.advance(now);
      assert.equal(m.participants.reduce((n,x)=>n+x.score,0)+m.pile.length,m.total);
      assert.equal(new Set(m.history.map(h=>h.card)).size,m.history.length);
    }
    assert.equal(m.history.length,31-count);
    for(const p of m.participants){const view=m.view(p.id);assert.equal(view.result.correct,p.score);assert.equal(view.result.wrong,0);assert.equal(view.result.ranking[0].rank,1);}
  }
});

test('real sockets expose an enabled isolated CSV Double room and personalized state',async t=>{
  const app=createGameServer({port:0,host:'127.0.0.1',doubleEnabled:true});const {url}=await app.listen();t.after(()=>app.close());
  assert.equal((await fetch(url+'/api/config').then(r=>r.json())).features.csvDoubleMultiplayer,true);
  async function peer() {
    const ws=new WebSocket(url.replace('http:','ws:')+'/ws/double'),messages=[],pending=[];
    ws.on('message',raw=>{const m=JSON.parse(raw);messages.push(m);for(const waiter of [...pending])if(waiter.p(m)){pending.splice(pending.indexOf(waiter),1);clearTimeout(waiter.timer);waiter.resolve(m);}});
    await once(ws,'open');t.after(()=>ws.terminate());
    const wait=(p,start=0)=>messages.slice(start).find(p)?Promise.resolve(messages.slice(start).find(p)):new Promise((resolve,reject)=>{const w={p,resolve,timer:setTimeout(()=>reject(Error('CSV Double socket timeout')),6000)};pending.push(w);});
    return {ws,messages,wait,send:m=>ws.send(JSON.stringify(m))};
  }
  const a=await peer(),b=await peer();await a.wait(m=>m.t==='welcome');a.send({t:'create',name:'Serwer A'});const {room}=await a.wait(m=>m.t==='room');
  b.send({t:'join',code:room.code,name:'Serwer B'});await b.wait(m=>m.t==='room');a.send({t:'ready',ready:true});b.send({t:'ready',ready:true});await a.wait(m=>m.t==='room'&&m.room.players.every(p=>p.ready));a.send({t:'start'});
  const state=(await b.wait(m=>m.t==='state'&&m.state.state==='PLAYING')).state;
  b.send({t:'answer',seq:1,symbol:commonDoubleSymbol(state.participants[0].card,state.center),session:state.session,roundId:state.roundId});
  const won=(await b.wait(m=>m.t==='state'&&m.state.participants[0].score===1)).state;
  assert.equal(won.lastAward.participant,0);assert.equal(won.participants[1].card,undefined);
  assert.equal(app.rooms.size,0);assert.equal(app.doubleService.rooms.size,1);
});
