/**
 * 正则表达式 速查 http://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F
 */
var parse = require('./parse');
var splitSelector = require('./splitSelector');
var stringify = require('./stringify');
var minify = require('./minify');

var mergerProp = require('./mergerProp');
var splitBackground = require('./splitBackground');
var Rule = require('./rule');
var _ = require('underscore');
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
    },
    split: function () {
        'use strict';
        this.splitSelector();
        this.mergerProp();
        this.splitBackground();
    },
    parse: function () {
        'use strict';
        if (!this.stylesheet) {
            this.stylesheet = parse(this.cssText);
        }
        this.stylesheet.rules.forEach(function (rule) {
            if (!rule.media) {
                return;
            }
            var pom = new POM();
            pom.stylesheet = {
                rules: rule.rules
            };
            rule.rules = pom.parse().rules;
        });
        this.split();
        return this.stylesheet;
    },
    /**
     * 获取选择器属性值
     * @param selector 选择器
     * @param prop 属性名
     * @return {Array} 属性值列表
     */
    getDeclarationValue: function (selector, prop) {
        'use strict';
        var rule;
        for (var i = 0, len = this.stylesheet.rules.length; i < len; i++) {
            rule = this.stylesheet.rules[i];
            if (!rule.selectors || rule.selectors[0] !== selector) {
                rule = null;
                continue;
            }
            break;
        }
        if (!rule) {
            return null;
        }
        return rule.getDeclarationValue(prop);
    },
    setDeclarationValue: function (selector, prop, value) {
        'use strict';
        var rule;
        for (var i = 0, len = this.stylesheet.rules.length; i < len; i++) {
            rule = this.stylesheet.rules[i];
            if (!rule.selectors || rule.selectors[0] !== selector) {
                rule = null;
                continue;
            }
            break;
        }
        if (!rule) {
            rule = new Rule({
                selectors: [selector],
                declarations: [
                    {
                        property: prop,
                        value: value
                    }
                ]
            });
            this.stylesheet.rules.push(rule);
        }
    },
    removeDeclaration: function (selector, prop) {
        'use strict';
    },
    splitSelector: function () {
        'use strict';
        if (this._selectorSplited) {
            return this.stylesheet;
        }
        this._selectorSplited = true;
        this.stylesheet = splitSelector(_.clone(this.stylesheet));
        return this.stylesheet;
    },
    mergerProp: function () {
        'use strict';
        if (this._isPropMergerd) {
            return this.stylesheet;
        }
        this._isPropMergerd = true;
        this.stylesheet = mergerProp(_.clone(this.stylesheet));
        return this.stylesheet;
    },
    splitBackground: function () {
        'use strict';
        if (this.isBackgroundSplited) {
            return this.stylesheet;
        }
        this.isBackgroundSplited = true;
        this.stylesheet = splitBackground(_.clone(this.stylesheet));
        return this.stylesheet;
    },
    toString: function (isMinify) {
        'use strict';
        if (isMinify) {
            this.minify();
        }
        return stringify(this.stylesheet).toString();
    },
    minify: function () {
        'use strict';
        this.stylesheet = minify(this.stylesheet);
        return this.stylesheet;
    }
};

module.exports = POM;
