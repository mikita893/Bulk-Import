


'use strict';
const campaignStorage=window.parent.BulkUnified?.storage||localStorage;
let shellSuspended=false,terminalPanelOpen=false;
const SHIP_TERMINAL=Object.freeze({x:0,z:-8,radius:3.6});
const $=id=>document.getElementById(id),SAVE_KEY='bulk-import-omega-3d-v10',VERSION=10;
const JOKES=['„W kosmosie nikt nie usłyszy twojego INVALID_FIELD.”','Żniwiarz: „Mam licencję Enterprise. Ty masz tylko życie.”','Syra: „To nie romans. To relacja many-to-one. Za twoją zgodą.”','Vael: „Naszą cywilizację zgubił import z wyłączonym backupem.”','„Włącz reguły duplikatów. Jeden Zwiastun w zupełności wystarczy.”','Żniwiarz: „Ten arkusz ma tylko 47 zakładek. Prawie jak baza danych!”','„Governor limits? Ja wolę limit Żniwiarzy: zero.”','Syra: „Chemia między nami? Status: Successfully Upserted.”','„Nie strzelaj w produkcję. Chyba że produkcja sprzedaje Excela.”','Zbieracz: „RODO? Ja zbieram tylko publiczne profile… i planety.”','„Data Loader nie pyta, czy jesteś gotowy. Pyta o separator.”','„Zwiastun ma 1200 HP i zero pokory. Jak konsultant po certyfikacji.”','„Żniwiarze wysłali ofertę w XLSX. Kwarantanna załącznika trwa.”','„Apex Predator? Raczej Apex CPU time limit exceeded.”','„Miłość to jedyny obiekt, na którym nie robimy hard delete.”','„Import udany. Błędne rekordy: cała galaktyka.”','„Zapisałem backup jako final_final_NAPRAWDE_ostateczny.csv.”','„Zwiastun: PRZEJMUJĘ KONTROLĘ. Admin: insufficient privileges.”','„401 Unauthorized. Nawet inwazja potrzebuje permission seta.”','„Validation Rule: ISBLANK(Sumienie) && ISPICKVAL(Rasa, Żniwiarz).”'];
JOKES.push('Excel: „Przecież u mnie działa”. Salesforce: „To pokaż error.csv”.','Żniwiarz: „Mam VLOOKUP”. Admin: „Mam broń i External ID”.','„Ctrl+Z nie działa na inwazję. Sprawdziłem.”','„Błąd migracji: kolumna Imię zawiera całą biografię komandora.”','„Żniwiarz ma 12 HP. Arkusz ma 12 właścicieli i żadnego admina.”','„Excel pyta, czy zapisać zmiany. Salesforce pyta, kto ci dał uprawnienia.”','„Nie ufaj plikowi, który nazywa się backup_bez_backup.xlsx.”','„Flow triggered. Kawa spilled. Żniwiarz killed.”','„Merge Cells? My tu robimy Merge Civilizations.”','„TURBO CSV: bo Batch Apex czekałby do poniedziałku.”','„Zbieracze proszą o wszystkie pola. Znowu SELECT * w mailu.”','„Salesforce nie jest drogi. To Excel dolicza koszt psychoterapii.”','„Relacja z Syrą: Master–Detail? Nie. Dwoje równych adminów.”','„Słowo null nie znaczy bezpiecznie. W tym pliku to nazwisko klienta.”','„Przeciwnik odporny na pociski. Spróbuj mu puścić validation rule.”','„Zwiastun: Załóżmy, że nie będzie duplikatów. Narrator: Były.”','„Żniwiarze nie mają backupu. Mają confidence.”','„Dziś żniwa, jutro szkolenie z przecinka dziesiętnego.”','„Named Credential: Zwiastun. Uprawnienia: żadne. Dzień dobry.”','„Import 99%… sprawdzanie 12 milionów rekordów… kawa 0%.”','„Ta inwazja mogła być mailem. Najlepiej bez załącznika.”','„Excel nazywa to tabelą. Proteanie nazywają to ostrzeżeniem.”','„Deduplikacja zakończona. Pozostał jeden Żniwiarz i jego manager.”','„Błąd CSV: Żniwiarz otworzył przecinek w średniku.”');
function fresh(){return {version:10,credits:0,records:0,kills:0,upgrades:{damage:0,rate:0,armor:0,shield:0,plating:0,biotic:0,mobility:0},completed:[],crew:createCrewDefaults(),partner:null,visit:0,won:false,excelFirstFormCleared:false}}
let progress=fresh(),active=false,storageOK=true,mode='intro',returnMode='hub',sceneKind='hub',run=null,pendingWave=0,player={x:0,z:8,hp:100,shield:0,rechargeWait:0},keys={},mouse={x:0,y:0,down:false,right:false},aim={x:0,z:0},enemies=[],bullets=[],hostile=[],drops=[],medkits=[],particles=[],pulses=[],qte=null,time=0,last=0,walk=0,shotClock=0,massCooldown=0,relayCooldown=0,inv=0,saveClock=0,indo=15,noticeTime=0,jokeClock=0,camYaw=0,camZoom=1,focusPause=false,modalBack=null,shake=0,muzzle=0;
let audioOn=true,audioCtx=null;
const settings=readSettings();let renderScale=1,adaptiveRatio=1,hudClock=0,radarClock=0,dodgeCooldown=0,dashTime=0,dashX=0,dashZ=1,overdrive=0,combo=0,comboTime=0,hudNeedsUpdate=true;const runtimeStats={fps:60,renderMs:0,simulationSteps:0,frames:0};
function readSettings(){try{let q=JSON.parse(campaignStorage.getItem('bulk-import-3d-settings')||'{}');return {quality:['auto','fast','high'].includes(q.quality)?q.quality:'auto'}}catch(e){return {quality:'auto'}}}

function sound(freq=220,dur=.08,type='sine',volume=.025){if(!audioOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.45),audioCtx.currentTime+dur);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}}
const canvas=$('world');let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,stencil:false,powerPreference:'high-performance',precision:'mediump'});renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15}catch(err){document.querySelector('.viewport').innerHTML='<div class="error">Do uruchomienia tej wersji potrzebna jest przeglądarka z WebGL. Włącz akcelerację sprzętową i odśwież stronę. Wróć do menu i spróbuj w przeglądarce obsługującej WebGL.</div>';throw err}
const scene=new THREE.Scene();scene.background=new THREE.Color(0x040a14);scene.fog=new THREE.FogExp2(0x091220,.009);
const camera=new THREE.PerspectiveCamera(47,1,.1,350),raycaster=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
scene.add(new THREE.HemisphereLight(0xc1e5ff,0x24324a,2.2));const sun=new THREE.DirectionalLight(0xdbebff,3.1);sun.position.set(-20,35,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=100;sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;scene.add(sun);const fill=new THREE.DirectionalLight(0x55d3e9,1);fill.position.set(15,12,-20);scene.add(fill);
const G={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(1,10,8),cyl:new THREE.CylinderGeometry(1,1,1,8),cone:new THREE.ConeGeometry(1,1,8),plane:new THREE.PlaneGeometry(1,1)};
const materials={};function mat(color,metal=.45,rough=.42,emit=0,intensity=1){let k=[color,emit,intensity].join();return materials[k]??=new THREE.MeshLambertMaterial({color,emissive:emit,emissiveIntensity:intensity})}
const M={steel:mat(0x34495a,.75,.36),dark:mat(0x142436,.65,.35),edge:mat(0x627f91,.7,.3),black:mat(0x101925,.5,.4),white:mat(0xb4c9cf,.5,.4),blue:mat(0x75ddd5,.4,.3,0x1dbbb9,2),gold:mat(0xa17b48,.65,.4),glass:new THREE.MeshBasicMaterial({color:0x73c8e9,transparent:true,opacity:.08,depthWrite:false,side:THREE.FrontSide})};
function mesh(parent,geo,m,x,y,z,sx=1,sy=1,sz=1,shadow=true){let o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
function box(parent,m,x,y,z,sx,sy,sz,shadow=true){return mesh(parent,G.box,m,x,y,z,sx,sy,sz,shadow)}
function sphere(parent,m,x,y,z,r){return mesh(parent,G.sphere,m,x,y,z,r,r,r)}
function cyl(parent,m,x,y,z,r,h){return mesh(parent,G.cyl,m,x,y,z,r,h,r)}
function tube(parent,a,b,r,m){let va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),o=mesh(parent,G.cyl,m,...va.clone().add(vb).multiplyScalar(.5).toArray(),r,d.length(),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o}
let labelTextures=[];
function textSprite(parent,text,x,y,z,color='#9feaff',width=4,height=.65){let c=document.createElement('canvas'),a=c.getContext('2d');a.font='600 48px Arial';c.width=Math.ceil(a.measureText(text).width+34);c.height=80;a.font='600 48px Arial';a.textAlign='center';a.textBaseline='middle';a.fillStyle=color;a.fillText(text,c.width/2,40);let tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;labelTextures.push(tex);let spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,opacity:.92}));spr.position.set(x,y,z);spr.scale.set(width*Math.min(1,c.width/500),height,1);parent.add(spr);return spr}
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;let gc=glowCanvas.getContext('2d'),grad=gc.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'#fff');grad.addColorStop(.12,'#ffffffaa');grad.addColorStop(.5,'#ffffff22');grad.addColorStop(1,'#ffffff00');gc.fillStyle=grad;gc.fillRect(0,0,64,64);const glowTex=new THREE.CanvasTexture(glowCanvas);
function glow(parent,color,x,y,z,size=3,opacity=.6){let s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity}));s.position.set(x,y,z);s.scale.setScalar(size);parent.add(s);return s}
const sky=new THREE.Group();scene.add(sky);let starPos=[];for(let i=0;i<1100;i++){let v=new THREE.Vector3(Math.random()-.5,Math.random()*.7,Math.random()-.5).normalize().multiplyScalar(100+Math.random()*50);starPos.push(v.x,v.y,v.z)}let sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));sky.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0x9cb7dd,size:.19,transparent:true,opacity:.8})));let planet=sphere(sky,mat(0x1e546a,.1,.9,0x112637,.3),-53,14,-75,20);let atmosphere=new THREE.Mesh(new THREE.SphereGeometry(20.8,32,24),new THREE.MeshBasicMaterial({color:0x42b9dc,transparent:true,opacity:.11,side:THREE.BackSide,blending:THREE.AdditiveBlending}));atmosphere.position.copy(planet.position);sky.add(atmosphere);let ring=new THREE.Mesh(new THREE.TorusGeometry(28,.09,8,128),new THREE.MeshBasicMaterial({color:0x5394b3,transparent:true,opacity:.45}));ring.position.copy(planet.position);ring.rotation.set(1.1,.3,-.3);sky.add(ring);
let environment=new THREE.Group(),actors=new THREE.Group(),effects=new THREE.Group();scene.add(environment,actors,effects);let obstacleDefs=[],relayObjects=[],npcObjects=[],holo=null,reactor=null,envAccent=0x73e7e2;
function floorTexture(color){let c=document.createElement('canvas');c.width=c.height=512;let a=c.getContext('2d');a.fillStyle=color;a.fillRect(0,0,512,512);a.strokeStyle='#415364';a.lineWidth=3;a.strokeRect(4,4,504,504);a.lineWidth=1;for(let i=0;i<4;i++){a.strokeStyle='#2e4253';a.strokeRect(13+i*3,13+i*3,486-i*6,486-i*6)}a.fillStyle='#69808c';for(let x of [17,495])for(let y of [17,495])a.fillRect(x-2,y-2,4,4);a.fillStyle='#1c2c3b';a.fillRect(110,500,292,5);let t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(13,11);t.colorSpace=THREE.SRGBColorSpace;return t}
const floorTex=floorTexture('#273847');const floorMat=new THREE.MeshLambertMaterial({color:0x91afba,map:floorTex});

