'use strict'
/* eslint camelcase: "off" */

const request = require('request')
const { genAuthSig, nonce } = require('../util')

const API_URL = 'https://api.bitfinex.com'

/**
 * Communicates with v1 of the Bitfinex HTTP API
 */
class RESTv1 {
  constructor (opts = {
    apiKey: '',
    apiSecret: '',
    url: API_URL,
    agent: null
  }) {
    this._url = opts.url || API_URL
    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._agent = opts.agent
    this._generateNonce = (typeof opts.nonceGenerator === 'function')
      ? opts.nonceGenerator
      : nonce
  }

  _parse_req_body (body, cb) {
    let result

    try {
      result = JSON.parse(body)
    } catch (error) {
      return cb(error)
    }

    if (typeof result.message === 'string') {
      if (result.message.indexOf('Nonce is too small') !== -1) {
        result.message += ' See https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }

      return cb(new Error(result.message))
    }

    return cb(null, result)
  }

  make_request (path, params, cb) {
    if (!this._apiKey || !this._apiSecret) {
      return cb(new Error('missing api key or secret'))
    }

    const payload = Object.assign({
      request: `/v1/${path}`,
      nonce: JSON.stringify(this._generateNonce())
    }, params)

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')
    const { sig } = genAuthSig(this._apiSecret, payloadBase64)

    return request({
      url: `${this._url}/v1/${path}`,
      method: 'POST',
      timeout: 15000,
      agent: this._agent,
      headers: {
        'X-BFX-APIKEY': this._apiKey,
        'X-BFX-PAYLOAD': payloadBase64,
        'X-BFX-SIGNATURE': sig
      }
    }, (err, res, body) => {
      if (err) return cb(err)
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        return cb(
          new Error(`HTTP code ${res.statusCode} ${res.statusMessage || ''}`)
        )
      }

      this._parse_req_body(body, cb)
    })
  }

