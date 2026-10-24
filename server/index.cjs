'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {WebSocketServer}=require('ws');
const {createRoomService,validateCheckpoint,freshProgress,publicConfig,MAX_SESSIONS}=require('./rooms.cjs');
const ROOT=path.resolve(__dirname,'..');
function createGameServer(options={}){
  const tickRate=options.tickRate||30,snapshotRate=options.snapshotRate||15;
  const service=createRoomService({tickRate});
  const {rooms,sessions,tick,broadcastRoom}=service;
  const port=options.port??Number(process.env.PORT||3000),host=options.host||'0.0.0.0';
  let timer=null,heartbeat=null,lastTick=0,accumulator=0,snapshotClock=0;
  const server=http.createServer((req,res)=>{
    const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});res.end();return;}
    let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400,headers);res.end('Invalid URL');return;}
    if(pathname==='/healthz'){res.writeHead(200,{...headers,'Content-Type':'application/json','Cache-Control':'no-store'});res.end(req.method==='HEAD'?'':JSON.stringify({ok:true,version:11,rooms:rooms.size}));return;}
    if(pathname==='/api/info'||pathname==='/api/config'){res.writeHead(200,{...headers,'Content-Type':'application/json','Cache-Control':'public, max-age=60'});res.end(req.method==='HEAD'?'':JSON.stringify(publicConfig()));return;}
    let file;
    if(pathname==='/'||pathname==='/index.html')file='index.html';
    else if(/^\/Bulk-Import(?:-[A-Za-z0-9-]+)?\.html$/.test(pathname))file=pathname.slice(1);
    else if(pathname==='/multiplayer'||pathname==='/play')file='Bulk-Import-Multiplayer-v11.html';
    else if(pathname==='/favicon.ico'){res.writeHead(204,headers);res.end();return;}
    else{res.writeHead(404,headers);res.end('Not found');return;}
    fs.readFile(path.join(ROOT,file),(err,body)=>{if(err){res.writeHead(404,headers);res.end('Not found');return;}res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?'':body)});
  });
  const wss=new WebSocketServer({noServer:true,maxPayload:8192,perMessageDeflate:false});
  server.on('upgrade',(req,socket,head)=>{
    let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{socket.destroy();return;}
    if(pathname!=='/ws'||service.connections.size>=MAX_SESSIONS){socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');socket.destroy();return;}
    wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
  });
  wss.on('connection',ws=>service.connect(ws));
  async function listen(){
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);resolve()})});
    lastTick=performance.now();
    timer=setInterval(()=>{const now=performance.now();accumulator=Math.min(.25,accumulator+Math.max(0,(now-lastTick)/1000));lastTick=now;while(accumulator>=1/tickRate){tick(1/tickRate);accumulator-=1/tickRate;snapshotClock+=1/tickRate}if(snapshotClock>=1/snapshotRate){snapshotClock=0;service.broadcastStates()}},1000/tickRate);timer.unref();
    heartbeat=setInterval(()=>service.heartbeat(),20000);heartbeat.unref();
    const actualPort=server.address().port;return {port:actualPort,url:`http://127.0.0.1:${actualPort}`};
  }
  async function close(){clearInterval(timer);clearInterval(heartbeat);service.disconnectAll();for(const ws of wss.clients)ws.terminate();await new Promise(resolve=>wss.close(resolve));if(server.listening)await new Promise(resolve=>server.close(resolve));}
  return {server,wss,rooms,sessions,listen,close,tick,broadcastRoom};
}
if(require.main===module){const game=createGameServer();game.listen().then(({port})=>console.log(`Bulk Import multiplayer listening on ${port}`)).catch(err=>{console.error(err.message);process.exitCode=1});for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>game.close().then(()=>process.exit(0)));}
module.exports={createGameServer,validateCheckpoint,freshProgress};
