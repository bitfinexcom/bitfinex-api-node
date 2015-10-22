/**
 * Created by joshuarossi on 9/28/15.
 */

A = require("./bitfinex.js");
rest = new A;
function handleSub(msg, ws) {
    orig_msg = msg;
    console.log('subscribed to ' + msg.Pair + ' ' + msg.Channel);
    ws.mapping[msg.ChanId] = msg.Pair + '_' + msg.Channel;
    if (msg.Channel == 'ticker') {
        ws.tickers[msg.Pair + '_' + msg.Channel] = [];
    }
    if (msg.Channel == 'trades') {
        ws.trades[msg.Pair + '_' + msg.Channel] = [];
    }
    if (ws.subHook) {
        ws.subHook(orig_msg)
    }
}
function handleTrade(msg, ws) {
    var orig_msg = msg;
    var trade_list = ws.mapping[msg[0]];
    if (msg[1].length > 5) {
        msg[1].reverse().forEach(function (trade) {
                trade.unshift(msg[0]);
                ws.trades[trade_list].unshift(trade);
            }
        )
    }
    else ws.trades[trade_list].unshift(msg);
    if (ws.tradeHook) {
        ws.tradeHook(orig_msg);
    }
}
function handleTicker(msg, ws) {
    var orig_msg = msg;
    var ticker_list = ws.mapping[msg[0]];
    ws.tickers[ticker_list].unshift(msg);
    if (ws.tickerHook) {
        ws.tickerHook(orig_msg)
    }
}
function handleBook(msg, ws) {
    var orig_msg = msg;
    var destination = ws.mapping[msg.shift()];
    //book snapshot
    if (msg[0].length == 50) {
        if (ws.books == {}) {
            ws.books[destination] = {};
        }
        ws.books[destination] = {'bids': {}, 'asks': {}};
        var book = msg[0];
        var asks = book.filter(function (each) {
            if (each[2] < 0) {
                return each
            }
        }).sort(function (a, b) {
            return a[0] - b[0]
        });
        var bids = book.filter(function (each) {
            if (each[2] > 0) {
                return each
            }
        }).sort(function (a, b) {
            return b[0] - a[0]
        });
        bids.forEach(function (each) {
            ws.books[destination]['bids'][each[0]] = [each[2], each[1]]
        });
        asks.forEach(function (each) {
            ws.books[destination]['asks'][each[0]] = [Math.abs(each[2]), each[1]]
        });
    }
    //book update
    else if (msg.length == 3) {
        if (msg[2] < 0) {
            ws.books[destination].asks[msg[0]] = [Math.abs(msg[2]), msg[1]]
        }
        if (msg[2] > 0) {
            ws.books[destination].bids[msg[0]] = [msg[2], msg[1]]
        }
    }
    if (ws.bookHook) {
        ws.bookHook(orig_msg)
    }
}
module.exports = {
    websocket: function () {
        var WebSocket = require('ws');
        var ws = new WebSocket("wss://api2.bitfinex.com:3000/ws");
        ws.api_key = '';
        ws.api_secret = '';
        ws.debug = true;
        //User customizable hooks
        ws.subHook = null;
        ws.tradeHook = null;
        ws.tickerHook = null;
        ws.walletHook = null;
        ws.orderHook = null;
        ws.positionHook = null;
        ws.bookHook = null;
        //all messages (log)
        ws.messages = [];
        //all your orders
        ws.orders = {};
        //all your positions
        ws.positions = {};
        //all wallet balances
        ws.wallets = {};
        //list of tickers (newest first)
        ws.tickers = {};
        //all order books to which you are subscribed
        ws.books = {};
        //list of trades (newest first)
        ws.trades = {};
        //mapping of channel id's to names (in format PAIR_type)
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
                //book messages
                else if (ws.mapping[msg[0]].indexOf('book') != -1) {
                    handleBook(msg, ws);
                }
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
        return ws
    },
    rest: rest
};