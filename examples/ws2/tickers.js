'use strict'

const { debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    transform: true
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  ws.onTicker({ symbol: 'tETHUSD' }, (ticker) => {
    debug('ETH/USD ticker: %j', ticker.toJS())
  })

  ws.onTicker({ symbol: 'fUSD' }, (ticker) => {
    debug('fUSD ticker: %j', ticker.toJS())
  })

  await ws.subscribeTicker('tETHUSD')
  await ws.subscribeTicker('fUSD')
  await ws.close()
}

execute()
