'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {BulkBirdState}=require('../minigames/bird-game-3.js');
test('Bird Game 3 has deterministic fair gates, three lives and increasing difficulty',()=>{
 const a=new BulkBirdState(42),b=new BulkBirdState(42);assert.deepEqual(a.gates,b.gates);assert.equal(a.lives,3);
 for(const score of [0,5,12,99]){a.score=score;a.makeGate(1000);const gate=a.gates.at(-1);assert(gate.center-gate.gap/2>35);assert(gate.center+gate.gap/2<474);}
 a.score=0;const first=a.speed;a.score=5;const second=a.speed;a.score=12;assert(first<second&&second<a.speed);
});
test('Bird Game 3 only awards a gate once, collects CSV and repairs within the life cap',()=>{
 const g=new BulkBirdState(4);g.mode='playing';g.gates=[{id:1,x:129,center:250,gap:206,passed:false,failed:false,collected:true}];g.step(1/120);assert.equal(g.score,1);g.step(1/120);assert.equal(g.score,1);
 g.csv=5;g.lives=2;g.y=250;g.vy=0;g.gates=[{id:2,x:188,center:250,gap:206,passed:false,failed:false,collected:false}];g.step(1/120);assert.equal(g.csv,6);assert.equal(g.lives,3);g.step(1/120);assert.equal(g.csv,6);
});
test('Bird Game 3 collision immunity, failed gates, pause and game over preserve valid state',()=>{
 const g=new BulkBirdState(1);g.mode='playing';const gate={id:1,x:210,center:250,gap:206,passed:false,failed:false,collected:true};g.gates=[gate];g.y=70;g.step(1/120);assert.equal(g.lives,2);assert(gate.failed);assert.equal(g.score,0);g.damage(null);assert.equal(g.lives,2);
 g.mode='paused';const state=JSON.stringify(g);g.step(1/60);g.flap();assert.equal(JSON.stringify(g),state);
 g.mode='playing';g.inv=0;g.damage(null);g.inv=0;g.damage(null);assert.equal(g.mode,'over');assert.equal(g.lives,0);const over=JSON.stringify(g);g.step(1/60);assert.equal(JSON.stringify(g),over);
});
test('Bird Game 3 is playable through all stages with ordinary timed flaps',()=>{
 const g=new BulkBirdState(55);g.mode='playing';
 for(let i=0;i<120*100&&g.mode==='playing'&&g.score<20;i++){
  const next=g.gates.find(x=>!x.passed&&x.x+84>214),target=next?.center??250;
  if(g.y>target+12&&g.vy>30||g.y>420)g.flap();
  g.step(1/120);
 }
 assert(g.score>=20,'All three difficulty stages must be survivable with the real physics');assert(g.lives>0);
});
