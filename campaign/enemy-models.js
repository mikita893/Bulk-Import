'use strict';
function enemyVitals(g,e,height,shadowScale=1.1){
 const t=TYPES[e.type],hp=new THREE.Group();hp.position.set(0,height,0);g.add(hp);
 box(hp,mat(0x111827,0,.8),0,0,0,1.8,.11,.02,false);
 // Existing updater uses width 1.7; use that width for consistent depletion.
 g.userData.hpGroup=hp;g.userData.hpFill=box(hp,mat(t.color,0,.6,t.color,.7),0,0,.02,1.7,.07,.02,false);
 const shadow=mesh(g,new THREE.CircleGeometry(t.r*shadowScale,16),new THREE.MeshBasicMaterial({color:0x020710,transparent:true,opacity:.32,depthWrite:false}),0,.015,0);shadow.rotation.x=-Math.PI/2;
}
function enemyWeapon(body,color,x,y,z,size=.9){
 const gun=enemyJoint(body,x,y,z),muzzle=glow(gun,color,0,0,.4,size,0);
 muzzle.visible=false;return {gun,muzzle};
}
function makeEnemy(e){
 const reused=enemyPools[e.type]?.pop();
 if(reused){actors.add(reused);reused.userData.retired=false;reused.position.set(e.x,0,e.z);reused.visible=true;resetEnemyAnimation(reused,e);return reused;}
 if(e.type==='excel'){const model=makeExcelModel(e);actors.add(model);return model;}
 const traitor=makeBetrayerModel(e);if(traitor){actors.add(traitor);return traitor;}
 const special=makeNewEnemy(e);if(special){actors.add(special);return special;}
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const t=TYPES[e.type],m=mat(e.type==='collector'?0x97813e:e.type==='elite'?0x64283f:0x4d4148,.7,.35),em=mat(t.color,.45,.3,t.color,1.5);
 const legs=[],wings=[];
 if(e.type==='collector'){
  mesh(body,G.sphere,m,0,1.5,0,.55,.9,.42);sphere(body,mat(0xa89049,.5,.35),0,2.55,.15,.4);
  for(const side of [-1,1]){
   const wing=enemyJoint(body,side*.45,2,-.18);
   const blade=jointPart(wing,mesh(body,G.sphere,mat(0xd8bd66,.65,.4),side*.65,1.65,-.18,.45,.95,.13));blade.rotation.z=-side*.4;wings.push(wing);
   for(const z of [-.2,.3]){
    const leg=enemyJoint(body,side*.3,1.1,z);
    jointPart(leg,tube(body,[side*.3,1.1,z],[side*1.05,.6,z+.35],.1,m));
    jointPart(leg,tube(body,[side*1.05,.6,z+.35],[side*1.2,.1,z+.75],.07,m));legs.push(leg);
   }
   tube(body,[side*.4,2.2,0],[side*.95,1.6,.6],.12,m);sphere(body,em,side*.16,2.6,.47,.1);
  }
 }else{
  mesh(body,G.sphere,m,0,1.8,0,.7,1.2,.5);mesh(body,G.cone,m,0,2.9,0,.53,.65,.5);
  for(const side of [-1,1]){
   const leg=enemyJoint(body,side*.45,2.5,0);
   jointPart(leg,tube(body,[side*.45,2.5,0],[side*1.3,1.4,.3],.16,m));
   jointPart(leg,tube(body,[side*1.3,1.4,.3],[side*1.6,.18,.9],.12,m));
   jointPart(leg,tube(body,[side*1.6,.18,.9],[side*.8,.4,1.15],.08,m));legs.push(leg);
   box(body,em,side*.53,1.6,.46,.13,.7,.12);
   if(e.type==='elite')box(body,m,side*.85,2.4,0,.7,.6,.65);
  }
  box(body,em,0,1.9,.5,.23,1,.12);sphere(body,em,0,2.8,.38,.17);
  if(e.type==='boss'){
   const crown=mesh(g,new THREE.TorusGeometry(1.3,.055,8,48),em,0,2.3,0);g.userData.crown=crown;
   for(const side of [-1,1])tube(body,[side*.6,2.6,0],[side*1.4,3.8,-.1],.12,m);
  }
 }
 const weapon=enemyWeapon(body,t.color,e.type==='collector'?.8:0,e.type==='collector'?1.5:1.9,e.type==='collector'?.85:.6);
 if(e.type==='collector')jointPart(weapon.gun,box(body,M.dark,.8,1.5,.85,.2,.23,.75));
 glow(body,t.color,0,2,.5,2.2,.3);enemyVitals(g,e,3.75);
 finishEnemyAnimation(g,body,e,{legs,wings,...weapon});
 g.scale.setScalar(e.type==='boss'?2.55:e.type==='elite'?1.25:1);actors.add(g);return g;
}

