'use strict'

const WSv2 = require('./lib/transports/ws2')
const RESTv2 = require('./lib/transports/rest2')
const t = require('./lib/transformer.js')

class BFX {
  constructor (opts) {
    if (typeof opts === 'number') {
      const msg = [
        'constructor takes an object since version 1.0.0, see:',
        'https://github.com/bitfinexcom/bitfinex-api-node#version-100-breaking-changes',
        ''
      ].join('\n')
      throw new Error(msg)
    }

    const { apiKey, apiSecret, transform, autoOpen } = opts

    this.apiKey = apiKey
    this.apiSecret = apiSecret

    if (opts.autoOpen !== false) {
      opts.autoOpen = true
    }

    this.rest = new RESTv2({
      apiKey,
      apiSecret,
      transform,
    })

    this.ws = new WSv2({
      apiKey,
      apiSecret,
      url: opts.wsURL,
      agent: opts.wsAgent,
      transform
    })

    if (autoOpen !== false) {
      this.ws.open()
    }
  }
}

module.exports = BFX
