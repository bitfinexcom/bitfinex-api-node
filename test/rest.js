//var expect = require('chai').expect,
//    BFX = require('../index');
//
//describe('Ticker', function () {
//    before(function () {
//        this.bitfinex = new BFX();
//    });
//    it('should find the correct keys after fetching the model',
//        function (done) {
//            var callback = function (error, data) {
//                actualKeys = Object.keys(data);
//                var expectedKeys = [
//                    'mid',
//                    'bid',
//                    'ask',
//                    'last_price',
//                    'low',
//                    'high',
//                    'volume',
//                    'timestamp'];
//                expect(data).to
//                    .have.keys(expectedKeys);
//                // Tell Mocha when the test should finish
//                done();
//            };
//            this.bitfinex.rest.ticker("BTCUSD", callback);
//        })
//});