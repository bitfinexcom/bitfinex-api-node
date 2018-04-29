'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:update_order')
const { Order } = require('../../lib/models')
const bfx = require('../bfx')
const ws = bfx.ws(2, {
  transform: true,
  manageOrderBooks: true,

  packetWDDelay: 10 * 1000,
  autoReconnect: true,
  seqAudit: true
})

const SYMBOL = 'tBTCUSD'

ws.on('open', () => {
  debug('open')
  ws.auth()
})

ws.on('auth', () => {
  debug('auth')

  ws.subscribeOrderBook(SYMBOL, 'P0', '25')
  debug('subscribed to order book %s:P0:25', SYMBOL)
})

let orderSent = false

ws.onOrderBook({ symbol: SYMBOL }, (ob) => {
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

  o.registerListeners()
  o.submit().then(() => debug('order submitted'))
  o.once('update', (o) => {
    debug('got order update: %s', o.status)

    if (o.isPartiallyFilled()) {
      debug('order is partially filled, amount %f', o.amount)
      debug('increasing amount w/ delta %f', o.amount * 2)

      o.update({ delta: `${o.amount * 2}` }).then(() => {
        debug('order updated, new amount %f', o.amount)
        debug('setting price to %f', o.price * 1.05)

        o.update({ price: `${o.price * 1.05}` }).then(() => {
          debug('order updated, new price %f', o.price)

          debug('closing connection')
          ws.close()
        })
      })
    }
  })

  orderSent = true
})

ws.open()
