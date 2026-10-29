'use strict';

// Local, deterministic card rules. The UI and campaign economy use this same catalog.
const CARD_ROWS = ['front', 'range', 'siege'];
const CARD_ROW_NAMES = {
  front: 'Szturm administratorów',
  range: 'Automatyzacje',
  siege: 'Ciężki import',
};
const CARD_LIST = [
  ['sf-admin', 'Administrator Junior', 4, 'front', '', 0, '☁'],
  ['sf-courier', 'Kurier CSV', 4, 'range', '', 0, '↗'],
  ['sf-guard', 'Strażnik Sandboxa', 5, 'front', '', 0, '◇'],
  ['sf-bulk1', 'Data Loader / Batch A', 5, 'siege', 'bond', 0, '▥', 'bulk'],
  ['sf-bulk2', 'Data Loader / Batch B', 5, 'siege', 'bond', 0, '▥', 'bulk'],
  ['sf-flow1', 'Flow / Before Save', 4, 'range', 'bond', 0, '⌁', 'flow'],
  ['sf-flow2', 'Flow / After Save', 4, 'range', 'bond', 0, '⌁', 'flow'],
  ['sf-permission', 'Permission Set', 6, 'front', '', 0, '⬡'],
  ['sf-validator', 'Validation Rule', 5, 'front', 'morale', 0, '✓'],
  ['sf-dev', 'Apex Developer', 5, 'range', '', 0, '{ }'],
  ['sf-architect', 'Architekt Rozwiązań', 6, 'siege', '', 0, '⌘'],
  ['sf-medic', 'Backup Administrator', 3, 'range', 'medic', 0, '✚'],
  ['sf-spy', 'Konsultant na godzinę', 4, 'front', 'spy', 0, '◉'],
  ['sf-dashboard', 'Dashboard Dowódcy', 5, 'siege', '', 0, '▧'],
  ['sf-backup', 'Archiwum Metadata', 5, 'range', '', 0, '▣'],
  ['sf-tester', 'QA na produkcji', 3, 'front', 'morale', 0, '⚑'],
  ['n-frost', 'Freeze wdrożeniowy', 0, 'special', 'frost', 0, '❄'],
  ['n-horn', 'Dreamforce Keynote', 0, 'special', 'horn', 0, '♪'],
  ['n-clear', 'Refresh Sandboxa', 0, 'special', 'clear', 0, '☀'],
  ['n-decoy', 'Podmiana rekordu', 0, 'special', 'decoy', 0, '↔'],
  ['sf-bulk3', 'Data Loader / Batch C', 5, 'siege', 'bond', 160, '▥', 'bulk'],
  ['sf-senior', 'Senior po certyfikacji', 8, 'range', '', 220, '★'],
  ['sf-sentinel', 'Sentinel Security', 7, 'front', '', 180, '⬡'],
  ['sf-restore', 'Disaster Recovery', 5, 'siege', 'medic', 280, '✚'],
  ['sf-hero', 'Komandor External ID', 12, 'front', 'hero', 650, '✦'],
  ['sf-master', 'Master of Metadata', 10, 'range', 'hero', 520, '✧'],
  ['n-scorch', 'DELETE bez WHERE', 0, 'special', 'scorch', 320, '⚠'],
  ['n-fog', 'Mgła dokumentacji', 0, 'special', 'fog', 120, '≋'],
  ['n-rain', 'Deszcz błędów CSV', 0, 'special', 'rain', 120, '☂'],
  ['n-horn2', 'All Hands Meeting', 0, 'special', 'horn', 240, '♫'],
  ['prize-vael', 'Vael / Ostatni Archiwista', 11, 'siege', 'hero', 0, '✦'],
  ['prize-syra', 'Syra / Inżynierka Flow', 7, 'range', 'morale', 0, '⚙'],
  ['prize-excel', 'Marc / Złoty Deployment', 12, 'range', 'hero', 0, '✦'],
  ['xl-cell', 'Komórka A1', 4, 'front', '', 0, 'A1'],
  ['xl-row', 'Wiersz 1048576', 5, 'front', '', 0, '#'],
  ['xl-vlookup', 'VLOOKUP z 2007', 6, 'range', '', 0, 'V'],
  ['xl-pivot1', 'Tabela przestawna A', 5, 'siege', 'bond', 0, '▦', 'pivot'],
  ['xl-pivot2', 'Tabela przestawna B', 5, 'siege', 'bond', 0, '▦', 'pivot'],
  ['xl-macro', 'Makro bez podpisu', 7, 'range', '', 0, 'M'],
  ['xl-copy', 'Ctrl+C / bojowy klon', 4, 'front', '', 0, 'C'],
  ['xl-paste', 'Ctrl+V / zły separator', 4, 'front', 'morale', 0, 'V'],
  ['xl-spy', 'Załącznik od klienta', 4, 'range', 'spy', 0, '✉'],
  ['xl-repair', 'Ctrl+Z', 3, 'range', 'medic', 0, '↶'],
  ['xl-chart', 'Wykres kołowy', 5, 'siege', '', 0, '◔'],
  ['xl-formula', 'Formuła zagnieżdżona', 6, 'range', '', 0, 'ƒ'],
  ['xl-filter', 'Autofiltr', 3, 'front', 'morale', 0, '▽'],
  ['xl-budget', 'budzet_FINAL.xlsx', 6, 'siege', '', 0, '$'],
  ['xl-error', 'Batalion #REF!', 5, 'front', '', 0, '!'],
  ['xl-hero', 'Excel / Pan Arkusza', 11, 'siege', 'hero', 0, 'X'],
];
const CARD_CATALOG = Object.freeze(
  Object.fromEntries(
    CARD_LIST.map(([id, name, power, row, ability, price, icon, bond]) => [
      id,
      Object.freeze({
        id,
        name,
        power,
        row,
        ability,
        price,
        icon,
        bond: bond || null,
        faction: id.startsWith('xl-') ? 'excel' : id.startsWith('n-') ? 'neutral' : 'salesforce',
      }),
    ]),
  ),
);
const CARD_STARTER = CARD_LIST.slice(0, 20).map((c) => c[0]);
const CARD_OWNABLE = CARD_LIST.filter((c) => !c[0].startsWith('xl-')).map((c) => c[0]);
const CARD_OPPONENTS = Object.freeze({
  vael: {
    id: 'vael',
    name: 'Vael',
    title: 'Proteański archiwista',
    prize: 'prize-vael',
    quote: 'Nasza cywilizacja upadła przez zły mulligan.',
    level: 1,
  },
  syra: {
    id: 'syra',
    name: 'Syra',
    title: 'Inżynierka automatyzacji',
    prize: 'prize-syra',
    quote: 'To nie magia. To dobrze złożony Flow.',
    level: 2,
  },
  excel: {
    id: 'excel',
    name: 'ExcelBot',
    title: 'Symulator złośliwego arkusza',
    prize: 'prize-excel',
    quote: 'Przecież w moim arkuszu te punkty się zgadzają.',
    level: 3,
  },
});
const CARD_ABILITY_TEXT = Object.freeze({
  bond: 'Więź: moc mnoży się przez liczbę kart tej samej grupy w rzędzie.',
  morale: 'Morale: +1 dla innych zwykłych jednostek w tym rzędzie.',
  medic: 'Backup: przywróć zwykłą jednostkę z własnego stosu odrzuconych (bez medyków).',
  spy: 'Szpieg: trafia do przeciwnika, ale dobierasz dwie karty.',
  hero: 'Bohater: ignoruje pogodę, premie i DELETE.',
  horn: 'Keynote: podwaja zwykłe jednostki w wybranym własnym rzędzie.',
  frost: 'Freeze: zwykłe jednostki szturmu po obu stronach mają bazową moc 1.',
  fog: 'Mgła: zwykłe jednostki automatyzacji po obu stronach mają bazową moc 1.',
  rain: 'Deszcz: zwykłe jednostki ciężkiego importu po obu stronach mają bazową moc 1.',
  clear: 'Usuwa wszystkie efekty pogody, także korzystne dla przeciwnika.',
  scorch: 'Niszczy wszystkie najsilniejsze zwykłe jednostki po obu stronach.',
  decoy: 'Podmienia własną zwykłą jednostkę na tę kartę i zabiera ją z powrotem do ręki.',
});

