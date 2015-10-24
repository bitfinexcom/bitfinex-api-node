var expect = require('chai').expect,
    BFX = require('../index');

bfx = new BFX();
var bfx_ws = bfx.ws;
describe('Websocket', function () {
    this.timeout(5000);
    it('starting',
        function (done) {
            bfx_ws.once('open', function () {
                bfx_ws.subTicker();
                bfx_ws.subTrades();
                bfx_ws.subBook();
                setTimeout(function(){
                    done()
                }, 2000)
            });
        });
    it('should receive info message',
        function () {
            expect(bfx_ws.messages).is.not.empty;
            expect(bfx_ws.messages.pop()).is.eql('ws opened...');
            expect(bfx_ws.messages.pop()).is.eql({'event': 'info', 'version': 1});
        });
    it('should receive sub success messages', function(){
        expect(bfx_ws.messages.filter(function(v){return v.event == 'subscribed'}).length).is.eql(3)
    });
    it('should map all the channels', function(){
        var values = Object.getOwnPropertyNames(bfx_ws.mapping).map(function(key) {
            return bfx_ws.mapping[key];
        });
        expect(values).to.include.members(['BTCUSD_ticker', 'BTCUSD_trades', 'BTCUSD_book']);
    });
    it('the order snapshot should have the correct number of fields in the correct hierarchy', function(){

    })
});