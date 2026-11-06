'use strict';
const crypto = require('node:crypto');
const {
  CREW_SCENES,
  CREW_GREETINGS,
  CREW_EXTRA_LINES,
  CREW_SHARED_LINES,
  VOICE_EVENTS,
} = require('../campaign/dialogues.js');
const profileVersion = 'piper-polish-v1';
function catalogue() {
  const rows = new Map();
  function add(speaker, text) {
    text = text.trim();
    const key = speaker + '\n' + text;
    if (!rows.has(key))
      rows.set(key, {
        id:
          speaker +
          '-' +
          crypto
            .createHash('sha256')
            .update(profileVersion + '\n' + key)
            .digest('hex')
            .slice(0, 16),
        speaker,
        text,
      });
  }
  CREW_SCENES.forEach((scenes, i) => {
    const speaker = i === 0 ? 'vael' : 'syra';
    for (const scene of scenes) {
      add(speaker, scene.line);
      for (const a of scene.answers) add(speaker, a[3]);
    }
    for (const text of [...CREW_GREETINGS, ...CREW_EXTRA_LINES[i], ...CREW_SHARED_LINES])
      add(speaker, text);
  });
  for (const e of VOICE_EVENTS) add(e.speaker, e.text);
  return [...rows.values()];
}
module.exports = { catalogue, profileVersion };
if (require.main === module)
  process.stdout.write(JSON.stringify({ profileVersion, clips: catalogue() }));
