'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const WebSocket=require('ws');
const {createGameServer}=require('../server/index.cjs');

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class Peer{
 constructor(ws){this.ws=ws;this.messages=[];this.pending=[];ws.on('message',data=>{const message=JSON.parse(String(data));this.messages.push(message);for(const item of [...this.pending])if(item.predicate(message)){clearTimeout(item.timer);this.pending.splice(this.pending.indexOf(item),1);item.resolve(message)}})}
 static async connect(url){const ws=new WebSocket(url);const peer=new Peer(ws);await once(ws,'open');const welcome=await peer.wait(m=>m.t==='welcome');peer.id=welcome.id;peer.token=welcome.token;return peer}
 mark(){return this.messages.length}
 send(message){this.ws.send(JSON.stringify(message))}
 wait(predicate,after=0,timeout=5000){const found=this.messages.slice(after).find(predicate);if(found)return Promise.resolve(found);return new Promise((resolve,reject)=>{const item={predicate,resolve,timer:setTimeout(()=>{const at=this.pending.indexOf(item);if(at>=0)this.pending.splice(at,1);reject(Error('Timed out waiting for server message. Recent: '+JSON.stringify(this.messages.slice(-4),(key,value)=>key==='token'?'[redacted]':value)))},timeout)};this.pending.push(item)})}
 async command(message,predicate=m=>m.t==='room'){const after=this.mark();this.send(message);return this.wait(predicate,after)}
 async close(){if(this.ws.readyState===WebSocket.CLOSED)return;const closed=once(this.ws,'close');this.ws.close();await closed}
}

async function setup(t){const app=createGameServer({port:0,host:'127.0.0.1'});const info=await app.listen();const origin='http://127.0.0.1:'+info.port,url='ws://127.0.0.1:'+info.port+'/ws';const peers=[];t.after(async()=>{await Promise.allSettled(peers.map(p=>p.close()));await app.close()});return {app,origin,url,peers,async peer(){const p=await Peer.connect(url);peers.push(p);return p}}}
function stateAfter(peer,predicate,after=peer.mark()){return peer.wait(m=>m.t==='state'&&predicate(m.state),after).then(m=>m.state)}
function errorAfter(peer,message){return peer.command(message,m=>m.t==='error')}
function input(seq,extra={}){return {t:'input',seq,mx:0,mz:0,ax:0,az:0,fire:false,dash:false,ability:false,interact:false,...extra}}

