'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-order-books',
  ws: {
    env: true,
    connect: true,
    transform: true, // auto-transform array OBs to OrderBook objects
    manageOrderBooks: true // tell the ws client to maintain full sorted OBs
  }
}, async ({ ws, debug }) => {
  let lastMidPrice = -1
  let midPrice

  // 'ob' is a full OrderBook instance, with sorted arrays 'bids' & 'asks'
  ws.onOrderBook({ symbol: 'tBTCUSD' }, (ob) => {
    midPrice = ob.midPrice()

    if (midPrice !== lastMidPrice) {
      debug(
        'BTCUSD mid price: %d (bid: %d, ask: %d)',
        midPrice, ob.bids[0][0], ob.asks[0][0]
      )
    }

    lastMidPrice = midPrice
  })

  await ws.subscribeOrderBook('tBTCUSD')
})
