'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'ws2-oc-multi',
  ws: { env: true, connect: true, auth: true }
}, async ({ ws, debug }) => {
  ws.onFundingTradeEntry({ symbol: 'fUSD' }, (trade) => {
    debug('fte: %j', trade)
  })

  ws.onFundingTradeUpdate({ symbol: 'fUSD' }, (trade) => {
    debug('ftu: %j', trade)
  })

  ws.onTradeEntry({ symbol: 'tEOSUSD' }, (trade) => {
    debug('te: %j', trade)
  })

  ws.onTrades({ symbol: 'tEOSUSD' }, (trades) => {
    debug('tEOSUSD trades: %j', trades)
  })

  ws.onTrades({ symbol: 'fUSD' }, (trades) => {
    debug('fUSD trades: %j', trades)
  })

  ws.onAccountTradeEntry({ symbol: 'tEOSUSD' }, (trade) => {
    debug('account te: %j', trade)
  })

  ws.onAccountTradeUpdate({ symbol: 'tEOSUSD' }, (trade) => {
    debug('account tu: %j', trade)
  })

  await ws.subscribeTrades('tEOSUSD')
  await ws.subscribeTrades('fUSD')
})
