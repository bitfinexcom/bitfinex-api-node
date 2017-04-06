"use strict"

const REST = require('./rest.js')
const WS = require('./ws.js')
const REST2 = require('./rest2.js')
const WS2 = require('./ws2.js')


class BFX {
  constructor (api_key, api_secret, version) {
    this.api_key = api_key
    this.api_secret = api_secret
    if (version == 2) {
      this.rest = new REST2(this.api_key, this.api_secret)
      this.ws = new WS2(this.api_key, this.api_secret)
    } else {
      this.rest = new REST(this.api_key, this.api_secret)
      this.ws = new WS(this.api_key, this.api_secret)
    }
  }
}

module.exports = BFX