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
            newRule = {
                selectors: [selector],
                declarations: rule.declarations
            };
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
        return [rule];
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

module.exports = Merger;