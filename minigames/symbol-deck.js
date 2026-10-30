'use strict';
// PG(2,5): 31 lines of six points; one private decoy per line makes seven symbols.
// A projective plane of order six does not exist, so a 43-card/7-symbol deck is impossible.
const DOUBLE_SYMBOL_DATA = [
  ['🍎', 'Jabłko'],
  ['🚀', 'Rakieta'],
  ['🐢', 'Żółw'],
  ['⭐', 'Gwiazda'],
  ['🌈', 'Tęcza'],
  ['🎸', 'Gitara'],
  ['⚽', 'Piłka'],
  ['🐱', 'Kot'],
  ['🌵', 'Kaktus'],
  ['🦋', 'Motyl'],
  ['🍕', 'Pizza'],
  ['☀️', 'Słońce'],
  ['💎', 'Diament'],
  ['🐙', 'Ośmiornica'],
  ['🚲', 'Rower'],
  ['🔑', 'Klucz'],
  ['🧲', 'Magnes'],
  ['🎈', 'Balon'],
  ['🍄', 'Grzyb'],
  ['⚓', 'Kotwica'],
  ['🎲', 'Kostka'],
  ['👑', 'Korona'],
  ['⏰', 'Budzik'],
  ['🌍', 'Ziemia'],
  ['🪁', 'Latawiec'],
  ['☂️', 'Parasol'],
  ['🦄', 'Jednorożec'],
  ['🥕', 'Marchew'],
  ['🐳', 'Wieloryb'],
  ['🧩', 'Puzzle'],
  ['🦉', 'Sowa'],
  ['📎', 'Spinacz'],
  ['📚', 'Książki'],
  ['🦀', 'Krab'],
  ['🍓', 'Truskawka'],
  ['🥁', 'Bęben'],
  ['🏆', 'Puchar'],
  ['🎁', 'Prezent'],
  ['🦊', 'Lis'],
  ['🌻', 'Słonecznik'],
  ['🐝', 'Pszczoła'],
  ['🧀', 'Ser'],
  ['🦕', 'Dinozaur'],
  ['🧁', 'Babeczka'],
  ['🎯', 'Tarcza'],
  ['🏠', 'Dom'],
  ['🎨', 'Paleta'],
  ['🦜', 'Papuga'],
  ['🚗', 'Samochód'],
  ['🍋', 'Cytryna'],
  ['🐟', 'Ryba'],
  ['🎬', 'Klaps filmowy'],
  ['📡', 'Antena'],
  ['🧪', 'Probówka'],
  ['🧤', 'Rękawiczki'],
  ['🔔', 'Dzwonek'],
  ['🕹️', 'Joystick'],
  ['🍉', 'Arbuz'],
  ['🧵', 'Nić'],
  ['🚁', 'Helikopter'],
  ['🦩', 'Flaming'],
  ['🛸', 'UFO'],
];
const DOUBLE_SYMBOLS = Object.freeze(
  DOUBLE_SYMBOL_DATA.map(([glyph, name], id) => Object.freeze({ id, glyph, name })),
);
function generateDoubleDeck() {
  const cards = [];
  const add = (symbols) =>
    cards.push(
      Object.freeze({ id: cards.length, symbols: Object.freeze([...symbols, 31 + cards.length]) }),
    );
  for (let slope = 0; slope < 5; slope++)
    for (let offset = 0; offset < 5; offset++)
      add([...Array.from({ length: 5 }, (_, x) => x * 5 + ((slope * x + offset) % 5)), 25 + slope]);
  for (let x = 0; x < 5; x++) add([...Array.from({ length: 5 }, (_, y) => x * 5 + y), 30]);
  add([25, 26, 27, 28, 29, 30]);
  return Object.freeze(cards);
}
const DOUBLE_DECK = generateDoubleDeck();
function commonDoubleSymbol(a, b) {
  return a.symbols.find((id) => b.symbols.includes(id));
}
function validateDoubleDeck(cards = DOUBLE_DECK) {
  if (cards.length !== 31 || new Set(cards.map((c) => c.id)).size !== 31) return false;
  for (let i = 0; i < cards.length; i++) {
    const a = cards[i];
    if (
      a.symbols.length !== 7 ||
      new Set(a.symbols).size !== 7 ||
      !a.symbols.every((id) => Number.isInteger(id) && id >= 0 && id < 62)
    )
      return false;
    for (let j = i + 1; j < cards.length; j++)
      if (a.symbols.filter((id) => cards[j].symbols.includes(id)).length !== 1) return false;
  }
  return true;
}
const BulkDoubleDeck = Object.freeze({
  DOUBLE_SYMBOLS,
  DOUBLE_DECK,
  generateDoubleDeck,
  commonDoubleSymbol,
  validateDoubleDeck,
});
if (typeof window !== 'undefined') window.BulkDoubleDeck = BulkDoubleDeck;
if (typeof module !== 'undefined') module.exports = BulkDoubleDeck;