// These assertions exercise actual sockets and the server's public protocol. Private
// room access below is test setup only; no equivalent admin message exists on the wire.
test('six real clients: fair 3v3 lobby, authority, sequence handling and reconnection',async t=>{
 const env=await setup(t),host=await env.peer();
 const created=await host.command({t:'create',name:'Admin bez duplikatów',mode:'versus'});const code=created.room.code;
 assert.match(code,/^[A-Z0-9]{6}$/);assert.equal(created.room.hostId,host.id);
 const players=[host];
 await host.command({t:'team',team:'salesforce'});
 for(let i=1;i<6;i++){const p=await env.peer();await p.command({t:'join',code,name:'Gracz '+i});await p.command({t:'team',team:i<3?'salesforce':'excel'});players.push(p)}
 const latest=await host.wait(m=>m.t==='room'&&m.room.players.length===6);assert.equal(latest.room.players.filter(p=>p.team==='salesforce').length,3);assert.equal(latest.room.players.filter(p=>p.team==='excel').length,3);
 const seventh=await env.peer();await errorAfter(seventh,{t:'join',code,name:'Siódmy'});
 await errorAfter(players[3],{t:'team',team:'salesforce'});
 await errorAfter(players[1],{t:'start'});
 await errorAfter(host,{t:'start'});
 for(const p of players)await p.command({t:'ready',ready:true});
 const mark=host.mark();host.send({t:'start'});const initial=await stateAfter(host,s=>s.mode==='versus'&&s.phase==='playing'&&s.players.length===6,mark);
 assert.deepEqual(initial.scores,{salesforce:0,excel:0});
 assert.equal(initial.enemies.length,0);assert(initial.players.every(p=>Number.isFinite(p.hp)&&Number.isFinite(p.shield)));
 const local=initial.players.find(p=>p.id===host.id);assert(local);
 const privateTokens=players.map(p=>p.token);for(const peer of players)for(const message of peer.messages.filter(m=>m.t==='room'||m.t==='state')){const serialized=JSON.stringify(message);assert(privateTokens.every(token=>!serialized.includes(token)),'Session tokens never broadcast');}
 let after=host.mark();host.send(input(100,{mx:1}));let moving=await stateAfter(host,s=>s.players.some(p=>p.id===host.id&&p.x>local.x+.1),after);const beforeReplay=moving.players.find(p=>p.id===host.id).x;
 after=host.mark();host.send(input(99,{mx:-1,x:99999,hp:99999,damage:99999}));await delay(140);moving=await stateAfter(host,s=>s.players.some(p=>p.id===host.id&&p.x>beforeReplay+.05),after);assert(moving.players.every(p=>Math.abs(p.x)<=25&&Math.abs(p.z)<=21&&p.hp<=p.maxHp));
 host.send(input(101));
 // Malformed input must not poison the room or allow a client to claim position/HP.
 host.send({t:'input',seq:102,mx:null,mz:Infinity,ax:'bad',az:0,fire:true,x:1e9,damage:1e9});
 after=host.mark();host.send(input(103));const healthy=await stateAfter(host,s=>s.players.length===6,after);assert(healthy.players.every(p=>['x','z','hp','shield'].every(k=>Number.isFinite(p[k]))));
 // Losing one tab preserves a stable identity; reconnect uses a non-shared token.
 const returning=players[2],oldId=returning.id,token=returning.token;returning.send(input(500));await delay(60);const oldPosition=env.app.rooms.get(code).match.players.find(p=>p.id===oldId).x;await returning.close();const resumed=await env.peer();after=resumed.mark();resumed.send({t:'join',code,name:'Zmiana nazwy nie zmienia tożsamości',token});const welcome=await resumed.wait(m=>m.t==='welcome'&&m.id===oldId,after);assert.equal(welcome.token,token);const room=await resumed.wait(m=>m.t==='room'&&m.room.players.some(p=>p.id===oldId&&p.connected),after);assert.equal(room.room.players.length,6);after=resumed.mark();resumed.send(input(0,{mx:1}));await stateAfter(resumed,s=>s.players.some(p=>p.id===oldId&&p.x>oldPosition+.1),after);resumed.send(input(1));
 const thief=await env.peer();await errorAfter(thief,{t:'join',code,name:'Nieznany',token:'invalid-token'});
 await errorAfter(resumed,{t:'start'}); // Returning player does not gain the host role.
 assert(env.app.rooms.get(code));
});

test('unequal teams cannot start, and a small versus match replicates projectiles',async t=>{
 const env=await setup(t),a=await env.peer(),b=await env.peer();const {room}=await a.command({t:'create',name:'SF',mode:'versus'});await b.command({t:'join',code:room.code,name:'XLSX'});await a.command({t:'team',team:'salesforce'});await b.command({t:'team',team:'salesforce'});await a.command({t:'ready',ready:true});await b.command({t:'ready',ready:true});await errorAfter(a,{t:'start'});
 await b.command({t:'team',team:'excel'});await b.command({t:'ready',ready:true});await a.command({t:'ready',ready:true});let after=a.mark();a.send({t:'start'});await stateAfter(a,s=>s.phase==='playing',after);
 after=a.mark();a.send(input(1,{ax:20,az:0,fire:true}));const state=await stateAfter(a,s=>s.projectiles.length>0,after);const remote=await stateAfter(b,s=>s.projectiles.length>0);assert.equal(state.players.length,remote.players.length);assert(state.projectiles.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));a.send(input(2));
});

