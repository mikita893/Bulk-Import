'use strict';
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BulkColony=api;})(typeof window!=='undefined'?window:globalThis,function(){
 const NPCS={guard:{x:0,z:37,name:'Borut · Strażnik Nulli',color:'#ac7753'},smith:{x:-10,z:23,name:'Magda · Kowalka Hotfixów',color:'#9b635e'},mentor:{x:11,z:24,name:'Witold · Stary Administrator',color:'#6b8297'},leader:{x:10,z:7,name:'Kora · Komendantka Importu',color:'#798963'}};
 const FACTIONS={guard:{name:'Stary Obóz Walidacji',description:'+15 życia, mniej obrażeń. Formularz A38 obowiązkowy.'},rogue:{name:'Nowy Obóz CSV',description:'+4 obrażenia, szybszy bieg. Żadnych abonamentów za zbroję.'},mage:{name:'Krąg Bulk API',description:'Ognisty Upsert z dystansu. Święty limit: 100 rekordów naraz.'}};
 const HUTS=[{x:-19,z:25,w:10,d:10},{x:20,z:25,w:11,d:9},{x:-19,z:8,w:11,d:9},{x:20,z:7,w:9,d:10}];
 const ORE=[{x:-18,z:52},{x:18,z:58},{x:30,z:44},{x:-48,z:-27},{x:50,z:-18},{x:59,z:-8},{x:-35,z:-58},{x:42,z:-49}];
 const FIRE={x:0,z:18},CHEST={x:0,z:-58},MINE={x:54,z:-18};
 const ENEMY_TYPES={bird:{name:'CSV-jad',hp:34,damage:9,range:1.9,speed:3,windup:.85,xp:18,ore:0},wolf:{name:'Wilk Błędnego Mapowania',hp:58,damage:14,range:2.2,speed:3.5,windup:1,xp:32,ore:1},warden:{name:'Poborca Licencji',hp:96,damage:20,range:2.6,speed:2.5,windup:1.1,xp:40,ore:2},boss:{name:'Nadzorca Wielkiego Importu',hp:320,damage:24,range:3.3,speed:2.2,windup:1.2,xp:150,ore:12}};
 const SPAWNS=[['bird0','bird',-17,55],['bird1','bird',20,60],['bird2','bird',32,43],['wolf0','wolf',-7,-43],['wolf1','wolf',7,-53],['warden','warden',36,-24],['boss','boss',54,-18]];
 const TREES=[];for(let x=-70;x<=70;x+=14)for(let z=-70;z<=70;z+=14){const tx=x+Math.sin(x*7+z)*2,tz=z+Math.cos(z*5+x)*2;if(Math.hypot(tx,tz)>77||Math.abs(tx)<10||Math.abs(tx)<36&&tz>-5&&tz<43||[...ORE,...Object.values(NPCS),CHEST,MINE].some(p=>Math.hypot(p.x-tx,p.z-tz)<8))continue;TREES.push({x:tx,z:tz,h:8+(TREES.length%4)*2});}
 function fresh(){return {version:1,quest:0,started:false,faction:null,xp:0,lp:0,strength:0,vitality:0,weapon:0,armor:0,ore:0,potions:3,mined:Array(8).fill(false),killed:[],greeted:{guard:false,smith:false,mentor:false,leader:false},reputation:0,wins:0,deaths:0};}
 function level(p){return Math.min(8,1+Math.floor(p.xp/60));}
 function valid(p){return !!p&&p.version===1&&Number.isInteger(p.quest)&&p.quest>=0&&p.quest<=5&&typeof p.started==='boolean'&&(p.quest===0||p.started)&&
  (p.quest<2?p.faction===null:Object.hasOwn(FACTIONS,p.faction))&&['xp','lp','ore','wins','deaths'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0&&p[k]<1e7)&&p.lp<=21&&Number.isInteger(p.strength)&&p.strength>=0&&p.strength<=8&&Number.isInteger(p.vitality)&&p.vitality>=0&&p.vitality<=6&&p.lp+p.strength+p.vitality*2===(level(p)-1)*3&&[p.weapon,p.armor].every(x=>x===0||x===1)&&Number.isInteger(p.potions)&&p.potions>=0&&p.potions<=9&&Number.isInteger(p.reputation)&&Math.abs(p.reputation)<=10&&
  Array.isArray(p.mined)&&p.mined.length===8&&p.mined.every(x=>typeof x==='boolean')&&Array.isArray(p.killed)&&p.killed.length<=7&&new Set(p.killed).size===p.killed.length&&p.killed.every(id=>SPAWNS.some(s=>s[0]===id))&&(p.quest<3||['wolf0','wolf1'].every(id=>p.killed.includes(id)))&&(!p.killed.includes('boss')||p.quest===5&&p.wins>0)&&(p.quest!==5||p.killed.includes('boss')&&p.wins>0)&&p.greeted&&Object.keys(NPCS).every(k=>typeof p.greeted[k]==='boolean');}
 function read(raw){try{const p=JSON.parse(raw);if(valid(p))return JSON.parse(JSON.stringify(p));}catch(e){}return fresh();}
 function height(x,z){return Math.sin(x*.045)*1.7+Math.cos(z*.04)*1.1-.4;}
 function camp(x,z){return Math.abs(x)<30&&z>1&&z<35;}
 function blocked(x,z,quest=0,r=.55){
  return Math.hypot(x,z)>82-r||HUTS.some(h=>Math.abs(x-h.x)<h.w/2+r&&Math.abs(z-h.z)<h.d/2+r)||TREES.some(t=>Math.hypot(x-t.x,z-t.z)<.65+r)||
   Math.abs(z-36)<.7+r&&Math.abs(x)<33&&(Math.abs(x)>4-r||quest===0)||Math.abs(z)<.7+r&&Math.abs(x)<33&&Math.abs(x)>4-r||Math.abs(Math.abs(x)-32)<.7+r&&z>0&&z<36;
 }
 function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
 class Game{
  constructor(progress=fresh()){this.progress=valid(progress)?JSON.parse(JSON.stringify(progress)):fresh();this.state=this.progress.quest===5?'victory':'ready';this.time=0;this.events=[];this.eventId=0;this.npc=null;this.target=null;this.bolts=[];this.message='Kolonia Legacy. Tu za błędy płacisz rudą, nie ticketem do supportu.';this.spawn();}
  get level(){return level(this.progress);}
  get maxHp(){return 100+(this.level-1)*8+this.progress.vitality*10+(this.progress.faction==='guard'?15:0);}
  get maxStamina(){return 100+(this.level-1)*3;}
  get damage(){return 14+this.progress.strength*3+this.progress.weapon*10+(this.progress.faction==='rogue'?4:0);}
  get discount(){return this.progress.reputation>=5?1:this.progress.reputation<0?-1:0;}
  spawn(){this.player={x:0,z:this.progress.quest>0?18:44,angle:Math.PI,hp:this.maxHp,stamina:this.maxStamina,mana:80,regen:0,inv:1,stagger:0,roll:0,rollX:0,rollZ:1,action:null,blocking:false,cooldown:0};this.enemies=SPAWNS.filter(s=>!this.progress.killed.includes(s[0])&&(s[1]!=='boss'||this.progress.quest===4)).map(s=>this.makeEnemy(s));this.target=null;this.bolts=[];}
  makeEnemy([id,type,x,z]){const stats=ENEMY_TYPES[type];return {id,type,x,z,homeX:x,homeZ:z,angle:0,hp:stats.hp,maxHp:stats.hp,state:'idle',timer:.5,attackAngle:0,windup:stats.windup,range:stats.range,phase:1,strikes:0,kind:'slash'};}
  emit(type,x=this.player.x,z=this.player.z){this.events.push({id:++this.eventId,type,x,z});}
  gain(amount){const before=this.level,oldHp=this.maxHp;this.progress.xp+=amount;const delta=this.level-before;if(delta){this.progress.lp+=delta*3;this.player.hp+=this.maxHp-oldHp;this.emit('level');this.message='POZIOM '+this.level+' · +'+delta*3+' PN. Witold w obozie nauczy cię korzystać z nowych uprawnień.';}}
  start(){if(this.state==='ready')this.state='playing';}
  pause(){if(this.state==='playing'){this.state='paused';this.player.blocking=false;}}
  resume(){if(this.state==='paused')this.state='playing';}
  retry(){if(this.state!=='dead')return false;this.progress.potions=Math.max(2,this.progress.potions);this.spawn();this.state='playing';this.message='Budzisz się przy bezpiecznym punkcie. Zadania, ruda i ekwipunek zachowane.';return true;}
  explore(){if(this.state==='victory')this.state='playing';}
  objective(){const p=this.progress;if(!p.started)return {...NPCS.guard,text:'Porozmawiaj z Borutem przy bramie (E).'};if(p.quest===0){if(p.ore>=3)return {...NPCS.guard,text:'Oddaj strażnikowi 3 bryły rudy (E).'};const t=ORE.map((o,i)=>({...o,i})).filter(o=>!p.mined[o.i]).sort((a,b)=>Math.hypot(a.x-this.player.x,a.z-this.player.z)-Math.hypot(b.x-this.player.x,b.z-this.player.z))[0];return {...t,text:'Zdobądź 3 bryły rudy: '+Math.min(3,p.ore)+'/3. E przy złożu; uważaj na CSV-jady.'};}if(p.quest===1)return {...NPCS.leader,text:'Dołącz do jednej z trzech frakcji. Kora czeka w obozie.'};if(p.quest===2){const wolf=this.enemies.find(e=>e.type==='wolf'&&e.hp>0);return {...(wolf||CHEST),text:'Pokonaj dwa wilki i odzyskaj Pieczęć External ID ze skrzyni w ruinach.'};}if(p.quest===3)return {...NPCS.leader,text:'Zanieś Pieczęć External ID Korze i odblokuj kopalnię.'};if(p.quest===4)return {...MINE,text:'Pokonaj Nadzorcę Wielkiego Importu w kopalni. PN i sprzęt pomagają w walce.'};return {...FIRE,text:'Kolonia wolna od klątwy. Możesz dalej zwiedzać i rozmawiać.'};}
  nearby(){const p=this.player;for(const [id,n] of Object.entries(NPCS))if(Math.hypot(p.x-n.x,p.z-n.z)<3)return {kind:'npc',id,text:'E · POROZMAWIAJ: '+n.name};if(this.progress.quest>0&&Math.hypot(p.x-FIRE.x,p.z-FIRE.z)<3)return {kind:'rest',text:'E · ODPOCZNIJ PRZY OGNISKU'};if(this.progress.quest===2&&Math.hypot(p.x-CHEST.x,p.z-CHEST.z)<3)return {kind:'chest',text:'E · OTWÓRZ SKRZYNIĘ'};const i=ORE.findIndex((o,i)=>!this.progress.mined[i]&&Math.hypot(o.x-p.x,o.z-p.z)<3);return i>=0?{kind:'ore',id:i,text:'E · WYDOBĄDŹ RUDĘ'}:null;}
  action(kind,input={}){
   const p=this.player;if(this.state!=='playing'||p.hp<=0)return false;
   if(kind==='lock'){const targets=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-p.x,e.z-p.z)<20);this.target=this.target?null:targets.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]?.id||null;return true;}
   if(p.action||p.roll>0||p.stagger>0)return false;
   if(kind==='interact'){
    const near=this.nearby();if(!near){this.message='Podejdź bliżej. E: postacie, ruda, skrzynia lub ognisko.';return false;}
    if(near.kind==='npc'){this.npc=near.id;this.state='dialogue';return true;}
    if(near.kind==='ore'){p.action={kind:'mine',time:0,total:1.15,hitAt:1,hit:false,node:near.id,x:p.x,z:p.z};this.message='Wydobywanie rudy… nie odchodź od złoża.';this.emit('mine');return true;}
    if(near.kind==='rest'){if(this.enemies.some(e=>e.hp>0&&Math.hypot(e.x-p.x,e.z-p.z)<7)){this.message='Za blisko wrogów. Ognisko nie ma uprawnień bojowych.';return false;}p.hp=this.maxHp;p.stamina=this.maxStamina;p.mana=80;this.progress.potions=Math.max(2,this.progress.potions);this.message='Odpoczynek: życie, skupienie i co najmniej dwie mikstury odnowione.';this.emit('rest');return true;}
    if(near.kind==='chest'){if(!['wolf0','wolf1'].every(id=>this.progress.killed.includes(id))){this.message='Pieczęci pilnują dwa wilki. Najpierw usuń ich blokadę rekordu.';return false;}this.progress.quest=3;this.progress.ore+=4;this.gain(70);this.message='Pieczęć External ID odzyskana! Kora powinna zobaczyć ten unikalny indeks.';this.emit('quest');return true;}
   }
   const target=this.enemies.find(e=>e.id===this.target&&e.hp>0);if(target)p.angle=Math.atan2(target.x-p.x,target.z-p.z);else if(Number.isFinite(input.angle))p.angle=input.angle;
   if(kind==='light'||kind==='heavy'){const heavy=kind==='heavy',cost=heavy?28:16;if(p.stamina<cost)return false;p.stamina-=cost;p.regen=.7;p.action={kind,time:0,total:heavy?.75:.45,hitAt:heavy?.34:.16,hit:false,angle:p.angle};this.emit(kind);return true;}
   if(kind==='dodge'){if(p.stamina<24)return false;let x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,len=Math.hypot(x,z);if(!len){x=-Math.sin(p.angle);z=-Math.cos(p.angle);len=1;}p.stamina-=24;p.regen=.7;p.roll=.4;p.rollX=x/len;p.rollZ=z/len;p.inv=Math.max(p.inv,.3);p.blocking=false;this.emit('dodge');return true;}
   if(kind==='heal'&&this.progress.potions>0&&p.hp<this.maxHp){this.progress.potions--;p.action={kind:'heal',time:0,total:.95,hitAt:.6,hit:false};this.emit('flask');return true;}
   if(kind==='ability'&&this.progress.faction&&p.cooldown<=0){const mage=this.progress.faction==='mage';if(mage?p.mana<25:p.stamina<32)return false;if(mage)p.mana-=25;else p.stamina-=32;p.regen=.7;p.cooldown=mage?4:7;p.action={kind:mage?'spell':'shout',time:0,total:.65,hitAt:.28,hit:false,angle:p.angle};this.emit('ability');return true;}
   return false;
  }
  dialogue(){
   const id=this.npc,n=NPCS[id],p=this.progress;if(!n)return null;const choice=(id,label,disabled=false)=>({id,label,disabled});let text='',choices=[];
   if(id==='guard'){
    if(p.quest===0){text=p.started?'Trzy bryły rudy. Nie trzy duplikaty tej samej bryły. To jest kolonia, nie Excel.':'Nowy? Tutaj nawet kopniak wymaga Permission Seta. Przynieś trzy bryły rudy, a otworzę bramę.';choices=p.started?[choice('deliver','Mam trzy bryły. Wpuść mnie.',p.ore<3)]:[choice('accept','Pomogę. Gdzie mam szukać rudy?'),choice('rude','Sam sobie zaimportuj tę rudę.',p.greeted.guard)];}
    else text='Witaj w Kolonii. Kora przydziela frakcje, Magda sprzedaje stal, Witold rozdaje wiedzę za punkty nauki. Żaden nie akceptuje płatności makrem.';
   }else if(p.quest===0){text='Najpierw uzyskaj przepustkę od Boruta. Trzy bryły rudy dla strażnika mają pierwszeństwo przed zakupami i nauką.';}
   else if(!p.greeted[id]){text=id==='smith'?'Stal mam prawdziwą. Tylko faktury są w chmurze. Jak się przedstawisz?':id==='mentor'?'Wiedza kosztuje punkty nauki. Ignorancja jest w darmowym planie.':'Trzy drogi, jeden import. Zanim wybierzesz, pokaż, jak traktujesz ludzi.';choices=[choice('greet','Dzień dobry. Przyda mi się wasza pomoc.'),choice('rude','Nie mam czasu na wasze formularze.')];}
   else if(id==='smith'){text='Miecz Ręcznego Merge: +10 obrażeń. Kaftan Enterprise: mniej obrażeń. Mikstura: +60 życia. Przychylność wpływa na ceny.';const sword=5-this.discount,armor=4-this.discount;choices=[choice('sword','Miecz · '+sword+' rudy'+(p.weapon?' · KUPIONY':''),!!p.weapon||p.ore<sword),choice('armor','Kaftan · '+armor+' rudy'+(p.armor?' · KUPIONY':''),!!p.armor||p.ore<armor),choice('potion','Mikstura · 1 rudy ('+p.potions+'/9)',p.ore<1||p.potions>=9)];}
   else if(id==='mentor'){text='Poziom '+this.level+'. Masz '+p.lp+' PN. Siła wzmacnia każdy cios; żywotność zwiększa maksymalne życie. Praktyka ważniejsza niż certyfikat.';choices=[choice('strength','Siła +3 obrażeń · 1 PN ('+p.strength+'/8)',p.lp<1||p.strength>=8),choice('vitality','Żywotność +10 życia · 2 PN ('+p.vitality+'/6)',p.lp<2||p.vitality>=6)];}
   else if(id==='leader'){
    if(p.quest<1)text='Bez zgody Boruta nie ma onboardingu. Trzy bryły rudy i wracaj.';
    else if(p.quest===1){text='Wybierz obóz. Każda droga prowadzi do ruin, ale różnie rozwiązuje konflikty w danych.';choices=Object.entries(FACTIONS).map(([key,f])=>choice('join_'+key,f.name+' · '+f.description));}
    else if(p.quest===2)text='Dwa wilki strzegą Pieczęci External ID w ruinach na północy. Pokonaj je i zajrzyj do skrzyni. Mapa i dziennik cię poprowadzą.';
    else if(p.quest===3){text='Pieczęć działa. Otworzę kopalnię. Nadzorca Wielkiego Importu karmi barierę duplikatami. Przerwij jego proces!';choices=[choice('report','Oddaj pieczęć i otwórz kopalnię.')];}
    else text=p.quest===4?'Przygotuj sprzęt i wydaj PN u Witolda. Nadzorca czeka na wschodzie. Jego czerwony sektor oznacza atak, nie zgodę marketingową.':'Bariera przestała więzić kolonię. Jedyny pozostały limit to długość listy twoich zasług.';
   }
   return {id,name:n.name,text,choices:[...choices,choice('leave','Kończę rozmowę.')]};
  }
  choose(id){
   if(this.state!=='dialogue')return false;const d=this.dialogue(),c=d?.choices.find(c=>c.id===id&&!c.disabled);if(!c)return false;const p=this.progress,n=this.npc;
   if(id==='leave'){this.npc=null;this.state='playing';return true;}
   if(id==='greet'||id==='rude'){if(!p.greeted[n]){p.reputation=Math.max(-10,Math.min(10,p.reputation+(id==='greet'?2:-2)));p.greeted[n]=true;}this.emit('talk');return true;}
   if(id==='accept'){if(!p.greeted.guard){p.reputation=Math.min(10,p.reputation+2);p.greeted.guard=true;}p.started=true;this.message='Nowe zadanie: trzy bryły rudy. Złoża są na południu, przy CSV-jadach.';}
   if(id==='deliver'){p.ore=p.ore-3+8;p.quest=1;this.gain(60);this.message='Brama otwarta! +8 rudy na start. Porozmawiaj z Korą, kowalką i nauczycielem.';}
   if(id.startsWith('join_')){p.faction=id.slice(5);p.quest=2;p.ore+=2;this.gain(40);this.player.hp=this.maxHp;this.message='Dołączasz: '+FACTIONS[p.faction].name+'. Q uruchamia zdolność frakcji. Dziennik wskazuje ruiny.';}
   if(id==='report'){p.quest=4;p.ore+=4;this.gain(60);this.enemies.push(this.makeEnemy(SPAWNS.find(s=>s[0]==='boss')));this.message='Kopalnia otwarta. Pokonaj Nadzorcę Wielkiego Importu!';}
   if(id==='sword'){p.ore-=5-this.discount;p.weapon=1;this.emit('upgrade');return true;}
   if(id==='armor'){p.ore-=4-this.discount;p.armor=1;this.emit('upgrade');return true;}
   if(id==='potion'){p.ore--;p.potions++;this.emit('upgrade');return true;}
   if(id==='strength'||id==='vitality'){const old=this.maxHp;if(id==='strength'){p.lp--;p.strength++;}else{p.lp-=2;p.vitality++;}this.player.hp+=this.maxHp-old;this.emit('upgrade');return true;}
   this.emit('quest');this.npc=null;this.state='playing';return true;
  }
  move(a,x,z,r=.55){if(!blocked(a.x+x,a.z,this.progress.quest,r))a.x+=x;if(!blocked(a.x,a.z+z,this.progress.quest,r))a.z+=z;}
  hurtPlayer(damage,x,z,unblockable=false){
   const p=this.player;if(this.state!=='playing'||p.inv>0||p.hp<=0)return false;damage*=this.progress.armor?.78:1;damage*=this.progress.faction==='guard'?.9:1;
   if(p.blocking&&!unblockable&&Math.abs(angleDiff(Math.atan2(x-p.x,z-p.z),p.angle))<1.25&&p.stamina>=damage*1.2){p.stamina-=damage*1.2;p.hp=Math.max(1,p.hp-damage*.25);p.inv=.2;p.regen=1;this.emit('block');return true;}
   p.hp=Math.max(0,p.hp-damage);p.inv=.65;p.stagger=.22;p.regen=.8;p.action=null;this.emit('hurt');if(p.hp===0){this.progress.deaths++;this.state='dead';this.message='Powalony. Ktoś odholuje cię do bezpiecznego punktu. Postęp i sprzęt zostają.';this.emit('death');}return true;
  }
  hurtEnemy(e,damage,heavy=false){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-damage);this.emit('enemyHit',e.x,e.z);if(e.hp===0){this.progress.killed.push(e.id);this.progress.ore+=ENEMY_TYPES[e.type].ore;this.gain(ENEMY_TYPES[e.type].xp);this.emit('enemyDead',e.x,e.z);if(this.target===e.id)this.target=null;if(e.type==='boss'){this.progress.quest=5;this.progress.wins++;this.state='victory';this.message='Nadzorca pokonany. Bariera Legacy pęka, a kolonia odzyskuje dostęp do własnych danych.';this.emit('victory');}}else if(heavy&&e.type!=='boss'){e.state='recover';e.timer=.85;}}
  tick(dt,input={}){if(this.state!=='playing'||!Number.isFinite(dt)||dt<=0)return;this.events=[];let remaining=Math.min(.25,dt);while(remaining>1e-8&&this.state==='playing'){const s=Math.min(1/120,remaining);remaining-=s;this.step(s,input);}}
  step(dt,input){
   const p=this.player;this.time+=dt;for(const k of ['inv','stagger','regen','cooldown'])p[k]=Math.max(0,p[k]-dt);p.blocking=!!input.block&&!p.action&&p.roll<=0&&p.stagger<=0;
   const target=this.enemies.find(e=>e.id===this.target&&e.hp>0);if(target&&!p.action&&p.roll<=0)p.angle=Math.atan2(target.x-p.x,target.z-p.z);else if(Number.isFinite(input.angle)&&!p.action&&p.roll<=0)p.angle=input.angle;
   let x=Number.isFinite(input.x)?input.x:0,z=Number.isFinite(input.z)?input.z:0,len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
   if(p.roll>0){this.move(p,p.rollX*11*dt,p.rollZ*11*dt);p.roll=Math.max(0,p.roll-dt);}else if(p.stagger<=0){const sprint=input.sprint&&!p.action&&!p.blocking&&p.stamina>8,speed=(sprint?7:4.8)+(this.progress.faction==='rogue'?.5:0),factor=p.action?.3:p.blocking?.5:1;this.move(p,x*speed*factor*dt,z*speed*factor*dt);if(sprint&&len){p.stamina=Math.max(0,p.stamina-dt*9);p.regen=.5;}if(len&&!target&&!p.action&&!Number.isFinite(input.angle))p.angle=Math.atan2(x,z);}
   if(p.regen===0&&!p.action&&!p.blocking)p.stamina=Math.min(this.maxStamina,p.stamina+25*dt);p.mana=Math.min(80,p.mana+dt*8);
   if(p.action){const a=p.action;a.time+=dt;if(a.kind==='mine'&&Math.hypot(p.x-a.x,p.z-a.z)>1.3){p.action=null;this.message='Przerwano wydobycie. Stań przy złożu i spróbuj ponownie.';}else{if(!a.hit&&a.time>=a.hitAt){a.hit=true;if(a.kind==='mine'){if(!this.progress.mined[a.node]){this.progress.mined[a.node]=true;this.progress.ore++;this.message='Bryła rudy zdobyta. Jedyna waluta, której nie da się dopisać formułą.';this.emit('ore');}}else if(a.kind==='heal'){p.hp=Math.min(this.maxHp,p.hp+60);this.emit('healed');}else if(a.kind==='spell'){if(this.bolts.length<6)this.bolts.push({x:p.x,z:p.z,vx:Math.sin(a.angle)*14,vz:Math.cos(a.angle)*14,life:1.6,damage:38+this.progress.strength*2});this.emit('spell');}else for(const e of this.enemies){const d=Math.hypot(e.x-p.x,e.z-p.z),angle=Math.atan2(e.x-p.x,e.z-p.z),range=a.kind==='shout'?4:a.kind==='heavy'?3:2.65;if(e.hp>0&&d<range&&(a.kind==='shout'||Math.abs(angleDiff(angle,a.angle))<1.3))this.hurtEnemy(e,a.kind==='shout'?22:this.damage*(a.kind==='heavy'?1.6:1),a.kind!=='light');}}if(a.time>=a.total)p.action=null;}}
   if(this.state!=='playing')return;
   for(const e of this.enemies){if(e.hp>0)this.updateEnemy(e,dt);if(this.state!=='playing')return;}
   for(const b of this.bolts){b.life-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;if(blocked(b.x,b.z,this.progress.quest,.15))b.life=0;for(const e of this.enemies)if(b.life>0&&e.hp>0&&Math.hypot(b.x-e.x,b.z-e.z)<.9){this.hurtEnemy(e,b.damage,true);b.life=0;}if(this.state!=='playing')return;}this.bolts=this.bolts.filter(b=>b.life>0);
  }
  updateEnemy(e,dt){
   const stats=ENEMY_TYPES[e.type],p=this.player,d=Math.hypot(p.x-e.x,p.z-e.z);if(e.type==='boss'&&e.phase===1&&e.hp<e.maxHp*.5){e.phase=2;e.state='recover';e.timer=1.4;this.message='Nadzorca wściekły! Druga faza: szybsze ataki i limitowanie obszaru.';this.emit('phase',e.x,e.z);}
   if(e.state==='windup'){e.timer-=dt;if(e.timer<=0){e.state='strike';e.timer=.18;this.emit('enemyAttack',e.x,e.z);if(d<e.range+.35&&(e.kind==='nova'||Math.abs(angleDiff(Math.atan2(p.x-e.x,p.z-e.z),e.attackAngle))<1.4))this.hurtPlayer(stats.damage+(e.phase-1)*6,e.x,e.z,e.kind==='nova');}return;}
   if(e.state==='strike'){e.timer-=dt;if(e.timer<=0){e.state='recover';e.timer=e.type==='boss'?1.15/e.phase:1;}return;}
   if(e.state==='recover'){e.timer-=dt;if(e.timer<=0)e.state='idle';return;}
   if(camp(p.x,p.z)||d>12&&e.hp===e.maxHp){const home=Math.hypot(e.x-e.homeX,e.z-e.homeZ);if(home>.3)this.move(e,(e.homeX-e.x)/home*stats.speed*dt,(e.homeZ-e.z)/home*stats.speed*dt,.6);return;}
   e.angle=Math.atan2(p.x-e.x,p.z-e.z);if(d>stats.range-.4)this.move(e,Math.sin(e.angle)*stats.speed*dt,Math.cos(e.angle)*stats.speed*dt,e.type==='boss'?.8:.55);e.timer-=dt;if(d<stats.range+.5&&e.timer<=0){e.strikes++;e.kind=e.type==='boss'&&e.strikes%3===0?'nova':'slash';e.range=e.kind==='nova'?4.3:stats.range;e.windup=e.kind==='nova'?1.3:stats.windup/(e.phase===2?1.3:1);e.timer=e.windup;e.attackAngle=e.angle;e.state='windup';}
  }
  snapshot(){return JSON.parse(JSON.stringify(this.progress));}
 }
 return {Game,NPCS,FACTIONS,HUTS,ORE,FIRE,CHEST,MINE,ENEMY_TYPES,SPAWNS,TREES,fresh,valid,read,level,height,blocked,camp,angleDiff};
});
