'use strict';
// A small fixed-step arcade simulation, shared with the Node regression tests.
class BulkBirdState {
 constructor(seed=1){this.reset(seed);}
 reset(seed=1){this.seed=seed>>>0||1;this.y=250;this.vy=0;this.elapsed=0;this.score=0;this.csv=0;this.lives=3;this.inv=0;this.gates=[];this.mode='ready';this.distance=0;this.nextGate=0;this.makeGate(760);this.makeGate(1080);}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 get stage(){return this.score<5?1:this.score<12?2:3;}
 get speed(){return [0,215,250,280][this.stage];}
 makeGate(x){const gap=[0,206,190,178][this.stage];this.gates.push({id:++this.nextGate,x,center:170+this.random()*170,gap,passed:false,failed:false,collected:false});}
 flap(){if(this.mode==='playing')this.vy=-410;}
 damage(gate){if(this.inv>0)return;this.lives--;this.inv=1.35;this.vy=-120;this.y=gate?gate.center:250;if(gate){gate.failed=true;gate.passed=true;}if(this.lives<=0)this.mode='over';}
 step(dt){
  if(this.mode!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,1/30);this.elapsed+=dt;this.inv=Math.max(0,this.inv-dt);this.vy+=1220*dt;this.y+=this.vy*dt;
  const travel=this.speed*dt;this.distance+=travel;
  for(const gate of this.gates){
   gate.x-=travel;
   if(this.mode!=='playing')break;
   if(!gate.collected&&Math.abs(gate.x+42-230)<31&&Math.abs(this.y-gate.center)<32){gate.collected=true;this.csv++;if(this.csv%6===0)this.lives=Math.min(3,this.lives+1);}
   if(!gate.passed&&gate.x<246&&gate.x+84>214&&(this.y-12<gate.center-gate.gap/2||this.y+12>gate.center+gate.gap/2))this.damage(gate);
   if(!gate.passed&&gate.x+84<214){gate.passed=true;if(!gate.failed)this.score++;}
  }
  if(this.mode==='playing'&&(this.y<35||this.y>474))this.damage(null);
  this.gates=this.gates.filter(g=>g.x>-110);
  if(!this.gates.length||this.gates[this.gates.length-1].x<660)this.makeGate(980);
 }
}

