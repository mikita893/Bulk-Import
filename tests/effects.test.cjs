'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{Effects}=require('../audio/effects.js');
function fixture(){const gains=[],nodes=[];let closed=false;const context={sampleRate:1000,currentTime:0,destination:{},resume:()=>Promise.resolve(),close(){closed=true;},createBuffer:()=>({getChannelData:()=>new Float32Array(250)}),createGain(){const g={gain:{setValueAtTime(v){g.value=v;},exponentialRampToValueAtTime(){}},connect(){return this;},disconnect(){}};gains.push(g);return g;},createOscillator(){return this.source();},createBufferSource(){return this.source();},source(){const n={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;},start(){},stop(){this.onended?.();},disconnect(){}};nodes.push(n);return n;}};return {context,gains,nodes,isClosed:()=>closed};}
test('weapon, damage and upgrade effects schedule distinct bounded layers; master mute and voice ducking work',()=>{
 const f=fixture(),fx=new Effects({contextFactory:()=>f.context});assert(fx.play('shot'));assert.equal(fx.counts.shot,1);assert.equal(f.nodes.length,3);fx.play('upgrade');assert.equal(f.nodes.length,8);assert.equal(fx.counts.upgrade,1);
 const normal=f.gains[0].value;fx.duck=()=>true;fx.play('shot');assert(Math.abs(f.gains[8].value-normal*.25)<1e-9);fx.enabled=()=>false;assert(!fx.play('shot'));assert.equal(fx.counts.shot,2);fx.destroy();assert(f.isClosed());assert.equal(fx.active.size,0);
});
test('repeated firing never retains unbounded live sources; stop/teardown releases active effects',()=>{
 const f=fixture();f.context.source=function(){const n={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;},start(){},stop(){},disconnect(){}};return n;};
 const fx=new Effects({contextFactory:()=>f.context});for(let i=0;i<100;i++)fx.play('shot');assert(fx.active.size<=32);fx.stop();assert.equal(fx.active.size,0);fx.destroy();assert(!fx.play('shot'));
});
