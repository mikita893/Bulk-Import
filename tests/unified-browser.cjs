'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const release=require('../release.cjs');
const {createGameServer}=require('../server/index.cjs');
const {pathToFileURL}=require('node:url');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const server=createGameServer({port:0,host:'127.0.0.1'}),{url:origin}=await server.listen();
 const browser=await chromium.launch({executablePath:process.env.BULK_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const errors=[],temp=fs.mkdtempSync(path.join(os.tmpdir(),'bulk-unified-'));
 let localBackup;
 function watch(page){page.on('pageerror',e=>errors.push(e.message));}
 async function campaignFrame(page){await page.waitForFunction(()=>document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign);return page.frames().find(f=>f.url()==='about:srcdoc');}
 async function openTerminal(page,frame){
  await frame.waitForFunction(()=>active&&['hub','break'].includes(mode));
  if(!await frame.evaluate(()=>nearShipTerminal())){
   assert.equal(await page.evaluate(()=>BulkUnified.openBird()),false,'Arcade cannot launch while away from terminal');
   await frame.locator('#world').click({position:{x:500,y:300}});await page.keyboard.down('KeyW');
   await frame.waitForFunction(()=>nearShipTerminal(),null,{timeout:6000});await page.keyboard.up('KeyW');
  }
  await frame.waitForFunction(()=>document.getElementById('prompt').textContent.includes('TERMINAL GŁÓWNY'));
  await page.keyboard.press('KeyE');await frame.waitForFunction(()=>terminalPanelOpen&&mode==='panel');
  assert.equal(await frame.locator('#panel-title').textContent(),'Terminal główny');
  await page.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-terminal.png'});
 }
 async function enterArcade(page,frame){
  await openTerminal(page,frame);
  await frame.getByRole('button',{name:'Rekreacja: Bird Game 3',exact:true}).click();
  await page.waitForFunction(()=>BulkUnified.screen==='bird');
 }
 async function returnToShip(page,frame){
  await page.locator('#unified-back').click();assert.equal(await page.evaluate(()=>BulkUnified.screen),'campaign');
  assert.equal(await frame.locator('#panel-title').textContent(),'Terminal główny');
  assert(await frame.evaluate(()=>terminalPanelOpen));
  await frame.getByRole('button',{name:'Wróć na pokład',exact:true}).click();
  await frame.waitForFunction(()=>mode==='hub'||mode==='break');
  assert.equal(await page.evaluate(()=>BulkUnified.openBird()),false,'Terminal must be explicitly open to start arcade');
 }
 async function playBird(page){
  for(const id of ['pigeon','crow','owl','hummingbird','duck']){
   await page.locator('[data-bird="'+id+'"]').click();
   assert.equal(await page.evaluate(()=>BulkUnified.bird.game.selected),id);
   assert.equal(await page.locator('[data-bird="'+id+'"]').getAttribute('aria-pressed'),'true');
  }
  await page.locator('[data-bird="crow"]').click();
  await page.waitForFunction(()=>BulkUnified.bird.renderer?.players.crow.root.visible);
  await page.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-bird-select.png'});
  await page.locator('#bird-start').click();
  await page.keyboard.press('KeyQ');await page.waitForFunction(()=>BulkUnified.bird.game.delivered>=1);
  const before=await page.evaluate(()=>({z:BulkUnified.bird.game.player.z,y:BulkUnified.bird.game.player.y}));
  await page.keyboard.down('KeyW');await page.keyboard.down('Space');await sleep(400);await page.keyboard.up('KeyW');await page.keyboard.up('Space');
  assert(await page.evaluate(({z,y})=>{const p=BulkUnified.bird.game.player;return p.z<z-.5&&p.y>y+.2;},before),'Actual keyboard movement and flight move the 3D bird');
  await page.evaluate(()=>{const g=BulkUnified.bird.game,p=g.player,e=g.enemies[0];for(const other of g.enemies)other.grace=100;e.x=p.x+2;e.z=p.z;e.y=p.y;e.hp=34;e.inv=0;e.alive=true;p.attackCooldown=0;});
  await page.keyboard.down('KeyJ');await sleep(1100);await page.keyboard.up('KeyJ');
  assert(await page.evaluate(()=>BulkUnified.bird.game.kills>=1),'Real peck input defeats a nearby bot');
  await page.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-bird-arena.png'});
  await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>BulkUnified.bird.game.mode),'paused');
  const stopped=await page.evaluate(()=>JSON.stringify(BulkUnified.bird.game));await sleep(200);assert.equal(await page.evaluate(()=>JSON.stringify(BulkUnified.bird.game)),stopped);
  await page.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-bird.png'});
 }

 try{
  const html=fs.readFileSync(path.join(__dirname,'..',release.filename),'utf8'),standalone=path.join(temp,release.filename);fs.writeFileSync(standalone,html);
  assert(!/<script\b[^>]+\bsrc=/i.test(html),'All scripts must be embedded');
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});let offline=await context.newPage();watch(offline);let nativeFile=true;
  try{await offline.goto(pathToFileURL(standalone).href);}catch(e){
   if(!e.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw e;
   nativeFile=false;await offline.close();offline=await context.newPage();watch(offline);await offline.setContent(html);
   console.log('Managed Chromium blocks file://; standalone HTML is exercised in about:blank without any network or sibling files.');
  }
  const traffic=[];offline.on('request',r=>traffic.push(r.url()));offline.on('websocket',ws=>traffic.push(ws.url()));
  await offline.waitForFunction(()=>BulkUnified.local);
  for(const id of ['create-coop','create-versus','join-room','join-code','connect-server'])assert(await offline.locator('#'+id).isDisabled());
  assert.equal(await offline.evaluate(()=>__bulkMultiplayer.renderer),null,'No idle WebGL renderer in offline menu');
  await offline.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-offline.png'});
  assert.equal(await offline.locator('#play-bird,#nav-bird,#unified-bird').count(),0,'No independent arcade entry in main menu or toolbar');assert.equal(await offline.evaluate(()=>BulkUnified.openBird()),false);
  await offline.locator('#play-campaign').click();let frame=await campaignFrame(offline);
  await frame.getByRole('button',{name:'▶ ROZPOCZNIJ KAMPANIĘ',exact:true}).click();await frame.waitForFunction(()=>active&&mode==='hub');
  const start=await frame.evaluate(()=>player.z);await frame.locator('#world').click({position:{x:500,y:300}});await offline.keyboard.down('KeyW');await sleep(400);await offline.keyboard.up('KeyW');assert(await frame.evaluate(()=>player.z)<start-.5);
  assert.equal(await frame.locator('#bird-arcade').count(),0,'No ship toolbar shortcut');await enterArcade(offline,frame);await playBird(offline);
  const frozen=await frame.evaluate(()=>({x:player.x,z:player.z,time}));await sleep(250);assert.deepEqual(await frame.evaluate(()=>({x:player.x,z:player.z,time})),frozen,'Campaign freezes behind the arcade');
  await returnToShip(offline,frame);
  await frame.locator('#saves').click();
  const [download]=await Promise.all([offline.waitForEvent('download'),frame.getByRole('button',{name:'Eksportuj zapis JSON',exact:true}).click()]);
  localBackup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(localBackup.progress.version,10,'Campaign save format stays compatible');
  await offline.locator('#unified-back').click();assert.equal(traffic.length,0,'Offline play never requests a server, assets or WebSockets');
  if(nativeFile){await offline.locator('#play-campaign').click();frame=await campaignFrame(offline);assert.equal(await frame.getByRole('button',{name:'▶ KONTYNUUJ KAMPANIĘ',exact:true}).count(),1);}
  console.log('PASS standalone menu, disabled networking, Bird Game 3 selection, real 3D flight/skill/peck/pause, complete 3D campaign, movement, physical ship terminal, freeze/resume and JSON export.');
  await context.close();

  const onlineContext=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),online=await onlineContext.newPage();watch(online);
  await online.goto(origin+'/'+release.filename);await online.waitForFunction(()=>__bulkMultiplayer.connected);assert(await online.locator('#create-versus').isEnabled());
  await online.locator('#play-campaign').click();frame=await campaignFrame(online);
  await frame.locator('#import-file').setInputFiles({name:'previous-solo-v10.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(localBackup))});
  await frame.waitForFunction(()=>active&&mode==='hub');assert.equal(await online.evaluate(()=>JSON.parse(localStorage.getItem('bulk-import-omega-3d-v10')).progress.version),10);
  const saved=await frame.evaluate(()=>({credits:progress.credits,crew:progress.crew.map(c=>[c.affection,c.trust]),completed:progress.completed}));
  await online.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-campaign.png'});
  await online.locator('#unified-back').click();await online.waitForFunction(()=>__bulkMultiplayer.connected);await online.locator('#play-campaign').click();frame=await campaignFrame(online);await frame.getByRole('button',{name:'▶ KONTYNUUJ KAMPANIĘ',exact:true}).click();assert.deepEqual(await frame.evaluate(()=>({credits:progress.credits,crew:progress.crew.map(c=>[c.affection,c.trust]),completed:progress.completed})),saved);
  await online.evaluate(()=>localStorage.setItem('bulk-import-bird-game-3-v1',JSON.stringify({version:1,best:37})));await enterArcade(online,frame);assert.equal(await online.evaluate(()=>BulkUnified.bird.saveData.legacyBest),37);await playBird(online);const best=await online.evaluate(()=>BulkUnified.bird.best);await returnToShip(online,frame);await online.locator('#unified-back').click();await online.waitForFunction(()=>__bulkMultiplayer.connected);await online.reload();await online.waitForFunction(()=>__bulkMultiplayer.connected);await online.locator('#play-campaign').click();frame=await campaignFrame(online);await frame.getByRole('button',{name:'▶ KONTYNUUJ KAMPANIĘ',exact:true}).click();await enterArcade(online,frame);assert.equal(await online.evaluate(()=>BulkUnified.bird.best),best,'Bird record survives reload');
  await online.setViewportSize({width:430,height:932});await online.screenshot({path:'/tmp/bulk-unified-v'+release.major+'-mobile.png'});assert(await online.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  await returnToShip(online,frame);await online.locator('#unified-back').click();await online.setViewportSize({width:1440,height:1000});await online.waitForFunction(()=>__bulkMultiplayer.connected);await online.locator('#create-coop').click();await online.waitForFunction(()=>__bulkMultiplayer.room?.mode==='coop');
  const code=await online.evaluate(()=>__bulkMultiplayer.room.code);await online.locator('#nav-campaign').click();assert.equal(await online.evaluate(()=>BulkUnified.screen),'main');assert.equal(await online.evaluate(()=>__bulkMultiplayer.room.code),code,'Switching modes cannot abandon a live room silently');
  await onlineContext.close();assert.deepEqual(errors,[]);
  console.log('PASS server availability, legacy-format solo import/continue, unchanged relationships, saved Bird record, mobile layout and safe mode switching; no JS errors.');
 }finally{await browser.close();await server.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
