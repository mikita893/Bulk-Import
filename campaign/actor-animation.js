'use strict';
// Runtime-only poses live on models, so campaign saves keep their existing schema.
function enemyJoint(body,x,y,z){const joint=new THREE.Group();joint.position.set(x,y,z);body.add(joint);return joint;}
function jointPart(joint,part){joint.attach(part);return part;}
function finishEnemyAnimation(root,body,e,options={}){
 const rig={body,legs:options.legs||[],arms:options.arms||[],wings:options.wings||[],gun:options.gun||null,muzzle:options.muzzle||null,
  kind:options.kind||e.type,phase:0,moving:0,shot:0,melee:0,lastX:e.x,lastZ:e.z,idle:e.phase||0};
 const parts=[...new Set([...rig.legs,...rig.arms,...rig.wings,...(rig.gun?[rig.gun]:[])])];
 rig.rest=parts.map(joint=>({joint,x:joint.rotation.x,z:joint.rotation.z}));
 rig.gunRestZ=rig.gun?.position.z||0;
 for(const joint of parts)batchStaticMeshes(joint,parts.filter(other=>other!==joint));
 batchStaticMeshes(body,parts);
 root.userData.animation=rig;resetEnemyAnimation(root,e);return root;
}
function resetEnemyAnimation(root,e){
 const r=root.userData.animation;if(!r)return;
 r.phase=0;r.moving=0;r.shot=0;r.melee=0;r.lastX=e.x;r.lastZ=e.z;r.idle=e.phase||0;
 r.body.position.y=0;r.body.rotation.set(0,0,0);
 for(const rest of r.rest){rest.joint.rotation.x=rest.x;rest.joint.rotation.z=rest.z;}
 if(r.gun)r.gun.position.z=r.gunRestZ;
 if(r.muzzle){r.muzzle.visible=false;r.muzzle.material.opacity=0;}
}
function triggerEnemyShot(e){const r=e.model?.userData.animation;if(r){if(r.shot<.18)soundEffects.play('enemyShot');r.shot=.2;}}
function triggerEnemyMelee(e){const r=e.model?.userData.animation;if(r)r.melee=.3;}
function animateEnemy(e,dt){
 const r=e.model?.userData.animation;if(!r)return;
 const distance=Math.hypot(e.x-r.lastX,e.z-r.lastZ);r.lastX=e.x;r.lastZ=e.z;
 const walking=distance>.0001&&distance<1.5;
 if(walking)r.phase+=distance*(r.kind==='husk'?4.2:r.kind==='collector'?3.8:3);
 r.moving+=(Number(walking)-r.moving)*(1-Math.exp(-dt*15));
 const step=Math.sin(r.phase),shot=Math.max(0,r.shot/.2),attack=Math.sin(Math.PI*Math.min(1,r.melee/.3));
 const hover=r.kind==='banshee',large=r.kind==='excel'||r.kind==='boss';
 r.body.position.y=hover?.2+Math.sin(time*2+r.idle)*.13:Math.abs(step)*r.moving*(large?.035:.065)+Math.sin(time*2+r.idle)*.012;
 r.body.rotation.x=(hover?Math.sin(time*1.7+r.idle)*.025:-r.moving*.035)-shot*.045;
 r.body.rotation.z=hover?Math.sin(time*1.5+r.idle)*.045:step*r.moving*.018;
 const stride=r.kind==='geth'?.48:r.kind==='husk'?.65:r.kind==='collector'?.32:large?.17:.27;
 for(let i=0;i<r.legs.length;i++)r.legs[i].rotation.x=Math.sin(r.phase+(i%2?Math.PI:0)+(i>1?Math.PI:0))*stride*r.moving;
 for(let i=0;i<r.arms.length;i++){
  const rest=r.rest.find(p=>p.joint===r.arms[i]);
  r.arms[i].rotation.x=rest.x-step*r.moving*(i%2?1:-1)*.16-shot*.2-attack*.65-(hover&&e.castTime>0?.45:0);
  r.arms[i].rotation.z=rest.z+(hover?Math.sin(time*2.8+i)*.1:0);
 }
 for(let i=0;i<r.wings.length;i++){
  const rest=r.rest.find(p=>p.joint===r.wings[i]);
  r.wings[i].rotation.z=rest.z+(i%2?-1:1)*Math.sin(time*7+r.idle)*(.05+r.moving*.12);
 }
 if(r.gun)r.gun.position.z=r.gunRestZ-shot*(large?.2:.16);
 if(r.muzzle){r.muzzle.visible=shot>0;r.muzzle.material.opacity=Math.min(.95,shot);}
 r.shot=Math.max(0,r.shot-dt);r.melee=Math.max(0,r.melee-dt);
}

