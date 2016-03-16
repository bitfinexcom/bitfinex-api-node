var BitfinexWS = require ('bitfinex-api-node').WS;
var version = require('bitfinex-api-node/package.json').version
var bws = new BitfinexWS();
console.log(process.cwd())
console.log(version)
bws.on('open', function () {
    bws.subscribeTrades('BTCUSD');
});


bws.on('trade', function (pair, trade) {
    console.log('Trade:', trade);
});
