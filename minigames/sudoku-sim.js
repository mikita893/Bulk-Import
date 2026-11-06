'use strict';
(() => {
  const LEVELS = Object.freeze({easy:{name:'Łatwe',clues:42},normal:{name:'Normalne',clues:35},hard:{name:'Trudne',clues:29}});
  const boxOf = i => Math.floor(i/27)*3 + Math.floor(i%9/3);
  const peers = (a,b) => a!==b && (Math.floor(a/9)===Math.floor(b/9) || a%9===b%9 || boxOf(a)===boxOf(b));
  const validCells = a => Array.isArray(a)&&a.length===81&&Array.from(a).every(n=>Number.isInteger(n)&&n>=0&&n<=9);
  const bitCount = n => {let count=0;while(n){n&=n-1;count++;}return count;};

  // Bounded MRV search: stop at two solutions to prove uniqueness without blocking the UI.
  function solveSudoku(cells, limit=2, budget=100000) {
    const result={count:0,solution:null,limited:false};
    if(!validCells(cells))return result;
    const grid=[...cells],rows=new Uint16Array(9),columns=new Uint16Array(9),boxes=new Uint16Array(9);
    for(let i=0;i<81;i++)if(grid[i]){
      const bit=1<<grid[i],r=Math.floor(i/9),c=i%9,b=boxOf(i);
      if((rows[r]|columns[c]|boxes[b])&bit)return result;
      rows[r]|=bit;columns[c]|=bit;boxes[b]|=bit;
    }
    let visits=0;
    function search(){
      if(++visits>budget){result.limited=true;return;}
      let best=-1,mask=0,size=10;
      for(let i=0;i<81;i++)if(!grid[i]){
        const candidates=1022&~(rows[Math.floor(i/9)]|columns[i%9]|boxes[boxOf(i)]),count=bitCount(candidates);
        if(!count)return;
        if(count<size){best=i;mask=candidates;size=count;if(count===1)break;}
      }
      if(best<0){result.count++;result.solution??=[...grid];return;}
      const r=Math.floor(best/9),c=best%9,b=boxOf(best);
      for(let n=1;n<=9;n++)if(mask&(1<<n)){
        const bit=1<<n;grid[best]=n;rows[r]|=bit;columns[c]|=bit;boxes[b]|=bit;
        search();grid[best]=0;rows[r]&=~bit;columns[c]&=~bit;boxes[b]&=~bit;
        if(result.count>=limit||result.limited)return;
      }
    }
    search();return result;
  }

  function generateSudoku(level='normal',seed=Date.now()) {
    level=Object.hasOwn(LEVELS,level)?level:'normal';
    let state=seed>>>0||1;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const shuffle=list=>{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    const groups=()=>shuffle([0,1,2]).flatMap(b=>shuffle([0,1,2]).map(n=>b*3+n));
    const rows=groups(),columns=groups(),numbers=shuffle([1,2,3,4,5,6,7,8,9]);
    const solution=Array.from({length:81},(_,i)=>numbers[(rows[Math.floor(i/9)]*3+Math.floor(rows[Math.floor(i/9)]/3)+columns[i%9])%9]);
    const puzzle=[...solution];let clues=81;
    for(const i of shuffle(Array.from({length:81},(_,i)=>i))){
      if(clues<=LEVELS[level].clues)break;
      const old=puzzle[i];puzzle[i]=0;
      const check=solveSudoku(puzzle,2,15000);
      if(check.count===1&&!check.limited)clues--;else puzzle[i]=old;
    }
    return {level,puzzle,solution};
  }

  class SudokuGame {
    constructor(level='normal',seed=Date.now(),generated=null){
      const data=generated||generateSudoku(level,seed);
      this.level=data.level;this.puzzle=[...data.puzzle];this.solution=[...data.solution];this.values=[...data.puzzle];
      this.notes=Array(81).fill(0);this.selected=this.puzzle.findIndex(n=>!n);if(this.selected<0)this.selected=0;
      this.notesMode=false;this.elapsed=0;this.hints=0;this.history=[];
    }
    get solved(){return this.values.every((n,i)=>n===this.solution[i]);}
    get filled(){return this.values.filter(Boolean).length;}
    select(i){if(!Number.isInteger(i)||i<0||i>=81)return false;this.selected=i;return true;}
    record(){this.history.push({values:[...this.values],notes:[...this.notes],selected:this.selected});if(this.history.length>100)this.history.shift();}
    setValue(i,n){
      if(!Number.isInteger(i)||i<0||i>=81||this.puzzle[i]||!Number.isInteger(n)||n<0||n>9)return false;
      if(this.values[i]===n&&this.notes[i]===0)return false;
      this.record();this.values[i]=n;this.notes[i]=0;
      if(n)for(let j=0;j<81;j++)if(peers(i,j))this.notes[j]&=~(1<<(n-1));
      return true;
    }
    toggleNote(i,n){
      if(!Number.isInteger(i)||i<0||i>=81||this.puzzle[i]||this.values[i]||!Number.isInteger(n)||n<1||n>9)return false;
      this.record();this.notes[i]^=1<<(n-1);return true;
    }
    enter(n){return this.notesMode?this.toggleNote(this.selected,n):this.setValue(this.selected,n);}
    erase(){return this.setValue(this.selected,0);}
    undo(){const old=this.history.pop();if(!old)return false;Object.assign(this,old);return true;}
    hint(){
      let i=this.selected;
      if(this.puzzle[i]||this.values[i]===this.solution[i])i=this.values.findIndex((n,j)=>!this.puzzle[j]&&n!==this.solution[j]);
      if(i<0)return false;
      this.select(i);this.setValue(i,this.solution[i]);this.hints++;return true;
    }
    conflicts(){
      const out=new Set();for(let i=0;i<81;i++)if(this.values[i])for(let j=i+1;j<81;j++)if(this.values[j]===this.values[i]&&peers(i,j)){out.add(i);out.add(j);}return out;
    }
    wrong(){return this.values.flatMap((n,i)=>n&&n!==this.solution[i]?[i]:[]);}
    snapshot(){return {version:1,level:this.level,puzzle:[...this.puzzle],values:[...this.values],notes:[...this.notes],selected:this.selected,notesMode:this.notesMode,elapsed:Math.round(this.elapsed),hints:this.hints};}
  }

  function restoreSudoku(raw){
    try{
      if(typeof raw==='string'){if(raw.length>20000)return null;raw=JSON.parse(raw);}
      if(!raw||raw.version!==1||!Object.hasOwn(LEVELS,raw.level)||!validCells(raw.puzzle)||!validCells(raw.values)||raw.puzzle.filter(Boolean).length<17)return null;
      if(!Array.isArray(raw.notes)||raw.notes.length!==81||!Array.from(raw.notes).every(n=>Number.isInteger(n)&&n>=0&&n<=511))return null;
      if(!Number.isInteger(raw.selected)||raw.selected<0||raw.selected>=81||typeof raw.notesMode!=='boolean'||!Number.isSafeInteger(raw.elapsed)||raw.elapsed<0||raw.elapsed>31536000000||!Number.isSafeInteger(raw.hints)||raw.hints<0||raw.hints>1000000)return null;
      if(raw.puzzle.some((n,i)=>n&&raw.values[i]!==n)||raw.notes.some((n,i)=>n&&raw.values[i]))return null;
      const solved=solveSudoku(raw.puzzle);if(solved.count!==1||solved.limited)return null;
      const game=new SudokuGame(raw.level,1,{level:raw.level,puzzle:raw.puzzle,solution:solved.solution});
      Object.assign(game,{values:[...raw.values],notes:[...raw.notes],selected:raw.selected,notesMode:raw.notesMode,elapsed:raw.elapsed,hints:raw.hints});return game;
    }catch{return null;}
  }
  const api=Object.freeze({LEVELS,SudokuGame,generateSudoku,solveSudoku,restoreSudoku,peers});
  if(typeof window!=='undefined')window.BulkSudoku=api;
  if(typeof module!=='undefined')module.exports=api;
})();
