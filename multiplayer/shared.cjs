'use strict';
// Numeric PvP values are deliberately shared by both factions. Names and colours are cosmetic.
const VERSION=11;
const WORLD={minX:-24,maxX:24,minZ:-20,maxZ:20};
const LIMITS={playersPerTeam:3,coopPlayers:3,enemies:24,projectiles:180,warnings:10,events:12};
const VS_STATS=Object.freeze({maxHp:140,maxShield:40,damage:14,interval:.19,speed:8,sprintSpeed:10.2,projectileSpeed:30,projectileLife:1.65,shieldRegen:8,rechargeDelay:4,armor:0,abilityDamage:28,abilityRadius:5.5,abilityCooldown:9,dashCooldown:3,dashSpeed:30,dashDuration:.17});
const FACTIONS={salesforce:{name:'Salesforce',color:0x70e7f5,ability:'Permission Set: ACCESS DENIED',dash:'ZIPsert'},excel:{name:'Excel',color:0x76ee99,ability:'Ctrl+Alt+Eksplozja',dash:'Ctrl+Przesuń'}};
const UPGRADES={
 damage:{label:'Wzmacniacz External ID',description:'+0,9 obrażeń każdego strzału dla całej drużyny.',baseCost:180,maxLevel:5},
 rate:{label:'Akcelerator Bulk API',description:'+10% bazowej szybkostrzelności za poziom.',baseCost:180,maxLevel:5},
 armor:{label:'Pancerz Enterprise',description:'+20 maksymalnego życia za poziom.',baseCost:160,maxLevel:5},
 shield:{label:'Permission Shield',description:'+20 tarczy i szybsza regeneracja.',baseCost:180,maxLevel:5},
 plating:{label:'Validation Rule',description:'5% redukcji obrażeń życia, maksymalnie 25%.',baseCost:180,maxLevel:5},
 biotic:{label:'Apex Trigger: Mass Update',description:'Mocniejszy i częstszy impuls Q.',baseCost:170,maxLevel:5},
 mobility:{label:'Queueable ZIPsert',description:'Krótsze odnowienie dasha dla wszystkich.',baseCost:150,maxLevel:5}
};
const MAPS={
 arena:[{x:-8,z:-7,w:3,d:6},{x:8,z:-7,w:3,d:6},{x:-8,z:7,w:3,d:6},{x:8,z:7,w:3,d:6},{x:0,z:0,w:5,d:2}],
 port:[{x:-11,z:-4,w:8,d:2.5},{x:11,z:-4,w:8,d:2.5},{x:-11,z:8,w:6,d:2.3},{x:11,z:8,w:6,d:2.3}],
 archive:[{x:-10,z:-5,w:2.6,d:11},{x:10,z:-5,w:2.6,d:11},{x:-5,z:8,w:4,d:3},{x:5,z:8,w:4,d:3}],
 hive:[{x:-12,z:-5,w:9,d:2.5},{x:12,z:-5,w:9,d:2.5},{x:-9,z:8,w:2.8,d:6},{x:9,z:8,w:2.8,d:6}],
 network:[{x:-13,z:-8,w:4,d:4},{x:13,z:-8,w:4,d:4},{x:-6,z:2,w:3,d:4},{x:6,z:2,w:3,d:4},{x:-14,z:11,w:5,d:2},{x:14,z:11,w:5,d:2}],
 core:[{x:-13,z:-4,w:5,d:3},{x:13,z:-4,w:5,d:3},{x:-12,z:10,w:5,d:3},{x:12,z:10,w:5,d:3}],
 spreadsheet:[{x:-13,z:-1,w:5,d:2},{x:13,z:-1,w:5,d:2},{x:-12,z:9,w:4,d:2},{x:12,z:9,w:4,d:2}]
};
const MISSIONS=[
 {id:0,name:'Deadlock-9: port duplikatów',map:'port',waves:3,difficulty:1.25,reward:650,boss:null,description:'Osobna kampania drużynowa. Rekordy uciekły z kolejki i strzelają do administratorów.'},
 {id:1,name:'Archiwum Shared With Everyone',map:'archive',waves:3,difficulty:1.6,reward:850,boss:null,description:'Proteanie odkryli dzielenie rekordów. Niestety ze Zbieraczami.'},
 {id:2,name:'Fabryka INSERT zamiast UPSERT',map:'hive',waves:3,difficulty:2,reward:1100,boss:'boss',description:'Zbieracze klonują dane. Zatrzymaj linię produkcyjną i awatara Zwiastuna.'},
 {id:3,name:'Omega: globalny Permission Set',map:'network',waves:3,difficulty:2.5,reward:1400,boss:'boss',description:'Gethy i Banshee walidują was ogniem. Dobry zespół musi umieć ratować kolegów.'},
 {id:4,name:'Jądro: konflikt wszystkich gałęzi',map:'core',waves:3,difficulty:3.1,reward:1800,boss:'boss',description:'Zwiastun wdrożył merge bez review. Cofnij ten deployment razem z drużyną.'},
 {id:5,name:'Excel Online: współdzielona katastrofa',map:'spreadsheet',waves:1,difficulty:3.8,reward:3000,boss:'excel',description:'Wspólny boss, wspólna tarcza, wspólna pomoc Marca. Nikt nie wygra tego importu samym klikaniem Next.'}
];
const ENEMY_TYPES={
 reaper:{name:'Żniwiarz XLSX',hp:42,damage:13,speed:2.7,r:.85,reward:18,color:0xee946b},
 collector:{name:'Zbieracz INSERT',hp:38,damage:12,speed:4,r:.75,reward:20,color:0xe7c363},
 geth:{name:'Geth Permission Wall',hp:70,damage:15,speed:2.2,r:.95,reward:28,color:0x7cbfff},
 banshee:{name:'Banshee Validation Rule',hp:105,damage:19,speed:2.5,r:1.05,reward:36,color:0xea8dff},
 boss:{name:'Zwiastun: Merge Conflict',hp:1100,damage:25,speed:1.3,r:2,reward:180,color:0xff8663},
 excel:{name:'Excel Online / DUPLICATE_VALUE',hp:3600,damage:29,speed:0,r:2.5,reward:450,color:0x74f2aa}
};
function normalizedUpgrades(value={}){const out={};for(const key of Object.keys(UPGRADES))out[key]=Number.isInteger(value[key])?Math.max(0,Math.min(5,value[key])):0;return out}
function coopStats(upgrades={}){const u=normalizedUpgrades(upgrades);return {maxHp:140+20*u.armor,maxShield:60+20*u.shield,damage:8+.9*u.damage,interval:.2/(1+.1*u.rate),speed:8.2,sprintSpeed:10.8,projectileSpeed:30,projectileLife:1.7,shieldRegen:10+2*u.shield,rechargeDelay:4,armor:.05*u.plating,abilityDamage:26+7*u.biotic,abilityRadius:6,abilityCooldown:Math.max(4,10-u.biotic),dashCooldown:Math.max(1.6,3.1-.3*u.mobility),dashSpeed:32,dashDuration:.2}}
module.exports={VERSION,WORLD,LIMITS,VS_STATS,FACTIONS,UPGRADES,MAPS,MISSIONS,ENEMY_TYPES,normalizedUpgrades,coopStats};
