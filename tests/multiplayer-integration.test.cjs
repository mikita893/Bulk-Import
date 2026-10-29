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
function input(seq,extra={}){return {t:'input',seq,mx:0,mz:0,ax:0,az:0,fire:false,dash:false,ability:false,secondary:false,interact:false,...extra}}

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


test('v12 real sockets replicate distinct faction Q/F, counterplay and preserved skill state',async t=>{
 const env=await setup(t),sf=await env.peer(),xl=await env.peer();
 const config=await (await fetch(env.origin+'/api/config')).json();assert.equal(config.version,require('../release.cjs').major);assert(config.factionKits?.salesforce&&config.factionKits?.excel,'Public faction kits describe distinct mechanics');
 const {room}=await sf.command({t:'create',name:'Apex administrator',mode:'versus'});await xl.command({t:'join',code:room.code,name:'Tabela przestawna'});await sf.command({t:'team',team:'salesforce'});await xl.command({t:'team',team:'excel'});await sf.command({t:'ready',ready:true});await xl.command({t:'ready',ready:true});let after=sf.mark();sf.send({t:'start'});await stateAfter(sf,s=>s.phase==='playing',after);
 const match=env.app.rooms.get(room.code).match,a=match.players.find(p=>p.id===sf.id),b=match.players.find(p=>p.id===xl.id);
 const resetPositions=()=>{match.obstacles=[];match.projectiles=[];match.effects=[];a.x=-7;a.z=14;b.x=7;b.z=14;for(const p of [a,b]){p.inv=0;p.spawnProtected=false;p.hp=140;p.shield=40;p.abilityCooldown=0;p.secondaryCooldown=0;p.barrierRemaining=0;p.barrierHp=0;p.slowRemaining=0;p.undoPending=0}};
 resetPositions();
 // Apex is a travelling query; pivot is an aimed, delayed rectangular table.
 after=sf.mark();sf.send(input(10,{ability:true,ax:7,az:14}));const apex=await stateAfter(sf,s=>s.projectiles.some(p=>p.kind==='apex'),after);assert(apex.players.find(p=>p.id===sf.id).abilityCooldown>8);await stateAfter(xl,s=>s.projectiles.some(p=>p.kind==='apex'));
 a.inv=0;a.hp=140;a.shield=40;const sfPivotMark=sf.mark();after=xl.mark();xl.send(input(10,{ability:true,ax:-5,az:14}));const marked=await stateAfter(xl,s=>s.effects?.some(e=>e.kind==='pivot'&&e.phase==='warning'),after);const table=marked.effects.find(e=>e.kind==='pivot');assert.equal(table.width,6);assert.equal(table.depth,5);assert(table.remaining>.4,'Pivot must be readable before it resolves');assert.equal(marked.players.find(p=>p.id===sf.id).hp,140);assert.equal(marked.players.find(p=>p.id===sf.id).shield,40);
 await stateAfter(sf,s=>s.effects?.some(e=>e.kind==='pivot'&&e.phase==='warning'),sfPivotMark);
 // A dash/move out of the warning remains a real counter; no homing target.
 a.x=-15;a.z=14;const safeTotal=a.hp+a.shield;await stateAfter(sf,s=>!s.effects?.some(e=>e.kind==='pivot'&&e.phase==='warning'));assert.equal(a.hp+a.shield,safeTotal,'Escaping the warned rectangle avoids damage');
 // Directional Permission Set blocks incoming shots, instead of healing damage.
 resetPositions();after=sf.mark();sf.send(input(20,{secondary:true,ax:7,az:14}));const guarded=await stateAfter(sf,s=>s.players.find(p=>p.id===sf.id)?.barrierRemaining>1,after);const ownGuard=guarded.players.find(p=>p.id===sf.id);assert.equal(ownGuard.barrierHp,42);assert(ownGuard.secondaryCooldown>11);assert.equal(a.hp+a.shield,180);
 after=sf.mark();xl.send(input(20,{fire:true,ax:-7,az:14}));const blocked=await stateAfter(sf,s=>{const p=s.players.find(p=>p.id===sf.id);return p.barrierHp<42&&p.barrierHp>0},after);xl.send(input(21));const protectedPlayer=blocked.players.find(p=>p.id===sf.id);assert.equal(protectedPlayer.hp+protectedPlayer.shield,180,'Frontal barrier absorbs actual wire-fired shots');const remaining=protectedPlayer.barrierHp;
 await errorAfter(sf,input(21,{secondary:'true'}));after=sf.mark();sf.send(input(22,{secondary:true,ax:7,az:14}));const noSpam=await stateAfter(sf,s=>s.players.find(p=>p.id===sf.id).secondaryCooldown<ownGuard.secondaryCooldown,after);assert(noSpam.players.find(p=>p.id===sf.id).barrierHp<=remaining,'A fresh packet cannot bypass F cooldown');
 // Ctrl+Z requires real recent damage, and returns at most the capped loss.
 match.projectiles=[];b.hp=140;b.shield=0;b.inv=0;b.spawnProtected=false;b.secondaryCooldown=0;const beforeHit=b.hp+b.shield;after=xl.mark();sf.send(input(30,{fire:true,ax:7,az:14}));await stateAfter(xl,s=>{const p=s.players.find(p=>p.id===xl.id);return p.hp+p.shield<beforeHit},after);sf.send(input(31));match.projectiles=[];const wounded=b.hp+b.shield;after=xl.mark();xl.send(input(30,{secondary:true,ax:-7,az:14}));const undo=await stateAfter(xl,s=>s.players.find(p=>p.id===xl.id)?.undoPending>0,after);assert(undo.players.find(p=>p.id===xl.id).secondaryCooldown>11);const restored=await stateAfter(xl,s=>{const p=s.players.find(p=>p.id===xl.id);return p.hp+p.shield>wounded},after);const restoredPlayer=restored.players.find(p=>p.id===xl.id);assert(restoredPlayer.hp+restoredPlayer.shield<=wounded+28+.001,'Ctrl+Z recovery stays bounded');assert(restored.effects.some(e=>e.kind==='rewind')||restoredPlayer.rewindFlash>0);
 // Cover blocks query projectiles and the table impact line of sight.
 resetPositions();match.obstacles=[{x:0,z:14,w:2,d:12}];a.x=-4;b.x=4;after=sf.mark();sf.send(input(40,{ability:true,ax:4,az:14}));xl.send(input(40,{ability:true,ax:-4,az:14}));await stateAfter(sf,s=>s.players.find(p=>p.id===sf.id).abilityCooldown>0&&s.players.find(p=>p.id===xl.id).abilityCooldown>0,after);for(let i=0;i<40;i++)env.app.tick(1/30);assert.equal(a.hp+a.shield,180,'Cover protects against table impact');assert.equal(b.hp+b.shield,180,'Cover stops Apex queries');
 // Reconnecting preserves resources and active F state rather than granting resets.
 match.obstacles=[];match.projectiles=[];match.effects=[];a.hp=91;a.shield=7;a.secondaryCooldown=7.2;a.barrierRemaining=1.5;a.barrierHp=14;a.barrierAngle=Math.PI/2;
 const stableId=sf.id,token=sf.token;await sf.close();const resumed=await env.peer();after=resumed.mark();resumed.send({t:'join',code:room.code,name:'Apex administrator',token});await resumed.wait(m=>m.t==='welcome'&&m.id===stableId,after);const preserved=await stateAfter(resumed,s=>s.players.some(p=>p.id===stableId&&p.connected),after);const p=preserved.players.find(p=>p.id===stableId);assert.equal(p.hp,91);assert.equal(p.shield,7);assert(p.secondaryCooldown<=7.2&&p.secondaryCooldown>6.5);assert.equal(p.barrierHp,0,'Disconnect cancels the active shield without refunding its cooldown');assert.equal(p.barrierRemaining,0);
 a.hp=0;a.shield=0;a.alive=false;a.respawnIn=.01;env.app.tick(1/30);assert.equal(a.barrierRemaining,0,'Respawn clears the prior Permission Set');assert.equal(a.barrierHp,0);assert.equal(a.undoPending,0);assert.equal(a.secondaryCooldown,0);
});
