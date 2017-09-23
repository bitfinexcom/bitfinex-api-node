const rp = require('request-promise')
const crypto = require('crypto')
const BASE_TIMEOUT = 15000

function passThrough (d) { return d }

class Rest2 {
  constructor (key, secret, opts = {}) {
    this.url = 'https://api.bitfinex.com/'
    this.version = 'v2'
    this.key = key
    this.secret = secret
    this.nonce = Date.now()
    this.generateNonce = (typeof opts.nonceGenerator === 'function')
      ? opts.nonceGenerator
      : function () {
        // noinspection JSPotentiallyInvalidUsageOfThis
        return ++this.nonce
      }

    this.transformer = opts.transformer || passThrough
  }

  genericCallback (err, result) {
    console.log(err, result)
  }

  makeAuthRequest (path, payload = {}, cb = this.genericCallback) {
    if (!this.key || !this.secret) {
      return cb(new Error('missing api key or secret'))
    }

    if (arguments.length !== 3) {
      return cb(
        new Error(
          'argument length invalid: request must have a path, payload and cb'
        )
      )
    }

    const url = `${this.url}/${this.version}/${path}`
    const nonce = JSON.stringify(this.generateNonce())
    const rawBody = JSON.stringify(payload)

    let signature = `/api/${this.version}${path}${nonce}${rawBody}`

    signature = crypto
      .createHmac('sha384', this.secret)
      .update(signature)
      .digest('hex')

    return rp({
      url,
      method: 'POST',
      headers: {
        'bfx-nonce': nonce,
        'bfx-apikey': this.key,
        'bfx-signature': signature
      },
      body: payload,
      json: true
    })
    .then((response) => cb(null, response))
    .catch((error) => {
      if (error.error[1] === 10114) {
        error.message = error.message +
        ' see https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }

      cb(new Error(error))
    })
  }

  makePublicRequest (name, cb = this.genericCallback.bind(this)) {
    const url = `${this.url}/${this.version}/${name}`
    return rp({
      url,
      method: 'GET',
      timeout: BASE_TIMEOUT,
      json: true
    })
    .then((response) => {
      this.transform(response, name, cb)
    })
    .catch((error) => cb(new Error(error)))
  }

  transform (result, name, cb) {
    let n = {}

    if (this.transformer.normalize) {
      n = this.transformer.normalize(name)
    }

    result = this.transformer(result, n.type, n.symbol)
    cb(null, result)
  }

  // Public endpoints

  ticker (symbol = 'tBTCUSD', cb) {
    return this.makePublicRequest(`ticker/${symbol}`, cb)
  }

  tickers (cb) {
    return this.makePublicRequest(`tickers`, cb)
  }

  stats (key = 'pos.size:1m:tBTCUSD:long', context = 'hist', cb) {
    return this.makePublicRequest(`stats1/${key}/${context}`, cb)
  }

  // timeframes: '1m', '5m', '15m', '30m', '1h', '3h', '6h', '12h', '1D', '7D', '14D', '1M'
  // sections: 'last', 'hist'
  // note: query params can be added: see
  // http://docs.bitfinex.com/v2/reference#rest-public-candles
  candles ({timeframe = '1m', symbol = 'tBTCUSD', section = 'hist'}, cb) {
    return this.makePublicRequest(`candles/trade:${timeframe}:${symbol}/${section}`, cb)
  }

  // Auth endpoints
  alertList (type = 'price', cb) {
    return this.makeAuthRequest('/auth/r/alerts', { type }, cb)
  }

  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0) {
    return this.makeAuthRequest(`/auth/w/alert/set`, {type, symbol, price})
  }

  alertDelete (symbol = 'tBTCUSD', price = 0) {
    return this.makeAuthRequest(`/auth/w/alert/set`, {symbol, price})
  }

  trades (symbol = 'tBTCUSD', start = null, end = null, limit = null, cb) {
    return this.makeAuthRequest(`/auth/r/trades/${symbol}/hist`, {start, end, limit}, cb)
  }

  // TODO
  // - Wallets
  // - Orders
  // - Order Trades
  // - Positions
  // - Offers
  // - Margin Info
  // - Funding Info
  // - Performance
  // - Calc Available Balance
}

module.exports = Rest2
