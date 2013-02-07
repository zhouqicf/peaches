require = require('./testutils');
var path = require('path');
var fs = require('fs');
require('should');
var cssom = require('cssom');
var Merger = require('../lib/merger');
var css_file = path.join(__dirname, './style/test.css');
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

describe('merger test', function () {
    'use strict';
    var styleSheet = cssom.parse(styleText);
    var mergerStyleSheet = new Merger(styleSheet);

    it('选择器拆分:选择器的正确处理', function (done) {
        mergerStyleSheet.styleSheet.cssRules.forEach(function (rule) {
            if (!rule.selectorText) {
                return;
            }
            var style = rule.style;
            switch (rule.selectorText) {
                case '.test-merger-1':
                    style.length.should.eql(2);
                    style.color.should.eql('red');
                    style.padding.should.eql('0');
                    break;
                case '.test-merger-2':
                    style.length.should.eql(1);
                    style.margin.should.eql('10px');
                    break;
                case '.test-merger-3':
                    style.length.should.eql(1);
                    style.margin.should.eql('10px');
                    break;
                case '.test-merger-4':
                    style.length.should.eql(2);
                    style.padding.should.eql('10px');
                    style.margin.should.eql('10px');
                    break;
                case '.test-merger-5':
                    style.length.should.eql(1);
                    style.margin.should.eql('10px');
                    break;
                case '.test-merger-6':
                    style.length.should.eql(1);
                    style['font-size'].should.eql('18px');
                    break;
                case '.test-merger-7':
                    style.length.should.eql(1);
                    style['font-size'].should.eql('16px');
                    break;
                case '.test-merger-8':
                    style.length.should.eql(1);
                    style['font-size'].should.eql('18px');
                    break;
                case '.test-merger-9':
                    style.length.should.eql(1);
                    style['font-size'].should.eql('18px');
                    break;
                case '.test-merger-10':
                    style.length.should.eql(1);
                    style['font-size'].should.eql('18px');
                    break;
                case '.test-merger-11':
                    style.length.should.eql(1);
                    style.color.should.eql('#808080');
                    break;
                case 'body .test-merger-11':
                    style.length.should.eql(1);
                    style.color.should.eql('red');
                    break;
                case 'body .test-merger-12':
                    style.length.should.eql(2);
                    style.display.should.eql('none');
                    style.float.should.eql('left');
                    break;
                case '.test-merger-12:first-of-type':
                    style.length.should.eql(2);
                    style.color.should.eql('black');
                    style.float.should.eql('inherit');
                    break;

                case '.test-merger-13':
                    style.length.should.eql(4);
                    style.animation.should.eql('move 5s infinite');
                    style['-moz-animation'].should.eql('move 5s infinite');
                    style['-webkit-animation'].should.eql('move 5s infinite');
                    style['-o-animation'].should.eql('move 5s infinite');
                    break;
            }
        });
        done();
    });
})
;
