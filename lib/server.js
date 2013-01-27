var nodeStatic = require('node-static');

function createStaticServer(config) {
    'use strict';
    var fileServer = new nodeStatic.Server(config.root);
    require('http').createServer(function (request, response) {

        request.addListener('end', function () {
            fileServer.serve(request, response);
        });
    }).listen(config.port);
}
module.exports = createStaticServer;

