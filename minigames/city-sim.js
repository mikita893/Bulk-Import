'use strict';
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BulkCity=api;})(typeof window!=='undefined'?window:globalThis,function(){
 const PAD={x:0,z:80},PICKUP={x:0,z:-96},LIMIT=124;
 const TARGETS=[{x:-60,z:-60,h:20,name:'Wieża Duplikatów'},{x:60,z:-20,h:28,name:'Excel Plaza'},{x:60,z:60,h:18,name:'Biuro Ręcznego Merge'},{x:-60,z:60,h:14,name:'Archiwum Final_FINAL'}];
 const BUILDINGS=[];
 for(let x=-100;x<=100;x+=40)for(let z=-100;z<=100;z+=40){const target=TARGETS.find(t=>t.x===x&&t.z===z);BUILDINGS.push({x,z,w:25,d:25,h:target?.h||9+((x+100)*7+(z+100)*13)%25});}
 const RADIO=['„Vice Import FM. Korki na produkcji. Na sandboxie płynnie.”','„Excel zgłosił kradzież danych. To był eksport do CSV.”','„Policja pyta o uprawnienia. Powiedz: System Administrator.”','„Wirnik kręci się szybciej niż konsultant nalicza godziny.”','„Nie jedź pod prąd. Chyba że to migracja z Legacy.”','„Dziś 30 stopni i 100% szans na duplikaty.”'];
 function fresh(){return {version:1,stage:0,delivered:[false,false,false,false],cash:0,wins:0,deaths:0,bestTime:0};}
 function valid(p){return !!p&&p.version===1&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=2&&Array.isArray(p.delivered)&&p.delivered.length===4&&p.delivered.every(x=>typeof x==='boolean')&&['cash','wins','deaths','bestTime'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0&&p[k]<1e9)&&(!(p.stage===0)||p.delivered.every(x=>!x))&&(!(p.stage===2)||p.delivered.every(Boolean)&&p.wins>0);}
 function read(raw){try{const p=JSON.parse(raw);if(valid(p))return JSON.parse(JSON.stringify(p));}catch(e){}return fresh();}
 function blocked(x,z,y=0,r=.5){return Math.abs(x)>LIMIT-r||Math.abs(z)>LIMIT-r||BUILDINGS.some(b=>y<b.h+1.6&&Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}
 function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function trafficAt(i,time){const size=[40,80,120][i%3],edge=size*2,perimeter=edge*4;let distance=(i*83+time*(9+i%4))%perimeter;const points=[[-size,-size],[size,-size],[size,size],[-size,size],[-size,-size]];const side=Math.floor(distance/edge),t=(distance%edge)/edge,a=points[side],b=points[side+1];return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,angle:Math.atan2(b[0]-a[0],b[1]-a[1])};}
 class Game{
  constructor(progress=fresh()){
   this.progress=valid(progress)?JSON.parse(JSON.stringify(progress)):fresh();this.state=this.progress.stage===2?'victory':'ready';this.time=0;this.events=[];this.eventId=0;this.radioAt=20;this.radioIndex=0;this.resetActors();
  }
  resetActors(){
   const flight=this.progress.stage>0;this.player={x:flight?-5:3,z:flight?84:104,y:0,angle:Math.PI,hp:100};this.car={x:flight?-8:0,z:flight?88:100,y:0,angle:Math.PI,speed:0,hp:100,nitro:100};this.heli={x:PAD.x,z:PAD.z,y:1.6,angle:Math.PI,vx:0,vz:0,vy:0,hp:100};this.mode='foot';this.cargo=false;this.heat=0;this.inv=0;this.drop=null;this.cops=[];this.traffic=Array.from({length:12},(_,i)=>trafficAt(i,this.time));this.drones=Array.from({length:3},(_,i)=>({x:0,z:0,y:35,warning:null,cooldown:5+i*1.4}));this.flightStarted=false;this.flightTime=240;this.flightElapsed=0;this.landing=0;this.phase=this.progress.stage===2?'free':flight?(this.progress.delivered.every(Boolean)?'return':'air'):'pickup';this.message=flight?'Helikopter czeka na lądowisku. Podejdź i naciśnij E.':'Billy Bulk: „Ukradłem tylko rekordy, nie relacje między nimi”. Podejdź do auta i użyj E.';
  }
  actor(){return this.mode==='car'?this.car:this.mode==='heli'?this.heli:this.player;}
  emit(type,x=this.actor().x,z=this.actor().z){this.events.push({id:++this.eventId,type,x,z});}
  start(){if(this.state==='ready'||this.state==='briefing')this.state='playing';}
  pause(){if(this.state==='playing')this.state='paused';}
  resume(){if(this.state==='paused')this.state='playing';}
  retry(){if(this.state!=='failed')return false;this.resetActors();this.state='playing';return true;}
  freeRide(){if(this.state!=='victory')return false;this.resetActors();this.state='playing';this.phase='free';this.message='Miasto jest twoje. Samochód, helikopter i zero obowiązkowych statusów w Jirze.';return true;}
  objective(){
   if(this.phase==='pickup')return {...PICKUP,h:0,text:'Wsiądź do auta (E) i odbierz CSV przy żółtym znaczniku.'};
   if(this.phase==='delivery')return {...PAD,h:0,text:'Dostarcz CSV na lądowisko. Zwolnij do mniej niż 25 km/h.'};
   if(this.phase==='free')return {...PAD,h:0,text:'Swobodna jazda. E: pojazd · helikopter czeka na lądowisku.'};
   if(this.phase==='return')return {...PAD,h:0,text:'Wróć na lądowisko. Opuść helikopter (X) i zatrzymaj się.'};
   const p=this.actor(),target=TARGETS.map((t,i)=>({...t,i})).filter(t=>!this.progress.delivered[t.i]).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
   return {...target,text:this.mode==='heli'?'Wykonaj 4 zrzuty DELETE (F). Nad dachem: 3–14 m, prędkość < 36 km/h.':'Wsiądź do helikoptera (E). Spacja: wzlot · X: opadanie · WASD: lot · F: zrzut.'};
  }
  action(kind){
   if(this.state!=='playing')return false;
   if(kind==='interact'){
    if(this.mode==='car'){
     if(Math.abs(this.car.speed)>4){this.message='Najpierw zatrzymaj auto. Dane już i tak lecą bez walidacji.';return false;}
     const a=this.car;this.player.x=a.x+3;this.player.z=a.z;if(blocked(this.player.x,this.player.z))this.player.x=a.x-3;this.mode='foot';this.emit('door');return true;
    }
    if(this.mode==='heli'){
     if(this.heli.y>2.3||Math.hypot(this.heli.x-PAD.x,this.heli.z-PAD.z)>9){this.message='Najpierw wyląduj na bazie. Spadochron nie obejmuje darmowego planu.';return false;}
     this.player.x=this.heli.x-5;this.player.z=this.heli.z;this.mode='foot';this.emit('door');return true;
    }
    if(this.progress.stage>0&&Math.hypot(this.player.x-this.heli.x,this.player.z-this.heli.z)<7){this.mode='heli';if(this.phase!=='free'){this.flightStarted=true;this.heat=3;}this.message='Demolka duplikatów. Wznieś się nad budynki (spacja), wykonaj cztery zrzuty (F), wróć i wyląduj (X).';this.emit('rotor');return true;}
    if(Math.hypot(this.player.x-this.car.x,this.player.z-this.car.z)<5){this.mode='car';this.message='WASD: gaz i kierownica · spacja: hamulec ręczny · Shift: Bulk Boost · E: wysiądź.';this.emit('door');return true;}
    this.message='Podejdź do samochodu albo odblokowanego helikoptera i użyj E.';return false;
   }
   if(kind==='drop'){
    if(this.mode==='car'){this.emit('horn');this.message='„BEEP BEEP. To nie korek, to kolejka asynchroniczna”.';return true;}
    if(this.mode!=='heli'||this.phase!=='air'||this.drop)return false;
    const h=this.heli,index=TARGETS.findIndex((t,i)=>!this.progress.delivered[i]&&Math.hypot(h.x-t.x,h.z-t.z)<6&&h.y-t.h>=3&&h.y-t.h<=14);
    if(index<0||Math.hypot(h.vx,h.vz)>10){this.message='Zawiś nad różowym celem: 3–14 m nad dachem i prędkość poniżej 36 km/h. Puść WASD, aby wyhamować.';return false;}
    this.drop={target:index,x:h.x,z:h.z,y:h.y-1,vy:0};this.emit('drop');return true;
   }
   return false;
  }
  hurt(damage,reason){
   if(this.inv>0||this.state!=='playing')return false;const a=this.actor();a.hp=Math.max(0,a.hp-damage);this.inv=1;this.emit('hit');this.message=reason;
   if(a.hp===0){this.progress.deaths++;this.state='failed';this.message='POJAZD ZARCHIWIZOWANY. Checkpoint misji i wykonane zrzuty są bezpieczne.';this.drop=null;this.emit('failed');}return true;
  }
  tick(dt,input={}){
   if(this.state!=='playing'||!Number.isFinite(dt)||dt<=0)return;this.events=[];let remaining=Math.min(.25,dt);
   while(remaining>1e-8&&this.state==='playing'){const step=Math.min(1/120,remaining);remaining-=step;this.step(step,input);}
  }
  step(dt,input){
   this.time+=dt;this.inv=Math.max(0,this.inv-dt);const x=clamp(Number.isFinite(input.x)?input.x:0,-1,1),z=clamp(Number.isFinite(input.z)?input.z:0,-1,1),a=this.actor();
   if(this.mode==='foot'){
    const len=Math.hypot(x,z)||1,speed=input.boost?9:5.5,dx=x/len*speed*dt,dz=z/len*speed*dt;if(!blocked(a.x+dx,a.z,0,.5))a.x+=dx;if(!blocked(a.x,a.z+dz,0,.5))a.z+=dz;if(x||z)a.angle=Math.atan2(x,z);
   }else if(this.mode==='car'){
    const throttle=-z,boost=input.boost&&throttle>0&&a.nitro>0;a.boosting=!!boost;a.nitro=clamp(a.nitro+(boost?-24:10)*dt,0,100);
    a.speed+=throttle*(throttle*a.speed<0?38:boost?42:26)*dt;if(!throttle)a.speed*=Math.exp(-1.15*dt);if(input.up)a.speed*=Math.exp(-7*dt);a.speed=clamp(a.speed,-12,boost?42:30);
    a.angle-=x*2.1*Math.min(1,Math.abs(a.speed)/8)*Math.sign(a.speed||1)*dt;const nx=a.x+Math.sin(a.angle)*a.speed*dt,nz=a.z+Math.cos(a.angle)*a.speed*dt;
    if(!blocked(nx,nz,0,1.7)){a.x=nx;a.z=nz;}else{if(Math.abs(a.speed)>6)this.hurt(Math.min(24,Math.abs(a.speed)*.65),'Ściana ma Validation Rule. Twoje auto właśnie nie przeszło walidacji.');a.speed*=-.18;}
   }else{
    const len=Math.max(1,Math.hypot(x,z)),blend=1-Math.exp(-dt*3.2);a.vx+=(x/len*22-a.vx)*blend;a.vz+=(z/len*22-a.vz)*blend;const vertical=(input.up?1:0)-(input.down?1:0);a.vy+=(vertical*12-a.vy)*(1-Math.exp(-dt*4));
    const nx=a.x+a.vx*dt,nz=a.z+a.vz*dt,ny=clamp(a.y+a.vy*dt,1.6,55);
    if(!blocked(nx,nz,ny,2.1)){a.x=nx;a.z=nz;a.y=ny;}else{this.hurt(20,'Kolizja! Wznieś się nad dachy (spacja). Helikopter nie obsługuje przenikania danych.');a.vx*=-.2;a.vz*=-.2;a.vy=Math.max(0,a.vy);}
    if(Math.hypot(a.vx,a.vz)>.5)a.angle+=angleDiff(Math.atan2(a.vx,a.vz),a.angle)*(1-Math.exp(-dt*4));
   }
   if(this.state!=='playing')return;
   for(let i=0;i<this.traffic.length;i++)Object.assign(this.traffic[i],trafficAt(i,this.time));
   if(this.mode==='car'||this.mode==='foot')for(const car of this.traffic)if(Math.hypot(car.x-a.x,car.z-a.z)<(this.mode==='car'?3:2.1))this.hurt(this.mode==='car'?9:12,'Kolizja w ruchu ulicznym. Następnym razem użyj kierunkowskazu, nie IFERROR.');
   if(this.state!=='playing')return;
   if(this.mode==='car'&&this.phase==='pickup'&&Math.hypot(a.x-PICKUP.x,a.z-PICKUP.z)<7){this.cargo=true;this.phase='delivery';this.heat=2;this.cops=[{x:0,z:-60,angle:Math.PI,path:[]},{x:-40,z:-80,angle:0,path:[]}];this.message='CSV przejęte. Audyt ruszył w pościg! Wracaj na lądowisko i zahamuj.';this.emit('pickup');}
   if(this.mode==='car'&&this.phase==='delivery'&&Math.hypot(a.x-PAD.x,a.z-PAD.z)<10&&Math.abs(a.speed)<7){this.progress.stage=1;this.progress.cash+=500;this.resetActors();this.state='briefing';this.message='MISJA UKOŃCZONA +500 CR. Czas na helikopter. Cztery dachy. Cztery ładunki DELETE. Jeden paniczny admin.';this.emit('checkpoint');return;}
   this.updateCops(dt);this.updateDrones(dt);
   if(this.state!=='playing')return;
   if(this.flightStarted&&this.phase!=='free'){
    this.flightTime=Math.max(0,this.flightTime-dt);this.flightElapsed+=dt;if(this.flightTime===0){this.hurt(1000,'Czas misji minął.');if(this.state==='playing'){this.inv=0;this.hurt(1000,'Czas misji minął.');}return;}
   }
   if(this.drop){const d=this.drop;d.vy+=14*dt;d.y-=d.vy*dt;if(d.y<=TARGETS[d.target].h+.3){this.progress.delivered[d.target]=true;this.progress.cash+=1000;this.flightTime=Math.min(240,this.flightTime+20);this.message='DELETE na '+TARGETS[d.target].name+'. Duplikaty usunięte, ręczny merge odwołany. +1000 CR / +20 s';this.emit('delivery',d.x,d.z);this.drop=null;if(this.progress.delivered.every(Boolean)){this.phase='return';this.message='Cztery dachy czyste. Wracaj na lądowisko i wyląduj (X). Nie zgub śmigła w ostatnim wierszu.';}}}
   if(this.mode==='heli'&&this.phase==='return'){
    if(Math.hypot(a.x-PAD.x,a.z-PAD.z)<8&&a.y<2.2&&Math.hypot(a.vx,a.vz)<3)this.landing+=dt;else this.landing=0;
    if(this.landing>1.2){this.progress.stage=2;this.progress.wins++;this.progress.cash+=2500;const result=Math.ceil(this.flightElapsed);if(!this.progress.bestTime||result<this.progress.bestTime)this.progress.bestTime=result;this.state='victory';this.heat=0;this.message='MISJA ZALICZONA. Vice Import uratowane przed duplikatami. Helikopter w całości, Excel w kawałkach.';this.emit('victory');}
   }
   if(this.state==='playing'&&this.time>=this.radioAt){this.radioAt=this.time+22;this.message=RADIO[this.radioIndex++%RADIO.length];}
  }
  updateCops(dt){
   if(!this.heat||this.mode==='heli')return;const p=this.actor();
   for(const c of this.cops){
    if(!c.path.length){let x=clamp(Math.round(c.x/40)*40,-120,120),z=clamp(Math.round(c.z/40)*40,-120,120);const tx=clamp(Math.round(p.x/40)*40,-120,120),tz=clamp(Math.round(p.z/40)*40,-120,120);c.path.push({x,z});while(x!==tx){x+=Math.sign(tx-x)*40;c.path.push({x,z});}while(z!==tz){z+=Math.sign(tz-z)*40;c.path.push({x,z});}c.path.push({x:p.x,z:p.z});}
    const next=c.path[0],dx=next.x-c.x,dz=next.z-c.z,d=Math.hypot(dx,dz);if(d<1.2)c.path.shift();else{c.angle=Math.atan2(dx,dz);const nx=c.x+dx/d*16*dt,nz=c.z+dz/d*16*dt;if(!blocked(nx,nz,0,1.6)){c.x=nx;c.z=nz;}else c.path=[];}
    if(Math.hypot(c.x-p.x,c.z-p.z)<3)this.hurt(8,'Audyt chce dokumenty pojazdu. Oddal się, zanim poprosi o licencję Enterprise.');
   }
  }
  updateDrones(dt){
   for(let i=0;i<this.drones.length;i++){const d=this.drones[i],t=TARGETS[i],angle=this.time*.14+i;d.x=t.x+Math.cos(angle)*18;d.z=t.z+Math.sin(angle)*18;d.y=t.h+13;
    if(this.mode!=='heli'||this.phase==='free'){d.warning=null;continue;}const h=this.heli;
    if(d.warning){d.warning.time-=dt;if(d.warning.time<=0){const w=d.warning;if(Math.hypot(h.x-w.x,h.y-w.y,h.z-w.z)<6)this.hurt(10,'Dron audytu trafił. Odleć z czerwonego pola, gdy skaner namierza helikopter.');this.emit('pulse',w.x,w.z);d.warning=null;d.cooldown=4.5;}}
    else{d.cooldown-=dt;if(d.cooldown<=0&&h.y>6&&Math.hypot(h.x-d.x,h.z-d.z)<65){d.warning={x:h.x,y:h.y,z:h.z,time:1.4};this.emit('warning');}}
   }
  }
  snapshot(){return JSON.parse(JSON.stringify(this.progress));}
 }
 return {Game,PAD,PICKUP,TARGETS,BUILDINGS,RADIO,LIMIT,fresh,valid,read,blocked,trafficAt,angleDiff};
});