  make_public_request (path, cb) {
    return request({
      method: 'GET',
      agent: this._agent,
      timeout: 15000,
      url: `${this._url}/v1/${path}`
    }, (err, res, body) => {
      if (err) return cb(err)
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        return cb(
          new Error(`HTTP code ${res.statusCode} ${res.statusMessage || ''}`)
        )
      }

      this._parse_req_body(body, cb)
    })
  }

  ticker (symbol = 'BTCUSD', cb) {
    if (!cb) {
      cb = (err, data) => {
        if (err) {
          console.error(err)
        }

        console.log(data)
      }
    }

    return this.make_public_request(`pubticker/${symbol}`, cb)
  }

  today (symbol, cb) {
    return this.make_public_request(`today/${symbol}`, cb)
  }

  stats (symbol, cb) {
    return this.make_public_request(`stats/${symbol}`, cb)
  }

  fundingbook (currency, options, cb) {
    let uri = `lendbook/${currency}`

    if (typeof options === 'function') {
      cb = options
    } else {
      const keys = Object.keys(options)

      for (let i = 0; i < keys.length; i++) {
        uri += `${i === 0 ? '/?' : '&'}${keys[i]}=${options[keys[i]]}`
      }
    }

    return this.make_public_request(uri, cb)
  }

  orderbook (symbol, options, cb) {
    let uri = `book/${symbol}`

    if (typeof options === 'function') {
      cb = options
    } else {
      const keys = Object.keys(options)

      for (let i = 0; i < keys.length; i++) {
        uri += `${i === 0 ? '/?' : '&'}${keys[i]}=${options[keys[i]]}`
      }
    }

    return this.make_public_request(uri, cb)
  }

  trades (symbol, cb) {
    return this.make_public_request('trades/' + symbol, cb)
  }

  lends (currency, cb) {
    return this.make_public_request('lends/' + currency, cb)
  }

  get_symbols (cb) {
    return this.make_public_request('symbols', cb)
  }

  symbols_details (cb) {
    return this.make_public_request('symbols_details', cb)
  }

  new_order (symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb) {
    if (typeof is_hidden === 'function') {
      cb = is_hidden
      is_hidden = false
    }

    if (typeof postOnly === 'function') {
      cb = postOnly
      postOnly = false
    }

    const params = {
      symbol,
      amount,
      price,
      exchange,
      side,
      type
    }

    if (postOnly) params['post_only'] = true
    if (is_hidden) params['is_hidden'] = true

    return this.make_request('order/new', params, cb)
  }

  multiple_new_orders (orders, cb) {
    return this.make_request('order/new/multi', { orders }, cb)
  }

  cancel_order (order_id, cb) {
    return this.make_request('order/cancel', {
      order_id: parseInt(order_id)
    }, cb)
  }

  cancel_all_orders (cb) {
    return this.make_request('order/cancel/all', {}, cb)
  }

  cancel_multiple_orders (order_ids, cb) {
    return this.make_request('order/cancel/multi', {
      order_ids: order_ids.map(id => parseInt(id))
    }, cb)
  }

  replace_order (order_id, symbol, amount, price, exchange, side, type, cb) {
    return this.make_request('order/cancel/replace', {
      order_id: parseInt(order_id),
      symbol,
      amount,
      price,
      exchange,
      side,
      type
    }, cb)
  }

  // TODO: Why is order_id not parsed here as above? Also applies to further
  //       instances below
  order_status (order_id, cb) {
    return this.make_request('order/status', {
      order_id: parseInt(order_id)
    }, cb)
  }

  active_orders (cb) {
    return this.make_request('orders', {}, cb)
  }

  orders_history (cb) {
    return this.make_request('orders/hist', {}, cb)
  }

  active_positions (cb) {
    return this.make_request('positions', {}, cb)
  }

  claim_position (position_id, amount, cb) {
    return this.make_request('position/claim', {
      position_id: parseInt(position_id),
      amount
    }, cb)
  }

  balance_history (currency, options, cb) {
    const params = { currency }

    if (typeof options === 'function') {
      cb = options
    } else if (options && options.constructor.name === 'Object') {
      Object.assign(params, options)
    }

    return this.make_request('history', params, cb)
  }

  movements (currency, options, cb) {
    const params = { currency }

    if (typeof options === 'function') {
      cb = options
    } else if (options && options.constructor.name === 'Object') {
      Object.assign(params, options)
    }

    return this.make_request('history/movements', params, cb)
  }

  past_trades (symbol, options, cb) {
    const params = { symbol }

    if (typeof options === 'function') {
      cb = options
    } else if (options && options.constructor.name === 'Object') {
      Object.assign(params, options)
    }

    return this.make_request('mytrades', params, cb)
  }

  new_deposit (currency, method, wallet_name, cb) {
    return this.make_request('deposit/new', {
      currency,
      method,
      wallet_name
    }, cb)
  }

  new_offer (currency, amount, rate, period, direction, cb) {
    return this.make_request('offer/new', {
      currency,
      amount,
      rate,
      period,
      direction
    }, cb)
  }

  cancel_offer (offer_id, cb) {
    return this.make_request('offer/cancel', {
      offer_id: parseInt(offer_id)
    }, cb)
  }

  offer_status (offer_id, cb) {
    return this.make_request('offer/status', {
      offer_id: parseInt(offer_id)
    }, cb)
  }

  active_offers (cb) {
    return this.make_request('offers', {}, cb)
  }

  active_credits (cb) {
    return this.make_request('credits', {}, cb)
  }

  wallet_balances (cb) {
    return this.make_request('balances', {}, cb)
  }

  taken_swaps (cb) {
    return this.make_request('taken_funds', {}, cb)
  }

  total_taken_swaps (cb) {
    return this.make_request('total_taken_funds', {}, cb)
  }

  close_swap (swap_id, cb) {
    return this.make_request('swap/close', {
      swap_id: parseInt(swap_id)
    }, cb)
  }

  account_infos (cb) {
    return this.make_request('account_infos', {}, cb)
  }

  margin_infos (cb) {
    return this.make_request('margin_infos', {}, cb)
  }

  /**
   * POST /v1/withdraw
   *
   * @param {string} withdrawType "bitcoin", "litecoin", "darkcoin" or "mastercoin"
   * @param {string} walletSelected origin of the wallet to withdraw from, can be "trading", "exchange", or "deposit"
   * @param {number} amount amount to withdraw
   * @param {string} address destination address for withdrawal
   */
  withdraw (withdrawType, walletSelected, amount, address, cb) {
    return this.make_request('withdraw', {
      withdrawType,
      walletSelected,
      amount,
      address
    }, cb)
  }

  /**
   * POST /v1/transfer
   *
   * @param {number} amount amount to transfer
   * @param {string} currency currency of funds to transfer
   * @param {string} walletFrom wallet to transfer from
   * @param {string} walletTo wallet to transfer to
   */
  transfer (amount, currency, walletFrom, walletTo, cb) {
    return this.make_request('transfer', {
      amount,
      currency,
      walletFrom,
      walletTo
    }, cb)
  }
}

module.exports = RESTv1
