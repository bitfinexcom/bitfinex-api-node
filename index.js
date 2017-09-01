'use strict'

const REST = require('./rest.js')
const WS = require('./ws.js')
const REST2 = require('./rest2.js')
const WS2 = require('./ws2.js')

const t = require('./lib/transformer.js')

class BFX {
  constructor (apiKey, apiSecret, opts = { version: 1, transform: false, nonceGenerator: false }) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret

    if (opts.autoOpen !== false) {
      opts.autoOpen = true
    }

    if (typeof opts === 'number') {
      const msg = [
        'constructor takes an object since version 1.0.0, see:',
        'https://github.com/bitfinexcom/bitfinex-api-node#version-100-breaking-changes',
        ''
      ].join('\n')
      throw new Error(msg)
    }

    let transformer = function passThrough (d) { return d }
    if (opts.transform === true) {
      transformer = t
    }

    if (typeof opts.transform === 'function') {
      transformer = opts.transform
    }

    if (opts.version === 2) {
      this.rest = new REST2(this.apiKey, this.apiSecret, { transformer: transformer })
      this.ws = new WS2(this.apiKey, this.apiSecret, { transformer: transformer })
      opts.autoOpen && this.ws.open()
      return
    }

    this.rest = new REST(this.apiKey, this.apiSecret, opts)
    this.ws = new WS(this.apiKey, this.apiSecret)
    opts.autoOpen && this.ws.open()
  }
}

module.exports = BFX
