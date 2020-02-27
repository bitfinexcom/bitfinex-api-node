'use strict'

const WSv2 = require('../../lib/transports/ws2')
const runExample = require('../util/run_example')

const SYMBOL = 'tXRPBTC'
const PRECISION = 'P0'
const LENGTH = '25'

module.exports = runExample({
  name: 'ws2-ob-checksum',
  ws: {
    env: true,
    connect: true,
    transform: true,
    manageOrderbooks: true // managed OBs are verified against incoming checksums
  }
}, async ({ ws, debug }) => {
  ws.onOrderBookChecksum({
    symbol: SYMBOL,
    prec: PRECISION,
    len: LENGTH
  }, cs => {
    debug('recv valid cs for %s:%s:%s %d', SYMBOL, PRECISION, LENGTH, cs)
  })

  await ws.enableFlag(WSv2.flags.CHECKSUM)
  await ws.subscribeOrderBook(SYMBOL, PRECISION, LENGTH)
})
