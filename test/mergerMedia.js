require = require('./testutils');

var path = require('path');
var fs = require('fs');
require('should');
var cssom = require('cssom');
var Merger = require('../lib/merger');
var css_file = path.join(__dirname, 'test.css');
var styleText = fs.readFileSync(css_file).toString();

var config = {
    "sort": "h",
    "format": "png8",
    "autoReload": false,
    "model": "local",
    "server": {
        "name": "local",
        "port": 8099,
        "root": path.join(__dirname, "./images"),
        "tmp": path.join(__dirname, "./tmp"),
        "baseURI": "http://127.0.0.1:8099/"
    }
};

describe('media test', function () {
    'use strict';
    var styleSheet = cssom.parse(styleText);
    var mergerStyleSheet = new Merger(styleSheet);

    it('@media', function (done) {
        mergerStyleSheet.styleSheet.cssRules.forEach(function (rule) {
            if (!rule.media) {
                return;
            }
        });
        done();
    });
});
