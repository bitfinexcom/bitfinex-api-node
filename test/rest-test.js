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
            expect(_.keys(data.bids[0])).is.eql(['rate', 'amount', 'period', 'timestamp', 'frr']);
            expect(_.keys(data.asks[0])).is.eql(['rate', 'amount', 'period', 'timestamp', 'frr']);
            expect(
                _.every(
                    [data.asks[0] + data.bids[0]]
                ), !NaN).ok;
            done()
        });
    });
    it("should get the orderbook", function (done) {
        bfx_rest.orderbook("BTCUSD", function (error, data) {
            expect(data).to.exist;
            expect(_.keys(data)).is.eql(['bids', 'asks']);
            expect(_.keys(data.bids[0])).is.eql(['price', 'amount', 'timestamp']);
            expect(_.keys(data.asks[0])).is.eql(['price', 'amount', 'timestamp']);
            expect(
                _.every(
                    [data.asks[0] + data.bids[0]]
                ), !NaN).ok;
            done()
        })
    });
    it("should get recent trades", function (done) {
        bfx_rest.trades("BTCUSD", function (error, data) {
            expect(data).is.an.array;
            expect(data.length).to.eql(1000);
            expect(_.keys(data[0])).to.eql(['timestamp', 'tid', 'price', 'amount', 'exchange', 'type']);
            expect(
                _.map(
                    _.values(
                        data[0]
                    ), function (v) {
                        return typeof(v)
                    }
                )).is.eql(['number', 'number', 'string', 'string', 'string', 'string']);
            done();
        })
    });
    it("should get recent lends", function (done) {
        bfx_rest.lends("USD", function (error, data) {
            expect(data).to.exist;
            expect(data).is.an.array;
            expect(data.length).to.eql(50);
            expect(_.keys(data[0])).to.eql(['rate', 'amount_lent', 'amount_used', 'timestamp']);
            expect(
                _.map(
                    _.values(
                        data[0]
                    ), function (v) {
                        return typeof(v)
                    }
                )).is.eql(['string', 'string', 'string', 'number']);
            done();
        })
    });
    it("should get symbols", function (done) {
        bfx_rest.get_symbols(function (error, data) {
            expect(data).to.eql(["btcusd", "ltcusd", "ltcbtc"]);
            done();
        })
    });
    it("should get symbol details", function (done) {
        bfx_rest.symbols_details(function (error, data) {
            expect(data).to.exist;
            expect(data).to.eql([
                {
                    pair: 'btcusd',
                    price_precision: 5,
                    initial_margin: '30.0',
                    minimum_margin: '15.0',
                    maximum_order_size: '2000.0',
                    minimum_order_size: '0.01',
                    expiration: 'NA'
                },
                {
                    pair: 'ltcusd',
                    price_precision: 5,
                    initial_margin: '30.0',
                    minimum_margin: '15.0',
                    maximum_order_size: '5000.0',
                    minimum_order_size: '0.1',
                    expiration: 'NA'
                },
                {
                    pair: 'ltcbtc',
                    price_precision: 5,
                    initial_margin: '30.0',
                    minimum_margin: '15.0',
                    maximum_order_size: '5000.0',
                    minimum_order_size: '0.1',
                    expiration: 'NA'
                }]);
            done()
        })
    });
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