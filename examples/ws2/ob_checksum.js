'use strict'

// process.env.DEBUG = 'bfx:examples:*'
process.env.DEBUG = '*'

const debug = require('debug')('bfx:examples:ws2_ob_checksum')
const bfx = require('../bfx')
const WSv2 = require('../../lib/transports/ws2')

const SYMBOL = 'tBTCUSD'

const ws = bfx.ws(2, {
  manageOrderBooks: true,
  transform: true
})

ws.on('error', (err) => {
  console.error(err)
})

ws.on('open', () => {
  debug('open')

  ws.enableFlag(WSv2.flags.CHECKSUM)
  ws.subscribeOrderBook(SYMBOL, 'P0', '100')
})

ws.onOrderBookChecksum({ symbol: SYMBOL, prec: 'P0', len: '100' }, cs => {
  debug('recv cs for %s:P0:100 - %d', SYMBOL, cs)
})

ws.open()
