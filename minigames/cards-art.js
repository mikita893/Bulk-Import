'use strict';
// One embedded painted atlas: different combat variants retain their shared character archetype.
const BulkCardArt = Object.freeze({
  tiles: {
    'sf-admin': 0,
    'sf-courier': 1,
    'sf-guard': 2,
    'sf-bulk1': 3,
    'sf-bulk2': 3,
    'sf-bulk3': 3,
    'sf-flow1': 4,
    'sf-flow2': 4,
    'sf-permission': 2,
    'sf-validator': 5,
    'sf-dev': 5,
    'sf-architect': 9,
    'sf-medic': 6,
    'sf-spy': 7,
    'sf-dashboard': 8,
    'sf-backup': 9,
    'sf-tester': 0,
    'sf-senior': 8,
    'sf-sentinel': 2,
    'sf-restore': 6,
    'sf-hero': 8,
    'sf-master': 5,
    'prize-vael': 9,
    'prize-syra': 10,
    'prize-excel': 11,
    'n-frost': 5,
    'n-horn': 11,
    'n-horn2': 11,
    'n-clear': 6,
    'n-decoy': 7,
    'n-scorch': 13,
    'n-fog': 7,
    'n-rain': 4,
    'xl-cell': 12,
    'xl-row': 14,
    'xl-vlookup': 13,
    'xl-pivot1': 14,
    'xl-pivot2': 14,
    'xl-macro': 13,
    'xl-copy': 12,
    'xl-paste': 12,
    'xl-spy': 7,
    'xl-repair': 13,
    'xl-chart': 14,
    'xl-formula': 13,
    'xl-filter': 12,
    'xl-budget': 14,
    'xl-error': 12,
    'xl-hero': 15,
  },
  markup(id, cls = 'gw-art') {
    const n = this.tiles[id];
    if (!Number.isInteger(n)) throw Error('Missing painted card portrait: ' + id);
    return (
      '<span class="' +
      cls +
      '" data-card-art="' +
      id +
      '" style="background-position:' +
      ((n % 4) * 100) / 3 +
      '% ' +
      (Math.floor(n / 4) * 100) / 3 +
      '%" aria-hidden="true"></span>'
    );
  },
});
if (typeof module !== 'undefined' && module.exports) module.exports = BulkCardArt;
