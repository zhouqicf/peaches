var Peaches = require('./lib/peaches');
Peaches.concat = require('./lib/concat');

var logger = require('colorful').logging;
logger.config({
    level: "error"
});
require('./bin/init.js').initPeachesHome();

var version = require('./package.json').version;
Peaches.version = version;

module.exports = Peaches;