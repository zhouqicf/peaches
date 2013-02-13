var tools = require('../tools');
var Rule = require('./rule');
function Merger(stylesheet) {
    'use strict';
    if (!(this instanceof Merger)) {
        return new Merger(stylesheet);
    }
    this.stylesheet = stylesheet;
    return this._init();
}
Merger.prototype = {
    _init: function () {
        'use strict';
        this.imports = [];
        this.medias = [];
        this.keyframes = [];
        this.rules = {};
        this.merger();
        return this.stylesheet;
    },
    merger: function () {
        'use strict';
        var sheet = {
            rules: []
        }, self = this;

        this.stylesheet.rules.forEach(function (rule, idx) {
            return self.mergerAtRule(rule) || self.mergerRule(tools.clone(rule));
        });
        //先插入charset
        if (this.rules.charset) {
            sheet.rules.push(this.rules.charset);
            delete this.rules.charset;
        }
        // import 的，插入到第二位。
        this.imports.forEach(function (ipt) {
            sheet.rules.push(ipt);
        });
        // media 的，插入到第三位。
        this.medias.forEach(function (ipt) {
            sheet.rules.push(ipt);
        });
        // media 的，插入到第四位。
        this.keyframes.forEach(function (ipt) {
            sheet.rules.push(ipt);
        });
        for (var r in this.rules) {
            if (this.rules.hasOwnProperty(r)) {
                sheet.rules.push(this.rules[r]);
            }
        }
        this.stylesheet = sheet;
    },
    mergerAtRule: function (rule) {
        'use strict';
        return this.mergerAtImport(rule) || this.mergerMedia(rule) || this.mergerKeyframes(rule) || this.mergerAtCharset(rule);
    },
    mergerRule: function (rule) {
        'use strict';
        if (!rule.selectors) {
            return;
        }
        var self = this;
        rule.selectors.forEach(function (selector) {
            if (!self.rules[selector]) {
                self.rules[selector] = new Rule({
                    selectors: [selector],
                    declarations: tools.clone(rule.declarations, true)
                });
                return;
            }
            rule.declarations.forEach(function (declaration) {
                self.rules[selector].setDeclaration(declaration);
            });
        });
    },
    mergerKeyframes: function (rule) {
        'use strict';
        if (!rule.keyframes) {
            return;
        }
        this.keyframes.push(rule);
        return true;
    },
    mergerMedia: function (rule) {
        'use strict';
        if (!rule.media) {
            return;
        }
        var stylesheet = new Merger(rule);
        rule.rules = stylesheet.rules;
        this.medias.push(rule);
        return true;
    },
    mergerAtImport: function (rule) {
        'use strict';
        if (!rule['import']) {
            return;
        }
        this.imports.push(rule);
        return true;
    },
    mergerAtCharset: function (rule) {
        /**
         * 只能出现一个 charset，后面出现的charset会覆盖前一个charset。
         */
        'use strict';
        if (!rule.charset) {
            return;
        }
        this.rules.charset = rule;
        return true;
    }
};
module.exports = Merger;