function makeRelay(x,z,color,omega=false){let g=new THREE.Group();g.position.set(x,0,z);environment.add(g);cyl(g,M.black,0,.15,0,2.5,.3);cyl(g,mat(color,.5,.3,color,1.3),0,.33,0,2.2,.12);let m=mat(color,.6,.24,color,2.5);let r1=mesh(g,new THREE.TorusGeometry(2.1,.12,10,64),m,0,3,0);let r2=mesh(g,new THREE.TorusGeometry(2.3,.07,8,64),m,0,3,0);r2.rotation.y=.8;for(let s of [-1,1]){let p=box(g,M.edge,s*2.5,2.4,0,.4,4.7,.65);p.rotation.z=-s*.16;box(g,m,s*2.5,2.7,.36,.13,3,.06)}glow(g,color,0,3,0,6,.5);textSprite(g,omega?'OMEGA / JĄDRO GALAKTYKI':'RETRANSLATOR',0,6,0,omega?'#ff899b':'#a2e8e5',6,.6);relayObjects.push({g,r1,r2,x,z,omega});return g}
function buildHumanoid(kind='human',color=0x73929e){let root=new THREE.Group(),body=new THREE.Group();root.add(body);let armor=mat(color,.65,.35),trim=kind==='human'?M.white:M.gold;let torso=box(body,armor,0,1.75,0,.95,1.05,.5);box(body,M.black,0,1.73,.3,.62,.48,.14);box(body,mat(0x75e8ef,.4,.3,0x39cadb,2),0,1.95,.39,.48,.08,.04);box(body,trim,-.43,2.04,0,.38,.38,.65);box(body,trim,.43,2.04,0,.38,.38,.65);box(body,M.dark,0,1.55,-.38,.6,.75,.3);let head=sphere(body,kind==='human'?mat(0xcbaa8c,.05,.8):mat(0xc4ac77,.25,.65),0,2.63,0,.31);head.scale.multiply(new THREE.Vector3(.85,1.12,.9));if(kind==='human'){sphere(body,M.dark,0,2.78,-.04,.27);box(body,mat(0x91eef4,.35,.25,0x4bbdcd,1),0,2.65,.25,.48,.09,.1);box(body,mat(0xc86158,.5,.4),-.38,1.82,.29,.13,.65,.04)}else{for(let x of [-.14,.14])for(let y of [2.58,2.74])sphere(body,mat(0x221f31,.2,.35),x,y,.27,.065);tube(body,[-.25,2.87,0],[-.36,3.15,-.12],.055,trim);tube(body,[.25,2.87,0],[.36,3.15,-.12],.055,trim)}
let legs=[],arms=[];for(let s of [-1,1]){let leg=new THREE.Group();leg.position.set(s*.26,1.25,0);body.add(leg);box(leg,M.dark,0,-.47,0,.32,.85,.38);box(leg,armor,0,-.5,.19,.27,.39,.1);box(leg,M.black,0,-.98,.09,.39,.28,.61);legs.push(leg);let arm=new THREE.Group();arm.position.set(s*.6,2.08,0);body.add(arm);box(arm,armor,0,-.32,.06,.27,.62,.32);box(arm,kind==='human'?M.white:trim,0,-.63,.2,.29,.21,.3);arms.push(arm)}let gun=new THREE.Group();gun.position.set(.64,1.67,.6);body.add(gun);box(gun,M.dark,0,0,.3,.24,.29,.85);box(gun,M.edge,0,.12,.3,.15,.11,.68);box(gun,M.blue,0,.01,.77,.1,.11,.1);let muzzleGlow=glow(gun,0x8ffff2,0,.02,.9,.9,0);let shadow=new THREE.Mesh(new THREE.CircleGeometry(.8,24),new THREE.MeshBasicMaterial({color:0x020810,transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;root.add(shadow);return {root,body,legs,arms,gun,muzzleGlow}}
const hero=buildHumanoid();batchStaticMeshes(hero.body,[...hero.legs,...hero.arms]);actors.add(hero.root);
function makeEnemy(e){let reused=enemyPools[e.type]?.pop();if(reused){actors.add(reused);reused.userData.retired=false;reused.position.set(e.x,0,e.z);reused.visible=true;return reused}if(e.type==='excel'){const model=makeExcelModel(e);actors.add(model);return model}const traitor=makeBetrayerModel(e);if(traitor){actors.add(traitor);return traitor}const special=makeNewEnemy(e);if(special){actors.add(special);return special}let g=new THREE.Group(),t=TYPES[e.type],m=mat(e.type==='collector'?0x97813e:e.type==='elite'?0x64283f:0x4d4148,.7,.35),em=mat(t.color,.45,.3,t.color,1.5),black=M.dark;let scale=e.type==='boss'?2.55:e.type==='elite'?1.25:1;
if(e.type==='collector'){let body=mesh(g,G.sphere,m,0,1.5,0,.55,.9,.42);sphere(g,mat(0xa89049,.5,.35),0,2.55,.15,.4);for(let s of [-1,1]){let wing=mesh(g,G.sphere,mat(0xd8bd66,.65,.4),s*.65,1.65,-.18,.45,.95,.13);wing.rotation.z=-s*.4;for(let z of [-.2,.3]){tube(g,[s*.3,1.1,z],[s*1.05,.6,z+.35],.1,m);tube(g,[s*1.05,.6,z+.35],[s*1.2,.1,z+.75],.07,M.gold)}tube(g,[s*.4,2.2,0],[s*.95,1.6,.6],.12,m);sphere(g,em,s*.16,2.6,.47,.1)}box(g,black,.8,1.5,.85,.2,.23,.75);glow(g,t.color,0,2.1,.3,2,.4)}else{mesh(g,G.sphere,m,0,1.8,0,.7,1.2,.5);mesh(g,G.cone,m,0,2.9,0,.53,.65,.5);for(let s of [-1,1]){tube(g,[s*.45,2.5,0],[s*1.3,1.4,.3],.16,m);tube(g,[s*1.3,1.4,.3],[s*1.6,.18,.9],.12,m);tube(g,[s*1.6,.18,.9],[s*.8,.4,1.15],.08,M.edge);box(g,em,s*.53,1.6,.46,.13,.7,.12);if(e.type==='elite')box(g,m,s*.85,2.4,0,.7,.6,.65)}box(g,em,0,1.9,.5,.23,1,.12);sphere(g,em,0,2.8,.38,.17);if(e.type==='boss'){let crown=mesh(g,new THREE.TorusGeometry(1.3,.055,8,48),em,0,2.3,0);g.userData.crown=crown;for(let s of [-1,1])tube(g,[s*.6,2.6,0],[s*1.4,3.8,-.1],.12,m)}glow(g,t.color,0,2,.8,2.6,.45)}let hpGroup=new THREE.Group();hpGroup.position.set(0,3.75,0);g.add(hpGroup);box(hpGroup,mat(0x111827,0,.8),0,0,0,1.8,.11,.02,false);let hpFill=box(hpGroup,mat(t.color,0,.6,t.color,.7),0,0,.02,1.7,.07,.02,false);g.userData.hpGroup=hpGroup;g.userData.hpFill=hpFill;g.scale.setScalar(scale);let sh=new THREE.Mesh(new THREE.CircleGeometry(t.r*1.1,24),new THREE.MeshBasicMaterial({color:0x02050a,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.02;g.add(sh);batchStaticMeshes(g,[hpGroup,g.userData.crown].filter(Boolean));actors.add(g);return g}
function buildEnvironment(kind){clearExcelVisuals();sceneKind=kind;for(let t of labelTextures)t.dispose();labelTextures=[];environment.traverse(o=>{if(o.isSprite&&o.material.map!==glowTex)o.material.dispose();if(o.isMesh&&!Object.values(G).includes(o.geometry)&&o.geometry!==undefined)o.geometry.dispose()});scene.remove(environment);environment=new THREE.Group();scene.add(environment);relayObjects=[];npcObjects=[];holo=reactor=null;let id=kind==='hub'?-1:run.mission;envAccent=id<0?0x6febe2:MISSIONS[id].color;obstacleDefs=layout(id);let em=mat(envAccent,.5,.3,envAccent,1.7);floorMat.color.setHex(id===1?0x9284bc:id===2?0xa89d75:id===3?0x988395:0x91afba);box(environment,floorMat,0,-.27,0,52,.5,44,false);box(environment,M.black,0,-.9,0,54,.8,46);for(let x of [-25.5,25.5]){box(environment,M.edge,x,.18,0,.5,.4,44);box(environment,em,x,.43,0,.09,.08,43,false);for(let z=-20;z<21;z+=5){box(environment,M.dark,x,2,z,.65,3.6,.6);box(environment,M.edge,x,3.8,z,.75,.25,.9)}box(environment,M.glass,x,2.1,0,.05,3.2,43,false)}
for(let z of [-21.5,21.5]){box(environment,M.dark,0,1,z,52,2,1);box(environment,em,0,2.05,z,49,.06,.1,false);for(let x=-24;x<=24;x+=6){box(environment,M.edge,x,2.2,z,.5,4.3,.7);if(z<0)box(environment,M.glass,x+2.8,3.1,z,5,2.4,.08,false)}}
for(let x of [-23,23])box(environment,M.black,x,5.4,0,.8,.5,44);for(let z of [-17])box(environment,M.edge,0,5.3,z,49,.35,.5);for(let x of [-18,-6,6,18])box(environment,mat(0xeeeeff,.2,.4,0xbedfff,2),x,5.1,-17,2.5,.05,.3,false);
for(let x of [-19,19]){box(environment,em,x,.015,0,.06,.035,36,false);for(let z=-18;z<=18;z+=4){box(environment,M.gold,x+1,.01,z,1.1,.04,.13,false).rotation.y=.5}}
for(let o of obstacleDefs){let height=id===1?3.3:id===2?2.7:1.7;box(environment,M.dark,o.x,height/2,o.z,o.w,height,o.d);box(environment,M.edge,o.x,height,o.z,o.w+.1,.15,o.d+.1);box(environment,em,o.x,height+.09,o.z+o.d*.4,o.w*.8,.05,.1,false);if(id===1){for(let j=0;j<3;j++)box(environment,em,o.x,height*.25+j*.8,o.z+o.d/2+.03,o.w*.55,.13,.04,false)}else if(id===2){for(let x=-o.w/2+.3;x<o.w/2;x+=1.2)box(environment,M.gold,o.x+x,height*.5,o.z+o.d/2+.03,.12,height*.85,.08)}else {let screen=box(environment,mat(0x12475a,.3,.35,0x1aa9c1,.6),o.x,height+.22,o.z,o.w*.7,.15,o.d*.6);screen.rotation.x=.15}}
for(let x of [-23,23])for(let z of [-12,12]){box(environment,M.dark,x,1,z,2,2,3);box(environment,em,x,2.1,z,1.5,.12,2.1,false)}
if(id<0){let base=cyl(environment,M.dark,0,.3,-11,3.1,.5);cyl(environment,M.edge,0,.6,-11,2.7,.2);holo=new THREE.Group();holo.position.set(0,2.8,-11);environment.add(holo);mesh(holo,new THREE.IcosahedronGeometry(1.35,1),new THREE.MeshBasicMaterial({color:envAccent,wireframe:true,transparent:true,opacity:.6}),0,0,0);let hr=mesh(holo,new THREE.TorusGeometry(2,.025,6,60),em,0,0,0);hr.rotation.x=1.1;glow(holo,envAccent,0,0,0,7,.25);textSprite(environment,'TERMINAL GŁÓWNY / E',0,5,-11,'#9bfff1',7,.65);box(environment,M.dark,0,.65,-8,2.7,1.3,1.4);let terminalScreen=box(environment,em,0,1.45,-8.25,2.3,.12,1);terminalScreen.rotation.x=.25;box(environment,M.edge,0,1.16,-7.55,2.4,.12,.32);textSprite(environment,'MISJE / REKREACJA',0,2.7,-8,'#9bfff1',4.6,.45);makeRelay(19,-13,0xff375e,true);for(let i=0;i<2;i++){if(!crewAvailable(i))continue;let c=progress.crew[i],h=buildHumanoid('prothean',i===0?0x76618d:0x556e9e),p=crewPos(i);batchStaticMeshes(h.body);h.root.position.set(p.x,0,p.z);h.root.rotation.y=i===0?.5:-.5;environment.add(h.root);h.crewIndex=i;npcObjects.push(h);h.label=textSprite(environment,c.name+(progress.partner===c.name?' ♥':''),p.x,4,p.z,'#e0c5ed',3,.55)}box(environment,M.dark,-19,.7,11,5,1.3,2.6);for(let i=-1;i<=1;i++)box(environment,M.edge,-19+i*1.2,1.9,10.5,.35,.25,1.3);textSprite(environment,'ZBROJOWNIA / U',-19,3.3,11,'#d9c6ff',5,.6);textSprite(environment,'SSV BULK IMPORT',0,4.6,-20,'#b9d3dd',8,.75)}else{makeRelay(-21,1,envAccent);makeRelay(21,1,envAccent);if(id===1){for(let x of [-19,0,19]){let artifact=mesh(environment,new THREE.OctahedronGeometry(1.3),mat(0x9b86ca,.6,.3,0x6e44ab,.6),x,2.7,-14);artifact.rotation.z=.3;cyl(environment,M.dark,x,.25,-14,1.8,.5);glow(environment,envAccent,x,2.6,-14,4,.4)}}if(id===2){for(let x of [-20,20])for(let z of [-15,14]){let pod=sphere(environment,mat(0x716344,.45,.55),x,2,z,1);pod.scale.set(1,2.1,1);for(let a=0;a<4;a++){let bar=mesh(environment,new THREE.TorusGeometry(1.02,.06,6,24),em,x,1+a*.65,z);bar.rotation.x=Math.PI/2}}}if(id===FINAL_MISSION){reactor=new THREE.Group();reactor.position.set(0,0,-15);environment.add(reactor);cyl(reactor,M.dark,0,.3,0,4,.6);sphere(reactor,mat(0xffaa66,.3,.2,0xff5533,3),0,5,0,1.1);for(let i=0;i<3;i++){let r=mesh(reactor,new THREE.TorusGeometry(2.4+i*.35,.055,8,72),em,0,5,0);r.rotation.set(i*.8,.4+i,0)}glow(reactor,0xff6044,0,5,0,12,.45)}}
addArenaIdentity(id);let lamp=new THREE.PointLight(envAccent,38,28,2);lamp.position.set(0,5,-10);environment.add(lamp);let rim=new THREE.PointLight(id===3?0xff4466:0x77bfff,30,30,2);rim.position.set(12,5,12);environment.add(rim);medkits=medicalPads();syncMedkits();batchStaticMeshes(environment,[...relayObjects.flatMap(r=>[r.r1,r.r2]),...npcObjects.map(n=>n.root),...medModels,holo,reactor,...getExcelVisualExclusions()].filter(Boolean));cameraSnap()}
let medModels=[];const enemyPools={excel:[],reaper:[],elite:[],collector:[],boss:[],husk:[],geth:[],banshee:[]};
function syncMedkits(){for(let g of medModels)environment.remove(g);medModels=[];for(let m of medkits){let g=new THREE.Group();g.position.set(m.x,.5,m.z);box(g,mat(0xabc1b5,.4,.35),0,0,0,1.1,.5,.75);box(g,mat(0x57ffbd,.3,.3,0x22d58e,2),0,.28,0,.6,.05,.17);box(g,mat(0x57ffbd,.3,.3,0x22d58e,2),0,.28,0,.17,.05,.6);glow(g,0x51ffb0,0,.1,0,2,.35);environment.add(g);medModels.push(g)}}
function crewPos(i){return {x:i===0?-7:7,z:-1}}
function medicalPads(){return [{x:0,z:-17,ready:true,timer:0},{x:0,z:17,ready:true,timer:0}]}
function clearVisuals(){for(let e of enemies)if(e.model)retireEnemy(e);for(let list of [bullets,hostile,drops,particles,pulses])for(let o of list)if(o.model)effects.remove(o.model)}
function cameraSnap(){camera.position.set(player.x+Math.sin(camYaw)*23*camZoom,23*camZoom,player.z+Math.cos(camYaw)*23*camZoom);camera.lookAt(player.x,0,player.z-3)}

function nums(o,ks){return o&&ks.every(k=>Number.isFinite(o[k]))}

function plain(o){return Object.fromEntries(Object.entries(o).filter(([k,v])=>k!=='model'&&k!=='dead'&&typeof v!=='object'))}
function snapshot(){return {version:10,progress,active:run?{run:{...run,...(run.excel?{excel:{...run.excel}}:{})},player:{...player},enemies:enemies.filter(e=>e.hp>0).map(plain),bullets:bullets.filter(b=>!b.dead).map(plain),hostile:hostile.filter(b=>!b.dead).map(plain),drops:drops.map(plain),medkits:medkits.map(plain),massCooldown,relayCooldown,indo,overdrive,dodgeCooldown,combo,comboTime,flowDashCharges,flowDashRecharge}:null,pendingWave,savedAt:new Date().toISOString()}}
function save(){if(!active)return;try{campaignStorage.setItem(SAVE_KEY,JSON.stringify(snapshot()));storageOK=true;$('save-status').textContent='✓ KAMPANIA ZAPISANA'}catch(e){storageOK=false;$('save-status').textContent='⚠ ZAPIS ZABLOKOWANY / EKSPORTUJ JSON'}saveClock=0}
function readSave(key=SAVE_KEY){try{let r=campaignStorage.getItem(key);if(!r)return null;let d=JSON.parse(r);if(key!==SAVE_KEY)return d;if(!validSaveSnapshot(d))return null;return d}catch(e){storageOK=false;return null}}
function notify(t){$('notice').textContent=t;noticeTime=6}
function wipeCombat(){refillZipsert();clearExcelVisuals();combatWarnings.length=0;clearVisuals();combo=comboTime=overdrive=dodgeCooldown=dashTime=0;enemies=[];bullets=[];hostile=[];drops=[];particles=[];pulses=[];keys={};mouse.down=mouse.right=false;shotClock=massCooldown=relayCooldown=inv=0;qte=null;shake=muzzle=0;$('boss-hud').style.display='none'}
function restore(d){if(!validSaveSnapshot(d))throw Error('Niepoprawny zapis');active=true;wipeCombat();progress=d.progress;pendingWave=0;run=d.active?{...d.active.run,...(d.active.run.excel?{excel:{...d.active.run.excel}}:{})}:null;if(d.active){let a=d.active;player={...a.player};pendingWave=Number.isInteger(d.pendingWave)&&d.pendingWave>1&&d.pendingWave<=MISSIONS[run.mission].waves?d.pendingWave:0;buildEnvironment(pendingWave?'hub':'combat');enemies=a.enemies.map(e=>({...e,castTime:0,t:Math.max(.8,e.t),specialTimer:Math.max(2,e.specialTimer??2),model:makeEnemy(e)}));bullets=a.bullets.map(b=>({...b,model:projectile(b,false)}));hostile=a.hostile.map(b=>({...b,model:projectile(b,true)}));drops=a.drops.map(b=>({...b,model:dropModel(b)}));medkits=a.medkits.map(m=>({...m}));syncMedkits();massCooldown=a.massCooldown;relayCooldown=a.relayCooldown;indo=a.indo;overdrive=Math.max(0,Math.min(6,a.overdrive||0));dodgeCooldown=Math.max(0,Math.min(2.5,a.dodgeCooldown||0));combo=Math.max(0,a.combo||0);comboTime=Math.max(0,Math.min(4,a.comboTime||0));flowDashCharges=a.flowDashCharges;flowDashRecharge=a.flowDashRecharge;mode=pendingWave?'break':'combat'}else{player=defensePlayer(0,8);buildEnvironment('hub');mode='hub'}reconcileBetrayalsAfterRestore();if(isExcelMission())showMarcSupport(run.excel);closePanel(false);cameraSnap();hud();save();if(pendingWave)breakMenu();notify('Progres wczytany. Żniwiarze też próbowali cofnąć zmiany — bez backupu.')}

function newCampaign(){active=true;progress=fresh();run=null;pendingWave=0;wipeCombat();player=defensePlayer(0,8);camYaw=0;camZoom=1;buildEnvironment('hub');mode='hub';closePanel(false);hud();save();notify('Podejdź do głównego hologramu: E · terminal z misjami i rekreacją. M — misje · U — broń · F — załoga.')}
function openPanel(title,tag,body='',back=null){terminalPanelOpen=false;returnMode=mode;mode='panel';keys={};mouse.down=mouse.right=false;$('panel').classList.remove('intro');$('panel').style.display='flex';$('panel-title').textContent=title;$('panel-tag').textContent=tag;$('panel-body').innerHTML=body;$('panel-actions').replaceChildren();modalBack=back}
function button(t,fn,cls='',disabled=false){let b=document.createElement('button');b.textContent=t;b.className=cls;b.disabled=disabled;b.onclick=()=>{sound(420,.04,'sine',.012);fn()};$('panel-actions').appendChild(b);return b}
function closePanel(resume=true){terminalPanelOpen=false;$('panel').style.display='none';$('panel').classList.remove('intro');keys={};mouse.down=mouse.right=false;if(resume)mode=returnMode;modalBack=null;hud()}
function safeLocation(){return ['hub','break'].includes(mode)}

function nearShipTerminal(){return sceneKind==='hub'&&Math.hypot(player.x-SHIP_TERMINAL.x,player.z-SHIP_TERMINAL.z)<=SHIP_TERMINAL.radius;}
function shipTerminalMenu(){
 if(!active||!safeLocation()||!nearShipTerminal())return;
 const base=mode,back=()=>{closePanel(false);mode=base;hud();},open=fn=>{back();fn();};
 openPanel('Terminal główny','SSV BULK IMPORT / SYSTEMY POKŁADOWE','<p>Misje, wyposażenie i chwila odpoczynku między importami.</p><div class="terminal-recreation"><b>REKREACJA / BIRD GAME 3</b><p>Leśna arena 3D, pięć ptasich mainów i boty, które nie podpisały NDA. Zapis kampanii czeka na powrót.</p></div>',back);
 terminalPanelOpen=true;
 button('Mapa galaktyki / misje',()=>open(mapMenu),'primary');
 button('Zbrojownia / modyfikacje',()=>open(shopMenu));
 button('Archiwum kampanii / zapis',()=>open(saveMenu));
 button('Rekreacja: Bird Game 3',()=>window.parent.BulkUnified.openBird());
 button('Wróć na pokład',back);
}

function damage(){return 1.8+progress.upgrades.damage*.7}
function interval(){return .155/(1+progress.upgrades.rate*.22)*(overdrive>0?.60:1)}
function hud(){let hub=sceneKind==='hub',m=run?MISSIONS[run.mission]:null;setText('location',hub?'SSV BULK IMPORT / POKŁAD ZAŁOGOWY':isExcelMission()?'FINAŁ / KONIEC ARKUSZA':'MISJA '+String(run.mission+1).padStart(2,'0')+' / '+m.tag);setText('mission-title',hub?(pendingWave?'ODDECH MIĘDZY ŻNIWAMI':'GOTOWI DO SKOKU'):(isExcelMission()&&run.excel?.stage===2?'WŚCIEKŁY EXCEL / DUPLICATE_VALUE':m.name.toUpperCase()));setText('subtitle',hub?'E przy głównym hologramie — terminal, misje i pokładowa rekreacja.':m.desc);setText('phase',hub?'STREFA BEZPIECZNA':isExcelMission()?'OSTATECZNY POJEDYNEK':'POZIOM ZAGROŻENIA');setText('harvest',hub?'NA STATKU':isExcelMission()?'EXCEL.EXE':'ŻNIWA '+run.wave+' / '+m.waves);setText('hp',Math.max(0,Math.ceil(player.hp))+' / '+maxHealth());styleValue('hpbar','width',Math.max(0,player.hp/maxHealth()*100)+'%');setText('shield',maxShield()?Math.ceil(player.shield||0)+' / '+maxShield():'ODBLOKUJ W ZBROJOWNI');styleValue('shieldbar','width',(maxShield()?Math.max(0,(player.shield||0)/maxShield()*100):0)+'%');setText('credits',Math.floor(progress.credits).toLocaleString('pl-PL'));setText('records',progress.records.toLocaleString('pl-PL'));setText('kills',progress.kills);setText('sector',hub?'SSV Bulk Import':m.name);setHTML('progress',MISSIONS.map((m,i)=>'<div style="color:'+(progress.completed.includes(i)?'#96c5bf':'#829db0')+'">'+(progress.completed.includes(i)?'✓ ':'◇ ')+String(i+1).padStart(2,'0')+' / '+m.name+'</div>').join(''));setText('bond',progress.crew.map(c=>c.name+(c.departed?' · poza załogą':(progress.partner===c.name?' ♥':'')+' '+c.affection+'% / zaufanie '+c.trust+'%')).join(' · '));setText('weapon-info','MOC '+damage().toFixed(1)+' / '+(1/interval()).toFixed(1)+' STRZ./S');setText('ability',massCooldown>0?'Q · ODNOWIENIE '+massCooldown.toFixed(1)+' s':'Q · EFEKT MASY GOTOWY');for(let id of ['missions','shop','crew'])if($(id).disabled===hub)$(id).disabled=!hub;let boss=enemies.find(e=>(e.type==='boss'||e.type==='excel')&&e.hp>0);styleValue('boss-hud','display',boss&&!hub?'block':'none');setText('combat-state',(overdrive>0?'TURBO CSV '+overdrive.toFixed(1)+' s / ':'')+(combo>1?'SERIA '+combo+'× / ':'')+(dodgeCooldown>0?'R: '+dodgeCooldown.toFixed(1)+' s':'R: UNIK GOTOWY'));updateExcelHUD();setText('dash-info','C · ZIPsert '+flowDashCharges+'/2'+(flowDashCharges<2?' / ŁADUNEK ZA '+flowDashRecharge.toFixed(1)+' s':' / GOTOWY'));if(boss){setText('boss-name',boss.type==='excel'?(run.excel.stage===2?'WŚCIEKŁY EXCEL':'EXCEL'):'ZWIASTUN');styleValue('boss-bar','width',Math.max(0,boss.hp/boss.maxHp*100)+'%');setText('boss-phase',boss.type==='excel'?'FORMA '+run.excel.stage+'/2 · FAZA '+['','I','II','III'][excelPhase(boss)]+' / '+(run.excel.exposure>0?'OSŁONA PRZEŁAMANA':'OSŁONA AKTYWNA'):(run.mission===FINAL_MISSION?'ZWIASTUN':'AWATAR ZWIASTUNA')+' / FAZA '+['','I','II','III'][bossPhase(boss)])}}


function resumeHarvest(){if(!run||!pendingWave)return;run.wave=pendingWave;pendingWave=0;run.spawned=0;run.clock=1.5;run.bossSpawned=false;wipeCombat();player=defensePlayer(0,15);indo=14;mode='combat';buildEnvironment('combat');armPendingBetrayals();spawnPendingBetrayals();closePanel(false);hud();save()}

function breakMenu(){mode='break';openPanel('Żniwa zakończone','SSV BULK IMPORT / BEZPIECZNY POWRÓT','<p>Zero aktywnych Żniwiarzy. Zero duplikatów. Nietypowo dobry dzień w CRM.</p><p>Pospaceruj po pokładzie, porozmawiaj z załogą lub kup ulepszenia przed kolejnymi żniwami.</p>',()=>{closePanel(false);mode='break';hud()});button('F · Załoga i romanse',()=>{mode='break';crewMenu()});button('U · Modyfikacje broni',()=>{mode='break';shopMenu()});button('Pospaceruj po statku',()=>{closePanel(false);mode='break';hud()});button('▶ Następne żniwa: '+pendingWave,resumeHarvest,'primary')}



function exportSave(){let url=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Bulk-Import-Solo-v__VERSION__-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function saveMenu(){if(!['hub','break','combat'].includes(mode))return;let base=mode,back=()=>{closePanel(false);mode=base;hud()};openPanel('Archiwum kampanii','LOCALSTORAGE / BACKUP BEZ MAKRA','<p>Automatyczny zapis co 2 sekundy walki i przy ważnych zmianach. Zachowuje kampanię, broń, relacje i aktywną misję 3D.</p><p>Różne pliki lokalne mogą mieć osobne localStorage. Przed zmianą wersji wyeksportuj JSON. Import v9/v8 zachowuje misje, relacje i aktywną walkę. Pokonany Excel z v9 odblokowuje od razu jego nową, wściekłą formę. Import v7 także zachowuje dotychczasową kampanię. Po pokonaniu Zwiastuna do ukończenia pozostaje wyłącznie nowy finał z Excelem. W zapisie v7 nowe ulepszenia zaczynają od poziomu 0. Import v6/v5 zachowuje aktywną walkę; v4 przenosi misje, kredyty, ulepszenia i relacje; wrócisz na statek 3D.</p>',back);button('Zapisz teraz',()=>{save();notify(storageOK?'Zapisano. Nawet Żniwiarze szanują backup.':'Przeglądarka blokuje zapis. Użyj eksportu JSON.')});button('Eksportuj zapis JSON',exportSave);button('Importuj zapis v10, v9, v8, v7, v6, v5 lub v4',()=>$('import-file').click());button('Wróć',back);button('Nowa kampania…',()=>{openPanel('Rozpocząć od nowa?','RESET / NIE MA KOSZA W PRZESTRZENI','<p>Obecny zapis zostanie zastąpiony. Najpierw możesz wyeksportować kopię.</p>',back);button('Eksportuj kopię',exportSave);button('Tak, rozpocznij nową kampanię',newCampaign,'danger');button('Anuluj',back)},'danger')}
$('import-file').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{if(f.size>2e6)throw Error();let d=JSON.parse(await f.text());if(d.progress?.version===4)migrateV4(d);else if(d.progress?.version===5)migrateV5(d);else if(d.progress?.version===6)migrateV6(d);else if(d.progress?.version===7)migrateV7(d);else if(d.progress?.version===8)migrateV8(d);else if(d.progress?.version===9)migrateV9(d);else restore(d)}catch(err){notify('Niepoprawny zapis. Bieżący progres pozostaje bez zmian.')}e.target.value=''};
function pause(){if(!['combat','hub','break'].includes(mode))return;let base=mode,back=()=>{closePanel(false);mode=base;hud()};save();openPanel('Pauza','BULK IMPORT / WSPÓLNA GALAKTYKA / V__VERSION__','<p>Walka zatrzymana. Czas na kawę albo wyjaśnienie, dlaczego liczba rekordów się nie zgadza.</p>',back);button('▶ Wznów',back,'primary');button('Zapis / eksport',()=>{mode=base;saveMenu()})}
function die(){requeueBetrayalsAfterDeath();let name=MISSIONS[run.mission].name;run=null;pendingWave=0;progress.visit++;wipeCombat();player=defensePlayer(0,8);mode='hub';buildEnvironment('hub');hud();save();openPanel('Ewakuacja medyczna','MISJA PRZERWANA / '+name,'<p>Załoga zabrała cię na statek. Kredyty, broń i relacje zachowane. Misję możesz powtórzyć.</p><p>Przyczyna błędu: Żniwiarz. Zalecenie supportu: czy próbowałeś strzelić ponownie?</p>');button('Wróć na pokład',()=>{closePanel(false);mode='hub';hud()},'primary')}
function startQTE(){if(mode!=='combat')return;qte={sequence:Array.from({length:4},()=>['W','A','S','D'][Math.floor(Math.random()*4)]),index:0,left:5,total:5};mode='qte';keys={};mouse.down=false;$('panel').classList.remove('intro');$('panel').style.display='flex';$('panel-tag').textContent='ŻNIWIARZE / INDOKTRYNACJA';$('panel-title').textContent='NIE JESTEŚ ARKUSZEM';$('panel-actions').replaceChildren();sound(65,.5,'sawtooth',.03);renderQTE()}
function renderQTE(){if(!qte)return;const key=qte.sequence.join('')+':'+qte.index;if($('panel-body')._qteKey!==key||!$('qte-time')){$('panel-body')._qteKey=key;$('panel-body').innerHTML='<p>„Ustaw separator na średnik. A potem importuj przecinkiem. Zaufaj mi.”<br>Odeprzyj indoktrynację: klawisze po kolei. Błąd: −0,7 s. Walka wstrzymana.</p><div class="qte-row">'+qte.sequence.map((k,i)=>'<b class="'+(i<qte.index?'done':i===qte.index?'active':'')+'">'+k+'</b>').join('')+'</div><div class="qte-meter"><i id="qte-bar"></i></div><p id="qte-time"></p>'}styleValue('qte-bar','width',Math.max(0,qte.left/5*100).toFixed(1)+'%');setText('qte-time',Math.max(0,qte.left).toFixed(1)+' s / porażka: −20 życia')}
function qteKey(k){if(mode!=='qte'||!qte)return;if(k===qte.sequence[qte.index]){qte.index++;sound(500+qte.index*80,.07)}else{qte.left-=.7;sound(100,.15,'sawtooth')}if(qte.index===4)endQTE(true);else if(qte.left<=0)endQTE(false);else renderQTE()}
function endQTE(ok){qte=null;mode='combat';$('panel').style.display='none';keys={};indo=18+Math.random()*6;inv=1.5;if(ok){progress.credits+=40;notify('OPÓR UDANY / +40 CR. Żniwiarz: ACCESS DENIED.');sound(700,.25,'triangle',.03)}else{applyIncomingDamage(20,{ignoreInv:true,bypassShield:true,bypassArmor:true,grantInv:false,pauseRecharge:false});shake=.4;notify('INDOKTRYNACJA / −20 życia. Nie klikaj „Włącz zawartość”.')}if(player.hp<=0)die();else{hud();save()}}
function blocked(x,z,r=.5){return obstacleDefs.some(o=>x+r>o.x-o.w/2&&x-r<o.x+o.w/2&&z+r>o.z-o.d/2&&z-r<o.z+o.d/2)}
function moveActor(a,dx,dz,r=.55){let steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.4));for(let i=0;i<steps;i++){let x=Math.max(-24+r,Math.min(24-r,a.x+dx/steps)),z=Math.max(-20+r,Math.min(20-r,a.z+dz/steps));if(!blocked(x,a.z,r))a.x=x;if(!blocked(a.x,z,r))a.z=z}}
function projectile(b,bad){const o=new THREE.Object3D();o.position.set(b.x,0,b.z);o.rotation.y=Math.atan2(b.vx,b.vz);return o}
function dropModel(d){const o=new THREE.Object3D();o.position.set(d.x,.8,d.z);return o}
function burst(x,z,color,n=12){let limit=settings.quality==='fast'?65:120;n=Math.ceil(n*(settings.quality==='high'?.7:.4));_color.setHex(color);for(let i=0;i<n;i++){let model=new THREE.Object3D();model.position.set(x,1+Math.random()*1.2,z);let a=Math.random()*Math.PI*2,v=1+Math.random()*5;particles.push({model,vx:Math.cos(a)*v,vy:2+Math.random()*4,vz:Math.sin(a)*v,life:.35+Math.random()*.3,r:_color.r,g:_color.g,b:_color.b})}if(particles.length>limit)particles.splice(0,particles.length-limit)}
function killEnemy(e){if(e.dead)return;e.hp=0;e.dead=true;retireEnemy(e);progress.kills++;combo=comboTime>0?combo+1:1;comboTime=4;let bonus=Math.min(5,Math.floor((combo-1)/3))*15;progress.credits+=(e.type==='boss'&&run.mission!==FINAL_MISSION?1000:TYPES[e.type].reward)+bonus;if(combo>1)combatToast((combo>=4?'DEDUPLIKACJA! ' : 'CLEAN IMPORT! ')+combo+'×'+(bonus?' / +'+bonus+' CR':''));progress.records+=e.type==='boss'?5000:100;let d={x:e.x,z:e.z,life:12,type:progress.kills%5===0?'turbo':'csv'};d.model=dropModel(d);drops.push(d);burst(e.x,e.z,TYPES[e.type].color,e.type==='boss'?50:16);sound(e.type==='boss'?55:100,.2,'sawtooth',.025);defeatBetrayer(e);hud()}
function hurtEnemy(e,n){if(e.hp<=0)return;if(excelDamage(e,n))return;e.hp-=n;if(e.hp<=0)killEnemy(e);else{e.flash=.15;burst(e.x,e.z,TYPES[e.type].color,3)}}

function massEffect(){if(mode!=='combat'||massCooldown>0)return;massCooldown=bioticCooldown();let g=new THREE.Mesh(new THREE.TorusGeometry(1,.04,6,80),new THREE.MeshBasicMaterial({color:0xab8fff,transparent:true,opacity:.9}));g.rotation.x=Math.PI/2;g.position.set(player.x,.4,player.z);effects.add(g);pulses.push({model:g,life:.75});for(let b of hostile)if(Math.hypot(b.x-player.x,b.z-player.z)<8){b.dead=true;effects.remove(b.model)}for(let e of enemies){let dx=e.x-player.x,dz=e.z-player.z,d=Math.hypot(dx,dz);if(d<8){hurtEnemy(e,bioticDamage());if(e.type!=='boss'&&e.type!=='excel')moveActor(e,dx/(d||1)*3,dz/(d||1)*3,TYPES[e.type].r)}}burst(player.x,player.z,0xa899ff,30);shake=.18;sound(130,.5,'sine',.055);hud()}
function useRelay(){if(active&&safeLocation()&&nearShipTerminal()){shipTerminalMenu();return;}if(isExcelMission()&&mode==='combat'){tryMarcSupport();return}if(safeLocation()){if(Math.hypot(player.x-19,player.z+13)>6){notify('Podejdź do głównego hologramu, aby otworzyć terminal (E). Czerwona Omega jest na prawym mostku.');return}if(pendingWave){notify('Najpierw zakończ obecną operację. Jeden deployment naraz.');return}if(!progress.completed.includes(2)){notify('Omega zamknięta. Ukończ pierwsze trzy misje. Permission set: GALACTIC_CORE.');return}beginMission(3);return}if(mode!=='combat'||relayCooldown>0)return;let rs=[{x:-21,z:1},{x:21,z:1}],i=rs.findIndex(r=>Math.hypot(player.x-r.x,player.z-r.z)<3.5);if(i<0)return;burst(player.x,player.z,envAccent,20);player.x=rs[1-i].x;player.z=rs[1-i].z;relayCooldown=2;inv=1;burst(player.x,player.z,envAccent,20);sound(330,.35,'sine',.035);cameraSnap()}



function update(dt){time+=dt;noticeTime=Math.max(0,noticeTime-dt);if(!noticeTime)$('notice').textContent='';if(mode==='qte'){if(!focusPause){qte.left-=dt;renderQTE();if(qte.left<=0)endQTE(false)}return}if(!['hub','break','combat'].includes(mode))return;updateDefenses(dt);updateZipsert(dt);jokeClock+=dt;if(jokeClock>8){jokeClock=0;$('quote').textContent=JOKES[Math.floor(Math.random()*JOKES.length)]}
let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),l=Math.hypot(dx,dz)||1,speed=keys.ShiftLeft||keys.ShiftRight?11:7.2;let vx=(dx*Math.cos(camYaw)+dz*Math.sin(camYaw))/l,vz=(dz*Math.cos(camYaw)-dx*Math.sin(camYaw))/l;dodgeCooldown=Math.max(0,dodgeCooldown-dt);overdrive=Math.max(0,overdrive-dt);comboTime=Math.max(0,comboTime-dt);if(!comboTime)combo=0;if(dashTime>0){moveActor(player,dashX*dashSpeed*dt,dashZ*dashSpeed*dt);dashTime=Math.max(0,dashTime-dt)}else moveActor(player,vx*speed*dt,vz*speed*dt);if(dx||dz)walk+=dt*speed*1.8;
for(let i=0;i<medkits.length;i++){let m=medkits[i];if(!m.ready){m.timer-=dt;if(m.timer<=0)m.ready=true}if(m.ready&&player.hp<maxHealth()&&Math.hypot(player.x-m.x,player.z-m.z)<1.35){const healed=Math.min(healAmount(),maxHealth()-player.hp);player.hp+=healed;m.ready=false;m.timer=18;burst(m.x,m.z,0x61ffc1,18);notify('✚ +'+Math.ceil(healed)+' życia. Medigel: jedyny import, który nie wymaga mapowania.');sound(780,.18,'sine',.025);hud();save()}}
if(mode!=='combat'){saveClock+=dt;if(saveClock>5)save();return}inv=Math.max(0,inv-dt);massCooldown=Math.max(0,massCooldown-dt);relayCooldown=Math.max(0,relayCooldown-dt);shotClock=Math.max(-.05,shotClock-dt);if((mouse.down||keys.Space)&&shotClock<=0){let a=Math.atan2(aim.x-player.x,aim.z-player.z),b={x:player.x+Math.sin(a)*.8,z:player.z+Math.cos(a)*.8,vx:Math.sin(a)*34,vz:Math.cos(a)*34,damage:damage()};b.model=projectile(b,false);bullets.push(b);shotClock+=interval();muzzle=.07;sound(400+Math.random()*90,.065,'sawtooth',.009)}
if(isExcelMission())updateExcelEncounter(dt);else{spawnPendingBetrayals();run.clock-=dt;if(run.spawned<totalEnemies()&&run.clock<=0){const pos=[{x:0,z:-18},{x:-22,z:-10},{x:22,z:-10}][run.spawned%3];const e=spawnEnemy(chooseEnemyType(run.spawned),pos.x,pos.z);if(e){run.spawned++;run.clock=Math.max(.36,.72-run.mission*.04)+Math.random()*.22}}
if(hasBossEncounter()&&run.wave===MISSIONS[run.mission].waves&&run.spawned>=totalEnemies()&&!run.bossSpawned&&!enemies.some(e=>e.hp>0)){const e=spawnEnemy('boss',0,-10);if(e){run.bossSpawned=true;indo=Math.min(indo,5);notify(run.mission===FINAL_MISSION?'ZWIASTUN: „1200 HP. TRZY FAZY. ZERO ROLLBACKÓW.”':'AWATAR ZWIASTUNA / Twoja licencja na spokój wygasła.');hud();save();sound(45,.8,'sawtooth',.045)}}
}
for(let e of enemies){if(e.hp<=0)continue;if(e.type==='excel'){updateExcelEnemy(e,dt);continue}updateEnemySpecial(e,dt);let t=TYPES[e.type],dx=player.x-e.x,dz=player.z-e.z,dist=Math.hypot(dx,dz)||1,boss=e.type==='boss',fury=boss&&bossPhase(e)>1,s=enemySpeed(e),vx=dx/dist*s*dt,vz=dz/dist*s*dt,px=e.x,pz=e.z;if(dist>enemyStopDistance(e))moveActor(e,vx,vz,t.r);if(e.x===px&&e.z===pz&&dist>3){let sign=Math.sin(e.phase)>0?1:-1;moveActor(e,-vz*sign,vx*sign,t.r);e.phase+=dt}e.t-=dt;if(e.t<=0){enemyShot(e);e.t=enemyAttackInterval(e)}if(inv===0&&dist<t.r+.65)hurtPlayer(enemyContactDamage(e));e.model.position.set(e.x,Math.sin(time*2+e.phase)*.06,e.z);e.model.rotation.y=Math.atan2(dx,dz);if(e.model.userData.crown)e.model.userData.crown.rotation.z=time*.7;let hp=e.model.userData.hpGroup,fill=e.model.userData.hpFill,pct=Math.max(0,e.hp/e.maxHp);hp.quaternion.copy(_quat.copy(e.model.quaternion).invert().multiply(camera.quaternion));fill.scale.x=1.7*pct;fill.position.x=(pct-1)*.85;e.flash=Math.max(0,(e.flash||0)-dt)}
for(let b of bullets){let steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vz)*dt/.35));for(let i=0;i<steps&&!b.dead;i++){b.x+=b.vx*dt/steps;b.z+=b.vz*dt/steps;if(blocked(b.x,b.z,.05)){b.dead=true;burst(b.x,b.z,0x80e9ef,3);break}let e=enemies.find(e=>e.hp>0&&Math.hypot(e.x-b.x,e.z-b.z)<TYPES[e.type].r);if(e){hurtEnemy(e,b.damage);b.dead=true}}b.model.position.set(b.x,0,b.z)}
for(let b of hostile){b.x+=b.vx*dt;b.z+=b.vz*dt;if(blocked(b.x,b.z,.1))b.dead=true;if(!b.dead&&inv===0&&Math.hypot(b.x-player.x,b.z-player.z)<.72){hurtPlayer(b.damage);b.dead=true}b.model.position.set(b.x,0,b.z)}
for(let d of drops){d.life-=dt;let dist=Math.hypot(d.x-player.x,d.z-player.z);if(dist<5){d.x+=(player.x-d.x)*dt*4;d.z+=(player.z-d.z)*dt*4}d.model.position.set(d.x,.8+Math.sin(time*3)*.15,d.z);d.model.rotation.y=time;if(dist<1){d.life=0;if(d.type==='turbo'){overdrive=6;notify('TURBO CSV / 6 s szybszego ognia! Excel: program nie odpowiada.');sound(950,.2,'triangle',.025)}else{progress.records+=250;progress.credits+=30}burst(d.x,d.z,0x7cfff2,8);sound(880,.08,'sine',.015);hud()}}
updateCombatTelegraphs(dt);enemies=enemies.filter(e=>e.hp>0);for(let list of [bullets,hostile])for(let b of list)if(b.dead||Math.abs(b.x)>27||Math.abs(b.z)>24){b.dead=true;effects.remove(b.model)}bullets=bullets.filter(b=>!b.dead);hostile=hostile.filter(b=>!b.dead);drops=drops.filter(d=>{if(d.life<=0){effects.remove(d.model);return false}return true});if(player.hp<=0){die();return}hudClock+=dt;if(hudClock>=.1){hudClock=0;hud()}if(isExcelMission()){if(run.excel.defeated&&!enemies.some(e=>e.hp>0)){returnToShip(true);return}}else if(run.spawned>=totalEnemies()&&!enemies.length&&!hasPendingBetrayalEncounter()&&(!hasBossEncounter()||run.wave!==MISSIONS[run.mission].waves||run.bossSpawned)){returnToShip(run.wave===MISSIONS[run.mission].waves);return}if(!isExcelMission())indo-=dt;if(!isExcelMission()&&indo<=0&&enemies.length){startQTE();return}saveClock+=dt;if(saveClock>2)save()}
const radar=$('radar'),radarCtx=radar.getContext('2d');
function drawRadar(){let c=radarCtx,w=radar.width,h=radar.height;c.clearRect(0,0,w,h);c.fillStyle='#091522';c.fillRect(0,0,w,h);let sx=w/56,sz=h/48,px=x=>w/2+x*sx,pz=z=>h/2+z*sz;c.strokeStyle='#244457';c.lineWidth=1;for(let x=0;x<w;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}for(let y=0;y<h;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}c.strokeStyle='#527f91';c.strokeRect(px(-25),pz(-21),50*sx,42*sz);c.fillStyle='#426071';for(let o of obstacleDefs)c.fillRect(px(o.x-o.w/2),pz(o.z-o.d/2),o.w*sx,o.d*sz);for(let e of enemies){c.fillStyle='#'+TYPES[e.type].color.toString(16).padStart(6,'0');c.beginPath();c.arc(px(e.x),pz(e.z),e.type==='boss'?8:4,0,Math.PI*2);c.fill()}if(sceneKind==='hub'){for(let i=0;i<2;i++){if(!crewAvailable(i))continue;let p=crewPos(i);c.fillStyle='#c9a5de';c.fillRect(px(p.x)-3,pz(p.z)-3,6,6)}c.strokeStyle='#ff526e';c.beginPath();c.arc(px(19),pz(-13),6,0,Math.PI*2);c.stroke()}if(isExcelMission()&&run.excel.support==='available'){c.fillStyle='#6fceff';c.beginPath();c.arc(px(run.excel.supportX),pz(run.excel.supportZ),6,0,Math.PI*2);c.fill();c.fillStyle='#ffffff';c.font='bold 10px Arial';c.fillText('M',px(run.excel.supportX)-4,pz(run.excel.supportZ)-9)}c.fillStyle='#b5ffee';c.beginPath();c.arc(px(player.x),pz(player.z),4,0,Math.PI*2);c.fill()}
function updateVisuals(dt){const live=['hub','break','combat'].includes(mode);let s=1-Math.exp(-dt*5),bossView=enemies.some(e=>(e.type==='boss'||e.type==='excel')&&e.hp>0)?1.22:1,target=_target.set(player.x+Math.sin(camYaw)*23*camZoom*bossView,23*camZoom*bossView,player.z+Math.cos(camYaw)*23*camZoom*bossView);if(mode==='panel'&&!active){target.set(21,24,26);camera.position.lerp(target,s*.4);camera.lookAt(0,0,-5)}else{camera.position.lerp(target,s);if(shake>0&&live){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake}camera.lookAt(player.x-Math.sin(camYaw)*(bossView>1?5:3),0,player.z-Math.cos(camYaw)*(bossView>1?5:3))}if(live&&mouse.has){camera.updateMatrixWorld();let p=_pointer.set(mouse.x/canvas.clientWidth*2-1,-mouse.y/canvas.clientHeight*2+1),out=_aimPoint;raycaster.setFromCamera(p,camera);if(raycaster.ray.intersectPlane(groundPlane,out)){aim.x=out.x;aim.z=out.z}}if(live){shake=Math.max(0,shake-dt);muzzle=Math.max(0,muzzle-dt)}hero.root.position.set(player.x,0,player.z);let moving=live&&(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight);for(let i=0;i<2;i++)hero.legs[i].rotation.x=moving?Math.sin(walk)*(i===0?1:-1)*.65:0;hero.body.position.y=moving?Math.abs(Math.sin(walk))*.07:0;hero.root.rotation.y=Math.atan2(aim.x-player.x,aim.z-player.z);hero.muzzleGlow.material.opacity=muzzle>0?.9:0;hero.root.visible=inv===0||Math.sin(time*40)>-.35;syncHeroVitals();
for(let i=0;i<medModels.length;i++){medModels[i].visible=medkits[i]?.ready;medModels[i].position.y=.5+Math.sin(time*2+i)*.09;medModels[i].rotation.y=time*.5}for(let r of relayObjects){r.r1.rotation.y=Math.sin(time*.6)*.15;r.r2.rotation.y=time*.45;r.r2.rotation.z=Math.sin(time*.5)*.2}if(holo)holo.rotation.y=time*.25;if(reactor)for(let i=2;i<reactor.children.length;i++)if(reactor.children[i].isMesh){reactor.children[i].rotation.x+=dt*.3;reactor.children[i].rotation.z+=dt*.2}for(let i=0;i<npcObjects.length;i++)npcObjects[i].body.position.y=Math.sin(time*1.5+i)*.025;
for(let p of particles){if(live){p.life-=dt;p.model.position.x+=p.vx*dt;p.model.position.y+=p.vy*dt;p.model.position.z+=p.vz*dt;p.vy-=9*dt;p.model.scale.multiplyScalar(.98)}if(p.life<=0)effects.remove(p.model)}particles=particles.filter(p=>p.life>0);for(let p of pulses){if(live)p.life-=dt;p.model.scale.setScalar(1+(1-p.life/.75)*8);p.model.material.opacity=Math.max(0,p.life/.75);if(p.life<=0){effects.remove(p.model);p.model.geometry.dispose();p.model.material.dispose()}}pulses=pulses.filter(p=>p.life>0);styleValue('damage-flash','opacity',Math.min(.35,shake*.9).toFixed(2));let prompt='';if(safeLocation()){if(Math.hypot(player.x-19,player.z+13)<6)prompt=progress.completed.includes(2)?'E · OMEGA → JĄDRO GALAKTYKI':'OMEGA ZABLOKOWANA / UKOŃCZ 3 MISJE';else if(progress.crew.some((c,i)=>{if(!crewAvailable(i))return false;let p=crewPos(i);return Math.hypot(player.x-p.x,player.z-p.z)<4}))prompt='F · POROZMAWIAJ / ROMANS';else if(nearShipTerminal())prompt='E · TERMINAL GŁÓWNY / MISJE I REKREACJA';else if(Math.hypot(player.x+19,player.z-11)<5)prompt='U · MODYFIKACJE DATA LOADERA';else prompt=pendingWave?'M · NASTĘPNE ŻNIWA / F · ZAŁOGA / U · BROŃ':'M · MISJE / F · ZAŁOGA / PPM · OBRÓĆ KAMERĘ'}else if(mode==='combat'&&isExcelMission()){let st=run.excel;prompt=st.support==='available'?(Math.hypot(player.x-st.supportX,player.z-st.supportZ)<=3.8?'E · POMOC MARCA / PRZEŁAM OSŁONĘ':'NIEBIESKI HOLOGRAM · PODEJDŹ I UŻYJ E'):st.exposure>0?'EXCEL ODSŁONIĘTY · STRZELAJ!':'OSŁONA EXCELA AKTYWNA · WYPATRUJ MARCA'}else if(mode==='combat'&&relayObjects.some(r=>Math.hypot(player.x-r.x,player.z-r.z)<3.5))prompt=relayCooldown>0?'RETRANSLATOR / ODNOWIENIE':'E · SKOK MASY';setText('prompt',prompt);radarClock+=dt;if(radarClock>=.125){radarClock=0;drawRadar()}toastTime=Math.max(0,toastTime-dt);if(!toastTime)styleValue('combo-toast','opacity','0');updateInstances();syncWarningVisuals();syncExcelVisuals(dt)}
addEventListener('resize',resize);resize();
function aimPointer(e){mouse.has=true;let r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;let p=new THREE.Vector2(mouse.x/r.width*2-1,-mouse.y/r.height*2+1);raycaster.setFromCamera(p,camera);let out=new THREE.Vector3();if(raycaster.ray.intersectPlane(groundPlane,out)){aim.x=out.x;aim.z=out.z}let ch=$('crosshair');ch.style.left=mouse.x+'px';ch.style.top=mouse.y+'px'}
canvas.addEventListener('pointermove',e=>{if(mouse.right){camYaw-=e.movementX*.006;camZoom=Math.max(.6,Math.min(1.5,camZoom+e.movementY*.001))}aimPointer(e)});canvas.addEventListener('pointerdown',e=>{aimPointer(e);if(e.button===0)mouse.down=true;if(e.button===2)mouse.right=true;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',e=>{if(e.button===0)mouse.down=false;if(e.button===2)mouse.right=false});canvas.addEventListener('pointercancel',()=>{mouse.down=mouse.right=false});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();camZoom=Math.max(.6,Math.min(1.5,camZoom+e.deltaY*.0006))},{passive:false});canvas.addEventListener('pointerenter',()=>$('crosshair').style.display='block');canvas.addEventListener('pointerleave',()=>{$('crosshair').style.display='none';mouse.down=mouse.right=false;mouse.has=false});
function interactCrew(){if(!safeLocation())return;let i=progress.crew.findIndex((c,i)=>{if(!crewAvailable(i))return false;let p=crewPos(i);return Math.hypot(player.x-p.x,player.z-p.z)<4});if(i<0)crewMenu();else conversation(i,mode)}
addEventListener('keydown',e=>{if(e.code==='Tab')return;if(mode==='qte'){e.preventDefault();if(!e.repeat&&['KeyW','KeyA','KeyS','KeyD'].includes(e.code))qteKey(e.code.slice(3));return}if(mode==='panel'){if(['Escape','KeyP'].includes(e.code)&&modalBack)modalBack();return}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyP')pause();if(e.code==='KeyM')mapMenu();if(e.code==='KeyU')shopMenu();if(e.code==='KeyF')interactCrew();if(e.code==='KeyQ')massEffect();if(e.code==='KeyR')dodgeRoll();if(e.code==='KeyC')zipsertDash();if(e.code==='KeyE')useRelay()});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{keys={};mouse.down=mouse.right=false;focusPause=true;if(!shellSuspended&&['hub','break','combat'].includes(mode))pause()});addEventListener('focus',()=>focusPause=false);addEventListener('pagehide',save);
$('missions').onclick=mapMenu;$('shop').onclick=shopMenu;$('crew').onclick=interactCrew;$('saves').onclick=saveMenu;$('pause').onclick=()=>{if(mode==='panel'&&modalBack)modalBack();else pause()};$('audio').onclick=()=>{audioOn=!audioOn;$('audio').textContent='DŹWIĘK: '+(audioOn?'ON':'OFF');if(audioOn)sound()};
function welcome(){openPanel('','KAMPANIA / WSPÓLNA GALAKTYKA / V__VERSION__','<p>Galaktyka tonie w brudnych danych.<br>Żniwiarze wrócili. I nadal sprzedają Excela.</p><p>Eksploruj statek, rozwijaj relacje i ruszaj na siedem operacji w pełnym 3D i ostatni pojedynek z samym Excelem. Marc Benioff wkracza z ratunkowym deploymentem.</p><p>Na wyposażeniu: widoczna energetyczna tarcza, C · ZIPsert z dwoma ładunkami i WŚCIEKŁY EXCEL, który po pierwszym upadku zaczyna duplikować ostrzał. Marc: „Kto wyłączył Duplicate Rules?!”</p><p style="font-size:10px;color:#7b99ae">WASD — ruch · Mysz — cel · PPM — kamera<br>M — misje · F — załoga · Q — efekt masy</p>');$('panel').classList.add('intro');$('panel-title').innerHTML='BULK<br><em>IMPORT</em><span class="edition">WSPÓLNA GALAKTYKA</span>';let d=readSave();if(d)button('▶ KONTYNUUJ KAMPANIĘ',()=>restore(d),'primary');button(d?'NOWA KAMPANIA…':'▶ ROZPOCZNIJ KAMPANIĘ',()=>{if(d){openPanel('Nowa kampania?','OBECNY ZAPIS ZOSTANIE ZASTĄPIONY','<p>Najpierw możesz kontynuować i wyeksportować zapis.</p>');button('Tak, rozpocznij od nowa',newCampaign,'danger');button('Anuluj',welcome)}else newCampaign()},d?'':'primary');let v9=readSave('bulk-import-omega-3d-v9');if(v9?.progress?.version===9)button('PRZENIEŚ KAMPANIĘ Z V9',()=>{try{migrateV9(v9)}catch(e){notify('Niepoprawny zapis v9. Użyj importu JSON.')}});let v8=readSave('bulk-import-omega-3d-v8');if(v8?.progress?.version===8)button('PRZENIEŚ KAMPANIĘ Z V8',()=>{try{migrateV8(v8)}catch(e){notify('Niepoprawny zapis v8. Użyj importu JSON.')}});let v7=readSave('bulk-import-omega-3d-v7');if(v7?.progress?.version===7)button('PRZENIEŚ KAMPANIĘ Z V7',()=>{try{migrateV7(v7)}catch(e){notify('Niepoprawny zapis v7. Użyj importu JSON.')}});let v6=readSave('bulk-import-omega-3d-v6');if(v6?.progress?.version===6)button('PRZENIEŚ KAMPANIĘ Z V6',()=>{try{migrateV6(v6)}catch(e){notify('Niepoprawny zapis v6. Użyj importu JSON.')}});let previous=readSave('bulk-import-omega-3d-v5');if(previous?.progress?.version===5)button('PRZENIEŚ KAMPANIĘ Z V5',()=>{try{migrateV5(previous)}catch(e){notify('Nie udało się przenieść v5. Użyj importu JSON.')}});let old=readSave('bulk-import-campaign-v4');if(old?.progress?.version===4)button('PRZENIEŚ PROGRES Z V4',()=>{try{migrateV4(old)}catch(e){notify('Nie udało się przenieść zapisu v4. Użyj importu JSON.')}});button('IMPORTUJ ZAPIS JSON / V4 / V5 / V6 / V7 / V8 / V9 / V10',()=>$('import-file').click())}
const _target=new THREE.Vector3(),_aimPoint=new THREE.Vector3(),_pointer=new THREE.Vector2(),_quat=new THREE.Quaternion(),_instance=new THREE.Object3D(),_color=new THREE.Color();
function setText(id,value){const node=$(id),text=String(value);if(node.textContent!==text)node.textContent=text}
function setHTML(id,value){const node=$(id);if(node._html!==value){node._html=value;node.innerHTML=value}}
function styleValue(id,key,value){const node=$(id);if(node.style[key]!==value)node.style[key]=value}
function batchStaticMeshes(root,excluded=[]){
  const skip=new Set(excluded),groups=new Map(),inverse=new THREE.Matrix4();root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert();
  function visit(o){if(skip.has(o))return;if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)){
    const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;let list=groups.get(key);if(!list){list=[];groups.set(key,list)}list.push(o)
  }for(const child of o.children)visit(child)}visit(root);
  for(const meshes of groups.values()){if(meshes.length<2)continue;let n=0,indexCount=0;for(const m of meshes){n+=m.geometry.attributes.position.count;indexCount+=m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count}
    const positions=new Float32Array(n*3),normals=new Float32Array(n*3),uvs=new Float32Array(n*2),indices=new Uint32Array(indexCount);let vertex=0,idx=0;
    for(const m of meshes){const matrix=new THREE.Matrix4().multiplyMatrices(inverse,m.matrixWorld),g=m.geometry.clone().applyMatrix4(matrix),p=g.attributes.position,normal=g.attributes.normal,uv=g.attributes.uv;
      positions.set(p.array,vertex*3);if(normal)normals.set(normal.array,vertex*3);if(uv)uvs.set(uv.array,vertex*2);if(g.index){for(let i=0;i<g.index.count;i++)indices[idx++]=g.index.array[i]+vertex}else{for(let i=0;i<p.count;i++)indices[idx++]=vertex+i}vertex+=p.count;g.dispose();m.parent.remove(m);
      if(!Object.values(G).includes(m.geometry))m.geometry.dispose();
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingSphere();let merged=new THREE.Mesh(geometry,meshes[0].material);merged.castShadow=meshes[0].castShadow;merged.receiveShadow=meshes[0].receiveShadow;merged.matrixAutoUpdate=false;root.add(merged);
  }
}
function retireEnemy(e){if(!e?.model||e.model.userData.retired)return;actors.remove(e.model);e.model.userData.retired=true;if(enemyPools[e.type].length<24)enemyPools[e.type].push(e.model)}
function setQuality(q){if(!['auto','fast','high'].includes(q))return;settings.quality=q;adaptiveRatio=1;try{campaignStorage.setItem('bulk-import-3d-settings',JSON.stringify(settings))}catch(e){}applyQuality();notify(q==='fast'?'TRYB SZYBKI / Excel już się nie wyrabia.':q==='high'?'WYSOKA JAKOŚĆ / cienie włączone.':'AUTO / rozdzielczość dopasuje się do płynności.')}
function applyQuality(){const high=settings.quality==='high';renderer.shadowMap.enabled=high;sun.castShadow=high;renderer.shadowMap.needsUpdate=true;document.body.dataset.quality=settings.quality;const names={auto:'AUTO',fast:'SZYBKA',high:'WYSOKA'};setText('quality','GRAFIKA: '+names[settings.quality]);resize()}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight,base=settings.quality==='high'?Math.min(devicePixelRatio||1,1.35):settings.quality==='fast'?.65:Math.min(devicePixelRatio||1,1);renderScale=Math.min(base,Math.sqrt((settings.quality==='high'?1600000:850000)/(w*h)))*adaptiveRatio;renderer.setPixelRatio(Math.max(.45,renderScale));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function dodgeRoll(){if(mode!=='combat'||dodgeCooldown>0||dashTime>0)return;let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),len=Math.hypot(x,z);if(len){dashX=(x*Math.cos(camYaw)+z*Math.sin(camYaw))/len;dashZ=(z*Math.cos(camYaw)-x*Math.sin(camYaw))/len}else{let dx=aim.x-player.x,dz=aim.z-player.z,l=Math.hypot(dx,dz)||1;dashX=Math.hypot(dx,dz)<.1?Math.sin(hero.root.rotation.y):dx/l;dashZ=Math.hypot(dx,dz)<.1?Math.cos(hero.root.rotation.y):dz/l}dodgeCooldown=dodgeRecharge();dashSpeed=31;dashTime=.18;inv=Math.max(inv,.35);burst(player.x,player.z,0x9cffff,8);sound(230,.1,'sine',.018)}
function combatToast(text){setText('combo-toast',text);styleValue('combo-toast','opacity','1');toastTime=1.4}
let toastTime=0;

const effectGeometry=new THREE.BoxGeometry(1,1,1),laserMat=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),dropMat=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x174344});
const playerShots=new THREE.InstancedMesh(effectGeometry,laserMat,300),enemyShots=new THREE.InstancedMesh(effectGeometry,laserMat,300),dropInstances=new THREE.InstancedMesh(effectGeometry,dropMat,128);
for(const group of [playerShots,enemyShots,dropInstances]){group.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.count=0;group.frustumCulled=false;effects.add(group)}
const particlePositions=new Float32Array(160*3),particleColors=new Float32Array(160*3),particleGeometry=new THREE.BufferGeometry();particleGeometry.setAttribute('position',new THREE.BufferAttribute(particlePositions,3).setUsage(THREE.DynamicDrawUsage));particleGeometry.setAttribute('color',new THREE.BufferAttribute(particleColors,3).setUsage(THREE.DynamicDrawUsage));particleGeometry.setDrawRange(0,0);const sparks=new THREE.Points(particleGeometry,new THREE.PointsMaterial({size:.19,map:glowTex,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));sparks.frustumCulled=false;effects.add(sparks);
function updateInstances(){
  for(const [list,inst,bad] of [[bullets,playerShots,false],[hostile,enemyShots,true]]){let n=0;for(const b of list){if(b.dead||n>=300)continue;_instance.position.set(b.x,1.5,b.z);_instance.rotation.set(0,Math.atan2(b.vx,b.vz),0);_instance.scale.set(bad?(b.duplicate?.23:.17):.07,bad?(b.duplicate?.2:.17):.07,bad?(b.duplicate?.67:.55):.95);_instance.updateMatrix();inst.setMatrixAt(n,_instance.matrix);_color.setHex(bad?(b.duplicate?(b.copyId===2?0xffc36b:0xff628f):(TYPES[b.type]?.color??0xff577b)):overdrive>0?0xffe28b:0x8ffff2);inst.setColorAt(n++,_color)}inst.count=n;inst.instanceMatrix.needsUpdate=true;if(inst.instanceColor)inst.instanceColor.needsUpdate=true}
  let n=0;for(const d of drops){if(d.life<=0||n>=128)continue;_instance.position.copy(d.model.position);_instance.rotation.set(0,d.model.rotation.y,Math.PI/4);_instance.scale.setScalar(d.type==='turbo'?.7:.5);_instance.updateMatrix();dropInstances.setMatrixAt(n,_instance.matrix);_color.setHex(d.type==='turbo'?0xffd168:0x72f5ee);dropInstances.setColorAt(n++,_color)}dropInstances.count=n;dropInstances.instanceMatrix.needsUpdate=true;if(dropInstances.instanceColor)dropInstances.instanceColor.needsUpdate=true;
  n=0;for(const p of particles){if(n>=160)break;const pos=p.model.position,fade=Math.min(1,p.life*2);particlePositions[n*3]=pos.x;particlePositions[n*3+1]=pos.y;particlePositions[n*3+2]=pos.z;particleColors[n*3]=p.r*fade;particleColors[n*3+1]=p.g*fade;particleColors[n*3+2]=p.b*fade;n++}particleGeometry.setDrawRange(0,n);particleGeometry.attributes.position.needsUpdate=true;particleGeometry.attributes.color.needsUpdate=true;
}

let accumulator=0,lastRendered=0,qualityClock=0,frameAverage=16.7,settingsClock=0;
function frame(now){requestAnimationFrame(frame);if(!last){last=now;lastRendered=now;return}const elapsed=Math.max(0,(now-last)/1000);last=now;if(document.hidden||shellSuspended){accumulator=0;return}const live=['hub','break','combat','qte'].includes(mode);if(!live&&now-lastRendered<50)return;const wall=Math.min(elapsed,.25);if(live){accumulator=Math.min(.25,accumulator+wall);let steps=0;while(accumulator>=1/60&&steps<15){update(1/60);accumulator-=1/60;steps++}runtimeStats.simulationSteps+=steps}else{accumulator=0;update(Math.min((now-lastRendered)/1000,.1))}
const visualDt=Math.min((now-lastRendered)/1000,.25);lastRendered=now;updateVisuals(visualDt);const start=performance.now();renderer.render(scene,camera);runtimeStats.renderMs=performance.now()-start;runtimeStats.frames++;if(live&&elapsed>0){frameAverage=frameAverage*.95+Math.min(250,elapsed*1000)*.05;runtimeStats.fps=1000/frameAverage;qualityClock+=wall;settingsClock+=wall;if(qualityClock>.9&&settings.quality==='auto'){qualityClock=0;let next=adaptiveRatio;if(frameAverage>24)next=Math.max(.58,adaptiveRatio-(frameAverage>40?.18:.08));else if(frameAverage<18)next=Math.min(1,adaptiveRatio+.025);if(next!==adaptiveRatio){adaptiveRatio=next;resize()}}if(settingsClock>.5){settingsClock=0;setText('fps',Math.round(runtimeStats.fps)+' FPS')}}}
addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;lastRendered=last;if(document.hidden&&['combat','hub','break'].includes(mode))pause()});
$('quality').onclick=()=>{let choices=['auto','fast','high'];setQuality(choices[(choices.indexOf(settings.quality)+1)%choices.length])};
// v7 relationship system. All portraits are procedural inline SVG; no network or 3D render cost.
function relationshipClamp(value,min=0,max=100){return Math.max(min,Math.min(max,value))}
function createCrewDefaults(){return [{name:'Vael',role:'Proteanin · archiwista',affection:35,trust:40,bond:1,lastTalk:-1,dialogueVisit:-1,usedTopics:[],history:[],lastOutcome:null,friendship:false,...createBetrayalDefaults()},{name:'Syra',role:'Proteanka · inżynierka',affection:35,trust:40,bond:1,lastTalk:-1,dialogueVisit:-1,usedTopics:[],history:[],lastOutcome:null,friendship:false,...createBetrayalDefaults()}]}
function normalizeCrew(crew,partner=null){const defaults=createCrewDefaults();return defaults.map((base,i)=>{const c=crew?.[i]||{},legacy=Number.isInteger(c.bond)?relationshipClamp(c.bond,0,3):0,affection=Number.isFinite(c.affection)?relationshipClamp(Math.round(c.affection)):partner===base.name?85:35+legacy*15,trust=Number.isFinite(c.trust)?relationshipClamp(Math.round(c.trust)):partner===base.name?80:40+legacy*12;return {...base,affection,trust,bond:Math.min(3,Math.floor(affection/25)),lastTalk:Number.isSafeInteger(c.lastTalk)?c.lastTalk:-1,dialogueVisit:Number.isSafeInteger(c.dialogueVisit)?c.dialogueVisit:-1,usedTopics:Array.isArray(c.usedTopics)?c.usedTopics.filter(t=>typeof t==='string'&&['debrief','personal','values','apology','friendship'].includes(t)).slice(0,5):[],history:Array.isArray(c.history)?c.history.filter(t=>typeof t==='string').slice(-8).map(t=>t.slice(0,220)):[],lastOutcome:c.lastOutcome&&typeof c.lastOutcome.text==='string'&&Number.isFinite(c.lastOutcome.affection)&&Number.isFinite(c.lastOutcome.trust)?{text:c.lastOutcome.text.slice(0,350),affection:relationshipClamp(c.lastOutcome.affection,-100,100),trust:relationshipClamp(c.lastOutcome.trust,-100,100)}:null,friendship:c.friendship===true}})}
function validCrewState(c,i){return !!c&&c.name===['Vael','Syra'][i]&&typeof c.role==='string'&&c.role.length<100&&['affection','trust'].every(k=>Number.isInteger(c[k])&&c[k]>=0&&c[k]<=100)&&Number.isInteger(c.bond)&&c.bond>=0&&c.bond<=3&&Number.isSafeInteger(c.lastTalk)&&c.lastTalk>=-1&&Number.isSafeInteger(c.dialogueVisit)&&c.dialogueVisit>=-1&&Array.isArray(c.usedTopics)&&c.usedTopics.length<=5&&new Set(c.usedTopics).size===c.usedTopics.length&&c.usedTopics.every(t=>['debrief','personal','values','apology','friendship'].includes(t))&&Array.isArray(c.history)&&c.history.length<=8&&c.history.every(t=>typeof t==='string'&&t.length<=220)&&typeof c.friendship==='boolean'&&(c.lastOutcome===null||c.lastOutcome&&typeof c.lastOutcome.text==='string'&&c.lastOutcome.text.length<=350&&Number.isFinite(c.lastOutcome.affection)&&Number.isFinite(c.lastOutcome.trust)&&Math.abs(c.lastOutcome.affection)<=100&&Math.abs(c.lastOutcome.trust)<=100)&&validBetrayalState(c)}
function relationshipMood(c){if(c.affection<20||c.trust<20)return {id:'hostile',name:'Wrogość',color:'#f28388',detail:'Twoje odpowiedzi mocno naruszyły relację.'};if(c.affection<35||c.trust<35)return {id:'guarded',name:'Nieufność',color:'#d7ad78',detail:'Ostrożność. Potrzebne są szacunek i szczerość.'};if(progress.partner===c.name&&c.affection>=65&&c.trust>=55)return {id:'romantic',name:'Zakochanie',color:'#f6a5d2',detail:'Wzajemny związek. Nie bierz zaufania za pewnik.'};if(c.affection>=75&&c.trust>=60)return {id:'tender',name:'Bliskość',color:'#dfb0f5',detail:'Silna więź. Możecie porozmawiać o związku.'};if(c.affection>=55&&c.trust>=45)return {id:'warm',name:'Sympatia',color:'#9ee0c8',detail:'Twoja obecność sprawia tej osobie przyjemność.'};return {id:'neutral',name:'Neutralność',color:'#9dbbd4',detail:'Dopiero poznajecie swoje wartości i granice.'}}
function relationshipEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function portraitSVG(i,c){const mood=relationshipMood(c),warm=['warm','tender','romantic'].includes(mood.id),angry=mood.id==='hostile',guard=mood.id==='guarded',skin=i===0?'#bca27e':'#9faeb2',shadow=i===0?'#76614e':'#657881',armor=i===0?'#63537d':'#3b617c',id='crewPortrait'+i,eyes=angry?'#ff916a':i===0?'#ffd698':'#a9f3ed',brows=angry?'<path d="M104 130l32 12M184 142l32-12"/>':guard?'<path d="M104 136l32-3M184 133l32 3"/>':warm?'<path d="M105 129q15-9 30-1M185 128q15-8 30 1"/>':'<path d="M105 132h30M185 132h30"/>',mouth=angry?'M136 219q24-19 48 0':guard?'M138 219l44-4':warm?'M133 210q27 28 54 0':'M139 215q21 4 42 0',pupil=angry?-1:guard?-3:2;
return `<svg class="crew-portrait" data-mood="${mood.id}" data-affection="${c.affection}" viewBox="0 0 320 360" role="img" aria-label="${c.name}: ${mood.name}"><defs><linearGradient id="${id}bg" x2="1" y2="1"><stop stop-color="#1f3448"/><stop offset="1" stop-color="#0a1424"/></linearGradient><linearGradient id="${id}skin" x2=".85" y2="1"><stop stop-color="${skin}"/><stop offset="1" stop-color="${shadow}"/></linearGradient></defs><rect width="320" height="360" rx="10" fill="url(#${id}bg)"/><path d="M0 58h320M0 300h320M48 0v360M272 0v360" stroke="#c4d8ee" opacity=".06"/><circle cx="160" cy="164" r="120" fill="none" stroke="${mood.color}" opacity=".2"/><circle cx="160" cy="164" r="105" fill="${mood.color}" opacity=".05"/><path d="M39 360l13-61 60-35 97 0 59 35 14 61" fill="${armor}" stroke="#a2b9cd" stroke-width="2"/><path d="M76 294l47 12 37 54H70M244 294l-47 12-37 54h90" fill="#223749"/><path d="M94 291l-33 18M226 291l33 18" stroke="#c7ad7b" stroke-width="10"/><path d="M139 253v32l21 18 21-18v-32" fill="${shadow}"/><path d="M117 98l-18-42 11-32 27 68M203 98l18-42-11-32-27 68" fill="${skin}" stroke="${shadow}" stroke-width="6"/><path d="M105 105q55-39 110 0l11 69-15 63-27 31h-48l-27-31-15-63z" fill="url(#${id}skin)" stroke="${shadow}" stroke-width="3"/><path d="M125 105l-6 60 14 49M195 105l6 60-14 49M160 107v93" fill="none" stroke="${skin}" stroke-width="5" opacity=".45"/><path d="M151 180l-6 21 15 7 15-7-6-21" fill="${shadow}" opacity=".7"/><g fill="#263542">${[0,1].map(r=>[0,1].map(k=>`<ellipse cx="${120+k*80}" cy="${150+r*27}" rx="${angry?15:16}" ry="${angry?6:9}"/>`).join('')).join('')}</g><g fill="${eyes}">${[0,1].map(r=>[0,1].map(k=>`<ellipse cx="${120+k*80+pupil}" cy="${150+r*27}" rx="${angry?5:6}" ry="${angry?4:6}"/>`).join('')).join('')}</g><g fill="none" stroke="${shadow}" stroke-width="7" stroke-linecap="round">${brows}</g><path d="${mouth}" fill="none" stroke="#4a3f43" stroke-width="5" stroke-linecap="round"/><ellipse cx="113" cy="198" rx="16" ry="8" fill="#df93a4" opacity="${warm?.28:0}"/><ellipse cx="207" cy="198" rx="16" ry="8" fill="#df93a4" opacity="${warm?.28:0}"/><path d="M146 321h28" stroke="${mood.color}" stroke-width="5"/><path d="M14 22v-8h28M306 22v-8h-28M14 338v8h28M306 338v8h-28" fill="none" stroke="${mood.color}" opacity=".7"/>${mood.id==='romantic'?'<path d="M276 46c-12-16-27 0 0 17 27-17 12-33 0-17" fill="#f5b0d2"/>':''}<text x="18" y="327" fill="${mood.color}" font-size="10" font-family="Arial" letter-spacing="2">PROTEAN / ${i===0?'ARCHIWUM':'INŻYNIERIA'}</text></svg>`}
function relationshipMeters(c){const mood=relationshipMood(c);return `<div class="relationship-meter"><label>PRZYCHYLNOŚĆ <strong>${c.affection}%</strong></label><div class="relationship-track"><i style="width:${c.affection}%;background:${mood.color}"></i></div></div><div class="relationship-meter"><label>ZAUFANIE <strong>${c.trust}%</strong></label><div class="relationship-track"><i style="width:${c.trust}%;background:#83c9d9"></i></div></div>`}
function syncDialogueVisit(c){if(c.dialogueVisit!==progress.visit){c.dialogueVisit=progress.visit;c.usedTopics=[];c.lastOutcome=null}}
const CREW_SCENES=[
[
 {title:'Archiwum bez backupu',line:'Nasza cywilizacja zapisała wszystko. Tylko nikt nie sprawdził, czy kopię da się odczytać. Co zrobisz z tym archiwum?',answers:[['Zrobimy kopię i przetestujemy odtwarzanie. Pamięć zasługuje na troskę.',10,10,'Dziękuję. Dla ciebie to nie jest tylko kolejny załącznik.'],['Najpierw policzę rozmiar importu. Potem zdecydujemy.',2,2,'Rozumiem ostrożność. Byleśmy nie zapomnieli o ludziach za rekordami.'],['Usuńmy stare dane. Prościej będzie zacząć od zera.',-14,-12,'To nie brudne rekordy. To całe życie mojego narodu.']]},
 {title:'Osierocony rekord',line:'Czasem czuję się jak rekord bez rodzica. Wszystko działa, ale nigdzie nie należę.',answers:[['Na tym statku należysz do załogi. I nie musisz na to zasługiwać użytecznością.',12,7,'Miło usłyszeć, że nie jestem tylko lookupem do przeszłości.'],['Możesz pomóc mi opisać proteańskie schematy. Zrobimy to razem.',6,8,'Wspólna praca to dobry początek. Dziękuję.'],['Jesteś specjalistą. Uczucia zostaw na czas wolny.',-12,-9,'Zrozumiałem. W takim razie będę wyłącznie specjalistą.']]},
 {title:'Proteańskie duplikaty',line:'Znalazłem dwie sprzeczne wersje tego samego wspomnienia. Usunąć tę mniej wygodną?',answers:[['Zachowajmy obie i opiszmy źródła. Prawda nie zawsze mieści się w jednym polu.',8,12,'Właśnie tak chciałbym ocalać historię. Bez fałszowania.'],['Wybierzmy wersję lepiej udokumentowaną i zachowajmy kopię drugiej.',3,6,'Rozsądny kompromis. Ważne, że druga nie zniknie.'],['Zostaw tę, która lepiej wygląda w raporcie dla dowództwa.',-9,-16,'Nie będę wykonywał hard delete na prawdzie.']]},
 {title:'Kawa z epoki Prothean',line:'Przygotowałem napój według starej receptury. Smakuje jak błąd importu, ale z nutą nostalgii.',answers:[['Spróbuję. A potem razem poprawimy recepturę, bez kasowania tradycji.',10,5,'Uśmiechnąłem się. To rzadkie zjawisko, zapisz je w logu.'],['Może najpierw pół kubka. Mam niski limit eksperymentów.',4,2,'Przynajmniej uczciwie deklarujesz batch size.'],['Nie dziwię się, że wasza cywilizacja upadła.',-17,-10,'To miało być zaproszenie. Odpowiedź była niepotrzebnie okrutna.']]},
 {title:'Zwycięstwo i koszt',line:'Po walce wszyscy liczą eliminacje. Ja liczę miejsca przy stole, które mogły pozostać puste.',answers:[['Też o tym myślę. Zwycięstwo nie zwalnia nas z troski o załogę.',10,9,'Dobrze wiedzieć, że dowódca widzi coś więcej niż zielone KPI.'],['Będziemy analizować straty i poprawiać procedury.',2,6,'Procedury pomagają. Pamiętajmy jeszcze o tych, którzy je wykonują.'],['Najważniejsze, że metryki się zgadzają.',-10,-11,'Nie chcę być kolejnym wpisem w twoim dashboardzie.']]},
 {title:'Eksport wspomnień',line:'Mógłbym udostępnić ci osobiste wspomnienie. Nie jest wojskowe. Nie jest użyteczne. Jest moje.',answers:[['Tylko jeśli naprawdę chcesz. Zostanie między nami.',12,10,'Tak. Właśnie komuś takiemu chciałem je pokazać.'],['Chętnie posłucham. Powiedz, jeśli wolisz przerwać.',7,8,'Dziękuję za zostawienie mi kontroli nad własnym zapisem.'],['Nagrajmy je. Przyda się w odprawie.',-13,-18,'Wycofuję zgodę. To nie był materiał do prezentacji.']]},
 {title:'Certyfikat ze starożytności',line:'Żniwiarz stwierdził, że bez certyfikatu Salesforce nie mogę komentować jego arkusza.',answers:[['Masz pięćdziesiąt tysięcy lat doświadczenia. On ma scalone komórki.',9,4,'To najlepsza walidacja mojego CV od wielu tysięcy lat.'],['Pomożemy ci zdobyć certyfikat, jeśli masz na to ochotę.',4,5,'Miło, że pytasz o moją ochotę, zamiast robić taska za mnie.'],['Może ma rację. Twoja wiedza jest mocno przestarzała.',-11,-9,'Historia jest stara. Brak szacunku pozostaje zadziwiająco świeży.']]},
 {title:'Granice',line:'Nie chcę dziś opowiadać o wojnie. Czy to problem?',answers:[['Nie. Możemy pomilczeć albo porozmawiać o czymś zupełnie innym.',11,12,'Taka odpowiedź daje więcej bezpieczeństwa niż cały pancerz.'],['Rozumiem. Wrócimy do tematu, kiedy będziesz gotowy.',5,9,'Dziękuję. Sam zdecyduję, kiedy otworzyć ten plik.'],['Jako dowódca mam prawo znać każdy szczegół.',-15,-19,'Moje wspomnienia nie są obiektem, do którego dostajesz automatyczne uprawnienia.']]},
 {title:'Mostek po służbie',line:'Z mostka widać mgławicę, która przypomina mi dom. Chciałbyś ją zobaczyć?',answers:[['Tak. Tym razem bez terminala i bez pośpiechu.',12,5,'Zarezerwuję nam widok. Żadnych alertów poza gwiazdami.'],['Chętnie, jeśli starczy czasu po odprawie.',4,3,'W porządku. Daj znać, gdy zamkniesz wszystkie zakładki.'],['Nie mam czasu na sentymentalne prezentacje.',-12,-7,'Nie prosiłem o prezentację. Zapraszałem ciebie.']]},
 {title:'Błąd w proteańskim przekładzie',line:'Pomyliłem dwa symbole. Dowództwo dostało „kocham separator” zamiast „zamykam retranslator”.',answers:[['Naprawimy to wspólnie. Każdy popełnia błędy.',9,10,'Dziękuję, że nie utożsamiasz jednego błędu z całą moją osobą.'],['Wyślij korektę i dodaj słownik walidacyjny.',2,7,'Zrobię to. Procedura będzie mniej romantyczna niż pierwszy komunikat.'],['Opowiem o tym całej załodze. Niech się pośmieją.',-14,-15,'Liczyłem na twoją dyskrecję. Nie na publiczny dashboard wstydu.']]},
 {title:'Lojalność',line:'Gdy moje zdanie różni się od twojego, oczekujesz lojalności czy ciszy?',answers:[['Szczerego sprzeciwu. Lojalność bez głosu to tylko zablokowane pole.',8,14,'W takim razie będę mówił szczerze. Nawet gdy to trudne.'],['Najpierw porozmawiajmy w cztery oczy, później zdecydujmy.',4,7,'To uczciwa ścieżka eskalacji.'],['W czasie misji masz się zgadzać.',-9,-17,'Mogę wykonać rozkaz. Zaufania nie wymusisz.']]},
 {title:'Dane żywych ludzi',line:'Zbieracze zostawili listę jeńców. Niektóre rekordy są niepełne. Dowództwo sugeruje je pominąć.',answers:[['Szukamy wszystkich. Człowiek nie staje się nieważny przez brak pola.',11,12,'Dlatego chcę zostać na tym statku.'],['Sprawdźmy źródła i spróbujmy uzupełnić dane przed akcją.',4,8,'Pomogę. Każda poprawiona linia może oznaczać czyjś powrót.'],['Bez pełnych danych nie ma sensu tracić zasobów.',-16,-18,'Dla ciebie brakujące pole oznacza brakującą wartość. Dla mnie oznacza osobę.']]},
 {title:'Cichy wieczór',line:'Na proteańskich statkach bywały dni bez alarmu. Trudno mi sobie przypomnieć, co się wtedy robiło.',answers:[['Możemy stworzyć nową tradycję. Pierwszy punkt: nikt nie otwiera Excela.',11,5,'Popieram. Wpisuję to do konstytucji nowej tradycji.'],['Zacznijmy od wspólnej kolacji.',7,4,'To brzmi dobrze. I nie wymaga mapowania kolumn.'],['Przyzwyczaj się. Tu nie ma czasu na odpoczynek.',-8,-10,'Zmęczona załoga też ma governor limits.']]},
 {title:'Pamięć i przyszłość',line:'Boję się, że jeśli zacznę żyć tutaj, zdradzę tych, których straciłem.',answers:[['Możesz ich pamiętać i nadal budować własną przyszłość. Nie musisz wybierać.',13,10,'Może właśnie tego pozwolenia potrzebowałem.'],['Nie znam dobrej odpowiedzi, ale mogę cię wysłuchać.',8,9,'To bardziej uczciwe niż fałszywa pewność.'],['Przeszłość jest zamknięta. Po prostu idź dalej.',-13,-12,'Gdyby to było takie proste, nie prosiłbym o rozmowę.']]},
 {title:'Prawo do pomyłki',line:'Syra poprawiła moje obliczenia. Czuję wdzięczność i odrobinę wstydu.',answers:[['Załoga jest zespołem. Wspólna poprawka to sukces, nie porażka.',9,9,'Dobrze. Nie będę próbował debugować poczucia własnej wartości.'],['Podziękuj jej i zapisz test, żeby błąd się nie powtórzył.',4,6,'Tak zrobię. Test będzie miał na imię „nie bądź zbyt dumny”.'],['Z takim doświadczeniem nie powinieneś się mylić.',-11,-14,'Widzę, że w twoim schemacie brakuje miejsca na człowieczeństwo.']]},
 {title:'Co zostaje po misji',line:'Kiedy to się skończy, co zamierzasz zachować: raporty czy ludzi?',answers:[['Ludzi. Raporty też, ale bez nich nie miałyby znaczenia.',12,10,'To jest przyszłość, w której chciałbym uczestniczyć.'],['Obie rzeczy. Pamięć wymaga ludzi i dobrego zapisu.',7,8,'Zgadzam się. Właściwy rekord ma serce i historię.'],['To zależy, co będzie bardziej użyteczne.',-14,-15,'Nie chcę być oceniany według kolejnego pola „przydatność”.']]}
],
[
 {title:'Rdzeń i makra',line:'Żniwiarze znowu próbowali zasilić rdzeń makrem. Mogę poprawić zabezpieczenia, ale potrzebuję czasu.',answers:[['Masz czas i wsparcie. Bezpieczeństwo nie jest ozdobą do raportu.',9,11,'Dobrze. Zrobię to porządnie, zamiast heroicznie gasić kolejną produkcję.'],['Przedstaw plan i priorytety, ustalimy harmonogram.',3,6,'Jasne. Lubię plan, o ile ktoś potem naprawdę go respektuje.'],['Obejdź zabezpieczenia. Musimy szybciej ruszyć.',-10,-18,'Nie zaryzykuję załogi, żeby dashboard świecił się na zielono.']]},
 {title:'Nocny import',line:'Siedziałam przy migracji do trzeciej. Nie potrzebuję bohatera. Potrzebuję kogoś, kto przyniesie jedzenie.',answers:[['Przyniosę jedzenie i przejmę część pracy. Potem odpoczniesz.',12,9,'To brzmi dużo lepiej niż kolejny motywacyjny mail.'],['Pomogę rozbić zadanie na mniejsze partie.',5,6,'Dobry pomysł. Przyda się też coś do jedzenia między partiami.'],['Wszyscy jesteśmy zmęczeni. Nie rób z tego problemu.',-14,-11,'Nie robię problemu. Mówię ci, gdzie jest limit systemu.']]},
 {title:'Walidacja kontra dowódca',line:'Zablokowałam twoje żądanie dostępu. Nie miało uzasadnienia. Gniewasz się?',answers:[['Nie. Dobrze, że zasady obowiązują również dowódcę.',9,14,'Właśnie na taką odpowiedź liczyłam.'],['Wyjaśnijmy potrzebę i wystawmy właściwy wniosek.',5,9,'Idealnie. Nawet galaktykę da się ratować bez konta shared_admin.'],['Odblokuj. Moja ranga jest wystarczającym uzasadnieniem.',-11,-19,'Ranga nie jest permission setem. I nie powinna nim być.']]},
 {title:'Kolacja bez ekranu',line:'Mam pomysł: kolacja, żadnych terminali. Wytrzymasz kwadrans bez sprawdzania logów?',answers:[['Z tobą? Nawet dwa kwadranse. Telefon idzie do szuflady.',12,5,'Ostrożnie, komandorze. Jeszcze uznam cię za dobrze skonfigurowanego.'],['Spróbuję. Ale jeśli Zwiastun zadzwoni, dam mu voicemail.',6,3,'Dozwolony wyjątek. Byle nie wrócił jako załącznik.'],['Jeśli nie ma agendy, to nie ma sensu.',-13,-7,'Agenda brzmiała: spędzić czas z tobą. Szkoda.']]},
 {title:'Nie mój pomysł',line:'Ktoś przypisał dowództwu moje usprawnienie retranslatora. Powinnam to odpuścić?',answers:[['Nie. Dopilnuję, żeby twój wkład był podpisany twoim nazwiskiem.',11,12,'Dziękuję. Nie chcę być niewidzialnym polem obliczeniowym.'],['Przygotujmy dokumentację zmian i poprawmy autorstwo.',5,10,'Konkretnie i uczciwie. Tak lubię.'],['Ważne, że zespół wygrał. Nazwiska są drugorzędne.',-12,-14,'Zwykle mówią to ci, których nazwiska już są na slajdzie.']]},
 {title:'Eksperyment',line:'Zaprojektowałam szybszy akcelerator. Może działać świetnie, ale najpierw potrzebuję sandboxa.',answers:[['Dostaniesz sandbox i czas na testy. Chcę zobaczyć, co wymyśliłaś.',10,11,'Świetnie. Dziś zrobimy coś szybkiego i odpowiedzialnego. Rzadkie połączenie.'],['Pokaż mi ryzyka i metryki. Potem uruchomimy test.',4,7,'Jasne. Wolę pytania od ślepego entuzjazmu.'],['Włącz od razu na produkcji. Najwyżej zrobimy rollback.',-8,-17,'„Najwyżej” to nie strategia. To ostatnie słowo przed alarmem.']]},
 {title:'Słaby dzień',line:'Dzisiaj wszystko mnie drażni. Nawet poprawnie nazwane pliki CSV.',answers:[['Nie musisz dziś udawać dobrego humoru. Chcesz towarzystwa czy spokoju?',12,10,'Dziękuję za wybór. Dzisiaj trochę spokoju, później kawa razem.'],['Mogę przejąć ci najgorsze zgłoszenia.',7,6,'To byłoby naprawdę pomocne. Szczególnie ticket „nie działa nic”.'],['Uśmiechnij się. Z takim nastawieniem psujesz atmosferę.',-16,-12,'Teraz drażni mnie też ta odpowiedź.']]},
 {title:'Separator osobowości',line:'Vael stwierdził, że jestem zbyt bezpośrednia. Może powinnam mieć bardziej przyjazny interfejs?',answers:[['Lubię twoją szczerość. Nie musisz przepisywać siebie pod cudzy formularz.',12,8,'To chyba najładniejsze zdanie, jakie usłyszałam o interfejsach.'],['Możesz dobierać ton do sytuacji, nie tracąc własnego zdania.',5,7,'Uczciwe. Czytelność nie musi oznaczać uległości.'],['Tak. Załoga woli, kiedy mniej dyskutujesz.',-14,-16,'A ja wolę dowódcę, który słucha. Widzisz? Oboje mamy preferencje.']]},
 {title:'Prawdziwe przeprosiny',line:'Kiedy ktoś psuje deployment, wszyscy mówią „sorry”. Mało kto potem naprawia przyczynę.',answers:[['Słowa powinny prowadzić do działania. Ustalmy, co realnie poprawić.',9,13,'Właśnie. Przeprosiny bez poprawki to tylko komentarz w logu.'],['Zróbmy retrospektywę bez szukania kozła ofiarnego.',6,10,'Jestem za. Prawdziwy post-mortem, nie teatr.'],['Błędy były i będą. Nie roztrząsajmy tego.',-9,-15,'Bez refleksji to nie doświadczenie. To cykliczny błąd.']]},
 {title:'Własna kabina',line:'Chciałabym urządzić swoją kabinę. Czy każda rzecz na statku musi być najpierw zatwierdzona w trzech workflowach?',answers:[['To twoja przestrzeń. Powiedz tylko, jeśli potrzebujesz pomocy.',11,8,'Potrzebuję kogoś do przeniesienia stołu. W sam raz zadanie dla komandora.'],['Ustalmy tylko zasady bezpieczeństwa, reszta jest twoja.',6,9,'To rozsądne. Obiecuję nie montować rdzenia w szafie.'],['Na statku nie ma prywatnej przestrzeni. Wszystko podlega kontroli.',-15,-17,'W takim razie to nie dom. To bardzo duży formularz.']]},
 {title:'Komplement z metryką',line:'Powiedziałeś ostatnio, że jestem „wydajna”. Mam nadzieję, że znasz też inne przymiotniki.',answers:[['Odważna, zabawna i uparta w dobrym sensie. Lubię cię, nie tylko twoje wyniki.',13,5,'Znacznie lepiej. Ten rekord warto zapisać.'],['Chodziło mi o uznanie dla twojej pracy. Ale masz rację, to za mało.',6,8,'Dziękuję, że umiesz to poprawić bez defensywnego wyjątku.'],['Nie przesadzaj. To był komplement.',-12,-10,'Właśnie dlatego zwróciłam uwagę, a nie otworzyłam zgłoszenie.']]},
 {title:'Strach przed Omegą',line:'Nie boję się przyznać, że Omega mnie przeraża. Bardziej boję się, że wszyscy udają, że nie czują nic.',answers:[['Ja też się boję. Przygotujemy plan i zadbamy o siebie nawzajem.',12,12,'Dobrze. Szczerość jest lepszą osłoną niż przechwałki.'],['Mamy ryzyka i procedury awaryjne. Przejdźmy je razem.',5,9,'Tak. Z planem strach staje się bardziej konkretny i mniej samotny.'],['Strach osłabia załogę. Zachowaj to dla siebie.',-14,-18,'Udawanie odwagi nie jest odwagą.']]},
 {title:'Czyj jest ten sukces?',line:'Po misji usłyszałam „dowódca uratował statek”. A ilu ludzi pracowało przy osłonach?',answers:[['Cała załoga. Powiem to na odprawie i dopilnuję uznania dla was.',11,12,'Wtedy naprawdę możemy mówić o wspólnym sukcesie.'],['Zapiszmy wkład wszystkich w raporcie.',5,8,'To dobry początek. Nie zapomnij też powiedzieć im tego osobiście.'],['Ktoś musi być twarzą zwycięstwa.',-12,-15,'Twarz nie utrzyma reaktora. Dobrze, że reszta ciała nie bierze tego osobiście.']]},
 {title:'Ostatni plik przed snem',line:'Za każdym razem obiecuję sobie „jeszcze tylko jeden import”. Potem jest świt.',answers:[['Ustawmy granicę razem. Teraz zamykasz terminal, jutro pomogę ci dokończyć.',11,9,'Dobrze. Z tobą łatwiej wyłączyć tryb wiecznego dyżuru.'],['Może timer i mniejsze zadania pomogą?',4,5,'Spróbuję. Byle timer też nie miał piętnastu wyjątków.'],['Ambitni ludzie tak mają. Przynajmniej dużo robisz.',-7,-11,'Nie potrzebuję pochwały za przeciążenie. Potrzebuję odpoczynku.']]},
 {title:'Dwie wersje nas',line:'Znam ciebie z odpraw i ciebie z tych rozmów. Która wersja jest prawdziwa?',answers:[['Obie, ale tutaj staram się mówić szczerzej. I chcę słyszeć prawdziwą ciebie.',13,10,'To mi odpowiada. Nie musimy występować w roli idealnego dashboardu.'],['Bycie dowódcą wymaga innego tonu. Próbuję je pogodzić.',5,8,'Rozumiem. Ważne, żeby rola nie zjadła człowieka.'],['Na służbie nie ma znaczenia, co naprawdę myślę.',-10,-15,'Dla rozkazów może nie. Dla relacji ma znaczenie ogromne.']]},
 {title:'Po wszystkim',line:'Gdy galaktyka przestanie płonąć, mam zamiar polecieć gdzieś, gdzie nikt nie zna słowa „migration”.',answers:[['Brzmi jak miejsce, które chętnie zobaczyłbym z tobą. Jeśli będziesz chciała.',13,8,'Chciałabym. I dziękuję za ostatnią część tego zdania.'],['Zasłużyłaś na taki urlop. Pomogę zamknąć sprawy przed wylotem.',6,9,'To byłoby miłe. Urlop bez zdalnego gaszenia pożarów.'],['Najpierw upewnij się, że ktoś przejmie twoje zadania.',-11,-9,'Wiedziałam, że da się zepsuć marzenie jednym workflowem.']]}
]
];
const CREW_TOPICS=[{key:'debrief',label:'Odprawa, załoga i ostatnie wydarzenia'},{key:'personal',label:'Coś osobistego — poznajmy się lepiej'},{key:'values',label:'Wartości, granice i zaufanie'}];
function crewScene(i,topicIndex){return CREW_SCENES[i][(progress.visit*3+topicIndex+i*5)%CREW_SCENES[i].length]}
function relationshipContext(){const completed=progress.completed.length,next=typeof MISSIONS!=='undefined'?MISSIONS.find((m,i)=>!progress.completed.includes(i)):null;return completed===0?'Początek wyprawy. Załoga dopiero uczy się sobie ufać.':completed>=((typeof MISSIONS!=='undefined'&&MISSIONS.length)||99)?'Kampania zakończona. Teraz możecie porozmawiać o wspólnej przyszłości.':'Ukończone misje: '+completed+'. '+(next?'Kolejny cel: '+next.name+'.':'Kolejne żniwa przed wami.')}
function relationshipPanel(i,c,body){const m=relationshipMood(c),o=c.lastOutcome;return `<div class="crew-dialogue"><div class="crew-profile">${portraitSVG(i,c)}<div class="crew-mood" style="color:${m.color}" data-relationship-mood="${m.id}">${m.name}</div>${relationshipMeters(c)}<small>${m.detail}</small></div><div class="crew-conversation"><div class="crew-context">${relationshipContext()}</div>${body}${o?`<div class="relationship-outcome" role="status"><b>${o.affection>=0?'+':''}${o.affection}% przychylności · ${o.trust>=0?'+':''}${o.trust}% zaufania</b><p>${relationshipEscape(o.text)}</p></div>`:''}<p class="crew-threshold">Związek: co najmniej 75% przychylności i 60% zaufania. Odpowiedzi mogą poprawić lub pogorszyć relację.</p></div></div>`}
function applyCrewAnswer(i,key,answer){if(!crewAvailable(i))return false;const c=progress.crew[i];syncDialogueVisit(c);if(c.usedTopics.includes(key))return false;c.usedTopics.push(key);const beforeA=c.affection,beforeT=c.trust;c.affection=relationshipClamp(c.affection+answer[1]);c.trust=relationshipClamp(c.trust+answer[2]);c.bond=Math.min(3,Math.floor(c.affection/25));c.lastTalk=progress.visit;c.lastOutcome={text:answer[3],affection:c.affection-beforeA,trust:c.trust-beforeT};c.history.push(answer[0].slice(0,220));c.history=c.history.slice(-8);if(progress.partner===c.name&&(c.affection<20||c.trust<20)){progress.partner=null;c.lastOutcome.text+=' Nasz związek się kończy. Potrzebuję dystansu.';notify(c.name+' kończy związek po utracie zaufania. Relację można odbudować rozmowami.')}evaluateCrewDeparture(i);save();hud();return true}
function crewMenu(){if(!safeLocation())return;const base=mode,back=()=>{closePanel(false);mode=base;hud()};openPanel('Załoga / relacje','PRZYCHYLNOŚĆ · ZAUFANIE · ROZMOWY','',back);$('panel-body').innerHTML='<p>'+relationshipContext()+' Każdy pobyt daje trzy nowe tematy na osobę. Nie ma jednej zawsze dobrej odpowiedzi dla każdego członka załogi.</p><div class="crew-cards">'+progress.crew.map((c,i)=>{const m=relationshipMood(c);return `<div class="crew-card">${portraitSVG(i,c)}<div><h3>${c.name}${progress.partner===c.name?' ♥':''}</h3><p>${relationshipEscape(c.role)}</p><span style="color:${c.departed?'#ff8f9e':m.color}">${c.departed?betrayalStatus(c):m.name}</span>${relationshipMeters(c)}</div></div>`}).join('')+'</div>';progress.crew.forEach((c,i)=>button(c.departed?c.name+' · '+betrayalStatus(c):'Porozmawiaj: '+c.name+' · '+c.affection+'% przychylności · '+c.trust+'% zaufania',()=>conversation(i,base)));button('Wróć na pokład',back)}
function conversation(i,base,topicIndex=null){if(!crewAvailable(i)){showDepartedCrew(i,base);return}const c=progress.crew[i];syncDialogueVisit(c);mode=base;openPanel(c.name+' / '+c.role,'POKŁAD ZAŁOGOWY / RELACJE','',()=>{mode=base;crewMenu()});
if(topicIndex!==null){const t=CREW_TOPICS[topicIndex],scene=crewScene(i,topicIndex);if(c.usedTopics.includes(t.key)){conversation(i,base);return}$('panel-body').innerHTML=relationshipPanel(i,c,'<h3>'+scene.title+'</h3><p class="crew-line">„'+scene.line+'”</p><p class="crew-choice-hint">Wybierz odpowiedź. Rozmówca zapamięta twój ton i intencję.</p>');scene.answers.slice((progress.visit+i+topicIndex)%3).concat(scene.answers.slice(0,(progress.visit+i+topicIndex)%3)).forEach((answer,n)=>button(String(n+1)+'. '+answer[0],()=>{applyCrewAnswer(i,t.key,answer);conversation(i,base)}));button('Wróć do tematów bez odpowiedzi',()=>conversation(i,base));return}
const partner=progress.partner===c.name,tense=partner&&(c.affection<55||c.trust<45),greeting=partner?(tense?'Jesteśmy razem, ale ostatnie słowa mnie zraniły. Potrzebuję odbudowy zaufania.':'Dobrze cię widzieć. Pośród tych wszystkich rekordów chcę mieć czas właśnie dla ciebie.'):c.affection<20?'Mogę porozmawiać, ale nie udawajmy, że wszystko jest w porządku.':c.affection<35?'Posłucham. Proszę, tym razem uszanuj moje zdanie.':c.affection>=75?'Lubię nasze rozmowy. Przy tobie łatwiej pomyśleć o czymś więcej niż kolejnej misji.':'Mamy chwilę między żniwami. O czym chcesz porozmawiać?';$('panel-body').innerHTML=relationshipPanel(i,c,'<p class="crew-line">„'+greeting+'”</p>');
CREW_TOPICS.forEach((topic,n)=>{const used=c.usedTopics.includes(topic.key);button((used?'✓ ':'')+topic.label+(used?' · omówione podczas tego pobytu':''),()=>conversation(i,base,n),'',used)});
if(c.affection<75||c.trust<60)button(c.usedTopics.includes('apology')?'Przeprosiny omówione — dajmy sobie trochę czasu':'Przyznaj się do błędu i zaproponuj naprawę',()=>{applyCrewAnswer(i,'apology',['Przepraszam. Chcę lepiej słuchać i poprzeć to działaniem.',5,10,i===0?'Dziękuję. Szczere przeprosiny nie kasują pamięci, ale otwierają nowy rozdział.':'Przyjmuję. Najważniejsze będzie to, jak potraktujesz mnie w kolejnej rozmowie.']);conversation(i,base)},'',c.usedTopics.includes('apology'));
if(!progress.partner&&c.affection>=75&&c.trust>=60)button('♥ Chcę z tobą być. Czy ty też?',()=>{progress.partner=c.name;c.friendship=false;c.lastOutcome={text:i===0?'Tak. Chcę budować z tobą przyszłość, nie tylko archiwum.':'Tak. Relacja utworzona za obopólną zgodą. Bez wymuszonych uprawnień.',affection:0,trust:0};save();hud();conversation(i,base);notify('♥ '+c.name+' odwzajemnia uczucia. Związek zapisany.');sound(650,.3,'sine',.03);if(typeof buildEnvironment==='function')buildEnvironment('hub')},'primary');
if(progress.partner&&progress.partner!==c.name){const p=document.createElement('p');p.className='crew-friendship-note';p.textContent='Szanuję twój związek. Możemy rozwijać przyjaźń — bez romantycznych duplikatów.';$('panel-body').appendChild(p)}
if(!partner&&!c.friendship)button('Chcę rozwijać naszą przyjaźń',()=>{c.friendship=true;const previousTrust=c.trust;c.trust=relationshipClamp(c.trust+3);c.lastOutcome={text:'Przyjaźń też jest ważna. Dziękuję za jasne intencje.',affection:0,trust:c.trust-previousTrust};save();hud();conversation(i,base)});
if(partner)button('Porozmawiaj o zakończeniu związku…',()=>{mode=base;openPanel('Zakończyć związek z '+c.name+'?','GRANICE / SZCZERA ROZMOWA','<p>Możecie pozostać przyjaciółmi. Ta decyzja zostanie zapisana.</p>',()=>conversation(i,base));button('Tak, zostańmy przyjaciółmi',()=>{progress.partner=null;c.friendship=true;c.lastOutcome={text:'To trudne, ale doceniam szczerość. Dajmy sobie przestrzeń i szacunek.',affection:0,trust:0};save();hud();conversation(i,base)});button('Wróć do rozmowy',()=>conversation(i,base))},'danger');
button('Wróć do załogi',()=>{mode=base;crewMenu()});button('Wróć na pokład',()=>{closePanel(false);mode=base;hud()})}

