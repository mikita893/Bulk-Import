// Exercise the actual shipped timing driver without requiring a GPU or browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = process.argv[2] || path.join(__dirname, '..', 'Bulk-Import-Omega-3D-v6.html');
const html = fs.readFileSync(file, 'utf8');
const app = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const start = app.indexOf('function frame(now)');
assert(start >= 0, 'Timing driver must exist in shipped HTML');
const driver = app.slice(start, app.indexOf("addEventListener('visibilitychange'", start));
function fixture(mode = 'combat') {
  const state = {
    mode, last: 0, lastRendered: 0, accumulator: 0, qualityClock: 0, settingsClock: 0,
    frameAverage: 16.7, adaptiveRatio: 1, simulated: 0, calls: 0, renders: 0,
    document: { hidden: false }, settings: { quality: 'fast' },
    runtimeStats: { renderMs: 0, frames: 0, simulationSteps: 0 },
    performance: { now: () => 0 }, Math, requestAnimationFrame() {}, resize() {}, setText() {},
    update(dt) { state.simulated += dt; state.calls++; }, updateVisuals() {},
    renderer: { render() { state.renders++; } }, scene: {}, camera: {}
  };
  vm.createContext(state);
  vm.runInContext(driver, state);
  state.frame(1000);
  return state;
}
for (const fps of [5, 10, 15, 30, 60]) {
  const s = fixture();
  for (let i = 1; i <= fps; i++) s.frame(1000 + i * 1000 / fps);
  assert(Math.abs(s.simulated - 1) <= 1 / 60 + 1e-8,
    `${fps} FPS must advance about one real second; got ${s.simulated}`);
}
const long = fixture();
long.frame(5000);
assert(long.calls <= 15, 'Catch-up work must be bounded after a long stall');
assert(long.simulated <= .25 + 1e-8);
const hidden = fixture();
hidden.document.hidden = true;
hidden.frame(9000);
assert.equal(hidden.calls, 0, 'Hidden tabs must not simulate combat');
hidden.document.hidden = false;
hidden.frame(9100);
assert(hidden.simulated < .11, 'Resume must not catch up hidden time');
const menu = fixture('panel');
for (let i = 1; i <= 60; i++) menu.frame(1000 + i * 1000 / 60);
assert(menu.renders <= 21, 'Menus must render at most about 20 FPS');
console.log('PASS: 5–60 FPS real-time progression, bounded catch-up, hidden tabs, menu render cap.');
