'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_order_history')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

debug('fetching orders...')

const start = Date.now() - (90 * 24 * 60 * 60 * 1000)
const end = Date.now()
const limit = 25

rest.orderHistory('tETHUSD', start, end, limit, (err, orders) => {
  if (err) {
    return debug('error: %s', err.message)
  }

  orders.forEach((order) => {
    debug(
      'order ID %d | %f @ %f | %f filled %s',
      order.id, order.amountOrig, order.price, order.amountOrig - order.amount,
      order.status
    )
  })
}).catch((err) => {
  debug('error: %j', err)
})
