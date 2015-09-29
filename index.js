/**
 * Created by joshuarossi on 9/28/15.
 */

function handleSub(msg, ws){
    console.log('subscribed to ' + msg.Pair + ' ' + msg.Channel);
    ws.mapping[msg.ChanId] = msg.Pair + '_' + msg.Channel;
    if (msg.Channel == 'ticker') {
        ws.tickers[msg.Pair + '_' + msg.Channel] = [];
    }
    if (msg.Channel == 'trades') {
        ws.trades[msg.Pair + '_' + msg.Channel] = [];
    }
}
function handleTrade(msg, ws){
    var trade_list = ws.mapping[msg[0]];
    if (msg[1].length > 5) {
        msg[1].reverse().forEach(function (trade) {
                trade.unshift(msg[0]);
                ws.trades[trade_list].unshift(trade);
            }
        )
    }
    else ws.trades[trade_list].unshift(msg);
}
function handleTicker(msg, ws) {
    var ticker_list = ws.mapping[msg[0]];
    ws.tickers[ticker_list].unshift(msg);
}

module.exports = {
    websocket: function () {
        var WebSocket = require('ws');
        var ws = new WebSocket("wss://api2.bitfinex.com:3000/ws");
        ws.api_key = '';
        ws.api_secret = '';
        ws.debug = true;
        ws.tradeHook = function(msg){};
        ws.tickerHook = function(msg){};
        ws.walletHook = function(msg){};
        ws.orderHook = function(msg){};
        ws.positionHook = function(msg){};
        ws.messages = [];
        ws.orders = {};
        ws.positions = {};
        ws.wallets = {};
        ws.tickers = {};
        ws.books = {};
        ws.trades = {};
        ws.mapping = {};
        ws.onerror = function (error) {
            console.log(error)
        };
        ws.onopen = function () {
            console.log('ws opened...')
        };
        ws.onclose = function () {
            console.log('ws closed...')
        };
        ws.onmessage = function (msg) {
            msg = JSON.parse(msg.data);
            if (ws.debug) {
                ws.messages.unshift(msg);
            }
            //Subscribe messages
            if (msg.Event == 'subscribed') {
                handleSub(msg, ws);
            }
            //messages whose channel id's have a mapping
            else if (ws.mapping.hasOwnProperty(msg[0])) {
                //ticker messages
                if (ws.mapping[msg[0]].indexOf('ticker') != -1) {
                    handleTicker(msg, ws);
                }
                //trade messages
                else if (ws.mapping[msg[0]].indexOf('trades') != -1) {
                    handleTrade(msg, ws);
                }
            }
        };
        ws.subTicker = function (pair) {
            if (arguments.length == 0) {
                ws.send(JSON.stringify({Event: "subscribe", Channel: "ticker", Pair: "BTCUSD"}))
            }
            else {
                ws.send(JSON.stringify({Event: "subscribe", Channel: "ticker", Pair: pair}))
            }
        };
        ws.subTrades = function (pair) {
            if (arguments.length == 0) {
                ws.send(JSON.stringify({Event: "subscribe", Channel: "trades", Pair: "BTCUSD"}))
            }
            else {
                ws.send(JSON.stringify({Event: "subscribe", Channel: "trades", Pair: pair}))
            }
        };
        ws.subBook = function () {
            if (arguments.length == 0) {
                ws.send(JSON.stringify({Event: "subscribe", Channel: "book", Pair: "BTCUSD"}))
            }
            else {
                ws.send(JSON.stringify({Event: "subscribe", Channel: "book", Pair: pair}))
            }
        };
        ws.auth = function (api_key, api_secret) {
            if (api_key && api_secret) {
                ws.api_secret = api_secret;
                ws.api_key = api_key;
            }
            var crypto = require('crypto');
            var payload = 'AUTH' + (new Date().getTime());
            var signature = crypto.createHmac("sha384", api_secret).update(payload).digest('hex');
            ws.send(JSON.stringify({Event: "auth", ApiKey: api_key, AuthSig: signature, AuthPayload: payload}));
        };
        return ws
    },

    rest: function () {
        return {};
    }
};