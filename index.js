"use strict";

var APIRest = require('./rest.js');
var WS = require('./ws.js');

var BFX = function (api_key, api_secret){
    this.api_key = api_key;
    this.api_secret = api_secret;
    this.rest = new APIRest(this.api_key, this.api_secret);
    this.ws = new WS(this.api_key, this.api_secret);
};

BFX.WS = WS;
BFX.APIRest = APIRest;

module.exports = BFX;
