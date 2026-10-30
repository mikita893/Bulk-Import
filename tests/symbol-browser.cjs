'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const release=require('../release.cjs'),{createGameServer}=require('../server/index.cjs');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BULK_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const app=createGameServer({port:0,host:'127.0.0.1'}),{url}=await app.listen(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'bulk-double-browser-'));const errors=[];
 async function enterBird(page,fresh=true){
  assert.equal(await page.evaluate(()=>BulkUnified.openDouble()),false);
  await page.locator('#play-campaign').click();await page.waitForFunction(()=>document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign);const frame=page.frames().find(f=>f.url()==='about:srcdoc');
  await frame.getByRole('button',{name:fresh?'▶ ROZPOCZNIJ KAMPANIĘ':'▶ KONTYNUUJ KAMPANIĘ',exact:true}).click();
  await frame.waitForFunction(()=>active&&mode==='hub');assert.equal(await page.evaluate(()=>BulkUnified.openDouble()),false);
  const center=await frame.locator('#world').evaluate(canvas=>({x:canvas.clientWidth/2,y:canvas.clientHeight/2}));await frame.locator('#world').click({position:center});await page.keyboard.down('KeyW');await frame.waitForFunction(()=>nearShipTerminal(),null,{timeout:6000});await page.keyboard.up('KeyW');await page.keyboard.press('KeyE');
  await frame.getByRole('button',{name:'Rekreacja: Bird Game 3',exact:true}).click();await page.waitForFunction(()=>BulkUnified.screen==='bird');return frame;
 }
 async function openDouble(page){await page.locator('#bird-double').click();await page.waitForFunction(()=>BulkUnified.screen==='double');}
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true});let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const html=fs.readFileSync(path.join(__dirname,'..',release.filename),'utf8'),filename=path.join(temp,release.filename);fs.writeFileSync(filename,html);
  try{await page.goto(pathToFileURL(filename).href);}catch(error){if(!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw error;await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setContent(html);console.log('Managed browser: testing the complete standalone HTML without a network origin.');}
  const requests=[];page.on('request',r=>requests.push(r.url()));page.on('websocket',ws=>requests.push(ws.url()));
  await page.waitForFunction(()=>window.BulkUnified);assert.equal(await page.locator('[id="play-double"],[id="nav-double"]').count(),0);
  const frame=await enterBird(page);await page.locator('#bird-start').click();await sleep(120);const beforeBird=await page.evaluate(()=>JSON.stringify(BulkUnified.bird.game));
  await openDouble(page);const frozen=await page.evaluate(()=>JSON.stringify(BulkUnified.bird.game));const campaign=await frame.evaluate(()=>JSON.stringify({player,time}));
  assert.equal(await page.evaluate(()=>BulkUnified.bird.game.mode),'paused');assert.notEqual(beforeBird,frozen);
  await page.locator('#double-bots').selectOption('3');
  for(const id of ['gentle','easy','normal','hard','expert']){await page.locator('#double-difficulty').selectOption(id);assert.equal(await page.locator('#double-difficulty').inputValue(),id);}
  await page.locator('.dbl-settings details summary').click();await page.locator('#double-min').fill('0.5');await page.locator('#double-max').fill('0.7');await page.locator('#double-menu-sound').uncheck();
  await page.screenshot({path:'/tmp/bulk-v'+release.major+'-double-menu.png'});
  await page.locator('[data-double-action="start"]').click();assert.equal(await page.evaluate(()=>BulkUnified.double.model.state),'COUNTDOWN');
  await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>BulkUnified.double.model.state),'PAUSED');const paused=await page.evaluate(()=>JSON.stringify(BulkUnified.double.model));await sleep(200);assert.equal(await page.evaluate(()=>JSON.stringify(BulkUnified.double.model)),paused);
  await page.locator('.dbl-cover [data-double-action="pause"]').click();await page.waitForFunction(()=>BulkUnified.double.model.state==='PLAYING');
  assert.equal(await page.locator('[data-double-symbol]').count(),7);assert.equal(await page.locator('#double-center .dbl-icon').count(),7);assert.equal(await page.locator('#double-center .resolved').count(),0);
  const wrong=await page.evaluate(()=>{const m=BulkUnified.double.model;return m.participants[0].card.symbols.find(id=>!m.center.symbols.includes(id));});
  await page.locator('[data-double-symbol="'+wrong+'"]').click();await page.waitForFunction(()=>BulkUnified.double.model.wrong===1);assert(await page.locator('#double-lock').isVisible());assert.equal(await page.locator('[data-double-symbol]:disabled').count(),7);
  await page.keyboard.press('Digit1');assert.equal(await page.evaluate(()=>BulkUnified.double.model.wrong),1);
  const round=await page.evaluate(()=>BulkUnified.double.model.roundId);await page.waitForFunction(id=>{const m=BulkUnified.double.model;return m.roundId>id&&m.state==='PLAYING';},round);
  assert(await page.evaluate(()=>BulkUnified.double.model.lockedUntil>BulkUnified.double.model.time),'A bot taking the card must not clear the penalty');
  await page.screenshot({path:'/tmp/bulk-v'+release.major+'-double-cooldown.png'});
  await page.waitForFunction(()=>BulkUnified.double.model.state==='ROUND_TRANSITION');await page.locator('[data-double-action="restart"]').click();const session=await page.evaluate(()=>BulkUnified.double.model.session);await sleep(700);assert.equal(await page.evaluate(()=>BulkUnified.double.model.state),'COUNTDOWN');assert.equal(await page.evaluate(()=>BulkUnified.double.model.history.length),0);
  await page.keyboard.press('Escape');await page.locator('.dbl-cover [data-double-action="menu"]').click();
  await page.locator('#double-difficulty').selectOption('gentle');await page.locator('[data-double-action="start"]').click();await page.waitForFunction(()=>BulkUnified.double.model.state==='PLAYING');assert(await page.evaluate(s=>BulkUnified.double.model.session>s,session));
  let moves=0;
  while(await page.evaluate(()=>BulkUnified.double.model.state!=='GAME_OVER')){
   await page.waitForFunction(()=>{const m=BulkUnified.double.model;return m.state==='GAME_OVER'||m.state==='PLAYING'&&m.projectedTime(performance.now())>=m.lockedUntil;});
   if(await page.evaluate(()=>BulkUnified.double.model.state==='GAME_OVER'))break;
   assert(++moves<32);const symbol=await page.evaluate(()=>{const m=BulkUnified.double.model;return BulkDoubleDeck.commonDoubleSymbol(m.participants[0].card,m.center);});
   if(moves===2){await page.setViewportSize({width:430,height:932});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:'/tmp/bulk-v'+release.major+'-double-mobile.png'});}
   if(moves===4)await page.setViewportSize({width:1440,height:1050});
   const button=page.locator('[data-double-symbol="'+symbol+'"]');if(moves===2||moves===3)await button.tap();else await button.click();
   if(moves===5)await page.screenshot({path:'/tmp/bulk-v'+release.major+'-double-capture.png'});
  }
  const result=await page.evaluate(()=>BulkUnified.double.model.results());assert.equal(result.outcome,'win');assert.equal(result.correct,27);assert.equal(result.wrong,0);assert.equal(result.percent,100);assert(result.average>=0);assert.equal(await page.locator('.dbl-ranking li').count(),4);await page.screenshot({path:'/tmp/bulk-v'+release.major+'-double-results.png'});
  await page.locator('[data-double-action="restart"]').click();await page.evaluate(()=>window._destroyedDouble=BulkUnified.double);await page.locator('#unified-back').click();assert.equal(await page.evaluate(()=>BulkUnified.screen),'bird');assert.equal(await page.evaluate(()=>BulkUnified.double),null);assert.equal(await page.evaluate(()=>window._destroyedDouble.dead),true);
  await sleep(1000);assert.equal(await page.evaluate(()=>JSON.stringify(BulkUnified.bird.game)),frozen);assert.equal(await frame.evaluate(()=>JSON.stringify({player,time})),campaign);assert.equal(await page.locator('#double-host').textContent(),'');
  await page.keyboard.press('KeyP');await sleep(150);assert(await page.evaluate(()=>BulkUnified.bird.game.mode==='playing'));await page.keyboard.press('KeyP');await page.locator('#unified-back').click();assert.equal(await page.evaluate(()=>BulkUnified.screen),'campaign');assert.equal(requests.length,0);
  await context.close();
  const onlineContext=await browser.newContext({viewport:{width:430,height:932},hasTouch:true}),online=await onlineContext.newPage();online.on('pageerror',e=>errors.push(e.message));await online.goto(url+'/'+release.filename);await online.waitForFunction(()=>window.BulkUnified);await enterBird(online);await openDouble(online);
  await online.locator('#double-bots').selectOption('2');await online.locator('#double-difficulty').selectOption('hard');await online.locator('#double-cooldown').selectOption('2000');await online.locator('#double-training').check();await online.locator('#double-menu-sound').uncheck();
  assert(await online.locator('#double-bots').isDisabled());await online.screenshot({path:'/tmp/bulk-v'+release.major+'-double-mobile-menu.png'});assert(await online.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await online.reload();await online.waitForFunction(()=>window.BulkUnified);await enterBird(online,false);await openDouble(online);
  assert.equal(await online.locator('#double-bots').inputValue(),'2');assert.equal(await online.locator('#double-difficulty').inputValue(),'hard');assert.equal(await online.locator('#double-cooldown').inputValue(),'2000');assert(await online.locator('#double-training').isChecked());assert(!await online.locator('#double-menu-sound').isChecked());
  await online.locator('[data-double-action="start"]').tap();await online.waitForFunction(()=>BulkUnified.double.model.state==='PLAYING');assert.equal(await online.evaluate(()=>BulkUnified.double.model.participants.length),1);assert.equal(await online.evaluate(()=>BulkUnified.double.model.botEvents.length),0);await online.locator('#unified-back').click();await onlineContext.close();
  assert.deepEqual(errors,[]);console.log('PASS CSV Double: standalone/no traffic, physical nested entry, countdown/pause, seven symbols, bot capture during penalty, stale-timer restart, 27-card human victory, touch/mobile, result statistics, persisted settings/training and frozen Bird/campaign restoration; no JS errors.');
 }finally{await browser.close();await app.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
