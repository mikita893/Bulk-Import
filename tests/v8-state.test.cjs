'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','Bulk-Import-Omega-3D-v8.html'),'utf8');
const app=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
function declaration(name){
 const start=app.indexOf('function '+name+'(');assert(start>=0,name+' exists in shipped HTML');
 let p=app.indexOf('(',start),depth=0,quote=null,escape=false,body=-1;
 for(let i=p;i<app.length;i++){const c=app[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='(')depth++;if(c===')'&&--depth===0){body=app.indexOf('{',i);break}}
 assert(body>=0,'Function body '+name);depth=0;
 for(let i=body;i<app.length;i++){const c=app[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return app.slice(start,i+1)}
 throw Error('Unclosed declaration '+name);
}
const cx={VERSION:8,MISSIONS:Array.from({length:7},(_,i)=>({waves:[3,3,4,3,4,4,4][i]})),FINAL_MISSION:6,MAX_ACTIVE_ENEMIES:18,TYPES:Object.fromEntries(['reaper','elite','collector','boss','husk','geth','banshee','traitorVael','traitorSyra'].map(t=>[t,{}])),UPGRADE_KEYS:['damage','rate','armor','shield','plating','biotic','mobility'],UPGRADE_LIMIT:5,BETRAYAL_TYPES:['traitorVael','traitorSyra'],BETRAYAL_STATES:['none','pending','active','defeated']};vm.createContext(cx);
for(const name of ['relationshipClamp','createBetrayalDefaults','normalizeCrewBetrayal','validBetrayalState','validBetrayalSnapshot','createCrewDefaults','normalizeCrew','validCrewState','upgradeLevel','normalizeUpgradeLevels','maxHealth','maxShield','validProgress','nums','validActive','validSaveSnapshot','fresh'])vm.runInContext(declaration(name),cx);
const p=cx.fresh();cx.progress=p;assert(cx.validProgress(p));assert.equal(p.version,8);assert.deepEqual(Object.keys(p.upgrades),cx.UPGRADE_KEYS);assert.equal(p.crew[0].affection,35);assert(cx.validBetrayalSnapshot(p,null,0));
const clone=d=>JSON.parse(JSON.stringify(d));
for(const key of cx.UPGRADE_KEYS)for(const value of [-1,6,2.5,'3',NaN]){const b=clone(p);b.upgrades[key]=value;assert(!cx.validProgress(b),`${key} rejects ${value}`)}
for(const key of ['affection','trust'])for(const value of [-1,101,'80',NaN]){const b=clone(p);b.crew[0][key]=value;assert(!cx.validProgress(b),`${key} rejects ${value}`)}
for(const c of [{departed:false,betrayal:'pending',betrayalDue:false},{departed:true,betrayal:'none',betrayalDue:false},{departed:true,betrayal:'unknown',betrayalDue:false},{departed:true,betrayal:'defeated',betrayalDue:true}])assert(!cx.validBetrayalState({...p.crew[0],affection:0,trust:0,...c}));
const active={run:{mission:6,wave:4,spawned:18,clock:1,bossSpawned:true},player:{x:0,z:15,hp:77,shield:0,rechargeWait:0},enemies:[{type:'banshee',x:4,z:0,hp:20,maxHp:27,t:1,phase:1}],bullets:[],hostile:[],drops:[],medkits:[{x:0,z:17,ready:true,timer:0},{x:0,z:-17,ready:true,timer:0}],massCooldown:0,relayCooldown:0,indo:10};assert(cx.validActive(active,p.upgrades));
for(const key of ['hp','shield','rechargeWait'])for(const value of [-1,Infinity,NaN,'1',null]){const a=clone(active);a.player[key]=value;assert(!cx.validActive(a,p.upgrades),`${key} rejects ${value}`)}
for(const [key,value] of [['hp',101],['shield',1],['rechargeWait',4.1]]){const a=clone(active);a.player[key]=value;assert(!cx.validActive(a,p.upgrades),`${key} capacity`)}
const upgrades={...p.upgrades,armor:5,shield:5};const upgraded=clone(active);upgraded.player.hp=225;upgraded.player.shield=125;upgraded.player.rechargeWait=4;assert(cx.validActive(upgraded,upgrades));for(const [key,value] of [['hp',225.1],['shield',125.1]]){const a=clone(upgraded);a.player[key]=value;assert(!cx.validActive(a,upgrades),`${key} upgraded capacity`)}
for(const mission of [-1,7,3.5])assert(!cx.validActive({...active,run:{...active.run,mission}},p.upgrades));
for(const type of ['constructor','toString','__proto__','unknown'])assert(!cx.validActive({...active,enemies:[{...active.enemies[0],type}]},p.upgrades));
assert(!cx.validActive({...active,enemies:Array.from({length:19},()=>active.enemies[0])},p.upgrades));
const departed=clone(p);Object.assign(departed.crew[0],{affection:0,trust:0,bond:0,friendship:false,departed:true,betrayal:'active',betrayalDue:false});const betrayal=clone(active);betrayal.enemies=[{...active.enemies[0],type:'traitorVael'}];assert(cx.validBetrayalSnapshot(departed,betrayal,0));assert(!cx.validBetrayalSnapshot(departed,null,0));assert(!cx.validBetrayalSnapshot(departed,betrayal,2));betrayal.enemies.push({...betrayal.enemies[0]});assert(!cx.validBetrayalSnapshot(departed,betrayal,0));departed.crew[0].betrayal='defeated';betrayal.enemies.pop();assert(!cx.validBetrayalSnapshot(departed,betrayal,0));
const saved={version:8,progress:{...clone(p),upgrades},active:upgraded,pendingWave:0};assert(cx.validSaveSnapshot(saved),'Import validates against incoming upgrades instead of current campaign');
for(const pendingWave of [-1,1,5,1.5,'2'])assert(!cx.validSaveSnapshot({...saved,pendingWave}),'Reject inconsistent intermission marker');
assert(!cx.validSaveSnapshot({...saved,version:7}));assert(!cx.validSaveSnapshot({...saved,active:null,pendingWave:2}));
const intermission=clone(saved);intermission.active.run.wave=1;intermission.pendingWave=2;assert(cx.validSaveSnapshot(intermission));
console.log('PASS shipped v8 save validators: seven bounded upgrade keys, player capacities, relationship/departure states, duplicate/missing/offboard traitor rejection, enemy/map bounds.');
