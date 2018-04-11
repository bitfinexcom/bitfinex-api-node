'use strict'

require('dotenv').config()

const BFX = require('../')
const SocksProxyAgent = require('socks-proxy-agent')

const { API_KEY, API_SECRET, REST_URL, WS_URL, SOCKS_PROXY_URL } = process.env
const agent = SOCKS_PROXY_URL ? new SocksProxyAgent(SOCKS_PROXY_URL) : null

/**
 * Generates a new bfx instance with the provided key/secret pair. Useful for
 * logic that requires multiple connections (maker/taker pairs, etc)
 *
 * @param {string} apiKey
 * @param {string} apiSecret
 * @return {BFX} bfx
 */
const genBFX = (apiKey = API_KEY, apiSecret = API_SECRET) => {
  return new BFX({
    apiKey,
    apiSecret,

    ws: {
      url: WS_URL,
      agent
    },

    rest: {
      url: REST_URL,
      agent
    }
  })
}

// export a default instance with the key/secret pulled from env
module.exports = genBFX()

module.exports.genBFX = genBFX
