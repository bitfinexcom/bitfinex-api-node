'use strict'

const RESTv1 = require('./lib/transports/rest.js')
const WSv1 = require('./lib/transports/ws.js')
const RESTv2 = require('./lib/transports/rest2.js')
const WSv2 = require('./lib/transports/ws2.js')

/**
 * Provides access to versions 1 & 2 of the HTTP & WebSocket Bitfinex APIs
 */
class BFX {
  /**
   * @param {Object} opts 
   * @param {string} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.transform - if true, packets are converted to models
   * @param {string} opts.nonceGenerator - optional
   * @param {string} opts.wsURL - optional websocket connection URL
   * @param {string} opts.restURL - optional http api endpoint
   */
  constructor (opts = { 
    apiKey: '',
    apiSecret: '',
    transform: false
  }) {
    if (opts.constructor.name !== 'Object') {
      throw new Error([
        'constructor takes an object since version 2.0.0, see:',
        'https://github.com/bitfinexcom/bitfinex-api-node#version-200-breaking-changes\n',
      ].join('\n'))
    }

    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._transform = !!opts.transform
    this._wsURL = opts.wsURL
    this._restURL = opts.restURL
    this._transportCache = {
      rest: {},
      ws: {}
    }
  }

  _getTransportPayload(extraOpts) {
    return Object.assign({
      apiKey: this._apiKey,
      apiSecret: this._apiSecret,
      transform: this._transform
    }, extraOpts)
  }

  /**
   * Returns a new REST API class instance (cached by version)
   *
   * @param {number} version - 1 or 2 (default)
   * @param {Object} extraOpts - passed to transport constructor
   * @return {RESTv1|RESTv2} transport
   */
  rest(version = 2, extraOpts = {}) {
    if (version !== 1 && version !== 2) {
      throw new Error(`invalid http API version: ${version}`)
    }

    if (!this._transportCache.rest[version]) {
      if (this._restURL && !extraOpts.url) {
        extraOpts.url = this._restURL
      }

      const payload = this._getTransportPayload(extraOpts)

      this._transportCache.rest[version] = version === 2
        ? new RESTv2(payload)
        : new RESTv1(payload)
    }

    return this._transportCache.rest[version]
  }

  /**
   * Returns a new WebSocket API class instance (cached by version)
   *
   * @param {number} version - 1 or 2 (default)
   * @param {Object} extraOpts - passed to transport constructor
   * @return {WSv1|WSv2} transport
   */
  ws(version = 2, extraOpts = {}) {
    if (version !== 1 && version !== 2) {
      throw new Error(`invalid websocket API version: ${version}`)
    }

    if (!this._transportCache.ws[version]) {
      if (this._wsURL && !extraOpts.url) {
        extraOpts.url = this._wsURL
      }

      const payload = this._getTransportPayload(extraOpts)

      this._transportCache.ws[version] = version === 2
        ? new WSv2(payload)
        : new WSv1(payload)
    }

    return this._transportCache.ws[version]
  }
}

module.exports = BFX
