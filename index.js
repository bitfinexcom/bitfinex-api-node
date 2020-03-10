'use strict'

const { RESTv1, RESTv2 } = require('bfx-api-node-rest')
const WSv1 = require('bfx-api-node-ws1')
const WSv2 = require('./lib/transports/ws2')
const WS2Manager = require('./lib/ws2_manager')

/**
 * Provides access to versions 1 & 2 of the HTTP & WebSocket Bitfinex APIs
 */
class BFX {
  /**
   * @param {object} opts - options
   * @param {string} opts.apiKey - API key
   * @param {string} opts.apiSecret - API secret
   * @param {string} opts.authToken - optional auth option
   * @param {string} opts.transform - if true, packets are converted to models
   * @param {string} opts.nonceGenerator - optional
   * @param {string} opts.ws - ws transport options
   * @param {string} opts.rest - rest transport options
   */
  constructor (opts = {
    apiKey: '',
    apiSecret: '',
    authToken: '',
    company: '',
    transform: false,
    ws: {},
    rest: {}
  }) {
    if (opts.constructor.name !== 'Object') {
      throw new Error([
        'constructor takes an object since version 2.0.0, see:',
        'https://github.com/bitfinexcom/bitfinex-api-node#version-200-breaking-changes\n'
      ].join('\n'))
    }

    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._authToken = opts.authToken || ''
    this._company = opts.company || ''
    this._transform = opts.transform === true
    this._wsArgs = opts.ws || {}
    this._restArgs = opts.rest || {}
    this._transportCache = {
      rest: {},
      ws: {}
    }
  }

  /**
   * Returns an arguments map ready to pass to a transport constructor
   *
   * @param {object} extraOpts - options to pass to transport
   * @returns {object} payload
   */
  _getTransportPayload (extraOpts) {
    return {
      apiKey: this._apiKey,
      apiSecret: this._apiSecret,
      authToken: this._authToken,
      company: this._company,
      transform: this._transform,
      ...extraOpts
    }
  }

  /**
   * Returns a new REST API class instance (cached by version)
   *
   * @param {number} version - 1 or 2 (default)
   * @param {object} extraOpts - passed to transport constructor
   * @returns {RESTv1|RESTv2} transport
   */
  rest (version = 2, extraOpts = {}) {
    if (version !== 1 && version !== 2) {
      throw new Error(`invalid http API version: ${version}`)
    }

    const key = `${version}|${JSON.stringify(extraOpts)}`

    if (!this._transportCache.rest[key]) {
      Object.assign(extraOpts, this._restArgs)
      const payload = this._getTransportPayload(extraOpts)

      this._transportCache.rest[key] = version === 2
        ? new RESTv2(payload)
        : new RESTv1(payload)
    }

    return this._transportCache.rest[key]
  }

  /**
   * Returns a new WebSocket API class instance (cached by version)
   *
   * @param {number} version - 1 or 2 (default)
   * @param {object} extraOpts - passed to transport constructor
   * @returns {WSv1|WSv2} transport
   */
  ws (version = 2, extraOpts = {}) {
    if (version !== 1 && version !== 2) {
      throw new Error(`invalid websocket API version: ${version}`)
    }

    const key = `${version}|${JSON.stringify(extraOpts)}`

    if (!this._transportCache.ws[key]) {
      Object.assign(extraOpts, this._wsArgs)
      const payload = this._getTransportPayload(extraOpts)

      this._transportCache.ws[key] = version === 2
        ? new WSv2(payload)
        : new WSv1(payload)
    }

    return this._transportCache.ws[key]
  }
}

module.exports = BFX
module.exports.RESTv1 = RESTv1
module.exports.RESTv2 = RESTv2
module.exports.WSv1 = WSv1
module.exports.WSv2 = WSv2
module.exports.WS2Manager = WS2Manager
