'use strict';

// The campaign owns cards and rewards. This screen only owns the current duel.
class BulkCardGame {
  constructor(host, campaign) {
    this.host = host;
    this.campaign = campaign;
    this.rules = window.BulkCards;
    this.dead = false;
    this.match = null;
    this.selected = null;
    this.timer = null;
    this.token = null;
    this.refreshCollection();
    this.renderLobby();
  }
  refreshCollection() {
    this.collection = this.campaign.getCardCollection();
    this.draft = [...this.collection.deck];
  }
  card(instance, options = {}) {
    const id = typeof instance === 'string' ? instance : instance.card;
    const c = this.rules.CARD_CATALOG[id];
    const tip =
      this.rules.CARD_ABILITY_TEXT[c.ability] || 'Jednostka: jej moc liczy się do wyniku rzędu.';
    const power = options.power ?? (c.row === 'special' ? '✧' : c.power);
    return /* HTML */ `<button
      type="button"
      class="gw-card ${c.faction} ${c.ability === 'hero' ? 'hero' : ''} ${options.selected ? 'selected' : ''}"
      ${options.attrs || ''}
      title="${c.name}. ${tip}"
      aria-label="${c.name}, moc ${power}. ${tip}"
    >
      <b class="gw-power">${power}</b
      ><svg class="gw-art" viewBox="0 0 100 90" aria-hidden="true">
        <path d="M50 4 92 28 87 71 50 88 13 71 8 28Z" />
        <path d="M18 28 50 12 82 28 76 66 50 78 24 66Z" />
        <text x="50" y="55">${c.icon.replaceAll('&', '&amp;')}</text></svg
      ><strong>${c.name}</strong
      ><small
        >${c.ability ? { bond: 'WIĘŹ', morale: 'MORALE', medic: 'BACKUP', spy: 'SZPIEG', hero: 'BOHATER', horn: 'KEYNOTE', frost: 'FREEZE', fog: 'MGŁA', rain: 'DESZCZ', clear: 'REFRESH', scorch: 'DELETE', decoy: 'PODMIANA' }[c.ability] : this.rules.CARD_ROW_NAMES[c.row]}</small
      >
    </button>`;
  }
  header() {
    return '<header class="gw-heading"><div><div class="eyebrow">REKREACJA ZAŁOGI / KARCIANA WOJNA O REKORDY</div><h1>GWINT<span>FORCE</span></h1><p>Wojna rekordów. Dwa zwycięstwa, trzy rzędy, zero zgłoszeń do supportu.</p></div><div class="gw-seal">☁<small>POKER FACE<br>DEVELOPER EDITION</small></div></header>';
  }
  rulesHTML() {
    return /* HTML */ `<details class="gw-rules">
      <summary>Jak grać? Zasady, zdolności i podpowiedzi</summary>
      <p>
        Wygrywa wyższa suma mocy po spasowaniu obu stron. Zdobądź 2 punkty rund (maks. 3 rundy).
        Remis rundy daje punkt obu stronom; partia też może zakończyć się remisem. Zaczynasz z 10
        kartami, pomiędzy rundami dobierasz tylko 2. Niewykorzystane zostają w ręce. Pas trwa do
        końca rundy — czasem warto ją oddać i zachować karty.
      </p>
      <p>
        Kliknij kartę z ręki, potem podświetlony rząd lub cel. Szpieg trafia do przeciwnika! Pogoda
        działa na obie strony. Bohaterowie ignorują modyfikatory. Talia: 16–24 różnych kart,
        przynajmniej 12 jednostek. Nowe karty kupisz w zbrojowni; pierwsze zwycięstwo z każdym
        rywalem daje kartę specjalną.
      </p>
      <dl>
        ${Object.entries(this.rules.CARD_ABILITY_TEXT)
          .map(
            ([ability, desc]) =>
              '<div><dt>' + ability.toUpperCase() + '</dt><dd>' + desc + '</dd></div>',
          )
          .join('')}
      </dl>
    </details>`;
  }
  renderLobby(message = '') {
    if (this.dead) return;
    const R = this.rules,
      valid = R.validCardDeck(this.draft, this.collection.owned);
    this.host.innerHTML = /* HTML */ `<section class="gw-page">
      ${this.header()}
      <div class="gw-message" role="status">
        ${message || 'Załoga rozłożyła karty. Tym razem „relacja many-to-many” to nie romans.'}
      </div>
      <div class="gw-opponents">
        ${this.campaign
          .availableCardOpponents()
          .map((id) => {
            const o = R.CARD_OPPONENTS[id];
            return /* HTML */ `<article>
              <div class="gw-avatar">${id === 'vael' ? '◈' : id === 'syra' ? '⚙' : '▦'}</div>
              <h2>${o.name}</h2>
              <small>${o.title} · ${['', 'Rekrut', 'Taktyk', 'Ekspert'][o.level]}</small>
              <p>„${o.quote}”</p>
              <p>
                Wygrane: ${this.collection.wins[id]} ·
                ${this.collection.claimed.includes(id) ? 'Nagroda odebrana' : 'Pierwsza wygrana: ' + R.CARD_CATALOG[o.prize].name}
              </p>
              <button data-rival="${id}" class="primary">Rozdaj karty</button>
            </article>`;
          })
          .join('')}
      </div>
      <details class="gw-builder" ${message ? 'open' : ''}>
        <summary>
          Moja kolekcja i talia · ${this.collection.owned.length} kart · ${this.draft.length}/24 w
          talii
        </summary>
        <p>
          Klikaj karty, aby dodać je do talii lub usunąć. Złota obwódka oznacza wybraną kartę.
          Zakupy zrobisz w zbrojowni na statku.
        </p>
        <div class="gw-collection">
          ${this.collection.owned.map((id) => this.card(id, { selected: this.draft.includes(id), attrs: `data-deck="${id}" aria-pressed="${this.draft.includes(id)}"` })).join('')}
        </div>
        <div class="gw-builder-actions">
          <button id="gw-save-deck" class="primary" ${valid ? '' : 'disabled'}>
            Zapisz talię (${this.draft.length} kart)</button
          ><span
            >${valid ? 'Talia poprawna. Zapisz zmiany przed pojedynkiem.' : 'Wymagane 16–24 kart, w tym minimum 12 jednostek.'}</span
          >
        </div>
      </details>
      ${this.rulesHTML()}
    </section>`;
    for (const b of this.host.querySelectorAll('[data-rival]'))
      b.onclick = () => this.start(b.dataset.rival);
    for (const b of this.host.querySelectorAll('[data-deck]'))
      b.onclick = () => {
        const id = b.dataset.deck;
        this.draft = this.draft.includes(id)
          ? this.draft.filter((x) => x !== id)
          : [...this.draft, id];
        this.renderLobby('Edycja talii. Pojedynek używa ostatnio zapisanej talii.');
      };
    this.host.querySelector('#gw-save-deck').onclick = () => {
      if (this.campaign.saveCardDeck(this.draft)) {
        this.refreshCollection();
        this.renderLobby('Talia zapisana razem z kampanią.');
      }
    };
  }
  start(opponent) {
    if (this.dead) return;
    const token = this.campaign.beginCardDuel(opponent);
    if (token === null) return;
    this.token = token;
    this.match = this.rules.newCardMatch(this.collection.deck, opponent, Date.now());
    this.selected = null;
    this.result = null;
    this.renderMatch();
  }
  actions() {
    return this.rules.cardActions(this.match, 'player').filter((a) => a.uid === this.selected);
  }
  play(action) {
    if (this.dead || !this.match) return;
    if (this.rules.applyCardMove(this.match, 'player', action)) {
      this.selected = null;
      this.renderMatch();
    }
  }
  renderSide(side) {
    const R = this.rules,
      s = this.match,
      legal = this.actions(),
      selected = s.hands.player.find((u) => u.uid === this.selected);
    const spy = selected && R.CARD_CATALOG[selected.card].ability === 'spy';
    const dest = spy ? 'ai' : 'player';
    return /* HTML */ `<div class="gw-side ${side}">
      ${(side === 'ai' ? [...R.CARD_ROWS].reverse() : R.CARD_ROWS)
        .map((row) => {
          const targets = legal.filter((a) => a.row === row),
            rowAction = targets.find((a) => a.target === undefined);
          const usable = side === dest && !!rowAction;
          return /* HTML */ `<div
            class="gw-row ${s.weather[row] ? 'weather' : ''} ${usable ? 'legal' : ''}"
            data-side="${side}"
            data-row="${row}"
          >
            <div class="gw-row-label">
              <span>${R.CARD_ROW_NAMES[row]}</span><b>${R.cardRowScore(s, side, row)}</b
              ><small
                >${s.weather[row] ? '❄ Pogoda · baza 1' : ''}
                ${s.horn[side][row] ? '♪ ×2' : ''}</small
              >${usable ? `<button class="gw-deploy" data-deploy="${row}">Zagraj tutaj</button>` : ''}
            </div>
            <div class="gw-board-cards">
              ${s.board[side][row].map((u) => this.card(u, { power: R.cardUnitPower(s, side, row, u), selected: side === 'player' && targets.some((a) => a.target === u.uid), attrs: `data-board="${u.uid}" data-card-row="${row}"` })).join('')}
            </div>
          </div>`;
        })
        .join('')}
    </div>`;
  }
  renderMatch() {
    if (this.dead) return;
    clearTimeout(this.timer);
    this.timer = null;
    const R = this.rules,
      s = this.match,
      o = R.CARD_OPPONENTS[s.opponent];
    if (s.phase === 'finished' && this.token !== null) {
      this.result = this.campaign.finishCardDuel(this.token, s.winner);
      this.token = null;
    }
    const legal = this.actions(),
      selected = s.hands.player.find((u) => u.uid === this.selected),
      c = selected && R.CARD_CATALOG[selected.card];
    const medicTargets = c?.ability === 'medic' ? legal.filter((a) => a.target !== undefined) : [];
    let prompt =
      s.phase === 'playing'
        ? s.turn === 'ai'
          ? o.name + ' analizuje arkusz…'
          : s.passed.ai
            ? 'Przeciwnik spasował. Możesz grać dalej lub zakończyć rundę.'
            : 'Twój ruch: wybierz kartę albo spasuj.'
        : s.phase === 'round-end'
          ? 'Koniec rundy. Nie marnuj kart — przechodzą do kolejnej.'
          : s.winner === 'player'
            ? 'Wygrywasz! Arkusz nie przewidział takiej formuły.'
            : s.winner === 'draw'
              ? 'Remis. Obie strony zgłosiły ten sam External ID.'
              : 'Przegrywasz partię. To dobry moment na backup strategii.';
    if (c) prompt = c.name + ': ' + (R.CARD_ABILITY_TEXT[c.ability] || 'Wskaż podświetlony rząd.');
    this.host.innerHTML = /* HTML */ `<section class="gw-page gw-table">
      ${this.header()}
      <div class="gw-matchbar">
        <div>
          <b>TY · ☁ Salesforce</b
          ><span
            >${'◆'.repeat(s.wins.player)}${'◇'.repeat(2 - s.wins.player)} · moc
            <strong id="gw-player-score">${R.cardScore(s, 'player')}</strong></span
          ><small
            >${s.hands.player.length} kart w ręce · ${s.decks.player.length} w talii
            ${s.passed.player ? '· PAS' : ''}</small
          >
        </div>
        <div class="gw-round">
          RUNDA ${s.round}/3<small
            >${s.history.map((h) => h.player + ':' + h.ai).join(' / ')}</small
          >
        </div>
        <div>
          <b>${o.name} · ▦ Excel</b
          ><span
            >${'◆'.repeat(s.wins.ai)}${'◇'.repeat(2 - s.wins.ai)} · moc
            <strong id="gw-ai-score">${R.cardScore(s, 'ai')}</strong></span
          ><small
            >${s.hands.ai.length} kart w ręce · ${s.decks.ai.length} w talii
            ${s.passed.ai ? '· PAS' : ''}</small
          >
        </div>
      </div>
      <div class="gw-board">
        ${this.renderSide('ai')}
        <div class="gw-divider">WOJNA REKORDÓW · NIE KAŻDY REKORD MUSI WRÓCIĆ Z PRODUKCJI</div>
        ${this.renderSide('player')}
      </div>
      <div class="gw-message" role="status">
        ${prompt}${this.result?.reward ? '<br>Nowa karta w kolekcji: <b>' + this.result.reward + '</b>. Dodaj ją do talii przed następną partią.' : ''}
      </div>
      ${
        medicTargets.length
          ? '<div class="gw-revive"><b>Wybierz jednostkę z backupu:</b>' +
            medicTargets
              .map((a) =>
                this.card(
                  s.discard.player.find((u) => u.uid === a.target),
                  { attrs: `data-revive="${a.target}"` },
                ),
              )
              .join('') +
            '</div>'
          : ''
      }
      <div class="gw-actions">
        ${legal.some((a) => a.row === null) ? '<button id="gw-special" class="primary">Zagraj wybraną kartę specjalną</button>' : ''}<button
          id="gw-pass"
          ${s.phase !== 'playing' || s.turn !== 'player' ? 'disabled' : ''}
        >
          PAS · do końca rundy</button
        ><button id="gw-next" class="primary" ${s.phase === 'round-end' ? '' : 'hidden'}>
          Kolejna runda · dobierz 2</button
        ><button id="gw-lobby">
          ${s.phase === 'finished' ? 'Wróć do stolika' : 'Poddaj partię'}
        </button>
      </div>
      <div class="gw-hand" aria-label="Twoje karty w ręce">
        ${s.hands.player.map((u) => this.card(u, { selected: u.uid === this.selected, attrs: `data-hand="${u.uid}" ${s.phase !== 'playing' || s.turn !== 'player' ? 'disabled' : ''}` })).join('')}
      </div>
      <details class="gw-log">
        <summary>Historia ruchów i stos odrzuconych (${s.discard.player.length})</summary>
        <ol>
          ${s.log.map((x) => '<li>' + x + '</li>').join('')}
        </ol>
        <p>
          ${s.discard.player.map((u) => R.CARD_CATALOG[u.card].name).join(' · ') || 'Backup jeszcze pusty.'}
        </p>
      </details>
      ${this.rulesHTML()}
    </section>`;
    for (const b of this.host.querySelectorAll('[data-hand]'))
      b.onclick = () => {
        this.selected = Number(b.dataset.hand);
        this.renderMatch();
      };
    for (const b of this.host.querySelectorAll('[data-deploy]'))
      b.onclick = () =>
        this.play(legal.find((a) => a.row === b.dataset.deploy && a.target === undefined));
    for (const b of this.host.querySelectorAll('[data-board]'))
      b.onclick = () => {
        const a = legal.find(
          (a) => a.target === Number(b.dataset.board) && a.row === b.dataset.cardRow,
        );
        if (a && b.closest('[data-side]').dataset.side === 'player') this.play(a);
      };
    for (const b of this.host.querySelectorAll('[data-revive]'))
      b.onclick = () => this.play(legal.find((a) => a.target === Number(b.dataset.revive)));
    const special = this.host.querySelector('#gw-special');
    if (special) special.onclick = () => this.play(legal.find((a) => a.row === null));
    this.host.querySelector('#gw-pass').onclick = () => this.play({ type: 'pass' });
    this.host.querySelector('#gw-next').onclick = () => {
      R.nextCardRound(s);
      this.selected = null;
      this.renderMatch();
    };
    this.host.querySelector('#gw-lobby').onclick = () => {
      this.campaign.cancelCardDuel();
      this.token = null;
      this.match = null;
      clearTimeout(this.timer);
      this.refreshCollection();
      this.renderLobby();
    };
    if (s.phase === 'playing' && s.turn === 'ai')
      this.timer = setTimeout(() => {
        if (this.dead) return;
        R.applyCardMove(s, 'ai', R.chooseCardAI(s));
        this.renderMatch();
      }, 650);
  }
  destroy() {
    this.dead = true;
    clearTimeout(this.timer);
    this.campaign.cancelCardDuel();
    this.host.replaceChildren();
  }
}
if (typeof window !== 'undefined') window.BulkCardGame = BulkCardGame;
