'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {createMatch, stepMatch} = require('../multiplayer/engine.cjs');
const shared = require('../multiplayer/shared.cjs');

/* Deterministic balance probes, not human win-rate measurements.
 * Both factions use the same navigation, targeting and reaction policy; only ability-specific
 * aiming/defence decisions differ as a human would need to learn each kit. Bots plan every
 * four server frames (~133 ms), aim with approximate projectile lead and see visible hazards.
 * Pickups are disabled to isolate weapons, kits and movement. Respawns and all damage,
 * collisions, cooldowns, effects and scoring are the actual authoritative game engine. */
const STEP = 1 / 30;
function roster(size, reversed=false) {
  const list=[];
  // Reverse faction processing, while preserving each team's spawn-slot assignment.
  const order=reversed?['excel','salesforce']:['salesforce','excel'];
  for (let i=0;i<size;i++) for (const team of order) list.push({id:team+i,name:team+' '+i,team});
  return list;
}
function obstacleAt(m,x,z,r=.65) {return m.obstacles.some(o=>x+r>o.x-o.w/2&&x-r<o.x+o.w/2&&z+r>o.z-o.d/2&&z-r<o.z+o.d/2)}
function danger(m,p,vx,vz,horizon=.42) {
  let score=0;
  const futureX=p.x+vx*horizon,futureZ=p.z+vz*horizon;
  if(Math.abs(futureX)>23||Math.abs(futureZ)>19)score+=250;
  if(obstacleAt(m,p.x+vx*.27,p.z+vz*.27))score+=200;
  for(const b of m.projectiles) {
    if(b.dead||b.team===p.team)continue;
    const dx=p.x-b.x,dz=p.z-b.z,dvx=vx-b.vx,dvz=vz-b.vz;
    const at=Math.max(0,Math.min(horizon,-(dx*dvx+dz*dvz)/(dvx*dvx+dvz*dvz||1)));
    const dist=Math.hypot(dx+dvx*at,dz+dvz*at);
    if(dist<1.05)score+=(1.05-dist)*75;
  }
  for(const effect of m.effects||[]) {
    if(effect.team===p.team||effect.kind!=='pivot'||effect.phase==='impact')continue;
    const at=Math.min(horizon,Math.max(0,effect.remaining));
    const dx=p.x+vx*at-effect.x,dz=p.z+vz*at-effect.z,a=effect.angle||0;
    const lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);
    if(Math.abs(lx)<effect.width/2+.6&&Math.abs(lz)<effect.depth/2+.6)score+=80;
  }
  return score;
}
function controls(m,p,target,tick,seed,plan,reactive=true) {
  const dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz)||1;
  const idx=Number(p.id.at(-1)),side=p.team==='salesforce'?-1:1;
  const desired=seed%3===0?6:seed%3===1?9:12;
  const orbit=Math.sin((tick/30)*.7+seed*.4+idx)*.7;
  const radial=(dist-desired)*.7;
  const wishX=dx/dist*radial-dz/dist*orbit*4,wishZ=dz/dist*radial+dx/dist*orbit*4;
  if(!plan||tick%4===0) {
    let best=Infinity,bx=0,bz=0;
    for(let n=-1;n<16;n++) {
      const angle=n*Math.PI*2/16,vx=n<0?0:Math.sin(angle)*8,vz=n<0?0:Math.cos(angle)*8;
      let score=Math.hypot(vx-wishX,vz-wishZ)*.8+(reactive?danger(m,p,vx,vz):0);
      for(const q of m.players)if(q.id!==p.id&&q.alive&&q.team===p.team) {
        const d=Math.hypot(p.x+vx*.3-q.x,p.z+vz*.3-q.z);if(d<2.2)score+=(2.2-d)*4;
      }
      // Tiny mirrored tie breaker prevents fixed cardinal-direction bias.
      score+=.001*Math.cos(angle*side+seed);
      if(score<best){best=score;bx=vx;bz=vz;}
    }
    plan={vx:bx,vz:bz};
  }
  const targetVel=target._botVelocity||{x:0,z:0};
  const qReady=p.abilityCooldown<=STEP&&dist<(p.team==='excel'?12:18);
  const lead=qReady?(p.team==='excel'?.65:.18+dist/30):dist/30;
  const jitter=Math.sin(tick*.095+seed*.7+idx*1.7)*.4;
  const ax=target.x+targetVel.x*lead+side*jitter,az=target.z+targetVel.z*lead+jitter;
  const incoming=danger(m,p,plan.vx,plan.vz,.25)>18;
  const lost=p.stats.maxHp+p.stats.maxShield-p.hp-p.shield;
  return {plan,input:{seq:tick,mx:plan.vx/8,mz:plan.vz/8,ax,az,fire:true,sprint:false,
    ability:qReady,secondary:p.secondaryCooldown<=STEP&&(p.team==='salesforce'?incoming||dist<10:lost>=24),
    dash:reactive&&p.dashCooldown<=STEP&&incoming,interact:false}};
}
function simulate({size=1,seed=1,reversed=false,reactive=true,seconds=60}={}) {
  const m=createMatch({mode:'versus',players:roster(size,reversed),seed});
  for(const p of m.players){p.inv=0;p.spawnProtected=false;const i=Number(p.id.at(-1));p.x=p.team==='salesforce'?-10:10;p.z=size===1?13:[-13,0,13][i];}
  for(const item of m.pickups){item.ready=false;item.timer=9999;}
  const plans=new Map(),stats={salesforce:{q:0,f:0,dash:0},excel:{q:0,f:0,dash:0}};
  let peakEffects=0,peakShots=0;
  for(let n=1;n<=seconds*30&&m.phase==='playing';n++) {
    const inputs={},before=new Map(m.players.map(p=>[p.id,{x:p.x,z:p.z,ability:p.abilityCooldown,secondary:p.secondaryCooldown,dash:p.dashCooldown}]));
    for(const p of m.players) {
      if(!p.alive)continue;
      const targets=m.players.filter(q=>q.alive&&q.team!==p.team);if(!targets.length)continue;
      const target=targets.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)||a.id.localeCompare(b.id))[0];
      const decision=controls(m,p,target,n,seed,plans.get(p.id),reactive);plans.set(p.id,decision.plan);inputs[p.id]=decision.input;
    }
    stepMatch(m,STEP,inputs);
    for(const p of m.players) {
      const old=before.get(p.id);p._botVelocity={x:(p.x-old.x)/STEP,z:(p.z-old.z)/STEP};
      if(p.abilityCooldown>old.ability+.1)stats[p.team].q++;
      if(p.secondaryCooldown>old.secondary+.1)stats[p.team].f++;
      if(p.dashCooldown>old.dash+.1)stats[p.team].dash++;
    }
    peakEffects=Math.max(peakEffects,m.effects?.length||0);peakShots=Math.max(peakShots,m.projectiles.length);
  }
  return {size,seed,reversed,reactive,scores:{...m.scores},stats,peakEffects,peakShots};
}

