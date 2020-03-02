'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-cancel-all-buffered',
  ws: {
    env: true,
    connect: true,
    auth: true,
    transform: true,
    orderOpBufferDelay: 250
  }
}, async ({ ws, debug }) => {
  ws.onOrderSnapshot({}, async (snapshot) => {
    if (snapshot.length === 0) {
      debug('no orders to cancel')
      return
    }

    debug('canceling %d orders', snapshot.length)

    await ws.cancelOrders(snapshot)
    debug('cancelled all orders')
  })
})
