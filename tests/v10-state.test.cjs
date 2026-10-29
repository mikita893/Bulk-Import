'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=require('./read-campaign.cjs')();
const app=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
function declaration(name){
 const start=app.indexOf('function '+name+'(');assert(start>=0,name+' exists in shipped HTML');
 let p=app.indexOf('(',start),depth=0,quote=null,escape=false,body=-1;
 for(let i=p;i<app.length;i++){const c=app[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='(')depth++;if(c===')'&&--depth===0){body=app.indexOf('{',i);break}}
 assert(body>=0,'Function body '+name);depth=0;
 for(let i=body;i<app.length;i++){const c=app[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue}if(c==='"'||c==="'"||c==='`'){quote=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return app.slice(start,i+1)}
 throw Error('Unclosed declaration '+name);
}
const cx={CardSystem:require('../minigames/cards-sim.js'),VERSION:10,MISSIONS:Array.from({length:8},(_,i)=>({waves:[3,3,4,3,4,4,4,1][i]})),FINAL_MISSION:6,EXCEL_MISSION:7,MAX_ACTIVE_ENEMIES:18,TYPES:Object.fromEntries(['reaper','elite','collector','boss','husk','geth','banshee','traitorVael','traitorSyra','excel'].map(t=>[t,{}])),UPGRADE_KEYS:['damage','rate','armor','shield','plating','biotic','mobility'],UPGRADE_LIMIT:5,BETRAYAL_TYPES:['traitorVael','traitorSyra'],BETRAYAL_STATES:['none','pending','active','defeated']};vm.createContext(cx);
for(const name of ['relationshipClamp','createBetrayalDefaults','normalizeCrewBetrayal','validBetrayalState','validBetrayalSnapshot','createCrewDefaults','normalizeCrew','validCrewState','upgradeLevel','normalizeUpgradeLevels','maxHealth','maxShield','validProgress','nums','validActive','validSaveSnapshot','fresh','createExcelState','validExcelState','excelPhase','validExcelSnapshot','validateOlderChapter','upgradeToV10','excelMaxHealth','validZipsertState'])vm.runInContext(declaration(name),cx);
const p=cx.fresh();cx.progress=p;assert(cx.validProgress(p));assert.equal(p.version,10);assert.equal(p.excelFirstFormCleared,false);assert.deepEqual(Object.keys(p.upgrades),cx.UPGRADE_KEYS);assert.equal(p.crew[0].affection,35);assert(cx.validBetrayalSnapshot(p,null,0));
const clone=d=>JSON.parse(JSON.stringify(d));
for(const key of cx.UPGRADE_KEYS)for(const value of [-1,6,2.5,'3',NaN]){const b=clone(p);b.upgrades[key]=value;assert(!cx.validProgress(b),`${key} rejects ${value}`)}
for(const key of ['affection','trust'])for(const value of [-1,101,'80',NaN]){const b=clone(p);b.crew[0][key]=value;assert(!cx.validProgress(b),`${key} rejects ${value}`)}
for(const c of [{departed:false,betrayal:'pending',betrayalDue:false},{departed:true,betrayal:'none',betrayalDue:false},{departed:true,betrayal:'unknown',betrayalDue:false},{departed:true,betrayal:'defeated',betrayalDue:true}])assert(!cx.validBetrayalState({...p.crew[0],affection:0,trust:0,...c}));
const active={run:{mission:6,wave:4,spawned:18,clock:1,bossSpawned:true},player:{x:0,z:15,hp:77,shield:0,rechargeWait:0},enemies:[{type:'banshee',x:4,z:0,hp:20,maxHp:27,t:1,phase:1}],bullets:[],hostile:[],drops:[],medkits:[{x:0,z:17,ready:true,timer:0},{x:0,z:-17,ready:true,timer:0}],massCooldown:0,relayCooldown:0,indo:10,flowDashCharges:2,flowDashRecharge:0};assert(cx.validActive(active,p.upgrades));
for(const key of ['hp','shield','rechargeWait'])for(const value of [-1,Infinity,NaN,'1',null]){const a=clone(active);a.player[key]=value;assert(!cx.validActive(a,p.upgrades),`${key} rejects ${value}`)}
for(const [key,value] of [['hp',101],['shield',1],['rechargeWait',4.1]]){const a=clone(active);a.player[key]=value;assert(!cx.validActive(a,p.upgrades),`${key} capacity`)}
const upgrades={...p.upgrades,armor:5,shield:5};const upgraded=clone(active);upgraded.player.hp=225;upgraded.player.shield=125;upgraded.player.rechargeWait=4;assert(cx.validActive(upgraded,upgrades));for(const [key,value] of [['hp',225.1],['shield',125.1]]){const a=clone(upgraded);a.player[key]=value;assert(!cx.validActive(a,upgrades),`${key} upgraded capacity`)}
for(const mission of [-1,8,3.5])assert(!cx.validActive({...active,run:{...active.run,mission}},p.upgrades));
for(const type of ['constructor','toString','__proto__','unknown'])assert(!cx.validActive({...active,enemies:[{...active.enemies[0],type}]},p.upgrades));
assert(!cx.validActive({...active,enemies:Array.from({length:19},()=>active.enemies[0])},p.upgrades));
const departed=clone(p);Object.assign(departed.crew[0],{affection:0,trust:0,bond:0,friendship:false,departed:true,betrayal:'active',betrayalDue:false});const betrayal=clone(active);betrayal.enemies=[{...active.enemies[0],type:'traitorVael'}];assert(cx.validBetrayalSnapshot(departed,betrayal,0));assert(!cx.validBetrayalSnapshot(departed,null,0));assert(!cx.validBetrayalSnapshot(departed,betrayal,2));betrayal.enemies.push({...betrayal.enemies[0]});assert(!cx.validBetrayalSnapshot(departed,betrayal,0));departed.crew[0].betrayal='defeated';betrayal.enemies.pop();assert(!cx.validBetrayalSnapshot(departed,betrayal,0));
const saved={version:10,progress:{...clone(p),upgrades},active:upgraded,pendingWave:0};assert(cx.validSaveSnapshot(saved),'Import validates against incoming upgrades instead of current campaign');
for(const pendingWave of [-1,1,5,1.5,'2'])assert(!cx.validSaveSnapshot({...saved,pendingWave}),'Reject inconsistent intermission marker');
assert(!cx.validSaveSnapshot({...saved,version:8}));assert(!cx.validSaveSnapshot({...saved,active:null,pendingWave:2}));
const intermission=clone(saved);intermission.active.run.wave=1;intermission.pendingWave=2;assert(cx.validSaveSnapshot(intermission));

const excel=cx.createExcelState();assert(cx.validExcelState(excel));
for(const [key,values] of Object.entries({support:['unknown',null],supportTimer:[-1,12.1,NaN,'3'],exposure:[-1,9.1,Infinity,'2'],supportX:[-22.1,22.1],supportZ:[-18.1,18.1],supportIndex:[-1,1.5,1e9],helpUsed:[-1,1.5,1e9],elapsed:[-1,1e8+1],phase:[0,4,1.5],stage:[0,3,1.5],rageHelpUsed:[-1,1.5,1e9],attackTimer:[-1,8.1],attackIndex:[-1,1.5,1e9],grace:[-1,3.1],blockedNotice:[-1,4.1],defeated:['false',null]}))for(const value of values)assert(!cx.validExcelState({...excel,[key]:value}),`Excel state rejects ${key}=${value}`);
assert(!cx.validExcelState({...excel,support:'exposed',supportTimer:0,exposure:9,helpUsed:0}),'Support must be used before damage window');
assert(!cx.validExcelState({...excel,support:'exposed',supportTimer:0,exposure:0,helpUsed:1}),'Expired window is not exposed');
assert(!cx.validExcelState({...excel,support:'available',exposure:1}),'Waiting/available states cannot contain exposure');
assert(!cx.validExcelState({...excel,defeated:true,helpUsed:0}),'Excel cannot be defeated without Marc');
assert(cx.validExcelState({...excel,support:'exposed',supportTimer:0,exposure:7,helpUsed:3,phase:3}));
assert(!cx.validExcelState({...excel,stage:1,rageHelpUsed:1}));
assert(!cx.validExcelState({...excel,stage:2,support:'exposed',supportTimer:0,exposure:5,helpUsed:2,rageHelpUsed:0}));
assert(cx.validExcelState({...excel,stage:2,support:'exposed',supportTimer:0,exposure:5,helpUsed:2,rageHelpUsed:1}));
const finalSave=clone(saved);finalSave.active.run={mission:7,wave:1,spawned:0,clock:0,bossSpawned:true,excel};finalSave.active.enemies=[{type:'excel',x:0,z:-8,hp:2300,maxHp:2400,t:999,phase:0}];
assert(cx.validSaveSnapshot(finalSave),'Valid single-boss checkpoint');
for(const corrupt of [d=>delete d.active.run.excel,d=>d.active.enemies.push({...d.active.enemies[0]}),d=>d.active.enemies.splice(0),d=>d.pendingWave=2,d=>d.active.run.wave=2]){const copy=clone(finalSave);corrupt(copy);assert(!cx.validSaveSnapshot(copy),'Malformed Excel fight checkpoint rejected')}
const nativeWinner=clone(p);nativeWinner.completed=[0,1,2,3,4,5,6];nativeWinner.won=true;assert(!cx.validProgress(nativeWinner),'Harbinger winner has not completed v9');nativeWinner.completed.push(7);nativeWinner.excelFirstFormCleared=true;assert(cx.validProgress(nativeWinner));


const defeatedCheckpoint=clone(finalSave);defeatedCheckpoint.progress.excelFirstFormCleared=true;Object.assign(defeatedCheckpoint.active.run.excel,{stage:2,defeated:true,helpUsed:1,rageHelpUsed:1});defeatedCheckpoint.active.enemies=[];assert(cx.validSaveSnapshot(defeatedCheckpoint),'Checkpoint between supported kill and completion remains valid');
const rageCheckpoint=clone(finalSave);rageCheckpoint.progress.excelFirstFormCleared=true;Object.assign(rageCheckpoint.active.run.excel,{stage:2});Object.assign(rageCheckpoint.active.enemies[0],{hp:3100,maxHp:3200});assert(cx.validSaveSnapshot(rageCheckpoint),'Valid second-form checkpoint');
for(const corrupt of [d=>d.progress.excelFirstFormCleared=false,d=>d.active.enemies[0].maxHp=2400,d=>d.active.run.excel.stage=1,d=>d.active.run.excel.defeated=true]){const d=clone(rageCheckpoint);corrupt(d);assert(!cx.validSaveSnapshot(d),'Furious form cannot contradict progress, maxHP or mandatory help')}
assert(cx.validZipsertState(2,0));assert(cx.validZipsertState(1,3));assert(cx.validZipsertState(0,6.5));
for(const args of [[3,0],[-1,0],[1.5,2],[2,1],[1,0],[0,-1],[1,6.6],['1',2],[1,NaN]])assert(!cx.validZipsertState(...args),'Reject corrupt ZIPsert charges/recharge');
for(const [key,values]of Object.entries({flowDashCharges:[-1,3,'1',1.5],flowDashRecharge:[-1,6.6,'3',NaN]}))for(const value of values){const d=clone(saved);d.active[key]=value;assert(!cx.validSaveSnapshot(d),'Reject corrupt saved ZIPsert '+key)}
for(const value of [null,'false',0,undefined]){const d=clone(p);d.excelFirstFormCleared=value;assert(!cx.validProgress(d),'First-form checkpoint flag must be boolean')}
const duplicated=clone(rageCheckpoint);duplicated.active.hostile=[{type:'excel',x:0,z:0,vx:1,vz:0,damage:42,duplicate:true,copyId:1}];assert(cx.validSaveSnapshot(duplicated),'Duplicated projectile identity persists');
for(const change of [b=>b.duplicate='true',b=>b.copyId=3,b=>b.copyId=1.5,b=>b.duplicate=false]){const d=clone(duplicated);change(d.active.hostile[0]);assert(!cx.validSaveSnapshot(d),'Reject corrupt duplicate projectile metadata')}
const flash=clone(rageCheckpoint);flash.active.enemies[0].shieldFlash=.35;assert(cx.validSaveSnapshot(flash));flash.active.enemies[0].shieldFlash=1;assert(!cx.validSaveSnapshot(flash),'Reject invalid shield hit flash');
assert.equal(cx.excelMaxHealth(1),2400);assert.equal(cx.excelMaxHealth(2),3200);
console.log('PASS shipped v10 validators: upgrades/defenses/relations, ZIPsert charges/cooldown, first and furious Excel forms, stage-specific HP, mandatory fresh Marc help and final victory.');

// v16 collection is optional in old format-10 saves; explicit corrupt data still rejects.
const beforeCards=clone(p);delete beforeCards.cards;assert(cx.validProgress(beforeCards));
const corruptCards=clone(p);corruptCards.cards.deck.push('sf-hero');assert(!cx.validProgress(corruptCards));
Object.assign(cx,{active:true,cardShopOpen:true,mode:'panel',terminalPanelOpen:true,cardDuelToken:null,cardDuelSequence:0,nearShipTerminal:()=>true,save:()=>{},hud:()=>{},notify:()=>{}});
for(const name of ['buyCampaignCard','canPlayCards','availableCardOpponents','crewAvailable','saveCardDeck','beginCardDuel','finishCardDuel'])vm.runInContext(declaration(name),cx);
cx.progress=clone(p);cx.progress.credits=1000;assert(cx.buyCampaignCard('sf-bulk3'));assert.equal(cx.progress.credits,840);assert(!cx.buyCampaignCard('sf-bulk3'));assert(!cx.buyCampaignCard('prize-vael'));assert(!cx.buyCampaignCard('toString'));
assert(cx.saveCardDeck([...cx.progress.cards.deck,'sf-bulk3']));const token=cx.beginCardDuel('vael');assert.equal(cx.beginCardDuel('syra'),null);assert(!cx.saveCardDeck(cx.progress.cards.deck));assert.equal(cx.finishCardDuel(token+1,'player'),null);assert(cx.finishCardDuel(token,'player').reward);assert.equal(cx.finishCardDuel(token,'player'),null);
const repeat=cx.beginCardDuel('vael');assert.equal(cx.finishCardDuel(repeat,'player').reward,null);assert.equal(cx.progress.cards.wins.vael,2);assert.equal(cx.progress.credits,840);assert(cx.validProgress(cx.progress));
cx.progress.crew[0].departed=true;assert(!cx.availableCardOpponents().includes('vael'));assert.equal(cx.beginCardDuel('vael'),null);
console.log('PASS optional old-save card migration, deck validation, armory cost/ownership, departed rivals and one-time duel rewards.');
