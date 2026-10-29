'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../minigames/cards-sim.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){const s=R.newCardMatch(R.CARD_STARTER,'vael',123);s.hands.player=[];s.hands.ai=[];s.decks.player=[];s.decks.ai=[];return s;}
function unit(s,card,owner='player'){return {uid:++s.nextId,card,owner};}
function play(s,id,options={}){s.turn='player';const u=unit(s,id);s.hands.player.push(u);assert(R.applyCardMove(s,'player',{type:'play',uid:u.uid,row:R.CARD_CATALOG[id].row==='special'?null:R.CARD_CATALOG[id].row,...options}));return u;}
test('starter is free and legal; collections and decks reject corrupt or unowned cards',()=>{
 const c=R.createCardCollection();assert(R.validCardCollection(c));assert.equal(c.deck.length,20);assert.equal(c.owned.length,20);
 assert(!R.validCardDeck([...c.deck,c.deck[0]],c.owned));assert(!R.validCardDeck(c.deck.slice(0,10),c.owned));assert(!R.validCardDeck([...c.deck,'sf-hero'],c.owned));
 for(const mutate of [x=>x.owned.push('toString'),x=>x.owned.pop(),x=>x.deck.push('sf-hero'),x=>x.wins.vael=-1,x=>x.claimed.push('vael')]){const bad=clone(c);mutate(bad);assert(!R.validCardCollection(bad));}
 assert.deepEqual(R.normalizeCardCollection(undefined),c);
});
test('deal is seeded, keeps opponent cards hidden in the UI contract, and rejects illegal turns/targets',()=>{
 const s=R.newCardMatch(R.CARD_STARTER,'syra',44);assert.deepEqual(s,R.newCardMatch(R.CARD_STARTER,'syra',44));assert.equal(s.hands.player.length,10);assert.equal(s.hands.ai.length,10);
 const before=clone(s);assert(!R.applyCardMove(s,'ai',{type:'pass'}));assert(!R.applyCardMove(s,'player',{uid:-1}));assert(!R.applyCardMove(s,'player',null));assert.deepEqual(s,before);
 const action=R.cardActions(s,'player')[0];assert(!R.applyCardMove(s,'player',{...action,row:'unknown'}));assert(R.applyCardMove(s,'player',action));assert.equal(s.turn,'ai');
});
test('bonds, morale, horn and weather combine while heroes keep fixed strength',()=>{
 const s=fixture();play(s,'sf-bulk1');play(s,'sf-bulk2');assert.equal(R.cardRowScore(s,'player','siege'),20);
 play(s,'n-horn',{row:'siege'});assert.equal(R.cardRowScore(s,'player','siege'),40);
 play(s,'n-rain');assert.equal(R.cardRowScore(s,'player','siege'),8);
 play(s,'n-clear');assert.equal(R.cardRowScore(s,'player','siege'),40);
 play(s,'sf-admin');play(s,'sf-validator');play(s,'sf-hero');assert.equal(R.cardRowScore(s,'player','front'),22);
 play(s,'n-frost');assert.equal(R.cardRowScore(s,'player','front'),15);
});
test('spy draws two, decoy returns a unit, backup restores a discarded unit with its ability',()=>{
 const s=fixture();s.decks.player=[unit(s,'sf-guard'),unit(s,'sf-courier')];const spy=play(s,'sf-spy');assert.equal(s.board.ai.front[0].uid,spy.uid);assert.equal(s.hands.player.length,2);
 const admin=play(s,'sf-admin');play(s,'n-decoy',{row:'front',target:admin.uid});assert(s.hands.player.some(u=>u.uid===admin.uid));assert.equal(s.board.player.front.length,0);
 const retired=unit(s,'sf-bulk1');s.discard.player.push(retired);play(s,'sf-medic',{target:retired.uid});assert(s.board.player.siege.some(u=>u.uid===retired.uid));assert(!s.discard.player.some(u=>u.uid===retired.uid));
});
test('DELETE removes all tied strongest ordinary units on both sides without touching heroes',()=>{
 const s=fixture();s.board.player.front=[unit(s,'sf-guard'),unit(s,'sf-hero')];s.board.ai.range=[unit(s,'sf-dev','ai')];play(s,'n-scorch');assert.deepEqual(s.board.player.front.map(u=>u.card),['sf-hero']);assert.equal(s.board.ai.range.length,0);assert(s.discard.ai.some(u=>u.card==='sf-dev'));
});
test('pass lasts the whole round, hand persists, two cards draw, and a second win ends the match',()=>{
 const s=R.newCardMatch(R.CARD_STARTER,'vael',5);s.board.player.front.push(s.hands.player.splice(s.hands.player.findIndex(u=>R.CARD_CATALOG[u.card].row!=='special'),1)[0]);
 assert(R.applyCardMove(s,'player',{type:'pass'}));const count=s.hands.player.length;
 assert(!R.applyCardMove(s,'player',{type:'pass'}));assert(R.applyCardMove(s,'ai',{type:'pass'}));assert.equal(s.phase,'round-end');assert.equal(s.wins.player,1);assert.equal(s.wins.ai,0);
 assert(R.nextCardRound(s));assert.equal(s.hands.player.length,count+2);assert.equal(s.turn,'ai');assert(s.discard.player.length>0);
 R.applyCardMove(s,'ai',{type:'pass'});play(s,'sf-hero');R.applyCardMove(s,'player',{type:'pass'});assert.equal(s.phase,'finished');assert.equal(s.winner,'player');assert(!R.nextCardRound(s));
});
test('both sides earn a round point on ties, including a tied match',()=>{
 const s=fixture();for(let i=0;i<2;i++){s.turn='player';R.applyCardMove(s,'player',{type:'pass'});R.applyCardMove(s,'ai',{type:'pass'});if(!i)R.nextCardRound(s);}assert.equal(s.phase,'finished');assert.equal(s.winner,'draw');
});
test('AI completes 60 seeded matches with legal moves and conserves all 40 card instances',()=>{
 for(const opponent of Object.keys(R.CARD_OPPONENTS))for(let seed=1;seed<=20;seed++){
  const s=R.newCardMatch(R.CARD_STARTER,opponent,seed);let steps=0;
  while(s.phase!=='finished'&&steps++<200){
   if(s.phase==='round-end'){assert(R.nextCardRound(s));continue;}
   let action;if(s.turn==='ai')action=R.chooseCardAI(s);else{const moves=R.cardActions(s,'player');action=moves[seed%moves.length]||{type:'pass'};if(R.cardScore(s,'player')>R.cardScore(s,'ai')&&s.passed.ai)action={type:'pass'};}
   assert(R.applyCardMove(s,s.turn,action));
   const all=['player','ai'].flatMap(side=>[...s.hands[side],...s.decks[side],...s.discard[side],...R.CARD_ROWS.flatMap(row=>s.board[side][row])]);assert.equal(all.length,40);assert.equal(new Set(all.map(u=>u.uid)).size,40);
  }
  assert.equal(s.phase,'finished',opponent+' seed '+seed);assert(s.round<=3);
 }
});
