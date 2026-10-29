'use strict';
// One release number drives the downloadable HTML, both servers and the UI.
const version = require('./package.json').version;
const major = Number(version.split('.')[0]);
module.exports = Object.freeze({ version, major, filename: `Bulk-Import-v${major}.html` });
