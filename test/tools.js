require('should');
require = require('./testutils');
var tools = require('../lib/tools');
describe('POM', function () {
    'use strict';
    it('should trimAll ', function () {
        tools.trimAll(' x ').should.eql('x');
        tools.trimAll(' x y ').should.eql('x y');
        tools.trimAll(' x y  z ').should.eql('x y z');
        tools.trimAll(' x    y').should.eql('x y');
    });
});