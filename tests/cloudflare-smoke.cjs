'use strict';
// Run against `npm run dev:cloudflare`; this exercises the native workerd/DO transport.
const assert=require('node:assert/strict');
const {WebSocket}=require('ws');
const origin=process.env.BULK_ORIGIN||'http://127.0.0.1:8787';
const clients=[];
function connect(){
 const ws=new WebSocket(origin.replace(/^http/,'ws')+'/ws'),queue=[],pending=[];
 const client={ws,queue,send:m=>ws.send(JSON.stringify(m)),wait(test,timeout=6000){
  const at=queue.findIndex(test);if(at>=0)return Promise.resolve(queue.splice(at,1)[0]);
  return new Promise((resolve,reject)=>{const waiter={test,resolve:m=>{clearTimeout(waiter.timer);resolve(m)}};waiter.timer=setTimeout(()=>{const at=pending.indexOf(waiter);if(at>=0)pending.splice(at,1);reject(Error('Timed out waiting for Worker message'))},timeout);pending.push(waiter)});
 }};
 ws.on('message',data=>{const message=JSON.parse(data.toString()),at=pending.findIndex(w=>w.test(message));if(at>=0)pending.splice(at,1)[0].resolve(message);else{queue.push(message);if(queue.length>150)queue.shift()}});
 ws.on('error',()=>{});clients.push(client);return client;
}
const type=t=>m=>m.t===t;
(async()=>{
 try{
  const health=await fetch(origin+'/healthz');assert.equal(health.status,200);assert.equal((await health.json()).version,require('../release.cjs').major);
  const config=await (await fetch(origin+'/api/config')).json();assert.equal(config.missions.length,6);assert.equal(config.limits.team,3);assert(config.factionKits?.salesforce&&config.factionKits?.excel);
  assert.equal((await fetch(origin+'/server/rooms.cjs')).status,404);
  assert.equal((await fetch(origin+'/'+require('../release.cjs').filename)).status,200);
  const host=connect(),identity=await host.wait(type('welcome'));host.identity=identity;host.send({t:'create',name:'DO Host',mode:'versus'});const room=(await host.wait(type('room'))).room;
  for(let i=1;i<6;i++){const client=connect();client.identity=await client.wait(type('welcome'));client.send({t:'join',code:room.code,name:'DO Player '+i});await client.wait(type('room'))}
  const six=await host.wait(m=>m.t==='room'&&m.room.players.length===6);assert.equal(six.room.players.filter(p=>p.team==='salesforce').length,3);assert.equal(six.room.players.filter(p=>p.team==='excel').length,3);
  for(const client of clients)client.send({t:'ready',ready:true});await host.wait(m=>m.t==='room'&&m.room.players.every(p=>p.ready));host.send({t:'start'});
  const first=(await host.wait(m=>m.t==='state'&&m.state.phase==='playing')).state;assert.equal(first.players.length,6);assert(first.players.every(p=>p.maxHp===140&&p.maxShield===40));const before=first.players.find(p=>p.id===identity.id);assert.notEqual(first.players.find(p=>p.team==='salesforce').abilityName,first.players.find(p=>p.team==='excel').abilityName);
  host.send({t:'input',seq:1,mx:0,mz:0,ax:-5,az:-10,fire:false,dash:false,ability:true,secondary:false,interact:false});await host.wait(m=>m.t==='state'&&m.state.projectiles.some(p=>p.kind==='apex'));const excelClient=clients.find(c=>first.players.find(p=>p.id===c.identity?.id)?.team==='excel');excelClient.send({t:'input',seq:1,mx:0,mz:0,ax:13,az:-14,fire:false,dash:false,ability:true,secondary:false,interact:false});await host.wait(m=>m.t==='state'&&m.state.effects?.some(e=>e.kind==='pivot'&&e.phase==='warning'));host.send({t:'input',seq:2,mx:0,mz:0,ax:19,az:-10,fire:false,dash:false,ability:false,secondary:true,interact:false});await host.wait(m=>m.t==='state'&&m.state.players.find(p=>p.id===identity.id)?.barrierRemaining>0);
  host.send({t:'input',seq:5000,mx:0,mz:1,ax:0,az:0,fire:false,dash:false,ability:false,interact:false,x:99,hp:9999});
  const moved=(await host.wait(m=>m.t==='state'&&m.state.players.find(p=>p.id===identity.id)?.z>before.z+.3)).state.players.find(p=>p.id===identity.id);assert.equal(moved.x,before.x);assert.equal(moved.hp,140);
  host.ws.terminate();const resumed=connect();await resumed.wait(type('welcome'));resumed.send({t:'join',code:room.code,name:'DO Host',token:identity.token});const stable=await resumed.wait(m=>m.t==='welcome'&&m.id===identity.id);assert.equal(stable.token,identity.token);await resumed.wait(type('room'));const restored=(await resumed.wait(type('state'))).state.players.find(p=>p.id===identity.id);resumed.send({t:'input',seq:0,mx:0,mz:1,ax:0,az:0,fire:false,dash:false,ability:false,interact:false});await resumed.wait(m=>m.t==='state'&&m.state.players.find(p=>p.id===identity.id)?.z>restored.z+.3);
  console.log('PASS Cloudflare workerd: six real WebSockets, balanced 3v3, distinct Apex/pivot/barrier abilities, authoritative input, same-identity low-sequence reconnect, solo asset and config endpoints.');
 }finally{for(const client of clients)client.ws.terminate()}
})().catch(error=>{console.error(error);process.exitCode=1});
