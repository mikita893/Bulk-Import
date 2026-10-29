'use strict';
// Original local BvB arena. All art and simulation are generated inside the HTML.
const BULK_BIRDS=Object.freeze({
 pigeon:{name:'Gołąb',code:'P.I.G.E.O.N.',role:'Wszechstronny admin',hp:110,speed:8.8,damage:19,interval:.62,skill:'Duplicate Rule',cooldown:9,color:0x99aeb6,description:'Mówią, że jesteś dronem. Ty po prostu widzisz wszystkie rekordy.',power:'Q: zostawiasz sobowtóra na 3,5 s. Boty atakują kopię, a oryginał robi import.',meme:'Gołąb main: „To nie exploit. To feature lotniczy.”'},
 crow:{name:'Wrona',code:'CACHE MASTER',role:'Zbieraczka danych',hp:95,speed:9.7,damage:17,interval:.53,skill:'Cache & Carry',cooldown:8,color:0x303442,description:'Błyskotki? Nie. Cudze External ID. Każdy ma jakieś hobby.',power:'Q: zbierasz CSV w promieniu 9 m; możesz też wykraść jeden z dzioba pobliskiego bota. Limit: 3.',meme:'Wrona main: „Kradzież? Ja tylko przenoszę ownership.”'},
 owl:{name:'Sowa',code:'NOCNY AUDYT',role:'Pancerna kontrola',hp:135,speed:7.3,damage:25,interval:.82,skill:'Nocny audyt',cooldown:10,color:0x987455,description:'Widzi błędy w ciemności. I każde pole, które „na pewno było wymagane”.',power:'Q: spowalniasz pobliskie boty na 3,5 s i zadajesz im 10 obrażeń.',meme:'Sowa main: „Nie śpię. Czekam, aż batch przestanie mielić.”'},
 hummingbird:{name:'Koliber',code:'GOVERNOR LIMIT',role:'Szybki, kruchy napastnik',hp:75,speed:12,damage:11,interval:.32,skill:'Bulk API Burst',cooldown:9,color:0x49c7a0,description:'Podobno miał dostać nerfa. Release manager nadal szuka go w logach.',power:'Q: błyskawiczna seria zadaje 32 obrażenia botom w promieniu 5 m. Mało życia, dużo zamieszania.',meme:'Koliber main: „Jeśli widzisz moje skrzydła, masz za wysoki ping.”'},
 duck:{name:'Kaczka',code:'FLOW BUILDER',role:'Wytrzymała pomoc',hp:120,speed:8,damage:20,interval:.66,skill:'Naprawczy Flow',cooldown:11,color:0x47a67b,description:'Kwa, kwa. Flow zakończony pomyślnie. Nikt nie wie, co właściwie zmienił.',power:'Q: odzyskujesz 24 HP i dostajesz 18 punktów osłony na 3 s. Nadmiar leczenia przepada.',meme:'Kaczka main: „Nie ma bugów. Są nieudokumentowane kacze ścieżki.”'}
});
const BIRD_NEST={x:-14,z:13},BIRD_RIVAL_NEST={x:17,z:-15};
const BIRD_CSV_NODES=[[-10,10],[-6,11],[-7,6],[-1,8],[5,8],[10,3],[8,-4],[1,-7],[-7,-10],[-13,-4],[16,10],[18,-3]];
const BIRD_OBSTACLES=[{x:-8,z:0,r:1.2,h:8},{x:3,z:2,r:1.1,h:8},{x:13,z:-8,r:1.2,h:8},{x:-15,z:-12,r:1.3,h:8},{x:0,z:15,r:1.5,h:2},{x:-4,z:-4,r:1.4,h:2},{x:16,z:4,r:1.8,h:2}];
const birdClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function readBulkBirdSave(raw){
 const out={version:2,best:0,selected:'pigeon',legacyBest:0,records:{}};
 try{const d=typeof raw==='string'?JSON.parse(raw):raw;if(!d||![1,2].includes(d.version))return out;
  const score=v=>Number.isSafeInteger(v)&&v>=0&&v<=1000000?v:0;
  if(d.version===1){out.legacyBest=score(d.best);return out;}
  out.best=score(d.best);out.legacyBest=score(d.legacyBest);if(Object.hasOwn(BULK_BIRDS,d.selected))out.selected=d.selected;
  if(d.records&&typeof d.records==='object')for(const k of Object.keys(BULK_BIRDS))out.records[k]=score(d.records[k]);
 }catch{}return out;
}
class BulkBirdState {
 constructor(seed=1,bird='pigeon'){this.reset(seed,bird);}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 makeBird(type,x,z,id,name){const c=BULK_BIRDS[type];return {id,type,name,x,z,y:1.1,hp:c.hp,maxHp:c.hp,stamina:100,exhausted:false,cargo:0,heading:Math.PI,attackCooldown:0,skillCooldown:0,dashCooldown:0,dashRemaining:0,inv:0,shield:0,shieldTime:0,slow:0,alive:true,respawn:0,flap:0,peck:0};}
 reset(seed=1,bird='pigeon'){
  this.seed=seed>>>0||1;this.selected=Object.hasOwn(BULK_BIRDS,bird)?bird:'pigeon';this.mode='ready';this.time=0;this.remaining=120;this.score=0;this.delivered=0;this.goal=8;this.lives=3;this.kills=0;this.csv=0;this.nextId=0;this.spawnClock=0;this.eventId=0;this.status='Wybierz ptaka. Serwer lokalny, przeciwnicy: boty.';this.fx=[];this.decoy=null;this.won=false;
  this.player=this.makeBird(this.selected,BIRD_NEST.x,BIRD_NEST.z,'you','TY');
  this.enemies=[this.makeBird('crow',12,-10,'bot-1','CacheThief_404'),this.makeBird('owl',-8,-12,'bot-2','AudytorNocy'),this.makeBird('hummingbird',19,-3,'bot-3','HummingMain67')];
  this.enemies.forEach((b,i)=>{b.grace=3+i;b.patrol=i;});this.pickups=[];
  BIRD_CSV_NODES.slice(0,10).forEach(([x,z])=>this.spawnCSV(x,z));
 }
 get stage(){return this.delivered<3?1:this.delivered<6?2:3;}
 start(){if(this.mode==='ready')this.mode='playing';}
 event(message){this.status=message;this.eventId++;}
 effect(kind,x,z,color=0x8cf7ed){if(this.fx.length>=24)this.fx.shift();this.fx.push({id:++this.nextId,kind,x,z,color,life:.65,total:.65});}
 spawnCSV(x,z,delay=0){if(this.pickups.length>=24)return;this.pickups.push({id:++this.nextId,x:birdClamp(x,-23,23),z:birdClamp(z,-23,23),wait:delay});}
 move(b,mx,mz,speed,dt){
  const limit=24,clear=(x,z)=>BIRD_OBSTACLES.every(o=>b.y>o.h+1||Math.hypot(x-o.x,z-o.z)>o.r+.48);
  const nx=birdClamp(b.x+mx*speed*dt,-limit,limit);if(clear(nx,b.z))b.x=nx;
  const nz=birdClamp(b.z+mz*speed*dt,-limit,limit);if(clear(b.x,nz))b.z=nz;
 }
 damage(b,amount,attacker){
  if(!b.alive||b.inv>0||!Number.isFinite(amount)||amount<=0)return false;
  const blocked=Math.min(b.shield,amount);b.shield-=blocked;amount-=blocked;b.hp=Math.max(0,b.hp-amount);b.inv=.2;this.effect('hit',b.x,b.z,attacker?.id==='you'?0xffd18b:0xff8f87);
  if(b.hp>0)return true;
  b.alive=false;b.respawn=b.id==='you'?2.2:5;
  const drops=b.cargo+(b.id==='you'?0:1);for(let i=0;i<drops;i++)this.spawnCSV(b.x+(i%2?1:-1)*.6,b.z+Math.floor(i/2)*.7,.8);b.cargo=0;
  if(b.id==='you'){this.lives--;this.event('Gołąb nie odpowiada? Retry za chwilę. Życia: '+this.lives+'.');if(this.lives<=0)this.finish(false,'Trzy retry wykorzystane. Przynajmniej CSV ma backup.');}
  else{this.kills++;this.score+=25;this.event(b.name+': „To był lag, nie dziobnięcie!”');}
  return true;
 }
 peck(b){
  if(!b.alive||b.attackCooldown>0)return;
  b.attackCooldown=BULK_BIRDS[b.type].interval;b.peck=.18;
  const targets=b.id==='you'?this.enemies:[this.player];let target=null,best=3.35;
  for(const t of targets){const d=Math.hypot(b.x-t.x,b.z-t.z);if(t.alive&&d<best&&Math.abs(t.y-b.y)<1.8){best=d;target=t;}}
  if(target){b.heading=Math.atan2(target.x-b.x,target.z-b.z);this.damage(target,BULK_BIRDS[b.type].damage,b);}
 }
 useSkill(){
  const p=this.player,c=BULK_BIRDS[p.type];if(!p.alive||p.skillCooldown>0)return false;
  p.skillCooldown=c.cooldown;this.effect('skill',p.x,p.z,c.color);
  if(p.type==='pigeon'){this.decoy={x:p.x,z:p.z,y:p.y,life:3.5,type:p.type};this.event('Duplicate Rule: boty biją kopię. Oryginał ma przerwę na import.');}
  if(p.type==='owl'){for(const e of this.enemies)if(e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<9){e.slow=3.5;this.damage(e,10,p);}this.event('Nocny audyt: wstrzymano automatyzacje przeciwników.');}
  if(p.type==='hummingbird'){for(const e of this.enemies)if(e.alive&&Math.hypot(e.x-p.x,e.z-p.z)<5&&Math.abs(e.y-p.y)<2.5)this.damage(e,32,p);this.event('Bulk API Burst! Patch z nerfem nadal w kolejce.');}
  if(p.type==='duck'){p.hp=Math.min(p.maxHp,p.hp+24);p.shield=18;p.shieldTime=3;this.event('Naprawczy Flow: +24 HP, do limitu. Kwa-lidacja przeszła.');}
  if(p.type==='crow'){
   let n=0;this.pickups=this.pickups.filter(item=>{if(p.cargo<3&&item.wait<=0&&Math.hypot(item.x-p.x,item.z-p.z)<9){p.cargo++;n++;return false;}return true;});
   const victim=this.enemies.find(e=>e.alive&&e.cargo>0&&Math.hypot(e.x-p.x,e.z-p.z)<8);if(victim&&p.cargo<3){victim.cargo--;p.cargo++;n++;}
   this.event(n?'Cache & Carry: przejęto '+n+' CSV. Ownership zmieniony.':'Cache miss. Podejdź do CSV albo bota, który coś niesie.');
  }
  return true;
 }
 tickBird(b,dt){for(const k of ['attackCooldown','skillCooldown','dashCooldown','dashRemaining','inv','shieldTime','slow','peck'])b[k]=Math.max(0,b[k]-dt);if(!b.shieldTime)b.shield=0;b.flap+=dt*(b.type==='hummingbird'?38:12);
  if(!b.alive){b.respawn-=dt;if(b.respawn<=0&&this.mode==='playing'){const x=b.id==='you'?BIRD_NEST.x:BIRD_RIVAL_NEST.x,z=b.id==='you'?BIRD_NEST.z:BIRD_RIVAL_NEST.z;Object.assign(b,this.makeBird(b.type,x,z,b.id,b.name),{inv:2,grace:2});}}
 }
 step(dt,input={}){
  if(this.mode!=='playing'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1/30);this.time+=dt;this.remaining=Math.max(0,this.remaining-dt);this.spawnClock-=dt;
  for(const f of this.fx)f.life-=dt;this.fx=this.fx.filter(f=>f.life>0);for(const item of this.pickups)item.wait=Math.max(0,item.wait-dt);
  if(this.decoy){this.decoy.life-=dt;if(this.decoy.life<=0)this.decoy=null;}
  const p=this.player;this.tickBird(p,dt);
  if(p.alive){
   let mx=Number.isFinite(input.mx)?birdClamp(input.mx,-1,1):0,mz=Number.isFinite(input.mz)?birdClamp(input.mz,-1,1):0;const len=Math.hypot(mx,mz);if(len>1){mx/=len;mz/=len;}if(len>.01)p.heading=Math.atan2(mx,mz);
   if(p.stamina<=3)p.exhausted=true;if(p.stamina>=30)p.exhausted=false;
   const ascend=input.fly===true&&!p.exhausted,boost=input.sprint===true&&len>.01&&!p.exhausted;
   p.y=birdClamp(p.y+(ascend?4.2:-2.1)*dt,1.1,6.5);p.stamina=birdClamp(p.stamina+((ascend?-15:10)+(boost?-19:0))*dt,0,100);
   if(input.dash===true&&p.dashCooldown===0&&p.stamina>=15){p.dashCooldown=3.2;p.dashRemaining=.2;p.inv=Math.max(p.inv,.28);p.stamina-=15;}
   if(p.dashRemaining>0){mx=Math.sin(p.heading);mz=Math.cos(p.heading);}
   this.move(p,mx,mz,BULK_BIRDS[p.type].speed*(p.dashRemaining>0?2.7:boost?1.5:1),dt);
   if(input.fire===true)this.peck(p);if(input.skill===true)this.useSkill();
   if(p.y<2.8){this.pickups=this.pickups.filter(item=>{if(p.cargo<3&&item.wait<=0&&Math.hypot(item.x-p.x,item.z-p.z)<1.5){p.cargo++;this.csv++;this.event('CSV w dziobie: '+p.cargo+'/3. Dostarcz do niebieskiego gniazda.');return false;}return true;});}
   if(p.cargo&&p.y<3&&Math.hypot(p.x-BIRD_NEST.x,p.z-BIRD_NEST.z)<2.7){const batch=p.cargo;this.delivered+=batch;this.score+=batch*100;p.cargo=0;this.effect('deposit',BIRD_NEST.x,BIRD_NEST.z);this.event('Upsert udany! '+this.delivered+'/'+this.goal+' CSV w gnieździe. Zero załączników XLSX.');if(this.delivered>=this.goal){this.finish(true,'Import zakończony. Ptasia rada zatwierdza deployment.');return;}}
  }
  for(const e of this.enemies){
   this.tickBird(e,dt);if(!e.alive)continue;e.grace=Math.max(0,(e.grace||0)-dt);if(e.grace>0)continue;
   let target;
   if(this.decoy&&Math.hypot(e.x-this.decoy.x,e.z-this.decoy.z)<13)target=this.decoy;
   else if(e.cargo>=2)target=BIRD_RIVAL_NEST;
   else if(p.alive&&Math.hypot(e.x-p.x,e.z-p.z)<11)target=p;
   else target=this.pickups.filter(i=>i.wait<=0).reduce((best,i)=>!best||Math.hypot(i.x-e.x,i.z-e.z)<Math.hypot(best.x-e.x,best.z-e.z)?i:best,null)||BIRD_RIVAL_NEST;
   let dx=target.x-e.x,dz=target.z-e.z,d=Math.hypot(dx,dz);if(d>1.5){dx/=d;dz/=d;for(const o of BIRD_OBSTACLES){const od=Math.hypot(e.x-o.x,e.z-o.z);if(od<o.r+2.5&&od>.01){dx+=(e.x-o.x)/od*.85;dz+=(e.z-o.z)/od*.85;}}const l=Math.hypot(dx,dz)||1;e.heading=Math.atan2(dx,dz);this.move(e,dx/l,dz/l,BULK_BIRDS[e.type].speed*.56*(e.slow>0?.38:1)*(1+(this.stage-1)*.08),dt);}
   e.y+=birdClamp((target===p?p.y:1.1)-e.y,-2.6*dt,2.6*dt);
   if(target===p&&d<3.2)this.peck(e);
   if(e.y<2.8){this.pickups=this.pickups.filter(item=>{if(e.cargo<2&&item.wait<=0&&Math.hypot(item.x-e.x,item.z-e.z)<1.1){e.cargo++;return false;}return true;});}
   if(e.cargo&&Math.hypot(e.x-BIRD_RIVAL_NEST.x,e.z-BIRD_RIVAL_NEST.z)<3)e.cargo=0;
  }
  if(this.spawnClock<=0&&this.pickups.length<10){this.spawnClock=2;const node=BIRD_CSV_NODES[Math.floor(this.random()*BIRD_CSV_NODES.length)];this.spawnCSV(node[0]+(this.random()-.5)*2,node[1]+(this.random()-.5)*2);}
  if(this.remaining<=0)this.finish(false,'SLA minęło. Gołąb pyta o przedłużenie deadline’u.');
 }
 finish(won,message){if(this.mode==='over')return;this.won=won;this.mode='over';if(won)this.score+=Math.ceil(this.remaining)*2;this.event(message);}
}
if(typeof module!=='undefined')module.exports={BULK_BIRDS,BIRD_NEST,BIRD_RIVAL_NEST,BIRD_OBSTACLES,BIRD_CSV_NODES,BulkBirdState,readBulkBirdSave};
