'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BulkSouls = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const AREAS = ['Przedsionek Null', 'Dziedziniec Rollbacku', 'Katedra Legacy'];
  const PILLARS = [{x:-7,z:-5},{x:7,z:-5},{x:-7,z:5},{x:7,z:5}];
  const ENEMIES = {
    knight: {name:'Strażnik Nullable', hp:78, speed:2.5, damage:20, range:2.35, windup:.8, recovery:1.1, reward:35},
    warden: {name:'Rycerz Bez Backupu', hp:148, speed:1.9, damage:32, range:3, windup:1.1, recovery:1.4, reward:65},
    scribe: {name:'Skryba Błędnej Formuły', hp:64, speed:2.1, damage:18, range:9, windup:1, recovery:1.5, reward:45},
    boss: {name:'Lord Legacy · Pierwszy Administrator', hp:900, speed:2.1, damage:34, range:3.5, windup:1.1, recovery:1.3, reward:1000}
  };
  function defaultProgress() {return {version:1,level:0,runes:0,room:0,deaths:0,wins:0,won:false,lost:null};}
  function validProgress(p) {
    return !!p && p.version===1 && Number.isInteger(p.level) && p.level>=0 && p.level<=8 &&
      Number.isSafeInteger(p.runes) && p.runes>=0 && p.runes<1e7 && Number.isInteger(p.room) && p.room>=0 && p.room<3 &&
      ['deaths','wins'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0&&p[k]<1e7) && typeof p.won==='boolean' &&
      (!p.won || p.room===2 && p.wins>0) && (p.lost===null || p.lost && Number.isInteger(p.lost.room) && p.lost.room>=0 && p.lost.room<3 &&
      ['x','z'].every(k=>Number.isFinite(p.lost[k])&&Math.abs(p.lost[k])<=13) && Number.isSafeInteger(p.lost.runes)&&p.lost.runes>0&&p.lost.runes<1e7);
  }
  function readProgress(raw) {try {const p=JSON.parse(raw);if(validProgress(p))return JSON.parse(JSON.stringify(p));} catch(e) {} return defaultProgress();}
  function angleDiff(a,b) {return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  function blocked(x,z,r=.45) {return Math.abs(x)>13-r || Math.abs(z)>13-r || PILLARS.some(p=>Math.hypot(x-p.x,z-p.z)<r+.8);}
  function move(actor,dx,dz,r=.45) {if(!blocked(actor.x+dx,actor.z,r))actor.x+=dx;if(!blocked(actor.x,actor.z+dz,r))actor.z+=dz;}
  // Critical attacks never teleport: both the prompt and the delayed hit check the same clear path.
  function clearPath(a,b) {
    const d=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(d/.15));
    for(let i=0;i<=steps;i++)if(blocked(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps,.18))return false;
    return true;
  }
  function parryable(e){return e.attackKind==='slash'&&!(e.criticalGuard>0);}
  class Game {
    constructor(progress=defaultProgress()) {
      this.progress=validProgress(progress)?JSON.parse(JSON.stringify(progress)):defaultProgress();
      this.area=this.progress.room;this.state=this.progress.won?'victory':'ready';this.time=0;this.eventId=0;this.events=[];this.bolts=[];this.target=null;this.message='Ognisko Backupu czeka. Nawet przeklęte dane zasługują na kopię.';
      this.spawnRoom();
    }
    get maxHp(){return 120+this.progress.level*10;}
    get maxStamina(){return 100+this.progress.level*5;}
    get levelCost(){return 50+this.progress.level*30;}
    emit(type,x=this.player.x,z=this.player.z){this.events.push({id:++this.eventId,type,x,z});}
    spawnRoom() {
      this.player={x:0,z:8,angle:Math.PI,hp:this.maxHp,stamina:this.maxStamina,flasks:3,inv:1,roll:0,rollX:0,rollZ:-1,action:null,regen:0,stagger:0,blocking:false,parryCooldown:0};
      const layout=this.area===0?[['knight',-3,-2],['knight',4,-5],['scribe',0,-9]]:this.area===1?[['warden',-4,-3],['knight',4,-1],['scribe',1,-9],['knight',-3,-8]]:[['boss',0,-6]];
      this.enemies=this.progress.won?[]:layout.map(([type,x,z],i)=>({id:this.area+'-'+i,type,x,z,hp:ENEMIES[type].hp,maxHp:ENEMIES[type].hp,angle:0,phase:1,state:'idle',timer:.8+i*.25,attackAngle:0,attackKind:'slash',attackRange:ENEMIES[type].range,windup:1,step:0,flash:0,criticalGuard:0}));
      this.bolts=[];this.target=null;
    }
    start(){if(this.state==='ready')this.state='playing';}
    pause(){if(this.state==='playing'){this.state='paused';this.player.blocking=false;}}
    resume(){if(this.state==='paused')this.state='playing';}
    criticalTarget() {
      const p=this.player;if(this.state!=='playing'||p.action||p.roll>0||p.stagger>0)return null;
      const candidates=[];
      for(const e of this.enemies){
        if(e.hp<=0||e.criticalGuard>0||e.state==='critical')continue;
        const d=Math.hypot(e.x-p.x,e.z-p.z),aim=Math.atan2(e.x-p.x,e.z-p.z);
        if(d>.35&&d<=2.25&&Math.abs(angleDiff(aim,p.angle))<.95&&clearPath(p,e)){
          if(e.state==='stunned'&&e.timer>.12)candidates.push({enemy:e,kind:'riposte',d});
          else if(e.type!=='boss'&&e.state!=='stunned'&&d<=2&&Math.abs(angleDiff(Math.atan2(p.x-e.x,p.z-e.z),e.angle))>2.35)candidates.push({enemy:e,kind:'backstab',d});
        }
      }
      candidates.sort((a,b)=>(a.kind==='riposte'?0:1)-(b.kind==='riposte'?0:1)||a.d-b.d);
      return candidates[0]||null;
    }
    action(kind,input={}) {
      const p=this.player;
      if(this.state!=='playing'||p.hp<=0)return false;
      if(kind==='lock') {const alive=this.enemies.filter(e=>e.hp>0);this.target=this.target?null:alive.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]?.id||null;return true;}
      if(kind==='interact')return this.interact();
      if(p.action||p.roll>0||p.stagger>0)return false;
      if(kind==='parry') {
        if(p.stamina<18||p.parryCooldown>0)return false;
        if(Number.isFinite(input.angle))p.angle=input.angle;
        const target=this.enemies.find(e=>e.id===this.target&&e.hp>0);if(target)p.angle=Math.atan2(target.x-p.x,target.z-p.z);
        p.stamina-=18;p.regen=1;p.parryCooldown=.9;p.blocking=false;
        p.action={kind:'parry',time:0,total:.65,hitAt:Infinity,hit:false};this.emit('parryAttempt');return true;
      }
      if(kind==='critical') {
        const choice=this.criticalTarget();if(!choice||p.stamina<32)return false;
        const e=choice.enemy;p.stamina-=32;p.regen=1.1;p.blocking=false;p.angle=Math.atan2(e.x-p.x,e.z-p.z);
        p.action={kind:choice.kind,target:e.id,time:0,total:.95,hitAt:.38,hit:false,angle:p.angle};
        p.inv=Math.max(p.inv,.95);e.state='critical';e.timer=1.15;e.criticalGuard=e.type==='boss'?6:3;
        this.emit('criticalStart',e.x,e.z);return true;
      }
      if(kind==='light'||kind==='heavy') {
        const cost=kind==='heavy'?40:22;if(p.stamina<cost)return false;
        p.stamina-=cost;p.regen=.9;const target=this.enemies.find(e=>e.id===this.target&&e.hp>0);
        if(target)p.angle=Math.atan2(target.x-p.x,target.z-p.z);else if(Number.isFinite(input.angle))p.angle=input.angle;
        p.action={kind,time:0,total:kind==='heavy'?.85:.5,hitAt:kind==='heavy'?.38:.17,hit:false,angle:p.angle};this.emit(kind);return true;
      }
      if(kind==='roll') {
        if(p.stamina<28)return false;let x=input.x||0,z=input.z||0,l=Math.hypot(x,z);if(!l){x=Math.sin(p.angle);z=Math.cos(p.angle);l=1;}
        p.stamina-=28;p.regen=.9;p.roll=.48;p.rollX=x/l;p.rollZ=z/l;p.inv=Math.max(p.inv,.34);p.blocking=false;this.emit('roll');return true;
      }
      if(kind==='heal'&&p.flasks>0&&p.hp<this.maxHp) {p.flasks--;p.action={kind:'heal',time:0,total:1.05,hitAt:.65,hit:false};this.emit('flask');return true;}
      return false;
    }
    interact() {
      const p=this.player;
      if(Math.hypot(p.x,p.z-8)<2.3) {
        if(this.enemies.some(e=>e.hp>0&&Math.hypot(e.x-p.x,e.z-p.z)<5)){this.message='Wrogowie są zbyt blisko ogniska.';return false;}
        this.state='rest';this.progress.room=this.area;this.message='Ognisko Backupu · odpoczynek i rozwój postaci.';return true;
      }
      if(this.area<2&&Math.hypot(p.x,p.z+11)<2.4) {
        if(this.enemies.some(e=>e.hp>0)){this.message='Pieczęć walidacji: najpierw pokonaj strażników.';return false;}
        this.area++;this.progress.room=this.area;this.spawnRoom();this.emit('area');this.message='Nowy punkt kontrolny: '+AREAS[this.area]+'.';return true;
      }
      this.message='E przy ognisku lub odblokowanej bramie. Q namierza przeciwnika.';return false;
    }
    rest() {if(this.state!=='rest')return false;this.spawnRoom();this.state='rest';this.message='Życie i flakony odnowione. Strażnicy również wrócili do pracy.';this.emit('rest');return true;}
    buyLevel() {if(this.state!=='rest'||this.progress.level>=8||this.progress.runes<this.levelCost)return false;this.progress.runes-=this.levelCost;this.progress.level++;this.player.hp=this.maxHp;this.player.stamina=this.maxStamina;this.message='Wyższy poziom. Więcej życia, wytrzymałości i mocy miecza.';this.emit('level');return true;}
    leaveRest(){if(this.state==='rest')this.state='playing';}
    retry() {if(this.state!=='dead')return false;this.area=this.progress.room;this.spawnRoom();this.state='playing';this.message='Powrót do Ogniska Backupu. Odzyskaj upuszczone runy.';return true;}
    hurtPlayer(damage,x,z,unblockable=false,attacker=null) {
      const p=this.player;if(p.inv>0||p.hp<=0)return false;
      const facing=Math.abs(angleDiff(Math.atan2(x-p.x,z-p.z),p.angle))<1.35;
      // Only a real frontal melee strike can open a riposte; bolts and novas bypass parries.
      if(attacker&&!unblockable&&parryable(attacker)&&p.action?.kind==='parry'&&p.action.time>=.08&&p.action.time<=.30&&Math.abs(angleDiff(Math.atan2(x-p.x,z-p.z),p.angle))<1.05){
        attacker.state='stunned';attacker.timer=1.65;p.action=null;p.inv=.18;
        this.message='PAROWANIE! C z bliska: riposta. Odmowa dostępu do twojego życia.';this.emit('parried',attacker.x,attacker.z);return true;
      }
      if(p.blocking&&facing&&!unblockable&&p.stamina>=damage*.9){p.stamina-=damage*.9;p.regen=1.1;p.hp=Math.max(1,p.hp-damage*.12);p.inv=.18;this.emit('block');return true;}
      p.hp=Math.max(0,p.hp-damage);p.inv=.7;p.stagger=.24;p.action=null;p.regen=1;p.blocking=false;this.emit('hurt');
      if(p.hp===0){this.progress.deaths++;this.progress.lost=this.progress.runes>0?{room:this.area,x:p.x,z:p.z,runes:this.progress.runes}:null;this.progress.runes=0;this.state='dead';this.message='Rekord został zarchiwizowany. Nie ma rollbacku. Jest respawn.';this.emit('death');}
      return true;
    }
    hurtEnemy(e,damage,heavy=false) {
      if(e.hp<=0)return;e.hp=Math.max(0,e.hp-damage);e.flash=.18;this.emit('enemyHit',e.x,e.z);
      if(e.hp===0){this.progress.runes=Math.min(9999999,this.progress.runes+ENEMIES[e.type].reward);this.emit('enemyDead',e.x,e.z);if(this.target===e.id)this.target=null;
        if(e.type==='boss'){this.progress.won=true;this.progress.room=2;this.progress.wins++;this.state='victory';this.message='Klątwa Legacy zdjęta. Import zakończony bez nulli.';this.emit('victory');}
        else if(this.enemies.every(x=>x.hp<=0))this.message='Strażnicy pokonani. Brama na północy jest otwarta — podejdź i użyj E.';
      }else if(heavy&&e.type!=='boss'){e.state='recover';e.timer=1;e.step=0;}
    }
    tick(dt,input={}) {
      if(this.state!=='playing'||!Number.isFinite(dt)||dt<=0)return;this.events=[];let remaining=Math.min(.25,dt);
      while(remaining>1e-8&&this.state==='playing'){const step=Math.min(1/120,remaining);remaining-=step;this.step(step,input);}
    }
    step(dt,input) {
      const p=this.player;this.time+=dt;p.inv=Math.max(0,p.inv-dt);p.stagger=Math.max(0,p.stagger-dt);p.regen=Math.max(0,p.regen-dt);p.parryCooldown=Math.max(0,p.parryCooldown-dt);
      p.blocking=!!input.block&&!p.action&&p.roll<=0&&p.stagger<=0&&p.stamina>1;
      const target=this.enemies.find(e=>e.id===this.target&&e.hp>0);if(target&&!p.action&&p.roll<=0)p.angle=Math.atan2(target.x-p.x,target.z-p.z);else if(Number.isFinite(input.angle)&&!p.action&&p.roll<=0)p.angle=input.angle;
      if(p.roll>0){move(p,p.rollX*15*dt,p.rollZ*15*dt);p.roll=Math.max(0,p.roll-dt);}
      else if(p.stagger<=0){let x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,len=Math.hypot(x,z);if(len>0){x/=len;z/=len;const sprint=input.sprint&&!p.action&&!p.blocking&&p.stamina>8;const speed=(sprint?6.6:4.3)*(p.action?(p.action.kind==='riposte'||p.action.kind==='backstab'?0:p.action.kind==='parry'?.15:.35):p.blocking?.52:1);move(p,x*speed*dt,z*speed*dt);if(sprint){p.stamina=Math.max(0,p.stamina-dt*10);p.regen=.5;}if(!target&&!Number.isFinite(input.angle)&&!p.action)p.angle=Math.atan2(x,z);}}
      if(p.regen===0&&!p.blocking&&!p.action)p.stamina=Math.min(this.maxStamina,p.stamina+25*dt);
      if(p.action){const a=p.action;a.time+=dt;if(!a.hit&&a.time>=a.hitAt){a.hit=true;if(a.kind==='heal'){p.hp=Math.min(this.maxHp,p.hp+75);this.emit('healed');}else if(a.kind==='riposte'||a.kind==='backstab'){
        const e=this.enemies.find(e=>e.id===a.target&&e.hp>0);
        if(e&&e.state==='critical'&&Math.hypot(e.x-p.x,e.z-p.z)<=2.6&&clearPath(p,e)){
          this.hurtEnemy(e,(a.kind==='riposte'?e.type==='boss'?140:110:100)+this.progress.level*6);
          this.emit(a.kind,e.x,e.z);this.message=a.kind==='riposte'?'RIPOSTA · krytyczny rollback prosto w rekord.':'BACKSTAB · INSERT INTO plecy. Bez duplikatów.';
        }
      }else{for(const e of this.enemies){const d=Math.hypot(e.x-p.x,e.z-p.z),angle=Math.atan2(e.x-p.x,e.z-p.z);if(e.hp>0&&d<(a.kind==='heavy'?3:2.65)&&Math.abs(angleDiff(angle,a.angle))<1.25)this.hurtEnemy(e,(a.kind==='heavy'?48:28)+this.progress.level*2,a.kind==='heavy');}}}if(a.time>=a.total)p.action=null;}
      if(this.state!=='playing')return;
      for(const e of this.enemies){if(e.hp>0)this.updateEnemy(e,dt);if(this.state!=='playing')return;}
      for(const b of this.bolts){b.life-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;if(blocked(b.x,b.z,.1))b.life=0;if(b.life>0&&Math.hypot(b.x-p.x,b.z-p.z)<.65){this.hurtPlayer(b.damage,b.x-b.vx*.2,b.z-b.vz*.2);b.life=0;}if(this.state!=='playing')return;}
      this.bolts=this.bolts.filter(b=>b.life>0);
      const lost=this.progress.lost;if(lost&&lost.room===this.area&&Math.hypot(lost.x-p.x,lost.z-p.z)<1.25){this.progress.runes=Math.min(9999999,this.progress.runes+lost.runes);this.progress.lost=null;this.emit('reclaim');this.message='Runy odzyskane. Tym razem bez ręcznego merge.';}
    }
    updateEnemy(e,dt) {
      const stats=ENEMIES[e.type],p=this.player,dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz),phase=e.type==='boss'?(e.hp/e.maxHp>.6?1:e.hp/e.maxHp>.3?2:3):1;
      e.flash=Math.max(0,e.flash-dt);
      e.criticalGuard=Math.max(0,(e.criticalGuard||0)-dt);
      if(e.state==='critical'||e.state==='stunned'){e.timer-=dt;if(e.timer<=0){e.state='recover';e.timer=.8;e.criticalGuard=Math.max(e.criticalGuard,e.type==='boss'?3:1);}return;}
      if(e.phase!==phase){e.phase=phase;e.state='recover';e.timer=1.8;this.emit('phase',e.x,e.z);this.message='Lord Legacy / faza '+phase+': „Twoje uprawnienia właśnie wygasły”.';}
      if(e.state==='windup') {
        e.timer-=dt;if(e.timer>0)return;e.state='strike';e.timer=.17;this.emit('enemyAttack',e.x,e.z);
        if(e.attackKind==='bolt'){if(this.bolts.length<12)this.bolts.push({x:e.x,z:e.z,vx:Math.sin(e.attackAngle)*8,vz:Math.cos(e.attackAngle)*8,damage:stats.damage,life:3});}
        else{const angle=Math.atan2(p.x-e.x,p.z-e.z),inside=e.attackKind==='nova'||Math.abs(angleDiff(angle,e.attackAngle))<(e.type==='boss'?1.5:1.3);if(d<e.attackRange+.35&&inside)this.hurtPlayer(stats.damage+(phase-1)*5,e.x,e.z,e.attackKind==='nova',e);}
        return;
      }
      if(e.state==='strike'){e.timer-=dt;if(e.timer<=0){e.state='recover';e.timer=stats.recovery/(1+(phase-1)*.2);}return;}
      if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='chase';return;}
      if(d>10&&e.hp===e.maxHp&&e.type!=='boss'){e.state='idle';return;}
      e.state='chase';e.angle=Math.atan2(dx,dz);e.timer-=dt;
      const stop=e.type==='scribe'?7:stats.range-.5;
      if(d>stop)move(e,dx/(d||1)*stats.speed*(1+(phase-1)*.15)*dt,dz/(d||1)*stats.speed*(1+(phase-1)*.15)*dt,e.type==='boss'?.9:.5);
      if(d<stats.range+.6&&e.timer<=0){e.step++;e.attackKind=e.type==='scribe'?'bolt':e.type==='boss'&&e.step%3===0?'nova':'slash';e.attackRange=e.attackKind==='nova'?4.4:stats.range;e.attackAngle=Math.atan2(p.x-e.x,p.z-e.z);e.windup=e.attackKind==='nova'?1.2:stats.windup/(1+(phase-1)*.2);e.timer=e.windup;e.state='windup';}
    }
    snapshot(){return JSON.parse(JSON.stringify(this.progress));}
  }
  return {Game,AREAS,PILLARS,ENEMIES,defaultProgress,validProgress,readProgress,angleDiff,blocked,clearPath,parryable};
});
