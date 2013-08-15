function Rule(rule) {
    'use strict';
    this.selectors = rule.selectors || [];
    this.declarations = rule.declarations || {};
    if (rule.media) {
        this.media = rule.media;
    }
    //设置该规则是否需要被peaches。
    // false时，不显示赋值
    //this.isPeaches = false;
}
Rule.prototype = {
    getSelectorText: function () {
        'use strict';
        return this.selectors.join(',');
    },
    setDeclarationValue: function (prop, value) {
        'use strict';
        this.setDeclaration({
            property: prop,
            value: value
        });
    },
    setDeclaration: function (declaration) {
        'use strict';
        var isDuplicate = false;
        for (var i = 0, len = this.declarations.length; i < len; i++) {
            var decl = this.declarations[i];
            // 如果属性名不一致，则进入下一个属性。
            if (decl.property !== declaration.property) {
                continue;
            }
            // 属性名一致，需要判断有没有hack。
            // 如果是同一个属性名，且存在hack，但是不是同一个hack，则进入下一个属性
            if ((decl.hack || declaration.hack) && decl.hack !== declaration.hack) {
                continue;
            }

            // 需要根据 important覆盖。
            //  如果新属性是 important，那么直接使用新属性的值。
            isDuplicate = true;
            if (declaration.important || !decl.important) {
                for (var o in decl) {
                    if (decl.hasOwnProperty(o)) {
                        decl[o] = declaration[o];
                    }
                }
            }
            // 其他情况，使用原有的值。
        }

        // 合并相同的属性 结束...

        // 没有重复属性的时候，插入新属性。
        if (!isDuplicate) {
            this.declarations.push(declaration);
        }

    },
    getDeclarationValue: function (prop) {
        'use strict';
        var declaration, values = [];
        for (var i = 0, len = this.declarations.length; i < len; i++) {
            declaration = this.declarations[i];
            if (declaration.property === prop) {
                values.push(declaration.value);
            }
        }
        return values;
    },
    removeDeclaration: function (prop) {
        /**
         * 注意：仅移除第一个
         */
        'use strict';
        var declaration, declarations = [];
        for (var i = 0, len = this.declarations.length; i < len; i++) {
            declaration = this.declarations[i];
            if (declaration.property !== prop) {
                declarations.push(declaration);
            }
        }
        this.declarations = declarations;
    },
    isHack: function (value) {
        'use strict';
        var hack = false;
        if (value.match(/\\9\\0$/)) {
            hack = 'ie9';
        }
        else if (value.match(/\\0$/)) {
            hack = 'ie8';
        }
        else if (value.match(/\\9$/)) {
            hack = 'ie*';
        }
        else if (value.match(/^-moz-/)) {
            hack = '-moz-';
        }
        else if (value.match(/^-webkit-/)) {
            hack = '-webkit-';
        }
        else if (value.match(/^-o-/)) {
            hack = '-o-';
        }
        else if (value.match(/^-ms-/)) {
            hack = '-ms-';
        }
        // 特殊的css3属性 当成hack处理。
        else if (value.match(/linear-gradient/)) {
            hack = 'linear-gradient';
        }
        return hack;
    }
};

module.exports = Rule;