// Export simulation for diagnosis without changing production behaviour.
module.exports={simulate};

test('faction kits keep equal foundations and comparable mobility budgets',()=>{
  assert(shared.FACTION_KITS,'Asymmetric kits are exported');
  const a=shared.versusStats('salesforce'),b=shared.versusStats('excel');
  for(const key of ['maxHp','maxShield','damage','interval','speed','sprintSpeed','projectileSpeed','projectileLife','shieldRegen','rechargeDelay'])assert.equal(a[key],b[key],key+' stays fair');
  assert.notEqual(a.dashCooldown,b.dashCooldown);assert.notEqual(a.dashDuration*a.dashSpeed,b.dashDuration*b.dashSpeed);
  const am=a.dashDuration*a.dashSpeed/a.dashCooldown,bm=b.dashDuration*b.dashSpeed/b.dashCooldown;
  assert(Math.max(am,bm)/Math.min(am,bm)<1.12,'Sustained movement budget stays comparable');
});

test('deterministic 1v1 and 3v3 probes use both distinct kits without roster-order advantage',()=>{
  const results=[];
  for(const size of [1,3])for(const seed of [1,2,3,4,5,6])for(const reversed of [false,true])results.push(simulate({size,seed,reversed,seconds:55}));
  for(const r of results){assert(r.peakShots<=shared.LIMITS.projectiles);assert(r.peakEffects<=32);}
  const total={salesforce:0,excel:0};for(const r of results)for(const team of ['salesforce','excel'])total[team]+=r.scores[team];
  const kills=total.salesforce+total.excel;assert(kills>0,'Probes must reach real damaging engagements');
  const share=total.salesforce/kills;
  if(process.env.BULK_KIT_BALANCE_REPORT){const bySize=Object.fromEntries([1,3].map(size=>[size,results.filter(r=>r.size===size).reduce((sum,r)=>({salesforce:sum.salesforce+r.scores.salesforce,excel:sum.excel+r.scores.excel}),{salesforce:0,excel:0})]));console.log(JSON.stringify({scenarios:results.length,total,share,bySize,...(process.env.BULK_KIT_BALANCE_REPORT==='full'?{results}:{})},null,2));}
  for(let i=0;i<results.length;i+=2)assert.deepEqual(results[i].scores,results[i+1].scores,'Roster order must not change a deterministic fight');
  // A broad regression guard, not a claim that bot performance predicts human win rates.
  assert(share>=.35&&share<=.65,`Investigate faction dominance: SF=${total.salesforce}, Excel=${total.excel}`);
});
