const request = require('request')

class Rest2 {
  constructor(key, secret, nonceGenerator) {
    this.url = "https://api.bitfinex.com"
    this.version = 'v2'
    this.key = key
    this.secret = secret
    this.nonce = new Date().getTime()
    this._nonce = typeof nonceGenerator === "function" ? nonceGenerator : function() {
      //noinspection JSPotentiallyInvalidUsageOfThis
      return ++this.nonce
    }
  }
  generic_callback(err, result) {
    console.log(err, result)
  }

  make_request(sub_path, params, cb) {
    if (cb == null) {
      cb = this.generic_callback
    }
    var headers, key, nonce, path, payload, signature, url, value
    if (!this.key || !this.secret) {
      return cb(new Error("missing api key or secret"))
    }
    url = `${this.url}/${this.version}/${sub_path}`
    nonce = JSON.stringify(this._nonce())
    payload = {
      request: path,
      nonce: nonce
    }
    for (key in params) {
      value = params[key]
      payload[key] = value
    }
    payload = new Buffer(JSON.stringify(payload)).toString('base64')
    signature = crypto.createHmac("sha384", this.secret).update(payload).digest('hex')
    headers = {
      'X-BFX-APIKEY': this.key,
      'X-BFX-PAYLOAD': payload,
      'X-BFX-SIGNATURE': signature
    }
    return request({
      url: url,
      method: "POST",
      headers: headers,
      timeout: 15000
    }, function(err, response, body) {
      var error, error1, result
      if (err || (response.statusCode !== 200 && response.statusCode !== 400)) {
        return cb(new Error(err != null ? err : response.statusCode))
      }
      try {
        result = JSON.parse(body)
      } catch (error1) {
        error = error1
        return cb(null, {
          message: body.toString()
        })
      }
      if (result.message != null) {
        return cb(new Error(result.message))
      }
      return cb(null, result)
    })
  }

  make_public_request(sub_path, cb) {
    if (cb == null) {
      cb = this.generic_callback
    }
    url = `${this.url}/${this.version}/${sub_path}`
    return request({
      url: url,
      method: "GET",
      timeout: 15000
    }, function(err, response, body) {
      var error, error1, result
      if (err || (response.statusCode !== 200 && response.statusCode !== 400)) {
        return cb(new Error(err != null ? err : response.statusCode))
      }

      try {
        result = JSON.parse(body)
      } catch (error1) {
        error = error1
        return cb(null, {
          message: body.toString()
        })
      }
      if (result.message != null) {
        return cb(new Error(result.message))
      }
      return cb(null, result)
    })
  }

  ticker(symbol, cb) {
    if (symbol == null || typeof symbol === 'function') {
      symbol = "tBTCUSD"
    }
    if (cb == null) {
      cb = this.generic_callback
    }
    return this.make_public_request('ticker/' + symbol, cb)
  }

  stats(key, context, cb) {
    if (key == null) {
      key = "pos.size:1m:tBTCUSD:long"
    }
    if (context == null) {
      context = 'hist'
    }
    if (cb == null) {
      cb = this.generic_callback
    }
    return this.make_public_request('stats1/' + key + '/' + context, cb)
  }

  candles(key, context, cb) {
    if (key == null) {
      key = "trades:1m:tBTCUSD"
    }
    if (context == null) {
      context = 'hist'
    }
    if (cb == null) {
      cb = this.generic_callback
    }
    return this.make_public_request('stats1/' + key + '/' + context, cb)
  }

}

module.exports = Rest2
