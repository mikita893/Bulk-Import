'use strict';
class BulkDoubleGame{
 constructor(host,options={}){
  this.host=host;this.storage=options.storage;this.soundEnabled=options.soundEnabled||(()=>true);this.onExit=options.onExit;this.dead=false;this.timer=null;this.frameId=0;this.audio=null;this.storageOK=true;this.lastCountdown=0;
  try{const raw=JSON.parse(this.storage.getItem('bulk-import-csv-double-v1')||'null');this.settings=BulkDouble.normalizeDoubleSettings(raw?.version===1?raw.settings:{});}catch{this.settings=BulkDouble.normalizeDoubleSettings();this.storageOK=false;}
  this.model=new BulkDouble.DoubleMatch(this.settings,Date.now());
  this.onClick=event=>{const button=event.target.closest('button');if(!button||!host.contains(button))return;
   if(button.hasAttribute('data-double-symbol')){event.preventDefault();const result=this.model.answer(Number(button.dataset.doubleSymbol),{session:Number(button.dataset.session),roundId:Number(button.dataset.round)},performance.now());if(result==='correct')this.tone(880);if(result==='wrong')this.tone(155);this.render();return;}
   const action=button.dataset.doubleAction;
   if(action==='start'){if(this.readMenu()){this.model.start(performance.now(),this.settings);this.lastCountdown=0;this.tone(520);this.render();}}
   if(action==='restart'){this.model.start(performance.now(),this.settings);this.lastCountdown=0;this.tone(520);this.render();}
   if(action==='pause')this.togglePause();
   if(action==='menu'){this.model.advance(performance.now());this.model.state='MENU';this.model.botEvents=[];this.render();}
   if(action==='sound'){this.settings.sound=!this.settings.sound;this.persist();this.render();}
   if(action==='exit')this.onExit?.();
  };
  this.onChange=event=>{
   if(this.model.state!=='MENU')return;
   if(event.target.id==='double-difficulty'){
    const id=event.target.value,r=this.settings.ranges[id];this.$('double-min').value=r.min/1000;this.$('double-max').value=r.max/1000;
   }
   this.readMenu();if(this.$('double-bots'))this.$('double-bots').disabled=this.$('double-training').checked;
  };
  this.onKey=event=>{
   if(event.ctrlKey||event.altKey||event.metaKey||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||this.model.state==='MENU')return;
   if(event.repeat){if(/^[1-7]$/.test(event.key))event.preventDefault();return;}
   if(['Escape','KeyP'].includes(event.code)){event.preventDefault();this.togglePause();return;}
   if(/^[1-7]$/.test(event.key)){event.preventDefault();this.host.querySelectorAll('[data-double-symbol]')[Number(event.key)-1]?.click();}
  };
  this.onBlur=()=>{if(this.model.pause(performance.now()))this.render();};this.onHidden=()=>{if(document.hidden)this.onBlur();};
  host.addEventListener('click',this.onClick);host.addEventListener('change',this.onChange);host.addEventListener('input',this.onChange);window.addEventListener('keydown',this.onKey);window.addEventListener('blur',this.onBlur);document.addEventListener('visibilitychange',this.onHidden);this.render();
 }
 $(id){return this.host.querySelector('#'+id);}
 persist(){try{this.storage.setItem('bulk-import-csv-double-v1',JSON.stringify({version:1,settings:this.settings}));}catch{this.storageOK=false;}}
 readMenu(){
  if(!this.$('double-bots'))return true;
  const min=Number(this.$('double-min').value)*1000,max=Number(this.$('double-max').value)*1000;
  const valid=Number.isFinite(min)&&Number.isFinite(max)&&min>=200&&max<=60000&&max>=min;
  this.$('double-config-error').textContent=valid?'':'Czas botów: 0,2–60 s; maksimum musi być nie mniejsze od minimum.';
  this.host.querySelector('[data-double-action="start"]').disabled=!valid;
  if(!valid)return false;
  const difficulty=this.$('double-difficulty').value;
  this.settings=BulkDouble.normalizeDoubleSettings({...this.settings,bots:Number(this.$('double-bots').value),difficulty,cooldown:Number(this.$('double-cooldown').value),sound:this.$('double-menu-sound').checked,training:this.$('double-training').checked,ranges:{...this.settings.ranges,[difficulty]:{min,max}}});const pile=this.$('double-menu-pile');if(pile)pile.textContent=String(31-(this.settings.training?1:this.settings.bots+1));this.persist();return true;
 }
 tone(frequency){
  if(!this.settings.sound||!this.soundEnabled())return;
  try{this.audio??=new(window.AudioContext||window.webkitAudioContext)();this.audio.resume();const o=this.audio.createOscillator(),g=this.audio.createGain(),t=this.audio.currentTime;o.type='sine';o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(frequency*.75,t+.1);g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(this.audio.destination);o.start();o.stop(t+.15);}catch{}
 }
 header(){return '<div class="dbl-heading"><div><div class="eyebrow">BIRD GAME 3 / SALON PTASICH DUPLIKATÓW</div><h1>CSV <em>DOUBLE</em></h1><p>Jeden wspólny symbol. Siedem możliwości. Zero VLOOKUP-ów.</p></div><div class="dbl-emblem" aria-hidden="true">🪶</div></div>';}
 menuHTML(){
  const s=this.settings,r=s.ranges[s.difficulty];
  return `<div class="dbl-menu"><div class="dbl-welcome"><span class="dbl-menu-icons" aria-hidden="true">🚀 🍎 🎸</span><h2>Znajdź duplikat.<br>Zanim zrobi to bot.</h2><p>Każda para kart ma dokładnie jeden wspólny symbol. Kliknij go na swojej karcie — przejmiesz kartę ze środka. Wygrywa najwięcej przejętych kart.</p><p class="dbl-joke">„Excel znalazł duplikat. Teraz próbuje sprzedać go jako nowy rekord.”</p><div class="dbl-facts"><span>31 KART</span><span>7 SYMBOLI</span><span>1 WSPÓLNY</span></div></div><div class="dbl-settings"><h2>Ustawienia stołu</h2><label>Liczba botów<select id="double-bots" ${s.training?'disabled':''}>${[1,2,3].map(n=>'<option value="'+n+'" '+(s.bots===n?'selected':'')+'>'+n+(n===1?' bot':' boty')+'</option>').join('')}</select></label><label>Poziom trudności<select id="double-difficulty">${Object.entries(BulkDouble.DIFFICULTIES).map(([id,d])=>'<option value="'+id+'" '+(s.difficulty===id?'selected':'')+'>'+d.name+' · '+d.min/1000+'–'+d.max/1000+' s</option>').join('')}</select></label><label>Kara za błąd<select id="double-cooldown">${[1000,1500,2000].map(ms=>'<option value="'+ms+'" '+(s.cooldown===ms?'selected':'')+'>'+ms/1000+' s</option>').join('')}</select></label><div class="dbl-checks"><label><input id="double-menu-sound" type="checkbox" ${s.sound?'checked':''}> Dźwięki</label><label><input id="double-training" type="checkbox" ${s.training?'checked':''}> Trening bez botów</label></div><details><summary>Własny czas botów</summary><p>Dotyczy wybranego poziomu. Każdy bot losuje swój czas od nowa przy każdej karcie.</p><div class="dbl-range"><label>Minimum (s)<input id="double-min" type="number" min="0.2" max="60" step="0.1" value="${r.min/1000}"></label><label>Maksimum (s)<input id="double-max" type="number" min="0.2" max="60" step="0.1" value="${r.max/1000}"></label></div></details><p id="double-config-error" role="status"></p><button class="primary" data-double-action="start">▶ Rozpocznij grę</button><small>${this.storageOK?'Ustawienia zapisują się na tym urządzeniu.':'Pamięć zablokowana — ustawienia tylko w tej sesji.'}</small></div></div><details class="dbl-rules" open><summary>Jak grać?</summary><p>Porównaj kartę na środku ze swoją kartą. Kliknij jeden z 7 symboli na dole albo użyj klawiszy <b>1–7</b>. Zdobyta karta staje się nową kartą zwycięzcy; reszta graczy zachowuje swoje karty. Boty też muszą poczekać na swój wylosowany czas.</p><p>Błąd blokuje wszystkie odpowiedzi na wybraną karę, także po zmianie karty. Boty w tym czasie grają dalej. <b>P / Esc</b> wstrzymuje grę. Przy dokładnie równym czasie odpowiedzi bot ma pierwszeństwo. Stos ma <b id="double-menu-pile">${31-(s.training?1:s.bots+1)}</b> kart do zdobycia po rozdaniu kart uczestnikom.</p></details>`;
 }
 presentation(card,kind){
  if(!card)return [];
  let seed=(card.id+1)*7919+(this.model.roundId+1)*104729+this.model.session*31+(kind==='hand'?53:97);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const ids=[...card.symbols];for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.map(id=>({symbol:BulkDoubleDeck.DOUBLE_SYMBOLS[id],tilt:Math.round(random()*24-12),scale:(.88+random()*.22).toFixed(2)}));
 }
 cardHTML(card){
  const m=this.model,after=m.state==='ROUND_TRANSITION';
  return this.presentation(card,'center').map(({symbol:s,tilt,scale})=>`<span class="dbl-icon ${after&&m.lastAward?.symbol===s.id?'resolved':''}" role="img" aria-label="${s.name}" title="${s.name}" style="--tilt:${tilt}deg;--icon-scale:${scale}">${s.glyph}</span>`).join('');
 }
 scoreHTML(){
  const m=this.model,score=(p,i)=>`<div class="dbl-score ${m.state==='ROUND_TRANSITION'&&m.lastAward?.participant===i?'winner':''}" data-participant="${i}"><span>${p.avatar} ${p.name}</span><strong>${p.score} <small>pkt</small></strong><small>${i?'BOT · karta zakryta':'TWOJE ZDOBYCZE'}</small></div>`;
  return `<div class="dbl-scoreline" style="--panels:${m.participants.length+1}">${score(m.participants[0],0)}<div class="dbl-score dbl-pile-score"><span>STOS</span><strong id="double-remaining">${m.pile.length} <small>kart</small></strong><small>${m.settings.training?'TRENING':BulkDouble.DIFFICULTIES[m.settings.difficulty].name}</small></div>${m.participants.slice(1).map((p,i)=>score(p,i+1)).join('')}</div>`;
 }
 playHTML(){
  const m=this.model,active=m.state==='PLAYING',card=m.center||m.lastAward?.card;
  const token=m.token();const fly=m.state==='ROUND_TRANSITION';
  const message=fly?(m.lastAward.participant===0?'Twoja karta! Upsert refleksu zakończony.':m.participants[m.lastAward.participant].name+' przejmuje kartę. Ten bot nie robi przerw na kawę.'):'Znajdź jeden wspólny symbol i kliknij go na swojej karcie.';
  return `${this.scoreHTML()}<div class="dbl-controls"><span>${m.settings.training?'TRENING / BEZ PRESJI':'POJEDYNEK / WSZYSCY GRAJĄ JEDNOCZEŚNIE'}</span><button data-double-action="sound">Dźwięk: ${this.settings.sound?'ON':'OFF'}</button><button data-double-action="pause" id="double-pause">${m.state==='PAUSED'?'▶ Wznów':'Ⅱ Pauza'}</button><button data-double-action="restart">↻ Restart</button><button data-double-action="menu">Ustawienia</button></div><div class="dbl-table ${m.feedback?.type==='wrong'&&m.time-m.feedback.at<500?'mistake':''}"><h2>Karta na środku stołu</h2><div class="dbl-deck-stack"><div class="dbl-center-card ${fly?'captured':''}" id="double-center" aria-label="Karta środkowa">${card?this.cardHTML(card):'<span class="dbl-card-back">🪶<small>CSV DOUBLE</small></span>'}</div>${fly?`<div class="dbl-flying-card ${m.lastAward.participant===0?'to-player':'to-bot'}" aria-hidden="true">${this.cardHTML(card)}</div>`:''}</div><p id="double-event" role="status">${message}</p><div class="dbl-lock" id="double-lock" hidden><b id="double-lock-label"></b><div role="progressbar" aria-label="Pozostała kara" aria-valuemin="0" aria-valuemax="100" id="double-lock-progress"><i id="double-lock-fill"></i></div></div></div><section class="dbl-your-card"><h2>Twoja karta — kliknij wspólny symbol</h2><div class="dbl-hand" aria-label="Twoje siedem symboli">${this.presentation(m.participants[0].card,'hand').map(({symbol:s,tilt,scale},i)=>`<button data-double-symbol="${s.id}" data-session="${token.session}" data-round="${token.roundId}" ${active&&m.time>=m.lockedUntil?'':'disabled'} aria-label="${s.name}, klawisz ${i+1}" title="${s.name}"><kbd>${i+1}</kbd><span style="--tilt:${tilt}deg;--icon-scale:${scale}">${s.glyph}</span></button>`).join('')}</div><p>Błąd = blokada ${m.settings.cooldown/1000} s. Kara pozostaje nawet wtedy, gdy bot przejmie kartę.</p></section>${m.state==='COUNTDOWN'?'<div class="dbl-cover"><div><span>ROZŁÓŻ SKRZYDŁA</span><strong id="double-countdown">3</strong><p>Wspólny symbol pojawi się za chwilę.</p><button data-double-action="pause">Ⅱ Pauza</button></div></div>':''}${m.state==='PAUSED'?'<div class="dbl-cover"><div><span>PAUZA</span><h2>Wstrzymano import.</h2><p>Boty, odliczanie i kara czekają razem z Tobą.</p><button class="primary" data-double-action="pause">▶ Wznów</button><button data-double-action="restart">Rozdaj od nowa</button><button data-double-action="menu">Ustawienia</button></div></div>':''}`;
 }
 resultsHTML(){
  const m=this.model,r=m.results(),titles={win:'Wygrywasz! Duplikat opanowany.',loss:'Bot zrobił szybszy import.',draw:'Remis! Dwa rekordy, ten sam refleks.',training:'Trening zakończony.'};
  return `<section class="dbl-results ${r.outcome==='win'?'celebrate':''}"><div class="dbl-trophy" aria-hidden="true">${r.outcome==='win'?'🏆':r.outcome==='draw'?'🤝':r.outcome==='training'?'🎯':'🪶'}</div><div class="eyebrow">STOS WYCZERPANY / WYNIKI</div><h2 id="double-result-title">${titles[r.outcome]}</h2><p>Zdobyto ${m.total} kart. Żaden rekord nie został naliczony dwa razy.</p><ol class="dbl-ranking">${r.ranking.map(p=>`<li data-rank="${p.rank}"><b>${p.rank}.</b><span>${p.avatar} ${p.name}</span><strong>${p.score} kart</strong></li>`).join('')}</ol><div class="dbl-statistics"><div><b>${r.percent.toFixed(1)}%</b><span>STOSU DLA CIEBIE</span></div><div><b>${r.correct}</b><span>POPRAWNYCH PRÓB</span></div><div><b>${r.wrong}</b><span>BŁĘDNYCH PRÓB</span></div><div><b>${r.average===null?'—':(r.average/1000).toFixed(2)+' s'}</b><span>ŚREDNIA POPRAWNYCH ODPOWIEDZI</span></div></div><p>„Nie przegrałem. Wykonałem migrację punktów do bota.”</p><div class="dbl-result-actions"><button class="primary" data-double-action="restart">▶ Zagraj ponownie</button><button data-double-action="menu">Ustawienia</button><button data-double-action="exit">Wróć do Bird Game 3</button></div></section>`;
 }
 render(){
  if(this.dead)return;clearTimeout(this.timer);this.timer=null;cancelAnimationFrame(this.frameId);this.frameId=0;
  const m=this.model;this.host.innerHTML=`<div class="dbl-page" data-double-state="${m.state}">${this.header()}${m.state==='MENU'?this.menuHTML():m.state==='GAME_OVER'?this.resultsHTML():this.playHTML()}</div>`;
  this.updateLive();this.schedule();
  if(['COUNTDOWN','PLAYING','ROUND_TRANSITION'].includes(m.state))this.frameId=requestAnimationFrame(()=>this.frame());
 }
 updateLive(){
  const m=this.model,t=m.projectedTime(performance.now());
  const counter=this.$('double-countdown');if(counter){const n=Math.max(1,Math.ceil((m.deadline-t)/1000));counter.textContent=n;if(n!==this.lastCountdown){this.lastCountdown=n;this.tone(350+n*100);}}
  const lock=this.$('double-lock');if(!lock)return;
  const remaining=Math.max(0,m.lockedUntil-t),locked=remaining>0;lock.hidden=!locked;
  if(locked){this.$('double-lock-label').textContent='BŁĘDNY SYMBOL · BLOKADA '+(remaining/1000).toFixed(1)+' s';const percent=Math.min(100,100*remaining/m.settings.cooldown);this.$('double-lock-fill').style.width=percent+'%';this.$('double-lock-progress').setAttribute('aria-valuenow',String(Math.round(percent)));}
  for(const b of this.host.querySelectorAll('[data-double-symbol]'))b.disabled=m.state!=='PLAYING'||locked;
 }
 schedule(){
  if(this.dead)return;const deadline=this.model.nextDeadline();if(!Number.isFinite(deadline))return;
  const delay=Math.max(0,deadline-this.model.projectedTime(performance.now()));
  this.timer=setTimeout(()=>{if(this.dead)return;const before=this.model.history.length,previous=this.model.state;this.model.advance(performance.now());if(previous!=='GAME_OVER'&&this.model.state==='GAME_OVER')this.tone(1150);else if(this.model.history.length>before)this.tone(this.model.state==='GAME_OVER'?950:430);this.render();},Math.min(60000,delay+1));
 }
 frame(){this.frameId=0;if(this.dead)return;this.updateLive();if(['COUNTDOWN','PLAYING','ROUND_TRANSITION'].includes(this.model.state))this.frameId=requestAnimationFrame(()=>this.frame());}
 togglePause(){if(this.model.state==='PAUSED'){this.model.resume(performance.now());this.tone(620);}else this.model.pause(performance.now());this.render();}
 destroy(){this.dead=true;clearTimeout(this.timer);cancelAnimationFrame(this.frameId);this.persist();this.host.removeEventListener('click',this.onClick);this.host.removeEventListener('change',this.onChange);this.host.removeEventListener('input',this.onChange);window.removeEventListener('keydown',this.onKey);window.removeEventListener('blur',this.onBlur);document.removeEventListener('visibilitychange',this.onHidden);this.audio?.close();this.host.replaceChildren();}
}
if(typeof window!=='undefined')window.BulkDoubleGame=BulkDoubleGame;
