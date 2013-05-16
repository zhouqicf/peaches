#!/usr/bin/env node

var path = require('path'),
    async = require('async'),
    shelljs = require('shelljs'),
    logger = require('colorful').logging,
    fs = require('fs'),
    nodeStatic = require('node-static'),
    program = require('commander'),
    pkg = require('../package.json'),
    version = pkg.version,
    init = require('./init');

function list(val) {
    'use strict';
    return val.split(',');
}

program
    .version(version)
    .usage('[<a.css> [<b.css> ...]] [options]')
    .option('-m, --model <local/alipayobjects/scp/upyun>', '配置图片托管模式，默认为local模式', 'local')
    .option('-v, --verbose', '显示更多的日志信息')
    .option('-i, --input <file...>', '需要编译的css，以“,”分割,各文件将会被合并编译', list)
    .option('-o, --output <output>', '文件输出')
    .option('-q, --quiet', '显示较少的日志信息')
    .option('-p, --pkg <package.json>', '设置package.json的路径,默认使用当前目录下的package.json', './package.json')
    .option('-c, --clean', '清空缓存文件，系统会保留备份文件夹，不需要备份，请结合 --force参数使用')
    .option('-r, --autoReload', '设置是否根据文件的变更自动编译。默认为 false')
    .option('-s, --sort <h>', '设置图片的排列方式， h 为纵向排列，v 为横向排列。默认为h，纵向排列', 'h')
    .option('-f, --format <png8>', '设置图片输出格式，可以选择 png8  、 png24 。默认为 png8', 'png8')
    .option('-b, --beautify', '设置输出的样式文件，是否经过格式化，默认为未格式化')
    .option('--retina', '设置是否支持高清屏')
    .option('--cloud <server>', '使用云端模式，默认是用peaches.io');


program.on('--help', function () {
    'use strict';
    console.log('  1.关于图片托管模式（-m, --model <local/alipayobjects/scp/upyun>），请查看http://peaches.io/doc/image-model');
    console.log('');
    console.log('  一些例子:');
    console.log('');
    console.log('    1. 编译a.css到out.css');
    console.log('    $ peaches a.css -o out.css');
    console.log('    $ peaches -i a.css -o out.css');
    console.log('');
    console.log('    2. 合并a.css,b.css 并编译到到out.css');
    console.log('    $ peaches a.css b.css -o out.css');
    console.log('    $ peaches -i a.css,b.css -o out.css');
    console.log('');
    console.log('    3. 合并a.css,b.css 并编译到到out.css,并将图片上传到alipaycnd');
    console.log('    $ peaches a.css b.css -o out.css -m alipayobjects');
    console.log('');
    console.log('    4. 根据当前目录下的package.json 配置进行编译');
    console.log('    $ peaches');
    console.log('');
});

program.parse(process.argv);

