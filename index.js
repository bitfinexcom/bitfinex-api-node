/**
 * Created by joshuarossi on 9/28/15.
 */
module.exports = {
    websocket: function() {
        var key = '';
        var secret = '';
        ws = new WebSocket("wss://api2.bitfinex.com:3001/ws");
        return ws;
    },

    rest: function() {
        var rest = {};
        return rest;
    }
};