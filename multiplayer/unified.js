'use strict';
(() => {
 const $=id=>document.getElementById(id),local=!/^https?:$/.test(location.protocol);
 let screen='main',network=null,campaign=null,bird=null,cards=null,double=null;
 const storage=Object.freeze({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)});
 const onlineControls=['create-coop','create-versus','join-room','join-code','connect-server','server-url'];
 function networkReady(ready){
  const enabled=!local&&ready;
  for(const id of onlineControls){$(id).disabled=!enabled;$(id).title=enabled?'':local?'Dostępne po otwarciu gry na serwerze.':'Oczekiwanie na serwer multiplayer.';}
  $('availability-note').textContent=local?'TRYB LOKALNY · Kampania działa offline. Minigry czekają w terminalu na statku. Kooperację i VS uruchom przez adres serwera.':enabled?'TRYB SERWEROWY · Kampania, kooperacja i VS są dostępne. Minigry uruchomisz w terminalu na statku.':'Kampania jest gotowa. Sprawdzam połączenie z serwerem multiplayer…';
 }
 function setScreen(next){
  screen=next;document.body.dataset.screen=next;
  document.querySelector('body > header').hidden=next!=='main';
  document.querySelector('body > main').hidden=next!=='main';
  $('unified-stage').hidden=next==='main';$('campaign-host').hidden=next!=='campaign';$('bird-host').hidden=next!=='bird';$('cards-host').hidden=next!=='cards';$('double-host').hidden=next!=='double';
  $('unified-title').textContent=next==='campaign'?'KAMPANIA SOLO · WSPÓLNA GALAKTYKA':next==='double'?'CSV DOUBLE · PTAKI I DUPLIKATY':next==='cards'?'GWINTFORCE · WOJNA REKORDÓW':'BIRD GAME 3 · PTAKI KONTRA DUPLIKATY';
  $('unified-back').textContent=next==='double'?'← Wróć do Bird Game 3':['bird','cards'].includes(next)?'← Wróć do terminala':'← Menu główne';
 }
 function leaveNetwork(){return network?.suspend()!==false;}
 function openCampaign(){
  if(screen!=='main'||!leaveNetwork())return;
  setScreen('campaign');
  campaign=document.createElement('iframe');campaign.id='campaign-frame';campaign.title='Kampania solo Bulk Import';campaign.allow='autoplay; fullscreen';
  campaign.srcdoc=window.BULK_CAMPAIGN_DOCUMENT.replace('/*THREE_VENDOR*/',()=>document.getElementById('bulk-three').textContent);
  campaign.addEventListener('load',()=>{if(screen==='campaign')campaign.contentWindow.focus();});
  $('campaign-host').replaceChildren(campaign);
 }
 function openBird(){
  const api=campaign?.contentWindow?.BulkCampaign;
  if(screen!=='campaign'||!api?.canPlayBird())return false;
  api.suspend();setScreen('bird');
  bird=new BulkBirdGame($('bird-host'),{storage,soundEnabled:()=>$('sound-toggle').textContent.includes('ON'),openDouble});
  return true;
 }
 function openCards(){
  const api=campaign?.contentWindow?.BulkCampaign;
  if(screen!=='campaign'||!api?.canPlayCards())return false;
  api.suspend();setScreen('cards');cards=new BulkCardGame($('cards-host'),api);return true;
 }
 function openDouble(){
  if(screen!=='bird'||!bird)return false;
  bird.suspendForMinigame();setScreen('double');
  double=new BulkDoubleGame($('double-host'),{storage,soundEnabled:()=>$('sound-toggle').textContent.includes('ON'),onExit:back});return true;
 }
 function back(){
  if(screen==='double'){double?.destroy();double=null;setScreen('bird');bird?.resumeFromMinigame();return;}
  if(screen==='cards'){cards?.destroy();cards=null;setScreen('campaign');campaign.contentWindow.BulkCampaign?.resume();campaign.contentWindow.focus();return;}
  if(screen==='bird'){
   bird?.destroy();bird=null;$('bird-host').replaceChildren();
   if(campaign){setScreen('campaign');campaign.contentWindow.BulkCampaign?.resume();campaign.contentWindow.focus();return;}
  }
  if(campaign){campaign.contentWindow.BulkCampaign?.suspend();campaign.remove();campaign=null;}
  setScreen('main');network?.resume();$('play-campaign').focus();
 }
 $('play-campaign').onclick=$('nav-campaign').onclick=openCampaign;
 $('unified-back').onclick=back;
 window.BulkUnified=Object.freeze({storage,local,networkReady,openCampaign,openBird,openCards,openDouble,back,registerNetwork(api){network=api;},get screen(){return screen;},get bird(){return bird;},get cards(){return cards;},get double(){return double;}});
 networkReady(false);
})();
