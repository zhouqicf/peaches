var fs = require('fs');
var path = require('path');
var async = require('async');
var less = require('less');
var logger = require('colorful').logging;

function concat(output, next) {
    'use strict';
    var dist, dists = [],
        styles = {}, outputError = null;
    for (dist in output) {
        if (output.hasOwnProperty(dist)) {
            dists.push(dist);
        }
    }
    async.forEachSeries(dists, function (dist, callback) {
        var list = output[dist], styleText = '', text;
        logger.start('开始合并:', dist);

        async.forEachSeries(list, function (file, cb) {
            logger.debug('合并文件：%s', file);
            fs.readFile(file, function (err, text) {
                if (err) {
                    logger.error('读取文件：%s，发生错误，Error:%s', file, e);
                    logger.error('程序自动退出！');
                    process.exit(1);
                }
                text = text.toString();
                switch (path.extname(file)) {
                    case '.less':
                        less.render(text, function (err, css) {
                            if (err) {
                                err.filename = file;
                                outputError = err;
                                return callback(err);
                            }
                            styleText += css;
                            cb();
                        });
                        break;
                    default :
                        styleText += text;
                        cb();
                        break;
                }
            });

        }, function () {
            styles[dist] = styleText;
            logger.end('合并结束');
            callback();
        });

    }, function () {
        next(outputError, styles);
    });
}
module.exports = concat;