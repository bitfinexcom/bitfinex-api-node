var ws = function (api_key, api_secret) {
    var WebSocket = require('ws');
    var ws = new WebSocket("wss://api2.bitfinex.com:3000/ws");
    //all messages (log)
    ws.messages = [];
    //mapping of channel id's to names (in format PAIR_type)
    ws.mapping = {};
    ws.onerror = function (error) {
        ws.messages.unshift(error)
    };
    ws.onopen = function () {
        ws.messages.unshift('ws opened...');
    };
    ws.onclose = function () {
        ws.messages.unshift('ws closed...');
    };
    ws.onmessage = function (msg) {
        msg = JSON.parse(msg.data);
        ws.messages.unshift(msg);
        //Subscribe messages
        if (msg.event == 'subscribed') {
            console.log('subscribed to ' + msg.pair + ' ' + msg.channel);
            ws.mapping[msg.chanId] = msg.pair + '_' + msg.channel;
        }
    };
    ws.subTicker = function (pair) {
        if (arguments.length == 0) {
            ws.send(JSON.stringify({
                "event": "subscribe",
                "channel": "ticker",
                "pair": "BTCUSD"
            }))
        }
        else {
            ws.send(JSON.stringify({
                "event": "subscribe",
                "channel": "ticker",
                "pair": pair
            }))
        }
    };
    ws.subTrades = function (pair) {
        if (arguments.length == 0) {
            ws.send(JSON.stringify({
                "event": "subscribe",
                "channel": "trades",
                "pair": "BTCUSD"
            }))
        }
        else {
            ws.send(JSON.stringify({
                "event": "subscribe",
                "channel": "trades",
                "pair": pair
            }))
        }
    };
    ws.subBook = function (pair) {
        if (arguments.length == 0) {
            ws.send(JSON.stringify({
                "event": "subscribe",
                "channel": "book",
                "pair": "BTCUSD",
                "prec": "P0"
            }))
        }
        else {
            ws.send(JSON.stringify({
                "event": "subscribe",
                "channel": "book",
                "pair": pair,
                "prec": "P0"
            }))
        }
    };
    ws.auth = function (api_key, api_secret) {
        if (api_key && api_secret) {
            ws.api_secret = api_secret;
            ws.api_key = api_key;
        }
        else {console.log("need api key and secret")}
        var crypto = require('crypto');
        var payload = 'AUTH' + (new Date().getTime());
        var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
        ws.send(JSON.stringify({
            event: "auth",
            apiKey: api_key,
            authSig: signature,
            authPayload: payload
        }));
    };
    return ws;
};
module.exports = ws;