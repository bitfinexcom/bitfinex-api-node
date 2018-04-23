'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_ob_checksum')
const bfx = require('../bfx')
const WSv2 = require('../../lib/transports/ws2')

const SYMBOL = 'tBTCUSD'
const PRECISION = 'R0'
const LENGTH = '100'

const ws = bfx.ws(2, {
  manageOrderBooks: true // managed OBs are verified against incoming checksums
})

// catch checksum mis-matches
ws.on('error', err => {
  debug('error %s:%s:%s %s', SYMBOL, PRECISION, LENGTH, err.message)
})

ws.on('open', () => {
  debug('open')

  ws.enableFlag(WSv2.flags.CHECKSUM)
  ws.subscribeOrderBook(SYMBOL, PRECISION, LENGTH)
})

ws.onOrderBookChecksum({
  symbol: SYMBOL,
  prec: PRECISION,
  len: LENGTH
}, cs => {
  debug('recv valid cs for %s:%s:%s %d', SYMBOL, PRECISION, LENGTH, cs)
})

ws.open()
