require = require('./testutils');

var path = require('path');
var fs = require('fs');
require('should');
var download = require('../lib/download');

var tmpdir = path.join(__dirname, '../download');
if (!fs.existsSync(tmpdir)) {
    fs.mkdirSync(tmpdir);
}
describe('download', function () {
    'use strict';
    it('下载http资源', function (done) {
        var name = new Date().getTime();
        name = path.join(tmpdir, name + '.png');
        this.timeout(5000);
        download('http://img01.taobaocdn.com/tps/i1/T1Q6Z_XkleXXckc6kx-428-101.png', name, function (err) {
            if (err) {
                throw err;
            }
            // 检测下载文件存在
            try {
                var data = fs.readFileSync(name);
                data.length.should.eql(9793);
            }
            catch (e) {
                throw e;
            }
            done();
        });
    });
    it('下载https资源', function (done) {
        var name = new Date().getTime();
        name = path.join(tmpdir, name + '.png');
        this.timeout(5000);
        download('https://i.alipayobjects.com/e/201301/25DFxqiuiC.png', name, function (err) {
            if (err) {
                throw err;
            }
            try {
                var data = fs.readFileSync(name);
                data.length.should.eql(1662);
            }
            catch (e) {
                throw e;
            }
            done();
        });
    });

    it('不能下载ftp资源', function (done) {
        var name = new Date().getTime();
        name = path.join(tmpdir, name + '.png');
        download('ftp://tfsimg.alipay.com/images/partner/T1vXVXXcpdXXXXXXXX', name, function (err) {
            err.should.be.an.instanceof(Error);
            done();
        });
    });
});
