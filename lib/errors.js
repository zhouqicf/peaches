var util = require('util');

function AbstractError(msg, constr) {
    'use strict';
    Error.captureStackTrace(this, constr || this);
    this.message = msg || 'Error';
}

util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';

/*
 * 通用错误
 * */
function CommonError(msg) {
    'use strict';
    this.name = 'CommonError';
    CommonError.super_.call(this, msg, this.constructor);
}
util.inherits(CommonError, AbstractError);

exports.CommonError = CommonError;


/*
 * 无法下载文件
 * */
function CanNotDownloadFile(msg) {
    'use strict';
    this.name = 'CanNotDownloadFile';
    CanNotDownloadFile.super_.call(this, msg, this.constructor);
}
util.inherits(CanNotDownloadFile, AbstractError);

exports.CanNotDownloadFile = CanNotDownloadFile;


/*
 * 无法下载文件
 * */
function CanNotDrawImage(msg) {
    'use strict';
    this.name = 'CanNotDrawImage';
    CanNotDrawImage.super_.call(this, msg, this.constructor);
}
util.inherits(CanNotDrawImage, AbstractError);

exports.CanNotDrawImage = CanNotDrawImage;