var _ = require('underscore');

function md5(str) {
    'use strict';
    var hash = require('crypto').createHash('md5');
    return hash.update(str.toString()).digest('hex');
}
exports.md5 = md5;

function trimAll(string) {
    'use strict';
    return string.replace(/^\s+|(\s+(?!\S))/mg, "");
}

exports.trimAll = trimAll;

function _clone(obj, depth) {
    'use strict';
    if (typeof obj !== 'object') {
        return obj;
    }
    var clone = _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    if (!_.isUndefined(depth) && (depth > 0)) {
        for (var key in clone) {
            if (clone.hasOwnProperty(key)) {
                clone[key] = _.clone(clone[key], depth - 1);
            }
        }
    }
    return clone;
}

exports.clone = _clone;