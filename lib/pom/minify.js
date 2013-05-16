var tools = require('../tools');
var Rule = require('./rule');
function Minify(stylesheet) {
    'use strict';
    if (!(this instanceof Minify)) {
        return new Minify(stylesheet);
    }
    this.stylesheet = stylesheet;

    return this._init();
}
Minify.prototype = {
    _init: function () {
        'use strict';
        this.split();
        return this.stylesheet;
    },
    split: function () {
        'use strict';
        var sheet = {
                rules: []
            }, self = this, images = {
                // 'xx.png':['selector']
            }, sizes = {
                // '377px 279.5px' : ['selector']
            }
            ;
        this.stylesheet.rules.forEach(function (rule, idx) {
            if (rule.media) {
                var mediaSheet = new Minify(rule);
                mediaSheet.media = rule.media;
                return sheet.rules.push(mediaSheet);
            }
            if (!rule.selectors) {
                return sheet.rules.push(rule);
            }
            var backgroundImage = rule.getDeclarationValue('background-image');
            var backgroundSize = rule.getDeclarationValue('background-size');

            if (backgroundImage.length === 1) {
                backgroundImage = backgroundImage[0];
                if (images[backgroundImage]) {
                    images[backgroundImage] = images[backgroundImage].concat(rule.selectors);
                }
                else {
                    images[backgroundImage] = [].concat(rule.selectors);
                }
                rule.removeDeclaration('background-image');
            }

            if (backgroundSize.length === 1) {
                backgroundSize = backgroundSize[0];
                if (sizes[backgroundSize]) {
                    sizes[backgroundSize] = sizes[backgroundSize].concat(rule.selectors);
                }
                else {
                    sizes[backgroundSize] = [].concat(rule.selectors);
                }
                rule.removeDeclaration('background-size');
            }
            if (rule.declarations && rule.declarations.length !== 0) {
                sheet.rules.push(rule);
            }
        });

        //region 优化排序
        var index = 0;
        for (var i = 0, len = sheet.rules.length; i < len; i++) {
            var rule = sheet.rules[i];
            if (rule.selectors) {
                index = i;
                break;
            }
        }
        //endregion
        // 在 retina 显示中，background-size 和 background-image 一般是成对出现的。
        // 所以这里做合并操作。
        for (var image in images) {
            if (images.hasOwnProperty(image)) {
                var hasSize = false, size;
                var selector = images[image];
                for (size in sizes) {
                    var s = sizes[size];
                    if (s.join('') === selector.join('')) {
                        hasSize = true;
                        delete sizes[size];
                        break;
                    }
                }
                var rule;
                if (hasSize) {
                    rule = new Rule({
                        selectors: images[image],
                        declarations: [
                            {
                                property: 'background-image',
                                value: image
                            },
                            {
                                property: 'background-size',
                                value: size
                            }
                        ]
                    })
                }
                else {
                    rule = new Rule({
                        selectors: images[image],
                        declarations: [
                            {
                                property: 'background-image',
                                value: image
                            }
                        ]
                    })
                }
                sheet.rules.splice(index, 0, rule);
            }
        }

        for (var size in sizes) {
            if (sizes.hasOwnProperty(size)) {

                sheet.rules.splice(index, 0, new Rule({
                    selectors: selector,
                    declarations: [
                        {
                            property: 'background-size',
                            value: size
                        }
                    ]
                }));
            }
        }
        this.stylesheet = sheet;
    }
};
module.exports = exports = Minify;