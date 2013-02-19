var http = require('http');
var Mocha = require('Mocha');
var POM = require('./lib/pom');
var fs = require('fs');
var peaches = require('./lib/peaches');
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

var srv = http.createServer(function (req, res) {
    'use strict';
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var css = fs.readFileSync('./test/style/peaches/charset.css').toString();
    peaches(css, config, function (err, styleText) {
        res.end(cssbeautify(styleText.toString()));
    }, 'debug');
});
// now that server is running
srv.listen(1337, '127.0.0.1');

