var expect = require('chai').expect,
    BFX = require('../index'),
    underscore = require('underscore');

bfx = new BFX();
var bfx_ws = bfx.ws;
describe('Websocket', function () {
    this.timeout(10000);
    it('subscribing',
        function (done) {
            bfx_ws.once('open', function () {
                bfx_ws.subTicker();
                bfx_ws.subTrades();
                bfx_ws.subBook();
                setTimeout(function () {
                    done()
                }, 5000)
            });
        });
    it('should map all the channels', function () {
        var values = Object.getOwnPropertyNames(bfx_ws.mapping).map(function (key) {
            return bfx_ws.mapping[key];
        });
        expect(values).to.include.members(['BTCUSD_ticker', 'BTCUSD_trades', 'BTCUSD_book']);
    });
    it('the order snapshot should have the correct number of fields in the correct hierarchy', function () {
        var chan = underscore.invert(bfx_ws.mapping)["BTCUSD_book"];
        var book_snapshot = underscore.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(book_snapshot[0]).is.a.number;
        expect(book_snapshot[1]).is.an.array;
        expect(book_snapshot[1][0]).is.an.array;
        expect(book_snapshot[1][0].length).is.eql(3);
        expect(underscore.every(book_snapshot[1][0], function (v) {
            return underscore.isFinite(v)
        })).ok
    });
    it('the types, structure and amount of order updates should be correct', function () {
        var chan = underscore.invert(bfx_ws.mapping)["BTCUSD_book"];
        var book_update = underscore.find(bfx_ws.messages.reverse(), function (v) {
            return v[0] == chan
        });
        expect(underscore.every(book_update, function (v) {
            return underscore.isFinite(v)
        })).ok;
        expect(book_update.length).is.eql(4);
    });
    this.mapping = bfx_ws.mapping;
    it('unsubscribing',
        function (done) {
            bfx_ws.unSubTickerPair();
            bfx_ws.unSubTradesPair();
            bfx_ws.unSubBookPair();
            setTimeout(function () {
                done()
            }, 2000)
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
        }).length).is.eql(3)
    });
});