'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {BulkBirdState,BULK_BIRDS,BIRD_NEST,BIRD_RIVAL_NEST,readBulkBirdSave}=require('../minigames/bird-sim.js');
test('five selectable birds have different real stats and deterministic bounded arenas',()=>{
 const ids=Object.keys(BULK_BIRDS);assert.equal(ids.length,5);assert.equal(new Set(ids.map(id=>BULK_BIRDS[id].skill)).size,5);
 for(const id of ids){const g=new BulkBirdState(42,id);assert.equal(g.selected,id);assert.equal(g.player.maxHp,BULK_BIRDS[id].hp);assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.lives,3);assert.equal(g.mode,'ready');assert.deepEqual(g.pickups,new BulkBirdState(42,id).pickups);}
 assert.equal(new BulkBirdState(42,'toString').selected,'pigeon');
});
test('CSV collection has a three-item capacity, a height limit and one-time nest deposits',()=>{
 const g=new BulkBirdState(4);g.start();g.enemies=[];const p=g.player;p.x=0;p.z=0;p.y=4;g.pickups=[];for(let i=0;i<6;i++)g.spawnCSV(0,0);g.step(1/60);assert.equal(p.cargo,0);
 p.y=1.1;g.step(1/60);assert.equal(p.cargo,3);assert.equal(g.pickups.length,3);assert.equal(g.score,0);
 p.x=BIRD_NEST.x;p.z=BIRD_NEST.z;g.step(1/60);assert.equal(g.delivered,3);assert.equal(g.score,300);assert.equal(p.cargo,0);g.step(1/60);assert.equal(g.score,300);
});
test('pecks respect range, altitude, cooldowns, short immunity and bot respawn',()=>{
 const g=new BulkBirdState(2),p=g.player,e=g.enemies[0];g.start();e.x=p.x+2;e.z=p.z;e.y=p.y;e.hp=38;e.grace=100;
 g.peck(p);assert.equal(e.hp,19);g.peck(p);assert.equal(e.hp,19);p.attackCooldown=0;g.peck(p);assert.equal(e.hp,19,'Damage grace prevents immediate repeated damage');e.inv=0;p.attackCooldown=0;g.peck(p);assert.equal(e.alive,false);assert.equal(g.kills,1);assert.equal(g.score,25);
 for(let i=0;i<310;i++)g.step(1/60);assert(e.alive);assert.equal(e.hp,e.maxHp);
 e.x=p.x+10;e.z=p.z;e.y=p.y;e.inv=0;p.attackCooldown=0;g.peck(p);assert.equal(e.hp,e.maxHp);e.x=p.x;e.y=p.y+3;p.attackCooldown=0;g.peck(p);assert.equal(e.hp,e.maxHp);
});
test('each bird power has its own bounded effect and cannot repeat during cooldown',()=>{
 const pigeon=new BulkBirdState(1,'pigeon');pigeon.start();assert(pigeon.useSkill());assert.equal(pigeon.decoy.life,3.5);assert(!pigeon.useSkill());
 const crow=new BulkBirdState(1,'crow');crow.start();crow.player.x=0;crow.player.z=0;crow.pickups=[];for(let i=0;i<5;i++)crow.spawnCSV(i,0);crow.useSkill();assert.equal(crow.player.cargo,3);assert.equal(crow.pickups.length,2);
 const owl=new BulkBirdState(1,'owl');owl.start();const target=owl.enemies[0];target.x=owl.player.x+2;target.z=owl.player.z;owl.useSkill();assert.equal(target.slow,3.5);assert.equal(target.hp,target.maxHp-10);
 const humming=new BulkBirdState(1,'hummingbird');humming.start();const h=humming.enemies[0];h.x=humming.player.x+2;h.z=humming.player.z;humming.useSkill();assert.equal(h.hp,h.maxHp-32);
 const duck=new BulkBirdState(1,'duck');duck.start();duck.player.hp=duck.player.maxHp-10;duck.useSkill();assert.equal(duck.player.hp,duck.player.maxHp);assert.equal(duck.player.shield,18);for(let i=0;i<190;i++)duck.step(1/60);assert.equal(duck.player.shield,0);
});
test('decoy redirects nearby bots, while the crow can steal carried records only once',()=>{
 const g=new BulkBirdState(1);g.start();const p=g.player,e=g.enemies[0];e.x=p.x+7;e.z=p.z;e.grace=0;g.useSkill();p.x-=8;const start=e.x;g.step(1/60);assert(e.x<start,'Bot heads for clone rather than the escaped player');
 const crow=new BulkBirdState(1,'crow');crow.start();crow.pickups=[];const victim=crow.enemies[0];victim.x=crow.player.x+2;victim.z=crow.player.z;victim.cargo=2;crow.useSkill();assert.equal(victim.cargo,1);assert.equal(crow.player.cargo,1);assert(!crow.useSkill());assert.equal(victim.cargo,1);
});
test('flight, sprint and dash consume stamina and remain within world/height limits',()=>{
 const g=new BulkBirdState(6,'hummingbird');g.start();g.enemies=[];const p=g.player,start={x:p.x,z:p.z};g.step(1/60,{mx:NaN,mz:Infinity,fly:true,dash:true});assert.equal(p.x,start.x);assert(p.y>1.1);assert(p.stamina<100);assert(p.dashCooldown>0);const cd=p.dashCooldown;g.step(1/60,{dash:true});assert(p.dashCooldown<cd);
 for(let i=0;i<3000;i++)g.step(1/60,{mx:1,mz:-1,fly:true,sprint:true});assert(p.x<=24&&p.z>=-24);assert(p.y>=1.1&&p.y<=6.5);assert(p.stamina>=0&&p.stamina<=100);
});
test('death uses exactly one retry, respawns safely and game over/pause freeze state',()=>{
 const g=new BulkBirdState(3);g.start();g.damage(g.player,1000);assert.equal(g.lives,2);g.damage(g.player,1000);assert.equal(g.lives,2);for(let i=0;i<140;i++)g.step(1/60);assert(g.player.alive);assert.equal(g.player.hp,g.player.maxHp);
 g.mode='paused';const before=JSON.stringify(g);g.step(1/60,{skill:true,fire:true});assert.equal(JSON.stringify(g),before);
 g.mode='playing';g.player.inv=0;g.damage(g.player,1000);for(let i=0;i<140;i++)g.step(1/60);g.player.inv=0;g.damage(g.player,1000);assert.equal(g.mode,'over');assert.equal(g.lives,0);const end=JSON.stringify(g);g.step(1/60);assert.equal(JSON.stringify(g),end);
});
test('all bird builds can finish the objective using ordinary movement and real pickup rules',()=>{
 for(const id of Object.keys(BULK_BIRDS)){
  const g=new BulkBirdState(25,id);g.start();g.enemies=[];g.pickups=[];for(let n=0;n<9;n++)g.spawnCSV(-10+(n%3)*.3,10+Math.floor(n/3)*.3);
  for(let i=0;i<60*60&&g.mode==='playing';i++){
   const p=g.player;assert.equal(g.pickups.length+p.cargo+g.delivered,9);
   const goal=p.cargo?BIRD_NEST:g.pickups[0],dx=goal.x-p.x,dz=goal.z-p.z,len=Math.hypot(dx,dz)||1;
   g.step(1/60,{mx:dx/len,mz:dz/len});
  }
  assert(g.won,id+' should be able to gather and bank the required data');assert(g.delivered>=8);assert(g.score>=800);
 }
});
test('entity effects stay bounded and old v13 records migrate without touching campaign saves',()=>{
 const g=new BulkBirdState(1);for(let i=0;i<100;i++){g.spawnCSV(i,0);g.effect('hit',0,0);}assert.equal(g.pickups.length,24);assert.equal(g.fx.length,24);
 const old=readBulkBirdSave(JSON.stringify({version:1,best:37}));assert.equal(old.version,2);assert.equal(old.legacyBest,37);assert.equal(old.best,0);assert.equal(old.selected,'pigeon');
 const current=readBulkBirdSave({version:2,best:850,legacyBest:37,selected:'owl',records:{owl:850,crow:-1}});assert.equal(current.selected,'owl');assert.equal(current.records.owl,850);assert.equal(current.records.crow,0);
 for(const raw of ['bad JSON',{version:4,best:99},{version:2,best:Infinity,selected:'constructor'}]){const s=readBulkBirdSave(raw);assert.equal(s.selected,'pigeon');assert.equal(s.best,0);}
});

