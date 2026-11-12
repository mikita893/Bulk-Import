'use strict';
class BulkSoulsRenderer {
  constructor(canvas) {
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x111b28);this.scene.fog=new THREE.FogExp2(0x111b28,.021);
    this.camera=new THREE.PerspectiveCamera(55,1,.1,100);this.camera.position.set(0,7.8,19);this.camera.lookAt(0,1,8);
    this.scene.add(new THREE.HemisphereLight(0x9cb7d7,0x433024,2));const moon=new THREE.DirectionalLight(0xa3cfff,2.2);moon.position.set(-12,20,-10);this.scene.add(moon);
    const fire=new THREE.PointLight(0xff9b4d,35,16,2);fire.position.set(0,2.6,8);this.scene.add(fire);
    this.geometries=new Set();this.materials=new Set();this.textures=new Set();this.models=new Map();this.transform=new THREE.Object3D();this.color=new THREE.Color();this.inverseQuat=new THREE.Quaternion();this.area=-1;this.lastEvent=0;
    this.g={box:this.geo(new THREE.BoxGeometry(1,1,1)),sphere:this.geo(new THREE.SphereGeometry(1,10,8)),cone:this.geo(new THREE.ConeGeometry(1,1,10)),cylinder:this.geo(new THREE.CylinderGeometry(1,1,1,12)),circle:this.geo(new THREE.CircleGeometry(1,32)),plane:this.geo(new THREE.PlaneGeometry(1,1)),arch:this.geo(new THREE.TorusGeometry(1.6,.21,7,20,Math.PI)),ring:this.geo(new THREE.TorusGeometry(1,.05,6,40)),slash:this.geo(new THREE.CircleGeometry(1,32,-Math.PI/2-1.3,2.6)),bossSlash:this.geo(new THREE.CircleGeometry(1,32,-Math.PI/2-1.5,3))};
    this.m={stone:this.mat(0x7f8996),trim:this.mat(0x5c6576),dark:this.mat(0x202630),gold:this.mat(0x9c8052),ember:this.mat(0xffb059,1.2),rune:this.mat(0x8debd4,1),white:this.mat(0xb7c6d3)};
    this.glow=this.glowTexture();this.static=this.instances(this.g.box,this.m.stone,1100);this.columns=this.instances(this.g.cylinder,this.m.trim,16);
    this.bolts=this.instances(this.g.sphere,this.mat(0xd9a6ff,1.3),12);this.sparkMesh=this.instances(this.g.sphere,this.mat(0xffffff,1),40);this.sparks=Array.from({length:40},()=>({life:0,x:0,y:0,z:0,vx:0,vz:0,color:0xffa677}));this.sparkCursor=0;
    this.buildDetails();this.hero=this.actor('hero');this.scene.add(this.hero.root);this.resize();
  }
  geo(g){this.geometries.add(g);return g;}
  mat(color,glow=0){const m=new THREE.MeshLambertMaterial({color,emissive:color,emissiveIntensity:glow});this.materials.add(m);return m;}
  basic(color,opacity=1){const m=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,side:THREE.DoubleSide});this.materials.add(m);return m;}
  mesh(parent,g,m,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o;}
  box(parent,m,x,y,z,w,h,d){return this.mesh(parent,this.g.box,m,x,y,z,w,h,d);}
  instances(g,m,capacity){const o=new THREE.InstancedMesh(g,m,capacity);o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);o.frustumCulled=false;o.count=0;this.scene.add(o);return o;}
  set(o,i,x,y,z,sx,sy,sz,ry=0){this.transform.position.set(x,y,z);this.transform.rotation.set(0,ry,0);this.transform.scale.set(sx,sy,sz);this.transform.updateMatrix();o.setMatrixAt(i,this.transform.matrix);}
  finish(o,n){o.count=n;o.instanceMatrix.needsUpdate=true;if(o.instanceColor)o.instanceColor.needsUpdate=true;}
  glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const p=c.getContext('2d'),g=p.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.2,'#ffffffba');g.addColorStop(1,'#ffffff00');p.fillStyle=g;p.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);this.textures.add(t);return t;}
  sprite(parent,color,x,y,z,size){const m=new THREE.SpriteMaterial({map:this.glow,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});this.materials.add(m);const o=new THREE.Sprite(m);o.position.set(x,y,z);o.scale.set(size,size,size);parent.add(o);return o;}
  // Static body pieces share material/geometry batches, while joints remain articulated.
  batchBody(body){const groups=new Map();for(const o of [...body.children])if(o.isMesh&&!o.userData.dynamic){o.updateMatrix();const key=o.geometry.uuid+o.material.uuid;const list=groups.get(key)||[];list.push(o);groups.set(key,list);}for(const list of groups.values()){if(list.length<2)continue;const batch=new THREE.InstancedMesh(list[0].geometry,list[0].material,list.length);list.forEach((o,i)=>{batch.setMatrixAt(i,o.matrix);body.remove(o);});body.add(batch);}}
  actor(type){
    const root=new THREE.Group(),pivot=new THREE.Group(),body=new THREE.Group();root.add(pivot);pivot.add(body);pivot.position.y=1.3;body.position.y=-1.3;
    const boss=type==='boss',scribe=type==='scribe',hero=type==='hero',metal=this.mat(hero?0x668b91:boss?0x4a424b:type==='warden'?0x81715e:0x58616f),cloth=this.mat(hero?0x245568:scribe?0x634e7e:0x382c3c),glow=this.mat(hero?0x91efde:boss?0xffbd73:0xf17b76,1.25);
    this.mesh(body,this.g.sphere,metal,0,1.65,0,.62,.72,.38);this.box(body,this.m.dark,0,1.35,.32,.66,.43,.12);this.box(body,this.m.gold,0,1.85,.39,.13,.63,.04);
    this.mesh(body,this.g.sphere,metal,0,2.65,0,.33,.4,.32);this.box(body,glow,0,2.65,.3,.44,.07,.06);this.box(body,this.m.gold,0,2.9,0,.08,.37,.46);
    for(const side of [-1,1]){this.mesh(body,this.g.sphere,metal,side*.62,2.05,0,.4,.27,.42);if(boss||type==='warden'){const horn=this.mesh(body,this.g.cone,this.m.gold,side*.55,2.47,0,.14,.8,.14);horn.rotation.z=-side*.55;}this.box(body,cloth,side*.3,1.1,-.31,.37,1.3,.08);}
    const cape=this.box(body,cloth,0,1.55,-.4,1.02,1.5,.1);cape.rotation.x=.1;cape.userData.dynamic=true;
    const legs=[],arms=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.26,1.15,0);body.add(leg);this.box(leg,metal,0,-.44,0,.32,.86,.38);this.box(leg,this.m.dark,0,-.98,.1,.4,.25,.63);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.7,2.08,0);body.add(arm);this.box(arm,metal,0,-.35,0,.27,.7,.33);arms.push(arm);}
    const sword=new THREE.Group();sword.position.set(0,-.7,.15);arms[1].add(sword);this.box(sword,this.m.gold,0,0,.1,.6,.09,.12);this.box(sword,this.m.dark,0,-.2,.1,.12,.35,.12);
    this.box(sword,scribe?glow:this.m.white,0,.8,.1,scribe?.11:boss?.25:.13,scribe?2:boss?2.2:1.6,.09);if(scribe)this.mesh(sword,this.g.sphere,glow,0,1.9,.1,.24,.24,.24);
    const shield=this.mesh(arms[0],this.g.sphere,metal,0,-.65,.22,.48,.63,.13);this.box(arms[0],glow,0,-.65,.36,.08,.7,.025);if(scribe)shield.visible=false;
    this.batchBody(body);
    const hp=new THREE.Group();hp.position.y=3.35;root.add(hp);this.mesh(hp,this.g.plane,this.basic(0x071117),0,0,0,1.65,.12,1);const fill=this.mesh(hp,this.g.plane,this.basic(hero?0x91e5bd:0xde7d76),0,0,.01,1.55,.07,1);
    const shadow=this.mesh(root,this.g.circle,this.basic(0x020408,.5),0,.04,0,.8,.8,1);shadow.rotation.x=-Math.PI/2;
    const marker=new THREE.Group();this.scene.add(marker);const markerMat=this.basic(0xff835f,.32),wedge=this.mesh(marker,boss?this.g.bossSlash:this.g.slash,markerMat,0,.07,0);wedge.rotation.x=-Math.PI/2;const circle=this.mesh(marker,this.g.circle,markerMat,0,.07,0);circle.rotation.x=-Math.PI/2;const line=this.box(marker,markerMat,0,.08,4,.7,.02,8);
    root.scale.setScalar(boss?1.65:type==='warden'?1.18:scribe?.95:1);return {root,pivot,body,legs,arms,cape,hp,fill,marker,wedge,circle,line,markerMat,glow,type};
  }
  buildDetails(){
    this.details=new THREE.Group();this.scene.add(this.details);this.flames=[];for(const side of [-1,1])for(const z of [-11,-3,6]){this.box(this.details,this.m.gold,side*12,2,z,.18,1,.18);const flame=this.sprite(this.details,0xffa758,side*12,2.8,z,1.5);this.flames.push(flame);}
    for(const x of [-3,3]){this.box(this.details,this.m.trim,x,2,-12,1,4,1);this.box(this.details,this.m.gold,x,4.1,-12,1.3,.2,1.3);}this.mesh(this.details,this.g.arch,this.m.trim,0,4,-12,1.9,1.9,1);
    this.gateGlow=this.mesh(this.details,this.g.plane,this.basic(0xb48de8,.4),0,2,-12,4.8,4,1);
    const bonfire=new THREE.Group();bonfire.position.set(0,0,8);this.details.add(bonfire);this.mesh(bonfire,this.g.cylinder,this.m.dark,0,.14,0,1,.28,1);for(let i=0;i<4;i++){const log=this.box(bonfire,this.m.gold,0,.3,0,.15,.15,1.4);log.rotation.y=i*Math.PI/4;}this.fire=this.sprite(bonfire,0xff9a42,0,.85,0,2.6);this.flames.push(this.fire);
    this.mesh(bonfire,this.g.cone,this.m.ember,0,.63,0,.22,.9,.22);
    this.lost=this.sprite(this.scene,0x9df6d3,0,.8,0,1.8);this.targetRing=this.mesh(this.scene,this.g.ring,this.basic(0xffe2a3,.9),0,.1,0);this.targetRing.rotation.x=-Math.PI/2;
    this.criticalRing=this.mesh(this.scene,this.g.ring,this.basic(0x8fffe0,.9),0,.12,0);this.criticalRing.rotation.x=-Math.PI/2;this.parryGlow=this.sprite(this.scene,0x8beaff,0,1.8,0,2.5);
  }
  environment(area){
    this.area=area;let n=0;const palettes=[[0x4d5b69,0x6c767c],[0x62594e,0x827060],[0x504c62,0x71637d]],palette=palettes[area];
    for(let x=-13;x<14;x+=1.5)for(let z=-13;z<14;z+=1.5){this.set(this.static,n,x,-.08,z,1.45,.16,1.45,Math.sin(x*17+z)*.012);this.color.setHex(palette[(n+Math.floor(x))%2?0:1]).multiplyScalar(.78+Math.sin(n*9.13)*.1);this.static.setColorAt(n++,this.color);}
    for(let layer=0;layer<2;layer++)for(let i=-13;i<=13;i+=2){for(const side of [-1,1]){this.set(this.static,n,side*13.7,.4+layer*.7,i,.7,.65,1.9);this.static.setColorAt(n++,this.color.setHex(0x586272));this.set(this.static,n,i,.4+layer*.7,side*13.7,1.9,.65,.7);this.static.setColorAt(n++,this.color.setHex(0x586272));}}
    for(const p of BulkSouls.PILLARS){this.set(this.static,n,p.x,.2,p.z,2.2,.4,2.2);this.static.setColorAt(n++,this.color.setHex(0x697380));this.set(this.static,n,p.x,4.5,p.z,2.1,.35,2.1);this.static.setColorAt(n++,this.color.setHex(0x697380));}
    this.finish(this.static,n);BulkSouls.PILLARS.forEach((p,i)=>this.set(this.columns,i,p.x,2.3,p.z,.8,4.3,.8));this.finish(this.columns,4);
  }
  resize(){const c=this.renderer.domElement,w=Math.max(1,c.clientWidth),h=Math.max(1,c.clientHeight);this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1,Math.sqrt(900000/(w*h))));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  actorPose(model,actor,time,dt,hero=false){
    const p=actor,rolling=hero&&p.roll>0,angle=rolling?Math.atan2(p.rollX,p.rollZ):p.angle;model.root.position.set(p.x,0,p.z);model.root.rotation.y=angle;
    model.body.visible=!hero||p.inv<=0||rolling||p.action?.kind==='riposte'||p.action?.kind==='backstab'||Math.sin(time*25)>-.2;model.pivot.rotation.x=rolling?-(1-p.roll/.48)*Math.PI*2:0;model.pivot.position.y=1.3+(rolling?Math.sin((1-p.roll/.48)*Math.PI)*.35:0);
    const moved=Math.hypot(p.x-(model.lastX??p.x),p.z-(model.lastZ??p.z));model.lastX=p.x;model.lastZ=p.z;model.walk=(model.walk||0)+Math.min(.5,moved)*3;
    const walking=moved>.001;for(let i=0;i<2;i++)model.legs[i].rotation.x=walking?Math.sin(model.walk+i*Math.PI)*.5:0;
    let swing=0;if(hero&&p.action){const a=p.action;swing=a.time<a.hitAt?-a.time/a.hitAt*.9:1.25*(1-(a.time-a.hitAt)/(a.total-a.hitAt));}else if(!hero&&p.state==='windup')swing=-.8;else if(!hero&&p.state==='strike')swing=1.3;
    const parrying=hero&&p.action?.kind==='parry',critical=hero&&(p.action?.kind==='riposte'||p.action?.kind==='backstab'),stunned=!hero&&(p.state==='stunned'||p.state==='critical');
    model.body.rotation.x=stunned?.28:critical?Math.sin(Math.min(1,p.action.time/p.action.total)*Math.PI)*.28:0;
    model.arms[1].rotation.x=critical?-1.5+Math.sin(Math.min(1,p.action.time/p.action.hitAt)*Math.PI/2)*1.2:swing;
    model.arms[0].rotation.x=parrying?-1.35:hero&&p.blocking?-1.05:walking?Math.sin(model.walk)*.15:0;
    model.arms[0].rotation.z=parrying?Math.sin(p.action.time/.65*Math.PI)*-.9:0;model.cape.rotation.x=.1+Math.sin(time*3+model.walk)*.04;model.hp.quaternion.copy(this.camera.quaternion).premultiply(this.inverseQuat.copy(model.root.quaternion).invert());
    const pct=hero?p.hp/this.currentGame.maxHp:p.hp/p.maxHp;model.fill.scale.x=1.55*Math.max(0,pct);model.fill.position.x=(pct-1)*.775;
    model.marker.visible=!hero&&p.hp>0&&p.state==='windup';if(model.marker.visible){const radius=p.attackRange+.35;model.marker.position.set(p.x,0,p.z);model.marker.rotation.y=p.attackAngle;model.wedge.visible=p.attackKind==='slash';model.circle.visible=p.attackKind==='nova';model.line.visible=p.attackKind==='bolt';model.wedge.scale.set(radius,radius,1);model.circle.scale.set(radius,radius,1);model.markerMat.color.setHex(BulkSouls.parryable(p)&&p.timer<=.3?0x88e5ff:0xff835f);model.markerMat.opacity=.2+(1-p.timer/p.windup)*.3;}
    if(model.type==='boss'){model.glow.color.setHex(p.phase===3?0xff826b:0xffbd73);model.glow.emissive.copy(model.glow.color);}
  }
  render(game,dt,view){
    this.currentGame=game;if(this.area!==game.area)this.environment(game.area);
    const p=game.player,target=game.enemies.find(e=>e.hp>0&&e.id===game.target);
    if(target){const goal=Math.atan2(p.x-target.x,p.z-target.z);view.yaw+=BulkSouls.angleDiff(goal,view.yaw)*(1-Math.exp(-dt*4));}
    const targetCamera=this.transform.position.set(p.x+Math.sin(view.yaw)*10.5,7.8,p.z+Math.cos(view.yaw)*10.5);this.camera.position.lerp(targetCamera,1-Math.exp(-dt*9));this.camera.lookAt(p.x,1.2,p.z);
    for(const model of this.models.values()){model.root.visible=false;model.marker.visible=false;}
    for(const e of game.enemies){if(e.hp<=0)continue;let model=this.models.get(e.id);if(!model){model=this.actor(e.type);this.models.set(e.id,model);this.scene.add(model.root);}model.root.visible=true;this.actorPose(model,e,game.time,dt);}
    this.actorPose(this.hero,p,game.time,dt,true);this.hero.marker.visible=false;
    const critical=game.criticalTarget();this.criticalRing.visible=!!critical;
    if(critical){this.criticalRing.position.set(critical.enemy.x,.12,critical.enemy.z);this.criticalRing.scale.setScalar(critical.enemy.type==='boss'?1.65:1.1);this.criticalRing.material.opacity=.65+Math.sin(game.time*8)*.2;}
    this.parryGlow.visible=p.action?.kind==='parry'&&p.action.time>=.08&&p.action.time<=.30;
    if(this.parryGlow.visible)this.parryGlow.position.set(p.x+Math.sin(p.angle)*.7,1.8,p.z+Math.cos(p.angle)*.7);
    this.gateGlow.visible=game.area<2;this.gateGlow.material.color.setHex(game.enemies.some(e=>e.hp>0)?0xaa5b65:0x99efd1);
    const lost=game.progress.lost;this.lost.visible=!!lost&&lost.room===game.area;if(this.lost.visible)this.lost.position.set(lost.x,.65+Math.sin(game.time*3)*.1,lost.z);
    this.targetRing.visible=!!target;if(target){this.targetRing.position.set(target.x,.09,target.z);this.targetRing.scale.setScalar(target.type==='boss'?1.5:.9);}
    this.flames.forEach((flame,i)=>{flame.material.opacity=.65+Math.sin(game.time*5+i)*.12;});
    game.bolts.forEach((b,i)=>this.set(this.bolts,i,b.x,1.1,b.z,.18,.18,.18));this.finish(this.bolts,game.bolts.length);
    for(const e of game.events){if(e.id<=this.lastEvent)continue;this.lastEvent=e.id;if(['enemyHit','hurt','victory','phase','enemyDead','healed','parried','riposte','backstab'].includes(e.type))for(let i=0;i<8;i++){const s=this.sparks[this.sparkCursor++%40],a=i*Math.PI/4;s.life=.5;s.x=e.x;s.z=e.z;s.y=1.3;s.vx=Math.sin(a)*2;s.vz=Math.cos(a)*2;s.color=e.type==='parried'?0x8beaff:e.type==='riposte'||e.type==='backstab'?0x8fffe0:e.type==='healed'?0x97ffcf:e.type==='hurt'?0xe98379:0xffbd71;}}
    let n=0;for(const s of this.sparks){if(s.life<=0)continue;if(game.state==='playing'){s.life=Math.max(0,s.life-dt);s.x+=s.vx*dt;s.z+=s.vz*dt;s.y+=dt*.6;}if(s.life>0){this.set(this.sparkMesh,n,s.x,s.y,s.z,.08,.08,.08);this.sparkMesh.setColorAt(n++,this.color.setHex(s.color).multiplyScalar(s.life*2));}}this.finish(this.sparkMesh,n);
    this.renderer.render(this.scene,this.camera);
  }
  destroy(){for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();for(const t of this.textures)t.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.scene.clear();this.models.clear();}
}
if(typeof window!=='undefined')window.BulkSoulsRenderer=BulkSoulsRenderer;
