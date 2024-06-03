'use strict'

const _isEmpty = require('lodash/isEmpty')
const { args: { apiKey, apiSecret }, debug, readline } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    transform: true
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  const filterByMarket = null

  debug('awaiting order snapshot...')

  const allOrders = await new Promise((resolve) => {
    ws.onOrderSnapshot({}, resolve)
    return ws.auth()
  })

  if (allOrders.length === 0) {
    debug('no orders to cancel')
    await ws.close()
    readline.close()
    return
  }

  const orders = (!filterByMarket)
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
  await ws.close()
  readline.close()
}

execute()