test('co-op lobby, portable checkpoint validation, host controls and preserved solo campaign',async t=>{
 const env=await setup(t),host=await env.peer();let friend=await env.peer();
 const home=await fetch(env.origin+'/');assert.equal(home.status,200);const solo=await fetch(env.origin+'/Bulk-Import-Omega-3D-v10.html');assert.equal(solo.status,200);assert((await solo.text()).includes("SAVE_KEY='bulk-import-omega-3d-v10'"));
 for(const route of ['/server/index.cjs','/package-lock.json','/.git/config']){const res=await fetch(env.origin+route);assert.equal(res.status,404,'Private application files are not publicly served');}
 const {room}=await host.command({t:'create',name:'Dowódca',mode:'coop'});await friend.command({t:'join',code:room.code,name:'Partner'});await errorAfter(friend,{t:'mission',mission:1});await errorAfter(host,{t:'mission',mission:999});
 const stableFriendId=friend.id,stableFriendToken=friend.token;await friend.close();friend=await env.peer();let resumeAfter=friend.mark();friend.send({t:'join',code:room.code,name:'Partner',token:stableFriendToken});const resumeWelcome=await friend.wait(m=>m.t==='welcome'&&m.id===stableFriendId,resumeAfter);friend.id=resumeWelcome.id;friend.token=resumeWelcome.token;await friend.wait(m=>m.t==='room'&&m.room.players.length===2&&m.room.players.some(p=>p.id===stableFriendId&&p.connected),resumeAfter);
 const friendBackup=await friend.command({t:'exportCampaign'},m=>m.t==='campaign');assert(friendBackup.campaign,'Every co-op member can preserve the shared campaign');await errorAfter(friend,{t:'importCampaign',campaign:friendBackup.campaign});
 const exported=await host.command({t:'exportCampaign'},m=>m.t==='campaign');assert(exported.campaign&&typeof exported.campaign==='object');
 const bad=JSON.parse(JSON.stringify(exported.campaign));bad.progress.credits=1e20;await errorAfter(host,{t:'importCampaign',campaign:bad});
 await host.command({t:'importCampaign',campaign:exported.campaign});
 await host.command({t:'ready',ready:true});await friend.command({t:'ready',ready:true});let after=host.mark();host.send({t:'start'});const initial=await stateAfter(host,s=>s.mode==='coop'&&s.phase==='playing',after);assert.equal(initial.players.length,2);assert(initial.missionName);assert(initial.waves>=1);assert(Number.isFinite(initial.teamCredits));
 await errorAfter(friend,{t:'next'});await errorAfter(host,{t:'importCampaign',campaign:exported.campaign});
 // Set up the post-victory condition inside this isolated server instance. The
 // next action still travels over WebSocket and must use server-owned progress.
 const stored=env.app.rooms.get(room.code);assert(stored?.match);
 const match=stored.match,rescuer=match.players.find(p=>p.id===host.id),downed=match.players.find(p=>p.id===friend.id);
 match.enemies=[];match.projectiles=[];match.spawnClock=999;rescuer.x=0;rescuer.z=13;downed.x=1;downed.z=13;downed.hp=0;downed.alive=false;downed.downed=true;downed.bleedOut=18;downed.reviveProgress=0;
 after=host.mark();host.send(input(10,{interact:true}));await delay(30);for(let i=0;i<70;i++)env.app.tick(1/30);
 const revived=await stateAfter(host,s=>s.players.some(p=>p.id===friend.id&&p.alive&&!p.downed),after);assert(revived.players.find(p=>p.id===friend.id).hp>0,'Holding E revives a teammate on the authoritative server');host.send(input(11));
 stored.match.phase='finished';stored.match.result={outcome:'victory',mission:0,nextMission:1};env.app.tick(1/30);
 after=host.mark();host.send({t:'next'});const next=await stateAfter(host,s=>s.mode==='coop'&&s.mission===1&&s.phase==='playing',after);assert.notEqual(next.missionName,initial.missionName);assert.notDeepEqual(next.obstacles,initial.obstacles,'Co-op missions change map layouts');
});
