var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('colorful').logging;
var request = require('request');
var url = require('url');
var md5 = require('./../tools').md5;
var tfs = require('peaches-tfs');


/**
 * 通用POST提交文件上传
 * @param name
 * @param config
 * @constructor
 */
function Server(name, config) {
    'use strict';
    this.serverName = 'tfsdaily';

    var Local = require('./local');
    this.local = new Local(name, config);
    this.options = {}
    this.options = _.extend(this.options, this.local.options);
    this.token = 'VthzsGLDFhkRxXhmRhazF6L1279fAk4PWZ5tnsNtyXymyFFBjEHeEyzBMQvYEtypFz';
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


        var client = tfs.createClient({
            //appkey: '5201dc77ae7a4',
            //rootServer:'restful-store.vip.tbsite.net:3800',
            appkey: 'tfscom',
            rootServer: 'restful-store.daily.tbsite.net:3800',
            imageServers: [
                'img01.daily.taobaocdn.net',
                'img02.daily.taobaocdn.net'
            ]
        });

        client.on('refreshError', function (err) {
            throw err;
        });

        client.on('ready', function () {
            logger.info('上传图片到 tfs daily ')
            client.upload(file_path, path.extname(file_path), function (err, info) {
                self.url = info.url;
                var data = {};
                data[self.serverName] = self.url;
                self.local.updateHash(hashKey, data);
                client.clear();
                logger.debug('上传图片到 tfs daily url=', self.url);
                next(err, self.url);
            });
        });
    }
};

module.exports = Server;