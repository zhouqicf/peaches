/**
 * 正则表达式 速查 http://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F
 */
var parse = require('./parse');
var splitSelector = require('./splitSelector');
var stringify = require('./stringify');
var mergerProp = require('./mergerProp');

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
        this._action();
    },
    _action: function () {
        'use strict';
        this.parse();
        this.splitSelector();
        this.mergerProp();
    },
    parse: function () {
        'use strict';
        if (this._isParsed) {
            return this.stylesheet;
        }
        this._isParsed = true;
        this.stylesheet = parse(this.cssText);
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
        this._action();
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
        this._action();
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
            rule = {
                selectors: [selector],
                declarations: [
                    {
                        property: prop,
                        value: value
                    }
                ]
            };
        }


    },
    removeDeclaration: function (selector, prop) {
        'use strict';
        this._action();

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
        if (this.isPropMergerd) {
            return this.stylesheet;
        }
        this.stylesheet = mergerProp(_.clone(this.stylesheet));
        return this.stylesheet;
    },
    toString: function () {
        'use strict';
        return stringify(this.stylesheet).toString();
    }
}
;

module.exports = POM;