// A fixed twelve-slot ribbon reuses one draw call, including on low quality.
const dodgeTrail=Array.from({length:12},()=>({x:0,z:0,angle:0,life:0}));
const dodgeTrailMaterial=new THREE.MeshBasicMaterial({map:glowTex,color:0xffffff,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
const dodgeTrailMesh=new THREE.InstancedMesh(G.plane,dodgeTrailMaterial,12);
dodgeTrailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);dodgeTrailMesh.frustumCulled=false;dodgeTrailMesh.count=0;effects.add(dodgeTrailMesh);
const heroPose=new THREE.Group();heroPose.position.y=1.35;hero.root.add(heroPose);heroPose.add(hero.body);hero.body.position.y=-1.35;
const dodgeAxis=new THREE.Vector3();
const dodgeVisual={life:0,total:.32,x:0,z:1,cursor:0,sample:0,lastX:0,lastZ:8};
function beginDodgeVisual(){dodgeVisual.life=dodgeVisual.total;dodgeVisual.x=dashX;dodgeVisual.z=dashZ;dodgeVisual.sample=.025;}
function resetCombatAnimation(){
 dodgeVisual.life=0;dodgeVisual.sample=0;dodgeVisual.lastX=player.x;dodgeVisual.lastZ=player.z;
 heroPose.quaternion.identity();heroPose.position.y=1.35;hero.body.position.y=-1.35;
 for(const mark of dodgeTrail)mark.life=0;dodgeTrailMesh.count=0;
}
function syncHeroAnimation(dt,live){
 if(live){
  const distance=Math.hypot(player.x-dodgeVisual.lastX,player.z-dodgeVisual.lastZ),moving=distance>.001&&distance<3;
  hero.root.rotation.y=Math.atan2(aim.x-player.x,aim.z-player.z);
  for(let i=0;i<2;i++)hero.legs[i].rotation.x=moving?Math.sin(walk)*(i===0?1:-1)*.65:0;
  hero.body.position.y=-1.35+(moving?Math.abs(Math.sin(walk))*.07:0);
  const kick=Math.max(0,muzzle/.07);hero.gun.position.z=.6-kick*.12;
  hero.arms[0].rotation.x=moving?-Math.sin(walk)*.12:0;hero.arms[1].rotation.x=-kick*.14;
  for(const mark of dodgeTrail)mark.life=Math.max(0,mark.life-dt);
  if(dodgeVisual.life>0){
   const progress=1-dodgeVisual.life/dodgeVisual.total,angle=Math.atan2(dodgeVisual.x,dodgeVisual.z)-hero.root.rotation.y;
   dodgeAxis.set(Math.cos(angle),0,-Math.sin(angle));heroPose.quaternion.setFromAxisAngle(dodgeAxis,-Math.PI*2*progress);
   heroPose.position.y=1.35+Math.sin(progress*Math.PI)*.32;
   dodgeVisual.sample+=dt;
   if(dashTime>0&&dodgeVisual.sample>=.025){
    dodgeVisual.sample=0;const mark=dodgeTrail[dodgeVisual.cursor++%(settings.quality==='fast'?6:12)];
    mark.x=player.x-dodgeVisual.x*.35;mark.z=player.z-dodgeVisual.z*.35;mark.angle=Math.atan2(dodgeVisual.x,dodgeVisual.z);mark.life=.36;
   }
   dodgeVisual.life=Math.max(0,dodgeVisual.life-dt);
  }else{heroPose.quaternion.identity();heroPose.position.y=1.35;}
  dodgeVisual.lastX=player.x;dodgeVisual.lastZ=player.z;
 }
 let n=0;for(const mark of dodgeTrail){if(mark.life<=0)continue;
  _instance.position.set(mark.x,.07,mark.z);_instance.rotation.set(-Math.PI/2,0,-mark.angle);_instance.scale.set(1.25,2.7,1);_instance.updateMatrix();dodgeTrailMesh.setMatrixAt(n,_instance.matrix);
  _color.setHex(0x86edff).multiplyScalar(mark.life/.36);dodgeTrailMesh.setColorAt(n++,_color);
 }
 dodgeTrailMesh.count=n;dodgeTrailMesh.instanceMatrix.needsUpdate=true;if(dodgeTrailMesh.instanceColor)dodgeTrailMesh.instanceColor.needsUpdate=true;
}
