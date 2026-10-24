'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createMatch,stepMatch,snapshotMatch,normalizeInput,setPlayerConnected}=require('../multiplayer/engine.cjs');
const {FACTION_KITS,VS_STATS,versusStats}=require('../multiplayer/shared.cjs');
const roster=[{id:'sf',team:'salesforce'},{id:'xl',team:'excel'}];
const input=(seq,values={})=>({seq,mx:0,mz:0,ax:0,az:16,fire:false,dash:false,ability:false,secondary:false,interact:false,...values});
function match(players=roster){const m=createMatch({mode:'versus',players,seed:22});for(const p of m.players){p.x=p.team==='salesforce'?-4:4;p.z=16;p.inv=0;p.spawnProtected=false;p.shieldWait=999}for(const med of m.pickups){med.ready=false;med.timer=999}return m}
function tick(m,seconds,inputs={}){for(let n=0;n<Math.ceil(seconds*30);n++)stepMatch(m,1/30,typeof inputs==='function'?inputs(n):inputs);return m}
function shootAt(m,p,damage=14,front=true){m.projectiles.push({id:'test-'+m.nextId++,x:p.x+(front?.2:-.2),z:p.z,vx:0,vz:0,damage,team:p.team==='salesforce'?'excel':'salesforce',ownerId:p.team==='salesforce'?'xl':'sf',type:'player',kind:'player',life:1,pierce:1,hits:[],dead:false});stepMatch(m,1/30,{})}
function cast(m,id,values){const p=m.players.find(p=>p.id===id);stepMatch(m,1/30,{[id]:input(p.lastSeq+1,values)})}
const total=p=>p.hp+p.shield;

test('faction kits differ in gameplay while core combat statistics and input authority stay equal',()=>{
 for(const key of ['maxHp','maxShield','damage','interval','speed','sprintSpeed','projectileSpeed','projectileLife','shieldRegen','rechargeDelay','armor'])assert.equal(versusStats('salesforce')[key],versusStats('excel')[key]);
 assert(FACTION_KITS.salesforce.ability.pierce===2);assert(FACTION_KITS.excel.ability.windup>.8);assert.notEqual(versusStats('salesforce').dashCooldown,versusStats('excel').dashCooldown);
 assert.equal(normalizeInput(input(1,{secondary:'yes'})),null);assert.equal(normalizeInput(input(1,{secondary:true,secondaryDamage:9999})).secondary,true);assert.equal(normalizeInput(input(1,{secondaryDamage:9999})).secondaryDamage,undefined);
});

test('Apex waits for its cast, pierces only two enemies and never damages its own faction',()=>{
 const players=[...roster,{id:'sf2',team:'salesforce'},{id:'xl2',team:'excel'},{id:'sf3',team:'salesforce'},{id:'xl3',team:'excel'}],m=match(players),p=m.players.find(p=>p.id==='sf');p.x=-9;
 const targets=['xl','xl2','xl3'].map(id=>m.players.find(p=>p.id===id));targets.forEach((p,i)=>p.x=-1+i*3);m.players.find(p=>p.id==='sf2').x=-5;m.players.find(p=>p.id==='sf3').z=-16;
 cast(m,'sf',{ability:true,ax:12});assert(m.effects.some(e=>e.kind==='apexCast'&&e.phase==='warning'));assert(!m.projectiles.some(b=>b.kind==='apex'));
 tick(m,.8);assert.deepEqual(targets.map(total),[150,150,180]);assert.equal(total(m.players.find(p=>p.id==='sf2')),180);
 const snapshot=snapshotMatch(m);assert.equal(snapshot.players.find(p=>p.id==='sf').abilityName,FACTION_KITS.salesforce.ability.name);
});

test('Apex cannot query through solid cover',()=>{
 const m=match(),[sf,xl]=m.players;sf.x=-6;xl.x=6;sf.z=xl.z=0;cast(m,'sf',{ability:true,ax:6,az:0});tick(m,1);assert.equal(total(xl),180);assert(!m.projectiles.some(p=>p.kind==='apex'));
});

test('Apex adds its full 30 damage alongside held gunfire and respects actual dash invulnerability',()=>{
 function damage(useQ){const m=match(),[sf,xl]=m.players;sf.x=-4;xl.x=4;tick(m,.9,n=>({sf:input(n,{fire:true,ability:useQ&&n===0,ax:4})}));return 180-total(xl)}
 assert.equal(damage(true)-damage(false),30,'Special damage neither consumes nor extends ordinary hit throttling');
 const m=match(),[sf,xl]=m.players;sf.x=-1;xl.x=1;xl.inv=2;cast(m,'sf',{ability:true,ax:1});tick(m,.8);assert.equal(total(xl),180);
});

test('Pivot table is a delayed, bounded ground rectangle and can be escaped with a dash',()=>{
 const m=match(),[sf,xl]=m.players;cast(m,'xl',{ability:true,ax:sf.x});const fx=m.effects.find(e=>e.kind==='pivot');assert(fx&&fx.width===6&&fx.depth===5);assert.equal(total(sf),180);tick(m,.75);assert.equal(total(sf),180);tick(m,.15);assert.equal(total(sf),152);assert(sf.slowRemaining>0);assert(m.effects.some(e=>e.kind==='pivot'&&e.phase==='impact'));
 const escape=match();cast(escape,'xl',{ability:true,ax:-4});tick(escape,.65);cast(escape,'sf',{dash:true,mz:-1,ax:4});tick(escape,.4);assert.equal(total(escape.players[0]),180);assert.equal(escape.players[0].slowRemaining,0);
});

