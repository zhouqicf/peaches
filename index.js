var Peaches = require('./lib/peaches');
Peaches.concat = require('./lib/concat');

require('./bin/init.js').initPeachesHome();

module.exports = Peaches;