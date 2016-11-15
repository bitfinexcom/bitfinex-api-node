"use strict"

var APIRest = require('./rest.js')
var WS = require('./ws.js')

var BFX = function(api_key, api_secret, version) {
  this.api_key = api_key
  this.api_secret = api_secret
  if (version == 2) {
    this.rest = new Rest2(this.api_key, this.api_secret)
    this.ws = new WS2(this.api_key, this.api_secret)
  } else {
    this.rest = new APIRest(this.api_key, this.api_secret, version)
    this.ws = new WS(this.api_key, this.api_secret, version)
  }

}

BFX.WS = WS
BFX.APIRest = APIRest

module.exports = BFX;