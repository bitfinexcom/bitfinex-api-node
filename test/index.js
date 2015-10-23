var expect = require('chai').expect,
    BFX = require('../index');

describe('Array', function() {
    describe('#BFX', function () {
        it('should be loaded', function () {
            expect(BFX).to.be.a.function;
        });
    });
});