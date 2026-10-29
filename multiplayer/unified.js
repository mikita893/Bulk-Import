'use strict';
(() => {
 const $=id=>document.getElementById(id),local=!/^https?:$/.test(location.protocol);
 let screen='main',network=null,campaign=null,bird=null,birdReturn='main';
 const storage=Object.freeze({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)});
 const onlineControls=['create-coop','create-versus','join-room','join-code','connect-server','server-url'];
 function networkReady(ready){
  const enabled=!local&&ready;
  for(const id of onlineControls){$(id).disabled=!enabled;$(id).title=enabled?'':local?'Dostępne po otwarciu gry na serwerze.':'Oczekiwanie na serwer multiplayer.';}
  $('availability-note').textContent=local?'TRYB LOKALNY · Kampania i Bird Game 3 działają offline. Kooperację i VS uruchom przez adres serwera.':enabled?'TRYB SERWEROWY · Kampania, Bird Game 3, kooperacja i VS są dostępne.':'Kampania i Bird Game 3 są gotowe. Sprawdzam połączenie z serwerem multiplayer…';
 }
 function setScreen(next){
  screen=next;document.body.dataset.screen=next;
  document.querySelector('body > header').hidden=next!=='main';
  document.querySelector('body > main').hidden=next!=='main';
  $('unified-stage').hidden=next==='main';$('campaign-host').hidden=next!=='campaign';$('bird-host').hidden=next!=='bird';
  $('unified-title').textContent=next==='campaign'?'KAMPANIA SOLO · WSPÓLNA GALAKTYKA':'BIRD GAME 3 · GOŁĄB API';
  $('unified-bird').hidden=next!=='campaign';
  $('unified-back').textContent=next==='bird'&&birdReturn==='campaign'?'← Wróć do kampanii':'← Menu główne';
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
 function openBird(origin='main'){
  if(screen==='bird')return;
  if(origin==='campaign'){
   const api=campaign?.contentWindow?.BulkCampaign;
   if(!api?.canPlayBird()){$('unified-title').textContent='Automat czeka na statku — najpierw zakończ walkę.';return;}
   api.suspend();
  }else if(screen!=='main'||!leaveNetwork())return;
  birdReturn=origin==='campaign'?'campaign':'main';setScreen('bird');
  bird=new BulkBirdGame($('bird-host'),{storage,soundEnabled:()=>$('sound-toggle').textContent.includes('ON')});
 }
 function back(){
  if(screen==='bird'){
   bird?.destroy();bird=null;$('bird-host').replaceChildren();
   if(birdReturn==='campaign'&&campaign){setScreen('campaign');campaign.contentWindow.BulkCampaign?.resume();campaign.contentWindow.focus();return;}
  }
  if(campaign){campaign.contentWindow.BulkCampaign?.suspend();campaign.remove();campaign=null;}
  setScreen('main');network?.resume();$('play-campaign').focus();
 }
 $('play-campaign').onclick=$('nav-campaign').onclick=openCampaign;
 $('play-bird').onclick=$('nav-bird').onclick=()=>openBird();
 $('unified-back').onclick=back;$('unified-bird').onclick=()=>openBird('campaign');
 window.BulkUnified=Object.freeze({storage,local,networkReady,openCampaign,openBird,back,registerNetwork(api){network=api;},get screen(){return screen;},get bird(){return bird;}});
 networkReady(false);
})();
