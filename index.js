var Peaches = require('./lib/peaches');
Peaches.concat = require('./lib/concat');

var logger = require('colorful').logging;
logger.config({
    level: "log"
});
require('./bin/init.js').initPeachesHome();

module.exports = Peaches;