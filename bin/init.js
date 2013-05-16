var path = require('path');
var fs = require('fs');
var shelljs = require('shelljs');
var _ = require('underscore');
var logger = require('colorful').logging;


function init(program, next) {
    'use strict';
    var pkg = program.pkg;
    var defaultPkg = initPeachesHome();
    // 设置pkg为系统默认配置
    try {
        program.pkg = require(defaultPkg);
    }
    catch (e) {
        logger.error('%s 格式似乎有点问题，请检查一下！', defaultPkg);
        process.exit(1);
    }

    if (pkg !== './package.json') {
        pkg = path.resolve(pkg);
        try {
            pkg = fs.readFileSync(pkg);
        } catch (e) {
            logger.error('无法读取package.json，系统退出！');
            process.exit(1);
        }

        try {
            pkg = JSON.parse(pkg);
        } catch (ex) {
            logger.error('package.json 定义似乎有问题,检查一下!');
            process.exit(1);
        }
        program.pkg = _.extend(pkg, program.pkg);
    }
    // 默认加载当前目录下的配置。
    else {
        pkg = path.resolve(pkg);
        var exists = true;
        try {
            pkg = fs.readFileSync(pkg);
        } catch (e) {
            exists = false;
        }

        if (exists) {
            try {
                pkg = JSON.parse(pkg);
            } catch (ex) {
                logger.error('package.json 定义似乎有问题,检查一下!');
                process.exit(1);
            }
            program.pkg = _.extend(program.pkg, pkg);
        }
    }
    return next();
}
function initPeachesHome() {
    'use strict';
// windows 下，使用 process.env.HOMEPATH
    process.env.PEACHES_HOME = path.join(process.env.HOME || process.env.HOMEPATH, '.peaches');
    var defaultPkg = path.join(process.env.PEACHES_HOME, 'package.json');

    // 读取 系统默认package.json；
    if (!fs.existsSync(defaultPkg)) {
        try {
            //TODO: 系统升级更新package.json时的处理。
            shelljs.mkdir('-p', path.join(process.env.PEACHES_HOME, 'images'));
            shelljs.mkdir('-p', path.join(process.env.PEACHES_HOME, 'tmp'));
            shelljs.cp(path.resolve(__dirname, './package.json'), defaultPkg);
        }
        catch (e) {
            logger.error('无法创建系统目录：error:%s', e);
        }
    }
    return defaultPkg;
}
init.initPeachesHome = initPeachesHome;
module.exports = init;