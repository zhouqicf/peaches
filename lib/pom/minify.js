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
            // 'xx.png':['select']
        };
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
            if (backgroundImage.length !== 1) {
                return sheet.rules.push(rule);
            }
            backgroundImage = backgroundImage[0];
            if (images[backgroundImage]) {
                images[backgroundImage] = images[backgroundImage].concat(rule.selectors);
            }
            else {
                images[backgroundImage] = [].concat(rule.selectors);
            }
            rule.removeDeclaration('background-image');
            return sheet.rules.push(rule);
        });
        for (var image in images) {
            if (images.hasOwnProperty(image)) {
                sheet.rules.splice(0, 0, new Rule({
                    selectors: images[image],
                    declarations: [
                        {
                            property: 'background-image',
                            value: image
                        }
                    ]
                }));
            }
        }
        this.stylesheet = sheet;
    }
};
module.exports = exports = Minify;