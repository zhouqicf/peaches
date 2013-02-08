/**
 * 正则表达式 速查 http://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F
 */
var parse = require('./parse');
var merger = require('./merger');
function POM(cssText) {
    'use strict';
    this.cssText = cssText;
    this._init();
}

POM.prototype = {
    toString: function () {
        'use strict';
    },
    _init: function () {
        'use strict';
        //移除注释
        this.cssText = this.cssText.replace(/\/\*(.|\n)*?\*\//g, '');
        //移除第一行的空格
        this.cssText = this.cssText.replace(/^\s+/g, '');
        // 替换多个空格为一个空格
        this.cssText = this.cssText.replace(/\s+/g, ' ');
        this.stylesheet = this.parse();
        this.stylesheet = this.merger();
    },
    parse: function () {
        'use strict';
        return parse(this.cssText);
    },
    merger: function(){
        'use strict';
        return merger(this.stylesheet);
    }
};

module.exports = POM;
