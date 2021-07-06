'use strict'

const { args: { apiKey, apiSecret }, debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    apiKey,
    apiSecret,
    transform: true, // auto-transform array OBs to OrderBook objects
    manageOrderBooks: true // tell the ws client to maintain full sorted OBs
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

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
}

execute()