// v7 campaign module. Replace MISSIONS/TYPES/layout/totalEnemies/spawnEnemy/enemyShot.
// Add helpers below. Geometry helpers + actors/effects/mat/G/M/batchStaticMeshes are supplied by the game.
const FINAL_MISSION=6,EXCEL_MISSION=7,MAX_ACTIVE_ENEMIES=18;
const MISSIONS=[
 {name:'Sandbox-7',tag:'PORT IMPORTOWY',waves:3,reward:650,color:0x67e8e3,difficulty:0,theme:'port',desc:'Żniwiarze wdrożyli Excela na produkcji. Zatrzymaj ten deployment.'},
 {name:'Archiwum Protean',tag:'RUINY / STARE SCHEMATY',waves:3,reward:1000,color:0xb59bff,difficulty:1,theme:'ruins',desc:'50 000 lat historii. Ani jednego poprawnego External ID. Plewy duplikatów budzą się w ruinach.'},
 {name:'Stocznia Zbieraczy',tag:'KOKONY / BRUDNE DANE',waves:4,reward:1450,color:0xe3b55e,difficulty:2,theme:'hive',desc:'Zbieracze porywają rekordy. Nawet te z poprawnym consentem. Zniszcz ich fabrykę duplikatów.'},
 {name:'Próg Omegi',tag:'OMEGA / PRZEŁAMANIE BLOKADY',waves:3,reward:1850,color:0xff637c,difficulty:3,theme:'relay',desc:'Czerwony retranslator prowadzi poza firewall. Zwiastun wysłał awatara: konsultancki pakiet Enterprise.'},
 {name:'Illium: Skarbiec Gethów',tag:'SIEĆ GETHÓW / PERMISSION SET',waves:4,reward:2450,color:0x63bbff,difficulty:4,theme:'geth',desc:'Gethy odmawiają dostępu nawet administratorowi. Odbierz klucze do skarbca danych.'},
 {name:'Katedra Walidacji',tag:'ŻNIWIARZE / BANSHEE',waves:4,reward:3100,color:0xd278ed,difficulty:5,theme:'cathedral',desc:'Banshee krzyczą FIELD_CUSTOM_VALIDATION_EXCEPTION. Tutaj każdy krok wymaga walidacji.'},
 {name:'Jądro galaktyki',tag:'OSTATNI IMPORT / ZWIASTUN',waves:4,reward:5000,color:0xff914f,difficulty:6,theme:'core',desc:'Zwiastun ma 1200 HP, trzy fazy i ambicję zrobienia globalnego UPDATE bez WHERE. Nie pozwól.'},
 {name:'Excel: Koniec arkusza',tag:'FINAŁ / EXCEL.EXE',waves:1,reward:12000,color:0x51e89b,difficulty:8,theme:'excel',desc:'Dwie formy jednego bossa. C · ZIPsert. Widoczna tarcza = nietykalność. E przy Marcu otwiera okno obrażeń.'}
];
const TYPES={
 excel:{name:'EXCEL / OSTATECZNY ARKUSZ',hp:2400,damage:36,speed:1.45,r:2.55,color:0x51e89b,reward:6000},
 reaper:{name:'ŻNIWIARZ XLSX',hp:4,damage:11,speed:2.9,r:.9,color:0xeb9369,reward:50},
 elite:{name:'ELITA / ENTERPRISE',hp:12,damage:23,speed:2.1,r:1.2,color:0xff5069,reward:120},
 collector:{name:'ZBIERACZ DANYCH',hp:6,damage:15,speed:4,r:.85,color:0xe9be61,reward:80},
 husk:{name:'HUSK / DUPLIKAT',hp:5,damage:13,speed:5.3,r:.7,color:0x70f8ab,reward:65},
 geth:{name:'GETH / PERMISSION WALL',hp:17,damage:19,speed:2.25,r:1.05,color:0x68c9ff,reward:150},
 banshee:{name:'BANSHEE / VALIDATION RULE',hp:27,damage:24,speed:2.8,r:1.15,color:0xdc8aff,reward:230},
 boss:{name:'ZWIASTUN / ROOT ADMIN',hp:1200,damage:26,speed:1.9,r:2.7,color:0xff9b58,reward:3200}
};
function layout(id){
 if(id===EXCEL_MISSION)return excelLayout();
 // First four layouts intentionally unchanged to preserve active v4/v5/v6 saves.
 if(id===0)return [{x:-11,z:-4,w:8,d:2.3},{x:11,z:-4,w:8,d:2.3},{x:-11,z:9,w:6,d:2},{x:11,z:9,w:6,d:2}];
 if(id===1)return [{x:-12,z:-5,w:2.4,d:12},{x:12,z:-5,w:2.4,d:12},{x:-5,z:8,w:4,d:3},{x:5,z:8,w:4,d:3}];
 if(id===2)return [{x:-12,z:-4,w:10,d:2.5},{x:12,z:-4,w:10,d:2.5},{x:-8,z:10,w:2.6,d:6},{x:8,z:10,w:2.6,d:6}];
 if(id===3)return [{x:-14,z:0,w:5,d:4},{x:14,z:0,w:5,d:4},{x:0,z:10,w:10,d:1.8}];
 if(id===4)return [{x:-14,z:-7,w:3,d:7},{x:14,z:-7,w:3,d:7},{x:-6,z:2,w:3,d:4},{x:6,z:2,w:3,d:4},{x:-14,z:11,w:6,d:2.2},{x:14,z:11,w:6,d:2.2}];
 if(id===5)return [{x:-10,z:-6,w:3,d:12},{x:10,z:-6,w:3,d:12},{x:0,z:3,w:5,d:3},{x:-16,z:11,w:5,d:3},{x:16,z:11,w:5,d:3}];
 if(id===6)return [{x:-13,z:-5,w:5,d:3},{x:13,z:-5,w:5,d:3},{x:-12,z:10,w:5,d:3},{x:12,z:10,w:5,d:3},{x:0,z:4,w:5,d:1.8}];
 return [{x:-11,z:-8,w:7,d:2},{x:11,z:-8,w:7,d:2},{x:-12,z:12,w:5,d:2},{x:12,z:12,w:5,d:2}];
}
function hasBossEncounter(m=run?.mission){return m===3||m===FINAL_MISSION}
function totalEnemies(){if(isExcelMission())return 0;return 6+run.wave*2+run.mission*2}
function enemyDifficulty(m=run?.mission??0){return MISSIONS[m]?.difficulty??0}
function enemyStats(type,m=run?.mission??0){
 const t=TYPES[type],d=enemyDifficulty(m);
 if(type==='excel')return {hp:excelMaxHealth(run?.excel?.stage||1),damage:36,speed:1.45};
 if(type==='boss')return {hp:m===FINAL_MISSION?t.hp:260,damage:m===FINAL_MISSION?t.damage:20,speed:m===FINAL_MISSION?t.speed:1.55};
 return {hp:Math.round(t.hp*(1+d*.065)+d*.8),damage:Math.round(t.damage*(1+d*.045)),speed:t.speed*(1+d*.025)};
}
function chooseEnemyType(n){
 const m=run.mission;
 const roster=m===0?['reaper','reaper','reaper','elite']:m===1?['reaper','husk','collector','husk','elite']:m===2?['collector','husk','elite','collector','geth']:m===3?['elite','geth','husk','collector','elite']:m===4?['geth','geth','husk','collector','elite']:m===5?['banshee','husk','geth','elite','banshee']:['geth','banshee','elite','husk','collector','banshee'];
 return roster[n%roster.length];
}
function spawnEnemy(type,x,z){
 if(!Object.hasOwn(TYPES,type)||enemies.filter(e=>e.hp>0).length>=MAX_ACTIVE_ENEMIES)return null;
 const st=enemyStats(type),e={type,x,z,hp:st.hp,maxHp:st.hp,attackDamage:st.damage,moveSpeed:st.speed,t:1.3+Math.random(),phase:Math.random()*6,specialTimer:type==='boss'?3.5:type==='banshee'?5.5:0,bossPhase:1,summonedMask:0};
 e.model=makeEnemy(e);e.model.position.set(x,0,z);enemies.push(e);return e;
}
function bossPhase(e){if(e.type!=='boss')return 0;const ratio=e.hp/e.maxHp;return run?.mission===FINAL_MISSION?(ratio>2/3?1:ratio>1/3?2:3):(ratio>.5?1:2)}
function enemyStopDistance(e){if(betrayerIndex(e)>=0)return betrayerStopDistance(e);return e.type==='boss'?7:e.type==='husk'?.95:e.type==='geth'?6:e.type==='banshee'?5.5:2.3}
function enemySpeed(e){if(e.castTime>0)return 0;let v=e.moveSpeed??enemyStats(e.type).speed;if(e.type==='boss')v*=1+(bossPhase(e)-1)*.18;if(e.type==='husk'&&Math.hypot(player.x-e.x,player.z-e.z)<5)v*=1.18;return v}
function enemyContactDamage(e){return e.attackDamage??enemyStats(e.type).damage}
function enemyAttackInterval(e){if(betrayerIndex(e)>=0)return betrayerAttackInterval(e);if(e.type==='boss')return [0,1.55,1.12,.84][bossPhase(e)];return e.type==='geth'?1.65:e.type==='banshee'?2.25:e.type==='collector'?1.3:e.type==='elite'?1.85:2.3}
function addHostileShot(e,a,speed=8,damage=enemyContactDamage(e)){
 if(hostile.length>=240)return;
 let b={x:e.x,z:e.z,vx:Math.sin(a)*speed,vz:Math.cos(a)*speed,damage,type:e.type};b.model=projectile(b,true);hostile.push(b);
}
function enemyShot(e){
 if(betrayerShot(e))return;
 if(e.hp<=0||e.castTime>0||e.type==='husk')return;
 const a=Math.atan2(player.x-e.x,player.z-e.z);
 if(e.type==='boss'){const p=bossPhase(e),count=p===3?7:p===2?5:3;for(let i=0;i<count;i++)addHostileShot(e,a+(i-(count-1)/2)*.15,7.5+p*.4);return}
 const offsets=e.type==='geth'?[-.075,0,.075]:e.type==='banshee'?[-.24,0,.24]:e.type==='elite'?[-.09,.09]:[0];
 for(const offset of offsets)addHostileShot(e,a+offset,e.type==='geth'?12:e.type==='banshee'?8.6:7.5+run.mission*.25);
}
// Physics-only warning list. Parent should render these using reusable/instanced flat rings.
// Do not serialize owner references: clear this list on wipe/restore; delayed attacks are safely canceled.
const combatWarnings=[];
function queueCombatWarning(owner,kind,x,z,r,delay,damage){
 if(combatWarnings.length>=10)return;
 combatWarnings.push({owner,kind,x,z,r,timer:delay,total:delay,damage,color:kind==='nova'?0xffbd5b:kind==='blink'?0xd68cff:0xff5b7d});
 owner.castTime=Math.max(owner.castTime||0,delay);
}
function validSpawnSpot(x,z,r=1){return Math.abs(x)<22&&Math.abs(z)<18.5&&!blocked(x,z,r)&&Math.hypot(x-player.x,z-player.z)>3}
function summonAdds(owner,phase){
 const count=run.mission===FINAL_MISSION?(phase>=3?3:2):1;
 for(let i=0;i<count;i++){
   if(enemies.filter(e=>e.hp>0).length>=MAX_ACTIVE_ENEMIES)break;
   let candidates=[{x:-20,z:-12},{x:20,z:-12},{x:-20,z:13},{x:20,z:13}];
   let spot=candidates.find((p,j)=>validSpawnSpot(p.x,p.z)&&j===(i+phase)%4)||candidates.find(p=>validSpawnSpot(p.x,p.z));
   if(spot)spawnEnemy(phase>=3&&i===0?'banshee':phase>=2&&i%2===0?'geth':'husk',spot.x,spot.z);
 }
}
function updateBossMechanics(e,dt){
 if(e.type!=='boss'||mode!=='combat'||e.hp<=0)return;
 e.castTime=Math.max(0,(e.castTime||0)-dt);const p=bossPhase(e);
 if(p!==(e.bossPhase||1)){
  e.bossPhase=p;e.specialTimer=2.2;
  notify(p===3?'ZWIASTUN / FAZA III: „LIMIT API? JA JESTEM LIMITEM!”':'ZWIASTUN / FAZA II: „PRZEJMUJĘ WSZYSTKIE PERMISSION SETY.”');
  burst(e.x,e.z,0xffa066,22);
 }
 if(p>=2&&!(e.summonedMask&(1<<p))){e.summonedMask|=1<<p;summonAdds(e,p)}
 e.specialTimer=(e.specialTimer??3.5)-dt;if(e.specialTimer>0||e.castTime>0)return;
 e.attackIndex=(e.attackIndex||0)+1;
 if(p===3&&e.attackIndex%2===0){queueCombatWarning(e,'nova',e.x,e.z,7.5,1.25,0);notify('ZWIASTUN ŁADUJE NOVĘ / żółty krąg: przygotuj unik!')}
 else{
  const x=player.x,z=player.z;queueCombatWarning(e,'impact',x,z,p>=2?2.8:3.1,p>=2?1.05:1.3,p>=3?29:24);
  if(p>=2)for(const side of [-1,1]){let xx=Math.max(-21,Math.min(21,x+side*5));queueCombatWarning(e,'impact',xx,z-1.7,2.6,1.25,25)}
 }
 e.specialTimer=run.mission===FINAL_MISSION?(p===3?3.5:p===2?4.6:5.6):6.2;
}
function updateEnemySpecial(e,dt){
 if(e.type==='boss'){updateBossMechanics(e,dt);return}
 if(e.type!=='banshee'||mode!=='combat'||e.hp<=0)return;
 e.castTime=Math.max(0,(e.castTime||0)-dt);e.specialTimer=(e.specialTimer??5.5)-dt;
 if(e.specialTimer>0||e.castTime>0)return;
 let a=Math.atan2(e.x-player.x,e.z-player.z)+Math.PI*.65,target=null;
 for(let i=0;i<8;i++){let x=player.x+Math.sin(a+i*Math.PI/4)*7,z=player.z+Math.cos(a+i*Math.PI/4)*7;if(validSpawnSpot(x,z,TYPES.banshee.r)){target={x,z};break}}
 if(target){queueCombatWarning(e,'blink',target.x,target.z,2.1,1.05,0);e.specialTimer=7.5}else e.specialTimer=2;
}
function updateCombatTelegraphs(dt){
 if(mode!=='combat')return;
 for(let i=combatWarnings.length-1;i>=0;i--){
  const w=combatWarnings[i];if(w.owner.hp<=0||!enemies.includes(w.owner)){combatWarnings.splice(i,1);continue}
  w.timer-=dt;if(w.timer>0)continue;
  const e=w.owner;
  if(resolveExcelWarning(w)){combatWarnings.splice(i,1);continue}
  if(w.kind==='blink'){
   if(validSpawnSpot(w.x,w.z,TYPES.banshee.r)){e.x=w.x;e.z=w.z;e.model.position.set(e.x,0,e.z);burst(e.x,e.z,0xd994ff,14);e.castTime=0;enemyShot(e)}
  }else if(w.kind==='nova'){
   const a=Math.atan2(player.x-e.x,player.z-e.z);for(let j=0;j<20;j++){
    // Two adjacent omitted directions form a readable escape gap; projectiles remain dodgeable.
    if(j===0||j===1)continue;addHostileShot(e,a+j*Math.PI*2/20,7.3,enemyContactDamage(e));
   }sound(85,.22,'sawtooth',.025);
  }else if(inv===0&&Math.hypot(player.x-w.x,player.z-w.z)<w.r){hurtPlayer(w.damage)}
  combatWarnings.splice(i,1);
 }
}
// New model geometry: keeps draw calls low with the same material batching as v6.
// Parent makeEnemy() should call this for husk/geth/banshee before the old generic branches.
// makeNewEnemy DOES NOT add to actors/pool; parent owns that.
function makeNewEnemy(e){
 if(!['husk','geth','banshee'].includes(e.type))return null;
 const g=new THREE.Group(),t=TYPES[e.type],em=mat(t.color,.4,.4,t.color,1.15),dark=M.dark,metal=mat(e.type==='husk'?0x3b6658:e.type==='geth'?0x526d7b:0x665176,.5,.5);
 if(e.type==='husk'){
  box(g,metal,0,1.25,0,.55,.85,.4);box(g,em,0,1.3,.24,.12,.65,.08);let skull=sphere(g,mat(0x859a83,.2,.8),0,2.1,.14,.27);skull.scale.y*=1.15;
  for(const s of [-1,1]){tube(g,[s*.24,1.6,0],[s*.65,.9,.6],.12,metal);tube(g,[s*.65,.9,.6],[s*.7,.6,.95],.07,em);tube(g,[s*.17,1,0],[s*.3,.08,.2],.13,dark);sphere(g,em,s*.1,2.14,.38,.06)}
  for(let i=0;i<3;i++)box(g,em,0,1.1+i*.18,-.25,.2,.07,.12);
 }else if(e.type==='geth'){
  box(g,metal,0,1.65,0,1.1,1.2,.58);box(g,dark,0,2.6,.06,.5,.52,.48);sphere(g,em,0,2.66,.35,.17);
  for(const s of [-1,1]){box(g,metal,s*.74,1.9,0,.36,.7,.55);tube(g,[s*.28,1.2,0],[s*.35,.12,.2],.18,dark);box(g,em,s*.75,1.95,.29,.16,.42,.05)}
  box(g,dark,.75,1.4,.62,.28,.35,1.3);box(g,em,.75,1.4,1.3,.16,.15,.12);box(g,metal,-.85,1.5,.4,.15,1.1,.8);
 }else{
  const robe=mesh(g,G.cone,metal,0,1.1,0,.75,2.2,.65);robe.rotation.z=.03;box(g,metal,0,2.45,0,.55,.85,.35);sphere(g,mat(0xa69bb7,.2,.7),0,3.2,.1,.25);
  for(const s of [-1,1]){tube(g,[s*.3,2.7,0],[s*1.0,2.3,.15],.09,metal);tube(g,[s*1.0,2.3,.15],[s*1.45,1.5,.35],.055,em);tube(g,[s*.15,3.3,0],[s*.45,3.8,-.2],.035,em);sphere(g,em,s*.1,3.2,.32,.06)}
  const halo=mesh(g,new THREE.TorusGeometry(.75,.035,6,24),em,0,2.5,-.05);g.userData.crown=halo;
 }
 const hpGroup=new THREE.Group();hpGroup.position.set(0,e.type==='banshee'?4.1:e.type==='geth'?3.4:2.8,0);g.add(hpGroup);box(hpGroup,mat(0x111827,0,.8),0,0,0,1.6,.1,.02,false);const hpFill=box(hpGroup,em,0,0,.02,1.5,.065,.02,false);g.userData.hpGroup=hpGroup;g.userData.hpFill=hpFill;
 // Existing updater uses width 1.7; use that width for consistent depletion.
 hpFill.scale.x=1.7;
 const shadow=mesh(g,new THREE.CircleGeometry(t.r,12),new THREE.MeshBasicMaterial({color:0x020710,transparent:true,opacity:.3,depthWrite:false}),0,.015,0);shadow.rotation.x=-Math.PI/2;
 batchStaticMeshes(g,[hpGroup,g.userData.crown].filter(Boolean));return g;
}
// Extra map identity, all static except returned final reactor; no new lights.
// Call before the parent's final batchStaticMeshes(environment,...), then exclude returned reactor.
function decorateCampaignMap(id,parent,accent){
 const em=mat(accent,.3,.4,accent,1.1);
 if(id===4){
  for(const x of [-18,-6,6,18])box(parent,em,x,.02,0,.035,.03,34,false);
  for(const z of [-12,0,12])box(parent,em,0,.02,z,42,.03,.035,false);
  for(const o of layout(4)){const shard=mesh(parent,new THREE.OctahedronGeometry(.55),em,o.x,3.7,o.z);shard.rotation.y=.4;box(parent,M.edge,o.x,2.6,o.z,.5,1.1,.5)}
  textSprite(parent,'ILLIUM / PERMISSION SET: SURVIVE',0,4.2,-20,'#a9dcff',9,.7);
 }else if(id===5){
  for(const x of [-10,10])for(const z of [-10,-2]){cyl(parent,mat(0x554360,.6,.5),x,2.8,z,.65,5.6);mesh(parent,G.cone,em,x,5.9,z,.55,1,.55)}
  tube(parent,[-10,5.6,-10],[0,8,-10],.16,em);tube(parent,[0,8,-10],[10,5.6,-10],.16,em);
  for(const radius of [3.5,6.5,10]){const ring=mesh(parent,new THREE.TorusGeometry(radius,.025,5,40),em,0,.03,0);ring.rotation.x=Math.PI/2}
  textSprite(parent,'KATEDRA / FIELD_CUSTOM_VALIDATION_EXCEPTION',0,7.1,-10,'#efbdff',12,.65);
 }else if(id===6){
  const core=new THREE.Group();core.position.set(0,0,-15);parent.add(core);cyl(core,M.dark,0,.35,0,3.2,.7);sphere(core,mat(0xffad6e,.2,.25,0xff6346,2),0,5.8,0,1.3);
  for(let i=0;i<3;i++){const ring=mesh(core,new THREE.TorusGeometry(2.7+i*.35,.065,6,48),em,0,5.8,0);ring.rotation.set(i*.75,.5+i,0)}
  for(const x of [-9,9]){box(parent,M.dark,x,3.6,-17,1.4,7.2,1.4);box(parent,em,x,3.8,-16.25,.15,5.2,.05,false)}
  for(const x of [-5,5])box(parent,em,x,.025,-3,.08,.03,27,false);
  textSprite(parent,'ZWIASTUN / ROOT ACCESS DENIED',0,9,-17,'#ffc38d',11,.75);return core;
 }
 return null;
}

