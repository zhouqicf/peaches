var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('colorful').logging;
var FormData = require('form-data');
var url = require('url');
var md5 = require('./../tools').md5;
/**
 * 通用POST提交文件上传
 * @param name
 * @param config
 * @constructor
 */
function Server(name, config) {
    'use strict';
    this.serverName = 'alipay';
    this.options = {
        bizName: '',
        token: ''
    };
    var Local = require('./local');
    this.local = new Local(name, config);
    this.options = _.extend(this.options, this.local.options);
    this.token = 'VthzsGLDFhkRxXhmRhazFsNtyXymyFFBjEHeEyzBMQvYEtypFz';
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

        var form = new FormData();

        form.append('bizName', self.options.bizName);
        form.append('token', self.options.token);
        form.append('filedata', fs.createReadStream(file_path));
        form.submit('https://ecmng.alipay.com/home/uploadFile.json', function (err, res) {
            var body = '';
            res.on('data', function (data) {
                body += data.toString();
            });
            res.on('end', function () {
                var result = JSON.parse(body.toString());
                if (!result.cdn) {
                    return next(new Error(result));
                }
                self.url = result.cdn;
                var data = {};
                data[self.serverName] = self.url;
                self.local.updateHash(hashKey, data);
                next(null, self.url);
            });
        });
    }
};

module.exports = Server;