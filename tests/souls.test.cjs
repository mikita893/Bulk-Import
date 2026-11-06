'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../minigames/souls-sim.js');
const advance=(g,seconds,input={})=>{for(let i=0;i<seconds*120;i++)g.tick(1/120,input);};
function duel(type='knight'){const g=new S.Game();g.start();g.player.x=0;g.player.z=0;g.player.inv=0;g.enemies=[{...g.enemies[0],type,x:0,z:2,hp:S.ENEMIES[type].hp,maxHp:S.ENEMIES[type].hp,timer:10}];g.target=g.enemies[0].id;return g;}
test('melee uses stamina, delayed hit timing and facing/range; heavy attacks stagger guards',()=>{
 const g=duel(),e=g.enemies[0];assert(g.action('heavy'));assert.equal(g.player.stamina,60);assert(!g.action('light'));advance(g,.3);assert.equal(e.hp,78);advance(g,.1);assert.equal(e.hp,30);assert.equal(e.state,'recover');advance(g,.5);g.player.stamina=21;assert(!g.action('light'));g.player.stamina=100;e.z=6;g.action('light');advance(g,.2);assert.equal(e.hp,30);
 const a=duel();a.target=null;a.action('light',{angle:Math.PI});advance(a,.2);assert.equal(a.enemies[0].hp,78);
});
test('roll has finite invulnerability and cost; frontal block spends stamina while rear attacks and novas bypass it',()=>{
 const g=duel();g.action('roll',{x:1,z:0});assert.equal(g.player.stamina,72);assert(!g.hurtPlayer(30,0,2));advance(g,.36);assert(g.hurtPlayer(30,0,2));assert.equal(g.player.hp,90);
 const b=duel();b.player.angle=0;b.tick(.01,{block:true});b.hurtPlayer(20,0,2);assert.equal(b.player.hp,117.6);assert(b.player.stamina<100);b.player.inv=0;b.hurtPlayer(20,0,-2);assert.equal(b.player.hp,97.6);b.player.inv=0;b.player.blocking=true;b.hurtPlayer(20,0,2,true);assert.equal(b.player.hp,77.6);
});
test('healing is delayed, limited and interruptible; all clocks freeze during pause',()=>{
 const g=duel();g.player.hp=30;assert(g.action('heal'));assert.equal(g.player.flasks,2);advance(g,.5);assert.equal(g.player.hp,30);g.hurtPlayer(10,0,2);advance(g,.7);assert.equal(g.player.hp,20);g.action('heal');advance(g,.7);assert.equal(g.player.hp,95);g.pause();const before=JSON.stringify(g);g.tick(20,{x:1});assert(!g.action('roll'));assert.equal(JSON.stringify(g),before);g.resume();advance(g,.1);assert(g.time>1);
});
test('death leaves runes on the floor until respawn/retrieval, and a second death replaces the previous pile',()=>{
 const g=duel();g.progress.runes=80;g.player.hp=1;const e=g.enemies[0];e.state='windup';e.timer=.001;e.attackAngle=Math.PI;e.attackRange=3;e.attackKind='slash';g.tick(.02);assert.equal(g.state,'dead');assert.equal(g.progress.runes,0);assert.equal(g.progress.lost.runes,80);assert.equal(g.progress.deaths,1);assert(S.validProgress(g.snapshot()));g.retry();assert.equal(g.progress.runes,0);g.player.x=0;g.player.z=0;g.tick(.01);assert.equal(g.progress.runes,80);assert.equal(g.progress.lost,null);
 g.player.inv=0;g.hurtPlayer(999,0,2);g.retry();g.player.inv=0;g.hurtPlayer(999,0,2);assert.equal(g.progress.lost,null);assert.equal(g.progress.deaths,3);
});
test('bonfires refill flasks/health and respawn enemies, upgrades spend earned runes, gates require cleared rooms',()=>{
 const g=new S.Game();g.start();g.player.hp=1;g.player.flasks=0;g.progress.runes=100;assert(g.action('interact'));assert.equal(g.state,'rest');assert(g.buyLevel());assert.equal(g.progress.runes,50);assert.equal(g.maxHp,130);assert(!g.buyLevel());assert(g.rest());assert.equal(g.player.flasks,3);assert.equal(g.player.hp,130);g.leaveRest();g.player.z=-11;assert(!g.action('interact'));for(const e of g.enemies)g.hurtEnemy(e,1000);assert(g.action('interact'));assert.equal(g.area,1);assert.equal(g.progress.room,1);assert(g.enemies.some(e=>e.type==='warden'));const restored=new S.Game(S.readProgress(JSON.stringify(g.snapshot())));assert.equal(restored.area,1);
});
test('scribes telegraph bounded projectiles; boss phases expose increasingly fast attacks and unblockable nova',()=>{
 const g=duel('scribe'),e=g.enemies[0];e.timer=0;g.tick(.01);assert.equal(e.state,'windup');assert.equal(g.bolts.length,0);advance(g,.9);assert.equal(g.player.hp,120);advance(g,.5);assert(g.bolts.length<=12);assert(g.player.hp<120);
 const b=new S.Game({...S.defaultProgress(),room:2});b.start();const boss=b.enemies[0];boss.hp=539;b.tick(.01);assert.equal(boss.phase,2);assert.equal(boss.state,'recover');boss.hp=269;b.tick(.01);assert.equal(boss.phase,3);boss.state='chase';boss.step=2;boss.timer=0;b.player.z=-3;b.tick(.01);assert.equal(boss.attackKind,'nova');assert.equal(boss.state,'windup');assert(boss.windup>=1);b.player.inv=0;b.player.blocking=true;advance(b,1.25,{block:true});assert(b.player.hp<100);
});
test('an unupgraded player can defeat every boss phase using only legal movement, attacks, rolls and flasks',()=>{
 const g=new S.Game({...S.defaultProgress(),room:2});g.start();const phases=new Set();
 for(let i=0;i<72000&&g.state==='playing';i++){
  const p=g.player,e=g.enemies[0],dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);g.target=e.id;phases.add(e.phase);let input={x:dx,z:dz,angle};
  if(e.state==='windup'){input.x=dz;input.z=-dx;if(e.timer<.23&&d<e.attackRange+.7)g.action('roll',{x:-dx,z:-dz});}
  else if(d<2.7&&!p.action&&p.roll<=0&&p.stamina>=40)g.action('heavy',{angle});
  if(p.hp<65&&e.state==='recover'&&d>4)g.action('heal');
  const len=Math.hypot(input.x,input.z);if(len)for(const rot of [0,.8,-.8,1.6,-1.6,2.4,-2.4,Math.PI]){const x=(input.x*Math.cos(rot)-input.z*Math.sin(rot))/len,z=(input.x*Math.sin(rot)+input.z*Math.cos(rot))/len;if(!S.blocked(p.x+x*.5,p.z+z*.5)){input.x=x;input.z=z;break;}}
  g.tick(1/60,input);
 }
 assert.deepEqual([...phases],[1,2,3]);assert.equal(g.state,'victory');assert(g.player.hp>0);assert(g.progress.won);assert.equal(g.progress.wins,1);assert(S.validProgress(g.snapshot()));assert.equal(new S.Game(S.readProgress(JSON.stringify(g.snapshot()))).state,'victory');
});
test('separate Souls saves validate corrupt input and snapshots do not alias live progress',()=>{
 for(const raw of ['bad','null','{}',JSON.stringify({...S.defaultProgress(),room:7}),JSON.stringify({...S.defaultProgress(),runes:-1}),JSON.stringify({...S.defaultProgress(),won:true})])assert.deepEqual(S.readProgress(raw),S.defaultProgress());const g=new S.Game();const snap=g.snapshot();snap.level=8;assert.equal(g.progress.level,0);assert(S.blocked(13,0));assert(S.blocked(7,5));
});
