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
    "retina":true,
    "servers": {
        "local": {
            "name": "local",
            "port": 8099,
            "root": "/Users/liuqin/.peaches/images",
            "tmp": "/Users/liuqin/.peaches/tmp",
            "baseURI": "http://127.0.0.1:8099/"
        },
        "upyun": {
            "name": "upyun",
            "username": "",
            "password": "",
            "bucket": "",
            "baseURI": "",
            "root": "/Users/liuqin/.peaches/images",
            "tmp": "/Users/liuqin/.peaches/tmp"
        },
        "scp": {
            "name": "scp",
            "root": "/Users/liuqin/.peaches/images",
            "tmp": "/Users/liuqin/.peaches/tmp",
            "server": "",
            "dir": "",
            "baseURI": ""
        },
        "alipayobjects": {
            "name": "alipayobjects",
            "root": "/Users/liuqin/.peaches/images",
            "username": "liuqin.sheng",
            "tmp": "/Users/liuqin/.peaches/tmp",
            "baseURI": "https://i.alipayobjects.com",
            "uploadUrl": "https://ecmng.alipay.com/home/uploadFile.json"
        }
    }

};

var srv = http.createServer(function (req, res) {
    'use strict';
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var background = fs.readFileSync('/Users/liuqin/Projects/02.peaches/peaches-retina/static/css/src/apple.css').toString();
    config.server = config.servers[config.model];
    peaches(background, config, function (err, styleText) {
        res.end(cssbeautify(styleText));
    });

});
// now that server is running
srv.listen(1337, '127.0.0.1');
console.log('http://127.0.0.1:1337')

