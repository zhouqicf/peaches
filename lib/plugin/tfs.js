var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var logger = require('colorful').logging;
var request = require('request');
var url = require('url');
var md5 = require('./../tools').md5;

var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var FormData = require('form-data');

/**
 * 通用POST提交文件上传
 * @param name
 * @param config
 * @constructor
 */
function Server(name, config) {
    'use strict';
    logger.info(name);
    this.serverName = 'tfs';
    this.options = {
        "cookie": "v=0; uc1=lltime=1376044580&cookie14=UoLbuUBoM0nAdw%3D%3D&existShop=false&cookie16=U%2BGCWk%2F74Mx5tgzv3dWpnhjPaQ%3D%3D&cookie21=WqG3DMC9EA%3D%3D&tag=0&cookie15=U%2BGCWk%2F75gdr5Q%3D%3D; tg=0; _cc_=V32FPkk%2Fhw%3D%3D; t=801e67b3a929cfe6a909333adab341d8; _nk_=%5Cu95ED%5Cu6708; _l_g_=Ug%3D%3D; tracknick=%5Cu95ED%5Cu6708; sg=%E6%9C%8841; lgc=%5Cu95ED%5Cu6708; lastgetwwmsg=MTM3NjA0NTU1MQ%3D%3D; mt=np=; cna=NLaLCrSCXS0CASp4SwI8E1MX; lzstat_uv=8121252652312243633|1296239@2225939; lzstat_ss=1241386418_0_1376077576_1296239|1655904910_0_1376077576_2225939; cmsTbToken=%2C7a75dbee1b43%2357008483412802002%2C13e6e16178e8%2357008495506653002%2Cfd1636b4e3e03%2357008590069327709%2Ce3e58b5bdb151%2357009098824303709%2C3bee9e46e13e5%236408034933565157%2C51e15eebbde5b%237251715230522220%2C5f5865de9ee95%237251793346041220%2Cfe18b388f875d%236409140592791157",
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
        var self = this;

        request.get(self.options.inputUrl, {
            encoding: null,
            headers: self.getHeader(),
            jar: request.jar().add(request.cookie(self.options.cookie))
        }, function (err, rsp, body) {
            if (err) {
                logger.error(err);
                return next(err);
            }
            var encode = 'utf-8';
            var content_type = rsp.headers['content-type'] || '';

            var match = content_type.match(/charset=(.*)$/);
            if (match) {
                encode = match[1];
            }
            page = iconv.decode(body, encode).trim();
            $ = cheerio.load(page);
            var inputs = {};
            $('#J_UploadForm input').each(function (idx, input) {
                switch (input.attribs.name) {
                    case 'nick':
                        inputs['nick'] = encodeURIComponent(input.attribs.value);
                        break;
                    case 'force_opt':
                        inputs['force_opt'] = encodeURIComponent(1);
                        break;
                    default:
                        inputs[input.attribs.name] = input.attribs.value;
                        break;
                }

            });
            next(null, inputs);
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
                'Filename': path.basename(file_path),
                'Upload': 'Submit Query',
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