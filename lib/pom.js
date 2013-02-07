/**
 * 正则表达式 速查 http://zh.wikipedia.org/wiki/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F
 */

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
    },
    parse: function () {
        'use strict';
        if (!this.stylesheet) {
            this.stylesheet = { rules: this.rules() };
        }
        return this.stylesheet;
    },
    match: function (re) {
        'use strict';
        var m = re.exec(this.cssText);
        if (!m) {
            return;
        }
        this.cssText = this.cssText.slice(m[0].length);
        return m;
    },
    open: function () {
        'use strict';
        return this.match(/^\{\s*/);
    },
    close: function () {
        'use strict';
        return this.match(/^\}\s*/);
    },
    rules: function () {
        'use strict';
        var node, rules = [];
        while (this.cssText[0] !== '}' && (node = this.atRule() || this.rule())) {
            rules.push(node);
        }
        return rules;
    },
    rule: function () {
        'use strict';
        var sel = this.selector();
        if (!sel) {
            return;
        }
        return {
            selectors: sel,
            declarations: this.declarations()
        };
    },
    selector: function () {
        'use strict';
        var m = this.match(/^([^{]+)/);
        if (!m) {
            return;
        }
        m = m[0];
        return m.trim().split(/\s*,\s*/);
    },
    declarations: function () {
        'use strict';
        if (!this.open()) {
            return;
        }

        // declarations
        var decl, decls = [];
        while (decl = this.declaration()) {
            decls.push(decl);
        }
        if (!this.close()) {
            return;
        }

        return decls;
    },
    declaration: function () {
        'use strict';
        var prop = this.match(/^(\*?[\-\w]+)\s*/);
        if (!prop) {
            return;
        }
        prop = prop[0].trim();

        // :
        if (!this.match(/^:\s*/)) {
            return;
        }
        // val
        var val = this.match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)\s*/);
        if (!val) {
            return;
        }
        val = val[0].trim();
        // ;
        this.match(/^[;\s]*/);

        // important
        var important = /!important$/.test(val);
        // !important 前，空一格
        if (important) {
            val = val.replace(/\s*\!important/, ' !important');
        }
        return {
            property: prop,
            value: val,
            important: important
        };
    },
    atRule: function () {
        'use strict';
        return this.keyframes() || this.media() || this.atImport() || this.atCharset();
    },
    _atRule: function (name) {
        'use strict';
        var m = this.match(new RegExp('^@' + name + ' *([^;\\n]+);\\s*'));
        if (!m) {
            return;
        }
        var ret = {};
        ret[name] = m[1].trim();
        return ret;
    },
    keyframes: function () {
        'use strict';
        var m = this.match(/^@([\-\w]+)?keyframes\s*/);
        if (!m) {
            return;
        }

        var vendor = m[1];
        // identifier
        m = this.match(/^([\-\w]+)\s*/);
        if (!m) {
            return;
        }

        var name = m[1];
        if (!this.open()) {
            return;
        }
        var frame;
        var frames = [];
        while (frame = this.keyframe()) {
            frames.push(frame);
        }

        if (!this.close()) {
            return;
        }

        return {
            name: name,
            vendor: vendor,
            keyframes: frames
        };
    },
    keyframe: function () {
        'use strict';
        var m, vals = [];

        while (m = this.match(/^(from|to|\d+%|\.\d+%|\d+\.\d+%)\s*/)) {
            vals.push(m[1]);
            this.match(/^,\s*/);
        }

        if (!vals.length) {
            return;
        }

        return {
            values: vals,
            declarations: this.declarations()
        };
    },
    media: function () {
        'use strict';
        var m = this.match(/^@media\s*([^{]+)/);
        if (!m) {
            return;
        }

        if (!this.open()) {
            return;
        }

        var style = this.rules();
        if (!this.close()) {
            return;
        }

        return { media: m[1].trim(), rules: style };
    },
    atImport: function () {
        'use strict';
        var result = this._atRule('import');
        if (!result) {
            return;
        }
        var val = result['import'];
        var url = result['import'].match(/\burl\(([^\)]+)\)/i);
        if (url) {
            val = val.replace(url[0], url[1]);
        }
        val = val.replace(/\'/g, '"');
        result['import'] = val;
        return result;
    },
    atCharset: function () {
        'use strict';
        return this._atRule('charset');
    }
};

module.exports = POM;