// Decorative geometry is baked into static batches; all walk-blocking objects live in layout().
const mapSurfaceCache=new Map();
function mapSurface(id){if(id===EXCEL_MISSION)return excelMapSurface();if(mapSurfaceCache.has(id))return mapSurfaceCache.get(id);const c=document.createElement('canvas');c.width=c.height=512;const a=c.getContext('2d'),colors=['#263e4a','#393249','#443c24','#2e263e','#102f3b','#1e3b36','#291c29'];a.fillStyle=id<0?'#273847':colors[id];a.fillRect(0,0,512,512);a.lineWidth=3;a.strokeStyle=['#526a72','#72637e','#7a6c3a','#6d3c6d','#258596','#5b7e6e','#993c4c'][Math.max(0,id)];
if(id===1||id===5){for(let y=0;y<512;y+=128)for(let x=0;x<512;x+=128){a.strokeRect(x+4,y+4,120,120);if((x+y)%256===0){a.beginPath();a.moveTo(x+30,y+30);a.lineTo(x+95,y+58);a.lineTo(x+47,y+105);a.stroke()}}}
else if(id===2){for(let y=0;y<600;y+=84)for(let x=-70;x<600;x+=100){a.beginPath();for(let k=0;k<6;k++){let ang=k*Math.PI/3;a.lineTo(x+(y%168?50:0)+Math.cos(ang)*51,y+Math.sin(ang)*49)}a.closePath();a.stroke()}}
else if(id===3||id===6){for(let r=45;r<400;r+=68){a.beginPath();a.arc(256,256,r,0,Math.PI*2);a.stroke()}for(let k=0;k<12;k++){a.beginPath();a.moveTo(256,256);a.lineTo(256+Math.cos(k*Math.PI/6)*400,256+Math.sin(k*Math.PI/6)*400);a.stroke()}}
else{for(let y=0;y<512;y+=128)for(let x=0;x<512;x+=128){a.strokeRect(x+3,y+3,122,122);a.lineWidth=1;a.strokeRect(x+12,y+12,104,104);a.lineWidth=3;if(id===4){a.fillStyle='#2f8c9e';a.fillRect(x+25,y+15,70,3);a.fillRect(x+25,y+25,5,30)}}}let tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(id===3||id===6?3:8,id===3||id===6?3:7);tex.colorSpace=THREE.SRGBColorSpace;mapSurfaceCache.set(id,tex);return tex}
function addArenaIdentity(id){floorMat.map=id<0?floorTex:mapSurface(id);floorMat.needsUpdate=true;const accent=id<0?0x6febe2:MISSIONS[id].color,neon=mat(accent,.3,.4,accent,1.15);planet.material.color.setHex(id===5?0x3d7b66:id===4?0x306177:id===6?0x7b3349:0x1e546a);if(id<0)return;if(id===EXCEL_MISSION){decorateExcelArena();return}
const pillar=(x,z,h,m=M.edge)=>{cyl(environment,M.dark,x,.22,z,1.3,.44);cyl(environment,m,x,h/2,z,.7,h);cyl(environment,neon,x,h*.73,z,.76,.16);cyl(environment,M.gold,x,h,z,1.05,.25)};
if(id===0){for(let x of [-20,20])for(let z of [-17,15]){box(environment,M.gold,x,.7,z,2,1.4,2);box(environment,M.dark,x,1.6,z,1.6,.5,1.6)}textSprite(environment,'TERMINAL 07 / UPSERT > INSERT',0,4.6,-20,'#9ce7e7',8,.6)}
if(id===1){for(let x of [-24,24])for(let z of [-16,-5,8])pillar(x,z,4.5,mat(0x827792,.3,.8));for(let x of [-20,20]){let arch=mesh(environment,new THREE.TorusGeometry(3,.22,6,28,Math.PI),M.gold,x,2,-20);arch.rotation.z=.12*x}textSprite(environment,'ARCHIWUM / 50 000 LAT BEZ BACKUPU',0,5,-20,'#d8bef0',9,.6)}
if(id===2){for(let x of [-24,24])for(let z of [-10,3,15]){tube(environment,[x,.2,z],[x*.98,4,z+1.8],.15,neon);let pod=mesh(environment,G.sphere,mat(0x776444,.2,.7),x,2,z,1.1,2.2,1.1);box(environment,neon,x,2,z+.9,.18,2.5,.12)}textSprite(environment,'ZBIERACZE / SELECT * FROM GALAXY',0,5,-20,'#f5d283',9,.6)}
if(id===3){for(let s of [-1,1]){let fragment=mesh(environment,new THREE.TorusGeometry(6,.25,7,40,Math.PI*1.3),neon,s*15,3,-18);fragment.rotation.set(.2,s*.25,s*.5);pillar(s*24,14,4)}textSprite(environment,'OMEGA / NIE OGLĄDAJ SIĘ ZA SIEBIE',0,5,-20,'#e8a6cf',9,.6)}
if(id===4){for(let s of [-1,1])for(let z of [-16,-8,0,8,16]){box(environment,M.dark,s*24,2,z,1.4,4,2);for(let j=0;j<4;j++)box(environment,neon,s*24,1+j*.7,z+1.03,.85,.1,.05,false)}for(let o of obstacleDefs){box(environment,neon,o.x,.02,o.z,o.w+1,.035,o.d+1,false)}textSprite(environment,'WĘZEŁ GETHÓW / PERMISSION DENIED',0,5,-20,'#89f5ff',9,.6)}
if(id===5){for(let s of [-1,1])for(let z of [-14,0,14])pillar(s*24,z,5,mat(0x8fa391,.2,.8));for(let s of [-1,1]){box(environment,mat(0x1f4e49,.2,.5,0x123f39,.5),s*21,.03,11,3,.04,11,false);for(let z of [7,11,15]){let crystal=mesh(environment,new THREE.OctahedronGeometry(.65),neon,s*21,1.1,z);crystal.scale.y=1.8}}textSprite(environment,'THESSIA / REGUŁY WALIDACJI RZECZYWISTOŚCI',0,5,-20,'#b8e1ba',10,.6)}
if(id===6){for(let s of [-1,1]){box(environment,mat(0x41131e,.1,.7,0xa22d32,1.1),s*24,.03,0,.85,.05,40,false);for(let z of [-17,-7,3,13]){pillar(s*24,z,4.3,M.dark);sphere(environment,neon,s*24,4.5,z,.3)}}for(let r of [5,8,12]){let ring=mesh(environment,new THREE.TorusGeometry(r,.04,5,64),neon,0,.035,-5);ring.rotation.x=Math.PI/2}textSprite(environment,'JĄDRO GALAKTYKI / ROOT ACCESS',0,6,-20,'#ff9aab',10,.75)}
}

