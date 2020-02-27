'use strict'

const Promise = require('bluebird')
const { Order } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

// Build new order
const o = new Order({
  cid: Date.now(),
  symbol: 'tBTCUSD',
  price: 589.10,
  amount: -0.02,
  type: Order.type.EXCHANGE_LIMIT
})

module.exports = runExample({
  name: 'ws2-orders',
  ws: { env: true, connect: true, auth: true, transform: true }
}, async ({ ws, debug }) => {
  let orderClosed = false

  // Enable automatic updates
  o.registerListeners(ws)

  o.on('update', () => debug('updated: %s', o.toString()))
  o.on('close', () => {
    debug('order closed: %s', o.status)
    orderClosed = true
  })

  debug('submitting order %d', o.cid)

  await o.submit()

  debug('got submit confirmation for order %d [%d]', o.cid, o.id)

  // wait a bit...
  await new Promise(resolve => setTimeout(resolve, 2000))

  if (orderClosed) return ws.close()

  debug('canceling...')
  o.cancel()
  debug('got cancel confirmation for order %d', o.cid)

  return ws.close()
})