test('Pivot target is range-limited and both cast targeting and impact respect cover',()=>{
 const m=match(),[sf,xl]=m.players;xl.x=0;sf.x=20;cast(m,'xl',{ability:true,ax:100});const fx=m.effects.find(e=>e.kind==='pivot');assert(Math.hypot(fx.x-xl.x,fx.z-xl.z)<=12.00001);tick(m,1);assert.equal(total(sf),180);
 const wall=match(),a=wall.players[0],b=wall.players[1];a.x=1;b.x=-4;wall.obstacles=[{x:0,z:16,w:.5,d:8}];cast(wall,'xl',{ability:true,ax:1});const stopped=wall.effects.find(e=>e.kind==='pivot');assert(stopped.x<0);assert(Math.abs(a.x-stopped.x)<2.5,'Target would be in the rectangle without the wall');tick(wall,1);assert.equal(total(a),180,'Ground damage may not leak through the wall');
});

test('Permission Set has a finite frontal budget, fixed direction and no rear coverage',()=>{
 const m=match(),[sf]=m.players;cast(m,'sf',{secondary:true,ax:4});assert(sf.barrierRemaining>2);const direction=sf.barrierAngle;cast(m,'sf',{ax:-20});assert.equal(sf.barrierAngle,direction,'Barrier never auto-tracks the latest aim');
 for(let i=0;i<3;i++)shootAt(m,sf,14,true);assert.equal(total(sf),180);assert.equal(sf.barrierHp,0);shootAt(m,sf,14,true);assert.equal(total(sf),166);
 const flank=match(),p=flank.players[0];cast(flank,'sf',{secondary:true,ax:4});shootAt(flank,p,14,false);assert.equal(total(p),166);assert.equal(p.barrierHp,42);
});

test('Pivot is the explicit ground counter to frontal Permission Set and does not friendly-fire',()=>{
 const m=match(),[sf,xl]=m.players;cast(m,'sf',{secondary:true,ax:4});cast(m,'xl',{ability:true,ax:-4});tick(m,1);assert.equal(total(sf),152);assert.equal(sf.barrierHp,42);assert.equal(total(xl),180);
});

test('Ctrl+Z only restores bounded recent real loss and keeps old wounds',()=>{
 const m=match(),p=m.players[1];p.hp=100;p.shield=10;shootAt(m,p,30);assert.equal(total(p),80);tick(m,.1);const before=total(p);cast(m,'xl',{secondary:true,ax:-4});assert(p.undoPending>0);assert.equal(total(p),before);tick(m,.3);assert.equal(total(p)-before,28);assert.equal(p.hp,100);assert.equal(p.shield,8);assert(p.rewindFlash>0);assert(p.secondaryCooldown>11);
 const empty=match(),wounded=empty.players[1];wounded.hp=80;wounded.shield=0;cast(empty,'xl',{secondary:true});tick(empty,.4);assert.equal(total(wounded),80);assert.equal(wounded.secondaryCooldown,0,'No old damage means no refund and no wasted charge');
});

test('Ctrl+Z cannot reuse damage already removed by a medkit or turn old missing health into shields',()=>{
 const m=match(),p=m.players[1];p.hp=60;p.shield=0;shootAt(m,p,14);const med=m.pickups[0];med.x=p.x;med.z=p.z;med.ready=true;stepMatch(m,1/30,{});assert.equal(p.hp,81);cast(m,'xl',{secondary:true});tick(m,.3);assert.equal(p.hp,81);assert.equal(p.shield,0);
 const split=match(),q=split.players[1];q.hp=120;q.shield=10;shootAt(split,q,20);const pickup=split.pickups[0];pickup.x=q.x;pickup.z=q.z;pickup.ready=true;stepMatch(split,1/30,{});assert.equal(q.hp,140);cast(split,'xl',{secondary:true});tick(split,.3);assert.equal(q.hp,140);assert.equal(q.shield,10,'Only the ten actually lost shield points can return');
});

test('Ctrl+Z expires old history and cannot resurrect a dead caster',()=>{
 const expired=match(),p=expired.players[1];shootAt(expired,p,20);tick(expired,2.2);const before=total(p);cast(expired,'xl',{secondary:true});tick(expired,.3);assert.equal(total(p),before);assert.equal(p.secondaryCooldown,0);
 const dead=match(),q=dead.players[1];q.hp=24;q.shield=0;shootAt(dead,q,14);tick(dead,.11);cast(dead,'xl',{secondary:true});shootAt(dead,q,14);tick(dead,.4);assert.equal(q.alive,false);assert.equal(q.hp,0);assert.equal(q.undoPending,0);assert.equal(q.rewindFlash,0);
});

test('F and Q cannot be retriggered with repeated input sequences or client-supplied stats',()=>{
 const m=match(),p=m.players[0];cast(m,'sf',{secondary:true,ability:true,ax:4});const seq=p.lastSeq;tick(m,13,{sf:input(seq,{secondary:true,ability:true,ax:4,damage:999})});assert.equal(p.secondaryCooldown,0);assert.equal(p.barrierRemaining,0);assert.equal(m.effects.length,0);assert.equal(p.stats.damage,14);
});

test('Disconnect cancels defensive state without refreshing its cooldown; snapshots are detached',()=>{
 const m=match(),p=m.players[0];cast(m,'sf',{secondary:true,ax:4});const cooldown=p.secondaryCooldown;setPlayerConnected(m,'sf',false);assert.equal(p.barrierHp,0);assert.equal(p.barrierRemaining,0);assert.equal(p.secondaryCooldown,cooldown);setPlayerConnected(m,'sf',true);assert.equal(p.secondaryCooldown,cooldown);
 const s=snapshotMatch(m);s.players[0].barrierHp=999;s.effects.push({id:'spoof'});assert.equal(p.barrierHp,0);assert(!m.effects.some(e=>e.id==='spoof'));
});