function validProgress(p){return !!p&&p.version===10&&['credits','records','kills','visit'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0&&p[k]<1e9)&&p.upgrades&&UPGRADE_KEYS.every(k=>Number.isInteger(p.upgrades[k])&&p.upgrades[k]>=0&&p.upgrades[k]<=5)&&Array.isArray(p.completed)&&p.completed.length<=MISSIONS.length&&new Set(p.completed).size===p.completed.length&&p.completed.every(k=>Number.isInteger(k)&&k>=0&&k<MISSIONS.length)&&Array.isArray(p.crew)&&p.crew.length===2&&p.crew.every(validCrewState)&&[null,'Vael','Syra'].includes(p.partner)&&typeof p.excelFirstFormCleared==='boolean'&&(!p.completed.includes(EXCEL_MISSION)||p.excelFirstFormCleared)&&typeof p.won==='boolean'&&(!p.won||p.completed.includes(EXCEL_MISSION))}
function validActive(a,upgrades=progress.upgrades){return !!a&&a.run&&Number.isInteger(a.run.mission)&&a.run.mission>=0&&a.run.mission<MISSIONS.length&&Number.isInteger(a.run.wave)&&a.run.wave>=1&&a.run.wave<=MISSIONS[a.run.mission].waves&&Number.isInteger(a.run.spawned)&&a.run.spawned>=0&&a.run.spawned<=1000&&nums(a.run,['clock'])&&typeof a.run.bossSpawned==='boolean'&&nums(a.player,['x','z','hp','shield','rechargeWait'])&&Math.abs(a.player.x)<26&&Math.abs(a.player.z)<22&&a.player.hp>0&&a.player.hp<=maxHealth(upgrades)&&a.player.shield>=0&&a.player.shield<=maxShield(upgrades)&&a.player.rechargeWait>=0&&a.player.rechargeWait<=4&&['enemies','bullets','hostile','drops','medkits'].every(k=>Array.isArray(a[k])&&a[k].length<300)&&a.enemies.length<=MAX_ACTIVE_ENEMIES&&a.enemies.every(e=>(e.shieldFlash===undefined||Number.isFinite(e.shieldFlash)&&e.shieldFlash>=0&&e.shieldFlash<=.4)&&Object.hasOwn(TYPES,e.type)&&nums(e,['x','z','hp','maxHp','t','phase'])&&e.hp>0&&e.maxHp>0&&e.hp<=e.maxHp&&['attackDamage','moveSpeed','specialTimer','castTime','bossPhase','summonedMask','attackIndex'].every(k=>e[k]===undefined||Number.isFinite(e[k]))&&(e.castTime===undefined||e.castTime>=0)&&(e.attackDamage===undefined||e.attackDamage>=0)&&(e.moveSpeed===undefined||e.moveSpeed>=0)&&(e.attackIndex===undefined||Number.isSafeInteger(e.attackIndex)&&e.attackIndex>=0)&&(e.bossPhase===undefined||Number.isInteger(e.bossPhase)&&e.bossPhase>=1&&e.bossPhase<=3)&&(e.summonedMask===undefined||Number.isSafeInteger(e.summonedMask)&&e.summonedMask>=0))&&a.bullets.every(e=>nums(e,['x','z','vx','vz','damage'])&&e.damage>=0)&&a.hostile.every(e=>(e.duplicate===undefined||typeof e.duplicate==='boolean')&&(e.copyId===undefined||e.duplicate===true&&[1,2].includes(e.copyId))&&nums(e,['x','z','vx','vz','damage'])&&e.damage>=0&&Object.hasOwn(TYPES,e.type))&&a.drops.every(e=>nums(e,['x','z','life'])&&(e.type===undefined||['csv','turbo'].includes(e.type)))&&a.medkits.length===2&&a.medkits.every(e=>nums(e,['x','z','timer'])&&typeof e.ready==='boolean')&&nums(a,['massCooldown','relayCooldown','indo'])&&['overdrive','dodgeCooldown','combo','comboTime'].every(k=>a[k]===undefined||(Number.isFinite(a[k])&&a[k]>=0))&&(a.combo===undefined||Number.isSafeInteger(a.combo))}

