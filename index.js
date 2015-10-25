var rest = require('./rest.js'),
    ws = require('./ws.js');

var BFX = function(api_key, api_secret){
    this.api_key = api_key;
    this.api_secret = api_secret;
    this.rest = new rest(this.api_key, this.api_secret);
    this.ws = new ws(this.api_key, this.api_secret);
};

module.exports = BFX;