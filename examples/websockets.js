var BitfinexWS = require ('bitfinex-api-node').WS;

var bws = new BitfinexWS();

bws.on('open', function () {
    bws.subscribeTrades('BTCUSD');
    bws.subscribeOrderBook('BTCUSD');
    bws.subscribeTicker('LTCBTC');
});

bws.on('BTCUSD_trades', function (trade) {
    console.log('Trade:', trade);
});

bws.on('BTCUSD_book', function (book) {
    console.log('Order book:', book);
});

bws.on('LTCBTC_ticker', function (ticker) {
    console.log('Ticker:', ticker);
});

bws.on('subscribed', function (data) {
    console.log('New subscription', data);
});

bws.on('error', console.error);
