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
            ws.messages.unshift(msg);
            if (msg.Event == 'subscribed'){
                console.log('subscribed to ' + msg.Pair + ' ' + msg.Channel);
                ws.mapping[msg.ChanId] = msg.Pair + '_' + msg.Channel;
                if (msg.Channel == 'ticker'){
                    ws.tickers[msg.Pair + '_' + msg.Channel] = [];
                }
                if (msg.Channel == 'trades'){
                    ws.trades[msg.Pair + '_' + msg.Channel] = [];
                }
            }
            else if (ws.mapping.hasOwnProperty(msg[0])){
                if (ws.mapping[msg[0]].indexOf('ticker') != -1){
                    var ticker_list = ws.mapping[msg[0]];
                    ws.tickers[ticker_list].unshift(msg);
                }
                else if (ws.mapping[msg[0]].indexOf('trades') != -1){
                    var trade_list = ws.mapping[msg[0]];
                    if (msg[1].length > 5){msg[1].forEach(function(trade){ws.trades[trade_list].unshift(trade)})}
                    else {ws.trades[trade_list].unshift(msg);}
                }
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