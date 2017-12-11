'use strict'

require('dotenv').config()

const BFX = require('../')
const SocksProxyAgent = require('socks-proxy-agent')

const { API_KEY, API_SECRET, WS_URI, SOCKS_PROXY_URL } = process.env

const bfx = new BFX({
  apiKey: API_KEY,
  apiSecret: API_SECRET,

  ws: {
    url: WS_URI,
    agent: SOCKS_PROXY_URL ? new SocksProxyAgent(SOCKS_PROXY_URL) : null
  }
})

module.exports = bfx
