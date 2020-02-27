'use strict'

const Promise = require('bluebird')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'cancel-all-orders',
  ws: { env: true, connect: true, transform: true }
}, async ({ ws, debug }) => {
  debug('awaiting order snapshot...')

  const [snapshot] = await Promise.all([
    new Promise((resolve) => (ws.onOrderSnapshot({}, resolve))),
    ws.auth()
  ])

  if (snapshot.length === 0) {
    debug('no orders to cancel')
    await ws.close()
    return
  }

  debug('received snapshot (%d orders)', snapshot.length)
  debug('')
  snapshot.forEach(o => debug('%s', o.toString()))
  debug('')
  debug('cancelling all..')

  const confirmations = await ws.cancelOrders(snapshot)

  debug(
    'done! cancelled the following order IDs: %s',
    confirmations.map(o => o[0]).join(', ')
  )

  await ws.close()
})