function migrateV4(d){migrateLegacy(d)}
function migrateV5(d){migrateLegacy(d)}
function migrateV6(d){migrateLegacy(d)}
const warningRingGeometry=new THREE.RingGeometry(.86,1,36),warningFillGeometry=new THREE.CircleGeometry(1,32),warningRingMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),warningFillMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
const warningRings=new THREE.InstancedMesh(warningRingGeometry,warningRingMaterial,10),warningFills=new THREE.InstancedMesh(warningFillGeometry,warningFillMaterial,10);for(const m of [warningRings,warningFills]){m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);effects.add(m)}
function syncWarningVisuals(){let n=0;for(const w of combatWarnings){if(w.owner.hp<=0||n>=10)continue;_instance.position.set(w.x,.055,w.z);_instance.rotation.set(-Math.PI/2,0,0);_instance.scale.set(w.r,w.r,1);_instance.updateMatrix();warningRings.setMatrixAt(n,_instance.matrix);warningFills.setMatrixAt(n,_instance.matrix);_color.setHex(w.color);_color.multiplyScalar(.75+Math.sin(time*12)*.2);warningRings.setColorAt(n,_color);warningFills.setColorAt(n,_color);n++}for(const m of [warningRings,warningFills]){m.count=n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}

/* Bulk Import v8: upgrade/defense helpers. Insert before the main progress/player state declaration;
 * replace v7 hurtPlayer and shopMenu with these definitions. No extra meshes/lights. */
const UPGRADE_KEYS=['damage','rate','armor','shield','plating','biotic','mobility'];
const UPGRADE_LIMIT=5;
const UPGRADE_DEFS={
  damage:{name:'Wzmacniacz External ID',baseCost:275,detail:'+0,7 obrażeń każdego strzału. Duplikaty znikają bez ręcznego merge.'},
  rate:{name:'Akcelerator Bulk API',baseCost:275,detail:'+22% bazowej szybkostrzelności. Batch size: tak.'},
  armor:{name:'Pancerz Enterprise',baseCost:300,detail:'+25 maks. życia i +3 leczenia z apteczki. Licencja obejmuje przeżycie.'},
  shield:{name:'Tarcza Permission Set',baseCost:340,detail:'+25 tarczy; regeneracja po 4 s bez trafienia. Excel: ACCESS DENIED.'},
  plating:{name:'Poszycie Validation Rule',baseCost:380,detail:'−6% obrażeń życia za poziom (maks. 30%). Niepoprawny pocisk nie przejdzie walidacji.'},
  biotic:{name:'Biotyka Apex Trigger',baseCost:325,detail:'+1,6 obrażeń efektu masy i −0,8 s odnowienia. Jeden trigger, wiele błędnych rekordów.'},
  mobility:{name:'Unik Asynchronous Job',baseCost:280,detail:'−0,25 s odnowienia uniku. Queueable? Nie, nieuchwytny.'}
};
function upgradeLevel(key,upgrades=progress.upgrades){const n=upgrades&&upgrades[key];return Number.isInteger(n)?Math.max(0,Math.min(UPGRADE_LIMIT,n)):0}
function normalizeUpgradeLevels(upgrades={}){return Object.fromEntries(UPGRADE_KEYS.map(key=>[key,upgradeLevel(key,upgrades)]))}
function maxHealth(upgrades=progress.upgrades){return 100+25*upgradeLevel('armor',upgrades)}
function maxShield(upgrades=progress.upgrades){return 25*upgradeLevel('shield',upgrades)}
function healAmount(upgrades=progress.upgrades){return 35+3*upgradeLevel('armor',upgrades)}
function damageReduction(upgrades=progress.upgrades){return .06*upgradeLevel('plating',upgrades)}
function shieldRegenRate(upgrades=progress.upgrades){return upgradeLevel('shield',upgrades)>0?8+2*upgradeLevel('shield',upgrades):0}
function bioticDamage(upgrades=progress.upgrades){return 4+.6*upgradeLevel('damage',upgrades)+1.6*upgradeLevel('biotic',upgrades)}
function bioticCooldown(upgrades=progress.upgrades){return Math.max(3,7-.8*upgradeLevel('biotic',upgrades))}
function dodgeRecharge(upgrades=progress.upgrades){return Math.max(1.25,2.5-.25*upgradeLevel('mobility',upgrades))}
function defensePlayer(x,z){return {x,z,hp:maxHealth(),shield:maxShield(),rechargeWait:0}}
function upgradeCost(key,upgrades=progress.upgrades){return UPGRADE_DEFS[key]?UPGRADE_DEFS[key].baseCost*(upgradeLevel(key,upgrades)+1):Infinity}
function updateDefenses(dt){
  if(!['hub','break','combat'].includes(mode)||!Number.isFinite(dt)||dt<=0||player.hp<=0)return;
  const cap=maxShield(),wait=Number.isFinite(player.rechargeWait)?Math.max(0,player.rechargeWait):0;
  player.hp=Math.max(0,Math.min(maxHealth(),player.hp));
  player.shield=Math.max(0,Math.min(cap,Number.isFinite(player.shield)?player.shield:0));
  player.rechargeWait=Math.max(0,wait-dt);
  const regenDt=Math.max(0,dt-wait);
  if(cap>0&&regenDt>0)player.shield=Math.min(cap,player.shield+shieldRegenRate()*regenDt);
}
function applyIncomingDamage(n,opts={}){
  const result={blocked:false,shieldDamage:0,healthDamage:0};
  if(!Number.isFinite(n)||n<=0||player.hp<=0)return result;
  if(inv>0&&!opts.ignoreInv){result.blocked=true;return result}
  player.shield=Math.max(0,Math.min(maxShield(),Number.isFinite(player.shield)?player.shield:0));
  let remaining=n;
  if(!opts.bypassShield){result.shieldDamage=Math.min(player.shield,remaining);player.shield-=result.shieldDamage;remaining-=result.shieldDamage}
  const healthDamage=remaining*(opts.bypassArmor?1:1-damageReduction());
  result.healthDamage=Math.min(player.hp,healthDamage);
  player.hp=Math.max(0,player.hp-healthDamage);
  if(opts.pauseRecharge!==false)player.rechargeWait=4;
  if(opts.grantInv!==false)inv=Math.max(inv,.65);
  return result;
}
function hurtPlayer(n){const hit=applyIncomingDamage(n);if(hit.blocked||!hit.healthDamage&&!hit.shieldDamage)return hit;shake=.28;sound(hit.healthDamage>0?95:190,.12,'triangle',.035);hud();return hit}
function canBuyUpgrades(){return sceneKind==='hub'&&(safeLocation()||mode==='panel'&&['hub','break'].includes(returnMode))}
function buyUpgrade(key){
  if(!Object.prototype.hasOwnProperty.call(UPGRADE_DEFS,key)||!canBuyUpgrades())return false;
  const level=upgradeLevel(key),cost=upgradeCost(key);
  if(level>=UPGRADE_LIMIT||!Number.isFinite(progress.credits)||progress.credits<cost)return false;
  const oldHP=maxHealth(),oldShield=maxShield();
  const hp=Number.isFinite(player.hp)?Math.max(0,Math.min(oldHP,player.hp)):oldHP;
  const shield=Number.isFinite(player.shield)?Math.max(0,Math.min(oldShield,player.shield)):0;
  progress.credits-=cost;progress.upgrades[key]=level+1;
  player.hp=Math.min(maxHealth(),hp+maxHealth()-oldHP);
  player.shield=Math.min(maxShield(),shield+maxShield()-oldShield);
  if(!Number.isFinite(player.rechargeWait))player.rechargeWait=0;
  save();hud();notify('Ulepszenie zainstalowane: '+UPGRADE_DEFS[key].name+'. Deployment bez rollbacku!');return true;
}
function upgradeStat(key){
  switch(key){
    case 'damage':return damage().toFixed(1)+' obrażeń / strzał';
    case 'rate':return (1/interval()).toFixed(1)+' strzałów/s';
    case 'armor':return maxHealth()+' życia / apteczka +'+healAmount();
    case 'shield':return maxShield()+' tarczy / '+shieldRegenRate()+' pkt/s po 4 s';
    case 'plating':return Math.round(damageReduction()*100)+'% redukcji obrażeń życia';
    case 'biotic':return bioticDamage().toFixed(1)+' obrażeń / '+bioticCooldown().toFixed(1)+' s';
    case 'mobility':return 'unik co '+dodgeRecharge().toFixed(2)+' s';
  }
  return '';
}
function shopMenu(){
  if(!safeLocation())return;
  const base=mode,back=()=>{closePanel(false);mode=base;hud()};
  const cards=UPGRADE_KEYS.map(key=>'<div class="tile"><b>'+UPGRADE_DEFS[key].name+' · '+upgradeLevel(key)+'/5</b><span>'+upgradeStat(key)+'<br>'+UPGRADE_DEFS[key].detail+'</span></div>').join('');
  openPanel('Zbrojownia / laboratorium importu','BUDŻET: '+Math.floor(progress.credits)+' CR','<p>Zakupy na statku. Zwiększenie pojemności dodaje tylko nową pojemność do obecnego życia lub tarczy. Tarcza pochłania trafienie pierwsza, poszycie chroni pozostałe życie.</p><div class="grid-info">'+cards+'</div>',back);
  for(const key of UPGRADE_KEYS){const n=upgradeLevel(key),cost=upgradeCost(key);button(UPGRADE_DEFS[key].name+' / poziom '+n+'/5'+(n===5?' / MAX':' / '+cost+' CR'),()=>{if(buyUpgrade(key)){mode=base;shopMenu()}},'',n>=UPGRADE_LIMIT||progress.credits<cost)}
  button('Wróć na statek',back);
}

// v8: permanent crew departure and a single, persistent named enemy encounter.
// Insert before final bootstrap, then call installBetrayalTypes() once.
const BETRAYAL_TYPES=['traitorVael','traitorSyra'];
const BETRAYAL_STATES=['none','pending','active','defeated'];
const betrayalLabelMaterials=new Map();
function createBetrayalDefaults(){return {departed:false,betrayal:'none',betrayalDue:false}}
// Migration-only: pass the normalized crew record and its ORIGINAL source record.
// Keep strict validation on v8 imports; do not silently normalize malformed v8 saves.
function normalizeCrewBetrayal(c,source=c){
 const departed=source.departed===true||(c.affection===0&&c.trust===0);
 if(!departed)return Object.assign(c,createBetrayalDefaults());
 const state=BETRAYAL_STATES.includes(source.betrayal)&&source.betrayal!=='none'?source.betrayal:'pending';
 return Object.assign(c,{affection:0,trust:0,bond:0,friendship:false,departed:true,betrayal:state,betrayalDue:state==='pending'&&source.betrayalDue===true});
}
function validBetrayalState(c){
 if(!c||typeof c.departed!=='boolean'||!BETRAYAL_STATES.includes(c.betrayal)||typeof c.betrayalDue!=='boolean')return false;
 if(!c.departed)return c.betrayal==='none'&&!c.betrayalDue&&!(c.affection===0&&c.trust===0);
 return c.affection===0&&c.trust===0&&c.betrayal!=='none'&&(c.betrayal==='pending'||!c.betrayalDue);
}
// Add this after ordinary progress/active validation, before replacing live state.
function validBetrayalSnapshot(p,active,pending=0){
 if(!p?.crew?.every(validBetrayalState)||p.crew.some(c=>c.departed&&p.partner===c.name))return false;
 const encounter=!!active&&pending===0,list=active?.enemies||[];
 return p.crew.every((c,i)=>{
  const count=list.filter(e=>e.type===BETRAYAL_TYPES[i]).length;
  return count<=1&&(c.betrayal==='active'?encounter&&count===1:count===0)&&(!c.betrayalDue||encounter);
 });
}
function crewAvailable(i){return !!progress.crew[i]&&!progress.crew[i].departed}
function betrayerIndex(e){return BETRAYAL_TYPES.indexOf(e?.type)}
function installBetrayalTypes(){
 Object.assign(TYPES,{
  traitorVael:{name:'VAEL / UTRACONE ZAUFANIE',hp:38,damage:20,speed:3.1,r:.82,color:0xff8a62,reward:340},
  traitorSyra:{name:'SYRA / REVOKED ACCESS',hp:34,damage:19,speed:3.6,r:.82,color:0xff559c,reward:340}
 });
 for(const type of BETRAYAL_TYPES)enemyPools[type]??=[];
}
function betrayalStatus(c){return c.betrayal==='defeated'?'Pokonany przeciwnik · poza załogą':c.betrayal==='active'?'Na polu walki · wroga frakcja':'Opuścił statek · wróci jako przeciwnik w następnych żniwach'}
// Hub builder should store h.crewIndex=i and h.label=textSprite(...).
function removeDepartedCrewModels(){
 const retained=[];
 for(const npc of npcObjects){
  if(Number.isInteger(npc.crewIndex)&&!crewAvailable(npc.crewIndex)){
   environment.remove(npc.root);
   if(npc.label){environment.remove(npc.label);npc.label.material.dispose()}
  }else retained.push(npc);
 }
 npcObjects=retained;
}
function evaluateCrewDeparture(i){
 const c=progress.crew[i];
 if(!c||c.departed||c.affection!==0||c.trust!==0)return false;
 c.departed=true;c.betrayal='pending';c.betrayalDue=false;c.bond=0;c.friendship=false;
 if(progress.partner===c.name)progress.partner=null;
 const text=i===0?'Wypisuję się z tej załogi. Nie jestem rekordem, który możesz traktować bez szacunku. Następne spotkanie będzie po drugiej stronie celownika.':'Odbieram ci dostęp. Wylogowuję się ze statku — następnym razem zobaczysz mój Permission Set od strony lufy.';
 const previous=c.lastOutcome||{affection:0,trust:0};
 c.lastOutcome={text,affection:previous.affection,trust:previous.trust};
 c.history.push('Opuścił statek po utracie przychylności i zaufania.');c.history=c.history.slice(-8);
 removeDepartedCrewModels();
 notify(c.name+' opuszcza statek. W następnych żniwach stanie po stronie wroga.');
 return true;
}
function showDepartedCrew(i,base){
 const c=progress.crew[i];if(!c)return;
 mode=base;
 const back=()=>{closePanel(false);mode=base;hud()};
 openPanel(c.name+' / opuszcza załogę','KONSEKWENCJE RELACJI','',back);
 $('panel-body').innerHTML=relationshipPanel(i,c,'<h3>To miejsce na pokładzie pozostaje puste.</h3><p class="crew-line">„'+relationshipEscape(c.lastOutcome?.text||'Nasza wspólna służba dobiegła końca.')+'”</p><p>'+relationshipEscape(betrayalStatus(c))+'. Przy 0% przychylności i 0% zaufania odejście jest trwałe.</p>');
 button('Wróć na pokład',back);
}
// Call ONCE on each successful beginMission/resumeHarvest, after setting run/mode.
function armPendingBetrayals(){
 if(!run)return;
 for(const c of progress.crew)if(c.departed&&c.betrayal==='pending')c.betrayalDue=true;
}
function hasPendingBetrayalEncounter(){
 return progress.crew.some(c=>c.departed&&(c.betrayal==='active'||c.betrayal==='pending'&&c.betrayalDue));
}
function betrayerSpawnPoint(i){
 const candidates=i===0?[[-20,-16],[20,16],[-20,16],[20,-16]]:[[20,-16],[-20,16],[20,16],[-20,-16]];
 for(const [x,z] of candidates)if(validSpawnSpot(x,z,.85))return {x,z};
 for(let z=-18;z<=18;z+=6)for(let x=-21;x<=21;x+=6)if(validSpawnSpot(x,z,.85))return {x,z};
 return null;
}
// Call early in updateCombat (before normal quota/completion); never changes run.spawned.
function spawnPendingBetrayals(){
 if(isExcelMission())return 0;
 if(mode!=='combat'||!run)return 0;
 let spawned=0;
 for(let i=0;i<progress.crew.length;i++){
  const c=progress.crew[i],type=BETRAYAL_TYPES[i];
  if(!c.departed||c.betrayal!=='pending'||!c.betrayalDue)continue;
  const existing=enemies.find(e=>e.type===type&&!e.dead&&e.hp>0);
  if(existing){c.betrayal='active';c.betrayalDue=false;continue}
  if(enemies.filter(e=>!e.dead&&e.hp>0).length>=MAX_ACTIVE_ENEMIES)break;
  const point=betrayerSpawnPoint(i);if(!point)continue;
  const e=spawnEnemy(type,point.x,point.z);if(!e)continue;
  c.betrayal='active';c.betrayalDue=false;spawned++;
  e.t=1.6;
  combatToast(c.name+' wraca jako przeciwnik! Dostęp do przyjaźni: DENIED.');
 }
 if(spawned)save();
 return spawned;
}
// Call only after progress + active enemy models + mode have been restored.
function reconcileBetrayalsAfterRestore(){
 const combat=!!run&&pendingWave===0&&sceneKind==='combat';
 for(let i=0;i<progress.crew.length;i++){
  const c=progress.crew[i];if(!c.departed)continue;
  if(progress.partner===c.name)progress.partner=null;
  const existing=enemies.some(e=>e.type===BETRAYAL_TYPES[i]&&!e.dead&&e.hp>0);
  if(existing){c.betrayal='active';c.betrayalDue=false}
  else if(c.betrayal==='active'){c.betrayal='pending';c.betrayalDue=combat}
  else if(!combat)c.betrayalDue=false;
 }
 removeDepartedCrewModels();
}
// Call BEFORE die() clears the current run/enemies. Do not call in generic wipeCombat().
function requeueBetrayalsAfterDeath(){
 for(const c of progress.crew)if(c.departed&&(c.betrayal==='active'||c.betrayal==='pending'&&c.betrayalDue)){
  c.betrayal='pending';c.betrayalDue=false;
 }
}
// Call inside killEnemy after setting dead/hp, before its final hud().
function defeatBetrayer(e){
 const i=betrayerIndex(e);if(i<0)return false;
 const c=progress.crew[i];
 c.departed=true;c.betrayal='defeated';c.betrayalDue=false;
 notify(c.name+' pokonany. Ten konflikt nie wróci w kolejnych żniwach.');
 save();return true;
}
function betrayerShot(e){
 const i=betrayerIndex(e);if(i<0)return false;
 if(e.hp<=0||e.castTime>0)return true;
 const a=Math.atan2(player.x-e.x,player.z-e.z);
 if(i===0){for(const d of [-.14,0,.14])addHostileShot(e,a+d,9.2)}
 else{for(const d of [-.065,.065])addHostileShot(e,a+d,11.2)}
 return true;
}
function betrayerStopDistance(e){return betrayerIndex(e)===0?5.8:5.1}
function betrayerAttackInterval(e){return betrayerIndex(e)===0?1.85:1.45}
// Unlike environment labels, these cached textures survive map rebuilds and enemy pooling.
function betrayerLabel(i){
 if(betrayalLabelMaterials.has(i))return betrayalLabelMaterials.get(i);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;
 const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(15,9,20,.72)';ctx.fillRect(0,4,512,56);ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=i===0?'#ffbc9b':'#ff9fca';ctx.fillText((i===0?'VAEL':'SYRA')+' / DOSTĘP COFNIĘTY',256,33);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});betrayalLabelMaterials.set(i,material);return material;
}
// In makeEnemy, after pool lookup and before generic model: const traitor=makeBetrayerModel(e);if(traitor){actors.add(traitor);return traitor}
function makeBetrayerModel(e){
 const i=betrayerIndex(e);if(i<0)return null;
 const t=TYPES[e.type],h=buildHumanoid('prothean',i===0?0x873c32:0x6e284e),g=h.root;
 const em=mat(t.color,.35,.3,t.color,1.25);
 box(h.body,em,0,1.73,.395,.67,.16,.045);
 for(const s of [-1,1]){box(h.body,M.dark,s*.55,2.03,0,.42,.32,.68);box(h.body,em,s*.59,2.13,.34,.36,.055,.035)}
 if(i===0){for(const s of [-1,1])tube(h.body,[s*.34,2.88,0],[s*.56,3.3,-.1],.065,em)}
 else{box(h.body,em,0,2.66,.31,.45,.045,.035);box(h.body,M.dark,0,1.12,-.27,.65,.7,.12)}
 // Static body meshes merge to a handful of material batches; no extra lights.
 batchStaticMeshes(h.body);
 const hpGroup=new THREE.Group();hpGroup.position.set(0,3.62,0);g.add(hpGroup);
 box(hpGroup,mat(0x111827,0,.8),0,0,0,1.8,.11,.02,false);
 const hpFill=box(hpGroup,em,0,0,.02,1.7,.07,.02,false);
 g.userData.hpGroup=hpGroup;g.userData.hpFill=hpFill;
 const label=new THREE.Sprite(betrayerLabel(i));label.position.set(0,4.1,0);label.scale.set(4.6,.57,1);g.add(label);
 g.userData.betrayer=i;return g;
}

/* v8 persistence and player vitals. Geometry is created once and reused. */
function createHeroVitals(){
 const group=new THREE.Group(),geometry=new THREE.PlaneGeometry(1,1),materials=[];
 function plane(color,w,h,y,z){const material=new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false});materials.push(material);const p=new THREE.Mesh(geometry,material);p.scale.set(w,h,1);p.position.set(0,y,z);p.renderOrder=50;group.add(p);return p}
 plane(0x07141e,2.25,.19,0,0);
 const hpFill=plane(0x80ffd4,2.13,.1,0,.01);
 const shieldBack=plane(0x07141e,2.25,.13,.23,0);
 const shieldFill=plane(0x6baeff,2.13,.065,.23,.01);
 group.renderOrder=50;actors.add(group);
 return {group,hpFill,shieldFill,shieldBack,geometry,materials};
}
const heroVitals=createHeroVitals();
function syncHeroVitals(){
 heroVitals.group.visible=active&&player.hp>0;
 heroVitals.group.position.set(player.x,3.65,player.z);
 heroVitals.group.quaternion.copy(camera.quaternion);
 const hp=Math.max(0,Math.min(1,player.hp/maxHealth())),shield=maxShield()?Math.max(0,Math.min(1,(player.shield||0)/maxShield())):0;
 heroVitals.hpFill.scale.x=2.13*hp;heroVitals.hpFill.position.x=(hp-1)*1.065;
 heroVitals.hpFill.material.color.setHex(hp>.5?0x80ffd4:hp>.25?0xffd479:0xff637e);
 heroVitals.shieldBack.visible=heroVitals.shieldFill.visible=maxShield()>0;
 heroVitals.shieldFill.scale.x=2.13*shield;heroVitals.shieldFill.position.x=(shield-1)*1.065;
}

