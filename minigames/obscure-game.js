'use strict';
// A self-contained turn-based expedition; only cleared encounters are persisted.
class BulkObscureGame {
 constructor(host,storage,onExit,effects){
  this.host=host;this.storage=storage;this.onExit=onExit;this.effects=effects;this.stage=0;this.dead=false;this.paused=false;
  try{const p=JSON.parse(storage.getItem('bulk-import-cellule-v1'));if(p?.version===1&&Number.isInteger(p.stage)&&p.stage>=0&&p.stage<=3)this.stage=p.stage;}catch(e){}
  this.names=['Strażnik Pustej Komórki','Duplikat w Złotej Masce','Malarka Formuł · Madame #REF!'];
  host.innerHTML='<section class="obscure"><header><small>POZA BARIERĄ LEGACY</small><h1>Cellule Obscure</h1><h2>Expédition #REF!</h2><p>Każdej nocy Malarka usuwa jeden wiersz świata. Wasza ekspedycja nie ma zamiaru zostać pustą komórką.</p></header><canvas width="1000" height="420" aria-label="Ekspedycja przed monolitem pośród złotych ruin"></canvas><div class="ob-status" role="status"></div><div class="ob-timing"><i></i><b></b></div><nav></nav><footer><button data-ob="pause">Pauza / wznów</button><button data-ob="exit">Wróć do Importic</button></footer></section>';
  this.canvas=host.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.status=host.querySelector('.ob-status');this.nav=host.querySelector('nav');this.bar=host.querySelector('.ob-timing');
  this.click=e=>{const b=e.target.closest('[data-ob]');if(b)this.action(b.dataset.ob);};host.addEventListener('click',this.click);
  this.key=e=>{if(e.repeat)return;if(e.code==='Space'){e.preventDefault();this.action('parry');}if(e.code==='KeyP')this.action('pause');};window.addEventListener('keydown',this.key);
  this.blur=()=>{this.paused=true;this.ui();};window.addEventListener('blur',this.blur);this.hidden=()=>{if(document.hidden)this.blur();};document.addEventListener('visibilitychange',this.hidden);
  this.reset();this.last=performance.now();this.frame=this.frame.bind(this);this.raf=requestAnimationFrame(this.frame);
 }
 reset(){this.hp=150;this.ap=3;this.potions=3;this.turn=0;this.enemyMax=120+this.stage*65;this.enemy=this.enemyMax;this.phase=this.stage===3?'won':'player';this.time=0;this.guarded=false;this.parried=false;this.message='Ariane: „Jeśli zginiemy, nazwijcie arkusz FINAL_final_v2”.';this.ui();}
 save(){try{this.storage.setItem('bulk-import-cellule-v1',JSON.stringify({version:1,stage:this.stage}));}catch(e){}}
 action(kind){
  if(kind==='exit'){this.onExit();return;}if(kind==='pause'){this.paused=!this.paused;this.ui();return;}if(this.paused)return;
  if(kind==='retry'&&this.phase==='dead'){this.reset();return;}
  if(kind==='next'&&this.phase==='clear'){this.reset();return;}
  if(kind==='again'&&this.phase==='won'){this.stage=0;this.save();this.reset();return;}
  if(kind==='parry'&&this.phase==='enemy'&&!this.attempted){this.attempted=true;this.parried=this.time>=.74&&this.time<=1.02;this.message=this.parried?'PARADE! Salesforce odmówił dostępu do obrażeń.':'Za wcześnie. Nawet IF potrzebuje warunku.';this.effects.play(this.parried?'parry':'click');this.ui();return;}
  if(this.phase!=='player')return;
  let damage=0;
  if(kind==='attack'){damage=24;this.ap=Math.min(6,this.ap+1);}
  else if(kind==='skill'&&this.ap>=3){this.ap-=3;damage=57;}
  else if(kind==='heal'&&this.potions>0&&this.hp<150){this.potions--;this.hp=Math.min(150,this.hp+55);this.effects.play('heal');}
  else if(kind==='guard'){this.guarded=true;this.ap=Math.min(6,this.ap+1);}
  else return;
  this.enemy=Math.max(0,this.enemy-damage);if(damage)this.effects.play('greatsword');
  if(this.enemy===0){this.stage++;this.save();this.phase=this.stage===3?'won':'clear';this.message=this.stage===3?'La formule est finie. Świat odzyskał referencje. Marc: „A teraz kupcie dodatkowe licencje”.':'Obóz ekspedycji: życie, AP i mikstury odnowią się przed kolejnym starciem.';this.effects.play('upgrade');}
  else{this.phase='enemy';this.time=0;this.attempted=false;this.parried=false;this.turn++;this.message='Nadchodzi '+(this.stage===2&&this.enemy<this.enemyMax/2?'GNIEW MALARKI':'cięcie formuły')+'! Spacja / Paruj w złotym oknie albo przyjmij cios.';}
  this.ui();
 }
 tick(dt){if(this.paused||this.phase!=='enemy')return;this.time+=dt;if(this.time<1.2)return;
  const rage=this.stage===2&&this.enemy<this.enemyMax/2,damage=18+this.stage*6+(rage?12:0);
  if(this.parried){this.ap=Math.min(6,this.ap+2);this.message='Parowanie: +2 AP. Céline: „Wyjątek obsłużony z klasą”.';}
  else{this.hp=Math.max(0,this.hp-Math.ceil(damage*(this.guarded?.4:1)));this.message=this.guarded?'Osłona Backupu zamortyzowała uderzenie.':'Błąd krytyczny. Na szczęście macie jeszcze mikstury.';this.effects.play('hit');}
  this.guarded=false;this.phase=this.hp===0?'dead':'player';this.ui();
 }
 ui(){this.status.textContent=(this.paused?'PAUZA · ':'')+'STARCIE '+Math.min(3,this.stage+1)+'/3 · ŻYCIE '+this.hp+'/150 · AP '+this.ap+'/6 · MIKSTURY '+this.potions+' · '+this.message;
  const button=(id,label,disabled=false)=>'<button data-ob="'+id+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
  this.nav.innerHTML=this.phase==='won'?'<h2>EXPÉDITION ACCOMPLIE</h2>'+button('again','Nowa ekspedycja'):this.phase==='clear'?button('next','Odpocznij i idź dalej'):this.phase==='dead'?'<h2>Ekspedycja upadła</h2>'+button('retry','Ponów obecne starcie'):this.phase==='enemy'?button('parry','SPACJA · PARUJ',this.attempted):button('attack','Ariane · Rapier (+1 AP)')+button('skill','Céline · VLOOKUP widm (3 AP)',this.ap<3)+button('guard','Gaston · Osłona Backupu (+1 AP)')+button('heal','Mikstura · +55 życia',!this.potions||this.hp===150);
 }
 draw(){const c=this.ctx,w=1000,h=420;c.fillStyle='#131d30';c.fillRect(0,0,w,h);const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#151f35');sky.addColorStop(1,'#a07756');c.fillStyle=sky;c.fillRect(0,0,w,h);c.fillStyle='#efd6a0';c.beginPath();c.arc(730,95,65,0,7);c.fill();
  for(let i=0;i<13;i++){const x=i*89;c.fillStyle=i%2?'#31313d':'#403b43';c.fillRect(x,150+(i%3)*20,35,240);c.fillRect(x-8,150+(i%3)*20,51,14);}
  c.fillStyle='#17232a';c.beginPath();c.moveTo(0,370);c.lineTo(1000,290);c.lineTo(1000,420);c.lineTo(0,420);c.fill();
  c.fillStyle='#171822';c.beginPath();c.moveTo(520,345);c.lineTo(548,40);c.lineTo(610,65);c.lineTo(630,345);c.fill();c.fillStyle='#edc88b';c.font='32px Georgia';c.fillText('#REF!',530,180);
  const person=(x,y,color,scale=1)=>{c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#252332';c.fillRect(-14,-25,10,45);c.fillRect(5,-25,10,45);c.fillStyle=color;c.beginPath();c.moveTo(-22,-90);c.lineTo(22,-90);c.lineTo(35,-10);c.lineTo(-35,-10);c.fill();c.fillStyle='#e2c3a2';c.beginPath();c.arc(0,-110,14,0,7);c.fill();c.strokeStyle='#f1dcae';c.lineWidth=3;c.beginPath();c.moveTo(25,-55);c.lineTo(65,-120);c.stroke();c.restore();};
  person(170,370,'#436c78');person(260,350,'#a0696d');person(350,380,'#b59a67');if(this.stage<3){person(800,330,this.stage===2?'#ba7c61':'#555169',1.7);c.fillStyle='#181a25';c.fillRect(690,32,220,12);c.fillStyle='#dfb679';c.fillRect(690,32,220*this.enemy/this.enemyMax,12);c.font='18px Georgia';c.fillText(this.names[this.stage],660,70);}
  this.bar.hidden=this.phase!=='enemy';this.bar.querySelector('i').style.left=Math.min(100,this.time/1.2*100)+'%';
 }
 frame(now){if(this.dead)return;this.tick(Math.min(.05,(now-this.last)/1000));this.last=now;this.draw();this.raf=requestAnimationFrame(this.frame);}
 destroy(){this.dead=true;cancelAnimationFrame(this.raf);this.effects.stop();this.host.removeEventListener('click',this.click);window.removeEventListener('keydown',this.key);window.removeEventListener('blur',this.blur);document.removeEventListener('visibilitychange',this.hidden);this.host.remove();}
}
if(typeof window!=='undefined')window.BulkObscureGame=BulkObscureGame;
