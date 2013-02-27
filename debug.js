var http = require('http');
var Mocha = require('Mocha');
var POM = require('./lib/pom');
var fs = require('fs');
var peaches = require('./lib/peaches');
var cssbeautify = require('cssbeautify');

var async = require('async');
async.forEach([1, 2, 3, 4], function (num, next) {
    console.log(num);
    console.log(arguments);
    next(num)
}, function () {
    console.log('all done');
});
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

var srv = http.createServer(function (req, res) {
    'use strict';
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var background = fs.readFileSync('./test/style/pom/multi-background.css').toString();
    var pom = new POM(background);
    pom.parse();
    res.end(JSON.stringify(pom.stylesheet));
});
// now that server is running
srv.listen(1337, '127.0.0.1');

var canvas = require('canvas');
var express = require('express');