function validCardDeck(deck, owned = CARD_OWNABLE) {
  return (
    Array.isArray(deck) &&
    deck.length >= 16 &&
    deck.length <= 24 &&
    new Set(deck).size === deck.length &&
    deck.every((id) => owned.includes(id) && Object.hasOwn(CARD_CATALOG, id)) &&
    deck.filter((id) => CARD_CATALOG[id].row !== 'special').length >= 12
  );
}
function createCardCollection() {
  return {
    version: 1,
    owned: [...CARD_STARTER],
    deck: [...CARD_STARTER],
    wins: { vael: 0, syra: 0, excel: 0 },
    claimed: [],
  };
}
function validCardCollection(c) {
  return (
    !!c &&
    c.version === 1 &&
    Array.isArray(c.owned) &&
    c.owned.length <= CARD_OWNABLE.length &&
    new Set(c.owned).size === c.owned.length &&
    c.owned.every((id) => CARD_OWNABLE.includes(id)) &&
    CARD_STARTER.every((id) => c.owned.includes(id)) &&
    validCardDeck(c.deck, c.owned) &&
    c.wins &&
    Object.keys(CARD_OPPONENTS).every(
      (id) => Number.isSafeInteger(c.wins[id]) && c.wins[id] >= 0 && c.wins[id] < 1000000,
    ) &&
    Array.isArray(c.claimed) &&
    c.claimed.length <= 3 &&
    new Set(c.claimed).size === c.claimed.length &&
    c.claimed.every(
      (id) => Object.hasOwn(CARD_OPPONENTS, id) && c.owned.includes(CARD_OPPONENTS[id].prize),
    )
  );
}
function normalizeCardCollection(c) {
  return validCardCollection(c) ? JSON.parse(JSON.stringify(c)) : createCardCollection();
}
const cardOther = (side) => (side === 'player' ? 'ai' : 'player');
function cardRandom(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function shuffleCards(s, array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(cardRandom(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function drawCards(s, side, n) {
  for (let i = 0; i < n && s.decks[side].length; i++) s.hands[side].push(s.decks[side].shift());
}
function cardLog(s, text) {
  s.log.push(text);
  if (s.log.length > 14) s.log.shift();
}
function newCardMatch(deck, opponent = 'vael', seed = 1) {
  if (!validCardDeck(deck) || !Object.hasOwn(CARD_OPPONENTS, opponent))
    throw Error('Niepoprawna talia lub przeciwnik.');
  const s = {
    seed: seed >>> 0 || 1,
    nextId: 0,
    opponent,
    round: 1,
    phase: 'playing',
    turn: 'player',
    winner: null,
    wins: { player: 0, ai: 0 },
    passed: { player: false, ai: false },
    board: { player: { front: [], range: [], siege: [] }, ai: { front: [], range: [], siege: [] } },
    weather: { front: false, range: false, siege: false },
    horn: {
      player: { front: false, range: false, siege: false },
      ai: { front: false, range: false, siege: false },
    },
    decks: { player: [], ai: [] },
    hands: { player: [], ai: [] },
    discard: { player: [], ai: [] },
    history: [],
    log: [],
  };
  let rival = [
    ...CARD_LIST.filter((c) => c[0].startsWith('xl-')).map((c) => c[0]),
    'n-frost',
    'n-horn',
    'n-clear',
    'n-decoy',
  ];
  if (opponent === 'syra') rival = rival.filter((id) => id !== 'xl-copy').concat('n-rain');
  if (opponent === 'excel') rival = rival.filter((id) => id !== 'xl-cell').concat('n-scorch');
  for (const side of ['player', 'ai'])
    s.decks[side] = shuffleCards(s, side === 'player' ? deck : rival).map((card) => ({
      uid: ++s.nextId,
      card,
      owner: side,
    }));
  drawCards(s, 'player', 10);
  drawCards(s, 'ai', 10);
  cardLog(s, 'Runda 1. Zagraj kartę i wskaż podświetlony rząd. Możesz spasować.');
  return s;
}
function cardUnitPower(s, side, row, unit) {
  const c = CARD_CATALOG[unit.card];
  if (c.ability === 'hero') return c.power;
  let value = s.weather[row] ? 1 : c.power;
  if (c.ability === 'bond')
    value *= s.board[side][row].filter((u) => CARD_CATALOG[u.card].bond === c.bond).length;
  value += s.board[side][row].filter(
    (u) => u.uid !== unit.uid && CARD_CATALOG[u.card].ability === 'morale',
  ).length;
  return value * (s.horn[side][row] ? 2 : 1);
}
function cardRowScore(s, side, row) {
  return s.board[side][row].reduce((n, u) => n + cardUnitPower(s, side, row, u), 0);
}
function cardScore(s, side) {
  return CARD_ROWS.reduce((n, row) => n + cardRowScore(s, side, row), 0);
}
function cardActions(s, side) {
  if (s.phase !== 'playing' || s.turn !== side || s.passed[side]) return [];
  const out = [];
  for (const instance of s.hands[side]) {
    const c = CARD_CATALOG[instance.card],
      base = { type: 'play', uid: instance.uid };
    if (c.ability === 'horn') {
      for (const row of CARD_ROWS) if (!s.horn[side][row]) out.push({ ...base, row });
    } else if (c.ability === 'decoy') {
      for (const row of CARD_ROWS)
        for (const u of s.board[side][row])
          if (CARD_CATALOG[u.card].ability !== 'hero') out.push({ ...base, row, target: u.uid });
    } else if (c.ability === 'medic') {
      const targets = s.discard[side].filter(
        (u) =>
          CARD_CATALOG[u.card].row !== 'special' &&
          !['hero', 'medic'].includes(CARD_CATALOG[u.card].ability),
      );
      if (targets.length) for (const u of targets) out.push({ ...base, row: c.row, target: u.uid });
      else out.push({ ...base, row: c.row });
    } else out.push({ ...base, row: c.row === 'special' ? null : c.row });
  }
  return out;
}
function deployCardUnit(s, side, instance) {
  const c = CARD_CATALOG[instance.card],
    destination = c.ability === 'spy' ? cardOther(side) : side;
  s.board[destination][c.row].push(instance);
  if (c.ability === 'spy') drawCards(s, side, 2);
}
function applyCardMove(s, side, action) {
  if (s.phase !== 'playing' || s.turn !== side || s.passed[side]) return false;
  if (action?.type === 'pass') {
    s.passed[side] = true;
    cardLog(s, (side === 'player' ? 'Ty' : 'Przeciwnik') + ' pasuje.');
    advanceCardTurn(s, side);
    return true;
  }
  const legal = cardActions(s, side).find(
    (a) =>
      a.uid === action?.uid &&
      a.row === (action.row ?? null) &&
      a.target === (action.target ?? undefined),
  );
  if (!legal) return false;
  const index = s.hands[side].findIndex((u) => u.uid === legal.uid),
    instance = s.hands[side].splice(index, 1)[0],
    c = CARD_CATALOG[instance.card];
  cardLog(s, (side === 'player' ? 'Ty: ' : 'Przeciwnik: ') + c.name + '.');
  if (c.row !== 'special') {
    deployCardUnit(s, side, instance);
    if (c.ability === 'medic' && legal.target !== undefined) {
      const i = s.discard[side].findIndex((u) => u.uid === legal.target);
      deployCardUnit(s, side, s.discard[side].splice(i, 1)[0]);
    }
  } else {
    s.discard[instance.owner].push(instance);
    if (c.ability === 'horn') s.horn[side][legal.row] = true;
    if (['frost', 'fog', 'rain'].includes(c.ability))
      s.weather[{ frost: 'front', fog: 'range', rain: 'siege' }[c.ability]] = true;
    if (c.ability === 'clear') for (const row of CARD_ROWS) s.weather[row] = false;
    if (c.ability === 'decoy') {
      const i = s.board[side][legal.row].findIndex((u) => u.uid === legal.target);
      s.hands[side].push(s.board[side][legal.row].splice(i, 1)[0]);
    }
    if (c.ability === 'scorch') {
      let strongest = 0;
      for (const team of ['player', 'ai'])
        for (const row of CARD_ROWS)
          for (const u of s.board[team][row])
            if (CARD_CATALOG[u.card].ability !== 'hero')
              strongest = Math.max(strongest, cardUnitPower(s, team, row, u));
      const victims = [];
      for (const team of ['player', 'ai'])
        for (const row of CARD_ROWS)
          for (const u of s.board[team][row])
            if (
              CARD_CATALOG[u.card].ability !== 'hero' &&
              cardUnitPower(s, team, row, u) === strongest
            )
              victims.push({ team, row, u });
      for (const { team, row, u } of victims) {
        s.board[team][row] = s.board[team][row].filter((v) => v.uid !== u.uid);
        s.discard[u.owner].push(u);
      }
    }
  }
  advanceCardTurn(s, side);
  return true;
}
function advanceCardTurn(s, side) {
  if (s.passed.player && s.passed.ai) {
    const player = cardScore(s, 'player'),
      ai = cardScore(s, 'ai');
    if (player >= ai) s.wins.player++;
    if (ai >= player) s.wins.ai++;
    s.history.push({ round: s.round, player, ai });
    cardLog(
      s,
      'Runda ' +
        s.round +
        ': ' +
        player +
        ' : ' +
        ai +
        (player === ai ? ' — remis, punkt dla obu stron.' : '.'),
    );
    if (s.wins.player >= 2 || s.wins.ai >= 2 || s.round >= 3) {
      s.phase = 'finished';
      s.winner = s.wins.player === s.wins.ai ? 'draw' : s.wins.player > s.wins.ai ? 'player' : 'ai';
    } else s.phase = 'round-end';
    return;
  }
  s.turn = s.passed[cardOther(side)] ? side : cardOther(side);
}
function nextCardRound(s) {
  if (s.phase !== 'round-end') return false;
  for (const side of ['player', 'ai'])
    for (const row of CARD_ROWS) {
      for (const u of s.board[side][row]) s.discard[u.owner].push(u);
      s.board[side][row] = [];
      s.horn[side][row] = false;
    }
  for (const row of CARD_ROWS) s.weather[row] = false;
  s.round++;
  s.passed = { player: false, ai: false };
  s.turn = s.round % 2 ? 'player' : 'ai';
  s.phase = 'playing';
  drawCards(s, 'player', 2);
  drawCards(s, 'ai', 2);
  cardLog(
    s,
    'Runda ' + s.round + '. Dobierasz do dwóch kart. Zarządzaj ręką — nie odnawia się w całości.',
  );
  return true;
}
function chooseCardAI(s) {
  if (s.phase !== 'playing' || s.turn !== 'ai') return null;
  const mine = cardScore(s, 'ai'),
    theirs = cardScore(s, 'player'),
    actions = cardActions(s, 'ai');
  if (!actions.length || (s.passed.player && mine > theirs)) return { type: 'pass' };
  let best = null,
    bestValue = -Infinity;
  for (const action of actions) {
    const copy = JSON.parse(JSON.stringify(s)),
      oldHand = copy.hands.ai.length;
    applyCardMove(copy, 'ai', action);
    const gain = cardScore(copy, 'ai') - cardScore(copy, 'player') - (mine - theirs);
    const c = CARD_CATALOG[s.hands.ai.find((u) => u.uid === action.uid).card];
    const value =
      gain +
      (copy.hands.ai.length - oldHand + 1) * 4 -
      (c.ability === 'hero' && s.round === 1 ? 1.5 : 0) +
      cardRandom(s) * 0.3;
    if (value > bestValue) {
      bestValue = value;
      best = action;
    }
  }
  if (
    s.wins.player === 0 &&
    s.round === 1 &&
    !s.passed.player &&
    theirs - mine > Math.max(16, bestValue + 8) &&
    s.hands.ai.length <= s.hands.player.length + 1
  )
    return { type: 'pass' };
  if (bestValue < 0 && mine >= theirs && s.hands.ai.length <= s.hands.player.length)
    return { type: 'pass' };
  return best || { type: 'pass' };
}
const BulkCards = Object.freeze({
  CARD_CATALOG,
  CARD_ROWS,
  CARD_ROW_NAMES,
  CARD_STARTER,
  CARD_OWNABLE,
  CARD_OPPONENTS,
  CARD_ABILITY_TEXT,
  validCardDeck,
  createCardCollection,
  validCardCollection,
  normalizeCardCollection,
  newCardMatch,
  cardUnitPower,
  cardRowScore,
  cardScore,
  cardActions,
  applyCardMove,
  nextCardRound,
  chooseCardAI,
});
if (typeof window !== 'undefined') window.BulkCards = BulkCards;
if (typeof module !== 'undefined') module.exports = BulkCards;
