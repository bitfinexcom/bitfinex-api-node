'use strict'

require('dotenv').config()

const SocksProxyAgent = require('socks-proxy-agent')

const { API_KEY, API_SECRET, REST_URL, WS_URL, SOCKS_PROXY_URL } = process.env
const agent = SOCKS_PROXY_URL ? new SocksProxyAgent(SOCKS_PROXY_URL) : null

module.exports = {
  apiKey: API_KEY,
  apiSecret: API_SECRET,
  restURL: REST_URL,
  wsURL: WS_URL,
  agent,
}
