var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var tools = require('./tools');

var logger = require('colorful').logging;

/**
 * Peaches 主函数, 通过给Peaches传递样式,和服务配置,生成编译好后的样式文件.
 * 注意:
 * 1. Peaches本身不处理样式文件的读取(所以不支持传入一个样式文件的地址),
 * 2. Peaches本身不处理样式文件的写入(所以不支持直接将生成的样式,输出为一个样式文件)
 * @param styleText 输入的样式文件字符串.
 * @param config 配置
 * @param next(err, styleText, peaches)  如果没有错误,err为null, styleText为编译好后的样式.
 * @constructor
 */
function Peaches(styleText, config, next) {
    'use strict';
    if (!(this instanceof Peaches)) {
        return new Peaches(styleText, config, next);
    }
    this.styleText = styleText;
    this.next = next;
    //spriteName 为可选参数.
    //建议设置一个spriteName, 这样每次都生成一个确定的图片地址.
    this.options = {
        ignorePosition: /%|in|cm|mm|em|ex|pt|pc|center|top|bottom|auto/i,
        imageRegex: /\(['"]?([^\s]+\.(png|jpg|jpeg)(\?.*?)?)['"]?\)/i,
        spriteName: tools.md5(styleText)
    };
    this.options = _.extend(this.options, config);
    this._init();
}
Peaches.prototype = {
    _init: function () {
        'use strict';
        if (this.options.cloud) {
            return this.cloud();
        }
        var canUseLocal = false;
        try {
            require('canvas');
            canUseLocal = true;
        }
        catch (e) {
            canUseLocal = false;
            logger.warn('无法加载canvas，使用云模式');
        }
        if (canUseLocal) {
            this.local();
        }
        else {
            this.cloud();
        }
    },
    local: function () {
        'use strict';
        var POM = require('./pom');
        var ImageBucket = require('./ImageBucket');
        var combine = require('./combine');
        var self = this;
        this.pom = new POM(this.styleText);
        this.pom.parse();
        // 所有 @media 的样式表
        var mediasheet = [];
        // 所有其他样式表
        var stylesheet = {
            rules: []
        };
        this.pom.stylesheet.rules.forEach(function (rule) {
            if (!rule.media) {
                stylesheet.rules.push(rule);
            }
            else {
                mediasheet.push(rule);
            }
        });
        this.retinaTokenList = {};
        this.tokenList = {};
        // 记录异步过程中全部的错误。
        var asyncErrors = [];
        async.forEachSeries(mediasheet, function (sheet, next) {
            var options = _.extend({}, self.options);
            // 根据sheet.media 配置 spriteName；
            options.spriteName += '-' + tools.md5(sheet.media);

            var bucket = new ImageBucket(sheet, options);
            bucket.downloadImageFile(function (errs) {
                if (errs) {
                    asyncErrors.concat(errs);
                    return next();
                }
                combine(bucket, options, bucket.stylesheet, function (err, packers, stylesheet) {
                    sheet.rules = stylesheet.rules;
                    if (packers) {
                        packers.forEach(function (packer) {
                            if (packer.server) {
                                self.tokenList[packer.token] = packer.server.url;
                            }
                        });

                    }
                    next();
                });
            });
            // all done
        }, function () {
            var options = _.extend({}, self.options);
            var bucket = new ImageBucket(stylesheet, options);
            bucket.downloadImageFile(function (err) {
                if (err) {
                    asyncErrors.push(err);
                    logger.error(err);
                }
                if (asyncErrors.length > 0) {
                    return self.done(asyncErrors);
                }
                combine(bucket, options, bucket.stylesheet, function (err, packers, sheet) {
                    stylesheet = sheet;
                    stylesheet.rules = stylesheet.rules.concat(mediasheet);
                    self.pom.stylesheet = stylesheet;
                    if (packers) {
                        packers.forEach(function (packer) {
                            if (packer.server) {
                                self.tokenList[packer.token] = packer.server.url;
                                if (packer.retina) {
                                    
                                    self.retinaTokenList[packer.retina.token] = packer.retina.server.url;
                                    stylesheet.rules.push(packer.retina.sheet);
                                }
                            }
                        });
                    }

                    self.done(null);
                });
            });
        });
    },
    done: function (errs) {
        'use strict';
        if (errs) {
            return this.next(errs[0]);
        }
        var styleText = this.pom.toString(true);
        for (var token in this.retinaTokenList) {
            if (this.retinaTokenList.hasOwnProperty(token)) {
                styleText = styleText.replace(new RegExp(token, 'g'), this.retinaTokenList[token]);
            }
        }
        for (var token in this.tokenList) {
            if (this.tokenList.hasOwnProperty(token)) {
                styleText = styleText.replace(new RegExp(token, 'g'), this.tokenList[token]);
            }
        }
        this.next(null, styleText);
    },
    cloud: function () {
        'use strict';
        var Cloud = require('./cloud');
        var self = this;
        var cloud = new Cloud(this.styleText, this.options, self, function (err, styleText) {
            self.next(err, styleText);
        });
    }
};

module.exports = Peaches;
