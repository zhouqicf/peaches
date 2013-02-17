var Rule = require('./rule');
function Parse(cssText) {
    'use strict';
    if (!(this instanceof Parse)) {
        return new Parse(cssText);
    }
    this.cssText = cssText;
    return this._init();
}
Parse.prototype = {
    _init: function () {
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
        var rule = new Rule({
            selectors: sel,
            declarations: this.declarations()
        });
        return rule;
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
        var newDecl, decls = [];
        while (newDecl = this.declaration()) {
            // 合并相同的属性 开始...
            var isDuplicate = false;
            for (var i = 0, len = decls.length; i < len; i++) {
                var decl = decls[i];
                // 如果属性名不一致，则进入下一个属性。
                if (decl.property !== newDecl.property) {
                    continue;
                }
                // 属性名一致，需要判断有没有hack。
                // 如果是同一个属性名，且存在hack，但是不是同一个hack，则进入下一个属性
                if ((decl.hack || newDecl.hack) && decl.hack !== newDecl.hack) {
                    continue;
                }

                // 需要根据 important覆盖。
                //  如果新属性是 important，那么直接使用新属性的值。
                isDuplicate = true;
                if (newDecl.important || !decl.important) {
                    for (var o in decl) {
                        if (decl.hasOwnProperty(o)) {
                            decl[o] = newDecl[o];
                        }
                    }
                }
                // 其他情况，使用原有的值。
            }

            // 合并相同的属性 结束...

            // 没有重复属性的时候，插入新属性。
            if (!isDuplicate) {
                decls.push(newDecl);
            }

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


        var property = {
            property: prop,
            value: val
        };

        // important
        var important = /!important$/.test(val);
        // !important 前，空一格
        if (important) {
            property.value = val.replace(/\s*\!important/, ' !important');
            property.important = true;
        }

        var hack = Rule.prototype.isHack(val);
        if (hack !== false) {
            property.hack = hack;
        }
        return property;
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
        result['import'] = val;
        return result;
    },
    atCharset: function () {
        'use strict';
        return this._atRule('charset');
    }
};
module.exports = Parse;