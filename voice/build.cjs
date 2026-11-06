'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {catalogue,profileVersion}=require('./catalog.cjs');
module.exports=function buildVoicePack(){
 const root=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 if(manifest.schema!==1||manifest.profileVersion!==profileVersion)throw Error('Dubbing: regenerate the voice manifest');
 const recorded=new Map(manifest.clips.map(c=>[c.id,c]));
 return catalogue().map(row=>{
  const clip=recorded.get(row.id);if(!clip||clip.text!==row.text||clip.speaker!==row.speaker||!Number.isFinite(clip.duration)||clip.duration<=0||clip.duration>90||clip.file!=='clips/'+row.id+'.mp3')throw Error('Dubbing: missing or invalid recording '+row.id);
  const data=fs.readFileSync(path.join(root,clip.file));if(crypto.createHash('sha256').update(data).digest('hex')!==clip.sha256)throw Error('Dubbing: damaged recording '+row.id);
  return {...row,duration:clip.duration,data:data.toString('base64')};
 });
};
