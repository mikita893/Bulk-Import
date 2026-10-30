'use strict';
// alwaysdata supplies the exact listening address; the game remains the same server.
const fs=require('node:fs');
const path=require('node:path');
const {createGameServer}=require('../../server/index.cjs');
function createAlwaysdataServer(options={}){
  const metadata=path.resolve(__dirname,'../../DEPLOYMENT.json');
  const deployment=fs.existsSync(metadata)?JSON.parse(fs.readFileSync(metadata,'utf8')).sha:null;
  if(deployment!==null&&!/^[a-f0-9]{40}$/.test(deployment))throw Error('Invalid deployment metadata');
  const game=createGameServer({host:process.env.IP||process.env.HOST||'0.0.0.0',...options});
  if(deployment)game.server.prependListener('request',(_req,res)=>res.setHeader('X-Bulk-Import-Deployment',deployment));
  return game;
}
if(require.main===module){
  const game=createAlwaysdataServer();let stopping=false;
  game.listen().then(({port})=>console.log('Bulk Import on alwaysdata, port '+port)).catch(error=>{console.error(error.message);process.exitCode=1;});
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{if(stopping)return;stopping=true;game.close().then(()=>process.exit(0));});
}
module.exports={createAlwaysdataServer};
