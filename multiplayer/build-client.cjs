'use strict';
const fs=require('node:fs'),path=require('node:path');
const shared=require('./shared.cjs'),release=require('../release.cjs');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const versioned=value=>value.replaceAll('__VERSION__',String(release.major));
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const bakedConfig={missions:shared.MISSIONS,upgrades:shared.UPGRADES,factionKits:shared.FACTION_KITS};
const vendor='<!-- '+read('vendor/THREE-LICENSE.txt').trim()+' -->\n<script id="bulk-three">'+read('vendor/three.min.js')+'</script>';
const campaign=versioned(read('campaign/shell.html')
 .replace('/*CAMPAIGN_STYLE*/',()=>read('campaign/style.css'))
 .replace('<!--THREE_LICENSE-->',()=>'<'+ '!-- '+read('vendor/THREE-LICENSE.txt').trim()+' -->')
 .replace('/*CAMPAIGN_APP*/',()=>read('campaign/game.js')));
const app="'use strict';\nwindow.BULK_RELEASE="+json(release)+';\nwindow.BULK_CLIENT_CONFIG='+json(bakedConfig)+';\nwindow.BULK_CAMPAIGN_DOCUMENT='+json(campaign)+';\n'+['minigames/bird-sim.js','minigames/bird-render.js','minigames/bird-game-3.js','minigames/cards-sim.js','minigames/cards-game.js','multiplayer/unified.js','multiplayer/render.js','multiplayer/client.js'].map(read).join('\n');
const output=versioned(read('multiplayer/client-shell.html'))
 .replace('/*CLIENT_STYLE*/',()=>['multiplayer/client.css','multiplayer/unified.css','minigames/bird-game-3.css','minigames/cards-game.css'].map(read).join('\n'))
 .replace('<!--THREE_BUNDLE-->',()=>vendor)
 .replace('/*CLIENT_APP*/',()=>app);
fs.writeFileSync(path.join(root,release.filename),output);
fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url='+release.filename+'"><title>Bulk Import v'+release.major+'</title></head><body style="background:#07121d;color:#dff5f5;font:18px Arial;padding:40px"><h1>Bulk Import: Wspólna Galaktyka</h1><p><a style="color:#80e9e2" href="'+release.filename+'">Otwórz grę v'+release.major+' — kampania solo i multiplayer</a></p></body></html>\n');
console.log('Built '+release.filename+' ('+Buffer.byteLength(output)+' bytes): standalone campaign + multiplayer + Bird Game 3 + Gwintforce');
