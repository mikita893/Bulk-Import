'use strict';
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BulkEffects=api;})(typeof window!=='undefined'?window:globalThis,function(){
 class Effects{
  constructor({enabled=()=>true,duck=()=>false,contextFactory=()=>new(window.AudioContext||window.webkitAudioContext)()}={}){this.enabled=enabled;this.duck=duck;this.contextFactory=contextFactory;this.context=null;this.active=new Set();this.counts={};this.dead=false;}
  ready(){if(this.dead||!this.enabled()||this.active.size>=32)return false;try{this.context??=this.contextFactory();this.context.resume().catch(()=>{});return true;}catch(e){return false;}}
  node(source,frequency,volume,duration,delay=0,endFrequency){
   if(!this.ready())return;const c=this.context,t=c.currentTime+delay,g=c.createGain(),o=source==='noise'?c.createBufferSource():c.createOscillator();
   if(source==='noise'){if(!this.noise){this.noise=c.createBuffer(1,c.sampleRate*.25,c.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}o.buffer=this.noise;}else{o.type=source;o.frequency.setValueAtTime(frequency,t);if(endFrequency)o.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);}
   g.gain.setValueAtTime(volume*(this.duck()?.25:1),t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(c.destination);this.active.add(o);o.onended=()=>{this.active.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration);
  }
  play(name){
   if(!this.ready())return false;this.counts[name]=(this.counts[name]||0)+1;
   if(name==='shot'){this.node('noise',0,.035,.065);this.node('triangle',190,.085,.1,0,40);this.node('sine',1600,.018,.075,.025,750);}
   else if(name==='slash'){this.node('noise',0,.028,.13);this.node('triangle',620,.025,.12,0,120);}
   else if(name==='greatsword'){this.node('noise',0,.05,.2);this.node('triangle',140,.07,.23,0,35);}
   else if(name==='parry'){this.node('triangle',1700,.055,.22,0,650);this.node('sine',2400,.035,.27,.03,900);this.node('noise',0,.025,.06);}
   else if(name==='critical'){this.node('noise',0,.065,.18);this.node('triangle',180,.085,.28,0,35);this.node('sine',650,.03,.24,.1,160);}
   else if(name==='door'){this.node('noise',0,.025,.08);this.node('triangle',150,.045,.1,0,50);}
   else if(name==='rotor'){this.node('sawtooth',85,.022,.35,0,65);this.node('noise',0,.012,.22);}
   else if(name==='payload'){this.node('triangle',780,.025,.2,0,140);this.node('noise',0,.025,.15);}
   else if(name==='horn'){this.node('sawtooth',220,.018,.25);this.node('sawtooth',277,.015,.25);}
   else if(name==='siren'){this.node('triangle',600,.018,.32,0,1050);this.node('triangle',1050,.018,.32,.32,600);}
   else if(name==='alert'){this.node('square',880,.012,.07);this.node('sine',1320,.018,.09,.13);}
   else if(name==='enemyShot'){this.node('sawtooth',360,.02,.09,0,90);this.node('noise',0,.015,.06);}
   else if(name==='upgrade'){[520,780,1040,1560].forEach((f,i)=>this.node('sine',f,.05,.17,i*.075));this.node('noise',0,.013,.18);}
   else if(name==='click'){this.node('sine',850,.025,.025,0,450);}
   else if(name==='hit'){this.node('noise',0,.055,.13);this.node('triangle',100,.08,.16,0,30);}
   else if(name==='shield'){this.node('sine',1100,.04,.16,0,180);this.node('triangle',220,.025,.18);}
   else if(name==='kill'){this.node('noise',0,.035,.14);this.node('sine',650,.035,.1,0,130);}
   else if(name==='dash'){this.node('noise',0,.025,.17);this.node('sine',240,.03,.16,0,1200);}
   else if(name==='heal'||name==='powerup'){[440,660,880].forEach((f,i)=>this.node('sine',f,.04,.19,i*.055));}
   else if(name==='coin'){this.node('sine',1350,.025,.075);this.node('sine',1800,.02,.1,.03);}
   else if(name==='jump'){this.node('triangle',230,.025,.1,0,570);}
   else if(name==='slide'){this.node('noise',0,.023,.2);}
   return true;
  }
  stop(){for(const node of this.active){try{node.stop();}catch(e){}}this.active.clear();}
  destroy(){if(this.dead)return;this.stop();this.dead=true;this.context?.close();this.noise=null;}
 }
 return {Effects};
});
