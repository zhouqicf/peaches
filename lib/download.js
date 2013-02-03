var fs = require('fs');
var url = require('url');
var logger = require('colorful').logging;
/**
 * 下载文件到指定目录
 * @param uri 需要下载的文件的文件
 * @param file_name 保存文件到指定目录（需要含文件名）;
 * @param next  function(err,file_name){};
 */
function download(uri, file_name, next) {
    'use strict';
    var connect,
        options = url.parse(uri),
        protocols = ['http', 'https'],
        protocol = options.protocol.slice(0, -1);
    if (protocols.indexOf(protocol) < 0) {
        return next(new Error('只能下载 http 及 https 的文件'));
    }
    connect = require(protocol);
    connect.get(options,function (res) {
        var file = fs.createWriteStream(file_name);
        res.on('data', function (chunk) {
            file.write(chunk);
        });
        res.on('end', function () {
            file.end(function (err) {
                next(null, file_name);
            });
        });
    }).on('error', function (err) {
            return next(err);
        });
}
module.exports = download;
