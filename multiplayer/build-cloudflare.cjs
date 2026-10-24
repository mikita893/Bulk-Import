'use strict';
const fs=require('node:fs'),path=require('node:path');
require('./build-client.cjs');
const root=path.resolve(__dirname,'..'),target=path.join(root,'dist','public');
fs.mkdirSync(target,{recursive:true});
const files=fs.readdirSync(root).filter(name=>name==='index.html'||/^Bulk-Import(?:-[A-Za-z0-9-]+)?\.html$/.test(name));
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(target,file));
console.log(`Built Cloudflare static assets: ${files.length} HTML files in dist/public`);
