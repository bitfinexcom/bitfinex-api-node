'use strict'

const { Order } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

const o = new Order({
  cid: Date.now(),
  symbol: 'tBTCUSD',
  price: 17833.5,
  amount: -0.02,
  type: Order.type.LIMIT,
  tif: '2019-03-08 15:00:00'
})

module.exports = runExample({
  name: 'ws2-order-tif',
  ws: { env: true, connect: true, auth: true, transform: true }
}, async ({ ws, debug }) => {
  o.registerListeners(ws)

  o.on('update', () => debug('updated: %s', o.toString()))
  o.on('close', () => debug('order closed: %s', o.status))

  debug('submitting order %d', o.cid)
  await o.submit()

  debug(
    'got submit confirmation for order %d [%d] [tif: %d]',
    o.cid, o.id, o.mtsTIF
  )
})
