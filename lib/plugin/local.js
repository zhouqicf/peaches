var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('colorful').logging;
var exec = require('child_process').exec;
var os = require('os');
var md5 = require('./../tools').md5;


function Server(name, config) {
    'use strict';
    var image, png8, png24;
    this.serverName = 'local';
    this.options = {
        format: 'png8',
        //png8后缀名
        png8ext: '-png8.png',
        png24ext: '.png',
        //sprite图片前缀
        prefix: 'sprite',
        //图片文件保存的目录
        root: __dirname,
        //图片将下载到这个目录
        tmp: __dirname,
        //访问图片的url
        baseURI: 'http://static.peaches.net/peaches/'
    };
    this.options = _.extend(this.options, config);
    png24 = this.options.prefix + '-' + name + this.options.png24ext;
    png8 = this.options.prefix + '-' + name + this.options.png8ext;
    this.name24 = path.join(this.options.root, png24);
    this.name = path.join(this.options.root, png8);

    if (this.options.baseURI.slice(-1) !== '/') {
        this.options.baseURI += '/';
    }

    if (this.options.format === 'png24') {
        this.url = this.options.baseURI + png24;
    }
    else {
        this.url = this.options.baseURI + png8;
    }

    //token 用于处理url是异步获取的情况，先用token占位，等获取url后，替换
    this.token = 'vjFBvKEGAZdHyoadfUpRbVPwohtjGxRuRtUBaajVGXGXTqthnz';
}
Server.prototype = {
    write: function (canvas, next) {
        'use strict';
        var self = this;
        var buffer = canvas.toBuffer();
        fs.writeFileSync(this.name24, buffer);

        // 当处理成png24时，不需要在做图片处理。
        if (this.options.format === 'png24') {
            next(null, this.name24);
        }
        else {
            self.png8(null, next);
        }
    },
    updateHash: function (hash, obj) {
        'use strict';
        var hashCache, file = path.join(process.env.PEACHES_HOME, 'hash.json');
        if (fs.existsSync(file)) {
            try {
                hashCache = require(file);
            }
            catch (e) {
                hashCache = {};
            }
        }
        else {
            hashCache = {};
        }

        var o = hashCache[hash] || {};
        hashCache[hash] = _.extend(o, obj);
        fs.writeFileSync(file, JSON.stringify(hashCache));
    },
    getHashCache: function (hash) {
        'use strict';
        var hashCache, file = path.join(process.env.PEACHES_HOME, 'hash.json');
        if (fs.existsSync(file)) {
            try {
                hashCache = require(file);
            }
            catch (e) {
                hashCache = {};
            }
        }
        else {
            hashCache = {};
        }
        return hashCache[hash] || {};
    },
    /**
     * png24 转化为 png8
     */
    png8: function (err, next) {
        'use strict';
        var pngquantLocal = path.join(__dirname, '../../bin/pngquant');
        var pngquant = 'pngquant';
        var command;
        switch (os.type()) {
            case 'Windows_NT':
                pngquantLocal = '"' + pngquantLocal + '.exe"';
                command = ' --iebug --ext ' + this.options.png8ext + ' --force --speed 1  -- "' + this.name24 + '"';
                break;
            case 'Linux':
                command = ' --iebug --ext ' + this.options.png8ext + ' --force --speed 1  -- ' + this.name24;
                break;
            default:
                command = ' --iebug --ext ' + this.options.png8ext + ' --force --speed 1 -- "' + this.name24 + '"';
                break;
        }
        var self = this;
        // 使用系统命令行执行
        exec(pngquant + command,
            function (err, stdout, stderr) {
                if (err) {
                    // 尝试使用自带的命令行执行。
                    return exec(pngquantLocal + command,
                        function (err, stdout, stderr) {
                            if (err) {
                                logger.error('png 处理错误：%s', err);
                            }
                            next(err, self.name);
                        });
                }
                return next(null, self.name);
            });
    }
};

module.exports = Server;