/* eslint-disable */

const crypto = require('crypto')
const request = require('request')

function rest (key, secret, opts = {}) {
  this.url = 'https://api.bitfinex.com'
  this.version = 'v1'
  this.key = key
  this.secret = secret
  this.nonce = Date.now()
  this.generateNonce = (typeof opts.nonceGenerator === 'function')
      ? opts.nonceGenerator
      : () => ++this.nonce
}

rest.prototype.make_request = function (path, params, cb) {
  if (!this.key || !this.secret) {
    return cb(new Error('missing api key or secret'))
  }

  const payload = Object.assign({
    request: `/${this.version}/${path}`,
    nonce: JSON.stringify(this.generateNonce())
  }, params)

  const payloadBase64 = new Buffer(JSON.stringify(payload)).toString('base64')
  const signature = crypto
    .createHmac('sha384', this.secret)
    .update(payloadBase64)
    .digest('hex')

  return request({
    url: `${this.url}/${this.version}/${path}`,
    method: 'POST',
    timeout: 15000,
    headers: {
      'X-BFX-APIKEY': this.key,
      'X-BFX-PAYLOAD': payloadBase64,
      'X-BFX-SIGNATURE': signature
    }
  }, (err, response, body) => {
    if (err || (response.statusCode !== 200 && response.statusCode !== 400)) {
      return cb(new Error(err != null ? err : response.statusCode))
    }

    let result

    try {
      result = JSON.parse(body)
    } catch (error) {
      return cb(null, {
        message: body.toString()
      })
    }

    if (result.message != null) {
      if (result.message.indexOf('Nonce is too small') !== -1) {
        result.message += ' See https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }

      return cb(new Error(result.message))
    }

    return cb(null, result)
  })
}

rest.prototype.make_public_request = function (path, cb) {
  return request({
    method: 'GET',
    timeout: 15000,
    url: `${this.url}/${this.version}/${path}`
  }, (err, response, body) => {
    if (err || (response.statusCode !== 200 && response.statusCode !== 400)) {
      return cb(new Error(err != null ? err : response.statusCode))
    }

    let result = {}

    try {
      result = JSON.parse(body)
    } catch (err) {
      return cb(null, {
        message: body.toString()
      })
    }

    // TODO: HTTP error code check?
    if (result.message != null) {
      return cb(new Error(result.message))
    }

    return cb(null, result)
  })
}

rest.prototype.ticker = function (symbol = 'BTCUSD', cb) {
  if (!cb) {
    cb = (err, data) => console.log(data)
  }

  return this.make_public_request(`pubticker/${symbol}`, cb)
}

rest.prototype.today = function (symbol, cb) {
  return this.make_public_request(`today/${symbol}`, cb)
}

rest.prototype.stats = function (symbol, cb) {
  return this.make_public_request(`stats/${symbol}`, cb)
}

// rest.prototype.candles = function (symbol, cb) {
//    return this.make_public_request('candles/' + symbol, cb);
// };

rest.prototype.fundingbook = function (currency, options, cb) {
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

rest.prototype.orderbook = function (symbol, options, cb) {
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

rest.prototype.trades = function (symbol, cb) {
  return this.make_public_request('trades/' + symbol, cb)
}

rest.prototype.lends = function (currency, cb) {
  return this.make_public_request('lends/' + currency, cb)
}

rest.prototype.get_symbols = function (cb) {
  return this.make_public_request('symbols', cb)
}

rest.prototype.symbols_details = function (cb) {
  return this.make_public_request('symbols_details', cb)
}

rest.prototype.new_order = function (symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb) {
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

rest.prototype.multiple_new_orders = function (orders, cb) {
  return this.make_request('order/new/multi', { orders }, cb)
}

rest.prototype.cancel_order = function (order_id, cb) {
  return this.make_request('order/cancel', {
    order_id: parseInt(order_id)
  }, cb)
}

rest.prototype.cancel_all_orders = function (cb) {
  return this.make_request('order/cancel/all', {}, cb)
}

rest.prototype.cancel_multiple_orders = function (order_ids, cb) {
  return this.make_request('order/cancel/multi', {
    order_ids: order_ids.map(id => parseInt(id))
  }, cb)
}

rest.prototype.replace_order = function (order_id, symbol, amount, price, exchange, side, type, cb) {
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
rest.prototype.order_status = function (order_id, cb) {
  return this.make_request('order/status', {
    order_id: parseInt(order_id)
  }, cb)
}

rest.prototype.active_orders = function (cb) {
  return this.make_request('orders', {}, cb)
}

rest.prototype.orders_history = function (cb) {
  return this.make_request('orders/hist', {}, cb)
}

rest.prototype.active_positions = function (cb) {
  return this.make_request('positions', {}, cb)
}

rest.prototype.claim_position = function (position_id, amount, cb) {
  return this.make_request('position/claim', {
    position_id: parseInt(position_id),
    amount
  }, cb)
}

rest.prototype.balance_history = function (currency, options, cb) {
  const params = { currency }

  if (typeof options === 'function') {
    cb = options
  } else if (options && options.constructor.name === 'Object') {
    Object.assign(params, options)
  }

  return this.make_request('history', params, cb)
}

rest.prototype.movements = function (currency, options, cb) {
  const params = { currency }

  if (typeof options === 'function') {
    cb = options
  } else if (options && options.constructor.name === 'Object') {
    Object.assign(params, options)
  }

  return this.make_request('history/movements', params, cb)
}

rest.prototype.past_trades = function (symbol, options, cb) {
  const params = { symbol }

  if (typeof options === 'function') {
    cb = options
  } else if (options && options.constructor.name === 'Object') {
    Object.assign(params, options)
  }

  return this.make_request('mytrades', params, cb)
}

rest.prototype.new_deposit = function (currency, method, wallet_name, cb) {
  return this.make_request('deposit/new', {
    currency,
    method,
    wallet_name
  }, cb)
}

rest.prototype.new_offer = function (currency, amount, rate, period, direction, cb) {
  return this.make_request('offer/new', {
    currency,
    amount,
    rate,
    period,
    direction
  }, cb)
}

rest.prototype.cancel_offer = function (offer_id, cb) {
  return this.make_request('offer/cancel', {
    offer_id: parseInt(offer_id)
  }, cb)
}

rest.prototype.offer_status = function (offer_id, cb) {
  return this.make_request('offer/status', {
    offer_id: parseInt(offer_id)
  }, cb)
}

rest.prototype.active_offers = function (cb) {
  return this.make_request('offers', {}, cb)
}

rest.prototype.active_credits = function (cb) {
  return this.make_request('credits', {}, cb)
}

rest.prototype.wallet_balances = function (cb) {
  return this.make_request('balances', {}, cb)
}

rest.prototype.taken_swaps = function (cb) {
  return this.make_request('taken_funds', {}, cb)
}

rest.prototype.total_taken_swaps = function (cb) {
  return this.make_request('total_taken_funds', {}, cb)
}

rest.prototype.close_swap = function (swap_id, cb) {
  return this.make_request('swap/close', {
    swap_id: parseInt(swap_id)
  }, cb)
}

rest.prototype.account_infos = function (cb) {
  return this.make_request('account_infos', {}, cb)
}

rest.prototype.margin_infos = function (cb) {
  return this.make_request('margin_infos', {}, cb)
}

/**
 * POST /v1/withdraw
 *
 * @param {string} withdraw_type "bitcoin", "litecoin", "darkcoin" or "mastercoin"
 * @param {string} walletselected origin of the wallet to withdraw from, can be "trading", "exchange", or "deposit"
 * @param {number} amount amount to withdraw
 * @param {string} address destination address for withdrawal
 */
rest.prototype.withdraw = function (withdraw_type, walletselected, amount, address, cb) {
  return this.make_request('withdraw', {
    withdraw_type,
    walletselected,
    amount,
    address
  }, cb)
}

/**
 * POST /v1/transfer
 *
 * @param {number} amount amount to transfer
 * @param {string} currency currency of funds to transfer
 * @param {string} walletfrom Wallet to transfer from
 * @param {string} walletto Wallet to transfer to
 */
rest.prototype.transfer = function (amount, currency, walletfrom, walletto, cb) {
  return this.make_request('transfer', {
    amount,
    currency,
    walletfrom,
    walletto
  }, cb)
}

module.exports = rest
