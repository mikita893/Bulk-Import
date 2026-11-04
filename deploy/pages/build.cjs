'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

function renderPages(html, release) {
  // A same-origin srcdoc keeps browser storage while selecting the existing local mode.
  // The released HTML stays byte-for-byte unchanged, including its downloadable copy.
  const payload = JSON.stringify(html).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Bulk Import: darmowa kampania kosmiczna 3D i minigry. Graj w przeglądarce bez konta.">
<link rel="icon" href="data:,">
<title>Bulk Import — solo v${release.major}</title>
<style>
*{box-sizing:border-box}html,body{height:100%;margin:0}body{display:flex;flex-direction:column;background:#07121d;color:#dff5f5;font:13px Arial,sans-serif;overflow:hidden}header{min-height:36px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 12px;border-bottom:1px solid #294653}header span{color:#9fbfc8;font-size:11px}a{color:#9ce9e1}iframe{display:block;width:100%;flex:1;min-height:0;border:0}#loading{position:fixed;inset:36px 0 0;display:grid;place-items:center;background:#07121d;pointer-events:none}#loading[hidden]{display:none}noscript{padding:24px}header b{white-space:nowrap}@media(max-width:480px){header{font-size:11px}header span{display:none}}
</style>
</head>
<body>
<header><b>Bulk Import · solo v${release.major}</b><span>Kampania i minigry · zapis w tej przeglądarce</span><a id="download" download="${release.filename}" hidden>Pobierz HTML v${release.major}</a></header>
<div id="loading" role="status">Wczytywanie gry…</div>
<noscript>Włącz JavaScript, aby uruchomić grę. <a href="https://github.com/mikita893/Bulk-Import/blob/feature/bulk-import-unified-v13/${release.filename}">Pobierz plik HTML z repozytorium.</a></noscript>
<iframe id="solo-game" title="Bulk Import — kampania solo v${release.major}" allow="autoplay; fullscreen"></iframe>
<script>
'use strict';
const html=${payload};
const frame=document.getElementById('solo-game');
const download=document.getElementById('download');
download.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));download.hidden=false;
frame.addEventListener('load',()=>{
  document.getElementById('loading').hidden=true;
  const brand=frame.contentDocument.querySelector('header .brand');
  if(brand){brand.href='./';brand.target='_top';}
  frame.contentWindow.focus();
});
frame.srcdoc=html;
</script>
</body>
</html>
`;
}

function buildPages({output = path.join(root, 'docs')} = {}) {
  const release = require('../../release.cjs');
  const html = fs.readFileSync(path.join(root, release.filename), 'utf8');
  fs.mkdirSync(output, {recursive: true});
  fs.writeFileSync(path.join(output, 'index.html'), renderPages(html, release));
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  return path.join(output, 'index.html');
}

if (require.main === module) console.log('GitHub Pages: ' + buildPages());
module.exports = {buildPages, renderPages};