test('enemy attack has a locked windup: standing still takes damage, dash can leave its cone',()=>{
 for(const dodge of [false,true]){
  const g=new BulkBirdState(8),e=g.enemies[0],p=g.player;g.start();g.enemies=[e];g.pickups=[];Object.assign(e,{x:0,z:-10,y:1.1,grace:0,cargo:0});Object.assign(p,{x:0,z:-8,y:1.1});
  assert(g.beginEnemyAttack(e));const hp=p.hp,angle=e.attackAngle;
  for(let i=0;i<20;i++)g.step(1/60);assert.equal(p.hp,hp,'No damage during warning');assert.equal(e.attackAngle,angle);
  for(let i=0;i<42;i++)g.step(1/60,dodge?{mx:1,dash:i===0}:{});
  assert.equal(p.hp,dodge?hp:hp-BULK_BIRDS[e.type].damage);assert.equal(e.attackWindup,0);
 }
});
test('airborne files require matching height and a full beak warns the player',()=>{
 const g=new BulkBirdState(9);g.start();g.enemies=[];g.pickups=[];Object.assign(g.player,{x:0,z:0});g.spawnCSV(0,0,0,4.5);g.step(1/60);assert.equal(g.player.cargo,0);
 for(let i=0;i<45;i++)g.step(1/60,{fly:true});assert.equal(g.player.cargo,1);
 g.player.y=1.1;for(let i=0;i<3;i++)g.spawnCSV(0,0);g.step(1/60);assert.equal(g.player.cargo,3);assert.match(g.status,/PEŁNY DZIÓB/);assert.equal(g.pickups.length,1);
});
test('finite CSV survive bot defeats/respawns, theft, deposits and enemy-base raids without growing',()=>{
 const g=new BulkBirdState(10,'crow');g.start();assert.equal(g.csvTotal,12);assert(g.pickups.some(i=>i.y>3));
 for(let i=0;i<3000&&g.mode==='playing';i++){if(i%240===0){const e=g.enemies[i/240%3|0];if(e.alive){e.inv=0;g.damage(e,1000,g.player);}}g.step(1/60);assert.equal(g.csvTotal,12);}
 const h=new BulkBirdState(2);h.start();h.pickups=[];h.enemies.forEach(e=>{e.cargo=0;e.grace=100;});h.enemyVault=12;h.player.x=BIRD_RIVAL_NEST.x;h.player.z=BIRD_RIVAL_NEST.z;h.step(1/60);assert.equal(h.player.cargo,3);assert.equal(h.enemyVault,9);assert.equal(h.csvTotal,12);
 h.player.x=BIRD_NEST.x;h.player.z=BIRD_NEST.z;h.step(1/60);assert.equal(h.delivered,3);assert.equal(h.csvTotal,12);
});
