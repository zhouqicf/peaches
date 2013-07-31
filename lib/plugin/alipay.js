var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('colorful').logging;
var request = require('request');
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
        username: 'liuqin.sheng',
        // 访问图片的url
        baseURI: 'https://i.alipay.com/',
        // 上传图片的URL
        uploadUrl: 'https://ecmng.alipay.com/home/uploadFile.json'
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
    upload: function (file, next) {
        'use strict';
        var self = this;
        // TODO: 性能优化
        var hashKey = md5(fs.readFileSync(file).toString());
        var hash = this.local.getHashCache(hashKey);
        if (hash[this.serverName]) {
            self.url = hash[this.serverName];
            return next(null, self.url);
        }
        var uploadUrl = url.parse(self.options.uploadUrl);
        uploadUrl.search = "?username=" + self.options.username + "&isImportance=0";
        var r = request.post(url.format(uploadUrl), function (err, rsp, body) {
            var result = JSON.parse(body);
            if (result.stat !== 'ok') {
                logger.error('文件上传失败：%s', result);
                return next(new Error('文件上传失败'));
            }
            var file = result.info[0];
            //uploadPath 会跟apimg目录，需要移除。
            self.url = file.uploadPath.replace('apimg/', '');
            self.url += file.newName;

            if (self.options.baseURI.slice(-1) !== '/') {
                self.options.baseURI += '/';
            }

            self.url = url.resolve(self.options.baseURI, self.url);

            var data = {};
            data[self.serverName] = self.url;
            self.local.updateHash(hashKey, data);
            next(null, self.url);
        });
        r.form().append('filedata', fs.createReadStream(file));
    }
};

module.exports = Server;