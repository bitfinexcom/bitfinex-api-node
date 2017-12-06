'use strict'

const rp = require('request-promise')
const crypto = require('crypto')

const { genAuthSig } = require('../util')
const {
  BalanceInfo,
  FundingCredit,
  FundingInfo,
  FundingLoan,
  FundingOffer,
  FundingTrade,
  MarginInfo,
  Notification,
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

  genericCallback (err, result) {
    console.log(err, result)
  }

  _makeAuthRequest (path, payload = {}, cb = this.genericCallback, modelClass) {
    if (!this._apiKey || !this._apiSecret) {
      return cb(new Error('missing api key or secret'))
    }

    if (arguments.length !== 3) {
      return cb(
        new Error(
          'argument length invalid: request must have a path, payload and cb'
        )
      )
    }

    const url = `${this._url}/v2/${path}`
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
    .catch((error) => {
      if (error.error[1] === 10114) {
        error.message += ' see https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }

      cb(new Error(error))
    })
  }

  _makePublicRequest (name, cb = this.genericCallback, modelClass) {
    const url = `${this._url}/v2/${name}`

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

  _doTransform (ModelClass, data) {
    if (!data || data.length === 0) return []
    if (!ModelClass || !this._transform) return data

    if (Array.isArray(data[0])) {
      return data.map(row => new ModelClass(row))
    }

    return new ModelClass(data)
  }

  // Public endpoints

  ticker (symbol = 'tBTCUSD', cb) {
    return this._makePublicRequest(`ticker/${symbol}`, cb, Tick)
  }

  tickers (cb) {
    return this._makePublicRequest('tickers', cb, Tick)
  }

  stats (key = 'pos.size:1m:tBTCUSD:long', context = 'hist', cb) {
    return this._makePublicRequest(`stats1/${key}/${context}`, cb)
  }

  // timeframes: '1m', '5m', '15m', '30m', '1h', '3h', '6h', '12h', '1D', '7D', '14D', '1M'
  // sections: 'last', 'hist'
  // note: query params can be added: see
  // http://docs.bitfinex.com/v2/reference#rest-public-candles
  candles ({ timeframe = '1m', symbol = 'tBTCUSD', section = 'hist' }, cb) {
    return this._makePublicRequest(`candles/trade:${timeframe}:${symbol}/${section}`, cb)
  }

  // Auth endpoints
  alertList (type = 'price', cb) {
    return this._makeAuthRequest('/auth/r/alerts', { type }, cb, Alert)
  }

  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0) {
    return this._makeAuthRequest('/auth/w/alert/set', { type, symbol, price }, Alert)
  }

  alertDelete (symbol = 'tBTCUSD', price = 0) {
    return this._makeAuthRequest('/auth/w/alert/set', { symbol, price })
  }

  trades (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/trades/${symbol}/hist`, {
      start, end, limit
    }, cb, Trade)
  }

  wallets (cb) {
    return this._makeAuthRequest('/auth/r/wallets', {}, cb, Wallet)
  }

  activeOrders (cb) {
    return this._makeAuthRequest('/auth/r/orders', {}, cb, Order)
  }

  orderHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/orders/${symbol}/hist`, {
      start, end, limit
    }, cb, Order)
  }

  orderTrades (symbol = 'tBTCUSD', orderID, cb) {
    return this._makeAuthRequest(`/auth/r/order/${symbol}:${orderID}/trades`, {
      start, end, limit
    }, cb, Trade)
  }

  positions (cb) {
    return this._makeAuthRequest('/auth/r/positions', {}, cb, Position)
  }

  fundingOffers (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}`, {}, cb, FundingOffer)
  }

  fundingOfferHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingOffer)
  }

  fundingLoans (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}`, {}, cb, FundingLoan)
  }

  fundingLoanHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingLoan)
  }

  fundingCredits (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}`, {}, cb, FundingCredit)
  }

  fundingCreditHistory (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingCredit)
  }

  fundingTrades (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/funding/trades/${symbol}/hist`, {
      start, end, limit
    }, cb, FundingTrade)
  }

  marginInfo (key = 'base', cb) {
    return this._makeAuthRequest(`/auth/r/info/margin/${key}`, {}, cb, MarginInfo)
  }

  fundingInfo (key = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/info/funding/${key}`, {}, cb)
  }

  performance (cb) {
    return this._makeAuthRequest('/auth/r/stats/perf:1D/hist', {}, cb)
  }

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
