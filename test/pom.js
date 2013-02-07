/**
 * Module dependencies.
 */

var POM = require('../lib/pom'),
    fs = require('fs'),
    path = require('path'),
    read = fs.readFileSync,
    readdir = fs.readdirSync;

describe('parse(str)', function () {
    'use strict';
    readdir(path.join(__dirname, './style/pom/')).forEach(function (file) {
        if (~file.indexOf('json')) return;
        file = path.basename(file, '.css');
        it('should parse ' + file, function () {
            var css = read(path.join(__dirname, 'style/pom/', file + '.css'), 'utf8');
            var json = read(path.join(__dirname, 'style/pom/', file + '.json'), 'utf8');
            var pom = new POM(css);
            pom.parse();
            var ret = JSON.stringify({stylesheet: pom.stylesheet}, null, 2);
            ret.should.equal(json);
        })
    });
})
