'use strict'

const rp = require('request-promise')

const { genAuthSig } = require('../util')
const {
  FundingCredit,
  FundingLoan,
  FundingOffer,
  FundingTrade,
  MarginInfo,
  Order,
  Position,
  Trade,
  Wallet,
  Alert,
  Tick
} = require('../models')

const BASE_TIMEOUT = 15000
const API_URL = 'https://api.bitfinex.com/'

/**
 * Communicates with v2 of the Bitfinex HTTP API
 */
class RESTv2 {
  /**
   * Instantiate a new REST v2 transport.
   *
   * @param {Object} opts
   * @param {string} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.url - endpoint URL
   * @param {boolean} opts.transform - default false
   */
  constructor (opts = {
    apiKey: '',
    apiSecret: '',
    url: API_URL,
    transform: false
  }) {
    this._url = opts.url || API_URL
    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._nonce = Date.now()
    this._transform = !!opts.transform
    this._generateNonce = (typeof opts.nonceGenerator === 'function')
      ? opts.nonceGenerator
      : () => ++this._nonce
  }

  /**
   * @private
   */
  genericCallback (err, result) {
    console.log(err, result)
  }

  /**
   * @param {string} path
   * @param {Object} payload
   * @param {Method} cb
   * @param {Object} modelClass
   * @private
   */
  _makeAuthRequest (path, payload = {}, cb = this.genericCallback, modelClass) {
    if (!this._apiKey || !this._apiSecret) {
      return cb(new Error('missing api key or secret'))
    }

    const url = `${this._url}/v2${path}`
    const nonce = JSON.stringify(this._generateNonce())
    const sigPayload = `/api/v2${path}${nonce}${JSON.stringify(payload)}`
    const { sig } = genAuthSig(this._apiSecret, sigPayload)

    return rp({
      url,
      method: 'POST',
      headers: {
        'bfx-nonce': nonce,
        'bfx-apikey': this._apiKey,
        'bfx-signature': sig
      },
      body: payload,
      json: true
    })
    .then(this._doTransform.bind(this, modelClass))
    .then(res => cb(null, res))
    .catch((err) => {
      if (err.error && err.error[1] === 10114) {
        err.message += ' see https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }

      cb(new Error(err))
    })
  }

  /**
   * @param {string} path
   * @param {Method} cb
   * @param {Object} modelClass
   * @private
   */
  _makePublicRequest (path, cb = this.genericCallback, modelClass) {
    const url = `${this._url}/v2${path}`

    return rp({
      url,
      method: 'GET',
      timeout: BASE_TIMEOUT,
      json: true
    })
    .then(this._doTransform.bind(this, modelClass))
    .then(res => cb(null, res))
    .catch(error => cb(new Error(error)))
  }

  /**
   * @param {Object} ModelClass
   * @param {Object} data
   * @return {Object|Object[]} finalData
   * @private
   */
  _doTransform (ModelClass, data) {
    if (!data || data.length === 0) return []
    if (!ModelClass || !this._transform) return data

    if (Array.isArray(data[0])) {
      return data.map(row => new ModelClass(row))
    }

    return new ModelClass(data)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   */
  ticker (symbol = 'tBTCUSD', cb) {
    return this._makePublicRequest(`/ticker/${symbol}`, cb, Tick)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   */
  tickers (cb) {
    return this._makePublicRequest('/tickers', cb, Tick)
  }

  /**
   * @param {string} key
   * @param {string} context
   * @param {Method} cb
   * @return {Promise} p
   */
  stats (key = 'pos.size:1m:tBTCUSD:long', context = 'hist', cb) {
    return this._makePublicRequest(`/stats1/${key}/${context}`, cb)
  }

  /**
   *
   * @param {Object} opts
   * @param {string} opts.timeframe - 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M
   * @param {string} opts.symbol
   * @param {string} opts.section - hist, last
   * @param {Method} cb
   * @return {Promise} p
   * @see http://docs.bitfinex.com/v2/reference#rest-public-candles
   */
  candles ({ timeframe = '1m', symbol = 'tBTCUSD', section = 'hist' }, cb) {
    return this._makePublicRequest(`/candles/trade:${timeframe}:${symbol}/${section}`, cb)
  }

  /**
   * @param {string} type
   * @param {Method} cb
   * @return {Promise} p
   */
  alertList (type = 'price', cb) {
    return this._makeAuthRequest('/auth/r/alerts', { type }, cb, Alert)
  }

  /**
   * @param {string} type
   * @param {string} symbol
   * @param {number} price
   * @return {Promise} p
   */
  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/set', { type, symbol, price }, cb, Alert)
  }

  /**
   * @param {string} symbol
   * @param {number} price
   * @return {Promise} p
   */
  alertDelete (symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/del', { symbol, price }, cb)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   */
  trades (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/trades/${symbol}/hist`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   */
  wallets (cb) {
    return this._makeAuthRequest('/auth/r/wallets', {}, cb, Wallet)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   */
  activeOrders (cb) {
    return this._makeAuthRequest('/auth/r/orders', {}, cb, Order)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   */
  orderHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/orders/${symbol}/hist`, {
      start, end, limit
    }, cb, Order)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {number} orderID
   * @param {Method} cb
   * @return {Promise} p
   */
  orderTrades (symbol = 'tBTCUSD', start = null, end = null, limit = null, orderID, cb) {
    return this._makeAuthRequest(`/auth/r/order/${symbol}:${orderID}/trades`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   */
  positions (cb) {
    return this._makeAuthRequest('/auth/r/positions', {}, cb, Position)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingOffers (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}`, {}, cb, FundingOffer)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingOfferHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingOffer)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingLoans (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}`, {}, cb, FundingLoan)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingLoanHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingLoan)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingCredits (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}`, {}, cb, FundingCredit)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingCreditHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingCredit)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingTrades (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/trades/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingTrade)
  }

  /**
   * @param {string} key
   * @param {Method} cb
   * @return {Promise} p
   */
  marginInfo (key = 'base', cb) {
    return this._makeAuthRequest(`/auth/r/info/margin/${key}`, {}, cb, MarginInfo)
  }

  /**
   * @param {string} key
   * @param {Method} cb
   * @return {Promise} p
   */
  fundingInfo (key = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/info/funding/${key}`, {}, cb)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   */
  performance (cb) {
    return this._makeAuthRequest('/auth/r/stats/perf:1D/hist', {}, cb)
  }

  /**
   * @param {string} symbol
   * @param {string} dir
   * @param {number} rate
   * @param {string} type
   * @param {Method} cb
   * @return {Promise} p
   */
  calcAvailableBalance (symbol = 'tBTCUSD', dir, rate, type, cb) {
    return this._makeAuthRequest('/auth/r/calc/order/avail', {
      symbol,
      dir,
      rate,
      type
    }, cb)
  }
}

module.exports = RESTv2
