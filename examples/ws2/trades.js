'use strict'

const { debug } = require('../util/setup')
const WSv2 = require('../../lib/transports/ws2')

async function execute () {
  const ws = new WSv2({
    transform: true
  })
  ws.on('error', e => debug('WSv2 error: %s', e.message | e))
  await ws.open()

  const market = 'tBTCUSD'

  if (market[0] === 't') {
    ws.onTradeEntry({ symbol: market }, (trade) => {
      debug('trade on %s: %s', market, trade.toString())
    })
  } else {
    ws.onFundingTradeEntry({ symbol: market }, (trade) => {
      debug('funding trade: %s', trade.toString())
    })
  }

  ws.onAccountTradeEntry({ symbol: market }, (trade) => {
    debug('account trade: %s', trade.toString())
  })

  await ws.subscribeTrades(market)
}

execute()
