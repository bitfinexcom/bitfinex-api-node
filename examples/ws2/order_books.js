'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_order_books')
const bfx = require('../bfx')

const SYMBOL = 'tBTCUSD'

const ws = bfx.ws(2, {
  manageOrderBooks: true, // tell the ws client to maintain full sorted OBs
  transform: true // auto-transform array OBs to OrderBook objects
})

ws.on('error', (err) => {
  console.error(err)
})

ws.on('open', () => {
  debug('open')
  ws.subscribeOrderBook(SYMBOL, 'P0', '100')
})

// 'ob' is a full OrderBook instance, with sorted arrays 'bids' & 'asks'
ws.onOrderBook({ symbol: SYMBOL }, (ob) => {
  console.log('bids: \n' + ob.bids.map(l => l.join(' | ')).join('\n'))
  console.log('asks: \n' + ob.asks.map(l => l.join(' | ')).join('\n'))
  console.log('')
})

ws.open()