class BulkBirdGame {
 constructor(host,options={}){
  this.host=host;this.storage=options.storage;this.soundEnabled=options.soundEnabled||(()=>true);this.best=0;this.storageOK=true;this.frameId=0;this.last=0;this.accumulator=0;this.audio=null;this.dead=false;
  try{const saved=JSON.parse(this.storage.getItem('bulk-import-bird-game-3-v1')||'null');if(saved?.version===1&&Number.isSafeInteger(saved.best)&&saved.best>=0&&saved.best<=1000000)this.best=saved.best;}catch{this.storageOK=false;}
  this.game=new BulkBirdState(Date.now());
  host.innerHTML='<div class="bird-page"><div class="bird-heading"><div><div class="eyebrow">AUTOMAT POKŁADOWY / BEZ MIKROTRANSAKCJI</div><h1>BIRD GAME <em>3</em></h1><p>Gołąb API niesie ostatni czysty CSV. Excel postawił mu kolumny na drodze.</p></div><div class="bird-record"><small>REKORD CZYSTYCH IMPORTÓW</small><strong id="bird-best">0</strong><span id="bird-storage-note"></span></div></div><div class="bird-hud"><div>IMPORTY <b id="bird-score">0</b></div><div>CSV <b id="bird-csv">0</b></div><div>ŻYCIA <b id="bird-lives">♥ ♥ ♥</b></div><div id="bird-stage">01 / SANDBOX</div></div><div class="bird-arena"><canvas id="bird-canvas" width="960" height="540" tabindex="0" aria-label="Bird Game 3: spacja, strzałka w górę lub dotknięcie ekranu unosi ptaka"></canvas><div id="bird-overlay" class="bird-overlay"><div class="bird-card-content"><div class="eyebrow" id="bird-overlay-tag">PIERWSZE DWIE CZĘŚCI ZJADŁ BACKUP</div><h2 id="bird-overlay-title">Nie rób DROP na gołębiu.</h2><p id="bird-overlay-text">Przelatuj między kolumnami Excela. Zbieraj CSV w retranslatorach. Masz trzy życia; co sześć CSV odzyskujesz jedno.</p><button id="bird-start" class="primary">▶ Rozpocznij lot</button></div></div></div><div class="bird-bottom"><p><kbd>SPACJA</kbd> / <kbd>↑</kbd> / dotknięcie — machnij skrzydłami · <kbd>P</kbd> / <kbd>ESC</kbd> — pauza</p><div><button id="bird-pause">Pauza</button><button id="bird-restart">Nowy lot</button></div></div><p class="bird-joke" id="bird-joke">„Gołąb: dostarczam wiadomości. Salesforce: ile API calli za gruchnięcie?”</p><div class="bird-phases"><span>01 SANDBOX · nauka latania</span><span>02 PRODUKCJA · od 5 importów</span><span>03 GOVERNOR LIMITS · od 12 importów</span></div></div>';
  this.$=id=>host.querySelector('#'+id);this.canvas=this.$('bird-canvas');this.ctx=this.canvas.getContext('2d');
  this.$('bird-start').onclick=()=>this.start();this.$('bird-restart').onclick=()=>{this.game.reset(Date.now());this.start();};this.$('bird-pause').onclick=()=>this.togglePause();
  this.onKey=e=>{if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(this.game.mode==='ready'||this.game.mode==='over')this.start();else if(this.game.mode==='paused')return;this.game.flap();this.chirp(680);}else if(['KeyP','Escape'].includes(e.code)&&!e.repeat){e.preventDefault();this.togglePause();}};
  this.onPointer=e=>{e.preventDefault();if(this.game.mode==='ready'||this.game.mode==='over')this.start();if(this.game.mode==='playing'){this.game.flap();this.chirp(680);this.canvas.focus({preventScroll:true});}};
  this.onHidden=()=>{if(document.hidden)this.pause();};this.onBlur=()=>this.pause();
  window.addEventListener('keydown',this.onKey);window.addEventListener('blur',this.onBlur);document.addEventListener('visibilitychange',this.onHidden);this.canvas.addEventListener('pointerdown',this.onPointer);
  this.updateHud();this.draw();this.canvas.focus({preventScroll:true});
 }
 chirp(freq){if(!this.soundEnabled())return;try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();this.audio.resume();const o=this.audio.createOscillator(),g=this.audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,this.audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,this.audio.currentTime+.09);g.gain.setValueAtTime(.018,this.audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.audio.currentTime+.1);o.connect(g);g.connect(this.audio.destination);o.start();o.stop(this.audio.currentTime+.11);}catch{}}
 saveBest(){if(this.game.score<=this.best)return;this.best=Math.min(1000000,this.game.score);try{this.storage.setItem('bulk-import-bird-game-3-v1',JSON.stringify({version:1,best:this.best}));}catch{this.storageOK=false;}}
 start(){if(this.dead)return;const resuming=this.game.mode==='paused';if(this.game.mode==='over')this.game.reset(Date.now());this.game.mode='playing';if(!resuming)this.game.flap();this.last=performance.now();this.accumulator=0;this.$('bird-overlay').hidden=true;this.$('bird-pause').textContent='Pauza';this.canvas.focus({preventScroll:true});this.chirp(880);cancelAnimationFrame(this.frameId);this.frameId=requestAnimationFrame(now=>this.frame(now));}
 pause(){if(this.game.mode!=='playing')return;this.game.mode='paused';cancelAnimationFrame(this.frameId);this.$('bird-overlay').hidden=false;this.$('bird-overlay-tag').textContent='PAUZA / SKRZYDŁA NIE ZUŻYWAJĄ CPU';this.$('bird-overlay-title').textContent='Gołąb w kolejce asynchronicznej.';this.$('bird-overlay-text').textContent='Lot czeka dokładnie w tym miejscu. Kliknij Wznów albo naciśnij P.';this.$('bird-start').textContent='▶ Wznów lot';this.$('bird-pause').textContent='Wznów';}
 togglePause(){if(this.game.mode==='playing')this.pause();else if(this.game.mode==='paused')this.start();}
 updateHud(){const g=this.game;this.$('bird-score').textContent=g.score;this.$('bird-csv').textContent=g.csv;this.$('bird-lives').textContent='♥ '.repeat(g.lives)+'♡ '.repeat(3-g.lives);this.$('bird-stage').textContent=['','01 / SANDBOX','02 / PRODUKCJA','03 / GOVERNOR LIMITS'][g.stage];this.$('bird-best').textContent=this.best;this.$('bird-storage-note').textContent=this.storageOK?'Zapis lokalny · bez konta':'Rekord w tej sesji · pamięć przeglądarki zablokowana';}
 frame(now){
  if(this.dead||this.game.mode!=='playing')return;
  this.accumulator=Math.min(.12,this.accumulator+Math.max(0,(now-this.last)/1000));this.last=now;
  const lives=this.game.lives,score=this.game.score;while(this.accumulator>=1/120&&this.game.mode==='playing'){this.game.step(1/120);this.accumulator-=1/120;}
  if(this.game.lives<lives){this.chirp(130);this.$('bird-joke').textContent=['„Excel: to nie kolizja. To scalanie komórek.”','„Gołąb dostał INVALID_CROSS_REFERENCE_KEY. Klucz nadal w dziobie.”','„Governor limit: za dużo ptaka w jednym batchu.”'][Math.max(0,2-this.game.lives)];}
  if(this.game.score>score){this.chirp(1050);this.saveBest();}
  this.updateHud();this.draw();
  if(this.game.mode==='over'){this.saveBest();this.$('bird-overlay').hidden=false;this.$('bird-overlay-tag').textContent='IMPORT ZAKOŃCZONY / WYMAGANY RETRY';this.$('bird-overlay-title').textContent=this.game.score?'Zaimportowano '+this.game.score+' retranslatorów.':'Gołąb nie przeszedł walidacji.';this.$('bird-overlay-text').textContent='CSV zebrane: '+this.game.csv+'. Rekord: '+this.best+'. Excel: „Ptak przestał odpowiadać”. Ty: „To dopiero trzecia część”.';this.$('bird-start').textContent='↻ Jeszcze jeden lot';this.$('bird-pause').textContent='Pauza';return;}
  this.frameId=requestAnimationFrame(t=>this.frame(t));
 }
 draw(){
  const c=this.ctx,g=this.game,w=960,h=540;
  const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#070f27');bg.addColorStop(.7,'#153349');bg.addColorStop(1,'#27575a');c.fillStyle=bg;c.fillRect(0,0,w,h);
  for(let i=0;i<65;i++){const x=((i*139.3-g.distance*(.08+(i%3)*.04))%w+w)%w,y=(i*79.7)%420;c.globalAlpha=.2+(i%5)*.12;c.fillStyle='#d1f5ff';c.fillRect(x,y,i%3===0?2:1,2);}c.globalAlpha=1;
  c.fillStyle='#274a59';c.beginPath();c.arc(790,115,68,0,Math.PI*2);c.fill();c.strokeStyle='#6b979177';c.lineWidth=9;c.beginPath();c.ellipse(790,115,100,22,-.4,0,Math.PI*2);c.stroke();
  for(let i=0;i<13;i++){const x=((i*107-g.distance*.22)%1200+1200)%1200-100;c.fillStyle='#0a202e';c.fillRect(x,400-(i%4)*22,65,130);c.fillStyle='#72c9d424';for(let j=0;j<3;j++)c.fillRect(x+10,413-(i%4)*22+j*16,43,3);}
  for(const gate of g.gates){
   const top=gate.center-gate.gap/2,bottom=gate.center+gate.gap/2;
   const fill=c.createLinearGradient(gate.x,0,gate.x+84,0);fill.addColorStop(0,'#103f38');fill.addColorStop(.5,'#26705b');fill.addColorStop(1,'#103b35');c.fillStyle=fill;c.fillRect(gate.x,0,84,top);c.fillRect(gate.x,bottom,84,486-bottom);
   c.strokeStyle='#77d69d';c.lineWidth=2;c.strokeRect(gate.x,0,84,top);c.strokeRect(gate.x,bottom,84,486-bottom);
   c.strokeStyle='#9ae5b633';c.lineWidth=1;for(let x=gate.x+21;x<gate.x+84;x+=21){c.beginPath();c.moveTo(x,0);c.lineTo(x,top);c.moveTo(x,bottom);c.lineTo(x,486);c.stroke();}for(let y=18;y<486;y+=25){if(y>top&&y<bottom)continue;c.beginPath();c.moveTo(gate.x,y);c.lineTo(gate.x+84,y);c.stroke();}
   c.fillStyle='#46ae7d';c.fillRect(gate.x-6,top-16,96,16);c.fillRect(gate.x-6,bottom,96,16);c.fillStyle='#dbffec';c.font='bold 12px monospace';c.textAlign='center';c.fillText('XLSX',gate.x+42,top-23);
   c.strokeStyle=gate.failed?'#e97e8d66':'#91f6ef77';c.lineWidth=3;c.beginPath();c.ellipse(gate.x+42,gate.center,29,gate.gap/2-11,0,0,Math.PI*2);c.stroke();
   if(!gate.collected){c.save();c.translate(gate.x+42,gate.center);c.rotate(Math.sin(g.elapsed*2+gate.id)*.13);c.fillStyle='#ffcf78';c.shadowColor='#ffc56d';c.shadowBlur=16;c.fillRect(-17,-20,34,40);c.shadowBlur=0;c.fillStyle='#3b332b';c.font='bold 11px monospace';c.fillText('CSV',0,4);c.restore();}
  }
  c.fillStyle='#081d29';c.fillRect(0,486,w,54);c.strokeStyle='#73c6bb';c.lineWidth=2;c.beginPath();c.moveTo(0,487);c.lineTo(w,487);c.stroke();c.fillStyle='#74b3bd44';for(let i=0;i<20;i++){const x=((i*80-g.distance*.8)%1100+1100)%1100-80;c.fillRect(x,506,43,3);}
  c.save();c.translate(230,g.y);c.rotate(Math.max(-.4,Math.min(.8,g.vy/650)));if(g.inv>0&&Math.sin(g.elapsed*35)>0)c.globalAlpha=.4;
  c.fillStyle='#4da4b5';c.beginPath();c.moveTo(-23,8);c.lineTo(-54,20);c.lineTo(-44,-1);c.closePath();c.fill();
  c.fillStyle='#e1e9dd';c.beginPath();c.ellipse(-2,1,30,21,0,0,Math.PI*2);c.fill();c.fillStyle='#8eaaa6';c.beginPath();c.ellipse(-8,6,20,8,Math.sin(g.elapsed*25)*.5-.2,0,Math.PI*2);c.fill();
  c.fillStyle='#a0c2bc';c.beginPath();c.arc(19,-13,16,0,Math.PI*2);c.fill();c.fillStyle='#f6b953';c.beginPath();c.moveTo(32,-15);c.lineTo(46,-8);c.lineTo(31,-4);c.fill();c.fillStyle='#102b39';c.beginPath();c.arc(24,-17,4,0,Math.PI*2);c.fill();c.fillStyle='white';c.beginPath();c.arc(25,-18,1.3,0,Math.PI*2);c.fill();
  c.fillStyle='#3c697c';c.fillRect(-25,-20,17,26);c.fillStyle='#8ffff0';c.fillRect(-23,-15,13,4);c.fillStyle='#ffce7a';c.fillRect(-3,15,15,14);c.fillStyle='#31404b';c.font='bold 7px monospace';c.textAlign='center';c.fillText('CSV',4,24);
  if(g.inv>0){c.strokeStyle='#9bf9f0';c.lineWidth=2;c.beginPath();c.arc(0,0,44,0,Math.PI*2);c.stroke();}c.restore();
  c.fillStyle='#b8ddde99';c.font='11px monospace';c.textAlign='left';c.fillText('RETRANSLATOR CSV / PRZELOT BEZ DUPLIKATÓW',20,523);c.textAlign='right';c.fillText('BIRD GAME 3 · BULK IMPORT',940,523);
 }
 destroy(){this.dead=true;cancelAnimationFrame(this.frameId);this.saveBest();window.removeEventListener('keydown',this.onKey);window.removeEventListener('blur',this.onBlur);document.removeEventListener('visibilitychange',this.onHidden);this.canvas.removeEventListener('pointerdown',this.onPointer);this.audio?.close();}
}
if(typeof window!=='undefined'){window.BulkBirdGame=BulkBirdGame;}
if(typeof module!=='undefined')module.exports={BulkBirdState};
