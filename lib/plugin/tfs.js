var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('colorful').logging;
var url = require('url');
var md5 = require('./../tools').md5;

var FormData = require('form-data');

/**
 * 通用POST提交文件上传
 * @param name
 * @param config
 * @constructor
 */
function Server(name, config) {
    'use strict';
    this.serverName = 'tfs';
    this.options = {
        "cookie": "",
        "inputUrl": "http://tps.tms.taobao.com/photo/index.htm?spm=0.0.0.22.ojwxli",
        "uploadUrl": "http://tps.tms.taobao.com/photo/upload.htm?_input_charset=utf-8"
    };
    var Local = require('./local');
    this.local = new Local(name, config);
    this.options = _.extend(this.options, this.local.options);
    this.token = 'VthzsGLDFhk9135926801634412082yFFBjEHeEyzBMQvYEtypFz';
    this._init();
}
Server.prototype = {
    _init: function () {
        'use strict';
    },
    write: function (canvas, next) {
        'use strict';
        var self = this;

        this.local.write(canvas, function (err, file) {
            self.upload(file, next);
        });

    },
    getHeader: function () {
        var self = this;
        var header = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Accept-Language': 'zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0',
            'Referer': 'http://tps.tms.taobao.com/photo/index.htm?spm=0.0.0.0.PADji2',
            "cookie": self.options.cookie
        };
        return header;
    },
    getParamsFormPage: function (next) {
        next(null, {
            nick: encodeURIComponent('蔡伦'),
            session_id: '012345678' //session_id要传超过8位的任意数字
        });
    },
    upload: function (file_path, next) {
        'use strict';
        var self = this;
        // TODO: 性能优化
        var hashKey = md5(fs.readFileSync(file_path).toString());
        var hash = this.local.getHashCache(hashKey);
        if (hash[this.serverName]) {
            self.url = hash[this.serverName];
            return next(null, self.url);
        }

        self.getParamsFormPage(function (err, params) {
            if (err) {
                return next(err);
            }
            var form = new FormData();
            params = _.extend(params, {
                'photo': fs.createReadStream(file_path)
            });
            for (var o in params) {
                form.append(o, params[o]);
            }
            form.submit(url.parse(self.options.uploadUrl), function (err, res) {
                var body = '';
                res.on('data', function (data) {
                    body += data.toString();
                });
                res.on('end', function () {
                    var result = JSON.parse(body.toString());
                    if (!result.url) {
                        return next(new Error(result.msg));
                    }
                    self.url = result.url;
                    var data = {};
                    data[self.serverName] = self.url;
                    self.local.updateHash(hashKey, data);
                    next(null, self.url);
                });
            });
        });
    }
};

module.exports = Server;