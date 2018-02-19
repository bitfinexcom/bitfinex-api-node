'use strict'

const rp = require('request-promise')

const RESTv1 = require('./rest')
const { genAuthSig, nonce } = require('../util')
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
const API_URL = 'https://api.bitfinex.com'

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
   * @param {Object} opts.agent - optional node agent for connection (proxy)
   */
  constructor (opts = {
    apiKey: '',
    apiSecret: '',
    url: API_URL,
    transform: false,
    agent: null
  }) {
    this._url = opts.url || API_URL
    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._transform = !!opts.transform
    this._agent = opts.agent

    // Used for methods that are not yet implemented on REST v2
    this._rest1 = new RESTv1(opts)
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
    const n = nonce()
    const sigPayload = `/api/v2${path}${n}${JSON.stringify(payload)}`
    const { sig } = genAuthSig(this._apiSecret, sigPayload)

    return rp({
      url,
      method: 'POST',
      headers: {
        'bfx-nonce': n,
        'bfx-apikey': this._apiKey,
        'bfx-signature': sig
      },
      agent: this._agent,
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
      agent: this._agent,
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
   * @see https://docs.bitfinex.com/v2/reference#rest-public-ticker
   */
  ticker (symbol = 'tBTCUSD', cb) {
    return this._makePublicRequest(`/ticker/${symbol}`, cb, Tick)
  }

  /**
   * @param {string[]} symbols
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-tickers
   */
  tickers (symbols = [], cb) {
    if (typeof symbols === 'function' || typeof cb === 'undefined') {
      return Promise.reject(new Error('symbols required'))
    }

    return this._makePublicRequest(`/tickers?symbols=${symbols.join(',')}`, cb, Tick)
  }

  /**
   * @param {string} key
   * @param {string} context
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-stats
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-list
   */
  alertList (type = 'price', cb) {
    return this._makeAuthRequest('/auth/r/alerts', { type }, cb, Alert)
  }

  /**
   * @param {string} type
   * @param {string} symbol
   * @param {number} price
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-set
   */
  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/set', { type, symbol, price }, cb, Alert)
  }

  /**
   * @param {string} symbol
   * @param {number} price
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-delete
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-trades-hist
   */
  trades (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this._makeAuthRequest(`/auth/r/trades/${symbol}/hist`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets
   */
  wallets (cb) {
    return this._makeAuthRequest('/auth/r/wallets', {}, cb, Wallet)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-orders
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
   * @see https://docs.bitfinex.com/v2/reference#orders-history
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-order-trades
   */
  orderTrades (symbol = 'tBTCUSD', start = null, end = null, limit = null, orderID, cb) {
    return this._makeAuthRequest(`/auth/r/order/${symbol}:${orderID}/trades`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions
   */
  positions (cb) {
    return this._makeAuthRequest('/auth/r/positions', {}, cb, Position)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers-hist
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans-hist
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits-hist
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-trades-hist
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-margin
   */
  marginInfo (key = 'base', cb) {
    return this._makeAuthRequest(`/auth/r/info/margin/${key}`, {}, cb, MarginInfo)
  }

  /**
   * @param {string} key
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-funding
   */
  fundingInfo (key = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/info/funding/${key}`, {}, cb)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-performance
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
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-calc-bal-avail
   */
  calcAvailableBalance (symbol = 'tBTCUSD', dir, rate, type, cb) {
    return this._makeAuthRequest('/auth/r/calc/order/avail', {
      symbol,
      dir,
      rate,
      type
    }, cb)
  }

  /**
   * Get a list of valid symbol names
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-public-symbols
   */
  symbols (cb) {
    return this._rest1.make_public_request('symbols', (err, symbols) => {
      if (err) {
        return cb(err)
      }
      return cb(null, symbols.map(symbol => 't' + symbol.toUpperCase()))
    })
  }

  /**
   * Get a list of valid symbol names and details
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-public-symbol-details
   */
  symbolDetails (cb) {
    return this._rest1.make_public_request('symbols_details', cb)
  }

  /**
   * Request information about your account
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-account-info
   */
  accountInfo (cb) {
    return this._rest1.make_request('account_infos', {}, cb)
  }

  /**
   * Request account withdrawl fees
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-fees
   */
  accountFees (cb) {
    return this._rest1.make_request('account_fees', {}, cb)
  }

  /**
   * Returns a 30-day summary of your trading volume and return on margin
   * funding.
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-summary
   */
  accountSummary (cb) {
    return this._rest1.make_request('summary', {}, cb)
  }

  /**
   * Request a deposit address
   *
   * @param {Object} params
   * @param {string} params.request
   * @param {string} params.nonce
   * @param {string} params.method - name of currency
   * @param {string} params.wallet_name - 'trading', 'exchange' or 'deposit'
   * @param {number} params.renew - 1 or 0
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-deposit
   */
  deposit (params, cb) {
    return this._rest1.make_request('deposit/new', params, cb)
  }

  /**
   * Requests a withdrawl from a wallet
   *
   * @param {Object} params
   * @param {string} params.withdraw_type - name of currency
   * @param {string} params.walletselected - 'trading', 'exchange, or 'deposit'
   * @param {string} params.amount
   * @param {string} params.address
   * @param {string} params.payment_id - optional, for monero
   * @param {string} params.account_name
   * @param {string} params.account_number
   * @param {string} params.swift
   * @param {string} params.bank_name
   * @param {string} params.bank_address
   * @param {string} params.bank_city
   * @param {string} params.bank_country
   * @param {string} params.detail_payment - message to beneficiary
   * @param {number} params.expressWire - 1 or 0
   * @param {string} params.intermediary_bank_name
   * @param {string} params.intermediary_bank_address
   * @param {string} params.intermediary_bank_city
   * @param {string} params.intermediary_bank_country
   * @param {string} params.intermediary_bank_account
   * @param {string} params.intermediary_bank_swift
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-withdrawal
   */
  withdraw (params, cb) {
    return this._rest1.make_request('withdraw', params, cb)
  }

  /**
   * Execute a balance transfer between wallets
   *
   * @param {Object} params
   * @param {number} params.amount - amount to transfer
   * @param {string} params.currency - currency of funds to transfer
   * @param {string} params.walletFrom - wallet to transfer from
   * @param {string} params.walletTo - wallet to transfer to
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-transfer-between-wallets
   */
  transfer (params, cb) {
    return this.make_request('transfer', params, cb)
  }

  /**
   * Fetch the permissions of the key being used to generate this request
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#auth-key-permissions
   */
  keyPermissions (cb) {
    return this._rest1.make_request('key_info', {}, cb)
  }

  /**
   * Request your wallet balances
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances
   */
  balances (cb) {
    return this._rest1.make_request('balances', {}, cb)
  }

  /**
   * @param {Object} params
   * @param {number} params.position_id
   * @param {number} params.amount
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-claim-position
   */
  claimPosition (params, cb) {
    return this._rest1.make_request('positions/claim', params, cb)
  }
  
  /**
   * @param {Object} params
   * @param {number} params.position_id
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-close-position
   */
  closePosition (params, cb) {
    return this._rest1.make_request('positions/close', params, cb)
  }
}

module.exports = RESTv2
