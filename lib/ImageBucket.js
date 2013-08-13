var fs = require('fs');
var path = require('path');
var async = require('async');
var logger = require('colorful').logging;
var download = require('./download');
var md5 = require('./tools').md5;
var _ = require('underscore');
var errors = require('./errors');

function ImageBucket(stylesheet, config, peaches) {
    'use strict';
    this.peaches = peaches;
    this.options = {
        onlineRegex: /^(https?):\/\//i
    };
    this.options = _.extend(this.options, config);
    this.stylesheet = stylesheet;
    /**
     * {
     *     file:'',//文件在本地的绝对地址.
     *     extname:'png' //文件扩展名
     *     selectorTexts:[]'选择器',
     *     error:'xx' // 如果存在error,说明下载出错了.
     *     url:''//background-image url;
     * }
     * @type {Object}
     */
    this._init();
}
ImageBucket.prototype = {
    _init: function () {
        'use strict';
        this.images = this.findImages();
    },
    /**
     * 找到所有需要sprite的图片.
     */
    findImages: function () {
        'use strict';
        var self = this, url, position, positions, image;
        var images = {};
        this.stylesheet.rules.forEach(function (cssRule) {
            if (!cssRule.selectors) {
                return;
            }
            // url  得到的是一个数组。
            url = cssRule.getDeclarationValue('background-image');
            /**
             * 如果不存在url,或者有多个background-image直接返回
             */
            if (url.length !== 1) {
                return;
            }
            url = url[0];

            // 不支持带有 nopeaches 参数的图片进行合并
            if (url.toLowerCase().indexOf('unpeaches') > -1) {
                return;
            }

            /**
             * 如果不是指定的图片格式,返回
             */
            var match = url.match(self.options.imageRegex);
            if (!match) {
                return;
            }

            /**
             * 如果是repeat的情况,返回
             */
            var repeat = cssRule.getDeclarationValue('background-repeat');
            if (repeat.length > 1) {
                return;
            }
            repeat = repeat[0];
            //TODO: repeat-x 的情况，需要支持。

            if (repeat !== 'no-repeat' && typeof repeat !== 'undefined') {
                return;
            }

            /**
             * 如果position是忽略的类型,返回
             */
            position = cssRule.getDeclarationValue('background-position');
            if (position.length > 1) {
                return;
            }
            position = position[0] || '0 0';
            if (position.match(self.options.ignorePosition)) {
                return;
            }

            //更新position的值.
            positions = position.split(/\s+/);
            if (!positions[0]) {
                positions[0] = '0';
            }
            if (!positions[1]) {
                positions[1] = '0';
            }

            // 设置peaches标志。
            cssRule.isPeaches = true;

            image = images[match[1]];
            if (image) {
                image.selectors.push(cssRule.getSelectorText());
            }
            else {
                images[match[1]] = {
                    selectors: [cssRule.getSelectorText()],
                    extname: match[2],
                    url: match[1],
                    positions: positions
                };
            }
        });
        return images;
    },
    /**
     * 获取图片的绝对路径
     * 如果是网络地址,那么先下载保存到默认路径中.
     * 异步过程
     */
    downloadImageFile: function (callback) {
        'use strict';
        var self = this, image_urls = [], image_url;
        for (image_url in this.images) {
            if (this.images.hasOwnProperty(image_url)) {
                image_urls.push(image_url);
            }
        }
        var asyncError = [];
        async.forEach(image_urls, function (image_url, next) {
            var image = self.images[image_url], match, image_name;
            match = image_url.match(self.options.onlineRegex);
            if (match) {
                // 如果图片url带有参数,那么指定一个随机的图片名称
                image_name = md5(image_url);
                //image_name 图片保存的完整路径
                image_name = path.join(self.options.server.tmp, '/' + image_name + '.' + self.images[image_url].extname);
                if (fs.existsSync(image_name) && !self.options.clean) {
                    logger.debug('存在图片:%s，不再下载', image_url);
                    image.file = image_name;
                    next();
                }
                else {
                    logger.debug('下载图片：%s', image_url);
                    download(image_url, image_name, function (err, file) {
                        if (err) {
                            err = new errors.CanNotDownloadFile('无法下载: ' + image_url);
                            asyncError.push(err);
                            return next();
                        }
                        image.file = file;
                        next();
                    });
                }
            }
            //如果是本地地址,需要将相对地址转换成绝对地址
            else {
                try {
                    image.file = path.join(self.options.source, image_url);
                    next();
                }
                    // 云端模式没有本地路径模式
                catch (e) {
                    asyncError.push(new errors.CanNotDownloadFile('无法下载：' + image_url));
                    next();
                }

            }
        }, function () {
            if (asyncError.length > 0) {
                return callback(asyncError);
            }
            callback(null);
        });
    }
};

module.exports = ImageBucket;
