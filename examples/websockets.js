var BitfinexWS = require ('bitfinex-api-node');

var bws = new BitfinexWS().ws;

bws.on('open', function () {
    bws.subscribeTrades('BTCUSD');
    bws.subscribeOrderBook('BTCUSD');
    bws.subscribeTicker('LTCBTC');
});

bws.on('trade', function (pair, trade) {
    console.log('Trade:', trade);
});

bws.on('orderbook', function (pair, book) {
    console.log('Order book:', book);
});

bws.on('ticker', function (pair, ticker) {
    console.log('Ticker:', ticker);
});

bws.on('subscribed', function (data) {
    console.log('New subscription', data);
});

bws.on('error', console.error);
