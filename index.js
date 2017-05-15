'use strict'

const REST = require('./rest.js')
const WS = require('./ws.js')
const REST2 = require('./rest2.js')
const WS2 = require('./ws2.js')

class BFX {
  constructor (apiKey, apiSecret, version) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret

    // eslint-disable-next-line eqeqeq
    if (version == 2) { // XXX make strict on next major version bump / breaking change
      this.rest = new REST2(this.apiKey, this.apiSecret)
      this.ws = new WS2(this.apiKey, this.apiSecret)
    } else {
      this.rest = new REST(this.apiKey, this.apiSecret)
      this.ws = new WS(this.apiKey, this.apiSecret)
    }
  }
}

module.exports = BFX
