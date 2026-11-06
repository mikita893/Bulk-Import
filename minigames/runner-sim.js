'use strict';
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BulkRunner=api;})(typeof window!=='undefined'?window:globalThis,function(){
 const LANES=[-3,0,3],TYPES=['crate','gate','train'];
 class Game{
  constructor(seed=Date.now()){
   this.seed=seed>>>0||1;this.state='ready';this.distance=0;this.elapsed=0;this.speed=16;this.lane=1;this.x=0;this.y=0;this.vy=0;this.slide=0;this.hearts=3;this.inv=0;this.shields=0;this.magnet=0;this.boost=0;this.coins=0;this.score=0;this.nextRow=48;this.row=0;this.id=0;this.items=[];this.events=[];this.generate();
  }
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  start(){if(this.state==='ready')this.state='playing';}
  pause(){if(this.state==='playing')this.state='paused';}
  resume(){if(this.state==='paused')this.state='playing';}
  action(action){
   if(this.state!=='playing')return false;
   if(action==='left'||action==='right'){const lane=Math.max(0,Math.min(2,this.lane+(action==='left'?-1:1)));if(lane===this.lane)return false;this.lane=lane;return true;}
   if(action==='jump'&&this.y<=.001&&this.vy===0){this.vy=10.4;this.slide=0;return true;}
   if(action==='slide'){if(this.y>.001)this.vy=-18;this.slide=.85;return true;}
   return false;
  }
  add(type,lane,d,y=0){const item={id:++this.id,type,lane,d,y,taken:false};this.items.push(item);return item;}
  generate(){
   while(this.nextRow<this.distance+220){
    const d=this.nextRow,safe=Math.floor(this.random()*3),style=this.row%5;
    for(let lane=0;lane<3;lane++)if(lane!==safe){const type=style===3?'train':TYPES[(this.row+lane)%3];this.add(type,lane,d,type==='train'?1.8:0);}
    for(let k=0;k<5;k++)this.add('csv',safe,d-8+k*3,.9);
    if(style===0)this.add('csv',safe,d+5,2.2);
    if(this.row%4===2)this.add(['shield','magnet','boost'][Math.floor(this.row/4)%3],safe,d+9,1);
    this.nextRow+=22;this.row++;
   }
  }
  tick(dt){
   if(this.state!=='playing'||!Number.isFinite(dt)||dt<=0)return;
   // Small bounded steps keep swept encounters fair when rendering is slow.
   let remaining=Math.min(.25,dt);this.events=[];
   while(remaining>1e-8&&this.state==='playing'){const step=Math.min(1/120,remaining);remaining-=step;this.step(step);}
  }
  step(dt){
   this.elapsed+=dt;this.speed=Math.min(32,16+this.distance/550)+(this.boost>0?5:0);this.distance+=this.speed*dt;
   const delta=LANES[this.lane]-this.x;this.x+=Math.sign(delta)*Math.min(Math.abs(delta),22*dt);
   if(this.y>0||this.vy>0){this.y=Math.max(0,this.y+this.vy*dt);this.vy-=25*dt;if(this.y===0)this.vy=0;}
   for(const key of ['slide','inv','magnet','boost'])this[key]=Math.max(0,this[key]-dt);
   for(const item of this.items){
    if(item.taken)continue;const z=item.d-this.distance,dx=Math.abs(LANES[item.lane]-this.x),pickup=item.type==='csv'||['shield','magnet','boost'].includes(item.type);
    if(pickup){
     const magnet=item.type==='csv'&&this.magnet>0&&Math.abs(z)<7&&dx<7;
     if(magnet||Math.abs(z)<.9&&dx<.9&&Math.abs(item.y-(this.y+(this.slide>0?.55:1)))<1){
      item.taken=true;if(item.type==='csv'){this.coins++;this.events.push('coin');}else if(item.type==='shield'){this.shields=Math.min(2,this.shields+1);this.events.push('shield');}else{this[item.type]=8;this.events.push(item.type);}
     }
     continue;
    }
    const reach=item.type==='train'?5.6:1.1;
    if(Math.abs(z)>reach||dx>.9)continue;
    const safe=item.type==='crate'&&this.y>1.15||item.type==='gate'&&this.slide>0&&this.y<.25;
    if(safe||this.inv>0||this.boost>0)continue;
    item.taken=true;this.inv=1.7;
    if(this.shields>0){this.shields--;this.events.push('absorbed');}else{this.hearts--;this.events.push('hit');if(this.hearts<=0){this.state='over';this.events.push('over');}}
   }
   this.score=Math.floor(this.distance)+this.coins*25;this.items=this.items.filter(i=>!i.taken&&i.d>this.distance-14);this.generate();
  }
 }
 function readRecord(raw){try{const r=JSON.parse(raw);if(r&&r.version===1&&Number.isSafeInteger(r.score)&&r.score>=0&&r.score<1e9&&Number.isSafeInteger(r.coins)&&r.coins>=0&&r.coins<1e8)return {version:1,score:r.score,coins:r.coins};}catch(e){}return {version:1,score:0,coins:0};}
 return {Game,LANES,TYPES,readRecord};
});
