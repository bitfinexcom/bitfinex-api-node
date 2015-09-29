/**
 * Created by joshuarossi on 9/28/15.
 */
var WebSocket = require('ws');
var ws = new WebSocket("wss://api2.bitfinex.com:3001/ws");
console.log(ws);
module.exports = {
    websocket: function() {
        return ws
    },

    rest: function() {
        var rest = {};
        return rest;
    }
};