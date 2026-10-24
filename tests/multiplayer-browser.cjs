'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const ORIGIN=process.env.BULK_MULTI_ORIGIN||'http://127.0.0.1:3100';
const URL=ORIGIN+'/Bulk-Import-Multiplayer-v11.html';
const OUTPUT=process.env.BULK_MULTI_SCREENSHOTS||'/tmp/bulk-multiplayer-v11';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BULK_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[],external=[];
 try{
  const hostContext=await browser.newContext({viewport:{width:1440,height:900}}),friendContext=await browser.newContext({viewport:{width:1440,height:900}});
  const host=await hostContext.newPage(),friend=await friendContext.newPage();
  for(const [name,page]of [['host',host],['friend',friend]]){page.on('pageerror',e=>errors.push(name+': '+e.message));page.on('request',r=>{if(!r.url().startsWith(ORIGIN+'/')&&!r.url().startsWith('data:')&&!r.url().startsWith(ORIGIN.replace(/^http/,'ws')+'/'))external.push(r.url())})}
  await host.goto(URL);
  assert(await host.locator('a[href*="Bulk-Import-Omega-3D-v10.html"]').count(),'Original complete solo campaign remains accessible');
  await host.locator('#player-name').fill('Ada Salesforce');await host.locator('#create-versus').click();
  await host.waitForFunction(()=>window.__bulkMultiplayer?.room?.code);
  const code=await host.evaluate(()=>window.__bulkMultiplayer.room.code);assert.match(code,/^[A-Z0-9]{6}$/);
  await friend.goto(URL+'?room='+code);await friend.locator('#player-name').fill('Bartek Excel');await friend.locator('#join-code').fill(code);await friend.locator('#join-room').click();
  await Promise.all([host.waitForFunction(()=>window.__bulkMultiplayer.room.players.length===2),friend.waitForFunction(()=>window.__bulkMultiplayer.room.players.length===2)]);
  if(await host.locator('#team-salesforce').isEnabled())await host.locator('#team-salesforce').click();if(await friend.locator('#team-excel').isEnabled())await friend.locator('#team-excel').click();await host.evaluate(()=>{const d=window.__bulkMultiplayer;if(d.room.players.find(p=>p.id===d.localId).team!=='salesforce')throw Error('Host team selection failed')});await friend.evaluate(()=>{const d=window.__bulkMultiplayer;if(d.room.players.find(p=>p.id===d.localId).team!=='excel')throw Error('Friend team selection failed')});console.log('PASS browser lobby and teams');
  await host.screenshot({path:OUTPUT+'-lobby.png'});
  await host.locator('#ready-button').click();await friend.locator('#ready-button').click();
  await host.waitForFunction(()=>Array.from(document.querySelectorAll('#start-match')).some(b=>!b.disabled));await host.locator('#start-match').click();
  await Promise.all([host.waitForFunction(()=>window.__bulkMultiplayer?.state?.phase==='playing'),friend.waitForFunction(()=>window.__bulkMultiplayer?.state?.phase==='playing')]);
  console.log('PASS browser ready/start');const id=await host.evaluate(()=>window.__bulkMultiplayer.localId);
  await host.evaluate(()=>{const d=window.__bulkMultiplayer,r=d.renderer?.renderer||d.renderer;if(!r?.getContext())throw Error('WebGL renderer not available');if(d.state.players.length!==2||d.state.mode!=='versus')throw Error('Wrong multiplayer state');if(d.state.players.some(p=>!Number.isFinite(p.hp)||!Number.isFinite(p.shield)))throw Error('Bad replicated vitals')});
  const start=await host.evaluate(id=>window.__bulkMultiplayer.state.players.find(p=>p.id===id).x,id);
  await host.keyboard.down('KeyD');await host.waitForTimeout(650);await host.keyboard.up('KeyD');
  await host.waitForFunction(({id,start})=>window.__bulkMultiplayer.state.players.find(p=>p.id===id).x>start+.4,{id,start});
  const positions=await Promise.all([host.evaluate(id=>window.__bulkMultiplayer.state.players.find(p=>p.id===id).x,id),friend.evaluate(id=>window.__bulkMultiplayer.state.players.find(p=>p.id===id).x,id)]);assert(Math.abs(positions[0]-positions[1])<2.5,'Movement reaches both real client connections');
  await host.mouse.move(650,350);await host.keyboard.down('Space');
  await Promise.all([host.waitForFunction(()=>window.__bulkMultiplayer.state.projectiles.length>0),friend.waitForFunction(()=>window.__bulkMultiplayer.state.projectiles.length>0)]);
  await host.keyboard.up('Space');console.log('PASS browser replicated movement and shots');
  await host.keyboard.press('KeyC');await host.keyboard.press('KeyQ');await host.waitForTimeout(100);
  await host.screenshot({path:OUTPUT+'-versus.png'});
  // A tab's saved session token must resume its original identity after transport loss.
  await host.evaluate(()=>window.__bulkMultiplayer.socket.close());
  await host.waitForFunction(id=>window.__bulkMultiplayer.connected&&window.__bulkMultiplayer.localId===id&&window.__bulkMultiplayer.socket.readyState===WebSocket.OPEN&&window.__bulkMultiplayer.room.players.some(p=>p.id===id&&p.connected),id,{timeout:20000});
  assert.equal(await host.evaluate(()=>window.__bulkMultiplayer.room.code),code);console.log('PASS browser reconnect stable identity');
  const beforeReload=await host.evaluate(id=>window.__bulkMultiplayer.state.players.find(p=>p.id===id).x,id);await host.reload();try{await host.waitForFunction(id=>window.__bulkMultiplayer?.connected&&window.__bulkMultiplayer?.localId===id&&window.__bulkMultiplayer?.state?.phase==='playing',id,{timeout:20000})}catch(error){console.error('Reload diagnostics',await host.evaluate(()=>{const d=window.__bulkMultiplayer;let saved=null;try{const s=JSON.parse(sessionStorage.getItem('bulk-import-multi-session-v11'));saved=s?{code:s.code,tokenPresent:!!s.token,endpoint:s.endpoint}:null}catch{}return {id:d?.localId,room:d?.room?.code,phase:d?.state?.phase,connected:d?.connected,socketState:d?.socket?.readyState,notice:document.getElementById('notice')?.textContent,saved}}));console.error('Browser errors',errors);throw error;}await host.keyboard.down('KeyA');await host.waitForTimeout(450);await host.keyboard.up('KeyA');await host.waitForFunction(({id,beforeReload})=>window.__bulkMultiplayer.state.players.find(p=>p.id===id).x<beforeReload-.2,{id,beforeReload});
  await host.setViewportSize({width:430,height:932});await host.waitForTimeout(150);assert(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile layout must not overflow horizontally');await host.screenshot({path:OUTPUT+'-mobile.png'});
  await hostContext.close();await friendContext.close();
  const coopContext=await browser.newContext({viewport:{width:1440,height:900}}),coop=await coopContext.newPage();coop.on('pageerror',e=>errors.push('coop: '+e.message));coop.on('request',r=>{if(!r.url().startsWith(ORIGIN+'/')&&!r.url().startsWith('data:'))external.push(r.url())});
  await coop.goto(URL);await coop.locator('#player-name').fill('Kapitan Shared');await coop.locator('#create-coop').click();await coop.waitForFunction(()=>window.__bulkMultiplayer?.room?.mode==='coop');await coop.locator('#ready-button').click();await coop.locator('#start-match').click();await coop.waitForFunction(()=>window.__bulkMultiplayer?.state?.mode==='coop'&&window.__bulkMultiplayer.state.enemies.length>=2);
  await coop.evaluate(()=>{const s=window.__bulkMultiplayer.state;if(s.players.length!==1||s.waves<2||!s.missionName||s.map==='arena')throw Error('Separate co-op campaign did not start')});await coop.screenshot({path:OUTPUT+'-coop.png'});
  await coop.locator('#room-menu').click();const [backup]=await Promise.all([coop.waitForEvent('download'),coop.locator('#export-campaign').click()]);assert(backup.suggestedFilename().endsWith('.json'),'Co-op checkpoint download available in real UI');console.log('PASS browser separate co-op campaign, visible AI, and checkpoint export');
  assert.deepEqual(errors,[],'No browser JavaScript errors');assert.deepEqual([...new Set(external)],[],'Game assets are self-contained');
  console.log('PASS: two real WebSocket browser clients, lobby/teams/ready/start, authoritative movement and shots, abilities, reconnection/reload, solo access, separate co-op campaign/checkpoint, desktop/mobile WebGL; no JS errors or external assets.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
