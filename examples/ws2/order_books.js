'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_order_books')
const bfx = require('../bfx')

const ws = bfx.ws(2, {
  manageOrderBooks: true, // tell the ws client to maintain full sorted OBs
  transform: true // auto-transform array OBs to OrderBook objects
})

ws.on('error', (err) => {
  debug('error: %j', err)
})

ws.on('open', () => {
  debug('open')
  ws.subscribeOrderBook('tBTCUSD')
})

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
})

ws.open()
