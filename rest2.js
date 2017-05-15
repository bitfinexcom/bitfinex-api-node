const rp = require('request-promise')
const crypto = require('crypto')
const BASE_TIMEOUT = 15000

class Rest2 {
  constructor (key, secret, nonceGenerator) {
    this.url = 'https://api.bitfinex.com/'
    this.version = 'v2'
    this.key = key
    this.secret = secret
    this.nonce = new Date().getTime()
    this.generateNonce = (typeof nonceGenerator === 'function')
      ? nonceGenerator
      : function () {
        // noinspection JSPotentiallyInvalidUsageOfThis
        return ++this.nonce
      }
  }

  genericCallback (err, result) {
    console.log(err, result)
  }

  makeAuthRequest (path, payload = {}, cb = this.genericCallback) {
    if (!this.key || !this.secret) {
      return cb(new Error('missing api key or secret'))
    }
    const url = `${this.url}/${this.version}/${path}`
    const nonce = JSON.stringify(this.generateNonce())
    const rawBody = JSON.stringify(payload)

    const signature = crypto
      .createHmac('sha384', this.secret)
      .update(`/api/${url}${nonce}${rawBody}`)
      .digest('hex')

    return rp({
      url,
      method: 'POST',
      headers: {
        'bfx-nonce': nonce,
        'bfx-apikey': this.key,
        'bfx-signature': signature
      },
      json: payload
    })
    .then((response) => cb(null, JSON.parse(response)))
    .catch((error) => cb(new Error(error)))
  }

  makePublicRequest (name, cb = this.genericCallback) {
    const url = `${this.url}/${this.version}/${name}`
    return rp({
      url,
      method: 'GET',
      timeout: BASE_TIMEOUT
    })
    .then((response) => cb(null, JSON.parse(response)))
    .catch((error) => cb(new Error(error)))
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
    return this.makePublicRequest(`stats1/trade:${timeframe}:${symbol}/${section}`, cb)
  }

  // TODO
  // - Trades
  // - Books

  // Auth endpoints

  alertList (type = 'price', cb) {
    return this.makeAuthRequest(`/auth/r/alerts?type=${type}`, null, cb)
  }

  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0) {
    return this.makeAuthRequest(`/auth/w/alert/set`, {type, symbol, price})
  }

  alertDelete (symbol = 'tBTCUSD', price = 0) {
    return this.makeAuthRequest(`/auth/w/alert/set`, {symbol, price})
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