function addV8Fields(copy){
 const p=copy.progress;
 p.version=8;copy.version=8;
 p.upgrades={damage:p.upgrades?.damage,rate:p.upgrades?.rate,armor:0,shield:0,plating:0,biotic:0,mobility:0};
 p.crew=p.crew.map(c=>normalizeCrewBetrayal({...c,...createBetrayalDefaults()},{}));
 if(p.crew.some(c=>c.departed&&c.name===p.partner))p.partner=null;
 if(copy.active){copy.active.player={...copy.active.player,shield:0,rechargeWait:0}}
 if(copy.pendingWave===undefined)copy.pendingWave=0;
 return copy;
}



// v9: final chapter, backwards-compatible campaign saves and encounter presentation.
function isExcelMission(){return !!run&&run.mission===EXCEL_MISSION}









function mapMenu(){
 if(!safeLocation())return;
 const base=mode,back=()=>{closePanel(false);mode=base;hud()};
 openPanel(pendingWave?'Kontynuuj operację':'Mapa galaktyki','SZLAK OMEGA / M','',back);
 if(pendingWave){$('panel-body').innerHTML='<p>Jesteś na statku między żniwami. Dokończ bieżącą operację, aby wybrać następną misję.</p>';button('▶ '+MISSIONS[run.mission].name+' / żniwa '+pendingWave,resumeHarvest,'primary')}
 else{
  $('panel-body').innerHTML='<p>Siedem operacji prowadzi do <b>ósmego rozdziału: ostatniego pojedynku z Excelem.</b> Finał to jeden boss bez przerw na żniwa. Marc Benioff pojawi się z ratunkowym deploymentem. Wcześniejsze misje można powtarzać po kredyty na ulepszenia.</p>';
  if(progress.completed.includes(FINAL_MISSION)&&!progress.completed.includes(EXCEL_MISSION))button('▶ NOWY FINAŁ: EXCEL / KONIEC ARKUSZA',excelBriefing,'primary');
  MISSIONS.forEach((m,i)=>{const unlocked=i===0||progress.completed.includes(i-1);button((progress.completed.includes(i)?'✓ ':'')+(i===3?'🔴 OMEGA → ':'')+m.name+(i===EXCEL_MISSION?' / OSTATECZNY POJEDYNEK':' / '+m.waves+' żniwa')+' / '+m.reward+' CR',()=>i===EXCEL_MISSION?excelBriefing():beginMission(i),i===EXCEL_MISSION?'danger':'',!unlocked)})
 }
 button('Wróć na pokład',back);
}
function beginMission(i){
 if(!Number.isInteger(i)||i<0||i>=MISSIONS.length||i>0&&!progress.completed.includes(i-1))return;
 wipeCombat();run={mission:i,wave:1,spawned:0,clock:1.2,bossSpawned:false};pendingWave=0;player=defensePlayer(0,15);indo=16;mode='combat';
 buildEnvironment('combat');
 if(i===EXCEL_MISSION){initializeExcelEncounter();indo=999}else{armPendingBetrayals();spawnPendingBetrayals()}
 closePanel(false);hud();save();sound(95,.5,'sawtooth',.025);
 notify(i===EXCEL_MISSION?(progress.excelFirstFormCleared?'WŚCIEKŁY EXCEL: „TERAZ TO JA JESTEM DUPLIKATEM!” / C: ZIPsert · E: pomoc Marca':'EXCEL: „Zapisz jako: ostatnia_nadzieja_FINAL_v3.xlsx”. Wypatruj Marca i naciśnij E przy jego hologramie!'):i===3?'OMEGA: skok do jądra. Zwiastun oferuje migrację na Excela.':'Operacja '+MISSIONS[i].name+'. Załoga pozostaje na statku.');
}
function returnToShip(completed=false){
 if(!run)return;
 const id=run.mission,m=MISSIONS[id];
 if(completed){progress.credits+=m.reward;if(!progress.completed.includes(id))progress.completed.push(id);if(id===EXCEL_MISSION)progress.won=true;run=null;pendingWave=0}else pendingWave=run.wave+1;
 progress.visit++;wipeCombat();player=defensePlayer(0,8);mode=completed?'hub':'break';buildEnvironment('hub');hud();save();sound(620,.3,'triangle',.04);
 if(completed){
  const victory=id===EXCEL_MISSION,harbinger=id===FINAL_MISSION;
  openPanel(m.name+' / ukończona',victory?'EXCEL POKONANY / KONIEC ARKUSZA':harbinger?'ZWIASTUN POKONANY / EXCEL ODBIERA TELEFON':'RAPORT PO MISJI','<p>Premia: <b>'+m.reward+' CR</b>. '+(victory?'Obie formy Excela pokonane. Wszystkie duplikaty zniknęły. „Program nie odpowiada” — nareszcie ostatecznie. Marc: „Gratulacje! Za ten import nie naliczę API calla. Pierwszy gratis.” Galaktyka ocalona; możesz powtarzać misje.':harbinger?'Zwiastun pokonany. Z jego sejfu wysunął się plik budżet_FINAL_OSTATECZNY.xlsx. Excel jest ostatnim bossem. Przygotuj sprzęt i wybierz nowy finał na mapie.':'Następna misja odblokowana. Załoga czeka — i pyta, czy jest backup.')+'</p>');
  if(harbinger)button('▶ Ostatni boss: Excel',excelBriefing,'primary');
  button('Wróć na pokład',()=>{closePanel(false);mode='hub';hud()},victory?'primary':'');
 }else breakMenu();
}


