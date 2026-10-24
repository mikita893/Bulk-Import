'use strict';
// Transport-independent room service. The authoritative simulation is shared by Node and Workers.
const engine = require('../multiplayer/engine.cjs');
const shared = require('../multiplayer/shared.cjs');
const crypto = globalThis.crypto;
const OPEN = 1;
const randomBytes = size => crypto.getRandomValues(new Uint8Array(size));
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const UPGRADE_KEYS = ['damage','rate','armor','shield','plating','biotic','mobility'];
const MAX_ROOMS = 32, MAX_SESSIONS = 256, ROOM_TTL = 30 * 60 * 1000;
const cleanName = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 24) : '';
const freshProgress = () => ({ mission:0, unlocked:0, completed:[], credits:0, upgrades:Object.fromEntries(UPGRADE_KEYS.map(k => [k,0])) });
const clone = value => JSON.parse(JSON.stringify(value));
function missions() { return shared.COOP_MISSIONS || shared.MISSIONS || []; }
function validateCheckpoint(data) {
  if (!data || data.format !== 'bulk-import-coop' || data.version !== 1) return null;
  const p = data.progress, count = missions().length;
  if (!p || !Number.isInteger(p.mission) || p.mission < 0 || p.mission >= count || !Number.isInteger(p.unlocked) || p.unlocked < p.mission || p.unlocked >= count || !Number.isSafeInteger(p.credits) || p.credits < 0 || p.credits > 100000000) return null;
  if (!Array.isArray(p.completed) || p.completed.length > count || new Set(p.completed).size !== p.completed.length || !p.completed.every(n => Number.isInteger(n) && n >= 0 && n < count)) return null;
  if (!p.upgrades || !UPGRADE_KEYS.every(k => Number.isInteger(p.upgrades[k]) && p.upgrades[k] >= 0 && p.upgrades[k] <= 5)) return null;
  if (p.unlocked > 0 && !Array.from({length:p.unlocked},(_,i)=>i).every(i => p.completed.includes(i))) return null;
  return {mission:p.mission,unlocked:p.unlocked,completed:[...p.completed],credits:p.credits,upgrades:Object.fromEntries(UPGRADE_KEYS.map(k=>[k,p.upgrades[k]]))};
}
function createRoomService(options={}){
  const rooms=new Map(),sessions=new Map(),connections=new Set();
  const tickRate=options.tickRate||30;
  const send = (s, data) => { if(s.ws?.readyState===OPEN){if(s.ws.bufferedAmount>512*1024){s.ws.terminate();return;}s.ws.send(JSON.stringify(data));} };
  const error = (s,message) => send(s,{t:'error',message});
  function checkpoint(room) { return {format:'bulk-import-coop',version:1,savedAt:new Date().toISOString(),progress:clone(room.campaign)}; }
  function syncCampaign(room) {
    if(room.mode!=='coop'||!room.match)return;
    const snap=engine.snapshotMatch(room.match);
    room.campaign.credits=snap.teamCredits;
    room.campaign.upgrades={...room.match.upgrades};
    if(snap.phase==='finished'&&snap.result?.outcome==='victory'){
      if(!room.campaign.completed.includes(room.campaign.mission))room.campaign.completed.push(room.campaign.mission);
      room.campaign.unlocked=Math.max(room.campaign.unlocked,Math.min(missions().length-1,room.campaign.mission+1));
    }
  }
  function roomView(room,meId) {
    return {code:room.code,mode:room.mode,phase:room.match?.phase||'lobby',hostId:room.hostId,meId,
      players:room.players.map(p=>({id:p.id,name:p.name,team:p.team,ready:p.ready,connected:!!p.session.ws})),campaign:clone(room.campaign),
      missions:missions(),upgrades:shared.UPGRADES,limits:{coop:3,versus:6,team:3}};
  }
  function broadcastRoom(room) {for(const p of room.players)send(p.session,{t:'room',room:roomView(room,p.id)});}
  function broadcastCheckpoint(room) { if(room.mode!=='coop')return;syncCampaign(room);const c=checkpoint(room);for(const p of room.players)send(p.session,{t:'campaign',campaign:c}); }
  function broadcastState(room) {if(!room.match)return;const state=engine.snapshotMatch(room.match);for(const p of room.players)send(p.session,{t:'state',state});}
  function welcome(s) {send(s,{t:'welcome',id:s.id,token:s.token,protocol:1});}
  function transferHost(room) {if(!room.players.some(p=>p.id===room.hostId&&p.session.ws))room.hostId=room.players.find(p=>p.session.ws)?.id||room.players[0]?.id||null;}
  function detach(s, explicit=false) {
    if(!s.room)return;
    const room=rooms.get(s.room);s.room=null;s.input=null;
    if(!room)return;
    const p=room.players.find(p=>p.id===s.id);
    if(p){p.ready=false;if(room.match)engine.setPlayerConnected(room.match,s.id,false);if(explicit||!room.match)room.players=room.players.filter(p=>p.id!==s.id);}
    if(!room.players.length){rooms.delete(room.code);return;}
    transferHost(room);room.touched=Date.now();broadcastRoom(room);
  }
  function assignRoom(s, room, name, team) {
    s.room=room.code;s.name=name;s.input=null;s.lastSeq=-1;
    room.players.push({id:s.id,name,team,ready:false,session:s});room.touched=Date.now();
    broadcastRoom(room);
  }
  function makeCode(){let code;do{const bytes=randomBytes(6);code=Array.from(bytes,n=>ALPHABET[n%ALPHABET.length]).join('');}while(rooms.has(code));return code;}
  function requireHost(s) {const room=rooms.get(s.room);if(!room){error(s,'Najpierw dołącz do pokoju.');return null;}if(room.hostId!==s.id){error(s,'Tę decyzję podejmuje gospodarz pokoju.');return null;}return room;}
  function start(room) {
    const connected=room.players.filter(p=>p.session.ws);
    if(connected.length!==room.players.length||!connected.every(p=>p.ready))return 'Wszyscy gracze muszą być połączeni i gotowi.';
    if(room.mode==='versus'){
      const sf=connected.filter(p=>p.team==='salesforce').length,xl=connected.filter(p=>p.team==='excel').length;
      if(sf<1||xl<1||sf!==xl||sf>3)return 'VS wymaga równych drużyn: 1 na 1, 2 na 2 lub 3 na 3.';
    }else if(!connected.length||connected.length>3)return 'Kooperacja obsługuje od 1 do 3 graczy.';
    room.match=engine.createMatch({mode:room.mode,players:connected.map(({id,name,team})=>({id,name,team})),mission:room.campaign.mission,upgrades:room.mode==='coop'?{...room.campaign.upgrades}:{},credits:room.mode==='coop'?room.campaign.credits:0,seed:1 + (randomBytes(4).reduce((n,b)=>(n*256+b)>>>0,0)%0x7ffffffe)});
    room.lastPhase=room.match.phase;room.offlineSince=null;room.forfeitSince=null;room.touched=Date.now();
    for(const p of room.players){p.session.input=null;p.session.lastSeq=-1;}
    broadcastRoom(room);broadcastState(room);return null;
  }
  function handle(s,m) {
    if(!m||typeof m!=='object'||Array.isArray(m)||typeof m.t!=='string')return error(s,'Niepoprawna wiadomość.');
    s.lastSeen=Date.now();
    if(m.t==='ping'){send(s,{t:'pong',at:Number.isFinite(m.at)?m.at:0});return;}
    if(m.t==='create'){
      if(s.room)return error(s,'Opuść obecny pokój przed utworzeniem nowego.');
      if(rooms.size>=MAX_ROOMS)return error(s,'Serwer ma komplet pokojów. Spróbuj później.');
      const name=cleanName(m.name);if(!name||!['coop','versus'].includes(m.mode))return error(s,'Podaj imię i poprawny tryb gry.');
      const code=makeCode(),room={code,mode:m.mode,hostId:s.id,players:[],campaign:freshProgress(),match:null,lastPhase:null,touched:Date.now(),offlineSince:null,forfeitSince:null};rooms.set(code,room);assignRoom(s,room,name,'salesforce');return;
    }
    if(m.t==='join'){
      if(typeof m.code!=='string')return error(s,'Niepoprawny kod pokoju.');
      const code=m.code.trim().toUpperCase(),room=rooms.get(code);if(!room)return error(s,'Nie znaleziono pokoju. Serwer mógł się zrestartować — utwórz nowy i wczytaj zapis coop.');
      if(s.room)return error(s,'Jesteś już w pokoju.');
      if(typeof m.token==='string'){
        const old=sessions.get(m.token),p=room.players.find(p=>p.session===old);
        if(!old||!p)return error(s,'Sesja wygasła. Dołącz ponownie jako nowy gracz.');
        sessions.delete(s.token);
        if(old.ws&&old.ws!==s.ws){const replaced=old.ws;old.ws=null;replaced.close(4001,'Session resumed elsewhere');}
        old.ws=s.ws;old.lastSeen=Date.now();old.input=null;old.lastSeq=-1;old.pong=true;
        s.ws._session=old;s.room=null;s.ws=null;connections.delete(s);connections.add(old);
        old.room=room.code;if(room.match){engine.setPlayerConnected(room.match,old.id,true);const resumedPlayer=room.match.players.find(p=>p.id===old.id);if(resumedPlayer)resumedPlayer.lastSeq=-1;}
        if(!room.match)p.ready=false;room.touched=Date.now();room.offlineSince=null;transferHost(room);
        welcome(old);broadcastRoom(room);broadcastState(room);return;
      }
      if(room.match)return error(s,'Rozgrywka już trwa. Dołącz przed rozpoczęciem meczu.');
      const max=room.mode==='coop'?3:6;if(room.players.length>=max)return error(s,'Pokój jest pełny.');
      const name=cleanName(m.name);if(!name)return error(s,'Podaj nazwę gracza.');
      let team='salesforce';if(room.mode==='versus'){const sf=room.players.filter(p=>p.team==='salesforce').length,xl=room.players.length-sf;team=sf<=xl?'salesforce':'excel';if(room.players.filter(p=>p.team===team).length>=3)team=team==='salesforce'?'excel':'salesforce';}
      assignRoom(s,room,name,team);return;
    }
    const room=rooms.get(s.room),member=room?.players.find(p=>p.id===s.id);
    if(!room||!member)return error(s,'Najpierw utwórz pokój lub dołącz do znajomych.');
    if(m.t==='leave'){detach(s,true);send(s,{t:'left'});return;}
    if(m.t==='input'){
      if(!room.match||room.match.phase!=='playing')return;
      if(!Number.isSafeInteger(m.seq)||m.seq<0||m.seq<=s.lastSeq)return;
      const input=engine.normalizeInput(m);if(!input)return error(s,'Odrzucono niepoprawne sterowanie.');
      s.lastSeq=m.seq;s.input=input;s.inputTime=Date.now();return;
    }
    if(m.t==='team'){
      if(room.match)return error(s,'Drużynę zmienia się przed meczem.');
      if(room.mode!=='versus'||!['salesforce','excel'].includes(m.team))return error(s,'Niepoprawna drużyna.');
      if(room.players.filter(p=>p.team===m.team&&p.id!==s.id).length>=3)return error(s,'Drużyna ma już trzech graczy.');
      member.team=m.team;member.ready=false;broadcastRoom(room);return;
    }
    if(m.t==='ready'){if(room.match)return error(s,'Mecz już wystartował.');if(typeof m.ready!=='boolean')return error(s,'Niepoprawny stan gotowości.');member.ready=m.ready;broadcastRoom(room);return;}
    if(m.t==='start'){const r=requireHost(s);if(!r)return;if(r.match)return error(s,'Mecz już wystartował.');const reason=start(r);if(reason)error(s,reason);return;}
    if(m.t==='next'){
      const r=requireHost(s);if(!r||!r.match)return;
      if(r.match.phase==='intermission'){
        engine.continueMatch(r.match);r.lastPhase=r.match.phase;for(const p of r.players)p.session.input=null;broadcastRoom(r);broadcastState(r);broadcastCheckpoint(r);return;
      }
      if(r.match.phase!=='finished')return error(s,'Najpierw zakończ bieżące starcie.');
      syncCampaign(r);
      if(r.mode==='coop'&&r.match.result?.outcome==='victory')r.campaign.mission=Math.min(missions().length-1,r.campaign.mission+1);
      r.match=null;for(const p of r.players)p.ready=!!p.session.ws;
      const reason=start(r);if(reason)error(s,reason);broadcastCheckpoint(r);return;
    }
    if(m.t==='mission'){
      const r=requireHost(s);if(!r)return;
      if(r.mode!=='coop'||r.match)return error(s,'Misję wybiera się w lobby kooperacji.');
      if(!Number.isInteger(m.mission)||m.mission<0||m.mission>r.campaign.unlocked)return error(s,'Ta misja jest jeszcze zablokowana.');
      r.campaign.mission=m.mission;broadcastRoom(r);broadcastCheckpoint(r);return;
    }
    if(m.t==='upgrade'){
      const r=requireHost(s);if(!r)return;if(r.mode!=='coop'||!UPGRADE_KEYS.includes(m.key))return error(s,'Niepoprawne ulepszenie.');
      if(r.match?.phase==='playing')return error(s,'Ulepszenia kupuje się między starciami.');
      if(r.match){if(!engine.buyTeamUpgrade(r.match,m.key))return error(s,'Brak kredytów albo osiągnięto maksymalny poziom.');syncCampaign(r);}
      else{const level=r.campaign.upgrades[m.key],def=shared.UPGRADES[m.key],cost=def.baseCost*(level+1);if(level>=5||r.campaign.credits<cost)return error(s,'Brak kredytów albo osiągnięto maksymalny poziom.');r.campaign.credits-=cost;r.campaign.upgrades[m.key]++;}
      broadcastRoom(r);broadcastState(r);broadcastCheckpoint(r);return;
    }
    if(m.t==='exportCampaign'){if(room.mode!=='coop')return error(s,'Zapis kampanii dotyczy kooperacji.');syncCampaign(room);send(s,{t:'campaign',campaign:checkpoint(room),download:true});return;}
    if(m.t==='importCampaign'){
      const r=requireHost(s);if(!r)return;if(r.mode!=='coop'||r.match)return error(s,'Zapis coop wczytuje się w nowym lobby.');
      const progress=validateCheckpoint(m.campaign);if(!progress)return error(s,'Niepoprawny zapis kooperacji.');
      r.campaign=progress;for(const p of r.players)p.ready=false;broadcastRoom(r);broadcastCheckpoint(r);return;
    }
    error(s,'Nieznana komenda.');
  }
  function tick(dt=1/tickRate) {
    const now=Date.now();
    for(const [code,room]of rooms){
      // Lost lobby tabs must not permanently occupy a place or block everyone else's readiness.
      if(!room.match||room.match.phase==='finished'){
        const expired=room.players.filter(p=>!p.session.ws&&now-p.session.lastSeen>90000);
        if(expired.length){
          const expiredIds=new Set(expired.map(p=>p.id));room.players=room.players.filter(p=>!expiredIds.has(p.id));
          for(const p of expired){if(p.session.room===code)p.session.room=null;sessions.delete(p.session.token)}
          if(!room.players.length){rooms.delete(code);continue;}
          transferHost(room);broadcastRoom(room);
        }
      }
      const connected=room.players.filter(p=>p.session.ws?.readyState===OPEN);
      if(!connected.length){room.offlineSince??=now;if(now-room.offlineSince>ROOM_TTL){for(const p of room.players){if(p.session.room===code)p.session.room=null;if(!p.session.ws)sessions.delete(p.session.token)}rooms.delete(code)}continue;}
      room.offlineSince=null;
      if(!room.match)continue;
      if(room.mode==='versus'&&room.match.phase==='playing'){
        const sf=connected.some(p=>p.team==='salesforce'),xl=connected.some(p=>p.team==='excel');
        if(!sf||!xl){room.forfeitSince??=now;if(now-room.forfeitSince>30000)engine.finishMatch(room.match,{outcome:'victory',winner:sf?'salesforce':'excel',reason:'Drużyna przeciwna utraciła połączenie.'});}else room.forfeitSince=null;
      }
      if(room.match.phase==='playing'){
        const inputs={};
        for(const p of room.players){const s=p.session;if(s.ws&&s.input&&now-s.inputTime<350){inputs[p.id]=s.input;s.input={...s.input,dash:false,ability:false};}}
        engine.stepMatch(room.match,Math.min(.1,Math.max(0,dt)),inputs);
      }
      if(room.match.phase!==room.lastPhase){room.lastPhase=room.match.phase;syncCampaign(room);broadcastRoom(room);broadcastCheckpoint(room);broadcastState(room);}
    }
    for(const [token,s]of sessions)if(!s.ws&&!s.room&&now-s.lastSeen>ROOM_TTL)sessions.delete(token);
  }
  function connect(ws){
    if(connections.size>=MAX_SESSIONS){ws.close(1013,'Server full');return false;}
    const s={id:crypto.randomUUID(),token:Array.from(randomBytes(24),n=>n.toString(16).padStart(2,'0')).join(''),ws,room:null,name:'',lastSeq:-1,input:null,inputTime:0,lastSeen:Date.now(),rateAt:Date.now(),rate:0,pong:true};sessions.set(s.token,s);connections.add(s);ws._session=s;welcome(s);
    ws.on('pong',()=>{if(ws._session)ws._session.pong=true});
    ws.on('message',(raw,binary)=>{
      const current=ws._session;if(!current||current.ws!==ws)return;
      const now=Date.now();if(now-current.rateAt>=1000){current.rateAt=now;current.rate=0}if(++current.rate>100){ws.close(1008,'Message rate exceeded');return;}
      if(binary)return error(current,'Wiadomości muszą być tekstowym JSON-em.');
      const rawText=typeof raw==='string'?raw:raw.toString();if(rawText.length>8192||new TextEncoder().encode(rawText).length>8192){ws.close(1009,'Message too large');return;}
      let m;try{m=JSON.parse(rawText)}catch{return error(current,'Niepoprawny JSON.');}
      try{handle(current,m)}catch(err){console.error('Message processing failed:',err.message);error(current,'Nie udało się wykonać komendy. Spróbuj ponownie.');}
    });
    ws.on('close',()=>{
      const current=ws._session;if(!current||current.ws!==ws)return;current.ws=null;current.input=null;current.lastSeen=Date.now();connections.delete(current);if(!current.room)sessions.delete(current.token);
      const room=rooms.get(current.room);if(room){const p=room.players.find(p=>p.id===current.id);if(p)p.ready=false;if(room.match)engine.setPlayerConnected(room.match,current.id,false);transferHost(room);room.touched=Date.now();broadcastRoom(room);}
    });
    ws.on('error',()=>{});

    return true;
  }

  function broadcastStates(){for(const room of rooms.values())broadcastState(room)}
  function heartbeat(){
    for(const s of connections){
      if(!s.ws||s.ws.readyState!==OPEN)continue;
      if(typeof s.ws.ping==='function'){if(!s.pong){s.ws.terminate();continue;}s.pong=false;s.ws.ping();}
      else if(Date.now()-s.lastSeen>90000)s.ws.terminate();
    }
  }
  function disconnectAll(){for(const s of connections)s.ws?.terminate();rooms.clear();sessions.clear();connections.clear()}
  return {rooms,sessions,connections,tick,broadcastRoom,broadcastState,broadcastStates,connect,heartbeat,disconnectAll};
}
function publicConfig(){return {protocol:1,version:11,limits:{coop:3,versus:6,team:3},missions:missions(),upgrades:shared.UPGRADES,teams:shared.FACTIONS,stats:shared.VS_STATS,versus:{scoreLimit:15,duration:360}}}
module.exports={createRoomService,validateCheckpoint,freshProgress,publicConfig,MAX_SESSIONS};
