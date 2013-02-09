/**
 * 正则表达式 速查 http://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F
 */
var parse = require('./parse');
var splitSelector = require('./splitSelector');
function POM(cssText) {
    'use strict';
    this.cssText = cssText || '';
    this._init();
}

POM.prototype = {
    _init: function () {
        'use strict';
        //移除注释
        this.cssText = this.cssText.replace(/\/\*(.|\n)*?\*\//g, '');
        //移除第一行的空格
        this.cssText = this.cssText.replace(/^\s+/g, '');
        // 替换多个空格为一个空格
        this.cssText = this.cssText.replace(/\s+/g, ' ');
        this.stylesheet = this.parse();
        this.stylesheet = this.splitSelector();
    },
    parse: function () {
        'use strict';
        return parse(this.cssText);
    },
    splitSelector: function () {
        'use strict';
        return splitSelector(this.stylesheet);
    },
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

        declarations.forEach(function (decl, idx) {
            if (decl.property && decl.value) {
                declaration += decl.property + ':' + decl.value + ';';
            }
        });
        return selectors + '{' + declaration + '}';
    }
};

module.exports = POM;