/* v10: procedural spreadsheet arena, Excel boss and fictional Marc support hologram. */
const excelVisualTextures=new Map();
const excelVisualLabelMaterials=new Map();
let marcSupportVisual=null;
const excelVisualOwnedMaterials=[];
let excelArenaVisualStage=0;
function excelCanvasTexture(key,draw,width=1024,height=1024){
 if(excelVisualTextures.has(key))return excelVisualTextures.get(key);
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;excelVisualTextures.set(key,texture);return texture;
}
function excelMapSurface(stage=1){
 const rage=stage===2;
 return excelCanvasTexture(rage?'arena-rage':'arena',(a,w,h)=>{
  a.fillStyle=rage?'#260d16':'#0d211e';a.fillRect(0,0,w,h);
  const header=48,cell=(w-header)/8;
  a.fillStyle=rage?'#7d2731':'#1d674a';a.fillRect(0,0,w,header);a.fillRect(0,0,header,h);
  a.font='bold 25px Arial';a.textAlign='center';a.textBaseline='middle';a.fillStyle='#caf5df';
  for(let n=0;n<8;n++){a.fillText(String.fromCharCode(65+n),header+(n+.5)*cell,header/2);a.fillText(String(n+1),header/2,header+(n+.5)*cell)}
  a.lineWidth=2;a.strokeStyle=rage?'#66303c':'#285744';
  for(let n=0;n<=8;n++){const p=header+n*cell;a.beginPath();a.moveTo(p,header);a.lineTo(p,h);a.stroke();a.beginPath();a.moveTo(header,p);a.lineTo(w,p);a.stroke()}
  a.fillStyle='#b8ddc5';a.font='17px monospace';
  const notes=rage?[[1,1,'DUPLICATE'],[6,1,'DUPLICATE'],[1,6,'ID=0001'],[6,6,'ID=0001'],[3,4,'=CTRL_C()']]:[[1,1,'#REF!'],[6,1,'#N/A'],[1,6,'#VALUE!'],[6,6,'#SPILL!'],[3,4,'=BOSS()']];
  for(const [x,y,text]of notes)a.fillText(text,header+(x+.5)*cell,header+(y+.5)*cell);
  a.strokeStyle=rage?'#ff967e':'#64e7ad';a.lineWidth=5;a.strokeRect(header+3*cell,header+3*cell,2*cell,2*cell);
  a.fillStyle=rage?'#ff967e':'#64e7ad';a.fillRect(header+5*cell-5,header+5*cell-5,10,10);
 });
}
function excelLayout(){
 // Open centre, clear medical pads (0,+/-17), spawn (0,15), boss (0,-8), support corners.
 return [{x:-13,z:-1,w:5.2,d:2},{x:13,z:-1,w:5.2,d:2},{x:-12,z:9,w:4,d:1.8},{x:12,z:9,w:4,d:1.8}];
}
function excelScreenTexture(stage=1){
 const rage=stage===2;
 return excelCanvasTexture(rage?'boss-screen-rage':'boss-screen',(a,w,h)=>{
  a.fillStyle=rage?'#ffd7c8':'#e7fff0';a.fillRect(0,0,w,h);a.fillStyle=rage?'#792930':'#246343';a.fillRect(0,0,w,105);
  a.fillStyle='#c9f9de';a.font='bold 48px Arial';a.textBaseline='middle';a.fillText(rage?'DUPLIKAT_FINAL_FINAL.xlsx':'FINAL_FINAL_V10.xlsx',35,53);
  a.strokeStyle='#94bda4';a.lineWidth=3;
  for(let x=25;x<w;x+=100){a.beginPath();a.moveTo(x,120);a.lineTo(x,h);a.stroke()}
  for(let y=140;y<h;y+=100){a.beginPath();a.moveTo(0,y);a.lineTo(w,y);a.stroke()}
  a.fillStyle='#0d3b27';a.font='bold 76px monospace';a.textAlign='center';a.fillText(rage?'=DUPLIKUJ(GALAKTYKĘ)':'=DOMINACJA()',w/2,220);
  a.fillStyle=rage?'#ed271d':'#d26051';a.save();if(rage){a.translate(260,373);a.rotate(.17);a.fillRect(-140,-43,280,86);a.restore();a.save();a.translate(764,373);a.rotate(-.17);a.fillRect(-140,-43,280,86);a.restore()}else{a.fillRect(120,330,280,86);a.fillRect(624,330,280,86);a.restore()}
  a.fillStyle='#412d25';a.fillRect(190,348,80,50);a.fillRect(694,348,80,50);
  a.fillStyle='#24533b';a.font='bold 52px monospace';a.fillText(rage?'DUPLICATE_VALUE':'BRAK ODPOWIEDZI',w/2,565);
  a.font='bold 40px monospace';a.fillStyle='#d26051';a.fillText(rage?'#WŚCIEKŁOŚĆ!':'#ZEMSTA!',w/2,720);
  a.fillStyle='#7d9e87';a.font='28px monospace';a.fillText(rage?'Tego rekordu NIE DA SIĘ SCALIĆ.':'Czy na pewno chcesz zapisać galaktykę?',w/2,910);
 });
}
function excelVisualLabel(key,text,color='#c6ffe0',width=1024){
 if(excelVisualLabelMaterials.has(key))return excelVisualLabelMaterials.get(key);
 const texture=excelCanvasTexture('label-'+key,(a,w,h)=>{
  a.fillStyle='rgba(4,19,17,.86)';a.fillRect(0,0,w,h);
  a.fillStyle=color;a.font='bold '+(width>600?42:28)+'px Arial';a.textBaseline='middle';a.textAlign='center';a.fillText(text,w/2,h/2);
 },width,80);
 const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});excelVisualLabelMaterials.set(key,material);return material;
}
function excelShieldTexture(){
 return excelCanvasTexture('shield-grid',(a,w,h)=>{
  a.fillStyle='rgba(128,255,226,.60)';a.fillRect(0,0,w,h);
  a.strokeStyle='rgba(211,255,248,.98)';a.lineWidth=2;
  const r=17,stepY=Math.sqrt(3)*r;
  for(let col=-1;col<7;col++)for(let row=-1;row<6;row++){
   const x=col*r*1.5,y=row*stepY+(col%2?stepY/2:0);a.beginPath();
   for(let k=0;k<6;k++){const angle=k*Math.PI/3;a.lineTo(x+Math.cos(angle)*r,y+Math.sin(angle)*r)}
   a.closePath();a.stroke();
  }
 },128,128);
}
function makeExcelModel(e){
 if(e.type!=='excel')return null;
 const g=new THREE.Group(),book=new THREE.Group();g.add(book);
 // Model-owned clones prevent a furious pooled workbook from tinting another arena/model.
 const green=mat(0x23734e,.5,.4).clone(),bright=mat(0x6cf4a9,.3,.4,0x35c87b,.8).clone(),dark=mat(0x102a22,.4,.5).clone(),page=mat(0xd8e7d8,.1,.8).clone(),steel=mat(0x55766b,.6,.5).clone();
 g.userData.excelBodyMaterials={green,bright,dark,page,steel};
 box(book,dark,0,3.65,0,4.65,4.7,1.25);box(book,page,.12,3.65,.2,4.45,4.4,1.04);
 for(let n=0;n<5;n++)box(book,steel,.1,1.58+n*.83,.76,4.2,.035,.045,false);
 box(book,green,-1.85,3.65,.82,1.4,4.72,.32);
 const normalFace=excelScreenTexture(1),rageFace=excelScreenTexture(2),frontMaterial=new THREE.MeshBasicMaterial({map:normalFace,toneMapped:false});
 const screen=mesh(book,G.plane,frontMaterial,.67,3.69,.77,3.36,4.17,1,false);
 g.userData.excelScreen=screen;g.userData.excelNormalFace=normalFace;g.userData.excelRageFace=rageFace;
 for(const angle of [-.59,.59]){const xbar=box(book,bright,-1.85,3.75,1.005,.22,1.44,.045,false);xbar.rotation.z=angle}
 for(const side of [-1,1]){
  box(book,dark,side*1.1,.35,.28,1.2,.55,1.8);box(book,green,side*1.1,1.03,0,.66,1.1,.77);
  box(book,bright,side*1.1,.42,1.2,.75,.12,.08,false);
  tube(book,[side*2.26,4.4,0],[side*3.1,3.25,.13],.23,steel);tube(book,[side*3.1,3.25,.13],[side*3.35,2.45,.85],.2,green);
  box(book,dark,side*3.35,2.22,1.03,.8,.52,.76);box(book,bright,side*3.35,2.25,1.43,.42,.16,.07,false);
 }
 const crown=mesh(g,new THREE.TorusGeometry(2.9,.055,6,40),bright,0,5.95,0);crown.rotation.x=Math.PI/2;g.userData.crown=crown;
 const hpGroup=new THREE.Group();hpGroup.position.set(0,6.65,0);g.add(hpGroup);
 box(hpGroup,M.dark,0,0,0,1.8,.11,.02,false);
 const hpFill=box(hpGroup,bright,0,0,.02,1.7,.07,.02,false);g.userData.hpGroup=hpGroup;g.userData.hpFill=hpFill;
 const titleNormal=excelVisualLabel('boss','EXCEL / ARKUSZ OSTATECZNY'),titleRage=excelVisualLabel('boss-rage','WŚCIEKŁY EXCEL / DUPLICATE_VALUE','#ffb098');
 const title=new THREE.Sprite(titleNormal);title.position.set(0,7.3,0);title.scale.set(8,.64,1);g.add(title);
 g.userData.excelTitle=title;g.userData.excelNormalTitle=titleNormal;g.userData.excelRageTitle=titleRage;
 // A filled cell-patterned shell clearly communicates immunity, even at the default camera angle.
 const shield=new THREE.Group();g.add(shield);
 const shieldMaterial=new THREE.MeshBasicMaterial({map:excelShieldTexture(),color:0x6cffe3,transparent:true,opacity:.28,depthWrite:false,toneMapped:false});
 const shell=mesh(shield,new THREE.SphereGeometry(1,16,10),shieldMaterial,0,3.15,0,4.45,3.8,3.25,false);shell.renderOrder=3;
 const ringMaterial=new THREE.MeshBasicMaterial({color:0x9ffff0,transparent:true,opacity:.85,depthWrite:false,toneMapped:false});
 const ring1=mesh(shield,new THREE.TorusGeometry(3.9,.085,5,48),ringMaterial,0,3.15,0,1,1,1,false);ring1.rotation.y=.4;
 const ring2=mesh(shield,new THREE.TorusGeometry(3.9,.085,5,48),ringMaterial,0,3.15,0,1,1,1,false);ring2.rotation.y=2;
 const shieldLabel=new THREE.Sprite(excelVisualLabel('boss-shield','ARKUSZ CHRONIONY / NIETYKALNY','#cafff5'));shieldLabel.position.set(0,8.1,0);shieldLabel.scale.set(9.5,.62,1);shield.add(shieldLabel);
 g.userData.excelShield=shield;g.userData.excelShieldShell=shell;g.userData.excelShieldMaterial=shieldMaterial;g.userData.excelShieldRingMaterial=ringMaterial;g.userData.excelShieldLabel=shieldLabel;
 const rage=new THREE.Group();g.add(rage);rage.visible=false;g.userData.excelRage=rage;
 const rageGlow=mat(0xff8561,.3,.4,0xff3b23,1.2),ragePaper=mat(0xffc5ae,.2,.7),rageInk=mat(0x6c1324,.2,.7);
 for(const side of [-1,1]){
  tube(rage,[side*1.8,5.8,0],[side*2.3,6.65,.08],.13,rageInk);tube(rage,[side*2.3,6.65,.08],[side*2.75,7.15,.25],.09,rageGlow);
  sphere(rage,rageGlow,side*2.75,7.15,.25,.14);
  for(let n=0;n<2;n++){
   const x=side*(3.35+n*.2),y=4.3+n*1.15,z=.15-n*.35;
   const sheet=box(rage,ragePaper,x,y,z,.85,1.0,.1);sheet.rotation.z=side*(.17+n*.11);
   for(let line=0;line<3;line++)box(rage,rageInk,x,y-.22+line*.23,z+.065,.6,.055,.03,false);
   box(rage,rageGlow,x,y+.43,z+.075,.75,.08,.035,false);
  }
 }
 batchStaticMeshes(rage);
 const shadow=mesh(g,new THREE.CircleGeometry(3.5,24),new THREE.MeshBasicMaterial({color:0x010b05,transparent:true,opacity:.4,depthWrite:false}),0,.025,0);shadow.rotation.x=-Math.PI/2;
 batchStaticMeshes(book);
 return g;
}
function createMarcSupportVisual(){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const jacket=mat(0x1c6684,.4,.5,0x0e4a70,.4),skin=mat(0xc59f80,.1,.8),beard=mat(0x3d3430,.1,.8),hair=mat(0x5d5651,.2,.8),white=mat(0xc1f3ef,.1,.5,0x3faaa8,.5);
 // Deliberately cartoon-like fictional support projection, not a photographic likeness.
 box(body,jacket,0,1.78,0,1.17,1.18,.58);box(body,white,0,1.81,.31,.34,.87,.055);
 sphere(body,skin,0,2.81,.02,.39);sphere(body,hair,0,3.02,-.08,.35);
 const chin=sphere(body,beard,0,2.63,.24,.31);chin.scale.set(.95,.7,.7);
 for(const s of [-1,1]){sphere(body,skin,s*.37,2.81,0,.09);sphere(body,M.black,s*.12,2.84,.365,.045);box(body,M.dark,s*.28,.65,0,.39,1,.42);box(body,M.dark,s*.28,.15,.13,.46,.25,.7)}
 const wavingArm=new THREE.Group();wavingArm.position.set(-.7,2.18,0);body.add(wavingArm);box(wavingArm,jacket,0,.27,0,.29,.68,.36);sphere(wavingArm,skin,0,.69,0,.16);wavingArm.rotation.z=-.42;
 box(body,jacket,.7,1.83,.05,.3,.74,.36);sphere(body,skin,.7,1.37,.08,.15);
 // Cloud-shaped chest emblem made of just three small spheres.
 for(const [x,y,r]of [[-.1,2.04,.1],[.04,2.1,.13],[.15,2.02,.09]])sphere(body,white,x,y,.355,r);
 const beaconMat=new THREE.MeshBasicMaterial({color:0x67dfff,transparent:true,opacity:.7,depthWrite:false,toneMapped:false});
 const floorMat=new THREE.MeshBasicMaterial({color:0x14869b,transparent:true,opacity:.18,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
 excelVisualOwnedMaterials.push(beaconMat,floorMat);
 const ring=mesh(root,new THREE.TorusGeometry(2.1,.07,5,48),beaconMat,0,.075,0,1,1,1,false);ring.rotation.x=Math.PI/2;
 const disc=mesh(root,new THREE.CircleGeometry(2.05,32),floorMat,0,.045,0);disc.rotation.x=-Math.PI/2;
 for(let n=0;n<4;n++){const a=n*Math.PI/2;box(root,beaconMat,Math.cos(a)*2.1,.15,Math.sin(a)*2.1,.15,.3,.15,false)}
 const label=new THREE.Sprite(excelVisualLabel('marc','MARC BENIOFF / DEPLOYMENT RATUNKOWY','#a1ecff'));label.position.set(0,4.35,0);label.scale.set(9,.66,1);root.add(label);
 const prompt=new THREE.Sprite(excelVisualLabel('marc-action','E / SKORZYSTAJ ZE WSPARCIA','#d5fff2',640));prompt.position.set(0,3.75,0);prompt.scale.set(5.7,.58,1);root.add(prompt);
 root.visible=false;root.userData.marcSupport=true;environment.add(root);
 batchStaticMeshes(body,[wavingArm]);
 marcSupportVisual={root,body,wavingArm,ring,beaconMat,disc,label,prompt};return root;
}
function decorateExcelArena(){
 const neon=mat(0x3bdf91,.3,.4,0x1fc777,.9),green=mat(0x194f35,.5,.5),paper=mat(0xadc4b4,.2,.8);
 excelMapSurface(2);excelArenaVisualStage=1;floorMat.map=excelMapSurface(1);floorMat.color.setHex(0xaad6ba);floorMat.needsUpdate=true;
 planet.material.color.setHex(0x246544);
 for(const x of [-24,24])for(const z of [-16,-6,4,14]){
  box(environment,M.dark,x,1.6,z,1.2,3.2,2);box(environment,green,x,3.3,z,1.5,.25,2.3);
  for(let n=0;n<3;n++)box(environment,neon,x,1+n*.65,z+1.03,.75,.1,.05,false);
 }
 for(const z of [-19,19])for(const x of [-17,17]){
  box(environment,M.dark,x,.75,z,3.8,1.5,1.8);box(environment,paper,x,1.52,z,3.5,.08,1.65);
  box(environment,green,x,1.61,z+.1,3.65,.1,1.6);
 }
 textSprite(environment,'EXCEL / OSTATNI ARKUSZ GALAKTYKI',0,7.9,-20,'#a9ffcb',15,.8);
 textSprite(environment,'BRAK ŻNIW. BRAK AUTOSUMY. TYLKO TY I OSTATNI BOSS.',0,6.8,-20,'#9cc7b1',16,.6);
 textSprite(environment,'MARC: „NIE ZMIENIAJ GALAKTYKI W ZAŁĄCZNIK.”',0,5.8,-20,'#9ddbf0',14,.58);
 createMarcSupportVisual();
}
function showMarcSupport(state){
 if(!marcSupportVisual||!state)return;
 const visible=state.support==='available';marcSupportVisual.root.visible=visible;
 if(visible)marcSupportVisual.root.position.set(state.supportX,0,state.supportZ);
}
function syncExcelVisuals(dt){
 if(!run||run.mission!==EXCEL_MISSION)return;
 const state=run.excel,stage=state&&state.stage===2?2:1;
 if(state)showMarcSupport(state);
 if(excelArenaVisualStage!==stage){
  excelArenaVisualStage=stage;floorMat.map=excelMapSurface(stage);floorMat.color.setHex(stage===2?0xe5b4a5:0xaad6ba);floorMat.needsUpdate=true;
  planet.material.color.setHex(stage===2?0x6c2434:0x246544);
 }
 if(marcSupportVisual&&marcSupportVisual.root.visible){
  const v=marcSupportVisual;v.body.position.y=.2+Math.sin(time*2.2)*.065;v.wavingArm.rotation.z=-.42+Math.sin(time*3)*.16;
  v.ring.rotation.z=time*.55;v.beaconMat.opacity=.6+Math.sin(time*5)*.16;
  v.body.rotation.y=Math.atan2(player.x-v.root.position.x,player.z-v.root.position.z);
 }
 for(const e of enemies){if(e.type!=='excel'||e.hp<=0||!e.model)continue;
  const model=e.model,data=model.userData,rage=stage===2;
  if(data.excelVisualStage!==stage){
   data.excelVisualStage=stage;
   const m=data.excelBodyMaterials;
   if(m){m.green.color.setHex(rage?0x922c32:0x23734e);m.bright.color.setHex(rage?0xff9873:0x6cf4a9);m.bright.emissive.setHex(rage?0xd52d1b:0x35c87b);m.dark.color.setHex(rage?0x32101b:0x102a22);m.page.color.setHex(rage?0xffc1a7:0xd8e7d8);m.steel.color.setHex(rage?0x965349:0x55766b)}
   if(data.excelScreen){data.excelScreen.material.map=rage?data.excelRageFace:data.excelNormalFace;data.excelScreen.material.needsUpdate=true}
   if(data.excelTitle)data.excelTitle.material=rage?data.excelRageTitle:data.excelNormalTitle;
   if(data.excelRage)data.excelRage.visible=rage;
  }
  const shield=data.excelShield,protectedNow=!state||state.exposure<=0;
  if(shield){
   shield.visible=protectedNow;shield.rotation.y=time*.23;
   // Labels remain above the model while the shield shell can slowly rotate around it.
   if(data.excelShieldLabel){data.excelShieldLabel.visible=protectedNow;data.excelShieldLabel.position.set(0,8.1,0)}
   const flash=Math.max(0,Math.min(1,(e.shieldFlash||0)/.3));
   if(data.excelShieldMaterial){data.excelShieldMaterial.opacity=.26+Math.sin(time*3)*.025+flash*.3;data.excelShieldMaterial.color.setHex(flash>0?0xfff6b6:rage?0x9aacff:0x6cffe3)}
   if(data.excelShieldRingMaterial){data.excelShieldRingMaterial.opacity=.82+flash*.18;data.excelShieldRingMaterial.color.setHex(flash>0?0xfffee2:rage?0xc3c6ff:0x9ffff0)}
  }
  if(data.excelRage&&rage){data.excelRage.position.y=Math.sin(time*4)*.045;data.excelRage.rotation.y=Math.sin(time*1.6)*.06}
  if(data.crown){data.crown.rotation.z=0;data.crown.rotation.y=time*(rage?.7:.3)}
 }
}
function getExcelVisualExclusions(){return marcSupportVisual?[marcSupportVisual.root]:[]}
function clearExcelVisuals(){
 excelArenaVisualStage=0;
 if(marcSupportVisual){marcSupportVisual.root.traverse(o=>{if(o.isMesh&&!Object.values(G).includes(o.geometry))o.geometry.dispose()});environment.remove(marcSupportVisual.root);marcSupportVisual=null}
 for(const material of excelVisualOwnedMaterials)material.dispose();excelVisualOwnedMaterials.length=0;
}


/* v10: original fight followed by a persistent furious Excel form. */
function createExcelState(stage=1){return {stage,rageHelpUsed:0,support:'waiting',supportTimer:3,exposure:0,supportX:-16,supportZ:12,supportIndex:0,helpUsed:0,elapsed:0,phase:1,attackTimer:3.4,attackIndex:0,grace:stage===2?3:2,blockedNotice:0,defeated:false}}
function validExcelState(s){
 if(!s||![1,2].includes(s.stage)||!['waiting','available','exposed'].includes(s.support)||typeof s.defeated!=='boolean')return false;
 const ranges={supportTimer:[0,12],exposure:[0,9],supportX:[-22,22],supportZ:[-18,18],elapsed:[0,1e8],attackTimer:[0,8],grace:[0,3],blockedNotice:[0,4]};
 if(!Object.entries(ranges).every(([k,[lo,hi]])=>Number.isFinite(s[k])&&s[k]>=lo&&s[k]<=hi))return false;
 if(!['supportIndex','helpUsed','rageHelpUsed','attackIndex'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0&&s[k]<1e9)||s.rageHelpUsed>s.helpUsed||!Number.isInteger(s.phase)||s.phase<1||s.phase>3)return false;
 if(s.stage===1&&s.rageHelpUsed!==0)return false;
 if(s.defeated&&(s.stage!==2||s.rageHelpUsed===0))return false;
 return s.support==='exposed'?s.exposure>0&&s.supportTimer===0&&s.helpUsed>0&&(s.stage===1||s.rageHelpUsed>0):s.exposure===0;
}
function excelEncounter(){return !!run&&run.mission===EXCEL_MISSION}
function excelPhase(e){return e.hp/e.maxHp>2/3?1:e.hp/e.maxHp>1/3?2:3}
function excelBoss(){return enemies.find(e=>e.type==='excel'&&e.hp>0)}
function initializeExcelEncounter(){
 if(!excelEncounter())return null;
 run.excel??=createExcelState(progress.excelFirstFormCleared?2:1);
 if(run.excel.defeated)return null;
 let e=excelBoss();if(!e){e=spawnEnemy('excel',0,-8);if(e)e.hp=e.maxHp=excelMaxHealth(run.excel.stage)}
 if(e){run.bossSpawned=true;e.t=999;run.excel.phase=excelPhase(e)}
 if(typeof showMarcSupport==='function')showMarcSupport(run.excel);
 return e;
}
function excelSupportPoint(index){
 const candidates=[[-16,12],[16,12],[-16,-12],[16,-12],[0,15],[-18,0],[18,0]];
 for(let j=0;j<candidates.length;j++){const [x,z]=candidates[(index+j)%candidates.length];if(!blocked(x,z,1.5))return {x,z}}
 // A valid player position is always reachable, so map edits cannot make support impossible.
 return {x:Math.max(-22,Math.min(22,player.x)),z:Math.max(-18,Math.min(18,player.z))};
}
function announceMarcSupport(s){
 const quotes=['Ohana znaczy: nikt nie zostaje sam w CSV. Podejdź i naciśnij E!','Hasło ochrony arkusza? Trailblazer123! Podejdź i naciśnij E!','Nie kupuj Excela. Ten deployment jest na mój koszt! E przy hologramie.','Twój Permission Set właśnie dostał uprawnienie: POKONAJ ARKUSZ. E!'];
 notify('MARC BENIOFF / '+quotes[(s.supportIndex-1)%quotes.length]);
 combatToast('MARC WKRACZA DO AKCJI / PODEJDŹ DO HOLOGRAMU + E');
 sound(660,.23,'triangle',.035);
}
function advanceExcelPhase(e){
 const s=run.excel,p=excelPhase(e);if(s.phase===p)return;
 s.phase=p;s.grace=2;s.attackTimer=Math.max(s.attackTimer,s.stage===2?2:2.3);
 // A phase change grants room to read the next pattern, never restores boss HP.
 for(let i=combatWarnings.length-1;i>=0;i--)if(combatWarnings[i].owner===e)combatWarnings.splice(i,1);
 e.castTime=0;
 notify(s.stage===2?(p===2?'WŚCIEKŁY EXCEL / FAZA II: „DUPLIKUJĘ KŁOPOTY. NIE DANE!”':'WŚCIEKŁY EXCEL / FAZA III: „CTRL+C. CTRL+V. CTRL+Z? ZA PÓŹNO!”'):p===2?'EXCEL / FAZA II: „SCALAM KOMÓRKI. I WASZE NADZIEJE.”':'EXCEL / FAZA III: „NIE ODPOWIADAM. ALE NADAL STRZELAM.”');
 burst(e.x,e.z,0x7dffb0,20);
}
function updateExcelEncounter(dt){
 if(mode!=='combat'||!excelEncounter()||!run.excel||!Number.isFinite(dt)||dt<=0)return;
 const s=run.excel;if(s.defeated)return;
 const e=excelBoss();if(!e)return;
 advanceExcelPhase(e);
 s.elapsed=Math.min(1e8,s.elapsed+dt);s.blockedNotice=Math.max(0,s.blockedNotice-dt);s.grace=Math.max(0,s.grace-dt);
 if(s.support==='exposed'){
  s.exposure=Math.max(0,s.exposure-dt);
  if(s.exposure===0){s.support='waiting';s.supportTimer=s.stage===2?6:8;notify('EXCEL ZNÓW CHRONI ARKUSZ / przetrwaj do kolejnej pomocy Marca.');if(typeof showMarcSupport==='function')showMarcSupport(s)}
 }else{
  s.supportTimer=Math.max(0,s.supportTimer-dt);
  if(s.supportTimer===0){
   if(s.support==='waiting'){
    const p=excelSupportPoint(s.supportIndex);s.supportX=p.x;s.supportZ=p.z;s.supportIndex++;s.support='available';s.supportTimer=12;announceMarcSupport(s);
   }else{s.support='waiting';s.supportTimer=6;notify('MARC: „Zgubiłem połączenie z Dreamforce. Zaraz wracam!” / kolejna szansa za 6 s.')}
   if(typeof showMarcSupport==='function')showMarcSupport(s);
  }
 }
 s.attackTimer=Math.max(0,s.attackTimer-dt);
 if(s.grace<=0&&s.attackTimer<=0&&(e.castTime||0)<=0){queueExcelAttack(e);s.attackTimer=s.stage===2?(s.phase===3?1.75:s.phase===2?2:2.3):s.phase===3?2.25:s.phase===2?2.85:3.5}
}
function tryMarcSupport(){
 if(!excelEncounter()||mode!=='combat')return false;
 const s=run.excel;
 if(!s||s.defeated)return true;
 if(s.support!=='available'){notify(s.exposure>0?'ARKUSZ ODBLOKOWANY / strzelaj, zanim Excel znów włączy ochronę!':'Marc szykuje kolejny deployment. Unikaj ataków do pojawienia się hologramu.');return true}
 if(Math.hypot(player.x-s.supportX,player.z-s.supportZ)>3.8){notify('Podejdź do świecącego hologramu Marca i naciśnij E. Pomoc nie działa przez Excela.');return true}
 s.support='exposed';s.supportTimer=0;s.exposure=s.stage===2?(s.phase===3?5.5:s.phase===2?6:6.5):s.phase===3?7:s.phase===2?8:9;s.helpUsed++;if(s.stage===2)s.rageHelpUsed++;s.grace=s.stage===2?1.5:2;s.attackTimer=Math.max(s.attackTimer,s.stage===2?1.8:2.3);
 player.hp=Math.min(maxHealth(),player.hp+30);player.shield=Math.min(maxShield(),(player.shield||0)+45);player.rechargeWait=0;inv=Math.max(inv,1);
 const e=excelBoss();
 for(const b of hostile)if(Math.hypot(b.x-player.x,b.z-player.z)<9)b.dead=true;
 for(let i=combatWarnings.length-1;i>=0;i--)if(combatWarnings[i].owner===e)combatWarnings.splice(i,1);
 if(e)e.castTime=0;
 if(typeof showMarcSupport==='function')showMarcSupport(s);
 burst(player.x,player.z,0x7bfaff,24);sound(920,.3,'triangle',.04);
 notify('MARC: „Ochrona zdjęta! Ten Permission Set nie wymaga dopłaty.” / STRZELAJ przez '+s.exposure+' s! +30 życia / +45 tarczy');
 combatToast('DEPLOYMENT MARCA / EXCEL PODATNY NA OBRAŻENIA');hud();save();
 return true;
}
// Handled=true for every Excel hit, including a protected hit. Root must return immediately.
function excelDamage(e,n){
 if(e.type!=='excel')return false;
 if(e.hp<=0||e.dead||!Number.isFinite(n)||n<=0)return true;
 const s=excelEncounter()?run.excel:null;
 if(!s||s.exposure<=0||s.helpUsed===0||s.stage===2&&s.rageHelpUsed===0){
  e.shieldFlash=.35;
  if(s&&s.blockedNotice<=0){s.blockedNotice=3;notify('ARKUSZ CHRONIONY / bez pomocy Marca obrażenia wynoszą 0. Szukaj hologramu i użyj E!')}
  return true;
 }
 e.hp=Math.max(0,e.hp-n);
 if(e.hp===0){if(s.stage===1)startExcelRage(e);else{s.defeated=true;killEnemy(e)}}else{e.flash=.15;advanceExcelPhase(e);burst(e.x,e.z,0x7bffbc,3)}
 return true;
}
function queueExcelAttack(e){
 if(run.excel.stage===2){queueExcelRageAttack(e);return}
 const s=run.excel,p=s.phase,index=s.attackIndex++%3;
 if(index===1){
  const x=player.x,z=player.z,delay=p===3?1.25:1.45,damage=p===3?62:p===2?48:36;
  if(p===1)queueCombatWarning(e,'impact',x,z,3,delay,damage);
  else{
   // A highlighted spreadsheet row forces a perpendicular dodge rather than passive circling.
   const count=p===3?7:5,step=p===3?6:8,radius=p===3?3.25:3.8;
   for(let j=0;j<count;j++)queueCombatWarning(e,'impact',(j-(count-1)/2)*step,z,radius,delay,damage);
   if(p===3)for(const side of [-1,1])queueCombatWarning(e,'impact',x,Math.max(-18,Math.min(18,z+side*6.7)),3,delay+.25,damage);
  }
  notify(p===3?'EXCEL: „#ARG!” / cały wiersz i sąsiednie komórki wybuchną — zmień wiersz, unikaj kręgów!':'EXCEL: „Scal komórki” / zaznaczony wiersz zaraz wybuchnie — ucieknij w górę lub w dół!');
 }else{
  const kind=index===2&&p>=2?'excelRing':'excelFan',before=combatWarnings.length;
  queueCombatWarning(e,kind,e.x,e.z,kind==='excelRing'?7.3:5.4,p===3?1.25:1.45,p===3?62:p===2?48:36);
  if(combatWarnings.length>before){const w=combatWarnings[combatWarnings.length-1];w.angle=Math.atan2(player.x-e.x,player.z-e.z);w.excelPhase=p;w.color=kind==='excelRing'?0xffcf68:0x68efa8}
  notify(kind==='excelRing'?'EXCEL: „TABELA PRZESTAWNA!” / nadchodzi pierścień — przejdź przez lukę.':'EXCEL: „Autouzupełnianie ołowiem!” / za chwilę wachlarz pocisków — zmień pozycję!');
 }
}
// Parent updateCombatTelegraphs calls this after a warning expires, before old warning branches.
function resolveExcelWarning(w){
 if(resolveExcelDuplicateWarning(w))return true;
 if(!['excelFan','excelRing'].includes(w.kind))return false;
 const e=w.owner;if(e.hp<=0)return true;
 const p=w.excelPhase||excelPhase(e),a=Number.isFinite(w.angle)?w.angle:Math.atan2(player.x-e.x,player.z-e.z);
 if(w.kind==='excelFan'){
  const count=p===3?9:p===2?7:5;
  for(let j=0;j<count;j++)addHostileShot(e,a+(j-(count-1)/2)*.18,8.3+p*.9,w.damage);
 }else{
  const count=p===3?26:22;
  for(let j=0;j<count;j++){if(j<2||j===count-1)continue;addHostileShot(e,a+j*Math.PI*2/count,7.7+p*.75,w.damage)}
 }
 sound(90,.18,'sawtooth',.025);return true;
}
function updateExcelEnemy(e,dt){
 if(e.type!=='excel')return false;
 e.castTime=Math.max(0,(e.castTime||0)-dt);e.shieldFlash=Math.max(0,(e.shieldFlash||0)-dt);
 const dx=player.x-e.x,dz=player.z-e.z,dist=Math.hypot(dx,dz);
 if(inv===0&&dist<TYPES.excel.r+.65)hurtPlayer(34);
 e.model.position.set(e.x,Math.sin(time*1.3)*.07,e.z);e.model.rotation.y=Math.atan2(dx,dz);
 const hp=e.model.userData.hpGroup,fill=e.model.userData.hpFill,pct=Math.max(0,e.hp/e.maxHp);
 if(hp)hp.quaternion.copy(_quat.copy(e.model.quaternion).invert().multiply(camera.quaternion));
 if(fill){fill.scale.x=1.7*pct;fill.position.x=(pct-1)*.85}
 e.flash=Math.max(0,(e.flash||0)-dt);return true;
}

function excelMaxHealth(stage=1){return stage===2?3200:2400}
function startExcelRage(e){
 const s=run.excel;if(!s||s.stage!==1)return false;
 s.stage=2;s.phase=1;s.rageHelpUsed=0;s.defeated=false;s.support='waiting';s.supportTimer=3;s.exposure=0;s.grace=3;s.attackTimer=3.4;s.attackIndex=0;s.blockedNotice=0;
 e.hp=e.maxHp=excelMaxHealth(2);e.dead=false;e.castTime=0;e.t=999;e.flash=0;e.shieldFlash=.35;
 for(let i=combatWarnings.length-1;i>=0;i--)if(combatWarnings[i].owner===e)combatWarnings.splice(i,1);
 for(const b of hostile)b.dead=true;
 player.hp=Math.min(maxHealth(),player.hp+40);player.shield=Math.min(maxShield(),(player.shield||0)+60);player.rechargeWait=0;inv=Math.max(inv,1.5);
 progress.excelFirstFormCleared=true;
 if(typeof refillZipsert==='function')refillZipsert();
 if(typeof showMarcSupport==='function')showMarcSupport(s);
 burst(e.x,e.z,0xff597f,38);sound(55,.65,'sawtooth',.045);
 notify('EXCEL WRACA WŚCIEKŁY: „TY USUWASZ DUPLIKATY? JA JE PRODUKUJĘ!” / Druga forma: 3200 HP. Marc: „Masz checkpoint. Teraz pokaż mu ZIPsert!”');
 combatToast('DRUGA FORMA / WŚCIEKŁY EXCEL · DUPLICATE_VALUE');hud();save();
 return true;
}
function queueExcelDuplicateWarning(e,kind,angle,p,delay,copyId){
 const count=combatWarnings.length;
 queueCombatWarning(e,kind,e.x,e.z,kind==='excelDuplicateRing'?7.5:5.7,delay,p===3?74:p===2?68:62);
 if(combatWarnings.length>count){const w=combatWarnings[combatWarnings.length-1];w.angle=angle;w.excelPhase=p;w.copyId=copyId;w.color=copyId===2?0xff64c5:0xffa060}
}
function queueExcelRageAttack(e){
 const s=run.excel,p=s.phase,index=s.attackIndex++%4,delay=p===3?1.15:1.3,a=Math.atan2(player.x-e.x,player.z-e.z),damage=p===3?74:p===2?68:62;
 if(index===0||index===2){
  const kind=index===0?'excelDuplicateFan':'excelDuplicateRing';
  queueExcelDuplicateWarning(e,kind,a,p,delay,1);queueExcelDuplicateWarning(e,kind,a,p,delay+.5,2);
  notify(index===0?'WŚCIEKŁY EXCEL: „CTRL+C, CTRL+V TWOJEGO KOŃCA!” / Dwie kopie salwy — zmień pozycję i przygotuj ZIPsert.':'WŚCIEKŁY EXCEL: „DUPLICATE_VALUE!” / Dwa pierścienie danych; szukaj wspólnej luki.');
 }else if(index===1){
  const z=player.z,x=player.x;
  for(let j=0;j<5;j++)queueCombatWarning(e,'impact',(j-2)*8.5,z,3.6,delay,damage);
  if(p>=2)for(const side of [-1,1])queueCombatWarning(e,'impact',x,Math.max(-17.5,Math.min(17.5,z+side*7.2)),2.8,delay+.35,damage);
  if(p===3)for(const side of [-1,1])queueCombatWarning(e,'impact',Math.max(-20,Math.min(20,x+side*7.2)),Math.max(-17.5,Math.min(17.5,z+7.2)),2.7,delay+.6,damage);
  notify('WŚCIEKŁY EXCEL: „SCAL WSZYSTKO!” / Zduplikowany wiersz wybuchnie — zmień wiersz, omijaj zaznaczone kopie.');
 }else{
  const x=player.x,z=player.z;
  queueCombatWarning(e,'impact',x,z,3.1,delay,damage);
  const spread=p===3?5.9:6.7;
  for(const side of [-1,1]){
   queueCombatWarning(e,'impact',Math.max(-20,Math.min(20,x+side*spread)),z,2.7,delay+.25,damage);
   queueCombatWarning(e,'impact',x,Math.max(-17.5,Math.min(17.5,z+side*spread)),2.7,delay+.5,damage);
  }
  if(p===3)queueExcelDuplicateWarning(e,'excelDuplicateFan',a,p,delay+.8,2);
  notify('WŚCIEKŁY EXCEL: „NIE MA DUPLIKATÓW. SĄ REKORDY PREMIUM!” / Uciekaj po przekątnej!');
 }
}
function addExcelDuplicateShot(e,angle,speed,damage,copyId){
 if(hostile.length>=240)return;
 const b={x:e.x+(copyId===2?.45:-.45),z:e.z,vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,damage,type:'excel',duplicate:true,copyId};
 b.model=projectile(b,true);hostile.push(b);
}
function resolveExcelDuplicateWarning(w){
 if(!['excelDuplicateFan','excelDuplicateRing'].includes(w.kind))return false;
 const e=w.owner;if(e.hp<=0)return true;
 const p=w.excelPhase||excelPhase(e),a=Number.isFinite(w.angle)?w.angle:Math.atan2(player.x-e.x,player.z-e.z),copy=w.copyId===2?2:1;
 if(w.kind==='excelDuplicateFan'){
  const count=p===3?11:p===2?9:7,shift=copy===2?.09:-.09;
  for(let j=0;j<count;j++)addExcelDuplicateShot(e,a+shift+(j-(count-1)/2)*.17,10.3+p*.7,w.damage,copy);
 }else{
  const count=p===3?32:28;
  for(let j=0;j<count;j++){if(j<3||j===count-1)continue;addExcelDuplicateShot(e,a+j*Math.PI*2/count,8.8+p*.65,w.damage,copy)}
 }
 sound(copy===2?135:85,.2,'sawtooth',.025);return true;
}

// ZIPsert: a two-charge escape job; all movement still respects arena collision.
let flowDashCharges=2,flowDashRecharge=0,dashSpeed=31;
function zipsertRecovery(){return Math.max(4,6.5-.5*upgradeLevel('mobility'))}
function validZipsertState(charges,recharge){return Number.isInteger(charges)&&charges>=0&&charges<=2&&Number.isFinite(recharge)&&recharge>=0&&recharge<=6.5&&(charges===2?recharge===0:recharge>0)}
function refillZipsert(){flowDashCharges=2;flowDashRecharge=0}
function updateZipsert(dt){
 if(mode!=='combat'||!Number.isFinite(dt)||dt<=0||flowDashCharges>=2)return;
 let remaining=dt;
 while(remaining>0&&flowDashCharges<2){
  if(flowDashRecharge<=0)flowDashRecharge=zipsertRecovery();
  const used=Math.min(remaining,flowDashRecharge);flowDashRecharge-=used;remaining-=used;
  if(flowDashRecharge<1e-8){flowDashCharges++;flowDashRecharge=flowDashCharges<2?zipsertRecovery():0}
 }
}
function zipsertDash(){
 if(mode!=='combat'||flowDashCharges<=0||dashTime>0||player.hp<=0)return false;
 let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),len=Math.hypot(x,z);
 if(len){dashX=(x*Math.cos(camYaw)+z*Math.sin(camYaw))/len;dashZ=(z*Math.cos(camYaw)-x*Math.sin(camYaw))/len}
 else{const dx=aim.x-player.x,dz=aim.z-player.z,l=Math.hypot(dx,dz);dashX=l>.1?dx/l:Math.sin(hero.root.rotation.y);dashZ=l>.1?dz/l:Math.cos(hero.root.rotation.y)}
 flowDashCharges--;if(flowDashRecharge<=0)flowDashRecharge=zipsertRecovery();
 dashSpeed=44;dashTime=.22;inv=Math.max(inv,.3);
 burst(player.x,player.z,0x87c9ff,12);sound(520,.13,'sine',.025);combatToast('ZIPsert! / REKORD ZMIENIŁ LOKALIZACJĘ');hud();save();return true;
}
function validExcelSnapshot(a,pending=0){
 if(!a)return true;
 const bosses=a.enemies.filter(e=>e.type==='excel');
 if(a.run.mission!==EXCEL_MISSION)return bosses.length===0&&a.run.excel===undefined;
 const s=a.run.excel;
 if(pending!==0||a.run.wave!==1||a.run.spawned!==0||!a.run.bossSpawned||!validExcelState(s)||a.enemies.some(e=>e.type!=='excel'))return false;
 if(s.defeated)return s.stage===2&&s.rageHelpUsed>0&&bosses.length===0;
 return bosses.length===1&&bosses[0].maxHp===excelMaxHealth(s.stage)&&s.phase===excelPhase(bosses[0]);
}
function validSaveSnapshot(d){
 if(!d||d.version!==10||!validProgress(d.progress)||!(d.active===null||validActive(d.active,d.progress.upgrades)))return false;
 if(!Number.isInteger(d.pendingWave)||d.pendingWave<0)return false;
 if(d.pendingWave&&(!d.active||d.pendingWave<2||d.pendingWave>MISSIONS[d.active.run.mission].waves||d.pendingWave!==d.active.run.wave+1))return false;
 if(d.active&&!validZipsertState(d.active.flowDashCharges,d.active.flowDashRecharge))return false;
 if(d.active?.run.excel?.stage===2&&!d.progress.excelFirstFormCleared)return false;
 return validBetrayalSnapshot(d.progress,d.active,d.pendingWave)&&validExcelSnapshot(d.active,d.pendingWave);
}
function validateOlderChapter(data,version){
 const p=data?.progress,max=version>=9?EXCEL_MISSION:FINAL_MISSION;
 if(!p||data.version!==version||p.version!==version||!Array.isArray(p.completed)||new Set(p.completed).size!==p.completed.length||p.completed.some(i=>!Number.isInteger(i)||i<0||i>max)||typeof p.won!=='boolean'||p.won&&!p.completed.includes(max)||data.active?.run?.mission>max)throw Error('Niepoprawny zapis poprzedniej kampanii');
}
function upgradeToV10(copy,firstFormCleared=false){
 copy.version=10;copy.progress.version=10;copy.progress.won=false;copy.progress.excelFirstFormCleared=firstFormCleared;
 if(copy.active){copy.active.flowDashCharges=2;copy.active.flowDashRecharge=0}
 return copy;
}
function migrationNotice(version){notify('Zapis v'+version+' przeniesiony. '+(progress.excelFirstFormCleared?'Pierwszy Excel jest już pokonany — pozostała tylko nowa, wściekła forma! Otwórz mapę (M).':progress.completed.includes(FINAL_MISSION)?'Zwiastun pokonany — finał z Excelem odblokowany. Otwórz mapę (M).':'Twoja kampania, sprzęt i relacje są zachowane. ZIPsert jest gotowy pod C.'))}
function migrateV9(data){
 validateOlderChapter(data,9);
 const copy=JSON.parse(JSON.stringify(data)),cleared=copy.progress.completed.includes(EXCEL_MISSION);
 copy.progress.completed=copy.progress.completed.filter(i=>i!==EXCEL_MISSION);
 upgradeToV10(copy,cleared);
 if(copy.active?.run.mission===EXCEL_MISSION){
  const a=copy.active,s=a.run.excel;
  if(!s||typeof s.defeated!=='boolean'||s.stage!==undefined||s.rageHelpUsed!==undefined)throw Error('Niepoprawny zapis Excela v9');
  const converted={...s,stage:1,rageHelpUsed:0};
  // A v9 kill saved just before its victory screen is a completed first form.
  if(s.defeated){
   if(s.helpUsed<=0||a.enemies.length)throw Error('Niepoprawne zwycięstwo v9');
   if(!validExcelState({...converted,defeated:false}))throw Error('Niepoprawny stan v9');
   copy.progress.excelFirstFormCleared=true;a.run.excel=createExcelState(2);a.run.bossSpawned=true;
   a.enemies=[{type:'excel',x:0,z:-8,hp:excelMaxHealth(2),maxHp:excelMaxHealth(2),t:999,phase:0,attackDamage:36,moveSpeed:1.45,specialTimer:0,bossPhase:1,summonedMask:0}];a.hostile=[];a.bullets=[];
  }else{a.run.excel=converted}
 }
 restore(copy);migrationNotice(9);
}
function migrateV8(data){validateOlderChapter(data,8);const copy=upgradeToV10(JSON.parse(JSON.stringify(data)));restore(copy);migrationNotice(8)}
function migrateV7(data){
 validateOlderChapter(data,7);
 if(!Array.isArray(data.progress.crew)||data.progress.crew.length!==2)throw Error('Niepoprawny zapis v7');
 const copy=upgradeToV10(addV8Fields(JSON.parse(JSON.stringify(data))));restore(copy);migrationNotice(7);
}
function migrateLegacy(data){
 const version=data?.progress?.version;
 if(![4,5,6].includes(version))throw Error('Niepoprawny zapis poprzedniej wersji');
 const copy=JSON.parse(JSON.stringify(data)),p=copy.progress;
 if(!Array.isArray(p.crew)||p.crew.length!==2||!p.crew.every((c,i)=>c&&c.name===['Vael','Syra'][i]&&Number.isInteger(c.bond)&&c.bond>=0&&c.bond<=3)||!Array.isArray(p.completed)||!p.completed.every(i=>Number.isInteger(i)&&i>=0&&i<4))throw Error('Niepoprawny zapis załogi/kampanii');
 p.legacyVictory=!!(p.won||p.campaignWon);p.won=false;p.crew=normalizeCrew(p.crew,p.partner);p.completed=[...new Set(p.completed)];
 if(version===4){copy.active=null;copy.pendingWave=0}
 upgradeToV10(addV8Fields(copy));restore(copy);migrationNotice(version);
}
function excelBriefing(){
 if(!safeLocation()&&!(mode==='panel'&&sceneKind==='hub'))return;
 const rage=progress.excelFirstFormCleared,back=()=>{closePanel(false);mode='hub';mapMenu()};
 openPanel(rage?'WŚCIEKŁY EXCEL / DUPLICATE_VALUE':'EXCEL / KONIEC ARKUSZA',rage?'DRUGA FORMA · PUNKT KONTROLNY':'FINAŁ · DWA OBLICZA ARKUSZA','<p>'+ (rage?'Pierwszy arkusz pokonany. Zapis pamięta ten sukces. Teraz pozostał <b>Wściekły Excel: 3200 HP</b>, kopiowane salwy i bardzo zły humor.':'Excel ma <b>2400 HP</b> i trzy dotychczasowe fazy. Po ich przejściu walka trwa dalej: <b>Wściekły Excel z 3200 HP</b> zasypie cię duplikatami danych.')+'</p><p><b>Marc Benioff (hologram):</b> „Pierwszy import to był test. Ktoś włączył opcję INSERT zamiast UPSERT!”</p><p>Gdy Excel jest nietykalny, otacza go wyraźna energetyczna tarcza z napisem <b>NIETYKALNY</b>. Podejdź do niebieskiego hologramu Marca i naciśnij <b>E</b>, żeby otworzyć okno obrażeń. W drugiej formie okna są krótsze. Pomoc powraca, jeśli ją przegapisz.</p><p><b>C · ZIPsert</b>: daleki dash z dwoma odnawiającymi się ładunkami. <b>R</b>: zwykły unik. <b>Q</b>: efekt masy. Duplikowane salwy są opóźnionymi kopiami — unikaj także drugiej paczki! Pełne wyposażenie i korzystanie z apteczek są mocno zalecane.</p><p>Pierwsza pokonana forma zostaje zapamiętana: po ewakuacji możesz ponowić samą wściekłą formę. Bez żniw ani powrotu na statek między obiema formami.</p><p class="caption">Fikcyjna scena satyryczna · Salesforce kontra arkusz, który nie umie odpuścić.</p>',back);
 button(rage?'▶ WŚCIEKŁY EXCEL / PODEJMIJ WYZWANIE':'▶ POKONAJ EXCELA',()=>beginMission(EXCEL_MISSION),'primary');button('Przygotuj wyposażenie',()=>{closePanel(false);mode='hub';shopMenu()});button('Wróć do mapy',back);
}
function updateExcelHUD(){
 const shown=isExcelMission()&&sceneKind==='combat'&&!!run.excel,encounter=shown?'excel':'campaign';
 if(document.body.dataset.encounter!==encounter)document.body.dataset.encounter=encounter;
 styleValue('marc-support','display',shown?'block':'none');if(!shown)return;
 const s=run.excel,near=Math.hypot(player.x-s.supportX,player.z-s.supportZ)<=3.8;
 $('marc-support').dataset.state=s.support;
 setText('marc-title',s.support==='available'?'MARC BENIOFF / RATUNKOWY DEPLOYMENT':s.support==='exposed'?'TARCZA WYŁĄCZONA / STRZELAJ!':'MARC ŁĄCZY SIĘ Z CHMURĄ…');
 setText('marc-line',s.support==='available'?(near?'E · WEZWIJ POMOC — TERAZ!':'Podejdź do niebieskiego hologramu i naciśnij E.')+' Sygnał: '+Math.ceil(s.supportTimer)+' s':s.support==='exposed'?'Okno importu: '+s.exposure.toFixed(1)+' s. '+(s.stage===2?'„Wyłączam Duplicate Rules. W sensie: jemu!”':'„Upsert zamiast kapitulacji!”'):'NIETYKALNY: tarcza blokuje obrażenia. Marc za '+Math.ceil(s.supportTimer)+' s.');
 styleValue('marc-timer','width',(s.support==='exposed'?s.exposure/(s.stage===2?6.5:9):s.support==='available'?s.supportTimer/12:Math.min(1,s.supportTimer/8))*100+'%');
}

installBetrayalTypes();

window.BulkCampaign=Object.freeze({
 suspend(){shellSuspended=true;keys={};mouse.down=mouse.right=false;save();},
 resume(){shellSuspended=false;last=performance.now();lastRendered=last;accumulator=0;},
 save,
 canPlayBird(){return active&&terminalPanelOpen&&mode==='panel'&&nearShipTerminal();},
 get mode(){return mode;},get active(){return active;}
});


applyQuality();buildEnvironment('hub');hero.root.position.set(player.x,0,player.z);cameraSnap();hud();welcome();requestAnimationFrame(frame);
