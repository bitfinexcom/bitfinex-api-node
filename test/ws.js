var expect = require('chai').expect,
    BFX = require('../index');

describe('Websocket', function () {
    this.timeout(5000);
    before(function () {
        this.bitfinex = new BFX();
    });
    it('should connect',
        function (done) {
            a = this;
            this.bitfinex.ws.once('message', function () {
                expect(a.bitfinex.ws.messages.slice(-1)[0]).to.equal("ws opened...");
                expect(a.bitfinex.ws.messages.slice(-2)[0]).to.have.keys(['event', 'version']);
                done();
            });
        });
    it('should subscribe to ticker',
        function (done) {
            a = this;
            this.bitfinex.ws.subTicker();
            this.bitfinex.ws.once('message', function () {
                var sub_msg = a.bitfinex.ws.messages.filter(function(v){
                    return v.event == "subscribed"
                })[0];
                expect(sub_msg).to.have.keys(["event", "channel", "chanId", "pair"]);
                expect(sub_msg.channel).to.equal('ticker');
                expect(sub_msg.event).to.equal('subscribed');
                //noinspection BadExpressionStatementJS
                expect(Object.keys(a.bitfinex.ws.mapping)).is.not.empty;
                done();
            })
        });
    it('should unsubscribe to ticker',
        function (done) {
            this.bitfinex.ws.unSubTickerPair();
            setTimeout(1000);
            a = this;
            this.bitfinex.ws.once('message', function () {
                console.log(a.bitfinex.ws.messages);
                var unsub_msg = a.bitfinex.ws.messages.filter(function(v){
                    return v.event == "unsubscribe"
                })[0];
                console.log(unsub_msg);
                expect(unsub_msg).event.to.eql('unsubscribe');
                expect(unsub_msg).channel.to.eql('ticker');
                a.bitfinex.ws.messages.length = 0;
                //noinspection BadExpressionStatementJS
                expect(a.bitfinex.ws.messages).is.empty;
                done()
            });
        });
    it('should subscribe to trades',
        function (done) {
            a = this;
            this.bitfinex.ws.subTrades();
            this.bitfinex.ws.once('message', function () {
                var sub_msg = a.bitfinex.ws.messages.filter(function(v){
                    return v.event == "subscribed"
                })[0];
                expect(sub_msg).to.have.keys(["event", "channel", "chanId", "pair"]);
                expect(sub_msg.channel).to.equal('trades');
                expect(sub_msg.event).to.equal('subscribed');
                //noinspection BadExpressionStatementJS
                expect(Object.keys(a.bitfinex.ws.mapping)).is.not.empty;
                done();
            })
        });
    it('should unsubscribe to trades',
        function (done) {
            this.bitfinex.ws.unSubTradesPair();
            a = this;
            this.bitfinex.ws.once('message', function () {
                a.bitfinex.ws.messages.forEach(function (each) {
                    if (each.event == "unsubscribed") {
                        a.bitfinex.ws.messages.length = 0;
                        //noinspection BadExpressionStatementJS
                        expect(a.bitfinex.ws.messages).is.empty;
                        done()
                    }
                });
            })
        });
    it('should subscribe to book',
        function (done) {
            a = this;
            this.bitfinex.ws.subBook();
            this.bitfinex.ws.once('message', function () {
                sub_msg = a.bitfinex.ws.messages.filter(function(v){
                    return v.event == "subscribed"
                })[0];
                expect(sub_msg).to.have.keys([ 'event', 'channel', 'chanId', 'pair', 'prec', 'len' ]);
                expect(sub_msg.channel).to.equal('book');
                expect(sub_msg.event).to.equal('subscribed');
                //noinspection BadExpressionStatementJS
                expect(Object.keys(a.bitfinex.ws.mapping)).is.not.empty;
                done();
            })
        });
    it('should unsubscribe to book',
        function (done) {
            this.bitfinex.ws.unSubBookPair();
            a = this;
            this.bitfinex.ws.once('message', function () {
                a.bitfinex.ws.messages.forEach(function (each) {
                    console.log(each);
                    if (each.event == "unsubscribed") {
                        a.bitfinex.ws.messages.length = 0;
                        //noinspection BadExpressionStatementJS
                        expect(a.bitfinex.ws.messages).is.empty;

                        done()
                    }
                });
            })
        });
});