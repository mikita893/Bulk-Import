'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createGameServer}=require('../server/index.cjs');
const release=require('../release.cjs');

(async()=>{
 const app=createGameServer({port:0,host:'127.0.0.1'}),{url}=await app.listen();let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BULK_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:1050},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'/'+release.filename);await page.locator('#play-campaign').click();await page.waitForFunction(()=>document.querySelector('#campaign-frame')?.contentWindow?.BulkCampaign);
  const frame=await (await page.locator('#campaign-frame').elementHandle()).contentFrame();
  await frame.getByRole('button',{name:'▶ ROZPOCZNIJ KAMPANIĘ',exact:true}).click();
  await frame.evaluate(()=>{shellSuspended=true;audioOn=false;progress.credits=3350;progress.upgrades.damage=2;progress.upgrades.mobility=1;player.hp=50;});
  await frame.locator('#shop').click();assert.equal(await frame.locator('#panel-body [data-upgrade]').count(),7);assert.equal(await frame.locator('#panel-actions button').count(),2);
  assert.equal(await frame.locator('[data-upgrade="damage"] .filled').count(),2);assert.equal(await frame.locator('[data-upgrade="mobility"] .filled').count(),1);
  assert.equal(await frame.locator('.upgrade-segments i').count(),35);assert.equal(await frame.locator('[data-upgrade="damage"] .upgrade-segments').getAttribute('aria-valuenow'),'2');
  await page.screenshot({path:'/tmp/bulk-v'+release.major+'-armory.png'});
  const before=await frame.evaluate(()=>({credits:progress.credits,power:damage(),cost:upgradeCost('damage')}));
  await frame.locator('[data-upgrade="damage"]').focus();await page.keyboard.press('Enter');
  assert.equal(await frame.evaluate(()=>progress.upgrades.damage),3);assert.equal(await frame.evaluate(()=>progress.credits),before.credits-before.cost);assert.equal(await frame.locator('[data-upgrade="damage"] .filled').count(),3);
  assert(Math.abs(await frame.evaluate(()=>damage())-before.power-.7)<1e-8);
  await frame.getByRole('button',{name:'Wróć na statek',exact:true}).click();await frame.evaluate(()=>{progress.credits=0;});await frame.locator('#shop').click();
  assert.equal(await frame.locator('.upgrade-tile:disabled').count(),7);assert(await frame.locator('[data-upgrade="shield"]').textContent().then(t=>t.includes('Brakuje')));
  assert.equal(await frame.evaluate(()=>buyUpgrade('shield')),false);
  await frame.getByRole('button',{name:'Wróć na statek',exact:true}).click();await frame.evaluate(()=>{progress.credits=10000;progress.upgrades.damage=4;});await frame.locator('#shop').click();
  await frame.locator('[data-upgrade="damage"]').click();assert.equal(await frame.locator('[data-upgrade="damage"] .filled').count(),5);assert(await frame.locator('[data-upgrade="damage"]').isDisabled());assert.match(await frame.locator('[data-upgrade="damage"]').textContent(),/MAX/);
  const maxMoney=await frame.evaluate(()=>progress.credits);await frame.evaluate(()=>document.querySelector('[data-upgrade="damage"]').click());assert.equal(await frame.evaluate(()=>progress.credits),maxMoney);
  await page.setViewportSize({width:430,height:932});const hp=await frame.evaluate(()=>player.hp);await frame.locator('[data-upgrade="armor"]').tap();assert.equal(await frame.evaluate(()=>player.hp),hp+25);
  assert(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await frame.locator('.card').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'/tmp/bulk-v'+release.major+'-armory-mobile.png'});
  await frame.getByRole('button',{name:'Wróć na statek',exact:true}).click();await page.setViewportSize({width:1440,height:1050});
  const result=await frame.evaluate(()=>{
   beginMission(0);run.clock=999;indo=999;player.x=0;player.z=15;mouse.down=mouse.has=false;keys={};inv=999;
   const types=['reaper','elite','collector','husk','geth','banshee','boss'];
   const models=types.map((type,i)=>spawnEnemy(type,-18+i*6,-14));
   for(const e of models){const r=e.model.userData.animation;if(!r)throw Error('Missing rig '+e.type);for(const leg of r.legs){let count=0;leg.traverse(o=>{if(o.isMesh)count+=o.geometry.attributes.position.count;});if(!count)throw Error('Batched-away leg '+e.type);}}
   for(let i=0;i<35;i++)update(1/60);
   for(const e of models.filter(e=>e.type!=='banshee')){const r=e.model.userData.animation;if(r.phase<=0||r.moving<=0)throw Error('No walking '+e.type);}
   const geth=models.find(e=>e.type==='geth'),r=geth.model.userData.animation;
   const phase=r.phase;for(let i=0;i<35;i++)animateEnemy(geth,1/60);if(r.phase!==phase||r.moving>.01)throw Error('Idle bird walk while stationary');
   const before=hostile.length;enemyShot(geth);animateEnemy(geth,1/60);
   if(hostile.length<=before||!r.muzzle.visible||r.gun.position.z>=r.gunRestZ)throw Error('Shooting recoil/flash missing');
   for(let i=0;i<20;i++)animateEnemy(geth,1/60);if(r.muzzle.visible||Math.abs(r.gun.position.z-r.gunRestZ)>.001)throw Error('Recoil did not settle');
   const husk=models.find(e=>e.type==='husk'),count=hostile.length;enemyShot(husk);if(hostile.length!==count)throw Error('Husk unexpectedly shoots');
   Object.assign(husk,{x:player.x+.3,z:player.z});inv=0;update(1/60);if(husk.model.userData.animation.melee<=0)throw Error('Missing melee attack pose');inv=999;
   const old=geth.model;retireEnemy(geth);geth.hp=0;const reused=spawnEnemy('geth',4,-15);
   if(reused.model!==old||old.userData.animation.phase!==0||old.userData.animation.shot!==0||old.userData.animation.muzzle.visible)throw Error('Pool pose reset failed');
   const snap=snapshot();if(!validSaveSnapshot(snap)||JSON.stringify(snap).includes('animation'))throw Error('Animation leaked into save schema');
   const shots=hostile.length,hpNow=player.hp;mode='panel';const pose=reused.model.userData.animation.legs[0].rotation.x;for(let i=0;i<10;i++)updateVisuals(.1);if(reused.model.userData.animation.legs[0].rotation.x!==pose||hostile.length!==shots||player.hp!==hpNow)throw Error('Animation changes paused simulation');mode='combat';
   // Warm every rig in view; isolate pose updates from projectile/effect creation and culling.
   camera.position.set(0,65,60);camera.lookAt(0,0,0);renderer.render(scene,camera);
   const geometryCount=renderer.info.memory.geometries;
   for(let i=0;i<120;i++){for(const e of enemies){e.x+=.025;animateEnemy(e,1/60);}renderer.render(scene,camera);}
   if(renderer.info.memory.geometries!==geometryCount)throw Error('New GPU geometry allocated during animation');
   return {calls:renderer.info.render.calls,geometries:geometryCount,actors:models.length};
  });
  assert(result.calls<260,'Seven animated enemies must retain a bounded draw-call budget');
  await page.screenshot({path:'/tmp/bulk-v'+release.major+'-enemy-animation.png'});
  await frame.evaluate(()=>{
   wipeCombat();run.clock=999;run.spawned=0;indo=999;player.x=0;player.z=14;aim={x:0,z:-10};mouse.down=mouse.has=false;keys={};dodgeCooldown=0;inv=0;mode='combat';spawnEnemy('reaper',-20,-17).t=999;updateVisuals(1/60);
  });
  await frame.locator('#world').click({position:{x:500,y:300}});await frame.evaluate(()=>{mouse.down=false;aim={x:0,z:-10};});
  await page.keyboard.down('KeyD');await page.keyboard.press('KeyR');
  const dash=await frame.evaluate(()=>{
   const start=player.x;for(let i=0;i<6;i++){update(1/60);updateVisuals(1/60);}renderer.render(scene,camera);
   if(dashTime<=0||dodgeVisual.life<=0||heroPose.quaternion.angleTo(new THREE.Quaternion())<.1||dodgeTrailMesh.count===0||!hero.root.visible)throw Error('R has no visible roll/trail');
   if(dodgeTrailMesh.count>12||particles.length>120||player.x<=start)throw Error('Unbounded or nonmoving dodge');
   const pose=heroPose.quaternion.clone(),life=dodgeVisual.life;mode='panel';updateVisuals(.1);if(heroPose.quaternion.angleTo(pose)>1e-7||dodgeVisual.life!==life)throw Error('Paused dash should stay frozen');mode='combat';
   return {count:dodgeTrailMesh.count,distance:player.x-start};
  });
  assert(dash.distance>2);await page.screenshot({path:'/tmp/bulk-v'+release.major+'-dodge.png'});await page.keyboard.up('KeyD');
  await frame.evaluate(()=>{keys={};for(let i=0;i<50;i++){update(1/60);updateVisuals(1/60);}if(dodgeVisual.life||dodgeTrailMesh.count||heroPose.quaternion.angleTo(new THREE.Quaternion())>1e-7)throw Error('Dash did not settle');wipeCombat();if(dodgeTrailMesh.count)throw Error('Trail survived arena reset');});
  await frame.evaluate(()=>{
   // Different constructors share the same animation contract, including saved bosses.
   for(const type of BETRAYAL_TYPES){const e=spawnEnemy(type,5,-12),r=e.model.userData.animation;if(r.legs.length!==2||r.arms.length!==2)throw Error('Missing traitor limbs');e.x+=.1;animateEnemy(e,1/60);enemyShot(e);animateEnemy(e,1/60);if(!r.muzzle.visible||r.phase<=0)throw Error('Traitor walk/fire missing');}
   progress.completed=[0,1,2,3,4,5,6];beginMission(EXCEL_MISSION);inv=999;
   const e=enemies.find(e=>e.type==='excel'),r=e.model.userData.animation;if(r.legs.length!==2||r.arms.length!==2)throw Error('Missing workbook limbs');
   e.x+=.1;animateEnemy(e,1/60);addExcelDuplicateShot(e,0,10,42,1);animateEnemy(e,1/60);if(r.phase<=0||!r.muzzle.visible)throw Error('Workbook animation missing');
   const saved=JSON.parse(JSON.stringify(snapshot()));if(!validSaveSnapshot(saved))throw Error('Invalid animated boss checkpoint');restore(saved);
   const loaded=enemies.find(e=>e.type==='excel').model.userData.animation;if(!loaded||loaded.phase||loaded.shot||loaded.muzzle.visible)throw Error('Restored boss pose was not reset');
   updateVisuals(1/60);renderer.render(scene,camera);if(!enemies[0].model.userData.excelShield.visible)throw Error('Workbook shield hidden by articulation');
  });
  assert.deepEqual(errors,[]);
  console.log('PASS armory: seven clickable cards, five segments, actual prices/costs, keyboard/touch, unaffordable/MAX, capacity-only healing and old save schema.');
  console.log('PASS campaign poses: actual movement/idle, firing/recoil/muzzle, melee, pooled reset, pause, stable GPU geometry, bounded draws, real R roll/ribbon and cleanup.',JSON.stringify(result));
 }finally{await browser?.close();await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
