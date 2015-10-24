var expect = require('chai').expect,
    BFX = require('../index'),
    _ = require('lodash'),
    test_keys = require('./test_api_keys.json');

bfx = new BFX(test_keys.standard.api_key, test_keys.standard.api_secret);
var bfx_ws = bfx.ws;
describe('Websocket', function () {
    this.timeout(30000);
    it('subscribing',
        function (done) {
            bfx_ws.once('open', function () {
                bfx_ws.auth(' ', ' ');
                bfx_ws.auth(test_keys.standard.api_key, test_keys.standard.api_secret);
                bfx_ws.subTicker();
                bfx_ws.subTrades();
                bfx_ws.subBook();
                bfx_ws.subTicker("LTCUSD");
                bfx_ws.subTrades("LTCUSD");
                bfx_ws.subBook("LTCUSD");
                bfx_ws.send(JSON.stringify({
                    "event": "ping"
                }));
                bfx_ws.auth();
                setTimeout(function () {
                    done()
                }, 15000)
            });
        });
    it('should receive a pong', function () {
        _.find(bfx_ws.messages, function (v) {
            return v.event == 'pong'
        });
    });
    it('should map all the channels', function () {
        var values = Object.getOwnPropertyNames(bfx_ws.mapping).map(function (key) {
            return bfx_ws.mapping[key];
        });
        expect(values).to.include.members(['BTCUSD_ticker', 'BTCUSD_trades', 'BTCUSD_book']);
    });
    it('should receive info message',
        function () {
            expect(bfx_ws.messages).is.not.empty;
            expect(bfx_ws.messages.pop()).is.eql('ws opened...');
            expect(bfx_ws.messages.pop()).is.eql({'event': 'info', 'version': 1});
        });
    it('should receive sub success messages', function () {
        expect(bfx_ws.messages.filter(function (v) {
            return v.event == 'subscribed'
        }).length).is.eql(6)
    });
    it('the order snapshot should have the correct number of fields in the correct hierarchy', function () {
        var chan = _.invert(bfx_ws.mapping)["BTCUSD_book"];
        var book_snapshot = _.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(book_snapshot[0]).is.a.number;
        expect(book_snapshot[1]).is.an.array;
        expect(book_snapshot[1][0]).is.an.array;
        expect(book_snapshot[1][0].length).is.eql(3);
        expect(_.every(book_snapshot[1][0], function (v) {
            return _.isFinite(v)
        })).ok
    });
    it('the types, structure and amount of order updates should be correct', function () {
        var chan = _.invert(bfx_ws.mapping)["BTCUSD_book"];
        var book_update = _.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(_.every(book_update, function (v) {
            return _.isFinite(v)
        })).ok;
        expect(book_update.length).is.eql(4);
    });

    it('the trades snapshot should have the correct number of fields in the correct hierarchy', function () {
        var chan = _.invert(bfx_ws.mapping)["BTCUSD_trades"];
        var trades_snapshot = _.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(trades_snapshot[0]).is.a.number;
        expect(trades_snapshot[1]).is.an.array;
        expect(trades_snapshot[1][0]).is.an.array;
        expect(trades_snapshot[1][0].length).is.eql(4);
        expect(_.every(trades_snapshot[1][0], function (v) {
            return _.isFinite(v)
        })).ok
    });
    it.skip('the types, structure and amount of trade updates should be correct', function () {
        var chan = _.invert(bfx_ws.mapping)["BTCUSD_trades"];
        var trades_update = _.find(bfx_ws.messages, function (v) {
            return v[0] == chan
        });
        console.log(trades_update);
        expect(_.every(trades_update, function (v) {
            return _.isFinite(v)
        })).ok;
        expect(trades_update.length).is.eql(5);
    });
    it("should request an api_key and api_secret if none is present", function () {
        bfx_ws.api_key = null;
        bfx_ws.api_secret = null;
        expect(bfx_ws.auth).to.throw('need api_key and api_secret');
    });
    it("should receive a rejection if the api_key and secret are not valid", function () {
        expect(_.findWhere(bfx_ws.messages, {event: 'auth', status: 'FAILED', chanId: 0, code: 10100})).to.exist;
    });
    it("should authenticate", function () {
        var auth_message = _.findWhere(bfx_ws.messages, {
            event: 'auth', status: 'OK', chanId: 0, userId: 163319
        });
        expect(auth_message).to.exist
    });
    it('should give error if already authenticated', function () {

        console.log(_.filter(bfx_ws.messages, 'event'));
        var auth_error = _.findWhere(bfx_ws.messages, {
            event: 'error', msg: 'already authenticated', code: 10100
        });
        expect(auth_error).to.exist
    });
    it('should receive an order snapshot');
    it('should receive a wallet balance snapshot');
    it('should receive a trade history snapshot');
    it('unsubscribing',
        function (done) {
            bfx_ws.unSubTickerPair();
            bfx_ws.unSubTradesPair();
            bfx_ws.unSubBookPair();
            bfx_ws.unSubTickerPair("LTCUSD");
            bfx_ws.unSubTradesPair("LTCUSD");
            bfx_ws.unSubBookPair("LTCUSD");
            setTimeout(function () {
                done()
            }, 2000)
        });
    it('should disconnect', function () {
        bfx_ws.close();
        var close_message = _.find(bfx_ws.messages, function (v) {
            return v = 'ws closed...'
        });
        expect(close_message).to.exist;
    });
    it('should log messages onclose and onerror', function (done) {
        bfx_ws.onclose('test');
        bfx_ws.onerror('test');
        done();
    });
    it('should handle errors properly', function () {
        var error = function () {
            bfx_ws.send(JSON.stringify({
                "event": "ping"
            }))
        };
        expect(error).to.throw(Error)
    })
});