import roomModule from '../server/rooms.cjs';
import shared from '../multiplayer/shared.cjs';
import release from '../release.cjs';
const { createRoomService, publicConfig, MAX_SESSIONS } = roomModule;

// One named object owns the rooms. A room can never split across Worker isolates or regions.
export class GameRooms {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.service = createRoomService({ tickRate:30 });
    this.timer = null;
    this.lastTick = 0;
    this.accumulator = 0;
    this.snapshotClock = 0;
    this.heartbeatClock = 0;
  }
  startLoop() {
    if (this.timer) return;
    this.lastTick = performance.now();
    this.timer = setInterval(() => {
      const now = performance.now();
      this.accumulator = Math.min(.25, this.accumulator + Math.max(0, (now - this.lastTick) / 1000));
      this.lastTick = now;
      while (this.accumulator >= 1/30) {
        this.service.tick(1/30);
        this.accumulator -= 1/30;
        this.snapshotClock += 1/30;
        this.heartbeatClock += 1/30;
      }
      if (this.snapshotClock >= 1/15) { this.snapshotClock=0;this.service.broadcastStates(); }
      if (this.heartbeatClock >= 20) { this.heartbeatClock=0;this.service.heartbeat(); }
      if (!this.service.connections.size) { clearInterval(this.timer);this.timer=null;this.accumulator=0; }
    }, 1000/30);
  }
  async fetch(request) {
    const url = new URL(request.url);
    const headers = {'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
    if (url.pathname === '/healthz') return Response.json({ok:true,version:shared.VERSION,rooms:this.service.rooms.size},{headers});
    if (url.pathname === '/api/info' || url.pathname === '/api/config') return Response.json(publicConfig(),{headers});
    if (url.pathname !== '/ws') return new Response('Not found',{status:404,headers});
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket upgrade required',{status:426,headers});
    if (this.service.connections.size >= MAX_SESSIONS) return new Response('Server full',{status:503,headers});
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    this.service.connect(new WorkerSocket(server));
    this.startLoop();
    return new Response(null,{status:101,webSocket:client});
  }
}

// Adapt the native Workers WebSocket to the same small interface used by the Node ws transport.
export class WorkerSocket {
  constructor(socket) { this.socket=socket;this._session=null; }
  get readyState() { return this.socket.readyState; }
  get bufferedAmount() { return this.socket.bufferedAmount || 0; }
  send(data) { try { this.socket.send(data); } catch { this.terminate(); } }
  close(code=1000,reason='') { try { this.socket.close(code,reason); } catch {} }
  terminate() { this.close(1011,'Connection closed'); }
  on(type, listener) {
    if(type==='message')this.socket.addEventListener('message',event=>listener(event.data,typeof event.data!=='string'));
    else if(type==='close')this.socket.addEventListener('close',listener);
    else if(type==='error')this.socket.addEventListener('error',event=>{event.preventDefault?.();listener(event)});
    return this;
  }
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(url.pathname==='/ws'||url.pathname==='/healthz'||url.pathname==='/api/info'||url.pathname==='/api/config'){
      const id=env.GAME_ROOMS.idFromName('bulk-import-v11');
      return env.GAME_ROOMS.get(id).fetch(request);
    }
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    if(url.pathname==='/multiplayer'||url.pathname==='/play')url.pathname='/'+release.filename;
    return env.ASSETS.fetch(new Request(url,request));
  }
};
