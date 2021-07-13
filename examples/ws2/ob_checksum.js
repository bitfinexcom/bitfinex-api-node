'use strict'

const { debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

const SYMBOL = 'tXRPBTC'
const PRECISION = 'P0'
const LENGTH = '25'

async function execute () {
  const ws = new WSv2({
    transform: true,
    manageOrderbooks: true // managed OBs are verified against incoming checksums
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  ws.onOrderBookChecksum({
    symbol: SYMBOL,
    prec: PRECISION,
    len: LENGTH
  }, cs => {
    debug('recv valid cs for %s:%s:%s %d', SYMBOL, PRECISION, LENGTH, cs)
  })

  await ws.enableFlag(WSv2.flags.CHECKSUM)
  await ws.subscribeOrderBook(SYMBOL, PRECISION, LENGTH)
}

execute()
