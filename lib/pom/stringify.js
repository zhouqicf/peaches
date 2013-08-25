var logger = require('colorful').logging;
function Stringify(stylesheet) {
    'use strict';
    if (!(this instanceof Stringify)) {
        return new Stringify(stylesheet);
    }
    this.stylesheet = stylesheet;
    this.errors = [];
    return this.toString();
}

Stringify.prototype = {
    toString: function () {
        'use strict';
        var rules = this.stylesheet.rules, self = this;
        var charset = [], importRules = [], selectorsRules = [];
        rules.forEach(function (rule, idx) {
            if (rule.charset) {
                charset.push('@charset ' + rule.charset + ';');
            } else if (rule['import']) {
                importRules.push('@import ' + rule['import'] + ';');
            } else if (rule.selectors) {
                selectorsRules.push(self.getSelectors(rule.selectors, rule.declarations));
            } else if (rule.media) {  // 有设备检测时
                var rText = '';
                rule.rules.forEach(function (r, i) {
                    rText += self.getSelectors(r.selectors, r.declarations);
                });
                selectorsRules.push('@media ' + rule.media + '{' + rText + '}');
            } else if (rule.keyframes) {
                var keyText = '', vendor = rule.vendor || '', name = rule.name;
                rule.keyframes.forEach(function (r, i) {
                    keyText += self.getSelectors(r.values, r.declarations);
                });
                selectorsRules.push('@' + vendor + 'keyframes ' + name + '{' + keyText + '}');
            }
        });
        var styleRules = charset.join('') + importRules.join('') + selectorsRules.join('');
        return styleRules;

    },
    getSelectors: function (selectors, declarations) {
        'use strict';
        var declaration = '';
        try {
            declarations.forEach(function (decl, idx) {
                if (decl.property && decl.value) {
                    declaration += decl.property + ':' + decl.value + ';';
                }
            });
        }
        catch (e) {
            logger.error('请关注 %s 样式是否正确', selectors);
            this.errors.push('请关注 ' + selectors + ' 样式是否正确');
        }
        // 选择器之间，增加一个空格
        return selectors.join(', ') + '{' + declaration + '}';
    }
};

module.exports = Stringify;