var tools = require('../tools');
var Rule = require('./rule');
/**
 * Split函数,将POM对象中,一些合并selector的样式拆分开, 使得每一个选择器只存在一个独立的样式块.
 * 比如:
 * div,a{
 *   background-color: red;
 * }
 * a{
 *    background: #ccc;
 * }
 * 将处理成:
 * div {
 *    background-color: red;
 * }
 *
 * a {
 *   background-color: #ccc;
 * }
 *
 */
function Split(stylesheet) {
    'use strict';
    if (!(this instanceof Split)) {
        return new Split(stylesheet);
    }
    this.stylesheet = stylesheet;
    return this._init();
}
Split.prototype = {
    _init: function () {
        'use strict';
        this.split();
        return this.stylesheet;
    },
    split: function () {
        'use strict';
        var sheet = {
            rules: []
        }, self = this;
        this.stylesheet.rules.forEach(function (rule, idx) {
            var rules = self.splitAtRule(rule) || self.splitRule(rule);
            sheet.rules = sheet.rules.concat(rules);
        });
        this.stylesheet = sheet;
    },
    splitAtRule: function (rule) {
        'use strict';
        return this.splitAtImport(rule) || this.splitMedia(rule) || this.splitKeyframes(rule) || this.splitAtCharset(rule);
    },
    splitRule: function (rule) {
        'use strict';
        if (!rule.selectors) {
            return;
        }

        var rules = [], newRule;
        rule.selectors.forEach(function (selector, idx) {
            newRule = new Rule({
                selectors: [selector],
                declarations: tools.clone(rule.declarations, true)
            });
            rules.push(newRule);
        });
        return rules;
    },
    splitKeyframes: function (rule) {
        'use strict';
        if (!rule.keyframes) {
            return;
        }
        return [rule];
    },
    splitMedia: function (rule) {
        'use strict';
        if (!rule.media) {
            return;
        }
        var mediasheet = new Split(rule);
        mediasheet.media = rule.media;
        return [mediasheet];
    },
    splitAtImport: function (rule) {
        'use strict';
        if (!rule['import']) {
            return;
        }
        return [rule];
    },
    splitAtCharset: function (rule) {
        'use strict';
        if (!rule.charset) {
            return;
        }
        return [rule];
    }
};

module.exports = Split;