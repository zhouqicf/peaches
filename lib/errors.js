function CanNotDownloadFile(message) {
    'use strict';
    this.name = 'CanNotDownloadFile';
    this.message = message;
    Error.call(this, message);
}

CanNotDownloadFile.prototype.__proto__ = Error.prototype;

exports.CanNotDownloadFile = CanNotDownloadFile;