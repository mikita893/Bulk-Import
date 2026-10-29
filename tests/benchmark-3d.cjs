const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const input = process.argv[2] || 'Bulk-Import-Omega-3D-v6.html';
const output = process.argv[3] || '/tmp/perf-bulk-3d.json';
const quality = process.argv[4] || 'default';
const url = /^https?:/.test(input) ? input : 'http://127.0.0.1:3000/' + path.basename(input);
const median = (a) => {
  const b = [...a].sort((x, y) => x - y);
  return b[Math.floor(b.length / 2)];
};
(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__nativeRAF = window.requestAnimationFrame.bind(window);
    window.__rafCallbacks = [];
    window.requestAnimationFrame = (callback) => {
      window.__rafCallbacks.push(callback);
      return window.__rafCallbacks.length;
    };
    window.cancelAnimationFrame = () => {};
  });
  await page.goto(url);
  await page.waitForFunction(
    () => typeof renderer !== 'undefined' && typeof newCampaign === 'function',
  );
  if (quality !== 'default')
    await page.evaluate((q) => {
      if (typeof setQuality === 'function') setQuality(q);
    }, quality);
  const hardware = await page.evaluate(() => {
    const gl = renderer.getContext(),
      ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      webgl: gl.getParameter(gl.VERSION),
      canvas: {
        width: canvas.width,
        height: canvas.height,
        cssWidth: canvas.clientWidth,
        cssHeight: canvas.clientHeight,
      },
      pixelRatio: renderer.getPixelRatio(),
    };
  });
  const results = {
    url,
    quality,
    viewport: { width: 1280, height: 800, dpr: 1 },
    hardware,
    warmupFrames: 8,
    sampleFrames: 15,
    cases: {},
    errors,
  };
  for (const fixture of ['hub', 'combat']) {
    await page.evaluate((fixture) => {
      Math.random = (() => {
        let n = 123456;
        return () => ((n = (Math.imul(n, 1664525) + 1013904223) | 0) >>> 0) / 4294967296;
      })();
      audioOn = false;
      newCampaign();
      if (fixture === 'combat') {
        beginMission(0);
        run.clock = 999;
        indo = 999;
        player = { x: 0, z: 10, hp: 100 };
        camYaw = 0;
        camZoom = 1;
        for (let i = 0; i < 10; i++)
          spawnEnemy(
            i % 4 === 0 ? 'elite' : i % 3 === 0 ? 'collector' : 'reaper',
            ((i % 5) - 2) * 6,
            Math.floor(i / 5) * 6 - 4,
          );
        for (let i = 0; i < 24; i++) {
          const bad = i % 2 === 1,
            b = {
              x: ((i % 8) - 3.5) * 3,
              z: 3 + Math.floor(i / 8) * 3,
              vx: 0,
              vz: bad ? 7 : -34,
              damage: bad ? 11 : 1.5,
              type: i % 4 === 1 ? 'collector' : 'reaper',
            };
          b.model = projectile(b, bad);
          (bad ? hostile : bullets).push(b);
        }
        for (let n = 0; n < 4 && particles.length < 60; n++) burst(0, 2, 0x7cfff2, 60);
        while (particles.length > 60) {
          const p = particles.pop();
          if (p.model?.parent) p.model.parent.remove(p.model);
        }
      }
      cameraSnap();
      updateVisuals(0);
      mode = 'panel';
      renderer.render(scene, camera);
      renderer.getContext().finish();
    }, fixture);
    const samples = await page.evaluate(
      ({ warmup, samples }) => {
        const gl = renderer.getContext(),
          submission = [],
          complete = [],
          calls = [],
          triangles = [];
        for (let i = 0; i < warmup; i++) {
          renderer.render(scene, camera);
          gl.finish();
        }
        for (let i = 0; i < samples; i++) {
          const a = performance.now();
          renderer.render(scene, camera);
          const b = performance.now();
          gl.finish();
          const c = performance.now();
          submission.push(b - a);
          complete.push(c - a);
          calls.push(renderer.info.render.calls);
          triangles.push(renderer.info.render.triangles);
        }
        return {
          submission,
          complete,
          calls,
          triangles,
          objects: {
            enemies: enemies.length,
            projectiles: bullets.length + hostile.length,
            particles: particles.length,
          },
          memory: { ...renderer.info.memory },
          programs: renderer.info.programs.length,
        };
      },
      { warmup: 8, samples: 15 },
    );
    const rafDurations = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const durations = [];
          let previous = null;
          function step(now) {
            renderer.render(scene, camera);
            renderer.getContext().finish();
            if (previous !== null) durations.push(now - previous);
            previous = now;
            if (durations.length >= 12) resolve(durations);
            else window.__nativeRAF(step);
          }
          window.__nativeRAF(step);
        }),
    );
    results.cases[fixture] = {
      medianRafFrameMs: median(rafDurations),
      rafFrameMs: rafDurations,
      objects: samples.objects,
      medianSubmissionMs: median(samples.submission),
      medianGpuFinishedFrameMs: median(samples.complete),
      medianRenderCalls: median(samples.calls),
      medianTriangles: median(samples.triangles),
      minGpuFinishedFrameMs: Math.min(...samples.complete),
      maxGpuFinishedFrameMs: Math.max(...samples.complete),
      memory: samples.memory,
      programs: samples.programs,
      samples,
    };
    console.log(
      fixture,
      JSON.stringify({
        medianRafFrameMs: results.cases[fixture].medianRafFrameMs,
        medianSubmissionMs: results.cases[fixture].medianSubmissionMs,
        medianGpuFinishedFrameMs: results.cases[fixture].medianGpuFinishedFrameMs,
        calls: results.cases[fixture].medianRenderCalls,
        triangles: results.cases[fixture].medianTriangles,
        objects: samples.objects,
      }),
    );
  }
  fs.writeFileSync(output, JSON.stringify(results, null, 2));
  console.log('Saved', output);
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