var watchFileList = [], cli = require('../lib/cli');
function main() {
    'use strict';
    async.series([function (next) {
        /**
         * 配置logger
         */
        logger.config(program);
        next();
    }, function (next) {
        /**
         * 初始化配置
         */
        init(program, next);
    }, function (next) {
        
        program.pkg.version = version;
        next();
    }, function (next) {
        /**
         * 处理 format。
         * 1. 如果命令行中没有format，那么使用config的配置。
         * 2. 如果命令行中有format，那么覆盖config配置。
         * 3. 都没有设置，默认设置为 png8
         *
         */
        var formatList = ['png8', 'png24'];
        // 如果输入了 program.format ，覆盖配置
        if (typeof program.format !== 'undefined') {
            program.pkg.format = program.format;
        }

        if (formatList.indexOf(program.pkg.format) > -1) {
            // 如果 config.format 配置正确，next
            return next();
        }

        // 剩余的情况为：输入格式错误的情况，需要提醒用户。
        logger.warn('输入的图片 "' + program.pkg.format + '" 格式不正确，请选择：');
        program.choose(formatList, function (i) {
            program.confirm('您选择了将图片压缩为 "' + formatList[i] + '" 格式', function (ok) {
                if (!ok) {
                    logger.warn('退出');
                    process.exit(1);
                }

                program.pkg.format = formatList[i];
                next();
            });
        });

    }, function (next) {
        /**
         * 处理 图片排序。
         * 1. 如果命令行中没有sort，那么使用config的配置。
         * 2. 如果命令行中有sort，那么覆盖config配置。
         * 3. 都没有设置，默认设置为 h，纵向排序。
         */
        var sortList = ['h', 'v'];
        if (typeof program.sort !== 'undefined') {
            program.pkg.sort = program.sort;
        }

        if (sortList.indexOf(program.pkg.sort) > -1) {
            return next();
        }

        logger.warn('输入的图片排序 "' + program.pkg.sort + '" 格式不正确，请选择：');
        program.choose(sortList, function (i) {
            program.confirm('您选择了将图片图片排序为 "' + sortList[i] + '"', function (ok) {
                if (!ok) {
                    logger.warn('退出');
                    process.exit(1);
                }
                program.pkg.sort = sortList[i];
                next();
            });
        });
    }, function (next) {
        var modelList = ['local', 'alipayobjects', 'scp', 'upyun'];
        if (typeof program.model !== 'undefined') {
            program.pkg.model = program.model;
        }

        if (modelList.indexOf(program.pkg.model) > -1) {
            return next();
        }
        logger.warn('输入的图片托管模式 "' + program.pkg.model + '" 格式不正确，请选择：');
        program.choose(modelList, function (i) {
            program.confirm('您选择了将图片托管模式为 "' + modelList[i] + '"', function (ok) {
                if (!ok) {
                    logger.warn('退出');
                    process.exit(1);
                }
                program.pkg.model = modelList[i];
                next();
            });
        });
    }, function (next) {
        /**
         * 配置图片托管服务
         * 更新图片地址为绝对地址
         */
        var server = program.pkg.servers[program.pkg.model];
        server.root = path.resolve(process.env.PEACHES_HOME, server.root);
        server.tmp = path.resolve(process.env.PEACHES_HOME, server.tmp);
        program.pkg.server = server;
        switch (program.pkg.model) {
            case 'local':
                // 当使用local模式时，由于需要启动static服务器，所以开启autoReload，确保进程不终止；
                program.autoReload = true;

                if (server.port !== '80') {
                    logger.start('使用local模式，正在启动服务..');
                    logger.info('使用local模式，默认启动autoReload。帮助：http://peaches.io/doc/package#local');
                    var file = new (nodeStatic.Server)(server.root);
                    require('http').createServer(function (request, response) {
                        file.serve(request, response);
                    }).listen(server.port,function () {
                            logger.end('local模式启动完毕,%s', server.baseURI);
                        }).on('error', function (err) {
                            if (err && err.code === 'EADDRINUSE') {
                                logger.error('端口号：%s 被占用。静态服务器无法启动', server.port);
                                logger.info('是否还有另外一个Peaches在运行？');
                                process.exit(1);
                            }
                        });
                }
                break;
            case 'upyun':
                if (server.username === '' || server.password === '' || server.bucket === '') {
                    logger.error('upyun 没有配置完整，请参考 http://peaches.io/doc/package#upyun 配置');
                    process.exit(1);
                }
                break;
            case 'scp':
                if (server.server === '') {
                    logger.error('scp 没有配置完整，请参考 http://peaches.io/doc/package#scp 配置');
                    process.exit(1);
                }
                break;
            case 'alipayobjects':
                if (server.username === '') {
                    logger.error('alipayobjects 没有配置完整，请参考 http://peaches.io/doc/package#alipayobjects 配置');
                    process.exit(1);
                }
                break;
        }
        next();
    }, function (next) {
        if (typeof program.autoReload !== 'undefined') {
            program.pkg.autoReload = program.autoReload;
        }
        if (typeof program.beautify !== 'undefined') {
            program.pkg.beautify = true;
        }
        if (typeof program.cloud !== 'undefined') {
            program.pkg.cloud = program.cloud;
            logger.info('云端模式：', program.pkg.cloud);
        }
        next();
    }, function (next) {
        /**
         * 全部转换为绝对路径
         */
        var baseDir = shelljs.pwd(),
            o, dist, output2 = {};

        // 如果传了参数则不读取 package.json 的 output
        // 支持 peaches b.css a.css -o c.css
        if (program.args.length > 0) {
            program.input = program.args;
        }
        if (program.input && program.input.length) {
            dist = program.output ?
                path.resolve(baseDir, program.output) : '';

            output2[dist] = [];
            for (var i in program.input) {
                if (program.input.hasOwnProperty(i)) {
                    output2[dist].push(path.resolve(baseDir, program.input[i]));
                }
            }
        } else {
            for (o in program.pkg.output) {
                if (program.pkg.output.hasOwnProperty(o)) {
                    dist = path.join(baseDir, o);
                    output2[dist] = [];
                    program.pkg.output[o].forEach(function (src) {
                        output2[dist].push(path.join(baseDir, src));
                    });
                }
            }
        }

        program.pkg.output = output2;

        next();

    }, function (next) {
        /**
         * 创建目录
         * */
        if (!fs.existsSync(program.pkg.server.root)) {
            try {
                shelljs.mkdir('-p', program.pkg.server.root);
            }
            catch (e) {
                logger.error('无法创建目录：%s', program.pkg.server.root);
                process.exit(1);
            }
        }
        if (!fs.existsSync(program.pkg.server.tmp)) {
            try {
                shelljs.mkdir('-p', program.pkg.server.tmp);
            }
            catch (e) {
                logger.error('无法创建目录：%s', program.pkg.server.tmp);
                process.exit(1);
            }
        }
        next();
    }
    ], function () {

        program.pkg.clean = program.clean;
        if (typeof program.retina !== "undefined") {
            program.pkg.retina = program.retina;
        }
        logger.info('支持Retina显示')
        cli.main(program.pkg);

        if (program.autoReload) {
            watchOutput();

            fs.watchFile(program.pkg, function (curr, prev) {
                if (curr.mtime.getTime() !== prev.mtime.getTime()) {
                    program.pkg = {};
                    watchFileList.forEach(function (file) {
                        fs.unwatchFile(file, watchFile);
                    });
                    watchFileList = [];
                    watchOutput();
                    main();
                }
            });
        }
    });
}


// 当CSS文件变更时，自动编译 开始。。。
function watchFile(curr, prev) {
    'use strict';
    if (curr.mtime.getTime() !== prev.mtime.getTime()) {
        cli.main(program.pkg);
    }
}
function watchOutput() {
    'use strict';
    for (var o in program.pkg.output) {
        if (program.pkg.output.hasOwnProperty(o)) {
            program.pkg.output[o].forEach(function (cssFile) {
                watchFileList.push(cssFile);
                fs.watchFile(cssFile, watchFile);
            });
        }
    }
}

exports.main = main;



