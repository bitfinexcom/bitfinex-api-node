var expect = require('chai').expect,
    BFX = require('../index'),
    _ = require('lodash'),
    ws_test = require('./ws-test'),
    keys = require('./keys.json');


var bfx = new BFX();
var bfx_rest = bfx.rest;
describe("Public Endpoints", function () {
    this.timeout(5000);
    before(function () {
    });
    it("should get a ticker", function (done) {
        bfx_rest.ticker('BTCUSD', function (error, data) {
            expect(data).to.exist;
            expect(_.has(data, ['mid',
                'bid',
                'ask',
                'last_price',
                'low',
                'high',
                'volume',
                'timestamp']));
            done()
        })
    });
    it("should get the today endpoint", function (done) {
        bfx_rest.today("BTCUSD", function (error, data) {
            expect(data).to.exist;
            done();
        })
    });
    it("should get the stats", function (done) {
        bfx_rest.stats("BTCUSD", function (error, data) {
            expect(data).to.exist;
            expect(_.has(data[0], ['period', 'volume']));
            expect(_.has(data[1], ['period', 'volume']));
            expect(_.has(data[2], ['period', 'volume']));
            done()
        })
    });
    it("should get the fundingbook", function (done) {
        bfx_rest.fundingbook("USD", function (error, data) {
            expect(data).to.exist;
            expect(_.has(data, ['bids', 'asks']));
            console.log(_.keys(data.bids[0]));
            expect(_.keys(data.bids[0])).is.eql(['rate', 'amount', 'period', 'timestamp', 'frr']);
            expect(_.keys(data.asks[0])).is.eql(['rate', 'amount', 'period', 'timestamp', 'frr']);
            done();
        })
    });
    it("should get the orderbook", function (done) {
        bfx_rest.orderbook("BTCUSD", function (error, data) {
            expect(data).to.exist;
            expect(_.keys(data)).is.eql(['bids', 'asks']);
            expect(_.keys(data.bids[0])).is.eql(['price', 'amount', 'timestamp']);
            expect(_.keys(data.asks[0])).is.eql(['price', 'amount', 'timestamp']);
            done()
        })
    });
    it("should get recent trades");
    it("should get recent lends");
    it("should get symbols");
    it("should get symbol details");
});
describe("Authenticated Endpoints: standard key", function () {
    before(function () {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
    it("should get account info");
    it("should get a deposit address");
    describe("orders", function () {
        it("should place a new order");
        it("should place multiple orders");
        it("should cancel an order");
        it("should cancel multiple orders");
        it("should cancel all orders");
        it("should replace an order");
        it("should get an orders status");
        it("should get active orders");
    });
    describe("positions", function () {
        it("should get active positions");
        it("should claim a position");
    });
    describe("historical data", function () {
        it("should get balance history");
        it("should get deposit/withdrawal history");
        it("should get past trades");
    });
    describe("margin funding", function () {
        it("should place a new offer");
        it("should cancel an offer");
        it("should get an offer status");
        it("should get active credits");
        it("should get active funding used in a margin position");
        it("should get total taken funds");
    });
    it("should get wallet balances");
    it("should get margin information");
    it("should transfer between wallets");
    it("should submit a withdrawal");
});
describe("Authenticated Endpoints: read-only key", function () {
    before(function () {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
    it("should get account info");
    it("should get a deposit address");
    describe("orders", function () {
        it("should place a new order");
        it("should place multiple orders");
        it("should cancel an order");
        it("should cancel multiple orders");
        it("should cancel all orders");
        it("should replace an order");
        it("should get an orders status");
        it("should get active orders");
    });
    describe("positions", function () {
        it("should get active positions");
        it("should claim a position");
    });
    describe("historical data", function () {
        it("should get balance history");
        it("should get deposit/withdrawal history");
        it("should get past trades");
    });
    describe("margin funding", function () {
        it("should place a new offer");
        it("should cancel an offer");
        it("should get an offer status");
        it("should get active credits");
        it("should get active funding used in a margin position");
        it("should get total taken funds");
    });
    it("should get wallet balances");
    it("should get margin information");
    it("should transfer between wallets");
    it("should submit a withdrawal");
});
describe("Authenticated Endpoints: withdrawal-enabled key", function () {
    before(function () {
        var bfx = new BFX();
        var bfx_rest = bfx.rest;
    });
    it("should get account info");
    it("should get a deposit address");
    describe("orders", function () {
        it("should place a new order");
        it("should place multiple orders");
        it("should cancel an order");
        it("should cancel multiple orders");
        it("should cancel all orders");
        it("should replace an order");
        it("should get an orders status");
        it("should get active orders");
    });
    describe("positions", function () {
        it("should get active positions");
        it("should claim a position");
    });
    describe("historical data", function () {
        it("should get balance history");
        it("should get deposit/withdrawal history");
        it("should get past trades");
    });
    describe("margin funding", function () {
        it("should place a new offer");
        it("should cancel an offer");
        it("should get an offer status");
        it("should get active credits");
        it("should get active funding used in a margin position");
        it("should get total taken funds");
    });
    it("should get wallet balances");
    it("should get margin information");
    it("should transfer between wallets");
    it("should submit a withdrawal");
});