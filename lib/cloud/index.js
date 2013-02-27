var request = require('request');
var path = require('path');
var fs = require('fs');
var url = require('url');
var _ = require('underscore');
var async = require('async');

var md5 = require('../tools').md5;
var download = require('../download');
var logger = require('colorful').logging;


function Cloud(styleText, config, peaches, next) {
    'use strict';
    this.options = _.extend({
        "cloud": "http://cloud.peaches.io/api/"
    }, config);
    this.styleText = styleText;
    this.peaches = peaches;
    this.next = next || function () {
    };
    this._init();
}
Cloud.prototype = {
    _init: function () {
        'use strict';
        this.send();
    },
    send: function () {
        'use strict';
        var self = this;
        logger.start('正在上传服务器: %s ',this.options.cloud);
        logger.log('服务处理中...');
        try {
            request.post(url.format(this.options.cloud), {
                    form: {
                        styleText: this.styleText,
                        spriteName: md5(process.env.USER + self.peaches.spriteName),
                        sort: self.options.sort,
                        format: self.options.format,
                        model: self.options.model
                    }
                }, function (err, rsp, body) {
                    logger.end('服务器处理结束');
                    try {
                        body = JSON.parse(body);
                    }
                    catch (e) {
                        logger.info(body);
                        logger.error(e);
                        logger.error('服务器处理错误！');
                        logger.error('请联系 旺旺 @蔡伦 ，email: liuqin.sheng@alipay.com');
                        process.exit(1);
                    }
                    if (body.stat === 'fail') {
                        self.err(body.errors);
                    }
                    else {
                        self.localImage(body);
                    }
                }
            );
        } catch (e) {
            logger.error('样式处理错误，请检测CSS文件编码格式是否为UTF-8！');
            process.exit(1);
        }
    },
    err: function (errors) {
        'use strict';
        errors.forEach(function(err,idx){
            logger.error(err.message);
            switch(err.name){
                case 'CanNotDownloadFile':
                    logger.warn('由于是云端服务器下载图片，所以请确保图片地址公网能够访问！');
                    break;
                default :
                    logger.warn('实在搞不定，可以咨询 旺旺：蔡伦，Email: liuqin.sheng@alipay.com');
                    break;
            }
        });
        process.exit(1);
    },
    localImage: function (data) {
        'use strict';
        var self = this;
        var images = data.images;

        async.forEachSeries(images, function (image, next) {
            var name = path.basename(image);
            var basedir = self.options.server.root;
            var file = path.join(basedir, name);
            download(image, file, function (err) {
                switch (self.options.server.name) {
                    case 'local':
                        var url = self.options.server.baseURI + name;
                        data.styleText = data.styleText.replace(new RegExp(image, 'g'), url);
                        next();
                        break;
                    case 'upyun':
                        var Upyun = require('../plugin/upyun');
                        var upyun = new Upyun('upyun', self.options.server);
                        upyun.upload(file, function (err, url) {
                            data.styleText = data.styleText.replace(new RegExp(image, 'g'), url);
                            next();
                        });
                        break;
                    case 'scp':
                        var Scp = require('../plugin/scp');
                        var scp = new Scp('scp', self.options.server);
                        scp.upload(file, function (err, url) {
                            data.styleText = data.styleText.replace(new RegExp(image, 'g'), url);
                            next();
                        });
                        break;
                    case 'alipayobjects':
                        var CDN = require('../plugin/alipayobjects');
                        var cdn = new CDN('scp', self.options.server);
                        cdn.upload(file, function (err, url) {
                            data.styleText = data.styleText.replace(new RegExp(image, 'g'), url);
                            next();
                        });
                        break;
                }
            });
        }, function (err) {
            self.next(null, data.styleText);
        });


    }
};

module.exports = Cloud;