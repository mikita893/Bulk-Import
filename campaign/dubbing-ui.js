'use strict';
function refreshDubbingUI(state) {
  $('voice-settings').textContent = 'DUBBING: ' + (dubbing.settings.enabled ? 'ON' : 'OFF');
  if (!state) return;
  const panel = mode === 'panel',
    clip = state.clip,
    visible =
      clip &&
      clip.kind === 'event' &&
      ['playing', 'paused', 'blocked'].includes(state.status) &&
      !panel;
  $('voice-caption').hidden = !visible;
  if (visible) {
    $('voice-speaker').textContent = window.parent.BulkVoice.SPEAKERS[clip.speaker];
    $('voice-text').textContent = clip.text;
    $('voice-blocked').hidden = state.status !== 'blocked';
  }
  const replay = $('dialogue-replay'),
    skip = $('dialogue-skip');
  if (replay) {
    replay.disabled = !state.enabled || state.volume === 0;
    skip.disabled = !dubbing.current;
  }
}
function speakCrew(i, text, playerLine = null) {
  const speaker = i === 0 ? 'vael' : 'syra',
    ending = ' Nasz związek się kończy. Potrzebuję dystansu.';
  const hasEnding = text.endsWith(ending);
  if (hasEnding) text = text.slice(0, -ending.length);
  if (playerLine) dubbing.play('hero', playerLine, { kind: 'dialogue', priority: 4 });
  dubbing.play(speaker, text, { kind: playerLine ? 'dialogueTail' : 'dialogue', priority: 4 });
  if (hasEnding) dubbing.play(speaker, ending.trim(), { kind: 'dialogueTail', priority: 4 });
  const target = $('panel-body').querySelector('.crew-line');
  if (!target) return;
  const controls = document.createElement('div');
  controls.className = 'dialogue-audio-controls';
  const replay = document.createElement('button');
  replay.id = 'dialogue-replay';
  replay.textContent = '▶ Powtórz kwestię';
  replay.onclick = () => {
    dubbing.stop();
    if (playerLine) dubbing.play('hero', playerLine, { kind: 'dialogue', priority: 4 });
    dubbing.play(speaker, text, { kind: playerLine ? 'dialogueTail' : 'dialogue', priority: 4 });
  };
  const skip = document.createElement('button');
  skip.id = 'dialogue-skip';
  skip.textContent = '⏹ Pomiń głos';
  skip.onclick = () => dubbing.stop();
  controls.append(replay, skip);
  target.after(controls);
  refreshDubbingUI({
    enabled: dubbing.settings.enabled,
    volume: dubbing.settings.volume,
    status: dubbing.status,
    clip: null,
  });
}
function voiceNotice(text) {
  const e = VOICE_EVENTS.find((e) => text.startsWith(e.match));
  if (!e) return;
  dubbing.play(e.speaker, e.text, { priority: e.priority || 1, cooldown: e.cooldown });
}
function dubbingMenu() {
  const base = mode,
    previous =
      mode === 'panel'
        ? {
            title: $('panel-title').innerHTML,
            tag: $('panel-tag').textContent,
            body: [...$('panel-body').childNodes],
            actions: [...$('panel-actions').childNodes],
            back: modalBack,
            returnMode,
            terminal: terminalPanelOpen,
            cards: cardShopOpen,
            intro: $('panel').classList.contains('intro'),
          }
        : null;
  const back = () => {
    dubbing.stop();
    if (previous) {
      $('panel-title').innerHTML = previous.title;
      $('panel-tag').textContent = previous.tag;
      $('panel-body').replaceChildren(...previous.body);
      $('panel-actions').replaceChildren(...previous.actions);
      modalBack = previous.back;
      returnMode = previous.returnMode;
      terminalPanelOpen = previous.terminal;
      cardShopOpen = previous.cards;
      $('panel').classList.toggle('intro', previous.intro);
      mode = 'panel';
      refreshDubbingUI({
        enabled: dubbing.settings.enabled,
        volume: dubbing.settings.volume,
        status: 'idle',
        clip: null,
      });
    } else {
      closePanel(false);
      mode = base;
      hud();
    }
  };
  openPanel(
    'Dubbing / radio galaktyczne',
    'GŁOSY POSTACI',
    '<p>Polskie głosy załogi, bossów i komputera statku. Nagrania działają także offline. Dźwięk gry musi być włączony. Tekst dialogów pozostaje widoczny.</p><div class="dubbing-options"><label><input type="checkbox" id="voice-enabled" ' +
      (dubbing.settings.enabled ? 'checked' : '') +
      '> Dubbing włączony</label><label for="voice-volume">Głośność głosów <output id="voice-volume-value">' +
      Math.round(dubbing.settings.volume * 100) +
      '%</output></label><input id="voice-volume" type="range" min="0" max="100" step="5" value="' +
      Math.round(dubbing.settings.volume * 100) +
      '"><p class="caption">Odsłuch obsady. Marc jest fikcyjnym głosem hologramu.</p><div id="voice-samples" class="grid-info"></div></div>',
    back,
  );
  $('voice-enabled').onchange = (e) => dubbing.setEnabled(e.target.checked);
  $('voice-volume').oninput = (e) => {
    const value = Number(e.target.value) / 100;
    dubbing.setVolume(value);
    $('voice-volume-value').textContent = Math.round(value * 100) + '%';
  };
  for (const [speaker, name] of Object.entries(window.parent.BulkVoice.SPEAKERS)) {
    const b = document.createElement('button');
    b.textContent = '▶ ' + name;
    b.dataset.voiceSample = speaker;
    b.onclick = () => {
      const clip = [...dubbing.clips.values()].find((c) => c.speaker === speaker);
      dubbing.play(speaker, clip.text, { kind: 'sample', priority: 4 });
    };
    $('voice-samples').appendChild(b);
  }
  button('Zatrzymaj odsłuch', () => dubbing.stop());
  button('Wróć', back);
}

const heroBarkTimers = { next: 0, types: {}, index: 0 };
function heroBark(kind) {
  if (
    mode !== 'combat' ||
    !HERO_BARKS[kind] ||
    dubbing.current ||
    time < heroBarkTimers.next ||
    time < (heroBarkTimers.types[kind] || 0)
  )
    return;
  const lines = HERO_BARKS[kind],
    line = lines[heroBarkTimers.index++ % lines.length];
  if (dubbing.play('hero', line, { priority: 0, cooldown: 25 })) {
    heroBarkTimers.next = time + 6;
    heroBarkTimers.types[kind] = time + (kind === 'shot' ? 28 : 18);
  }
}
