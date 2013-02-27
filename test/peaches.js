require('should');
var fs = require('fs'),
    path = require('path');

require = require('./testutils');
var peaches = require('../lib/peaches.js');
var cssbeautify = require('cssbeautify');
var config = {
    "sort": "h",
    "format": "png8",
    "autoReload": false,
    "model": "local",
    "server": {
        "name": "local",
        "port": 8099,
        "root": "/Users/liuqin/.peaches/images",
        "tmp": "/Users/liuqin/.peaches/tmp",
        "baseURI": "http://127.0.0.1:8099/"
    }
};
if (process.env.TEST_MODE === 'cloud') {
    config.cloud = 'http://cloud.peaches.net/api/';
}
describe('Peaches', function () {
    'use strict';
    fs.readdirSync(path.join(__dirname, './style/peaches/')).forEach(function (file) {
        if (file.indexOf('out.css') > -1) {
            return;
        }
        file = path.basename(file, '.css');
        it('should peaches ' + file, function (next) {
            this.timeout(10000);
            var css = fs.readFileSync(path.join(__dirname, 'style/peaches/', file + '.css'), 'utf8');
            peaches(css, config, function (err, pom) {
                var styleText = cssbeautify(pom.toString());
                var outStyleText = fs.readFileSync(path.join(__dirname, 'style/peaches/', file + '.out.css'), 'utf8');
                styleText.should.equal(cssbeautify(outStyleText));
                next();
            });

        });
    });

});