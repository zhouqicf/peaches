/**
 * Module dependencies.
 */

var POM = require('../lib/pom'),
    fs = require('fs'),
    path = require('path'),
    read = fs.readFileSync,
    readdir = fs.readdirSync,
    minify = require('../lib/minify');

describe('parse(str)', function () {
    'use strict';
    readdir(path.join(__dirname, './style/pom/')).forEach(function (file) {
        if (~file.indexOf('json')) return;
        file = path.basename(file, '.css');
        it('should parse ' + file, function () {
            var css = read(path.join(__dirname, 'style/pom/', file + '.css'), 'utf8');
            var json = require(path.join(__dirname, 'style/pom/', file + '.json'));
            var pom = new POM(css);
            pom.parse();
            pom.toString();
            var ret = JSON.stringify(pom.stylesheet, null, 2);
            ret.should.equal(JSON.stringify(json, null, 2));
        });

        it('should toString ' + file, function () {
            var css = read(path.join(__dirname, 'style/pom/', file + '.css'), 'utf8');
            var json = require(path.join(__dirname, 'style/pom/', file + '.json'));
            var pom = new POM();
            pom.stylesheet = json;
            var styleText = pom.toString();
            var pom2 = new POM(styleText);
            pom2.parse();
            var ret2 = JSON.stringify(pom2.stylesheet, null, 2);
            ret2.should.equal(JSON.stringify(json, null, 2));
        });
    });
})
