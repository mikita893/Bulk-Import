'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {LEVELS,SudokuGame,generateSudoku,solveSudoku,restoreSudoku,peers}=require('../minigames/sudoku-sim.js');
const known='530070000600195000098000060800060003400803001700020006060000280000419005000080079'.split('').map(Number);

test('Sudoku solver finds the unique known solution, rejects conflicts and detects ambiguous/limited grids',()=>{
  const solved=solveSudoku(known);assert.equal(solved.count,1);assert(!solved.limited);assert.equal(solved.solution.slice(0,9).join(''),'534678912');
  assert.equal(solveSudoku(solved.solution).count,1);
  const invalid=[...known];invalid[2]=5;assert.equal(solveSudoku(invalid).count,0);
  assert.equal(solveSudoku(Array(81).fill(0)).count,2);assert(solveSudoku(Array(81).fill(0),2,1).limited);
  for(const bad of [null,[],Array(81),Array(81).fill(10)])assert.equal(solveSudoku(bad).count,0);
});

test('60 generated boards are deterministic, bounded, varied and have exactly one solution',()=>{
  const fingerprints=new Set();
  for(const level of Object.keys(LEVELS))for(let seed=1;seed<=20;seed++){
    const a=generateSudoku(level,seed),b=generateSudoku(level,seed),solved=solveSudoku(a.puzzle),clues=a.puzzle.filter(Boolean).length;
    assert.deepEqual(a,b);assert.equal(solved.count,1);assert(!solved.limited);assert.deepEqual(solved.solution,a.solution);
    assert(clues>=LEVELS[level].clues&&clues<=48);assert(a.puzzle.every((n,i)=>!n||n===a.solution[i]));fingerprints.add(a.puzzle.join(''));
    for(let r=0;r<9;r++)assert.equal(new Set(a.solution.slice(r*9,r*9+9)).size,9);
    for(let c=0;c<9;c++)assert.equal(new Set(a.solution.filter((_,i)=>i%9===c)).size,9);
  }
  assert(fingerprints.size>55);
});

test('givens are immutable; entry, selection, wrong answers and duplicate conflicts use real Sudoku rules',()=>{
  const g=new SudokuGame('normal',7),given=g.puzzle.findIndex(Boolean),empty=g.puzzle.findIndex(n=>!n);
  assert(!g.setValue(given,0));assert(!g.toggleNote(given,1));assert.equal(g.values[given],g.puzzle[given]);
  for(const bad of [-1,81,NaN,'1'])assert(!g.select(bad));
  assert(!g.setValue(empty,10));assert(!g.setValue(empty,NaN));
  const duplicate=g.puzzle.findIndex((n,i)=>n&&peers(empty,i));assert(duplicate>=0);
  assert(g.setValue(empty,g.puzzle[duplicate]));assert(g.conflicts().has(empty));assert(g.conflicts().has(duplicate));assert(g.wrong().includes(empty));assert(!g.solved);
  g.setValue(empty,g.solution[empty]);assert(!g.conflicts().has(empty));assert(!g.wrong().length);
});

test('notes toggle only on empty cells; entering a peer removes matching candidates and undo restores them',()=>{
  const g=new SudokuGame('normal',13),a=g.puzzle.findIndex(n=>!n),b=g.puzzle.findIndex((n,i)=>!n&&peers(a,i)),digit=g.solution[a];
  assert(b>=0);assert(g.toggleNote(b,digit));assert(g.notes[b]&(1<<(digit-1)));
  g.setValue(a,digit);assert.equal(g.notes[b]&(1<<(digit-1)),0);g.undo();assert(g.notes[b]&(1<<(digit-1)));assert.equal(g.values[a],0);
  g.select(b);g.notesMode=true;g.enter(digit);assert.equal(g.notes[b],0);
  g.notesMode=false;g.enter(g.solution[b]);assert(!g.toggleNote(b,1));g.erase();assert.equal(g.values[b],0);
  for(let n=0;n<130;n++)g.toggleNote(b,1);assert.equal(g.history.length,100);
});

test('hints correct a chosen mistake, skip givens and count usage even after undo',()=>{
  const g=new SudokuGame('easy',5),empty=g.puzzle.findIndex(n=>!n),given=g.puzzle.findIndex(Boolean);
  g.select(empty);g.setValue(empty,g.solution[empty]%9+1);assert(g.hint());assert.equal(g.values[empty],g.solution[empty]);assert.equal(g.hints,1);
  g.undo();assert.notEqual(g.values[empty],g.solution[empty]);assert.equal(g.hints,1);
  g.select(given);assert(g.hint());assert.equal(g.values[given],g.puzzle[given]);assert.equal(g.hints,2);
});

test('normal input completes the board once; undo/erase can reopen it and completed saves restore',()=>{
  const g=new SudokuGame('hard',9),empty=g.puzzle.flatMap((n,i)=>!n?[i]:[]);
  empty.forEach((i,n)=>{g.setValue(i,g.solution[i]);assert.equal(g.solved,n===empty.length-1);});
  const restored=restoreSudoku(JSON.stringify(g.snapshot()));assert(restored.solved);assert.equal(restored.history.length,0);assert(!restored.hint());
  g.undo();assert(!g.solved);g.setValue(empty.at(-1),g.solution[empty.at(-1)]);assert(g.solved);
});

test('versioned Sudoku saves retain entries/notes/time without accepting corrupt givens, grids or counters',()=>{
  const g=new SudokuGame('normal',55),i=g.puzzle.findIndex(n=>!n);g.select(i);g.toggleNote(i,3);g.elapsed=76543;g.hints=2;g.notesMode=true;
  const raw=g.snapshot(),copy=restoreSudoku(JSON.stringify(raw));assert.deepEqual(copy.snapshot(),raw);
  assert.equal(raw.version,1);
  const given=raw.puzzle.findIndex(Boolean);
  for(const mutate of [r=>{r.version=2;},r=>{r.values[given]=0;},r=>{r.notes[given]=1;},r=>{r.puzzle=Array(81).fill(0);},r=>{r.selected=81;},r=>{r.elapsed=-1;},r=>{r.hints=Infinity;},r=>{r.level='constructor';},r=>{r.notes=Array(81);}]){
    const bad=structuredClone(raw);mutate(bad);assert.equal(restoreSudoku(bad),null);
  }
  assert.equal(restoreSudoku('bad JSON'),null);assert.equal(restoreSudoku(' '.repeat(20001)),null);
  g.setValue(i,g.solution[i]%9+1);assert.deepEqual(restoreSudoku(g.snapshot()).values,g.values,'A player mistake must remain editable after reload');
});
