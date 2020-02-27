'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-tickers',
  ws: { env: true, connect: true, transform: true }
}, async ({ ws, debug }) => {
  ws.onTicker({ symbol: 'tETHUSD' }, (ticker) => {
    debug('ETH/USD ticker: %j', ticker.toJS())
  })

  ws.onTicker({ symbol: 'fUSD' }, (ticker) => {
    debug('fUSD ticker: %j', ticker.toJS())
  })

  await ws.subscribeTicker('tETHUSD')
  await ws.subscribeTicker('fUSD')
})
