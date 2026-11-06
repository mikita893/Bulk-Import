'use strict';
class BulkSudokuGame {
  constructor(host, options = {}) {
    this.host = host;
    this.storage = options.storage;
    this.onExit = options.onExit;
    this.soundEnabled = options.soundEnabled || (() => true);
    this.dead = false;
    this.paused = false;
    this.storageOK = true;
    this.frameId = 0;
    this.audio = null;
    this.checked = new Set();
    this.message = 'Cyfry 1–9. Każdy wiersz, kolumna i blok 3×3 bez duplikatów.';
    let saved = null;
    try {
      const raw = this.storage.getItem('bulk-import-sudoku-v1');
      saved = BulkSudoku.restoreSudoku(raw);
      if (raw && !saved) this.message = 'Nie udało się odczytać planszy. Przygotowano nowe Sudoku.';
    } catch {
      this.storageOK = false;
    }
    this.game = saved || new BulkSudoku.SudokuGame();
    this.last = performance.now();
    this.saveAt = this.last;
    this.onClick = (event) => {
      const button = event.target.closest('button');
      if (!button || !host.contains(button)) return;
      if (button.dataset.sudokuCell !== undefined) {
        this.game.select(Number(button.dataset.sudokuCell));
        this.render(true);
        return;
      }
      const action = button.dataset.sudokuAction;
      if (action === 'exit') {
        this.onExit?.();
        return;
      }
      if (action === 'pause') {
        this.togglePause();
        return;
      }
      if (action === 'new') {
        this.tickTime();
        this.game = new BulkSudoku.SudokuGame(this.$('sudoku-level').value);
        this.paused = false;
        this.checked.clear();
        this.last = performance.now();
        this.message = 'Nowy arkusz, zero scalonych komórek. Excel jest zaniepokojony.';
        this.persist();
        this.render();
        return;
      }
      if (this.paused) return;
      if (button.dataset.sudokuDigit !== undefined) {
        this.enter(Number(button.dataset.sudokuDigit));
        return;
      }
      if (action === 'notes') {
        this.game.notesMode = !this.game.notesMode;
        this.message = this.game.notesMode
          ? 'Notatki: cyfry wpisują kandydatów w pustym polu.'
          : 'Wpisywanie cyfr włączone.';
        this.persist();
        this.render();
      }
      if (action === 'erase')
        this.move(() => this.game.erase(), 'Pole wyczyszczone. DELETE bez incydentu.');
      if (action === 'undo')
        this.move(() => this.game.undo(), 'Cofnięto ruch. Ctrl+Z tym razem bez makra.');
      if (action === 'hint')
        this.move(
          () => this.game.hint(),
          'Podpowiedź wpisana. Permission Set: Wgląd w rozwiązanie.',
        );
      if (action === 'check') {
        this.checked = new Set(this.game.wrong());
        this.message = this.checked.size
          ? 'Błędne wpisy: ' + this.checked.size + '. Podświetlone pola wymagają poprawki.'
          : this.game.solved
            ? 'Walidacja zakończona — Sudoku rozwiązane!'
            : 'Wpisane cyfry są poprawne. Pozostałe rekordy czekają na import.';
        this.render();
      }
    };
    this.onKey = (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      )
        return;
      const steps = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      if (steps[event.key] && !this.paused) {
        event.preventDefault();
        const [dr, dc] = steps[event.key],
          i = this.game.selected;
        this.game.select(
          Math.max(0, Math.min(8, Math.floor(i / 9) + dr)) * 9 +
            Math.max(0, Math.min(8, (i % 9) + dc)),
        );
        this.render(true);
        return;
      }
      if (event.repeat) return;
      if (event.code === 'KeyP' || event.key === 'Escape') {
        event.preventDefault();
        this.togglePause();
        return;
      }
      if (this.paused) return;
      if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        this.enter(Number(event.key));
      }
      if (['Backspace', 'Delete', '0'].includes(event.key)) {
        event.preventDefault();
        this.move(() => this.game.erase(), 'Pole wyczyszczone.');
      }
      if (event.code === 'KeyN') {
        event.preventDefault();
        this.game.notesMode = !this.game.notesMode;
        this.persist();
        this.render();
      }
    };
    this.onBlur = () => this.pause();
    this.onHidden = () => {
      if (document.hidden) this.pause();
    };
    host.addEventListener('click', this.onClick);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onHidden);
    this.persist();
    this.render();
    this.timer = setInterval(() => this.frame(performance.now()), 250);
  }
  $(id) {
    return this.host.querySelector('#' + id);
  }
  timeLabel() {
    const seconds = Math.floor(this.game.elapsed / 1000);
    return (
      Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0') +
      ':' +
      (seconds % 60).toString().padStart(2, '0')
    );
  }
  tickTime(now = performance.now()) {
    if (!this.dead && !this.paused && !this.game.solved)
      this.game.elapsed += Math.min(1000, Math.max(0, now - this.last));
    this.last = now;
  }
  persist() {
    try {
      this.storage.setItem('bulk-import-sudoku-v1', JSON.stringify(this.game.snapshot()));
    } catch {
      this.storageOK = false;
    }
  }
  tone() {
    if (!this.soundEnabled()) return;
    try {
      this.audio ??= new (window.AudioContext || window.webkitAudioContext)();
      this.audio.resume();
      const o = this.audio.createOscillator(),
        g = this.audio.createGain(),
        t = this.audio.currentTime;
      o.frequency.setValueAtTime(this.game.solved ? 880 : 540, t);
      g.gain.setValueAtTime(0.02, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(g);
      g.connect(this.audio.destination);
      o.start();
      o.stop(t + 0.14);
    } catch {}
  }
  enter(n) {
    if (this.game.solved) return;
    this.move(
      () => this.game.enter(n),
      this.game.notesMode ? 'Notatka zaktualizowana.' : 'Rekord wpisany. Validation Rule patrzy.',
    );
  }
  move(operation, message) {
    this.tickTime();
    if (!operation()) {
      this.message = this.game.puzzle[this.game.selected]
        ? 'To pole startowe — jego wartości nie można zmienić.'
        : 'Brak zmiany. W trybie notatek wybierz puste pole.';
      this.render();
      return;
    }
    this.checked.clear();
    this.message = message;
    this.persist();
    this.tone();
    this.render();
  }
  render(focus = false) {
    if (this.dead) return;
    const g = this.game,
      conflicts = g.conflicts(),
      selected = g.selected,
      number = g.values[selected];
    const rows = Array.from(
      { length: 9 },
      (_, r) =>
        `<div class="sdk-row" role="row">${Array.from({ length: 9 }, (_, c) => {
          const i = r * 9 + c,
            n = g.values[i],
            fixed = !!g.puzzle[i];
          const classes = [
            'sdk-cell',
            fixed ? 'given' : 'editable',
            i === selected ? 'selected' : '',
            BulkSudoku.peers(selected, i) ? 'related' : '',
            number && n === number ? 'same' : '',
            conflicts.has(i) || this.checked.has(i) ? 'invalid' : '',
            c === 2 || c === 5 ? 'box-right' : '',
            r === 2 || r === 5 ? 'box-bottom' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const content = n
            ? `<span class="sdk-value">${n}</span>`
            : `<span class="sdk-notes" aria-hidden="true">${Array.from({ length: 9 }, (_, k) => `<i>${g.notes[i] & (1 << k) ? k + 1 : ''}</i>`).join('')}</span>`;
          return `<button class="${classes}" data-sudoku-cell="${i}" ${this.paused ? 'disabled' : ''} role="gridcell" tabindex="${i === selected ? 0 : -1}" aria-selected="${i === selected}" aria-readonly="${fixed}" aria-label="Wiersz ${r + 1}, kolumna ${c + 1}, ${n ? 'cyfra ' + n : 'puste pole'}${fixed ? ', pole startowe' : ''}">${content}</button>`;
        }).join('')}</div>`,
    ).join('');
    this.host.innerHTML = `<div class="sdk-page"><div class="sdk-heading"><div><div class="eyebrow">CSV DOUBLE / DZIAŁ WALIDACJI REKORDÓW</div><h1>SU<span>DO</span>KU</h1><p>Wiersze bez duplikatów. Marzenie administratora, koszmar Excela.</p></div><div class="sdk-mark" aria-hidden="true">▦</div></div><div class="sdk-stats"><div><small>CZAS</small><b id="sudoku-time">${this.timeLabel()}</b></div><div><small>WYPEŁNIENIE</small><b>${g.filled}/81</b></div><div><small>PODPOWIEDZI</small><b>${g.hints}</b></div><div><small>PLANSZA</small><b>${BulkSudoku.LEVELS[g.level].name}</b></div></div><div class="sdk-layout"><section class="sdk-board-area"><div class="sdk-grid" id="sudoku-grid" role="grid" aria-label="Sudoku, 9 wierszy i 9 kolumn" aria-rowcount="9" aria-colcount="9">${rows}</div><div class="sdk-pad" aria-label="Wpisz cyfrę">${Array.from({ length: 9 }, (_, i) => `<button data-sudoku-digit="${i + 1}" ${this.paused || g.solved ? 'disabled' : ''}><b>${i + 1}</b><small>${Math.max(0, 9 - g.values.filter((n) => n === i + 1).length)} do wpisania</small></button>`).join('')}</div><div class="sdk-actions"><button data-sudoku-action="notes" aria-pressed="${g.notesMode}" ${this.paused ? 'disabled' : ''}>✎ Notatki: ${g.notesMode ? 'ON' : 'OFF'}</button><button data-sudoku-action="erase" ${this.paused ? 'disabled' : ''}>⌫ Wymaż</button><button data-sudoku-action="undo" ${this.paused || !g.history.length ? 'disabled' : ''}>↶ Cofnij</button><button data-sudoku-action="check" ${this.paused ? 'disabled' : ''}>✓ Sprawdź</button><button data-sudoku-action="hint" ${this.paused || g.solved ? 'disabled' : ''}>✦ Podpowiedź</button><button data-sudoku-action="pause">${this.paused ? '▶ Wznów' : 'Ⅱ Pauza'}</button></div></section><section class="sdk-panel"><div class="eyebrow">NIECH KAŻDY REKORD MA WŁASNE ID</div><h2>Jedna cyfra.<br>Jedno miejsce.</h2><p>W każdym wierszu, kolumnie i bloku 3×3 wpisz cyfry 1–9, każdą dokładnie raz. Jasne cyfry startowe są stałe; turkusowe wpisujesz Ty.</p><label>Nowa plansza<select id="sudoku-level" ${this.paused ? 'disabled' : ''}>${Object.entries(
      BulkSudoku.LEVELS,
    )
      .map(
        ([id, l]) =>
          `<option value="${id}" ${g.level === id ? 'selected' : ''}>${l.name} · ok. ${l.clues} pól startowych</option>`,
      )
      .join(
        '',
      )}</select></label><button class="primary" data-sudoku-action="new" ${this.paused ? 'disabled' : ''}>Nowa plansza</button><p class="sdk-save">${this.storageOK ? 'Postęp Sudoku zapisuje się automatycznie w tej przeglądarce.' : 'Pamięć zablokowana — postęp tylko w tej sesji.'}</p><p class="sdk-joke">„Excel proponuje scalić komórki. Sudoku odrzuca pull request.”</p><p class="sdk-keys">1–9: cyfra · strzałki: wybór · N: notatki · Delete: wymaż · P / Esc: pauza</p></section></div><p id="sudoku-message" class="sdk-message" role="status">${this.message}</p>${g.solved ? `<section class="sdk-win" role="status"><div aria-hidden="true">✦</div><h2>Import 81 rekordów zakończony!</h2><p>Zero duplikatów. ${this.timeLabel()} · podpowiedzi: ${g.hints}. Excel nadal szuka scalonych komórek.</p><button data-sudoku-action="exit">Wróć do CSV Double</button></section>` : ''}${this.paused ? '<div class="sdk-cover"><div><div class="eyebrow">PAUZA / ZEGAR ZATRZYMANY</div><h2>Arkusz zaczeka.</h2><p>Wznów, gdy znów masz Permission Set na skupienie.</p><button class="primary" data-sudoku-action="pause">▶ Wznów Sudoku</button><button data-sudoku-action="exit">Wróć do CSV Double</button></div></div>' : ''}</div>`;
    if (focus)
      this.host
        .querySelector('[data-sudoku-cell="' + g.selected + '"]')
        .focus({ preventScroll: true });
  }
  pause() {
    if (this.dead || this.paused) return;
    this.tickTime();
    this.paused = true;
    this.persist();
    this.render();
  }
  togglePause() {
    if (this.paused) {
      this.paused = false;
      this.last = performance.now();
      this.render();
    } else this.pause();
  }
  frame(now) {
    if (this.dead) return;
    this.tickTime(now);
    const clock = this.$('sudoku-time');
    if (clock && clock.textContent !== this.timeLabel()) clock.textContent = this.timeLabel();
    if (now - this.saveAt > 10000) {
      this.saveAt = now;
      this.persist();
    }
  }
  destroy() {
    if (this.dead) return;
    this.tickTime();
    this.persist();
    this.dead = true;
    clearInterval(this.timer);
    this.host.removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onHidden);
    this.audio?.close();
    this.host.replaceChildren();
  }
}
if (typeof window !== 'undefined') window.BulkSudokuGame = BulkSudokuGame;
