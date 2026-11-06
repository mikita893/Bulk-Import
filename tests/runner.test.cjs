'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {Game,LANES,GOAL,CHECKPOINT,readRecord}=require('../minigames/runner-sim.js');
function fixture(type,lane=1){const g=new Game(7);g.items=[];g.nextRow=1e8;g.start();const item=g.add(type,lane,12,['csv','shield','magnet','boost'].includes(type)?1:0);return {g,item};}
function run(g,seconds,dt=1/120){for(let i=0;i<seconds/dt;i++)g.tick(dt);}
test('three lanes clamp input; jump and slide have separate physical clearance',()=>{
 const g=new Game(1);assert(!g.action('left'));g.start();g.action('left');g.action('left');assert.equal(g.lane,0);run(g,.3);assert.equal(g.x,-3);g.action('jump');assert(!g.action('jump'));run(g,.25);assert(g.y>1.15);g.action('slide');run(g,.2);assert.equal(g.y,0);assert(g.slide>0);
});
test('standing hits crates/gates, while a well-timed jump or slide avoids their actual collision',()=>{
 for(const type of ['crate','gate']){const {g}=fixture(type);run(g,1);assert.equal(g.hearts,2);}
 const a=fixture('crate').g;run(a,.35);a.action('jump');run(a,.6);assert.equal(a.hearts,3);
 const b=fixture('gate').g;run(b,.35);b.action('slide');run(b,.6);assert.equal(b.hearts,3);
});
test('trains require a lane change; protection is finite and three distinct hits end the run',()=>{
 const {g}=fixture('train');g.action('right');run(g,1.3);assert.equal(g.hearts,3);
 const h=fixture('train').g;h.shields=1;run(h,1);assert.equal(h.shields,0);assert.equal(h.hearts,3);assert(h.inv>0);
 const k=fixture('crate').g;for(let i=0;i<3;i++){k.inv=0;k.items=[];k.add('train',1,k.distance+2);run(k,.1);}assert.equal(k.state,'over');assert.equal(k.hearts,0);
 const d=k.distance;k.tick(.1);assert.equal(k.distance,d);
});
test('CSV height, magnet, shield and ZIPsert are real bounded pickups',()=>{
 const {g,item}=fixture('csv');item.y=3;run(g,1);assert.equal(g.coins,0);
 const m=fixture('csv',0).g;m.magnet=8;run(m,1);assert.equal(m.coins,1);assert(m.magnet<8);
 const s=fixture('shield').g;run(s,1);assert.equal(s.shields,1);
 const b=fixture('boost').g;run(b,1);assert(b.boost>7);assert(b.speed>20);b.add('train',1,b.distance+1);run(b,.1);assert.equal(b.hearts,3);
});
test('pause freezes physics and all power clocks; coarse frames do not tunnel through obstacles',()=>{
 const {g}=fixture('train');g.magnet=5;g.pause();const before=JSON.stringify(g);g.tick(20);assert.equal(JSON.stringify(g),before);g.resume();g.tick(.25);g.tick(.25);assert.equal(g.hearts,2);assert(g.magnet<5);
 for(const dt of [1/120,1/60,.1]){const x=fixture('crate').g;run(x,1,dt);assert.equal(x.hearts,2);}
});
test('seeded tracks stay bounded and always offer a traversable clear lane, even at maximum speed',()=>{
 for(const seed of [1,7,999]){const g=new Game(seed);g.start();for(let i=0;i<30000;i++){
  const obstacles=g.items.filter(x=>['train','crate','gate'].includes(x.type)&&x.d+6>g.distance).sort((a,b)=>a.d-b.d);if(obstacles.length){const d=obstacles[0].d,blocked=new Set(obstacles.filter(x=>x.d===d).map(x=>x.lane));const safe=[0,1,2].find(l=>!blocked.has(l));assert(safe!==undefined);g.lane=safe;}
  g.tick(1/120);assert(g.items.length<100);assert(g.speed<=37);if(g.state==='over')throw Error('Generated clear-lane route was impossible');
 }assert(g.distance>4000);assert(g.coins>100);}
 const a=new Game(42),b=new Game(42);assert.deepEqual(a.items,b.items);
});
test('record parsing rejects corrupt data without touching other game saves',()=>{
 assert.deepEqual(readRecord('{"version":1,"score":123,"coins":5}'),{version:1,score:123,coins:5,bestDistance:0,checkpoint:0,completed:false});for(const raw of ['bad','{}','{"version":1,"score":-1,"coins":0}','{"version":1,"score":1,"coins":"2"}'])assert.equal(readRecord(raw).score,0);
});
test('the complete 30 km route is physically traversable, finishes once and stops generating obstacles at the finish',()=>{
 for(const seed of [12,847]){const g=new Game(seed);g.start();let checkpoints=0,wins=0;
  for(let frame=0;frame<140000&&g.state==='playing';frame++){
   const obstacles=g.items.filter(x=>['train','crate','gate'].includes(x.type)&&x.d+6>g.distance).sort((a,b)=>a.d-b.d);
   if(obstacles.length){const d=obstacles[0].d,blocked=new Set(obstacles.filter(x=>x.d===d).map(x=>x.lane));g.lane=[0,1,2].find(l=>!blocked.has(l));}
   g.tick(1/120);checkpoints+=g.events.filter(e=>e==='checkpoint').length;wins+=g.events.filter(e=>e==='won').length;assert(g.items.length<100);
  }
  assert.equal(g.state,'won');assert.equal(g.distance,GOAL);assert.equal(checkpoints,5);assert.equal(wins,1);assert(g.hearts>0);const before=JSON.stringify(g);g.tick(10);assert.equal(JSON.stringify(g),before);
 }
});
test('checkpoints restore health, can resume after reload, and medkits are finite pickups',()=>{
 const g=new Game(9,10000);assert.equal(g.distance,10000);g.start();g.hearts=1;g.distance=14999;g.items=[];g.nextRow=1e8;g.tick(.1);assert.equal(g.checkpoint,15000);assert.equal(g.hearts,3);assert(g.events.includes('checkpoint'));assert.equal(CHECKPOINT,5000);
 g.hearts=1;g.add('medkit',g.lane,g.distance+1,1);g.tick(.1);assert.equal(g.hearts,2);g.tick(.1);assert.equal(g.hearts,2);
 for(const start of [-5000,123,30000,Infinity])assert.equal(new Game(1,start).distance,0);
});
test('old high scores cannot unlock Souls, and new completion requires the full distance',()=>{
 const parse=r=>readRecord(JSON.stringify({version:1,score:999999,coins:50,...r}));assert.equal(parse({}).completed,false);assert.equal(parse({completed:true,bestDistance:29999}).completed,false);assert.equal(parse({completed:true,bestDistance:30000}).completed,true);assert.equal(parse({checkpoint:25000,bestDistance:24000}).checkpoint,0);assert.equal(parse({checkpoint:15000,bestDistance:16000}).checkpoint,15000);
});
test('all Gwintforce cards map to actual painted human/alien/creature portraits',()=>{
 const cards=require('../minigames/cards-sim.js').CARD_CATALOG,art=require('../minigames/cards-art.js');for(const id of Object.keys(cards)){assert(Number.isInteger(art.tiles[id]));assert(art.tiles[id]>=0&&art.tiles[id]<16);assert(art.markup(id).includes('data-card-art="'+id+'"'));}assert(require('node:fs').statSync(require('node:path').join(__dirname,'../assets/cards/portraits.webp')).size>50000);
});
