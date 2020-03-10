'use strict'

const SocksProxyAgent = require('socks-proxy-agent')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')

const validArg = v => _isString(v) && !_isEmpty(v)

/**
 * Grabs RESTv2/WSv2 constructor arguments from the environment, configuring
 * the api credentials, connection agent, and connection URL
 *
 * @param {string?} urlKey - name of env var holding the connection URL
 * @returns {object} envArgs
 */
module.exports = (urlKey) => {
  const { API_KEY, API_SECRET, SOCKS_PROXY_URL } = process.env
  const URL = process.env[urlKey]
  const agent = validArg(SOCKS_PROXY_URL) && new SocksProxyAgent(SOCKS_PROXY_URL)
  const envArgs = {}

  if (agent) envArgs.agent = agent
  if (validArg(URL)) envArgs.url = URL
  if (validArg(API_KEY)) envArgs.apiKey = API_KEY
  if (validArg(API_SECRET)) envArgs.apiSecret = API_SECRET

  return envArgs
}
