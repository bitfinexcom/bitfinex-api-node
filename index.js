'use strict'

/**
 * A Node.JS reference implementation of the Bitfinex API
 *
 * @module bitfinex-api-node
 * @license MIT
 * @example <caption>sending an order & tracking status</caption>
 * const ws = bfx.ws()
 *
 * ws.on('error', (err) => console.log(err))
 * ws.on('open', ws.auth.bind(ws))
 *
 * ws.once('auth', () => {
 *   const o = new Order({
 *     cid: Date.now(),
 *     symbol: 'tETHUSD',
 *     amount: 0.1,
 *     type: Order.type.MARKET
 *   }, ws)
 *
 *   // Enable automatic updates
 *   o.registerListeners()
 *
 *   o.on('update', () => {
 *     console.log(`order updated: ${o.serialize()}`)
 *   })
 *
 *   o.on('close', () => {
 *     console.log(`order closed: ${o.status}`)
 *     ws.close()
 *   })
 *
 *   o.submit().then(() => {
 *     console.log(`submitted order ${o.id}`)
 *   }).catch((err) => {
 *     console.error(err)
 *     ws.close()
 *   })
 * })
 *
 * ws.open()
 *
 * @example <caption>cancel all open orders</caption>
 * const ws = bfx.ws(2)
 *
 * ws.on('error', (err) => console.log(err))
 * ws.on('open', ws.auth.bind(ws))
 *
 * ws.onOrderSnapshot({}, (orders) => {
 *   if (orders.length === 0) {
 *     console.log('no open orders')
 *     return
 *   }
 *
 *   console.log(`recv ${orders.length} open orders`)
 *
 *   ws.cancelOrders(orders).then(() => {
 *     console.log('cancelled orders')
 *   })
 * })
 *
 * ws.open()
 *
 * @example <caption>subscribe to trades by pair</caption>
 * const ws = bfx.ws(2)
 *
 * ws.on('error', (err) => console.log(err))
 * ws.on('open', () => {
 *   ws.subscribeTrades('BTCUSD')
 * })
 *
 * ws.onTrades({ symbol: 'tBTCUSD' }, (trades) => {
 *   console.log(`trades: ${JSON.stringify(trades)}`)
 * })
 * ws.onTradeEntry({ symbol: 'tBTCUSD' }, (trades) => {
 *   console.log(`te: ${JSON.stringify(trades)}`)
 * })
 *
 * ws.open()
 */

const { RESTv1, RESTv2 } = require('bfx-api-node-rest')
const WSv1 = require('bfx-api-node-ws1')
const WSv2 = require('./lib/ws2')
const WS2Manager = require('./lib/ws2_manager')
const ClientManager = require('./lib/client_manager')

module.exports = ClientManager
module.exports.RESTv1 = RESTv1
module.exports.RESTv2 = RESTv2
module.exports.WSv1 = WSv1
module.exports.WSv2 = WSv2
module.exports.WS2Manager = WS2Manager
