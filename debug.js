var http = require('http');
var Mocha = require('Mocha');
var POM = require('./lib/pom');
var fs = require('fs');
// Create an HTTP server
var srv = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var css = fs.readFileSync('./test/style/pom/background.css').toString();
    var pom = new POM(css);
    res.end(pom.toString());
});
// now that server is running
srv.listen(1337, '127.0.0.1');