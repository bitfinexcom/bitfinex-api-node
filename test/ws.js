var expect = require('chai').expect,
    BFX = require('../index');

describe('Websocket', function () {
    before(function () {
        this.bitfinex = new BFX();
    });
    it('should connect',
        function (done) {
            a = this;
            this.bitfinex.ws.once('message', function(){
                expect(a.bitfinex.ws.messages.slice(-1)[0]).to.equal("ws opened...");
                expect(a.bitfinex.ws.messages.slice(-2)[0]).to.have.keys(['event','version']);
                done();
            });
        });
    it('should subscribe to ticker',
        function(done){
            a = this;
            this.bitfinex.ws.subTicker();
            this.bitfinex.ws.once('message', function(){
                expect(a.bitfinex.ws.messages[0]).to.have.keys(["event", "channel", "chanId", "pair"]);
                expect(a.bitfinex.ws.messages[0].channel).to.equal('ticker');
                expect(a.bitfinex.ws.messages[0].event).to.equal('subscribed');
                expect(Object.keys(a.bitfinex.ws.mapping)).not.equal(0);
                done();
            })
        });
    it('should unsubscribe to ticker',
        function(done){
            this.bitfinex.ws.unSubTickerPair();
            a = this;
            this.bitfinex.ws.once('message', function(){
                a.bitfinex.ws.messages.forEach(function(each){
                    if (each.event){
                        if (each.event = "unsubscribed"){
                            a.bitfinex.ws.messages.length = 0;
                            expect(a.bitfinex.ws.messages.length).is.equal(0);
                            done()
                        }
                    }
                });
            })
        });
});