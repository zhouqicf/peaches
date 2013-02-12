/**
 * Module dependencies.
 */
require('should');
var fs = require('fs'),
    path = require('path'),
    read = fs.readFileSync,
    readdir = fs.readdirSync;

require = require('./testutils');
var POM = require('../lib/pom/index.js');

describe('POM', function () {
    'use strict';
    it('should getPropertyValue ', function () {
        var pom = new POM('body{padding:10px;}');
        pom.getPropertyValue('body', 'padding').should.be.an.instanceOf(Array);
        pom.getPropertyValue('body', 'padding').length.should.eql(1);
        pom.getPropertyValue('body', 'padding')[0].should.eql('10px');
    });
});
describe('parse(str)', function () {
    'use strict';
    readdir(path.join(__dirname, './style/pom/')).forEach(function (file) {
        if (file.indexOf('json') > -1) {
            return;
        }
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
});
