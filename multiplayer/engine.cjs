'use strict';
const {WORLD,LIMITS,VS_STATS,FACTION_KITS,versusStats,UPGRADES,MAPS,MISSIONS,ENEMY_TYPES,normalizedUpgrades,coopStats}=require('./shared.cjs');
const TAU=Math.PI*2;
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function normalizeInput(raw){
 if(!raw||typeof raw!=='object'||!Number.isSafeInteger(raw.seq)||raw.seq<0||raw.seq>Number.MAX_SAFE_INTEGER-1)return null;
 for(const key of ['mx','mz','ax','az'])if(!Number.isFinite(raw[key]))return null;
 for(const key of ['fire','dash','ability','secondary','interact','sprint'])if(raw[key]!==undefined&&typeof raw[key]!=='boolean')return null;
 let mx=clamp(raw.mx,-1,1),mz=clamp(raw.mz,-1,1),length=Math.hypot(mx,mz);if(length>1){mx/=length;mz/=length}
 return {seq:raw.seq,mx,mz,ax:clamp(raw.ax,-100,100),az:clamp(raw.az,-100,100),fire:raw.fire===true,dash:raw.dash===true,ability:raw.ability===true,secondary:raw.secondary===true,interact:raw.interact===true,sprint:raw.sprint===true};
}
function random(m){m.seed=(Math.imul(m.seed,1664525)+1013904223)>>>0;return m.seed/4294967296}
function event(m,text,type='info'){m.events.push({id:++m.eventId,text,type,time:m.time});if(m.events.length>LIMITS.events)m.events.shift()}
function blocked(m,x,z,r=.6){return m.obstacles.some(o=>x+r>o.x-o.w/2&&x-r<o.x+o.w/2&&z+r>o.z-o.d/2&&z-r<o.z+o.d/2)}
function move(m,a,dx,dz,r=.6){const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.35));for(let i=0;i<count;i++){const x=clamp(a.x+dx/count,WORLD.minX+r,WORLD.maxX-r),z=clamp(a.z+dz/count,WORLD.minZ+r,WORLD.maxZ-r);if(!blocked(m,x,a.z,r))a.x=x;if(!blocked(m,a.x,z,r))a.z=z}}
function spawnPoint(m,p){const index=m.players.filter(q=>q.team===p.team).indexOf(p);if(m.mode==='versus')return {x:p.team==='excel'?19:-19,z:[-10,0,10][Math.max(0,index)]};return {x:(m.players.indexOf(p)-(m.players.length-1)/2)*3,z:16}}
function refillPlayer(m,p,initial=false){const st=p.stats= m.mode==='versus'?versusStats(p.team):coopStats(m.upgrades),at=spawnPoint(m,p);p.x=at.x;p.z=at.z;p.hp=st.maxHp;p.shield=st.maxShield;p.alive=true;p.downed=false;p.bleedOut=0;p.respawnIn=0;p.reviveProgress=0;p.inv=initial?1.4:1.6;p.spawnProtected=true;p.shieldWait=0;p.dashCooldown=0;p.abilityCooldown=0;p.dashTime=0;p.shotCooldown=0;p.hitInv=0;p.secondaryCooldown=0;clearPlayerKitState(p);p.aimX=p.x+(p.team==='excel'?-1:1);p.aimZ=p.z}
function createMatch({mode='coop',players=[],mission=0,upgrades={},credits=0,seed=Date.now()}={}){
 mode=mode==='versus'?'versus':'coop';mission=Number.isInteger(mission)?clamp(mission,0,MISSIONS.length-1):0;
 if(!Array.isArray(players)||players.length<1||players.length>6||new Set(players.map(p=>p.id)).size!==players.length)throw Error('Niepoprawny skład drużyny');
 if(mode==='coop'&&players.length>LIMITS.coopPlayers)throw Error('Kooperacja obsługuje do trzech graczy');
 const map=mode==='versus'?'arena':MISSIONS[mission].map;
 const m={mode,phase:'playing',mission,map,wave:1,waves:mode==='versus'?1:MISSIONS[mission].waves,players:[],enemies:[],projectiles:[],warnings:[],effects:[],pickups:[{id:'med-a',x:0,z:-16,type:'medkit',ready:true,timer:0},{id:'med-b',x:0,z:16,type:'medkit',ready:true,timer:0}],obstacles:MAPS[map].map(o=>({...o})),scores:{salesforce:0,excel:0},remaining:mode==='versus'?360:0,time:0,seed:(Number(seed)||1)>>>0,nextId:0,eventId:0,events:[],upgrades:mode==='versus'?normalizedUpgrades():normalizedUpgrades(upgrades),teamCredits:Number.isSafeInteger(credits)&&credits>=0?Math.min(credits,1e8):0,teamLives:3,result:null,spawned:0,spawnClock:1.4,bossSpawned:false,support:null,partySize:players.length};
 for(const source of players){const p={id:String(source.id),name:String(source.name||'Administrator').slice(0,24),team:mode==='coop'?'salesforce':source.team==='excel'?'excel':'salesforce',connected:true,kills:0,deaths:0,revives:0,lastSeq:-1,input:null,inv:0};m.players.push(p)}
 if(mode==='versus'){const sf=m.players.filter(p=>p.team==='salesforce').length,ex=m.players.length-sf;if(sf<1||ex<1||sf>3||ex>3||sf!==ex)throw Error('VS wymaga równych drużyn: od 1 na 1 do 3 na 3')}
 for(const p of m.players)refillPlayer(m,p,true);
 if(mode==='coop'&&MISSIONS[mission].boss==='excel'){m.spawnClock=0;m.bossSpawned=true;spawnEnemy(m,'excel',0,-8);m.support={active:false,x:-16,z:12,remaining:3,exposure:0,index:0,used:0}}
 event(m,mode==='versus'?'SALESFORCE vs EXCEL / równa broń, odmienne moce. Tabele przestawne kontra kwerendy Apex!':MISSIONS[mission].description,'start');return m;
}
function finishMatch(m,result){if(m.phase==='finished')return false;m.phase='finished';m.result={...result};if(m.mode==='versus')event(m,result.winner==='draw'?'REMIS / oba arkusze zgłosiły konflikt.':(result.winner==='salesforce'?'SALESFORCE':'EXCEL')+' WYGRYWA / przegrani robią eksport CSV.','result');else event(m,result.outcome==='victory'?'MISJA UKOŃCZONA / pełny zespół, poprawny import.':'EWAKUACJA / wyczerpano wspólne pakiety odzyskiwania.','result');return true}
function setPlayerConnected(m,id,connected){const p=m.players.find(p=>p.id===id);if(!p)return false;p.connected=!!connected;if(connected){p.lastSeq=-1;p.input=null}if(!connected){p.input=null;p.dashTime=0;clearPlayerKitState(p);m.effects=m.effects.filter(e=>e.kind!=='rewind'||e.ownerId!==p.id)}return true}
function setMatchUpgrades(m,upgrades){if(m.mode!=='coop'||m.phase==='playing')return false;const old=m.players.map(p=>p.stats);m.upgrades=normalizedUpgrades(upgrades);m.players.forEach((p,i)=>{p.stats=coopStats(m.upgrades);p.hp=Math.min(p.stats.maxHp,p.hp+p.stats.maxHp-old[i].maxHp);p.shield=Math.min(p.stats.maxShield,p.shield+p.stats.maxShield-old[i].maxShield)});return true}
function buyTeamUpgrade(m,key){if(m.mode!=='coop'||m.phase==='playing'||!Object.hasOwn(UPGRADES,key))return false;const level=m.upgrades[key],cost=UPGRADES[key].baseCost*(level+1);if(level>=5||m.teamCredits<cost)return false;const next={...m.upgrades,[key]:level+1};m.teamCredits-=cost;setMatchUpgrades(m,next);event(m,'Wspólne ulepszenie: '+UPGRADES[key].label+' '+(level+1)+'/5. Deployment bez konfliktu.','upgrade');return true}
function continueMatch(m){if(m.mode!=='coop'||m.phase!=='intermission'||m.wave>=m.waves)return false;m.wave++;m.phase='playing';m.spawned=0;m.spawnClock=1.5;m.bossSpawned=false;m.projectiles=[];m.warnings=[];m.effects=[];for(const p of m.players)refillPlayer(m,p);for(const item of m.pickups){item.ready=true;item.timer=0}event(m,'ŻNIWA '+m.wave+'/'+m.waves+' / wspólny import, podwójne kłopoty.','wave');return true}
function addShot(m,{x,z,angle,speed,damage,team,ownerId,type='player',life=2,duplicate=false,kind='player',pierce=1}){
 if(m.projectiles.length>=LIMITS.projectiles)return false;
 m.projectiles.push({id:'b'+(++m.nextId),x,z,vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,damage,team,ownerId,type,life,duplicate,kind,pierce,hits:[],dead:false});return true;
}
function hitPlayer(m,p,raw,ownerId,source={}){
 if(!p.alive||p.inv>0||raw<=0||!Number.isFinite(raw)||p.hitInv>0&&!source.ignoreHitGrace)return false;
 if(p.barrierRemaining>0&&p.barrierHp>0&&source.blockable!==false){
  const attacker=m.players.find(q=>q.id===ownerId)||m.enemies.find(e=>e.id===ownerId),origin=Number.isFinite(source.x)?source:attacker;
  if(origin){const angle=Math.atan2(origin.x-p.x,origin.z-p.z);if(Math.cos(angle-p.barrierAngle)>=Math.cos(FACTION_KITS.salesforce.secondary.arc/2)){
   const absorbed=Math.min(raw,p.barrierHp);p.barrierHp-=absorbed;raw-=absorbed;p.barrierFlash=.2;
   if(p.barrierHp<=0)p.barrierRemaining=0;
  }}
 }
 if(raw<=0)return false;
 const beforeHp=p.hp,beforeShield=p.shield,shieldHit=Math.min(p.shield,raw);p.shield-=shieldHit;p.hp=Math.max(0,p.hp-(raw-shieldHit)*(1-p.stats.armor));p.shieldWait=p.stats.rechargeDelay;
 if(m.mode==='versus'){if(!source.ignoreHitGrace)p.hitInv=.09}else p.inv=.3;
 const hp=beforeHp-p.hp,shield=beforeShield-p.shield;
 if(hp+shield>0){p.recentDamage.push({time:m.time,hp,shield,beforeHp,beforeShield});if(p.recentDamage.length>64)p.recentDamage.shift()}
 if(p.hp>0)return true;p.deaths++;p.alive=false;p.dashTime=0;p.shield=0;clearPlayerKitState(p);m.effects=m.effects.filter(e=>e.kind!=='rewind'||e.ownerId!==p.id);
 if(m.mode==='versus'){p.downed=false;p.respawnIn=5;const killer=m.players.find(q=>q.id===ownerId&&q.team!==p.team);if(killer){killer.kills++;m.scores[killer.team]++;event(m,killer.name+' deduplikuje '+p.name+'.','kill')}}
 else{p.downed=true;p.bleedOut=18;p.reviveProgress=0;event(m,p.name+' potrzebuje pomocy! Przytrzymaj E obok niego przez 2 sekundy.','downed')}
 return true;
}
function hurtEnemy(m,e,n,ownerId){if(e.hp<=0)return false;if(e.type==='excel'&&m.support?.exposure<=0)return false;e.hp=Math.max(0,e.hp-n);if(e.hp>0)return true;const p=m.players.find(p=>p.id===ownerId);if(p)p.kills++;m.teamCredits+=ENEMY_TYPES[e.type].reward;if(e.type==='boss'||e.type==='excel')event(m,ENEMY_TYPES[e.type].name+' pokonany.','boss');return true}
function coopAbility(m,p){if(p.abilityCooldown>0)return;if(p.spawnProtected){p.inv=0;p.spawnProtected=false}p.abilityCooldown=p.stats.abilityCooldown;p.inv=Math.max(p.inv,.25);const r=p.stats.abilityRadius;for(const b of m.projectiles)if(b.team!==p.team&&Math.hypot(b.x-p.x,b.z-p.z)<r)b.dead=true;if(m.mode==='versus'){for(const q of m.players)if(q.team!==p.team&&Math.hypot(q.x-p.x,q.z-p.z)<r)m.pendingHits.push({target:q,damage:p.stats.abilityDamage,ownerId:p.id})}else for(const e of m.enemies)if(Math.hypot(e.x-p.x,e.z-p.z)<r+ENEMY_TYPES[e.type].r)hurtEnemy(m,e,p.stats.abilityDamage,p.id);event(m,p.name+': '+(p.team==='excel'?'Ctrl+Alt+Eksplozja!':'Permission Set: ACCESS DENIED!'),'ability')}
function spawnEnemy(m,type,x,z){if(m.enemies.filter(e=>e.hp>0).length>=LIMITS.enemies)return null;const t=ENEMY_TYPES[type],difficulty=MISSIONS[m.mission].difficulty,scale=1+.55*(m.partySize-1),hp=Math.round(t.hp*scale*(type==='excel'?1:type==='boss'?.75+difficulty*.15:1+(difficulty-1)*.22));const e={id:'e'+(++m.nextId),type,x,z,hp,maxHp:hp,timer:1.6+random(m),special:3.8,phase:1,movePhase:random(m)*TAU,attackIndex:0};m.enemies.push(e);return e}
function waveQuota(m){return 7+m.wave*3+m.mission*2+(m.partySize-1)*4}
function chooseEnemy(m,n){const roster=m.mission===0?['reaper','collector','reaper','geth']:m.mission===1?['collector','geth','reaper','banshee']:m.mission===2?['collector','collector','geth','banshee']:['geth','banshee','collector','geth','reaper'];return roster[n%roster.length]}
function spawnNormal(m,dt){if(MISSIONS[m.mission].boss==='excel')return;m.spawnClock-=dt;if(m.spawned<waveQuota(m)&&m.spawnClock<=0){const at=[[-21,-15],[21,-15],[0,-17],[-21,5],[21,5]][m.spawned%5],e=spawnEnemy(m,chooseEnemy(m,m.spawned),at[0],at[1]);if(e){m.spawned++;m.spawnClock=Math.max(.35,.7-m.mission*.045)}}if(m.wave===m.waves&&MISSIONS[m.mission].boss&&m.spawned>=waveQuota(m)&&!m.bossSpawned&&!m.enemies.some(e=>e.hp>0)){spawnEnemy(m,'boss',0,-8);m.bossSpawned=true;event(m,'ZWIASTUN: „WASZ TEAM MA ZA MAŁO PERMISSION SETÓW!”','boss')}}
function warning(m,e,kind,x,z,r,delay,damage,extra={}){if(m.warnings.length>=LIMITS.warnings)return;m.warnings.push({id:'w'+(++m.nextId),ownerId:e.id,kind,x,z,r,remaining:delay,total:delay,damage,...extra})}
function enemyAttack(m,e,target){const a=Math.atan2(target.x-e.x,target.z-e.z),difficulty=MISSIONS[m.mission].difficulty,damage=ENEMY_TYPES[e.type].damage*(1+(difficulty-1)*.12);const count=e.type==='geth'?3:e.type==='banshee'?3:e.type==='boss'||e.type==='excel'?5:1;for(let i=0;i<count;i++)addShot(m,{x:e.x,z:e.z,angle:a+(i-(count-1)/2)*(e.type==='banshee'?.23:.12),speed:e.type==='geth'?12:8+e.phase*.5,damage,team:'enemy',ownerId:e.id,type:e.type,life:4,duplicate:e.type==='excel'&&e.phase>=2})}
function updateEnemies(m,dt){
 const targets=m.players.filter(p=>p.alive);if(!targets.length)return;
 for(const e of m.enemies){if(e.hp<=0)continue;const t=ENEMY_TYPES[e.type];let target=targets[0],dist=Infinity;for(const p of targets){const d=Math.hypot(p.x-e.x,p.z-e.z);if(d<dist){dist=d;target=p}}
  const boss=e.type==='boss'||e.type==='excel';e.phase=boss?(e.hp/e.maxHp>2/3?1:e.hp/e.maxHp>1/3?2:3):1;
  if(e.type!=='excel'&&dist>(boss?7:e.type==='geth'?6:2.3)){const speed=t.speed*(1+(MISSIONS[m.mission].difficulty-1)*.06),dx=(target.x-e.x)/(dist||1)*speed*dt,dz=(target.z-e.z)/(dist||1)*speed*dt,oldX=e.x,oldZ=e.z;move(m,e,dx,dz,t.r);if(e.x===oldX&&e.z===oldZ){const sign=Math.sin(e.movePhase)>0?1:-1;move(m,e,-dz*sign,dx*sign,t.r);e.movePhase+=dt}}
  if(dist<t.r+.65)hitPlayer(m,target,t.damage,e.id);
  e.timer-=dt;if(e.timer<=0){enemyAttack(m,e,target);e.timer=e.type==='excel'?1.7-e.phase*.15:e.type==='boss'?1.8-e.phase*.18:e.type==='geth'?1.9:2.4}
  if(boss||e.type==='banshee'){
   e.special-=dt;if(e.special<=0){e.attackIndex++;const damage=boss?27+e.phase*6:22;
    if(e.type==='excel'&&e.attackIndex%2===0){const a=Math.atan2(target.x-e.x,target.z-e.z);warning(m,e,'ring',e.x,e.z,7,1.35,damage,{angle:a,duplicate:true});warning(m,e,'ring',e.x,e.z,7,1.9,damage,{angle:a,duplicate:true})}
    else{warning(m,e,'impact',target.x,target.z,boss?3:2.5,1.25,damage);if(boss&&e.phase>=2)for(const sign of [-1,1])warning(m,e,'impact',clamp(target.x+sign*6,-21,21),target.z,2.8,1.5,damage)}
    e.special=e.type==='excel'?Math.max(2.7,4.8-e.phase*.6):boss?4.5:6;
   }
  }
 }
}
function updateWarnings(m,dt){for(const w of m.warnings){w.remaining-=dt;if(w.remaining>0)continue;const e=m.enemies.find(e=>e.id===w.ownerId&&e.hp>0);if(!e)continue;if(w.kind==='ring'){const count=24;for(let i=3;i<count-1;i++)addShot(m,{x:e.x,z:e.z,angle:w.angle+i*TAU/count,speed:9,damage:w.damage,team:'enemy',ownerId:e.id,type:e.type,life:4,duplicate:!!w.duplicate})}else for(const p of m.players)if(p.alive&&Math.hypot(p.x-w.x,p.z-w.z)<w.r)hitPlayer(m,p,w.damage,e.id,{blockable:false})}m.warnings=m.warnings.filter(w=>w.remaining>0&&m.enemies.some(e=>e.id===w.ownerId&&e.hp>0))}
function updateSupport(m,dt,inputs){const s=m.support;if(!s)return;if(s.exposure>0){s.exposure=Math.max(0,s.exposure-dt);if(s.exposure===0)s.remaining=7}else{s.remaining=Math.max(0,s.remaining-dt);if(s.remaining===0){if(s.active){s.active=false;s.remaining=5;event(m,'MARC: „Dreamforce zerwał połączenie. Wrócę za chwilę!”','support')}else{const spots=[[-16,12],[16,12],[-16,-12],[16,-12]];const at=spots[s.index++%spots.length];s.x=at[0];s.z=at[1];s.active=true;s.remaining=12;event(m,'MARC BENIOFF / Drużyno, podejdźcie do hologramu i użyjcie E! NO SPREADSHEETS!','support')}}}
 if(s.active){const p=m.players.find(p=>p.alive&&p.connected&&inputs[p.id]?.interact&&Math.hypot(p.x-s.x,p.z-s.z)<=3.5);if(p){s.active=false;s.exposure=7;s.remaining=0;s.used++;for(const q of m.players)if(q.alive){q.hp=Math.min(q.stats.maxHp,q.hp+25);q.shield=Math.min(q.stats.maxShield,q.shield+35);q.inv=Math.max(q.inv,.8)}for(const b of m.projectiles)if(b.team==='enemy'&&Math.hypot(b.x-s.x,b.z-s.z)<10)b.dead=true;m.warnings=[];event(m,'MARC: „Wspólny deployment zatwierdzony!” / Tarcza Excela znika na 7 sekund.','support')}}}
