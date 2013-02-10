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
        this.stylesheet = this.parse();
        this.stylesheet = this.splitSelector();
        this.stylesheet = this.mergerProp();
    },
    parse: function () {
        'use strict';
        return parse(this.cssText);
    },
    splitSelector: function () {
        'use strict';
        return splitSelector(_.clone(this.stylesheet));
    },
    mergerProp: function () {
        'use strict';
        return mergerProp(_.clone(this.stylesheet));
    },
    toString: function () {
        'use strict';
        return stringify(this.stylesheet).toString();
    }
};

module.exports = POM;
