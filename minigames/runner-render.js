'use strict';
class BulkRunnerRenderer{
 constructor(canvas){
  this.T=THREE;this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x9299bd);this.scene.fog=new THREE.Fog(0x9299bd,65,200);this.camera=new THREE.PerspectiveCamera(58,1,.1,260);this.camera.position.set(1.1,5.5,13);this.camera.lookAt(0,1.3,-16);
  this.scene.add(new THREE.HemisphereLight(0xb7ddff,0x60483c,2.6));const sun=new THREE.DirectionalLight(0xffd9aa,3);sun.position.set(-20,35,12);this.scene.add(sun);
  this.geometries=new Set();this.materials=new Set();this.textures=new Set();this.g={box:this.geo(new THREE.BoxGeometry(1,1,1)),sphere:this.geo(new THREE.SphereGeometry(1,10,8)),cylinder:this.geo(new THREE.CylinderGeometry(1,1,1,10)),plane:this.geo(new THREE.PlaneGeometry(1,1))};
  const skyCanvas=document.createElement('canvas');skyCanvas.width=2;skyCanvas.height=512;const sky=skyCanvas.getContext('2d'),gradient=sky.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#20294f');gradient.addColorStop(.5,'#9da8cc');gradient.addColorStop(1,'#ffd1ac');sky.fillStyle=gradient;sky.fillRect(0,0,2,512);const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;this.textures.add(skyTexture);this.scene.background=skyTexture;
  this.m={road:this.mat(0x273142),steel:this.mat(0x6c8c94),sleeper:this.mat(0x544c5d),cyan:this.mat(0x4ee5e8,.45),gold:this.mat(0xffbe4f,.25),crate:this.mat(0xf59650),train:this.mat(0x338968),roof:this.mat(0x193b48),glass:this.mat(0xa4edff,.5),skin:this.mat(0xd5a17d),hair:this.mat(0x1c2739),hoodie:this.mat(0x17a8b4),pants:this.mat(0x273556),white:this.mat(0xf5ead5),shoe:this.mat(0xf9934f)};
  this.transform=new THREE.Object3D();this.color=new THREE.Color();this.buildWorld();this.buildHero();this.resize();
 }
 geo(g){this.geometries.add(g);return g;}
 mat(color,emission=0){const m=new THREE.MeshLambertMaterial({color,emissive:color,emissiveIntensity:emission});this.materials.add(m);return m;}
 box(parent,material,x,y,z,w,h,d,geometry=this.g.box){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;}
 instances(material,count,geometry=this.g.box){const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;this.scene.add(mesh);return mesh;}
 set(mesh,n,x,y,z,w,h,d,rotation=0){this.transform.position.set(x,y,z);this.transform.rotation.set(0,rotation,0);this.transform.scale.set(w,h,d);this.transform.updateMatrix();mesh.setMatrixAt(n,this.transform.matrix);}
 finish(mesh,count){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 label(text,color){const c=document.createElement('canvas');c.width=512;c.height=96;const p=c.getContext('2d');p.fillStyle='#152a39';p.fillRect(0,0,512,96);p.strokeStyle=color;p.lineWidth=7;p.strokeRect(4,4,504,88);p.fillStyle=color;p.textAlign='center';p.textBaseline='middle';p.font='bold 39px Arial';p.fillText(text,256,50);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;this.textures.add(t);const m=new THREE.MeshBasicMaterial({map:t});this.materials.add(m);return m;}
 buildWorld(){
  this.box(this.scene,this.m.road,0,-.22,-90,30,.4,250);for(const x of [-5.2,5.2])this.box(this.scene,this.m.gold,x,.1,-90,.17,.15,250);
  for(const lane of [-3,0,3])for(const side of [-1,1])this.box(this.scene,this.m.steel,lane+side*.95,.1,-90,.1,.15,250);
  this.sleepers=this.instances(this.m.sleeper,210);this.city=this.instances(this.mat(0xc9d1df),64);this.windows=this.instances(this.m.glass,256);this.poles=this.instances(this.m.cyan,40);
  this.csv=this.instances(this.m.gold,110);this.crates=this.instances(this.m.crate,30);this.crateMarks=this.instances(this.m.white,30);this.trains=this.instances(this.m.train,24);this.trainRoofs=this.instances(this.m.roof,24);this.trainGlass=this.instances(this.m.glass,24);this.trainLights=this.instances(this.m.gold,48);
  this.sideGlass=this.instances(this.m.glass,192);this.trainStripes=this.instances(this.m.gold,48);this.wheels=this.instances(this.m.roof,96,this.geo(new THREE.CylinderGeometry(.34,.34,.18,8).rotateZ(Math.PI/2)));
  this.gates=this.instances(this.m.shoe,30);this.gatePosts=this.instances(this.m.white,60);this.powerups=this.instances(this.mat(0xffffff,.3),12);
  this.trainLabels=this.instances(this.label('EXCEL EXPRESS','#adf8cf'),24);this.gateLabels=this.instances(this.label('LIMIT API','#ffe1ab'),30);
  this.finishArch=new THREE.Group();this.scene.add(this.finishArch);for(const x of [-5.5,5.5])this.box(this.finishArch,this.m.gold,x,3,0,.6,6,.6);this.box(this.finishArch,this.label('META / 30 000 M','#c5ffdf'),0,6,0,11.4,2,.25);
  const sign=this.box(this.scene,this.label('CSV CENTRAL / 01','#87ffef'),-9,6,-35,9,1.7,.2);sign.rotation.y=.15;
  this.box(this.scene,this.m.roof,-9,3,-35,.3,6,.3);this.box(this.scene,this.m.roof,9,3,-65,.3,6,.3);this.box(this.scene,this.label('BULK TRANSIT','#ffe2a0'),9,6,-65,8,1.5,.2);
 }
 buildHero(){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);this.scene.add(root);root.position.z=3;this.hero={root,body,arms:[],legs:[]};const m=this.m;
  this.box(body,m.hoodie,0,1.5,0,.72,.9,.5);this.box(body,m.white,0,1.54,-.27,.1,.62,.04);this.box(body,m.pants,0,1.04,0,.66,.3,.45);
  this.box(body,m.skin,0,2.26,-.025,.29,.36,.29,this.g.sphere);this.box(body,m.hair,0,2.45,.035,.31,.22,.31,this.g.sphere);this.box(body,m.hoodie,0,2.01,.13,.39,.19,.3,this.g.sphere);
  for(const side of [-1,1]){this.box(body,m.white,side*.1,2.31,-.29,.07,.055,.03);this.box(body,m.hair,side*.1,2.31,-.313,.025,.04,.012);const arm=new THREE.Group();arm.position.set(side*.47,1.8,0);body.add(arm);this.box(arm,m.hoodie,0,-.3,0,.25,.62,.28);this.box(arm,m.skin,0,-.65,-.02,.14,.18,.14,this.g.sphere);this.hero.arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.22,1.05,0);body.add(leg);this.box(leg,m.pants,0,-.4,0,.27,.78,.3);this.box(leg,m.shoe,0,-.87,-.09,.33,.2,.54);this.hero.legs.push(leg);}
  this.box(body,m.roof,0,1.5,.37,.55,.67,.25);this.box(body,this.label('CSV','#8effe5'),0,1.5,.51,.4,.13,.015);
  this.shield=new THREE.Mesh(this.geo(new THREE.SphereGeometry(1,14,10)),new THREE.MeshBasicMaterial({color:0x8fefff,wireframe:true,transparent:true,opacity:.25}));this.materials.add(this.shield.material);this.shield.position.y=1.1;this.shield.scale.set(1,1.6,1);root.add(this.shield);this.shield.visible=false;
 }
 resize(){const c=this.renderer.domElement,w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight);const ratio=Math.min(devicePixelRatio||1,1,Math.sqrt(1000000/(w*h)));this.renderer.setPixelRatio(ratio);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 render(game,time){
  const d=game.distance;this.finishArch.visible=BulkRunner.GOAL-d<200;this.finishArch.position.z=3-(BulkRunner.GOAL-d);let n=0;for(let i=0;i<70;i++)for(const lane of [-3,0,3])this.set(this.sleepers,n++,lane,.015,12-((i*3.2-d)%224+224)%224,2.45,.12,.3);this.finish(this.sleepers,n);
  let win=0;for(let i=0;i<64;i++){const side=i%2?-1:1,row=Math.floor(i/2),z=10-((row*8-d*.7)%256+256)%256,h=5+(Math.sin(i*19.1)+1)*8;this.set(this.city,i,side*(9+(i%3)*2),h/2,z,4.3,h,6);this.color.setHex([0xa3c5d1,0xae9ebf,0xd9aa9c,0x83b0c1][i%4]);this.city.setColorAt(i,this.color);for(let k=0;k<4;k++)this.set(this.windows,win++,side*(9+(i%3)*2-2.16),2+k*(h-2)/4,z,.05,.7,3.5);}
  this.finish(this.city,64);this.finish(this.windows,win);for(let i=0;i<40;i++)this.set(this.poles,i,i%2?-5.8:5.8,2.4,9-((Math.floor(i/2)*12-d)%240+240)%240,.1,4.8,.1);this.finish(this.poles,40);
  const counts={csv:0,crates:0,trains:0,gates:0,powerups:0};
  for(const item of game.items){if(item.taken)continue;const x=BulkRunner.LANES[item.lane],z=3-(item.d-d);if(z>16||z< -200)continue;
   if(item.type==='csv'){const i=counts.csv++;this.set(this.csv,i,x,item.y+Math.sin(time*3+item.id)*.09,z,.38,.46,.12,time*2);}
   else if(item.type==='crate'){const i=counts.crates++;this.set(this.crates,i,x,.65,z,2,1.3,1.4);this.set(this.crateMarks,i,x,.67,z+.711,.35,.9,.02);}
   else if(item.type==='train'){const i=counts.trains++;this.set(this.trains,i,x,1.8,z,2.4,3.4,10);this.set(this.trainRoofs,i,x,3.58,z,2.2,.24,9.6);this.set(this.trainGlass,i,x,2.8,z+5.02,1.9,.6,.04);this.set(this.trainLabels,i,x,1.9,z+5.03,1.9,.35,.02);for(let j=0;j<2;j++)this.set(this.trainLights,i*2+j,x+(j?-.8:.8),.65,z+5.04,.3,.18,.03);for(let j=0;j<2;j++){const side=j?-1:1;this.set(this.trainStripes,i*2+j,x+side*1.21,1.45,z,.025,.12,9.4);for(let k=0;k<4;k++)this.set(this.sideGlass,i*8+j*4+k,x+side*1.212,2.65,z-3+k*2,.025,.67,1.35);for(let k=0;k<2;k++)this.set(this.wheels,i*4+j*2+k,x+side*1.23,.34,z+(k?-3.5:3.5),1,1,1);}}
   else if(item.type==='gate'){const i=counts.gates++;this.set(this.gates,i,x,1.9,z,2.7,.8,.6);this.set(this.gateLabels,i,x,1.9,z+.31,2.3,.43,.025);for(let j=0;j<2;j++)this.set(this.gatePosts,i*2+j,x+(j?-1.25:1.25),1.35,z,.18,2.7,.28);}
   else{const i=counts.powerups++;this.set(this.powerups,i,x,1+Math.sin(time*3)*.14,z,.75,.75,.75,time);this.color.setHex(item.type==='shield'?0x63e8ff:item.type==='magnet'?0xff83bf:item.type==='medkit'?0xff8b8b:0xb5fc69);this.powerups.setColorAt(i,this.color);}
  }
  this.finish(this.csv,counts.csv);this.finish(this.crates,counts.crates);this.finish(this.crateMarks,counts.crates);for(const mesh of [this.trains,this.trainRoofs,this.trainGlass,this.trainLabels])this.finish(mesh,counts.trains);this.finish(this.trainLights,counts.trains*2);this.finish(this.sideGlass,counts.trains*8);this.finish(this.trainStripes,counts.trains*2);this.finish(this.wheels,counts.trains*4);for(const mesh of [this.gates,this.gateLabels])this.finish(mesh,counts.gates);this.finish(this.gatePosts,counts.gates*2);this.finish(this.powerups,counts.powerups);
  const hero=this.hero,run=game.state==='playing',slide=game.slide>0&&game.y<.25;hero.root.position.set(game.x,game.y,3);hero.root.rotation.y=game.state==='ready'?Math.PI-.25:0;hero.body.scale.y=slide?.42:1;hero.body.rotation.z=(BulkRunner.LANES[game.lane]-game.x)*-.13;
  for(let i=0;i<2;i++){hero.legs[i].rotation.x=game.y>.1?(i?-.7:.7):run?Math.sin(d*1.3+i*Math.PI)*.8:0;hero.arms[i].rotation.x=game.y>.1?-.8:run?-Math.sin(d*1.3+i*Math.PI)*.65:0;}
  hero.body.position.y=run&&!slide&&game.y===0?Math.abs(Math.sin(d*1.3))*.06:0;hero.body.visible=game.inv<=0||Math.sin(time*30)>-.2;this.shield.visible=game.shields>0||game.boost>0;this.shield.rotation.y=time;this.renderer.render(this.scene,this.camera);
 }
 destroy(){for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();for(const t of this.textures)t.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.scene.clear();}
}
if(typeof window!=='undefined')window.BulkRunnerRenderer=BulkRunnerRenderer;