function updateRespawns(m,dt,inputs){
 for(const p of m.players){if(p.alive)continue;if(p.respawnIn>0){p.respawnIn=Math.max(0,p.respawnIn-dt);if(p.respawnIn===0){refillPlayer(m,p);if(m.mode==='coop'){p.hp=p.stats.maxHp*.6;p.shield=0}event(m,p.name+' wraca do kolejki.','revive')}continue}
  if(p.downed){const helper=m.players.find(q=>q.alive&&q.connected&&inputs[q.id]?.interact&&Math.hypot(q.x-p.x,q.z-p.z)<=2.8);p.reviveProgress=helper?Math.min(1,p.reviveProgress+dt/2):Math.max(0,p.reviveProgress-dt*.3);if(p.reviveProgress>=1){p.alive=true;p.downed=false;p.hp=p.stats.maxHp*.4;p.inv=1.5;p.reviveProgress=0;p.bleedOut=0;helper.revives++;event(m,helper.name+' ratuje '+p.name+'. Backup działa!','revive');continue}p.bleedOut-=dt;if(p.bleedOut<=0){p.downed=false;p.reviveProgress=0;if(m.teamLives>0){m.teamLives--;p.respawnIn=5}}}
 }
 if(m.mode==='coop'&&!m.players.some(p=>p.alive)&&!m.players.some(p=>p.respawnIn>0)){
  const rescue=m.players.find(p=>p.connected)||m.players[0];if(m.teamLives>0){m.teamLives--;rescue.downed=false;rescue.reviveProgress=0;rescue.respawnIn=4;event(m,'Awaryjny rollback / zużyto wspólny pakiet odzyskiwania. Pozostało: '+m.teamLives,'revive')}else finishMatch(m,{outcome:'defeat',mission:m.mission});
 }
}
function updatePlayers(m,dt,rawInputs){
 const inputs={};
 for(const p of m.players){
  updatePlayerKitTimers(m,p,dt);
  const raw=rawInputs instanceof Map?rawInputs.get(p.id):rawInputs?.[p.id],candidate=normalizeInput(raw),input=p.connected&&candidate&&candidate.seq>=p.lastSeq?candidate:null;
  inputs[p.id]=input;
  if(input){const edge=input.seq>p.lastSeq;if(edge)p.lastSeq=input.seq;p.input=input;p.aimX=input.ax;p.aimZ=input.az;
   if(p.alive){
    if(edge&&input.dash&&p.dashCooldown<=0&&p.dashTime<=0){
     let dx=input.mx,dz=input.mz,length=Math.hypot(dx,dz);if(length<.1){dx=input.ax-p.x;dz=input.az-p.z;length=Math.hypot(dx,dz)||1}
     p.dashX=dx/length;p.dashZ=dz/length;p.dashTime=p.stats.dashDuration;p.dashCooldown=p.stats.dashCooldown;p.spawnProtected=false;p.inv=m.mode==='versus'?FACTION_KITS[p.team].dash.invulnerability:.28;
    }
    if(edge&&input.ability)ability(m,p);
    if(edge&&input.secondary)secondaryAbility(m,p);
   }
  }
  p.inv=Math.max(0,p.inv-dt);if(p.inv===0)p.spawnProtected=false;p.hitInv=Math.max(0,p.hitInv-dt);p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.abilityCooldown=Math.max(0,p.abilityCooldown-dt);p.shotCooldown=Math.max(0,p.shotCooldown-dt);p.shieldWait=Math.max(0,p.shieldWait-dt);
  if(!p.alive)continue;
  if(p.shieldWait===0)p.shield=Math.min(p.stats.maxShield,p.shield+p.stats.shieldRegen*dt);
  if(p.dashTime>0){const dashDt=Math.min(dt,p.dashTime);move(m,p,p.dashX*p.stats.dashSpeed*dashDt,p.dashZ*p.stats.dashSpeed*dashDt);p.dashTime=Math.max(0,p.dashTime-dt)}
  else if(input){const speed=(input.sprint?p.stats.sprintSpeed:p.stats.speed)*(p.slowRemaining>0?.8:1);move(m,p,input.mx*speed*dt,input.mz*speed*dt)}
  if(input?.fire&&p.shotCooldown<=0){exposeSpawn(p);const a=Math.atan2(input.ax-p.x,input.az-p.z);addShot(m,{x:p.x+Math.sin(a)*.8,z:p.z+Math.cos(a)*.8,angle:a,speed:p.stats.projectileSpeed,damage:p.stats.damage,team:p.team,ownerId:p.id,life:p.stats.projectileLife,kind:p.team==='excel'?'table':'player'});p.shotCooldown=p.stats.interval}
 }
 return inputs;
}
function updateProjectiles(m,dt){
 for(const b of m.projectiles){
  if(b.dead)continue;b.life-=dt;const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vz)*dt/.35));
  for(let i=0;i<steps&&!b.dead;i++){
   b.x+=b.vx*dt/steps;b.z+=b.vz*dt/steps;
   if(b.life<=0||Math.abs(b.x)>25||Math.abs(b.z)>21||blocked(m,b.x,b.z,b.kind==='apex'?.18:.08)){b.dead=true;break}
   if(b.team==='enemy'||m.mode==='versus'){
    const target=m.players.find(p=>p.alive&&p.team!==b.team&&!b.hits?.includes(p.id)&&Math.hypot(p.x-b.x,p.z-b.z)<(b.kind==='apex'?.86:.68));
    if(target){hitPlayer(m,target,b.damage,b.ownerId,{x:b.x-b.vx*.1,z:b.z-b.vz*.1,ignoreHitGrace:b.kind==='apex'});if(b.hits)b.hits.push(target.id);b.pierce=(b.pierce||1)-1;if(b.pierce<=0)b.dead=true}
   }else{const e=m.enemies.find(e=>e.hp>0&&Math.hypot(e.x-b.x,e.z-b.z)<ENEMY_TYPES[e.type].r);if(e){hurtEnemy(m,e,b.damage,b.ownerId);b.dead=true}}
  }
 }
 m.projectiles=m.projectiles.filter(b=>!b.dead);
}
function updatePickups(m,dt){for(const item of m.pickups){if(!item.ready){item.timer-=dt;if(item.timer<=0)item.ready=true}if(!item.ready)continue;const p=m.players.find(p=>p.alive&&p.hp<p.stats.maxHp&&Math.hypot(p.x-item.x,p.z-item.z)<1.35);if(p){p.hp=Math.min(p.stats.maxHp,p.hp+(m.mode==='coop'?45:35));item.ready=false;item.timer=m.mode==='coop'?18:25}}}
function checkCoopCompletion(m){if(m.phase!=='playing'||m.mode!=='coop')return;const mission=MISSIONS[m.mission],doneSpawning=mission.boss==='excel'||m.spawned>=waveQuota(m),doneBoss=!mission.boss||m.wave<m.waves||m.bossSpawned;if(doneSpawning&&doneBoss&&!m.enemies.some(e=>e.hp>0)){
 m.projectiles=[];m.warnings=[];m.teamCredits+=120+40*m.mission;
 if(m.wave<m.waves){m.phase='intermission';event(m,'Żniwa zakończone. Na statku kupcie wspólne ulepszenia przed następnym importem.','intermission')}
 else{m.teamCredits+=mission.reward;finishMatch(m,{outcome:'victory',mission:m.mission,nextMission:m.mission+1<MISSIONS.length?m.mission+1:null})}
}}
function stepMatch(m,dt,rawInputs={}){if(!m||m.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return m;dt=Math.min(dt,.1);m.time+=dt;if(m.mode==='versus')m.remaining=Math.max(0,m.remaining-dt);m.pendingHits=[];const inputs=updatePlayers(m,dt,rawInputs);for(const hit of m.pendingHits)hitPlayer(m,hit.target,hit.damage,hit.ownerId);m.pendingHits=[];updateRespawns(m,dt,inputs);if(m.phase!=='playing')return m;if(m.mode==='coop'){spawnNormal(m,dt);updateSupport(m,dt,inputs);updateEnemies(m,dt)}updateWarnings(m,dt);updateKitEffects(m,dt);updateProjectiles(m,dt);updatePickups(m,dt);m.enemies=m.enemies.filter(e=>e.hp>0);if(m.mode==='coop')checkCoopCompletion(m);else if(m.remaining<=0||m.scores.salesforce>=15||m.scores.excel>=15){const a=m.scores.salesforce,b=m.scores.excel;finishMatch(m,{outcome:a===b?'draw':'victory',winner:a===b?'draw':a>b?'salesforce':'excel'})}return m}
function snapshotMatch(m){return {mode:m.mode,phase:m.phase,mission:m.mission,missionName:m.mode==='versus'?'Salesforce vs Excel':MISSIONS[m.mission].name,wave:m.wave,waves:m.waves,map:m.map,obstacles:m.obstacles.map(o=>({...o})),players:m.players.map(p=>({id:p.id,name:p.name,team:p.team,x:p.x,z:p.z,hp:p.hp,maxHp:p.stats.maxHp,shield:p.shield,maxShield:p.stats.maxShield,alive:p.alive,downed:p.downed,reviveProgress:p.reviveProgress,bleedOut:Math.max(0,p.bleedOut||0),respawnIn:p.respawnIn,kills:p.kills,deaths:p.deaths,revives:p.revives,connected:p.connected,dashCooldown:p.dashCooldown,abilityCooldown:p.abilityCooldown,secondaryCooldown:p.secondaryCooldown,abilityName:m.mode==='coop'?'Apex Trigger: MASS UPDATE':FACTION_KITS[p.team].ability.name,secondaryName:FACTION_KITS[p.team].secondary.name,dashName:m.mode==='coop'?'ZIPsert':FACTION_KITS[p.team].dash.name,barrierRemaining:p.barrierRemaining,barrierHp:p.barrierHp,barrierAngle:p.barrierAngle,barrierFlash:p.barrierFlash,slowRemaining:p.slowRemaining,undoPending:p.undoPending,rewindFlash:p.rewindFlash,rewindAvailable:rewindPotential(m,p).total,dashing:p.dashTime>0,invulnerable:p.inv>0,aimX:p.aimX,aimZ:p.aimZ})),enemies:m.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,type:e.type,x:e.x,z:e.z,hp:e.hp,maxHp:e.maxHp,phase:e.phase,shielded:e.type==='excel'&&m.support?.exposure<=0})),projectiles:m.projectiles.filter(b=>!b.dead).map(b=>({id:b.id,x:b.x,z:b.z,vx:b.vx,vz:b.vz,team:b.team,type:b.type,duplicate:b.duplicate,kind:b.kind})),pickups:m.pickups.map(p=>({...p})),warnings:m.warnings.map(w=>({id:w.id,x:w.x,z:w.z,r:w.r,remaining:w.remaining,total:w.total,kind:w.kind})),effects:m.effects.map(e=>({id:e.id,kind:e.kind,phase:e.phase,team:e.team,ownerId:e.ownerId,x:e.x,z:e.z,width:e.width,depth:e.depth,angle:e.angle,remaining:e.remaining,total:e.total})),scores:{...m.scores},remaining:m.remaining,teamCredits:m.teamCredits,teamLives:m.teamLives,upgrades:{...m.upgrades},result:m.result?{...m.result}:null,events:m.events.filter(e=>m.time-e.time<12).map(e=>({...e})),support:m.support?{active:m.support.active,x:m.support.x,z:m.support.z,remaining:m.support.remaining,exposure:m.support.exposure}:null}}
// Offensive skills are committed casts; their short, bounded effects remain visible across snapshots.
function exposeSpawn(p){if(p.spawnProtected){p.inv=0;p.spawnProtected=false}}
function clearPlayerKitState(p){p.barrierRemaining=0;p.barrierHp=0;p.barrierAngle=0;p.barrierFlash=0;p.slowRemaining=0;p.undoPending=0;p.rewindFlash=0;p.recentDamage=[]}
function lineOfSight(m,x1,z1,x2,z2){const distance=Math.hypot(x2-x1,z2-z1),steps=Math.max(1,Math.ceil(distance/.2));for(let i=1;i<=steps;i++)if(blocked(m,x1+(x2-x1)*i/steps,z1+(z2-z1)*i/steps,.08))return false;return true}
function clearCastPoint(m,p,range){
 let dx=p.aimX-p.x,dz=p.aimZ-p.z,length=Math.hypot(dx,dz);if(length<.01){dx=p.team==='excel'?-1:1;dz=0;length=1}
 const distance=Math.min(range,length),tx=clamp(p.x+dx/length*distance,WORLD.minX+.8,WORLD.maxX-.8),tz=clamp(p.z+dz/length*distance,WORLD.minZ+.8,WORLD.maxZ-.8),steps=Math.max(1,Math.ceil(Math.hypot(tx-p.x,tz-p.z)/.2));
 let x=p.x,z=p.z;for(let i=1;i<=steps;i++){const nx=p.x+(tx-p.x)*i/steps,nz=p.z+(tz-p.z)*i/steps;if(blocked(m,nx,nz,.12))break;x=nx;z=nz}
 return {x,z,angle:Math.atan2(dx,dz)};
}
function addKitEffect(m,p,kind,point,duration,width,depth){
 if(m.effects.length>=24)return null;
 const effect={id:'fx'+(++m.nextId),kind,phase:'warning',team:p.team,ownerId:p.id,x:point.x,z:point.z,angle:point.angle,width,depth,remaining:duration,total:duration};m.effects.push(effect);return effect;
}
function ability(m,p){
 if(m.mode!=='versus')return coopAbility(m,p);
 if(p.abilityCooldown>0||m.effects.length>=24)return false;
 exposeSpawn(p);const kit=FACTION_KITS[p.team].ability;p.abilityCooldown=kit.cooldown;
 if(p.team==='salesforce'){
  const dx=p.aimX-p.x,dz=p.aimZ-p.z,angle=Math.hypot(dx,dz)>.01?Math.atan2(dx,dz):Math.PI/2;
  addKitEffect(m,p,'apexCast',{x:p.x,z:p.z,angle},kit.windup,kit.width,kit.range);
  event(m,p.name+': SELECT * FROM WROGOWIE! Limit: dwa rekordy. Ściana? INSUFFICIENT_ACCESS.','ability');
 }else{
  const point=clearCastPoint(m,p,kit.range);addKitEffect(m,p,'pivot',point,kit.windup,kit.width,kit.depth);
  event(m,p.name+': TABELA PRZESTAWNA! Wiersze na kolumny, przeciwnik na podłogę.','ability');
 }
 return true;
}
function rewindPotential(m,p){
 let hp=0,shield=0,hpCeiling=p.hp,shieldCeiling=p.shield;const age=FACTION_KITS.excel.secondary.history;
 for(const loss of p.recentDamage||[])if(m.time-loss.time<=age){hp+=loss.hp;shield+=loss.shield;hpCeiling=Math.max(hpCeiling,loss.beforeHp);shieldCeiling=Math.max(shieldCeiling,loss.beforeShield)}
 hp=Math.min(hp,Math.max(0,Math.min(p.stats.maxHp,hpCeiling)-p.hp),FACTION_KITS.excel.secondary.capacity);
 shield=Math.min(shield,Math.max(0,Math.min(p.stats.maxShield,shieldCeiling)-p.shield),FACTION_KITS.excel.secondary.capacity-hp);
 return {hp,shield,total:hp+shield};
}
function secondaryAbility(m,p){
 if(p.secondaryCooldown>0||!p.alive)return false;
 const team=m.mode==='coop'?'salesforce':p.team,kit=FACTION_KITS[team].secondary;
 if(team==='salesforce'){
  exposeSpawn(p);p.barrierRemaining=kit.duration;p.barrierHp=kit.capacity;p.barrierAngle=Math.atan2(p.aimX-p.x,p.aimZ-p.z);p.barrierFlash=0;p.secondaryCooldown=kit.cooldown;
  event(m,p.name+': NIE MASZ DOSTĘPU! Permission Set osłania przód. Boków nie obejmuje licencja.','secondary');
 }else{
  if(rewindPotential(m,p).total<=0)return false;
  exposeSpawn(p);p.secondaryCooldown=kit.cooldown;p.undoPending=kit.windup;
  addKitEffect(m,p,'rewind',{x:p.x,z:p.z,angle:0},kit.windup,2.4,2.4);
  event(m,p.name+': Ctrl+Z! Cofam błędy, nie konsekwencje całego życia.','secondary');
 }
 return true;
}
function updatePlayerKitTimers(m,p,dt){
 p.secondaryCooldown=Math.max(0,(p.secondaryCooldown||0)-dt);p.barrierRemaining=Math.max(0,(p.barrierRemaining||0)-dt);p.barrierFlash=Math.max(0,(p.barrierFlash||0)-dt);p.slowRemaining=Math.max(0,(p.slowRemaining||0)-dt);p.rewindFlash=Math.max(0,(p.rewindFlash||0)-dt);
 if(p.barrierRemaining===0)p.barrierHp=0;
 p.recentDamage=(p.recentDamage||[]).filter(loss=>m.time-loss.time<=FACTION_KITS.excel.secondary.history);
 if(p.undoPending>0){p.undoPending=Math.max(0,p.undoPending-dt);if(p.undoPending===0&&p.alive){const recovered=rewindPotential(m,p);p.hp+=recovered.hp;p.shield+=recovered.shield;p.recentDamage=[];p.rewindFlash=.6;event(m,p.name+': Cofnięto '+Math.round(recovered.total)+' punktów szkód. Historia zmian ma limit!','heal')}}
}
function resolvePivot(m,effect){
 const kit=FACTION_KITS.excel.ability,s=Math.sin(effect.angle),c=Math.cos(effect.angle);
 for(const p of m.players){
  if(!p.alive||p.team===effect.team)continue;
  const dx=p.x-effect.x,dz=p.z-effect.z,localX=dx*c-dz*s,localZ=dx*s+dz*c;
  if(Math.abs(localX)>effect.width/2||Math.abs(localZ)>effect.depth/2||!lineOfSight(m,effect.x,effect.z,p.x,p.z))continue;
  if(hitPlayer(m,p,kit.damage,effect.ownerId,{blockable:false,ignoreHitGrace:true})){p.slowRemaining=Math.max(p.slowRemaining,kit.slow)}
 }
}
function updateKitEffects(m,dt){
 for(const effect of m.effects){
  if(effect.kind==='rewind'&&!m.players.some(p=>p.id===effect.ownerId&&p.alive&&p.connected)){effect.remaining=0;continue}
  effect.remaining-=dt;if(effect.remaining>0||effect.phase==='impact')continue;
  if(effect.kind==='pivot')resolvePivot(m,effect);
  else if(effect.kind==='apexCast'){
   const kit=FACTION_KITS.salesforce.ability;
   addShot(m,{x:effect.x+Math.sin(effect.angle)*.8,z:effect.z+Math.cos(effect.angle)*.8,angle:effect.angle,speed:kit.speed,damage:kit.damage,team:effect.team,ownerId:effect.ownerId,kind:'apex',pierce:kit.pierce,life:(kit.range-.8)/kit.speed});
  }
  effect.phase='impact';effect.remaining=effect.kind==='rewind'?.6:.22;effect.total=effect.remaining;
 }
 m.effects=m.effects.filter(e=>e.remaining>0);
}

module.exports={createMatch,stepMatch,snapshotMatch,setPlayerConnected,normalizeInput,continueMatch,buyTeamUpgrade,setMatchUpgrades,finishMatch};
