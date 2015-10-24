var ws = function (api_key, api_secret) {
    var WebSocket = require('ws');
    var ws = new WebSocket("wss://api2.bitfinex.com:3000/ws");
    ws.api_key = api_key;
    ws.api_secret = api_secret;
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
            //console.log('subscribed to ' + msg.pair + ' ' + msg.channel);
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
    ws.unSubTickerPair = function (pair) {
        if (arguments.length == 0) {
            ws.send(JSON.stringify({
                "event": "unsubscribe",
                "channel": "ticker",
                "pair": "BTCUSD"
            }));
            Object.keys(ws.mapping).forEach(function (key) {
                if (ws.mapping[key] == "BTCUSD_ticker") {
                    delete ws.mapping[key];
                }
            })
        }
        else {
            ws.send(JSON.stringify({
                "event": "unsubscribe",
                "channel": "ticker",
                "pair": pair
            }));
            Object.keys(ws.mapping).forEach(function (key) {
                if (ws.mapping[key] == pair + "_" + "ticker") {
                    delete ws.mapping[key];
                }
            })
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
    ws.unSubTradesPair = function (pair) {
        if (arguments.length == 0) {
            ws.send(JSON.stringify({
                "event": "unsubscribe",
                "channel": "trades",
                "pair": "BTCUSD"
            }));
            Object.keys(ws.mapping).forEach(function (key) {
                if (ws.mapping[key] == "BTCUSD_trades") {
                    delete ws.mapping[key];
                }
            })
        }
        else {
            ws.send(JSON.stringify({
                "event": "unsubscribe",
                "channel": "trades",
                "pair": pair
            }));
            Object.keys(ws.mapping).forEach(function (key) {
                if (ws.mapping[key] == pair + "_" + "trades") {
                    delete ws.mapping[key];
                }
            })
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
    ws.unSubBookPair = function (pair) {
        if (arguments.length == 0) {
            ws.send(JSON.stringify({
                "event": "unsubscribe",
                "channel": "book",
                "pair": "BTCUSD"
            }));
            Object.keys(ws.mapping).forEach(function (key) {
                if (ws.mapping[key] == "BTCUSD_book") {
                    delete ws.mapping[key];
                }
            })
        }
        else {
            ws.send(JSON.stringify({
                "event": "unsubscribe",
                "channel": "book",
                "pair": pair
            }));
            Object.keys(ws.mapping).forEach(function (key) {
                if (ws.mapping[key] == pair + "_" + "book") {
                    delete ws.mapping[key];
                }
            })
        }
    };
    ws.auth = function (api_key, api_secret) {
        if (ws.api_key && ws.api_secret){
            //console.log("inherited credentials " + ws.api_key + " " + ws.api_secret);
            this.api_key = ws.api_key;
            this.api_secret = ws.api_secret;
        }
        if (api_key && api_secret) {
            //console.log("new credentials arguments " + api_key + " " + api_secret);
            this.api_secret = api_secret;
            this.api_key = api_key;
        }
        if (!this.api_key && !this.api_secret) {
                throw new Error('need api_key and api_secret')
        }
        var crypto = require('crypto');
        var payload = 'AUTH' + (new Date().getTime());
        var signature = crypto.createHmac("sha384", this.api_secret).update(payload).digest('hex');
        ws.send(JSON.stringify({
            event: "auth",
            apiKey: this.api_key,
            authSig: signature,
            authPayload: payload
        }));
    };
    return ws;
};
module.exports = ws;