function makeNewEnemy(e){
 if(!['husk','geth','banshee'].includes(e.type))return null;
 const g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const t=TYPES[e.type],em=mat(t.color,.4,.4,t.color,1.15),metal=mat(e.type==='husk'?0x3b6658:e.type==='geth'?0x526d7b:0x665176,.5,.5),legs=[],arms=[];
 let weapon=null;
 if(e.type==='husk'){
  box(body,metal,0,1.25,0,.55,.85,.4);box(body,em,0,1.3,.24,.12,.65,.08);
  const skull=sphere(body,mat(0x859a83,.2,.8),0,2.1,.14,.27);skull.scale.y*=1.15;
  for(const side of [-1,1]){
   const arm=enemyJoint(body,side*.24,1.6,0),leg=enemyJoint(body,side*.17,1,0);
   jointPart(arm,tube(body,[side*.24,1.6,0],[side*.65,.9,.6],.12,metal));
   jointPart(arm,tube(body,[side*.65,.9,.6],[side*.7,.6,.95],.07,metal));
   jointPart(leg,tube(body,[side*.17,1,0],[side*.3,.08,.2],.13,M.dark));
   arms.push(arm);legs.push(leg);sphere(body,em,side*.1,2.14,.38,.06);
  }
  for(let i=0;i<3;i++)box(body,em,0,1.1+i*.18,-.25,.2,.07,.12);
 }else if(e.type==='geth'){
  box(body,metal,0,1.65,0,1.1,1.2,.58);box(body,M.dark,0,2.6,.06,.5,.52,.48);sphere(body,em,0,2.66,.35,.17);
  for(const side of [-1,1]){
   const arm=enemyJoint(body,side*.6,2.1,0),leg=enemyJoint(body,side*.28,1.2,0);
   jointPart(arm,box(body,metal,side*.74,1.9,0,.36,.7,.55));
   jointPart(leg,tube(body,[side*.28,1.2,0],[side*.35,.12,.2],.18,M.dark));arms.push(arm);legs.push(leg);
  }
  weapon=enemyWeapon(body,t.color,.75,1.4,.62);
  jointPart(weapon.gun,box(body,M.dark,.75,1.4,.62,.28,.35,1.3));
  jointPart(weapon.gun,box(body,em,.75,1.4,1.3,.16,.15,.12));arms[1].attach(weapon.gun);
  box(body,metal,-.85,1.5,.4,.15,1.1,.8);
 }else{
  const robe=mesh(body,G.cone,metal,0,1.1,0,.75,2.2,.65);robe.rotation.z=.03;
  box(body,metal,0,2.45,0,.55,.85,.35);sphere(body,mat(0xa69bb7,.2,.7),0,3.2,.1,.25);
  for(const side of [-1,1]){
   const arm=enemyJoint(body,side*.3,2.7,0);
   jointPart(arm,tube(body,[side*.3,2.7,0],[side*1,2.3,.15],.09,metal));
   jointPart(arm,tube(body,[side*1,2.3,.15],[side*1.45,1.5,.35],.055,metal));arms.push(arm);
   tube(body,[side*.15,3.3,0],[side*.45,3.8,-.2],.035,em);sphere(body,em,side*.1,3.2,.32,.06);
  }
  const halo=mesh(g,new THREE.TorusGeometry(.75,.035,6,24),em,0,2.5,-.05);g.userData.crown=halo;
  weapon=enemyWeapon(body,t.color,0,2.6,.45,1.3);
 }
 enemyVitals(g,e,e.type==='banshee'?4.1:e.type==='geth'?3.4:2.8,1);
 return finishEnemyAnimation(g,body,e,{legs,arms,...weapon});
}
