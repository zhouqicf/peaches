var Rule = require('./rule');
var tools = require('../tools');
function Split(stylesheet) {
    'use strict';
    if (!(this instanceof Split)) {
        return new Split(stylesheet);
    }
    this.stylesheet = stylesheet;
    return this._init();
}
Split.prototype = {
    MATCH_ACTION: [
        {
            //background:none  时，不做处理。
            regexp: /^none$/i,
            exec: function (rule, match, idx) {
                'use strict';
            }
        },
        {
            //background-image
            regexp: /\b(url\(['"]?([^\)\'\"]+)['"]?\))/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-image',
                    // 统一使用 url(xx.png)这种形式，去掉引号。
                    value: 'url(' + match[2] + ')'
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-repeat
            regexp: /((no-repeat)|(repeat-x)|(repeat-y)|(repeat))/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-repeat',
                    value: match[1]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-attachment 属性设置背景图像是否固定或者随着页面的其余部分滚动。
            regexp: /\b(fixed|scroll)\b/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-attachment',
                    value: match[1]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-clip 用来判断 background 是否包含 border 区域。
            //而 background-origin 用来决定 background-position 计算的参考位置。
            //使用简写的时候 origin 是比 clip 优先的
            regexp: /(\b(border|padding|content)-box)\b/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-origin',
                    value: match[1]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-clip
            regexp: /(\b(border|padding|content)-box)\b/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-clip',
                    value: match[1]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-color: #fff
            regexp: /(^#([0-9a-f]{3}|[0-9a-f]{6})\b)/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-color',
                    value: match[1]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-color: rgb()
            regexp: /rgb\((\s*(1[0-9]{2}|2[0-4][0-9]|25[0-5]|[1-9][0-9]|[0-9])\s*,){2}\s*(1[0-9]{2}|2[0-4][0-9]|25[0-5]|[1-9][0-9]|[0-9])\s*\)/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-color',
                    value: match[0]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-color: rgba()
            regexp: /(\brgba\((\s*(1[0-9]{2}|2[0-4][0-9]|25[0-5]|[1-9][0-9]|[0-9])\s*,){3}\s*(0?\.[0-9]+|[01])\s*\))/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-color',
                    value: match[0]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-color: color-name
            //W3C 的 HTML 4.0 标准仅支持 16 种颜色名, 加上 orange + transparent 一共 18 种
            regexp: /\b(aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|purple|red|silver|teal|white|yellow|orange|transparent)\b/i,
            exec: function (rule, match, idx) {
                'use strict';
                var declaration = {
                    property: 'background-color',
                    value: match[0]
                };
                rule.setDeclaration(declaration, idx);
            }
        },
        {
            //background-position
            //两个值都设定的情况.
            regexp: /((-?\d+(%|in|cm|mm|em|ex|pt|pc|px))|0|center|left|right)\s+((-?\d+(%|in|cm|mm|em|ex|pt|pc|px))|0|center|top|bottom)/i,
            exec: function (rule, match, idx) {
                'use strict';
                Split.prototype._updatePositionAction(rule, match[0], idx);
            }
        },
        {
            //background-position
            //设定单个值的情况. 浏览器会默认设置第二个值 50%,这里不推荐这样写.
            // 由于rgb中会含有0，等字符，所以这里将 position 放到最后面匹配
            regexp: /\b((-?\d+(%|in|cm|mm|em|ex|pt|pc|px))|0|center|left|right)\b/,
            exec: function (rule, match, idx) {
                'use strict';
                //position值为left时处理成0
                if (match[0] === 'left') {
                    match[0] = '0';
                }
                var declaration = {
                    property: 'background-position',
                    value: match[0] + ' 50%'
                };
                rule.setDeclaration(declaration, idx);
            }
        }
    ],
    _init: function () {
        'use strict';
        this.split();
        this.updatePosition();
        return this.stylesheet;
    },
    _updatePositionAction: function (rule, value, idx) {
        'use strict';
        var cur = value.split(/\s+/);
        if (cur[0] === 'left') {
            cur[0] = '0';
        }
        if (cur[0] === '100%') {
            cur[0] = 'right';
        }
        if (cur[1] === 'top') {
            cur[1] = '0';
        }
        if (cur[1] === '100%') {
            cur[1] = 'bottom';
        }
        var declaration = {
            property: 'background-position',
            value: cur.join(' ')
        };
        rule.setDeclaration(declaration, idx);
    },
    updatePosition: function () {
        'use strict';
        var self = this;
        this.stylesheet.rules.forEach(function (rule, idx) {
            //  如果不是一个普通的样式定义 rule
            if (!rule.getDeclarationValue) {
                return;
            }
            var value = rule.getDeclarationValue('background-position');
            if (value.length === 1) {
                self._updatePositionAction(rule, value[0]);
            }
        });
    },
    split: function () {
        'use strict';
        var self = this;
        this.stylesheet.rules.forEach(function (rule, idx) {
            var rules = self.splitAtRule(rule) || self.splitRule(rule);
        });
        //this.stylesheet = sheet;
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

        var backgrounds = rule.getDeclarationValue('background');
        if (backgrounds.length !== 1) {
            return;
        }
        var self = this;
        //TODO: 处理多个背景
        var background = backgrounds[0], match, matched = false,
            backgroundIdx = rule.getDeclarationValueIndex('background')[0];
        // 如果设置那个 background:none,则不处理。
        if (background === 'none') {
            return;
        }
        this.MATCH_ACTION.forEach(function (action) {
            match = background.match(action.regexp);
            if (match) {
                // 引用值rule，发生变更。
                action.exec.call(self, rule, match, backgroundIdx);
                //移除已经匹配到的属性；
                background = background.replace(action.regexp, '');
                matched = true;
            }
        });
        if (matched) {
            rule.removeDeclaration('background');
        }
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
module.exports = Split;

