'use strict'

/**
 * The official {@link https://bitfinex.com|Bitfinex} Node.JS API library,
 * providing clients for the RESTv1, RESTv2, WSv1, and WSv2 APIs. While the
 * WSv2 API client is implemented here, the others are re-exported from their
 * respective packages to provide a unified interface to all Bitfinex APIs.
 *
 * @category API Client
 * @module bitfinex-api-node
 */

const { RESTv1, RESTv2 } = require('bfx-api-node-rest')
const WSv1 = require('bfx-api-node-ws1')
const WSv2 = require('./lib/transports/ws2')
const WS2Manager = require('./lib/ws2_manager')
const ClientManager = require('./lib/client_manager')

module.exports = ClientManager
module.exports.RESTv1 = RESTv1
module.exports.RESTv2 = RESTv2
module.exports.WSv1 = WSv1
module.exports.WSv2 = WSv2
module.exports.WS2Manager = WS2Manager
