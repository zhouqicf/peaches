var path = require('path');
var fs = require('fs');
var _ = require('underscore');


var logger = require('colorful').logging;

/**
 * Peaches 主函数, 通过给Peaches传递样式,和服务配置,生成编译好后的样式文件.
 * 注意:
 * 1. Peaches本身不处理样式文件的读取(所以不支持传入一个样式文件的地址),
 * 2. Peaches本身不处理样式文件的写入(所以不支持直接将生成的样式,输出为一个样式文件)
 * @param styleText 输入的样式文件字符串.
 * @param config 配置
 * @param next(err, styleText, peaches)  如果没有错误,err为null, styleText为编译好后的样式.
 * @param spriteName 合并后的背景图片名称
 * @constructor
 */
function Peaches(styleText, config, next, spriteName) {
    'use strict';
    if (!(this instanceof Peaches)) {
        return new Peaches(styleText, config, next, spriteName);
    }
    this.styleText = styleText;
    this.next = next;
    //spriteName 为可选参数.
    //建议设置一个spriteName, 这样每次都生成一个确定的图片地址.
    this.spriteName = spriteName || Date.now();
    this.options = {
        ignorePosition:/%|in|cm|mm|em|ex|pt|pc|center|center|top|bottom|auto/i,
        imageRegex:/\(['"]?([^\s]+\.(png|jpg|jpeg)(\?.*?)?)['"]?\)/i
    };
    this.options = _.extend(this.options, config);
    this._init();
}
Peaches.prototype = {
    _init:function () {
        'use strict';
        if (this.options.cloud) {
            return this.cloud();
        }
        try {
            var canvas = require('canvas');
            this.local();
        }
        catch (e) {
            logger.warn('无法加载canvas，使用云模式');
            logger.info(e);
            this.cloud();
        }
    },
    local:function () {
        'use strict';
        var POM = require('./pom');
        var ImageBucket = require('./ImageBucket');
        var Combine = require('./combine');
        var minify = require('./minify');
        var self = this;
        this.pom = new POM(this.styleText);
        this.imageBucket = new ImageBucket(this.pom, this);
        this.imageBucket.downloadImageFile(function () {
            self.combo = new Combine(self.imageBucket, self, function (err, packers) {
                var styleText = minify(self.pom);
                if (packers) {
                    packers.forEach(function (packer) {
                        if (packer.server) {
                            styleText = styleText.replace(new RegExp(packer.token, 'g'), packer.server.url);
                        }
                    });
                }
                self.next(null, styleText, self);
            });
        });
    },
    cloud:function () {
        'use strict';
        var Cloud = require('./cloud');
        var self = this;
        var cloud = new Cloud(this.styleText, this.options, self, function (err, styleText) {
            self.next(err, styleText);
        });
    }
};

module.exports = Peaches;
