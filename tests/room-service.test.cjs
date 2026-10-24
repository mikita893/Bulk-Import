'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createRoomService}=require('../server/rooms.cjs');
class Socket extends EventEmitter {
 constructor(){super();this.readyState=1;this.bufferedAmount=0;this.messages=[]}
 send(text){this.messages.push(JSON.parse(text))}
 close(){if(this.readyState===3)return;this.readyState=3;this.emit('close')}
 terminate(){this.close()}
 message(value){this.emit('message',JSON.stringify(value),false)}
}
test('unjoined sockets release provisional session on close',()=>{
 const service=createRoomService(),socket=new Socket();service.connect(socket);assert.equal(service.sessions.size,1);socket.close();assert.equal(service.sessions.size,0);assert.equal(service.connections.size,0);
});
test('expiring an offline room also releases its resumable session records',()=>{
 const service=createRoomService(),socket=new Socket();service.connect(socket);socket.message({t:'create',mode:'coop',name:'Offline host'});const room=[...service.rooms.values()][0];assert(room);socket.close();assert.equal(service.sessions.size,1);room.offlineSince=Date.now()-31*60*1000;service.tick(1/30);assert.equal(service.rooms.size,0);assert.equal(service.sessions.size,0);
});
test('old disconnected lobby members are pruned without removing connected friends',()=>{
 const service=createRoomService(),host=new Socket(),friend=new Socket();service.connect(host);host.message({t:'create',mode:'coop',name:'Old host'});const room=[...service.rooms.values()][0];service.connect(friend);friend.message({t:'join',code:room.code,name:'New host'});const oldSession=host._session;host.close();oldSession.lastSeen=Date.now()-91000;service.tick(1/30);assert.equal(room.players.length,1);assert.equal(room.players[0].name,'New host');assert.equal(room.hostId,friend._session.id);assert.equal(service.sessions.has(oldSession.token),false);assert.equal(oldSession.room,null);
});
test('disconnected active match members stay resumable beyond the lobby grace',()=>{
 const service=createRoomService(),host=new Socket(),friend=new Socket();service.connect(host);host.message({t:'create',mode:'coop',name:'Keep host'});const room=[...service.rooms.values()][0];service.connect(friend);friend.message({t:'join',code:room.code,name:'Active friend'});host.message({t:'ready',ready:true});friend.message({t:'ready',ready:true});host.message({t:'start'});host.close();host._session.lastSeen=Date.now()-91000;service.tick(1/30);assert.equal(room.players.length,2);assert.equal(service.sessions.has(host._session.token),true);assert.equal(host._session.room,room.code);
});
