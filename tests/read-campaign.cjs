'use strict';
module.exports = function readCampaign() {
  const fs = require('node:fs'),
    path = require('node:path'),
    release = require('../release.cjs');
  const html = fs.readFileSync(path.join(__dirname, '..', release.filename), 'utf8');
  const marker = 'window.BULK_CAMPAIGN_DOCUMENT=',
    start = html.indexOf(marker) + marker.length;
  if (start < marker.length) throw Error('Campaign missing from unified release');
  return JSON.parse(html.slice(start, html.indexOf(';\n', start)));
};
