'use strict';
class BulkBirdRenderer {
 constructor(canvas){
  this.canvas=canvas;this.yaw=0;this.dead=false;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,stencil:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xb4d2c5);this.scene.fog=new THREE.Fog(0xb4d2c5,35,95);
  this.camera=new THREE.PerspectiveCamera(49,1,.1,150);this.camera.position.set(7,5.7,10);
  this.scene.add(new THREE.HemisphereLight(0xe5f7df,0x435044,2.3));const sun=new THREE.DirectionalLight(0xffefc3,2.6);sun.position.set(-12,25,10);this.scene.add(sun);
  this.geo={sphere:new THREE.SphereGeometry(1,12,8),cone:new THREE.ConeGeometry(1,1,9),cylinder:new THREE.CylinderGeometry(1,1,1,9),box:new THREE.BoxGeometry(1,1,1),rock:new THREE.DodecahedronGeometry(1,0),ring:new THREE.TorusGeometry(1,.1,5,24),plane:new THREE.PlaneGeometry(1,1)};
  this.materials=new Map();this.textures=new Set();this.tmp=new THREE.Object3D();this.target=new THREE.Vector3();this.look=new THREE.Vector3();
  this.makeForest();this.perch=new THREE.Group();this.scene.add(this.perch);this.mesh(this.perch,this.geo.cylinder,this.mat('perch',0x9f7548),0,.8,0,.42,1.6,.42);this.mesh(this.perch,this.geo.cylinder,this.mat('perchTop',0xd0a76a),0,1.62,0,.44,.12,.44);
  this.players={};for(const id of Object.keys(BULK_BIRDS)){this.players[id]=this.makeBird(id);this.scene.add(this.players[id].root);}
  this.enemies=['crow','owl','hummingbird'].map(id=>{const model=this.makeBird(id);this.scene.add(model.root);return model;});this.decoy=this.makeBird('pigeon');this.scene.add(this.decoy.root);
  this.pickups=new THREE.InstancedMesh(this.geo.plane,new THREE.MeshLambertMaterial({map:this.csvTexture(),transparent:true,alphaTest:.3,side:THREE.DoubleSide}),24);this.pickups.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(this.pickups);
  this.rings=Array.from({length:24},()=>{const m=new THREE.Mesh(this.geo.ring,new THREE.MeshBasicMaterial({color:0x9fffee,transparent:true,opacity:.7,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;this.scene.add(m);return m;});
  // A fixed sector shows the exact direction/range throughout the dodge window.
  const points=[];for(let i=0;i<24;i++){const a=-Math.PI/3+i*Math.PI*2/3/24,b=a+Math.PI*2/3/24;points.push(0,0,0,Math.sin(a),0,Math.cos(a),Math.sin(b),0,Math.cos(b));}
  this.geo.attack=new THREE.BufferGeometry();this.geo.attack.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  this.attackCones=this.enemies.map(()=>{const m=new THREE.Mesh(this.geo.attack,new THREE.MeshBasicMaterial({color:0xff302f,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));m.visible=false;this.scene.add(m);return m;});
  const frostPoints=[];for(let i=0;i<24;i++){const a=-Math.PI*2/9+i*Math.PI*4/9/24,b=a+Math.PI*4/9/24;frostPoints.push(0,0,0,Math.sin(a),0,Math.cos(a),Math.sin(b),0,Math.cos(b));}
  this.geo.frost=new THREE.BufferGeometry();this.geo.frost.setAttribute('position',new THREE.Float32BufferAttribute(frostPoints,3));
  this.frostBreath=new THREE.Mesh(this.geo.frost,new THREE.MeshBasicMaterial({color:0xb8edff,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));this.frostBreath.visible=false;this.scene.add(this.frostBreath);
  this.frostAura=new THREE.Mesh(new THREE.RingGeometry(5.25,5.5,48),new THREE.MeshBasicMaterial({color:0x9fe9ff,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));this.frostAura.rotation.x=-Math.PI/2;this.frostAura.visible=false;this.scene.add(this.frostAura);
  this.frostShards=new THREE.InstancedMesh(this.geo.cone,this.mat('frostShard',0xc9f3ff,0x4d9cc1),32);this.frostShards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.frostShards.count=0;this.scene.add(this.frostShards);
  this.decoy.root.visible=false;this.enemies.forEach(m=>m.root.visible=false);
  this.onResize=()=>this.resize();this.observer=new ResizeObserver(this.onResize);this.observer.observe(canvas);this.resize();
 }
 mat(key,color,emissive=0){if(!this.materials.has(key))this.materials.set(key,new THREE.MeshLambertMaterial({color,emissive,emissiveIntensity:.45}));return this.materials.get(key);}
 mesh(parent,g,m,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
 makeForest(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(170,170),this.mat('grass',0x678456));ground.rotation.x=-Math.PI/2;ground.position.y=-.04;this.scene.add(ground);
  let seed=77;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const trees=BIRD_OBSTACLES.filter(o=>o.h>3).map(o=>({x:o.x,z:o.z,h:8.5,r:1}));
  for(let i=0;i<130;i++){const a=rand()*Math.PI*2,r=29+rand()*28;trees.push({x:Math.sin(a)*r,z:Math.cos(a)*r,h:7+rand()*9,r:.65+rand()*.8});}
  const trunks=new THREE.InstancedMesh(this.geo.cylinder,this.mat('trunk',0x73573c),trees.length),crowns=new THREE.InstancedMesh(this.geo.cone,this.mat('leaves',0x345f3f),trees.length*3);let n=0;
  for(let i=0;i<trees.length;i++){const t=trees[i];this.tmp.position.set(t.x,t.h*.26,t.z);this.tmp.rotation.set(0,0,0);this.tmp.scale.set(.24*t.r,t.h*.55,.24*t.r);this.tmp.updateMatrix();trunks.setMatrixAt(i,this.tmp.matrix);for(let layer=0;layer<3;layer++){this.tmp.position.set(t.x,t.h*(.48+layer*.16),t.z);this.tmp.scale.set((2.9-layer*.65)*t.r,t.h*.48,(2.9-layer*.65)*t.r);this.tmp.updateMatrix();crowns.setMatrixAt(n++,this.tmp.matrix);}}
  this.scene.add(trunks,crowns);
  const shrubs=new THREE.InstancedMesh(this.geo.rock,this.mat('shrubs',0x4d7749),140);for(let i=0;i<140;i++){const x=(rand()-.5)*66,z=(rand()-.5)*66;this.tmp.position.set(x,.18,z);this.tmp.rotation.set(0,rand()*7,0);this.tmp.scale.set(.5+rand()*.8,.25+rand()*.45,.5+rand()*.8);this.tmp.updateMatrix();shrubs.setMatrixAt(i,this.tmp.matrix);}this.scene.add(shrubs);
  const stones=this.mat('stones',0x899087);for(const o of BIRD_OBSTACLES.filter(o=>o.h<3)){const rock=this.mesh(this.scene,this.geo.rock,stones,o.x,.65,o.z,o.r,1.15,o.r);rock.rotation.y=.4;}
  const pond=new THREE.Mesh(new THREE.CircleGeometry(6.5,40),this.mat('water',0x63b5b1,0x225759));pond.rotation.x=-Math.PI/2;pond.position.set(12,.025,9);pond.scale.y=.7;this.scene.add(pond);
  const rim=new THREE.Mesh(new THREE.RingGeometry(6.4,7,40),this.mat('shore',0x9fac7d));rim.rotation.copy(pond.rotation);rim.position.copy(pond.position);rim.position.y=.02;rim.scale.y=.7;this.scene.add(rim);
  for(let i=0;i<10;i++){const a=i*2.4;const leaf=new THREE.Mesh(new THREE.CircleGeometry(.45,7),this.mat('lily',0x4f8756));leaf.rotation.x=-Math.PI/2;leaf.position.set(12+Math.sin(a)*4,.05,9+Math.cos(a)*3);this.scene.add(leaf);}
  this.makeNest(BIRD_NEST,0x7aeee5,'TWOJE GNIAZDO / UPSERT');this.makeNest(BIRD_RIVAL_NEST,0xf5b17c,'CAMP CACHE / BOTY');
  const path=new THREE.Mesh(new THREE.PlaneGeometry(4.5,33),this.mat('path',0x9a946d));path.rotation.x=-Math.PI/2;path.rotation.z=-.7;path.position.set(-5,.008,3);this.scene.add(path);
  const flowers=new THREE.InstancedMesh(this.geo.sphere,this.mat('flower',0xe9dba7),130);for(let i=0;i<130;i++){this.tmp.position.set((rand()-.5)*45,.15,(rand()-.5)*45);this.tmp.rotation.set(0,0,0);this.tmp.scale.set(.07,.14,.07);this.tmp.updateMatrix();flowers.setMatrixAt(i,this.tmp.matrix);}this.scene.add(flowers);
 }
 label(text,color='#f6f8dc'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='#112e28c9';c.fillRect(0,0,512,64);c.font='bold 25px Arial';c.fillStyle=color;c.textAlign='center';c.fillText(text,256,42);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;this.textures.add(texture);return new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));
 }
 makeNest(where,color,title){
  const g=new THREE.Group();g.position.set(where.x,0,where.z);this.scene.add(g);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const twig=this.mesh(g,this.geo.cylinder,this.mat('nest',0x977b50),Math.sin(a)*1.7,.2,Math.cos(a)*1.7,.12,2,.12);twig.rotation.set(Math.PI/2,0,-a+.7);}
  const ring=this.mesh(g,this.geo.ring,this.mat('nestGlow'+title,color,color),0,.15,0,2.6,2.6,2.6);ring.rotation.x=-Math.PI/2;
  const label=this.label(title);label.position.set(0,5.7,0);label.scale.set(5.6,.7,1);g.add(label);
  for(let i=0;i<3;i++)this.mesh(g,this.geo.sphere,this.mat('egg',0xe8dfb1),i*.5-.5,.4,.1,.24,.33,.24);
 }
 csvTexture(){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#ffda80';c.fillRect(21,7,86,111);c.fillStyle='#fff0b2';c.beginPath();c.moveTo(87,7);c.lineTo(107,28);c.lineTo(87,28);c.fill();c.fillStyle='#6c623e';c.font='bold 26px monospace';c.textAlign='center';c.fillText('CSV',64,66);for(let i=0;i<3;i++)c.fillRect(36,80+i*8,55,3);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;this.textures.add(t);return t;}
 makeOpiumBody(body){
  const snow=this.mat('opiumSnow',0xf4f8ff),shade=this.mat('opiumShade',0xc5d9e6),mask=this.mat('opiumMask',0x233a53),ice=this.mat('opiumEye',0x9deaff,0x60bde9);
  this.geo.feather=new THREE.BufferGeometry();
  this.geo.feather.setAttribute('position',new THREE.Float32BufferAttribute([-1,.5,0,0,.55,.28,1,.5,0,0,-.6,.1,0,0,.32],3));
  this.geo.feather.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);this.geo.feather.computeVertexNormals();
  const featherMat=this.mat('opiumFeather',0xecf5ff);featherMat.side=THREE.DoubleSide;
  this.mesh(body,this.geo.sphere,snow,0,.05,-.05,.59,.85,.52);
  this.mesh(body,this.geo.sphere,snow,0,.65,.03,.47,.64,.43);
  this.mesh(body,this.geo.sphere,snow,0,1.1,.3,.32,.37,.35);
  // Two tapered segments form a long, downward-curving plague-mask beak.
  const bill=this.mesh(body,this.geo.cone,mask,0,1.03,.82,.18,.9,.17);bill.rotation.x=Math.PI/2+.22;
  const tip=this.mesh(body,this.geo.cone,mask,0,.79,1.26,.11,.4,.1);tip.rotation.x=2.55;
  for(const side of [-1,1]){
   this.mesh(body,this.geo.sphere,mask,side*.24,1.19,.51,.095,.105,.055);
   this.mesh(body,this.geo.sphere,ice,side*.245,1.20,.56,.036,.035,.018);
   this.mesh(body,this.geo.cylinder,shade,side*.24,-.72,.05,.075,.5,.075);
   this.mesh(body,this.geo.box,mask,side*.24,-.97,.22,.19,.09,.46);
  }
  // Layered, drooping feathers use one instanced mesh instead of dozens of draw calls.
  const fur=new THREE.InstancedMesh(this.geo.feather,featherMat,56);
  for(let i=0;i<56;i++){
   const layer=Math.floor(i/14),angle=i%14/14*Math.PI*2,r=.39+layer*.06;
   this.tmp.position.set(Math.sin(angle)*r,.92-layer*.4,Math.cos(angle)*r-.07);
   this.tmp.rotation.set(Math.sin(angle)*.12,angle,0);this.tmp.scale.set(.14,.72+(i%3)*.12,.2);this.tmp.updateMatrix();fur.setMatrixAt(i,this.tmp.matrix);
  }
  body.add(fur);
  const wings=[];for(const side of [-1,1]){
   const wing=new THREE.Group();wing.position.set(side*.45,.55,-.06);body.add(wing);
   this.mesh(wing,this.geo.sphere,shade,side*.06,-.3,-.06,.19,.58,.26);
   for(let i=0;i<5;i++){const f=this.mesh(wing,this.geo.feather,featherMat,side*(.07+i*.045),-.4-i*.075,-.05-i*.065,.12,.8-i*.03,.2);f.rotation.z=-side*.13;}
   wings.push(wing);
  }
  return wings;
 }
 makeBird(type){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);const cfg=BULK_BIRDS[type];const base=this.mat(type+'body',cfg.color),dark=this.mat(type+'dark',type==='crow'?0x171e2c:0x526d72),pale=this.mat('featherPale',0xeee6c8),beak=this.mat(type+'beak',type==='crow'?0x383b36:0xf0bd52);
  let wings=[];if(type==='opium')wings=this.makeOpiumBody(body);else{
  this.mesh(body,this.geo.sphere,base,0,.18,0,.55,.54,.75);const head=this.mesh(body,this.geo.sphere,base,0,.76,.48,type==='owl'?.56:.35,type==='owl'?.52:.35,.35);
  if(type==='duck')head.material=this.mat('duckHead',0x2e876b);
  const bill=this.mesh(body,type==='duck'?this.geo.box:this.geo.cone,beak,0,.68,type==='hummingbird'?1.16:1,type==='duck'?.25:.13,type==='hummingbird'?.8:.4,type==='duck'?.5:.14);if(type!=='duck')bill.rotation.x=Math.PI/2;
  for(const side of [-1,1]){
   const wing=new THREE.Group();wing.position.set(side*.37,.36,0);body.add(wing);for(let i=0;i<5;i++){const feather=this.mesh(wing,this.geo.sphere,(type==='owl'&&i%2===0)?pale:(i%3===0?dark:base),side*(.22+i*.17),-.05,-i*.1,.21,.075,.5-i*.025);feather.rotation.y=side*(.1+i*.07);}wings.push(wing);
   if(type==='owl'){this.mesh(body,this.geo.sphere,pale,side*.22,.84,.76,.22,.26,.06);const tuft=this.mesh(body,this.geo.cone,dark,side*.4,1.3,.4,.14,.35,.1);tuft.rotation.z=-side*.35;}
   this.mesh(body,this.geo.sphere,this.mat('eye',0x141e19),side*.22,.85,.76,.07,.085,.05);this.mesh(body,this.geo.sphere,pale,side*.23,.88,.8,.018,.022,.016);
   const foot=this.mesh(body,this.geo.box,this.mat('feet',0xc38b49),side*.22,-.37,.22,.14,.08,type==='duck'?.38:.25);foot.rotation.y=side*.2;
  }
  const tail=this.mesh(body,this.geo.sphere,dark,0,.12,-.75,.35,.08,.53);tail.rotation.x=-.2;
  if(type==='pigeon'){const neck=this.mesh(body,this.geo.sphere,this.mat('pigeonNeck',0x3c8e83),0,.58,.35,.36,.23,.4);neck.rotation.x=-.15;}
  const scale=type==='hummingbird'?.66:type==='owl'?1.17:type==='duck'?1.06:1;body.scale.setScalar(scale);
  }
  const hp=new THREE.Group();hp.position.set(0,1.9,0);const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x152b28,depthWrite:false})),fill=new THREE.Sprite(new THREE.SpriteMaterial({color:0x8de8c3,depthWrite:false}));bg.scale.set(1.5,.11,1);fill.scale.set(1.45,.065,1);fill.position.z=.01;hp.add(bg,fill);root.add(hp);
  const cargo=[];for(let i=0;i<3;i++){const item=this.mesh(root,this.geo.box,this.mat('cargo',0xffd475),i*.25-.25,.38,-.66,.17,.28,.035);item.visible=false;cargo.push(item);}
  const frozen=new THREE.Mesh(this.geo.rock,new THREE.MeshBasicMaterial({color:0x94ddff,transparent:true,opacity:.32,wireframe:true,depthWrite:false}));frozen.position.set(0,.3,.1);frozen.scale.set(.95,1.2,1);frozen.visible=false;root.add(frozen);
  return {root,body,wings,fill,hp,cargo,frozen,type};
 }
 resize(){if(this.dead)return;const w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight);this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 moveVector(x,z){return {x:x*Math.cos(this.yaw)+z*Math.sin(this.yaw),z:z*Math.cos(this.yaw)-x*Math.sin(this.yaw)};}
 syncBird(model,b,time,preview=false){model.root.visible=preview||b.alive;if(!model.root.visible)return;model.root.scale.setScalar(preview?1.8:1);model.root.position.set(preview?0:b.x,preview?2.4+Math.sin(time*2)*.035:b.y,preview?0:b.z);model.root.rotation.y=preview?Math.sin(time*.5)*.22+.7:b.heading;
  model.body.rotation.x=b.peck>0?.3:0;model.hp.visible=!preview;model.fill.scale.x=1.45*Math.max(0,b.hp/b.maxHp);model.fill.position.x=-.725*(1-b.hp/b.maxHp);
  model.frozen.visible=!preview&&b.frozen>0;
  const flap=b.frozen>0?0:model.type==='opium'?Math.sin(time*2)*.06:preview?.36+Math.sin(time*2)*.12:Math.sin(b.flap)*(b.y>1.3?.7:.16);model.wings[0].rotation.z=flap;model.wings[1].rotation.z=-flap;model.cargo.forEach((m,i)=>m.visible=!preview&&i<b.cargo);
 }
 renderFrost(game,time,preview){
  const p=game.player,active=!preview&&p.alive&&p.type==='opium';
  this.frostAura.visible=active&&p.frostAura>0;
  if(this.frostAura.visible){this.frostAura.position.set(p.x,Math.max(.14,p.y-.8),p.z);this.frostAura.material.opacity=.35+Math.sin(time*8)*.12;}
  const casting=active&&(p.breathWindup>0||p.breathVisual>0);this.frostBreath.visible=casting;this.frostShards.count=casting?32:0;
  if(!casting)return;
  this.frostBreath.position.set(p.x,Math.max(.16,p.breathY-.7),p.z);this.frostBreath.rotation.y=p.breathAngle;this.frostBreath.scale.setScalar(10);this.frostBreath.material.opacity=p.breathWindup>0?.15:.32*p.breathVisual/.65;
  for(let i=0;i<32;i++){
   const travel=(time*1.7+i*.137)%1,distance=1+travel*9,angle=p.breathAngle+(i%9-4)*.14;
   this.tmp.position.set(p.x+Math.sin(angle)*distance,p.breathY+.55+Math.sin(i*2.3)*.55,p.z+Math.cos(angle)*distance);
   this.tmp.rotation.set(Math.PI/2,0,-angle);this.tmp.scale.set(.035,.15+travel*.15,.035);this.tmp.updateMatrix();this.frostShards.setMatrixAt(i,this.tmp.matrix);
  }
  this.frostShards.instanceMatrix.needsUpdate=true;
 }
 render(game,dt,time){
  const preview=game.mode==='ready';this.perch.visible=preview;for(const [id,model]of Object.entries(this.players)){model.root.visible=id===game.selected;if(id===game.selected)this.syncBird(model,game.player,time,preview);}
  this.enemies.forEach((model,i)=>{const e=game.enemies[i];model.root.visible=!preview&&!!e;if(!preview&&e)this.syncBird(model,e,time);const cone=this.attackCones[i];cone.visible=!preview&&!!e?.alive&&e.attackWindup>0;if(cone.visible){cone.position.set(e.x,Math.max(.15,e.attackY-.7),e.z);cone.rotation.y=e.attackAngle;cone.scale.setScalar(e.attackRange);cone.material.opacity=.28+(1-e.attackWindup/e.attackTotal)*.4;}});
  this.decoy.root.visible=!preview&&!!game.decoy;if(this.decoy.root.visible){this.syncBird(this.decoy,{...game.player,...game.decoy,alive:true,cargo:0},time);this.decoy.root.visible=Math.sin(time*15)>.0;}
  let n=0;if(!preview)for(const item of game.pickups){if(item.wait>0||n>=24)continue;this.tmp.position.set(item.x,item.y+Math.sin(time*2+item.id)*.16,item.z);this.tmp.rotation.set(-.65,this.yaw+Math.sin(time*.6+item.id)*.1,0);this.tmp.scale.set(1.1,1.3,1.1);this.tmp.updateMatrix();this.pickups.setMatrixAt(n++,this.tmp.matrix);}this.pickups.count=n;this.pickups.instanceMatrix.needsUpdate=true;
  this.rings.forEach((ring,i)=>{const f=!preview&&game.fx[i];ring.visible=!!f;if(f){ring.position.set(f.x,.2,f.z);const size=(1-f.life/f.total)*3+.3;ring.scale.setScalar(size);ring.material.color.setHex(f.color);ring.material.opacity=f.life/f.total*.7;}});
  this.renderFrost(game,time,preview);
  if(preview){this.target.set(-6,4.8,8);this.look.set(1.6,2.2,0);}else{const p=game.player;this.target.set(p.x+Math.sin(this.yaw)*14,p.y+8.5,p.z+Math.cos(this.yaw)*14);this.look.set(p.x-Math.sin(this.yaw)*2,p.y+.5,p.z-Math.cos(this.yaw)*2);}
  this.camera.position.lerp(this.target,1-Math.exp(-Math.max(.016,dt)*7));this.camera.lookAt(this.look);this.renderer.render(this.scene,this.camera);
 }
 dispose(){if(this.dead)return;this.dead=true;this.observer.disconnect();const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const g of Object.values(this.geo))geometries.add(g);for(const g of geometries)g.dispose();for(const m of materials){if(m.map)this.textures.add(m.map);m.dispose();}for(const t of this.textures)t.dispose();this.renderer.dispose();this.renderer.forceContextLoss();}
}
