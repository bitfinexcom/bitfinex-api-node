rest = function(){
    var a = {};
    a.url = "https://api.bitfinex.com/v1";
    a.request = require('request');
    a.api_key = "";
    a.api_secret = "";
    a.baseRequest = a.request.defaults({
            headers: {
                'X-BFX-APIKEY': a.api_key
            },
            baseUrl: "https://api.bitfinex.com/v1"
        });
    a.genericCallback = function(error, response, body) {
        console.log(body);
    };
    a.makeUnauthenticatedRequest = function(endpoint, callback){
        a.request.get(a.url + endpoint, callback)
    };
    a.makeAuthenticatedRequest = function(endpoint, payload, callback){
        if (!payload){payload = {}}
        if (!callback){ callback = function(error, response, body) {console.log(body);}}
        payload.request = "/v1/" + endpoint;
        payload.nonce =  Date.now().toString();
        payload = new Buffer(JSON.stringify(payload)).toString('base64');
        var signature = crypto.createHmac("sha384", a.api_secret).update(payload).digest('hex');
        var options = {
            url: endpoint,
            headers: {
                'X-BFX-PAYLOAD': payload,
                'X-BFX-SIGNATURE': signature
            },
            body: payload
        };
        a.baseRequest.post(options, callback)
    };
    a.getTicker = function (symbol, callback) {

        if (!symbol) {
            symbol = 'BTCUSD';
        }
        if (!callback){ callback = a.genericCallback}
        a.request.get(a.url + '/pubticker/' + symbol, callback);
    };
    return a;
};