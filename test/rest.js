var expect = require('chai').expect,
    BFX = require('../index');

var bitfinex = new BFX();
describe('bitfinex', function() {
    describe('#bitfinex.rest.ticker', function () {
        it('should return a ticker', function () {
            expect(bitfinex.rest.ticker).to.be.a.function;
        });
    });
});