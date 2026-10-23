'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ORIGIN = process.env.BULK_ORIGIN || 'http://127.0.0.1:3000';
const GAME_URL = ORIGIN + '/Bulk-Import-Omega-3D-v8.html';
const OUT = '/tmp/bulk-v8-test';
(async () => {
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(ORIGIN+'/')&&!r.url().startsWith('data:'))external.push(r.url())});
  await page.goto(GAME_URL);
  await page.getByRole('button',{name:'▶ ROZPOCZNIJ KAMPANIĘ'}).click();
  await page.evaluate(()=>{
   audioOn=false;
   if(VERSION!==8||SAVE_KEY!=='bulk-import-omega-3d-v8'||progress.version!==8)throw Error('Wrong v8 save namespace');
   if(mode!=='hub'||sceneKind!=='hub'||npcObjects.length!==2||!renderer.getContext())throw Error('WebGL hub failed');
   if(MISSIONS.length!==7)throw Error('Expected seven campaign missions');
   if(!['reaper','elite','collector','boss','husk','geth','banshee'].every(t=>Object.hasOwn(TYPES,t)))throw Error('Missing legacy or new enemy types');
   let x=player.x;keys={KeyD:true};update(.08);let normal=player.x-x;player.x=x;keys.ShiftLeft=true;update(.08);keys={};if(player.x-x<=normal)throw Error('Sprint failed');
   const o=obstacleDefs[0];player.x=o.x-o.w/2-.6;player.z=o.z;x=player.x;moveActor(player,.3,0);if(player.x!==x)throw Error('World collision failed');
   beginMission(0);run.clock=999;indo=999;
   if(npcObjects.length||sceneKind!=='combat')throw Error('Crew entered combat');
   player.x=0;player.z=4;aim={x:0,z:-5};keys.Space=true;update(.08);keys={};if(!bullets.length||!bullets[0].model.isObject3D)throw Error('Weapon failed');
   wipeCombat();run.clock=999;indo=999;
   let e=spawnEnemy('elite',10,-4),base=spawnEnemy('reaper',-10,-4);if(e.hp<=base.hp||TYPES.elite.damage<=TYPES.reaper.damage)throw Error('Elite stats failed');
   let cr=progress.credits,rew=TYPES.reaper.reward;hurtEnemy(base,99999);if(progress.credits<cr+rew)throw Error('Kill reward failed');cr=progress.credits;hurtEnemy(base,99999);if(progress.credits!==cr)throw Error('Duplicate reward');
   wipeCombat();run.clock=999;player.hp=50;player.x=0;player.z=17;update(.01);if(player.hp!==85||medkits[1].ready)throw Error('Medkit failed');medkits[1].timer=.01;update(.02);if(player.hp!==100)throw Error('Medkit respawn failed');medkits[1].ready=true;update(.01);if(!medkits[1].ready)throw Error('Full health consumed medkit');
   player.x=-21;player.z=1;useRelay();if(player.x!==21||relayCooldown<=0)throw Error('Relay failed');e=spawnEnemy('elite',player.x-2,player.z);let hp=e.hp;massEffect();if(e.hp>=hp||massCooldown<=0)throw Error('Mass effect failed');
   wipeCombat();run.clock=999;player.x=0;player.z=5;keys={KeyD:true};dodgeCooldown=0;dodgeRoll();if(dashTime<=0||dodgeCooldown<=0||inv<=0)throw Error('Dodge failed');update(.08);keys={};if(blocked(player.x,player.z,.5))throw Error('Dodge collision failed');
   let intervalBefore=interval();let d={x:player.x,z:player.z,life:12,type:'turbo'};d.model=dropModel(d);drops.push(d);update(.01);if(overdrive<=5.8||interval()>=intervalBefore)throw Error('Turbo failed');
   combo=comboTime=0;hurtEnemy(spawnEnemy('reaper',-18,-10),99999);hurtEnemy(spawnEnemy('reaper',18,-10),99999);if(combo<2||comboTime<=0)throw Error('Combo failed');
   wipeCombat();run.spawned=totalEnemies();update(.01);if(mode!=='panel'||pendingWave!==2||sceneKind!=='hub'||npcObjects.length!==2)throw Error('Ship intermission failed');
   closePanel(false);mode='break';
  });
  console.log('PASS base v6 mechanics preserved, ship/crew separation, seven mission declaration, three new type declaration');

  await page.evaluate(()=>{mode='break';conversation(0,'break')});
  assert.equal(await page.locator('#panel-body svg.crew-portrait').count(),1,'Character portrait visible');
  assert.equal(await page.locator('#panel-body .relationship-meter').count(),2,'Affection and trust percentages visible');
  const initial=await page.evaluate(()=>({a:progress.crew[0].affection,t:progress.crew[0].trust,answer:crewScene(0,0).answers[0]}));
  await page.getByRole('button',{name:'Odprawa, załoga i ostatnie wydarzenia'}).click();
  assert.equal(await page.locator('#panel-actions button').filter({hasText:/^[123]\. /}).count(),3,'Three meaningful answer options');
  await page.locator('#panel-actions button').filter({hasText:initial.answer[0]}).click();
  await page.evaluate(before=>{let c=progress.crew[0];if(c.affection<=before.a||c.trust<=before.t)throw Error('Positive dialogue did not improve attitude');let a=c.affection,t=c.trust;if(applyCrewAnswer(0,'debrief',before.answer)!==false||c.affection!==a||c.trust!==t)throw Error('Consumed topic can be farmed')},initial);
  assert(await page.getByRole('button',{name:/✓ Odprawa, załoga i ostatnie wydarzenia/}).isDisabled());
  let priorRelation=await page.evaluate(()=>({a:progress.crew[0].affection,t:progress.crew[0].trust,mood:relationshipMood(progress.crew[0]).id}));
  await page.getByRole('button',{name:'Coś osobistego — poznajmy się lepiej'}).click();
  const negativeText=await page.evaluate(()=>crewScene(0,1).answers.find(a=>a[1]<0&&a[2]<0)[0]);await page.locator('#panel-actions button').filter({hasText:negativeText}).click();
  await page.evaluate(before=>{let c=progress.crew[0];if(c.affection>=before.a||c.trust>=before.t)throw Error('Negative dialogue did not damage attitude');if(relationshipMood(c).id===before.mood)throw Error('Negative reply did not alter facial mood')},priorRelation);
  await page.screenshot({path:OUT+'-portrait-negative.png'});
  const beforeApology=await page.evaluate(()=>({a:progress.crew[0].affection,t:progress.crew[0].trust}));
  await page.getByRole('button',{name:'Przyznaj się do błędu i zaproponuj naprawę'}).click();
  await page.evaluate(before=>{let c=progress.crew[0];if(c.affection<=before.a||c.trust<=before.t)throw Error('Apology did not repair relationship')},beforeApology);
  assert(await page.getByRole('button',{name:'Przeprosiny omówione — dajmy sobie trochę czasu'}).isDisabled());
  await page.evaluate(()=>{const visit=progress.visit,titles=[new Set(),new Set()];for(let n=0;n<8;n++){progress.visit=n;for(let i=0;i<2;i++)for(let t=0;t<3;t++)titles[i].add(crewScene(i,t).title)}progress.visit=visit;if(titles.some(t=>t.size<12))throw Error('Not enough varied intermission conversations');let c=progress.crew[0];c.affection=74;c.trust=80;conversation(0,'break')});
  assert.equal(await page.getByRole('button',{name:'♥ Chcę z tobą być. Czy ty też?'}).count(),0,'Romance must respect affection threshold');
  await page.evaluate(()=>{let c=progress.crew[0];c.affection=80;c.trust=59;conversation(0,'break')});
  assert.equal(await page.getByRole('button',{name:'♥ Chcę z tobą być. Czy ty też?'}).count(),0,'Romance must respect trust threshold');
  await page.evaluate(()=>{let c=progress.crew[0];c.affection=80;c.trust=70;conversation(0,'break')});
  await page.getByRole('button',{name:'♥ Chcę z tobą być. Czy ty też?'}).click();
  await page.evaluate(()=>{if(progress.partner!=='Vael'||relationshipMood(progress.crew[0]).id!=='romantic')throw Error('Mutual romance or portrait failed');let c=progress.crew[1];c.affection=80;c.trust=70;conversation(1,'break')});
  assert.equal(await page.getByRole('button',{name:'♥ Chcę z tobą być. Czy ty też?'}).count(),0,'Romance is exclusive');
  await page.evaluate(()=>{let c=progress.crew[0];c.affection=25;c.trust=25;conversation(0,'break');applyCrewAnswer(0,'values',['Nie obchodzisz mnie.',-20,-20,'To krzywdzące.']);conversation(0,'break');if(progress.partner!==null||relationshipMood(c).id!=='hostile')throw Error('Hostile outcome must affect romance and portrait');const a=c.affection,t=c.trust;progress.visit++;conversation(0,'break');if(c.usedTopics.length)throw Error('New visit did not unlock new topics');applyCrewAnswer(0,'apology',['Przepraszam.',5,10,'Dziękuję.']);if(c.affection<=a||c.trust<=t)throw Error('Negative relationship cannot recover');c.affection=62;c.trust=57;c.bond=2;conversation(0,'break');save()});
  assert.equal(await page.locator('#panel-body svg.crew-portrait').getAttribute('data-mood'),'warm');
  await page.screenshot({path:OUT+'-portrait-positive.png'});
  await page.getByRole('button',{name:'Wróć na pokład'}).click();
  console.log('PASS portraits/emotions, positive/negative replies, percentages, anti-farming, apology, varied scenes, romance thresholds/exclusivity/breakup');


  await page.evaluate(()=>{
   closePanel(false);mode=pendingWave?'break':'hub';progress.credits=10000;shopMenu();
  });
  await page.getByRole('button',{name:/Wzmacniacz/}).click();
  await page.getByRole('button',{name:/Akcelerator/}).click();
  await page.getByRole('button',{name:'Wróć na statek'}).click();
  await page.evaluate(()=>{if(progress.upgrades.damage!==1||progress.upgrades.rate!==1)throw Error('Upgrade purchase failed');resumeHarvest();run.clock=999;indo=999;wipeCombat();player.hp=77;spawnEnemy('elite',12,-15).hp=7;save();mode='panel'});
  await page.reload();await page.getByRole('button',{name:'▶ KONTYNUUJ KAMPANIĘ'}).click();
  await page.evaluate(()=>{if(run.wave!==2||player.hp!==77||enemies[0].hp!==7||progress.upgrades.damage!==1||progress.crew[0].affection!==62||progress.crew[0].trust!==57||npcObjects.length)throw Error('Active mission restore failed');startQTE()});
  for(const key of await page.evaluate(()=>qte.sequence))await page.keyboard.press(key.toLowerCase());
  await page.evaluate(()=>{if(mode!=='combat'||qte)throw Error('QTE success failed');let hp=player.hp;startQTE();qte.left=.01;update(.02);if(player.hp!==hp-20||mode!=='combat')throw Error('QTE timeout failed');pause()});
  console.log('PASS weapon upgrades, active save reload, QTE success and failure');

  await page.evaluate(()=>{
   closePanel(false);mode='hub';progress.completed=[0,1,2,3,4,5];
   const layouts=[],hp=[],counts=[];
   for(let i=0;i<MISSIONS.length;i++){
    beginMission(i);run.clock=999;indo=999;layouts.push(JSON.stringify(obstacleDefs));
    if(blocked(0,15,.6)||blocked(0,17,.6)||blocked(0,-17,.6))throw Error('Mission'+i+' blocks player start or medical pads');
    const e=spawnEnemy('reaper',0,-18);hp.push(e.hp);counts.push(totalEnemies());
    for(const type of ['husk','geth','banshee']){const m=spawnEnemy(type,-18,3);if(!m.model?.isObject3D||!m.model.userData.hpGroup||!m.model.userData.hpFill)throw Error('New enemy model/health bar missing:'+type)}
   }
   if(new Set(layouts).size!==MISSIONS.length)throw Error('Campaign maps duplicate');
   if(hp[hp.length-1]<=hp[0]||counts[counts.length-1]<=counts[0])throw Error('Difficulty does not rise');
   beginMission(0);run.clock=999;indo=999;player={x:0,z:8,hp:100};inv=0;let h=spawnEnemy('husk',0,10.5);h.t=999;for(let n=0;n<35;n++)update(.016);if(player.hp===100)throw Error('Husk melee cannot reach/contact player');
   wipeCombat();run.clock=999;let geth=spawnEnemy('geth',0,-5);enemyShot(geth);if(hostile.length!==3)throw Error('Geth precision volley missing');
   wipeCombat();run.clock=999;let banshee=spawnEnemy('banshee',12,8);banshee.specialTimer=0;updateEnemySpecial(banshee,.01);let warning=combatWarnings.find(w=>w.kind==='blink');if(!warning||warning.timer<1)throw Error('Banshee teleport not warned');let bx=banshee.x,bz=banshee.z;updateCombatTelegraphs(warning.timer+.01);if(banshee.x===bx&&banshee.z===bz)throw Error('Banshee warned teleport failed');

   wipeCombat();run=null;mode='hub';player={x:19,z:-13,hp:100};buildEnvironment('hub');useRelay();if(run?.mission!==3)throw Error('Omega should enter intermediate chapter3');
   beginMission(6);run.wave=MISSIONS[6].waves;run.spawned=totalEnemies();run.bossSpawned=false;indo=999;update(.01);
   const boss=enemies.find(e=>e.type==='boss');if(!boss||boss.maxHp<600)throw Error('Final boss is missing or not sufficiently tough');
   boss.hp=boss.maxHp*.6;hud();
   if(!$('boss-phase').textContent.includes('II'))throw Error('Final boss second phase label missing');
   boss.hp=boss.maxHp*.2;hud();if(!$('boss-phase').textContent.includes('III'))throw Error('Final boss third phase label missing');
   pause();
  });
  await page.screenshot({path:OUT+'-boss.png'});
  await page.evaluate(()=>{
   closePanel(false);mode='combat';indo=999;let boss=enemies.find(e=>e.type==='boss');
   boss.hp=boss.maxHp*.2;boss.bossPhase=3;boss.specialTimer=0;boss.castTime=0;boss.attackIndex=0;combatWarnings.length=0;
   updateBossMechanics(boss,.01);
   if(!combatWarnings.length||combatWarnings.some(w=>w.timer<1))throw Error('Boss attack must be telegraphed');
   let hp=player.hp;updateCombatTelegraphs(.2);if(player.hp!==hp)throw Error('Telegraph damaged before warning elapsed');
   let w=combatWarnings.find(w=>w.kind==='impact');if(!w)throw Error('No aimed impact warning');
   updateCombatTelegraphs(Math.max(0,w.timer-.15));keys={KeyD:true};dodgeCooldown=0;dodgeRoll();update(.2);keys={};
   if(player.hp!==hp)throw Error('Timed invulnerable dodge did not evade boss warning');
   combatWarnings.length=0;boss.specialTimer=0;boss.castTime=0;boss.attackIndex=1;updateBossMechanics(boss,.01);
   let nova=combatWarnings.find(w=>w.kind==='nova');if(!nova)throw Error('Final boss radial nova missing');let shots=hostile.length;updateCombatTelegraphs(nova.timer+.01);if(hostile.length<=shots)throw Error('Nova did not emit dodgeable shots');
   while(enemies.length<MAX_ACTIVE_ENEMIES)spawnEnemy('husk',-20,-12);if(spawnEnemy('reaper',20,-12)!==null||enemies.length!==MAX_ACTIVE_ENEMIES)throw Error('Encounter cap exceeded');
  });

  await page.evaluate(()=>{closePanel(false);mode='combat';indo=999;for(const e of enemies)hurtEnemy(e,99999);update(.01);if(!progress.won||!progress.completed.includes(6)||run!==null)throw Error('Final campaign victory failed');closePanel(false);mode='hub';save()});
  console.log('PASS seven maps, harder mission stats, new3D enemies, Omega, final boss phases and campaign victory');

  await page.evaluate(()=>{progress.completed=[0,1,2];progress.won=false;beginMission(2);run.clock=999;indo=999;player.hp=77;spawnEnemy('elite',8,-14).hp=7;pause()});
  await page.keyboard.press('p');await page.mouse.move(550,400);let yaw=await page.evaluate(()=>camYaw);await page.mouse.down({button:'right'});await page.mouse.move(650,410,{steps:3});await page.mouse.up({button:'right'});await page.evaluate(y=>{if(camYaw===y)throw Error('Orbit failed')},yaw);let zoom=await page.evaluate(()=>camZoom);await page.mouse.wheel(0,180);await page.evaluate(z=>{if(camZoom===z)throw Error('Zoom failed')},zoom);
  await page.click('#saves');const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Eksportuj zapis JSON'}).click()]);await download.saveAs(OUT+'-export.json');let data=JSON.parse(fs.readFileSync(OUT+'-export.json'));assert.equal(data.progress.version,8);assert.equal(data.active.run.mission,2);
  await page.evaluate(()=>progress.credits=999999);await page.setInputFiles('#import-file',OUT+'-export.json');await page.waitForFunction(()=>$('notice').textContent.includes('Progres wczytany'));await page.evaluate(expected=>{if(progress.credits!==expected||run.mission!==2||!enemies[0].model)throw Error('JSON import failed')},data.progress.credits);
  fs.writeFileSync(OUT+'-invalid.json','{"progress":{"version":8}}');await page.setInputFiles('#import-file',OUT+'-invalid.json');await page.waitForFunction(()=>$('notice').textContent.includes('Niepoprawny'));await page.evaluate(()=>{if(run?.mission!==2)throw Error('Invalid import damaged state');wipeCombat();run.spawned=totalEnemies();mode='combat';update(.01);save()});
  await page.reload();await page.getByRole('button',{name:'▶ KONTYNUUJ KAMPANIĘ'}).click();await page.evaluate(()=>{if(pendingWave!==2||sceneKind!=='hub')throw Error('Intermission restore failed');resumeHarvest();if(run.wave!==2||npcObjects.length)throw Error('Continue harvest failed');player.hp=0;die();if(run||sceneKind!=='hub')throw Error('Death recovery failed')});
  await page.reload();let prior=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));await page.reload();assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),prior,'Welcome should not overwrite save');
  console.log('PASS camera, JSON roundtrip, invalid imports, ship save, death, welcome save protection');

  const legacyProgress={version:6,credits:371,records:1200,kills:15,upgrades:{damage:2,rate:3},completed:[0,1,2,3],crew:[{name:'Vael',role:'Proteanin · archiwista',bond:3,lastTalk:3},{name:'Syra',role:'Proteanka · inżynierka',bond:1,lastTalk:2}],partner:'Vael',visit:5,won:true};
  fs.writeFileSync(OUT+'-legacy-winner.json',JSON.stringify({version:6,progress:legacyProgress,active:null,pendingWave:0}));
  await page.setInputFiles('#import-file',OUT+'-legacy-winner.json');
  await page.waitForFunction(()=>progress.version===8&&progress.credits===371&&mode==='hub');
  await page.evaluate(()=>{if(progress.won||!progress.legacyVictory||progress.completed.length!==4||progress.completed.includes(6))throw Error('Legacy victory skipped v8 chapters');if(progress.partner!=='Vael'||progress.crew[0].affection<75||progress.crew[0].trust<60)throw Error('Migrated romance lost thresholds');beginMission(6);if(run)throw Error('Legacy winner incorrectly unlocked finale');beginMission(4);if(run?.mission!==4)throw Error('Legacy winner cannot enter next new chapter');pause()});
  const legacyActive={version:6,progress:{...legacyProgress,credits:877,completed:[0,1,2],won:false},pendingWave:0,active:{run:{mission:3,wave:3,spawned:16,clock:999,bossSpawned:true},player:{x:0,z:15,hp:77},enemies:[{type:'boss',x:0,z:-10,hp:91,maxHp:210,t:1,phase:0,specialTimer:3,bossPhase:1,summonedMask:0}],bullets:[],hostile:[],drops:[],medkits:[{x:0,z:-17,ready:true,timer:0},{x:0,z:17,ready:true,timer:0}],massCooldown:0,relayCooldown:0,indo:15,overdrive:4,dodgeCooldown:1,combo:3,comboTime:2}};
  fs.writeFileSync(OUT+'-legacy-active.json',JSON.stringify(legacyActive));await page.setInputFiles('#import-file',OUT+'-legacy-active.json');
  await page.waitForFunction(()=>progress.version===8&&progress.credits===877&&run?.mission===3&&mode==='combat');
  await page.evaluate(()=>{if(player.hp!==77||enemies[0].hp!==91||enemies[0].maxHp!==210||overdrive<=0||combo!==3)throw Error('Active legacy mission not preserved');pause()});
  const badRelation=await page.evaluate(()=>{let d=JSON.parse(JSON.stringify(snapshot()));d.progress.crew[0].affection=101;return d});fs.writeFileSync(OUT+'-bad-relation.json',JSON.stringify(badRelation));await page.setInputFiles('#import-file',OUT+'-bad-relation.json');await page.waitForFunction(()=>$('notice').textContent.includes('Niepoprawny'));await page.evaluate(()=>{if(progress.credits!==877||progress.crew[0].affection>100||run?.mission!==3)throw Error('Invalid relation import changed progress')});
  console.log('PASS v6 completed and active migration, legacy romance, new chapter unlocks, invalid affection import protection');

  // V8 defenses: purchases, practical damage flow and saved capacities.
  await page.evaluate(()=>{
   newCampaign();progress.credits=100000;player.hp=50;player.shield=0;
   if(!buyUpgrade('armor')||player.hp!==75||maxHealth()!==125)throw Error('Armor purchase must add capacity delta only');
   if(!buyUpgrade('shield')||player.shield!==25||maxShield()!==25)throw Error('Shield purchase must add capacity delta');
   const before=progress.credits;if(buyUpgrade('__proto__')||progress.credits!==before)throw Error('Unknown upgrade accepted');
   for(const key of UPGRADE_KEYS)while(progress.upgrades[key]<5)if(!buyUpgrade(key))throw Error('Cannot buy upgrade '+key);
   if(maxHealth()!==225||maxShield()!==125||healAmount()!==50||Math.abs(damageReduction()-.3)>1e-9||bioticCooldown()!==3||dodgeRecharge()!==1.25)throw Error('Upgrade level5 stats incorrect');
   const credits=progress.credits;if(buyUpgrade('shield')||progress.credits!==credits)throw Error('Max upgrade repurchase charged credits');
   beginMission(0);run.clock=999;indo=999;wipeCombat();
   if(player.hp!==225||player.shield!==125)throw Error('Mission did not initialize upgraded capacities');
   const upgrades=JSON.stringify(progress.upgrades);if(buyUpgrade('armor')||JSON.stringify(progress.upgrades)!==upgrades)throw Error('Upgrade purchase permitted in combat');
   player.hp=200;player.shield=25;inv=0;const hit=applyIncomingDamage(40,{ignoreInv:true,grantInv:false});
   if(player.shield!==0||Math.abs(player.hp-189.5)>1e-8||hit.shieldDamage!==25||Math.abs(hit.healthDamage-10.5)>1e-8||player.rechargeWait!==4)throw Error('Shield/armor damage layering failed');
   updateDefenses(3.9);if(player.shield!==0)throw Error('Shield regenerated during recharge delay');updateDefenses(.1);if(player.shield>1e-6)throw Error('Shield regained before full4s delay');updateDefenses(1);if(Math.abs(player.shield-18)>1e-6)throw Error('Shield regen rate incorrect');
   inv=0;applyIncomingDamage(5,{grantInv:false});if(player.rechargeWait!==4)throw Error('Fresh hit did not restart recharge delay');
   player.shield=120;player.rechargeWait=0;updateDefenses(3);if(player.shield!==125)throw Error('Shield exceeded capacity');
   const hp=player.hp,shield=player.shield;inv=.5;const blockedHit=applyIncomingDamage(100);if(!blockedHit.blocked||player.hp!==hp||player.shield!==shield)throw Error('Dodge invulnerability ignored by defense pipeline');inv=0;
   player.hp=150;player.x=0;player.z=17;medkits[1].ready=true;update(.01);if(player.hp!==200||medkits[1].ready)throw Error('Upgraded medkit does not heal50HP');player.hp=225;medkits[1].ready=true;update(.01);if(!medkits[1].ready)throw Error('Full upgraded health consumed medkit');
   player.x=0;player.z=5;const e=spawnEnemy('banshee',0,7),enemyHP=e.hp;massCooldown=0;massEffect();if(Math.abs(enemyHP-e.hp-bioticDamage())>1e-7||massCooldown!==bioticCooldown())throw Error('Biotic upgrade not applied to mass effect');
   dodgeCooldown=0;keys={KeyD:true};dodgeRoll();keys={};if(dodgeCooldown!==1.25)throw Error('Mobility upgrade not applied to dodge');
   player.hp=177;player.shield=61;player.rechargeWait=2.25;save();restore(JSON.parse(JSON.stringify(snapshot())));if(player.hp!==177||player.shield!==61||player.rechargeWait!==2.25||progress.upgrades.shield!==5)throw Error('Defense save roundtrip lost fields');pause();
  });
  await page.evaluate(()=>{
   player.x=4;player.z=6;player.hp=maxHealth()*.5;player.shield=maxShield()*.25;syncHeroVitals();
   if(heroVitals.group.parent!==actors||!heroVitals.group.visible||heroVitals.group.position.y<3||Math.abs(heroVitals.group.position.x-player.x)>.01||Math.abs(heroVitals.group.position.z-player.z)>.01)throw Error('Player health bar not floating above character');
   if(Math.abs(heroVitals.group.quaternion.dot(camera.quaternion))<.9999)throw Error('Player health bar does not face camera');
   const hpHalf=heroVitals.hpFill.scale.x,shieldQuarter=heroVitals.shieldFill.scale.x;player.hp=maxHealth();player.shield=maxShield();syncHeroVitals();
   if(Math.abs(hpHalf/heroVitals.hpFill.scale.x-.5)>1e-6||Math.abs(shieldQuarter/heroVitals.shieldFill.scale.x-.25)>1e-6)throw Error('Player overhead health/shield bar does not represent ratios');
   const geometries=renderer.info.memory.geometries,textures=renderer.info.memory.textures;for(let n=0;n<600;n++)syncHeroVitals();if(renderer.info.memory.geometries!==geometries||renderer.info.memory.textures!==textures)throw Error('Player overhead bar allocates per frame');
   hud();
  });
  await page.screenshot({path:OUT+'-player-bars.png'});
  console.log('PASS five defense/power upgrades, purchases/caps, shield-first damage, armor,4s regen delay, medkits, biotics, dodge, defense persistence');

  // Import v7 as a real previous-version save, retaining rich relationship and active battle state.
  const previousV7=await page.evaluate(()=>{
   const d=JSON.parse(JSON.stringify(snapshot()));d.version=7;d.progress.version=7;d.progress.credits=1907;d.progress.upgrades={damage:2,rate:3};d.progress.completed=[0,1,2,3,4,5,6];d.progress.won=true;d.progress.legacyVictory=false;
   d.progress.crew[0].affection=68;d.progress.crew[0].trust=73;d.progress.crew[0].bond=2;d.progress.crew[0].history=['Vael pamięta odpowiedź z poprzedniej wersji.'];d.progress.crew[0].lastOutcome={text:'Import zachowuje pamięć rozmowy.',affection:8,trust:6};
   for(const c of d.progress.crew){delete c.departed;delete c.betrayal;delete c.betrayalDue}
   d.active.run={mission:6,wave:4,spawned:0,clock:999,bossSpawned:false};d.active.player={x:0,z:15,hp:77};d.active.enemies=[];d.active.bullets=[];d.active.hostile=[];d.active.drops=[];d.active.massCooldown=1.25;d.active.relayCooldown=2;d.active.indo=15;d.active.overdrive=4;d.active.dodgeCooldown=1.1;d.active.combo=3;d.active.comboTime=2;d.pendingWave=0;return d;
  });
  fs.writeFileSync(OUT+'-previous-v7.json',JSON.stringify(previousV7));await page.setInputFiles('#import-file',OUT+'-previous-v7.json');
  await page.waitForFunction(()=>progress.version===8&&progress.credits===1907&&mode==='combat');
  await page.evaluate(()=>{const c=progress.crew[0];if(!progress.won||progress.completed.length!==7||run?.mission!==6||run.wave!==4||player.hp!==77||player.shield!==0||player.rechargeWait!==0||progress.upgrades.damage!==2||progress.upgrades.rate!==3||progress.upgrades.armor!==0||progress.upgrades.mobility!==0||c.affection!==68||c.trust!==73||c.history[0]!=='Vael pamięta odpowiedź z poprzedniej wersji.'||c.lastOutcome.text!=='Import zachowuje pamięć rozmowy.'||c.departed||c.betrayal!=='none'||combo!==3||overdrive<=0)throw Error('V7 migration changed campaign, battle, upgrades, relation or dialogue memory');pause()});
  console.log('PASS v7 full campaign and active battle migration, exact affection/trust/history, new upgrade defaults');

  // Newly introduced fields must fail validation before replacing the current game.
  const validV8=await page.evaluate(()=>JSON.parse(JSON.stringify(snapshot())));
  const invalidCases=[['armor-level',d=>d.progress.upgrades.armor=6],['shield-capacity',d=>d.active.player.shield=126],['recharge-delay',d=>d.active.player.rechargeWait=5],['health-capacity',d=>d.active.player.hp=226],['betrayal-enum',d=>d.progress.crew[0].betrayal='duplicated']];
  for(const [label,corrupt] of invalidCases){const d=JSON.parse(JSON.stringify(validV8));corrupt(d);const file=OUT+'-invalid-'+label+'.json';fs.writeFileSync(file,JSON.stringify(d));await page.setInputFiles('#import-file',file);await page.waitForFunction(()=>$('notice').textContent.includes('Niepoprawny'));await page.evaluate(()=>{if(progress.credits!==1907||run?.mission!==6||player.hp!==77)throw Error('Invalid v8 import partially replaced state')})}
  console.log('PASS invalid v8 upgrade, health, shield, recharge and betrayal fields rejected without replacing progress');

  // A departure needs BOTH meters0, remains permanent, and creates one next-encounter enemy.
  await page.evaluate(()=>{
   newCampaign();const c=progress.crew[0];c.affection=0;c.trust=1;evaluateCrewDeparture(0);if(!crewAvailable(0)||c.departed)throw Error('Crew departed with positive trust');c.affection=1;c.trust=0;evaluateCrewDeparture(0);if(!crewAvailable(0)||c.departed)throw Error('Crew departed with positive affection');
   c.affection=c.trust=0;progress.partner='Vael';evaluateCrewDeparture(0);if(!c.departed||c.betrayal!=='pending'||c.betrayalDue||crewAvailable(0)||progress.partner!==null)throw Error('Zero/zero departure not scheduled correctly');buildEnvironment('hub');if(npcObjects.length!==1)throw Error('Departed crew still has ship NPC');
   if(applyCrewAnswer(0,'apology',['Przepraszam.',100,100,'Wrócę.'])!==false||c.affection!==0||c.trust!==0||!c.departed)throw Error('Departed crew can be recovered through dialogue');
   conversation(0,'hub');if(Array.from($('panel-actions').querySelectorAll('button')).some(b=>/poznajmy|Przyznaj|Chcę z tobą/.test(b.textContent)))throw Error('Departed crew dialogue remains available');closePanel(false);mode='hub';
   restore(JSON.parse(JSON.stringify(snapshot())));if(!progress.crew[0].departed||progress.crew[0].betrayal!=='pending'||npcObjects.length!==1)throw Error('Pending departure not persistent');
   beginMission(0);run.clock=999;indo=999;spawnPendingBetrayals();if(enemies.filter(e=>e.type==='traitorVael').length!==1||progress.crew[0].betrayal!=='active')throw Error('Betrayer did not spawn next mission');const first=enemies.find(e=>e.type==='traitorVael');if(!first.model?.isObject3D||first.hp<=0)throw Error('Betrayer lacks living3D model');
   spawnPendingBetrayals();if(enemies.filter(e=>e.type==='traitorVael').length!==1)throw Error('Repeated spawn duplicated betrayer');
   restore(JSON.parse(JSON.stringify(snapshot())));spawnPendingBetrayals();if(enemies.filter(e=>e.type==='traitorVael').length!==1||progress.crew[0].betrayal!=='active')throw Error('Active save duplicated or lost betrayer');
   hurtEnemy(enemies.find(e=>e.type==='traitorVael'),99999);if(progress.crew[0].betrayal!=='defeated'||progress.crew[0].betrayalDue)throw Error('Betrayer kill not permanently recorded');
   restore(JSON.parse(JSON.stringify(snapshot())));spawnPendingBetrayals();if(enemies.some(e=>e.type==='traitorVael')||progress.crew[0].betrayal!=='defeated')throw Error('Defeated betrayer respawned after restore');
   wipeCombat();returnToShip(false);closePanel(false);mode='break';const syra=progress.crew[1];syra.affection=syra.trust=0;evaluateCrewDeparture(1);if(syra.betrayal!=='pending'||syra.betrayalDue)throw Error('Intermission departure must wait next harvest');buildEnvironment('hub');if(npcObjects.length)throw Error('Both departed crew remain aboard');
   resumeHarvest();run.clock=999;indo=999;spawnPendingBetrayals();if(enemies.filter(e=>e.type==='traitorSyra').length!==1||enemies.some(e=>e.type==='traitorVael'))throw Error('Next-harvest betrayal scheduling failed');
   player.hp=0;die();if(progress.crew[1].betrayal!=='pending'||progress.crew[1].betrayalDue||npcObjects.length)throw Error('Death did not requeue surviving betrayer without restoring NPC');
   beginMission(0);run.clock=999;indo=999;spawnPendingBetrayals();spawnPendingBetrayals();if(enemies.filter(e=>e.type==='traitorSyra').length!==1)throw Error('Retry duplicated or lost surviving betrayer');hurtEnemy(enemies.find(e=>e.type==='traitorSyra'),99999);wipeCombat();returnToShip(true);closePanel(false);mode='hub';beginMission(1);run.clock=999;indo=999;spawnPendingBetrayals();if(enemies.some(e=>/^traitor/.test(e.type))||progress.crew.some(c=>c.betrayal!=='defeated'))throw Error('Defeated betrayers returned in later mission');save();pause();
  });
  await page.reload();await page.getByRole('button',{name:'▶ KONTYNUUJ KAMPANIĘ'}).click();await page.evaluate(()=>{spawnPendingBetrayals();if(progress.crew.some(c=>!c.departed||c.betrayal!=='defeated')||enemies.some(e=>/^traitor/.test(e.type))||npcObjects.length)throw Error('Betrayal final persistence failed');pause()});
  console.log('PASS both-zero departure, permanent missing NPC/dialogue, next mission/harvest betrayer, active-save uniqueness, defeat persistence, death requeue');

  await page.evaluate(()=>{setQuality('fast');if(renderer.getPixelRatio()>1.01||renderer.shadowMap.enabled)throw Error('Fast graphics failed');Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});save();if(storageOK||!$('save-status').textContent.includes('ZABLOKOWANY'))throw Error('Storage denial hidden')});
  await page.setViewportSize({width:430,height:932});await page.evaluate(()=>{closePanel(false);mode='hub';wipeCombat();run=null;pendingWave=0;buildEnvironment('hub');crewMenu()});await page.screenshot({path:OUT+'-mobile.png'});
  assert.deepEqual(errors,[],'Browser errors');assert.deepEqual(external,[],'No external resources may be needed');
  console.log('PASS fast quality, storage denial, mobile dialog rendering, offline self-contained assets; no page errors');
 } finally { await browser.close() }
})().catch(e=>{console.error(e);process.exit(1)});
