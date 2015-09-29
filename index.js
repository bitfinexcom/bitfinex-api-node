/**
 * Created by joshuarossi on 9/28/15.
 */
module.exports = {
    websocket: function() {
        var WebSocket = require('ws');
        var ws = new WebSocket("wss://api2.bitfinex.com:3000/ws");
        ws.messages = [];
        ws.tickers = {};
        ws.books = {};
        ws.trades = {};
        ws.mapping = {};
        ws.onerror = function (error){console.log(error)};
        ws.onopen = function (){console.log('ws opened...')};
        ws.onclose = function (){console.log('ws closed...')};
        ws.onmessage = function(msg) {
            msg = JSON.parse(msg.data);
            if (msg.Event == 'subscribed'){
                console.log('subscribed to ' + msg.Pair + ' ' + msg.Channel);
                ws.mapping[msg.ChanId] = msg.Pair;
                if (msg.Channel == 'ticker'){
                    ws.tickers[msg.Pair] = [];
                }
                if (msg.Channel == 'trades'){
                    ws.trades[msg.Pair] = [];
                }
                ws.messages.unshift(msg);
            }
            else if (ws.mapping.hasOwnProperty(msg[0])){
                if (msg.Channel == 'ticker'){
                    ws.tickers[ws.mapping[msg[0]]].unshift(msg);
                }
                if (msg.Channel == 'trades'){
                    ws.trades[ws.mapping[msg[0]]].unshift(msg);
                }
            }
            else {
                ws.messages.unshift(msg.data);
            }
        };
        ws.subTicker = function(pair){
            if (arguments.length == 0){
                ws.send(JSON.stringify({ Event: "subscribe", Channel: "ticker", Pair: "BTCUSD"}))
            }
            else {
                ws.send(JSON.stringify({ Event: "subscribe", Channel: "ticker", Pair: pair}))
            }
        };
        ws.subTrades = function(){
            if (arguments.length == 0){
                ws.send(JSON.stringify({ Event: "subscribe", Channel: "trades", Pair: "BTCUSD"}))
            }
            else {
                ws.send(JSON.stringify({ Event: "subscribe", Channel: "trades", Pair: pair}))
            }
        };
        ws.subBook = function(){
            console.log('should sub book here');
        };
        return ws
    },

    rest: function() {
        var rest = {};
        return rest;
    }
};