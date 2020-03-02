'use strict'

const Promise = require('bluebird')
const _isEmpty = require('lodash/isEmpty')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'cancel-all-orders',
  ws: { env: true, transform: true }, // no auto-auth so we can grab snapshot
  readline: true,
  params: {
    filterByMarket: null
  }
}, async ({ ws, debug, readline, params }) => {
  await ws.open()

  const { filterByMarket } = params

  debug('awaiting order snapshot...')

  const allOrders = await new Promise((resolve) => {
    ws.onOrderSnapshot({}, resolve)
    return ws.auth()
  })

  if (allOrders.length === 0) {
    return debug('no orders to cancel')
  }

  const orders = _isEmpty(filterByMarket)
    ? allOrders
    : allOrders.filter(o => o.symbol === filterByMarket)

  debug('received snapshot (%d orders)', orders.length)
  debug('')
  orders.forEach(o => debug('%s', o.toString()))
  debug('')

  const confirm = await readline.questionAsync(
    '>  Are you sure you want to close the orders(s) listed above? '
  )

  if (confirm.toLowerCase()[0] !== 'y') {
    return
  }

  debug('')
  debug('cancelling all..')

  const confirmations = await ws.cancelOrders(orders)

  debug(
    'done! cancelled the following order IDs: %s',
    confirmations.map(o => o[0]).join(', ')
  )
})
