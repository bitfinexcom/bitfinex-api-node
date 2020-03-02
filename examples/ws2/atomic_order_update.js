'use strict'

const { Order } = require('bfx-api-node-models')
const runExample = require('../util/run_example')

const SYMBOL = 'tBTCUSD'

module.exports = runExample({
  name: 'ws2-atomic-order-update',
  ws: {
    env: true,
    transform: true,
    manageOrderBooks: true,

    packetWDDelay: 10 * 1000,
    autoReconnect: true,
    seqAudit: true,

    connect: true,
    auth: true
  }
}, async ({ ws, debug }) => {
  const orderSent = false

  await ws.subscribeOrderBook(SYMBOL, 'P0', '25')
  debug('subscribed to order book %s:P0:25', SYMBOL)

  ws.onOrderBook({ symbol: SYMBOL }, async (ob) => {
    const topBidL = ob.topBidLevel()

    if (topBidL === null || orderSent) {
      return
    }

    debug('taking out price level: %j', topBidL)

    const o = new Order({
      symbol: SYMBOL,
      type: Order.type.EXCHANGE_LIMIT,
      price: topBidL[0],
      amount: topBidL[2] * -1.1 // sell through top bid
    }, ws)

    debug('submitting: %s', o.toString())

    o.registerListeners()
    await o.submit()

    debug('order submitted')

    o.once('update', async (o) => {
      debug('got order update: %s', o.status)

      if (!o.isPartiallyFilled()) {
        return
      }

      debug('order is partially filled, amount %f', o.amount)
      debug('increasing amount w/ delta %f', o.amount * 2)

      await o.update({ delta: `${o.amount * 2}` })
      debug('order updated, new amount %f', o.amount)
      debug('setting price to %f', o.price * 1.05)

      await o.update({ price: `${o.price * 1.05}` })
      debug('order updated, new price %f', o.price)
    })
  })
})
